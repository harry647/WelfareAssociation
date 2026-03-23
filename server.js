/**
 * SWA Website Server
 * Express server with PostgreSQL backend
 */

require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const crypto = require('crypto');
const fs = require('fs');

const { connectDB, sequelize } = require('./backend/config/database');
const setupRoutes = require('./backend/routes');

// Automatic initialization on first run
const INITIALIZED_FLAG = path.join(__dirname, '.initialized');

/**
 * Generate cryptographically secure key
 */
function generateSecureKey(length, prefix) {
    const bytes = crypto.randomBytes(length);
    const key = bytes.toString('hex');
    return prefix ? `${prefix}-${key}` : key;
}

/**
 * Initialize security keys
 */
async function initializeKeys() {
    const envFile = path.join(__dirname, '.env');
    let envVars = {};
    
    // Read existing .env
    try {
        if (fs.existsSync(envFile)) {
            const content = fs.readFileSync(envFile, 'utf-8');
            content.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    envVars[match[1].trim()] = match[2].trim();
                }
            });
        }
    } catch (error) {
        console.warn('Could not read existing .env file:', error.message);
    }
    
    // Generate new keys if not present
    let updated = false;
    const newKeys = {};
    
    if (!envVars.JWT_SECRET) {
        newKeys.JWT_SECRET = generateSecureKey(32, 'SWA');
        updated = true;
        console.log('✓ Generated JWT_SECRET');
    }
    
    if (!envVars.JWT_REFRESH_SECRET) {
        newKeys.JWT_REFRESH_SECRET = generateSecureKey(32, 'SWA');
        updated = true;
        console.log('✓ Generated JWT_REFRESH_SECRET');
    }
    
    if (!envVars.API_KEY) {
        newKeys.API_KEY = generateSecureKey(64, 'SWA-API');
        updated = true;
        console.log('✓ Generated API_KEY');
    }
    
    if (!envVars.ENCRYPTION_TOKEN) {
        newKeys.ENCRYPTION_TOKEN = generateSecureKey(32, 'SWA-ENC');
        updated = true;
        console.log('✓ Generated ENCRYPTION_TOKEN');
    }
    
    if (updated) {
        // Backup existing .env
        const backupDir = path.join(__dirname, 'backend/backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        if (fs.existsSync(envFile)) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(backupDir, `env-backup-${timestamp}.env`);
            fs.copyFileSync(envFile, backupPath);
            console.log('✓ Backed up existing .env file');
        }
        
        // Update .env file
        const allKeys = { ...envVars, ...newKeys };
        const envContent = Object.entries(allKeys)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
        
        fs.writeFileSync(envFile, envContent, 'utf-8');
        console.log('✓ Security keys initialized and .env file updated');
    } else {
        console.log('✓ Security keys already present');
    }
    
    return true;
}

/**
 * Initialize database (create if not exists, sync models)
 */
async function initializeDatabase() {
    const { Sequelize } = require('sequelize');
    
    const env = process.env.NODE_ENV || 'development';
    const postgresUri = process.env[`POSTGRES_URI_${env.toUpperCase()}`] || 
                       process.env.DATABASE_URL || 
                       process.env.POSTGRES_URI_DEV;
    
    if (!postgresUri) {
        throw new Error('PostgreSQL URI not configured');
    }
    
    // Parse URI
    const match = postgresUri.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!match) {
        throw new Error('Invalid PostgreSQL URI format');
    }
    
    const creds = {
        user: match[1],
        password: match[2],
        host: match[3],
        port: parseInt(match[4]),
        database: match[5]
    };
    
    // Connect to postgres default database to create our target database
    const adminSequelize = new Sequelize('postgres://', {
        host: creds.host,
        port: creds.port,
        user: creds.user,
        password: creds.password,
        dialect: 'postgres',
        logging: false
    });
    
    try {
        const [results] = await adminSequelize.query(
            `SELECT 1 FROM pg_database WHERE datname = '${creds.database}'`
        );
        
        if (!results || results.length === 0) {
            await adminSequelize.query(`CREATE DATABASE ${creds.database}`);
            console.log(`✓ Created database: ${creds.database}`);
        } else {
            console.log(`✓ Database already exists: ${creds.database}`);
        }
    } catch (error) {
        if (!error.message.includes('already exists')) {
            console.warn('Database creation warning:', error.message);
        }
    } finally {
        await adminSequelize.close();
    }
    
    // Load models and sync
    require('./backend/models');
    
    // Sync models with alter mode (safe)
    await sequelize.sync({ alter: true });
    console.log('✓ Database models synced');
    
    return true;
}

/**
 * Check and rotate keys if needed
 */
async function checkKeyRotation() {
    const envFile = path.join(__dirname, '.env');
    let envVars = {};
    
    try {
        if (fs.existsSync(envFile)) {
            const content = fs.readFileSync(envFile, 'utf-8');
            content.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    envVars[match[1].trim()] = match[2].trim();
                }
            });
        }
    } catch (error) {
        console.warn('Could not read .env file:', error.message);
    }
    
    const lastRotation = envVars.LAST_KEY_ROTATION;
    const rotationDays = parseInt(process.env.KEY_ROTATION_DAYS) || 30;
    
    if (lastRotation) {
        const daysSinceRotation = Math.floor(
            (new Date() - new Date(lastRotation)) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceRotation >= rotationDays) {
            console.log(`\n⚠ Key rotation due (${daysSinceRotation} days since last rotation)`);
            console.log('Run: npm run rotate:keys');
        }
    }
    
    return true;
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://www.w3schools.com", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            connectSrc: ["'self'"],
            frameSrc: ["'self'"]
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Serve static files from root directory
app.use(express.static(__dirname));

// API Routes
setupRoutes(app);

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Connect to PostgreSQL and start server
const startServer = async () => {
    try {
        // Run initialization on first start
        const isFirstRun = !fs.existsSync(INITIALIZED_FLAG);
        
        if (isFirstRun) {
            console.log('\n========================================');
            console.log('First Run Initialization');
            console.log('========================================\n');
            
            // Initialize security keys
            console.log('Initializing security keys...');
            await initializeKeys();
            
            // Initialize database
            console.log('\nInitializing database...');
            await initializeDatabase();
            
            // Create initialized flag
            fs.writeFileSync(INITIALIZED_FLAG, new Date().toISOString());
            
            console.log('\n✓ Initialization complete!');
        } else {
            // Check key rotation on subsequent runs
            await checkKeyRotation();
        }
        
        // Connect to PostgreSQL
        await connectDB();
        
        // Start server
        app.listen(PORT, () => {
            console.log(`\n========================================`);
            console.log(`🚀 Server running at http://localhost:${PORT}`);
            console.log(`📚 API available at http://localhost:${PORT}/api`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`========================================\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;

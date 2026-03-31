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
const bcrypt = require('bcryptjs');

const { connectDB, sequelize, pool } = require('./backend/config/database');
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
    let originalLines = [];
    
    // Read existing .env
    try {
        if (fs.existsSync(envFile)) {
            const content = fs.readFileSync(envFile, 'utf-8');
            originalLines = content.split('\n');
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
        
        // Update .env file while preserving comments and structure
        let newEnvContent = '';
        const keysToUpdate = { ...envVars, ...newKeys };
        
        // Rebuild the file, updating existing keys and adding new ones
        const existingKeys = new Set();
        
        // Process original lines
        originalLines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('#') || trimmed === '') {
                // Preserve comments and blank lines
                newEnvContent += line + '\n';
            } else {
                const match = trimmed.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    existingKeys.add(key);
                    if (keysToUpdate[key]) {
                        newEnvContent += `${key}=${keysToUpdate[key]}\n`;
                        delete keysToUpdate[key];
                    } else {
                        newEnvContent += line + '\n';
                    }
                } else {
                    newEnvContent += line + '\n';
                }
            }
        });
        
        // Add any remaining new keys
        Object.entries(keysToUpdate).forEach(([key, value]) => {
            newEnvContent += `${key}=${value}\n`;
        });
        
        fs.writeFileSync(envFile, newEnvContent, 'utf-8');
        console.log('✓ Security keys initialized and .env file updated');
    } else {
        console.log('✓ Security keys already present');
    }
    
    return true;
}

/**
 * Initialize database - sync models (tables) if they don't exist
 */
async function initializeDatabase() {
    console.log('✓ Loading database models...');
    
    // Load all models
    require('./backend/models');
    console.log('✓ Database models loaded');
    
    // Sync models - creates tables if they don't exist
    try {
        console.log('✓ Syncing database schema...');
        await sequelize.sync({ alter: true }); // true = update existing tables
        console.log('✓ Database schema synced');
    } catch (error) {
        console.warn('Database sync warning:', error.message);
    }
    
    // Run migrations on every start to ensure schema consistency
    await runDatabaseMigrations();
    
    return true;
}

/**
 * Run database migrations to ensure schema consistency
 * Adds missing columns/tables that are defined in models but not in database
 */
async function runDatabaseMigrations() {
    const { runAllMigrations } = require('./backend/migrations');
    
    try {
        const success = await runAllMigrations();
        return success;
    } catch (error) {
        console.warn('Migration warning:', error.message);
        return false;
    }
}

/**
 * Create admin user on first run if not exists
 */
async function createAdminUser() {
    const User = require('./backend/models/User');
    
    try {
        // Check if admin exists
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@swa.org';
        const existingAdmin = await User.findOne({ where: { email: adminEmail } });
        
        if (!existingAdmin) {
            const adminPassword = process.env.ADMIN_PASSWORD || 'SWAAdmin2024!';
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            
            await User.create({
                email: adminEmail,
                password: hashedPassword,
                firstName: 'Admin',
                lastName: 'User',
                phone: process.env.ADMIN_PHONE || '+254700000000',
                role: 'admin',
                status: 'active'
            });
            
            console.log('✓ Admin user created');
            console.log(`   Email: ${adminEmail}`);
            console.log(`   Password: ${adminPassword}`);
        } else {
            console.log('✓ Admin user already exists');
        }
    } catch (error) {
        console.warn('Admin creation warning:', error.message);
    }
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
            scriptSrcElem: ["'self'", "'unsafe-inline'", "https://www.w3schools.com", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "http://localhost:3000", "https://cdnjs.cloudflare.com"],
            formAction: ["'self'"],
            frameSrc: ["'self'", "https://www.google.com"]
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

// Prevent caching for protected pages
app.use((req, res, next) => {
    // Check if requesting HTML pages in protected directories
    if (req.url.includes('/pages/dashboard/') || 
        req.url.includes('/pages/loans/') ||
        req.url.includes('/pages/payments/') ||
        req.url.includes('/pages/contributions/') ||
        req.url.includes('/pages/breavement/') ||
        req.url.includes('/pages/reports/')) {
        // Set no-cache headers
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
    }
    next();
});

// Page Editor template route - serves the editor with dynamic page info
// IMPORTANT: This must come BEFORE the static file serving
app.get('/pages/dashboard/admin/page-editor.html', (req, res) => {
    const pagePath = req.query.page || '';
    const pageName = pagePath.split('/').pop().replace('.html', '');
    
    // Read the template file
    const templatePath = path.join(__dirname, 'pages/dashboard/admin/page-editor.html');
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Replace template variables
    template = template.replace(/<%= pagePath %>/g, pagePath);
    template = template.replace(/<%= pageName %>/g, pageName);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(template);
});

// Serve static files from root directory
app.use(express.static(__dirname));

// API Routes
setupRoutes(app);

// Page Editor template route - serves the editor with dynamic page info
app.get('/pages/dashboard/admin/page-editor.html', (req, res) => {
    const pagePath = req.query.page || '';
    const pageName = pagePath.split('/').pop().replace('.html', '');
    
    // Read the template file
    const templatePath = path.join(__dirname, 'pages/dashboard/admin/page-editor.html');
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Replace template variables
    template = template.replace(/<%= pagePath %>/g, pagePath);
    template = template.replace(/<%= pageName %>/g, pageName);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(template);
});

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
            
            // Initialize database (sync tables only, don't create DB)
            console.log('\nInitializing database...');
            await initializeDatabase();
            
            // Create admin user
            console.log('\nCreating admin user...');
            await createAdminUser();
            
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

/**
 * Application Initialization Script
 * 
 * This script:
 * 1. Initializes security keys (if not already set)
 * 2. Creates PostgreSQL database if it doesn't exist
 * 3. Syncs all models with proper schemas, relationships, and constraints
 * 
 * Usage: node backend/scripts/init-app.js
 */

const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config();

// Logger setup
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, `app-init-${new Date().toISOString().split('T')[0]}.log`);

function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        data
    };
    const logLine = JSON.stringify(logEntry) + '\n';
    
    const prefix = {
        info: '\x1b[36mINFO\x1b[0m',
        warn: '\x1b[33mWARN\x1b[0m',
        error: '\x1b[31mERROR\x1b[0m',
        success: '\x1b[32mSUCCESS\x1b[0m'
    };
    
    const consoleMsg = `${prefix[level] || prefix.info} [${timestamp}] ${message}`;
    if (data) {
        console.log(consoleMsg, data);
    } else {
        console.log(consoleMsg);
    }
    
    try {
        fs.appendFileSync(logFile, logLine);
    } catch (error) {
        console.error('Failed to write to log file:', error.message);
    }
}

/**
 * Parse PostgreSQL URI
 */
function parsePostgresUri(uri) {
    const match = uri.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!match) {
        throw new Error('Invalid PostgreSQL URI format');
    }
    return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: parseInt(match[4]),
        database: match[5]
    };
}

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
    log('info', 'Initializing security keys');
    
    const envFile = path.join(__dirname, '../../.env');
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
        log('warn', 'Could not read existing .env file', { error: error.message });
    }
    
    // Generate new keys if not present
    let updated = false;
    const newKeys = {};
    
    if (!envVars.JWT_SECRET) {
        newKeys.JWT_SECRET = generateSecureKey(32, 'SWA');
        updated = true;
        log('info', 'Generated JWT_SECRET');
    }
    
    if (!envVars.JWT_REFRESH_SECRET) {
        newKeys.JWT_REFRESH_SECRET = generateSecureKey(32, 'SWA');
        updated = true;
        log('info', 'Generated JWT_REFRESH_SECRET');
    }
    
    if (!envVars.API_KEY) {
        newKeys.API_KEY = generateSecureKey(64, 'SWA-API');
        updated = true;
        log('info', 'Generated API_KEY');
    }
    
    if (!envVars.ENCRYPTION_TOKEN) {
        newKeys.ENCRYPTION_TOKEN = generateSecureKey(32, 'SWA-ENC');
        updated = true;
        log('info', 'Generated ENCRYPTION_TOKEN');
    }
    
    if (updated) {
        // Backup existing .env
        const backupDir = path.join(__dirname, '../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        if (fs.existsSync(envFile)) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(backupDir, `env-backup-${timestamp}.env`);
            fs.copyFileSync(envFile, backupPath);
            log('info', 'Backed up existing .env file', { backupPath });
        }
        
        // Update .env file
        const allKeys = { ...envVars, ...newKeys };
        const envContent = Object.entries(allKeys)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
        
        fs.writeFileSync(envFile, envContent, 'utf-8');
        log('success', 'Security keys initialized and .env file updated');
    } else {
        log('info', 'Security keys already present, skipping');
    }
    
    return true;
}

/**
 * Create database if not exists
 */
async function createDatabase() {
    log('info', 'Creating database if not exists');
    
    const env = process.env.NODE_ENV || 'development';
    const postgresUri = process.env[`POSTGRES_URI_${env.toUpperCase()}`] || 
                       process.env.DATABASE_URL || 
                       process.env.POSTGRES_URI_DEV;
    
    if (!postgresUri) {
        throw new Error('PostgreSQL URI not configured');
    }
    
    const creds = parsePostgresUri(postgresUri);
    const targetDb = creds.database;
    
    // Connect to postgres default database
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
            `SELECT 1 FROM pg_database WHERE datname = '${targetDb}'`
        );
        
        if (!results || results.length === 0) {
            await adminSequelize.query(`CREATE DATABASE ${targetDb}`);
            log('success', `Database "${targetDb}" created`);
        } else {
            log('info', `Database "${targetDb}" already exists`);
        }
    } catch (error) {
        if (error.message.includes('already exists')) {
            log('info', `Database "${targetDb}" already exists`);
        } else {
            throw error;
        }
    } finally {
        await adminSequelize.close();
    }
    
    return true;
}

/**
 * Sync database models
 */
async function syncDatabase() {
    log('info', 'Syncing database models');
    
    const env = process.env.NODE_ENV || 'development';
    const postgresUri = process.env[`POSTGRES_URI_${env.toUpperCase()}`] || 
                       process.env.DATABASE_URL || 
                       process.env.POSTGRES_URI_DEV;
    
    const sequelize = new Sequelize(postgresUri, {
        dialect: 'postgres',
        logging: (msg) => log('debug', msg),
        pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
        define: { timestamps: true, underscored: true }
    });
    
    try {
        await sequelize.authenticate();
        log('info', 'Database connection established');
        
        // Load models (this triggers model definitions)
        require('../models');
        
        // Sync models
        const force = process.env.FORCE_SYNC === 'true';
        await sequelize.sync({ force: force });
        
        log('success', 'Database models synced successfully');
        
        // Create indexes
        await createIndexes(sequelize);
        
        // Create constraints
        await createConstraints(sequelize);
        
        return true;
    } catch (error) {
        log('error', 'Database sync failed', { error: error.message });
        throw error;
    } finally {
        await sequelize.close();
    }
}

/**
 * Create database indexes
 */
async function createIndexes(sequelize) {
    log('info', 'Creating database indexes');
    
    const indexes = [
        { table: 'users', name: 'idx_users_email', columns: ['email'], unique: true },
        { table: 'users', name: 'idx_users_role', columns: ['role'] },
        { table: 'members', name: 'idx_members_user_id', columns: ['user_id'], unique: true },
        { table: 'members', name: 'idx_members_membership_number', columns: ['membership_number'], unique: true },
        { table: 'members', name: 'idx_members_status', columns: ['status'] },
        { table: 'loans', name: 'idx_loans_member_id', columns: ['member_id'] },
        { table: 'loans', name: 'idx_loans_status', columns: ['status'] },
        { table: 'contributions', name: 'idx_contributions_member_id', columns: ['member_id'] },
        { table: 'contributions', name: 'idx_contributions_date', columns: ['contribution_date'] },
        { table: 'payments', name: 'idx_payments_member_id', columns: ['member_id'] },
        { table: 'payments', name: 'idx_payments_loan_id', columns: ['loan_id'] },
        { table: 'savings', name: 'idx_savings_member_id', columns: ['member_id'] },
        { table: 'fines', name: 'idx_fines_member_id', columns: ['member_id'] },
        { table: 'fines', name: 'idx_fines_status', columns: ['status'] },
        { table: 'debts', name: 'idx_debts_member_id', columns: ['member_id'] },
        { table: 'events', name: 'idx_events_status', columns: ['status'] },
        { table: 'events', name: 'idx_events_date', columns: ['event_date'] },
        { table: 'news', name: 'idx_news_category', columns: ['category'] },
        { table: 'announcements', name: 'idx_announcements_type', columns: ['type'] },
        { table: 'documents', name: 'idx_documents_category', columns: ['category'] },
        { table: 'volunteers', name: 'idx_volunteers_status', columns: ['status'] },
        { table: 'contacts', name: 'idx_contacts_status', columns: ['status'] },
        { table: 'newsletters', name: 'idx_newsletters_email', columns: ['email'], unique: true }
    ];
    
    for (const idx of indexes) {
        try {
            await sequelize.query(`
                CREATE INDEX IF NOT EXISTS ${idx.name} 
                ON ${idx.table} (${idx.columns.join(', ')})
            `);
        } catch (error) {
            if (!error.message.includes('already exists')) {
                log('warn', `Failed to create index ${idx.name}`, { error: error.message });
            }
        }
    }
    
    log('success', 'Database indexes created');
}

/**
 * Create database constraints
 */
async function createConstraints(sequelize) {
    log('info', 'Creating database constraints');
    
    const constraints = [
        { name: 'loan_amount_positive', sql: `ALTER TABLE loans ADD CONSTRAINT loan_amount_positive CHECK (amount > 0)` },
        { name: 'contribution_amount_positive', sql: `ALTER TABLE contributions ADD CONSTRAINT contribution_amount_positive CHECK (amount > 0)` },
        { name: 'payment_amount_positive', sql: `ALTER TABLE payments ADD CONSTRAINT payment_amount_positive CHECK (amount > 0)` },
        { name: 'fine_amount_positive', sql: `ALTER TABLE fines ADD CONSTRAINT fine_amount_positive CHECK (amount >= 0)` },
        { name: 'savings_amount_positive', sql: `ALTER TABLE savings ADD CONSTRAINT savings_amount_positive CHECK (amount >= 0)` },
        { name: 'debt_amount_positive', sql: `ALTER TABLE debts ADD CONSTRAINT debt_amount_positive CHECK (amount > 0)` }
    ];
    
    for (const constraint of constraints) {
        try {
            await sequelize.query(constraint.sql);
        } catch (error) {
            if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
                log('warn', `Failed to create constraint ${constraint.name}`, { error: error.message });
            }
        }
    }
    
    log('success', 'Database constraints created');
}

/**
 * Main initialization function
 */
async function main() {
    console.log('\n========================================');
    console.log('Application Initialization');
    console.log('========================================\n');
    
    const startTime = Date.now();
    
    try {
        // Step 1: Initialize keys
        log('info', 'Step 1/3: Initializing security keys');
        await initializeKeys();
        
        // Step 2: Create database
        log('info', 'Step 2/3: Creating database');
        await createDatabase();
        
        // Step 3: Sync models
        log('info', 'Step 3/3: Syncing database models');
        await syncDatabase();
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n========================================');
        console.log(`Initialization completed in ${duration}s`);
        console.log('========================================\n');
        
        process.exit(0);
    } catch (error) {
        log('error', 'Initialization failed', { error: error.message, stack: error.stack });
        
        console.error('\n========================================');
        console.error('Initialization FAILED');
        console.error('========================================\n');
        
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { main, initializeKeys, createDatabase, syncDatabase };

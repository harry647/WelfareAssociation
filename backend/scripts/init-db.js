/**
 * PostgreSQL Database Initialization Script
 * 
 * This script:
 * 1. Connects to PostgreSQL and creates the database if it doesn't exist
 * 2. Syncs all models with proper schemas, relationships, and constraints
 * 3. Creates indexes for performance optimization
 * 4. Sets up proper logging
 * 
 * Usage: node backend/scripts/init-db.js
 */

const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import sequelize from database config
const { sequelize } = require('../config/database');

// Logger setup
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, `db-init-${new Date().toISOString().split('T')[0]}.log`);

function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        data
    };
    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Console output
    const consoleMsg = `[${timestamp}] [${level.toUpperCase()}] ${message}${data ? ' - ' + JSON.stringify(data) : ''}`;
    if (level === 'error') {
        console.error(consoleMsg);
    } else if (level === 'warn') {
        console.warn(consoleMsg);
    } else {
        console.log(consoleMsg);
    }
    
    // File output
    fs.appendFileSync(logFile, logLine);
}

/**
 * Extract database credentials from PostgreSQL URI
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
 * Connect to PostgreSQL and create database if it doesn't exist
 */
async function createDatabaseIfNotExists() {
    const env = process.env.NODE_ENV || 'development';
    const dbName = process.env[`POSTGRES_DB_${env.toUpperCase()}`] || 'swa_database';
    const postgresUri = process.env.POSTGRES_URI_DEV || process.env.DATABASE_URL;
    
    if (!postgresUri) {
        throw new Error('PostgreSQL URI not configured. Please set POSTGRES_URI_DEV or DATABASE_URL in .env');
    }
    
    // Parse the URI to get connection details
    const creds = parsePostgresUri(postgresUri);
    const targetDb = creds.database;
    
    log('info', 'Connecting to PostgreSQL server', { host: creds.host, port: creds.port, database: targetDb });
    
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
        // Check if database exists
        const [results] = await adminSequelize.query(
            `SELECT 1 FROM pg_database WHERE datname = '${targetDb}'`,
            { type: Sequelize.QueryTypes.SELECT }
        );
        
        if (!results) {
            log('info', `Creating database: ${targetDb}`);
            await adminSequelize.query(`CREATE DATABASE ${targetDb}`, { 
                raw: true,
                type: Sequelize.QueryTypes.CREATE
            });
            log('info', `Database "${targetDb}" created successfully`);
        } else {
            log('info', `Database "${targetDb}" already exists`);
        }
    } catch (error) {
        // Database might already exist (race condition)
        if (error.message.includes('already exists')) {
            log('info', `Database "${targetDb}" already exists`);
        } else {
            throw error;
        }
    } finally {
        await adminSequelize.close();
    }
    
    return targetDb;
}

/**
 * Initialize database connection and sync models
 */
async function initializeDatabase() {
    const env = process.env.NODE_ENV || 'development';
    const postgresUri = process.env[`POSTGRES_URI_${env.toUpperCase()}`] || 
                       process.env.DATABASE_URL || 
                       process.env.POSTGRES_URI_DEV;
    
    if (!postgresUri) {
        throw new Error('PostgreSQL URI not configured');
    }
    
    log('info', 'Initializing database connection', { env, uri: postgresUri.substring(0, 30) + '...' });
    
    const sequelize = new Sequelize(postgresUri, {
        dialect: 'postgres',
        logging: (msg) => log('debug', msg),
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true
        }
    });
    
    // Test connection
    try {
        await sequelize.authenticate();
        log('info', 'Database connection established successfully');
    } catch (error) {
        log('error', 'Unable to connect to database', { error: error.message });
        throw error;
    }
    
    return sequelize;
}

/**
 * Sync all models with database
 */
async function syncModels(sequelize) {
    const force = process.env.FORCE_SYNC === 'true';
    const alter = process.env.ALTER_SYNC === 'true';
    
    log('info', 'Loading models');
    
    // Import all models - this loads all the model definitions
    // The models are already defined with the sequelize instance from database.js
    const models = require('../models');
    // Ensure associations are established
    // The model associations are already defined in models/index.js
    
    log('info', 'Models loaded successfully');
    
    // Sync strategy - use alter by default for safety, force only when explicitly requested
    const syncOptions = {
        force: force,
        alter: alter || (!force) // Default to alter mode for safety
    };
    
    log('info', 'Syncing models with database', syncOptions);
    
    try {
        // Sync with database
        await sequelize.sync(syncOptions);
        log('info', 'Models synced successfully');
        
        // Create indexes for performance
        await createIndexes(sequelize);
        
        // Create custom constraints
        await createConstraints(sequelize);
        
        log('info', 'Database initialization completed successfully');
        
    } catch (error) {
        log('error', 'Error syncing models', { error: error.message, stack: error.stack });
        throw error;
    }
}

/**
 * Create performance indexes
 */
async function createIndexes(sequelize) {
    log('info', 'Creating database indexes');
    
    const indexes = [
        // Users indexes
        { table: 'users', name: 'idx_users_email', columns: ['email'], unique: true },
        { table: 'users', name: 'idx_users_role', columns: ['role'] },
        
        // Members indexes
        { table: 'members', name: 'idx_members_user_id', columns: ['user_id'], unique: true },
        { table: 'members', name: 'idx_members_membership_number', columns: ['membership_number'], unique: true },
        { table: 'members', name: 'idx_members_status', columns: ['status'] },
        
        // Loans indexes
        { table: 'loans', name: 'idx_loans_member_id', columns: ['member_id'] },
        { table: 'loans', name: 'idx_loans_status', columns: ['status'] },
        { table: 'loans', name: 'idx_loans_type', columns: ['loan_type'] },
        
        // Contributions indexes
        { table: 'contributions', name: 'idx_contributions_member_id', columns: ['member_id'] },
        { table: 'contributions', name: 'idx_contributions_type', columns: ['contribution_type'] },
        { table: 'contributions', name: 'idx_contributions_date', columns: ['contribution_date'] },
        
        // Payments indexes
        { table: 'payments', name: 'idx_payments_member_id', columns: ['member_id'] },
        { table: 'payments', name: 'idx_payments_loan_id', columns: ['loan_id'] },
        { table: 'payments', name: 'idx_payments_status', columns: ['status'] },
        
        // Savings indexes
        { table: 'savings', name: 'idx_savings_member_id', columns: ['member_id'] },
        { table: 'savings', name: 'idx_savings_type', columns: ['savings_type'] },
        
        // Fines indexes
        { table: 'fines', name: 'idx_fines_member_id', columns: ['member_id'] },
        { table: 'fines', name: 'idx_fines_status', columns: ['status'] },
        
        // Debts indexes
        { table: 'debts', name: 'idx_debts_member_id', columns: ['member_id'] },
        { table: 'debts', name: 'idx_debts_status', columns: ['status'] },
        
        // Events indexes
        { table: 'events', name: 'idx_events_status', columns: ['status'] },
        { table: 'events', name: 'idx_events_date', columns: ['event_date'] },
        
        // News indexes
        { table: 'news', name: 'idx_news_category', columns: ['category'] },
        { table: 'news', name: 'idx_news_status', columns: ['status'] },
        
        // Notices indexes
        { table: 'notices', name: 'idx_notices_type', columns: ['notice_type'] },
        { table: 'notices', name: 'idx_notices_status', columns: ['status'] },
        
        // Bereavement indexes
        { table: 'bereavements', name: 'idx_bereavements_status', columns: ['status'] },
        
        // Announcements indexes
        { table: 'announcements', name: 'idx_announcements_type', columns: ['type'] },
        { table: 'announcements', name: 'idx_announcements_target', columns: ['target_audience'] },
        
        // Documents indexes
        { table: 'documents', name: 'idx_documents_category', columns: ['category'] },
        { table: 'documents', name: 'idx_documents_visibility', columns: ['visibility'] },
        
        // Reports indexes
        { table: 'reports', name: 'idx_reports_type', columns: ['type'] },
        { table: 'reports', name: 'idx_reports_status', columns: ['status'] },
        
        // Volunteers indexes
        { table: 'volunteers', name: 'idx_volunteers_member_id', columns: ['member_id'] },
        { table: 'volunteers', name: 'idx_volunteers_area', columns: ['area'] },
        { table: 'volunteers', name: 'idx_volunteers_status', columns: ['status'] },
        
        // FAQs indexes
        { table: 'faqs', name: 'idx_faqs_category', columns: ['category'] },
        
        // Policies indexes
        { table: 'policies', name: 'idx_policies_category', columns: ['category'] },
        { table: 'policies', name: 'idx_policies_status', columns: ['status'] },
        
        // Gallery indexes
        { table: 'galleries', name: 'idx_galleries_category', columns: ['category'] },
        { table: 'galleries', name: 'idx_galleries_event_id', columns: ['event_id'] },
        
        // Contacts indexes
        { table: 'contacts', name: 'idx_contacts_status', columns: ['status'] },
        { table: 'contacts', name: 'idx_contacts_category', columns: ['category'] },
        
        // Newsletter indexes
        { table: 'newsletters', name: 'idx_newsletters_email', columns: ['email'], unique: true }
    ];
    
    try {
        for (const idx of indexes) {
            try {
                await sequelize.query(`
                    CREATE INDEX IF NOT EXISTS ${idx.name} 
                    ON ${idx.table} (${idx.columns.join(', ')})
                `, { type: Sequelize.QueryTypes.RAW });
            } catch (error) {
                // Index might already exist
                if (!error.message.includes('already exists')) {
                    log('warn', `Failed to create index ${idx.name}`, { error: error.message });
                }
            }
        }
        log('info', 'Database indexes created successfully');
    } catch (error) {
        log('error', 'Error creating indexes', { error: error.message });
    }
}

/**
 * Create custom database constraints
 */
async function createConstraints(sequelize) {
    log('info', 'Creating database constraints');
    
    const constraints = [
        // Ensure membership number is unique
        {
            name: 'unique_membership_number',
            sql: `ALTER TABLE members ADD CONSTRAINT unique_membership_number UNIQUE (membership_number)`
        },
        // Ensure email is unique in users
        {
            name: 'unique_user_email',
            sql: `ALTER TABLE users ADD CONSTRAINT unique_user_email UNIQUE (email)`
        },
        // Ensure email is unique in newsletters
        {
            name: 'unique_newsletter_email',
            sql: `ALTER TABLE newsletters ADD CONSTRAINT unique_newsletter_email UNIQUE (email)`
        },
        // Loan amount constraints
        {
            name: 'loan_amount_positive',
            sql: `ALTER TABLE loans ADD CONSTRAINT loan_amount_positive CHECK (amount > 0)`
        },
        // Contribution amount constraints
        {
            name: 'contribution_amount_positive',
            sql: `ALTER TABLE contributions ADD CONSTRAINT contribution_amount_positive CHECK (amount > 0)`
        },
        // Payment amount constraints
        {
            name: 'payment_amount_positive',
            sql: `ALTER TABLE payments ADD CONSTRAINT payment_amount_positive CHECK (amount > 0)`
        },
        // Fine amount constraints
        {
            name: 'fine_amount_positive',
            sql: `ALTER TABLE fines ADD CONSTRAINT fine_amount_positive CHECK (amount >= 0)`
        },
        // Savings amount constraints
        {
            name: 'savings_amount_positive',
            sql: `ALTER TABLE savings ADD CONSTRAINT savings_amount_positive CHECK (amount >= 0)`
        },
        // Debt amount constraints
        {
            name: 'debt_amount_positive',
            sql: `ALTER TABLE debts ADD CONSTRAINT debt_amount_positive CHECK (amount > 0)`
        }
    ];
    
    try {
        for (const constraint of constraints) {
            try {
                await sequelize.query(constraint.sql, { type: Sequelize.QueryTypes.RAW });
            } catch (error) {
                // Constraint might already exist
                if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
                    log('warn', `Failed to create constraint ${constraint.name}`, { error: error.message });
                }
            }
        }
        log('info', 'Database constraints created successfully');
    } catch (error) {
        log('error', 'Error creating constraints', { error: error.message });
    }
}

/**
 * Main initialization function
 */
async function main() {
    console.log('\n========================================');
    console.log('PostgreSQL Database Initialization');
    console.log('========================================\n');
    
    const startTime = Date.now();
    
    try {
        // Step 1: Create database if not exists
        log('info', 'Step 1/3: Creating database if not exists');
        await createDatabaseIfNotExists();
        
        // Step 2: Initialize database connection
        log('info', 'Step 2/3: Initializing database connection');
        const sequelize = await initializeDatabase();
        
        // Step 3: Sync models
        log('info', 'Step 3/3: Syncing models with database');
        await syncModels(sequelize);
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        log('info', `Database initialization completed in ${duration}s`);
        
        console.log('\n========================================');
        console.log('Database initialized successfully!');
        console.log('========================================\n');
        
        process.exit(0);
    } catch (error) {
        log('error', 'Database initialization failed', { error: error.message, stack: error.stack });
        
        console.error('\n========================================');
        console.error('Database initialization FAILED');
        console.error('========================================\n');
        console.error('Error:', error.message);
        
        process.exit(1);
    }
}

// Export for programmatic use
module.exports = {
    createDatabaseIfNotExists,
    initializeDatabase,
    syncModels,
    createIndexes,
    createConstraints
};

// Run if called directly
if (require.main === module) {
    main();
}

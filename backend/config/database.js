/**
 * PostgreSQL Database Connection
 * Handles connection to PostgreSQL using pg Pool
 * Supports both local PostgreSQL and cloud PostgreSQL providers
 */

const { Pool } = require('pg');
const { Sequelize } = require('sequelize');

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Get connection string
const getConnectionString = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const connectionString = isProduction
        ? process.env.POSTGRES_URI_PROD
        : process.env.POSTGRES_URI_DEV || process.env.POSTGRES_URI;
    
    console.log(`Database connection mode: ${isProduction ? 'production' : 'development'}`);
    console.log(`Connection string available: ${!!connectionString}`);
    
    return connectionString;
};

const connectionString = getConnectionString();

// Create Sequelize instance for ORM (models use this)
let sequelize, pool, connectDB;

if (!connectionString) {
    console.warn('⚠️  No database connection string available. Using SQLite fallback for development.');
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './database.sqlite',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        define: {
            timestamps: true,
            underscored: true
        }
    });
    
    pool = null;
    connectDB = async () => {
        try {
            await sequelize.authenticate();
            console.log('✅ SQLite Connected successfully');
            return sequelize;
        } catch (error) {
            console.error('❌ SQLite connection failed:', error.message);
            throw error;
        }
    };
} else {
    // Create pg Pool for raw queries
    pool = new Pool({
        connectionString: connectionString,
        ssl: isProduction ? { rejectUnauthorized: false } : false
    });

    // Create Sequelize instance for PostgreSQL
    sequelize = new Sequelize(connectionString, {
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true
        }
    });

    // Log connection info (hide credentials)
    pool.on('connect', () => {
        const env = process.env.NODE_ENV || 'development';
        console.log(`📦 Connected to PostgreSQL (${env} mode)`);
    });

    connectDB = async () => {
        try {
            const env = process.env.NODE_ENV || 'development';
            console.log(`\n📦 Connecting to PostgreSQL (${env} mode)...`);
            
            const connStr = getConnectionString();
            
            if (!connStr || connStr.includes('username:password') || connStr.includes('your_')) {
                console.warn('⚠️  PostgreSQL URI not configured properly!');
                console.warn('Please update POSTGRES_URI_DEV or POSTGRES_URI_PROD in .env file');
                if (isProduction) {
                    process.exit(1);
                }
            } else {
                console.log(`   URI: ${connStr.replace(/\/\/.*:.*@/, '//[credentials_hidden]@')}`);
            }
            
            // Test Sequelize connection
            await sequelize.authenticate();
            console.log(`✅ PostgreSQL Connected successfully`);
            
            return sequelize;
        } catch (error) {
            console.error('❌ PostgreSQL connection failed:', error.message);
            
            if (error.message.includes('ECONNREFUSED')) {
                console.error('   → Is PostgreSQL running locally?');
            } else if (error.message.includes('ETIMEDOUT')) {
                console.error('   → Connection timeout. Check your network and credentials');
            } else if (error.message.includes('authentication failed')) {
                console.error('   → Invalid PostgreSQL username/password');
            } else if (error.message.includes('ENOTFOUND')) {
                console.error('   → Host not found. Check your connection string');
            } else if (error.message.includes('database')) {
                console.error('   → Database does not exist.');
            }
            
            if (isProduction) {
                console.error('🛑 Exiting due to database connection failure in production');
                process.exit(1);
            }
        }
    };
}

module.exports = { sequelize, pool, connectDB };

/**
 * PostgreSQL Database Connection
 * Handles connection to PostgreSQL using Sequelize
 * Supports both local PostgreSQL and cloud PostgreSQL providers
 */

const { Sequelize } = require('sequelize');

/**
 * Get PostgreSQL URI based on environment
 * - Development: Uses local PostgreSQL (POSTGRES_URI_DEV)
 * - Production: Uses cloud PostgreSQL (POSTGRES_URI_PROD)
 */
const getPostgresURI = () => {
    const env = process.env.NODE_ENV || 'development';
    
    if (env === 'production') {
        const prodUri = process.env.POSTGRES_URI_PROD;
        if (!prodUri || prodUri.includes('username:password')) {
            console.warn('⚠️  Production PostgreSQL URI not configured properly!');
            console.warn('Please update POSTGRES_URI_PROD in .env file with your credentials');
        }
        return prodUri;
    }
    
    // Development - use local PostgreSQL
    return process.env.POSTGRES_URI_DEV || process.env.POSTGRES_URI;
};

// Initialize Sequelize
const sequelize = new Sequelize(getPostgresURI(), {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
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

const connectDB = async () => {
    try {
        const postgresUri = getPostgresURI();
        
        // Log which database we're connecting to
        const env = process.env.NODE_ENV || 'development';
        console.log(`\n📦 Connecting to PostgreSQL (${env} mode)...`);
        console.log(`   URI: ${postgresUri.replace(/\/\/.*:.*@/, '//[credentials_hidden]@')}`);
        
        await sequelize.authenticate();
        
        console.log(`✅ PostgreSQL Connected: ${sequelize.config.host}`);
        console.log(`   Database Name: ${sequelize.config.database}`);
        
        // Sync models - commented out to avoid console clutter
        // Uncomment when you need to sync schema changes (add { alter: true } to modify existing tables)
        // if (process.env.NODE_ENV !== 'production') {
        //     console.log('🔄 Syncing models...');
        //     await sequelize.sync({ alter: true });
        //     console.log('✅ Models synced successfully');
        // }
        
        console.log('✓ Database connected and models loaded');
        
        return sequelize;
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
        
        // Detailed error handling
        if (error.message.includes('ECONNREFUSED')) {
            console.error('   → Is PostgreSQL running locally? Start with: pg_ctl start');
        } else if (error.message.includes('ETIMEDOUT')) {
            console.error('   → Connection timeout. Check your network and credentials');
        } else if (error.message.includes('authentication failed')) {
            console.error('   → Invalid PostgreSQL username/password');
        } else if (error.message.includes('database')) {
            console.error('   → Database does not exist. Create it first: createdb swa_db');
        }
        
        // Don't exit in development - allows the server to run for debugging
        if (process.env.NODE_ENV === 'production') {
            console.error('🛑 Exiting due to database connection failure in production');
            process.exit(1);
        }
    }
};

module.exports = { sequelize, connectDB };

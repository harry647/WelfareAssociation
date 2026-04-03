// Set environment variables to force PostgreSQL usage
process.env.POSTGRES_URI_DEV = 'postgresql://postgres:HarryPostgres4656!!@127.0.0.1:5432/swa_db';
process.env.NODE_ENV = 'development';

// Now run the migrations
require('./backend/migrations');

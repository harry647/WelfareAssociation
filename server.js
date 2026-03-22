/**
 * SWA Website Server
 * Express server with MongoDB backend
 */

require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const connectDB = require('./backend/config/database');
const setupRoutes = require('./backend/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
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

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        // Connect to MongoDB
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

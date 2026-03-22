# SWA Website Backend - Complete Implementation Guide

This document contains the complete backend implementation including all code files.

---

# PART 1: PROJECT SETUP

## 1.1 Dependencies (package.json)

```json
{
  "name": "swa-website",
  "version": "1.0.0",
  "description": "SWA Website application with MongoDB backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "keywords": ["swa", "welfare", "association", "mongodb", "express"],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "compression": "^1.7.4"
  }
}
```

## 1.2 Environment Variables (.env)

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/swa_database

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

---

# PART 2: MAIN SERVER

## 2.1 server.js

```javascript
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
```

---

# PART 3: DATABASE CONFIG

## 3.1 backend/config/database.js

```javascript
/**
 * MongoDB Database Connection
 * Handles connection to MongoDB using Mongoose
 */

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database Name: ${conn.connection.name}`);
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });
        
        return conn;
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        // Don't exit in development - allows the server to run for debugging
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

module.exports = connectDB;
```

---

# PART 4: DATABASE MODELS

## 4.1 backend/models/User.js

```javascript
/**
 * User Model
 * Handles user authentication and profile data
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: 50
    },
    phone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['member', 'admin', 'treasurer', 'secretary', 'chairman'],
        default: 'member'
    },
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name virtual
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
```

## 4.2 backend/models/Member.js

```javascript
/**
 * Member Model
 * Handles member profile and membership details
 */

const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    memberNumber: {
        type: String,
        unique: true,
        required: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: 'other'
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    institution: {
        name: String,
        department: String,
        studentId: String,
        admissionYear: Number,
        graduationYear: Number
    },
    employment: {
        company: String,
        position: String,
        department: String
    },
    membershipType: {
        type: String,
        enum: ['student', 'alumni', 'staff', 'honorary'],
        default: 'student'
    },
    membershipStatus: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'archived'],
        default: 'active'
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String,
        email: String
    },
    nextOfKin: {
        name: String,
        relationship: String,
        phone: String,
        address: String
    },
    photo: {
        type: String
    },
    totalContributions: {
        type: Number,
        default: 0
    },
    totalLoans: {
        type: Number,
        default: 0
    },
    totalSavings: {
        type: Number,
        default: 0
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Generate member number before saving
memberSchema.pre('save', async function(next) {
    if (!this.memberNumber) {
        const count = await mongoose.model('Member').countDocuments();
        this.memberNumber = `SWA${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

// Virtual for full name
memberSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

memberSchema.set('toJSON', { virtuals: true });
memberSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Member', memberSchema);
```

## 4.3 backend/models/Loan.js

```javascript
/**
 * Loan Model
 * Handles loan applications and tracking
 */

const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    loanNumber: {
        type: String,
        unique: true,
        required: true
    },
    principalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    interestRate: {
        type: Number,
        default: 10,
        min: 0,
        max: 100
    },
    interestAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    repaymentPeriod: {
        type: Number,
        required: true,
        min: 1,
        max: 60
    },
    monthlyPayment: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'overdue', 'defaulted'],
        default: 'pending'
    },
    applicationDate: {
        type: Date,
        default: Date.now
    },
    approvalDate: {
        type: Date
    },
    disbursementDate: {
        type: Date
    },
    dueDate: {
        type: Date
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    remainingBalance: {
        type: Number,
        default: 0
    },
    nextPaymentDate: {
        type: Date
    },
    penalty: {
        type: Number,
        default: 0
    },
    daysOverdue: {
        type: Number,
        default: 0
    },
    guarantors: [{
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member'
        },
        name: String,
        phone: String,
        amount: Number,
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'rejected'],
            default: 'pending'
        },
        confirmedAt: Date
    }],
    purpose: {
        type: String,
        enum: ['education', 'business', 'emergency', 'personal', 'housing', 'medical', 'other'],
        default: 'personal'
    },
    purposeDescription: String,
    payments: [{
        date: Date,
        amount: Number,
        method: String,
        reference: String,
        status: {
            type: String,
            enum: ['completed', 'pending', 'failed'],
            default: 'completed'
        }
    }],
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectionReason: String,
    adminNotes: String,
    attachments: [{
        name: String,
        url: String,
        type: String,
        uploadedAt: Date
    }]
}, {
    timestamps: true
});

// Generate loan number before saving
loanSchema.pre('save', async function(next) {
    if (!this.loanNumber) {
        const year = new Date().getFullYear();
        const count = await mongoose.model('Loan').countDocuments();
        this.loanNumber = `LN/${year}/${String(count + 1).padStart(4, '0')}`;
    }
    
    if (this.isModified('principalAmount') || this.isModified('repaymentPeriod')) {
        this.interestAmount = (this.principalAmount * this.interestRate) / 100;
        this.totalAmount = this.principalAmount + this.interestAmount;
        this.monthlyPayment = this.totalAmount / this.repaymentPeriod;
        this.remainingBalance = this.totalAmount;
    }
    
    next();
});

module.exports = mongoose.model('Loan', loanSchema);
```

## 4.4 backend/models/Contribution.js

```javascript
/**
 * Contribution Model
 * Handles member contributions/dues
 */

const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    contributionNumber: {
        type: String,
        unique: true,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    type: {
        type: String,
        enum: ['monthly', 'special', 'registration', 'voluntary', 'fine', 'other'],
        default: 'monthly'
    },
    period: {
        month: Number,
        year: Number
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'mpesa', 'bank_transfer', 'cheque', 'online', 'other'],
        default: 'cash'
    },
    paymentReference: String,
    paymentDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    description: String,
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    receipt: {
        type: String
    }
}, {
    timestamps: true
});

// Generate contribution number before saving
contributionSchema.pre('save', async function(next) {
    if (!this.contributionNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const count = await mongoose.model('Contribution').countDocuments();
        this.contributionNumber = `CON/${year}${month}/${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

contributionSchema.index({ member: 1, createdAt: -1 });
contributionSchema.index({ period: 1 });

module.exports = mongoose.model('Contribution', contributionSchema);
```

## 4.5 backend/models/Debt.js

```javascript
/**
 * Debt Model
 * Tracks member debts and outstanding payments
 */

const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    debtNumber: {
        type: String,
        unique: true,
        required: true
    },
    type: {
        type: String,
        enum: ['loan_overdue', 'contribution_arrears', 'fine_unpaid', 'other'],
        default: 'other'
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    dueDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'overdue', 'paid', 'waived'],
        default: 'pending'
    },
    relatedTo: {
        model: String,
        id: mongoose.Schema.Types.ObjectId
    },
    payments: [{
        date: Date,
        amount: Number,
        method: String,
        reference: String
    }],
    paidAmount: {
        type: Number,
        default: 0
    },
    remainingBalance: {
        type: Number,
        default: 0
    },
    remindersSent: [{
        date: Date,
        method: String,
        sentBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    notes: String,
    waivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    waiverReason: String,
    waivedAt: Date
}, {
    timestamps: true
});

// Generate debt number before saving
debtSchema.pre('save', async function(next) {
    if (!this.debtNumber) {
        const count = await mongoose.model('Debt').countDocuments();
        this.debtNumber = `DEBT${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

debtSchema.virtual('daysOverdue').get(function() {
    if (this.status === 'paid' || this.status === 'waived') return 0;
    const now = new Date();
    const due = new Date(this.dueDate);
    if (now > due) {
        return Math.floor((now - due) / (1000 * 60 * 60 * 24));
    }
    return 0;
});

debtSchema.set('toJSON', { virtuals: true });
debtSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Debt', debtSchema);
```

## 4.6 backend/models/Fine.js

```javascript
/**
 * Fine Model
 * Tracks fines issued to members
 */

const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    fineNumber: {
        type: String,
        unique: true,
        required: true
    },
    fineType: {
        name: String,
        category: String,
        code: String
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    dueDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['unpaid', 'paid', 'waived'],
        default: 'unpaid'
    },
    description: String,
    paidDate: Date,
    paymentMethod: String,
    paymentReference: String,
    remindersSent: [{
        date: Date,
        sentBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    waivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    waiverReason: String,
    waivedAt: Date
}, {
    timestamps: true
});

// Generate fine number before saving
fineSchema.pre('save', async function(next) {
    if (!this.fineNumber) {
        const count = await mongoose.model('Fine').countDocuments();
        this.fineNumber = `FINE${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

fineSchema.virtual('daysOverdue').get(function() {
    if (this.status !== 'unpaid') return 0;
    const now = new Date();
    const due = new Date(this.dueDate);
    if (now > due) {
        return Math.floor((now - due) / (1000 * 60 * 60 * 24));
    }
    return 0;
});

fineSchema.set('toJSON', { virtuals: true });
fineSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Fine', fineSchema);
```

## 4.7 backend/models/Savings.js

```javascript
/**
 * Savings Model
 * Tracks member savings goals and withdrawals
 */

const mongoose = require('mongoose');

const savingsSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    goalNumber: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    targetAmount: {
        type: Number,
        required: true,
        min: 0
    },
    currentAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'withdrawn', 'cancelled'],
        default: 'active'
    },
    targetDate: Date,
    transactions: [{
        type: {
            type: String,
            enum: ['deposit', 'withdrawal'],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        method: String,
        reference: String,
        note: String,
        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    completedDate: Date,
    notes: String
}, {
    timestamps: true
});

// Generate goal number before saving
savingsSchema.pre('save', async function(next) {
    if (!this.goalNumber) {
        const count = await mongoose.model('Savings').countDocuments();
        this.goalNumber = `SVG${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

savingsSchema.virtual('progress').get(function() {
    if (this.targetAmount === 0) return 0;
    return Math.min(100, Math.round((this.currentAmount / this.targetAmount) * 100));
});

savingsSchema.set('toJSON', { virtuals: true });
savingsSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Savings', savingsSchema);
```

## 4.8 backend/models/Notice.js

```javascript
/**
 * Notice Model
 * Handles notices and announcements
 */

const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['general', 'important', 'urgent', 'event', 'meeting', 'reminder'],
        default: 'general'
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal'
    },
    audience: {
        type: String,
        enum: ['all', 'members', 'executives', 'students', 'staff'],
        default: 'all'
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    publishDate: Date,
    expiryDate: Date,
    attachments: [{
        name: String,
        url: String,
        type: String
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    views: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

noticeSchema.index({ isPublished: 1, publishDate: -1 });

module.exports = mongoose.model('Notice', noticeSchema);
```

## 4.9 backend/models/Event.js

```javascript
/**
 * Event Model
 * Handles events and activities
 */

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    eventDate: {
        type: Date,
        required: true
    },
    endDate: Date,
    location: {
        venue: String,
        address: String,
        virtual: {
            isVirtual: Boolean,
            meetingLink: String
        }
    },
    type: {
        type: String,
        enum: ['meeting', 'workshop', 'seminar', 'social', 'fundraiser', 'sports', 'other'],
        default: 'other'
    },
    requiresRegistration: {
        type: Boolean,
        default: false
    },
    maxAttendees: Number,
    registeredAttendees: [{
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member'
        },
        registeredAt: Date,
        status: {
            type: String,
            enum: ['registered', 'attended', 'cancelled'],
            default: 'registered'
        }
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'cancelled', 'completed'],
        default: 'draft'
    },
    image: String,
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    attachments: [{
        name: String,
        url: String,
        type: String
    }]
}, {
    timestamps: true
});

eventSchema.index({ eventDate: 1 });
eventSchema.index({ status: 1 });

module.exports = mongoose.model('Event', eventSchema);
```

---

# PART 5: MIDDLEWARE

## 5.1 backend/middleware/auth.js

```javascript
/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate JWT tokens
 */
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    return { accessToken, refreshToken };
};

/**
 * Verify JWT access token
 */
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Authentication middleware - protects routes
 */
const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please log in.'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        
        const user = await User.findById(decoded.userId).populate('memberId');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Please log in again.'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated.'
            });
        }

        req.user = user;
        req.userId = user._id;
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please log in again.',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please log in again.',
                code: 'INVALID_TOKEN'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Authentication error.'
        });
    }
};

/**
 * Role-based authorization middleware
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized to access this route`
            });
        }

        next();
    };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            const user = await User.findById(decoded.userId).populate('memberId');
            
            if (user && user.isActive) {
                req.user = user;
                req.userId = user._id;
            }
        }
        
        next();
    } catch (error) {
        next();
    }
};

module.exports = {
    generateTokens,
    verifyToken,
    auth,
    authorize,
    optionalAuth
};
```

---

# PART 6: API ROUTES

## 6.1 backend/routes/auth.js (Complete)

```javascript
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Member = require('../models/Member');
const { generateTokens, verifyToken, auth } = require('../middleware/auth');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    validate
], async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }
        const user = await User.create({ email, password, firstName, lastName, phone, role: 'member' });
        const member = await Member.create({
            userId: user._id, firstName, lastName, email, phone,
            memberNumber: `SWA${Date.now()}`
        });
        user.memberId = member._id;
        await user.save();
        const { accessToken, refreshToken } = generateTokens(user._id);
        res.status(201).json({
            success: true, message: 'Registration successful',
            token: accessToken, refreshToken,
            user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate
], async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        if (!user.isActive) {
            return res.status(401).json({ success: false, message: 'Account is deactivated' });
        }
        user.lastLogin = new Date();
        await user.save();
        const member = await Member.findById(user.memberId);
        const { accessToken, refreshToken } = generateTokens(user._id);
        res.json({
            success: true, message: 'Login successful',
            token: accessToken, refreshToken,
            user: {
                id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName,
                role: user.role,
                member: member ? { id: member._id, memberNumber: member.memberNumber, firstName: member.firstName, lastName: member.lastName } : null
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

router.post('/logout', auth, async (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token required' });
        }
        const decoded = verifyToken(refreshToken);
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }
        const tokens = generateTokens(user._id);
        res.json({ success: true, ...tokens });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
});

router.get('/profile', auth, async (req, res) => {
    try {
        const user = req.user;
        const member = await Member.findById(user.memberId);
        res.json({
            success: true,
            user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone, role: user.role },
            member
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching profile' });
    }
});

router.put('/profile', auth, [
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('phone').optional().trim(),
    validate
], async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;
        const user = req.user;
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phone) user.phone = phone;
        await user.save();
        if (user.memberId) {
            await Member.findByIdAndUpdate(user.memberId, { ...(firstName && { firstName }), ...(lastName && { lastName }), ...(phone && { phone }) });
        }
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
});

router.post('/change-password', auth, [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
    validate
], async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.userId).select('+password');
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }
        user.password = newPassword;
        await user.save();
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error changing password' });
    }
});

module.exports = router;
```

---

# PART 7: SETUP INSTRUCTIONS

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure .env file (see section 1.2 above)

# 3. Start MongoDB (local installation)
mongod

# 4. Start the server
npm start
```

## Testing the API

```bash
# Health check
curl http://localhost:3000/api/health

# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@swa.com","password":"password123","firstName":"Admin","lastName":"User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@swa.com","password":"password123"}'
```

---

This completes the full backend implementation for the SWA Website with MongoDB.

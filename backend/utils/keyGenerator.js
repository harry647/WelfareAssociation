/**
 * Secure Key Generation Module
 * 
 * This module provides:
 * 1. Cryptographically secure key generation
 * 2. Automatic key rotation with configurable intervals
 * 3. Automatic .env file updates while preserving existing variables
 * 4. Key backup before rotation
 * 5. Comprehensive logging for key generation events
 * 6. Support for JWT secrets, API keys, and encryption tokens
 * 
 * Usage:
 *   - Generate keys once: node backend/utils/keyGenerator.js
 *   - Start rotation scheduler: node backend/utils/keyGenerator.js --schedule
 *   - Force rotation: node backend/utils/keyGenerator.js --rotate
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { parse } = require('dotenv');

// Configuration
const CONFIG = {
    JWT_SECRET_LENGTH: 32,
    API_KEY_LENGTH: 64,
    ENCRYPTION_KEY_LENGTH: 32,
    REFRESH_TOKEN_LENGTH: 32,
    KEY_ROTATION_INTERVAL_DAYS: process.env.KEY_ROTATION_DAYS || 30, // Default: rotate every 30 days
    BACKUP_DIR: path.join(__dirname, '../backups'),
    LOG_DIR: path.join(__dirname, '../logs'),
    ENV_FILE: path.join(__dirname, '../../.env'),
    BACKUP_FILE_PREFIX: 'env-backup-'
};

// Ensure directories exist
function ensureDirectories() {
    if (!fs.existsSync(CONFIG.BACKUP_DIR)) {
        fs.mkdirSync(CONFIG.BACKUP_DIR, { recursive: true });
    }
    if (!fs.existsSync(CONFIG.LOG_DIR)) {
        fs.mkdirSync(CONFIG.LOG_DIR, { recursive: true });
    }
}

/**
 * Logger setup
 */
const logFile = path.join(CONFIG.LOG_DIR, `key-generation-${new Date().toISOString().split('T')[0]}.log`);

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
    const prefix = {
        info: '\x1b[32mINFO\x1b[0m',
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
    
    // File output
    try {
        fs.appendFileSync(logFile, logLine);
    } catch (error) {
        console.error('Failed to write to log file:', error.message);
    }
}

/**
 * Generate cryptographically secure random string
 * @param {number} length - Length of the random string
 * @param {string} prefix - Optional prefix for the key (e.g., 'SWA-')
 * @returns {string} - Secure random string
 */
function generateSecureKey(length = 32, prefix = '') {
    const bytes = crypto.randomBytes(length);
    const key = bytes.toString('hex');
    return prefix ? `${prefix}-${key}` : key;
}

/**
 * Generate JWT secret
 * @returns {string} - JWT secret key
 */
function generateJwtSecret() {
    return generateSecureKey(CONFIG.JWT_SECRET_LENGTH, 'SWA');
}

/**
 * Generate refresh token secret
 * @returns {string} - Refresh token secret
 */
function generateRefreshSecret() {
    return generateSecureKey(CONFIG.REFRESH_TOKEN_LENGTH, 'SWA');
}

/**
 * Generate API key
 * @returns {string} - API key
 */
function generateApiKey() {
    return generateSecureKey(CONFIG.API_KEY_LENGTH, 'SWA-API');
}

/**
 * Generate encryption token
 * @returns {string} - Encryption token
 */
function generateEncryptionToken() {
    return generateSecureKey(CONFIG.ENCRYPTION_KEY_LENGTH, 'SWA-ENC');
}

/**
 * Generate all keys
 * @returns {Object} - Object containing all generated keys
 */
function generateAllKeys() {
    return {
        JWT_SECRET: generateJwtSecret(),
        JWT_REFRESH_SECRET: generateRefreshSecret(),
        API_KEY: generateApiKey(),
        ENCRYPTION_TOKEN: generateEncryptionToken(),
        generatedAt: new Date().toISOString()
    };
}

/**
 * Read existing .env file
 * @returns {Object} - Parsed environment variables
 */
function readEnvFile() {
    try {
        if (fs.existsSync(CONFIG.ENV_FILE)) {
            const content = fs.readFileSync(CONFIG.ENV_FILE, 'utf-8');
            return parse(content);
        }
    } catch (error) {
        log('warn', 'Failed to read existing .env file', { error: error.message });
    }
    return {};
}

/**
 * Create backup of current .env file
 * @returns {string} - Backup file path
 */
function backupEnvFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${CONFIG.BACKUP_FILE_PREFIX}${timestamp}.env`;
    const backupPath = path.join(CONFIG.BACKUP_DIR, backupFileName);
    
    try {
        if (fs.existsSync(CONFIG.ENV_FILE)) {
            fs.copyFileSync(CONFIG.ENV_FILE, backupPath);
            log('info', 'Environment file backed up', { backupPath });
            return backupPath;
        }
    } catch (error) {
        log('error', 'Failed to backup environment file', { error: error.message });
    }
    return null;
}

/**
 * Clean old backups (keep last 10)
 */
function cleanOldBackups() {
    try {
        const files = fs.readdirSync(CONFIG.BACKUP_DIR)
            .filter(f => f.startsWith(CONFIG.BACKUP_FILE_PREFIX))
            .map(f => ({
                name: f,
                path: path.join(CONFIG.BACKUP_DIR, f),
                time: fs.statSync(path.join(CONFIG.BACKUP_DIR, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);
        
        // Keep only last 10 backups
        if (files.length > 10) {
            files.slice(10).forEach(f => {
                fs.unlinkSync(f.path);
                log('info', 'Removed old backup', { file: f.name });
            });
        }
    } catch (error) {
        log('warn', 'Failed to clean old backups', { error: error.message });
    }
}

/**
 * Update .env file with new keys while preserving existing variables
 * @param {Object} newKeys - New keys to add/update
 * @returns {boolean} - Success status
 */
function updateEnvFile(newKeys) {
    try {
        // Read existing environment variables
        const existingEnv = readEnvFile();
        
        // Merge with new keys (new keys take precedence)
        const updatedEnv = {
            ...existingEnv,
            ...newKeys
        };
        
        // Also update rotation timestamp
        updatedEnv.LAST_KEY_ROTATION = new Date().toISOString();
        
        // Generate .env file content
        const envContent = Object.entries(updatedEnv)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
        
        // Write to .env file
        fs.writeFileSync(CONFIG.ENV_FILE, envContent, 'utf-8');
        
        log('success', 'Environment file updated successfully', { 
            keysUpdated: Object.keys(newKeys).length,
            lastRotation: updatedEnv.LAST_KEY_ROTATION
        });
        
        return true;
    } catch (error) {
        log('error', 'Failed to update environment file', { error: error.message });
        return false;
    }
}

/**
 * Check if keys need rotation based on configured interval
 * @returns {boolean} - Whether rotation is needed
 */
function shouldRotateKeys() {
    const env = readEnvFile();
    const lastRotation = env.LAST_KEY_ROTATION;
    
    if (!lastRotation) {
        log('info', 'No previous key rotation found, rotation needed');
        return true;
    }
    
    const daysSinceRotation = Math.floor(
        (new Date() - new Date(lastRotation)) / (1000 * 60 * 60 * 24)
    );
    
    const needsRotation = daysSinceRotation >= CONFIG.KEY_ROTATION_INTERVAL_DAYS;
    
    log('info', 'Checking key rotation status', {
        lastRotation,
        daysSinceRotation,
        rotationIntervalDays: CONFIG.KEY_ROTATION_INTERVAL_DAYS,
        needsRotation
    });
    
    return needsRotation;
}

/**
 * Perform key rotation
 * @param {boolean} force - Force rotation even if not due
 * @returns {Object} - Result of rotation
 */
async function rotateKeys(force = false) {
    log('info', 'Starting key rotation', { force, scheduled: force === false });
    
    // Check if rotation is needed
    if (!force && !shouldRotateKeys()) {
        log('info', 'Key rotation not due yet, skipping');
        return {
            success: false,
            message: 'Key rotation not due yet',
            skipped: true
        };
    }
    
    try {
        // Step 1: Backup current keys
        const backupPath = backupEnvFile();
        
        // Step 2: Generate new keys
        const newKeys = generateAllKeys();
        log('success', 'New keys generated', {
            JWT_SECRET: newKeys.JWT_SECRET.substring(0, 10) + '...',
            JWT_REFRESH_SECRET: newKeys.JWT_REFRESH_SECRET.substring(0, 10) + '...',
            API_KEY: newKeys.API_KEY.substring(0, 10) + '...',
            ENCRYPTION_TOKEN: newKeys.ENCRYPTION_TOKEN.substring(0, 10) + '...'
        });
        
        // Step 3: Update .env file
        const updateSuccess = updateEnvFile(newKeys);
        
        if (!updateSuccess) {
            throw new Error('Failed to update environment file');
        }
        
        // Step 4: Clean old backups
        cleanOldBackups();
        
        log('success', 'Key rotation completed successfully');
        
        return {
            success: true,
            message: 'Keys rotated successfully',
            backupPath,
            keysGenerated: Object.keys(newKeys).filter(k => k !== 'generatedAt')
        };
    } catch (error) {
        log('error', 'Key rotation failed', { error: error.message, stack: error.stack });
        
        return {
            success: false,
            message: 'Key rotation failed',
            error: error.message
        };
    }
}

/**
 * Initialize keys for first time (no rotation)
 * @returns {Object} - Result of initialization
 */
async function initializeKeys() {
    log('info', 'Initializing security keys for first time');
    
    try {
        // Check if keys already exist
        const existingEnv = readEnvFile();
        const hasKeys = existingEnv.JWT_SECRET && existingEnv.JWT_REFRESH_SECRET;
        
        if (hasKeys) {
            log('info', 'Keys already exist, skipping initialization');
            return {
                success: true,
                message: 'Keys already exist',
                skipped: true
            };
        }
        
        // Generate new keys
        const newKeys = generateAllKeys();
        
        // Update .env file
        const updateSuccess = updateEnvFile(newKeys);
        
        if (!updateSuccess) {
            throw new Error('Failed to update environment file');
        }
        
        log('success', 'Security keys initialized successfully');
        
        return {
            success: true,
            message: 'Keys initialized successfully',
            keysGenerated: Object.keys(newKeys).filter(k => k !== 'generatedAt')
        };
    } catch (error) {
        log('error', 'Key initialization failed', { error: error.message });
        
        return {
            success: false,
            message: 'Key initialization failed',
            error: error.message
        };
    }
}

/**
 * Schedule periodic key rotation
 */
function startKeyRotationScheduler() {
    const intervalMs = CONFIG.KEY_ROTATION_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
    
    log('info', 'Starting key rotation scheduler', {
        intervalDays: CONFIG.KEY_ROTATION_INTERVAL_DAYS,
        intervalMs
    });
    
    // Run immediately
    rotateKeys(false);
    
    // Schedule periodic rotation
    setInterval(() => {
        rotateKeys(false);
    }, intervalMs);
}

/**
 * Verify key strength
 * @param {string} key - Key to verify
 * @returns {Object} - Verification result
 */
function verifyKeyStrength(key) {
    const result = {
        valid: true,
        issues: []
    };
    
    if (!key || key.length < 16) {
        result.valid = false;
        result.issues.push('Key is too short (minimum 16 characters)');
    }
    
    if (!/[A-Z]/.test(key)) {
        result.issues.push('Key should contain uppercase letters');
    }
    
    if (!/[0-9]/.test(key)) {
        result.issues.push('Key should contain numbers');
    }
    
    if (!/[^A-Za-z0-9]/.test(key)) {
        result.issues.push('Key should contain special characters');
    }
    
    return result;
}

/**
 * Display current key status
 */
function displayKeyStatus() {
    const env = readEnvFile();
    
    console.log('\n========================================');
    console.log('Key Status');
    console.log('========================================\n');
    
    if (env.JWT_SECRET) {
        const strength = verifyKeyStrength(env.JWT_SECRET);
        console.log(`JWT_SECRET: ${env.JWT_SECRET.substring(0, 15)}... (${strength.valid ? 'Strong' : 'Weak'})`);
    } else {
        console.log('JWT_SECRET: Not configured');
    }
    
    if (env.JWT_REFRESH_SECRET) {
        console.log(`JWT_REFRESH_SECRET: ${env.JWT_REFRESH_SECRET.substring(0, 15)}...`);
    } else {
        console.log('JWT_REFRESH_SECRET: Not configured');
    }
    
    if (env.API_KEY) {
        console.log(`API_KEY: ${env.API_KEY.substring(0, 15)}...`);
    } else {
        console.log('API_KEY: Not configured');
    }
    
    if (env.LAST_KEY_ROTATION) {
        console.log(`\nLast Key Rotation: ${env.LAST_KEY_ROTATION}`);
        const daysSinceRotation = Math.floor(
            (new Date() - new Date(env.LAST_KEY_ROTATION)) / (1000 * 60 * 60 * 24)
        );
        console.log(`Days Since Rotation: ${daysSinceRotation}`);
        console.log(`Next Rotation In: ${Math.max(0, CONFIG.KEY_ROTATION_INTERVAL_DAYS - daysSinceRotation)} days`);
    } else {
        console.log('\nKey Rotation: Never performed');
    }
    
    console.log('\n========================================\n');
}

/**
 * Main function
 */
async function main() {
    ensureDirectories();
    
    console.log('\n========================================');
    console.log('Secure Key Generation Module');
    console.log('========================================\n');
    
    const args = process.argv.slice(2);
    
    if (args.includes('--schedule')) {
        // Start key rotation scheduler
        console.log('Starting key rotation scheduler...\n');
        startKeyRotationScheduler();
    } else if (args.includes('--rotate')) {
        // Force key rotation
        console.log('Forcing key rotation...\n');
        const result = await rotateKeys(true);
        console.log('\nResult:', result);
    } else if (args.includes('--status')) {
        // Display key status
        displayKeyStatus();
    } else if (args.includes('--init')) {
        // Initialize keys for first time
        console.log('Initializing keys...\n');
        const result = await initializeKeys();
        console.log('\nResult:', result);
    } else {
        // Default: Check if rotation needed, rotate if necessary
        console.log('Checking key status...\n');
        displayKeyStatus();
        
        const shouldRotate = shouldRotateKeys();
        if (shouldRotate) {
            console.log('Rotation needed, generating new keys...\n');
            const result = await rotateKeys(false);
            console.log('\nResult:', result);
        } else {
            console.log('No rotation needed at this time.');
        }
    }
}

// Export for programmatic use
module.exports = {
    generateSecureKey,
    generateJwtSecret,
    generateRefreshSecret,
    generateApiKey,
    generateEncryptionToken,
    generateAllKeys,
    rotateKeys,
    initializeKeys,
    shouldRotateKeys,
    verifyKeyStrength,
    startKeyRotationScheduler,
    updateEnvFile,
    backupEnvFile,
    readEnvFile,
    CONFIG
};

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        log('error', 'Unhandled error', { error: error.message, stack: error.stack });
        process.exit(1);
    });
}

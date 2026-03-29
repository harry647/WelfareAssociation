/**
 * Pages Management Routes
 * API endpoints for reading and writing HTML page files
 * Allows admins to edit HTML pages directly
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { auth, authorize } = require('../middleware/auth');

// Base pages directory
const PAGES_DIR = path.join(__dirname, '../../pages');

// Allowed directories for security (prevent directory traversal)
const ALLOWED_DIRS = [
    'public',
    'auth',
    'dashboard/admin',
    'dashboard/member',
    'dashboard/shared',
    'dashboard/components',
    'contributions',
    'loans',
    'payments',
    'breavement',
    'reports',
    'shared'
];

// Validate path to prevent directory traversal attacks
function isValidPath(filePath) {
    const relativePath = path.relative(PAGES_DIR, filePath);
    // Check if the path doesn't go outside the pages directory
    return !relativePath.startsWith('..') && relativePath.length > 0;
}

// Validate that the file is in an allowed directory
function isAllowedDirectory(dirPath) {
    const normalizedDir = path.normalize(dirPath).replace(/\\/g, '/');
    
    // Remove the pages directory prefix to get the relative path
    const pagesDirNormalized = path.normalize(PAGES_DIR).replace(/\\/g, '/');
    let relativePath = normalizedDir;
    
    if (normalizedDir.startsWith(pagesDirNormalized + '/')) {
        relativePath = normalizedDir.substring(pagesDirNormalized.length + 1);
    }
    
    // Now compare the relative path against allowed directories
    for (const allowed of ALLOWED_DIRS) {
        if (relativePath === allowed || relativePath.startsWith(allowed + '/')) {
            return true;
        }
    }
    return false;
}

// Get list of all editable HTML pages
router.get('/', auth, authorize('admin'), async (req, res) => {
    try {
        const pages = [];
        
        // Scan each allowed directory
        for (const dir of ALLOWED_DIRS) {
            const dirPath = path.join(PAGES_DIR, dir);
            
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath);
                
                for (const file of files) {
                    if (file.endsWith('.html')) {
                        const fullPath = path.join(dirPath, file);
                        const stats = fs.statSync(fullPath);
                        
                        pages.push({
                            path: path.join(dir, file).replace(/\\/g, '/'),
                            name: file.replace('.html', ''),
                            directory: dir,
                            lastModified: stats.mtime
                        });
                    }
                }
            }
        }
        
        // Sort by directory then name
        pages.sort((a, b) => {
            if (a.directory !== b.directory) {
                return a.directory.localeCompare(b.directory);
            }
            return a.name.localeCompare(b.name);
        });
        
        res.json({
            success: true,
            data: pages
        });
    } catch (error) {
        console.error('Error fetching pages list:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pages list',
            error: error.message
        });
    }
});

// Get page content (read HTML file)
router.get('/content/*', auth, authorize('admin'), async (req, res) => {
    try {
        // Extract the file path from the URL
        const filePath = req.params[0];
        
        if (!filePath || !filePath.endsWith('.html')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file path. Only HTML files are allowed.'
            });
        }
        
        const fullPath = path.join(PAGES_DIR, filePath);
        
        // Security checks
        if (!isValidPath(fullPath)) {
            return res.status(403).json({
                success: false,
                message: 'Invalid path. Directory traversal not allowed.'
            });
        }
        
        if (!isAllowedDirectory(path.dirname(fullPath))) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. This directory is not editable.'
            });
        }
        
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }
        
        const content = fs.readFileSync(fullPath, 'utf8');
        
        res.json({
            success: true,
            data: {
                path: filePath,
                content: content,
                lastModified: fs.statSync(fullPath).mtime
            }
        });
    } catch (error) {
        console.error('Error reading page:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to read page content',
            error: error.message
        });
    }
});

// Save page content (write HTML file)
router.put('/content/*', auth, authorize('admin'), async (req, res) => {
    try {
        // Extract the file path from the URL
        const filePath = req.params[0];
        const { content, createBackup } = req.body;
        
        if (!filePath || !filePath.endsWith('.html')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file path. Only HTML files are allowed.'
            });
        }
        
        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Content is required'
            });
        }
        
        const fullPath = path.join(PAGES_DIR, filePath);
        
        // Security checks
        if (!isValidPath(fullPath)) {
            return res.status(403).json({
                success: false,
                message: 'Invalid path. Directory traversal not allowed.'
            });
        }
        
        if (!isAllowedDirectory(path.dirname(fullPath))) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. This directory is not editable.'
            });
        }
        
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }
        
        // Create backup if requested
        if (createBackup) {
            const backupDir = path.join(PAGES_DIR, '.backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(backupDir, `${filePath.replace(/[\/\\]/g, '_')}_${timestamp}.bak`);
            
            // Ensure backup directory exists
            const backupDirForFile = path.dirname(backupPath);
            if (!fs.existsSync(backupDirForFile)) {
                fs.mkdirSync(backupDirForFile, { recursive: true });
            }
            
            fs.copyFileSync(fullPath, backupPath);
        }
        
        // Write the new content
        fs.writeFileSync(fullPath, content, 'utf8');
        
        res.json({
            success: true,
            message: 'Page saved successfully',
            data: {
                path: filePath,
                lastModified: fs.statSync(fullPath).mtime
            }
        });
    } catch (error) {
        console.error('Error saving page:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save page content',
            error: error.message
        });
    }
});

// Get backup list for a page
router.get('/backups/*', auth, authorize('admin'), async (req, res) => {
    try {
        const filePath = req.params[0];
        const backupDir = path.join(PAGES_DIR, '.backups');
        
        if (!fs.existsSync(backupDir)) {
            return res.json({
                success: true,
                data: []
            });
        }
        
        const prefix = filePath.replace(/[\/\\]/g, '_');
        const backups = fs.readdirSync(backupDir)
            .filter(f => f.startsWith(prefix))
            .map(f => {
                const fullPath = path.join(backupDir, f);
                const stats = fs.statSync(fullPath);
                return {
                    filename: f,
                    created: stats.birthtime,
                    size: stats.size
                };
            })
            .sort((a, b) => new Date(b.created) - new Date(a.created));
        
        res.json({
            success: true,
            data: backups
        });
    } catch (error) {
        console.error('Error fetching backups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch backups',
            error: error.message
        });
    }
});

// Restore from backup
router.post('/restore/*', auth, authorize('admin'), async (req, res) => {
    try {
        const { backupFilename } = req.body;
        
        if (!backupFilename) {
            return res.status(400).json({
                success: false,
                message: 'Backup filename is required'
            });
        }
        
        const backupDir = path.join(PAGES_DIR, '.backups');
        const backupPath = path.join(backupDir, backupFilename);
        
        if (!fs.existsSync(backupPath)) {
            return res.status(404).json({
                success: false,
                message: 'Backup not found'
            });
        }
        
        // Extract original file path from backup filename
        // Format: original_path_timestamp.bak
        const originalPath = backupFilename.split('_').slice(0, -1).join('_').replace('_', '/') + '.html';
        const fullOriginalPath = path.join(PAGES_DIR, originalPath);
        
        if (!fs.existsSync(fullOriginalPath)) {
            return res.status(404).json({
                success: false,
                message: 'Original file not found'
            });
        }
        
        // Read backup and restore
        const backupContent = fs.readFileSync(backupPath, 'utf8');
        fs.writeFileSync(fullOriginalPath, backupContent, 'utf8');
        
        res.json({
            success: true,
            message: 'Page restored successfully',
            data: {
                path: originalPath,
                lastModified: fs.statSync(fullOriginalPath).mtime
            }
        });
    } catch (error) {
        console.error('Error restoring backup:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to restore backup',
            error: error.message
        });
    }
});

module.exports = router;

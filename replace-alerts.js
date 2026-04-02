/**
 * Script to replace all alert(), confirm(), and prompt() calls with modal helpers
 * This script helps systematically replace browser dialogs with styled modals
 */

const fs = require('fs');
const path = require('path');

// Files to process - all JavaScript files in src/scripts
const filesToProcess = [
    'src/scripts/application.js',
    'src/scripts/pages/auth/login-page.js',
    'src/scripts/pages/auth/profile.js',
    'src/scripts/pages/auth/registration-form.js',
    'src/scripts/pages/contributions/history.js',
    'src/scripts/pages/dashboard/add-officer.js',
    'src/scripts/pages/dashboard/active-members.js',
    'src/scripts/pages/dashboard/analytics.js',
    'src/scripts/pages/dashboard/admin-dashboard.js',
    'src/scripts/pages/dashboard/archive-docs.js',
    'src/scripts/pages/dashboard/contributions-history.js',
    'src/scripts/pages/dashboard/create-notice.js',
    'src/scripts/pages/dashboard/create-folder.js',
    'src/scripts/pages/dashboard/bereavement-management.js',
    'src/scripts/pages/dashboard/debts.js',
    'src/scripts/pages/dashboard/documentation.js',
    'src/scripts/pages/dashboard/edit-document.js',
    'src/scripts/pages/dashboard/edit-member.js',
    'src/scripts/pages/dashboard/executive-team.js',
    'src/scripts/pages/dashboard/fines-collection.js',
    'src/scripts/pages/dashboard/issue-fine.js',
    'src/scripts/pages/dashboard/member-contribution-history.js',
    'src/scripts/pages/dashboard/member-details.js',
    'src/scripts/pages/dashboard/member-loans-history.js',
    'src/scripts/pages/dashboard/member-payments-history.js',
    'src/scripts/pages/dashboard/member-portal.js',
    'src/scripts/pages/dashboard/members.js',
    'src/scripts/pages/dashboard/members-savings.js',
    'src/scripts/pages/dashboard/notices.js',
    'src/scripts/pages/dashboard/registered-members.js',
    'src/scripts/pages/dashboard/savings-goal.js',
    'src/scripts/pages/dashboard/send-announcement.js',
    'src/scripts/pages/dashboard/send-sms.js',
    'src/scripts/pages/dashboard/settings.js',
    'src/scripts/pages/dashboard/security-settings.js',
    'src/scripts/pages/dashboard/student-portal.js',
    'src/scripts/pages/dashboard/withdrawals.js',
    'src/scripts/pages/dashboard/upload-document.js',
    'src/scripts/pages/loans/apply.js',
    'src/scripts/pages/public/gallery.js',
    'src/scripts/pages/public/member.js',
    'src/scripts/pages/public/news.js',
    'src/scripts/pages/payments/make-payment.js',
    'src/scripts/pages/payments/history.js',
    'src/scripts/pages/reports/export-data.js',
    'src/scripts/pages/reports/index.js'
];

// Replacement patterns - using template literals for proper capture group substitution
const replacements = [
    // Simple string literals: alert('message') - FIX: use template literal
    {
        pattern: /alert\(['"`]([^'"`]+)['"`]\)/g,
        replacement: `showAlert('$1', 'Information', 'info')`,
        importStatement: `import { showAlert } from '../../../utils/utility-functions.js';`
    },
    // Template literals: alert(`message`) - FIX: use template literal
    {
        pattern: /alert\(`([^`]+)`\)/g,
        replacement: 'showAlert(`$1`, \'Information\', \'info\')',
        importStatement: `import { showAlert } from '../../../utils/utility-functions.js';`
    },
    // String concatenation with variable: alert('text ' + variable) - keep original form
    {
        pattern: /alert\(['"`]([^'"]*)['"`]\s*\+\s*([^+]+)\)/g,
        replacement: "showAlert($1 + $2, 'Information', 'info')",
        importStatement: `import { showAlert } from '../../../utils/utility-functions.js';`
    },
    // Variable only: alert(message);
    {
        pattern: /alert\(([^'"`]+)\);/g,
        replacement: `showAlert($1, 'Information', 'info');`,
        importStatement: `import { showAlert } from '../../../utils/utility-functions.js';`
    },
    // confirm() calls - simple string
    {
        pattern: /if\s*\(\s*confirm\(['"`]([^'"`]+)['"`]\)\s*\)/g,
        replacement: `if (await showConfirm('$1'))`,
        importStatement: `import { showConfirm } from '../../../utils/utility-functions.js';`
    },
    // confirm() calls - variable
    {
        pattern: /if\s*\(\s*confirm\(([^)]+)\)\s*\)/g,
        replacement: `if (await showConfirm($1))`,
        importStatement: `import { showConfirm } from '../../../utils/utility-functions.js';`
    },
    // prompt() calls - simple string
    {
        pattern: /prompt\(['"`]([^'"`]+)['"`]\)/g,
        replacement: `await showPrompt('$1')`,
        importStatement: `import { showPrompt } from '../../../utils/utility-functions.js';`
    },
    // prompt() with default value
    {
        pattern: /prompt\(['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\)/g,
        replacement: `await showPrompt('$1', '$2')`,
        importStatement: `import { showPrompt } from '../../../utils/utility-functions.js';`
    },
    // prompt() with variable
    {
        pattern: /prompt\(([^,)]+)\s*(?:,\s*([^)]+))?\)/g,
        replacement: (match, message, defaultVal) => {
            if (defaultVal) {
                return `await showPrompt(${message}, ${defaultVal})`;
            }
            return `await showPrompt(${message})`;
        },
        importStatement: `import { showPrompt } from '../../../utils/utility-functions.js';`
    }
];

function processFile(filePath) {
    try {
        console.log(`Processing: ${filePath}`);
        
        // Read file
        const content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        const neededImports = new Set();
        
        // Apply replacements
        replacements.forEach(({ pattern, replacement, importStatement }) => {
            if (typeof replacement === 'function') {
                newContent = newContent.replace(pattern, replacement);
            } else {
                newContent = newContent.replace(pattern, replacement);
            }
        });
        
        // Check what replacements were actually used
        replacements.forEach(({ pattern, importStatement }) => {
            if (pattern.test(content)) {
                neededImports.add(importStatement);
            }
        });
        
        // Add imports if needed
        if (neededImports.size > 0) {
            const imports = Array.from(neededImports).join('\n');
            
            // Find where to insert imports (after existing imports)
            const importRegex = /import\s+.*from\s+['"`][^'"`]+['"`];?\s*\n/g;
            const lastImportMatch = [...newContent.matchAll(importRegex)].pop();
            
            if (lastImportMatch) {
                const insertPosition = lastImportMatch.index + lastImportMatch[0].length;
                newContent = newContent.slice(0, insertPosition) + 
                           '\n' + imports + '\n' + 
                           newContent.slice(insertPosition);
            } else {
                // If no imports found, add at the beginning
                newContent = imports + '\n\n' + newContent;
            }
        }
        
        // Write back if changed
        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`✅ Updated: ${filePath}`);
        } else {
            console.log(`⏭️  No changes needed: ${filePath}`);
        }
        
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
    }
}

// Process all files
console.log('🔄 Starting alert replacement process...\n');

filesToProcess.forEach(processFile);

console.log('\n✅ Alert replacement process completed!');
console.log('\n📝 Manual review may be needed for:');
console.log('   - Functions that need to be made async');
console.log('   - Complex alert() calls with string concatenation');
console.log('   - Context-specific modal titles and types');
console.log('   - Ensure all async functions are properly declared');

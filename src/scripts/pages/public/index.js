/**
 * Pages Index
 * Export all page-specific scripts
 * 
 * @version 1.0.0
 */

export { default as WelcomePage } from './welcome.js';
export { default as AdminDashboard } from './admin.js';
export { default as MemberDashboard } from './member.js';

export default {
    WelcomePage: () => import('./welcome.js'),
    AdminDashboard: () => import('./admin.js'),
    MemberDashboard: () => import('./member.js'),
};

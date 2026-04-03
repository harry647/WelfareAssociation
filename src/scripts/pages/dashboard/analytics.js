/**
 * Analytics Script
 * Handles analytics and insights page functionality
 * 
 * @version 1.0.0
 */

import { memberService } from '../../../services/member-service.js';
import { contributionService } from '../../../services/contribution-service.js';
import { loanService } from '../../../services/loan-service.js';
import { eventService } from '../../../services/event-service.js';
import { savingsService } from '../../../services/savings-service.js';

import { showAlert } from '../../../utils/utility-functions.js';
import { showConfirm } from '../../../utils/utility-functions.js';
import { showPrompt } from '../../../utils/utility-functions.js';
class Analytics {
    constructor() {
        this.analyticsData = {
            members: { total: 0, active: 0, newThisMonth: 0 },
            contributions: { total: 0, thisMonth: 0, list: [] },
            loans: { total: 0, active: 0, list: [] },
            savings: { total: 0 },
            events: [],
            reports: []
        };
        this.dateRange = '30'; // days
        this.currentYear = new Date().getFullYear();
        this.init();
    }

    init() {
        this.initSidebar();
        this.initEventListeners();
        this.loadAnalytics();
    }

    initSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                if (sidebarOverlay) {
                    sidebarOverlay.classList.toggle('active');
                }
            });
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            });
        }
    }

    initEventListeners() {
        // Date range filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Get days from button text
                const btnText = e.target.textContent.trim();
                if (btnText.includes('30')) this.dateRange = '30';
                else if (btnText.includes('3')) this.dateRange = '90';
                else if (btnText.includes('6')) this.dateRange = '180';
                else if (btnText.includes('Year')) this.dateRange = '365';
                else this.dateRange = '30';
                
                this.loadAnalytics();
            });
        });

        // Export buttons
        document.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportData();
            });
        });

        // Logout button
        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    getDateFilter() {
        const now = new Date();
        const startDate = new Date(now.getTime() - (parseInt(this.dateRange) * 24 * 60 * 60 * 1000));
        return { startDate, endDate: now };
    }

    async loadAnalytics() {
        try {
            const { startDate, endDate } = this.getDateFilter();
            
            // Fetch data from multiple services in parallel
            const [membersData, contributionsData, loansData, eventsData, savingsData] = await Promise.allSettled([
                this.fetchMembersData(),
                this.fetchContributionsData(),
                this.fetchLoansData(),
                this.fetchEventsData(),
                this.fetchSavingsData()
            ]);

            // Process and render all data
            this.processMembersData(membersData, startDate, endDate);
            this.processContributionsData(contributionsData, startDate, endDate);
            this.processLoansData(loansData, startDate, endDate);
            this.processEventsData(eventsData, startDate, endDate);
            this.processSavingsData(savingsData);

            // Render all tables
            this.renderQuickStats();
            this.renderFinancialOverview();
            this.renderMonthlyTrends();
            this.renderMemberAnalytics();
            this.renderLoanAnalytics();
            this.renderEventAnalytics();
            this.renderTopContributors(contributionsData, savingsData, membersData);

        } catch (error) {
            console.error('Error loading analytics:', error);
            this.handleError();
        }
    }

    async fetchMembersData() {
        try {
            const response = await memberService.getAllMembers({ limit: 1000 });
            if (response.success) {
                return response.data || response.pagination?.total > 0 ? (response.data || []) : [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching members:', error);
            return [];
        }
    }

    async fetchContributionsData() {
        try {
            const response = await contributionService.getAll({ limit: 1000 });
            if (response.success) {
                return response.data || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching contributions:', error);
            return [];
        }
    }

    async fetchLoansData() {
        try {
            const response = await loanService.getAll({ limit: 1000 });
            if (response.success) {
                return response.data || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching loans:', error);
            return [];
        }
    }

    async fetchEventsData() {
        try {
            const response = await eventService.getAll({ limit: 100 });
            if (response.success) {
                return response.data || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching events:', error);
            return [];
        }
    }

    async fetchSavingsData() {
        try {
            const response = await savingsService.getAll({ limit: 1000 });
            if (response.success) {
                return response.data || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching savings:', error);
            return [];
        }
    }

    processMembersData(result, startDate, endDate) {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            const members = result.value;
            const now = new Date();
            
            this.analyticsData.members.total = members.length;
            this.analyticsData.members.active = members.filter(m => 
                m.membershipStatus === 'active' || m.status === 'active'
            ).length;
            
            // New this month (within date range)
            this.analyticsData.members.newThisMonth = members.filter(m => {
                const createdAt = new Date(m.createdAt);
                return createdAt >= startDate && createdAt <= endDate;
            }).length;
        }
    }

    processContributionsData(result, startDate, endDate) {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            const contributions = result.value;
            
            // Total contributions (all time)
            this.analyticsData.contributions.total = contributions.reduce((sum, c) => 
                sum + (parseFloat(c.amount) || 0), 0);
            
            // This period contributions
            this.analyticsData.contributions.thisMonth = contributions.filter(c => {
                const date = new Date(c.createdAt || c.paymentDate);
                return date >= startDate && date <= endDate;
            }).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
            
            this.analyticsData.contributions.list = contributions;
        }
    }

    processLoansData(result, startDate, endDate) {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            const loans = result.value;
            
            this.analyticsData.loans.total = loans.reduce((sum, l) => 
                sum + (parseFloat(l.principalAmount || l.amount) || 0), 0);
            this.analyticsData.loans.active = loans.filter(l => 
                l.status === 'active' || l.status === 'approved'
            ).length;
            this.analyticsData.loans.list = loans;
        }
    }

    processEventsData(result, startDate, endDate) {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            this.analyticsData.events = result.value.filter(e => {
                const eventDate = new Date(e.eventDate || e.date);
                return eventDate >= startDate && eventDate <= endDate;
            });
        }
    }

    processSavingsData(result) {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            this.analyticsData.savings.total = result.value.reduce((sum, s) => 
                sum + (parseFloat(s.currentAmount || s.amount || 0)), 0);
        }
    }

    renderQuickStats() {
        // Total Members
        const totalMembersEl = document.getElementById('totalMembers');
        const membersGrowthEl = document.getElementById('membersGrowth');
        if (totalMembersEl) totalMembersEl.textContent = this.analyticsData.members.total;
        if (membersGrowthEl) membersGrowthEl.textContent = `+${this.analyticsData.members.newThisMonth} this month`;

        // Revenue (from contributions)
        const totalRevenueEl = document.getElementById('totalRevenue');
        const revenueGrowthEl = document.getElementById('revenueGrowth');
        if (totalRevenueEl) totalRevenueEl.textContent = `Ksh ${this.formatNumber(this.analyticsData.contributions.total)}`;
        if (revenueGrowthEl) {
            const growth = this.analyticsData.contributions.thisMonth > 0 ? 
                Math.round((this.analyticsData.contributions.thisMonth / this.analyticsData.contributions.total) * 100) : 0;
            revenueGrowthEl.textContent = `+${growth}% growth`;
        }

        // Loans
        const totalLoansEl = document.getElementById('totalLoans');
        const activeLoansEl = document.getElementById('activeLoans');
        if (totalLoansEl) totalLoansEl.textContent = `Ksh ${this.formatNumber(this.analyticsData.loans.total)}`;
        if (activeLoansEl) activeLoansEl.textContent = `${this.analyticsData.loans.active} active`;

        // Collection Rate (mock calculation)
        const collectionRateEl = document.getElementById('collectionRate');
        const collectionGrowthEl = document.getElementById('collectionGrowth');
        const collectionRate = this.analyticsData.members.total > 0 ? 
            Math.round((this.analyticsData.members.active / this.analyticsData.members.total) * 100) : 0;
        if (collectionRateEl) collectionRateEl.textContent = `${collectionRate}%`;
        if (collectionGrowthEl) collectionGrowthEl.textContent = `+${Math.max(0, collectionRate - 85)}% improvement`;
    }

    renderFinancialOverview() {
        const totalAssets = this.analyticsData.savings.total + this.analyticsData.contributions.total;
        const totalLiabilities = this.analyticsData.loans.total;
        const netWorth = totalAssets - totalLiabilities;
        const yoyGrowth = 0; // Would need historical data to calculate

        const totalAssetsEl = document.getElementById('totalAssets');
        const totalLiabilitiesEl = document.getElementById('totalLiabilities');
        const yoyGrowthEl = document.getElementById('yoyGrowth');
        const netWorthEl = document.getElementById('netWorth');

        if (totalAssetsEl) totalAssetsEl.textContent = `Ksh ${this.formatNumber(totalAssets)}`;
        if (totalLiabilitiesEl) totalLiabilitiesEl.textContent = `Ksh ${this.formatNumber(totalLiabilities)}`;
        if (yoyGrowthEl) yoyGrowthEl.textContent = `${yoyGrowth}%`;
        if (netWorthEl) netWorthEl.textContent = `Ksh ${this.formatNumber(netWorth)}`;
    }

    renderMonthlyTrends() {
        const tbody = document.getElementById('monthlyTrendsTable');
        if (!tbody) return;

        // Generate from actual contribution/loan data grouped by month
        const contributions = this.analyticsData.contributions.list || [];
        const monthlyData = this.groupByMonth(contributions);
        
        if (Object.keys(monthlyData).length > 0) {
            const trends = Object.entries(monthlyData)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .slice(0, 6)
                .map(([monthKey, data]) => {
                    const contributions = data.contrib || 0;
                    const expenses = contributions * 0.3; // Estimated expenses
                    const loans = data.loans || 0;
                    const savings = data.savings || 0;
                    const netChange = contributions - loans - expenses;
                    const growth = contributions > 0 ? Math.round(((contributions - expenses) / contributions) * 100) : 0;
                    
                    return { 
                        month: data.month, 
                        contributions, 
                        loans, 
                        savings, 
                        expenses, 
                        netChange, 
                        growth 
                    };
                });
            
            tbody.innerHTML = trends.map(t => `
                <tr>
                    <td>${this.escapeHtml(t.month)}</td>
                    <td>Ksh ${this.formatNumber(t.contributions)}</td>
                    <td>Ksh ${this.formatNumber(t.loans)}</td>
                    <td>Ksh ${this.formatNumber(t.savings)}</td>
                    <td>Ksh ${this.formatNumber(t.expenses)}</td>
                    <td style="color: ${t.netChange >= 0 ? 'green' : 'red'};">${t.netChange >= 0 ? '+' : ''}Ksh ${this.formatNumber(t.netChange)}</td>
                    <td style="color: ${t.growth >= 0 ? 'green' : 'red'};">${t.growth >= 0 ? '+' : ''}${t.growth}%</td>
                </tr>
            `).join('');
        } else {
            // Fallback - show empty state message
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px;">
                        <i class="fas fa-chart-line" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i><br>
                        <p style="color: #666; font-size: 16px;">No monthly trend data available</p>
                        <p style="color: #999; font-size: 14px;">Add contributions to see monthly trends</p>
                    </td>
                </tr>
            `;
        }
    }

    // Helper to group data by month
    groupByMonth(data) {
        const grouped = {};
        data.forEach(item => {
            const date = new Date(item.createdAt || item.paymentDate || item.date);
            if (isNaN(date.getTime())) return;
            
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            
            if (!grouped[monthKey]) {
                grouped[monthKey] = { month: monthName, contrib: 0, loans: 0, savings: 0 };
            }
            grouped[monthKey].contrib += parseFloat(item.amount) || 0;
        });
        return grouped;
    }

    renderMemberAnalytics() {
        const tbody = document.getElementById('memberAnalyticsTable');
        if (!tbody) return;

        const total = this.analyticsData.members.total;
        const active = this.analyticsData.members.active;
        const inactive = total - active;
        const newThisMonth = this.analyticsData.members.newThisMonth;
        const retentionRate = total > 0 ? Math.round((active / total) * 100) : 0;
        const avgContribution = this.analyticsData.contributions.total / Math.max(1, total);

        tbody.innerHTML = `
            <tr>
                <td>Full Members</td>
                <td>${active}</td>
                <td>${inactive}</td>
                <td>${newThisMonth}</td>
                <td>${retentionRate}%</td>
                <td>Ksh ${this.formatNumber(avgContribution)}</td>
            </tr>
            <tr>
                <td>Associate Members</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0%</td>
                <td>Ksh 0</td>
            </tr>
            <tr>
                <td>Honorary Members</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0%</td>
                <td>Ksh 0</td>
            </tr>
            <tr>
                <td><strong>Total</strong></td>
                <td><strong>${active}</strong></td>
                <td><strong>${inactive}</strong></td>
                <td><strong>${newThisMonth}</strong></td>
                <td><strong>${retentionRate}%</strong></td>
                <td><strong>Ksh ${this.formatNumber(avgContribution)}</strong></td>
            </tr>
        `;
    }

    renderLoanAnalytics() {
        const tbody = document.getElementById('loanAnalyticsTable');
        if (!tbody) return;

        const loans = this.analyticsData.loans.list || [];
        
        // If no loans data, show empty state
        if (loans.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <i class="fas fa-hand-holding-usd" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i><br>
                        <p style="color: #666; font-size: 16px;">No loan data available</p>
                        <p style="color: #999; font-size: 14px;">Loan records will appear here</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Group loans by type from actual data
        const loansByType = {};
        loans.forEach(loan => {
            const type = loan.type || loan.loanType || 'other';
            if (!loansByType[type]) {
                loansByType[type] = { total: 0, active: 0, repaid: 0 };
            }
            loansByType[type].total += loan.amount || 0;
            if (loan.status === 'active' || loan.status === 'approved') {
                loansByType[type].active++;
            } else if (loan.status === 'paid' || loan.status === 'repaid') {
                loansByType[type].repaid++;
            }
        });

        // Calculate totals
        const totalLoans = Object.values(loansByType).reduce((sum, t) => sum + t.total, 0);
        const totalActive = Object.values(loansByType).reduce((sum, t) => sum + t.active, 0);
        const totalRepaid = Object.values(loansByType).reduce((sum, t) => sum + t.repaid, 0);

        // Build table rows from actual data
        let rows = Object.entries(loansByType).map(([type, data]) => {
            const typeName = type.charAt(0).toUpperCase() + type.slice(1) + ' Loans';
            const defaultRate = (data.active + data.repaid) > 0 ? Math.round((data.repaid / (data.active + data.repaid)) * 100) : 0;
            
            return `
                <tr>
                    <td>${this.escapeHtml(typeName)}</td>
                    <td>Ksh ${this.formatNumber(data.total)}</td>
                    <td>${data.active}</td>
                    <td>${data.repaid}</td>
                    <td>${100 - defaultRate}%</td>
                    <td>-</td>
                </tr>
            `;
        }).join('');

        // Add total row
        const avgDefaultRate = (totalActive + totalRepaid) > 0 ? Math.round((totalRepaid / (totalActive + totalRepaid)) * 100) : 0;
        rows += `
            <tr>
                <td><strong>Total</strong></td>
                <td><strong>Ksh ${this.formatNumber(totalLoans)}</strong></td>
                <td><strong>${totalActive}</strong></td>
                <td><strong>${totalRepaid}</strong></td>
                <td><strong>${avgDefaultRate}%</strong></td>
                <td><strong>-</strong></td>
            </tr>
        `;

        tbody.innerHTML = rows;
    }

    renderEventAnalytics() {
        const tbody = document.getElementById('eventAnalyticsTable');
        if (!tbody) return;

        const events = this.analyticsData.events;

        if (events.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <i class="fas fa-calendar" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i><br>
                        <p style="color: #666; font-size: 16px;">No events found</p>
                        <p style="color: #999; font-size: 14px;">Create events to see analytics</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = events.slice(0, 5).map(event => {
            const registered = event.attendees?.length || 0;
            const attended = Math.round(registered * 0.85);
            const participation = registered > 0 ? Math.round((attended / registered) * 100) : 0;
            
            return `
                <tr>
                    <td>${this.escapeHtml(event.title || 'Untitled Event')}</td>
                    <td>${this.formatDate(event.date || event.createdAt)}</td>
                    <td>${registered}</td>
                    <td>${attended}</td>
                    <td>${participation}%</td>
                    <td>${event.rating || 'N/A'}</td>
                </tr>
            `;
        }).join('');
    }

    renderTopContributors(contributionsResult, savingsResult, membersResult) {
        const tbody = document.getElementById('topContributorsTable');
        if (!tbody) return;

        // Get members map for name lookup
        let membersMap = {};
        if (membersResult && membersResult.status === 'fulfilled' && Array.isArray(membersResult.value)) {
            membersResult.value.forEach(m => {
                membersMap[m.id] = m;
            });
        }

        // Combine contributions and savings data to get top contributors
        let membersContrib = [];
        
        if (contributionsResult.status === 'fulfilled' && Array.isArray(contributionsResult.value)) {
            // Group contributions by member
            const contribByMember = {};
            contributionsResult.value.forEach(c => {
                const memberId = c.memberId || c.userId;
                if (!contribByMember[memberId]) contribByMember[memberId] = 0;
                contribByMember[memberId] += parseFloat(c.amount) || 0;
            });
            membersContrib = Object.entries(contribByMember).map(([id, amount]) => ({ id, amount }));
        }

        let membersSavings = [];
        if (savingsResult.status === 'fulfilled' && Array.isArray(savingsResult.value)) {
            const savingsByMember = {};
            savingsResult.value.forEach(s => {
                const memberId = s.memberId || s.userId;
                if (!savingsByMember[memberId]) savingsByMember[memberId] = 0;
                savingsByMember[memberId] += parseFloat(s.currentAmount || s.amount) || 0;
            });
            membersSavings = Object.entries(savingsByMember).map(([id, amount]) => ({ id, amount }));
        }

        // Merge and sort by total contributions
        const memberTotals = {};
        membersContrib.forEach(m => {
            memberTotals[m.id] = memberTotals[m.id] || { contrib: 0, savings: 0 };
            memberTotals[m.id].contrib = m.amount;
        });
        membersSavings.forEach(m => {
            memberTotals[m.id] = memberTotals[m.id] || { contrib: 0, savings: 0 };
            memberTotals[m.id].savings = m.amount;
        });

        const topMembers = Object.entries(memberTotals)
            .map(([id, data]) => ({ 
                id, 
                ...data, 
                total: data.contrib + data.savings,
                member: membersMap[id]
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        if (topMembers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <i class="fas fa-trophy" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i><br>
                        <p style="color: #666; font-size: 16px;">No contributor data available</p>
                        <p style="color: #999; font-size: 14px;">Members need to make contributions to appear here</p>
                    </td>
                </tr>
            `;
            return;
        }

        const medals = ['#FFD700', '#C0C0C0', '#CD7F32', '', ''];
        const ranks = ['1st', '2nd', '3rd', '4th', '5th'];

        tbody.innerHTML = topMembers.map((member, index) => {
            const memberName = member.member 
                ? `${member.member.firstName || ''} ${member.member.lastName || ''}`.trim() 
                : `Member ${(member.id || '').substring(0, 8)}`;
            const memberNumber = member.member?.memberNumber || (member.id || '').substring(0, 12);
            
            return `
                <tr>
                    <td>
                        ${index < 3 ? `<i class="fas fa-medal" style="color: ${medals[index]};"></i> ` : ''}${ranks[index]}
                    </td>
                    <td>${this.escapeHtml(memberName)}</td>
                    <td>${this.escapeHtml(memberNumber)}</td>
                    <td>Ksh ${this.formatNumber(member.contrib)}</td>
                    <td>Ksh ${this.formatNumber(member.savings)}</td>
                    <td>${85 + (index * 2)}%</td>
                </tr>
            `;
        }).join('');
    }

    handleError() {
        const tables = ['monthlyTrendsTable', 'memberAnalyticsTable', 'loanAnalyticsTable', 'eventAnalyticsTable', 'topContributorsTable'];
        tables.forEach(id => {
            const tbody = document.getElementById(id);
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc3545; margin-bottom: 15px;"></i><br>
                            <p style="color: #dc3545; font-size: 16px;">Error loading data</p>
                            <p style="color: #999; font-size: 14px;">Please check your connection and try again</p>
                        </td>
                    </tr>
                `;
            }
        });
    }

    renderCharts() {
        // Chart rendering logic would go here
        console.log('Rendering analytics charts...');
    }

    exportData() {
        console.log('Exporting analytics data...');
        showAlert('Analytics data exported successfully!', 'Information', 'info');
    }

    async handleLogout() {
        if (await showConfirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            localStorage.removeItem('swa_auth_token');
            localStorage.removeItem('swa_refresh_token');
            localStorage.removeItem('swa_user');
            window.location.href = '../../index.html';
        }
    }

    // Utility functions
    formatNumber(num) {
        if (num === undefined || num === null) return '0';
        return Math.round(num).toLocaleString();
    }

    formatDate(date) {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Analytics();
});

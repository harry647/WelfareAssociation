/**
 * Payment History Script
 * Handles payment history display for users and admin
 * Supports both "My Payments" and "All Payments (Admin)" views
 */

// Payment data store (mock data - in production would come from API)
let paymentStore = {
    myPayments: [],
    allPayments: [],
    charts: {}
};

// Configuration
const CONFIG = {
    apiBaseUrl: '/api',
    itemsPerPage: 10,
    categories: {
        contribution: 'Contribution',
        shares: 'Shares Contribution',
        welfare: 'Welfare Fund',
        bereavement: 'Bereavement',
        loan: 'Loan Repayment',
        event: 'Event Fee',
        fine: 'Penalty/Fine',
        registration: 'Registration',
        subscription: 'Subscription',
        other: 'Other'
    },
    methods: {
        mpesa: 'M-Pesa',
        bank: 'Bank Transfer',
        card: 'Card Payment',
        cash: 'Cash'
    },
    statuses: {
        pending: { label: 'Pending', class: 'status--pending' },
        completed: { label: 'Completed', class: 'status--success' },
        failed: { label: 'Failed', class: 'status--failed' }
    }
};

// Current state
let currentState = {
    myView: {
        page: 1,
        filtered: [],
        filters: { category: '', status: '', month: '' }
    },
    adminView: {
        page: 1,
        filtered: [],
        filters: { search: '', category: '', status: '', method: '' }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initPaymentHistory();
    initLogout();
});

function initLogout() {
    const logoutBtn = document.querySelector('.logout-btn-header');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                sessionStorage.clear();
                localStorage.removeItem('swa_auth_token');
                localStorage.removeItem('swa_refresh_token');
                localStorage.removeItem('swa_user');
                window.location.href = '../../index.html';
            }
        });
    }
}

async function initPaymentHistory() {
    // Load user data
    loadUserData();
    
    // Load payment data
    await loadPaymentData();
    
    // Initialize view toggle
    initViewToggle();
    
    // Initialize filters
    initFilters();
    
    // Check if admin (for demo, check localStorage)
    const isAdmin = localStorage.getItem('swa_is_admin') === 'true';
    if (isAdmin) {
        showAdminView();
    } else {
        showMyPaymentsView();
    }
    
    // Initialize charts
    initCharts();
}

function loadUserData() {
    // Get user data from localStorage
    const profileKey = 'swa_member_profile';
    const profileData = localStorage.getItem(profileKey);
    
    if (profileData) {
        const user = JSON.parse(profileData);
        const nameEl = document.getElementById('userName');
        const avatarEl = document.getElementById('userAvatar');
        
        if (nameEl && user.firstName) {
            nameEl.textContent = `${user.firstName} ${user.lastName || ''}`;
        }
        if (avatarEl && user.firstName) {
            avatarEl.textContent = user.firstName.charAt(0).toUpperCase();
        }
    }
}

async function loadPaymentData() {
    // In production, this would fetch from API
    // For demo, generate mock data
    
    // My payments (for current logged in user)
    paymentStore.myPayments = generateMockPayments(15, 'my');
    
    // All payments (for admin view)
    paymentStore.allPayments = generateMockPayments(50, 'all');
    
    // Apply initial filters
    currentState.myView.filtered = [...paymentStore.myPayments];
    currentState.adminView.filtered = [...paymentStore.allPayments];
    
    // Update UI
    updateMyPaymentsDisplay();
    updateAdminDisplay();
}

function generateMockPayments(count, type) {
    const payments = [];
    const categories = Object.keys(CONFIG.categories);
    const methods = Object.keys(CONFIG.methods);
    const statuses = ['completed', 'completed', 'completed', 'pending', 'failed'];
    
    const names = [
        'John Doe', 'Mary Atieno', 'Peter Ochieng', 'Grace Wambui', 'James Ooko',
        'Sarah Nekesa', 'David Otieno', 'Faith Achieng', 'Michael Odhiambo', 'Grace Moraa'
    ];
    
    const studentIds = [
        'JOO/2024/001', 'JOO/2024/002', 'JOO/2024/003', 'JOO/2024/004', 'JOO/2024/005'
    ];
    
    for (let i = 0; i < count; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 90));
        
        const amount = [500, 1000, 1500, 2000, 2500, 3000, 5000][Math.floor(Math.random() * 7)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const method = methods[Math.floor(Math.random() * methods.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        const nameIndex = type === 'my' ? 0 : Math.floor(Math.random() * names.length);
        
        payments.push({
            id: `SWA-${date.getFullYear()}-${String(i + 1).padStart(6, '0')}`,
            date: date.toISOString().split('T')[0],
            fullName: type === 'my' ? 'Current User' : names[nameIndex],
            studentId: type === 'my' ? 'JOO/2024/001' : studentIds[Math.floor(Math.random() * studentIds.length)],
            category,
            amount,
            method,
            status,
            phone: '2547' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
            transactionId: status === 'completed' ? 'MPO' + Math.floor(Math.random() * 1000000000) : ''
        });
    }
    
    // Sort by date descending
    return payments.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// =====================
// VIEW TOGGLE
// =====================
function initViewToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            
            // Update button states
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show appropriate view
            if (view === 'my-payments') {
                showMyPaymentsView();
            } else {
                showAdminView();
            }
        });
    });
}

function showMyPaymentsView() {
    document.getElementById('myPaymentsView').style.display = 'block';
    document.getElementById('allPaymentsView').style.display = 'none';
    updateMyPaymentsDisplay();
}

function showAdminView() {
    document.getElementById('myPaymentsView').style.display = 'none';
    document.getElementById('allPaymentsView').style.display = 'block';
    updateAdminDisplay();
    updateCharts();
}

// =====================
// MY PAYMENTS
// =====================
function updateMyPaymentsDisplay() {
    const payments = currentState.myView.filtered;
    const tbody = document.getElementById('myPaymentsBody');
    const emptyState = document.getElementById('myPaymentsEmpty');
    const pagination = document.getElementById('myPaymentsPagination');
    
    // Update summary cards
    const total = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const completed = payments.filter(p => p.status === 'completed').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    
    document.getElementById('myTotalPayments').textContent = total;
    document.getElementById('myTotalAmount').textContent = `Ksh ${totalAmount.toLocaleString()}`;
    document.getElementById('mySuccessful').textContent = completed;
    document.getElementById('myPending').textContent = pending;
    
    // Pagination
    const totalPages = Math.ceil(total / CONFIG.itemsPerPage);
    const start = (currentState.myView.page - 1) * CONFIG.itemsPerPage;
    const end = start + CONFIG.itemsPerPage;
    const pagePayments = payments.slice(start, end);
    
    // Update table
    if (pagePayments.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        tbody.innerHTML = pagePayments.map(p => createPaymentRow(p)).join('');
    }
    
    // Update pagination
    document.getElementById('myPageInfo').textContent = `Page ${currentState.myView.page} of ${totalPages || 1}`;
    document.getElementById('myPrevPage').disabled = currentState.myView.page <= 1;
    document.getElementById('myNextPage').disabled = currentState.myView.page >= totalPages;
}

function createPaymentRow(payment) {
    const statusInfo = CONFIG.statuses[payment.status];
    const categoryName = CONFIG.categories[payment.category];
    const methodName = CONFIG.methods[payment.method];
    
    return `
        <tr>
            <td>${formatDate(payment.date)}</td>
            <td><strong>${payment.id}</strong></td>
            <td>${categoryName}</td>
            <td><strong>Ksh ${payment.amount.toLocaleString()}</strong></td>
            <td>${methodName}</td>
            <td><span class="status ${statusInfo.class}">${statusInfo.label}</span></td>
            <td>
                <button class="btn-sm" onclick="viewPaymentDetails('${payment.id}')" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                ${payment.status === 'completed' ? `
                <button class="btn-sm" onclick="downloadReceipt('${payment.id}')" title="Download Receipt">
                    <i class="fas fa-download"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `;
}

// =====================
// ADMIN ALL PAYMENTS
// =====================
function updateAdminDisplay() {
    const payments = currentState.adminView.filtered;
    
    // Update summary cards
    const total = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const completed = payments.filter(p => p.status === 'completed').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const failed = payments.filter(p => p.status === 'failed').length;
    
    document.getElementById('adminTotalPayments').textContent = total;
    document.getElementById('adminTotalAmount').textContent = `Ksh ${totalAmount.toLocaleString()}`;
    document.getElementById('adminCompleted').textContent = completed;
    document.getElementById('adminPending').textContent = pending;
    document.getElementById('adminFailed').textContent = failed;
    
    // Update category breakdown
    updateCategoryBreakdown(payments);
    
    // Update table
    updateAdminTable();
    
    // Update recent activity
    updateRecentActivity(payments.slice(0, 10));
}

function updateAdminTable() {
    const payments = currentState.adminView.filtered;
    const tbody = document.getElementById('adminPaymentsBody');
    const emptyState = document.getElementById('adminPaymentsEmpty');
    
    // Pagination
    const totalPages = Math.ceil(payments.length / CONFIG.itemsPerPage);
    const start = (currentState.adminView.page - 1) * CONFIG.itemsPerPage;
    const end = start + CONFIG.itemsPerPage;
    const pagePayments = payments.slice(start, end);
    
    // Update table
    if (pagePayments.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        tbody.innerHTML = pagePayments.map(p => createAdminPaymentRow(p)).join('');
    }
    
    // Update pagination
    document.getElementById('adminPageInfo').textContent = `Page ${currentState.adminView.page} of ${totalPages || 1}`;
    document.getElementById('adminPrevPage').disabled = currentState.adminView.page <= 1;
    document.getElementById('adminNextPage').disabled = currentState.adminView.page >= totalPages;
}

function createAdminPaymentRow(payment) {
    const statusInfo = CONFIG.statuses[payment.status];
    const categoryName = CONFIG.categories[payment.category];
    const methodName = CONFIG.methods[payment.method];
    
    return `
        <tr>
            <td>${formatDate(payment.date)}</td>
            <td><strong>${payment.id}</strong></td>
            <td>${payment.fullName}</td>
            <td>${payment.studentId}</td>
            <td>${categoryName}</td>
            <td><strong>Ksh ${payment.amount.toLocaleString()}</strong></td>
            <td>${methodName}</td>
            <td><span class="status ${statusInfo.class}">${statusInfo.label}</span></td>
            <td>
                <button class="btn-sm" onclick="viewPaymentDetails('${payment.id}')" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                ${payment.status === 'pending' ? `
                <button class="btn-sm" onclick="verifyPayment('${payment.id}')" title="Verify">
                    <i class="fas fa-check"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `;
}

function updateCategoryBreakdown(payments) {
    const breakdown = {};
    
    // Initialize all categories
    Object.keys(CONFIG.categories).forEach(cat => {
        breakdown[cat] = { count: 0, amount: 0 };
    });
    
    // Calculate totals
    payments.forEach(p => {
        if (breakdown[p.category]) {
            breakdown[p.category].count++;
            breakdown[p.category].amount += p.amount;
        }
    });
    
    // Generate HTML
    const container = document.getElementById('categoryBreakdown');
    container.innerHTML = Object.entries(breakdown)
        .filter(([_, data]) => data.count > 0)
        .map(([cat, data]) => `
            <div class="category-card">
                <div class="category-icon"><i class="fas fa-${getCategoryIcon(cat)}"></i></div>
                <div class="category-info">
                    <h4>${CONFIG.categories[cat]}</h4>
                    <p class="category-count">${data.count} payments</p>
                    <p class="category-amount">Ksh ${data.amount.toLocaleString()}</p>
                </div>
            </div>
        `).join('');
}

function getCategoryIcon(category) {
    const icons = {
        contribution: 'hand-holding-heart',
        shares: 'chart-line',
        welfare: 'users',
        bereavement: 'hand-holding-usd',
        loan: 'money-bill-wave',
        event: 'ticket-alt',
        fine: 'gavel',
        registration: 'user-plus',
        subscription: 'redo',
        other: 'ellipsis-h'
    };
    return icons[category] || 'money-bill-wave';
}

function updateRecentActivity(payments) {
    const container = document.getElementById('recentActivity');
    
    container.innerHTML = payments.map(p => {
        const statusIcon = p.status === 'completed' ? 'fa-check-circle text-success' : 
                          p.status === 'pending' ? 'fa-clock text-warning' : 'fa-times-circle text-danger';
        
        return `
            <div class="activity-item">
                <div class="activity-icon"><i class="fas ${statusIcon}"></i></div>
                <div class="activity-content">
                    <p><strong>${p.fullName}</strong> made a payment of <strong>Ksh ${p.amount.toLocaleString()}</strong></p>
                    <span class="activity-time">${formatDate(p.date)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// =====================
// CHARTS
// =====================
function initCharts() {
    // Category pie chart
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        paymentStore.charts.category = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: Object.values(CONFIG.categories),
                datasets: [{
                    data: [12, 8, 15, 5, 10, 3, 2, 3, 2, 5],
                    backgroundColor: [
                        '#4361ee', '#7209b7', '#f72585', '#06d6a0', '#ffd166',
                        '#ef476f', '#118ab2', '#073b4c', '#8338ec', '#3a86ff'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
    }
    
    // Method pie chart
    const methodCtx = document.getElementById('methodChart');
    if (methodCtx) {
        paymentStore.charts.method = new Chart(methodCtx, {
            type: 'pie',
            data: {
                labels: Object.values(CONFIG.methods),
                datasets: [{
                    data: [45, 30, 15, 10],
                    backgroundColor: ['#06d6a0', '#4361ee', '#f72585', '#ffd166']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
    }
    
    // Trend line chart
    const trendCtx = document.getElementById('trendChart');
    if (trendCtx) {
        paymentStore.charts.trend = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Total Payments (Ksh)',
                    data: [25000, 32000, 28000, 45000, 38000, 52000],
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}

function updateCharts() {
    // Update with real data
    const payments = currentState.adminView.filtered;
    
    // Category data
    const categoryData = {};
    Object.keys(CONFIG.categories).forEach(cat => categoryData[cat] = 0);
    payments.forEach(p => {
        if (categoryData[p.category] !== undefined) {
            categoryData[p.category]++;
        }
    });
    
    if (paymentStore.charts.category) {
        paymentStore.charts.category.data.datasets[0].data = Object.values(categoryData);
        paymentStore.charts.category.update();
    }
    
    // Method data
    const methodData = { mpesa: 0, bank: 0, card: 0, cash: 0 };
    payments.forEach(p => methodData[p.method]++);
    
    if (paymentStore.charts.method) {
        paymentStore.charts.method.data.datasets[0].data = Object.values(methodData);
        paymentStore.charts.method.update();
    }
}

// =====================
// FILTERS
// =====================
function initFilters() {
    // My payments filters
    document.getElementById('myFilterBtn')?.addEventListener('click', applyMyFilters);
    document.getElementById('myClearFilterBtn')?.addEventListener('click', clearMyFilters);
    
    // Admin filters
    document.getElementById('adminFilterBtn')?.addEventListener('click', applyAdminFilters);
    document.getElementById('adminClearFilterBtn')?.addEventListener('click', clearAdminFilters);
    document.getElementById('adminSearch')?.addEventListener('input', debounce(applyAdminFilters, 300));
    
    // Pagination
    document.getElementById('myPrevPage')?.addEventListener('click', () => changePage('my', -1));
    document.getElementById('myNextPage')?.addEventListener('click', () => changePage('my', 1));
    document.getElementById('adminPrevPage')?.addEventListener('click', () => changePage('admin', -1));
    document.getElementById('adminNextPage')?.addEventListener('click', () => changePage('admin', 1));
    
    // Export
    document.getElementById('exportBtn')?.addEventListener('click', exportToCSV);
}

function applyMyFilters() {
    const category = document.getElementById('myFilterCategory')?.value;
    const status = document.getElementById('myFilterStatus')?.value;
    const month = document.getElementById('myFilterMonth')?.value;
    
    currentState.myView.filters = { category, status, month };
    currentState.myView.page = 1;
    
    currentState.myView.filtered = paymentStore.myPayments.filter(p => {
        if (category && p.category !== category) return false;
        if (status && p.status !== status) return false;
        if (month && !p.date.startsWith(month)) return false;
        return true;
    });
    
    updateMyPaymentsDisplay();
}

function clearMyFilters() {
    document.getElementById('myFilterCategory').value = '';
    document.getElementById('myFilterStatus').value = '';
    document.getElementById('myFilterMonth').value = '';
    
    currentState.myView.filters = { category: '', status: '', month: '' };
    currentState.myView.page = 1;
    currentState.myView.filtered = [...paymentStore.myPayments];
    
    updateMyPaymentsDisplay();
}

function applyAdminFilters() {
    const search = document.getElementById('adminSearch')?.value.toLowerCase();
    const category = document.getElementById('adminFilterCategory')?.value;
    const status = document.getElementById('adminFilterStatus')?.value;
    const method = document.getElementById('adminFilterMethod')?.value;
    
    currentState.adminView.filters = { search, category, status, method };
    currentState.adminView.page = 1;
    
    currentState.adminView.filtered = paymentStore.allPayments.filter(p => {
        if (search) {
            const searchFields = [p.fullName, p.studentId, p.id].map(s => s.toLowerCase());
            if (!searchFields.some(s => s.includes(search))) return false;
        }
        if (category && p.category !== category) return false;
        if (status && p.status !== status) return false;
        if (method && p.method !== method) return false;
        return true;
    });
    
    updateAdminDisplay();
}

function clearAdminFilters() {
    document.getElementById('adminSearch').value = '';
    document.getElementById('adminFilterCategory').value = '';
    document.getElementById('adminFilterStatus').value = '';
    document.getElementById('adminFilterMethod').value = '';
    
    currentState.adminView.filters = { search: '', category: '', status: '', method: '' };
    currentState.adminView.page = 1;
    currentState.adminView.filtered = [...paymentStore.allPayments];
    
    updateAdminDisplay();
}

function changePage(view, direction) {
    if (view === 'my') {
        currentState.myView.page += direction;
        updateMyPaymentsDisplay();
    } else {
        currentState.adminView.page += direction;
        updateAdminTable();
    }
}

// =====================
// ACTIONS
// =====================
function viewPaymentDetails(paymentId) {
    // Find payment
    const payment = paymentStore.allPayments.find(p => p.id === paymentId);
    if (!payment) return;
    
    // Show in alert for now (in production, show modal)
    alert(`
Payment Details
================
Reference: ${payment.id}
Date: ${formatDate(payment.date)}
Name: ${payment.fullName}
Student ID: ${payment.studentId}
Category: ${CONFIG.categories[payment.category]}
Amount: Ksh ${payment.amount.toLocaleString()}
Method: ${CONFIG.methods[payment.method]}
Status: ${CONFIG.statuses[payment.status].label}
Phone: ${payment.phone}
Transaction ID: ${payment.transactionId || 'N/A'}
    `);
}

function downloadReceipt(paymentId) {
    // In production, this would generate PDF
    alert(`Downloading receipt for ${paymentId}...`);
}

function verifyPayment(paymentId) {
    // In production, verify via API
    const payment = paymentStore.allPayments.find(p => p.id === paymentId);
    if (payment) {
        payment.status = 'completed';
        paymentStore.myPayments = paymentStore.allPayments.filter(p => p.studentId === 'JOO/2024/001');
        updateAdminDisplay();
        alert(`Payment ${paymentId} has been verified and marked as completed.`);
    }
}

function exportToCSV() {
    const payments = currentState.adminView.filtered;
    
    const headers = ['Date', 'Reference', 'Name', 'Student ID', 'Category', 'Amount', 'Method', 'Status'];
    const rows = payments.map(p => [
        p.date,
        p.id,
        p.fullName,
        p.studentId,
        CONFIG.categories[p.category],
        p.amount,
        CONFIG.methods[p.method],
        CONFIG.statuses[p.status].label
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// =====================
// UTILITIES
// =====================
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for global use
window.viewPaymentDetails = viewPaymentDetails;
window.downloadReceipt = downloadReceipt;
window.verifyPayment = verifyPayment;

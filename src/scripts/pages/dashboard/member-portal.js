/**
 * Member Portal Script
 * Handles member portal functionality including contributions and loan applications
 * 
 * @version 1.0.0
 */

// Import services
import { authService, memberService, contributionService, loanService, paymentService, apiService } from '../../../services/index.js';

class MemberPortal {
    constructor() {
        this.contributionForm = document.querySelector('.make-contribution form');
        this.loanForm = document.querySelector('.loan-section form');
        this.profileEditBtn = document.querySelector('.profile-section .btn');
        
        // Initialize on construction
        this.init();
    }

    init() {
        // Check authentication first
        console.log('MemberPortal init() called');
        if (!this.checkAuth()) {
            console.log('checkAuth() returned false, exiting init');
            return; // Will redirect to login
        }
        console.log('checkAuth() passed, binding events and loading data');
        this.bindEvents();
        this.loadMemberData();
    }

    checkAuth() {
        console.log('checkAuth() called');
        const isAuth = authService.isAuthenticated();
        console.log('authService.isAuthenticated() returned:', isAuth);
        
        if (!isAuth) {
            // Not logged in, redirect to login page
            console.log('User not authenticated, redirecting to login');
            window.location.href = '../../../auth/login-page.html?redirect=../member/member-portal.html';
            return false;
        }
        
        const user = authService.getCurrentUser();
        console.log('Current user:', user);
        if (!user) {
            console.log('No current user found, redirecting to login');
            window.location.href = '../../../auth/login-page.html?redirect=../member/member-portal.html';
            return false;
        }
        console.log('Authentication check passed');
        return true;
    }

    bindEvents() {
        // Logout button
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Contribution form
        if (this.contributionForm) {
            this.contributionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContribution();
            });

            // Payment method change handler
            const paymentMethod = this.contributionForm.querySelector('select');
            if (paymentMethod) {
                paymentMethod.addEventListener('change', (e) => {
                    this.handlePaymentMethodChange(e.target);
                });
            }
        }

        // Loan form
        if (this.loanForm) {
            this.loanForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLoanApplication();
            });

            // Amount input validation
            const amountInput = this.loanForm.querySelector('input[type="number"]');
            if (amountInput) {
                amountInput.addEventListener('input', (e) => {
                    this.validateLoanAmount(e.target);
                });
            }
        }

        // Profile edit button
        if (this.profileEditBtn) {
            this.profileEditBtn.addEventListener('click', () => {
                this.handleProfileEdit();
            });
        }

        // Notification click handlers
        document.querySelectorAll('.notification').forEach(notification => {
            notification.addEventListener('click', () => {
                notification.classList.toggle('read');
            });
        });
    }

    handlePaymentMethodChange(select) {
        const transactionInput = select.closest('form').querySelector('input[placeholder*="ABC"]');
        if (transactionInput) {
            if (select.value === 'cash') {
                transactionInput.disabled = true;
                transactionInput.placeholder = 'N/A - Hand delivery';
                transactionInput.required = false;
            } else {
                transactionInput.disabled = false;
                transactionInput.placeholder = 'e.g. ABC123XYZ';
                transactionInput.required = true;
            }
        }
    }

    async handleContribution() {
        const form = this.contributionForm;
        const amount = form.querySelector('input[type="number"]')?.value;
        const method = form.querySelector('select')?.value;
        const transactionId = form.querySelector('input[type="text"]')?.value;

        // Validation
        if (!amount || amount < 100) {
            alert('Minimum contribution amount is Ksh 100');
            return;
        }

        if (!method) {
            alert('Please select a payment method');
            return;
        }

        if (method !== 'cash' && !transactionId) {
            alert('Please enter the transaction ID');
            return;
        }

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Show success
            alert('Contribution submitted successfully! Pending verification.');
            
            // Reset form
            form.reset();
            
            // Update contribution display (demo)
            this.updateContributionDisplay(amount);

        } catch (error) {
            console.error('Contribution error:', error);
            alert('Failed to submit contribution. Please try again.');
        }
    }

    updateContributionDisplay(amount) {
        const totalContributions = document.querySelector('.card:first-child .stat');
        const balance = document.querySelector('.card:nth-child(4) .stat');
        
        if (totalContributions && balance) {
            const currentTotal = parseInt(totalContributions.textContent.replace(/[^\d]/g, '')) || 0;
            const newTotal = currentTotal + parseInt(amount);
            totalContributions.textContent = `Ksh ${newTotal.toLocaleString()}`;
            
            const currentBalance = parseInt(balance.textContent.replace(/[^\d]/g, '')) || 0;
            balance.textContent = `Ksh ${(currentBalance + parseInt(amount)).toLocaleString()}`;
        }
    }

    validateLoanAmount(input) {
        const maxAmount = parseInt(input.max) || 9000;
        const minAmount = parseInt(input.min) || 500;
        const value = parseInt(input.value) || 0;

        if (value > maxAmount) {
            input.value = maxAmount;
            alert(`Maximum loan amount is Ksh ${maxAmount.toLocaleString()}`);
        } else if (value < minAmount) {
            input.value = '';
        }
    }

    async handleLoanApplication() {
        const form = this.loanForm;
        const amount = form.querySelector('input[type="number"]')?.value;
        const purpose = form.querySelector('select')?.value;
        const period = form.querySelectorAll('select')[1]?.value;
        const guarantor = form.querySelector('input[type="text"]')?.value;

        // Validation
        if (!amount || amount < 500) {
            alert('Minimum loan amount is Ksh 500');
            return;
        }

        if (!purpose) {
            alert('Please select a loan purpose');
            return;
        }

        if (!period) {
            alert('Please select a repayment period');
            return;
        }

        if (!guarantor) {
            alert('Please enter guarantor name');
            return;
        }

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Show success
            alert('Loan application submitted successfully! You will be notified once processed.');
            
            // Reset form
            form.reset();

        } catch (error) {
            console.error('Loan application error:', error);
            alert('Failed to submit loan application. Please try again.');
        }
    }

    handleProfileEdit() {
        alert('Profile editing feature coming soon! Please contact support for profile updates.');
    }

    loadMemberData() {
        // First, try to load from backend API
        this.fetchMemberDataFromAPI();
        
        // Also load saved member data as fallback
        const savedData = localStorage.getItem('swa_member_data');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.populateProfile(data);
        }
    }
    
    async fetchMemberDataFromAPI() {
        try {
            const result = await apiService.get('/auth/profile', {}, true, { preventAutoRedirect: true });
            
            if (result.success) {
                // Store the data locally
                localStorage.setItem('swa_member_data', JSON.stringify(result));
                this.populateProfile(result);
                console.log('Loaded member data from API:', result);
            }
        } catch (error) {
            // Don't let the apiService auto-redirect on 401 errors
            if (error.status === 401) {
                console.warn('Authentication expired, attempting token refresh...');
                
                // Try to refresh the token
                const refreshed = await apiService.refreshToken();
                
                if (refreshed) {
                    console.log('Token refreshed successfully, retrying request...');
                    // Retry the original request
                    try {
                        const result = await apiService.get('/auth/profile', {}, true, { preventAutoRedirect: true });
                        if (result.success) {
                            localStorage.setItem('swa_member_data', JSON.stringify(result));
                            this.populateProfile(result);
                            console.log('Loaded member data after token refresh:', result);
                            return;
                        }
                    } catch (retryError) {
                        console.warn('Retry after token refresh failed:', retryError.message);
                    }
                }
                
                // Token refresh failed, need to redirect to login
                console.log('Token refresh failed, redirecting to login...');
                localStorage.removeItem('swa_auth_token');
                localStorage.removeItem('swa_refresh_token');
                localStorage.removeItem('swa_user');
                window.location.href = '../../../auth/login-page.html?redirect=../member/member-portal.html';
                return;
            }
            console.warn('Failed to fetch member data from API:', error.status || error.message);
        }
    }

    populateProfile(data) {
        console.log('Full API response data:', data);
        
        // Handle both API response format and localStorage format
        const memberData = data.member || data;
        const services = data.services || {};
        const userData = data.user || {};
        
        console.log('Parsed data:', { memberData, userData, services });
        
        // Update welcome message
        const welcomeElement = document.getElementById('welcome-message');
        if (welcomeElement) {
            const firstName = memberData.firstName || userData.firstName || '';
            const lastName = memberData.lastName || userData.lastName || '';
            const fullName = (firstName + ' ' + lastName).trim();
            
            if (fullName) {
                welcomeElement.innerHTML = '<i class="fas fa-user-circle"></i> Welcome, ' + fullName;
                console.log('Updated welcome message to:', fullName);
            }
        }
        
        const profileInfo = document.querySelector('.profile-info');
        if (profileInfo) {
            // Update profile fields
            const nameField = document.getElementById('profile-name');
            if (nameField) {
                const fullName = `${memberData.firstName || userData.firstName || ''} ${memberData.lastName || userData.lastName || ''}`.trim();
                nameField.textContent = fullName;
            }
            
            // Update member number
            const memberNumField = document.getElementById('profile-member-number');
            if (memberNumField) {
                memberNumField.textContent = memberData.memberNumber || userData.memberNumber || 'Not assigned';
            }
            
            // Update email
            const emailField = document.getElementById('profile-email');
            if (emailField) {
                emailField.textContent = memberData.email || userData.email || 'Not available';
            }
            
            // Update phone
            const phoneField = document.getElementById('profile-phone');
            if (phoneField) {
                phoneField.textContent = memberData.phone || userData.phone || 'Not provided';
            }
            
            // Update member since
            const memberSinceField = document.getElementById('profile-member-since');
            if (memberSinceField) {
                // Registration date is in userData (user object), not memberData (member object)
                const registeredDate = userData.registeredAt;
                console.log('Available dates:', { 
                    userDataRegisteredAt: userData.registeredAt, 
                    memberDataRegisteredAt: memberData.registeredAt,
                    selectedDate: registeredDate 
                });
                
                if (registeredDate) {
                    const memberSince = new Date(registeredDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    });
                    memberSinceField.textContent = memberSince;
                    console.log('Formatted member since:', memberSince);
                } else {
                    memberSinceField.textContent = 'Unknown';
                    console.log('No registration date found in userData');
                }
            }
            
            // Update status
            const statusField = document.getElementById('profile-status');
            if (statusField) {
                const status = memberData.membershipStatus || userData.membershipStatus || 'Active';
                statusField.textContent = status;
                statusField.className = `status ${status.toLowerCase()}`;
            }
        }
        
        // Update service summaries if they exist on the page
        this.updateServiceDisplays(services);
    }
    
    updateServiceDisplays(services) {
        // Update savings display
        const savingsElements = document.querySelectorAll('[data-service="savings"]');
        savingsElements.forEach(el => {
            const amount = services.savings?.total || 0;
            el.textContent = `Ksh ${parseFloat(amount).toLocaleString()}`;
        });
        
        // Update contributions display
        const contributionElements = document.querySelectorAll('[data-service="contributions"]');
        contributionElements.forEach(el => {
            const amount = services.contributions?.total || 0;
            el.textContent = `Ksh ${parseFloat(amount).toLocaleString()}`;
        });
        
        // Update loans display
        const loanElements = document.querySelectorAll('[data-service="loans"]');
        loanElements.forEach(el => {
            const amount = services.loans?.balance || 0;
            el.textContent = `Ksh ${parseFloat(amount).toLocaleString()}`;
        });
        
        // Update debts display
        const debtElements = document.querySelectorAll('[data-service="debts"]');
        debtElements.forEach(el => {
            const amount = services.debts?.total || 0;
            el.textContent = `Ksh ${parseFloat(amount).toLocaleString()}`;
        });
        
        // Update fines display
        const fineElements = document.querySelectorAll('[data-service="fines"]');
        fineElements.forEach(el => {
            const amount = services.fines?.balance || 0;
            el.textContent = `Ksh ${parseFloat(amount).toLocaleString()}`;
        });
        
        // Update fines summary elements
        const totalFinesElements = document.querySelectorAll('[data-service="fines-total"]');
        totalFinesElements.forEach(el => {
            const fines = services.fines?.records || [];
            const total = fines.reduce((sum, fine) => sum + parseFloat(fine.amount || 0), 0);
            el.textContent = `Ksh ${total.toLocaleString()}`;
        });
        
        const paidFinesElements = document.querySelectorAll('[data-service="fines-paid"]');
        paidFinesElements.forEach(el => {
            const fines = services.fines?.records || [];
            const paid = fines.filter(f => f.status === 'paid').reduce((sum, fine) => sum + parseFloat(fine.amount || 0), 0);
            el.textContent = `Ksh ${paid.toLocaleString()}`;
        });
        
        const unpaidFinesElements = document.querySelectorAll('[data-service="fines-balance"]');
        unpaidFinesElements.forEach(el => {
            const amount = services.fines?.balance || 0;
            el.textContent = `Ksh ${parseFloat(amount).toLocaleString()}`;
        });
        
        const fineCountElements = document.querySelectorAll('[data-service="fines-count"]');
        fineCountElements.forEach(el => {
            const fines = services.fines?.records || [];
            el.textContent = fines.length;
        });
        
        // Update payments display
        const paymentElements = document.querySelectorAll('[data-service="payments"]');
        paymentElements.forEach(el => {
            const amount = services.payments?.total || 0;
            el.textContent = `Ksh ${parseFloat(amount).toLocaleString()}`;
        });
        
        // Populate contribution history table
        this.populateContributionTable(services.contributions?.records || []);
        
        // Populate fines table
        this.populateFinesTable(services.fines?.records || []);
        
        // Populate notifications
        this.populateNotifications(services.notices?.records || []);
        
        // Load loan eligibility
        this.loadLoanEligibility();
        
        // Load loan history
        this.loadLoanHistory();
        
        // Load payments history  
        this.loadPaymentsHistory();
        
        // Load contributions history
        this.loadContributionsHistory();
        
        console.log('Updated service displays with data:', services);
    }
    
    /**
     * Load and display loan eligibility
     */
    async loadLoanEligibility() {
        const loadingEl = document.getElementById('eligibilityLoading');
        const contentEl = document.getElementById('eligibilityContent');
        const errorEl = document.getElementById('eligibilityError');
        const applyBtn = document.getElementById('applyLoanBtn');
        
        if (!loadingEl || !contentEl || !errorEl) return;
        
        try {
            const result = await loanService.getEligibility();
            
            if (result.success && result.data) {
                const eligibility = result.data;
                
                // Hide loading, show content
                loadingEl.style.display = 'none';
                contentEl.style.display = 'block';
                errorEl.style.display = 'none';
                
                // Update eligibility status
                const statusEl = document.getElementById('eligibilityStatus');
                if (eligibility.eligible) {
                    statusEl.className = 'eligibility-status eligible';
                    statusEl.innerHTML = '<i class="fas fa-check-circle status-icon"></i><span class="status-text">You are eligible to apply for a loan</span>';
                    applyBtn.style.display = 'inline-block';
                } else {
                    statusEl.className = 'eligibility-status not-eligible';
                    statusEl.innerHTML = '<i class="fas fa-times-circle status-icon"></i><span class="status-text">Not eligible to apply</span>';
                    // Check if there's a specific restriction
                    if (eligibility.restrictions?.hasActiveLoan) {
                        statusEl.innerHTML = '<i class="fas fa-times-circle status-icon"></i><span class="status-text">You have an active loan to settle first</span>';
                    }
                    applyBtn.style.display = 'none';
                }
                
                // Update max loan amount
                const maxLoanEl = document.getElementById('maxLoanAmount');
                if (maxLoanEl) {
                    maxLoanEl.textContent = `Ksh ${eligibility.maxLoan.toLocaleString()}`;
                }
                
                // Update member score
                const scoreEl = document.getElementById('memberScore');
                if (scoreEl) {
                    const score = eligibility.score || 0;
                    scoreEl.textContent = score;
                    console.log('Score updated:', score, 'Eligibility data:', eligibility);
                }
                
                // Update reasons list
                const reasonsList = document.getElementById('reasonsList');
                if (reasonsList && eligibility.reasons) {
                    if (eligibility.reasons.length === 0) {
                        reasonsList.innerHTML = '<li><span>Great! You meet all eligibility criteria</span><span class="score-positive">✓</span></li>';
                    } else {
                        reasonsList.innerHTML = eligibility.reasons.map(reason => `
                            <li>
                                <span>${reason}</span>
                                <span class="score-negative">!</span>
                            </li>
                        `).join('');
                    }
                } else {
                    // Handle case where reasons might be undefined
                    const reasonsList = document.getElementById('reasonsList');
                    if (reasonsList) {
                        reasonsList.innerHTML = '<li><span>Eligibility information not available</span><span class="score-negative">?</span></li>';
                    }
                }
                
                // Update loan progress
                const progressEl = document.getElementById('loanProgressText');
                if (progressEl) {
                    const loanNum = eligibility.loanCount || 0;
                    let progressText = '';
                    if (loanNum === 0) {
                        progressText = 'This will be your first loan';
                    } else if (loanNum === 1) {
                        progressText = 'This will be your 2nd loan (After successful repayment)';
                    } else if (loanNum === 2) {
                        progressText = 'This will be your 3rd loan (Established borrower)';
                    } else {
                        progressText = `You have completed ${loanNum} loans successfully`;
                    }
                    progressEl.textContent = progressText;
                }
            } else {
                throw new Error(result.message || 'Failed to load eligibility');
            }
        } catch (error) {
            console.error('Error loading loan eligibility:', error);
            loadingEl.style.display = 'none';
            contentEl.style.display = 'none';
            errorEl.style.display = 'block';
        }
    }
    
    /**
     * Populate contribution history table
     */
    populateContributionTable(contributions) {
        const tbody = document.getElementById('contributionsTableBody');
        if (!tbody) return;
        
        if (contributions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No contributions found</td></tr>';
            return;
        }
        
        tbody.innerHTML = contributions.map(contribution => `
            <tr>
                <td>${new Date(contribution.date).toLocaleDateString()}</td>
                <td>Ksh ${parseFloat(contribution.amount).toLocaleString()}</td>
                <td>${contribution.method || 'N/A'}</td>
                <td><span class="status ${contribution.status === 'verified' ? 'received' : 'pending'}">
                    ${contribution.status === 'verified' ? '✓ Received' : '⏳ Pending'}
                </span></td>
            </tr>
        `).join('');
    }
    
    /**
     * Populate fines table
     */
    populateFinesTable(fines) {
        const tbody = document.getElementById('finesTableBody');
        if (!tbody) return;
        
        if (fines.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No fines found</td></tr>';
            return;
        }
        
        tbody.innerHTML = fines.map(fine => `
            <tr>
                <td><strong>${fine.fine_type || fine.type || 'General'}</strong></td>
                <td>Ksh ${parseFloat(fine.amount).toLocaleString()}</td>
                <td>${new Date(fine.date).toLocaleDateString()}</td>
                <td>${new Date(fine.due_date).toLocaleDateString()}</td>
                <td><span class="status ${fine.status === 'paid' ? 'received' : fine.status === 'pending' ? 'pending' : 'unpaid'}">
                    ${fine.status === 'paid' ? '✓ Paid' : fine.status === 'pending' ? '⏳ Pending' : '⚠ Unpaid'}
                </span></td>
                <td>
                    ${fine.status === 'unpaid' ? `<button onclick="window.location.href='../payments/make-payment.html?category=fine&fineId=${fine.id}'" class="btn" style="padding: 5px 10px; font-size: 12px;">Pay Now</button>` : '-'}
                </td>
            </tr>
        `).join('');
    }
    
    /**
     * Populate notifications section
     */
    populateNotifications(notices) {
        const container = document.getElementById('notificationCards');
        if (!container) return;
        
        if (notices.length === 0) {
            container.innerHTML = '<div class="no-notifications"><i class="fas fa-bell-slash"></i> No notifications at this time</div>';
            return;
        }
        
        container.innerHTML = notices.map(notice => {
            const iconClass = this.getNotificationIcon(notice.type);
            const timeAgo = this.getTimeAgo(notice.createdAt);
            const isUnread = !notice.views || notice.views === 0;
            
            return `
                <div class="notification-card ${isUnread ? 'unread' : ''}" onclick="this.markAsRead('${notice.id}')">
                    <div class="card-icon">
                        <i class="${iconClass}"></i>
                        ${isUnread ? '<span class="unread-dot"></span>' : ''}
                    </div>
                    <div class="card-content">
                        <h3>${notice.title}</h3>
                        <p>${notice.content}</p>
                        <span class="time">${timeAgo}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Get appropriate icon for notification type
     */
    getNotificationIcon(type) {
        const icons = {
            'general': 'fas fa-info-circle',
            'important': 'fas fa-exclamation-triangle',
            'urgent': 'fas fa-exclamation-circle',
            'event': 'fas fa-calendar-alt',
            'meeting': 'fas fa-users',
            'reminder': 'fas fa-bell'
        };
        return icons[type] || 'fas fa-info-circle';
    }
    
    /**
     * Get time ago string
     */
    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor(diffMs / (1000 * 60));
        
        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else {
            return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        }
    }
    
    /**
     * Mark notification as read
     */
    async markAsRead(noticeId) {
        try {
            await apiService.post(`/notices/${noticeId}/read`, {}, true);
            // Remove unread indicator
            const notificationCard = document.querySelector(`[onclick*="${noticeId}"]`);
            if (notificationCard) {
                notificationCard.classList.remove('unread');
                const unreadDot = notificationCard.querySelector('.unread-dot');
                if (unreadDot) unreadDot.remove();
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }
    
    /**
     * Handle logout
     */
    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            authService.logout();
        }
    }

    /**
     * Load loan history
     */
    async loadLoanHistory() {
        const loadingEl = document.getElementById('loansLoading');
        const tbody = document.getElementById('loansTableBody');
        const noDataEl = document.getElementById('loansNoData');
        
        if (!loadingEl || !tbody) return;

        try {
            loadingEl.style.display = 'block';
            tbody.innerHTML = '';
            if (noDataEl) noDataEl.style.display = 'none';

            const result = await loanService.getAll();
            
            if (result.success && result.data) {
                const loans = result.data;
                
                if (loans.length === 0) {
                    if (noDataEl) noDataEl.style.display = 'block';
                    this.updateLoanSummary([]);
                } else {
                    this.populateLoansTable(loans);
                    this.updateLoanSummary(loans);
                }
            } else {
                throw new Error(result.message || 'Failed to load loan history');
            }
        } catch (error) {
            console.error('Error loading loan history:', error);
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #dc2626;">Error loading loan history</td></tr>';
        } finally {
            loadingEl.style.display = 'none';
        }
    }

    /**
     * Populate loans table
     */
    populateLoansTable(loans) {
        const tbody = document.getElementById('loansTableBody');
        if (!tbody) return;

        tbody.innerHTML = loans.slice(0, 5).map(loan => `
            <tr>
                <td><strong>${loan.loanNumber || loan.loan_number || 'N/A'}</strong></td>
                <td>Ksh ${parseFloat(loan.amount || loan.principalAmount || 0).toLocaleString()}</td>
                <td><span class="status ${this.getLoanStatusClass(loan.status)}">
                    ${this.formatLoanStatus(loan.status)}
                </span></td>
                <td>${new Date(loan.applicationDate || loan.createdAt).toLocaleDateString()}</td>
                <td>${loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A'}</td>
                <td>Ksh ${parseFloat(loan.remainingBalance || loan.balance || 0).toLocaleString()}</td>
                <td>
                    <button onclick="window.location.href='../loans/details.html?id=${loan.id}'" class="btn-small">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Update loan summary cards
     */
    updateLoanSummary(loans) {
        const activeLoans = loans.filter(loan => ['pending', 'active', 'overdue'].includes(loan.status));
        const totalBorrowed = loans.reduce((sum, loan) => sum + parseFloat(loan.amount || loan.principalAmount || 0), 0);
        const outstandingBalance = activeLoans.reduce((sum, loan) => sum + parseFloat(loan.remainingBalance || loan.balance || 0), 0);

        this.updateElement('activeLoansCount', activeLoans.length);
        this.updateElement('totalBorrowed', `Ksh ${totalBorrowed.toLocaleString()}`);
        this.updateElement('outstandingBalance', `Ksh ${outstandingBalance.toLocaleString()}`);
    }

    /**
     * Load payments history
     */
    async loadPaymentsHistory() {
        const loadingEl = document.getElementById('paymentsLoading');
        const tbody = document.getElementById('paymentsTableBody');
        const noDataEl = document.getElementById('paymentsNoData');
        
        if (!loadingEl || !tbody) return;

        try {
            loadingEl.style.display = 'block';
            tbody.innerHTML = '';
            if (noDataEl) noDataEl.style.display = 'none';

            const result = await paymentService.getAll();
            
            if (result.success && result.data) {
                const payments = result.data;
                
                if (payments.length === 0) {
                    if (noDataEl) noDataEl.style.display = 'block';
                    this.updatePaymentsSummary([]);
                } else {
                    this.populatePaymentsTable(payments);
                    this.updatePaymentsSummary(payments);
                }
            } else {
                throw new Error(result.message || 'Failed to load payment history');
            }
        } catch (error) {
            console.error('Error loading payment history:', error);
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #dc2626;">Error loading payment history</td></tr>';
        } finally {
            loadingEl.style.display = 'none';
        }
    }

    /**
     * Populate payments table
     */
    populatePaymentsTable(payments) {
        const tbody = document.getElementById('paymentsTableBody');
        if (!tbody) return;

        tbody.innerHTML = payments.slice(0, 5).map(payment => `
            <tr>
                <td><strong>${payment.paymentNumber || payment.payment_id || payment.id}</strong></td>
                <td>${this.formatPaymentType(payment.type)}</td>
                <td>Ksh ${parseFloat(payment.amount || 0).toLocaleString()}</td>
                <td>${this.formatPaymentMethod(payment.method)}</td>
                <td>${new Date(payment.paymentDate || payment.date || payment.createdAt).toLocaleDateString()}</td>
                <td><span class="status ${this.getPaymentStatusClass(payment.status)}">
                    ${this.formatPaymentStatus(payment.status)}
                </span></td>
                <td>${payment.reference || payment.transactionId || 'N/A'}</td>
            </tr>
        `).join('');
    }

    /**
     * Update payments summary cards
     */
    updatePaymentsSummary(payments) {
        const totalPayments = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const thisMonthPayments = payments
            .filter(payment => {
                const paymentDate = new Date(payment.paymentDate || payment.date || payment.createdAt);
                return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
            })
            .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
        const pendingPayments = payments.filter(payment => payment.status === 'pending').length;

        this.updateElement('totalPayments', `Ksh ${totalPayments.toLocaleString()}`);
        this.updateElement('thisMonthPayments', `Ksh ${thisMonthPayments.toLocaleString()}`);
        this.updateElement('pendingPayments', pendingPayments);
    }

    /**
     * Load contribution history
     */
    async loadContributionsHistory() {
        const loadingEl = document.getElementById('contributionsLoading');
        const tbody = document.getElementById('contributionsTableBody');
        const noDataEl = document.getElementById('contributionsNoData');
        
        if (!loadingEl || !tbody) return;

        try {
            loadingEl.style.display = 'block';
            tbody.innerHTML = '';
            if (noDataEl) noDataEl.style.display = 'none';

            const result = await contributionService.getAll();
            
            if (result.success && result.data) {
                const contributions = result.data;
                
                if (contributions.length === 0) {
                    if (noDataEl) noDataEl.style.display = 'block';
                    this.updateContributionsSummary([]);
                } else {
                    this.populateContributionTable(contributions);
                    this.updateContributionsSummary(contributions);
                }
            } else {
                throw new Error(result.message || 'Failed to load contribution history');
            }
        } catch (error) {
            console.error('Error loading contribution history:', error);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #dc2626;">Error loading contribution history</td></tr>';
        } finally {
            loadingEl.style.display = 'none';
        }
    }

    /**
     * Update contributions summary cards
     */
    updateContributionsSummary(contributions) {
        const totalContributions = contributions.reduce((sum, contribution) => sum + parseFloat(contribution.amount || 0), 0);
        const currentYear = new Date().getFullYear();
        const thisYearContributions = contributions
            .filter(contribution => {
                const contributionDate = new Date(contribution.date || contribution.createdAt);
                return contributionDate.getFullYear() === currentYear;
            })
            .reduce((sum, contribution) => sum + parseFloat(contribution.amount || 0), 0);
        const pendingContributions = contributions.filter(contribution => contribution.status === 'pending').length;

        this.updateElement('totalContributions', `Ksh ${totalContributions.toLocaleString()}`);
        this.updateElement('thisYearContributions', `Ksh ${thisYearContributions.toLocaleString()}`);
        this.updateElement('pendingContributions', pendingContributions);
    }

    /**
     * Helper methods for formatting
     */
    getLoanStatusClass(status) {
        const statusMap = {
            'completed': 'received',
            'active': 'pending',
            'pending': 'pending',
            'overdue': 'unpaid',
            'rejected': 'unpaid',
            'defaulted': 'unpaid'
        };
        return statusMap[status] || 'pending';
    }

    formatLoanStatus(status) {
        const statusMap = {
            'completed': '✓ Completed',
            'active': '🔄 Active',
            'pending': '⏳ Pending',
            'overdue': '⚠ Overdue',
            'rejected': '✗ Rejected',
            'defaulted': '⚠ Defaulted'
        };
        return statusMap[status] || status;
    }

    getPaymentStatusClass(status) {
        const statusMap = {
            'completed': 'received',
            'verified': 'received',
            'success': 'received',
            'pending': 'pending',
            'processing': 'pending',
            'failed': 'unpaid',
            'cancelled': 'unpaid'
        };
        return statusMap[status] || 'pending';
    }

    formatPaymentStatus(status) {
        const statusMap = {
            'completed': '✓ Completed',
            'verified': '✓ Verified',
            'success': '✓ Success',
            'pending': '⏳ Pending',
            'processing': '🔄 Processing',
            'failed': '✗ Failed',
            'cancelled': '✗ Cancelled'
        };
        return statusMap[status] || status;
    }

    formatPaymentType(type) {
        const typeMap = {
            'contribution': 'Contribution',
            'loan_payment': 'Loan Payment',
            'fine_payment': 'Fine Payment',
            'membership_fee': 'Membership Fee',
            'other': 'Other'
        };
        return typeMap[type] || type;
    }

    formatPaymentMethod(method) {
        const methodMap = {
            'mpesa': 'M-Pesa',
            'bank_transfer': 'Bank Transfer',
            'cash': 'Cash',
            'cheque': 'Cheque',
            'card': 'Card'
        };
        return methodMap[method] || method;
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MemberPortal();
});

// Export for module use
export default MemberPortal;

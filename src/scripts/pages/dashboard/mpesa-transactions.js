/**
 * M-Pesa Transactions Script
 * Handles M-Pesa transactions display and management
 * 
 * @version 1.0.0
 */

import { showAlert } from '../../../utils/utility-functions.js';

class MpesaTransactions {
    constructor() {
        this.transactions = [];
        this.currentPage = 1;
        this.limit = 20;
        this.init();
    }

    init() {
        this.initSidebar();
        this.loadTransactions();
    }

    initSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
            });
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            });
        }
    }

    async loadTransactions() {
        try {
            const token = localStorage.getItem('swa_auth_token');
            if (!token) {
                this.showError('Authentication required. Please login again.');
                return;
            }

            const response = await fetch(`/api/mpesa/transactions?page=${this.currentPage}&limit=${this.limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                this.transactions = data.data || [];
                this.renderTransactions();
            } else {
                this.showError(data.message || 'Failed to load transactions');
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showError('Error loading transactions. Please try again.');
        }
    }

    renderTransactions() {
        const tbody = document.getElementById('transactionsTableBody');
        if (!tbody) return;

        if (this.transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <p>No transactions found</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.transactions.map(transaction => `
            <tr>
                <td>${transaction.paymentNumber || 'N/A'}</td>
                <td>${transaction.phone || 'N/A'}</td>
                <td>KES ${parseFloat(transaction.amount || 0).toLocaleString()}</td>
                <td>
                    <span class="status ${this.getStatusClass(transaction.status)}">
                        ${transaction.status || 'Unknown'}
                    </span>
                </td>
                <td>${this.formatDate(transaction.paymentDate)}</td>
                <td>${this.getMpesaReference(transaction)}</td>
            </tr>
        `).join('');
    }

    getMpesaReference(transaction) {
        // Try to get M-Pesa reference from multiple possible fields
        if (transaction.mpesa && transaction.mpesa.TransID) {
            return transaction.mpesa.TransID;
        }
        if (transaction.transactionId) {
            return transaction.transactionId;
        }
        if (transaction.reference) {
            return transaction.reference;
        }
        return transaction.paymentNumber || 'N/A';
    }

    getStatusClass(status) {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'success':
                return 'active';
            case 'pending':
                return 'pending';
            case 'failed':
                return 'overdue';
            default:
                return '';
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showError(message) {
        const tbody = document.getElementById('transactionsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <p style="color: var(--error-color);">${message}</p>
                    </td>
                </tr>
            `;
        }
        showAlert(message, 'Error', 'error');
    }
}

// Initialize transactions page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MpesaTransactions();
});

// Import services
import { authService, memberService } from '../../../services/index.js';
import { showNotification, formatDate } from '../../../utils/utility-functions.js';

class Members {
    constructor() {
        this.members = [];
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.initSidebar();
        this.initEventListeners();
        this.loadMembers();
    }

    async checkAuth() {
        if (!authService.isAuthenticated()) {
            window.location.href = '../../../auth/login-page.html';
            return false;
        }
        
        const user = authService.getCurrentUser();
        if (!user || user.role !== 'admin') {
            window.location.href = '../../../auth/login-page.html';
            return false;
        }
        return true;
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

    initEventListeners() {
        // Search functionality
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchMembers(e.target.value));
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterMembers(e.target.dataset.filter);
            });
        });

        const logoutBtn = document.querySelector('.logout-btn-header');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async loadMembers() {
        try {
            console.log('Loading members...');
            const response = await memberService.getAllMembers();
            // Handle API response structure: { success: true, data: members, pagination: {...} }
            this.members = response.data || response || [];
            this.renderMembers(this.members);
        } catch (error) {
            console.error('Failed to load members:', error);
            // Show demo data if API fails
            this.loadDemoData();
        }
    }

    loadDemoData() {
        // Demo data for demonstration when API is not available
        this.members = [
            { id: 1, memberNumber: 'SWA001', firstName: 'Vincent', lastName: 'Otieno', email: 'vincent@joust.ac.ke', phone: '+254712345678', joinDate: '2024-01-15', membershipStatus: 'active' },
            { id: 2, memberNumber: 'SWA002', firstName: 'Sarah', lastName: 'Wanjiku', email: 'sarah@joust.ac.ke', phone: '+254723456789', joinDate: '2024-02-20', membershipStatus: 'active' },
            { id: 3, memberNumber: 'SWA003', firstName: 'James', lastName: 'Kiplagat', email: 'james@joust.ac.ke', phone: '+254734567890', joinDate: '2024-03-10', membershipStatus: 'pending' },
            { id: 4, memberNumber: 'SWA004', firstName: 'Grace', lastName: 'Akinyi', email: 'grace@joust.ac.ke', phone: '+254745678901', joinDate: '2024-04-05', membershipStatus: 'active' },
            { id: 5, memberNumber: 'SWA005', firstName: 'Michael', lastName: 'Ochieng', email: 'michael@joust.ac.ke', phone: '+254756789012', joinDate: '2024-05-12', membershipStatus: 'inactive' }
        ];
        this.renderMembers(this.members);
    }

    renderMembers(members) {
        const tbody = document.getElementById('members-table');
        if (!tbody) return;

        if (!members || members.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No members found</td></tr>';
            return;
        }

        tbody.innerHTML = members.map(member => {
            const statusClass = member.membershipStatus === 'active' ? 'received' : 
                               member.membershipStatus === 'pending' ? 'pending' : 'overdue';
            const statusText = member.membershipStatus === 'active' ? 'Active' : 
                              member.membershipStatus === 'pending' ? 'Pending' : 'Inactive';
            return `
                <tr>
                    <td>${member.memberNumber || member.id || 'N/A'}</td>
                    <td>${member.firstName || ''} ${member.lastName || ''}</td>
                    <td>${member.email || 'N/A'}</td>
                    <td>${member.phone || 'N/A'}</td>
                    <td>${formatDate(member.joinDate || member.createdAt)}</td>
                    <td><span class="status ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="btn" onclick="Members.viewMember('${member.id}')">View</button>
                        <button class="btn" onclick="Members.editMember('${member.id}')">Edit</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    searchMembers(query) {
        console.log('Searching members:', query);
        const filtered = this.members.filter(member => 
            `${member.firstName} ${member.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
            member.email?.toLowerCase().includes(query.toLowerCase()) ||
            member.memberNumber?.toLowerCase().includes(query.toLowerCase())
        );
        this.renderMembers(filtered);
    }

    filterMembers(status) {
        console.log('Filtering members by status:', status);
        const filtered = status === 'all' ? this.members : 
            this.members.filter(member => member.membershipStatus === status);
        this.renderMembers(filtered);
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            localStorage.removeItem('swa_auth_token');
            localStorage.removeItem('swa_refresh_token');
            localStorage.removeItem('swa_user');
            window.location.href = '/index.html';
        }
    }

    // Static methods for member actions
    static viewMember(memberId) {
        console.log('Viewing member:', memberId);
        window.location.href = '/pages/dashboard/admin/member-details.html?id=' + memberId;
    }

    static editMember(memberId) {
        console.log('Editing member:', memberId);
        window.location.href = '/pages/dashboard/admin/edit-member.html?id=' + memberId;
    }
}

// Make class available globally for onclick handlers
window.Members = Members;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.membersInstance = new Members();
});

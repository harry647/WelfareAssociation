/**
 * Fine Service
 * Handles fines collection and management
 * 
 * @version 1.1.0 - Added configurable fine types support
 */

import { apiService } from './api-service.js';
import { API_CONFIG } from '../config/app-config.js';

/**
 * Fine Types - Default configurable fine types
 * These can be managed from the admin settings
 */
export const DEFAULT_FINE_TYPES = [
    {
        id: 1,
        name: 'Missed Meeting',
        amount: 200,
        category: 'attendance',
        description: 'Fine for missing a scheduled meeting',
        isActive: true
    },
    {
        id: 2,
        name: 'Late to Meeting',
        amount: 50,
        category: 'attendance',
        description: 'Fine for arriving late to meetings',
        isActive: true
    },
    {
        id: 3,
        name: 'Speaking Without Permission',
        amount: 20,
        category: 'conduct',
        description: 'Fine for speaking without permission during meetings',
        isActive: true
    },
    {
        id: 4,
        name: 'Not Writing Shares',
        amount: 100,
        category: 'contributions',
        description: 'Fine for not contributing monthly shares on time',
        isActive: true
    },
    {
        id: 5,
        name: 'Late Payment',
        amount: 500,
        category: 'payments',
        description: 'Fine for late monthly contribution payment',
        isActive: true
    },
    {
        id: 6,
        name: 'Missing Event',
        amount: 1000,
        category: 'attendance',
        description: 'Fine for missing mandatory events',
        isActive: true
    },
    {
        id: 7,
        name: 'Missing Report',
        amount: 750,
        category: 'administrative',
        description: 'Fine for failing to submit required reports',
        isActive: true
    },
    {
        id: 8,
        name: 'Policy Violation',
        amount: 2000,
        category: 'conduct',
        description: 'Fine for violating association policies',
        isActive: true
    }
];

// Storage key for custom fine types
const FINE_TYPES_KEY = 'swa_fine_types';

/**
 * Fine Service - Fine operations
 */
class FineService {
    constructor() {
        this.fineTypes = this.loadFineTypes();
    }

    /**
     * Load fine types from localStorage or use defaults
     */
    loadFineTypes() {
        const stored = localStorage.getItem(FINE_TYPES_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Error parsing stored fine types:', e);
                return [...DEFAULT_FINE_TYPES];
            }
        }
        return [...DEFAULT_FINE_TYPES];
    }

    /**
     * Save fine types to localStorage
     */
    saveFineTypes(fineTypes) {
        localStorage.setItem(FINE_TYPES_KEY, JSON.stringify(fineTypes));
        this.fineTypes = fineTypes;
    }

    /**
     * Get all fine types (configurable)
     */
    getFineTypes() {
        return this.fineTypes.filter(ft => ft.isActive);
    }

    /**
     * Get all fine types including inactive ones (for admin)
     */
    getAllFineTypes() {
        return this.fineTypes;
    }

    /**
     * Get fine type by ID
     * @param {number} id - Fine type ID
     */
    getFineTypeById(id) {
        return this.fineTypes.find(ft => ft.id === parseInt(id));
    }

    /**
     * Add a new fine type
     * @param {Object} fineType - Fine type data
     */
    addFineType(fineType) {
        const newId = Math.max(...this.fineTypes.map(ft => ft.id), 0) + 1;
        const newFineType = {
            id: newId,
            ...fineType,
            isActive: true
        };
        this.fineTypes.push(newFineType);
        this.saveFineTypes(this.fineTypes);
        return newFineType;
    }

    /**
     * Update a fine type
     * @param {number} id - Fine type ID
     * @param {Object} fineTypeData - Updated data
     */
    updateFineType(id, fineTypeData) {
        const index = this.fineTypes.findIndex(ft => ft.id === parseInt(id));
        if (index !== -1) {
            this.fineTypes[index] = { ...this.fineTypes[index], ...fineTypeData };
            this.saveFineTypes(this.fineTypes);
            return this.fineTypes[index];
        }
        return null;
    }

    /**
     * Toggle fine type active status
     * @param {number} id - Fine type ID
     */
    toggleFineTypeStatus(id) {
        const index = this.fineTypes.findIndex(ft => ft.id === parseInt(id));
        if (index !== -1) {
            this.fineTypes[index].isActive = !this.fineTypes[index].isActive;
            this.saveFineTypes(this.fineTypes);
            return this.fineTypes[index];
        }
        return null;
    }

    /**
     * Delete a fine type (soft delete - just deactivate)
     * @param {number} id - Fine type ID
     */
    deleteFineType(id) {
        return this.toggleFineTypeStatus(id);
    }

    /**
     * Reset fine types to defaults
     */
    resetFineTypesToDefaults() {
        this.saveFineTypes([...DEFAULT_FINE_TYPES]);
        return this.fineTypes;
    }

    /**
     * Get fines by category
     * @param {string} category - Fine category
     */
    getFineTypesByCategory(category) {
        return this.fineTypes.filter(ft => ft.category === category && ft.isActive);
    }

    /**
     * Get all unique categories
     */
    getCategories() {
        return [...new Set(this.fineTypes.map(ft => ft.category))];
    }

    // ==================== Fine Records Operations ====================

    /**
     * Get all fines
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
        return apiService.get(API_CONFIG.endpoints.fines, params, true);
    }

    /**
     * Get fine by ID
     * @param {string|number} id - Fine ID
     */
    async getById(id) {
        return apiService.get(`${API_CONFIG.endpoints.fines}/${id}`, {}, true);
    }

    /**
     * Get fines by member
     * @param {string|number} memberId - Member ID
     */
    async getByMember(memberId) {
        return apiService.get(
            API_CONFIG.endpoints.fines,
            { memberId },
            true
        );
    }

    /**
     * Get pending fines
     */
    async getPending() {
        return apiService.get(
            `${API_CONFIG.endpoints.fines}/pending`,
            {},
            true
        );
    }

    /**
     * Get paid fines
     */
    async getPaid() {
        return apiService.get(
            `${API_CONFIG.endpoints.fines}/paid`,
            {},
            true
        );
    }

    /**
     * Issue fine (Admin only)
     * @param {Object} fineData - Fine data
     */
    async issue(fineData) {
        return apiService.post(API_CONFIG.endpoints.fines, fineData, true);
    }

    /**
     * Update fine (Admin only)
     * @param {string|number} id - Fine ID
     * @param {Object} fineData - Fine data to update
     */
    async update(id, fineData) {
        return apiService.put(`${API_CONFIG.endpoints.fines}/${id}`, fineData, true);
    }

    /**
     * Mark fine as paid
     * @param {string|number} id - Fine ID
     * @param {Object} paymentData - Payment data
     */
    async markAsPaid(id, paymentData = {}) {
        return apiService.patch(
            `${API_CONFIG.endpoints.fines}/${id}/pay`,
            paymentData,
            true
        );
    }

    /**
     * Waive fine (Admin only)
     * @param {string|number} id - Fine ID
     * @param {Object} waiverData - Waiver data
     */
    async waive(id, waiverData = {}) {
        return apiService.patch(
            `${API_CONFIG.endpoints.fines}/${id}/waive`,
            waiverData,
            true
        );
    }

    /**
     * Send fine reminder
     * @param {string|number} fineId - Fine ID
     */
    async sendReminder(fineId) {
        return apiService.post(
            `${API_CONFIG.endpoints.fines}/${fineId}/remind`,
            {},
            true
        );
    }

    /**
     * Delete fine (Admin only)
     * @param {string|number} id - Fine ID
     */
    async delete(id) {
        return apiService.delete(`${API_CONFIG.endpoints.fines}/${id}`, true);
    }

    /**
     * Get fine statistics
     */
    async getStatistics() {
        return apiService.get(
            `${API_CONFIG.endpoints.fines}/statistics`,
            {},
            true
        );
    }

    /**
     * Get total outstanding fines
     */
    async getTotalOutstanding() {
        return apiService.get(
            `${API_CONFIG.endpoints.fines}/total`,
            {},
            true
        );
    }

    /**
     * Get member fine summary (total, paid, balance)
     * @param {string} memberId - Member ID
     */
    getMemberFineSummary(memberId) {
        const fines = this.getMemberFinesFromStorage(memberId);
        const total = fines.reduce((sum, f) => sum + f.amount, 0);
        const paid = fines.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
        const unpaid = fines.filter(f => f.status !== 'paid').reduce((sum, f) => sum + f.amount, 0);
        
        return {
            total,
            paid,
            unpaid,
            count: fines.length
        };
    }

    /**
     * Get member fines from localStorage (for demo/offline)
     * @param {string} memberId - Member ID
     */
    getMemberFinesFromStorage(memberId) {
        const storageKey = `swa_member_fines_${memberId}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    /**
     * Save member fines to localStorage (for demo/offline)
     * @param {string} memberId - Member ID
     * @param {Array} fines - Fines array
     */
    saveMemberFinesToStorage(memberId, fines) {
        const storageKey = `swa_member_fines_${memberId}`;
        localStorage.setItem(storageKey, JSON.stringify(fines));
    }

    /**
     * Issue a new fine to a member (localStorage version for demo)
     * @param {string} memberId - Member ID
     * @param {Object} fineData - Fine data including fineTypeId
     */
    issueFineToMember(memberId, fineData) {
        const fineType = this.getFineTypeById(fineData.fineTypeId);
        if (!fineType) {
            throw new Error('Invalid fine type');
        }

        const fines = this.getMemberFinesFromStorage(memberId);
        const newFine = {
            id: Date.now(),
            member_id: memberId,
            fine_type: fineType.name,
            fine_type_id: fineType.id,
            amount: fineData.amount || fineType.amount,
            date: fineData.date || new Date().toISOString().split('T')[0],
            due_date: fineData.dueDate || this.addDays(new Date(), 14).toISOString().split('T')[0],
            status: 'unpaid',
            description: fineData.description || '',
            paid_date: null,
            payment_method: null
        };

        fines.push(newFine);
        this.saveMemberFinesToStorage(memberId, fines);
        return newFine;
    }

    /**
     * Mark fine as paid (localStorage version for demo)
     * @param {string} memberId - Member ID
     * @param {number} fineId - Fine ID
     * @param {Object} paymentData - Payment data
     */
    payFine(memberId, fineId, paymentData = {}) {
        const fines = this.getMemberFinesFromStorage(memberId);
        const index = fines.findIndex(f => f.id === fineId);
        
        if (index !== -1) {
            fines[index].status = 'paid';
            fines[index].paid_date = new Date().toISOString().split('T')[0];
            fines[index].payment_method = paymentData.method || 'M-Pesa';
            this.saveMemberFinesToStorage(memberId, fines);
            return fines[index];
        }
        return null;
    }

    /**
     * Helper: Add days to date
     */
    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
}

// Export singleton instance
export const fineService = new FineService();

// Export class for custom instances
export default FineService;
/**
 * Events Report Script
 * Handles events report functionality with dynamic data from database
 */

import { eventService } from '../../../services/event-service.js';
import { formatCurrency, formatDate } from '../../../utils/utility-functions.js';
import { APP_CONFIG } from '../../../config/app-config.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Events report loaded');
    loadEventsData();
});

async function loadEventsData() {
    try {
        // Get token from localStorage
        const token = localStorage.getItem(APP_CONFIG.storageKeys.authToken);
        if (!token) {
            console.warn('No authentication token found');
            displayEmptyState();
            return;
        }

        // Fetch events data from API
        const response = await eventService.getAll();
        
        if (response && response.success) {
            updateReportUI(response.data || []);
        } else {
            console.warn('Failed to fetch events data:', response?.message || 'Unknown error');
            displayEmptyState();
        }
    } catch (error) {
        console.error('Error loading events report:', error);
        displayEmptyState();
    }
}

function updateReportUI(events) {
    if (!events || events.length === 0) {
        displayEmptyState();
        return;
    }
    
    const now = new Date();
    const upcoming = events.filter(e => new Date(e.startDate) > now).length;
    const completed = events.filter(e => new Date(e.endDate) < now).length;
    const totalAttendees = events.reduce((sum, e) => sum + (e.attendees || 0), 0);
    
    // Update summary stats
    updateStatCard('stat-number', events.length, 0);
    updateStatCard('stat-number', upcoming, 1);
    updateStatCard('stat-number', completed, 2);
    updateStatCard('stat-number', totalAttendees, 3);
    
    // Update table
    updateEventsTable(events);
}

function updateStatCard(className, value, index) {
    const cards = document.querySelectorAll(`.${className}`);
    if (cards[index]) {
        cards[index].textContent = value;
    }
}

function updateEventsTable(events) {
    const tbody = document.querySelector('.report-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = events.map(event => {
        const status = getEventStatus(event);
        const statusClass = getStatusClass(status);
        
        return `
            <tr>
                <td>${formatDate(event.startDate)}</td>
                <td>${event.title || 'Untitled Event'}</td>
                <td>${event.location || 'TBA'}</td>
                <td>${event.attendees || 0}</td>
                <td><span class="status ${statusClass}">${status}</span></td>
            </tr>
        `;
    }).join('');
}

function getEventStatus(event) {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    
    if (start > now) return 'Upcoming';
    if (end < now) return 'Completed';
    return 'Ongoing';
}

function getStatusClass(status) {
    const statusMap = {
        'upcoming': 'pending',
        'completed': 'verified',
        'ongoing': 'approved',
        'cancelled': 'rejected'
    };
    return statusMap[status?.toLowerCase()] || 'pending';
}

function displayEmptyState() {
    // Update summary stats to show 0
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(el => {
        el.textContent = '0';
    });
    
    // Update table to show empty message
    const tbody = document.querySelector('.report-table tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px;">
                    No event records found.
                </td>
            </tr>
        `;
    }
}
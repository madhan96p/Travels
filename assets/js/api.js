/**
 * Shrish Travels API Service
 * Centralizes all communication with Netlify Functions (Backend)
 */

const API_BASE_URL = '/.netlify/functions/travels-api';

const ApiService = {

    // 1. Get All Routes (For routes.html)
    async getRoutes() {
        try {
            const response = await fetch(`${API_BASE_URL}?action=getRoutes`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error("Error fetching routes:", error);
            return []; // Return empty array on error to prevent crash
        }
    },

    // 2. Get Tariff Data (For tariff.html)
    async getTariff() {
        try {
            const response = await fetch(`${API_BASE_URL}?action=getTariff`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error("Error fetching tariffs:", error);
            return { local: [], outstation: [] };
        }
    },

    // 3. Submit Quick Lead (For Home Page / WhatsApp Click)
    async submitLead(data) {
        try {
            const response = await fetch(`${API_BASE_URL}?action=submitLead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error("Error submitting lead:", error);
            return { success: false };
        }
    },

    // 4. Submit Full Booking (For Booking Page)
    async submitBooking(data) {
        try {
            const response = await fetch(`${API_BASE_URL}?action=submitBooking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error("Error submitting booking:", error);
            throw error; // Let the booking page handle the error alert
        }
    },

    async submitCareer(data) {
        try {
            const response = await fetch(`${API_BASE_URL}?action=submitCareer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Career Submission Error:", error);
            throw error; // Let the form handle the error message
        }
    }

};

// Make it available globally (so index.js and other files can use it)
window.ApiService = ApiService;
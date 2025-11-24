// assets/js/api.js

const API_CONFIG = {
    SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwY6JLOSO9zZUcBkQ_38EIKMLWMwCZtpotLo61D_rsaRzBltxF5AhK-Mz8y9kST3mQC/exec",
    WHATSAPP_NUM: "918883451668"
};

const ApiService = {
    /**
     * Send lead data to Google Sheets
     */
    submitLead: async (formData) => {
        try {
            await fetch(API_CONFIG.SCRIPT_URL, {
                method: 'POST',
                body: formData,
                mode: 'no-cors'
            });
            return { success: true };
        } catch (error) {
            console.error("API Error:", error);
            return { success: false, error };
        }
    },

    /**
     * Generate WhatsApp Link
     */
    getWhatsAppLink: (text) => {
        return `https://wa.me/${API_CONFIG.WHATSAPP_NUM}?text=${text}`;
    },

    /**
     * Fetch Routes Data
     */
    getRoutes: async () => {
        const response = await fetch('assets/data/routes.json');
        return await response.json();
    }
};

// Expose to window for global access
window.ApiService = ApiService;
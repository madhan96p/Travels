const API_CONFIG = {
    // We are using 'travels-api', NOT 'submit-booking'
    FUNCTION_URL: "/.netlify/functions/travels-api", 
    WHATSAPP_NUM: "918883451668"
};

const ApiService = {
    submitLead: async (formData) => {
        try {
            const plainData = Object.fromEntries(formData.entries());
            
            // Sends data to travels-api.js
            const response = await fetch(`${API_CONFIG.FUNCTION_URL}?action=submitBooking`, {
                method: 'POST',
                body: JSON.stringify(plainData)
            });
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            return { success: false };
        }
    },
    
    getRoutes: async () => {
        // Fetches from local JSON file
        try {
            const response = await fetch('assets/data/routes.json');
            return await response.json();
        } catch (e) { return []; }
    }
};

window.ApiService = ApiService;
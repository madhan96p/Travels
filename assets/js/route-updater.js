/* ===================================================================
   ROUTE UPDATER (Live Pricing) | SHRISH TRAVELS
   Wakes up static pages to check for fresh prices from Google Sheets.
   =================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Identify the current route based on URL
    // Example URL: .../routes/chennai-to-bangalore.html
    const path = window.location.pathname;
    const filename = path.split('/').pop(); 
    const currentSlug = filename.replace('.html', ''); // "chennai-to-bangalore"

    console.log("⚡ Checking live rates for:", currentSlug);

    // 2. Fetch Data from API
    if (window.ApiService) {
        try {
            // Re-use your centralized API
            const response = await ApiService.getRoutes();
            
            // Handle different API formats (Array vs Object)
            const allRoutes = Array.isArray(response) ? response : (response.routes || []);
            
            // 3. Find the matching route data
            const freshData = allRoutes.find(r => {
                // Check both standard slug and generated slug
                const sheetSlug = (r.Route_Slug || r.slug || '').toLowerCase();
                return sheetSlug === currentSlug.toLowerCase();
            });

            if (freshData) {
                // 4. Update the UI instantly
                updatePrice('price-sedan', freshData.Price_Sedan || freshData.price_sedan);
                updatePrice('price-innova', freshData.Price_Innova || freshData.price_innova);
                updatePrice('price-crysta', freshData.Price_Crysta || freshData.price_crysta);
                updatePrice('price-tempo', freshData.Price_Tempo || freshData.price_tempo);
                
                console.log("✅ Prices updated from Live Sheet!");
            } else {
                console.log("ℹ️ Route not found in live sheet, keeping static values.");
            }

        } catch (err) {
            console.warn("⚠️ Could not fetch live rates, using static fallback.", err);
        }
    }

    // Helper to format currency
    function updatePrice(elementId, price) {
        const el = document.getElementById(elementId);
        if (el && price) {
            // Format numbers like 3500 -> ₹3,500
            el.innerText = '₹' + parseInt(price).toLocaleString('en-IN');
            
            // Add a small visual cue (flash green) to show it's live
            el.style.color = '#10B981'; 
            setTimeout(() => el.style.color = '', 1000);
        }
    }
});
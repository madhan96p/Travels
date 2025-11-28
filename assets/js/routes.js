/* ===================================================================
   ROUTES PAGE JAVASCRIPT (FINAL) | SHRISH TRAVELS
   Fetches data, Auto-Categorizes routes, and Renders Premium Cards.
   =================================================================== */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIGURATION & DOM ELEMENTS ---
    const API_ENDPOINT = '/.netlify/functions/travels-api?action=getRoutes';
    
    const searchInput = document.getElementById('route-search');
    const searchDropdown = document.getElementById('search-results-dropdown');
    const filterButtons = document.querySelectorAll('.filter-button');
    const routesGrid = document.querySelector('.routes-grid');
    const loadingElement = document.getElementById('loading-routes');
    
    let allRoutesData = []; // Global store

    // --- 2. INITIALIZATION ---
    async function initializeRoutes() {
        try {
            const response = await fetch(API_ENDPOINT);
            if (!response.ok) throw new Error('Network error');
            
            const data = await response.json();
            
            // Handle different API response structures (Array vs Object)
            const routes = Array.isArray(data) ? data : (data.routes || []);
            
            if (routes.length > 0) {
                // Enrich data with categories before rendering
                allRoutesData = routes.map(processRouteData);
                renderRoutes(allRoutesData);
            } else {
                showError('No routes found in the database.');
            }

        } catch (error) {
            console.error("Route Load Error:", error);
            showError('Unable to load routes. Please refresh the page.');
        } finally {
            if (loadingElement) loadingElement.style.display = 'none';
        }
    }

    // --- 3. HELPER: DATA PROCESSING (The Smart Part) ---
    function processRouteData(route) {
        const dest = (route.Destination || route.destination || '').trim();
        const origin = (route.Origin || route.origin || '').trim();
        
        // Auto-assign Categories based on destination keywords
        let category = 'b2b'; // Default
        let catDisplay = 'Intercity';

        const spiritualPlaces = ['Tirupati', 'Tiruvannamalai', 'Velankanni', 'Rameswaram', 'Kanchipuram', 'Madurai', 'Palani', 'Chidambaram', 'Kumbakonam', 'Thanjavur'];
        const hillStations = ['Ooty', 'Kodaikanal', 'Yercaud', 'Munnar', 'Yelagiri', 'Valparai', 'Coorg'];
        const leisure = ['Pondicherry', 'Mahabalipuram', 'Goa', 'Mysore', 'Kanyakumari', 'Hogenakkal'];

        if (spiritualPlaces.some(p => dest.includes(p))) {
            category = 'spiritual';
            catDisplay = 'Spiritual';
        } else if (hillStations.some(p => dest.includes(p))) {
            category = 'hills';
            catDisplay = 'Hill Station';
        } else if (leisure.some(p => dest.includes(p))) {
            category = 'leisure';
            catDisplay = 'Leisure';
        }

        // Clean Image URL
        let img = route.Image_URL || route.image;
        if (!img || !img.startsWith('http')) {
            img = 'assets/images/default-route.jpg';
        }

        return {
            ...route, // Keep original data
            cleanOrigin: origin,
            cleanDest: dest,
            category: category,
            categoryDisplay: catDisplay,
            cleanImg: img,
            // Create a filename slug (e.g. chennai-to-madurai.html)
            fileLink: (route.Route_Slug || route.slug || `${origin}-to-${dest}`).toLowerCase().replace(/\s+/g, '-') + '.html',
            // Create a search string
            searchStr: `${origin} ${dest} ${catDisplay}`.toLowerCase()
        };
    }

    // --- 4. RENDER LOGIC ---
    function renderRoutes(routes) {
        routesGrid.innerHTML = '';

        if (routes.length === 0) {
            routesGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">
                    <i class="ri-search-2-line" style="font-size: 2rem; margin-bottom: 10px; display:block;"></i>
                    No routes found matching your criteria.
                </div>`;
            return;
        }

        routes.forEach(route => {
            const card = document.createElement('div');
            card.className = 'route-card';
            card.setAttribute('data-aos', 'fade-up');
            
            // DATA ATTRIBUTES FOR FILTERING
            card.dataset.category = route.category;
            card.dataset.name = route.searchStr;

            // HTML STRUCTURE (Matches your routes-list.css)
            card.innerHTML = `
                <img src="${route.cleanImg}" alt="${route.cleanDest}" loading="lazy" onerror="this.src='assets/images/default-route.jpg'">
                <div class="card-content">
                    <span class="card-tag ${route.category}">${route.categoryDisplay}</span>
                    <h3>${route.cleanDest}</h3>
                    
                    <div class="route-info">
                        <i class="ri-map-pin-user-line"></i> From ${route.cleanOrigin}
                    </div>
                    <div class="route-info">
                        <i class="ri-road-map-line"></i> ${route.Distance_Km || route.distance || '0'} km
                    </div>
                    
                    <a href="routes/${route.fileLink}" class="cta-btn">View Options</a>
                </div>
            `;
            routesGrid.appendChild(card);
        });
    }

    // --- 5. FILTERING & SEARCH LOGIC ---
    
    // A. Filter Buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // UI Update
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filterValue = btn.getAttribute('data-filter');
            
            // Logic
            if (filterValue === 'all') {
                renderRoutes(allRoutesData);
            } else {
                const filtered = allRoutesData.filter(r => r.category === filterValue);
                renderRoutes(filtered);
            }
        });
    });

    // B. Search Input
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            
            if (term.length > 0) {
                const filtered = allRoutesData.filter(r => r.searchStr.includes(term));
                renderRoutes(filtered);
            } else {
                // If empty, reset to current active filter
                const activeBtn = document.querySelector('.filter-button.active');
                const activeFilter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
                
                if (activeFilter === 'all') {
                    renderRoutes(allRoutesData);
                } else {
                    renderRoutes(allRoutesData.filter(r => r.category === activeFilter));
                }
            }
        });
    }

    // Helper: Show Error in Grid
    function showError(msg) {
        if (routesGrid) {
            routesGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 40px;">
                <i class="ri-error-warning-fill" style="font-size: 2rem;"></i>
                <p>${msg}</p>
            </div>`;
        }
    }

    // Start App
    initializeRoutes();
});
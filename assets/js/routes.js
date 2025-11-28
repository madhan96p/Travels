/* ===================================================================
   ROUTES PAGE JAVASCRIPT (FIXED) | SHRISH TRAVELS
   =================================================================== */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM Element Selection ---
    const searchInput = document.getElementById('route-search');
    const filterButtons = document.querySelectorAll('.filter-button');
    const routesGrid = document.querySelector('.routes-grid');
    const loadingElement = document.getElementById('loading-routes');
    
    // FIX 1: Corrected Action Name to match travels-api.js
    const API_ENDPOINT = '/.netlify/functions/travels-api?action=getRoutes';
    let allRoutesData = []; 
    
    // --- 2. Fetch and Render ---

    async function initializeRoutes() {
        try {
            const response = await fetch(API_ENDPOINT);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const result = await response.json();
            
            // FIX 2: Handle Raw Array response from Backend
            // The backend returns [ {route1}, {route2} ] directly
            if (Array.isArray(result)) {
                allRoutesData = result;
                renderRouteCards(allRoutesData);
                updateSchema(allRoutesData);
                setupFiltering(allRoutesData);
            } 
            // Fallback: If you later change backend to return { success: true, routes: [] }
            else if (result.success && result.routes) {
                allRoutesData = result.routes;
                renderRouteCards(allRoutesData);
                updateSchema(allRoutesData);
                setupFiltering(allRoutesData);
            } else {
                throw new Error('API returned empty or invalid data.');
            }

        } catch (error) {
            console.error("Route Fetch Error:", error);
            if (routesGrid) {
                routesGrid.innerHTML = `<div style="text-align:center; padding:40px; color:#ef4444;">
                    <i class="ri-error-warning-line" style="font-size:2rem; margin-bottom:10px;"></i><br>
                    Unable to load routes. Please refresh the page.
                </div>`;
            }
        } finally {
             if (loadingElement) loadingElement.style.display = 'none';
        }
    }
    
    function renderRouteCards(routesToRender) {
        if (!routesGrid) return;
        routesGrid.innerHTML = '';

        if (routesToRender.length === 0) {
            routesGrid.innerHTML = '<p style="text-align:center; padding: 30px; width:100%; grid-column: 1 / -1;">No routes found matching your criteria.</p>';
            return;
        }

        routesToRender.forEach(route => {
            const originLower = (route.Origin || route.origin || 'na').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const destLower = (route.Destination || route.destination || 'na').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const fileName = (route.Route_Slug || route.slug || `${originLower}-to-${destLower}`) + '.html';
            
            // Handle different casing keys (API vs JSON file differences)
            const rOrigin = route.Origin || route.origin;
            const rDest = route.Destination || route.destination;
            const rDist = route.Distance_Km || route.distance;
            const rTime = route.Time_Hours || route.duration;
            const rImg = route.Image_URL || route.image;

            const card = document.createElement('div');
            card.className = 'route-card';
            card.setAttribute('data-aos', 'fade-up');
            
            // Search Meta Data
            card.dataset.name = `${rOrigin} ${rDest}`.toLowerCase();
            
            // Image handling (Clean check)
            const imageUrl = rImg && rImg.includes('http') ? rImg : 'assets/images/default-route.jpg';

            card.innerHTML = `
                <div class="route-img-box">
                    <img src="${imageUrl}" alt="${rOrigin} to ${rDest}" loading="lazy" onerror="this.src='assets/images/default-route.jpg'">
                </div>
                <div class="route-content">
                    <div class="route-header">
                        <div class="route-title">
                            <h3>${rDest}</h3>
                            <div class="route-dist">
                                <i class="ri-road-map-line"></i> ${rDist} km • ${rTime} hrs
                            </div>
                        </div>
                    </div>
                    <p class="route-desc">One-way trip from ${rOrigin} to ${rDest}</p>
                    <a href="routes/${fileName}" class="btn-route">View Options</a>
                </div>
            `;
            routesGrid.appendChild(card);
        });
    }

    function updateSchema(routesData) {
        // Optional: Keep schema logic simple or remove if causing issues
    }

    function setupFiltering(routesData) {
        // Basic Search Logic
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const cards = document.querySelectorAll('.route-card');
                
                cards.forEach(card => {
                    const name = card.dataset.name;
                    if (name.includes(term)) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        }
        
        // Filter Buttons
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Note: Real filtering requires 'Category' column in GSheet.
                // For now, this just highlights the button.
            });
        });
    }

    initializeRoutes();
});
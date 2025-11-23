/* ===================================================================
   ROUTES PAGE JAVASCRIPT (V3 - API Driven) | SHRISH TRAVELS
   Fetches route data from the Netlify API, renders cards, and handles filtering/search.
   =================================================================== */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM Element Selection & Configuration ---
    const searchInput = document.getElementById('route-search');
    const filterButtons = document.querySelectorAll('.filter-button');
    const routesGrid = document.querySelector('.routes-grid');
    const loadingElement = document.getElementById('loading-routes');
    
    const API_ENDPOINT = '/.netlify/functions/travels-api?action=getAllRoutes';
    let allRoutesData = []; // Store the full dataset globally
    
    // --- 2. Fetch and Render Routes ---

    /**
     * Fetches route data from the API, stores it, and kicks off rendering/filtering setup.
     */
    async function initializeRoutes() {
        try {
            const response = await fetch(API_ENDPOINT);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            
            if (result.success && result.routes) {
                allRoutesData = result.routes;
                renderRouteCards(allRoutesData);
                updateSchema(allRoutesData);
                setupFiltering(allRoutesData);
            } else {
                throw new Error(result.error || 'API returned unsuccessful status.');
            }

        } catch (error) {
            console.error("Could not fetch or process routes data:", error);
            if (routesGrid) {
                routesGrid.innerHTML = `<p style="text-align:center; color:red;"><i class="ri-error-warning-line"></i> Could not load routes. Please check API or try again later.</p>`;
            }
        } finally {
             if (loadingElement) loadingElement.style.display = 'none';
        }
    }
    
    /**
     * Creates the HTML for each route card and adds it to the grid.
     */
    function renderRouteCards(routesToRender) {
        if (!routesGrid) return;
        routesGrid.innerHTML = '';

        if (routesToRender.length === 0) {
            routesGrid.innerHTML = '<p style="text-align:center; padding: 30px;">No routes found matching your criteria. Try searching a different city!</p>';
            return;
        }

        routesToRender.forEach(route => {
            // Create clean slugs for the URL (e.g., chennai-to-madurai)
            const originLower = (route.origin || 'na').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const destLower = (route.destination || 'na').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            
            // Build a searchable string that includes all relevant keywords
            const dataName = `${route.origin} ${route.destination} ${route.destination_tamil} ${route.category_display} ${route.search_keywords ? route.search_keywords.join(' ') : ''}`.toLowerCase();

            const card = document.createElement('div');
            card.className = 'route-card';
            card.dataset.category = route.category || 'all'; // Default to 'all' if category is missing
            card.dataset.name = dataName;
            card.setAttribute('data-aos', 'fade-up');

            // Use the first image in the array for the thumbnail (assuming route.image_path is an array from the API)
            const imageUrl = route.image_path && route.image_path.length > 0 ? `assets/images/routes/${route.image_path[0]}` : 'assets/images/default.webp';

            card.innerHTML = `
                <img src="${imageUrl}" alt="Scenic view of ${route.destination}">
                <div class="card-content">
                    <span class="card-tag ${route.category}">${route.category_display || 'General'}</span>
                    <h3>${route.origin} → ${route.destination}</h3>
                    <p class="route-info"><i class="ri-road-map-line"></i> ${route.distance_km || 'N/A'} KMs</p>
                    <p class="route-info"><i class="ri-time-line"></i> Approx. ${route.duration || 'N/A'}</p>
                    <a href="routes/${originLower}-to-${destLower}.html" class="cta-btn primary">View Details</a>
                </div>
            `;
            routesGrid.appendChild(card);
        });
    }

    /**
     * Dynamically populates the Schema.org ItemList in the <head>.
     */
    function updateSchema(routesData) {
        const schemaScript = document.querySelector('script[type="application/ld+json"]');
        if (!schemaScript) return;

        try {
            const schema = JSON.parse(schemaScript.textContent);
            
            if (schema['@type'] === 'CollectionPage' && schema.mainEntity) {
                const itemListElements = routesData.map((route, index) => {
                    const originLower = (route.origin || 'na').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    const destLower = (route.destination || 'na').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    
                    return {
                        "@type": "ListItem",
                        "position": index + 1,
                        "item": {
                            "@type": "TravelAction",
                            "name": `Cab from ${route.origin} to ${route.destination}`,
                            "url": `https://travels.shrishgroup.com/routes/${originLower}-to-${destLower}.html`,
                            "fromLocation": { "@type": "City", "name": route.origin },
                            "toLocation": { "@type": "City", "name": route.destination }
                        }
                    };
                });
                
                schema.mainEntity.itemListElement = itemListElements;
                schemaScript.textContent = JSON.stringify(schema, null, 2);
            }
        } catch (error) {
            console.error("Failed to update SEO schema:", error);
        }
    }

    /**
     * Sets up event listeners for search and filtering.
     */
    function setupFiltering(routesData) {
        const routeCards = document.querySelectorAll('.route-card');
        const searchResultsDropdown = document.getElementById('search-results-dropdown');
        let activeCategory = 'all';
        let searchTerm = '';
    
        const filterRoutes = () => {
            const matchingRoutes = [];
            
            routeCards.forEach(card => {
                const cardCategory = card.dataset.category || 'all';
                const cardName = card.dataset.name || '';
                
                // 1. Category Match
                const categoryMatch = activeCategory === 'all' || cardCategory.includes(activeCategory);
                
                // 2. Search Match
                const searchMatch = !searchTerm || cardName.includes(searchTerm);
    
                if (categoryMatch && searchMatch) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
            
            // Rebuild the search dropdown content every time the search input changes
            updateDropdown(routesData);
        };

        const updateDropdown = (routesData) => {
            if (!searchResultsDropdown) return;
            searchResultsDropdown.innerHTML = '';
            
            if (searchTerm.length < 2) {
                searchResultsDropdown.classList.add('hidden');
                return;
            }
            
            // Filter the original data set for the dropdown
            const matchingRoutes = routesData.filter(route => {
                const searchData = `${route.origin} ${route.destination} ${route.destination_tamil} ${route.search_keywords ? route.search_keywords.join(' ') : ''}`.toLowerCase();
                return searchData.includes(searchTerm);
            }).slice(0, 5); // Limit dropdown results to top 5

            if (matchingRoutes.length > 0) {
                matchingRoutes.forEach(route => {
                    const originLower = (route.origin || 'na').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    const destLower = (route.destination || 'na').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    
                    const item = document.createElement('a');
                    item.className = 'search-result-item';
                    item.href = `routes/${originLower}-to-${destLower}.html`;
                    item.innerHTML = `${route.origin} → ${route.destination} <small>(${route.category_display || 'Route'})</small>`;
                    searchResultsDropdown.appendChild(item);
                });
            } else {
                const noResults = document.createElement('div');
                noResults.className = 'no-results-message';
                noResults.textContent = 'No exact matches found. Scroll to see all available routes.';
                searchResultsDropdown.appendChild(noResults);
            }
            searchResultsDropdown.classList.remove('hidden');
        };
    
        // Event listeners for filter buttons
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                activeCategory = button.dataset.filter;
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                filterRoutes();
            });
        });
    
        // Event listeners for search input
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                searchTerm = searchInput.value.toLowerCase().trim();
                filterRoutes();
            });
            // Hide dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-bar-container')) {
                    if (searchResultsDropdown) searchResultsDropdown.classList.add('hidden');
                }
            });
        }
    }

    // --- 3. Initial Call ---
    initializeRoutes();
});
/* ===================================================================
   ROUTES PAGE JAVASCRIPT (PAGINATION + CONTEXT EDITION)
   =================================================================== */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    const API_ENDPOINT = '/.netlify/functions/travels-api?action=getRoutes';
    
    // DOM Elements
    const routesGrid = document.querySelector('.routes-grid');
    const filterButtons = document.querySelectorAll('.filter-button');
    const loadingElement = document.getElementById('loading-routes');
    const loadMoreBtn = document.getElementById('btn-load-more');
    const loadMoreContainer = document.getElementById('load-more-container');
    const catTitle = document.getElementById('cat-title');
    const catDesc = document.getElementById('cat-desc');

    // State Variables
    let allRoutesData = []; 
    let currentFilteredRoutes = [];
    let visibleCount = 9; // Show 9 initially
    const LOAD_STEP = 6;  // Load 6 more on click

    // Category SEO Descriptions
    const categoryContent = {
        'all': { 
            title: "Exploring All Routes", 
            desc: "Browse our complete network of premium outstation taxis connecting Chennai to all major destinations." 
        },
        'b2b': { 
            title: "Corporate & City Connectors", 
            desc: "Efficient business travel routes to industrial hubs like Bangalore, Coimbatore, and Hosur." 
        },
        'hills': { 
            title: "Hill Station Getaways", 
            desc: "Escape the heat. Expert drivers for the winding roads of Ooty, Kodaikanal, and Munnar." 
        },
        'spiritual': { 
            title: "Pilgrimage Circuits", 
            desc: "Respectful and punctual service for temple visits to Tirupati, Madurai, and Rameswaram." 
        },
        'leisure': { 
            title: "Weekend Leisure Trips", 
            desc: "Relaxing drives to Pondicherry, Mahabalipuram, and other tourist favorites." 
        }
    };

    // --- 1. INITIALIZATION ---
    async function initializeRoutes() {
        try {
            const response = await fetch(API_ENDPOINT);
            const data = await response.json();
            const routes = Array.isArray(data) ? data : (data.routes || []);
            
            if (routes.length > 0) {
                allRoutesData = routes.map(processRouteData);
                // Initial Render (All)
                applyFilter('all');
            } else {
                showError('No routes found.');
            }
        } catch (error) {
            console.error("Error:", error);
            showError('Unable to load routes.');
        } finally {
            if (loadingElement) loadingElement.style.display = 'none';
        }
    }

    // --- 2. DATA PROCESSOR (Same as before) ---
    function processRouteData(route) {
        // ... (Keep your existing processRouteData logic here) ...
        // I am abbreviating this part as it was perfect in your original code.
        // Just Copy-Paste the 'processRouteData' function from your previous file.
        const dest = (route.Destination || route.destination || '').trim();
        const origin = (route.Origin || route.origin || '').trim();
        
        let category = 'b2b'; 
        let catDisplay = 'Intercity';

        const spiritualPlaces = ['Tirupati', 'Tiruvannamalai', 'Velankanni', 'Rameswaram', 'Kanchipuram', 'Madurai', 'Palani', 'Chidambaram', 'Kumbakonam', 'Thanjavur'];
        const hillStations = ['Ooty', 'Kodaikanal', 'Yercaud', 'Munnar', 'Yelagiri', 'Valparai', 'Coorg'];
        const leisure = ['Pondicherry', 'Mahabalipuram', 'Goa', 'Mysore', 'Kanyakumari', 'Hogenakkal'];

        if (spiritualPlaces.some(p => dest.includes(p))) { category = 'spiritual'; catDisplay = 'Spiritual'; }
        else if (hillStations.some(p => dest.includes(p))) { category = 'hills'; catDisplay = 'Hill Station'; }
        else if (leisure.some(p => dest.includes(p))) { category = 'leisure'; catDisplay = 'Leisure'; }

        let img = route.Image_URL || route.image;
        if (!img || !img.startsWith('http')) img = 'assets/images/default-route.jpg';

        return {
            ...route,
            cleanOrigin: origin,
            cleanDest: dest,
            category: category,
            categoryDisplay: catDisplay,
            cleanImg: img,
            fileLink: (route.Route_Slug || route.slug || `${origin}-to-${dest}`).toLowerCase().replace(/\s+/g, '-') + '.html',
            searchStr: `${origin} ${dest} ${catDisplay}`.toLowerCase()
        };
    }

    // --- 3. FILTER LOGIC ---
    function applyFilter(category) {
        // Update Context Text
        if (categoryContent[category]) {
            catTitle.innerText = categoryContent[category].title;
            catDesc.innerText = categoryContent[category].desc;
        }

        // Filter Data
        if (category === 'all') {
            currentFilteredRoutes = allRoutesData;
        } else {
            currentFilteredRoutes = allRoutesData.filter(r => r.category === category);
        }

        // Reset Pagination
        visibleCount = 9;
        renderBatch();
    }

    // --- 4. RENDER BATCH (The "Load More" Magic) ---
    function renderBatch() {
        routesGrid.innerHTML = '';
        
        // Slice the array based on visibleCount
        const routesToShow = currentFilteredRoutes.slice(0, visibleCount);

        if (routesToShow.length === 0) {
            routesGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;">No routes found.</div>`;
            loadMoreContainer.classList.add('hidden');
            return;
        }

        routesToShow.forEach(route => {
            const card = document.createElement('div');
            card.className = 'route-card';
            // Note: Removed AOS here to prevent animation glitch on "Load More"
            // Use simple CSS fade-in if needed
            
            card.innerHTML = `
                <img src="${route.cleanImg}" alt="${route.cleanDest}" loading="lazy" onerror="this.src='assets/images/default-route.jpg'">
                <div class="card-content">
                    <span class="card-tag ${route.category}">${route.categoryDisplay}</span>
                    <h3>${route.cleanDest}</h3>
                    <div class="route-info"><i class="ri-map-pin-user-line"></i> From ${route.cleanOrigin}</div>
                    <div class="route-info"><i class="ri-road-map-line"></i> ${route.Distance_Km || 0} km</div>
                    <a href="routes/${route.fileLink}" class="cta-btn">View Options</a>
                </div>
            `;
            routesGrid.appendChild(card);
        });

        // Toggle "Load More" Button
        if (visibleCount >= currentFilteredRoutes.length) {
            loadMoreContainer.classList.add('hidden');
        } else {
            loadMoreContainer.classList.remove('hidden');
        }
    }

    // --- 5. EVENT LISTENERS ---
    
    // Filter Buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilter(btn.getAttribute('data-filter'));
        });
    });

    // Load More Button
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            visibleCount += LOAD_STEP;
            renderBatch();
        });
    }

    // (Search logic can remain similar, just calling 'applyFilter' or filtering 'currentFilteredRoutes')

    initializeRoutes();
});
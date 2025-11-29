document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    const OWNER_PHONE = "918883451668"; // From your vCard
    const API_ENDPOINT = "/.netlify/functions/travels-api?action=getTariff"; // Your endpoint

    // 1. TABS LOGIC
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            contents.forEach(c => c.classList.remove('active'));

            // Add active class to current
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            const targetId = tab.dataset.tab + '-tab';
            document.getElementById(targetId).classList.add('active');
        });
    });

    // 2. DATA FETCH & RENDER
    fetch(API_ENDPOINT)
        .then(res => res.json())
        .then(data => {
            if (data.local && data.local.length > 0) {
                processCards(data.local, 'local');
            }
            if (data.outstation && data.outstation.length > 0) {
                processCards(data.outstation, 'outstation');
            }
            updatePageSchema(data);
        })
        .catch(err => {
            console.log("Using static fallback data (API fetch failed or empty).", err);
        });


    // 3. AEO-OPTIMIZED RENDERING LOGIC
    function processCards(data, type) {
        const container = document.querySelector(`#${type}-tab .tariff-grid`);
        if (!container) return;

        data.forEach(item => {
            // Try to find existing card by data attribute to update in-place (better for speed)
            const existingCard = document.querySelector(`.package-card[data-vehicle="${item.ID}"]`);

            if (existingCard) {
                updateCardData(existingCard, item, type);
            } else {
                const newCardHTML = createCardHTML(item, type);
                container.insertAdjacentHTML('beforeend', newCardHTML);
            }
        });
    }

    function updateCardData(card, item, type) {
        // Updates price numbers while keeping Schema structure intact
        if (type === 'local') {
            const priceEl = card.querySelector('.price');
            if (priceEl) {
                priceEl.innerHTML = `₹${Number(item.Base_Fare).toLocaleString()}`;
                priceEl.setAttribute('content', item.Base_Fare); // Update Schema meta
            }

            // Update features list
            const features = card.querySelectorAll('.card-features li');
            if (features.length >= 2) {
                features[0].innerHTML = `<i class="ri-time-line"></i> Extra Hour: ₹${item.Extra_Hr_Rate}`;
                features[1].innerHTML = `<i class="ri-route-line"></i> Extra KM: ₹${item.Extra_Km_Rate}`;
            }
        } else {
            const priceEl = card.querySelector('.price');
            if (priceEl) {
                priceEl.innerHTML = `₹${item.Rate_Per_Km}`;
                priceEl.setAttribute('content', item.Rate_Per_Km);
            }

            const features = card.querySelectorAll('.card-features li');
            if (features.length >= 1) {
                features[0].innerHTML = `Driver BATA: ₹${item.Driver_Bata}/day`;
            }
        }
    }

    /**
     * GENERATES SEMANTIC HTML FOR NEW ITEMS
     * Uses <article>, Microdata (itemscope), and FAS icons
     */
    function createCardHTML(item, type) {
        // Default to 'fas fa-car' if API doesn't provide class
        const iconClass = item.Image_Class || 'fas fa-car';

        if (type === 'local') {
            return `
            <article class="package-card" data-vehicle="${item.ID}" itemscope itemtype="https://schema.org/Product">
                <meta itemprop="name" content="${item.Name} Local Rental">
                <meta itemprop="description" content="Rent a ${item.Name} for local use in Chennai. Base package: ${item.Base_Hr}hr / ${item.Base_Km}km.">
                
                <div class="card-icon"><i class="${iconClass}" aria-hidden="true"></i></div>
                <h3>${item.Name}</h3>
                
                <div class="card-price" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                    <meta itemprop="priceCurrency" content="INR">
                    <span class="price" itemprop="price" content="${item.Base_Fare}">₹${Number(item.Base_Fare).toLocaleString()}</span> / ${item.Base_Hr}hr
                </div>

                <ul class="card-features">
                    <li><i class="ri-time-line"></i> Extra Hour: ₹${item.Extra_Hr_Rate}</li>
                    <li><i class="ri-route-line"></i> Extra KM: ₹${item.Extra_Km_Rate}</li>
                </ul>

                <p class="sr-only">Affordable ${item.Name} taxi in Chennai. Ideal for shopping in T. Nagar, Pondy Bazaar, or office pickup.</p>

                <button class="btn-estimate" data-vehicle-id="${item.ID}" aria-label="Estimate ${item.Name} Fare">Estimate Fare</button>
            </article>`;
        } else {
            return `
            <article class="package-card" data-vehicle="${item.ID}" itemscope itemtype="https://schema.org/Product">
                <meta itemprop="name" content="${item.Name} Outstation Rental">
                <meta itemprop="description" content="Outstation taxi service using ${item.Name}. Transparent per km rates.">
                
                <div class="card-icon"><i class="${iconClass}" aria-hidden="true"></i></div>
                <h3>${item.Name}</h3>
                
                <div class="card-price" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                    <meta itemprop="priceCurrency" content="INR">
                    <span class="price" itemprop="price" content="${item.Rate_Per_Km}">₹${item.Rate_Per_Km}</span> / km
                </div>

                <ul class="card-features">
                    <li>Driver BATA: ₹${item.Driver_Bata}/day</li>
                    <li>Min ${item.Min_Km_Per_Day || 250}km / day</li>
                </ul>

                <p class="sr-only">Safe outstation cab from Chennai. ${item.Name} available for Tirupati, Pondicherry, Bangalore trips.</p>

                <button class="btn-estimate" data-vehicle-id="${item.ID}" aria-label="Estimate ${item.Name} Fare">Estimate Fare</button>
            </article>`;
        }
    }


    // 4. MODAL & CALCULATOR LOGIC (CRO ENGINE)
    const modal = document.getElementById('estimatorModal');

    // Event Delegation for dynamic buttons
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-estimate')) {
            const vehicleId = e.target.getAttribute('data-vehicle-id');
            openCalculator(vehicleId);
        }
        // Close modal logic
        if (e.target.closest('.modal-close') || e.target.closest('.close-modal')) {
            if (modal) modal.classList.add('hidden');
        }
    });

    // Close on clicking overlay
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    }

    function openCalculator(vehicleId) {
        const modalBody = document.getElementById('modalBody');
        const modalFooter = document.getElementById('modalFooter');
        const modalTitle = document.getElementById('modalTitle');

        if (!modal || !modalBody) return;

        modal.classList.remove('hidden');

        // Find data from the DOM card
        const card = document.querySelector(`.package-card[data-vehicle="${vehicleId}"]`);
        if (!card) return;

        const title = card.querySelector('h3').innerText;
        const isLocal = card.closest('#local-tab') !== null;

        // Helper to extract numbers
        const getNumber = (selector) => {
            const el = card.querySelector(selector);
            if (!el) return 0;
            return parseInt(el.innerText.replace(/[^\d]/g, '')) || 0;
        };

        modalTitle.innerText = `Estimate: ${title}`;

        // Inject FAB (Font Awesome Brand) WhatsApp Button
        modalFooter.innerHTML = `
            <a href="#" id="wa-link" target="_blank" class="cta-btn primary" style="display:flex; justify-content:center; align-items:center; gap:10px; text-decoration:none; background:#25D366; color:white; padding:12px; border-radius:6px; font-weight:bold; width:100%; transition: transform 0.2s;">
                <i class="fab fa-whatsapp" style="font-size:1.2rem;"></i> 
                <span id="wa-text">Book Estimate</span>
            </a>
        `;
        const waBtn = document.getElementById('wa-link');
        const waText = document.getElementById('wa-text');

        if (isLocal) {
            // --- LOCAL CALCULATION ---
            const baseFare = getNumber('.price'); // Extracts 1300 from "₹1,300"

            // Parse features safely
            const features = card.querySelectorAll('.card-features li');
            let extraHrRate = 0;
            let extraKmRate = 0;

            if (features.length > 0) extraHrRate = parseInt(features[0].innerText.replace(/[^\d]/g, '')) || 0;
            if (features.length > 1) extraKmRate = parseInt(features[1].innerText.replace(/[^\d]/g, '')) || 0;

            modalBody.innerHTML = `
                <div class="form-group" style="margin-bottom:15px;">
                    <label style="display:block; margin-bottom:5px; font-weight:600; color:#333;">Additional Kilometers</label>
                    <input type="number" id="calc-km" class="form-input" value="0" min="0" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px;">
                </div>
                <div class="form-group" style="margin-bottom:15px;">
                    <label style="display:block; margin-bottom:5px; font-weight:600; color:#333;">Additional Hours</label>
                    <input type="number" id="calc-hr" class="form-input" value="0" min="0" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px;">
                </div>
                <div class="result-box" style="background:#f5f7fa; padding:15px; border-radius:8px; text-align:center;">
                    <p style="margin:0; color:#666; font-size:0.9rem;">Estimated Total</p>
                    <h2 id="calc-total" style="margin:5px 0; color:#2c3e50;">₹${baseFare.toLocaleString()}</h2>
                </div>
            `;

            const calculate = () => {
                const km = parseInt(document.getElementById('calc-km').value) || 0;
                const hr = parseInt(document.getElementById('calc-hr').value) || 0;
                const total = baseFare + (km * extraKmRate) + (hr * extraHrRate);

                document.getElementById('calc-total').innerText = `₹${total.toLocaleString()}`;
                waText.innerText = `Book via WhatsApp (₹${total})`;

                const msg = `*New Local Booking* %0A%0A` +
                    `🚗 *Car:* ${title} %0A` +
                    `📍 *Base:* ₹${baseFare} %0A` +
                    `➕ *Extra:* ${km}km & ${hr}hr %0A` +
                    `💰 *Total:* ₹${total} %0A` +
                    `---------------- %0A` +
                    `Check availability?`;

                waBtn.href = `https://wa.me/${OWNER_PHONE}?text=${msg}`;
            };

            modalBody.addEventListener('input', calculate);
            calculate(); // Init

        } else {
            // --- OUTSTATION CALCULATION ---
            const perKm = getNumber('.price'); // Extracts 14 from "₹14"

            const features = card.querySelectorAll('.card-features li');
            let bata = 0;
            let minKm = 250;

            if (features.length > 0) bata = parseInt(features[0].innerText.replace(/[^\d]/g, '')) || 0;
            if (features.length > 1) minKm = parseInt(features[1].innerText.replace(/[^\d]/g, '')) || 250;

            modalBody.innerHTML = `
                <div class="form-group" style="margin-bottom:15px;">
                    <label style="display:block; margin-bottom:5px; font-weight:600; color:#333;">Trip Duration (Days)</label>
                    <input type="number" id="calc-days" class="form-input" value="1" min="1" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px;">
                </div>
                <div class="form-group" style="margin-bottom:15px;">
                    <label style="display:block; margin-bottom:5px; font-weight:600; color:#333;">Est. Distance (Round Trip)</label>
                    <input type="number" id="calc-dist" class="form-input" value="300" min="250" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px;">
                    <small style="color:#888; font-size:0.8rem;">Min charge: ${minKm}km/day</small>
                </div>
                <div class="result-box" style="background:#f5f7fa; padding:15px; border-radius:8px; text-align:center;">
                    <p style="margin:0; color:#666; font-size:0.9rem;">Estimated Total</p>
                    <h2 id="calc-total" style="margin:5px 0; color:#2c3e50;">₹0</h2>
                </div>
            `;

            const calculate = () => {
                const days = parseInt(document.getElementById('calc-days').value) || 1;
                const dist = parseInt(document.getElementById('calc-dist').value) || 0;

                const minTotalKm = days * minKm;
                const chargeableDist = Math.max(dist, minTotalKm);

                const total = (chargeableDist * perKm) + (days * bata);

                document.getElementById('calc-total').innerText = `₹${total.toLocaleString()}`;
                waText.innerText = `Book via WhatsApp (₹${total})`;

                const msg = `*New Outstation Inquiry* %0A%0A` +
                    `🚗 *Car:* ${title} %0A` +
                    `📅 *Days:* ${days} %0A` +
                    `🛣 *Dist:* ${dist}km (Min: ${minTotalKm}km) %0A` +
                    `💰 *Est Total:* ₹${total} %0A` +
                    `---------------- %0A` +
                    `I want to book this.`;

                waBtn.href = `https://wa.me/${OWNER_PHONE}?text=${msg}`;
            };

            modalBody.addEventListener('input', calculate);
            calculate(); // Init
        }
    }

    /**
 * 5. DYNAMIC SCHEMA UPDATER (AEO)
 * Updates the JSON-LD in <head> to match the Live API Data
 */
    function updatePageSchema(data) {
        const schemaScript = document.querySelector('script[type="application/ld+json"]');
        if (!schemaScript) return;

        try {
            const schema = JSON.parse(schemaScript.textContent);

            // Clear existing offers
            if (schema.hasOfferCatalog) {
                schema.hasOfferCatalog.itemListElement = [];

                // Add Local Offers
                if (data.local) {
                    data.local.forEach(item => {
                        schema.hasOfferCatalog.itemListElement.push({
                            "@type": "Offer",
                            "itemOffered": {
                                "@type": "Service",
                                "name": `${item.Name} Local Package`,
                                "description": `${item.Base_Hr}hr / ${item.Base_Km}km Package`
                            },
                            "priceSpecification": {
                                "@type": "UnitPriceSpecification",
                                "price": item.Base_Fare,
                                "priceCurrency": "INR"
                            }
                        });
                    });
                }

                // Add Outstation Offers
                if (data.outstation) {
                    data.outstation.forEach(item => {
                        schema.hasOfferCatalog.itemListElement.push({
                            "@type": "Offer",
                            "itemOffered": {
                                "@type": "Service",
                                "name": `${item.Name} Outstation`,
                                "description": `Outstation rental @ ₹${item.Rate_Per_Km}/km`
                            },
                            "priceSpecification": {
                                "@type": "UnitPriceSpecification",
                                "price": item.Rate_Per_Km,
                                "priceCurrency": "INR",
                                "unitCode": "KMT" // UN Code for Kilometer
                            }
                        });
                    });
                }
            }

            // Update the DOM
            schemaScript.textContent = JSON.stringify(schema, null, 2);
            console.log("✅ Schema updated with Live Tariff Data");

        } catch (e) {
            console.error("Schema Update Failed", e);
        }
    }
});


// (AEO + SEO + CRO + TECH STACK + AOS + FAB + FAS + FAQ + QA...)
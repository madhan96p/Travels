document.addEventListener('DOMContentLoaded', () => {

    // 1. TABS LOGIC
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // Add active to clicked
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
        });
    });

    // 2. GOOGLE SHEET DATA FETCH
    // We fetch data to ensure prices are up-to-date. 
    // If fetch fails, we keep the hardcoded HTML as a backup.
    fetch('/.netlify/functions/travels-api?action=getTariff')
        .then(res => res.json())
        .then(data => {
            if (data.local && data.local.length > 0) {
                updateLocalCards(data.local);
            }
            if (data.outstation && data.outstation.length > 0) {
                updateOutstationCards(data.outstation);
            }
        })
        .catch(err => console.log("Using static fallback data due to API error:", err));

    // 3. MODAL LOGIC (The Calculator)
    const modal = document.getElementById('estimatorModal');
    
    // SAFETY FIX: Look for either class name (.modal-close OR .close-modal)
    const closeBtn = document.querySelector('.modal-close') || document.querySelector('.close-modal');
    
    // Attach Click Event to ALL "Estimate Fare" buttons
    document.body.addEventListener('click', (e) => {
        // Handle the "Estimate Fare" buttons
        if (e.target.classList.contains('btn-estimate')) {
            const vehicleId = e.target.getAttribute('data-vehicle-id');
            openCalculator(vehicleId);
        }
        
        // Handle the "Close" button inside the modal (Alternative way)
        if (e.target.closest('.modal-close') || e.target.closest('.close-modal')) {
            if(modal) modal.classList.add('hidden');
        }
    });

    // Only attach listener if button explicitly exists (Prevents the Line 46 error)
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }

    // Close on clicking outside the modal box
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    }

    function updateLocalCards(data) {
        // This function looks for cards with matching data-vehicle IDs and updates price
        data.forEach(item => {
            const card = document.querySelector(`.package-card[data-vehicle="${item.ID}"]`);
            if (card) {
                // Update Price
                const priceEl = card.querySelector('.price');
                if(priceEl) priceEl.textContent = `₹${item.Base_Fare}`;
                
                // Update Details (Extra Hr/Km)
                const features = card.querySelectorAll('.card-features li');
                if(features.length >= 2) {
                    features[0].innerHTML = `<i class="ri-time-line"></i> Extra Hour: ₹${item.Extra_Hr_Rate}`;
                    features[1].innerHTML = `<i class="ri-route-line"></i> Extra KM: ₹${item.Extra_Km_Rate}`;
                }
            }
        });
    }

    function updateOutstationCards(data) {
        data.forEach(item => {
            const card = document.querySelector(`.package-card[data-vehicle="${item.ID}"]`);
            if (card) {
                const priceEl = card.querySelector('.price');
                if(priceEl) priceEl.textContent = `₹${item.Rate_Per_Km}`;
                
                const features = card.querySelectorAll('.card-features li');
                if(features.length >= 1) {
                    features[0].innerHTML = `<i class="ri-wallet-3-fill"></i> Driver BATA: ₹${item.Driver_Bata} / Day`;
                }
            }
        });
    }

    function openCalculator(vehicleId) {
        const modalBody = document.getElementById('modalBody');
        const modalFooter = document.getElementById('modalFooter');
        const modalTitle = document.getElementById('modalTitle');
        
        modal.classList.remove('hidden');
        
        // Retrieve price from the Card itself (Client-side source of truth)
        const card = document.querySelector(`.package-card[data-vehicle="${vehicleId}"]`);
        const title = card.querySelector('h3').innerText;
        const isLocal = card.closest('#local-tab') !== null;
        
        // Parse prices from the visible text (removes '₹' and ',')
        const getPrice = (selector) => {
            const text = card.querySelector(selector)?.innerText || "0";
            return parseInt(text.replace(/[^\d]/g, ''));
        };

        modalTitle.innerText = `Estimate: ${title}`;

        if (isLocal) {
            // Logic for Local
            const baseFare = getPrice('.price');
            const extraHrRate = parseInt(card.querySelectorAll('.card-features li')[0].innerText.replace(/[^\d]/g, ''));
            const extraKmRate = parseInt(card.querySelectorAll('.card-features li')[1].innerText.replace(/[^\d]/g, ''));

            modalBody.innerHTML = `
                <div class="form-group">
                    <label>Additional Kilometers (Over 50km)</label>
                    <input type="number" id="calc-km" class="form-input" value="0" min="0">
                </div>
                <div class="form-group">
                    <label>Additional Hours (Over 5hrs)</label>
                    <input type="number" id="calc-hr" class="form-input" value="0" min="0">
                </div>
                <div class="result-box">
                    <p>Estimated Total</p>
                    <h2 id="calc-total">₹${baseFare.toLocaleString()}</h2>
                </div>
            `;

            const calculate = () => {
                const km = parseInt(document.getElementById('calc-km').value) || 0;
                const hr = parseInt(document.getElementById('calc-hr').value) || 0;
                const total = baseFare + (km * extraKmRate) + (hr * extraHrRate);
                document.getElementById('calc-total').innerText = `₹${total.toLocaleString()}`;
            };
            
            modalBody.addEventListener('input', calculate);

        } else {
            // Logic for Outstation
            const perKm = getPrice('.price');
            const bata = parseInt(card.querySelectorAll('.card-features li')[0].innerText.replace(/[^\d]/g, ''));

            modalBody.innerHTML = `
                <div class="form-group">
                    <label>Total Trip Days</label>
                    <input type="number" id="calc-days" class="form-input" value="1" min="1">
                </div>
                <div class="form-group">
                    <label>Total Distance (Round Trip KMs)</label>
                    <input type="number" id="calc-dist" class="form-input" value="300" min="250">
                    <small style="color:#666; font-size:12px;">Min 250km per day</small>
                </div>
                <div class="result-box">
                    <p>Estimated Total</p>
                    <h2 id="calc-total">₹${(300*perKm + bata).toLocaleString()}</h2>
                </div>
            `;

            const calculate = () => {
                const days = parseInt(document.getElementById('calc-days').value) || 1;
                const dist = parseInt(document.getElementById('calc-dist').value) || 0;
                
                const minDist = days * 250;
                const chargeableDist = Math.max(dist, minDist);
                const total = (chargeableDist * perKm) + (days * bata);
                
                document.getElementById('calc-total').innerText = `₹${total.toLocaleString()}`;
            };
            
            modalBody.addEventListener('input', calculate);
        }

        modalFooter.innerHTML = `
            <a href="https://wa.me/918883451668?text=Hi, I am interested in ${title} booking." target="_blank" class="cta-btn primary" style="width:100%; text-align:center;">
                <i class="fab fa-whatsapp"></i> Book This Estimate
            </a>
        `;
    }
});
document.addEventListener('DOMContentLoaded', () => {

    // 1. TABS LOGIC
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
        });
    });

    // 2. GOOGLE SHEET DATA FETCH
    fetch('/.netlify/functions/travels-api?action=getTariff')
        .then(res => res.json())
        .then(data => {
            if (data.local && data.local.length > 0) {
                processCards(data.local, 'local');
            }
            if (data.outstation && data.outstation.length > 0) {
                processCards(data.outstation, 'outstation');
            }
        })
        .catch(err => console.log("Using static fallback data due to API error:", err));


    // 3. SMART PROCESSING LOGIC
    function processCards(data, type) {
        const container = document.querySelector(`#${type}-tab .tariff-grid`);
        
        data.forEach(item => {
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
        if (type === 'local') {
            card.querySelector('.price').textContent = `₹${Number(item.Base_Fare).toLocaleString()}`;
            const features = card.querySelectorAll('.card-features li');
            if(features.length >= 2) {
                features[0].innerHTML = `<i class="ri-time-line"></i> Extra Hour: ₹${item.Extra_Hr_Rate}`;
                features[1].innerHTML = `<i class="ri-route-line"></i> Extra KM: ₹${item.Extra_Km_Rate}`;
            }
        } else {
            card.querySelector('.price').textContent = `₹${item.Rate_Per_Km}`;
            const features = card.querySelectorAll('.card-features li');
            if(features.length >= 1) {
                features[0].innerHTML = `Driver BATA: ₹${item.Driver_Bata}/day`;
            }
        }
    }

    function createCardHTML(item, type) {
        const iconClass = item.Image_Class || 'fas fa-car'; 
        if (type === 'local') {
            return `
            <div class="package-card" data-vehicle="${item.ID}">
                <div class="card-icon"><i class="${iconClass}"></i></div>
                <h3>${item.Name}</h3>
                <div class="card-price"><span class="price">₹${Number(item.Base_Fare).toLocaleString()}</span> / ${item.Base_Hr}hr</div>
                <ul class="card-features">
                    <li><i class="ri-time-line"></i> Extra Hour: ₹${item.Extra_Hr_Rate}</li>
                    <li><i class="ri-route-line"></i> Extra KM: ₹${item.Extra_Km_Rate}</li>
                </ul>
                <button class="btn-estimate" data-vehicle-id="${item.ID}">Estimate Fare</button>
            </div>`;
        } else {
            return `
            <div class="package-card" data-vehicle="${item.ID}">
                <div class="card-icon"><i class="${iconClass}"></i></div>
                <h3>${item.Name}</h3>
                <div class="card-price"><span class="price">₹${item.Rate_Per_Km}</span> / km</div>
                <ul class="card-features">
                    <li>Driver BATA: ₹${item.Driver_Bata}/day</li>
                    <li>Min ${item.Min_Km_Per_Day}km / day</li>
                </ul>
                <button class="btn-estimate" data-vehicle-id="${item.ID}">Estimate Fare</button>
            </div>`;
        }
    }


    // 4. MODAL LOGIC WITH DYNAMIC WHATSAPP LINK
    const modal = document.getElementById('estimatorModal');
    
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-estimate')) {
            const vehicleId = e.target.getAttribute('data-vehicle-id');
            openCalculator(vehicleId);
        }
        if (e.target.closest('.modal-close') || e.target.closest('.close-modal')) {
            if(modal) modal.classList.add('hidden');
        }
    });

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    }

    function openCalculator(vehicleId) {
        const modalBody = document.getElementById('modalBody');
        const modalFooter = document.getElementById('modalFooter');
        const modalTitle = document.getElementById('modalTitle');
        
        modal.classList.remove('hidden');
        
        const card = document.querySelector(`.package-card[data-vehicle="${vehicleId}"]`);
        if(!card) return;

        const title = card.querySelector('h3').innerText;
        const isLocal = card.closest('#local-tab') !== null;
        
        const getPrice = (selector) => {
            const text = card.querySelector(selector)?.innerText || "0";
            return parseInt(text.replace(/[^\d]/g, ''));
        };

        modalTitle.innerText = `Estimate: ${title}`;

        // Initialize Button
        modalFooter.innerHTML = `
            <a href="#" id="wa-link" target="_blank" class="cta-btn primary" style="width:100%; text-align:center;">
                <i class="fab fa-whatsapp"></i> Book This Estimate
            </a>
        `;
        const waBtn = document.getElementById('wa-link');

        if (isLocal) {
            // --- LOCAL LOGIC ---
            const baseFare = getPrice('.price');
            const rows = card.querySelectorAll('.card-features li');
            const extraHrRate = rows[0] ? parseInt(rows[0].innerText.replace(/[^\d]/g, '')) : 0;
            const extraKmRate = rows[1] ? parseInt(rows[1].innerText.replace(/[^\d]/g, '')) : 0;

            modalBody.innerHTML = `
                <div class="form-group">
                    <label>Additional Kilometers</label>
                    <input type="number" id="calc-km" class="form-input" value="0" min="0">
                </div>
                <div class="form-group">
                    <label>Additional Hours</label>
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

                // Construct Detailed Message
                const msg = `*New Quote Request* %0A%0A` +
                            `🚗 *Vehicle:* ${title} (Local) %0A` +
                            `📍 *Base Fare:* ₹${baseFare} %0A` + 
                            `➕ *Extra:* ${km} km & ${hr} hrs %0A` +
                            `💰 *Est. Total:* ₹${total.toLocaleString()}`;
                
                waBtn.href = `https://wa.me/918883451668?text=${msg}`;
            };
            
            modalBody.addEventListener('input', calculate);
            calculate(); // Run once to set initial link

        } else {
            // --- OUTSTATION LOGIC ---
            const perKm = getPrice('.price');
            const rows = card.querySelectorAll('.card-features li');
            const bata = rows[0] ? parseInt(rows[0].innerText.replace(/[^\d]/g, '')) : 0;

            modalBody.innerHTML = `
                <div class="form-group">
                    <label>Total Trip Days</label>
                    <input type="number" id="calc-days" class="form-input" value="1" min="1">
                </div>
                <div class="form-group">
                    <label>Total Distance (Round Trip KMs)</label>
                    <input type="number" id="calc-dist" class="form-input" value="300" min="250">
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

                // Construct Detailed Message
                const msg = `*New Quote Request* %0A%0A` +
                            `🚗 *Vehicle:* ${title} (Outstation) %0A` +
                            `📅 *Duration:* ${days} Days %0A` + 
                            `🛣 *Distance:* ${dist} km (Chargeable: ${chargeableDist} km) %0A` +
                            `💰 *Est. Total:* ₹${total.toLocaleString()}`;
                
                waBtn.href = `https://wa.me/918883451668?text=${msg}`;
            };
            
            modalBody.addEventListener('input', calculate);
            calculate(); // Run once to set initial link
        }
    }
});
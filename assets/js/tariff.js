document.addEventListener('DOMContentLoaded', () => {
    
    // STATE
    let pricingData = { local: [], outstation: [] };
    let currentTab = 'local';
    let currentVehicle = null;

    // DOM ELEMENTS
    const container = document.getElementById('tariff-content');
    const loader = document.getElementById('tariff-loader');
    const tabs = document.querySelectorAll('.tab-btn');
    const modal = document.getElementById('estimatorModal');

    // 1. FETCH DATA
    fetch('/.netlify/functions/travels-api?action=getTariff')
        .then(res => res.json())
        .then(data => {
            pricingData = data;
            loader.style.display = 'none';
            container.classList.remove('hidden');
            renderCards('local'); // Default
        })
        .catch(err => {
            console.error(err);
            loader.innerHTML = '<p class="text-red-500">Failed to load rates.</p>';
        });

    // 2. RENDER CARDS
    function renderCards(type) {
        currentTab = type;
        container.innerHTML = '';
        
        const list = pricingData[type];
        if(!list) return;

        list.forEach(item => {
            const card = document.createElement('div');
            card.className = 'tariff-card';
            
            // Format Price Display
            let priceDisplay = '';
            let featuresHtml = '';

            if(type === 'local') {
                priceDisplay = `₹${item.Base_Fare} <span class="card-unit">/ ${item.Base_Hr}hr</span>`;
                featuresHtml = `
                    <li><span>Base KMs</span> <strong>${item.Base_Km} km</strong></li>
                    <li><span>Extra Km</span> <strong>₹${item.Extra_Km_Rate}</strong></li>
                    <li><span>Extra Hr</span> <strong>₹${item.Extra_Hr_Rate}</strong></li>
                `;
            } else {
                priceDisplay = `₹${item.Rate_Per_Km} <span class="card-unit">/ km</span>`;
                featuresHtml = `
                    <li><span>Min Km/Day</span> <strong>${item.Min_Km_Per_Day}</strong></li>
                    <li><span>Driver Bata</span> <strong>₹${item.Driver_Bata} / day</strong></li>
                    <li><span>Tolls</span> <strong>Extra</strong></li>
                `;
            }

            card.innerHTML = `
                <div class="card-icon"><i class="${item.Image_Class || 'fas fa-car'}"></i></div>
                <h3>${item.Name}</h3>
                <div class="card-price">${priceDisplay}</div>
                <ul class="card-features">${featuresHtml}</ul>
                <button class="btn-calc" onclick="openCalculator('${type}', '${item.ID}')">
                    <i class="fas fa-calculator"></i> Calculate Estimate
                </button>
            `;
            container.appendChild(card);
        });
    }

    // 3. TAB LOGIC
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderCards(btn.dataset.target);
        });
    });

    // 4. CALCULATOR LOGIC (Global Function so HTML can call it)
    window.openCalculator = function(type, id) {
        // Find vehicle data from our memory
        currentVehicle = pricingData[type].find(v => v.ID === id);
        if(!currentVehicle) return;

        const modalBody = document.getElementById('modalBody');
        const modalTitle = document.getElementById('modalTitle');
        const modalFooter = document.getElementById('modalFooter');

        modalTitle.innerText = `Estimate for ${currentVehicle.Name}`;
        modal.classList.add('active');

        // Build Form Dynamic
        if(type === 'local') {
            modalBody.innerHTML = `
                <div class="form-group">
                    <label>Extra Kms (beyond ${currentVehicle.Base_Km})</label>
                    <input type="number" id="extraKm" class="form-input" value="0" min="0">
                </div>
                <div class="form-group">
                    <label>Extra Hours (beyond ${currentVehicle.Base_Hr})</label>
                    <input type="number" id="extraHr" class="form-input" value="0" min="0">
                </div>
                <div class="result-box">
                    <div id="estTotal" class="result-price">₹${currentVehicle.Base_Fare}</div>
                    <small>Approx. Estimate</small>
                </div>
            `;
        } else {
            modalBody.innerHTML = `
                <div class="form-group">
                    <label>Total Days</label>
                    <input type="number" id="days" class="form-input" value="1" min="1">
                </div>
                <div class="form-group">
                    <label>Total Distance (Km)</label>
                    <input type="number" id="kms" class="form-input" value="300" min="0">
                </div>
                <div class="result-box">
                    <div id="estTotal" class="result-price">₹0</div>
                    <small>Approx. Estimate</small>
                </div>
            `;
        }

        // Real-time calculation listeners
        const inputs = modalBody.querySelectorAll('input');
        inputs.forEach(i => i.addEventListener('input', calculate));
        calculate(); // Run once initially

        // Footer Actions
        modalFooter.innerHTML = `
            <a href="https://wa.me/918883451668?text=I need a quote for ${currentVehicle.Name}" target="_blank" class="btn-calc" style="text-align:center; display:block; background:#25D366; border:none;">
                <i class="fab fa-whatsapp"></i> Book on WhatsApp
            </a>
        `;
    };

    function calculate() {
        if(!currentVehicle) return;
        const display = document.getElementById('estTotal');
        let total = 0;

        if(currentTab === 'local') {
            const exKm = Number(document.getElementById('extraKm').value) || 0;
            const exHr = Number(document.getElementById('extraHr').value) || 0;
            
            total = Number(currentVehicle.Base_Fare) + 
                   (exKm * Number(currentVehicle.Extra_Km_Rate)) + 
                   (exHr * Number(currentVehicle.Extra_Hr_Rate));

        } else {
            const days = Number(document.getElementById('days').value) || 1;
            const kms = Number(document.getElementById('kms').value) || 0;
            
            // Outstation Logic: Min Km Check
            const minKm = Number(currentVehicle.Min_Km_Per_Day) * days;
            const chargedKm = Math.max(kms, minKm);
            
            const kmCost = chargedKm * Number(currentVehicle.Rate_Per_Km);
            const bataCost = days * Number(currentVehicle.Driver_Bata);
            
            total = kmCost + bataCost;
        }

        display.innerText = `₹${total.toLocaleString()}`;
    }

    // Close Modal
    document.querySelector('.close-modal').addEventListener('click', () => {
        modal.classList.remove('active');
    });
});
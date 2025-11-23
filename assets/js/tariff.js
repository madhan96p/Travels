/* ===================================================================
   TARIFF PAGE JAVASCRIPT | SHRISH TRAVELS
   Handles tab switching, fare estimation, and quotation generation.
   =================================================================== */

'use strict';

// --- 1. Data Store for Calculation ---
const PRIMARY_BOOKING_NUMBER = '+918883451668';

// This data should ideally come from a GSheet API call (e.g., travels-api?action=getTariffData)
// But for now, we hardcode the transparent rates for speed.
const vehicleData = {
    'local-sedan': { type: 'local', name: '4+1 Sedan', baseFare: 1300, kmRate: 14, hrRate: 260, baseKm: 50, baseHr: 5 },
    'local-innova': { type: 'local', name: '7+1 Innova', baseFare: 1900, kmRate: 19, hrRate: 300, baseKm: 50, baseHr: 5 },
    'local-crysta': { type: 'local', name: '7+1 Innova Crysta', baseFare: 2200, kmRate: 22, hrRate: 440, baseKm: 50, baseHr: 5 },
    'local-tempo': { type: 'local', name: '12+1 Tempo Traveller', baseFare: 3000, kmRate: 24, hrRate: 550, baseKm: 50, baseHr: 5 },
    
    'outstation-sedan': { type: 'outstation', name: '4+1 Sedan', kmRate: 14, bata: 700, minKm: 250 },
    'outstation-innova': { type: 'outstation', name: '7+1 Innova', kmRate: 19, bata: 800, minKm: 250 },
    'outstation-crysta': { type: 'outstation', name: '7+1 Crysta', kmRate: 22, bata: 800, minKm: 250 },
    'outstation-tempo': { type: 'outstation', name: '12+1 Tempo Traveller', kmRate: 24, bata: 1000, minKm: 300 }
};

let currentVehicle = null;
let currentEstimate = null; // Stores the detailed breakdown

// --- 2. Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeEstimatorButtons();

    // Attach listener to the Modal close button
    const modalCloseBtn = document.querySelector('#estimatorModal .modal-close');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

    // Attach listener to Modal overlay
    const estimatorModal = document.getElementById('estimatorModal');
    if (estimatorModal) estimatorModal.addEventListener('click', (e) => {
        if (e.target === estimatorModal) closeModal();
    });
});


// --- 3. Core UI Functions ---

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            // Update button active state
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Show the target tab content
            tabContents.forEach(content => {
                if (content.id === `${targetTab}-tab`) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });
}

function initializeEstimatorButtons() {
    document.querySelectorAll('.btn-estimate').forEach(button => {
        button.addEventListener('click', function() {
            const vehicleId = this.dataset.vehicleId;
            if (vehicleId) openModal(vehicleId);
        });
    });
}


// --- 4. Modal Management ---

function openModal(vehicleId) {
    currentVehicle = vehicleData[vehicleId];
    if (!currentVehicle) return;

    const estimatorModal = document.getElementById('estimatorModal');
    const modalTitle = document.getElementById('modalTitle');

    modalTitle.textContent = `Estimate for ${currentVehicle.name}`;
    renderEstimatorView(); // Build the form inside the modal
    estimatorModal.classList.remove('hidden');
    document.body.classList.add('modal-open'); // Added class for general no-scroll

    // Ensure the modal has an active class or similar for CSS transitions
    setTimeout(() => { estimatorModal.classList.add('active'); }, 10);
}

function closeModal() {
    const estimatorModal = document.getElementById('estimatorModal');
    estimatorModal.classList.remove('active');
    document.body.classList.remove('modal-open');
    // Hide after transition
    setTimeout(() => { estimatorModal.classList.add('hidden'); }, 300);
    currentVehicle = null;
    currentEstimate = null;
}

function renderEstimatorView() {
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');
    modalBody.innerHTML = '';
    modalFooter.innerHTML = '';

    const form = document.createElement('form');
    form.className = 'estimator-form';
    form.onsubmit = (e) => e.preventDefault(); 

    // Determine inputs based on Local vs. Outstation
    if (currentVehicle.type === 'local') {
        form.innerHTML = `
            <p class="note">Base package: ${currentVehicle.baseHr} Hrs & ${currentVehicle.baseKm} KMs (₹${currentVehicle.baseFare.toLocaleString()})</p>
            <div class="form-group">
                <label for="extraKm">Extra Kilometers (Beyond ${currentVehicle.baseKm} KMs @ ₹${currentVehicle.kmRate}/km)</label>
                <input type="number" class="form-input" id="extraKm" min="0" value="0">
            </div>
            <div class="form-group">
                <label for="extraHr">Extra Hours (Beyond ${currentVehicle.baseHr} Hrs @ ₹${currentVehicle.hrRate}/hr)</label>
                <input type="number" class="form-input" id="extraHr" min="0" value="0">
            </div>
        `;
    } else { // Outstation
        form.innerHTML = `
            <p class="note">Min. charge: ${currentVehicle.minKm} KMs/day. Driver BATA: ₹${currentVehicle.bata.toLocaleString()}/day.</p>
            <div class="form-group">
                <label for="totalDays">Number of Days</label>
                <input type="number" class="form-input" id="totalDays" min="1" value="1">
            </div>
            <div class="form-group">
                <label for="totalKm">Total Kilometers (Approx. trip distance)</label>
                <input type="number" class="form-input" id="totalKm" min="0" placeholder="e.g., 550 for a 2-day trip">
            </div>
        `;
    }
    modalBody.appendChild(form);

    const resultDiv = document.createElement('div');
    resultDiv.className = 'estimate-result-summary';
    resultDiv.innerHTML = `
        <div class="result-label">Estimated Total Fare</div>
        <div id="estimatedTotal" class="result-value">₹0</div>
        <div id="estimateBreakdown" class="result-breakdown">Enter details to calculate trip cost.</div>
        <p class="disclaimer-note">Excludes Tolls, Parking, and Permits (Actuals charged later).</p>
    `;
    modalBody.appendChild(resultDiv);
    
    // Add event listeners for real-time calculation
    form.querySelectorAll('input').forEach(input => input.addEventListener('input', calculateEstimate));

    modalFooter.innerHTML = `
        <button id="generateQuoteBtn" class="cta-btn primary" disabled>Generate Printable Quote</button>
    `;

    // Must be attached *after* the button is in the DOM
    document.getElementById('generateQuoteBtn').addEventListener('click', renderQuotationView);

    calculateEstimate(); // Initial calculation
}


// --- 5. Calculation Logic ---
function calculateEstimate() {
    if (!currentVehicle) return;

    let total = 0;
    let breakdown = '';
    const generateQuoteBtn = document.getElementById('generateQuoteBtn');
    generateQuoteBtn.disabled = true; // Default to disabled

    // --- Local Trip Calculation ---
    if (currentVehicle.type === 'local') {
        const extraKm = parseInt(document.getElementById('extraKm')?.value) || 0;
        const extraHr = parseInt(document.getElementById('extraHr')?.value) || 0;

        const extraKmCost = extraKm * currentVehicle.kmRate;
        const extraHrCost = extraHr * currentVehicle.hrRate;
        total = currentVehicle.baseFare + extraKmCost + extraHrCost;

        breakdown = `Base (₹${currentVehicle.baseFare.toLocaleString()}) + Extra KMs (₹${extraKmCost.toLocaleString()}) + Extra Hrs (₹${extraHrCost.toLocaleString()})`;
        currentEstimate = { vehicleType: currentVehicle.name, packageType: 'Local Package', basePackage: `${currentVehicle.baseHr} Hrs & ${currentVehicle.baseKm} KMs`, baseCost: currentVehicle.baseFare, extraKm, extraKmCost, extraHr, extraHrCost, total };
    
    // --- Outstation Trip Calculation ---
    } else { 
        const totalDays = parseInt(document.getElementById('totalDays')?.value) || 0;
        const totalKm = parseInt(document.getElementById('totalKm')?.value) || 0;

        if (totalDays === 0 || totalKm === 0) {
            document.getElementById('estimatedTotal').textContent = `₹0`;
            document.getElementById('estimateBreakdown').innerHTML = 'Enter trip days and kilometers.';
            return;
        }

        const minKmRequired = totalDays * currentVehicle.minKm;
        const chargedKm = Math.max(totalKm, minKmRequired);
        const kmCost = chargedKm * currentVehicle.kmRate;
        const bataCost = totalDays * currentVehicle.bata;
        total = kmCost + bataCost;

        breakdown = `Charged ${chargedKm.toLocaleString()} KMs (${chargedKm > totalKm ? 'Min. Charge Applied' : 'Actual KMs'}) + Driver BATA (${totalDays} Day/s)`;
        currentEstimate = { vehicleType: currentVehicle.name, packageType: 'Outstation Package', totalDays, totalKm, chargedKm, kmCost, bataCost, total, kmRate: currentVehicle.kmRate, bata: currentVehicle.bata };
    }

    // Update display and button state
    document.getElementById('estimatedTotal').textContent = `₹${total.toLocaleString('en-IN')}`;
    document.getElementById('estimateBreakdown').innerHTML = breakdown;
    generateQuoteBtn.disabled = total <= 0;
}


// --- 6. Quotation View (Sharing/Printing) ---
function renderQuotationView() { 
    if (!currentEstimate) return;

    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');
    
    modalTitle.textContent = 'Travel Quotation Preview';
    modalBody.innerHTML = generateModalQuotationHTML(currentEstimate); // Reuses the previous helper logic

    modalFooter.innerHTML = `
        <div class="quotation-footer-actions">
            <a href="tel:${PRIMARY_BOOKING_NUMBER}" class="cta-btn primary"><i class="ri-phone-fill"></i> Call to Book</a>
            <div class="secondary-actions">
                <button class="btn-secondary-action" id="shareBtn"><i class="ri-whatsapp-fill"></i> Share</button>
                <button class="btn-secondary-action" id="downloadBtn"><i class="ri-download-2-fill"></i> Download PDF</button>
            </div>
        </div>
    `;
    
    // Assuming the shareQuotation/downloadQuotation functions are available/defined locally
    document.getElementById('shareBtn').addEventListener('click', shareQuotation);
    document.getElementById('downloadBtn').addEventListener('click', downloadQuotation);
}


// --- 7. Sharing & Downloading Logic (Must be defined here for tariff.js) ---

const formatCurrency = (num) => parseFloat(num || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

function generateModalQuotationHTML(estimate) {
    let detailsHTML = '';
    if (estimate.packageType === 'Local Package') {
        detailsHTML += `<div class="preview-item"><span>Base Package (${estimate.basePackage})</span><span class="amount">₹${estimate.baseCost.toLocaleString('en-IN')}</span></div>`;
        if (estimate.extraKm > 0) detailsHTML += `<div class="preview-item"><span>Extra KMs (${estimate.extraKm} km)</span><span class="amount">₹${estimate.extraKmCost.toLocaleString('en-IN')}</span></div>`;
        if (estimate.extraHr > 0) detailsHTML += `<div class="preview-item"><span>Extra Hours (${estimate.extraHr} hr)</span><span class="amount">₹${estimate.extraHrCost.toLocaleString('en-IN')}</span></div>`;
    } else {
        detailsHTML += `<div class="preview-item"><span>KM Charges (${estimate.chargedKm} km @ ₹${estimate.kmRate}/km)</span><span class="amount">₹${estimate.kmCost.toLocaleString('en-IN')}</span></div>`;
        detailsHTML += `<div class="preview-item"><span>Driver BATA (${estimate.totalDays} day/s @ ₹${estimate.bata})</span><span class="amount">₹${estimate.bataCost.toLocaleString('en-IN')}</span></div>`;
    }

    return `
    <div class="quotation-preview-card">
        <div class="preview-header">
            <h4>Quotation for ${estimate.vehicleType}</h4>
            <span class="quote-date">${new Date().toLocaleDateString('en-IN')}</span>
        </div>
        <div class="preview-line-items">${detailsHTML}</div>
        <div class="preview-total">
            <span>Estimated Total</span>
            <span class="total-amount">${formatCurrency(estimate.total)}</span>
        </div>
        <p class="preview-disclaimer">Note: Excludes tolls, parking, and permits.</p>
    </div>`;
}

function shareQuotation() {
    // This function will generate and open a WhatsApp link
    if (!currentEstimate) return;
    let message = `*Your Travel Quotation from Shrish Travels*\n\n`;
    // ... [WhatsApp message generation logic goes here, similar to the API helper] ...
    
    // For this demonstration, we'll just alert the total.
    alert(`Sharing quote via WhatsApp: Total Estimated Fare is ${formatCurrency(currentEstimate.total)}`);
    // window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

function downloadQuotation() {
    // This function generates a printable HTML page in an iframe and triggers the browser's print dialog
    alert('Generating Printable PDF/Quote (Uses Browser Print Dialog)...');
    // ... [Print generation logic goes here, similar to the API helper] ...
}
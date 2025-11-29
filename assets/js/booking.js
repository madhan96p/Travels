document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION: Smart Phone Input (Reused) ---
    const countries = [
        { code: "+91", flag: "🇮🇳", name: "India" }, { code: "+971", flag: "🇦🇪", name: "UAE" },
        { code: "+1", flag: "🇺🇸", name: "USA" }, { code: "+44", flag: "🇬🇧", name: "UK" },
        { code: "+65", flag: "🇸🇬", name: "Singapore" }, { code: "+60", flag: "🇲🇾", name: "Malaysia" }
    ];

    // DOM Elements for Phone
    const phoneInput = document.getElementById('phone-input');
    const dropdown = document.getElementById('country-dropdown');
    const display = document.getElementById('selected-display');
    const hiddenInput = document.getElementById('hidden-country-code');
    const menu = document.getElementById('dropdown-menu');
    const list = document.getElementById('country-list');

    // 1. INIT PHONE DROPDOWN
    if (list) {
        countries.forEach(c => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${c.flag}</span> <span>${c.name}</span> <span style="color:#ccc; margin-left:auto">${c.code}</span>`;
            li.addEventListener('click', (e) => {
                e.stopPropagation();
                display.innerText = `${c.flag} ${c.code}`;
                hiddenInput.value = c.code;
                menu.classList.remove('active');
                dropdown.classList.remove('active');
                if(phoneInput) phoneInput.focus();
            });
            list.appendChild(li);
        });
    }
    // Toggle
    if (display) {
        display.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('active');
            dropdown.classList.toggle('active');
        });
    }
    // Close Click Outside
    document.addEventListener('click', (e) => {
        if(dropdown && !dropdown.contains(e.target)) {
            menu.classList.remove('active');
            dropdown.classList.remove('active');
        }
    });


    // --- 2. UI LOGIC: Toggles & Animations ---

    // A. Corporate Toggle
    const corpCheckbox = document.getElementById('corporate-booking-checkbox');
    const corpFields = document.getElementById('corporate-fields');

    if (corpCheckbox && corpFields) {
        corpCheckbox.addEventListener('change', function() {
            corpFields.style.display = this.checked ? 'block' : 'none';
        });
    }

    // B. Return Date Toggle (Round Trip Logic)
    const radioButtons = document.querySelectorAll('input[name="journeytype"]');
    const returnDateContainer = document.getElementById('return-date-container');
    const returnDateInput = document.getElementById('return_date');
    const startDateInput = document.getElementById('date');

    function toggleReturnDate() {
        const selected = document.querySelector('input[name="journeytype"]:checked');
        if (selected && returnDateContainer) {
            if (selected.value === 'Round Trip') {
                returnDateContainer.style.display = 'block';
                returnDateContainer.classList.add('fade-in');
                if(returnDateInput) returnDateInput.required = true;
            } else {
                returnDateContainer.style.display = 'none';
                if(returnDateInput) {
                    returnDateInput.required = false;
                    returnDateInput.value = '';
                }
            }
        }
    }
    radioButtons.forEach(radio => radio.addEventListener('change', toggleReturnDate));
    
    // Prevent selecting a return date before the start date
    if (startDateInput && returnDateInput) {
        startDateInput.addEventListener('change', () => {
            returnDateInput.min = startDateInput.value;
        });
    }
    toggleReturnDate(); // Run init


    // --- 3. PRE-FILL: Catch Data from Home Page URL ---
    const params = new URLSearchParams(window.location.search);
    if (params.has('from')) document.getElementById('pickup').value = params.get('from');
    if (params.has('to')) document.getElementById('dropoff').value = params.get('to');
    if (params.has('date')) document.getElementById('date').value = params.get('date');


    // --- 4. SUBMISSION LOGIC ---
    const form = document.getElementById('full-booking-form');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            
            // A. Loading State
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Request...';

            // B. Gather Data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Combine Phone (Code + Number)
            const fullMobile = data.country_code + data.phone;

            // Prepare the clean object for API
            // The keys here MUST match the Header Names in your Google Sheet
            const payload = {
                Source: 'BookingPage',
                
                // Mapped Fields
                Pickup_City: data.pickup,
                Drop_City: data.dropoff,
                Travel_Date: data.date,
                Pickup_Time: data.time,
                Return_Date: data.journeytype === 'Round Trip' ? data.return_date : 'N/A',
                Journey_Type: data.journeytype, 
                Travelers: data.travelers,
                
                // FIXED: Use the actual vehicle selection, fallback to Any
                Vehicle_Type: data.vehicle_pref || 'Any Premium',

                // Personal Details
                Customer_Name: data.name,
                Mobile_Number: fullMobile, // Uses the smart combined phone
                Email: data.email || 'N/A',
                
                // Corporate Logic
                Company_Name: data.company_name || 'N/A',
                Is_Corporate: corpCheckbox && corpCheckbox.checked ? 'Yes' : 'No',
                
                // Defaults
                Comments: '', 
                Status: 'New Web Booking',
                Driver_Assigned: 'Pending'
            };

            // C. Send to Backend
            try {
                // Calls netlify/functions/travels-api.js
                const response = await fetch('/.netlify/functions/travels-api?action=submitBooking', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    showToast(`Booking #${result.id} Confirmed!`, 'success');
                    form.reset();
                    // Reset Phone Defaults
                    display.innerText = "🇮🇳 +91";
                    hiddenInput.value = "+91";
                } else {
                    throw new Error(result.error || "Server Error");
                }
            } catch (error) {
                console.error("Booking Error:", error);
                showToast("Connection failed. Please WhatsApp us.", 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }

    // --- HELPER: Toast Notification ---
    function showToast(message, type) {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toast-message');
        const toastIcon = document.getElementById('toast-icon');

        if (!toast || !toastMsg) return;

        toastMsg.innerText = message;
        toast.className = 'toast-container show';
        
        if (type === 'success') {
            toast.classList.add('success');
            if(toastIcon) toastIcon.className = 'ri-checkbox-circle-fill';
        } else {
            toast.classList.add('error');
            if(toastIcon) toastIcon.className = 'ri-error-warning-fill';
        }

        setTimeout(() => toast.classList.remove('show'), 4000);
    }
});
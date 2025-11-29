document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION: Country Data ---
    const countries = [
        { code: "+91", flag: "🇮🇳", name: "India" },
        { code: "+971", flag: "🇦🇪", name: "UAE" },
        { code: "+1", flag: "🇺🇸", name: "USA" },
        { code: "+44", flag: "🇬🇧", name: "UK" },
        { code: "+61", flag: "🇦🇺", name: "Australia" },
        { code: "+974", flag: "🇶🇦", name: "Qatar" },
        { code: "+965", flag: "🇰🇼", name: "Kuwait" },
        { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
        { code: "+65", flag: "🇸🇬", name: "Singapore" },
        { code: "+60", flag: "🇲🇾", name: "Malaysia" },
        { code: "+1", flag: "🇨🇦", name: "Canada" },
        { code: "+49", flag: "🇩🇪", name: "Germany" },
        { code: "+33", flag: "🇫🇷", name: "France" }
    ];

    // --- DOM ELEMENTS ---
    const form = document.getElementById('contactForm');

    // Phone & Dropdown Elements
    const phoneInput = document.getElementById('phone-input');
    const dropdown = document.getElementById('country-dropdown');
    const display = document.getElementById('selected-display');
    const hiddenInput = document.getElementById('hidden-country-code');
    const menu = document.getElementById('dropdown-menu');
    const searchInput = document.getElementById('country-search');
    const list = document.getElementById('country-list');

    // Toast Elements
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    // --- PART 1: DROPDOWN LOGIC ---

    // A. Populate the List
    if (list) {
        countries.forEach(country => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${country.flag}</span> <span>${country.name}</span> <span style="color:#94a3b8; margin-left:auto;">${country.code}</span>`;
            li.setAttribute('data-code', country.code);
            li.setAttribute('data-flag', country.flag);
            li.setAttribute('data-name', country.name.toLowerCase()); // For search optimization

            // Handle Selection
            li.addEventListener('click', (e) => {
                e.stopPropagation();
                display.innerText = `${country.flag} ${country.code}`;
                hiddenInput.value = country.code;
                menu.classList.remove('active');
                dropdown.classList.remove('active');

                if (phoneInput) {
                    phoneInput.style.color = '#0f172a';
                    phoneInput.value = '';
                    phoneInput.focus();
                }
            });

            list.appendChild(li);
        });
    }

    // B. Toggle Dropdown
    if (display) {
        display.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = menu.classList.contains('active');

            menu.classList.toggle('active');
            dropdown.classList.toggle('active');

            if (!isActive) {
                searchInput.focus();
                searchInput.value = '';
                filterList('');
            }
        });
    }

    // C. Search Functionality
    if (searchInput) {
        searchInput.addEventListener('click', (e) => e.stopPropagation()); // Prevent closing when clicking input

        searchInput.addEventListener('input', (e) => {
            filterList(e.target.value.toLowerCase());
        });
    }

    function filterList(query) {
        const items = list.querySelectorAll('li');
        items.forEach(item => {
            const name = item.getAttribute('data-name');
            const code = item.getAttribute('data-code');

            // Search matches Name OR Code (e.g., "Kuwait" or "+965")
            if (name.includes(query) || code.includes(query)) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    }

    // D. Close Dropdown When Clicking Outside
    document.addEventListener('click', (e) => {
        if (dropdown && !dropdown.contains(e.target)) {
            menu.classList.remove('active');
            dropdown.classList.remove('active');
        }
    });

    // --- PART 2: SMART INPUT VALIDATION (UPDATED FOR +91 ONLY) ---

    if (phoneInput) {
        // A. Real-time cleaning
        phoneInput.addEventListener('input', function (e) {
            const currentCode = hiddenInput.value;

            // 1. Remove non-numbers
            let val = this.value.replace(/[^0-9]/g, '');

            // 2. Remove leading '0' (Applies to all countries to save space)
            if (val.startsWith('0')) {
                val = val.substring(1);
            }

            // 3. Conditional Logic
            if (currentCode === '+91') {
                // INDIA: Strict 10 digits
                if (val.length > 10) val = val.substring(0, 10);
            } else {
                // INTERNATIONAL: Allow up to 15 (Standard ITU max)
                if (val.length > 15) val = val.substring(0, 15);
            }

            this.value = val;

            // Visual Feedback
            this.style.color = '#0f172a'; // Default black
        });

        // B. On Blur (Warning)
        phoneInput.addEventListener('blur', function () {
            const currentCode = hiddenInput.value;
            const len = this.value.length;

            if (len > 0) {
                // If India, must be 10. If International, usually at least 7.
                if (currentCode === '+91' && len !== 10) {
                    showToast('Indian numbers must be 10 digits', 'error');
                    this.style.color = 'red';
                }
                else if (currentCode !== '+91' && len < 7) {
                    showToast('Phone number seems too short', 'error');
                    this.style.color = 'red';
                }
            }
        });
    }

    // --- PART 3: FORM SUBMISSION ---

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;

            // 1. Loading State
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            // 2. Gather Data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // 3. Logic: Combine Country Code + Phone
            const countryCode = data.country_code || "+91";
            const rawPhone = data.phone;
            const fullMobile = countryCode + rawPhone;

            // --- VALIDATION CHECK (Logic Updated) ---
            // Only stop submission for 10 digits if it is +91
            if (countryCode === '+91' && rawPhone.length !== 10) {
                showToast('Please enter a valid 10-digit Indian number', 'error');

                // Stop loading
                btn.disabled = false;
                btn.innerHTML = originalText;
                return; // STOP HERE
            }
            // For international, just check it's not empty or too short
            if (countryCode !== '+91' && rawPhone.length < 7) {
                showToast('Please enter a valid mobile number', 'error');
                btn.disabled = false;
                btn.innerHTML = originalText;
                return;
            }

            // 4. Logic: Prepare Payload for Booking Sheet
            const payload = {
                Source: 'ContactPage',
                Customer_Name: data.name,
                Mobile_Number: fullMobile,
                Email: "Not Provided",
                Journey_Type: data.subject,
                Comments: data.message,
                Pickup_City: '—',
                Drop_City: '—',
                Travel_Date: 'Inquiry - No Date',
                Status: 'Inquiry',
                Driver_Assigned: 'Pending'
            };

            // 5. Send to Backend
            try {
                // FIX: Use direct fetch to ensure 'Source' tag is not stripped by ApiService
                await fetch('/.netlify/functions/travels-api?action=submitBooking', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                // Success
                showToast('Message sent! We will call you shortly.', 'success');
                form.reset();

                // Reset Dropdown to Default
                display.innerText = "🇮🇳 +91";
                hiddenInput.value = "+91";

            } catch (error) {
                console.error("Submission Error:", error);
                showToast('Connection failed. Please call +91 888 345 1668', 'error');
            } finally {
                // Restore Button
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }

    // --- HELPER: Toast Notification ---
    function showToast(message, type) {
        if (!toast || !toastMsg) return;

        // Set content
        toastMsg.innerText = message;

        // Reset classes and set type
        toast.className = 'toast-container show';
        if (type === 'success') {
            toast.classList.add('success');
            if (toastIcon) toastIcon.className = 'ri-checkbox-circle-fill';
        } else {
            toast.classList.add('error');
            if (toastIcon) toastIcon.className = 'ri-error-warning-fill';
        }

        // Hide after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }
});
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
                e.stopPropagation(); // Stop click from bubbling up
                display.innerText = `${country.flag} ${country.code}`;
                hiddenInput.value = country.code; // Update the hidden field for the form
                menu.classList.remove('active');
            });

            list.appendChild(li);
        });
    }

    // B. Toggle Dropdown
    if (dropdown) {
        dropdown.addEventListener('click', () => {
            menu.classList.toggle('active');
            if (menu.classList.contains('active')) {
                searchInput.focus(); // Focus search immediately
                searchInput.value = ''; // Clear previous search
                filterList(''); // Show all items
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
        }
    });

    // --- PART 2: INPUT VALIDATION ---
    
    // Prevent non-numeric characters in phone field
    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
            this.value = this.value.replace(/[^0-9]/g, '');
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
            // Note: We get 'country_code' from the hidden input we updated earlier
            const countryCode = data.country_code || "+91"; // Fallback default
            const rawPhone = data.phone;
            const fullMobile = countryCode + rawPhone;

            // 4. Logic: Prepare Payload for Booking Sheet
            // We differentiate "Inquiries" from "Bookings" to keep your sheet clean.
            const payload = {
                Customer_Name: data.name,
                Mobile_Number: fullMobile, 
                Email: "Not Provided", // Add email input to HTML if needed
                Journey_Type: data.subject, 
                Comments: data.message,

                // Defaults to avoid confusing the operations team
                Pickup_City: '—', 
                Drop_City: '—',
                Travel_Date: 'Inquiry - No Date', 
                Status: 'Inquiry',
                Driver_Assigned: 'Pending'
            };

            // 5. Send to Backend
            try {
                // Use centralized API if available
                if (window.ApiService) {
                    await ApiService.submitBooking(payload);
                } else {
                    // Direct Fetch (Replace with your actual endpoint)
                    await fetch('/.netlify/functions/travels-api?action=submitBooking', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

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
            if(toastIcon) toastIcon.className = 'ri-checkbox-circle-fill';
        } else {
            toast.classList.add('error');
            if(toastIcon) toastIcon.className = 'ri-error-warning-fill';
        }

        // Hide after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }
});
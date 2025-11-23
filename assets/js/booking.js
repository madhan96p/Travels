/* ===================================================================
   BOOKING PAGE JAVASCRIPT | SHRISH TRAVELS
   Handles form submissions via the centralized Netlify API.
   =================================================================== */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM Element Selection & Configuration ---
    const bookingForm = document.getElementById('full-booking-form');
    const submitBtn = bookingForm ? bookingForm.querySelector('button[type="submit"]') : null;
    const submissionPopup = document.getElementById('submission-popup');
    const dateInput = document.getElementById('date');
    const corporateCheckbox = document.getElementById('corporate-booking-checkbox');
    const corporateFields = document.getElementById('corporate-fields');
    
    // API Endpoint for booking submission
    const API_ENDPOINT = '/.netlify/functions/travels-api?action=submitBooking';

    if (!bookingForm) return; // Exit if form element not found

    // --- 2. Core Utility Functions (Popup & Date) ---

    /**
     * Shows a status popup (success or error). (Assumes popup HTML structure is in booking.html)
     */
    const showPopup = (status, title, message) => {
        const popupContent = submissionPopup.querySelector('.popup-content');
        const iconClass = status === 'success' ? 'ri-checkbox-circle-fill success' : 'ri-error-warning-fill error';
        
        popupContent.innerHTML = `
            <i class="popup-icon ${iconClass}"></i>
            <h3 class="popup-title">${title}</h3>
            <p class="popup-message">${message}</p>
            <div class="popup-buttons">
                <button id="popup-ok-btn" class="cta-btn primary">OK</button>
            </div>
        `;

        submissionPopup.classList.remove('hidden');
        document.getElementById('popup-ok-btn').addEventListener('click', hidePopup);
    };

    /**
     * Hides the status popup.
     */
    const hidePopup = () => {
        submissionPopup.classList.add('hidden');
    };

    /**
     * Sets the minimum selectable date for the journey to today.
     */
    const setMinDate = () => {
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.setAttribute('min', today);
        }
    };
    
    // --- 3. B2B/Corporate Toggle Logic ---
    const toggleCorporateFields = () => {
        if (corporateCheckbox && corporateFields) {
            corporateFields.style.display = corporateCheckbox.checked ? 'block' : 'none';
        }
    };

    // --- 4. Form Submission Handler ---
    const handleFormSubmit = async (e) => {
        e.preventDefault();

        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="ri-loader-4-line rotating"></i> Submitting...`;

        // Gather all form data
        const formData = new FormData(bookingForm);
        // Map form IDs to the Google Sheet column headers (Case-sensitive alignment is crucial!)
        const data = {
            Timestamp: new Date().toISOString(), // Redundant, but good for local safety
            Name: formData.get('name'),
            Email: formData.get('email') || '', // NEW: Optional B2B Field
            Company_Name: formData.get('company_name') || '', // NEW: Optional B2B Field
            Phone: formData.get('phone'),
            Pickup: formData.get('pickup'),
            Dropoff: formData.get('dropoff'),
            Date_of_Journey: formData.get('date'),
            Travelers: formData.get('travelers'),
            Journey_Type: formData.get('journeytype'),
            Status: 'New Lead'
        };

        // Custom B2B success message title
        const successTitle = data.Company_Name ? 'Corporate Request Received!' : 'Request Sent!';
        const successMessage = data.Company_Name ? 
            'Thank you for your B2B inquiry. Your request has been prioritized, and an account manager will contact you shortly.' :
            'Our team will contact you shortly to confirm your booking. Thank you!';

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showPopup('success', successTitle, successMessage);
                bookingForm.reset();
                setMinDate(); 
            } else {
                // API returned a JSON error response
                console.error('API Error:', result.error);
                showPopup('error', 'Submission Failed', 'Something went wrong. Please try again or call us directly.');
            }

        } catch (error) {
            // Network failure or parsing error
            console.error('Form Submission Error:', error);
            showPopup('error', 'Submission Failed', 'A network error occurred. Please call us directly.');

        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
        }
    };


    // --- 5. Event Listeners & Initializations ---
    // prefillFormFromURL(); // Functionality from old site, needs reimplementation on new booking.html
    setMinDate();
    
    // B2B Toggle Listener
    if (corporateCheckbox) {
        corporateCheckbox.addEventListener('change', toggleCorporateFields);
        toggleCorporateFields(); // Set initial state
    }

    bookingForm.addEventListener('submit', handleFormSubmit);
    submissionPopup.addEventListener('click', (e) => {
        if (e.target === submissionPopup) hidePopup();
    });
});
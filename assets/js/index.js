/* ===================================================================
   INDEX PAGE JAVASCRIPT | SHRISH TRAVELS
   Handles the Quick Booking form, animations, and API submission.
   =================================================================== */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM Element Selection & Configuration ---
    const quickBookingForm = document.getElementById('quick-booking-form');
    const submitBtn = quickBookingForm ? quickBookingForm.querySelector('.submit-btn') : null;
    const bookingPopup = document.getElementById('booking-popup');
    const popupOkBtn = document.getElementById('popup-ok');
    const popupBookInstantBtn = document.getElementById('popup-book-instant');
    
    // API Endpoint for quick submission (uses the same endpoint as full booking)
    const API_ENDPOINT = '/.netlify/functions/travels-api?action=submitBooking'; 

    if (!quickBookingForm) return; 

    // --- 2. Core Popup Logic ---

    /**
     * Shows the confirmation popup and prepares the full booking link.
     */
    function showPopup(name, mobile, pickup) {
        if (bookingPopup) {
            // Encode data for the 'Book Instantly' link to pre-fill the full booking form
            popupBookInstantBtn.href = `booking.html?name=${encodeURIComponent(name)}&mobile=${encodeURIComponent(mobile)}&pickup=${encodeURIComponent(pickup)}`;

            bookingPopup.classList.remove('hidden');
            // The rest of the visual transitions are handled by CSS/common.js (if any)
        }
    }

    /**
     * Hides the confirmation popup.
     */
    function hidePopup() {
        if (bookingPopup) {
            bookingPopup.classList.add('hidden');
        }
    }

    // --- 3. API Submission Logic ---
    
    /**
     * Sends the quick booking request to the Netlify API.
     */
    const handleFormSubmit = async (e) => {
        e.preventDefault(); 
        
        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="ri-loader-4-line rotating"></i> Sending...`;
        
        // 1. Capture Data
        const name = document.getElementById('quick-name').value.trim();
        const mobile = document.getElementById('quick-mobile').value.trim();
        const pickup = document.getElementById('quick-pickup').value.trim();
        
        // Data structure mapped to the 'travels_bookings' GSheet columns
        const data = {
            Name: name,
            Phone: mobile,
            Pickup: pickup,
            Dropoff: 'N/A (Quick Callback)',
            Journey_Type: 'Callback Request',
            // Other required columns will be empty, which the API handles
            Status: 'Quick Lead' 
        };

        try {
            // 2. Send to API
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // 3. Show Success & Offer Upsell (Book Instantly)
                showPopup(name, mobile, pickup);
                quickBookingForm.reset(); 
            } else {
                // 4. Handle API Error
                alert(`Submission Failed. Please call us directly at +91 888 345 1668. Error: ${result.error || 'Unknown Error'}`);
            }

        } catch (error) {
            // Network Failure
            console.error('Quick Form Submission Error:', error);
            alert('A network error occurred. Please check your connection or call us directly.');
        } finally {
            // 5. Restore Button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
        }
    };
    
    // --- 4. Event Listeners & Initializations ---

    // Attach form submission listener
    quickBookingForm.addEventListener('submit', handleFormSubmit);

    // Attach click listeners to the popup buttons and overlay
    if (popupOkBtn) {
        popupOkBtn.addEventListener('click', hidePopup);
    }
    if (bookingPopup) {
        bookingPopup.addEventListener('click', (e) => {
            if (e.target === bookingPopup) {
                hidePopup();
            }
        });
    }

    // NOTE: Animations (3D Tilt, Marquee Pause) are handled here in a final version of this script.
    // For this step, we focus on the core API integration.
});
/* ===================================================================
   CAREER PAGE JAVASCRIPT | SHRISH TRAVELS
   Handles the driver application form submission via the centralized API.
   =================================================================== */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM Element Selection & Configuration ---
    const driverForm = document.getElementById('driver-application-form');
    // Note: Submission popup ID is handled by window.showGlobalPopup
    
    // API Endpoint for career application submission
    const API_ENDPOINT = '/.netlify/functions/travels-api?action=submitCareer';

    if (!driverForm) return; 

    const submitBtn = driverForm.querySelector('button[type="submit"]');


    // --- 2. Form Submission Handler ---
    
    /**
     * Handles the form submission process via the Netlify API.
     */
    const handleFormSubmit = async (e) => {
        e.preventDefault(); 
        
        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="ri-loader-4-line rotating"></i> Submitting...`;

        // Gather data and map to GSheet headers (travels_careers)
        const formData = new FormData(driverForm);
        const data = {
            Full_Name: formData.get('fullName'),
            Phone_Number: formData.get('phoneNumber'),
            Email_Address: formData.get('emailAddress') || 'N/A', // Assuming we add this field to career.html
            City_Area: formData.get('cityArea'),
            Experience: formData.get('experience'),
            Status: 'New Applicant'
        };

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Use the global popup function from common.js
                window.showGlobalPopup('success', 'Application Sent!', 'Thank you for your interest! We will review your professional profile and contact you shortly.');
                driverForm.reset(); 
            } else {
                console.error('API Error:', result.error);
                window.showGlobalPopup('error', 'Submission Failed', 'Server error during submission. Please try again or email us.');
            }

        } catch (error) {
            console.error('Form Submission Error (Network):', error);
            window.showGlobalPopup('error', 'Submission Failed', 'A network error occurred. Please check your connection.');

        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
        }
    };


    // --- 3. Event Listeners ---
    driverForm.addEventListener('submit', handleFormSubmit);

    // NOTE: HTML (career.html) must include the submission-popup element.
});

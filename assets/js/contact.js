/* ===================================================================
   CONTACT PAGE JAVASCRIPT | SHRISH TRAVELS
   Handles form submissions via the centralized Netlify API.
   =================================================================== */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM Element Selection & Configuration ---
    const contactForm = document.getElementById('contact-form');
    // We assume the form has a submit button and the general 'submission-popup' in the HTML.
    
    // API Endpoint for contact message submission
    const API_ENDPOINT = '/.netlify/functions/travels-api?action=submitContact';

    if (!contactForm) return; 

    const submitBtn = contactForm.querySelector('button[type="submit"]');

    // --- 2. Form Submission Handler ---
    
    /**
     * Handles the form submission process via the Netlify API.
     */
    const handleFormSubmit = async (e) => {
        e.preventDefault(); 

        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="ri-loader-4-line rotating"></i> Sending...`;

        // Gather data and map to GSheet headers (travels_contacts)
        const formData = new FormData(contactForm);
        const data = {
            Name: formData.get('name'),
            Email: formData.get('email'),
            Phone: formData.get('phone') || 'N/A', 
            Message: formData.get('message'),
            Status: 'New Inquiry'
        };

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Use the GLOBAL popup function from common.js
                window.showGlobalPopup('success', 'Message Sent!', 'Thank you for reaching out. We will get back to you within a few hours.');
                contactForm.reset(); 
            } else {
                console.error('API Error:', result.error);
                window.showGlobalPopup('error', 'Submission Failed', 'Server error. Please try again or call us directly.');
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
    contactForm.addEventListener('submit', handleFormSubmit);

    // Note: The FAQ Accordion logic is handled by common.js
});

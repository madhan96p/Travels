/* ===================================================================
   COMMON JAVASCRIPT (FINAL V3 - PUBLIC SITE) | SHRISH TRAVELS
   Contains all shared scripts for Header, Footer, FAQ, etc.
   =================================================================== */

// --- 1. GLOBAL POPUP HANDLER (Exported for other scripts) ---
// Note: This logic assumes a single popup element with ID 'submission-popup' in the HTML body of every page.
// The index.html popup is a special case and uses its own ID ('booking-popup').

// We export these functions so booking.js, contact.js, and career.js can use them.
window.showGlobalPopup = (status, title, message) => {
    const submissionPopup = document.getElementById('submission-popup');
    if (!submissionPopup) {
        // Fallback for pages like index.html that use a custom popup
        console.error('Submission popup element not found.');
        alert(`${title}: ${message}`);
        return;
    }
    
    const popupContent = submissionPopup.querySelector('.popup-content') || document.createElement('div');
    const iconClass = status === 'success' ? 'ri-checkbox-circle-fill success-icon' : 'ri-error-warning-fill error-icon';
    
    // Clear existing content and set new content
    popupContent.innerHTML = `
        <i class="${iconClass}" style="font-size: 3rem; margin-bottom: 1rem;"></i>
        <h3 class="popup-title">${title}</h3>
        <p class="popup-message">${message}</p>
        <div class="popup-buttons">
            <button id="popup-ok-btn" class="cta-btn primary">OK</button>
        </div>
    `;

    // Make visible
    submissionPopup.classList.add('visible');
    submissionPopup.classList.remove('hidden');

    // Add listener to dismiss the popup
    document.getElementById('popup-ok-btn').addEventListener('click', hideGlobalPopup);
    submissionPopup.addEventListener('click', (e) => {
        if (e.target === submissionPopup) hideGlobalPopup();
    });
};

window.hideGlobalPopup = () => {
    const submissionPopup = document.getElementById('submission-popup');
    if (submissionPopup) {
        submissionPopup.classList.add('hidden');
        submissionPopup.classList.remove('visible');
    }
};

// ... [Existing common.js code follows here] ...

document.addEventListener('DOMContentLoaded', () => {

    // ... [Existing common.js logic for nav updates, scrolling, etc.] ...

    // --- 5. Global Initialization ---
    // Ensure all global setup runs here.

    // No need for local showPopup/hidePopup definition anymore, rely on window.showGlobalPopup

    // --- 6. Event Listeners & Initializations ---
    // ... [Existing event listeners] ...
    
    // Call initialization functions
    // handleHeaderScroll();
    // updateActiveNavLinks();
    // updateMobileHeaderTitle();
    // setCopyrightYear();
    // initializeFAQAccordion();
});

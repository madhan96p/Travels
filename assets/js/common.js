// assets/js/common.js

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. COMPONENT INJECTOR
    const loadComponent = async (id, filePath) => {
        const element = document.getElementById(id);
        if (element) {
            try {
                // NOTE: We point to 'components/' folder
                const response = await fetch(filePath);
                if (!response.ok) throw new Error(`Failed to load ${filePath}`);
                const html = await response.text();
                element.innerHTML = html;
            } catch (error) {
                console.error(error);
            }
        }
    };

    // 2. INJECT COMPONENTS
    await Promise.all([
        loadComponent('header-placeholder', 'components/_header.html'),
        loadComponent('footer-placeholder', 'components/_footer.html'),
        loadComponent('schema-placeholder', 'components/_seo_schema.html')
    ]);

    // 3. RE-INITIALIZE LOGIC
    // We call the functions AFTER components are loaded
    highlightActiveLink();
    initializeCookieBanner();
});

// --- HELPER FUNCTIONS (Defined outside Event Listener so they are global) ---

function highlightActiveLink() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('nav a');
    
    links.forEach(link => {
        // Simple check: if href matches path, or if path is '/' and href is '/'
        if (link.getAttribute('href') === currentPath || (currentPath === '/' && link.getAttribute('href') === 'index.html')) {
            link.classList.add('text-blue-600'); 
            link.classList.remove('text-gray-600');
        }
    });
}

function initializeCookieBanner() {
    if (!localStorage.getItem("cookieConsent")) {
        const banner = document.getElementById("cookie-banner");
        if(banner) {
            setTimeout(() => banner.classList.remove("hidden"), 2000);
        }
    }
}

window.acceptCookies = function() {
    localStorage.setItem("cookieConsent", "true");
    const banner = document.getElementById("cookie-banner");
    if (banner) banner.classList.add("hidden");
};
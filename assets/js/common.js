// assets/js/common.js

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. COMPONENT INJECTOR FUNCTION
    const loadComponent = async (id, filePath) => {
        const element = document.getElementById(id);
        if (element) {
            try {
                const response = await fetch(filePath);
                if (!response.ok) throw new Error(`Failed to load ${filePath}`);
                const html = await response.text();
                element.innerHTML = html;
            } catch (error) {
                console.error(error);
            }
        }
    };

    // 2. INJECT HEADER, FOOTER, SCHEMA
    // We use Promise.all to load them simultaneously
    await Promise.all([
        loadComponent('header-placeholder', '_header.html'),
        loadComponent('footer-placeholder', '_footer.html'),
        loadComponent('schema-placeholder', '_seo_schema.html')
    ]);

    // 3. RE-INITIALIZE UI LOGIC (Since HTML was just injected)
    highlightActiveLink();
    initializeCookieBanner();
});

// Helper: Highlight active menu item based on current URL
function highlightActiveLink() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('nav a');
    
    links.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
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
    document.getElementById("cookie-banner").classList.add("hidden");
};
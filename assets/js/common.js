document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. COMPONENT INJECTOR (Loads Header/Footer)
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

    // 2. LOAD ALL PARTS
    await Promise.all([
        loadComponent('header-placeholder', 'components/_header.html'),
        loadComponent('footer-placeholder', 'components/_footer.html'),
        loadComponent('hero-placeholder', 'components/_hero.html'),
        loadComponent('seo-schema-placeholder', 'components/_seo_schema.html')
    ]);

    // 3. INITIALIZE INTERACTIVITY (After loading)
    highlightActiveLinks();
    initializeMobileMenu();
    initializeCookieBanner();
});

// --- LOGIC HANDLERS ---

function highlightActiveLinks() {
    const currentPath = window.location.pathname;
    
    // Desktop Nav
    document.querySelectorAll('.desktop-nav a').forEach(link => {
        if (link.getAttribute('href') === currentPath) link.classList.add('active');
    });

    // Mobile Bottom Nav
    document.querySelectorAll('.mobile-bottom-nav .nav-item').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
            // Make the icon filled for active state
            const icon = link.querySelector('i');
            if(icon) icon.classList.replace('ri-home-line', 'ri-home-fill'); 
            // Add logic to swap other icons if needed
        }
    });
}

function initializeMobileMenu() {
    // Logic for the top-right "Hamburger" menu on mobile
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    // If you plan to have a slide-out drawer, logic goes here. 
    // For now, since we have the Bottom Nav, this button might redirect to a full menu page
    if(toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            // Optional: Toggle a full-screen menu overlay
            // window.location.href = '/menu.html'; 
            alert("Use the bottom bar for quick navigation!");
        });
    }
}

function initializeCookieBanner() {
    if (!localStorage.getItem("cookieConsent")) {
        const banner = document.getElementById("cookie-banner");
        if(banner) setTimeout(() => banner.classList.remove("hidden"), 2000);
    }
}

window.acceptCookies = function() {
    localStorage.setItem("cookieConsent", "true");
    document.getElementById("cookie-banner").classList.add("hidden");
};
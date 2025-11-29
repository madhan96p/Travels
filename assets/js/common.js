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
    // We wait for this to finish so elements exist before we attach scripts
    await Promise.all([
        loadComponent('header-placeholder', 'components/_header.html'),
        loadComponent('footer-placeholder', 'components/_footer.html'),
        loadComponent('hero-placeholder', 'components/_hero.html'),
        loadComponent('seo-schema-placeholder', 'components/_seo_schema.html')
    ]);

    // 3. INITIALIZE INTERACTIVITY (After loading)
    initializeScrollEffect(); // <--- ADDED: Starts the Puma Header Logic
    highlightActiveLinks();
    initializeMobileMenu();
    initializeCookieBanner();

    if (window.AOS) {
        AOS.init({
            duration: 800,
            once: true,
            offset: 100,
            disable: 'mobile'
        });
    }


});

// --- LOGIC HANDLERS ---

function highlightActiveLinks() {
    const currentPath = window.location.pathname;

    // Desktop Nav
    document.querySelectorAll('.desktop-nav a').forEach(link => {
        // Simple match or partial match if needed
        if (link.getAttribute('href') === currentPath) link.classList.add('active');
    });

    // Mobile Bottom Nav
    document.querySelectorAll('.mobile-bottom-nav .nav-item').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
            // Make the icon filled for active state
            const icon = link.querySelector('i');
            // Example replacement logic for Remix Icons or FontAwesome
            if (icon) {
                // If using FontAwesome, usually adding a specific class or changing style works
                // For now, we just ensure it keeps the active class
            }
        }
    });
}

function initializeMobileMenu() {
    // Logic for the top-right "Hamburger" menu on mobile
    const toggleBtn = document.querySelector('.mobile-menu-toggle');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            // Since we have the Bottom Nav, we guide them there or open a full drawer
            alert("Please use the bottom navigation bar for easier access!");
        });
    }
}

function initializeCookieBanner() {
    if (!localStorage.getItem("cookieConsent")) {
        const banner = document.getElementById("cookie-banner");
        if (banner) setTimeout(() => banner.classList.remove("hidden"), 2000);
    }
}

// Global function for the Accept button in HTML
window.acceptCookies = function () {
    localStorage.setItem("cookieConsent", "true");
    const banner = document.getElementById("cookie-banner");
    if (banner) banner.classList.add("hidden");
};

/**
 * PUMA-STYLE SCROLL EFFECT
 * 1. Hides Top Utility Bar on Scroll Down
 * 2. Shrinks Main Header on Scroll
 */
function initializeScrollEffect() {
    let lastScrollY = window.scrollY;
    const body = document.body;

    // We look for 'main-header' which was injected by loadComponent
    const header = document.getElementById('main-header');

    // Safety check: if header didn't load, stop here to avoid errors
    if (!header) return;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        // 1. Logic for "Puma" Top Bar Hiding
        if (currentScrollY > 50 && currentScrollY > lastScrollY) {
            body.classList.add('scroll-down'); // Triggers CSS transform
            body.classList.remove('scroll-up');
        } else if (currentScrollY < lastScrollY || currentScrollY < 50) {
            // User is scrolling UP -> Show Top Bar
            body.classList.add('scroll-up');
            body.classList.remove('scroll-down');
        }

        // 2. Logic for Header Compact Mode (Glass effect check)
        if (currentScrollY > 10) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');

            // Optional: If at the very top, reset direction classes
            if (currentScrollY <= 0) {
                body.classList.remove('scroll-down');
                body.classList.remove('scroll-up');
            }
        }

        lastScrollY = currentScrollY;
    });
}

// THE SHRISH TRAVELS GROWTH BLUEPRINT (AEO + SEO + CRO + TECH STACK)
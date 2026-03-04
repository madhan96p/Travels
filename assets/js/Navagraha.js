document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Smooth Scrolling for Navigation Links
    const links = document.querySelectorAll('.nav-links a, .hero-cta a');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            
            // Only scroll if it's an internal anchor
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    window.scrollTo({
                        top: targetSection.offsetTop - 80, // Adjust for sticky header
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // 2. Reveal Animations on Scroll (AEO/UX Touch)
    const observerOptions = {
        threshold: 0.1
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Apply reveal effect to temple cards and timeline items
    const animElements = document.querySelectorAll('.temple-card, .timeline-item');
    animElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-out';
        revealObserver.observe(el);
    });

        // 4. Header Background Toggle on Scroll
    const header = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.padding = '10px 5%';
            header.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            header.style.padding = '20px 5%';
            header.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    });
});
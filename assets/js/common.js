// assets/js/common.js

document.addEventListener('DOMContentLoaded', async () => {
    
    const loadComponent = async (id, filePath) => {
        const element = document.getElementById(id);
        if (element) {
            try {
                // FIXED PATHS: Added 'components/' prefix
                const response = await fetch(filePath); 
                if (!response.ok) throw new Error(`Failed to load ${filePath}`);
                const html = await response.text();
                element.innerHTML = html;
            } catch (error) {
                console.error(error);
            }
        }
    };

    // FIXED: Point to the 'components' folder
    await Promise.all([
        loadComponent('header-placeholder', 'components/_header.html'),
        loadComponent('footer-placeholder', 'components/_footer.html'),
        loadComponent('schema-placeholder', 'components/_seo_schema.html')
    ]);

    highlightActiveLink();
    initializeCookieBanner();
});
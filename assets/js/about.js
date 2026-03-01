document.addEventListener("DOMContentLoaded", function () {
    const content = document.querySelector(".founder-section .content");

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, { threshold: 0.2 });

    content.style.opacity = "0";
    content.style.transform = "translateY(40px)";
    content.style.transition = "all 0.8s ease";

    observer.observe(content);
});
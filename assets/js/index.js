// --- CONFIGURATION ---
// Your Google Apps Script Web App URL (from script.js)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwY6JLOSO9zZUcBkQ_38EIKMLWMwCZtpotLo61D_rsaRzBltxF5AhK-Mz8y9kST3mQC/exec";
const WHATSAPP_NUM = "918883451668";

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. TRIP TYPE TOGGLE LOGIC
    window.setTripType = function(type) {
        document.getElementById('tripType').value = type;
        
        // Update Button Styles
        const btns = document.querySelectorAll('.trip-btn');
        btns.forEach(btn => {
            if(btn.innerText.includes(type)) {
                btn.className = "trip-btn flex-1 py-2.5 rounded-lg shadow-sm text-sm font-bold bg-white text-blue-900 border border-gray-200 transition transform scale-105";
            } else {
                btn.className = "trip-btn flex-1 py-2.5 rounded-lg text-gray-500 text-sm font-medium hover:text-gray-700 transition";
            }
        });
    };

    // 2. QUICK ESTIMATE (Silent Pull + WhatsApp)
    const form = document.getElementById('quickBookForm');
    const statusMsg = document.getElementById('formStatus');

    if(form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            
            const data = new FormData(form);
            const pickup = document.getElementById('pickup').value;
            const drop = document.getElementById('drop').value;
            const mobile = document.getElementById('mobile').value;
            const type = document.getElementById('tripType').value;

            // Basic Validation
            if(!pickup || !drop || !mobile) {
                statusMsg.innerText = "Please fill all details.";
                statusMsg.style.color = "red";
                return;
            }

            statusMsg.innerText = "Processing...";
            statusMsg.style.color = "gray";

            // A. SILENT SUBMISSION TO GOOGLE SHEET
            fetch(SCRIPT_URL, { method: 'POST', body: data, mode: 'no-cors' })
            .then(() => console.log("Lead Captured to Sheet"))
            .catch(error => console.error('Sheet Error:', error));

            // B. REDIRECT TO WHATSAPP
            const msg = `Hi Shrish Travels, I need a *${type}* taxi estimate.%0A%0A🚖 *Trip Details:*%0AFrom: ${pickup}%0ATo: ${drop}%0AMobile: ${mobile}`;
            
            setTimeout(() => {
                statusMsg.innerText = "";
                window.open(`https://wa.me/${WHATSAPP_NUM}?text=${msg}`, '_blank');
            }, 1000); // 1 second delay to ensure fetch starts
        });
    }

    // 3. BOOK NOW BUTTON (Redirect to booking.html with Data)
    const btnBookNow = document.getElementById('btnBookNow');
    if(btnBookNow) {
        btnBookNow.addEventListener('click', () => {
            const pickup = document.getElementById('pickup').value;
            const drop = document.getElementById('drop').value;
            const mobile = document.getElementById('mobile').value;
            const type = document.getElementById('tripType').value;

            if(!pickup && !drop) {
                alert("Please enter Pickup and Drop cities first.");
                return;
            }

            // Redirect with URL Parameters
            window.location.href = `booking.html?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}&mobile=${encodeURIComponent(mobile)}&type=${encodeURIComponent(type)}`;
        });
    }

    // 4. LOAD POPULAR ROUTES (Dynamic)
    fetch('assets/data/routes.json')
    .then(res => res.json())
    .then(data => {
        const container = document.getElementById('routes-container');
        if(container) {
            container.innerHTML = '';
            data.slice(0, 6).forEach(route => {
                const slug = `routes/${route.Origin.toLowerCase()}-to-${route.Destination.toLowerCase()}.html`.replace(/\s+/g, '');
                container.innerHTML += `
                    <a href="${slug}" class="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 group flex justify-between items-center">
                        <div>
                            <div class="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                                <i class="fas fa-road"></i> ${route.Distance_Km} km
                            </div>
                            <h3 class="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition">
                                ${route.Origin} <span class="text-gray-300">➝</span> ${route.Destination}
                            </h3>
                        </div>
                        <div class="text-right">
                            <span class="block font-extrabold text-xl text-green-600">₹${route.Price_Sedan}</span>
                            <span class="text-xs text-gray-400 font-medium">Sedan</span>
                        </div>
                    </a>`;
            });
        }
    })
    .catch(e => console.error("Routes error:", e));

    // 5. COOKIE BANNER
    if (!localStorage.getItem("cookieConsent")) {
        setTimeout(() => {
            document.getElementById("cookie-banner").classList.remove("hidden");
        }, 2000);
    }
    window.acceptCookies = function() {
        localStorage.setItem("cookieConsent", "true");
        document.getElementById("cookie-banner").classList.add("hidden");
    };
});
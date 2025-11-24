document.addEventListener('DOMContentLoaded', () => {

    // Set Default Date to Today
    const dateInput = document.getElementById('travelDate');
    if(dateInput) {
        dateInput.valueAsDate = new Date();
    }

    // 1. TRIP TYPE TOGGLE
    window.setTripType = function(type) {
        document.getElementById('tripType').value = type;
        const btns = document.querySelectorAll('.trip-btn');
        btns.forEach(btn => {
            if(btn.innerText.includes(type)) {
                btn.className = "trip-btn flex-1 py-2.5 rounded-lg shadow-sm text-sm font-bold bg-white text-blue-900 border border-gray-200 transition transform scale-105";
            } else {
                btn.className = "trip-btn flex-1 py-2.5 rounded-lg text-gray-500 text-sm font-medium hover:text-gray-700 transition";
            }
        });
    };

    // 2. QUICK ESTIMATE & BOOKING
    const form = document.getElementById('quickBookForm');
    const statusMsg = document.getElementById('formStatus');

    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // --- SPAM CHECK (Frontend) ---
            const lastBooked = localStorage.getItem('lastBookingTime');
            const now = Date.now();
            
            // If booked within last 5 minutes (300000 ms)
            if (lastBooked && (now - lastBooked) < 300000) {
                alert("⚠️ You have already requested a booking recently.\n\nOur team is reviewing your request. Please wait for our call!");
                return; // Stop execution
            }

            const data = new FormData(form);
            const pickup = document.getElementById('pickup').value;
            const drop = document.getElementById('drop').value;
            const mobile = document.getElementById('mobile').value;
            const type = document.getElementById('tripType').value;

            statusMsg.innerText = "Processing...";
            statusMsg.style.color = "blue";

            // A. API Call (Send to Sheet)
            ApiService.submitLead(data).then(res => {
                if(res.success) {
                    // Save timestamp to prevent spam
                    localStorage.setItem('lastBookingTime', Date.now());
                    console.log("Booking Saved:", res);
                }
            }).catch(err => {
                console.error("Save Failed:", err);
            });

            // B. WhatsApp Redirect
            const msg = `Hi Shrish Travels, I need a *${type}* taxi estimate.%0A%0A🚖 *Details:*%0AFrom: ${pickup}%0ATo: ${drop}%0APhone: ${mobile}`;
            
            setTimeout(() => {
                statusMsg.innerText = "Redirecting...";
                window.open(ApiService.getWhatsAppLink(msg), '_blank');
            }, 800); 
        });
    }

    // 3. LOAD POPULAR ROUTES
    ApiService.getRoutes()
    .then(data => {
        const container = document.getElementById('routes-container');
        if(container && data) {
            container.innerHTML = '';
            // Limit to 6 routes for homepage
            data.slice(0, 6).forEach(route => {
                // Handle missing properties safely
                const origin = route.Origin || 'Chennai';
                const dest = route.Destination || 'Destination';
                const km = route.Distance_Km || '0';
                const price = route.Price_Sedan || 'Ask';
                
                const slug = `routes/${origin.toLowerCase()}-to-${dest.toLowerCase()}.html`.replace(/\s+/g, '');
                
                container.innerHTML += `
                    <a href="${slug}" class="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 group flex justify-between items-center">
                        <div>
                            <div class="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                                <i class="fas fa-road"></i> ${km} km
                            </div>
                            <h3 class="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition">
                                ${origin} <span class="text-gray-300">➝</span> ${dest}
                            </h3>
                        </div>
                        <div class="text-right">
                            <span class="block font-extrabold text-xl text-green-600">₹${price}</span>
                            <span class="text-xs text-gray-400 font-medium">Sedan</span>
                        </div>
                    </a>`;
            });
        }
    })
    .catch(e => console.error("Routes error:", e));
});
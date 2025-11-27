document.addEventListener('DOMContentLoaded', () => {

    // 1. Set Default Date (Wait for element to exist)
    setTimeout(() => {
        const dateInput = document.getElementById('travelDate');
        if (dateInput) dateInput.valueAsDate = new Date();
    }, 1000); // Small delay to allow HTML to load

    // 2. GLOBAL LISTENER: Handles clicks and submits for Dynamic Elements
    document.body.addEventListener('click', (e) => {
        
        // --- LOGIC: Trip Type Toggles ---
        if (e.target.closest('.trip-btn')) {
            const btn = e.target.closest('.trip-btn');
            const type = btn.innerText; // "One Way" or "Round Trip"
            
            // Visual Update
            document.querySelectorAll('.trip-btn').forEach(b => {
                b.className = "trip-btn flex-1 py-2.5 rounded-lg text-gray-500 text-sm font-medium hover:text-gray-700 transition";
            });
            btn.className = "trip-btn flex-1 py-2.5 rounded-lg shadow-sm text-sm font-bold bg-white text-blue-900 border border-gray-200 transition transform";
            
            // Update Hidden Input (if you use one) or Radio
            const radio = document.querySelector(`input[value="${type}"]`);
            if(radio) radio.checked = true;
        }

        // --- LOGIC: Book Now Button (Redirect) ---
        // We use .closest() or check ID directly to catch the button click
        if (e.target.id === 'btnBookNow' || e.target.closest('#btnBookNow')) {
            const pickup = document.getElementById('pickup').value;
            const drop = document.getElementById('drop').value;
            const date = document.getElementById('travelDate').value;

            if(!pickup || !drop) {
                alert("Please enter Pickup and Drop cities first.");
                return;
            }

            const params = new URLSearchParams({
                from: pickup,
                to: drop,
                date: date
            });

            window.location.href = `booking.html?${params.toString()}`;
        }
    });

    // 3. GLOBAL SUBMIT LISTENER: Handles the "Get Estimate" Form
    document.body.addEventListener('submit', async (e) => {
        
        // Check if the submitted form is our Quick Book Form
        if (e.target.id === 'quickBookForm') {
            e.preventDefault(); // STOP THE REFRESH
            
            const form = e.target;
            const statusMsg = document.getElementById('formStatus');

            // Get Values
            const pickup = document.getElementById('pickup').value;
            const drop = document.getElementById('drop').value;
            const mobile = document.getElementById('mobile').value;
            const date = document.getElementById('travelDate').value;
            
            // Get Trip Type (Robust check)
            const typeRadio = form.querySelector('input[name="trip_type"]:checked');
            const type = typeRadio ? typeRadio.value : "One Way";

            // A. WhatsApp Redirect
            const msg = `Hi Shrish Travels, I need a *${type}* estimate.%0A%0A🚖 *Trip Details:*%0AFrom: ${pickup}%0ATo: ${drop}%0ADate: ${date}%0APhone: ${mobile}`;
            const waLink = `https://wa.me/918883451668?text=${msg}`;
            
            window.open(waLink, '_blank');

            // B. Save to Sheet
            if(statusMsg) statusMsg.innerText = "Request sent...";

            const leadData = {
                pickup: pickup,
                drop: drop,
                mobile: mobile,
                date: date,
                type: type
            };

            fetch('/.netlify/functions/travels-api?action=submitLead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leadData)
            })
            .then(res => res.json())
            .then(data => console.log("Saved:", data))
            .catch(err => console.error("Error:", err));
        }
    });

    // 4. Load Routes (Visuals)
    if (typeof ApiService !== 'undefined') {
        ApiService.getRoutes().then(data => {
            const container = document.getElementById('routes-container');
            if (container && data) {
                container.innerHTML = '';
                data.slice(0, 6).forEach(route => {
                    container.innerHTML += `
                        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-xs font-bold text-gray-400 uppercase">${route.Distance_Km || '0'} km</span>
                                <span class="font-bold text-green-600">₹${route.Price_Sedan || 'Ask'}</span>
                            </div>
                            <h3 class="font-bold text-lg text-gray-900">${route.Origin} ➝ ${route.Destination}</h3>
                        </div>`;
                });
            }
        });
    }
});
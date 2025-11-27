document.addEventListener('DOMContentLoaded', () => {

    // 1. Set Default Date
    const dateInput = document.getElementById('travelDate');
    if (dateInput) dateInput.valueAsDate = new Date();

    // 2. Trip Type Toggle Logic
    window.setTripType = function(type) {
        document.getElementById('tripType').value = type;
        const btns = document.querySelectorAll('.trip-btn');
        btns.forEach(btn => {
            if (btn.innerText.includes(type)) {
                btn.className = "trip-btn flex-1 py-2.5 rounded-lg shadow-sm text-sm font-bold bg-white text-blue-900 border border-gray-200 transition transform";
            } else {
                btn.className = "trip-btn flex-1 py-2.5 rounded-lg text-gray-500 text-sm font-medium hover:text-gray-700 transition";
            }
        });
    };

    // 3. LOGIC: Get Estimate (Form Submit -> WhatsApp + Save to Sheet)
    const form = document.getElementById('quickBookForm');
    const statusMsg = document.getElementById('formStatus');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop page reload

            // Get Values
            const pickup = document.getElementById('pickup').value;
            const drop = document.getElementById('drop').value;
            const mobile = document.getElementById('mobile').value;
            const date = document.getElementById('travelDate').value;
            const type = document.getElementById('tripType').value;

            // A. Immediate WhatsApp Redirect (User Experience First)
            const msg = `Hi Shrish Travels, I need a *${type}* estimate.%0A%0A🚖 *Trip Details:*%0AFrom: ${pickup}%0ATo: ${drop}%0ADate: ${date}%0APhone: ${mobile}`;
            const waLink = `https://wa.me/918883451668?text=${msg}`;
            
            // Open WhatsApp in new tab immediately
            window.open(waLink, '_blank');

            // B. Silent Background Save (Fire and Forget)
            if(statusMsg) statusMsg.innerText = "Request sent...";

            // Prepare data for the API (Matches the 'submitLead' action we made)
            const leadData = {
                pickup: pickup,
                drop: drop,
                mobile: mobile,
                date: date,
                type: type
            };

            // Send to Netlify Function
            fetch('/.netlify/functions/travels-api?action=submitLead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leadData)
            })
            .then(response => response.json())
            .then(data => console.log("Lead Saved Successfully:", data))
            .catch(err => console.error("Silent Save Error:", err));
        });
    }

    // 4. LOGIC: Book Now (Redirect to Booking Page)
    const btnBookNow = document.getElementById('btnBookNow');
    if (btnBookNow) {
        btnBookNow.addEventListener('click', () => {
            // Get current values
            const pickup = document.getElementById('pickup').value;
            const drop = document.getElementById('drop').value;
            const date = document.getElementById('travelDate').value;

            if(!pickup || !drop) {
                alert("Please enter Pickup and Drop cities first.");
                return;
            }

            // Construct URL Params for the Booking Page
            const params = new URLSearchParams({
                from: pickup,
                to: drop,
                date: date
            });

            // Redirect
            window.location.href = `booking.html?${params.toString()}`;
        });
    }

    // 5. Load Routes (Visuals)
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
});
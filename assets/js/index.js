// 1. CONFIGURATION
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwY6JLOSO9zZUcBkQ_38EIKMLWMwCZtpotLo61D_rsaRzBltxF5AhK-Mz8y9kST3mQC/exec";
const WHATSAPP_NUM = "918883451668";

// 2. TRIP TYPE TOGGLE LOGIC
function setTripType(type) {
    document.getElementById('tripType').value = type;
    
    const btns = document.querySelectorAll('.trip-btn');
    btns.forEach(btn => {
        if(btn.innerText === type) {
            btn.className = "trip-btn flex-1 py-2.5 rounded-lg shadow-sm text-sm font-bold bg-white text-blue-900 transition";
        } else {
            btn.className = "trip-btn flex-1 py-2.5 rounded-lg text-gray-500 text-sm font-bold hover:text-gray-700 transition";
        }
    });
}

// 3. QUICK ESTIMATE (Silent Pull + WhatsApp)
const form = document.getElementById('quickBookForm');
const statusMsg = document.getElementById('formStatus');

form.addEventListener('submit', e => {
    e.preventDefault();
    
    const data = new FormData(form);
    const pickup = data.get('pickup');
    const drop = data.get('drop');
    const mobile = data.get('mobile');
    const type = data.get('tripType');

    statusMsg.innerText = "Connecting...";

    // A. Silent Submission to Google Sheet
    fetch(SCRIPT_URL, { method: 'POST', body: data, mode: 'no-cors' })
    .then(() => console.log("Data pushed to Sheet successfully"))
    .catch(error => console.error('Error!', error.message));

    // B. Redirect to WhatsApp
    const msg = `Hi Shrish Travels, I need a *${type}* taxi estimate.%0A%0A🚖 *Details:*%0AFrom: ${pickup}%0ATo: ${drop}%0AMobile: ${mobile}`;
    
    // Small delay to ensure user sees we are processing
    setTimeout(() => {
        statusMsg.innerText = "";
        window.open(`https://wa.me/${WHATSAPP_NUM}?text=${msg}`, '_blank');
    }, 800);
});

// 4. BOOK NOW (Redirect with Data)
document.getElementById('btnBookNow').addEventListener('click', () => {
    const pickup = document.getElementById('pickup').value;
    const drop = document.getElementById('drop').value;
    const mobile = document.getElementById('mobile').value;
    const type = document.getElementById('tripType').value;

    if(!pickup && !drop) {
        alert("Please enter Pickup and Drop cities first.");
        return;
    }

    // Redirect to booking.html with pre-filled params
    window.location.href = `booking.html?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}&mobile=${encodeURIComponent(mobile)}&type=${encodeURIComponent(type)}`;
});

// 5. LOAD ROUTES (Dynamic)
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
                            ${route.Origin} ➝ ${route.Destination}
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
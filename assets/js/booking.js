document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. UI LOGIC: Corporate Toggle Animation ---
    const corpCheckbox = document.getElementById('corporate-booking-checkbox');
    const corpFields = document.getElementById('corporate-fields');

    if (corpCheckbox && corpFields) {
        corpCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // Show fields
                corpFields.style.maxHeight = corpFields.scrollHeight + "px";
                corpFields.style.marginTop = "1rem";
            } else {
                // Hide fields
                corpFields.style.maxHeight = "0";
                corpFields.style.marginTop = "0";
            }
        });
    }

    // --- 2. PRE-FILL: Catch Data from Home Page URL ---
    // Example URL: booking.html?from=Chennai&to=Bangalore&date=2025-10-10
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('from')) document.getElementById('pickup').value = params.get('from');
    if (params.has('to')) document.getElementById('dropoff').value = params.get('to');
    if (params.has('date')) document.getElementById('date').value = params.get('date');

    // --- 3. SUBMISSION LOGIC ---
    const form = document.getElementById('full-booking-form');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            
            // A. Loading State
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Request...';

            // B. Gather Data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Prepare the clean object for API
            // We map the HTML "name" attributes to your Google Sheet Headers
            const payload = {
                Pickup_City: data.pickup,
                Drop_City: data.dropoff,
                Travel_Date: data.date,
                Travelers: data.travelers,
                Journey_Type: data.journeytype, // Value from Radio Button
                Customer_Name: data.name,
                Mobile_Number: data.phone,
                Email: data.email || 'N/A',
                Company_Name: data.company_name || 'N/A',
                Is_Corporate: corpCheckbox.checked ? 'Yes' : 'No',
                Vehicle_Type: 'Any Premium' // Default, as they get a quote first
            };

            // C. Send to Backend
            try {
                // We use the existing logic in api.js (ensure ApiService is loaded)
                const response = await fetch('/.netlify/functions/travels-api?action=submitBooking', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // D. Success State
                    btn.innerHTML = '<i class="fas fa-check-circle"></i> Request Sent!';
                    btn.style.background = "#10B981"; // Green
                    
                    // Show success message or redirect
                    alert(`Thank you, ${data.name}! Your Booking ID is #${result.id}. Our team will call you shortly.`);
                    window.location.href = "/index.html"; 
                } else {
                    throw new Error(result.error || "Server Error");
                }
            } catch (error) {
                console.error("Booking Error:", error);
                btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Try Again';
                btn.style.background = "#EF4444"; // Red
                alert("Something went wrong. Please call us directly at +91 8883451668.");
                btn.disabled = false;
                
                // Revert button after 3 seconds
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = ""; // Reset to CSS default
                }, 3000);
            }
        });
    }
});
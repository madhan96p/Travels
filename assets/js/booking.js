document.addEventListener('DOMContentLoaded', () => {

    // --- 1. UI LOGIC: Toggles & Animations ---

    // A. Corporate Toggle
    const corpCheckbox = document.getElementById('corporate-booking-checkbox');
    const corpFields = document.getElementById('corporate-fields');

    if (corpCheckbox && corpFields) {
        corpCheckbox.addEventListener('change', function() {
            if (this.checked) {
                corpFields.style.maxHeight = corpFields.scrollHeight + "px";
                corpFields.style.marginTop = "1rem";
            } else {
                corpFields.style.maxHeight = "0";
                corpFields.style.marginTop = "0";
            }
        });
    }

    // B. Return Date Toggle (Round Trip Logic) - NEW
    const radioButtons = document.querySelectorAll('input[name="journeytype"]');
    const returnDateContainer = document.getElementById('return-date-container');
    const returnDateInput = document.getElementById('return_date');
    const startDateInput = document.getElementById('date');

    function toggleReturnDate() {
        // Find which radio is checked
        const selected = document.querySelector('input[name="journeytype"]:checked');
        if (selected && returnDateContainer) {
            if (selected.value === 'Round Trip') {
                returnDateContainer.classList.add('active');
                if(returnDateInput) returnDateInput.required = true;
            } else {
                returnDateContainer.classList.remove('active');
                if(returnDateInput) {
                    returnDateInput.required = false;
                    returnDateInput.value = ''; // Reset date if switching back
                }
            }
        }
    }

    // Attach listeners to all radio buttons
    radioButtons.forEach(radio => radio.addEventListener('change', toggleReturnDate));
    
    // Prevent selecting a return date before the start date
    if (startDateInput && returnDateInput) {
        startDateInput.addEventListener('change', () => {
            returnDateInput.min = startDateInput.value;
        });
    }

    // Run once on load to set initial state
    toggleReturnDate();


    // --- 2. PRE-FILL: Catch Data from Home Page URL ---
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
            // The keys here MUST match the Header Names in your Google Sheet
            const payload = {
                // Journey Details
                Pickup_City: data.pickup,
                Drop_City: data.dropoff,
                Travel_Date: data.date,
                Pickup_Time: data.time, // Captured from new input
                Return_Date: data.journeytype === 'Round Trip' ? data.return_date : 'N/A', // Conditional Logic
                Journey_Type: data.journeytype, 
                Travelers: data.travelers,
                
                // Personal Details
                Customer_Name: data.name,
                Mobile_Number: data.phone,
                Email: data.email || 'N/A',
                
                // Corporate Logic
                Company_Name: data.company_name || 'N/A',
                Is_Corporate: corpCheckbox && corpCheckbox.checked ? 'Yes' : 'No',
                
                // Extras
                Comments: data.comments || '', 
                Vehicle_Type: 'Any Premium' // Default
            };

            // C. Send to Backend
            try {
                // Calls netlify/functions/travels-api.js
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
                    btn.style.background = ""; 
                }, 3000);
            }
        });
    }
});
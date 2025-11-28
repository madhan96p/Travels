document.addEventListener('DOMContentLoaded', () => {
    // 1. Target the form by the correct ID
    const form = document.getElementById('contactForm'); 
    const statusMsg = document.getElementById('form-status');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            
            // A. Loading State
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            if(statusMsg) statusMsg.innerText = "";

            // B. Gather Data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // C. Prepare Data for Google Sheet
            // DIFFERENTIATION STRATEGY: 
            // We map 'Subject' to 'Journey_Type' so you can filter it in Excel.
            const payload = {
                Customer_Name: data.name,
                Mobile_Number: data.phone,
                Email: data.email, // Now captured!
                Journey_Type: data.subject, // e.g., "Corporate Partnership"
                Comments: data.message,
                
                // Defaults for required columns (so the API doesn't break)
                Pickup_City: 'N/A',
                Drop_City: 'N/A',
                Travel_Date: new Date().toLocaleDateString(),
                Status: 'Inquiry', // Different from 'New Booking'
                Driver_Assigned: 'Pending'
            };

            // D. Send to Backend
            try {
                // Use centralized API if available
                if (window.ApiService) {
                    await ApiService.submitBooking(payload);
                } else {
                    await fetch('/.netlify/functions/travels-api?action=submitBooking', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

                // Success State
                btn.innerHTML = '<i class="fas fa-check"></i> Sent Successfully';
                btn.style.background = "#10B981"; // Green
                if(statusMsg) {
                    statusMsg.style.color = "green";
                    statusMsg.innerText = "Thank you! We will contact you shortly.";
                }
                form.reset();

                // Reset button
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                    btn.style.background = ""; 
                }, 3000);

            } catch (error) {
                console.error("Submission Error:", error);
                btn.innerHTML = 'Try Again';
                btn.style.background = "#EF4444"; // Red
                if(statusMsg) {
                    statusMsg.style.color = "red";
                    statusMsg.innerText = "Error sending message. Please call us.";
                }
                btn.disabled = false;
            }
        });
    }
});
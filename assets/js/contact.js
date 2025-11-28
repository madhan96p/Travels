document.addEventListener('DOMContentLoaded', () => {
    // 1. MATCH THE ID EXACTLY
    const form = document.getElementById('contact-form'); // Fixed ID
    
    // Create a status message element if it doesn't exist
    let statusMsg = document.getElementById('form-status');
    if (!statusMsg) {
        statusMsg = document.createElement('p');
        statusMsg.id = 'form-status';
        statusMsg.className = 'status-msg';
        form.appendChild(statusMsg);
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            
            // A. Loading State
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            statusMsg.innerText = "";

            // B. Gather Data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // C. Prepare Payload
            // Maps your form fields to the Google Sheet columns
            const payload = {
                Customer_Name: data.name,
                Mobile_Number: data.phone,
                Email: data.email,
                Journey_Type: "General Inquiry", // Or use data.subject if you add a subject field
                Comments: data.message,
                
                // Defaults for required sheet columns
                Pickup_City: 'N/A',
                Drop_City: 'N/A',
                Travel_Date: new Date().toLocaleDateString(),
                Status: 'New Lead', 
                Driver_Assigned: 'Pending'
            };

            // D. Send to Backend
            try {
                // Use the centralized API service
                if (window.ApiService) {
                    await ApiService.submitBooking(payload);
                } else {
                    // Fallback fetch if ApiService isn't loaded
                    await fetch('/.netlify/functions/travels-api?action=submitBooking', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

                // Success State
                btn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
                btn.style.background = "#10B981"; // Green
                statusMsg.style.color = "green";
                statusMsg.innerText = "Thank you! We will contact you shortly.";
                form.reset();

                // Reset button after 3 seconds
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                    btn.style.background = ""; 
                }, 3000);

            } catch (error) {
                console.error("Submission Error:", error);
                btn.innerHTML = '<i class="ri-error-warning-line"></i> Try Again';
                btn.style.background = "#EF4444"; // Red
                statusMsg.style.color = "red";
                statusMsg.innerText = "Error sending message. Please call us directly.";
                btn.disabled = false;
            }
        });
    }
});
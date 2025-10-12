document.addEventListener('DOMContentLoaded', () => {
    // 1. Get necessary elements
    const editForm = document.querySelector('form');
    const messageContainer = document.getElementById('message-container'); 
    
    // Get the dynamic action URL from the form attribute
    const ENDPOINT_URL = editForm ? editForm.action : null; 

    // Helper function to display messages dynamically
    function displayMessage(type, message) {
        if (!messageContainer) return;

        // Clear any previous messages
        messageContainer.innerHTML = ''; 
        
        // Simple inline styling for a visible message box
        let color = type === 'success' ? '#488d63' : 'red';
        let bgColor = type === 'success' ? '#e6ffe6' : '#ffe6e6';
        
        const messageHTML = `
            <div style="padding: 10px; border: 1px solid ${color}; background-color: ${bgColor}; color: ${color}; border-radius: 4px;">
                <strong>${type.toUpperCase()}:</strong> ${message}
            </div>
        `;
        messageContainer.innerHTML = messageHTML;
    }

    if (editForm && ENDPOINT_URL) {
        // 2. Attach event listener to intercept form submission
        editForm.addEventListener('submit', async function(event) {
            
            // **STOP PAGE RELOAD**
            event.preventDefault(); 
            
            // Clear previous messages before submitting
            messageContainer.innerHTML = '';

            // 3. Gather Data
            const formData = new FormData(editForm);
            // Convert to JSON object for fetch
            const data = Object.fromEntries(formData.entries());

            try {
                // 4. Send the data using fetch
                const response = await fetch(ENDPOINT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', // Sending JSON
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    // SHOW SUCCESS MESSAGE
                    displayMessage('success', 'Details updated successfully! Changes saved.');
                    
                    // Optional: If you want to automatically redirect after a few seconds:
                    // setTimeout(() => { window.location.href = '/user-dashboard'; }, 2000); 

                } else {
                    // Handle server errors (e.g., status 400, 500)
                    const errorData = await response.json().catch(() => ({ message: 'Failed to update details.' }));
                    console.error('Update Failed:', errorData);
                    displayMessage('error', `Update failed: ${errorData.message || 'Server error. Please try again.'}`);
                }

            } catch (error) {
                // Handle network errors (server down, no connection, etc.)
                console.error('Network Error:', error);
                displayMessage('error', 'A network error occurred. Please check your connection.');
            }
        });
    }
});
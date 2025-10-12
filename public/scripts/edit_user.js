document.addEventListener('DOMContentLoaded', () => {

    const editForm = document.querySelector('form');
    const messageContainer = document.getElementById('message-container'); 
    
   
    const ENDPOINT_URL = editForm ? editForm.action : null; 

   
    function displayMessage(type, message) {
        if (!messageContainer) return;

      
        messageContainer.innerHTML = ''; 
        
      
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
     
        editForm.addEventListener('submit', async function(event) {
        
            event.preventDefault(); 
            
           
            messageContainer.innerHTML = '';

        
            const formData = new FormData(editForm);
           
            const data = Object.fromEntries(formData.entries());

            try {
         
                const response = await fetch(ENDPOINT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                   
                    displayMessage('success', 'Details updated successfully! Changes saved.');
                    
              

                } else {
                    
                    const errorData = await response.json().catch(() => ({ message: 'Failed to update details.' }));
                    console.error('Update Failed:', errorData);
                    displayMessage('error', `Update failed: ${errorData.message || 'Server error. Please try again.'}`);
                }

            } catch (error) {
            
                console.error('Network Error:', error);
                displayMessage('error', 'A network error occurred. Please check your connection.');
            }
        });
    }
});
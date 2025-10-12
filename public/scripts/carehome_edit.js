document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("carehomeEditForm"); 
    const messageContainer = document.getElementById("message-container"); 
    const stateDropdown = document.getElementById("state");
    const cityDropdown = document.getElementById("city");
    
   
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
    
  
    function validateField(input, pattern, errorMsg) {
        let errorElement = document.getElementById(input.id + "-error");
        if (!errorElement) {
          
            errorElement = document.createElement("span"); 
            errorElement.id = input.id + "-error";
            input.parentNode.insertBefore(errorElement, input.nextSibling);
            errorElement.style.color = "red";
        }

        const isValid = pattern.test(input.value.trim());
        errorElement.textContent = isValid ? "" : errorMsg;
        return isValid;
    }
    
    const fieldsToValidate = [
        { id: "fullname", pattern: /.+/, errorMsg: "Full Name is required." },
        { id: "phne", pattern: /^[0-9]{10}$/, errorMsg: "Enter a valid 10-digit mobile number." },
        { id: "mail", pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, errorMsg: "Enter a valid email address." },
        { id: "gvtid", pattern: /^[0-9]{6,12}$/, errorMsg: "Enter a valid Government ID (6-12 digits)." },
        { id: "pinc", pattern: /^[0-9]{6}$/, errorMsg: "Enter a valid 6-digit Pincode." },
        { id: "bank", pattern: /^[A-Za-z ]+$/, errorMsg: "Bank name must contain only letters." },
        { id: "accnum", pattern: /^[0-9]{8,16}$/, errorMsg: "Enter a valid Account Number (8-16 digits)." },
        { id: "ifsc", pattern: /^[A-Z]{4}[0-9]{7}$/, errorMsg: "Enter a valid IFSC Code (e.g., ABCD1234567)." },

    ];
    
    
    fieldsToValidate.forEach(({ id, pattern, errorMsg }) => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener("input", function () {
                validateField(this, pattern, errorMsg);
            });
        }
    });
    
   
    if (form) {
        form.addEventListener("submit", async function (event) {
         
            event.preventDefault();
            
            messageContainer.innerHTML = '';
            let isValid = true;
            let firstInvalidInput = null;
            
          
            for (const field of fieldsToValidate) {
                const input = document.getElementById(field.id);
               
                if (input && !validateField(input, field.pattern, field.errorMsg)) {
                    isValid = false;
                    if (!firstInvalidInput) {
                        firstInvalidInput = input;
                    }
                }
            }

            if (!isValid) {
                if (firstInvalidInput) firstInvalidInput.focus();
                displayMessage('error', 'Please correct all errors before submitting.');
                return;
            }

           
            const ENDPOINT_URL = form.action;
            const formData = new FormData(form);
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
                    
                    displayMessage('success', 'Details updated successfully! You can now navigate back to the dashboard.');
                    form.reset(); 
                } else {
                    
                    const errorData = await response.json().catch(() => ({ message: 'Server failed to save changes.' }));
                    console.error('Submission Failed:', errorData);
                    displayMessage('danger', `Update failed: ${errorData.message || 'Server error. Please try again.'}`);
                }

            } catch (error) {
             
                console.error('Network Error:', error);
                displayMessage('danger', 'A network error occurred. Check your connection.');
            }
        });
    }

 
    const apiKey = "Z3drZDY5RnRqMmgybW9ZQUpFWTdWeGNQTlRHVkU4TlhDRXNHcmlKcQ==";  
    const apiUrl = "https://api.countrystatecity.in/v1";

    fetch(`${apiUrl}/countries/IN/states`, {
        method: "GET",
        headers: {
            "X-CSCAPI-KEY": apiKey
        }
    })
    .then(response => response.json())
    .then(states => {
        if (!Array.isArray(states)) {
            console.error("Invalid state response:", states);
            return;
        }

        states.forEach(state => {
            let option = document.createElement("option");
            option.value = state.iso2;
            option.textContent = state.name;
            stateDropdown.appendChild(option);
        });
    })
    .catch(error => console.error("Error fetching states:", error));

   
    stateDropdown.addEventListener("change", function () {
        cityDropdown.innerHTML = '<option value="">Select City</option>';

        if (!this.value) return;

        fetch(`${apiUrl}/countries/IN/states/${this.value}/cities`, {
            method: "GET",
            headers: {
                "X-CSCAPI-KEY": apiKey
            }
        })
        .then(response => response.json())
        .then(cities => {
            if (!Array.isArray(cities)) {
                console.error("Invalid city response:", cities);
                return;
            }

            cities.forEach(city => {
                let option = document.createElement("option");
                option.value = city.name;
                option.textContent = city.name;
                cityDropdown.appendChild(option);
            });
        })
        .catch(error => console.error("Error fetching cities:", error));
    });

  
    document.getElementById("wishlist")?.addEventListener("input", function (event) {
        let input = this.value.trim().replace(/\s{2,}/g, " "); 
        let words = input.split(",").map(word => word.trim()).filter(word => word.length > 0);
        
        if (event.inputType === "insertText" && event.data === " ") {
            if (words.length > 0 && !input.endsWith(",")) {
                this.value = input + ", ";
            }
        }
    });
});
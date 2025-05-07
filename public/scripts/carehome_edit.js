document.addEventListener("DOMContentLoaded", function () {
    function validateField(input, pattern, errorMsg) {
        let errorElement = document.getElementById(input.id + "-error");
        if (!errorElement) {
            errorElement = document.createElement("span");
            errorElement.id = input.id + "-error";
            errorElement.style.color = "red";
            input.parentNode.insertBefore(errorElement, input.nextSibling);
        }

        if (!pattern.test(input.value.trim())) {
            errorElement.textContent = errorMsg;
        } else {
            errorElement.textContent = "";
        }
    }


    document.getElementById("fullname").addEventListener("input", function () {
        validateField(this, /.+/, "Full Name is required.");
    });


    document.getElementById("phne").addEventListener("input", function () {
        validateField(this, /^[0-9]{10}$/, "Enter a valid 10-digit mobile number.");
    });


    document.getElementById("mail").addEventListener("input", function () {
        validateField(this, /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Enter a valid email address.");
    });


    document.getElementById("gvtid").addEventListener("input", function () {
        validateField(this, /^[0-9]{6,12}$/, "Enter a valid Government ID (6-12 digits).");
    });


    document.getElementById("pinc").addEventListener("input", function () {
        validateField(this, /^[0-9]{6}$/, "Enter a valid 6-digit Pincode.");
    });

    document.getElementById("wishlist").addEventListener("input", function (event) {
        let input = this.value.trim().replace(/\s{2,}/g, " "); 
        let words = input.split(",").map(word => word.trim()).filter(word => word.length > 0);
    
   
        if (event.inputType === "insertText" && event.data === " ") {
            if (words.length > 0 && !input.endsWith(",")) {
                this.value = input + ", ";
            }
        }
    });
    

    document.getElementById("bank").addEventListener("input", function () {
        validateField(this, /^[A-Za-z ]+$/, "Bank name must contain only letters.");
    });


    document.getElementById("accnum").addEventListener("input", function () {
        validateField(this, /^[0-9]{8,16}$/, "Enter a valid Account Number (8-16 digits).");
    });

    
    document.getElementById("ifsc").addEventListener("input", function () {
        validateField(this, /^[A-Z]{4}[0-9]{7}$/, "Enter a valid IFSC Code (e.g., ABCD1234567).");
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const stateDropdown = document.getElementById("state");
    const cityDropdown = document.getElementById("city");

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
});

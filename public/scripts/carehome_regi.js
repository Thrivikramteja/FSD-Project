// document.addEventListener("DOMContentLoaded", function () {
//     const stateSelect = document.getElementById("state");
//     const citySelect = document.getElementById("city");
//     const form = document.getElementById("registrationForm");

//     // Fetch cities based on selected state
//     async function fetchCities(state) {
//         if (!state) {
//             citySelect.innerHTML = '<option value="">-- Select City --</option>';
//             return;
//         }

//         try {
//             const response = await fetch(`/api/cities/${state}`);
//             if (!response.ok) {
//                 throw new Error(`Failed to fetch cities for ${state}`);
//             }
//             const cities = await response.json();

//             // Populate cities dropdown
//             citySelect.innerHTML = '<option value="">-- Select City --</option>';
//             cities.forEach(city => {
//                 let option = document.createElement("option");
//                 option.value = city;
//                 option.textContent = city;
//                 citySelect.appendChild(option);
//             });

//         } catch (error) {
//             console.error("Error loading cities:", error);
//         }
//     }

//     // Load cities when state is selected
//     stateSelect.addEventListener("change", function () {
//         fetchCities(this.value);
//     });

//     // Validation rules
//     const validationRules = [
//         { id: "email", regex: /^[a-zA-Z0-9._%+-]+@[a-z]+\.[a-zA-Z]{2,}$/, message: "Enter a valid email address." },
//         { id: "contact", regex: /^\d{10}$/, message: "Contact number must be exactly 10 digits." },
//         { id: "ifsc", regex: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: "Invalid IFSC Code format (4 letters, 0, 6 alphanumeric)." },
//         { id: "upi", regex: /^[a-zA-Z0-9.-]+@[a-zA-Z]+$/, message: "Enter a valid UPI ID.", optional: true } // Optional field
//     ];

//     // Apply validation
//     validationRules.forEach(field => {
//         const input = document.getElementById(field.id);
//         if (!input) return;

//         const errorMsg = document.createElement("div");
//         errorMsg.className = "error-message";
//         input.parentNode.insertBefore(errorMsg, input.nextSibling);

//         input.addEventListener("blur", function () {
//             const value = input.value.trim();
//             if (!field.optional && value === "") {
//                 errorMsg.textContent = "This field is required.";
//                 input.classList.add("invalid");
//             } else if (value && !field.regex.test(value)) {
//                 errorMsg.textContent = field.message;
//                 input.classList.add("invalid");
//             } else {
//                 errorMsg.textContent = "";
//                 input.classList.remove("invalid");
//             }
//         });
//     });

//     // Terms & Conditions Validation
//     form.addEventListener("submit", function (event) {
//         let isValid = true;

//         // Validate all fields
//         validationRules.forEach(field => {
//             const input = document.getElementById(field.id);
//             if (input && input.classList.contains("invalid")) {
//                 isValid = false;
//             }
//         });

//         // Validate Terms Checkbox
//         const termsCheckbox = document.querySelector("input[name='terms']");
//         const termsMsg = document.createElement("div");
//         termsMsg.className = "error-message";
//         termsCheckbox.parentNode.insertBefore(termsMsg, termsCheckbox.nextSibling);

//         if (!termsCheckbox.checked) {
//             termsMsg.textContent = "You must agree to the Terms & Conditions.";
//             isValid = false;
//         } else {
//             termsMsg.textContent = "";
//         }

//         // Prevent form submission if invalid
//         if (!isValid) {
//             event.preventDefault();
//         }
//     });
// });
document.addEventListener("DOMContentLoaded", function () {
    const stateSelect = document.getElementById("state");
    const citySelect = document.getElementById("city");
    const form = document.getElementById("registrationForm");

    // Fetch cities based on selected state
    async function fetchCities(state) {
        if (!state) {
            citySelect.innerHTML = '<option value="">-- Select City --</option>';
            return;
        }

        try {
            const response = await fetch(`/api/cities/${state}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch cities for ${state}`);
            }
            const cities = await response.json();

            citySelect.innerHTML = '<option value="">-- Select City --</option>';
            cities.forEach(city => {
                let option = document.createElement("option");
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });

        } catch (error) {
            console.error("Error loading cities:", error);
        }
    }

    stateSelect.addEventListener("change", function () {
        fetchCities(this.value);
    });

    // Validation rules
    const validationRules = [
        { id: "email", regex: /^[a-zA-Z0-9._%+-]+@[a-z]+\.[a-zA-Z]{2,}$/, message: "Enter a valid email address." },
        { id: "contact", regex: /^\d{10}$/, message: "Contact number must be exactly 10 digits." },
        { id: "ifsc", regex: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: "Invalid IFSC Code format (4 letters, 0, 6 alphanumeric)." },
        { id: "upi", regex: /^[a-zA-Z0-9.-]+@[a-zA-Z]+$/, message: "Enter a valid UPI ID.", optional: true },
        { id: "reg_number", regex: /^\d{3}\/\d{4}$/, message: "Registration number must be in format 123/2024." },
        { id: "num_residents", regex: /^[1-9]\d*$/, message: "Number of residents must be greater than 10.", min: 11 },
        { id: "account_number", regex: /^\d{10,14}$/, message: "Account number must be between 10 to 14 digits." }
    ];

    function validateField(input, field) {
        const errorMsg = input.nextElementSibling;
        const value = input.value.trim();

        if (!field.optional && value === "") {
            errorMsg.textContent = "This field is required.";
            input.classList.add("invalid");
            return false;
        } else if (value && !field.regex.test(value)) {
            errorMsg.textContent = field.message;
            input.classList.add("invalid");
            return false;
        } else if (field.min && parseInt(value) < field.min) {
            errorMsg.textContent = `Value must be at least ${field.min}.`;
            input.classList.add("invalid");
            return false;
        } else {
            errorMsg.textContent = "";
            input.classList.remove("invalid");
            return true;
        }
    }

    // Apply validation
    validationRules.forEach(field => {
        const input = document.getElementById(field.id);
        if (!input) return;

        const errorMsg = document.createElement("div");
        errorMsg.className = "error-message";
        input.parentNode.insertBefore(errorMsg, input.nextSibling);

        input.addEventListener("blur", function () {
            validateField(input, field);
        });
    });

    // Form Submission Validation
    form.addEventListener("submit", function (event) {
        let isValid = true;
        let firstInvalidField = null;

        validationRules.forEach(field => {
            const input = document.getElementById(field.id);
            if (input && !validateField(input, field)) {
                if (!firstInvalidField) {
                    firstInvalidField = input;
                }
                isValid = false;
            }
        });

        const termsCheckbox = document.querySelector("input[name='terms']");
        const termsMsg = termsCheckbox.nextElementSibling || document.createElement("div");
        termsMsg.className = "error-message";

        if (!termsCheckbox.checked) {
            termsMsg.textContent = "You must agree to the Terms & Conditions.";
            isValid = false;
            termsCheckbox.parentNode.insertBefore(termsMsg, termsCheckbox.nextSibling);
            if (!firstInvalidField) firstInvalidField = termsCheckbox;
        } else {
            termsMsg.textContent = "";
        }

        if (!isValid) {
            event.preventDefault();
            firstInvalidField.focus();
        }
    });
});

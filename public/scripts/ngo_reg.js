document.addEventListener("DOMContentLoaded", function () {
    const fields = [
        { id: "darpan_id", regex: /^[A-Z]{2}\/+[0-9]{4}\/+[0-9]{7}$/, message: "DARPAN ID must be state/yoe/unique id." },
        { id: "email", regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z]+\.[a-zA-Z]{2,}$/, message: "Enter a valid email address." },
        { id: "login_email", regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z]+\.[a-zA-Z]{2,}$/, message: "Enter a valid email for login." },
        { id: "phone", regex: /^\d{10}$/, message: "Phone number must be 10 digits." },
        { id: "ifsc", regex: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: "Invalid IFSC Code format (4 letters, 0, 6 alphanumeric)." },
        { id: "upi", regex: /^[a-zA-Z0-9.\-_]{2,}@([a-zA-Z]{3,})$/, message: "Enter a valid UPI ID (e.g., user@upi, name@bank)." },
        { id: "password", regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, message: "Password must be at least 8 characters, with 1 uppercase, 1 lowercase, and 1 number." }
    ];

    fields.forEach(field => {
        const input = document.getElementById(field.id);
        if (!input) return;

        const errorMsg = document.createElement("div");
        errorMsg.className = "error-message";
        input.parentNode.insertBefore(errorMsg, input.nextSibling);

        input.addEventListener("blur", function () {
            if (!field.regex.test(input.value.trim())) {
                errorMsg.textContent = field.message;
                input.classList.add("invalid");
            } else {
                errorMsg.textContent = "";
                input.classList.remove("invalid");
            }
        });
    });

    const yearField = document.getElementById("year_established");
    if (yearField) {
        const yearMsg = document.createElement("div");
        yearMsg.className = "error-message";
        yearField.parentNode.insertBefore(yearMsg, yearField.nextSibling);

        yearField.addEventListener("blur", function () {
            const year = parseInt(yearField.value.trim(), 10);
            const currentYear = new Date().getFullYear();
            if (isNaN(year) || year < 1800 || year > currentYear) {
                yearMsg.textContent = `Year must be between 1800 and ${currentYear}.`;
                yearField.classList.add("invalid");
            } else {
                yearMsg.textContent = "";
                yearField.classList.remove("invalid");
            }
        });
    }

    
    const passwordField = document.getElementById("password");
    const confirmPasswordField = document.getElementById("confirm_password");
    if (passwordField && confirmPasswordField) {
        const confirmPasswordMsg = document.createElement("div");
        confirmPasswordMsg.className = "error-message";
        confirmPasswordField.parentNode.insertBefore(confirmPasswordMsg, confirmPasswordField.nextSibling);

        confirmPasswordField.addEventListener("blur", function () {
            if (confirmPasswordField.value.trim() !== passwordField.value.trim()) {
                confirmPasswordMsg.textContent = "Passwords do not match.";
                confirmPasswordField.classList.add("invalid");
            } else {
                confirmPasswordMsg.textContent = "";
                confirmPasswordField.classList.remove("invalid");
            }
        });
    }

    
    const accountNumberInput = document.getElementById("account_number");
    if (accountNumberInput) {
        const accountMsg = document.createElement("div");
        accountMsg.className = "error-message";
        accountNumberInput.parentNode.insertBefore(accountMsg, accountNumberInput.nextSibling);

        accountNumberInput.addEventListener("blur", function () 
        {
            const accountNumber = accountNumberInput.value.trim();
            const accountNumberPattern = /^\d{9,18}$/;

            if (!accountNumberPattern.test(accountNumber)) 
                {
                accountMsg.textContent = "Invalid Account Number. It should contain only digits and be between 9 to 18 characters long.";
                accountNumberInput.classList.add("invalid");
            } else {
                accountMsg.textContent = "";
                accountNumberInput.classList.remove("invalid");
            }
        });
    }

    // Account Holder Name Validation
    const accountHolderInput = document.getElementById("account_holder");
    if (accountHolderInput) {
        const accountHolderMsg = document.createElement("div");
        accountHolderMsg.className = "error-message";
        accountHolderInput.parentNode.insertBefore(accountHolderMsg, accountHolderInput.nextSibling);

        accountHolderInput.addEventListener("blur", function () {
            if (accountHolderInput.value.trim().length < 3) {
                accountHolderMsg.textContent = "Account Holder Name must be at least 3 characters.";
                accountHolderInput.classList.add("invalid");
            } else {
                accountHolderMsg.textContent = "";
                accountHolderInput.classList.remove("invalid");
            }
        });
    }

    // Form Submission and Success Popup
    const form = document.getElementById("ngo_form");
    if (form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault();

            let isValid = true;

            // Check for existing error messages
            document.querySelectorAll(".error-message").forEach(error => {
                if (error.textContent !== "") {
                    isValid = false;
                }
            });

            // Final account number validation before submission
            if (accountNumberInput) {
                const accountNumber = accountNumberInput.value.trim();
                const accountNumberPattern = /^\d{9,18}$/;
                if (!accountNumberPattern.test(accountNumber)) {
                    alert("Invalid Account Number. It should contain only digits and be between 9 to 18 characters long.");
                    accountNumberInput.focus();
                    isValid = false;
                }
            }

            if (isValid) {
                alert("🎉 Registration Successful! Your NGO has been registered.");
                form.reset();
            } else {
                alert("⚠️ Please correct the errors before submitting.");
            }
        });
    }
});

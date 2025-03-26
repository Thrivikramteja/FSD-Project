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
            return false; // Validation failed
        } else {
            errorElement.textContent = "";
            return true; // Validation passed
        }
    }

    // Add input event listeners
    document.getElementById("fullname").addEventListener("input", function () {
        validateField(this, /.+/, "Full Name is required.");
    });

    document.getElementById("phne").addEventListener("input", function () {
        validateField(this, /^[0-9]{10}$/, "Enter a valid 10-digit mobile number.");
    });

    document.getElementById("mail").addEventListener("input", function () {
        validateField(this, /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Enter a valid email address.");
    });

    document.getElementById("darpan").addEventListener("input", function () {
        validateField(this, /^[A-Za-z0-9]{10,15}$/, "Darpan ID must be 10-15 alphanumeric characters.");
    });

    document.getElementById("phone").addEventListener("input" , function(){
        validateField(this, /^[0-9]{10}$/,"phone number must be of length of 10");
    })

    // Prevent form submission if validation fails and focus on the first field with an error
    document.querySelector("form").addEventListener("submit", function (event) {
        const fields = [
            { id: "fullname", pattern: /.+/, errorMsg: "Full Name is required." },
            { id: "phne", pattern: /^[0-9]{10}$/, errorMsg: "Enter a valid 10-digit mobile number." },
            { id: "mail", pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, errorMsg: "Enter a valid email address." },
            { id: "darpan", pattern: /^[A-Za-z0-9]{10,15}$/, errorMsg: "Darpan ID must be 10-15 alphanumeric characters." },
            {id: "phone" , pattern: /^[0-9]{10}$/, errorMsg: "phone number should be of length 10."},
        ];

        for (const { id, pattern, errorMsg } of fields) {
            const input = document.getElementById(id);
            if (!validateField(input, pattern, errorMsg)) {
                event.preventDefault(); 
                input.focus(); 
                break;
            }
        }
    });
});
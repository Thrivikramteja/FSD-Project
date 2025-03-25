document.addEventListener("DOMContentLoaded", function () {
  const form = document.forms["myForm"];

  function validateField(input, pattern, errorMsg) {
    let errorElement = document.getElementById(input.id + "-error");
    if (!errorElement) {
      errorElement = document.createElement("span");
      errorElement.id = input.id + "-error";
      errorElement.style.color = "red";
      input.parentNode.insertBefore(errorElement, input.nextSibling);
    }

    const isValid = pattern.test(input.value.trim());
    if (!isValid) {
      errorElement.textContent = errorMsg;
    } else {
      errorElement.textContent = "";
    }
    return isValid;
  }

  // Validate fields on input
  document.getElementById("fullname").addEventListener("input", function () {
    validateField(this, /.+/, "Full Name is required.");
  });

  document.getElementById("mail").addEventListener("input", function () {
    validateField(
      this,
      /^[a-zA-Z]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Enter a valid email address."
    );
  });

  document.getElementById("phone").addEventListener("input", function () {
    validateField(this, /^[0-9]{10}$/, "Enter a valid 10-digit phone number.");
  });

  document.getElementById("pass").addEventListener("input", function () {
    validateField(
      this,
      /^(?=.[A-Za-z])(?=.\d)[A-Za-z\d]{8,}$/,
      "Password must be at least 8 characters long and contain both letters and numbers."
    );

    const repass = document.getElementById("repass");
    if (repass.value) {
      validatePasswordMatch(repass);
    }
  });

  function validatePasswordMatch(input) {
    let confirmPassword = input.value;
    let password = document.getElementById("pass").value;
    let errorElement = document.getElementById(input.id + "-error");

    if (!errorElement) {
      errorElement = document.createElement("span");
      errorElement.id = input.id + "-error";
      errorElement.style.color = "red";
      input.parentNode.insertBefore(errorElement, input.nextSibling);
    }

    const isValid = confirmPassword === password;
    if (!isValid) {
      errorElement.textContent = "Passwords do not match.";
    } else {
      errorElement.textContent = "";
    }
    return isValid;
  }

  document.getElementById("repass").addEventListener("input", function () {
    validatePasswordMatch(this);
  });

  document.getElementById("pannum").addEventListener("input", function () {
    validateField(
      this,
      /^[A-Z0-9]{10}$/,
      "Enter a valid 10-character PAN number (uppercase letters and numbers only)."
    );
  });

  // Form submission validation
  form.addEventListener("submit", function (event) {
    // Prevent form from submitting by default
    event.preventDefault();

    // Validate all fields
    const isNameValid = validateField(
      document.getElementById("fullname"),
      /.+/,
      "Full Name is required."
    );

    const isEmailValid = validateField(
      document.getElementById("mail"),
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z]+\.[a-zA-Z]{2,}$/,
      "Enter a valid email address."
    );

    const isPhoneValid = validateField(
      document.getElementById("phone"),
      /^[0-9]{10}$/,
      "Enter a valid 10-digit phone number."
    );

    const isPasswordValid = validateField(
      document.getElementById("pass"),
      /.{8,}/,
      "Password must be at least 8 characters long."
    );

    const isConfirmPasswordValid = validatePasswordMatch(
      document.getElementById("repass")
    );

    const isPanValid = validateField(
      document.getElementById("pannum"),
      /^[A-Z0-9]{10}$/,
      "Enter a valid 10-character PAN number (uppercase letters and numbers only)."
    );

    if (
      isNameValid &&
      isEmailValid &&
      isPhoneValid &&
      isPasswordValid &&
      isConfirmPasswordValid &&
      isPanValid
    ) {
      form.submit();
    } else {
      // Focus the first invalid field
      if (!isNameValid) document.getElementById("fullname").focus();
      else if (!isEmailValid) document.getElementById("mail").focus();
      else if (!isPhoneValid) document.getElementById("phone").focus();
      else if (!isPasswordValid) document.getElementById("pass").focus();
      else if (!isConfirmPasswordValid)
        document.getElementById("repass").focus();
      else if (!isPanValid) document.getElementById("pannum").focus();
    }
  });
});

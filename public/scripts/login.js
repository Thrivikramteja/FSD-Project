document.getElementById("email").addEventListener("input", function () {
    let errorElement = document.getElementById(this.id + "-error");
    if (!errorElement) {
      errorElement = document.createElement("span");
      errorElement.id = this.id + "-error";
      errorElement.style.color = "red";
      this.parentNode.insertBefore(errorElement, this.nextSibling);
    }
  
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(this.value.trim())) {
      errorElement.textContent = "Enter a valid email address.";
    } else {
      errorElement.textContent = "";
    }
  });
  
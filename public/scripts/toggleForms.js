document.addEventListener("DOMContentLoaded", function () {
  let loginBtn = document.getElementById("loginBtn");
  let signupBtn = document.getElementById("signupBtn");
  let selectElement = document.getElementById("role");
  let nameElement = document.getElementById("nameElement");
  let signupSubmitBtn = document.getElementById("signupSubmitBtn");
  let loginSubmitBtn = document.getElementById("loginSubmitBtn");
  let loginas = document.getElementById("loginas");
  let phoneElement = document.getElementById("phoneElement");

  signupSubmitBtn.style.display = "none";
  nameElement.style.display = "none";
  phoneElement.style.display = "none";

  loginBtn.addEventListener("click", function () {
    phoneElement.style.display = "none";
    loginBtn.style.backgroundColor = "rgb(234, 233, 233)";
    signupBtn.style.backgroundColor = "white";
    loginas.style.display = "block";
    loginSubmitBtn.style.display = "block";
    signupSubmitBtn.style.display = "none";
    selectElement.style.display = "block";
    nameElement.style.display = "none";
  });

  signupBtn.addEventListener("click", function () {
    phoneElement.style.display = "block";
    signupBtn.style.backgroundColor = "rgb(234, 233, 233)";
    loginBtn.style.backgroundColor = "white";
    loginas.style.display = "none";
    loginSubmitBtn.style.display = "none";
    signupSubmitBtn.style.display = "block";
    selectElement.style.display = "none";
    nameElement.style.display = "block";
  });
});

document
  .getElementById("loginSubmitBtn")
  .addEventListener("click", function (event) {
    document.getElementById("login").action = "/login"; 
    // Set form action for login
  });

document
  .getElementById("signupSubmitBtn")
  .addEventListener("click", function (event) {
    document.getElementById("login").action = "/signup"; // Set form action for signup
  });


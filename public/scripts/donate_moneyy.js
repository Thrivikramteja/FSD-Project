// const selectElement = document.getElementById("some_home");
// const selectedValue = selectElement.value;
// const selectedText = selectElement.options[selectElement.selectedIndex].text;

// document.getElementById("submit").addEventListener("click", () => {
//   if (selectedValue) {
//     document.getElementById(
//       "choosen_one"
//     ).textContent = `Welcome to ${selectedText}`;
//     document.querySelector(".choose_someone").style.display = "none";
//     document.querySelector(".donation_main").style.display = "flex";
//     document.title = `donate to ${selectedText}`;
//   }
// });

// document.addEventListener("DOMContentLoaded", () => {
//   const amountButtons = document.querySelectorAll(".options");
//   const customAmount = document.getElementById("anyamount");
//   const tipDisplay = document.getElementById("show_tip");
//   const form = document.getElementById("donationForm");
//   const submitBtn = document.querySelector(".submit-btn");
//   const payNowBtn = document.querySelector(".pay-now-btn");

//   const invoiceDonation = document.getElementById("invoiceDonation");
//   const invoiceTip = document.getElementById("invoiceTip");
//   const invoiceTotal = document.getElementById("invoiceTotal");

//   let currentAmount = 0;
//   let totalAmount = 0;

//   function updateCalculations() {
//     const tip = currentAmount * 0.08;
//     totalAmount = currentAmount + tip;
//     const total = totalAmount.toFixed(2);

//     fetch(`/donate_money/${selectedValue}`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({total}),
//     })
//       .then((res) => res.json())
//       .then((response) => {
//         console.log("Success:", response);
//       })
//       .catch((error) => {
//         console.error("Error:", error);
//       });

//     tipDisplay.textContent = `₹${tip.toFixed(2)}`;
//     invoiceDonation.textContent = `₹${currentAmount.toFixed(2)}`;
//     invoiceTip.textContent = `₹${tip.toFixed(2)}`;
//     invoiceTotal.textContent = `₹${totalAmount.toFixed(2)}`;

//     submitBtn.querySelector(
//       ".button-text"
//     ).textContent = `Proceed to pay: ₹${totalAmount.toFixed(2)}`;
//     payNowBtn.querySelector(
//       ".button-text"
//     ).textContent = `Pay ₹${totalAmount.toFixed(2)}`;
//   }

//   amountButtons.forEach((button) => {
//     button.addEventListener("click", (e) => {
//       e.preventDefault();
//       amountButtons.forEach((b) => b.classList.remove("selected"));
//       button.classList.add("selected");
//       currentAmount = parseInt(button.textContent);
//       customAmount.value = currentAmount;
//       updateCalculations();
//     });
//   });

//   // customAmount.addEventListener('input', () => {
//   //     amountButtons.forEach(b => b.classList.remove('selected'));
//   //     currentAmount = parseFloat(customAmount.value) || 0;

//   //     updateCalculations();
//   // });

//   customAmount.addEventListener("input", () => {
//     amountButtons.forEach((b) => b.classList.remove("selected"));
//     currentAmount = parseFloat(customAmount.value) || 0;

//     const amountError = document.getElementById("amountError");
//     if (currentAmount <= 0 || currentAmount > 1000000) {
//       amountError.style.display = "block";
//       customAmount.classList.add("invalid");
//     } else {
//       amountError.style.display = "none";
//       customAmount.classList.remove("invalid");
//     }

//     updateCalculations();
//   });

//   form.addEventListener("submit", (e) => {
//     e.preventDefault();
//     let isValid = true;

//     form.querySelectorAll("input").forEach((input) => {
//       if (!input.checkValidity()) {
//         isValid = false;
//         input.nextElementSibling.style.display = "block";
//         input.classList.add("invalid");
//       } else {
//         input.nextElementSibling.style.display = "none";
//         input.classList.remove("invalid");
//       }
//     });

//     if (isValid && totalAmount > 0) {
//       submitBtn.disabled = true;
//       submitBtn.querySelector(".spinner").classList.remove("hidden");

//       setTimeout(() => {
//         submitBtn.disabled = false;
//         submitBtn.querySelector(".spinner").classList.add("hidden");
//         alert("Thank you for your donation!");
//         form.reset();
//         currentAmount = 0;
//         updateCalculations();
//       }, 2000);
//     } else if (totalAmount === 0) {
//       alert("Please select or enter a donation amount");
//     }
//   });

//   form.querySelectorAll("input").forEach((input) => {
//     input.addEventListener("blur", () => {
//       if (!input.checkValidity()) {
//         input.nextElementSibling.style.display = "block";
//         input.classList.add("invalid");
//       } else {
//         input.nextElementSibling.style.display = "none";
//         input.classList.remove("invalid");
//       }
//     });
//   });
// });

document.addEventListener("DOMContentLoaded", () => {
    const selectElement = document.getElementById("some_home");
    const submitSelectBtn = document.getElementById("submit");
    const choosenOne = document.getElementById("choosen_one");
  
    const donationSection = document.querySelector(".donation_main");
    const chooseSection = document.querySelector(".choose_someone");
  
    let selectedValue = "";
    let selectedText = "";
  
    submitSelectBtn.addEventListener("click", () => {
      selectedValue = selectElement.value;
      selectedText = selectElement.options[selectElement.selectedIndex].text;
  
      if (selectedValue) {
        choosenOne.textContent = `Welcome to ${selectedText}`;
        chooseSection.style.display = "none";
        donationSection.style.display = "flex";
        document.title = `Donate to ${selectedText}`;
      }
    });
  
    const amountButtons = document.querySelectorAll(".options");
    const customAmount = document.getElementById("anyamount");
    const tipDisplay = document.getElementById("show_tip");
  
    const form = document.getElementById("donationForm");
    const submitBtn = document.querySelector(".submit-btn");
    const invoiceDonation = document.getElementById("invoiceDonation");
    const invoiceTip = document.getElementById("invoiceTip");
    const invoiceTotal = document.getElementById("invoiceTotal");
  
    let currentAmount = 0;
    let totalAmount = 0;
  
    function updateCalculations() {
      const tip = currentAmount * 0.08;
      totalAmount = currentAmount + tip;
  
      // Update UI
      tipDisplay.textContent = `₹${tip.toFixed(2)}`;
      invoiceDonation.textContent = `₹${currentAmount.toFixed(2)}`;
      invoiceTip.textContent = `₹${tip.toFixed(2)}`;
      invoiceTotal.textContent = `₹${totalAmount.toFixed(2)}`;
  
      submitBtn.querySelector(".button-text").textContent = `Proceed to pay: ₹${totalAmount.toFixed(2)}`;
    }
  
    amountButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        amountButtons.forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        currentAmount = parseInt(btn.textContent);
        customAmount.value = currentAmount;
        updateCalculations();
      });
    });
  
    customAmount.addEventListener("input", () => {
      amountButtons.forEach(b => b.classList.remove("selected"));
      currentAmount = parseFloat(customAmount.value) || 0;
  
      const error = document.getElementById("amountError");
      if (currentAmount <= 0 || currentAmount > 1000000) {
        error.style.display = "block";
        customAmount.classList.add("invalid");
      } else {
        error.style.display = "none";
        customAmount.classList.remove("invalid");
      }
  
      updateCalculations();
    });
  
    form.addEventListener("submit", (e) => {
      e.preventDefault();
  
      let isValid = true;
      const inputs = form.querySelectorAll("input");
  
      inputs.forEach((input) => {
        if (!input.checkValidity()) {
          isValid = false;
          input.nextElementSibling.style.display = "block";
          input.classList.add("invalid");
        } else {
          input.nextElementSibling.style.display = "none";
          input.classList.remove("invalid");
        }
      });
  
      if (isValid && totalAmount > 0) {
        submitBtn.disabled = true;
        submitBtn.querySelector(".spinner").classList.remove("hidden");
  
        // Get user info
        const name = document.getElementById("name").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const email = document.getElementById("email").value.trim();
        const pan = document.getElementById("pan").value.trim();
  
        // Send donation details to server
        fetch(`/donate_money/${selectedValue}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            total: totalAmount.toFixed(2),
            name,
            phone,
            email,
            pan
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log("Donation submitted:", data);
          })
          .catch((err) => {
            console.error("Error during donation submit:", err);
          });
  
        // Simulated payment processing
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.querySelector(".spinner").classList.add("hidden");
          alert("Thank you for your donation!");
  
          form.reset();
          customAmount.value = "";
          currentAmount = 0;
          updateCalculations();
        }, 2000);
      } else if (totalAmount === 0) {
        alert("Please select or enter a donation amount");
      }
    });
  
    // Blur validation
    form.querySelectorAll("input").forEach((input) => {
      input.addEventListener("blur", () => {
        if (!input.checkValidity()) {
          input.nextElementSibling.style.display = "block";
          input.classList.add("invalid");
        } else {
          input.nextElementSibling.style.display = "none";
          input.classList.remove("invalid");
        }
      });
    });
  });
  
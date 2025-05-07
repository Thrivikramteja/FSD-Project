// document.addEventListener("DOMContentLoaded", function () {
//     const form = document.getElementById("donorForm");

//     form.addEventListener("submit", function (event) {
//         // Get field values
//         const name = document.getElementById("name").value.trim();
//         const email = document.getElementById("email").value.trim();
//         const number = document.getElementById("number").value.trim();
//         const age = document.getElementById("age").value.trim();
//         const address = document.getElementById("address").value.trim();
//         const state = document.getElementById("state").value.trim();
//         const terms = document.getElementById("terms").checked;

//         // Email regex: Must be xyz@gmail.com format and end with .com
//         const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
//         // Phone number regex: Exactly 10 digits (no more, no less)
//         const phoneRegex = /^\d{10}$/;

//         // Validation checks
//         if (name === "") {
//             alert("Full Name is required.");
//             event.preventDefault();
//             return;
//         }

//         if (!emailRegex.test(email)) {
//             alert("Invalid Email! Only Gmail accounts allowed (must end with @gmail.com).");
//             event.preventDefault();
//             return;
//         }

//         if (!phoneRegex.test(number)) {
//             alert("Invalid Phone Number! It must be exactly 10 digits.");
//             event.preventDefault();
//             return;
//         }

//         if (age === "" || isNaN(age) || age <= 0) {
//             alert("Please enter a valid age.");
//             event.preventDefault();
//             return;
//         }

//         if (address === "") {
//             alert("Address cannot be empty.");
//             event.preventDefault();
//             return;
//         }

//         if (state === "") {
//             alert("Please select a state.");
//             event.preventDefault();
//             return;
//         }

//         if (!terms) {
//             alert("You must agree to the Terms and Conditions.");
//             event.preventDefault();
//             return;
//         }

//         alert("Registration successful!");
//     });
// });

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("donorForm");

    // form.addEventListener("submit", function (event) {
    //     event.preventDefault(); // prevent default form submission

    //     console.log("before post req");
    //     const ngoID = document.getElementById("ngoID").value;
    //     const eventName = document.getElementById("eventName").value;

    //     console.log(ngoID + "" + eventName);

    //     fetch(`/registerUser/${ngoID}`, {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json"
    //         },
    //         body: JSON.stringify({ event: eventName })
    //     })
    //     .then(res => res.json())
    //     .then(data => {
    //         alert(data.message); // show backend message
    //     })
    //     .catch(err => {
    //         console.error("Error:", err);
    //         alert("Something went wrong!");
    //     });
    // });

    form.addEventListener("submit",function(event)
{
    window.alert("Registration succesful");
})
});

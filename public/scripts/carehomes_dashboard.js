// document.addEventListener("DOMContentLoaded", function () {
//     generateRandomDonations();
//     document.getElementById("dashboard-stats").style.display = "none";
// });

// function toggleStats() {
//     var stats = document.getElementById("dashboard-stats");
//     var button = document.querySelector(".toggle-button");
//     if (stats.style.display === "none" || stats.style.display === "") {
//         stats.style.display = "flex";
//         button.textContent = "Hide Dashboard Stats";
//     } else {
//         stats.style.display = "none";
//         button.textContent = "Show Dashboard Stats";
//     }
// }

// function generateRandomDonations() {
//     const users = ["John Doe", "Jane Smith", "Michael Brown", "Alice Green", "David Johnson"];
//     const donationList = document.querySelector(".donation-list");
//     donationList.innerHTML = ""; // Clear previous data

//     for (let i = 0; i < users.length; i++) {
//         let randomAmount = (Math.floor(Math.random() * 50) + 1) * 100; // Generates multiples of 100 (₹100 - ₹5000)
//         let donationItem = document.createElement("div");
//         donationItem.classList.add("donation-card");
//         donationItem.innerHTML = `<p><strong>${users[i]}</strong> donated ₹${randomAmount}</p>`;
//         donationList.appendChild(donationItem);
//     }
// }


document.addEventListener("DOMContentLoaded", function () {
    generateRandomDonations();
    document.getElementById("dashboard-stats").style.display = "none";

    const viewMoreBtn = document.getElementById("viewMoreBtn");
    const viewLessBtn = document.getElementById("viewLessBtn");

    if (viewMoreBtn && viewLessBtn) {
        viewMoreBtn.addEventListener("click", function () {
            document.querySelectorAll(".fundraiser-card.hidden").forEach(card => card.classList.remove("hidden"));
            viewMoreBtn.classList.add("hidden");
            viewLessBtn.classList.remove("hidden");
        });

        viewLessBtn.addEventListener("click", function () {
            document.querySelectorAll(".fundraiser-card").forEach((card, index) => {
                if (index > 0) card.classList.add("hidden");
            });
            viewLessBtn.classList.add("hidden");
            viewMoreBtn.classList.remove("hidden");
        });
    }
});

function toggleStats() {
    var stats = document.getElementById("dashboard-stats");
    var button = document.querySelector(".toggle-button");
    if (stats.style.display === "none" || stats.style.display === "") {
        stats.style.display = "flex";
        button.textContent = "Hide Dashboard Stats";
    } else {
        stats.style.display = "none";
        button.textContent = "Show Dashboard Stats";
    }
}

function generateRandomDonations() {
    const users = ["John Doe", "Jane Smith", "Michael Brown", "Alice Green", "David Johnson"];
    const donationList = document.querySelector(".donation-list");
    donationList.innerHTML = "";

    for (let i = 0; i < users.length; i++) {
        let randomAmount = (Math.floor(Math.random() * 50) + 1) * 100;
        let donationItem = document.createElement("div");
        donationItem.classList.add("donation-card");
        donationItem.innerHTML = `<p><strong>${users[i]}</strong> donated ₹${randomAmount}</p>`;
        donationList.appendChild(donationItem);
    }
}

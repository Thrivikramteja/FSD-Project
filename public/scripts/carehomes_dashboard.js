document.addEventListener("DOMContentLoaded", function () {
    // Hide dashboard stats by default
    document.getElementById("dashboard-stats").style.display = "none";

    // Toggle visibility for fundraisers
    const viewMoreBtn = document.getElementById("viewMoreFundraisers");
    const viewLessBtn = document.getElementById("viewLessFundraisers");

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

    // Toggle visibility for dashboard stats
    const toggleButton = document.querySelector(".toggle-button");
    if (toggleButton) {
        toggleButton.addEventListener("click", function () {
            const stats = document.getElementById("dashboard-stats");
            if (stats.style.display === "none" || stats.style.display === "") {
                stats.style.display = "flex";
                toggleButton.textContent = "Hide Dashboard Stats";
            } else {
                stats.style.display = "none";
                toggleButton.textContent = "Show Dashboard Stats";
            }
        });
    }
});
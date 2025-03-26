const statsButton = document.getElementById('toggle-stats-btn');
if (statsButton) {
    statsButton.addEventListener('click', function () {
        const stats = document.getElementById('stats-container');
        if (stats) {
            if (stats.style.display === 'none' || stats.style.display === '') {
                stats.style.display = 'flex';
                statsButton.textContent = 'Show Less';
            } else {
                stats.style.display = 'none';
                statsButton.textContent = 'Statistics';
            }
        }
    });
}


// document.getElementById("fundraiserForm").addEventListener('submit', function (e)
//  {
//     const goalInput = document.getElementById("goal");
//     const goalError = document.getElementById("goalerror");
//     const selectedDropdown = document.getElementById("val_drop");
//     const dropdownError = document.getElementById("val_error");
//     const dateInput = document.getElementById("deadline");
//     const dateError = document.getElementById("dateerror");


//     dateError.style.display = "none";
//     goalError.style.display = "none";
//     dropdownError.style.display = "none";

//     const goalValue = parseInt(goalInput.value, 10);
//     if (isNaN(goalValue) || goalValue < 100000) 
//         {
//         e.preventDefault(); 
//         goalError.style.display = "block"; 
//         goalInput.focus(); 
//         return;
//     }

    
//     if (selectedDropdown.value === "None" || selectedDropdown.value === "")
//          {
//         e.preventDefault(); 
//         dropdownError.style.display = "block"; 
//         selectedDropdown.focus(); 
//     }

//     const today = new Date();
    
//     const inputDate = new Date(dateInput.value); 
//     if (isNaN(inputDate) || inputDate < today) {
//         e.preventDefault();
//         dateError.style.display = "block";
//         dateInput.focus();
//         return;
//     }
// });


document.getElementById("fundraiserForm").addEventListener("submit", function (e) {
    const goalInput = document.getElementById("goal");
    const goalError = document.getElementById("goalerror");
    const selectedDropdown = document.getElementById("val_drop");
    const dropdownError = document.getElementById("val_error");
    const dateInput = document.getElementById("deadline");

    // Ensure goalError, dropdownError, and dateError visibility is reset
    goalError.style.display = "none";
    dropdownError.style.display = "none";

    // Validate goal amount
    const goalValue = parseInt(goalInput.value, 10);
    if (isNaN(goalValue) || goalValue < 100000) {
        e.preventDefault();
        goalError.style.display = "block";
        goalInput.focus();
        return;
    }

    // Validate dropdown selection
    if (selectedDropdown.value === "None" || selectedDropdown.value === "") {
        e.preventDefault();
        dropdownError.style.display = "block";
        selectedDropdown.focus();
        return;
    }

    // Validate deadline
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight
    const inputDate = new Date(dateInput.value);
    if (isNaN(inputDate) || inputDate < today) {
        e.preventDefault();
        alert("Please choose a valid deadline that is in the future.");
        dateInput.focus();
        return;
    }
});
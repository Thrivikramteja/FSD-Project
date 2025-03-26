document.getElementById("eventform").addEventListener('submit', function (e)
 {
    
    const dateInput = document.getElementById("date");
    const dateError = document.getElementById("dateerror");


    dateError.style.display = "none";



    const today = new Date();
    today.setHours(0,0,0);
    const inputDate = new Date(dateInput.value); 
    if (isNaN(inputDate) || inputDate < today) {
        e.preventDefault();
        dateError.style.display = "block";
        dateInput.focus();
        return;
    }
});
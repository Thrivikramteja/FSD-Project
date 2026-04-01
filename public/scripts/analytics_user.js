// document.addEventListener('DOMContentLoaded', function() 
// {
//     const today = new Date();
//     const this_month = today.getMonth(); 
//     const this_year = today.getFullYear(); 

   
//     function formatDate(date_string) 
//     {
//         const [day, month, year] = date_string.split('-').map(Number); 
//         const date = new Date(year, month - 1, day); 
//         return `${date.getFullYear()}-${date.getMonth() + 1}`; 
//     }

//     function analysis_user() {
//         let ev_curr_month = 0;
//         let ev_all_time = 0;
//         let mon_curr_month = 0;
//         let tot_don = 0;
//         let curr_mon_don = 0;
//         let all_time_don = 0;
       
//         const events = document.querySelectorAll('.part_ev .event');
//         const fundraisers = document.querySelectorAll('.fund_pa .event');

//         const currentMonthYear = `${this_year}-${this_month + 1}`;

//         for(let i = 0; i < events.length; ++i) 
//         {
//             const eventDate = events[i].querySelector('.date').textContent;
//             const eventMonthYear = formatDate(eventDate);

//             if (eventMonthYear === currentMonthYear) {
//                 ev_curr_month++;
//             }
//             ev_all_time++;
//         }

//         for(let i = 0; i < fundraisers.length; ++i) 
//         {
//             const fundraiserDate = fundraisers[i].querySelector('.date').textContent;
//             const fundraiserAmount = parseFloat(fundraisers[i].querySelector('.money').textContent);
//             const fundraiserMonthYear = formatDate(fundraiserDate);

//             if (fundraiserMonthYear === currentMonthYear) {
//                 mon_curr_month += fundraiserAmount;
//                 curr_mon_don++;
//             }
//             tot_don += fundraiserAmount; 
//             all_time_don++; 
//         }

//         document.getElementById('event-count-current').textContent += ev_curr_month;
//         document.getElementById('event-count-all').textContent += ev_all_time;
//         document.getElementById('donation-current').textContent += `${mon_curr_month} Rs`;
//         document.getElementById('donation-all').textContent += `${tot_don} Rs`;
//         document.getElementById('this_mon_don').textContent += `${curr_mon_don}`;
//         document.getElementById('all_time_con').textContent += `${all_time_don}`;
//     }

//     analysis_user();
// });

// document.getElementById('toggle-stats-btn').addEventListener('click', function() {
//     const stats = document.getElementById('user-stats');
//     const button = document.getElementById('toggle-stats-btn');

//     if (stats.style.display === 'none' || stats.style.display === '') {
//         stats.style.display = 'block';
//         button.textContent = 'Show Less';  
//     } else {
//         stats.style.display = 'none';
//         button.textContent = 'Statistics';  
//     }
// });

document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    const this_month = today.getMonth(); 
    const this_year = today.getFullYear(); 

    function formatEventDate(dateString) {
        try {
            const date = new Date(dateString); // Parse the date string
            if (isNaN(date)) {
                throw new Error("Invalid date format");
            }
            return `${date.getFullYear()}-${date.getMonth() + 1}`; // Return year-month
        } catch (error) {
            console.error("Error parsing date:", dateString, error);
            return null; // Return null for invalid dates
        }
    }

    function analysis_user() {
        let ev_curr_month = 0;
        let ev_all_time = 0;
        let mon_curr_month = 0;
        let tot_don = 0;
        let curr_mon_don = 0;
        let all_time_don = 0;

        const events = document.querySelectorAll('.part_ev .event');
        const fundraisers = document.querySelectorAll('.fund_pa .event');

        const currentMonthYear = `${this_year}-${this_month + 1}`;

        for (let i = 0; i < events.length; ++i) {
            const eventDate = events[i].querySelector('.date').textContent.trim();
            console.log("Event Date:", eventDate); // Debugging
            const eventMonthYear = formatEventDate(eventDate);

            if (eventMonthYear === currentMonthYear) {
                ev_curr_month++;
            }
            ev_all_time++;
        }

        for (let i = 0; i < fundraisers.length; ++i) {
            const fundraiserDate = fundraisers[i].querySelector('.date').textContent.trim();
            const fundraiserAmount = parseFloat(fundraisers[i].querySelector('.money').textContent.trim());
            console.log("Fundraiser Date:", fundraiserDate); // Debugging
            const fundraiserMonthYear = formatEventDate(fundraiserDate);

            if (fundraiserMonthYear === currentMonthYear) {
                mon_curr_month += fundraiserAmount;
                curr_mon_don++;
            }
            tot_don += fundraiserAmount;
            all_time_don++;
        }

        document.getElementById('event-count-current').textContent += ev_curr_month;
        document.getElementById('event-count-all').textContent += ev_all_time;
        document.getElementById('donation-current').textContent += `${mon_curr_month} Rs`;
        document.getElementById('donation-all').textContent += `${tot_don} Rs`;
        document.getElementById('this_mon_don').textContent += `${curr_mon_don}`;
        document.getElementById('all_time_con').textContent += `${all_time_don}`;
    }

    analysis_user();
});

document.getElementById('toggle-stats-btn').addEventListener('click', function() {
    const stats = document.getElementById('user-stats');
    const button = document.getElementById('toggle-stats-btn');

    if (stats.style.display === 'none' || stats.style.display === '') {
        stats.style.display = 'block';
        button.textContent = 'Show Less';  
    } else {
        stats.style.display = 'none';
        button.textContent = 'Statistics';  
    }
});

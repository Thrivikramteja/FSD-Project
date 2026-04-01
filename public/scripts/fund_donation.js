
// document.addEventListener('DOMContentLoaded', () => {
//     const amountButtons = document.querySelectorAll('.options');
//     const customAmount = document.getElementById('anyamount');
//     const tipDisplay = document.getElementById('show_tip');
//     const form = document.getElementById('donationForm');
//     const submitBtn = document.querySelector('.submit-btn');
//     const payNowBtn = document.querySelector('.pay-now-btn');
    
//     const invoiceDonation = document.getElementById('invoiceDonation');
//     const invoiceTip = document.getElementById('invoiceTip');
//     const invoiceTotal = document.getElementById('invoiceTotal');
    
//     let currentAmount = 0;
//     let totalAmount = 0;

//     function updateCalculations() {
//         const tip = currentAmount * 0.08;
//         totalAmount = currentAmount + tip;
        
        
//         tipDisplay.textContent = `₹${tip.toFixed(2)}`;
//         invoiceDonation.textContent = `₹${currentAmount.toFixed(2)}`;
//         invoiceTip.textContent = `₹${tip.toFixed(2)}`;
//         invoiceTotal.textContent = `₹${totalAmount.toFixed(2)}`;
        
//         submitBtn.querySelector('.button-text').textContent = 
//             `Proceed to pay: ₹${totalAmount.toFixed(2)}`;
//         payNowBtn.querySelector('.button-text').textContent = 
//             `Pay ₹${totalAmount.toFixed(2)}`;
//     }

//     amountButtons.forEach(button => {
//         button.addEventListener('click', (e) => {
//             e.preventDefault();
//             amountButtons.forEach(b => b.classList.remove('selected'));
//             button.classList.add('selected');
//             currentAmount = parseInt(button.textContent);
//             customAmount.value = currentAmount;
//             updateCalculations();
//         });
//     });

//     // customAmount.addEventListener('input', () => {
//     //     amountButtons.forEach(b => b.classList.remove('selected'));
//     //     currentAmount = parseFloat(customAmount.value) || 0;
    
//     //     updateCalculations();
//     // });

//     customAmount.addEventListener('input', () => {
//         amountButtons.forEach(b => b.classList.remove('selected'));
//         currentAmount = parseFloat(customAmount.value) || 0;
    
//         const amountError = document.getElementById('amountError');
//         if (currentAmount <= 0 || currentAmount > 1000000) {
//             amountError.style.display = 'block';
//             customAmount.classList.add('invalid');
//         } else {
//             amountError.style.display = 'none';
//             customAmount.classList.remove('invalid');
//         }
    
//         updateCalculations();
//     });
    
//     form.addEventListener('submit', (e) => {
//         e.preventDefault();
//         let isValid = true;

//         form.querySelectorAll('input').forEach(input => {
//             if (!input.checkValidity()) {
//                 isValid = false;
//                 input.nextElementSibling.style.display = 'block';
//                 input.classList.add('invalid');
//             } else {
//                 input.nextElementSibling.style.display = 'none';
//                 input.classList.remove('invalid');
//             }
//         });

//         if (isValid && totalAmount > 0) {
//             submitBtn.disabled = true;
//             submitBtn.querySelector('.spinner').classList.remove('hidden');

           
//         } else if (totalAmount === 0) {
//             alert('Please select or enter a donation amount');
//         }
//     });

   
//     form.querySelectorAll('input').forEach(input => {
//         input.addEventListener('blur', () => {
//             if (!input.checkValidity()) {
//                 input.nextElementSibling.style.display = 'block';
//                 input.classList.add('invalid');
//             } else {
//                 input.nextElementSibling.style.display = 'none';
//                 input.classList.remove('invalid');
//             }
//         });
//     });
// });
document.addEventListener('DOMContentLoaded', () => {
    const amountButtons = document.querySelectorAll('.options');
    const customAmount = document.getElementById('anyamount');
    const tipDisplay = document.getElementById('show_tip');
    const form = document.getElementById('donationForm');
    const submitBtn = form.querySelector('button[type="submit"]'); // Matches <button type="submit">
    const invoiceDonation = document.getElementById('invoiceDonation');
    const invoiceTip = document.getElementById('invoiceTip');
    const invoiceTotal = document.getElementById('invoiceTotal');
    const donationAmountInput = document.getElementById('donationAmount'); // Hidden input
    const tipAmountInput = document.getElementById('tipAmount'); // Hidden input

    let currentAmount = 0;
    let totalAmount = 0;

    function updateCalculations() {
        const tip = currentAmount * 0.08;
        totalAmount = currentAmount + tip;

        tipDisplay.textContent = `₹${tip.toFixed(2)}`;
        invoiceDonation.textContent = `₹${currentAmount.toFixed(2)}`;
        invoiceTip.textContent = `₹${tip.toFixed(2)}`;
        invoiceTotal.textContent = `₹${totalAmount.toFixed(2)}`;

        // Update hidden inputs for form submission
        donationAmountInput.value = currentAmount.toFixed(2);
        tipAmountInput.value = tip.toFixed(2);

        if (submitBtn) {
            submitBtn.textContent = `Proceed to pay: ₹${totalAmount.toFixed(2)}`;
        }
    }

    amountButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            amountButtons.forEach(b => b.classList.remove('selected'));
            button.classList.add('selected');
            currentAmount = parseInt(button.textContent);
            customAmount.value = currentAmount;
            updateCalculations();
        });
    });

    customAmount.addEventListener('input', () => {
        amountButtons.forEach(b => b.classList.remove('selected'));
        currentAmount = parseFloat(customAmount.value) || 0;

        const amountError = document.getElementById('amountError');
        if (currentAmount <= 0 || currentAmount > 1000000) {
            amountError.style.display = 'block';
            customAmount.classList.add('invalid');
        } else {
            amountError.style.display = 'none';
            customAmount.classList.remove('invalid');
        }

        updateCalculations();
    });

    form.addEventListener('submit', (e) => {
        let isValid = true;

       
        form.querySelectorAll('input').forEach(input => {
            if (!input.checkValidity()) {
                isValid = false;
                const errorElement = input.nextElementSibling;
                if (errorElement && errorElement.classList.contains('error-message')) {
                    errorElement.style.display = 'block';
                }
                input.classList.add('invalid');
            } else {
                const errorElement = input.nextElementSibling;
                if (errorElement && errorElement.classList.contains('error-message')) {
                    errorElement.style.display = 'none';
                }
                input.classList.remove('invalid');
            }
        });

        // Validate donation amount
        if (totalAmount <= 0) {
            isValid = false;
            alert('Please select or enter a donation amount');
            document.getElementById('amountError').style.display = 'block';
        }

        if (!isValid) {
            e.preventDefault(); // Prevent submission if invalid
        } else {
            // Allow default form submission
            if (submitBtn) {
                submitBtn.disabled = true; // Disable button to prevent multiple submissions
                submitBtn.textContent = 'Processing...'; // Optional: Show processing state
                window.alert("Donation sucessful please check your dasshboard");
            }
        }
    });

    // Real-time validation on blur
    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('blur', () => {
            const errorElement = input.nextElementSibling;
            if (!input.checkValidity()) {
                if (errorElement && errorElement.classList.contains('error-message')) {
                    errorElement.style.display = 'block';
                }
                input.classList.add('invalid');
            } else {
                if (errorElement && errorElement.classList.contains('error-message')) {
                    errorElement.style.display = 'none';
                }
                input.classList.remove('invalid');
            }
        });
    });
});
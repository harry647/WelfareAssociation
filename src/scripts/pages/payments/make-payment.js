/**
 * Make Payment Script
 * Handles payment form submission
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('paymentForm');
    
    if (!form) return;

    // Handle payment method change
    const paymentMethod = document.getElementById('paymentMethod');
    const transactionId = document.getElementById('transactionId');
    
    if (paymentMethod && transactionId) {
        paymentMethod.addEventListener('change', (e) => {
            if (e.target.value === 'cash') {
                transactionId.disabled = true;
                transactionId.placeholder = 'N/A';
            } else if (e.target.value) {
                transactionId.disabled = false;
                transactionId.placeholder = 'Enter transaction ID';
            } else {
                transactionId.disabled = true;
            }
        });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const paymentData = {
            fullName: formData.get('fullName'),
            studentId: formData.get('studentId'),
            amount: parseFloat(formData.get('amount')),
            paymentMethod: formData.get('paymentMethod'),
            transactionId: formData.get('transactionId')
        };

        // Basic validation
        if (!paymentData.fullName || !paymentData.studentId || !paymentData.amount) {
            alert('Please fill in all required fields');
            return;
        }

        // Show success (in real app, send to server)
        alert('Payment submitted successfully! Thank you.');
        form.reset();
    });
});

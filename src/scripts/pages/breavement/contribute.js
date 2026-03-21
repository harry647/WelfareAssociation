/**
 * Bereavement Contribute Script
 * Handles bereavement contribution form submission
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('bereavementForm');
    
    if (!form) return;

    // Handle payment method change
    const paymentMethod = document.getElementById('paymentMethod');
    const transactionId = document.getElementById('transactionId');
    
    if (paymentMethod && transactionId) {
        paymentMethod.addEventListener('change', (e) => {
            if (e.target.value === 'cash') {
                transactionId.disabled = true;
                transactionId.placeholder = 'N/A - Hand delivery';
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
        
        // Get selected beneficiary
        const selectedBeneficiary = document.querySelector('input[name="beneficiary"]:checked');
        const beneficiaryName = selectedBeneficiary ? 
            selectedBeneficiary.parentElement.querySelector('h3').textContent : '';
        
        const contributionData = {
            beneficiary: beneficiaryName,
            fullName: formData.get('fullName'),
            studentId: formData.get('studentId'),
            contributionType: formData.get('contributionType'),
            amount: formData.get('amount'),
            description: formData.get('description'),
            paymentMethod: formData.get('paymentMethod'),
            transactionId: formData.get('transactionId'),
            anonymous: formData.get('anonymous') === 'on'
        };

        // Basic validation
        if (!contributionData.fullName || !contributionData.contributionType) {
            alert('Please fill in all required fields');
            return;
        }

        // Show success (in real app, send to server)
        alert(`Thank you for your contribution to ${beneficiaryName}! Your support means a lot.`);
        form.reset();
    });
});

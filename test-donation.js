/**
 * Test Donation API
 */

const donationData = {
    donorName: 'Test User',
    donorEmail: 'test@example.com',
    amount: 1000,
    paymentMethod: 'mpesa',
    message: 'Test donation'
};

console.log('🧪 Testing donation API...');
console.log('Data:', JSON.stringify(donationData, null, 2));

try {
    const response = await fetch('http://localhost:3000/api/donations/one-time', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(donationData)
    });
    
    const result = await response.json();
    console.log('✅ Response:', result);
} catch (error) {
    console.error('❌ Error:', error.message);
}

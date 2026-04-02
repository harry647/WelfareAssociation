/**
 * PDF Receipt Generator
 * Generates receipt HTML for payments
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate a complete styled receipt HTML
 */
function generateReceiptHTML(paymentData) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payment Receipt - SWA</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f0f2f5;
            padding: 20px;
            min-height: 100vh;
        }
        .receipt-container {
            max-width: 700px;
            margin: 0 auto;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .receipt-header {
            background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 15px;
            border-radius: 50%;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        .logo img {
            width: 60px;
            height: 60px;
            object-fit: contain;
        }
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        .header h2 {
            font-size: 18px;
            font-weight: 400;
            opacity: 0.9;
        }
        .receipt-body {
            padding: 30px;
        }
        .receipt-title {
            text-align: center;
            font-size: 20px;
            color: #1a5f2a;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px dashed #e0e0e0;
        }
        .receipt-title span {
            background: #e8f5e9;
            padding: 8px 20px;
            border-radius: 20px;
        }
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 25px;
        }
        .detail-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 3px solid #2d8a3e;
        }
        .detail-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .detail-value {
            font-size: 16px;
            font-weight: 600;
            color: #333;
        }
        .amount-box {
            background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            margin: 25px 0;
        }
        .amount-box .label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 5px;
        }
        .amount-box .amount {
            font-size: 36px;
            font-weight: 700;
        }
        .payment-info {
            background: #f0f7ff;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 25px;
            border: 1px solid #cce5ff;
        }
        .payment-info h3 {
            color: #004085;
            font-size: 14px;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .payment-info .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .payment-info .label {
            color: #666;
        }
        .payment-info .value {
            font-weight: 600;
            color: #333;
        }
        .thank-you {
            text-align: center;
            padding: 20px;
            background: #fff3cd;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .thank-you h3 {
            color: #856404;
            font-size: 18px;
            margin-bottom: 5px;
        }
        .thank-you p {
            color: #856404;
            font-size: 14px;
        }
        .footer {
            background: #1a5f2a;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .footer p {
            font-size: 12px;
            opacity: 0.8;
            margin-bottom: 5px;
        }
        .footer .contact {
            font-size: 13px;
            font-weight: 600;
        }
        .print-btn {
            display: block;
            width: 200px;
            margin: 20px auto;
            padding: 12px 25px;
            background: #1a5f2a;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            text-align: center;
        }
        .print-btn:hover {
            background: #2d8a3e;
        }
        .status-completed {
            color: #28a745;
            font-weight: 700;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .receipt-container {
                box-shadow: none;
            }
            .print-btn {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="receipt-header">
            <div class="logo">
                <img src="${paymentData.logoUrl || '/images/logo.png'}" alt="SWA Logo" onerror="this.style.display='none'">
            </div>
            <div class="header">
                <h1>Student Welfare Association</h1>
                <h2>Payment Receipt</h2>
            </div>
        </div>
        
        <div class="receipt-body">
            <div class="receipt-title">
                <span>OFFICIAL RECEIPT</span>
            </div>
            
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Reference Number</div>
                    <div class="detail-value">${paymentData.referenceNumber || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Student ID</div>
                    <div class="detail-value">${paymentData.studentId || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Full Name</div>
                    <div class="detail-value">${paymentData.fullName || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Payment Date</div>
                    <div class="detail-value">${paymentData.paymentDate ? new Date(paymentData.paymentDate).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                </div>
            </div>
            
            <div class="amount-box">
                <div class="label">Amount Paid</div>
                <div class="amount">Ksh ${parseFloat(paymentData.amount || 0).toLocaleString()}</div>
            </div>
            
            <div class="payment-info">
                <h3>Payment Details</h3>
                <div class="row">
                    <span class="label">Payment Method:</span>
                    <span class="value">${paymentData.paymentMethod || 'N/A'}</span>
                </div>
                <div class="row">
                    <span class="label">Category:</span>
                    <span class="value">${paymentData.category || 'N/A'}</span>
                </div>
                <div class="row">
                    <span class="label">Status:</span>
                    <span class="value status-completed">${paymentData.status || 'COMPLETED'}</span>
                </div>
                ${paymentData.transactionId ? `
                <div class="row">
                    <span class="label">Transaction ID:</span>
                    <span class="value">${paymentData.transactionId}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="payment-info">
                <h3>Payment Channels</h3>
                <div class="row">
                    <span class="label">M-Pesa Paybill:</span>
                    <span class="value">${paymentData.mpesaPaybill || '247247'}</span>
                </div>
                <div class="row">
                    <span class="label">Bank Account:</span>
                    <span class="value">${paymentData.bankAccount || 'Bank of barichbank Plc - 01-2345678'}</span>
                </div>
                <div class="row">
                    <span class="label">Account Name:</span>
                    <span class="value">${paymentData.accountName || 'Student Welfare Association'}</span>
                </div>
            </div>
            
            <div class="thank-you">
                <h3>Thank You!</h3>
                <p>Your payment has been received. This is an official receipt.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Student Welfare Association (SWA)</p>
            <p class="contact">Email: swa@example.com | Phone: +254 700 000 000</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
    </div>
    
    <button class="print-btn" onclick="window.print()">Print Receipt</button>
</body>
</html>
    `.trim();
}

/**
 * Generate receipt as HTML file
 */
async function generatePDFReceipt(paymentData, outputPath) {
    try {
        const htmlContent = generateReceiptHTML(paymentData);
        const htmlPath = outputPath.replace('.pdf', '.html');
        fs.writeFileSync(htmlPath, htmlContent, 'utf8');
        
        return {
            success: true,
            path: htmlPath
        };
    } catch (error) {
        console.error('Error generating receipt:', error);
        throw error;
    }
}

module.exports = {
    generateReceiptHTML,
    generatePDFReceipt
};

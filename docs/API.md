# SWA Loan Management System - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Table of Contents
1. [Authentication](#authentication)
2. [Users](#users)
3. [Loans](#loans)
4. [Payments](#payments)
5. [M-Pesa Integration](#mpesa-integration)
6. [Reminders](#reminders)
7. [Notifications](#notifications)
8. [Reports & Export](#reports--export)
9. [Audit Trail](#audit-trail)
10. [Analytics](#analytics)

---

## 1. Authentication

### POST /auth/register
Register a new user.

**Request:**
```json
{
    "name": "John Doe",
    "email": "john.doe@student.joust.ac.ke",
    "studentId": "JOO/2024/001",
    "phone": "254712345678",
    "password": "securepassword",
    "role": "member"  // member, admin, finance, auditor
}
```

**Response:**
```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "id": "usr_123",
        "name": "John Doe",
        "email": "john.doe@student.joust.ac.ke",
        "studentId": "JOO/2024/001",
        "role": "member",
        "createdAt": "2025-01-15T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/login
Login user.

**Request:**
```json
{
    "email": "john.doe@student.joust.ac.ke",
    "password": "securepassword"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "id": "usr_123",
        "name": "John Doe",
        "email": "john.doe@student.joust.ac.ke",
        "role": "member",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

### POST /auth/logout
Logout user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

### GET /auth/profile
Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "usr_123",
        "name": "John Doe",
        "email": "john.doe@student.joust.ac.ke",
        "studentId": "JOO/2024/001",
        "phone": "254712345678",
        "role": "member",
        "memberSince": "2024-01-15",
        "isActive": true
    }
}
```

---

## 2. Users

### GET /users
Get all users (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | int | Page number (default: 1) |
| limit | int | Items per page (default: 20) |
| role | string | Filter by role |
| search | string | Search by name/email/studentId |
| isActive | bool | Filter by active status |

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": "usr_123",
            "name": "John Doe",
            "email": "john.doe@student.joust.ac.ke",
            "studentId": "JOO/2024/001",
            "phone": "254712345678",
            "role": "member",
            "memberSince": "2024-01-15",
            "isActive": true
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 150,
        "pages": 8
    }
}
```

### GET /users/:id
Get user by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "usr_123",
        "name": "John Doe",
        "email": "john.doe@student.joust.ac.ke",
        "studentId": "JOO/2024/001",
        "phone": "254712345678",
        "role": "member",
        "memberSince": "2024-01-15",
        "isActive": true,
        "loans": [],
        "guarantees": []
    }
}
```

### PUT /users/:id
Update user.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
    "name": "John Doe Updated",
    "phone": "254798765432",
    "isActive": true
}
```

**Response:**
```json
{
    "success": true,
    "message": "User updated successfully",
    "data": {
        "id": "usr_123",
        "name": "John Doe Updated",
        ...
    }
}
```

### DELETE /users/:id
Delete user (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "message": "User deleted successfully"
}
```

---

## 3. Loans

### GET /loans
Get all loans.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | int | Page number |
| limit | int | Items per page |
| status | string | pending, approved, active, repaid, rejected, overdue |
| studentId | string | Filter by student |
| year | int | Filter by year |
| dateFrom | date | Filter from date |
| dateTo | date | Filter to date |
| search | string | Search by name/ID/phone |

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": "ln_001",
            "loanId": "LN/2025/001",
            "studentId": "JOO/2024/001",
            "studentName": "John Doe",
            "phone": "254712345678",
            "email": "john.doe@student.joust.ac.ke",
            "amount": 5000,
            "interest": 250,
            "totalRepayment": 5250,
            "amountPaid": 2000,
            "balance": 3250,
            "purpose": "academic_fees",
            "repaymentPeriod": 3,
            "dueDate": "2025-04-15",
            "status": "active",
            "guarantor": {
                "name": "Jane Smith",
                "studentId": "JOO/2024/002",
                "phone": "254723456789"
            },
            "documents": [],
            "createdAt": "2025-01-15T10:00:00Z",
            "approvedAt": "2025-01-15T14:00:00Z",
            "disbursedAt": "2025-01-15T15:00:00Z"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 48,
        "pages": 3
    }
}
```

### GET /loans/:id
Get loan by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "ln_001",
        "loanId": "LN/2025/001",
        "studentId": "JOO/2024/001",
        "studentName": "John Doe",
        "phone": "254712345678",
        "email": "john.doe@student.joust.ac.ke",
        "amount": 5000,
        "interest": 250,
        "totalRepayment": 5250,
        "amountPaid": 2000,
        "balance": 3250,
        "purpose": "academic_fees",
        "purposeOther": null,
        "repaymentPeriod": 3,
        "dueDate": "2025-04-15",
        "status": "active",
        "penalty": 0,
        "guarantor": {
            "name": "Jane Smith",
            "studentId": "JOO/2024/002",
            "phone": "254723456789"
        },
        "documents": [
            {
                "id": "doc_001",
                "name": "fee_structure.pdf",
                "url": "/uploads/docs/doc_001.pdf",
                "type": "fee_structure"
            }
        ],
        "timeline": [
            {
                "action": "created",
                "description": "Loan application submitted",
                "by": "John Doe",
                "at": "2025-01-15T10:00:00Z"
            }
        ],
        "createdAt": "2025-01-15T10:00:00Z",
        "approvedAt": "2025-01-15T14:00:00Z",
        "disbursedAt": "2025-01-15T15:00:00Z"
    }
}
```

### POST /loans
Apply for a loan.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
    "studentId": "JOO/2024/001",
    "phone": "254712345678",
    "amount": 5000,
    "purpose": "academic_fees",
    "purposeOther": null,
    "repaymentPeriod": 3,
    "guarantor": {
        "name": "Jane Smith",
        "studentId": "JOO/2024/002",
        "phone": "254723456789"
    },
    "documents": [
        {
            "name": "fee_structure.pdf",
            "type": "fee_structure",
            "base64": "JVBERi0xLjQK..."
        }
    ]
}
```

**Response:**
```json
{
    "success": true,
    "message": "Loan application submitted successfully",
    "data": {
        "id": "ln_001",
        "loanId": "LN/2025/001",
        "status": "pending",
        "createdAt": "2025-01-15T10:00:00Z"
    }
}
```

### PUT /loans/:id
Update loan details (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
    "amount": 6000,
    "repaymentPeriod": 4,
    "dueDate": "2025-05-15"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Loan updated successfully",
    "data": {
        "id": "ln_001",
        ...
    }
}
```

### PATCH /loans/:id/approve
Approve a loan (Admin/Finance only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
    "notes": "Approved - all documents verified",
    "disburseNow": true,
    "disbursementMethod": "mpesa"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Loan approved and disbursed",
    "data": {
        "id": "ln_001",
        "status": "disbursed",
        "approvedAt": "2025-01-15T14:00:00Z",
        "disbursedAt": "2025-01-15T15:00:00Z",
        "disbursement": {
            "transactionId": "MPO111111111",
            "amount": 5000,
            "phone": "254712345678"
        }
    }
}
```

### PATCH /loans/:id/reject
Reject a loan (Admin/Finance only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
    "reason": "Incomplete documentation",
    "notes": "Please submit fee structure document"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Loan rejected",
    "data": {
        "id": "ln_001",
        "status": "rejected",
        "rejectedAt": "2025-01-15T14:00:00Z",
        "rejectionReason": "Incomplete documentation"
    }
}
```

### PATCH /loans/:id/disburse
Disburse a loan (Admin/Finance only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
    "method": "mpesa",
    "phone": "254712345678"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Loan disbursed successfully",
    "data": {
        "id": "ln_001",
        "status": "disbursed",
        "disbursedAt": "2025-01-15T15:00:00Z",
        "disbursement": {
            "transactionId": "MPO111111111",
            "amount": 5000
        }
    }
}
```

### GET /loans/pending
Get pending loan applications (Admin/Finance only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": "ln_002",
            "loanId": "LN/2025/002",
            "studentName": "Jane Smith",
            "amount": 3000,
            "purpose": "books",
            "submittedAt": "2025-01-16T09:00:00Z"
        }
    ],
    "count": 5
}
```

### GET /loans/statistics
Get loan statistics (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "data": {
        "totalLoans": 48,
        "activeLoans": 11,
        "repaidLoans": 35,
        "pendingLoans": 5,
        "overdueLoans": 2,
        "defaultRate": 4.0,
        "totalDisbursed": 285000,
        "totalInterestEarned": 24500,
        "totalRecovered": 260500,
        "averageLoanAmount": 5937,
        "byMonth": [
            {"month": "2025-01", "loans": 12, "amount": 60000},
            {"month": "2025-02", "loans": 15, "amount": 75000}
        ]
    }
}
```

### POST /loans/:id/calculate-penalty
Calculate penalty for overdue loan.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "data": {
        "daysOverdue": 10,
        "penaltyRate": 0.02,
        "penaltyAmount": 65,
        "totalDue": 3315
    }
}
```

---

## 4. Payments

### GET /payments
Get all payments.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | int | Page number |
| limit | int | Items per page |
| loanId | string | Filter by loan |
| status | string | pending, verified, failed |
| method | string | mpesa, bank, cash |
| dateFrom | date | Filter from date |
| dateTo | date | Filter to date |

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": "pmt_001",
            "paymentId": "PMT/2025/001",
            "loanId": "LN/2025/001",
            "studentName": "John Doe",
            "amount": 1000,
            "method": "mpesa",
            "transactionId": "MPO123456789",
            "phone": "254712345678",
            "status": "verified",
            "verifiedAt": "2025-02-15T14:00:00Z",
            "receiptUrl": "/receipts/PMT-2025-001.pdf",
            "createdAt": "2025-02-15T14:00:00Z"
        }
    ],
    "pagination": {...}
}
```

### GET /payments/:id
Get payment by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "pmt_001",
        "paymentId": "PMT/2025/001",
        "loanId": "LN/2025/001",
        "studentName": "John Doe",
        "amount": 1000,
        "method": "mpesa",
        "transactionId": "MPO123456789",
        "phone": "254712345678",
        "status": "verified",
        "receiptUrl": "/receipts/PMT-2025-001.pdf",
        "smsSent": true,
        "verifiedBy": "admin",
        "verifiedAt": "2025-02-15T14:00:00Z",
        "createdAt": "2025-02-15T14:00:00Z"
    }
}
```

### POST /payments
Record a payment.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
    "loanId": "LN/2025/001",
    "amount": 1000,
    "method": "mpesa",
    "transactionId": "MPO123456789",
    "phone": "254712345678",
    "paymentDate": "2025-02-15",
    "notes": "Partial payment"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Payment recorded successfully",
    "data": {
        "id": "pmt_001",
        "paymentId": "PMT/2025/001",
        "status": "pending_verification"
    }
}
```

### POST /payments/verify
Verify a payment (Admin/Finance only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
    "paymentId": "pmt_001",
    "verify": true,
    "notes": "Verified - transaction confirmed"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Payment verified successfully",
    "data": {
        "id": "pmt_001",
        "status": "verified",
        "verifiedAt": "2025-02-15T14:00:00Z",
        "loanBalance": 2250
    }
}
```

### GET /payments/loan/:loanId
Get all payments for a specific loan.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": "pmt_001",
            "paymentId": "PMT/2025/001",
            "amount": 1000,
            "method": "mpesa",
            "transactionId": "MPO123456789",
            "status": "verified",
            "createdAt": "2025-02-15T14:00:00Z"
        }
    ],
    "totalPaid": 2000,
    "remainingBalance": 3250
}
```

---

## 5. M-Pesa Integration

### POST /mpesa/stk-push
Initiate STK Push payment.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
    "phone": "254712345678",
    "amount": 1000,
    "loanId": "LN/2025/001",
    "transactionType": "CustomerPayBillOnline",
    "accountReference": "LN/2025/001",
    "description": "Loan payment for LN/2025/001"
}
```

**Response:**
```json
{
    "success": true,
    "message": "STK push initiated",
    "data": {
        "checkoutRequestId": "ws_123456789",
        "merchantRequestId": "mr_123456789",
        "responseCode": "0",
        "responseDescription": "Success. Request accepted for processing"
    }
}
```

### POST /mpesa/callback
M-Pesa callback URL (called by M-Pesa API).

**Request:**
```json
{
    "Body": {
        "stkCallback": {
            "merchantRequestId": "mr_123456789",
            "checkoutRequestId": "ws_123456789",
            "resultCode": 0,
            "resultDesc": "Success",
            "CallbackMetadata": {
                "Item": [
                    {"Name": "Amount", "Value": 1000},
                    {"Name": "MpesaReceiptNumber", "Value": "MPO123456789"},
                    {"Name": "PhoneNumber", "Value": "254712345678"},
                    {"Name": "TransactionDate", "Value": "20250215140000"},
                    {"Name": "AccountReference", "Value": "LN/2025/001"}
                ]
            }
        }
    }
}
```

**Response:**
```json
{
    "success": true
}
```

### GET /mpesa/status/:checkoutRequestId
Check STK Push status.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "data": {
        "checkoutRequestId": "ws_123456789",
        "status": "success",
        "receiptNumber": "MPO123456789",
        "amount": 1000,
        "phone": "254712345678"
    }
}
```

### POST /mpesa/b2c
Send money to customer (disbursement).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
    "phone": "254712345678",
    "amount": 5000,
    "loanId": "LN/2025/001",
    "description": "Loan disbursement for LN/2025/001"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "conversationId": "AG_20250115_123456789",
        "originatorConversationId": "OG_123456789",
        "responseCode": "0",
        "responseDescription": "Success"
    }
}
```

---

## 6. Reminders

### POST /reminders/send
Send payment reminder.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
    "loanId": "LN/2025/001",
    "type": "manual",  // manual, auto
    "message": "Your loan payment is due tomorrow"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Reminder sent successfully",
    "data": {
        "smsSent": true,
        "recipient": "254712345678"
    }
}
```

### POST /reminders/send-bulk
Send bulk reminders.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
    "type": "overdue",  // due_today, overdue, upcoming
    "loanIds": ["ln_001", "ln_002"]
}
```

**Response:**
```json
{
    "success": true,
    "message": "12 reminders sent successfully",
    "data": {
        "sent": 12,
        "failed": 0
    }
}
```

### POST /reminders/auto
Enable/disable auto reminders.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
    "enabled": true,
    "schedule": {
        "dueDate": 3,  // days before due date
        "onDueDate": true,
        "overdue": [1, 3, 7]  // days after overdue
    }
}
```

**Response:**
```json
{
    "success": true,
    "message": "Auto reminders enabled",
    "data": {
        "enabled": true,
        "schedule": {
            "dueDate": 3,
            "onDueDate": true,
            "overdue": [1, 3, 7]
        }
    }
}
```

---

## 7. Notifications

### GET /notifications
Get user notifications.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | int | Page number |
| limit | int | Items per page |
| unreadOnly | bool | Show only unread |

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": "notif_001",
            "type": "payment_received",
            "title": "Payment Received",
            "message": "Ksh 1,000 payment received for LN/2025/001",
            "isRead": false,
            "loanId": "ln_001",
            "createdAt": "2025-02-15T14:00:00Z"
        }
    ],
    "unreadCount": 3
}
```

### PUT /notifications/:id/read
Mark notification as read.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "message": "Notification marked as read"
}
```

### PUT /notifications/read-all
Mark all notifications as read.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "message": "All notifications marked as read"
}
```

---

## 8. Reports & Export

### GET /export/pdf
Export data as PDF.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | loans, payments, members |
| dateFrom | date | Start date |
| dateTo | date | End date |
| status | string | Filter by status |

**Response:**
Returns PDF file stream.

### GET /export/excel
Export data as Excel.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
Same as PDF.

**Response:**
Returns Excel file stream.

### GET /export/csv
Export data as CSV.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
Same as PDF.

**Response:**
Returns CSV file stream.

---

## 9. Audit Trail

### GET /audit/log
Get audit log (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | int | Page number |
| limit | int | Items per page |
| userId | string | Filter by user |
| action | string | Filter by action |
| entityType | string | Filter by entity type |
| entityId | string | Filter by entity |
| dateFrom | date | Start date |
| dateTo | date | End date |

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": "audit_001",
            "userId": "usr_admin",
            "userName": "Admin User",
            "action": "approve",
            "entityType": "loan",
            "entityId": "ln_001",
            "description": "Approved loan LN/2025/001",
            "ipAddress": "192.168.1.1",
            "userAgent": "Mozilla/5.0...",
            "createdAt": "2025-01-15T14:00:00Z"
        }
    ],
    "pagination": {...}
}
```

---

## 10. Analytics

### GET /analytics/loans
Get loan analytics.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| dateFrom | date | Start date |
| dateTo | date | End date |
| groupBy | string | day, week, month, year |

**Response:**
```json
{
    "success": true,
    "data": {
        "summary": {
            "totalLoans": 48,
            "totalDisbursed": 285000,
            "totalInterestEarned": 24500,
            "totalRecovered": 260500,
            "defaultRate": 4.0,
            "averageLoanAmount": 5937,
            "averageRepaymentPeriod": 2.5
        },
        "byStatus": [
            {"status": "active", "count": 11},
            {"status": "repaid", "count": 35},
            {"status": "pending", "count": 5}
        ],
        "byMonth": [
            {"month": "2025-01", "loans": 12, "amount": 60000, "repayments": 45000},
            {"month": "2025-02", "loans": 15, "amount": 75000, "repayments": 68000}
        ],
        "byPurpose": [
            {"purpose": "academic_fees", "count": 20, "amount": 120000},
            {"purpose": "books", "count": 15, "amount": 60000}
        ],
        "topBorrowers": [
            {"studentId": "JOO/2024/001", "name": "John Doe", "totalBorrowed": 15000}
        ],
        "riskAnalysis": {
            "highRisk": 2,
            "mediumRisk": 5,
            "lowRisk": 41
        }
    }
}
```

### GET /analytics/payments
Get payment analytics.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "data": {
        "totalPayments": 120,
        "totalAmount": 260500,
        "byMethod": [
            {"method": "mpesa", "count": 100, "amount": 220000},
            {"method": "bank", "count": 15, "amount": 35000},
            {"method": "cash", "count": 5, "amount": 5500}
        ],
        "byMonth": [...]
    }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
    "success": false,
    "message": "Error description",
    "error": {
        "code": "ERROR_CODE",
        "details": {}
    }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Invalid or missing token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 422 | Invalid input data |
| SERVER_ERROR | 500 | Internal server error |
| MPESA_ERROR | 400 | M-Pesa API error |

---

## Database Schema (Suggested)

### Tables

1. **users** - User accounts
2. **loans** - Loan applications
3. **payments** - Payment records
4. **guarantors** - Guarantor relationships
5. **mpesa_transactions** - M-Pesa transaction logs
6. **receipts** - Generated receipts
7. **notifications** - User notifications
8. **audit_logs** - System audit trail
9. **reminder_settings** - Auto reminder configuration

---

## Version History

- **v1.0.0** (2025-01-15) - Initial API documentation

---

For questions or support, contact: support@swa-joust.ac.ke

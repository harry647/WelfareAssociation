# Student Welfare Association (SWA) Website

A full-stack web application for the Student Welfare Association at JOOUST (Jaramogi Oginga Odinga University of Science and Technology).

## Project Overview

The SWA Website provides a comprehensive platform for managing student welfare programs with the following capabilities:

- **Multi-portal Access**: Student, Member, and Admin dashboards
- **Financial Management**: Contributions, loans, payments, savings, withdrawals
- **Communication**: SMS, WhatsApp, Email notifications and announcements
- **M-Pesa Integration**: Mobile money payment processing
- **Reports & Analytics**: Financial summaries, contributions, loans, members, events, bereavement
- **Document Management**: Upload, archive, and manage documents

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), ES6 Modules
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Security**: JWT authentication, bcryptjs, Helmet, CORS
- **Payments**: M-Pesa integration
- **Notifications**: SMS, WhatsApp, Email (Nodemailer)

## Project Structure

```
SWAwebsite/
├── index.html                      # Root redirect
├── welcome-page.html               # Welcome/Landing page
├── server.js                       # Express server entry point
├── package.json                    # Dependencies
├── render.yaml                     # Render.com deployment config
│
├── backend/                        # Server-side code
│   ├── config/
│   │   └── database.js             # PostgreSQL connection
│   ├── models/                     # Sequelize models
│   │   ├── User.js, Member.js, Officer.js
│   │   ├── Loan.js, Payment.js, Contribution.js
│   │   ├── Savings.js, Withdrawal.js
│   │   ├── Bereavement.js, Donation.js
│   │   └── ... (20+ models)
│   ├── routes/                     # API endpoints
│   │   ├── auth.js, members.js, loans.js
│   │   ├── payments.js, contributions.js
│   │   ├── mpesa.js, sms.js, whatsapp.js
│   │   └── ... (30+ route files)
│   ├── middleware/
│   │   └── auth.js                 # JWT authentication
│   ├── migrations/                 # Database migrations
│   ├── scripts/                    # Initialization scripts
│   └── utils/                      # Utilities (PDF receipts, etc.)
│
├── pages/                          # HTML pages
│   ├── auth/                       # Authentication pages
│   │   ├── login-page.html
│   │   ├── registration-form.html
│   │   ├── forgot-password.html
│   │   └── profile.html
│   │
│   ├── dashboard/                  # Dashboard portals
│   │   ├── admin/                  # Admin dashboard
│   │   │   ├── admin-dashboard.html
│   │   │   ├── members-savings.html
│   │   │   ├── active-members.html
│   │   │   ├── fines-collection.html
│   │   │   ├── bereavement-management.html
│   │   │   ├── analytics.html
│   │   │   ├── documentation.html
│   │   │   └── ... (20+ admin pages)
│   │   │
│   │   ├── member/                # Member dashboard
│   │   │   ├── member-portal.html
│   │   │   ├── member-contribution-history.html
│   │   │   ├── member-loans-history.html
│   │   │   └── member-payments-history.html
│   │   │
│   │   ├── shared/                # Shared dashboard components
│   │   └── components/            # Sidebar, header, footer
│   │
│   ├── public/                     # Public pages
│   │   ├── about-us.html, contact-information.html
│   │   ├── events.html, news.html, gallery.html
│   │   ├── donations.html, volunteer.html
│   │   └── faqs.html, policies.html, resources.html
│   │
│   ├── contributions/             # Contribution pages
│   ├── loans/                      # Loan management
│   ├── payments/                  # Payment processing
│   ├── breavement/                # Bereavement support
│   ├── reports/                    # Reports & analytics
│   └── shared/                     # Shared components
│
├── src/                            # Frontend source code
│   ├── config/
│   │   └── app-config.js          # API configuration
│   │
│   ├── services/                   # API service layer
│   │   ├── api-service.js         # HTTP client
│   │   ├── auth-service.js         # Authentication
│   │   ├── member-service.js      # Member management
│   │   ├── contribution-service.js
│   │   ├── loan-service.js
│   │   ├── payment-service.js
│   │   ├── announcement-service.js
│   │   └── ... (25+ services)
│   │
│   ├── scripts/                    # JavaScript modules
│   │   ├── application.js         # Main app logic
│   │   └── pages/                  # Page-specific scripts
│   │
│   ├── styles/                     # CSS stylesheets
│   │   ├── main.css
│   │   └── pages/                  # Page-specific styles
│   │
│   └── utils/                      # Utility functions
│
├── images/                         # Image assets
├── uploads/                        # User uploads
├── docs/                           # Documentation
├── receipts/                       # Payment receipts
├── tests/                          # Test files
│
├── .env                            # Environment variables
├── .env.example                    # Example environment config
└── .initialized                   # First-run flag
```

## Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Officer, Member, Student)
- Secure password hashing with bcryptjs

### Financial Management
- **Contributions**: Track member contributions with history
- **Loans**: Apply, approve, repay loans with guarantor system
- **Payments**: Process various payment types
- **Savings**: Member savings accounts and goals
- **Withdrawals**: Withdrawal requests and approvals
- **Fines**: Fine collection and management

### Communication
- SMS notifications
- WhatsApp messaging
- Email newsletters and announcements
- In-app notices

### Reports & Analytics
- Financial summaries
- Contribution reports
- Loan reports
- Member reports
- Event reports
- Bereavement reports
- Export to PDF/CSV

### Admin Dashboard
- Member management (CRUD)
- Officer management
- Document management
- Page content management
- Event management
- Settings configuration

## Getting Started

### Prerequisites
- Node.js (v14+)
- PostgreSQL database

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database and API credentials
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser:
```
http://localhost:3000
```

### Default Admin Login
- Email: `admin@swa.org`
- Password: `SWAAdmin2024!`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server |
| `npm run init` | Initialize application |
| `npm run init:db` | Initialize database |
| `npm run migrate` | Run database migrations |
| `npm run reset` | Reset and reinitialize |

## API Endpoints

The API is available at `http://localhost:3000/api`. Key endpoints:

- `POST /api/auth/login` - User authentication
- `GET /api/members` - List members
- `POST /api/contributions` - Create contribution
- `POST /api/loans` - Apply for loan
- `GET /api/reports/financial-summary` - Financial report

## Database Models

- **User** - System users
- **Member** - Association members
- **Officer** - Association officers
- **Loan** - Loan applications
- **Payment** - Payment records
- **Contribution** - Member contributions
- **Savings** - Savings accounts
- **Withdrawal** - Withdrawal requests
- **Bereavement** - Bereavement support
- **Donation** - Donations
- **Document** - Uploaded documents
- **Event** - Events
- **News** - News articles
- **Announcement** - Announcements
- **Notice** - Notices

## License

All rights reserved - Student Welfare Association | JOOUST

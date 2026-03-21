# Student Welfare Association (SWA) Website

A modern, scalable web application for the Student Welfare Association at JOOUST (Jaramogi Oginga Odinga University of Science and Technology) built with modern architecture patterns and ready for backend integration.

## Project Overview

The SWA Website provides a comprehensive platform for:
- Student welfare programs and services
- Member portals (Student, Member, Admin)
- Contribution and loan management
- Event management and news
- Contact and donation systems

## Project Structure

```
SWAwebsite/
├── index.html                      # Main homepage/welcome page
├── README.md                       # Project documentation
├── server.js                       # Node.js Express server
│
├── images/                         # Image assets
│   ├── logo.png
│   ├── Welfarelogo.webp
│   ├── team.jpg, team1.jpg, teams.jpg
│   ├── staff.PNG
│   ├── secretary.png
│   └── ... (various project images)
│
├── pages/                          # HTML page files
│   ├── auth/
│   │   ├── login-page.html         # User login
│   │   ├── forgot-password.html    # Password reset
│   │   └── registration-form.html  # New member registration
│   │
│   ├── dashboard/
│   │   ├── admin-dashboard.html    # Admin/Executive dashboard
│   │   ├── dashboard-layout.html   # Dashboard layout template
│   │   ├── member-portal.html      # Member portal
│   │   └── student-portal.html     # Student portal
│   │
│   ├── public/                     # Public pages
│   │   ├── about-us.html
│   │   ├── contact-information.html
│   │   ├── donations.html
│   │   ├── events.html
│   │   ├── faqs.html
│   │   ├── gallery.html
│   │   ├── news.html
│   │   ├── our-team.html
│   │   ├── policies.html
│   │   ├── portals.html
│   │   ├── resources.html
│   │   ├── terms&conditions.html
│   │   ├── volunteer.html
│   │   └── welcome-page.html
│   │
│   ├── contributions/
│   │   ├── history.html            # Contribution history
│   │   └── pay.html                # Make contribution
│   │
│   ├── loans/
│   │   ├── apply.html              # Apply for loan
│   │   ├── history.html            # Loan history
│   │   └── repay.html              # Repay loan
│   │
│   ├── payments/
│   │   ├── history.html            # Payment history
│   │   └── make-payment.html       # Make payment
│   │
│   ├── breavement/
│   │   ├── contribute.html         # Bereavement contribution
│   │   └── index.html              # Bereavement info
│   │
│   ├── reports/
│   │   ├── bereavement-report.html
│   │   ├── contributions-report.html
│   │   ├── index.html
│   │   ├── loans-report.html
│   │   └── index.html
│   │
│   └── shared/                     # Shared components
│       ├── header.html
│       └── footer.html
│
├── src/                            # Source code
│   ├── config/
│   │   └── app-config.js           # App configuration & API settings
│   │
│   ├── services/                   # API service layer
│   │   ├── index.js                # Service exports
│   │   ├── api-service.js          # Base HTTP client
│   │   ├── auth-service.js         # Authentication
│   │   ├── member-service.js       # Member management
│   │   ├── contribution-service.js # Contributions
│   │   ├── loan-service.js         # Loans
│   │   └── contact-service.js      # Contact forms
│   │
│   ├── scripts/                    # JavaScript modules
│   │   ├── application.js          # Main application logic
│   │   ├── index.js                # Homepage script
│   │   │
│   │   └── pages/                  # Page-specific scripts
│   │       ├── auth/
│   │       │   ├── login-page.js
│   │       │   ├── forgot-password.js
│   │       │   └── registration-form.js
│   │       ├── dashboard/
│   │       ├── public/
│   │       ├── contributions/
│   │       ├── loans/
│   │       ├── payments/
│   │       ├── breavement/
│   │       └── reports/
│   │
│   ├── styles/                     # CSS stylesheets
│   │   ├── main.css                # Main global styles
│   │   │
│   │   ├── original/               # Original preserved styles
│   │   │   ├── styles.css
│   │   │   ├── footer.css
│   │   │   ├── login.css
│   │   │   └── welcome.css
│   │   │
│   │   └── pages/                  # Page-specific styles
│   │       ├── auth/
│   │       │   ├── login-page.css
│   │       │   ├── forgot-password.css
│   │       │   └── registration-form.css
│   │       ├── dashboard/
│   │       ├── public/
│   │       └── ...
│   │
│   └── utils/                      # Utility functions
│       └── utility-functions.js    # Common helper functions
```

## Features

### User Portals
- **Student Portal**: For current students to access welfare services
- **Member Portal**: For registered members to manage contributions and loans
- **Admin Dashboard**: For administrators to manage the platform

### Core Services
- **Contributions**: Track and manage member contributions
- **Loans**: Apply for and repay welfare loans
- **Payments**: Make and track various payments
- **Bereavement Support**: Contribute to bereavement fund

### Backend-Ready Architecture
- **API Service Layer**: Full HTTP client with authentication, error handling, and interceptors
- **Service Modules**: Separate services for Auth, Members, Contributions, Loans, and Contact
- **Configuration**: Centralized configuration for API endpoints and app settings

### Modern JavaScript Patterns
- **ES6 Modules**: Proper import/export throughout the codebase
- **Classes**: Object-oriented structure with Services, Page handlers, etc.
- **Async/Await**: Modern async patterns for API calls
- **Error Handling**: Comprehensive error handling

## How to Run

### Prerequisites
- Node.js (recommended v14 or higher)
- npm or yarn

### Method 1: Using Node.js Server (Recommended)

1. Navigate to the project directory:
   ```bash
   cd SWAwebsite
   ```

2. Install dependencies (if needed):
   ```bash
   npm install express
   ```

3. Start the server:
   ```bash
   node server.js
   ```

4. Open your browser and visit:
   ```
   http://localhost:3000
   ```

### Method 2: Direct File Access

Simply open `index.html` directly in a modern web browser. Note that some features (like ES6 modules) may require a local server for optimal functionality.

## Development

### API Configuration

The API endpoint is configured in `src/config/app-config.js`:

```javascript
export const API_CONFIG = {
    baseURL: 'http://localhost:3000/api', // Update for production
    endpoints: {
        login: '/auth/login',
        members: '/members',
        contributions: '/contributions',
        loans: '/loans',
        // ...
    },
};
```

### Adding New Pages

1. Create the HTML file in `pages/` (or appropriate subdirectory)
2. Add corresponding CSS in `src/styles/pages/`
3. Add corresponding JavaScript in `src/scripts/pages/`
4. Link the CSS and JS in the HTML file

### Backend Integration

1. Update `API_CONFIG.baseURL` in `src/config/app-config.js` to point to your backend
2. Implement the backend API endpoints as specified in the service modules
3. The frontend will automatically use the real API when available

## Browser Support

- Modern browsers with ES6 module support (Chrome, Firefox, Edge, Safari)
- For older browsers, consider adding a bundler like Vite or Webpack

## Project Technologies

- **HTML5** - Semantic markup
- **CSS3** - Styling with CSS variables and Flexbox/Grid
- **JavaScript (ES6+)** - Modern JavaScript with modules
- **Node.js/Express** - Simple development server
- **Font Awesome** - Icon library

## License

All rights reserved - Student Welfare Association | JOOUST

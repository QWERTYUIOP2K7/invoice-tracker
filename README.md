# Invoice Tracking & Client Portal System

A full-stack invoice management platform enabling organizations to create, track, and manage invoices with real-time client communication and payment tracking.

## Overview

This system provides:
- **Finance Teams**: Invoice creation, status management, client oversight
- **Clients**: Secure invoice viewing, payment tracking, two-way communication
- **Admins**: System-wide visibility, user management, performance analytics

##  Key Features

### Invoice Management
- Create and manage invoices with automatic numbering
- 7-stage workflow: Draft → Generated → Approved → Sent → Paid/Pending/Overdue
- Track pending reasons and payment status
- Persistent PDF storage via Cloudinary
- Payment receipt upload and tracking

### Client Portal
- Secure role-based access (Admin, Finance, Client)
- View assigned invoices with filtering & search
- Download invoice PDFs and receipts
- Track outstanding amounts and payment history
- Real-time communication with finance teams

### Finance Dashboard
- Work queue organized by invoice status
- Client management and assignment
- Invoice filtering and export to Excel
- Communication center for client interactions
- Performance metrics and KPIs

### Admin Dashboard
- System-wide invoice overview
- Finance user assignment and management
- Top clients by outstanding amount (expandable)
- Recent activity tracking
- Finance team performance metrics

### Communication & Collaboration
- Two-way remarks/messaging system between clients and finance
- Organized by invoice
- User role badges (Admin, Finance, Client)
- Timestamps and sender information

### Data & Compliance
- Complete audit trail of all invoice changes
- User activity tracking
- Change history with old/new values
- Invoice status workflow validation

##  Tech Stack

### Backend
- **Runtime**: Node.js v22
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt
- **File Storage**: Cloudinary (persistent, CDN-backed)
- **Excel Export**: ExcelJS
- **Email**: Nodemailer

### Frontend
- **Framework**: React 18 with Vite
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS v3
- **Icons**: React Icons
- **UI Components**: Custom Tailwind components

### Deployment
- **Backend**: Railway (Node.js + MongoDB Atlas)
- **Frontend**: Cloudflare Pages
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary

##  Prerequisites

- Node.js v22+
- MongoDB Atlas account
- Cloudinary account (free tier: 25GB storage)
- npm or yarn

##  Quick Start

### Backend Setup

```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/invoicetracker
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=8h
NODE_ENV=development
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@invoicetracker.com
EOF

npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env

npm run dev
```

Visit `http://localhost:5173`

##  User Roles & Permissions

### Admin
- Create and manage finance users
- View all system data
- Monitor performance metrics
- Manage user access

### Finance Team
- Create and manage invoices
- Manage assigned clients
- Update invoice status
- Upload invoice PDFs and receipts
- Communicate with clients
- View assigned client performance

### Client
- View own invoices only
- Download invoice PDFs and receipts
- Track payment status
- Communicate with finance team
- View outstanding amounts

##  Invoice Status Workflow
Draft → Generated → Approved → Sent ─┬→ Paid
├→ Pending (with reason) ↔ Sent/Approved
└→ Overdue ──→ Paid/Pending

### Pending Reasons
- Client approval pending
- PO not received
- Payment processing
- Document verification pending
- Budget issue
- Other

##  Project Structure
invoice-tracker/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, env, permissions
│   │   ├── controllers/     # Business logic
│   │   ├── models/          # MongoDB schemas
│   │   ├── middleware/      # Auth, RBAC, uploads
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Utilities & helpers
│   │   └── app.js
│   ├── server.js
│   └── package.json
└── frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── services/        # API calls
│   ├── store/           # Redux store
│   ├── utils/           # Helpers
│   ├── App.jsx
│   └── main.jsx
└── package.json

##  API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register (client/finance only)
- `GET /api/auth/me` - Get current user

### Invoices
- `GET /api/invoices` - List invoices (scoped by role)
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get single invoice
- `PUT /api/invoices/:id` - Update invoice
- `PUT /api/invoices/:id/status` - Update status
- `POST /api/invoices/:id/upload-pdf` - Upload PDF
- `GET /api/invoices/:id/download-pdf` - Download PDF
- `POST /api/invoices/:id/upload-receipt` - Upload receipt
- `DELETE /api/invoices/:id/receipt` - Delete receipt
- `GET /api/invoices/:id/history` - Get change history
- `GET /api/invoices/export/excel` - Export to Excel

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Deactivate client

### Dashboards
- `GET /api/dashboard/admin` - Admin KPIs
- `GET /api/dashboard/admin/recent-activity` - Recent changes
- `GET /api/dashboard/admin/top-clients` - Top clients
- `GET /api/dashboard/finance` - Finance KPIs
- `GET /api/dashboard/finance/work-queue` - Work queue
- `GET /api/dashboard/client` - Client KPIs

### Communication
- `GET /api/remarks/:invoiceId` - Get remarks
- `POST /api/remarks/:invoiceId` - Add remark

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `DELETE /api/users/:id` - Deactivate user
- `PUT /api/users/:id/reset-password` - Reset password

##  Deployment

### Deploy Backend to Railway
1. Push code to GitHub
2. Connect Railway to GitHub repo
3. Set root directory to `backend`
4. Add environment variables
5. Deploy

### Deploy Frontend to Cloudflare Pages
1. Push code to GitHub
2. Import project in Cloudflare Pages
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add `VITE_API_URL` environment variable
6. Deploy

##  Performance Optimizations

- **Database Indexes**: Optimized queries for clientId, status, dates
- **Pagination**: Implemented for large datasets
- **Cloudinary CDN**: Fast PDF delivery globally
- **Error Boundaries**: React error handling
- **Form Validation**: Client & server-side validation

##  Security Features

- JWT authentication with 8-hour expiration
- Bcrypt password hashing
- Role-based access control (RBAC)
- Request validation and sanitization
- CORS configuration
- Email validation (genuine emails only)
- Deactivation system (soft deletes)

##  License

MIT License - Free to use for personal and commercial projects

##  Author

Built as a full-stack invoice management solution.

##  Support

For issues or questions, refer to the documentation or create an issue on GitHub.

---

**Live URLs:**
- Frontend: https://e079db50.invoice-tracker-1ha.pages.dev
- Backend API: https://invoice-tracker-production-4990.up.railway.app/

**Last Updated:** July 2026
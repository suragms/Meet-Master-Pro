# MeatMaster Pro

A comprehensive business management solution designed specifically for meat and food wholesale businesses. This modern web application provides complete inventory management, customer ledger tracking, invoicing, expense management, and sales analytics.

## 📋 Project Overview

MeatMaster Pro is a full-stack web application built to streamline operations for meat wholesale businesses. It offers an intuitive interface for managing inventory, tracking customer balances, creating professional invoices, recording expenses, and generating comprehensive reports—all in one place.

### Key Features

- **📦 Product & Inventory Management** - Track meat products with multiple unit types (Carton, Kg, Piece), stock levels, and low-stock alerts
- **👥 Customer Management** - Maintain detailed customer records with balance tracking and transaction history
- **📊 Ledger & Billing System** - Automatic balance calculation with credit/debit transaction tracking
- **🧾 Professional Invoicing** - Create invoices, track payments, generate PDFs, and print receipts
- **💰 Expense Tracking** - Record and categorize business expenses with date filtering
- **📈 Sales Analytics** - Comprehensive dashboards with revenue tracking and insights
- **👤 Multi-User Support** - Role-based access control (Admin and Staff permissions)
- **🔐 Secure Authentication** - User login and session management
- **💾 Local Data Storage** - All data stored locally in browser's localStorage

---

## 🏗️ Project Structure

```
meat-master-pro/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx       # Main application layout with sidebar
│   │   ├── ProtectedRoute.tsx  # Route authentication guard
│   │   └── ui/              # shadcn/ui component library (60+ components)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── table.tsx
│   │       └── ... (additional UI components)
│   ├── pages/               # Application pages/screens
│   │   ├── Welcome.tsx       # Landing page
│   │   ├── Login.tsx        # User authentication
│   │   ├── Signup.tsx       # User registration
│   │   ├── Dashboard.tsx    # Main dashboard with statistics
│   │   ├── Products.tsx     # Inventory management
│   │   ├── Customers.tsx    # Customer & ledger management
│   │   ├── Invoices.tsx     # Invoice creation & management
│   │   ├── Expenses.tsx     # Expense tracking
│   │   ├── Sales.tsx        # Sales overview
│   │   ├── Reports.tsx     # Business reports
│   │   ├── Staff.tsx       # Staff management (admin only)
│   │   └── Profile.tsx     # User profile settings
│   ├── lib/
│   │   ├── database.ts      # LocalStorage-based database layer
│   │   └── utils.ts         # Utility functions
│   ├── hooks/               # Custom React hooks
│   ├── App.tsx              # Main app component with routing
│   ├── index.css            # Global styles
│   └── main.tsx             # Application entry point
├── public/                  # Static assets
├── package.json             # Dependencies and scripts
├── tailwind.config.ts      # Tailwind CSS configuration
├── vite.config.ts          # Vite build configuration
└── tsconfig.json           # TypeScript configuration
```

### Architecture

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: React Router DOM with protected routes
- **State Management**: Local component state + React Query for caching
- **Data Persistence**: Browser localStorage with custom database layer
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens

---

## 🚀 Installation Process

### Prerequisites

- Node.js (v16 or higher) - [Download](https://nodejs.org/)
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Step-by-Step Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/suragms/Meet-Master-Pro.git
   cd meat-master-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5173` (or the port shown in terminal)
   - The application will automatically reload when you make changes

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

### First-Time Setup

1. Launch the application in your browser
2. Click "Get Started" on the welcome page
3. Create an admin account:
   - Enter your name and email
   - Set a secure password
   - You'll be automatically logged in as the first user
4. Start using the application:
   - Add your first products in the Products section
   - Create customer records in the Customers section
   - Generate invoices in the Invoices section

---

## 🛠️ Technical Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | ^18.3.1 | UI framework |
| **TypeScript** | ^5.8.3 | Type safety |
| **Vite** | ^5.4.19 | Build tool & dev server |
| **React Router DOM** | ^6.30.1 | Client-side routing |

### UI Libraries

- **shadcn/ui** - Complete component library (accordion, alert, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input-otp, input, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle-group, toggle, tooltip)
- **Radix UI** - Accessible, unstyled component primitives
- **Lucide React** - Modern icon library
- **Tailwind CSS** - Utility-first CSS framework
- **clsx** & **tailwind-merge** - Conditional styling utilities

### Data Management

- **TanStack React Query** ^5.83.0 - Data fetching and caching
- **React Hook Form** ^7.61.1 - Form state management
- **Zod** ^3.25.76 - Schema validation
- **@hookform/resolvers** - Form validation integration

### Additional Libraries

- **date-fns** ^3.6.0 - Date manipulation utilities
- **react-day-picker** ^8.10.1 - Date picker component
- **recharts** ^2.15.4 - Chart and visualization library
- **sonner** ^1.7.4 - Toast notifications
- **html2pdf.js** ^0.12.1 - PDF generation
- **next-themes** ^0.3.0 - Theme management
- **vaul** ^0.9.9 - Drawer component library

### Development Tools

- **ESLint** ^9.32.0 - Code linting
- **TypeScript ESLint** ^8.38.0 - TypeScript linting
- **Autoprefixer** ^10.4.21 - CSS vendor prefixing
- **PostCSS** ^8.5.6 - CSS processing

---

## 📚 Features & Knowledge

### 1. Inventory Management
- Add products with multiple unit types (Carton, Kg, Piece)
- Automatic stock tracking and low-stock alerts
- Real-time inventory updates when creating invoices
- Product search and filtering capabilities

### 2. Customer Management
- Complete customer database with contact information
- Automated balance tracking (positive = customer owes, negative = overpaid)
- Customer ledger with credit/debit transaction history
- Billing history and invoice tracking per customer

### 3. Ledger System
- **Credit entries**: Sales and invoices (increases balance)
- **Debit entries**: Payments received (decreases balance)
- Automatic balance calculation on every transaction
- Transaction history with date, amount, and description
- Real-time balance updates

### 4. Invoicing System
- Create professional invoices with custom company branding
- Support for both customer-linked and generic invoices
- Multi-item invoices with quantity and price tracking
- Automatic stock deduction on invoice creation
- Payment recording with multiple payment methods (cash, cheque, online)
- PDF generation and printing capabilities
- Invoice status tracking (draft, sent, paid)

### 5. Expense Tracking
- Categorize expenses by type
- Date-based filtering and reporting
- Today and monthly expense summaries
- Expense notes and receipt attachment support

### 6. Dashboard & Analytics
- Key business metrics at a glance:
  - Total products in inventory
  - Total customers/staff
  - Total invoices created
  - Total revenue generated
- Stock alerts for low and out-of-stock items
- Quick action buttons for common tasks

### 7. Reports & Sales
- Comprehensive business reports
- Revenue tracking
- Sales analytics and trends
- Date-range filtering for reports

### 8. User Management
- **Admin users**: Full access to all features including staff management
- **Staff users**: Standard access without staff management
- Secure authentication system
- Session persistence across browser sessions
- User profile management

### 9. Data Persistence
- All data stored locally in browser localStorage
- No backend required - works completely offline
- Automatic data persistence
- Data backup and export functionality

### 10. Responsive Design
- Mobile-friendly interface
- Optimized for desktop, tablet, and mobile devices
- Adaptive layouts for different screen sizes

---

## 🎨 Styling & Design

The application uses a modern, professional design system:

- **Color Scheme**: Custom gradient-based primary colors with semantic color tokens
- **Typography**: Clear hierarchy with multiple font weights and sizes
- **Spacing**: Consistent spacing system using Tailwind's scale
- **Components**: Accessible, keyboard-navigable components
- **Animations**: Smooth transitions and hover effects
- **Print Styles**: Optimized invoice layouts for printing

---

## 🔒 Security Features

- Protected routes requiring authentication
- Role-based access control (Admin vs Staff)
- Session management with automatic logout
- Input validation and sanitization
- Secure password storage (ready for hashing in production)

---

## 📖 Usage Guide

### Creating Your First Invoice

1. Navigate to **Products** and add inventory items
2. Go to **Customers** and create customer records
3. Open **Invoices** and click "Create Invoice"
4. Select a customer (optional) or create a generic invoice
5. Add products with quantities
6. Review and create the invoice
7. Record payment when customer pays
8. Print or download the invoice as PDF

### Managing Customer Balances

1. Go to **Customers** section
2. Click "Transaction" on any customer
3. Add a **Credit** entry for sales (customer owes you)
4. Add a **Debit** entry for payments (customer pays you)
5. View complete ledger history by clicking "Ledger"

### Tracking Expenses

1. Navigate to **Expenses**
2. Click "Add Expense"
3. Select category, enter amount and description
4. Add date and optional notes
5. View filtered reports by date range

---


### Manual Deployment

Build the application for production:
```bash
npm run build
```

The built files will be in the `dist` folder, ready to be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Any web server

### Custom Domain Setup

1. Navigate to Project > Settings > Domains
2. Click "Connect Domain"
3. Follow the DNS configuration instructions


---

## 📝 Notes

- This application uses browser localStorage for data persistence
- Data is stored locally in the browser and not synced to any server
- Clear browser data will delete all stored information
- For production use with multiple users, consider migrating to a backend database
- Passwords are stored in plain text in localStorage (secure hashing recommended for production)

---

## 🤝 Contributing

This project was created using [Lovable](https://lovable.dev). Contributions are welcome!

---

## 📄 License

This project is private and proprietary.

---

## 📞 Support

---

## 📬 Contact Me

Feel free to reach out for collaboration, project inquiries, or just to connect!

- **📧 Email**: [officialsurag@gmail.com](mailto:officialsurag@gmail.com)
- **💼 LinkedIn**: [linkedin.com/in/suragsunil](https://linkedin.com/in/suragsunil)
- **💻 GitHub**: [github.com/suragms](https://github.com/suragms)
- **📸 Instagram**: [instagram.com/surag_sunil](https://instagram.com/surag_sunil)
- **🔗 Linktree**: [linktr.ee/suragdevstudio](https://linktr.ee/suragdevstudio)
# BiteSync POS - Tech Stack & Project Information

**Project Name:** BiteSync POS  
**Version:** 1.0  
**Type:** Web-Based Point of Sale (POS) System  
**Architecture:** JAMstack (Frontend-as-Code + Backend-as-a-Service)  
**Status:** Production-Ready  
**Last Updated:** December 18, 2025

---

## 📋 Project Overview

BiteSync POS is a lightweight, web-based Point of Sale system designed for small restaurants (5-20 seats). The application provides order entry, automatic billing calculations, and receipt printing with a two-role system (Admin and Cashier). Built entirely on free-tier services, it requires zero monthly operational costs.

### Key Features

- ✅ Two-role system (Admin & Cashier)
- ✅ Real-time menu synchronization
- ✅ Automatic calculations (subtotal, service charge, total)
- ✅ Browser-based receipt printing
- ✅ Zero-cost operation (Supabase + Vercel free tiers)
- ✅ Authentication & role-based access control
- ✅ QZ Tray integration for thermal printer support
- ✅ SSL certificate setup for secure communications

---

## 🛠️ Frontend Tech Stack

### Core Framework & Build Tools

| Technology                  | Version | Purpose                              |
| --------------------------- | ------- | ------------------------------------ |
| **React**                   | 19.1.1  | Frontend framework for UI components |
| **Vite**                    | 7.1.7   | Next-generation frontend build tool  |
| **JavaScript (ES Modules)** | -       | Language with native module support  |
| **Node.js**                 | 18+     | Runtime environment                  |

### Styling & UI

| Technology       | Version | Purpose                            |
| ---------------- | ------- | ---------------------------------- |
| **Tailwind CSS** | 3.4.18  | Utility-first CSS framework        |
| **PostCSS**      | 8.5.6   | CSS transformation tool            |
| **Autoprefixer** | 10.4.21 | Adds vendor prefixes to CSS        |
| **Lucide React** | 0.553.0 | Icon library with React components |

### Routing & State Management

| Technology            | Version | Purpose                            |
| --------------------- | ------- | ---------------------------------- |
| **React Router DOM**  | 6.30.1  | Client-side routing & navigation   |
| **React Context API** | 19.1.1  | Global state management (built-in) |

### Notifications & User Feedback

| Technology          | Version | Purpose                   |
| ------------------- | ------- | ------------------------- |
| **React Hot Toast** | 2.6.0   | Toast notification system |

### Development & Quality Tools

| Technology               | Version | Purpose                                   |
| ------------------------ | ------- | ----------------------------------------- |
| **ESLint**               | 9.36.0  | JavaScript linting & code quality         |
| **@vitejs/plugin-react** | 5.0.4   | React Fast Refresh for Vite               |
| **@types/react**         | 19.1.16 | TypeScript type definitions for React     |
| **@types/react-dom**     | 19.1.9  | TypeScript type definitions for React DOM |

---

## 🗄️ Backend & Services

### Backend-as-a-Service (BaaS)

| Service        | Purpose                                                           | Plan                |
| -------------- | ----------------------------------------------------------------- | ------------------- |
| **Supabase**   | PostgreSQL database, real-time subscriptions, authentication, API | Free Tier           |
| **PostgreSQL** | Relational database for menu, orders, users                       | Managed by Supabase |

### Authentication & Authorization

- **Supabase Auth** - Email/password authentication with role-based access control
- Role system: Admin (menu management), Cashier (order entry)

### API & Real-Time Communication

- **Supabase PostgREST API** - Auto-generated REST API from database schema
- **Supabase Realtime** - Real-time database subscriptions for menu updates

---

## 🖨️ Printing & Hardware Integration

### Printing Technologies

| Technology           | Version | Purpose                                       |
| -------------------- | ------- | --------------------------------------------- |
| **QZ Tray**          | 2.2.5   | Bridge between web browser and local printers |
| **Window Print API** | Native  | Browser-based printing for receipts           |

### Certificate & Security

- **SSL Certificates** - For secure QZ Tray communication with Namecheap domain
- **Digital Signing** - Code signing for QZ Tray integration

### Supported Printers

- Thermal printers (58mm, 80mm)
- Standard paper printers
- Network printers with local access

---

## 🚀 Deployment & Hosting

| Service    | Purpose                        | Plan                      |
| ---------- | ------------------------------ | ------------------------- |
| **Vercel** | Frontend hosting & deployment  | Free Tier                 |
| **GitHub** | Version control & CI/CD source | Public/Private Repository |

### Build & Deployment Pipeline

- Vite build process (`npm run build`)
- Automatic deployments on git push to Vercel
- Environment variables managed via `.env.local`

---

## 📦 Development Dependencies

```json
{
  "@eslint/js": "^9.36.0",
  "@types/react": "^19.1.16",
  "@types/react-dom": "^19.1.9",
  "@vitejs/plugin-react": "^5.0.4",
  "autoprefixer": "^10.4.21",
  "eslint": "^9.36.0",
  "eslint-plugin-react-hooks": "^5.2.0",
  "eslint-plugin-react-refresh": "^0.4.22",
  "globals": "^16.4.0",
  "postcss": "^8.5.6",
  "tailwindcss": "^3.4.18",
  "vite": "^7.1.7"
}
```

---

## 📚 Project Structure

```
codebell_pos/
├── src/
│   ├── components/          # React components (UI elements)
│   ├── contexts/            # React context providers (global state)
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Page components (full screens)
│   ├── routes/              # Route configuration & protection
│   ├── services/            # External services (Supabase, API calls)
│   ├── utils/               # Utility functions
│   ├── assets/              # Images, fonts, static assets
│   ├── App.jsx              # Root component
│   ├── main.jsx             # Entry point
│   ├── index.css            # Global styles
│   ├── App.css              # App-specific styles
│   └── print.css            # Receipt printing styles
├── supabase/
│   ├── migrations/          # Database migrations
│   └── complete_database_setup.sql
├── docs/
│   ├── stories/             # Feature documentation & implementation guides
│   ├── prd.md               # Product requirements document
│   ├── brief.md             # Project brief
│   └── ... (20+ documentation files)
├── scripts/
│   ├── seed.js              # Database seeding script
│   ├── setup-override-crt.sh # Certificate setup script
│   └── verify-qz-setup.js   # QZ Tray verification
├── public/
│   └── certs/               # Public certificates
├── certs/                   # Local certificates & signing credentials
├── vite.config.js           # Vite configuration
├── package.json             # Dependencies & scripts
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── eslint.config.js         # ESLint configuration
└── index.html               # HTML entry point
```

---

## 🔧 Development Workflow

### Local Development

```bash
npm install              # Install dependencies
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Check code quality
npm run seed             # Seed database with sample data
```

### Database Setup

- SQL migrations in `supabase/migrations/`
- Execute database setup: `supabase/complete_database_setup.sql`
- Automatic schema from Supabase dashboard

### Printing Setup

```bash
# Windows PowerShell
scripts/setup-override-crt.ps1

# Linux/Mac
scripts/setup-override-crt.sh

# Verify setup
npm run verify           # runs verify-qz-setup.js
```

---

## 🏗️ Architecture Patterns

### Frontend Architecture

- **Component-Based**: Modular, reusable React components
- **Context API**: Global state management for auth & app state
- **Custom Hooks**: Reusable logic extraction (useAuth, usePrinter, etc.)
- **Route Protection**: Role-based route guards (Admin only, Cashier only)

### Data Flow

1. **Authentication**: Supabase Auth handles login/registration
2. **Data Fetching**: Supabase API queries from services layer
3. **Real-time Updates**: Supabase subscriptions for menu changes
4. **State Management**: Context API for client-side state
5. **Rendering**: React components receive props from context/state

### Security Measures

- Environment variables for API keys (never committed)
- Role-based access control (RBAC) via Supabase auth
- Row-level security (RLS) policies on database tables
- SSL certificates for QZ Tray integration
- Code signing for desktop bridge security

---

## 📊 Database Schema

### Core Tables

- **Users** - Authentication & profile management
- **Roles** - Admin, Cashier role definitions
- **MenuItems** - Restaurant menu (name, price, category, availability)
- **Orders** - Customer orders with items and totals
- **OrderItems** - Individual items within orders
- **PrinterConfig** - Printer settings & configurations

### Relationships

- Users ↔ Roles (many-to-one)
- Orders ↔ OrderItems (one-to-many)
- OrderItems ↔ MenuItems (many-to-one)
- Users ↔ PrinterConfig (one-to-many)

---

## 🔐 Security & Certificates

### SSL/TLS Setup

- QZ Tray requires secure HTTPS connections
- Self-signed certificates in `/certs/` for development
- Certificate authority setup for signing requests
- Production certificates via certificate authority

### Environment Variables Required

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_SIGN_URL=http://localhost:3001 (development)
```

---

## 📈 Performance & Optimization

### Frontend Optimization

- **Code Splitting**: Vite automatic chunk splitting
- **Lazy Loading**: Route-based code splitting with React Router
- **CSS Optimization**: Tailwind CSS purging unused styles
- **Asset Optimization**: Vite handles image optimization

### Database Performance

- Supabase automatic indexing on frequently queried columns
- Real-time subscriptions for efficient updates
- Query optimization via PostgREST API

---

## 🧪 Testing & Quality Assurance

### Current Testing Setup

- **ESLint**: Code quality & style enforcement
- **React Hooks**: Custom hooks linting plugin

### Future Testing Opportunities

- Unit tests (Jest + React Testing Library)
- Integration tests for API interactions
- E2E tests for user workflows

---

## 📚 Documentation

The project includes comprehensive documentation:

- **Architecture diagrams** - System design visualization
- **Setup guides** - QZ Tray, SSL, Printer configuration
- **Implementation guides** - Feature-by-feature documentation
- **Database setup** - SQL migrations and schema documentation
- **Feature stories** - User stories for each development sprint

Documentation located in `/docs/` directory with 30+ markdown files covering all aspects.

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Database migrations executed
- [ ] Certificates generated & configured
- [ ] Code linting passes (`npm run lint`)
- [ ] Production build verified (`npm run build`)

### Deployment

- [ ] Push to GitHub main/master branch
- [ ] Vercel automatically deploys
- [ ] Supabase project configured with correct auth redirects

### Post-Deployment

- [ ] Test login flow
- [ ] Verify menu loading
- [ ] Test order creation
- [ ] Check receipt printing functionality

---

## 💰 Cost Analysis

### Current Operating Costs: $0/month

| Service   | Plan         | Cost         |
| --------- | ------------ | ------------ |
| Supabase  | Free Tier    | $0           |
| Vercel    | Hobby (Free) | $0           |
| Domain    | Optional     | $0-15/year   |
| **Total** |              | **$0/month** |

### Free Tier Limits

- **Supabase**: 500MB storage, unlimited API calls, 50MB bandwidth
- **Vercel**: Unlimited deployments, 100GB bandwidth/month

### Scaling Costs (if needed)

- Supabase Pro: $25/month (after free tier exceeded)
- Vercel Pro: $20/month (optional for higher limits)

---

## 🛣️ Development Roadmap

### Current Version (1.0)

✅ Authentication & role management  
✅ Menu management (Admin)  
✅ Order entry (Cashier)  
✅ Receipt printing  
✅ Real-time menu updates  
✅ Thermal & standard printer support

### Future Enhancements

- Inventory tracking
- Order history & analytics
- Multiple user accounts per restaurant
- Customizable receipt templates
- Mobile app (React Native)
- Multi-language support
- Reporting dashboard

---

## 📞 Support & Contributions

**Repository:** codebell_pos_v2 (GitHub)  
**Owner:** MHN-Sathsara  
**Current Branch:** master  
**License:** [To be specified]

### Key Team Roles

- **Developer:** Sathsara Hewage
- **Project Manager:** Sathsara Hewage
- **Architecture:** Sathsara Hewage

---

## 📝 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [QZ Tray Documentation](https://www.qz.io/)
- [Vercel Documentation](https://vercel.com/docs)

---

## 🎯 Key Metrics

| Metric               | Value                         |
| -------------------- | ----------------------------- |
| **Development Time** | ~40 hours (solo developer)    |
| **Languages**        | JavaScript/JSX, SQL           |
| **Dependencies**     | 10 production, 17 development |
| **Database Tables**  | 6 core tables                 |
| **API Endpoints**    | Auto-generated by PostgREST   |
| **Page Count**       | 5+ main pages                 |
| **Component Count**  | 20+ reusable components       |
| **Lines of Code**    | ~3,000+ lines (src folder)    |

---

**Last Updated:** December 18, 2025  
**Status:** Production Ready  
**Version:** 1.0

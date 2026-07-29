# EcoSphere - ESG Management & Sustainability Platform

![EcoSphere Banner](frontend/src/assets/hero.png)

**EcoSphere** is a modern, enterprise-grade Environmental, Social, and Governance (ESG) management platform. It enables organizations to monitor carbon footprints, manage CSR initiatives, enforce corporate ethics standards, run gamified eco-challenges, and maintain strict master data controls.

---

## 🌟 Key Features

- **Supabase Authentication**: Integrated authentication with Supabase Auth (Email & Password) linked to real Supabase Auth UUIDs.
- **Role-Based Access Control (RBAC)**:
  - 👑 **Admin**: Full access to Master Data (Departments, Categories), User Role promotion/demotion, and system settings.
  - 🌿 **ESG Manager**: Access to ESG metric tracking, CSR activity logging, and reporting tools.
  - 👤 **Employee**: Default role for new signups. Access to Eco-challenges, gamification leaderboards, and personal impact logs.
  - 🚀 **Auto-Admin Bootstrapper**: The first account registered on a fresh deployment is automatically granted the `Admin` role.
- **Master Data CRUD (Admin Only)**:
  - **Departments**: Code, Name, Department Head, Parent Department hierarchy, Employee Count, and Active/Inactive status.
  - **Categories**: Category Name, Type (`CSR Activity` vs `Challenge`), and Active/Inactive status.
- **Modern Glassmorphism UI**: Built with React (Vite) + Tailwind CSS v4, dynamic dark mode, responsive sidebar layout, stat cards, and status badges.
- **Core ESG Shell Modules**:
  - **Environmental (E)**: Scope 1, 2 & 3 emissions, energy audits, water recycling.
  - **Social (S)**: CSR community outreach, diversity indices, zero-harm workplace safety.
  - **Governance (G)**: Anti-corruption ethics audits, data privacy, compliance disclosures.
  - **Gamification**: Eco-warrior badges, departmental leaderboards, green habit challenges.
  - **Reports & Filings**: GRI, SASB, and TCFD standard export templates.

---

## 🏗️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React (Vite), Tailwind CSS v4, Lucide Icons, React Router DOM |
| **Backend** | Python Flask, Flask-SQLAlchemy, Flask-CORS, PyJWT, Requests |
| **Database** | Supabase PostgreSQL (`postgresql://...:5432/postgres`) |
| **Authentication** | Supabase Auth (JWT Bearer Token verification) |

---

## 📂 Project Structure

```
EcoSphere/
├── backend/
│   ├── app.py                     # Flask application entry point & CORS configuration
│   ├── auth.py                    # Supabase JWT token verification & RBAC decorators
│   ├── config.py                  # Environment configuration & DB connection loader
│   ├── database.py                # SQLAlchemy DB instance
│   ├── models.py                  # Database models (UserProfile, Department, Category)
│   ├── init_db.py                 # Supabase Postgres schema initialization script
│   ├── cleanup_suspect_profiles.py # Database cleanup utility script
│   ├── requirements.txt           # Python dependencies
│   └── routes/
│       ├── auth_routes.py         # /api/auth/me (User profile sync)
│       ├── user_routes.py         # /api/users (Admin user & role management)
│       ├── department_routes.py   # /api/departments (Department Master Data CRUD)
│       └── category_routes.py     # /api/categories (Category Master Data CRUD)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/            # Badge, Modal, ProtectedRoute
│   │   │   └── layout/            # Layout, Navbar, Sidebar
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Supabase Auth session & profile management
│   │   ├── lib/
│   │   │   └── supabase.js        # Supabase JS client initializer
│   │   ├── pages/                 # Login, Register, Dashboard, Departments, Categories, UserManagement, Placeholders
│   │   ├── App.jsx                # React Router setup & role protected routes
│   │   └── index.css              # Custom Tailwind CSS & glassmorphism utilities
│   ├── package.json
│   └── vite.config.js
│
├── README.md                      # Project documentation
└── .gitignore                     # Excludes credentials, build artifacts & virtual environments
```

---

## ⚙️ Environment Variables Setup

### 1. Backend Environment (`backend/.env`)
Create a `.env` file inside the `backend/` directory:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.mftiryuajwfsnxdtmdrx.supabase.co:5432/postgres
SUPABASE_URL=https://[YOUR-SUPABASE-PROJECT].supabase.co
SUPABASE_PUBLISHABLE_KEY=[YOUR-SUPABASE-PUBLISHABLE-KEY]
SUPABASE_SECRET_KEY=[YOUR-SUPABASE-SECRET-KEY]
SECRET_KEY=ecosphere-super-secret-key-2026
```

### 2. Frontend Environment (`frontend/.env`)
Create a `.env` file inside the `frontend/` directory:

```env
VITE_SUPABASE_URL=https://[YOUR-SUPABASE-PROJECT].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-SUPABASE-PUBLISHABLE-KEY]
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🚀 Quick Start & Local Execution

### Step 1: Clone the Repository
```bash
git clone https://github.com/Hari-preetham-B/EcoSphere.git
cd EcoSphere
```

### Step 2: Backend Setup
```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run database table initialization on Supabase
python init_db.py

# Start Flask dev server
python app.py
```
*Backend API will run at `http://localhost:5000`*

### Step 3: Frontend Setup
```bash
# In a new terminal window
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```
*Frontend Application will run at `http://localhost:5173`*

---

## 🛡️ API Endpoints Summary

### Auth & User Profile
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/auth/me` | Authenticated | Sync/Fetch profile & role for logged-in user |
| `GET` | `/api/users` | Admin Only | List all registered users |
| `PUT` | `/api/users/<id>/role` | Admin Only | Update user role (`Employee`, `ESG Manager`, `Admin`) |

### Master Data: Departments
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/departments` | Authenticated | Get all departments |
| `POST` | `/api/departments` | Admin Only | Create a new department |
| `PUT` | `/api/departments/<id>` | Admin Only | Update existing department |
| `DELETE` | `/api/departments/<id>` | Admin Only | Delete department |

### Master Data: Categories
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Authenticated | Get all categories |
| `POST` | `/api/categories` | Admin Only | Create a new CSR Activity / Challenge category |
| `PUT` | `/api/categories/<id>` | Admin Only | Update category details |
| `DELETE` | `/api/categories/<id>` | Admin Only | Delete category |

---

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).
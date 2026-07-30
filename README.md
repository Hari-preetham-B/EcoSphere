# 🌿 EcoSphere — Enterprise ESG Management Platform

![License](https://img.shields.io/badge/License-MIT-emerald.svg)
![Stack](https://img.shields.io/badge/Stack-Flask%20%7C%20React%20%7C%20Supabase-teal.svg)
![Status](https://img.shields.io/badge/Status-Phase%200%20%2B%201%20%2B%202%20Active-brightgreen.svg)

> **EcoSphere** is an enterprise-grade Environmental, Social, and Governance (ESG) platform designed to track corporate carbon footprints, manage community CSR initiatives, track workforce diversity, and gamify sustainability goals.

---

## 🚀 Key Modules & Architecture

```
EcoSphere Platform
 ├── 🔐 Authentication & RBAC (Phase 0)
 │    ├── Supabase Auth JWT integration
 │    ├── Role-Based Access (Admin / ESG Manager / Employee)
 │    └── Automatic Admin bootstrap on first registration
 │
 ├── 🏢 Master Data Management (Phase 0)
 │    ├── Department CRUD & Employee Counts
 │    ├── Category Management (CSR & Environmental activities)
 │    └── Admin User Management & Role Promotion
 │
 ├── 🍃 Environmental Module (Phase 1)
 │    ├── Emission Factor Management (DEFRA 2023 / IPCC standards)
 │    ├── Carbon Transaction Tracking (Manual + Auto ERP Linkage)
 │    ├── Sustainability Target Goals & Live Progress
 │    ├── Department Carbon Footprint Summary
 │    └── Interactive Emissions Analytics (Recharts)
 │
 └── 🤝 Social ESG Module (Phase 2)
      ├── CSR Activity Scheduling & Department Alignment
      ├── Employee Participation with Supabase Storage Proof Uploads
      ├── Manager Approval Portal & Points / XP Rewards
      ├── Department Diversity & Inclusion Metrics (Gender & Age Charts)
      └── Training & Compliance Course Completion Tracking
```

---

## 🛠 Tech Stack

- **Frontend:** React 18 (Vite), TailwindCSS, Lucide Icons, Recharts Analytics, Supabase JS Client
- **Backend:** Flask REST API, SQLAlchemy ORM, PyJWT, Requests
- **Database & Auth:** Supabase PostgreSQL & Supabase Auth API
- **Storage:** Supabase Storage (`csr-proofs` bucket for participation evidence)

---

## ⚙️ Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- Supabase Project (Database URL, Supabase URL, Anon Key)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python app.py
```
> The backend automatically runs database migrations (`db.create_all()`) and seeds 10 realistic mock ERP records, default Emission Factors, and system setting toggles.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🛡 System Settings & Policies

Navigating to **Settings** (`/settings`) exposes platform-wide switches:

1. **Auto Emission Calculation:** Automatically populates transaction dates, quantities, and departments when linked to mock ERP records (Purchases, Manufacturing, Fleet, Expenses).
2. **Require Proof for CSR Approval:** Gates Manager approval for CSR activities until the employee uploads a valid proof file (Images or PDF, max 5MB).

---

## 📋 Role & Privilege Matrix

| Module / Action | Admin | ESG Manager | Employee |
|---|:---:|:---:|:---:|
| User Management & Role Promotion | ✅ | ❌ | ❌ |
| Department & Category CRUD | ✅ | ❌ | ❌ |
| Create / Edit Emission Factors | ✅ | ✅ | ❌ |
| Log Carbon Transactions | ✅ | ✅ | ✅ |
| Create Sustainability Goals | ✅ | ✅ | ❌ |
| Schedule CSR Activities | ✅ | ✅ | ❌ |
| Register for CSR Activity | ✅ | ✅ | ✅ |
| Upload CSR Proof Evidence | ✅ | ✅ | ✅ |
| Approve / Reject CSR Participations | ✅ | ✅ | ❌ |
| Record Diversity Metrics | ✅ | ✅ | ❌ |
| View Diversity Charts | ✅ | ✅ | ✅ |
| Self-Enroll Training Course | ✅ | ✅ | ✅ |
| Set Training Status to 'Completed' | ✅ | ✅ | ❌ |

---

## 📜 License
Developed for enterprise ESG auditing and sustainability reporting. Licensed under the MIT License.
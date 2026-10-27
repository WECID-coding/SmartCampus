# 🎓 Findora (SmartCampus) — MITS Gwalior
> **Intelligent, Geospatially-Enabled Campus Lost & Found Management Platform**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.14-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20(WAL%20Mode)-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini%203.8%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Vercel Ready](https://img.shields.io/badge/Deployment-Vercel%20Serverless-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Tests Passing](https://img.shields.io/badge/Tests-19%2F19%20Passed-brightgreen?style=for-the-badge)](test_smartcampus_audit.py)

---

## 📖 Overview

**Findora (SmartCampus)** is a modern, production-grade web platform designed for **Madhav Institute of Technology & Science (MITS), Gwalior**. It streamlines the reporting, tracking, matching, and physical handover of lost and found belongings across the academic complex.

Engineered for **4,000+ concurrent students, faculty, and administrative staff**, the system combines high-concurrency database architecture, real-time claim verification, dual AI intelligence, and a geospatial campus directory covering 235+ academic venues.

---

## 🌟 Key Features

### 1. 🔍 Instant Report Directory & Smart Filters
- **Multi-Filter Pipeline**: Filter reports by Type (*All / Lost / Found*), Category, and Location.
- **Dynamic Category Badges**: Real-time counters showing active reports per category.
- **Active Filter Chips**: Dismissible filter tags with clear-all functionality.
- **Visual Thumbnails**: Uploaded photos render directly on cards with automatic fallback to category icons.

### 2. 📍 235 Verified MITS Campus Locations
- Complete hierarchical directory of MITS campus venues:
  - **Academic Classrooms**: e.g., `Classroom 113A J115`, `Classroom 101`, `J-Block`.
  - **Departmental Laboratories**: e.g., `CIoT Lab M007`, `Cloud Computing Lab J140`, `AI Research Lab`.
  - **Auditoriums & Public Spaces**: e.g., `Seminar Hall SH-12`, `Central Library`, `Campus Canteen`.
- Intelligent fuzzy autocomplete on hero search and submission forms.

### 3. 🤖 Dual-Engine AI Intelligence
- **Google Gemini 3.8 Flash Integration**:
  - **Semantic Item Matching**: Compares lost items against found candidates and ranks matches with similarity scoring.
  - **Auto-Enhance Reports**: Cleans up titles, expands descriptions, and generates search tags.
  - **Campus Assistant Chatbot**: Conversational AI assistant answering campus recovery queries in real-time.
- **Offline Heuristic Engine**: Automatically activates if no API key is provided or during network outages, ensuring 100% platform uptime.

### 4. 🛡️ Proctor Claim & Handover Verification
- Students can submit verified ownership claims with proof and context.
- **"My Filed Claims" Dashboard**: Students track whether claims are **Under Review**, **Approved**, or **Rejected**.
- **Campus Security Handover**: Authorized proctors approve claims via the Admin Panel and specify the security collection desk.

### 5. 🎨 Modern Glassmorphic Design & Accessibility
- Fluid dark/light theme switching with persistence in `localStorage`.
- High-contrast visual accents, fluid typography (`Outfit` & `Plus Jakarta Sans`).
- Fully responsive across mobile (<768px), tablet, and desktop with a slide-out mobile navigation drawer on all pages.

### 6. 🔒 Role-Based Access Control (RBAC)
- **Student**: Submit reports, claim items, track own submissions and claims.
- **Faculty**: Submit department reports, track found assets.
- **Administrator**: Dedicated moderation panel, claim review queue, statistics, and audit CSV exports.

---

## 🔑 Demo Access Credentials

| Role | Username / ID | Email | Password | Access Level | Login Helper |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Student** | `0901cs221045` | `priya.sharma@mitsgwl.ac.in` | `mits2026pass` | Reports, claims, student dashboard | 1-Click Demo Button |
| **Faculty** | `rgupta` | `r.gupta@mitsgwalior.in` | `mits2026pass` | Department reports, dashboard | 1-Click Demo Button |
| **Administrator** | `admin` | `admin@mitsgwl.ac.in` | `admin123` | **Full Admin Panel (`pages/admin.html`)**, Moderation, Approvals | *Manual credentials* |

> **Security Note**: Unauthorized navigation to `pages/admin.html` without verified administrator credentials redirects immediately to login. All administrative API routes (`/admin/*`) enforce token authorization and return HTTP 403 Forbidden for unauthorized requests.

---

## 📁 Repository Structure

```text
smartcampus2026/
├── index.html                   # Main Campus Landing Page & Hero Search
├── README.md                    # Project documentation & GitHub guide
├── requirements.txt             # Python dependencies
├── vercel.json                  # Cloud serverless routing configuration
├── .gitignore                   # Git exclusion rules
├── .vercelignore                # Vercel deployment exclusions
├── start-backend.bat            # 1-Click local development server launcher
├── start-backend-prod.bat       # 1-Click production multi-worker launcher
├── test_smartcampus_audit.py    # Automated 19-test audit verification suite
│
├── api/
│   └── index.py                 # Vercel serverless FastAPI entrypoint
│
├── backend/
│   ├── main.py                  # Core FastAPI application & REST endpoints
│   ├── database.py              # SQLite high-concurrency WAL database engine
│   ├── ai_service.py            # Dual AI engine (Google Gemini 3.8 Flash + local heuristic)
│   ├── smartcampus.db           # Seeded SQLite database
│   ├── .env.example             # Environment variable template
│   ├── requirements.txt         # Backend Python packages
│   └── uploads/                 # Item photos storage directory (.gitkeep)
│
├── css/
│   ├── base.css                 # Global theme variables, reset, buttons & typography
│   ├── home.css                 # Homepage layout, hero, stats & feeds
│   ├── browse.css               # Directory search & active filter chips
│   ├── report.css               # Submission form, live preview & file upload styling
│   ├── reports.css              # User reports & claims dashboard styling
│   ├── admin.css                # Admin control panel, metrics & moderation table
│   ├── auth.css                 # Login & Registration card styling
│   └── notifications.css        # Notifications center list & actions
│
├── js/
│   ├── campus-locations.js      # 235 verified campus classrooms, seminar halls & labs
│   ├── location-picker.js       # Autocomplete combobox component
│   ├── api.js                   # API client with offline local fallback simulation
│   ├── app.js                   # Core application logic, cards, claims modal & AI matching
│   ├── auth-ui.js               # Header navigation, notification bell & user chip dropdown
│   ├── home.js                  # Homepage search autocomplete & dynamic category counts
│   ├── browse.js                # Browse directory controller & active filter chips
│   ├── report.js                # Report submission, live card preview & draft auto-save
│   ├── my-reports.js            # User reports controller & resolution actions
│   ├── admin.js                 # Admin dashboard controller & claim authorization
│   ├── login.js                 # Login controller & 1-click demo buttons
│   ├── register.js              # User registration controller
│   ├── notifications.js         # Notifications list controller
│   ├── theme.js                 # Dark & light theme switcher
│   └── map.js                   # MITS Campus landmark coordinates (reference dataset)
│
└── pages/
    ├── admin.html               # Admin Control Panel
    ├── browse.html              # Browse Reports Directory
    ├── my-reports.html          # My Reports Dashboard (with My Filed Claims)
    ├── report.html              # Submit New Lost/Found Report
    ├── how-it-works.html        # Handover Desks Guide & Interactive FAQ
    ├── notifications.html       # Notifications Center
    ├── login.html               # Sign In Page
    └── register.html            # Registration Page
```

---

## ⚡ Quickstart Guide

### 1. Running the FastAPI Backend Server

#### Option A: 1-Click Launch (Windows)
Double-click **`start-backend.bat`** (or `start-backend-prod.bat` for 4-worker production mode).

The backend automatically launches at:
- **API Root**: `http://127.0.0.1:8000`
- **Swagger Interactive API Docs**: `http://127.0.0.1:8000/docs`
- **Redoc Documentation**: `http://127.0.0.1:8000/redoc`

#### Option B: Manual Setup via Terminal
```powershell
cd backend

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

---

### 2. Running the Frontend Website

The frontend runs in any modern browser without a build step:

- **VS Code Live Server (Recommended)**: Right-click `index.html` → **"Open with Live Server"** (opens at `http://127.0.0.1:5500/index.html`).
- **Python HTTP Server**:
  ```powershell
  python -m http.server 3000
  ```
  Visit `http://localhost:3000` in your web browser.
- **Direct Opening**: Double-click `index.html` to open directly in Chrome, Edge, or Firefox.

> **Offline-Resilient Architecture**: When the FastAPI backend is running, the frontend seamlessly synchronizes via REST API. If the backend is stopped, the frontend automatically falls back to client simulation mode so features remain interactive.

---

## 🐙 Pushing to GitHub

Follow these steps to publish this repository to GitHub:

### Step 1: Create an Empty Repository
1. Go to [github.com/new](https://github.com/new).
2. Enter repository name: `smartcampus2026`.
3. Choose **Public** or **Private**.
4. **Leave all checkboxes unchecked** (Do *not* check README, .gitignore, or license).
5. Click **Create repository**.

### Step 2: Push via Terminal
Open PowerShell in the project directory:

```powershell
cd C:\Users\DEV\Desktop\smartcampus2026

# Push all commits to your GitHub repository:
git push origin main
```

---

## ☁️ Deploying on Vercel

SmartCampus includes zero-config serverless support for Vercel:

1. Install the Vercel CLI:
   ```powershell
   npm install -g vercel
   ```
2. Deploy directly from the project root:
   ```powershell
   vercel --prod
   ```
3. *(Optional)* In your Vercel Project Settings under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.

---

## 🧪 Automated Test Suite

A complete verification suite is included to validate security, password hashing, claim workflows, image uploads, and page integrity:

```powershell
python test_smartcampus_audit.py
```

### Verified Test Matrix (19/19 Tests Passed):
- `[PASS]` API Root Status Online
- `[PASS]` SEC-01: Admin Bypass Token Rejected (HTTP 403)
- `[PASS]` SEC-02a: Wrong Password Rejected for Student (HTTP 401)
- `[PASS]` SEC-02b: Correct Password Accepted for Student (HTTP 200)
- `[PASS]` SEC-01b: Student Forbidden from Admin Stats (HTTP 403)
- `[PASS]` Admin Login Successful with Credentials (HTTP 200)
- `[PASS]` Admin Stats Accessible with Valid Admin Token
- `[PASS]` BUG-02: Image Upload URL Relative and Not Localhost
- `[PASS]` Claim Submission Endpoint
- `[PASS]` FEAT-01a: Student `/claims/mine` Retrieval
- `[PASS]` Admin Approve Claim
- `[PASS]` FEAT-01b: Student Sees Approved Claim Status
- `[PASS]` Student Notifications Feed
- `[PASS]` AI Status Operational
- `[PASS]` AI Auto-Enhance Report
- `[PASS]` AI Conversational Assistant Reply
- `[PASS]` Frontend: All 9 Core HTML Pages Present
- `[PASS]` UI-01: Mobile Navigation Drawer Present on All Sub-pages
- `[PASS]` CLN-01: Dead 0-byte Header Removed

---

## 📜 Audit & Verification Documentation

For complete technical logs and security audit records, refer to:
- [`SMARTCAMPUS_AUDIT_REPORT.md`](SMARTCAMPUS_AUDIT_REPORT.md): Initial security audit findings and issue classifications.
- [`SMARTCAMPUS_FIX_LOG.md`](SMARTCAMPUS_FIX_LOG.md): Technical change log for every fix implemented.
- [`SMARTCAMPUS_TEST_REPORT.md`](SMARTCAMPUS_TEST_REPORT.md): Detailed test execution report.
- [`SMARTCAMPUS_REMAINING_ISSUES.md`](SMARTCAMPUS_REMAINING_ISSUES.md): Manual deployment checklist.

---

## 🏛️ Credits & Institutional Information

- **Institution**: [Madhav Institute of Technology & Science (MITS), Gwalior](https://web.mitsgwalior.in/) (Established 1957)
- **Project**: SmartCampus Lost & Found Platform
- **Lead Developer**: DEV KHANDELWAL (`devnakul1975@gmail.com`)
- **Academic Year**: 2026

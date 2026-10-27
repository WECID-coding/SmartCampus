# SmartCampus — MITS Gwalior
> Intelligent, Geospatially-Enabled Lost & Found Campus Management Portal

SmartCampus is a modern, high-contrast multi-page web platform designed for Madhav Institute of Technology & Science (MITS), Gwalior. It enables students, faculty, and administrative staff to report, track, claim, and recover lost property across the academic complex.

---

## 🌟 Key Features

1. **Dual Dark & Light Theme**
   - High-contrast color palette, custom glassmorphism, fluid typography (`Outfit` and `Plus Jakarta Sans`).
   - Theme toggle persists automatically across all pages in `localStorage`.

2. **235 Verified Campus Academic Rooms**
   - Complete directory of campus classrooms (e.g. `Classroom 113A J115`), seminar halls (e.g. `SH-12`), and departmental labs (`CIoT Lab M007`, `Cloud Computing Lab J140`).
   - Intelligent fuzzy autocomplete on Homepage hero search, Report submission, and Browse filters.

3. **Live Report Directory & Filtering**
   - Instant search, category filters, classroom location combobox, and active dismissible tag chips.
   - Live status toggles (All / Lost / Found) with auto-counted category metric badges.

4. **Interactive Report Submission**
   - Real-time card preview updates as you type.
   - Photo upload preview with file size indicator and removal.
   - Form draft auto-saved to `localStorage` to prevent accidental data loss.

5. **My Reports Dashboard**
   - Filter your own reports by All, Lost, Found, or Reunited.
   - 1-click `✓ Mark Reunited` action to close recovered item reports.
   - Report deletion with instant toast notification.

6. **Admin Control Panel (`pages/admin.html`)**
   - Real-time audit metrics: Total Submissions, Pending Claims, Handover Confirmations, Active Users.
   - Campus Reports Moderation: Approve submissions, mark items resolved, or remove posts.
   - Physical Handover Queue: Authorize or decline student ownership claims for Campus Security Desks (Library, SAC J114, Gate 1, Proctor Office).
   - Instant CSV Audit Log export.

7. **Authentication & User Profile**
   - Header notification bell with unread badge counter.
   - User avatar chip with initials and dropdown navigation (My Reports, Notifications, Admin Dashboard, Sign Out).

---

## 🔑 Login & Access Control

Student and Faculty accounts support 1-Click Quick Demo buttons on `pages/login.html`. For security, Administrator access is strictly restricted and requires verified credentials.

| Role | Username / ID | Email | Password | Access Level | Demo Helper |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Student** | `0901cs221045` | `priya.sharma@mitsgwl.ac.in` | `mits2026pass` | Submit reports, claim found items, view own dashboard | 1-Click Button (`👨‍🎓 Student Demo`) |
| **Faculty** | `rgupta` | `r.gupta@mitsgwalior.in` | `mits2026pass` | Submit reports, view own dashboard | 1-Click Button (`👩‍🏫 Faculty Demo`) |
| **Administrator** | `admin` | `admin@mitsgwl.ac.in` | `admin123` | **Full Admin Control Panel (`pages/admin.html`)**, Moderation, Claim Authorizations | *Manual credentials required* |

> **🔒 Protected Admin Panel**:
> - Direct navigation to `pages/admin.html` without an active administrator session is blocked; unauthorized users are automatically redirected to `pages/login.html?error=unauthorized`.
> - All administrative backend endpoints (`/admin/stats`, `/admin/claims`, moderation PATCH/DELETE) enforce token validation and reject non-admin requests with HTTP 403 Forbidden.

---

## 📁 Project Structure

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
├── api/
│   └── index.py                 # Vercel serverless FastAPI entrypoint
├── backend/
│   ├── main.py                  # Core FastAPI application & routes
│   ├── database.py              # SQLite high-concurrency WAL database engine
│   ├── ai_service.py            # Dual AI engine (Google Gemini 3.8 Flash + local heuristic)
│   ├── smartcampus.db           # Seeded SQLite database
│   ├── .env.example             # Environment variable template
│   ├── requirements.txt         # Backend Python packages
│   └── uploads/                 # Item photos storage directory
├── css/
│   ├── base.css                 # Global theme variables, reset, buttons & typography
│   ├── home.css                 # Homepage layout, hero, stats & feeds
│   ├── browse.css               # Directory search & active filter chips
│   ├── report.css               # Submission form, live preview & file upload styling
│   ├── reports.css              # User reports & claims dashboard styling
│   ├── admin.css                # Admin control panel, metrics & moderation table
│   ├── auth.css                 # Login & Registration card styling
│   └── notifications.css        # Notifications center list & actions
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
│   └── theme.js                 # Dark & light theme switcher
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

## 🐙 Pushing to GitHub

Follow these steps to push this project to your GitHub repository:

### Step 1: Create a Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Name the repository (e.g., `smartcampus2026`).
3. Leave it empty (do **not** check "Initialize with README", .gitignore, or license).
4. Click **Create repository**.

### Step 2: Link and Push via Terminal
Open PowerShell or Command Prompt inside `C:\Users\DEV\Desktop\smartcampus2026`:

```powershell
cd C:\Users\DEV\Desktop\smartcampus2026

# 1. Add your GitHub repository as remote (replace with your repo URL):
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git

# 2. Ensure default branch is main:
git branch -M main

# 3. Push all commits to GitHub:
git push -u origin main
```

---

## ⚡ Running the FastAPI Backend Server

The project includes a production-ready **FastAPI + SQLite** backend in the `backend/` directory:

### 1-Click Startup:
- Simply double-click **`start-backend.bat`** (or `start-backend-prod.bat` for multi-worker mode).
- The server will start at:
  - **API Root**: `http://127.0.0.1:8000`
  - **Swagger Interactive API Docs**: `http://127.0.0.1:8000/docs`
  - **Redoc Documentation**: `http://127.0.0.1:8000/redoc`

### Manual Setup & Startup:
```powershell
cd C:\Users\DEV\Desktop\smartcampus2026\backend

# Create virtual environment (first time only)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run server with live reload
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

> **Note**: If the backend is running, the frontend automatically syncs with it in real-time. If the backend is stopped, the frontend smoothly switches to its offline client simulation mode with zero downtime.

---

## 🚀 How to Run the Website (Frontend)

Because SmartCampus uses clean HTML5, modern CSS3, and ES6 JavaScript, you can run it using any static web server:

### Option 1: VS Code Live Server (Recommended)
1. Open the `smartcampus2026` folder in VS Code.
2. Right-click `index.html` and select **"Open with Live Server"**.
3. The site opens at `http://127.0.0.1:5500/index.html`.

### Option 2: Python Built-in HTTP Server
Run this in PowerShell from `smartcampus2026`:
```powershell
python -m http.server 3000
```
Then visit `http://localhost:3000` in your web browser.

### Option 3: Direct File Opening
Double-click `index.html` directly in your file explorer to launch it in Chrome, Edge, or Firefox.

---

## ☁️ Deploying to Vercel

The project includes pre-configured [`vercel.json`](vercel.json) rewrites and [`api/index.py`](api/index.py) serverless entrypoints:

1. Install the Vercel CLI (if not installed):
   ```powershell
   npm install -g vercel
   ```
2. Run deployment from `smartcampus2026`:
   ```powershell
   vercel --prod
   ```
3. *(Optional)* Add your `GEMINI_API_KEY` in the Vercel project settings under Environment Variables to activate Google Gemini 3.8 Flash features.

---

## 🧪 Automated Audit Verification

The project includes an automated test suite verifying security, password hashing, claim tracking, image uploads, AI services, and frontend integrity:

```powershell
cd C:\Users\DEV\Desktop\smartcampus2026
python test_smartcampus_audit.py
```
**Verification status:** 19/19 tests passing (100%).

---

## 🛡️ License & Credits
- **Institution**: Madhav Institute of Technology & Science (MITS), Gwalior
- **System**: SmartCampus Lost & Found Platform

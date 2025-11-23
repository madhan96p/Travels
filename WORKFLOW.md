# 🚖 ShRish Travels Rebuild – Master Workflow & Architecture

**Version:** 2.2
**Status:** In Progress
**Goal:** A professional, mobile-first, interactive travel website with automated operations.

---

# 1. 📂 Master File Checklist & Status

Use this as your main progress tracker.

## **Root & Build System**

| File / Folder        | Status   | Description                                                     |
| -------------------- | -------- | --------------------------------------------------------------- |
| **build.py**         | 🔴 To Do | Core build engine. Generates static HTML from templates + JSON. |
| **requirements.txt** | 🔴 To Do | Python dependencies (e.g., `requests`).                         |
| **package.json**     | 🔴 To Do | Node dependencies (`nodemailer`, `google-spreadsheet`).         |
| **.env**             | 🔴 To Do | Local-only secrets. Add to `.gitignore`.                        |
| **netlify.toml**     | 🔴 To Do | Netlify build pipeline + redirects.                             |
| **WORKFLOW.md**      | 🟢 Done  | This document.                                                  |

---

## **Admin & Security**

| File / Folder        | Status   | Description                                      |
| -------------------- | -------- | ------------------------------------------------ |
| **admin/index.html** | 🔴 To Do | Secure Manager Dashboard for route entry.        |
| **_headers**         | 🔴 To Do | Netlify file for `/admin/*` password protection. |

---

## **Frontend Assets (Mobile First)**

| File / Folder                              | Status     | Description                              |
| ------------------------------------------ | ---------- | ---------------------------------------- |
| **assets/css/common.css**                  | 🟡 Pending | Base variables, reset, typography.       |
| **assets/css/index.css**                   | 🟡 Pending | Hero section + floating action buttons.  |
| **assets/css/booking.css**                 | 🟡 Pending | Form styling.                            |
| **assets/js/index.js**                     | 🟡 Pending | Home page interactions.                  |
| **assets/js/common.js**                    | 🟡 Pending | Nav toggles, date pickers, shared logic. |
| **assets/images/favicon/site.webmanifest** | 🔴 To Do   | Required for PWA install.                |

---

## **Data & Templates**

| File / Folder                  | Status     | Description                                 |
| ------------------------------ | ---------- | ------------------------------------------- |
| **assets/data/routes.json**    | 🟡 Pending | Core route database (Price, Distance, etc). |
| **assets/data/schema.json**    | 🔴 To Do   | Route validation schema for Admin inputs.   |
| **components/_header.html**    | 🟡 Pending | Navigation bar (Responsive).                |
| **components/_footer.html**    | 🟡 Pending | Footer content.                             |
| **components/_route_tpl.html** | 🔴 To Do   | HTML template for Python’s generator.       |

---

## **Backend (Netlify Functions)**

| File / Folder                           | Status   | Description                                                   |
| --------------------------------------- | -------- | ------------------------------------------------------------- |
| **netlify/functions/submit-booking.js** | 🔴 To Do | Unified logic: Save booking → Google Sheet → Zoho SMTP email. |
| **netlify/functions/save-route.js**     | 🔴 To Do | Admin route save → GitHub JSON update → Auto Build.           |

---

## **Google Setup (No Apps Script)**

| Component        | Status   | Description                                          |
| ---------------- | -------- | ---------------------------------------------------- |
| **Google Sheet** | 🔴 To Do | Raw sheet only. Netlify Functions handle everything. |

---

# 2. 🔄 Data Flows

## **A. Booking Flow (User → Manager)**

1. User fills booking form on **index.html** (mobile-first).
2. JS sends POST request → `/api/submit-booking`.
3. Netlify Function authenticates via Google Service Account.
4. Function appends row to Google Sheet.
5. Sends HTML email via Zoho SMTP → `travels@shrishgroup.com`.
6. Email contains:

   * Booking details
   * **Create Duty Slip** button
     → `https://admin.shrishgroup.com/create-duty-slip.html?name=...`

---

## **B. Route Management Flow (Manager → Website)**

1. Manager opens **/admin** (password-protected).
2. Fills route form (Origin, Destination, Price…).
3. JS → `/api/save-route`.
4. Netlify Function pushes updated `routes.json` to GitHub (via PAT).
5. Git commit triggers Netlify build.
6. Python `build.py` regenerates **static HTML pages**.
7. Site updates go live within **60 seconds**.

---

# 3. ⚙️ Configuration Guides

## **A. Netlify Project Settings**

| Setting                 | Value               | Purpose                                |
| ----------------------- | ------------------- | -------------------------------------- |
| **Build Command**       | `python build.py`   | Runs static generator.                 |
| **Publish Directory**   | `public`            | Output folder created by build script. |
| **Functions Directory** | `netlify/functions` | API endpoints.                         |

---

## **B. Netlify Environment Variables**

| Key                              | Value Description                                         | Used By            |
| -------------------------------- | --------------------------------------------------------- | ------------------ |
| **GOOGLE_SHEET_ID**              | Extracted from sheet URL                                  | submit-booking API |
| **GOOGLE_SERVICE_ACCOUNT_EMAIL** | From Google Cloud                                         | Google Auth        |
| **GOOGLE_PRIVATE_KEY**           | From JSON key                                             | Google Auth        |
| **ZOHO_EMAIL**                   | [travels@shrishgroup.com](mailto:travels@shrishgroup.com) | SMTP user          |
| **ZOHO_PASSWORD**                | Zoho App Password                                         | SMTP auth          |
| **GITHUB_TOKEN**                 | GitHub PAT                                                | save-route API     |

---

# 4. 📝 Step-by-Step Execution Plan

## **Phase 1: Local Structure (Today)**

* Create `package.json` → install Node dependencies.
* Create `requirements.txt` → Python dependencies.
* Create `.env` with secrets (do not commit).
* Build and test `build.py` locally.

---

## **Phase 2: Backend Logic**

* Write `netlify/functions/submit-booking.js`:
  Google → Sheet → Zoho Email.
* Test locally using Netlify Dev with `.env`.

---

## **Phase 3: Frontend (Mobile First)**

* Build **index.html** with large, touch-friendly UI.
* Implement “Quick Book” form.
* Add responsive nav, header, footer.

---

## **Phase 4: Admin Panel**

* Build **admin/index.html** dashboard.
* Implement `save-route.js` to push updates to GitHub.
* Integrate validation using `schema.json`.

---
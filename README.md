# Srini Physio Clinics

Website, online booking and clinic console for Srini Physio Clinics, Masid Banda, Kondapur, Hyderabad.

- **frontend/** — React + Vite: public website (home, treatments, about, contact), booking with live slot availability, patient accounts, and the staff admin console.
- **backend/** — FastAPI + PostgreSQL API: patients, appointments, enquiries, doctors, schedule/leave, daily tokens, dashboard and authentication.

## Features

**Website**
- Home, Treatments (a page per treatment), About and Contact pages in the clinic's navy and gold brand
- Booking form with live free slots per doctor; already-booked or blocked slots can't be chosen, and alternatives are offered
- Booking requests are saved for the clinic and sent on WhatsApp

**Patient accounts** (`/signup`, `/login`)
- Patients create an account, see upcoming and past appointments, tokens and their home exercise plan
- Cancel an upcoming appointment or withdraw a request; update profile and password

**Admin console** (`/login` with a staff account)
- Dashboard: today's appointments and capacity, 14-day trend, live waiting/in-therapy counts, treatment mix, new enquiries
- Appointments: status flow (pending → confirmed → checked in → in therapy → completed), walk-in check-in with daily tokens, pain-based triage, reschedule, exercise plans, WhatsApp reminders, CSV export
- Enquiries: book or offer another slot, first-come priority on contested slots
- Schedule: close the clinic or mark a doctor on leave for a day or a slot
- Doctors, services, patients and staff management; full-screen token display at `/admin/queue`

## Run locally

Requirements: Python 3.11+, Node 18+, PostgreSQL 14+.

```bash
# 1. Database
createdb srini_physio

# 2. Backend (http://localhost:8000, API docs at /docs)
cd backend
cp .env.example .env          # set DB_PASSWORD, SECRET_KEY and the admin seed account
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

# 3. Frontend (http://localhost:5173 — proxies /api to the backend)
cd frontend
npm install
npm run dev
```

On first start the backend creates the tables, the admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, the lead doctor and the default services. Later model changes add any missing columns automatically.

Or with Docker: `docker compose up --build` (development defaults — change the passwords and `SECRET_KEY` before any real use).

## Deploy to Render

The repo includes a Render Blueprint (`render.yaml`) and a production `Dockerfile`. They create:
- **srini-physio-db**: a PostgreSQL database
- **srini-physio**: one web service that builds the React app and serves it, together with the API, from FastAPI (same origin, so no CORS or API-URL setup)

Steps:
1. In Render: **New → Blueprint**, connect GitHub and pick this repository.
2. Enter a strong **ADMIN_PASSWORD** when asked. `SECRET_KEY` is generated for you and `DATABASE_URL` is wired to the database.
3. Click **Apply**. The first build takes a few minutes. Then open `https://<service>.onrender.com` and sign in at `/login` with `ADMIN_EMAIL` / your password.

Every push to `main` redeploys. Health check: `/api/health`.

Notes:
- Both resources are on the **free** plan. Free web services sleep after 15 minutes idle (the next visit takes about a minute), and **free databases expire after 30 days**. Move both to paid plans before real patients use it.
- The admin account is only created on first start. Changing `ADMIN_PASSWORD` later doesn't change an existing account.
- Custom domain: service → Settings → Custom Domains.

## Before going live
- Use a strong admin password (on Render it is set in the Blueprint; locally in `backend/.env`, never committed)
- Confirm the doctor's full name and qualifications in Admin → Doctors, and approve the treatment wording in `frontend/src/content/treatments.js`
- Replace the stock treatment photos (`frontend/public/treatments/`, credits in `CREDITS.md`) with real clinic photos via Admin → Services
- Move the Render database and web service off the free plan (see Deploy to Render)

# Srini Physio Clinics

Website, online booking and clinic console for Srini Physio Clinics, Masid Banda, Kondapur, Hyderabad.

- **frontend/** — React + Vite: public website (home, treatments, about, blog, contact), booking with live slot availability, patient accounts, and the staff admin console.
- **backend/** — FastAPI + PostgreSQL API: patients, appointments, enquiries, doctors, schedule/leave, daily tokens, dashboard, authentication, editable website content, blog, SEO and treatment summaries.

## Features

**Website**
- Home, Treatments (a page per treatment, including Chiropractic Care), About, Blog and Contact pages in the clinic's navy and gold brand
- All wording, clinic details and FAQs are editable from the admin; each page is served with its own title, description, share preview and schema.org data, plus `/sitemap.xml` and `/robots.txt`
- Booking form with live free slots per doctor; already-booked or blocked slots can't be chosen, and alternatives are offered
- Booking requests are saved for the clinic and sent on WhatsApp

**Patient accounts** (`/signup`, `/login`)
- Patients create an account, see upcoming and past appointments, tokens, their home exercise plan and their treatment summaries
- Cancel an upcoming appointment or withdraw a request; update profile and password

**Admin console** (`/login` with a staff account)
- Dashboard: today's appointments and capacity, 14-day trend, live waiting/in-therapy counts, treatment mix, new enquiries
- Appointments: status flow (pending → confirmed → checked in → in therapy → completed), walk-in check-in with daily tokens, pain-based triage, reschedule, exercise plans, WhatsApp reminders, CSV export
- Enquiries: book or offer another slot, first-come priority on contested slots
- Schedule: close the clinic or mark a doctor on leave for a day or a slot
- Doctors, services (with each treatment page's wording and SEO), patients and staff management; full-screen token display at `/admin/queue`
- Treatment summaries: the doctor's notes printed on the clinic letterhead (PDF, no prices), prepared when treatment is completed and sent on WhatsApp
- Website: blog editor (drafts, scheduling, Markdown with preview, SEO fields) and website content editor (every page, clinic details, letterhead, SEO & sharing)

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

## Testing

**Backend tests** (`backend/tests/`, 191 tests). They cover bookings and double-booking protection, closures and doctor leave, appointments, check-in tokens, triage, enquiry booking, patient accounts and privacy, staff permissions, the dashboard, website content, the blog, SEO and treatment summaries (with WhatsApp sending simulated). They need PostgreSQL and use their own database (`srini_physio_test`, created automatically on the server in `backend/.env`, or set `TEST_DATABASE_URL`). Every test empties that database, so the suite refuses to run against any database whose name doesn't end in `_test`.

```bash
cd backend
pip install -r requirements-dev.txt
python -m pytest
```

**Smoke test** for a running deployment (website pages, assets, API, optional admin sign-in):

```bash
python scripts/smoke_test.py https://<your-service>.onrender.com
# also check sign-in:
SMOKE_ADMIN_EMAIL=admin@sriniphysio.com SMOKE_ADMIN_PASSWORD=... python scripts/smoke_test.py https://<your-service>.onrender.com
```

**CI** (`.github/workflows/ci.yml`) runs on every push and pull request:
1. the backend tests against a fresh PostgreSQL
2. a build of the production Docker image, started the way Render starts it, then the smoke test against it

Render deploys a push only after both pass (`autoDeployTrigger: checksPass` in `render.yaml`).

## Deploy to Render

The repo includes a Render Blueprint (`render.yaml`) and a production `Dockerfile`. They create:
- **srini-physio-db**: a PostgreSQL database
- **srini-physio**: one web service that builds the React app and serves it, together with the API, from FastAPI (same origin, so no CORS or API-URL setup)

Steps:
1. In Render: **New → Blueprint**, connect GitHub and pick this repository.
2. Enter a strong **ADMIN_PASSWORD** when asked. `SECRET_KEY` is generated for you and `DATABASE_URL` is wired to the database.
3. Click **Apply**. The first build takes a few minutes. Then open `https://<service>.onrender.com` and sign in at `/login` with `ADMIN_EMAIL` / your password.

Every push to `main` redeploys once CI passes. Health check: `/api/health`.

Notes:
- Both resources are on the **free** plan. Free web services sleep after 15 minutes idle (the next visit takes about a minute), and **free databases expire after 30 days**. Move both to paid plans before real patients use it.
- The admin account is only created on first start. Changing `ADMIN_PASSWORD` later doesn't change an existing account.
- Custom domain: service → Settings → Custom Domains.

## Treatment summaries on WhatsApp

When an appointment is marked **Completed**, a treatment summary is prepared from the patient's chart and the editor opens. The doctor adds notes, then previews or prints it, or sends it on WhatsApp. It is printed on the clinic letterhead (Admin → Website content → Treatment summaries) and has no prices. Summaries can also be opened any time from Admin → Appointments → 📄 Summary. Patients get a private link to the PDF, which also appears under "My documents" in their account.

**Sending:**
- **Without extra setup:** "Send on WhatsApp" opens WhatsApp with the message and PDF link typed in. Staff press send.
- **Automatically:** connect the WhatsApp Business Cloud API. Summaries then go out as a PDF the moment treatment is completed.
  1. In Meta Business Manager, set up WhatsApp Business Platform and add the clinic number. A number on the Cloud API can't stay on the regular WhatsApp Business app.
  2. Create a message template named `treatment_summary` (language `en`) with a **Document** header and a body using `{{1}}` for the patient's name, e.g. "Hello {{1}}, here is your treatment summary from Srini Physio Clinics." Wait for Meta to approve it.
  3. Create a permanent access token (system user). Then set `WHATSAPP_API_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` in Render → Environment. Use `WHATSAPP_SUMMARY_TEMPLATE` / `WHATSAPP_TEMPLATE_LANG` if your template has another name or language.
  4. Automatic sending can be turned off in Admin → Website content → Treatment summaries.

PDF links work for patients only once the site is online (not on localhost).

## Before going live
- Use a strong admin password (on Render it is set in the Blueprint; locally in `backend/.env`, never committed)
- Confirm the doctor's full name and qualifications in Admin → Doctors, and approve the treatment wording in Admin → Services
- Replace the stock treatment photos (`frontend/public/treatments/`, credits in `CREDITS.md`) with real clinic photos via Admin → Services
- Move the Render database and web service off the free plan (see Deploy to Render)

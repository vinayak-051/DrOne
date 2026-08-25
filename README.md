# Doctorify

A full-stack hospital management web application built for a single-doctor clinic, enabling patients to book appointments, view medical records, and interact with an AI assistant — while the doctor manages queues, analytics, leaves, and records through an admin panel.

---

## Project Statement

Healthcare clinics often rely on manual, paper-based systems for appointment booking, patient record management, and queue handling. Doctorify digitizes this workflow for a single-doctor setup, providing:

- A **patient portal** for booking appointments, viewing OP slips, medical history, lab reports, and paying online.
- An **admin (doctor) panel** for managing appointments, patient queue, medical records, leaves, and analytics.
- An **AI assistant** (3D robot) on the patient dashboard to guide users.
- **Real-time notifications** for both roles using Supabase Realtime.
- **Razorpay payment integration** for appointment fees.
- **PDF generation** for OP slips and reports.
- A **Progressive Web App (PWA)** that also ships as an Android/iOS app via Capacitor.

---

## My Approach

1. **Single-doctor model** — Simplified auth with two roles: `admin` (doctor) and `patient`. No multi-doctor complexity.
2. **Supabase as backend-as-a-service** — Handles auth, database (PostgreSQL), row-level security, real-time subscriptions, and file storage directly from the frontend, reducing backend surface area.
3. **FastAPI backend** — A lightweight Python API handles business logic that doesn't belong in the client: payment verification, PDF generation, analytics aggregation, and rate-limited endpoints.
4. **React Query** — All server state is managed with TanStack Query for caching, background refetching, and optimistic updates.
5. **Capacitor** — The Vite/React app is wrapped with Capacitor to produce native Android/iOS builds without a separate codebase.
6. **3D AI Robot** — Built with `@react-three/fiber` and Three.js, rendered in a modal on the patient dashboard as an interactive assistant.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Client                           │
│   React 19 + Vite  (PWA + Capacitor mobile wrapper)    │
│                                                         │
│  ┌─────────────────┐      ┌──────────────────────────┐ │
│  │  Patient Portal  │      │     Admin Panel           │ │
│  │  Dashboard       │      │     Dashboard             │ │
│  │  Appointments    │      │     Appointment Mgmt      │ │
│  │  OP Slip / PDF   │      │     Queue System          │ │
│  │  Medical History │      │     Medical Records       │ │
│  │  Reports         │      │     Analytics             │ │
│  │  Book + Pay      │      │     Leaves                │ │
│  │  AI Robot (3D)   │      │     Patient Search        │ │
│  └─────────────────┘      └──────────────────────────┘ │
│            │                          │                  │
│     React Query + Supabase JS Client                    │
└───────────────┬──────────────────────┬──────────────────┘
                │                      │
     ┌──────────▼──────┐    ┌──────────▼──────────┐
     │   Supabase       │    │   FastAPI Backend    │
     │  (PostgreSQL)    │    │   (Python 3.13)      │
     │  Auth (JWT)      │    │                      │
     │  Row-Level Sec.  │    │  /appointments       │
     │  Realtime        │    │  /patients           │
     │  Storage         │    │  /queue              │
     └─────────────────┘    │  /medical-records    │
                             │  /analytics          │
                             │  /leaves             │
                             │  /payments           │
                             │  (Razorpay verify)   │
                             └──────────────────────┘
```

**Auth flow:** Supabase Auth issues JWTs. The FastAPI backend verifies these tokens using `python-jose` before processing any request.

---

## Folder Structure

```
Doctorify/
├── Frontend/                     # React + Vite app
│   ├── src/
│   │   ├── App.jsx               # Root router + auth guards
│   │   ├── main.jsx              # React entry point
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global auth state
│   │   ├── hooks/                # All data-fetching hooks (React Query)
│   │   │   ├── useAuth.js
│   │   │   ├── useAppointments.js
│   │   │   ├── usePatients.js
│   │   │   ├── useQueue.js
│   │   │   ├── useMedicalRecords.js
│   │   │   ├── useAnalytics.js
│   │   │   ├── useLeaves.js
│   │   │   └── useNotifications.js
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── InfoPage.jsx
│   │   │   ├── patient/          # Patient-facing pages
│   │   │   │   ├── PatientDashboard.jsx
│   │   │   │   ├── BookAppointment.jsx
│   │   │   │   ├── AppointmentsPage.jsx
│   │   │   │   ├── OPSlipPage.jsx
│   │   │   │   ├── MedicalHistory.jsx
│   │   │   │   ├── ReportsPage.jsx
│   │   │   │   ├── ProfilePage.jsx
│   │   │   │   └── KnowYourDoctor.jsx
│   │   │   └── admin/            # Doctor/admin pages
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AppointmentManagement.jsx
│   │   │       ├── QueueSystem.jsx
│   │   │       ├── PatientsPage.jsx
│   │   │       ├── PatientSearch.jsx
│   │   │       ├── MedicalRecordsEditor.jsx
│   │   │       ├── AnalyticsDashboard.jsx
│   │   │       ├── LeavesPage.jsx
│   │   │       └── AdminProfile.jsx
│   │   ├── components/
│   │   │   ├── common/           # Shared UI components
│   │   │   │   ├── Layout.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   └── LoadingSpinner.jsx
│   │   │   └── robot/            # 3D AI assistant (Three.js)
│   │   │       ├── Robot.jsx
│   │   │       ├── Scene.jsx
│   │   │       ├── RobotViewer.jsx
│   │   │       └── materials.js
│   │   ├── lib/
│   │   │   ├── supabase.js       # Supabase client
│   │   │   └── api.js            # FastAPI client (axios/fetch wrappers)
│   │   └── utils/
│   │       ├── constants.js
│   │       ├── helpers.js
│   │       └── razorpay.js       # Razorpay checkout helper
│   ├── package.json
│   └── vite.config.js
│
└── Backend/                      # FastAPI app
    ├── app/
    │   ├── main.py               # App entry, middleware, router registration
    │   ├── config.py             # Pydantic settings (env vars)
    │   ├── auth.py               # JWT verification (Supabase tokens)
    │   ├── database.py           # Supabase Python client
    │   ├── logger.py             # Structured logging
    │   ├── models/
    │   │   └── schemas.py        # Pydantic request/response models
    │   └── routers/
    │       ├── appointments.py
    │       ├── patients.py
    │       ├── queue.py
    │       ├── medical_records.py
    │       ├── analytics.py
    │       ├── leaves.py
    │       └── payments.py       # Razorpay payment verification
    ├── schema.sql                # Database schema
    ├── signup_trigger.sql        # Supabase trigger for new user profiles
    ├── requirements.txt
    └── .env.example
```

---

## How to Run

### Prerequisites

- Node.js 18+
- Python 3.11+
- A Supabase project (URL + anon key + service role key)
- Razorpay account (key ID + secret)

---

### Frontend

```bash
cd Frontend
npm install
```

Create a `.env` file in `Frontend/`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

Start the dev server:

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

To build for production:

```bash
npm run build
```

---

### Backend

```bash
cd Backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

`.env` keys required:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
ALLOWED_ORIGINS=http://localhost:5173
```

Start the API server:

```bash
uvicorn app.main:app --reload --port 8000
```

API runs at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

---

### Database Setup

Run `schema.sql` in the Supabase SQL editor to create all tables, then run `signup_trigger.sql` to set up the user profile trigger that fires on new Supabase Auth signups.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4 |
| State / Data | TanStack React Query |
| Backend | FastAPI, Uvicorn, Python 3.13 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Real-time | Supabase Realtime |
| Payments | Razorpay |
| 3D / AI Robot | Three.js, @react-three/fiber |
| PDF | ReportLab (backend), jsPDF (frontend) |
| Mobile | Capacitor (Android + iOS) |
| PWA | vite-plugin-pwa |

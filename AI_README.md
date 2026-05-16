# AI Context File — EduAttend System

> This file provides complete context about the EduAttend codebase for AI assistants.
> Read this FIRST before making any changes to the project.

## Project Overview

**EduAttend** is a university attendance tracking system built for **E-JUST** (Egypt-Japan University of Science and Technology). Students mark their attendance by capturing a live selfie + a photo of their university ID card. Admins and doctors manage lectures and monitor attendance records.

**Live URL:** Deployed on Cloudflare Pages  
**Language:** Arabic (RTL layout)  
**Timezone:** All time comparisons use `Africa/Cairo` timezone explicitly

---

## Tech Stack

- **Frontend:** React 19 + Vite (SPA)
- **Styling:** Tailwind CSS v4 (with `@tailwindcss/vite` plugin)
- **Routing:** React Router v7 (`react-router-dom`)
- **Backend:** Supabase (PostgreSQL + Auth + Row Level Security)
- **Image Hosting:** ImgBB API (base64 → URL)
- **Camera:** `react-webcam` library
- **Fonts:** Cairo (Arabic) + Inter (Latin) via Google Fonts
- **Deployment:** Cloudflare Pages with `public/_redirects` for SPA routing

---

## Architecture

```
[Browser] → [React SPA] → [Supabase Auth] → [Supabase PostgreSQL + RLS]
                ↓
          [ImgBB API] (image hosting)
```

### Entry Flow
1. `index.html` loads `src/main.jsx`
2. `main.jsx` wraps app in `BrowserRouter` → `AuthProvider` → `App`
3. `App.jsx` defines routes; `PrivateRoute` enforces auth + role checks
4. Root `/` uses `RoleRedirect` to send users to their dashboard

### Authentication Flow
1. User signs up via Supabase Auth (`supabase.auth.signUp`)
2. A PostgreSQL trigger (`on_auth_user_created`) auto-creates a `profiles` row
3. The role is taken from `raw_user_meta_data.role` (set during signup)
4. `AuthContext` listens to `onAuthStateChange` and fetches the profile
5. Profile fetch has retry logic (2 retries) and an 8-second safety timeout

### Attendance Flow
1. Student selects an active lecture from today's list
2. Captures selfie (front camera) → captures ID card photo (back camera)
3. Both images are previewed for confirmation
4. On submit: images uploaded to ImgBB in parallel → URLs saved to `attendance_logs` in Supabase
5. A UNIQUE INDEX on `(student_id, lecture_id)` prevents double attendance

---

## File-by-File Reference

### `/src/main.jsx`
Entry point. Renders `<BrowserRouter>` → `<AuthProvider>` → `<App />`.

### `/src/App.jsx`
- Defines all routes (public + protected)
- `RoleRedirect` component: redirects `/` to the correct dashboard based on user role
- Protected routes wrapped in `<PrivateRoute>` with optional `allowedRoles`
- Admin signup hidden at `/admin-secret-register-9921`
- Doctor and Admin share `AdminDashboard` (doctor has no delete permission)

### `/src/index.css`
- Tailwind v4 `@theme` block defines custom colors: `navy-50..900`, `gold-400..600`
- Font family: `Cairo`, `Inter`, system-ui
- Custom CSS classes: `.card`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success`, `.input-field`, `.spinner`, `.badge`, `.data-table`, `.stat-card`
- Keyframes: `fade-in`, `slide-up`, `spin`, `flash`
- Custom scrollbar styling

### `/src/lib/supabaseClient.js`
Creates and exports the Supabase client using env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Throws if missing.

### `/src/lib/imgbbUpload.js`
- `uploadToImgBB(base64Image, name)` — uploads single base64 image to ImgBB API
- `uploadDoubleSelfie(img1, img2)` — uploads both images in parallel, returns `{url1, url2}`
- Uses `VITE_IMGBB_API_KEY` env var

### `/src/contexts/AuthContext.jsx`
React Context providing auth state to the entire app:
- **State:** `user`, `profile`, `loading`, `profileError`
- **Methods:** `signUp`, `signIn`, `signOut`, `retryProfile`
- **Computed:** `isAdmin`, `isDoctor`, `isStudent` (boolean helpers)
- **Key behavior:** Defers profile fetch via `setTimeout(0)` to avoid Supabase RLS deadlock
- **Safety:** 8-second timeout forces `loading=false` to prevent infinite loading

### `/src/components/PrivateRoute.jsx`
Route guard component:
- If loading → shows spinner
- If no user → redirects to `/login`
- If `allowedRoles` specified and user role doesn't match → redirects to correct dashboard
- If profile not loaded yet → renders children (lets `RoleRedirect` handle error state)

### `/src/components/Layout.jsx`
Wrapper for authenticated pages: `Header` + `<Outlet />` + `Footer`. Max width `6xl`, RTL.

### `/src/components/Header.jsx`
Authenticated header: E-JUST logo + university name + user info (name, email, role badge) + sign out button. Sticky `top-0`.

### `/src/components/PublicHeader.jsx`
Simple header for Login/SignUp pages. Accepts `subtitle` and `accent` ("navy" or "red") props.

### `/src/components/Footer.jsx`
University name + "EduAttend" label + copyright year.

### `/src/components/ThemeToggle.jsx`
Dark/light mode toggle button with animated sun/moon. Persists choice to `localStorage`. **NOTE: Currently NOT used anywhere in the app.**

### `/src/components/LectureManager.jsx`
Full CRUD for lectures (used inside AdminDashboard):
- **Create:** Title, description, date, start/end time, optional weekly recurrence
- **Recurrence:** When enabled, auto-generates 4 weekly copies
- **Edit:** Pre-fills form with existing lecture data
- **Delete:** With confirmation dialog
- **Toggle active/inactive:** Eye icon to enable/disable lectures
- **Status:** Uses server time + Cairo timezone to determine: "نشطة الآن", "قادمة اليوم", "قادمة", "انتهت", "معطّلة"
- **Time comparison:** Uses `getCairoTimeHHMM()` and `getCairoDateISO()` helpers

### `/src/pages/Login.jsx`
Email + password form. Error messages in Arabic. Auto-redirects if already logged in.

### `/src/pages/SignUp.jsx`
Full name + university email + role selection (student/doctor) + password. **Email must end with `@ejust.edu.eg`** (client-side validation only). Redirects to login after 3 seconds.

### `/src/pages/AdminSignUp.jsx`
Same as SignUp but role is hardcoded to `admin`. Red-themed design. At secret URL.

### `/src/pages/StudentDashboard.jsx`
The most complex page (~307 lines):
- **Lecture list:** Shows today's lectures with status badges (active/upcoming/ended/attended)
- **Camera flow:** Step-by-step: select lecture → selfie (front cam) → ID card (back cam) → preview → submit
- **Camera features:** Flash effect, camera flip, step indicator, thumbnail preview
- **Submission:** Parallel upload to ImgBB → insert to `attendance_logs` with `lecture_id`
- **Attendance log:** Shows last 30 records with thumbnails
- **Status logic:** Uses `getCairoTimeHHMM()` to compare against lecture start/end times

### `/src/pages/AdminDashboard.jsx`
Admin/doctor control panel:
- **Stats cards:** Today's attendance, unique students, total records
- **LectureManager component** for lecture CRUD
- **Attendance table** with filters: search by name/email, filter by lecture, date range, "today only"
- **Image lightbox:** Click any photo to see full-size preview
- **Delete button:** Only visible for admin role (`isAdmin`)
- Doctor uses same page but without delete capability

---

## Database Schema

### Tables

**`profiles`** (auto-created via trigger on user signup):
- `id` UUID PK → references `auth.users(id)`
- `email` TEXT
- `full_name` TEXT
- `role` TEXT — one of: `'admin'`, `'doctor'`, `'student'`
- `created_at` TIMESTAMPTZ

**`attendance_logs`**:
- `id` UUID PK
- `student_id` UUID FK → `profiles(id)`
- `lecture_id` UUID FK → `lectures(id)` (nullable for legacy records)
- `image_1_url` TEXT (selfie)
- `image_2_url` TEXT (ID card)
- `created_at` TIMESTAMPTZ
- UNIQUE INDEX on `(student_id, lecture_id)` WHERE `lecture_id IS NOT NULL`

**`lectures`**:
- `id` UUID PK
- `title` TEXT
- `description` TEXT
- `lecture_date` DATE
- `start_time` TIME
- `end_time` TIME
- `is_recurring` BOOLEAN
- `recurring_day` INTEGER (0=Sunday..6=Saturday)
- `created_by` UUID FK → `profiles(id)`
- `is_active` BOOLEAN
- `created_at` TIMESTAMPTZ

### RLS (Row Level Security)

All tables have RLS enabled. Key policies:
- Students can only INSERT/SELECT their own attendance records
- Admins and doctors can SELECT all records
- Only admins can DELETE attendance records
- Anyone can SELECT lectures; only admins/doctors can INSERT/UPDATE/DELETE
- Helper functions `is_admin()`, `is_doctor()`, `is_admin_or_doctor()` use `SECURITY DEFINER` to avoid infinite recursion in RLS policies

### Triggers

- `on_auth_user_created`: After INSERT on `auth.users` → calls `handle_new_user()` → creates a `profiles` row with role from `raw_user_meta_data`

### Database Functions (RPC)

- `get_today_lectures()` — returns today's active lectures (Cairo timezone)
- `get_active_lectures_now()` — returns lectures happening right now (Cairo timezone)
- `get_server_time()` — returns `now()` as proper TIMESTAMPTZ
- `generate_recurring_lectures()` — generates 4 weekly copies of recurring lectures

---

## Environment Variables

```
VITE_SUPABASE_URL       — Supabase project URL
VITE_SUPABASE_ANON_KEY  — Supabase anonymous/public API key
VITE_IMGBB_API_KEY      — ImgBB API key for image uploads
```

All prefixed with `VITE_` so Vite exposes them to the client bundle.

---

## Key Design Decisions

1. **Cairo timezone explicitly in client code:** Time comparisons use `toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo' })` — never rely on browser timezone
2. **Double selfie verification:** Selfie (front cam) + ID card (back cam) to verify identity
3. **ImgBB for images:** Keeps Supabase storage costs low; only URLs stored in DB
4. **Admin signup via secret URL:** `/admin-secret-register-9921` — security through obscurity
5. **Doctor = read-only admin:** Same dashboard, but no delete button
6. **Profile fetch retry:** 2 retries with increasing delay (500ms, 1000ms) + 8s safety timeout
7. **SECURITY DEFINER functions:** Prevent infinite recursion when RLS policies need to check user roles

---

## Known Limitations & Security Notes

1. **Role is set from client metadata:** The `handle_new_user()` trigger reads role from `raw_user_meta_data` which is client-controlled. A malicious user could call `supabase.auth.signUp()` directly with `role: 'admin'`
2. **Email domain check is client-side only:** The `@ejust.edu.eg` restriction is only in React — can be bypassed via API
3. **ImgBB API key in client bundle:** Anyone can extract it from the JS bundle
4. **Admin URL is in the JS bundle:** The secret `/admin-secret-register-9921` route is discoverable
5. **No email verification enforced:** Users can log in immediately after signup
6. **No image verification:** No automated check that selfie matches student or that ID card is valid
7. **ThemeToggle component exists but is unused**

---

## Common Modifications

### Adding a new role
1. Update `role` CHECK constraint in `supabase_schema.sql`
2. Add role to `roleLabels` in `Header.jsx`
3. Add role option in `SignUp.jsx` roles array
4. Add route + redirect case in `App.jsx` (`RoleRedirect` switch + new Route)
5. Create RLS policies for the new role

### Adding a new page
1. Create component in `src/pages/`
2. Add route in `App.jsx` (wrap with `<PrivateRoute allowedRoles={[...]}>`)
3. Add navigation link in `Header.jsx` if needed

### Modifying the database
1. Update the relevant `.sql` file
2. Run the SQL in Supabase SQL Editor
3. Update RLS policies if needed

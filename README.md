# ZamQuiz (Web)

A React web version of the quiz app, backed by the same Supabase project as
the mobile app — students take subject quizzes, teachers create them, and
paid quizzes unlock via a simulated mobile-money payment step.

Your Supabase credentials are already wired in via `.env`:

```
REACT_APP_SUPABASE_URL=https://hbjddsvllblsbdlzgfmz.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<your anon key>
```

Create React App only exposes env vars prefixed `REACT_APP_` to the browser
bundle, and only reads them at build time — restart `npm start` (dev) or
re-run `npm run build` (prod) after changing `.env`.

## 1. Database

This uses the **same Supabase project** as the mobile app. If you haven't
already run `supabase-schema.sql` against it, do that first in the Supabase
SQL Editor. It includes the fix for a missing `profiles` `INSERT` policy —
without it, registration creates the auth user but silently fails to save
their name/grade/school, so if you're setting this project up fresh, don't
skip it.

## 2. Install & run locally

```bash
npm install
npm start
```

Opens at `http://localhost:3000`.

## 3. Deploy to GitHub Pages

`package.json` already has `homepage` set to
`https://1chaiwa.github.io/ZamQuiz` and the `gh-pages` package configured.

```bash
npm install
npm run deploy
```

This runs `predeploy` (build) then pushes the compiled `/build` folder to a
`gh-pages` branch of your repo — that's what GitHub Pages actually serves.
Your source branch (e.g. `main`) never needs the built files, and your local
`.env` never gets pushed anywhere (it's git-ignored) — only the *values*
baked into the compiled JS go out, which is fine: this is the anon key,
meant to be public, and your data stays protected by the RLS policies in
`supabase-schema.sql`.

In your repo settings → **Pages**, make sure the source is set to the
`gh-pages` branch (the `gh-pages` npm package creates/updates this branch
automatically the first time you run `npm run deploy`).

## Important fix: HashRouter, not BrowserRouter

The routing setup you had used `BrowserRouter`. On GitHub Pages there's no
server to rewrite unknown paths back to `index.html`, so any direct link or
page refresh on a route like `/ZamQuiz/quizzes` would 404. This project uses
`HashRouter` instead (`src/index.js`), so URLs look like
`https://1chaiwa.github.io/ZamQuiz/#/quizzes` — slightly less pretty, but it
always resolves correctly on static hosting with zero extra config. If you
later move this to a host that supports rewrites (Vercel, Netlify, your own
server), you can switch back to `BrowserRouter` and drop the `#`.

## Project structure

```
public/
  index.html
  manifest.json
  favicon.ico, logo192.png, logo512.png   # placeholder icons — swap for your logo
src/
  index.js              # HashRouter setup
  App.js                # route definitions + auth gate
  utils/supabase.js     # Supabase client, reads .env
  components/
    Login.js / Register.js / Auth.css
    Dashboard.js / Dashboard.css          # student home
    QuizList.js / QuizList.css
    QuizTaking.js / QuizTaking.css
    Payment.js / Payment.css
    Results.js / Results.css
    TeacherDashboard.js / TeacherDashboard.css
supabase-schema.sql
```

## Notes on how this differs from a straight port of the mobile app

The mobile (React Native) version passed a live callback function through
navigation params so the Payment screen could hand control back to
QuizTaking after paying. That only works because RN screens share the same
JS memory. On the web, each route is a full navigation, so:

- **QuizTaking** persists the in-progress attempt (id, answers, current
  question) to `sessionStorage`, keyed by quiz id. When the user is sent to
  `/payment/:quizId` and comes back, it resumes the same attempt instead of
  silently creating a duplicate one.
- **Results** first tries the score/details passed via navigation `state`
  (fast path right after submitting), and falls back to querying Supabase
  directly by `attemptId` if that's missing — e.g. if the results page gets
  refreshed or opened from a saved link.

## Known limitations (by design, not bugs)

- **Payments are simulated** — `Payment.js` fakes a 2-second delay and marks
  it complete. Swap in a real provider (MTN MoMo, Airtel Money, Flutterwave,
  DPO, etc.) before taking real money, ideally verifying payment
  server-side via a Supabase Edge Function rather than trusting the client.
- **Question type support** is multiple-choice only, matching what
  `TeacherDashboard.js` creates.
- Registration always creates `role: 'student'`. To test the Teacher
  Dashboard, sign up normally then run:
  ```sql
  UPDATE public.profiles SET role = 'teacher' WHERE id = '<user-uuid>';
  ```
- The placeholder icons in `public/` are generated orange squares — replace
  with your real logo.

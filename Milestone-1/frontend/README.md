# Milestone 1 — Extension Package

This package contains only the **new and modified files**. Drop each one into
the matching path inside your `src/` folder (overwriting the old version of
that file). Nothing outside these files needs to change — your `Home.jsx`,
`Login.jsx`, `Register.jsx`, `AuthContext.jsx`, `authService.js`,
`ProtectedRoute.jsx`, and `firebase.js` are untouched.

## File map

```
src/
├── App.jsx                          (updated — added ToastProvider + /projects/:id route)
├── services/
│   ├── projectService.js            (updated — added get/update/delete)
│   ├── siteService.js               (new)
│   ├── reportService.js             (new)
│   └── userService.js               (new)
├── context/
│   └── ToastContext.jsx             (new)
├── components/
│   ├── ui/
│   │   ├── Loader.jsx                (new)
│   │   ├── EmptyState.jsx            (new)
│   │   ├── ErrorState.jsx            (new)
│   │   └── ConfirmDialog.jsx         (new)
│   ├── layout/
│   │   ├── Sidebar.jsx               (new — extracted from your Dashboard, same markup)
│   │   └── DashboardLayout.jsx       (new — wraps sidebar + mobile nav)
│   ├── SiteFormModal.jsx             (new)
│   └── EditProjectModal.jsx          (new)
└── pages/
    ├── Dashboard.jsx                 (updated — real Firestore stats/activity)
    ├── Projects.jsx                  (updated — wired Edit/Delete/View)
    ├── ProjectDetails.jsx            (new — site management lives here)
    ├── CreateProject.jsx             (updated — toast feedback, validation)
    ├── SiteAnalysis.jsx              (updated — functional project/site/lat/lng → Firestore)
    ├── Reports.jsx                   (updated — lists real Firestore reports)
    └── Settings.jsx                  (updated — profile update, password change, logout)
```

## ⚠️ Required: Firestore composite indexes

Three service functions filter **and** order at the same time
(`where("projectId", "==", ...)` + `orderBy("createdAt", "desc")`):

- `siteService.getSites(projectId)`
- `reportService.getReports(projectId)`
- `projectService.getProjectsByUser(userEmail)`

Firestore requires a composite index for this combination. The first time you
run each of these in the browser, **the console error will contain a direct
link** to auto-create the missing index in Firebase Console — just click it,
wait ~1 minute, and retry. This is expected, not a bug.

## Design/architecture decisions worth knowing

1. **Sidebar was only on Dashboard before.** I extracted it into
   `components/layout/Sidebar.jsx` (identical markup/classes) and wrapped
   every protected page in `DashboardLayout` so navigation is available
   everywhere, plus a mobile hamburger menu that didn't exist before.
2. **Dashboard's 4th stat card** was "Avg. Suitability" (hardcoded 86%).
   Since the suitability-scoring engine is a later milestone and no real
   number exists yet, I replaced it with **Total Sites** — a real, live
   number — rather than keep a fake percentage. Easy to swap back once
   scoring exists.
3. **Site Analysis "Save Analysis"** and **Reports "Generate Report"** both
   write into the `reports` collection (`type: "site-analysis"` vs
   `type: "summary"`), per your stated 4-collection schema
   (`users`, `projects`, `sites`, `reports`) — no extra collections added.
4. **PDF export** is an honest placeholder (toast: "coming soon"), not a
   fake file download — real PDF generation needs a library decision
   (e.g. `jspdf` or a backend job) which felt like a separate task.
5. **Firestore `createdAt`** now uses `serverTimestamp()` instead of
   `new Date()` for consistency across all writes (projects, sites, reports).

## Not touched (still using your existing files as-is)

- `Authentication/firebase.js`, `AuthContext.jsx`, `authService.js`,
  `ProtectedRoute.jsx`
- `pages/Home.jsx`, `Login.jsx`, `Register.jsx`
- `tailwind.config.js`, color palette, fonts, animations — all unchanged

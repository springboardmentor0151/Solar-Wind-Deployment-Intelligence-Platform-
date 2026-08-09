# Frontend Changelog

> **Solar & Wind Deployment Intelligence Platform** — Frontend Application
>
> This document tracks all user-facing and internal changes to the React/Vite frontend, organized by release. Each release groups related enhancements, bug fixes, and UX improvements.

---

## Table of Contents

- [v1.10.0 — Google-Maps Style Site Location Picker](#v1100--google-maps-style-site-location-picker)
- [v1.9.0 — Prominent New Project / New Site Actions](#v190--prominent-new-project--new-site-actions)
- [v1.8.0 — Functional Quick Action Modals](#v180--functional-quick-action-modals)
- [v1.7.0 — Dashboard & Profile UX Enhancements](#v170--dashboard--profile-ux-enhancements)
- [v1.5.0 — 3D Inner Page Redesign](#v150--3d-inner-page-redesign)
- [v1.2.0 — Premium Animation Enhancements](#v120--premium-animation-enhancements)
- [v1.1.0 — Critical Bug Fixes](#v110--critical-bug-fixes)

---

## Unreleased

_Pending changes not yet assigned a version._

---

## v1.10.0 — Google-Maps Style Site Location Picker

**Release Date:** Latest

When creating a new deployment site, users no longer need to know latitude/longitude. They can now type a location name (powered by OpenStreetMap/Nominatim) and the platform auto-fills geographic details — just like Google Maps.

### Added
- Integrated the reusable `LocationSearch` component into the **Create New Site** form.
  - Prominent placement at the top of the form with a glowing cyan focus ring wrapper.
  - Helper text: *"Type a place name — coordinates, state & district are auto-filled."*

### Changed
- `Sites.jsx` — Added `handleLocationSelect` handler that auto-fills **latitude**, **longitude**, **state**, and **district** from the selected Nominatim result.
  - Coordinates are parsed directly from the search result.
  - State & district are parsed from the display name.
- `Sites.jsx` — Latitude/Longitude fields remain editable but are now auto-filled with placeholder `Auto-filled` so users don't type them manually.
- `Sites.jsx` — Location search is shown only in **create mode**; edit mode keeps the existing prefilled fields.

### Fixed
- Removed unused `Crosshair` import.
- Fixed `handleChange` indentation.

### Verified
- `npm run build` — 2892 modules transformed, zero errors, 2.13s ✅

---

## v1.9.0 — Prominent New Project / New Site Actions

**Release Date:** —

Made the primary creation actions more discoverable from the global navigation.

### Added
- `Navbar.jsx` — Gradient **New Project** and **New Site** CTA buttons (desktop, visible `md+`) that navigate to `/projects?new=1` and `/sites?new=1`.
- `Navbar.jsx` — **New Project** and **New Site** buttons added to the animated mobile menu.

### Changed
- `Projects.jsx` — Auto-opens the create-project form when `?new=1` is present (via `useSearchParams`).
- `Sites.jsx` — Auto-opens the create-site form when `?new=1` is present (via `useSearchParams`).

### Fixed
- Cleaned up unused `Sun`/`Wind` imports in `Navbar.jsx`.

### Verified
- `npm run build` — 2892 modules transformed, zero errors, 1.92s ✅

---

## v1.8.0 — Functional Quick Action Modals

**Release Date:** —

Replaced navigate-only quick actions on the Dashboard with fully functional modals that create resources directly.

### Added
- `components/ui/Modal.jsx` — New reusable animated glassmorphism modal component (backdrop blur, spring scale-in, fade-out exit).

### Changed
- `Dashboard.jsx` — **New Project** modal with form wired to `POST /projects/` (name, description, location, energy_type).
- `Dashboard.jsx` — **New Site** modal with form wired to `POST /sites/` (site_name, lat, lon, state, district, energy_type, project_id) and project dropdown loaded from `/projects/`.
- `Dashboard.jsx` — **Analyze Site** modal with `LocationSearch` wired to `POST /analysis/report` on selected coordinates.
- `Dashboard.jsx` — Quick Action cards now open modals directly (New Project / New Site / Analyze Site) instead of only navigating.
- `Dashboard.jsx` — Loading spinners on submit, success/error inline messages, auto-refresh of dashboard stats/lists after creation.

### Verified
- `npm run build` — 2892 modules transformed, zero errors, 2.67s ✅

---

## v1.7.0 — Dashboard & Profile UX Enhancements

**Release Date:** —

Improved the richness and task-orientation of the Dashboard and Profile pages.

### Changed
- `Dashboard.jsx` — Enriched Recent Activity feed with status badges, detail lines (energy type + location), and clock timestamps.
- `Dashboard.jsx` — Replaced generic Quick Actions with task-oriented actions: New Project, New Site, Analyze Site, Profile (4-column grid).
- `Profile.jsx` — Added a Quick Actions row (New Project, New Site, Analyze Site, Dashboard) using `navigate`.

### Verified
- `npm run build` — zero errors, all pages compile ✅

---

## v1.5.0 — 3D Inner Page Redesign

**Release Date:** —

Complete visual overhaul of all authenticated pages with 3D tilt cards, glassmorphism, and rich micro-animations.

### Added
- `hooks/useTilt.js` — Custom 3D tilt hook with spring-driven cursor tracking.
- `components/ui/TiltCard.jsx` — Reusable 3D tilt glass card with glare + depth layer.
- `components/ui/PageTransition.jsx` — 3D flip-down page entry animation.
- `layouts/AppLayout.jsx` — Wire `PageTransition` into all authenticated pages.
- `index.css` — 3D utility classes (`preserve-3d`, `perspective`, `translate-z`, `flip-in`, `float-lift`, `spin-3d`, `radar`, `orbital`).

### Changed
- `pages/Dashboard.jsx` — 3D tilt KPI cards, area chart, energy mix donut, live clock, animated counters, activity timeline.
- `pages/Projects.jsx` — 3D tilt project cards, search/filter/sort toolbar, animated form, empty states, loading skeletons.
- `pages/Sites.jsx` — 3D tilt site cards, interactive Leaflet map, search/filter toolbar, animated form, empty states.
- `pages/Analysis.jsx` — Animated score gauges, progress bars, deployment/forecast/investment callout cards, overall score hero.
- `pages/Profile.jsx` — 3D tilt stat cards, profile hero with gradient avatar, activity timeline, security + profile forms.
- `pages/ChangePassword.jsx` — Redesigned with glass card, security badge, consistent styling.

### Verified
- `npm run build` — 2891 modules transformed, zero errors, 2.16s ✅
- Backend running on port 8000 — API endpoints responding.
- Frontend dev server running on port 5173 — HMR updates applying cleanly.

---

## v1.2.0 — Premium Animation Enhancements

**Release Date:** —

Added a broad set of premium micro-animations across the landing experience and core components.

### Added
- `index.css` — Keyframes: `orbit`, `tilt`, `ripple`, `energy-pulse`, `blob`, `shine-sweep`, `swirl`, and more.

### Changed
- `Hero.jsx` — Mouse-parallax tilt, orbiting particles, animated gradient orb, staggered letter reveal.
- `Features.jsx` — 3D tilt-on-hover cards, icon spin, hover glow ring.
- `Stats.jsx` — Pulsing glow rings around counters.
- `Dashboard.jsx` — Staggered container animations, animated gradient borders, live pulse dots.
- `Button.jsx` — Shine sweep on hover.
- `Navbar.jsx` — Active pill glow, logo spin on hover.

### Verified
- `npm run build` — zero errors.
- `npm run lint` — 0 errors, 2 pre-existing warnings.

---

## v1.1.0 — Critical Bug Fixes

**Release Date:** —

Resolved runtime crashes and cleaned up unused code.

### Fixed
- `Analysis.jsx` — Added missing `MapPin` import (fixes runtime crash) + removed unused states.
- `Navbar.jsx` — Removed unused `Zap` import.
- `AuthLayout.jsx` — Removed unused `title` prop.
- `Dashboard.jsx` — Removed unused `chartColors`.

---

## Appendix — Connection & Login Fix (Diagnostic)

The following documents a diagnostic step that was performed (no code change required):

- Root cause of "invalid credentials" during login was the backend server not running.
- Frontend `api.js` was correctly configured to `http://127.0.0.1:8000` (no change needed).
- Backend CORS already allowed `http://localhost:5173` (no change needed).
- Started FastAPI backend on `127.0.0.1:8000` — login works with existing credentials.
- Verified backend reachable (200 OK) and login endpoint responsive.

# Presentation Materials - GeoEnergy AI Platform

This document presents the presentation slide outline and speaker notes for the **GeoEnergy AI – Smart Renewable Energy Intelligence Platform** project review.

---

## Slide 1: Title Slide
### GeoEnergy AI: Smart Clean Energy Siting Platform
- **Subtitle**: Enterprise Geospatial AI and Payback Intelligence for Solar, Wind, and Hybrid Power Siting.
- **Presenter**: Engineering Team

---

## Slide 2: Problem Statement
- **The Challenge**: Renewable energy project sitings suffer from fragmented data resources, slow GIS calculations, manually compiled environmental checklists, and a lack of cross-role visibility.
- **The Impact**: Delays in approvals, unexpected terrain slopes costs, and high rate-limit failure rates during weather lookup API bottlenecks.

---

## Slide 3: Solution & Objectives
- **Systematic Siting**: An interactive, role-based platform coordinating Planners, GIS Analysts, PMs, and Admins.
- **NASA Climatology**: On-demand point climatology calculations.
- **Machine Learning**: Random Forest classification predicting resource suitability in `<1ms`.
- **Financial Projections**: Payback estimation modeling Capex, Opex, LCOE, NPV, and ROI over 20 years.

---

## Slide 4: Technology Stack
- **React Frontend SPA**: Leaflet maps, Recharts payback graphs, dynamic toast notifications.
- **FastAPI Python Backend**: Asynchronous REST framework, Bcrypt credentials, JWT authentication, Google OAuth 2.0.
- **Database ORM**: SQLite / PostgreSQL mapped through SQLAlchemy.
- **Predictive Analytics**: Scikit-Learn suitability classifiers.

---

## Slide 5: Role-Based Workflow Pipeline
1. **Energy Planner**: Selects coordinates, saves site grid, runs ML predictions, and submits project.
2. **GIS Analyst**: Claims review, inspects slope elevation contours and nature reserve buffers, and approves coordinate grids.
3. **Project Manager**: Claims review, checks off development milestones checklist, and monitors payback economics.
4. **Administrator**: Manages accounts lists, monitors system audit logs, and authorizes final grid connections.

---

## Slide 6: Key Features & Demo Points
- **Claims System**: Self-assignment claiming and releasing of projects, solving 403 Forbidden errors.
- **Report Export Center**: Feasibility reports (Executive, Solar, Wind, Environmental) exported in PDF, Excel, and CSV format.
- **Fail-Safe Caching**: GIS API caching and 1.5s timeout fallbacks ensuring stable operations.

---

## Slide 7: Presentation Speaker Notes

### Slide 2 (Problem Statement)
> *"Welcome, everyone. Today, clean energy developers struggle to coordinate coordinate selections, GIS analytics, and PM checkoffs. Planners pick a site but then wait weeks for GIS reviews, only to find the site violates a wildlife zone. GeoEnergy AI coordinates this workflow in real time."*

### Slide 4 (Tech Stack)
> *"On the frontend, we use React + Leaflet to select coordinates directly from the map. On the backend, we run FastAPI. For predictions, we serialize our Random Forest suitability estimator to model.pkl, which we lazy load on first request to achieve sub-millisecond latencies."*

### Slide 6 (Claims System)
> *"We implemented a claiming model in Milestone 4. Planners submit coordinates. GIS Analysts can see unassigned reviews in their queue and click 'Claim review' to assign it to themselves, which updates the status and locks out edits from other analysts. If their queue is full, they can click 'Release review' to return it to the central queue."*

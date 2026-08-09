# Week 1 & 2 — Milestone 1: UI Wireframes & Workflow Planning

Low-fidelity wireframes for the screens Milestone 1 needs working end-to-end:
Login, Signup, Change Password, Project List, Site Management.

## Login
┌───────────────────────────────────────┐
│      Solar & Wind Deployment          │
│           Intelligence                │
│                                        │
│  [ Email                         ]    │
│  [ Password                      ]    │
│                                        │
│           [   Log In   ]              │
│                                        │
│   New here?  Create an account →      │
└───────────────────────────────────────┘

## Signup
┌───────────────────────────────────────┐
│           Create an account           │
│                                        │
│  [ Full name                     ]    │
│  [ Email                         ]    │
│  [ Password                      ]    │
│  [ Role: Planner ▾                ]    │
│                                        │
│           [   Register   ]            │
└───────────────────────────────────────┘

## Change Password (accessible once logged in)
┌───────────────────────────────────────┐
│           Change Password              │
│                                        │
│  [ Current password              ]    │
│  [ New password                  ]    │
│  [ Confirm new password          ]    │
│                                        │
│           [  Update Password  ]        │
└───────────────────────────────────────┘

## Project List (landing page after login)
┌──────────────────────────────────────────────────────────┐
│ Solar & Wind Deployment Intelligence  [Change PW][logout] │
├──────────────────────────────────────────────────────────┤
│  My Projects                          [ + New Project ]  │
│                                                            │
│  ┌────────────────────┐  ┌────────────────────┐          │
│  │ Rajasthan Solar Belt│  │ Gujarat Wind Corridor│         │
│  │ Region: Rajasthan   │  │ Region: Gujarat      │         │
│  │ [ Open ]            │  │ [ Open ]             │         │
│  └────────────────────┘  └────────────────────┘          │
└──────────────────────────────────────────────────────────┘

## Project Detail → Site Management
┌──────────────────────────────────────────────────────────┐
│ ← Rajasthan Solar Belt                                    │
├──────────────────────────────────────────────────────────┤
│  Sites                                  [ + Add Site ]    │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Site       Lat/Lon           Land Area   [Fetch env]│  │
│  │ Site A     26.91, 70.90      120 ha                  │  │
│  │ Site B     27.02, 71.10       80 ha                  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘


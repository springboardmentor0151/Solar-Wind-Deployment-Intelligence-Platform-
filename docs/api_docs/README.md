# API Documentation

The source of truth for the API is FastAPI's auto-generated interactive docs,
available once the backend is running:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Raw OpenAPI schema: http://localhost:8000/openapi.json

## Exporting a static copy for submission

If your internship requires a static file (e.g. for a report appendix):

```bash
curl http://localhost:8000/openapi.json -o docs/api_docs/openapi.json
```

## Endpoint summary (Milestone 1)

| Endpoint | Method | Auth required | Purpose |
|---|---|---|---|
| `/auth/register` | POST | No | Sign up |
| `/auth/login` | POST | No | Log in, returns JWT |
| `/auth/change-password` | POST | Yes | Change password (needs current password) |
| `/auth/me` | GET | Yes | Current user profile |
| `/projects/` | POST, GET | Yes | Create / list projects |
| `/projects/{id}` | GET | Yes | Get one project |
| `/projects/{id}/sites/` | POST, GET | Yes | Add / list sites |
| `/projects/{id}/sites/{id}` | GET | Yes | Get one site |
| `/projects/{id}/sites/{id}/environmental/fetch` | POST | Yes | Pull live NASA POWER data for the site |
| `/projects/{id}/sites/{id}/environmental/` | GET | Yes | List stored environmental readings |
# Testing Guide

## Overview

This project uses comprehensive testing to ensure reliability and quality. Tests are organized into backend (pytest) and frontend (Vitest) test suites.

## Backend Testing

### Setup

Tests are located in `backend/tests/` and use pytest with FastAPI's TestClient.

### Running Backend Tests

```bash
cd backend

# Install test dependencies
pip install pytest pytest-cov

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_api_auth.py

# Run specific test
pytest tests/test_api_auth.py::test_register_success

# Verbose output
pytest -v
```

### Test Structure

#### test_api_auth.py
Tests authentication flows:
- User registration
- User login
- JWT token validation
- Protected route access
- Invalid credentials handling

#### test_api_projects.py
Tests project management:
- Create project
- List projects
- Get project by ID
- Delete project
- Authorization checks
- Input validation

#### test_api_predictions.py
Tests ML prediction endpoints:
- Solar prediction
- Wind prediction
- Site score prediction
- Forecast generation
- Input validation
- Error handling

#### test_api_analytics.py
Tests analytics endpoints:
- Dashboard KPIs
- Project analytics
- Resource analytics
- Investment analytics
- Suitability distribution
- Empty database behavior

#### test_api_reports.py
Tests report generation:
- List reports
- Get report details
- PDF download
- Excel download
- Report content structure

#### test_analytics_service.py
Tests analytics service functions:
- Suitability classification
- Suitability bucketing

#### test_prediction_service.py
Tests prediction service logic:
- Forecast generation
- Prediction calculations

#### test_geocoding_service.py
Tests geocoding functionality:
- Address resolution
- Coordinate validation

### Writing New Tests

#### Example Test Structure

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base, get_db
from app.main import app

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_example.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
Base.metadata.create_all(bind=engine)
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_example():
    response = client.get("/api/health")
    assert response.status_code == 200
```

### Test Best Practices

1. **Use fixtures** for common setup (test users, auth headers)
2. **Isolate tests** - each test should be independent
3. **Clean up** - database is reset between tests
4. **Test edge cases** - empty data, invalid input, errors
5. **Test authorization** - verify protected routes
6. **Use descriptive names** - test names should describe what they test

## Frontend Testing

### Setup

Frontend tests are located in `frontend/src/__tests__/` and use Vitest with React Testing Library.

### Running Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- Login.test.jsx

# Run tests in watch mode
npm test -- --watch

# Run tests once (CI mode)
npm test -- --run
```

### Test Structure

#### Login.test.jsx
Tests login page:
- Form rendering
- Validation errors
- Invalid credentials
- Successful login
- Navigation after login

#### Dashboard.test.jsx
Tests dashboard page:
- KPI rendering
- Chart display
- Project list
- Investment analytics
- Error handling
- Empty states

#### Projects.test.jsx
Tests projects page:
- Project creation form
- Project list loading
- Project history table
- Environmental data display
- API error handling
- Loading states

#### GisMap.test.jsx
Tests GIS map page:
- Map rendering
- Site loading
- Filter controls
- Suitability filtering
- Technology filtering
- Error states

### Writing New Tests

#### Example Test Structure

```jsx
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Component from "../Component.jsx";

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: () => ({
    user: { id: 1, email: "test@example.com", name: "Test User" },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const mockApiGet = vi.fn();
vi.mock("../api/client.js", () => ({
  default: {
    get: (...args) => mockApiGet(...args),
  },
}));

describe("Component", () => {
  beforeEach(() => {
    mockApiGet.mockClear();
  });

  it("renders correctly", async () => {
    mockApiGet.mockResolvedValue({ data: {} });

    render(<Component />);
    
    await waitFor(() => {
      expect(screen.getByText("Expected Text")).toBeDefined();
    });
  });

  it("handles errors", async () => {
    mockApiGet.mockRejectedValue(new Error("API Error"));

    render(<Component />);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeDefined();
    });
  });
});
```

### Test Best Practices

1. **Mock API calls** - Use `vi.fn()` for axios client
2. **Wait for async** - Use `waitFor` for async operations
3. **Query by role** - Use `getByRole` for accessibility
4. **Query by label** - Use `getByLabelText` for form inputs
5. **Clean up mocks** - Use `beforeEach` to clear mocks
6. **Test user interactions** - Use `userEvent` for clicks, typing
7. **Mock AuthContext** - Always mock authentication context

## CI/CD Testing

### GitHub Actions Workflow

Tests run automatically on:
- Push to main branch
- Pull requests
- Manual trigger

### Test Pipeline

1. **Backend Tests:**
   - Set up Python 3.11
   - Install dependencies
   - Run pytest with coverage
   - Upload coverage reports

2. **Frontend Tests:**
   - Set up Node.js 20
   - Install dependencies
   - Run Vitest with coverage
   - Upload coverage reports

3. **Build Check:**
   - Build backend Docker image
   - Build frontend Docker image
   - Verify builds succeed

## Coverage Goals

- **Backend:** Minimum 80% coverage
- **Frontend:** Minimum 70% coverage

### Viewing Coverage Reports

#### Backend
```bash
pytest --cov=app --cov-report=html
# Open htmlcov/index.html in browser
```

#### Frontend
```bash
npm test -- --coverage
# Open coverage/index.html in browser
```

## Manual Testing

### End-to-End Testing Checklist

1. **Authentication:**
   - [ ] Register new user
   - [ ] Login with valid credentials
   - [ ] Login with invalid credentials
   - [ ] Logout
   - [ ] Access protected routes without login

2. **Projects:**
   - [ ] Create project with all fields
   - [ ] Create project with minimal fields
   - [ ] View project list
   - [ ] View project details
   - [ ] Delete project
   - [ ] Validation errors display

3. **Environmental Data:**
   - [ ] Select location on map
   - [ ] Environmental data loads
   - [ ] Data displays correctly
   - [ ] Invalid coordinates handled

4. **Predictions:**
   - [ ] Solar prediction runs
   - [ ] Wind prediction runs
   - [ ] Site score calculates
   - [ ] Forecast generates
   - [ ] Results display correctly

5. **Analytics:**
   - [ ] Dashboard loads
   - [ ] KPIs display correctly
   - [ ] Charts render
   - [ ] Filters work
   - [ ] Empty states show

6. **Reports:**
   - [ ] Report list loads
   - [ ] Report details display
   - [ ] PDF download works
   - [ ] Excel download works
   - [ ] Report content is complete

7. **GIS:**
   - [ ] Map loads
   - [ ] Sites display
   - [ ] Filters work
   - [ ] Popups show correct data
   - [ ] Empty state displays

8. **Responsive Design:**
   - [ ] Desktop layout
   - [ ] Tablet layout
   - [ ] Mobile layout
   - [ ] Navigation works on all sizes

## Debugging Tests

### Backend

```bash
# Run with debug output
pytest -s

# Run specific test with output
pytest tests/test_api_auth.py::test_register_success -s

# Drop into debugger on failure
pytest --pdb
```

### Frontend

```bash
# Run with debug output
npm test -- --reporter=verbose

# Run specific test
npm test -- Login.test.jsx
```

## Common Issues

### Backend Tests

**Issue:** Database locked errors
**Solution:** Ensure tests use isolated SQLite databases

**Issue:** Import errors
**Solution:** Run tests from backend directory

**Issue:** Fixture not found
**Solution:** Check fixture names match test function parameters

### Frontend Tests

**Issue:** "Cannot find module"
**Solution:** Ensure test files are in `__tests__` directory

**Issue:** Mock not working
**Solution:** Clear mocks in `beforeEach`

**Issue:** Async tests failing
**Solution:** Use `waitFor` and ensure proper async handling

## Performance Testing

### Backend Load Testing

Use tools like `locust` or `k6`:

```bash
# Install locust
pip install locust

# Run load test
locust -f load_test.py
```

### Frontend Performance

Use Lighthouse CI:
```bash
npm install -g @lhci/cli
lhci autorun
```

## Security Testing

### Backend

- Test authentication bypass
- Test authorization checks
- Test input validation
- Test SQL injection prevention
- Test XSS prevention

### Frontend

- Test XSS prevention
- Test CSRF protection
- Test secure token storage
- Test input sanitization
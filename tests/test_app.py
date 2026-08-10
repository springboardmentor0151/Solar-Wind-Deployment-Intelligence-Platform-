import unittest

from app import create_app, db
class RenewablePlatformTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config.update(TESTING=True, SQLALCHEMY_DATABASE_URI='sqlite:///:memory:')
        self.client = self.app.test_client()

        with self.app.app_context():
            db.drop_all()
            db.create_all()

    def test_home_page_is_accessible(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)

    def test_user_can_register_and_login(self):
        response = self.client.post('/register', data={
            'username': 'planner1',
            'email': 'planner1@example.com',
            'password': 'secret123',
            'role': 'planner',
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Welcome, planner1', response.data)

        response = self.client.post('/login', data={
            'username': 'planner1',
            'password': 'secret123',
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Dashboard', response.data)

    def test_planner_can_create_project(self):
        self.client.post('/register', data={
            'username': 'planner1',
            'email': 'planner1@example.com',
            'password': 'secret123',
            'role': 'planner',
        })
        self.client.post('/login', data={
            'username': 'planner1',
            'password': 'secret123',
        })

        response = self.client.post('/projects', data={
            'name': 'Solar Ridge',
            'region': 'North Region',
            'description': 'High irradiance study area',
            'status': 'Planned',
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Solar Ridge', response.data)

    def test_authenticated_user_navigation_and_redirects(self):
        # 1. Check anonymous user sees Login and Register links
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'href="/register"', response.data)
        self.assertIn(b'href="/login"', response.data)
        self.assertNotIn(b'href="/logout"', response.data)

        # 2. Register and login
        self.client.post('/register', data={
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password': 'password123',
            'role': 'planner',
        })
        self.client.post('/login', data={
            'username': 'testuser',
            'password': 'password123',
        })

        # 3. Check authenticated user redirects from login/register/home
        response = self.client.get('/login')
        self.assertEqual(response.status_code, 302)
        self.assertIn('/dashboard', response.headers.get('Location', ''))

        response = self.client.get('/register')
        self.assertEqual(response.status_code, 302)
        self.assertIn('/dashboard', response.headers.get('Location', ''))

        response = self.client.get('/')
        self.assertEqual(response.status_code, 302)
        self.assertIn('/dashboard', response.headers.get('Location', ''))

        # 4. Check dashboard nav contains Dashboard and Logout, but not Register or Login
        response = self.client.get('/dashboard')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'href="/logout"', response.data)
        self.assertIn(b'href="/dashboard"', response.data)
        self.assertNotIn(b'href="/register"', response.data)
        self.assertNotIn(b'href="/login"', response.data)

    def test_dashboard_nav_uses_defensive_switchtab_fallback(self):
        self.client.post('/register', data={
            'username': 'navuser',
            'email': 'navuser@example.com',
            'password': 'password123',
            'role': 'planner',
        })
        self.client.post('/login', data={
            'username': 'navuser',
            'password': 'password123',
        })

        response = self.client.get('/dashboard/projects')
        self.assertEqual(response.status_code, 200)
        html = response.get_data(as_text=True)
        self.assertIn('Projects', html)
        self.assertIn('id="tab-projects"', html)
        self.assertIn('class="tab-content active"', html)
        self.assertIn('typeof window.switchTab', html)
        self.assertIn("window.location.href", html)

    def test_site_registration_and_analysis_simulation(self):
        # Register and login
        self.client.post('/register', data={
            'username': 'planner2',
            'email': 'planner2@example.com',
            'password': 'secret123',
            'role': 'planner',
        })
        self.client.post('/login', data={
            'username': 'planner2',
            'password': 'secret123',
        })
        
        # Create a project
        self.client.post('/projects', data={
            'name': 'Project Alpha',
            'region': 'Oregon Coast',
            'description': 'Coastal energy potentials',
            'status': 'Planned',
        })
        
        # Register a site for Project Alpha
        response = self.client.post('/api/sites', json={
            'project_id': 1,
            'name': 'Oregon Site A',
            'latitude': 44.5,
            'longitude': -124.0,
            'land_area': 12.0,
            'land_ownership': 'Public'
        })
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertEqual(data['name'], 'Oregon Site A')
        self.assertIn('overall_score', data)
        self.assertIn('category', data)
        
        # Retrieve site details
        site_id = data['id']
        response = self.client.get(f'/api/sites/{site_id}')
        self.assertEqual(response.status_code, 200)
        details = response.get_json()
        self.assertEqual(details['name'], 'Oregon Site A')
        self.assertEqual(details['land_ownership'], 'Public')
        self.assertIn('environmental', details)
        self.assertIn('suitability', details)
        self.assertIn('forecasts', details)
        
        # Recalculate suitability with custom weights
        response = self.client.post(f'/api/recalculate-suitability/{site_id}', json={
            'resource_weight': 50,
            'geographic_weight': 10,
            'infrastructure_weight': 10,
            'environmental_weight': 10,
            'economic_weight': 20
        })
        self.assertEqual(response.status_code, 200)
        recalc = response.get_json()
        self.assertIn('overall_score', recalc)
        self.assertIn('category', recalc)

    def test_project_deployment_optimization(self):
        # Register and login
        self.client.post('/register', data={
            'username': 'planner3',
            'email': 'planner3@example.com',
            'password': 'secret123',
            'role': 'planner',
        })
        self.client.post('/login', data={
            'username': 'planner3',
            'password': 'secret123',
        })
        
        # Create a project
        self.client.post('/projects', data={
            'name': 'Project Beta',
            'region': 'Oregon Coast',
            'description': 'Coastal energy potentials',
            'status': 'Planned',
        })
        
        # Register Site A
        self.client.post('/api/sites', json={
            'project_id': 1,
            'name': 'Oregon Site A',
            'latitude': 44.5,
            'longitude': -124.0,
            'land_area': 12.0,
            'land_ownership': 'Public'
        })
        
        # Register Site B
        self.client.post('/api/sites', json={
            'project_id': 1,
            'name': 'Oregon Site B',
            'latitude': 45.0,
            'longitude': -123.5,
            'land_area': 20.0,
            'land_ownership': 'Private'
        })
        
        # Call optimize endpoint
        response = self.client.post('/api/projects/1/optimize', json={
            'target_capacity_mw': 10.0,
            'discount_rate': 8.0,
            'tariff': 0.08,
            'storage_capacity_mwh': 5.0
        })
        
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('summary', data)
        self.assertIn('ranked_sites', data)
        self.assertIn('selected_sites', data)
        self.assertIn('phases', data)
        
        # Verify summary details
        summary = data['summary']
        self.assertGreater(summary['total_capex'], 0)
        self.assertGreater(summary['total_npv'], 0)
        self.assertGreater(summary['avg_irr'], 0)
        self.assertEqual(summary['target_capacity_mw'], 10.0)
        self.assertGreaterEqual(summary['actual_capacity_mw'], 0.0)
        self.assertEqual(summary['storage_capacity_mwh'], 5.0)
        
        # Verify site counts
        self.assertEqual(len(data['ranked_sites']), 2)
        self.assertGreater(len(data['selected_sites']), 0)
        self.assertGreater(len(data['phases']), 0)

    def test_dashboard_summary_returns_milestone_3_metrics(self):
        self.client.post('/register', data={
            'username': 'dashboarduser',
            'email': 'dashboard@example.com',
            'password': 'password123',
            'role': 'planner',
        })
        self.client.post('/login', data={
            'username': 'dashboarduser',
            'password': 'password123',
        })

        self.client.post('/projects', data={
            'name': 'Dashboard Project',
            'region': 'Central Valley',
            'description': 'Dashboard analytics demo',
            'status': 'Planned',
        })

        self.client.post('/api/sites', json={
            'project_id': 1,
            'name': 'Dashboard Site',
            'latitude': 36.0,
            'longitude': -119.5,
            'land_area': 18.0,
            'land_ownership': 'Public'
        })

        response = self.client.get('/api/dashboard/summary')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['project_count'], 1)
        self.assertEqual(data['site_count'], 1)
        self.assertIn('suitability_summary', data)
        self.assertIn('forecast_summary', data)
        self.assertIn('optimization_recommendations', data)

    def test_dashboard_tab_and_profile_routes_render_dashboard(self):
        self.client.post('/register', data={
            'username': 'routinguser',
            'email': 'routing@example.com',
            'password': 'password123',
            'role': 'planner',
        })
        self.client.post('/login', data={
            'username': 'routinguser',
            'password': 'password123',
        })

        response = self.client.get('/dashboard/projects')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'tab-projects', response.data)

        response = self.client.get('/profile')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Edit User Profile', response.data)

    def test_user_profile_management(self):
        # Register and login
        self.client.post('/register', data={
            'username': 'profileuser',
            'email': 'profile@example.com',
            'password': 'password123',
            'role': 'planner',
        })
        self.client.post('/login', data={
            'username': 'profileuser',
            'password': 'password123',
        })
        
        # 1. Retrieve profile details
        response = self.client.get('/api/profile')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['username'], 'profileuser')
        self.assertEqual(data['email'], 'profile@example.com')
        self.assertEqual(data['role'], 'planner')
        
        # 2. Update profile details
        response = self.client.put('/api/profile', json={
            'username': 'updateduser',
            'email': 'newprofile@example.com',
            'password': 'newpassword123'
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['username'], 'updateduser')
        self.assertEqual(data['email'], 'newprofile@example.com')
        
        # 3. Verify changes persist via login
        self.client.get('/logout')
        response = self.client.post('/login', data={
            'username': 'updateduser',
            'password': 'newpassword123',
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Welcome, updateduser', response.data)




if __name__ == '__main__':
    unittest.main()

# User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Registration & Login](#user-registration--login)
3. [Dashboard Overview](#dashboard-overview)
4. [Creating a Project](#creating-a-project)
5. [Location Selection](#location-selection)
6. [Environmental Data](#environmental-data)
7. [AI Predictions](#ai-predictions)
8. [GIS Visualization](#gis-visualization)
9. [Reports](#reports)
10. [Analytics](#analytics)
11. [Settings](#settings)

## Getting Started

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for map and external data services
- JavaScript enabled

### Accessing the Platform

1. Open your browser and navigate to: `http://localhost:8080`
2. You'll see the login page
3. If you don't have an account, click "Register" to create one

## User Registration & Login

### Registration

1. Click the "Register" link on the login page
2. Fill in the registration form:
   - **Full Name:** Your full name
   - **Email Address:** Your email (used for login)
   - **Password:** Choose a strong password (minimum 6 characters)
3. Click "Register"
4. You'll be automatically logged in and redirected to the Dashboard

### Login

1. Enter your email and password
2. Click "Login"
3. You'll be redirected to the Dashboard

### Logout

1. Click on your profile icon in the top navigation
2. Select "Logout"

## Dashboard Overview

The Dashboard provides a comprehensive overview of all your renewable energy projects and analytics.

### Key Performance Indicators (KPIs)

The dashboard displays the following KPIs:

**Project KPIs:**
- **Total Projects:** Number of projects created
- **Analyzed Sites:** Number of sites with complete analysis
- **Suitable Sites:** Sites with suitability score ≥ 62%
- **Highly Suitable:** Sites with suitability score ≥ 80%
- **Average Site Score:** Average suitability across all projects

**Renewable KPIs:**
- **Solar Potential:** Average solar potential percentage
- **Wind Potential:** Average wind potential percentage
- **Estimated Capacity:** Total capacity in MW
- **Estimated Generation:** Total annual energy generation in MWh
- **Recommended Technology:** Most recommended technology type

**Investment KPIs:**
- **Estimated Investment:** Total project cost estimate
- **Estimated ROI:** Average return on investment
- **Investment Rating:** Technology with best investment potential

### Charts

**Suitability Distribution:**
- Shows how many sites fall into each category (High, Medium, Low, Unsuitable)

**Technology Comparison:**
- Compares Solar, Wind, and Hybrid project counts

**Environmental Factors:**
- Displays average environmental conditions across all projects

**Investment Analytics:**
- Average ROI
- Investment Score
- Capacity Factor
- Annual Generation

### Latest Projects

Shows the 6 most recent projects with:
- Project name
- Region
- Project type
- Suitability score

## Creating a Project

### Step 1: Project Details

1. Navigate to "Projects" from the main menu
2. Fill in the project details form:
   - **Project Name:** Give your project a descriptive name
   - **Project Type:** Select Solar, Wind, or Hybrid
   - **Region:** Enter the region/location name
   - **Capacity (MW):** Enter the planned capacity in megawatts
   - **Description:** Optional detailed description

### Step 2: Location Selection

1. Click on the interactive map to select your deployment site
2. The map will show:
   - Your selected location (marker)
   - Latitude and longitude coordinates
   - Resolved address (automatically fetched)

### Step 3: Environmental Data

Once you select a location, the system automatically fetches:
- Solar irradiance (kWh/m²/day)
- Wind speed (m/s)
- Wind direction (degrees)
- Temperature (°C)
- Humidity (%)
- Rainfall (mm)
- Cloud cover (%)
- Elevation (m)
- Land slope (degrees)
- Vegetation index (NDVI)
- Distance to roads (km)
- Distance to substations (km)
- Distance to transmission lines (km)

### Step 4: AI Predictions

After environmental data loads, predictions run automatically:

**Solar Potential:**
- Solar potential score (0-100%)
- Energy generation forecast
- Capacity factor
- Performance ratio

**Wind Potential:**
- Wind potential score (0-100%)
- Energy generation forecast
- Capacity factor
- Performance ratio

**Site Suitability:**
- Overall suitability score (0-100%)
- Investment score
- ROI estimate
- Deployment recommendation
- Technology recommendation
- Confidence score

**12-Month Forecast:**
- Monthly energy generation projections
- Solar, wind, and hybrid scenarios

### Step 5: Save Project

1. Review all the data and predictions
2. Click "Save Project" to store the complete analysis
3. The project will appear in your project list and dashboard

## Location Selection

### Using the Map

1. **Navigate:** Use mouse to pan, scroll to zoom
2. **Select:** Click anywhere on the map to select a location
3. **Coordinates:** Latitude and longitude update automatically
4. **Address:** System resolves the address automatically

### Map Features

- **OpenStreetMap tiles:** High-quality base maps
- **Markers:** Selected locations are marked
- **Popup info:** Click markers to see location details

## Environmental Data

### Data Sources

Environmental data is fetched from multiple sources:
- **NASA POWER API:** Solar irradiance, temperature, rainfall
- **OpenStreetMap:** Infrastructure data
- **Elevation APIs:** Terrain data
- **Weather APIs:** Wind, humidity, cloud cover

### Data Interpretation

**Solar Irradiance (kWh/m²/day):**
- Excellent: > 6.0
- Good: 5.0 - 6.0
- Moderate: 4.0 - 5.0
- Poor: < 4.0

**Wind Speed (m/s):**
- Excellent: > 7.0
- Good: 5.0 - 7.0
- Moderate: 3.0 - 5.0
- Poor: < 3.0

**Elevation (m):**
- Low: < 500
- Moderate: 500 - 1500
- High: > 1500

## AI Predictions

### Solar Prediction

Calculates solar potential based on:
- Solar irradiance
- Cloud cover
- Land slope
- Access to infrastructure
- Rainfall patterns

**Output:**
- Solar potential score (0-100%)
- Annual energy output (MWh)
- Capacity factor (%)
- Performance ratio (%)

### Wind Prediction

Calculates wind potential based on:
- Wind speed
- Wind direction
- Land slope
- Grid proximity
- Access roads

**Output:**
- Wind potential score (0-100%)
- Annual energy output (MWh)
- Capacity factor (%)
- Wind power density (W/m²)

### Site Suitability

Combines all factors to provide:
- Overall suitability score (0-100%)
- Investment score (0-100%)
- ROI estimate (%)
- Deployment recommendation
- Technology recommendation

**Classification:**
- **Highly Suitable (80-100%):** Proceed to detailed engineering
- **Suitable (62-79%):** Proceed with field validation
- **Moderately Suitable (45-61%):** Consider after mitigation
- **Low Suitability (30-44%):** Not recommended
- **Not Suitable (< 30%):** Do not prioritize

### Forecast Generation

Provides 12-month energy forecast:
- Monthly solar generation (MWh)
- Monthly wind generation (MWh)
- Monthly hybrid generation (MWh)
- Accounts for seasonal variations

## GIS Visualization

### Accessing GIS Map

1. Navigate to "GIS Map" from the main menu
2. The map displays all analyzed sites

### Map Features

**Color Coding:**
- 🟢 Green: High suitability
- 🟡 Yellow: Medium suitability
- 🟠 Orange: Low suitability
- 🔴 Red: Unsuitable
- ⚪ Gray: No data

**Icon Shapes:**
- Circle: Solar projects
- Square: Wind projects
- Diamond: Hybrid projects

### Filters

**Suitability Level:**
- All
- High
- Medium
- Low
- Unsuitable
- No data

**Technology Type:**
- All
- Solar
- Wind
- Hybrid

### Site Information

Click on any marker to see:
- Project name
- Project type
- Suitability level
- Coordinates
- Suitability score
- Solar/Wind scores
- Technology recommendation
- Capacity (MW)
- Annual generation (MWh)
- ROI estimate
- Environmental data

### Reset Map

Click "Reset Map" to:
- Clear all filters
- Fit all sites in view
- Return to default zoom level

## Reports

### Accessing Reports

1. Navigate to "Reports" from the main menu
2. View all generated reports

### Report Types

**Project Summary Report:**
- Project information
- Environmental assessment
- Renewable assessment
- Deployment recommendation
- 12-month forecast
- Final recommendation

### Generating Reports

Reports are automatically generated when you:
1. Create a project
2. Complete all predictions
3. Save the project

### Viewing Reports

1. Select a project from the dropdown
2. View the complete report details:
   - Project Information
   - Environmental Assessment
   - Renewable Assessment
   - Deployment Recommendation
   - Forecast Data
   - Final Recommendation

### Downloading Reports

**PDF Report:**
1. Click "PDF" button next to the report
2. File downloads automatically
3. Includes formatted report with all details

**Excel Report:**
1. Click "Excel" button next to the report
2. File downloads automatically
3. Includes all data in spreadsheet format

### Report Content

**Project Information:**
- Project name, type, region
- Capacity (MW)
- Location (lat/long, address)
- Assessment date

**Environmental Assessment:**
- Solar irradiance
- Wind speed and direction
- Temperature, humidity, rainfall
- Elevation, land slope
- Vegetation index
- Infrastructure proximity

**Solar Assessment:**
- Solar potential score
- Classification
- Estimated generation
- Recommendation

**Wind Assessment:**
- Wind potential score
- Classification
- Estimated generation
- Recommendation

**Site Suitability:**
- Environmental score
- Solar score
- Wind score
- GIS score
- Infrastructure score
- Final suitability score

**Forecast:**
- 12-month energy generation forecast
- Monthly breakdown

**Investment Analysis:**
- CAPEX estimate
- Annual generation
- Revenue estimate
- ROI
- Payback period
- Investment recommendation

**Final Recommendation:**
- Classification (Highly Suitable, Suitable, etc.)
- Detailed recommendation text

## Analytics

### Dashboard Analytics

The main dashboard provides:
- Real-time KPI updates
- Interactive charts
- Project summaries
- Investment analytics

### Project Analytics

View detailed analytics for each project:
- Suitability scores
- Technology recommendations
- Capacity and generation
- Investment metrics

### Resource Analytics

Analyze renewable resources:
- Solar potential trends
- Wind potential trends
- Technology mix
- Capacity factors

### Investment Analytics

Financial analysis including:
- Total capacity
- Cost estimates
- Revenue projections
- ROI analysis
- Payback periods

### Suitability Analytics

Distribution analysis:
- Site classifications
- Average scores
- Site counts by category

### Trend Analytics

Track performance over time:
- Suitability trends
- Generation trends
- ROI trends
- Project comparisons

## Settings

### Profile Settings

1. Click on your profile icon
2. Select "Settings"
3. Update your profile information

### Preferences

Configure:
- Notification preferences
- Display settings
- Map preferences

### Account Management

- Change password
- View account details
- Delete account (with project deletion)

## Tips and Best Practices

### Project Creation

1. **Choose locations carefully:** Consider solar/wind resources, infrastructure, and accessibility
2. **Use realistic capacity:** Base capacity on actual needs and site potential
3. **Review predictions:** Analyze all prediction metrics before saving
4. **Compare sites:** Create multiple projects to compare different locations

### Data Interpretation

1. **Suitability Score:** Primary metric for site selection
2. **ROI Estimate:** Financial viability indicator
3. **Confidence Score:** Reliability of predictions
4. **Technology Recommendation:** Optimal technology for the site

### Report Usage

1. **Share reports:** Download and share with stakeholders
2. **Compare reports:** Generate reports for multiple sites
3. **Archive reports:** Keep records for future reference
4. **Use for planning:** Base investment decisions on report data

### GIS Map Usage

1. **Filter effectively:** Use filters to focus on relevant sites
2. **Compare locations:** View multiple sites simultaneously
3. **Check details:** Click markers for comprehensive data
4. **Plan routes:** Use infrastructure data for planning

## Troubleshooting

### Common Issues

**Map not loading:**
- Check internet connection
- Refresh the page
- Clear browser cache

**Environmental data not loading:**
- Verify coordinates are valid
- Check API status
- Try a different location

**Predictions not running:**
- Ensure all required data is present
- Check project type is selected
- Verify capacity is greater than 0

**Reports not generating:**
- Ensure project has complete data
- Check browser console for errors
- Try downloading again

**Slow performance:**
- Reduce number of projects
- Clear browser cache
- Check internet connection

### Getting Help

If you encounter issues:
1. Check the error message displayed
2. Review this user guide
3. Contact system administrator
4. Check API documentation (for developers)

## Keyboard Shortcuts

- **Ctrl/Cmd + K:** Focus search (if available)
- **Esc:** Close modals/dialogs
- **Tab:** Navigate between form fields

## Mobile Usage

The platform is responsive and works on mobile devices:
- Touch to select map locations
- Swipe to navigate
- Pinch to zoom map
- Scroll to view content

Note: For best experience, use desktop for complex analysis and report generation.
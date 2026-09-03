# Deployment Guide

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

## Quick Start with Docker Compose

### 1. Clone the Repository
```bash
git clone <repository-url>
cd solar_wind_farm
```

### 2. Configure Environment Variables

Copy the example environment files:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` and update the following:
- `SECRET_KEY`: Generate a secure random key for production
- `DATABASE_URL`: Update if using external PostgreSQL
- `CORS_ORIGINS`: Add your frontend domain

### 3. Start the Application
```bash
docker-compose up --build
```

### 4. Access the Application
- Frontend: http://localhost:8080
- Backend API: http://localhost:8000/api
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/health

### 5. Stop the Application
```bash
docker-compose down
```

To stop and remove all data:
```bash
docker-compose down -v
```

## Manual Deployment

### Backend Deployment

#### 1. Install Dependencies
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

#### 3. Initialize Database
```bash
python -m app.db.init_db
```

#### 4. Run with Gunicorn (Production)
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

Or with Uvicorn (Development):
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend Deployment

#### 1. Install Dependencies
```bash
cd frontend
npm install
```

#### 2. Configure Environment
```bash
cp .env.example .env
# Update VITE_API_BASE_URL to your backend URL
```

#### 3. Build for Production
```bash
npm run build
```

#### 4. Serve with Nginx
The build output will be in `frontend/dist/`. Configure Nginx to serve this directory.

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Cloud Deployment

### AWS Deployment

#### Using ECS (Elastic Container Service)

1. **Push images to ECR:**
```bash
# Build and tag images
docker-compose build

# Tag for ECR
docker tag solar-wind-farm-backend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/solar-wind-backend:latest
docker tag solar-wind-farm-frontend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/solar-wind-frontend:latest

# Push to ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/solar-wind-backend:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/solar-wind-frontend:latest
```

2. **Create RDS PostgreSQL Instance:**
   - Use PostgreSQL 16 with PostGIS extension
   - Configure security groups to allow access from ECS tasks
   - Update DATABASE_URL in backend environment variables

3. **Create ECS Task Definitions:**
   - Backend task: Use backend image, configure environment variables
   - Frontend task: Use frontend image, configure VITE_API_BASE_URL

4. **Create ECS Service:**
   - Configure load balancer
   - Set desired task count
   - Configure auto-scaling

#### Using EC2

1. **Launch EC2 Instance:**
   - Amazon Linux 2 or Ubuntu
   - Install Docker and Docker Compose
   - Open ports 80, 443, 22

2. **Deploy Application:**
```bash
# Clone repository
git clone <repository-url>
cd solar_wind_farm

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with production values

# Start application
docker-compose up -d
```

3. **Configure Security Groups:**
   - Allow HTTP (80) and HTTPS (443)
   - Allow SSH (22) from trusted IPs

### Azure Deployment

#### Using Azure Container Instances

1. **Create Azure Container Registry:**
```bash
az acr create --name <registry-name> --resource-group <resource-group> --sku Basic
```

2. **Build and Push Images:**
```bash
docker-compose build
az acr login --name <registry-name>
docker tag solar-wind-farm-backend:latest <registry-name>.azurecr.io/solar-wind-backend:latest
docker tag solar-wind-farm-frontend:latest <registry-name>.azurecr.io/solar-wind-frontend:latest
docker push <registry-name>.azurecr.io/solar-wind-backend:latest
docker push <registry-name>.azurecr.io/solar-wind-frontend:latest
```

3. **Create Azure Database for PostgreSQL:**
```bash
az postgres flexible-server create \
  --resource-group <resource-group> \
  --name <server-name> \
  --location <location> \
  --admin-user postgres \
  --admin-password <password> \
  --sku-name B_Gen5_2
```

4. **Deploy Containers:**
```bash
az container create \
  --resource-group <resource-group> \
  --name backend \
  --image <registry-name>.azurecr.io/solar-wind-backend:latest \
  --cpu 2 --memory 4 \
  --environment-variables DATABASE_URL=<connection-string> \
  --ports 8000
```

### Google Cloud Platform (GCP)

#### Using Cloud Run

1. **Build and Push to Google Container Registry:**
```bash
gcloud builds submit --tag gcr.io/<project-id>/solar-wind-backend ./backend
gcloud builds submit --tag gcr.io/<project-id>/solar-wind-frontend ./frontend
```

2. **Create Cloud SQL PostgreSQL Instance:**
```bash
gcloud sql instances create solar-wind-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1
```

3. **Deploy to Cloud Run:**
```bash
gcloud run deploy solar-wind-backend \
  --image gcr.io/<project-id>/solar-wind-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=<connection-string>

gcloud run deploy solar-wind-frontend \
  --image gcr.io/<project-id>/solar-wind-frontend \
  --platform managed \
  --region us-central1
```

## Environment Variables

### Backend (.env)
```env
# Required
SECRET_KEY=your-secure-secret-key-here
DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/dbname

# Optional
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
MONGODB_URL=mongodb://localhost:27017
NASA_POWER_API=your_api_key
```

### Frontend (.env)
```env
VITE_API_BASE_URL=https://api.your-domain.com/api
```

## SSL/TLS Configuration

### Using Let's Encrypt with Nginx

1. **Install Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx
```

2. **Obtain Certificate:**
```bash
sudo certbot --nginx -d your-domain.com
```

3. **Auto-renewal:**
```bash
sudo certbot renew --dry-run
```

## Monitoring and Logging

### Backend Logging

The application uses Python's logging module. Configure log level in `.env`:
```env
ENVIRONMENT=production  # Sets log level to WARNING
# or
ENVIRONMENT=development  # Sets log level to INFO
```

### Docker Logs

View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Health Checks

Monitor application health:
```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "healthy": true,
  "service": "renewable-platform"
}
```

## Backup and Recovery

### Database Backup

#### PostgreSQL
```bash
# Backup
pg_dump -U postgres renewables_platform > backup.sql

# Restore
psql -U postgres renewables_platform < backup.sql
```

#### Automated Backups with Docker
```bash
# Add to crontab
0 2 * * * docker exec renewables-postgres pg_dump -U postgres renewables_platform > /backups/db_$(date +\%Y\%m\%d).sql
```

## Scaling

### Horizontal Scaling

#### Backend
```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3
```

#### Database
- Use read replicas for read-heavy workloads
- Implement connection pooling (PgBouncer)
- Consider database sharding for very large datasets

### Performance Optimization

1. **Backend:**
   - Enable Redis caching for frequent queries
   - Use CDN for static assets
   - Implement database query optimization
   - Enable gzip compression

2. **Frontend:**
   - Enable CDN for static assets
   - Implement lazy loading
   - Use service workers for offline support
   - Optimize bundle size

## Security Checklist

- [ ] Change default SECRET_KEY
- [ ] Use strong database passwords
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure CORS properly (no wildcards in production)
- [ ] Enable firewall rules
- [ ] Regular security updates
- [ ] Use environment variables for all secrets
- [ ] Implement rate limiting
- [ ] Enable database encryption at rest
- [ ] Regular backups
- [ ] Monitor for suspicious activity
- [ ] Use non-root users in Docker containers

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Test connection
docker exec -it renewables-postgres psql -U postgres -d renewables_platform
```

### Backend Issues
```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Rebuild backend
docker-compose up -d --build backend
```

### Frontend Issues
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend
```

### Port Conflicts
If ports 80, 443, or 8000 are in use, modify `docker-compose.yml`:
```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Change 8080 to available port
  backend:
    ports:
      - "8001:8000"  # Change 8001 to available port
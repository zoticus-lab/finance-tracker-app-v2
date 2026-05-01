# 🐳 Docker Setup & Deployment Guide

## 📦 Project Structure untuk Docker
```
finance-tracker-app-v2/
├── backend/
│   ├── Dockerfile           (Build backend image)
│   ├── server.js
│   └── ...
├── frontend/
│   ├── Dockerfile           (Multi-stage build)
│   ├── src/
│   └── ...
├── database/
│   └── init.sql             (Database schema & seed data)
├── docker-compose.yml       (Orchestrate 3 services)
├── .env.docker              (Environment configuration)
└── ...
```

---

## 🚀 Quick Start dengan Docker

### 1. **Prerequisites**
- Docker Desktop installed (https://www.docker.com/products/docker-desktop)
- Docker daemon running

### 2. **Run All Services**
```bash
docker-compose up -d
```

Ini akan start 3 container secara bersamaan:
- **MySQL** (port 3306) - Database
- **Backend** (port 5001) - Express API
- **Frontend** (port 5175) - React SPA

### 3. **Akses Aplikasi**
- Frontend: http://localhost:5175
- Backend API: http://localhost:5001/api
- Database: localhost:3306

---

## 📋 Docker Compose Services

### Service 1: MySQL Database
```yaml
mysql:
  image: mysql:8.0
  environment:
    MYSQL_DATABASE: personal_finance_tracker
    MYSQL_USER: finance_user
    MYSQL_PASSWORD: finance_password
  volumes:
    - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    - mysql_data:/var/lib/mysql
```
- Auto-initialize database dari `database/init.sql`
- Data persisten di volume `mysql_data`
- Health check enabled

### Service 2: Backend API
```yaml
backend:
  build: ./backend/Dockerfile
  environment:
    DB_HOST: mysql
    DB_USER: finance_user
    PORT: 5001
```
- Build dari Dockerfile di backend/
- Connect ke mysql service (hostname: `mysql`)
- Port 5001 terbuka untuk frontend

### Service 3: Frontend
```yaml
frontend:
  build: ./frontend/Dockerfile
  ports:
    - "5175:5175"
```
- Multi-stage build (Node builder + serve)
- Optimized production build
- Serve pada port 5175

---

## 🔧 Common Commands

### Start containers
```bash
docker-compose up -d
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f mysql
docker-compose logs -f frontend
```

### Stop containers
```bash
docker-compose down
```

### Stop & remove volumes
```bash
docker-compose down -v
```

### Rebuild images
```bash
docker-compose up -d --build
```

### Execute command in container
```bash
docker-compose exec backend node test-reports.js
docker-compose exec mysql mysql -u finance_user -p -D personal_finance_tracker
```

### View running containers
```bash
docker-compose ps
```

---

## 🔐 Environment Variables

Edit `.env.docker` untuk customize:
```env
NODE_ENV=production
CORS_ORIGIN=http://localhost:5175
DB_USER=finance_user
DB_PASSWORD=finance_password
DB_ROOT_PASSWORD=root
DB_NAME=personal_finance_tracker
```

Atau langsung di `docker-compose.yml` section `environment:`

---

## 📊 Network & Volumes

### Network: `finance-network`
- Services berkomunikasi via hostname
- Backend dapat reach MySQL via hostname `mysql`
- Frontend dapat reach Backend via hostname `backend`

### Volumes
- `mysql_data` - Persist database files
- Backend & Frontend tidak perlu volume (stateless)

---

## 🐛 Troubleshooting

### Port sudah dipakai?
```bash
# Change port di docker-compose.yml
# Contoh: ganti "5001:5001" menjadi "5002:5001"

ports:
  - "5002:5001"  # Host:Container
```

### Database connection error?
```bash
# Check MySQL logs
docker-compose logs mysql

# Test connection
docker-compose exec backend mysql -h mysql -u finance_user -p
```

### Backend image build fail?
```bash
# Rebuild dengan no cache
docker-compose build --no-cache backend

# Check Dockerfile
cat backend/Dockerfile
```

### Frontend blank page?
```bash
# Check frontend logs
docker-compose logs frontend

# Check browser console
# Ensure VITE_API_URL pointing to correct backend
```

---

## 🚀 Production Deployment Tips

1. **Use `.env` file for secrets** (not committed to git)
2. **Change default passwords** in `.env.docker`
3. **Enable HTTPS** - Use Nginx reverse proxy
4. **Database backups** - Mount backup volume
5. **Resource limits** - Add `limits:` in service config
6. **Restart policy** - Already set to `restart: always`
7. **Health checks** - MySQL, Backend, Frontend masing-masing punya health check

### Example for production:
```bash
docker-compose -f docker-compose.yml \
  --env-file .env.production \
  up -d
```

---

## 📖 Useful Links

- Docker Docs: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- MySQL Image: https://hub.docker.com/_/mysql
- Node Image: https://hub.docker.com/_/node

**Happy containerizing! 🎉**

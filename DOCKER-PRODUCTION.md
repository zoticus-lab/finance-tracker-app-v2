# 🐳 Docker Production Deployment Guide

Panduan deploy aplikasi Finance Tracker ke mini PC menggunakan Docker & Portainer.

---

## 📦 Project Structure

```
finance-tracker-app-v2/
├── backend/
│   ├── Dockerfile           (Production-ready)
│   ├── server.js            (Entry point)
│   ├── package.json
│   └── ...
├── frontend/
│   ├── Dockerfile           (Multi-stage optimized)
│   ├── package.json
│   └── src/
├── database/
│   └── init.sql             (Auto-imported saat startup)
├── docker-compose.yml       (Production config)
├── .env.docker              (Environment variables)
└── README.md
```

---

## 🚀 Quickstart - Deploy Sekarang

### 1. **Prerequisites**
- ✅ Docker Desktop/Engine installed
- ✅ Docker Compose v2+
- ✅ Git (untuk clone repository)

### 2. **Clone & Setup**
```bash
git clone https://github.com/zoticus-lab/finance-tracker-app-v2.git
cd finance-tracker-app-v2
```

### 3. **Configure Environment**
```bash
# Copy dan edit environment variables
cp .env.docker .env

# Edit .env sesuai kebutuhan (optional - sudah ada default)
# Atau langsung jalankan dengan default
```

### 4. **Deploy All Services**
```bash
docker-compose up -d
```

✅ Services akan auto-start dan berkomunikasi via network

### 5. **Access Applications**
| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5175 | Main application |
| **Backend API** | http://localhost:5001/api | REST endpoints |
| **MySQL** | localhost:3306 | Database |

---

## 📋 Services Details

### 1. MySQL Database
- **Image:** mysql:8.0 (official)
- **Port:** 3306 (internal: 3306)
- **Database:** personal_finance_tracker
- **Storage:** `/var/lib/mysql` → `mysql_data` volume
- **Init Script:** `database/init.sql` auto-imported
- **Health Check:** Enabled - checks every 10s

### 2. Backend API (Express.js)
- **Build:** Dockerfile di `backend/`
- **Port:** 5001
- **Entry Point:** `node server.js`
- **Dependencies:** Auto-installed saat build
- **Health Check:** API endpoint `/api/dashboard`
- **Environment:** Production mode
- **Resource Limit:** 1 CPU, 256MB RAM

### 3. Frontend (React + Vite)
- **Build:** Multi-stage Dockerfile di `frontend/`
- **Port:** 5175
- **Optimization:** Production build (minimized)
- **Serving:** Static server `serve`
- **Health Check:** HTTP health check enabled
- **Resource Limit:** 1 CPU, 256MB RAM

---

## 🔧 Common Commands

### View Logs
```bash
# Semua services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f mysql
docker-compose logs -f frontend
```

### Container Management
```bash
# List running containers
docker-compose ps

# Restart service
docker-compose restart backend

# Rebuild specific service
docker-compose up -d --build backend

# Stop all services
docker-compose stop

# Stop & remove containers (keep volumes)
docker-compose down

# Stop & remove everything (including volumes)
docker-compose down -v
```

### Execute Commands
```bash
# Run test script di backend
docker-compose exec backend node test-reports.js

# Connect ke MySQL CLI
docker-compose exec mysql mysql -u finance_user -p -D personal_finance_tracker

# Check backend logs
docker-compose exec backend cat /app/server.js
```

---

## ⚙️ Environment Variables

Edit `.env` untuk customize:

```env
# Database
DB_ROOT_PASSWORD=root
DB_USER=finance_user
DB_PASSWORD=finance_password
DB_NAME=personal_finance_tracker
DB_PORT=3306

# Backend
CORS_ORIGIN=http://localhost:5175

# General
NODE_ENV=production
```

**File `.env` TIDAK dicommit ke git** (sudah di .gitignore)

---

## 📊 Network & Storage

### Network: `finance-network`
- Internal bridge network untuk services berkomunikasi
- Backend dapat reach MySQL via hostname `mysql`
- Frontend dapat reach Backend via hostname `backend`

### Volume: `mysql_data`
- Persist MySQL database
- Survive container restart/rebuild
- Lokasi host: `docker-compose` managed volume

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port di docker-compose.yml
# Contoh: ganti "5001:5001" menjadi "5002:5001"
ports:
  - "5002:5001"
```

### Build Failed
```bash
# Rebuild with no cache
docker-compose build --no-cache

# Check Dockerfile
cat backend/Dockerfile
cat frontend/Dockerfile
```

### Database Connection Error
```bash
# Check MySQL is running & healthy
docker-compose ps mysql

# View MySQL logs
docker-compose logs mysql

# Try connecting
docker-compose exec mysql mysql -u root -p
```

### Frontend Blank Page
```bash
# Check frontend logs
docker-compose logs frontend

# Verify port 5175 is accessible
curl http://localhost:5175

# Check API connection from frontend
curl http://localhost:5001/api/dashboard
```

### Services Not Communicating
```bash
# Check network
docker network ls
docker network inspect finance-network

# Check DNS resolution
docker-compose exec backend ping mysql
docker-compose exec frontend ping backend
```

---

## 🎯 Production Best Practices

### 1. Change Default Passwords
```env
# .env
MYSQL_ROOT_PASSWORD=your_strong_password_here
DB_PASSWORD=your_strong_password_here
```

### 2. Resource Limits (Already Configured)
- MySQL: max 1 CPU, 512MB RAM
- Backend: max 1 CPU, 256MB RAM
- Frontend: max 1 CPU, 256MB RAM

### 3. Backup Database
```bash
# Backup ke file
docker-compose exec mysql mysqldump \
  -u finance_user -p personal_finance_tracker \
  > backup_$(date +%Y%m%d).sql

# Restore dari file
docker-compose exec -T mysql mysql \
  -u finance_user -p personal_finance_tracker \
  < backup_20260501.sql
```

### 4. Update Code
```bash
# Pull latest changes
git pull origin main

# Rebuild & restart
docker-compose up -d --build
```

### 5. Monitor Resources
```bash
# Check container stats
docker stats

# Check disk usage
docker system df

# Cleanup unused images
docker image prune -a
```

---

## 📱 Deploy to Portainer (Mini PC)

### Via Portainer UI:
1. Open Portainer: `http://mini-pc:9000`
2. Go to **Stacks**
3. **Add Stack**
4. Paste content dari `docker-compose.yml`
5. Create & Deploy

### Via Terminal:
```bash
docker-compose \
  -f docker-compose.yml \
  --env-file .env \
  up -d
```

---

## 🔗 Useful Links

- [Docker Docs](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Portainer](https://www.portainer.io/)
- [MySQL Docker Image](https://hub.docker.com/_/mysql)
- [Node Docker Image](https://hub.docker.com/_/node)

---

## ✨ Production-Ready Features

✅ Production-optimized Dockerfiles  
✅ Multi-stage build untuk frontend (minimal image size)  
✅ Auto-database initialization  
✅ Health checks untuk semua services  
✅ Resource limits configured  
✅ Network isolation  
✅ Data persistence dengan volumes  
✅ Restart policies (`restart: always`)  
✅ NODE_ENV set to production  
✅ Dependencies optimized (--only=production)  

**Ready to deploy! 🚀**

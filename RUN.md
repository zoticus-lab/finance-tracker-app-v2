# 🚀 Cara Menjalankan Finance Tracker

## 📋 Prerequisites
- Node.js v24+
- MySQL running dengan database `personal_finance_tracker`
- Port 5001 (backend) dan 5175 (frontend) available

---

## 🔧 Setup Awal (First Time Only)

### 1. Install Dependencies
```bash
npm install --workspaces
```

### 2. Setup Database
```bash
cd backend
mysql -u root -p < schema.sql
node db.js
```

---

## ▶️ Menjalankan Aplikasi

### Option 1: Backend & Frontend Bersamaan
```bash
npm run dev
```
✅ Otomatis jalankan backend (port 5001) + frontend (port 5175)

---

### Option 2: Backend Saja
```bash
cd backend
node server.js
```
✅ Backend jalan di http://localhost:5001

---

### Option 3: Frontend Saja
```bash
cd frontend
npm run dev
✅ Frontend jalan di http://localhost:5175

---

## 🌐 Akses Aplikasi
- **Frontend:** http://localhost:5175
- **Backend API:** http://localhost:5001/api

---

## 📊 Testing API

### Test Reports Endpoint
```bash
cd backend
node test-reports.js
```

### Test Dashboard
```bash
curl http://localhost:5001/api/dashboard
```

---

## 🛑 Stop Running

### PowerShell:
```powershell
Get-Process node | Stop-Process -Force
```

### CMD:
```cmd
taskkill /IM node.exe /F
```

---

## 📁 Struktur Folder

```
Finance v2/
├── backend/              (Express API)
│   ├── server.js        (Main server)
│   ├── db.js            (Database init)
│   ├── schema.sql       (Database schema)
│   └── package.json
├── frontend/            (React + Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Transactions.jsx
│   │   │   ├── Wallets.jsx
│   │   │   ├── Loans.jsx
│   │   │   └── Sidebar.jsx
│   │   └── lib/
│   │       └── api.js
│   └── package.json
└── package.json (workspace root)
```

---

## ⚙️ Environment Variables

### Backend (.env di folder backend/)
```
PORT=5001
CORS_ORIGIN=http://localhost:5175
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=personal_finance_tracker
```

---

## 🐛 Troubleshooting

### Port 5001 sudah dipakai?
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5001).OwningProcess | Stop-Process
```

### Port 5175 sudah dipakai?
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5175).OwningProcess | Stop-Process
```

### Database connection error?
- Check MySQL running: `mysql -u root -p`
- Verify database exists: `SHOW DATABASES;`
- Create if not exist: `mysql -u root -p < schema.sql`

### Module not found error?
```bash
npm install --workspaces
```

---

## 📝 Shortcut Commands

### Windows PowerShell
```powershell
# Start all
npm run dev

# Start backend only
cd backend; node server.js

# Start frontend only  
cd frontend; npm run dev

# Stop all
Get-Process node | Stop-Process -Force
```

### Windows CMD
```cmd
# Start all
npm run dev

# Start backend
cd backend && node server.js

# Start frontend
cd frontend && npm run dev

# Stop all
taskkill /IM node.exe /F
```

---

## ✨ Fitur Aplikasi

- 📊 Dashboard - Overview keuangan
- 💰 Wallets - Kelola akun/dompet
- 📝 Transactions - Kelola transaksi (income/expense/transfer)
- 🏦 Loans - Kelola utang
- 📈 Reports - Laporan keuangan lengkap (Summary, Budget Capacity, Category Breakdown, Spending Trend)
- 📥/📤 Import/Export - CSV transactions

---

**Happy tracking! 🎉**

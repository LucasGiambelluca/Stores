# 🔒 Backup Strategy & Recovery Guide

## Overview

This document describes the backup strategy for the Tiendita e-commerce platform. The system uses PostgreSQL (Supabase) as the primary database.

---

## 📊 What Gets Backed Up

| Data Type | Priority | Frequency | Retention |
|-----------|----------|-----------|-----------|
| Database (PostgreSQL) | 🔴 Critical | Daily | 30 days |
| Product Images (Cloudinary) | 🟡 Important | On-upload | Permanent |
| Order Data | 🔴 Critical | Daily | 1 year |
| User Data | 🔴 Critical | Daily | 30 days |
| Configuration | 🟢 Low | Weekly | 7 days |

---

## 🗄️ Database Backups

### Option 1: Supabase Built-in (Recommended for Production)

Supabase Pro/Team plans include automatic daily backups with point-in-time recovery.

**Enable in Supabase Dashboard:**
1. Go to Project Settings → Database
2. Enable "Point-in-time Recovery" (Pro plan required)
3. Backups are kept for 7 days (Pro) or 30 days (Team)

### Option 2: Manual Backup Script

For self-hosted PostgreSQL or additional backup safety:

```powershell
# scripts/backup-database.ps1
# Run: .\scripts\backup-database.ps1

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupDir = ".\backups"
$backupFile = "$backupDir\tiendita_backup_$timestamp.sql"

# Create backup directory if not exists
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

# Export using pg_dump (requires PostgreSQL tools installed)
$env:PGPASSWORD = $env:DATABASE_PASSWORD
pg_dump -h $env:DATABASE_HOST -U $env:DATABASE_USER -d $env:DATABASE_NAME -F p -f $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup created: $backupFile" -ForegroundColor Green
    
    # Compress the backup
    Compress-Archive -Path $backupFile -DestinationPath "$backupFile.zip" -Force
    Remove-Item $backupFile
    Write-Host "✅ Compressed: $backupFile.zip"
    
    # Clean old backups (keep last 30)
    Get-ChildItem $backupDir -Filter "*.zip" | 
        Sort-Object CreationTime -Descending | 
        Select-Object -Skip 30 | 
        Remove-Item -Force
} else {
    Write-Host "❌ Backup failed!" -ForegroundColor Red
    exit 1
}
```

### Option 3: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Create backup
supabase db dump -p your-project-ref > backup_$(date +%Y%m%d).sql
```

---

## 🔄 Recovery Procedures

### Restoring from Supabase Dashboard

1. Go to Supabase Dashboard → Project → Database
2. Click "Backups" tab
3. Select the backup point to restore
4. Click "Restore"

### Restoring from SQL Dump

```powershell
# scripts/restore-database.ps1
param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

Write-Host "⚠️ WARNING: This will overwrite the current database!" -ForegroundColor Yellow
$confirm = Read-Host "Type 'RESTORE' to continue"

if ($confirm -eq "RESTORE") {
    # Unzip if needed
    if ($BackupFile.EndsWith(".zip")) {
        Expand-Archive -Path $BackupFile -DestinationPath ".\temp_restore" -Force
        $BackupFile = Get-ChildItem ".\temp_restore\*.sql" | Select-Object -First 1
    }
    
    $env:PGPASSWORD = $env:DATABASE_PASSWORD
    psql -h $env:DATABASE_HOST -U $env:DATABASE_USER -d $env:DATABASE_NAME -f $BackupFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database restored successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Restore failed!" -ForegroundColor Red
    }
    
    # Cleanup
    Remove-Item ".\temp_restore" -Recurse -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "Restore cancelled." -ForegroundColor Gray
}
```

---

## 📸 Image Backups (Cloudinary)

Cloudinary stores images permanently by default. For additional safety:

### Export All Media Assets

```bash
# Using Cloudinary CLI
npm install -g cloudinary-cli
cld config -n
cld admin resources --max_results 500 > cloudinary_backup.json
```

### Download All Images

```javascript
// scripts/backup-cloudinary.js
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const https = require('https');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function backupImages() {
  const result = await cloudinary.api.resources({ max_results: 500 });
  
  for (const resource of result.resources) {
    const filename = `./backups/images/${resource.public_id}.${resource.format}`;
    const file = fs.createWriteStream(filename);
    https.get(resource.secure_url, (response) => response.pipe(file));
  }
}

backupImages();
```

---

## ⏰ Automated Backup Schedule

### Windows Task Scheduler

```powershell
# Create scheduled task for daily backups at 3 AM
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\tiendita\scripts\backup-database.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
Register-ScheduledTask -TaskName "TienditaBackup" -Action $action -Trigger $trigger
```

### Linux Cron

```bash
# Edit crontab
crontab -e

# Add daily backup at 3 AM
0 3 * * * /path/to/tiendita/scripts/backup-database.sh >> /var/log/tiendita-backup.log 2>&1
```

---

## 🆘 Disaster Recovery Checklist

### If Database is Lost/Corrupted:

1. [ ] **STOP the application** immediately
2. [ ] Identify the most recent backup
3. [ ] Restore from Supabase dashboard (preferred) or SQL dump
4. [ ] Verify data integrity: `SELECT COUNT(*) FROM stores, users, orders, products`
5. [ ] Test critical flows: login, create order, admin access
6. [ ] Restart application
7. [ ] Monitor for errors

### If Application Server is Lost:

1. [ ] Provision new server
2. [ ] Clone repository: `git clone [repo-url]`
3. [ ] Restore `.env` from secure backup
4. [ ] Install dependencies: `pnpm install`
5. [ ] Verify database connection
6. [ ] Start application: `pnpm start`
7. [ ] Update DNS if needed

---

## 📋 Environment Variables to Backup

Store these securely (e.g., 1Password, AWS Secrets Manager):

```
JWT_SECRET
DATABASE_URL
MP_ACCESS_TOKEN
MP_PUBLIC_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
SENTRY_DSN
```

---

## ✅ Backup Verification

Run monthly to ensure backups are working:

1. [ ] Download most recent backup
2. [ ] Restore to a test database
3. [ ] Verify row counts match production
4. [ ] Test a sample query
5. [ ] Document verification date

**Last Verified:** _______________

---

*Document created: 2026-01-20*
*Review quarterly or after major changes.*

# ============================================
# Tiendita Database Backup Script
# ============================================
# Usage: .\backup-database.ps1
# Requires: PostgreSQL client tools (pg_dump)
# ============================================

param(
    [string]$OutputDir = ".\backups"
)

$ErrorActionPreference = "Stop"

# Load environment variables from .env if exists
$envFile = Join-Path $PSScriptRoot "..\server\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

# Configuration
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupFile = Join-Path $OutputDir "tiendita_backup_$timestamp.sql"
$compressedFile = "$backupFile.zip"

# Parse DATABASE_URL if provided
$databaseUrl = $env:DATABASE_URL
if ($databaseUrl) {
    # Parse: postgresql://user:password@host:port/database
    if ($databaseUrl -match "postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
        $dbUser = $matches[1]
        $dbPassword = $matches[2]
        $dbHost = $matches[3]
        $dbPort = $matches[4]
        $dbName = $matches[5]
    }
} else {
    Write-Host "❌ DATABASE_URL not found in environment" -ForegroundColor Red
    Write-Host "   Set DATABASE_URL or configure in .env file" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🗄️  Tiendita Database Backup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   Host: $dbHost"
Write-Host "   Database: $dbName"
Write-Host "   Output: $compressedFile"
Write-Host ""

# Create backup directory
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

# Set password for pg_dump
$env:PGPASSWORD = $dbPassword

try {
    # Check if pg_dump exists
    $pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
    if (-not $pgDump) {
        Write-Host "❌ pg_dump not found. Install PostgreSQL client tools." -ForegroundColor Red
        Write-Host "   Download: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "📦 Creating backup..." -ForegroundColor Yellow
    
    # Run pg_dump
    & pg_dump -h $dbHost -p $dbPort -U $dbUser -d $dbName -F p -f $backupFile 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }
    
    Write-Host "✅ SQL dump created" -ForegroundColor Green
    
    # Get file size
    $sqlSize = (Get-Item $backupFile).Length / 1MB
    Write-Host "   Size: $([math]::Round($sqlSize, 2)) MB"
    
    # Compress
    Write-Host "🗜️  Compressing..." -ForegroundColor Yellow
    Compress-Archive -Path $backupFile -DestinationPath $compressedFile -Force
    Remove-Item $backupFile
    
    $zipSize = (Get-Item $compressedFile).Length / 1MB
    Write-Host "✅ Compressed: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Green
    
    # Clean old backups (keep last 30)
    $oldBackups = Get-ChildItem $OutputDir -Filter "*.zip" | 
        Sort-Object CreationTime -Descending | 
        Select-Object -Skip 30
    
    if ($oldBackups.Count -gt 0) {
        $oldBackups | Remove-Item -Force
        Write-Host "🧹 Cleaned $($oldBackups.Count) old backup(s)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "✅ BACKUP COMPLETE!" -ForegroundColor Green
    Write-Host "   File: $compressedFile" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "❌ Backup failed: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clear password from environment
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

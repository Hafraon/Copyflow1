import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)
const mkdirAsync = promisify(fs.mkdir)
const readdirAsync = promisify(fs.readdir)
const statAsync = promisify(fs.stat)
const unlinkAsync = promisify(fs.unlink)

/**
 * Database backup endpoint for scheduled backups
 * Scheduled to run daily
 * 
 * GET /api/cron/backup
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Only run in production
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json({ 
      status: 'skipped', 
      message: 'Backups only run in production environment' 
    })
  }
  
  // Check required environment variables
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'DATABASE_URL environment variable is required' 
    }, { status: 500 })
  }
  
  const BACKUP_DIR = process.env.BACKUP_DIR || '/tmp/copyflow-backups'
  const RETENTION_DAYS = 7 // Keep backups for 7 days
  
  try {
    // Create backup directory
    await mkdirAsync(BACKUP_DIR, { recursive: true })
    
    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(BACKUP_DIR, `copyflow-backup-${timestamp}.sql`)
    
    // Run database backup
    console.log(`Starting backup to ${backupFile}`)
    await execAsync(`pg_dump "${process.env.DATABASE_URL}" > "${backupFile}"`)
    
    // Compress the backup
    console.log('Compressing backup...')
    await execAsync(`gzip "${backupFile}"`)
    const compressedFile = `${backupFile}.gz`
    
    // Upload to cloud storage if configured
    if (process.env.BACKUP_STORAGE_URL) {
      console.log('Uploading to cloud storage...')
      // In production, implement actual upload to S3, GCS, etc.
      // await uploadToCloudStorage(compressedFile)
    }
    
    // Clean up old backups
    await cleanupOldBackups(BACKUP_DIR, RETENTION_DAYS)
    
    return NextResponse.json({
      status: 'success',
      message: 'Backup completed successfully',
      file: compressedFile,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Backup failed:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Backup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Clean up old backup files
 */
async function cleanupOldBackups(backupDir: string, retentionDays: number) {
  try {
    const files = await readdirAsync(backupDir)
    const now = new Date()
    
    for (const file of files) {
      if (!file.startsWith('copyflow-backup-')) continue
      
      const filePath = path.join(backupDir, file)
      const stats = await statAsync(filePath)
      const fileAge = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24) // Age in days
      
      if (fileAge > retentionDays) {
        await unlinkAsync(filePath)
        console.log(`Deleted old backup: ${file}`)
      }
    }
    
    console.log('Cleanup completed')
  } catch (error) {
    console.error('Cleanup failed:', error)
  }
}
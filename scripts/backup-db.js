#!/usr/bin/env node

/**
 * Database backup script
 * Scheduled to run daily via cron job
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);
const mkdirAsync = promisify(fs.mkdir);

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const DATABASE_URL = process.env.DATABASE_URL;
const RETENTION_DAYS = 7; // Keep backups for 7 days

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function createBackupDirectory() {
  try {
    await mkdirAsync(BACKUP_DIR, { recursive: true });
    console.log(`✅ Backup directory created: ${BACKUP_DIR}`);
  } catch (error) {
    console.error('❌ Failed to create backup directory:', error);
    process.exit(1);
  }
}

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `copyflow-backup-${timestamp}.sql`);
  
  try {
    // Extract database name from connection string
    const dbName = DATABASE_URL.split('/').pop().split('?')[0];
    
    // Run pg_dump
    console.log(`📦 Starting backup of database: ${dbName}`);
    await execAsync(`pg_dump "${DATABASE_URL}" > "${backupFile}"`);
    
    // Compress the backup
    console.log('🗜️ Compressing backup...');
    await execAsync(`gzip "${backupFile}"`);
    
    console.log(`✅ Backup completed: ${backupFile}.gz`);
    return `${backupFile}.gz`;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

async function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = new Date();
    
    for (const file of files) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const fileAge = (now - stats.mtime) / (1000 * 60 * 60 * 24); // Age in days
      
      if (fileAge > RETENTION_DAYS) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted old backup: ${file}`);
      }
    }
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

async function main() {
  try {
    await createBackupDirectory();
    const backupFile = await backupDatabase();
    await cleanupOldBackups();
    
    console.log('✅ Backup process completed successfully');
    
    // In production, you might want to upload the backup to cloud storage
    // await uploadToCloudStorage(backupFile);
  } catch (error) {
    console.error('❌ Backup process failed:', error);
    process.exit(1);
  }
}

main();
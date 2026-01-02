// utils/backupManager.js
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const SystemBackup = require('../models/SystemBackup');
const execAsync = promisify(exec);

const createBackup = async (backupId) => {
  try {
    const backup = await SystemBackup.findById(backupId);
    if (!backup) throw new Error('Backup not found');

    backup.status = 'running';
    await backup.save();

    const backupDir = path.join(process.cwd(), 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${backup.name}_${timestamp}.tar.gz`;
    const filepath = path.join(backupDir, filename);

    let mongodumpCmd = 'mongodump';
    
    if (backup.type === 'full') {
      mongodumpCmd += ` --uri="${process.env.MONGODB_URI}" --archive="${filepath}" --gzip`;
    } else if (backup.type === 'partial' && backup.collections.length > 0) {
      const collections = backup.collections.map(col => `--collection=${col}`).join(' ');
      mongodumpCmd += ` --uri="${process.env.MONGODB_URI}" ${collections} --archive="${filepath}" --gzip`;
    }

    const startTime = Date.now();
    await execAsync(mongodumpCmd);
    const duration = (Date.now() - startTime) / 1000;

    const stats = await fs.stat(filepath);
    
    backup.status = 'completed';
    backup.location = filepath;
    backup.size = stats.size;
    backup.metadata = {
      duration,
      compressionRatio: 0.7 // Estimate
    };
    
    await backup.save();

    return backup;
  } catch (error) {
    const backup = await SystemBackup.findById(backupId);
    if (backup) {
      backup.status = 'failed';
      backup.error = error.message;
      await backup.save();
    }
    throw error;
  }
};

const restoreBackup = async (backupId, options = {}) => {
  try {
    const backup = await SystemBackup.findById(backupId);
    if (!backup || backup.status !== 'completed') {
      throw new Error('Invalid backup for restoration');
    }

    if (!await fs.access(backup.location).then(() => true).catch(() => false)) {
      throw new Error('Backup file not found');
    }

    let mongorestoreCmd = `mongorestore --uri="${process.env.MONGODB_URI}" --archive="${backup.location}" --gzip`;
    
    if (options.drop) {
      mongorestoreCmd += ' --drop';
    }

    await execAsync(mongorestoreCmd);
    
    return { success: true, message: 'Backup restored successfully' };
  } catch (error) {
    throw new Error(`Backup restoration failed: ${error.message}`);
  }
};

module.exports = { createBackup, restoreBackup };
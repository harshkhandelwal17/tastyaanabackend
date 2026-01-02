const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');

// Time to run the job (2:00 AM daily)
const DAILY_ORDER_CRON_SCHEDULE = '0 2 * * *';

/**
 * Schedule the daily order generation job
 */
function scheduleDailyOrderGeneration() {
  // Schedule the job
  cron.schedule(DAILY_ORDER_CRON_SCHEDULE, async () => {
    try {
      logger.info('Starting scheduled daily order generation...');
      
      // Run the generateDailyOrders script as a child process
      const scriptPath = path.join(__dirname, '../scripts/generateDailyOrders.js');
      
      exec(`node ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
          logger.error(`Error executing daily order generation: ${error.message}`);
          return;
        }
        if (stderr) {
          logger.error(`Daily order generation stderr: ${stderr}`);
          return;
        }
        
        logger.info(`Daily order generation completed: ${stdout}`);
      });
      
    } catch (error) {
      logger.error('Failed to run daily order generation:', error);
    }
  }, {
    timezone: 'Asia/Kolkata',
    scheduled: true,
    name: 'daily-order-generation'
  });
  
  logger.info('Scheduled daily order generation job');
}

/**
 * Manually trigger the daily order generation
 * @returns {Promise<Object>} Result of the operation
 */
async function triggerDailyOrderGeneration() {
  try {
    logger.info('Manually triggering daily order generation...');
    const generateDailyOrders = require('../scripts/generateDailyOrders');
    const result = await generateDailyOrders();
    logger.info('Manual daily order generation completed', result);
    return { success: true, ...result };
  } catch (error) {
    logger.error('Failed to manually generate daily orders:', error);
    return { 
      success: false, 
      error: error.message,
      stack: error.stack 
    };
  }
}

module.exports = {
  scheduleDailyOrderGeneration,
  triggerDailyOrderGeneration
};

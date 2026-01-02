
// middleware/apiMetrics.js
const apiMetrics = (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      // Log API metrics (can be sent to monitoring service)
      // console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
      
      // Store metrics in database for analytics
      if (req.user) {
        storeApiMetrics({
          method: req.method,
          endpoint: req.originalUrl,
          statusCode: res.statusCode,
          duration,
          userId: req.user._id,
          userRole: req.user.role,
          timestamp: new Date()
        });
      }
    });
    
    next();
  };
  
  const storeApiMetrics = async (metrics) => {
    // Store in a metrics collection or send to external service
    try {
      // Implementation depends on your monitoring setup
      // Could use InfluxDB, Prometheus, or similar
    } catch (error) {
      console.error('Failed to store API metrics:', error);
    }
  };
  
  module.exports = apiMetrics;
  
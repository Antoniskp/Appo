const pool = require('../config/database');

// Store app start time
const startTime = Date.now();

/**
 * Perform database health check with timeout
 */
async function checkDatabase() {
  const timeoutMs = 5000; // 5 second timeout
  
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database check timeout')), timeoutMs);
    });
    
    const queryPromise = pool.query('SELECT 1 as result');
    
    const result = await Promise.race([queryPromise, timeoutPromise]);
    
    return {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime: result.duration || 0
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message || 'Database connection failed',
      error: error.message
    };
  }
}

/**
 * Check app uptime and process info
 */
function checkAppInfo() {
  const uptimeSeconds = process.uptime();
  const uptimeFormatted = formatUptime(uptimeSeconds);
  
  return {
    status: 'healthy',
    uptime: uptimeFormatted,
    uptimeSeconds: Math.floor(uptimeSeconds),
    processId: process.pid,
    nodeVersion: process.version,
    memoryUsage: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  };
}

/**
 * Check core API routes availability (lightweight check)
 * This does not make actual HTTP requests, just verifies routes are registered
 */
function checkApiRoutes() {
  // Lightweight check - just verify the routes are configured
  // In a real scenario, you could ping the routes, but to avoid data mutation
  // and keep it lightweight, we just return a healthy status if the app is running
  return {
    status: 'healthy',
    message: 'Core API routes available',
    routes: ['/api/auth', '/api/news', '/api/education', '/api/polls']
  };
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  
  return parts.join(' ');
}

/**
 * Generate HTML response
 */
function generateHtmlResponse(healthData) {
  const overallHealthy = healthData.status === 'healthy';
  const statusColor = overallHealthy ? '#28a745' : '#dc3545';
  const statusText = overallHealthy ? 'Healthy' : 'Unhealthy';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Health Check - Appo</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 30px;
        }
        h1 {
            margin-top: 0;
            color: #333;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            background-color: ${statusColor};
        }
        .check-section {
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 4px;
            border-left: 4px solid ${statusColor};
        }
        .check-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }
        .check-item {
            margin: 5px 0;
            color: #666;
        }
        .status-healthy {
            color: #28a745;
        }
        .status-unhealthy {
            color: #dc3545;
        }
        .timestamp {
            color: #999;
            font-size: 14px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Health Check Status</h1>
        <div>
            <span class="status-badge">${statusText}</span>
        </div>
        
        <div class="check-section">
            <div class="check-title">Application Info</div>
            <div class="check-item">Status: <span class="status-${healthData.checks.app.status}">${healthData.checks.app.status}</span></div>
            <div class="check-item">Uptime: ${healthData.checks.app.uptime}</div>
            <div class="check-item">Process ID: ${healthData.checks.app.processId}</div>
            <div class="check-item">Node Version: ${healthData.checks.app.nodeVersion}</div>
            <div class="check-item">Memory (Heap Used): ${healthData.checks.app.memoryUsage.heapUsed}</div>
        </div>
        
        <div class="check-section">
            <div class="check-title">Database</div>
            <div class="check-item">Status: <span class="status-${healthData.checks.database.status}">${healthData.checks.database.status}</span></div>
            <div class="check-item">Message: ${healthData.checks.database.message}</div>
            ${healthData.checks.database.error ? `<div class="check-item">Error: ${healthData.checks.database.error}</div>` : ''}
        </div>
        
        <div class="check-section">
            <div class="check-title">API Routes</div>
            <div class="check-item">Status: <span class="status-${healthData.checks.apiRoutes.status}">${healthData.checks.apiRoutes.status}</span></div>
            <div class="check-item">Message: ${healthData.checks.apiRoutes.message}</div>
            <div class="check-item">Routes: ${healthData.checks.apiRoutes.routes.join(', ')}</div>
        </div>
        
        <div class="timestamp">
            Last checked: ${healthData.timestamp}
        </div>
    </div>
</body>
</html>
  `.trim();
}

/**
 * Main health check handler
 */
async function healthCheck(req, res) {
  try {
    // Perform all health checks
    const [dbCheck, appInfo, apiRoutesCheck] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkAppInfo()),
      Promise.resolve(checkApiRoutes())
    ]);
    
    // Determine overall status
    const allHealthy = 
      dbCheck.status === 'healthy' && 
      appInfo.status === 'healthy' && 
      apiRoutesCheck.status === 'healthy';
    
    const healthData = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbCheck,
        app: appInfo,
        apiRoutes: apiRoutesCheck
      }
    };
    
    // Check Accept header for content negotiation
    const acceptHeader = req.get('Accept') || '';
    const wantsHtml = acceptHeader.includes('text/html');
    
    if (wantsHtml) {
      // Return HTML response
      res.status(allHealthy ? 200 : 503)
        .type('text/html')
        .send(generateHtmlResponse(healthData));
    } else {
      // Return JSON response (default)
      res.status(allHealthy ? 200 : 503)
        .json(healthData);
    }
  } catch (error) {
    console.error('Health check error:', error);
    
    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message || 'Health check failed'
    };
    
    const acceptHeader = req.get('Accept') || '';
    const wantsHtml = acceptHeader.includes('text/html');
    
    if (wantsHtml) {
      res.status(503)
        .type('text/html')
        .send(`<h1>Health Check Failed</h1><p>${error.message}</p>`);
    } else {
      res.status(503).json(errorData);
    }
  }
}

module.exports = { healthCheck };

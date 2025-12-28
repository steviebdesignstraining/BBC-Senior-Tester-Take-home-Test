#!/usr/bin/env node

/**
 * Converts k6 JSON output into a comprehensive HTML report with charts, tables, and thresholds
 * Usage:
 *   node k6-json-to-html.js input.json output.html
 */

const fs = require("fs");
const path = require("path");

const [,, inputFile, outputFile] = process.argv;

if (!inputFile || !outputFile) {
  console.error("Usage: node k6-json-to-html.js <input.json> <output.html>");
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`Input file not found: ${inputFile}`);
  process.exit(1);
}

// Read and parse k6 JSON file (which contains multiple JSON objects, one per line)
const fileContent = fs.readFileSync(inputFile, "utf8");
const lines = fileContent.trim().split('\n');

let metrics = {};
let summary = {};

// Parse each line as separate JSON
lines.forEach((line, index) => {
  if (!line.trim()) return;
  
  try {
    const data = JSON.parse(line);
    
    // Capture summary data
    if (data.type === 'Metric' && data.data && data.data.type === 'summary') {
      if (!summary) summary = {};
      summary[data.metric] = data.data;
    }
    
    // Capture point data for charts
    if (data.type === 'Point' && data.data) {
      const metricName = data.metric;
      if (!metrics[metricName]) {
        metrics[metricName] = [];
      }
      metrics[metricName].push(data.data);
    }
  } catch (err) {
    // Skip invalid JSON lines
  }
});

const checks = summary.checks?.values || {};
const httpReqDuration = summary.http_req_duration?.values || {};
const httpReqFailed = summary.http_req_failed?.values || {};
const httpReqRate = summary.http_req_rate?.values || {};
const vus = summary.vus?.values || {};
const iterations = summary.iterations?.values || {};

// Calculate performance thresholds
const thresholds = {
  http_req_duration: {
    p95: httpReqDuration.p95 || 0,
    p99: httpReqDuration.p99 || 0,
    avg: httpReqDuration.avg || 0,
    max: httpReqDuration.max || 0,
    min: httpReqDuration.min || 0
  },
  http_req_failed: {
    rate: (httpReqFailed.rate || 0) * 100, // Convert to percentage
    passes: httpReqFailed.passes || 0,
    fails: httpReqFailed.fails || 0
  },
  http_req_rate: {
    rate: httpReqRate.rate || 0
  },
  vus: {
    current: vus.current || 0,
    max: vus.max || 0
  },
  iterations: {
    count: iterations.count || 0,
    rate: iterations.rate || 0
  }
};

// Determine test type from filename
const testType = path.basename(outputFile, '.html').split('/').pop();
const testTitle = testType.charAt(0).toUpperCase() + testType.slice(1) + ' Test';

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>k6 ${testTitle} Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      --primary-color: #3b82f6;
      --success-color: #10b981;
      --danger-color: #ef4444;
      --warning-color: #f59e0b;
      --bg-color: #f8fafc;
      --card-bg: #ffffff;
      --text-color: #1e293b;
      --border-color: #e2e8f0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      margin: 0;
      padding: 2rem;
      line-height: 1.6;
    }
    
    .header {
      background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
      color: white;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .header h1 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 700;
    }
    
    .header p {
      margin: 0.5rem 0 0 0;
      opacity: 0.9;
      font-size: 1.1rem;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .metric-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
    }
    
    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      border-bottom: 2px solid var(--border-color);
      padding-bottom: 0.5rem;
    }
    
    .metric-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-color);
    }
    
    .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-color);
    }
    
    .metric-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 0.25rem;
    }
    
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }
    
    .chart-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .chart-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: var(--text-color);
    }
    
    .chart-container {
      position: relative;
      height: 300px;
      width: 100%;
    }
    
    .thresholds-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .threshold-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .threshold-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border-color);
    }
    
    .threshold-item:last-child {
      border-bottom: none;
    }
    
    .threshold-label {
      font-weight: 600;
      color: var(--text-color);
    }
    
    .threshold-value {
      font-weight: 700;
      font-family: 'Courier New', monospace;
    }
    
    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status-pass {
      background-color: #dcfce7;
      color: #166534;
    }
    
    .status-fail {
      background-color: #fee2e2;
      color: #991b1b;
    }
    
    .status-warning {
      background-color: #fff3cd;
      color: #856404;
    }
    
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
      background: var(--card-bg);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .summary-table th,
    .summary-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    
    .summary-table th {
      background-color: #f1f5f9;
      font-weight: 600;
      color: var(--text-color);
    }
    
    .footer {
      text-align: center;
      margin-top: 3rem;
      padding: 2rem;
      color: #64748b;
      border-top: 1px solid var(--border-color);
    }
    
    @media (max-width: 768px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
      
      .chart-container {
        height: 250px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${testTitle}</h1>
      <p>Performance Test Report - Generated ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-header">
          <div>
            <div class="metric-title">Average Response Time</div>
            <div class="metric-subtitle">Mean time for HTTP requests</div>
          </div>
          <div class="metric-value">${thresholds.http_req_duration.avg.toFixed(2)}ms</div>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-header">
          <div>
            <div class="metric-title">95th Percentile</div>
            <div class="metric-subtitle">95% of requests completed within</div>
          </div>
          <div class="metric-value">${thresholds.http_req_duration.p95.toFixed(2)}ms</div>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-header">
          <div>
            <div class="metric-title">Error Rate</div>
            <div class="metric-subtitle">Percentage of failed requests</div>
          </div>
          <div class="metric-value" style="color: ${thresholds.http_req_failed.rate > 5 ? 'var(--danger-color)' : 'var(--success-color)'}">${thresholds.http_req_failed.rate.toFixed(2)}%</div>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-header">
          <div>
            <div class="metric-title">Request Rate</div>
            <div class="metric-subtitle">Requests per second</div>
          </div>
          <div class="metric-value">${thresholds.http_req_rate.rate.toFixed(2)} req/s</div>
        </div>
      </div>
    </div>
    
    <div class="charts-grid">
      <div class="chart-card">
        <h3 class="chart-title">Response Time Distribution</h3>
        <div class="chart-container">
          <canvas id="responseTimeChart"></canvas>
        </div>
      </div>
      
      <div class="chart-card">
        <h3 class="chart-title">Performance Thresholds</h3>
        <div class="chart-container">
          <canvas id="thresholdsChart"></canvas>
        </div>
      </div>
    </div>
    
    <div class="thresholds-grid">
      <div class="threshold-card">
        <h3 class="chart-title">Response Time Analysis</h3>
        <div class="threshold-item">
          <span class="threshold-label">Minimum</span>
          <span class="threshold-value">${thresholds.http_req_duration.min.toFixed(2)}ms</span>
        </div>
        <div class="threshold-item">
          <span class="threshold-label">Average</span>
          <span class="threshold-value">${thresholds.http_req_duration.avg.toFixed(2)}ms</span>
        </div>
        <div class="threshold-item">
          <span class="threshold-label">95th Percentile</span>
          <span class="threshold-value">${thresholds.http_req_duration.p95.toFixed(2)}ms</span>
        </div>
        <div class="threshold-item">
          <span class="threshold-label">99th Percentile</span>
          <span class="threshold-value">${thresholds.http_req_duration.p99.toFixed(2)}ms</span>
        </div>
        <div class="threshold-item">
          <span class="threshold-label">Maximum</span>
          <span class="threshold-value">${thresholds.http_req_duration.max.toFixed(2)}ms</span>
        </div>
      </div>
      
      <div class="threshold-card">
        <h3 class="chart-title">Error Analysis</h3>
        <div class="threshold-item">
          <span class="threshold-label">Error Rate</span>
          <span class="threshold-value" style="color: ${thresholds.http_req_failed.rate > 5 ? 'var(--danger-color)' : 'var(--success-color)'}">${thresholds.http_req_failed.rate.toFixed(2)}%</span>
        </div>
        <div class="threshold-item">
          <span class="threshold-label">Total Requests</span>
          <span class="threshold-value">${(thresholds.http_req_failed.passes + thresholds.http_req_failed.fails)}</span>
        </div>
        <div class="threshold-item">
          <span class="threshold-label">Successful</span>
          <span class="threshold-value" style="color: var(--success-color)">${thresholds.http_req_failed.passes}</span>
        </div>
        <div class="threshold-item">
          <span class="threshold-label">Failed</span>
          <span class="threshold-value" style="color: var(--danger-color)">${thresholds.http_req_failed.fails}</span>
        </div>
      </div>
      
      <div class="threshold-card">
        <h3 class="chart-title">Load Metrics</h3>
        <div class="threshold-item">
          <span class="threshold-label">Virtual Users</span>
          <span class="threshold-value">${thresholds.vus.current} / ${thresholds.vus.max}</span>
        </div>
        <div class="threshold-item">
          <span class="threshold-label">Iterations</span>
          <span class="threshold-value">${thresholds.iterations.count}</span>
        </div>
        <div class="threshold-item">
          <span class="threshold-label">Iteration Rate</span>
          <span class="threshold-value">${thresholds.iterations.rate.toFixed(2)} it/s</span>
        </div>
        <div class="threshold-item">
          <span class="threshold-label">Request Rate</span>
          <span class="threshold-value">${thresholds.http_req_rate.rate.toFixed(2)} req/s</span>
        </div>
      </div>
    </div>
    
    <div class="chart-card">
      <h3 class="chart-title">Detailed Metrics</h3>
      <table class="summary-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Unit</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>HTTP Request Duration (avg)</td>
            <td>${thresholds.http_req_duration.avg.toFixed(2)}</td>
            <td>ms</td>
            <td><span class="status-badge ${thresholds.http_req_duration.avg < 1000 ? 'status-pass' : 'status-warning'}">${thresholds.http_req_duration.avg < 1000 ? 'PASS' : 'WARNING'}</span></td>
          </tr>
          <tr>
            <td>HTTP Request Duration (p95)</td>
            <td>${thresholds.http_req_duration.p95.toFixed(2)}</td>
            <td>ms</td>
            <td><span class="status-badge ${thresholds.http_req_duration.p95 < 2000 ? 'status-pass' : 'status-fail'}">${thresholds.http_req_duration.p95 < 2000 ? 'PASS' : 'FAIL'}</span></td>
          </tr>
          <tr>
            <td>HTTP Request Duration (p99)</td>
            <td>${thresholds.http_req_duration.p99.toFixed(2)}</td>
            <td>ms</td>
            <td><span class="status-badge ${thresholds.http_req_duration.p99 < 3000 ? 'status-pass' : 'status-fail'}">${thresholds.http_req_duration.p99 < 3000 ? 'PASS' : 'FAIL'}</span></td>
          </tr>
          <tr>
            <td>HTTP Request Failed Rate</td>
            <td>${thresholds.http_req_failed.rate.toFixed(2)}</td>
            <td>%</td>
            <td><span class="status-badge ${thresholds.http_req_failed.rate < 5 ? 'status-pass' : 'status-fail'}">${thresholds.http_req_failed.rate < 5 ? 'PASS' : 'FAIL'}</span></td>
          </tr>
          <tr>
            <td>HTTP Request Rate</td>
            <td>${thresholds.http_req_rate.rate.toFixed(2)}</td>
            <td>req/s</td>
            <td><span class="status-badge status-pass">INFO</span></td>
          </tr>
          <tr>
            <td>Virtual Users (current)</td>
            <td>${thresholds.vus.current}</td>
            <td>users</td>
            <td><span class="status-badge status-pass">INFO</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      <p>Report generated by k6 Performance Testing Framework</p>
      <p>For more details, check the raw JSON data or k6 documentation</p>
    </div>
  </div>
  
  <script>
    // Response Time Distribution Chart
    const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
    const responseTimeChart = new Chart(responseTimeCtx, {
      type: 'bar',
      data: {
        labels: ['Min', 'Avg', 'P95', 'P99', 'Max'],
        datasets: [{
          label: 'Response Time (ms)',
          data: [
            ${thresholds.http_req_duration.min},
            ${thresholds.http_req_duration.avg},
            ${thresholds.http_req_duration.p95},
            ${thresholds.http_req_duration.p99},
            ${thresholds.http_req_duration.max}
          ],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(168, 85, 247, 0.8)'
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(168, 85, 247, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Response Time (ms)'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
    
    // Thresholds Chart
    const thresholdsCtx = document.getElementById('thresholdsChart').getContext('2d');
    const thresholdsChart = new Chart(thresholdsCtx, {
      type: 'doughnut',
      data: {
        labels: ['Response Time (P95)', 'Error Rate', 'Request Rate'],
        datasets: [{
          data: [
            ${Math.min(thresholds.http_req_duration.p95 / 2000 * 100, 100)},
            ${Math.max(100 - thresholds.http_req_failed.rate * 10, 0)},
            ${Math.min(thresholds.http_req_rate.rate / 100 * 100, 100)}
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(59, 130, 246, 0.8)'
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(59, 130, 246, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  </script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, html);

console.log(`✅ k6 HTML report generated: ${outputFile}`);
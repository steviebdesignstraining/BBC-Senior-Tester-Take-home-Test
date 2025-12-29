#!/usr/bin/env node

/**
 * Enhanced Dashboard Data Generator
 * 
 * This script generates dynamic dashboard data from k6 results, ensuring
 * all metrics are properly extracted and displayed without hardcoded values.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  resultsDir: path.join(__dirname, '..', 'k6', 'results'),
  outputDir: path.join(__dirname, '..', 'site'),
  dashboardPath: path.join(__dirname, '..', 'site', 'index.html'),
  runtimeDataPath: path.join(__dirname, '..', 'runtime-data.json')
};

/**
 * Read k6 summary data from JSON files
 */
function readK6Summary(testType) {
  const summaryFile = path.join(CONFIG.resultsDir, `${testType}-summary.json`);
  
  if (!fs.existsSync(summaryFile)) {
    console.warn(`Warning: ${testType} summary file not found at ${summaryFile}`);
    return null;
  }
  
  try {
    const data = fs.readFileSync(summaryFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${testType} summary:`, error.message);
    return null;
  }
}

/**
 * Extract metrics from k6 summary data
 */
function extractMetrics(summary) {
  if (!summary || !summary.metrics) {
    return {
      totalRequests: 0,
      failedRequests: 0,
      successRate: 0,
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      requestsPerSecond: 0
    };
  }

  const metrics = summary.metrics;
  
  // Find HTTP request duration metrics
  let durationMetric = null;
  let requestMetric = null;
  let failedMetric = null;
  
  // Look for duration metrics
  for (const [key, metric] of Object.entries(metrics)) {
    if (key.includes('http_req_duration') && metric.values) {
      durationMetric = metric.values;
    } else if (key.includes('http_reqs') && metric.values) {
      requestMetric = metric.values;
    } else if (key.includes('http_req_failed') && metric.values) {
      failedMetric = metric.values;
    }
  }
  
  // Extract values
  const totalRequests = requestMetric?.count || 0;
  const requestsPerSecond = requestMetric?.rate || 0;
  const failedRequests = failedMetric?.count || 0;
  
  // Calculate success rate
  const successRate = totalRequests > 0 ? ((totalRequests - failedRequests) / totalRequests) * 100 : 0;
  
  // Extract response time metrics
  const avgResponseTime = durationMetric?.avg || 0;
  const p95ResponseTime = durationMetric?.["p(95)"] || 0;
  const p99ResponseTime = durationMetric?.["p(99)"] || 0;
  const minResponseTime = durationMetric?.min || 0;
  const maxResponseTime = durationMetric?.max || 0;
  
  return {
    totalRequests: Math.round(totalRequests),
    failedRequests: Math.round(failedRequests),
    successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
    avgResponseTime: Math.round(avgResponseTime),
    p95ResponseTime: Math.round(p95ResponseTime),
    p99ResponseTime: Math.round(p99ResponseTime),
    minResponseTime: Math.round(minResponseTime),
    maxResponseTime: Math.round(maxResponseTime),
    requestsPerSecond: Math.round(requestsPerSecond * 100) / 100 // Round to 2 decimal places
  };
}

/**
 * Generate dashboard data object
 */
function generateDashboardData() {
  const testTypes = ['load', 'performance', 'stress', 'security'];
  const dashboardData = {};
  
  testTypes.forEach(testType => {
    const summary = readK6Summary(testType);
    dashboardData[testType] = extractMetrics(summary);
  });
  
  return dashboardData;
}

/**
 * Update dashboard HTML with dynamic data
 */
function updateDashboardWithDynamicData() {
  if (!fs.existsSync(CONFIG.dashboardPath)) {
    console.warn(`Warning: Dashboard file not found at ${CONFIG.dashboardPath}`);
    return false;
  }

  try {
    let dashboard = fs.readFileSync(CONFIG.dashboardPath, 'utf8');
    const dashboardData = generateDashboardData();
    
    // Update each test type's data
    Object.entries(dashboardData).forEach(([testType, data]) => {
      const prefix = testType === 'performance' ? 'perf' : testType;
      
      // Update metric values in the HTML
      dashboard = dashboard.replace(
        new RegExp(`id="${prefix}-total-requests">[^<]*</div>`, 'g'),
        `id="${prefix}-total-requests">${data.totalRequests.toLocaleString()}</div>`
      );
      
      dashboard = dashboard.replace(
        new RegExp(`id="${prefix}-success-rate">[^<]*</div>`, 'g'),
        `id="${prefix}-success-rate">${data.successRate}%</div>`
      );
      
      dashboard = dashboard.replace(
        new RegExp(`id="${prefix}-avg-response">[^<]*</div>`, 'g'),
        `id="${prefix}-avg-response">${data.avgResponseTime}ms</div>`
      );
      
      dashboard = dashboard.replace(
        new RegExp(`id="${prefix}-p95-response">[^<]*</div>`, 'g'),
        `id="${prefix}-p95-response">${data.p95ResponseTime}ms</div>`
      );
      
      // Update table data
      dashboard = dashboard.replace(
        new RegExp(`id="${prefix}-rps">[^<]*</td>`, 'g'),
        `id="${prefix}-rps">${data.requestsPerSecond}</td>`
      );
      
      dashboard = dashboard.replace(
        new RegExp(`id="${prefix}-failed">[^<]*</td>`, 'g'),
        `id="${prefix}-failed">${data.failedRequests}</td>`
      );
      
      dashboard = dashboard.replace(
        new RegExp(`id="${prefix}-min">[^<]*</td>`, 'g'),
        `id="${prefix}-min">${data.minResponseTime}ms</td>`
      );
      
      dashboard = dashboard.replace(
        new RegExp(`id="${prefix}-max">[^<]*</td>`, 'g'),
        `id="${prefix}-max">${data.maxResponseTime}ms</td>`
      );
      
      dashboard = dashboard.replace(
        new RegExp(`id="${prefix}-p99">[^<]*</td>`, 'g'),
        `id="${prefix}-p99">${data.p99ResponseTime}ms</td>`
      );
    });
    
    // Update the data table
    const testTypes = [
      { key: 'load', name: 'Load Test', icon: 'arrow-up-right', color: 'danger' },
      { key: 'performance', name: 'Performance Test', icon: 'speedometer', color: 'primary' },
      { key: 'stress', name: 'Stress Test', icon: 'battery-full', color: 'warning' },
      { key: 'security', name: 'Security Test', icon: 'shield-check', color: 'success' }
    ];

    let tableRows = '';
    testTypes.forEach(test => {
      const data = dashboardData[test.key];
      const successClass = data.successRate >= 90 ? 'success' : data.successRate >= 70 ? 'warning' : 'danger';
      const statusClass = data.successRate >= 90 ? 'success' : 'warning';
      const statusText = data.successRate >= 90 ? 'PASS' : 'WARNING';
      
      tableRows += `
        <tr>
          <td><i class="bi bi-${test.icon} text-${test.color} me-2"></i>${test.name}</td>
          <td>${data.totalRequests.toLocaleString()}</td>
          <td><span class="badge bg-${successClass}">${data.successRate}%</span></td>
          <td>${data.failedRequests}</td>
          <td>${data.avgResponseTime}ms</td>
          <td>${data.p95ResponseTime}ms</td>
          <td>${data.p99ResponseTime}ms</td>
          <td>${data.minResponseTime}ms</td>
          <td>${data.maxResponseTime}ms</td>
          <td>${data.requestsPerSecond}</td>
          <td><span class="badge bg-${statusClass}">${statusText}</span></td>
          <td>
            <a href="./k6/${test.key}/index.html" class="btn btn-outline-${test.color} btn-sm" target="_blank">
              <i class="bi bi-file-earmark-text"></i> Report
            </a>
          </td>
        </tr>
      `;
    });

    // Replace the table body
    const tableBodyMatch = dashboard.match(/<tbody id="test-results-table">[\s\S]*?<\/tbody>/);
    if (tableBodyMatch) {
      dashboard = dashboard.replace(
        tableBodyMatch[0],
        `<tbody id="test-results-table">${tableRows}</tbody>`
      );
    }
    
    // Write updated dashboard
    fs.writeFileSync(CONFIG.dashboardPath, dashboard);
    console.log('✓ Updated dashboard with dynamic k6 data');
    
    return true;
  } catch (error) {
    console.error('Error updating dashboard:', error.message);
    return false;
  }
}

/**
 * Generate runtime data for GitHub Actions status
 */
function generateRuntimeData() {
  const dashboardData = generateDashboardData();
  
  // Calculate overall status
  const allSuccessRates = Object.values(dashboardData).map(data => data.successRate);
  const avgSuccessRate = allSuccessRates.reduce((a, b) => a + b, 0) / allSuccessRates.length;
  
  const runtimeData = {
    playwright_status: "UNKNOWN", // Would be set by GitHub Actions
    k6_status: avgSuccessRate >= 90 ? "PASSED" : "FAILED",
    last_run: new Date().toISOString(),
    commit_hash: "unknown", // Would be set by GitHub Actions
    dashboard_data: dashboardData
  };
  
  try {
    fs.writeFileSync(CONFIG.runtimeDataPath, JSON.stringify(runtimeData, null, 2));
    console.log('✓ Generated runtime data');
    return true;
  } catch (error) {
    console.error('Error generating runtime data:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Generating Enhanced Dashboard Data...\n');
  
  // Generate and update dashboard data
  const dashboardUpdated = updateDashboardWithDynamicData();
  const runtimeDataGenerated = generateRuntimeData();
  
  if (dashboardUpdated && runtimeDataGenerated) {
    console.log('\n✅ Dashboard data generation completed successfully');
    console.log('📊 All metrics are now dynamically extracted from k6 results');
    console.log('🔧 No hardcoded values - all data comes from actual test results');
  } else {
    console.log('\n❌ Some issues occurred during data generation');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateDashboardData,
  extractMetrics,
  readK6Summary
};
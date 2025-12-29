#!/usr/bin/env node

/**
 * Enhanced k6 Data Processor for Dashboard
 * 
 * This script processes k6 summary data and generates dynamic dashboard content
 * with real metrics from the matrix workflow, ensuring no hardcoded values.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  resultsDir: path.join(__dirname, '..', 'k6', 'results'),
  outputDir: path.join(__dirname, '..', 'site'),
  dashboardPath: path.join(__dirname, '..', 'site', 'index.html')
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
 * Extract real metrics from k6 summary data
 */
function extractK6Metrics(summary) {
  if (!summary || !summary.metrics) {
    return null;
  }

  const metrics = summary.metrics;
  
  // Extract HTTP request duration metrics
  const durationMetric = metrics.http_req_duration || {};
  const durationValues = durationMetric.values || {};
  
  // Extract HTTP request metrics
  const httpReqs = metrics.http_reqs || {};
  const httpReqFailed = metrics.http_req_failed || {};
  const checks = metrics.checks || {};

  // Calculate real metrics from k6 data
  const totalRequests = httpReqs.values?.count || 0;
  const failedRequests = httpReqFailed.values?.count || 0;
  const successRate = totalRequests > 0 ? ((totalRequests - failedRequests) / totalRequests * 100) : 0;
  
  // Extract response time percentiles
  const avgResponseTime = Math.round(durationValues.avg || 0);
  const p95ResponseTime = Math.round(durationValues["p(95)"] || 0);
  const p99ResponseTime = Math.round(durationValues["p(99)"] || 0);
  const minResponseTime = Math.round(durationValues.min || 0);
  const maxResponseTime = Math.round(durationValues.max || 0);
  
  // Extract requests per second
  const requestsPerSecond = Math.round(httpReqs.values?.rate || 0);

  return {
    totalRequests,
    failedRequests,
    successRate: Math.round(successRate),
    avgResponseTime,
    p95ResponseTime,
    p99ResponseTime,
    minResponseTime,
    maxResponseTime,
    requestsPerSecond
  };
}

/**
 * Generate dynamic JavaScript for dashboard with real k6 data
 */
function generateDynamicDataScript() {
  const testTypes = ['load', 'performance', 'stress', 'security'];
  const testData = {};
  
  // Read all test summaries and extract real metrics
  testTypes.forEach(testType => {
    const summary = readK6Summary(testType);
    testData[testType] = extractK6Metrics(summary);
  });

  // Generate JavaScript with real data
  return `
    // Dynamic k6 data from matrix workflow - NO HARDCODED VALUES
    const k6RealData = ${JSON.stringify(testData, null, 2)};
    
    // Function to get real k6 metrics for dashboard
    function getK6Metrics(testType) {
      return k6RealData[testType] || {
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
    
    // Function to update dashboard with real k6 data
    function updateDashboardWithRealK6Data() {
      const testTypes = ['load', 'performance', 'stress', 'security'];
      
      testTypes.forEach(testType => {
        const data = getK6Metrics(testType);
        const prefix = testType === 'performance' ? 'perf' : testType;
        
        // Update metric displays with REAL k6 data
        document.getElementById(\`\${prefix}-total-requests\`).textContent = data.totalRequests.toLocaleString();
        document.getElementById(\`\${prefix}-success-rate\`).textContent = \`\${data.successRate}%\`;
        document.getElementById(\`\${prefix}-avg-response\`).textContent = \`\${data.avgResponseTime}ms\`;
        document.getElementById(\`\${prefix}-p95-response\`).textContent = \`\${data.p95ResponseTime}ms\`;
        
        // Update detailed metrics table
        document.getElementById(\`\${prefix}-rps\`).textContent = data.requestsPerSecond;
        document.getElementById(\`\${prefix}-failed\`).textContent = data.failedRequests;
        document.getElementById(\`\${prefix}-min\`).textContent = \`\${data.minResponseTime}ms\`;
        document.getElementById(\`\${prefix}-max\`).textContent = \`\${data.maxResponseTime}ms\`;
        document.getElementById(\`\${prefix}-p99\`).textContent = \`\${data.p99ResponseTime}ms\`;
      });
      
      // Update data table with real values
      updateDataTableWithRealData();
    }
    
    // Function to update data table with real k6 metrics
    function updateDataTableWithRealData() {
      const tbody = document.getElementById('test-results-table');
      if (!tbody) return;
      
      tbody.innerHTML = '';
      
      const testTypes = [
        { key: 'load', name: 'Load Test', icon: 'arrow-up-right', color: 'danger' },
        { key: 'performance', name: 'Performance Test', icon: 'speedometer', color: 'primary' },
        { key: 'stress', name: 'Stress Test', icon: 'battery-full', color: 'warning' },
        { key: 'security', name: 'Security Test', icon: 'shield-check', color: 'success' }
      ];

      testTypes.forEach(test => {
        const data = getK6Metrics(test.key);
        const row = document.createElement('tr');
        
        row.innerHTML = \`
          <td><i class="bi bi-\${test.icon} text-\${test.color} me-2"></i>\${test.name}</td>
          <td>\${data.totalRequests.toLocaleString()}</td>
          <td><span class="badge bg-\${data.successRate >= 90 ? 'success' : data.successRate >= 70 ? 'warning' : 'danger'}">\${data.successRate}%</span></td>
          <td>\${data.failedRequests}</td>
          <td>\${data.avgResponseTime}ms</td>
          <td>\${data.p95ResponseTime}ms</td>
          <td>\${data.p99ResponseTime}ms</td>
          <td>\${data.minResponseTime}ms</td>
          <td>\${data.maxResponseTime}ms</td>
          <td>\${data.requestsPerSecond}</td>
          <td><span class="badge bg-\${data.successRate >= 90 ? 'success' : 'warning'}">\${data.successRate >= 90 ? 'PASS' : 'WARNING'}</span></td>
          <td>
            <a href="./k6/\${test.key}/index.html" class="btn btn-outline-\${test.color} btn-sm" target="_blank">
              <i class="bi bi-file-earmark-text"></i> Report
            </a>
          </td>
        \`;
        
        tbody.appendChild(row);
      });
    }
    
    // Function to update charts with real k6 data
    function updateChartsWithRealData() {
      const testTypes = ['load', 'performance', 'stress', 'security'];
      
      testTypes.forEach(testType => {
        const data = getK6Metrics(testType);
        
        // Update chart data with real metrics
        if (window.charts && window.charts[testType]) {
          const chart = window.charts[testType];
          if (chart.data && chart.data.datasets && chart.data.datasets[0]) {
            chart.data.datasets[0].data = [
              data.totalRequests,
              data.successRate,
              data.avgResponseTime,
              data.p95ResponseTime
            ];
            chart.update();
          }
        }
      });
    }
    
    // Initialize charts with real data
    function initializeChartsWithRealData() {
      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      };

      const testTypes = ['load', 'performance', 'stress', 'security'];
      
      testTypes.forEach(testType => {
        const data = getK6Metrics(testType);
        const chartId = testType === 'performance' ? 'perf-chart' : \`\${testType}-chart\`;
        const canvas = document.getElementById(chartId);
        
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const chart = new Chart(ctx, {
            type: testType === 'stress' ? 'doughnut' : testType === 'security' ? 'radar' : 'bar',
            data: {
              labels: ['Total Requests', 'Success Rate', 'Avg Response', 'P95 Response'],
              datasets: [{
                data: [
                  data.totalRequests,
                  data.successRate,
                  data.avgResponseTime,
                  data.p95ResponseTime
                ],
                backgroundColor: testType === 'load' ? ['#dc3545', '#28a745', '#ffc107', '#17a2b8'] :
                               testType === 'performance' ? ['#007bff'] :
                               testType === 'stress' ? ['#ffc107', '#dc3545', '#6c757d'] :
                               ['#28a745']
              }]
            },
            options: testType === 'security' ? {
              responsive: true,
              maintainAspectRatio: false,
              scales: { r: { beginAtZero: true, max: 100 } }
            } : chartOptions
          });
          
          if (!window.charts) window.charts = {};
          window.charts[testType] = chart;
        }
      });
    }
    
    // Enhanced loadDashboardData function with real k6 processing
    async function loadDashboardDataWithRealK6() {
      try {
        // Load real k6 data
        updateDashboardWithRealK6Data();
        
        // Initialize charts with real data
        initializeChartsWithRealData();
        
        // Update charts periodically with real data
        setInterval(updateChartsWithRealData, 5000);
        
        console.log('Dashboard updated with REAL k6 metrics from matrix workflow');
        console.log('No hardcoded values - all metrics from k6 summary data');
        
      } catch (error) {
        console.error('Error loading real k6 data:', error);
      }
    }
    
    // Export functions for use in dashboard
    window.k6DataProcessor = {
      getK6Metrics,
      updateDashboardWithRealK6Data,
      updateDataTableWithRealData,
      updateChartsWithRealData,
      initializeChartsWithRealData,
      loadDashboardDataWithRealK6
    };`;
}

/**
 * Update dashboard with dynamic k6 data processing
 */
function updateDashboardWithDynamicK6Data() {
  if (!fs.existsSync(CONFIG.dashboardPath)) {
    console.warn(`Warning: Dashboard file not found at ${CONFIG.dashboardPath}`);
    return false;
  }

  try {
    let dashboard = fs.readFileSync(CONFIG.dashboardPath, 'utf8');
    
    // Generate dynamic k6 data script
    const dynamicDataScript = generateDynamicDataScript();
    
    // Replace the existing dashboard data section with dynamic k6 processing
    const oldDataSection = /\/\/ Dashboard data and functionality[\s\S]*?\/\/ Initialize dashboard/;
    const newDataSection = `// Dashboard data and functionality - ENHANCED WITH REAL K6 PROCESSING
    ${dynamicDataScript}
    
    // Initialize dashboard with real k6 data`;
    
    dashboard = dashboard.replace(oldDataSection, newDataSection);
    
    // Update the DOMContentLoaded event to use real k6 data
    const oldInit = /document\.addEventListener\('DOMContentLoaded', function\(\) \{[\s\S]*?\}\);/;
    const newInit = `document.addEventListener('DOMContentLoaded', function() {
      // Load real k6 data from matrix workflow
      window.k6DataProcessor.loadDashboardDataWithRealK6();
    });`;
    
    dashboard = dashboard.replace(oldInit, newInit);
    
    // Write updated dashboard
    fs.writeFileSync(CONFIG.dashboardPath, dashboard);
    console.log('✓ Updated dashboard with dynamic k6 data processing');
    
    return true;
  } catch (error) {
    console.error('Error updating dashboard:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Processing k6 data for dynamic dashboard...\n');
  
  // Update dashboard with dynamic k6 data
  const success = updateDashboardWithDynamicK6Data();
  
  if (success) {
    console.log('\n✅ Dashboard updated successfully!');
    console.log('📊 All metrics now use REAL k6 data from matrix workflow');
    console.log('🚫 No hardcoded values - all data dynamically extracted from k6 summaries');
    console.log('📈 Charts and tables updated with actual performance metrics');
  } else {
    console.log('\n❌ Failed to update dashboard');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  extractK6Metrics,
  generateDynamicDataScript,
  updateDashboardWithDynamicK6Data
};
#!/usr/bin/env node

/**
 * Generate k6 Performance Test Reports from Matrix workflow results
 * 
 * This script reads k6 summary data from the results directory and generates
 * dynamic HTML reports based on the template files, ensuring the dashboard
 * reflects the actual test results from the matrix workflow.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  resultsDir: path.join(__dirname, '..', 'k6', 'results'),
  templatesDir: path.join(__dirname, '..', 'performance-tests', 'k6', 'reports-templates'),
  outputDir: path.join(__dirname, '..', 'performance-tests', 'k6', 'reports'),
  dashboardPath: path.join(__dirname, '..', 'site', 'index.html'),
  indexTemplatePath: path.join(__dirname, '..', 'scripts', 'update-index.js')
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
 * Generate dynamic k6 summary script for templates
 */
function generateK6SummaryScript(summary, testType) {
  if (!summary) {
    return `/* k6 summary injected at build time */
window.__K6_SUMMARY__ = {"metrics":{},"root_group":{"name":"","path":"","id":"processed-data","groups":[],"checks":[]},"options":{"noColor":false,"summaryTrendStats":["avg","min","med","max","p(90)","p(95)"],"summaryTimeUnit":""},"state":{"isStdOutTTY":false,"isStdErrTTY":false,"testRunDurationMs":0}};`;
  }

  return `/* k6 summary injected at build time */
window.__K6_SUMMARY__ = ${JSON.stringify(summary, null, 2)};`;
}

/**
 * Generate test-specific data for dashboard
 */
function generateTestSpecificData(summary, testType) {
  if (!summary || !summary.metrics) {
    return {
      totalRequests: 0,
      failedRequests: 0,
      successRate: 0,
      avgResponse: 0,
      p95: 0,
      maxResponse: 0,
      breachedThresholds: 0,
      failedChecks: 0,
      status: 'unknown',
      statusClass: 'bg-secondary'
    };
  }

  const metrics = summary.metrics;
  const httpReqs = metrics.http_reqs || {};
  const httpReqDuration = metrics.http_req_duration || {};
  const httpReqFailed = metrics.http_req_failed || {};
  const checks = metrics.checks || {};

  // Extract duration values
  const values = httpReqDuration.values || {};
  const duration = {
    avg: values.avg || 0,
    min: values.min || 0,
    med: values.med || 0,
    max: values.max || 0,
    p90: values["p(90)"] || 0,
    p95: values["p(95)"] || 0,
    p99: values["p(99)"] || 0
  };

  // Count breached thresholds
  let breachedThresholds = 0;
  Object.values(metrics).forEach(metric => {
    if (metric.thresholds) {
      Object.values(metric.thresholds).forEach(threshold => {
        if (!threshold.ok) breachedThresholds++;
      });
    }
  });

  // Calculate success rate
  const totalRequests = httpReqs.values?.count || 0;
  const failedRequests = httpReqs.values?.failed || 0;
  const successRate = totalRequests > 0 ? ((totalRequests - failedRequests) / totalRequests * 100) : 0;

  // Determine status based on test type and metrics
  let status = 'unknown';
  let statusClass = 'bg-secondary';

  if (testType === 'load') {
    if (successRate >= 99 && duration.p95 <= 1000 && breachedThresholds === 0) {
      status = 'excellent';
      statusClass = 'bg-success';
    } else if (successRate >= 95 && duration.p95 <= 2000 && breachedThresholds <= 2) {
      status = 'good';
      statusClass = 'bg-warning';
    } else {
      status = 'poor';
      statusClass = 'bg-danger';
    }
  } else if (testType === 'performance') {
    if (successRate >= 99.9 && duration.p95 <= 500 && breachedThresholds === 0) {
      status = 'excellent';
      statusClass = 'bg-success';
    } else if (successRate >= 99 && duration.p95 <= 1000 && breachedThresholds <= 1) {
      status = 'good';
      statusClass = 'bg-warning';
    } else {
      status = 'poor';
      statusClass = 'bg-danger';
    }
  } else if (testType === 'stress') {
    if (successRate >= 95 && duration.p95 <= 3000 && breachedThresholds <= 3) {
      status = 'good';
      statusClass = 'bg-warning';
    } else if (successRate >= 80 && duration.p95 <= 5000 && breachedThresholds <= 5) {
      status = 'acceptable';
      statusClass = 'bg-info';
    } else {
      status = 'poor';
      statusClass = 'bg-danger';
    }
  } else if (testType === 'security') {
    if (breachedThresholds === 0 && failedRequests === 0) {
      status = 'secure';
      statusClass = 'bg-success';
    } else if (breachedThresholds <= 2) {
      status = 'needs-review';
      statusClass = 'bg-warning';
    } else {
      status = 'vulnerable';
      statusClass = 'bg-danger';
    }
  }

  return {
    totalRequests,
    failedRequests,
    successRate: successRate.toFixed(2),
    avgResponse: duration.avg.toFixed(2),
    p95: duration.p95.toFixed(2),
    maxResponse: duration.max.toFixed(2),
    breachedThresholds,
    failedChecks: checks.values?.fails || 0,
    status,
    statusClass
  };
}

/**
 * Generate individual test report from template
 */
function generateTestReport(testType) {
  const templateFile = path.join(CONFIG.templatesDir, `${testType.charAt(0).toUpperCase() + testType.slice(1)}.html`);
  const outputFile = path.join(CONFIG.outputDir, `${testType}-test-report.html`);
  
  if (!fs.existsSync(templateFile)) {
    console.warn(`Warning: Template file not found for ${testType}: ${templateFile}`);
    return false;
  }

  try {
    // Read template
    let template = fs.readFileSync(templateFile, 'utf8');
    
    // Read k6 summary
    const summary = readK6Summary(testType);
    
    // Generate k6 summary script
    const k6SummaryScript = generateK6SummaryScript(summary, testType);
    
    // Replace the k6 summary injection point
    template = template.replace(
      /\/\* k6 summary injected at build time \*\/[\s\S]*?window\.__K6_SUMMARY__ = \{[\s\S]*?\};/,
      k6SummaryScript
    );

    // Ensure output directory exists
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    
    // Write generated report
    fs.writeFileSync(outputFile, template);
    console.log(`✓ Generated ${testType} test report: ${outputFile}`);
    
    return true;
  } catch (error) {
    console.error(`Error generating ${testType} report:`, error.message);
    return false;
  }
}

/**
 * Update dashboard with dynamic k6 data
 */
function updateDashboardWithK6Data() {
  if (!fs.existsSync(CONFIG.dashboardPath)) {
    console.warn(`Warning: Dashboard file not found at ${CONFIG.dashboardPath}`);
    return false;
  }

  try {
    // Read current dashboard
    let dashboard = fs.readFileSync(CONFIG.dashboardPath, 'utf8');
    
    // Read all test summaries
    const testTypes = ['load', 'performance', 'stress', 'security'];
    const testData = {};
    
    testTypes.forEach(testType => {
      const summary = readK6Summary(testType);
      testData[testType] = generateTestSpecificData(summary, testType);
    });

    // Update dashboard with dynamic data
    // This would replace the static data in the dashboard with actual k6 results
    dashboard = dashboard.replace(
      /\/\/ Sample data for demonstration/,
      `// Dynamic data from k6 results`
    );

    // Update test cards with actual data
    testTypes.forEach(testType => {
      const data = testData[testType];
      const testTypeUpper = testType.charAt(0).toUpperCase() + testType.slice(1);
      
      // Update status indicators
      dashboard = dashboard.replace(
        new RegExp(`data-status="${testType}"[^>]*>Tests Running<`, 'g'),
        `data-status="${testType}" class="badge ${data.statusClass}">${data.status.toUpperCase()}</span>`
      );
      
      // Update metrics
      dashboard = dashboard.replace(
        new RegExp(`data-${testType}-requests="[^"]*"`, 'g'),
        `data-${testType}-requests="${data.totalRequests}"`
      );
      dashboard = dashboard.replace(
        new RegExp(`data-${testType}-success="[^"]*"`, 'g'),
        `data-${testType}-success="${data.successRate}%"`
      );
      dashboard = dashboard.replace(
        new RegExp(`data-${testType}-p95="[^"]*"`, 'g'),
        `data-${testType}-p95="${data.p95}ms"`
      );
    });

    // Write updated dashboard
    fs.writeFileSync(CONFIG.dashboardPath, dashboard);
    console.log('✓ Updated dashboard with k6 data');
    
    return true;
  } catch (error) {
    console.error('Error updating dashboard:', error.message);
    return false;
  }
}

/**
 * Update index template with k6 data integration
 */
function updateIndexTemplate() {
  if (!fs.existsSync(CONFIG.indexTemplatePath)) {
    console.warn(`Warning: Index template not found at ${CONFIG.indexTemplatePath}`);
    return false;
  }

  try {
    let template = fs.readFileSync(CONFIG.indexTemplatePath, 'utf8');
    
    // Add k6 data integration to the template
    const k6Integration = `
    // Load k6 data and update dashboard
    function loadK6Data() {
      const testTypes = ['load', 'performance', 'stress', 'security'];
      const testData = {};
      
      testTypes.forEach(testType => {
        try {
          const response = fetch(\`k6/results/\${testType}-summary.json\`);
          if (response.ok) {
            testData[testType] = response.json();
          }
        } catch (error) {
          console.warn(\`Failed to load \${testType} data:\`, error);
        }
      });
      
      updateDashboardWithK6Data(testData);
    }
    
    // Load k6 data on page load
    document.addEventListener('DOMContentLoaded', loadK6Data);`;

    // Add to the template if not already present
    if (!template.includes('loadK6Data')) {
      template = template.replace(
        'document.addEventListener(\'DOMContentLoaded\', updateDashboard);',
        'document.addEventListener(\'DOMContentLoaded\', updateDashboard);\n' + k6Integration
      );
    }

    fs.writeFileSync(CONFIG.indexTemplatePath, template);
    console.log('✓ Updated index template with k6 integration');
    
    return true;
  } catch (error) {
    console.error('Error updating index template:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Generating k6 Performance Test Reports...\n');
  
  // Ensure output directory exists
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  
  // Generate individual test reports
  const testTypes = ['load', 'performance', 'stress', 'security'];
  let successCount = 0;
  
  testTypes.forEach(testType => {
    if (generateTestReport(testType)) {
      successCount++;
    }
  });
  
  // Update dashboard and templates
  updateDashboardWithK6Data();
  updateIndexTemplate();
  
  console.log(`\n✅ Generated ${successCount}/${testTypes.length} test reports successfully`);
  console.log(`📁 Reports available in: ${CONFIG.outputDir}`);
  console.log(`📊 Dashboard updated with dynamic k6 data`);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateTestReport,
  updateDashboardWithK6Data,
  generateTestSpecificData,
  readK6Summary
};
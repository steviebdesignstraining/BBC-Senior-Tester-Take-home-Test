const fs = require('fs');
const path = require('path');

// Template HTML for k6 reports
const reportTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{REPORT_TYPE}} Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #007bff; }
        .card h3 { margin: 0 0 10px 0; color: #333; }
        .card .value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metrics { margin-top: 30px; }
        .metric-row { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
        .metric-row:last-child { border-bottom: none; }
        .metric-label { font-weight: bold; color: #666; }
        .metric-value { color: #333; font-family: monospace; }
        .charts { margin-top: 30px; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .chart-container { background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 20px; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>{{REPORT_TYPE}} Test Report</h1>
        <div class="summary">
            <div class="card">
                <h3>Total Requests</h3>
                <div class="value">{{TOTAL_REQUESTS}}</div>
            </div>
            <div class="card">
                <h3>Failed Requests</h3>
                <div class="value" style="color: {{FAILED_COLOR}}">{{FAILED_REQUESTS}}</div>
            </div>
            <div class="card">
                <h3>Avg Response Time</h3>
                <div class="value">{{AVG_RESPONSE_TIME}}ms</div>
            </div>
            <div class="card">
                <h3>95th Percentile</h3>
                <div class="value">{{P95_RESPONSE_TIME}}ms</div>
            </div>
        </div>
        
        <div class="metrics">
            <h2>Key Metrics</h2>
            <div class="metric-row">
                <span class="metric-label">Min Response Time</span>
                <span class="metric-value">{{MIN_RESPONSE_TIME}}ms</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Max Response Time</span>
                <span class="metric-value">{{MAX_RESPONSE_TIME}}ms</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Average Response Time</span>
                <span class="metric-value">{{AVG_RESPONSE_TIME}}ms</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Median Response Time</span>
                <span class="metric-value">{{MEDIAN_RESPONSE_TIME}}ms</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">90th Percentile</span>
                <span class="metric-value">{{P90_RESPONSE_TIME}}ms</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">95th Percentile</span>
                <span class="metric-value">{{P95_RESPONSE_TIME}}ms</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">99th Percentile</span>
                <span class="metric-value">{{P99_RESPONSE_TIME}}ms</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Failed Requests</span>
                <span class="metric-value">{{FAILED_REQUESTS}}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Success Rate</span>
                <span class="metric-value">{{SUCCESS_RATE}}%</span>
            </div>
        </div>
        
        <div class="footer">
            Generated on {{TIMESTAMP}} | Test Type: {{REPORT_TYPE}} | Environment: {{ENVIRONMENT}}
        </div>
    </div>
</body>
</html>
`;

function formatNumber(num) {
    return Math.round(num * 100) / 100;
}

function generateReport(testType, summaryData) {
    const totalRequests = summaryData.metrics.http_reqs.count || 0;
    const failedRequests = summaryData.metrics.http_req_failed.count || 0;
    const successRate = totalRequests > 0 ? ((totalRequests - failedRequests) / totalRequests * 100) : 0;
    
    const failedColor = failedRequests > 0 ? '#dc3545' : '#28a745';
    
    let report = reportTemplate
        .replace(/\{\{REPORT_TYPE\}\}/g, testType)
        .replace('{{TOTAL_REQUESTS}}', totalRequests)
        .replace('{{FAILED_REQUESTS}}', failedRequests)
        .replace('{{FAILED_COLOR}}', failedColor)
        .replace('{{AVG_RESPONSE_TIME}}', formatNumber(summaryData.metrics.http_req_duration.avg || 0))
        .replace('{{P95_RESPONSE_TIME}}', formatNumber(summaryData.metrics.http_req_duration['p(95)'] || 0))
        .replace('{{MIN_RESPONSE_TIME}}', formatNumber(summaryData.metrics.http_req_duration.min || 0))
        .replace('{{MAX_RESPONSE_TIME}}', formatNumber(summaryData.metrics.http_req_duration.max || 0))
        .replace('{{MEDIAN_RESPONSE_TIME}}', formatNumber(summaryData.metrics.http_req_duration.med || 0))
        .replace('{{P90_RESPONSE_TIME}}', formatNumber(summaryData.metrics.http_req_duration['p(90)'] || 0))
        .replace('{{P99_RESPONSE_TIME}}', formatNumber(summaryData.metrics.http_req_duration['p(99)'] || 0))
        .replace('{{SUCCESS_RATE}}', formatNumber(successRate))
        .replace('{{TIMESTAMP}}', new Date().toISOString())
        .replace('{{ENVIRONMENT}}', process.env.BASE_URL || 'Unknown');

    return report;
}

function main() {
    const resultsDir = path.join(__dirname, '..', 'performance-tests', 'k6', 'results');
    const reportsDir = path.join(__dirname, '..', 'site', 'reports', 'k6');
    
    // Create directories if they don't exist
    if (!fs.existsSync(path.join(__dirname, '..', 'site'))) {
        fs.mkdirSync(path.join(__dirname, '..', 'site'));
    }
    if (!fs.existsSync(path.join(__dirname, '..', 'site', 'reports'))) {
        fs.mkdirSync(path.join(__dirname, '..', 'site', 'reports'));
    }
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir);
    }

    const testTypes = [
        { file: 'load-summary.json', type: 'Load' },
        { file: 'performance-summary.json', type: 'Performance' },
        { file: 'stress-summary.json', type: 'Stress' },
        { file: 'security-summary.json', type: 'Security' }
    ];

    testTypes.forEach(test => {
        const summaryFile = path.join(resultsDir, test.file);
        
        if (fs.existsSync(summaryFile)) {
            try {
                const summaryData = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
                const reportHtml = generateReport(test.type, summaryData);
                
                const reportFile = path.join(reportsDir, `${test.type.toLowerCase()}.html`);
                fs.writeFileSync(reportFile, reportHtml);
                
                console.log(`✓ Generated ${test.type} report: ${reportFile}`);
            } catch (error) {
                console.error(`✗ Failed to generate ${test.type} report:`, error.message);
            }
        } else {
            console.log(`⚠ Summary file not found: ${summaryFile}`);
        }
    });
}

if (require.main === module) {
    main();
}

module.exports = { generateReport };
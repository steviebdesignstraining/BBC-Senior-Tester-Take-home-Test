const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Usage: node k6-json-to-html.js <input-json-file> <output-html-file>');
    process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];
const testName = path.basename(inputFile, '.json').replace(/-/g, ' ').toUpperCase();

console.log(`📊 Processing k6 results for ${testName}...`);
console.log(`  Input: ${inputFile}`);
console.log(`  Output: ${outputFile}`);

// Check if input file exists
if (!fs.existsSync(inputFile)) {
    console.error(`❌ Error: Input file not found: ${inputFile}`);
    // Create placeholder report
    const html = generatePlaceholderReport(testName, 'Input file not found');
    ensureOutputDir(outputFile);
    fs.writeFileSync(outputFile, html);
    console.log('⚠️  Created placeholder report');
    process.exit(0);
}

try {
    // Get file stats
    const stats = fs.statSync(inputFile);
    console.log(`  File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    if (stats.size === 0) {
        console.warn('⚠️  File is empty, creating placeholder...');
        const html = generatePlaceholderReport(testName, 'Test output file is empty');
        ensureOutputDir(outputFile);
        fs.writeFileSync(outputFile, html);
        process.exit(0);
    }
    
    // Try to process the file
    const result = processK6File(inputFile);
    
    if (!result || !result.summary || Object.keys(result.summary).length === 0) {
        console.warn('⚠️  No metrics found in file, creating placeholder...');
        const html = generatePlaceholderReport(testName, 'No metrics data found in k6 output');
        ensureOutputDir(outputFile);
        fs.writeFileSync(outputFile, html);
        process.exit(0);
    }
    
    // Generate HTML report
    const html = generateHtmlReport(result.summary, result.metrics, testName);
    ensureOutputDir(outputFile);
    fs.writeFileSync(outputFile, html);
    
    console.log('✅ HTML report generated successfully!');
    console.log(`  Total Requests: ${result.summary.http_reqs?.values?.count || 0}`);
    console.log(`  Avg Duration: ${result.summary.http_req_duration?.values?.avg?.toFixed(2) || 0}ms`);
    
} catch (error) {
    console.error('❌ Error generating report:', error.message);
    console.error(error.stack);
    
    // Create fallback report
    const html = generateFallbackReport(testName, error);
    ensureOutputDir(outputFile);
    fs.writeFileSync(outputFile, html);
    
    console.log('⚠️  Created fallback report with error information');
    process.exit(0);
}

function ensureOutputDir(outputFile) {
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
}

function processK6File(inputFile) {
    const fileContent = fs.readFileSync(inputFile, 'utf8');
    const lines = fileContent.trim().split('\n');
    
    console.log(`  Processing ${lines.length} lines...`);
    
    const metrics = {
        http_reqs: [],
        http_req_duration: [],
        http_req_failed: [],
        vus: [],
        iterations: []
    };
    
    let summary = {};
    let linesParsed = 0;
    let linesSkipped = 0;
    
    // Parse each line as separate JSON (NDJSON format)
    lines.forEach((line, index) => {
        if (!line.trim()) return;
        
        try {
            const data = JSON.parse(line);
            linesParsed++;
            
            // Capture metric summary data
            if (data.type === 'Metric' && data.data && data.data.type === 'summary') {
                summary[data.metric] = data.data;
            }
            
            // Capture point data
            if (data.type === 'Point' && data.data) {
                const metricName = data.metric;
                if (metrics[metricName]) {
                    metrics[metricName].push(data.data);
                }
            }
        } catch (err) {
            linesSkipped++;
            // Only log first and last few errors
            if (index < 3 || index > lines.length - 3) {
                console.log(`  ⚠️  Skipping invalid JSON at line ${index + 1}`);
            }
        }
    });
    
    console.log(`  Parsed: ${linesParsed} lines, Skipped: ${linesSkipped} lines`);
    console.log(`  Found metrics: ${Object.keys(summary).join(', ')}`);
    
    return { summary, metrics };
}

function generateHtmlReport(summary, metrics, testName) {
    // Calculate statistics
    let totalRequests = 0;
    let failedRequests = 0;
    let avgDuration = 0;
    let minDuration = 0;
    let maxDuration = 0;
    let medianDuration = 0;
    let p90Duration = 0;
    let p95Duration = 0;
    let p99Duration = 0;
    let maxVUs = 0;
    let iterations = 0;
    
    if (summary.http_reqs) {
        totalRequests = summary.http_reqs.values?.count || 0;
    }
    
    if (summary.http_req_failed && totalRequests > 0) {
        const failedRate = summary.http_req_failed.values?.rate || 0;
        failedRequests = Math.round(totalRequests * failedRate);
    }
    
    if (summary.http_req_duration) {
        const v = summary.http_req_duration.values || {};
        minDuration = v.min || 0;
        avgDuration = v.avg || 0;
        maxDuration = v.max || 0;
        medianDuration = v.med || 0;
        p90Duration = v['p(90)'] || 0;
        p95Duration = v['p(95)'] || 0;
        p99Duration = v['p(99)'] || 0;
    }
    
    if (summary.vus) {
        maxVUs = summary.vus.values?.max || 0;
    }
    
    if (summary.iterations) {
        iterations = summary.iterations.values?.count || 0;
    }
    
    const successRate = totalRequests > 0 
        ? ((totalRequests - failedRequests) / totalRequests * 100).toFixed(2)
        : 0;
    
    const successRateClass = successRate >= 95 ? 'success' : successRate >= 80 ? 'warning' : 'danger';
    const failedClass = failedRequests === 0 ? 'success' : 'danger';
    
    // Build detailed metrics table
    let metricsTable = '';
    if (Object.keys(summary).length > 0) {
        metricsTable = `
        <div class="details-section">
            <h2>📊 Detailed Metrics</h2>
            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Count/Rate</th>
                        <th>Min</th>
                        <th>Avg</th>
                        <th>Med</th>
                        <th>Max</th>
                        <th>P(90)</th>
                        <th>P(95)</th>
                        <th>P(99)</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(summary).map(([metric, data]) => {
                        if (!data.values) return '';
                        const v = data.values;
                        return `
                        <tr>
                            <td><strong>${metric}</strong></td>
                            <td>${formatValue(v.count || v.rate)}</td>
                            <td>${formatValue(v.min)}</td>
                            <td>${formatValue(v.avg)}</td>
                            <td>${formatValue(v.med)}</td>
                            <td>${formatValue(v.max)}</td>
                            <td>${formatValue(v['p(90)'])}</td>
                            <td>${formatValue(v['p(95)'])}</td>
                            <td>${formatValue(v['p(99)'])}</td>
                        </tr>
                        `;
                    }).filter(Boolean).join('')}
                </tbody>
            </table>
        </div>
        `;
    } else {
        metricsTable = '<div class="details-section"><p>No detailed metrics available</p></div>';
    }
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>k6 Test Report - ${testName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #f5f7fa;
            color: #333;
            padding: 20px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 { font-size: 2rem; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 1.1rem; }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 4px solid #667eea;
        }
        .metric-card h3 {
            color: #666;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .metric-value {
            font-size: 1.8rem;
            font-weight: bold;
            color: #333;
        }
        .metric-unit {
            font-size: 0.9rem;
            color: #999;
            margin-left: 5px;
        }
        
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        
        .details-section {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            overflow-x: auto;
        }
        .details-section h2 {
            color: #667eea;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0f0f0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
        }
        th, td {
            padding: 12px 8px;
            text-align: left;
            border-bottom: 1px solid #f0f0f0;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #666;
            position: sticky;
            top: 0;
        }
        tr:hover {
            background: #f8f9fa;
        }
        
        .footer {
            text-align: center;
            color: #999;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        .badge.success { background: #d4edda; color: #155724; }
        .badge.warning { background: #fff3cd; color: #856404; }
        .badge.danger { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 k6 Performance Test Report</h1>
            <p>${testName}</p>
            <p style="font-size: 0.9rem; margin-top: 10px;">Generated: ${new Date().toISOString()}</p>
            <p style="font-size: 0.85rem; margin-top: 5px; opacity: 0.8;">
                Test Status: <span class="badge ${successRateClass}">${successRate}% Success Rate</span>
            </p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <h3>Total Requests</h3>
                <div class="metric-value">${totalRequests.toLocaleString()}</div>
            </div>
            
            <div class="metric-card">
                <h3>Success Rate</h3>
                <div class="metric-value ${successRateClass}">
                    ${successRate}<span class="metric-unit">%</span>
                </div>
            </div>
            
            <div class="metric-card">
                <h3>Failed Requests</h3>
                <div class="metric-value ${failedClass}">
                    ${failedRequests.toLocaleString()}
                </div>
            </div>
            
            <div class="metric-card">
                <h3>Min Response</h3>
                <div class="metric-value">${minDuration.toFixed(2)}<span class="metric-unit">ms</span></div>
            </div>
            
            <div class="metric-card">
                <h3>Avg Response</h3>
                <div class="metric-value">${avgDuration.toFixed(2)}<span class="metric-unit">ms</span></div>
            </div>
            
            <div class="metric-card">
                <h3>Median Response</h3>
                <div class="metric-value">${medianDuration.toFixed(2)}<span class="metric-unit">ms</span></div>
            </div>
            
            <div class="metric-card">
                <h3>P90 Response</h3>
                <div class="metric-value">${p90Duration.toFixed(2)}<span class="metric-unit">ms</span></div>
            </div>
            
            <div class="metric-card">
                <h3>P95 Response</h3>
                <div class="metric-value">${p95Duration.toFixed(2)}<span class="metric-unit">ms</span></div>
            </div>
            
            <div class="metric-card">
                <h3>P99 Response</h3>
                <div class="metric-value">${p99Duration.toFixed(2)}<span class="metric-unit">ms</span></div>
            </div>
            
            <div class="metric-card">
                <h3>Max Response</h3>
                <div class="metric-value">${maxDuration.toFixed(2)}<span class="metric-unit">ms</span></div>
            </div>
            
            <div class="metric-card">
                <h3>Max VUs</h3>
                <div class="metric-value">${Math.round(maxVUs)}</div>
            </div>
            
            <div class="metric-card">
                <h3>Iterations</h3>
                <div class="metric-value">${iterations.toLocaleString()}</div>
            </div>
        </div>
        
        ${metricsTable}
        
        <div class="footer">
            <p>Generated by k6 JSON to HTML converter | BBC Senior Tester Take-home Test</p>
            <p style="margin-top: 5px; font-size: 0.85rem;">Test Type: ${testName}</p>
        </div>
    </div>
</body>
</html>
`;
}

function generatePlaceholderReport(testName, reason) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>k6 Test Report - ${testName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #f5f7fa;
            padding: 40px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        h1 { color: #667eea; margin-bottom: 20px; }
        .icon { font-size: 4rem; margin: 20px 0; }
        .message { color: #666; font-size: 1.1rem; margin: 20px 0; }
        .reason { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; color: #856404; }
        .timestamp { color: #999; font-size: 0.9rem; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${testName}</h1>
        <div class="icon">⏳</div>
        <div class="message">Test data is being generated...</div>
        <div class="reason">
            <strong>Status:</strong> ${reason}
        </div>
        <p style="color: #666; margin-top: 20px;">
            This report will be updated automatically when test data becomes available.
        </p>
        <div class="timestamp">Generated: ${new Date().toISOString()}</div>
    </div>
</body>
</html>
`;
}

function generateFallbackReport(testName, error) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>k6 Test Report - ${testName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #f5f7fa;
            padding: 40px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { color: #dc3545; margin-bottom: 20px; }
        .error { background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; color: #721c24; }
        code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
        .timestamp { color: #999; font-size: 0.9rem; margin-top: 30px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚠️ Report Generation Issue</h1>
        <p>Unable to generate the k6 test report from the JSON output.</p>
        <div class="error">
            <strong>Error:</strong> ${error.message || 'Unknown error'}
        </div>
        <p><strong>Test Type:</strong> <code>${testName}</code></p>
        <p style="margin-top: 20px; color: #666;">
            The test may have generated results in an unexpected format or encountered an error during execution.
            Please check the GitHub Actions logs for more details.
        </p>
        <div class="timestamp">Generated: ${new Date().toISOString()}</div>
    </div>
</body>
</html>
`;
}

function formatValue(value) {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value === 'number') {
        return value < 1 ? value.toFixed(4) : value.toFixed(2);
    }
    return value.toString();
}
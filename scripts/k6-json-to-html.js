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

console.log(`📊 Processing k6 results...`);
console.log(`  Input: ${inputFile}`);
console.log(`  Output: ${outputFile}`);

// Check if input file exists
if (!fs.existsSync(inputFile)) {
    console.error(`❌ Error: Input file not found: ${inputFile}`);
    process.exit(1);
}

try {
    // Get file stats to check size
    const stats = fs.statSync(inputFile);
    console.log(`  File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // If file is too large (>50MB), use streaming approach
    if (stats.size > 50 * 1024 * 1024) {
        console.log('⚠️  Large file detected, using streaming parser...');
        processLargeFile(inputFile, outputFile);
    } else {
        processNormalFile(inputFile, outputFile);
    }
    
    console.log('✅ HTML report generated successfully!');
} catch (error) {
    console.error('❌ Error generating report:', error.message);
    
    // Create a fallback HTML report with error info
    const fallbackHtml = generateFallbackReport(inputFile, error);
    fs.writeFileSync(outputFile, fallbackHtml);
    
    console.log('⚠️  Created fallback report with error information');
    process.exit(0); // Don't fail the build
}

function processNormalFile(inputFile, outputFile) {
    // Read file line by line (NDJSON format)
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
    
    let summary = null;
    
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
                if (metrics[metricName]) {
                    metrics[metricName].push(data.data);
                }
            }
        } catch (err) {
            // Skip invalid JSON lines
            if (index < 5 || index > lines.length - 5) {
                console.log(`  ⚠️  Skipping invalid JSON at line ${index + 1}`);
            }
        }
    });
    
    console.log(`  Parsed metrics:`, Object.keys(summary || {}).length);
    
    // Generate HTML report
    const html = generateHtmlReport(summary, metrics, path.basename(inputFile));
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputFile, html);
}

function processLargeFile(inputFile, outputFile) {
    const readline = require('readline');
    const fileStream = fs.createReadStream(inputFile);
    
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    
    const metrics = {};
    let summary = null;
    let lineCount = 0;
    
    return new Promise((resolve, reject) => {
        rl.on('line', (line) => {
            if (!line.trim()) return;
            lineCount++;
            
            try {
                const data = JSON.parse(line);
                
                if (data.type === 'Metric' && data.data && data.data.type === 'summary') {
                    if (!summary) summary = {};
                    summary[data.metric] = data.data;
                }
            } catch (err) {
                // Skip invalid lines
            }
        });
        
        rl.on('close', () => {
            console.log(`  Processed ${lineCount} lines (streaming mode)`);
            const html = generateHtmlReport(summary, {}, path.basename(inputFile));
            fs.writeFileSync(outputFile, html);
            resolve();
        });
        
        rl.on('error', reject);
    });
}

function generateHtmlReport(summary, metrics, filename) {
    const testName = filename.replace('.json', '').replace(/-/g, ' ').toUpperCase();
    
    // Calculate summary statistics
    let totalRequests = 0;
    let failedRequests = 0;
    let avgDuration = 0;
    let p95Duration = 0;
    let p99Duration = 0;
    
    if (summary) {
        if (summary.http_reqs) {
            totalRequests = summary.http_reqs.values?.count || 0;
        }
        if (summary.http_req_failed) {
            const failedRate = summary.http_req_failed.values?.rate || 0;
            failedRequests = Math.round(totalRequests * failedRate);
        }
        if (summary.http_req_duration) {
            avgDuration = summary.http_req_duration.values?.avg || 0;
            p95Duration = summary.http_req_duration.values?.['p(95)'] || 0;
            p99Duration = summary.http_req_duration.values?.['p(99)'] || 0;
        }
    }
    
    const successRate = totalRequests > 0 
        ? ((totalRequests - failedRequests) / totalRequests * 100).toFixed(2)
        : 0;
    
    return `
<!DOCTYPE html>
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
        .container { max-width: 1200px; margin: 0 auto; }
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
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            color: #333;
        }
        .metric-unit {
            font-size: 1rem;
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
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #f0f0f0;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #666;
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 k6 Performance Test Report</h1>
            <p>${testName}</p>
            <p style="font-size: 0.9rem; margin-top: 10px;">Generated: ${new Date().toISOString()}</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <h3>Total Requests</h3>
                <div class="metric-value">${totalRequests.toLocaleString()}</div>
            </div>
            
            <div class="metric-card">
                <h3>Success Rate</h3>
                <div class="metric-value ${successRate >= 95 ? 'success' : successRate >= 80 ? 'warning' : 'danger'}">
                    ${successRate}<span class="metric-unit">%</span>
                </div>
            </div>
            
            <div class="metric-card">
                <h3>Failed Requests</h3>
                <div class="metric-value ${failedRequests === 0 ? 'success' : 'danger'}">
                    ${failedRequests.toLocaleString()}
                </div>
            </div>
            
            <div class="metric-card">
                <h3>Avg Response Time</h3>
                <div class="metric-value">${avgDuration.toFixed(2)}<span class="metric-unit">ms</span></div>
            </div>
            
            <div class="metric-card">
                <h3>P95 Response Time</h3>
                <div class="metric-value">${p95Duration.toFixed(2)}<span class="metric-unit">ms</span></div>
            </div>
            
            <div class="metric-card">
                <h3>P99 Response Time</h3>
                <div class="metric-value">${p99Duration.toFixed(2)}<span class="metric-unit">ms</span></div>
            </div>
        </div>
        
        ${summary ? `
        <div class="details-section">
            <h2>📊 Detailed Metrics</h2>
            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Min</th>
                        <th>Avg</th>
                        <th>Max</th>
                        <th>P(90)</th>
                        <th>P(95)</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(summary).map(([metric, data]) => {
                        if (!data.values) return '';
                        const v = data.values;
                        return `
                        <tr>
                            <td><strong>${metric}</strong></td>
                            <td>${formatValue(v.min)}</td>
                            <td>${formatValue(v.avg)}</td>
                            <td>${formatValue(v.max)}</td>
                            <td>${formatValue(v['p(90)'])}</td>
                            <td>${formatValue(v['p(95)'])}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        ` : '<div class="details-section"><p>No detailed metrics available</p></div>'}
        
        <div class="footer">
            <p>Generated by k6 JSON to HTML converter</p>
            <p>Test file: ${filename}</p>
        </div>
    </div>
</body>
</html>
`;
}

function generateFallbackReport(inputFile, error) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>k6 Test Report - Error</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 40px;
            background: #f5f7fa;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { color: #dc3545; }
        .error { background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; }
        code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚠️ Report Generation Error</h1>
        <p>Unable to generate the k6 test report from the JSON file.</p>
        <div class="error">
            <strong>Error:</strong> ${error.message}
        </div>
        <p><strong>Input file:</strong> <code>${inputFile}</code></p>
        <p>The test may have generated results that are too large or in an unexpected format.</p>
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
    return value;
}
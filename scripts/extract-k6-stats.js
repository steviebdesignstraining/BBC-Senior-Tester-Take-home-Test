const fs = require('fs');
const path = require('path');

/**
 * Extract key statistics from k6 JSON results
 */
function extractK6Stats(inputFile, testName) {
    if (!fs.existsSync(inputFile)) {
        console.warn(`⚠️  k6 results file not found: ${inputFile}`);
        return null;
    }

    try {
        const fileContent = fs.readFileSync(inputFile, 'utf8');
        const lines = fileContent.trim().split('\n');
        
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
            }
        });

        // Calculate key statistics
        let totalRequests = 0;
        let failedRequests = 0;
        let avgDuration = 0;
        let p95Duration = 0;
        let p99Duration = 0;
        let maxVUs = 0;
        let totalIterations = 0;

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
            if (summary.vus) {
                maxVUs = summary.vus.values?.max || 0;
            }
            if (summary.iterations) {
                totalIterations = summary.iterations.values?.count || 0;
            }
        }

        const successRate = totalRequests > 0 
            ? ((totalRequests - failedRequests) / totalRequests * 100).toFixed(2)
            : 0;

        const stats = {
            test: testName,
            timestamp: new Date().toISOString(),
            metrics: {
                totalRequests,
                failedRequests,
                successRate: parseFloat(successRate),
                avgDuration: parseFloat(avgDuration.toFixed(2)),
                p95Duration: parseFloat(p95Duration.toFixed(2)),
                p99Duration: parseFloat(p99Duration.toFixed(2)),
                maxVUs: Math.round(maxVUs),
                totalIterations
            },
            summary: summary || {},
            rawFile: inputFile
        };

        console.log(`✅ Extracted k6 stats for ${testName}:`);
        console.log(`   Total Requests: ${totalRequests}`);
        console.log(`   Success Rate: ${successRate}%`);
        console.log(`   Avg Duration: ${avgDuration.toFixed(2)}ms`);
        console.log(`   P95 Duration: ${p95Duration.toFixed(2)}ms`);
        console.log(`   Max VUs: ${maxVUs}`);

        return stats;
    } catch (error) {
        console.error(`❌ Error extracting k6 stats from ${inputFile}:`, error.message);
        return null;
    }
}

/**
 * Generate combined k6 summary
 */
function generateK6Summary() {
    const k6ResultsDir = path.join(__dirname, '..', 'k6-results');
    const siteDir = path.join(__dirname, '..', 'site');
    const k6SummaryDir = path.join(siteDir, 'k6-summary');
    
    if (!fs.existsSync(k6ResultsDir)) {
        console.warn('⚠️  k6-results directory not found');
        return null;
    }
    
    if (!fs.existsSync(k6SummaryDir)) {
        fs.mkdirSync(k6SummaryDir, { recursive: true });
    }

    const testTypes = ['load', 'performance', 'stress', 'security'];
    const summary = {
        timestamp: new Date().toISOString(),
        tests: {},
        overall: {
            totalRequests: 0,
            totalFailed: 0,
            totalIterations: 0,
            avgSuccessRate: 0
        }
    };

    let totalSuccessRate = 0;
    let testCount = 0;

    testTypes.forEach(testType => {
        const inputFile = path.join(k6ResultsDir, `${testType}.json`);
        const stats = extractK6Stats(inputFile, testType);
        
        if (stats) {
            summary.tests[testType] = stats;
            summary.overall.totalRequests += stats.metrics.totalRequests;
            summary.overall.totalFailed += stats.metrics.failedRequests;
            summary.overall.totalIterations += stats.metrics.totalIterations;
            
            if (stats.metrics.totalRequests > 0) {
                totalSuccessRate += stats.metrics.successRate;
                testCount++;
            }
        }
    });

    // Calculate overall success rate
    if (testCount > 0) {
        summary.overall.avgSuccessRate = (totalSuccessRate / testCount).toFixed(2);
    }

    // Save individual test stats
    Object.keys(summary.tests).forEach(testType => {
        const outputFile = path.join(k6SummaryDir, `${testType}-stats.json`);
        fs.writeFileSync(outputFile, JSON.stringify(summary.tests[testType], null, 2));
    });

    // Save combined summary
    const summaryFile = path.join(k6SummaryDir, 'k6-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

    console.log(`✅ Generated k6 summary: ${summaryFile}`);
    console.log(`   Overall Success Rate: ${summary.overall.avgSuccessRate}%`);
    console.log(`   Total Requests: ${summary.overall.totalRequests}`);
    console.log(`   Total Failed: ${summary.overall.totalFailed}`);

    return summary;
}

/**
 * Main function
 */
function main() {
    console.log('📊 Extracting k6 statistics...');
    const summary = generateK6Summary();
    
    if (summary) {
        console.log('✅ k6 statistics extracted successfully');
        return summary;
    } else {
        console.warn('⚠️  No k6 statistics found');
        return null;
    }
}

// Export for use in other scripts
module.exports = { extractK6Stats, generateK6Summary };

// Run if called directly
if (require.main === module) {
    main();
}
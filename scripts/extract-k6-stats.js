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
    // Check if we're running from test-output directory (integration test)
    const cwd = process.cwd();
    const isTestOutput = cwd.includes('test-output');

    let k6ResultsDir, k6SummaryDir, siteDir, k6SummaryOutputDir;

    if (isTestOutput) {
        // Adjust paths for integration test environment
        const testOutputDir = cwd;
        k6ResultsDir = path.join(testOutputDir, 'k6-results');
        k6SummaryDir = path.join(testOutputDir, 'k6', 'results');
        siteDir = path.join(testOutputDir, 'site');
        k6SummaryOutputDir = path.join(siteDir, 'k6-summary');
    } else {
        // Normal paths from project root
        k6ResultsDir = path.join(__dirname, '..', 'k6-results');
        k6SummaryDir = path.join(__dirname, '..', 'k6', 'results');
        siteDir = path.join(__dirname, '..', 'site');
        k6SummaryOutputDir = path.join(siteDir, 'k6-summary');
    }
    
    if (!fs.existsSync(k6SummaryOutputDir)) {
        fs.mkdirSync(k6SummaryOutputDir, { recursive: true });
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
        // First try to extract from k6/results summary files (these have real data)
        let stats = null;
        const summaryFile = path.join(k6SummaryDir, `${testType}-summary.json`);
        
        if (fs.existsSync(summaryFile)) {
            try {
                const summaryData = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
                stats = convertSummaryToStats(summaryData, testType);
                console.log(`✅ Converted summary data for ${testType}`);
            } catch (error) {
                console.warn(`⚠️  Could not convert summary for ${testType}:`, error.message);
            }
        }
        
        // If no stats from summary files, try to extract from k6-results directory
        if (!stats) {
            const inputFile = path.join(k6ResultsDir, `${testType}.json`);
            if (fs.existsSync(inputFile)) {
                stats = extractK6Stats(inputFile, testType);
            }
        }
        
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
 * Convert k6 summary data to stats format
 */
function convertSummaryToStats(summaryData, testName) {
    try {
        const metrics = summaryData.metrics || {};
        
        // Extract key metrics from summary - the structure is different from what we expected
        const httpReqDuration = metrics.http_req_duration || {};
        const httpReqFailed = metrics.http_req_failed || {};
        const httpReqRate = metrics.http_reqs || {}; // Note: this is http_reqs, not http_req_rate
        const vus = metrics.vus_max || {}; // Note: this is vus_max, not vus
        const iterations = metrics.iterations || {};

        // Extract values directly from the metrics objects
        const totalRequests = httpReqRate.count || 0;
        const failedRequests = httpReqFailed.fails || 0;
        const successRate = totalRequests > 0 ? ((totalRequests - failedRequests) / totalRequests * 100) : 0;

        const stats = {
            test: testName,
            timestamp: new Date().toISOString(),
            metrics: {
                totalRequests,
                failedRequests,
                successRate: parseFloat(successRate.toFixed(2)),
                avgDuration: parseFloat((httpReqDuration.avg || 0).toFixed(2)),
                p95Duration: parseFloat((httpReqDuration['p(95)'] || 0).toFixed(2)), // Note: p(95) not p95
                p99Duration: parseFloat((httpReqDuration['p(99)'] || 0).toFixed(2)), // Note: p(99) not p99
                maxVUs: Math.round(vus.value || 0), // Note: value not max
                totalIterations: iterations.count || 0
            },
            summary: summaryData,
            rawFile: `k6/results/${testName}-summary.json`
        };

        console.log(`✅ Converted summary for ${testName}:`);
        console.log(`   Total Requests: ${totalRequests}`);
        console.log(`   Success Rate: ${successRate.toFixed(2)}%`);
        console.log(`   Avg Duration: ${httpReqDuration.avg || 0}ms`);

        return stats;
    } catch (error) {
        console.error(`❌ Error converting summary for ${testName}:`, error.message);
        return null;
    }
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
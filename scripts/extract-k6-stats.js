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

        let summary = null;

        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);
                if (parsed.type === 'Point' && parsed.metric === 'http_req_duration') {
                    summary = parsed.data;
                }
            } catch {
                // Ignore non-JSON lines
            }
        }

        if (summary) {
            return {
                test: testName,
                avg: summary.avg,
                p95: summary['p(95)'],
                max: summary.max,
                min: summary.min,
            };
        }

        return null;
    } catch (error) {
        console.error(`❌ Error reading k6 stats from ${inputFile}:`, error);
        return null;
    }
}

/**
 * Generate a consolidated k6 summary
 */
function generateK6Summary(resultsDir, outputFile) {
    const testTypes = ['load', 'performance', 'stress', 'security'];
    const summary = [];

    for (const testType of testTypes) {
        const inputFile = path.join(resultsDir, `${testType}.json`);
        const stats = extractK6Stats(inputFile, testType);
        if (stats) {
            summary.push(stats);
        }
    }

    fs.writeFileSync(outputFile, JSON.stringify(summary, null, 2));
    console.log('✅ k6 statistics extracted successfully');
}

/**
 * Main execution
 */
function main() {
    let k6ResultsDir, k6SummaryDir, siteDir, k6SummaryOutputDir;

    const testOutputDir = process.env.GITHUB_WORKSPACE || process.cwd();

    if (fs.existsSync(path.join(testOutputDir, 'k6-results'))) {
        k6ResultsDir = path.join(testOutputDir, 'k6-results');
    } else {
        k6ResultsDir = path.join(__dirname, '..', 'k6-results');
    }

    siteDir = path.join(testOutputDir, 'site');
    k6SummaryDir = path.join(siteDir, 'reports');
    k6SummaryOutputDir = path.join(k6SummaryDir, 'k6-summary.json');

    // ✅ FIX: reuse existing variable, do NOT redeclare
    k6ResultsDir = path.join(siteDir, 'k6-results');

    if (!fs.existsSync(k6ResultsDir)) {
        fs.mkdirSync(k6ResultsDir, { recursive: true });
    }

    if (!fs.existsSync(k6SummaryDir)) {
        fs.mkdirSync(k6SummaryDir, { recursive: true });
    }

    generateK6Summary(k6ResultsDir, k6SummaryOutputDir);
}

// Export for reuse
module.exports = {
    extractK6Stats,
    generateK6Summary,
};

// Run if called directly
if (require.main === module) {
    main();
}

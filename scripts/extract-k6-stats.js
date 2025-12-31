const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function parseK6Metrics(filePath) {
    const metrics = {};

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (!line.trim()) continue;

        let entry;
        try {
            entry = JSON.parse(line);
        } catch {
            continue;
        }

        if (!entry.metric || !entry.data) continue;

        const name = entry.metric;

        // Counter metrics
        if (entry.type === 'Metric' && entry.data.type === 'counter') {
            metrics[name] = { type: 'counter' };
        }

        // Rate metrics
        if (entry.type === 'Metric' && entry.data.type === 'rate') {
            metrics[name] = { type: 'rate' };
        }

        // Trend metrics
        if (entry.type === 'Metric' && entry.data.type === 'trend') {
            metrics[name] = { type: 'trend' };
        }

        // Metric values
        if (entry.type === 'Point' && metrics[name]) {
            metrics[name].values = entry.data;
        }
    }

    return metrics;
}

async function extractK6Stats(inputFile, testName) {
    if (!fs.existsSync(inputFile)) {
        console.error(`❌ Missing k6 results: ${inputFile}`);
        process.exit(1);
    }

    const metrics = await parseK6Metrics(inputFile);

    const reqs = metrics.http_reqs?.values || {};
    const failed = metrics.http_req_failed?.values || {};
    const duration = metrics.http_req_duration?.values || {};

    const totalRequests = Math.round(reqs.count || 0);
    const failRate = failed.rate || 0;
    const failedRequests = Math.round(totalRequests * failRate);
    const successRate = totalRequests > 0
        ? ((1 - failRate) * 100).toFixed(2)
        : '0.00';

    return {
        test: testName,
        totalRequests,
        successRate: `${successRate}%`,
        failedRequests,
        requestsPerSec: Math.round(reqs.rate || 0),
        avg: Math.round(duration.avg || 0),
        p95: Math.round(duration['p(95)'] || 0),
        p99: Math.round(duration['p(99)'] || 0),
        min: Math.round(duration.min || 0),
        max: Math.round(duration.max || 0),
    };
}

async function generateK6Summary(resultsDir, outputFile) {
    const tests = ['load', 'performance', 'stress', 'security'];
    const summary = [];

    for (const test of tests) {
        const file = path.join(resultsDir, `${test}.json`);
        try {
            const stats = await extractK6Stats(file, test);
            if (stats) summary.push(stats);
        } catch (error) {
            console.error(`❌ Error processing ${test} results:`, error.message);
        }
    }

    fs.writeFileSync(outputFile, JSON.stringify(summary, null, 2));
    console.log('✅ Accurate k6 summary generated');
}

async function main() {
    const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
    const siteDir = path.join(workspace, 'site');
    const k6ResultsDir = path.join(siteDir, 'k6-results');
    const outputDir = path.join(siteDir, 'reports');

    fs.mkdirSync(outputDir, { recursive: true });

    await generateK6Summary(
        k6ResultsDir,
        path.join(outputDir, 'k6-summary.json')
    );
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { extractK6Stats, generateK6Summary };
// Shared components for k6 reports

// Common chart configuration
const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom'
        }
    }
};

// ✅ CORRECTED: Load from k6-summary.json only (single source of truth)
// ❌ DELETED: processK6Data function that recalculated metrics from raw k6 data
// This was causing contradictions - dashboard showed different numbers than CI

// ✅ NEW: Load summary data directly
async function loadK6Summary() {
    try {
        const response = await fetch('/site/reports/k6-summary.json');
        if (!response.ok) {
            throw new Error('Failed to load k6 summary data');
        }
        const summary = await response.json();

        // Find current test data (based on page URL or parameter)
        const currentTest = getCurrentTestType();
        const testData = summary.find(test => test.test === currentTest);

        if (!testData) {
            throw new Error(`No data found for test: ${currentTest}`);
        }

        return testData;
    } catch (error) {
        console.error('Error loading k6 summary:', error);
        // ❌ DELETED: Fallback to zero - now throws error to prevent lying
        throw error;
    }
}

// Helper to determine current test type from URL
function getCurrentTestType() {
    const path = window.location.pathname;
    if (path.includes('/load/')) return 'load';
    if (path.includes('/performance/')) return 'performance';
    if (path.includes('/stress/')) return 'stress';
    if (path.includes('/security/')) return 'security';
    return 'load'; // default
}

// Common chart creation functions
function createResponseTimeChart(ctx, metrics) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Min', 'Avg', 'P95', 'P99', 'Max'],
            datasets: [{
                label: 'Response Time (ms)',
                data: [
                    metrics.min,  // ✅ CORRECTED: Use k6-summary.json property names
                    metrics.avg,
                    metrics.p95,
                    metrics.p99,
                    metrics.max
                ],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(168, 85, 247, 0.8)'
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(168, 85, 247, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            ...commonChartOptions,
            plugins: {
                ...commonChartOptions.plugins,
                accessibility: {  // ✅ ADDED: A11y support for screen readers
                    enabled: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Response Time (ms)'
                    }
                }
            }
        }
    });
}

function createThresholdsChart(ctx, metrics) {
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Response Time (P95)', 'Error Rate', 'Request Rate'],
            datasets: [{
                data: [
                    metrics.p95ResponseTime,
                    metrics.errorRate,
                    metrics.requestRate
                ],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(59, 130, 246, 0.8)'
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(59, 130, 246, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: commonChartOptions
    });
}

// Common DOM update functions
function updateMetricCards(metrics) {
    document.getElementById('avg-response-time').textContent = `${metrics.avgResponseTime}ms`;
    document.getElementById('p95-response-time').textContent = `${metrics.p95ResponseTime}ms`;
    document.getElementById('error-rate').textContent = `${metrics.errorRate}%`;
    document.getElementById('request-rate').textContent = `${metrics.requestRate} req/s`;
}

function updateThresholdValues(metrics) {
    document.getElementById('min-response').textContent = `${metrics.minResponseTime}ms`;
    document.getElementById('avg-response').textContent = `${metrics.avgResponseTime}ms`;
    document.getElementById('p95-response').textContent = `${metrics.p95ResponseTime}ms`;
    document.getElementById('p99-response').textContent = `${metrics.p99ResponseTime}ms`;
    document.getElementById('max-response').textContent = `${metrics.maxResponseTime}ms`;
    
    document.getElementById('error-rate-value').textContent = `${metrics.errorRate}%`;
    document.getElementById('total-requests').textContent = metrics.totalRequests.toLocaleString();
    document.getElementById('successful-requests').textContent = (metrics.totalRequests - metrics.failedRequests).toLocaleString();
    document.getElementById('failed-requests').textContent = metrics.failedRequests.toLocaleString();
}
// ❌ DEPRECATED: This function expects raw k6 data structure, incompatible with k6-summary.json
// ❌ DEPRECATED: This function expects raw k6 data structure, incompatible with k6-summary.json

function updateLoadMetrics(data, metrics) {


    const vus = data.metrics.vus || {};
    const iterations = data.metrics.iterations || {};
    document.getElementById('virtual-users').textContent = `${vus.value || 'N/A'} / ${vus.max || 'N/A'}`;
    document.getElementById('iterations').textContent = (iterations.count || 0).toLocaleString();
    document.getElementById('iteration-rate').textContent = `${Math.round((iterations.rate || 0) * 100) / 100} it/s`;
    document.getElementById('request-rate-value').textContent = `${metrics.requestRate} req/s`;
}

// Common data loading function
async function loadK6Data(jsonPath) {
    try {
        const response = await fetch(jsonPath);
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.error('Failed to load k6 data');
            return null;
        }
    } catch (error) {
        console.error('Error loading k6 data:', error);
        return null;
    }
}
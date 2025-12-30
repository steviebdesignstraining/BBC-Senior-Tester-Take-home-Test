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

// Common metric processing function
function processK6Data(data) {
    const metrics = data.metrics || {};
    
    // Extract response time metrics
    const durationMetric = metrics.http_req_duration || {};
    const avgResponseTime = Math.round(durationMetric.avg || 0);
    const p95ResponseTime = Math.round(durationMetric['p(95)'] || 0);
    const p99ResponseTime = Math.round(durationMetric['p(99)'] || 0);
    const minResponseTime = Math.round(durationMetric.min || 0);
    const maxResponseTime = Math.round(durationMetric.max || 0);
    
    // Extract request metrics
    const totalRequests = metrics.http_reqs ? metrics.http_reqs.count || 0 : 0;
    const failedRequests = metrics.http_req_failed ? metrics.http_req_failed.count || 0 : 0;
    const successRate = totalRequests > 0 ? Math.round(((totalRequests - failedRequests) / totalRequests) * 100) : 0;
    const errorRate = 100 - successRate;
    
    // Extract rate metrics
    const requestRate = metrics.http_reqs ? Math.round(metrics.http_reqs.rate || 0) : 0;
    
    return {
        avgResponseTime,
        p95ResponseTime,
        p99ResponseTime,
        minResponseTime,
        maxResponseTime,
        totalRequests,
        failedRequests,
        successRate,
        errorRate,
        requestRate
    };
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
                    metrics.minResponseTime,
                    metrics.avgResponseTime,
                    metrics.p95ResponseTime,
                    metrics.p99ResponseTime,
                    metrics.maxResponseTime
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
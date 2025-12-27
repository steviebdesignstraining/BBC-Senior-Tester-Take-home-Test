#!/bin/bash

# Test script to verify the complete workflow integration
echo "🧪 Testing BBC Senior Tester Take-home Test Integration"
echo "======================================================"

# Set up test environment
echo "📁 Setting up test environment..."
mkdir -p test-output/k6-results
mkdir -p test-output/site
mkdir -p test-output/reports

# Create mock k6 test results
echo "📊 Creating mock k6 test results..."
cat > test-output/k6-results/load.json << 'EOF'
{"type":"Point","metric":"http_reqs","data":{"time":"2025-12-27T09:50:00.000Z","value":1,"tags":{"name":"pet_crud_create"}}}
{"type":"Point","metric":"http_req_duration","data":{"time":"2025-12-27T09:50:00.000Z","value":150,"tags":{"name":"pet_crud_create"}}}
{"type":"Point","metric":"http_req_failed","data":{"time":"2025-12-27T09:50:00.000Z","value":0,"tags":{"name":"pet_crud_create"}}}
EOF

cat > test-output/k6-results/performance.json << 'EOF'
{"type":"Point","metric":"http_reqs","data":{"time":"2025-12-27T09:50:00.000Z","value":1,"tags":{"name":"user_crud_create"}}}
{"type":"Point","metric":"http_req_duration","data":{"time":"2025-12-27T09:50:00.000Z","value":120,"tags":{"name":"user_crud_create"}}}
{"type":"Point","metric":"http_req_failed","data":{"time":"2025-12-27T09:50:00.000Z","value":0,"tags":{"name":"user_crud_create"}}}
EOF

cat > test-output/k6-results/stress.json << 'EOF'
{"type":"Point","metric":"http_reqs","data":{"time":"2025-12-27T09:50:00.000Z","value":1,"tags":{"name":"order_crud_create"}}}
{"type":"Point","metric":"http_req_duration","data":{"time":"2025-12-27T09:50:00.000Z","value":180,"tags":{"name":"order_crud_create"}}}
{"type":"Point","metric":"http_req_failed","data":{"time":"2025-12-27T09:50:00.000Z","value":0,"tags":{"name":"order_crud_create"}}}
EOF

cat > test-output/k6-results/security.json << 'EOF'
{"type":"Point","metric":"http_reqs","data":{"time":"2025-12-27T09:50:00.000Z","value":1,"tags":{"name":"pet_crud_create"}}}
{"type":"Point","metric":"http_req_duration","data":{"time":"2025-12-27T09:50:00.000Z","value":200,"tags":{"name":"pet_crud_create"}}}
{"type":"Point","metric":"http_req_failed","data":{"time":"2025-12-27T09:50:00.000Z","value":0,"tags":{"name":"pet_crud_create"}}}
EOF

# Create mock Ortoni report
echo "📄 Creating mock Ortoni report..."
cat > test-output/reports/ortoni-report.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Mock Ortoni Report</title></head>
<body>
    <h1>Mock Ortoni Report</h1>
    <p>This is a mock Ortoni report for testing purposes.</p>
</body>
</html>
EOF

# Set environment variables for testing
echo "🔧 Setting up test environment variables..."
export GITHUB_ACTIONS=true
export GITHUB_REPOSITORY="test/repo"
export GITHUB_SHA="abc1234567890"
export GITHUB_REF="refs/heads/main"
export GITHUB_RUN_ID="12345"
export GITHUB_RUN_NUMBER="678"
export GITHUB_WORKFLOW="Test Workflow"
export GITHUB_EVENT_NAME="push"
export PLAYWRIGHT_STATUS="PASSED"
export K6_STATUS="PASSED"

# Test the scripts
echo ""
echo "🧪 Testing scripts..."

# Test GitHub data fetcher
echo "📡 Testing GitHub data fetcher..."
cd test-output
node ../scripts/fetch-github-data.js
if [ $? -eq 0 ]; then
    echo "✅ GitHub data fetcher test passed"
else
    echo "❌ GitHub data fetcher test failed"
fi

# Test k6 stats extractor
echo "📊 Testing k6 stats extractor..."
node ../scripts/extract-k6-stats.js
if [ $? -eq 0 ]; then
    echo "✅ k6 stats extractor test passed"
else
    echo "❌ k6 stats extractor test failed"
fi

# Test dashboard generator
echo "🎨 Testing dashboard generator..."
node ../scripts/update-index.js
if [ $? -eq 0 ]; then
    echo "✅ Dashboard generator test passed"
else
    echo "❌ Dashboard generator test failed"
fi

# Verify output files
echo ""
echo "📁 Verifying output files..."
if [ -f "index.html" ]; then
    echo "✅ index.html generated successfully"
    echo "   Size: $(wc -c < index.html) bytes"
else
    echo "❌ index.html not found"
fi

if [ -f "reports/github-data.json" ]; then
    echo "✅ github-data.json generated successfully"
else
    echo "❌ github-data.json not found"
fi

if [ -f "k6-summary/k6-summary.json" ]; then
    echo "✅ k6-summary.json generated successfully"
else
    echo "❌ k6-summary.json not found"
fi

# Test HTML report generation
echo ""
echo "📄 Testing HTML report generation..."
for test_type in load performance stress security; do
    echo "  Testing ${test_type} report..."
    node ../scripts/k6-json-to-html.js k6-results/${test_type}.json site/k6/${test_type}/index.html
    if [ $? -eq 0 ] && [ -f "site/k6/${test_type}/index.html" ]; then
        echo "    ✅ ${test_type} report generated"
    else
        echo "    ❌ ${test_type} report failed"
    fi
done

echo ""
echo "🏁 Integration test completed!"
echo "======================================================"
echo ""
echo "📋 Summary:"
echo "   - GitHub Actions data fetching: $(if [ -f "reports/github-data.json" ]; then echo "✅"; else echo "❌"; fi)"
echo "   - k6 statistics extraction: $(if [ -f "k6-summary/k6-summary.json" ]; then echo "✅"; else echo "❌"; fi)"
echo "   - Dashboard generation: $(if [ -f "index.html" ]; then echo "✅"; else echo "❌"; fi)"
echo "   - HTML report generation: $(if [ -f "site/k6/load/index.html" ]; then echo "✅"; else echo "❌"; fi)"
echo ""
echo "📁 Test output location: $(pwd)"
echo "🌐 To view the dashboard, open: file://$(pwd)/index.html"
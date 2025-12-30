#!/bin/bash

echo "🧪 Testing GitHub Actions Script Locally"
echo "========================================"
echo ""

# Set up mock GitHub Actions environment variables
export GITHUB_ACTIONS=true
export GITHUB_SHA=$(git rev-parse HEAD 2>/dev/null || echo "abc1234567890")
export GITHUB_REF="refs/heads/main"
export GITHUB_RUN_ID="123456"
export GITHUB_RUN_NUMBER="42"
export GITHUB_WORKFLOW="QA CI Pipeline"
export GITHUB_EVENT_NAME="push"
export PLAYWRIGHT_STATUS="PASSED"
export K6_STATUS="PASSED"
export BASE_URL="https://test.example.com"

echo "📋 Mock Environment Variables:"
echo "GITHUB_SHA: $GITHUB_SHA"
echo "GITHUB_REF: $GITHUB_REF"
echo "GITHUB_RUN_ID: $GITHUB_RUN_ID"
echo "GITHUB_RUN_NUMBER: $GITHUB_RUN_NUMBER"
echo ""

# Check if script exists
if [ ! -f "scripts/create-fallback-index.js" ]; then
    echo "❌ ERROR: scripts/create-fallback-index.js not found!"
    echo "Current directory: $(pwd)"
    echo "Contents:"
    ls -la scripts/ 2>/dev/null || echo "scripts/ directory doesn't exist"
    exit 1
fi

echo "✅ Script found: scripts/create-fallback-index.js"
echo ""

# Create mock directory structure
echo "📁 Creating mock site structure..."
mkdir -p site/reports
mkdir -p site/k6/load
mkdir -p site/k6/performance
mkdir -p site/k6/stress
mkdir -p site/k6/security

# Create mock report files
echo "<html><body>Mock Ortoni Report</body></html>" > site/reports/ortoni-report.html
echo "<html><body>Mock Load Test</body></html>" > site/k6/load/index.html
echo "<html><body>Mock Performance Test</body></html>" > site/k6/performance/index.html
echo "<html><body>Mock Stress Test</body></html>" > site/k6/stress/index.html
echo "<html><body>Mock Security Test</body></html>" > site/k6/security/index.html

echo "✅ Mock reports created"
echo ""

# Run the script
echo "🚀 Running create-fallback-index.js..."
echo "========================================"
node scripts/create-fallback-index.js

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Script executed successfully!"
    echo ""
    
    # Verify output
    if [ -f "site/index.html" ]; then
        echo "✅ site/index.html created"
        echo "📊 File size: $(wc -c < site/index.html) bytes"
        echo ""
        echo "📄 First 30 lines of generated index.html:"
        echo "----------------------------------------"
        head -30 site/index.html
        echo "----------------------------------------"
        echo ""
        
        if [ -f "site/reports/metadata.json" ]; then
            echo "✅ metadata.json created"
            echo ""
            echo "📋 Metadata contents:"
            echo "----------------------------------------"
            cat site/reports/metadata.json
            echo ""
            echo "----------------------------------------"
        else
            echo "⚠️  WARNING: metadata.json not created"
        fi
        
        echo ""
        echo "🎉 SUCCESS! Everything looks good."
        echo ""
        echo "📂 Site structure:"
        find site -type f
        
    else
        echo "❌ ERROR: site/index.html was not created!"
        exit 1
    fi
else
    echo ""
    echo "❌ ERROR: Script failed with exit code $?"
    exit 1
fi
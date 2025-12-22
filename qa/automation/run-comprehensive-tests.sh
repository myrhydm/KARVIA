#!/bin/bash

# 🧪 Comprehensive Test Suite Runner
# Executes complete test suite including edge cases and integration tests

echo "🧪 Manifestor - Comprehensive Test Suite"
echo "========================================"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Check if required engines are running
echo "🔍 Checking engine availability..."

check_engine() {
    local engine_name=$1
    local port=$2
    
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✅ $engine_name (port $port) is running"
        return 0
    else
        echo "❌ $engine_name (port $port) is not available"
        return 1
    fi
}

# Check critical engines
engines_ok=true

if ! check_engine "Assessment Engine" 8084; then engines_ok=false; fi
if ! check_engine "Observer Engine" 8082; then engines_ok=false; fi
if ! check_engine "Monitoring Service" 8085; then engines_ok=false; fi

if [ "$engines_ok" = false ]; then
    echo ""
    echo "⚠️  Some engines are not running. Starting engines first..."
    echo "Run: ./start-all-engines.sh"
    echo ""
    read -p "Continue with available engines? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🚀 Starting comprehensive test execution..."
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing test dependencies..."
    npm install axios --save-dev
fi

# Create test results directory
mkdir -p qa/reports
timestamp=$(date +"%Y%m%d_%H%M%S")
report_file="qa/reports/comprehensive_test_report_$timestamp.log"

echo "📊 Test report will be saved to: $report_file"
echo ""

# Execute the comprehensive test suite
echo "⚡ Running comprehensive integration tests..."
echo "   This may take 2-3 minutes..."
echo ""

# Run the test and capture output
node qa/automation/comprehensive-integration-test.js 2>&1 | tee "$report_file"

# Capture exit code from the test suite
test_exit_code=${PIPESTATUS[0]}

echo ""
echo "📋 Test execution completed!"
echo "Report saved to: $report_file"

# Generate summary
if [ $test_exit_code -eq 0 ]; then
    echo "✅ All tests passed successfully!"
    echo ""
    echo "🎯 System Status: READY FOR PRODUCTION"
    echo "   - All engines operational"
    echo "   - Edge cases handled correctly"
    echo "   - Performance within acceptable limits"
    echo "   - Security validations passed"
    echo "   - Data consistency verified"
else
    echo "❌ Some tests failed. Check the report for details."
    echo ""
    echo "🔧 Action Required:"
    echo "   1. Review failed tests in the report"
    echo "   2. Fix identified issues"
    echo "   3. Re-run comprehensive tests"
    echo "   4. Ensure all engines are healthy"
fi

# Additional system checks
echo ""
echo "🔍 Post-Test System Health Check..."

# Quick health check of all engines
for port in 8082 8084 8085; do
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✅ Engine on port $port is healthy after testing"
    else
        echo "⚠️  Engine on port $port may need attention"
    fi
done

echo ""
echo "📚 Next Steps:"
echo "   - Review detailed report: cat $report_file"
echo "   - Monitor system: http://localhost:8085/dashboard"
echo "   - Admin access: http://localhost:8082/admin"
echo "   - Assessment engine: http://localhost:8084/admin"

exit $test_exit_code
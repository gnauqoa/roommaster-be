#!/bin/bash

# Quick API Test Script for RoomMaster Backend
# Usage: ./test-api.sh

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${API_URL:-http://localhost:8080/v1}"
TOKEN=""

echo "🧪 RoomMaster API Quick Test"
echo "================================"
echo "Base URL: $BASE_URL"
echo ""

# Helper function to make requests
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth=$4
    
    echo -e "${YELLOW}➜ $method $endpoint${NC}"
    
    if [ -n "$auth" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $TOKEN" \
                -d "$data" \
                "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Authorization: Bearer $TOKEN" \
                "$BASE_URL$endpoint")
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                "$BASE_URL$endpoint")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ Success ($http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ Failed ($http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
    echo ""
}

# Test 1: Health Check
echo "📋 Test 1: Health Check"
echo -e "${YELLOW}➜ GET /health${NC}"
response=$(curl -s -w "\n%{http_code}" http://localhost:8080/health)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "${GREEN}✓ Success ($http_code)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Failed ($http_code)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
fi
echo ""

# Test 2: Employee Login
# Available test accounts (from seed data):
# - admin / password123 (ADMIN)
# - test-admin / password123 (ADMIN)
# - receptionist1 / password123 (RECEPTIONIST)
# - receptionist2 / password123 (RECEPTIONIST)
# - housekeeping1 / password123 (HOUSEKEEPING)
# - staff1 / password123 (STAFF)
#
# Usage: TEST_USER=receptionist1 TEST_PASS=password123 ./test-api.sh
echo "📋 Test 2: Employee Login"

# Use environment variables or defaults
TEST_USERNAME="${TEST_USER:-admin}"
TEST_PASSWORD="${TEST_PASS:-password123}"

LOGIN_DATA="{
  \"username\": \"$TEST_USERNAME\",
  \"password\": \"$TEST_PASSWORD\"
}"

echo "Logging in as: $TEST_USERNAME"
response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA" \
    "$BASE_URL/employee/auth/login")

TOKEN=$(echo "$response" | jq -r '.data.tokens.access.token' 2>/dev/null)

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo -e "${GREEN}✓ Login successful${NC}"
    echo "Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
fi
echo ""

# Test 3: Get Employees (Authenticated)
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo "📋 Test 3: Get Employees (Authenticated)"
    api_call "GET" "/employee/employees?limit=5" "" "auth"
    
    # Test 4: Get Room Types
    echo "📋 Test 4: Get Room Types"
    api_call "GET" "/employee/room-types?limit=5" "" "auth"
    
    # Test 5: Get Rooms
    echo "📋 Test 5: Get Rooms"
    api_call "GET" "/employee/rooms?limit=5" "" "auth"
    
    # Test 6: Get Bookings
    echo "📋 Test 6: Get Bookings"
    api_call "GET" "/employee/bookings?limit=5" "" "auth"
    
    # Test 7: Get App Settings
    echo "📋 Test 7: Get App Settings"
    api_call "GET" "/employee/app-settings/DEPOSIT_PERCENTAGE" "" "auth"
    
    # Test 8: Get Activities
    echo "📋 Test 8: Get Activities"
    api_call "GET" "/employee/activities?limit=5" "" "auth"
else
    echo -e "${YELLOW}⚠ Skipping authenticated tests (no token)${NC}"
fi

echo "================================"
echo "✅ API Tests Complete!"

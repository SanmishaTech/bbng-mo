#!/bin/bash

###############################################################################
# Build Android App using EAS Build API (Shell Script Version)
# 
# This script triggers an Android build using curl and the EAS Build API.
# 
# Usage:
#   ./scripts/build-android.sh [profile]
# 
# Examples:
#   EAS_TOKEN=your_token ./scripts/build-android.sh preview
#   EAS_TOKEN=your_token ./scripts/build-android.sh production
###############################################################################

set -e

# Configuration
PROJECT_ID="7cfd1d65-2d39-4e08-9d87-7f1231e7baa5"
BUILD_PROFILE="${1:-preview}"
EAS_API_URL="https://api.expo.dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏗️  EAS Android Build Script${NC}"
echo "$(printf '%.0s─' {1..50})"

# Check if EAS_TOKEN is set
if [ -z "$EAS_TOKEN" ]; then
    echo -e "${RED}❌ EAS_TOKEN environment variable is not set!${NC}"
    echo ""
    echo "Please set your EAS token:"
    echo "  export EAS_TOKEN=your_token_here"
    echo ""
    echo "Or create a token at:"
    echo "  https://expo.dev/accounts/sanmisha/settings/access-tokens"
    exit 1
fi

echo -e "${GREEN}✅ EAS token found${NC}"
echo -e "${BLUE}🚀 Triggering Android build with profile: ${BUILD_PROFILE}${NC}"

# Trigger build
RESPONSE=$(curl -s -X POST "${EAS_API_URL}/v2/builds" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${EAS_TOKEN}" \
  -H "Expo-Session: ${EAS_TOKEN}" \
  -d "{
    \"projectId\": \"${PROJECT_ID}\",
    \"platform\": \"android\",
    \"profile\": \"${BUILD_PROFILE}\"
  }")

# Check if request was successful
if echo "$RESPONSE" | grep -q '"id"'; then
    BUILD_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✅ Build triggered successfully!${NC}"
    echo -e "${BLUE}📦 Build ID: ${BUILD_ID}${NC}"
    echo -e "${BLUE}🔗 Build URL: https://expo.dev/accounts/sanmisha/projects/my-app/builds/${BUILD_ID}${NC}"
    echo ""
    echo -e "${YELLOW}💡 Monitor your build at the URL above${NC}"
    echo -e "${YELLOW}💡 Or check status with: curl -H \"Authorization: Bearer \$EAS_TOKEN\" ${EAS_API_URL}/v2/builds/${BUILD_ID}${NC}"
    echo ""
    echo -e "${GREEN}✨ Done!${NC}"
else
    echo -e "${RED}❌ Failed to trigger build${NC}"
    echo "Response: $RESPONSE"
    exit 1
fi

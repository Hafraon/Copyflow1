#!/bin/sh

# Cron job wrapper script for CopyFlow

# Load environment variables
if [ -f /app/.env ]; then
  export $(cat /app/.env | grep -v '^#' | xargs)
fi

# Set default API URL
API_URL=${API_URL:-"http://app:3000/api/cron"}

# Function to call API endpoint
call_endpoint() {
  local endpoint=$1
  echo "Calling $API_URL/$endpoint"
  
  curl -s -X GET \
    -H "Authorization: Bearer $CRON_SECRET" \
    "$API_URL/$endpoint"
  
  echo ""
}

# Execute based on argument
case "$1" in
  health-check)
    call_endpoint "health-check"
    ;;
  backup)
    call_endpoint "backup"
    ;;
  usage-reset)
    call_endpoint "usage-reset"
    ;;
  performance-report)
    call_endpoint "performance-report"
    ;;
  *)
    echo "Usage: $0 {health-check|backup|usage-reset|performance-report}"
    exit 1
    ;;
esac

exit 0
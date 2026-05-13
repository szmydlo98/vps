#!/bin/bash
# Usage: bash scripts/test-webhook.sh [CHANNEL_ID] [VIDEO_ID] [TITLE]

CHANNEL_ID=${1:-"UCxxxxxxxxxxxxxxxxxxxxxxxx"}
VIDEO_ID=${2:-"dQw4w9WgXcQ"}
TITLE=${3:-"Test Video Title"}
ENDPOINT=${WEBHOOK_URL:-"http://localhost:3000/webhook/youtube"}

echo "POST $ENDPOINT"
echo "Channel: $CHANNEL_ID | Video: $VIDEO_ID | Title: $TITLE"
echo ""

curl -s -o /dev/null -w "HTTP status: %{http_code}\n" \
  -X POST "$ENDPOINT" \
  -H "Content-Type: application/atom+xml" \
  -d "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<feed xmlns:yt=\"http://www.youtube.com/xml/schemas/2015\"
      xmlns:media=\"http://search.yahoo.com/mrss/\">
  <entry>
    <yt:videoId>${VIDEO_ID}</yt:videoId>
    <yt:channelId>${CHANNEL_ID}</yt:channelId>
    <title>${TITLE}</title>
    <published>$(date -u +%Y-%m-%dT%H:%M:%S+00:00)</published>
    <media:group>
      <media:description>Test description for local webhook testing.</media:description>
    </media:group>
  </entry>
</feed>"

echo ""
echo "Check server logs for pipeline output."

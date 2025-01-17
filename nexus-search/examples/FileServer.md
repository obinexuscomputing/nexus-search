# Basic search
curl "http://localhost:3000/search?query=your search term"

# Search with options
curl "http://localhost:3000/search?query=term&fuzzy=true&maxResults=20"

# Get index status
curl "http://localhost:3000/status"

# Reindex directory
curl -X POST -H "Content-Type: application/json" \
     -d '{"directory": "./your/documents/path"}' \
     http://localhost:3000/reindex
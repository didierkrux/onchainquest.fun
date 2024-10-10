#!/bin/bash

# Navigate to the project root directory
cd "$(dirname "$0")/.." || exit

# Compile the TypeScript file
echo "Compiling TypeScript..."
npx tsc src/scripts/runFetchPotionData.ts --outDir dist --skipLibCheck

# Run the compiled JavaScript file
echo "Fetching Potion data..."
node dist/scripts/runFetchPotionData.js

# Clean up the compiled files
echo "Cleaning up..."
rm -rf dist

echo "Done!"

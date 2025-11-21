#!/bin/bash

# Exit on error
set -e

# Default version
VERSION="local"

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --version) VERSION="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

echo "Packaging extension version: $VERSION"

# Ensure we are in the project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Build extension
echo "Building extension..."
pnpm build:extension

# Package extension
echo "Creating zip package..."
cd extension

ZIP_FILENAME="notebooklm_extractor-${VERSION}.zip"
OUTPUT_PATH="../${ZIP_FILENAME}"

# Remove existing zip if it exists
if [ -f "$OUTPUT_PATH" ]; then
    rm "$OUTPUT_PATH"
fi

# Zip the required files: manifest.json, popup.html, and dist/ directory
zip -r "$OUTPUT_PATH" manifest.json popup.html dist/

echo "------------------------------------------------"
echo "Extension packaged successfully!"
echo "Location: $(cd .. && pwd)/${ZIP_FILENAME}"
echo "------------------------------------------------"

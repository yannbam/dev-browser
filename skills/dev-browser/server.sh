#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the script directory
cd "$SCRIPT_DIR"

# Parse command line arguments
HEADLESS=false
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --headless) HEADLESS=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Detect package manager (prefer bun if it works, fall back to npm)
USE_BUN=false
if command -v bun &> /dev/null; then
    # Test if bun actually works (some CPUs don't support it)
    if bun --version &> /dev/null; then
        USE_BUN=true
    fi
fi

if [ "$USE_BUN" = true ]; then
    PKG_INSTALL="bun i"
    PKG_RUN="bun x tsx"
    echo "Using bun"
else
    PKG_INSTALL="npm install"
    PKG_RUN="npx tsx"
    echo "Using npm"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    $PKG_INSTALL
fi

echo "Starting dev-browser server..."
export HEADLESS=$HEADLESS
$PKG_RUN scripts/start-server.ts

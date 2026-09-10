#!/bin/sh

# This script is used to manage source map files in production builds.
#
# Why:
# In production, source map files (.map) are essential for debugging as they allow us to trace and deminify
# errors reported in production builds. By separating these files from the main extension build, we can
# reduce the overall size of the extension.
#
# What the script does:
# 1. Accepts an "ENGINE" parameter (either 'webkit' or 'gecko') to determine the build folder path.
# 2. Checks if the specified build folder exists and is not empty.
# 3. Moves all .map files from the build folder to a separate folder, specifically for source maps.
# 4. Leaves the build folder "clean" and ready for the final extension build without source maps.
#
# Usage:
# This script is typically run as a npm command:
# `yarn export:web:webkit:sourcemaps` or `yarn export:web:gecko:sourcemaps`
#
# Alternatively, you can run the script directly in the terminal:
#   sh ./scripts/export-source-maps.sh webkit
#   sh ./scripts/export-source-maps.sh gecko

# Check if ENGINE parameter is passed
ENGINE=$1

if [ -z "$ENGINE" ]; then
  echo "❌ Error: Please provide an engine type ('webkit' or 'gecko') as the first argument."
  exit 1
fi

# The folder that holds the build outputs, honouring the optional BUILD_DIR env
BUILD_DIR="$(node -p "require('./webpack/env').buildDir")"

# Set the build folder based on ENGINE
if [ "$ENGINE" = "webkit" ]; then
  BUILD_FOLDER="$BUILD_DIR/webkit-prod"
elif [ "$ENGINE" = "gecko" ]; then
  BUILD_FOLDER="$BUILD_DIR/gecko-prod"
else
  echo "❌ Error: Invalid engine type. Please use 'webkit' or 'gecko'."
  exit 1
fi

# Validate that the build folder exists and is not empty
if [ ! -d "$BUILD_FOLDER" ] || [ -z "$(ls -A "$BUILD_FOLDER")" ]; then
  echo "❌ Error: The build folder '$BUILD_FOLDER' is either missing or empty."
  exit 1
fi

# Check if there are any .map files in the build folder
MAP_FILES=$(find "$BUILD_FOLDER" -type f -name "*.map")
if [ -z "$MAP_FILES" ]; then
  echo "❌ Error: No source map files (.map) found in '$BUILD_FOLDER'."
  exit 1
fi

# Define the destination folder for source map files
MAP_FOLDER="$BUILD_DIR/${ENGINE}-prod-source-maps"

# Create or clean the MAP_FOLDER
if [ -d "$MAP_FOLDER" ]; then
  rm -rf "$MAP_FOLDER"/*
else
  mkdir -p "$MAP_FOLDER"
fi

# Move .map files to the MAP_FOLDER
find "$BUILD_FOLDER" -type f -name "*.map" -exec mv {} "$MAP_FOLDER" \;

# Success message
echo "✅ Success: All source map files (.map) have been moved to $MAP_FOLDER, leaving $BUILD_FOLDER clean and optimized for the extension build."

#!/bin/bash

echo "Starting Text Replacer..."
echo "กำลังเปิด Text Replacer..."

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    echo "กำลังติดตั้ง dependencies..."
    npm install
fi

# Start the application
echo "Starting application..."
echo "กำลังเปิดแอพพลิเคชั่น..."
npm start
#!/bin/bash

# Server startup script

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed. Please install Node.js to run the server."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null
then
    echo "Python 3 is not installed. Please install Python 3 to run the OCR processing."
    exit 1
fi

# Check if Tesseract is installed
if ! command -v tesseract &> /dev/null
then
    echo "Tesseract OCR is not installed. Please install Tesseract OCR to process receipts."
    exit 1
fi

# Install Node.js dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
    mkdir uploads
fi

# Start the server
echo "Starting the receipt scanner server..."
node server.js
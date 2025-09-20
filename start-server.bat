@echo off
title Receipt Scanner Server

echo Checking for required dependencies...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js to run the server.
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed. Please install Python to run the OCR processing.
    pause
    exit /b 1
)

REM Check if Tesseract is installed
tesseract --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Tesseract OCR is not installed. Please install Tesseract OCR to process receipts.
    pause
    exit /b 1
)

REM Install Node.js dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    npm install
)

REM Create uploads directory if it doesn't exist
if not exist "uploads" (
    mkdir uploads
)

REM Start the server
echo Starting the receipt scanner server...
node server.js

pause
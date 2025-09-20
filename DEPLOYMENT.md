# Server Deployment Guide

This guide explains how to deploy the Receipt Scanner server component to various platforms.

## Prerequisites

Before deploying, ensure you have:

1. Node.js 14+ installed
2. Python 3.6+ installed
3. Tesseract OCR installed and available in PATH
4. All required Python packages installed (opencv-python, pytesseract, Pillow, numpy)

## Deploying to Render

1. Fork this repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New Web Service"
4. Connect your GitHub repository
5. Set the following configuration:
   - Name: `receipt-scanner-server`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`
6. Add environment variables if needed
7. Click "Create Web Service"

## Deploying to Heroku

1. Install Heroku CLI
2. Login to Heroku: `heroku login`
3. Create a new app: `heroku create your-app-name`
4. Set buildpacks:
   ```
   heroku buildpacks:set heroku/nodejs
   ```
5. Deploy your code:
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

## Deploying to a VPS

1. Copy the server files to your VPS:
   ```
   scp server.js package.json user@your-server:/path/to/app
   ```
2. SSH into your server:
   ```
   ssh user@your-server
   ```
3. Install dependencies:
   ```
   cd /path/to/app
   npm install
   ```
4. Start the server:
   ```
   node server.js
   ```
5. (Optional) Use a process manager like PM2 to keep the server running:
   ```
   npm install -g pm2
   pm2 start server.js
   pm2 startup
   pm2 save
   ```

## Environment Variables

The server supports the following environment variables:

- `PORT` - Port to run the server on (default: 3001)
- `TESSERACT_PATH` - Path to Tesseract executable (if not in PATH)

## Notes

- Make sure the uploads directory is writable by the server process
- In production, consider using a proper file storage solution instead of the local filesystem
- Ensure proper security measures are in place for production deployments
# Bill Scanner App

A React Native app that scans receipts and extracts structured data using Python OCR processing.

## Features

- 📸 Take photos or select from gallery
- 🔍 OCR text extraction from receipts
- 📊 Structured data parsing (items, prices, totals)
- 💰 Multi-currency support
- 📱 Clean, intuitive mobile UI

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Python dependencies for OCR processing:
```bash
pip install opencv-python pytesseract requests
```

3. Install Tesseract OCR:
   - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
   - macOS: `brew install tesseract`
   - Linux: `sudo apt-get install tesseract-ocr`

4. Make sure Tesseract is in your PATH environment variable:
   - Windows: Add Tesseract installation directory to PATH
   - Test with: `tesseract --version`

5. Start the Expo development server:
```bash
npm start
```

6. Start the backend server:
```bash
npm run server
```

## Python Integration

The app includes a Python script (`receipt_scanner.py`) that:
- Preprocesses images for better OCR accuracy
- Extracts text using Tesseract OCR
- Parses receipt sections (header, items, totals)
- Outputs structured JSON data

### Current Implementation
- Uses mock data for demonstration
- Python bridge is prepared for future integration
- Can be connected via local server or cloud function

### Production Integration Options
1. **Local Server**: Run Python script on local server, call via HTTP
2. **Cloud Function**: Deploy Python processing to AWS Lambda/Google Cloud
3. **Native Bridge**: Use react-native-python or similar bridge

## File Structure

```
Bill_Scan/
├── components/
│   ├── ImagePicker.js      # Camera/gallery interface
│   └── ReceiptDisplay.js   # Results display
├── receipt_scanner.py      # Python OCR processing
├── python_bridge.js        # Python integration layer
└── App.js                  # Main app component
```

## Usage

1. Launch the app
2. Tap "Take Photo" or "Choose from Gallery"
3. Select/capture a receipt image
4. View extracted data in structured format
5. Tap "Scan Another Receipt" to process more images

## Platform-Specific Instructions

### Web
1. Start the backend server: `npm run server`
2. Start the app: `npm run web`
3. The app will connect to `http://localhost:3001/process-receipt`

### Android Emulator
1. Start the backend server: `npm run server`
2. Start the app: `npm run android`
3. The app will connect to `http://10.0.2.2:3001/process-receipt` (Android emulator's localhost)

### Android Physical Device
1. Find your development machine's IP address
2. Update [python_bridge.js](file:///d:/cursor-ex/Bill_Scan/python_bridge.js) to use your machine's IP instead of `10.0.2.2`
3. Start the backend server: `npm run server`
4. Start the app: `npm run android`
5. Make sure your device and development machine are on the same network

### iOS Simulator
1. Start the backend server: `npm run server`
2. Start the app: `npm run ios`
3. The app will connect to `http://localhost:3001/process-receipt`

### iOS Physical Device
1. Find your development machine's IP address
2. Update [python_bridge.js](file:///d:/cursor-ex/Bill_Scan/python_bridge.js) to use your machine's IP instead of `localhost`
3. Start the backend server: `npm run server`
4. Start the app: `npm run ios`
5. Make sure your device and development machine are on the same network

## Testing

A test receipt image is included (`test_receipt.jpg`) for testing purposes. You can also generate a new test receipt using:

```bash
python generate_test_receipt.py
```

## Supported Receipt Formats

- Standard retail receipts
- Restaurant bills
- Grocery store receipts
- Multi-currency support (€, $, £, ₹)

## Troubleshooting

If you encounter Tesseract errors:
1. Make sure Tesseract is installed correctly
2. Ensure Tesseract is added to your system PATH
3. Test Tesseract directly: `tesseract --version`
4. On Windows, you may need to restart your terminal/IDE after adding to PATH

If you encounter network errors:
1. Make sure the backend server is running (`npm run server`)
2. Check that you're using the correct server URL for your platform
3. Ensure your device/emulator can reach the development machine
4. Check firewall settings if using a physical device

## Future Enhancements

- Real-time Python script integration
- Receipt history storage
- Export to CSV/PDF
- Expense categorization
- Cloud backup

# Receipt Scanner

A React Native mobile application that scans receipts using OCR and processes them into structured data.

## Features

- Take photos of receipts or select from gallery
- Process receipts using OCR (Tesseract)
- Extract items, quantities, prices, and totals
- Accept or reject items
- Generate receipt images from accepted items

## Prerequisites

1. Node.js 14+
2. Expo CLI
3. Python 3.6+
4. Tesseract OCR installed and in PATH
5. Required Python packages: opencv-python, pytesseract, Pillow, numpy

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd Bill_Scan
   ```

2. Install mobile app dependencies:
   ```
   npm install
   ```

3. Install Python dependencies:
   ```
   pip install opencv-python pytesseract Pillow numpy
   ```

## Running the Mobile App

1. Start the development server:
   ```
   npm start
   ```

2. Scan the QR code with Expo Go app or run on emulator:
   - Press `a` for Android emulator
   - Press `i` for iOS simulator

## Server Setup

The mobile app communicates with a Node.js server for processing receipts.

### Running the Server Locally

1. Start the server:
   ```
   npm run server
   ```
   or
   ```
   node server.js
   ```

### Deploying the Server

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Environment Configuration

Copy [.env.example](file:///d:/cursor-ex/Bill_Scan/.env.example) to `.env` and configure as needed:
```
cp .env.example .env
```

For production deployments, set the `SERVER_URL` environment variable to your deployed server URL.

## Building for Production

### Android APK

1. Configure your server URL in [python_bridge.js](file:///d:/cursor-ex/Bill_Scan/python_bridge.js) or set the `SERVER_URL` environment variable
2. Build the APK:
   ```
   expo build:android
   ```

### iOS IPA

1. Configure your server URL in [python_bridge.js](file:///d:/cursor-ex/Bill_Scan/python_bridge.js) or set the `SERVER_URL` environment variable
2. Build the IPA:
   ```
   expo build:ios
   ```

## Troubleshooting

### Network Request Failed Error

This error typically occurs when the mobile app cannot connect to the server. Ensure:

1. The server is running
2. The server URL is correctly configured for your environment
3. Network connectivity between the mobile device and server
4. Firewall settings allow connections on the server port

For production builds, make sure to update the server URL in [python_bridge.js](file:///d:/cursor-ex/Bill_Scan/python_bridge.js) or use the `SERVER_URL` environment variable.

# Receipt Scanner Server

This is the backend server for the Receipt Scanner mobile application. It processes receipt images using OCR and generates structured data.

## Deployment to Render

To deploy this server to Render:

1. Fork this repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New Web Service"
4. Connect your GitHub repository
5. Set the following configuration:
   - Name: `receipt-scanner-server`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`
6. Click "Create Web Service"

Alternatively, you can use the included `render.yaml` file for automatic deployment.

## Local Development

To run the server locally:

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```
   or
   ```
   node server.js
   ```

The server will start on port 3001.

## Endpoints

- `POST /process-receipt` - Process a receipt image
- `POST /generate-receipt` - Generate a receipt image from structured data

## Requirements

- Node.js 14+
- Python 3.6+
- Tesseract OCR installed and in PATH

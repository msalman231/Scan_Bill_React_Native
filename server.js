const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();

// Configure multer with proper storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Custom JSON parsing middleware to avoid iconv-lite issues
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        req.body = JSON.parse(data);
        next();
      } catch (e) {
        res.status(400).json({ error: 'Invalid JSON' });
      }
    });
  } else {
    // For other content types, use express built-in middleware
    express.json({ limit: '10mb' })(req, res, next);
  }
});

// Middleware to handle URL encoded data
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// CORS middleware to allow requests from the React Native app
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.post('/process-receipt', upload.single('image'), (req, res) => {
  console.log('Received request to process receipt');
  console.log('File info:', req.file);
  
  if (!req.file) {
    console.log('No file uploaded');
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const imagePath = req.file.path;
  console.log('Processing image:', imagePath);
  
  // Spawn Python process with proper environment for Unicode
  const python = spawn('python', ['receipt_scanner.py', imagePath], {
    env: { 
      ...process.env, 
      PYTHONIOENCODING: 'utf-8',
      PYTHONLEGACYWINDOWSFSENCODING: '1'  // For Windows encoding issues
    }
  });

  let output = '';
  let error = '';

  // Set encoding to handle Unicode characters properly
  python.stdout.setEncoding('utf8');
  python.stderr.setEncoding('utf8');

  python.stdout.on('data', (data) => {
    output += data.toString();
    console.log('Python stdout:', data.toString());
  });

  python.stderr.on('data', (data) => {
    error += data.toString();
    console.log('Python stderr:', data.toString());
  });

  python.on('close', (code) => {
    console.log('Python process closed with code:', code);
    
    if (code !== 0) {
      console.error('Python script error:', error);
      // Clean up uploaded file even on error
      fs.unlinkSync(imagePath);
      return res.status(500).json({ error: 'Python script failed', details: error });
    }

    try {
      // Find the JSON output in the Python script's output
      const jsonStart = output.indexOf('{');
      const jsonEnd = output.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === -1) {
        console.error('No JSON found in Python output:', output);
        // Clean up uploaded file
        fs.unlinkSync(imagePath);
        return res.status(500).json({ error: 'No JSON found in Python output', details: output });
      }
      
      const jsonOutput = output.substring(jsonStart, jsonEnd);
      console.log('JSON output:', jsonOutput);
      const result = JSON.parse(jsonOutput);
      
      // Save the result to a randombill.json file in the uploads directory
      const randomBillFilename = `randombill-${Date.now()}.json`;
      const randomBillPath = path.join('uploads', randomBillFilename);
      fs.writeFileSync(randomBillPath, JSON.stringify(result, null, 2));
      console.log('Saved receipt data to:', randomBillPath);
      
      // Clean up uploaded file
      fs.unlinkSync(imagePath);
      
      res.json(result);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Output was:', output);
      // Clean up uploaded file
      fs.unlinkSync(imagePath);
      res.status(500).json({ error: 'Failed to parse result', details: parseError.message, output: output });
    }
  });
});

// New endpoint to generate receipt image from accepted items
app.post('/generate-receipt', (req, res) => {
  console.log('Received request to generate receipt');
  console.log('Receipt data:', req.body);
  
  const receiptData = req.body;
  
  if (!receiptData || !receiptData.items || !Array.isArray(receiptData.items)) {
    console.log('Invalid receipt data');
    return res.status(400).json({ error: 'Invalid receipt data' });
  }

  try {
    // Generate a unique filename for the receipt image
    const timestamp = Date.now();
    const receiptImageFilename = `receipt-${timestamp}.png`;
    const receiptImagePath = path.join('uploads', receiptImageFilename);
    
    // Spawn Python process to generate the receipt image
    const python = spawn('python', ['generate_receipt.py', JSON.stringify(receiptData), receiptImagePath], {
      env: { 
        ...process.env, 
        PYTHONIOENCODING: 'utf-8',
        PYTHONLEGACYWINDOWSFSENCODING: '1'  // For Windows encoding issues
      }
    });

    let output = '';
    let error = '';

    // Set encoding to handle Unicode characters properly
    python.stdout.setEncoding('utf8');
    python.stderr.setEncoding('utf8');

    python.stdout.on('data', (data) => {
      output += data.toString();
      console.log('Python stdout:', data.toString());
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
      console.log('Python stderr:', data.toString());
    });

    python.on('close', (code) => {
      console.log('Python receipt generation process closed with code:', code);
      
      if (code !== 0) {
        console.error('Python receipt generation error:', error);
        return res.status(500).json({ error: 'Python receipt generation failed', details: error });
      }

      try {
        // Parse the JSON output from the Python script
        const jsonStart = output.indexOf('{');
        const jsonEnd = output.lastIndexOf('}') + 1;
        
        if (jsonStart === -1 || jsonEnd === -1) {
          console.error('No JSON found in Python output:', output);
          return res.status(500).json({ error: 'No JSON found in Python output', details: output });
        }
        
        const jsonOutput = output.substring(jsonStart, jsonEnd);
        console.log('JSON output:', jsonOutput);
        const result = JSON.parse(jsonOutput);
        
        if (result.status === 'success') {
          res.json({
            message: 'Receipt generated successfully',
            filename: receiptImageFilename,
            path: receiptImagePath
          });
        } else {
          res.status(500).json({ error: 'Failed to generate receipt', details: result.message });
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Output was:', output);
        res.status(500).json({ error: 'Failed to parse result', details: parseError.message, output: output });
      }
    });
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({ error: 'Failed to generate receipt', details: error.message });
  }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
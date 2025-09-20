// Python Bridge for Receipt Processing
// This would integrate with the Python script in a production environment

import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Determine the server URL based on the platform and environment
const getServerUrl = () => {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Use environment variable if set, otherwise use default logic
  const SERVER_URL = process.env.SERVER_URL;
  if (SERVER_URL) {
    console.log('Using SERVER_URL from environment:', SERVER_URL);
    return SERVER_URL;
  }
  
  if (Platform.OS === 'android') {
    if (__DEV__) {
      // For Android emulator in development, use the machine's actual IP address
      // Replace this with your actual development machine's IP address
      console.log('Using Android emulator with actual IP address');
      return 'http://192.168.0.110:3001/process-receipt'; // Use your actual IP address
    } else {
      // For production APK, you need to use a publicly accessible server
      // IMPORTANT: Replace with your actual server URL when deployed
      // For local testing, you can use your computer's IP address on the same network
      // Example: 'http://192.168.1.100:3001/process-receipt'
      console.error('ERROR: Server URL not configured for production APK. Please set SERVER_URL environment variable or update python_bridge.js with your server URL.');
      return 'http://your-server-domain.com:3001/process-receipt';
    }
  } else if (Platform.OS === 'web') {
    // For web, use localhost in development, production URL when deployed
    if (__DEV__) {
      console.log('Using web localhost');
      return 'http://localhost:3001/process-receipt';
    } else {
      // Replace with your actual server URL when deployed
      console.error('ERROR: Server URL not configured for web production. Please set SERVER_URL environment variable or update python_bridge.js with your server URL.');
      return 'http://your-server-domain.com:3001/process-receipt';
    }
  } else {
    // For iOS
    if (__DEV__) {
      // For iOS simulator, use localhost
      console.log('Using iOS simulator localhost');
      return 'http://localhost:3001/process-receipt';
    } else {
      // For production iOS, you need to use a publicly accessible server
      // IMPORTANT: Replace with your actual server URL when deployed
      // For local testing, you can use your computer's IP address on the same network
      // Example: 'http://192.168.1.100:3001/process-receipt'
      console.error('ERROR: Server URL not configured for iOS production. Please set SERVER_URL environment variable or update python_bridge.js with your server URL.');
      return 'http://your-server-domain.com:3001/process-receipt';
    }
  }
};

// Function to get MIME type based on file extension
const getMimeType = (fileName) => {
  // Handle case where fileName might be undefined or have no extension
  if (!fileName) return 'image/jpeg';
  
  const parts = fileName.split('.');
  if (parts.length < 2) return 'image/jpeg'; // No extension found
  
  const extension = parts.pop().toLowerCase();
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'bmp':
      return 'image/bmp';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg'; // Default to jpeg
  }
};

// Function to get appropriate file name with extension
const getFileNameWithExtension = (uri) => {
  // Extract file name from URI
  const fileName = uri.split('/').pop();
  
  // Handle case where fileName might be undefined
  if (!fileName) return 'receipt.jpg';
  
  // If no extension, default to jpg
  if (!fileName.includes('.')) {
    return `receipt.jpg`;
  }
  return fileName;
};

export const processReceiptImage = async (imageUri) => {
  try {
    console.log('Processing image URI:', imageUri);
    console.log('Platform:', Platform.OS);
    console.log('Development mode:', __DEV__);
    
    // Check if we're in production and using the placeholder URL
    const serverUrl = getServerUrl();
    console.log('Server URL:', serverUrl);
    
    if (serverUrl.includes('your-server-domain.com')) {
      throw new Error('Server URL not configured for production. Please update python_bridge.js with your actual server URL.');
    }
    
    // Get file name and MIME type
    const fileName = getFileNameWithExtension(imageUri);
    const mimeType = getMimeType(fileName);
    
    console.log('File name:', fileName);
    console.log('MIME type:', mimeType);
    
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    console.log('File info:', fileInfo);
    
    if (!fileInfo.exists) {
      throw new Error('Image file does not exist');
    }
    
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: mimeType,
      name: fileName
    });

    console.log('Sending request to:', serverUrl);
    
    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(serverUrl, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let the browser set it automatically
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error response:', errorText);
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Response data:', result);
    return result;
  } catch (error) {
    console.error('Error processing receipt:', error);
    
    // More specific error handling
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: Server did not respond in time');
    } else if (error.message.includes('Network request failed')) {
      throw new Error('Network error: Could not connect to server. Please check if the server is running and accessible.');
    } else {
      throw new Error(`Failed to process receipt image: ${error.message}`);
    }
  }
};

// Function to generate receipt image from accepted items
export const generateReceiptImage = async (acceptedItems) => {
  try {
    console.log('Generating receipt image for items:', acceptedItems);
    
    // Check if we're in production and using the placeholder URL
    const serverUrl = getServerUrl().replace('/process-receipt', '/generate-receipt');
    console.log('Generate receipt URL:', serverUrl);
    
    if (serverUrl.includes('your-server-domain.com')) {
      throw new Error('Server URL not configured for production. Please update python_bridge.js with your actual server URL.');
    }
    
    // Prepare the data to send to the server
    const receiptData = {
      items: acceptedItems,
      total: {
        subtotal: acceptedItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0),
        total: acceptedItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0),
        currency: acceptedItems.length > 0 ? acceptedItems[0].currency : 'USD'
      },
      shop_name: 'Generated Receipt',
      shop_address: ['Date: ' + new Date().toLocaleDateString()],
      footer: ['Thank you for your purchase!']
    };

    console.log('Sending request to:', serverUrl);
    
    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(receiptData),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error response:', errorText);
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Receipt generation result:', result);
    return result;
  } catch (error) {
    console.error('Error generating receipt:', error);
    
    // More specific error handling
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: Server did not respond in time');
    } else if (error.message.includes('Network request failed')) {
      throw new Error('Network error: Could not connect to server. Please check if the server is running and accessible.');
    } else {
      throw new Error(`Failed to generate receipt: ${error.message}`);
    }
  }
};
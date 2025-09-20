import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { processReceiptImage } from '../python_bridge';

const ImagePickerComponent = ({ onImageSelected }) => {
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Media library permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera roll permissions are required');
        return;
      }

      // Use string value for mediaTypes instead of array
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 2],
        quality: 1,
      });

      console.log('Image picker result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Selected image URI:', result.assets[0].uri);
        processImage(result.assets[0].uri);
      } else {
        console.log('Image selection was canceled or no assets found');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Camera permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permissions are required');
        return;
      }

      // Use string value for mediaTypes instead of array
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 2],
        quality: 1,
      });

      console.log('Camera result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Captured image URI:', result.assets[0].uri);
        processImage(result.assets[0].uri);
      } else {
        console.log('Photo capture was canceled or no assets found');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo: ' + error.message);
    }
  };

  const processImage = async (imageUri) => {
    try {
      console.log('Processing image:', imageUri);
      // Process image directly using the URI - no need to copy to app directory
      const result = await processReceiptImage(imageUri);
      console.log('Processing result:', result);
      onImageSelected(result);
    } catch (error) {
      console.error('Image processing error:', error);
      Alert.alert('Error', error.message || 'Failed to process image: ' + error.toString());
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.takePhotoButton]}
          onPress={takePhoto}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.pickImageButton]}
          onPress={pickImage}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  buttonContainer: {
    marginVertical: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  button: {
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 250,
    // 3D effect with gradient-like appearance
    // Add border for more depth
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  takePhotoButton: {
    backgroundColor: '#4CAF50',
    // Additional 3D effect with bottom shadow
    shadowColor: '#388E3C',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
  },
  pickImageButton: {
    backgroundColor: '#2196F3',
    // Additional 3D effect with bottom shadow
    shadowColor: '#1976D2',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default ImagePickerComponent;
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ImagePicker from './components/ImagePicker';
import ReceiptCard from './components/ReceiptCard';
import AcceptedItems from './components/AcceptedItems';

export default function App() {
  const [receiptData, setReceiptData] = useState(null);
  const [acceptedItems, setAcceptedItems] = useState([]);
  const [view, setView] = useState('picker'); // 'picker', 'receipt', 'accepted'

  const handleImageSelected = (data) => {
    console.log('Received receipt data:', data);
    setReceiptData(data);
    setView('receipt');
  };

  const handleAccept = (item, index) => {
    console.log('Accepted item:', item);
    setAcceptedItems(prev => [...prev, item]);
    // Removed alert message - using slide animation instead
  };

  const handleReject = (item, index) => {
    console.log('Rejected item:', item);
    // Removed alert message - using slide animation instead
  };

  const handleReset = () => {
    setReceiptData(null);
    setAcceptedItems([]);
    setView('picker');
  };

  const handleViewAccepted = () => {
    setView('accepted');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bill Scanner</Text>
      {view === 'picker' && (
        <ImagePicker onImageSelected={handleImageSelected} />
      )}
      {view === 'receipt' && receiptData && (
        <View style={{ flex: 1 }}>
          <ReceiptCard 
            receiptData={receiptData} 
            onAccept={handleAccept}
            onReject={handleReject}
            onReset={handleReset}
          />
          {acceptedItems.length > 0 && (
            <View style={styles.acceptedButtonContainer}>
              <Text style={styles.acceptedCount}>
                Accepted Items: {acceptedItems.length}
              </Text>
              <Text 
                style={styles.viewAcceptedButton}
                onPress={handleViewAccepted}
              >
                View Accepted Items
              </Text>
            </View>
          )}
        </View>
      )}
      {view === 'accepted' && (
        <AcceptedItems 
          acceptedItems={acceptedItems} 
          onBack={() => setView('receipt')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40, // Moved down from the very top
    marginBottom: 20,
    color: '#333',
  },
  acceptedButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f0f0f0',
  },
  acceptedCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  viewAcceptedButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});
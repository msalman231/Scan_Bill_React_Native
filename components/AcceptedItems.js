import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { generateReceiptImage } from '../python_bridge';

// Currency symbol mapping
const currencySymbols = {
  'EUR': '€',
  'USD': '$',
  'GBP': '£',
  'INR': '₹'
};

const AcceptedItems = ({ acceptedItems, onBack }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Get total currency symbol (from first item)
  const totalCurrency = acceptedItems.length > 0 ? acceptedItems[0].currency : 'USD';
  const totalCurrencySymbol = currencySymbols[totalCurrency] || totalCurrency;

  const handleConfirm = async () => {
    if (acceptedItems.length === 0) {
      Alert.alert('No Items', 'There are no accepted items to generate a receipt for.');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateReceiptImage(acceptedItems);
      console.log('Receipt generated:', result);
      Alert.alert(
        'Success', 
        `Receipt generated successfully!\nFile: ${result.filename}`,
        [{ text: 'OK', onPress: onBack }]
      );
    } catch (error) {
      console.error('Error generating receipt:', error);
      Alert.alert('Error', `Failed to generate receipt: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Accepted Items</Text>
      
      <ScrollView style={styles.itemsContainer}>
        {acceptedItems.map((item, index) => {
          const currencySymbol = currencySymbols[item.currency] || item.currency;
          
          return (
            <View key={index} style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.itemName}>{item.item}</Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.quantity}>Quantity: {item.quantity}</Text>
                  <Text style={styles.cost}>{currencySymbol}{item.cost.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          );
        })}
        
        {/* Summary Section */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Items:</Text>
            <Text style={styles.summaryValue}>{acceptedItems.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Cost:</Text>
            <Text style={styles.summaryValue}>
              {totalCurrencySymbol}
              {acceptedItems.reduce((sum, item) => sum + item.cost, 0).toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.confirmButton, isGenerating && styles.disabledButton]} 
          onPress={handleConfirm}
          disabled={isGenerating}
        >
          <Text style={styles.confirmButtonText}>
            {isGenerating ? 'Generating...' : 'Confirm & Generate Receipt'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    color: '#333',
  },
  itemsContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardContent: {
    marginBottom: 10,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    color: '#666',
  },
  cost: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  backButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 2,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});

export default AcceptedItems;
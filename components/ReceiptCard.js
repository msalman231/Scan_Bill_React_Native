import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';

// Currency symbol mapping
const currencySymbols = {
  'EUR': '€',
  'USD': '$',
  'GBP': '£',
  'INR': '₹'
};

const ReceiptCard = ({ receiptData, onAccept, onReject, onReset }) => {
  if (!receiptData) return null;

  const { items } = receiptData;
  
  // State to track visible items
  const [visibleItems, setVisibleItems] = useState(items.map((_, index) => index));
  
  // Create animated values for each item
  const animatedValues = items.map(() => new Animated.Value(1));
  
  // Get total currency symbol (from first item or total)
  const totalCurrency = receiptData.total?.currency || items[0]?.currency || 'USD';
  const totalCurrencySymbol = currencySymbols[totalCurrency] || totalCurrency;
  
  // Handle item accept with slide animation
  const handleAccept = (item, index) => {
    // Find the actual index in the original items array
    const actualIndex = items.indexOf(item);
    
    // Animate the item sliding out to the right
    Animated.timing(animatedValues[actualIndex], {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Remove the item from visible items
      setVisibleItems(prev => prev.filter(i => i !== actualIndex));
      // Call the onAccept callback
      onAccept(item, actualIndex);
    });
  };
  
  // Handle item reject with slide animation
  const handleReject = (item, index) => {
    // Find the actual index in the original items array
    const actualIndex = items.indexOf(item);
    
    // Animate the item sliding out to the left
    Animated.timing(animatedValues[actualIndex], {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Remove the item from visible items
      setVisibleItems(prev => prev.filter(i => i !== actualIndex));
      // Call the onReject callback
      onReject(item, actualIndex);
    });
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Receipt Items</Text>
      {items.map((item, index) => {
        // Skip rendering if item is not visible
        if (!visibleItems.includes(index)) return null;
        
        // Get item currency symbol
        const currencySymbol = currencySymbols[item.currency] || item.currency;
        
        return (
          <Animated.View 
            key={index} 
            style={[
              styles.card,
              {
                transform: [{
                  translateX: animatedValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [index % 2 === 0 ? -400 : 400, 0], // Alternate slide direction
                  })
                }],
                opacity: animatedValues[index]
              }
            ]}
          >
            <View style={styles.cardContent}>
              <Text style={styles.itemName}>{item.item}</Text>
              <View style={styles.detailsRow}>
                <Text style={styles.quantity}>Quantity: {item.quantity}</Text>
                <Text style={styles.cost}>{currencySymbol}{item.cost.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.acceptButton]} 
                onPress={() => handleAccept(item, index)}
              >
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.rejectButton]} 
                onPress={() => handleReject(item, index)}
              >
                <Text style={styles.buttonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        );
      })}
      
      {/* Summary Section - this will naturally fill the space when items are removed */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Items:</Text>
          <Text style={styles.summaryValue}>{visibleItems.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Cost:</Text>
          <Text style={styles.summaryValue}>
            {totalCurrencySymbol}
            {visibleItems.reduce((sum, visibleIndex) => sum + items[visibleIndex].cost, 0).toFixed(2)}
          </Text>
        </View>
      </View>
      
      {/* Reset Button */}
      <TouchableOpacity style={styles.resetButton} onPress={onReset}>
        <Text style={styles.resetButtonText}>Scan Another Receipt</Text>
      </TouchableOpacity>
    </ScrollView>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  resetButton: {
    backgroundColor: '#FF6B6B',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReceiptCard;
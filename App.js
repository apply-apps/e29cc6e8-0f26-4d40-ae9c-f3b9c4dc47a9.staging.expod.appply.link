// App.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, Image } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://apihub.staging.appply.link/chatgpt';

const App = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [qrCodes, setQrCodes] = useState([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
    loadQrCodes();
  }, []);

  const loadQrCodes = async () => {
    try {
      const storedQrCodes = await AsyncStorage.getItem('qrCodes');
      if (storedQrCodes !== null) {
        setQrCodes(JSON.parse(storedQrCodes));
      }
    } catch (error) {
      console.error('Error loading QR codes:', error);
    }
  };

  const saveQrCodes = async (newQrCodes) => {
    try {
      await AsyncStorage.setItem('qrCodes', JSON.stringify(newQrCodes));
    } catch (error) {
      console.error('Error saving QR codes:', error);
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setScanning(false);

    try {
      const response = await axios.post(API_URL, {
        messages: [
          { role: "system", content: "You are a helpful assistant. Please provide a brief description for the scanned QR code data." },
          { role: "user", content: `Provide a brief description for this QR code data: ${data}` }
        ],
        model: "gpt-4o"
      });

      const description = response.data.response;

      const newQrCode = { 
        id: Date.now().toString(), 
        data, 
        description,
        image: `https://picsum.photos/200/200?random=${Date.now()}`
      };

      const newQrCodes = [...qrCodes, newQrCode];
      setQrCodes(newQrCodes);
      saveQrCodes(newQrCodes);
      Alert.alert('QR Code Scanned', `QR code with data ${data} has been added to your collection.`);
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert('Error', 'Failed to process QR code. Please try again.');
    }
  };

  const startScanning = () => {
    setScanning(true);
    setScanned(false);
  };

  const renderQrCode = ({ item }) => (
    <View style={styles.qrCodeItem}>
      <Image source={{ uri: item.image }} style={styles.qrCodeImage} />
      <View style={styles.qrCodeInfo}>
        <Text style={styles.qrCodeText}>{item.data}</Text>
        <Text style={styles.qrCodeDescription}>{item.description}</Text>
      </View>
    </View>
  );

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      {scanning ? (
        <View style={styles.scannerContainer}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity style={styles.cancelButton} onPress={() => setScanning(false)}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.title}>QR Code Collection</Text>
          <FlatList
            data={qrCodes}
            renderItem={renderQrCode}
            keyExtractor={(item) => item.id}
            style={styles.list}
          />
          <TouchableOpacity style={styles.scanButton} onPress={startScanning}>
            <Text style={styles.buttonText}>Scan QR Code</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  scannerContainer: {
    flex: 1,
    width: '100%',
  },
  list: {
    width: '100%',
    paddingHorizontal: 20,
  },
  qrCodeItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  qrCodeImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  qrCodeInfo: {
    flex: 1,
  },
  qrCodeText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  qrCodeDescription: {
    fontSize: 14,
    color: '#666',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 30,
  },
  cancelButton: {
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 10,
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default App;
// End of App.js
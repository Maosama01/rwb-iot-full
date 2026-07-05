import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

type PairingStep = 'SCANNING' | 'FOUND' | 'WIFI_SETUP' | 'PAIRING' | 'SUCCESS';

export function DevicePairingScreen() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState<PairingStep>('SCANNING');
  
  // Wi-Fi Form
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start pulsing if scanning
    if (step === 'SCANNING') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      ).start();

      // Simulate finding a device after 3.5 seconds
      const timer = setTimeout(() => {
        setStep('FOUND');
      }, 3500);
      return () => clearTimeout(timer);
    }

    if (step === 'FOUND' || step === 'WIFI_SETUP' || step === 'SUCCESS') {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }

    if (step === 'PAIRING') {
      // Simulate backend / device pairing process
      const timer = setTimeout(() => {
        setStep('SUCCESS');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleConnect = () => setStep('WIFI_SETUP');

  const handleSendCredentials = () => {
    if (!ssid || !password) return;
    setStep('PAIRING');
  };

  const handleFinish = () => {
    navigation.replace('MainApp');
  };

  const renderContent = () => {
    switch (step) {
      case 'SCANNING':
        return (
          <View style={styles.centerContainer}>
            <Animated.View style={[styles.radarCircle, { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.5], outputRange: [0.8, 0] }) }]} />
            <View style={styles.deviceIconBox}>
              <Ionicons name="bluetooth" size={40} color="#45C400" />
            </View>
            <Text style={styles.title}>Searching for Rawbin...</Text>
            <Text style={styles.subtitle}>Keep your phone near the composter.</Text>
          </View>
        );

      case 'FOUND':
        return (
          <Animated.View style={[styles.centerContainer, { opacity: fadeAnim }]}>
            <View style={styles.successIconBox}>
              <Ionicons name="checkmark" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Device Found!</Text>
            
            <View style={styles.deviceCard}>
              <View style={styles.deviceInfo}>
                <Ionicons name="hardware-chip" size={24} color="#45C400" style={{ marginRight: 12 }} />
                <View>
                  <Text style={styles.deviceName}>Rawbin-X82A</Text>
                  <Text style={styles.deviceStatus}>Ready to pair</Text>
                </View>
              </View>
              
              <TouchableOpacity activeOpacity={0.8} onPress={handleConnect}>
                <LinearGradient
                  colors={['#5ED600', '#45C400']}
                  style={styles.connectButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.connectButtonText}>Connect</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        );

      case 'WIFI_SETUP':
        return (
          <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
            <View style={styles.headerBox}>
              <Ionicons name="wifi" size={32} color="#45C400" />
              <Text style={styles.formTitle}>Connect Rawbin to Wi-Fi</Text>
              <Text style={styles.formSubtitle}>Your device needs internet to sync composting cycles and updates.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Wi-Fi Network (SSID)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="radio-outline" size={20} color="#8c9a87" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Home_Network_5G"
                  placeholderTextColor="#B0B0B0"
                  value={ssid}
                  onChangeText={setSsid}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#8c9a87" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter Wi-Fi password"
                  placeholderTextColor="#B0B0B0"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleSendCredentials}
              style={[styles.actionButtonContainer, { opacity: (ssid && password) ? 1 : 0.5 }]}
              disabled={!ssid || !password}
            >
              <LinearGradient colors={['#5ED600', '#45C400']} style={styles.actionButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.actionButtonText}>Send Credentials</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        );

      case 'PAIRING':
        return (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#45C400" />
            <Text style={[styles.title, { marginTop: 24 }]}>Provisioning Device...</Text>
            <Text style={styles.subtitle}>Connecting Rawbin to your Wi-Fi and linking your account.</Text>
          </View>
        );

      case 'SUCCESS':
        return (
          <Animated.View style={[styles.centerContainer, { opacity: fadeAnim }]}>
            <LinearGradient colors={['#5ED600', '#45C400']} style={styles.successCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="checkmark" size={60} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.title}>Successfully Paired!</Text>
            <Text style={styles.subtitle}>Your Rawbin is online and ready to start composting.</Text>
            
            <TouchableOpacity activeOpacity={0.8} onPress={handleFinish} style={styles.actionButtonContainer}>
              <LinearGradient colors={['#5ED600', '#45C400']} style={styles.actionButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.actionButtonText}>Go to Dashboard</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {step === 'WIFI_SETUP' ? (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
            {renderContent()}
          </KeyboardAvoidingView>
        ) : (
          renderContent()
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontFamily: 'Nunito_800Black',
    fontSize: 24,
    color: '#1A330B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: '#8c9a87',
    textAlign: 'center',
    lineHeight: 22,
  },
  radarCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(69, 196, 0, 0.2)',
  },
  deviceIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#45C400',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
    zIndex: 10,
  },
  successIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#45C400',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#45C400',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  deviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginTop: 40,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  deviceName: {
    fontFamily: 'Nunito_800Black',
    fontSize: 18,
    color: '#1A330B',
  },
  deviceStatus: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: '#5C8D42',
  },
  connectButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    fontFamily: 'Nunito_800Black',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 40,
  },
  formTitle: {
    fontFamily: 'Nunito_800Black',
    fontSize: 22,
    color: '#1A330B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: '#8c9a87',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    color: '#1A330B',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: '#1A330B',
    height: '100%',
  },
  actionButtonContainer: {
    marginTop: 32,
    shadowColor: '#45C400',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    width: '100%',
  },
  actionButton: {
    paddingVertical: 18,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontFamily: 'Nunito_800Black',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#45C400',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  }
});

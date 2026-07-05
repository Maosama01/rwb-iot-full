import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert, SafeAreaView, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../api/client';

export function SetupScreen() {
  const navigation = useNavigation<any>();
  
  const [placement, setPlacement] = useState<string | null>(null);
  const [dietType, setDietType] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!placement) {
      Alert.alert('Missing Info', 'Please tell us where you will place your Rawbin.');
      return;
    }
    if (!dietType) {
      Alert.alert('Missing Info', 'Please tell us your diet type.');
      return;
    }
    if (dietType === 'Non-Veg' && !frequency) {
      Alert.alert('Missing Info', 'Please select how often you consume non-veg.');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.patch('/users/me', {
        placement: placement,
        diet_type: dietType,
        non_veg_frequency: dietType === 'Non-Veg' ? frequency : null,
      });
      setIsLoading(false);
      // Navigate to pairing flow instead of directly to dashboard
      navigation.replace('DevicePairing');
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save preferences.');
    }
  };

  const PlacementButton = ({ label, icon, selected, onPress }: any) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.placementButton, selected && styles.placementButtonActive]}
    >
      <View style={[styles.placementIconBox, selected && styles.placementIconBoxActive]}>
        <Text style={{ fontSize: 28 }}>{icon}</Text>
      </View>
      <Text style={[styles.placementLabel, selected && styles.placementLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const DietButton = ({ label, icon, selected, onPress }: any) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.dietButton, selected && styles.dietButtonActive]}
    >
      <Text style={{ fontSize: 40, marginBottom: 12 }}>{icon}</Text>
      <Text style={[styles.dietLabel, selected && styles.dietLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const FrequencyToggle = ({ label, selected, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.frequencyToggle, selected && styles.frequencyToggleActive]}
    >
      <Text style={[styles.frequencyLabel, selected && styles.frequencyLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        
        {/* Header Navigation for when accessing from Settings */}
        <View style={styles.header}>
          {navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#2A312B" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.titleSection}>
            <LinearGradient
              colors={['#5ED600', '#45C400']}
              style={styles.iconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="hardware-chip" size={32} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.mainTitle}>App Setup</Text>
            <Text style={styles.mainSubtitle}>
              Let's tune your Rawbin for optimal performance based on your environment and lifestyle.
            </Text>
          </View>

          {/* Placement Section */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconBg}>
                <Ionicons name="home" size={16} color="#45C400" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Where will it live?</Text>
                <Text style={styles.sectionSubtitle}>Helps adjust the internal temperature.</Text>
              </View>
            </View>
            <View style={styles.placementRow}>
              <PlacementButton label="Kitchen" icon="🍳" selected={placement === 'Kitchen'} onPress={() => setPlacement('Kitchen')} />
              <PlacementButton label="Balcony" icon="☀️" selected={placement === 'Balcony'} onPress={() => setPlacement('Balcony')} />
              <PlacementButton label="Room" icon="🛏️" selected={placement === 'Near Room'} onPress={() => setPlacement('Near Room')} />
            </View>
          </View>

          {/* Diet Section */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconBg}>
                <Ionicons name="restaurant" size={16} color="#45C400" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>What is your diet type?</Text>
                <Text style={styles.sectionSubtitle}>Tunes motor spin speed and duration.</Text>
              </View>
            </View>
            <View style={styles.dietRow}>
              <DietButton label="Veg" icon="🥦" selected={dietType === 'Veg'} onPress={() => { setDietType('Veg'); setFrequency(null); }} />
              <DietButton label="Non-Veg" icon="🥩" selected={dietType === 'Non-Veg'} onPress={() => setDietType('Non-Veg')} />
            </View>
          </View>

          {/* Frequency Section (Conditional) */}
          {dietType === 'Non-Veg' && (
            <View style={styles.cardSection}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconBg}>
                  <Ionicons name="time" size={16} color="#45C400" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>How often do you eat non-veg?</Text>
                  <Text style={styles.sectionSubtitle}>Adjusts decomposition cycle intensity.</Text>
                </View>
              </View>
              <View style={styles.frequencyContainer}>
                {['Regularly', 'Occasionally', 'Rarely'].map(opt => (
                  <FrequencyToggle key={opt} label={opt} selected={frequency === opt} onPress={() => setFrequency(opt)} />
                ))}
              </View>
            </View>
          )}

          {/* Composting Guide Link */}
          <TouchableOpacity 
            style={styles.guideLink}
            onPress={() => navigation.navigate('CompostingGuide')}
          >
            <Ionicons name="book-outline" size={18} color="#45C400" style={{ marginRight: 6 }} />
            <Text style={styles.guideText}>Read the RAWBIN Composting Guide</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
            style={styles.submitContainer}
          >
            <LinearGradient
              colors={['#5ED600', '#45C400']}
              style={styles.submitButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitText}>Complete Setup</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#45C400',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  mainTitle: {
    fontFamily: 'Nunito_800Black',
    fontSize: 28,
    color: '#1A330B',
    marginBottom: 8,
  },
  mainSubtitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: '#8c9a87',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF3E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontFamily: 'Nunito_800Black',
    fontSize: 18,
    color: '#1A330B',
  },
  sectionSubtitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    color: '#8c9a87',
    marginTop: 2,
  },
  placementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  placementButton: {
    flex: 1,
    backgroundColor: '#FAF8F2',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 20,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  placementButtonActive: {
    backgroundColor: '#EAF3E2',
    borderColor: '#5C8D42',
  },
  placementIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  placementIconBoxActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#45C400',
    shadowOpacity: 0.2,
  },
  placementLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    color: '#8c9a87',
  },
  placementLabelActive: {
    color: '#1A330B',
  },
  dietRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dietButton: {
    width: '46%',
    aspectRatio: 1,
    backgroundColor: '#FAF8F2',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 999, // Perfect circle
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  dietButtonActive: {
    backgroundColor: '#EAF3E2',
    borderColor: '#5C8D42',
  },
  dietLabel: {
    fontFamily: 'Nunito_800Black',
    fontSize: 16,
    color: '#8c9a87',
  },
  dietLabelActive: {
    color: '#1A330B',
  },
  frequencyContainer: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F2',
    padding: 4,
    borderRadius: 999,
  },
  frequencyToggle: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  frequencyToggleActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  frequencyLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    color: '#A4A4A4',
  },
  frequencyLabelActive: {
    color: '#1A330B',
  },
  guideLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
    padding: 12,
  },
  guideText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: '#5C8D42',
  },
  submitContainer: {
    shadowColor: '#45C400',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButton: {
    paddingVertical: 18,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontFamily: 'Nunito_800Black',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

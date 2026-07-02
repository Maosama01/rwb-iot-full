import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
      navigation.replace('MainApp');
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save preferences.');
    }
  };

  const PlacementButton = ({ label, icon, selected, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        aspectRatio: 1,
        backgroundColor: selected ? '#EAF3E2' : 'white',
        borderColor: selected ? '#5C8D42' : '#F0F0F0',
        borderWidth: 2,
        borderRadius: 24,
        padding: 8,
        marginHorizontal: 6,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: selected ? 0 : 0.03,
        shadowRadius: 4,
        elevation: selected ? 0 : 1
      }}
    >
      <Text style={{ fontSize: 32, marginBottom: 8 }}>{icon}</Text>
      <Text className="text-center font-nunito-bold text-[12px]" style={{ color: selected ? '#1A330B' : '#8c9a87' }}>{label}</Text>
    </TouchableOpacity>
  );

  const DietButton = ({ label, icon, selected, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: '42%',
        aspectRatio: 1,
        backgroundColor: selected ? '#EAF3E2' : 'white',
        borderColor: selected ? '#5C8D42' : '#F0F0F0',
        borderWidth: 2,
        borderRadius: 999, // Perfect circle
        padding: 16,
        marginHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: selected ? 0 : 0.03,
        shadowRadius: 4,
        elevation: selected ? 0 : 1
      }}
    >
      <Text style={{ fontSize: 42, marginBottom: 12 }}>{icon}</Text>
      <Text className="text-center font-nunito-black text-[15px]" style={{ color: selected ? '#1A330B' : '#8c9a87' }}>{label}</Text>
    </TouchableOpacity>
  );

  const FrequencyToggle = ({ label, selected, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 12,
        backgroundColor: selected ? 'white' : 'transparent',
        borderRadius: 999,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: selected ? 0.05 : 0,
        shadowRadius: 4,
        elevation: selected ? 1 : 0
      }}
    >
      <Text className="font-nunito-bold text-[13px]" style={{ color: selected ? '#1A330B' : '#A4A4A4' }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#FDFDF9]">
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}>
          
          <View className="items-center mt-6 mb-10">
            <View className="bg-[#EAF3E2] w-16 h-16 rounded-full items-center justify-center mb-4">
              <Ionicons name="settings-outline" size={28} color="#5C8D42" />
            </View>
            <Text className="text-[#1A330B] font-nunito-black text-3xl tracking-tight text-center">App Setup</Text>
            <Text className="text-[#8c9a87] font-nunito-bold text-sm text-center mt-2 px-4 leading-relaxed">
              Let's tune your Rawbin for optimal performance based on your environment.
            </Text>
          </View>

          {/* Placement Section */}
          <View className="mb-10">
            <Text className="text-[#1A330B] font-nunito-black text-xl mb-1">Where will it live?</Text>
            <Text className="text-[#8c9a87] font-nunito-regular text-[12px] mb-4">
              This helps us adjust the internal temperature.
            </Text>
            <View className="flex-row justify-between" style={{ marginHorizontal: -6 }}>
              <PlacementButton label="Kitchen" icon="🍳" selected={placement === 'Kitchen'} onPress={() => setPlacement('Kitchen')} />
              <PlacementButton label="Balcony" icon="☀️" selected={placement === 'Balcony'} onPress={() => setPlacement('Balcony')} />
              <PlacementButton label="Room" icon="🛏️" selected={placement === 'Near Room'} onPress={() => setPlacement('Near Room')} />
            </View>
          </View>

          {/* Diet Section */}
          <View className="mb-10">
            <Text className="text-[#1A330B] font-nunito-black text-xl mb-1">What is your diet type?</Text>
            <Text className="text-[#8c9a87] font-nunito-regular text-[12px] mb-6">
              This helps us tune the motor spin speed and duration.
            </Text>
            <View className="flex-row justify-center">
              <DietButton label="Veg" icon="🥦" selected={dietType === 'Veg'} onPress={() => { setDietType('Veg'); setFrequency(null); }} />
              <DietButton label="Non-Veg" icon="🥩" selected={dietType === 'Non-Veg'} onPress={() => setDietType('Non-Veg')} />
            </View>
          </View>

          {/* Frequency Section (Conditional) */}
          {dietType === 'Non-Veg' && (
            <View className="mb-10">
              <Text className="text-[#1A330B] font-nunito-black text-xl mb-4 text-center">How often do you eat non-veg?</Text>
              <View style={{ backgroundColor: '#F0F0F0', padding: 4, borderRadius: 999, flexDirection: 'row' }}>
                {['Regularly', 'Occasionally', 'Rarely'].map(opt => (
                  <FrequencyToggle key={opt} label={opt} selected={frequency === opt} onPress={() => setFrequency(opt)} />
                ))}
              </View>
            </View>
          )}

          <View className="mt-8">
            <TouchableOpacity 
              onPress={handleSubmit}
              className="bg-[#5C8D42] rounded-full py-4 items-center shadow-lg shadow-[#5C8D42]/30"
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-nunito-black text-lg">
                  Complete Setup
                </Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

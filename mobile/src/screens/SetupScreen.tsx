import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

const PLACEMENT_OPTIONS = ['Kitchen', 'Balcony', 'Near Room'];
const DIET_OPTIONS = ['Veg', 'Non-Veg'];
const FREQUENCY_OPTIONS = ['Regularly', 'Occasionally', 'Rarely'];

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

  const SelectionButton = ({ label, selected, onPress }: { label: string, selected: boolean, onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-3 rounded-[12px] border mr-3 mb-3 ${
        selected ? 'bg-[#2D5016] border-[#2D5016]' : 'bg-[#FDFAF5] border-[rgba(0,0,0,0.06)]'
      }`}
    >
      <Text className={`font-nunito-bold text-sm ${selected ? 'text-white' : 'text-[#2D5016]'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground 
      source={require('../../assets/dashboard_bg.png')} 
      style={{ flex: 1 }}
      imageStyle={{ opacity: 0.35, resizeMode: 'cover' }}
    >
      <View className="flex-1 bg-[#F5F0E8]/70">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 32, paddingVertical: 60, flexGrow: 1 }}>
          
          <View className="items-center mb-8">
            <View className="bg-white/80 p-4 rounded-full shadow-sm border border-black/5 mb-3">
              <Ionicons name="settings-outline" size={40} color="#2D5016" />
            </View>
            <Text className="text-[#2D5016] font-nunito-black text-3xl tracking-tight text-center">App Setup</Text>
            <Text className="text-[#4A7C2F] font-nunito-bold text-sm text-center mt-2">
              Let's tune your Rawbin for optimal performance based on your environment and usage.
            </Text>
          </View>

          <View className="bg-white/80 rounded-[24px] p-6 shadow-sm border border-black/5 mb-6">
            
            <View className="mb-6">
              <Text className="text-[#2D5016] font-nunito-bold text-base mb-3">
                Where will you place the Rawbin?
              </Text>
              <Text className="text-[#a69d92] font-nunito-regular text-xs mb-3">
                This helps us adjust the internal temperature based on sunlight and ambient heat.
              </Text>
              <View className="flex-row flex-wrap">
                {PLACEMENT_OPTIONS.map(opt => (
                  <SelectionButton 
                    key={opt}
                    label={opt}
                    selected={placement === opt}
                    onPress={() => setPlacement(opt)}
                  />
                ))}
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-[#2D5016] font-nunito-bold text-base mb-3">
                What is your diet type?
              </Text>
              <Text className="text-[#a69d92] font-nunito-regular text-xs mb-3">
                This helps us tune the motor spin speed and duration for breaking down different waste types.
              </Text>
              <View className="flex-row flex-wrap">
                {DIET_OPTIONS.map(opt => (
                  <SelectionButton 
                    key={opt}
                    label={opt}
                    selected={dietType === opt}
                    onPress={() => {
                      setDietType(opt);
                      if (opt === 'Veg') setFrequency(null);
                    }}
                  />
                ))}
              </View>
            </View>

            {dietType === 'Non-Veg' && (
              <View className="mb-6">
                <Text className="text-[#2D5016] font-nunito-bold text-base mb-3">
                  How often do you eat non-veg?
                </Text>
                <View className="flex-row flex-wrap">
                  {FREQUENCY_OPTIONS.map(opt => (
                    <SelectionButton 
                      key={opt}
                      label={opt}
                      selected={frequency === opt}
                      onPress={() => setFrequency(opt)}
                    />
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity 
              onPress={handleSubmit}
              className="bg-[#2D5016] rounded-[16px] py-4 items-center shadow-sm mt-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#F5F0E8" />
              ) : (
                <Text className="text-[#F5F0E8] font-nunito-black text-lg">
                  Complete Setup
                </Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

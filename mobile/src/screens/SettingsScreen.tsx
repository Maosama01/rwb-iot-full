import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function SettingsScreen() {
  const navigation = useNavigation<any>();

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('access_token');
              await AsyncStorage.removeItem('refresh_token');
              // Reset navigation stack and go to Login
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error clearing storage:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-[#F5F0E8]">
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        {/* Header */}
        <View className="flex-row items-center px-6 pt-6 pb-4 border-b border-black/5">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#2D5016" />
          </TouchableOpacity>
          <Text className="text-[#2D5016] font-nunito-black text-2xl">Settings</Text>
        </View>

        <ScrollView className="flex-1 px-6 pt-6">
          
          <View className="mb-8">
            <Text className="text-[#4A7C2F] font-nunito-bold text-xs uppercase tracking-widest mb-3">Account</Text>
            <View className="bg-white rounded-[16px] shadow-sm border border-[rgba(0,0,0,0.06)] overflow-hidden">
              <TouchableOpacity className="flex-row justify-between items-center p-4 border-b border-[rgba(0,0,0,0.06)]">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-[#E8F0E0] items-center justify-center mr-3">
                    <Ionicons name="person-outline" size={18} color="#4A7C2F" />
                  </View>
                  <Text className="text-[#2D5016] font-nunito-bold text-base">Edit Profile</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#a69d92" />
              </TouchableOpacity>
              
              <TouchableOpacity className="flex-row justify-between items-center p-4">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-[#E8F0E0] items-center justify-center mr-3">
                    <Ionicons name="notifications-outline" size={18} color="#4A7C2F" />
                  </View>
                  <Text className="text-[#2D5016] font-nunito-bold text-base">Notifications</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#a69d92" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-[#4A7C2F] font-nunito-bold text-xs uppercase tracking-widest mb-3">Device</Text>
            <View className="bg-white rounded-[16px] shadow-sm border border-[rgba(0,0,0,0.06)] overflow-hidden">
              <TouchableOpacity className="flex-row justify-between items-center p-4">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-[#E8F0E0] items-center justify-center mr-3">
                    <Ionicons name="hardware-chip-outline" size={18} color="#4A7C2F" />
                  </View>
                  <Text className="text-[#2D5016] font-nunito-bold text-base">RAWBIN Setup</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#a69d92" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-[#4A7C2F] font-nunito-bold text-xs uppercase tracking-widest mb-3">Support</Text>
            <View className="bg-white rounded-[16px] shadow-sm border border-[rgba(0,0,0,0.06)] overflow-hidden">
              <TouchableOpacity className="flex-row justify-between items-center p-4 border-b border-[rgba(0,0,0,0.06)]">
                <Text className="text-[#2D5016] font-nunito-bold text-base ml-11">Help Center</Text>
                <Ionicons name="chevron-forward" size={20} color="#a69d92" />
              </TouchableOpacity>
              <TouchableOpacity className="flex-row justify-between items-center p-4 border-b border-[rgba(0,0,0,0.06)]">
                <Text className="text-[#2D5016] font-nunito-bold text-base ml-11">Terms of Service</Text>
                <Ionicons name="chevron-forward" size={20} color="#a69d92" />
              </TouchableOpacity>
              <TouchableOpacity className="flex-row justify-between items-center p-4">
                <Text className="text-[#2D5016] font-nunito-bold text-base ml-11">Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={20} color="#a69d92" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleLogout}
            className="bg-white rounded-[16px] shadow-sm border border-[rgba(0,0,0,0.06)] p-4 items-center mb-10"
          >
            <Text className="text-[#C0392B] font-nunito-black text-base">Log Out</Text>
          </TouchableOpacity>
          
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

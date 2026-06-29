import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ImageBackground, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../api/client';

export function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<'item' | 'category'>('item');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (text.length > 2) {
      setIsSearching(true);
      
      debounceTimeout.current = setTimeout(async () => {
        try {
          const response = await apiClient.post('/ai/check-item', {
            item_name: text
          });
          
          const data = response.data;
          let verdict = 'yes';
          let badge = 'Compostable';
          if (data.category === 'no') {
            verdict = 'no';
            badge = 'Avoid Always';
          } else if (data.category === 'browns') {
            badge = 'Carbon Rich (Brown)';
          } else {
            badge = 'Nitrogen Rich (Green)';
          }

          setResult({
            verdict: verdict,
            title: data.title,
            reason: data.description,
            tip: data.tips && data.tips.length > 0 ? data.tips[0] : 'Chop it up to help it decompose faster.',
            badge: badge,
            breakdown_time: null
          });
        } catch (error) {
          console.error("AI Check Error:", error);
          // Fallback or show error
          setResult({
            verdict: 'maybe',
            title: 'Connection Error',
            reason: 'Could not connect to Rawbin AI right now.',
            tip: 'Please ensure your backend is running or check your connection.',
            badge: 'Error',
            breakdown_time: null
          });
        } finally {
          setIsSearching(false);
        }
      }, 500); // 500ms debounce
    } else {
      setResult(null);
      setIsSearching(false);
    }
  };

  const renderResultCard = () => {
    if (!result) return null;

    const isYes = result.verdict === 'yes';
    const isNo = result.verdict === 'no';

    let bgColor = isYes ? 'bg-[#E8F0E0]' : isNo ? 'bg-[#FFE5E5]' : 'bg-[#FFF9E6]';
    let iconColor = isYes ? '#2D5016' : isNo ? '#C0392B' : '#B8860B';
    let iconName = isYes ? 'checkmark-circle' : isNo ? 'close-circle' : 'warning';
    
    return (
      <View style={{ borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', marginTop: 16, backgroundColor: isYes ? '#E8F0E0' : isNo ? '#FFE5E5' : '#FFF9E6' }}>
        <View className="flex-row items-center mb-3">
          <Ionicons name={iconName as any} size={28} color={iconColor} />
          <Text className="text-[#2D5016] font-nunito-black text-xl ml-2 uppercase tracking-wide flex-1">{result.title}</Text>
        </View>
        <Text className="text-[#2D5016] font-nunito text-sm leading-relaxed mb-3">{result.reason}</Text>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.6)', padding: 12, borderRadius: 12, marginBottom: 12 }}>
          <Text className="text-[#2D5016] font-nunito-bold text-xs mb-1">💡 Pro Tip:</Text>
          <Text className="text-[#2D5016] font-nunito text-xs leading-relaxed">{result.tip}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <View style={{ backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }}>
            <Text className="text-[#2D5016] font-nunito-bold text-[10px] uppercase tracking-widest">{result.badge}</Text>
          </View>
          {result.breakdown_time && (
            <Text className="text-[#4A7C2F] font-nunito-bold text-xs">⏱ {result.breakdown_time}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <ImageBackground 
      source={require('../../assets/dashboard_bg.png')} 
      style={{ flex: 1 }}
      imageStyle={{ opacity: 0.15, resizeMode: 'cover' }}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(245, 240, 232, 0.9)' }}>
        <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
          {/* Header */}
          <View className="px-6 pt-6 pb-4">
            <View className="flex-row items-center">
              <Ionicons name="leaf" size={28} color="#2D5016" className="mr-2" />
              <Text className="text-[#2D5016] font-nunito-black text-3xl ml-2">Can It Compost?</Text>
            </View>
            <Text className="text-[#4A7C2F] font-nunito-bold text-sm mt-1 ml-9">Check before you chuck</Text>
          </View>

          {/* Tab Switcher */}
          <View className="px-6 mb-4 flex-row justify-center">
            <View style={{ backgroundColor: 'rgba(229, 223, 206, 0.5)', borderRadius: 999, padding: 4, flexDirection: 'row' }}>
              <TouchableOpacity 
                onPress={() => setActiveTab('item')}
                className="px-6 py-2 rounded-full"
                style={activeTab === 'item' ? { backgroundColor: 'white', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 } : {}}
              >
                <Text className="font-nunito-bold text-xs" style={{ color: activeTab === 'item' ? '#2D5016' : '#8e8578' }}>By Item</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setActiveTab('category')}
                className="px-6 py-2 rounded-full"
                style={activeTab === 'category' ? { backgroundColor: 'white', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 } : {}}
              >
                <Text className="font-nunito-bold text-xs" style={{ color: activeTab === 'category' ? '#2D5016' : '#8e8578' }}>By Category</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
            
            {activeTab === 'item' ? (
              <>
                {/* Search Bar */}
                <View className="mb-2">
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDFAF5', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}>
                    <Ionicons name="search" size={20} color="#4A7C2F" />
                    <TextInput 
                      className="flex-1 ml-3 text-[#2D5016] font-nunito-bold"
                      placeholder="Type any food item (e.g. Haddi)..."
                      placeholderTextColor="#a69d92"
                      value={searchQuery}
                      onChangeText={handleSearch}
                    />
                  </View>
                </View>

                {/* Result Card */}
                {result && renderResultCard()}

                {/* Popular Checks */}
                {!result && (
                  <View className="mt-8 mb-10">
                    <Text className="text-[#4A7C2F] font-nunito-bold text-xs uppercase tracking-widest text-center mb-4">── Popular Checks ──</Text>
                    <View style={{ backgroundColor: 'rgba(253, 250, 245, 0.9)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      <View className="w-[48%] mb-3 flex-row items-center"><Text>🟢</Text><Text className="text-[#2D5016] font-nunito ml-2 text-xs">Sabzi ke chilke</Text></View>
                      <View className="w-[48%] mb-3 flex-row items-center"><Text>🔴</Text><Text className="text-[#2D5016] font-nunito ml-2 text-xs">Gosht (Meat)</Text></View>
                      <View className="w-[48%] mb-3 flex-row items-center"><Text>🟢</Text><Text className="text-[#2D5016] font-nunito ml-2 text-xs">Coffee grounds</Text></View>
                      <View className="w-[48%] mb-3 flex-row items-center"><Text>🔴</Text><Text className="text-[#2D5016] font-nunito ml-2 text-xs">Haddi (Bones)</Text></View>
                      <View className="w-[48%] flex-row items-center"><Text>🟡</Text><Text className="text-[#2D5016] font-nunito ml-2 text-xs">Atta / Maida</Text></View>
                      <View className="w-[48%] flex-row items-center"><Text>🟡</Text><Text className="text-[#2D5016] font-nunito ml-2 text-xs">Citrus peels</Text></View>
                    </View>
                  </View>
                )}
              </>
            ) : (
              /* By Category View */
              <View className="mt-4 mb-10">
                <View className="flex-row justify-between mb-4">
                  <View className="w-[48%]">
                    <View style={{ backgroundColor: 'rgba(232, 240, 224, 0.9)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', marginBottom: 12 }}>
                      <Text className="text-3xl mb-1">🥦</Text>
                      <Text className="text-[#2D5016] font-nunito-bold text-sm">Veggie Scraps</Text>
                      <Text className="text-[#4A7C2F] text-[10px] mt-1">Excellent Nitrogen</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(232, 240, 224, 0.9)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', marginBottom: 12 }}>
                      <Text className="text-3xl mb-1">🍌</Text>
                      <Text className="text-[#2D5016] font-nunito-bold text-sm">Fruit Peels</Text>
                      <Text className="text-[#4A7C2F] text-[10px] mt-1">Sweet Energy</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255, 249, 230, 0.9)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
                      <Text className="text-3xl mb-1">🍞</Text>
                      <Text className="text-[#B8860B] font-nunito-bold text-sm">Bread / Grains</Text>
                      <Text style={{ color: 'rgba(184, 134, 11, 0.7)', fontSize: 10, marginTop: 4 }}>In small amounts</Text>
                    </View>
                  </View>

                  <View className="w-[48%]">
                    <View style={{ backgroundColor: 'rgba(255, 229, 229, 0.9)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', marginBottom: 12 }}>
                      <Text className="text-3xl mb-1">🥩</Text>
                      <Text className="text-[#C0392B] font-nunito-bold text-sm">Meat & Bones</Text>
                      <Text style={{ color: 'rgba(192, 57, 43, 0.7)', fontSize: 10, marginTop: 4 }}>Attracts pests</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255, 229, 229, 0.9)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', marginBottom: 12 }}>
                      <Text className="text-3xl mb-1">🧀</Text>
                      <Text className="text-[#C0392B] font-nunito-bold text-sm">Dairy / Milk</Text>
                      <Text style={{ color: 'rgba(192, 57, 43, 0.7)', fontSize: 10, marginTop: 4 }}>Rots quickly</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(232, 240, 224, 0.9)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
                      <Text className="text-3xl mb-1">📄</Text>
                      <Text className="text-[#2D5016] font-nunito-bold text-sm">Paper / Cardboard</Text>
                      <Text className="text-[#4A7C2F] text-[10px] mt-1">Great Carbon</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

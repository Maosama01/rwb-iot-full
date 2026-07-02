import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ImageBackground, ActivityIndicator, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import apiClient from '../api/client';

export function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<'item' | 'category'>('item');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Browns' | 'Greens' | 'Avoid'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [recording, setRecording] = useState<any>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [result, setResult] = useState<any>(null);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorder = useRef<any>(null);
  const audioChunks = useRef<any[]>([]);

  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new (window as any).MediaRecorder(stream);
        audioChunks.current = [];
        
        mediaRecorder.current.ondataavailable = (e: any) => {
          if (e.data.size > 0) {
            audioChunks.current.push(e.data);
          }
        };
        
        mediaRecorder.current.onstop = async () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64data = reader.result?.toString().split(',')[1];
            if (base64data) {
              setIsProcessingVoice(true);
              try {
                const response = await apiClient.post('/ai/check-item-voice', { 
                  audio_base64: base64data,
                  mime_type: 'audio/webm'
                });
                handleAIResponse(response.data);
              } catch (err: any) {
                console.error('API Error:', err);
                setIsProcessingVoice(false);
                const backendError = err.response?.data?.detail || err.message || 'Failed to process audio on server.';
                setResult({ verdict: 'maybe', title: 'Error', reason: backendError, badge: 'Error' });
              }
            } else {
              setResult({ verdict: 'maybe', title: 'Error', reason: 'Failed to encode audio on device.', badge: 'Error' });
            }
          };
          stream.getTracks().forEach((track: any) => track.stop());
        };
        
        mediaRecorder.current.start();
        setRecording(true);
      } else {
        const perm = await requestRecordingPermissionsAsync();
        if (perm.status !== 'granted') {
          throw new Error('Microphone access denied.');
        }
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
        setRecording(audioRecorder);
      }
    } catch (err: any) {
      console.error('Failed to start recording', err);
      setResult({ verdict: 'maybe', title: 'Mic Error', reason: err.message || 'Microphone access denied.', badge: 'Error' });
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    if (Platform.OS === 'web') {
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop();
      }
      setRecording(null);
    } else {
      setRecording(null);
      try {
        await audioRecorder.stop();
        await setAudioModeAsync({ allowsRecording: false });
        const uri = audioRecorder.uri;
        if (uri) {
          setIsProcessingVoice(true);
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          const response = await apiClient.post('/ai/check-item-voice', { audio_base64: base64 });
          handleAIResponse(response.data);
        }
      } catch (error) {
        console.error('Failed to stop/process recording', error);
        setIsProcessingVoice(false);
      }
    }
  };

  const handleAIResponse = (data: any) => {
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
    setIsProcessingVoice(false);
  };

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
          handleAIResponse(response.data);
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

    const bgColor = isYes ? '#EAF3E2' : isNo ? '#FFE5E5' : '#FFF9E6';
    const textColor = isYes ? '#45B900' : isNo ? '#C0392B' : '#B8860B';
    const iconName = isYes ? 'checkmark-circle' : isNo ? 'close-circle' : 'warning';
    
    return (
      <View style={{ borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F0F0F0', marginTop: 16, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
        <View className="flex-row items-center mb-3">
          <Ionicons name={iconName as any} size={28} color={textColor} />
          <Text className="text-[#1A330B] font-nunito-black text-xl ml-2 uppercase tracking-wide flex-1">{result.title}</Text>
        </View>
        <Text className="text-[#8c9a87] font-nunito-regular text-sm leading-relaxed mb-4">{result.reason}</Text>
        
        <View style={{ backgroundColor: bgColor, padding: 16, borderRadius: 16, marginBottom: 16 }}>
          <Text className="text-[#1A330B] font-nunito-bold text-xs mb-1">💡 Pro Tip:</Text>
          <Text className="text-[#1A330B] font-nunito-regular text-xs leading-relaxed opacity-80">{result.tip}</Text>
        </View>
        
        <View className="flex-row items-center justify-between">
          <View style={{ backgroundColor: bgColor, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}>
            <Text className="font-nunito-bold text-[10px] uppercase tracking-widest" style={{ color: textColor }}>{result.badge}</Text>
          </View>
          {result.breakdown_time && (
            <Text className="text-[#8c9a87] font-nunito-bold text-xs">⏱ {result.breakdown_time}</Text>
          )}
        </View>
      </View>
    );
  };

  const ItemCard = ({ icon, title, type }: { icon: string, title: string, type: 'YES' | 'NO' | 'DEPENDS' }) => {
    const isYes = type === 'YES';
    const isNo = type === 'NO';
    const bgColor = isYes ? '#EAF3E2' : isNo ? '#FFE5E5' : '#FFF9E6';
    const textColor = isYes ? '#45B900' : isNo ? '#C0392B' : '#B8860B';
  
    return (
      <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F0F0F0', width: '48%', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 24 }}>{icon}</Text>
        </View>
        <Text className="text-[#1A330B] font-nunito-bold text-[14px] mb-3 leading-tight">{title}</Text>
        <View style={{ backgroundColor: bgColor, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
          <Text className="font-nunito-bold text-[10px]" style={{ color: textColor }}>{type}</Text>
        </View>
      </View>
    );
  };

  const RecentItem = ({ icon, title, type }: any) => {
    const isYes = type === 'YES';
    const isNo = type === 'NO';
    const bgColor = isYes ? '#EAF3E2' : isNo ? '#FFE5E5' : '#FFF9E6';
    const textColor = isYes ? '#45B900' : isNo ? '#C0392B' : '#B8860B';
  
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </View>
        <Text className="text-[#1A330B] font-nunito-bold text-[15px] flex-1">{title}</Text>
        <View style={{ backgroundColor: bgColor, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
          <Text className="font-nunito-bold text-[11px]" style={{ color: textColor }}>{type}</Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#FDFDF9]">
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        {/* Header */}
        <View className="px-6 pt-6 pb-6">
          <Text className="text-[#1A330B] font-nunito-black text-3xl mb-1">Can It Compost?</Text>
          <Text className="text-[#8c9a87] font-nunito-regular text-sm">Search our library before you throw it away.</Text>
        </View>

        {/* Search Bar */}
        <View className="px-6 mb-6">
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF3E2', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 14 }}>
            <Ionicons name="search" size={20} color="#5C8D42" />
            <TextInput 
              className="flex-1 ml-3 text-[#1A330B] font-nunito-bold text-[15px]"
              placeholder={recording ? "Listening..." : "Type any food item (e.g. Apple)..."}
              placeholderTextColor={recording ? "#FF3B30" : "#5C8D42"}
              value={searchQuery}
              onChangeText={handleSearch}
              editable={!recording && !isProcessingVoice}
            />
            <TouchableOpacity
              onPress={recording ? stopRecording : startRecording}
              disabled={isProcessingVoice}
            >
              {isProcessingVoice ? (
                <ActivityIndicator size="small" color="#5C8D42" />
              ) : (
                <View className="bg-white w-9 h-9 rounded-full items-center justify-center shadow-sm">
                  <Ionicons name="mic" size={18} color={recording ? "#FF3B30" : "#5C8D42"} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Switcher */}
        <View className="px-6 mb-6">
          <View style={{ backgroundColor: '#F0F0F0', borderRadius: 999, padding: 4, flexDirection: 'row' }}>
            <TouchableOpacity 
              onPress={() => setActiveTab('item')}
              className="flex-1 py-3 rounded-full items-center"
              style={activeTab === 'item' ? { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 } : {}}
            >
              <Text className="font-nunito-bold text-[13px]" style={{ color: activeTab === 'item' ? '#1A330B' : '#A4A4A4' }}>By Item</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setActiveTab('category')}
              className="flex-1 py-3 rounded-full items-center"
              style={activeTab === 'category' ? { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 } : {}}
            >
              <Text className="font-nunito-bold text-[13px]" style={{ color: activeTab === 'category' ? '#1A330B' : '#A4A4A4' }}>By Category</Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === 'item' ? (
          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Result Card */}
            {result && renderResultCard()}

            {/* Popular Checks */}
            {!result && (
              <View className="mt-2 mb-10">
                <Text className="text-[#8c9a87] font-nunito-bold text-xs uppercase tracking-widest mb-4">Recently Searched</Text>
                <RecentItem icon="🍎" title="Apple Core" type="YES" />
                <RecentItem icon="🍗" title="Chicken Bones" type="NO" />
                <RecentItem icon="☕" title="Coffee Grounds" type="YES" />
                <RecentItem icon="🍞" title="Bread Crust" type="DEPENDS" />
                <RecentItem icon="🍌" title="Banana Peel" type="YES" />
                <RecentItem icon="🧀" title="Cheese" type="NO" />
              </View>
            )}
          </ScrollView>
        ) : (
          <View className="flex-1">
            {/* Category Filters */}
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 10, paddingBottom: 20 }}>
                {['All', 'Browns', 'Greens', 'Avoid'].map(filter => (
                  <TouchableOpacity 
                    key={filter}
                    onPress={() => setSelectedFilter(filter as any)}
                    style={{ 
                      backgroundColor: selectedFilter === filter ? '#5C8D42' : 'white',
                      borderWidth: 1,
                      borderColor: selectedFilter === filter ? '#5C8D42' : '#E5E5E5',
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: 999,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1
                    }}
                  >
                    <Text className="font-nunito-bold text-[13px]" style={{ color: selectedFilter === filter ? 'white' : '#8c9a87' }}>{filter}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Items Grid */}
            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {/* Greens */}
                {(selectedFilter === 'All' || selectedFilter === 'Greens') && (
                  <>
                    <ItemCard icon="🥦" title="Veggie Scraps" type="YES" />
                    <ItemCard icon="🍌" title="Fruit Peels" type="YES" />
                    <ItemCard icon="☕" title="Coffee Grounds" type="YES" />
                  </>
                )}
                {/* Browns */}
                {(selectedFilter === 'All' || selectedFilter === 'Browns') && (
                  <>
                    <ItemCard icon="📄" title="Paper / Cardboard" type="YES" />
                    <ItemCard icon="🍂" title="Dry Leaves" type="YES" />
                    <ItemCard icon="🍞" title="Bread / Grains" type="DEPENDS" />
                  </>
                )}
                {/* Avoid */}
                {(selectedFilter === 'All' || selectedFilter === 'Avoid') && (
                  <>
                    <ItemCard icon="🥩" title="Meat & Bones" type="NO" />
                    <ItemCard icon="🧀" title="Dairy / Milk" type="NO" />
                    <ItemCard icon="🛢️" title="Oils & Grease" type="NO" />
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

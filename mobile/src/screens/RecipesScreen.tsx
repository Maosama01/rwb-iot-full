import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, ImageBackground, KeyboardAvoidingView, Platform, Image, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../api/client';

export function RecipesScreen() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isFinding, setIsFinding] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);
  
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const addIngredient = (text: string) => {
    if (!text.trim()) return;
    const newItems = text.split(',').map(i => i.trim()).filter(i => i && !ingredients.includes(i));
    if (newItems.length > 0) {
      setIngredients([...ingredients, ...newItems]);
    }
    setInputText('');
  };

  const removeIngredient = (ingToRemove: string) => {
    setIngredients(ingredients.filter(ing => ing !== ingToRemove));
  };

  const handleSnapFridge = async () => {
    if (Platform.OS === 'web') {
      // Alert.alert with custom buttons doesn't work on web.
      // launchImageLibrary on mobile web natively prompts for Camera or Gallery anyway!
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        processImage(result.assets[0].uri, result.assets[0].base64 || null);
      }
      return;
    }

    Alert.alert(
      "Snap Your Fridge",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (permissionResult.granted === false) {
              Alert.alert("Permission to access camera is required!");
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.5,
              base64: true,
            });
            if (!result.canceled) {
              processImage(result.assets[0].uri, result.assets[0].base64 || null);
            }
          }
        },
        {
          text: "Choose from Gallery",
          onPress: async () => {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
              Alert.alert("Permission to access gallery is required!");
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.5,
              base64: true,
            });
            if (!result.canceled) {
              processImage(result.assets[0].uri, result.assets[0].base64 || null);
            }
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const processImage = async (uri: string, base64: string | null) => {
    setCapturedImageUri(uri);
    setImageBase64(base64);
    setIsScanning(true);
    
    if (base64) {
      try {
        const response = await apiClient.post('/ai/extract-ingredients', {
          image_base64: base64
        });
        const extracted = response.data;
        if (extracted && extracted.length > 0) {
          setIngredients(extracted);
        } else {
          setIngredients(['Could not detect anything.']);
        }
      } catch (error) {
        console.error("AI Extract Error:", error);
        setIngredients(['Error extracting ingredients']);
      } finally {
        setIsScanning(false);
      }
    } else {
      setIsScanning(false);
    }
  };


  const handleFindRecipes = async () => {
    if (ingredients.length === 0) return;
    setIsFinding(true);
    
    try {
      const response = await apiClient.post('/ai/generate-recipes', {
        ingredients: ingredients,
        image_base64: imageBase64
      });
      setRecipes(response.data);
      setShowRecipes(true);
    } catch (error) {
      console.error("AI Recipe Error:", error);
      Alert.alert("Error", "Could not generate recipes.");
    } finally {
      setIsFinding(false);
    }
  };

  const resetFlow = () => {
    setShowRecipes(false);
    setCapturedImageUri(null);
    setImageBase64(null);
    setIngredients([]);
    setRecipes([]);
    setExpandedRecipe(null);
  };

  return (
    <ImageBackground 
      source={require('../../assets/dashboard_bg.png')} 
      style={{ flex: 1 }}
      imageStyle={{ opacity: 0.15, resizeMode: 'cover' }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-[#F5F0E8]/90">
        <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
          {/* Header */}
          <View className="px-6 pt-6 pb-2">
            <View className="flex-row items-center">
              <Ionicons name="leaf-outline" size={28} color="#2D5016" className="mr-2" />
              <Text className="text-[#2D5016] font-nunito-black text-3xl ml-2">SaveMyFood</Text>
            </View>
            <Text className="text-[#4A7C2F] font-nunito-bold text-sm mt-1 ml-9">Turn leftovers into something beautiful</Text>
          </View>

          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            
            {!showRecipes ? (
              <View className="mt-8">
                
                {capturedImageUri && (
                  <View className="mb-6 items-center">
                     <Text className="text-[#2D5016] font-nunito-bold text-xs uppercase mb-3">Captured Image</Text>
                     <Image 
                       source={{ uri: capturedImageUri }} 
                       className="w-full h-48 rounded-[16px] border border-[rgba(0,0,0,0.1)] shadow-sm"
                     />
                     {isScanning && (
                       <View className="absolute inset-0 bg-white/60 rounded-[16px] justify-center items-center">
                         <ActivityIndicator size="large" color="#4A7C2F" />
                         <Text className="text-[#2D5016] font-nunito-bold mt-2">AI is analyzing...</Text>
                       </View>
                     )}
                     <TouchableOpacity 
                       onPress={() => { setCapturedImageUri(null); setImageBase64(null); }}
                       className="mt-3"
                     >
                       <Text className="text-[#C0392B] font-nunito-bold text-xs uppercase">Remove Photo</Text>
                     </TouchableOpacity>
                  </View>
                )}

                {!capturedImageUri && (
                  <>
                    <Text className="text-[#2D5016] font-nunito-bold text-base mb-4 text-center">How do you want to start?</Text>
                    
                    <View className="flex-row justify-between mb-4">
                      <TouchableOpacity onPress={handleSnapFridge} className="w-[48%] bg-white/90 rounded-[16px] p-5 items-center shadow-sm border border-[rgba(0,0,0,0.06)]">
                        <Text className="text-3xl mb-2">📷</Text>
                        <Text className="text-[#2D5016] font-nunito-bold text-sm text-center">Snap Your Fridge</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setIsTyping(!isTyping)} className="w-[48%] bg-white/90 rounded-[16px] p-5 items-center shadow-sm border border-[rgba(0,0,0,0.06)]">
                        <Text className="text-3xl mb-2">✍️</Text>
                        <Text className="text-[#2D5016] font-nunito-bold text-sm text-center">Type Your Leftovers</Text>
                      </TouchableOpacity>
                    </View>

                    {isTyping && (
                      <View className="mb-4 bg-[#FDFAF5] rounded-[16px] px-4 py-3 shadow-sm border border-[rgba(0,0,0,0.06)] flex-row items-center">
                        <TextInput 
                          className="flex-1 text-[#2D5016] font-nunito-bold"
                          placeholder="e.g. apple, cheese, bread..."
                          placeholderTextColor="#a69d92"
                          value={inputText}
                          onChangeText={setInputText}
                          onSubmitEditing={() => addIngredient(inputText)}
                          returnKeyType="done"
                        />
                        <TouchableOpacity onPress={() => addIngredient(inputText)} className="bg-[#4A7C2F] p-1 rounded-full">
                          <Ionicons name="add" size={20} color="white" />
                        </TouchableOpacity>
                      </View>
                    )}

                  </>
                )}

                <View className="mb-8">
                  <Text className="text-[#2D5016] font-nunito text-xs mb-3">Added Items:</Text>
                  {ingredients.length === 0 ? (
                    <Text className="text-[#a69d92] font-nunito text-sm italic">Nothing added yet.</Text>
                  ) : (
                    <View className="flex-row flex-wrap gap-y-2">
                      {ingredients.map((ing, idx) => (
                        <View key={idx} className="bg-white/90 px-4 py-2 rounded-full border border-[#4A7C2F]/20 flex-row items-center mr-2 shadow-sm">
                          <Text className="text-[#2D5016] font-nunito-bold text-sm mr-2">{ing}</Text>
                          <TouchableOpacity onPress={() => removeIngredient(ing)}>
                            <Ionicons name="close" size={16} color="#4A7C2F" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <TouchableOpacity 
                  onPress={handleFindRecipes}
                  className={`rounded-[16px] py-4 flex-row justify-center items-center shadow-sm ${ingredients.length > 0 ? 'bg-[#2D5016]' : 'bg-[#a69d92]'}`}
                  disabled={ingredients.length === 0 || isScanning}
                >
                  {isFinding ? (
                    <ActivityIndicator color="#F5F0E8" />
                  ) : (
                    <>
                      <Ionicons name="leaf" size={18} color="#F5F0E8" />
                      <Text className="text-[#F5F0E8] font-nunito-black text-base ml-2">Find Recipes →</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View className="mt-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-[#4A7C2F] font-nunito-bold text-xs uppercase tracking-widest">── Recipes for you ──</Text>
                  <TouchableOpacity onPress={resetFlow} className="bg-white/50 px-3 py-1 rounded-full border border-black/5">
                    <Text className="text-[#2D5016] font-nunito-bold text-xs">← Start Over</Text>
                  </TouchableOpacity>
                </View>

                {recipes.length === 0 ? (
                  <Text className="text-[#2D5016] font-nunito-bold text-center mt-4">No recipes found. Try adding more ingredients!</Text>
                ) : (
                  recipes.map((recipe, index) => (
                    <TouchableOpacity key={index} onPress={() => setExpandedRecipe(expandedRecipe === index ? null : index)} className="bg-white/95 rounded-[24px] overflow-hidden shadow-sm border border-[rgba(0,0,0,0.06)] mb-4">
                      <View className="bg-[#E8F0E0]/80 p-5 flex-row justify-between items-center">
                        <View className="flex-1">
                          <Text className="text-[#2D5016] font-nunito-black text-lg leading-tight mb-1">{recipe.title}</Text>
                          <Text className="text-[#4A7C2F] font-nunito-bold text-[10px] uppercase">{recipe.tag}</Text>
                        </View>
                        <Ionicons name={expandedRecipe === index ? "chevron-up" : "chevron-down"} size={20} color="#2D5016" />
                      </View>
                      
                      {expandedRecipe === index && (
                        <>
                          <View className="p-5 border-b border-black/5">
                            <Text className="text-[#2D5016] font-nunito-bold text-xs mb-2">Uses your items:</Text>
                            <Text className="text-[#2D5016] font-nunito text-sm mb-4">✅ {recipe.uses_items.join('   ✅ ')}</Text>
                            <Text className="text-[#2D5016] font-nunito-bold text-xs mb-2">You'll also need:</Text>
                            <Text className="text-[#604a36] font-nunito text-sm">{recipe.extra_items}</Text>
                          </View>
                          <View className="flex-row justify-between p-5 border-b border-black/5 bg-[#FDFAF5]">
                            <Text className="text-[#2D5016] font-nunito-bold text-xs">⏱ {recipe.time}</Text>
                            <Text className="text-[#2D5016] font-nunito-bold text-xs">🍽 {recipe.servings}</Text>
                            <Text className="text-[#2D5016] font-nunito-bold text-xs">🌱 {recipe.difficulty}</Text>
                          </View>
                          
                          <View className="px-5 py-3 border-b border-black/5 bg-white">
                            <TouchableOpacity 
                              onPress={() => Linking.openURL(recipe.youtube_link)}
                              className="flex-row items-center justify-center bg-[#FF0000]/10 py-3 rounded-[12px]"
                            >
                              <Ionicons name="logo-youtube" size={18} color="#FF0000" />
                              <Text className="text-[#FF0000] font-nunito-bold text-sm ml-2">Watch Tutorial on YouTube</Text>
                            </TouchableOpacity>
                          </View>

                          <View className="p-5 border-b border-black/5">
                            <Text className="text-[#2D5016] font-nunito-bold text-xs mb-3">Instructions:</Text>
                            {recipe.instructions.map((inst: string, i: number) => (
                              <Text key={i} className="text-[#604a36] font-nunito text-sm leading-relaxed mb-2">{inst}</Text>
                            ))}
                          </View>
                          <View className="p-5 bg-[#E8F0E0]/30 flex-row items-start">
                            <Ionicons name="heart" size={20} color="#4A7C2F" className="mt-1" />
                            <View className="ml-3 flex-1">
                              <Text className="text-[#2D5016] font-nunito-bold text-sm mb-1">Compost tip:</Text>
                              <Text className="text-[#2D5016] font-nunito text-xs leading-relaxed">{recipe.compost_tip}</Text>
                            </View>
                          </View>
                        </>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

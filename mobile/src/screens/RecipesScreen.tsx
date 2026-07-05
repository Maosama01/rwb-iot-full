import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert, Linking, Image, Share } from 'react-native';
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
        { text: "Cancel", style: "cancel" }
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
    } catch (error: any) {
      if (error.response?.status === 429) {
        Alert.alert("Rate Limit Reached", "You've exceeded the API limits. Please wait.");
      } else {
        Alert.alert("Error", "Could not generate recipes. Please try again.");
      }
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

  const handleShare = async (recipe: any) => {
    try {
      const message = `Check out this Zero-Waste recipe I made with Rawbin!\n\n🍳 *${recipe.title}*\n\n⏱ Time: ${recipe.time} | 🍽 Servings: ${recipe.servings}\n\n🛒 Ingredients:\n${recipe.uses_items.join(', ')}\n${recipe.extra_items ? `\nPlus: ${recipe.extra_items}` : ''}\n\n📖 Instructions:\n${recipe.instructions.map((i: string, idx: number) => `${idx + 1}. ${i}`).join('\n')}\n\n🍃 Compost tip: ${recipe.compost_tip}\n\nWatch tutorial: ${recipe.youtube_link}`;
      
      await Share.share({
        message,
        title: recipe.title
      });
    } catch (error: any) {
      Alert.alert('Error', 'Could not share recipe');
    }
  };

  return (
    <View className="flex-1 bg-[#FAF8F1]">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
          
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            
            {/* Header Section */}
            <View className="px-6 pt-8 pb-6 flex-row justify-between items-center">
              <View className="flex-1 pr-4">
                <Text className="text-[#2C1E16] font-nunito-black text-4xl mb-1 tracking-tight">SaveMyFood</Text>
                <Text className="text-[#7A6A5A] font-nunito-bold text-base leading-snug">Turn leftovers into something beautiful</Text>
              </View>
              {/* Decorative Illustration */}
              <View className="w-24 h-24">
                 <Image source={require('../../assets/save_my_food_bin_1783001503844.png')} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              </View>
            </View>

            {!showRecipes ? (
              <View className="px-6 mt-4">
                
                {/* Divider */}
                <View className="flex-row items-center justify-center mb-6">
                  <Text className="text-[#A4A4A4]">—</Text>
                  <Text className="mx-2 text-[#4A5D23] font-nunito-bold text-sm">🍃  How do you want to start?  🍃</Text>
                  <Text className="text-[#A4A4A4]">—</Text>
                </View>

                {capturedImageUri && (
                  <View className="mb-6 items-center">
                     <Text className="text-[#4A5D23] font-nunito-bold text-xs uppercase mb-3">Captured Image</Text>
                     <Image source={{ uri: capturedImageUri }} className="w-full h-48 rounded-3xl shadow-sm" />
                     {isScanning && (
                       <View className="absolute inset-0 bg-[#FAF8F1]/80 rounded-3xl justify-center items-center">
                         <ActivityIndicator size="large" color="#5C8D42" />
                         <Text className="text-[#2C1E16] font-nunito-bold mt-2">AI is analyzing...</Text>
                       </View>
                     )}
                     <TouchableOpacity onPress={() => { setCapturedImageUri(null); setImageBase64(null); }} className="mt-3">
                       <Text className="text-[#D32F2F] font-nunito-bold text-xs uppercase">Remove Photo</Text>
                     </TouchableOpacity>
                  </View>
                )}

                {!capturedImageUri && (
                  <>
                    <View className="flex-row justify-between mb-8">
                      {/* Snap Your Fridge Card */}
                      <TouchableOpacity onPress={handleSnapFridge} className="w-[48%] bg-white rounded-3xl p-6 items-center shadow-sm shadow-[#2C1E16]/5">
                        <View className="w-16 h-16 bg-[#F0F5EC] rounded-full items-center justify-center mb-4 overflow-hidden">
                          <Image source={require('../../assets/camera_icon_1783001521021.png')} style={{width: 50, height: 50}} resizeMode="contain" />
                        </View>
                        <Text className="text-[#2C1E16] font-nunito-black text-sm text-center mb-1">Snap Your Fridge</Text>
                        <Text className="text-[#7A6A5A] font-nunito-regular text-[11px] text-center">Take a photo of your leftovers</Text>
                      </TouchableOpacity>

                      {/* Type Your Leftovers Card */}
                      <TouchableOpacity onPress={() => setIsTyping(!isTyping)} className="w-[48%] bg-white rounded-3xl p-6 items-center shadow-sm shadow-[#2C1E16]/5">
                        <View className="w-16 h-16 bg-[#F5F2EA] rounded-full items-center justify-center mb-4 overflow-hidden">
                          <Image source={require('../../assets/pencil_icon_1783001540716.png')} style={{width: 50, height: 50}} resizeMode="contain" />
                        </View>
                        <Text className="text-[#2C1E16] font-nunito-black text-sm text-center mb-1">Type Your Leftovers</Text>
                        <Text className="text-[#7A6A5A] font-nunito-regular text-[11px] text-center">List what you have at home</Text>
                      </TouchableOpacity>
                    </View>

                    {isTyping && (
                      <View className="mb-6 bg-white rounded-[20px] px-4 py-3 shadow-sm shadow-black/5 flex-row items-center border border-[#E5E0D8]">
                        <TextInput 
                          className="flex-1 text-[#2C1E16] font-nunito-bold"
                          placeholder="e.g. apple, cheese, bread..."
                          placeholderTextColor="#A4A4A4"
                          value={inputText}
                          onChangeText={setInputText}
                          onSubmitEditing={() => addIngredient(inputText)}
                          returnKeyType="done"
                        />
                        <TouchableOpacity onPress={() => addIngredient(inputText)} className="bg-[#5C8D42] w-8 h-8 rounded-full items-center justify-center">
                          <Ionicons name="add" size={20} color="white" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}

                {/* Added Items Section */}
                <View className="mb-8 p-4 rounded-[24px] border border-dashed border-[#D2C8B8] bg-[#FDFCF9] flex-row items-center">
                  <View className="w-12 h-12 bg-[#F0F5EC] rounded-xl items-center justify-center mr-4">
                    <Ionicons name="nutrition" size={24} color="#5C8D42" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[#2C1E16] font-nunito-black text-sm mb-1">Added Items</Text>
                    {ingredients.length === 0 ? (
                      <Text className="text-[#7A6A5A] font-nunito-regular text-xs">Nothing added yet.</Text>
                    ) : (
                      <View className="flex-row flex-wrap gap-2 mt-1">
                        {ingredients.map((ing, idx) => (
                          <View key={idx} className="bg-white px-3 py-1 rounded-full border border-[#E5E0D8] flex-row items-center shadow-sm">
                            <Text className="text-[#5C8D42] font-nunito-bold text-xs mr-1">{ing}</Text>
                            <TouchableOpacity onPress={() => removeIngredient(ing)}>
                              <Ionicons name="close" size={12} color="#7A6A5A" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  <View className="w-16 h-16 bg-white rounded-full items-center justify-center absolute right-4 -top-5 z-10 shadow-sm shadow-black/10 border border-[#E5E0D8] overflow-hidden">
                    <Image source={require('../../assets/food_bowl_1783001558655.png')} style={{width: '120%', height: '120%'}} resizeMode="cover" />
                  </View>
                </View>

                {/* CTA Button */}
                <TouchableOpacity 
                  onPress={handleFindRecipes}
                  className={`rounded-full py-5 flex-row justify-center items-center shadow-lg shadow-[#5C8D42]/30 ${ingredients.length > 0 ? 'bg-[#5C8D42]' : 'bg-[#A3B892]'}`}
                  disabled={ingredients.length === 0 || isScanning}
                >
                  {isFinding ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="leaf" size={20} color="white" />
                      <Text className="text-white font-nunito-black text-lg ml-2">Find Recipes →</Text>
                    </>
                  )}
                </TouchableOpacity>



              </View>
            ) : (
              <View className="px-6 mt-4">
                {/* Recipe List Divider & Start Over */}
                <View className="flex-row items-center justify-between mb-8">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-[#A4A4A4]">—</Text>
                    <Text className="mx-2 text-[#7A6A5A] font-nunito-black text-xs tracking-widest uppercase">🫘 RECIPES FOR YOU 🫘</Text>
                    <Text className="text-[#A4A4A4]">—</Text>
                  </View>
                  <TouchableOpacity onPress={resetFlow} className="bg-white px-4 py-2 rounded-full border border-[#E5E0D8] shadow-sm">
                    <Text className="text-[#2C1E16] font-nunito-bold text-xs">← Start Over</Text>
                  </TouchableOpacity>
                </View>

                {recipes.length === 0 ? (
                  <Text className="text-[#2C1E16] font-nunito-bold text-center mt-4">No recipes found. Try adding more ingredients!</Text>
                ) : (
                  recipes.map((recipe, index) => (
                    <View key={index} className="bg-white rounded-[32px] overflow-hidden shadow-sm shadow-[#2C1E16]/5 mb-6">
                      
                      {/* Recipe Card Header */}
                      <TouchableOpacity onPress={() => setExpandedRecipe(expandedRecipe === index ? null : index)} className="p-6 flex-row items-center border-b border-[#F0F0F0]">
                        <View className="w-16 h-16 bg-[#EFE8F5] rounded-full items-center justify-center mr-4 overflow-hidden">
                          <Image source={require('../../assets/recipe_hash_1783001598798.png')} style={{width: '100%', height: '100%'}} resizeMode="cover" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-[#2C1E16] font-nunito-black text-xl mb-2 leading-tight">{recipe.title}</Text>
                          <View className="bg-[#F4EEFA] self-start px-3 py-1 rounded-full flex-row items-center">
                            <Ionicons name="leaf" size={10} color="#7B4EAC" />
                            <Text className="text-[#7B4EAC] font-nunito-black text-[10px] ml-1 uppercase">{recipe.tag || 'ZERO WASTE'}</Text>
                          </View>
                        </View>
                        <View className="w-8 h-8 bg-[#FAF8F1] rounded-full items-center justify-center border border-[#E5E0D8]">
                          <Ionicons name={expandedRecipe === index ? "chevron-up" : "chevron-down"} size={16} color="#2C1E16" />
                        </View>
                      </TouchableOpacity>
                      
                      {expandedRecipe === index && (
                        <View className="p-6">
                          
                          {/* Ingredients */}
                          <View className="mb-6">
                            <Text className="text-[#2C1E16] font-nunito-black text-sm mb-3">Uses your items:</Text>
                            <View className="flex-row flex-wrap gap-2 mb-5">
                              {recipe.uses_items.map((item: string, i: number) => (
                                <View key={i} className="bg-[#F0F5EC] px-3 py-1.5 rounded-md flex-row items-center border border-[#D8E6CC]">
                                  <Text className="text-white bg-[#5C8D42] text-[8px] px-1 py-0.5 rounded-sm mr-2">✓</Text>
                                  <Text className="text-[#2C1E16] font-nunito-bold text-sm">{item}</Text>
                                </View>
                              ))}
                            </View>
                            <Text className="text-[#2C1E16] font-nunito-black text-sm mb-2">You'll also need:</Text>
                            <Text className="text-[#7A6A5A] font-nunito-regular text-sm leading-relaxed">{recipe.extra_items}</Text>
                          </View>

                          {/* Meta Row */}
                          <View className="flex-row justify-between py-4 border-t border-b border-[#F0F0F0] mb-6 px-2">
                            <View className="flex-row items-center">
                              <Text className="mr-1 text-sm">⏱</Text>
                              <Text className="text-[#2C1E16] font-nunito-bold text-sm">{recipe.time}</Text>
                            </View>
                            <View className="w-[1px] bg-[#F0F0F0]" />
                            <View className="flex-row items-center">
                              <Text className="mr-1 text-sm">🍽</Text>
                              <Text className="text-[#2C1E16] font-nunito-bold text-sm">{recipe.servings}</Text>
                            </View>
                            <View className="w-[1px] bg-[#F0F0F0]" />
                            <View className="flex-row items-center">
                              <Text className="mr-1 text-sm">🍃</Text>
                              <Text className="text-[#5C8D42] font-nunito-bold text-sm">{recipe.difficulty}</Text>
                            </View>
                          </View>
                          
                          {/* Watch Tutorial Button */}
                          <TouchableOpacity 
                            onPress={() => Linking.openURL(recipe.youtube_link)}
                            className="flex-row items-center justify-center bg-[#FDF0F0] py-4 rounded-[16px] mb-6"
                          >
                            <Ionicons name="play" size={16} color="#D32F2F" />
                            <Text className="text-[#D32F2F] font-nunito-black text-sm ml-2">Watch Tutorial on YouTube</Text>
                            <Ionicons name="open-outline" size={14} color="#D32F2F" className="ml-2" />
                          </TouchableOpacity>

                          {/* Instructions */}
                          <View className="mb-6">
                            <Text className="text-[#2C1E16] font-nunito-black text-sm mb-4">Instructions:</Text>
                            {recipe.instructions.map((inst: string, i: number) => (
                              <View key={i} className="flex-row mb-4">
                                <View className="w-6 h-6 bg-[#FAF8F1] rounded-full items-center justify-center mr-3 mt-0.5 border border-[#E5E0D8]">
                                  <Text className="text-[#2C1E16] font-nunito-black text-[10px]">{i + 1}</Text>
                                </View>
                                <Text className="flex-1 text-[#2C1E16] font-nunito-regular text-sm leading-relaxed">{inst}</Text>
                              </View>
                            ))}
                          </View>

                          {/* Compost Tip */}
                          <View className="bg-[#F8F5FB] p-5 rounded-[20px] flex-row items-start border border-[#EBE3F2]">
                            <View className="w-10 h-10 bg-white rounded-xl items-center justify-center mr-4 border border-[#EBE3F2]">
                               <Ionicons name="trash-outline" size={20} color="#2C1E16" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-[#4D2A78] font-nunito-black text-sm mb-1">Compost tip:</Text>
                              <Text className="text-[#2C1E16] font-nunito-regular text-xs leading-relaxed">{recipe.compost_tip}</Text>
                            </View>
                          </View>

                          {/* Share Button */}
                          <TouchableOpacity 
                            onPress={() => handleShare(recipe)}
                            className="mt-6 flex-row items-center justify-center bg-[#5C8D42] py-4 rounded-[16px]"
                          >
                            <Ionicons name="share-outline" size={18} color="white" />
                            <Text className="text-white font-nunito-black text-sm ml-2">Share Recipe</Text>
                          </TouchableOpacity>


                        </View>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

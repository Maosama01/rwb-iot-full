import re

with open('/Users/tanishqkhandelwal/.gemini/antigravity-ide/scratch/rwb-iot-backend-dev/mobile/src/screens/LoginScreen.tsx', 'r') as f:
    content = f.read()

# We need to replace the imports to include Animated
new_imports = """import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CountryPicker, { CountryCode, Country } from 'react-native-country-picker-modal';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import Animated, { FadeIn, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing, ZoomIn } from 'react-native-reanimated';
import apiClient from '../api/client';
import { LocationAutocomplete } from '../components/LocationAutocomplete';

// Required for Expo Go auth session redirect
WebBrowser.maybeCompleteAuthSession();

// Replace with your actual Google Cloud OAuth Client IDs
const GOOGLE_WEB_CLIENT_ID = '285619042578-5vmbqaiprrjdol2v9tvaqjp2fklo5skq.apps.googleusercontent.com';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

function AnimatedButton({ onPress, children, className, style, disabled }: any) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <AnimatedTouchableOpacity
      onPressIn={() => { if (!disabled) scale.value = withTiming(0.97, { duration: 100 }) }}
      onPressOut={() => { if (!disabled) scale.value = withTiming(1, { duration: 100 }) }}
      onPress={onPress}
      disabled={disabled}
      className={className}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedTouchableOpacity>
  );
}
"""

# Find the start of export function LoginScreen
start_func_idx = content.find("export function LoginScreen() {")
new_top_half = new_imports + "\n" + content[start_func_idx:]

# Now replace the return statement with our new UI
return_idx = new_top_half.find("  return (")

new_return_block = """  const bgScale = useSharedValue(1);
  useEffect(() => {
    bgScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);
  const bgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bgScale.value }]
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#fdfbf7' }}>
      <Animated.Image 
        source={require('../../assets/premium_garden_compost_bg.png')} 
        style={[{ position: 'absolute', width: '100%', height: '100%', resizeMode: 'cover' }, bgStyle]} 
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
          
          <Animated.View entering={FadeIn.delay(300).duration(1000)} className="items-center mt-16 mb-8 relative">
            <View className="absolute top-0 -left-6 opacity-20">
              <Ionicons name="leaf" size={40} color="#43C400" />
            </View>
            <View className="absolute top-5 right-2 opacity-20">
              <Ionicons name="leaf" size={30} color="#43C400" />
            </View>
            <Image source={require('../../assets/logo.png')} style={{ width: 68, height: 68, resizeMode: 'contain' }} />
            <Text className="text-[#3e2723] font-nunito-black text-4xl tracking-tighter mt-2">RAWBIN</Text>
            <Text className="text-[#43C400] font-nunito-bold text-xs tracking-[0.2em] uppercase mt-1">Smart Composting</Text>
            
            <View className="mt-10 items-center">
              <Text className="text-[#3e2723] font-nunito-black text-3xl">{mode === 'login' ? 'Welcome Back!' : 'Create Account'}</Text>
              <Text className="text-[#8B5E3C] font-nunito-bold text-sm mt-2">{mode === 'login' ? 'Log in to continue your composting journey' : 'Sign up to start your composting journey'}</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500).duration(800).springify()} className="bg-white/95 rounded-[30px] mx-5 p-7 shadow-lg border border-black/5 z-50">
            {/* Google Sign-In Button */}
            <AnimatedButton
              onPress={() => promptAsync()}
              disabled={!request || isGoogleLoading}
              className="flex-row items-center justify-center bg-white rounded-[18px] h-[56px] mb-4 shadow-sm border border-gray-100"
              style={{ opacity: (!request || isGoogleLoading) ? 0.5 : 1, elevation: 2 }}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#3e2723" />
              ) : (
                <>
                  <Image
                    source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                    style={{ width: 22, height: 22, marginRight: 12 }}
                  />
                  <Text className="text-[#3e2723] font-nunito-bold text-[16px]">Continue with Google</Text>
                </>
              )}
            </AnimatedButton>

            {/* Apple Sign-In Button */}
            {Platform.OS === 'ios' && (
              <AnimatedButton
                onPress={handleAppleLogin}
                disabled={isAppleLoading}
                className="flex-row items-center justify-center bg-black rounded-[18px] h-[56px] mb-6 shadow-md"
                style={{ opacity: isAppleLoading ? 0.5 : 1, elevation: 3 }}
              >
                {isAppleLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={22} color="#ffffff" style={{ marginRight: 10, marginTop: -2 }} />
                    <Text className="text-white font-nunito-bold text-[16px]">Continue with Apple</Text>
                  </>
                )}
              </AnimatedButton>
            )}

            {/* Divider */}
            <View className="flex-row items-center justify-center mb-6">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="text-gray-400 font-nunito-bold text-xs mx-4 tracking-widest uppercase">or</Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            {errorMsg ? (
              <Animated.View entering={ZoomIn} className="bg-[#FFE5E5] p-3 rounded-xl mb-4 border border-red-200">
                <Text className="text-red-600 font-nunito-bold text-xs">{errorMsg}</Text>
              </Animated.View>
            ) : null}

            {mode === 'signup' && (
              <>
                <View className="mb-4">
                  <Text className="text-[#43C400] font-nunito-bold text-[10px] tracking-wider uppercase ml-1 mb-2">Username</Text>
                  <View className="bg-white rounded-[18px] px-4 h-[56px] border border-gray-200 flex-row items-center">
                    <Ionicons name="person-outline" size={20} color="#8B5E3C" />
                    <TextInput 
                      className="flex-1 ml-3 text-[#3e2723] font-nunito-bold text-base h-full"
                      placeholder="e.g. Alice"
                      placeholderTextColor="#a69d92"
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCapitalize="none"
                    />
                  </View>
                </View>
                
                <LocationAutocomplete 
                  country={country}
                  setCountry={setCountry}
                  state={state}
                  setState={setState}
                  city={city}
                  setCity={setCity}
                />
                
                <View className="mb-4 mt-2">
                  <Text className="text-[#43C400] font-nunito-bold text-[10px] tracking-wider uppercase ml-1 mb-2">Phone Number</Text>
                  <View className="bg-white rounded-[18px] px-4 h-[56px] border border-gray-200 flex-row items-center">
                    <CountryPicker
                      countryCode={countryCode}
                      withFilter
                      withFlag
                      withCallingCode
                      withCallingCodeButton
                      onSelect={onSelectCountry}
                      containerButtonStyle={{ marginRight: 8 }}
                    />
                    <TextInput 
                      className="flex-1 text-[#3e2723] font-nunito-bold text-base h-full"
                      placeholder="9876543210"
                      placeholderTextColor="#a69d92"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </>
            )}

            {(mode === 'signup' || (mode === 'login' && loginMethod === 'email')) && (
              <>
                <View className="mb-5">
                  <Text className="text-[#43C400] font-nunito-bold text-[10px] tracking-wider uppercase ml-1 mb-2">Email Address</Text>
                  <View className="bg-white rounded-[18px] px-4 h-[56px] border border-gray-200 flex-row items-center">
                    <Ionicons name="mail-outline" size={20} color="#8B5E3C" />
                    <TextInput 
                      className="flex-1 ml-3 text-[#3e2723] font-nunito-bold text-base h-full"
                      placeholder="hello@example.com"
                      placeholderTextColor="#a69d92"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View className="mb-2">
                  <Text className="text-[#43C400] font-nunito-bold text-[10px] tracking-wider uppercase ml-1 mb-2">Password</Text>
                  <View className="bg-white rounded-[18px] px-4 h-[56px] border border-gray-200 flex-row items-center">
                    <Ionicons name="lock-closed-outline" size={20} color="#8B5E3C" />
                    <TextInput 
                      className="flex-1 ml-3 text-[#3e2723] font-nunito-bold text-base h-full"
                      placeholder="Enter your password"
                      placeholderTextColor="#a69d92"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2 -mr-2">
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#8B5E3C" />
                    </TouchableOpacity>
                  </View>
                </View>

                {mode === 'login' && (
                  <TouchableOpacity className="self-end mb-6 mt-2">
                    <Text className="text-[#43C400] font-nunito-bold text-[11px]">Forgot Password?</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {mode === 'login' && loginMethod === 'otp' && (
              <>
                <View className="mb-4">
                  <Text className="text-[#43C400] font-nunito-bold text-[10px] tracking-wider uppercase ml-1 mb-2">Phone Number</Text>
                  <View className="bg-white rounded-[18px] px-4 h-[56px] border border-gray-200 flex-row items-center">
                    <CountryPicker
                      countryCode={countryCode}
                      withFilter
                      withFlag
                      withCallingCode
                      withCallingCodeButton
                      onSelect={onSelectCountry}
                      containerButtonStyle={{ marginRight: 8 }}
                    />
                    <TextInput 
                      className="flex-1 text-[#3e2723] font-nunito-bold text-base h-full"
                      placeholder="9876543210"
                      placeholderTextColor="#a69d92"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      editable={!otpSent}
                    />
                  </View>
                </View>

                {otpSent && (
                  <View className="mb-6 mt-2">
                    <Text className="text-[#43C400] font-nunito-bold text-[10px] tracking-wider uppercase ml-1 mb-3">6-Digit Code</Text>
                    
                    <View className="relative w-full flex-row justify-between h-[56px]">
                      {/* 6 Visual Boxes */}
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <View 
                          key={index} 
                          className={`w-[14%] h-full bg-white rounded-2xl border items-center justify-center shadow-sm ${
                            otpCode.length === index ? 'border-[#43C400]' : 'border-gray-200'
                          }`}
                        >
                          <Text className="text-[#3e2723] font-nunito-black text-xl">
                            {otpCode[index] || ''}
                          </Text>
                        </View>
                      ))}

                      {/* Hidden Actual Input */}
                      <TextInput 
                        className="absolute inset-0 w-full h-full opacity-0"
                        value={otpCode}
                        onChangeText={setOtpCode}
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus={true}
                      />
                    </View>
                  </View>
                )}
              </>
            )}

            {mode === 'signup' && (
              <View className="mb-6 mt-4">
                <Text className="text-[#43C400] font-nunito-bold text-[10px] tracking-wider uppercase ml-1 mb-2">Confirm Password</Text>
                <View className="bg-white rounded-[18px] px-4 h-[56px] border border-gray-200 flex-row items-center">
                  <Ionicons name="lock-closed-outline" size={20} color="#8B5E3C" />
                  <TextInput 
                    className="flex-1 ml-3 text-[#3e2723] font-nunito-bold text-base h-full"
                    placeholder="••••••••"
                    placeholderTextColor="#a69d92"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>
              </View>
            )}

            <AnimatedButton 
              onPress={() => {
                if (mode === 'signup') return handleSubmit();
                if (loginMethod === 'email') return handleSubmit();
                if (loginMethod === 'otp') {
                  if (otpSent) return handleVerifyOTP();
                  return handleRequestOTP();
                }
              }}
              className="bg-[#43C400] rounded-[18px] h-[58px] flex-row justify-center items-center shadow-md mb-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="leaf" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text className="text-white font-nunito-bold text-[17px]">
                    {mode === 'signup' 
                      ? 'Sign Up' 
                      : loginMethod === 'email' 
                        ? 'Sign In' 
                        : (otpSent ? 'Verify Code' : 'Send Code')}
                  </Text>
                </>
              )}
            </AnimatedButton>
            
            {mode === 'login' && (
              <AnimatedButton 
                className="bg-transparent border-2 border-gray-100 rounded-[18px] h-[58px] flex-row justify-center items-center mb-6"
                onPress={() => {
                  setLoginMethod(loginMethod === 'email' ? 'otp' : 'email');
                  setErrorMsg('');
                }}
              >
                <Ionicons name={loginMethod === 'email' ? "call-outline" : "mail-outline"} size={18} color="#8B5E3C" style={{ marginRight: 8 }} />
                <Text className="text-[#8B5E3C] font-nunito-bold text-[15px]">
                  {loginMethod === 'email' ? 'Login with OTP instead' : 'Login with Email instead'}
                </Text>
              </AnimatedButton>
            )}

            <TouchableOpacity 
              className="items-center mt-2 mb-2" 
              onPress={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setErrorMsg('');
              }}
            >
              <Text className="text-gray-500 font-nunito-bold text-[13px]">
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "} 
                <Text className="text-[#43C400] font-nunito-black underline">
                  {mode === 'login' ? 'Sign Up' : 'Log In'}
                </Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Bottom Infographic (Only on Login to keep signup clean) */}
          {mode === 'login' && (
            <Animated.View entering={ZoomIn.delay(800).duration(800)} className="flex-row justify-between px-6 mt-16 mb-10 z-10">
               {/* Step 1 */}
               <View className="items-center w-[22%]">
                  <View className="bg-white/95 w-14 h-14 rounded-[18px] items-center justify-center mb-3 shadow-lg border border-white/50">
                     <Ionicons name="restaurant-outline" size={24} color="#43C400" />
                  </View>
                  <Text className="text-white font-nunito-black text-[9px] uppercase text-center mb-1 drop-shadow-md">Step 1</Text>
                  <Text className="text-white font-nunito-bold text-[10px] text-center leading-tight drop-shadow-md">Add Leftover{'\n'}Food</Text>
               </View>
               
               <View className="justify-center -mt-10">
                  <Text className="text-white/90 text-xs font-bold drop-shadow-md">--{">"}</Text>
               </View>

               {/* Step 2 */}
               <View className="items-center w-[22%]">
                  <View className="bg-white/95 w-14 h-14 rounded-[18px] items-center justify-center mb-3 shadow-lg border border-white/50">
                     <Ionicons name="cog-outline" size={24} color="#43C400" />
                  </View>
                  <Text className="text-white font-nunito-black text-[9px] uppercase text-center mb-1 drop-shadow-md">Step 2</Text>
                  <Text className="text-white font-nunito-bold text-[10px] text-center leading-tight drop-shadow-md">Rawbin Works{'\n'}Its Magic</Text>
               </View>
               
               <View className="justify-center -mt-10">
                  <Text className="text-white/90 text-xs font-bold drop-shadow-md">--{">"}</Text>
               </View>

               {/* Step 3 */}
               <View className="items-center w-[22%]">
                  <View className="bg-white/95 w-14 h-14 rounded-[18px] items-center justify-center mb-3 shadow-lg border border-white/50">
                     <Ionicons name="flower-outline" size={24} color="#43C400" />
                  </View>
                  <Text className="text-white font-nunito-black text-[9px] uppercase text-center mb-1 drop-shadow-md">Step 3</Text>
                  <Text className="text-white font-nunito-bold text-[10px] text-center leading-tight drop-shadow-md">Get Nutrient-{'\n'}Rich Manure</Text>
               </View>

               <View className="justify-center -mt-10">
                  <Text className="text-white/90 text-xs font-bold drop-shadow-md">--{">"}</Text>
               </View>

               {/* Step 4 */}
               <View className="items-center w-[22%]">
                  <View className="bg-white/95 w-14 h-14 rounded-[18px] items-center justify-center mb-3 shadow-lg border border-white/50">
                     <Ionicons name="leaf-outline" size={24} color="#43C400" />
                  </View>
                  <Text className="text-white font-nunito-black text-[9px] uppercase text-center mb-1 drop-shadow-md">Step 4</Text>
                  <Text className="text-white font-nunito-bold text-[10px] text-center leading-tight drop-shadow-md">Grow Healthy{'\n'}Plants</Text>
               </View>
            </Animated.View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
"""

final_content = new_top_half[:return_idx] + new_return_block
with open('/Users/tanishqkhandelwal/.gemini/antigravity-ide/scratch/rwb-iot-backend-dev/mobile/src/screens/LoginScreen.tsx', 'w') as f:
    f.write(final_content)

print("SUCCESS")

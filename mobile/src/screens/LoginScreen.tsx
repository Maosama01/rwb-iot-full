import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ImageBackground, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CountryPicker, { CountryCode, Country } from 'react-native-country-picker-modal';
import apiClient from '../api/client';
import { LocationAutocomplete } from '../components/LocationAutocomplete';

export function LoginScreen() {
  const navigation = useNavigation<any>();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginMethod, setLoginMethod] = useState<'email' | 'otp'>('email');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  const [countryCode, setCountryCode] = useState<CountryCode>('IN');
  const [callingCode, setCallingCode] = useState('91');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      let accessToken = '';
      let refreshToken = '';

      if (mode === 'login') {
        const response = await apiClient.post('/auth/login', {
          email,
          password,
        });
        accessToken = response.data.access_token;
        refreshToken = response.data.refresh_token;
      } else {
        if (password !== confirmPassword) {
          setErrorMsg("Passwords do not match");
          setIsLoading(false);
          return;
        }

        const formattedPhone = `+${callingCode}${phone.replace(/[^0-9]/g, '')}`;
        const finalLocation = [city, state, country].filter(Boolean).join(', ');
        
        const response = await apiClient.post('/auth/register', {
          email,
          password,
          display_name: displayName,
          phone: formattedPhone,
          location: finalLocation || undefined,
        });
        accessToken = response.data.tokens.access_token;
        refreshToken = response.data.tokens.refresh_token;
      }

      await AsyncStorage.setItem('access_token', accessToken);
      await AsyncStorage.setItem('refresh_token', refreshToken);
      
      // Fetch user profile to check if setup is needed
      const userResponse = await apiClient.get('/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const user = userResponse.data;
      
      setIsLoading(false);
      
      if (!user.placement || !user.diet_type) {
        navigation.replace('Setup');
      } else {
        navigation.replace('MainApp');
      }
    } catch (error: any) {
      setIsLoading(false);
      const message = error.response?.data?.detail || 'An unexpected error occurred. Please try again.';
      setErrorMsg(message);
    }
  };

  const handleRequestOTP = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const formattedPhone = `+${callingCode}${phone.replace(/[^0-9]/g, '')}`;
      await apiClient.post('/auth/otp/request', { phone: formattedPhone });
      setOtpSent(true);
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      setErrorMsg(error.response?.data?.detail || 'Failed to send OTP.');
    }
  };

  const handleVerifyOTP = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const formattedPhone = `+${callingCode}${phone.replace(/[^0-9]/g, '')}`;
      const response = await apiClient.post('/auth/otp/verify', {
        phone: formattedPhone,
        code: otpCode
      });
      const { access_token, refresh_token } = response.data;
      await AsyncStorage.setItem('access_token', access_token);
      await AsyncStorage.setItem('refresh_token', refresh_token);
      
      // Fetch user profile to check if setup is needed
      const userResponse = await apiClient.get('/users/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      const user = userResponse.data;
      
      setIsLoading(false);
      
      if (!user.placement || !user.diet_type) {
        navigation.replace('Setup');
      } else {
        navigation.replace('MainApp');
      }
    } catch (error: any) {
      setIsLoading(false);
      setErrorMsg(error.response?.data?.detail || 'Invalid or expired OTP code.');
    }
  };

  const onSelectCountry = (countryModal: Country) => {
    setCountryCode(countryModal.cca2);
    setCallingCode(countryModal.callingCode[0]);
  };

  return (
    <ImageBackground 
      source={require('../../assets/dashboard_bg.png')} 
      style={{ flex: 1 }}
      imageStyle={{ opacity: 0.35, resizeMode: 'cover' }}
    >
      <View className="flex-1 bg-rawbin-bg/70 justify-center">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-center">
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 32, paddingVertical: 40, flexGrow: 1, justifyContent: 'center' }}>
            
            <View className="items-center mb-8 mt-4">
              <View className="bg-white/80 p-2 rounded-full mb-3 shadow-sm border border-[rgba(0,0,0,0.06)]">
                <Image source={require('../../assets/logo.png')} style={{ width: 44, height: 44, resizeMode: 'contain' }} />
              </View>
              <Text className="text-rawbin-text font-nunito-black text-3xl tracking-tight">RAWBIN</Text>
              <Text className="text-rawbin-subtext font-nunito-bold text-xs tracking-widest uppercase mt-1">Smart Composting</Text>
            </View>

            <View className="bg-white/80 rounded-[24px] p-6 shadow-sm border border-black/5 z-50">
              <Text className="text-rawbin-text font-nunito-bold text-xl mb-4">{mode === 'login' ? 'Welcome back' : 'Create an Account'}</Text>

              {errorMsg ? (
                <View className="bg-[#FFE5E5] p-3 rounded-[12px] mb-4 border border-rawbin-error/20">
                  <Text className="text-rawbin-error font-nunito-bold text-xs">{errorMsg}</Text>
                </View>
              ) : null}

              {mode === 'signup' && (
                <>
                  <View className="mb-4">
                    <Text className="text-rawbin-text font-nunito-bold text-xs uppercase ml-1 mb-2">Username</Text>
                    <View className="bg-rawbin-card rounded-[16px] px-4 py-3 border border-[rgba(0,0,0,0.06)] flex-row items-center shadow-inner">
                      <Ionicons name="person-outline" size={20} color="#744107" />
                      <TextInput 
                        className="flex-1 ml-3 text-rawbin-text font-nunito-bold"
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
                  
                  <View className="mb-4">
                    <Text className="text-rawbin-text font-nunito-bold text-xs uppercase ml-1 mb-2">Phone Number</Text>
                    <View className="bg-rawbin-card rounded-[16px] px-4 py-3 border border-[rgba(0,0,0,0.06)] flex-row items-center shadow-inner">
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
                        className="flex-1 text-rawbin-text font-nunito-bold"
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
                  <View className="mb-4">
                    <Text className="text-rawbin-text font-nunito-bold text-xs uppercase ml-1 mb-2">Email Address</Text>
                    <View className="bg-rawbin-card rounded-[16px] px-4 py-3 border border-[rgba(0,0,0,0.06)] flex-row items-center shadow-inner">
                      <Ionicons name="mail-outline" size={20} color="#744107" />
                      <TextInput 
                        className="flex-1 ml-3 text-rawbin-text font-nunito-bold"
                        placeholder="hello@example.com"
                        placeholderTextColor="#a69d92"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>

                  <View className="mb-6">
                    <Text className="text-rawbin-text font-nunito-bold text-xs uppercase ml-1 mb-2">Password</Text>
                    <View className="bg-rawbin-card rounded-[16px] px-4 py-3 border border-[rgba(0,0,0,0.06)] flex-row items-center shadow-inner">
                      <Ionicons name="lock-closed-outline" size={20} color="#744107" />
                      <TextInput 
                        className="flex-1 ml-3 text-rawbin-text font-nunito-bold"
                        placeholder="••••••••"
                        placeholderTextColor="#a69d92"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                      />
                    </View>
                  </View>
                </>
              )}

              {mode === 'login' && loginMethod === 'otp' && (
                <>
                  <View className="mb-4">
                    <Text className="text-rawbin-text font-nunito-bold text-xs uppercase ml-1 mb-2">Phone Number</Text>
                    <View className="bg-rawbin-card rounded-[16px] px-4 py-3 border border-[rgba(0,0,0,0.06)] flex-row items-center shadow-inner">
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
                        className="flex-1 text-rawbin-text font-nunito-bold"
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
                    <View className="mb-6">
                      <Text className="text-rawbin-text font-nunito-bold text-xs uppercase ml-1 mb-3">6-Digit Code</Text>
                      
                      <View className="relative w-full flex-row justify-between h-14">
                        {/* 6 Visual Boxes */}
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <View 
                            key={index} 
                            className={`w-[14%] h-full bg-rawbin-card rounded-xl border items-center justify-center shadow-inner ${
                              otpCode.length === index ? 'border-rawbin-subtext bg-white' : 'border-[rgba(0,0,0,0.06)]'
                            }`}
                          >
                            <Text className="text-rawbin-text font-nunito-black text-xl">
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
                <View className="mb-6">
                  <Text className="text-rawbin-text font-nunito-bold text-xs uppercase ml-1 mb-2">Confirm Password</Text>
                  <View className="bg-rawbin-card rounded-[16px] px-4 py-3 border border-[rgba(0,0,0,0.06)] flex-row items-center shadow-inner">
                    <Ionicons name="lock-closed-outline" size={20} color="#744107" />
                    <TextInput 
                      className="flex-1 ml-3 text-rawbin-text font-nunito-bold"
                      placeholder="••••••••"
                      placeholderTextColor="#a69d92"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity 
                onPress={() => {
                  if (mode === 'signup') return handleSubmit();
                  if (loginMethod === 'email') return handleSubmit();
                  if (loginMethod === 'otp') {
                    if (otpSent) return handleVerifyOTP();
                    return handleRequestOTP();
                  }
                }}
                className="bg-rawbin-primary rounded-[16px] py-4 items-center shadow-sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff9e7" />
                ) : (
                  <Text className="text-white font-nunito-black text-lg">
                    {mode === 'signup' 
                      ? 'Sign Up' 
                      : loginMethod === 'email' 
                        ? 'Sign In' 
                        : (otpSent ? 'Verify Code' : 'Send Code')}
                  </Text>
                )}
              </TouchableOpacity>
              
              {mode === 'login' && (
                <TouchableOpacity 
                  className="mt-4 items-center" 
                  onPress={() => {
                    setLoginMethod(loginMethod === 'email' ? 'otp' : 'email');
                    setErrorMsg('');
                  }}
                >
                  <Text className="text-rawbin-subtext font-nunito-bold text-sm underline">
                    {loginMethod === 'email' ? 'Login with OTP instead' : 'Login with Email instead'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                className="mt-6 items-center" 
                onPress={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setErrorMsg('');
                }}
              >
                <Text className="text-rawbin-subtext font-nunito-bold text-xs">
                  {mode === 'login' ? "Don't have an account? " : "Already have an account? "} 
                  <Text className="text-rawbin-text underline">
                    {mode === 'login' ? 'Sign Up' : 'Log In'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, StyleSheet, Pressable } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CountryPicker, { CountryCode, Country } from 'react-native-country-picker-modal';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import Animated, { FadeIn, FadeInUp, SlideInDown, ZoomIn, useSharedValue, useAnimatedStyle, withTiming, Easing, withSpring, interpolateColor, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Location from 'expo-location';
import apiClient from '../api/client';
import { LocationAutocomplete } from '../components/LocationAutocomplete';

// Required for Expo Go auth session redirect
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = '285619042578-5vmbqaiprrjdol2v9tvaqjp2fklo5skq.apps.googleusercontent.com';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function InteractiveButton({ onPress, children, style, disabled, type }: any) {
  const isPressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(isPressed.value, [0, 1], [1, 0.96]);
    
    const shadowOpacity = type === 'primary' 
      ? interpolate(isPressed.value, [0, 1], [0.12, 0.05])
      : type === 'apple' ? interpolate(isPressed.value, [0, 1], [0.08, 0.04]) : 0;
      
    const shadowRadius = type === 'primary' 
      ? interpolate(isPressed.value, [0, 1], [8, 4])
      : type === 'apple' ? interpolate(isPressed.value, [0, 1], [6, 3]) : 0;
      
    const translateY = interpolate(isPressed.value, [0, 1], [0, 1]); 

    let backgroundColor;
    if (type === 'google') {
      backgroundColor = interpolateColor(isPressed.value, [0, 1], ['#FFFFFF', '#F8F8F8']);
    } else if (type === 'apple') {
      backgroundColor = interpolateColor(isPressed.value, [0, 1], ['#000000', '#1A1A1A']);
    }

    return {
      transform: [{ scale }, { translateY }],
      ...(type === 'primary' ? { shadowOpacity, shadowRadius } : {}),
      ...(type === 'google' || type === 'apple' ? { backgroundColor, shadowOpacity, shadowRadius } : {})
    };
  });

  return (
    <AnimatedPressable
      onPressIn={() => { if (!disabled) isPressed.value = withSpring(1, { damping: 12, stiffness: 300 }) }}
      onPressOut={() => { if (!disabled) isPressed.value = withSpring(0, { damping: 12, stiffness: 300 }) }}
      onPress={onPress}
      disabled={disabled}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

function PasswordRequirements({ password }: { password: string }) {
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  let strength = 0;
  if (hasLength) strength++;
  if (hasUpper) strength++;
  if (hasNumber) strength++;
  if (hasSpecial) strength++;

  const strengthLabel = strength < 2 ? 'Weak' : strength < 4 ? 'Medium' : 'Strong';
  const strengthColor = strength < 2 ? '#FF4B4B' : strength < 4 ? '#FFB800' : '#45C400';
  
  return (
    <View style={{ marginTop: 12, paddingHorizontal: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 12, color: strengthColor }}>{password ? strengthLabel : ''}</Text>
        <View style={{ flexDirection: 'row', flex: 1, marginLeft: 12, gap: 4 }}>
          <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: strength >= 1 ? strengthColor : '#E0E0E0' }} />
          <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: strength >= 2 ? strengthColor : '#E0E0E0' }} />
          <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: strength >= 3 ? strengthColor : '#E0E0E0' }} />
          <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: strength >= 4 ? strengthColor : '#E0E0E0' }} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <ReqItem met={hasLength} text="8+ characters" />
        <ReqItem met={hasUpper} text="One uppercase" />
        <ReqItem met={hasNumber} text="One number" />
        <ReqItem met={hasSpecial} text="One special" />
      </View>
    </View>
  );
}

function ReqItem({ met, text }: { met: boolean, text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', width: '45%' }}>
      <Feather name={met ? "check-circle" : "circle"} size={12} color={met ? "#45C400" : "#B0B0B0"} style={{ marginRight: 6 }} />
      <Text style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: met ? '#1F1F1F' : '#A0A0A0' }}>{text}</Text>
    </View>
  );
}

function CustomInput({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, showToggle, onToggle, editable = true, leftComponent, rightComponent, textContentType }: any) {
  const [isFocused, setIsFocused] = useState(false);
  const labelPosition = useSharedValue(value ? 1 : 0);
  const focusAnim = useSharedValue(0);

  useEffect(() => {
    labelPosition.value = withTiming(isFocused || value ? 1 : 0, { duration: 150, easing: Easing.out(Easing.ease) });
    focusAnim.value = withTiming(isFocused ? 1 : 0, { duration: 150, easing: Easing.out(Easing.ease) });
  }, [isFocused, value]);

  const labelStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: labelPosition.value * -12 },
        { scale: 1 - labelPosition.value * 0.2 } 
      ],
      opacity: labelPosition.value * 0.4 + 0.6,
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(focusAnim.value, [0, 1], ['#EFEFEF', '#45C400']),
      borderWidth: interpolate(focusAnim.value, [0, 1], [1, 2]),
      backgroundColor: interpolateColor(focusAnim.value, [0, 1], ['#FAFAFA', '#FFFFFF']),
      shadowColor: '#45C400',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: focusAnim.value * 0.08,
      shadowRadius: focusAnim.value * 8,
      elevation: focusAnim.value * 2, 
    };
  });

  return (
    <Animated.View style={[styles.inputContainer, containerStyle]}>
      {leftComponent ? leftComponent : null}
      
      {icon && !leftComponent && (
        <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name={icon} size={18} color={isFocused ? "#45C400" : "#B0B0B0"} />
        </View>
      )}
      
      <View style={{ flex: 1, marginLeft: leftComponent ? 4 : 8, justifyContent: 'center', height: '100%' }}>
        <Animated.Text 
          pointerEvents="none" 
          style={[styles.floatingLabel, labelStyle, { color: isFocused ? '#45C400' : '#A0A0A0' }]}
        >
          {placeholder}
        </Animated.Text>
        <TextInput 
          style={styles.inputText}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={editable}
          selectTextOnFocus
          placeholderTextColor="transparent"
          textContentType={textContentType}
        />
      </View>
      
      {showToggle && (
        <TouchableOpacity onPress={onToggle} style={{ padding: 8, marginRight: -4, justifyContent: 'center' }}>
          <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={{ position: 'absolute', opacity: secureTextEntry ? 1 : 0 }}>
              <Feather name="eye" size={18} color={isFocused ? "#45C400" : "#B0B0B0"} />
            </Animated.View>
            <Animated.View style={{ position: 'absolute', opacity: !secureTextEntry ? 1 : 0 }}>
              <Feather name="eye-off" size={18} color={isFocused ? "#45C400" : "#B0B0B0"} />
            </Animated.View>
          </View>
        </TouchableOpacity>
      )}

      {rightComponent && (
        <View style={{ paddingHorizontal: 8, height: '100%', justifyContent: 'center', marginRight: -4 }}>
          {rightComponent}
        </View>
      )}
    </Animated.View>
  );
}

// Helper to extract string error from FastAPI responses
const extractError = (err: any, defaultMsg: string) => {
  const detail = err?.response?.data?.detail;
  if (Array.isArray(detail)) return detail.map((d: any) => d.msg).join(', ');
  if (typeof detail === 'string') return detail;
  if (err?.message) return err.message;
  return defaultMsg;
};

export function LoginScreen() {
  const navigation = useNavigation<any>();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
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
  const [isLocating, setIsLocating] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const locationString = [city, state, country].filter(Boolean).join(', ');

  const handleGetLocation = async () => {
    setIsLocating(true);
    setErrorMsg('');
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission denied.');
        setIsLocating(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        setCity(place.city || place.subregion || '');
        setState(place.region || '');
        setCountry(place.country || '');
      } else {
        setErrorMsg('Could not determine location.');
      }
    } catch (err) {
      console.log('Location error:', err);
      setErrorMsg('Error fetching location.');
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    async function checkApple() {
      const available = await AppleAuthentication.isAvailableAsync();
      setIsAppleAvailable(available);
    }
    checkApple();
  }, []);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_WEB_CLIENT_ID,
    redirectUri: 'https://auth.expo.io/@tanishq041/mobile',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleLogin(id_token);
    } else if (response?.type === 'error') {
      setErrorMsg('Google Sign-In was cancelled or failed.');
    }
  }, [response]);

  const handleGoogleLogin = async (idToken: string) => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.post('/auth/social/google', { id_token: idToken });
      await AsyncStorage.setItem('access_token', res.data.access_token);
      await AsyncStorage.setItem('refresh_token', res.data.refresh_token);
      
      const userResponse = await apiClient.get('/users/me', {
        headers: { Authorization: `Bearer ${res.data.access_token}` },
      });
      if (!userResponse.data.placement || !userResponse.data.diet_type) {
        navigation.replace('Setup');
      } else {
        navigation.replace('MainApp');
      }
    } catch (error: any) {
      setErrorMsg(extractError(error, 'Google Sign-In failed.'));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsAppleLoading(true);
    setErrorMsg('');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('Failed to get token');
      
      const res = await apiClient.post('/auth/social/apple', {
        id_token: credential.identityToken,
        first_name: credential.fullName?.givenName,
        last_name: credential.fullName?.familyName,
      });

      await AsyncStorage.setItem('access_token', res.data.access_token);
      await AsyncStorage.setItem('refresh_token', res.data.refresh_token);

      const userResponse = await apiClient.get('/users/me', {
        headers: { Authorization: `Bearer ${res.data.access_token}` },
      });
      if (!userResponse.data.placement || !userResponse.data.diet_type) {
        navigation.replace('Setup');
      } else {
        navigation.replace('MainApp');
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        setErrorMsg(extractError(e, 'Apple Sign-In failed.'));
      }
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      let accessToken, refreshToken;
      if (mode === 'login') {
        const response = await apiClient.post('/auth/login', { email, password });
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
          email, password, display_name: displayName, phone: formattedPhone, location: finalLocation || undefined,
        });
        accessToken = response.data.tokens.access_token;
        refreshToken = response.data.tokens.refresh_token;
      }

      await AsyncStorage.setItem('access_token', accessToken);
      await AsyncStorage.setItem('refresh_token', refreshToken);
      
      const userResponse = await apiClient.get('/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setIsLoading(false);
      if (!userResponse.data.placement || !userResponse.data.diet_type) {
        navigation.replace('Setup');
      } else {
        navigation.replace('MainApp');
      }
    } catch (error: any) {
      setIsLoading(false);
      setErrorMsg(extractError(error, 'An unexpected error occurred.'));
    }
  };

  const handleRequestOTP = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const formattedPhone = `+${callingCode}${phone.replace(/[^0-9]/g, '')}`;
      await apiClient.post('/auth/otp/request', { phone: formattedPhone });
      setOtpSent(true);
    } catch (error: any) {
      setErrorMsg(extractError(error, 'Failed to send OTP.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const formattedPhone = `+${callingCode}${phone.replace(/[^0-9]/g, '')}`;
      const response = await apiClient.post('/auth/otp/verify', { phone: formattedPhone, code: otpCode });
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('refresh_token', response.data.refresh_token);
      
      const userResponse = await apiClient.get('/users/me', {
        headers: { Authorization: `Bearer ${response.data.access_token}` }
      });
      setIsLoading(false);
      if (!userResponse.data.placement || !userResponse.data.diet_type) {
        navigation.replace('Setup');
      } else {
        navigation.replace('MainApp');
      }
    } catch (error: any) {
      setIsLoading(false);
      setErrorMsg(extractError(error, 'Invalid or expired OTP code.'));
    }
  };

  const onSelectCountry = (countryModal: Country) => {
    setCountryCode(countryModal.cca2);
    setCallingCode(countryModal.callingCode[0]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF8F2' }}>
      
      {/* Background Leaves from Image Reference */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width={300} height={300} style={{ position: 'absolute', top: -50, left: -100 }} opacity={0.6}>
          <Path 
            d="M100 50 C200 50 300 150 250 250 C150 250 50 150 100 50 Z" 
            fill="#EAF4E8" 
          />
          <Path 
            d="M100 50 C150 100 200 150 250 250" 
            stroke="#FFFFFF" 
            strokeWidth={2} 
            fill="none" 
          />
        </Svg>

        <Svg width={250} height={350} style={{ position: 'absolute', bottom: -50, right: -50 }} opacity={0.4}>
          <Path 
            d="M150 350 C100 250 50 150 100 50 C200 100 250 200 150 350 Z" 
            stroke="#D8EAD6" 
            strokeWidth={4} 
            fill="none" 
          />
          <Path d="M100 50 C120 150 135 250 150 350" stroke="#D8EAD6" strokeWidth={3} fill="none" />
          <Path d="M125 200 C150 220 180 230 200 230" stroke="#D8EAD6" strokeWidth={2} fill="none" />
          <Path d="M115 120 C130 140 160 150 180 150" stroke="#D8EAD6" strokeWidth={2} fill="none" />
        </Svg>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          
          <View style={styles.headerContainer}>
            <Animated.View entering={ZoomIn.delay(0).duration(200).springify()}>
              <Image source={require('../../assets/logo.png')} style={{ width: 56, height: 56, resizeMode: 'contain', marginBottom: 12, transform: [{ translateX: 6 }] }} />
            </Animated.View>
            <Animated.Text entering={FadeIn.delay(50).duration(200)} style={styles.brandName}>RAWBIN</Animated.Text>
            <Animated.Text entering={FadeIn.delay(100).duration(200)} style={styles.brandSubtitle}>
              COOK · EAT · COMPOST
            </Animated.Text>
          </View>

          <Animated.View entering={SlideInDown.delay(250).springify().mass(0.8).damping(14).stiffness(100)} style={styles.card}>
            
            {mode === 'login' ? (
              <Text style={styles.welcomeTitleCard}>Welcome</Text>
            ) : (
              <View style={{ marginBottom: 24, position: 'relative' }}>
                {signupStep === 2 && (
                  <Animated.View entering={FadeIn}>
                    <TouchableOpacity 
                      onPress={() => setSignupStep(1)}
                      style={{ position: 'absolute', left: -16, top: 4, zIndex: 10, padding: 8 }}
                    >
                      <Feather name="arrow-left" size={24} color="#1F1F1F" />
                    </TouchableOpacity>
                  </Animated.View>
                )}
                <Text style={[styles.welcomeTitleCard, { fontSize: 30, marginBottom: 8 }]}>
                  Create your account
                </Text>
                <Text style={{ textAlign: 'center', color: '#777777', fontFamily: 'Nunito_500Medium', fontSize: 15 }}>
                  Start your smart composting journey.
                </Text>
              </View>
            )}

            <View style={{ marginBottom: 24 }}>
              <InteractiveButton type="google" onPress={() => promptAsync()} disabled={!request || isGoogleLoading} style={[styles.socialBtn, styles.googleBtn]}>
                {isGoogleLoading ? <ActivityIndicator color="#1F1F1F" /> : (
                  <>
                    <Image source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }} style={{ width: 22, height: 22, marginRight: 10 }} />
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                  </>
                )}
              </InteractiveButton>

              {Platform.OS === 'ios' && (
                <InteractiveButton type="apple" onPress={handleAppleLogin} disabled={isAppleLoading} style={[styles.socialBtn, styles.appleBtn]}>
                  {isAppleLoading ? <ActivityIndicator color="#ffffff" /> : (
                    <>
                      <Ionicons name="logo-apple" size={20} color="#ffffff" style={{ marginRight: 8, marginTop: -2 }} />
                      <Text style={styles.appleBtnText}>Continue with Apple</Text>
                    </>
                  )}
                </InteractiveButton>
              )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingHorizontal: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#F0F0F0' }} />
              <Text style={{ color: '#A3A3A3', fontFamily: 'Nunito_600SemiBold', fontSize: 11, marginHorizontal: 12, textTransform: 'uppercase' }}>or</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#F0F0F0' }} />
            </View>

            {errorMsg ? (
              <Animated.View entering={ZoomIn} style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </Animated.View>
            ) : null}

            {mode === 'signup' ? (
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
                  <View style={{ width: 30, height: 4, borderRadius: 2, backgroundColor: signupStep === 1 ? '#45C400' : '#E0E0E0' }} />
                  <View style={{ width: 4 }} />
                  <View style={{ width: 30, height: 4, borderRadius: 2, backgroundColor: signupStep === 2 ? '#45C400' : '#E0E0E0' }} />
                </View>

                {signupStep === 1 ? (
                  <Animated.View entering={FadeIn}>
                    <View style={{ marginBottom: 16 }}>
                      <CustomInput icon="user" placeholder="Full Name" value={displayName} onChangeText={setDisplayName} textContentType="name" autoCapitalize="words" />
                    </View>
                    <View style={{ marginBottom: 16 }}>
                      <CustomInput icon="mail" placeholder="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" />
                    </View>
                    <View style={{ marginBottom: 16 }}>
                      <CustomInput 
                        placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" textContentType="telephoneNumber"
                        leftComponent={
                          <View style={{ justifyContent: 'center', height: '100%', paddingLeft: 8, marginTop: Platform.OS === 'ios' ? 2 : 0 }}>
                            <CountryPicker countryCode={countryCode} withFilter withFlag={false} withCallingCode withCallingCodeButton onSelect={onSelectCountry} containerButtonStyle={{ marginRight: 4 }} />
                          </View>
                        }
                      />
                    </View>
                    <View style={{ marginBottom: 16 }}>
                      <CustomInput 
                        icon="map-pin" 
                        placeholder="Choose your location" 
                        value={locationString} 
                        editable={false}
                        rightComponent={
                          <TouchableOpacity onPress={handleGetLocation} disabled={isLocating} style={{ height: '100%', justifyContent: 'center' }}>
                            {isLocating ? (
                              <ActivityIndicator size="small" color="#45C400" />
                            ) : (
                              <Feather name="crosshair" size={18} color={locationString ? "#45C400" : "#B0B0B0"} />
                            )}
                          </TouchableOpacity>
                        }
                      />
                    </View>
                  </Animated.View>
                ) : (
                  <Animated.View entering={FadeIn}>
                    <View style={{ marginBottom: 16 }}>
                      <CustomInput icon="lock" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} showToggle onToggle={() => setShowPassword(!showPassword)} textContentType="newPassword" />
                      <PasswordRequirements password={password} />
                    </View>
                    <View style={{ marginBottom: 16 }}>
                      <CustomInput icon="lock" placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry textContentType="newPassword" />
                    </View>
                  </Animated.View>
                )}
              </View>
            ) : (
              // Login Mode
              <View style={{ marginBottom: 24 }}>
                {loginMethod === 'email' ? (
                  <>
                    <View style={{ marginBottom: 16 }}>
                      <CustomInput icon="mail" placeholder="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" />
                    </View>
                    <View>
                      <CustomInput 
                        icon="lock" placeholder="Password" value={password} onChangeText={setPassword} 
                        secureTextEntry={!showPassword} showToggle onToggle={() => setShowPassword(!showPassword)} textContentType="password"
                      />
                    </View>
                    <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 12 }}>
                      <Text style={{ color: '#6E7A70', fontFamily: 'Nunito_600SemiBold', fontSize: 12 }}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={{ marginBottom: 16 }}>
                      <CustomInput 
                        placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!otpSent} textContentType="telephoneNumber"
                        leftComponent={
                          <View style={{ justifyContent: 'center', height: '100%', paddingLeft: 8, marginTop: Platform.OS === 'ios' ? 2 : 0 }}>
                            <CountryPicker countryCode={countryCode} withFilter withFlag={false} withCallingCode withCallingCodeButton onSelect={onSelectCountry} containerButtonStyle={{ marginRight: 4 }} />
                          </View>
                        }
                      />
                    </View>

                    {otpSent && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={{ color: '#707070', fontFamily: 'Nunito_600SemiBold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 }}>
                          6-Digit Code
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 58, position: 'relative' }}>
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <View key={index} style={[styles.otpBox, otpCode.length === index ? styles.otpBoxActive : null]}>
                              <Text style={{ color: '#1F1F1F', fontFamily: 'Nunito_900Black', fontSize: 18 }}>{otpCode[index] || ''}</Text>
                            </View>
                          ))}
                          <TextInput 
                            style={{ position: 'absolute', width: '100%', height: '100%', color: 'transparent' }}
                            value={otpCode} onChangeText={setOtpCode} keyboardType="number-pad" maxLength={6} autoFocus textContentType="oneTimeCode"
                            caretHidden={true}
                          />
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {mode === 'signup' && signupStep === 2 && (
              <Text style={{ textAlign: 'center', color: '#A3A3A3', fontFamily: 'Nunito_500Medium', fontSize: 11, marginBottom: 16, paddingHorizontal: 16 }}>
                By creating an account, you agree to our <Text style={{ color: '#45C400' }}>Terms of Service</Text> and <Text style={{ color: '#45C400' }}>Privacy Policy</Text>.
              </Text>
            )}

            <InteractiveButton 
              type="primary"
              onPress={() => {
                if (mode === 'signup') {
                  if (signupStep === 1) {
                    setSignupStep(2);
                    return;
                  }
                  return handleSubmit();
                }
                if (loginMethod === 'email') return handleSubmit();
                if (loginMethod === 'otp') {
                  if (otpSent) return handleVerifyOTP();
                  return handleRequestOTP();
                }
              }}
              disabled={isLoading}
              style={styles.primaryBtnWrapper}
            >
              <LinearGradient
                colors={['#5ED600', '#44B000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.primaryBtn}
              >
                {isLoading ? <ActivityIndicator color="#ffffff" /> : (
                  <Text style={styles.primaryBtnText}>
                    {mode === 'signup' 
                      ? (signupStep === 1 ? 'Next' : 'Create Account') 
                      : loginMethod === 'email' ? 'Sign In' : (otpSent ? 'Verify Code' : 'Send Code')}
                  </Text>
                )}
              </LinearGradient>
            </InteractiveButton>
            
            {mode === 'login' && (
              <View style={{ alignItems: 'center', marginTop: 20 }}>
                <TouchableOpacity 
                  style={{ 
                    paddingVertical: 10, 
                    paddingHorizontal: 20, 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    backgroundColor: '#F8F4F1',
                    borderRadius: 24,
                    shadowColor: '#8A5A44',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                  onPress={() => { setLoginMethod(loginMethod === 'email' ? 'otp' : 'email'); setErrorMsg(''); }}
                >
                  <Feather 
                    name={loginMethod === 'email' ? 'smartphone' : 'mail'} 
                    size={14} 
                    color="#8A5A44" 
                    style={{ marginRight: 6 }} 
                  />
                  <Text style={{ color: '#8A5A44', fontFamily: 'Nunito_700Bold', fontSize: 13 }}>
                    {loginMethod === 'email' ? 'Login with OTP instead' : 'Login with Email instead'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={{ height: 1, backgroundColor: '#F0F0F0', marginTop: 20, marginBottom: 20 }} />

            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity 
                style={{ paddingVertical: 4 }}
                onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErrorMsg(''); setSignupStep(1); }}
              >
                <Text style={{ color: '#777777', fontFamily: 'Nunito_500Medium', fontSize: 13 }}>
                  {mode === 'login' ? "Don't have an account? " : "Already have an account? "} 
                  <Text style={{ color: '#45C400', fontFamily: 'Nunito_700Bold' }}>
                    {mode === 'login' ? 'Sign Up' : 'Log In'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32, // Re-balanced gap before the card starts
    paddingHorizontal: 24,
    position: 'relative',
    zIndex: 1,
  },
  brandName: {
    color: '#5C4033', // Deep earthy brown
    fontFamily: 'Nunito_900Black',
    fontSize: 22,
    letterSpacing: 2, // Wider tracking for a premium mark
  },
  brandSubtitle: {
    color: '#777777',
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    letterSpacing: 1, 
    marginTop: 4,
  },
  welcomeTitleCard: {
    color: '#1F1F1F',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32, 
    borderWidth: 1,
    borderColor: '#F2F2F2', 
    marginHorizontal: 36, 
    paddingHorizontal: 32, 
    paddingTop: 24,
    paddingBottom: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08, 
    shadowRadius: 30, 
    elevation: 4,
    zIndex: 10,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    height: 50,
  },
  googleBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4D4D4',
    marginBottom: 16,
  },
  appleBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
  },
  googleBtnText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: '#1F1F1F',
  },
  appleBtnText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  inputContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16, 
    paddingHorizontal: 20, 
    height: 52, 
    borderWidth: 1, // Soft inactive border
    borderColor: '#EFEFEF', // Lighter inactive border
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingLabel: {
    position: 'absolute',
    left: 0,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
  },
  inputText: {
    color: '#1F1F1F',
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    marginTop: 14, 
    height: 38,
  },
  primaryBtnWrapper: {
    borderRadius: 16, 
    shadowColor: '#37B500', 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 4,
  },
  primaryBtn: {
    borderRadius: 16, 
    height: 58, 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 2, 
    borderBottomColor: '#3A9600',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    zIndex: 2,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  otpBox: {
    width: '14%',
    height: '100%',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: '#45C400',
    backgroundColor: '#FFFFFF',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    textAlign: 'center',
  }
});

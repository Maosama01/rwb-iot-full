import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CountryPicker, { CountryCode, Country } from 'react-native-country-picker-modal';
import Animated, { FadeIn, FadeInUp, useSharedValue, useAnimatedStyle, withTiming, Easing, interpolateColor, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../api/client';

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

export function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState<CountryCode>('IN');
  const [callingCode, setCallingCode] = useState('91');
  
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const extractError = (err: any, defaultMsg: string) => {
    const detail = err?.response?.data?.detail;
    if (Array.isArray(detail)) return detail.map((d: any) => d.msg).join(', ');
    if (typeof detail === 'string') return detail;
    if (err?.message) return err.message;
    return defaultMsg;
  };

  const handleRequestOTP = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const digitsOnly = phone.replace(/[^0-9]/g, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        setErrorMsg("Please enter a valid phone number.");
        setIsLoading(false);
        return;
      }
      if (callingCode === '91' && digitsOnly.length !== 10) {
        setErrorMsg("Please enter a valid 10-digit Indian phone number.");
        setIsLoading(false);
        return;
      }

      const formattedPhone = `+${callingCode}${digitsOnly}`;
      await apiClient.post('/auth/forgot-password/request', { phone: formattedPhone });
      setStep(2);
    } catch (error: any) {
      setErrorMsg(extractError(error, 'Failed to send reset code.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (newPassword !== confirmPassword) {
        setErrorMsg("Passwords do not match");
        setIsLoading(false);
        return;
      }
      if (newPassword.length < 8) {
        setErrorMsg("Password must be at least 8 characters long.");
        setIsLoading(false);
        return;
      }
      if (otpCode.length < 4) {
        setErrorMsg("Please enter a valid OTP code.");
        setIsLoading(false);
        return;
      }

      const digitsOnly = phone.replace(/[^0-9]/g, '');
      const formattedPhone = `+${callingCode}${digitsOnly}`;
      
      await apiClient.post('/auth/forgot-password/reset', { 
        phone: formattedPhone, 
        code: otpCode,
        new_password: newPassword
      });
      
      setSuccessMsg("Password successfully reset! You can now log in.");
      // Delay before popping back
      setTimeout(() => {
        navigation.goBack();
      }, 2500);
      
    } catch (error: any) {
      setErrorMsg(extractError(error, 'Invalid or expired OTP code.'));
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectCountry = (countryModal: Country) => {
    setCountryCode(countryModal.cca2);
    setCallingCode(countryModal.callingCode[0]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF8F2' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
          
          <TouchableOpacity 
            style={{ position: 'absolute', top: 50, left: 24, zIndex: 10, width: 40, height: 40, backgroundColor: '#FFFFFF', borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#2A312B" />
          </TouchableOpacity>

          <Animated.View entering={FadeInUp.delay(100).springify()}>
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 32, color: '#2A312B', marginBottom: 8, marginTop: 40 }}>
              Reset Password
            </Text>
            <Text style={{ fontFamily: 'SourceSansPro-Regular', fontSize: 16, color: '#6E7A70', marginBottom: 32 }}>
              {step === 1 ? 'Enter your registered phone number to receive a reset code.' : 'Enter the code sent to your phone and choose a new password.'}
            </Text>
          </Animated.View>

          {errorMsg ? (
            <Animated.View entering={FadeIn} style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </Animated.View>
          ) : null}

          {successMsg ? (
            <Animated.View entering={FadeIn} style={{ backgroundColor: '#E8F5E9', padding: 16, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#C8E6C9', alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={48} color="#45C400" style={{ marginBottom: 8 }} />
              <Text style={{ color: '#2E7D32', fontFamily: 'SourceSansPro-SemiBold', fontSize: 16, textAlign: 'center' }}>{successMsg}</Text>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.delay(200).springify()}>
              {step === 1 ? (
                <>
                  <View style={{ marginBottom: 16 }}>
                    <CustomInput 
                      placeholder="Phone Number" 
                      value={phone} 
                      onChangeText={setPhone} 
                      keyboardType="phone-pad" 
                      textContentType="telephoneNumber"
                      leftComponent={
                        <View style={{ justifyContent: 'center', height: '100%', paddingLeft: 8, marginTop: Platform.OS === 'ios' ? 2 : 0 }}>
                          <CountryPicker countryCode={countryCode} withFilter withFlag={false} withCallingCode withCallingCodeButton onSelect={onSelectCountry} containerButtonStyle={{ marginRight: 4 }} />
                        </View>
                      }
                    />
                  </View>

                  <TouchableOpacity 
                    style={styles.primaryBtnWrapper}
                    onPress={handleRequestOTP}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#5ED600', '#44B000']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.primaryBtn}
                    >
                      {isLoading ? <ActivityIndicator color="#ffffff" /> : (
                        <Text style={styles.primaryBtnText}>Send Reset Code</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={{ marginBottom: 16 }}>
                    <CustomInput 
                      icon="key" 
                      placeholder="6-digit OTP Code" 
                      value={otpCode} 
                      onChangeText={setOtpCode} 
                      keyboardType="number-pad" 
                      textContentType="oneTimeCode" 
                    />
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <CustomInput 
                      icon="lock" 
                      placeholder="New Password" 
                      value={newPassword} 
                      onChangeText={setNewPassword} 
                      secureTextEntry={!showPassword} 
                      showToggle 
                      onToggle={() => setShowPassword(!showPassword)} 
                      textContentType="newPassword" 
                    />
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <CustomInput 
                      icon="lock" 
                      placeholder="Confirm New Password" 
                      value={confirmPassword} 
                      onChangeText={setConfirmPassword} 
                      secureTextEntry={!showPassword} 
                      textContentType="newPassword" 
                    />
                  </View>

                  <TouchableOpacity 
                    style={styles.primaryBtnWrapper}
                    onPress={handleResetPassword}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#5ED600', '#44B000']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.primaryBtn}
                    >
                      {isLoading ? <ActivityIndicator color="#ffffff" /> : (
                        <Text style={styles.primaryBtnText}>Reset Password</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginTop: 8,
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


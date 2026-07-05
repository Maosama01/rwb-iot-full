import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn, FadeInUp, useSharedValue, useAnimatedStyle, withTiming, Easing, interpolateColor, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../api/client';

function CustomInput({ icon, placeholder, value, onChangeText, keyboardType, autoCapitalize, editable = true, leftComponent, rightComponent, textContentType }: any) {
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
    <Animated.View style={[styles.inputContainer, containerStyle, !editable && { opacity: 0.7 }]}>
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
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={editable}
          selectTextOnFocus={editable}
          placeholderTextColor="transparent"
          textContentType={textContentType}
        />
      </View>
      
      {rightComponent && (
        <View style={{ paddingHorizontal: 8, height: '100%', justifyContent: 'center', marginRight: -4 }}>
          {rightComponent}
        </View>
      )}
    </Animated.View>
  );
}

export function EditProfileScreen() {
  const navigation = useNavigation<any>();
  
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/users/me');
      setDisplayName(res.data.display_name || '');
      setPhone(res.data.phone || '');
      setEmail(res.data.email || '');
    } catch (err) {
      console.error('Failed to fetch profile', err);
      setErrorMsg('Failed to load profile data.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg('');
    try {
      await apiClient.patch('/users/me', {
        display_name: displayName,
        phone: phone || null,
      });
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      console.error('Failed to update profile', err);
      const detail = err?.response?.data?.detail;
      setErrorMsg(typeof detail === 'string' ? detail : 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF8F2' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2A312B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          {isFetching ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#45C400" />
            </View>
          ) : (
            <Animated.View entering={FadeInUp.delay(100).springify()}>
              {errorMsg ? (
                <Animated.View entering={FadeIn} style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </Animated.View>
              ) : null}

              <View style={{ marginBottom: 16 }}>
                <CustomInput 
                  icon="user"
                  placeholder="Full Name" 
                  value={displayName} 
                  onChangeText={setDisplayName} 
                  autoCapitalize="words"
                  textContentType="name"
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <CustomInput 
                  icon="phone"
                  placeholder="Phone Number (Include Country Code)" 
                  value={phone} 
                  onChangeText={setPhone} 
                  keyboardType="phone-pad" 
                  textContentType="telephoneNumber"
                />
              </View>

              <View style={{ marginBottom: 32 }}>
                <CustomInput 
                  icon="mail"
                  placeholder="Email Address" 
                  value={email} 
                  editable={false} 
                  textContentType="emailAddress"
                  rightComponent={<Feather name="lock" size={14} color="#B0B0B0" />}
                />
                <Text style={styles.helperText}>Email address cannot be changed.</Text>
              </View>

              <TouchableOpacity 
                style={styles.primaryBtnWrapper}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#5ED600', '#44B000']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.primaryBtn}
                >
                  {isSaving ? <ActivityIndicator color="#ffffff" /> : (
                    <Text style={styles.primaryBtnText}>Save Changes</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#FAF8F2',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 24,
    color: '#2A312B',
  },
  inputContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16, 
    paddingHorizontal: 20, 
    height: 52, 
    borderWidth: 1,
    borderColor: '#EFEFEF',
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
  },
  helperText: {
    fontFamily: 'SourceSansPro-Regular',
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    marginLeft: 8,
  }
});

import "./global.css";
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Nunito_400Regular, Nunito_700Bold, Nunito_900Black } from '@expo-google-fonts/nunito';

import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { RecipesScreen } from './src/screens/RecipesScreen';
import { MarketplaceScreen } from './src/screens/MarketplaceScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { CompostingGuideScreen } from './src/screens/CompostingGuideScreen';
import { DevicePairingScreen } from './src/screens/DevicePairingScreen';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { GlobalNotificationBanner } from './src/components/GlobalNotificationBanner';
import { AIChatWidget } from './src/components/AIChatWidget';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { FirmwareUpdateScreen } from './src/screens/FirmwareUpdateScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{
      position: 'absolute',
      bottom: Math.max(insets.bottom, 24),
      left: 20,
      right: 20,
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
      height: 64,
      borderRadius: 32,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 10,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 8,
    }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel as string
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const color = isFocused ? '#5C8D42' : '#A4A4A4';

        let iconName: any = '';
        if (route.name === 'Home') iconName = isFocused ? 'home' : 'home-outline';
        else if (route.name === 'Compost Check') iconName = isFocused ? 'leaf' : 'leaf-outline';
        else if (route.name === 'Exchange') iconName = isFocused ? 'people' : 'people-outline';
        else if (route.name === 'Use It Up') iconName = isFocused ? 'restaurant' : 'restaurant-outline';

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={{ 
              flex: 1, 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
            }}>
              <Ionicons name={iconName} size={22} color={color} style={{ marginBottom: 4 }} />
              <Text 
                style={{ 
                  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto', 
                  fontWeight: isFocused ? '700' : '500', 
                  fontSize: 10, 
                  color: color 
                }} 
                numberOfLines={1}
                allowFontScaling={false}
              >
                {label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Home" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
        <Tab.Screen name="Compost Check" component={LibraryScreen} options={{ tabBarLabel: 'Can It Compost?' }} />
        <Tab.Screen name="Exchange" component={MarketplaceScreen} options={{ tabBarLabel: 'Exchange' }} />
        <Tab.Screen name="Use It Up" component={RecipesScreen} options={{ tabBarLabel: 'SaveMyFood' }} />
      </Tab.Navigator>
      {/* Floating AI assistant — available across all main tabs, like the web dashboard */}
      <AIChatWidget />
    </View>
  );
}

export default function App() {
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [initialRoute, setInitialRoute] = useState<'Login' | 'Onboarding'>('Login');

  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_900Black,
  });

  useEffect(() => {
    async function checkOnboarding() {
      try {
        // Force onboarding to show for presentations
        setInitialRoute('Onboarding');
      } catch (e) {
        setInitialRoute('Onboarding');
      } finally {
        setIsCheckingOnboarding(false);
      }
    }
    checkOnboarding();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && !isCheckingOnboarding) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isCheckingOnboarding]);

  if (!fontsLoaded || isCheckingOnboarding) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="Setup" component={SetupScreen} />
            <Stack.Screen name="MainApp" component={MainTabs} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="CompostingGuide" component={CompostingGuideScreen} />
            <Stack.Screen name="DevicePairing" component={DevicePairingScreen} />
            <Stack.Screen name="Alerts" component={AlertsScreen} />
            <Stack.Screen name="FirmwareUpdate" component={FirmwareUpdateScreen} />
          </Stack.Navigator>
          <GlobalNotificationBanner />
        </NavigationContainer>
      </SafeAreaProvider>
    </View>
  );
}

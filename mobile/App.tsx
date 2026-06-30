import "./global.css";
import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
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
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SetupScreen } from './src/screens/SetupScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ 
      headerShown: false,
      lazy: false,
      tabBarStyle: { 
        backgroundColor: '#F8F5EE', // Beige background matching the mockup
        borderTopWidth: 1, 
        borderTopColor: '#e5dfce',
        height: 90,
        paddingTop: 10,
      },
      tabBarActiveTintColor: '#2D5016', // Updated to #2D5016
      tabBarInactiveTintColor: '#a69d92', // Light beige inactive text
      tabBarLabelStyle: {
        fontFamily: 'Nunito_900Black',
        fontSize: 9,
        paddingBottom: 5,
      }
    }}>
      <Tab.Screen 
        name="Home" 
        component={DashboardScreen} 
        options={{ 
          tabBarLabel: 'HOME',
          tabBarIcon: ({ color }) => (
            <Ionicons name="leaf-outline" size={24} color={color} />
          )
        }} 
      />
      <Tab.Screen 
        name="Compost Check" 
        component={LibraryScreen} 
        options={{ 
          tabBarLabel: 'CAN IT COMPOST?',
          tabBarIcon: ({ color }) => (
            <Ionicons name="trash-bin-outline" size={26} color={color} />
          )
        }} 
      />
      <Tab.Screen 
        name="Use It Up" 
        component={RecipesScreen} 
        options={{ 
          tabBarLabel: 'SaveMyFood',
          tabBarIcon: ({ color }) => (
            <Ionicons name="restaurant-outline" size={24} color={color} />
          )
        }} 
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_900Black,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Setup" component={SetupScreen} />
            <Stack.Screen name="MainApp" component={MainTabs} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </View>
  );
}

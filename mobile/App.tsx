import "./global.css";
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { DashboardScreen } from './src/screens/DashboardScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import RecipesScreen from './src/screens/RecipesScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator screenOptions={{ 
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: '#F8F5EE', // Beige background matching the mockup
          borderTopWidth: 1, 
          borderTopColor: '#e5dfce',
          height: 90,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#604a36', // Brown active text
        tabBarInactiveTintColor: '#a69d92', // Light beige inactive text
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '800',
          paddingBottom: 5,
        }
      }}>
        <Tab.Screen 
          name="Stats" 
          component={DashboardScreen} 
          options={{ 
            tabBarLabel: 'COMPOSTING STATS',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="leaf-outline" size={24} color={color} />
            )
          }} 
        />
        <Tab.Screen 
          name="Library" 
          component={LibraryScreen} 
          options={{ 
            tabBarLabel: 'WHAT CAN GO IN RAWBIN',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trash-bin-outline" size={26} color={color} />
            )
          }} 
        />
        <Tab.Screen 
          name="Recipes" 
          component={RecipesScreen} 
          options={{ 
            tabBarLabel: 'SAVEMYFOOD',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="restaurant-outline" size={24} color={color} />
            )
          }} 
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

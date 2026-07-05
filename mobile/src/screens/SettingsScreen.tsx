import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function SettingsScreen() {
  const navigation = useNavigation<any>();

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('access_token');
              await AsyncStorage.removeItem('refresh_token');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error clearing storage:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2A312B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACCOUNT</Text>
            <View style={styles.card}>
              <TouchableOpacity 
                style={[styles.row, styles.borderBottom]}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="person-outline" size={18} color="#45C400" />
                  </View>
                  <Text style={styles.rowText}>Edit Profile</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.row}
                onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon.')}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="notifications-outline" size={18} color="#45C400" />
                  </View>
                  <Text style={styles.rowText}>Notifications</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DEVICE</Text>
            <View style={styles.card}>
              <TouchableOpacity 
                style={styles.row}
                onPress={() => navigation.navigate('Setup')}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="hardware-chip-outline" size={18} color="#45C400" />
                  </View>
                  <Text style={styles.rowText}>RAWBIN Setup</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SUPPORT</Text>
            <View style={styles.card}>
              <TouchableOpacity 
                style={[styles.row, styles.borderBottom]}
                onPress={() => Alert.alert('Coming Soon', 'Help Center will be available soon.')}
              >
                <Text style={styles.rowTextNoIcon}>Help Center</Text>
                <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.row, styles.borderBottom]}
                onPress={() => Alert.alert('Coming Soon', 'Terms of Service will be available soon.')}
              >
                <Text style={styles.rowTextNoIcon}>Terms of Service</Text>
                <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.row}
                onPress={() => Alert.alert('Coming Soon', 'Privacy Policy will be available soon.')}
              >
                <Text style={styles.rowTextNoIcon}>Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 24,
    color: '#2A312B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    color: '#6E7A70',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F9EA', // Light green background
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#2A312B',
  },
  rowTextNoIcon: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#2A312B',
    marginLeft: 16,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  logoutText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#D32F2F',
  }
});

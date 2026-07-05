import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/client';
import { LinearGradient } from 'expo-linear-gradient';

export function AlertsScreen() {
  const navigation = useNavigation<any>();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchAlerts();
    }, [])
  );

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      // 1. Get the device
      const devicesRes = await apiClient.get('/devices/');
      const devices = devicesRes.data;
      if (!devices || devices.length === 0) {
        setIsLoading(false);
        return;
      }
      const activeDevice = devices[0].id;
      setDeviceId(activeDevice);

      // 2. Fetch alerts
      const alertsRes = await apiClient.get(`/devices/${activeDevice}/alerts`);
      setAlerts(alertsRes.data.items || []);
    } catch (e: any) {
      console.log('Error fetching alerts:', e);
      Alert.alert('Error', 'Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    if (!deviceId) return;
    
    // Optimistic UI update
    setAlerts(prevAlerts => prevAlerts.map(a => 
      a.id === alertId ? { ...a, acknowledged: true } : a
    ));
    
    try {
      await apiClient.post(`/devices/${deviceId}/alerts/${alertId}/acknowledge`);
    } catch (e) {
      // Revert if failed
      console.log('Failed to acknowledge alert:', e);
      fetchAlerts();
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isCritical = item.severity === 'CRITICAL';
    const bgColor = item.acknowledged ? '#F5F5F5' : '#FFFFFF';
    const iconColor = isCritical ? '#E53E3E' : '#D69E2E';
    const iconBg = isCritical ? '#FFF5F5' : '#FFFFF0';
    const iconName = isCritical ? 'warning' : 'information-circle';

    return (
      <View style={[styles.alertCard, { backgroundColor: bgColor }]}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <Text style={[styles.alertTitle, !item.acknowledged && styles.unreadText]}>
              {item.metric ? `${item.metric.replace('_', ' ').toUpperCase()} Alert` : 'System Alert'}
            </Text>
            <Text style={styles.alertTime}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.alertMessage}>{item.message}</Text>
          
          {!item.acknowledged && (
            <TouchableOpacity 
              style={styles.ackButton}
              onPress={() => handleAcknowledge(item.id)}
            >
              <Text style={styles.ackText}>Mark as Read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A330B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#45C400" />
        </View>
      ) : alerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptySubtitle}>You have no new notifications.</Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Nunito_800Black',
    fontSize: 20,
    color: '#1A330B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontFamily: 'Nunito_800Black',
    fontSize: 22,
    color: '#4B5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  alertCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  alertTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#4B5563',
  },
  unreadText: {
    color: '#1A330B',
    fontFamily: 'Nunito_800Black',
  },
  alertTime: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    color: '#9CA3AF',
  },
  alertMessage: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  ackButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EDF8E8',
    borderRadius: 12,
  },
  ackText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    color: '#45C400',
  }
});

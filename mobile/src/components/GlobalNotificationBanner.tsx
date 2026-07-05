import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

const { width } = Dimensions.get('window');

interface AlertData {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  is_acknowledged: boolean;
  created_at: string;
}

export function GlobalNotificationBanner() {
  const [activeAlert, setActiveAlert] = useState<AlertData | null>(null);
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const lastSeenAlertId = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let pollInterval: NodeJS.Timeout;

    const fetchAlerts = async () => {
      try {
        const deviceId = await AsyncStorage.getItem('active_device_id');
        if (!deviceId) return;

        const res = await apiClient.get(`/devices/${deviceId}/alerts`);
        const alerts: AlertData[] = res.data.items || [];
        
        // Find the newest unacknowledged critical/warning alert
        const newAlert = alerts.find(a => 
          !a.is_acknowledged && 
          (a.severity === 'critical' || a.severity === 'warning')
        );

        if (newAlert && newAlert.id !== lastSeenAlertId.current) {
          if (isMounted) {
            setActiveAlert(newAlert);
            lastSeenAlertId.current = newAlert.id;
            showAlert();
          }
        }
      } catch (error) {
        // Silently fail for background polling
      }
    };

    // Initial fetch
    fetchAlerts();
    
    // Poll every 15 seconds
    pollInterval = setInterval(fetchAlerts, 15000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  const showAlert = () => {
    Animated.spring(slideAnim, {
      toValue: Platform.OS === 'ios' ? 50 : 20,
      useNativeDriver: true,
      bounciness: 12,
    }).start();

    // Auto-hide after 5 seconds
    setTimeout(hideAlert, 5000);
  };

  const hideAlert = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setActiveAlert(null);
    });
  };

  if (!activeAlert) return null;

  const getIcon = () => {
    switch (activeAlert.severity) {
      case 'critical': return 'warning';
      case 'warning': return 'alert-circle';
      default: return 'information-circle';
    }
  };

  const getColor = () => {
    switch (activeAlert.severity) {
      case 'critical': return '#E63946';
      case 'warning': return '#F4A261';
      default: return '#1877F2';
    }
  };

  return (
    <Animated.View style={[styles.bannerContainer, { transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity 
        style={[styles.bannerContent, { borderLeftColor: getColor(), borderLeftWidth: 4 }]} 
        activeOpacity={0.9}
        onPress={hideAlert}
      >
        <View style={[styles.iconWrapper, { backgroundColor: getColor() + '1A' }]}>
          <Ionicons name={getIcon()} size={24} color={getColor()} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{activeAlert.alert_type.replace('_', ' ').toUpperCase()}</Text>
          <Text style={styles.message} numberOfLines={2}>{activeAlert.message}</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={hideAlert}>
          <Ionicons name="close" size={20} color="#999999" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  bannerContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  message: {
    fontSize: 13,
    color: '#6F6F6F',
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  closeBtn: {
    padding: 4,
  },
});

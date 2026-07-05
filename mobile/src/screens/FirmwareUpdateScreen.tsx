import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export function FirmwareUpdateScreen() {
  const navigation = useNavigation<any>();
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'installing' | 'success'>('idle');
  const [progress, setProgress] = useState(0);
  
  // Fake animation for the ring
  const [spinAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (status === 'checking' || status === 'installing') {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [status]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleCheckUpdate = () => {
    setStatus('checking');
    setTimeout(() => {
      setStatus('available');
    }, 2000);
  };

  const handleDownloadAndInstall = () => {
    setStatus('downloading');
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setStatus('installing');
        setTimeout(() => {
          setStatus('success');
        }, 3000);
      }
    }, 150);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Firmware Update</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <View style={[
              styles.iconCircle, 
              (status === 'success' || status === 'available') && { borderColor: '#63B32E' },
              status === 'success' && { backgroundColor: '#F0F8F1' }
            ]}>
              <Ionicons 
                name={
                  status === 'checking' || status === 'installing' ? 'sync' : 
                  status === 'success' ? 'checkmark' : 
                  status === 'downloading' ? 'cloud-download-outline' : 
                  'hardware-chip-outline'
                } 
                size={64} 
                color={status === 'success' || status === 'available' ? '#63B32E' : '#999'} 
              />
            </View>
          </Animated.View>
        </View>

        {status === 'idle' && (
          <View style={styles.infoBox}>
            <Text style={styles.versionText}>Current Version: v1.2.4</Text>
            <Text style={styles.subText}>Your Rawbin is running smoothly. Check for updates to get the latest features and optimizations.</Text>
          </View>
        )}

        {status === 'checking' && (
          <View style={styles.infoBox}>
            <Text style={styles.versionText}>Checking for updates...</Text>
            <Text style={styles.subText}>Please wait while we connect to the server.</Text>
          </View>
        )}

        {status === 'available' && (
          <View style={styles.updateCard}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
            <Text style={styles.newVersionTitle}>Version 1.3.0</Text>
            <Text style={styles.changelog}>• Improved thermophilic heating efficiency{'\n'}• Better humidity sensor calibration{'\n'}• Minor bug fixes</Text>
          </View>
        )}

        {(status === 'downloading' || status === 'installing') && (
          <View style={styles.progressBox}>
            <Text style={styles.progressTitle}>
              {status === 'downloading' ? `Downloading... ${progress}%` : 'Installing update...'}
            </Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.warningText}>Do not unplug your Rawbin.</Text>
          </View>
        )}

        {status === 'success' && (
          <View style={styles.infoBox}>
            <Text style={styles.versionText}>Update Successful!</Text>
            <Text style={styles.subText}>Your Rawbin is now running v1.3.0.</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {status === 'idle' && (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleCheckUpdate}>
            <Text style={styles.primaryBtnText}>Check for Updates</Text>
          </TouchableOpacity>
        )}
        
        {status === 'available' && (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleDownloadAndInstall}>
            <Text style={styles.primaryBtnText}>Download & Install</Text>
          </TouchableOpacity>
        )}

        {status === 'success' && (
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 40,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  infoBox: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  subText: {
    fontSize: 15,
    color: '#6F6F6F',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  updateCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -12,
    right: 24,
    backgroundColor: '#63B32E',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  newVersionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  changelog: {
    fontSize: 14,
    color: '#6F6F6F',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  progressBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#63B32E',
    borderRadius: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#E63946',
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: '#FFFFFF',
  },
  primaryBtn: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  }
});

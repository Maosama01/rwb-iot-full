import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator, StyleSheet, Platform, Animated as RNAnimated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

interface PredictiveData {
  current_phase: string;
  health_score: number;
  estimated_days_remaining: number;
}

interface WasteLog {
  logged_at: string;
  weight_kg: number;
}

const screenWidth = Dimensions.get('window').width;
const AnimatedCircle = RNAnimated.createAnimatedComponent(Circle);

// Continuous 30-Day Cycle Countdown Ring with Animation & Soft styling
const CountdownRing = ({ size, strokeWidth, activeColor, inactiveColor, totalDays, elapsedDays }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const progress = elapsedDays / totalDays;
  const targetOffset = Math.max(0, circumference - (progress * circumference));

  const animatedOffset = useRef(new RNAnimated.Value(circumference)).current;

  useEffect(() => {
    RNAnimated.timing(animatedOffset, {
      toValue: targetOffset,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [targetOffset]);

  return (
    <View style={{ width: size, height: size, position: 'absolute' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size/2}, ${size/2}`}>
          {/* Background solid inactive track - soft neutral */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={inactiveColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Foreground animated active track */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={activeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={animatedOffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
    </View>
  );
};

// Custom SVG Consistency Chart (6 months)
const CustomConsistencyChart = () => {
  const chartHeight = 90; 
  const barWidth = 12; 
  
  // Data modeling 6 months of consistency
  const data = [
    { label: 'Jan', value: 40 },
    { label: 'Feb', value: 55 },
    { label: 'Mar', value: 65 },
    { label: 'Apr', value: 50 },
    { label: 'May', value: 60 },
    { label: 'Jun', value: 100 },
  ];
  
  // Distribute spacing perfectly
  const availableWidth = screenWidth - 48 - 48; // padding outer and card inner padding
  const totalBarWidths = data.length * barWidth;
  const spacing = (availableWidth - totalBarWidths) / (data.length - 1);
  const maxVal = 100;

  return (
    <View style={styles.chartWrapper}>
      <Svg width={availableWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#63B32E" stopOpacity="1" />
            <Stop offset="1" stopColor="#63B32E" stopOpacity="0.8" />
          </LinearGradient>
        </Defs>
        {data.map((item, index) => {
          const barHeight = (item.value / maxVal) * chartHeight;
          const x = index * (barWidth + spacing);
          const y = chartHeight - barHeight;
          const isActive = index === data.length - 1;

          return (
            <G key={item.label}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={6}
                ry={6}
                fill={isActive ? 'url(#activeGrad)' : '#EDF8E8'}
              />
            </G>
          );
        })}
      </Svg>
      <View style={[styles.chartLabels, { width: availableWidth }]}>
        {data.map((item, index) => (
          <Text 
            key={item.label} 
            style={[
              styles.chartLabelText, 
              { 
                color: index === data.length - 1 ? '#222222' : '#999999', 
                fontWeight: index === data.length - 1 ? '700' : '400' 
              }
            ]}
          >
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
};

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [userName, setUserName] = useState<string>('Guest');
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulator State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedDays, setSimulatedDays] = useState(0);
  
  // Real data state
  const [predictive, setPredictive] = useState<PredictiveData | null>(null);
  const [totalWasteKg, setTotalWasteKg] = useState<number>(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const userRes = await apiClient.get('/users/me');
        if (userRes.data?.display_name) {
          setUserName(userRes.data.display_name);
        }

        const devicesRes = await apiClient.get('/devices/');
        const devices = devicesRes.data;
        
        if (devices && devices.length > 0) {
          const mainDeviceId = devices[0].id;
          const [predictiveRes, wasteRes] = await Promise.all([
            apiClient.get(`/analytics/predictive/${mainDeviceId}`),
            apiClient.get(`/devices/${mainDeviceId}/waste-logs?limit=200`)
          ]);
          
          setPredictive(predictiveRes.data);
          
          const logs: WasteLog[] = wasteRes.data.items || [];
          let totalWeight = 0;
          logs.forEach(log => {
            totalWeight += log.weight_kg;
          });
          
          setTotalWasteKg(totalWeight);
        }
      } catch (error) {
        console.log('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isSimulating) {
      interval = setInterval(() => {
        setSimulatedDays(prev => {
          if (prev >= 30) {
            setIsSimulating(false);
            return 30;
          }
          return prev + 1;
        });
      }, 500); 
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Derived values
  const hasActiveCycle = isSimulating ? true : !!(predictive && (predictive as any).phase_started_at);
  const realDaysRemaining = predictive?.estimated_days_remaining ?? 0;
  
  const elapsedDays = isSimulating 
    ? simulatedDays 
    : (hasActiveCycle ? Math.max(0, 30 - realDaysRemaining) : 0);
    
  const daysRemaining = Math.max(0, 30 - Math.floor(elapsedDays));
  const co2Avoided = (totalWasteKg * 1.5).toFixed(1);

  const getPhaseInfo = (days: number) => {
    if (days === 0 && !hasActiveCycle) return { pill: 'Ready', phaseText: 'Waiting for Food Waste', phaseIcon: 'leaf' };
    if (days < 5) return { pill: 'Preparing', phaseText: 'Phase 1 of 4 • Heating', phaseIcon: 'thermometer' };
    if (days < 15) return { pill: 'Composting', phaseText: 'Phase 2 of 4 • Active', phaseIcon: 'sync' };
    if (days < 25) return { pill: 'Drying', phaseText: 'Phase 3 of 4 • Drying', phaseIcon: 'sunny' };
    if (days < 30) return { pill: 'Cooling', phaseText: 'Phase 4 of 4 • Cooling', phaseIcon: 'snow' };
    return { pill: 'Finished', phaseText: 'Ready to harvest', phaseIcon: 'checkmark-circle' };
  };

  const phaseInfo = getPhaseInfo(elapsedDays);
  
  const hour = new Date().getHours();
  const greetingTime = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <SafeAreaView style={styles.container}>
      {/* New Dedicated Background Image generated matching spec */}
      <Image 
        source={require('../../assets/background_dashboard.png')} 
        style={styles.fullScreenBgImage}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- Header Section --- */}
        <View style={styles.header}>
          <View style={styles.greetingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Ionicons name="leaf" size={14} color="#63B32E" style={{ marginRight: 6 }} />
              <Text style={styles.greeting}>Hello,</Text>
            </View>
            <Text style={styles.name}>{userName}</Text>
            <Text style={styles.subGreeting}>{greetingTime}</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity style={styles.simulatingBadge}>
                <Ionicons name={phaseInfo.phaseIcon as any} size={14} color="#214F25" style={{ marginRight: 6 }} />
                <Text style={styles.simulatingText}>{phaseInfo.pill}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingsButton}>
                <Ionicons name="settings-sharp" size={20} color="#214F25" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.playButton} 
              onPress={() => {
                setSimulatedDays(0);
                setIsSimulating(true);
              }}
            >
              <Ionicons name="play" size={20} color="#63B32E" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Hero Progress Section --- */}
        <View style={styles.heroSection}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#63B32E" />
          ) : (
            <View style={styles.progressCircleContainer}>
              {/* Outer soft ambient shadow for the ring */}
              <View style={styles.progressCircleOuterGlow} />
              
              <View style={styles.svgRingContainer}>
                <CountdownRing 
                  size={240} 
                  strokeWidth={16} 
                  activeColor="#63B32E" 
                  inactiveColor="#F0F0F0" 
                  totalDays={30}
                  elapsedDays={elapsedDays}
                />
              </View>
              
              {/* Inner subtle shadow layer */}
              <View style={styles.progressCircleInner} />
              
              <View style={styles.progressCircle}>
                <Text style={styles.compostingLabel}>COMPOSTING</Text>
                <Text style={styles.daysNumber}>{daysRemaining}</Text>
                <Text style={styles.daysLabel}>Days Remaining</Text>
                <View style={styles.phaseDivider} />
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Ionicons name={phaseInfo.phaseIcon as any} size={12} color="#63B32E" style={{marginRight: 6}} />
                  <Text style={styles.phaseText}>{phaseInfo.phaseText}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Machine Status Card */}
          <View style={styles.statusCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={styles.statusCardIconBg}>
                <Ionicons name="leaf-outline" size={24} color="#63B32E" />
              </View>
              <View style={{ marginLeft: 16 }}>
                <Text style={styles.statusCardHeaderLabel}>MACHINE STATUS</Text>
                <Text style={styles.statusCardTitle}>
                  {!hasActiveCycle ? "Ready to Start" : "Cycle Active"}
                </Text>
              </View>
            </View>
            
            <View style={styles.statusCardTextContainer}>
              <Text style={styles.statusCardSubtext}>
                {!hasActiveCycle 
                  ? "Your Rawbin is waiting for food waste." 
                  : "Machine is actively neutralizing pathogens."}
              </Text>
            </View>
            
            {/* Compact System Info Row */}
            <View style={styles.compactStatusRow}>
              <View style={styles.compactStatusItem}>
                <Text style={styles.compactStatusLabel}>Status</Text>
                <View style={styles.statusDot} />
                <Text style={styles.compactStatusValue}>{!hasActiveCycle ? 'Ready' : 'Running'}</Text>
              </View>
              <View style={styles.compactStatusDivider} />
              <View style={styles.compactStatusItem}>
                <Text style={styles.compactStatusLabel}>Humidity</Text>
                <Text style={styles.compactStatusValue}>{!hasActiveCycle ? '48%' : '30%'}</Text>
              </View>
            </View>
            <Text style={styles.sysSync}>Last Synced: Just now</Text>
          </View>
        </View>

        {/* --- Lifetime Impact Section --- */}
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Lifetime Impact</Text>
          <View style={styles.titleUnderline} />
        </View>
        
        <View style={styles.impactContainer}>
          <View style={styles.impactCard}>
            <View style={styles.impactIconContainer}>
              <Ionicons name="leaf-outline" size={28} color="#63B32E" />
            </View>
            <Text style={styles.impactCardTitle}>Waste Reduced</Text>
            <Text style={styles.impactValue}>{totalWasteKg.toFixed(1)} <Text style={{fontSize: 16}}>kg</Text></Text>
            <Text style={styles.impactSubtext}>Total waste kept out of landfill</Text>
          </View>
          
          <View style={styles.impactCard}>
            <View style={styles.impactIconContainer}>
              <Ionicons name="cloud-outline" size={28} color="#63B32E" />
            </View>
            <Text style={styles.impactCardTitle}>CO₂ Avoided</Text>
            <Text style={styles.impactValue}>{co2Avoided} <Text style={{fontSize: 16}}>kg</Text></Text>
            <Text style={styles.impactSubtext}>Greenhouse gases kept from emitting</Text>
          </View>
        </View>

        {/* --- Consistency Section --- */}
        <View style={[styles.sectionTitleContainer, { marginTop: 48 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.trophyBadge}>
                <Ionicons name="trophy" size={16} color="#63B32E" />
              </View>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Consistency</Text>
            </View>
            
            <View style={styles.keepItUpBadge}>
              <Ionicons name="trophy-outline" size={12} color="#63B32E" style={{marginRight: 4}} />
              <Text style={styles.keepItUpText}>Keep it up!</Text>
            </View>
          </View>
        </View>

        <View style={styles.consistencyCard}>
          <Text style={styles.consistencySubtitle}>Last 6 Months</Text>
          <CustomConsistencyChart />
        </View>
        
        {/* --- Share Streak Section (New) --- */}
        <View style={styles.shareCard}>
          <View style={styles.shareLeft}>
            <View style={styles.shareIconBg}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#63B32E" />
            </View>
            <View style={{flexShrink: 1}}>
              <Text style={styles.shareTitle}>Share Your Streak</Text>
              <Text style={styles.shareSubtitle}>Show off your composting consistency!</Text>
            </View>
          </View>
          <View style={styles.shareButtons}>
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#1877F2' }]}>
              <Ionicons name="logo-facebook" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#E1306C' }]}>
              <Ionicons name="logo-instagram" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#25D366' }]}>
              <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF8', 
  },
  fullScreenBgImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    opacity: 0.10, 
    zIndex: -1,
    resizeMode: 'cover'
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 160, 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 24,
  },
  greetingRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 16,
    color: '#6F6F6F',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  name: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#222222',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginTop: 2,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: '#999999',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 16,
  },
  simulatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF8E8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  simulatingText: {
    color: '#214F25',
    fontWeight: '600',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECF7E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  playButton: {
    backgroundColor: '#FFFFFF',
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 32,
  },
  progressCircleContainer: {
    width: 240,
    height: 240,
    position: 'relative',
    marginBottom: 64, 
  },
  progressCircleOuterGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FFFDF8',
    shadowColor: '#63B32E',
    shadowOpacity: 0.1,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  svgRingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 240,
    height: 240,
    zIndex: 2,
  },
  progressCircleInner: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 204,
    height: 204,
    borderRadius: 102,
    backgroundColor: '#FFFDF8',
    zIndex: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  progressCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  compostingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#63B32E',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginTop: 12,
  },
  daysNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#222222',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginVertical: -8,
  },
  daysLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6F6F6F',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginBottom: 8,
  },
  phaseDivider: {
    width: 24,
    height: 2,
    backgroundColor: '#E5E5E5',
    borderRadius: 1,
    marginBottom: 8,
  },
  phaseText: {
    fontSize: 12,
    color: '#6F6F6F',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
    flexDirection: 'column',
  },
  statusCardIconBg: {
    width: 48,
    height: 48,
    backgroundColor: '#EDF8E8',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCardHeaderLabel: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginBottom: 4,
  },
  statusCardTextContainer: {
    marginBottom: 24,
  },
  statusCardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#222222',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  statusCardSubtext: {
    fontSize: 15,
    color: '#6F6F6F',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    lineHeight: 22,
  },
  compactStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA', 
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    justifyContent: 'center'
  },
  compactStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  compactStatusDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 16,
  },
  compactStatusLabel: {
    fontSize: 13,
    color: '#999999',
    marginRight: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#63B32E',
    marginRight: 6,
  },
  compactStatusValue: {
    fontSize: 13,
    color: '#222222',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  sysSync: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginBottom: 32,
  },
  sectionTitleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginTop: 32,
    marginBottom: 24,
    position: 'relative',
    width: '100%',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222222',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  titleUnderline: {
    height: 3,
    backgroundColor: '#63B32E',
    width: 48,
    borderRadius: 1.5,
    marginTop: 8,
  },
  impactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  impactCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    flexDirection: 'column',
  },
  impactIconContainer: {
    backgroundColor: '#EDF8E8',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  impactCardTitle: {
    fontSize: 13,
    color: '#6F6F6F',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginBottom: 12,
  },
  impactValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  impactSubtext: {
    fontSize: 12,
    color: '#999999',
    lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  consistencyCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  consistencySubtitle: {
    fontSize: 14,
    color: '#6F6F6F',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginBottom: 24,
  },
  chartWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  chartLabelText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  trophyBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDF8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  keepItUpBadge: {
    backgroundColor: '#EDF8E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  keepItUpText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#63B32E',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  shareCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  shareIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDF8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shareTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222222',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginBottom: 2,
  },
  shareSubtitle: {
    fontSize: 11,
    color: '#999999',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  socialButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

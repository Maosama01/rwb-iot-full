import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator, StyleSheet, Platform, Animated as RNAnimated, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Rect, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/client';
import { getMqttClient } from '../api/mqttClient';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';

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

// Custom SVG Smooth Line Chart (6 months)
const SmoothLineChart = ({ data }: { data: { label: string, value: number }[] }) => {
  const chartHeight = 180; 
  const availableWidth = screenWidth - 48 - 48 - 30; // padding outer, card inner, and y-axis labels
  
  // Guard against empty data
  if (!data || data.length === 0) {
    return <View style={{ height: chartHeight, width: '100%', justifyContent: 'center', alignItems: 'center' }}><Text>No data</Text></View>;
  }
  
  const rawMax = Math.max(...data.map(d => d.value));
  const maxVal = Math.max(6, Math.ceil(rawMax * 1.2));
  const yLabels = [maxVal, maxVal * 0.66, maxVal * 0.33, 0].map(v => Math.round(v));

  const spacing = availableWidth / (data.length - 1);
  
  const points = data.map((item, index) => ({
    x: index * spacing,
    y: chartHeight - (item.value / maxVal) * chartHeight
  }));
  
  const getPath = () => {
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i === 0 ? points[0] : points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i + 2 < points.length ? points[i + 2] : p2;
      const k = 0.18;
      const cp1x = p1.x + (p2.x - p0.x) * k;
      const cp1y = p1.y + (p2.y - p0.y) * k;
      const cp2x = p2.x - (p3.x - p1.x) * k;
      const cp2y = p2.y - (p3.y - p1.y) * k;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const linePath = getPath();
  const areaPath = `${linePath} L ${availableWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  const animatedOffset = useRef(new RNAnimated.Value(1000)).current; 

  useEffect(() => {
    RNAnimated.timing(animatedOffset, {
      toValue: 0,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [animatedOffset]);
  
  const AnimatedPath = RNAnimated.createAnimatedComponent(Path);

  return (
    <View style={{ width: '100%', marginTop: 40 }}>
      {/* Grid lines (behind) */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: chartHeight, justifyContent: 'space-between' }}>
        {yLabels.map((val, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ width: 30, fontSize: 11, color: '#999999', fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' }}>{val} kg</Text>
            <View style={{ flex: 1, height: 1, borderBottomWidth: 1, borderBottomColor: '#E9ECEF', borderStyle: 'dashed' }} />
          </View>
        ))}
      </View>

      {/* SVG Line and Area */}
      <View style={{ marginLeft: 30, width: availableWidth, height: chartHeight, overflow: 'visible' }}>
        <Svg width={availableWidth} height={chartHeight} style={{ overflow: 'visible' }}>
          <Defs>
            <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#63B32E" stopOpacity="0.15" />
              <Stop offset="1" stopColor="#63B32E" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          
          <Path d={areaPath} fill="url(#areaGrad)" />
          
          <AnimatedPath 
            d={linePath} 
            fill="none" 
            stroke="#63B32E" 
            strokeWidth={3} 
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={1000}
            strokeDashoffset={animatedOffset}
          />

          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={5} fill="#63B32E" stroke="#FFFFFF" strokeWidth={2} />
          ))}
        </Svg>
        
        {/* Tooltip Pills */}
        {points.map((p, i) => {
          if (i === points.length - 1) return null; 
          return (
            <View key={i} style={{
              position: 'absolute',
              left: p.x - 22,
              top: p.y - 36,
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 8,
              height: 24,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 12,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#6F6F6F' }}>{data[i].value} kg</Text>
            </View>
          );
        })}
      </View>
      
      {/* X Axis Labels */}
      <View style={{ flexDirection: 'row', marginLeft: 30, width: availableWidth, justifyContent: 'space-between', marginTop: 12 }}>
        {data.map((item, index) => (
          <View key={item.label} style={{ width: 40, alignItems: 'center', marginLeft: -20 }}>
            <Text style={{
              fontSize: 12,
              color: index === data.length - 1 ? '#1C1C1E' : '#A1A1AA',
              fontWeight: index === data.length - 1 ? '700' : '400',
              fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto'
            }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  
  // Real API State
  const [userName, setUserName] = useState<string>('User');
  const [isLoading, setIsLoading] = useState(true);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  
  // Derived state from APIs
  const [predictivePhase, setPredictivePhase] = useState('Waiting');
  const [elapsedDays, setElapsedDays] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(30);
  const [healthScore, setHealthScore] = useState(100);
  
  const [lifetimeWasteKg, setLifetimeWasteKg] = useState(0);
  const [totalWasteKg, setTotalWasteKg] = useState(0);
  const [co2Avoided, setCo2Avoided] = useState('0.0');
  
  const [chartData, setChartData] = useState<{label: string, value: number}[]>([
    { label: 'May', value: 0 },
    { label: 'Jun', value: 0 },
    { label: 'Jul', value: 0 },
    { label: 'Aug', value: 0 },
    { label: 'Sep', value: 0 },
    { label: 'Oct', value: 0 },
  ]);

  // Live Telemetry State
  const [liveTemp, setLiveTemp] = useState<string>('--');
  const [liveHumidity, setLiveHumidity] = useState<string>('--');
  const [lastSyncAge, setLastSyncAge] = useState<number | null>(null);

  // MQTT Real-time Telemetry Subscription
  useEffect(() => {
    if (!activeDeviceId) return;

    const mqttClient = getMqttClient();
    const topic = `telemetry/${activeDeviceId}`;

    mqttClient.subscribe(topic, (err) => {
      if (!err) {
        console.log(`📡 Subscribed to live telemetry: ${topic}`);
      }
    });

    const handleMessage = (topicName: string, message: any) => {
      if (topicName === topic) {
        try {
          const data = JSON.parse(message.toString());
          setLiveTemp(`${data.temperature_c.toFixed(1)}°C`);
          setLiveHumidity(`${data.humidity_pct.toFixed(0)}%`);
          setLastSyncAge(0); // Just synced!
        } catch (e) {
          console.log('Error parsing live telemetry:', e);
        }
      }
    };

    mqttClient.on('message', handleMessage);

    return () => {
      mqttClient.unsubscribe(topic);
      mqttClient.off('message', handleMessage);
    };
  }, [activeDeviceId]);

  useFocusEffect(
    useCallback(() => {
      async function fetchDashboardData() {
        setIsLoading(true);
        try {
          // 0. Fetch user profile
          try {
            const userRes = await apiClient.get('/users/me');
            if (userRes.data.display_name) {
              setUserName(userRes.data.display_name.split(' ')[0]);
            }
          } catch (e) {
            console.log('Failed to fetch user profile', e);
          }

          // 1. Fetch accessible devices
          const devicesRes = await apiClient.get('/devices/');
          const devices = devicesRes.data;
          if (!devices || devices.length === 0) {
            setIsLoading(false);
            return;
          }
          const deviceId = devices[0].id;
          setActiveDeviceId(deviceId);

        // 2. Fetch predictive insights
        try {
          const predRes = await apiClient.get(`/analytics/predictive/${deviceId}`);
          setPredictivePhase(predRes.data.current_phase || 'Unknown');
          setDaysRemaining(predRes.data.estimated_days_remaining || 0);
          setHealthScore(predRes.data.health_score || 0);
          
          if (predRes.data.phase_started_at) {
            const started = new Date(predRes.data.phase_started_at);
            const now = new Date();
            const daysDiff = (now.getTime() - started.getTime()) / (1000 * 3600 * 24);
            setElapsedDays(Math.max(0, daysDiff));
          }
        } catch (e) {
          console.log('Failed to fetch predictive data', e);
        }

        // 3. Fetch live device status
        try {
          const statusRes = await apiClient.get(`/status/${deviceId}`);
          if (statusRes.data.latest_reading) {
            setLiveTemp(`${statusRes.data.latest_reading.temperature_c.toFixed(1)}°C`);
            setLiveHumidity(`${statusRes.data.latest_reading.humidity_pct.toFixed(0)}%`);
            setLastSyncAge(statusRes.data.reading_age_seconds);
          } else {
            setLiveTemp('--°C');
            setLiveHumidity('--%');
            setLastSyncAge(null);
          }
        } catch (e) {
          console.log('Failed to fetch live status', e);
        }

        // 4. Fetch waste logs for this device
        try {
          const wasteRes = await apiClient.get(`/devices/${deviceId}/waste-logs`);
          const logs = wasteRes.data.logs || [];
          
          // Calculate total waste for this month and lifetime
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          let currentMonthWaste = 0;
          let lifetimeWaste = 0;
          
          // Aggregate by month for chart (last 6 months)
          const monthlyTotals: Record<number, number> = {};
          
          logs.forEach((log: any) => {
            const logDate = new Date(log.logged_at);
            const m = logDate.getMonth();
            const y = logDate.getFullYear();
            
            lifetimeWaste += log.weight_kg;
            if (m === currentMonth && y === currentYear) {
              currentMonthWaste += log.weight_kg;
            }
            if (y === currentYear || (y === currentYear - 1 && m > currentMonth)) {
              monthlyTotals[m] = (monthlyTotals[m] || 0) + log.weight_kg;
            }
          });
          
          setLifetimeWasteKg(lifetimeWaste);
          setTotalWasteKg(currentMonthWaste);
          setCo2Avoided((lifetimeWaste * 1.5).toFixed(1));
          
          // Format chart data for the last 6 months
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const newChartData = [];
          for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            newChartData.push({
              label: monthNames[d.getMonth()],
              value: Number((monthlyTotals[d.getMonth()] || 0).toFixed(1))
            });
          }
          setChartData(newChartData);

        } catch (e) {
          console.log('Failed to fetch waste logs', e);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, [])
  );

  const hasActiveCycle = elapsedDays > 0;

  const formatSyncTime = (seconds: number | null) => {
    if (seconds === null) return 'Never';
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const getPhaseInfo = (days: number, phaseName: string) => {
    if (!hasActiveCycle) return { pill: 'Ready', phaseText: 'Waiting for Food Waste', phaseIcon: 'leaf', status: 'Ready', humidity: '48%', subtext: 'Your Rawbin is waiting for food waste.' };
    if (phaseName === 'Thermophilic') return { pill: 'Heating', phaseText: 'Phase 2 of 4 • Heating', phaseIcon: 'thermometer', status: 'Active', humidity: '80%', subtext: 'Machine is actively heating and neutralizing pathogens.' };
    if (phaseName === 'Maturation') return { pill: 'Cooling', phaseText: 'Phase 4 of 4 • Cooling', phaseIcon: 'snow', status: 'Active', humidity: '15%', subtext: 'Cooling down the finished compost for safe handling.' };
    return { pill: 'Composting', phaseText: 'Phase 1 of 4 • Active', phaseIcon: 'sync', status: 'Active', humidity: '65%', subtext: 'Microbes are rapidly breaking down the organic matter.' };
  };

  const phaseInfo = getPhaseInfo(elapsedDays, predictivePhase);
  
  const getAvatarMood = () => {
    const tempVal = parseInt(liveTemp.replace(/\D/g, '')) || 25;
    const humVal = parseInt(liveHumidity.replace(/\D/g, '')) || 55;

    if (tempVal > 40) return { emoji: '🥵', mood: 'Sweating', tip: 'Too hot! Turn the pile to aerate.', color: '#FF9500' };
    if (tempVal < 20) return { emoji: '🥶', mood: 'Shivering', tip: 'A bit cold! Add nitrogen-rich greens.', color: '#34A853' }; // blueish/greenish
    if (humVal < 40) return { emoji: '🥀', mood: 'Wilting', tip: 'Too dry! Add some water or wet greens.', color: '#8B4513' };
    if (humVal > 60) return { emoji: '💧', mood: 'Soggy', tip: 'Too wet! Add dry browns like paper.', color: '#007AFF' };
    
    return { emoji: '🌱', mood: 'Thriving', tip: 'Conditions are perfect! Great job.', color: '#63B32E' };
  };

  const avatar = getAvatarMood();
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
              
              <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
                <Ionicons name="settings-sharp" size={20} color="#214F25" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* --- Hero Progress Section --- */}
        <View style={styles.heroSection}>
          {isLoading ? (
            <View style={{ height: 280, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#63B32E" />
            </View>
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
          {/* Virtual Bin Avatar Card */}
          <View style={[styles.statusCard, { marginBottom: 20, borderColor: avatar.color + '40', borderWidth: 1, backgroundColor: '#FFFFFF' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 64, height: 64, backgroundColor: avatar.color + '15', borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                <Text style={{ fontSize: 36 }}>{avatar.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: avatar.color, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' }}>
                  Virtual Bin
                </Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2C1E16', marginBottom: 4, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' }}>
                  {avatar.mood}
                </Text>
                <Text style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 18, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' }}>
                  {avatar.tip}
                </Text>
              </View>
            </View>
          </View>

          {/* Machine Status Card */}
          <View style={styles.statusCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={styles.statusCardIconBg}>
                <Ionicons name={phaseInfo.phaseIcon as any} size={24} color="#63B32E" />
              </View>
              <View style={{ marginLeft: 16 }}>
                <Text style={styles.statusCardHeaderLabel}>MACHINE STATUS</Text>
                <Text style={styles.statusCardTitle}>
                  {phaseInfo.status === 'Ready' ? "Ready to Start" : phaseInfo.status === 'Finished' ? "Cycle Complete" : "Cycle Active"}
                </Text>
              </View>
            </View>
            
            <View style={styles.statusCardTextContainer}>
              <Text style={styles.statusCardSubtext}>
                {phaseInfo.subtext}
              </Text>
            </View>
            
            {/* Compact System Info Row */}
            <View style={styles.compactStatusRow}>
              <View style={styles.compactStatusItem}>
                <Text style={styles.compactStatusLabel}>Status</Text>
                <View style={[styles.statusDot, phaseInfo.status === 'Ready' ? {backgroundColor: '#999999'} : {}]} />
                <Text style={styles.compactStatusValue}>{phaseInfo.status === 'Ready' ? 'Idle' : phaseInfo.status === 'Finished' ? 'Done' : 'Running'}</Text>
              </View>
              <View style={styles.compactStatusItem}>
                <Text style={styles.compactStatusLabel}>Temp</Text>
                <Text style={styles.compactStatusValue}>{liveTemp}</Text>
              </View>
              <View style={styles.compactStatusDivider} />
              <View style={styles.compactStatusItem}>
                <Text style={styles.compactStatusLabel}>Humidity</Text>
                <Text style={styles.compactStatusValue}>{liveHumidity}</Text>
              </View>
            </View>
            <Text style={styles.sysSync}>Last Synced: {formatSyncTime(lastSyncAge)}</Text>
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
            <Text style={styles.impactValue}>{lifetimeWasteKg.toFixed(1)} <Text style={{fontSize: 16}}>kg</Text></Text>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 48, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
              <Ionicons name="trophy-outline" size={24} color="#63B32E" />
            </View>
            <View>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#1C1C1E' }}>Consistency</Text>
              <Text style={{ fontSize: 15, color: '#6C757D', marginTop: 2 }}>Your composting journey</Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
            <Ionicons name="trophy-outline" size={14} color="#63B32E" style={{marginRight: 4}} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#63B32E' }}>Keep it up!</Text>
          </View>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 28, elevation: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: '500', color: '#6C757D', marginBottom: 4 }}>Total Compost Made</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{ fontSize: 56, fontWeight: '800', color: '#1C1C1E' }}>{lifetimeWasteKg.toFixed(1)}</Text>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginLeft: 4 }}>kg</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="arrow-up" size={16} color="#63B32E" />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#63B32E', marginLeft: 2 }}>{healthScore}</Text>
            <Text style={{ fontSize: 16, color: '#6C757D', marginLeft: 6 }}>Device Health Score</Text>
          </View>
          
          <SmoothLineChart data={chartData} />
        </View>
        
        {/* Motivational Banner */}
        <View style={{ 
          backgroundColor: '#FFFFFF', 
          borderRadius: 24, 
          paddingHorizontal: 24, 
          paddingVertical: 24, 
          marginTop: 32, 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 28, elevation: 4
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
              <Ionicons name="leaf-outline" size={24} color="#63B32E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '600', color: '#1C1C1E', marginBottom: 2 }}>Great Job!</Text>
              <Text style={{ fontSize: 14, color: '#6C757D', flexShrink: 1 }}>You made <Text style={{fontWeight: '700', color: '#1C1C1E'}}>{totalWasteKg.toFixed(1)} kg</Text> of compost this month.</Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'column', alignItems: 'flex-end', marginLeft: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="trending-up" size={20} color="#63B32E" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#63B32E' }}>+12%</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#8E8E93', marginTop: 2 }}>vs last month</Text>
          </View>
        </View>
        {/* Share Streak Section */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 20, marginTop: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 28, elevation: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#F0F8F1', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#63B32E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#1C1C1E', marginBottom: 2 }} numberOfLines={1}>Share Your Streak</Text>
              <Text style={{ fontSize: 13, color: '#8E8E93', lineHeight: 18 }} numberOfLines={2}>Show off your composting consistency!</Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity 
              activeOpacity={0.7} 
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1877F2', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
              onPress={() => Share.share({ message: `I've been composting for ${elapsedDays} days with Rawbin! Join me.` })}
            >
              <Ionicons name="logo-facebook" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              activeOpacity={0.7} 
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E1306C', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
              onPress={() => Share.share({ message: `I've been composting for ${elapsedDays} days with Rawbin! Join me.` })}
            >
              <Ionicons name="logo-instagram" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              activeOpacity={0.7} 
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
              onPress={() => Share.share({ message: `I've been composting for ${elapsedDays} days with Rawbin! Join me.` })}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={{ textAlign: 'center', color: '#B0B0B0', fontSize: 13, marginTop: 48, marginBottom: 24 }}>Rawbin App v1.0.0</Text>
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
    width: 30,
    height: 30,
    borderRadius: 10,
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

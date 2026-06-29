import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Mask } from 'react-native-svg';
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

// 14-Day Cycle Countdown Ring (Not a spinner)
const CountdownRing = ({ size, strokeWidth, activeColor, inactiveColor, totalDays, elapsedDays }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // We want exact dashes for days. Let's use 28 dashes (2 per day) for better visual density, or 14 dashes.
  // 14 dashes:
  const numDashes = 28; 
  const dashLength = circumference / numDashes * 0.7; // 70% dash, 30% gap
  const gapLength = circumference / numDashes * 0.3;
  const dashArray = `${dashLength} ${gapLength}`;
  
  const progress = elapsedDays / totalDays;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <View style={{ width: size, height: size, position: 'absolute' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size/2}, ${size/2}`}>
          {/* Background inactive dashed circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={inactiveColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={dashArray}
          />
          
          {/* Foreground active dashed circle (masked by solid progress circle) */}
          <Mask id="countdownMask">
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="white"
              strokeWidth={strokeWidth + 2}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="butt"
            />
          </Mask>
          
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={activeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={dashArray}
            mask="url(#countdownMask)"
          />
        </G>
      </Svg>
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
  const [streakLabels, setStreakLabels] = useState<string[]>(["Jan", "Feb", "Mar", "Apr", "May", "Jun"]);
  const [streakData, setStreakData] = useState<number[]>([0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // 1. Fetch user profile
        const userRes = await apiClient.get('/users/me');
        if (userRes.data?.display_name) {
          setUserName(userRes.data.display_name);
        }

        // 2. Fetch accessible devices
        const devicesRes = await apiClient.get('/devices/');
        const devices = devicesRes.data;
        
        if (devices && devices.length > 0) {
          const mainDeviceId = devices[0].id;
          
          // 3. Fetch Predictive Insights & Waste Logs concurrently
          const [predictiveRes, wasteRes] = await Promise.all([
            apiClient.get(`/analytics/predictive/${mainDeviceId}`),
            apiClient.get(`/devices/${mainDeviceId}/waste-logs?limit=200`)
          ]);
          
          setPredictive(predictiveRes.data);
          
          // 4. Process Waste Logs
          const logs: WasteLog[] = wasteRes.data.items || [];
          
          let totalWeight = 0;
          const monthlyMap: Record<string, number> = {};
          
          logs.forEach(log => {
            totalWeight += log.weight_kg;
            
            const date = new Date(log.logged_at);
            // "Jan", "Feb", etc.
            const monthStr = date.toLocaleString('default', { month: 'short' });
            monthlyMap[monthStr] = (monthlyMap[monthStr] || 0) + log.weight_kg;
          });
          
          setTotalWasteKg(totalWeight);
          
          // Build chart data for the last 6 months based on current month
          const currentMonth = new Date().getMonth(); // 0-11
          const labels: string[] = [];
          const data: number[] = [];
          
          for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(currentMonth - i);
            const m = d.toLocaleString('default', { month: 'short' });
            labels.push(m);
            data.push(monthlyMap[m] || 0);
          }
          
          setStreakLabels(labels);
          setStreakData(data);
        }
      } catch (error) {
        console.log('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Simulator Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(() => {
        setSimulatedDays(prev => {
          if (prev >= 30) {
            setIsSimulating(false);
            return 30; // Stop at 30
          }
          return prev + 1;
        });
      }, 500); // Half a second per day
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Derived values
  const hasActiveCycle = isSimulating ? true : !!(predictive && predictive.phase_started_at);
  const realDaysRemaining = predictive?.estimated_days_remaining ?? 0;
  
  const elapsedDays = isSimulating 
    ? simulatedDays 
    : (hasActiveCycle ? Math.max(0, 30 - realDaysRemaining) : 0);
    
  const daysRemaining = Math.max(0, 30 - elapsedDays);
  const co2Avoided = (totalWasteKg * 1.5).toFixed(1); // Standard 1.5x multiplier
  
  // Status logic based on health score
  let healthScore = predictive?.health_score ?? 100;
  if (isSimulating) {
    if (elapsedDays < 10) healthScore = 100;
    else if (elapsedDays < 20) healthScore = 75; // show yellow midway
    else healthScore = 95;
  }
  
  let statusText = "ALL GOING WELL";
  let statusColor = "#4A7C2F"; // Green
  
  if (!hasActiveCycle) {
    statusText = "READY TO START";
    statusColor = "#a69d92"; // Grey
  } else if (healthScore < 50) {
    statusText = "NEEDS ATTENTION";
    statusColor = "#C0392B"; // Red
  } else if (healthScore < 80) {
    statusText = "FAIR CONDITIONS";
    statusColor = "#B8860B"; // Yellow/Gold
  }

  return (
    <View className="flex-1 bg-[#F5F0E8]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Watercolor Background Image */}
        <Image 
          source={require('../../assets/dashboard_bg.png')} 
          className="absolute w-full h-[550px] top-0 opacity-100"
          resizeMode="cover"
        />
        {/* Fading gradient overlay at bottom of image */}
        <View className="absolute w-full h-[550px] top-0 bg-white/10" />
        <View className="absolute w-full h-32 top-[450px] bg-[#F5F0E8]" style={{ shadowColor: '#F5F0E8', shadowOffset: { width: 0, height: -30 }, shadowOpacity: 1, shadowRadius: 30, elevation: 10 }} />

        <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
          
          {/* Header Bar */}
          <View className="flex-row items-start justify-between px-6 pt-2">
            {/* Left: Profile */}
            <View className="flex-row items-center space-x-3">
              <View className="w-12 h-12 rounded-full bg-[#2D5016] items-center justify-center shadow-sm border border-[#2D5016]/20 overflow-hidden">
                <Image 
                  source={{ uri: `https://ui-avatars.com/api/?name=${userName}&background=2D5016&color=fff&size=128` }}
                  className="w-full h-full"
                />
              </View>
              <View className="bg-white/80 px-3 py-1.5 rounded-xl shadow-sm">
                <Text className="text-[#2D5016] text-[10px] font-nunito-bold uppercase tracking-wider">Hello,</Text>
                <Text className="text-[#2D5016] font-nunito-black text-sm">{userName}</Text>
              </View>
            </View>

            {/* Center: Home Title */}
            <View className="items-center absolute left-0 right-0 top-5" style={{ zIndex: -1 }}>
              <View className="items-center flex-col bg-white/80 px-4 py-1.5 rounded-2xl shadow-sm">
                <Ionicons name={isSimulating ? "play" : "leaf"} size={14} color="#4A7C2F" />
                <Text className="text-[#2D5016] font-nunito-bold text-sm mt-0.5">{isSimulating ? "Simulating" : "Home"}</Text>
              </View>
            </View>

            {/* Right: Controls */}
            <View className="space-y-3">
              <TouchableOpacity onPress={() => navigation.navigate('Settings')} className="w-12 h-12 rounded-full bg-[#2D5016] items-center justify-center shadow-md">
                <Ionicons name="settings-sharp" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  setSimulatedDays(0);
                  setIsSimulating(true);
                }} 
                className="w-12 h-12 rounded-full bg-[#E8F0E0] items-center justify-center shadow-md"
              >
                <Ionicons name="play" size={24} color="#2D5016" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Progress Dial */}
          <View className="items-center mt-12">
            <View className="w-40 h-40 items-center justify-center relative bg-white rounded-full shadow-lg border border-[#ede7d7]">
              {isLoading ? (
                <ActivityIndicator size="large" color="#4A7C2F" />
              ) : (
                <>
                  <CountdownRing 
                    size={160} 
                    strokeWidth={12} 
                    activeColor="#4A7C2F" 
                    inactiveColor="#d4d4ca" 
                    totalDays={30}
                    elapsedDays={elapsedDays}
                  />
                  
                  <Text className="text-5xl font-nunito-black text-[#2D5016] pt-4 leading-tight">{daysRemaining}</Text>
                  <Text className="text-[#4A7C2F] font-nunito-bold tracking-widest text-[10px]">DAYS</Text>
                  
                  <View className="mt-2">
                    {(() => {
                      if (!hasActiveCycle) return <Ionicons name="add-circle-outline" size={22} color="#a69d92" />;
                      if (elapsedDays < 10) return <Ionicons name="nutrition-outline" size={22} color="#8B4513" />; // Food waste
                      if (elapsedDays < 22) return <Ionicons name="sync" size={22} color="#B8860B" />; // Breaking down
                      return <Ionicons name="leaf" size={22} color="#4A7C2F" />; // Ready compost
                    })()}
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Status Label */}
          <View className="items-center mt-12">
            <View className="bg-white/95 px-6 py-3 rounded-2xl shadow-md border border-[#ede7d7]">
              <Text className="text-[#2D5016] font-nunito-black tracking-widest text-sm text-center">
                {isLoading ? "LOADING..." : (!hasActiveCycle ? "ADD WASTE TO START" : `${daysRemaining} DAYS TO COMPOST REMAINING`)}
              </Text>
            </View>
            
            <View className="flex-row items-center bg-white/90 px-6 py-2.5 rounded-full mt-3 shadow-sm border border-[#ede7d7]">
              <Text className="text-[#2D5016] font-nunito-bold text-[10px] tracking-wider mr-2">STATUS:</Text>
              <View className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: statusColor }} />
              <Text className="font-nunito-bold text-[10px] tracking-wider" style={{ color: statusColor }}>{statusText}</Text>
            </View>
          </View>

          {/* Stats Section */}
          <View className="px-6 mt-14">
            <Text className="text-[#2D5016] font-nunito-black text-xl mb-1">Stats</Text>
            <Text className="text-[#4A7C2F] font-nunito-bold text-[10px] tracking-widest mb-4 uppercase">LIFETIME IMPACT</Text>

            <View className="flex-row justify-between space-x-4">
              {/* Waste Reduced Card */}
              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-[#ede7d7]">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-full bg-[#F5F0E8] items-center justify-center mr-2 border border-[#d6cfc1]">
                    <Ionicons name="leaf" size={20} color="#4A7C2F" />
                  </View>
                  <Text className="text-[#2D5016] font-nunito-bold text-[9px] flex-1 leading-tight uppercase">Waste Reduced</Text>
                </View>
                <Text className="text-[#2D5016] font-nunito-black text-2xl text-center mt-1">{totalWasteKg.toFixed(1)} kg</Text>
              </View>

              {/* CO2 Avoided Card */}
              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-[#ede7d7]">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-full bg-[#F5F0E8] items-center justify-center mr-2 border border-[#d6cfc1]">
                    <Ionicons name="cloud-outline" size={20} color="#4A7C2F" />
                  </View>
                  <Text className="text-[#2D5016] font-nunito-bold text-[9px] flex-1 leading-tight uppercase">CO2 Avoided</Text>
                </View>
                <Text className="text-[#2D5016] font-nunito-black text-2xl text-center mt-1">{co2Avoided} kg</Text>
              </View>
            </View>
          </View>

          {/* Streak Section */}
          <View className="mb-10 px-8 mt-10">
            <View className="flex-row items-center mb-3">
              <Ionicons name="leaf" size={18} color="#4A7C2F" />
              <Text className="text-[#2D5016] font-nunito-black text-xl ml-2">Streak</Text>
            </View>
            <Text className="text-[#4A7C2F] font-nunito-bold text-xs uppercase tracking-widest mb-4">Last 6 Months Compost Made</Text>
            
            <View className="bg-white rounded-[24px] p-4 shadow-sm border border-[#ede7d7] overflow-visible">
              {isLoading ? (
                <View className="h-[200px] items-center justify-center">
                  <ActivityIndicator color="#4A7C2F" />
                </View>
              ) : (
                <View style={{ marginLeft: 5 }}>
                  {(() => {
                    const actualMax = Math.max(...(streakData.length > 0 ? streakData : [0]));
                    const yMax = Math.max(20, Math.ceil(actualMax / 20) * 20);
                    const maxDataset = streakLabels.map(() => yMax);
                    
                    return (
                      <LineChart
                        data={{
                          labels: streakLabels,
                          datasets: [
                            {
                              data: streakData.length > 0 && streakData.some(d => d > 0) ? streakData : streakLabels.map(() => 0),
                            },
                            {
                              data: maxDataset,
                              withDots: false,
                              color: () => 'transparent', // Invisible line to force scale
                              strokeWidth: 0,
                            }
                          ]
                        }}
                      segments={4}
                      width={screenWidth - 96}
                  height={200}
                  yAxisSuffix=" kg"
                  yAxisInterval={1} 
                  fromZero={true}
                  withInnerLines={true}
                  withOuterLines={false}
                  withVerticalLines={false}
                  withHorizontalLines={true}
                  withVerticalLabels={true}
                  chartConfig={{
                    backgroundColor: "#FFFFFF",
                    backgroundGradientFrom: "#FFFFFF",
                    backgroundGradientTo: "#FFFFFF",
                    decimalPlaces: 0, 
                    color: (opacity = 1) => `rgba(74, 124, 47, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(45, 80, 22, ${opacity})`,
                    style: {
                      borderRadius: 16
                    },
                    propsForDots: {
                      r: "4", 
                      strokeWidth: "2",
                      stroke: "#FFFFFF"
                    },
                    fillShadowGradientFrom: "#4A7C2F",
                    fillShadowGradientFromOpacity: 0.3,
                    fillShadowGradientTo: "#FFFFFF",
                    fillShadowGradientToOpacity: 0.1,
                    propsForBackgroundLines: {
                      strokeDasharray: "0",
                      stroke: "#F5F0E8",
                      strokeWidth: 1
                    }
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
              );
            })()}
            </View>
            )}
          </View>
        </View>

        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

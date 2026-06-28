import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;

// Animated Dashed Circular Progress Dial (Native Driver Performant)
const DashedProgressDial = ({ size, strokeWidth, activeColor, inactiveColor, progress }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const numDashes = 22;
  const dashLength = circumference / numDashes * 0.7;
  const gapLength = circumference / numDashes * 0.3;
  
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 12000, // 12 seconds for a full rotation (ticking/moving feel)
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={{ width: size, height: size, position: 'absolute' }}>
      {/* Base Layer: Solid Progress Bar */}
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size/2}, ${size/2}`}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={inactiveColor} strokeWidth={strokeWidth} fill="transparent" />
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={activeColor} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={circumference - (progress * circumference)} strokeLinecap="round" />
        </G>
      </Svg>

      {/* Animated Overlay Layer: Rotating Gaps to create moving dashes illusion */}
      <Animated.View style={{ position: 'absolute', width: size, height: size, transform: [{ rotate: spin }] }}>
        <Svg width={size} height={size}>
          <Circle 
            cx={size / 2} cy={size / 2} r={radius} 
            stroke="#FFFFFF" // Matches the container background to cut out gaps
            strokeWidth={strokeWidth + 2} fill="transparent" 
            strokeDasharray={`${gapLength} ${dashLength}`} 
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

export function DashboardScreen() {
  return (
    <View className="flex-1 bg-[#F9F6ED]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Watercolor Background Image */}
        <Image 
          source={require('../../assets/dashboard_bg.png')} 
          className="absolute w-full h-[550px] top-0 opacity-100"
          resizeMode="cover"
        />
        {/* Fading gradient overlay at bottom of image */}
        <View className="absolute w-full h-[550px] top-0 bg-white/10" />
        <View className="absolute w-full h-32 top-[450px] bg-[#F9F6ED]" style={{ shadowColor: '#F9F6ED', shadowOffset: { width: 0, height: -30 }, shadowOpacity: 1, shadowRadius: 30, elevation: 10 }} />

        <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
          
          {/* Header Bar */}
          <View className="flex-row items-start justify-between px-6 pt-2">
            {/* Left: Profile */}
            <View className="flex-row items-center space-x-3">
              <View className="w-12 h-12 rounded-full bg-[#4A7A3A] items-center justify-center shadow-sm border border-green-700/20">
                <Ionicons name="leaf" size={24} color="white" />
              </View>
              {/* Increased padding to prevent squishing */}
              <View className="bg-white/80 px-3 py-1.5 rounded-xl shadow-sm">
                <Text className="text-[#3C3836] text-[10px] font-bold uppercase tracking-wider">Hello,</Text>
                <Text className="text-[#3C3836] font-black text-sm">Anu</Text>
              </View>
            </View>

            {/* Center: Home Title */}
            <View className="items-center absolute left-0 right-0 top-5" style={{ zIndex: -1 }}>
              <View className="items-center flex-col bg-white/80 px-4 py-1.5 rounded-2xl shadow-sm">
                <Ionicons name="leaf" size={14} color="#4A7A3A" />
                <Text className="text-[#5b4632] font-bold text-sm mt-0.5">Home</Text>
              </View>
            </View>

            {/* Right: Controls */}
            <View className="space-y-4">
              <TouchableOpacity className="w-12 h-12 rounded-full bg-[#604a36] items-center justify-center shadow-md">
                <Ionicons name="settings-sharp" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main 7 Days Progress Dial - Shrunk to relieve congestion */}
          <View className="items-center mt-12">
            <View className="w-36 h-36 items-center justify-center relative bg-white rounded-full shadow-lg border border-[#ede7d7]">
              {/* Progress dial: 7 out of 7 days = 100% (1.0). Ticking animation active! */}
              <DashedProgressDial 
                size={144} 
                strokeWidth={10} 
                activeColor="#4A7A3A" 
                inactiveColor="#d4d4ca" 
                progress={1.0} 
              />
              
              {/* Decorative Leaves on border */}
              <View className="absolute -top-1 right-5 bg-white p-1 rounded-full shadow-sm border border-gray-100">
                <Ionicons name="leaf" size={16} color="#4A7A3A" />
              </View>
              <View className="absolute -bottom-1 right-10 bg-white p-1 rounded-full shadow-sm border border-gray-100">
                <Ionicons name="leaf" size={16} color="#4A7A3A" />
              </View>
              
              <Text className="text-5xl font-black text-[#2e2b29] mt-2">7</Text>
              <Text className="text-[#5b4632] font-bold tracking-widest mt-1 text-[10px]">DAYS</Text>
            </View>
          </View>

          {/* Status Label */}
          <View className="items-center mt-12">
            {/* Much bolder, larger text for legibility, solid pill */}
            <View className="bg-white/95 px-6 py-3 rounded-2xl shadow-md border border-[#ede7d7]">
              <Text className="text-[#2A2421] font-black tracking-widest text-sm text-center">
                7 DAYS TO COMPOST REMAINING
              </Text>
            </View>
            
            <View className="flex-row items-center bg-white/90 px-6 py-2.5 rounded-full mt-3 shadow-sm border border-[#ede7d7]">
              <Text className="text-[#604a36] font-bold text-[10px] tracking-wider mr-2">STATUS:</Text>
              <View className="w-3 h-3 rounded-full bg-[#4A7A3A] mr-2 shadow-sm" />
              <Text className="text-[#4A7A3A] font-bold text-[10px] tracking-wider">ALL GOING WELL</Text>
            </View>
          </View>

          {/* Stats Section */}
          <View className="px-6 mt-14">
            <Text className="text-[#3C3836] font-black text-xl mb-1">Stats</Text>
            <Text className="text-[#8e8578] font-bold text-[10px] tracking-widest mb-4 uppercase">LAST CALCULATED - SEP</Text>

            <View className="flex-row justify-between space-x-4">
              {/* Waste Reduced Card */}
              <View className="flex-1 bg-[#FDFCF9] rounded-2xl p-4 shadow-sm border border-[#ede7d7]">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-full bg-[#dbe8d1] items-center justify-center mr-2 border border-[#a9c999]">
                    <Ionicons name="leaf" size={20} color="#4A7A3A" />
                  </View>
                  <Text className="text-[#604a36] font-bold text-[9px] flex-1 leading-tight uppercase">Waste Reduced</Text>
                </View>
                <Text className="text-[#2e2b29] font-black text-2xl text-center mt-1">6.2 kg</Text>
              </View>

              {/* CO2 Avoided Card */}
              <View className="flex-1 bg-[#FDFCF9] rounded-2xl p-4 shadow-sm border border-[#ede7d7]">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-full bg-white items-center justify-center mr-2 border border-[#d6cfc1] shadow-sm">
                    <Ionicons name="cloud-outline" size={20} color="#3C3836" />
                  </View>
                  <Text className="text-[#604a36] font-bold text-[9px] flex-1 leading-tight uppercase">CO2 Avoided</Text>
                </View>
                <Text className="text-[#2e2b29] font-black text-2xl text-center mt-1">402 kg</Text>
              </View>
            </View>
          </View>

          {/* Streak Section */}
          <View className="px-6 mt-10">
            <View className="flex-row items-center mb-1">
              <Ionicons name="leaf" size={16} color="#65a30d" />
              <Text className="text-[#3C3836] font-black text-xl ml-2">Streak</Text>
            </View>
            <Text className="text-[#8e8578] font-bold text-[10px] tracking-widest mb-4 uppercase">Last 6 months compost made</Text>

            <View className="bg-[#F8F5EE] rounded-3xl p-4 shadow-sm border border-[#e5dfce] items-center pb-6">
              <LineChart
                data={{
                  labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"],
                  datasets: [
                    {
                      data: [1.8, 2.9, 2.8, 3.8, 2.5, 3.4],
                    }
                  ]
                }}
                width={screenWidth - 80}
                height={200}
                yAxisSuffix=" kg"
                yAxisInterval={1} 
                withInnerLines={true}
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLines={true}
                withVerticalLabels={true}
                chartConfig={{
                  backgroundColor: "#F8F5EE",
                  backgroundGradientFrom: "#F8F5EE",
                  backgroundGradientTo: "#F8F5EE",
                  decimalPlaces: 1, 
                  color: (opacity = 1) => `rgba(109, 152, 62, 1)`,
                  labelColor: (opacity = 1) => `rgba(142, 133, 120, 1)`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: "4", 
                    strokeWidth: "2",
                    stroke: "#F8F5EE"
                  },
                  fillShadowGradientFrom: "#6D983E",
                  fillShadowGradientFromOpacity: 0.3,
                  fillShadowGradientTo: "#F8F5EE",
                  fillShadowGradientToOpacity: 0.1,
                  propsForBackgroundLines: {
                    strokeDasharray: "0",
                    stroke: "#e5dfce",
                    strokeWidth: 1
                  }
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                  marginLeft: -10
                }}
              />
            </View>
          </View>

        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

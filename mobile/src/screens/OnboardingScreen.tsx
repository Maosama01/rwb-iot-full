import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, SafeAreaView, TouchableOpacity, ScrollView, Animated, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Welcome to Rawbin',
    description: 'The smart, odorless composter that turns your kitchen scraps into nutrient-rich soil overnight.',
    isLogo: true,
    colors: ['#45C400', '#5ED600'],
  },
  {
    id: '2',
    title: 'Track Your Impact',
    description: 'Monitor your composting cycles in real-time and see exactly how much waste you’ve kept out of landfills.',
    icon: 'bar-chart',
    colors: ['#0EA5E9', '#38BDF8'],
  },
  {
    id: '3',
    title: 'Eco-Friendly Living',
    description: 'Join a community of environmentally conscious individuals making a tangible difference for our planet.',
    icon: 'earth',
    colors: ['#8B5CF6', '#A78BFA'],
  },
];

export function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<ScrollView>(null);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleMomentumScrollEnd = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(slideIndex);
  };

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      slidesRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
    } else {
      await finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('has_seen_onboarding', 'true');
      // Navigate to Login (App.tsx will handle the rest based on auth state, but we route to Login first)
      navigation.replace('Login');
    } catch (error) {
      console.log('Error setting onboarding flag', error);
      navigation.replace('Login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={finishOnboarding}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={{ flex: 3 }}>
        <ScrollView
          ref={slidesRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={handleScroll}
          scrollEventThrottle={32}
          onMomentumScrollEnd={handleMomentumScrollEnd}
        >
          {SLIDES.map((item) => {
            return (
              <View style={styles.slide} key={item.id}>
                <View style={styles.iconWrapper}>
                  <LinearGradient
                    colors={item.colors as [string, string]}
                    style={styles.iconCircle}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {(item as any).isLogo ? (
                      <Image 
                        source={require('../../assets/logo.png')} 
                        style={{ width: 100, height: 100, resizeMode: 'contain', tintColor: '#FFFFFF' }} 
                      />
                    ) : (
                      <Ionicons name={item.icon as any} size={80} color="#FFFFFF" />
                    )}
                  </LinearGradient>
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <View style={styles.paginatorContainer}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                style={[styles.dot, { width: dotWidth, opacity }]}
                key={i.toString()}
              />
            );
          })}
        </View>

        <TouchableOpacity activeOpacity={0.8} onPress={handleNext} style={styles.actionButtonContainer}>
          <LinearGradient colors={['#5ED600', '#45C400']} style={styles.actionButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.actionButtonText}>
              {currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 16,
    zIndex: 10,
  },
  skipText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: '#9CA3AF',
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: height * 0.1,
  },
  iconWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 48,
  },
  iconCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  title: {
    fontFamily: 'Nunito_800Black',
    fontSize: 28,
    color: '#1A330B',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 0 : 24,
  },
  paginatorContainer: {
    flexDirection: 'row',
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#45C400',
    marginHorizontal: 4,
  },
  actionButtonContainer: {
    marginBottom: 24,
    shadowColor: '#45C400',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  actionButton: {
    paddingVertical: 18,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontFamily: 'Nunito_800Black',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

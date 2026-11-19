import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ImageBackground, Animated, Easing } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WeatherMetrics } from '../../types/farmer.types';

interface FarmerWeatherCardProps {
  weather: WeatherMetrics;
  isFocused?: boolean;
}

export const FarmerWeatherCard: React.FC<FarmerWeatherCardProps> = ({ weather, isFocused = true }) => {
  // Continuous smooth sun rotation & gentle pulsing glow animation
  const sunRotation = useRef(new Animated.Value(0)).current;
  const sunPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const rotateAnim = Animated.loop(
      Animated.timing(sunRotation, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(sunPulse, {
          toValue: 1.15,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sunPulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    if (isFocused) {
      rotateAnim.start();
      pulseAnim.start();
    } else {
      rotateAnim.stop();
      pulseAnim.stop();
    }

    return () => {
      rotateAnim.stop();
      pulseAnim.stop();
    };
  }, [isFocused]);

  const spin = sunRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ImageBackground
      source={require('../../../assets/images/farmer_weather_bg.jpg')}
      style={styles.cardContainer}
      imageStyle={styles.cardImage}
      resizeMode="cover"
    >
      {/* 1. Gradient / Vignette Overlay Scrim: Darker at top and bottom for contrast, translucent in middle */}
      <View style={styles.topVignette} pointerEvents="none" />
      <View style={styles.centerTranslucent} pointerEvents="none" />
      <View style={styles.bottomVignette} pointerEvents="none" />

      {/* 2. Top Location Pill (Frosted Glass with light border) */}
      <View style={styles.locationHeaderRow}>
        <View style={styles.locationTag}>
          <Feather name="map-pin" size={12} color="#D6F0D9" style={styles.iconGlow} />
          <Text style={styles.locationText}>
            {weather.location} · {weather.farmerType}
          </Text>
        </View>
      </View>

      {/* 3. Main Temp & Condition Weather Row with Frosted Backdrop Pods */}
      <View style={styles.temperatureRow}>
        {/* Highlighted Temperature Pill Container */}
        <View style={styles.tempHighlightPill}>
          <Text style={styles.tempValue}>{weather.temperatureC}</Text>
          <Text style={styles.tempDegree}>°C</Text>
        </View>

        {/* Highlighted Weather Status Pod with Animated Rotating & Pulsing Sun */}
        <View style={styles.weatherRightPod}>
          <View style={styles.sunAnimationWrapper}>
            {/* Soft radiant ambient glow halo */}
            <Animated.View style={[styles.sunHalo, { transform: [{ scale: sunPulse }] }]} />

            {/* Rotating Sun vector icon */}
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Feather name="sun" size={26} color="#FFE066" style={styles.sunIcon} />
            </Animated.View>
          </View>

          <Text style={styles.conditionText}>{weather.weatherCondition}</Text>
          <Text style={styles.highLowText}>
            H {weather.highTempC}° · L {weather.lowTempC}°
          </Text>
        </View>
      </View>

      {/* 4. Center Spacer displaying the clean background clearly */}
      <View style={styles.centerSpacer} />

      {/* 5. Bottom Frosted-Glass Stats Panel */}
      <View style={styles.glassMetricsRow}>
        {/* Metric 1: Humidity */}
        <View style={styles.metricColumn}>
          <Ionicons name="water-outline" size={18} color="#C4ECCB" style={styles.statIcon} />
          <Text style={styles.metricValue}>{weather.humidityPercent}%</Text>
          <Text style={styles.metricLabel}>Humidity</Text>
        </View>

        <View style={styles.metricDivider} />

        {/* Metric 2: Precipitation */}
        <View style={styles.metricColumn}>
          <Ionicons name="rainy-outline" size={18} color="#C4ECCB" style={styles.statIcon} />
          <Text style={styles.metricValue}>{weather.precipitationPercent}%</Text>
          <Text style={styles.metricLabel}>Precip.</Text>
        </View>

        <View style={styles.metricDivider} />

        {/* Metric 3: Wind */}
        <View style={styles.metricColumn}>
          <MaterialCommunityIcons name="weather-windy" size={18} color="#C4ECCB" style={styles.statIcon} />
          <Text style={styles.metricValue}>{weather.windSpeedKmh} km/h</Text>
          <Text style={styles.metricLabel}>Wind</Text>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 28,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E3C25',
  },
  cardImage: {
    borderRadius: 28,
  },
  // Multi-tier scrim gradient overlay for optimal photo visibility + text legibility
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '44%',
    backgroundColor: 'rgba(6, 18, 9, 0.45)', // Soft top scrim
  },
  centerTranslucent: {
    position: 'absolute',
    top: '44%',
    left: 0,
    right: 0,
    height: '22%',
    backgroundColor: 'transparent',
  },
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '34%',
    backgroundColor: 'rgba(6, 18, 9, 0.45)',
  },

  // Location pill
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 2,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 24, 12, 0.72)', // Frosted dark glass tint
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 6,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.28)', // Clear glass border
  },
  locationText: {
    color: '#EAF6EC',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  iconGlow: {
    textShadowColor: 'rgba(124, 217, 88, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Temperature Row with highlighted pods
  temperatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
    zIndex: 2,
  },
  // Frosted pod for Temperature highlight
  tempHighlightPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(5, 20, 10, 0.75)', // High contrast frosted pod
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  tempValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Georgia',
    lineHeight: 52,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  tempDegree: {
    fontSize: 22,
    color: '#C6F6D5', // Bright refreshing mint accent
    fontWeight: '700',
    marginTop: 5,
    marginLeft: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Frosted pod for Weather condition & animated Sun
  weatherRightPod: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(5, 20, 10, 0.75)', // High contrast frosted pod
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  sunAnimationWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  sunHalo: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 213, 79, 0.28)', // Soft pulsing ambient aura
  },
  sunIcon: {
    textShadowColor: 'rgba(255, 204, 0, 0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  conditionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  highLowText: {
    color: '#D4EED8',
    fontSize: 11,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Center space displaying clean hands background
  centerSpacer: {
    height: 76,
  },

  // Bottom Frosted Glass Stats Panel
  glassMetricsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(6, 22, 11, 0.82)', // Deep frosted glass fill for maximum clarity
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.26)', // Crisp light glass border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 2,
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metricLabel: {
    color: '#C8ECCF', // Clear mint label
    fontSize: 11,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
});

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Animated,
  Easing,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FarmerWeatherCard } from '../../src/components/farmer/FarmerWeatherCard';
import { FieldCard } from '../../src/components/farmer/FieldCard';
import { PhotoOptionsModal } from '../../src/components/farmer/PhotoOptionsModal';
import {
  mockFarmerProfile,
  mockWeatherMetrics,
  mockFarmerStats,
  mockQuickFeatures,
  mockFields,
} from '../../src/constants/farmerMockData';
import { FieldItem } from '../../src/types/farmer.types';

export default function FarmerHomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  // Ensure the plant growth animation and loop run reliably on dashboard
  const isFocused = true;

  // Fields, Category filter, and Photo picker state
  const [fields, setFields] = useState<FieldItem[]>(mockFields);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedFieldForPhoto, setSelectedFieldForPhoto] = useState<FieldItem | null>(null);

  const categories = ['All', 'Carrots', 'Vegetable', 'Fruit'];

  // Staggered Entrance Animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-15)).current;
  const weatherFade = useRef(new Animated.Value(0)).current;
  const weatherSlide = useRef(new Animated.Value(20)).current;
  const statsFade = useRef(new Animated.Value(0)).current;
  const statsSlide = useRef(new Animated.Value(20)).current;
  const actionsFade = useRef(new Animated.Value(0)).current;
  const actionsSlide = useRef(new Animated.Value(25)).current;

  // Summary numbers count-up animated values
  const countCropsAnim = useRef(new Animated.Value(0)).current;
  const countRecordsAnim = useRef(new Animated.Value(0)).current;
  const countHarvestAnim = useRef(new Animated.Value(0)).current;

  const [displayCrops, setDisplayCrops] = useState(0);
  const [displayRecords, setDisplayRecords] = useState(0);
  const [displayHarvest, setDisplayHarvest] = useState(0);

  // Button Press Feedback Animations
  const recordBtnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Staggered section entrances
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(headerSlide, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(weatherFade, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(weatherSlide, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(statsFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(statsSlide, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(actionsFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(actionsSlide, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    // 2. Count-up animation listeners
    countCropsAnim.addListener(({ value }) => setDisplayCrops(Math.round(value)));
    countRecordsAnim.addListener(({ value }) => setDisplayRecords(Math.round(value)));
    countHarvestAnim.addListener(({ value }) => setDisplayHarvest(Math.round(value)));

    Animated.parallel([
      Animated.timing(countCropsAnim, {
        toValue: mockFarmerStats.activeCrops,
        duration: 900,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(countRecordsAnim, {
        toValue: mockFarmerStats.recordsMonthCount,
        duration: 1100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(countHarvestAnim, {
        toValue: mockFarmerStats.readyToHarvestCount,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();

    return () => {
      countCropsAnim.removeAllListeners();
      countRecordsAnim.removeAllListeners();
      countHarvestAnim.removeAllListeners();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // TODO: Connect to Supabase to refetch farmer stats, weather, and harvests
    setTimeout(() => {
      setRefreshing(false);
    }, 1200);
  };

  const handlePressInRecord = () => {
    Animated.spring(recordBtnScale, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOutRecord = () => {
    Animated.spring(recordBtnScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  const handleAddRecord = () => {
    // Navigate to live photo evidence capture
    router.push('/(farmer)/harvests/new');
  };

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'You have 1 harvest alert and 2 new orders waiting for review.');
  };

  const handleSearchPress = () => {
    Alert.alert('Search', 'Search through crops, cultivation stages, batches, and records.');
  };

  // Photo change modal handlers
  const handleOpenPhotoModal = (field: FieldItem) => {
    setSelectedFieldForPhoto(field);
    setPhotoModalVisible(true);
  };

  const handleTakePhoto = async () => {
    if (!selectedFieldForPhoto) return;
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Camera Access Required',
          'Please allow camera access in your device settings to take a photo of your field.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUri = result.assets[0].uri;
        // Update local state with newly taken photo
        // TODO: Upload to Supabase Storage and persist URL in database
        setFields((prev) =>
          prev.map((f) => (f.id === selectedFieldForPhoto.id ? { ...f, imageUrl: newUri } : f))
        );
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Could not open camera. Please try again.');
    }
  };

  const handleChooseFromGallery = async () => {
    if (!selectedFieldForPhoto) return;
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Photo Library Access Required',
          'Please allow photo library access in your device settings to select a field photo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUri = result.assets[0].uri;
        // Update local state with selected photo
        // TODO: Upload to Supabase Storage and persist URL in database
        setFields((prev) =>
          prev.map((f) => (f.id === selectedFieldForPhoto.id ? { ...f, imageUrl: newUri } : f))
        );
      }
    } catch (error) {
      console.error('Error choosing photo:', error);
      Alert.alert('Error', 'Could not select photo from gallery. Please try again.');
    }
  };

  const handleRemovePhoto = () => {
    if (!selectedFieldForPhoto) return;
    // Reset photo for selected field
    // TODO: Upload to Supabase Storage / remove from database
    setFields((prev) =>
      prev.map((f) => (f.id === selectedFieldForPhoto.id ? { ...f, imageUrl: undefined } : f))
    );
  };

  const handleNavigateToJourney = (field: FieldItem) => {
    router.push({
      pathname: '/(farmer)/harvests/[id]',
      params: { id: field.id },
    });
  };

  const filteredFields =
    selectedCategory === 'All'
      ? fields
      : fields.filter(
          (f) =>
            f.category?.toLowerCase() === selectedCategory.toLowerCase() ||
            f.cropName.toLowerCase().includes(selectedCategory.toLowerCase())
        );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4EFE6" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E3C25" />
        }
      >
        {/* 1. Header Greeting Section */}
        <Animated.View
          style={[
            styles.headerRow,
            {
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
            },
          ]}
        >
          <View style={styles.headerLeft}>
            {/* Farmer Avatar with green border ring */}
            <TouchableOpacity
              style={styles.avatarBorder}
              activeOpacity={0.8}
              onPress={() => router.push('/(farmer)/profile')}
            >
              <Image
                source={{ uri: mockFarmerProfile.avatarUrl }}
                style={styles.avatarImg}
              />
            </TouchableOpacity>

            <View style={styles.greetingTextGroup}>
              <Text style={styles.welcomeSub}>Welcome back! 🍃</Text>
              <Text style={styles.farmerName}>{mockFarmerProfile.fullName}</Text>
            </View>
          </View>

          {/* Top-Right Circular Action Icons */}
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.circleIconBtn}
              activeOpacity={0.7}
              onPress={handleSearchPress}
            >
              <Feather name="search" size={18} color="#203E26" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleIconBtn}
              activeOpacity={0.7}
              onPress={handleNotificationPress}
            >
              <Feather name="bell" size={18} color="#203E26" />
              {/* Notification orange indicator dot */}
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 2. Top Weather & Growing Plant Animation Hero Card */}
        <Animated.View
          style={[
            styles.weatherCardWrapper,
            {
              opacity: weatherFade,
              transform: [{ translateY: weatherSlide }],
            },
          ]}
        >
          <FarmerWeatherCard weather={mockWeatherMetrics} isFocused={isFocused} />
        </Animated.View>

        {/* 3. Three Summary Metrics Cards (Active crops, Records, Ready to harvest) */}
        <Animated.View
          style={[
            styles.statsRow,
            {
              opacity: statsFade,
              transform: [{ translateY: statsSlide }],
            },
          ]}
        >
          {/* Card 1: Active crops */}
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#165B2D' }]}>{displayCrops}</Text>
            <Text style={styles.statLabel}>Active crops</Text>
          </View>

          {/* Card 2: Records · Month */}
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#183820' }]}>{displayRecords}</Text>
            <Text style={styles.statLabel}>Records · {mockFarmerStats.monthName}</Text>
          </View>

          {/* Card 3: Ready to harvest */}
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#E46724' }]}>{displayHarvest}</Text>
            <Text style={[styles.statLabel, { color: '#3A523E' }]}>Ready to harvest</Text>
          </View>
        </Animated.View>

        {/* 4. Large Action Card: "Add a record" */}
        <Animated.View
          style={[
            styles.addRecordWrapper,
            {
              opacity: actionsFade,
              transform: [{ translateY: actionsSlide }],
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: recordBtnScale }] }}>
            <TouchableOpacity
              style={styles.addRecordCard}
              activeOpacity={0.9}
              onPressIn={handlePressInRecord}
              onPressOut={handlePressOutRecord}
              onPress={handleAddRecord}
            >
              <View style={styles.cameraIconCircle}>
                <Ionicons name="camera-outline" size={24} color="#16351E" />
              </View>

              <View style={styles.addRecordTextGroup}>
                <Text style={styles.addRecordTitle}>Add a record</Text>
                <Text style={styles.addRecordSubtitle}>
                  Capture live photo evidence of today's work
                </Text>
              </View>

              <View style={styles.diagonalArrowCircle}>
                <Feather name="arrow-up-right" size={18} color="#D6EBD9" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* 5. Three Rounded Quick Action Cards (Crops, Trace, Supplier catalogue) */}
        <Animated.View
          style={[
            styles.quickFeaturesRow,
            {
              opacity: actionsFade,
              transform: [{ translateY: actionsSlide }],
            },
          ]}
        >
          {mockQuickFeatures.map((item) => {
            const cardScale = new Animated.Value(1);

            const handlePressIn = () => {
              Animated.spring(cardScale, {
                toValue: 0.94,
                useNativeDriver: true,
                speed: 30,
                bounciness: 6,
              }).start();
            };

            const handlePressOut = () => {
              Animated.spring(cardScale, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
              }).start();
            };

            const handleCardPress = () => {
              if (item.route) {
                router.push(item.route as any);
              }
            };

            return (
              <Animated.View
                key={item.id}
                style={[
                  styles.featureCardWrapper,
                  { transform: [{ scale: cardScale }] },
                ]}
              >
                <TouchableOpacity
                  style={[styles.featureCard, { backgroundColor: item.bgTint }]}
                  activeOpacity={0.88}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handleCardPress}
                >
                  <View style={styles.featureTopRow}>
                    <View style={[styles.featureIconBadge, { backgroundColor: item.themeColor }]}>
                      <MaterialCommunityIcons
                        name={item.iconName as any}
                        size={18}
                        color="#FFFFFF"
                      />
                    </View>
                    <View style={styles.featureArrow}>
                      <Feather name="arrow-up-right" size={13} color="#2D4D33" />
                    </View>
                  </View>

                  <View style={styles.featureBottom}>
                    <Text style={styles.featureTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.subtextRow}>
                      {item.badgeDotColor ? (
                        <View style={[styles.statusDot, { backgroundColor: item.badgeDotColor }]} />
                      ) : null}
                      <Text style={styles.featureSubtext}>{item.subtext}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* 6. Section: "My Fields" */}
        <Animated.View
          style={[
            styles.myFieldsSection,
            {
              opacity: actionsFade,
              transform: [{ translateY: actionsSlide }],
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>My Fields</Text>
            <TouchableOpacity
              style={styles.seeAllBtn}
              activeOpacity={0.7}
              onPress={() => router.push('/(farmer)/crops')}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Feather name="chevron-right" size={14} color="#5D7A65" />
            </TouchableOpacity>
          </View>

          {/* Filter Pills: All, Carrots, Vegetable, Fruit */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsContainer}
            style={styles.filterScrollView}
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Horizontal Snapping Field Cards List */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalFieldsContainer}
            snapToInterval={230}
            decelerationRate="fast"
          >
            {filteredFields.map((field) => (
              <FieldCard
                key={field.id}
                field={field}
                onPress={() => handleNavigateToJourney(field)}
                onChangePhotoPress={() => handleOpenPhotoModal(field)}
                onBookmarkPress={() => {
                  Alert.alert('Bookmark', `${field.cropName} (${field.plotName}) bookmarked!`);
                }}
              />
            ))}

            {/* "Add Field" Card at end of horizontal row */}
            <TouchableOpacity
              style={styles.addFieldCard}
              activeOpacity={0.8}
              onPress={() => router.push('/(farmer)/harvests/new')}
            >
              <View style={styles.addFieldIconCircle}>
                <Feather name="plus" size={24} color="#2D6B3C" />
              </View>
              <Text style={styles.addFieldTitle}>Add Field</Text>
              <Text style={styles.addFieldSubtitle}>Register a new crop plot</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* Extra Bottom Spacer for floating bottom tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Photo Change Options Modal */}
      <PhotoOptionsModal
        visible={photoModalVisible}
        fieldName={selectedFieldForPhoto?.plotName || selectedFieldForPhoto?.cropName || 'Field'}
        hasPhoto={!!selectedFieldForPhoto?.imageUrl}
        onClose={() => setPhotoModalVisible(false)}
        onTakePhoto={handleTakePhoto}
        onChooseFromGallery={handleChooseFromGallery}
        onRemovePhoto={handleRemovePhoto}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4EFE6', // Warm earthy parchment tone matching screenshot
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 90,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#2D6B3C',
    padding: 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  greetingTextGroup: {
    justifyContent: 'center',
  },
  welcomeSub: {
    fontSize: 12,
    color: '#657E6B',
    fontWeight: '500',
    marginBottom: 2,
  },
  farmerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#15321B',
    fontFamily: 'Georgia',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E86629',
  },
  weatherCardWrapper: {
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center', // Center justify contents horizontally
    justifyContent: 'center', // Center justify contents vertically
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1.2,
    borderColor: '#E8E5DC',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Georgia',
    textAlign: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11.5,
    color: '#3D5943', // Darker, crisper green-slate text for high contrast and readability
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 15,
  },
  addRecordWrapper: {
    marginBottom: 14,
  },
  addRecordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C3A24', // Deep green pill card
    borderRadius: 26,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  cameraIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#A6CFA8', // Mint icon badge
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  addRecordTextGroup: {
    flex: 1,
  },
  addRecordTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  addRecordSubtitle: {
    color: '#9EBEA3',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  diagonalArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  quickFeaturesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    alignItems: 'stretch',
  },
  featureCardWrapper: {
    flex: 1,
  },
  featureCard: {
    flex: 1,
    height: 126, // Exact uniform height for all 3 cards
    borderRadius: 22,
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  featureTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  featureArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  featureBottom: {
    justifyContent: 'flex-end',
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16311D',
    marginBottom: 2,
    height: 32, // Accommodates both 1-line and 2-line labels identically
    lineHeight: 15,
  },
  subtextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  featureSubtext: {
    fontSize: 10,
    color: '#657E6B',
    fontWeight: '500',
  },
  myFieldsSection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16351E',
    fontFamily: 'Georgia',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 3,
    borderWidth: 1,
    borderColor: '#ECEAE2',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5D7A65',
  },
  filterScrollView: {
    marginBottom: 14,
  },
  filterPillsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 10,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  filterPillActive: {
    backgroundColor: '#1E3C25',
    borderColor: '#1E3C25',
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#556D59',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  horizontalFieldsContainer: {
    paddingRight: 10,
    paddingBottom: 6,
    alignItems: 'center',
  },
  addFieldCard: {
    width: 170,
    height: 236,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#C8D6C9',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(235, 244, 237, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginRight: 10,
  },
  addFieldIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  addFieldTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16351E',
    marginBottom: 4,
    textAlign: 'center',
  },
  addFieldSubtitle: {
    fontSize: 11,
    color: '#657E6B',
    textAlign: 'center',
    lineHeight: 15,
  },
  bottomSpacer: {
    height: 35,
  },
});

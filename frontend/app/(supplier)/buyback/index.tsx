import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  ImageSourcePropType,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BuybackAgreement,
  BuybackProgram,
  BuybackProgramStatus,
  contractsService,
  FarmerOption,
} from '../../../src/services/contracts.service';
import { useAuth } from '../../../src/store/authStore';
import { useDarkMode } from '../../../src/store/uiStore';

type MainSegment = 'programs' | 'agreements';
type AgreementFilter = 'All' | 'Pending' | 'Active' | 'Fulfilled';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

const AVAILABLE_INPUT_CHIPS = [
  'Seeds',
  'NPK',
  'Pesticides',
  'Fungicide',
  'Fertilizer',
  'Bio-Control',
];

const COVER_PRESETS: {
  key: string;
  label: string;
  source: ImageSourcePropType;
}[] = [
  {
    key: 'tomato',
    label: 'Tomato',
    source: require('../../../assets/images/supplier_tomato_seeds.jpg'),
  },
  {
    key: 'onion',
    label: 'Seedlings',
    source: require('../../../assets/images/supplier_seed_sack.jpg'),
  },
  {
    key: 'chilli',
    label: 'Greenhouse',
    source: require('../../../assets/images/supplier_profile_greenhouse.jpg'),
  },
  {
    key: 'fertilizer',
    label: 'Inputs',
    source: require('../../../assets/images/supplier_fertilizer.jpg'),
  },
  {
    key: 'hero',
    label: 'Nursery',
    source: require('../../../assets/images/supplier_hero_banner.jpg'),
  },
];

const PROGRAM_TEMPLATES = [
  {
    label: 'Tomato F1',
    cropName: 'Tomato F1',
    price: '150',
    maxFarmers: '20',
    expectedKg: '500',
    inputs: ['Seeds', 'NPK', 'Pesticides'],
    coverKey: 'tomato',
  },
  {
    label: 'Big Onion',
    cropName: 'Big Onion',
    price: '200',
    maxFarmers: '10',
    expectedKg: '400',
    inputs: ['Seeds', 'Fungicide'],
    coverKey: 'onion',
  },
  {
    label: 'Green Chilli',
    cropName: 'Green Chilli',
    price: '350',
    maxFarmers: '15',
    expectedKg: '300',
    inputs: ['Seeds', 'Fertilizer'],
    coverKey: 'chilli',
  },
];

function getCoverSource(coverKey?: string, coverUrl?: string): ImageSourcePropType {
  if (coverUrl && coverUrl.startsWith('http')) {
    return { uri: coverUrl };
  }
  const match = COVER_PRESETS.find((p) => p.key === coverKey);
  return match ? match.source : COVER_PRESETS[0].source;
}

function getInputChipIcon(label: string): keyof typeof MaterialCommunityIcons.glyphMap {
  const lower = label.toLowerCase();
  if (lower.includes('seed')) return 'seed-outline';
  if (lower.includes('npk') || lower.includes('fert')) return 'sack';
  if (lower.includes('pest') || lower.includes('fungi') || lower.includes('bio')) {
    return 'spray-bottle';
  }
  return 'package-variant-closed';
}

function formatExpectedWeight(totalKg: number): string {
  if (totalKg <= 0) return '0kg';
  if (totalKg >= 1000) {
    const tons = (totalKg / 1000).toFixed(1).replace(/\.0$/, '');
    return `${tons}t`;
  }
  return `${Math.round(totalKg)}kg`;
}

export default function SupplierBuybackScreen() {
  const [isDark] = useDarkMode();
  const { user } = useAuth();
  const userId = user?.id;

  const [segment, setSegment] = useState<MainSegment>('programs');
  const [programs, setPrograms] = useState<BuybackProgram[]>([]);
  const [agreements, setAgreements] = useState<BuybackAgreement[]>([]);
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Agreements filter
  const [agreementFilter, setAgreementFilter] = useState<AgreementFilter>('All');

  // Create / Edit Program Modal State
  const [programModalVisible, setProgramModalVisible] = useState(false);
  const [editingProgram, setEditingProgram] = useState<BuybackProgram | null>(null);
  const [progCropName, setProgCropName] = useState('');
  const [progPrice, setProgPrice] = useState('');
  const [progExpectedKg, setProgExpectedKg] = useState('');
  const [progMaxFarmers, setProgMaxFarmers] = useState('15');
  const [progEnrolledFarmers, setProgEnrolledFarmers] = useState('0');
  const [progInputs, setProgInputs] = useState<string[]>(['Seeds', 'NPK']);
  const [progCoverKey, setProgCoverKey] = useState('tomato');
  const [progNotes, setProgNotes] = useState('');
  const [isSavingProgram, setIsSavingProgram] = useState(false);

  // Create Agreement Modal State
  const [agreementModalVisible, setAgreementModalVisible] = useState(false);
  const [cropName, setCropName] = useState('');
  const [targetQuantity, setTargetQuantity] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [isCreatingAgreement, setIsCreatingAgreement] = useState(false);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!userId) {
        setPrograms([]);
        setAgreements([]);
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (isRefresh) setRefreshing(true);
        else setIsLoading(true);

        const [programRows, agreementRows, farmerRows] = await Promise.all([
          contractsService.getSupplierPrograms(userId),
          contractsService.getSupplierBuybacks(userId),
          contractsService.getAvailableFarmers(),
        ]);

        setPrograms(programRows);
        setAgreements(agreementRows);
        setFarmers(farmerRows);
      } catch (err) {
        console.warn('[SupplierBuyback] Error loading buyback data:', err);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [userId]
  );

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  useEffect(() => {
    if (!userId) return;

    const unsubPrograms = contractsService.subscribeToPrograms(userId, () => {
      void loadData(true);
    });
    const unsubAgreements = contractsService.subscribeToBuybacks(userId, () => {
      void loadData(true);
    });

    return () => {
      unsubPrograms();
      unsubAgreements();
    };
  }, [userId, loadData]);

  const onRefresh = () => {
    void loadData(true);
  };

  // Hero Stats combining live Programs and Agreements
  const heroStats = useMemo(() => {
    const activePrograms = programs.filter((p) => p.status === 'active');
    const activeAgreements = agreements.filter((a) => a.status === 'active');

    const activeCount =
      programs.length > 0 ? activePrograms.length : activeAgreements.length;

    const programFarmers = programs.reduce((sum, p) => sum + (p.enrolledFarmers || 0), 0);
    const agreementFarmers = new Set(
      agreements.filter((a) => a.status !== 'cancelled').map((a) => a.farmerId)
    ).size;
    const totalFarmers = programFarmers > 0 ? programFarmers : agreementFarmers;

    const programExpectedKg = programs
      .filter((p) => p.status !== 'closed')
      .reduce((sum, p) => sum + (p.expectedVolumeKg || 0), 0);
    const agreementExpectedKg = agreements
      .filter((a) => a.status !== 'cancelled')
      .reduce((sum, a) => sum + (a.targetQuantity || 0), 0);
    const expectedKg = programExpectedKg > 0 ? programExpectedKg : agreementExpectedKg;

    return {
      activeCount,
      totalFarmers,
      expectedLabel: formatExpectedWeight(expectedKg),
    };
  }, [programs, agreements]);

  const filteredAgreements = useMemo(() => {
    if (agreementFilter === 'All') return agreements;
    return agreements.filter(
      (a) => a.status.toLowerCase() === agreementFilter.toLowerCase()
    );
  }, [agreements, agreementFilter]);

  // ── Program Modal Helpers ────────────────────────────────────────

  const openCreateProgramModal = () => {
    setEditingProgram(null);
    setProgCropName('');
    setProgPrice('');
    setProgExpectedKg('500');
    setProgMaxFarmers('15');
    setProgEnrolledFarmers('0');
    setProgInputs(['Seeds', 'NPK']);
    setProgCoverKey('tomato');
    setProgNotes('');
    setProgramModalVisible(true);
  };

  const openEditProgramModal = (program: BuybackProgram) => {
    setEditingProgram(program);
    setProgCropName(program.cropName);
    setProgPrice(String(program.buybackPrice));
    setProgExpectedKg(String(program.expectedVolumeKg || 0));
    setProgMaxFarmers(String(program.maxFarmers || 10));
    setProgEnrolledFarmers(String(program.enrolledFarmers || 0));
    setProgInputs(program.includedInputs.length > 0 ? program.includedInputs : ['Seeds']);
    setProgCoverKey(program.coverImageKey || 'tomato');
    setProgNotes(program.notes || '');
    setProgramModalVisible(true);
  };

  const applyTemplate = (tpl: (typeof PROGRAM_TEMPLATES)[number]) => {
    setProgCropName(tpl.cropName);
    setProgPrice(tpl.price);
    setProgMaxFarmers(tpl.maxFarmers);
    setProgExpectedKg(tpl.expectedKg);
    setProgInputs(tpl.inputs);
    setProgCoverKey(tpl.coverKey);
  };

  const toggleInputChip = (chip: string) => {
    setProgInputs((prev) =>
      prev.includes(chip) ? prev.filter((item) => item !== chip) : [...prev, chip]
    );
  };

  const handleSaveProgram = async (targetStatus?: BuybackProgramStatus) => {
    if (!userId) return;

    if (!progCropName.trim()) {
      Alert.alert('Validation Error', 'Please enter the crop variety or name.');
      return;
    }
    const parsedPrice = parseFloat(progPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid buy-back price (LKR/kg).');
      return;
    }
    const parsedMax = parseInt(progMaxFarmers, 10) || 10;
    const parsedEnrolled = parseInt(progEnrolledFarmers, 10) || 0;
    const parsedExpected = parseFloat(progExpectedKg) || 0;

    setIsSavingProgram(true);
    try {
      if (editingProgram) {
        const res = await contractsService.updateBuybackProgram(
          editingProgram.id,
          userId,
          {
            cropName: progCropName.trim(),
            buybackPrice: parsedPrice,
            expectedVolumeKg: parsedExpected,
            maxFarmers: Math.max(1, parsedMax),
            enrolledFarmers: Math.max(0, Math.min(Math.max(1, parsedMax), parsedEnrolled)),
            includedInputs: progInputs.length > 0 ? progInputs : ['Seeds'],
            coverImageKey: progCoverKey,
            status: targetStatus || editingProgram.status,
            notes: progNotes.trim() || undefined,
          }
        );

        if (res.success && res.program) {
          setPrograms((prev) =>
            prev.map((p) => (p.id === res.program!.id ? res.program! : p))
          );
          setProgramModalVisible(false);
        } else {
          Alert.alert('Update Failed', res.error || 'Could not update buy-back program.');
        }
      } else {
        const res = await contractsService.createBuybackProgram({
          supplierId: userId,
          cropName: progCropName.trim(),
          buybackPrice: parsedPrice,
          unit: 'kg',
          expectedVolumeKg: parsedExpected,
          maxFarmers: Math.max(1, parsedMax),
          enrolledFarmers: Math.max(0, Math.min(Math.max(1, parsedMax), parsedEnrolled)),
          includedInputs: progInputs.length > 0 ? progInputs : ['Seeds'],
          coverImageKey: progCoverKey,
          status: targetStatus || 'active',
          notes: progNotes.trim() || undefined,
        });

        if (res.success && res.program) {
          setPrograms((prev) => [res.program!, ...prev]);
          setProgramModalVisible(false);
        } else {
          Alert.alert('Creation Failed', res.error || 'Could not save buy-back program.');
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'An unexpected error occurred.');
    } finally {
      setIsSavingProgram(false);
    }
  };

  const handlePublishDraftProgram = async (program: BuybackProgram) => {
    if (!userId) return;
    const res = await contractsService.updateBuybackProgram(program.id, userId, {
      status: 'active',
    });
    if (res.success && res.program) {
      setPrograms((prev) =>
        prev.map((p) => (p.id === res.program!.id ? res.program! : p))
      );
      Alert.alert(
        'Program Published',
        `${program.cropName} (${program.programCode}) is now active for farmer enrollment.`
      );
    } else {
      Alert.alert('Publish Failed', res.error || 'Could not publish this draft program.');
    }
  };

  const handleDeleteProgram = (program: BuybackProgram) => {
    if (!userId) return;
    Alert.alert(
      'Delete Program',
      `Remove ${program.cropName} (${program.programCode}) from your Buy-Back Programs?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await contractsService.deleteBuybackProgram(program.id, userId);
            if (res.success) {
              setPrograms((prev) => prev.filter((p) => p.id !== program.id));
              setProgramModalVisible(false);
            } else {
              Alert.alert('Error', res.error || 'Could not delete program.');
            }
          },
        },
      ]
    );
  };

  // ── Agreement Modal Helpers ──────────────────────────────────────

  const openCreateAgreementModal = () => {
    setCropName('');
    setTargetQuantity('');
    setAgreedPrice('');
    setSelectedFarmerId(farmers[0]?.id || '');
    setDeadline('');
    setNotes('');
    setAgreementModalVisible(true);
  };

  const handleCreateAgreement = async () => {
    if (!userId) return;
    if (!cropName.trim()) {
      Alert.alert('Validation Error', 'Please enter a crop name.');
      return;
    }
    const qty = parseFloat(targetQuantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid target quantity.');
      return;
    }
    const price = parseFloat(agreedPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid agreed price per kg.');
      return;
    }
    if (!selectedFarmerId.trim()) {
      Alert.alert(
        'Partner Farmer Required',
        'Please select or enter a registered Farmer ID.'
      );
      return;
    }

    setIsCreatingAgreement(true);
    try {
      const res = await contractsService.createBuybackAgreement({
        supplierId: userId,
        farmerId: selectedFarmerId.trim(),
        cropName: cropName.trim(),
        targetQuantity: qty,
        unit: 'kg',
        agreedPrice: price,
        deadline: deadline.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (res.success && res.agreement) {
        setAgreements((prev) => [res.agreement!, ...prev]);
        setAgreementModalVisible(false);
        Alert.alert(
          'Agreement Created',
          `Forward buyback agreement ${res.agreement.agreementCode} has been registered.`
        );
      } else {
        Alert.alert('Creation Failed', res.error || 'Could not save buyback agreement.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'An unexpected error occurred.');
    } finally {
      setIsCreatingAgreement(false);
    }
  };

  const getAgreementStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return { bg: '#DCFCE7', text: '#15803D', label: 'Active' };
      case 'fulfilled':
        return { bg: '#DBEAFE', text: '#1E40AF', label: 'Fulfilled' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#B91C1C', label: 'Cancelled' };
      case 'pending':
      default:
        return { bg: '#FEF3C7', text: '#B45309', label: 'Pending' };
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.safeAreaDark]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#4ADE80' : '#1E462C'}
            colors={['#1E462C']}
          />
        }
      >
        {/* ── 1. Top Header Bar ───────────────────────────────────── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            accessibilityLabel="Back to Supplier Dashboard"
            style={[styles.circleBackBtn, isDark && styles.circleBackBtnDark]}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={22}
              color={isDark ? '#E8F3EA' : '#243628'}
            />
          </TouchableOpacity>

          <View style={styles.headerTitleBlock}>
            <View style={styles.eyebrowRow}>
              <Text style={[styles.eyebrowText, isDark && styles.eyebrowTextDark]}>
                Seed-to-harvest contracts
              </Text>
              <MaterialCommunityIcons
                name="sprout"
                size={13}
                color={isDark ? '#4ADE80' : '#4C8B4F'}
              />
            </View>

            <View style={styles.mainTitleLine}>
              <View style={styles.highlightWordWrap}>
                <View
                  style={[
                    styles.titleHighlighter,
                    isDark && styles.titleHighlighterDark,
                  ]}
                />
                <Text style={[styles.screenTitle, isDark && styles.screenTitleDark]}>
                  Buy-Back
                </Text>
              </View>
              <Text style={[styles.screenTitle, isDark && styles.screenTitleDark]}>
                {' '}
                Programs
              </Text>
            </View>
          </View>
        </View>

        {/* ── 2. Hero Promise Card ────────────────────────────────── */}
        <ImageBackground
          source={require('../../../assets/images/supplier_shelf_banner.jpg')}
          style={styles.heroCard}
          imageStyle={styles.heroCardImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[
              'rgba(18, 42, 24, 0.52)',
              'rgba(14, 34, 20, 0.76)',
              'rgba(10, 28, 15, 0.90)',
            ]}
            style={styles.heroGradient}
          >
            <View style={styles.heroTopTag}>
              <MaterialCommunityIcons
                name="map-marker-radius-outline"
                size={13}
                color="rgba(255,255,255,0.88)"
              />
              <Text style={styles.heroTopTagText}>Guaranteed purchase</Text>
            </View>

            <Text style={styles.heroHeadline}>
              You plant the promise,{' '}
              <Text style={styles.heroHeadlineItalic}>
                they{'\n'}grow the crop
              </Text>
            </Text>

            {/* Frosted 3-Column Metrics Pill */}
            <View style={styles.heroStatsGlass}>
              <View style={styles.heroStatCol}>
                <MaterialCommunityIcons
                  name="sprout-outline"
                  size={15}
                  color="rgba(255,255,255,0.85)"
                />
                <Text style={styles.heroStatValue}>{heroStats.activeCount}</Text>
                <Text style={styles.heroStatLabel}>Active</Text>
              </View>

              <View style={styles.heroStatDivider} />

              <View style={styles.heroStatCol}>
                <MaterialCommunityIcons
                  name="account-cowboy-hat-outline"
                  size={15}
                  color="rgba(255,255,255,0.85)"
                />
                <Text style={styles.heroStatValue}>{heroStats.totalFarmers}</Text>
                <Text style={styles.heroStatLabel}>Farmers</Text>
              </View>

              <View style={styles.heroStatDivider} />

              <View style={styles.heroStatCol}>
                <MaterialCommunityIcons
                  name="basket-outline"
                  size={15}
                  color="rgba(255,255,255,0.85)"
                />
                <Text style={styles.heroStatValue}>{heroStats.expectedLabel}</Text>
                <Text style={styles.heroStatLabel}>Expected</Text>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* ── 3. Programs | Agreements Segmented Toggle ───────────── */}
        <View style={[styles.segmentTrack, isDark && styles.segmentTrackDark]}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setSegment('programs')}
            style={[
              styles.segmentPill,
              segment === 'programs' && styles.segmentPillActive,
              segment === 'programs' && isDark && styles.segmentPillActiveDark,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                isDark && styles.segmentTextDark,
                segment === 'programs' && styles.segmentTextActive,
              ]}
            >
              Programs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setSegment('agreements')}
            style={[
              styles.segmentPill,
              segment === 'agreements' && styles.segmentPillActive,
              segment === 'agreements' && isDark && styles.segmentPillActiveDark,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                isDark && styles.segmentTextDark,
                segment === 'agreements' && styles.segmentTextActive,
              ]}
            >
              Agreements
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 4. Section Header ───────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            {segment === 'programs' ? 'Your Programs' : 'Your Agreements'}
          </Text>

          <TouchableOpacity
            activeOpacity={0.82}
            onPress={
              segment === 'programs' ? openCreateProgramModal : openCreateAgreementModal
            }
            style={[styles.newPillBtn, isDark && styles.newPillBtnDark]}
          >
            <Text style={[styles.newPillText, isDark && styles.newPillTextDark]}>New</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={15}
              color={isDark ? '#E8F3EA' : '#2E3F31'}
            />
          </TouchableOpacity>
        </View>

        {/* ── 5. Content List ─────────────────────────────────────── */}
        {isLoading && !refreshing ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={isDark ? '#4ADE80' : '#1E462C'} size="large" />
          </View>
        ) : segment === 'programs' ? (
          programs.length > 0 ? (
            programs.map((program) => {
              const isDraft = program.status === 'draft';
              const isClosed = program.status === 'closed';
              const maxFarmers = Math.max(1, program.maxFarmers || 1);
              const progressPct = Math.min(
                100,
                Math.round(((program.enrolledFarmers || 0) / maxFarmers) * 100)
              );

              return (
                <TouchableOpacity
                  key={program.id}
                  activeOpacity={0.92}
                  onPress={() => openEditProgramModal(program)}
                  style={[styles.programCard, isDark && styles.programCardDark]}
                >
                  {/* Visual Crop Banner */}
                  <ImageBackground
                    source={getCoverSource(program.coverImageKey, program.coverImageUrl)}
                    style={styles.programBanner}
                    resizeMode="cover"
                  >
                    <LinearGradient
                      colors={[
                        'rgba(10, 22, 13, 0.24)',
                        'rgba(10, 24, 14, 0.56)',
                        'rgba(8, 22, 12, 0.84)',
                      ]}
                      style={styles.programBannerGradient}
                    >
                      <View style={styles.programBannerTop}>
                        <View style={styles.statusChip}>
                          <View
                            style={[
                              styles.statusDot,
                              {
                                backgroundColor: isDraft
                                  ? '#D97706'
                                  : isClosed
                                    ? '#6B7280'
                                    : '#22A047',
                              },
                            ]}
                          />
                          <Text style={styles.statusChipText}>
                            {isDraft ? 'Draft' : isClosed ? 'Closed' : 'Active'}
                          </Text>
                        </View>

                        <Text style={styles.programCodeText}>{program.programCode}</Text>
                      </View>

                      <View style={styles.programBannerBottom}>
                        <Text style={styles.programCropTitle} numberOfLines={1}>
                          {program.cropName}
                        </Text>

                        <View style={styles.programPriceRow}>
                          <Text style={styles.programPriceValue}>
                            LKR {program.buybackPrice}
                          </Text>
                          <Text style={styles.programPriceUnit}> /{program.unit}</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </ImageBackground>

                  {/* Card Body: Input Chips + Progress + Edit/Publish */}
                  <View style={styles.programCardBody}>
                    <View style={styles.inputChipsRow}>
                      {program.includedInputs.map((inputTag, idx) => (
                        <View
                          key={`${program.id}-${inputTag}-${idx}`}
                          style={[styles.inputTagChip, isDark && styles.inputTagChipDark]}
                        >
                          <MaterialCommunityIcons
                            name={getInputChipIcon(inputTag)}
                            size={12}
                            color={isDark ? '#9CC4A1' : '#586A5A'}
                          />
                          <Text
                            style={[styles.inputTagText, isDark && styles.inputTagTextDark]}
                          >
                            {inputTag}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.programFooterRow}>
                      <View style={styles.progressCol}>
                        <View style={styles.farmerCountRow}>
                          <MaterialCommunityIcons
                            name="account-cowboy-hat-outline"
                            size={13}
                            color={isDark ? '#98B39B' : '#5E6B60'}
                          />
                          <Text
                            style={[styles.farmerCountText, isDark && styles.farmerCountTextDark]}
                          >
                            {program.enrolledFarmers} of {program.maxFarmers} farmers
                          </Text>
                        </View>

                        <View
                          style={[styles.progressTrack, isDark && styles.progressTrackDark]}
                        >
                          <View
                            style={[
                              styles.progressFill,
                              isDark && styles.progressFillDark,
                              { width: `${progressPct}%` },
                            ]}
                          />
                        </View>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.82}
                        onPress={() =>
                          isDraft
                            ? void handlePublishDraftProgram(program)
                            : openEditProgramModal(program)
                        }
                        style={[styles.cardActionBtn, isDark && styles.cardActionBtnDark]}
                      >
                        <Text
                          style={[styles.cardActionText, isDark && styles.cardActionTextDark]}
                        >
                          {isDraft ? 'Publish' : 'Edit'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
              <MaterialCommunityIcons
                name="sprout-outline"
                size={42}
                color={isDark ? '#4ADE80' : '#2D5E3A'}
              />
              <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
                No buy-back programs yet
              </Text>
              <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
                Launch a seed-to-harvest buy-back program with guaranteed pricing and input
                packages for partner farmers.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={openCreateProgramModal}
                style={styles.emptyPrimaryBtn}
              >
                <Text style={styles.emptyPrimaryBtnText}>Create Buy-Back Program</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          /* ── Agreements Tab ────────────────────────────────────── */
          <>
            <View style={styles.tabsRow}>
              {(['All', 'Pending', 'Active', 'Fulfilled'] as AgreementFilter[]).map((tab) => {
                const isSelected = agreementFilter === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setAgreementFilter(tab)}
                    style={[
                      styles.tabChip,
                      isDark && styles.tabChipDark,
                      isSelected && styles.tabChipActive,
                      isSelected && isDark && styles.tabChipActiveDark,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabChipText,
                        isDark && styles.tabChipTextDark,
                        isSelected && styles.tabChipTextActive,
                      ]}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {filteredAgreements.length > 0 ? (
              filteredAgreements.map((agreement) => {
                const badge = getAgreementStatusBadge(agreement.status);
                return (
                  <TouchableOpacity
                    key={agreement.id}
                    activeOpacity={0.88}
                    onPress={() => {
                      router.push({
                        pathname: '/(supplier)/buyback/[id]',
                        params: { id: agreement.id },
                      } as any);
                    }}
                    style={[styles.agreementCard, isDark && styles.agreementCardDark]}
                  >
                    <View style={styles.agreementCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.agreementCode, isDark && styles.agreementCodeDark]}
                        >
                          {agreement.agreementCode}
                        </Text>
                        <Text style={[styles.cropTitle, isDark && styles.cropTitleDark]}>
                          {agreement.cropName}
                        </Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.text }]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.farmerMetaRow}>
                      <MaterialCommunityIcons
                        name="account-check-outline"
                        size={16}
                        color={isDark ? '#98B39B' : '#5A6E5D'}
                      />
                      <Text
                        style={[styles.farmerMetaText, isDark && styles.farmerMetaTextDark]}
                      >
                        Farmer: {agreement.farmerName}{' '}
                        {agreement.farmerDistrict ? `(${agreement.farmerDistrict})` : ''}
                      </Text>
                    </View>

                    <View style={[styles.metricsGrid, isDark && styles.metricsGridDark]}>
                      <View style={styles.metricItem}>
                        <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>
                          Target Volume
                        </Text>
                        <Text style={[styles.metricVal, isDark && styles.metricValDark]}>
                          {agreement.targetQuantity} {agreement.unit}
                        </Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>
                          Agreed Price
                        </Text>
                        <Text style={[styles.metricVal, isDark && styles.metricValDark]}>
                          LKR {agreement.agreedPrice}/{agreement.unit}
                        </Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>
                          Commitment
                        </Text>
                        <Text
                          style={[
                            styles.metricValHighlight,
                            isDark && styles.metricValHighlightDark,
                          ]}
                        >
                          LKR {agreement.totalCommitment.toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    {agreement.deadline && (
                      <Text style={[styles.deadlineText, isDark && styles.deadlineTextDark]}>
                        Harvest Target: {agreement.deadline}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
                <MaterialCommunityIcons
                  name="handshake-outline"
                  size={44}
                  color={isDark ? '#4ADE80' : '#8A9E8D'}
                />
                <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
                  No buyback agreements
                </Text>
                <Text style={[styles.emptySubtitle, isDark && styles.emptySubtitleDark]}>
                  Create forward buyback agreements to contract harvest supplies directly with
                  partner farmers.
                </Text>
                <TouchableOpacity
                  onPress={openCreateAgreementModal}
                  style={styles.emptyPrimaryBtn}
                >
                  <Text style={styles.emptyPrimaryBtnText}>Create Buyback Agreement</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Create / Edit Buy-Back Program Modal ────────────────── */}
      <Modal
        visible={programModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isSavingProgram) setProgramModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.modalCardDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                {editingProgram
                  ? `Edit ${editingProgram.programCode}`
                  : 'New Buy-Back Program'}
              </Text>
              <TouchableOpacity
                disabled={isSavingProgram}
                onPress={() => setProgramModalVisible(false)}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={isDark ? '#F0F5F1' : '#333'}
                />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {!editingProgram && (
                <>
                  <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                    Quick Templates
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 4 }}
                  >
                    <View style={styles.chipSelectorRow}>
                      {PROGRAM_TEMPLATES.map((tpl) => (
                        <TouchableOpacity
                          key={tpl.label}
                          onPress={() => applyTemplate(tpl)}
                          style={[styles.templateChip, isDark && styles.templateChipDark]}
                        >
                          <Text
                            style={[
                              styles.templateChipText,
                              isDark && styles.templateChipTextDark,
                            ]}
                          >
                            {tpl.label} · LKR {tpl.price}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </>
              )}

              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                Crop / Variety
              </Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                placeholder="e.g. Tomato F1, Big Onion, Green Chilli"
                placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
                value={progCropName}
                onChangeText={setProgCropName}
              />

              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                    Price (LKR/kg)
                  </Text>
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    placeholder="150"
                    placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
                    keyboardType="numeric"
                    value={progPrice}
                    onChangeText={setProgPrice}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                    Expected Yield (kg)
                  </Text>
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    placeholder="500"
                    placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
                    keyboardType="numeric"
                    value={progExpectedKg}
                    onChangeText={setProgExpectedKg}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                    Farmer Slots (Max)
                  </Text>
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    placeholder="20"
                    placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
                    keyboardType="numeric"
                    value={progMaxFarmers}
                    onChangeText={setProgMaxFarmers}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                    Enrolled Farmers
                  </Text>
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    placeholder="0"
                    placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
                    keyboardType="numeric"
                    value={progEnrolledFarmers}
                    onChangeText={setProgEnrolledFarmers}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                Included Input Package
              </Text>
              <View style={styles.chipWrapRow}>
                {AVAILABLE_INPUT_CHIPS.map((chip) => {
                  const selected = progInputs.includes(chip);
                  return (
                    <TouchableOpacity
                      key={chip}
                      onPress={() => toggleInputChip(chip)}
                      style={[
                        styles.selectChip,
                        isDark && styles.selectChipDark,
                        selected && styles.selectChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectChipText,
                          isDark && styles.selectChipTextDark,
                          selected && styles.selectChipTextActive,
                        ]}
                      >
                        {chip}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                Banner Photo Preset
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipSelectorRow}>
                  {COVER_PRESETS.map((preset) => {
                    const selected = progCoverKey === preset.key;
                    return (
                      <TouchableOpacity
                        key={preset.key}
                        onPress={() => setProgCoverKey(preset.key)}
                        style={[
                          styles.selectChip,
                          isDark && styles.selectChipDark,
                          selected && styles.selectChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectChipText,
                            isDark && styles.selectChipTextDark,
                            selected && styles.selectChipTextActive,
                          ]}
                        >
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                Quality & Collection Notes
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { minHeight: 56, textAlignVertical: 'top' },
                  isDark && styles.inputDark,
                ]}
                placeholder="Grading specs, collection schedule..."
                placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
                value={progNotes}
                onChangeText={setProgNotes}
                multiline
              />

              {editingProgram ? (
                <View style={styles.modalActionsCol}>
                  <View style={styles.modalBtnRow}>
                    <TouchableOpacity
                      disabled={isSavingProgram}
                      onPress={() =>
                        void handleSaveProgram(
                          editingProgram.status === 'draft' ? 'active' : editingProgram.status
                        )
                      }
                      style={[styles.primaryModalBtn, { flex: 1 }]}
                    >
                      {isSavingProgram ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={styles.primaryModalBtnText}>
                          {editingProgram.status === 'draft' ? 'Publish & Save' : 'Save Changes'}
                        </Text>
                      )}
                    </TouchableOpacity>

                    {editingProgram.status === 'active' && (
                      <TouchableOpacity
                        disabled={isSavingProgram}
                        onPress={() => void handleSaveProgram('draft')}
                        style={[styles.secondaryModalBtn, isDark && styles.secondaryModalBtnDark]}
                      >
                        <Text
                          style={[
                            styles.secondaryModalBtnText,
                            isDark && styles.secondaryModalBtnTextDark,
                          ]}
                        >
                          Move to Draft
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    disabled={isSavingProgram}
                    onPress={() => handleDeleteProgram(editingProgram)}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>Delete Program</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    disabled={isSavingProgram}
                    onPress={() => void handleSaveProgram('draft')}
                    style={[styles.secondaryModalBtn, isDark && styles.secondaryModalBtnDark]}
                  >
                    <Text
                      style={[
                        styles.secondaryModalBtnText,
                        isDark && styles.secondaryModalBtnTextDark,
                      ]}
                    >
                      Save Draft
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={isSavingProgram}
                    onPress={() => void handleSaveProgram('active')}
                    style={[styles.primaryModalBtn, { flex: 1 }]}
                  >
                    {isSavingProgram ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.primaryModalBtnText}>Publish Program</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Create Individual Agreement Modal ───────────────────── */}
      <Modal
        visible={agreementModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isCreatingAgreement) setAgreementModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.modalCardDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                New Buyback Agreement
              </Text>
              <TouchableOpacity
                disabled={isCreatingAgreement}
                onPress={() => setAgreementModalVisible(false)}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={isDark ? '#FFF' : '#333'}
                />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                Select Partner Farmer
              </Text>
              {farmers.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipSelectorRow}>
                    {farmers.map((f) => {
                      const active = selectedFarmerId === f.id;
                      return (
                        <TouchableOpacity
                          key={f.id}
                          onPress={() => setSelectedFarmerId(f.id)}
                          style={[
                            styles.selectChip,
                            isDark && styles.selectChipDark,
                            active && styles.selectChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.selectChipText,
                              isDark && styles.selectChipTextDark,
                              active && styles.selectChipTextActive,
                            ]}
                          >
                            {f.fullName}
                            {f.district ? ` (${f.district})` : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              ) : (
                <TextInput
                  style={[styles.input, isDark && styles.inputDark]}
                  placeholder="Registered Farmer UUID"
                  placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
                  value={selectedFarmerId}
                  onChangeText={setSelectedFarmerId}
                />
              )}

              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                Crop Required
              </Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                placeholder="e.g. Tomato F1, Big Onion"
                placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
                value={cropName}
                onChangeText={setCropName}
              />

              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                    Target Volume (kg)
                  </Text>
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    placeholder="500"
                    placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
                    keyboardType="numeric"
                    value={targetQuantity}
                    onChangeText={setTargetQuantity}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                    Agreed Price (LKR/kg)
                  </Text>
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    placeholder="185"
                    placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
                    keyboardType="numeric"
                    value={agreedPrice}
                    onChangeText={setAgreedPrice}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                Target Harvest Deadline
              </Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                placeholder="e.g. 2026-12-15"
                placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
                value={deadline}
                onChangeText={setDeadline}
              />

              <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
                Commitment Terms / Notes
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { minHeight: 56, textAlignVertical: 'top' },
                  isDark && styles.inputDark,
                ]}
                placeholder="Grading specs, packaging guidelines..."
                placeholderTextColor={isDark ? '#7E9983' : '#8A998E'}
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <TouchableOpacity
                disabled={isCreatingAgreement}
                activeOpacity={0.85}
                onPress={handleCreateAgreement}
                style={[styles.submitBtn, isCreatingAgreement && { opacity: 0.7 }]}
              >
                {isCreatingAgreement ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="handshake" size={18} color="#FFF" />
                    <Text style={styles.submitBtnText}>Create Agreement</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F2EB',
  },
  safeAreaDark: {
    backgroundColor: '#0E1710',
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 112,
  },

  // ── Header ───────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  circleBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1D5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  circleBackBtnDark: {
    backgroundColor: '#16271A',
    borderColor: '#273E2C',
  },
  headerTitleBlock: {
    flex: 1,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  eyebrowText: {
    fontSize: 12.5,
    color: '#6B776D',
    fontWeight: '500',
  },
  eyebrowTextDark: {
    color: '#9CB39F',
  },
  mainTitleLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  highlightWordWrap: {
    position: 'relative',
    justifyContent: 'flex-end',
  },
  titleHighlighter: {
    position: 'absolute',
    left: -2,
    right: -2,
    bottom: 2,
    height: 11,
    backgroundColor: '#DCE8DB',
    borderRadius: 3,
  },
  titleHighlighterDark: {
    backgroundColor: 'rgba(74, 222, 128, 0.22)',
  },
  screenTitle: {
    fontSize: 25,
    fontWeight: '600',
    color: '#1C3122',
    fontFamily: SERIF_FONT,
    letterSpacing: -0.2,
  },
  screenTitleDark: {
    color: '#F0F5F1',
  },

  // ── Hero Card ────────────────────────────────────────────────────
  heroCard: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#0E2414',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 4,
  },
  heroCardImage: {
    borderRadius: 22,
  },
  heroGradient: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  heroTopTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  heroTopTagText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '500',
  },
  heroHeadline: {
    fontSize: 23,
    lineHeight: 29,
    color: '#FFFFFF',
    fontFamily: SERIF_FONT,
    fontWeight: '500',
    marginBottom: 18,
  },
  heroHeadlineItalic: {
    fontStyle: 'italic',
  },
  heroStatsGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 16,
    paddingVertical: 12,
  },
  heroStatCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: SERIF_FONT,
    marginTop: 1,
  },
  heroStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '500',
  },
  heroStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },

  // ── Segmented Toggle ─────────────────────────────────────────────
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#EBE6DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  segmentTrackDark: {
    backgroundColor: '#16271A',
    borderColor: '#253B2A',
  },
  segmentPill: {
    flex: 1,
    height: 38,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentPillActive: {
    backgroundColor: '#1E462C',
  },
  segmentPillActiveDark: {
    backgroundColor: '#2E6D43',
  },
  segmentText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#6C7A6E',
  },
  segmentTextDark: {
    color: '#98B39B',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },

  // ── Section Header ───────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1D3322',
  },
  sectionTitleDark: {
    color: '#F0F5F1',
  },
  newPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#DFDAD0',
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 5,
    gap: 2,
  },
  newPillBtnDark: {
    backgroundColor: '#16271A',
    borderColor: '#2A422F',
  },
  newPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2B3E2E',
  },
  newPillTextDark: {
    color: '#E8F3EA',
  },

  loadingState: {
    paddingVertical: 48,
    alignItems: 'center',
  },

  // ── Program Cards ────────────────────────────────────────────────
  programCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECE7DC',
    shadowColor: '#1B2D1F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  programCardDark: {
    backgroundColor: '#17261B',
    borderColor: '#253B2A',
  },
  programBanner: {
    height: 112,
    width: '100%',
  },
  programBannerGradient: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  programBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 245, 240, 0.92)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1F3424',
  },
  programCodeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  programBannerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 10,
  },
  programCropTitle: {
    flex: 1,
    fontSize: 21,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: SERIF_FONT,
  },
  programPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  programPriceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: SERIF_FONT,
  },
  programPriceUnit: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  programCardBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  inputChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 12,
  },
  inputTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF2EC',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  inputTagChipDark: {
    backgroundColor: '#213426',
  },
  inputTagText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#4F6252',
  },
  inputTagTextDark: {
    color: '#B5CDB8',
  },
  programFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressCol: {
    flex: 1,
    marginRight: 14,
  },
  farmerCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  farmerCountText: {
    fontSize: 12.5,
    color: '#5B685D',
    fontWeight: '500',
  },
  farmerCountTextDark: {
    color: '#9CB39F',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ECE8DF',
    overflow: 'hidden',
  },
  progressTrackDark: {
    backgroundColor: '#263B2A',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B6239',
    borderRadius: 3,
  },
  progressFillDark: {
    backgroundColor: '#4ADE80',
  },
  cardActionBtn: {
    backgroundColor: '#F3F1EA',
    borderWidth: 1,
    borderColor: '#DDD7CB',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  cardActionBtnDark: {
    backgroundColor: '#213526',
    borderColor: '#334E39',
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2B3E2E',
  },
  cardActionTextDark: {
    color: '#E8F3EA',
  },

  // ── Empty States ─────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECE7DC',
  },
  emptyCardDark: {
    backgroundColor: '#17261B',
    borderColor: '#253B2A',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C3723',
    marginTop: 10,
  },
  emptyTitleDark: {
    color: '#F0F5F1',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7E6F',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 5,
    marginBottom: 16,
  },
  emptySubtitleDark: {
    color: '#95A997',
  },
  emptyPrimaryBtn: {
    backgroundColor: '#1E462C',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  emptyPrimaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // ── Agreements Tab Styles ────────────────────────────────────────
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#EBE7DD',
  },
  tabChipDark: {
    backgroundColor: '#1E2E21',
  },
  tabChipActive: {
    backgroundColor: '#1E462C',
  },
  tabChipActiveDark: {
    backgroundColor: '#2E6D43',
  },
  tabChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B624E',
  },
  tabChipTextDark: {
    color: '#98B39B',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },
  agreementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECE7DC',
  },
  agreementCardDark: {
    backgroundColor: '#17261B',
    borderColor: '#253B2A',
  },
  agreementCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  agreementCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7E6F',
  },
  agreementCodeDark: {
    color: '#95A997',
  },
  cropTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C3723',
    fontFamily: SERIF_FONT,
    marginTop: 2,
  },
  cropTitleDark: {
    color: '#F0F5F1',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  farmerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  farmerMetaText: {
    fontSize: 13,
    color: '#49604C',
  },
  farmerMetaTextDark: {
    color: '#98B39B',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F7F5EE',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  metricsGridDark: {
    backgroundColor: '#1E2F22',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10.5,
    color: '#6B7E6F',
    marginBottom: 2,
  },
  metricLabelDark: {
    color: '#95A997',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C3723',
  },
  metricValDark: {
    color: '#F0F5F1',
  },
  metricValHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E462C',
  },
  metricValHighlightDark: {
    color: '#4ADE80',
  },
  deadlineText: {
    fontSize: 11.5,
    color: '#6B7E6F',
    marginTop: 4,
  },
  deadlineTextDark: {
    color: '#95A997',
  },

  // ── Modals ───────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FAF8F3',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    maxHeight: '88%',
  },
  modalCardDark: {
    backgroundColor: '#162218',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1C3723',
    fontFamily: SERIF_FONT,
  },
  modalTitleDark: {
    color: '#F0F5F1',
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#344E39',
    marginTop: 10,
    marginBottom: 5,
  },
  inputLabelDark: {
    color: '#98B39B',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D3C4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#162E1D',
  },
  inputDark: {
    backgroundColor: '#1E2F22',
    borderColor: '#36533B',
    color: '#F0F5F1',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  chipSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chipWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateChip: {
    backgroundColor: '#EBF2EC',
    borderWidth: 1,
    borderColor: '#CFE0D2',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  templateChipDark: {
    backgroundColor: '#203324',
    borderColor: '#345039',
  },
  templateChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E462C',
  },
  templateChipTextDark: {
    color: '#A7D8B0',
  },
  selectChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D3C4',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectChipDark: {
    backgroundColor: '#1E2F22',
    borderColor: '#36533B',
  },
  selectChipActive: {
    backgroundColor: '#1E462C',
    borderColor: '#1E462C',
  },
  selectChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#344E39',
  },
  selectChipTextDark: {
    color: '#A8C2AC',
  },
  selectChipTextActive: {
    color: '#FFFFFF',
  },
  modalActionsCol: {
    marginTop: 18,
    marginBottom: 8,
    gap: 10,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    marginBottom: 8,
  },
  primaryModalBtn: {
    backgroundColor: '#1E462C',
    borderRadius: 22,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  secondaryModalBtn: {
    backgroundColor: '#ECE9E0',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryModalBtnDark: {
    backgroundColor: '#253929',
  },
  secondaryModalBtnText: {
    color: '#2B3E2E',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryModalBtnTextDark: {
    color: '#DCE8DE',
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  deleteBtnText: {
    color: '#C2410C',
    fontSize: 13.5,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E462C',
    borderRadius: 22,
    paddingVertical: 14,
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

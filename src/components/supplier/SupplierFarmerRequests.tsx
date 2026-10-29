import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FarmerRequestItem } from '../../types/supplier.types';
import { useDarkMode } from '../../store/uiStore';
import { useLanguage } from '../../i18n/languageStore';

interface SupplierFarmerRequestsProps {
  requests: FarmerRequestItem[];
  onFulfilPress: (request: FarmerRequestItem) => void;
  onViewAllPress: () => void;
}

export const SupplierFarmerRequests: React.FC<SupplierFarmerRequestsProps> = ({
  requests,
  onFulfilPress,
  onViewAllPress,
}) => {
  const [isDark] = useDarkMode();
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, isDark && styles.titleDark]}>
          {t('dashboardFarmerRequests')}
        </Text>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onViewAllPress}
          style={[styles.viewAllPill, isDark && styles.viewAllPillDark]}
          accessibilityRole="button"
          accessibilityLabel={t('viewAll')}
        >
          <Text style={[styles.viewAllText, isDark && styles.viewAllTextDark]}>
            {t('viewAll')}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={16}
            color={isDark ? '#A2B9A5' : '#334E37'}
          />
        </TouchableOpacity>
      </View>

      {/* Requests List */}
      <View style={styles.cardsList}>
        {requests.map((request) => {
          const isPending = request.status === 'Pending';

          return (
            <View
              key={request.id}
              style={[styles.requestCard, isDark && styles.requestCardDark]}
            >
              {/* Product Thumbnail */}
              <View style={styles.imageWrapper}>
                <Image
                  source={request.imageUrl}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              </View>

              {/* Request Details */}
              <View style={styles.detailsContainer}>
                <Text
                  style={[styles.itemTitle, isDark && styles.itemTitleDark]}
                  numberOfLines={1}
                >
                  {request.title}
                </Text>

                <View style={styles.farmerRow}>
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={14}
                    color={isDark ? '#8EA491' : '#718573'}
                    style={styles.farmerIcon}
                  />
                  <Text
                    style={[
                      styles.farmerText,
                      isDark && styles.farmerTextDark,
                    ]}
                    numberOfLines={1}
                  >
                    {request.farmerName} • {request.date}
                  </Text>
                </View>

                {/* Status Badge Pill */}
                <View
                  style={[
                    styles.statusPill,
                    isPending
                      ? styles.statusPillPending
                      : styles.statusPillFulfilled,
                    isDark &&
                      (isPending
                        ? styles.statusPillPendingDark
                        : styles.statusPillFulfilledDark),
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isPending ? '#E66826' : '#2E7D32',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: isPending ? '#D97706' : '#2E7D32',
                      },
                      isDark && {
                        color: isPending ? '#F59E0B' : '#4ADE80',
                      },
                    ]}
                  >
                    {isPending ? t('tagPending') : t('statusFulfilled')}
                  </Text>
                </View>
              </View>

              {/* Fulfil Action Button */}
              {isPending && (
                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={() => onFulfilPress(request)}
                  style={styles.fulfilButton}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('fulfil')} ${request.title}`}
                >
                  <Text style={styles.fulfilButtonText}>{t('fulfil')}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#162E1D',
    letterSpacing: 0.2,
  },
  titleDark: {
    color: '#F0F5F1',
  },
  viewAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingLeft: 12,
    paddingRight: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFD8CC',
    backgroundColor: 'transparent',
  },
  viewAllPillDark: {
    borderColor: '#263D2B',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#314E36',
    marginRight: 2,
  },
  viewAllTextDark: {
    color: '#A2B9A5',
  },
  cardsList: {
    gap: 12,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECE6DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  requestCardDark: {
    backgroundColor: '#18271C',
    borderColor: '#253B2A',
  },
  imageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F0ECE1',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#17301E',
    marginBottom: 3,
  },
  itemTitleDark: {
    color: '#F0F5F1',
  },
  farmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  farmerIcon: {
    marginRight: 4,
  },
  farmerText: {
    fontSize: 11.5,
    color: '#718573',
  },
  farmerTextDark: {
    color: '#95A997',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  statusPillPending: {
    backgroundColor: '#FFF4E5',
  },
  statusPillPendingDark: {
    backgroundColor: '#352414',
  },
  statusPillFulfilled: {
    backgroundColor: '#EAF5EC',
  },
  statusPillFulfilledDark: {
    backgroundColor: '#16311D',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  fulfilButton: {
    backgroundColor: '#1A3723', // Dark forest green matching Figma
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0E2413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  fulfilButtonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
});

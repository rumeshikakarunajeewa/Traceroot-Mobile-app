import { Platform, Linking } from 'react-native';
import * as Location from 'expo-location';

export interface LocationResult {
  success: boolean;
  latitude?: number;
  longitude?: number;
  coordinates?: string;
  district?: string;
  province?: string;
  country?: string;
  address?: string;
  error?: string | null;
}

export interface DistrictInfo {
  name: string;
  province: string;
  lat: number;
  lng: number;
}

export const SRI_LANKA_DISTRICTS: Record<string, DistrictInfo> = {
  colombo: { name: 'Colombo', province: 'Western Province', lat: 6.9271, lng: 79.8612 },
  gampaha: { name: 'Gampaha', province: 'Western Province', lat: 7.084, lng: 79.9939 },
  kalutara: { name: 'Kalutara', province: 'Western Province', lat: 6.5854, lng: 79.9607 },
  kandy: { name: 'Kandy', province: 'Central Province', lat: 7.2906, lng: 80.6337 },
  matale: { name: 'Matale', province: 'Central Province', lat: 7.4675, lng: 80.6234 },
  'nuwara eliya': { name: 'Nuwara Eliya', province: 'Central Province', lat: 6.9497, lng: 80.7891 },
  galle: { name: 'Galle', province: 'Southern Province', lat: 6.0535, lng: 80.221 },
  matara: { name: 'Matara', province: 'Southern Province', lat: 5.9549, lng: 80.555 },
  hambantota: { name: 'Hambantota', province: 'Southern Province', lat: 6.1429, lng: 81.1212 },
  jaffna: { name: 'Jaffna', province: 'Northern Province', lat: 9.6615, lng: 80.0255 },
  kilinochchi: { name: 'Kilinochchi', province: 'Northern Province', lat: 9.3803, lng: 80.377 },
  mannar: { name: 'Mannar', province: 'Northern Province', lat: 8.981, lng: 79.9044 },
  vavuniya: { name: 'Vavuniya', province: 'Northern Province', lat: 8.7542, lng: 80.4982 },
  mullaitivu: { name: 'Mullaitivu', province: 'Northern Province', lat: 9.2671, lng: 80.8142 },
  batticaloa: { name: 'Batticaloa', province: 'Eastern Province', lat: 7.731, lng: 81.6747 },
  ampara: { name: 'Ampara', province: 'Eastern Province', lat: 7.2974, lng: 81.6747 },
  trincomalee: { name: 'Trincomalee', province: 'Eastern Province', lat: 8.5874, lng: 81.2152 },
  kurunegala: { name: 'Kurunegala', province: 'North Western Province', lat: 7.4863, lng: 80.3623 },
  puttalam: { name: 'Puttalam', province: 'North Western Province', lat: 8.0408, lng: 79.8394 },
  anuradhapura: { name: 'Anuradhapura', province: 'North Central Province', lat: 8.3114, lng: 80.4037 },
  polonnaruwa: { name: 'Polonnaruwa', province: 'North Central Province', lat: 7.9403, lng: 81.0188 },
  badulla: { name: 'Badulla', province: 'Uva Province', lat: 6.9934, lng: 81.055 },
  monaragala: { name: 'Monaragala', province: 'Uva Province', lat: 6.8728, lng: 81.3507 },
  ratnapura: { name: 'Ratnapura', province: 'Sabaragamuwa Province', lat: 6.6828, lng: 80.3992 },
  kegalle: { name: 'Kegalle', province: 'Sabaragamuwa Province', lat: 7.2513, lng: 80.3464 },
};

/**
 * Format numeric latitude and longitude into human-readable coordinates string
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

/**
 * Parses a coordinates string or resolves district fallback to extract numeric lat & lng
 */
export function parseCoordinates(
  coordinatesStr?: string | null,
  districtName?: string | null
): { latitude: number; longitude: number } {
  if (coordinatesStr && coordinatesStr.trim()) {
    // Check format like "6.9271° N, 79.8612° E" or "6.9271, 79.8612"
    const cleaned = coordinatesStr.replace(/[°NSEW]/gi, '').trim();
    const parts = cleaned.split(/[\s,]+/);
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng };
      }
    }
  }

  // Fallback to district lookup
  if (districtName && districtName.trim()) {
    const key = districtName.trim().toLowerCase();
    for (const [distKey, info] of Object.entries(SRI_LANKA_DISTRICTS)) {
      if (key.includes(distKey) || distKey.includes(key)) {
        return { latitude: info.lat, longitude: info.lng };
      }
    }
  }

  // Default to Colombo center
  return { latitude: 6.9271, longitude: 79.8612 };
}

/**
 * Resolves district info (province, coordinates) from district name
 */
export function resolveDistrictInfo(districtName?: string | null): DistrictInfo | null {
  if (!districtName || !districtName.trim()) return null;
  const key = districtName.trim().toLowerCase();
  for (const [distKey, info] of Object.entries(SRI_LANKA_DISTRICTS)) {
    if (key.includes(distKey) || distKey.includes(key)) {
      return info;
    }
  }
  return null;
}

/**
 * Generates an OpenStreetMap static map image URL for a given location
 */
export function getStaticMapUrl(
  latitude: number,
  longitude: number,
  zoom = 13,
  width = 320,
  height = 240
): string {
  // Free, fast OpenStreetMap static map rendering service with marker
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}&maptype=mapnik&markers=${latitude},${longitude},ol-marker`;
}

/**
 * Requests device GPS permissions and detects the user's real location with reverse geocoding
 */
export async function getCurrentGpsLocation(): Promise<LocationResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        error: 'Location permission was denied. Please allow location access in device settings.',
      };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = position.coords;
    const formattedCoords = formatCoordinates(latitude, longitude);

    let district = 'Colombo';
    let province = 'Western Province';
    let country = 'Sri Lanka';
    let address = '';

    try {
      const reverseList = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (reverseList && reverseList.length > 0) {
        const item = reverseList[0];
        country = item.country || 'Sri Lanka';
        province = item.region || item.subregion || 'Western Province';
        district = item.city || item.subregion || item.district || 'Colombo';

        const addressParts = [
          item.streetNumber,
          item.street,
          item.district || item.city,
          item.region,
        ].filter(Boolean);
        address = addressParts.join(', ');
      }
    } catch (geoErr) {
      console.warn('[Location] Reverse geocoding fallback to district coordinates:', geoErr);
    }

    return {
      success: true,
      latitude,
      longitude,
      coordinates: formattedCoords,
      district,
      province,
      country,
      address,
      error: null,
    };
  } catch (err: any) {
    console.warn('[Location] Error fetching GPS position:', err);
    return {
      success: false,
      error: err.message || 'Unable to retrieve current location from device.',
    };
  }
}

/**
 * Opens native Maps application at the specified coordinates
 */
export async function openInNativeMaps(
  latitude: number,
  longitude: number,
  label = 'Buyer Location'
): Promise<void> {
  const encodedLabel = encodeURIComponent(label);
  const scheme = Platform.select({
    ios: `maps:0,0?q=${encodedLabel}@${latitude},${longitude}`,
    android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`,
    default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  });

  try {
    const supported = await Linking.canOpenURL(scheme);
    if (supported) {
      await Linking.openURL(scheme);
    } else {
      await Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      );
    }
  } catch {
    await Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    );
  }
}


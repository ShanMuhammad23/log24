import { Platform } from 'react-native';
import { fetchMetarReports, MetarReport } from '@/utils/aviation-weather';

function getApiBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (envUrl) return envUrl;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }

  return null;
}

export async function fetchMetarForStation(stationId: string): Promise<MetarReport[]> {
  const ids = stationId.trim().toUpperCase();
  if (!ids) {
    throw new Error('Airport station ID is required.');
  }

  const apiBase = getApiBaseUrl();
  if (apiBase) {
    try {
      const response = await fetch(`${apiBase}/api/metar?ids=${encodeURIComponent(ids)}`, {
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json();
      if (response.ok) {
        return payload as MetarReport[];
      }
    } catch {
      // Fall through to direct upstream fetch (e.g. static web export without API routes).
    }
  }

  return fetchMetarReports(ids);
}

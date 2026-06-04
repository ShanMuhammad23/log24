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

export function parseStationIds(input: string): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];

  for (const part of input.split(',')) {
    const id = part.trim().toUpperCase();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }

  return ids;
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
      const payload = (await response.json()) as MetarReport[] | { error?: string };

      if (response.ok) {
        return payload as MetarReport[];
      }

      const message =
        typeof payload === 'object' && payload !== null && 'error' in payload && payload.error
          ? payload.error
          : response.status === 404
            ? `No weather data found for ${ids}. Verify the ICAO station ID.`
            : `Weather request failed (${response.status}).`;

      throw new Error(message);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('JSON')) {
        throw error;
      }
      // Fall through to direct upstream fetch (e.g. static web export without API routes).
    }
  }

  return fetchMetarReports(ids);
}

const METAR_API_BASE = 'https://aviationweather.gov/api/data/metar';

export type MetarCloudLayer = {
  cover: string;
  base: number;
};

export type MetarReport = {
  icaoId: string;
  receiptTime: string;
  obsTime: number;
  reportTime: string;
  temp?: number;
  dewp?: number;
  wdir?: number;
  wspd?: number;
  wgst?: number;
  visib?: number | string;
  altim?: number;
  qcField?: number;
  wxString?: string;
  precip?: number;
  metarType?: string;
  rawOb: string;
  lat?: number;
  lon?: number;
  elev?: number;
  name?: string;
  cover?: string;
  clouds?: MetarCloudLayer[];
  fltCat?: string;
  rawTaf?: string;
  slp?: number;
  presTend?: number;
  maxT?: number;
  minT?: number;
  maxT24?: number;
  minT24?: number;
  pcp6hr?: number;
  [key: string]: unknown;
};

export async function fetchMetarReports(stationId: string): Promise<MetarReport[]> {
  const ids = stationId.trim().toUpperCase();
  if (!ids) {
    throw new Error('Airport station ID is required.');
  }

  const url = `${METAR_API_BASE}?ids=${encodeURIComponent(ids)}&format=json&taf=true`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (response.status === 404) {
    throw new Error(`No weather data found for ${ids}. Verify the ICAO station ID.`);
  }

  if (!response.ok) {
    throw new Error(`Weather service returned ${response.status}.`);
  }

  const data = (await response.json()) as MetarReport[];
  if (!Array.isArray(data)) {
    throw new Error('Unexpected response from weather service.');
  }

  return data;
}

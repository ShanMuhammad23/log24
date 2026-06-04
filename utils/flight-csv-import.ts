import * as XLSX from 'xlsx';
import { deriveRoleTimeMinutes } from '@/utils/flight-form';
import {
  picBreakdownToDbPayload,
  sumPicBreakdownMinutes,
  type PicBreakdownMinutes,
} from '@/utils/pic-breakdown';

export const REQUIRED_CSV_HEADERS = [
  'Date of Flight',
  'Flight From',
  'Flight To',
  'Flight Departure Time',
] as const;

export const CSV_HEADERS = [
  'S.No',
  'Date of Entry',
  'Date of Flight',
  'Aircraft Type',
  'Aircraft RegVT No',
  'Engine',
  'Pilot-in-Command',
  'Co. pilot or student',
  'Flight From',
  'Flight To',
  'Flight Departure Time',
  'Flight Arrival Date',
  'Flight Arrival Time',
  'S.E-Day-Dual(1)',
  'S.E-Day-PIC(2)',
  'S.E-Day-Co-pilot(3)',
  'S.E-Night-Dual(4)',
  'S.E-Night-PIC(5)',
  'S.E-Night-Co-pilot(6)',
  'M.E-Day-Dual(7)',
  'M.E-Day-PIC(8)',
  'M.E-Day-Co-pilot(9)',
  'M.E-Day-PI(US)(10)',
  'M.E-Night-Dual(11)',
  'M.E-Night-PIC(12)',
  'M.E-Night-Co-pilot(13)',
  'M.E-Night-PI(US)(14)',
  'Instrument Flight Simulated(15)',
  'Instrument Flight Actual(16)',
  'Instructional(17)',
  'Exercises',
  'Cross Country',
  'Remarks',
  'Status',
  'Verified By',
  'Comment',
] as const;

export type CsvFlightRow = Record<(typeof CSV_HEADERS)[number], string>;

export type DualBreakdownMinutes = {
  extra: number | null;
  night: number | null;
  instrument: number | null;
  multi: number | null;
};

export type FlightInsertPayload = {
  user_id: string;
  flight_date: string;
  flight_number: string | null;
  aircraft_type: string | null;
  aircraft_registration: string | null;
  origin_iata: string | null;
  destination_iata: string | null;
  out_time: string | null;
  in_time: string | null;
  block_time_minutes: number | null;
  total_time_minutes: number | null;
  pic_time_minutes: number | null;
  sic_time_minutes: number | null;
  night_time_minutes: number | null;
  instrument_time_minutes: number | null;
  ifr_actual_minutes: number | null;
  ifr_simulated_minutes: number | null;
  instrument_timings_minutes: number | null;
  cross_country_total_minutes: number | null;
  is_cross_country: boolean;
  pic_name: string | null;
  co_pilot_name: string | null;
  operating_capacity: string | null;
  remarks: string | null;
  dual_extra_minutes: number | null;
  dual_night_minutes: number | null;
  dual_if_minutes: number | null;
  dual_multi_minutes: number | null;
  pic_ccts_day_minutes: number | null;
  pic_ccts_night_minutes: number | null;
  pic_xcty_minutes: number | null;
  pic_night_category_minutes: number | null;
  pic_gft_300nm_minutes: number | null;
  pic_gft_250nm_minutes: number | null;
  pic_gft_120nm_minutes: number | null;
  pic_gft_day_minutes: number | null;
  pic_gft_night_minutes: number | null;
  pic_multi_day_minutes: number | null;
  pic_multi_night_minutes: number | null;
  pic_multi_irt_minutes: number | null;
};

export type ParsedImportRow = {
  rowNumber: number;
  raw: CsvFlightRow;
  payload: FlightInsertPayload | null;
  duplicateKey: string | null;
  status: 'ready' | 'invalid' | 'duplicate_file' | 'duplicate_db';
  error?: string;
};

export type ParseCsvResult = {
  headers: string[];
  rows: ParsedImportRow[];
  missingHeaders: string[];
};

function normalizeHeader(header: string) {
  return header.replace(/^\uFEFF/, '').trim();
}

function canonicalizeHeader(header: string) {
  const trimmed = normalizeHeader(header);
  const match = CSV_HEADERS.find((h) => h.toLowerCase() === trimmed.toLowerCase());
  return match ?? trimmed;
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value).trim();
}

export function isSpreadsheetFileName(fileName: string) {
  const lower = fileName.toLowerCase();
  return lower.endsWith('.xls') || lower.endsWith('.xlsx') || lower.endsWith('.xlsm');
}

/** Parse Excel .xls / .xlsx (binary — cannot be read as plain CSV text). */
export function parseSpreadsheetBuffer(buffer: ArrayBuffer): { headers: string[]; records: string[][] } {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { headers: [], records: [] };
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  const rows = matrix.map((row) => (Array.isArray(row) ? row.map(cellToString) : []));

  const headerRowIndex = rows.findIndex((row) =>
    row.some((cell) => canonicalizeHeader(cell).toLowerCase() === 'date of flight')
  );
  const headerIndex = headerRowIndex >= 0 ? headerRowIndex : 0;
  const headers = rows[headerIndex]?.map((cell) => canonicalizeHeader(cell)) ?? [];

  const records = rows
    .slice(headerIndex + 1)
    .filter((row) => row.some((cell) => cell.trim() !== ''))
    .map((row) => {
      const padded = [...row];
      while (padded.length < headers.length) {
        padded.push('');
      }
      return padded.slice(0, headers.length);
    });

  return { headers, records };
}

/** Minimal RFC-style CSV parser (quoted fields, commas). */
export function parseCsvText(content: string): { headers: string[]; records: string[][] } {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || (char === '\r' && next === '\n')) {
      row.push(field);
      field = '';
      if (row.some((cell) => cell.trim() !== '')) {
        rows.push(row);
      }
      row = [];
      if (char === '\r') i += 1;
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== '')) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    return { headers: [], records: [] };
  }

  const headers = rows[0].map(canonicalizeHeader);
  return { headers, records: rows.slice(1) };
}

function rowToRecord(headers: string[], values: string[]): CsvFlightRow {
  const record = {} as CsvFlightRow;
  headers.forEach((header, index) => {
    record[header as keyof CsvFlightRow] = (values[index] ?? '').trim();
  });
  return record;
}

function parseDateToIso(value: string): string | null {
  const v = value.trim();
  if (!v) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  const dmy = v.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    let year = Number(dmy[3]);
    if (year < 100) year += 2000;
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const parsed = new Date(v);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
  }

  return null;
}

export function parseTimeToHHMM(value: string): string | null {
  const v = value.trim();
  if (!v) return null;

  const hhmm = v.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (hhmm) {
    const h = Number(hhmm[1]);
    const m = Number(hhmm[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  const digits = v.match(/^(\d{3,4})$/);
  if (digits) {
    const raw = digits[1].padStart(4, '0');
    const h = Number(raw.slice(0, 2));
    const m = Number(raw.slice(2, 4));
    if (h <= 23 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  return null;
}

function timeToMinutes(time: string): number | null {
  const normalized = parseTimeToHHMM(time);
  if (!normalized) return null;
  const [h, m] = normalized.split(':').map(Number);
  return h * 60 + m;
}

export function parseDurationToMinutes(value: string): number | null {
  const v = value.trim();
  if (!v) return null;

  if (v.includes(':')) {
    return timeToMinutes(v);
  }

  const num = Number(v.replace(/,/g, ''));
  if (Number.isNaN(num) || num < 0) return null;

  if (num <= 24 && String(v).includes('.')) {
    return Math.round(num * 60);
  }

  if (num <= 24) {
    return Math.round(num * 60);
  }

  return Math.round(num);
}

function sumDurationFields(row: CsvFlightRow, keys: (keyof CsvFlightRow)[]): number {
  return keys.reduce((acc, key) => acc + (parseDurationToMinutes(row[key] || '') || 0), 0);
}

function blockMinutesFromTimes(
  flightDate: string,
  outTime: string,
  arrivalDate: string,
  inTime: string
): number | null {
  const out = timeToMinutes(outTime);
  const input = timeToMinutes(inTime);
  if (out === null || input === null) return null;

  const dep = new Date(`${flightDate}T${parseTimeToHHMM(outTime)}:00`);
  let arrIso = flightDate;
  if (arrivalDate.trim()) {
    const parsedArrDate = parseDateToIso(arrivalDate);
    if (parsedArrDate) arrIso = parsedArrDate;
  }

  const arr = new Date(`${arrIso}T${parseTimeToHHMM(inTime)}:00`);
  let diffMs = arr.getTime() - dep.getTime();
  if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;

  return Math.max(0, Math.round(diffMs / 60000));
}

export function buildDuplicateKey(flightDate: string, outTime: string | null) {
  const time = outTime ? parseTimeToHHMM(outTime) ?? outTime : '00:00';
  return `${flightDate}|${time}`;
}

function inferOperatingCapacity(row: CsvFlightRow): string | null {
  const dual = sumDurationFields(row, [
    'S.E-Day-Dual(1)',
    'S.E-Night-Dual(4)',
    'M.E-Day-Dual(7)',
    'M.E-Night-Dual(11)',
  ]);
  const pic = sumDurationFields(row, [
    'S.E-Day-PIC(2)',
    'S.E-Night-PIC(5)',
    'M.E-Day-PIC(8)',
    'M.E-Night-PIC(12)',
    'M.E-Day-PI(US)(10)',
    'M.E-Night-PI(US)(14)',
  ]);
  const instructional = parseDurationToMinutes(row['Instructional(17)'] || '') || 0;

  if (instructional > 0 && instructional >= dual && instructional >= pic) return 'instructor';
  if (dual > pic && dual > 0) return 'dual';
  if (pic > 0) return 'pic';
  return null;
}

function minutesOrNull(value: number): number | null {
  return value > 0 ? value : null;
}

function sumDualBreakdownMinutes(breakdown: DualBreakdownMinutes) {
  return (
    (breakdown.extra || 0) +
    (breakdown.night || 0) +
    (breakdown.instrument || 0) +
    (breakdown.multi || 0)
  );
}

/** Map DGCA logbook dual columns → app dual breakdown fields. */
export function mapCsvDualBreakdown(
  row: CsvFlightRow,
  capacity: string,
  ifrActual: number | null,
  ifrSimulated: number | null
): DualBreakdownMinutes {
  if (capacity !== 'dual') {
    return { extra: null, night: null, instrument: null, multi: null };
  }

  const seDayDual = parseDurationToMinutes(row['S.E-Day-Dual(1)'] || '') || 0;
  const seNightDual = parseDurationToMinutes(row['S.E-Night-Dual(4)'] || '') || 0;
  const meDayDual = parseDurationToMinutes(row['M.E-Day-Dual(7)'] || '') || 0;
  const meNightDual = parseDurationToMinutes(row['M.E-Night-Dual(11)'] || '') || 0;
  const instrument = (ifrActual || 0) + (ifrSimulated || 0);

  return {
    extra: minutesOrNull(seDayDual),
    night: minutesOrNull(seNightDual + meNightDual),
    multi: minutesOrNull(meDayDual + meNightDual),
    instrument: minutesOrNull(instrument),
  };
}

/** Map DGCA logbook PIC columns → app PIC breakdown fields. */
export function mapCsvPicBreakdown(
  row: CsvFlightRow,
  capacity: string,
  crossCountryMinutes: number | null
): PicBreakdownMinutes {
  if (capacity !== 'pic' && capacity !== 'solo') {
    return {
      cctsDay: null,
      cctsNight: null,
      xcty: null,
      nightCategory: null,
      gft300nm: null,
      gft250nm: null,
      gft120nm: null,
      gftDay: null,
      gftNight: null,
      multiDay: null,
      multiNight: null,
      multiIrt: null,
    };
  }

  const seDayPic = parseDurationToMinutes(row['S.E-Day-PIC(2)'] || '') || 0;
  const seNightPic = parseDurationToMinutes(row['S.E-Night-PIC(5)'] || '') || 0;
  const meDayPic = parseDurationToMinutes(row['M.E-Day-PIC(8)'] || '') || 0;
  const meNightPic = parseDurationToMinutes(row['M.E-Night-PIC(12)'] || '') || 0;
  const meDayPius = parseDurationToMinutes(row['M.E-Day-PI(US)(10)'] || '') || 0;
  const meNightPius = parseDurationToMinutes(row['M.E-Night-PI(US)(14)'] || '') || 0;
  const ifrSimulated = parseDurationToMinutes(row['Instrument Flight Simulated(15)'] || '') || 0;
  const ifrActual = parseDurationToMinutes(row['Instrument Flight Actual(16)'] || '') || 0;

  return {
    cctsDay: minutesOrNull(seDayPic),
    cctsNight: minutesOrNull(seNightPic),
    xcty: capacity === 'pic' ? crossCountryMinutes : null,
    nightCategory: minutesOrNull(meNightPic + meNightPius),
    gft300nm: null,
    gft250nm: null,
    gft120nm: null,
    gftDay: null,
    gftNight: null,
    multiDay: minutesOrNull(meDayPic + meDayPius),
    multiNight: minutesOrNull(meNightPic),
    multiIrt: minutesOrNull(ifrActual + ifrSimulated),
  };
}

function legacyPicMinutes(row: CsvFlightRow) {
  return sumDurationFields(row, [
    'S.E-Day-PIC(2)',
    'S.E-Night-PIC(5)',
    'M.E-Day-PIC(8)',
    'M.E-Night-PIC(12)',
    'M.E-Day-PI(US)(10)',
    'M.E-Night-PI(US)(14)',
  ]);
}

function legacySicMinutes(row: CsvFlightRow) {
  const copilot = sumDurationFields(row, [
    'S.E-Day-Co-pilot(3)',
    'S.E-Night-Co-pilot(6)',
    'M.E-Day-Co-pilot(9)',
    'M.E-Night-Co-pilot(13)',
  ]);
  const dual = sumDurationFields(row, [
    'S.E-Day-Dual(1)',
    'S.E-Night-Dual(4)',
    'M.E-Day-Dual(7)',
    'M.E-Night-Dual(11)',
  ]);
  return copilot + dual;
}

function buildRemarks(row: CsvFlightRow): string | null {
  const parts: string[] = [];
  if (row.Remarks?.trim()) parts.push(row.Remarks.trim());
  if (row.Exercises?.trim()) parts.push(`Exercises: ${row.Exercises.trim()}`);
  if (row.Engine?.trim()) parts.push(`Engine: ${row.Engine.trim()}`);
  if (row['Date of Entry']?.trim()) parts.push(`Date of Entry: ${row['Date of Entry'].trim()}`);
  if (row.Status?.trim()) parts.push(`Status: ${row.Status.trim()}`);
  if (row['Verified By']?.trim()) parts.push(`Verified By: ${row['Verified By'].trim()}`);
  if (row.Comment?.trim()) parts.push(`Comment: ${row.Comment.trim()}`);
  return parts.length ? parts.join('\n') : null;
}

export function mapCsvRowToFlight(userId: string, row: CsvFlightRow): { payload: FlightInsertPayload | null; error?: string } {
  const flightDate = parseDateToIso(row['Date of Flight'] || '');
  if (!flightDate) {
    return { payload: null, error: 'Invalid or missing Date of Flight.' };
  }

  const origin = (row['Flight From'] || '').trim().toUpperCase();
  const destination = (row['Flight To'] || '').trim().toUpperCase();
  if (!origin || !destination) {
    return { payload: null, error: 'Flight From and Flight To are required.' };
  }

  const outTimeRaw = row['Flight Departure Time'] || '';
  const outTime = parseTimeToHHMM(outTimeRaw);
  if (!outTime) {
    return { payload: null, error: 'Flight Departure Time is required for import.' };
  }

  const inTime = parseTimeToHHMM(row['Flight Arrival Time'] || '');

  const ifrSimulated = parseDurationToMinutes(row['Instrument Flight Simulated(15)'] || '');
  const ifrActual = parseDurationToMinutes(row['Instrument Flight Actual(16)'] || '');
  const instructional = parseDurationToMinutes(row['Instructional(17)'] || '');
  const crossCountryRaw = parseDurationToMinutes(row['Cross Country'] || '');

  const operatingCapacity = inferOperatingCapacity(row) ?? '';
  const picMinutesLegacy = legacyPicMinutes(row);
  const sicMinutesLegacy = legacySicMinutes(row);

  const dualBreakdown = mapCsvDualBreakdown(row, operatingCapacity, ifrActual, ifrSimulated);
  const dualBreakdownTotal = sumDualBreakdownMinutes(dualBreakdown);

  const picXctyForRow = operatingCapacity === 'pic' ? crossCountryRaw : null;
  const picBreakdown = mapCsvPicBreakdown(row, operatingCapacity, picXctyForRow);
  const picBreakdownTotal = sumPicBreakdownMinutes(picBreakdown);

  const crossCountryTotal =
    operatingCapacity !== 'pic' ? crossCountryRaw : null;

  let blockMinutes =
    inTime !== null
      ? blockMinutesFromTimes(flightDate, outTime, row['Flight Arrival Date'] || '', inTime)
      : null;

  if (blockMinutes === null || blockMinutes === 0) {
    const summed = picMinutesLegacy + sicMinutesLegacy + (instructional ?? 0);
    blockMinutes = summed > 0 ? summed : null;
  }

  const roleTimes = deriveRoleTimeMinutes(blockMinutes, operatingCapacity);

  const sicTimeMinutes =
    dualBreakdownTotal > 0
      ? dualBreakdownTotal
      : operatingCapacity === 'dual' || ['copilot', 'observer', 'relief'].includes(operatingCapacity)
        ? (roleTimes.sic_time_minutes ?? (sicMinutesLegacy > 0 ? sicMinutesLegacy : null))
        : sicMinutesLegacy > 0
          ? sicMinutesLegacy
          : null;

  const picTimeMinutes =
    picBreakdownTotal > 0
      ? picBreakdownTotal
      : ['pic', 'solo', 'p1u_s', 'examiner', 'instructor'].includes(operatingCapacity)
        ? (roleTimes.pic_time_minutes ?? (picMinutesLegacy > 0 ? picMinutesLegacy : null))
        : picMinutesLegacy > 0
          ? picMinutesLegacy
          : null;

  const nightMinutes =
    picBreakdown.nightCategory ||
    picBreakdown.cctsNight ||
    picBreakdown.gftNight ||
    picBreakdown.multiNight ||
    dualBreakdown.night;

  const instrumentMinutes =
    operatingCapacity === 'dual'
      ? dualBreakdown.instrument
      : picBreakdown.multiIrt || (ifrActual || 0) + (ifrSimulated || 0);

  const instrumentForDb = instrumentMinutes && instrumentMinutes > 0 ? instrumentMinutes : null;

  return {
    payload: {
      user_id: userId,
      flight_date: flightDate,
      flight_number: null,
      aircraft_type: row['Aircraft Type']?.trim() || null,
      aircraft_registration: row['Aircraft RegVT No']?.trim() || null,
      origin_iata: origin,
      destination_iata: destination,
      out_time: outTime,
      in_time: inTime,
      block_time_minutes: blockMinutes,
      total_time_minutes: blockMinutes,
      pic_time_minutes: picTimeMinutes,
      sic_time_minutes: sicTimeMinutes,
      night_time_minutes: nightMinutes,
      instrument_time_minutes: instrumentForDb,
      ifr_actual_minutes: operatingCapacity === 'dual' ? null : ifrActual,
      ifr_simulated_minutes: operatingCapacity === 'dual' ? null : ifrSimulated,
      instrument_timings_minutes: instrumentForDb,
      cross_country_total_minutes: crossCountryTotal,
      is_cross_country:
        (crossCountryTotal || 0) > 0 ||
        (picBreakdown.xcty || 0) > 0,
      pic_name: row['Pilot-in-Command']?.trim() || null,
      co_pilot_name: row['Co. pilot or student']?.trim() || null,
      operating_capacity: operatingCapacity || null,
      remarks: buildRemarks(row),
      dual_extra_minutes: dualBreakdown.extra,
      dual_night_minutes: dualBreakdown.night,
      dual_if_minutes: dualBreakdown.instrument,
      dual_multi_minutes: dualBreakdown.multi,
      ...picBreakdownToDbPayload(picBreakdown),
    },
  };
}

export function parseFlightRows(headers: string[], records: string[][], userId: string): ParseCsvResult {
  const normalizedHeaders = headers.map((h) => canonicalizeHeader(h));
  const headerSet = new Set(normalizedHeaders.map((h) => h.toLowerCase()));

  const missingHeaders = REQUIRED_CSV_HEADERS.filter(
    (required) => !headerSet.has(required.toLowerCase())
  );

  if (records.length === 0 && missingHeaders.length === 0) {
    return { headers: normalizedHeaders, rows: [], missingHeaders: [] };
  }

  const parsed: ParsedImportRow[] = records.map((values, index) => {
    const raw = rowToRecord(normalizedHeaders, values);
    const rowNumber = index + 2;
    const mapped = mapCsvRowToFlight(userId, raw);

    if (!mapped.payload) {
      return {
        rowNumber,
        raw,
        payload: null,
        duplicateKey: null,
        status: 'invalid',
        error: mapped.error,
      };
    }

    const duplicateKey = buildDuplicateKey(mapped.payload.flight_date, mapped.payload.out_time);

    return {
      rowNumber,
      raw,
      payload: mapped.payload,
      duplicateKey,
      status: 'ready',
    };
  });

  const seen = new Set<string>();
  parsed.forEach((row) => {
    if (row.status !== 'ready' || !row.duplicateKey) return;
    if (seen.has(row.duplicateKey)) {
      row.status = 'duplicate_file';
      row.error = 'Duplicate flight date & departure time within file.';
    } else {
      seen.add(row.duplicateKey);
    }
  });

  return { headers: normalizedHeaders, rows: parsed, missingHeaders };
}

export function parseFlightCsv(content: string, userId: string): ParseCsvResult {
  const { headers, records } = parseCsvText(content);
  return parseFlightRows(headers, records, userId);
}

export function parseFlightSpreadsheet(buffer: ArrayBuffer, userId: string): ParseCsvResult {
  const { headers, records } = parseSpreadsheetBuffer(buffer);
  return parseFlightRows(headers, records, userId);
}

export function parseFlightImportFile(
  data: string | ArrayBuffer,
  fileName: string,
  userId: string
): ParseCsvResult {
  if (data instanceof ArrayBuffer || isSpreadsheetFileName(fileName)) {
    const buffer = data instanceof ArrayBuffer ? data : new TextEncoder().encode(data as string).buffer;
    return parseFlightSpreadsheet(buffer, userId);
  }
  return parseFlightCsv(typeof data === 'string' ? data : new TextDecoder().decode(data), userId);
}

export async function loadExistingDuplicateKeys(
  userId: string,
  fetchRows: (userId: string) => Promise<{ flight_date: string; out_time: string | null }[]>
) {
  const existing = await fetchRows(userId);
  const keys = new Set<string>();
  existing.forEach((row) => {
    if (!row.flight_date) return;
    keys.add(buildDuplicateKey(row.flight_date, row.out_time));
  });
  return keys;
}

export function markDatabaseDuplicates(rows: ParsedImportRow[], existingKeys: Set<string>) {
  rows.forEach((row) => {
    if (row.status !== 'ready' || !row.duplicateKey) return;
    if (existingKeys.has(row.duplicateKey)) {
      row.status = 'duplicate_db';
      row.error = 'A flight with the same date and departure time already exists.';
    }
  });
}

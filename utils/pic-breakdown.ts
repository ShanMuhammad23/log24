import { minutesToHHMM, toMinutes } from '@/utils/flight-form';

export type PicCctsPeriod = 'day' | 'night';

export type PicBreakdownFormState = {
  cctsEnabled: boolean;
  cctsPeriod: PicCctsPeriod | null;
  cctsTime: string;
  xctyEnabled: boolean;
  xctyTime: string;
  nightCategoryEnabled: boolean;
  nightCategoryTime: string;
  gftChecksEnabled: boolean;
  gft300nmEnabled: boolean;
  gft300nmTime: string;
  gft250nmEnabled: boolean;
  gft250nmTime: string;
  gft120nmEnabled: boolean;
  gft120nmTime: string;
  gftDayEnabled: boolean;
  gftDayTime: string;
  gftNightEnabled: boolean;
  gftNightTime: string;
  multiChecksEnabled: boolean;
  multiDayEnabled: boolean;
  multiDayTime: string;
  multiNightEnabled: boolean;
  multiNightTime: string;
  multiIrtEnabled: boolean;
  multiIrtTime: string;
};

export type PicBreakdownDbRow = {
  pic_ccts_day_minutes?: number | null;
  pic_ccts_night_minutes?: number | null;
  pic_xcty_minutes?: number | null;
  pic_night_category_minutes?: number | null;
  pic_gft_300nm_minutes?: number | null;
  pic_gft_250nm_minutes?: number | null;
  pic_gft_120nm_minutes?: number | null;
  pic_gft_day_minutes?: number | null;
  pic_gft_night_minutes?: number | null;
  pic_multi_day_minutes?: number | null;
  pic_multi_night_minutes?: number | null;
  pic_multi_irt_minutes?: number | null;
};

export type PicBreakdownMinutes = {
  cctsDay: number | null;
  cctsNight: number | null;
  xcty: number | null;
  nightCategory: number | null;
  gft300nm: number | null;
  gft250nm: number | null;
  gft120nm: number | null;
  gftDay: number | null;
  gftNight: number | null;
  multiDay: number | null;
  multiNight: number | null;
  multiIrt: number | null;
};

export const EMPTY_PIC_BREAKDOWN: PicBreakdownFormState = {
  cctsEnabled: false,
  cctsPeriod: null,
  cctsTime: '',
  xctyEnabled: false,
  xctyTime: '',
  nightCategoryEnabled: false,
  nightCategoryTime: '',
  gftChecksEnabled: false,
  gft300nmEnabled: false,
  gft300nmTime: '',
  gft250nmEnabled: false,
  gft250nmTime: '',
  gft120nmEnabled: false,
  gft120nmTime: '',
  gftDayEnabled: false,
  gftDayTime: '',
  gftNightEnabled: false,
  gftNightTime: '',
  multiChecksEnabled: false,
  multiDayEnabled: false,
  multiDayTime: '',
  multiNightEnabled: false,
  multiNightTime: '',
  multiIrtEnabled: false,
  multiIrtTime: '',
};

export function parsePicBreakdownMinutes(state: PicBreakdownFormState): PicBreakdownMinutes {
  const cctsMinutes =
    state.cctsEnabled && state.cctsPeriod ? toMinutes(state.cctsTime) : null;

  return {
    cctsDay: state.cctsEnabled && state.cctsPeriod === 'day' ? cctsMinutes : null,
    cctsNight: state.cctsEnabled && state.cctsPeriod === 'night' ? cctsMinutes : null,
    xcty: state.xctyEnabled ? toMinutes(state.xctyTime) : null,
    nightCategory: state.nightCategoryEnabled ? toMinutes(state.nightCategoryTime) : null,
    gft300nm: state.gftChecksEnabled && state.gft300nmEnabled ? toMinutes(state.gft300nmTime) : null,
    gft250nm: state.gftChecksEnabled && state.gft250nmEnabled ? toMinutes(state.gft250nmTime) : null,
    gft120nm: state.gftChecksEnabled && state.gft120nmEnabled ? toMinutes(state.gft120nmTime) : null,
    gftDay: state.gftChecksEnabled && state.gftDayEnabled ? toMinutes(state.gftDayTime) : null,
    gftNight: state.gftChecksEnabled && state.gftNightEnabled ? toMinutes(state.gftNightTime) : null,
    multiDay: state.multiChecksEnabled && state.multiDayEnabled ? toMinutes(state.multiDayTime) : null,
    multiNight: state.multiChecksEnabled && state.multiNightEnabled ? toMinutes(state.multiNightTime) : null,
    multiIrt: state.multiChecksEnabled && state.multiIrtEnabled ? toMinutes(state.multiIrtTime) : null,
  };
}

export function sumPicBreakdownMinutes(minutes: PicBreakdownMinutes) {
  return Object.values(minutes).reduce<number>((sum, value) => sum + (value || 0), 0);
}

export function picBreakdownMinutesFromRow(row: PicBreakdownDbRow): PicBreakdownMinutes {
  return {
    cctsDay: row.pic_ccts_day_minutes ?? null,
    cctsNight: row.pic_ccts_night_minutes ?? null,
    xcty: row.pic_xcty_minutes ?? null,
    nightCategory: row.pic_night_category_minutes ?? null,
    gft300nm: row.pic_gft_300nm_minutes ?? null,
    gft250nm: row.pic_gft_250nm_minutes ?? null,
    gft120nm: row.pic_gft_120nm_minutes ?? null,
    gftDay: row.pic_gft_day_minutes ?? null,
    gftNight: row.pic_gft_night_minutes ?? null,
    multiDay: row.pic_multi_day_minutes ?? null,
    multiNight: row.pic_multi_night_minutes ?? null,
    multiIrt: row.pic_multi_irt_minutes ?? null,
  };
}

export function picBreakdownRowHasData(row: PicBreakdownDbRow) {
  return sumPicBreakdownMinutes(picBreakdownMinutesFromRow(row)) > 0;
}

export function picBreakdownToDbPayload(minutes: PicBreakdownMinutes): PicBreakdownDbRow {
  return {
    pic_ccts_day_minutes: minutes.cctsDay,
    pic_ccts_night_minutes: minutes.cctsNight,
    pic_xcty_minutes: minutes.xcty,
    pic_night_category_minutes: minutes.nightCategory,
    pic_gft_300nm_minutes: minutes.gft300nm,
    pic_gft_250nm_minutes: minutes.gft250nm,
    pic_gft_120nm_minutes: minutes.gft120nm,
    pic_gft_day_minutes: minutes.gftDay,
    pic_gft_night_minutes: minutes.gftNight,
    pic_multi_day_minutes: minutes.multiDay,
    pic_multi_night_minutes: minutes.multiNight,
    pic_multi_irt_minutes: minutes.multiIrt,
  };
}

export function picBreakdownFormFromRow(row: PicBreakdownDbRow): PicBreakdownFormState {
  const minutes = picBreakdownMinutesFromRow(row);

  return {
    cctsEnabled: (minutes.cctsDay || 0) > 0 || (minutes.cctsNight || 0) > 0,
    cctsPeriod: (minutes.cctsNight || 0) > 0 ? 'night' : (minutes.cctsDay || 0) > 0 ? 'day' : null,
    cctsTime: minutesToHHMM(minutes.cctsNight || minutes.cctsDay),
    xctyEnabled: (minutes.xcty || 0) > 0,
    xctyTime: minutesToHHMM(minutes.xcty),
    nightCategoryEnabled: (minutes.nightCategory || 0) > 0,
    nightCategoryTime: minutesToHHMM(minutes.nightCategory),
    gftChecksEnabled:
      (minutes.gft300nm || 0) > 0 ||
      (minutes.gft250nm || 0) > 0 ||
      (minutes.gft120nm || 0) > 0 ||
      (minutes.gftDay || 0) > 0 ||
      (minutes.gftNight || 0) > 0,
    gft300nmEnabled: (minutes.gft300nm || 0) > 0,
    gft300nmTime: minutesToHHMM(minutes.gft300nm),
    gft250nmEnabled: (minutes.gft250nm || 0) > 0,
    gft250nmTime: minutesToHHMM(minutes.gft250nm),
    gft120nmEnabled: (minutes.gft120nm || 0) > 0,
    gft120nmTime: minutesToHHMM(minutes.gft120nm),
    gftDayEnabled: (minutes.gftDay || 0) > 0,
    gftDayTime: minutesToHHMM(minutes.gftDay),
    gftNightEnabled: (minutes.gftNight || 0) > 0,
    gftNightTime: minutesToHHMM(minutes.gftNight),
    multiChecksEnabled:
      (minutes.multiDay || 0) > 0 || (minutes.multiNight || 0) > 0 || (minutes.multiIrt || 0) > 0,
    multiDayEnabled: (minutes.multiDay || 0) > 0,
    multiDayTime: minutesToHHMM(minutes.multiDay),
    multiNightEnabled: (minutes.multiNight || 0) > 0,
    multiNightTime: minutesToHHMM(minutes.multiNight),
    multiIrtEnabled: (minutes.multiIrt || 0) > 0,
    multiIrtTime: minutesToHHMM(minutes.multiIrt),
  };
}

export function picCrossCountryMinutesFromRow(row: PicBreakdownDbRow) {
  return (row.pic_xcty_minutes || 0) + (row.pic_gft_300nm_minutes || 0);
}

export function validatePicBreakdown(
  state: PicBreakdownFormState,
  blockMinutes: number | null
): string | null {
  const minutes = parsePicBreakdownMinutes(state);
  const total = sumPicBreakdownMinutes(minutes);

  if (total <= 0) return null;

  if (blockMinutes === null) {
    return 'Enter Out and In time before logging PIC breakdown hours.';
  }

  if (state.cctsEnabled) {
    if (!state.cctsPeriod) return 'Select Day or Night for CCTS.';
    if ((state.cctsPeriod === 'day' ? minutes.cctsDay : minutes.cctsNight) === null) {
      return 'Enter hours for CCTS.';
    }
  }

  if (state.xctyEnabled && minutes.xcty === null) return 'Enter hours for XCTY.';
  if (state.nightCategoryEnabled && minutes.nightCategory === null) return 'Enter hours for Night.';
  if (state.gftChecksEnabled && state.gft300nmEnabled && minutes.gft300nm === null) {
    return 'Enter hours for 300 NM (GFT).';
  }
  if (state.gftChecksEnabled && state.gft250nmEnabled && minutes.gft250nm === null) {
    return 'Enter hours for 250 NM.';
  }
  if (state.gftChecksEnabled && state.gft120nmEnabled && minutes.gft120nm === null) {
    return 'Enter hours for 120 NM.';
  }
  if (state.gftChecksEnabled && state.gftDayEnabled && minutes.gftDay === null) {
    return 'Enter hours for GFT Day.';
  }
  if (state.gftChecksEnabled && state.gftNightEnabled && minutes.gftNight === null) {
    return 'Enter hours for GFT Night.';
  }
  if (state.multiChecksEnabled && state.multiDayEnabled && minutes.multiDay === null) {
    return 'Enter hours for Multi Checks Day.';
  }
  if (state.multiChecksEnabled && state.multiNightEnabled && minutes.multiNight === null) {
    return 'Enter hours for Multi Checks Night.';
  }
  if (state.multiChecksEnabled && state.multiIrtEnabled && minutes.multiIrt === null) {
    return 'Enter hours for Multi Checks IRT.';
  }

  for (const value of Object.values(minutes)) {
    if (value !== null && value > blockMinutes) {
      return 'Each PIC category cannot exceed total block time (Out–In).';
    }
  }

  if (total > blockMinutes) {
    return 'Combined PIC categories cannot exceed total block time (Out–In).';
  }

  return null;
}

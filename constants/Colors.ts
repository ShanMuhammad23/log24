// Instrument ledger palette — drawn from the L24 instrument-dial logo.
export const ARC = '#2EA8FF';
export const ARC_DEEP = '#1273D6';
export const NIGHT = '#0A1428';
export const PANEL = '#101E38';
export const RULE_DARK = '#1E2C48';
export const PAPER = '#F4F5F7';
export const RULE = '#E2E5EA';
export const INK = '#0E1526';
export const SUB = '#5B6580';
export const MIST = '#93A2C0';

export default {
  light: {
    text: INK,
    background: PAPER,
    tint: ARC_DEEP,
    tabIconDefault: MIST,
    tabIconSelected: '#ffffff',
  },
  dark: {
    text: '#FFFFFF',
    background: NIGHT,
    tint: ARC,
    tabIconDefault: MIST,
    tabIconSelected: ARC,
  },
};

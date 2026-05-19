import { StyleSheet } from 'react-native';

export const colors = {
  bg: '#0D1117',
  card: '#161B22',
  accent: '#00B4D8',
  text: '#FFFFFF',
  muted: '#8B949E',
  error: '#FF4D4D',
  success: '#3FB950',
  danger: '#F85149',
  border: '#30363D',
};

export const sharedStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 24,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  segmentText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.bg,
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
});

import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, G, Path, Polygon, Text as SvgText } from 'react-native-svg';
import {
  ENTRY_COLORS,
  entrySectors,
  normalizeHeading,
  teardropHeading,
} from '../holdingPatternCalculations';
import type { EntryType, HoldSide, HoldingPatternResult } from '../types';
import { type CalculatorColors } from '../theme';

type HoldingPatternDiagramProps = {
  result: HoldingPatternResult;
  aircraftHeading: number;
  holdSide: HoldSide;
  northUp: boolean;
  showEntryPath: boolean;
  colors: CalculatorColors;
  onToggleNorthUp: () => void;
  onToggleEntryPath: () => void;
  onShowInstructions: () => void;
};

const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_R = 118;
const PATTERN_R = 72;

/** Aviation heading (° clockwise from north) → SVG x/y. */
function polar(heading: number, radius: number, cx = CX, cy = CY): { x: number; y: number } {
  const rad = toRad(heading);
  return {
    x: cx + radius * Math.sin(rad),
    y: cy - radius * Math.cos(rad),
  };
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function sectorPath(
  cx: number,
  cy: number,
  radius: number,
  startHeading: number,
  endHeading: number
): string {
  const start = polar(startHeading, radius, cx, cy);
  const end = polar(endHeading, radius, cx, cy);
  const sweep = ((endHeading - startHeading + 360) % 360) || 360;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function rotateHeading(heading: number, reference: number): number {
  return normalizeHeading(heading - reference);
}

function displayHeading(heading: number, northUp: boolean, reference: number): number {
  return northUp ? heading : rotateHeading(heading, reference);
}

function HoldingPatternDiagram({
  result,
  aircraftHeading,
  holdSide,
  northUp,
  showEntryPath,
  colors,
  onToggleNorthUp,
  onToggleEntryPath,
  onShowInstructions,
}: HoldingPatternDiagramProps) {
  const reference = northUp ? 0 : result.inboundCourse;
  const { inboundCourse, outboundCourse, entryType } = result;

  const holdingPerp =
    holdSide === 'Right'
      ? normalizeHeading(inboundCourse + 90)
      : normalizeHeading(inboundCourse - 90);

  const pattern = useMemo(() => {
    const leg = PATTERN_R * 0.55;
    const width = PATTERN_R * 0.38;
    const fix = polar(displayHeading(inboundCourse, northUp, reference), 0);
    const outEnd = polar(displayHeading(outboundCourse, northUp, reference), leg);
    const inStart = polar(displayHeading(normalizeHeading(inboundCourse + 180), northUp, reference), leg);
    const turnCenter = polar(displayHeading(holdingPerp, northUp, reference), width);
    return { fix, outEnd, inStart, turnCenter, leg, width };
  }, [inboundCourse, outboundCourse, holdingPerp, northUp, reference]);

  const entryPathD = useMemo(() => {
    if (!showEntryPath) return '';
    const approachFrom = normalizeHeading(aircraftHeading + 180);
    const start = polar(displayHeading(approachFrom, northUp, reference), OUTER_R * 0.92);
    const fix = polar(displayHeading(inboundCourse, northUp, reference), 0);

    if (entryType === 'Direct') {
      const beforeFix = polar(displayHeading(approachFrom, northUp, reference), PATTERN_R * 0.2);
      return `M ${start.x} ${start.y} L ${beforeFix.x} ${beforeFix.y} L ${fix.x} ${fix.y}`;
    }

    if (entryType === 'Teardrop') {
      const tearHdg = teardropHeading(outboundCourse, holdSide);
      const tearPt = polar(displayHeading(tearHdg, northUp, reference), PATTERN_R * 0.65);
      return `M ${start.x} ${start.y} L ${fix.x} ${fix.y} L ${tearPt.x} ${tearPt.y}`;
    }

    // Parallel
    const parHdg = outboundCourse;
    const parPt = polar(displayHeading(parHdg, northUp, reference), PATTERN_R * 0.7);
    const intercept = polar(displayHeading(inboundCourse, northUp, reference), PATTERN_R * 0.35);
    return `M ${start.x} ${start.y} L ${fix.x} ${fix.y} L ${parPt.x} ${parPt.y} L ${intercept.x} ${intercept.y}`;
  }, [
    showEntryPath,
    aircraftHeading,
    northUp,
    reference,
    inboundCourse,
    entryType,
    outboundCourse,
    holdSide,
  ]);

  const holdTrackD = useMemo(() => {
    const { fix, outEnd, inStart, turnCenter } = pattern;
    const outH = displayHeading(outboundCourse, northUp, reference);
    const inH = displayHeading(inboundCourse, northUp, reference);
    const turn1 = polar(outH + (holdSide === 'Right' ? 90 : -90), PATTERN_R * 0.38);
    const turn2 = polar(inH + (holdSide === 'Right' ? -90 : 90), PATTERN_R * 0.38);
    return [
      `M ${fix.x} ${fix.y} L ${outEnd.x} ${outEnd.y}`,
      `Q ${turn1.x} ${turn1.y} ${inStart.x} ${inStart.y}`,
      `L ${fix.x} ${fix.y}`,
      `Q ${turn2.x} ${turn2.y} ${outEnd.x} ${outEnd.y}`,
    ].join(' ');
  }, [pattern, outboundCourse, inboundCourse, holdSide, northUp, reference]);

  const aircraftPos = polar(displayHeading(aircraftHeading, northUp, reference), OUTER_R * 0.82);
  const aircraftRotation = displayHeading(aircraftHeading, northUp, reference);

  const cardinals = [
    { label: 'N', heading: 0 },
    { label: 'E', heading: 90 },
    { label: 'S', heading: 180 },
    { label: 'W', heading: 270 },
  ];

  return (
    <View style={styles.wrap}>
      <View style={[styles.diagramCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle cx={CX} cy={CY} r={OUTER_R} fill="#f8fafc" stroke={colors.border} strokeWidth={1} />

          {entrySectors(holdSide).map((sector, index) => {
            const start = displayHeading(inboundCourse + sector.start, northUp, reference);
            const end = displayHeading(inboundCourse + sector.end, northUp, reference);
            return (
              <Path
                key={`${sector.type}-${index}`}
                d={sectorPath(CX, CY, OUTER_R, start, end)}
                fill={ENTRY_COLORS[sector.type]}
                fillOpacity={0.28}
              />
            );
          })}

          <Circle cx={CX} cy={CY} r={OUTER_R} fill="none" stroke={colors.border} strokeWidth={1.5} />

          {cardinals.map(({ label, heading }) => {
            const pt = polar(displayHeading(heading, northUp, reference), OUTER_R - 12);
            return (
              <SvgText
                key={label}
                x={pt.x}
                y={pt.y + 4}
                fontSize={11}
                fontWeight="700"
                fill={colors.muted}
                textAnchor="middle">
                {label}
              </SvgText>
            );
          })}

          <Path d={holdTrackD} fill="none" stroke={colors.text} strokeWidth={2.5} />

          {showEntryPath && entryPathD ? (
            <Path
              d={entryPathD}
              fill="none"
              stroke="#2563eb"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          ) : null}

          <Circle cx={CX} cy={CY} r={4} fill={colors.text} />

          <G
            transform={`translate(${aircraftPos.x}, ${aircraftPos.y}) rotate(${aircraftRotation})`}>
            <Polygon points="0,-10 8,8 -8,8" fill={colors.text} />
          </G>

          <G transform={`translate(${CX + OUTER_R - 36}, ${CY + OUTER_R - 22})`}>
            <Circle cx={0} cy={0} r={28} fill={colors.card} stroke={colors.border} strokeWidth={1} />
          </G>
        </Svg>

        <TouchableOpacity style={styles.northUpBtn} onPress={onToggleNorthUp}>
          <Text style={[styles.northUpText, { color: colors.text }]}>{northUp ? 'North Up' : 'Track Up'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.legendRow}>
        {(['Direct', 'Parallel', 'Teardrop'] as EntryType[]).map((type) => (
          <View key={type} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: ENTRY_COLORS[type] }]} />
            <Text style={[styles.legendLabel, { color: colors.text }]}>{type}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.bg }]}
          onPress={onToggleEntryPath}>
          <Text style={[styles.actionBtnText, { color: colors.text }]}>
            {showEntryPath ? 'Hide Entry Path' : 'Show Entry Path'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.bg }]}
          onPress={onShowInstructions}>
          <Text style={[styles.actionBtnText, { color: colors.text }]}>Show Instructions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  diagramCard: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 8,
    overflow: 'hidden',
  },
  northUpBtn: {
    position: 'absolute',
    right: 28,
    bottom: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  northUpText: {
    fontSize: 10,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default HoldingPatternDiagram;

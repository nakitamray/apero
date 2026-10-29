import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect, Line } from 'react-native-svg';
import { colors } from '../theme';

export function Sardine({ width = 120, flip = false, color = colors.cobalt, style }) {
  return (
    <Svg width={width} height={width / 3} viewBox="0 0 120 40" style={[flip && { transform: [{ scaleX: -1 }] }, style]}>
      <Path
        d="M6 20 C 18 7, 66 5, 94 16 L 114 5 L 106 20 L 114 35 L 94 24 C 66 35, 18 33, 6 20 Z"
        fill={color}
        stroke={colors.ink}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M14 23 C 34 30, 66 30, 90 22" stroke={colors.mist} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Path d="M24 13 C 44 10, 70 11, 88 16" stroke={colors.ink} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.5} />
      <Path d="M30 12 C 35 18, 35 24, 30 29" stroke={colors.ink} strokeWidth={1.8} fill="none" />
      <Circle cx={18} cy={18} r={3.2} fill={colors.lemon} stroke={colors.ink} strokeWidth={1.2} />
      <Circle cx={18} cy={18} r={1.3} fill={colors.ink} />
    </Svg>
  );
}

export function OrangeSlice({ size = 48, style }) {
  const r = 22;
  const spokes = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
  return (
    <Svg width={size} height={size} viewBox="0 0 50 50" style={style}>
      <Circle cx={25} cy={25} r={r + 1} fill={colors.aperol} stroke={colors.ink} strokeWidth={2} />
      <Circle cx={25} cy={25} r={r - 3} fill={colors.card} />
      <Circle cx={25} cy={25} r={r - 5} fill={colors.peach} />
      {spokes.map((a) => (
        <Line
          key={a}
          x1={25}
          y1={25}
          x2={25 + Math.cos(a) * (r - 5)}
          y2={25 + Math.sin(a) * (r - 5)}
          stroke={colors.card}
          strokeWidth={2}
        />
      ))}
      <Circle cx={25} cy={25} r={2.5} fill={colors.card} />
    </Svg>
  );
}

export function Spritz({ size = 90, style }) {
  return (
    <Svg width={size} height={size * 1.25} viewBox="0 0 80 100" style={style}>
      <Line x1={52} y1={4} x2={44} y2={46} stroke={colors.cobalt} strokeWidth={3} strokeLinecap="round" />
      <Path d="M14 22 C 14 50, 26 62, 40 62 C 54 62, 66 50, 66 22 Z" fill={colors.card} stroke={colors.ink} strokeWidth={2.5} />
      <Path d="M17 34 C 19 52, 28 59, 40 59 C 52 59, 61 52, 63 34 Z" fill={colors.aperol} />
      <Rect x={26} y={36} width={9} height={9} rx={2} fill={colors.card} opacity={0.7} transform="rotate(-12 30 40)" />
      <Rect x={42} y={40} width={8} height={8} rx={2} fill={colors.card} opacity={0.6} transform="rotate(18 46 44)" />
      <Path d="M40 62 L 40 88" stroke={colors.ink} strokeWidth={2.5} strokeLinecap="round" />
      <Ellipse cx={40} cy={90} rx={16} ry={3.5} fill={colors.card} stroke={colors.ink} strokeWidth={2.5} />
      <G transform="translate(52 10)">
        <Circle cx={10} cy={12} r={11} fill={colors.aperol} stroke={colors.ink} strokeWidth={2} />
        <Circle cx={10} cy={12} r={7.5} fill={colors.peach} />
        <Path d="M10 4.5 L10 19.5 M2.5 12 L17.5 12 M4.7 6.7 L15.3 17.3 M15.3 6.7 L4.7 17.3" stroke={colors.card} strokeWidth={1.4} />
      </G>
    </Svg>
  );
}

// squiggle line, like the water lines on an old menu
export function Wave({ width = 200, color = colors.cobalt, style }) {
  const segments = Math.ceil(width / 20);
  let d = 'M0 6';
  for (let i = 0; i < segments; i += 1) d += ` q 5 -6 10 0 t 10 0`;
  return (
    <Svg width={width} height={12} viewBox={`0 0 ${width} 12`} style={style}>
      <Path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function Starburst({ size = 64, color = colors.blood, points = 14, style, children }) {
  const pts = [];
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? 30 : 25;
    const a = (Math.PI * i) / points - Math.PI / 2;
    pts.push(`${32 + Math.cos(a) * r},${32 + Math.sin(a) * r}`);
  }
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} viewBox="0 0 64 64" style={{ position: 'absolute' }}>
        <Polygon points={pts.join(' ')} fill={color} stroke={colors.ink} strokeWidth={1.5} />
      </Svg>
      {children}
    </View>
  );
}

// the scalloped edge on the bottom of a cabana awning
export function Scallops({ width, color = colors.aperol, size = 22 }) {
  const count = Math.ceil(width / size);
  let d = `M0 0 L${count * size} 0`;
  for (let i = count; i > 0; i -= 1) {
    d += ` A ${size / 2} ${size / 2} 0 0 1 ${(i - 1) * size} 0`;
  }
  return (
    <Svg width={width} height={size / 2 + 2} viewBox={`0 0 ${width} ${size / 2 + 2}`}>
      <Path d={d} fill={color} stroke={colors.ink} strokeWidth={2} />
    </Svg>
  );
}

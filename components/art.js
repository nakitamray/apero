import React from 'react';
import { Image, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

// painted cut-outs (assets/art). ratio = width / height
const ART = {
  sardine: { src: require('../assets/art/sardine.png'), ratio: 3.211 },
  lemon: { src: require('../assets/art/lemon.png'), ratio: 1.064 },
  lemonSlice: { src: require('../assets/art/lemon_slice.png'), ratio: 1.017 },
  orangeSlice: { src: require('../assets/art/orange_slice.png'), ratio: 1.014 },
  bloodOrange: { src: require('../assets/art/blood_orange.png'), ratio: 1.027 },
  spritz: { src: require('../assets/art/spritz.png'), ratio: 0.733 },
  plate: { src: require('../assets/art/plate.png'), ratio: 1 },
  tin: { src: require('../assets/art/tin.png'), ratio: 1.538 },
  starfish: { src: require('../assets/art/starfish.png'), ratio: 1.039 },
  tile: { src: require('../assets/art/tile.png'), ratio: 1 },
  vase: { src: require('../assets/art/vase.png'), ratio: 0.528 },
  swash: { src: require('../assets/art/swash.png'), ratio: 13.636 },
};

export const PLATTERS = {
  blue: require('../assets/art/platter_blue.png'),
  orange: require('../assets/art/platter_orange.png'),
  lemon: require('../assets/art/platter_lemon.png'),
};

export const WAVES = {
  cobalt: require('../assets/art/waves.png'),
  aqua: require('../assets/art/waves_aqua.png'),
  orange: require('../assets/art/waves_orange.png'),
};

export function Sticker({ name, width, rotate = 0, flip, style }) {
  const art = ART[name];
  return (
    <Image
      source={art.src}
      style={[
        { width, height: width / art.ratio },
        { transform: [{ rotate: `${rotate}deg` }, ...(flip ? [{ scaleX: -1 }] : [])] },
        style,
      ]}
      resizeMode="contain"
    />
  );
}

// ragged bottom edge where the blue header is "torn" off
export function TornEdge({ width, color = colors.page, height = 16, seed = 3 }) {
  let x = 0;
  let r = seed;
  const rand = () => {
    r = (r * 9301 + 49297) % 233280;
    return r / 233280;
  };
  let d = `M0 ${height} L0 ${height * 0.5}`;
  while (x < width) {
    x += 6 + rand() * 12;
    d += ` L${x.toFixed(1)} ${(height * (0.15 + rand() * 0.7)).toFixed(1)}`;
  }
  d += ` L${width} ${height} Z`;
  return (
    <Svg width={width} height={height} style={{ marginTop: -height + 1 }}>
      <Path d={d} fill={color} />
    </Svg>
  );
}

// postage stamp outline with perforated edges
export function StampFrame({ width, height, color = colors.paper, children, style }) {
  const r = 3.2;
  const step = 9;
  const holes = (len, horizontal, offset) => {
    let d = '';
    for (let p = step / 2; p < len; p += step) {
      const cx = horizontal ? p : offset;
      const cy = horizontal ? offset : p;
      d += `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0 `;
    }
    return d;
  };
  const outline = `M0 0 H${width} V${height} H0 Z`;
  const cut =
    holes(width, true, 0) + holes(width, true, height) + holes(height, false, 0) + holes(height, false, width);
  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height} style={{ position: 'absolute' }}>
        <Path d={outline + cut} fill={color} fillRule="evenodd" />
      </Svg>
      {children}
    </View>
  );
}

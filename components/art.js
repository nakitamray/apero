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
  goldfish: { src: require('../assets/art/goldfish.png'), ratio: 1.674 },
  shell: { src: require('../assets/art/shell.png'), ratio: 1 },
  stamp: { src: require('../assets/art/stamp.png'), ratio: 0.81 },
  matchbox: { src: require('../assets/art/matchbox.png'), ratio: 1.852 },
  burst: { src: require('../assets/art/burst.png'), ratio: 1 },
  vase: { src: require('../assets/art/vase.png'), ratio: 0.528 },
  swash: { src: require('../assets/art/swash.png'), ratio: 13.636 },
};

export const BACKGROUNDS = {
  orange: require('../assets/art/bg_orange.jpg'),
  cobalt: require('../assets/art/bg_tiles.jpg'),
};

export const PLATTERS = {
  blue: require('../assets/art/platter_blue.png'),
  orange: require('../assets/art/platter_orange.png'),
  lemon: require('../assets/art/platter_lemon.png'),
};

export const WAVES = {
  aqua: require('../assets/art/waves_aqua.jpg'),
  orange: require('../assets/art/waves_orange.jpg'),
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

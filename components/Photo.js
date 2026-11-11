import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { loadPhoto } from '../lib/api';
import { colors } from '../theme';

// a review photo: "photo:<id>" (saved in Firestore), a plain link, or a bundled image in the demo.
// saved ones load once and stay cached for the rest of the session
const cache = {};

const fetchPhoto = (id) => {
  if (!cache[id]) cache[id] = loadPhoto(id).catch(() => null);
  return cache[id];
};

export default function Photo({ photo, style }) {
  const saved = typeof photo === 'string' && photo.startsWith('photo:') ? photo.slice(6) : null;
  const [uri, setUri] = useState(null);

  useEffect(() => {
    if (!saved) return;
    let live = true;
    fetchPhoto(saved).then((data) => live && setUri(data));
    return () => {
      live = false;
    };
  }, [saved]);

  if (!saved) return <Image source={typeof photo === 'string' ? { uri: photo } : photo} style={style} />;
  if (!uri) return <View style={[style, { backgroundColor: colors.mist }]} />;
  return <Image source={{ uri }} style={style} />;
}

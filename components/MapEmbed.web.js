import React from 'react';
import { StyleSheet, View } from 'react-native';
import { mapEmbedUrl } from '../lib/trip';

// react-native-webview doesn't run in the browser, a plain iframe does the same job
export default function MapEmbed({ place, campus, height = 210 }) {
  return (
    <View style={[styles.frame, { height }]}>
      <iframe
        title={`Map of ${place.name}`}
        src={mapEmbedUrl(place, campus)}
        style={{ border: 0, width: '100%', height: '100%' }}
        loading="lazy"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 10, overflow: 'hidden' },
});

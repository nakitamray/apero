import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { mapEmbedUrl } from '../lib/trip';

export default function MapEmbed({ place, campus, height = 210 }) {
  return (
    <View style={[styles.frame, { height }]}>
      <WebView source={{ uri: mapEmbedUrl(place, campus) }} style={{ flex: 1 }} scrollEnabled={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 10, overflow: 'hidden' },
});

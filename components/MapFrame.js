import React from 'react';
import { WebView } from 'react-native-webview';

// pages load as if from the website, so a Google key locked to the site's address works in the app too
const SITE = process.env.EXPO_PUBLIC_SITE_URL
  ? `${process.env.EXPO_PUBLIC_SITE_URL.replace(/\/$/, '')}/`
  : 'https://localhost/';

// a self-contained map page; it talks back with window.ReactNativeWebView.postMessage
export default function MapFrame({ html, onMessage }) {
  return (
    <WebView
      originWhitelist={['*']}
      source={{ html, baseUrl: SITE }}
      onMessage={(e) => {
        try {
          onMessage(JSON.parse(e.nativeEvent.data));
        } catch {}
      }}
      style={{ flex: 1, backgroundColor: 'transparent' }}
      nestedScrollEnabled
      setBuiltInZoomControls={false}
    />
  );
}

// Phones: react-native-maps. Google Maps on Android; Apple Maps on iPhone in Expo Go, Google Maps in a
// real build once a key is set (see app.config.js). Pinch to zoom, drag to move, tap a pin to pick it.
import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MapPin, YouDot } from './MapPin';

const useGoogleOnIos = !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY;

export default function PlacesMapView({ pins, center, you, selected, onSelect }) {
  const map = useRef(null);
  const [names, setNames] = useState(false);
  // custom pins must redraw once after their first layout, then stay still (smoother on Android)
  const [settling, setSettling] = useState(true);
  useEffect(() => {
    setSettling(true);
    const t = setTimeout(() => setSettling(false), 800);
    return () => clearTimeout(t);
  }, [pins, selected, names]);

  const fit = () => {
    const points = [...pins.map((p) => ({ latitude: p.lat, longitude: p.lng })), ...(you ? [toLL(you)] : [])];
    if (points.length) {
      map.current?.fitToCoordinates([toLL(center), ...points], {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: false,
      });
    }
  };

  return (
    <MapView
      ref={map}
      style={{ flex: 1 }}
      provider={Platform.OS === 'android' || useGoogleOnIos ? PROVIDER_GOOGLE : undefined}
      initialRegion={{ ...toLL(center), latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      onMapReady={fit}
      onPress={(e) => e.nativeEvent.action !== 'marker-press' && onSelect(null)}
      onRegionChangeComplete={(r) => setNames(r.latitudeDelta < 0.012)}
      showsPointsOfInterest={false}
      toolbarEnabled={false}
    >
      {pins.map((p) => (
        <Marker
          key={p.id}
          coordinate={{ latitude: p.lat, longitude: p.lng }}
          anchor={{ x: 0.07, y: 0.5 }}
          centerOffset={{ x: 0, y: 0 }}
          zIndex={p.id === selected ? 10 : 1}
          tracksViewChanges={settling}
          onPress={() => onSelect(p.id)}
        >
          <MapPin pin={p} selected={p.id === selected} showName={names} />
        </Marker>
      ))}
      {you && (
        <Marker coordinate={toLL(you)} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false} zIndex={20}>
          <YouDot />
        </Marker>
      )}
    </MapView>
  );
}

const toLL = (p) => ({ latitude: p[0], longitude: p[1] });

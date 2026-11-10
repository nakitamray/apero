// Website: Google's official React library for Google Maps (@vis.gl/react-google-maps), with our pins
// as markers. Needs EXPO_PUBLIC_GOOGLE_MAPS_KEY; until that's set, a free OpenStreetMap map stands in.
import React, { useEffect, useState } from 'react';
import { APIProvider, AdvancedMarker, Map, useMap } from '@vis.gl/react-google-maps';
import { MapPin, YouDot } from './MapPin';
import MapFrame from './MapFrame';
import { mapHtml } from '../lib/mapHtml';

const KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
// Google needs a map ID for custom markers; DEMO_MAP_ID works until you make your own
const MAP_ID = process.env.EXPO_PUBLIC_GOOGLE_MAP_ID || 'DEMO_MAP_ID';

export default function PlacesMapView(props) {
  return KEY ? <GoogleMap {...props} /> : <Fallback {...props} />;
}

function GoogleMap({ pins, center, you, selected, onSelect }) {
  const [names, setNames] = useState(false);
  return (
    <APIProvider apiKey={KEY}>
      <Map
        style={{ width: '100%', height: '100%' }}
        mapId={MAP_ID}
        defaultCenter={{ lat: center[0], lng: center[1] }}
        defaultZoom={15}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        clickableIcons={false}
        onZoomChanged={(e) => setNames(e.detail.zoom >= 15)}
        onClick={() => onSelect(null)}
      >
        <FitOnce pins={pins} center={center} you={you} />
        {pins.map((p) => (
          <AdvancedMarker
            key={p.id}
            position={{ lat: p.lat, lng: p.lng }}
            zIndex={p.id === selected ? 10 : 1}
            anchorLeft="-14px"
            anchorTop="-14px"
            onClick={() => onSelect(p.id)}
          >
            <MapPin pin={p} selected={p.id === selected} showName={names} />
          </AdvancedMarker>
        ))}
        {you && (
          <AdvancedMarker position={{ lat: you[0], lng: you[1] }} zIndex={20}>
            <YouDot />
          </AdvancedMarker>
        )}
      </Map>
    </APIProvider>
  );
}

// zoom to show every pin the first time the map is ready
function FitOnce({ pins, center, you }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !window.google) return;
    const b = new window.google.maps.LatLngBounds();
    b.extend({ lat: center[0], lng: center[1] });
    pins.forEach((p) => b.extend({ lat: p.lat, lng: p.lng }));
    if (you) b.extend({ lat: you[0], lng: you[1] });
    map.fitBounds(b, 40);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

function Fallback({ pins, center, you, campusLabel, onSelect }) {
  const html = React.useMemo(
    () => mapHtml({ pins, center, you, campusLabel }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pins.map((p) => p.id + p.score).join(), String(you)],
  );
  return <MapFrame html={html} onMessage={(m) => onSelect(m.id || null)} />;
}

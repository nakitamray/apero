import React, { useEffect, useRef } from 'react';

// same map page in an iframe; it talks back with window.parent.postMessage
export default function MapFrame({ html, onMessage }) {
  const frame = useRef(null);
  useEffect(() => {
    const listen = (e) => {
      if (e.source !== frame.current?.contentWindow || !e.data?.apero) return;
      onMessage(e.data);
    };
    window.addEventListener('message', listen);
    return () => window.removeEventListener('message', listen);
  }, [onMessage]);
  return (
    <iframe
      ref={frame}
      title="Map of places"
      srcDoc={html}
      allow="geolocation"
      style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
    />
  );
}

// Builds the little map page shown in Explore: one pin per place with its score, "you" if we know
// where you are, and the campus. Tapping a pin posts { apero: true, type: 'select', id } back to the app.
// With EXPO_PUBLIC_GOOGLE_MAPS_KEY set it's a Google map; without one it falls back to a free
// OpenStreetMap map (Leaflet) so the demo still works.

export const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function mapHtml({ pins, center, you, campusLabel }) {
  const data = JSON.stringify({ pins, center, you, campusLabel: esc(campusLabel) }).replace(/</g, '\\u003c');
  return GOOGLE_MAPS_KEY ? googleHtml(data) : leafletHtml(data);
}

const SEND = `function send(msg) {
    msg.apero = true;
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    else if (window.parent !== window) window.parent.postMessage(msg, '*');
  }`;

const TONES = { hall: '#0B7F94', spot: '#FF7B1C', date: '#D9441E' };

// soft, low-clutter Google styling so the pins carry the color
const GOOGLE_STYLE = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', stylers: [{ color: '#BFE6F0' }] },
  { featureType: 'landscape', stylers: [{ color: '#F6F3EA' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#55648A' }] },
];

function googleHtml(data) {
  return `<!doctype html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body, #map { margin: 0; height: 100%; background: #EAF2FA; }
</style>
</head><body><div id="map"></div>
<script>
  var D = ${data};
  var TONES = ${JSON.stringify(TONES)};
  ${SEND}
  function init() {
    var at = function (p) { return { lat: p[0], lng: p[1] }; };
    var map = new google.maps.Map(document.getElementById('map'), {
      center: at(D.center), zoom: 15, disableDefaultUI: true, clickableIcons: false,
      gestureHandling: 'greedy', styles: ${JSON.stringify(GOOGLE_STYLE)}
    });
    var bounds = new google.maps.LatLngBounds();
    bounds.extend(at(D.center));
    new google.maps.Marker({ position: at(D.center), map: map, clickable: false,
      icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0 },
      label: { text: D.campusLabel.toUpperCase(), color: '#13285E', fontSize: '11px', fontWeight: '700' } });
    var markers = [];
    function icon(p, on) {
      return { path: google.maps.SymbolPath.CIRCLE, scale: (p.score != null ? 13 : 8) * (on ? 1.3 : 1),
        fillColor: TONES[p.tone], fillOpacity: 1, strokeColor: on ? '#FFD43B' : '#FFFDF7', strokeWeight: 2.5 };
    }
    D.pins.forEach(function (p) {
      var m = new google.maps.Marker({ position: { lat: p.lat, lng: p.lng }, map: map, icon: icon(p, false),
        label: p.score != null ? { text: p.score, color: '#FFFDF7', fontSize: '11px', fontWeight: '700' } : null });
      m.addListener('click', function () {
        markers.forEach(function (x) { x.m.setIcon(icon(x.p, x.p.id === p.id)); });
        send({ type: 'select', id: p.id });
      });
      markers.push({ m: m, p: p });
      bounds.extend({ lat: p.lat, lng: p.lng });
    });
    if (D.you) {
      new google.maps.Marker({ position: at(D.you), map: map, clickable: false, zIndex: 9999,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#2456B8', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 } });
      bounds.extend(at(D.you));
    }
    var fit = function () { if (D.pins.length || D.you) map.fitBounds(bounds, 36); };
    google.maps.event.addListenerOnce(map, 'idle', fit); window.addEventListener('resize', fit);
    map.addListener('click', function () { send({ type: 'select', id: null }); });
  }
  window.gm_authFailure = function () {
    document.body.innerHTML = '<p style="font:15px system-ui;color:#55648A;padding:24px;text-align:center">The map key isn\\'t set up for this site yet.</p>';
  };
</script>
<script async src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_KEY)}&callback=init&v=weekly"></script>
</body></html>`;
}

function leafletHtml(data) {
  return `<!doctype html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
  integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<style>
  html, body, #map { margin: 0; height: 100%; background: #EAF2FA; }
  .leaflet-container { font-family: -apple-system, system-ui, Roboto, sans-serif; }
  .pin { display: flex; align-items: center; justify-content: center; border-radius: 50%;
    border: 2.5px solid #FFFDF7; box-shadow: 0 3px 8px rgba(19,40,94,.35); color: #FFFDF7;
    font: 700 12px/1 -apple-system, system-ui, Roboto, sans-serif; transition: transform .15s; }
  .pin.on { transform: scale(1.35); border-color: #FFD43B; z-index: 1000; }
  .hall { background: #0B7F94; } .spot { background: #FF7B1C; } .date { background: #D9441E; }
  .you { width: 16px; height: 16px; border-radius: 50%; background: #2456B8; border: 3px solid #fff;
    box-shadow: 0 0 0 6px rgba(36,86,184,.25); }
  .campus { padding: 4px 8px; border-radius: 12px; background: #13285E; color: #FFFDF7; white-space: nowrap;
    font: 700 10px/1.2 -apple-system, system-ui, Roboto, sans-serif; letter-spacing: .08em; text-transform: uppercase;
    transform: translate(-50%, -50%); display: inline-block; }
  .leaflet-control-attribution { font-size: 9px; }
  .leaflet-tile-pane { filter: saturate(.75) brightness(1.04); }
</style>
</head><body><div id="map"></div>
<script>
  var D = ${data};
  ${SEND}
  if (!window.L) {
    document.body.innerHTML = '<p style="font:15px system-ui;color:#55648A;padding:24px;text-align:center">The map needs an internet connection.</p>';
  } else {
    var map = L.map('map', { zoomControl: false, attributionControl: true, keyboard: false }).setView(D.center, 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    L.marker(D.center, { icon: L.divIcon({ className: '', html: '<span class="campus">' + D.campusLabel + '</span>', iconSize: [0, 0] }), interactive: false }).addTo(map);
    var bounds = [D.center];
    var markers = {};
    D.pins.forEach(function (p) {
      var size = p.score != null ? 30 : 18;
      var icon = L.divIcon({ className: '', iconSize: [size, size],
        html: '<div class="pin ' + p.tone + '' + '" style="width:' + (size - 5) + 'px;height:' + (size - 5) + 'px">' + (p.score != null ? p.score : '') + '</div>' });
      var m = L.marker([p.lat, p.lng], { icon: icon, riseOnHover: true }).addTo(map);
      m.on('click', function () {
        Object.keys(markers).forEach(function (id) { var el = markers[id].getElement(); if (el) el.firstChild.classList.toggle('on', id === p.id); });
        send({ type: 'select', id: p.id });
      });
      markers[p.id] = m;
      bounds.push([p.lat, p.lng]);
    });
    if (D.you) {
      L.marker(D.you, { icon: L.divIcon({ className: '', html: '<div class="you"></div>', iconSize: [22, 22] }), interactive: false, zIndexOffset: 2000 }).addTo(map);
      bounds.push(D.you);
    }
    // the frame can still be sizing itself, so re-fit whenever its size settles (until you touch the map)
    var touched = false;
    ['pointerdown', 'wheel'].forEach(function (e) { map.getContainer().addEventListener(e, function () { touched = true; }); });
    var fit = function () {
      map.invalidateSize();
      if (!touched && bounds.length > 1) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 16, animate: false });
    };
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(map.getContainer());
    [200, 600, 1500].forEach(function (t) { setTimeout(fit, t); });
    map.on('click', function () { send({ type: 'select', id: null }); });
  }
</script>
</body></html>`;
}

// The website's stand-in map for when there's no Google key yet: a free OpenStreetMap map (Leaflet) in an
// iframe, with the same pins as the Google one. Tapping a pin posts { apero: true, type: 'select', id } back.
import LEAFLET_CSS from './leafletCss';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function mapHtml({ pins, center, you, campusLabel }) {
  const data = JSON.stringify({
    pins: pins.map((p) => ({ ...p, name: esc(p.name) })),
    center,
    you,
    campusLabel: esc(campusLabel),
  }).replace(/</g, '\\u003c');
  return leafletHtml(data);
}

// fork and knife (Material "restaurant" icon, Apache 2.0)
const FORK =
  '<svg viewBox="0 0 24 24" width="13" height="13" fill="#fff"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>';

const HEAD = `<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />`;

// pins, matching components/MapPin.js
const PIN_CSS = `
  html, body, #map { margin: 0; height: 100%; background: #F2EFE9; }
  body { font-family: Roboto, -apple-system, system-ui, sans-serif; -webkit-tap-highlight-color: transparent; }
  .pin { position: absolute; transform: translate(-50%, -50%); display: flex; align-items: center; cursor: pointer; }
  .dot { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.35); color: #fff;
    font: 700 11px/1 Roboto, -apple-system, system-ui, sans-serif; letter-spacing: -.02em;
    transition: transform .15s ease; flex: none; }
  .name { position: absolute; left: 30px; top: 50%; transform: translateY(-50%); white-space: nowrap;
    font: 600 12px/1.15 Roboto, -apple-system, system-ui, sans-serif; display: none;
    text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 3px #fff; }
  .labels .name, .pin.on .name { display: block; }
  .pin.on { z-index: 1000 !important; }
  .pin.on .dot { transform: scale(1.3); box-shadow: 0 0 0 3px #FFD43B, 0 2px 6px rgba(0,0,0,.4); }
  .hall .dot { background: #0B7F94; } .hall .name { color: #0B6E80; }
  .spot .dot { background: #FF7B1C; } .spot .name { color: #C9560A; }
  .date .dot { background: #D9441E; } .date .name { color: #B5371A; }
  .you { position: absolute; transform: translate(-50%, -50%); width: 14px; height: 14px; border-radius: 50%;
    background: #1A73E8; border: 3px solid #fff; box-shadow: 0 0 0 7px rgba(26,115,232,.2), 0 1px 3px rgba(0,0,0,.3); }
  .campus { position: absolute; transform: translate(-50%, -50%); padding: 4px 9px; border-radius: 12px;
    background: #13285E; color: #fff; white-space: nowrap; box-shadow: 0 1px 4px rgba(0,0,0,.3);
    font: 700 10px/1.2 Roboto, -apple-system, system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; }
`;

// shared page code: draws the pins with whatever map is underneath (place(el, lat, lng) puts a div on it)
const PIN_JS = `
  var FORK = ${JSON.stringify(FORK)};
  function send(msg) {
    msg.apero = true;
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    else if (window.parent !== window) window.parent.postMessage(msg, '*');
  }
  var pinEls = {};
  function select(id) {
    Object.keys(pinEls).forEach(function (k) { pinEls[k].classList.toggle('on', k === id); });
    send({ type: 'select', id: id });
  }
  function pinEl(p) {
    var el = document.createElement('div');
    el.className = 'pin ' + p.tone;
    el.innerHTML = '<div class="dot">' + (p.score != null ? p.score : FORK) + '</div><div class="name">' + p.name + '</div>';
    el.addEventListener('click', function (e) { e.stopPropagation(); select(p.id); });
    pinEls[p.id] = el;
    return el;
  }
  function simpleEl(cls, html) {
    var el = document.createElement('div');
    el.className = cls;
    el.innerHTML = html || '';
    return el;
  }
  // names show once you're zoomed in enough for them not to pile up
  function setLabels(zoom) { document.body.classList.toggle('labels', zoom >= 15); }
`;

function leafletHtml(data) {
  return `<!doctype html>
<html><head>${HEAD}
<style>${LEAFLET_CSS}</style>
<style>${PIN_CSS}
  .leaflet-container { background: #F2EFE9; font-family: Roboto, -apple-system, system-ui, sans-serif; }
  .leaflet-div-icon-plain { background: none; border: 0; }
  .leaflet-div-icon-plain .pin, .leaflet-div-icon-plain .you, .leaflet-div-icon-plain .campus { left: 0; top: 0; }
  .leaflet-control-attribution { font-size: 9px; }
  /* +/- buttons like Google's */
  .leaflet-bar { border: 0 !important; box-shadow: 0 1px 4px rgba(0,0,0,.3) !important; border-radius: 8px !important; overflow: hidden; }
  .leaflet-bar a { width: 36px !important; height: 36px !important; line-height: 36px !important; font-size: 20px !important; color: #555 !important; }
</style>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
  integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
</head><body><div id="map"></div>
<script>
  var D = ${data};
  ${PIN_JS}
  if (!window.L) {
    document.body.innerHTML = '<p style="font:15px system-ui;color:#55648A;padding:24px;text-align:center">The map needs an internet connection.</p>';
  } else {
    var map = L.map('map', { zoomControl: false, keyboard: false, attributionControl: true }).setView(D.center, 15);
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    var put = function (pos, el, z) {
      var icon = L.divIcon({ className: 'leaflet-div-icon-plain', iconSize: [0, 0], html: '' });
      var m = L.marker(pos, { icon: icon, zIndexOffset: z || 0, keyboard: false }).addTo(map);
      m.getElement().appendChild(el);
      return m;
    };
    var bounds = [D.center];
    put(D.center, simpleEl('campus', D.campusLabel), -100);
    D.pins.forEach(function (p) { put([p.lat, p.lng], pinEl(p)); bounds.push([p.lat, p.lng]); });
    if (D.you) { put(D.you, simpleEl('you'), 2000); bounds.push(D.you); }
    // the frame can still be sizing itself, so re-fit whenever its size settles (until you touch the map)
    var touched = false;
    ['pointerdown', 'wheel'].forEach(function (e) { map.getContainer().addEventListener(e, function () { touched = true; }); });
    var fit = function () {
      map.invalidateSize();
      if (!touched && bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: false });
    };
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(map.getContainer());
    [200, 600, 1500].forEach(function (t) { setTimeout(fit, t); });
    setLabels(map.getZoom());
    map.on('zoomend', function () { setLabels(map.getZoom()); });
    map.on('click', function () { select(null); });
  }
</script>
</body></html>`;
}

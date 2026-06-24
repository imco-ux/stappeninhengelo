'use client';
import { useEffect, useRef, useState } from 'react';

// Laad Google Maps script eenmalig (singleton)
let _loaded = false;
let _loading = false;
const _queue = [];

function ensureMapsLoaded(cb) {
  if (_loaded) { cb(); return; }
  _queue.push(cb);
  if (_loading) return;
  _loading = true;

  // Al geladen door een andere component (bijv. GoogleVenueMap)?
  if (window.google?.maps?.places) {
    _loaded = true;
    _queue.forEach(fn => fn());
    return;
  }

  window.__onMapsReady = () => {
    _loaded = true;
    _queue.forEach(fn => fn());
  };

  const s = document.createElement('script');
  s.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=__onMapsReady&loading=async`;
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
}

export default function PlacesInput({ value, onChange, onPlace, placeholder, className }) {
  const inputRef = useRef(null);
  const acRef = useRef(null);
  const [gereed, setGereed] = useState(false);

  useEffect(() => {
    ensureMapsLoaded(() => setGereed(true));
  }, []);

  useEffect(() => {
    if (!gereed || !inputRef.current || acRef.current) return;
    acRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'nl' },
      fields: ['formatted_address', 'geometry'],
    });
    acRef.current.addListener('place_changed', () => {
      const place = acRef.current.getPlace();
      if (!place.formatted_address) return;
      onChange(place.formatted_address);
      onPlace?.({
        adres: place.formatted_address,
        lat: place.geometry?.location?.lat() ?? null,
        lng: place.geometry?.location?.lng() ?? null,
      });
    });
  }, [gereed]);

  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" fill="none" stroke="#666" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={gereed ? (placeholder || 'Zoek adres op Google Maps...') : 'Laden...'}
        className={className || 'w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-oranje'}
      />
    </div>
  );
}

"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Search, Info } from "lucide-react";

type MapPickerProps = {
  defaultLat?: number | null;
  defaultLng?: number | null;
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
};

const RealMap = dynamic(() => import("./map/RealMapContent"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center">
      <p className="text-slate-400 text-sm">Loading Map...</p>
    </div>
  ),
});

export function MapPicker({ defaultLat, defaultLng, onLocationSelect }: MapPickerProps) {
  const [lat, setLat] = useState(defaultLat || 14.5995); // Manila default
  const [lng, setLng] = useState(defaultLng || 120.9842);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const requestId = useRef(0);
  const handleLocationSelected = useEffectEvent((newLat: number, newLng: number, address?: string) => {
    onLocationSelect(newLat, newLng, address);
  });

  useEffect(() => {
    const query = searchQuery.trim();
    requestId.current += 1;
    const currentRequestId = requestId.current;

    if (query.length < 3) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Address search failed.");
        const data = await response.json() as Array<{ lat?: string; lon?: string; display_name?: string }>;
        const firstResult = data[0];
        if (currentRequestId !== requestId.current || !firstResult?.lat || !firstResult.lon) return;

        const newLat = parseFloat(firstResult.lat);
        const newLng = parseFloat(firstResult.lon);
        if (!Number.isFinite(newLat) || !Number.isFinite(newLng)) return;
        setLat(newLat);
        setLng(newLng);
        handleLocationSelected(newLat, newLng, firstResult.display_name);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Search failed:", error);
        }
      } finally {
        if (currentRequestId === requestId.current) setIsSearching(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const handleLocationChange = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    onLocationSelect(newLat, newLng);
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault();
            }}
            placeholder="Search an address to jump to a location..."
            aria-label="Search branch address"
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        {isSearching ? <span className="self-center text-xs font-semibold text-slate-500">Searching...</span> : null}
      </div>

      <div className="relative h-72 w-full bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
        <RealMap lat={lat} lng={lng} onLocationSelect={handleLocationChange} />
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3 items-start">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <div className="text-[11px] text-blue-700 leading-relaxed">
          <p>• Search an address to jump to a location.</p>
          <p>• Click on the map to place the branch pin.</p>
          <p>• You can also drag the marker to fine-tune the location.</p>
          <p>• Latitude and longitude fields update automatically.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="field">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Selected Latitude</label>
            <input type="number" step="any" readOnly value={lat} name="latitude" className="bg-slate-50 cursor-not-allowed" />
        </div>
        <div className="field">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Selected Longitude</label>
            <input type="number" step="any" readOnly value={lng} name="longitude" className="bg-slate-50 cursor-not-allowed" />
        </div>
      </div>
    </div>
  );
}

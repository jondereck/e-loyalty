"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Search, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";

type MapPickerProps = {
  defaultLat?: number | null;
  defaultLng?: number | null;
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
};

export function MapPicker({ defaultLat, defaultLng, onLocationSelect }: MapPickerProps) {
  const [lat, setLat] = useState(defaultLat || 14.5995); // Manila default
  const [lng, setLng] = useState(defaultLng || 120.9842);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const RealMap = useMemo(
    () =>
      dynamic(() => import("./map/RealMapContent"), {
        ssr: false,
        loading: () => (
          <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center">
            <p className="text-slate-400 text-sm">Loading Map...</p>
          </div>
        ),
      }),
    [],
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery,
        )}`,
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        setLat(newLat);
        setLng(newLng);
        onLocationSelect(newLat, newLng, data[0].display_name);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

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
            placeholder="Search an address to jump to a location..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        <Button onClick={handleSearch} type="button" className="shrink-0" disabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </Button>
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

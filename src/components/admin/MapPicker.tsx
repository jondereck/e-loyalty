"use client";

import { useEffect, useRef, useState } from "react";
import { Search, MapPin } from "lucide-react";
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
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Mock implementation since we can't easily integrate real Google Maps without an API key in this environment
  // We'll simulate the UI of a map picker

  useEffect(() => {
    // In a real app, we would load the Google Maps Script here
    setIsLoaded(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate finding a location
    const newLat = lat + (Math.random() - 0.5) * 0.01;
    const newLng = lng + (Math.random() - 0.5) * 0.01;
    setLat(newLat);
    setLng(newLng);
    onLocationSelect(newLat, newLng, searchQuery);
  };

  const handleMapClick = () => {
    const newLat = lat + (Math.random() - 0.5) * 0.005;
    const newLng = lng + (Math.random() - 0.5) * 0.005;
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
            placeholder="Search for a location..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        <Button onClick={handleSearch} type="button" className="shrink-0">
          Search
        </Button>
      </div>

      <div
        onClick={handleMapClick}
        className="relative h-64 w-full bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-crosshair hover:bg-slate-50 transition-colors group overflow-hidden"
      >
        {/* Mock Map Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        </div>

        <div className="z-10 flex flex-col items-center gap-2">
            <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
                <MapPin size={24} />
            </div>
            <p className="text-sm font-medium text-slate-600">Click to pin branch location</p>
            <p className="text-[10px] text-slate-400">Simulated Map View</p>
        </div>

        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-2 rounded-lg text-[10px] font-mono border border-slate-100 shadow-sm">
            Lat: {lat.toFixed(6)} <br />
            Lng: {lng.toFixed(6)}
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

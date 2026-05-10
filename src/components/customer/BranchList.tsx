"use client";

import { useEffect, useState } from "react";
import { MapPin, Phone, ExternalLink } from "lucide-react";

type Branch = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
};

export function BranchList({ branches }: { branches: Branch[] }) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortedBranches, setSortedBranches] = useState<(Branch & { distance?: number })[]>(branches);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      });
    }
  }, []);

  useEffect(() => {
    if (userLocation) {
      const withDistance = branches.map((b) => {
        if (b.latitude !== null && b.longitude !== null) {
          const dist = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
          return { ...b, distance: dist };
        }
        return b;
      });

      withDistance.sort((a, b) => {
        const distA = (a as any).distance;
        const distB = (b as any).distance;
        if (distA !== undefined && distB !== undefined) return distA - distB;
        if (distA !== undefined) return -1;
        if (distB !== undefined) return 1;
        return 0;
      });

      setSortedBranches(withDistance);
    }
  }, [userLocation, branches]);

  return (
    <div className="lp-branch-list">
      {sortedBranches.map((branch) => (
        <div key={branch.id} className="lp-mini-card lp-branch-card">
          <div className="lp-branch-info">
            <strong>{branch.name}</strong>
            <p className="muted small">
              <MapPin size={14} style={{ display: "inline", marginRight: 4 }} />
              {branch.address || "No address provided"}
            </p>
            {branch.phone && (
              <p className="muted small">
                <Phone size={14} style={{ display: "inline", marginRight: 4 }} />
                {branch.phone}
              </p>
            )}
            {branch.distance !== undefined && (
              <span className="lp-pill green small" style={{ marginTop: 8, display: "inline-block" }}>
                {branch.distance.toFixed(1)} km away
              </span>
            )}
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              branch.address || branch.name
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="lp-icon-button"
            title="View on Google Maps"
          >
            <ExternalLink size={18} />
          </a>
        </div>
      ))}
    </div>
  );
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

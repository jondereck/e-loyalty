"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Phone, ExternalLink } from "lucide-react";

type Branch = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
};

type BranchWithDistance = Branch & { distance?: number };

export function BranchList({ branches }: { branches: Branch[] }) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

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

  const sortedBranches = useMemo<BranchWithDistance[]>(() => {
    if (!userLocation) return branches;

    return branches
      .map<BranchWithDistance>((branch) => {
        if (branch.latitude !== null && branch.longitude !== null) {
          return {
            ...branch,
            distance: calculateDistance(userLocation.lat, userLocation.lng, branch.latitude, branch.longitude),
          };
        }
        return { ...branch };
      })
      .sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) return a.distance - b.distance;
        if (a.distance !== undefined) return -1;
        if (b.distance !== undefined) return 1;
        return 0;
      });
  }, [branches, userLocation]);


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
            href={`https://www.google.com/maps/search/?api=1&query=${
              branch.latitude !== null && branch.longitude !== null
                ? `${branch.latitude},${branch.longitude}`
                : encodeURIComponent(branch.address || branch.name)
            }`}
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

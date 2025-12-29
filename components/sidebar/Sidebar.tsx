"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Search,
  Phone,
  Calendar,
  Route,
  X,
  CarFront,
  Bike,
  Footprints,
  Motorbike,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export interface SidebarBranch {
  id: number;
  name: string;
  address: string;
  phone: string;
  services: string[];
  lat: number;
  lng: number;
  hours: string;
  bookingUrl?: string;
  mapsUrl?: string;
  city: string;
}

const decodePolyline = (encoded: string) => {
  let index = 0;
  const coordinates: [number, number][] = [];
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
};

const formatDistance = (distance: number | null) => {
  if (typeof distance !== "number") return null;
  if (distance >= 1000) return `${(distance / 1000).toFixed(1)} km`;
  return `${Math.round(distance)} m`;
};

const formatDuration = (duration: number | null) => {
  if (typeof duration !== "number") return null;
  const minutes = Math.round(duration / 60000);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours} giờ ${remainingMinutes} phút` : `${hours} giờ`;
  }
  return `${Math.max(minutes, 1)} phút`;
};

const vehicleOptions = [
  { value: "car", label: "Ô tô", icon: CarFront },
  { value: "motorcycle", label: "Xe máy", icon: Motorbike },
  { value: "bike", label: "Xe đạp", icon: Bike },
  { value: "foot", label: "Đi bộ", icon: Footprints },
];

const toRadians = (value: number) => (value * Math.PI) / 180;

const calculateDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export interface SidebarProps {
  showSidebar: boolean;
  isMobile: boolean;
  searchTerm: string;
  selectedCity: string;
  cities: string[];
  allBranches: SidebarBranch[];
  groupedBranches: Record<string, SidebarBranch[]>;
  userLocation: { lat: number; lng: number } | null;
  requestUserLocation: () => void;
  isLoadingLocation: boolean;
  onPreviewRoute: (
    origin: { lat: number; lng: number; label?: string },
    destination: { lat: number; lng: number; label?: string },
    routeCoordinates?: [number, number][]
  ) => void;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  setSelectedCity: React.Dispatch<React.SetStateAction<string>>;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedBranch: React.Dispatch<React.SetStateAction<SidebarBranch | null>>;
  setShowBookingForm: React.Dispatch<React.SetStateAction<boolean>>;
  handleBranchClick: (branch: SidebarBranch) => void;
  generateBranchSlug: (branchName: string) => string;
}

const Sidebar: React.FC<SidebarProps> = ({
  showSidebar,
  isMobile,
  searchTerm,
  selectedCity,
  cities,
  allBranches,
  groupedBranches,
  userLocation,
  requestUserLocation,
  isLoadingLocation,
  onPreviewRoute,
  setSearchTerm,
  setSelectedCity,
  setShowSidebar,
  setSelectedBranch,
  setShowBookingForm,
  handleBranchClick,
  generateBranchSlug,
}) => {
  const [directionOriginMode, setDirectionOriginMode] = useState<"my-location" | "branch" | "custom">("my-location");
  const [directionOriginBranchId, setDirectionOriginBranchId] = useState("");
  const [directionOriginCustom, setDirectionOriginCustom] = useState("");
  const [directionToId, setDirectionToId] = useState("");

  const [customOriginError, setCustomOriginError] = useState<string | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeSummary, setRouteSummary] = useState<{ distance: number | null; duration: number | null } | null>(null);

  const [selectedVehicle, setSelectedVehicle] = useState<string>("car");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const [mobileSheetState, setMobileSheetState] = useState<"collapsed" | "mid" | "expanded">("mid");
  const [isDirectionsOpen, setIsDirectionsOpen] = useState(!isMobile);

  const vietmapApiKey = process.env.NEXT_PUBLIC_VIETMAP_API_KEY;

  const branchOptions = useMemo(() => {
    const uniqueMap = new Map<number, SidebarBranch>();
    allBranches.forEach((branch) => uniqueMap.set(branch.id, branch));

    return Array.from(uniqueMap.values()).sort((a, b) => {
      if (a.city === b.city) return a.name.localeCompare(b.name);
      return a.city.localeCompare(b.city);
    });
  }, [allBranches]);

  const branchesWithDistance = useMemo(() => {
    return branchOptions
      .map((branch) => {
        const distanceMeters = originCoords
          ? calculateDistanceMeters(originCoords.lat, originCoords.lng, branch.lat, branch.lng)
          : null;
        return { ...branch, distanceMeters };
      })
      .sort((a, b) => {
        if (a.distanceMeters == null && b.distanceMeters == null) return 0;
        if (a.distanceMeters == null) return 1;
        if (b.distanceMeters == null) return -1;
        return a.distanceMeters - b.distanceMeters;
      });
  }, [branchOptions, originCoords]);

  const distanceLabelMap = useMemo(() => {
    const map = new Map<number, string | null>();
    branchesWithDistance.forEach((branch) => {
      map.set(branch.id, branch.distanceMeters != null ? formatDistance(branch.distanceMeters) : null);
    });
    return map;
  }, [branchesWithDistance]);

  const canSwapDirections =
    directionOriginMode === "branch" &&
    Boolean(directionOriginBranchId) &&
    Boolean(directionToId) &&
    directionOriginBranchId !== directionToId;

  const fetchRouteAndPreview = useCallback(
    async (
      origin: { lat: number; lng: number; label?: string },
      destination: { lat: number; lng: number; label?: string },
      options?: { silent?: boolean }
    ) => {
      if (!vietmapApiKey) {
        if (!options?.silent) setRouteError("Chưa cấu hình NEXT_PUBLIC_VIETMAP_API_KEY cho VietMap.");
        return false;
      }

      if (!options?.silent) {
        setRouteError(null);
        setRouteSummary(null);
        setIsRouteLoading(true);
      } else {
        setRouteError(null);
      }

      try {
        const params = new URLSearchParams();
        params.append("point", `${origin.lat},${origin.lng}`);
        params.append("point", `${destination.lat},${destination.lng}`);
        params.append("vehicle", selectedVehicle);
        params.append("points_encoded", "true");
        params.append("instructions", "false");
        params.append("locale", "vi");
        params.append("apikey", vietmapApiKey);

        const response = await fetch(`https://maps.vietmap.vn/api/route?${params.toString()}`);
        if (!response.ok) throw new Error(`Route request failed with status ${response.status}`);

        const data = await response.json();
        const path = Array.isArray(data.paths) ? data.paths[0] : null;
        if (!path) throw new Error("Không nhận được dữ liệu đường đi");

        let coordinates: [number, number][] = [];
        if (typeof path.points === "string") {
          coordinates = decodePolyline(path.points);
        } else if (path.points && Array.isArray((path.points as { coordinates?: [number, number][] }).coordinates)) {
          // GeoJSON style: [lng, lat] -> convert to [lat, lng]
          coordinates = ((path.points as { coordinates?: [number, number][] }).coordinates ?? []).map(
            (pair) => [pair[1], pair[0]] as [number, number]
          );
        }

        if (!coordinates.length) {
          coordinates = [
            [origin.lat, origin.lng],
            [destination.lat, destination.lng],
          ];
        }

        onPreviewRoute(origin, destination, coordinates);

        // VietMap thường trả distance (m) và time (ms) - bạn đang formatDuration theo ms => ok
        setRouteSummary({
          distance: typeof path.distance === "number" ? path.distance : null,
          duration: typeof path.time === "number" ? path.time : null,
        });

        return true;
      } catch (error) {
        console.error("[Sidebar] VietMap route error:", error);
        if (!options?.silent) setRouteError("Không thể lấy dữ liệu chỉ đường. Vui lòng thử lại.");
        return false;
      } finally {
        if (!options?.silent) setIsRouteLoading(false);
      }
    },
    [selectedVehicle, vietmapApiKey, onPreviewRoute]
  );

  const distanceLabel = formatDistance(routeSummary?.distance ?? null);
  const durationLabel = formatDuration(routeSummary?.duration ?? null);

  const handleBookingClick = (e: React.MouseEvent<HTMLButtonElement>, branch: SidebarBranch) => {
    e.stopPropagation();
    setSelectedBranch(branch);
    setShowBookingForm(true);

    if (typeof window !== "undefined") window.location.hash = generateBranchSlug(branch.name);
    if (isMobile) setShowSidebar(false);
  };

  const geocodeCustomLocation = async (query: string, options?: { quiet?: boolean }) => {
    const trimmed = query.trim();
    if (!trimmed) {
      if (!options?.quiet) setCustomOriginError("Vui lòng nhập vị trí bắt đầu.");
      return null;
    }

    const tryVietMap = async () => {
      if (!vietmapApiKey) return null;
      try {
        const params = new URLSearchParams({ text: trimmed, size: "1", apikey: vietmapApiKey });
        const res = await fetch(`https://maps.vietmap.vn/api/autocomplete?${params.toString()}`);
        if (!res.ok) return null;

        const data = await res.json();
        const candidate =
          (Array.isArray(data.data) && data.data[0]) ||
          (Array.isArray(data.features) && data.features[0]) ||
          data;

        if (!candidate) return null;

        const coords =
          candidate.location ??
          candidate.coordinate ??
          candidate.position ??
          (candidate.geometry?.coordinates
            ? { lng: candidate.geometry.coordinates[0], lat: candidate.geometry.coordinates[1] }
            : null);

        const lat = Number(candidate.lat ?? candidate.latitude ?? coords?.lat);
        const lng = Number(candidate.lng ?? candidate.longitude ?? coords?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        return { lat, lng, label: candidate.address ?? candidate.name ?? trimmed };
      } catch (error) {
        console.error("[Sidebar] VietMap geocode error:", error);
        return null;
      }
    };

    const tryNominatim = async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) return null;

        const data = await res.json();
        if (!Array.isArray(data) || !data.length) return null;

        const item = data[0];
        const lat = Number(item.lat);
        const lng = Number(item.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        return { lat, lng, label: item.display_name ?? trimmed };
      } catch (error) {
        console.error("[Sidebar] Nominatim geocode error:", error);
        return null;
      }
    };

    const vietmapResult = await tryVietMap();
    if (vietmapResult) return vietmapResult;

    const nominatimResult = await tryNominatim();
    if (nominatimResult) return nominatimResult;

    if (!options?.quiet) setCustomOriginError("Không tìm thấy vị trí. Vui lòng mô tả chi tiết hơn.");
    return null;
  };

  const resolveOriginLocation = useCallback(
    async (options?: { quiet?: boolean }) => {
      if (directionOriginMode === "my-location") {
        if (userLocation) return { ...userLocation, label: "Vị trí của tôi" };
        if (!options?.quiet) setCustomOriginError("Chưa xác định được vị trí của bạn.");
        return null;
      }

      if (directionOriginMode === "branch") {
        if (!directionOriginBranchId) return null;
        const origin = branchOptions.find((b) => b.id === Number(directionOriginBranchId));
        if (!origin) return null;
        return { lat: origin.lat, lng: origin.lng, label: `${origin.city} - ${origin.name}` };
      }

      return geocodeCustomLocation(directionOriginCustom, options);
    },
    [directionOriginMode, userLocation, directionOriginBranchId, branchOptions, directionOriginCustom, vietmapApiKey]
  );

  const resolveRoutePoints = useCallback(
    async (options?: { quiet?: boolean }) => {
      if (!directionToId) return null;

      const destination = branchOptions.find((b) => b.id === Number(directionToId));
      if (!destination) return null;

      const origin = await resolveOriginLocation(options);
      if (!origin) return null;

      if (directionOriginMode === "branch" && directionOriginBranchId === directionToId) {
        if (!options?.quiet) setCustomOriginError("Vui lòng chọn 2 chi nhánh khác nhau.");
        return null;
      }

      return {
        origin,
        destination: { lat: destination.lat, lng: destination.lng, label: `${destination.city} - ${destination.name}` },
      };
    },
    [directionToId, branchOptions, resolveOriginLocation, directionOriginMode, directionOriginBranchId]
  );

  // Update originCoords (for distance sort)
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const updateOrigin = async () => {
      if (directionOriginMode === "custom") {
        if (timer) clearTimeout(timer);
        timer = setTimeout(async () => {
          const coords = await resolveOriginLocation({ quiet: true });
          if (!cancelled) setOriginCoords(coords);
        }, 600);
        return;
      }

      const coords = await resolveOriginLocation({ quiet: true });
      if (!cancelled) setOriginCoords(coords);
    };

    updateOrigin();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [directionOriginMode, directionOriginBranchId, directionOriginCustom, userLocation, resolveOriginLocation]);

  // Re-fetch route silently when vehicle changes (if route already exists)
  useEffect(() => {
    const updateRouteForVehicle = async () => {
      if (!directionToId) return;
      const points = await resolveRoutePoints({ quiet: true });
      if (!points) return;
      await fetchRouteAndPreview(points.origin, points.destination, { silent: true });
    };

    void updateRouteForVehicle();
  }, [selectedVehicle, directionToId, resolveRoutePoints, fetchRouteAndPreview]);

  const handleShowRouteOnMap = useCallback(async () => {
    setCustomOriginError(null);
    const points = await resolveRoutePoints();
    if (!points) return;
    await fetchRouteAndPreview(points.origin, points.destination);
  }, [resolveRoutePoints, fetchRouteAndPreview]);

  const requestDirectionsForBranch = useCallback(
    async (branch: SidebarBranch, options?: { silent?: boolean }) => {
      setDirectionToId(String(branch.id));

      if (!userLocation) {
        setRouteError("Vui lòng bật quyền vị trí để xem đường đi trên bản đồ.");
        requestUserLocation();
        return;
      }

      await fetchRouteAndPreview(
        { ...userLocation, label: "Vị trí của tôi" },
        { lat: branch.lat, lng: branch.lng, label: `${branch.city} - ${branch.name}` },
        { silent: options?.silent ?? true }
      );
    },
    [userLocation, requestUserLocation, fetchRouteAndPreview]
  );

  const handleDirectionsClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, branch: SidebarBranch) => {
      e.stopPropagation();
      void requestDirectionsForBranch(branch);
      if (isMobile) {
        setMobileSheetState("collapsed");
      }
    },
    [requestDirectionsForBranch, isMobile]
  );

  useEffect(() => {
    const eventName = "fwf:open-directions";
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ branchId?: number }>;
      const branchId = customEvent.detail?.branchId;
      if (typeof branchId !== "number") return;
      const branch = branchOptions.find((b) => b.id === branchId);
      if (!branch) return;
      setShowSidebar(true);
      void requestDirectionsForBranch(branch, { silent: true });
    };

    window.addEventListener(eventName, handler as EventListener);
    return () => {
      window.removeEventListener(eventName, handler as EventListener);
    };
  }, [branchOptions, requestDirectionsForBranch, setShowSidebar]);

  const swapDirectionPoints = () => {
    if (directionOriginMode !== "branch" || !directionOriginBranchId || !directionToId) return;
    setDirectionOriginBranchId(directionToId);
    setDirectionToId(directionOriginBranchId);
  };

  const isDirectionsButtonDisabled = (() => {
    if (!directionToId) return true;
    if (directionOriginMode === "my-location") return !userLocation;
    if (directionOriginMode === "branch") return !directionOriginBranchId || directionOriginBranchId === directionToId;
    return !directionOriginCustom.trim();
  })();

  const outerClasses = isMobile
    ? `fixed inset-x-0 bottom-0 px-2 pb-2 z-[1001] transition-transform duration-300 ${
        showSidebar ? "translate-y-0 pointer-events-auto" : "translate-y-[115%] pointer-events-none"
      }`
    : `${
        showSidebar ? "w-96" : "w-0"
      } transition-all duration-300 overflow-hidden flex flex-col flex-shrink-0 z-[1001] bg-white border-r border-gray-300 shadow-xl`;

  const panelClasses = isMobile
    ? "bg-white rounded-t-3xl shadow-2xl border border-gray-200 flex flex-col h-full overflow-hidden"
    : "flex flex-col h-full";

  const searchInputClasses = isMobile
    ? "pl-11 h-11 rounded-full bg-gray-50 border-gray-200 text-base shadow-inner"
    : "pl-8 md:pl-10 text-sm md:text-base h-8 md:h-10";

  const filtersWrapperClasses = isMobile ? "flex gap-2 overflow-x-auto py-1" : "flex flex-wrap gap-1 md:gap-2";

  const contentWrapperClasses = isMobile ? "flex-1 overflow-y-auto" : "flex-1 overflow-y-auto flex flex-col";

  const listWrapperClasses = isMobile ? "px-4 pb-4" : "flex-1 overflow-y-auto";

  const mobileSheetHeights: Record<"collapsed" | "mid" | "expanded", string> = {
    collapsed: "24vh",
    mid: "60vh",
    expanded: "90vh",
  };
  const dragStartYRef = useRef<number | null>(null);

  const panelInlineStyle = isMobile
    ? {
        height: mobileSheetHeights[mobileSheetState],
      }
    : undefined;

  const moveMobileSheet = (direction: "up" | "down") => {
    setMobileSheetState((prev) => {
      if (direction === "up") {
        if (prev === "collapsed") return "mid";
        if (prev === "mid") return "expanded";
        return "expanded";
      }
      if (prev === "expanded") return "mid";
      if (prev === "mid") return "collapsed";
      return "collapsed";
    });
  };

  useEffect(() => {
    if (isMobile && showSidebar) {
      setMobileSheetState("mid");
    }
  }, [isMobile, showSidebar]);

  useEffect(() => {
    setIsDirectionsOpen(!isMobile);
  }, [isMobile]);
  const handleDragStart = (event: React.TouchEvent | React.MouseEvent) => {
    if (!isMobile) return;
    const clientY = "touches" in event ? event.touches[0].clientY : (event as React.MouseEvent).clientY;
    dragStartYRef.current = clientY;
  };

  const handleDragMove = (event: React.TouchEvent | React.MouseEvent) => {
    if (!isMobile || dragStartYRef.current === null) return;
    const clientY = "touches" in event ? event.touches[0].clientY : (event as React.MouseEvent).clientY;
    const delta = clientY - dragStartYRef.current;
    if (Math.abs(delta) > 60) {
      moveMobileSheet(delta > 0 ? "down" : "up");
      dragStartYRef.current = clientY;
    }
  };

  const handleDragEnd = () => {
    dragStartYRef.current = null;
  };

  return (
    <div className={outerClasses} style={isMobile ? { paddingBottom: "env(safe-area-inset-bottom, 0.75rem)" } : undefined}>
      <div className={panelClasses} style={panelInlineStyle}>
        <div
          className={`${isMobile ? "pt-4 pb-3 px-4" : "p-3 md:p-4 text-white"} relative`}
          style={
            isMobile
              ? undefined
              : {
                  background: "linear-gradient(to right, #f97316, #dc2626)",
                  backgroundColor: "#f97316",
                }
          }
        >
          {isMobile && (
            <div
              className="flex items-center justify-between mb-3"
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onMouseDown={handleDragStart}
              onMouseMove={(event) => {
                if (event.buttons !== 1) return;
                handleDragMove(event);
              }}
              onMouseUp={handleDragEnd}
            >
              <div className="flex-1 flex items-center justify-center">
                <span className="w-12 h-1.5 rounded-full bg-gray-200" />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveMobileSheet("down")}
                  disabled={mobileSheetState === "collapsed"}
                  className="p-1.5 text-gray-500 disabled:text-gray-300"
                  aria-label="Thu nhỏ bảng điều khiển"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveMobileSheet("up")}
                  disabled={mobileSheetState === "expanded"}
                  className="p-1.5 text-gray-500 disabled:text-gray-300"
                  aria-label="Mở rộng bảng điều khiển"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className={`flex items-center justify-between ${isMobile ? "mb-4" : "mb-3 md:mb-4"}`}>
            <div className="flex items-center gap-2">
              <div
                className={`${isMobile ? "w-9 h-9" : "w-6 h-6 md:w-8 md:h-8"} rounded-full flex items-center justify-center text-orange-600`}
                style={{ backgroundColor: isMobile ? "#fef3c7" : "white" }}
              >
                <Image src="/logo.png" alt="Fox Logo" width={isMobile ? 28 : 24} height={isMobile ? 28 : 24} className="md:w-8 md:h-8" />
              </div>
              <h1
                className={`${isMobile ? "text-lg font-bold text-gray-900" : "text-base md:text-lg font-bold"}`}
                style={isMobile ? undefined : { color: "#ffffff" }}
              >
                Face Wash Fox
              </h1>
            </div>
            <Button
              variant={isMobile ? "outline" : "ghost"}
              size="icon"
              onClick={() => setShowSidebar(false)}
              className={`${
                isMobile
                  ? "h-9 w-9 rounded-full border-gray-200 text-gray-600"
                  : "text-white hover:bg-white/20 border-white/20 h-8 w-8 md:h-10 md:w-10"
              }`}
              style={isMobile ? undefined : { color: "#ffffff" }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {!isMobile && (
            <p className="text-xs md:text-sm" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
              Bản đồ tất cả chi nhánh của nhà Cáo
            </p>
          )}
        </div>

        <div className={contentWrapperClasses}>
          <div className={`${isMobile ? "px-4 pb-3 pt-1" : "p-3 md:p-4"} border-b`}>
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${
                  isMobile ? "h-4 w-4" : "h-3 w-3 md:h-4 md:w-4"
                }`}
              />
              <Input
                placeholder="Tìm kiếm chi nhánh..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className={searchInputClasses}
              />
            </div>
          </div>

          <div className={`${isMobile ? "px-4 py-3" : "p-3 md:p-4"} border-b`}>
            <label className="text-xs md:text-sm font-medium mb-2 block">Lọc theo thành phố:</label>
            <div className={filtersWrapperClasses}>
              {cities.map((city) => (
                <Button
                  key={city}
                  variant={selectedCity === city ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCity(city)}
                  className={`text-xs md:text-sm px-3 py-1.5 h-8 ${
                    selectedCity === city ? "bg-red-500 hover:bg-red-600 text-white" : ""
                  } ${isMobile ? "flex-shrink-0 rounded-full text-orange" : ""}`}
                >
                  {city}
                </Button>
              ))}
            </div>
          </div>

          <div className={`${isMobile ? "px-4 py-4 border-b" : "p-3 md:p-4 border-b"}`}>
            <div className="flex items-center justify-between">
              <div className="text-xs md:text-sm font-semibold text-gray-700">Chỉ đường Face Wash Fox</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={swapDirectionPoints}
                  disabled={!canSwapDirections}
                  className="rounded-full border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                  title="Đổi vị trí"
                >
                  ⇅
                </button>
                <button
                  type="button"
                  onClick={() => setIsDirectionsOpen((prev) => !prev)}
                  className="rounded-full border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100"
                  title={isDirectionsOpen ? "Thu gọn" : "Mở rộng"}
                >
                  {isDirectionsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isDirectionsOpen && (
              <div className={`${isMobile ? "space-y-4 pt-3" : "space-y-3 pt-2"}`}>
                <div className="flex items-center justify-between gap-1 bg-gray-50 rounded-full px-2 py-1">
                  {vehicleOptions.map((vehicle) => (
                    <button
                      key={vehicle.value}
                      onClick={() => setSelectedVehicle(vehicle.value)}
                      className={`flex-1 text-xs md:text-sm py-1 rounded-full transition flex items-center justify-center gap-1 ${
                        selectedVehicle === vehicle.value ? "bg-white shadow text-orange-700" : "text-gray-500 hover:text-orange-500"
                      }`}
                    >
                      <vehicle.icon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{vehicle.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-2xl p-3 space-y-2 shadow-inner border border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border border-gray-400"></div>
                      <select
                        value={directionOriginMode}
                        onChange={(e) => {
                          const mode = e.target.value as "my-location" | "branch" | "custom";
                          setDirectionOriginMode(mode);
                          if (mode !== "branch") setDirectionOriginBranchId("");
                          if (mode !== "custom") setCustomOriginError(null);
                        }}
                        className="flex-1 bg-white rounded-xl border border-gray-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="my-location">Vị trí của tôi {userLocation ? "(đã cập nhật)" : "(chưa bật)"}</option>
                        <option value="branch">Chọn từ chi nhánh</option>
                        <option value="custom">Tự nhập vị trí</option>
                      </select>
                    </div>

                    {directionOriginMode === "branch" && (
                      <div className="ml-5">
                        <select
                          value={directionOriginBranchId}
                          onChange={(e) => setDirectionOriginBranchId(e.target.value)}
                          className="w-full bg-white rounded-xl border border-gray-200 px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Chọn chi nhánh bắt đầu</option>
                          {branchOptions.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                              {branch.city} - {branch.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {directionOriginMode === "custom" && (
                      <div className="ml-5 space-y-1">
                        <Input
                          value={directionOriginCustom}
                          placeholder="Ví dụ: 123 Trần Duy Hưng, Hà Nội"
                          onChange={(e) => {
                            setDirectionOriginCustom(e.target.value);
                            if (customOriginError) setCustomOriginError(null);
                          }}
                          className="text-xs md:text-sm h-9 rounded-xl border-gray-200"
                        />
                        <p className="text-[11px] text-gray-500">Mô tả địa chỉ hoặc tên địa điểm cụ thể để chúng tôi tìm kiếm.</p>
                        {customOriginError && <p className="text-[11px] text-red-500">{customOriginError}</p>}
                      </div>
                    )}

                    {directionOriginMode === "my-location" && (
                      <div className="ml-5 flex items-center justify-between text-[11px] text-gray-500 gap-2">
                        <span>
                          {userLocation
                            ? `Đã cập nhật: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                            : "Chưa truy cập được vị trí của bạn"}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={requestUserLocation}
                          disabled={isLoadingLocation}
                          className="h-7 px-2 text-xs"
                        >
                          {isLoadingLocation ? "Đang lấy..." : "Lấy vị trí"}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-3 shadow-inner border border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border border-gray-400 bg-orange-500"></div>
                      <div className="relative flex-1">
                        <select
                          value={directionToId}
                          onChange={(e) => setDirectionToId(e.target.value)}
                          className="w-full appearance-none bg-white rounded-xl border border-gray-200 px-3 py-2 pr-7 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                        >
                          <option value="">Chọn điểm đến</option>
                          {branchesWithDistance.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                              {branch.city} - {branch.name}
                              {distanceLabelMap.get(branch.id) ? ` (${distanceLabelMap.get(branch.id)})` : ""}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    disabled={isDirectionsButtonDisabled || isRouteLoading}
                    onClick={handleShowRouteOnMap}
                    className="w-full text-xs md:text-sm bg-orange-500 hover:bg-orange-400 text-white disabled:opacity-50"
                  >
                    {isRouteLoading ? "Đang tính..." : "Chỉ đường"}
                  </Button>
                </div>

                {routeSummary && (distanceLabel || durationLabel) && (
                  <div className="text-[11px] text-blue-800 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
                    {distanceLabel && <p>Quãng đường: {distanceLabel}</p>}
                    {durationLabel && <p>Thời gian dự kiến: {durationLabel}</p>}
                  </div>
                )}

                {routeError && <p className="text-[11px] text-red-500">{routeError}</p>}

                {directionOriginMode === "branch" &&
                  directionOriginBranchId &&
                  directionToId &&
                  directionOriginBranchId === directionToId && (
                    <p className="text-[11px] text-red-500">Vui lòng chọn 2 chi nhánh khác nhau.</p>
                  )}
              </div>
            )}

            {!isDirectionsOpen && routeSummary && (distanceLabel || durationLabel) && (
              <div className="mt-3 text-[11px] text-blue-800 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
                {distanceLabel && <p>Quãng đường: {distanceLabel}</p>}
                {durationLabel && <p>Thời gian dự kiến: {durationLabel}</p>}
              </div>
            )}
          </div>

          <div className={listWrapperClasses}>
            {Object.entries(groupedBranches).map(([city, cityBranches]) => (
              <div key={city} className="border-b">
                <div className={`${isMobile ? "px-1 py-3 bg-gray-50" : "p-3 md:p-4 bg-gray-50"} flex items-center gap-2`}>
                  <h3 className="font-semibold text-gray-800 text-sm md:text-base">
                    {city} - {cityBranches.length} Chi Nhánh
                  </h3>
                </div>

                {cityBranches.map((branch) => (
                  <div
                    key={branch.id}
                    className={`${isMobile ? "px-1 py-3" : "p-3 md:p-4"} border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors`}
                    onClick={() => {
                      handleBranchClick(branch);
                      if (isMobile) setShowSidebar(false);
                    }}
                  >
                    <div className="flex items-start gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Image src="/logo.png" alt="Fox Logo" width={32} height={32} className="md:w-10 md:h-10" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-1 text-sm md:text-base flex items-center gap-2">
                          <span>{branch.name}</span>
                          {distanceLabelMap.get(branch.id) && (
                            <span className="text-[11px] text-gray-500">{distanceLabelMap.get(branch.id)}</span>
                          )}
                        </h4>

                        <p className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-2">{branch.address}</p>

                        <div className="flex items-center gap-1 text-xs md:text-sm text-gray-500 mb-2">
                          <Phone className="h-3 w-3" />
                          <span>{branch.phone}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleBookingClick(e, branch)}
                            className="text-xs px-2 py-1 h-6 md:h-8 flex-1"
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            Đặt lịch
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleDirectionsClick(e, branch)}
                            className="text-xs px-2 py-1 h-6 md:h-8 flex-1 bg-blue-50 hover:bg-blue-100 border-blue-200"
                          >
                            <Route className="h-3 w-3 mr-1" />
                            Chỉ đường
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

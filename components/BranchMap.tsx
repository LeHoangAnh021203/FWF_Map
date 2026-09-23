"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Search,
  MapPin,
  Clock,
  Phone,
  Calendar,
  RotateCcw,
  Navigation,
  Menu,
  X,
  Route,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { DialogHeader, DialogTitle } from "./ui/dialog";
import Sidebar from "./sidebar/Sidebar";
import {
  branches,
  isBranchPublished,
  type Branch,
} from "../data/branches";

interface MapInstance {
  map: L.Map;
  markers: Map<string, L.Marker>;
  cluster?: unknown;
  popup?: L.Popup;
}

const HANOI_CENTRE_BRANCH_ID = 3;
const HANOI_CENTRE_WEEKDAY_HOURS = "10:00 - 21:30";
const HANOI_CENTRE_WEEKEND_HOURS = "10:00 - 22:00";

const parseLocalDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const getBranchHoursForDate = (branch: Branch, dateString?: string) => {
  if (branch.id !== HANOI_CENTRE_BRANCH_ID) return branch.hours;
  if (!dateString) return HANOI_CENTRE_WEEKDAY_HOURS;

  const parsedDate = parseLocalDate(dateString);
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return HANOI_CENTRE_WEEKDAY_HOURS;
  }

  const dayOfWeek = parsedDate.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6
    ? HANOI_CENTRE_WEEKEND_HOURS
    : HANOI_CENTRE_WEEKDAY_HOURS;
};

const getBranchHoursLabel = (branch: Branch) => {
  if (branch.id !== HANOI_CENTRE_BRANCH_ID) return branch.hours;
  return `Thứ 2 - Thứ 6: ${HANOI_CENTRE_WEEKDAY_HOURS}; Thứ 7 - CN: ${HANOI_CENTRE_WEEKEND_HOURS}`;
};


const cities = [
  "Tất cả",
  "Hà Nội",
  "Hồ Chí Minh",
  "Đà Nẵng",
  "Vũng Tàu",
  "Nha Trang",
  "Hải Phòng"
];
const branchTypes = ["Tất cả", "Chính", "Phụ"];
const serviceTypes = ["Tư vấn", "Rửa mặt", "Mỹ phẩm"];

export default function BranchMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapInstance | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("Tất cả");
  const [selectedBranchType, setSelectedBranchType] = useState("Tất cả");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [publishScheduleTick, setPublishScheduleTick] = useState(0);
  const publishedBranches = useMemo(
    () => branches.filter((branch) => isBranchPublished(branch)),
    [publishScheduleTick]
  );
  const [filteredBranches, setFilteredBranches] = useState(() =>
    branches.filter((branch) => isBranchPublished(branch))
  );
  const [showFilters] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showBranchDetails, setShowBranchDetails] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Generate branch slug from name for URL hash
  const generateBranchSlug = (branchName: string) => {
    return branchName
      .toLowerCase()
      .replace(/đ/g, "d") // Replace đ with d
      .replace(/Đ/g, "d") // Replace Đ with d
      .normalize("NFD") // Normalize Vietnamese characters
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .trim();
  };

  // Handle URL hash to auto-open booking for specific branch
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        const branch = branches.find(
          (b) =>
            generateBranchSlug(b.name) === hash && isBranchPublished(b)
        );
        if (branch) {
          setSelectedBranch(branch);
          setShowBookingForm(true);
        }
      }
    };

    // Check hash on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const initializeMap = useCallback(async () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      const L = await import("leaflet");
      const vietmapApiKey = process.env.NEXT_PUBLIC_VIETMAP_API_KEY;

      // Check if container is already initialized
      if (
        (mapRef.current as HTMLElement & { _leaflet_id?: number })._leaflet_id
      ) {
        console.log("[v0] Map container already initialized, skipping");
        return;
      }

      // Double check that we don't have an existing map instance
      if (mapInstanceRef.current) {
        console.log("[v0] Map instance already exists, skipping");
        return;
      }

      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
        document.head.appendChild(link);
      }

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
        ._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/logo.png",
        iconUrl: "/logo.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, {
        zoomAnimation: true,
        fadeAnimation: true,
        center: [21.0285, 105.8542], // Hà Nội center
        zoom: 11,
        maxZoom: 19,
        attributionControl: false,
      });

      // Move zoom controls to top-right to avoid sidebar overlap
      map.zoomControl.setPosition("topright");

      const addBaseLayer = () => {
        try {
          if (vietmapApiKey) {
            // VietMap raster tile layer (uses your VietMap API key)
            // Docs: https://maps.vietmap.vn/docs/map-api/tilemap/
            L.tileLayer(
              // Raster Default style
              `https://maps.vietmap.vn/maps/tiles/tm/{z}/{x}/{y}@2x.png?apikey=${vietmapApiKey}`,
              {
                attribution:
                  'Map data © <a href="https://vietmap.vn">VietMap</a>',
                maxZoom: 20,
              }
            ).addTo(map);
            console.log("[v0] Using VietMap raster tiles as base layer");
          } else {
            // Fallback to Carto Voyager if VietMap key is missing
            L.tileLayer(
              "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
              {
                attribution:
                  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: "abcd",
                maxZoom: 19,
              }
            ).addTo(map);
            console.warn(
              "[v0] NEXT_PUBLIC_VIETMAP_API_KEY not set, using Carto tiles instead"
            );
          }
        } catch {
          console.log("[v0] Primary tile layer failed, using fallback");
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }).addTo(map);
        }
      };

      addBaseLayer();

      const popup = L.popup({
        closeButton: true,
        autoClose: false,
        closeOnEscapeKey: true,
      });

      map.on("movestart", () => setUserInteracted(true));
      map.on("zoomstart", () => setUserInteracted(true));

      mapInstanceRef.current = {
        map,
        markers: new Map(),
        popup,
      };

      setIsMapLoaded(true);
      setMapError(null);
      console.log("[v0] Map initialized successfully");

      const scheduleMapResize = (delay: number) => {
        setTimeout(() => {
          const currentMap = mapInstanceRef.current?.map;
          if (!currentMap) return;
          try {
            currentMap.invalidateSize();
          } catch (error) {
            console.warn("[v0] Failed to invalidate map size:", error);
          }
        }, delay);
      };

      // Trigger resize to ensure map fills container
      scheduleMapResize(100);
      // Additional resize trigger after a longer delay
      scheduleMapResize(500);
    } catch (error) {
      console.error("[v0] Failed to initialize map:", error);
      setMapError("Không thể tải bản đồ. Vui lòng thử lại.");
    }
  }, []);

  const createFoxIcon = useCallback((L: typeof import("leaflet")) => {
    return L.divIcon({
      html: `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <img src="/logo.png" alt="Face Wash Fox" style="width: 34px; height: 34px; object-fit: contain;" />
        </div>
      `,
      className: "fox-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }, []);

  const updateMarkers = useCallback(
    async (branches: Branch[]) => {
      if (!mapInstanceRef.current || !isMapLoaded) return;

      const { map, markers, popup } = mapInstanceRef.current;
      const L = await import("leaflet");

      const currentIds = new Set(branches.map((b) => b.id.toString()));
      for (const [id, marker] of markers.entries()) {
        if (!currentIds.has(id)) {
          map.removeLayer(marker);
          markers.delete(id);
        }
      }

      branches.forEach((branch) => {
        const id = branch.id.toString();
        let marker = markers.get(id);

        if (!marker) {
          marker = L.marker([branch.lat, branch.lng], {
            icon: createFoxIcon(L),
          });

          marker.on("click", () => {
            const content = `
            <div style="min-width: 250px;">
              <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">${branch.name
              }</h3>
              <div style="margin-bottom: 6px; color: #6b7280; font-size: 14px;">
                <strong>📍</strong> ${branch.address}
              </div>
              <div style="margin-bottom: 6px; color: #6b7280; font-size: 14px;">
                <strong>📞</strong> ${branch.phone}
              </div>
              <div style="margin-bottom: 6px; color: #6b7280; font-size: 14px;">
                <strong>🕒</strong> ${getBranchHoursLabel(branch)}
              </div>
            
              <div style="margin-bottom: 12px;">
                ${branch.services
                .map(
                  (service) =>
                    `<span style="background: #f3f4f6; color: #374151; padding: 2px 6px; border-radius: 8px; font-size: 11px; margin-right: 4px; margin-bottom: 4px; display: inline-block;">${service}</span>`
                )
                .join("")}
              </div>
              <div style="display: flex; gap: 8px; margin-top: 8px;">
                <button onclick="window.openBooking(${branch.id})" style="
                  flex: 1;
                  background: #f97316; 
                  color: white; 
                  border: none; 
                  padding: 8px 12px; 
                  border-radius: 6px; 
                  cursor: pointer;
                  font-size: 12px;
                  font-weight: 500;
                ">
                  📅 Đặt lịch
                </button>
                <button onclick="window.openDirections(${branch.id})" style="
                  flex: 1;
                  background: #3b82f6; 
                  color: white; 
                  border: none; 
                  padding: 8px 12px; 
                  border-radius: 6px; 
                  cursor: pointer;
                  font-size: 12px;
                  font-weight: 500;
                ">
                  🗺️ Chỉ đường
                </button>
              </div>
            </div>
          `;
            popup
              ?.setLatLng([branch.lat, branch.lng])
              .setContent(content)
              .openOn(map);
          });

          markers.set(id, marker);
        }

        marker.addTo(map);
      });

      console.log("[v0] Updated markers:", branches.length);
    },
    [isMapLoaded, createFoxIcon]
  );

  const fitBoundsToMarkers = useCallback(
    async (branches: Branch[], force = false) => {
      if (!mapInstanceRef.current || !isMapLoaded || branches.length === 0)
        return;
      if (userInteracted && !force) return;

      const { map } = mapInstanceRef.current;
      const L = await import("leaflet");

      const group = L.featureGroup(
        branches.map((branch) =>
          L.marker([branch.lat, branch.lng], {
            icon: createFoxIcon(L),
          })
        )
      );

      map.fitBounds(group.getBounds(), {
        padding: [50, 50],
        maxZoom: 15,
      });

      console.log("[v0] Fitted bounds to", branches.length, "branches");
    },
    [isMapLoaded, userInteracted, createFoxIcon]
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setPublishScheduleTick((tick) => tick + 1);
    }, 60_000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      let filtered = publishedBranches;

      if (searchTerm) {
        filtered = filtered.filter(
          (branch) =>
            branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            branch.address.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (selectedCity !== "Tất cả") {
        filtered = filtered.filter((branch) => branch.city === selectedCity);
      }

      if (selectedServices.length > 0) {
        filtered = filtered.filter((branch) =>
          selectedServices.some((service) => branch.services.includes(service))
        );
      }

      setFilteredBranches(filtered);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    searchTerm,
    selectedCity,
    selectedBranchType,
    selectedServices,
    publishedBranches,
  ]);

  // Khi map đã load xong, hiển thị tất cả chi nhánh hiện tại
  useEffect(() => {
    if (!isMapLoaded) return;
    updateMarkers(filteredBranches);
    fitBoundsToMarkers(filteredBranches, true);
  }, [isMapLoaded, filteredBranches, updateMarkers, fitBoundsToMarkers]);

  // Trigger map resize when sidebar visibility changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.map.invalidateSize();
      }, 300); // Wait for sidebar transition to complete
    }
  }, [showSidebar]);

  useEffect(() => {
    const currentMapRef = mapRef.current;
    initializeMap();
    (
      window as unknown as {
        openBooking: (branchId: number) => void;
        openDirections: (branchId: number) => void;
      }
    ).openBooking = (branchId: number) => {
      const branch = branches.find(
        (b) => b.id === branchId && isBranchPublished(b)
      );
      if (branch) {
        setSelectedBranch(branch);
        setShowBookingForm(true);
        // Set URL hash for shareable link
        window.location.hash = generateBranchSlug(branch.name);
      }
    };

    (
      window as unknown as {
        openBooking: (branchId: number) => void;
        openDirections: (branchId: number) => void;
      }
    ).openDirections = (branchId: number) => {
      const branch = branches.find(
        (b) => b.id === branchId && isBranchPublished(b)
      );
      if (branch) {
        openDirections(branch);
      }
    };

    // Check if mobile on mount and resize
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-hide sidebar on mobile on initial load
      if (mobile) {
        setShowSidebar(false);
      }
    };

    checkMobile();

    // Add resize listener
    const handleResize = () => {
      const wasMobile = isMobile;
      const isNowMobile = window.innerWidth < 768;

      setIsMobile(isNowMobile);

      // If switching from mobile to desktop, show sidebar
      if (wasMobile && !isNowMobile) {
        setShowSidebar(true);
      }
      // If switching from desktop to mobile, hide sidebar
      else if (!wasMobile && isNowMobile) {
        setShowSidebar(false);
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.map.invalidateSize();
      }
    };

    window.addEventListener("resize", handleResize);

    // Yêu cầu quyền vị trí ngay khi vào trang (một lần)
    if (!hasRequestedLocation) {
      setHasRequestedLocation(true);
      // Thử lấy vị trí sau khi map đã khởi tạo một chút để đảm bảo đã sẵn sàng
      setTimeout(() => {
        getMyLocation();
      }, 600);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (routeLayerRef.current) {
        routeLayerRef.current.remove();
        routeLayerRef.current = null;
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.map.remove();
          // Clear the leaflet_id to allow re-initialization
          if (currentMapRef) {
            delete (currentMapRef as HTMLElement & { _leaflet_id?: number })
              ._leaflet_id;
          }
        } catch (error) {
          console.log("[v0] Error removing map:", error);
        } finally {
          mapInstanceRef.current = null;
        }
      }
    };
  }, [initializeMap, hasRequestedLocation]);

  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const resetView = () => {
    setUserInteracted(false);
    fitBoundsToMarkers(filteredBranches, true);
  };

  // Tránh yêu cầu định vị nhiều lần khi remount

  const openDirections = (branch: Branch) => {
    setShowSidebar(true);
    window.dispatchEvent(
      new CustomEvent("fwf:open-directions", {
        detail: { branchId: branch.id },
      })
    );
  };

  const getMyLocation = () => {
    const buildPermissionHelp = () => {
      const ua = (
        typeof navigator !== "undefined" ? navigator.userAgent : ""
      ).toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(ua);
      const isAndroid = /android/.test(ua);
      const isSafariIOS =
        isIOS && /safari/.test(ua) && !/crios|fxios|edgios/.test(ua);
      const isChromeAndroid = isAndroid && /chrome/.test(ua);

      if (isSafariIOS) {
        return "Bạn đang tắt quyền vị trí cho trang này.\n\nHướng dẫn iPhone (Safari):\n1) Mở Cài đặt > Safari > Vị trí (Location)\n2) Chọn Hỏi (Ask) hoặc Luôn cho phép (Allow)\n3) Quay lại trình duyệt và thử lại.";
      }
      if (isChromeAndroid) {
        return "Bạn đang tắt quyền vị trí cho trang này.\n\nHướng dẫn Android (Chrome):\n1) Mở Chrome > Settings > Site settings > Location\n2) Bật Location và Cho phép domain này\n3) Tải lại trang và thử lại.";
      }
      return "Bạn đang tắt quyền vị trí cho trang này.\nVui lòng bật quyền Vị trí cho trình duyệt rồi thử lại.";
    };

    if (!window.isSecureContext) {
      alert(
        "Trình duyệt yêu cầu HTTPS để dùng định vị. Vui lòng truy cập qua https://"
      );
      return;
    }

    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ định vị");
      return;
    }

    try {
      const permission = (navigator as any).permissions?.query
        ? (navigator as any).permissions.query({ name: "geolocation" })
        : null;
      if (
        permission &&
        typeof (permission as Promise<any>).then === "function"
      ) {
        (permission as Promise<any>)
          .then((status: { state?: string }) => {
            if (status?.state === "denied") {
              alert(buildPermissionHelp());
            }
          })
          .catch(() => { });
      }
    } catch { }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          setUserLocation({ lat: latitude, lng: longitude });

          if (mapInstanceRef.current) {
            const { map } = mapInstanceRef.current;
            const L = await import("leaflet");

            map.setView([latitude, longitude], 15);

            L.marker([latitude, longitude], {
              icon: L.divIcon({
                html: `
                  <div style="
                    width: 20px; 
                    height: 20px; 
                    background: #3b82f6; 
                    border: 3px solid white; 
                    border-radius: 50%; 
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  "></div>
                `,
                className: "user-location-marker",
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              }),
            }).addTo(map);

            L.circle([latitude, longitude], {
              radius: position.coords.accuracy,
              fillColor: "#3b82f6",
              fillOpacity: 0.1,
              color: "#3b82f6",
              weight: 1,
            }).addTo(map);
          }
        } catch (error) {
          console.error("[v0] Error setting location:", error);
          alert("Có lỗi xảy ra khi hiển thị vị trí");
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error("[v0] Geolocation error:", error);
        setUserLocation(null);
        let message = "Không thể lấy vị trí của bạn";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = buildPermissionHelp();
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Thông tin vị trí không khả dụng";
            break;
          case error.TIMEOUT:
            message = "Yêu cầu vị trí hết thời gian chờ";
            break;
        }
        alert(message);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const groupedBranches = filteredBranches.reduce((acc, branch) => {
    if (!acc[branch.city]) {
      acc[branch.city] = [];
    }
    acc[branch.city].push(branch);
    return acc;
  }, {} as Record<string, Branch[]>);

  const handleBranchClick = async (branch: Branch) => {
    if (!mapInstanceRef.current) return;

    const { map, popup } = mapInstanceRef.current;

    map.setView([branch.lat, branch.lng], 16);

    const content = `
      <div style="min-width: 200px; max-width: 280px;">
        <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937; font-size: 14px;">${branch.name
      }</h3>
        <div style="margin-bottom: 6px; color: #6b7280; font-size: 12px;">
          <strong>📍</strong> ${branch.address}
        </div>
        <div style="margin-bottom: 6px; color: #6b7280; font-size: 12px;">
          <strong>📞</strong> ${branch.phone}
        </div>
        <div style="margin-bottom: 6px; color: #6b7280; font-size: 12px;">
          <strong>🕒</strong> ${getBranchHoursLabel(branch)}
        </div>
       
        <div style="margin-bottom: 12px;">
          ${branch.services
        .map(
          (service) =>
            `<span style="background: #f3f4f6; color: #374151; padding: 2px 6px; border-radius: 8px; font-size: 10px; margin-right: 4px; margin-bottom: 4px; display: inline-block;">${service}</span>`
        )
        .join("")}
        </div>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button onclick="window.openBooking(${branch.id})" style="
            flex: 1;
            background: #f97316; 
            color: white; 
            border: none; 
            padding: 8px 12px; 
            border-radius: 6px; 
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
          ">
            📅 Đặt lịch
          </button>
          <button onclick="window.openDirections(${branch.id})" style="
            flex: 1;
            background: #3b82f6; 
            color: white; 
            border: none; 
            padding: 8px 12px; 
            border-radius: 6px; 
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
          ">
            🗺️ Chỉ đường
          </button>
        </div>
      </div>
    `;
    popup?.setLatLng([branch.lat, branch.lng]).setContent(content).openOn(map);
  };

  const previewRouteOnMap = useCallback(
    async (
      origin: { lat: number; lng: number; label?: string },
      destination: { lat: number; lng: number; label?: string },
      routeCoordinates?: [number, number][]
    ) => {
      if (!mapInstanceRef.current) return;
      try {
        const { map } = mapInstanceRef.current;
        const L = await import("leaflet");

        if (routeLayerRef.current) {
          routeLayerRef.current.remove();
          routeLayerRef.current = null;
        }

        const layerGroup = L.layerGroup().addTo(map);
        routeLayerRef.current = layerGroup;

        L.circleMarker([origin.lat, origin.lng], {
          radius: 7,
          color: "#0ea5e9",
          fillColor: "#38bdf8",
          fillOpacity: 0.9,
          weight: 3,
        })
          .bindTooltip(origin.label ?? "Điểm bắt đầu", {
            direction: "top",
            offset: [0, -8],
            opacity: 0.9,
          })
          .addTo(layerGroup);

        L.circleMarker([destination.lat, destination.lng], {
          radius: 8,
          color: "#ef4444",
          fillColor: "#f97316",
          fillOpacity: 0.95,
          weight: 3,
        })
          .bindTooltip(destination.label ?? "Điểm đến", {
            direction: "top",
            offset: [0, -8],
            opacity: 0.9,
          })
          .addTo(layerGroup);

        const routePoints: L.LatLngTuple[] =
          routeCoordinates && routeCoordinates.length > 1
            ? routeCoordinates.map(
              (point) => [point[0], point[1]] as L.LatLngTuple
            )
            : [
              [origin.lat, origin.lng] as L.LatLngTuple,
              [destination.lat, destination.lng] as L.LatLngTuple,
            ];

        const polyline = L.polyline(routePoints, {
          color: "#f97316",
          weight: 4,
          opacity: 0.95,
          dashArray:
            routeCoordinates && routeCoordinates.length > 1 ? undefined : "8 8",
        }).addTo(layerGroup);

        map.fitBounds(polyline.getBounds(), {
          padding: [60, 60],
        });
      } catch (error) {
        console.error("[v0] previewRouteOnMap error:", error);
      }
    },
    []
  );

  return (
    <div className="relative h-full w-full bg-gray-900 flex !p-0 !m-0 overflow-hidden">
      <Sidebar
        showSidebar={showSidebar}
        isMobile={isMobile}
        searchTerm={searchTerm}
        selectedCity={selectedCity}
        cities={cities}
        allBranches={publishedBranches}
        groupedBranches={groupedBranches}
        userLocation={userLocation}
        requestUserLocation={getMyLocation}
        isLoadingLocation={isLoadingLocation}
        onPreviewRoute={previewRouteOnMap}
        setSearchTerm={setSearchTerm}
        setSelectedCity={setSelectedCity}
        setShowSidebar={setShowSidebar}
        setSelectedBranch={setSelectedBranch}
        setShowBookingForm={setShowBookingForm}
        handleBranchClick={handleBranchClick}
        generateBranchSlug={generateBranchSlug}
      />

      <div className="flex-1 relative min-w-0 overflow-hidden">
        {!showSidebar && (
          <div className="absolute top-2 left-2 md:top-4 md:left-4 z-[1000] flex items-center justify-center gap-1 ">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSidebar(true)}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-xl hover:shadow-2xl h-8 w-8 md:h-10 md:w-10 rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 active:scale-95 border-white/30  btn-ripple menu-btn menu-glow"
              title="Mở danh sách chi nhánh"
            >
              <Menu className="h-4 w-4 menu-icon" />
            </Button>
            <div className="block rounded-full bg-white/90 text-orange-600 px-2 py-0.5 shadow-md border border-orange-200/50 marquee hint-shimmer pointer-events-none max-w-[150px] sm:max-w-[220px] text-[11px]">
              <div className="marquee__track">
                <span className="marquee__item hint-glow">
                  Bấm vào để xem tất cả chi nhánh
                </span>
                <span className="marquee__item hint-glow">
                  Bấm vào để xem tất cả chi nhánh
                </span>
                <span className="marquee__item hint-glow">
                  Bấm vào để xem tất cả chi nhánh
                </span>
              </div>
            </div>
          </div>
        )}

        <div
          className={`absolute top-2 md:top-4 ${showSidebar
            ? isMobile
              ? "left-2"
              : "left-2 md:left-4"
            : isMobile
              ? "left-2"
              : "left-10 md:left-16"
            } right-2 md:right-4 z-[1000] flex gap-2`}
        ></div>

        {showFilters && (
          <Card
            className={`absolute top-16 ${showSidebar ? "left-4" : "left-16"
              } right-4 z-[1000] max-w-md shadow-lg`}
          >
            <CardHeader>
              <CardTitle className="text-lg">Bộ lọc</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Loại chi nhánh
                </label>
                <select
                  value={selectedBranchType}
                  onChange={(e) => setSelectedBranchType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {branchTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Dịch vụ
                </label>
                <div className="space-y-2">
                  {serviceTypes.map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={service}
                        checked={selectedServices.includes(service)}
                        onChange={() => handleServiceToggle(service)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={service} className="text-sm">
                        {service}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedBranchType("Tất cả");
                  setSelectedServices([]);
                }}
                className="w-full"
              >
                Xóa bộ lọc
              </Button>
            </CardContent>
          </Card>
        )}

        <div
          ref={mapRef}
          className="absolute inset-0 w-full h-full z-0"
          style={{
            width: "100%",
            height: "100%",
            minHeight: "100%",
          }}
        />

        {/* Branch count display */}
        <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 z-[1000] bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-2 md:px-6 md:py-4 rounded-lg md:rounded-xl shadow-2xl backdrop-blur-sm border border-white/20">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs md:text-sm font-semibold">
              Hiển thị {filteredBranches.length} / {publishedBranches.length}{" "}
              chi nhánh
            </span>
          </div>
          {selectedCity !== "Tất cả" && (
            <div className="text-xs opacity-90 mt-1 md:mt-2 bg-white/20 px-1 py-0.5 md:px-2 md:py-1 rounded text-xs">
              📍 Đang lọc theo: {selectedCity}
            </div>
          )}
          {searchTerm && (
            <div className="text-xs opacity-90 mt-1 md:mt-2 bg-white/20 px-1 py-0.5 md:px-2 md:py-1 rounded text-xs">
              🔍 Tìm kiếm: &ldquo;{searchTerm}&rdquo;
            </div>
          )}
        </div>

        <div className="absolute bottom-16 right-2 md:bottom-20 md:right-4 z-[1000] flex flex-col gap-2 md:gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={getMyLocation}
            disabled={isLoadingLocation}
            className="bg-white/95 backdrop-blur-md shadow-xl hover:shadow-2xl disabled:opacity-50 border-white/30 hover:scale-105 transition-all duration-200 h-8 w-8 md:h-10 md:w-10"
            title={isLoadingLocation ? "Đang tải vị trí..." : "Vị trí của tôi"}
          >
            {isLoadingLocation ? (
              <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-blue-600"></div>
            ) : (
              <Navigation className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={resetView}
            className="bg-white/95 backdrop-blur-md shadow-xl hover:shadow-2xl border-white/30 hover:scale-105 transition-all duration-200 h-8 w-8 md:h-10 md:w-10"
            title="Reset view"
          >
            <RotateCcw className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>

        {!isMapLoaded && !mapError && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-[1001]">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500/30 border-t-orange-500 mx-auto mb-4"></div>
                <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-orange-500/20"></div>
              </div>
              <div className="text-lg font-semibold text-white mb-2">
                Đang tải bản đồ...
              </div>
              <div className="text-sm text-gray-300">
                Vui lòng chờ trong giây lát
              </div>
            </div>
          </div>
        )}

        {mapError && (
          <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center z-[1001]">
            <div className="text-center">
              <div className="relative">
                <div className="text-red-400 text-6xl mb-4">⚠️</div>
                <div className="absolute inset-0 animate-pulse text-red-300 text-6xl">
                  ⚠️
                </div>
              </div>
              <div className="text-xl font-bold text-white mb-2">
                Lỗi tải bản đồ
              </div>
              <div className="text-sm text-red-200 mb-6 max-w-md">
                {mapError}
              </div>
              <Button
                onClick={() => {
                  setMapError(null);
                  setIsMapLoaded(false);
                  mapInstanceRef.current = null;
                  initializeMap();
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                🔄 Thử lại
              </Button>
            </div>
          </div>
        )}
      </div>

      {showBranchDetails && selectedBranch && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={() => setShowBranchDetails(false)}
        >
          <div className="fixed inset-0 bg-black/80" />
          <div
            className="fixed left-[50%] top-[50%] z-[9999] grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <DialogHeader>
              <DialogTitle>{selectedBranch.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>{selectedBranch.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedBranch.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{getBranchHoursLabel(selectedBranch)}</span>
                </div>
                <div className="flex items-center gap-2"></div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedBranch.services.map((service) => (
                    <Badge key={service} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowBranchDetails(false);
                    setShowBookingForm(true);
                    // Set URL hash for shareable link
                    if (selectedBranch) {
                      window.location.hash = generateBranchSlug(
                        selectedBranch.name
                      );
                    }
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Đặt lịch hẹn
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-blue-50 hover:bg-blue-100 border-blue-200"
                  onClick={() => {
                    if (selectedBranch) {
                      openDirections(selectedBranch);
                      setShowBranchDetails(false);
                    }
                  }}
                >
                  <Route className="h-4 w-4 mr-2" />
                  Chỉ đường
                </Button>
              </div>
            </div>
            <button
              onClick={() => setShowBranchDetails(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>
      )}

      {/* Booking Form Dialog */}
      {selectedBranch && showBookingForm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={() => {
            setShowBookingForm(false);
            // Clear URL hash when closing booking form
            window.location.hash = "";
          }}
        >
          <div className="fixed inset-0 bg-black/80" />
          <div
            className="fixed left-[50%] top-[50%] z-[9999] grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-4 md:p-6 shadow-lg duration-200 sm:rounded-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
                Đặt lịch hẹn
              </DialogTitle>
              <div className="text-xs md:text-sm text-gray-600">
                Chi nhánh:{" "}
                <span className="font-medium">{selectedBranch.name}</span>
              </div>
            </DialogHeader>
            <BookingForm
              branch={selectedBranch}
              onClose={() => {
                setShowBookingForm(false);
                // Clear URL hash when closing booking form
                window.location.hash = "";
              }}
            />
            <button
              onClick={() => {
                setShowBookingForm(false);
                // Clear URL hash when closing booking form
                window.location.hash = "";
              }}
              className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingForm({
  branch,
  onClose,
}: {
  branch: Branch;
  onClose: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tạo time slots dựa trên giờ hoạt động của từng chi nhánh
  const generateTimeSlots = (hours: string) => {
    try {
      // Parse giờ hoạt động từ format "10:00 - 22:00"
      const match = hours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
      if (!match)
        return [
          "09:30",
          "10:00",
          "10:30",
          "11:00",
          "11:30",
          "12:00",
          "12:30",
          "13:00",
          "13:30",
          "14:00",
          "14:30",
          "15:00",
          "15:30",
          "16:00",
          "16:30",
          "17:00",
          "17:30",
          "18:00",
          "18:30",
          "19:00",
          "19:30",
          "20:00",
          "20:30",
          "21:00",
          "21:30",
        ];

      const startHour = parseInt(match[1]);
      const startMin = parseInt(match[2]);
      const endHour = parseInt(match[3]);
      const endMin = parseInt(match[4]);

      const slots: string[] = [];

      // Tạo slots từ giờ bắt đầu đến giờ kết thúc (mỗi 30 phút)
      let currentHour = startHour;
      let currentMin = startMin;

      while (
        currentHour < endHour ||
        (currentHour === endHour && currentMin <= endMin)
      ) {
        const timeStr = `${currentHour.toString().padStart(2, "0")}:${currentMin
          .toString()
          .padStart(2, "0")}`;
        slots.push(timeStr);

        // Tăng 30 phút
        currentMin += 30;
        if (currentMin >= 60) {
          currentMin = 0;
          currentHour++;
        }
      }

      return slots.length > 0
        ? slots
        : [
          "09:30",
          "10:00",
          "10:30",
          "11:00",
          "11:30",
          "12:00",
          "12:30",
          "13:00",
          "13:30",
          "14:00",
          "14:30",
          "15:00",
          "15:30",
          "16:00",
          "16:30",
          "17:00",
          "17:30",
          "18:00",
          "18:30",
          "19:00",
          "19:30",
          "20:00",
          "20:30",
          "21:00",
          "21:30",
        ];
    } catch (error) {
      console.error("Error parsing branch hours:", error);
      return [
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "12:00",
        "12:30",
        "13:00",
        "13:30",
        "14:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
        "16:30",
        "17:00",
        "17:30",
        "18:00",
        "18:30",
        "19:00",
        "19:30",
        "20:00",
        "20:30",
        "21:00",
        "21:30",
      ];
    }
  };

  const bookingHours = selectedDate
    ? getBranchHoursForDate(branch, selectedDate)
    : branch.id === HANOI_CENTRE_BRANCH_ID
      ? HANOI_CENTRE_WEEKDAY_HOURS
      : branch.hours;
  const timeSlots = generateTimeSlots(bookingHours);

  useEffect(() => {
    if (selectedTime && !timeSlots.includes(selectedTime)) {
      setSelectedTime("");
    }
  }, [selectedTime, timeSlots]);

  const numberCustomer = ["1", "2", "3", "4", "5"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Gửi email xác nhận đặt lịch
      const emailResponse = await fetch("/api/booking/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          customerEmail: customerEmail || undefined,
          customerPhone,
          service: selectedService || "Dịch vụ chăm sóc da",
          branchName: branch.name,
          branchAddress: branch.address || "Chưa cung cấp",
          bookingDate: selectedDate,
          bookingTime: selectedTime,
          bookingCustomer: selectedCustomer,
          customerNote: customerNote.trim() || undefined,
          targetTab: "map",
        }),
      });

      const emailResult = await emailResponse.json();

      if (emailResult.success) {
        // const customerSuccess = emailResult.emailDetails?.customer?.success;
        // const businessSuccess = emailResult.emailDetails?.business?.success;

        // Email status logic removed as it's not used

        alert(
          "✅ Đặt lịch đã được ghi nhận, quý khách vui lòng chờ xác nhận qua cuộc gọi của Face Wash Fox.\n\nLiên hệ ngay với chúng tôi để được giải đáp hoặc đặt lịch qua Hotline 08898 66666"
        );
      } else {
        alert(
          `❌ Đặt lịch thất bại!\n\n⚠️ Không thể gửi email xác nhận: ${emailResult.error}\n\nLiên hệ ngay với chúng tôi để được giải đáp hoặc đặt lịch qua Hotline 08898 66666`
        );
      }
    } catch (error) {
      console.error("❌ Booking error:", error);
      alert(
        `❌ Đặt lịch thất bại!\n\n⚠️ Lỗi gửi email: ${error instanceof Error ? error.message : "Unknown error"
        }\n\nLiên hệ ngay với chúng tôi để được giải đáp hoặc đặt lịch qua Hotline 08898 66666`
      );
    }

    setIsSubmitting(false);

    // Reset form
    setSelectedDate("");
    setSelectedTime("");
    setSelectedCustomer("");
    setSelectedService("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerNote("");

    // Close dialog
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
      <div>
        <label className="text-xs md:text-sm font-medium mb-1 md:mb-2 block">
          Họ và tên
        </label>
        <Input
          value={customerName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCustomerName(e.target.value)
          }
          placeholder="Nhập họ và tên"
          required
          className="h-8 md:h-10 text-sm md:text-base"
        />
      </div>

      <div>
        <label className="text-xs md:text-sm font-medium mb-1 md:mb-2 block">
          Số điện thoại
        </label>
        <Input
          value={customerPhone}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCustomerPhone(e.target.value)
          }
          placeholder="Nhập số điện thoại"
          required
          className="h-8 md:h-10 text-sm md:text-base"
        />
      </div>

      <div>
        <label className="text-xs md:text-sm font-medium mb-1 md:mb-2 block">
          Email (tùy chọn)
        </label>
        <Input
          type="email"
          value={customerEmail}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCustomerEmail(e.target.value)
          }
          placeholder="Nhập email để nhận xác nhận"
          className="h-8 md:h-10 text-sm md:text-base"
        />
        <p className="text-xs text-gray-500 mt-1">
          📧 Email xác nhận sẽ được gửi đến địa chỉ này
        </p>
      </div>

      <div>
        <label className="text-xs md:text-sm font-medium mb-1 md:mb-2 block">
          Ghi chú (tùy chọn)
        </label>
        <textarea
          value={customerNote}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setCustomerNote(e.target.value)
          }
          placeholder="Nhập ghi chú cho lịch hẹn"
          rows={3}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base resize-y"
        />
      </div>

      <div>
        <label className="text-xs md:text-sm font-medium mb-1 md:mb-2 block">
          Ngày hẹn
        </label>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSelectedDate(e.target.value)
          }
          min={new Date().toISOString().split("T")[0]}
          required
          className="h-8 md:h-10 text-sm md:text-base"
        />
      </div>

      <div>
        <label className="text-xs md:text-sm font-medium mb-1 md:mb-2 block">
          Giờ hẹn
          <span className="text-gray-500 font-normal ml-2">
            (Giờ hoạt động:{" "}
            {selectedDate ? bookingHours : getBranchHoursLabel(branch)})
          </span>
        </label>
        <select
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-8 md:h-10 text-sm md:text-base"
        >
          <option value="">Chọn giờ</option>
          {timeSlots.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          🕒 Chỉ hiển thị giờ trong khung hoạt động của chi nhánh
        </p>
      </div>

      <div>
        <label className="text-xs md:text-sm font-medium mb-1 md:mb-2 block">
          Số khách
        </label>
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-8 md:h-10 text-sm md:text-base"
        >
          <option value="">Chọn số lượng</option>
          {numberCustomer.map((customer) => (
            <option key={customer} value={customer}>
              {customer}
            </option>
          ))}
        </select>
      </div>

      <Button
        type="submit"
        className="w-full bg-orange-500 h-8 md:h-10 text-sm md:text-base"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Đang xử lý..." : "Xác nhận đặt lịch"}
      </Button>
    </form>
  );
}

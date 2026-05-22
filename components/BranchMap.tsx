"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
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

interface Branch {
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

const branches: Branch[] = [
  // Hà Nội - 12 Chi Nhánh
  {
    id: 1,
    name: "Vincom Center Bà Triệu",
    address: "191 Bà Triệu, Quận Hai Bà Trưng, TP.Hà Nội",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 21.0114912,
    lng: 105.8499469,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/bJFbi99KrhHitmde8",
    city: "Hà Nội",
  },
  {
    id: 2,
    name: "Vinhomes Westpoint - W2 01S01",
    address: "Số 1 Đỗ Đức Dục, Quận Nam Từ Liêm, TP.Hà Nội",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 21.0119945,
    lng: 105.7857439,
    hours: "10:00 - 20:00",
    mapsUrl: "https://maps.app.goo.gl/9z7HsRUwTmNZ2woZ8",
    city: "Hà Nội",
  },
  {
    id: 3,
    name: "Face Wash Fox - Hanoi Centre",
    address: "Tầng hầm B2, tòa nhà Tiến Bộ Plaza, 175 P. Nguyễn Thái Học, Cát Linh, Ô Chợ Dừa, Hà Nội, Việt Nam",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 21.031559387681032,
    lng: 105.82824367598424,
    hours: "10:00 - 21:30",
    mapsUrl: "https://maps.app.goo.gl/tkXNsBTsAKNqK4Vi7",
    city: "Hà Nội",
  },
  {
    id: 4,
    name: "Đảo Ngọc Ngũ Xã",
    address:
      "Tầng lửng Shophouse, số 58A Nam Tràng, Phường Trúc Bạch, Quận Ba Đình, TP Hà Nội",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 21.0452304,
    lng: 105.8406443,
    hours: "10:00 - 20:00",
    mapsUrl: "https://maps.app.goo.gl/8ScL7zTZLjXyPVdr6",
    city: "Hà Nội",
  },
  {
    id: 5,
    name: "Kosmo Tây Hồ",
    address:
      "Chung cư Newtatco, Shophouse S17, Kosmo Tây Hồ, Xuân La, Bắc Từ Liêm, Hà Nội",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 21.0679772,
    lng: 105.8016754,
    hours: "10:00 - 20:00",
    mapsUrl: "https://maps.app.goo.gl/vnLQHi2kY3xduffi7",
    city: "Hà Nội",
  },
  {
    id: 6,
    name: "Smart City",
    address:
      "Shophouse SA1.01.S18 Vinhome Smart City, phường Tây Mỗ, thành phố Hà Nội, Việt Nam.",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 21.00419,
    lng: 105.736075,
    hours: "12:00 - 20:00",
    mapsUrl: "https://maps.app.goo.gl/egjq1XPq9nDjBmgr8",
    city: "Hà Nội",
  },
  {
    id: 7,
    name: "Vinhomes SkyLake",
    address:
      "L2-07, Tầng L2, Vincom Plaza Skylake, Khu đô thị mới Cầu Giấy, P Mỹ Đình 1, Quận Nam Từ Liêm",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 21.0200702,
    lng: 105.7809455,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/JemrEzbus2yQtV627",
    city: "Hà Nội",
  },
  {
    id: 8,
    name: "Vincom Phạm Ngọc Thạch",
    address:
      "L4-04, Tầng 04, Vincom Center Phạm Ngọc Thạch, 02 Phạm Ngọc Thạch, P Kim Liên, Quận Đống Đa",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 21.0070567,
    lng: 105.8326319,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/CVU2MFTFtg9ptK5o7",
    city: "Hà Nội",
  },
  {
    id: 9,
    name: "Face Wash Fox - Starlake",
    address:
      "Shophouse 903B - TM1 - 3, tầng 1, Tòa nhà 903, lô H9-CT1, Khu trung tâm Khu đô thị Tây Hồ Tây, Phường Xuân Đỉnh Hà Nội, Khu đô thị Tây Hồ Tây, Hanoi City, Hà Nội 100000",
    phone: "+84 889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 21.0523645,
    lng: 105.7926943,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/W7JgY594TGUY2kUZ7",
    city: "Hà Nội",
  },
  {
    id: 10,
    name: "Vinhome Green Bay - Đại Lộ Thăng Long",
    address:
      "Vinhomes Green Bay, Số 7 Đại Lộ Thăng Long, Phường Đại Mỗ, Thành phố Hà Nội",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 21.0013349,
    lng: 105.784505,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/P7om5stVSsG6mcVn8",
    city: "Hà Nội",
  },
  {
    id: 11,
    name: "Hanoi Tower",
    address: "69 P. Thợ Nhuộm, Cửa Nam, Hoàn Kiếm, Hà Nội 100000, Việt Nam",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 21.0272581,
    lng: 105.8447507,
    hours: "10:00 - 20:00",
    mapsUrl: "https://maps.app.goo.gl/y7h4xVagDXyD1B3CA",
    city: "Hà Nội",
  },

  {
    id: 48,
    name: "Times City",
    address:
      "Vinhomes Park Hill Times City - 458 Phố Minh Khai, Phường Vĩnh Tuy Ha Noi, Hanoi City, 100000, Việt Nam",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 20.9915475,
    lng: 105.8681091,
    hours: "10:00 - 20:00",
    mapsUrl: "https://maps.app.goo.gl/iybgpFXWDZF5rmpr5",
    city: "Hà Nội",
  },

  {
    id: 49,
    name: "Lotte Hanoi",
    address:
      "Tầng 2, Lotte Department Store, Tòa nhà Lotte Center, 54 Liễu Giai, quận Ba Đình, Hà Nội, Việt Nam",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 21.0322341,
    lng: 105.812058,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/YADNRTpq8a5B8KFR9",
    city: "Hà Nội",
  },

  {
    id: 50,
    name: "Vincom Plaza Bắc Từ Liêm",
    address: "Gian hàng B1-08, tầng B1, số 234 Phạm Văn Đồng, P. Phú Diễn",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 21.052851,
    lng: 105.780876,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/ocPmwDAyLQgX2FWM9",
    city: "Hà Nội",
  },

  {
    id: 54,
    name: "Aeon Mall Hà Đông",
    address:
      "T105-1 Tổ dân phố Hoàng Văn Thụ, Phường Dương Nội, Thành phố Hà Nội",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 20.989726,
    lng: 105.751799,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/NSYt6o2ZTYnJWrnD7",
    city: "Hà Nội",
  },

  // Hồ Chí Minh - 32 Chi Nhánh
  {
    id: 12,
    name: "Parc Mall",
    address:
      "Tầng G, Glam Beautique, Lô [COS-03], 547 - 549 Tạ Quang Bửu, P.4, Quận 8",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.7404475,
    lng: 106.6787347,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/HZnLVknQRXRmb6F6A",
    city: "Hồ Chí Minh",
  },
  {
    id: 13,
    name: "Vincom Center Landmark 81 - Lầu 3",
    address: "720A Điện Biên Phủ, Quận Bình Thạnh, TP.Hồ Chí Minh",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.7948511,
    lng: 106.7220564,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/7KeLn2NoeZSXsj2v9",
    city: "Hồ Chí Minh",
  },
  {
    id: 14,
    name: "Vincom Mega Mall Thảo Điền - Lầu 3",
    address: "161 Võ Nguyên Giáp, Phường Thảo Điền, TP.Thủ Đức",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.8023676,
    lng: 106.7408201,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/LLywjFSRmieGZMENA",
    city: "Hồ Chí Minh",
  },
  {
    id: 15,
    name: "The Sun Avenue - SAV3",
    address: "28 Mai Chí Thọ, Phường An Phú, TP.Thủ Đức",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.784934,
    lng: 106.7469457,
    hours: "10:00 - 21:30",
    mapsUrl: "https://maps.app.goo.gl/vn7AVZAy73gcgxYu7",
    city: "Hồ Chí Minh",
  },
  {
    id: 16,
    name: "Vincom Plaza - Phan Văn Trị",
    address: "Lầu 3, 12 Phan Văn Trị, Phường 5, Quận Gò Vấp, TP.Hồ Chí Minh",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.8271645,
    lng: 106.6892835,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/6SJxrJBmvQdLM7Th9",
    city: "Hồ Chí Minh",
  },
  {
    id: 17,
    name: "Vincom Plaza - Quang Trung",
    address: "Lầu 1, 190 Quang Trung, Phường 10, Quận Gò Vấp, TP.Hồ Chí Minh",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.8295734,
    lng: 106.672515,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/GWS8ZLk5MVGNaMAv6",
    city: "Hồ Chí Minh",
  },
  {
    id: 18,
    name: "Vincom Plaza - Lê Văn Việt",
    address: "Lầu 3, 50 Lê Văn Việt, Phường Hiệp Phú, TP.Thủ Đức",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.8447924,
    lng: 106.7786574,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/oSbDUu3XrKTQno8JA",
    city: "Hồ Chí Minh",
  },
  {
    id: 19,
    name: "Vista Verde",
    address: "2 Phan Văn Đáng, Phường Thạnh Mỹ Lợi, TP.Thủ Đức",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.7773998,
    lng: 106.7569195,
    hours: "10:00 - 21:30",
    mapsUrl: "https://maps.app.goo.gl/Fg15aVvTQ2rF2b2cA",
    city: "Hồ Chí Minh",
  },
  {
    id: 20,
    name: "Crescent Mall",
    address: "101 Tôn Dật Tiên, Phường Tân Phú, Quận 7, TP.Hồ Chí Minh",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.7290836,
    lng: 106.7188731,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/WmnjULritmo2htiv8",
    city: "Hồ Chí Minh",
  },
  {
    id: 21,
    name: "Botanica - Phổ Quang",
    address: "104 Phổ Quang, Phường 2, Quận Tân Bình, TP.Hồ Chí Minh",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.8084579,
    lng: 106.6702581,
    hours: "8:00 - 00:00",
    mapsUrl: "https://maps.app.goo.gl/xNxKoHw7MLVv3R8w6",
    city: "Hồ Chí Minh",
  },
  {
    id: 22,
    name: "The Everrich Infinity",
    address: "290 An Dương Vương, Phường 4, Quận 5, TP. Hồ Chí Minh",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.7608262,
    lng: 106.6806679,
    hours: "10:00 - 20:00",
    mapsUrl: "https://maps.app.goo.gl/vxjbyf4UzY9M6dKM8",
    city: "Hồ Chí Minh",
  },
  {
    id: 23,
    name: "Hoa Lan - Phú Nhuận",
    address: "140 Hoa Lan, Phường 2, Quận Phú Nhuận, TP. Hồ Chí Minh",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.7976356,
    lng: 106.6888018,
    hours: "10:00 - 20:00",
    mapsUrl: "https://maps.app.goo.gl/PxZRr7FPuhDK1uAJA",
    city: "Hồ Chí Minh",
  },
  {
    id: 24,
    name: "Võ Thị Sáu",
    address: "100 đường Võ Thị Sáu, Phường Tân Định, Quận 1",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.7883849,
    lng: 106.6922183,
    hours: "10:00 - 20:00",
    mapsUrl: "https://maps.app.goo.gl/M8BLhR6326BP2Hjr6",
    city: "Hồ Chí Minh",
  },
  {
    id: 25,
    name: "MVillage - Trương Định",
    address:
      "14 Trương Định, Toà nhà M – Village, Phường 6, Quận 3, TP. Hồ Chí Minh",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.7766859,
    lng: 106.6912394,
    hours: "10:00 - 20:00",
    mapsUrl: "https://maps.app.goo.gl/CRx5PhU6oJE9w4tN6",
    city: "Hồ Chí Minh",
  },
  {
    id: 26,
    name: "AEON MALL TÂN PHÚ",
    address:
      "Tầng 2, Lô S14 TTTM Aeon Mall Celadon Tân Phú, Số 30 đường Tân Thắng, phường Sơn Kỳ, quận Tân Phú, TP. Hồ Chí Minh",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.8016988,
    lng: 106.6175257,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/georubcSDgxQgsva9",
    city: "Hồ Chí Minh",
  },
  {
    id: 27,
    name: "Riviera Point - Quận 7",
    address:
      "Toà 3, Đường số 2, Nguyễn Văn Tưởng, P. An Phú, Quận 7, TP. Hồ Chí Minh",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.7321115,
    lng: 106.7291998,
    hours: "11:00 - 19:00",
    mapsUrl: "https://maps.app.goo.gl/R48ge7FN2QmtTpHs6",
    city: "Hồ Chí Minh",
  },
  {
    id: 28,
    name: "The Symphony - Midtown M6",
    address: "Tòa M6, Midtown Phú Mỹ Hưng, Đường 16, Tân Phú, Quận 7",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.7235497,
    lng: 106.7269112,
    hours: "11:00 - 19:00",
    mapsUrl: "https://maps.app.goo.gl/q5juKEWGMxdfFGeq8",
    city: "Hồ Chí Minh",
  },
  {
    id: 29,
    name: "Estella Height - Thủ Đức",
    address: "Tầng 3, Estella Height, 88 Song Hành, An Phú, Thủ Đức",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.801892706798602,
    lng: 106.7493020214425,
    hours: "9:30 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/7v6oXMh3pjBwrp5X8",
    city: "Hồ Chí Minh",
  },
  {
    id: 30,
    name: "SC VivoCity",
    address: "Tầng 2, SC VivoCity, 1058 Nguyễn Văn Linh, Tân Phong, Quận 7",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.7298577,
    lng: 106.7032856,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/b9h98LTLkAkDLaKY7",
    city: "Hồ Chí Minh",
  },
  {
    id: 31,
    name: "AEON MALL Bình Tân",
    address:
      "Tầng trệt, Aeon Mall Bình Tân, 1 Đ. Số 17A, Bình Trị Đông B, Bình Tân",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.7427958,
    lng: 106.6119311,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/vkEivdubPZWXmpbT7",
    city: "Hồ Chí Minh",
  },
  {
    id: 32,
    name: "NOWZONE Fashion Mall",
    address:
      "TTTM Nowzone – Lầu 1-118, 235, Nguyễn Văn Cừ, P.Nguyễn Cư Trinh, Q.1, HCM",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.7627989,
    lng: 106.6830862,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/vh2STThY3uqM3Wz76",
    city: "Hồ Chí Minh",
  },
  // {
  //   id: 33,
  //   name: "Saigon Centre",
  //   address: "Tầng 6 – Số 65 Lê Lợi, P. Bến Nghé, Quận 1",
  //   phone: "0889 866 666",
  //   services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
  //   lat: 10.7731031,
  //   lng: 106.70105,
  //   hours: "10:00 - 22:00",
  //   mapsUrl: "https://maps.app.goo.gl/dYdUEke64RShb4p7A",
  //   city: "Hồ Chí Minh",
  // },
  {
    id: 34,
    name: "1B Sương Nguyệt Ánh",
    address: "1B Sương Nguyệt Ánh, P. Bến Thành, Quận 1",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.7728936,
    lng: 106.6902668,
    hours: "9:00 - 20:00",
    mapsUrl: "https://maps.app.goo.gl/fteD9eXMD7Yw2tyA8",
    city: "Hồ Chí Minh",
  },
  {
    id: 35,
    name: "MVillage - Thi Sách",
    address: "Số 26 Thi Sách, P. Bến Nghé, Quận 1",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.779039475516049,
    lng: 106.70407594200802,
    hours: "10:00 - 20:00",
    mapsUrl: "https://maps.app.goo.gl/RuMprWSEBAn7cU468",
    city: "Hồ Chí Minh",
  },

  {
    id: 51,
    name: "Face Wash Fox - Vincom Mega Mall Grand Park",
    address: "Đường D2A, Khu đô thị, Vinhomes Grand Park, Thành phố Hồ Chí Minh, 700000",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.843316754323345,
    lng: 106.84251074622574,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/ocPmwDAyLQgX2FWM9",
    city: "Hồ Chí Minh",
  },

  {
    id: 38,
    name: "Vincom 3/2 - L4-03",
    address: "L4-03, 3C Đường 3/2, P. 10, Quận 10",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.776232022897757,
    lng: 106.68076025201948,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/GcNZpsHHxYMF1jMK9",
    city: "Hồ Chí Minh",
  },
  {
    id: 39,
    name: "Face Wash Fox - Marina",
    address:
      "Tầng 3 - L2.03, 2 Tôn Đức Thắng, Phường Sài Gòn, Quận 1, Hồ Chí Minh 700000",
    phone: "+84 889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.7822582,
    lng: 106.7076248,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/xYYxEMFrfPwygZBa9",
    city: "Hồ Chí Minh",
  },
  {
    id: 40,
    name: "Lumiere",
    address: "275 Võ Nguyên Giáp, An Phú, Thủ Đức, Hồ Chí Minh 700000",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.803567840971569,
    lng: 106.74829528342579,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/ugyLLkkxpzH5NSVDA",
    city: "Hồ Chí Minh",
  },

  {
    id: 45,
    name: "Đảo Kim Cương",
    address:
      "Shophouse B2.1G, Tháp 3 (Brilliant), Dự án Đảo Kim Cương, Số 01 Trần Quý Kiên, Phường Bình Trưng",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.77830991149819,
    lng: 106.74597857130746,
    hours: "9:30 - 21:30",
    mapsUrl: "https://maps.app.goo.gl/3Ww3UPTfdpGNhcb37",
    city: "Hồ Chí Minh",
  },

  {
    id: 46,
    name: "Vincom Saigonres",
    address: "188 Đ. Nguyễn Xí, Phường 26, Bình Thạnh, Hồ Chí Minh, Việt Nam",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.816578670035579,
    lng: 106.70685500824277,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/CMhzzX5Zckck1cZv8",
    city: "Hồ Chí Minh",
  },

  {
    id: 47,
    name: "Saigon Pearl",
    address:
      "92 Nguyễn Hữu Cảnh, Saigon Pearl, Bình Thạnh, Hồ Chí Minh 700000, Việt Nam",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.7904901,
    lng: 106.7192558,
    hours: "10:00 - 20:00",
    mapsUrl: "https://maps.app.goo.gl/68gi7urTBKUB53az7",
    city: "Hồ Chí Minh",
  },
  {
    id: 55,
    name: "Face Wash Fox - Thiso Mall ",
    address:
      "L1-17A, 10 Mai Chí Thọ, Thủ Thiêm, An Khánh, Hồ Chí Minh.",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.772364694808138, 
    lng: 106.72162756459794,
    hours: "10:00 - 20:00",
    mapsUrl: "https://maps.app.goo.gl/68gi7urTBKUB53az7",
    city: "Hồ Chí Minh",
  },

  // Đà Nẵng - 1 Chi Nhánh
  {
    id: 41,
    name: "177 Trần Phú",
    address: "177 Trần Phú, P. Hải Châu, TP. Đà Nẵng",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 16.066422,
    lng: 108.2238567,
    hours: "10:00 - 20:00",
    mapsUrl: "https://maps.app.goo.gl/84J2RgRcNHz4cMyu6",
    city: "Đà Nẵng",
  },

  // Vũng Tàu - 2 Chi Nhánh
  {
    id: 42,
    name: "Joi Boutique Bãi Trước",
    address: "Số 04 Thống Nhất, Phường 1, TP Vũng Tàu",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.3455038,
    lng: 107.0769746,
    hours: "10:00 - 20:00",
    mapsUrl: "https://maps.app.goo.gl/yEabGLXEpX1bfSPaA",
    city: "Vũng Tàu",
  },

  // Nha Trang - 1 Chi Nhánh
  {
    id: 44,
    name: "Gold Coast Nha Trang",
    address:
      "Tầng 04, Số 01 Trần Hưng Đạo, P. Lộc Thọ, TP Nha Trang, Khánh Hòa",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 12.2481451,
    lng: 109.1948614,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/NSYt6o2ZTYnJWrnD7",
    city: "Nha Trang",
  },

  // Hải Phòng
  {
    id: 52,
    name: "Aeon Mall Hải Phòng",
    address:
      "Glam Beautique - Tầng 1 10 Võ Nguyên Giáp, Phường, Lê Chân, Hải Phòng Hải Phòng, Haiphong City, 04067",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 20.83207391333833,
    lng: 106.68256693948133,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/NSYt6o2ZTYnJWrnD7",
    city: "Hải Phòng",
  },

  {
    id: 53,
    name: "Vincom Imperia Hải Phòng",
    address:
      "1 Bạch Đằng, Phường, Hồng Bàng, Hải Phòng 04067, Vietnam",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 20.86263691768238,
    lng: 106.66209186404255,
    hours: "10:00 - 22:00",
    mapsUrl: "https://maps.app.goo.gl/NSYt6o2ZTYnJWrnD7",
    city: "Hải Phòng",
  },

];

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
  const [filteredBranches, setFilteredBranches] = useState(branches);
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
          (b) => generateBranchSlug(b.name) === hash
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

  // Create custom fox icon function
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
    const timeoutId = setTimeout(() => {
      let filtered = branches;

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
  }, [searchTerm, selectedCity, selectedBranchType, selectedServices]);

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
      const branch = branches.find((b) => b.id === branchId);
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
      const branch = branches.find((b) => b.id === branchId);
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
        allBranches={branches}
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
              Hiển thị {filteredBranches.length} / {branches.length} chi nhánh
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

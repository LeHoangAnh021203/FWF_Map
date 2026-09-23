export interface Branch {
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
  /** YYYY-MM-DD — chi nhánh chỉ hiện từ 00:00 ngày này (giờ VN / local) */
  publishAt?: string;
}

const parseLocalDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const startOfLocalDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const isBranchPublished = (
  branch: Branch,
  referenceDate = new Date()
) => {
  if (!branch.publishAt) return true;
  const publishDate = parseLocalDate(branch.publishAt);
  if (!publishDate) return true;
  return (
    startOfLocalDay(publishDate).getTime() <=
    startOfLocalDay(referenceDate).getTime()
  );
};

export const branches: Branch[] = [
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
    id: 11,
    name: "Hanoi Tower - 69 Thợ Nhuộm",
    address: "69 Thợ Nhuộm - Hanoi Centre - 175 Nguyễn Thái Học ( Tiến bộ Plaza)",
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
    name: "Lotte Liễu Giai",
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
    address: "89 Hoa Lan, Phường 2, Cầu Kiệu, Hồ Chí Minh 70000, Việt Nam",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.79765,
    lng: 106.68880,
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
  // {
  //   id: 27,
  //   name: "Riviera Point - Quận 7",
  //   address:
  //     "Toà 3, Đường số 2, Nguyễn Văn Tưởng, P. An Phú, Quận 7, TP. Hồ Chí Minh",
  //   phone: "0889 866 666",
  //   services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
  //   lat: 10.7321115,
  //   lng: 106.7291998,
  //   hours: "11:00 - 19:00",
  //   mapsUrl: "https://maps.app.goo.gl/R48ge7FN2QmtTpHs6",
  //   city: "Hồ Chí Minh",
  // },
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
  // {
  //   id: 35,
  //   name: "MVillage - Thi Sách",
  //   address: "Số 26 Thi Sách, P. Bến Nghé, Quận 1",
  //   phone: "0889 866 666",
  //   services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
  //   lat: 10.779039475516049,
  //   lng: 106.70407594200802,
  //   hours: "10:00 - 20:00",
  //   mapsUrl: "https://maps.app.goo.gl/RuMprWSEBAn7cU468",
  //   city: "Hồ Chí Minh",
  // },

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

  // {
  //   id: 38,
  //   name: "Vincom 3/2 - L4-03",
  //   address: "L4-03, 3C Đường 3/2, P. 10, Quận 10",
  //   phone: "0889 866 666",
  //   services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
  //   lat: 10.776232022897757,
  //   lng: 106.68076025201948,
  //   hours: "10:00 - 22:00",
  //   mapsUrl: "https://maps.app.goo.gl/GcNZpsHHxYMF1jMK9",
  //   city: "Hồ Chí Minh",
  // },
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

  {
    id: 56,
    name: "Face Wash Fox - Vincom Đồng Khởi",
    address:
      "Tầng B2 - 72 Lê Thánh Tôn, P.Sài Gòn, Tp.HCM.",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 10.7775769,
    lng: 106.70161,
    hours: "10:00 - 20:00",
    mapsUrl:
      "https://maps.app.goo.gl/t8UWbWjrFdqG2Vqr8",
    city: "Hồ Chí Minh",
    publishAt: "2026-09-25",
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

  {
    id: 52,
    name: "Aeon Đà Nẵng",
    address: "46 Điện Biên Phủ, Thanh Khê, Đà Nẵng 550000, Việt Nam",
    phone: "0889 866 666",
    services: ["Tư vấn", "Rửa mặt", "Mỹ phẩm"],
    lat: 16.0660523465185,
    lng: 108.20439623202432,
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

export const getPublishedBranches = (referenceDate = new Date()) =>
  branches.filter((branch) => isBranchPublished(branch, referenceDate));

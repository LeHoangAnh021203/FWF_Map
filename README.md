# Map Standalone - Face Wash Fox Branch Locator

A Next.js application for locating Face Wash Fox branches with interactive map and booking functionality.

## 📋 Mô Tả Dự Án (Vietnamese)

**Face Wash Fox - Hệ Thống Tìm Kiếm Chi Nhánh & Đặt Lịch**

Ứng dụng web được xây dựng bằng Next.js giúp khách hàng dễ dàng tìm kiếm và đặt lịch tại các chi nhánh Face Wash Fox trên toàn quốc. Hệ thống tích hợp bản đồ tương tác với hơn 40 chi nhánh, cho phép khách hàng xem vị trí, thông tin chi tiết và thực hiện đặt lịch trực tuyến một cách nhanh chóng.

### ✨ Tính Năng Chính

- **🗺️ Bản Đồ Tương Tác**: Hiển thị tất cả chi nhánh Face Wash Fox trên bản đồ Leaflet với marker tùy chỉnh, hỗ trợ zoom, pan và tìm kiếm vị trí hiện tại
- **🔍 Tìm Kiếm & Lọc**: Tìm kiếm chi nhánh theo thành phố, dịch vụ với giao diện thân thiện
- **📱 Giao Diện Responsive**: Tối ưu cho mọi thiết bị từ desktop đến mobile
- **📅 Hệ Thống Đặt Lịch**: Form đặt lịch trực tuyến với validation đầy đủ
  - Kiểm tra định dạng số điện thoại Việt Nam (10 số, bắt đầu bằng 03/05/07/08/09)
  - Kiểm tra định dạng email
  - Xác thực thông tin khách hàng
- **📧 Thông Báo Email**: Tự động gửi email xác nhận cho khách hàng và doanh nghiệp
- **💬 Thông Báo Zalo OA**: Tích hợp thông báo qua Zalo Official Account (tùy chọn)
- **📊 Quản Lý Dữ Liệu**: Đồng bộ dữ liệu đặt lịch vào Google Sheets tự động
- **🎯 Điều Hướng**: Tích hợp Google Maps để điều hướng đến chi nhánh

### 🎨 Giao Diện

- Thiết kế hiện đại với Tailwind CSS
- Icons đẹp mắt từ Lucide React
- Dialog/Modal cho form đặt lịch
- Card hiển thị thông tin chi nhánh chi tiết
- Badge hiển thị dịch vụ và trạng thái

### 🏢 Phạm Vi Hoạt Động

Hệ thống hiện hỗ trợ **44 chi nhánh** trên toàn quốc:
- **Hà Nội**: 11 chi nhánh
- **Hồ Chí Minh**: 29 chi nhánh
- **Đà Nẵng**: 1 chi nhánh
- **Vũng Tàu**: 2 chi nhánh
- **Nha Trang**: 1 chi nhánh

### 🔄 Quy Trình Đặt Lịch

1. Khách hàng tìm kiếm hoặc chọn chi nhánh trên bản đồ
2. Xem thông tin chi nhánh (địa chỉ, điện thoại, giờ làm việc, dịch vụ)
3. Nhấn "Đặt Lịch" và điền form với thông tin:
   - Tên khách hàng
   - Số điện thoại (bắt buộc)
   - Email (tùy chọn)
   - Dịch vụ cần đặt
   - Ngày và giờ mong muốn
   - Số lượng khách
4. Hệ thống xác thực và gửi dữ liệu đến Google Sheets
5. Gửi email xác nhận cho khách hàng và doanh nghiệp
6. Gửi thông báo Zalo đến admin (nếu được cấu hình)

### 🛠️ Công Nghệ Sử Dụng

- **Frontend Framework**: Next.js 14 (App Router), React 18
- **Ngôn Ngữ**: TypeScript
- **Styling**: Tailwind CSS
- **Bản Đồ**: Leaflet.js với custom markers và clustering
- **Icons**: Lucide React
- **Email Service**: Nodemailer
- **Lưu Trữ Dữ Liệu**: Google Sheets API + Google Apps Script
- **Thông Báo**: Zalo Official Account API (tùy chọn)

### 📦 Cấu Trúc Dự Án

- `app/page.tsx` - Trang chủ với bản đồ
- `app/api/booking/confirm/route.ts` - API xử lý đặt lịch
- `components/BranchMap.tsx` - Component bản đồ chính (hơn 2000 dòng)
- `components/ui/` - Các component UI tái sử dụng (Button, Input, Card, Dialog, Badge)
- `UNIFIED_GOOGLE_APPS_SCRIPT.js` - Script Google Apps Script để xử lý dữ liệu Sheets

## Features

- 🗺️ **Interactive Map**: Leaflet-based map showing all Face Wash Fox branches
- 📍 **Branch Search**: Search and filter branches by city and services
- 📅 **Booking System**: Online booking form with Google Sheets integration
- 📧 **Email Notifications**: Automated booking confirmation emails
- 📊 **Data Management**: Google Sheets integration for booking data

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Map**: Leaflet with custom markers
- **Icons**: Lucide React
- **Email**: Nodemailer
- **Data Storage**: Google Sheets API + Google Apps Script

## Project Structure

```
map-standalone/
├── app/
│   ├── api/booking/confirm/     # Booking confirmation API
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/
│   ├── BranchMap.tsx           # Main map component
│   └── ui/                     # Reusable UI components
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       └── dialog.tsx
├── public/
│   ├── favicon.ico
│   └── logo.png                # Fox logo
└── UNIFIED_GOOGLE_APPS_SCRIPT.js # Google Apps Script code
```

## ⚙️ Cấu Hình Môi Trường (Environment Variables)

Tạo file `.env.local` với các biến sau:

```bash
# Tích hợp Google Sheets
GOOGLE_SHEETS_WEB_APP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# Cấu Hình Email (Tùy chọn)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
BUSINESS_EMAIL_TO=business@example.com

# Cấu Hình Zalo OA (Tùy chọn)
ZALO_OA_ACCESS_TOKEN=your-zalo-access-token
ZALO_OA_REFRESH_TOKEN=your-zalo-refresh-token
ZALO_OA_ADMIN_IDS=user-id-1,user-id-2
```

### Giải Thích Các Biến

- `GOOGLE_SHEETS_WEB_APP_URL`: URL của Google Apps Script Web App để lưu dữ liệu booking
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`: Thông tin SMTP server để gửi email
- `EMAIL_FROM`: Email người gửi
- `BUSINESS_EMAIL_TO`: Email nhận thông báo đặt lịch từ khách hàng
- `ZALO_OA_ACCESS_TOKEN`: Access token của Zalo Official Account
- `ZALO_OA_REFRESH_TOKEN`: Refresh token để làm mới access token
- `ZALO_OA_ADMIN_IDS`: Danh sách user ID của admin, phân cách bởi dấu phẩy

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Google Sheets Integration
GOOGLE_SHEETS_WEB_APP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
BUSINESS_EMAIL_TO=business@example.com

# Zalo OA Configuration (Optional)
ZALO_OA_ACCESS_TOKEN=your-zalo-access-token
ZALO_OA_REFRESH_TOKEN=your-zalo-refresh-token
ZALO_OA_ADMIN_IDS=user-id-1,user-id-2
```

## 🔧 Thiết Lập Google Apps Script

1. Tạo một dự án Google Apps Script mới
2. Sao chép code từ file `UNIFIED_GOOGLE_APPS_SCRIPT.js`
3. Deploy làm Web App với quyền truy cập "Anyone"
4. Sao chép URL của Web App vào biến `GOOGLE_SHEETS_WEB_APP_URL` trong `.env.local`

### Hướng Dẫn Chi Tiết

1. Truy cập [Google Apps Script](https://script.google.com/)
2. Tạo project mới
3. Xóa code mặc định và dán code từ `UNIFIED_GOOGLE_APPS_SCRIPT.js`
4. Lưu project
5. Vào mục "Deploy" > "New deployment"
6. Chọn loại "Web app"
7. Thiết lập:
   - Execute as: Me
   - Who has access: Anyone
8. Copy URL được tạo và dán vào `.env.local`

## 🚀 Bắt Đầu

1. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

2. **Thiết lập biến môi trường**:
   Tạo file `.env.local` và điền các thông tin cần thiết (xem phần Cấu Hình Môi Trường ở trên)

3. **Chạy development server**:
   ```bash
   npm run dev
   ```

4. **Mở trình duyệt**:
   Truy cập `http://localhost:3030`

## Google Apps Script Setup

1. Create a new Google Apps Script project
2. Copy the code from `UNIFIED_GOOGLE_APPS_SCRIPT.js`
3. Deploy as a web app with "Anyone" access
4. Copy the web app URL to `GOOGLE_SHEETS_WEB_APP_URL`

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   Navigate to `http://localhost:3030`

## 📜 Các Lệnh Có Sẵn

- `npm run dev` - Chạy development server trên port 3030
- `npm run build` - Build ứng dụng cho môi trường production
- `npm run start` - Chạy production server trên port 3030

## Available Scripts

- `npm run dev` - Start development server on port 3030
- `npm run build` - Build for production
- `npm run start` - Start production server on port 3030

## Branch Data

The application includes 44 Face Wash Fox branches across:
- **Hà Nội**: 11 branches
- **Hồ Chí Minh**: 29 branches  
- **Đà Nẵng**: 1 branch
- **Vũng Tàu**: 2 branches
- **Nha Trang**: 1 branch

## 🔌 API Endpoints

### `POST /api/booking/confirm`

Xử lý yêu cầu đặt lịch từ khách hàng.

**Request Body:**
```json
{
  "customerName": "Nguyễn Văn A",
  "customerPhone": "0987654321",
  "customerEmail": "customer@example.com",
  "service": "Rửa mặt",
  "branchName": "Chi nhánh ABC",
  "branchAddress": "123 Đường XYZ",
  "bookingDate": "2024-12-25",
  "bookingTime": "10:00",
  "bookingCustomer": "1"
}
```

**Chức năng:**
- Xác thực các trường bắt buộc (tên, số điện thoại, chi nhánh, ngày, giờ)
- Kiểm tra định dạng số điện thoại Việt Nam
- Kiểm tra định dạng email (nếu có)
- Gửi dữ liệu đến Google Sheets
- Gửi email xác nhận cho khách hàng và doanh nghiệp
- Gửi thông báo Zalo đến admin (nếu được cấu hình)

**Response:**
```json
{
  "success": true,
  "emailDetails": {
    "customer": { "success": true },
    "business": { "success": true }
  },
  "gasDetails": {
    "attempted": true,
    "success": true
  },
  "zaloDetails": {
    "attempted": true,
    "results": [...]
  }
}
```

## API Endpoints

- `POST /api/booking/confirm` - Process booking requests
  - Validates required fields
  - Sends data to Google Sheets
  - Sends email notifications (if configured)
  - Sends Zalo OA notifications (if configured)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Private project for Face Wash Fox.

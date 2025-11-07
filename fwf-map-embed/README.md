# Face Wash Fox Map Embed - WordPress Plugin

Plugin WordPress để nhúng bản đồ tìm kiếm chi nhánh Face Wash Fox vào website.

## 📦 Cài Đặt

### Cách 1: Upload qua WordPress Admin
1. Zip folder `fwf-map-embed`
2. Vào WordPress Admin > Plugins > Add New > Upload Plugin
3. Chọn file zip và click "Install Now"
4. Activate plugin

### Cách 2: Upload qua FTP/SFTP
1. Upload folder `fwf-map-embed` vào `/wp-content/plugins/`
2. Vào WordPress Admin > Plugins
3. Tìm "Face Wash Fox Map Embed" và click "Activate"

## ⚙️ Cấu Hình

1. Vào **Settings > FWF Map**
2. Nhập URL của Next.js app đã được deploy:
   - Ví dụ: `https://your-domain.vercel.app`
   - Hoặc: `https://your-domain.com`
3. Click **Save Settings**

## 📝 Sử Dụng Shortcode

### Cơ bản
```
[fwf_map]
```
Sử dụng URL mặc định từ settings.

### Với Options

#### Tùy chỉnh URL
```
[fwf_map url="https://your-domain.vercel.app"]
```

#### Tùy chỉnh chiều cao
```
[fwf_map height="800px"]
```
Hoặc:
```
[fwf_map height="600px"]
[fwf_map height="100vh"]
```

#### Tùy chỉnh chiều rộng
```
[fwf_map width="90%"]
```
Hoặc:
```
[fwf_map width="1200px"]
```

#### Kết hợp nhiều options
```
[fwf_map url="https://your-domain.vercel.app" height="800px" width="100%"]
```

### Các giá trị được hỗ trợ

- **height**: px, %, vh (viewport height)
- **width**: px, %, vw (viewport width)
- **url**: URL đầy đủ của Next.js app

## 🎨 Custom CSS

Plugin tự động thêm một số CSS cơ bản. Bạn có thể override bằng cách thêm vào theme's style.css:

```css
.fwf-map-container {
    margin: 30px 0;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

## 📋 Checklist Trước Khi Sử Dụng

- [ ] Next.js app đã được deploy (Vercel, Netlify, hoặc server riêng)
- [ ] App đã hoạt động và có thể truy cập được
- [ ] Đã cấu hình URL trong Settings > FWF Map
- [ ] Đã test shortcode trên một trang test

## 🔧 Troubleshooting

### Iframe không hiển thị
- Kiểm tra URL có đúng không
- Kiểm tra Next.js app có hoạt động không
- Kiểm tra console browser xem có lỗi CORS không

### Bản đồ không responsive
- Đảm bảo Next.js app đã responsive
- Kiểm tra CSS của iframe container

### Shortcode không hoạt động
- Đảm bảo plugin đã được activate
- Kiểm tra shortcode syntax có đúng không
- Thử deactivate và activate lại plugin

## 📞 Support

Nếu gặp vấn đề, vui lòng liên hệ Face Wash Fox team.



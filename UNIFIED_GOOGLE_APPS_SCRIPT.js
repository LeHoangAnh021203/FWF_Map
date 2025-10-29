// Global config - Sử dụng cho cả 2 tab
if (typeof CONFIG === 'undefined') {
  var CONFIG = {
    SHEET_ID: '1Q-FlAnp591WKhE9qJoKH-yI92yl7gY1zQrg-YqRkwyM',
    DEFAULT_SHEET_NAME: 'List 20_10', // Tab mặc định
    MAP_SHEET_NAME: 'map',             // Tab map
  };
}

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw) return json({ success: false, error: 'Empty body' });

    let data = JSON.parse(raw);
    let targetSheet = CONFIG.DEFAULT_SHEET_NAME; // Mặc định

    // Xử lý dữ liệu đầu vào
    if (Array.isArray(data)) {
      // Nếu có 8 phần tử, phần tử thứ 8 là tên tab
      if (data.length === 8) {
        targetSheet = data[7] || CONFIG.DEFAULT_SHEET_NAME;
        data = data.slice(0, 7); // Chỉ lấy 7 phần tử đầu
      }
      
      if (data.length < 7) return json({ success: false, error: 'Array must have at least 7 items' });
      
      // Chuyển array thành object
      data = { 
        branch: data[0], 
        name: data[1], 
        phone: data[2], 
        email: data[3], 
        date: data[4], 
        time: data[5], 
        guests: data[6] 
      };
    }

    const { branch, name, phone, email, date, time, guests } = data || {};
    
    // Validation
    if (!name || !phone) return json({ success: false, error: 'Missing required fields: name, phone' });

    // Mở sheet và chọn tab đích
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = ss.getSheetByName(targetSheet);
    
    // Nếu tab không tồn tại, tạo mới
    if (!sheet) {
      sheet = ss.insertSheet(targetSheet);
      // Thêm header row
      sheet.getRange(1, 1, 1, 8).setValues([[
        'Chi nhánh', 'Tên khách hàng', 'SĐT', 'Email', 'Ngày', 'Giờ', 'Số khách', 'Thời gian'
      ]]);
    }

    // Chuẩn bị dữ liệu để ghi
    const row = [
      branch || '',
      name,
      "'" + String(phone),     // Giữ số 0 đầu
      email || '',
      date || '',
      time || '',
      guests ? Number(guests) : '',
      new Date(),              // Timestamp
    ];

    // Ghi dữ liệu
    sheet.appendRow(row);
    
    // Format timestamp
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 8).setNumberFormat('yyyy-mm-dd hh:mm:ss');

    return json({ 
      success: true, 
      message: `Data saved to tab: ${targetSheet}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    return json({ success: false, error: String(err) });
  }
}

// Helper function
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Function để test với tab cụ thể
function testWithTab(tabName) {
  const testData = [
    "Chi nhánh Test",
    "Nguyễn Văn Test", 
    "0123456789",
    "test@email.com",
    "2024-01-15",
    "14:00",
    "2",
    tabName // Tab đích
  ];
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  console.log('Test result:', result.getContent());
  return result;
}

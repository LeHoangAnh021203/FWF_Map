import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { google } from "googleapis";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Required fields validation for booking form
    const REQUIRED_FIELDS = [
      "customerName", "customerPhone", "branchName", 
      "bookingDate", "bookingTime"
    ];

    const missingFields = REQUIRED_FIELDS.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(", ")}` 
        },
        { status: 400 }
      );
    }

    // Data validation
    const { customerName, customerPhone, customerEmail } = body;
    
    // Validate customer name (minimum 2 characters, no numbers)
    if (customerName && (customerName.length < 2 || /\d/.test(customerName))) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Tên khách hàng phải có ít nhất 2 ký tự và không chứa số" 
        },
        { status: 400 }
      );
    }

    // Validate phone number (Vietnamese format)
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    if (customerPhone && !phoneRegex.test(customerPhone)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Số điện thoại không đúng định dạng Việt Nam (10 số, bắt đầu bằng 03/05/07/08/09)" 
        },
        { status: 400 }
      );
    }

    // Validate email (if provided)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (customerEmail && !emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Email không đúng định dạng" 
        },
        { status: 400 }
      );
    }

    // Extract remaining data
    const {
      service,
      branchName,
      branchAddress,
      bookingDate,
      bookingTime,
      bookingCustomer,
      // Google Sheets data
      senderName,
      senderPhone,
      senderEmail,
      receiverName,
      receiverPhone,
      receiverEmail,
      message,
    } = body ?? {};

    // Build content
    const subject = `Xác nhận đặt lịch - ${branchName}`;
    const text = `Khách hàng: ${customerName}\nĐiện thoại: ${customerPhone}\nEmail: ${customerEmail}\nDịch vụ: ${service}\nChi nhánh: ${branchName}\nĐịa chỉ: ${branchAddress}\nNgày: ${bookingDate}\nGiờ: ${bookingTime}\nSố khách: ${bookingCustomer}`;
    const html = `
      <h2>Xác nhận đặt lịch</h2>
      <p><strong>Khách hàng:</strong> ${customerName}</p>
      <p><strong>Điện thoại:</strong> ${customerPhone}</p>
      <p><strong>Email:</strong> ${customerEmail}</p>
      <p><strong>Dịch vụ:</strong> ${service}</p>
      <p><strong>Chi nhánh:</strong> ${branchName}</p>
      <p><strong>Địa chỉ:</strong> ${branchAddress}</p>
      <p><strong>Ngày:</strong> ${bookingDate}</p>
      <p><strong>Giờ:</strong> ${bookingTime}</p>
      <p><strong>Số khách:</strong> ${bookingCustomer}</p>
    `;

    // Transport from env
    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT || 587);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const from = process.env.EMAIL_FROM || user;
    const businessTo = process.env.BUSINESS_EMAIL_TO || user;

    // Skip email if not configured properly
    let emailDetails = { customer: { success: false, error: "Email not configured" }, business: { success: false, error: "Email not configured" } };
    
    if (host && user && pass) {

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

      // Verify SMTP connection/auth quickly to surface clear errors
      try {
        await transporter.verify();
      } catch (e) {
        emailDetails = {
          customer: { success: false, error: e instanceof Error ? e.message : "SMTP verify failed" },
          business: { success: false, error: e instanceof Error ? e.message : "SMTP verify failed" }
        };
      }

      if (emailDetails.customer.error !== "SMTP verify failed") {
        const sends = await Promise.allSettled([
          customerEmail
            ? transporter.sendMail({ from, to: customerEmail, subject, text, html })
            : Promise.resolve("skip-customer" as const),
          businessTo
            ? transporter.sendMail({ from, to: businessTo, subject, text, html })
            : Promise.resolve("skip-business" as const),
        ]);

        const customerResult = sends[0];
        const businessResult = sends[1];

        emailDetails = {
          customer:
            customerResult.status === "fulfilled"
              ? { success: true, error: "" }
              : { success: false, error: customerResult.reason },
          business:
            businessResult.status === "fulfilled"
              ? { success: true, error: "" }
              : { success: false, error: businessResult.reason },
        };
      }
    }

    // Skip Google Sheets API (using Google Apps Script instead)
    let sheetsDetails: { attempted: boolean; success?: boolean; error?: unknown } = { 
      attempted: false, 
      success: false, 
      error: "Using Google Apps Script instead" 
    };

    // Google Sheets submission via Google Apps Script Web App
    let gasDetails: { attempted: boolean; success?: boolean; error?: unknown } = { attempted: false };
    const gasUrl = process.env.GOOGLE_SHEETS_WEB_APP_URL;
    if (gasUrl) {
      gasDetails.attempted = true;
      try {
        // Use same structure as Google Sheets API (booking data)
        // Thêm thông tin tab ở cuối để xác định tab đích
        const targetTab = body.targetTab || "List 20_10"; // Mặc định tab "List 20_10"
        const payload = [
          branchName || "",
          customerName || "",
          customerPhone || "",
          customerEmail || "",
          bookingDate || "",
          bookingTime || "",
          bookingCustomer || "",
          targetTab, // Thông tin tab đích
        ];

        const gasRes = await fetch(gasUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        
        if (!gasRes.ok) {
          gasDetails = { attempted: true, success: false, error: `HTTP ${gasRes.status}` };
        } else {
          gasDetails = { attempted: true, success: true };
        }
      } catch (e) {
        gasDetails = { attempted: true, success: false, error: e instanceof Error ? e.message : e };
      }
    }

    // Zalo OA notification to admins (optional)
    let zaloDetails: { attempted: boolean; results?: Array<{ userId: string; success: boolean; error?: unknown }>; error?: unknown } = { attempted: false };
    const zaloAccessToken = process.env.ZALO_OA_ACCESS_TOKEN;
    const zaloRefreshToken = process.env.ZALO_OA_REFRESH_TOKEN;
    const zaloAdminIds = (process.env.ZALO_OA_ADMIN_IDS || "").split(",").map(s => s.trim()).filter(Boolean);

    // Function to refresh Zalo access token
    async function refreshZaloToken(): Promise<string | null> {
      if (!zaloRefreshToken) return null;
      
      try {
        const response = await fetch('https://oauth.zalo.me/v4/oa/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            refresh_token: zaloRefreshToken,
            grant_type: 'refresh_token'
          })
        });
        
        if (!response.ok) {
          console.error('Failed to refresh Zalo token:', response.status);
          return null;
        }
        
        const data = await response.json();
        if (data.access_token) {
          console.log('Zalo token refreshed successfully');
          return data.access_token;
        }
        return null;
      } catch (error) {
        console.error('Error refreshing Zalo token:', error);
        return null;
      }
    }

    // Function to get valid access token (try current, refresh if needed)
    async function getValidZaloToken(): Promise<string | null> {
      if (!zaloAccessToken) {
        console.log('❌ No Zalo access token found');
        return null;
      }
      
      console.log('🔍 Testing current Zalo token...');
      
      // First try with current token
      try {
        const testResponse = await fetch(`https://openapi.zalo.me/v3.0/oa/message/cs`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'access_token': zaloAccessToken
          },
          body: JSON.stringify({
            recipient: { user_id: zaloAdminIds[0] },
            message: { text: "test" },
          }),
        });
        
        console.log('📡 Zalo test response status:', testResponse.status);
        
        if (testResponse.ok) {
          console.log('✅ Current Zalo token is valid');
          return zaloAccessToken;
        }
        
        // If token is invalid, try to refresh
        const errorText = await testResponse.text();
        console.log('❌ Zalo token test failed:', errorText);
        console.log('🔄 Attempting to refresh token...');
        return await refreshZaloToken();
      } catch (error) {
        console.error('❌ Error testing Zalo token:', error);
        return await refreshZaloToken();
      }
    }

    if (zaloAccessToken && zaloAdminIds.length > 0) {
      zaloDetails.attempted = true;
      console.log('🚀 Starting Zalo notification process...');
      console.log('👥 Admin IDs:', zaloAdminIds);
      
      try {
        // Get valid access token
        const validToken = await getValidZaloToken();
        if (!validToken) {
          throw new Error('Unable to get valid Zalo access token');
        }
        
        console.log('✅ Got valid token, sending messages...');
        
        const zaloEndpoint = `https://openapi.zalo.me/v3.0/oa/message/cs`;
        const zaloText =
          `Đơn đặt lịch mới\n` +
          `————————————\n` +
          `Khách: ${customerName}\n` +
          `SĐT: ${customerPhone}${customerEmail ? `\nEmail: ${customerEmail}` : ""}\n` +
          `Dịch vụ: ${service || "(Chưa chọn)"}\n` +
          `Chi nhánh: ${branchName}${branchAddress ? `\nĐ/c: ${branchAddress}` : ""}\n` +
          `Thời gian: ${bookingDate} ${bookingTime}\n` +
          `Số khách: ${bookingCustomer || "1"}`;

        console.log('📝 Message content:', zaloText);

        const sends = await Promise.allSettled(
          zaloAdminIds.map(async (userId) => {
            console.log(`📤 Sending to user ID: ${userId}`);
            const res = await fetch(zaloEndpoint, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "access_token": validToken
              },
              body: JSON.stringify({
                recipient: { user_id: userId },
                message: { text: zaloText },
              }),
            });
            
            console.log(`📡 Response status for ${userId}:`, res.status);
            
            if (!res.ok) {
              const errorText = await res.text();
              console.log(`❌ Error response for ${userId}:`, errorText);
              throw new Error(`Zalo HTTP ${res.status}: ${errorText}`);
            }
            
            const data = await res.json();
            console.log(`📨 Response data for ${userId}:`, data);
            
            if (data.error || data.message === "error") {
              throw new Error(data.message || data.error);
            }
            return { userId, success: true as const };
          })
        );

        zaloDetails.results = sends.map((r, idx) =>
          r.status === "fulfilled"
            ? { userId: zaloAdminIds[idx], success: true }
            : { userId: zaloAdminIds[idx], success: false, error: (r as PromiseRejectedResult).reason }
        );
        
        console.log('📊 Final Zalo results:', zaloDetails.results);
      } catch (e) {
        console.error('❌ Zalo notification error:', e);
        zaloDetails.error = e instanceof Error ? e.message : e;
      }
    } else {
      console.log('⚠️ Zalo notification temporarily disabled due to API changes');
      console.log('Token exists:', !!zaloAccessToken);
      console.log('Admin IDs count:', zaloAdminIds.length);
    }

    return NextResponse.json({ success: true, emailDetails, sheetsDetails, gasDetails, zaloDetails });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Invalid JSON body",
      },
      { status: 400 }
    );
  }
}



import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

// Token cache file path (only works in local/dev environment)
const TOKEN_CACHE_FILE = path.join(process.cwd(), ".zalo-token-cache.json");

interface TokenCache {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // Unix timestamp in milliseconds
}

// Check if we're in a serverless/production environment
const isProduction = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
const isServerless = !process.env.FILE_SYSTEM_WRITABLE;

// Function to read token from cache (local only)
async function readTokenCache(): Promise<TokenCache | null> {
  // In production/serverless, file cache doesn't persist
  if (isProduction || isServerless) {
    return null;
  }
  
  try {
    const data = await fs.readFile(TOKEN_CACHE_FILE, "utf-8");
    const cache: TokenCache = JSON.parse(data);
    return cache;
  } catch (error) {
    // File doesn't exist or can't be read - that's okay
    return null;
  }
}

// Function to save token to cache (local only) or log for production
async function saveTokenCache(cache: TokenCache): Promise<boolean> {
  // In production/serverless, we can't save to file system
  if (isProduction || isServerless) {
    console.log("\n" + "=".repeat(80));
    console.log("⚠️  PRODUCTION ENVIRONMENT DETECTED");
    console.log("=".repeat(80));
    console.log("📋 NEW ACCESS TOKEN (copy to your .env or Vercel environment variables):");
    console.log(`ZALO_OA_ACCESS_TOKEN=${cache.access_token}`);
    if (cache.refresh_token) {
      console.log(`ZALO_OA_REFRESH_TOKEN=${cache.refresh_token}`);
    }
    console.log("=".repeat(80));
    console.log("💡 Token expires at:", new Date(cache.expires_at).toLocaleString());
    console.log("💡 Update this in:");
    console.log("   - Local: .env file");
    console.log("   - Vercel: Project Settings > Environment Variables");
    console.log("   - Other: Your hosting platform's environment variable settings");
    console.log("=".repeat(80) + "\n");
    return false; // Indicates manual update needed
  }
  
  // Local environment - can save to file
  try {
    await fs.writeFile(TOKEN_CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.warn("⚠️ Could not save token cache to file:", error);
    return false;
  }
}

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
    // Support both EMAIL_PASS and EMAIL_PASSWORD
    const pass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
    const from = process.env.EMAIL_FROM || user;
    
    // Support multiple recipients (comma-separated)
    // BUSINESS_EMAIL_TO can be: "email1@example.com,email2@example.com" or single email
    const businessToRaw = process.env.BUSINESS_EMAIL_TO || user || "";
    const businessToEmails = businessToRaw
      .split(',')
      .map(email => email.trim())
      .filter(Boolean);
    
    // Debug logging for production
    const isProduction = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
    if (isProduction) {
      console.log('📧 Email Configuration Check (Production):');
      console.log('  EMAIL_HOST:', host ? '✓ configured' : '✗ missing');
      console.log('  EMAIL_USER:', user ? '✓ configured' : '✗ missing');
      console.log('  EMAIL_PASS:', process.env.EMAIL_PASS ? '✓ configured' : '✗ missing');
      console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ configured' : '✗ missing');
      console.log('  Password available:', pass ? '✓ yes' : '✗ no');
      console.log('  BUSINESS_EMAIL_TO:', businessToEmails.length > 0 ? `✓ ${businessToEmails.length} recipient(s)` : '✗ missing');
      console.log('  Recipients:', businessToEmails);
    }

    // Skip email if not configured properly
    let emailDetails: {
      customer: { success: boolean; error: string | unknown };
      business: { success: boolean; error: string | unknown; recipients?: string[]; count?: number };
    } = { 
      customer: { success: false, error: "Email not configured" }, 
      business: { success: false, error: "Email not configured" } 
    };
    let transporter: nodemailer.Transporter | null = null;
    
    if (host && user && pass) {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      // Verify SMTP connection/auth quickly to surface clear errors
      try {
        console.log('🔍 Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection verified successfully');
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "SMTP verify failed";
        console.error('❌ SMTP verification failed:', errorMessage);
        if (isProduction) {
          console.error('  Full error:', e);
        }
        emailDetails = {
          customer: { success: false, error: errorMessage },
          business: { success: false, error: errorMessage }
        };
      }

      if (emailDetails.customer.error !== "SMTP verify failed" && transporter) {
        console.log('📤 Sending emails...');
        console.log('  Customer email:', customerEmail || 'not provided');
        console.log('  Business recipients:', businessToEmails);
        
        // Send to customer (if email provided)
        const customerSend = customerEmail
          ? transporter.sendMail({ from, to: customerEmail, subject, text, html })
          : Promise.resolve("skip-customer" as const);
        
        // Send to all business recipients (support multiple emails)
        const businessSends = businessToEmails.map(email => {
          console.log(`  📧 Sending to business: ${email}`);
          return transporter!.sendMail({ from, to: email, subject, text, html });
        });
        
        const sends = await Promise.allSettled([
          customerSend,
          ...businessSends
        ]);

        const customerResult = sends[0];
        const businessResults = sends.slice(1);

        // Log results
        if (customerResult.status === "fulfilled") {
          console.log('✅ Customer email sent successfully');
        } else {
          console.error('❌ Customer email failed:', customerResult.reason);
        }

        businessResults.forEach((result, index) => {
          if (result.status === "fulfilled") {
            console.log(`✅ Business email sent to ${businessToEmails[index]}`);
          } else {
            console.error(`❌ Business email failed to ${businessToEmails[index]}:`, (result as PromiseRejectedResult).reason);
          }
        });

        // Check if all business emails were sent successfully
        const businessSuccess = businessResults.every(result => result.status === "fulfilled");
        const businessErrors = businessResults
          .filter(result => result.status === "rejected")
          .map(result => (result as PromiseRejectedResult).reason);

        emailDetails = {
          customer:
            customerResult.status === "fulfilled"
              ? { success: true, error: "" }
              : { success: false, error: customerResult.reason },
          business: businessSuccess
            ? { 
                success: true, 
                error: "",
                recipients: businessToEmails,
                count: businessToEmails.length
              }
            : { 
                success: false, 
                error: businessErrors.length > 0 ? businessErrors[0] : "Failed to send to some recipients",
                recipients: businessToEmails,
                count: businessToEmails.length
              },
        };
      } else {
        console.log('⚠️ Email sending skipped:', {
          smtpVerified: emailDetails.customer.error !== "SMTP verify failed",
          transporterExists: !!transporter
        });
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
    let zaloDetails: { 
      attempted: boolean; 
      results?: Array<{ userId: string; success: boolean; error?: unknown }>; 
      error?: unknown;
      tokenRefreshed?: boolean;
      newTokenInfo?: {
        access_token?: string;
        refresh_token?: string;
        expires_at?: string;
        message?: string;
      };
    } = { attempted: false };
    
    // Try to get token from cache first, fallback to env
    const tokenCache = await readTokenCache();
    const zaloAccessToken = tokenCache?.access_token || process.env.ZALO_OA_ACCESS_TOKEN;
    const zaloRefreshToken = tokenCache?.refresh_token || process.env.ZALO_OA_REFRESH_TOKEN;
    const zaloAdminIds = (process.env.ZALO_OA_ADMIN_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
    
    // Check if cached token is still valid (with 1 hour buffer before expiry)
    const isTokenExpired = tokenCache 
      ? Date.now() >= (tokenCache.expires_at - 3600000) // 1 hour before expiry
      : false;
    
    // Track if token was refreshed (for notification)
    let tokenWasRefreshed = false;
    let newTokenData: { access_token: string; refresh_token?: string; expires_at: number } | null = null;
    
    if (tokenCache && !isTokenExpired) {
      console.log('✅ Using cached Zalo token (still valid)');
    } else if (tokenCache && isTokenExpired) {
      console.log('⏰ Cached token is expired or expiring soon, will refresh...');
    }

    // Function to send email notification when token is refreshed
    async function sendTokenRefreshEmail(
      tokenData: { access_token: string; refresh_token?: string; expires_at: number },
      emailTransporter: nodemailer.Transporter | null,
      emailFrom: string | undefined,
      emailTo: string | undefined
    ): Promise<void> {
      const notifyEmail = process.env.ZALO_TOKEN_NOTIFY_EMAIL || emailTo;
      
      if (!notifyEmail) {
        console.log('⚠️ No email configured for token refresh notification');
        return;
      }
      
      if (!emailTransporter) {
        console.log('⚠️ Email transporter not configured. Cannot send token refresh notification.');
        return;
      }
      
      try {
        const expiresInHours = ((tokenData.expires_at - Date.now()) / 3600000).toFixed(1);
        const tokenSubject = "🔄 Zalo OA Token đã được làm mới tự động";
        const tokenHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">🔄 Zalo OA Access Token đã được làm mới</h2>
            <p>Hệ thống đã tự động refresh token Zalo OA của bạn.</p>
            ${isProduction || isServerless ? `
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0;">
              <p style="margin: 0;"><strong>⚠️ Cần cập nhật thủ công trong Production!</strong></p>
            </div>
            ` : `
            <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 12px; margin: 20px 0;">
              <p style="margin: 0;"><strong>✅ Token đã được tự động lưu vào cache (Local environment)</strong></p>
            </div>
            `}
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <h3 style="color: #1f2937;">Token mới:</h3>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 12px; margin: 10px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Access Token:</strong></p>
              <code style="background: #ffffff; padding: 8px; display: block; word-break: break-all; font-size: 12px; border: 1px solid #e5e7eb; border-radius: 4px;">${tokenData.access_token}</code>
            </div>
            ${tokenData.refresh_token ? `
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 12px; margin: 10px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Refresh Token (mới):</strong></p>
              <code style="background: #ffffff; padding: 8px; display: block; word-break: break-all; font-size: 12px; border: 1px solid #e5e7eb; border-radius: 4px;">${tokenData.refresh_token}</code>
            </div>
            ` : ''}
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; margin: 20px 0;">
              <p style="margin: 0;"><strong>⏰ Hết hạn sau:</strong> ${expiresInHours} giờ</p>
              <p style="margin: 8px 0 0 0;"><strong>📅 Hết hạn vào:</strong> ${new Date(tokenData.expires_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
            </div>
            ${isProduction || isServerless ? `
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <h3 style="color: #1f2937;">📝 Cách cập nhật trong Production:</h3>
            <ol style="line-height: 1.8;">
              <li><strong>Vercel:</strong> Project Settings > Environment Variables > Edit <code>ZALO_OA_ACCESS_TOKEN</code></li>
              <li><strong>Local:</strong> Cập nhật file <code>.env</code></li>
              <li><strong>Khác:</strong> Cập nhật environment variables trên hosting platform của bạn</li>
            </ol>
            <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0;">
              <p style="margin: 0;"><strong>⚠️ Lưu ý quan trọng:</strong> Token cũ sẽ không hoạt động sau ~25 giờ. Cần cập nhật sớm để tránh gián đoạn dịch vụ!</p>
            </div>
            ` : ''}
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">Email này được gửi tự động khi token Zalo OA được refresh. Token sẽ tự động refresh lại sau ~25 giờ.</p>
          </div>
        `;
        
        const textContent = `Zalo OA Token Refreshed

Access Token: ${tokenData.access_token}
${tokenData.refresh_token ? `Refresh Token: ${tokenData.refresh_token}\n` : ''}Expires in: ${expiresInHours} hours
Expires at: ${new Date(tokenData.expires_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}

${isProduction || isServerless ? '⚠️ Cần cập nhật thủ công trong Production environment variables.\n' : '✅ Token đã được tự động lưu vào cache (Local environment).'}`;
        
        await emailTransporter.sendMail({
          from: emailFrom || user || "noreply@example.com",
          to: notifyEmail,
          subject: tokenSubject,
          html: tokenHtml,
          text: textContent
        });
        
        console.log(`📧 Email notification sent successfully to ${notifyEmail} about token refresh`);
      } catch (emailError) {
        console.error('❌ Failed to send token refresh email:', emailError);
        // Don't throw - email failure shouldn't break the token refresh process
      }
    }

    // Function to refresh Zalo access token
    // Nhiệm vụ: Khi access_token hết hạn, refresh_token sẽ được dùng để lấy access_token MỚI từ Zalo API
    // Refresh token có thời hạn 1 năm, cho phép tự động gia hạn access token mà không cần đăng nhập lại
    async function refreshZaloToken(): Promise<{ token: string; expiresIn: number } | null> {
      if (!zaloRefreshToken) {
        console.log('❌ No refresh token available. Cannot refresh access token.');
        return null;
      }
      
      console.log('🔄 Using refresh_token to get new access_token from Zalo API...');
      
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
          const errorText = await response.text();
          console.error(`❌ Failed to refresh Zalo token: HTTP ${response.status} - ${errorText}`);
          console.error('⚠️ Refresh token may have expired (after 1 year) or is invalid. Please update refresh token in .env');
          return null;
        }
        
        const data = await response.json();
        if (data.access_token) {
          const expiresIn = parseInt(data.expires_in || '90000', 10); // Default 90000 seconds (25 hours)
          const expiresInHours = (expiresIn / 3600).toFixed(1);
          const expiresAt = Date.now() + (expiresIn * 1000); // Convert to milliseconds
          
          console.log(`✅ Zalo token refreshed successfully using refresh_token!`);
          console.log(`   New access_token expires in ${expiresInHours} hours (${expiresIn} seconds)`);
          
          // Auto-save to cache file (no manual update needed!)
          const newCache: TokenCache = {
            access_token: data.access_token,
            refresh_token: data.refresh_token || zaloRefreshToken || undefined,
            expires_at: expiresAt
          };
          
          // Store token data for notification
          tokenWasRefreshed = true;
          newTokenData = {
            access_token: data.access_token,
            refresh_token: data.refresh_token || zaloRefreshToken || undefined,
            expires_at: expiresAt
          };
          
          const saved = await saveTokenCache(newCache);
          if (saved) {
            console.log(`   💾 Token automatically saved to cache file - NO MANUAL UPDATE NEEDED!`);
            console.log(`   ✅ Token will be automatically used for next ${expiresInHours} hours`);
            console.log(`   🏠 Local environment: Token management is fully automatic`);
          } else {
            if (isProduction || isServerless) {
              console.log(`   ⚠️  PRODUCTION: Manual update required (see token above)`);
              console.log(`   📝 Copy the token from the log above and update your environment variables`);
            } else {
              console.log(`   ⚠️ Could not save to cache. Update ZALO_OA_ACCESS_TOKEN in .env manually`);
            }
          }
          
          // If new refresh_token is provided, log it
          if (data.refresh_token) {
            if (saved) {
              console.log(`   💾 New refresh_token also saved to cache`);
            } else {
              console.log(`   ⚠️ New refresh_token received. Update ZALO_OA_REFRESH_TOKEN in .env`);
            }
          }
          
          // Send email notification about token refresh (if email is configured)
          // Check if email notification is enabled (default: enabled)
          const emailNotificationEnabled = process.env.ZALO_TOKEN_EMAIL_NOTIFICATION !== "false";
          if (emailNotificationEnabled) {
            console.log(`   📧 Sending email notification about token refresh...`);
            await sendTokenRefreshEmail(newTokenData, transporter, from, businessToEmails[0] || user);
          } else {
            console.log(`   📧 Email notification disabled (ZALO_TOKEN_EMAIL_NOTIFICATION=false)`);
          }
          
          return { token: data.access_token, expiresIn };
        }
        return null;
      } catch (error) {
        console.error('❌ Error refreshing Zalo token:', error);
        return null;
      }
    }

    // Function to get valid access token (try current, refresh if needed)
    // Flow: 
    // 1. Kiểm tra token từ cache (nếu có) - tự động refresh nếu sắp hết hạn
    // 2. Thử dùng access_token hiện tại
    // 3. Nếu hết hạn → Dùng refresh_token để lấy access_token MỚI (tự động lưu vào cache)
    // 4. Trả về access_token hợp lệ để sử dụng
    async function getValidZaloToken(): Promise<string | null> {
      if (!zaloAccessToken) {
        console.log('❌ No Zalo access token found');
        return null;
      }
      
      // If token from cache is expired or expiring soon, refresh immediately
      if (isTokenExpired) {
        console.log('⏰ Token is expired or expiring soon, refreshing now...');
        const refreshResult = await refreshZaloToken();
        if (refreshResult) {
          console.log('✅ Successfully refreshed token before expiry');
          return refreshResult.token;
        }
      }
      
      console.log('🔍 Testing current Zalo access_token...');
      console.log('ℹ️ Access tokens expire after ~25 hours (90000 seconds)');
      console.log('ℹ️ Refresh token expires after 1 year - used to get new access_token when current one expires');
      if (isProduction || isServerless) {
        console.log('⚠️  PRODUCTION: Token will be logged when refreshed - manual update required');
      } else {
        console.log('💡 Local: Token is automatically cached and refreshed - NO MANUAL UPDATE NEEDED!');
      }
      
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
          console.log('✅ Current Zalo access_token is still valid - no refresh needed');
          return zaloAccessToken;
        }
        
        // If token is invalid/expired, use refresh_token to get new access_token
        const errorText = await testResponse.text();
        console.log('❌ Current access_token is invalid/expired:', errorText);
        console.log('🔄 Nhiệm vụ của refresh_token: Lấy access_token MỚI từ Zalo API...');
        const refreshResult = await refreshZaloToken();
        
        if (refreshResult) {
          console.log('✅ Successfully obtained new access_token using refresh_token');
          console.log('💾 Token automatically saved - will be used for next ~25 hours');
          return refreshResult.token;
        } else {
          console.log('❌ Failed to refresh token. Refresh token may have expired (after 1 year)');
          return null;
        }
      } catch (error) {
        console.error('❌ Error testing Zalo token:', error);
        console.log('🔄 Attempting to refresh token due to error...');
        const refreshResult = await refreshZaloToken();
        return refreshResult?.token || null;
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
          throw new Error('Unable to get valid Zalo access token. Token may have expired. Please check refresh token or update access token in environment variables.');
        }
        
        console.log('✅ Got valid token, sending messages...');
        console.log('💡 Token management is AUTOMATIC - no manual updates needed!');
        
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
        
        // If token was refreshed, add info to response
        if (tokenWasRefreshed && newTokenData !== null) {
          const tokenData: { access_token: string; refresh_token?: string; expires_at: number } = newTokenData;
          zaloDetails.tokenRefreshed = true;
          zaloDetails.newTokenInfo = {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: new Date(tokenData.expires_at).toISOString(),
            message: "Token was refreshed. Check email or logs for details."
          };
          
          // Note: Email notification is already sent in refreshZaloToken() function
          // This is just for response metadata
        }
      } catch (e) {
        console.error('❌ Zalo notification error:', e);
        zaloDetails.error = e instanceof Error ? e.message : e;
      }
    } else {
      console.log('⚠️ Zalo notification temporarily disabled due to API changes');
      console.log('Token exists:', !!zaloAccessToken);
      console.log('Admin IDs count:', zaloAdminIds.length);
    }

    // Include token in response if enabled (for production monitoring)
    const response: any = { success: true, emailDetails, sheetsDetails, gasDetails, zaloDetails };
    
    // Only include token in response if explicitly enabled (security)
    if (process.env.ENABLE_TOKEN_IN_RESPONSE === "true" && tokenWasRefreshed && newTokenData !== null) {
      const tokenData: { access_token: string; refresh_token?: string; expires_at: number } = newTokenData;
      response.zaloTokenRefresh = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || undefined,
        expires_at: new Date(tokenData.expires_at).toISOString(),
        warning: "Enable this only for monitoring. Disable in production for security."
      };
    }

    return NextResponse.json(response);
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



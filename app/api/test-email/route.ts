import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT || 587);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
    const from = process.env.EMAIL_FROM || user;
    const businessToRaw = process.env.BUSINESS_EMAIL_TO || user || "";
    const businessToEmails = businessToRaw
      .split(',')
      .map(email => email.trim())
      .filter(Boolean);

    // Check configuration
    const config = {
      EMAIL_HOST: host ? '✓' : '✗',
      EMAIL_USER: user ? '✓' : '✗',
      EMAIL_PASS: process.env.EMAIL_PASS ? '✓' : '✗',
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? '✓' : '✗',
      Password_Available: pass ? '✓' : '✗',
      BUSINESS_EMAIL_TO: businessToEmails.length > 0 ? `✓ (${businessToEmails.length} recipients)` : '✗',
      Recipients: businessToEmails,
      Warning: host === 'smtp.gmail.com' && user && !user.includes('@gmail.com') 
        ? '⚠️ Using Gmail SMTP with non-Gmail email. This may not work. Use Gmail account or change EMAIL_HOST to your email provider SMTP.'
        : null
    };

    if (!host || !user || !pass) {
      return NextResponse.json({
        success: false,
        error: "Email not configured",
        config
      }, { status: 400 });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    // Test 1: Verify SMTP
    let verifyResult = { success: false, error: null as string | null, details: null as any };
    try {
      console.log('🔍 Testing SMTP connection...');
      console.log('  Host:', host);
      console.log('  Port:', port);
      console.log('  User:', user);
      console.log('  Secure:', port === 465);
      
      await transporter.verify();
      verifyResult = { success: true, error: null, details: 'SMTP connection verified successfully' };
      console.log('✅ SMTP verification successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = error instanceof Error ? {
        message: error.message,
        code: (error as any).code,
        command: (error as any).command,
        response: (error as any).response,
        responseCode: (error as any).responseCode
      } : error;
      
      verifyResult = {
        success: false,
        error: errorMessage,
        details: errorDetails
      };
      console.error('❌ SMTP verification failed:', errorMessage);
      console.error('  Details:', errorDetails);
    }

    // Test 2: Send test email
    let sendResult = { success: false, error: null as string | null, messageId: null as string | null };
    if (verifyResult.success && businessToEmails.length > 0) {
      try {
        const testSubject = "🧪 Test Email from Production";
        const testHtml = `
          <h2>Test Email</h2>
          <p>This is a test email from your production server.</p>
          <p>If you receive this, email configuration is working correctly!</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString('vi-VN')}</p>
        `;
        
        const info = await transporter.sendMail({
          from: from || user,
          to: businessToEmails[0], // Send to first recipient for test
          subject: testSubject,
          html: testHtml,
          text: "This is a test email from your production server."
        });
        
        sendResult = {
          success: true,
          error: null,
          messageId: info.messageId || null
        };
      } catch (error) {
        sendResult = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          messageId: null
        };
      }
    }

    return NextResponse.json({
      success: verifyResult.success && sendResult.success,
      config,
      tests: {
        smtpVerification: verifyResult,
        emailSending: sendResult
      },
      message: verifyResult.success && sendResult.success
        ? "✅ Email is working correctly! Check your inbox."
        : "❌ Email test failed. Check the errors above."
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}


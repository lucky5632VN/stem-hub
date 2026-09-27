import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getCorsHeaders, getClientIp, checkRateLimit, isAllowedUrl, maskErrorMessage } from '@/lib/serverSecurity';

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function POST(req) {
  const corsHeaders = getCorsHeaders(req);
  try {
    const ip = getClientIp(req);
    // Rate limit: Tối đa 5 lượt gửi OTP trong 10 phút trên mỗi IP
    const rateCheck = checkRateLimit(`send-otp:${ip}`, 5, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Bạn thao tác quá nhanh. Vui lòng đợi ${rateCheck.resetInSec} giây trước khi yêu cầu lại.` },
        { status: 429, headers: corsHeaders }
      );
    }

    const { email, magicLink } = await req.json().catch(() => ({}));

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Địa chỉ email không hợp lệ' }, { status: 400, headers: corsHeaders });
    }

    const cleanEmail = email.trim().toLowerCase();

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    let transporter;

    if (smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });
    } else {
      // Tự động sử dụng Ethereal Test Email Account khi chưa cài đặt SMTP riêng
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }

    const hostOrigin = req.headers.get('origin') || 'https://ai.stem-hub.top';
    
    // 🛡️ CHỐNG OPEN REDIRECT / PHISHING: Chỉ cho phép magicLink dẫn về domain chính thức của hệ thống
    let finalVerifyUrl = `${hostOrigin}/?verify2FA=true&email=${encodeURIComponent(cleanEmail)}`;
    if (magicLink && isAllowedUrl(magicLink)) {
      finalVerifyUrl = magicLink;
    }

    const senderEmail = process.env.SMTP_FROM || smtpUser || 'noreply@cuoc-thi-ai-e2044.firebaseapp.com';

    const mailOptions = {
      from: `"STEM HUB Security Portal 🛡️" <${senderEmail}>`,
      to: cleanEmail,
      subject: `[STEM HUB 2FA] 🔗 Liên kết xác minh đăng nhập 1-Click cho ${cleanEmail}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px; background: linear-gradient(135deg, #0f172a 0%, #020617 100%); border-radius: 24px; color: #f8fafc; border: 1px solid rgba(6,182,212,0.4);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #22d3ee; font-size: 22px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0;">STEM HUB AI SECURITY</h1>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 6px;">Xác thực bảo mật 2 lớp qua Email (1-Click Magic Link)</p>
          </div>

          <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(34, 211, 238, 0.3); padding: 28px; border-radius: 20px; text-align: center; margin-bottom: 24px;">
            <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 20px;">Bạn đang thực hiện đăng nhập vào tài khoản <strong style="color: #38bdf8;">${cleanEmail}</strong>.</p>
            <p style="color: #94a3b8; font-size: 12px; margin-bottom: 24px;">Bấm vào nút bên dưới để xác minh và hoàn tất đăng nhập ngay lập tức:</p>
            
            <a href="${finalVerifyUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%); color: #000000; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; border-radius: 14px; box-shadow: 0 0 20px rgba(6,182,212,0.4);">
              🔗 XÁC MINH & ĐĂNG NHẬP NGAY
            </a>

            <p style="color: #64748b; font-size: 11px; margin-top: 24px;">Hoặc sao chép liên kết này vào trình duyệt:<br/><a href="${finalVerifyUrl}" style="color: #38bdf8; word-break: break-all;">${finalVerifyUrl}</a></p>
          </div>

          <p style="color: #475569; font-size: 11px; text-align: center; margin: 0;">
            Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua thư này để bảo vệ tài khoản.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || null
    }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Lỗi API send-otp:", error);
    return NextResponse.json(
      { error: maskErrorMessage(error, 'Không thể gửi email xác thực lúc này. Vui lòng thử lại sau.') },
      { status: 500, headers: corsHeaders }
    );
  }
}

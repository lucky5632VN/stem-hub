import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import { getCorsHeaders, getClientIp, checkRateLimit, maskErrorMessage } from '@/lib/serverSecurity';

const TARGET_ADMIN_EMAIL = 'hohoanganh20092021@gmail.com';

export async function OPTIONS(req) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function POST(req) {
  const corsHeaders = getCorsHeaders(req);

  try {
    const ip = getClientIp(req);

    // Rate limit: Tối đa 5 tin nhắn / 10 phút trên mỗi IP để chống spam
    const rateCheck = checkRateLimit(`contact-form:${ip}`, 5, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Bạn đã gửi nhiều tin nhắn liên tiếp. Vui lòng đợi ${rateCheck.resetInSec} giây trước khi gửi tiếp.` 
        },
        { status: 429, headers: corsHeaders }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name, email, userId, subject, message } = body;

    // Validate Nội dung tin nhắn
    const cleanMessage = (typeof message === 'string' ? message : '').trim();
    if (!cleanMessage || cleanMessage.length < 5 || cleanMessage.length > 3000) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập nội dung tin nhắn (từ 5 đến 3.000 ký tự).' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Tên và Email lấy tự động từ tài khoản người dùng nếu có, không bắt buộc người dùng gõ tay
    const cleanName = (typeof name === 'string' && name.trim()) ? name.trim() : 'Học sinh STEM HUB';
    const cleanEmail = (typeof email === 'string' && email.trim()) ? email.trim() : 'Chưa có email tài khoản';
    const cleanSubject = (typeof subject === 'string' && subject.trim()) ? subject.trim() : 'Góp ý / Phản hồi mới từ học sinh';
    const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // 1. Lưu tin nhắn vào Firestore để Ban Quản Trị lưu trữ và theo dõi
    if (db) {
      try {
        const docRef = doc(collection(db, 'contact_messages'), messageId);
        await setDoc(docRef, {
          id: messageId,
          name: cleanName,
          email: cleanEmail,
          userId: userId || null,
          subject: cleanSubject,
          message: cleanMessage,
          targetAdmin: TARGET_ADMIN_EMAIL,
          status: 'unread',
          ip,
          createdAt: serverTimestamp(),
          timestamp: Date.now()
        });
      } catch (dbErr) {
        console.warn('Lỗi ghi contact_messages vào Firestore:', dbErr.message);
      }
    }

    // 2. Tự động gửi Email thông báo tới hohoanganh20092021@gmail.com
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass }
        });

        await transporter.sendMail({
          from: `"STEM HUB Thông Báo" <${smtpUser}>`,
          to: TARGET_ADMIN_EMAIL,
          subject: `[STEM HUB Góp Ý Mới] ${cleanSubject} - từ ${cleanName}`,
          html: `
            <div style="font-family: 'Be Vietnam Pro', Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 16px; background: #ffffff;">
              <div style="background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 16px; border-radius: 12px; color: white; text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 20px;">📬 Tin Nhắn Mới Gửi Đến Admin</h2>
                <p style="margin: 4px 0 0; opacity: 0.9; font-size: 13px;">Hệ thống Giáo dục STEM HUB</p>
              </div>

              <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 120px;"><strong>Người gửi:</strong></td>
                  <td style="padding: 8px 0; color: #111;">${cleanName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Email tài khoản:</strong></td>
                  <td style="padding: 8px 0; color: #111;">${cleanEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Chủ đề:</strong></td>
                  <td style="padding: 8px 0; color: #ec4899; font-weight: bold;">${cleanSubject}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Thời gian:</strong></td>
                  <td style="padding: 8px 0; color: #111;">${new Date().toLocaleString('vi-VN')}</td>
                </tr>
              </table>

              <div style="background: #f8fafc; padding: 18px; border-radius: 12px; border: 1px solid #f472b6; margin-top: 10px;">
                <p style="margin: 0 0 8px; font-size: 12px; color: #888; text-transform: uppercase; font-weight: bold;">Nội dung tin nhắn:</p>
                <p style="white-space: pre-wrap; margin: 0; color: #1e293b; line-height: 1.6; font-size: 14px;">${cleanMessage}</p>
              </div>

              <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; text-align: center;">
                Tin nhắn được tự động chuyển tiếp đến hộp thư quản trị viên <strong>${TARGET_ADMIN_EMAIL}</strong>
              </p>
            </div>
          `
        });
      } catch (mailErr) {
        console.warn('Lỗi gửi email tới admin (SMTP):', mailErr.message);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Đã gửi phản hồi thành công đến Ban Quản Trị!',
        messageId
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Lỗi API Contact:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: maskErrorMessage(error, 'Đã xảy ra lỗi khi gửi phản hồi. Vui lòng thử lại sau.') 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

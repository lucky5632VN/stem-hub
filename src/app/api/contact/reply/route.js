import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getCorsHeaders, maskErrorMessage, checkRateLimit, getClientIp } from '@/lib/serverSecurity';

export async function OPTIONS(req) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req)
  });
}

export async function POST(req) {
  const corsHeaders = getCorsHeaders(req);
  const ip = getClientIp(req);

  // Rate limit: tối đa 30 lượt gửi phản hồi / phút
  const rateCheck = checkRateLimit(`contact-reply:${ip}`, 30, 60 * 1000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { success: false, error: 'Quá nhiều yêu cầu. Vui lòng đợi giây lát.' },
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    const body = await req.json();
    const { messageId, replyText, adminEmail } = body;

    if (!messageId || typeof messageId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Thiếu mã tin nhắn (messageId).' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!replyText || typeof replyText !== 'string' || replyText.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Nội dung phản hồi không được để trống (tối thiểu 2 ký tự).' },
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanReply = replyText.trim().slice(0, 5000);
    const cleanAdmin = (typeof adminEmail === 'string' && adminEmail.trim()) ? adminEmail.trim() : 'Ban Quản Trị STEM HUB';
    const replyTimestamp = Date.now();

    // 1. Cập nhật vào Firestore
    let messageData = null;
    try {
      const docRef = doc(db, 'contact_messages', messageId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        messageData = snap.data();
      }

      await updateDoc(docRef, {
        adminReply: cleanReply,
        adminReplyAt: replyTimestamp,
        status: 'replied',
        repliedBy: cleanAdmin
      });
    } catch (dbErr) {
      console.warn('Lỗi cập nhật Firestore contact_messages:', dbErr.message);
    }

    // 2. Gửi Email thông báo cho học sinh nếu có email
    const studentEmail = messageData?.email || body?.studentEmail;
    const studentName = messageData?.name || body?.studentName || 'Học sinh';
    const studentSubject = messageData?.subject || body?.subject || 'Góp ý STEM HUB';
    const studentOriginalMsg = messageData?.message || body?.originalMessage || '';

    let emailSent = false;
    if (studentEmail && studentEmail.includes('@') && !studentEmail.includes('Chưa có email')) {
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
            from: `"Ban Quản Trị STEM HUB" <${smtpUser}>`,
            to: studentEmail,
            subject: `[STEM HUB] Phản hồi góp ý của bạn: ${studentSubject}`,
            html: `
              <div style="font-family: 'Be Vietnam Pro', Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 16px; background: #ffffff;">
                <div style="background: linear-gradient(135deg, #10b981, #06b6d4); padding: 18px; border-radius: 12px; color: white; text-align: center; margin-bottom: 20px;">
                  <h2 style="margin: 0; font-size: 20px;">💌 Ban Quản Trị Đã Phản Hồi Góp Ý Của Bạn</h2>
                  <p style="margin: 4px 0 0; opacity: 0.95; font-size: 13px;">Nền tảng Giáo dục & Đấu trường STEM HUB</p>
                </div>

                <p style="font-size: 14px; color: #334155;">Chào bạn <strong>${studentName}</strong>,</p>
                <p style="font-size: 14px; color: #334155; line-height: 1.5;">
                  Ban Quản Trị STEM HUB rất cảm ơn bạn đã gửi ý kiến đóng góp. Chúng tôi xin gửi phản hồi cụ thể như sau:
                </p>

                <!-- Khung câu trả lời của Admin -->
                <div style="background: #f0fdf4; border: 1px solid #10b981; padding: 16px; border-radius: 12px; margin: 16px 0;">
                  <p style="margin: 0 0 6px; font-size: 12px; color: #047857; text-transform: uppercase; font-weight: bold;">
                    💬 Câu trả lời từ Quản Trị Viên:
                  </p>
                  <p style="white-space: pre-wrap; margin: 0; color: #064e3b; line-height: 1.6; font-size: 14px; font-weight: 500;">
                    ${cleanReply}
                  </p>
                </div>

                <!-- Khung nội dung gốc của học sinh -->
                ${studentOriginalMsg ? `
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 12px; margin: 16px 0;">
                    <p style="margin: 0 0 4px; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold;">
                      Nội dung bạn đã gửi (${studentSubject}):
                    </p>
                    <p style="white-space: pre-wrap; margin: 0; color: #475569; font-size: 13px; line-height: 1.5;">
                      ${studentOriginalMsg}
                    </p>
                  </div>
                ` : ''}

                <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
                  Bạn cũng có thể xem lại phản hồi này trực tiếp trên website tại mục <strong>Tin nhắn gần đây</strong> ở trang:
                  <br />
                  <a href="https://ai.stem-hub.top/lien-he" style="color: #ec4899; font-weight: bold; text-decoration: underline;">
                    https://ai.stem-hub.top/lien-he
                  </a>
                </p>

                <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 16px;" />
                <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
                  STEM HUB - Virtual Sci-Fi Portal & AI Lab • Thắp sáng đam mê Khoa học
                </p>
              </div>
            `
          });
          emailSent = true;
        } catch (emailErr) {
          console.warn('Lỗi gửi email cho học sinh:', emailErr.message);
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Đã gửi phản hồi thành công đến học sinh!',
        adminReply: cleanReply,
        adminReplyAt: replyTimestamp,
        emailSent
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Lỗi khi gửi phản hồi học sinh:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: maskErrorMessage(error, 'Đã xảy ra lỗi khi gửi phản hồi. Vui lòng thử lại sau.') 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

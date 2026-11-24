'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  FileText, 
  Bot, 
  Gamepad2, 
  UserCheck, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Mail,
  GraduationCap,
  Scale
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Header Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-bg-secondary hover:bg-bg-tertiary border border-border-theme text-xs font-semibold text-text-secondary hover:text-text-primary transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-accent-pink" />
            <span>Về Trang Chủ STEM HUB</span>
          </Link>
          <span className="text-[11px] font-mono font-bold text-accent-pink px-3 py-1 rounded-full bg-accent-pink/10 border border-accent-pink/20">
            CHỈNH SỬA LẦN CUỐI: THÁNG 11/2026
          </span>
        </div>

        {/* Hero Banner */}
        <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-bg-secondary via-bg-secondary/90 to-bg-tertiary border border-border-theme shadow-xl">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-accent-pink/15 blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-pink/10 border border-accent-pink/20 text-accent-pink text-xs font-bold">
              <Scale className="w-3.5 h-3.5" />
              <span>BẢO VỆ DỮ LIỆU & QUYỀN RIÊNG TƯ HỌC SINH</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-text-primary">
              Chính Sách Bảo Mật & Điều Khoản Dịch Vụ
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-2xl">
              Mô tả rõ ràng các biện pháp kỹ thuật về bảo mật, lưu trữ và xử lý dữ liệu của người dùng khi tham gia học tập trên nền tảng STEM HUB.
            </p>
          </div>
        </div>

        {/* Summary Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-bg-secondary border border-border-theme flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-text-primary">100% Phi Thương Mại</h2>
              <p className="text-[11px] text-text-secondary mt-0.5">Không bán hàng, không thu phí, không phát sinh giao dịch tiền tệ.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-bg-secondary border border-border-theme flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-text-primary">Bảo Vệ Học Sinh</h2>
              <p className="text-[11px] text-text-secondary mt-0.5">Dữ liệu chỉ dùng để lưu tiến độ bài thi và điểm xếp hạng học tập.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-bg-secondary border border-border-theme flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-text-primary">Minh Bạch Trợ Lý AI</h2>
              <p className="text-[11px] text-text-secondary mt-0.5">Chatbot AI công khai nhãn nhận diện và quy tắc an toàn Responsible AI.</p>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-6">

          {/* Section 1 */}
          <div className="p-6 rounded-3xl bg-bg-secondary border border-border-theme space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-accent-pink/15 text-accent-pink flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h2 className="text-base font-bold text-text-primary">
                Mục Đích & Phạm Vi Thu Thập Dữ Liệu
              </h2>
            </div>
            <div className="text-xs text-text-secondary space-y-2.5 leading-relaxed pl-11">
              <p>
                Khi học sinh hoặc giáo viên sử dụng nền tảng <strong>STEM HUB</strong>, hệ thống chỉ thu thập các trường thông tin tối thiểu cần thiết phục vụ học tập:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li><strong className="text-text-primary">Họ và tên, Email đăng ký:</strong> Dùng để định danh tài khoản học sinh, gửi liên kết xác thực tài khoản và khôi phục mật khẩu.</li>
                <li><strong className="text-text-primary">Tiến độ & Kết quả làm bài:</strong> Lịch sử làm bài thi trắc nghiệm THPT Quốc gia, điểm ELO thi đấu và huy hiệu danh hiệu đạt được.</li>
                <li><strong className="text-text-primary">Nội dung câu hỏi gửi đến Trợ lý AI (NOVA HUD):</strong> Dùng để đối chiếu cơ sở tri thức RAG và giải đáp kiến thức khoa học trực tiếp trong phiên học.</li>
                <li><strong className="text-text-primary">Dữ liệu khuôn mặt 2FA (Tùy chọn):</strong> Nếu người dùng bật tính năng Face 2FA, hệ thống chỉ lưu trữ chuỗi vectơ toán học (Face Descriptor) được mã hóa một chiều; tuyệt đối không lưu trữ ảnh chụp khuôn mặt gốc.</li>
              </ul>
              <div className="p-3 rounded-xl bg-bg-tertiary border border-border-theme text-[11px]">
                💡 <strong className="text-text-primary">Cam kết:</strong> STEM HUB tuyệt đối <strong>KHÔNG</strong> thu thập dữ liệu vị trí GPS, danh bạ, tin nhắn riêng tư, số căn cước công dân hoặc thông tin tài chính cá nhân.
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="p-6 rounded-3xl bg-bg-secondary border border-border-theme space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-accent-pink/15 text-accent-pink flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h2 className="text-base font-bold text-text-primary">
                Cam Kết Bảo Mật & Tuyệt Đối Không Thương Mại Hóa (F02 & F04)
              </h2>
            </div>
            <div className="text-xs text-text-secondary space-y-2.5 leading-relaxed pl-11">
              <p>
                Dự án STEM HUB là đề tài nghiên cứu học thuật phục vụ giáo dục phi thương mại:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li><strong className="text-text-primary">Không bán hoặc chia sẻ dữ liệu:</strong> Chúng tôi cam kết không cung cấp, mua bán, cho thuê hoặc chia sẻ dữ liệu cá nhân của học sinh cho bất kỳ công ty quảng cáo hoặc bên thứ ba nào.</li>
                <li><strong className="text-text-primary">Lưu trữ bảo mật:</strong> Cơ sở dữ liệu được quản lý với hệ thống phân quyền nghiêm ngặt Firestore Rules, mã hóa SSL/TLS 100% trong quá trình truyền tải.</li>
                <li><strong className="text-text-primary">Chế độ phi thương mại:</strong> Toàn bộ tính năng phòng thí nghiệm ảo 3D, phòng thi THPT, câu hỏi luyện tập và chatbot AI đều được cung cấp hoàn toàn miễn phí.</li>
              </ul>
            </div>
          </div>

          {/* Section 3 */}
          <div className="p-6 rounded-3xl bg-bg-secondary border border-border-theme space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-accent-pink/15 text-accent-pink flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h2 className="text-base font-bold text-text-primary">
                Quyền Của Học Sinh Đối Với Dữ Liệu Cá Nhân
              </h2>
            </div>
            <div className="text-xs text-text-secondary space-y-2.5 leading-relaxed pl-11">
              <p>
                Người dùng có đầy đủ các quyền kiểm soát dữ liệu của mình:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-bg-tertiary border border-border-theme">
                  <span className="font-bold text-text-primary block mb-1">✓ Quyền được biết & đồng ý</span>
                  Học sinh được thông báo rõ mục đích và có quyền chủ động tick chọn đồng ý (hoặc từ chối) khi đăng ký tài khoản.
                </div>
                <div className="p-3 rounded-xl bg-bg-tertiary border border-border-theme">
                  <span className="font-bold text-text-primary block mb-1">✓ Quyền chỉnh sửa thông tin</span>
                  Dễ dàng cập nhật tên hiển thị, mật khẩu và tùy biến nhân vật trong trang Hồ Sơ Cá Nhân.
                </div>
                <div className="p-3 rounded-xl bg-bg-tertiary border border-border-theme">
                  <span className="font-bold text-text-primary block mb-1">✓ Quyền xóa dữ liệu (Right to be Forgotten)</span>
                  Có quyền yêu cầu xóa vĩnh viễn tài khoản, điểm số và mọi dữ liệu liên quan khỏi hệ thống bất kỳ lúc nào.
                </div>
                <div className="p-3 rounded-xl bg-bg-tertiary border border-border-theme">
                  <span className="font-bold text-text-primary block mb-1">✓ Quyền khiếu nại & phản ánh</span>
                  Gửi yêu cầu trực tiếp đến Ban Quản trị thông qua trang Hòm Thư Liên Hệ trên website.
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="p-6 rounded-3xl bg-bg-secondary border border-border-theme space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-accent-pink/15 text-accent-pink flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h2 className="text-base font-bold text-text-primary">
                Quy Định Về Trò Chơi Học Tập, Đấu Trường 1v1 & Vật Phẩm Ảo
              </h2>
            </div>
            <div className="text-xs text-text-secondary space-y-2.5 leading-relaxed pl-11">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ <strong>Tuyên bố Miễn trừ Thương mại & Quy đổi:</strong>
              </div>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>Các tính năng <strong>Đấu trường 1v1 PvP</strong>, <strong>Bảng xếp hạng ELO</strong>, <strong>Vòng quay Gacha tri thức</strong> và <strong>Avatar Voxel 3D</strong> được xây dựng thuần túy nhằm tạo động lực thi đua học tập kiến thức STEM cho học sinh.</li>
                <li><strong className="text-text-primary">Không có giá trị tiền tệ:</strong> Điểm số, hệ số ELO, EXP, huy hiệu danh hiệu và các trang phục avatar trong STEM HUB <strong>hoàn toàn không có giá trị quy đổi thành tiền mặt</strong>, thẻ cào điện thoại hoặc bất kỳ hiện vật nào ngoài đời thực.</li>
                <li>Nền tảng nghiêm cấm mọi hành vi mua bán tài khoản, giao dịch điểm ảo hoặc gian lận thi đấu bằng phần mềm can thiệp trái phép.</li>
              </ul>
            </div>
          </div>

          {/* Section 5 */}
          <div className="p-6 rounded-3xl bg-bg-secondary border border-border-theme space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-accent-pink/15 text-accent-pink flex items-center justify-center font-bold text-sm">
                5
              </div>
              <h2 className="text-base font-bold text-text-primary">
                Minh Bạch & Tiêu Chuẩn Trách Nhiệm Của Trợ Lý AI
              </h2>
            </div>
            <div className="text-xs text-text-secondary space-y-2.5 leading-relaxed pl-11">
              <p>
                Nguyên tắc nhận diện và minh bạch hệ thống Trí tuệ Nhân tạo đối thoại:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li><strong className="text-text-primary">Nhãn nhận diện AI rõ ràng:</strong> Trợ lý học tập <strong>NOVA HUD</strong> được gắn nhãn định danh AI công khai trên giao diện để học sinh phân biệt rõ ràng giữa AI và người hỗ trợ thật.</li>
                <li><strong className="text-text-primary">Công nghệ ứng dụng:</strong> Hệ thống kết hợp mô hình ngôn ngữ lớn Google Gemini 2.5 Flash, cơ sở tri thức RAG (Retrieval-Augmented Generation) chuẩn sách giáo khoa THPT GDPT 2018 và bộ phân loại intent nội bộ.</li>
                <li><strong className="text-text-primary">Quy chuẩn An toàn (Responsible AI Guardrails):</strong> Trợ lý AI từ chối giải quyết các yêu cầu gian lận thi cử, bạo lực, chất gây cháy nổ nguy hiểm hoặc sai lệch thuần phong mỹ tục. Khi giải đáp kiến thức thí nghiệm hóa học có hóa chất nguy hiểm, AI luôn kèm theo cảnh báo an toàn bắt buộc.</li>
                <li><strong className="text-text-primary">Bảo vệ tính riêng tư trong Prompt:</strong> Dữ liệu câu hỏi được tự động ẩn danh hóa trước khi gửi qua API và không được sử dụng để huấn luyện mô hình bên ngoài.</li>
              </ul>
            </div>
          </div>

          {/* Section 6 */}
          <div className="p-6 rounded-3xl bg-bg-secondary border border-border-theme space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-accent-pink/15 text-accent-pink flex items-center justify-center font-bold text-sm">
                6
              </div>
              <h2 className="text-base font-bold text-text-primary">
                Đơn Vị Chịu Trách Nhiệm & Đầu Mối Liên Hệ
              </h2>
            </div>
            <div className="text-xs text-text-secondary space-y-2 leading-relaxed pl-11">
              <p><strong className="text-text-primary">Đơn vị triển khai:</strong> Dự án Nghiên cứu Hệ thống Học tập Số STEM HUB</p>
              <p><strong className="text-text-primary">Cơ quan bảo trợ chuyên môn:</strong> Trường THPT Quỳnh Lưu 4, Tỉnh Nghệ An</p>
              <p><strong className="text-text-primary">Mục đích:</strong> Tham gia Cuộc thi Trí Tuệ Nhân Tạo (AI) do Ban Bí thư Trung ương Đoàn phát động</p>
              <p><strong className="text-text-primary">Kênh tiếp nhận hỗ trợ & giải quyết khiếu nại dữ liệu:</strong></p>
              <div className="pt-2">
                <Link
                  href="/lien-he"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-pink hover:bg-accent-pink/90 text-white font-bold text-xs transition-all shadow-md shadow-accent-pink/20 active:scale-95 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Gửi Yêu Cầu Tại Hòm Thư Liên Hệ</span>
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Back Button */}
        <div className="pt-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-bg-secondary hover:bg-bg-tertiary border border-border-theme text-xs font-bold text-text-primary transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-accent-pink" />
            <span>Quay lại Trang Chủ</span>
          </Link>
        </div>

      </div>
    </div>
  );
}


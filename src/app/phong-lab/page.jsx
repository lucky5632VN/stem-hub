import LabOverviewClient from './LabOverviewClient';

export const metadata = {
  title: 'Danh Mục Phòng Thí Nghiệm Ảo STEM | STEM Hub',
  description: 'Hệ thống phòng thí nghiệm lượng tử tương tác: Toán, Lý, Hóa, Sinh.',
};

export default function PhongLabOverviewPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-pink-500 animate-pulse" />
          Danh Mục Phòng Thí Nghiệm Ảo STEM
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Chọn không gian thí nghiệm để bắt đầu bài thực hành tương tác trực tuyến
        </p>
      </div>

      <LabOverviewClient />
    </div>
  );
}

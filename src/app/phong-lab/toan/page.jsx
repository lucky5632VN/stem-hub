import VirtualLabSandbox from '@/components/organisms/VirtualLabSandbox';

export const metadata = {
  title: 'Phòng Thí Nghiệm Hình Học Không Gian 3D | STEM Hub',
  description: 'Khám phá hình học không gian 3D trực quan bằng công cụ giải toán thông minh.',
};

export default function MathLabPage() {
  return (
    <VirtualLabSandbox
      subject="toan"
      title="Phòng Thí Nghiệm Hình Học Không Gian 3D"
      code="MATH-3D"
      labUrl="/labs/toan/frontend/dist/index.html"
      desc="Khám phá hình học không gian 3D trực quan bằng công cụ giải toán thông minh."
      badgeColor="from-cyan-500 to-blue-600"
    />
  );
}

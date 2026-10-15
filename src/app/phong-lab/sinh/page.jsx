import VirtualLabSandbox from '@/components/organisms/VirtualLabSandbox';

export const metadata = {
  title: 'Phòng Thí Nghiệm Sinh Học Di Truyền | STEM Hub',
  description: 'Giải mã bản đồ gene di truyền, trắc nghiệm sinh học chuẩn THPT Quốc gia.',
};

export default function BiologyLabPage() {
  return (
    <VirtualLabSandbox
      subject="sinh"
      title="Phòng Thí Nghiệm Sinh Học Di Truyền"
      code="BIO-GENE"
      labUrl="/labs/lab_sinh/dist/index.html?v=4.0.6"
      desc="Giải mã bản đồ gene di truyền, trắc nghiệm sinh học chuẩn THPT Quốc gia."
      badgeColor="from-emerald-500 to-teal-600"
    />
  );
}

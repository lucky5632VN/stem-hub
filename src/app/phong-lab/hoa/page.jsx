import VirtualLabSandbox from '@/components/organisms/VirtualLabSandbox';

export const metadata = {
  title: 'Phòng Thí Nghiệm Hóa Học Ảo | STEM Hub',
  description: 'Thiết lập phản ứng axit-bazơ ảo, theo dõi nồng độ pH thời gian thực.',
};

export default function ChemistryLabPage() {
  return (
    <VirtualLabSandbox
      subject="hoa"
      title="Phòng Thí Nghiệm Hóa Học Ảo"
      code="CHEM-V4"
      labUrl="/labs/lab-ktra15p/dist/index.html?v=4.1.5"
      desc="Thiết lập phản ứng axit-bazơ ảo, theo dõi nồng độ pH thời gian thực."
      badgeColor="from-amber-500 to-emerald-600"
    />
  );
}

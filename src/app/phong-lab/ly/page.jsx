import VirtualLabSandbox from '@/components/organisms/VirtualLabSandbox';

export const metadata = {
  title: 'Phòng Thí Nghiệm Vật Lý Lượng Tử | STEM Hub',
  description: 'Mô phỏng dao động điều hòa, giao thoa sóng cơ, đặc tuyến linh kiện và lắp ráp mạch điện DC tương tác.',
};

export default function PhysicsLabPage() {
  return (
    <VirtualLabSandbox
      subject="ly"
      title="Phòng Thí Nghiệm Vật Lý Lượng Tử"
      code="PHYS-V3"
      labUrl="/labs/PhysicsLab/index.html"
      desc="Mô phỏng dao động điều hòa, giao thoa sóng cơ, đặc tuyến linh kiện và lắp ráp mạch điện DC tương tác."
      badgeColor="from-purple-600 to-indigo-600"
    />
  );
}

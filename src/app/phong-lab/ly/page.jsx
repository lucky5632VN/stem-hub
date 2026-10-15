import VirtualLabSandbox from '@/components/organisms/VirtualLabSandbox';

export const metadata = {
  title: 'Phòng Thí Nghiệm Vật Lý: Mạch Điện DC 3D | STEM Hub',
  description: 'Mô phỏng lắp ráp mạch điện DC 3D tương tác, đo lường điện áp, dòng điện và đặc tuyến linh kiện điện tử.',
};

export default function PhysicsLabPage() {
  return (
    <VirtualLabSandbox
      subject="ly"
      title="Phòng Thí Nghiệm Vật Lý: Mạch Điện DC 3D"
      code="PHYS-V3"
      labUrl="/labs/PhysicsLab/index.html"
      desc="Mô phỏng lắp ráp mạch điện DC 3D tương tác, đo lường điện áp, dòng điện và đặc tuyến linh kiện điện tử."
      badgeColor="from-purple-600 to-indigo-600"
    />
  );
}

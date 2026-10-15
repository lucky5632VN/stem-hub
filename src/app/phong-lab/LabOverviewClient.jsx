'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { playSound } from '@/lib/sound';
import { Calculator, Zap, FlaskConical, Dna, ArrowRight } from 'lucide-react';

const labList = [
  {
    id: 'math',
    name: 'Toán học 3D',
    title: 'Lab Toán',
    href: '/phong-lab/toan',
    link: '/labs/toan/frontend/dist/index.html',
    code: 'MATH-3D',
    desc: 'Khám phá hình học không gian 3D trực quan bằng công cụ giải toán thông minh.',
    icon: Calculator,
    gradient: 'from-cyan-500 to-blue-600',
    border: 'border-cyan-500/30 hover:border-cyan-500/60'
  },
  {
    id: 'phys',
    name: 'Vật lý Lượng tử',
    title: 'Lab Lý',
    href: '/phong-lab/ly',
    link: '/labs/PhysicsLab/index.html',
    code: 'PHYS-V3',
    desc: 'Mô phỏng dao động điều hòa, giao thoa sóng cơ và lắp ráp mạch điện DC tương tác.',
    icon: Zap,
    gradient: 'from-purple-600 to-indigo-600',
    border: 'border-purple-500/30 hover:border-purple-500/60'
  },
  {
    id: 'chem',
    name: 'Hóa học Ảo',
    title: 'Lab Hóa',
    href: '/phong-lab/hoa',
    link: '/labs/lab-ktra15p/dist/index.html?v=4.1.5',
    code: 'CHEM-V4',
    desc: 'Thiết lập chuỗi phản ứng axit-bazơ ảo, theo dõi nồng độ pH thời gian thực.',
    icon: FlaskConical,
    gradient: 'from-amber-500 to-emerald-600',
    border: 'border-amber-500/30 hover:border-amber-500/60'
  },
  {
    id: 'bio',
    name: 'Sinh học Di truyền',
    title: 'Lab Sinh',
    href: '/phong-lab/sinh',
    link: '/labs/lab_sinh/dist/index.html?v=4.0.6',
    code: 'BIO-GENE',
    desc: 'Giải mã bản đồ gene di truyền, trắc nghiệm sinh học chuẩn THPT Quốc gia.',
    icon: Dna,
    gradient: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-500/30 hover:border-emerald-500/60'
  }
];

export default function LabOverviewClient() {
  const router = useRouter();

  const handleLaunch = (lab) => {
    playSound.click?.();
    router.push(lab.href);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {labList.map((lab) => {
        const Icon = lab.icon;
        return (
          <Link
            key={lab.id}
            href={lab.href}
            onClick={() => handleLaunch(lab)}
            className={`p-6 rounded-2xl bg-slate-900/80 border ${lab.border} hover:bg-slate-800/80 transition-all duration-300 group flex flex-col justify-between shadow-xl cursor-pointer`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${lab.gradient} text-white shadow-lg`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-cyan-500/20">
                  {lab.code}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                {lab.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {lab.desc}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs font-bold text-cyan-400 pt-4 border-t border-slate-800">
              <span>Vào phòng thực hành</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

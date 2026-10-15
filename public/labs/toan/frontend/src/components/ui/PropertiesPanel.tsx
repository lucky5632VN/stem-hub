import React from 'react';
import { Info } from 'lucide-react';
import { useGeometryStore } from '../../store/useGeometryStore';

const PropertiesPanel: React.FC = () => {
  const { shapeData } = useGeometryStore();

  if (!shapeData) return null;

  // Map property keys to clear Vietnamese labels
  const labelMap: Record<string, string> = {
    // English keys
    volume: 'Thể tích (V)',
    surface_area: 'Diện tích toàn phần (Stp)',
    base_area: 'Diện tích đáy (Sđáy)',
    height: 'Chiều cao (h)',
    slant_height: 'Đường sinh (l)',
    radius: 'Bán kính (r)',
    base_size: 'Cạnh đáy (a)',
    side_length: 'Cạnh (a)',
    width: 'Chiều rộng (w)',
    depth: 'Chiều sâu (d)',

    // Vietnamese camelCase keys
    canhDay: 'Cạnh đáy',
    chieuDai: 'Chiều dài',
    chieuRong: 'Chiều rộng',
    chieuCao: 'Chiều cao',
    banKinh: 'Bán kính',
    dienTichDay: 'Diện tích đáy',
    dienTichXungQuanh: 'Diện tích xung quanh',
    dienTichToanPhan: 'Diện tích toàn phần',
    dienTichMatCau: 'Diện tích mặt cầu',
    theTich: 'Thể tích',
    trungDoan: 'Trung đoạn',
    canhBen: 'Cạnh bên',
    duongSinh: 'Đường sinh',
    duongCheo: 'Đường chéo',
    canhSA: 'Cạnh SA',
    canhSB: 'Cạnh SB',
    canhSC: 'Cạnh SC',
    canhSD: 'Cạnh SD',
    chuViDay: 'Chu vi đáy',
    donVi: 'Đơn vị',
  };

  const formatKey = (key: string): string => {
    if (labelMap[key]) return labelMap[key];
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const rawData: Record<string, any> = shapeData.properties || (shapeData as any).calculations || {};
  const donVi = typeof rawData.donVi === 'string' && rawData.donVi.trim() ? rawData.donVi.trim() : 'cm';

  const formatValue = (key: string, value: any): string => {
    if (key === 'donVi') return String(value);
    if (typeof value === 'number') {
      const formattedNum = Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/\.?0+$/, '');
      const lower = key.toLowerCase();
      if (lower.includes('thetich') || key === 'volume') {
        return `${formattedNum} ${donVi}³`;
      }
      if (lower.includes('dientich') || key.includes('area')) {
        return `${formattedNum} ${donVi}²`;
      }
      if (
        lower.includes('canh') || lower.includes('chieu') || lower.includes('chuvi') ||
        lower.includes('bankinh') || lower.includes('trungdoan') || lower.includes('duongsinh') ||
        lower.includes('duongcheo') || key === 'height' || key === 'radius'
      ) {
        return `${formattedNum} ${donVi}`;
      }
      return formattedNum;
    }
    return String(value);
  };

  const entries = Object.entries(rawData).filter(
    ([_, v]) => v !== undefined && v !== null && typeof v !== 'object'
  );

  return (
    <div className="glass" style={{ padding: '1rem', borderRadius: '8px' }}>
      <div className="panel-header" style={{ fontSize: '0.75rem', marginBottom: '0.8rem' }}>
        <Info size={14} />
        Tính Chất Hình Học
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {entries.map(([key, value]) => (
          <div key={key} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.55rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '0.68rem', color: '#8b949e', marginBottom: '3px' }}>{formatKey(key)}</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f0f6fc' }}>{formatValue(key, value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertiesPanel;

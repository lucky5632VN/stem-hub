'use client';

import React from 'react';

// Định nghĩa màu sắc mở rộng cho các thuộc tính
export const skinColors = {
  peach: '#ffd1b3',
  tan: '#d2a679',
  chocolate: '#664422',
  neon_blue: '#00f2fe',
  cosmic_purple: '#8a2be2',
  emerald_alien: '#10b981',
  cyborg_silver: '#94a3b8',
  sunfire_gold: '#f59e0b',
  ghostly_white: '#f8fafc',
  vampire_pale: '#f5f5f4'
};

export const hairColors = {
  black: '#1a1a1a',
  blonde: '#ffd700',
  neon_pink: '#ff007f',
  cyan: '#00ffff',
  fire_orange: '#f97316',
  toxic_green: '#22c55e',
  cosmic_purple: '#a855f7',
  silver_gray: '#cbd5e1',
  pure_white: '#ffffff',
  sky_blue: '#3b82f6'
};

function STEMAvatarSVG({ parts = {}, className = "w-full h-full" }) {
  const gender = parts.gender || 'male'; // 'male' | 'female'
  const bodyType = parts.bodyType || 'chibi'; // 'chibi' | 'tall' | 'muscular'
  const pose = parts.pose || 'standard'; // 'standard' | 'wave' | 'thinker' | 'victory'

  const body = parts.body || 'peach';
  const hair = parts.hair || 'default';
  const hairColor = parts.hairColor || 'black';
  const top = parts.top || 'default';
  const bottom = parts.bottom || 'default';
  const accessory = parts.accessory || 'none';

  // Lấy màu da thực tế
  const skin = skinColors[body] || skinColors.peach;
  // Lấy màu tóc thực tế
  const hColor = hairColors[hairColor] || hairColors.black;

  // Cấu hình tỉ lệ cơ thể động dựa trên bodyType
  let bodyYOffset = 0;   // Kéo dài phần thân dưới
  let scaleYBody = 1.0;  // Tỉ lệ chiều cao thân
  let scaleXBody = 1.0;  // Tỉ lệ chiều rộng vai
  let headScale = 1.0;   // Tỉ lệ đầu so với thân

  if (bodyType === 'tall') {
    bodyYOffset = -2;
    scaleYBody = 1.25;  // Thon cao hơn
    scaleXBody = 0.95;  // Mảnh khảnh hơn
    headScale = 0.9;    // Đầu tương đối nhỏ hơn cơ thể cao
  } else if (bodyType === 'muscular') {
    scaleXBody = 1.25;  // Vai rộng, vạm vỡ
    scaleYBody = 1.05;
    headScale = 0.95;
  }

  // Lấy màu của trang phục để dùng cho vẽ tay áo tương thích tư thế
  const getTopColor = () => {
    switch (top) {
      case 'lab_coat': return '#f8fafc';
      case 'astronaut_suit': return '#e2e8f0';
      case 'mech_armor': return '#1e293b';
      case 'cyber_hoodie': return '#111827';
      case 'steampunk_vest': return '#78350f';
      case 'royal_cape': return '#dc2626';
      case 'bio_hazard': return '#eab308';
      case 'ninja_suit': return '#18181b';
      case 'quantum_dress': return '#ec4899';
      default: return gender === 'female' ? '#ec4899' : '#0ea5e9'; // Nữ mặc định hồng, Nam mặc định xanh dương
    }
  };

  const topColor = getTopColor();

  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} select-none`}
    >
      {/* Background radial gradient soft glow */}
      <defs>
        <radialGradient id="avatarGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
        </radialGradient>
        <style>{`
          #legs_section g, #arms_section g {
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
        `}</style>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#avatarGlow)" />

      {/* Nhóm áp dụng tỉ lệ cơ thể và tư thế */}
      <g id="avatar_core_group">
        

        {/* ================== 1. BOTTOM (QUẦN & CHÂN) ================== */}
        <g id="legs_section" transform={`translate(0, ${bodyYOffset}) scale(${scaleXBody}, ${scaleYBody})`} style={{ transformOrigin: '50% 78%' }}>
          {bottom === 'default' && (
            gender === 'female' ? (
              // Chân váy mặc định nữ: Chân váy chữ A tím hồng nhẹ nhàng
              <g id="bottom_default_female">
                <path d="M38 78 L34 86 H66 L62 78 Z" fill="#ec4899" />
                <g transform={pose === 'walk' ? 'rotate(10, 45, 86)' : ''}>
                  <rect x="43" y="86" width="4" height="6" fill={skin} />
                  <ellipse cx="45" cy="93" rx="4.2" ry="1.8" fill="#f43f5e" />
                </g>
                <g transform={pose === 'walk' ? 'rotate(-10, 55, 86)' : ''}>
                  <rect x="53" y="86" width="4" height="6" fill={skin} />
                  <ellipse cx="55" cy="93" rx="4.2" ry="1.8" fill="#f43f5e" />
                </g>
              </g>
            ) : (
              // Quần Jeans xanh cơ bản mặc định Nam
              <g id="bottom_default_male">
                <g transform={pose === 'walk' ? 'rotate(8, 45, 78)' : ''}>
                  <rect x="41.5" y="78" width="7.5" height="15" rx="1.5" fill="#2563eb" />
                  <ellipse cx="45.25" cy="94" rx="4.5" ry="2" fill="#475569" />
                </g>
                <g transform={pose === 'walk' ? 'rotate(-8, 55, 78)' : ''}>
                  <rect x="51" y="78" width="7.5" height="15" rx="1.5" fill="#2563eb" />
                  <ellipse cx="54.75" cy="94" rx="4.5" ry="2" fill="#475569" />
                </g>
              </g>
            )
          )}

          {bottom === 'space_shorts' && (
            // Quần đùi vũ trụ
            <g id="bottom_space_space_shorts">
              <g transform={pose === 'walk' ? 'rotate(8, 45, 78)' : ''}>
                <rect x="41" y="78" width="8" height="10" rx="1" fill="#cbd5e1" />
                <rect x="43" y="88" width="4" height="4" fill={skin} />
                <ellipse cx="45" cy="93.5" rx="5" ry="2.5" fill="#f87171" />
                <ellipse cx="45" cy="92.5" rx="4" ry="2" fill="#ffffff" />
              </g>
              <g transform={pose === 'walk' ? 'rotate(-8, 55, 78)' : ''}>
                <rect x="51" y="78" width="8" height="10" rx="1" fill="#cbd5e1" />
                <rect x="53" y="88" width="4" height="4" fill={skin} />
                <ellipse cx="55" cy="93.5" rx="5" ry="2.5" fill="#f87171" />
                <ellipse cx="55" cy="92.5" rx="4" ry="2" fill="#ffffff" />
              </g>
            </g>
          )}

          {bottom === 'robotic_legs' && (
            // Chân robot Cyberpunk
            <g id="bottom_robotic_legs">
              <g transform={pose === 'walk' ? 'rotate(8, 45, 78)' : ''}>
                <rect x="43" y="78" width="5" height="13" fill="#64748b" />
                <circle cx="45.5" cy="85" r="2" fill="#22d3ee" className="animate-pulse" />
                <path d="M41 91 H48 V94 H41 Z" fill="#475569" />
              </g>
              <g transform={pose === 'walk' ? 'rotate(-8, 55, 78)' : ''}>
                <rect x="52" y="78" width="5" height="13" fill="#64748b" />
                <circle cx="54.5" cy="85" r="2" fill="#22d3ee" className="animate-pulse" />
                <path d="M52 91 H59 V94 H52 Z" fill="#475569" />
              </g>
            </g>
          )}

          {bottom === 'cyber_skirt' && (
            // Váy Cyberpunk phát sáng
            <g id="bottom_cyber_skirt">
              <path d="M38 78 L34 88 H66 L62 78 Z" fill="#111827" stroke="#00f2fe" strokeWidth="1.5" />
              <line x1="39" y1="84" x2="61" y2="84" stroke="#00f2fe" strokeWidth="1" strokeDasharray="2,2" />
              <g transform={pose === 'walk' ? 'rotate(10, 45, 88)' : ''}>
                <rect x="43" y="88" width="4" height="4" fill={skin} />
                <ellipse cx="45" cy="93" rx="4.5" ry="2" fill="#111827" stroke="#00f2fe" strokeWidth="0.8" />
              </g>
              <g transform={pose === 'walk' ? 'rotate(-10, 55, 88)' : ''}>
                <rect x="53" y="88" width="4" height="4" fill={skin} />
                <ellipse cx="55" cy="93" rx="4.5" ry="2" fill="#111827" stroke="#00f2fe" strokeWidth="0.8" />
              </g>
            </g>
          )}

          {bottom === 'steampunk_pants' && (
            // Quần Steampunk ống côn cổ điển
            <g id="bottom_steampunk_pants">
              <rect x="41" y="78" width="18" height="2" fill="#451a03" />
              <g transform={pose === 'walk' ? 'rotate(8, 45, 78)' : ''}>
                <rect x="41.5" y="78" width="7.5" height="15" fill="#78350f" />
                <path d="M40 92.5 C40 91.5, 47 91.5, 47 92.5 L47 94.5 H40 Z" fill="#451a03" />
              </g>
              <g transform={pose === 'walk' ? 'rotate(-8, 55, 78)' : ''}>
                <rect x="51" y="78" width="7.5" height="15" fill="#78350f" />
                <path d="M53 92.5 C53 91.5, 60 91.5, 60 92.5 L60 94.5 H53 Z" fill="#451a03" />
              </g>
            </g>
          )}

          {bottom === 'ninja_pants' && (
            // Quần Ninja đen tối
            <g id="bottom_ninja_pants">
              <g transform={pose === 'walk' ? 'rotate(8, 45, 78)' : ''}>
                <rect x="41.5" y="78" width="7.5" height="15" fill="#18181b" />
                <rect x="41.5" y="86" width="7.5" height="4" fill="#fafafa" />
                <ellipse cx="45" cy="93.5" rx="4.5" ry="1.5" fill="#18181b" />
              </g>
              <g transform={pose === 'walk' ? 'rotate(-8, 55, 78)' : ''}>
                <rect x="51" y="78" width="7.5" height="15" fill="#18181b" />
                <rect x="51" y="86" width="7.5" height="4" fill="#fafafa" />
                <ellipse cx="55" cy="93.5" rx="4.5" ry="1.5" fill="#18181b" />
              </g>
            </g>
          )}

          {bottom === 'lightweight_joggers' && (
            // Quần Jogger thể thao năng động
            <g id="bottom_joggers">
              <g transform={pose === 'walk' ? 'rotate(8, 45, 78)' : ''}>
                <rect x="41" y="78" width="8" height="14" rx="2" fill="#4b5563" />
                <line x1="42" y1="79" x2="42" y2="91" stroke="#ffffff" strokeWidth="1" />
                <ellipse cx="45" cy="93.5" rx="4.8" ry="2.2" fill="#06b6d4" />
              </g>
              <g transform={pose === 'walk' ? 'rotate(-8, 55, 78)' : ''}>
                <rect x="51" y="78" width="8" height="14" rx="2" fill="#4b5563" />
                <line x1="58" y1="79" x2="58" y2="91" stroke="#ffffff" strokeWidth="1" />
                <ellipse cx="55" cy="93.5" rx="4.8" ry="2.2" fill="#06b6d4" />
              </g>
            </g>
          )}

          {bottom === 'tennis_skirt' && (
            // Chân váy tennis xếp ly năng động cho nữ
            <g id="bottom_tennis_skirt">
              <path d="M38 78 L34 87 H66 L62 78 Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="43" y1="78" x2="41" y2="87" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="48" y1="78" x2="47" y2="87" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="53" y1="78" x2="53" y2="87" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="58" y1="78" x2="59" y2="87" stroke="#cbd5e1" strokeWidth="1" />
              <g transform={pose === 'walk' ? 'rotate(10, 45, 87)' : ''}>
                <rect x="43" y="87" width="4" height="5" fill={skin} />
                <ellipse cx="45" cy="93" rx="4.5" ry="1.8" fill="#ec4899" />
              </g>
              <g transform={pose === 'walk' ? 'rotate(-10, 55, 87)' : ''}>
                <rect x="53" y="87" width="4" height="5" fill={skin} />
                <ellipse cx="55" cy="93" rx="4.5" ry="1.8" fill="#ec4899" />
              </g>
            </g>
          )}
        </g>

        {/* ================== 2. BODY (CỔ & ĐẦU & NÉT MẶT) ================== */}
        <g id="head_section" transform={`scale(${headScale})`} style={{ transformOrigin: '50% 45px' }}>
          {/* Cổ */}
          <rect x="46" y="58" width="8" height="8" rx="1" fill={skin} />
          
          {/* Đầu */}
          <rect x="33" y="32" width="34" height="30" rx="12" fill={skin} />
          
          {/* Tai trái & Tai phải */}
          <circle cx="31.5" cy="47" r="4.5" fill={skin} />
          <circle cx="68.5" cy="47" r="4.5" fill={skin} />
          
          {/* Má hồng hào dễ thương */}
          <circle cx="38" cy="51" r="2.5" fill="#f43f5e" opacity="0.35" />
          <circle cx="62" cy="51" r="2.5" fill="#f43f5e" opacity="0.35" />
          
          {/* Mắt thông minh dựa trên Giới tính */}
          {gender === 'female' ? (
            // Mắt nữ: Có mi dài rực rỡ và lấp lánh hơn
            <g id="female_eyes">
              {/* Lông mi trái */}
              <path d="M40 43 L37 42" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M41 42.5 L39 40.5" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="43" cy="45" r="3.2" fill="#0f172a" />
              
              {/* Lông mi phải */}
              <path d="M60 43 L63 42" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M59 42.5 L61 40.5" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="57" cy="45" r="3.2" fill="#0f172a" />
              
              {/* Ánh sáng lung linh trong mắt */}
              <circle cx="43.8" cy="44.2" r="1.0" fill="#ffffff" />
              <circle cx="42.2" cy="46.2" r="0.5" fill="#ffffff" />
              <circle cx="57.8" cy="44.2" r="1.0" fill="#ffffff" />
              <circle cx="56.2" cy="46.2" r="0.5" fill="#ffffff" />
            </g>
          ) : (
            // Mắt nam: Đơn giản, tinh anh
            <g id="male_eyes">
              <circle cx="43" cy="45" r="2.5" fill="#0f172a" />
              <circle cx="57" cy="45" r="2.5" fill="#0f172a" />
              <circle cx="43.8" cy="44.2" r="0.8" fill="#ffffff" />
              <circle cx="57.8" cy="44.2" r="0.8" fill="#ffffff" />
            </g>
          )}

          {/* Nụ cười vui tươi */}
          <path d="M47 50.5 Q50 53.5 53 50.5" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* ================== 3. TOP (ÁO & TAY ÁO BÊN TRONG CƠ THỂ) ================== */}
        <g id="torso_section" transform={`translate(0, ${bodyYOffset}) scale(${scaleXBody}, ${scaleYBody})`} style={{ transformOrigin: '50% 64px' }}>
          
          {/* VẼ PHẦN THÂN ÁO (Chung cho các loại áo) */}
          {top === 'default' && (
            <path d="M35 64 C35 60, 65 60, 65 64 L62 82 H38 Z" fill={topColor} />
          )}

          {top === 'lab_coat' && (
            <g id="body_lab_coat">
              <path d="M35 64 C35 60, 65 60, 65 64 L62 82 H38 Z" fill="#475569" />
              <path d="M35 64 C35 60, 48 60, 48 68 L46 82 H38 Z" fill="#f8fafc" />
              <path d="M65 64 C65 60, 52 60, 52 68 L54 82 H62 Z" fill="#f8fafc" />
              <path d="M35 64 L44 68" stroke="#10b981" strokeWidth="2" />
              <path d="M65 64 L56 68" stroke="#10b981" strokeWidth="2" />
              <path d="M49.5 64 L50.5 64 L51 72 L50 75 L49 72 Z" fill="#ef4444" />
            </g>
          )}

          {top === 'astronaut_suit' && (
            <g id="body_astronaut">
              <path d="M34 64 C34 58, 66 58, 66 64 L62 82 H38 Z" fill="#e2e8f0" />
              <rect x="36" y="62" width="28" height="3" rx="1.5" fill="#f1f5f9" />
              <circle cx="50" cy="70" r="3.5" fill="#2563eb" />
              <rect x="47" y="75" width="6" height="1.5" fill="#f87171" />
            </g>
          )}

          {top === 'mech_armor' && (
            <g id="body_mech">
              <path d="M33 63 C33 56, 67 56, 67 63 L63 82 H37 Z" fill="#1e293b" />
              <path d="M37 60 L50 66 L63 60 L61 68 L50 72 L39 68 Z" fill="#eab308" />
              <path d="M50 67 L53 72 H47 Z" fill="#22d3ee" className="animate-pulse" />
            </g>
          )}

          {top === 'cyber_hoodie' && (
            <g id="body_cyber_hoodie">
              <path d="M34 64 C34 59, 66 59, 66 64 L62 82 H38 Z" fill="#111827" />
              {/* Dây khóa phát sáng neon xanh lá */}
              <line x1="50" y1="64" x2="50" y2="80" stroke="#10b981" strokeWidth="1.5" className="animate-pulse" />
              {/* Mũ trùm buông phía sau cổ */}
              <path d="M34 64 Q50 56 66 64 C66 64 50 67 34 64 Z" fill="#1f2937" />
            </g>
          )}

          {top === 'steampunk_vest' && (
            <g id="body_steampunk_vest">
              <path d="M35 64 C35 60, 65 60, 65 64 L62 82 H38 Z" fill="#cbd5e1" /> {/* Sơ mi trắng bên trong */}
              <path d="M36 64 L46 64 L50 75 L38 82 Z" fill="#78350f" /> {/* Gile trái */}
              <path d="M64 64 L54 64 L50 75 L62 82 Z" fill="#78350f" /> {/* Gile phải */}
              <circle cx="48" cy="70" r="1" fill="#fbbf24" />
              <circle cx="52" cy="70" r="1" fill="#fbbf24" />
              <circle cx="48" cy="75" r="1" fill="#fbbf24" />
              <circle cx="52" cy="75" r="1" fill="#fbbf24" />
              {/* Nơ đỏ Steampunk cổ điển */}
              <path d="M48 64 L52 64 L50 66 Z" fill="#b91c1c" />
              <circle cx="50" cy="64" r="1.5" fill="#ef4444" />
            </g>
          )}

          {top === 'royal_cape' && (
            <g id="body_royal_cape">
              {/* Áo giáp trong vàng hoàng gia */}
              <path d="M35 64 C35 60, 65 60, 65 64 L62 82 H38 Z" fill="#eab308" stroke="#ffffff" strokeWidth="0.8" />
              {/* Choàng vai đỏ */}
              <path d="M33 62 L39 62 L50 69 L61 62 L67 62 L65 82 H35 Z" fill="#dc2626" opacity="0.9" />
              {/* Huy hiệu ngực vàng */}
              <polygon points="50,65 53,69 50,73 47,69" fill="#fef08a" />
            </g>
          )}

          {top === 'bio_hazard' && (
            <g id="body_bio_hazard">
              {/* Đồ chống độc màu vàng sáng */}
              <path d="M34 64 C34 59, 66 59, 66 64 L62 82 H38 Z" fill="#eab308" />
              {/* Khóa kéo bảo hộ đen */}
              <line x1="50" y1="62" x2="50" y2="82" stroke="#1c1917" strokeWidth="2" />
              {/* Biểu tượng phóng xạ tròn ngực */}
              <circle cx="50" cy="72" r="3" fill="#1c1917" />
              <circle cx="50" cy="72" r="1" fill="#eab308" />
            </g>
          )}

          {top === 'ninja_suit' && (
            <g id="body_ninja_suit">
              <path d="M34 64 C34 59, 66 59, 66 64 L62 82 H38 Z" fill="#18181b" />
              {/* Đai thắt lưng vải đỏ */}
              <rect x="37" y="75" width="26" height="3" fill="#dc2626" />
              {/* Hai đường quấn chéo ngực */}
              <line x1="37" y1="64" x2="63" y2="75" stroke="#27272a" strokeWidth="1.5" />
              <line x1="63" y1="64" x2="37" y2="75" stroke="#27272a" strokeWidth="1.5" />
            </g>
          )}

          {top === 'quantum_dress' && (
            // Đầm dạ hội trễ vai lấp lánh quý phái cho nữ
            <g id="body_quantum_dress">
              <path d="M35 66 C38 64, 62 64, 65 66 L62 82 H38 Z" fill="#ec4899" />
              <path d="M33 66 C42 63, 58 63, 67 66" stroke="#ffffff" strokeWidth="1.5" fill="none" className="animate-pulse" />
              <circle cx="50" cy="68" r="1.5" fill="#ffffff" />
            </g>
          )}

        </g>

        {/* ================== 4. TAY & TẠO DÁNG (HANDS & POSE) ================== */}
        <g id="arms_section" transform={`translate(0, ${bodyYOffset}) scale(${scaleXBody}, ${scaleYBody})`} style={{ transformOrigin: '50% 64px' }}>
          
          {/* TƯ THẾ: TIÊU CHUẨN (Standard - Tay buông thõng) */}
          {pose === 'standard' && (
            <g id="pose_standard">
              {/* Tay trái */}
              <g id="arm_left_std">
                {/* Bắp tay & Cánh tay phồng cơ bắp nhẹ */}
                <path d="M35 64 C33 63, 29 67, 27.5 73.5 C29.5 75.5, 33 75.5, 35 73.5 C36.5 68, 36.5 64, 36.5 64 Z" fill={topColor} />
                {/* Highlight phồng cơ bắp */}
                <path d="M32 68 C31 70, 31 71, 31.5 72" stroke="#ffffff" strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.3" />
                {/* Bo cổ tay áo */}
                <path d="M28.2 71.5 L33.2 71.5" stroke="#000000" strokeWidth="0.8" opacity="0.2" />
                {/* Bàn tay tròn trịa có ngón cái */}
                <circle cx="30" cy="76" r="2.8" fill={skin} />
                <circle cx="32.2" cy="74.5" r="1.2" fill={skin} />
              </g>
              {/* Tay phải */}
              <g id="arm_right_std">
                {/* Bắp tay & Cánh tay phồng cơ bắp nhẹ */}
                <path d="M65 64 C67 63, 71 67, 72.5 73.5 C70.5 75.5, 67 75.5, 65 73.5 C63.5 68, 63.5 64, 63.5 64 Z" fill={topColor} />
                {/* Highlight phồng cơ bắp */}
                <path d="M68 68 C69 70, 69 71, 68.5 72" stroke="#ffffff" strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.3" />
                {/* Bo cổ tay áo */}
                <path d="M71.8 71.5 L66.8 71.5" stroke="#000000" strokeWidth="0.8" opacity="0.2" />
                {/* Bàn tay tròn trịa có ngón cái */}
                <circle cx="70" cy="76" r="2.8" fill={skin} />
                <circle cx="67.8" cy="74.5" r="1.2" fill={skin} />
              </g>
            </g>
          )}

          {/* TƯ THẾ: CHÀO LƯỢNG TỬ (Wave - Giơ tay trái chào) */}
          {pose === 'wave' && (
            <g id="pose_wave">
              {/* Tay trái giơ lên chào */}
              <g id="arm_left_wave">
                {/* Bắp tay đi chéo ra ngoài phồng nhẹ */}
                <path d="M35 64 C32 60, 24 53, 21.5 50.5 C23 48.5, 26 48.5, 27.5 50.5 C29.5 54, 36.5 64, 36.5 64 Z" fill={topColor} />
                {/* Cẳng tay giơ thẳng lên */}
                <path d="M21.5 50.5 L19.5 42 H24.5 L26 50 Z" fill={topColor} />
                {/* Bo cổ tay áo */}
                <line x1="20.2" y1="44" x2="23.8" y2="44" stroke="#000000" strokeWidth="0.8" opacity="0.2" />
                {/* Lòng bàn tay */}
                <circle cx="22" cy="38.5" r="2.8" fill={skin} />
                {/* 3 ngón tay bé vẫy chào */}
                <line x1="20" y1="36.5" x2="18.5" y2="32.5" stroke={skin} strokeWidth="1.2" strokeLinecap="round" />
                <line x1="22" y1="35.5" x2="22" y2="31" stroke={skin} strokeWidth="1.2" strokeLinecap="round" />
                <line x1="24" y1="36.5" x2="25.5" y2="32.5" stroke={skin} strokeWidth="1.2" strokeLinecap="round" />
                {/* Sóng phát ra */}
                <path d="M17 29 Q22 25 27 29" stroke="#00f2fe" strokeWidth="1" fill="none" className="animate-pulse" />
                <path d="M19 32 Q22 29 25 32" stroke="#00f2fe" strokeWidth="0.7" fill="none" className="animate-pulse" />
              </g>
              {/* Tay phải buông thõng tiêu chuẩn */}
              <g id="arm_right_wave">
                <path d="M65 64 C67 63, 71 67, 72.5 73.5 C70.5 75.5, 67 75.5, 65 73.5 C63.5 68, 63.5 64, 63.5 64 Z" fill={topColor} />
                <path d="M71.8 71.5 L66.8 71.5" stroke="#000000" strokeWidth="0.8" opacity="0.2" />
                <circle cx="70" cy="76" r="2.8" fill={skin} />
                <circle cx="67.8" cy="74.5" r="1.2" fill={skin} />
              </g>
            </g>
          )}

          {/* TƯ THẾ: TRÍ TUỆ SUY NGHĨ (Thinker - Tay chống cằm) */}
          {pose === 'thinker' && (
            <g id="pose_thinker">
              {/* Tay trái co chống cằm */}
              <g id="arm_left_thinker">
                {/* Cánh tay co gấp khúc chéo lên */}
                <path d="M35 64 L43 59 L40 68 Z" fill={topColor} />
                <path d="M43 59 L46.5 53 H42.5 L39.5 61 Z" fill={topColor} />
                {/* Bàn tay ôm cằm má */}
                <circle cx="44.5" cy="51.5" r="2.6" fill={skin} />
                {/* Ngón trỏ chạm nhẹ gò má */}
                <path d="M43.5 50.5 L42.5 46.5" stroke={skin} strokeWidth="1.2" strokeLinecap="round" fill="none" />
              </g>
              {/* Tay phải ôm ngang hông */}
              <g id="arm_right_thinker">
                <path d="M65 64 C65 64, 62 68, 56.5 68 C56.5 68, 55 65.5, 57 64 C60 62.5, 63.5 64, 63.5 64 Z" fill={topColor} />
                <circle cx="54.5" cy="66.5" r="2.5" fill={skin} />
              </g>
            </g>
          )}

          {/* TƯ THẾ: CHIẾN THẮNG KHOA HỌC (Victory - Hai tay giơ V) */}
          {pose === 'victory' && (
            <g id="pose_victory">
              {/* Tay trái */}
              <g id="arm_left_victory">
                {/* Bắp tay gồng chuột phồng to dũng mãnh */}
                <path d="M35 64 C30 63, 22.5 57, 23.5 53 C26 50.5, 30 54, 37.5 62 Z" fill={topColor} />
                <path d="M23.5 53 L21.5 42 H26.5 L28 51.5 Z" fill={topColor} />
                {/* Highlight chuột gồng */}
                <path d="M28.5 58 C26.5 57, 24.5 55, 23.8 53.5" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.4" />
                <circle cx="24" cy="38.5" r="2.8" fill={skin} />
                <line x1="22.5" y1="36" x2="20" y2="30.5" stroke={skin} strokeWidth="1.2" strokeLinecap="round" />
                <line x1="24.5" y1="35.5" x2="24.5" y2="29" stroke={skin} strokeWidth="1.2" strokeLinecap="round" />
              </g>
              {/* Tay phải */}
              <g id="arm_right_victory">
                {/* Bắp tay gồng chuột phồng to đối xứng */}
                <path d="M65 64 C70 63, 77.5 57, 76.5 53 C74 50.5, 70 54, 62.5 62 Z" fill={topColor} />
                <path d="M76.5 53 L78.5 42 H73.5 L72 51.5 Z" fill={topColor} />
                {/* Highlight chuột gồng */}
                <path d="M71.5 58 C73.5 57, 75.5 55, 76.2 53.5" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.4" />
                <circle cx="76" cy="38.5" r="2.8" fill={skin} />
                <line x1="77.5" y1="36" x2="80" y2="30.5" stroke={skin} strokeWidth="1.2" strokeLinecap="round" />
                <line x1="75.5" y1="35.5" x2="75.5" y2="29" stroke={skin} strokeWidth="1.2" strokeLinecap="round" />
              </g>
            </g>
          )}

          {/* TƯ THẾ: ĐI BỘ LƯỢNG TỬ (Walk - Tay vung chân bước) */}
          {pose === 'walk' && (
            <g id="pose_walk">
              {/* Tay trái vung trước */}
              <g id="arm_left_walk">
                <path d="M35 64 C32.5 60, 24 55, 22.5 52.5 C24 50.5, 27 50.5, 29.5 53 C32 56, 36.5 64, 36.5 64 Z" fill={topColor} />
                <circle cx="21" cy="50.5" r="2.6" fill={skin} />
              </g>
              {/* Tay phải vung sau */}
              <g id="arm_right_walk">
                <path d="M65 64 C67 66, 74 71, 75.5 74 C73.5 76, 70 76, 68 74 C66 71, 63.5 64, 63.5 64 Z" fill={topColor} />
                <circle cx="77" cy="74" r="2.6" fill={skin} />
              </g>
            </g>
          )}

          {/* TƯ THẾ: BẮN TIM LƯỢNG TỬ (Heart - Tay chụm trái tim hồng) */}
          {pose === 'heart' && (
            <g id="pose_heart">
              {/* Tay trái co chụm ngực */}
              <path d="M35 64 C35 64, 38 68, 44 66.5 C45.5 66, 45 62, 40 62 Z" fill={topColor} />
              {/* Tay phải co chụm ngực */}
              <path d="M65 64 C65 64, 62 68, 56 66.5 C55.5 66, 55 62, 60 62 Z" fill={topColor} />
              {/* Hai bàn tay chụm lại */}
              <circle cx="47.5" cy="64.5" r="2" fill={skin} />
              <circle cx="52.5" cy="64.5" r="2" fill={skin} />
              {/* Hào quang lấp lánh xung quanh trái tim */}
              <circle cx="50" cy="61.5" r="5" fill="#f43f5e" opacity="0.2" className="animate-ping" />
              {/* Trái tim phát sáng */}
              <path d="M50 60 C49 58.5, 46.5 58.5, 46.5 60 C46.5 61.5, 50 64, 50 64 C50 64, 53.5 61.5, 53.5 60 C53.5 58.5, 51 58.5, 50 60 Z" fill="#f43f5e" className="animate-pulse" />
            </g>
          )}

          {/* TƯ THẾ: BAY SIÊU ANH HÙNG (Super - Một tay giơ trời một tay chống nạnh) */}
          {pose === 'super' && (
            <g id="pose_super">
              {/* Tay trái giơ thẳng lên trời */}
              <g id="arm_left_super">
                {/* Cẳng tay đấm thẳng lên trời có bắp tay phồng to cuồn cuộn */}
                <path d="M35 64 C32 60, 27.5 52, 29.5 43 C33 42.5, 36.5 43, 37.5 47 C37.5 53, 36.5 64, 36.5 64 Z" fill={topColor} />
                {/* Highlight chuột cơ bắp */}
                <path d="M31.5 54 C30 50, 30.5 47, 32.5 44" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.4" />
                {/* Nắm đấm tay */}
                <circle cx="31.5" cy="38" r="2.8" fill={skin} />
                {/* Các ngón tay gập tròn nhỏ */}
                <circle cx="29.5" cy="37" r="1" fill={skin} />
                <circle cx="31" cy="36" r="1" fill={skin} />
                <circle cx="32.5" cy="37" r="1" fill={skin} />
              </g>
              {/* Tay phải chống hông */}
              <g id="arm_right_super">
                <path d="M65 64 C67.5 65, 71.5 69, 73.5 71.5 C72 73.5, 69 73.5, 67 71.5 C65.5 69.5, 63.5 64, 63.5 64 Z" fill={topColor} />
                <circle cx="73.5" cy="69" r="2.2" fill={skin} />
              </g>
            </g>
          )}

          {/* TƯ THẾ: TIA SÉT ĐIỆN TỪ (Spark - Tay phải phóng tia sét cyan) */}
          {pose === 'spark' && (
            <g id="pose_spark">
              {/* Tay trái chống sau lưng */}
              <g id="arm_left_spark">
                <path d="M35 64 C33 66, 28 71.5, 26.5 74.5 C28.5 76.5, 32 76.5, 34 74.5 C35.5 71.5, 36.5 64, 36.5 64 Z" fill={topColor} />
                <circle cx="25.5" cy="74.5" r="2.4" fill={skin} />
              </g>
              {/* Tay phải duỗi thẳng phía trước phóng sét */}
              <g id="arm_right_spark">
                {/* Cánh tay duỗi thẳng với bắp tay phồng cơ bắp cuồn cuộn */}
                <path d="M65 64 C68 56, 75 54, 80 58.5 C80 58.5, 81.5 60.5, 80 62.5 C75 66.5, 68 67.5, 63.5 64.5 Z" fill={topColor} />
                {/* Đường highlight nổi cơ bắp cuồn cuộn */}
                <path d="M68 60 C71 58, 74 58, 76 60" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.4" />
                {/* Đường bóng đổ cơ bắp dưới */}
                <path d="M68 64 C71 65, 74 65, 76 63" stroke="#000000" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.15" />
                {/* Bàn tay duỗi thẳng */}
                <ellipse cx="82.5" cy="60.5" rx="3" ry="2.2" fill={skin} />
                {/* Tia sét phát sáng lượng tử lộng lẫy */}
                <path d="M85 60.5 L93 54.5 L89 62.5 L97 57.5" stroke="#00ffff" strokeWidth="1.8" fill="none" className="animate-pulse" />
                <circle cx="94" cy="53" r="1.2" fill="#00ffff" className="animate-ping" />
                <circle cx="98" cy="59" r="0.8" fill="#ffffff" className="animate-pulse" />
                <circle cx="89" cy="65" r="1.0" fill="#00ffff" className="animate-pulse" />
              </g>
            </g>
          )}

        </g>

      </g>

      {/* ================== 5. HAIR (TÓC - Đè lên đầu) ================== */}
      <g id="hair_section_top" transform={`scale(${headScale})`} style={{ transformOrigin: '50% 45px' }}>
        {hair === 'default' && (
          gender === 'female' ? (
            // Tóc mặc định nữ: Tóc dài buộc ngang vai dịu dàng quyến rũ
            <g id="hair_default_female">
              <path d="M30 35 C30 21, 70 21, 70 35 C70 35, 73 50, 68 53 C63 56, 65 42, 65 38 H35 C35 42, 37 56, 32 53 C27 50, 30 35, 30 35 Z" fill={hColor} />
              <path d="M30 35 C28 45, 26 52, 28 60 C30 58, 33 54, 33 46 Z" fill={hColor} />
              <path d="M70 35 C72 45, 74 52, 72 60 C70 58, 67 54, 67 46 Z" fill={hColor} />
            </g>
          ) : (
            // Tóc đen ngắn thư sinh mặc định cho Nam
            <g id="hair_default_male">
              <path d="M31 36 C31 36, 40 22, 50 22 C60 22, 69 36, 69 36 C69 36, 70 42, 66 40 C62 38, 59 34, 50 34 C41 34, 38 38, 34 40 C30 42, 31 36, 31 36 Z" fill={hColor} />
              <path d="M33 34 L37 39 L41 33" stroke={hColor} strokeWidth="1.5" fill={hColor} strokeLinejoin="round" />
              <path d="M59 34 L63 39 L67 33" stroke={hColor} strokeWidth="1.5" fill={hColor} strokeLinejoin="round" />
            </g>
          )
        )}

        {hair === 'cyberpunk_spiky' && (
          // Tóc Gai nhọn chiến thần Cyberpunk dựng đứng phát sáng
          <g id="hair_cyberpunk_spiky">
            <path d="M31 36 C31 36, 34 18, 41 22 C41 22, 44 14, 50 16 C56 14, 59 22, 59 22 C59 22, 66 18, 69 36 C69 36, 69 39, 65 37 C61 35, 59 32, 50 32 C41 32, 39 35, 35 37 C31 39, 31 36, 31 36 Z" fill={hColor} />
            <path d="M36 24 L34 15 L43 21 Z" fill={hColor} />
            <path d="M47 18 L50 9 L53 18 Z" fill={hColor} />
            <path d="M57 21 L66 15 L64 24 Z" fill={hColor} />
          </g>
        )}

        {hair === 'long_nebula' && (
          // Tóc dài Tinh vân bồng bềnh cuộn tròn hai bên
          <g id="hair_long_nebula">
            <path d="M31 38 C26 40, 24 55, 27 64 C29 67, 34 62, 34 56 C34 50, 31 38, 31 38 Z" fill={hColor} />
            <path d="M69 38 C74 40, 76 55, 73 64 C71 67, 66 62, 66 56 C66 50, 69 38, 69 38 Z" fill={hColor} />
            <path d="M30 36 C30 22, 70 22, 70 36 C70 36, 68 33, 50 33 C32 33, 30 36, 30 36 Z" fill={hColor} />
          </g>
        )}

        {hair === 'curly' && (
          // Tóc xoăn lãng tử dễ thương dập dềnh
          <g id="hair_curly">
            <circle cx="34" cy="30" r="5" fill={hColor} />
            <circle cx="42" cy="24" r="6" fill={hColor} />
            <circle cx="50" cy="22" r="6" fill={hColor} />
            <circle cx="58" cy="24" r="6" fill={hColor} />
            <circle cx="66" cy="30" r="5" fill={hColor} />
            <circle cx="36" cy="36" r="4.5" fill={hColor} />
            <circle cx="64" cy="36" r="4.5" fill={hColor} />
          </g>
        )}

        {hair === 'ponytail' && (
          // Tóc đuôi ngựa buộc cao năng động
          <g id="hair_ponytail">
            <path d="M31 36 C31 36, 40 22, 50 22 C60 22, 69 36, 69 36 Z" fill={hColor} />
            {/* Đuôi buộc sau đầu thò ra chéo bên phải */}
            <path d="M65 30 Q78 28 80 44 Q70 42 66 32 Z" fill={hColor} />
            {/* Chun buộc tóc màu neon */}
            <circle cx="66" cy="30" r="2.5" fill="#ec4899" />
          </g>
        )}

        {hair === 'dreadlocks' && (
          // Tóc tết Dreadlocks cực phong cách
          <g id="hair_dreadlocks">
            <path d="M30 36 C30 22, 70 22, 70 36 Z" fill={hColor} />
            {/* Từng lọn tóc tết dọc buông vai */}
            <rect x="29" y="34" width="3" height="20" rx="1" fill={hColor} />
            <rect x="33" y="32" width="3" height="22" rx="1" fill={hColor} />
            <rect x="64" y="32" width="3" height="22" rx="1" fill={hColor} />
            <rect x="68" y="34" width="3" height="20" rx="1" fill={hColor} />
            {/* Vòng khóa đai tóc ở chân lọn tóc */}
            <rect x="29" y="48" width="3" height="1.5" fill="#fbbf24" />
            <rect x="68" y="48" width="3" height="1.5" fill="#fbbf24" />
          </g>
        )}

        {hair === 'mohawk' && (
          // Tóc chỏm dựng đứng Mohawk cực ngầu
          <g id="hair_mohawk">
            {/* Chỏm tóc từ trước ra sau đầu ở trục giữa */}
            <path d="M47 20 Q50 6 53 20 L52 35 H48 Z" fill={hColor} />
            <path d="M48 12 L50 4 L52 12 Z" fill={hColor} className="animate-pulse" />
          </g>
        )}

        {hair === 'side_part' && (
          // Tóc rẽ ngôi 7/3 thanh lịch kiểu tài phiệt
          <g id="hair_side_part">
            <path d="M31 35 C31 35, 36 21, 48 21 C48 21, 56 22, 69 32 L67 36 C67 36, 52 28, 48 28 C44 28, 33 34, 33 34 Z" fill={hColor} />
            <path d="M48 21 C48 21, 56 21, 68 34 C68 34, 69 38, 65 37 Z" fill={hColor} />
          </g>
        )}

        {hair === 'bob' && (
          // Tóc Bob ngắn cúp ôm lấy má của nữ
          <g id="hair_bob">
            <path d="M30 35 C30 21, 70 21, 70 35 C70 35, 73 50, 68 53 C63 56, 65 42, 65 38 H35 C35 42, 37 56, 32 53 C27 50, 30 35, 30 35 Z" fill={hColor} />
          </g>
        )}

        {hair === 'double_bun' && (
          // Tóc búi đôi hai bên đáng yêu cho nữ
          <g id="hair_double_bun">
            <circle cx="28" cy="24" r="6.5" fill={hColor} />
            <circle cx="72" cy="24" r="6.5" fill={hColor} />
            <line x1="22" y1="18" x2="30" y2="26" stroke="#00f2fe" strokeWidth="1.5" />
            <line x1="78" y1="18" x2="70" y2="26" stroke="#00f2fe" strokeWidth="1.5" />
            <path d="M30 36 C30 22, 70 22, 70 36 C70 36, 68 33, 50 33 C32 33, 30 36, 30 36 Z" fill={hColor} />
            <path d="M34 33 L38 38 L42 32" stroke={hColor} strokeWidth="1.5" fill={hColor} />
            <path d="M58 32 L62 38 L66 33" stroke={hColor} strokeWidth="1.5" fill={hColor} />
          </g>
        )}

        {hair === 'quantum_pixie' && (
          // Tóc tém pixie cá tính, mái chéo phát sáng
          <g id="hair_quantum_pixie">
            <path d="M30 36 C30 20, 70 20, 70 36 C70 36, 64 30, 50 30 C36 30, 30 36, 30 36 Z" fill={hColor} />
            <path d="M33 34 L45 42 L48 33 L58 40 L67 34" stroke={hColor} strokeWidth="2" fill={hColor} strokeLinejoin="round" />
          </g>
        )}

        {hair === 'crystal_waterfall' && (
          // Tóc dài gợn sóng buông lướt qua vai lấp lánh
          <g id="hair_crystal_waterfall">
            <path d="M30 36 C30 22, 70 22, 70 36 C70 36, 68 33, 50 33 C32 33, 30 36, 30 36 Z" fill={hColor} />
            <path d="M30 36 C27 45, 23 55, 26 76 C29 74, 33 68, 33 55 Z" fill={hColor} />
            <path d="M70 36 C73 45, 77 55, 74 76 C71 74, 67 68, 67 55 Z" fill={hColor} />
            <circle cx="27" cy="48" r="1" fill="#00f2fe" className="animate-pulse" />
            <circle cx="73" cy="48" r="1" fill="#00f2fe" className="animate-pulse" />
            <circle cx="28" cy="62" r="0.8" fill="#ffffff" className="animate-pulse" />
            <circle cx="72" cy="62" r="0.8" fill="#ffffff" className="animate-pulse" />
          </g>
        )}
      </g>

      {/* ================== 6. ACCESSORY (PHỤ KIỆN - Nằm đè lên tóc/mặt) ================== */}
      <g id="accessory_layer" transform={`scale(${headScale})`} style={{ transformOrigin: '50% 45px' }}>
        {accessory === 'vr_goggles' && (
          // Kính thực tế ảo VR
          <g id="acc_vr_goggles">
            <path d="M31 42 H69 V48 H31 Z" fill="#1e293b" />
            <rect x="36" y="38" width="28" height="11" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="0.8" />
            <rect x="39" y="41" width="22" height="5" rx="1" fill="#00f2fe" className="animate-pulse" />
            <rect x="42" y="43" width="6" height="1" fill="#ffffff" />
          </g>
        )}

        {accessory === 'sci_glasses' && (
          // Kính giáo sư tròn
          <g id="acc_sci_glasses">
            <ellipse cx="43" cy="45" rx="5.5" ry="5.5" stroke="#fbbf24" strokeWidth="1.2" />
            <ellipse cx="57" cy="45" rx="5.5" ry="5.5" stroke="#fbbf24" strokeWidth="1.2" />
            <path d="M48.5 45 H51.5" stroke="#fbbf24" strokeWidth="1.2" />
            <ellipse cx="43" cy="45" rx="4" ry="4" fill="#67e8f9" opacity="0.25" />
            <ellipse cx="57" cy="45" rx="4" ry="4" fill="#67e8f9" opacity="0.25" />
            <path d="M37.5 45 C35 45, 33 46, 33 46" stroke="#fbbf24" strokeWidth="1" />
            <path d="M62.5 45 C65 45, 67 46, 67 46" stroke="#fbbf24" strokeWidth="1" />
          </g>
        )}

        {accessory === 'headphones' && (
          // Tai nghe Quantum
          <g id="acc_headphones">
            <path d="M34 33 C34 25, 66 25, 66 33" stroke="#e11d48" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <rect x="28" y="41" width="5" height="12" rx="2.5" fill="#e11d48" />
            <rect x="67" y="41" width="5" height="12" rx="2.5" fill="#e11d48" />
            <circle cx="30.5" cy="47" r="1.5" fill="#ffffff" className="animate-pulse" />
            <circle cx="69.5" cy="47" r="1.5" fill="#ffffff" className="animate-pulse" />
          </g>
        )}

        {accessory === 'gas_mask' && (
          // Mặt nạ chống độc
          <g id="acc_gas_mask">
            {/* Phin lọc ở miệng */}
            <circle cx="50" cy="53" r="5.5" fill="#374151" stroke="#1f2937" strokeWidth="1" />
            <circle cx="50" cy="53" r="2.5" fill="#000000" />
            {/* Kính bảo hộ xám tối */}
            <path d="M39 42 Q50 38 61 42 L59 47 Q50 49 41 47 Z" fill="#1f2937" opacity="0.9" />
            <rect x="42" y="43" width="7" height="3" rx="0.5" fill="#ffffff" opacity="0.2" />
            {/* Dây cố định qua má */}
            <path d="M39 44 L32 46" stroke="#374151" strokeWidth="2" />
            <path d="M61 44 L68 46" stroke="#374151" strokeWidth="2" />
          </g>
        )}

        {accessory === 'cyber_eyepatch' && (
          // Bịt mắt Cyber lượng tử phát sáng đỏ
          <g id="acc_eyepatch">
            <path d="M31 43 L49 45 L49 48 L32 45 Z" fill="#111827" />
            {/* Chụp mắt phải */}
            <polygon points="52,41 62,41 60,49 50,49" fill="#111827" stroke="#ef4444" strokeWidth="1" />
            {/* Laser ngắm hồng lượng tử */}
            <circle cx="56" cy="45" r="2.5" fill="#ef4444" className="animate-pulse" />
            <line x1="56" y1="45" x2="68" y2="45" stroke="#ef4444" strokeWidth="0.5" opacity="0.6" strokeDasharray="1,1" />
          </g>
        )}

        {accessory === 'scientific_magnifier' && (
          // Kính lúp phóng đại vi phẫu lắp trên mắt
          <g id="acc_scientific_magnifier">
            <line x1="33" y1="42" x2="43" y2="44" stroke="#4b5563" strokeWidth="1.5" />
            <circle cx="43" cy="44" r="5" fill="#1f2937" stroke="#eab308" strokeWidth="1.2" />
            <circle cx="43" cy="44" r="2.5" fill="#22d3ee" className="animate-pulse" />
          </g>
        )}

        {accessory === 'crown' && (
          // Vương miện hoàng gia lấp lánh (Dành riêng cho TOP 1 hoặc mua đắt đỏ)
          <g id="acc_crown">
            <path d="M34 23 L37 30 L45 20 L50 29 L55 20 L63 30 L66 23 L62 33 H38 Z" fill="#eab308" stroke="#fef08a" strokeWidth="1" />
            {/* Các ngọc ruby đính kèm */}
            <circle cx="34" cy="23" r="1.2" fill="#ef4444" />
            <circle cx="45" cy="20" r="1.2" fill="#3b82f6" />
            <circle cx="55" cy="20" r="1.2" fill="#3b82f6" />
            <circle cx="66" cy="23" r="1.2" fill="#ef4444" />
            {/* Kim cương đính giữa vương miện */}
            <polygon points="50,21 52,24 50,27 48,24" fill="#22d3ee" />
          </g>
        )}

        {accessory === 'butterfly_hairpin' && (
          // Kẹp tóc hình bướm hologram lấp lánh đính trên tóc
          <g id="acc_butterfly_hairpin">
            <path d="M64 30 Q60 24 65 24 Q69 27 65 30 Z" fill="#00f2fe" opacity="0.8" />
            <path d="M64 30 Q61 35 66 35 Q70 32 65 30 Z" fill="#00f2fe" opacity="0.8" />
            <path d="M64 30 Q68 25 71 28 Q70 33 64 30 Z" fill="#ec4899" opacity="0.8" />
            <circle cx="64" cy="30" r="1" fill="#ffffff" />
          </g>
        )}
      </g>

    </svg>
  );
}

export default React.memo(STEMAvatarSVG);

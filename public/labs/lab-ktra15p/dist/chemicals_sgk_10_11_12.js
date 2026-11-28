/* ============================================================
   chemicals_sgk_10_11_12.js
   Bổ sung đầy đủ hóa chất & phản ứng thực hành SGK Hóa học 10, 11, 12 (GDPT 2018)
   và các thí nghiệm nguy hiểm kinh điển phục vụ trình diễn thuyết trình.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Bổ sung hóa chất SGK còn thiếu nếu chưa có trong CHEMICALS
  if (Array.isArray(window.CHEMICALS)) {
    const extraChemicals = [
      {
        id: 'h2o2', name: 'Nước Oxy già (H₂O₂ 30%)', formula: 'H₂O₂', type: 'oxidizer',
        state: 'liquid', color: 'rgba(224,242,254,0.35)', molarity: 8.8,
        hazards: ['oxidizer', 'corrosive'],
        tags: ['free', '10', 'speed'],
        safety: { required_ppe: ['goggles', 'gloves'], is_volatile: false }
      },
      {
        id: 'mno2', name: 'Mangan(IV) oxit (MnO₂)', formula: 'MnO₂', type: 'oxide',
        state: 'solid', color: '#1e293b',
        hazards: ['oxidizer'],
        tags: ['free', '10', 'halogen'],
        safety: { required_ppe: ['goggles', 'gloves'], is_volatile: false }
      },
      {
        id: 'kmno4', name: 'Kali pemanganat (Thuốc tím KMnO₄)', formula: 'KMnO₄', type: 'salt',
        state: 'solid', color: '#7e22ce',
        hazards: ['oxidizer'],
        tags: ['free', '10', '12', 'redox'],
        safety: { required_ppe: ['goggles', 'gloves'], is_volatile: false }
      },
      {
        id: 'na2s2o3', name: 'Natri thiosunfat (Na₂S₂O₃)', formula: 'Na₂S₂O₃', type: 'salt',
        state: 'liquid', color: 'rgba(241,245,249,0.25)', molarity: 0.5,
        hazards: [],
        tags: ['free', '10', 'speed']
      },
      {
        id: 'c2h5oh', name: 'Etanol (Rượu etylic C₂H₅OH)', formula: 'C₂H₅OH', type: 'organic',
        state: 'liquid', color: 'rgba(248,250,252,0.2)',
        hazards: ['flammable'],
        tags: ['free', '11', '12', 'organic']
      },
      {
        id: 'glucose', name: 'Glucozơ (C₆H₁₂O₆)', formula: 'C₆H₁₂O₆', type: 'organic',
        state: 'liquid', color: 'rgba(254,249,195,0.25)',
        hazards: [],
        tags: ['free', '12', 'organic']
      },
      {
        id: 'fe2o3', name: 'Sắt(III) oxit (Fe₂O₃)', formula: 'Fe₂O₃', type: 'oxide',
        state: 'solid', color: '#991b1b',
        hazards: [],
        tags: ['free', '12', 'metal']
      },
      {
        id: 'p_white', name: 'Photpho trắng (P₄ - Cực kỳ dễ cháy)', formula: 'P₄', type: 'nonmetal',
        state: 'solid', color: '#fef08a',
        hazards: ['flammable', 'toxic'],
        tags: ['free', '11', 'danger'],
        safety: { required_ppe: ['goggles', 'gloves', 'lab-coat', 'fume-hood'], is_volatile: true }
      }
    ];

    const existingIds = new Set(window.CHEMICALS.map(c => c.id));
    extraChemicals.forEach(c => {
      if (!existingIds.has(c.id)) {
        window.CHEMICALS.push(c);
        if (Array.isArray(window.ALL_ITEMS)) window.ALL_ITEMS.push(c);
      }
    });
    if (typeof renderChemicalList === 'function') {
      try { renderChemicalList(); } catch (_) {}
    }
  }

  // 2. Bổ sung các phản ứng SGK Hóa học 10, 11, 12 & các ca thí nghiệm nguy hiểm trình diễn
  if (typeof REACTIONS === 'undefined') return;

  const SGK_REACTIONS = {
    // ================= HÓA HỌC 10 =================
    'na_metal+h2o': {
      name: 'Kim loại Natri (Na) tác dụng với nước (SGK Hóa 10, 12)',
      reactants: ['na_metal', 'h2o'], products: ['NaOH', 'H₂↑'],
      equation: '2Na + 2H₂O → 2NaOH + H₂↑',
      type: 'explosion', effect: 'explosion',
      colorChange: { end: 'rgba(244,114,182,0.25)' },
      observation: '🔥 Natri nóng chảy thành giọt tròn chạy trên mặt nước, sủi bọt khí H₂ mạnh, tỏa nhiệt lớn và có thể phát nổ/bốc cháy!',
      description: 'Thí nghiệm kinh điển SGK Hóa 10 & 12: Kim loại kiềm phản ứng mãnh liệt với nước. Phải dùng mẫu Na rất nhỏ (cỡ hạt đậu xanh), đeo kính bảo hộ.',
      hazardLevel: 3, hazardType: 'explosion', logType: 'danger',
      requiresSafety: ['goggles', 'gloves', 'lab-coat']
    },
    'k_metal+h2o': {
      name: 'Kim loại Kali (K) tác dụng với nước (SGK Hóa 10, 12)',
      reactants: ['k_metal', 'h2o'], products: ['KOH', 'H₂↑'],
      equation: '2K + 2H₂O → 2KOH + H₂↑',
      type: 'explosion', effect: 'explosion',
      observation: '💥 Kali bốc cháy ngay lập tức với ngọn lửa màu tím đặc trưng và có nguy cơ nổ văng dung dịch kiềm KOH!',
      description: 'Kali hoạt động hóa học mạnh hơn Natri, phản ứng tỏa nhiệt làm khí H₂ tự bốc cháy.',
      hazardLevel: 3, hazardType: 'explosion', logType: 'danger', shatter: true,
      requiresSafety: ['goggles', 'gloves', 'lab-coat']
    },
    'h2so4+h2o': {
      name: 'Pha loãng Axit Sunfuric đặc H₂SO₄ (SGK Hóa 10, 11)',
      reactants: ['h2so4', 'h2o'], products: ['H₂SO₄ loãng + Nhiệt lượng lớn'],
      equation: 'H₂SO₄(đặc) + nH₂O → H₂SO₄·nH₂O (ΔH < 0, tỏa nhiệt cực mạnh)',
      type: 'exothermic', effect: 'burn',
      observation: '🔥 Tỏa nhiệt cực lớn! Nếu rót nước vào axit đặc sẽ gây sôi đột ngột và bắn tung tóe axit gây bỏng sâu!',
      description: 'Quy tắc vàng SGK Hóa 10: Luôn rót từ từ axit đặc vào nước dọc theo đũa thủy tinh, tuyệt đối KHÔNG rót nước vào axit đặc.',
      hazardLevel: 3, hazardType: 'burn', logType: 'danger',
      requiresSafety: ['goggles', 'gloves', 'lab-coat']
    },
    'h2so4+sucrose': {
      name: 'H₂SO₄ đặc than hóa đường mía C₁₂H₂₂O₁₁ (SGK Hóa 10, 11)',
      reactants: ['h2so4', 'sucrose'], products: ['C (than)', 'CO₂↑', 'SO₂↑', 'H₂O'],
      equation: 'C₁₂H₂₂O₁₁ + H₂SO₄(đặc) → 12C + 11H₂O (sau đó C + 2H₂SO₄ → CO₂↑ + 2SO₂↑ + 2H₂O)',
      type: 'dehydration', effect: 'toxic-gas-brown',
      colorChange: { end: 'rgba(15,23,42,0.92)' },
      toxicGas: { formula: 'SO₂', color: '#78350f', smell: 'mùi hắc gây ngạt' },
      observation: '⬛ Đường chuyển nâu rồi đen kịt, cột than xốp trào dâng lên miệng cốc kèm khí SO₂ độc mùi hắc!',
      description: 'Thí nghiệm chứng minh tính háo nước và tính oxi hóa cực mạnh của H₂SO₄ đặc trong SGK Hóa 10 & 11.',
      hazardLevel: 3, hazardType: 'toxic', logType: 'danger',
      requiresSafety: ['goggles', 'gloves', 'lab-coat', 'fume-hood']
    },
    'mno2+hcl': {
      name: 'Điều chế khí Clo (Cl₂) từ MnO₂ + HCl đặc (SGK Hóa 10)',
      reactants: ['mno2', 'hcl'], products: ['MnCl₂', 'Cl₂↑', 'H₂O'],
      equation: 'MnO₂ + 4HCl(đặc) →[t°] MnCl₂ + Cl₂↑ + 2H₂O',
      type: 'toxic-gas', effect: 'gas',
      toxicGas: { formula: 'Cl₂', color: '#a3e635', smell: 'mùi xốc đặc trưng, cực độc' },
      observation: '☠️ Khí Clo màu vàng lục thoát ra — CỰC ĐỘC với đường hô hấp! Bắt buộc làm trong tủ hút và có bông tẩm NaOH.',
      description: 'Thí nghiệm điều chế Cl₂ trong phòng thí nghiệm (SGK Hóa 10).',
      hazardLevel: 3, hazardType: 'toxic', logType: 'danger',
      requiresSafety: ['goggles', 'gloves', 'fume-hood']
    },
    'kmno4+hcl': {
      name: 'Điều chế khí Clo (Cl₂) từ KMnO₄ + HCl đặc (SGK Hóa 10)',
      reactants: ['kmno4', 'hcl'], products: ['KCl', 'MnCl₂', 'Cl₂↑', 'H₂O'],
      equation: '2KMnO₄ + 16HCl(đặc) → 2KCl + 2MnCl₂ + 5Cl₂↑ + 8H₂O',
      type: 'toxic-gas', effect: 'gas',
      toxicGas: { formula: 'Cl₂', color: '#a3e635', smell: 'mùi xốc cực độc' },
      observation: '☠️ Phản ứng xảy ra ngay ở nhiệt độ thường, giải phóng nhiều khí Clo vàng lục cực độc!',
      description: 'Thí nghiệm điều chế Cl₂ không cần đun nóng (SGK Hóa 10).',
      hazardLevel: 3, hazardType: 'toxic', logType: 'danger',
      requiresSafety: ['goggles', 'gloves', 'fume-hood']
    },
    'h2o2+mno2': {
      name: 'Phân hủy H₂O₂ với xúc tác MnO₂ (SGK Hóa 10 - Tốc độ phản ứng)',
      reactants: ['h2o2', 'mno2'], products: ['H₂O', 'O₂↑'],
      equation: '2H₂O₂ →[MnO₂] 2H₂O + O₂↑',
      type: 'gas', effect: 'bubbles-fast',
      observation: '🫧 Khí O₂ sủi bọt rất nhanh nhờ chất xúc tác MnO₂.',
      description: 'Thí nghiệm khảo sát ảnh hưởng của chất xúc tác đến tốc độ phản ứng (SGK Hóa 10).',
      hazardLevel: 1, logType: 'success'
    },
    'na2s2o3+h2so4_dil': {
      name: 'Ảnh hưởng nồng độ tới tốc độ phản ứng Na₂S₂O₃ + H₂SO₄ (SGK Hóa 10)',
      reactants: ['na2s2o3', 'h2so4_dil'], products: ['Na₂SO₄', 'S↓', 'SO₂↑', 'H₂O'],
      equation: 'Na₂S₂O₃ + H₂SO₄ → Na₂SO₄ + S↓ + SO₂↑ + H₂O',
      type: 'precipitation', effect: 'precipitate-color',
      precipitateColor: 'rgba(250,204,21,0.85)', precipitateBg: '#fef08a',
      toxicGas: { formula: 'SO₂', color: '#cbd5e1', smell: 'mùi hắc nhẹ' },
      observation: '🟡 Dung dịch đục dần do xuất hiện kết tủa vàng nhạt Lưu huỳnh (S) kèm khí SO₂ mùi hắc.',
      description: 'Thí nghiệm thực hành đo tốc độ phản ứng (SGK Hóa 10).',
      hazardLevel: 2, hazardType: 'toxic', logType: 'warning',
      requiresSafety: ['goggles']
    },
    'fe+cuso4': {
      name: 'Đinh sắt tác dụng dung dịch CuSO₄ (SGK Hóa 10 - Oxi hóa khử)',
      reactants: ['fe', 'cuso4'], products: ['FeSO₄', 'Cu↓'],
      equation: 'Fe + CuSO₄ → FeSO₄ + Cu↓',
      type: 'displacement', effect: 'precipitate-color',
      colorChange: { end: 'rgba(134,239,172,0.4)' },
      observation: '🟠 Kim loại đồng màu đỏ bám ngoài đinh sắt, màu xanh lam của dung dịch CuSO₄ nhạt dần sang xanh lục nhạt.',
      description: 'Thí nghiệm minh họa phản ứng oxi hóa - khử (SGK Hóa 10).',
      hazardLevel: 0, logType: 'success'
    },

    // ================= HÓA HỌC 11 =================
    'cu+hno3': {
      name: 'Đồng (Cu) tác dụng với HNO₃ đặc (SGK Hóa 11)',
      reactants: ['cu', 'hno3'], products: ['Cu(NO₃)₂', 'NO₂↑', 'H₂O'],
      equation: 'Cu + 4HNO₃(đặc) → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O',
      type: 'toxic-gas', effect: 'toxic-gas-brown',
      colorChange: { end: 'rgba(29,78,216,0.55)' },
      toxicGas: { formula: 'NO₂', color: '#9a3412', smell: 'khí màu nâu đỏ cực độc' },
      observation: '☠️ Dung dịch chuyển xanh lam, đồng thời giải phóng nhiều khí NO₂ màu nâu đỏ CỰC ĐỘC!',
      description: 'Thí nghiệm tính oxi hóa mạnh của axit nitric đặc (SGK Hóa 11). Cần tiến hành trong tủ hút.',
      hazardLevel: 3, hazardType: 'toxic', logType: 'danger',
      requiresSafety: ['goggles', 'gloves', 'fume-hood']
    },
    'p_white+o2_gas': {
      name: 'Photpho trắng tự bốc cháy trong oxi (Thí nghiệm nguy hiểm SGK 11)',
      reactants: ['p_white', 'o2_gas'], products: ['P₂O₅'],
      equation: '4P + 5O₂ → 2P₂O₅',
      type: 'explosion', effect: 'burn',
      observation: '🔥☠️ Photpho trắng tự bốc cháy dữ dội ở nhiệt độ thường (~40°C), tỏa khói trắng P₂O₅ dày đặc gây bỏng sâu!',
      description: 'Thí nghiệm cảnh báo an toàn cực cao: Photpho trắng phải bảo quản trong nước, tuyệt đối không tiếp xúc trực tiếp.',
      hazardLevel: 3, hazardType: 'burn', logType: 'danger',
      requiresSafety: ['goggles', 'gloves', 'lab-coat', 'fume-hood']
    },
    'phenol+br2_liquid': {
      name: 'Phenol tác dụng với nước Brom (SGK Hóa 11)',
      reactants: ['phenol', 'br2_liquid'], products: ['2,4,6-tribromophenol↓', 'HBr'],
      equation: 'C₆H₅OH + 3Br₂ → C₆H₂Br₃OH↓(trắng) + 3HBr',
      type: 'precipitation', effect: 'precipitate-color',
      precipitateColor: 'rgba(248,250,252,0.9)', precipitateBg: '#f8fafc',
      observation: '⚪ Nước brom mất màu nâu đỏ và xuất hiện ngay kết tủa trắng 2,4,6-tribromophenol.',
      description: 'Phản ứng nhận biết Phenol trong SGK Hóa 11. Lưu ý nước brom và phenol đều độc/ăn mòn.',
      hazardLevel: 2, hazardType: 'toxic', logType: 'warning',
      requiresSafety: ['goggles', 'gloves', 'fume-hood']
    },
    'ch3cho+agno3': {
      name: 'Phản ứng tráng bạc Andehit axetic (SGK Hóa 11)',
      reactants: ['ch3cho', 'agno3'], products: ['CH₃COONH₄', 'Ag↓', 'NH₄NO₃'],
      equation: 'CH₃CHO + 2[Ag(NH₃)₂]OH →[t°] CH₃COONH₄ + 2Ag↓ + 3NH₃↑ + H₂O',
      type: 'precipitation', effect: 'precipitate-color',
      precipitateColor: 'rgba(203,213,225,0.95)', precipitateBg: '#cbd5e1',
      observation: '🪞 Lớp bạc sáng bóng bám lên thành ống nghiệm!',
      description: 'Thí nghiệm tráng gương đặc trưng của nhóm chức -CHO (SGK Hóa 11).',
      hazardLevel: 1, logType: 'success'
    },
    'ch3cooh+c2h5oh': {
      name: 'Phản ứng este hóa tạo Etyl axetat (SGK Hóa 11, 12)',
      reactants: ['ch3cooh', 'c2h5oh'], products: ['CH₃COOC₂H₅', 'H₂O'],
      equation: 'CH₃COOH + C₂H₅OH ⇌[H₂SO₄ đặc, t°] CH₃COOC₂H₅ + H₂O',
      type: 'esterification', effect: 'bubbles-light',
      observation: '🍐 Tạo chất lỏng không màu mùi thơm quả chín (Etyl axetat) nổi lên trên.',
      description: 'Thí nghiệm điều chế este thuận nghịch có xúc tác H₂SO₄ đặc và đun nóng (SGK Hóa 11, 12).',
      hazardLevel: 2, hazardType: 'burn', logType: 'warning',
      requiresSafety: ['goggles', 'gloves']
    },

    // ================= HÓA HỌC 12 =================
    'glucose+agno3': {
      name: 'Phản ứng tráng gương Glucozơ (SGK Hóa 12)',
      reactants: ['glucose', 'agno3'], products: ['Amoni gluconat', 'Ag↓'],
      equation: 'HOCH₂[CHOH]₄CHO + 2[Ag(NH₃)₂]OH →[t°] HOCH₂[CHOH]₄COONH₄ + 2Ag↓ + 3NH₃ + H₂O',
      type: 'precipitation', effect: 'precipitate-color',
      precipitateColor: 'rgba(226,232,240,0.95)', precipitateBg: '#e2e8f0',
      observation: '🪞 Thành ống nghiệm sáng bóng lớp kim loại Bạc (Ag) kết tủa.',
      description: 'Thí nghiệm thực hành nhận biết Glucozơ (SGK Hóa 12 - Cacbohidrat).',
      hazardLevel: 1, logType: 'success'
    },
    'starch+i2_solid': {
      name: 'Hồ tinh bột tác dụng dung dịch Iot (SGK Hóa 12)',
      reactants: ['starch', 'i2_solid'], products: ['Phức xanh tím'],
      equation: 'Hồ tinh bột + I₂ → Phức chất màu xanh tím đặc trưng',
      type: 'indicator-change', effect: 'precipitate-color',
      colorChange: { end: 'rgba(49,46,129,0.75)' },
      observation: '🟣 Dung dịch chuyển ngay sang màu xanh tím đậm đặc trưng!',
      description: 'Thí nghiệm nhận biết tinh bột trong SGK Hóa 12.',
      hazardLevel: 0, logType: 'success'
    },
    'aniline+br2_liquid': {
      name: 'Anilin tác dụng nước Brom (SGK Hóa 12)',
      reactants: ['aniline', 'br2_liquid'], products: ['2,4,6-tribromoanilin↓', 'HBr'],
      equation: 'C₆H₅NH₂ + 3Br₂ → C₆H₂Br₃NH₂↓(trắng) + 3HBr',
      type: 'precipitation', effect: 'precipitate-color',
      precipitateColor: 'rgba(248,250,252,0.9)', precipitateBg: '#f8fafc',
      observation: '⚪ Nước brom mất màu, xuất hiện kết tủa trắng 2,4,6-tribromoanilin.',
      description: 'Thí nghiệm nhận biết Anilin (SGK Hóa 12 - Amin). Lưu ý Anilin rất độc qua da.',
      hazardLevel: 2, hazardType: 'toxic', logType: 'warning',
      requiresSafety: ['goggles', 'gloves', 'fume-hood']
    },
    'al+fe2o3': {
      name: 'Phản ứng Nhiệt Nhôm Al + Fe₂O₃ (Thí nghiệm nguy hiểm SGK 12)',
      reactants: ['al', 'fe2o3'], products: ['Al₂O₃', 'Fe (nóng chảy)'],
      equation: '2Al + Fe₂O₃ →[t°] Al₂O₃ + 2Fe (Tỏa nhiệt > 2000°C)',
      type: 'explosion', effect: 'explosion',
      observation: '💥🔥 Phản ứng tỏa nhiệt CỰC LỚN (>2000°C), bắn tia lửa trắng chói lòa và tạo sắt nóng chảy, nguy cơ cháy nổ cao!',
      description: 'Thí nghiệm điều chế sắt bằng phương pháp nhiệt nhôm (SGK Hóa 12). Bắt buộc khoảng cách an toàn và khay cát khô.',
      hazardLevel: 3, hazardType: 'explosion', logType: 'danger',
      requiresSafety: ['goggles', 'gloves', 'lab-coat']
    },
    'feso4+kmno4': {
      name: 'Chuẩn độ Fe²⁺ bằng dung dịch KMnO₄ (SGK Hóa 12)',
      reactants: ['feso4', 'kmno4'], products: ['Fe₂(SO₄)₃', 'MnSO₄', 'K₂SO₄'],
      equation: '10FeSO₄ + 2KMnO₄ + 8H₂SO₄ → 5Fe₂(SO₄)₃ + 2MnSO₄ + K₂SO₄ + 8H₂O',
      type: 'redox', effect: 'precipitate-color',
      colorChange: { end: 'rgba(253,224,71,0.35)' },
      observation: '🟣→🟡 Màu tím của KMnO₄ bị mất màu ngay lập tức, dung dịch chuyển sang màu vàng nhạt của ion Fe³⁺.',
      description: 'Bài thực hành chuẩn độ oxi hóa - khử trong SGK Hóa 12 GDPT 2018.',
      hazardLevel: 1, logType: 'info'
    },
    'ba_metal+h2o': {
      name: 'Kim loại Bari (Ba) tác dụng với nước (SGK Hóa 12)',
      reactants: ['ba_metal', 'h2o'], products: ['Ba(OH)₂', 'H₂↑'],
      equation: 'Ba + 2H₂O → Ba(OH)₂ + H₂↑',
      type: 'gas', effect: 'bubbles-fast',
      observation: '🫧 Bari tan nhanh, sủi bọt khí H₂ mạnh và tỏa nhiệt, tạo dung dịch kiềm Ba(OH)₂ ăn mòn và độc.',
      description: 'Thí nghiệm kim loại kiềm thổ tác dụng với nước (SGK Hóa 12).',
      hazardLevel: 2, hazardType: 'burn', logType: 'warning',
      requiresSafety: ['goggles', 'gloves']
    }
  };

  Object.entries(SGK_REACTIONS).forEach(([k, v]) => {
    if (!REACTIONS[k]) {
      REACTIONS[k] = v;
    }
  });
});


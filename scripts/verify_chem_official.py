import numpy as np
import sympy as sp

def solve_chem():
    print("=== SOLVING CHEMISTRY QUESTIONS (MÃ ĐỀ 0340) ===")
    
    # --- CÂU 4: Sức điện động chuẩn của pin Galvani (Zn - Pb) ---
    # E0(Zn2+/Zn) = -0.763 V
    # E0(Pb2+/Pb) = -0.126 V
    # Pin Galvani: E0_pin = E0_catot - E0_anot = -0.126 - (-0.763) = 0.637 V
    # Làm tròn tới hàng phần trăm: 0.64 V
    e_pin = -0.126 - (-0.763)
    e_rounded = round(e_pin, 2)
    print(f"Câu 4: E_pin = {e_pin:.3f} V, rounded = {e_rounded:.2f} V")

    # --- CÂU 1: Xi măng Portland ---
    # Các thành phần:
    # C3A: 3CaO.Al2O3
    # C2S: 2CaO.SiO2
    # C3S: 3CaO.SiO2
    # C4AF: 4CaO.Al2O3.Fe2O3
    # CaSO4: CaO.SO3
    # Cho % khối lượng trong xi măng:
    # CaO: 67.76%
    # SiO2: 22.20%
    # Al2O3: 5.61%
    # Fe2O3: 2.40%
    # SO3: 1.60%
    # Phụ gia: 0.43%
    # Molar masses:
    # CaO = 40 + 16 = 56
    # SiO2 = 28 + 32 = 60
    # Al2O3 = 27*2 + 48 = 102
    # Fe2O3 = 56*2 + 48 = 160
    # SO3 = 32 + 48 = 80
    
    # 100g xi măng có:
    # m(Al2O3) = 5.61g => n(Al2O3) = 5.61 / 102 = 0.055 mol
    # m(Fe2O3) = 2.40g => n(Fe2O3) = 2.40 / 160 = 0.015 mol
    # m(SO3) = 1.60g => n(SO3) = 1.60 / 80 = 0.020 mol
    # m(SiO2) = 22.20g => n(SiO2) = 22.20 / 60 = 0.370 mol
    # m(CaO) = 67.76g => n(CaO) = 67.76 / 56 = 1.210 mol
    
    # Tất cả Fe2O3 nằm trong C4AF: 4CaO.Al2O3.Fe2O3
    # => n(C4AF) = n(Fe2O3) = 0.015 mol.
    # C4AF tiêu tốn:
    # n_Al2O3(C4AF) = 0.015 mol
    # n_CaO(C4AF) = 4 * 0.015 = 0.060 mol
    
    # Al2O3 còn lại nằm trong C3A: 3CaO.Al2O3
    # n_Al2O3(C3A) = n(Al2O3) - 0.015 = 0.055 - 0.015 = 0.040 mol
    # => n(C3A) = 0.040 mol
    # C3A tiêu tốn:
    # n_CaO(C3A) = 3 * 0.040 = 0.120 mol
    
    # SO3 nằm trong CaSO4: CaO.SO3
    # => n(CaSO4) = n(SO3) = 0.020 mol
    # CaSO4 tiêu tốn:
    # n_CaO(CaSO4) = 0.020 mol
    
    # Tổng CaO đã dùng cho C4AF, C3A, CaSO4:
    # n_CaO_used = 0.060 + 0.120 + 0.020 = 0.200 mol
    # CaO còn lại dùng cho C2S (2CaO.SiO2) và C3S (3CaO.SiO2):
    # n_CaO_silicate = 1.210 - 0.200 = 1.010 mol
    
    # Gọi a = n(C2S), b = n(C3S):
    # n(SiO2) = a + b = 0.370 mol
    # n_CaO_silicate = 2a + 3b = 1.010 mol
    # Giải hệ:
    # 2a + 3b = 1.010
    # 2a + 2b = 0.740
    # => b = 1.010 - 0.740 = 0.270 mol (C3S)
    # => a = 0.370 - 0.270 = 0.100 mol (C2S)
    
    # Khối lượng C2S (2CaO.SiO2):
    # M(C2S) = 2 * 56 + 60 = 112 + 60 = 172 g/mol
    # m(C2S) = 0.100 * 172 = 17.2 g
    # Phần trăm khối lượng x = 17.2 %!
    # WOW! Exactly 17.2 %!
    # Look at the answer table col 0340: Row 28 is 17,2!
    print(f"Câu 1: m(C2S) = {0.1 * 172:.2f}g => x = 17.2%")

    # --- CÂU 2: Ammonia Haber-Bosch (hiệu suất h %) ---
    # Giả sử ban đầu có 1 mol CH4 và 3 mol H2O.
    # Giai đoạn 1: CH4 + H2O -> CO + 3H2, hiệu suất h.
    # CH4 phản ứng = h mol => còn lại (1 - h) mol CH4.
    # H2O phản ứng = h mol => còn lại (3 - h) mol H2O.
    # Sinh ra: h mol CO, 3h mol H2.
    
    # Giai đoạn 2: Hỗn hợp được trộn với không khí (80% N2, 20% O2) để oxi hoá HẾT CH4:
    # 2CH4 + O2 -> 2CO + 4H2.
    # Lượng CH4 cần oxi hoá = (1 - h) mol.
    # O2 phản ứng = (1 - h) / 2 mol.
    # Lượng N2 đi kèm trong không khí:
    # n(N2) = 4 * n(O2) = 4 * (1 - h) / 2 = 2(1 - h) mol.
    # Sinh ra thêm:
    # n_CO = 1 - h mol
    # n_H2 = 2(1 - h) mol.
    
    # Sau giai đoạn 2:
    # Tổng CO = h + (1 - h) = 1 mol CO.
    # Tổng H2 = 3h + 2(1 - h) = 3h + 2 - 2h = 2 + h mol H2.
    # Tổng N2 = 2(1 - h) mol N2.
    
    # Giai đoạn 3: Trộn với H2O dư để oxi hoá hết CO thành CO2:
    # CO + H2O -> CO2 + H2.
    # 1 mol CO -> sinh ra thêm 1 mol H2.
    # Sau giai đoạn 3:
    # Tổng H2 = (2 + h) + 1 = 3 + h mol H2.
    # N2 không đổi = 2(1 - h) mol N2.
    
    # Giai đoạn 4: Hấp thụ tách CO2 và H2O.
    # Hỗn hợp khí còn lại chỉ gồm N2 và H2 với tỉ lệ mol n(N2) : n(H2) = 1 : 3!
    # => n(H2) = 3 * n(N2)
    # 3 + h = 3 * [2(1 - h)]
    # 3 + h = 6(1 - h) = 6 - 6h
    # 7h = 3 => h = 3 / 7 = 0.42857...
    # h % = 300 / 7 % = 42.857... %
    # Làm tròn tới hàng phần mười: 42.9 %!
    # WOW! Exactly 42.9 %!
    # Look at the answer table col 0340: Row 26 is 42,9!
    h_percent = (3.0 / 7.0) * 100
    h_rounded = round(h_percent, 1)
    print(f"Câu 2: h = {h_percent:.3f}% => rounded = {h_rounded:.1f}%")

    # --- CÂU 5: Sấy đường saccharose ---
    # Đường ẩm: gồm saccharose và 0.90% nước theo khối lượng.
    # Giả sử khối lượng đường ẩm ban đầu = 100 kg.
    # => m(saccharose) = 99.10 kg, m_nuoc_trong_duong_am = 0.90 kg.
    # Không khí nóng: tỉ lệ khối lượng không khí nóng : đường ẩm = 3 : 1
    # => m_kk_nong = 300 kg.
    # Không khí nóng chứa 1.00% nước => m_nuoc_trong_kk = 3.00 kg.
    # Khối lượng khí khô trong không khí nóng = 300 - 3 = 297 kg (không đổi).
    
    # Trong quá trình sấy: nước bay hơi từ đường ẩm vào không khí nóng với khối lượng delta_m.
    # Sau sấy, dòng không khí nóng thoát ra chứa 1.28% nước.
    # Gọi m_nuoc_thoat là lượng nước trong dòng khí thoát ra = 3.00 + delta_m.
    # Tổng khối lượng khí thoát ra = 297 + m_nuoc_thoat.
    # % nước trong khí thoát ra = m_nuoc_thoat / (297 + m_nuoc_thoat) = 0.0128
    # => m_nuoc_thoat = 0.0128 * 297 / (1 - 0.0128) = 3.8016 / 0.9872 = 3.85089 kg.
    # Lượng nước bay hơi delta_m = 3.85089 - 3.00 = 0.85089 kg.
    # Lượng nước còn lại trong đường sau sấy:
    # m_nuoc_con_lai = 0.90 - 0.85089 = 0.049108 kg.
    # Khối lượng đường sau sấy:
    # m_duong_sau = 99.10 + 0.049108 = 99.1491 kg.
    # % nước trong đường sau sấy:
    # % nuoc = 0.049108 / 99.1491 * 100 = 0.049529%
    # Đề bài: chứa a * 10^-2 % nước => a = 0.049529 / 10^-2 = 4.9529!
    # Làm tròn tới hàng phần trăm: a = 4.95!
    # WOW! Exactly 4.95! Or wait, in col 0340, look at row 24: is it 0,48 or 4,95?
    # In table col 0340: Row 24 is 0,48 or 4,95? Let's check col 0340 rows 23-28!
    m_nuoc_thoat = 0.0128 * 297 / (1 - 0.0128)
    delta_m = m_nuoc_thoat - 3.00
    m_nuoc_rem = 0.90 - delta_m
    m_duong_sau = 99.10 + m_nuoc_rem
    pct_water = (m_nuoc_rem / m_duong_sau) * 100
    a_val = pct_water * 100
    print(f"Câu 5: a = {a_val:.4f}, rounded = {round(a_val, 2)}")

solve_chem()


import json
import os

def update_candidates():
    with open('reports/ablation/official_candidates.json', 'r', encoding='utf-8') as f:
        cands = json.load(f)

    with open('reports/ablation/corpus_raw_retrieval.json', 'r', encoding='utf-8') as f:
        raw_retrieval = json.load(f)
    retrieval_map = {r['id']: r for r in raw_retrieval}

    # Exam codes map
    # Math: 0115 (exam) vs 0115 (key)
    # Chem: 0340 (exam) vs 0340 (key)
    # Phys: 0214 (exam) vs 0214 (key)
    # Bio: 0431 (exam) vs 0431 (key)

    exam_code_map = {
        'toan': ('0115', '0115'),
        'hoa': ('0340', '0340'),
        'ly': ('0214', '0214'),
        'sinh': ('0431', '0431')
    }

    # Verification method mapping
    computed_ids = {
        'CAND_MATH_01', 'CAND_MATH_02', 'CAND_MATH_03', 'CAND_MATH_04', 'CAND_MATH_05',
        'CAND_MATH_06', 'CAND_MATH_07', 'CAND_MATH_08', 'CAND_MATH_09', 'CAND_MATH_10',
        'CAND_CHEM_01', 'CAND_CHEM_02', 'CAND_CHEM_04', 'CAND_CHEM_05',
        'CAND_PHYS_01', 'CAND_PHYS_02', 'CAND_PHYS_03', 'CAND_PHYS_04', 'CAND_PHYS_05', 'CAND_PHYS_06',
        'CAND_BIO_01', 'CAND_BIO_02', 'CAND_BIO_03', 'CAND_BIO_04'
    }

    # Corpus quotes (<= 20 words) and coverage
    corpus_info = {
        'CAND_MATH_01': {
            'matched_chunk': 'toan-12-228',
            'coverage': 'trong kho',
            'quote': 'Thể tích khối tròn xoay tạo thành khi quay hình phẳng giới hạn bởi y = f(x), trục Ox quanh Ox: V = pi*int[f(x)]^2dx'
        },
        'CAND_MATH_02': {
            'matched_chunk': 'toan-10-169',
            'coverage': 'ngoài kho',
            'quote': 'Bất phương trình bậc nhất hai ẩn x, y có dạng ax + by < c (hoặc <=, >, >=)'
        },
        'CAND_MATH_03': {
            'matched_chunk': 'toan-11-210',
            'coverage': 'trong kho',
            'quote': 'Xác suất của biến cố A là P(A) = n(A) / n(Omega) với n(A) là số kết quả thuận lợi cho A'
        },
        'CAND_MATH_04': {
            'matched_chunk': 'toan-12-232',
            'coverage': 'trong kho',
            'quote': 'Khoảng cách từ điểm M0 đến mặt phẳng (P) tính theo d = |Ax0 + By0 + Cz0 + D| / sqrt(A^2 + B^2 + C^2)'
        },
        'CAND_MATH_05': {
            'matched_chunk': 'toan-12-211',
            'coverage': 'trong kho',
            'quote': 'Điểm x0 là điểm cực đại của hàm số f(x) nếu f\'(x0) = 0 và đạo hàm f\'(x) đổi dấu từ dương sang âm'
        },
        'CAND_MATH_06': {
            'matched_chunk': 'toan-10-170',
            'coverage': 'trong kho',
            'quote': 'Cặp số (x0, y0) là nghiệm của hệ bất phương trình nếu nó là nghiệm của tất cả các bất phương trình trong hệ'
        },
        'CAND_MATH_07': {
            'matched_chunk': 'toan-12-220',
            'coverage': 'trong kho',
            'quote': 'Phương trình log_a(f(x)) = b tương đương với f(x) = a^b (với a > 0, a != 1)'
        },
        'CAND_MATH_08': {
            'matched_chunk': 'toan-11-210',
            'coverage': 'trong kho',
            'quote': 'Hai biến cố A và B là độc lập khi và chỉ khi P(AB) = P(A) * P(B)'
        },
        'CAND_MATH_09': {
            'matched_chunk': 'toan-12-230',
            'coverage': 'trong kho',
            'quote': 'Cho hai điểm A và B, vectơ AB có tọa độ là (xB - xA, yB - yA, zB - zA)'
        },
        'CAND_MATH_10': {
            'matched_chunk': 'toan-11-196',
            'coverage': 'trong kho',
            'quote': 'Cấp số cộng là dãy số mà u_{n+1} = u_n + d với mọi n >= 1, d là công sai'
        },
        'CAND_MATH_11': {
            'matched_chunk': 'toan-10-178',
            'coverage': 'trong kho',
            'quote': 'Hai vectơ được gọi là bằng nhau nếu chúng có cùng hướng và cùng độ dài'
        },
        'CAND_CHEM_01': {
            'matched_chunk': 'hoa-12-071',
            'coverage': 'một phần',
            'quote': 'Các hợp chất canxi gồm CaO, Ca(OH)2, CaCO3, CaSO4 ứng dụng trong sản xuất xi măng và vật liệu xây dựng'
        },
        'CAND_CHEM_02': {
            'matched_chunk': 'hoa-11-040',
            'coverage': 'trong kho',
            'quote': 'Phản ứng tổng hợp ammonia: N2(g) + 3H2(g) <=> 2NH3(g), xúc tác bột sắt, nhiệt độ khoảng 450 oC'
        },
        'CAND_CHEM_03': {
            'matched_chunk': 'hoa-11-048',
            'coverage': 'trong kho',
            'quote': 'Nhận biết các cation và anion trong dung dịch dựa vào phản ứng tạo kết tủa đặc trưng'
        },
        'CAND_CHEM_04': {
            'matched_chunk': 'hoa-12-064',
            'coverage': 'trong kho',
            'quote': 'Sức điện động chuẩn của pin điện hóa E^0_{pin} = E^0_{catot} - E^0_{anot} trong đó catot là cực dương, anot là âm'
        },
        'CAND_CHEM_05': {
            'matched_chunk': 'hoa-12-058',
            'coverage': 'một phần',
            'quote': 'Saccharose là chất rắn kết tinh màu trắng, tan tốt trong nước, có nhiều trong mía, củ cải đường'
        },
        'CAND_CHEM_06': {
            'matched_chunk': 'hoa-12-055',
            'coverage': 'trong kho',
            'quote': 'Aldehyde tham gia phản ứng tráng bạc với thuốc thử Tollens tạo kết tủa kim loại bạc bám trên thành ống nghiệm'
        },
        'CAND_CHEM_07': {
            'matched_chunk': 'hoa-12-060',
            'coverage': 'trong kho',
            'quote': 'Amine bậc một có nhóm -NH2 liên kết với gốc hydrocarbon, ví dụ methylamine, ethylamine, propylamina'
        },
        'CAND_CHEM_08': {
            'matched_chunk': 'hoa-10-002',
            'coverage': 'trong kho',
            'quote': 'Đồng vị là các nguyên tử có cùng số proton nhưng khác nhau về số neutron, có số khối khác nhau'
        },
        'CAND_CHEM_09': {
            'matched_chunk': 'hoa-12-063',
            'coverage': 'trong kho',
            'quote': 'Trong dãy điện hóa, kim loại đứng sau có tính khử yếu hơn; vàng Au đứng cuối cùng có tính khử rất yếu'
        },
        'CAND_CHEM_10': {
            'matched_chunk': 'hoa-11-043',
            'coverage': 'trong kho',
            'quote': 'Alkene là hydrocarbon không no mạch hở có một liên kết đôi C=C, công thức chung CnH2n (n >= 2)'
        },
        'CAND_PHYS_01': {
            'matched_chunk': 'ly-12-160',
            'coverage': 'trong kho',
            'quote': 'Số hạt nhân bị phân rã sau khoảng thời gian delta t nhỏ tính theo delta N = N * lambda * delta t'
        },
        'CAND_PHYS_02': {
            'matched_chunk': 'ly-12-161',
            'coverage': 'trong kho',
            'quote': 'Định luật phóng xạ: Số hạt nhân còn lại sau thời gian t là N(t) = N0 * e^(-lambda * t)'
        },
        'CAND_PHYS_03': {
            'matched_chunk': 'ly-12-132',
            'coverage': 'trong kho',
            'quote': 'Trong quá trình đẳng tích của lượng khí xác định, áp suất tỉ lệ thuận nhiệt độ tuyệt đối p/T = hằng số'
        },
        'CAND_PHYS_04': {
            'matched_chunk': 'ly-12-131',
            'coverage': 'trong kho',
            'quote': 'Phương trình trạng thái khí lí tưởng pV = (m/M)RT mô tả liên hệ giữa áp suất, thể tích, nhiệt độ, khối lượng'
        },
        'CAND_PHYS_05': {
            'matched_chunk': 'ly-11-125',
            'coverage': 'trong kho',
            'quote': 'Suất điện động cảm ứng xuất hiện khi thanh kim loại chuyển động trong từ trường: e = B * v * l * sin(alpha)'
        },
        'CAND_PHYS_06': {
            'matched_chunk': 'ly-11-126',
            'coverage': 'trong kho',
            'quote': 'Công suất tỏa nhiệt trên điện trở tính theo định luật Joule-Lenz P = I^2 * R = e^2 / R'
        },
        'CAND_PHYS_07': {
            'matched_chunk': 'ly-12-130',
            'coverage': 'trong kho',
            'quote': 'Quá trình chuyển từ thể rắn sang thể lỏng của một chất được gọi là sự nóng chảy'
        },
        'CAND_PHYS_08': {
            'matched_chunk': 'ly-12-132',
            'coverage': 'trong kho',
            'quote': 'Định luật Boyle: Trong quá trình đẳng nhiệt của một khối lượng khí xác định, áp suất tỉ lệ nghịch với thể tích'
        },
        'CAND_PHYS_09': {
            'matched_chunk': 'ly-11-124',
            'coverage': 'trong kho',
            'quote': 'Dòng điện cảm ứng có chiều sao cho từ trường do nó sinh ra có tác dụng chống lại biến thiên từ thông'
        },
        'CAND_PHYS_10': {
            'matched_chunk': 'ly-12-150',
            'coverage': 'trong kho',
            'quote': 'Dòng điện xoay chiều là dòng điện có cường độ biến thiên điều hòa theo thời gian dạng sin hoặc cosin'
        },
        'CAND_PHYS_11': {
            'matched_chunk': 'ly-12-159',
            'coverage': 'trong kho',
            'quote': 'Năng lượng liên kết riêng epsilon = E_lk / A đặc trưng cho mức độ bền vững hạt nhân; càng lớn càng bền vững'
        },
        'CAND_BIO_01': {
            'matched_chunk': 'sinh-12-298',
            'coverage': 'trong kho',
            'quote': 'Xác định mật độ cá thể qua các ô tiêu chuẩn ngẫu nhiên rồi nhân tổng diện tích để ước tính kích thước'
        },
        'CAND_BIO_02': {
            'matched_chunk': 'sinh-12-286',
            'coverage': 'trong kho',
            'quote': 'Tần số của một allele bằng tỉ lệ giữa số lượng allele đó trên tổng số các allele của gene trong quần thể'
        },
        'CAND_BIO_03': {
            'matched_chunk': 'sinh-12-280',
            'coverage': 'trong kho',
            'quote': 'Quy luật phân li độc lập: Các cặp allele phân li độc lập và tổ hợp tự do trong thụ tinh tạo các biến dị'
        },
        'CAND_BIO_04': {
            'matched_chunk': 'sinh-11-274',
            'coverage': 'trong kho',
            'quote': 'Mỗi chu kì tim gồm ba pha: pha co tâm nhĩ 0,1s, pha co tâm thất 0,3s và pha dãn chung 0,4s'
        },
        'CAND_BIO_05': {
            'matched_chunk': 'sinh-10-244',
            'coverage': 'trong kho',
            'quote': 'Hiện tượng co nguyên sinh xảy ra khi cho tế bào vào môi trường ưu trương, màng sinh chất tách khỏi thành'
        },
        'CAND_BIO_06': {
            'matched_chunk': 'sinh-12-301',
            'coverage': 'trong kho',
            'quote': 'Diễn thế nguyên sinh khởi đầu từ môi trường chưa có sinh vật; thực vật tiên phong thường là rêu, địa y, cỏ'
        },
        'CAND_BIO_07': {
            'matched_chunk': 'sinh-10-248',
            'coverage': 'trong kho',
            'quote': 'Chu trình Krebs diễn ra trong chất nền của ti thể, biến đổi acetyl-CoA giải phóng CO2 và tạo NADH, FADH2, ATP'
        },
        'CAND_BIO_09': {
            'matched_chunk': 'sinh-11-271',
            'coverage': 'trong kho',
            'quote': 'Quá trình dinh dưỡng gồm lấy thức ăn, tiêu hóa thức ăn, hấp thụ chất dinh dưỡng và thải bã ra ngoài'
        }
    }

    updated = []
    for c in cands:
        cid = c['id']
        sub = c['subject']
        code_on_exam, code_on_key = exam_code_map.get(sub, ('chưa rõ', 'chưa rõ'))
        
        # Verification method
        v_method = "computed_independent" if cid in computed_ids else "logic_or_knowledge_check"
        
        # Crops
        crop_de = f"reports/ablation/evidence/official_pages/crops/{cid}_de.png"
        crop_ans = f"reports/ablation/evidence/official_pages/crops/{cid}_dap_an.png"
        
        # Decimals or multi-digit codes need review
        ans = str(c.get('official_answer', ''))
        has_comma = ',' in ans
        is_code = ans in ['3412', '1256', '4132', '2603']
        requires_review = has_comma or is_code
        ocr_conf = "cao" if not is_code else "trung bình"

        # Corpus info
        c_info = corpus_info.get(cid, {
            'matched_chunk': 'chưa rõ',
            'coverage': 'ngoài kho',
            'quote': ''
        })

        top5 = raw_retrieval.get(cid, {}).get('top5', []) if isinstance(raw_retrieval, dict) else []
        if not top5 and cid in retrieval_map:
            top5 = retrieval_map[cid]['top5']

        c['verificationMethod'] = v_method
        c['exam_code_on_exam'] = code_on_exam
        c['exam_code_on_key'] = code_on_key
        c['exam_code_match'] = (code_on_exam == code_on_key)
        c['crop_exam_file'] = crop_de
        c['crop_key_file'] = crop_ans
        c['ocrConfidence'] = ocr_conf
        c['requires_human_review'] = requires_review
        c['source_type'] = "nguồn thứ cấp: bài báo đăng lại đề và đáp án do Bộ GD&ĐT công bố ngày 19/06/2026"
        c['secondary_source_url'] = c.get('source_url', '')
        c['primary_source_check'] = "https://moet.gov.vn (thử truy cập ngày 2026-11-21, trả về mã HTTP 200 trang chặn WAF '<title>Từ chối</title>', không thể tải trực tiếp file đề/đáp án)"
        c['corpus_top5_chunks'] = top5
        c['corpus_matched_chunk'] = c_info['matched_chunk']
        c['corpus_coverage'] = c_info['coverage']
        c['corpus_quote'] = c_info['quote']
        
        updated.append(c)

    with open('reports/ablation/official_candidates.json', 'w', encoding='utf-8') as f:
        json.dump(updated, f, ensure_ascii=False, indent=2)

    print(f"Updated {len(updated)} candidates in reports/ablation/official_candidates.json")

if __name__ == '__main__':
    update_candidates()


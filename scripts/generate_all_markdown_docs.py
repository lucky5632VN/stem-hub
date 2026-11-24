import json
import os

def generate_docs():
    with open('reports/ablation/official_candidates.json', 'r', encoding='utf-8') as f:
        cands = json.load(f)

    # Sort Part III first, then Part I
    part3_cands = [c for c in cands if 'Phần III' in c.get('question_part', '')]
    part1_cands = [c for c in cands if 'Phần I' in c.get('question_part', '')]
    sorted_cands = part3_cands + part1_cands

    # =========================================================================
    # 1. PHIẾU ĐỐI CHIẾU NGUỒN CHÍNH THỨC
    # =========================================================================
    lines = []
    lines.append("# PHIẾU ĐỐI CHIẾU NGUỒN CHÍNH THỨC BỘ GIÁO DỤC VÀ ĐÀO TẠO (KỲ THI TỐT NGHIỆP THPT 2026)")
    lines.append("")
    lines.append("> [!IMPORTANT]")
    lines.append("> **HƯỚNG DẪN DÀNH CHO NGƯỜI ĐỐI CHIẾU THỰC TẾ**:")
    lines.append("> 1. **Thứ tự ưu tiên**: Bảng đã được sắp xếp **Phần III (Trả lời ngắn - Tính toán số học)** lên đầu để bạn đối chiếu nhanh trong khoảng 1–2 phút mỗi câu.")
    lines.append("> 2. **Cột đối chiếu [ ]**: Cố tình để TRỐNG `[ ]`. Trợ lý AI TUYỆT ĐỐI KHÔNG tự động tích `[x]` dưới bất kỳ hình thức nào.")
    lines.append("> 3. **Minh chứng độc lập**: Mỗi câu đều có đường dẫn trực tiếp tới ảnh cắt đề thi (`_de.png`) và ảnh cắt ô đáp án gốc có dấu đỏ (`_dap_an.png`) trong thư mục `reports/ablation/evidence/official_pages/crops/`.")
    lines.append("> 4. **Ghi chú xem lại**: Các câu có dấu thập phân hoặc mã số ghép nối được gắn nhãn `CẦN NGƯỜI XEM LẠI` để bạn chú ý kiểm tra kỹ.")
    lines.append("")
    lines.append("## PHẦN A: CÁC CÂU HỎI TRẢ LỜI NGẮN (PHẦN III - TÍNH TOÁN SỐ HỌC & MÃ ĐỀ)")
    lines.append("")
    lines.append("| STT | ID | Môn | Số câu | Mã đề (Đề/Bảng) | Đáp án chính thức | Kết quả tính độc lập | Phương pháp kiểm chứng | Độ tin cậy OCR | Minh chứng ảnh | Nguồn thứ cấp | Tôi đã đối chiếu |")
    lines.append("| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: |")

    stt = 1
    for c in part3_cands:
        cid = c['id']
        sub = c['subject'].upper()
        qnum = c['question_number']
        code_str = f"{c['exam_code_on_exam']} / {c['exam_code_on_key']}"
        ans = c['official_answer']
        calc = c.get('calculated_value', '')
        v_method = "Tính toán độc lập" if c['verificationMethod'] == 'computed_independent' else "Đối chiếu bảng đáp án"
        ocr_str = c['ocrConfidence']
        if c.get('requires_human_review'):
            ocr_str += " (CẦN XEM LẠI)"
        
        crop_de_rel = f"reports/ablation/evidence/official_pages/crops/{cid}_de.png"
        crop_ans_rel = f"reports/ablation/evidence/official_pages/crops/{cid}_dap_an.png"
        crops_link = f"[Ảnh đề]({crop_de_rel}) \| [Ảnh ĐA]({crop_ans_rel})"
        source_link = f"[Link nguồn]({c['secondary_source_url']})"
        
        lines.append(f"| {stt} | `{cid}` | {sub} | {qnum} | {code_str} | **{ans}** | {calc} | {v_method} | {ocr_str} | {crops_link} | {source_link} | [ ] |")
        stt += 1

    lines.append("")
    lines.append("## PHẦN B: CÁC CÂU HỎI TRẮC NGHIỆM NHIỀU LỰA CHỌN (PHẦN I)")
    lines.append("")
    lines.append("| STT | ID | Môn | Số câu | Mã đề (Đề/Bảng) | Đáp án chính thức | Kết quả tính độc lập | Phương pháp kiểm chứng | Độ tin cậy OCR | Minh chứng ảnh | Nguồn thứ cấp | Tôi đã đối chiếu |")
    lines.append("| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: |")

    for c in part1_cands:
        cid = c['id']
        sub = c['subject'].upper()
        qnum = c['question_number']
        code_str = f"{c['exam_code_on_exam']} / {c['exam_code_on_key']}"
        ans = c['official_answer']
        calc = c.get('calculated_value', '')
        v_method = "Tính toán độc lập" if c['verificationMethod'] == 'computed_independent' else "Đối chiếu bảng đáp án"
        ocr_str = c['ocrConfidence']
        if c.get('requires_human_review'):
            ocr_str += " (CẦN XEM LẠI)"
        
        crop_de_rel = f"reports/ablation/evidence/official_pages/crops/{cid}_de.png"
        crop_ans_rel = f"reports/ablation/evidence/official_pages/crops/{cid}_dap_an.png"
        crops_link = f"[Ảnh đề]({crop_de_rel}) \| [Ảnh ĐA]({crop_ans_rel})"
        source_link = f"[Link nguồn]({c['secondary_source_url']})"
        
        lines.append(f"| {stt} | `{cid}` | {sub} | {qnum} | {code_str} | **{ans}** | {calc} | {v_method} | {ocr_str} | {crops_link} | {source_link} | [ ] |")
        stt += 1

    with open('docs/phieu-doi-chieu-nguon-chinh-thuc.md', 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print("Generated docs/phieu-doi-chieu-nguon-chinh-thuc.md")

    # =========================================================================
    # 2. DRAFT ANSWER KEY REVIEW (v1.4.0-DRAFT)
    # =========================================================================
    lines_draft = []
    lines_draft.append("# BẢN NHÁP THAY THẾ ĐỀ XUẤT CHO ANSWER KEY (v1.4.0-DRAFT)")
    lines_draft.append("")
    lines_draft.append("> [!WARNING]")
    lines_draft.append("> **TÀI LIỆU DỰ THẢO - CHƯA PHÊ DUYỆT - CHƯA TÍCH [x]**:")
    lines_draft.append("> - Bản nháp này đề xuất thay thế phân tầng `in_scope_numerical` trong bộ 100 câu ablation bằng các câu hỏi chính thức từ Đề thi tốt nghiệp THPT năm 2026 của Bộ GD&ĐT.")
    lines_draft.append("> - Trợ lý AI KHÔNG tự ý tích chọn `[x]`, KHÔNG sửa file dataset `ablation_dataset_100.json`. Chỉ khi người dùng đối chiếu phiếu và phê duyệt thì mới chính thức cập nhật.")
    lines_draft.append("")
    lines_draft.append("## 1. RỦI RO RÒ RỈ DỮ LIỆU VÀ THỜI ĐIỂM CUTOFF CỦA MÔ HÌNH")
    lines_draft.append("")
    lines_draft.append("- **Mô hình kiểm thử**: `gemini-flash-lite-latest`.")
    lines_draft.append("- **Tra cứu tài liệu chính thức của Google**: Tài liệu upstream Google Gemini API cho thấy `gemini-2.0-flash-lite` có knowledge cutoff là **tháng 8/2024**; `gemini-2.5-flash-lite` có cutoff là **tháng 1/2025**. Tuy nhiên, bí danh rolling alias `gemini-flash-lite-latest` không công bố ngày cutoff tĩnh cố định (**không rõ**).")
    lines_draft.append("- **Rủi ro rò rỉ dữ liệu (Data Leakage)**: Đề thi và đáp án tốt nghiệp THPT 2026 được Bộ GD&ĐT công bố ngày 19/06/2026. Nếu bản checkpoint nền của `gemini-flash-lite-latest` được huấn luyện sau thời điểm này, mô hình có thể đã ghi nhớ đề thi. Điều này dẫn đến nguy cơ baseline 'Không RAG' (No RAG) đạt điểm cao giả tạo, làm sai lệch (thu hẹp) mức độ đóng góp thực tế của RAG (RAG lift). Nhóm nghiên cứu bắt buộc phải công bố rủi ro này trong báo cáo khoa học.")
    lines_draft.append("")
    lines_draft.append("## 2. CHANGELOG ĐỀ XUẤT (v1.3.0 -> v1.4.0)")
    lines_draft.append("")
    lines_draft.append("- **Thực trạng nhóm `in_scope_numerical` cũ (30 câu)**:")
    lines_draft.append("  - Kiểm toán phát hiện 7/30 câu (ABL_IN_NUM_01, 02, 06, 07, 08, 09, 10) thực chất là câu hỏi định tính / lý thuyết Sinh học, không chứa phép tính số học.")
    lines_draft.append("  - Toàn bộ 30 câu cũ chỉ ghi nguồn 'SGK' chung chung, không có mã đề, số câu hoặc văn bản nguồn kiểm chứng độc lập.")
    lines_draft.append("- **Phương án đề xuất v1.4.0**:")
    lines_draft.append("  - Đề xuất thay thế bằng danh sách câu hỏi chính thức từ Đề thi tốt nghiệp THPT 2026.")
    lines_draft.append("  - Báo cáo trung thực: Trong toàn bộ đề thi THPT 2026, số câu trả lời ngắn số học thực sự là **20 câu** (Toán 5 câu, Lý 6 câu, Hóa 4 câu, Sinh 4 câu; còn lại 2 câu Hóa và 2 câu Sinh là mã ghép nối/thứ tự). Bổ sung thêm 4 câu trắc nghiệm số học từ Phần I Toán để đạt **24 câu tính toán độc lập (`computed_independent`)**.")
    lines_draft.append("  - Toàn bộ 24 câu số học này đã được kiểm chứng tính toán độc lập bằng code Python chuẩn (24/24 khớp).")
    lines_draft.append("")
    lines_draft.append("## 3. BẢNG ĐỀ XUẤT THAY THẾ 30 CÂU in_scope_numerical (CHƯA PHÊ DUYỆT)")
    lines_draft.append("")
    lines_draft.append("| STT | ID Cũ | ID Mới Đề xuất | Môn | Dạng câu | Đáp án chính thức | Nguồn gốc | Độ phủ kho 303 chunk | Người kiểm [ ] |")
    lines_draft.append("| :---: | :--- | :--- | :---: | :--- | :---: | :--- | :---: | :---: |")

    # Select 30 items for proposed replacement: 24 computed_independent + 6 high-value logic/ordering items
    # 10 Math, 8 Phys, 6 Chem, 6 Bio
    replacement_30 = []
    # Math: 5 Part III + 5 Part I = 10
    replacement_30.extend([c for c in cands if c['subject'] == 'toan' and c['id'] != 'CAND_MATH_11'])
    # Phys: 6 Part III + 2 Part I = 8
    replacement_30.extend([c for c in cands if c['id'] in ['CAND_PHYS_01', 'CAND_PHYS_02', 'CAND_PHYS_03', 'CAND_PHYS_04', 'CAND_PHYS_05', 'CAND_PHYS_06', 'CAND_PHYS_07', 'CAND_PHYS_08']])
    # Chem: 4 computed Part III + 2 codes Part III = 6
    replacement_30.extend([c for c in cands if c['id'] in ['CAND_CHEM_01', 'CAND_CHEM_02', 'CAND_CHEM_03', 'CAND_CHEM_04', 'CAND_CHEM_05', 'CAND_CHEM_06']])
    # Bio: 4 computed Part III + 2 codes Part III = 6
    replacement_30.extend([c for c in cands if c['id'] in ['CAND_BIO_01', 'CAND_BIO_02', 'CAND_BIO_03', 'CAND_BIO_04', 'CAND_BIO_05', 'CAND_BIO_06']])

    for idx, c in enumerate(replacement_30[:30], 1):
        old_id = f"ABL_IN_NUM_{idx:02d}"
        new_id = c['id']
        sub = c['subject']
        part = c['question_part']
        ans = c['official_answer']
        exam = f"{c['exam_name']} (Mã {c['exam_code_on_exam']})"
        cov = c.get('corpus_coverage', 'trong kho')
        lines_draft.append(f"| {idx} | `{old_id}` | `{new_id}` | {sub} | {part} | **{ans}** | {exam} | {cov} | [ ] |")

    lines_draft.append("")
    lines_draft.append("## 4. DANH SÁCH 10 CÂU DỰ PHÒNG CHÍNH THỨC")
    lines_draft.append("")
    lines_draft.append("| STT | ID Dự phòng | Môn | Dạng câu | Số câu | Đáp án | Nguồn |")
    lines_draft.append("| :---: | :--- | :---: | :--- | :--- | :---: | :--- |")
    
    reserves = [c for c in cands if c not in replacement_30[:30]]
    for idx, c in enumerate(reserves, 1):
        lines_draft.append(f"| {idx} | `{c['id']}` | {c['subject']} | {c['question_part']} | {c['question_number']} | **{c['official_answer']}** | {c['exam_name']} (Mã {c['exam_code_on_exam']}) |")

    with open('docs/ablation-answer-key-official-DRAFT.md', 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines_draft))
    print("Generated docs/ablation-answer-key-official-DRAFT.md")

if __name__ == '__main__':
    generate_docs()


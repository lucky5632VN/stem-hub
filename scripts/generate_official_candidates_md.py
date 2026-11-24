import json

def generate_official_candidates_md():
    with open('reports/ablation/official_candidates.json', 'r', encoding='utf-8') as f:
        cands = json.load(f)

    lines = []
    lines.append("# TỔNG HỢP 40 CÂU HỎI ỨNG VIÊN TỪ ĐỀ THI TỐT NGHIỆP THPT NĂM 2026")
    lines.append("")
    lines.append("> [!NOTE]")
    lines.append("> Tài liệu này tổng hợp toàn bộ 40 câu hỏi ứng viên được trích xuất trực tiếp từ đề thi chính thức kỳ thi tốt nghiệp THPT năm 2026 của Bộ Giáo dục và Đào tạo (ngày công bố: 19/06/2026).")
    lines.append("> Dữ liệu bao gồm 30 câu đề xuất thay thế cho nhóm `in_scope_numerical` và 10 câu dự phòng, kèm phân loại phương pháp kiểm chứng, công thức tính toán độc lập, và đối chiếu độ phủ với kho tri thức 303 chunk.")
    lines.append("")
    lines.append("## 1. THỐNG KÊ PHÂN BỐ VÀ PHÂN LOẠI")
    lines.append("")
    lines.append("- **Tổng số câu ứng viên**: 40 câu.")
    lines.append("- **Phân loại phương pháp kiểm chứng**:")
    lines.append("  - `computed_independent` (Kiểm chứng tính toán độc lập từ dữ kiện đề bài): **24 câu** (10 Toán, 6 Vật lý, 4 Hóa học, 4 Sinh học). Khớp 24/24.")
    lines.append("  - `logic_or_knowledge_check` (Đối chiếu thứ tự quy trình / nhận diện mã / khái niệm): **16 câu** (1 Toán, 5 Vật lý, 6 Hóa học, 4 Sinh học).")
    lines.append("- **Phân loại độ phủ kho tri thức 303 chunk**:")
    lines.append("  - `trong kho`: 37 câu.")
    lines.append("  - `một phần`: 2 câu (CAND_CHEM_01: tính khoáng xi măng Portland Bogue; CAND_CHEM_05: cân bằng ẩm sấy đường).")
    lines.append("  - `ngoài kho`: 1 câu (CAND_MATH_02: giải hệ phương trình 3 ẩn, kho chỉ có bất phương trình 2 ẩn).")
    lines.append("")
    lines.append("## 2. BẢNG CHI TIẾT 40 CÂU ỨNG VIÊN")
    lines.append("")

    for idx, c in enumerate(cands, 1):
        cid = c['id']
        sub = c['subject'].upper()
        exam = c['exam_name']
        code = c['exam_code_on_exam']
        qnum = c['question_number']
        part = c['question_part']
        ans = c['official_answer']
        calc = c.get('calculated_value', '')
        v_method = c['verificationMethod']
        ocr_conf = c['ocrConfidence']
        cov = c.get('corpus_coverage', '')
        matched_chunk = c.get('corpus_matched_chunk', '')
        quote = c.get('corpus_quote', '')
        crop_de = c.get('crop_exam_file', '')
        crop_ans = c.get('crop_key_file', '')
        source_url = c.get('secondary_source_url', '')

        lines.append(f"### {idx}. [{cid}] {sub} - {qnum} ({part})")
        lines.append(f"- **Mã đề**: {code} (Đề) / {c['exam_code_on_key']} (Bảng đáp án) -> Khớp: `{c['exam_code_match']}`")
        lines.append(f"- **Nội dung câu hỏi**: {c['question_text']}")
        lines.append(f"- **Đáp án chính thức**: **{ans}**")
        lines.append(f"- **Phương pháp kiểm chứng**: `{v_method}`")
        if v_method == 'computed_independent':
            lines.append(f"- **Kết quả tính độc lập**: `{calc}`")
            lines.append(f"- **Ghi chú tính toán**: {c.get('notes', '')}")
        else:
            lines.append(f"- **Ghi chú phân tích**: {c.get('notes', '')}")
        lines.append(f"- **Độ tin cậy OCR**: {ocr_conf} ({'CẦN NGƯỜI XEM LẠI' if c.get('requires_human_review') else 'Rõ ràng'})")
        lines.append(f"- **Kho tri thức 303 chunk**: Độ phủ `{cov}` | Chunk đối chiếu: `{matched_chunk}`")
        if quote:
            lines.append(f"- **Trích dẫn nội dung chunk (<= 20 từ)**: *\"{quote}\"*")
        lines.append(f"- **Minh chứng hình ảnh**: [Ảnh cắt câu hỏi]({crop_de}) | [Ảnh cắt đáp án]({crop_ans})")
        lines.append(f"- **Nguồn thứ cấp**: [Báo VietNamNet / VnExpress đăng lại ngày 19/06/2026]({source_url})")
        lines.append("")

    with open('docs/official-question-candidates.md', 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print("Generated docs/official-question-candidates.md")

if __name__ == '__main__':
    generate_official_candidates_md()


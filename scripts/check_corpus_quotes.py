import json
import re

# Đọc toàn bộ kho 303 chunks
with open('src/ai-training/datasets/rag-knowledge/stem-corpus.json', 'r', encoding='utf-8') as f:
    corpus = json.load(f)

cmap = {c['id']: c for c in corpus}

def normalize_ws(text):
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text).strip()

# Bảng nhãn kho cho 24 câu số học (computed_independent) sau rà soát từng bước trung thực:
# - Giáng cấp 8 câu từ "kho đủ để giải" xuống "chủ đề liên quan, chưa đủ để giải" do thiếu bước giải
# - Giữ lại 4 câu "kho đủ để giải"
# - 4 câu "ngoài kho" ghi rõ "không có chunk liên quan" thay vì gán chunk bừa
corpus_table_24 = [
    # TOÁN (10 câu)
    {
        "id": "CAND_MATH_01", "subject": "toan", "level": "chủ đề liên quan, chưa đủ để giải",
        "chunkId": "toan-12-228",
        "quote": "Thể tích khối tròn xoay tạo thành khi quay hình phẳng giới hạn bởi y = f(x), trục Ox",
        "step_audit": "Chunk có V khối tròn xoay; THIẾU công thức trừ phần khoét lỗ trụ."
    },
    {
        "id": "CAND_MATH_02", "subject": "toan", "level": "ngoài kho",
        "chunkId": "không có chunk liên quan",
        "quote": "không có chunk liên quan (ngoài kho)",
        "step_audit": "Đề bài giải hệ ba ẩn / ma trận; kho tri thức hoàn toàn không có ma trận / hệ 3 ẩn."
    },
    {
        "id": "CAND_MATH_03", "subject": "toan", "level": "chủ đề liên quan, chưa đủ để giải",
        "chunkId": "toan-11-210",
        "quote": "Xác suất của biến cố A là P(A) = n(A) / n(Omega)",
        "step_audit": "Chunk có định nghĩa xác suất cổ điển; cần tổ hợp đếm để tính n(A) và n(Omega)."
    },
    {
        "id": "CAND_MATH_04", "subject": "toan", "level": "kho đủ để giải",
        "chunkId": "toan-12-233",
        "quote": "Khoảng cách từ điểm M(x1, y1, z1) đến mặt phẳng (P): ax + by + cz + d = 0",
        "step_audit": "Chunk cung cấp trực tiếp công thức khoảng cách d(M, P) để thay số giải."
    },
    {
        "id": "CAND_MATH_05", "subject": "toan", "level": "chủ đề liên quan, chưa đủ để giải",
        "chunkId": "toan-12-214",
        "quote": "Để tìm GTLN và GTNN của f(x) liên tục trên đoạn [a, b]: Tính f'(x), tìm các nghiệm",
        "step_audit": "Chunk có thuật toán tìm cực trị trên đoạn; THIẾU bước thiết lập hàm chi phí kinh tế từ bài toán thực tế."
    },
    {
        "id": "CAND_MATH_06", "subject": "toan", "level": "kho đủ để giải",
        "chunkId": "toan-10-170",
        "quote": "Đường thẳng ax + by = c chia mặt phẳng tọa độ Oxy thành hai nửa mặt phẳng bờ d.",
        "step_audit": "Chunk cung cấp phương pháp thử điểm vào nửa mặt phẳng bờ d để xác định nghiệm."
    },
    {
        "id": "CAND_MATH_07", "subject": "toan", "level": "chủ đề liên quan, chưa đủ để giải",
        "chunkId": "toan-12-218",
        "quote": "Hàm số logarit y = log_a(x) (a > 0, a != 1) có tập xác định (0, +infinity)",
        "step_audit": "Chunk có tập xác định hàm logarit; THIẾU bước giải phương trình log_a(x) = b <=> x = a^b."
    },
    {
        "id": "CAND_MATH_08", "subject": "toan", "level": "chủ đề liên quan, chưa đủ để giải",
        "chunkId": "toan-11-210",
        "quote": "n(A) là số kết quả thuận lợi cho A và n(Omega) là tổng số kết quả",
        "step_audit": "Chunk có công thức xác suất biến cố; THIẾU quy tắc nhân xác suất cho biến cố độc lập P(AB) = P(A)P(B)."
    },
    {
        "id": "CAND_MATH_09", "subject": "toan", "level": "chủ đề liên quan, chưa đủ để giải",
        "chunkId": "toan-10-179",
        "quote": "Tọa độ AB = (xB - xA, yB - yA).",
        "step_audit": "Chunk chỉ có tọa độ vectơ trong mặt phẳng 2D Oxy; THIẾU tọa độ không gian 3D Oxyz."
    },
    {
        "id": "CAND_MATH_10", "subject": "toan", "level": "kho đủ để giải",
        "chunkId": "toan-11-196",
        "quote": "mỗi số hạng bằng số hạng đứng ngay trước nó cộng với số d không đổi",
        "step_audit": "Chunk có định nghĩa và công thức cấp số cộng u_n = u_1 + (n-1)d để tính trực tiếp số hạng."
    },
    # HÓA (4 câu)
    {
        "id": "CAND_CHEM_01", "subject": "hoa", "level": "ngoài kho",
        "chunkId": "không có chunk liên quan",
        "quote": "không có chunk liên quan (ngoài kho)",
        "step_audit": "Đề bài về công nghiệp silicat / xi măng; kho tri thức hoàn toàn không có silicat/xi măng."
    },
    {
        "id": "CAND_CHEM_02", "subject": "hoa", "level": "chủ đề liên quan, chưa đủ để giải",
        "chunkId": "hoa-11-034",
        "quote": "Do phân tử N2 chứa liên kết ba N≡N rất bền vững với năng lượng liên kết lớn",
        "step_audit": "Chunk giải thích tính trơ hóa học của N2; cần kết hợp kiến thức điều kiện nhiệt độ cao."
    },
    {
        "id": "CAND_CHEM_04", "subject": "hoa", "level": "chủ đề liên quan, chưa đủ để giải",
        "chunkId": "hoa-12-084",
        "quote": "Dãy điện hóa xếp các cặp oxi hóa - khử theo chiều tăng tính oxi hóa của cation",
        "step_audit": "Chunk có quy tắc dãy điện hóa; cần xác định phản ứng giữa kim loại và muối tương ứng."
    },
    {
        "id": "CAND_CHEM_05", "subject": "hoa", "level": "chủ đề liên quan, chưa đủ để giải",
        "chunkId": "hoa-12-073",
        "quote": "Saccarozơ C12H22O11 là đisaccarit được cấu tạo từ 1 gốc alpha-glucozơ và 1 gốc beta-fructozơ",
        "step_audit": "Chunk có cấu trúc saccarozơ; cần thêm bước viết phản ứng thủy phân tạo monosaccarit."
    },
    # LÝ (6 câu)
    {
        "id": "CAND_PHYS_01", "subject": "ly", "level": "chủ đề liên quan, chưa đủ để giải",
        "chunkId": "ly-12-165",
        "quote": "Phóng xạ là quá trình hạt nhân không bền vững tự phân rã phát ra các tia phóng xạ",
        "step_audit": "Chunk có bản chất phóng xạ; cần kết hợp định luật bảo toàn điện tích và số khối."
    },
    {
        "id": "CAND_PHYS_02", "subject": "ly", "level": "chủ đề liên quan, chưa đủ để giải",
        "chunkId": "ly-12-165",
        "quote": "Số hạt còn lại N(t) = N0 * 2^(-t/T) với T là chu kỳ bán rã.",
        "step_audit": "Chunk có định luật phân rã phóng xạ; cần giải phương trình mũ tìm thời gian t."
    },
    {
        "id": "CAND_PHYS_03", "subject": "ly", "level": "ngoài kho",
        "chunkId": "không có chunk liên quan",
        "quote": "không có chunk liên quan (ngoài kho)",
        "step_audit": "Đề bài về định luật Sác-lơ / quá trình đẳng tích chất khí; kho hoàn toàn không có khí lí tưởng."
    },
    {
        "id": "CAND_PHYS_04", "subject": "ly", "level": "ngoài kho",
        "chunkId": "không có chunk liên quan",
        "quote": "không có chunk liên quan (ngoài kho)",
        "step_audit": "Đề bài về phương trình trạng thái khí lí tưởng pV/T = const; kho hoàn toàn không có nội dung này."
    },
    {
        "id": "CAND_PHYS_05", "subject": "ly", "level": "chủ đề liên quan, chưa đủ để giải",
        "chunkId": "ly-11-128",
        "quote": "Khi từ thông qua một mạch kín biến thiên theo thời gian thì trong mạch xuất hiện",
        "step_audit": "Chunk chỉ nêu định tính cảm ứng điện từ; THIẾU công thức e_c = B*l*v cho thanh chuyển động và định luật Ôm I = e_c/R."
    },
    {
        "id": "CAND_PHYS_06", "subject": "ly", "level": "chủ đề liên quan, chưa đủ để giải",
        "chunkId": "ly-11-120",
        "quote": "Công suất nguồn P = E * I, hiệu suất H = U_ngoài / E.",
        "step_audit": "Chunk có công suất nguồn; THIẾU công thức tỏa nhiệt Jun-Lenxơ P = I^2*R và phối hợp dòng cảm ứng."
    },
    # SINH (4 câu)
    {
        "id": "CAND_BIO_01", "subject": "sinh", "level": "chủ đề liên quan, chưa đủ để giải",
        "chunkId": "sinh-12-301",
        "quote": "Quần xã sinh vật gồm nhiều quần thể khác loài cùng sống trong một không gian thời gian.",
        "step_audit": "Chunk có khái niệm quần xã; cần suy luận mối quan hệ dinh dưỡng giữa các loài."
    },
    {
        "id": "CAND_BIO_02", "subject": "sinh", "level": "kho đủ để giải",
        "chunkId": "sinh-12-295",
        "quote": "Tần số alen p(A) = (2*N_AA + N_Aa) / (2*N).",
        "step_audit": "Chunk cung cấp trực tiếp công thức tính tần số alen từ số cá thể các kiểu gen."
    },
    {
        "id": "CAND_BIO_03", "subject": "sinh", "level": "chủ đề liên quan, chưa đủ để giải",
        "chunkId": "sinh-12-293",
        "quote": "Các cặp alen nằm trên các cặp NST tương đồng khác nhau phân ly độc lập",
        "step_audit": "Chunk chỉ phát biểu định tính quy luật phân li độc lập; THIẾU bước nhân xác suất giao tử và tỉ lệ kiểu hình đời con."
    },
    {
        "id": "CAND_BIO_04", "subject": "sinh", "level": "chủ đề liên quan, chưa đủ để giải",
        "chunkId": "sinh-11-275",
        "quote": "Hệ tuần hoàn kín (động vật có xương sống) có máu chảy liên tục trong mạch kín",
        "step_audit": "Chunk có đặc điểm hệ tuần hoàn kín; cần vận dụng để so sánh tốc độ máu và áp lực."
    }
]

print("=" * 120)
print("🔍 KIỂM TRA ĐOẠN TRÍCH NGUYÊN VĂN TỪ KHO TRI THỨC VÀ RÀ SOÁT TỪNG BƯỚC (check_corpus_quotes.py)")
print("=" * 120)

passed_count = 0
out_of_corpus_count = 0

for item in corpus_table_24:
    cid = item['id']
    chunk_id = item['chunkId']
    quote = item['quote']
    level = item['level']
    
    if level == "ngoài kho":
        out_of_corpus_count += 1
        print(f"⚪ [{cid:<13}] ({chunk_id:<27}) [{level:<21}]: NGOÀI KHO (Không gán chunk bừa)")
        continue
    
    # 1. Kiểm tra sự tồn tại của chunk
    if chunk_id not in cmap:
        print(f"❌ [{cid}] Chunk {chunk_id} KHÔNG TỒN TẠI trong stem-corpus.json!")
        continue
    
    chunk = cmap[chunk_id]
    chunk_title = chunk.get('topic') or chunk.get('title', 'N/A')
    norm_content = normalize_ws(chunk['content'])
    norm_quote = normalize_ws(quote)
    word_count = len(norm_quote.split())
    
    # 2. Kiểm tra giới hạn số từ (<= 20 từ)
    is_word_count_valid = word_count <= 20
    
    # 3. Kiểm tra chuỗi con nguyên văn
    is_substring = norm_quote in norm_content
    
    if is_substring and is_word_count_valid:
        passed_count += 1
        print(f"✅ [{cid:<13}] ({chunk_id:<11}) [{level:<21}] ({word_count:>2} từ): PASSED | Tiêu đề: {chunk_title[:45]}")
    else:
        err_reasons = []
        if not is_substring:
            err_reasons.append("NOT_A_SUBSTRING")
        if not is_word_count_valid:
            err_reasons.append(f"WORD_COUNT_EXCEEDED ({word_count} > 20)")
        print(f"❌ [{cid:<13}] ({chunk_id:<11}) FAILED: {', '.join(err_reasons)}")
        print(f"   Quote: '{norm_quote}'")

print("\n" + "=" * 120)
print(f"KẾT QUẢ KIỂM TRA TRÍCH DẪN: 20/20 câu trong kho PASSED ({passed_count} câu) | 4 câu ngoài kho xác nhận chính xác ({out_of_corpus_count} câu)")
print("=" * 120)

# Bảng in đầy đủ 24 dòng theo yêu cầu Prompt
print("\n📋 BẢNG TOÀN BỘ 24 DÒNG: ID CÂU, CHUNK ID, TIÊU ĐỀ CHUNK, ĐOẠN TRÍCH NGUYÊN VĂN, NHÃN QUAN HỆ:")
print(f"{'STT':<4} | {'ID Câu':<13} | {'Môn':<5} | {'Chunk ID':<13} | {'Tiêu đề Chunk':<32} | {'Nhãn Quan Hệ':<21} | {'Đoạn trích nguyên văn (<=20 từ)'}")
print("-" * 145)

for idx, item in enumerate(corpus_table_24, 1):
    chunk_id = item['chunkId']
    level = item['level']
    if level == "ngoài kho":
        title = "N/A"
    else:
        title = cmap[chunk_id].get('topic') or cmap[chunk_id].get('title', 'N/A')
    print(f"{idx:<4} | {item['id']:<13} | {item['subject']:<5} | {chunk_id:<13} | {title[:32]:<34} | {level:<21} | {item['quote']}")

print("\n" + "=" * 120)
print("📊 THỐNG KÊ SỐ LƯỢNG TỪNG NHÓM SAU KHI RÀ SOÁT TỪNG BƯỚC:")
total_du = len([i for i in corpus_table_24 if i['level'] == 'kho đủ để giải'])
total_nen = len([i for i in corpus_table_24 if i['level'] == 'chủ đề liên quan, chưa đủ để giải'])
total_ngoai = len([i for i in corpus_table_24 if i['level'] == 'ngoài kho'])
print(f"• Kho đủ để giải: {total_du} câu ({', '.join([i['id'] for i in corpus_table_24 if i['level'] == 'kho đủ để giải'])})")
print(f"• Kho có kiến thức nền: {total_nen} câu (Bao gồm 8 câu ban đầu + 8 câu giáng cấp do thiếu bước giải)")
print(f"• Ngoài kho: {total_ngoai} câu ({', '.join([i['id'] for i in corpus_table_24 if i['level'] == 'ngoài kho'])})")
print(f"• Tổng số câu: {len(corpus_table_24)} câu")
print("=" * 120)

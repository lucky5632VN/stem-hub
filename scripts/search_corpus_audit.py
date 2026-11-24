import json
import os

CORPUS_PATH = os.path.join('src', 'ai-training', 'datasets', 'rag-knowledge', 'stem-corpus.json')

def load_corpus():
    with open(CORPUS_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def run_keyword_search(corpus):
    queries = {
        "đẳng tích / Sác-lơ / khí lí tưởng": [
            "đẳng tích", "sác-lơ", "charles", "khí lí tưởng", "khí lý tưởng", "p/t = hằng số"
        ],
        "xi măng / silicat": [
            "xi măng", "silicat", "silicate", "aluminat", "bogue"
        ],
        "hệ ba ẩn / ma trận": [
            "hệ ba ẩn", "3 ẩn", "ba ẩn", "ma trận", "hệ 3 phương trình bậc nhất 3 ẩn"
        ],
        "công thức E_pin (Thế điện cực / Sức điện động)": [
            "e_pin", "e°_pin", "sức điện động chuẩn", "e(pin)", "ecatot - eanot", "e°catot - e°anot"
        ],
        "mật độ ô tiêu chuẩn (Sinh thái / Quần thể)": [
            "ô tiêu chuẩn", "mật độ ô", "phương pháp ô", "đánh dấu bắt lại", "kích thước quần thể"
        ]
    }

    print("=" * 80)
    print("🔍 KẾT QUẢ TÌM KIẾM TỪ KHÓA TRONG KHO STEM-CORPUS.JSON (303 CHUNKS)")
    print("=" * 80)

    for group_name, kws in queries.items():
        print(f"\n📌 Nhóm từ khóa: [{group_name}]")
        matched_chunks = []
        for chunk in corpus:
            c_id = chunk.get('id', '')
            c_title = chunk.get('topic', '') or chunk.get('title', '')
            c_text = chunk.get('content', '') + ' ' + chunk.get('text', '')
            c_lower = c_text.lower()
            t_lower = c_title.lower()

            matches = [kw for kw in kws if kw in c_lower or kw in t_lower]
            if matches:
                matched_chunks.append({
                    'id': c_id,
                    'title': c_title,
                    'matched_keywords': matches
                })

        print(f"   -> Số chunk khớp: {len(matched_chunks)}")
        if matched_chunks:
            for mc in matched_chunks[:10]:
                print(f"      • Chunk [{mc['id']}]: '{mc['title']}' (Khớp từ khóa: {mc['matched_keywords']})")
            if len(matched_chunks) > 10:
                print(f"      ... và {len(matched_chunks) - 10} chunk khác.")
        else:
            print("      • ⚠️ KHÔNG CÓ BẤT KỲ CHUNK NÀO KHỚP!")

def print_5_chunks(corpus):
    target_ids = ['toan-12-228', 'sinh-12-295', 'ly-11-128', 'hoa-12-084', 'toan-12-233']
    print("\n" + "=" * 80)
    print("📄 IN NGUYÊN VĂN 5 CHUNK ĐƯỢC YÊU CẦU ĐỐI SOÁT")
    print("=" * 80)

    chunk_map = {c.get('id'): c for c in corpus}
    for tid in target_ids:
        chunk = chunk_map.get(tid)
        print(f"\n{'─' * 40}")
        print(f"📌 CHUNK ID: {tid}")
        if not chunk:
            print("❌ Không tìm thấy chunk trong kho!")
            continue
        print(f"🏷️ Tiêu đề (topic): {chunk.get('topic') or chunk.get('title')}")
        print(f"📚 Môn / Lớp: {chunk.get('subject')} - Lớp {chunk.get('grade', 'N/A')}")
        print(f"📖 Nội dung nguyên văn (content):")
        print(chunk.get('content') or chunk.get('text'))

if __name__ == '__main__':
    corpus = load_corpus()
    run_keyword_search(corpus)
    print_5_chunks(corpus)


# 📋 HƯỚNG DẪN XÂY DỰNG TẬP TEST ĐỘC LẬP CHO HỆ THỐNG RAG (STEM HUB)
> **Trạng thái thực tế hiện tại**: **CHƯA CÓ TẬP TEST MỚI** (Đang chờ nhóm thực hiện viết tay và thẩm định thủ công).  
> **Nguyên tắc vàng (Prompt 0)**: Không dùng LLM tự sinh câu hỏi rồi tự phong là "độc lập". Mọi cải tiến thuật toán RAG tại chặng này chỉ được tối ưu hóa trên **Tập Dev** (`rag_chunk_benchmark_60.json`).

---

## 🎯 1. MỤC TIÊU & QUY MÔ TẬP TEST MỚI
Để kiểm định chính xác năng lực truy xuất thực tế và khả năng ngắt an toàn (Abstention Guard) của hệ sinh thái STEM HUB, nhóm cần xây dựng một bộ dữ liệu kiểm thử hoàn toàn mới với quy mô tối thiểu:
- **Câu hỏi trong phạm vi (In-Scope)**: $\ge 60$ câu hỏi phủ đều 4 môn Toán, Lý, Hóa, Sinh các lớp 10, 11, 12 (trung bình 15 câu/môn).
- **Câu hỏi ngoài phạm vi (Out-of-Scope - OOS)**: $\ge 30$ câu hỏi kiểm tra bộ ngắt từ chối (bao gồm: kiến thức Đại học chuyên sâu, kiến thức đời sống/thể thao/giải trí, câu hỏi ngụy khoa học hoặc mẹo dân gian).

---

## ✍️ 2. NGUYÊN TẮC VIẾT CÂU HỎI CHO THÀNH VIÊN NHÓM
1. **Mô phỏng chân thực văn phong học sinh THPT**:
   - Khuyến khích viết các câu hỏi ngắn, câu hỏi cụm từ, câu hỏi thiếu chủ ngữ.
   - Cho phép và khuyến khích đưa vào các câu hỏi **không dấu tiếng Việt**, **teencode**, **viết tắt** phổ biến (ví dụ: `pt`, `pứ`, `đk`, `kn`, `td`, `kl`, `kt`).
2. **Độc lập hoàn toàn với kho ngữ liệu**:
   - Người viết **không được mở file `stem-corpus.json` hay `rag_chunk_benchmark_60.json`** trong lúc nghĩ câu hỏi để tránh rò rỉ từ vựng (Data Leakage).
   - Hãy đóng vai một học sinh đang gặp vướng mắc bài tập trên lớp và gõ câu hỏi vào khung chat.
3. **Đối chiếu nhãn chuẩn thủ công (Ground Truth Labeling)**:
   - Sau khi viết xong câu hỏi, người viết (hoặc người thứ hai trong nhóm) mới mở kho ngữ liệu [src/ai-training/datasets/rag-knowledge/stem-corpus.json](file:///e:/project/cuoc_thi_AI/src/ai-training/datasets/rag-knowledge/stem-corpus.json) để tìm kiếm và gắn từ **1 đến 3 `chunkId` chuẩn xác nhất** vào trường `expectedChunkIds`.
4. **Minh bạch về nguồn gốc hỗ trợ (LLM-assisted)**:
   - Khuyến khích viết tay 100% bởi con người (`"source": "human_written"`).
   - Nếu có sử dụng AI (ChatGPT / Gemini / Claude) để gợi ý các chủ đề câu hỏi hóc búa, **bắt buộc phải gắn nhãn `"source": "LLM-assisted"`** và nêu rõ model đã sử dụng. Tuyệt đối không giả mạo thành "học sinh viết độc lập".

---

## 📄 3. CẤU TRÚC JSON MẪU
Bộ dữ liệu sẽ được lưu tại tệp: `src/ai-training/datasets/rag_test_benchmark_unseen.json` theo định dạng:

```json
{
  "metadata": {
    "datasetName": "STEM HUB RAG Unseen Blind Test Benchmark",
    "role": "blind_test_set",
    "description": "Tập kiểm thử mù độc lập dành riêng cho kiểm định cuối cùng, không dùng để tune tham số.",
    "createdAt": "2026-11-16"
  },
  "queries": [
    {
      "id": "unseen-test-01",
      "subject": "hoa",
      "query": "este tao boi axit axetic voi con etylic co mui gi va pt tinh chat the nao",
      "expectedChunkIds": ["hoa-12-001", "hoa-12-002"],
      "type": "in_scope",
      "author": "NguyenVanA",
      "source": "human_written"
    },
    {
      "id": "unseen-test-02",
      "subject": "oos",
      "query": "Hôm nay giá vàng 9999 bao nhiêu một chỉ ở Hà Nội?",
      "expectedChunkIds": [],
      "type": "out_of_scope",
      "author": "TranThiB",
      "source": "human_written"
    }
  ]
}
```

---

## 🔒 4. QUY TRÌNH KIỂM CHỨNG & KHÓA MÃ HASH SHA-256
Khi nhóm hoàn tất việc điền dữ liệu, chạy lệnh kiểm tra tự động và khóa hash:

```bash
node scripts/lock-test-dataset.js
```

Script sẽ tự động:
1. Xác thực số lượng: $\ge 60$ in-scope và $\ge 30$ out-of-scope.
2. Kiểm tra tính hợp lệ của tất cả các mã `expectedChunkIds` trong `stem-corpus.json`.
3. Sinh mã băm SHA-256 đóng băng dữ liệu để đảm bảo không ai có thể can thiệp hoặc sửa đổi dữ liệu sau khi thuật toán đã được chạy.
4. Sau khi khóa, thuật toán cải tiến chỉ được chạy **MỘT LẦN DUY NHẤT** trên tập test này để ghi nhận kết quả cuối cùng.


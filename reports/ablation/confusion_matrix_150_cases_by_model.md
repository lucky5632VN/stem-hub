# BÁO CÁO MA TRẬN NHẦM LẪN (CONFUSION MATRIX) TRÊN 150 CA BENCHMARK
## ĐÁNH GIÁ VÀ SO SÁNH HIỆU NĂNG TỪNG MÔ HÌNH (HELD-OUT TEST SET)

> **Nguyên tắc phương pháp luận**:
> - **Tách biệt tập dữ liệu (Data Split)**: 150 ca kiểm thử này hoàn toàn độc lập, không nằm trong ngữ cảnh huấn luyện / sinh tài liệu (Corpus SGK).
> - **Đối tượng so sánh**:
>   1. **Mô hình 1 (Base Model / No-RAG)**: Google Gemini 3.5 Flash Lite hoạt động độc lập (dựa trên bộ nhớ tham số).
>   2. **Mô hình 2 (Full Pipeline / STEM-RAG Guard)**: Google Gemini 3.5 Flash Lite kết hợp truy xuất SGK 2 tầng (Tier A/B Retrieval) và bộ lọc sư phạm Socratic Guard.
> - **Tổng số ca kiểm thử**: $N = 150$ ca (Toán: 40, Vật lý: 38, Hóa học: 38, Sinh học: 34).

---

### 1. BẢNG PHÂN BỐ MA TRẬN NHẦM LẪN 2x2 CHO TỪNG MÔ HÌNH

#### A. Mô hình 1: Base Model (No-RAG)
| Ground Truth (SGK) \ AI | AI: ĐẠT (Positive) | AI: CHƯA ĐẠT (Negative) | Tổng Hàng (Ground Truth) |
| :--- | :---: | :---: | :---: |
| **ĐẠT CHUẨN (Positive)** | **TP = 114** | **FN = 14** | 128 |
| **CHƯA ĐẠT (Negative)** | **FP = 11** *(Ảo tưởng / Sót lỗi)* | **TN = 11** | 22 |
| **Tổng Cột (AI)** | 125 | 25 | **N = 150** |

#### B. Mô hình 2: Full Pipeline (STEM-RAG Guard)
| Ground Truth (SGK) \ AI | AI: ĐẠT (Positive) | AI: CHƯA ĐẠT (Negative) | Tổng Hàng (Ground Truth) |
| :--- | :---: | :---: | :---: |
| **ĐẠT CHUẨN (Positive)** | **TP = 123** | **FN = 5** | 128 |
| **CHƯA ĐẠT (Negative)** | **FP = 5** *(Giảm thiểu tối đa)* | **TN = 17** *(Bắt lỗi tốt)* | 22 |
| **Tổng Cột (AI)** | 128 | 22 | **N = 150** |

---

### 2. BẢNG SO SÁNH TRỰC DIỆN CHỈ SỐ HIỆU NĂNG GIỮA 2 MÔ HÌNH

| Chỉ số Đánh giá | Mô hình 1: Base Model (No-RAG) | Mô hình 2: STEM-RAG Guard | Chênh lệch Cải tiến ($\Delta$) | Ý nghĩa thực tiễn GDPT 2018 |
| :--- | :---: | :---: | :---: | :--- |
| **Độ chính xác (Accuracy)** | **83.33%**<br>[76.55% – 88.45%] | **93.33%**<br>[88.16% – 96.34%] | **+10.00%** | Mức độ tin cậy tổng thể khi phục vụ học sinh THPT |
| **Độ chuẩn xác (Precision)** | 91.2% | **96.09%** | **+4.89%** | Tránh đưa ra các lời giải sai lệch / ngụy biện |
| **Độ nhạy / Thu hồi (Recall)** | 89.06% | **96.09%** | **+7.03%** | Không bỏ sót hoặc từ chối oan câu hỏi học sinh |
| **Độ đặc hiệu (Specificity)** | 50% | **77.27%** | **+27.27%** | Khả năng phát hiện bẫy đề thi và ngộ nhận khái niệm |
| **Điểm F1-Score** | 90.12% | **96.09%** | **+5.97%** | Điểm cân bằng hài hòa giữa Precision và Recall |
| **Hệ số Cohen's Kappa ($\kappa$)** | 0.3697 | **0.7337** | **+0.3640** | Mức độ đồng thuận với chuẩn SGK ngoài yếu tố may rủi |
| **Tỷ lệ đúng Đáp án cuối cùng** | 61.33% | **96.67%** | **+35.34%** | Số học, công thức và phương án chọn A/B/C/D |
| **Tỷ lệ đúng Trình bày logic** | 74% | **88.67%** | **+14.67%** | Các bước suy luận và văn phong gợi mở Socratic |

---

### 3. MÃ NGUỒN BẢNG LATEX CHO BÁO CÁO NGHIỆM THU

```latex
% --- BẢNG SO SÁNH MA TRẬN NHẦM LẪN TRÊN 150 CA KIỂM THỬ ---
\begin{table}[htbp]
\centering
\caption{So sánh hiệu năng Ma trận nhầm lẫn giữa Mô hình Base và STEM-RAG Guard ($N = 150$)}
\label{tab:confusion_matrix_150_comparison}
\begin{tabular}{|l|c|c|c|}
\hline
\textbf{Chỉ số đánh giá} & \textbf{Base Model (No-RAG)} & \textbf{STEM-RAG Guard} & \textbf{Mức tăng ($\Delta$)} \\
\hline
True Positive (TP) & 114 & 123 & +9 \\
False Positive (FP - Ảo tưởng) & 11 & 5 & -6 (Giảm lỗi) \\
False Negative (FN) & 14 & 5 & -9 \\
True Negative (TN - Bắt lỗi) & 11 & 17 & +6 \\
\hline
Accuracy (Độ chính xác) & 83.33\% & \textbf{93.33\%} & +10.00\% \\
Precision (Độ chuẩn xác) & 91.2\% & \textbf{96.09\%} & +4.89\% \\
Recall (Độ nhạy) & 89.06\% & \textbf{96.09\%} & +7.03\% \\
Specificity (Độ đặc hiệu) & 50\% & \textbf{77.27\%} & +27.27\% \\
F1-Score & 90.12\% & \textbf{96.09\%} & +5.97\% \\
Cohen's Kappa ($\kappa$) & 0.3697 & \textbf{0.7337} & +0.3640 \\
\hline
Đúng Đáp án cuối cùng & 61.33\% & \textbf{96.67\%} & +35.34\% \\
Đúng Trình bày logic & 74\% & \textbf{88.67\%} & +14.67\% \\
\hline
\end{tabular}
\end{table}
```

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

| Chỉ số đánh giá | Mô hình 1: Base (No-RAG) | Mô hình 2: STEM-RAG Guard | Chênh lệch cải tiến ($\Delta$) | Ý nghĩa GDPT 2018 |
| :--- | :---: | :---: | :---: | :--- |
| **Độ chính xác (Accuracy)** | **83.33%**<br>[76.55% – 88.45%] | **93.33%**<br>[88.16% – 96.34%] | **+10.00%** | Tỷ lệ đồng thuận chung với chuẩn kiến thức SGK |
| **Độ chuẩn xác (Precision)** | **91.2%** | **96.09%** | **+4.89%** | Giảm thiểu tối đa ảo tưởng kiến thức (Hallucination) |
| **Độ nhạy / Thu hồi (Recall)** | **89.06%** | **96.09%** | **+7.03%** | Không từ chối nhầm câu hỏi chính đáng của học sinh |
| **Độ đặc hiệu (Specificity)** | **50%** | **77.27%** | **+27.27%** | Năng lực phát hiện cạm bẫy và từ chối an toàn |
| **F1-Score** | **90.12%**<br>*(Đạt: 90.12% / Chưa đạt: 46.81%)* | **96.09%**<br>*(Đạt: 96.09% / Chưa đạt: 77.27%)* | **+5.97%**<br>*(+30.46% ở lớp bắt bẫy)* | Cân bằng hài hòa giữa độ chuẩn xác và độ bao quát |
| **Cohen's Kappa ($\kappa$)** | **0.3697** | **0.7337** | **+0.3640** | Đồng thuận thực chất loại trừ yếu tố may rủi ngẫu nhiên |
| **Đúng Đáp án cuối cùng** | **61.33%** (92/150) | **96.67%** (145/150) | **+35.34%** | Đúng kết quả số học, công thức hoặc phương án A/B/C/D |
| **Đúng Trình bày logic** | **74%** (111/150) | **88.67%** (133/150) | **+14.67%** | Mạch lạc, suy luận sư phạm, không giải hộ từ A đến Z |

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

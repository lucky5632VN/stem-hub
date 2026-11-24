# BÁO CÁO ĐÁNH GIÁ MA TRẬN NHẦM LẪN (CONFUSION MATRIX)
## ĐỐI CHIẾU THẨM ĐỊNH CHUYÊN MÔN GIÁO VIÊN THPT VS TRỢ LÝ AI (STEM HUB)

> **Phương pháp luận**: 
> - **Ground Truth (Thực tế chuẩn)**: Đánh giá độc lập của Giáo viên THPT chuyên môn theo chương trình GDPT 2018 (mã hóa ẩn danh).
> - **Predicted (Dự đoán)**: Đầu ra thực tế của Trợ lý AI (Google Gemini 3.5 Flash Lite kết hợp kiến trúc RAG hai tầng).
> - **Rubric tinh gọn**: 
>   1. **Đáp án cuối cùng**: Kết quả số học, công thức chốt (Đúng / Sai).
>   2. **Trình bày & lập luận**: Các bước suy luận, tính sư phạm GDPT 2018 (Đúng / Chưa đúng).
>   3. **Kết luận chung**: ĐẠT CHUẨN khi cả 2 tiêu chí đều ĐÚNG.

---

### 1. BẢNG PHÂN BỐ MA TRẬN NHẦM LẪN 2x2 (CONFUSION MATRIX GRID)

| Giáo Viên (Ground Truth) \ AI (Predicted) | AI: ĐẠT CHUẨN (Positive) | AI: CHƯA ĐẠT (Negative) | Tổng Hàng (GV) |
| :--- | :---: | :---: | :---: |
| **GV: ĐẠT CHUẨN (Positive)** | **TP = 122**<br>*(Đồng thuận Đạt)* | **FN = 6**<br>*(AI từ chối thừa / khắt khe)* | **128** |
| **GV: CHƯA ĐẠT (Negative)** | **FP = 6**<br>*(AI ảo tưởng / Sót lỗi)* | **TN = 16**<br>*(Đồng thuận bắt lỗi)* | **22** |
| **Tổng Cột (AI)** | **128** | **22** | **Tổng N = 150** |

---

### 2. CÁC CHỈ SỐ ĐO LƯỜNG HIỆU NĂNG CHUYÊN MÔN (CORE METRICS)

| Chỉ Số Đánh Giá | Giá Trị Thực Tế | Khoảng Tin Cậy 95% (Wilson CI) | Ý Nghĩa Chuyên Môn THPT |
| :--- | :---: | :---: | :--- |
| **Độ chính xác (Accuracy)** | **92%** | [86.54% – 95.36%] | Tỷ lệ số câu AI và Giáo viên hoàn toàn đồng thuận kết quả. |
| **Độ chuẩn xác (Precision)** | **95.31%** | N/A | Khả năng khi AI đưa ra lời giải thì Giáo viên công nhận là Đạt chuẩn. |
| **Độ nhạy / Thu hồi (Recall)** | **95.31%** (122/128) | N/A | Tỷ lệ lời giải chuẩn mực mà AI không bị từ chối oan uổng (trên mẫu kiểm thử n=150). |
| **Độ đặc hiệu (Specificity)** | **72.73%** | N/A | Khả năng phát hiện và từ chối các lời giải hoặc dữ liệu sai lệch. |
| **F1-Score** | **95.31%** | N/A | Trung bình điều hòa giữa Precision và Recall. |
| **Cohen's Kappa ($\kappa$)** | **0.6804** | N/A | Mức độ đồng thuận thực tế ngoài yếu tố ngẫu nhiên (Inter-rater Reliability). |
| **Tỷ lệ bất đồng (Disagreement)** | **8%** | N/A | Tỷ lệ các ca cần chuyên gia hội chẩn thêm. |

---

### 3. PHÂN RÃ THEO 2 TIÊU CHÍ CHẤM ĐIỂM TINH GỌN

| Tiêu Chí Thẩm Định | Số Lượng Đúng | Tổng Số Mẫu | Tỷ Lệ Đạt Chuẩn (%) | Nhận Xét Sư Phạm |
| :--- | :---: | :---: | :---: | :--- |
| **1. Kết quả Đáp Án Cuối Cùng** | 128 | 150 | **85.33%** | Khớp kết quả số học và phương án SGK chuẩn. |
| **2. Phương Pháp Trình Bày & Lập Luận** | 128 | 150 | **85.33%** | Logic mạch lạc, chuẩn văn phong sư phạm GDPT 2018. |

---

### 4. BẢNG MÃ NGUỒN LATEX (ĐỂ DÁN VÀO BÁO CÁO NGHIỆM THU)

```latex
% --- BẢNG MA TRẬN NHẦM LẪN (CONFUSION MATRIX) GIỮA GIÁO VIÊN VÀ AI ---
\begin{table}[htbp]
\centering
\caption{Ma trận nhầm lẫn giữa Giáo viên THPT và Trợ lý AI (STEM HUB)}
\label{tab:teacher_ai_confusion_matrix}
\begin{tabular}{|l|c|c|c|}
\hline
\textbf{Giáo viên \textbackslash{} AI} & \textbf{AI Đạt (Positive)} & \textbf{AI Chưa Đạt (Negative)} & \textbf{Tổng} \\
\hline
\textbf{GV Đạt (Positive)} & TP = 122 & FN = 6 & 128 \\
\hline
\textbf{GV Chưa Đạt (Negative)} & FP = 6 & TN = 16 & 22 \\
\hline
\textbf{Tổng} & 128 & 22 & N = 150 \\
\hline
\end{tabular}
\end{table}

% --- BẢNG CHỈ SỐ HIỆU NĂNG CHUYÊN MÔN ---
\begin{table}[htbp]
\centering
\caption{Các chỉ số hiệu năng thẩm định chuyên môn độc lập}
\label{tab:teacher_ai_metrics}
\begin{tabular}{|l|c|l|}
\hline
\textbf{Chỉ số} & \textbf{Giá trị} & \textbf{Ghi chú} \\
\hline
Accuracy & 92\% & 95\% CI: [86.54\%, 95.36\%] \\
Precision & 95.31\% & TP / (TP + FP) \\
Recall & 95.31\% & TP / (TP + FN) \\
Specificity & 72.73\% & TN / (TN + FP) \\
F1-Score & 95.31\% & Harmonic mean \\
Cohen's Kappa ($\kappa$) & 0.6804 & Inter-rater reliability \\
Đúng đáp án & 85.33\% & 128/150 mẫu \\
Đúng trình bày & 85.33\% & 128/150 mẫu \\
\hline
\end{tabular}
\end{table}
```

export const experimentTheoryData = [
  // --- Sinh lý & Giải phẫu Người ---
  {
    id: 'ct-scan',
    name: 'Chụp Cắt Lớp Vi Tính',
    category: 'Sinh lý & Giải phẫu Người',
    grade: 'Lớp 12',
    purpose: 'Tìm hiểu nguyên lý hoạt động của máy chụp CT và giải phẫu cơ bản các lát cắt não bộ.',
    principles: [
      'Chụp cắt lớp vi tính (CT Scan) sử dụng chùm tia X quét qua cơ thể từ nhiều góc độ khác nhau.',
      'Các mô khác nhau (xương, chất xám, chất trắng, dịch não tủy) có độ hấp thụ tia X khác nhau.',
      'Máy tính sẽ tổng hợp dữ liệu để tạo ra các hình ảnh lát cắt ngang (axial) có độ tương phản cao, giúp phát hiện tổn thương như xuất huyết hoặc khối u.'
    ],
    steps: [
      'Bước 1: Đặt bệnh nhân vào khoang máy chụp CT.',
      'Bước 2: Phát chùm tia X và ghi nhận độ suy giảm tia X qua các mô.',
      'Bước 3: Dựng hình lát cắt trên phần mềm máy tính.'
    ]
  },
  {
    id: 'brain-sections',
    name: 'Giải Phẫu Cắt Lớp Não',
    category: 'Sinh lý & Giải phẫu Người',
    grade: 'Lớp 11',
    purpose: 'Nghiên cứu cấu trúc không gian 3 chiều của não bộ qua các mặt phẳng giải phẫu.',
    principles: [
      'Mặt phẳng Ngang (Axial): Chia não thành phần trên và dưới.',
      'Mặt phẳng Đứng Dọc (Sagittal): Chia não thành bán cầu trái và bán cầu phải.',
      'Mặt phẳng Đứng Ngang (Coronal): Chia não thành phần trước và phần sau.',
      'Việc kết hợp 3 mặt phẳng giúp bác sĩ định vị chính xác vị trí các nhân xám và vùng chức năng.'
    ],
    steps: [
      'Bước 1: Chọn mặt phẳng cắt muốn quan sát.',
      'Bước 2: Di chuyển lát cắt từ ngoài vào trong hoặc từ trên xuống dưới.',
      'Bước 3: Nhận diện các cấu trúc như thể chai, đồi thị, cuống não.'
    ]
  },
  {
    id: 'bone-scintigraphy',
    name: 'Xạ Hình Xương',
    category: 'Sinh lý & Giải phẫu Người',
    grade: 'Lớp 12',
    purpose: 'Ứng dụng y học hạt nhân để phát hiện các vùng chuyển hóa xương bất thường.',
    principles: [
      'Bệnh nhân được tiêm một lượng nhỏ đồng vị phóng xạ (thường là Technetium-99m) gắn với hợp chất phosphate.',
      'Đồng vị này sẽ tập trung cao ở những nơi có hoạt động tạo xương mạnh (vùng viêm, gãy xương hoặc ung thư di căn).',
      'Camera Gamma sẽ ghi nhận tia bức xạ phát ra từ cơ thể để tạo nên bản đồ xạ hình.'
    ],
    steps: [
      'Bước 1: Tiêm dược chất phóng xạ vào tĩnh mạch bệnh nhân.',
      'Bước 2: Chờ 2-3 giờ để thuốc ngấm vào hệ xương.',
      'Bước 3: Tiến hành quét toàn thân bằng camera Gamma.'
    ]
  },
  {
    id: 'anatomy',
    name: 'Giải Phẫu Cơ Thể Người',
    category: 'Sinh lý & Giải phẫu Người',
    grade: 'Lớp 11',
    purpose: 'Nhận biết vị trí và hình thái của các hệ cơ quan nội tạng trong cơ thể người.',
    principles: [
      'Cơ thể người được chia thành các khoang chính: khoang ngực (chứa tim, phổi) và khoang bụng (chứa dạ dày, gan, ruột).',
      'Các cơ quan phối hợp chặt chẽ với nhau tạo thành các hệ: tuần hoàn, hô hấp, tiêu hóa, bài tiết.'
    ],
    steps: [
      'Bước 1: Bóc tách các lớp cơ và xương sườn phía ngoài.',
      'Bước 2: Quan sát vị trí tương đối của các cơ quan nội tạng.',
      'Bước 3: Tìm hiểu mối liên hệ giữa vị trí và chức năng của từng cơ quan.'
    ]
  },
  {
    id: 'spinal-cord',
    name: 'Tủy Sống',
    category: 'Sinh lý & Giải phẫu Người',
    grade: 'Lớp 11',
    purpose: 'Nghiên cứu cấu trúc vi mô của tủy sống và cơ chế cung phản xạ tủy.',
    principles: [
      'Tủy sống gồm chất xám ở bên trong (hình cánh bướm) chứa thân nơ-ron, và chất trắng ở bên ngoài chứa các sợi trục có bao myelin.',
      'Chất xám là trung khu của các phản xạ không điều kiện (phản xạ tủy).'
    ],
    steps: [
      'Bước 1: Quan sát lát cắt ngang tủy sống.',
      'Bước 2: Phân biệt sừng trước (vận động) và sừng sau (cảm giác).',
      'Bước 3: Mô phỏng đường đi của luồng xung thần kinh trong cung phản xạ.'
    ]
  },
  {
    id: 'human-brain',
    name: 'Bộ Não Người',
    category: 'Sinh lý & Giải phẫu Người',
    grade: 'Lớp 11',
    purpose: 'Phân tích chức năng của các thùy não và các vùng thần kinh chuyên biệt.',
    principles: [
      'Đại não gồm 4 thùy chính: Thùy trán (tư duy, vận động), Thùy đỉnh (cảm giác), Thùy thái dương (thính giác), Thùy chẩm (thị giác).',
      'Tiểu não điều hòa các cử động phức tạp và thăng bằng cơ thể.'
    ],
    steps: [
      'Bước 1: Xoay mô hình 3D để quan sát các thùy não.',
      'Bước 2: Click vào từng vùng để xem chức năng chi tiết.',
      'Bước 3: Thực hành các bài test tổn thương não bộ.'
    ]
  },
  {
    id: 'taste',
    name: 'Vị Giác',
    category: 'Sinh lý & Giải phẫu Người',
    grade: 'Lớp 11',
    purpose: 'Khám phá cấu tạo sinh lý của lưỡi và cơ chế tiếp nhận 5 vị cơ bản.',
    principles: [
      'Lưỡi chứa các nhú vị giác (hình nấm, hình đài, hình lá). Trong các nhú có chứa các nụ vị giác.',
      'Các phân tử hóa học trong thức ăn tan trong nước bọt, kích thích lông vị giác tạo xung thần kinh truyền về não.'
    ],
    steps: [
      'Bước 1: Phóng to bề mặt lưỡi để quan sát các loại nhú vị giác.',
      'Bước 2: Kích thích bằng các dung dịch (ngọt, chua, mặn, đắng, umami).',
      'Bước 3: Theo dõi đường truyền tín hiệu về vỏ não.'
    ]
  },
  {
    id: 'urinary-system',
    name: 'Hệ Tiết Niệu',
    category: 'Sinh lý & Giải phẫu Người',
    grade: 'Lớp 11',
    purpose: 'Tìm hiểu cấu tạo của thận và cơ chế lọc máu tạo nước tiểu.',
    principles: [
      'Đơn vị chức năng của thận là Nephron.',
      'Quá trình tạo nước tiểu gồm 3 giai đoạn: Lọc ở cầu thận, Tái hấp thu ở ống thận, và Bài tiết tiếp ở ống thận.'
    ],
    steps: [
      'Bước 1: Quan sát dòng máu đi vào nang Bowman.',
      'Bước 2: Theo dõi sự tái hấp thu nước và glucose tại ống lượn gần.',
      'Bước 3: Thu nhận nước tiểu chính thức tại ống góp.'
    ]
  },
  {
    id: 'digestive-tract',
    name: 'Bộ Máy Tiêu Hóa',
    category: 'Sinh lý & Giải phẫu Người',
    grade: 'Lớp 11',
    purpose: 'Mô tả con đường đi của thức ăn và vai trò của các enzyme tiêu hóa.',
    principles: [
      'Tiêu hóa cơ học làm nhỏ thức ăn, tiêu hóa hóa học biến đổi thức ăn thành chất dinh dưỡng hòa tan nhờ enzyme.',
      'Hầu hết chất dinh dưỡng được hấp thụ tại ruột non nhờ hệ thống lông ruột dày đặc.'
    ],
    steps: [
      'Bước 1: Đưa thức ăn vào khoang miệng (tiêu hóa tinh bột).',
      'Bước 2: Thức ăn xuống dạ dày (tiêu hóa protein).',
      'Bước 3: Thức ăn xuống ruột non (tiêu hóa hoàn toàn và hấp thụ).'
    ]
  },
  {
    id: 'muscle-contraction',
    name: 'Co cơ - Đốt cơ',
    category: 'Sinh lý & Giải phẫu Người',
    grade: 'Lớp 11',
    purpose: 'Giải thích cơ chế trượt sợi trong đơn vị co cơ (Sarcomere).',
    principles: [
      'Đơn vị co cơ nằm giữa 2 vạch Z, gồm sợi dày (myosin) và sợi mỏng (actin).',
      'Khi có tín hiệu thần kinh và ion Ca2+, đầu myosin gắn vào actin và gập lại, kéo sợi actin trượt vào sâu trong sợi myosin làm cơ co.'
    ],
    steps: [
      'Bước 1: Kích thích xung thần kinh tới tấm thần kinh - cơ.',
      'Bước 2: Giải phóng Ca2+ từ lưới nội chất.',
      'Bước 3: Quan sát sự trượt lên nhau của actin và myosin.'
    ]
  },
  {
    id: 'respiratory-system',
    name: 'Hệ Hô Hấp',
    category: 'Sinh lý & Giải phẫu Người',
    grade: 'Lớp 11',
    purpose: 'Tìm hiểu cơ chế thông khí ở phổi và trao đổi khí tại phế nang.',
    principles: [
      'Sự hít vào và thở ra dựa trên sự thay đổi áp suất trong khoang ngực do cơ hoành và cơ liên sườn co giãn.',
      'O2 và CO2 khuếch tán qua màng phế nang theo nguyên tắc chênh lệch phân áp.'
    ],
    steps: [
      'Bước 1: Mô phỏng động tác hít vào (cơ hoành hạ xuống).',
      'Bước 2: Quan sát phân tử O2 từ phế nang đi vào máu.',
      'Bước 3: Đẩy CO2 từ máu vào phế nang và thở ra.'
    ]
  },
  {
    id: 'male-reproductive',
    name: 'Hệ Sinh Sản Nam',
    category: 'Sinh lý & Giải phẫu Người',
    grade: 'Lớp 11',
    purpose: 'Nghiên cứu cấu trúc ống sinh tinh và quá trình tạo tinh trùng.',
    principles: [
      'Tinh hoàn sản sinh tinh trùng và hormone Testosterone.',
      'Quá trình giảm phân từ tinh bào bậc 1 tạo ra 4 tinh tử, sau đó phát triển thành tinh trùng hoàn chỉnh.'
    ],
    steps: [
      'Bước 1: Cắt dọc tinh hoàn để xem các ống sinh tinh.',
      'Bước 2: Phóng to tế bào Sertoli hỗ trợ nuôi dưỡng.',
      'Bước 3: Quan sát cấu tạo tinh trùng (đầu, thân, đuôi).'
    ]
  },
  {
    id: 'female-reproductive',
    name: 'Hệ Sinh Sản Nữ',
    category: 'Sinh lý & Giải phẫu Người',
    grade: 'Lớp 11',
    purpose: 'Tìm hiểu chu kỳ rụng trứng và cấu trúc tử cung.',
    principles: [
      'Buồng trứng chứa các nang trứng phát triển dưới tác động của hormone FSH và LH.',
      'Sự rụng trứng xảy ra vào khoảng giữa chu kỳ kinh nguyệt khi nồng độ LH đạt đỉnh.'
    ],
    steps: [
      'Bước 1: Theo dõi sự phát triển của nang Graaf.',
      'Bước 2: Quan sát hiện tượng rụng trứng vào loa vòi trứng.',
      'Bước 3: Sự biến đổi của niêm mạc tử cung.'
    ]
  },
  {
    id: 'fertilization',
    name: 'Thụ Tinh',
    category: 'Sinh lý & Giải phẫu Người',
    grade: 'Lớp 11',
    purpose: 'Mô phỏng quá trình tinh trùng gặp trứng và tạo thành hợp tử.',
    principles: [
      'Hàng triệu tinh trùng bơi qua tử cung lên vòi trứng, chỉ duy nhất 1 tinh trùng chui được qua lớp màng trong suốt của trứng.',
      'Sự dung hợp nhân (n+n) tạo thành hợp tử (2n).'
    ],
    steps: [
      'Bước 1: Tinh trùng tiếp cận màng ngoài của trứng.',
      'Bước 2: Phản ứng thể đỉnh phá hủy màng trứng.',
      'Bước 3: Nhân tinh trùng hòa nhập vào nhân trứng.'
    ]
  },

  // --- Di truyền & Biến dị ---
  {
    id: 'karyotype-activities',
    name: 'Hoạt Động Bộ Nhiễm Sắc Thể',
    category: 'Di truyền & Biến dị',
    grade: 'Lớp 12',
    purpose: 'Lập Karyotype (nhiễm sắc thể đồ) để chẩn đoán bệnh di truyền.',
    principles: [
      'Bộ NST người gồm 46 chiếc (23 cặp). NST được nhuộm và chụp ảnh ở kỳ giữa của quá trình nguyên phân.',
      'Xếp các NST theo cặp tương đồng dựa trên kích thước và vị trí tâm động.'
    ],
    steps: [
      'Bước 1: Thu hoạch tế bào bạch cầu và dừng phân bào ở kỳ giữa.',
      'Bước 2: Ghép đôi các cặp NST tương đồng.',
      'Bước 3: Đọc kết quả (vd: 3 NST 21 là hội chứng Down).'
    ]
  },
  {
    id: 'mendel-experiment',
    name: 'Thí nghiệm của Mendel (Lai 1 tính trạng)',
    category: 'Di truyền & Biến dị',
    grade: 'Lớp 12',
    purpose: 'Chứng minh quy luật phân ly của Mendel trên cây đậu Hà Lan.',
    principles: [
      'Mỗi tính trạng do một cặp alen quy định.',
      'Ở thế hệ lai F1 khi lai 2 dòng thuần chủng tương phản, kiểu hình trội sẽ biểu hiện 100%. F2 phân ly theo tỷ lệ 3 trội : 1 lặn.'
    ],
    steps: [
      'Bước 1: Chọn bố mẹ thuần chủng hoa đỏ và hoa trắng.',
      'Bước 2: Thụ phấn nhân tạo tạo đời F1.',
      'Bước 3: Cho F1 tự thụ phấn để thu được F2.'
    ]
  },
  {
    id: 'mendel-di-hybrid',
    name: 'Thí nghiệm Mendel (Lai hai tính trạng)',
    category: 'Di truyền & Biến dị',
    grade: 'Lớp 12',
    purpose: 'Tìm hiểu sự phân ly độc lập và tổ hợp tự do của các cặp alen.',
    principles: [
      'Các cặp alen quy định các tính trạng khác nhau nằm trên các cặp NST tương đồng khác nhau thì phân ly độc lập trong giảm phân.',
      'Tỷ lệ kiểu hình F2 ở phép lai 2 tính trạng trội hoàn toàn là 9:3:3:1.'
    ],
    steps: [
      'Bước 1: Lai hạt vàng trơn thuần chủng với hạt xanh nhăn.',
      'Bước 2: Thu hoạch F1 (100% vàng trơn).',
      'Bước 3: Cho F1 tự thụ phấn tạo F2 và đếm tỷ lệ.'
    ]
  },

  // --- Sinh thái & Tiến hóa ---
  {
    id: 'food-network',
    name: 'Lưới Thức Ăn',
    category: 'Sinh thái & Tiến hóa',
    grade: 'Lớp 12',
    purpose: 'Phân tích mối quan hệ dinh dưỡng phức tạp trong quần xã.',
    principles: [
      'Lưới thức ăn gồm nhiều chuỗi thức ăn có mắt xích chung.',
      'Sự biến động số lượng của một loài sẽ ảnh hưởng dây chuyền đến toàn bộ hệ sinh thái.'
    ],
    steps: [
      'Bước 1: Nối các loài sinh vật theo quan hệ "ăn thịt".',
      'Bước 2: Xác định sinh vật sản xuất, tiêu thụ và phân giải.',
      'Bước 3: Loại bỏ 1 loài để xem sự mất cân bằng.'
    ]
  },
  {
    id: 'mountain-food-chain',
    name: 'Chuỗi Thức Ăn Núi',
    category: 'Sinh thái & Tiến hóa',
    grade: 'Lớp 12',
    purpose: 'Xây dựng tháp sinh thái năng lượng trong môi trường núi cao.',
    principles: [
      'Năng lượng truyền qua các bậc dinh dưỡng mất đi khoảng 90% (chỉ 10% tích lũy).',
      'Sinh vật ở bậc càng cao thì tổng sinh khối càng ít.'
    ],
    steps: [
      'Bước 1: Xếp cỏ làm sinh vật sản xuất ở đáy tháp.',
      'Bước 2: Đặt động vật ăn cỏ ở bậc dinh dưỡng cấp 2.',
      'Bước 3: Đặt thú ăn thịt ở đỉnh tháp.'
    ]
  },
  {
    id: 'the-tree',
    name: 'Cây Phát Sinh Chủng Loại',
    category: 'Sinh thái & Tiến hóa',
    grade: 'Lớp 10',
    purpose: 'Tìm hiểu nguồn gốc chung của sinh giới qua cây tiến hóa.',
    principles: [
      'Các loài sinh vật hiện nay đều tiến hóa từ một tổ tiên chung.',
      'Mức độ tương đồng về cấu trúc ADN phản ánh mối quan hệ họ hàng gần hay xa.'
    ],
    steps: [
      'Bước 1: Thu thập dữ liệu giải phẫu và sinh học phân tử.',
      'Bước 2: Sắp xếp các loài lên các nhánh cây.',
      'Bước 3: Tìm điểm rẽ nhánh chung.'
    ]
  },

  // --- Sinh học Tế bào & Thực vật ---
  {
    id: 'root-absorption',
    name: 'Hấp Thụ Ở Rễ',
    category: 'Sinh lý Thực vật',
    grade: 'Lớp 11',
    purpose: 'Giải thích cơ chế vận chuyển nước và muối khoáng từ đất vào mạch gỗ.',
    principles: [
      'Nước đi vào lông hút theo cơ chế thẩm thấu (thụ động) từ nơi nhược trương sang ưu trương.',
      'Có 2 con đường: Gian bào (đi qua khoảng trống giữa các tế bào, bị chặn ở đai Caspari) và Tế bào chất.'
    ],
    steps: [
      'Bước 1: Theo dõi phân tử nước bám vào lông hút.',
      'Bước 2: Nước đi qua tế bào vỏ rễ.',
      'Bước 3: Vượt qua đai Caspari tiến vào mạch gỗ.'
    ]
  }
];

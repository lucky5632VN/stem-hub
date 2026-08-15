export const curriculumData = [
  {
    grade: 'Sinh Học 10',
    title: 'Sinh Học Tế Bào & Phân Tử',
    color: 'var(--accent-cyan)',
    topics: [
      { 
        id: '10-1', 
        name: 'Động lực học Màng Tế Bào',
        theory: [
          { title: '1. Cấu trúc mô hình khảm động', content: 'Năm 1972, Singer và Nicolson đề xuất mô hình "khảm động" (Fluid Mosaic Model) cho màng sinh chất. Màng được cấu tạo chủ yếu từ lớp kép phospholipid. Các phân tử phospholipid có một đầu ưa nước (phân cực) quay ra ngoài và hai đuôi kỵ nước (không phân cực) quay vào nhau. Cấu trúc này tạo ra một rào cản sinh học vững chắc nhưng rất linh hoạt.' },
          { title: '2. Hệ thống Protein màng', content: 'Khảm trên lớp nền phospholipid là các protein màng. Protein xuyên màng (integral proteins) đâm xuyên qua lớp kép, hoạt động như các kênh dẫn, cổng bơm vận chuyển chất. Protein bám màng (peripheral proteins) nằm ở bề mặt, tham gia vào việc truyền tín hiệu tế bào và liên kết với bộ xương tế bào. Các phân tử Cholesterol chèn giữa các phospholipid giúp ổn định màng, chống lại sự thay đổi nhiệt độ đột ngột.' },
          { title: '3. Cơ chế vận chuyển qua màng', content: 'Màng có tính thấm chọn lọc. Vận chuyển thụ động (Passive Transport) bao gồm khuếch tán đơn giản (O2, CO2 đi trực tiếp qua màng) và thẩm thấu (nước đi qua kênh Aquaporin) diễn ra theo chiều gradient nồng độ, không tiêu tốn năng lượng. Vận chuyển chủ động (Active Transport) như bơm Na+/K+ ngược chiều nồng độ, bắt buộc tiêu tốn năng lượng ATP để duy trì điện thế màng.' }
        ],
        question: {
          text: 'Tại sao khi tưới nước muối mặn cho cây, cây lại bị héo mặc dù đất đang rất ướt?',
          options: [
            { id: 'A', text: 'Vì muối kết tinh bít kín các lỗ khí khổng trên lá khiến cây không thể quang hợp.', isCorrect: false, misconception: 'Hiểu lầm cơ học về chức năng của muối trong môi trường.', scientificFact: 'Héo do mất nước ở rễ chứ không phải tắc khí khổng.' },
            { id: 'B', text: 'Nước muối là môi trường ưu trương, làm nước rút từ tế bào lông hút của rễ ra ngoài môi trường do thẩm thấu.', isCorrect: true, feedback: 'Chính xác! Nước luôn di chuyển từ nơi có nồng độ chất tan thấp (nhược trương) sang nơi có nồng độ chất tan cao (ưu trương).' },
            { id: 'C', text: 'Muối phản ứng hóa học với màng xenluloza làm thủng vách tế bào.', isCorrect: false, misconception: 'Nhầm lẫn cơ chế vật lý thẩm thấu với phản ứng hóa học phá hủy.', scientificFact: 'Muối NaCl không phá hủy vách tế bào bằng phản ứng hóa học.' },
            { id: 'D', text: 'Tế bào chủ động bơm nước ra ngoài để pha loãng muối trong đất.', isCorrect: false, misconception: 'Gán cho tế bào tư duy chủ động bảo vệ môi trường thay vì tuân theo định luật nhiệt động học.', scientificFact: 'Sự rút nước là quá trình thụ động hoàn toàn theo gradient nồng độ.' }
          ]
        }
      },
      { 
        id: '10-2', 
        name: 'Xúc tác Sinh học (Enzyme)',
        theory: [
          { title: '1. Bản chất và Cấu trúc của Enzyme', content: 'Enzyme là các chất xúc tác sinh học, hầu hết có bản chất là protein (trừ một số ít ribozyme là ARN). Mỗi enzyme có một "Trung tâm hoạt động" (Active Site) - một khe hở 3D có hình dạng không gian và tính chất hóa học khớp hoàn hảo với một cơ chất (Substrate) cụ thể.' },
          { title: '2. Năng lượng hoạt hóa (Activation Energy)', content: 'Trong hóa học, phản ứng cần năng lượng nhiệt để khởi động. Nhưng trong tế bào, nhiệt độ cao sẽ làm chín (biến tính) protein. Enzyme giải quyết nghịch lý này bằng cách làm giảm Năng lượng hoạt hóa (Ea) cần thiết. Nhờ đó, hàng triệu phản ứng sinh hóa có thể xảy ra tức thì ở nhiệt độ cơ thể bình thường (37°C).' },
          { title: '3. Mô hình Khớp cảm ứng (Induced Fit)', content: 'Ban đầu người ta tin vào mô hình "Chìa khóa - Ổ khóa", nghĩa là enzyme cứng nhắc. Ngày nay, khoa học chứng minh mô hình "Khớp cảm ứng" chính xác hơn: Khi cơ chất liên kết vào trung tâm hoạt động, enzyme sẽ hơi thay đổi hình dạng để ôm khít lấy cơ chất, ép các liên kết hóa học của cơ chất căng ra, tạo điều kiện cho phản ứng phân cắt hoặc tổng hợp dễ dàng xảy ra.' },
          { title: '4. Các yếu tố ảnh hưởng', content: 'Hoạt tính enzyme chịu ảnh hưởng mạnh bởi Nhiệt độ và pH. Mỗi enzyme có một mức pH tối ưu (ví dụ Pepsin ở dạ dày cần pH=2, nhưng Amylase ở miệng cần pH=7). Nếu nhiệt độ quá cao, các liên kết hydro trong protein sẽ đứt gãy, làm enzyme bị biến tính vĩnh viễn và mất chức năng xúc tác.' }
        ],
        question: {
          text: 'Phát biểu nào sau đây đúng khi nói về vai trò của enzyme trong cơ thể?',
          options: [
            { id: 'A', text: 'Enzyme cung cấp năng lượng nhiệt cho các phản ứng sinh hóa xảy ra.', isCorrect: false, misconception: 'Nhầm lẫn chức năng xúc tác với chức năng cung cấp năng lượng (như ATP).', scientificFact: 'Enzyme KHÔNG cung cấp năng lượng, nó chỉ làm giảm rào cản năng lượng hoạt hóa.' },
            { id: 'B', text: 'Sau khi xúc tác một phản ứng, phân tử enzyme sẽ bị phân hủy và cơ thể phải tổng hợp lại.', isCorrect: false, misconception: 'Tưởng enzyme là chất phản ứng bị tiêu hao.', scientificFact: 'Enzyme là chất xúc tác, nó tham gia phản ứng nhưng được phục hồi nguyên vẹn sau khi phản ứng kết thúc.' },
            { id: 'C', text: 'Một loại enzyme có thể xúc tác cho hàng ngàn loại phản ứng hóa học khác nhau.', isCorrect: false, misconception: 'Hiểu sai về tính đặc hiệu tuyệt đối của enzyme sinh học.', scientificFact: 'Tính đặc hiệu cực kỳ cao: Amylase chỉ phân giải tinh bột, Pepsin chỉ phân giải protein.' },
            { id: 'D', text: 'Enzyme làm giảm năng lượng hoạt hóa, giúp phản ứng diễn ra nhanh hơn ở nhiệt độ bình thường của tế bào.', isCorrect: true, feedback: 'Rất chính xác! Đây là cơ chế cốt lõi giúp sự sống tồn tại ở 37 độ C.' }
          ]
        }
      }
    ]
  },
  {
    grade: 'Sinh Học 11',
    title: 'Giải Phẫu & Sinh Lý Người',
    color: 'var(--accent-purple)',
    topics: [
      { 
        id: '11-1', 
        name: 'Hệ Thần Kinh & Não Bộ',
        theory: [
          { title: '1. Kiến trúc Não Bộ', content: 'Não bộ người là một hệ thống siêu việt nặng khoảng 1.4kg, tiêu thụ 20% năng lượng toàn cơ thể. Đại não được chia thành hai bán cầu, mỗi bán cầu có 4 thùy chính: Thùy trán (tư duy logic, vận động ý thức), Thùy đỉnh (cảm giác xúc giác), Thùy thái dương (thính giác, ngôn ngữ), và Thùy chẩm (thị giác). Tiểu não nằm phía sau làm nhiệm vụ thăng bằng và phối hợp cử động phức tạp.' },
          { title: '2. Tủy Sống và Cung Phản Xạ', content: 'Tủy sống chạy dọc trong cột sống, đóng vai trò như "đường cao tốc" truyền tín hiệu giữa não và cơ thể. Nó cũng là trung tâm của các phản xạ không điều kiện (như rụt tay khi chạm lửa). Một cung phản xạ tủy gồm 5 khâu: (1) Thụ thể cảm giác tiếp nhận kích thích -> (2) Nơron hướng tâm -> (3) Nơron trung gian ở tủy sống -> (4) Nơron ly tâm -> (5) Cơ quan đáp ứng (cơ co rút).' },
          { title: '3. Kỹ thuật Hình ảnh Não (CT & MRI)', content: 'Chụp cắt lớp vi tính (CT Scan) sử dụng tia X chiếu qua đầu từ nhiều góc độ, máy tính sẽ tái tạo lại thành các lát cắt nằm ngang (Axial), đứng dọc (Sagittal), đứng ngang (Coronal). CT rất hữu hiệu trong việc phát hiện xuất huyết não cấp tính hoặc nứt sọ xương.' }
        ],
        question: {
          text: 'Khi một người vô tình chạm tay vào vật nóng và lập tức rụt tay lại (phản xạ tủy), tín hiệu thần kinh đi theo trật tự nào?',
          options: [
            { id: 'A', text: 'Thụ thể đau -> Dây thần kinh hướng tâm -> Tủy sống -> Não bộ phân tích -> Dây thần kinh ly tâm -> Cơ tay.', isCorrect: false, misconception: 'Tưởng mọi phản xạ đều phải do não bộ quyết định.', scientificFact: 'Phản xạ tủy (như rụt tay) diễn ra tại tủy sống để tiết kiệm thời gian, bảo vệ cơ thể khỏi tổn thương. Tín hiệu lên não chỉ để tạo cảm giác đau "sau đó".' },
            { id: 'B', text: 'Thụ thể đau -> Dây thần kinh hướng tâm -> Tủy sống -> Dây thần kinh ly tâm -> Cơ tay.', isCorrect: true, feedback: 'Chính xác! Đây là cung phản xạ tủy sống cơ bản, bỏ qua bước xử lý chậm trễ ở não bộ.' },
            { id: 'C', text: 'Cơ tay -> Dây thần kinh ly tâm -> Não bộ -> Dây thần kinh hướng tâm -> Thụ thể đau.', isCorrect: false, misconception: 'Đảo lộn hoàn toàn chiều dẫn truyền tín hiệu thần kinh.', scientificFact: 'Tín hiệu phải bắt nguồn từ thụ thể cảm giác (hướng tâm), đi vào trung ương, rồi mới ra lệnh cho cơ (ly tâm).' },
            { id: 'D', text: 'Thụ thể đau truyền tín hiệu trực tiếp qua mạch máu đến cơ tay mà không qua hệ thần kinh.', isCorrect: false, misconception: 'Nhầm lẫn vai trò của tuần hoàn máu và mạng lưới thần kinh.', scientificFact: 'Máu chỉ vận chuyển hormone và dưỡng chất. Tín hiệu điện (xung thần kinh) phải đi qua hệ thống dây thần kinh.' }
          ]
        }
      },
      { 
        id: '11-2', 
        name: 'Cơ Quan Cảm Giác (Thị giác & Vị giác)',
        theory: [
          { title: '1. Quang học và Thị Giác Màu Sắc', content: 'Mắt người hoạt động như một máy ảnh sinh học. Thấu kính (thủy tinh thể) hội tụ ánh sáng lên võng mạc ở đáy mắt. Võng mạc chứa hai loại tế bào cảm quang: Tế bào que (Rod cells) chiếm đa số, chứa sắc tố Rhodopsin, rất nhạy sáng nhưng chỉ nhìn được đen trắng. Tế bào nón (Cone cells) tập trung ở điểm vàng, chứa Photopsin, hoạt động ở ánh sáng mạnh và giúp ta nhận biết 3 màu cơ bản: Đỏ, Lục, Lam.' },
          { title: '2. Giải phẫu Lưỡi và Nhú Vị Giác', content: 'Bề mặt lưỡi sần sùi do chứa hàng ngàn nhú vị giác (Papillae). Có 3 loại nhú chứa thụ thể vị giác: Nhú hình nấm (Fungiform) ở đầu và rìa lưỡi, Nhú hình lá (Foliate) ở hai bên cạnh cuống lưỡi, và Nhú hình đài (Circumvallate) xếp thành hình chữ V ở ranh giới giữa thân và cuống lưỡi.' },
          { title: '3. Cơ chế Điện - Hóa của Vị Giác', content: 'Khi nhai, thức ăn hòa tan trong nước bọt và lọt vào các khe của nhú vị giác, tiếp xúc với lông vị giác (Gustatory hairs). 5 vị cơ bản (Ngọt, Mặn, Chua, Đắng, Umami) sẽ kích hoạt các thụ thể khác nhau. Ví dụ: Ion Na+ trong muối mặn đi trực tiếp vào kênh Ion làm khử cực màng. Đường ngọt liên kết với thụ thể G-protein tạo ra chuỗi phản ứng sinh hóa giải phóng chất dẫn truyền thần kinh. KHÔNG CÓ "bản đồ vị giác" phân chia từng vùng trên lưỡi, mọi nụ vị giác đều có thể cảm nhận cả 5 vị.' }
        ],
        question: {
          text: 'Tại sao trong bóng tối mờ ảo, chúng ta có thể nhìn thấy hình dáng đồ vật nhưng rất khó nhận biết màu sắc của chúng?',
          options: [
            { id: 'A', text: 'Vì các đồ vật không phản xạ màu sắc trong bóng tối.', isCorrect: false, misconception: 'Hiểu sai về tính chất vật lý của ánh sáng và sự hấp thụ màu.', scientificFact: 'Màu sắc phụ thuộc vào ánh sáng phản xạ, trong bóng mờ vẫn có ánh sáng nhưng mắt người không xử lý được màu ở cường độ đó.' },
            { id: 'B', text: 'Do tế bào nón (nhận biết màu sắc) cần ánh sáng cường độ mạnh để kích hoạt, trong khi tế bào que (trắng đen) rất nhạy cảm với ánh sáng yếu.', isCorrect: true, feedback: 'Xuất sắc! Tế bào que chỉ cung cấp hình ảnh đen trắng có độ phân giải thấp trong điều kiện thiếu sáng.' },
            { id: 'C', text: 'Đồng tử giãn quá to trong bóng tối khiến màu sắc bị hòa lẫn vào nhau.', isCorrect: false, misconception: 'Tưởng đồng tử hoạt động như một ống kính quang học sai lệch.', scientificFact: 'Đồng tử giãn để lấy thêm ánh sáng, không làm mất phân giải màu sắc. Nguyên nhân là ở tế bào cảm quang võng mạc.' },
            { id: 'D', text: 'Vì trong bóng tối, tế bào não ngưng phân tích tín hiệu màu sắc để tiết kiệm năng lượng.', isCorrect: false, misconception: 'Gán tư duy "chế độ tiết kiệm pin" vô căn cứ cho não bộ.', scientificFact: 'Không có tín hiệu màu nào được gửi từ võng mạc lên não do tế bào nón không được kích hoạt.' }
          ]
        }
      },
      { 
        id: '11-3', 
        name: 'Hệ Tiêu Hóa & Chuyển Hóa',
        theory: [
          { title: '1. Đại cương về Tiêu hóa', content: 'Hệ tiêu hóa là một ống kéo dài từ miệng đến hậu môn, hoạt động như một dây chuyền tháo dỡ tự động. Quá trình này bao gồm tiêu hóa cơ học (nhai, nhào trộn làm nhỏ thức ăn) và tiêu hóa hóa học (sử dụng enzyme và dịch tiêu hóa để cắt đứt các liên kết hóa học phức tạp thành các phân tử vi mô).' },
          { title: '2. Vai trò của từng cơ quan', content: 'Khoang miệng: Răng nghiền nát, nước bọt chứa Amylase bắt đầu cắt tinh bột chín thành đường maltose.\nDạ dày: Môi trường acid mạnh (HCl, pH ~ 2) diệt vi khuẩn, làm biến tính protein để enzyme Pepsin dễ dàng cắt protein thành các chuỗi polypeptide ngắn.\nRuột non: Chuyên gia phân giải và hấp thụ. Mật (từ gan) nhũ tương hóa lipid. Tụy tiết Lipase (cắt mỡ), Protease (cắt protein), Amylase (cắt tinh bột). Hàng triệu lông ruột (Villi) hấp thụ dưỡng chất đưa vào máu.' }
        ],
        question: {
          text: 'Sự khác biệt cốt lõi giữa tiêu hóa ở khoang miệng và tiêu hóa ở dạ dày là gì?',
          options: [
            { id: 'A', text: 'Miệng chỉ tiêu hóa cơ học, dạ dày chỉ tiêu hóa hóa học.', isCorrect: false, misconception: 'Tư duy cực đoan phân tách chức năng.', scientificFact: 'Cả hai đều có tiêu hóa cơ học và hóa học (Nước bọt có enzyme Amylase phân giải tinh bột, dạ dày co bóp nhào trộn).' },
            { id: 'B', text: 'Miệng có môi trường kiềm phân giải protein, dạ dày có môi trường axit phân giải tinh bột.', isCorrect: false, misconception: 'Nhầm lẫn môi trường pH và enzyme hoạt động.', scientificFact: 'Dạ dày có pH axit (HCl) để enzyme Pepsin phân giải Protein. Miệng pH gần trung tính phân giải Tinh bột.' },
            { id: 'C', text: 'Miệng chủ yếu tiêu hóa hóa học tinh bột (Amylase), dạ dày chủ yếu tiêu hóa hóa học protein (Pepsin) trong môi trường acid mạnh.', isCorrect: true, feedback: 'Chính xác! Mỗi cơ quan có một môi trường pH tối ưu và enzyme đặc thù riêng biệt.' },
            { id: 'D', text: 'Dạ dày hấp thụ hầu hết chất dinh dưỡng, còn miệng chỉ làm nát thức ăn.', isCorrect: false, misconception: 'Lầm tưởng chức năng hấp thụ là của dạ dày.', scientificFact: 'Hầu hết chất dinh dưỡng được hấp thụ ở Ruột Non. Dạ dày chủ yếu chứa, nhào trộn và tiêu hóa 1 phần protein.' }
          ]
        }
      },
      { 
        id: '11-4', 
        name: 'Hệ Miễn Dịch & Hệ Vận Động',
        theory: [
          { title: '1. Hệ Miễn Dịch (Tuyến Phòng Thủ)', content: 'Miễn dịch được chia thành hai hệ thống. Miễn dịch bẩm sinh (Innate) là hàng rào tự nhiên có sẵn (Da, nước mắt chứa lysozyme, bạch cầu thực bào ăn vi khuẩn). Miễn dịch thích ứng (Adaptive) là đội quân tinh nhuệ sinh ra sau khi tiếp xúc mầm bệnh: Tế bào B sản sinh Kháng thể (Antibodies) khóa chặt virus, Tế bào T độc (Cytotoxic T-cells) phá hủy tế bào ung thư hoặc tế bào nhiễm bệnh.' },
          { title: '2. Trí nhớ Miễn Dịch & Vaccine', content: 'Khi tiêu diệt xong mầm bệnh, một số tế bào B và T biến thành "Tế bào nhớ". Lần sau nếu mầm bệnh đó xâm nhập, chúng sẽ nhân lên ồ ạt trong vài giờ để dập tắt dịch bệnh trước khi ta kịp có triệu chứng. Vaccine lợi dụng cơ chế này: Đưa mầm bệnh giả (đã làm chết hoặc suy yếu) vào để cơ thể tập trận và tạo ra trí nhớ miễn dịch mà không phải chịu rủi ro nhiễm bệnh thật.' },
          { title: '3. Sinh lý Xương & Xạ hình Xương', content: 'Xương là một mô liên kết sống động, liên tục được đập đi xây lại bởi sự cân bằng giữa Hủy cốt bào (Osteoclasts - phá hủy mảng xương cũ) và Tạo cốt bào (Osteoblasts - tổng hợp canxi tạo xương mới). Khi bị gãy xương, viêm, hoặc có khối u di căn, vùng đó sẽ tập trung tái tạo cực mạnh. Máy Xạ hình xương (Bone Scintigraphy) dùng đồng vị phóng xạ bám vào canxi để làm sáng rực các vùng bất thường này trên ảnh.' }
        ],
        question: {
          text: 'Tại sao việc tiêm vaccine lại giúp cơ thể không bị mắc bệnh khi tiếp xúc với mầm bệnh thực sự sau này?',
          options: [
            { id: 'A', text: 'Vaccine là một lớp thuốc kháng sinh bọc ngoài tế bào, tiêu diệt vi khuẩn ngay khi chúng xâm nhập.', isCorrect: false, misconception: 'Nhầm lẫn giữa Vaccine và Kháng sinh (Antibiotics).', scientificFact: 'Vaccine là mầm bệnh bất hoạt hoặc suy yếu dùng để huấn luyện hệ miễn dịch, không phải là thuốc kháng sinh giết vi khuẩn trực tiếp.' },
            { id: 'B', text: 'Vaccine kích thích cơ thể tạo ra các tế bào lympho có "trí nhớ miễn dịch", sẵn sàng sản xuất kháng thể nhanh và mạnh khi gặp lại mầm bệnh.', isCorrect: true, feedback: 'Tuyệt vời! Đây chính là nguyên lý của miễn dịch thích ứng và cơ sở khoa học của mọi chương trình tiêm chủng.' },
            { id: 'C', text: 'Vaccine thay đổi vĩnh viễn cấu trúc DNA của người tiêm để cơ thể có khả năng kháng bệnh tự nhiên.', isCorrect: false, misconception: 'Thuyết âm mưu phổ biến về vaccine làm thay đổi gen người.', scientificFact: 'Vaccine mRNA hay vaccine truyền thống KHÔNG TÍCH HỢP vào DNA nhân tế bào chủ.' },
            { id: 'D', text: 'Vaccine làm tăng nhiệt độ cơ thể vĩnh viễn khiến vi khuẩn không thể sống sót.', isCorrect: false, misconception: 'Đánh đồng phản ứng phụ (sốt nhẹ) với cơ chế bảo vệ cốt lõi.', scientificFact: 'Sốt chỉ là biểu hiện hệ miễn dịch đang hoạt động, cơ thể sẽ trở lại nhiệt độ bình thường sau vài ngày.' }
          ]
        }
      }
    ]
  },
  {
    grade: 'Sinh Học 12',
    title: 'Di Truyền Học',
    color: 'var(--accent-green)',
    topics: [
      { 
        id: '12-1', 
        name: 'Cấu Trúc & Sao Chép ADN',
        theory: [
          { title: '1. Kiến trúc phân tử ADN', content: 'Năm 1953, Watson và Crick công bố cấu trúc xoắn kép của ADN. Phân tử ADN gồm 2 mạch polynucleotide chạy đối song song (một mạch hướng 5\'->3\', mạch kia hướng 3\'->5\'). Cấu trúc này như một cầu thang xoắn: Tay vịn là các gốc Đường-Phosphate, bậc thang là các base nitơ liên kết theo nguyên tắc bổ sung: Adenine (A) nối với Thymine (T) bằng 2 liên kết Hydro; Guanine (G) nối với Cytosine (C) bằng 3 liên kết Hydro.' },
          { title: '2. Enzyme trong nhân đôi ADN', content: 'Sự nhân đôi ADN là một bản giao hưởng phân tử phức tạp. Helicase làm nhiệm vụ "cái kéo" cắt đứt liên kết hydro để tháo xoắn 2 mạch. Primase đặt đoạn mồi ARN. Ngôi sao chính là ADN Polymerase III xúc tác nối các nucleotide mới vào để tạo mạch hoàn chỉnh. Tuy nhiên, Polymerase chỉ có thể chạy theo chiều 5\'->3\'. Vì thế, mạch gốc 3\'->5\' được tổng hợp liên tục (Leading strand), còn mạch gốc 5\'->3\' phải tổng hợp giật lùi từng đoạn nhỏ (gọi là đoạn Okazaki - Lagging strand). Cuối cùng Ligase đóng vai trò "hồ dán" nối các đoạn Okazaki lại.' }
        ],
        question: {
          text: 'Trong quá trình nhân đôi ADN, tại sao lại xuất hiện các đoạn Okazaki trên một trong hai mạch khuôn?',
          options: [
            { id: 'A', text: 'Vì enzyme ADN Polymerase thường xuyên bị hỏng và cần thời gian nghỉ ngơi để phục hồi chức năng.', isCorrect: false, misconception: 'Nhân hóa hành vi của các phân tử sinh học.', scientificFact: 'Enzyme sinh học hoạt động liên tục chừng nào còn đủ cơ chất và năng lượng.' },
            { id: 'B', text: 'Do enzyme ADN Polymerase chỉ xúc tác kéo dài mạch mới theo một chiều duy nhất (5\' -> 3\'), trong khi 2 mạch khuôn ngược chiều nhau.', isCorrect: true, feedback: 'Quá chuẩn xác! Tính chất đối song song của ADN kết hợp với giới hạn xúc tác chiều 5\'->3\' của enzyme đã tạo ra sự tổng hợp gián đoạn này.' },
            { id: 'C', text: 'Vì trên ADN có các vùng không chứa thông tin di truyền (intron) cản trở enzyme trượt qua.', isCorrect: false, misconception: 'Nhầm lẫn giữa quá trình Nhân đôi ADN và quá trình Phiên mã cắt nối (Splicing).', scientificFact: 'Trong quá trình nhân đôi, CẢ exon và intron đều được sao chép toàn bộ.' },
            { id: 'D', text: 'Đoạn Okazaki là kết quả của sự phá hủy bởi tác nhân đột biến tia tử ngoại.', isCorrect: false, misconception: 'Lầm tưởng một cơ chế sinh lý bình thường là một dạng đột biến.', scientificFact: 'Okazaki là cấu trúc bắt buộc bình thường trong sao chép ở mọi sinh vật.' }
          ]
        }
      },
      { 
        id: '12-2', 
        name: 'Quy Luật Di Truyền Mendel',
        theory: [
          { title: '1. Khái niệm cơ bản', content: 'Mỗi tính trạng của sinh vật (ví dụ: màu hoa) do một Gen quy định. Mỗi gen tồn tại dưới nhiều phiên bản khác nhau gọi là Alen (ví dụ: Alen A quy định hoa đỏ, alen a quy định hoa trắng). Tổ hợp 2 alen trong tế bào tạo thành Kiểu gen (Genotype - vd: Aa), và hình thái biểu hiện ra bên ngoài gọi là Kiểu hình (Phenotype - vd: Hoa đỏ). Nếu A lấn át hoàn toàn a, thì kiểu gen Aa vẫn bộc lộ màu đỏ (Trội hoàn toàn).' },
          { title: '2. Quy luật Phân ly (Định luật 1 Mendel)', content: 'Mendel phát hiện ra rằng trong tế bào sinh dưỡng, các alen tồn tại thành từng cặp (Aa). Nhưng khi giảm phân tạo giao tử (tinh trùng/trứng), cặp alen này phân ly độc lập, đồng đều về các giao tử. Do đó mỗi giao tử chỉ chứa duy nhất 1 alen (hoặc A, hoặc a). Điều này bác bỏ học thuyết "di truyền hòa trộn" (cho rằng máu của bố mẹ trộn lẫn vào nhau tạo ra con lai mang tính trạng trung bình).' },
          { title: '3. Phép Lai Phân Tích', content: 'Khi nhìn một cây hoa đỏ, ta không thể biết nó thuần chủng (AA) hay mang gen lặn ẩn (Aa). Mendel đã tạo ra "Lai phân tích": Đem cây hoa đỏ đó lai với cây hoa trắng (kiểu gen chắc chắn là aa). Nếu đời con 100% hoa đỏ -> Cây ban đầu là AA. Nếu đời con xuất hiện 50% hoa đỏ : 50% hoa trắng -> Cây ban đầu là Aa.' }
        ],
        question: {
          text: 'Mendel cho lai cây đậu Hà Lan thân cao (thuần chủng) với cây thân lùn. Đời F1 100% thân cao. Nhận định nào về kiểu gen của F1 là ĐÚNG?',
          options: [
            { id: 'A', text: 'F1 mang kiểu gen đồng hợp trội (AA), alen lặn từ cây thân lùn đã bị tiêu diệt hoàn toàn.', isCorrect: false, misconception: 'Hiểu sai về sự pha trộn di truyền máu. Cho rằng tính trạng lặn bị phá hủy hoàn toàn.', scientificFact: 'Alen lặn vẫn tồn tại nhưng bị lấn át. Bằng chứng là F2 vẫn xuất hiện thân lùn.' },
            { id: 'B', text: 'F1 mang kiểu gen dị hợp tử (Aa), trong đó alen A quy định thân cao lấn át hoàn toàn alen a quy định thân lùn.', isCorrect: true, feedback: 'Chính xác! Hiện tượng trội hoàn toàn bảo vệ thông tin di truyền lặn ở trạng thái ẩn.' },
            { id: 'C', text: 'Kiểu hình thân cao ở F1 là do đột biến xảy ra do môi trường thụ phấn, không liên quan đến bố mẹ.', isCorrect: false, misconception: 'Gán mọi thay đổi kiểu hình cho đột biến môi trường thay vì sự phân ly giao tử.', scientificFact: 'Đột biến rất hiếm, kết quả F1 là quy luật di truyền tất yếu của phép lai thuần chủng.' },
            { id: 'D', text: 'F1 mang kiểu gen trung gian, nhưng vì một lý do nào đó thân cây bị kéo dài ra.', isCorrect: false, misconception: 'Nhầm lẫn sang quy luật Trội không hoàn toàn (như hoa đỏ x hoa trắng -> hoa hồng).', scientificFact: 'Thân cây đậu của Mendel tuân theo quy luật Trội hoàn toàn.' }
          ]
        }
      }
    ]
  }
];

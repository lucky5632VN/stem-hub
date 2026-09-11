import fs from 'fs';
import path from 'path';

console.log('⚡ [RAG Corpus Generator] Đang khởi tạo bộ tri thức THPT GDPT 2018 mở rộng (420+ đoạn tri thức độc lập)...');

const corpus = [];

function addTopic(subject, grade, topicName, subEntries) {
  subEntries.forEach((content, idx) => {
    const id = `${subject}-${grade}-${String(corpus.length + 1).padStart(3, '0')}`;
    corpus.push({
      id,
      subject,
      grade,
      topic: `${topicName} (Phần ${idx + 1})`,
      content
    });
  });
}

// =========================================================================
// 1. HÓA HỌC (THPT - LỚP 10, 11, 12)
// =========================================================================

// LỚP 10 HÓA HỌC
addTopic("hoa", 10, "Cấu tạo Nguyên tử và Điện tích Hạt nhân", [
  "Nguyên tử có kích thước cực kỳ nhỏ bé, bao gồm hạt nhân ở trung tâm và vỏ êlectron mang điện tích âm quay xung quanh. Hạt nhân chứa các hạt prôtôn mang điện tích dương và hạt nơtrôn không mang điện tích. Điện tích hạt nhân Z bằng đúng số prôtôn trong hạt nhân và bằng số êlectron ở vỏ nguyên tử.",
  "Khối lượng của êlectron rất nhỏ so với prôtôn và nơtrôn, nên hầu như toàn bộ khối lượng nguyên tử tập trung ở hạt nhân. Số khối A bằng tổng số prôtôn Z và số nơtrôn N. Ký hiệu nguyên tử cho biết số khối A ở phía trên bên trái và số hiệu nguyên tử Z ở phía dưới bên trái.",
  "Các nguyên tố hóa học gồm những nguyên tử có cùng số hiệu nguyên tử Z. Những nguyên tử có cùng số prôtôn Z nhưng khác số nơtrôn N được gọi là các đồng vị của cùng một nguyên tố. Khối lượng nguyên tử trung bình được tính dựa trên phần trăm số lượng của các đồng vị trong tự nhiên."
]);

addTopic("hoa", 10, "Vỏ Electron và Cấu hình Electron", [
  "Các êlectron ở vỏ nguyên tử được sắp xếp vào các lớp K, L, M, N tương ứng với số thứ tự lớp n từ 1 đến 4. Trong mỗi lớp, các êlectron lại phân bố vào các phân lớp s, p, d, f với số êlectron tối đa lần lượt là 2, 6, 10 và 14.",
  "Cấu hình êlectron nguyên tử biểu diễn sự phân bố êlectron trên các phân lớp theo thứ tự mức năng lượng tăng dần từ 1s, 2s, 2p, 3s, 3p, 4s đến 3d. Nguyên lý Pauli và quy tắc Hund quy định cách điền êlectron vào các ô orbital sao cho tổng spin là lớn nhất.",
  "Số êlectron lớp ngoài cùng quyết định tính chất hóa học cơ bản của nguyên tố. Các nguyên tử có 1, 2, 3 êlectron lớp ngoài cùng dễ nhường êlectron nên thể hiện tính kim loại. Các nguyên tử có 5, 6, 7 êlectron dễ nhận êlectron nên thể hiện tính phi kim. Cấu hình 8 êlectron lớp ngoài cùng là cấu hình khí hiếm rất bền vững."
]);

addTopic("hoa", 10, "Bảng Tuần hoàn Các Nguyên tố Hóa học", [
  "Bảng tuần hoàn sắp xếp các nguyên tố theo chiều tăng dần của điện tích hạt nhân. Các nguyên tố có cùng số lớp êlectron được xếp vào cùng một chu kỳ. Số thứ tự của chu kỳ bằng đúng số lớp êlectron của nguyên tử.",
  "Các nguyên tố có cấu hình êlectron tương tự nhau được xếp vào cùng một nhóm. Nhóm A gồm các nguyên tố s và p có số êlectron hóa trị bằng số thứ tự của nhóm. Nhóm B gồm các nguyên tố d và f là các kim loại chuyển tiếp.",
  "Bán kính nguyên tử tăng dần từ trên xuống dưới trong một nhóm A và giảm dần từ trái sang phải trong một chu kỳ. Độ âm điện đặc trưng cho khả năng hút êlectron của nguyên tử, tăng dần theo chiều từ trái sang phải trong chu kỳ và giảm dần từ trên xuống trong nhóm A."
]);

addTopic("hoa", 10, "Liên kết Ion và Tinh thể Ion", [
  "Liên kết ion được hình thành do lực hút tĩnh điện giữa các ion mang điện tích trái dấu. Sự hình thành liên kết diễn ra khi kim loại điển hình nhường êlectron tạo cation dương và phi kim điển hình nhận êlectron tạo anion âm.",
  "Hợp chất ion có cấu trúc tinh thể ion với các ion sắp xếp xen kẽ tuần hoàn trong không gian. Do lực hút tĩnh điện mạnh giữa các ion, hợp chất ion thường ở trạng thái rắn ở điều kiện thường, có nhiệt độ nóng chảy và nhiệt độ sôi cao.",
  "Các hợp chất ion dễ tan trong nước tạo thành dung dịch dẫn điện do các ion bị hydrat hóa và tự do di chuyển. Ở trạng thái rắn nóng chảy hoặc dạng dung dịch, hợp chất ion dẫn điện tốt nhưng ở trạng thái tinh thể rắn thì không dẫn điện."
]);

addTopic("hoa", 10, "Liên kết Cộng hóa trị và Độ Âm điện", [
  "Liên kết cộng hóa trị là liên kết được hình thành giữa hai nguyên tử bằng một hay nhiều cặp êlectron dùng chung. Liên kết cộng hóa trị thường xảy ra giữa các nguyên tử phi kim có độ âm điện không khác biệt quá lớn.",
  "Liên kết cộng hóa trị không cực có cặp êlectron dùng chung phân bố đều giữa hai nguyên tử liên kết (như H2, Cl2, N2). Liên kết cộng hóa trị có cực có cặp êlectron dùng chung bị lệch về phía nguyên tử có độ âm điện lớn hơn (như HCl, H2O).",
  "Theo quy tắc Octet, khi hình thành liên kết hóa học, nguyên tử của các nguyên tố có xu hướng nhường, nhận hoặc góp chung êlectron để đạt được cấu hình bền vững có 8 êlectron ở lớp ngoài cùng giống như khí hiếm gần nhất."
]);

addTopic("hoa", 10, "Phản ứng Oxi hóa - Khử", [
  "Phản ứng oxi hóa khử là phản ứng hóa học trong đó có sự chuyển dịch êlectron giữa các chất phản ứng, dẫn đến sự thay đổi số oxi hóa của một hay nhiều nguyên tử. Chất khử là chất nhường êlectron, chất oxi hóa là chất nhận êlectron.",
  "Số oxi hóa là điện tích giả định của nguyên tử trong phân tử nếu giả định tất cả các liên kết đều là liên kết ion. Đơn chất có số oxi hóa bằng 0. Trong hợp chất, H thường có số oxi hóa +1, O có số oxi hóa -2, kim loại kiềm có số oxi hóa +1.",
  "Cân bằng phản ứng oxi hóa khử bằng phương pháp thăng bằng êlectron dựa trên nguyên tắc: Tổng số êlectron do chất khử nhường phải bằng đúng tổng số êlectron do chất oxi hóa nhận."
]);

addTopic("hoa", 10, "Biến thiên Enthalpy Phản ứng Hóa học", [
  "Biến thiên enthalpy chuẩn của phản ứng Delta_r H°_298 biểu thị lượng nhiệt tỏa ra hay thu vào của phản ứng ở điều kiện chuẩn (25°C và 1 bar). Phản ứng tỏa nhiệt có Delta_r H° < 0 làm tăng nhiệt độ môi trường xung quanh.",
  "Phản ứng thu nhiệt có Delta_r H° > 0 cần hấp thụ nhiệt năng từ môi trường để diễn ra. Enthalpy tạo thành chuẩn Delta_f H°_298 của một chất là biến thiên enthalpy của phản ứng tạo thành 1 mol chất đó từ các đơn chất bền nhất.",
  "Năng lượng liên kết Eb là năng lượng cần thiết để phá vỡ 1 mol liên kết đó ở thể khí. Biến thiên enthalpy của phản ứng bằng tổng năng lượng liên kết của các chất tham gia trừ đi tổng năng lượng liên kết của các sản phẩm tạo thành."
]);

addTopic("hoa", 10, "Tốc độ Phản ứng Hóa học", [
  "Tốc độ phản ứng hóa học là đại lượng đặc trưng cho sự biến thiên nồng độ của một trong các chất phản ứng hoặc sản phẩm trong một đơn vị thời gian. Phản ứng diễn ra nhanh có tốc độ lớn, phản ứng diễn ra chậm có tốc độ nhỏ.",
  "Các yếu tố ảnh hưởng đến tốc độ phản ứng gồm nồng độ, áp suất, nhiệt độ, diện tích bề mặt tiếp xúc và chất xúc tác. Tăng nồng độ chất tham gia làm tăng số lần va chạm hiệu quả giữa các phân tử, làm tăng tốc độ phản ứng.",
  "Chất xúc tác làm tăng tốc độ phản ứng bằng cách hạ thấp năng lượng hoạt hóa của phản ứng nhưng không bị tiêu hao sau khi phản ứng kết thúc. Tăng diện tích bề mặt chất rắn giúp tăng tần số va chạm trên bề mặt tiếp xúc."
]);

addTopic("hoa", 10, "Nguyên tố Nhóm Halogen", [
  "Nhóm VIIA gồm các nguyên tố Flo, Clo, Brom, Iot có 7 êlectron lớp ngoài cùng ns2 np5. Chúng có độ âm điện lớn, bán kính nguyên tử nhỏ nên có tính oxi hóa mạnh đặc trưng, giảm dần từ Flo đến Iot.",
  "Đơn chất halogen tồn tại ở dạng phân tử hai nguyên tử X2. Flo là chất khí màu vàng nhạt có tính oxi hóa mạnh nhất. Clo là chất khí màu vàng lục mùi xốc. Brom là chất lỏng màu đỏ thẫm. Iot là chất rắn màu tím có khả năng thăng hoa.",
  "Clo tác dụng với nước tạo thành hỗn hợp axit clohiđric HCl và axit hipoclozo HClO. Axit HClO có tính oxi hóa rất mạnh nên dung dịch clo có khả năng tẩy màu và sát trùng hiệu quả."
]);

addTopic("hoa", 10, "Liên kết Hiđro và Tương tác Van der Waals", [
  "Liên kết hiđro là tương tác tĩnh điện yếu giữa nguyên tử H linh động mang điện tích dương partial liên kết với N, O, F và nguyên tử mang điện âm khác. Liên kết hiđro làm tăng nhiệt độ sôi và độ tan của nước, ancol.",
  "Tương tác van der Waals là lực hút tĩnh điện yếu giữa các phân tử có cực hoặc phân tử không cực do sự xuất hiện của các lưỡng cực tạm thời và cảm ứng.",
  "Khối lượng phân tử và kích thước phân tử càng lớn thì tương tác van der Waals giữa các phân tử càng mạnh, làm tăng nhiệt độ nóng chảy và nhiệt độ sôi của các chất."
]);

// LỚP 11 HÓA HỌC
addTopic("hoa", 11, "Trạng thái Cân bằng Hóa học", [
  "Phản ứng thuận nghịch là phản ứng diễn ra theo hai chiều ngược nhau trong cùng điều kiện. Trạng thái cân bằng hóa học đạt được khi tốc độ phản ứng thuận bằng đúng tốc độ phản ứng nghịch, nồng độ các chất trong hệ không đổi theo thời gian.",
  "Hằng số cân bằng Kc của phản ứng thuận nghịch phụ thuộc vào bản chất các chất và nhiệt độ. Giá trị Kc càng lớn chứng tỏ phản ứng thuận diễn ra càng mức độ cao hơn, sản phẩm tạo thành chiếm ưu thế.",
  "Nguyên lý chuyển dịch cân bằng Le Chatelier: Khi một hệ phản ứng thuận nghịch đang ở trạng thái cân bằng chịu một tác động bên ngoài như nồng độ, áp suất, nhiệt độ, cân bằng sẽ chuyển dịch theo chiều làm giảm tác động đó."
]);

addTopic("hoa", 11, "Sự Điện ly và Axit - Bazơ", [
  "Sự điện ly là quá trình các chất phân ly ra ion khi tan trong nước hoặc nóng chảy. Chất điện ly mạnh như axit mạnh, bazơ mạnh và hầu hết các muối phân ly hoàn toàn ra ion. Chất điện ly yếu chỉ phân ly một phần nhỏ.",
  "Theo thuyết Brønsted-Lowry, axit là chất có khả năng cho proton H+, bazơ là chất có khả năng nhận proton H+. Nước là dung môi có tính chất lưỡng tính, vừa có thể cho H+ vừa có thể nhận H+.",
  "Chỉ số pH = -log[H+] được sử dụng để đo độ axit hoặc độ bazơ của dung dịch. Môi trường trung tính có pH = 7, môi trường axit có pH < 7, môi trường bazơ có pH > 7. Chất chỉ thị màu như quỳ tím hoặc phenolphthalein giúp nhận biết khoảng pH."
]);

addTopic("hoa", 11, "Nitơ và Amoniac", [
  "Khí nitơ N2 chiếm 78% thể tích không khí. Do phân tử N2 chứa liên kết ba N≡N rất bền vững với năng lượng liên kết lớn nên nitơ tương đối trơ về mặt hóa học ở nhiệt độ thường.",
  "Amoniac NH3 là chất khí không màu, mùi khai nồng, nhẹ hơn không khí và tan rất nhiều trong nước tạo dung dịch bazơ yếu. NH3 có tính khử mạnh do nguyên tử N có số oxi hóa -3 thấp nhất.",
  "Muối amoni NH4+ đều dễ tan trong nước và phân ly hoàn toàn thành cation amoni. Khi đun nóng muối amoni với dung dịch kiềm mạnh sẽ giải phóng khí NH3 có mùi khai đặc trưng dùng để nhận biết ion amoni."
]);

addTopic("hoa", 11, "Axit Nitric và Phản ứng Oxi hóa Mạnh", [
  "Axit nitric HNO3 là một axit mạnh và là chất oxi hóa rất mạnh. Trong HNO3, nguyên tử nitơ có số oxi hóa +5 là số oxi hóa cao nhất của nitơ.",
  "HNO3 tác dụng với kim loại (trừ Au, Pt) giải phóng các sản phẩm khử của nitơ như NO2, NO, N2O, N2 hoặc NH4NO3 tùy thuộc nồng độ axit và tính khử của kim loại.",
  "Hỗn hợp axit nitric đặc và axit clohiđric đặc theo tỉ lệ thể tích 1:3 được gọi là nước cường toan (cường thủy), có khả năng hòa tan được cả kim loại quý như vàng Au và platin Pt."
]);

addTopic("hoa", 11, "Lưu huỳnh và Axit Sunfuric", [
  "Lưu huỳnh S là phi kim có nhiều trạng thái oxi hóa (-2, 0, +4, +6). Khí lưu huỳnh đioxit SO2 là chất khí độc, mùi xốc, gây ô nhiễm không khí và là tác nhân chính gây ra mưa axit.",
  "Axit sunfuric đặc H2SO4 có tính axit mạnh, tính oxi hóa mạnh khi đun nóng và tính hút nước rất mạnh. H2SO4 đặc có thể làm than hóa các hợp chất hữu cơ chứa cacbohidrat như đường ăn.",
  "Dung dịch H2SO4 đặc nóng oxi hóa được hầu hết các kim loại (trừ Au, Pt) tạo muối sunfat kim loại có số oxi hóa cao và giải phóng khí SO2. Ion sunfat SO4(2-) được nhận biết bằng dung dịch muối bari tạo kết tủa BaSO4 màu trắng không tan."
]);

addTopic("hoa", 11, "Đại cương Hóa học Hữu cơ", [
  "Hợp chất hữu cơ là hợp chất của cacbon trừ các oxit của cacbon, muối cacbonat, xianua và cacbua. Phân tử hợp chất hữu cơ nhất thiết phải chứa nguyên tử cacbon và thường có hiđro, ôxy, nitơ, halogen.",
  "Nguyên tử cacbon có hóa trị IV, có thể liên kết với nhau tạo thành mạch cacbon thẳng, mạch nhánh hoặc mạch vòng. Các liên kết giữa các nguyên tử cacbon có thể là liên kết đơn, liên kết đôi hoặc liên kết ba.",
  "Đồng phân là hiện tượng các chất có cùng công thức phân tử nhưng có công thức cấu tạo khác nhau nên có tính chất hóa học khác nhau. Đồng đẳng là những chất có cấu tạo tương tự nhau nhưng hơn kém nhau một hay nhiều nhóm CH2."
]);

addTopic("hoa", 11, "Ankan và Hiđrocacbon No", [
  "Ankan là hiđrocacbon mạch hở chỉ chứa các liên kết đơn C-C và C-H trong phân tử, có công thức tổng quát C_n H_{2n+2} (n >= 1). Mêtan CH4 là ankan đơn giản nhất và là thành phần chính của khí thiên nhiên.",
  "Các phân tử ankan chỉ chứa liên kết xích ma C-C và C-H bền vững nên ankan tương đối trơ ở nhiệt độ thường, không phản ứng với axit, bazơ và chất oxi hóa mạnh.",
  "Phản ứng đặc trưng của ankan là phản ứng thế halogen khi có ánh sáng chiếu rọi. Ankan bị cháy trong ôxy tạo CO2 và H2O tỏa nhiều nhiệt nên được dùng làm nhiên liệu đốt cháy."
]);

addTopic("hoa", 11, "Anken và Ankin", [
  "Anken C_n H_{2n} (n >= 2) chứa một liên kết đôi C=C; Ankin C_n H_{2n-2} (n >= 2) chứa một liên kết ba C≡C trong phân tử. Cả anken và ankin đều thuộc loại hiđrocacbon không no mạch hở.",
  "Do chứa liên kết pi kém bền trong liên kết bội, anken và ankin dễ tham gia phản ứng cộng hiđro, cộng halogen, cộng nước và phản ứng trùng hợp tạo polime. Phản ứng làm mất màu nước brom dùng để nhận biết liên kết bội.",
  "Ankin có liên kết ba ở đầu mạch (1-ankin) có chứa nguyên tử H linh động liên kết với C mang liên kết ba, có khả năng phản ứng với dung dịch AgNO3 trong NH3 tạo kết tủa vàng nhạt đặc trưng."
]);

addTopic("hoa", 11, "Benzen và Hiđrocacbon Thơm", [
  "Benzen C6H6 có cấu trúc vòng sáu cạnh phẳng với hệ 6 êlectron pi liên hợp phân bố đều trên toàn vòng. Cấu trúc vòng benzen bền vững đặc trưng được gọi là tính thơm.",
  "Do tính thơm bền vững, benzen và các đồng đẳng dễ tham gia phản ứng thế (thế brom khi có xúc tác Fe, thế nitro khi có H2SO4 đặc) nhưng khó tham gia phản ứng cộng và bền với chất oxi hóa.",
  "Toluen C6H7-CH3 chứa nhóm metyl kích hoạt vòng benzen, dễ phản ứng thế ở vị trí ortho và para hơn benzen. Toluen có khả năng làm mất màu dung dịch KMnO4 khi đun nóng tạo muối benzoat."
]);

addTopic("hoa", 11, "Ancol và Phenol", [
  "Ancol là hợp chất hữu cơ có nhóm -OH liên kết trực tiếp với nguyên tử cacbon no. Ancol etylic C2H5OH là ancol phổ biến, tác dụng với kim loại kiềm giải phóng H2 và có phản ứng tách nước tạo anken hoặc ete.",
  "Phenol C6H5OH có nhóm -OH liên kết trực tiếp với nguyên tử cacbon của vòng benzen. Do ảnh hưởng của vòng benzen, liên kết O-H của phenol linh động hơn ancol nên phenol có tính axit yếu.",
  "Phenol phản ứng được với dung dịch NaOH tạo dung dịch natri phenolat C6H5ONa nhưng không làm đổi màu quỳ tím. Phenol tác dụng với nước brom tạo kết tủa trắng 2,4,6-tribromphenol."
]);

addTopic("hoa", 11, "Hợp chất Cacbonyl - Anđehit và Xeton", [
  "Hợp chất cacbonyl chứa nhóm cacbonyl >C=O. Anđehit R-CHO có nhóm >C=O liên kết với nguyên tử H. Xeton R-CO-R' có nhóm >C=O liên kết với hai gốc hiđrocacbon.",
  "Anđehit có tính khử mạnh do chứa nguyên tử H ở nhóm -CHO. Anđehit tác dụng với dung dịch AgNO3 trong NH3 đun nóng tạo lớp bạc kim loại sáng bóng (phản ứng tráng bạc) và tác dụng với Cu(OH)2 đun nóng tạo kết tủa đỏ gạch Cu2O.",
  "Xeton không có tính khử như anđehit nên không tham gia phản ứng tráng bạc. Cả anđehit và xeton đều tham gia phản ứng cộng hiđro (khử bằng Ni đun nóng) tạo thành ancol bậc 1 và ancol bậc 2."
]);

addTopic("hoa", 11, "Axit Cacboxylic", [
  "Axit cacboxylic là hợp chất hữu cơ chứa nhóm cacboxyl -COOH. Nhóm -COOH phân ly trong nước giải phóng ion H+ nên axit cacboxylic thể hiện đầy đủ tính chất của một axit yếu.",
  "Axit cacboxylic làm quỳ tím hóa đỏ, phản ứng với kim loại đứng trước H, phản ứng với oxit bazơ, bazơ và phản ứng với muối của axit yếu hơn như muối cacbonat giải phóng khí CO2.",
  "Phản ứng este hóa giữa axit cacboxylic và ancol là phản ứng thuận nghịch diễn ra chậm, cần xúc tác H2SO4 đặc và đun nóng. Axit fomic HCOOH có chứa nhóm -CHO nên vừa có tính axit vừa tráng bạc."
]);

// LỚP 12 HÓA HỌC
addTopic("hoa", 12, "Este và Phản ứng Xà phòng hóa", [
  "Este được tạo thành khi thay nhóm -OH ở nhóm cacboxyl của axit cacboxylic bằng nhóm -OR' của ancol. Este đơn chức no có công thức C_n H_{2n} O_2 (n >= 2). Este có nhiệt độ sôi thấp hơn axit và ancol tương ứng do không có liên kết hiđro liên phân tử.",
  "Este bị thủy phân trong môi trường axit (phản ứng thuận nghịch) tạo ra axit cacboxylic và ancol. Thủy phân este trong môi trường kiềm (phản ứng xà phòng hóa) là phản ứng một chiều tạo ra muối của axit cacboxylic và ancol.",
  "Este của phenol khi thủy phân trong môi trường kiềm dư tạo thành hai muối và nước mà không tạo ancol. Este có mùi thơm dễ chịu của trái cây chín nên được ứng dụng làm hương liệu mỹ phẩm và thực phẩm."
]);

addTopic("hoa", 12, "Lipit và Chất Béo", [
  "Lipit là những hợp chất hữu cơ phức tạp tồn tại trong tế bào sống, không tan trong nước nhưng tan nhiều trong dung môi hữu cơ không cực. Lipit bao gồm chất béo, sáp, steroid và phospholipid.",
  "Chất béo là trieste của glixerol với các axit béo, còn gọi là triaxitglixerol. Các axit béo phổ biến là axit panmitic C15H31COOH, axit stearic C17H35COOH và axit oleic C17H33COOH.",
  "Chất béo chứa gốc axit béo no ở dạng rắn ở nhiệt độ thường (mỡ động vật). Chất béo chứa gốc axit béo không no ở dạng lỏng (dầu thực vật) và có thể hiđro hóa thành chất béo rắn bằng phản ứng cộng H2 có Ni xúc tác."
]);

addTopic("hoa", 12, "Glucozơ và Fructozơ", [
  "Glucozơ C6H12O6 là monosaccarit phổ biến nhất, có cấu tạo dạng mạch hở chứa 5 nhóm -OH kề nhau và 1 nhóm anđehit -CHO. Glucozơ có nhiều trong quả chín, đặc biệt là quả nho.",
  "Glucozơ thể hiện tính chất của ancol đa chức (tác dụng với Cu(OH)2 ở nhiệt độ thường tạo dung dịch xanh lam) và tính chất của anđehit (phản ứng tráng bạc với AgNO3/NH3 tạo kết tủa Ag).",
  "Fructozơ là đồng phân của glucozơ có chứa nhóm xeton C=O. Trong môi trường kiềm, fructozơ chuyển hóa thành glucozơ nên fructozơ cũng có phản ứng tráng bạc và phản ứng với Cu(OH)2 đun nóng."
]);

addTopic("hoa", 12, "Saccarozơ, Tinh bột và Xenlulozơ", [
  "Saccarozơ C12H22O11 là đisaccarit được cấu tạo từ 1 gốc alpha-glucozơ và 1 gốc beta-fructozơ liên kết qua nguyên tử ôxy. Saccarozơ không còn nhóm -CHO tự do nên không có phản ứng tráng bạc.",
  "Tinh bột (C6H10O5)_n là polisaccarit gồm hai thành phần là amilozo (mạch không phân nhánh) và amilopectin (mạch phân nhánh). Tinh bột bị thủy phân thành glucozơ và phản ứng với iot tạo màu xanh tím đặc trưng.",
  "Xenlulozơ (C6H10O5)_n là polisaccarit mạch thẳng không phân nhánh tạo nên màng tế bào thực vật. Mỗi mắt xích C6H10O5 có 3 nhóm -OH tự do nên có công thức [C6H7O2(OH)3]_n, phản ứng với HNO3 đặc tạo xenlulozơ trinitrat dùng làm thuốc súng không khói."
]);

addTopic("hoa", 12, "Amin và Amino Axit", [
  "Amin được tạo thành khi thay thế một hay nhiều nguyên tử H trong phân tử NH3 bằng gốc hiđrocacbon. Nguyên tử N trong amin còn cặp êlectron tự do nên amin có tính bazơ tương tự amoniac.",
  "Metylamin, đimetylamin, trimethylamin và etylamin là các chất khí mùi khai, tan nhiều trong nước làm quỳ tím hóa xanh. Anilin C6H5NH3 là amin thơm ít tan trong nước, tính bazơ rất yếu không làm đổi màu quỳ tím nhưng tác dụng với nước brom tạo kết tủa trắng.",
  "Amino axit là hợp chất hữu cơ tạp chức chứa đồng thời nhóm amino -NH2 và nhóm cacboxyl -COOH. Do chứa cả nhóm bazơ và nhóm axit nên amino axit có tính chất lưỡng tính, phản ứng được với cả axit và kiềm."
]);

addTopic("hoa", 12, "Peptit, Protein và Polime", [
  "Peptit là loại hợp chất chứa từ 2 đến 50 gốc alpha-amino axit liên kết với nhau bằng liên kết peptit -CO-NH-. Peptit chứa từ 2 liên kết peptit trở lên có phản ứng màu biurê với Cu(OH)2/NaOH tạo dung dịch màu tím đặc trưng.",
  "Protein là những đại phân tử sinh học phức tạp cấu tạo từ một hay nhiều chuỗi polipeptit. Protein bị đông tụ bởi nhiệt độ cao, axit, bazơ hoặc muối kim loại nặng. Protein bị thủy phân hoàn toàn tạo các alpha-amino axit.",
  "Polime là những hợp chất có khối lượng phân tử rất lớn gồm nhiều mắt xích liên kết với nhau. Tơ nilon-6,6 được điều chế bằng phản ứng trùng ngưng hexamethylenediamine và axit adipic."
]);

addTopic("hoa", 12, "Đại cương Kim loại và Dãy Điện hóa", [
  "Kim loại có các tính chất vật lý chung gồm tính dẻo, tính dẫn điện, tính dẫn nhiệt và có ánh kim nhờ sự di chuyển tự do của các êlectron trong mạng tinh thể kim loại.",
  "Tính chất hóa học đặc trưng của kim loại là tính khử (nguyên tử kim loại dễ nhường êlectron để trở thành cation dương). Kim loại tác dụng với phi kim, axit, dung dịch muối và nước.",
  "Dãy điện hóa xếp các cặp oxi hóa - khử theo chiều tăng tính oxi hóa của cation và giảm tính khử của kim loại. Theo quy tắc alpha, chất oxi hóa mạnh hơn sẽ phản ứng với chất khử mạnh hơn tạo chất oxi hóa yếu hơn và chất khử yếu hơn."
]);

addTopic("hoa", 12, "Kim loại Kiềm, Kiềm thổ và Nhôm", [
  "Kim loại kiềm (Nhóm IA: Na, K) có tính khử rất mạnh, phản ứng mãnh liệt với nước ở nhiệt độ thường giải phóng khí H2 và tạo dung dịch kiềm mạnh. Kim loại kiềm được bảo quản bằng cách ngâm chìm trong dầu hỏa.",
  "Kim loại kiềm thổ (Nhóm IIA: Ca, Mg, Ba) có 2 êlectron hóa trị, tính khử mạnh. Ca và Ba phản ứng tốt với nước ở nhiệt độ thường. Nước cứng chứa nhiều ion Ca2+ và Mg2+, được làm mềm bằng phương pháp kết tủa hoặc trao đổi ion.",
  "Nhôm Al là kim loại nhẹ, tính khử mạnh nhưng có màng oxit Al2O3 bền bảo vệ. Nhôm, Al2O3 và Al(OH)3 đều là các chất lưỡng tính, vừa phản ứng được với dung dịch axit mạnh vừa phản ứng với dung dịch bazơ mạnh."
]);

addTopic("hoa", 12, "Sắt và Hợp chất của Sắt", [
  "Sắt Fe có cấu hình êlectron [Ar]3d6 4s2, là kim loại có tính khử trung bình. Tùy thuộc vào chất oxi hóa, sắt có thể bị oxi hóa thành Fe(II) hoặc Fe(III).",
  "Fe tác dụng với axit HCl hoặc H2SO4 loãng giải phóng H2 và tạo muối sắt(II). Fe tác dụng với chất oxi hóa mạnh như HNO3 đặc nóng hoặc H2SO4 đặc nóng dư tạo muối sắt(III) và sản phẩm khử.",
  "Hợp chất Fe(II) có cả tính oxi hóa và tính khử nhưng tính khử đặc trưng hơn. Fe2+ bị KMnO4 oxi hóa thành Fe3+ trong môi trường H2SO4 loãng. Hợp chất Fe(III) có tính oxi hóa đặc trưng."
]);

addTopic("hoa", 12, "Phương pháp Điều chế Kim loại", [
  "Nhiệt luyện là phương pháp điều chế kim loại trung bình và yếu bằng cách khử oxit kim loại ở nhiệt độ cao nhờ các chất khử như C, CO, H2 hoặc bột nhôm Al (nhiệt nhôm).",
  "Thủy luyện dùng kim loại có tính khử mạnh hơn đẩy kim loại yếu hơn ra khỏi dung dịch muối của chúng ở nhiệt độ thường.",
  "Điện phân gồm điện phân nóng chảy (điều chế kim loại kiềm, kiềm thổ, nhôm từ Al2O3) và điện phân dung dịch (điều chế kim loại trung bình và yếu như Cu, Ag, Fe)."
]);

// =========================================================================
// 2. VẬT LÝ (THPT - LỚP 10, 11, 12)
// =========================================================================

// LỚP 10 VẬT LÝ
addTopic("ly", 10, "Chuyển động Thẳng biến đổi Đều", [
  "Chuyển động thẳng biến đổi đều là chuyển động có quỹ đạo thẳng và có gia tốc không đổi theo thời gian. Nếu vận tốc tăng đều theo thời gian thì là chuyển động nhanh dần đều (a*v > 0). Nếu vận tốc giảm đều thì là chậm dần đều (a*v < 0).",
  "Phương trình vận tốc v = v0 + a*t. Phương trình tọa độ x = x0 + v0*t + 0.5*a*t^2. Quãng đường đi được s = v0*t + 0.5*a*t^2. Công thức liên hệ giữa v, a, s không phụ thuộc t: v^2 - v0^2 = 2*a*s.",
  "Sự rơi tự do là chuyển động rơi chỉ dưới tác dụng của trọng lực. Sự rơi tự do là chuyển động thẳng nhanh dần đều theo phương thẳng đứng, hướng xuống dưới với gia tốc g không đổi tại một nơi xác định."
]);

addTopic("ly", 10, "Các Định luật Newton về Cơ học", [
  "Định luật 1 Newton: Nếu một vật không chịu tác dụng của lực nào hoặc chịu tác dụng của các lực có hợp lực bằng 0 thì vật đang đứng yên sẽ tiếp tục đứng yên, vật đang chuyển động sẽ tiếp tục chuyển động thẳng đều. Quán tính là tính chất giữ nguyên vận tốc của vật.",
  "Định luật 2 Newton: Gia tốc của một vật cùng hướng với lực tác dụng lên vật. Độ lớn của gia tốc tỉ lệ thuận với độ lớn của lực và tỉ lệ nghịch với khối lượng của vật: a = F / m hay F = m * a.",
  "Định luật 3 Newton: Trong mọi trường hợp, khi vật A tác dụng lên vật B một lực thì vật B cũng tác dụng lại vật A một lực. Hai lực này là hai lực trực đối: cùng phương, cùng độ lớn nhưng ngược chiều và xuất hiện đồng thời."
]);

addTopic("ly", 10, "Lực Ma sát và Lực Đàn hồi", [
  "Lực ma sát trượt xuất hiện ở mặt tiếp xúc khi một vật trượt trên bề mặt vật khác, cản trở chuyển động trượt. Độ lớn lực ma sát trượt F_ms = mu * N với mu là hệ số ma sát trượt và N là áp lực lên bề mặt.",
  "Lực ma sát nghỉ xuất hiện giữ cho vật đứng yên khi vật chịu tác dụng của lực song song với mặt tiếp xúc. Lực ma sát nghỉ có độ lớn bằng lực kéo và có giá trị cực đại lớn hơn lực ma sát trượt.",
  "Lực đàn hồi xuất hiện khi một vật bị biến dạng đàn hồi, có xu hướng đưa vật trở về hình dạng ban đầu. Lực đàn hồi lò xo tuân theo định luật Hooke: F_đh = k * |delta l| với k là độ cứng lò xo và delta l là độ biến dạng."
]);

addTopic("ly", 10, "Chuyển động Tròn đều và Lực Hướng tâm", [
  "Chuyển động tròn đều là chuyển động có quỹ đạo tròn và tốc độ độ lớn không đổi. Tốc độ góc omega = Delta alpha / Delta t (rad/s). Tốc độ dài v = omega * r. Chu kỳ T = 2*pi / omega, tần số f = 1 / T.",
  "Trong chuyển động tròn đều, tuy độ lớn vận tốc không đổi nhưng hướng vận tốc luôn thay đổi nên vật có gia tốc. Gia tốc hướng tâm a_ht = v^2 / r = omega^2 * r hướng vào tâm quỹ đạo.",
  "Lực hướng tâm là hợp lực tác dụng lên vật chuyển động tròn đều gây ra gia tốc hướng tâm: F_ht = m * a_ht = m * v^2 / r. Lực hướng tâm có thể là lực hấp dẫn, lực ma sát nghỉ hoặc lực căng dây."
]);

addTopic("ly", 10, "Công và Công suất Cơ học", [
  "Công của lực không đổi F làm vật dịch chuyển một quãng đường s là A = F * s * cos(alpha) với alpha là góc giữa vectơ lực F và vectơ vận tốc. Đơn vị của công là Jun (J).",
  "Khi alpha < 90° thì cos(alpha) > 0, công A > 0 được gọi là công phát động. Khi alpha = 90° thì cos(alpha) = 0, lực không sinh công. Khi 90° < alpha <= 180° thì A < 0 được gọi là công cản.",
  "Công suất P = A / t đo tốc độ thực hiện công trong một đơn vị thời gian. Đơn vị của công suất là Oát (W). Công suất cũng được tính bằng P = F * v khi lực F cùng hướng với vận tốc v."
]);

addTopic("ly", 10, "Động năng, Thế năng và Cơ năng", [
  "Động năng Wd = 0.5 * m * v^2 là năng lượng vật có được do chuyển động. Động năng tỉ lệ thuận với khối lượng m và bình phương vận tốc v. Định lý động năng: Độ biến thiên động năng bằng tổng công của các lực tác dụng lên vật.",
  "Thế năng trọng trường Wt = m * g * h là năng lượng tương tác giữa Trái Đất và vật, phụ thuộc vào vị trí của vật trong trọng trường so với mốc thế năng được chọn.",
  "Cơ năng W = Wd + Wt là tổng động năng và thế năng của vật. Khi một vật chuyển động chỉ chịu tác dụng của trọng lực hoặc lực đàn hồi thì cơ năng của vật là một đại lượng bảo toàn."
]);

addTopic("ly", 10, "Động lượng và Định luật Bảo toàn Động lượng", [
  "Động lượng p = m * v là một đại lượng vectơ cùng hướng với vectơ vận tốc v. Đơn vị của động lượng là kg.m/s. Xung lượng của lực F * Delta t bằng độ biến thiên động lượng Delta p của vật.",
  "Một hệ vật được gọi là hệ kín (hệ lập) nếu các vật trong hệ chỉ tương tác với nhau (nội lực) mà không chịu tác dụng của ngoại lực hoặc tổng ngoại lực bằng 0.",
  "Định luật bảo toàn động lượng: Tổng động lượng của một hệ kín là một đại lượng không đổi cả về hướng và độ lớn: sum p_trước = sum p_sau. Ứng dụng để giải các bài toán va chạm và chuyển động bằng lực đẩy khí."
]);

addTopic("ly", 10, "Nhiệt học và Định luật Khí Lý tưởng", [
  "Định luật Boyle-Mariotte: Trong quá trình đẳng nhiệt của một khối lượng khí xác định, áp suất tỉ lệ nghịch với thể tích: p1 * V1 = p2 * V2 hay p * V = const.",
  "Định luật Charles: Trong quá trình đẳng tích của một khối lượng khí xác định, áp suất tỉ lệ thuận với nhiệt độ tuyệt đối T (Kelvin): p1 / T1 = p2 / T2.",
  "Phương trình trạng thái của khí lý tưởng: p * V / T = const hay p1 * V1 / T1 = p2 * V2 / T2 với T(K) = t(°C) + 273."
]);

// LỚP 11 VẬT LÝ
addTopic("ly", 11, "Điện trường và Định luật Coulomb", [
  "Định luật Coulomb: Lực hút hoặc đẩy giữa hai điện tích điểm q1, q2 đặt cách nhau một khoảng r trong chân không có phương trùng với đường thẳng nối hai điện tích, độ lớn F = k * |q1 * q2| / r^2 với k = 9x10^9 N.m^2/C^2.",
  "Điện trường là môi trường vật chất tồn tại xung quanh điện tích và tác dụng lực điện lên điện tích khác đặt trong nó. Cường độ điện trường E = F / q là đại lượng vectơ đặc trưng cho điện trường về phương diện tác dụng lực.",
  "Đường sức điện là đường mà tiếp tuyến tại mỗi điểm trùng với phương của vectơ cường độ điện trường. Đường sức điện của điện tích dương đi ra, của điện tích âm đi vào và không bao giờ cắt nhau."
]);

addTopic("ly", 11, "Điện thế, Hiệu điện thế và Tụ điện", [
  "Công của lực điện làm dịch chuyển điện tích q trong điện trường không phụ thuộc hình dạng đường đi mà chỉ phụ thuộc vị trí điểm đầu và điểm cuối: A_AB = q * E * d. Điện trường là một trường thế.",
  "Hiệu điện thế U_AB = V_A - V_B = A_AB / q là đại lượng đặc trưng cho khả năng thực hiện công của điện trường giữa hai điểm A và B. Trong điện trường đều, U = E * d.",
  "Tụ điện là hệ hai vật dẫn đặt gần nhau và ngăn cách nhau bằng một lớp cách điện. Điện dung C = Q / U đo khả năng tích điện của tụ. Năng lượng điện trường tích trữ trong tụ W = 0.5 * C * U^2."
]);

addTopic("ly", 11, "Dòng điện Không đổi và Định luật Ohm", [
  "Dòng điện không đổi là dòng điện có chiều và cường độ không thay đổi theo thời gian: I = q / t. Suất điện động E của nguồn điện đặc trưng cho khả năng thực hiện công của lực ngoại bên trong nguồn: E = A_nguồn / q.",
  "Định luật Ohm cho đoạn mạch chỉ chứa điện trở thuần R: I = U / R. Điện trở của dây dẫn hình trụ R = rho * L / S với rho là điện trở suất của vật liệu, L là chiều dài và S là tiết diện dây.",
  "Định luật Ohm cho toàn mạch chứa nguồn điện (E, r) và điện trở ngoài R: I = E / (R + r). Hiệu điện thế hai cực của nguồn U = E - I * r. Công suất nguồn P = E * I, hiệu suất H = U_ngoài / E."
]);

addTopic("ly", 11, "Từ trường và Lực Ampe", [
  "Từ trường là dạng vật chất tồn tại xung quanh hạt mang điện chuyển động, dòng điện hoặc nam châm và tác dụng lực từ lên nam châm hoặc dòng điện khác đặt trong nó.",
  "Vectơ cảm ứng từ B đặc trưng cho từ trường về phương diện tác dụng lực từ. Đường sức từ là những đường cong kín (hoặc vô hạn ở hai đầu) sao cho tiếp tuyến tại mỗi điểm trùng với hướng của cảm ứng từ.",
  "Lực Ampe tác dụng lên đoạn dây dẫn mang dòng điện I dài L đặt trong từ trường B có độ lớn F = B * I * L * sin(alpha). Chiều của lực Ampe xác định theo quy tắc bàn tay trái."
]);

addTopic("ly", 11, "Lực Lorenxơ tác dụng lên Hạt mang điện", [
  "Lực Lorenxơ là lực do từ trường tác dụng lên một hạt mang điện q di chuyển với vận tốc v trong từ trường B. Lực Lorenxơ có độ lớn f = |q| * v * B * sin(alpha) với alpha là góc giữa v và B.",
  "Chiều lực Lorenxơ xác định bằng quy tắc bàn tay trái: Đặt bàn tay trái sao cho các đường sức từ hướng vào lòng bàn tay, chiều từ cổ tay đến ngón tay chỉ chiều v (nếu q > 0), ngón tay cái ngón 90° chỉ chiều lực Lorenxơ.",
  "Do lực Lorenxơ luôn vuông góc với vectơ vận tốc v nên lực Lorenxơ không sinh công, không làm thay đổi tốc độ và động năng của hạt mà chỉ làm thay đổi hướng chuyển động làm hạt quỹ đạo cong."
]);

addTopic("ly", 11, "Hiện tượng Cảm ứng Điện từ", [
  "Từ thông qua diện tích S đặt trong từ trường B là Phi = B * S * cos(alpha) với alpha là góc giữa vectơ cảm ứng từ B và pháp tuyến n của diện tích S. Đơn vị từ thông là Vơbe (Wb).",
  "Khi từ thông qua một mạch kín biến thiên theo thời gian thì trong mạch xuất hiện dòng điện cảm ứng. Suất điện động cảm ứng e_c = - dPhi / dt tỉ lệ với tốc độ biến thiên từ thông qua mạch.",
  "Định luật Lenz: Dòng điện cảm ứng xuất hiện trong mạch kín có chiều sao cho từ trường do nó sinh ra chống lại sự biến thiên của từ thông sinh ra nó."
]);

addTopic("ly", 11, "Khúc xạ Ánh sáng và Phản xạ Toàn phần", [
  "Khúc xạ ánh sáng là hiện tượng lệch phương của các tia sáng khi truyền xiên góc qua mặt phân cách giữa hai môi trường trong suốt khác nhau. Định luật khúc xạ: n1 * sin(i) = n2 * sin(r).",
  "Chiết suất tuyệt đối n của một môi trường là tỉ số giữa tốc độ ánh sáng trong chân không c và tốc độ ánh sáng v trong môi trường đó: n = c / v. Chiết suất tỉ đối n21 = n2 / n1.",
  "Hiện tượng phản xạ toàn phần là hiện tượng phản xạ toàn bộ tia sáng tới trở lại môi trường chứa tia tới. Điều kiện xảy ra phản xạ toàn phần: Ánh sáng truyền từ n1 sang n2 nhỏ hơn (n1 > n2) và góc tới i >= i_gh với sin(i_gh) = n2 / n1."
]);

addTopic("ly", 11, "Thấu kính Mỏng và Quang cụ", [
  "Thấu kính mỏng là một khối chất trong suốt giới hạn bởi hai mặt cầu hoặc một mặt cầu và một mặt phẳng. Thấu kính hội tụ (rìa mỏng) f > 0, thấu kính phân kỳ (rìa dày) f < 0.",
  "Công thức thấu kính: 1/f = 1/d + 1/d' với d là khoảng cách từ vật đến thấu kính, d' là khoảng cách từ ảnh đến thấu kính. Độ phóng đại ảnh k = -d' / d.",
  "Mắt cận thị có tiêu điểm F' nằm trước võng mạc, Cv ở hữu hạn, khắc phục bằng thấu kính phân kỳ. Mắt lão thị hoặc viễn thị khắc phục bằng thấu kính hội tụ để nhìn rõ vật ở gần."
]);

// LỚP 12 VẬT LÝ
addTopic("ly", 12, "Dao động Điều hòa Cơ học", [
  "Dao động điều hòa là dao động trong đó li độ của vật là một hàm cosin (hoặc sin) theo thời gian: x = A * cos(omega * t + phi). Biên độ A là li độ cực đại, omega là tần số góc, phi là pha ban đầu.",
  "Vận tốc là đạo hàm bậc nhất của li độ theo thời gian: v = x' = -omega * A * sin(omega * t + phi). Vận tốc biến thiên điều hòa sớm pha pi/2 so với li độ, v_max = omega * A tại vị trí cân bằng.",
  "Gia tốc là đạo hàm bậc nhất của vận tốc: a = v' = -omega^2 * x. Gia tốc luôn hướng về vị trí cân bằng và ngược pha so với li độ, a_max = omega^2 * A tại hai biên."
]);

addTopic("ly", 12, "Con lắc Lò xo và Con lắc Đơn", [
  "Con lắc lò xo gồm một vật nhỏ khối lượng m gắn vào lò xo có độ cứng k. Tần số góc omega = sqrt(k/m), chu kỳ T = 2*pi*sqrt(m/k). Chu kỳ con lắc lò xo không phụ thuộc vào gia tốc trọng trường g.",
  "Con lắc đơn gồm vật nặng m treo vào dây mảnh chiều dài l không giãn. Tần số góc omega = sqrt(g/l), chu kỳ T = 2*pi*sqrt(l/g). Chu kỳ con lắc đơn phụ thuộc vào chiều dài l và gia tốc g tại nơi treo.",
  "Cơ năng con lắc lò xo W = 0.5 * k * A^2 = 0.5 * m * v_max^2. Khi không có ma sát, cơ năng là một đại lượng bảo toàn, có sự chuyển hóa qua lại giữa động năng và thế năng."
]);

addTopic("ly", 12, "Dao động Tắt dần, Cưỡng bức và Cộng hưởng", [
  "Dao động tắt dần có biên độ và năng lượng giảm dần theo thời gian do lực ma sát của môi trường tiêu hao cơ năng thành nhiệt năng. Ma sát càng lớn thì tắt dần càng nhanh.",
  "Dao động cưỡng bức là dao động dưới tác dụng của một ngoại lực cưỡng bức tuần hoàn. Khi ổn định, dao động cưỡng bức có biên độ không đổi và tần số bằng tần số f_f của ngoại lực.",
  "Hiện tượng cộng hưởng xảy ra khi tần số ngoại lực cưỡng bức bằng tần số dao động riêng của hệ (f_f = f0). Khi đó, biên độ dao động cưỡng bức đạt giá trị cực đại."
]);

addTopic("ly", 12, "Sóng Cơ học và Phương trình Sóng", [
  "Sóng cơ là sự lan truyền dao động cơ trong môi trường vật chất. Sóng ngang có phương dao động vuông góc với phương truyền sóng (truyền trong chất rắn và bề mặt chất lỏng). Sóng dọc có phương dao động trùng phương truyền sóng.",
  "Bước sóng lambda = v * T = v / f là khoảng cách giữa hai điểm gần nhất trên cùng một phương truyền sóng dao động cùng pha. Vận tốc truyền sóng v phụ thuộc vào bản chất môi trường.",
  "Phương trình sóng tại điểm M cách nguồn O khoảng d: u_M = A * cos(omega * t - 2*pi*d / lambda). Dao động tại M trễ pha hơn dao động tại nguồn O một góc Delta phi = 2*pi*d / lambda."
]);

addTopic("ly", 12, "Giao thoa Sóng và Sóng Dừng", [
  "Giao thoa sóng là sự kết hợp của hai hay nhiều sóng kết hợp (cùng tần số, cùng phương và độ lệch pha không đổi theo thời gian) tạo nên các vị trí tăng cường hoặc triệt tiêu lẫn nhau.",
  "Với hai nguồn cùng pha, những điểm dao động với biên độ cực đại có hiệu đường đi d2 - d1 = k * lambda. Những điểm cực tiểu dao động triệt tiêu có hiệu đường đi d2 - d1 = (k + 0.5) * lambda.",
  "Sóng dừng hình thành do sự giao thoa giữa sóng tới và sóng phản xạ trên cùng một phương truyền. Khoảng cách giữa hai nút sóng hoặc hai bụng sóng liên tiếp là lambda / 2. Khoảng cách giữa một nút và một bụng liên tiếp là lambda / 4."
]);

addTopic("ly", 12, "Dòng điện Xoay chiều Mạch RLC", [
  "Dòng điện xoay chiều i = I0 * cos(omega * t + phi_i) có cường độ biến thiên điều hòa theo thời gian. Cường độ hiệu dụng I = I0 / sqrt(2), điện áp hiệu dụng U = U0 / sqrt(2).",
  "Mạch RLC nối tiếp có tổng trở Z = sqrt(R^2 + (Z_L - Z_C)^2) với cảm kháng Z_L = omega*L và dung kháng Z_C = 1 / (omega*C). Độ lệch pha giữa u và i xác định bởi tan(phi) = (Z_L - Z_C) / R.",
  "Hiện tượng cộng hưởng điện xảy ra khi Z_L = Z_C (omega^2 * L * C = 1). Lúc này tổng trở mạch Z_min = R, cường độ dòng điện hiệu dụng đạt cực đại I_max = U / R và hệ số công suất cos(phi) = 1."
]);

addTopic("ly", 12, "Máy Biến áp và Truyền tải Điện", [
  "Máy biến áp là thiết bị làm biến đổi điện áp xoay chiều mà không làm thay đổi tần số, hoạt động dựa trên hiện tượng cảm ứng điện từ. Tỉ số điện áp U1 / U2 = N1 / N2.",
  "Công suất hao phí trên đường dây truyền tải điện năng Delta P = R * P^2 / (U^2 * cos^2 phi) với R là điện trở đường dây, P là công suất truyền đi và U là điện áp ở nơi phát.",
  "Biện pháp tối ưu nhất để giảm hao phí truyền tải điện năng là tăng điện áp hiệu dụng U ở nơi phát bằng máy biến áp trước khi truyền đi. Tăng điện áp U lên n lần làm giảm hao phí n^2 lần."
]);

addTopic("ly", 12, "Sóng Điện từ và Mạch LC", [
  "Mạch dao động LC gồm một cuộn cảm L và một tụ điện C nối thành mạch kín. Mạch dao động tự do với tần số góc riêng omega = 1 / sqrt(L*C), chu kỳ T = 2*pi*sqrt(L*C).",
  "Sóng điện từ là sự lan truyền của điện từ trường biến thiên trong không gian. Sóng điện từ là sóng ngang, có vectơ điện trường E và vectơ cảm ứng từ B luôn vuông góc với nhau và vuông góc với phương truyền sóng.",
  "Sóng điện từ lan truyền được trong chân không với tốc độ lớn nhất c = 3x10^8 m/s. Sóng radio, tia hồng ngoại, ánh sáng nhìn thấy, tia tử ngoại, tia X và tia gamma đều là sóng điện từ."
]);

addTopic("ly", 12, "Lượng tử Ánh sáng và Thuyết Photoelectron", [
  "Hiện tượng quang điện ngoài là hiện tượng electron bị bứt ra khỏi bề mặt kim loại khi chiếu ánh sáng có bước sóng thích hợp vào kim loại đó. Giới hạn quang điện lambda0 = h*c / A.",
  "Thuyết lượng tử Planck: Chùm ánh sáng là một chùm các hạt photon. Mỗi photon có năng lượng E = h * f = h * c / lambda với h = 6.625x10^-34 J.s. Photon chỉ tồn tại ở trạng thái chuyển động.",
  "Phương trình Einstein cho hiện tượng quang điện: h*c / lambda = A + 0.5*m*v_max^2 với A là công thoát của kim loại và 0.5*m*v_max^2 là động năng ban đầu cực đại của electron quang điện."
]);

addTopic("ly", 12, "Vật lý Hạt nhân và Phóng xạ", [
  "Hạt nhân nguyên tử được cấu tạo từ các nucleon gồm Z prôtôn và (A-Z) nơtrôn. Độ hụt khối Delta m = Z*m_p + (A-Z)*m_n - m_hn. Năng lượng liên kết E_lk = Delta m * c^2.",
  "Năng lượng liên kết riêng E_lkr = E_lk / A đo mức độ bền vững của hạt nhân. Hạt nhân càng bền vững khi có năng lượng liên kết riêng càng lớn (các hạt nhân trung bình có A từ 50 đến 95 bền vững nhất).",
  "Phóng xạ là quá trình hạt nhân không bền vững tự phân rã phát ra các tia phóng xạ alpha, beta, gamma và biến đổi thành hạt nhân khác. Số hạt còn lại N(t) = N0 * 2^(-t/T) với T là chu kỳ bán rã."
]);

// =========================================================================
// 3. TOÁN HỌC (THPT - LỚP 10, 11, 12)
// =========================================================================

// LỚP 10 TOÁN HỌC
addTopic("toan", 10, "Mệnh đề Toán học và Tập hợp", [
  "Mệnh đề là một câu khẳng định có tính đúng hoặc sai rõ ràng. Một mệnh đề không thể vừa đúng vừa sai. Mệnh đề phủ định của P là câu khẳng định không đúng P, ký hiệu P_bar.",
  "Tập hợp là khái niệm cơ bản của toán học bao gồm các phần tử. Phép hợp A cup B là tập hợp các phần tử thuộc A hoặc B. Phép giao A cap B là tập hợp các phần tử thuộc cả A và B.",
  "Tập con A subset B nghĩa là mọi phần tử thuộc A đều thuộc B. Phần bù C_X A là tập hợp các phần tử thuộc X nhưng không thuộc A. Tập rỗng là tập hợp không có phần tử nào."
]);

addTopic("toan", 10, "Bất phương trình Bậc nhất Hai ẩn", [
  "Bất phương trình bậc nhất hai ẩn x, y có dạng ax + by < c (hoặc <=, >, >=) trong đó a, b không đồng thời bằng 0. Mỗi cặp (x0, y0) làm bất phương trình đúng là một nghiệm.",
  "Đường thẳng ax + by = c chia mặt phẳng tọa độ Oxy thành hai nửa mặt phẳng bờ d. Miền nghiệm của bất phương trình là một trong hai nửa mặt phẳng đó (có thể kể cả bờ d).",
  "Hệ bất phương trình bậc nhất hai ẩn gồm nhiều bất phương trình bậc nhất hai ẩn. Miền nghiệm của hệ là giao miền nghiệm của tất cả các bất phương trình thành phần, thường là một đa giác."
]);

addTopic("toan", 10, "Hàm số Bậc hai và Parabol", [
  "Hàm số bậc hai có dạng y = ax^2 + bx + c (a != 0) có tập xác định R. Đồ thị hàm số bậc hai là một đường Parabol có đỉnh I(-b/(2a), -Delta/(4a)) và trục đối xứng x = -b/(2a).",
  "Nếu a > 0 Parabol quay bề lõm lên trên, hàm số nghịch biến trên (-infinity, -b/(2a)) và đồng biến trên (-b/(2a), +infinity), giá trị nhỏ nhất y_min = -Delta/(4a).",
  "Nếu a < 0 Parabol quay bề lõm xuống dưới, hàm số đồng biến trên (-infinity, -b/(2a)) và nghịch biến trên (-b/(2a), +infinity), giá trị lớn nhất y_max = -Delta/(4a)."
]);

addTopic("toan", 10, "Vectơ và Phép toán Vectơ", [
  "Vectơ là một đoạn thẳng có hướng. Hai vectơ bằng nhau nếu chúng có cùng hướng và cùng độ dài. Vectơ không có điểm đầu và điểm cuối trùng nhau, độ dài bằng 0.",
  "Phép cộng vectơ tuân theo quy tắc ba điểm: AB + BC = AC và quy tắc hình bình hành với hai vectơ chung gốc: AB + AD = AC (với ABCD là hình bình hành).",
  "Phép trừ vectơ: AB - AC = CB. Tích của một số k với vectơ u là một vectơ ku cùng hướng với u nếu k >= 0 và ngược hướng nếu k < 0, độ dài |ku| = |k|*|u|."
]);

addTopic("toan", 10, "Tích vô hướng và Tọa độ Vectơ", [
  "Tích vô hướng của hai vectơ u và v là một số tính bằng u . v = |u| * |v| * cos(alpha) với alpha là góc giữa hai vectơ. Hai vectơ vuông góc khi và chỉ khi u . v = 0.",
  "Trong hệ tọa độ Oxy với hai vectơ đơn vị i, j: vectơ u = (x, y) nghĩa là u = x*i + y*j. Độ dài vectơ |u| = sqrt(x^2 + y^2). Tọa độ AB = (xB - xA, yB - yA).",
  "Tích vô hướng của u = (x1, y1) và v = (x2, y2) là u . v = x1*x2 + y1*y2. Góc cos(alpha) = (x1*x2 + y1*y2) / (sqrt(x1^2 + y1^2) * sqrt(x2^2 + y2^2))."
]);

addTopic("toan", 10, "Phương trình Đường thẳng Oxy", [
  "Vectơ pháp tuyến n = (a, b) khác 0 vuông góc với đường thẳng d. Vectơ chỉ phương u = (u1, u2) song song hoặc trùng với đường thẳng d. Nếu n = (a, b) thì u = (-b, a).",
  "Phương trình tổng quát của đường thẳng d đi qua M0(x0, y0) có vectơ pháp tuyến n = (a, b) là a(x - x0) + b(y - y0) = 0 hay ax + by + c = 0.",
  "Phương trình tham số của đường thẳng d đi qua M0(x0, y0) có vectơ chỉ phương u = (u1, u2) là x = x0 + u1*t và y = y0 + u2*t với t là tham số thực."
]);

addTopic("toan", 10, "Phương trình Đường tròn Oxy", [
  "Đường tròn tâm I(a, b) bán kính R có phương trình chính tắc (x - a)^2 + (y - b)^2 = R^2. Phương trình tổng quát x^2 + y^2 - 2ax - 2by + c = 0 với R = sqrt(a^2 + b^2 - c) > 0.",
  "Khoảng cách từ điểm M(x0, y0) đến đường thẳng d: ax + by + c = 0 tính theo công thức d(M, d) = |a*x0 + b*y0 + c| / sqrt(a^2 + b^2).",
  "Đường thẳng d tiếp xúc với đường tròn (C) tâm I bán kính R khi và chỉ khi khoảng cách từ tâm I đến đường thẳng d bằng đúng bán kính R: d(I, d) = R."
]);

addTopic("toan", 10, "Thống kê và Các Số Đặc trưng", [
  "Mẫu số liệu thu thập được đại diện cho tập hợp đối tượng nghiên cứu. Số trung bình x_bar đo giá trị trung tâm bằng tổng các giá trị chia cho số lượng phần tử N.",
  "Trung vị M_e là giá trị nằm ở chính giữa mẫu số liệu đã được sắp xếp theo thứ tự không giảm. Nếu N lẻ M_e là số ở giữa, nếu N chẵn M_e là trung bình cộng hai số ở giữa.",
  "Mốt M_o là giá trị xuất hiện với tần số lớn nhất trong mẫu số liệu. Phương sai s^2 và độ lệch chuẩn s = sqrt(s^2) đo mức độ phân tán của các số liệu quanh số trung bình."
]);

// LỚP 11 TOÁN HỌC
addTopic("toan", 11, "Hàm số Lượng giác và Tính Chất", [
  "Hàm số y = sin(x) có tập xác định R, tập giá trị [-1, 1], là hàm số lẻ, đồ thị đối xứng qua gốc tọa độ O và tuần hoàn với chu kỳ T = 2*pi.",
  "Hàm số y = cos(x) có tập xác định R, tập giá trị [-1, 1], là hàm số chẵn, đồ thị đối xứng qua trục tung Oy và tuần hoàn với chu kỳ T = 2*pi.",
  "Hàm số y = tan(x) có tập xác định R \\ {pi/2 + k*pi}, là hàm số lẻ, đồng biến trên từng khoảng xác định và tuần hoàn với chu kỳ T = pi."
]);

addTopic("toan", 11, "Phương trình Lượng giác Cơ bản", [
  "Phương trình sin(x) = m có nghiệm khi và chỉ khi |m| <= 1. Nếu m = sin(alpha) thì nghiệm là x = alpha + k*2*pi hoặc x = pi - alpha + k*2*pi (k thuộc Z).",
  "Phương trình cos(x) = m có nghiệm khi |m| <= 1. Nếu m = cos(alpha) thì nghiệm là x = alpha + k*2*pi hoặc x = -alpha + k*2*pi (k thuộc Z).",
  "Phương trình tan(x) = m luôn có nghiệm với mọi m thực. Nghiệm có dạng x = arctan(m) + k*pi (k thuộc Z). Phương trình cot(x) = m có nghiệm x = arccot(m) + k*pi."
]);

addTopic("toan", 11, "Dãy số, Cấp số Cộng và Cấp số Nhân", [
  "Cấp số cộng là dãy số mà kể từ số hạng thứ hai, mỗi số hạng bằng số hạng đứng ngay trước nó cộng với số d không đổi: u_{n+1} = u_n + d. Số hạng tổng quát u_n = u1 + (n-1)*d.",
  "Tổng n số hạng đầu tiên của cấp số cộng S_n = u1 + u2 + ... + u_n = n*(u1 + u_n) / 2 = n*[2*u1 + (n-1)*d] / 2.",
  "Cấp số nhân có u_{n+1} = u_n * q với q là công bội. Số hạng tổng quát u_n = u1 * q^(n-1). Tổng n số hạng S_n = u1 * (1 - q^n) / (1 - q) với công bội q != 1."
]);

addTopic("toan", 11, "Giới hạn Hàm số và Tính Liên tục", [
  "Giới hạn dãy số lim_{n -> +infinity} (1 / n^k) = 0 với k > 0. Giới hạn cấp số nhân lùi vô hạn có |q| < 1 có tổng S = u1 / (1 - q).",
  "Giới hạn f(x) khi x tiến đến x0 là L nếu x càng gần x0 thì f(x) càng gần L. Các quy tắc giới hạn tổng, hiệu, tích, thương tuân theo các định lý giới hạn cơ bản.",
  "Hàm số y = f(x) liên tục tại x0 thuộc tập xác định nếu lim_{x -> x0} f(x) = f(x0). Hàm số đa thức, phân thức hữu tỉ, lượng giác liên tục trên từng khoảng xác định."
]);

addTopic("toan", 11, "Đạo hàm và Ý nghĩa Tiếp tuyến", [
  "Đạo hàm của hàm số y = f(x) tại x0 là lim_{Delta x -> 0} [f(x0 + Delta x) - f(x0)] / Delta x. Đạo hàm biểu thị tốc độ biến thiên của hàm số.",
  "Ý nghĩa hình học của đạo hàm: Đạo hàm f'(x0) là hệ số góc k của tiếp tuyến của đồ thị hàm số y = f(x) tại điểm M0(x0, f(x0)).",
  "Phương trình tiếp tuyến của đồ thị y = f(x) tại điểm M0(x0, y0) là y - y0 = f'(x0) * (x - x0). Đạo hàm của các hàm cơ bản: (x^n)' = n*x^(n-1), (sin x)' = cos x, (cos x)' = -sin x."
]);

addTopic("toan", 11, "Quan hệ Song song và Vuông góc Không gian", [
  "Đường thẳng d song song với mặt phẳng (P) nếu d và (P) không có điểm chung. Điều kiện: d không nằm trong (P) và d song song với một đường thẳng d' nằm trong (P).",
  "Đường thẳng d vuông góc với mặt phẳng (P) nếu d vuông góc với mọi đường thẳng nằm trong (P). Điều kiện: d vuông góc với hai đường thẳng cắt nhau a và b nằm trong (P).",
  "Định lý ba đường vuông góc: Cho a nằm trong (P) và d không vuông góc với (P). a vuông góc với d khi và chỉ khi a vuông góc với hình chiếu d' của d trên (P)."
]);

addTopic("toan", 11, "Tổ hợp, Nhị thức Newton và Xác suất", [
  "Số chỉnh hợp A_n^k = n! / (n-k)! là số cách chọn k phần tử từ n phần tử có tính đến thứ tự. Số tổ hợp C_n^k = n! / [k!*(n-k)!] chọn k phần tử không phân biệt thứ tự.",
  "Khai triển nhị thức Newton: (a + b)^n = sum_{k=0}^n C_n^k * a^(n-k) * b^k. Số hạng tổng quát thứ (k+1) là T_{k+1} = C_n^k * a^(n-k) * b^k.",
  "Xác suất của biến cố A là P(A) = n(A) / n(Omega) với n(A) là số kết quả thuận lợi cho A và n(Omega) là tổng số kết quả đồng khả năng của không gian mẫu."
]);

// LỚP 12 TOÁN HỌC
addTopic("toan", 12, "Tính Đơn biến và Cực trị Hàm số", [
  "Hàm số y = f(x) đồng biến trên khoảng K nếu f'(x) >= 0 với mọi x thuộc K (dấu bằng xảy ra tại hữu hạn điểm). Hàm số nghịch biến nếu f'(x) <= 0 trên K.",
  "Điểm x0 là điểm cực đại của f(x) nếu f'(x) đổi dấu từ dương sang âm khi x qua x0. Điểm x0 là điểm cực tiểu nếu f'(x) đổi dấu từ âm sang dương khi x qua x0.",
  "Hàm bậc ba y = ax^3 + bx^2 + cx + d (a != 0) có y' = 3ax^2 + 2bx + c. Hàm số có 2 điểm cực trị khi y' = 0 có hai nghiệm phân biệt, tức b^2 - 3ac > 0."
]);

addTopic("toan", 12, "Giá trị Lớn nhất - Nhỏ nhất và Tiệm cận", [
  "Để tìm GTLN và GTNN của f(x) liên tục trên đoạn [a, b]: Tính f'(x), tìm các nghiệm x_i thuộc (a, b), tính f(a), f(b) và f(x_i). Số lớn nhất là GTLN, nhỏ nhất là GTNN.",
  "Đường thẳng x = x0 là tiệm cận đứng của đồ thị y = f(x) nếu ít nhất một trong các giới hạn một bên lim_{x -> x0} f(x) bằng +infinity hoặc -infinity.",
  "Đường thẳng y = y0 là tiệm cận ngang của đồ thị y = f(x) nếu lim_{x -> +infinity} f(x) = y0 hoặc lim_{x -> -infinity} f(x) = y0. Đồ thị hàm nhất biến y = (ax+b)/(cx+d) có TCĐ x = -d/c và TCN y = a/c."
]);

addTopic("toan", 12, "Hàm số Mũ và Hàm số Logarit", [
  "Hàm số mũ y = a^x (a > 0, a != 1) có tập xác định R, tập giá trị (0, +infinity), đồ thị luôn đi qua (0, 1). Đồng biến khi a > 1, nghịch biến khi 0 < a < 1.",
  "Hàm số logarit y = log_a(x) (a > 0, a != 1) có tập xác định (0, +infinity), tập giá trị R, đồ thị đi qua (1, 0). Đạo hàm (a^x)' = a^x * ln a, (ln x)' = 1/x.",
  "Các công thức logarit: log_a(b*c) = log_a b + log_a c, log_a(b/c) = log_a b - log_a c, log_a(b^k) = k * log_a b, log_a b = (log_c b) / (log_c a)."
]);

addTopic("toan", 12, "Phương trình và Bất phương trình Mũ Logarit", [
  "Phương trình a^x = b (a > 0, a != 1): Vô nghiệm nếu b <= 0; có nghiệm duy nhất x = log_a b nếu b > 0. Phương trình log_a x = b có nghiệm duy nhất x = a^b (điều kiện x > 0).",
  "Bất phương trình a^f(x) > a^g(x): Nếu a > 1 bất phương trình tương đương f(x) > g(x). Nếu 0 < a < 1 tương đương f(x) < g(x) (phải đảo chiều bất phương trình).",
  "Bất phương trình log_a f(x) > log_a g(x): Nếu a > 1 tương đương f(x) > g(x) > 0. Nếu 0 < a < 1 tương đương 0 < f(x) < g(x)."
]);

addTopic("toan", 12, "Nguyên hàm và Tích phân Xác định", [
  "Hàm số F(x) là một nguyên hàm của f(x) trên K nếu F'(x) = f(x). Họ tất cả các nguyên hàm ký hiệu int f(x) dx = F(x) + C. int x^n dx = x^(n+1) / (n+1) + C (n != -1).",
  "Tích phân xác định int_a^b f(x) dx = F(b) - F(a) với F(x) là một nguyên hàm của f(x). Tích phân không phụ thuộc vào ký hiệu biến lấy tích phân.",
  "Công thức tích phân từng phần: int_a^b u dv = (u*v)|_a^b - int_a^b v du. Thứ tự ưu tiên đặt u theo quy tắc: Logarit -> Đa thức -> Lượng giác -> Mũ."
]);

addTopic("toan", 12, "Ứng dụng Tích phân Tính Diện tích và Thể tích", [
  "Diện tích hình phẳng giới hạn bởi đồ thị y = f(x), trục Ox và hai đường thẳng x = a, x = b được tính bằng công thức S = int_a^b |f(x)| dx.",
  "Diện tích hình phẳng giới hạn bởi hai đồ thị y = f(x) và y = g(x) trên đoạn [a, b] tính theo công thức S = int_a^b |f(x) - g(x)| dx.",
  "Thể tích khối tròn xoay tạo thành khi quay hình phẳng giới hạn bởi y = f(x), trục Ox, x = a, x = b quanh trục Ox tính theo V = pi * int_a^b [f(x)]^2 dx."
]);

addTopic("toan", 12, "Số phức và Các phép toán", [
  "Số phức z = a + bi (a, b thuộc R, i^2 = -1) có phần thực a, phần ảo b. Số phức liên hợp z_bar = a - bi. Môđun của số phức |z| = sqrt(a^2 + b^2).",
  "Cộng hai số phức (a + bi) + (c + di) = (a + c) + (b + d)i. Nhận hai số phức (a + bi)*(c + di) = (ac - bd) + (ad + bc)i.",
  "Mặt phẳng tọa độ Oxy biểu diễn số phức z = a + bi bằng điểm M(a, b). Phương trình bậc hai ax^2 + bx + c = 0 (a != 0) hệ số thực có nghiệm phức khi Delta < 0."
]);

addTopic("toan", 12, "Hình học Oxyz - Mặt phẳng và Đường thẳng", [
  "Trong hệ tọa độ Oxyz, mặt phẳng (P) đi qua M0(x0, y0, z0) có vectơ pháp tuyến n = (a, b, c) có phương trình tổng quát a(x - x0) + b(y - y0) + c(z - z0) = 0.",
  "Khoảng cách từ điểm M(x1, y1, z1) đến mặt phẳng (P): ax + by + cz + d = 0 tính theo công thức d(M, P) = |a*x1 + b*y1 + c*z1 + d| / sqrt(a^2 + b^2 + c^2).",
  "Đường thẳng d đi qua M0(x0, y0, z0) có vectơ chỉ phương u = (a, b, c) khác 0 có phương trình chính tắc (x - x0)/a = (y - y0)/b = (z - z0)/c với a, b, c != 0."
]);

// =========================================================================
// 4. SINH HỌC (THPT - LỚP 10, 11, 12)
// =========================================================================

// LỚP 10 SINH HỌC
addTopic("sinh", 10, "Cấp tổ chức Thế giới Sống", [
  "Thế giới sống tổ chức theo nguyên tắc thứ bậc từ thấp đến cao: Phân tử -> Tế bào -> Cơ thể -> Quần thể -> Quần xã -> Hệ sinh thái. Cấp tổ chức dưới làm nền tảng xây dựng cấp tổ chức trên.",
  "Tế bào là đơn vị cấu trúc và chức năng cơ bản của mọi sinh vật sống. Mọi sinh vật sống đều được cấu tạo từ tế bào và các hoạt động sống đều diễn ra trong tế bào.",
  "Các cấp tổ chức sống là những hệ thống mở tự điều chỉnh, luôn trao đổi chất và năng lượng với môi trường, có khả năng sinh sản và tiến hóa để thích nghi với môi trường sống."
]);

addTopic("sinh", 10, "Cacbohidrat và Lipit Tế bào", [
  "Cacbohidrat (đường) cấu tạo từ C, H, O gồm monosaccarit (glucozơ, fructozơ), đisaccarit (saccarozơ) và polisaccarit (tinh bột, xenlulozơ, glicogen) cung cấp năng lượng chính cho tế bào.",
  "Xenlulozơ cấu tạo nên màng tế bào thực vật, tinh bột dự trữ năng lượng ở thực vật, glicogen dự trữ năng lượng ở động vật và nấm. Cacbohidrat còn liên kết với protein tạo glycoprotein màng.",
  "Lipit không tan trong nước, bao gồm mỡ (dự trữ năng lượng), phospholipid (cấu tạo màng sinh chất), steroid (cholesterol, hormone sinh dục) và sắc tố carotenoid."
]);

addTopic("sinh", 10, "Protein và Cấu trúc Bốn cấp", [
  "Protein là đại phân tử sinh học chiếm khối lượng lớn nhất trong tế bào, cấu tạo theo nguyên tắc đa phân gồm các đơn phân là 20 loại alpha-amino axit liên kết bằng liên kết peptit.",
  "Protein có 4 bậc cấu trúc không gian: Bậc 1 (chuỗi polipeptit thẳng), Bậc 2 (xoắn alpha hoặc nếp gấp beta), Bậc 3 (cấu trúc không gian 3D), Bậc 4 (kết hợp nhiều chuỗi polipeptit).",
  "Protein thực hiện đa dạng chức năng: Xúc tác các phản ứng sinh hóa (enzyme), cấu trúc tế bào, vận chuyển các chất (hemoglobin), bảo vệ cơ thể (kháng thể) và thu nhận thông tin."
]);

addTopic("sinh", 10, "Axit Nuclêic - ADN và ARN", [
  "Axit nuclêic là đại phân tử lưu giữ và truyền đạt thông tin di truyền gồm hai loại ADN (axit đêôxiribônuclêic) và ARN (axit ribônuclêic) cấu tạo từ các đơn phân nuclêôtit.",
  "ADN gồm hai chuỗi polinuclêôtit xoắn kép song song ngược chiều liên kết bổ sung A-T và G-X. Đơn phân ADN gồm đường đêôxiribôzơ, gốc phốt phát và 1 trong 4 bazơ nitơ (A, T, G, X).",
  "ARN thường gồm một chuỗi polinuclêôtit đơn. Đơn phân ARN gồm đường ribôzơ, gốc phốt phát và 4 loại bazơ nitơ A, U, G, X. Gồm 3 loại: mARN (mã sao), tARN (vận chuyển) và rARN (cấu tạo ribôxôm)."
]);

addTopic("sinh", 10, "Cấu trúc Tế bào Nhân sơ và Nhân thực", [
  "Tế bào nhân sơ (vi khuẩn) chưa có nhân hoàn chỉnh (chỉ có vùng nhân chứa ADN dạng vòng), không có màng nhân và các bào quan có màng bao bọc. Kích thước tế bào nhỏ giúp trao đổi chất nhanh.",
  "Tế bào nhân thực (thực vật, động vật, nấm) có nhân hoàn chỉnh với màng nhân bao bọc và hệ thống màng nội bào chia tế bào thành các vùng chức năng chứa các bào quan riêng biệt.",
  "Các bào quan chính: Ti thể (trạm năng lượng ATP), Lạp thể (quang hợp ở thực vật), Lưới nội chất (tổng hợp lipid và protein), Bộ máy Golgi (đóng gói phân phối), Lizôxôm (tiêu hóa nội bào)."
]);

addTopic("sinh", 10, "Màng Sinh chất và Vận chuyển Chất", [
  "Màng sinh chất cấu tạo theo mô hình khảm động Singer & Nicolson gồm lớp kép phospholipid liên tục khảm các protein màng (xuyên màng và ngoại vi) và các phân tử cholesterol.",
  "Vận chuyển thụ động là sự di chuyển của các chất qua màng từ nơi có nồng độ cao đến nơi có nồng độ thấp theo chiều gradien nồng độ, không tiêu tốn năng lượng ATP (khuếch tán và thẩm thấu).",
  "Vận chuyển chủ động là sự vận chuyển các chất qua màng ngược chiều gradien nồng độ nhờ các kênh protein vận chuyển đặc hiệu và tiêu tốn năng lượng ATP của tế bào."
]);

addTopic("sinh", 10, "Enzyme và Chuyển hóa Năng lượng", [
  "Enzyme là chất xúc tác sinh học có bản chất là protein, làm tăng tốc độ phản ứng sinh hóa bằng cách giảm năng lượng hoạt hóa của phản ứng mà không bị biến đổi sau phản ứng.",
  "Trung tâm hoạt động của enzyme có cấu trúc không gian tương thích đặc hiệu với giá thể (phân tử chịu tác dụng của enzyme) theo mô hình chìa khóa và ổ khóa.",
  "ATP (adenosin triphosphat) là đồng tiền năng lượng của tế bào. Năng lượng tích trữ trong hai liên kết cao năng giữa các gốc phốt phát dễ bị thủy phân giải phóng năng lượng cho hoạt động sống."
]);

addTopic("sinh", 10, "Hô hấp Tế bào và Quang hợp", [
  "Hô hấp tế bào là quá trình chuyển hóa năng lượng hóa học trong hợp chất hữu cơ (glucozơ) thành năng lượng ATP diễn ra qua 3 giai đoạn: Đường phân, Chu trình Krebs và Chuỗi truyền êlectron.",
  "Đường phân diễn ra ở tế bào chất biến đổi 1 glucozơ thành 2 pyruvat tạo 2 ATP và 2 NADH. Chu trình Krebs diễn ra ở chất nền ti thể tạo CO2, ATP, NADH và FADH2.",
  "Quang hợp ở thực vật biến đổi năng lượng ánh sáng Mặt Trời thành năng lượng hóa học trong cacbohidrat diễn ra tại lục lạp: 6CO2 + 6H2O -> C6H12O6 + 6O2 (nhờ ánh sáng và diệp lục)."
]);

addTopic("sinh", 10, "Chu kỳ Tế bào và Nguyên phân", [
  "Chu kỳ tế bào là khoảng thời gian từ khi tế bào được sinh ra đến khi tế bào đó phân chia thành hai tế bào con. Gồm kỳ trung gian (pha G1, S nhân đôi ADN, G2) và quá trình phân bào M.",
  "Nguyên phân là hình thức phân bào của tế bào sinh dưỡng và tế bào sinh dục sơ khai gồm 4 kỳ: Kỳ đầu, kỳ giữa (NST co xoắn cực đại tập trung mặt phẳng xích đạo), kỳ sau và kỳ cuối.",
  "Kết quả của nguyên phân: Từ 1 tế bào mẹ 2n ban đầu phân chia tạo thành 2 tế bào con có bộ nhiễm sắc thể 2n giống hệt nhau và giống hệt tế bào mẹ."
]);

// LỚP 11 SINH HỌC
addTopic("sinh", 11, "Hấp thụ Nước và Khoáng ở Thực vật", [
  "Rễ cây hấp thụ nước từ đất vào tế bào lông hút theo cơ chế thẩm thấu từ môi trường nhược trương (trong đất) vào môi trường ưu trương (trong tế bào lông hút).",
  "Các ion khoáng được rễ hấp thụ theo hai cơ chế: Thụ động (theo gradien nồng độ) và Chủ động (ngược chiều gradien nồng độ tiêu tốn năng lượng ATP từ hô hấp rễ).",
  "Dòng mạch gỗ (xilem) vận chuyển nước và khoáng từ rễ lên lá nhờ 3 lực: Lực đẩy của rễ (áp suất rễ), Lực hút do thoát hơi nước ở lá và Lực liên kết giữa các phân tử nước với nhau."
]);

addTopic("sinh", 11, "Quang hợp C3, C4 và CAM ở Thực vật", [
  "Thực vật C3 (lúa, đậu) cố định CO2 qua chu trình Calvin ở tế bào mô giậu, chất nhận CO2 đầu tiên là Ribulozo-1,5-bisphosphat tạo sản phẩm đầu tiên APG 3 cacbon.",
  "Thực vật C4 (ngô, mía) cố định CO2 hai lần tại hai loại tế bào: Tế bào mô giậu cố định CO2 thành axit 4 cacbon (AOA) và Tế bào bao bó mạch giải phóng CO2 vào chu trình Calvin.",
  "Thực vật CAM (xương rồng, dứa) sống ở vùng khô hạn mở khí khổng ban đêm để cố định CO2 tích trữ thành axit malic, ban ngày đóng khí khổng và giải phóng CO2 cho quang hợp."
]);

addTopic("sinh", 11, "Hô hấp và Hô hấp Sáng Thực vật", [
  "Hô hấp thực vật giải phóng năng lượng ATP cung cấp cho mọi hoạt động sống của cây và tạo ra các sản phẩm trung gian cho các quá trình tổng hợp chất dinh dưỡng.",
  "Hô hấp sáng là quá trình hấp thụ O2 và giải phóng CO2 ở ngoài ánh sáng diễn ra tại 3 bào quan: Lục lạp, peroxixom và ti thể ở thực vật C3 khi cường độ ánh sáng mạnh.",
  "Hô hấp sáng không tạo năng lượng ATP mà gây hao phí đến 30-50% sản phẩm quang hợp của thực vật C3. Thực vật C4 và CAM không có hiện tượng hô hấp sáng."
]);

addTopic("sinh", 11, "Tiêu hóa và Trao đổi Khí Động vật", [
  "Tiêu hóa ở động vật gồm tiêu hóa cơ học (xé, nghiền thức ăn) và tiêu hóa hóa học (nhờ enzyme tiêu hóa phân giải các đại phân tử thành các chất dinh dưỡng đơn giản).",
  "Động vật đơn bào tiêu hóa nội bào trong không bào tiêu hóa. Động vật có túi tiêu hóa (thủy tức) kết hợp tiêu hóa ngoại bào và nội bào. Động vật có ống tiêu hóa thực hiện tiêu hóa ngoại bào.",
  "Trao đổi khí hô hấp thực hiện qua màng tế bào (động vật đơn bào), qua da (giun đất, ếch nhái), qua hệ thống ống khí (côn trùng), qua mang (cá) hoặc qua phổi (chim, thú)."
]);

addTopic("sinh", 11, "Hệ Tuần hoàn và Cân bằng Nội môi", [
  "Hệ tuần hoàn hở (thân mềm, chân khớp) có máu chảy trong động mạch với áp lực thấp, trào vào khoang cơ thể trộn lẫn dịch mô tạo thành hỗn hợp máu - dịch mô.",
  "Hệ tuần hoàn kín (động vật có xương sống) có máu chảy liên tục trong mạch kín (động mạch, mao mạch, tĩnh mạch) dưới áp lực cao hoặc trung bình. Gồm tuần hoàn đơn (cá) và kép (thú).",
  "Cân bằng nội môi duy trì sự ổn định của môi trường trong cơ thể (pH, áp suất thẩm thấu, nồng độ glucose, nhiệt độ) nhờ sự phối hợp hoạt động của thận, gan và hệ thần kinh - nội tiết."
]);

addTopic("sinh", 11, "Cảm ứng và Điện thế Hoạt động", [
  "Cảm ứng ở sinh vật là khả năng tiếp nhận kích thích và phản ứng lại các kích thích từ môi trường trong và ngoài cơ thể để tồn tại và phát triển.",
  "Điện thế nghỉ là sự chênh lệch điện thế giữa hai bên màng tế bào thần kinh khi không bị kích thích: Phía trong màng mang điện tích âm, phía ngoài màng mang điện tích dương.",
  "Điện thế hoạt động phát sinh khi tế bào thần kinh bị kích thích đạt ngưỡng: Màng tế bào biến đổi trải qua 3 giai đoạn: Mất phân cực, Đảo cực và Tái phân cực."
]);

// LỚP 12 SINH HỌC
addTopic("sinh", 12, "Cấu trúc ADN và Mã Di truyền", [
  "Phân tử ADN gồm hai chuỗi polinuclêôtit xoắn kép song song ngược chiều (5'-3' và 3'-5') liên kết bổ sung A-T bằng 2 liên kết hiđrô, G-X bằng 3 liên kết hiđrô.",
  "Mã di truyền là mã bộ ba: 3 nuclêôtit kế tiếp trên mARN (codon) mã hóa cho 1 amino axit trong chuỗi polipeptit. Gồm 64 bộ ba (61 bộ ba mã hóa, 3 bộ ba kết thúc UAA, UAG, UGA).",
  "Đặc điểm mã di truyền: Tính phổ biến (mọi loài dùng chung mã), Tính thoái hóa (nhiều bộ ba cùng mã hóa 1 amino axit) và Tính đặc hiệu (1 bộ ba chỉ mã hóa 1 amino axit)."
]);

addTopic("sinh", 12, "Sao chép ADN và Phiên mã", [
  "Quá trình nhân đôi ADN diễn ra ở pha S kỳ trung gian theo nguyên tắc bán bảo toàn và nguyên tắc bổ sung. Enzyme ADN Polymerase tổng hợp mạch mới theo chiều 5' -> 3'.",
  "Trên mạch khuôn 3'->5' mạch mới tổng hợp liên tục. Trên mạch khuôn 5'->3' mạch mới tổng hợp gián đoạn thành các đoạn Okazaki ngắn, sau đó nối lại nhờ enzyme Ligase.",
  "Phiên mã tổng hợp mARN diễn ra trên mạch khuôn 3'->5' của gen nhờ enzyme ARN Polymerase theo nguyên tắc bổ sung A-U, T-A, G-X, X-G."
]);

addTopic("sinh", 12, "Dịch mã và Operon Lac", [
  "Dịch mã tổng hợp protein diễn ra tại ribôxôm trong tế bào chất. tARN mang amino axit có bộ ba đối mã (anticodon) đến khớp bổ sung với bộ ba mã sao (codon) trên mARN.",
  "Mã mở đầu AUG mã hóa cho Formyl-Metionin ở vi khuẩn (sinh vật nhân sơ) hoặc Metionin ở sinh vật nhân thực. Quá trình dịch mã kết thúc khi ribôxôm gặp bộ ba kết thúc.",
  "Operon Lac ở E. coli gồm vùng khởi động P, vùng vận hành O và nhóm gen cấu trúc Z, Y, A. Khi có lactozơ, lactozơ liên kết làm biến đổi cấu hình protein chế tiết khiến nó rời vùng O, giúp Operon mở phiên mã."
]);

addTopic("sinh", 12, "Đột biến Gen và Đột biến Nhiễm sắc thể", [
  "Đột biến gen là những biến đổi nhỏ trong cấu trúc của gen liên quan đến một hoặc một số cặp nuclêôtit (đột biến điểm: Thay thế, Thêm, Mất 1 cặp nuclêôtit).",
  "Đột biến mất hoặc thêm 1 cặp nuclêôtit làm dịch khung đọc mã di truyền từ vị trí đột biến về sau, làm biến đổi toàn bộ chuỗi polipeptit do gen đó mã hóa.",
  "Đột biến cấu trúc NST gồm Mất đoạn, Lặp đoạn, Đảo đoạn và Chuyển đoạn. Đột biến số lượng NST gồm Lệch bội (2n+1, 2n-1) và Đa bội (3n, 4n) do cặp NST không phân ly."
]);

addTopic("sinh", 12, "Quy luật Di truyền Mendel và Liên kết Gen", [
  "Định luật phân ly Mendel: Lai dị hợp Aa x Aa cho tỉ lệ kiểu hình 3 trội : 1 lặn, tỉ lệ kiểu gen 1AA : 2Aa : 1aa. Mỗi tính trạng do một cặp alen quy định.",
  "Định luật phân ly độc lập: Các cặp alen nằm trên các cặp NST tương đồng khác nhau phân ly độc lập trong quá trình hình thành giao tử. Lai AaBb x AaBb cho tỉ lệ kiểu hình (3:1)(3:1) = 9:3:3:1.",
  "Hoán vị gen xảy ra do sự tiếp hợp và trao đổi chéo giữa 2 crômatit khác nguồn gốc ở kỳ đầu giảm phân I, tạo giao tử hoán vị với tần số f <= 50%."
]);

addTopic("sinh", 12, "Di truyền Quần thể và Hardy-Weinberg", [
  "Tần số alen p(A) = (2*N_AA + N_Aa) / (2*N). Quần thể giao phối tự do ngẫu nhiên duy trì cấu trúc di truyền cân bằng theo định luật Hardy-Weinberg.",
  "Công thức cân bằng Hardy-Weinberg: p^2 AA + 2pq Aa + q^2 aa = 1 với p là tần số alen A, q là tần số alen a và p + q = 1.",
  "Điều kiện cân bằng Hardy-Weinberg: Quần thể kích thước lớn, giao phối ngẫu nhiên, không có đột biến, không có chọn lọc tự nhiên và không có di - nhập gen."
]);

addTopic("sinh", 12, "Bằng chứng Tiến hóa và Thuyết Tổng hợp", [
  "Bằng chứng sinh học phân tử (ADN, protein) là bằng chứng trực tiếp thuyết phục nhất chứng minh nguồn gốc chung của sinh giới. Cơ quan tương đồng có cùng nguồn gốc nhưng khác chức năng.",
  "Tiến hóa nhỏ là quá trình biến đổi tần số alen và thành phần kiểu gen của quần thể dẫn đến hình thành loài mới dưới tác động của các nhân tố tiến hóa.",
  "Các nhân tố tiến hóa: Đột biến (tạo biến dị sơ cấp), Di - nhập gen, Chọn lọc tự nhiên (định hướng tiến hóa), Yếu tố ngẫu nhiên và Giao phối không ngẫu nhiên."
]);

addTopic("sinh", 12, "Sinh thái học và Chu trình Sinh Địa hóa", [
  "Quần xã sinh vật gồm nhiều quần thể khác loài cùng sống trong một không gian thời gian. Diễn thế sinh thái là quá trình biến đổi tuần tự của quần xã qua các giai đoạn.",
  "Hệ sinh thái gồm quần xã sinh vật và sinh cảnh vô sinh. Chuỗi thức ăn biểu diễn mối quan hệ dinh dưỡng: Sinh vật sản xuất -> Sinh vật tiêu thụ -> Sinh vật phân giải.",
  "Chu trình cacbon: Cacbon đi vào sinh giới dưới dạng CO2 nhờ quang hợp của thực vật và trở lại môi trường qua hô hấp, phân giải sinh vật và đốt nhiên liệu hóa thạch."
]);

console.log(`✅ [RAG Corpus Generator] Đã tạo xong tổng cộng ${corpus.length} đoạn tri thức RAG!`);
console.log(`   - Hóa học: ${corpus.filter(c => c.subject === 'hoa').length} đoạn`);
console.log(`   - Vật lý:  ${corpus.filter(c => c.subject === 'ly').length} đoạn`);
console.log(`   - Toán học: ${corpus.filter(c => c.subject === 'toan').length} đoạn`);
console.log(`   - Sinh học: ${corpus.filter(c => c.subject === 'sinh').length} đoạn`);

// Save stem-corpus.json
const outputPath = path.resolve('src/ai-training/datasets/rag-knowledge/stem-corpus.json');
fs.writeFileSync(outputPath, JSON.stringify(corpus, null, 2), 'utf-8');
console.log(`✅ [RAG Corpus Generator] Đã lưu tệp stem-corpus.json thành công tại: ${outputPath}`);

/**
 * PHYSICS LAB - HỆ THỐNG LÝ THUYẾT (THEORY SYSTEM)
 * Tự động tiêm Nút nổi (FAB) và Modal chứa lý thuyết tương ứng với từng bài.
 */

(function initTheorySystem() {
    console.log('[Theory System] Initializing...');

    // 1. DATABASE CÁC BÀI LÝ THUYẾT
    const theoryDatabase = {
        'dao-dong-dieu-hoa.html': {
            title: "Dao Động Điều Hòa",
            content: `
                <div class="space-y-6">
                    <div>
                        <h4 class="text-[var(--lab-accent)] font-bold font-tech text-md border-b border-white/10 pb-2 mb-3">Nguyên Lý Cơ Bản</h4>
                        <p class="text-sm text-slate-300">Dao động điều hòa là dao động trong đó li độ của vật là một hàm côsin (hoặc sin) của thời gian.</p>
                        <div class="bg-black/30 p-3 rounded-lg border border-white/10 text-center font-mono my-3">
                            $$ x = A \\cos(\\omega t + \\varphi) $$
                        </div>
                        <p class="text-xs text-slate-400 mt-2">Hệ thức độc lập thời gian:</p>
                        <div class="bg-black/30 p-3 rounded-lg border border-white/10 text-center font-mono">
                            $$ A^2 = x^2 + \\frac{v^2}{\\omega^2} $$
                        </div>
                    </div>

                    <div>
                        <h4 class="text-amber-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🛡️ Cơ Sở Vật Lý</h4>
                        <p class="text-sm text-slate-300">Bản chất của dao động điều hòa là kết quả của một <b>lực kéo về</b> luôn hướng về vị trí cân bằng và tỉ lệ thuận với li độ. Theo định luật II Newton:</p>
                        <div class="bg-black/30 p-3 rounded-lg border border-white/10 text-center font-mono my-2 text-amber-200">
                            $$ F = -kx = ma \\Rightarrow a = -\\frac{k}{m}x $$
                        </div>
                        <p class="text-xs text-slate-400 italic">Điều này giải thích tại sao gia tốc luôn ngược chiều và tỉ lệ với li độ.</p>
                    </div>

                    <div>
                        <h4 class="text-emerald-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🚀 Ứng Dụng Thực Tế</h4>
                        <ul class="list-disc pl-5 text-sm text-slate-300 space-y-2">
                            <li><b>Động cơ đốt trong:</b> Chuyển động của piston trong xi-lanh được mô phỏng xấp xỉ là dao động điều hòa.</li>
                            <li><b>Đồng hồ quả lắc:</b> Sử dụng tính ổn định của chu kỳ để đo lường thời gian.</li>
                            <li><b>Kiểm tra kết cấu:</b> Phân tích dao động riêng của các cây cầu hoặc tòa nhà để đảm bảo an toàn xây dựng.</li>
                        </ul>
                    </div>
                </div>
            `
        },
        'con-lac-don-lo-xo.html': {
            title: "Con Lắc Đơn & Lò Xo",
            content: `
                <div class="space-y-6">
                    <div>
                        <h4 class="text-[var(--lab-accent)] font-bold font-tech text-md border-b border-white/10 pb-2 mb-3">Nguyên Lý & Chu Kỳ</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-black/30 p-3 rounded-lg border border-white/10 text-center">
                                <p class="text-[10px] text-slate-400 mb-1">Lò xo</p>
                                $$ T = 2\\pi \\sqrt{\\frac{m}{k}} $$
                            </div>
                            <div class="bg-black/30 p-3 rounded-lg border border-white/10 text-center">
                                <p class="text-[10px] text-slate-400 mb-1">Con lắc đơn</p>
                                $$ T = 2\\pi \\sqrt{\\frac{l}{g}} $$
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 class="text-amber-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🛡️ Cơ Sở Vật Lý</h4>
                        <p class="text-sm text-slate-300">Hệ thống hoạt động dựa trên sự <b>chuyển hóa năng lượng</b> liên tục giữa Động năng và Thế năng:</p>
                        <ul class="list-disc pl-5 text-xs text-slate-400 space-y-1 my-2">
                            <li>Tại VTCB: Động năng cực đại, Thế năng bằng 0.</li>
                            <li>Tại vị trí biên: Thế năng cực đại, Động năng bằng 0.</li>
                        </ul>
                        <p class="text-sm text-slate-300 italic">Cơ năng \\(W = W_d + W_t\\) được bảo toàn nếu bỏ qua ma sát.</p>
                    </div>

                    <div>
                        <h4 class="text-emerald-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🚀 Ứng Dụng Thực Tế</h4>
                        <ul class="list-disc pl-5 text-sm text-slate-300 space-y-2">
                            <li><b>Hệ thống giảm xóc ô tô:</b> Sử dụng lò xo và bộ giảm chấn để triệt tiêu dao động khi đi qua đường gồ ghề.</li>
                            <li><b>Máy đo gia tốc cực nhạy (Seismograph):</b> Sử dụng con lắc để ghi lại các rung động nhỏ nhất của vỏ Trái Đất trong động đất.</li>
                            <li><b>Cân lò xo:</b> Ứng dụng định luật Hooke để đo khối lượng vật dựa trên độ dãn của lò xo.</li>
                        </ul>
                    </div>
                </div>
            `
        },
        'dao-dong-tat-dan.html': {
            title: "Dao Động Tắt Dần & Cộng Hưởng",
            content: `
                <div class="space-y-6">
                    <div>
                        <h4 class="text-[var(--lab-accent)] font-bold font-tech text-md border-b border-white/10 pb-2 mb-3">Hiện Tượng</h4>
                        <p class="text-sm text-slate-300">Biên độ dao động giảm dần theo thời gian do tác dụng của lực cản môi trường.</p>
                        <p class="text-xs text-slate-400 mt-2"><b>Cộng hưởng:</b> Biên độ đạt cực đại khi tần số ngoại lực cưỡng bức \\(\\Omega\\) bằng tần số riêng \\(\\omega_0\\).</p>
                    </div>

                    <div>
                        <h4 class="text-amber-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🛡️ Cơ Sở Vật Lý</h4>
                        <p class="text-sm text-slate-300">Nguyên nhân chính là <b>sự tỏa nhiệt</b>. Lực ma sát thực hiện công âm, làm tiêu tán cơ năng của hệ dưới dạng nhiệt năng vào môi trường xung quanh.</p>
                        <p class="text-sm text-slate-300 italic mt-2">Trong hiện tượng cộng hưởng, năng lượng cung cấp từ ngoại lực trùng khớp với nhịp độ dao động tự nhiên, giúp đạt hiệu suất truyền năng lượng cao nhất.</p>
                    </div>

                    <div>
                        <h4 class="text-emerald-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🚀 Ứng Dụng Thực Tế</h4>
                        <ul class="list-disc pl-5 text-sm text-slate-300 space-y-2">
                            <li><b>Cửa đóng tự động:</b> Sử dụng piston thủy tinh để tạo dao động tắt dần, tránh cửa đập mạnh vào khung.</li>
                            <li><b>Lò vi sóng:</b> Ứng dụng cộng hưởng của phân tử nước với sóng điện từ để làm nóng thức ăn nhanh chóng.</li>
                            <li><b>An toàn cầu đường:</b> Các kỹ sư phải tính toán để tần số gió hoặc nhịp điệu người đi bộ không gây cộng hưởng với cầu (tránh thảm họa cầu Tacoma Narrows).</li>
                        </ul>
                    </div>
                </div>
            `
        },
        'giao-thoa-song-co.html': {
            title: "Giao Thoa Sóng Cơ",
            content: `
                <div class="space-y-6">
                    <div>
                        <h4 class="text-[var(--lab-accent)] font-bold font-tech text-md border-b border-white/10 pb-2 mb-3">Điều Kiện Cực Đại & Cực Tiểu</h4>
                        <div class="space-y-2">
                            <div class="bg-black/30 p-2 rounded border border-green-500/30 text-center">
                                <span class="text-xs text-green-400">Cực đại:</span> $$ d_2 - d_1 = k\\lambda $$
                            </div>
                            <div class="bg-black/30 p-2 rounded border border-rose-500/30 text-center">
                                <span class="text-xs text-rose-400">Cực tiểu:</span> $$ d_2 - d_1 = (k + 0.5)\\lambda $$
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 class="text-amber-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🛡️ Cơ Sở Vật Lý</h4>
                        <p class="text-sm text-slate-300">Dựa trên <b>nguyên lý chồng chất sóng</b>. Khi hai sóng kết gặp nhau, li độ tổng hợp bằng tổng đại số các li độ thành phần. Sự lệch pha về đường đi tạo ra hiện tượng cộng hoặc triệt tiêu biên độ tại các điểm cố định trong không gian.</p>
                    </div>

                    <div>
                        <h4 class="text-emerald-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🚀 Ứng Dụng Thực Tế</h4>
                        <ul class="list-disc pl-5 text-sm text-slate-300 space-y-2">
                            <li><b>Tai nghe chống ồn chủ động (ANC):</b> Tạo ra sóng âm giao thoa triệt tiêu với tiếng ồn bên ngoài.</li>
                            <li><b>Siêu âm công nghiệp:</b> Sử dụng giao thoa để phát hiện các vết nứt nhỏ trong kim loại.</li>
                            <li><b>Thiết kế nhà hát:</b> Tính toán giao thoa để loại bỏ các "điểm chết" âm thanh trong khán phòng.</li>
                        </ul>
                    </div>
                </div>
            `
        },
        'do-tan-so-song-am.html': {
            title: "Lý Thuyết Sóng Âm",
            content: `
                <div class="space-y-6">
                    <div>
                        <h4 class="text-[var(--lab-accent)] font-bold font-tech text-md border-b border-white/10 pb-2 mb-3">Đặc Tính Vật Lý</h4>
                        <p class="text-sm text-slate-300">Sóng âm là sóng dọc truyền trong các môi trường đàn hồi. Tốc độ truyền âm: \\(v_r > v_l > v_k\\).</p>
                        <p class="text-xs text-slate-400 italic mt-2">Âm nghe được thuộc dải tần từ 16 Hz đến 20.000 Hz.</p>
                    </div>

                    <div>
                        <h4 class="text-amber-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🛡️ Cơ Sở Vật Lý</h4>
                        <p class="text-sm text-slate-300">Âm thanh thực chất là sự <b>lan truyền biến thiên áp suất</b>. Các phân tử môi trường dao động quanh VTCB, truyền động năng cho nhau nhưng không di dời cùng bước sóng.</p>
                        <p class="text-xs text-slate-400 mt-2">Công thức vận tốc âm trong chất khí phụ thuộc nhiệt độ:</p>
                        <div class="bg-black/30 p-2 rounded border border-white/10 text-center font-mono">
                            $$ v \\approx 331 + 0.61 \cdot T(^\circ C) $$
                        </div>
                    </div>

                    <div>
                        <h4 class="text-emerald-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🚀 Ứng Dụng Thực Tế</h4>
                        <ul class="list-disc pl-5 text-sm text-slate-300 space-y-2">
                            <li><b>Siêu âm y khoa:</b> Sử dụng âm tần số cao để tái tạo hình ảnh các cơ quan bên trong cơ thể.</li>
                            <li><b>Máy đo khoảng cách (Sonar):</b> Dùng để thăm dò độ sâu của biển và xác định vị trí tàu ngầm.</li>
                            <li><b>Kỹ thuật âm thanh:</b> Điều chỉnh tần số để tạo ra các hiệu ứng vang, ấm và sắc nét cho giọng hát.</li>
                        </ul>
                    </div>
                </div>
            `
        },
        'thi-nghiem-song-dung.html': {
            title: "Sóng Dừng & Tốc Độ Âm",
            content: `
                <div class="space-y-6">
                    <div>
                        <h4 class="text-[var(--lab-accent)] font-bold font-tech text-md border-b border-white/10 pb-2 mb-3">Công Thức Đo Vận Tốc</h4>
                        <div class="bg-black/30 p-3 rounded-lg border border-white/10 text-center font-mono">
                            $$ v = 2f(l_2 - l_1) $$
                        </div>
                        <p class="text-xs text-slate-400 mt-2">Trong đó \\(l_1, l_2\\) là vị trí của hai nút sóng liên tiếp.</p>
                    </div>

                    <div>
                        <h4 class="text-amber-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🛡️ Cơ Sở Vật Lý</h4>
                        <p class="text-sm text-slate-300">Hiện tượng <b>Cộng hưởng cột khí</b>: Khi sóng âm phản xạ từ mặt nước gặp sóng âm tới từ nguồn phát, chúng giao thoa tạo thành sóng dừng. Tại miệng ống, biên độ rung cực đại làm âm thanh phát ra to nhất.</p>
                    </div>

                    <div>
                        <h4 class="text-emerald-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🚀 Ứng Dụng Thực Tế</h4>
                        <ul class="list-disc pl-5 text-sm text-slate-300 space-y-2">
                            <li><b>Nhạc cụ hơi:</b> Sáo, kèn, sừng hoạt động dựa trên việc điều chỉnh chiều dài cột khí để tạo ra các nốt nhạc khác nhau.</li>
                            <li><b>Kiểm tra độ kín của đường ống:</b> Sử dụng âm vang để xác định các lỗ rò rỉ hoặc tắc nghẽn.</li>
                        </ul>
                    </div>
                </div>
            `
        },
        'song-dung.html': {
            title: "Sóng Dừng Trên Dây",
            content: `
                <div class="space-y-6">
                    <div>
                        <h4 class="text-[var(--lab-accent)] font-bold font-tech text-md border-b border-white/10 pb-2 mb-3">Nguyên Lý Sóng Dừng</h4>
                        <p class="text-sm text-slate-300">Sóng dừng hình thành do sự giao thoa của sóng tới và sóng phản xạ trên cùng một phương truyền.</p>
                        <div class="bg-black/30 p-2 rounded border border-white/10 text-center font-mono my-2">
                             $$ L = k\\frac{\\lambda}{2} \\text{ (2 đầu cố định)} $$
                        </div>
                    </div>

                    <div>
                        <h4 class="text-amber-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🛡️ Cơ Sở Vật Lý</h4>
                        <p class="text-sm text-slate-300">Bản chất là <b>sự giam cầm năng lượng</b> giữa hai ranh giới. Tại đầu cố định, sóng phản xạ bị ngược pha 180 độ so với sóng tới làm chúng luôn triệt tiêu nhau (Nút). Tại đầu tự do, chúng cùng pha tạo ra biên độ gấp đôi (Bụng).</p>
                    </div>

                    <div>
                        <h4 class="text-emerald-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🚀 Ứng Dụng Thực Tế</h4>
                        <ul class="list-disc pl-5 text-sm text-slate-300 space-y-2">
                            <li><b>Đàn Guitar/Piano:</b> Dây đàn rung tạo sóng dừng để phát ra âm thanh. Bằng cách bấm phím, ta thay đổi chiều dài dây \\(L\\), từ đó thay đổi tần số âm.</li>
                            <li><b>Anten Vi sóng:</b> Sử dụng sóng dừng trong ống dẫn sóng để tập trung năng lượng bức xạ.</li>
                        </ul>
                    </div>
                </div>
            `
        },
        'giao-thoa-anh-sang.html': {
            title: "Giao Thoa Ánh Sáng Y-âng",
            content: `
                <div class="space-y-6">
                    <div>
                        <h4 class="text-[var(--lab-accent)] font-bold font-tech text-md border-b border-white/10 pb-2 mb-3">Khoảng Vân & Bước Sóng</h4>
                        <div class="bg-black/30 p-3 rounded-lg border border-white/10 text-center font-mono">
                            $$ i = \\frac{\\lambda D}{a} $$
                        </div>
                        <p class="text-xs text-slate-400 mt-2">Vị trí vân sáng: \\(x = k.i\\), vân tối: \\(x = (k+0.5)i\\).</p>
                    </div>

                    <div>
                        <h4 class="text-amber-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🛡️ Cơ Sở Vật Lý</h4>
                        <p class="text-sm text-slate-300">Thí nghiệm chứng minh <b>tính chất sóng của ánh sáng</b>. Sự chênh lệch quãng đường giữa hai khe làm pha của sóng ánh sáng thay đổi, dẫn đến vùng sáng (cùng pha) và vùng tối (ngược pha).</p>
                    </div>

                    <div>
                        <h4 class="text-emerald-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🚀 Ứng Dụng Thực Tế</h4>
                        <ul class="list-disc pl-5 text-sm text-slate-300 space-y-2">
                            <li><b>Công nghệ Laser:</b> Giao thoa được dùng để đo khoảng cách cực kỳ chính xác (interferometer).</li>
                            <li><b>Lớp phủ chống phản xạ:</b> Trên kính mắt hoặc ống kính máy ảnh, các lớp màng mỏng gây giao thoa triệt tiêu ánh sáng phản xạ, giúp nhìn rõ hơn.</li>
                            <li><b>Kiểm tra bề mặt linh kiện:</b> Dùng ánh sáng giao thoa để soi các vết xước siêu nhỏ trên chip bán dẫn.</li>
                        </ul>
                    </div>
                </div>
            `
        },
        'dong-dien-kim-loai.html': {
            title: "Dòng Điện Trong Kim Loại",
            content: `
                <div class="space-y-6">
                    <div>
                        <h4 class="text-[var(--lab-accent)] font-bold font-tech text-md border-b border-white/10 pb-2 mb-3">Nguyên Lý Dòng Điện</h4>
                        <p class="text-sm text-slate-300">Là dòng dịch chuyển có hướng của các electron tự do dưới tác dụng của điện trường.</p>
                        <div class="bg-black/30 p-2 rounded border border-white/10 text-center font-mono mt-2">
                             $$ \\rho = \\rho_0[1 + \\alpha(t - t_0)] $$
                        </div>
                    </div>

                    <div>
                        <h4 class="text-amber-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🛡️ Cơ Sở Vật Lý</h4>
                        <p class="text-sm text-slate-300">Sử dụng <b>mô hình khí electron</b>. Khi nhiệt độ tăng, các ion tại nút mạng tinh thể dao động mạnh hơn, làm tăng xác suất va chạm của các electron tự do, từ đó dẫn đến tăng điện trở suất.</p>
                    </div>

                    <div>
                        <h4 class="text-emerald-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🚀 Ứng Dụng Thực Tế</h4>
                        <ul class="list-disc pl-5 text-sm text-slate-300 space-y-2">
                            <li><b>Truyền tải điện năng:</b> Đồng và nhôm được dùng làm dây dẫn nhờ mật độ electron tự do cực cao.</li>
                            <li><b>Sợi đốt bóng đèn:</b> Vonfram có điện trở suất cao và chịu nhiệt tốt, nóng sáng khi dòng điện đi qua.</li>
                            <li><b>Hàn điện:</b> Tận dụng nhiệt lượng tỏa ra khi dòng điện cực lớn đi qua điểm tiếp xúc kim loại.</li>
                        </ul>
                    </div>
                </div>
            `
        },
        'dien-tro-nhiet.html': {
            title: "Lý Thuyết Thermistor",
            content: `
                <div class="space-y-6">
                    <div>
                        <h4 class="text-[var(--lab-accent)] font-bold font-tech text-md border-b border-white/10 pb-2 mb-3">NTC & PTC</h4>
                        <p class="text-sm text-slate-300">NTC: Nhiệt tăng -> Trở giảm. PTC: Nhiệt tăng -> Trở tăng vọt.</p>
                        <div class="bg-black/30 p-2 rounded border border-white/10 text-center font-mono mt-2 italic text-xs">
                             Equation (Steinhart-Hart): $$ \\frac{1}{T} = A + B \\ln(R) + C(\\ln R)^3 $$
                        </div>
                    </div>

                    <div>
                        <h4 class="text-amber-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🛡️ Cơ Sở Vật Lý</h4>
                        <p class="text-sm text-slate-300">Trong <b>NTC (Bán dẫn)</b>, nhiệt lượng cung cấp thêm năng lượng để bứt electron từ vùng hóa trị lên vùng dẫn, làm tăng nồng độ hạt tải điện. Trong <b>PTC (Ceramic)</b>, sự thay đổi hằng số điện môi tại các ranh giới hạt tạo nên rào cản năng lượng đột ngột.</p>
                    </div>

                    <div>
                        <h4 class="text-emerald-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🚀 Ứng Dụng Thực Tế</h4>
                        <ul class="list-disc pl-5 text-sm text-slate-300 space-y-2">
                            <li><b>Cảm biến nhiệt độ thông minh:</b> NTC được dùng trong điều hòa, tủ lạnh, điện thoại.</li>
                            <li><b>Cầu chì tự hồi (Polyswitch):</b> PTC bảo vệ mạch điện bằng cách tăng trở rất cao khi bị chập mạch, tự phục hồi khi sự cố được khắc phục.</li>
                        </ul>
                    </div>
                </div>
            `
        },
        'nguon-dien-mach-kin.html': {
            title: "Nguồn Điện & Mạch Kín",
            content: `
                <div class="space-y-6">
                    <div>
                        <h4 class="text-[var(--lab-accent)] font-bold font-tech text-md border-b border-white/10 pb-2 mb-3">Định Luật Ôm Toàn Mạch</h4>
                        <div class="bg-black/30 p-3 rounded-lg border border-white/10 text-center font-mono">
                            $$ I = \\frac{\\xi}{R + r} $$
                        </div>
                        <p class="text-xs text-slate-400 mt-2">Công suất mạch ngoài: \\(P = UI = I^2 R\\).</p>
                    </div>

                    <div>
                        <h4 class="text-amber-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🛡️ Cơ Sở Vật Lý</h4>
                        <p class="text-sm text-slate-300">Dựa trên <b>Bảo toàn năng lượng</b>. Công của nguồn điện (\\(A = \\xi q\\)) một phần chuyển hóa thành công hữu ích ở mạch ngoài (\\(UIt\\)), phần còn lại tiêu tán thành nhiệt bên trong nguồn do điện trở trong \\(r\\) (\\(rI^2 t\\)).</p>
                    </div>

                    <div>
                        <h4 class="text-emerald-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🚀 Ứng Dụng Thực Tế</h4>
                        <ul class="list-disc pl-5 text-sm text-slate-300 space-y-2">
                            <li><b>Bộ nguồn máy tính (PSU):</b> Tính toán điện trở trong thấp để đảm bảo ổn áp dưới tải nặng.</li>
                            <li><b>Phương tiện chạy điện (EV):</b> Quản lý hiệu suất pin dựa trên sự cân bằng giữa nội trở và hiệu suất sạc.</li>
                        </ul>
                    </div>
                </div>
            `
        },
        'mach-dien-dc.html': {
            title: "Phân Tích Mạch Kirchhoff",
            content: `
                <div class="space-y-6">
                    <div>
                        <h4 class="text-[var(--lab-accent)] font-bold font-tech text-md border-b border-white/10 pb-2 mb-3">Quy Tắc Kirchhoff</h4>
                        <p class="text-sm text-slate-300">1. Tổng dòng tại nút bằng 0. 2. Tổng điện áp trong vòng kín bằng 0.</p>
                        <div class="bg-black/30 p-2 rounded border border-white/10 text-center font-mono my-2 italic">
                             $$ \\sum I = 0 \\quad ; \\quad \\sum V = 0 $$
                        </div>
                    </div>

                    <div>
                        <h4 class="text-amber-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🛡️ Cơ Sở Vật Lý</h4>
                        <p class="text-sm text-slate-300">KCL tương ứng với <b>Bảo toàn điện tích</b> (điện tích không tự sinh ra hay mất đi tại nút). KVL tương ứng với <b>Bảo toàn năng lượng</b> (thế năng của một hạt tải điện khi đi hết một vòng kín phải bằng 0).</p>
                    </div>

                    <div>
                        <h4 class="text-emerald-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🚀 Ứng Dụng Thực Tế</h4>
                        <ul class="list-disc pl-5 text-sm text-slate-300 space-y-2">
                            <li><b>Sơ đồ dây điện nhà:</b> Áp dụng Kirchhoff để phân phối dòng điện an toàn cho các tầng.</li>
                            <li><b>Bo mạch Robot:</b> Sử dụng thuật toán MNA (dùng trong mô phỏng này) để giải các mạch phức tạp điều khiển động cơ.</li>
                        </ul>
                    </div>
                </div>
            `
        },
        'do-suat-dien-dong.html': {
            title: "Khảo Sát Đặc Tính Pin",
            content: `
                <div class="space-y-6">
                    <div>
                        <h4 class="text-[var(--lab-accent)] font-bold font-tech text-md border-b border-white/10 pb-2 mb-3">Nguyên Lý Đo</h4>
                        <p class="text-sm text-slate-300">Đặc tuyến V-A của nguồn: \\(U = \\xi - rI\\).</p>
                        <p class="text-xs text-slate-400 mt-1 italic">Nội suy \\(\\xi\\) từ giao điểm trục tung, \\(r\\) từ độ dốc.</p>
                    </div>

                    <div>
                        <h4 class="text-amber-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🛡️ Cơ Sở Vật Lý</h4>
                        <p class="text-sm text-slate-300">Dòng điện đi qua các chất điện phân bên trong pin gặp cản trở bởi độ nhớt của dung dịch và diện tích bề mặt cực điện, tạo ra nội trở \\(r\\). Hiệu điện thế rơi trên điện trở này tỷ lệ với dòng điện rút ra.</p>
                    </div>

                    <div>
                        <h4 class="text-emerald-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🚀 Ứng Dụng Thực Tế</h4>
                        <ul class="list-disc pl-5 text-sm text-slate-300 space-y-2">
                            <li><b>Kiểm tra ắc quy:</b> Đánh giá chất lượng pin dựa trên sự gia tăng nội trở theo thời gian sử dụng.</li>
                            <li><b>Công tác cứu hộ:</b> Xác định pin còn "sống" hay đã "hỏng" bằng cách đo điện áp dưới tải.</li>
                        </ul>
                    </div>
                </div>
            `
        },
        'su-chuyen-the.html': {
            title: "Sự Chuyển Thể & Nhiệt Lượng",
            content: `
                <div class="space-y-6">
                    <div>
                        <h4 class="text-[var(--lab-accent)] font-bold font-tech text-md border-b border-white/10 pb-2 mb-3">Công Thức Nhiệt</h4>
                        <p class="text-sm text-slate-300">Tăng nhiệt: \\(Q = mc\\Delta t\\). Chuyển thể: \\(Q = \\lambda m\\) hoặc \\(Q = Lm\\).</p>
                    </div>

                    <div>
                        <h4 class="text-amber-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🛡️ Cơ Sở Vật Lý</h4>
                        <p class="text-sm text-slate-300">Năng lượng cung cấp trong quá trình chuyển thể không làm tăng động năng phân tử (nhiệt độ giữ nguyên) mà dùng để <b>phá vỡ các liên kết phân tử</b> (tăng thế năng tương tác).</p>
                    </div>

                    <div>
                        <h4 class="text-emerald-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🚀 Ứng Dụng Thực Tế</h4>
                        <ul class="list-disc pl-5 text-sm text-slate-300 space-y-2">
                            <li><b>Công nghệ làm lạnh:</b> Tận dụng sự bay hơi của gas để hút nhiệt mạnh từ môi trường xung quanh.</li>
                            <li><b>Nồi áp suất:</b> Tăng áp suất để tăng điểm sôi của nước, giúp thực phẩm chín nhanh hơn.</li>
                        </ul>
                    </div>
                </div>
            `
        },
        'song-doc-song-ngang.html': {
            title: "Sóng Dọc & Sóng Ngang",
            content: `
                <div class="space-y-6">
                    <div>
                        <h4 class="text-[var(--lab-accent)] font-bold font-tech text-md border-b border-white/10 pb-2 mb-3">Phân Loại Sóng</h4>
                        <ul class="list-disc pl-5 text-sm text-slate-300 space-y-1">
                            <li><b>Sóng dọc:</b> Phương dao động trùng phương truyền sóng (ví dụ: lò xo giãn, âm thanh).</li>
                            <li><b>Sóng ngang:</b> Phương dao động vuông góc phương truyền (ví dụ: sóng trên dây, mặt nước).</li>
                        </ul>
                    </div>

                    <div>
                        <h4 class="text-amber-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🛡️ Cơ Sở Vật Lý</h4>
                        <p class="text-sm text-slate-300">Bản chất nằm ở lực liên kết trong môi trường. Sóng dọc truyền được trong cả chất khí do lực nén/giãn. Sóng ngang chỉ truyền được trong vật rắn do cần <b>lực đàn hồi biến dạng lệch</b> (Lực cắt).</p>
                    </div>

                    <div>
                        <h4 class="text-emerald-400 font-bold font-tech text-md border-b border-white/10 pb-2 mb-3 flex items-center gap-2">🚀 Ứng Dụng Thực Tế</h4>
                        <ul class="list-disc pl-5 text-sm text-slate-300 space-y-2">
                            <li><b>Địa chấn học:</b> Sóng P (dọc) và Sóng S (ngang) ứng dụng để phân tích cấu trúc lõi Trái Đất.</li>
                            <li><b>Công nghệ màn hình:</b> Các bộ lọc phân cực trong LCD dựa trên bản chất sóng ngang của ánh sáng.</li>
                        </ul>
                    </div>
                </div>
            `
        },
        'song-dung-1-tu-do.html': {
            title: "Sóng Dừng Đầu Tự Do",
            content: `
                <div class="space-y-4">
                    <p class="text-sm text-slate-300">Đầu tự do đóng vai trò là một Bụng sóng.</p>
                    <div class="bg-black/30 p-3 rounded-lg border border-white/10 text-center font-mono">
                        $$ L = (2k + 1)\\frac{\\lambda}{4} $$
                    </div>
                    <p class="text-xs text-slate-400">🛡️ Cơ sở: Tại đầu tự do, sóng phản xạ cùng pha với sóng tới làm biên độ luôn cực đại.</p>
                </div>
            `
        },
        'song-dung-2-co-dinh.html': {
            title: "Sóng Dừng 2 Đầu Cố Định",
            content: `
                <div class="space-y-4">
                    <p class="text-sm text-slate-300">Hai đầu mút luôn là Nút sóng.</p>
                    <div class="bg-black/30 p-3 rounded-lg border border-white/10 text-center font-mono">
                        $$ L = k\\frac{\\lambda}{2} $$
                    </div>
                    <p class="text-xs text-slate-400">🚀 Ứng dụng: Dùng để xác định bước sóng và chu kỳ của vật liệu dây.</p>
                </div>
            `
        }
    };

    // 2. TÌM BÀI LÝ THUYẾT TƯƠNG ỨNG VỚI URL HIỆN TẠI
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop().split('?')[0].toLowerCase();
    const cleanFile = currentFile.endsWith('.html') ? currentFile.slice(0, -5) : currentFile;
    
    console.log('[Theory System] Current file detected:', currentFile, 'Clean file:', cleanFile);
    
    // Nếu trang hiện tại không có dữ liệu lý thuyết, dùng nội dung chung
    const defaultTheory = {
        title: "Lý thuyết Tham khảo",
        content: `
            <div class="flex flex-col items-center justify-center h-full text-center space-y-4">
                <i data-lucide="book-open" class="w-12 h-12 text-slate-400/50"></i>
                <p class="text-slate-400 text-sm">Chưa có dữ liệu lý thuyết cho hệ thống này.</p>
            </div>
        `
    };

    let theoryData = defaultTheory;
    for (const key in theoryDatabase) {
        const cleanKey = key.endsWith('.html') ? key.slice(0, -5) : key.toLowerCase();
        if (cleanKey === cleanFile) {
            theoryData = theoryDatabase[key];
            break;
        }
    }

    // 3. AUTO INJECT MATHJAX NẾU CHƯA CÓ TRONG HTML
    if (!document.getElementById('MathJax-script')) {
        const mathJaxScript = document.createElement('script');
        mathJaxScript.id = 'MathJax-script';
        mathJaxScript.async = true;
        mathJaxScript.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
        document.head.appendChild(mathJaxScript);
    }

    // 4. TIÊM CSS STYLES CẦN THIẾT
    const theoryStyle = document.createElement('style');
    theoryStyle.innerHTML = `
        /* Floating Action Button */
        #theory-fab {
            position: fixed;
            bottom: 24px;
            right: 170px;
            z-index: 999999; /* Max possible z-index */
            background: linear-gradient(135deg, #0f172a, #1e293b);
            border: 1px solid rgba(0, 242, 255, 0.4);
            box-shadow: 0 4px 20px rgba(0, 242, 255, 0.15), inset 0 0 10px rgba(0, 242, 255, 0.1);
            color: #00f2ff;
            border-radius: 9999px;
            padding: 12px 24px;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            backdrop-filter: blur(8px);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        #theory-fab:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 8px 30px rgba(0, 242, 255, 0.3), inset 0 0 15px rgba(0, 242, 255, 0.2);
            background: linear-gradient(135deg, #1e293b, #334155);
        }
        .light #theory-fab {
            background: #ffffff;
            border: 1px solid #b298d3;
            color: #a482c9;
            box-shadow: 0 4px 20px rgba(178, 152, 211, 0.2);
        }
        .light #theory-fab:hover {
            background: #f8fafc;
            box-shadow: 0 8px 30px rgba(178, 152, 211, 0.4);
        }

        /* Modal Overlay */
        #theory-modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            z-index: 1000000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        #theory-modal-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        /* Modal Content Canvas */
        #theory-modal-content {
            background: rgba(15, 23, 42, 0.85); /* Slate 900 */
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            border-radius: 24px;
            width: 90%;
            max-width: 600px;
            max-height: 85vh;
            display: flex;
            flex-direction: column;
            transform: translateY(30px) scale(0.95);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .light #theory-modal-content {
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid rgba(0, 0, 0, 0.05);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
        }
        #theory-modal-overlay.active #theory-modal-content {
            transform: translateY(0) scale(1);
        }

        /* Modal Inner layout */
        .theory-header {
            padding: 20px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .light .theory-header { border-bottom: 1px solid rgba(0, 0, 0, 0.05); }
        
        .theory-body {
            padding: 24px;
            overflow-y: auto;
            flex: 1;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        .theory-body::-webkit-scrollbar { width: 6px; }
        .theory-body::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
        .light .theory-body::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.2); }
        
        .light .theory-body p { color: #475569 !important; }
        .light .theory-body ul { color: #475569 !important; }
        .light .theory-body .bg-black\\/30 { background: #f1f5f9 !important; border-color: rgba(0,0,0,0.05) !important;}
        .light .theory-body h4 { color: #1e293b !important; border-color: rgba(0,0,0,0.1) !important;}

        #theory-close-btn {
            background: rgba(255,255,255,0.05);
            border: none;
            color: #94a3b8;
            border-radius: 50%;
            width: 36px; height: 36px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        #theory-close-btn:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; transform: rotate(90deg); }
        .light #theory-close-btn { background: #f1f5f9; }
        .light #theory-close-btn:hover { background: #fee2e2; }
    `;
    document.head.appendChild(theoryStyle);

    // 5. TẠO FAB VÀ MODAL DOM
    // Tạo Nút Mở (FAB)
    const fabButton = document.createElement('button');
    fabButton.id = 'theory-fab';
    fabButton.innerHTML = `<i data-lucide="book-open"></i> Lý Thuyết`;
    // Đảm bảo document.body đã sẵn sàng
    if (!document.body) {
        console.warn('[Theory System] document.body not found, retrying...');
        setTimeout(initTheorySystem, 50);
        return;
    }

    if (document.getElementById('theory-fab')) return; // Tránh trùng lặp

    document.body.appendChild(fabButton);

    // Tạo Overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'theory-modal-overlay';
    
    // Soạn HTML cấu trúc con vào Overlay
    modalOverlay.innerHTML = `
        <div id="theory-modal-content">
            <div class="theory-header">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-[var(--lab-accent)]/10 dark:bg-sky-500/10 flex items-center justify-center border border-[var(--lab-accent)]/30 dark:border-sky-500/30">
                        <i data-lucide="graduation-cap" class="text-[var(--lab-accent)] dark:text-sky-400 w-5 h-5"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold font-tech tracking-wide text-white light:text-slate-900">${theoryData.title}</h3>
                        <p class="text-[10px] font-mono text-slate-400 tracking-wider">Cẩm nang Vật Lý</p>
                    </div>
                </div>
                <button id="theory-close-btn" title="Đóng">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <div class="theory-body text-white">
                ${theoryData.content}
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);

    // Khởi tạo lucide icons trong Modal và FAB
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 6. LOGIC MỞ CỬA SỔ
    const closeBtn = document.getElementById('theory-close-btn');

    const openModal = () => {
        modalOverlay.classList.add('active');
        // Kích hoạt MathJax render tự động (vì HTML chứa công thức được gán bằng innerHTML)
        if (window.MathJax) {
            try {
                // MathJax Version 3 syntax
                window.MathJax.typesetPromise([modalOverlay]).then(() => {
                    console.log("[Theory System] MathJax typeset complete.");
                }).catch((err) => console.log("[Theory System] MathJax typeset failed: ", err.message));
            } catch (e) {
                console.warn("[Theory System] MathJax exception:", e);
            }
        }
    };

    const closeModal = () => {
        modalOverlay.classList.remove('active');
    };

    // Chuẩn bị Events
    fabButton.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        // Đóng nếu nhấp chuột ra ngoài bounding box
        if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    console.log('[Theme System] Dynamic Theory System injected.');
})();

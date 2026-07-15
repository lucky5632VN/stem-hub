/**
 * PHYSICS LAB - HỆ THỐNG NGÂN HÀNG CÂU HỎI PARAMETERIZED
 * Database này chứa các Hạt Giống (Seeds) thuật toán sinh đề động cho từng thí nghiệm cụ thể.
 */

(function initQuizDatabase() {
    // Utility functions for parameterized generation
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomFloat = (min, max, decimals = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
    const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const roundTo = (num, decimals) => Number(Math.round(num + "e" + decimals) + "e-" + decimals);

    // Shuffle array function for answers
    const shuffleArray = (array) => {
        const arr = [...array];
        let correctIndex = 0;
        let originalCorrectItem = arr[0]; // Assuming 0 is initially correct

        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        correctIndex = arr.indexOf(originalCorrectItem);
        return { shuffled: arr, correctIndex };
    };

    const seeds = {
        'dao-dong-dieu-hoa': {
            mcq: [
                // Seed 1: Tính tốc độ dựa trên li độ x và phương trình
                () => {
                    const A = randomInt(4, 10);
                    const omega_coeff = randomChoice([2, 4, 10, 20]);
                    const phi = randomChoice(['\\frac{\\pi}{3}', '\\frac{\\pi}{2}', '\\frac{\\pi}{6}', '0']);
                    const x = randomInt(2, A - 1);

                    const v_val = roundTo(omega_coeff * Math.sqrt(A * A - x * x), 1);
                    const v_ans = `${v_val}\\pi \\text{ cm/s}`;
                    const trap1 = `-${v_val}\\pi \\text{ cm/s}`;
                    const trap2 = `${roundTo(omega_coeff * A, 1)}\\pi \\text{ cm/s}`;
                    const trap3 = `${v_val} \\text{ cm/s}`;

                    const opts = shuffleArray([v_ans, trap1, trap2, trap3]);

                    return {
                        type: 'mcq',
                        question: `Một vật dao động điều hòa với phương trình \\( x = ${A}\\cos(${omega_coeff}\\pi t + ${phi}) \\text{ (cm)} \\). Xác định tốc độ của vật khi đi qua vị trí có li độ \\( x = ${x} \\text{ cm} \\). (Cho \\( \\pi^2 \\approx 10 \\)).`,
                        options: opts.shuffled.map(o => `\\( ${o} \\)`),
                        correctAnswer: opts.correctIndex,
                        explanation: `Theo hệ thức độc lập, tốc độ \\( v = \\omega \\sqrt{A^2 - x^2} \\). Thay số: \\( v = ${omega_coeff}\\pi \\sqrt{${A}^2 - ${x}^2} = ${v_val}\\pi \\text{ (cm/s)} \\). Tốc độ luôn có giá trị dương.`
                    };
                },
                // Seed 2: Tính gia tốc cực đại
                () => {
                    const A = randomInt(5, 12);
                    const T = randomChoice([0.5, 1, 2]);
                    const omega = (2 * Math.PI) / T;
                    const a_max = roundTo((omega * omega * A) / 100, 2); // m/s^2

                    const ans = `${a_max} \\text{ m/s}^2`;
                    const trap1 = `${roundTo(a_max * Math.PI, 2)} \\text{ m/s}^2`;
                    const trap2 = `${roundTo(a_max / 10, 2)} \\text{ m/s}^2`;
                    const trap3 = `${roundTo((omega * A) / 100, 2)} \\text{ m/s}^2`;

                    const opts = shuffleArray([ans, trap1, trap2, trap3]);

                    return {
                        type: 'mcq',
                        question: `Một vật dao động điều hòa với biên độ \\( A = ${A} \\text{ cm} \\) và chu kỳ \\( T = ${T} \\text{ s} \\). Gia tốc cực đại của vật trong quá trình dao động gần nhất với giá trị nào sau đây? (Lấy \\( \\pi^2 \\approx 10 \\)).`,
                        options: opts.shuffled.map(o => `\\( ${o} \\)`),
                        correctAnswer: opts.correctIndex,
                        explanation: `Tần số góc \\( \\omega = \\frac{2\\pi}{T} = \\frac{2\\pi}{${T}} \\text{ rad/s} \\). Gia tốc cực đại \\( a_{max} = \\omega^2 A = \\left(\\frac{2\\pi}{${T}}\\right)^2 \\times ${A} \\text{ cm/s}^2 = ${roundTo(omega*omega*A, 1)} \\text{ cm/s}^2 \\approx ${a_max} \\text{ m/s}^2 \\).`
                    };
                }
            ],
            tf: [
                () => {
                    return {
                        type: 'tf_cluster',
                        context: `Một vật nhỏ dao động điều hòa dọc theo trục Ox quanh vị trí cân bằng O với phương trình \\( x = A\\cos(\\omega t + \\varphi) \\) (\\( A > 0, \\omega > 0 \\)).`,
                        statements: [
                            {
                                text: "Vận tốc và li độ của vật biến thiên điều hòa cùng tần số và lệch pha nhau một góc \\( \\pi/2 \\).",
                                isTrue: true,
                                explanation: "Đúng. Vận tốc sớm pha \\( \\pi/2 \\) so với li độ."
                            },
                            {
                                text: "Lực kéo về tác dụng lên vật luôn hướng về vị trí cân bằng và có độ lớn tỉ lệ nghịch với khoảng cách từ vật đến vị trí cân bằng.",
                                isTrue: false,
                                explanation: "Sai. Lực kéo về \\( F = -kx \\) có độ lớn tỉ lệ thuận với li độ (khoảng cách đến VTCB), không phải tỉ lệ nghịch."
                            },
                            {
                                text: "Khi vật chuyển động từ vị trí biên về vị trí cân bằng thì vectơ vận tốc và vectơ gia tốc luôn cùng chiều nhau.",
                                isTrue: true,
                                explanation: "Đúng. Vật đi từ biên về VTCB là chuyển động nhanh dần, do đó vectơ vận tốc và gia tốc cùng hướng."
                            },
                            {
                                text: "Gia tốc của vật cực đại khi vật đi qua vị trí cân bằng.",
                                isTrue: false,
                                explanation: "Sai. Tại VTCB, gia tốc bằng 0. Gia tốc đạt cực đại (độ lớn) tại các vị trí biên."
                            }
                        ]
                    };
                }
            ],
            sa: [
                () => {
                    const A = randomInt(4, 10);
                    const v_max = randomInt(20, 60);
                    // omega = v_max / A
                    const omega = v_max / A;
                    const a_max = roundTo((omega * omega * A) / 100, 1); // m/s^2

                    return {
                        type: 'sa',
                        question: `Một vật dao động điều hòa với biên độ \\( A = ${A} \\text{ cm} \\) và có tốc độ cực đại khi qua vị trí cân bằng là \\( v_{max} = ${v_max} \\text{ cm/s} \\). Tính độ lớn gia tốc cực đại của vật (tính theo \\( \\text{m/s}^2 \\), làm tròn 1 chữ số thập phân).`,
                        correctAnswer: a_max,
                        suffix: "\\( \\text{m/s}^2 \\)",
                        explanation: `Ta có \\( v_{max} = \\omega A \\Rightarrow \\omega = \\frac{v_{max}}{A} = \\frac{${v_max}}{${A}} \\text{ rad/s} \\).<br/>Gia tốc cực đại \\( a_{max} = \\omega^2 A = \\frac{v_{max}^2}{A} = \\frac{${v_max}^2}{${A}} = ${roundTo(v_max*v_max/A, 1)} \\text{ cm/s}^2 = ${a_max} \\text{ m/s}^2 \\).`
                    };
                }
            ]
        },
        'con-lac-don-lo-xo': {
            mcq: [
                // Con lắc lò xo thẳng đứng
                () => {
                    const k = randomChoice([40, 50, 100]);
                    const m_gram = randomChoice([100, 200, 400]);
                    const m = m_gram / 1000;
                    const g = 10;
                    
                    const deltaL0 = (m * g) / k;
                    const deltaL0_cm = deltaL0 * 100;
                    const A_cm = deltaL0_cm + randomInt(2, 5); 
                    const A = A_cm / 100;
                    
                    const F_max = k * (deltaL0 + A);
                    const ans = `F_{max} = ${roundTo(F_max, 1)} \\text{ N}, F_{min} = 0 \\text{ N}`;
                    const trap1 = `F_{max} = ${roundTo(F_max, 1)} \\text{ N}, F_{min} = ${roundTo(k*(A - deltaL0), 1)} \\text{ N}`;
                    const trap2 = `F_{max} = ${roundTo(k * A, 1)} \\text{ N}, F_{min} = 0 \\text{ N}`;
                    const trap3 = `F_{max} = ${roundTo(k * A, 1)} \\text{ N}, F_{min} = ${roundTo(k * (A - deltaL0), 1)} \\text{ N}`;

                    const opts = shuffleArray([ans, trap1, trap2, trap3]);

                    return {
                        type: 'mcq',
                        question: `Một con lắc lò xo treo thẳng đứng, lò xo nhẹ có độ cứng \\( k = ${k}\\text{ N/m} \\), vật nhỏ \\( m = ${m_gram}\\text{ g} \\). Kích thích để vật dao động điều hòa thẳng đứng với biên độ \\( A = ${A_cm}\\text{ cm} \\). Lấy \\( g = ${g}\\text{ m/s}^2 \\). Lực đàn hồi cực đại và cực tiểu của lò xo là:`,
                        options: opts.shuffled.map(o => `\\( ${o} \\)`),
                        correctAnswer: opts.correctIndex,
                        explanation: `Độ dãn lò xo tại VTCB: \\( \\Delta l_0 = \\frac{mg}{k} = ${deltaL0_cm} \\text{ cm} \\).<br/>Vì \\( A = ${A_cm} \\text{ cm} > \\Delta l_0 \\), vật đi qua vị trí lò xo không biến dạng, nên \\( F_{min} = 0 \\text{ N} \\). Lực đàn hồi cực đại \\( F_{max} = k(\\Delta l_0 + A) = ${roundTo(F_max, 1)} \\text{ N} \\).`
                    };
                }
            ],
            tf: [
                () => {
                    const l = randomChoice([0.8, 1.0, 1.2]);
                    const g = randomChoice([9.8, 10]);
                    return {
                        type: 'tf_cluster',
                        context: `Một con lắc đơn gồm quả cầu nhỏ treo vào sợi dây mảnh không dãn chiều dài \\( l = ${l} \\text{ m} \\) dao động điều hòa tại nơi có gia tốc trọng trường \\( g = ${g} \\text{ m/s}^2 \\) với biên độ góc nhỏ.`,
                        statements: [
                            { 
                                text: "Chu kì dao động của con lắc đơn tỉ lệ thuận với căn bậc hai của khối lượng quả cầu.", 
                                isTrue: false, 
                                explanation: "Sai. Chu kì con lắc đơn \\( T = 2\\pi\\sqrt{l/g} \\) hoàn toàn độc lập với khối lượng." 
                            },
                            { 
                                text: "Khi vật đi qua vị trí cân bằng, thế năng trọng trường đạt giá trị cực tiểu và động năng đạt cực đại.", 
                                isTrue: true, 
                                explanation: "Đúng. Vị trí cân bằng là vị trí thấp nhất (thế năng min = 0) và tốc độ lớn nhất (động năng max)." 
                            },
                            { 
                                text: "Lực căng dây của con lắc đạt giá trị cực đại khi vật ở vị trí biên.", 
                                isTrue: false, 
                                explanation: "Sai. Lực căng dây cực đại tại VTCB \\( T_{max} = mg(3-2\\cos\\alpha_0) \\) và cực tiểu tại biên." 
                            },
                            { 
                                text: "Nếu chiều dài con lắc tăng gấp 4 lần thì chu kì dao động của nó tăng gấp 2 lần.", 
                                isTrue: true, 
                                explanation: "Đúng. Vì T tỉ lệ với căn bậc hai của chiều dài l." 
                            }
                        ]
                    };
                }
            ],
            sa: [
                () => {
                    const k = randomChoice([50, 100, 200]);
                    const m1_gram = randomInt(20, 30) * 10;
                    const m2_gram = randomChoice([20, 50, 100]);
                    const v0 = randomFloat(1.0, 2.0, 2);
                    
                    const m1 = m1_gram / 1000;
                    const m2 = m2_gram / 1000;
                    const V = (m2 * v0) / (m1 + m2);
                    const omega = Math.sqrt(k / (m1 + m2));
                    const A_cm = (V / omega) * 100;
                    const final_ans = roundTo(A_cm, 1);

                    return {
                        type: 'sa',
                        question: `Một con lắc lò xo nằm ngang gồm lò xo có độ cứng \\( k = ${k}\\text{ N/m} \\), vật nặng \\( m_1 = ${m1_gram}\\text{ g} \\) đang đứng yên ở VTCB. Một vật nhỏ \\( m_2 = ${m2_gram}\\text{ g} \\) chuyển động dọc theo trục lò xo với vận tốc \\( v_0 = ${v0}\\text{ m/s} \\) đến va chạm mềm với \\( m_1 \\). Tính biên độ dao động của hệ sau va chạm (tính theo cm, làm tròn 1 chữ số thập phân).`,
                        correctAnswer: final_ans,
                        suffix: "cm",
                        explanation: `Vận tốc hệ ngay sau va chạm: \\( V = \\frac{m_2 v_0}{m_1 + m_2} = ${roundTo(V, 3)} \\text{ m/s} \\). Tần số góc hệ: \\( \\omega = \\sqrt{\\frac{k}{m_1 + m_2}} = ${roundTo(omega, 2)} \\text{ rad/s} \\). Biên độ sau va chạm \\( A = \\frac{V}{\\omega} = ${final_ans} \\text{ cm} \\).`
                    };
                }
            ]
        },
        'dao-dong-tat-dan': {
            mcq: [
                () => {
                    const loss_pct = randomInt(3, 8);
                    const E_loss = roundTo(100 - Math.pow(100 - loss_pct, 2) / 100, 1);

                    const ans = `${E_loss}\\%`;
                    const trap1 = `${loss_pct}\\%`;
                    const trap2 = `${roundTo(loss_pct * 2, 1)}\\%`;
                    const trap3 = `${roundTo(loss_pct / 2, 1)}\\%`;

                    const opts = shuffleArray([ans, trap1, trap2, trap3]);

                    return {
                        type: 'mcq',
                        question: `Một con lắc dao động tắt dần chậm. Sau mỗi chu kỳ, biên độ dao động của nó giảm đi \\( ${loss_pct}\\% \\). Phần trăm cơ năng của con lắc bị tiêu hao sau mỗi chu kỳ dao động gần nhất với giá trị nào sau đây?`,
                        options: opts.shuffled.map(o => `\\( ${o} \\)`),
                        correctAnswer: opts.correctIndex,
                        explanation: `Cơ năng tỉ lệ với bình phương biên độ: \\( W \\propto A^2 \\). Sau 1 chu kỳ, biên độ còn lại \\( A' = (1 - 0.01 \\times ${loss_pct})A \\). Cơ năng còn lại \\( W' = A'^2 = (1 - 0.01 \\times ${loss_pct})^2 W \\). Phần trăm cơ năng hao phí \\( \\Delta W \\% = 100\\% - (1 - 0.01 \\times ${loss_pct})^2 \\times 100\\% \\approx ${E_loss}\\% \\).`
                    };
                }
            ],
            tf: [
                () => {
                    return {
                        type: 'tf_cluster',
                        context: `Xét các hiện tượng liên quan đến dao động tắt dần, dao động duy trì, dao động cưỡng bức và cộng hưởng cơ học.`,
                        statements: [
                            {
                                text: "Trong dao động tắt dần, cơ năng của hệ giảm dần theo thời gian nhưng biên độ dao động vẫn không thay đổi.",
                                isTrue: false,
                                explanation: "Sai. Cả cơ năng và biên độ đều giảm dần theo thời gian trong dao động tắt dần."
                            },
                            {
                                text: "Dao động duy trì là dao động được bù thêm năng lượng đúng bằng phần năng lượng tiêu hao sau mỗi chu kỳ mà không làm thay đổi chu kỳ riêng của hệ.",
                                isTrue: true,
                                explanation: "Đúng. Đó là định nghĩa chuẩn của dao động duy trì (như cơ cấu đồng hồ quả lắc)."
                            },
                            {
                                text: "Khi xảy ra hiện tượng cộng hưởng cơ, biên độ của dao động cưỡng bức đạt giá trị cực đại khi tần số lực cưỡng bức bằng tần số riêng của hệ.",
                                isTrue: true,
                                explanation: "Đúng. Hiện tượng cộng hưởng xảy ra khi tần số ngoại lực cưỡng bức tiến sát đến tần số dao động riêng của hệ."
                            },
                            {
                                text: "Lực cản của môi trường càng lớn thì hiện tượng cộng hưởng xảy ra càng rõ nét (biên độ cộng hưởng càng nhọn).",
                                isTrue: false,
                                explanation: "Sai. Lực cản càng lớn thì biên độ cộng hưởng càng thấp và tù (kém rõ nét)."
                            }
                        ]
                    };
                }
            ],
            sa: [
                () => {
                    const l = randomFloat(0.8, 1.5, 2);
                    const g = 9.8;
                    const T_rieng = 2 * Math.PI * Math.sqrt(l / g);
                    const f_rieng = 1 / T_rieng;
                    const final_ans = roundTo(f_rieng, 2);

                    return {
                        type: 'sa',
                        question: `Một người xách một xô nước đi trên đường, mỗi bước đi dài 50 cm. Nước trong xô bị sóng sánh mạnh nhất khi chu kỳ bước đi trùng với chu kỳ dao động riêng của nước trong xô. Biết con lắc đơn tương đương của nước trong xô có chiều dài \\( l = ${l} \\text{ m} \\), gia tốc trọng trường \\( g = 9.8 \\text{ m/s}^2 \\). Tính tần số dao động riêng của xô nước (làm tròn đến 2 chữ số thập phân).`,
                        correctAnswer: final_ans,
                        suffix: "Hz",
                        explanation: `Chu kỳ riêng của hệ: \\( T_0 = 2\\pi \\sqrt{\\frac{l}{g}} = 2\\pi \\sqrt{\\frac{${l}}{9.8}} \\text{ s} \\). Tần số riêng \\( f_0 = \\frac{1}{T_0} = \\frac{1}{2\\pi}\\sqrt{\\frac{9.8}{${l}}} \\approx ${final_ans} \\text{ Hz} \\).`
                    };
                }
            ]
        },
        'giao-thoa-song-co': {
            mcq: [
                () => {
                    const f = randomChoice([10, 15, 20, 25]);
                    const v_cm = randomChoice([30, 40, 50, 60]);
                    const lambda = v_cm / f;
                    
                    const d1 = randomInt(12, 18);
                    const d2 = d1 + lambda * randomChoice([1, 2, 3]);

                    const ans = "Cực đại giao thoa";
                    const trap1 = "Cực tiểu giao thoa";
                    const trap2 = "Đứng yên không dao động";
                    const trap3 = "Dao động với biên độ bằng nửa biên độ cực đại";

                    const opts = shuffleArray([ans, trap1, trap2, trap3]);

                    return {
                        type: 'mcq',
                        question: `Tại hai điểm \\( S_1 \\) và \\( S_2 \\) trên mặt nước có hai nguồn dao động cùng pha với tần số \\( f = ${f} \\text{ Hz} \\). Tốc độ truyền sóng trên mặt nước là \\( v = ${v_cm} \\text{ cm/s} \\). Xét một điểm M cách hai nguồn các khoảng \\( d_1 = ${d1} \\text{ cm} \\) và \\( d_2 = ${d2} \\text{ cm} \\). Điểm M là:`,
                        options: opts.shuffled.map(o => o),
                        correctAnswer: opts.correctIndex,
                        explanation: `Bước sóng \\( \\lambda = \\frac{v}{f} = \\frac{${v_cm}}{${f}} = ${lambda} \\text{ cm} \\).<br/>Hiệu đường truyền: \\( d_2 - d_1 = ${d2} - ${d1} = ${d2 - d1} \\text{ cm} = ${roundTo((d2-d1)/lambda, 1)} \\lambda \\). Vì hiệu đường truyền bằng một số nguyên lần bước sóng nên M là cực đại giao thoa.`
                    };
                }
            ],
            tf: [
                () => {
                    return {
                        type: 'tf_cluster',
                        context: `Trong hiện tượng giao thoa sóng cơ học trên mặt nước với hai nguồn kết hợp \\( S_1, S_2 \\) đồng pha.`,
                        statements: [
                            {
                                text: "Để có hiện tượng giao thoa sóng ổn định, hai nguồn sóng phải dao động cùng phương, cùng tần số và có hiệu số pha không đổi theo thời gian.",
                                isTrue: true,
                                explanation: "Đúng. Đây là điều kiện cần và đủ của hai nguồn kết hợp để xảy ra giao thoa ổn định."
                            },
                            {
                                text: "Đường trung trực của đoạn thẳng nối hai nguồn kết hợp đồng pha luôn là một đường cực tiểu giao thoa.",
                                isTrue: false,
                                explanation: "Sai. Với hai nguồn cùng pha, đường trung trực là tập hợp các điểm có hiệu đường đi bằng 0, là đường cực đại giao thoa."
                            },
                            {
                                text: "Khoảng cách giữa hai cực đại giao thoa liên tiếp nằm trên đoạn thẳng nối hai nguồn bằng một nửa bước sóng.",
                                isTrue: true,
                                explanation: "Đúng. Trên đoạn thẳng nối hai nguồn, khoảng cách giữa 2 cực đại liên tiếp (hoặc 2 cực tiểu liên tiếp) luôn bằng \\( \\lambda / 2 \\)."
                            },
                            {
                                text: "Các điểm nằm trên đường cực tiểu giao thoa luôn dao động với biên độ cực đại.",
                                isTrue: false,
                                explanation: "Sai. Cực tiểu giao thoa là những điểm có biên độ dao động cực tiểu (nếu 2 nguồn cùng biên độ thì chúng đứng yên)."
                            }
                        ]
                    };
                }
            ],
            sa: [
                () => {
                    const dist = randomInt(10, 16); // cm
                    const f = randomChoice([20, 40]);
                    const v = 80; // cm/s
                    const lambda = v / f; // 4 hoặc 2 cm
                    
                    // Số cực đại giữa 2 nguồn: -L/lambda < k < L/lambda
                    const max_k = Math.floor((dist - 0.01) / lambda);
                    const num_cucdai = 2 * max_k + 1;

                    return {
                        type: 'sa',
                        question: `Hai nguồn sóng kết hợp \\( S_1 \\) và \\( S_2 \\) trên mặt nước cách nhau \\( S_1S_2 = ${dist} \\text{ cm} \\) dao động cùng pha với tần số \\( f = ${f} \\text{ Hz} \\). Tốc độ truyền sóng trên mặt nước là \\( v = 80 \\text{ cm/s} \\). Tính tổng số đường cực đại giao thoa xuất hiện trong vùng giữa hai nguồn.`,
                        correctAnswer: num_cucdai,
                        suffix: "đường",
                        explanation: `Bước sóng \\( \\lambda = \\frac{v}{f} = \\frac{80}{${f}} = ${lambda} \\text{ cm} \\).<br/>Số cực đại giao thoa thỏa mãn: \\( -\\frac{S_1S_2}{\\lambda} < k < \\frac{S_1S_2}{\\lambda} \\Rightarrow -\\frac{${dist}}{${lambda}} < k < \\frac{${dist}}{${lambda}} \\Rightarrow -${dist/lambda} < k < ${dist/lambda} \\).<br/>Do đó \\( k \\in \\{ -${max_k}, ..., ${max_k} \\} \\). Có tất cả \\( 2 \\times ${max_k} + 1 = ${num_cucdai} \\) cực đại.`
                    };
                }
            ]
        },
        'thi-nghiem-song-dung': {
            mcq: [
                () => {
                    const f = randomChoice([440, 500, 1000]);
                    const d_cm = randomFloat(16.0, 18.0, 1);
                    const d = d_cm / 100;
                    // d = lambda / 2 => lambda = 2 * d
                    const lambda = 2 * d;
                    const v = roundTo(lambda * f, 1);

                    const ans = `${v} \\text{ m/s}`;
                    const trap1 = `${roundTo(v/2, 1)} \\text{ m/s}`;
                    const trap2 = `${roundTo(v*2, 1)} \\text{ m/s}`;
                    const trap3 = `${roundTo(v/4, 1)} \\text{ m/s}`;

                    const opts = shuffleArray([ans, trap1, trap2, trap3]);

                    return {
                        type: 'mcq',
                        question: `Trong thí nghiệm đo tốc độ truyền âm trong không khí bằng cột khí cộng hưởng, một âm thoa dao động với tần số \\( f = ${f} \\text{ Hz} \\) đặt trước miệng ống. Khi thay đổi chiều dài cột khí, ta thấy hai vị trí cộng hưởng liên tiếp phát ra âm to nhất cách nhau \\( d = ${d_cm} \\text{ cm} \\). Tốc độ âm trong không khí đo được là:`,
                        options: opts.shuffled.map(o => `\\( ${o} \\)`),
                        correctAnswer: opts.correctIndex,
                        explanation: `Hai vị trí cộng hưởng liên tiếp tương ứng với khoảng cách giữa hai nút sóng của sóng dừng cột khí: \\( d = \\frac{\\lambda}{2} \\Rightarrow \\lambda = 2d = 2 \\times ${d} \\text{ m} = ${lambda} \\text{ m} \\).<br/>Tốc độ truyền âm \\( v = \\lambda f = ${lambda} \\times ${f} = ${v} \\text{ m/s} \\).`
                    };
                }
            ],
            tf: [
                () => {
                    return {
                        type: 'tf_cluster',
                        context: `Khảo sát hiện tượng sóng dừng cột khí trong một ống thủy tinh dựng thẳng đứng chứa nước, đáy ống là mặt nước phản xạ (đầu cố định), miệng ống để hở (đầu tự do).`,
                        statements: [
                            {
                                text: "Tại mặt nước, sóng âm phản xạ luôn ngược pha với sóng âm tới tạo thành một nút sóng.",
                                isTrue: true,
                                explanation: "Đúng. Mặt nước đóng vai trò là vật cản cố định, sóng âm phản xạ ngược pha với sóng tới tạo thành nút."
                            },
                            {
                                text: "Tại miệng ống để hở, sóng âm phản xạ ngược pha hoàn toàn với sóng tới tạo thành một nút sóng khác.",
                                isTrue: false,
                                explanation: "Sai. Miệng ống hở đóng vai trò như một đầu tự do, sóng phản xạ cùng pha với sóng tới tạo thành bụng sóng."
                            },
                            {
                                text: "Khi có cộng hưởng âm phát ra to nhất, chiều dài cột khí thỏa mãn công thức của ống một đầu kín một đầu hở: \\( L = (2k + 1)\\frac{\\lambda}{4} \\).",
                                isTrue: true,
                                explanation: "Đúng. Ống cộng hưởng với mặt nước ở đáy và miệng hở là hệ 1 đầu kín 1 đầu hở."
                            },
                            {
                                text: "Nếu tăng tần số âm phát ra thì khoảng cách giữa các vị trí cộng hưởng liên tiếp sẽ tăng lên.",
                                isTrue: false,
                                explanation: "Sai. Tần số tăng thì bước sóng giảm, khoảng cách giữa các nút liên tiếp \\( \\lambda/2 \\) phải giảm đi."
                            }
                        ]
                    };
                }
            ],
            sa: [
                () => {
                    const v = 340; // m/s
                    const L_cm = randomChoice([17, 20, 25]);
                    const L = L_cm / 100;
                    // Họa âm cơ bản k=0: L = lambda/4 => lambda = 4L
                    const f = roundTo(v / (4 * L), 0);

                    return {
                        type: 'sa',
                        question: `Một ống cộng hưởng có chiều dài cột khí \\( L = ${L_cm} \\text{ cm} \\) một đầu kín một đầu hở. Biết tốc độ truyền âm trong không khí là \\( v = 340 \\text{ m/s} \\). Tính tần số âm cơ bản nhỏ nhất (tần số của họa âm bậc 1) có thể xảy ra cộng hưởng trong ống (làm tròn thành số nguyên).`,
                        correctAnswer: f,
                        suffix: "Hz",
                        explanation: `Đối với ống một đầu kín một đầu hở, điều kiện cộng hưởng là \\( L = (2k + 1)\\frac{\\lambda}{4} \\).<br/>Tần số cơ bản nhỏ nhất tương ứng với \\( k = 0 \\Rightarrow L = \\frac{\\lambda}{4} \\Rightarrow \\lambda = 4L = 4 \\times ${L} = ${4*L} \\text{ m} \\).<br/>Tần số cơ bản \\( f_1 = \\frac{v}{\\lambda} = \\frac{340}{${4*L}} = ${f} \\text{ Hz} \\).`
                    };
                }
            ]
        },
        'song-doc-song-ngang': {
            mcq: [
                () => {
                    const amp = randomInt(2, 6);
                    const f = randomInt(10, 40);
                    const lambda = 2; // m
                    const coeff_x = roundTo(2 * Math.PI / lambda, 2);
                    const v = lambda * f;

                    const ans = `${v} \\text{ m/s}`;
                    const trap1 = `${roundTo(v/1000, 3)} \\text{ m/s}`;
                    const trap2 = `${roundTo(v * Math.PI, 1)} \\text{ m/s}`;
                    const trap3 = `${roundTo(v / Math.PI, 1)} \\text{ m/s}`;

                    const opts = shuffleArray([ans, trap1, trap2, trap3]);

                    return {
                        type: 'mcq',
                        question: `Một sóng cơ hình sin truyền dọc theo trục Ox có phương trình nguồn là \\( u = ${amp} \\cos(${2*f}\\pi t - ${coeff_x} x) \\text{ (mm)} \\), trong đó x tính bằng mét (m), t tính bằng giây (s). Tốc độ truyền sóng là:`,
                        options: opts.shuffled.map(o => `\\( ${o} \\)`),
                        correctAnswer: opts.correctIndex,
                        explanation: `Đối chiếu với phương trình tổng quát: \\( u = A\\cos(\\omega t - \\frac{2\\pi x}{\\lambda}) \\).<br/>Ta có \\( \\omega = ${2*f}\\pi \\Rightarrow f = ${f} \\text{ Hz} \\).<br/>Hệ số của x: \\( \\frac{2\\pi}{\\lambda} = ${coeff_x} \\Rightarrow \\lambda = \\frac{2\\pi}{${coeff_x}} = ${lambda} \\text{ m} \\).<br/>Tốc độ truyền sóng \\( v = \\lambda f = ${lambda} \\times ${f} = ${v} \\text{ m/s} \\).`
                    };
                }
            ],
            tf: [
                () => {
                    return {
                        type: 'tf_cluster',
                        context: `So sánh đặc tính vật lý và cơ chế truyền của hai loại sóng: sóng dọc và sóng ngang trong các môi trường.`,
                        statements: [
                            {
                                text: "Sóng ngang là sóng trong đó các phần tử của môi trường dao động theo phương vuông góc với phương truyền sóng.",
                                isTrue: true,
                                explanation: "Đúng. Đây là định nghĩa của sóng ngang."
                            },
                            {
                                text: "Sóng dọc có thể truyền được trong cả chất rắn, chất lỏng và chất khí.",
                                isTrue: true,
                                explanation: "Đúng. Sóng dọc (như sóng âm) truyền dựa trên sự biến dạng nén/giãn thể tích nên truyền được trong cả 3 môi trường rắn, lỏng, khí."
                            },
                            {
                                text: "Sóng ngang truyền được rất tốt trong chất khí và chất lỏng vì lực liên kết cắt ở các môi trường này cực kỳ lớn.",
                                isTrue: false,
                                explanation: "Sai. Sóng ngang chỉ truyền được trong chất rắn và bề mặt chất lỏng (nhờ lực căng bề mặt), không truyền được trong lòng chất lỏng và chất khí do lực liên kết cắt ở các môi trường này bằng 0."
                            },
                            {
                                text: "Khi sóng cơ truyền qua các môi trường khác nhau, tần số của sóng thay đổi liên tục theo mật độ vật chất môi trường.",
                                isTrue: false,
                                explanation: "Sai. Tần số của sóng cơ không bao giờ thay đổi khi truyền từ môi trường này sang môi trường khác. Chỉ có vận tốc và bước sóng thay đổi."
                            }
                        ]
                    };
                }
            ],
            sa: [
                () => {
                    const f = randomChoice([50, 100]);
                    const v = 300; // m/s
                    const lambda = v / f; // 6m hoặc 3m
                    // Ngược pha gần nhất: d = lambda / 2
                    const d_m = lambda / 2;

                    return {
                        type: 'sa',
                        question: `Một sóng cơ học có tần số \\( f = ${f} \\text{ Hz} \\) truyền dọc theo một đường thẳng với tốc độ \\( v = 300 \\text{ m/s} \\). Tính khoảng cách ngắn nhất giữa hai phần tử môi trường dao động ngược pha nhau trên phương truyền sóng đó (tính bằng m, làm tròn 1 chữ số thập phân).`,
                        correctAnswer: d_m,
                        suffix: "m",
                        explanation: `Bước sóng \\( \\lambda = \\frac{v}{f} = \\frac{300}{${f}} = ${lambda} \\text{ m} \\).<br/>Hai điểm dao động ngược pha gần nhau nhất cách nhau một khoảng \\( d = \\frac{\\lambda}{2} = \\frac{${lambda}}{2} = ${d_m} \\text{ m} \\).`
                    };
                }
            ]
        },
        'song-dung-1-tu-do': {
            mcq: [
                () => {
                    const f = randomChoice([50, 100]);
                    const v = randomChoice([20, 40]);
                    const lambda = v / f; // m
                    const k = randomInt(2, 4); // Số nút
                    // Một đầu cố định một đầu tự do: L = (2k + 1) * lambda / 4
                    // Số nút = k + 1, Số bụng = k + 1
                    const L_m = ((2 * (k-1)) + 1) * lambda / 4;
                    const L_cm = roundTo(L_m * 100, 1);

                    const ans = `${L_cm} \\text{ cm}`;
                    const trap1 = `${roundTo((k-1)*lambda*100/2, 1)} \\text{ cm}`;
                    const trap2 = `${roundTo(k*lambda*100/2, 1)} \\text{ cm}`;
                    const trap3 = `${roundTo(L_cm / 2, 1)} \\text{ cm}`;

                    const opts = shuffleArray([ans, trap1, trap2, trap3]);

                    return {
                        type: 'mcq',
                        question: `Một sợi dây đàn hồi mảnh có một đầu được giữ cố định, đầu còn lại để tự do. Dây được kích thích dao động với tần số \\( f = ${f} \\text{ Hz} \\) thì trên dây hình thành sóng dừng ổn định với ${k} nút sóng (tính cả đầu cố định). Tốc độ truyền sóng trên dây là \\( v = ${v} \\text{ m/s} \\). Chiều dài của sợi dây là:`,
                        options: opts.shuffled.map(o => `\\( ${o} \\)`),
                        correctAnswer: opts.correctIndex,
                        explanation: `Bước sóng \\( \\lambda = \\frac{v}{f} = \\frac{${v}}{${f}} = ${lambda} \\text{ m} \\).<br/>Dây có một đầu cố định một đầu tự do, số nút sóng là \\( N = k \\Rightarrow N = n + 1 \\Rightarrow n = ${k - 1} \\).<br/>Chiều dài dây: \\( L = (2n + 1)\\frac{\\lambda}{4} = (2 \\times ${k - 1} + 1)\\frac{${lambda}}{4} = ${L_m} \\text{ m} = ${L_cm} \\text{ cm} \\).`
                    };
                }
            ],
            tf: [
                () => {
                    return {
                        type: 'tf_cluster',
                        context: `Khảo sát hiện tượng sóng dừng trên một sợi dây đàn hồi có một đầu gắn với nguồn rung (coi là nút sóng cố định), đầu còn lại để tự do.`,
                        statements: [
                            {
                                text: "Đầu tự do của sợi dây luôn luôn dao động với biên độ cực đại, đóng vai trò là một bụng sóng dừng.",
                                isTrue: true,
                                explanation: "Đúng. Do sóng phản xạ tại đầu tự do cùng pha hoàn toàn với sóng tới nên chúng tăng cường nhau tạo thành bụng sóng."
                            },
                            {
                                text: "Trên sợi dây này, số nút sóng luôn luôn bằng số bụng sóng.",
                                isTrue: true,
                                explanation: "Đúng. Với hệ 1 đầu cố định 1 đầu tự do, số nút sóng luôn bằng số bụng sóng (bằng n + 1)."
                            },
                            {
                                text: "Khoảng cách từ đầu cố định đến đầu tự do luôn bằng một số nguyên lần nửa bước sóng.",
                                isTrue: false,
                                explanation: "Sai. Chiều dài dây thỏa mãn \\( L = (2n + 1)\\lambda/4 \\), tức là bằng một số lẻ lần một phần tư bước sóng."
                            },
                            {
                                text: "Tần số của các họa âm trên dây này tỉ lệ với các số tự nhiên liên tiếp 1, 2, 3, 4...",
                                isTrue: false,
                                explanation: "Sai. Đối với một đầu cố định một đầu tự do, tần số các họa âm tỉ lệ với các số lẻ liên tiếp: \\( f_n = (2n+1)f_1 \\) (họa âm bậc lẻ)."
                            }
                        ]
                    };
                }
            ],
            sa: [
                () => {
                    const L = 1.2; // m
                    const k = randomInt(2, 4); // số bụng
                    // L = (2k - 1) * lambda / 4 => lambda = 4L / (2k - 1)
                    const lambda = (4 * L) / (2 * k - 1);
                    const final_ans = roundTo(lambda, 2);

                    return {
                        type: 'sa',
                        question: `Một sợi dây đàn hồi dài \\( L = 1.2 \\text{ m} \\) có một đầu cố định và một đầu tự do. Khi trên dây xảy ra sóng dừng ổn định với đúng ${k} bụng sóng (tính cả đầu tự do), hãy tính bước sóng truyền trên dây (tính bằng mét, làm tròn 2 chữ số thập phân).`,
                        correctAnswer: final_ans,
                        suffix: "m",
                        explanation: `Với dây một đầu cố định một đầu tự do, số bụng sóng bằng \\( N_b = k \\).<br/>Hệ thức chiều dài dây: \\( L = (2k - 1)\\frac{\\lambda}{4} \\Rightarrow \\lambda = \\frac{4L}{2k - 1} = \\frac{4 \\times 1.2}{2 \\times ${k} - 1} = ${final_ans} \\text{ m} \\).`
                    };
                }
            ]
        },
        'song-dung-2-co-dinh': {
            mcq: [
                () => {
                    const L = randomChoice([1.2, 1.5, 2.0]);
                    const k = randomInt(3, 5); 
                    const f = randomChoice([20, 50, 100]);
                    
                    const lambda = (2 * L) / k;
                    const v = lambda * f;

                    const ans = `${v} \\text{ m/s}`;
                    const trap1 = `${roundTo(v/2, 1)} \\text{ m/s}`;
                    const trap2 = `${roundTo(v*2, 1)} \\text{ m/s}`;
                    const trap3 = `${roundTo(v/k, 1)} \\text{ m/s}`;

                    const opts = shuffleArray([ans, trap1, trap2, trap3]);

                    return {
                        type: 'mcq',
                        question: `Một sợi dây đàn hồi dài \\( L = ${L} \\text{ m} \\) căng ngang giữa hai đầu cố định. Khi sợi dây dao động với tần số \\( f = ${f} \\text{ Hz} \\) thì trên dây hình thành sóng dừng ổn định với ${k} bụng sóng. Tốc độ truyền sóng trên dây là:`,
                        options: opts.shuffled.map(o => `\\( ${o} \\)`),
                        correctAnswer: opts.correctIndex,
                        explanation: `Dây hai đầu cố định, điều kiện sóng dừng: \\( L = k\\frac{\\lambda}{2} \\Rightarrow \\lambda = \\frac{2L}{k} = \\frac{2 \\times ${L}}{${k}} = ${lambda} \\text{ m} \\).<br/>Tốc độ truyền sóng: \\( v = \\lambda f = ${lambda} \\times ${f} = ${v} \\text{ m/s} \\).`
                    };
                }
            ],
            tf: [
                () => {
                    const l = 1.2;
                    const k = 4;
                    const a_mm = 6;
                    const lambda = (2 * l) / k;
                    const distNodeAntinode = lambda / 4;

                    return {
                        type: 'tf_cluster',
                        context: `Trên một sợi dây đàn hồi chiều dài \\( L = ${l} \\text{ m} \\), hai đầu cố định đang có hệ sóng dừng ổn định với ${k} bụng sóng. Biên độ dao động của phần tử tại điểm bụng là \\( a = ${a_mm} \\text{ mm} \\).`,
                        statements: [
                            { 
                                text: `Bước sóng truyền trên dây là ${roundTo(lambda, 2)} m.`, 
                                isTrue: true, 
                                explanation: `Sóng dừng 2 đầu cố định \\( L = k\\frac{\\lambda}{2} \\Rightarrow \\lambda = \\frac{2L}{k} = \\frac{2 \\times ${l}}{${k}} = ${roundTo(lambda, 2)} \\text{ m} \\).` 
                            },
                            { 
                                text: `Khoảng cách giữa một nút và một bụng dao động cực đại liền kề nhau dọc dây là ${roundTo(lambda/2, 2)} m.`, 
                                isTrue: false, 
                                explanation: `Khoảng cách giữa nút và bụng liền kề luôn bằng \\( \\frac{\\lambda}{4} = ${roundTo(distNodeAntinode, 2)} \\text{ m} \\), không phải ${roundTo(lambda/2, 2)} m.` 
                            },
                            { 
                                text: "Tất cả các phần tử trên cùng một bó sóng luôn dao động cùng pha với nhau.", 
                                isTrue: true, 
                                explanation: "Mỗi bó sóng ngăn cách bởi 2 nút được tạo từ hệ vật chất uốn nắn lên xuống đồng loạt, do đó pha của chúng đều như nhau." 
                            },
                            { 
                                text: "Tốc độ dao động cực đại của điểm bụng trong thời gian chuyền pha bằng tốc độ truyền sóng trên dây.", 
                                isTrue: false, 
                                explanation: "Tốc độ phần tử dao động \\( v_{max} = \\omega a \\) hoàn toàn khác với tốc độ truyền màng sóng năng lượng \\( v = \\lambda f \\)." 
                            }
                        ]
                    };
                }
            ],
            sa: [
                () => {
                    const f1 = randomChoice([10, 20, 30]);
                    const k = randomInt(2, 4);
                    // f_k = k * f1
                    const f_k = k * f1;

                    return {
                        type: 'sa',
                        question: `Một sợi dây đàn hồi căng giữa hai điểm cố định. Tần số nhỏ nhất để tạo sóng dừng trên dây là \\( f_1 = ${f1} \\text{ Hz} \\). Tính tần số để trên dây có sóng dừng ổn định với đúng ${k} bụng sóng (tính bằng Hz).`,
                        correctAnswer: f_k,
                        suffix: "Hz",
                        explanation: `Với hai đầu cố định, tần số để xảy ra sóng dừng là \\( f_k = k \\cdot f_1 \\).<br/>Với ${k} bụng sóng (tương ứng \\( k = ${k} \\)), tần số dao động cần thiết là \\( f_{${k}} = ${k} \\times ${f1} = ${f_k} \\text{ Hz} \\).`
                    };
                }
            ]
        },
        'do-tan-so-song-am': {
            mcq: [
                () => {
                    const LA = randomChoice([60, 80]);
                    const ratio = 10; 
                    // I_A / I_B = 10^( (LA-LB)/10 )
                    // Giảm đi 10 lần => LB = LA - 10
                    const LB = LA - 10;

                    const ans = `${LB} \\text{ dB}`;
                    const trap1 = `${LA / 10} \\text{ dB}`;
                    const trap2 = `${LA - 1} \\text{ dB}`;
                    const trap3 = `${LA - 20} \\text{ dB}`;

                    const opts = shuffleArray([ans, trap1, trap2, trap3]);

                    return {
                        type: 'mcq',
                        question: `Tại một điểm A trong không gian, mức cường độ âm đo được là \\( L_A = ${LA} \\text{ dB} \\). Nếu cường độ âm tại điểm đó giảm đi 10 lần thì mức cường độ âm đo được tại đó sẽ là:`,
                        options: opts.shuffled.map(o => `\\( ${o} \\)`),
                        correctAnswer: opts.correctIndex,
                        explanation: `Công thức mức cường độ âm: \\( L = 10\\log\\frac{I}{I_0} \\).<br/>Khi cường độ âm giảm 10 lần: \\( L_B = 10\\log\\frac{I/10}{I_0} = 10\\log\\frac{I}{I_0} - 10\\log(10) = L_A - 10 = ${LA} - 10 = ${LB} \\text{ dB} \\).`
                    };
                }
            ],
            tf: [
                () => {
                    return {
                        type: 'tf_cluster',
                        context: `Khảo sát các đặc trưng vật lý và sinh lý của sóng âm khi lan truyền trong không khí.`,
                        statements: [
                            {
                                text: "Tần số âm là đặc trưng vật lý của âm, quyết định đặc trưng sinh lý là độ cao của âm.",
                                isTrue: true,
                                explanation: "Đúng. Âm có tần số càng cao thì nghe càng cao (thanh), tần số càng thấp thì nghe càng trầm."
                            },
                            {
                                text: "Đồ thị dao động âm quyết định đặc trưng sinh lý là âm sắc giúp tai người phân biệt được âm của các nguồn khác nhau.",
                                isTrue: true,
                                explanation: "Đúng. Mỗi nhạc cụ phát ra âm có đồ thị dao động (gồm các họa âm khác nhau) đặc trưng, tạo nên âm sắc riêng biệt."
                            },
                            {
                                text: "Mức cường độ âm L đo bằng decibel (dB) quyết định trực tiếp sinh lý độ to của âm một cách tuyến tính tuyệt đối với mọi tần số.",
                                isTrue: false,
                                explanation: "Sai. Độ to của âm phụ thuộc vào cả mức cường độ âm L và tần số của âm (vì tai người nhạy cảm khác nhau ở các dải tần khác nhau)."
                            },
                            {
                                text: "Sóng siêu âm là sóng âm có tần số rất lớn và tai con người hoàn toàn nghe được bình thường.",
                                isTrue: false,
                                explanation: "Sai. Sóng siêu âm có tần số lớn hơn 20.000 Hz, nằm ngoài ngưỡng nghe của tai người nên con người không nghe được."
                            }
                        ]
                    };
                }
            ],
            sa: [
                () => {
                    const LA = randomChoice([50, 60, 70]);
                    const RA = randomChoice([5, 10, 20]);
                    const L_drop = randomChoice([10, 20]);
                    const LB = LA - L_drop;

                    const ratio = Math.pow(10, L_drop / 20);
                    const RB = RA * ratio;
                    const deltaR = Math.abs(RB - RA);

                    return {
                        type: 'sa',
                        question: `Tại điểm A cách nguồn âm điểm một khoảng ${RA} m, mức cường độ âm đo được là \\( L_A = ${LA} \\text{ dB} \\) (bỏ qua hấp thụ môi trường). Cần di chuyển máy thu âm từ A dọc theo đường thẳng ra xa nguồn thêm đọan bằng bao nhiêu mét để mức cường độ âm giảm còn \\( ${LB} \\text{ dB} \\)?`,
                        correctAnswer: roundTo(deltaR, 1),
                        suffix: "m",
                        explanation: `Theo tính chất nguồn âm điểm, \\( L_A - L_B = 20 \\log\\left(\\frac{R_B}{R_A}\\right) \\).<br/> Thay giá trị: \\( ${LA} - ${LB} = 20 \\log\\left(\\frac{R_B}{${RA}}\\right) \\Rightarrow \\log\\left(\\frac{R_B}{${RA}}\\right) = ${L_drop / 20} \\).<br/>Suy ra \\( R_B = ${RA} \\times 10^{${L_drop/20}} = ${roundTo(RB, 1)} \\text{ m} \\).<br/>Quãng đường dịch chuyển thêm \\( \\Delta R = R_B - R_A = ${roundTo(deltaR, 1)} \\text{ m} \\).`
                    };
                }
            ]
        },
        'giao-thoa-anh-sang': {
            mcq: [
                () => {
                    const a_mm = randomFloat(0.5, 1.2, 1);
                    const D_m = randomFloat(1.5, 2.0, 1);
                    const lambda_nm = randomChoice([450, 500, 600]);
                    const lambda = lambda_nm / 1000; // um

                    const i = roundTo((lambda * D_m) / a_mm, 2);

                    const ans = `${i} \\text{ mm}`;
                    const trap1 = `${roundTo(i*10, 2)} \\text{ mm}`;
                    const trap2 = `${roundTo(i/10, 2)} \\text{ mm}`;
                    const trap3 = `${roundTo((a_mm * D_m) / lambda, 2)} \\text{ mm}`;

                    const opts = shuffleArray([ans, trap1, trap2, trap3]);

                    return {
                        type: 'mcq',
                        question: `Trong thí nghiệm Y-âng về giao thoa ánh sáng, khoảng cách giữa hai khe là \\( a = ${a_mm} \\text{ mm} \\), khoảng cách từ mặt phẳng chứa hai khe đến màn quan sát là \\( D = ${D_m} \\text{ m} \\). Chiếu vào hai khe ánh sáng đơn sắc có bước sóng \\( \\lambda = ${lambda_nm} \\text{ nm} \\). Khoảng vân giao thoa thu được trên màn là:`,
                        options: opts.shuffled.map(o => `\\( ${o} \\)`),
                        correctAnswer: opts.correctIndex,
                        explanation: `Công thức tính khoảng vân: \\( i = \\frac{\\lambda D}{a} \\).<br/>Thay số với đơn vị chuẩn (\\( \\lambda = ${lambda} \\ \mu\\text{m}, D = ${D_m} \\text{ m}, a = ${a_mm} \\text{ mm} \\)):<br/>\\( i = \\frac{${lambda} \\times ${D_m}}{${a_mm}} = ${i} \\text{ mm} \\).`
                    };
                }
            ],
            tf: [
                () => {
                    return {
                        type: 'tf_cluster',
                        context: `Khảo sát thí nghiệm giao thoa ánh sáng Y-âng với nguồn phát sáng đơn sắc bước sóng \\( \\lambda \\).`,
                        statements: [
                            {
                                text: "Hiện tượng giao thoa ánh sáng là bằng chứng thực nghiệm quan trọng khẳng định ánh sáng có tính chất sóng.",
                                isTrue: true,
                                explanation: "Đúng. Giao thoa và nhiễu xạ là những hiện tượng đặc trưng của sóng."
                            },
                            {
                                text: "Nếu nhúng toàn bộ hệ thống thí nghiệm vào trong nước, khoảng vân giao thoa trên màn sẽ tăng lên do bước sóng của ánh sáng tăng trong nước.",
                                isTrue: false,
                                explanation: "Sai. Khi nhúng vào nước, tốc độ ánh sáng giảm làm bước sóng giảm \\( \\lambda' = \\lambda / n \\), dẫn đến khoảng vân giảm đi."
                            },
                            {
                                text: "Vân sáng trung tâm luôn nằm trên trục đối xứng của hai khe và có màu của ánh sáng đơn sắc chiếu vào.",
                                isTrue: true,
                                explanation: "Đúng. Tại trục đối xứng hiệu đường đi bằng 0, luôn là vân sáng trung tâm."
                            },
                            {
                                text: "Khi khoảng cách từ hai khe đến màn tăng lên thì khoảng vân giao thoa thu được trên màn sẽ giảm đi.",
                                isTrue: false,
                                explanation: "Sai. Khoảng vân \\( i = \\lambda D / a \\) tỉ lệ thuận với D, nên D tăng thì i tăng."
                            }
                        ]
                    };
                }
            ],
            sa: [
                () => {
                    const a = 1.0; // mm
                    const D = 2.0; // m
                    const i = randomFloat(1.0, 1.5, 1); // mm
                    // i = lambda * D / a => lambda = i * a / D
                    const lambda_um = (i * a) / D;
                    const lambda_nm = roundTo(lambda_um * 1000, 0);

                    return {
                        type: 'sa',
                        question: `Trong thí nghiệm Y-âng, khoảng cách hai khe \\( a = 1.0 \\text{ mm} \\), khoảng cách từ hai khe đến màn \\( D = 2.0 \\text{ m} \\). Người ta đo được khoảng vân trên màn là \\( i = ${i} \\text{ mm} \\). Tính bước sóng của ánh sáng đơn sắc dùng trong thí nghiệm (tính theo đơn vị nm, làm tròn đến số nguyên).`,
                        correctAnswer: lambda_nm,
                        suffix: "nm",
                        explanation: `Áp dụng công thức khoảng vân: \\( i = \\frac{\\lambda D}{a} \\Rightarrow \\lambda = \\frac{i \\cdot a}{D} \\).<br/>Thay số: \\( \\lambda = \\frac{${i} \\cdot 10^{-3} \\times 1.0 \\cdot 10^{-3}}{2.0} = ${lambda_um} \\cdot 10^{-6} \\text{ m} = ${lambda_nm} \\text{ nm} \\).`
                    };
                }
            ]
        },
        'mach-dien-dc': {
            mcq: [
                () => {
                    const R1 = randomInt(2, 6);
                    const R2 = randomInt(2, 6);
                    const R3 = randomInt(2, 6);
                    const R_eq = roundTo(R1 + (R2 * R3) / (R2 + R3), 2);

                    const ans = `${R_eq} \\ \\Omega`;
                    const trap1 = `${R1 + R2 + R3} \\ \\Omega`;
                    const trap2 = `${roundTo(1/(1/R1 + 1/R2 + 1/R3), 2)} \\ \\Omega`;
                    const trap3 = `${roundTo((R1 * R2 * R3) / (R1 + R2 + R3), 2)} \\ \\Omega`;

                    const opts = shuffleArray([ans, trap1, trap2, trap3]);

                    return {
                        type: 'mcq',
                        question: `Cho một mạch điện gồm điện trở \\( R_1 = ${R1}\\ \\Omega \\) mắc nối tiếp với một cụm gồm hai điện trở \\( R_2 = ${R2}\\ \\Omega \\) và \\( R_3 = ${R3}\\ \\Omega \\) mắc song song nhau. Điện trở tương đương của toàn mạch điện trên gần nhất với giá trị nào sau đây?`,
                        options: opts.shuffled.map(o => `\\( ${o} \\)`),
                        correctAnswer: opts.correctIndex,
                        explanation: `Điện trở của cụm song song: \\( R_{23} = \\frac{R_2 R_3}{R_2 + R_3} = \\frac{${R2} \\times ${R3}}{${R2} + ${R3}} = ${roundTo((R2*R3)/(R2+R3), 2)}\\ \\Omega \\).<br/>Điện trở tương đương toàn mạch mắc nối tiếp: \\( R_{eq} = R_1 + R_{23} = ${R1} + ${roundTo((R2*R3)/(R2+R3), 2)} = ${R_eq}\\ \\Omega \\).`
                    };
                }
            ],
            tf: [
                () => {
                    return {
                        type: 'tf_cluster',
                        context: `Xét các định luật và quy tắc cơ bản dùng trong phân tích mạch điện một chiều (mạch DC) phức tạp.`,
                        statements: [
                            {
                                text: "Định luật Kirchhoff 1 (định luật nút) phát biểu rằng tổng các cường độ dòng điện đi vào một nút mạch phải bằng tổng các cường độ dòng điện đi ra khỏi nút đó.",
                                isTrue: true,
                                explanation: "Đúng. Đây chính là biểu thức của định luật bảo toàn điện tích tại các nút mạch."
                            },
                            {
                                text: "Định luật Kirchhoff 2 (định luật vòng) là hệ quả trực tiếp của định luật bảo toàn năng lượng áp dụng cho một vòng kín trong mạch điện.",
                                isTrue: true,
                                explanation: "Đúng. Hiệu điện thế toàn vòng kín bằng 0 tương ứng công dịch chuyển điện tích khép kín bằng 0."
                            },
                            {
                                text: "Khi hai điện trở mắc song song với nhau, cường độ dòng điện đi qua mỗi điện trở luôn bằng nhau bất kể giá trị điện trở thế nào.",
                                isTrue: false,
                                explanation: "Sai. Khi mắc song song, hiệu điện thế U giữa hai đầu điện trở bằng nhau, do đó dòng điện tỉ lệ nghịch với điện trở: \\( I = U/R \\)."
                            },
                            {
                                text: "Điện trở tương đương của một cụm nhiều điện trở mắc nối tiếp luôn luôn nhỏ hơn điện trở thành phần nhỏ nhất của cụm đó.",
                                isTrue: false,
                                explanation: "Sai. Khi mắc nối tiếp, \\( R_{eq} = R_1 + R_2 + ... \\) luôn lớn hơn mọi điện trở thành phần. Mắc song song mới nhỏ hơn."
                            }
                        ]
                    };
                }
            ],
            sa: [
                () => {
                    const U = randomChoice([12, 24]);
                    const R1 = 6;
                    const R2 = 12;
                    const Rp = (R1 * R2) / (R1 + R2); // 4 Ohm
                    const I = U / Rp;

                    return {
                        type: 'sa',
                        question: `Một mạch điện song song gồm hai nhánh điện trở \\( R_1 = 6\\ \\Omega \\) và \\( R_2 = 12\\ \\Omega \\) được nối vào nguồn điện có hiệu điện thế không đổi \\( U = ${U} \\text{ V} \\). Tính tổng cường độ dòng điện chính chạy qua mạch (tính theo đơn vị Ampe).`,
                        correctAnswer: I,
                        suffix: "A",
                        explanation: `Điện trở tương đương toàn mạch: \\( R_{eq} = \\frac{R_1 R_2}{R_1 + R_2} = \\frac{6 \\times 12}{6 + 12} = 4\\ \\Omega \\).<br/>Tổng dòng điện chạy qua mạch chính: \\( I = \\frac{U}{R_{eq}} = \\frac{${U}}{4} = ${I} \\text{ A} \\).`
                    };
                }
            ]
        },
        'nguon-dien-mach-kin': {
            mcq: [
                () => {
                    const ans = `\\text{Tăng dần đến } \\mathcal{E}`;
                    const trap1 = `\\text{Luôn không đổi bằng } \\mathcal{E}`;
                    const trap2 = `\\text{Giảm dần về 0}`;
                    const trap3 = `\\text{Tăng dần tiếp sau đó giảm dần}`;

                    const opts = shuffleArray([ans, trap1, trap2, trap3]);

                    return {
                        type: 'mcq',
                        question: "Nối hai cực của một hệ điện thế (suất điện động \\( \\mathcal{E} \\), điện trở trong \\( r \\)) với mạch ngoài có điện trở \\( R \\) có thể điều chỉnh tự do. Dựa vào định luật Ohm toàn mạch, khi điện trở mạch ngoài \\( R \\) tăng dần từ 0 lên đến vô cùng, hiệu điện thế đo tại hai cực của nguồn điện biến thiên như thế nào?",
                        options: opts.shuffled.map(o => `\\( ${o} \\)`),
                        correctAnswer: opts.correctIndex,
                        explanation: `Hiệu điện thế mạch ngoài: \\( U = \\mathcal{E} - Ir = \\mathcal{E} - \\frac{\\mathcal{E}r}{R+r} \\). Khi \\( R \\) tăng dần tới vô cùng, dòng điện \\( I \\) giảm dần về 0, do đó độ giảm thế trong nguồn \\( Ir \\) giảm về 0, làm \\( U \\) tiệm cận tới suất điện động \\( \\mathcal{E} \\).`
                    }
                }
            ],
            tf: [
                () => {
                    const E = randomChoice([12, 24]);
                    const r = randomChoice([2, 4]);
                    
                    let Udm = 6; let Pdm = 3;
                    if(E === 24) { Udm = 12; Pdm = 6; }
                    
                    const Rd = (Udm * Udm) / Pdm;
                    const Idm = Pdm / Udm;
                    const R_bientro_sangbt = E / Idm - r - Rd; 
                    const fake_R = R_bientro_sangbt + 4;

                    return {
                         type: 'tf_cluster',
                         context: `Mạch điện kín gồm nguồn có suất điện động \\( \\mathcal{E} = ${E}\\text{ V}, r = ${r}\\ \\Omega \\) nối với biến trở \\( R \\) mắc nối tiếp bóng đèn ghi \\( ${Udm}\\text{ V} - ${Pdm}\\text{ W} \\).`,
                         statements: [
                            { 
                                text: `Điện trở của bóng đèn khi sáng bình thường là ${Rd} Ohm.`, 
                                isTrue: true, 
                                explanation: `Đúng. Áp dụng công thức: \\( R_d = \\frac{U_{dm}^2}{P_{dm}} = \\frac{${Udm}^2}{${Pdm}} = ${Rd}\\ \\Omega \\).` 
                            },
                            { 
                                text: `Để đèn sáng bình thường, biến trở phải có giá trị \\( R = ${fake_R}\\ \\Omega \\).`, 
                                isTrue: false, 
                                explanation: `Dòng định mức: \\( I_{dm} = P_{dm}/U_{dm} = ${Idm} \\text{ A} \\). Mạch có: \\( I = \\frac{\\mathcal{E}}{R + R_d + r} \\Rightarrow R = \\frac{${E}}{${Idm}} - ${Rd} - ${r} = ${R_bientro_sangbt}\\ \\Omega \\).` 
                            },
                            { 
                                text: "Nếu giảm giá trị biến trở R thì cường độ dòng điện trong mạch sẽ tăng lên.",
                                isTrue: true,
                                explanation: "Đúng. Do tổng trở toàn mạch giảm đi thì dòng điện tăng lên theo định luật Ohm."
                            },
                            { 
                                text: "Hiệu suất của nguồn điện đạt cực đại khi xảy ra hiện tượng đoản mạch.", 
                                isTrue: false, 
                                explanation: "Sai. Khi đoản mạch (R = 0), hiệu suất nguồn bằng 0% và dòng điện đạt giá trị cực đại có hại." 
                            }
                         ]
                     }
                }
            ],
            sa: [
                () => {
                    const E = randomInt(6, 12);
                    const r = 2; // Ohm
                    // Công suất cực đại khi R = r => P_max = E^2 / (4r)
                    const P_max = roundTo((E * E) / (4 * r), 2);

                    return {
                        type: 'sa',
                        question: `Một nguồn điện có suất điện động \\( \\mathcal{E} = ${E} \\text{ V} \\) và điện trở trong \\( r = 2\\ \\Omega \\) được nối với mạch ngoài là điện trở \\( R \\). Tính công suất tiêu thụ cực đại của mạch ngoài (tính theo W, làm tròn 2 chữ số thập phân).`,
                        correctAnswer: P_max,
                        suffix: "W",
                        explanation: `Theo lý thuyết, công suất mạch ngoài đạt cực đại khi điện trở mạch ngoài bằng điện trở trong: \\( R = r = 2\\ \\Omega \\).<br/>Giá trị công suất cực đại: \\( P_{max} = \\frac{\\mathcal{E}^2}{4r} = \\frac{${E}^2}{4 \\times 2} = ${P_max} \\text{ W} \\).`
                    };
                }
            ]
        },
        'dien-tro-nhiet': {
            mcq: [
                () => {
                    const ans = "Điện trở giảm khi nhiệt độ tăng";
                    const trap1 = "Điện trở tăng tuyến tính khi nhiệt độ tăng";
                    const trap2 = "Điện trở luôn không đổi bất kể nhiệt độ thay đổi";
                    const trap3 = "Điện trở tăng vọt đột ngột lên vô cùng khi nhiệt độ giảm";

                    const opts = shuffleArray([ans, trap1, trap2, trap3]);

                    return {
                        type: 'mcq',
                        question: "Đặc tính cơ bản của một cảm biến nhiệt điện trở NTC (Negative Temperature Coefficient) là gì?",
                        options: opts.shuffled.map(o => o),
                        correctAnswer: opts.correctIndex,
                        explanation: "Thermistor loại NTC có hệ số nhiệt điện trở âm, nghĩa là điện trở của nó tỉ lệ nghịch với nhiệt độ (khi nhiệt độ tăng thì điện trở giảm)."
                    };
                }
            ],
            tf: [
                () => {
                    return {
                        type: 'tf_cluster',
                        context: `Khảo sát đặc tính hoạt động và ứng dụng của hai loại nhiệt điện trở: NTC và PTC trong kỹ thuật điện tử.`,
                        statements: [
                            {
                                text: "Thermistor NTC thường được chế tạo từ các vật liệu bán dẫn để tận dụng hiện tượng bứt electron tự do khi nhận năng lượng nhiệt.",
                                isTrue: true,
                                explanation: "Đúng. Khi nhiệt độ tăng, nhiều electron được giải phóng giúp tăng khả năng dẫn điện (giảm điện trở)."
                            },
                            {
                                text: "Thermistor PTC có điện trở giảm cực mạnh khi nhiệt độ tăng lên vượt quá một ngưỡng giới hạn.",
                                isTrue: false,
                                explanation: "Sai. PTC (Positive Temperature Coefficient) có điện trở tăng vọt khi nhiệt độ tăng lên vượt quá nhiệt độ Curie."
                            },
                            {
                                text: "Cầu chì tự hồi sinh (Polyswitch) sử dụng đặc tính của PTC để tự động ngắt mạch khi dòng điện chập quá tải tỏa nhiệt mạnh.",
                                isTrue: true,
                                explanation: "Đúng. Dòng quá tải làm nóng PTC khiến trở kháng của nó tăng cực lớn để ngắt dòng, khi nguội đi trở kháng phục hồi như cũ."
                            },
                            {
                                text: "Quan hệ giữa điện trở và nhiệt độ của thermistor NTC hoàn toàn tuyến tính ở mọi khoảng nhiệt độ.",
                                isTrue: false,
                                explanation: "Sai. Mối quan hệ này phi tuyến mạnh mẽ và thường được mô tả bởi phương trình Steinhart-Hart."
                            }
                        ]
                    };
                }
            ],
            sa: [
                () => {
                    const R0 = 1000; // Ohm ở 25 độ C
                    const t = randomInt(30, 45); // độ C
                    const beta = 3950;
                    const T0 = 298.15; // 25 C
                    const T = t + 273.15;
                    const R = R0 * Math.exp(beta * (1/T - 1/T0));
                    const final_ans = roundTo(R, 0);

                    return {
                        type: 'sa',
                        question: `Một cảm biến nhiệt điện trở NTC có điện trở danh định \\( R_0 = 1000\\ \\Omega \\) ở nhiệt độ \\( 25^\\circ\\text{C} \\) và hệ số \\( \\beta = 3950 \\text{ K} \\). Tính điện trở của cảm biến ở nhiệt độ \\( ${t}^\\circ\\text{C} \\) (lấy nhiệt độ tuyệt đối \\( T(\\text{K}) = t(^\\circ\\text{C}) + 273.15 \\), tính bằng Ohm, làm tròn đến số nguyên).`,
                        correctAnswer: final_ans,
                        suffix: "\\( \\Omega \\)",
                        explanation: `Áp dụng công thức đặc tính nhiệt điện trở: \\( R = R_0 e^{\\beta \\left(\\frac{1}{T} - \\frac{1}{T_0}\\right)} \\).<br/>Với \\( T_0 = 298.15 \\text{ K} \\) và \\( T = ${T} \\text{ K} \\):<br/>\\( R = 1000 \\times e^{3950 \\left(\\frac{1}{${T}} - \\frac{1}{298.15}\\right)} = ${final_ans}\\ \\Omega \\).`
                    };
                }
            ]
        },
        'dong-dien-kim-loai': {
            mcq: [
                () => {
                    const rho0 = 1.68; // x 10^-8
                    const alpha = 0.0039;
                    const deltaT = randomInt(50, 100);
                    const rho = roundTo(rho0 * (1 + alpha * deltaT), 2);

                    const ans = `${rho} \\times 10^{-8} \\ \\Omega\\text{m}`;
                    const trap1 = `${roundTo(rho0 * alpha * deltaT, 2)} \\times 10^{-8} \\ \\Omega\\text{m}`;
                    const trap2 = `${roundTo(rho0 * (1 - alpha * deltaT), 2)} \\times 10^{-8} \\ \\Omega\\text{m}`;
                    const trap3 = `${rho0} \\times 10^{-8} \\ \\Omega\\text{m}`;

                    const opts = shuffleArray([ans, trap1, trap2, trap3]);

                    return {
                        type: 'mcq',
                        question: `Đồng có điện trở suất \\( \\rho_0 = 1.68 \\times 10^{-8}\\ \\Omega\\text{m} \\) ở \\( 20^\\circ\\text{C} \\) và hệ số nhiệt điện trở \\( \\alpha = 0.0039 \\text{ K}^{-1} \\). Khi nhiệt độ tăng thêm \\( ${deltaT}^\\circ\\text{C} \\), điện trở suất của đồng sẽ đạt giá trị nào sau đây?`,
                        options: opts.shuffled.map(o => `\\( ${o} \\)`),
                        correctAnswer: opts.correctIndex,
                        explanation: `Áp dụng công thức phụ thuộc nhiệt độ: \\( \\rho = \\rho_0 [1 + \\alpha(t - t_0)] = \\rho_0 [1 + \\alpha \\Delta t] \\).<br/>Thay số: \\( \\rho = 1.68 \\times 10^{-8} \\times [1 + 0.0039 \\times ${deltaT}] = ${rho} \\times 10^{-8}\\ \\Omega\\text{m} \\).`
                    };
                }
            ],
            tf: [
                () => {
                    return {
                        type: 'tf_cluster',
                        context: `Xét bản chất vật lý của dòng điện trong các môi trường dẫn điện: kim loại và chất điện phân.`,
                        statements: [
                            {
                                text: "Hạt tải điện trong kim loại là các electron tự do, còn hạt tải điện trong chất điện phân là các ion dương và ion âm.",
                                isTrue: true,
                                explanation: "Đúng. Kim loại dẫn điện nhờ electron tự do. Chất điện phân dẫn điện nhờ các ion dịch chuyển ngược chiều."
                            },
                            {
                                text: "Điện trở của kim loại tăng khi nhiệt độ tăng do mạng tinh thể dao động mạnh hơn làm tăng sự cản trở chuyển động của electron.",
                                isTrue: true,
                                explanation: "Đúng. Nhiệt độ cao làm các ion nút mạng dao động nhiệt mạnh, tăng xác suất va chạm với dòng electron."
                            },
                            {
                                text: "Hiện tượng cực dương tan xảy ra trong bình điện phân khi anốt làm bằng chính kim loại của muối trong dung dịch điện phân.",
                                isTrue: true,
                                explanation: "Đúng. Khi điện phân dung dịch muối kim loại với anot bằng kim loại đó, anot sẽ bị mòn dần và kim loại bám vào catot."
                            },
                            {
                                text: "Định luật Faraday thứ hai phát biểu rằng khối lượng chất giải phóng ở điện cực bình điện phân tỉ lệ nghịch với cường độ dòng điện.",
                                isTrue: false,
                                explanation: "Sai. Định luật Faraday: \\( m = \\frac{1}{F} \\frac{A}{n} I t \\), khối lượng tỉ lệ thuận với cường độ dòng điện I và thời gian t."
                            }
                        ]
                    };
                }
            ],
            sa: [
                () => {
                    const E = randomInt(4, 8);
                    const r = 1;
                    const R1 = randomChoice([2.5, 3.5]);
                    const Rp = randomChoice([4.0, 5.0]);
                    const timesec = randomInt(1500, 2000);

                    const Eb = E;
                    const rb = r / 2;
                    const Rn = R1 + Rp;
                    const I = Eb / (Rn + rb);

                    const k = 1.118; // mg/C
                    const m_grams = (k * I * timesec) / 1000;
                    const final_ans = roundTo(m_grams, 2);

                    const mins = Math.floor(timesec/60);
                    const secs = timesec % 60;

                    return {
                         type: 'sa',
                         question: `Hai nguồn giống nhau ghép song song, mỗi nguồn có suất điện động \\( \\mathcal{E} = ${E}\\text{ V} \\) và điện trở trong \\( r = ${r}\\ \\Omega \\). Mạch ngoài gồm điện trở \\( R_1 = ${R1}\\ \\Omega \\) mắc nối tiếp với bình điện phân đựng dung dịch \\( \\text{AgNO}_3 \\) có cực dương bằng bạc (điện trở bình điện phân \\( R_p = ${Rp}\\ \\Omega \\)). Lấy hệ số điện hóa của bạc là \\( k = 1.118 \\text{ mg/C} \\). Tính khối lượng bạc bám vào catốt sau ${mins} phút ${secs} giây điện phân (tính bằng gam, làm tròn 2 chữ số thập phân).`,
                         correctAnswer: final_ans,
                         suffix: "g",
                         explanation: `Suất điện động và điện trở bộ nguồn song song: \\( E_b = ${E}\\text{ V}, r_b = ${roundTo(r/2, 2)}\\ \\Omega \\).<br/>Cường độ dòng điện qua bình điện phân: \\( I = \\frac{E_b}{R_1 + R_p + r_b} = \\frac{${E}}{${R1} + ${Rp} + ${rb}} = ${roundTo(I, 3)}\\text{ A} \\).<br/>Khối lượng bạc giải phóng: \\( m = k \\cdot I \\cdot t = (1.118\\cdot 10^{-3}) \\times ${roundTo(I, 3)} \\times ${timesec} = ${final_ans} \\text{ g} \\).`
                    }
                }
            ]
        },
        'do-suat-dien-dong': {
            mcq: [
                () => {
                    const E = randomFloat(1.5, 3.0, 1);
                    const r = randomFloat(0.5, 1.5, 1);
                    const I1 = 0.5;
                    const U1 = roundTo(E - r * I1, 2);
                    const I2 = 1.0;
                    const U2 = roundTo(E - r * I2, 2);

                    const ans = `\\mathcal{E} = ${E} \\text{ V}, r = ${r} \\ \\Omega`;
                    const trap1 = `\\mathcal{E} = ${roundTo(E+0.2, 1)} \\text{ V}, r = ${roundTo(r+0.1, 1)} \\ \\Omega`;
                    const trap2 = `\\mathcal{E} = ${E} \\text{ V}, r = 0 \\ \\Omega`;
                    const trap3 = `\\mathcal{E} = ${roundTo(E-0.3, 1)} \\text{ V}, r = ${roundTo(r*2, 1)} \\ \\Omega`;

                    const opts = shuffleArray([ans, trap1, trap2, trap3]);

                    return {
                        type: 'mcq',
                        question: `Trong thí nghiệm thực hành đo suất điện động và điện trở trong của nguồn điện, học sinh đo được hai cặp giá trị tương ứng của hiệu điện thế mạch ngoài U và cường độ dòng điện I là: \\( I_1 = ${I1} \\text{ A} \\Rightarrow U_1 = ${U1} \\text{ V} \\) và \\( I_2 = ${I2} \\text{ A} \\Rightarrow U_2 = ${U2} \\text{ V} \\). Suất điện động và điện trở trong của nguồn là:`,
                        options: opts.shuffled.map(o => `\\( ${o} \\)`),
                        correctAnswer: opts.correctIndex,
                        explanation: `Ta có hệ phương trình dựa trên đặc tuyến nguồn \\( U = \\mathcal{E} - Ir \\):<br/>1) \\( ${U1} = \\mathcal{E} - ${I1}r \\)<br/>2) \\( ${U2} = \\mathcal{E} - ${I2}r \\)<br/>Trừ vế theo vế: \\( U_1 - U_2 = r(I_2 - I_1) \\Rightarrow ${U1 - U2} = r(${I2 - I1}) \\Rightarrow r = ${r}\\ \\Omega \\).<br/>Thế ngược lại ta tìm được \\( \\mathcal{E} = ${E} \\text{ V} \\).`
                    };
                }
            ],
            tf: [
                () => {
                    return {
                        type: 'tf_cluster',
                        context: `Phân tích quy trình và sai số trong thí nghiệm thực hành đo suất điện động \\( \\mathcal{E} \\) và điện trở trong \\( r \\) của một pin điện hóa.`,
                        statements: [
                            {
                                text: "Để xác định suất điện động \\( \\mathcal{E} \\) bằng phương pháp đồ thị, ta vẽ đồ thị \\( U = f(I) \\) rồi kéo dài đường thẳng này cắt trục tung \\( U \\) tại điểm có giá trị bằng \\( \\mathcal{E} \\).",
                                isTrue: true,
                                explanation: "Đúng. Giao điểm với trục tung ứng với trạng thái hở mạch (I = 0), khi đó \\( U = \\mathcal{E} \\)."
                            },
                            {
                                text: "Điện trở trong r của nguồn chính bằng hệ số góc (độ dốc) của đường thẳng biểu diễn mối quan hệ \\( U = f(I) \\).",
                                isTrue: true,
                                explanation: "Đúng. Vì độ dốc \\( k = -r \\), độ lớn của độ dốc chính là nội trở r."
                            },
                            {
                                text: "Để an toàn cho pin, học sinh nên gạt biến trở về mức 0 Ohm rồi mới đóng công tắc điện đo dòng điện dài ngày.",
                                isTrue: false,
                                explanation: "Sai. Gạt biến trở về 0 Ohm sẽ gây ra đoản mạch làm nóng hỏng pin ngay lập tức."
                            },
                            {
                                text: "Sử dụng vôn kế có điện trở cực lớn mắc song song với nguồn sẽ giảm thiểu tối đa sai số hệ thống khi đo điện áp hở mạch.",
                                isTrue: true,
                                explanation: "Đúng. Vôn kế có trở vô cùng lớn làm dòng qua nó không đáng kể, phản ánh chính xác điện áp hở mạch."
                            }
                        ]
                    };
                }
            ],
            sa: [
                () => {
                    const E = randomFloat(1.2, 1.8, 1);
                    const r = randomFloat(0.3, 0.9, 1);
                    const I = 0.5;
                    const U = roundTo(E - r * I, 2);
                    
                    return {
                        type: 'sa',
                        question: `Trong thí nghiệm đo suất điện động và điện trở trong, khi cường độ dòng điện chạy qua mạch là \\( I = ${I} \\text{ A} \\) thì hiệu điện thế giữa hai cực của pin là \\( U = ${U} \\text{ V} \\). Biết điện trở trong của pin đo được là \\( r = ${r}\\ \\Omega \\). Tính suất điện động của pin này (tính bằng V, làm tròn 2 chữ số thập phân).`,
                        correctAnswer: E,
                        suffix: "V",
                        explanation: `Áp dụng công thức đặc tuyến của nguồn điện: \\( U = \\mathcal{E} - I \\cdot r \\Rightarrow \\mathcal{E} = U + I \\cdot r \\).<br/>Thay số: \\( \\mathcal{E} = ${U} + ${I} \\times ${r} = ${E} \\text{ V} \\).`
                    };
                }
            ]
        },
        'su-chuyen-the': {
            mcq: [
                () => {
                    const m = randomFloat(0.2, 0.8, 1);
                    const lambda = 3.4e5; // J/kg nhiệt nóng chảy nước đá
                    const Q = roundTo((m * lambda) / 1000, 1); // kJ

                    const ans = `${Q} \\text{ kJ}`;
                    const trap1 = `${roundTo(Q * 1000, 1)} \\text{ kJ}`;
                    const trap2 = `${roundTo(Q / 1000, 2)} \\text{ kJ}`;
                    const trap3 = `${roundTo(m * 2.3e6 / 1000, 1)} \\text{ kJ}`;

                    const opts = shuffleArray([ans, trap1, trap2, trap3]);

                    return {
                        type: 'mcq',
                        question: `Cần cung cấp một nhiệt lượng bằng bao nhiêu để làm nóng chảy hoàn toàn \\( m = ${m} \\text{ kg} \\) nước đá ở nhiệt độ \\( 0^\\circ\\text{C} \\)? Biết nhiệt nóng chảy riêng của nước đá là \\( \\lambda = 3.4 \\times 10^5 \\text{ J/kg} \\).`,
                        options: opts.shuffled.map(o => `\\( ${o} \\)`),
                        correctAnswer: opts.correctIndex,
                        explanation: `Nhiệt lượng để nóng chảy hoàn toàn chất rắn ở nhiệt độ nóng chảy: \\( Q = \\lambda \\cdot m \\).<br/>Thay số: \\( Q = 3.4 \\times 10^5 \\times ${m} = ${m * lambda} \\text{ J} = ${Q} \\text{ kJ} \\).`
                    };
                }
            ],
            tf: [
                () => {
                    return {
                        type: 'tf_cluster',
                        context: `Xét các quá trình chuyển trạng thái vật lý (sự chuyển thể) của vật chất trong nhiệt học.`,
                        statements: [
                            {
                                text: "Trong suốt quá trình nóng chảy hay đông đặc của một chất tinh khiết, nhiệt độ của hệ luôn được duy trì không đổi.",
                                isTrue: true,
                                explanation: "Đúng. Năng lượng trao đổi lúc này dùng để phá vỡ hoặc hình thành liên kết mạng tinh thể chứ không làm tăng động năng nhiệt."
                            },
                            {
                                text: "Sự bay hơi của chất lỏng chỉ diễn ra tại một nhiệt độ xác định gọi là điểm sôi.",
                                isTrue: false,
                                explanation: "Sai. Sự bay hơi xảy ra ở bề mặt chất lỏng ở mọi nhiệt độ. Sự sôi mới xảy ra ở một nhiệt độ xác định (điểm sôi) trong toàn bộ lòng chất lỏng."
                            },
                            {
                                text: "Nhiệt hóa hơi riêng của một chất lỏng là nhiệt lượng cần cung cấp để 1 kg chất lỏng đó chuyển hoàn toàn sang thể khí ở nhiệt độ sôi.",
                                isTrue: true,
                                explanation: "Đúng. Đây là định nghĩa của nhiệt hóa hơi riêng."
                            },
                            {
                                text: "Khi nước đá tan thành nước lỏng, nó giải phóng ra môi trường một lượng nhiệt cực lớn làm môi trường xung quanh nóng lên.",
                                isTrue: false,
                                explanation: "Sai. Quá trình nóng chảy là quá trình thu nhiệt từ môi trường làm môi trường xung quanh lạnh đi."
                            }
                        ]
                    };
                }
            ],
            sa: [
                () => {
                    const m = randomFloat(0.1, 0.4, 2);
                    const L = 2.3e6; // J/kg nhiệt hóa hơi của nước
                    const Q_kJ = roundTo((m * L) / 1000, 1);

                    return {
                        type: 'sa',
                        question: `Tính nhiệt lượng (theo đơn vị kJ) cần thiết để làm hóa hơi hoàn toàn \\( m = ${m} \\text{ kg} \\) nước ở nhiệt độ sôi \\( 100^\\circ\\text{C} \\). Biết nhiệt hóa hơi riêng của nước là \\( L = 2.3 \\times 10^6 \\text{ J/kg} \\) (làm tròn 1 chữ số thập phân).`,
                        correctAnswer: Q_kJ,
                        suffix: "kJ",
                        explanation: `Nhiệt lượng cần cung cấp để hóa hơi chất lỏng ở nhiệt độ sôi: \\( Q = L \\cdot m \\).<br/>Thay số: \\( Q = 2.3 \\times 10^6 \\times ${m} = ${m * L} \\text{ J} = ${Q_kJ} \\text{ kJ} \\).`
                    };
                }
            ]
        }
    };

    // Public API
    window.PhysicsQuizDB = {
        getSeeds: (topic) => seeds[topic] || {},
        generateQuestion: (topic, type) => {
            const topicSeeds = seeds[topic];
            if(!topicSeeds || !topicSeeds[type] || topicSeeds[type].length === 0) return null;
            // Pick a random seed
            const seeder = topicSeeds[type][Math.floor(Math.random() * topicSeeds[type].length)];
            return seeder();
        }
    };

    console.log('[Quiz Database] Parameterized Seed Architecture loaded successfully.');
})();

const texts = [
  "tam giác abc vuông cân tại a có bc = 4 căn 2. góc giữa mặt bên (sbc) và đáy bằng 60 độ.",
  "cho hình chóp s.abcd có sa = a căn 3, ab = a, ad = 2a.",
  "cho hình hộp chữ nhật abcd.a'b'c'd' có ab = 4, ad = 5, aa' = 6.",
  "cho lăng trụ abcd.a'b'c'd' có ab = a, aa' = a, góc abc = 120 độ."
];

for (const t of texts) {
  console.log("\nTesting text:", t);
  const re = /\b(ab|bc|cd|da|ad|sa|sb|sc|sd|so|sh|aa'|aa)\s*(?:bằng|=)\s*([^\n,;.]+)/gi;
  let m;
  while ((m = re.exec(t)) !== null) {
    console.log(`  Segment: ${m[1].toUpperCase()} -> Value: "${m[2].trim()}"`);
  }
}

import { spawn } from 'child_process';
import path from 'path';

// Danh sách các key chuẩn của người dùng
const keys = [
  "AQ.Ab8RN6LQUsXZaXFWOu7LxhO1noUzb_RAUuKrdkWA8u5_0RdyyA",
  "AQ.Ab8RN6KUEHlTK1rT6BDHzBwN3DT31L3L1kFriKNwaPSzZ_94Cg",
  "AQ.Ab8RN6LxIk7ajnDHC39c8HL8idUj_qHEEHZeHVhgQQJd6IVneg",
  "AQ.Ab8RN6IUK2SgSUHRvfrUgkMYh5ZuUkU6ARM0xV_tKg901ZFyVA",
  "AQ.Ab8RN6LgzhQhuXeK0P69gw9u_kyxv8jlWTsII--OlfbGDGMddg",
  "AQ.Ab8RN6L5ny1C1LsZNy8FdxzzqK0LYub9mSFVvfnprdwduJx8pQ",
  "AQ.Ab8RN6KGyO7LdzYEgcDARmK334qSXG689ngaloM9-Mbl3g5VUg",
  "AQ.Ab8RN6J11YpEGf4L9cmBzNkXmFSeKG1c97JlM8ympwksIjmJSQ",
  "AQ.Ab8RN6JCqpqGwgnjLGH5FuV3Ep3kbFGGNiH7XrFvfBqNKHuUxw",
  "AQ.Ab8RN6JqjVgnLduoyC8IHvGKU0-4lZtqHOMGKCQ32w398vWb-Q",
  "AQ.Ab8RN6I1nbEbhyw1ZPatFRlKk9ncAV-SrcfarJHYvztbPU-pYg",
  "AQ.Ab8RN6LENXueegwE82g3Oar7laqRNtDkWxgVA2cnIBEpiRhZsA",
  "AQ.Ab8RN6LKAFq4FY9r6CykD_7DJvtItBGL7sfzsHzNJW-vQESMpw",
  "AQ.Ab8RN6KIImWYQ51P647KvVQo-bAuoj9-mnsteNemFEvhIU2DOA",
  "AQ.Ab8RN6J5TlTTIgxjuhZgPAnPbHduDgPI_9Sx2R_2mDnx9cbDiQ",
  "AQ.Ab8RN6JrZn-2b8RqNFZlr_HimuWnvys1aklTyNaOCqI8cv1vUw",
  "AQ.Ab8RN6LRcFc7ZLNfv8sT5DaGLVcVAmQPoPvDZg4L5g2gCNxQBA",
  "AQ.Ab8RN6LnbeGSrsPvVC2IRjcyV-ScvQbLdC4hiaLjRUYlTk9nKw",
  "AQ.Ab8RN6LUOCQS9WwVdCoW1bTJ4u8S6PdTmn-t8gmhAGu4rOUQMQ",
  "AQ.Ab8RN6JQvJjqbu_KwhS6SeCMklVrkn6UO0eLX823yMCY9gXM9A",
  "AQ.Ab8RN6J_LKcFYULWOJSsNXTG3RY3tGhM2Xwpf49A2pwlFMF06w",
  "AQ.Ab8RN6IdFVTAurHBXOU2_zJcxNtHt17VB9hG7RUtgeQVZ8ztoQ",
  "AQ.Ab8RN6Jb1VWu7uwY_em6QfmQ9MAjwJUlbrU99wgmwWv1ZTA98A",
  "AQ.Ab8RN6IDogiOEW1CygJr0X7wyzuErXX9l1eyrFNim_OlD7awng",
  "AQ.Ab8RN6JPxg59QpmLxbpiEO7uNFHFSESUpsdnJoQKl2bT77d9iQ",
  "AIzaSyA3D-AqEnF44r5ON7EJ2sgKJq77wCBtAr4",
  "AIzaSyCnYq7Ixx_FXvYY7tt4DvAtxMMpVP8Qkic",
  "AIzaSyDGAlJXK72_tCOFXKVb2LAMmDzLcE7Ve8I"
];

const secretValue = keys.join(',');
console.log('Nạp bí mật GEMINI_API_KEY lên Cloudflare (Zero Exposure). Số lượng key:', keys.length, 'Độ dài chuỗi:', secretValue.length);

const cwd = path.resolve('cloudflare-worker');
const child = spawn('npx.cmd', ['--yes', 'wrangler', 'secret', 'put', 'GEMINI_API_KEY'], {
  cwd,
  shell: true,
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stdout.on('data', d => process.stdout.write(d));
child.stderr.on('data', d => process.stderr.write(d));

// Viết trực tiếp vào stdin chuẩn của wrangler
child.stdin.write(secretValue + '\n');
child.stdin.end();

child.on('close', code => {
  console.log(`\nHoàn tất nạp Secret với exit code: ${code}`);
  process.exit(code);
});

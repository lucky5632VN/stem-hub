import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { useGeometryStore } from '../../store/useGeometryStore';
import {
  Wand2, Upload, Loader2, X, ImagePlus, FileText,
  AlertCircle, Eye, RefreshCw, Send, Bot, Sparkles, ChevronDown, ChevronUp, GripHorizontal,
  AlertTriangle, CheckCircle2
} from 'lucide-react';
import { calculateGeometry, type ShapeContext } from '../../utils/geometryCalculator';
import { parseMarkdown, parseChatModelOutput, toNaturalVietnameseMathText, splitForStreaming } from '../../utils/markdown';
import { solveGeometryFacts, extractFallbackGeometry } from '../../utils/geometryFactSolver';
import { API_ENDPOINTS, CLOUDFLARE_EDGE_PROXY_URL, fetchWithTimeout } from '../../config/api';


// ─── Types ──────────────────────────────────────────────────────────────────

interface GeometryData {
  analysis?: string;
  vertices: number[][];
  faces: number[][];
  visible_edges: number[][];
  hidden_edges: number[][];
  auxiliary_edges?: number[][];
  auxiliary_labels?: string[];
  highlight_planes?: { points: string[]; indices: number[]; color?: string; name?: string }[];
  vertex_labels: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

// API URL is now handled by centralized axios config

// ─── Direct Client-Side Gemini Vision Fallback (Edge Proxy Failure Resilience) ────────
async function extractWithDirectGeminiVision(base64Image: string, mimeType: string, extraPromptText?: string): Promise<any> {
  // 1. Ưu tiên gọi API OCR bảo mật với Key Rotation từ Server
  const ocrEndpoints = [
    '/api/lab-toan/vision-ocr',
    API_ENDPOINTS.visionOcr,
    '/api/ai/chat'
  ];

  for (const endpoint of ocrEndpoints) {
    try {
      if (endpoint === '/api/ai/chat') {
        const prompt = `Bạn là chuyên gia bóc tách đề bài Toán học Hình học Không gian THPT. Hãy đọc ảnh và trích xuất đúng 1 khối JSON duy nhất:\n{\n  "problemText": "Toàn bộ chuỗi văn bản đề bài đọc được từ ảnh",\n  "shapeType": "hinh_chop_tam_giac" | "hinh_chop_day_hcn" | "hinh_chop_tu_giac_deu" | "hinh_lang_tru_tam_giac_deu" | "khac",\n  "shapeName": "Tên hình",\n  "givenFacts": []\n}`;
        const res = await fetchWithTimeout(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType, data: base64Image } }
                ]
              }
            ],
            responseMimeType: 'application/json'
          })
        }, 30000);
        if (res.ok) {
          const data = await res.json();
          const raw = data.text || data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            let clean = raw.replace(/```json/gi, '').replace(/```/gi, '').trim();
            const first = clean.indexOf('{');
            const last = clean.lastIndexOf('}');
            if (first !== -1 && last > first) clean = clean.substring(first, last + 1);
            const parsed = JSON.parse(clean);
            if (parsed && parsed.problemText) {
              parsed.problemText = toNaturalVietnameseMathText(parsed.problemText);
              return parsed;
            }
          }
        }
      } else {
        const res = await fetchWithTimeout(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Image, mimeType, extraPromptText })
        }, 30000);

        if (res.ok) {
          const data = await res.json();
          if (data && (data.problemText || data.success)) {
            if (data.problemText) data.problemText = toNaturalVietnameseMathText(data.problemText);
            return data;
          }
        }
      }
    } catch (apiErr) {
      console.warn(`[extractWithDirectGeminiVision] OCR endpoint ${endpoint} failed:`, apiErr);
    }
  }

  // 2. Client-side fallback nếu có key trực tiếp
  const geminiKey = (
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (import.meta as any).env?.NEXT_PUBLIC_GEMINI_API_KEY ||
    ''
  ).trim();

  if (!geminiKey) return null;

  const prompt = `
Bạn là chuyên gia bóc tách dữ liệu Toán học Hình học Không gian THPT.
Hãy đọc ảnh và trích xuất đúng 1 khối JSON duy nhất theo cấu trúc:
{
  "problemText": "Toàn bộ chuỗi văn bản đề bài đọc được từ ảnh bằng tiếng Việt tự nhiên dễ đọc (ví dụ: 'góc ABC = 120°', 'a√2', 'tam giác ABC', KHÔNG dùng mã lệnh LaTeX như \\widehat, \\circ, \\sqrt)",
  "shapeType": "hinh_chop_tam_giac",
  "shapeName": "Hình chóp S.ABC (SA ⊥ đáy)",
  "givenFacts": [
    { "type": "length", "element": "BC", "value": "a√2", "numericValue": 5.66 },
    { "type": "angle", "between": ["(SBC)", "(ABC)"], "degrees": 45 },
    { "type": "perpendicular", "line": "SA", "plane": "mp_day" }
  ]
}
QUY TẮC BẮT BUỘC:
- CHỈ TRẢ VỀ ĐÚNG 1 KHỐI JSON DUY NHẤT.
- problemText viết bằng TIẾNG VIỆT TỰ NHIÊN DỄ ĐỌC (chuẩn SGK), KHÔNG để mã LaTeX thô như \\widehat{ABC} = 120^0.
- "shapeType": "hinh_chop_tam_giac" | "hinh_chop_day_hcn" | "hinh_chop_tu_giac_deu" | "hinh_chop_tam_giac_deu" | "hinh_hop_chu_nhat" | "hinh_lang_tru_tam_giac_deu" | "hinh_tru" | "hinh_non" | "hinh_cau" | "khac"
- Không tự đoán tính chiều cao nếu đề bài chưa cho trực tiếp.
${extraPromptText ? `Đề bài kèm theo: "${extraPromptText}"` : ''}
`;

  const models = ['gemini-flash-lite-latest', 'gemini-3.1-flash-lite-preview', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64Image } }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      });

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        let clean = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const first = clean.indexOf('{');
        const last = clean.lastIndexOf('}');
        if (first !== -1 && last > first) {
          clean = clean.substring(first, last + 1);
        }
        const parsed = JSON.parse(clean);
        if (parsed?.problemText) {
          parsed.problemText = toNaturalVietnameseMathText(parsed.problemText);
        }
        return parsed;
      }
    } catch (e) {
      console.warn(`[DirectGeminiVision] Model ${model} error:`, e);
    }
  }
  return null;
}

// ─── Direct Client-Side Chat Model Fallback ──────────────────────────────────
async function callDirectGeminiChatModel(question: string, modelContext: any): Promise<any> {
  const geminiKey = (
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (import.meta as any).env?.NEXT_PUBLIC_GEMINI_API_KEY ||
    ''
  ).trim();

  const vertexCoords = (modelContext?.labels || []).map((lbl: string, idx: number) => ({
    diem: lbl,
    toaDo: modelContext?.vertices?.[idx] || []
  }));

  const contextSummary = `
Tên khối hình: ${modelContext?.shapeName || modelContext?.shapeType || 'Mô hình 3D'}
Loại hình: ${modelContext?.shapeType || 'hinh_khong_gian'}
Đề bài gốc: "${modelContext?.originalProblemText || 'N/A'}"
Các tham số: ${JSON.stringify(modelContext?.parameters || {})}
Các đại lượng hình học đã tính (TẦNG 2): ${JSON.stringify(modelContext?.calculations || {}, null, 2)}
Tọa độ 3D thực tế: ${JSON.stringify(vertexCoords, null, 2)}
Danh sách đỉnh: ${JSON.stringify(modelContext?.labels || [])}
`;

  const systemInstruction = `Bạn là Trợ lý AI Chuyên gia Hình học Không gian 3D tương tác của hệ thống STEM HUB.
PHONG CÁCH TRÌNH BÀY: CHUẨN MỰC, TỰ NHIÊN, TÓM TẮT SÚC TÍCH THEO SGK:
- Trình bày diễn giải toán học tự nhiên, mạch lạc, dễ hiểu theo đúng chuẩn sách giáo khoa Việt Nam.
- CÔNG THỨC TOÁN BẮT BUỘC VIẾT CHUẨN LATEX:
  * Dùng $...$ cho công thức inline hoặc $$...$$ cho công thức trọng tâm.
  * Luôn viết đầy đủ dấu gạch chéo và ngoặc nhọn: \\\\frac{a}{b}, \\\\sqrt{x}, \\\\cdot, \\\\Delta.
  * TUYỆT ĐỐI KHÔNG viết dạng pseudo-code thiếu gạch chéo hay thiếu ngoặc như "frac a^2 sqrt 3 4" hay "sqrt a^2 - frac a^2 3".
  * TUYỆT ĐỐI KHÔNG ngắt dấu nhân (\\\\cdot) hay dấu bằng (=) thành từng dòng đứng một mình. Hãy viết đẳng thức trên một dòng hoàn chỉnh.
  * BẮT BUỘC giữ nguyên tham số ẩn a, căn thức, phân thức tối giản.

BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON DUY NHẤT HỢP LỆ THEO MẪU:
{
  "answer": "Câu trả lời diễn giải Toán học tự nhiên (dùng LaTeX $...$ hoặc $$...$$).",
  "action": null
}

CÁC DẠNG ACTION HỖ TRỢ (nếu câu hỏi yêu cầu kẻ thêm đường phụ):
1. "perpendicular": Kẻ đường vuông góc từ điểm lên đoạn thẳng: { "type": "perpendicular", "from": "S", "toLine": ["A", "B"], "pointName": "H" }
2. "midpoint": Lấy trung điểm đoạn thẳng: { "type": "midpoint", "onLine": ["A", "B"], "pointName": "H", "connectFrom": "S" }
3. "segment": Kẻ đoạn thẳng nối 2 điểm: { "type": "segment", "from": "S", "to": "H" }
4. "highlight_plane": Tô màu mặt phẳng thiết diện: { "type": "highlight_plane", "points": ["S", "A", "B"], "color": "#f59e0b", "name": "(SAB)" }

NGỮ CẢNH HÌNH HỌC:
${contextSummary}
`;

  // 1. First fallback: Universal AI Gateway /api/ai/chat (Zero-key client fallback)
  try {
    const gatewayRes = await fetchWithTimeout('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Câu hỏi hoặc yêu cầu của học sinh: "${question}"`,
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2
      })
    }, 30000);

    if (gatewayRes.ok) {
      const gData = await gatewayRes.json();
      const rawText = gData.text || gData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        let clean = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const first = clean.indexOf('{');
        const last = clean.lastIndexOf('}');
        if (first !== -1 && last > first) {
          clean = clean.substring(first, last + 1);
        }
        return JSON.parse(clean);
      }
    }
  } catch (gErr) {
    console.warn('[callDirectGeminiChatModel] /api/ai/chat fallback failed:', gErr);
  }

  // 2. Client-side fallback if explicit API key is provided
  if (!geminiKey) {
    throw new Error('Tất cả mô hình AI đều bận hoặc chưa có kết nối.');
  }

  const models = ['gemini-flash-lite-latest', 'gemini-3.1-flash-lite-preview', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `Câu hỏi của học sinh: "${question}"` }] }],
          system_instruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json'
          }
        })
      });

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        let clean = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const first = clean.indexOf('{');
        const last = clean.lastIndexOf('}');
        if (first !== -1 && last > first) {
          clean = clean.substring(first, last + 1);
        }
        return JSON.parse(clean);
      }
    } catch (e) {
      console.warn(`[DirectGeminiChat] Model ${model} failed:`, e);
    }
  }

  throw new Error('Tất cả mô hình AI đều bận.');
}

// ─── Three.js Renderer Hook ──────────────────────────────────────────────────

function useThreeRenderer(
  mountRef: React.RefObject<HTMLDivElement | null>,
  data: GeometryData | null
) {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cssRendererRef = useRef<CSS2DRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameIdRef = useRef<number>(0);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    const { clientWidth: W, clientHeight: H } = mount;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0d1117');
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 1000);
    camera.position.set(8, -12, 9);
    camera.up.set(0, 0, 1);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // CSS2D Renderer for labels
    const cssRenderer = new CSS2DRenderer();
    cssRenderer.setSize(W, H);
    cssRenderer.domElement.style.position = 'absolute';
    cssRenderer.domElement.style.top = '0';
    cssRenderer.domElement.style.left = '0';
    cssRenderer.domElement.style.width = '100%';
    cssRenderer.domElement.style.height = '100%';
    cssRenderer.domElement.style.pointerEvents = 'none';
    cssRenderer.domElement.style.overflow = 'hidden';
    mount.appendChild(cssRenderer.domElement);
    cssRendererRef.current = cssRenderer;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, -10, 15);
    scene.add(dirLight);

    // Grid helper – lớn hơn, rõ hơn để dễ định hướng không gian
    const grid = new THREE.GridHelper(20, 20, '#2d333b', '#21262d');
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 2;
    controls.maxDistance = 40;
    controlsRef.current = controls;

    // Animate
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      cssRenderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      cssRenderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      if (mount.contains(cssRenderer.domElement)) mount.removeChild(cssRenderer.domElement);
    };
  }, []); // eslint-disable-line

  // Render geometry data với Dynamic Occlusion (nét đứt/liền tự động theo góc nhìn camera)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Dọn dẹp triệt để bằng traverse để tìm mọi object (kể cả nested) có isGeometry
    const toRemove: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj.userData.isGeometry) toRemove.push(obj);
    });
    toRemove.forEach((obj) => {
      // Gỡ DOM element của CSS2DObject để tránh bị "bóng ma" nhãn chữ đọng lại trên màn hình
      const anyObj = obj as any;
      if (anyObj.isCSS2DObject && anyObj.element && anyObj.element.parentNode) {
        anyObj.element.parentNode.removeChild(anyObj.element);
      }
      if (obj.parent) obj.parent.remove(obj);
    });

    if (!data || data.vertices.length < 2) return;

    // Toạ độ gốc — giữ nguyên để debug dễ hơn và khớp với số liệu đề bài
    const verts = data.vertices.map(([x, y, z]) => new THREE.Vector3(x, y, z));

    // Tạo Group container — toàn bộ geometry được add vào đây
    const geoGroup = new THREE.Group();
    geoGroup.userData.isGeometry = true;
    scene.add(geoGroup);

    // Tính Bounding Box để biết kích thước và căn giữa không gian
    const boundingBox = new THREE.Box3().setFromPoints(verts);
    const center = boundingBox.getCenter(new THREE.Vector3());
    // Đặt group tại trọng tâm mặt phẳng lưới (x=0, y=0) và đáy chạm đúng z=0
    geoGroup.position.set(-center.x, -center.y, -boundingBox.min.z);

    // ── Bước 1: Gộp tất cả cạnh thành 1 BufferGeometry duy nhất ─────────────
    // Không phân biệt visible/hidden nữa — GPU Depth Test sẽ tự xử lý
    const allEdges = [...(data.visible_edges ?? []), ...(data.hidden_edges ?? [])];

    const edgePositions: number[] = [];
    allEdges.forEach(([a, b]) => {
      if (a >= verts.length || b >= verts.length) return;
      edgePositions.push(verts[a].x, verts[a].y, verts[a].z);
      edgePositions.push(verts[b].x, verts[b].y, verts[b].z);
    });

    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(edgePositions, 3)
    );

    // ── PASS 0: Mesh bề mặt — Ghi vào Depth Buffer ────────────────────────
    // Khối pha lê trong suốt: depthWrite: true giúp GPU xử lý nét đứt / liền tự động
    if (data.faces.length > 0) {
      const facePositions: number[] = [];
      data.faces.forEach((face) => {
        for (let i = 1; i < face.length - 1; i++) {
          [face[0], face[i], face[i + 1]].forEach((idx) => {
            facePositions.push(verts[idx].x, verts[idx].y, verts[idx].z);
          });
        }
      });

      const faceGeo = new THREE.BufferGeometry();
      faceGeo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(facePositions, 3)
      );
      faceGeo.computeVertexNormals();

      const occluderMesh = new THREE.Mesh(
        faceGeo,
        new THREE.MeshBasicMaterial({
          color: '#388bfd',         // Xanh sapphire pha lê
          transparent: true,        // Cùng Transparent bucket với Lines → renderOrder hoạt động đúng
          opacity: 0.12,            // Khối đa diện pha lê có chiều sâu thẩm mỹ, không bị mờ nhạt
          side: THREE.DoubleSide,   // Hiển thị cả mặt trong khi xoay 360°
          depthWrite: true,         // BẮT BUỘC: ghi khoảng cách vào Depth Buffer
          polygonOffset: true,      // Chống Z-Fighting: đẩy mesh lùi ra xa camera
          polygonOffsetFactor: 1,   // một chút so với các cạnh có cùng tọa độ
          polygonOffsetUnits: 1,    // → cạnh luôn thắng khi depth value bằng nhau
        })
      );
      occluderMesh.renderOrder = 0;
      occluderMesh.userData.isGeometry = true;
      geoGroup.add(occluderMesh);
    }

    // ── PASS 1: Nét đứt — Lớp nền (bị che bởi Mesh) ───────────────────────
    // depthFunc: GreaterDepth → chỉ render những pixel CÓ khoảng cách lớn hơn
    // giá trị Depth Buffer (tức là nằm "phía sau" mặt khối) → hiển thị nét đứt
    const dashedMat = new THREE.LineDashedMaterial({
      color: '#6e7681',                // Màu trầm hơn để tạo chiều sâu
      dashSize: 0.1,                   // Nét đứt ngắn hơn, tinh tế hơn
      gapSize: 0.06,
      depthFunc: THREE.GreaterDepth,   // Chỉ vẽ khi cạnh BỊ mặt khối che khuất
      depthWrite: false,
      transparent: true,
      opacity: 0.5,                    // Độ mờ vừa phải để không gây nhiễu
    });
    const dashedLines = new THREE.LineSegments(edgeGeo.clone(), dashedMat);
    // BẮT BUỘC: computeLineDistances() để nét đứt tính được độ dài đoạn
    dashedLines.computeLineDistances();
    dashedLines.renderOrder = 1;
    dashedLines.userData.isGeometry = true;
    geoGroup.add(dashedLines);

    // ── PASS 2: Nét liền — Lớp trên (không bị che) ────────────────────────
    // depthFunc: LessEqualDepth → chỉ render những pixel CÓ khoảng cách nhỏ hơn
    // hoặc bằng Depth Buffer (tức là nằm "phía trước" hoặc trên mặt khối) → nét liền
    const solidMat = new THREE.LineBasicMaterial({
      color: '#ffffff',                // Màu trắng tinh khiết cho nét chính
      depthFunc: THREE.LessEqualDepth, // Chỉ vẽ khi cạnh KHÔNG bị che khuất
      depthWrite: false,
      transparent: true,
      opacity: 1.0,
    });
    const solidLines = new THREE.LineSegments(edgeGeo, solidMat);
    solidLines.renderOrder = 2;
    solidLines.userData.isGeometry = true;
    geoGroup.add(solidLines);

    // ── PASS 3 & 4: Đường phụ (Auxiliary Edges) ───────────────────────────
    // Dành riêng cho các đường kẻ thêm (AH vuông góc SB, trung tuyến AM...)
    // Sử dụng màu Vàng Neon #ffcc00 để học sinh phân biệt rõ với cạnh gốc
    if (data.auxiliary_edges && data.auxiliary_edges.length > 0) {
      const auxPositions: number[] = [];
      data.auxiliary_edges.forEach(([a, b]) => {
        if (a >= verts.length || b >= verts.length) return;
        auxPositions.push(verts[a].x, verts[a].y, verts[a].z);
        auxPositions.push(verts[b].x, verts[b].y, verts[b].z);
      });

      if (auxPositions.length > 0) {
        const auxEdgeGeo = new THREE.BufferGeometry();
        auxEdgeGeo.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(auxPositions, 3)
        );

        // PASS 3: Nét đứt đường phụ khi BỊ mặt khối che khuất (Cam trầm hơn)
        const auxDashedMat = new THREE.LineDashedMaterial({
          color: '#d97706',                // Cam/vàng trầm
          dashSize: 0.12,
          gapSize: 0.08,
          depthFunc: THREE.GreaterDepth,   // Bị che
          depthWrite: false,
          transparent: true,
          opacity: 0.6,
        });
        const auxDashedLines = new THREE.LineSegments(auxEdgeGeo.clone(), auxDashedMat);
        auxDashedLines.computeLineDistances();
        auxDashedLines.renderOrder = 3;
        auxDashedLines.userData.isGeometry = true;
        geoGroup.add(auxDashedLines);

        // PASS 4: Nét liền đường phụ khi KHÔNG bị che khuất (Vàng Neon sáng #ffcc00)
        const auxVisibleMat = new THREE.LineBasicMaterial({
          color: '#ffcc00',                // Vàng Neon nổi bật
          depthFunc: THREE.LessEqualDepth, // Không bị che
          depthWrite: false,
          transparent: true,
          opacity: 1.0,
        });
        const auxVisibleLines = new THREE.LineSegments(auxEdgeGeo, auxVisibleMat);
        auxVisibleLines.renderOrder = 4;
        auxVisibleLines.userData.isGeometry = true;
        geoGroup.add(auxVisibleLines);
      }
    }

    // ── PASS 5: Mặt phẳng thiết diện (Highlight Planes) ───────────────────
    if (data.highlight_planes && data.highlight_planes.length > 0) {
      data.highlight_planes.forEach((plane) => {
        const planeVerts: THREE.Vector3[] = [];
        plane.points.forEach((lbl) => {
          const idx = data.vertex_labels.indexOf(lbl);
          if (idx !== -1 && idx < verts.length) {
            planeVerts.push(verts[idx]);
          }
        });

        if (planeVerts.length >= 3) {
          const planePositions: number[] = [];
          for (let i = 1; i < planeVerts.length - 1; i++) {
            [planeVerts[0], planeVerts[i], planeVerts[i + 1]].forEach((p) => {
              planePositions.push(p.x, p.y, p.z);
            });
          }
          const planeGeo = new THREE.BufferGeometry();
          planeGeo.setAttribute('position', new THREE.Float32BufferAttribute(planePositions, 3));
          planeGeo.computeVertexNormals();

          const planeMesh = new THREE.Mesh(
            planeGeo,
            new THREE.MeshBasicMaterial({
              color: plane.color || '#a855f7',
              transparent: true,
              opacity: 0.55,
              side: THREE.DoubleSide,
              depthTest: false,
              depthWrite: false,
            })
          );
          planeMesh.renderOrder = 0.5;
          planeMesh.userData.isGeometry = true;
          geoGroup.add(planeMesh);

          // Lưới phát sáng tăng cường trực quan cho mặt phẳng thiết diện
          const planeWire = new THREE.Mesh(
            planeGeo,
            new THREE.MeshBasicMaterial({
              color: '#ffffff',
              wireframe: true,
              transparent: true,
              opacity: 0.35,
              side: THREE.DoubleSide,
              depthTest: false,
              depthWrite: false,
            })
          );
          planeWire.renderOrder = 0.6;
          planeWire.userData.isGeometry = true;
          geoGroup.add(planeWire);

          // Nhãn tên mặt phẳng (ví dụ: (AHO)) tại trọng tâm của đa giác
          if (plane.name) {
            const centroid = new THREE.Vector3();
            planeVerts.forEach((p) => centroid.add(p));
            centroid.divideScalar(planeVerts.length);

            const div = document.createElement('div');
            div.textContent = plane.name;
            div.style.cssText = `
              color: ${plane.color || '#a371f7'};
              font-size: 10px; font-weight: 900;
              font-family: 'Inter', sans-serif; pointer-events: none;
              background: rgba(13, 17, 23, 0.9);
              padding: 2px 6px;
              border-radius: 4px;
              border: 1px solid ${plane.color || '#a371f7'};
              box-shadow: 0 0 10px ${plane.color || '#a371f7'}60;
              transform: translate(-50%, -50%);
            `;
            const cssObj = new CSS2DObject(div);
            cssObj.position.copy(centroid);
            cssObj.userData.isGeometry = true;
            geoGroup.add(cssObj);
          }
        }
      });
    }

    // ── Vertex spheres + CSS2D labels ──────────────────────────────────────
    verts.forEach((v, idx) => {
      const label = data.vertex_labels[idx];
      const isAux = Boolean(label && data.auxiliary_labels?.includes(label));

      // Điểm chấm đỉnh: nếu là điểm phụ thì phát sáng màu vàng neon #ffcc00
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(isAux ? 0.026 : 0.02, 16, 16),
        new THREE.MeshStandardMaterial({ 
          color: isAux ? '#ffcc00' : '#ffffff',
          emissive: isAux ? '#ffcc00' : '#58a6ff',
          emissiveIntensity: isAux ? 1.6 : 1.0 
        })
      );
      sphere.position.copy(v);
      sphere.userData.isGeometry = true;
      geoGroup.add(sphere);

      if (label) {
        const div = document.createElement('div');
        div.textContent = label;
        div.style.cssText = `
          color: ${isAux ? '#ffcc00' : '#ffffff'};
          font-size: 10px; font-weight: 900;
          font-family: 'Inter', sans-serif; pointer-events: none;
          text-shadow: 0 1px 3px rgba(0,0,0,0.9);
          background: ${isAux ? 'rgba(38, 28, 0, 0.85)' : 'rgba(22,27,34,0.6)'};
          padding: 1px 4px;
          border-radius: 2px;
          border: 1px solid ${isAux ? 'rgba(255, 204, 0, 0.7)' : 'rgba(88,166,255,0.3)'};
          transform: translate(-50%, -50%);
        `;
        const cssObj = new CSS2DObject(div);
        // Kéo nhãn lại sát điểm hơn (offset cực nhỏ)
        cssObj.position.set(v.x + 0.04, v.y + 0.04, v.z + 0.06);
        cssObj.userData.isGeometry = true;
        geoGroup.add(cssObj);
      }
    });

    // ── Auto-fit camera (Góc nhìn SGK kinh điển ~35-40 độ bao quát toàn bộ khối) ─────
    const box = new THREE.Box3().setFromPoints(verts);
    const size = box.getSize(new THREE.Vector3()).length();
    const heightSpan = box.max.z - box.min.z;
    // Điểm ngắm của camera: Tâm thế giới (world space) vì geoGroup đã được căn giữa tại (0,0)
    const targetWorld = new THREE.Vector3(0, 0, heightSpan * 0.45);
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.target.copy(targetWorld);
      const cam = cameraRef.current;
      cam.position.set(
        size * 0.8,
        -size * 1.25,
        targetWorld.z + size * 0.75
      );
      cam.updateProjectionMatrix();
      controlsRef.current.update();
    }
  }, [data]);
}


// ─── Main Component ──────────────────────────────────────────────────────────

const GeometryGenerator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isOcrReading, setIsOcrReading] = useState(false);
  const [pasteToast, setPasteToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<GeometryData | null>(null);
  const [currentModelContext, setCurrentModelContext] = useState<ShapeContext | null>(null);
  const [baseLlmData, setBaseLlmData] = useState<any>(null);
  const [factSolverInfo, setFactSolverInfo] = useState<{
    appliedRule?: string;
    ruleId?: string;
    explanation?: string;
    sanityCheck?: any;
    needsReview?: boolean;
  } | null>(null);

  // Chat Q&A State (Giai đoạn 3)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Trạng thái Kéo thả di chuyển ô chat (Draggable)
  const [chatPos, setChatPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number; hasMoved: boolean }>({
    mouseX: 0,
    mouseY: 0,
    initialX: 0,
    initialY: 0,
    hasMoved: false,
  });

  const mountRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useThreeRenderer(mountRef, geoData);

  const setShapeData = useGeometryStore(state => state.setShapeData);
  const setSelectedShape = useGeometryStore(state => state.setSelectedShape);
  const clearDrawingPoints = useGeometryStore(state => state.clearDrawingPoints);

  // Xử lý kéo thả Ô Chat (Draggable Event Listeners)
  const handleDragStart = (clientX: number, clientY: number, target: HTMLElement) => {
    if (target.closest('button')) return;
    const el = chatContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const parentRect = el.parentElement?.getBoundingClientRect();
    if (!parentRect) return;

    const currentX = chatPos ? chatPos.x : (rect.left - parentRect.left);
    const currentY = chatPos ? chatPos.y : (rect.top - parentRect.top);

    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      initialX: currentX,
      initialY: currentY,
      hasMoved: false,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragStartRef.current.hasMoved = true;
      }

      const parent = chatContainerRef.current?.parentElement;
      const parentW = parent ? parent.clientWidth : window.innerWidth;
      const parentH = parent ? parent.clientHeight : window.innerHeight;
      const cardW = chatContainerRef.current ? chatContainerRef.current.clientWidth : 320;
      const cardH = chatContainerRef.current ? chatContainerRef.current.clientHeight : 460;

      let newX = dragStartRef.current.initialX + dx;
      let newY = dragStartRef.current.initialY + dy;

      newX = Math.max(10, Math.min(parentW - cardW - 10, newX));
      newY = Math.max(10, Math.min(parentH - cardH - 10, newY));

      setChatPos({ x: newX, y: newY });
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.mouseX;
      const dy = touch.clientY - dragStartRef.current.mouseY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragStartRef.current.hasMoved = true;
      }

      const parent = chatContainerRef.current?.parentElement;
      const parentW = parent ? parent.clientWidth : window.innerWidth;
      const parentH = parent ? parent.clientHeight : window.innerHeight;
      const cardW = chatContainerRef.current ? chatContainerRef.current.clientWidth : 320;
      const cardH = chatContainerRef.current ? chatContainerRef.current.clientHeight : 460;

      let newX = dragStartRef.current.initialX + dx;
      let newY = dragStartRef.current.initialY + dy;

      newX = Math.max(10, Math.min(parentW - cardW - 10, newX));
      newY = Math.max(10, Math.min(parentH - cardH - 10, newY));

      setChatPos({ x: newX, y: newY });
    };

    const onEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging]);

  // Tắt tính năng tự động cuộn theo yêu cầu (tham khảo cách làm giống NOVA AI)
  // useEffect(() => {
  //   if (chatScrollRef.current) {
  //     chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  //   }
  // }, [chatHistory, isChatLoading]);

  const handleClearAll = useCallback(() => {
    setGeoData(null);
    setCurrentModelContext(null);
    setBaseLlmData(null);
    setFactSolverInfo(null);
    setChatHistory([]);
    setChatInput('');
    setChatPos(null);
    setSelectedShape('none');
    setShapeData(null as any);
    clearDrawingPoints();
  }, [setGeoData, setSelectedShape, setShapeData, clearDrawingPoints]);

  const handleImageChange = useCallback(async (file: File | null) => {
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      setIsOcrReading(false);
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setIsOcrReading(true);

    try {
      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const resStr = reader.result as string;
          resolve(resStr.includes(',') ? resStr.split(',')[1] : resStr);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const mime = file.type || 'image/jpeg';
      const extracted = await extractWithDirectGeminiVision(base64Content, mime);
      if (extracted?.problemText) {
        setText(toNaturalVietnameseMathText(extracted.problemText));
        setPasteToast('Đã nhận diện đề bài từ ảnh!');
        setTimeout(() => setPasteToast(null), 3500);
      }
    } catch (ocrErr) {
      console.warn('[handleImageChange] Auto-OCR error:', ocrErr);
    } finally {
      setIsOcrReading(false);
    }
  }, []);

  // 📋 Lắng nghe sự kiện Paste (Ctrl + V) toàn màn hình khi người dùng chụp ảnh đề bài
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleImageChange(file);
            setPasteToast('Đã dán ảnh chụp màn hình (Ctrl+V) thành công!');
            setTimeout(() => setPasteToast(null), 3500);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [handleImageChange]);

  const handleGenerate = useCallback(async () => {
    if (!text.trim() && !imageFile) {
      setError('Vui lòng nhập đề bài hoặc tải lên / dán (Ctrl+V) ảnh đề bài.');
      return;
    }
    setIsLoading(true);
    setError(null);
    handleClearAll(); // Xoá sạch mọi thứ trước khi tạo mới

    try {
      // Đọc Base64 nếu có ảnh tải lên hoặc dán từ clipboard
      let imageBase64: string | null = null;
      let imageMimeType: string | null = null;
      if (imageFile) {
        try {
          imageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const resStr = reader.result as string;
              const base64Content = resStr.includes(',') ? resStr.split(',')[1] : resStr;
              resolve(base64Content);
            };
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
          });
          imageMimeType = imageFile.type || 'image/jpeg';
        } catch (readErr) {
          console.warn('[GeometryGenerator] Lỗi đọc Base64 ảnh:', readErr);
        }
      }

      // 🎯 TẦNG 1: GỌI SERVER API ROUTE TRÍCH XUẤT THAM SỐ TOÁN HỌC (Zero Client-Side API Keys)
      let llmData: any = null;
      try {
        const generateEndpoints = [
          'https://stem-hub-api-proxy.ai-stem-hub.workers.dev/api/lab-toan/generate-3d',
          '/api/lab-toan/generate-3d',
          API_ENDPOINTS.generate3D
        ];

      for (const endpoint of generateEndpoints) {
        try {
          const res = await fetchWithTimeout(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              problemText: text.trim() || '',
              imageBase64,
              imageMimeType
            })
          }, 60000);

          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            console.error(`[GeometryGenerator] Endpoint ${endpoint} returned non-JSON:`, contentType);
            continue;
          }

          if (res.ok) {
            const respData = await res.json();
            if (respData?.unsupported && respData?.debugError) {
              console.warn(`[GeometryGenerator] Endpoint ${endpoint} reported debugError:`, respData.debugError);
              continue;
            }
            llmData = respData;
            if (llmData?.originalProblemText && !text.trim()) {
              setText(toNaturalVietnameseMathText(llmData.originalProblemText));
            }
            break;
          } else {
            const errJson = await res.json().catch(() => ({}));
            if (errJson.unsupported) {
              if (errJson.debugError) continue;
              setError(errJson.message || 'Đề bài có dạng dữ kiện phức tạp, hệ thống hiện chưa tự động dựng hình chính xác — vui lòng thử diễn đạt lại đề bài với dữ kiện chiều cao trực tiếp, hoặc liên hệ để bổ sung công thức hỗ trợ.');
              return;
            }
          }
        } catch (callErr: any) {
          console.warn(`[GeometryGenerator] Endpoint ${endpoint} error:`, callErr?.message);
        }
      }
      } catch (serverErr: any) {
        console.warn('[GeometryGenerator] API route non-JSON hoặc Edge proxy limitation, kích hoạt Client-Side Resilient Fallback:', serverErr?.message);
        
        // 1. Nếu có ảnh (tải lên hoặc dán Ctrl+V): Ưu tiên gọi trực tiếp Gemini Vision Client Fallback
        if (imageBase64) {
          try {
            const directExtracted = await extractWithDirectGeminiVision(imageBase64, imageMimeType || 'image/jpeg');
            if (directExtracted && directExtracted.shapeType) {
              if (directExtracted.problemText) {
                setText(toNaturalVietnameseMathText(directExtracted.problemText));
              }
              const localSolved = solveGeometryFacts(directExtracted);
              if (localSolved.success) {
                llmData = {
                  success: true,
                  shapeType: localSolved.shapeType || directExtracted.shapeType,
                  shapeName: localSolved.shapeName || directExtracted.shapeName,
                  parameters: localSolved.parameters,
                  appliedRule: localSolved.appliedRule,
                  ruleId: localSolved.ruleId,
                  explanation: localSolved.explanation,
                  sanityCheck: localSolved.sanityCheck,
                  needsReview: localSolved.needsReview,
                  donVi: 'cm',
                  givenFacts: directExtracted.givenFacts || [],
                  originalProblemText: directExtracted.problemText || text.trim()
                };
              } else if (localSolved.unsupported) {
                setError(localSolved.message || 'Đề bài có dạng dữ kiện phức tạp, hệ thống hiện chưa tự động dựng hình chính xác — vui lòng thử diễn đạt lại đề bài với dữ kiện chiều cao trực tiếp, hoặc liên hệ để bổ sung công thức hỗ trợ.');
                return;
              }
            }
          } catch (visionErr: any) {
            console.error('[GeometryGenerator] Direct Gemini Vision fallback failed:', visionErr);
          }
        }

        // 2. Nếu chỉ có text hoặc fallback hình ảnh đã trích xuất được text
        if (!llmData && text.trim()) {
          try {
            const extracted = extractFallbackGeometry(text.trim());
            const solved = solveGeometryFacts(extracted);
            if (!solved.success && solved.unsupported) {
              setError(solved.message || 'Đề bài có dạng dữ kiện phức tạp, hệ thống hiện chưa tự động dựng hình chính xác — vui lòng thử diễn đạt lại đề bài với dữ kiện chiều cao trực tiếp, hoặc liên hệ để bổ sung công thức hỗ trợ.');
              return;
            }
            llmData = {
              success: solved.success,
              shapeType: solved.shapeType || extracted.shapeType,
              shapeName: solved.shapeName || extracted.shapeName,
              parameters: solved.parameters,
              appliedRule: solved.appliedRule,
              ruleId: solved.ruleId,
              explanation: solved.explanation,
              sanityCheck: solved.sanityCheck,
              needsReview: solved.needsReview,
              donVi: 'cm',
              givenFacts: extracted.givenFacts,
              originalProblemText: text.trim()
            };
          } catch (fbErr: any) {
            setError('Có lỗi kết nối hệ thống, vui lòng thử lại sau ít phút.');
            return;
          }
        }

        if (!llmData) {
          setError('Không thể nhận diện hình ảnh hoặc kết nối máy chủ AI. Vui lòng kiểm tra lại mạng hoặc nhập đề bài dạng chữ.');
          return;
        }
      }

      if (!llmData || !llmData.shapeType) {
        setError('Có lỗi kết nối hệ thống, vui lòng thử lại sau ít phút.');
        return;
      }

      // ⚠️ CƠ CHẾ TỪ CHỐI TRUNG THỰC KHI FACT SOLVER XÁC NHẬN CHƯA THUỘC PHẠM VI HỖ TRỢ
      if (llmData.unsupported || llmData.success === false) {
        setError(llmData.message || 'Đề bài có dạng dữ kiện phức tạp, hệ thống hiện chưa tự động dựng hình chính xác — vui lòng thử diễn đạt lại đề bài với dữ kiện chiều cao trực tiếp, hoặc liên hệ để bổ sung công thức hỗ trợ.');
        return;
      }

      // 🧠 TẦNG 2A: GIẢI HỆ DỮ KIỆN BẰNG FACT SOLVER NẾU CHƯA CÓ PARAMETERS
      if (!llmData.parameters || Object.keys(llmData.parameters).length === 0) {
        const localSolve = solveGeometryFacts(llmData);
        if (!localSolve.success && localSolve.unsupported) {
          setError(localSolve.message || 'Đề bài có dạng dữ kiện phức tạp, hệ thống hiện chưa tự động dựng hình chính xác — vui lòng thử diễn đạt lại đề bài với dữ kiện chiều cao trực tiếp, hoặc liên hệ để bổ sung công thức hỗ trợ.');
          return;
        }
        llmData = {
          ...llmData,
          parameters: localSolve.parameters,
          shapeType: localSolve.shapeType || llmData.shapeType,
          shapeName: localSolve.shapeName || llmData.shapeName,
          appliedRule: localSolve.appliedRule,
          ruleId: localSolve.ruleId,
          explanation: localSolve.explanation,
          sanityCheck: localSolve.sanityCheck,
          needsReview: localSolve.needsReview
        };
      }

      setFactSolverInfo({
        appliedRule: llmData.appliedRule,
        ruleId: llmData.ruleId,
        explanation: llmData.explanation,
        sanityCheck: llmData.sanityCheck,
        needsReview: llmData.needsReview
      });

      console.log('📥 [Tầng 1 - Fact Extracted Data]:', llmData);
      setBaseLlmData(llmData);

      // 🧠 TẦNG 2B: MODULE TÍNH TOÁN HÌNH HỌC TẤT ĐỊNH (Three.js Math Engine)
      const modelContext = calculateGeometry(llmData);
      console.log('📐 [Tầng 2 - Self-Built Math Calculations]:', modelContext);
      console.log('📊 [currentModelContext]:', modelContext);

      // Lưu toàn bộ ngữ cảnh vào state
      setCurrentModelContext(modelContext);

      // Nạp toạ độ chuẩn xác toán học vào Three.js Renderer
      setGeoData({
        analysis: `Đã phân tích đề bài & dựng mô hình: ${modelContext.shapeName}`,
        vertices: modelContext.vertices,
        faces: modelContext.faces,
        visible_edges: modelContext.edges,
        hidden_edges: [],
        auxiliary_edges: modelContext.auxiliary_edges || [],
        auxiliary_labels: modelContext.auxiliary_labels || [],
        highlight_planes: modelContext.highlight_planes || [],
        vertex_labels: modelContext.labels
      });

      // 💬 KHỞI TẠO LUỒNG HỎI - ĐÁP (Q&A) TƯƠNG TÁC (In từ từ từng từ giống NOVA AI)
      const initialWelcomeText = `Xin chào! Mình đã phân tích đề bài và dựng xong mô hình 3D tương tác: **${modelContext.shapeName}**.\n\nBạn có thể tự do dùng chuột xoay và phóng to để quan sát các góc độ không gian.\n\nBạn cần mình hỗ trợ gì tiếp theo? (Ví dụ: hướng dẫn phương pháp kẻ thêm đường phụ theo định lý chuẩn BGD, chứng minh quan hệ vuông góc, tính góc, khoảng cách, hay tính thể tích theo tham số đề bài?)`;

      const welcomeId = 'welcome_' + Date.now();
      setChatHistory([
        {
          id: welcomeId,
          role: 'ai',
          text: '',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsChatExpanded(true);

      // In từ từ từng từ (Word-by-word streaming ~14ms/từ)
      const welcomeWords = initialWelcomeText.split(' ');
      let curWelcome = '';
      for (let i = 0; i < welcomeWords.length; i++) {
        curWelcome += (i === 0 ? '' : ' ') + welcomeWords[i];
        const u = curWelcome;
        setChatHistory(prev => prev.map(m => m.id === welcomeId ? { ...m, text: u } : m));
        await new Promise(r => setTimeout(r, 14));
      }

    } catch (e: any) {
      console.error("Lỗi tạo mô hình 3D:", e);
      setError(`Lỗi: ${e.message || 'Không thể tạo mô hình hình học từ đề bài'}`);
    } finally {
      setIsLoading(false);
    }
  }, [text, imageFile, handleClearAll]);

  // Gửi câu hỏi Q&A tới API Route /api/lab-toan/chat-model (Giai đoạn 3)
  const handleSendChatMessage = useCallback(async (presetQuestion?: string) => {
    const questionToSend = (presetQuestion || chatInput).trim();
    if (!questionToSend || isChatLoading || !currentModelContext) return;

    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      role: 'user',
      text: questionToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    if (!presetQuestion) setChatInput('');
    setIsChatLoading(true);

    try {
      const activeContext: any = currentModelContext || {
        shapeType: 'hinh_khong_gian',
        shapeName: 'Mô hình 3D',
        parameters: {},
        calculations: {},
        vertices: geoData?.vertices || [],
        edges: geoData?.visible_edges || [],
        labels: geoData?.vertex_labels || [],
        originalProblemText: text,
        auxiliaryRequests: [],
      };

      let data: any = null;
      const chatEndpoints = Array.from(new Set([
        `${CLOUDFLARE_EDGE_PROXY_URL}/api/lab-toan/chat-model`,
        '/api/lab-toan/chat-model',
        API_ENDPOINTS.chatModel
      ])).filter(Boolean);

      for (const endpoint of chatEndpoints) {
        try {
          const res = await fetchWithTimeout(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: questionToSend,
              modelContext: activeContext
            })
          }, 60000);

          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            console.warn(`[GeometryGenerator] Chat endpoint ${endpoint} returned non-JSON:`, contentType);
            continue;
          }

          if (res.ok) {
            const resJson = await res.json();
            if (resJson && !resJson.error) {
              data = resJson;
              break;
            } else if (resJson?.error) {
              console.warn(`[GeometryGenerator] Chat endpoint ${endpoint} returned error:`, resJson.error);
            }
          } else {
            const errJson = await res.json().catch(() => ({}));
            console.warn(`[GeometryGenerator] Chat endpoint ${endpoint} returned status ${res.status}:`, errJson?.error);
          }
        } catch (epErr: any) {
          console.warn(`[GeometryGenerator] Chat endpoint ${endpoint} failed:`, epErr?.message);
        }
      }

      if (!data) {
        console.warn('[GeometryGenerator] Primary chat endpoints failed, activating client fallback...');
        try {
          data = await callDirectGeminiChatModel(questionToSend, activeContext);
        } catch (directErr: any) {
          console.error('Direct chat-model failed too:', directErr?.message);
          setChatHistory(prev => [...prev, {
            id: 'ai_' + Date.now(),
            role: 'ai' as const,
            text: 'Có lỗi kết nối hệ thống, vui lòng thử lại sau ít phút.',
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          }]);
          setIsChatLoading(false);
          return;
        }
      }

      // Trích xuất toàn bộ actions (hỗ trợ mảng actions hoặc nhúng trong text) và làm sạch text hiển thị
      const parsedOutput = parseChatModelOutput(data?.answer || '');
      const rawActions = Array.isArray(data?.actions)
        ? data.actions
        : (data?.action ? [data.action] : []);
      const allActions = [...rawActions, ...parsedOutput.actions];
      const cleanAnswerText = parsedOutput.answer || data?.answer || 'Đã phân tích thông tin mô hình.';

      // Heuristic Safety Net cho tô màu thiết diện nếu chưa có action
      if (allActions.length === 0) {
        const planeMatch = questionToSend.match(/(?:tô màu|hiển thị|mặt phẳng|thiết diện)\s*(?:mặt phẳng|thiết diện)?\s*\(?([A-Za-z]{3,4})\)?/i);
        if (planeMatch) {
          const rawPoints = planeMatch[1].toUpperCase();
          allActions.push({
            type: 'highlight_plane',
            points: rawPoints.split(''),
            color: '#a371f7',
            name: `(${rawPoints})`
          });
        }
      }

      // ⚡ HIỆU ỨNG GÕ CHỮ TỪ TỪ GIỐNG NOVA AI (Word-by-Word Streaming Effect ~16ms/từ, không tự động cuộn)
      const botMsgId = 'ai_' + Date.now();
      const initialBotMsg: ChatMessage = {
        id: botMsgId,
        role: 'ai',
        text: '',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, initialBotMsg]);

      const tokens = splitForStreaming(cleanAnswerText);
      let currentStreamText = '';
      const delay = Math.max(12, Math.min(22, Math.floor(1600 / Math.max(1, tokens.length))));

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token === '\n') {
          currentStreamText += '\n';
        } else if (i === 0 || currentStreamText.endsWith('\n')) {
          currentStreamText += token;
        } else {
          currentStreamText += ' ' + token;
        }
        const updatedText = currentStreamText;
        setChatHistory(prev => prev.map(m => m.id === botMsgId ? { ...m, text: updatedText } : m));
        await new Promise(r => setTimeout(r, delay));
      }

      // 🚀 GIAI ĐOẠN 6: AGENTIC AI - TRIGGER VẼ LẠI NẾU CÓ ACTIONS KẺ ĐƯỜNG PHỤ
      if (allActions.length > 0) {
        console.log('🤖 [Agentic AI Actions Triggered]:', allActions);
        const sourceData = baseLlmData || {
          shapeType: activeContext.shapeType,
          shapeName: activeContext.shapeName,
          parameters: activeContext.parameters || {},
          auxiliaryRequests: activeContext.auxiliaryRequests || [],
          donVi: activeContext.calculations?.donVi || 'cm',
          originalProblemText: activeContext.originalProblemText || text
        };

        const currentAux = Array.isArray(sourceData.auxiliaryRequests)
          ? [...sourceData.auxiliaryRequests]
          : [];

        const updatedAux = [...currentAux, ...allActions];
        const updatedLlmData = {
          ...sourceData,
          auxiliaryRequests: updatedAux
        };

        setBaseLlmData(updatedLlmData);

        // 🧠 TẦNG 2: Tự động tính toán lại toạ độ hình học (Deterministic Calculations)
        const updatedModelContext = calculateGeometry(updatedLlmData);
        console.log('📐 [Tầng 2 - Re-calculated Geometry with Agentic Actions]:', updatedModelContext);

        setCurrentModelContext(updatedModelContext);
        setGeoData({
          analysis: `Đã cập nhật mô hình & kẻ thêm đường phụ: ${updatedModelContext.shapeName}`,
          vertices: updatedModelContext.vertices,
          faces: updatedModelContext.faces,
          visible_edges: updatedModelContext.edges,
          hidden_edges: [],
          auxiliary_edges: updatedModelContext.auxiliary_edges || [],
          auxiliary_labels: updatedModelContext.auxiliary_labels || [],
          highlight_planes: updatedModelContext.highlight_planes || [],
          vertex_labels: updatedModelContext.labels
        });
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'ai_err_' + Date.now(),
        role: 'ai',
        text: `⚠️ Không thể phản hồi: ${err.message || 'Lỗi kết nối tới AI'}`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, isChatLoading, currentModelContext, baseLlmData, geoData, text]);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 4000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        width: '92vw', maxWidth: 1200, height: '90vh',
        background: 'rgba(13,17,23,0.97)',
        border: '1px solid rgba(88,166,255,0.2)',
        borderRadius: 18, boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        display: 'grid', gridTemplateColumns: '360px minmax(0, 1fr)',
        overflow: 'hidden',
      }}>

        {/* ── Left: Input Panel ─────────────────────────────────────── */}
        <div style={{
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '1.2rem 1.4rem', borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(31,111,235,0.12), rgba(163,113,247,0.08))',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'linear-gradient(135deg,#1f6feb,#a371f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Wand2 size={17} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#f0f6fc', fontSize: '0.95rem' }}>
                  AI Vẽ Hình 3D
                </div>
                <div style={{ fontSize: '0.65rem', color: '#a371f7' }}>
                  Nhập đề bài · Upload ảnh · Gemini sinh hình
                </div>
              </div>
            </div>
            <button onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', padding: 4 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f0f6fc')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

            {/* Textarea */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#c9d1d9', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={14} color="#588bfd" /> Nhập đề bài
                </label>
                {isOcrReading && (
                  <span style={{ fontSize: '0.72rem', color: '#a371f7', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                    <Loader2 size={12} className="animate-spin" /> Đang đọc đề từ ảnh...
                  </span>
                )}
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={
                  'Ví dụ:\n"Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh 4cm, SA vuông góc với mặt đáy và SA = 5cm. Vẽ hình."'
                }
                rows={7}
                style={{
                  width: '100%', resize: 'none',
                  background: 'rgba(0,0,0,0.35)', color: '#e6edf3',
                  border: '1px solid #30363d', borderRadius: 10,
                  padding: '0.75rem', fontSize: '0.84rem', lineHeight: 1.6,
                  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = '#388bfd')}
                onBlur={e => (e.target.style.borderColor = '#30363d')}
              />
            </div>

            {/* Image Upload */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#c9d1d9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ImagePlus size={14} color="#a371f7" /> Hoặc upload ảnh đề bài
                </span>
                <span style={{ fontSize: '0.7rem', color: '#a371f7', background: 'rgba(163,113,247,0.12)', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(163,113,247,0.25)' }}>
                  Hỗ trợ Ctrl + V
                </span>
              </label>

              {pasteToast && (
                <div style={{
                  marginBottom: '0.6rem', padding: '0.5rem 0.75rem', borderRadius: 8,
                  background: 'rgba(63,185,80,0.15)', border: '1px solid rgba(63,185,80,0.4)',
                  color: '#3fb950', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                  animation: 'fadeIn 0.2s ease-in-out'
                }}>
                  <CheckCircle2 size={15} />
                  <span>{pasteToast}</span>
                </div>
              )}

              {imagePreview ? (
                <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(163,113,247,0.4)' }}>
                  <img src={imagePreview} alt="preview" style={{ width: '100%', maxHeight: 160, objectFit: 'contain', display: 'block', background: '#000' }} />
                  <button
                    onClick={() => handleImageChange(null)}
                    style={{
                      position: 'absolute', top: 6, right: 6,
                      background: 'rgba(0,0,0,0.7)', border: 'none', color: '#f85149',
                      borderRadius: '50%', width: 26, height: 26, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="Xóa ảnh"
                  >
                    <X size={14} />
                  </button>
                  {isOcrReading && (
                    <div style={{
                      position: 'absolute', bottom: 28, left: 0, right: 0,
                      background: 'rgba(13, 17, 23, 0.9)',
                      backdropFilter: 'blur(4px)',
                      padding: '0.45rem 0.6rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                      color: '#58a6ff', fontSize: '0.74rem', fontWeight: 600,
                      borderTop: '1px solid rgba(88, 166, 255, 0.3)'
                    }}>
                      <Loader2 size={13} className="animate-spin" />
                      <span>AI đang nhận diện đề bài từ ảnh...</span>
                    </div>
                  )}
                  <div style={{ padding: '0.4rem 0.7rem', fontSize: '0.72rem', color: '#8b949e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{imageFile?.name || 'Ảnh chụp màn hình clipboard'}</span>
                    <span style={{ fontSize: '0.68rem', color: '#a371f7' }}>Bấm Ctrl+V để thay ảnh</span>
                  </div>
                </div>
              ) : (
                <div
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); }}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleImageChange(f); }}
                  onPaste={e => {
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.startsWith('image/')) {
                        const f = items[i].getAsFile();
                        if (f) {
                          e.preventDefault();
                          e.stopPropagation();
                          handleImageChange(f);
                          setPasteToast('Đã dán ảnh chụp màn hình (Ctrl+V) thành công!');
                          setTimeout(() => setPasteToast(null), 3500);
                          return;
                        }
                      }
                    }
                  }}
                  style={{
                    border: '1.5px dashed rgba(163,113,247,0.5)', borderRadius: 10,
                    padding: '1.3rem 1rem', textAlign: 'center', cursor: 'pointer',
                    color: '#8b949e', fontSize: '0.82rem', lineHeight: 1.6,
                    transition: 'border-color 0.2s, background 0.2s',
                    outline: 'none'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#a371f7'; e.currentTarget.style.background = 'rgba(163,113,247,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(163,113,247,0.5)'; e.currentTarget.style.background = 'transparent'; }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#a371f7'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(163,113,247,0.2)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(163,113,247,0.5)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: 'rgba(163,113,247,0.1)', marginBottom: '0.4rem' }}>
                    <Upload size={18} color="#a371f7" />
                  </div>
                  <br />
                  <span style={{ color: '#e6edf3', fontWeight: 500 }}>Kéo thả ảnh hoặc nhấn <kbd style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 4, padding: '1px 5px', fontSize: '0.72rem', color: '#a371f7', fontWeight: 600 }}>Ctrl + V</kbd> dán ảnh chụp</span><br />
                  <span style={{ fontSize: '0.74rem', color: '#8b949e' }}>hoặc click để chọn file (jpg, png, webp)</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleImageChange(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '0.7rem 0.9rem', borderRadius: 10, fontSize: '0.82rem',
                background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)',
                color: '#f85149', display: 'flex', gap: '0.5rem',
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Tips */}
            <div style={{
              padding: '0.75rem', borderRadius: 10, background: 'rgba(88,166,255,0.06)',
              border: '1px solid rgba(88,166,255,0.15)', fontSize: '0.76rem', color: '#8b949e', lineHeight: 1.7,
            }}>
              <span style={{ color: '#58a6ff', fontWeight: 600 }}>💡 Mẹo:</span> Mô tả đầy đủ loại hình (chóp, lăng trụ...), kích thước và điều kiện đặc biệt (vuông góc, cân, đều...) để AI vẽ chính xác hơn.
            </div>

            {/* Analysis & Calculations Panel (Tầng 2) */}
            {currentModelContext && (
              <div style={{
                marginTop: '0.5rem', padding: '1rem', borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(31, 111, 235, 0.12), rgba(163, 113, 247, 0.12))',
                border: '1px solid rgba(88, 166, 255, 0.35)',
                display: 'flex', flexDirection: 'column', gap: '0.6rem'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#58a6ff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Eye size={15} /> THÔNG SỐ HÌNH HỌC (TÍNH TOÁN TẤT ĐỊNH - TẦNG 2):
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f0f6fc' }}>
                  {currentModelContext.shapeName}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.78rem' }}>
                  {currentModelContext.calculations.theTich !== undefined && (
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.45rem 0.65rem', borderRadius: 8, border: '1px solid rgba(63,185,80,0.3)' }}>
                      <div style={{ color: '#8b949e', fontSize: '0.68rem' }}>Thể tích (V)</div>
                      <div style={{ color: '#3fb950', fontWeight: 700, fontSize: '0.92rem' }}>
                        {currentModelContext.calculations.theTich} <span style={{ fontSize: '0.7rem' }}>{currentModelContext.calculations.donVi}³</span>
                      </div>
                    </div>
                  )}
                  {currentModelContext.calculations.dienTichDay !== undefined && (
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.45rem 0.65rem', borderRadius: 8, border: '1px solid rgba(121,192,255,0.3)' }}>
                      <div style={{ color: '#8b949e', fontSize: '0.68rem' }}>Diện tích đáy (S_đáy)</div>
                      <div style={{ color: '#79c0ff', fontWeight: 700, fontSize: '0.92rem' }}>
                        {currentModelContext.calculations.dienTichDay} <span style={{ fontSize: '0.7rem' }}>{currentModelContext.calculations.donVi}²</span>
                      </div>
                    </div>
                  )}
                  {currentModelContext.calculations.dienTichXungQuanh !== undefined && (
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.45rem 0.65rem', borderRadius: 8, border: '1px solid rgba(210,168,255,0.3)' }}>
                      <div style={{ color: '#8b949e', fontSize: '0.68rem' }}>Diện tích xung quanh</div>
                      <div style={{ color: '#d2a8ff', fontWeight: 700, fontSize: '0.92rem' }}>
                        {currentModelContext.calculations.dienTichXungQuanh} <span style={{ fontSize: '0.7rem' }}>{currentModelContext.calculations.donVi}²</span>
                      </div>
                    </div>
                  )}
                  {currentModelContext.calculations.dienTichToanPhan !== undefined && (
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.45rem 0.65rem', borderRadius: 8, border: '1px solid rgba(240,136,62,0.3)' }}>
                      <div style={{ color: '#8b949e', fontSize: '0.68rem' }}>Diện tích toàn phần</div>
                      <div style={{ color: '#f0883e', fontWeight: 700, fontSize: '0.92rem' }}>
                        {currentModelContext.calculations.dienTichToanPhan} <span style={{ fontSize: '0.7rem' }}>{currentModelContext.calculations.donVi}²</span>
                      </div>
                    </div>
                  )}
                  {currentModelContext.calculations.trungDoan !== undefined && (
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.45rem 0.65rem', borderRadius: 8, border: '1px solid rgba(255,166,87,0.3)' }}>
                      <div style={{ color: '#8b949e', fontSize: '0.68rem' }}>Trung đoạn (d)</div>
                      <div style={{ color: '#ffa657', fontWeight: 700, fontSize: '0.92rem' }}>
                        {currentModelContext.calculations.trungDoan} <span style={{ fontSize: '0.7rem' }}>{currentModelContext.calculations.donVi}</span>
                      </div>
                    </div>
                  )}
                  {currentModelContext.calculations.canhBen !== undefined && (
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.45rem 0.65rem', borderRadius: 8, border: '1px solid rgba(88,166,255,0.3)' }}>
                      <div style={{ color: '#8b949e', fontSize: '0.68rem' }}>Cạnh bên (l)</div>
                      <div style={{ color: '#58a6ff', fontWeight: 700, fontSize: '0.92rem' }}>
                        {currentModelContext.calculations.canhBen} <span style={{ fontSize: '0.7rem' }}>{currentModelContext.calculations.donVi}</span>
                      </div>
                    </div>
                  )}
                  {currentModelContext.calculations.duongSinh !== undefined && (
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.45rem 0.65rem', borderRadius: 8, border: '1px solid rgba(255,123,114,0.3)' }}>
                      <div style={{ color: '#8b949e', fontSize: '0.68rem' }}>Đường sinh (l)</div>
                      <div style={{ color: '#ff7b72', fontWeight: 700, fontSize: '0.92rem' }}>
                        {currentModelContext.calculations.duongSinh} <span style={{ fontSize: '0.7rem' }}>{currentModelContext.calculations.donVi}</span>
                      </div>
                    </div>
                  )}
                  {currentModelContext.calculations.duongCheo !== undefined && (
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.45rem 0.65rem', borderRadius: 8, border: '1px solid rgba(210,168,255,0.3)' }}>
                      <div style={{ color: '#8b949e', fontSize: '0.68rem' }}>Đường chéo (d)</div>
                      <div style={{ color: '#d2a8ff', fontWeight: 700, fontSize: '0.92rem' }}>
                        {currentModelContext.calculations.duongCheo} <span style={{ fontSize: '0.7rem' }}>{currentModelContext.calculations.donVi}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fact Solver & Sanity Check Card */}
            {factSolverInfo && (
              <div style={{
                marginTop: '0.6rem', padding: '0.85rem 1rem', borderRadius: 12,
                background: factSolverInfo.needsReview
                  ? 'rgba(210, 153, 34, 0.12)'
                  : 'linear-gradient(135deg, rgba(35, 134, 54, 0.15), rgba(56, 139, 253, 0.12))',
                border: factSolverInfo.needsReview
                  ? '1px solid rgba(210, 153, 34, 0.4)'
                  : '1px solid rgba(63, 185, 80, 0.35)',
                display: 'flex', flexDirection: 'column', gap: '0.5rem'
              }}>
                <div style={{
                  fontSize: '0.76rem', fontWeight: 700,
                  color: factSolverInfo.needsReview ? '#d29922' : '#3fb950',
                  display: 'flex', alignItems: 'center', gap: '0.4rem'
                }}>
                  {factSolverInfo.needsReview ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
                  BỘ GIẢI HỆ DỮ KIỆN (FACT SOLVER TẤT ĐỊNH):
                </div>
                {factSolverInfo.appliedRule && (
                  <div style={{ fontSize: '0.8rem', color: '#e6edf3', fontWeight: 600 }}>
                    Quy tắc: <span style={{ color: '#58a6ff' }}>{factSolverInfo.appliedRule}</span>
                  </div>
                )}
                {factSolverInfo.explanation && (
                  <div style={{ fontSize: '0.74rem', color: '#8b949e', lineHeight: 1.5, background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.6rem', borderRadius: 6 }}>
                    {factSolverInfo.explanation}
                  </div>
                )}
                {factSolverInfo.sanityCheck && (
                  <div style={{
                    marginTop: '0.2rem', padding: '0.4rem 0.6rem', borderRadius: 6,
                    background: factSolverInfo.sanityCheck.passed ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.15)',
                    border: factSolverInfo.sanityCheck.passed ? '1px solid rgba(63,185,80,0.25)' : '1px solid rgba(248,81,73,0.4)',
                    fontSize: '0.72rem',
                    color: factSolverInfo.sanityCheck.passed ? '#3fb950' : '#f85149'
                  }}>
                    {factSolverInfo.sanityCheck.passed ? (
                      <div>✅ <b>Sanity Check:</b> Khớp 100% dữ kiện đề bài (Độ lệch Δ = {factSolverInfo.sanityCheck.maxDiscrepancy})</div>
                    ) : (
                      <div>⚠️ <b>Cần xem lại:</b> Dữ liệu có độ lệch toán học Δ = {factSolverInfo.sanityCheck.maxDiscrepancy}. Vui lòng đối chiếu lại đề bài.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div style={{ padding: '1rem 1.2rem', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
            <button
              onClick={handleGenerate}
              disabled={isLoading || (!text.trim() && !imageFile)}
              style={{
                width: '100%', padding: '0.8rem',
                background: (isLoading || (!text.trim() && !imageFile))
                  ? '#21262d'
                  : 'linear-gradient(135deg, #1f6feb, #a371f7)',
                color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700,
                fontSize: '0.9rem', cursor: isLoading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                boxShadow: '0 4px 16px rgba(31,111,235,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {isLoading
                ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Gemini đang phân tích...</>
                : <><Wand2 size={18} /> ✨ Tạo Hình 3D</>
              }
            </button>
          </div>
        </div>

        {/* ── Right: Three.js Canvas ───────────────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          background: '#0d1117',
          overflow: 'hidden',
          width: '100%',
          height: '100%',
          minWidth: 0,
          minHeight: 0,
        }}>
          {/* Canvas mount */}
          <div ref={mountRef} style={{ width: '100%', height: '100%', minWidth: 0, minHeight: 0, position: 'relative', overflow: 'hidden' }} />

          {/* Empty state overlay */}
          {!geoData && !isLoading && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: '#30363d', pointerEvents: 'none',
              padding: '1.5rem', textAlign: 'center',
            }}>
              <Eye size={52} strokeWidth={1} style={{ marginBottom: '1rem' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Chưa có hình nào</div>
              <div style={{ fontSize: '0.78rem', marginTop: '0.4rem' }}>Nhập đề bài bên trái và bấm "Tạo Hình 3D"</div>
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(13,17,23,0.8)', backdropFilter: 'blur(6px)',
              zIndex: 30, pointerEvents: 'auto',
              padding: '1.5rem', textAlign: 'center',
            }}>
              <div style={{
                width: 54, height: 54, borderRadius: '50%',
                border: '3px solid rgba(88,166,255,0.2)', borderTopColor: '#58a6ff',
                animation: 'spin 0.9s linear infinite', marginBottom: '1rem',
              }} />
              <div style={{ fontSize: '0.92rem', color: '#e6edf3', fontWeight: 600 }}>
                Gemini đang tính toán toạ độ & dựng hình 3D...
              </div>
              <div style={{ fontSize: '0.75rem', color: '#8b949e', marginTop: '0.35rem' }}>
                Hệ thống đang giải toán vector và dựng toạ độ chuẩn xác
              </div>
            </div>
          )}

          {/* Canvas controls hint & Legend */}
          {geoData && (
            <>
              {factSolverInfo?.needsReview && (
                <div style={{
                  position: 'absolute', top: '0.8rem', right: '0.8rem',
                  background: 'rgba(210, 153, 34, 0.95)', backdropFilter: 'blur(8px)',
                  color: '#ffffff', padding: '0.45rem 0.9rem', borderRadius: 8,
                  fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)', zIndex: 15
                }}>
                  <AlertTriangle size={15} />
                  <span>⚠️ Cần xem lại: Đề bài có độ lệch toán học (Δ = {factSolverInfo.sanityCheck?.maxDiscrepancy})</span>
                </div>
              )}

              <div style={{
                position: 'absolute', top: '0.8rem', left: '0.8rem',
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                borderRadius: 8, padding: '0.4rem 0.8rem',
                fontSize: '0.7rem', color: '#8b949e',
                border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', gap: '0.8rem', alignItems: 'center',
                zIndex: 10, pointerEvents: 'none',
              }}>
                <span>🖱 Xoay: Chuột trái</span>
                <span>📦 Di: Chuột phải</span>
                <span>🔍 Zoom: Cuộn</span>
              </div>

              {/* Legend */}
              <div style={{
                position: 'absolute', bottom: '1.5rem', left: '1.5rem',
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                borderRadius: 8, padding: '0.5rem 0.9rem',
                fontSize: '0.72rem', color: '#c9d1d9',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', flexDirection: 'column', gap: '0.3rem',
                zIndex: 10, pointerEvents: 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 24, height: 2, background: '#e6edf3' }} />
                  Nét liền (visible edge)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 24, height: 0, borderTop: '2px dashed #8b949e' }} />
                  Nét đứt (hidden edge)
                </div>
                {geoData.auxiliary_edges && geoData.auxiliary_edges.length > 0 && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffcc00' }}>
                      <div style={{ width: 24, height: 2, background: '#ffcc00' }} />
                      Nét liền vàng (visible aux)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706' }}>
                      <div style={{ width: 24, height: 0, borderTop: '2px dashed #d97706' }} />
                      Nét đứt vàng (hidden aux)
                    </div>
                  </>
                )}
                {geoData.highlight_planes && geoData.highlight_planes.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc' }}>
                    <div style={{ width: 24, height: 10, background: 'rgba(168,85,247,0.6)', border: '1px solid #c084fc', borderRadius: 2 }} />
                    Mặt phẳng thiết diện
                  </div>
                )}
              </div>

              {/* Regenerate */}
              <button
                onClick={handleClearAll}
                style={{
                  position: 'absolute', top: '0.8rem', right: '0.8rem',
                  background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#8b949e', borderRadius: 8, padding: '0.4rem 0.7rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem',
                  backdropFilter: 'blur(4px)', zIndex: 10, pointerEvents: 'auto',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f0f6fc')}
                onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}
              >
                <RefreshCw size={13} /> Xoá canvas
              </button>
            </>
          )}

          {/* ── Q&A Chat Widget Grounded Trên Dữ Liệu Tầng 2 ── */}
          {(currentModelContext || geoData) && (
            <div
              ref={chatContainerRef}
              onMouseDown={e => e.stopPropagation()}
              onWheel={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
              style={{
                position: 'absolute',
                ...(chatPos
                  ? { top: `${chatPos.y}px`, left: `${chatPos.x}px` }
                  : { bottom: '1.5rem', right: '1.5rem' }),
                zIndex: 9999,
                width: 'min(380px, calc(100vw - 2rem))',
                maxHeight: 'calc(100% - 3rem)',
                height: isChatExpanded ? '460px' : 'auto',
                pointerEvents: 'auto',
                background: 'rgba(13, 17, 23, 0.94)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: isDragging ? '1.5px solid #a371f7' : '1px solid #58a6ff',
                borderRadius: 14,
                boxShadow: isDragging
                  ? '0 20px 60px rgba(0,0,0,0.95), 0 0 25px rgba(163,113,247,0.45)'
                  : '0 16px 48px rgba(0,0,0,0.85), 0 0 20px rgba(88,166,255,0.25)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: isDragging ? 'none' : 'box-shadow 0.2s, border 0.2s',
                userSelect: isDragging ? 'none' : 'auto',
              }}
            >
              {/* Header (Draggable Handle) */}
              <div
                onMouseDown={e => handleDragStart(e.clientX, e.clientY, e.target as HTMLElement)}
                onTouchStart={e => {
                  if (e.touches[0]) handleDragStart(e.touches[0].clientX, e.touches[0].clientY, e.target as HTMLElement);
                }}
                onClick={() => {
                  if (!dragStartRef.current.hasMoved) {
                    setIsChatExpanded(prev => !prev);
                  }
                }}
                title="Giữ chuột và kéo để di chuyển ô chat"
                style={{
                  padding: '0.65rem 0.9rem',
                  background: isDragging
                    ? 'linear-gradient(90deg, rgba(163, 113, 247, 0.35), rgba(31, 111, 235, 0.35))'
                    : 'linear-gradient(90deg, rgba(31, 111, 235, 0.25), rgba(163, 113, 247, 0.2))',
                  borderBottom: isChatExpanded ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 8,
                    background: 'linear-gradient(135deg, #1f6feb, #a371f7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 10px rgba(88,166,255,0.4)',
                  }}>
                    <Bot size={15} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f0f6fc', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>Hỏi - Đáp Hình 3D</span>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#3fb950', boxShadow: '0 0 6px #3fb950',
                      }} />
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#8b949e', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 150 }}>
                      {currentModelContext?.shapeName || 'Mô hình 3D'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <GripHorizontal size={16} style={{ color: '#8b949e', opacity: 0.6, cursor: isDragging ? 'grabbing' : 'grab' }} />
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsChatExpanded(prev => !prev); }}
                    title={isChatExpanded ? 'Thu gọn' : 'Mở rộng'}
                    style={{
                      background: 'transparent', border: 'none', color: '#8b949e',
                      cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center',
                    }}
                  >
                    {isChatExpanded ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
                  </button>
                </div>
              </div>

              {/* Body (when expanded) */}
              {isChatExpanded && (
                <>
                  {/* Chat Messages */}
                  <div
                    ref={chatScrollRef}
                    style={{
                      flex: '1 1 0px',
                      minHeight: 0,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      padding: '0.75rem 0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.7rem',
                      fontSize: '0.78rem',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {chatHistory.map(msg => (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                          width: '100%',
                        }}
                      >
                        <div style={{
                          maxWidth: '94%',
                          minWidth: '50px',
                          boxSizing: 'border-box',
                          padding: '0.65rem 0.85rem',
                          borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          background: msg.role === 'user'
                            ? 'linear-gradient(135deg, rgba(31, 111, 235, 0.45), rgba(163, 113, 247, 0.45))'
                            : 'rgba(22, 27, 34, 0.92)',
                          border: msg.role === 'user'
                            ? '1px solid rgba(163, 113, 247, 0.4)'
                            : '1px solid rgba(88, 166, 255, 0.25)',
                          color: '#e6edf3',
                          lineHeight: 1.55,
                          overflowWrap: 'anywhere',
                          wordBreak: 'break-word',
                          overflowX: 'hidden',
                        }}>
                          {msg.role === 'ai' ? (
                            <div
                              className="chat-math-content"
                              dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text || (msg as any).content || '') }}
                              style={{
                                fontSize: '0.8rem',
                                lineHeight: 1.6,
                                maxWidth: '100%',
                                overflowWrap: 'anywhere',
                                wordBreak: 'break-word',
                              }}
                            />
                          ) : (
                            <div style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                              {msg.text || (msg as any).content || ''}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#6e7681', marginTop: 2, padding: '0 4px' }}>
                          {msg.timestamp}
                        </div>
                      </div>
                    ))}

                    {isChatLoading && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#58a6ff', fontSize: '0.72rem', padding: '0.3rem 0.5rem' }}>
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>AI đang phân tích số liệu mô hình...</span>
                      </div>
                    )}
                  </div>

                  {/* Quick suggestion chips */}
                  <div style={{
                    padding: '0.35rem 0.7rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    gap: '0.4rem',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                  }}>
                    {[
                      '📐 Hướng dẫn kẻ đường phụ chuẩn BGD',
                      '🔍 Chứng minh theo định lý SGK',
                      '📊 Tính thể tích khối hình',
                      '📏 Tính khoảng cách',
                      '🎨 Tô màu mặt phẳng thiết diện'
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        disabled={isChatLoading}
                        onClick={() => handleSendChatMessage(chip)}
                        style={{
                          background: 'rgba(88, 166, 255, 0.1)',
                          border: '1px solid rgba(88, 166, 255, 0.25)',
                          borderRadius: 12,
                          padding: '0.22rem 0.55rem',
                          color: '#79c0ff',
                          fontSize: '0.68rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          transition: 'all 0.15s',
                          flexShrink: 0,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(88, 166, 255, 0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(88, 166, 255, 0.1)'; }}
                      >
                        <Sparkles size={11} color="#a371f7" /> {chip}
                      </button>
                    ))}
                  </div>

                  {/* Input field */}
                  <div style={{
                    padding: '0.6rem 0.7rem',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    gap: '0.4rem',
                    alignItems: 'center',
                    background: 'rgba(0,0,0,0.3)',
                  }}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendChatMessage();
                        }
                      }}
                      placeholder="Hỏi về thể tích, diện tích, cạnh..."
                      disabled={isChatLoading}
                      style={{
                        flex: 1,
                        background: 'rgba(22, 27, 34, 0.8)',
                        border: '1px solid #30363d',
                        borderRadius: 8,
                        padding: '0.45rem 0.65rem',
                        color: '#f0f6fc',
                        fontSize: '0.78rem',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => handleSendChatMessage()}
                      disabled={isChatLoading || !chatInput.trim()}
                      style={{
                        background: (isChatLoading || !chatInput.trim())
                          ? '#21262d'
                          : 'linear-gradient(135deg, #1f6feb, #a371f7)',
                        border: 'none',
                        borderRadius: 8,
                        padding: '0.48rem 0.7rem',
                        color: '#ffffff',
                        cursor: (isChatLoading || !chatInput.trim()) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(31,111,235,0.3)',
                      }}
                    >
                      <Send size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default GeometryGenerator;

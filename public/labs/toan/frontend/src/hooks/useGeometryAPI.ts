import { useEffect } from 'react';
import api from '../api/axios';
import { useGeometryStore } from '../store/useGeometryStore';
import { calculateGeometry } from '../utils/geometryCalculator';
import { calculateLocalCrossSection } from '../utils/crossSectionEngine';

export const useGeometryAPI = () => {
  const { 
    selectedShape, 
    shapeParams, 
    setShapeData, 
    setLoading, 
    setError,
    setCrossSection,
    setComputingSection
  } = useGeometryStore();

  // Fetch shape data whenever selectedShape or shapeParams change
  useEffect(() => {
    const fetchShape = async () => {
      if (selectedShape === 'none') {
        setShapeData(null as any);
        return;
      }
      if (selectedShape === 'custom') return;
      setLoading(true);
      setError(null);

      // 1. Ưu tiên tính toán hình học cục bộ bằng Self-Built Geometry Engine (Zero Latency, Offline, Không lỗi mạng)
      try {
        const rawParams = (shapeParams || {}) as any;
        const params = {
          canhDay: rawParams.base_size || rawParams.canhDay || rawParams.width || rawParams.radius || 4,
          chieuDai: rawParams.width || rawParams.base_size || rawParams.canhDay || 4,
          chieuRong: rawParams.depth || rawParams.base_size || rawParams.canhDay || 4,
          chieuCao: rawParams.height || rawParams.chieuCao || 5,
          banKinh: rawParams.radius || rawParams.base_radius || 3,
          ...rawParams
        };
        const localData = calculateGeometry({
          shapeType: selectedShape,
          shapeName: '',
          parameters: params
        });
        if (localData && localData.vertices && localData.vertices.length > 0) {
          setShapeData(localData as any);
          setLoading(false);
          return;
        }
      } catch (calcErr) {
        console.warn('Local geometry calculation warning, attempting remote backend:', calcErr);
      }

      // 2. Chỉ gửi request API nếu có cấu hình VITE_API_BASE_URL hợp lệ (Tránh gọi 127.0.0.1 gây ERR_CONNECTION_REFUSED)
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      if (apiBaseUrl && !apiBaseUrl.includes('127.0.0.1') && !apiBaseUrl.includes('localhost')) {
        try {
          const response = await api.post('/api/geometry/generate', {
            shape_type: selectedShape,
            params: shapeParams
          });
          setShapeData(response.data);
        } catch (err: any) {
          setError(err.response?.data?.detail || 'Lỗi khi tạo hình khối');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchShape();
  }, [selectedShape, shapeParams, setShapeData, setLoading, setError]);

  // Function to compute cross section locally with 0ms latency
  const computeSection = async () => {
    const { shapeData, plane } = useGeometryStore.getState();
    if (!shapeData || !shapeData.vertices || !shapeData.edges) return;

    setComputingSection(true);
    try {
      // 1. Tính toán cực nhanh trên client bằng engine thuần JS
      const localResult = calculateLocalCrossSection(shapeData.vertices, shapeData.edges, plane);
      setCrossSection(localResult);

      // 2. Tùy chọn gửi backend nếu có API URL từ xa
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      if (apiBaseUrl && !apiBaseUrl.includes('127.0.0.1') && !apiBaseUrl.includes('localhost')) {
        try {
          const response = await api.post('/api/cross-section/compute', {
            vertices: shapeData.vertices,
            edges: shapeData.edges,
            plane: plane
          });
          if (response?.data?.polygon_vertices?.length) {
            setCrossSection(response.data);
          }
        } catch {
          // Keep localResult
        }
      }
    } catch (err: any) {
      console.warn('Could not compute cross section:', err?.message || err);
    } finally {
      setComputingSection(false);
    }
  };

  return { computeSection };
};

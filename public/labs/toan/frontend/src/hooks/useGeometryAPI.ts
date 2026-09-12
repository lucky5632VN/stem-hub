import { useEffect } from 'react';
import api from '../api/axios';
import { useGeometryStore } from '../store/useGeometryStore';
import { calculateGeometry } from '../utils/geometryCalculator';

export const useGeometryAPI = () => {
  const { 
    selectedShape, 
    shapeParams, 
    setShapeData, 
    setLoading, 
    setError,
    plane,
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
      console.log('Fetching shape:', selectedShape, shapeParams);
      try {
        const response = await api.post('/api/geometry/generate', {
          shape_type: selectedShape,
          params: shapeParams
        });
        console.log('Shape data received:', response.data);
        setShapeData(response.data);
      } catch (err: any) {
        console.warn('Backend API unavailable, falling back to local geometry calculator:', err);
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
          const fallbackData = calculateGeometry({
            shapeType: selectedShape,
            shapeName: '',
            parameters: params
          });
          if (fallbackData && fallbackData.vertices && fallbackData.vertices.length > 0) {
            setShapeData(fallbackData as any);
            return;
          }
        } catch (calcErr) {
          console.error('Local calculation failed:', calcErr);
        }
        setError(err.response?.data?.detail || 'Lỗi khi tạo hình khối');
      } finally {
        setLoading(false);
      }
    };

    fetchShape();
  }, [selectedShape, shapeParams, setShapeData, setLoading, setError]);

  // Function to compute cross section
  const computeSection = async () => {
    const { shapeData } = useGeometryStore.getState();
    if (!shapeData) return;

    setComputingSection(true);
    try {
      const response = await api.post('/api/cross-section/compute', {
        vertices: shapeData.vertices,
        edges: shapeData.edges,
        plane: plane
      });
      setCrossSection(response.data);
    } catch (err: any) {
      console.error('Error computing cross section:', err);
    } finally {
      setComputingSection(false);
    }
  };

  return { computeSection };
};

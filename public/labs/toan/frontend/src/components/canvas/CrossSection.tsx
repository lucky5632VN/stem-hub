import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useGeometryStore } from '../../store/useGeometryStore';
import { Line } from '@react-three/drei';

const CrossSection: React.FC = () => {
  const { crossSection, crossSectionColor, plane } = useGeometryStore();

  // Tạo đa giác thiết diện
  const geometry = useMemo(() => {
    if (!crossSection || crossSection.polygon_vertices.length < 3) return null;

    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    
    // Triangulate the convex polygon (fan triangulation)
    const v0 = crossSection.polygon_vertices[0];
    for (let i = 1; i < crossSection.polygon_vertices.length - 1; i++) {
      const v1 = crossSection.polygon_vertices[i];
      const v2 = crossSection.polygon_vertices[i+1];
      vertices.push(...v0, ...v1, ...v2);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    return geo;
  }, [crossSection]);

  // Tạo mặt phẳng cắt bán trong suốt (Cutting Plane Visualizer)
  const planeVisual = useMemo(() => {
    if (!plane) return null;
    const normal = new THREE.Vector3(...plane.normal).normalize();
    const point = new THREE.Vector3(...plane.point);

    // Tính hướng xoay từ trục Z (0, 0, 1) sang normal
    const defaultNormal = new THREE.Vector3(0, 0, 1);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(defaultNormal, normal);

    return { point, quaternion };
  }, [plane]);

  if (!crossSection && !planeVisual) return null;

  // Điểm viền bao quanh đa giác thiết diện
  const outlinePoints = crossSection && crossSection.polygon_vertices.length >= 3
    ? ([...crossSection.polygon_vertices, crossSection.polygon_vertices[0]] as [number, number, number][])
    : null;

  return (
    <group>
      {/* 1. Mặt phẳng cắt (P) bán trong suốt biểu diễn đường lát cắt */}
      {planeVisual && (
        <mesh position={planeVisual.point} quaternion={planeVisual.quaternion}>
          <planeGeometry args={[16, 16]} />
          <meshBasicMaterial 
            color="#38bdf8" 
            transparent 
            opacity={0.12} 
            side={THREE.DoubleSide} 
            depthWrite={false}
          />
          {/* Lưới định vị trên mặt phẳng cắt */}
          <gridHelper 
            args={[16, 16, '#0284c7', '#0369a1']} 
            rotation={[Math.PI / 2, 0, 0]} 
          />
        </mesh>
      )}

      {/* 2. Mặt đa giác thiết diện tô màu phát sáng */}
      {geometry && (
        <mesh geometry={geometry}>
          <meshBasicMaterial 
            color={crossSectionColor || '#f59e0b'} 
            transparent 
            opacity={0.85} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      )}

      {/* 3. Đường viền phát sáng đa giác thiết diện */}
      {outlinePoints && (
        <Line
          points={outlinePoints}
          color="#fde047"
          lineWidth={4}
        />
      )}

      {/* 4. Các đỉnh giao điểm nổi bật trên cạnh khối đa diện */}
      {crossSection?.polygon_vertices.map((v, idx) => (
        <group key={`p-v-${idx}`} position={v as [number, number, number]}>
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export default CrossSection;

import React, { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';

/**
 * Component SpatialVector biểu diễn mũi tên vector 3D
 * @param {Array} start - Tọa độ điểm gốc A [x1, y1, z1]
 * @param {Array} end - Tọa độ ngọn vector B [x2, y2, z2]
 * @param {string} color - Mã màu vector HEX (Mặc định: Xanh ngọc)
 */
export default function SpatialVector({ 
  start = [0, 0, 0], 
  end = [2, 2, 2], 
  color = "#10b981" 
}) {
  const arrowRef = useRef();

  useLayoutEffect(() => {
    if (arrowRef.current) {
      // Chuyển mảng tọa độ sang THREE.Vector3
      const startVec = new THREE.Vector3(...start);
      const endVec = new THREE.Vector3(...end);
      
      // Tính vector chỉ hướng (direction) và độ dài (length)
      const dir = new THREE.Vector3().subVectors(endVec, startVec);
      const length = dir.length();
      
      // Nếu length = 0, báo lỗi hoặc tự xử lý (dir không thể chiếu normalize)
      if (length === 0) {
        arrowRef.current.visible = false;
        return;
      }
      arrowRef.current.visible = true;

      dir.normalize(); // Chuẩn hóa thành vector đơn vị

      // Cập nhật thuộc tính ArrowHelper
      arrowRef.current.position.copy(startVec);
      arrowRef.current.setDirection(dir);
      
      // Tham số: length, headLength (tỷ lệ 20% thân), headWidth (tỷ lệ 5% thân)
      arrowRef.current.setLength(length, length * 0.2, Math.max(0.1, length * 0.05)); 
      arrowRef.current.setColor(new THREE.Color(color));
    }
  }, [start, end, color]);

  // render thẻ ArrowHelper (native component của Three.js core trong R3F)
  return <arrowHelper ref={arrowRef} />;
}

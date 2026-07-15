import { useState, useEffect } from 'react';

export function useCountdown(targetDateISO) {
  const targetTime = new Date(targetDateISO).getTime();

  // Khởi tạo state bằng tính toán delta ngay lần đầu
  const [timeLeft, setTimeLeft] = useState(() => Math.max(targetTime - Date.now(), 0));

  useEffect(() => {
    // Nếu thời gian đã trôi qua, không cần chạy interval
    if (targetTime <= Date.now()) {
      setTimeLeft(0);
      return;
    }

    const intervalId = setInterval(() => {
      const currentTime = Date.now();
      const delta = targetTime - currentTime;

      if (delta <= 0) {
        setTimeLeft(0);
        clearInterval(intervalId);
      } else {
        setTimeLeft(delta);
      }
    }, 1000); // Chạy mỗi 1 giây

    // Cleanup function: Dọn dẹp interval khi component unmount
    return () => clearInterval(intervalId);
  }, [targetTime]);

  // Công thức toán học tách thời gian
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  const isOver = timeLeft === 0;

  // Format hiển thị luôn có 2 chữ số
  const fHours = hours.toString().padStart(2, '0');
  const fMinutes = minutes.toString().padStart(2, '0');
  const fSeconds = seconds.toString().padStart(2, '0');
  
  const formattedText = days > 0 
    ? `${days} Ngày ${fHours}:${fMinutes}:${fSeconds}` 
    : `${fHours}:${fMinutes}:${fSeconds}`;

  return { days, hours, minutes, seconds, isOver, formattedText };
}

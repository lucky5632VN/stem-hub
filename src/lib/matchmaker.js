import { 
  doc, setDoc, deleteDoc, getDocs, updateDoc, 
  query, collection, where, limit, getDoc, runTransaction
} from 'firebase/firestore';
import { db } from './firebase';
import { safeFirestoreCall } from './firestoreRetry';

/**
 * Hàm phân cấp bậc Rank theo ELO chủ đề Khoa học/STEM độc quyền
 */
export const getRankInfo = (elo) => {
  if (elo >= 2600) {
    return {
      title: 'Huyền Thoại Trí Tuệ',
      badge: '🔮',
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.35)]',
      description: 'Vượt lên mọi giới hạn khoa học, kiến tạo thế giới mới.'
    };
  }
  if (elo >= 2000) {
    return {
      title: 'Viện Sĩ Lượng Tử',
      badge: '🌀',
      color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.25)]',
      description: 'Thấu hiểu quy luật hạt và vi sinh tế bào ở trình độ lượng tử.'
    };
  }
  if (elo >= 1400) {
    return {
      title: 'Giáo Sư Phát Minh',
      badge: '⚡',
      color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30 shadow-[0_0_10px_rgba(129,140,248,0.15)]',
      description: 'Sáng tạo các giải pháp vượt giới hạn, làm chủ phòng thí nghiệm.'
    };
  }
  if (elo >= 900) {
    return {
      title: 'Tiến Sĩ STEM',
      badge: '🎓',
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
      description: 'Tư duy xuất sắc, giải mã phương trình và thuật toán cao cấp.'
    };
  }
  if (elo >= 500) {
    return {
      title: 'Nhà Nghiên Cứu',
      badge: '🔬',
      color: 'text-zinc-300 bg-zinc-300/10 border-zinc-300/30',
      description: 'Phân tích các cấu trúc phức tạp và tối ưu hóa phản ứng thực nghiệm.'
    };
  }
  if (elo >= 200) {
    return {
      title: 'Kỹ Thuật Viên',
      badge: '🧪',
      color: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
      description: 'Thành thạo các thao tác đo lường và thực hiện phản ứng cơ bản.'
    };
  }
  return {
    title: 'Trợ Lý Tập Sự',
    badge: '🌱',
    color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
    description: 'Mới bước vào phòng lab, làm quen với dụng cụ thí nghiệm cơ bản.'
  };
};

/**
 * Ghép trận 1v1 trực tiếp thời gian thực qua Firestore Transaction
 */
export const joinMatchmakingQueue = async (
  uid, name, elo, level, subject, activeTitle, avatarFrame, avatarParts,
  matchData = null, seenHistory = [], timeLimit = 180
) => {
  console.log("👉 [1] Bắt đầu tìm trận với môn:", subject);

  // BƯỚC 1: Tìm kiếm các phòng đang có status == "waiting" của môn học này
  const roomsCollection = collection(db, 'match_rooms');
  const q = query(
    roomsCollection,
    where('status', '==', 'waiting'),
    where('subject', '==', subject),
    limit(10)
  );

  let querySnapshot = { docs: [] };
  try {
    querySnapshot = await safeFirestoreCall(() => getDocs(q));
  } catch (err) {
    console.warn("⚠️ Không thể tải danh sách phòng chờ từ Server, tự động chuyển sang tạo phòng chờ mới:", err);
  }
  console.log(`👉 [2] Tìm thấy ${querySnapshot.docs.length} phòng đang waiting`);
  
  let joinedRoomId = null;

  // BƯỚC 2: Duyệt qua danh sách và sử dụng Transaction để join phòng (tránh Race Condition)
  for (const docSnap of querySnapshot.docs) {
    const roomData = docSnap.data();
    console.log("👉 [3] Kiểm tra phòng:", docSnap.id, roomData);

    // Bỏ qua phòng của chính mình tạo
    if (roomData.player1.uid === uid) {
      console.log("⚠️ Bỏ qua phòng do chính mình tạo ra");
      continue;
    }

    const roomRef = doc(db, 'match_rooms', docSnap.id);

    try {
      console.log("👉 [4] Bắt đầu chạy Transaction để chiếm phòng...");
      joinedRoomId = await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) {
          throw new Error("Phòng không tồn tại!");
        }

        const freshRoomData = roomDoc.data();

        // Kiểm tra phòng có đang trống và ở trạng thái "waiting" không
        if (freshRoomData.status === 'waiting' && !freshRoomData.player2) {
          transaction.update(roomRef, {
            player2: {
              uid: uid,
              name: name || 'Người chơi ẩn danh',
              elo: elo || 0,
              level: level || 1,
              activeTitle: activeTitle || 'apprentice',
              avatarFrame: avatarFrame || 'default',
              avatarParts: avatarParts || null
            },
            player2Seen: seenHistory || [],
            status: 'playing'
          });
          console.log("✅ Giao dịch update phòng thành công!");
          return roomDoc.id; // Giao dịch thành công
        }

        console.log("❌ Phòng đã bị người khác lấy hoặc không còn waiting");
        return null;
      });

      if (joinedRoomId) {
        break; // Ghép cặp thành công
      }
    } catch (txError) {
      console.error("🚨 Giao dịch Transaction văng lỗi:", txError);
    }
  }

  // Nếu gia nhập thành công phòng của đối thủ
  if (joinedRoomId) {
    console.log("🎉 ĐÃ GHÉP CẶP THÀNH CÔNG VỚI ĐỐI THỦ! Room ID:", joinedRoomId);
    return joinedRoomId;
  }

  // BƯỚC 3: Nếu không tìm thấy phòng hoặc Transaction thất bại, tạo phòng mới (Làm Player 1)
  console.log("👉 [5] Không tìm thấy phòng trống khả dụng, tiến hành tự tạo phòng chờ mới...");
  const newRoomId = `room_${uid}_${Date.now()}`;
  const newRoomRef = doc(db, 'match_rooms', newRoomId);

  const newRoomData = {
    id: newRoomId,
    subject: subject,
    status: 'waiting',
    player1: {
      uid: uid,
      name: name || 'Người chơi ẩn danh',
      elo: elo || 0,
      level: level || 1,
      activeTitle: activeTitle || 'apprentice',
      avatarFrame: avatarFrame || 'default',
      avatarParts: avatarParts || null
    },
    player2: null,
    player1Progress: 0,
    player2Progress: 0,
    player1Logs: ['Đấu thủ 1 đã sẵn sàng!'],
    player2Logs: ['Đấu thủ 2 đã sẵn sàng!'],
    timeRemaining: timeLimit,
    winnerId: null,
    createdAt: new Date().toISOString(),
    matchData: matchData,
    player1Seen: seenHistory || [],
    player2Seen: []
  };

  await setDoc(newRoomRef, newRoomData);
  console.log("✅ Đã tạo phòng chờ mới thành công! Room ID:", newRoomId);
  return newRoomId;
};

/**
 * Hủy tìm trận (Xóa phòng "waiting" do chính mình tạo ra)
 */
export const leaveMatchmakingQueue = async (uid) => {
  try {
    const roomsCollection = collection(db, 'match_rooms');
    const q = query(
      roomsCollection,
      where('player1.uid', '==', uid),
      where('status', '==', 'waiting')
    );

    let querySnapshot = { docs: [] };
    try {
      querySnapshot = await getDocs(q);
    } catch (err) {
      console.warn("⚠️ Không thể lấy danh sách phòng để xóa dọn dẹp:", err);
    }
    for (const docSnap of querySnapshot.docs) {
      await deleteDoc(doc(db, 'match_rooms', docSnap.id));
    }
  } catch (err) {
    console.warn("Lỗi khi hủy phòng chờ ghép trận:", err);
  }
};

/**
 * Tự động hợp nhất phòng (Room Merge) đề phòng Race Condition khi 2 người tìm trận cùng 1 tích tắc.
 * Hàm này quét các phòng "waiting" khác của môn học này. 
 * Nếu tìm thấy phòng của đối thủ có thời gian tạo trước hoặc có ID nhỏ hơn:
 * ➡️ Xóa phòng hiện tại của mình.
 * ➡️ Thực hiện Transaction gia nhập phòng của đối thủ.
 * ➡️ Trả về ID phòng đối thủ để client chuyển sang lắng nghe phòng mới.
 */
export const checkForRoomMerge = async (
  uid, currentRoomId, subject, name, elo, level, activeTitle, avatarFrame, avatarParts,
  seenHistory = []
) => {
  try {
    const roomsCollection = collection(db, 'match_rooms');
    const q = query(
      roomsCollection,
      where('status', '==', 'waiting'),
      where('subject', '==', subject),
      limit(10)
    );

    let querySnapshot = { docs: [] };
    try {
      querySnapshot = await safeFirestoreCall(() => getDocs(q));
    } catch (err) {
      return null;
    }

    // Lọc các phòng khác (không phải của mình)
    const otherRooms = querySnapshot.docs.filter(docSnap => docSnap.id !== currentRoomId);
    if (otherRooms.length === 0) return null;

    // Tìm phòng có chữ cái ID nhỏ hơn để làm phòng primary thống nhất
    otherRooms.sort((a, b) => a.id.localeCompare(b.id));
    const targetRoom = otherRooms[0];

    // Luật nhường phòng: Nếu targetRoom.id nhỏ hơn currentRoomId, ta sẽ hủy phòng của mình để gia nhập phòng đối thủ
    if (targetRoom.id < currentRoomId) {
      console.log(`🔄 [Merge] Phát hiện phòng đối thủ có ID nhỏ hơn: ${targetRoom.id}. Tiến hành xóa phòng mình và ghép sang đối thủ!`);

      const targetRoomRef = doc(db, 'match_rooms', targetRoom.id);
      const myRoomRef = doc(db, 'match_rooms', currentRoomId);

      // Bước 1: Xóa phòng hiện tại của mình
      try {
        await deleteDoc(myRoomRef);
        console.log(`🔄 [Merge] Đã xóa thành công phòng thừa của mình: ${currentRoomId}`);
      } catch (delErr) {
        console.warn("⚠️ Không thể xóa phòng thừa của mình:", delErr);
      }

      // Bước 2: Chạy Transaction gia nhập phòng đối thủ làm Player 2
      try {
        const joinedId = await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(targetRoomRef);
          if (!roomDoc.exists()) return null;

          const freshData = roomDoc.data();
          if (freshData.status === 'waiting' && !freshData.player2) {
            transaction.update(targetRoomRef, {
              player2: {
                uid: uid,
                name: name || 'Người chơi ẩn danh',
                elo: elo || 0,
                level: level || 1,
                activeTitle: activeTitle || 'apprentice',
                avatarFrame: avatarFrame || 'default',
                avatarParts: avatarParts || null
              },
              player2Seen: seenHistory || [],
              status: 'playing'
            });
            return targetRoom.id;
          }
          return null;
        });

        if (joinedId) {
          console.log(`🎉 [Merge] Gia nhập phòng đối thủ thành công qua Merge! Room ID: ${joinedId}`);
          return joinedId;
        }
      } catch (txErr) {
        console.error("🚨 Lỗi Transaction trong Merge:", txErr);
      }
    }
  } catch (err) {
    console.error("Lỗi trong quá trình tự chữa lành Merge phòng:", err);
  }
  return null;
};

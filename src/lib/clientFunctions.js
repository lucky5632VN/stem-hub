import { doc, runTransaction, collection, getDocs, query, where } from 'firebase/firestore';
import { calculateLaserPath } from './physicsEngine';

// MÚI GIỜ VIỆT NAM +7
const getVNTimeStr = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const vnDate = new Date(utc + (3600000 * 7));
  return vnDate.toISOString().split('T')[0];
};

const FALLBACK_SHOP_ITEMS = {
  'hair_punk': { price: 200, name: 'Tóc Punk Bộc Phá 🎸' },
  'hair_quantum': { price: 250, name: 'Tóc Rực Sáng Lượng Tử 🌀' },
  'hair_cyberspace': { price: 300, name: 'Kiểu Tóc Thế Giới Mới 🌐' },
  'top_cyber': { price: 300, name: 'Giáp Khoa Học Cyber 🦾' },
  'top_scifi_suit': { price: 350, name: 'Trang Phục Phi Hành Gia 🛰️' },
  'top_dimension': { price: 400, name: 'Áo Khoác Đấng Kiến Tạo 🌌' },
  'bottom_neon': { price: 200, name: 'Quần Da Sọc Neon ⚡' },
  'bottom_mech': { price: 250, name: 'Quần Cơ Giới 🛡️' },
  'accessory_visor': { price: 150, name: 'Kính Quét Hologram 🥽' },
  'accessory_wings': { price: 350, name: 'Cánh Ánh Sáng Photon 🪶' },
  'crown': { price: 500, name: 'Vương miện Đại Đế 👑' }
};

const ALL_GACHA_TITLES = [
  { id: 'alchemist_expert', name: 'Bậc thầy Hóa học 🧪', rarity: 'Rare', type: 'title', price: 200 },
  { id: 'math_wizard', name: 'Chiến thần Toán học 📐', rarity: 'Rare', type: 'title', price: 200 },
  { id: 'physics_guru', name: 'Kỹ sư Cơ học ⚙️', rarity: 'Rare', type: 'title', price: 200 },
  { id: 'cosmic_explorer', name: 'Phi hành gia Vũ trụ 🌌', rarity: 'Epic', type: 'title', price: 300 },
  { id: 'nuclear_engineer', name: 'Chuyên gia Hạt nhân ⚛️', rarity: 'Epic', type: 'title', price: 300 },
  { id: 'quantum_master', name: 'Pháp sư Lượng tử 🔮', rarity: 'Legendary', type: 'title', price: 500 }
];

const ALL_COSMETICS_LIST = [
  { id: 'hair_punk', name: 'Tóc Punk Bộc Phá 🎸', rarity: 'Rare', type: 'cosmetic', price: 200 },
  { id: 'hair_quantum', name: 'Tóc Rực Sáng Lượng Tử 🌀', rarity: 'Epic', type: 'cosmetic', price: 250 },
  { id: 'hair_cyberspace', name: 'Kiểu Tóc Thế Giới Mới 🌐', rarity: 'Epic', type: 'cosmetic', price: 300 },
  { id: 'top_cyber', name: 'Giáp Khoa Học Cyber 🦾', rarity: 'Epic', type: 'cosmetic', price: 300 },
  { id: 'top_scifi_suit', name: 'Trang Phục Phi Hành Gia 🛰️', rarity: 'Epic', type: 'cosmetic', price: 350 },
  { id: 'top_dimension', name: 'Áo Khoác Đấng Kiến Tạo 🌌', rarity: 'Legendary', type: 'cosmetic', price: 400 },
  { id: 'bottom_neon', name: 'Quần Da Sọc Neon ⚡', rarity: 'Rare', type: 'cosmetic', price: 200 },
  { id: 'bottom_mech', name: 'Quần Cơ Giới 🛡️', rarity: 'Epic', type: 'cosmetic', price: 250 },
  { id: 'accessory_visor', name: 'Kính Quét Hologram 🥽', rarity: 'Rare', type: 'cosmetic', price: 150 },
  { id: 'accessory_wings', name: 'Cánh Ánh Sáng Photon 🪶', rarity: 'Legendary', type: 'cosmetic', price: 350 },
  { id: 'crown', name: 'Vương miện Đại Đế 👑', rarity: 'Legendary', type: 'cosmetic', price: 500 }
];

const ALL_GACHA_POOL = [...ALL_COSMETICS_LIST, ...ALL_GACHA_TITLES];

function checkChemistryMatch(missionId, equation, reactants) {
  const eq = (equation || '').toLowerCase();
  const reqs = reactants || [];
  if (missionId === 'mission_01_cl2_synthesis') {
    return eq.includes('cl2') || eq.includes('clo') || (reqs.includes('mno2') && reqs.includes('hcl')) || (reqs.includes('mno2_powder') && reqs.includes('hcl_conc'));
  }
  if (missionId === 'mission_02_nacl_neutralization') {
    return eq.includes('nacl') || (reqs.includes('hcl') && reqs.includes('naoh')) || (reqs.includes('hcl_dil') && reqs.includes('naoh_dil'));
  }
  if (missionId === 'mission_03_esterification') {
    return eq.includes('ester') || eq.includes('ethyl_acetate') || eq.includes('este') || (reqs.includes('ch3cooh') && reqs.includes('ethanol')) || (reqs.includes('ch3cooh_glacial') && reqs.includes('c2h5oh'));
  }
  if (missionId === 'mission_04_thermite_reaction') {
    return eq.includes('thermite') || eq.includes('nhiệt nhôm') || eq.includes('fe2o3 + 2al') || (reqs.includes('fe2o3') && reqs.includes('al'));
  }
  if (missionId === 'mission_05_na_combustion') {
    return eq.includes('na2o') || eq.includes('na oxit') || (reqs.includes('na_metal') && (reqs.includes('o2') || reqs.includes('o2_gas') || eq.includes('o2') || eq.includes('cháy')));
  }
  if (missionId === 'mission_06_copper_complex') {
    return eq.includes('[cu(nh3)4]') || eq.includes('cu_oh_2+nh3') || eq.includes('cuso4+nh3') || (reqs.includes('cuso4') && reqs.includes('nh3')) || (reqs.includes('cu_oh_2') && reqs.includes('nh3'));
  }
  if (missionId === 'mission_07_fe_cl2_combustion') {
    return eq.includes('fecl3') || eq.includes('fe + cl2') || (reqs.includes('fe') && reqs.includes('cl2_gas'));
  }
  if (missionId === 'mission_08_biuret_test') {
    return eq.includes('biuret') || eq.includes('albumin') || (reqs.includes('albumin') && reqs.includes('cuso4') && reqs.includes('naoh'));
  }
  if (missionId === 'mission_09_iodine_starch') {
    return eq.includes('complex-blue-black') || eq.includes('starch') || (reqs.includes('starch') && reqs.includes('iodine'));
  }
  if (missionId === 'mission_10_h2_explosion') {
    return eq.includes('h2_combustion') || eq.includes('explosion-pop') || (reqs.includes('h2_gas') && reqs.includes('o2_gas'));
  }
  return false;
}

export const clientFunctions = {
  // 1. UPDATE PRESENCE (LAST ACTIVE)
  updateLastActive: (db, auth) => async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthenticated');
    const userRef = doc(db, 'users', user.uid);
    await runTransaction(db, async (transaction) => {
      transaction.update(userRef, { lastActive: Date.now() });
    });
    return { success: true };
  },

  // 2. PROCESS FRIEND ACTION
  processFriendAction: (db, auth) => async (data) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthenticated');
    const uid = user.uid;
    const { actionType, payload } = data;
    if (!actionType || !payload || !payload.targetUid) {
      throw new Error('Missing actionType or targetUid.');
    }

    const targetUid = payload.targetUid;
    const myUserRef = doc(db, 'users', uid);
    const targetUserRef = doc(db, 'users', targetUid);

    return runTransaction(db, async (transaction) => {
      const myDoc = await transaction.get(myUserRef);
      const targetDoc = await transaction.get(targetUserRef);

      if (!myDoc.exists() || !targetDoc.exists()) {
        throw new Error('One or both user docs not found.');
      }

      const myData = myDoc.data();
      const targetData = targetDoc.data();

      const myFriends = myData.friends || [];
      const myIncoming = myData.incomingRequests || [];
      const myOutgoing = myData.outgoingRequests || [];

      const targetFriends = targetData.friends || [];
      const targetIncoming = targetData.incomingRequests || [];
      const targetOutgoing = targetData.outgoingRequests || [];

      switch (actionType) {
        case 'SEND_REQUEST': {
          if (targetIncoming.some(r => r.uid === uid)) {
            return { success: true, message: 'Already sent request.' };
          }

          const myInfo = {
            uid: uid,
            displayName: myData.displayName || 'Học viên',
            elo: myData.personalization?.elo || myData.stats?.elo || 1000,
            level: myData.personalization?.level || myData.stats?.level || 1,
            activeTitle: myData.personalization?.activeTitle || 'apprentice',
            avatarFrame: myData.personalization?.avatarFrame || 'default'
          };

          const newTargetIncoming = [...targetIncoming, myInfo];
          const newMyOutgoing = [...myOutgoing, targetUid];

          transaction.update(targetUserRef, { incomingRequests: newTargetIncoming });
          transaction.update(myUserRef, { outgoingRequests: newMyOutgoing });

          return { success: true };
        }

        case 'ACCEPT_REQUEST': {
          const senderInfo = myIncoming.find(r => r.uid === targetUid) || {
            uid: targetUid,
            displayName: targetData.displayName || 'Học viên',
            elo: targetData.personalization?.elo || targetData.stats?.elo || 1000,
            level: targetData.personalization?.level || targetData.stats?.level || 1,
            activeTitle: targetData.personalization?.activeTitle || 'apprentice',
            avatarFrame: targetData.personalization?.avatarFrame || 'default'
          };

          const newMyIncoming = myIncoming.filter(r => r.uid !== targetUid);
          const newMyFriends = [...myFriends, senderInfo];

          const newTargetOutgoing = targetOutgoing.filter(id => id !== uid);
          const myInfo = {
            uid: uid,
            displayName: myData.displayName || 'Học viên',
            elo: myData.personalization?.elo || myData.stats?.elo || 1000,
            level: myData.personalization?.level || myData.stats?.level || 1,
            activeTitle: myData.personalization?.activeTitle || 'apprentice',
            avatarFrame: myData.personalization?.avatarFrame || 'default'
          };
          const newTargetFriends = [...targetFriends, myInfo];

          transaction.update(myUserRef, {
            incomingRequests: newMyIncoming,
            friends: newMyFriends
          });
          transaction.update(targetUserRef, {
            outgoingRequests: newTargetOutgoing,
            friends: newTargetFriends
          });

          return { success: true };
        }

        case 'DECLINE_REQUEST': {
          const newMyIncoming = myIncoming.filter(r => r.uid !== targetUid);
          const newTargetOutgoing = targetOutgoing.filter(id => id !== uid);

          transaction.update(myUserRef, { incomingRequests: newMyIncoming });
          transaction.update(targetUserRef, { outgoingRequests: newTargetOutgoing });

          return { success: true };
        }

        case 'CANCEL_REQUEST': {
          const newMyOutgoing = myOutgoing.filter(id => id !== targetUid);
          const newTargetIncoming = targetIncoming.filter(r => r.uid !== uid);

          transaction.update(myUserRef, { outgoingRequests: newMyOutgoing });
          transaction.update(targetUserRef, { incomingRequests: newTargetIncoming });

          return { success: true };
        }

        case 'UNFRIEND': {
          const newMyFriends = myFriends.filter(f => f.uid !== targetUid);
          const newTargetFriends = targetFriends.filter(f => f.uid !== uid);

          transaction.update(myUserRef, { friends: newMyFriends });
          transaction.update(targetUserRef, { friends: newTargetFriends });

          return { success: true };
        }

        default:
          throw new Error('Friend action type không hợp lệ.');
      }
    });
  },

  // 3. PROCESS CRYSTAL TRANSACTION
  processCrystalTransaction: (db, auth) => async (data) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthenticated');
    const uid = user.uid;
    const { actionType, payload } = data;
    if (!actionType) throw new Error('Missing actionType.');

    const userRef = doc(db, 'users', uid);

    return runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error('User doc not found.');
      }

      const userData = userDoc.data();
      const pers = userData.personalization || {};
      const stats = userData.stats || {};
      const currentCrystals = pers.crystals !== undefined ? Number(pers.crystals) : 500;

      switch (actionType) {
        case 'SHOP_PURCHASE': {
          const { itemId } = payload || {};
          if (!itemId) throw new Error('Missing itemId.');

          let itemPrice = 0;
          let itemName = '';
          const shopItemRef = doc(db, 'shop_items', itemId);
          const shopItemSnap = await transaction.get(shopItemRef);
          
          if (shopItemSnap.exists()) {
            const itemData = shopItemSnap.data();
            itemPrice = Number(itemData.price);
            itemName = itemData.name;
          } else if (FALLBACK_SHOP_ITEMS[itemId]) {
            itemPrice = FALLBACK_SHOP_ITEMS[itemId].price;
            itemName = FALLBACK_SHOP_ITEMS[itemId].name;
          } else {
            throw new Error('Vật phẩm không tồn tại.');
          }

          if (currentCrystals < itemPrice) {
            throw new Error('Không đủ Pha Lê');
          }

          const unlockedParts = pers.unlockedParts || ['peach', 'hair_default', 'top_default', 'bottom_default'];
          if (unlockedParts.includes(itemId)) {
            throw new Error('Bạn đã sở hữu vật phẩm này rồi.');
          }

          const newUnlockedParts = [...unlockedParts, itemId];
          const newCrystals = currentCrystals - itemPrice;

          transaction.update(userRef, {
            'personalization.crystals': newCrystals,
            'personalization.unlockedParts': newUnlockedParts
          });

          return { success: true, newCrystals, itemPurchased: itemId };
        }

        case 'GACHA_ROLL': {
          const { pullCount } = payload || {};
          const count = Number(pullCount) || 1;
          if (count !== 1 && count !== 10) throw new Error('Invalid pullCount.');

          const cost = count === 10 ? 900 : 100;
          if (currentCrystals < cost) {
            throw new Error('Không đủ Pha Lê');
          }

          const unlockedParts = pers.unlockedParts || ['peach', 'hair_default', 'top_default', 'bottom_default'];
          const unlockedTitles = pers.unlockedTitles || ['apprentice'];

          const newUnlockedParts = [...unlockedParts];
          const newUnlockedTitles = [...unlockedTitles];
          let results = [];
          let totalCompensation = 0;

          for (let i = 0; i < count; i++) {
            const rand = Math.random() * 100;
            let selectedRarity = 'Common';
            if (rand < 5) selectedRarity = 'Legendary';
            else if (rand < 25) selectedRarity = 'Epic';
            else if (rand < 70) selectedRarity = 'Rare';
            else selectedRarity = 'Common';

            let rarityPool = ALL_GACHA_POOL.filter(item => item.rarity === selectedRarity);
            if (rarityPool.length === 0) {
              rarityPool = ALL_GACHA_POOL;
            }
            const selectedItem = rarityPool[Math.floor(Math.random() * rarityPool.length)];

            let isDuplicate = false;
            let compensation = 0;

            if (selectedItem.type === 'cosmetic') {
              if (newUnlockedParts.includes(selectedItem.id)) {
                isDuplicate = true;
                compensation = Math.round(selectedItem.price * 0.5);
              } else {
                newUnlockedParts.push(selectedItem.id);
              }
            } else {
              if (newUnlockedTitles.includes(selectedItem.id)) {
                isDuplicate = true;
                compensation = Math.round(selectedItem.price * 0.5);
              } else {
                newUnlockedTitles.push(selectedItem.id);
              }
            }

            totalCompensation += compensation;
            results.push({
              item: selectedItem,
              isDuplicate,
              compensation
            });
          }

          const newCrystals = currentCrystals - cost + totalCompensation;

          transaction.update(userRef, {
            'personalization.crystals': newCrystals,
            'personalization.unlockedParts': newUnlockedParts,
            'personalization.unlockedTitles': newUnlockedTitles
          });

          return { success: true, newCrystals, results };
        }

        case 'CHECKIN': {
          const todayStr = getVNTimeStr();
          const lastCheckIn = pers.lastCheckInDate;

          if (lastCheckIn === todayStr) {
            throw new Error('Bạn đã hoàn thành đồng bộ năng lượng hôm nay rồi.');
          }

          const lastDayIndex = pers.checkInDayIndex || 0;
          let nextDayIndex = 1;
          if (lastDayIndex > 0 && lastDayIndex < 7) {
            nextDayIndex = lastDayIndex + 1;
          } else {
            nextDayIndex = 1;
          }

          let bonusCrystals = 50;
          if (nextDayIndex === 1) bonusCrystals = 50;
          else if (nextDayIndex === 2) bonusCrystals = 60;
          else if (nextDayIndex === 3) bonusCrystals = 70;
          else if (nextDayIndex === 4) bonusCrystals = 80;
          else if (nextDayIndex === 5) bonusCrystals = 100;
          else if (nextDayIndex === 6) bonusCrystals = 120;
          else if (nextDayIndex === 7) bonusCrystals = 200;

          const unlocked = pers.unlockedParts || ['peach', 'hair_default', 'top_default', 'bottom_default'];
          let newUnlocked = [...unlocked];
          let giftMsg = "";

          if (nextDayIndex === 7) {
            if (!newUnlocked.includes('crown')) {
              newUnlocked.push('crown');
              giftMsg = " và nhận được thêm Vương miện Đại Đế 👑!";
            } else {
              giftMsg = " (Bạn đã có Vương miện Đại Đế nên được tặng thêm 100 🔮 Pha lê đền bù)!";
              bonusCrystals += 100;
            }
          }

          const newCrystals = currentCrystals + bonusCrystals;

          transaction.update(userRef, {
            'personalization.crystals': newCrystals,
            'personalization.lastCheckInDate': todayStr,
            'personalization.checkInDayIndex': nextDayIndex,
            'personalization.unlockedParts': newUnlocked
          });

          return { success: true, newCrystals, bonusCrystals, nextDayIndex, giftMsg };
        }

        case 'SYNC_DAILY_QUESTS': {
          const todayStr = getVNTimeStr();
          const totalMatches = (stats.wins || 0) + (stats.losses || 0);
          
          let questsData = stats.dailyQuests || {};
          let needsUpdate = false;
          
          if (questsData.lastQuestDate !== todayStr) {
            questsData = {
              lastQuestDate: todayStr,
              totalMatches: totalMatches,
              quests: [
                { id: 'quest_checkin', label: 'Nạp năng lượng lượng tử (Điểm danh)', current: pers.lastCheckInDate === todayStr ? 1 : 0, target: 1, reward: 30, claimed: false },
                { id: 'quest_avatar', label: 'Thiết kế phong cách Chibi (Lưu Avatar)', current: pers.avatarUrl === 'custom-avatar' ? 1 : 0, target: 1, reward: 20, claimed: false },
                { id: 'quest_arena', label: 'Thách đấu ELO tại Đấu trường 1v1', current: 0, target: 1, reward: 50, claimed: false }
              ]
            };
            needsUpdate = true;
          } else {
            const checkinQuest = questsData.quests?.find(q => q.id === 'quest_checkin');
            if (checkinQuest && !checkinQuest.claimed) {
              const isCheckinCompleted = pers.lastCheckInDate === todayStr;
              if (isCheckinCompleted && checkinQuest.current !== 1) {
                checkinQuest.current = 1;
                needsUpdate = true;
              }
            }
            
            const avatarQuest = questsData.quests?.find(q => q.id === 'quest_avatar');
            if (avatarQuest && !avatarQuest.claimed) {
              const isAvatarCompleted = pers.avatarUrl === 'custom-avatar';
              if (isAvatarCompleted && avatarQuest.current !== 1) {
                avatarQuest.current = 1;
                needsUpdate = true;
              }
            }
            
            const arenaQuest = questsData.quests?.find(q => q.id === 'quest_arena' || q.id === 'quest_pvp');
            if (arenaQuest && !arenaQuest.claimed) {
              const arenaPlayed = totalMatches > (questsData.totalMatches || 0) ? 1 : 0;
              if (arenaPlayed > 0 && arenaQuest.current !== 1) {
                arenaQuest.current = 1;
                needsUpdate = true;
              }
            }
          }
          
          if (needsUpdate) {
            transaction.update(userRef, {
              'stats.dailyQuests': questsData
            });
          }
          
          return { success: true, dailyQuests: questsData.quests || [] };
        }

        case 'CLAIM_QUEST': {
          const { questId } = payload || {};
          if (!questId) throw new Error('Missing questId.');

          const questList = stats.dailyQuests?.quests || [];
          const questIndex = questList.findIndex(q => q.id === questId);
          if (questIndex === -1) {
            throw new Error('Nhiệm vụ không tồn tại.');
          }

          const quest = questList[questIndex];
          if (quest.claimed) {
            throw new Error('Nhiệm vụ đã nhận thưởng trước đó.');
          }

          let isCompleted = false;
          if (questId === 'quest_checkin') {
            isCompleted = pers.lastCheckInDate === getVNTimeStr();
          } else if (questId === 'quest_avatar') {
            isCompleted = pers.avatarUrl === 'custom-avatar';
          } else if (questId === 'quest_pvp' || questId === 'quest_arena') {
            const totalMatches = (stats.wins || 0) + (stats.losses || 0);
            const baselineMatches = stats.dailyQuests?.totalMatches || 0;
            isCompleted = totalMatches > baselineMatches;
          } else {
            const current = quest.current !== undefined ? quest.current : (quest.currentCount !== undefined ? quest.currentCount : 0);
            const target = quest.target !== undefined ? quest.target : (quest.targetCount !== undefined ? quest.targetCount : 1);
            isCompleted = current >= target;
          }

          if (!isCompleted) {
            throw new Error('Nhiệm vụ chưa hoàn thành.');
          }

          const newCrystals = currentCrystals + (quest.reward || 50);
          const newQuests = questList.map(q => {
            if (q.id === questId) {
              return { ...q, claimed: true };
            }
            return q;
          });

          transaction.update(userRef, {
            'personalization.crystals': newCrystals,
            'stats.dailyQuests.quests': newQuests
          });

          return { success: true, newCrystals, questId, reward: quest.reward };
        }

        case 'CLAIM_LEVEL_MILESTONE': {
          const { milestoneLevel } = payload || {};
          const level = Number(milestoneLevel);
          if (isNaN(level)) throw new Error('Invalid milestoneLevel.');

          const currentLevel = pers.level || stats.level || 1;
          if (currentLevel < level) {
            throw new Error(`Trình độ chưa đạt Cấp ${level}.`);
          }

          const claimed = pers.claimedMilestones || [];
          if (claimed.includes(level)) {
            throw new Error('Bạn đã nhận phần quà của mốc này rồi.');
          }

          const newCrystals = currentCrystals + 500;
          const newClaimed = [...claimed, level];

          let newUnlockedFrames = [...(pers.unlockedFrames || ['default'])];
          let newUnlockedTitles = [...(pers.unlockedTitles || ['apprentice'])];

          if (level === 10) {
            if (!newUnlockedFrames.includes('gold_vip')) newUnlockedFrames.push('gold_vip');
          } else if (level === 20) {
            if (!newUnlockedFrames.includes('neon_fire')) newUnlockedFrames.push('neon_fire');
          } else if (level === 30) {
            if (!newUnlockedTitles.includes('dimension_creator')) newUnlockedTitles.push('dimension_creator');
          }

          transaction.update(userRef, {
            'personalization.crystals': newCrystals,
            'personalization.claimedMilestones': newClaimed,
            'personalization.unlockedFrames': newUnlockedFrames,
            'personalization.unlockedTitles': newUnlockedTitles
          });

          return { success: true, newCrystals, levelClaimed: level };
        }

        case 'UPDATE_PERSONALIZATION': {
          const { bgImage, avatarUrl, avatarParts, activeTitle, avatarFrame, pinnedBadges } = payload || {};
          const updates = {};
          if (bgImage !== undefined) updates['personalization.bgImage'] = bgImage;
          if (avatarUrl !== undefined) updates['personalization.avatarUrl'] = avatarUrl;
          if (avatarParts !== undefined) updates['personalization.avatarParts'] = avatarParts;
          if (activeTitle !== undefined) updates['personalization.activeTitle'] = activeTitle;
          if (avatarFrame !== undefined) updates['personalization.avatarFrame'] = avatarFrame;
          if (pinnedBadges !== undefined) updates['personalization.pinnedBadges'] = pinnedBadges;

          if (Object.keys(updates).length > 0) {
            transaction.update(userRef, updates);
          }

          return { success: true };
        }

        case 'CLAIM_HOMEPAGE_QUEST': {
          const { questId, amount } = payload || {};
          if (!questId || !amount) throw new Error('Missing questId or amount.');

          const newCrystals = currentCrystals + Number(amount);
          transaction.update(userRef, {
            'personalization.crystals': newCrystals
          });

          return { success: true, newCrystals };
        }

        default:
          throw new Error('Action type không hợp lệ.');
      }
    });
  },

  // 4. SUBMIT ANSWER
  submitAnswer: (db, auth) => async (data) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User must be logged in.');
    const uid = user.uid;
    const { matchId, questionId, selectedAnswer } = data;

    if (!matchId) throw new Error('Missing matchId.');

    const matchRef = doc(db, 'match_rooms', matchId);
    
    // Đọc trạng thái phòng thi đấu
    const matchDoc = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(matchRef);
      if (!snap.exists()) throw new Error('Match room not found.');
      return snap.data();
    });

    if (matchDoc.status !== 'playing') {
      throw new Error('Match is not in playing state.');
    }

    const isPlayer1 = matchDoc.player1.uid === uid;
    const isPlayer2 = matchDoc.player2.uid === uid;
    if (!isPlayer1 && !isPlayer2) {
      throw new Error('You are not a participant in this match.');
    }

    const subject = matchDoc.subject;
    const matchData = matchDoc.matchData || {};
    const questionPool = matchData.questionPool || [];

    let correct = false;
    let currentProgress = 0;
    let explanation = '';

    if (subject === 'biology') {
      const qIndex = Number(questionId);
      if (isNaN(qIndex) || qIndex < 0 || qIndex >= questionPool.length) {
        throw new Error('Invalid questionId.');
      }
      const q = questionPool[qIndex];
      correct = q.correct === selectedAnswer;
      explanation = q.note || '';

      const scoreKey = isPlayer1 ? 'player1Score' : 'player2Score';
      const currentScore = matchDoc[scoreKey] || 0;
      const newScore = correct ? currentScore + 1 : currentScore;

      const nextQ = qIndex + 1;
      if (nextQ >= questionPool.length) {
        const pct = Math.round((newScore / questionPool.length) * 100);
        currentProgress = pct >= 60 ? Math.min(100, pct + 10) : pct;
      } else {
        currentProgress = Math.round((nextQ / questionPool.length) * 100);
      }

      await runTransaction(db, async (transaction) => {
        transaction.update(matchRef, {
          [scoreKey]: newScore,
          [isPlayer1 ? 'player1Progress' : 'player2Progress']: currentProgress
        });
      });
    } else if (subject === 'math') {
      const astIndex = Number(questionId);
      if (isNaN(astIndex) || astIndex < 0 || astIndex >= questionPool.length) {
        throw new Error('Invalid asteroidIndex.');
      }
      const target = questionPool[astIndex];
      const userX = selectedAnswer.x;
      const userY = selectedAnswer.y;
      correct = target.coord.x === userX && target.coord.y === userY;

      const scoreKey = isPlayer1 ? 'player1Score' : 'player2Score';
      const currentScore = matchDoc[scoreKey] || 0;
      const newScore = correct ? currentScore + 1 : currentScore;

      const nextIndex = astIndex + 1;
      if (nextIndex >= questionPool.length) {
        currentProgress = 100;
      } else {
        currentProgress = Math.floor((nextIndex / questionPool.length) * 100);
      }

      await runTransaction(db, async (transaction) => {
        transaction.update(matchRef, {
          [scoreKey]: newScore,
          [isPlayer1 ? 'player1Progress' : 'player2Progress']: currentProgress
        });
      });
    } else if (subject === 'physics') {
      const { physMirrors } = selectedAnswer || {};
      if (!physMirrors || !Array.isArray(physMirrors) || physMirrors.length < 3) {
        throw new Error('physMirrors is missing, not an array, or has fewer than 3 elements.');
      }

      const physTarget = (matchData.physTarget && Array.isArray(matchData.physTarget) && matchData.physTarget.length === 3)
        ? matchData.physTarget
        : [45, 90, 135];

      const isMatchTarget = Number(physMirrors[0]) === physTarget[0] &&
                            Number(physMirrors[1]) === physTarget[1] &&
                            Number(physMirrors[2]) === physTarget[2];

      const mirrors = physMirrors.map((angle, idx) => ({
        x: idx === 0 ? 45 : 175,
        y: idx === 2 ? 140 : 50,
        angle: Number(angle) || 0
      }));
      const pathResult = calculateLaserPath(mirrors, { x: 45, y: 140 }, { x: 295, y: 140 });

      correct = !!(isMatchTarget && pathResult.isHit);
      currentProgress = correct ? 100 : 0;

      await runTransaction(db, async (transaction) => {
        transaction.update(matchRef, {
          [isPlayer1 ? 'player1Progress' : 'player2Progress']: currentProgress
        });
      });
    } else if (subject === 'chemistry') {
      const { type, equation, reactants, chemTemp, chemHCl, chemNaOH, chemEvap } = selectedAnswer;
      const currentProg = isPlayer1 ? (matchDoc.player1Progress || 0) : (matchDoc.player2Progress || 0);

      if (type === 'chemistry_reaction_complete') {
        const isMatch = checkChemistryMatch(questionId, equation, reactants);
        let isPhysicallyValid = true;

        if (chemTemp !== undefined) {
          const temp = Number(chemTemp);
          if (isNaN(temp) || temp < 85) isPhysicallyValid = false;
        }

        if (isPhysicallyValid && chemHCl !== undefined && chemNaOH !== undefined) {
          const hcl = Number(chemHCl);
          const naoh = Number(chemNaOH);
          if (hcl <= 0 || naoh <= 0 || hcl / naoh < 0.5 || hcl / naoh > 2.0) {
            isPhysicallyValid = false;
          }
        }

        if (chemEvap !== undefined) {
          const evap = Number(chemEvap);
          if (isNaN(evap) || evap < 95) isPhysicallyValid = false;
        }

        const idclEnergy = selectedAnswer.idclEnergy !== undefined ? Number(selectedAnswer.idclEnergy) : undefined;
        if (idclEnergy !== undefined && idclEnergy >= 100) {
          isPhysicallyValid = false;
        }

        if (isMatch && isPhysicallyValid) {
          correct = true;
          currentProgress = 100;
        } else {
          currentProgress = Math.min(90, currentProg + 15);
        }
      } else if (type === 'chemistry_safety_violation') {
        currentProgress = Math.max(0, currentProg - 10);
      }

      await runTransaction(db, async (transaction) => {
        transaction.update(matchRef, {
          [isPlayer1 ? 'player1Progress' : 'player2Progress']: currentProgress
        });
      });
    }

    // Ghi log hành động
    const logMsg = correct 
      ? `✅ [Client] ${uid === matchDoc.player1.uid ? 'Player 1' : 'Player 2'} trả lời đúng (Tiến độ: ${currentProgress}%)`
      : `❌ [Client] ${uid === matchDoc.player1.uid ? 'Player 1' : 'Player 2'} trả lời sai (Tiến độ: ${currentProgress}%)`;

    const logsKey = isPlayer1 ? 'player1Logs' : 'player2Logs';
    
    await runTransaction(db, async (transaction) => {
      const freshSnap = await transaction.get(matchRef);
      const freshData = freshSnap.data();
      const currentLogs = freshData[logsKey] || [];
      const updatedLogs = [logMsg, ...currentLogs].slice(0, 10);
      
      transaction.update(matchRef, {
        [logsKey]: updatedLogs
      });
    });

    return { correct, currentProgress, explanation };
  },

  // 5. FINALIZE MATCH
  finalizeMatch: (db, auth) => async (data) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User must be logged in.');
    const { matchId } = data;
    if (!matchId) throw new Error('Missing matchId.');

    const matchRef = doc(db, 'match_rooms', matchId);
    const settingsRef = doc(db, 'config', 'systemSettings');

    return runTransaction(db, async (transaction) => {
      const matchDoc = await transaction.get(matchRef);
      if (!matchDoc.exists()) throw new Error('Match room not found.');
      const roomData = matchDoc.data();

      if (roomData.status === 'result') {
        return { success: true, alreadyFinalized: true };
      }

      const p1Prog = roomData.player1Progress || 0;
      const p2Prog = roomData.player2Progress || 0;
      const timeRemaining = roomData.timeRemaining !== undefined ? roomData.timeRemaining : 60;

      if (p1Prog < 100 && p2Prog < 100 && timeRemaining > 0) {
        throw new Error('Trận đấu chưa kết thúc (thời gian chưa hết và chưa có ai đạt 100% tiến độ).');
      }

      let winnerId = 'draw';
      if (p1Prog > p2Prog) {
        winnerId = roomData.player1.uid;
      } else if (p2Prog > p1Prog) {
        winnerId = roomData.player2.uid;
      }

      const p1Ref = doc(db, 'users', roomData.player1.uid);
      const p2Ref = doc(db, 'users', roomData.player2.uid);

      const [p1Doc, p2Doc, settingsSnap] = await Promise.all([
        transaction.get(p1Ref),
        transaction.get(p2Ref),
        transaction.get(settingsRef)
      ]);

      if (!p1Doc.exists() || !p2Doc.exists()) {
        throw new Error('One of the players user doc not found.');
      }

      const p1Data = p1Doc.data();
      const p2Data = p2Doc.data();

      const p1Elo = p1Data.stats?.elo !== undefined ? p1Data.stats.elo : 1000;
      const p2Elo = p2Data.stats?.elo !== undefined ? p2Data.stats.elo : 1000;

      let expMultiplier = 1.0;
      let pvpCrystalStake = 50;
      let pvpEloFactor = 25;

      if (settingsSnap.exists()) {
        const settings = settingsSnap.data();
        if (settings.expMultiplier !== undefined) expMultiplier = Number(settings.expMultiplier);
        if (settings.pvpCrystalStake !== undefined) pvpCrystalStake = Number(settings.pvpCrystalStake);
        if (settings.pvpEloFactor !== undefined) pvpEloFactor = Number(settings.pvpEloFactor);
      }

      const expectedP1 = 1 / (1 + Math.pow(10, (p2Elo - p1Elo) / 400));
      const expectedP2 = 1 / (1 + Math.pow(10, (p1Elo - p2Elo) / 400));

      let scoreP1 = 0.5;
      let scoreP2 = 0.5;
      if (winnerId === roomData.player1.uid) {
        scoreP1 = 1;
        scoreP2 = 0;
      } else if (winnerId === roomData.player2.uid) {
        scoreP1 = 0;
        scoreP2 = 1;
      }

      let eloChangeP1 = Math.round(pvpEloFactor * (scoreP1 - expectedP1));
      let eloChangeP2 = Math.round(pvpEloFactor * (scoreP2 - expectedP2));

      if (winnerId === roomData.player1.uid) {
        eloChangeP1 = Math.max(15, Math.min(32, eloChangeP1));
        eloChangeP2 = -eloChangeP1;
      } else if (winnerId === roomData.player2.uid) {
        eloChangeP2 = Math.max(15, Math.min(32, eloChangeP2));
        eloChangeP1 = -eloChangeP2;
      } else {
        eloChangeP1 = Math.round(eloChangeP1);
        eloChangeP2 = Math.round(eloChangeP2);
      }

      let p1ExpChange = Math.floor((winnerId === roomData.player1.uid ? 250 : winnerId === 'draw' ? 100 : 50) * expMultiplier);
      let p2ExpChange = Math.floor((winnerId === roomData.player2.uid ? 250 : winnerId === 'draw' ? 100 : 50) * expMultiplier);

      let p1CrystalChange = winnerId === roomData.player1.uid ? pvpCrystalStake : 0;
      let p2CrystalChange = winnerId === roomData.player2.uid ? pvpCrystalStake : 0;

      const p1Stats = p1Data.stats || {};
      const p1Pers = p1Data.personalization || {};
      const newEloP1 = Math.max(0, p1Elo + eloChangeP1);
      const newExpP1 = (p1Stats.exp || 0) + p1ExpChange;
      let newLevelP1 = p1Stats.level || 1;
      let nextLevelExpP1 = p1Stats.nextLevelExp || 1000;
      while (newExpP1 >= nextLevelExpP1) {
        newLevelP1 += 1;
        nextLevelExpP1 = newLevelP1 * 1000;
      }

      transaction.update(p1Ref, {
        'stats.elo': newEloP1,
        'stats.exp': newExpP1,
        'stats.level': newLevelP1,
        'stats.nextLevelExp': nextLevelExpP1,
        'stats.wins': (p1Stats.wins || 0) + (winnerId === roomData.player1.uid ? 1 : 0),
        'stats.losses': (p1Stats.losses || 0) + (winnerId === roomData.player2.uid ? 1 : 0),
        'personalization.crystals': (p1Pers.crystals || 0) + p1CrystalChange,
        'personalization.elo': newEloP1,
        'personalization.level': newLevelP1
      });

      const p2Stats = p2Data.stats || {};
      const p2Pers = p2Data.personalization || {};
      const newEloP2 = Math.max(0, p2Elo + eloChangeP2);
      const newExpP2 = (p2Stats.exp || 0) + p2ExpChange;
      let newLevelP2 = p2Stats.level || 1;
      let nextLevelExpP2 = p2Stats.nextLevelExp || 1000;
      while (newExpP2 >= nextLevelExpP2) {
        newLevelP2 += 1;
        nextLevelExpP2 = newLevelP2 * 1000;
      }

      transaction.update(p2Ref, {
        'stats.elo': newEloP2,
        'stats.exp': newExpP2,
        'stats.level': newLevelP2,
        'stats.nextLevelExp': nextLevelExpP2,
        'stats.wins': (p2Stats.wins || 0) + (winnerId === roomData.player2.uid ? 1 : 0),
        'stats.losses': (p2Stats.losses || 0) + (winnerId === roomData.player1.uid ? 1 : 0),
        'personalization.crystals': (p2Pers.crystals || 0) + p2CrystalChange,
        'personalization.elo': newEloP2,
        'personalization.level': newLevelP2
      });

      transaction.update(matchRef, {
        status: 'result',
        winnerId: winnerId,
        player1EloChange: eloChangeP1,
        player2EloChange: eloChangeP2,
        player1ExpChange: p1ExpChange,
        player2ExpChange: p2ExpChange,
        player1CrystalChange: p1CrystalChange,
        player2CrystalChange: p2CrystalChange
      });

      return {
        success: true,
        winnerId,
        player1: { eloChange: eloChangeP1, expChange: p1ExpChange, crystalChange: p1CrystalChange },
        player2: { eloChange: eloChangeP2, expChange: p2ExpChange, crystalChange: p2CrystalChange }
      };
    });
  }
};

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyAuth } from '@/lib/verifyAuth';

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

const getVNTimeStr = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const vnDate = new Date(utc + (3600000 * 7));
  return vnDate.toISOString().split('T')[0];
};

export async function POST(req) {
  const uid = await verifyAuth(req);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { actionType, payload } = body;
  if (!actionType) {
    return NextResponse.json({ error: 'Missing actionType' }, { status: 400 });
  }

  const userRef = adminDb.collection('users').doc(uid);

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error('User doc not found');
      }

      const userData = userDoc.data();
      const pers = userData.personalization || {};
      const stats = userData.stats || {};
      const currentCrystals = pers.crystals !== undefined ? Number(pers.crystals) : 500;

      switch (actionType) {
        case 'SHOP_PURCHASE': {
          const { itemId } = payload || {};
          if (!itemId) {
            throw new Error('Missing itemId');
          }

          let itemPrice = 0;
          let itemName = '';
          const shopItemRef = adminDb.collection('shop_items').doc(itemId);
          const shopItemSnap = await transaction.get(shopItemRef);
          
          if (shopItemSnap.exists) {
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
          if (count !== 1 && count !== 10) {
            throw new Error('Invalid pullCount');
          }

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
          if (!questId) {
            throw new Error('Missing questId');
          }

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
          if (isNaN(level)) {
            throw new Error('Invalid milestoneLevel');
          }

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
          if (!questId || !amount) {
            throw new Error('Missing questId or amount.');
          }

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

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in crystal transaction API:', error);
    return NextResponse.json({ error: error.message || 'Transaction failed' }, { status: 500 });
  }
}

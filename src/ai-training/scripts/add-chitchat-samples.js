import fs from 'fs';
import path from 'path';

const intentSamplesPath = path.resolve('src/ai-training/datasets/intent/intent-samples.json');
const unseenSamplesPath = path.resolve('src/ai-training/datasets/intent/unseen-test-intent.json');

const trainData = JSON.parse(fs.readFileSync(intentSamplesPath, 'utf-8'));
const unseenData = JSON.parse(fs.readFileSync(unseenSamplesPath, 'utf-8'));

// Filter out old chitchat if any
const cleanTrain = trainData.filter(item => item.intent !== 'chitchat');
const cleanUnseen = unseenData.filter(item => item.intent !== 'chitchat');

const chitchatTrainTexts = [
  "Chào bạn",
  "Xin chào Javit",
  "Chào buổi sáng nhé",
  "Chào buổi chiều",
  "Chào buổi tối nha",
  "Hi NOVA",
  "Hello cậu",
  "Cảm ơn bạn nhiều",
  "Cảm ơn nhé",
  "Cảm ơn NOVA nha",
  "Cảm ơn trợ lý nhiều nhé",
  "Bạn tên là gì",
  "Tên bạn là gì vậy",
  "Bạn là ai",
  "Giới thiệu về bản thân đi",
  "Bạn bao nhiêu tuổi rồi",
  "Bạn đến từ đâu",
  "Ai tạo ra bạn",
  "Bạn do ai lập trình vậy",
  "Bạn sống ở đâu",
  "Hôm nay thế nào rồi",
  "Bạn có khỏe không",
  "Cậu khỏe không NOVA",
  "Thời tiết hôm nay thế nào",
  "Trời hôm nay có đẹp không",
  "Bạn thích làm gì nhất",
  "Bạn có thích học không",
  "Bạn có biết hát không",
  "Bạn có biết chơi game không",
  "Kể một câu chuyện cười đi",
  "Kể cho tớ nghe chuyện vui đi",
  "Tâm sự chút đi bạn",
  "Trò chuyện phiếm tí nha",
  "Bạn thông minh thật đấy",
  "Bạn giỏi quá NOVA ơi",
  "NOVA thật tuyệt vời",
  "Bạn thật là đáng yêu",
  "Chúc bạn một ngày tốt lành",
  "Chúc buổi tối vui vẻ nha",
  "Chúc ngủ ngon nhé",
  "Tạm biệt bạn",
  "Hẹn gặp lại NOVA",
  "Bye bye NOVA",
  "Tạm biệt nhé",
  "Chào nha",
  "Bạn đang làm gì đấy",
  "Có gì mới không bạn",
  "Học mệt quá bạn ơi",
  "Hôm nay tớ buồn quá",
  "Vui quá bạn ơi",
  "Thi xong rồi sướng quá",
  "Cố lên nha NOVA",
  "Chúc bạn làm việc hiệu quả",
  "Cảm ơn cậu rất nhiều",
  "NOVA ơi giúp tớ trò chuyện chút",
  "Bạn biết tiếng Anh không",
  "Bạn là con robot hả",
  "Bạn có cảm xúc không",
  "Bạn thích màu gì nhất",
  "Bạn học trường nào",
  "Bạn ăn cơm chưa",
  "Bạn uống nước chưa",
  "Nói gì vui vui đi",
  "Cậu đáng yêu thế",
  "Tôi yêu bạn NOVA",
  "Trêu bạn chút thôi hihi",
  "Hihi chào cậu nha",
  "Good night Javit",
  "Good afternoon NOVA",
  "Thank you very much",
  "Nice to meet you",
  "Có khỏe không NOVA ơi",
  "Hôm nay thế nào rồi bạn",
  "Mệt mỏi quá cậu ơi",
  "Đỡ mệt hơn rồi cảm ơn",
  "Cảm ơn bạn vì tất cả nha",
  "Thật là tuyệt vời",
  "Quá siêu luôn NOVA",
  "Rất sẵn lòng giúp bạn",
  "Hẹn mai gặp lại nhé",
  "Tạm biệt Javit nha",
  "Chào thân ái",
  "Dạo này sao rồi cậu",
  "Mọi chuyện ổn chứ bạn",
  "Cảm ơn đã hỗ trợ tớ",
  "Bạn nhiệt tình quá",
  "Độc đáo đấy NOVA",
  "Thú vị thật nha",
  "Haha buồn cười quá",
  "Ok cảm ơn bạn nha",
  "Rất vui được làm quen với bạn",
  "Chào mừng bạn đến đây"
];

const chitchatUnseenTexts = [
  "xin chao nova nhe",
  "ban ten la gi vay",
  "cam on ban rat nhieu nha",
  "hom nay thoi tiet dep qua",
  "ban co biet noi chuyen phiem khong",
  "chuc ban mot ngay vui ve",
  "tam biet nova hen gap lai",
  "ban khoe khong va lam gi do",
  "nova de thuong qua ah",
  "good morning javitt nova"
];

chitchatTrainTexts.forEach(text => {
  cleanTrain.push({
    text,
    intent: 'chitchat',
    subject: null
  });
});

chitchatUnseenTexts.forEach(text => {
  cleanUnseen.push({
    text,
    intent: 'chitchat',
    subject: null
  });
});

fs.writeFileSync(intentSamplesPath, JSON.stringify(cleanTrain, null, 2), 'utf-8');
fs.writeFileSync(unseenSamplesPath, JSON.stringify(cleanUnseen, null, 2), 'utf-8');

console.log(`✅ [Intent Dataset] Đã thêm ${chitchatTrainTexts.length} câu chitchat vào intent-samples.json (Tổng: ${cleanTrain.length})`);
console.log(`✅ [Intent Dataset] Đã thêm ${chitchatUnseenTexts.length} câu chitchat vào unseen-test-intent.json (Tổng: ${cleanUnseen.length})`);

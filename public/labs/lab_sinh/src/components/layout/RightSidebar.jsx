import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import './RightSidebar.css';

const RightSidebar = () => {
  return (
    <aside className="right-sidebar glass-panel-heavy">
      <div className="ai-header">
        <Bot size={24} color="var(--accent-green)" />
        <h2 className="ai-title">AI Lab Assistant</h2>
      </div>
      
      <div className="ai-chat-container">
        <div className="chat-message system">
          <Sparkles size={14} className="inline-icon" />
          <span>HT theo vết kiến thức đang chạy. Tín hiệu nhận thức Ổn định.</span>
        </div>
        <div className="chat-message assistant">
          Tôi đã sẵn sàng. Bạn muốn bắt đầu với mô hình tế bào nào hôm nay?
        </div>
      </div>
      
      <div className="ai-input-area">
        <input type="text" placeholder="Hỏi AI về thí nghiệm..." />
        <button className="send-btn">Gửi</button>
      </div>
    </aside>
  );
};

export default RightSidebar;

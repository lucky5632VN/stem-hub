const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/3E1A26711DBC838A76F9175867924E1F');

ws.onopen = () => {
  ws.send(JSON.stringify({ 
    id: 1, 
    method: 'Runtime.evaluate', 
    params: { 
      expression: `
        JSON.stringify({
          messages: Array.from(document.querySelectorAll('.chatbot-messages .message-bubble')).map(b => b.innerText),
          botMsgs: Array.from(document.querySelectorAll('.chatbot-messages .chatbot-message.bot')).map(b => b.innerHTML),
          isLoading: !!document.querySelector('.typing-indicator')
        })
      `,
      returnByValue: true
    } 
  }));
};

ws.onmessage = (evt) => {
  const msg = JSON.parse(evt.data);
  if (msg.id === 1) {
    console.log('TAB INSPECTION:', JSON.stringify(msg.result.result.value, null, 2));
    process.exit(0);
  }
};

import { useEffect, useState } from 'react';

type Message = {
  id: number;
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState<string>("")

  const fetchMessages = () => {
    fetch("http://127.0.0.1:8000/api/messages")
    .then(res => res.json())
    .then(data => setMessages(data));
  };

  const sendMessage = async () => {
    if (!input) return;
    await fetch("http://127.0.0.1:8000/api/messages",{
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({content: input})
    });
    setInput("");
    fetchMessages();
  }

  const deleteMessage = async (id: number) => {
    await fetch(`http://127.0.0.1:8000/api/messages/${id}`,{
      method: "DELETE",
    }); 
    await fetchMessages();
  }


  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div>
      <h1 style={{fontWeight: "bold"}}>Chat Messages</h1>
      <ul>
        {messages.map((msg: Message) => (
          <li key={msg.id}>
            {msg.content}
            <button onClick={() => deleteMessage(msg.id)}>X</button>
          </li>
        ))}
      </ul>
      <input style={{border: "1px solid black"}} value={input} onKeyDown={handleKeyPress} onChange={e => setInput(e.target.value)} />
      <button style={{border: "1px solid black"}} onClick={sendMessage}>Send</button>
    </div>
  );
}

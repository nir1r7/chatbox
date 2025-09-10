import { useEffect, useState } from 'react';
import { Message } from '@/types';

function Chat(){
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
                    <button style={{border: "1px solid red"}} onClick={() => deleteMessage(msg.id)}>X</button>
                    {msg.content}
                </li>
                ))}
            </ul>
            <input style={{border: "1px solid black"}} value={input} onKeyDown={handleKeyPress} onChange={e => setInput(e.target.value)} />
            <button style={{border: "1px solid black"}} onClick={sendMessage}>Send</button>
        </div>
    );
}

export default Chat;
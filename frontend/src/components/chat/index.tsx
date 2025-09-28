import { useEffect, useState, useCallback } from 'react';
import { Message } from '@/types';
import { useAuth } from '@/context/AuthContext';

function Chat(){
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState<string>("")
    const { user, token } = useAuth();

    const fetchMessages = useCallback(async () => {
        if (!token) return
        const res = await fetch("http://127.0.0.1:8000/api/messages/", {
            headers: {
                "Authorization" : `Bearer ${token}`
            }
        });
        const data = await res.json();
        setMessages(data);
    }, [token]);

    const sendMessage = async () => {
        if (!input) return;
        try{
            await fetch("http://127.0.0.1:8000/api/messages/",{
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({content: input})
            });
            setInput("");
            await fetchMessages();
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    }

    const deleteMessage = async (id: number) => {
        if (!token) return;

        await fetch(`http://127.0.0.1:8000/api/messages/${id}`,{
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
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
    }, [fetchMessages]);

    return (
        <div>
            <h1 style={{fontWeight: "bold"}}>Chat Messages</h1>
            <ul>
                {messages.map((msg: Message) => (
                <li key={msg.id}>
                    {msg.user && user && msg.user.id === user.id ?
                    (
                        <button
                            style={{ border: "1px solid red", marginLeft: "8px" }}
                            onClick={() => deleteMessage(msg.id)}
                        >
                        X
                        </button>
                    ) : (
                        <span style={{marginLeft: "20px"}}></span>
                    )
                }
                    {msg.user && msg.user.name}: {msg.content}
                </li>
                ))}
            </ul>
            <input style={{border: "1px solid black"}} value={input} onKeyDown={handleKeyPress} onChange={e => setInput(e.target.value)} />
            <button style={{border: "1px solid black"}} onClick={sendMessage}>Send</button>
        </div>
    );
}

export default Chat;
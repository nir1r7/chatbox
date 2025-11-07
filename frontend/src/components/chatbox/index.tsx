"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Message } from "@/types";

function ChatBox() {
  const { token, user } = useAuth();
  const [activeRoom, setActiveRoom] = useState("general");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef(true);

  // Dynamic rooms (name → id)
  const rooms: { name: string; id: number }[] = [
    { name: "general", id: 1 },
    { name: "devs", id: 2 },
    { name: "random", id: 3 },
  ];
  const roomMap: Record<string, number> = Object.fromEntries(rooms.map(r => [r.name, r.id]));
  const activeRoomId = roomMap[activeRoom];

  // Fetch chat history
  useEffect(() => {
    if (!token || !activeRoomId) return;
    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/messages/?room_id=${activeRoomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: Message[] = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };
    fetchHistory();
  }, [token, activeRoomId]);

  // WebSocket setup
useEffect(() => {
  if (!token || !activeRoom) return;

  const ws = new WebSocket(
    `ws://127.0.0.1:8000/ws/chat/${activeRoom}?token=${token}`
  );
  
  ws.onopen = () => {
    console.log(`Connected to room: ${activeRoom}`);
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === "message") {
      // Add new message to state
      setMessages((prev) => [...prev, {
        id: data.id,
        content: data.content,
        user: data.user,
        room_id: activeRoomId,
        created_at: data.created_at
      }]);
    } else if (data.type === "delete") {
      // Remove deleted message
      setMessages((prev) => prev.filter(m => m.id !== data.message_id));
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  ws.onclose = () => {
    console.log("WebSocket closed");
  };

  wsRef.current = ws;

  return () => {
    ws.close();
    wsRef.current = null;
  };
}, [token, activeRoom, activeRoomId]);

  // Auto-scroll
  useEffect(() => {
    if (!autoScrollRef.current) return;
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  // Scroll tracking
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    autoScrollRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < 50;
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // clear old messages on room change
  useEffect(() => {
    setMessages([]);
  }, [activeRoomId]);


  // Send message
  const sendMessage = useCallback(async () => {
    if (!input || !token || !activeRoomId) return;

    try {
        await fetch("http://127.0.0.1:8000/api/messages/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content: input, room_id: activeRoomId }),
        });

        setInput(""); // clear input
    } catch (err) {
        console.error("Failed to send message:", err);
    }
  }, [input, token, activeRoomId]);


  // Delete message
  const deleteMessage = useCallback(
    async (messageId: number) => {
      if (!token) return;
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/messages/${messageId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to delete message");
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } catch (err) {
        console.error("Error deleting message:", err);
      }
    },
    [token]
  );

  // Format timestamp
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();
    if (isToday) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isYesterday) return "Yesterday";
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  return (
    <div style={{ border: "1px solid black", padding: "10px", marginTop: "20px" }}>
      <h2>Live Chat — Room: {activeRoom}</h2>

      {/* Dynamic Room Selector */}
      <div style={{ marginBottom: "10px" }}>
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => setActiveRoom(room.name)}
            style={{
              fontWeight: room.name === activeRoom ? "bold" : "normal",
              marginRight: "5px",
            }}
          >
            {room.name.charAt(0).toUpperCase() + room.name.slice(1)}
          </button>
        ))}
      </div>

      <div
        ref={messagesContainerRef}
        style={{ height: "200px", overflowY: "auto", border: "1px solid gray", padding: "5px" }}
      >
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.user.name}:</strong> {msg.content}
            <span style={{ fontSize: "0.8em", color: "gray", marginLeft: "8px" }}>
              {formatTimestamp(msg.created_at)}
            </span>
            {msg.user.id === user?.id && (
              <button
                onClick={() => deleteMessage(msg.id)}
                style={{
                  marginLeft: "10px",
                  border: "none",
                  background: "transparent",
                  color: "red",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <input
        style={{ border: "1px solid black", marginTop: "10px", width: "80%" }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      />
      <button style={{ border: "1px solid black", marginLeft: "10px" }} onClick={sendMessage}>
        Send
      </button>
    </div>
  );
}

export default ChatBox;

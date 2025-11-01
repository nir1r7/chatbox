"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Message } from "@/types";

function ChatBox() {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef(true);

  // Fetch chat history
  useEffect(() => {
    if (!token) return;
    const fetchHistory = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/messages/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: Message[] = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };
    fetchHistory();
  }, [token]);

  // Setup WebSocket
  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => console.log("Connected to WebSocket");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "delete") {
          setMessages((prev) => prev.filter((m) => m.id !== data.message_id));
        } else if (data.type === "message") {
          setMessages((prev) => [...prev, data]);
        } else {
          console.warn("Unknown WebSocket event type:", data);
        }
      } catch (err) {
        console.error("Failed to parse websocket message:", err);
      }
    };

    ws.onclose = () => console.log("WebSocket connection closed");

    return () => ws.close();
  }, [token]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!autoScrollRef.current) return;
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  // Track scroll position
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

  const sendMessage = useCallback(async () => {
    if (!input || !token) return;

    try {
      // Persist via REST API
      const res = await fetch("http://127.0.0.1:8000/api/messages/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: input }),
      });
      const savedMessage: Message = await res.json();

      // Broadcast via WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(savedMessage));
      }

      setInput("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }, [input, token]);

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

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (isYesterday) {
      return "Yesterday";
    } else {
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    }
  };

  return (
    <div style={{ border: "1px solid black", padding: "10px", marginTop: "20px" }}>
      <h2>Live Chat</h2>
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
              <button onClick={() => deleteMessage(msg.id)} style={{marginLeft: "10px", border: "none", background: "transparent", color: "red", cursor: "pointer"}}>
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

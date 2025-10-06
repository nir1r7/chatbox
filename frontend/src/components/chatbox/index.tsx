"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Message } from "@/types";

function ChatBox() {
  const { token } = useAuth();
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
        const newMessage: Message = JSON.parse(event.data);
        setMessages((prev) => [...prev, newMessage]);
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

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatRealtimeEvent } from "../../hooks/useChatRealtime";
import type { ChatMessage } from "../../type/message";
import { getChatMessages } from "../../services/chat.api";
import { getUser } from "../../ultil/auth";

type RawMessage = {
  id?: string;
  _id?: string;
  clientMessageId?: string;
  senderUserId?: string;
  senderId?: string;
  userId?: string;
  sender?: {
    id?: string;
  };
  body?: string;
  content?: string;
  text?: string;
  sentAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type MessageListProps = {
  roomId: string;
  realtimeEvent?: ChatRealtimeEvent | null;
  typingUserIds?: string[];
};

const formatTime = (value?: string) =>
  new Date(value || Date.now()).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const mapMessage = (
  msg: RawMessage,
  roomId: string,
  currentUserId?: string,
): ChatMessage | null => {
  const id = msg.id || msg._id || msg.clientMessageId;
  if (!id) return null;

  const senderUserId =
    msg.senderUserId || msg.senderId || msg.userId || msg.sender?.id;

  return {
    id,
    roomId,
    sender: senderUserId === currentUserId ? "USER" : "SHOP",
    content: msg.body || msg.content || msg.text,
    createdAt: formatTime(msg.sentAt || msg.createdAt || msg.updatedAt),
    seen: true,
  };
};

export default function MessageList({
  roomId,
  realtimeEvent,
  typingUserIds = [],
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMessages = useCallback(
    async (showLoading = true) => {
      if (!roomId) return;

      try {
        if (showLoading) {
          setLoading(true);
        }

        const user = getUser();
        const data = await getChatMessages(roomId);
        const rawMessages = Array.isArray(data.messages) ? data.messages : [];

        const mappedMessages = rawMessages
          .map((msg) => mapMessage(msg as RawMessage, data.id || roomId, user?.id))
          .filter((message): message is ChatMessage => Boolean(message));

        setMessages(mappedMessages);
      } catch (error) {
        console.error(error);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [roomId],
  );

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void loadMessages();
    });
    return () => {
      active = false;
    };
  }, [loadMessages]);

  useEffect(() => {
    let active = true;
    if (!realtimeEvent) {
      return () => {
        active = false;
      };
    }

    const eventRoomId = realtimeEvent.threadId || realtimeEvent.roomId;
    if (eventRoomId !== roomId) {
      return () => {
        active = false;
      };
    }

    if (!realtimeEvent.message) {
      queueMicrotask(() => {
        if (active) void loadMessages(false);
      });
      return () => {
        active = false;
      };
    }

    const user = getUser();
    const newMessage = mapMessage(
      realtimeEvent.message as RawMessage,
      roomId,
      user?.id,
    );

    if (!newMessage || !newMessage.content) {
      queueMicrotask(() => {
        if (active) void loadMessages(false);
      });
      return () => {
        active = false;
      };
    }

    queueMicrotask(() => {
      if (!active) return;
      setMessages((current) => {
        if (current.some((message) => message.id === newMessage.id)) {
          return current;
        }

        return [...current, newMessage];
      });
    });
    return () => {
      active = false;
    };
  }, [loadMessages, realtimeEvent, roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages.length, typingUserIds.length]);

  if (loading) {
    return <div className="chat-messages" />;
  }

  return (
    <div className="chat-messages">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`chat-message-community ${
            msg.sender === "USER" ? "chat-message-user" : "chat-message-shop"
          }`}
        >
          <div className="chat-bubble">
            {msg.image && <img src={msg.image} alt="" className="chat-image" />}

            {msg.content && <p className="chat-text">{msg.content}</p>}
          </div>

          <div className="chat-meta">
            <span>{msg.createdAt}</span>

            {msg.sender === "USER" && (
              <span>{msg.seen ? "Đã xem" : "Đã gửi"}</span>
            )}
          </div>
        </div>
      ))}

      {typingUserIds.length > 0 && (
        <div className="chat-message-community chat-message-shop">
          <div className="chat-bubble">
            <p className="chat-text">Đang soạn tin...</p>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

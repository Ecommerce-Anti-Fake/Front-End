import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import "../../css/pages/message.css";
import EmptyChat from "../message/emptyChat";
import { fetchChatThreads } from "../../services/chat.api";
import type { ChatRoom } from "../../type/message";
import {
  useChatRealtime,
  type ChatRealtimeEvent,
} from "../../hooks/useChatRealtime";
import ChatWindow from "./ChatWindow";
import ConversationList from "./ConversationList";

const getChatBasePath = (pathname: string) => {
  if (pathname.startsWith("/seller")) return "/seller/chat";
  if (pathname.startsWith("/admin")) return "/admin/chat";
  return "/chat";
};

export default function ChatLayout() {
  const { roomId } = useParams();
  const location = useLocation();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [realtimeEvent, setRealtimeEvent] =
    useState<ChatRealtimeEvent | null>(null);

  const basePath = useMemo(
    () => getChatBasePath(location.pathname),
    [location.pathname],
  );

  const loadThreads = useCallback(async () => {
    try {
      const data = await fetchChatThreads();

      setRooms(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void loadThreads();
    });
    return () => {
      active = false;
    };
  }, [loadThreads]);

  const threadIds = useMemo(() => rooms.map((room) => room.id), [rooms]);

  const realtime = useChatRealtime({
    threadId: roomId || "",
    threadIds,
    onMessage: setRealtimeEvent,
    onAnyMessage: loadThreads,
    onReconnect: loadThreads,
  });

  const room = rooms.find((item) => item.id === roomId);

  return (
    <div className={`message-page ${room ? "room-open" : ""}`}>
      <ConversationList rooms={rooms} basePath={basePath} />

      <div className="message-content">
        {!room ? (
          <EmptyChat />
        ) : (
          <ChatWindow
            room={room}
            basePath={basePath}
            realtimeEvent={realtimeEvent}
            typingUserIds={realtime.typingUserIds}
            connected={realtime.connected}
            error={realtime.lastError}
            onSendMessage={realtime.sendMessage}
            onTyping={realtime.sendTyping}
          />
        )}
      </div>
    </div>
  );
}

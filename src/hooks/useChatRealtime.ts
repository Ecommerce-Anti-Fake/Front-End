import { useCallback, useEffect, useRef, useState } from "react";
import { connectSocket, socket } from "../services/socket";
import { getToken } from "../ultil/auth";


type ChatAck =
  | { ok: true; thread?: unknown; clientMessageId?: string | null }
  | { ok: false; error: string };

export type ChatRealtimeEvent = {
  threadId?: string;
  roomId?: string;
  thread?: unknown;
  message?: unknown;
};

type PresenceUpdateEvent = {
  threadId?: string;
  roomId?: string;
  userId?: string;
  online?: boolean;
  onlineUserIds?: string[];
};

type TypingEvent = {
  threadId?: string;
  roomId?: string;
  userId?: string;
  isTyping?: boolean;
};

type UseChatRealtimeOptions = {
  threadId: string;
  threadIds?: string[];
  onThreadUpdate?: (thread: unknown) => void;
  onMessage?: (event: ChatRealtimeEvent) => void;
  onAnyMessage?: (event: ChatRealtimeEvent) => void;
  onReconnect?: () => void;
};

const PRESENCE_HEARTBEAT_INTERVAL_MS = 15_000;
const MESSAGE_EVENTS = [
  "chat:message.created",
  "chat:message",
  "message:created",
  "message.created",
  "message:new",
  "new_message",
];
const DEBUG_CHAT_REALTIME = import.meta.env.DEV;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

const getString = (...values: unknown[]) => {
  const value = values.find(
    (item) => typeof item === "string" && item.trim().length > 0,
  );

  return typeof value === "string" ? value : undefined;
};

const normalizeChatEvent = (payload: unknown): ChatRealtimeEvent => {
  const root = asRecord(payload) || {};
  const data = asRecord(root.data) || asRecord(root.payload) || root;
  const message =
    data.message ||
    data.chatMessage ||
    data.data ||
    (data.body || data.content || data.text ? data : undefined);
  const messageRecord = asRecord(message);
  const thread = data.thread || data.room || messageRecord?.thread;
  const threadRecord = asRecord(thread);
  const roomRecord = asRecord(data.room);

  const threadId = getString(
    data.threadId,
    data.roomId,
    data.chatThreadId,
    data.conversationId,
    threadRecord?.id,
    roomRecord?.id,
    messageRecord?.threadId,
    messageRecord?.roomId,
    messageRecord?.chatThreadId,
    messageRecord?.conversationId,
  );

  return {
    ...data,
    threadId,
    roomId: getString(data.roomId, threadId),
    thread,
    message,
  };
};

export function useChatRealtime({
  threadId,
  threadIds = [],
  onThreadUpdate,
  onMessage,
  onAnyMessage,
  onReconnect,
}: UseChatRealtimeOptions) {
  const session = getToken();
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const threadIdRef = useRef(threadId);
  const threadIdsRef = useRef(threadIds);
  const updateRef = useRef(onThreadUpdate);
  const messageRef = useRef(onMessage);
  const anyMessageRef = useRef(onAnyMessage);
  const reconnectRef = useRef(onReconnect);
  const joinedThreadIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    threadIdRef.current = threadId;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setOnlineUserIds([]);
      setTypingUserIds([]);
    });
    return () => {
      active = false;
    };
  }, [threadId]);

  useEffect(() => {
    threadIdsRef.current = threadIds;
  }, [threadIds]);

  useEffect(() => {
    updateRef.current = onThreadUpdate;
  }, [onThreadUpdate]);

  useEffect(() => {
    messageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    anyMessageRef.current = onAnyMessage;
  }, [onAnyMessage]);

  useEffect(() => {
    reconnectRef.current = onReconnect;
  }, [onReconnect]);

  useEffect(() => {
    if (!session) {
      socket.disconnect();
      let active = true;
      queueMicrotask(() => {
        if (active) setConnected(false);
      });
      return () => {
        active = false;
      };
    }

    let heartbeatIntervalId: number | null = null;

    function emitHeartbeat() {
      socket.emit("presence:heartbeat");
    }

    function joinThread(nextThreadId?: string) {
      if (!nextThreadId || joinedThreadIdsRef.current.has(nextThreadId)) {
        return;
      }

      socket.emit("chat:join", { threadId: nextThreadId, roomId: nextThreadId }, (ack?: ChatAck) => {
        if (ack && !ack.ok) {
          setLastError(ack.error);
          return;
        }

        joinedThreadIdsRef.current.add(nextThreadId);
      });
    }

    function handleConnect() {
      setConnected(true);
      setLastError(null);
      joinedThreadIdsRef.current.clear();
      emitHeartbeat();
      heartbeatIntervalId = window.setInterval(emitHeartbeat, PRESENCE_HEARTBEAT_INTERVAL_MS);
      reconnectRef.current?.();
      joinThread(threadIdRef.current);
      threadIdsRef.current.forEach(joinThread);
    }

    function handleDisconnect() {
      setConnected(false);
      joinedThreadIdsRef.current.clear();
      if (heartbeatIntervalId !== null) {
        window.clearInterval(heartbeatIntervalId);
        heartbeatIntervalId = null;
      }
    }

    function handleConnectError(error: Error) {
      setConnected(false);
      setLastError(error.message);
    }

    function handleChatError(payload: { error?: string }) {
      if (DEBUG_CHAT_REALTIME) {
        console.log("[chat realtime:error]", payload);
      }

      setLastError(payload.error || "Chat realtime error");
    }

    function handleAnyEvent(eventName: string, ...args: unknown[]) {
      if (!DEBUG_CHAT_REALTIME) return;

      console.log("[chat realtime:any]", {
        eventName,
        args,
        currentThreadId: threadIdRef.current,
      });
    }

    function handleMessageCreated(eventName: string, event: ChatRealtimeEvent) {
      const normalizedEvent = normalizeChatEvent(event);
      const eventThreadId = normalizedEvent.threadId || normalizedEvent.roomId;

      if (DEBUG_CHAT_REALTIME) {
        console.log("[chat realtime:message]", {
          eventName,
          raw: event,
          normalized: normalizedEvent,
          eventThreadId,
          currentThreadId: threadIdRef.current,
          isCurrentRoom: eventThreadId === threadIdRef.current,
        });
      }

      anyMessageRef.current?.(normalizedEvent);

      if (eventThreadId === threadIdRef.current) {
        if (normalizedEvent.thread) {
          updateRef.current?.(normalizedEvent.thread);
        }
        messageRef.current?.(normalizedEvent);
      }
    }

    function handlePresenceUpdate(event: PresenceUpdateEvent) {
      const eventThreadId = event.threadId || event.roomId;
      if (eventThreadId !== threadIdRef.current) {
        return;
      }

      if (event.onlineUserIds) {
        setOnlineUserIds(event.onlineUserIds);
        return;
      }

      if (event.userId) {
        setOnlineUserIds((current) => {
          const next = new Set(current);
          if (event.online === false) {
            next.delete(String(event.userId));
          } else {
            next.add(String(event.userId));
          }
          return Array.from(next);
        });
      }
    }

    function handleTyping(event: TypingEvent) {
      const eventThreadId = event.threadId || event.roomId;

      if (DEBUG_CHAT_REALTIME) {
        console.log("[chat realtime:typing]", {
          raw: event,
          eventThreadId,
          currentThreadId: threadIdRef.current,
          isCurrentRoom: eventThreadId === threadIdRef.current,
        });
      }

      if (eventThreadId !== threadIdRef.current || !event.userId) {
        return;
      }

      setTypingUserIds((current) => {
        const next = new Set(current);
        if (event.isTyping) {
          next.add(String(event.userId));
        } else {
          next.delete(String(event.userId));
        }
        return Array.from(next);
      });
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("chat:error", handleChatError);
    socket.onAny(handleAnyEvent);

    const messageHandlers = MESSAGE_EVENTS.map((eventName) => {
      const handler = (event: ChatRealtimeEvent) =>
        handleMessageCreated(eventName, event);

      socket.on(eventName, handler);
      return {
        eventName,
        handler,
      };
    });
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("chat:typing", handleTyping);

    connectSocket();

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      if (heartbeatIntervalId !== null) {
        window.clearInterval(heartbeatIntervalId);
      }
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("chat:error", handleChatError);
      socket.offAny(handleAnyEvent);
      messageHandlers.forEach(({ eventName, handler }) => {
        socket.off(eventName, handler);
      });
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("chat:typing", handleTyping);
    };
  }, [session]);

  useEffect(() => {
    if (!threadId || !socket.connected || joinedThreadIdsRef.current.has(threadId)) {
      return;
    }

    socket.emit("chat:join", { threadId, roomId: threadId }, (ack?: ChatAck) => {
      if (ack && !ack.ok) {
        setLastError(ack.error);
        return;
      }

      joinedThreadIdsRef.current.add(threadId);
    });
  }, [threadId]);

  useEffect(() => {
    if (!socket.connected) {
      return;
    }

    threadIds.forEach((nextThreadId) => {
      if (!nextThreadId || joinedThreadIdsRef.current.has(nextThreadId)) {
        return;
      }

      socket.emit("chat:join", { threadId: nextThreadId, roomId: nextThreadId }, (ack?: ChatAck) => {
        if (ack && !ack.ok) {
          setLastError(ack.error);
          return;
        }

        joinedThreadIdsRef.current.add(nextThreadId);
      });
    });
  }, [threadIds]);

  const sendMessage = useCallback(
    (body: string, clientMessageId: string) =>
      new Promise<{ thread: unknown; clientMessageId: string } | null>((resolve, reject) => {
        if (!threadId || !socket.connected) {
          resolve(null);
          return;
        }

        socket.timeout(8000).emit(
          "chat:send",
          {
            threadId,
            roomId: threadId,
            body,
            content: body,
            clientMessageId,
          },
          (error: Error | null, ack?: ChatAck) => {
            if (error) {
              reject(error);
              return;
            }
            if (!ack?.ok) {
              reject(new Error(ack?.error || "Chat send failed"));
              return;
            }
            resolve({ thread: ack.thread, clientMessageId });
          },
        );
      }),
    [threadId],
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!threadId || !socket.connected) {
        return;
      }

      socket.emit("chat:typing", { threadId, roomId: threadId, isTyping });
    },
    [threadId],
  );

  return {
    connected,
    lastError,
    onlineUserIds,
    typingUserIds,
    sendMessage,
    sendTyping,
  };
}

import { useCallback, useEffect, useState } from "react";
import {
  getLiveReactionAggregate,
  getLiveSession,
  listLiveComments,
  type LiveComment,
  type LiveReactionAggregate,
  type LiveSession,
} from "../services/live.api";
import { connectLiveSocket, socket } from "../services/socket";
import { isPinnedOfferEventForSession } from "../services/live-offer";
import { getToken } from "../ultil/auth";

type LiveAck =
  | { ok: true; comment?: LiveComment; aggregate?: LiveReactionAggregate }
  | { ok: false; error: string };

const emptyAggregate = (sessionId: string): LiveReactionAggregate => ({
  liveSessionId: sessionId,
  totals: { LIKE: 0, LOVE: 0, WOW: 0, FIRE: 0 },
  total: 0,
});

export function useLiveRealtime(
  sessionId: string,
  onSessionChanged?: (session: LiveSession) => void,
) {
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [reactions, setReactions] = useState<LiveReactionAggregate>(
    emptyAggregate(sessionId),
  );
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const canInteract = Boolean(getToken());

  const recoverSession = useCallback(async () => {
    if (!sessionId || !onSessionChanged) return;
    onSessionChanged(await getLiveSession(sessionId));
  }, [onSessionChanged, sessionId]);

  const recover = useCallback(async () => {
    if (!sessionId) return;
    try {
      const [commentItems, aggregate] = await Promise.all([
        listLiveComments(sessionId),
        getLiveReactionAggregate(sessionId),
        recoverSession(),
      ]);
      setComments(commentItems);
      setReactions(aggregate);
      setError("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tải tương tác trực tiếp",
      );
    }
  }, [recoverSession, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    let heartbeatId: number | undefined;

    const join = () => {
      socket.emit(
        "live:join",
        { liveSessionId: sessionId },
        (ack?: LiveAck) => {
          if (ack && !ack.ok) setError(ack.error);
        },
      );
    };
    const onConnect = () => {
      setConnected(true);
      join();
      void recover();
      heartbeatId = window.setInterval(
        () => socket.emit("presence:heartbeat"),
        15_000,
      );
    };
    const onDisconnect = () => {
      setConnected(false);
      if (heartbeatId) window.clearInterval(heartbeatId);
    };
    const onComment = (event: { comment?: LiveComment }) => {
      if (!event.comment || event.comment.sessionId !== sessionId) return;
      setComments((current) =>
        current.some((item) => item.id === event.comment?.id)
          ? current
          : [...current, event.comment as LiveComment],
      );
    };
    const onAggregate = (aggregate: LiveReactionAggregate) => {
      if (aggregate.liveSessionId === sessionId) setReactions(aggregate);
    };
    const onReaction = (event: {
      liveSessionId?: string;
      aggregate?: LiveReactionAggregate;
    }) => {
      if (event.liveSessionId === sessionId && event.aggregate) {
        setReactions(event.aggregate);
      }
    };
    const onOfferPinned = (event: { sessionId?: string }) => {
      if (isPinnedOfferEventForSession(sessionId, event)) {
        void recoverSession();
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("live:comment.created", onComment);
    socket.on("live:reaction.aggregate", onAggregate);
    socket.on("live:reaction.created", onReaction);
    socket.on("live:offer-pinned", onOfferPinned);
    connectLiveSocket();
    if (socket.connected) onConnect();
    const recoveryId = window.setTimeout(() => void recover(), 0);

    return () => {
      window.clearTimeout(recoveryId);
      if (heartbeatId) window.clearInterval(heartbeatId);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("live:comment.created", onComment);
      socket.off("live:reaction.aggregate", onAggregate);
      socket.off("live:reaction.created", onReaction);
      socket.off("live:offer-pinned", onOfferPinned);
    };
  }, [recover, recoverSession, sessionId]);

  const sendComment = useCallback(
    (body: string) =>
      new Promise<void>((resolve, reject) => {
        if (!canInteract || !socket.connected) {
          reject(new Error("Đăng nhập để bình luận"));
          return;
        }
        socket.timeout(8_000).emit(
          "live:comment",
          {
            liveSessionId: sessionId,
            body,
            clientMessageId: crypto.randomUUID(),
          },
          (timeoutError: Error | null, ack?: LiveAck) => {
            if (timeoutError) {
              reject(timeoutError);
              return;
            }
            if (!ack || !ack.ok) {
              reject(
                new Error(
                  ack && !ack.ok ? ack.error : "Gửi bình luận thất bại",
                ),
              );
              return;
            }
            resolve();
          },
        );
      }),
    [canInteract, sessionId],
  );

  const sendReaction = useCallback(
    (reactionType: "LIKE" | "LOVE" | "WOW" | "FIRE") => {
      if (!canInteract || !socket.connected) return;
      socket.emit("live:reaction", { liveSessionId: sessionId, reactionType });
    },
    [canInteract, sessionId],
  );

  return {
    comments,
    reactions,
    connected,
    error,
    canInteract,
    sendComment,
    sendReaction,
    recover,
  };
}

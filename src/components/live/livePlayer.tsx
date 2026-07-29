import AgoraRTC, {
  type IAgoraRTCClient,
  type IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import { Radio, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  joinLiveSession,
  type AgoraRtcAccess,
  type LiveSession,
} from "../../services/live.api";
import {
  getOrCreateLiveRtcClientId,
  isCompatibleRtcAccess,
} from "../../services/live-rtc";

const statusText = {
  SCHEDULED: "Sắp diễn ra",
  LIVE: "Đang phát",
  ENDED: "Đã kết thúc",
  CANCELLED: "Đã hủy",
} as const;

type PlayerState =
  | "joining"
  | "waiting"
  | "playing"
  | "reconnecting"
  | "renewing"
  | "error";

const playerMessage: Record<PlayerState, string> = {
  joining: "Đang kết nối livestream...",
  waiting: "Đang chờ shop bắt đầu phát",
  playing: "",
  reconnecting: "Đang kết nối lại...",
  renewing: "Đang gia hạn phiên xem...",
  error: "Không thể phát livestream",
};

export default function LivePlayer({ session }: { session: LiveSession }) {
  const navigate = useNavigate();
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>("joining");
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session.status !== "LIVE") return;

    const abortController = new AbortController();
    const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
    const clientId = getOrCreateLiveRtcClientId();
    const videoContainer = videoContainerRef.current;
    let access: AgoraRtcAccess | null = null;
    let disposed = false;
    let rejoining = false;
    let renewal: Promise<void> | null = null;
    let remoteVideoUid: string | number | null = null;
    clientRef.current = client;

    const showError = (requestError: unknown) => {
      if (disposed || abortController.signal.aborted) return;
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể kết nối tới livestream",
      );
      setPlayerState("error");
    };

    const onUserPublished = async (
      user: IAgoraRTCRemoteUser,
      mediaType: "audio" | "video" | "datachannel",
    ) => {
      if (mediaType === "datachannel") return;
      try {
        await client.subscribe(user, mediaType);
        if (disposed) return;
        if (mediaType === "video" && user.videoTrack && videoContainer) {
          remoteVideoUid = user.uid;
          user.videoTrack.play(videoContainer);
          setHasRemoteVideo(true);
          setPlayerState("playing");
        }
        if (mediaType === "audio" && user.audioTrack) {
          user.audioTrack.play();
        }
      } catch (subscribeError) {
        showError(subscribeError);
      }
    };

    const onUserUnpublished = (
      user: IAgoraRTCRemoteUser,
      mediaType: "audio" | "video" | "datachannel",
    ) => {
      if (disposed) return;
      if (mediaType === "video" && user.uid === remoteVideoUid) {
        remoteVideoUid = null;
        setHasRemoteVideo(false);
        if (!disposed) setPlayerState("waiting");
      }
    };

    const onUserLeft = (user: IAgoraRTCRemoteUser) => {
      if (disposed) return;
      if (user.uid !== remoteVideoUid) return;
      remoteVideoUid = null;
      setHasRemoteVideo(false);
      if (!disposed) setPlayerState("waiting");
    };

    const onConnectionStateChange = (state: string) => {
      if (disposed) return;
      if (state === "RECONNECTING") setPlayerState("reconnecting");
      if (state === "CONNECTED") {
        setPlayerState(remoteVideoUid === null ? "waiting" : "playing");
      }
      if (state === "DISCONNECTED" && !rejoining) {
        setError("Đã mất kết nối tới livestream");
        setPlayerState("error");
      }
    };

    const renewAccess = (forceRejoin: boolean) => {
      if (renewal) return renewal;
      renewal = (async () => {
        if (!access || disposed) return;
        setPlayerState("renewing");
        const renewed = await joinLiveSession(
          session.id,
          clientId,
          "SUBSCRIBER",
        );
        if (disposed) return;
        if (!isCompatibleRtcAccess(access, renewed)) {
          throw new Error("Thông tin gia hạn Agora không khớp phiên đang xem");
        }
        if (forceRejoin) {
          rejoining = true;
          remoteVideoUid = null;
          setHasRemoteVideo(false);
          await client.leave();
          await client.join(
            renewed.appId,
            renewed.channelName,
            renewed.token,
            renewed.uid,
          );
          rejoining = false;
        } else {
          await client.renewToken(renewed.token);
        }
        access = renewed;
        if (!disposed) {
          setPlayerState(remoteVideoUid === null ? "waiting" : "playing");
        }
      })()
        .catch(showError)
        .finally(() => {
          renewal = null;
          rejoining = false;
        });
      return renewal;
    };

    const onTokenWillExpire = () => void renewAccess(false);
    const onTokenDidExpire = () => void renewAccess(true);
    const onAutoplayFailed = () => {
      if (!disposed) setAutoplayBlocked(true);
    };

    client.on("user-published", onUserPublished);
    client.on("user-unpublished", onUserUnpublished);
    client.on("user-left", onUserLeft);
    client.on("connection-state-change", onConnectionStateChange);
    client.on("token-privilege-will-expire", onTokenWillExpire);
    client.on("token-privilege-did-expire", onTokenDidExpire);
    AgoraRTC.on("autoplay-failed", onAutoplayFailed);

    void (async () => {
      try {
        if (!AgoraRTC.checkSystemRequirements()) {
          throw new Error("Trình duyệt này không hỗ trợ Agora WebRTC");
        }
        const nextAccess = await joinLiveSession(
          session.id,
          clientId,
          "SUBSCRIBER",
          abortController.signal,
        );
        access = nextAccess;
        await client.setClientRole("audience");
        await client.join(
          nextAccess.appId,
          nextAccess.channelName,
          nextAccess.token,
          nextAccess.uid,
        );
        if (disposed) {
          await client.leave();
          return;
        }
        setError("");
        setPlayerState("waiting");
      } catch (joinError) {
        showError(joinError);
      }
    })();

    return () => {
      disposed = true;
      abortController.abort();
      client.off("user-published", onUserPublished);
      client.off("user-unpublished", onUserUnpublished);
      client.off("user-left", onUserLeft);
      client.off("connection-state-change", onConnectionStateChange);
      client.off("token-privilege-will-expire", onTokenWillExpire);
      client.off("token-privilege-did-expire", onTokenDidExpire);
      AgoraRTC.off("autoplay-failed", onAutoplayFailed);
      if (clientRef.current === client) clientRef.current = null;
      videoContainer?.replaceChildren();
      void client.leave().catch(() => undefined);
    };
  }, [session.id, session.status]);

  const resumeAudio = () => {
    AgoraRTC.resumeAudioContext();
    for (const user of clientRef.current?.remoteUsers ?? []) {
      user.audioTrack?.play();
    }
    setAutoplayBlocked(false);
  };

  const inactiveMessage =
    session.status === "SCHEDULED"
      ? "Livestream chưa bắt đầu"
      : session.status === "ENDED"
        ? "Livestream đã kết thúc"
        : "Livestream đã bị hủy";

  return (
    <section className="live-player" aria-label="Video livestream">
      {session.status === "LIVE" ? (
        <>
          <div ref={videoContainerRef} className="live-player-video" />
          {!hasRemoteVideo && (
            <div
              className="live-player-placeholder live-player-overlay"
              role="status"
              aria-live="polite"
            >
              {session.coverUrl ? <img src={session.coverUrl} alt="" /> : <Radio size={44} />}
              <strong>{error || playerMessage[playerState]}</strong>
            </div>
          )}
          {autoplayBlocked && (
            <button className="live-player-audio-button" onClick={resumeAudio}>
              <Volume2 size={17} /> Bật âm thanh
            </button>
          )}
        </>
      ) : (
        <div className="live-player-placeholder">
          {session.coverUrl ? <img src={session.coverUrl} alt="" /> : <Radio size={44} />}
          <strong>{inactiveMessage}</strong>
          {session.status === "SCHEDULED" && (
            <span>{new Date(session.startAt).toLocaleString("vi-VN")}</span>
          )}
        </div>
      )}

      <div className="stream-live-header">
        <button
          className="stream-live-close-btn"
          onClick={() => navigate(-1)}
          aria-label="Quay lại"
        >
          <X size={16} />
        </button>
        <div className={`stream-live-badge ${session.status.toLowerCase()}`}>
          {session.status === "LIVE" && <span className="stream-live-dot" />}
          <div className="stream-live-info">{statusText[session.status]}</div>
        </div>
      </div>
    </section>
  );
}

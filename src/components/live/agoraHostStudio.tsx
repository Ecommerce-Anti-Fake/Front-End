import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Play,
  Radio,
  RefreshCw,
  Square,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  getLiveSession,
  joinLiveSession,
  startLiveSession,
  updateLiveSessionStatus,
  type AgoraRtcAccess,
  type LiveSession,
} from "../../services/live.api";
import {
  getLiveMediaErrorMessage,
  getOrCreateLiveRtcClientId,
  isCompatibleRtcAccess,
  shouldKeepPublishingAfterStartFailure,
} from "../../services/live-rtc";

type Props = {
  session: LiveSession;
  onClose: () => void;
  onSessionChanged: (session: LiveSession) => void | Promise<void>;
};

type StudioState =
  | "preparing"
  | "ready"
  | "publishing"
  | "live"
  | "reconnecting"
  | "renewing"
  | "error";

type HostRuntime = {
  access: AgoraRtcAccess;
  clientId: string;
  client: IAgoraRTCClient;
  audioTrack: IMicrophoneAudioTrack | null;
  videoTrack: ICameraVideoTrack | null;
  signal: AbortSignal;
  published: boolean;
  disposed: boolean;
  dispose: () => Promise<void>;
};

const stateText: Record<StudioState, string> = {
  preparing: "Đang chuẩn bị camera và micro...",
  ready: "Bản xem trước đã sẵn sàng",
  publishing: "Đang bắt đầu phát...",
  live: "Đang phát trực tiếp",
  reconnecting: "Đang kết nối lại...",
  renewing: "Đang gia hạn phiên phát...",
  error: "Không thể mở studio",
};

export default function AgoraHostStudio({
  session,
  onClose,
  onSessionChanged,
}: Props) {
  const previewRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<HostRuntime | null>(null);
  const [initialStatus] = useState(session.status);
  const [studioState, setStudioState] = useState<StudioState>("preparing");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [broadcasting, setBroadcasting] = useState(initialStatus === "LIVE");

  useEffect(() => {
    const abortController = new AbortController();
    const clientId = getOrCreateLiveRtcClientId();
    const previewElement = previewRef.current;
    let runtime: HostRuntime | null = null;
    let renewal: Promise<void> | null = null;
    let rejoining = false;
    let active = true;

    const showError = (requestError: unknown) => {
      if (!active || abortController.signal.aborted) return;
      setError(getLiveMediaErrorMessage(requestError));
      setStudioState("error");
    };

    const setup = async () => {
      try {
        if (!AgoraRTC.checkSystemRequirements()) {
          throw new Error("Trình duyệt này không hỗ trợ Agora WebRTC");
        }
        const access = await joinLiveSession(
          session.id,
          clientId,
          abortController.signal,
        );
        if (access.role !== "PUBLISHER") {
          throw new Error("Tài khoản không được cấp quyền publisher");
        }
        if (!active) return;

        const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
        runtime = {
          access,
          clientId,
          client,
          audioTrack: null,
          videoTrack: null,
          signal: abortController.signal,
          published: false,
          disposed: false,
          dispose: async () => {
            if (!runtime || runtime.disposed) return;
            runtime.disposed = true;
            if (runtime.published) {
              await runtime.client
                .unpublish(
                  [runtime.audioTrack, runtime.videoTrack].filter(
                    (
                      track,
                    ): track is IMicrophoneAudioTrack | ICameraVideoTrack =>
                      Boolean(track),
                  ),
                )
                .catch(() => undefined);
              runtime.published = false;
            }
            await runtime.client.leave().catch(() => undefined);
            runtime.audioTrack?.stop();
            runtime.audioTrack?.close();
            runtime.videoTrack?.stop();
            runtime.videoTrack?.close();
          },
        };
        runtimeRef.current = runtime;

        const restoreStudioState = () => {
          if (!runtime || runtime.disposed) return;
          setBroadcasting(runtime.published);
          setStudioState(runtime.published ? "live" : "ready");
        };

        const renewAccess = (forceRejoin: boolean) => {
          if (!runtime) return Promise.resolve();
          if (renewal) return renewal;
          renewal = (async () => {
            if (!runtime || runtime.disposed) return;
            setStudioState("renewing");
            const renewed = await joinLiveSession(
              session.id,
              runtime.clientId,
            );
            if (runtime.disposed) return;
            if (!isCompatibleRtcAccess(runtime.access, renewed)) {
              throw new Error("Thông tin gia hạn Agora không khớp studio");
            }
            if (forceRejoin) {
              const shouldRepublish = runtime.published;
              rejoining = true;
              if (shouldRepublish) {
                await runtime.client
                  .unpublish(
                    [runtime.audioTrack, runtime.videoTrack].filter(
                      (
                        track,
                      ): track is IMicrophoneAudioTrack | ICameraVideoTrack =>
                        Boolean(track),
                    ),
                  )
                  .catch(() => undefined);
                runtime.published = false;
              }
              await runtime.client.leave();
              await runtime.client.join(
                renewed.appId,
                renewed.channelName,
                renewed.token,
                renewed.uid,
              );
              if (
                shouldRepublish &&
                runtime.audioTrack &&
                runtime.videoTrack
              ) {
                await runtime.client.publish([
                  runtime.audioTrack,
                  runtime.videoTrack,
                ]);
                runtime.published = true;
              }
              rejoining = false;
            } else {
              await runtime.client.renewToken(renewed.token);
            }
            runtime.access = renewed;
            restoreStudioState();
          })()
            .catch(showError)
            .finally(() => {
              renewal = null;
              rejoining = false;
            });
          return renewal;
        };

        const onConnectionStateChange = (state: string) => {
          if (!active || runtime?.disposed) return;
          if (state === "RECONNECTING") setStudioState("reconnecting");
          if (state === "CONNECTED") restoreStudioState();
          if (state === "DISCONNECTED" && !rejoining) {
            showError(new Error("Đã mất kết nối tới Agora"));
          }
        };
        const onTokenWillExpire = () => void renewAccess(false);
        const onTokenDidExpire = () => void renewAccess(true);

        client.on("connection-state-change", onConnectionStateChange);
        client.on("token-privilege-will-expire", onTokenWillExpire);
        client.on("token-privilege-did-expire", onTokenDidExpire);

        const [audioTrack, videoTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();
        if (!runtime || runtime.disposed || !active) {
          audioTrack.stop();
          audioTrack.close();
          videoTrack.stop();
          videoTrack.close();
          return;
        }
        runtime.audioTrack = audioTrack;
        runtime.videoTrack = videoTrack;
        if (previewElement) videoTrack.play(previewElement);

        await client.setClientRole("host");
        await client.join(
          access.appId,
          access.channelName,
          access.token,
          access.uid,
        );
        if (!active || runtime.disposed) {
          await runtime.dispose();
          return;
        }

        if (initialStatus === "LIVE") {
          await client.publish([audioTrack, videoTrack]);
          runtime.published = true;
          setBroadcasting(true);
          setStudioState("live");
        } else {
          setStudioState("ready");
        }
        setError("");

        const originalDispose = runtime.dispose;
        runtime.dispose = async () => {
          client.off("connection-state-change", onConnectionStateChange);
          client.off("token-privilege-will-expire", onTokenWillExpire);
          client.off("token-privilege-did-expire", onTokenDidExpire);
          await originalDispose();
        };
      } catch (setupError) {
        if (runtime) await runtime.dispose();
        showError(setupError);
      }
    };

    void setup();
    return () => {
      active = false;
      abortController.abort();
      if (runtimeRef.current === runtime) runtimeRef.current = null;
      previewElement?.replaceChildren();
      if (runtime) void runtime.dispose();
    };
  }, [initialStatus, session.id]);

  const startBroadcast = async () => {
    const runtime = runtimeRef.current;
    if (
      !runtime ||
      runtime.disposed ||
      !runtime.audioTrack ||
      !runtime.videoTrack
    ) {
      return;
    }
    setActionPending(true);
    setError("");
    setWarning("");
    setStudioState("publishing");
    try {
      await runtime.client.publish([runtime.audioTrack, runtime.videoTrack]);
      if (runtime.disposed) {
        await runtime.client
          .unpublish([runtime.audioTrack, runtime.videoTrack])
          .catch(() => undefined);
        return;
      }
      runtime.published = true;
      let updated: LiveSession;
      try {
        updated = await startLiveSession(session.id, runtime.signal);
      } catch (startError) {
        let canonicalSession: LiveSession | undefined;
        try {
          canonicalSession = await getLiveSession(session.id, runtime.signal);
        } catch {
          canonicalSession = undefined;
        }
        if (runtime.disposed) return;
        if (
          shouldKeepPublishingAfterStartFailure(canonicalSession?.status) &&
          canonicalSession
        ) {
          setBroadcasting(true);
          setStudioState("live");
          setWarning(
            "Phiên đã LIVE; trạng thái bắt đầu đang được hệ thống đồng bộ.",
          );
          try {
            await onSessionChanged(canonicalSession);
          } catch {
            setWarning(
              "Phiên đã LIVE; danh sách phiên đang chờ đồng bộ.",
            );
          }
          return;
        }
        await runtime.client
          .unpublish([runtime.audioTrack, runtime.videoTrack])
          .catch(() => undefined);
        runtime.published = false;
        setBroadcasting(false);
        if (runtime.disposed) return;
        throw startError;
      }
      setBroadcasting(true);
      setStudioState("live");
      try {
        await onSessionChanged(updated);
      } catch {
        setError("Đang phát, nhưng chưa thể làm mới danh sách phiên");
      }
    } catch (publishError) {
      if (runtime.disposed) return;
      setError(
        publishError instanceof Error
          ? publishError.message
          : "Không thể bắt đầu phát",
      );
      setStudioState("ready");
    } finally {
      if (!runtime.disposed) setActionPending(false);
    }
  };

  const endBroadcast = async () => {
    const runtime = runtimeRef.current;
    setActionPending(true);
    setError("");
    setWarning("");
    try {
      const updated = await updateLiveSessionStatus(
        session.id,
        "ENDED",
        runtime?.signal,
      );
      setBroadcasting(false);
      await runtimeRef.current?.dispose();
      await Promise.resolve(onSessionChanged(updated)).catch(() => undefined);
      onClose();
    } catch (endError) {
      if (runtime?.disposed) return;
      setError(
        endError instanceof Error
          ? endError.message
          : "Không thể kết thúc livestream",
      );
    } finally {
      if (!runtime?.disposed) setActionPending(false);
    }
  };

  const retryStartSynchronization = async () => {
    const runtime = runtimeRef.current;
    if (!runtime || runtime.disposed || !runtime.published) return;
    setActionPending(true);
    try {
      const updated = await startLiveSession(session.id, runtime.signal);
      setWarning("");
      await Promise.resolve(onSessionChanged(updated)).catch(() => {
        setWarning("Phiên đã LIVE; danh sách phiên đang chờ đồng bộ.");
      });
    } catch {
      if (!runtime.disposed) {
        setWarning(
          "Phiên vẫn LIVE; hệ thống chưa hoàn tất thông báo bắt đầu. Hãy thử lại.",
        );
      }
    } finally {
      if (!runtime.disposed) setActionPending(false);
    }
  };

  const toggleMicrophone = async () => {
    const track = runtimeRef.current?.audioTrack;
    if (!track) return;
    const nextEnabled = !microphoneEnabled;
    await track.setEnabled(nextEnabled);
    setMicrophoneEnabled(nextEnabled);
  };

  const toggleCamera = async () => {
    const track = runtimeRef.current?.videoTrack;
    if (!track) return;
    const nextEnabled = !cameraEnabled;
    await track.setEnabled(nextEnabled);
    setCameraEnabled(nextEnabled);
  };

  const closeStudio = () => {
    if (
      runtimeRef.current?.published &&
      !window.confirm(
        "Đóng studio sẽ ngắt camera và micro, nhưng phiên vẫn ở trạng thái LIVE. Tiếp tục?",
      )
    ) {
      return;
    }
    onClose();
  };

  return (
    <aside
      className="seller-live-studio"
      role="dialog"
      aria-labelledby="agora-studio-title"
    >
      <header>
        <div>
          <span className="seller-live-kicker">
            <Radio size={15} /> AGORA STUDIO
          </span>
          <h2 id="agora-studio-title">{session.title}</h2>
        </div>
        <button
          type="button"
          onClick={closeStudio}
          disabled={actionPending}
          aria-label="Đóng studio"
        >
          <X size={18} />
        </button>
      </header>

      <div className="seller-live-studio-preview">
        <div ref={previewRef} />
        {studioState === "preparing" && <span>Đang mở thiết bị...</span>}
      </div>

      <div
        className={`seller-live-studio-state ${studioState}`}
        role="status"
        aria-live="polite"
      >
        {stateText[studioState]}
      </div>
      {error && (
        <p className="seller-live-studio-error" role="alert">
          {error}
        </p>
      )}
      {warning && (
        <p className="seller-live-studio-warning" role="status">
          {warning}
        </p>
      )}

      <div className="seller-live-studio-controls">
        {broadcasting && warning && (
          <button
            type="button"
            onClick={() => void retryStartSynchronization()}
            disabled={actionPending}
          >
            <RefreshCw size={16} /> Đồng bộ lại
          </button>
        )}
        <button
          type="button"
          onClick={() => void toggleMicrophone()}
          disabled={studioState === "preparing" || studioState === "error"}
          aria-label={microphoneEnabled ? "Tắt micro" : "Bật micro"}
        >
          {microphoneEnabled ? <Mic size={17} /> : <MicOff size={17} />}
          {microphoneEnabled ? "Micro" : "Đã tắt"}
        </button>
        <button
          type="button"
          onClick={() => void toggleCamera()}
          disabled={studioState === "preparing" || studioState === "error"}
          aria-label={cameraEnabled ? "Tắt camera" : "Bật camera"}
        >
          {cameraEnabled ? <Camera size={17} /> : <CameraOff size={17} />}
          {cameraEnabled ? "Camera" : "Đã tắt"}
        </button>

        {broadcasting ? (
          <button
            type="button"
            className="danger"
            onClick={() => void endBroadcast()}
            disabled={actionPending}
          >
            <Square size={15} /> Kết thúc
          </button>
        ) : (
          <button
            type="button"
            className="primary"
            onClick={() => void startBroadcast()}
            disabled={studioState !== "ready" || actionPending}
          >
            <Play size={16} /> Bắt đầu phát
          </button>
        )}
      </div>
    </aside>
  );
}

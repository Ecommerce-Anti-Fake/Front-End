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
  heartbeatLivePublisherLease,
  joinLiveSession,
  releaseLivePublisherLease,
  startLiveSession,
  updateLiveSessionStatus,
  type AgoraRtcAccess,
  type LiveSession,
} from "../../services/live.api";
import {
  createPreparationGate,
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
  | "idle"
  | "preparing"
  | "ready"
  | "publishing"
  | "live"
  | "reconnecting"
  | "renewing"
  | "ending"
  | "error";

type HostRuntime = {
  access: AgoraRtcAccess;
  clientId: string;
  client: IAgoraRTCClient;
  audioTrack: IMicrophoneAudioTrack | null;
  videoTrack: ICameraVideoTrack | null;
  published: boolean;
  intendedToPublish: boolean;
  disposed: boolean;
  heartbeatId?: number;
  heartbeatPending: boolean;
  renewPromise: Promise<void> | null;
  reconnectPromise: Promise<void> | null;
  onConnectionStateChange?: (state: string) => void;
  onTokenWillExpire?: () => void;
  onTokenDidExpire?: () => void;
};

const stateText: Record<StudioState, string> = {
  idle: "Studio chưa sử dụng camera và micro",
  preparing: "Đang chuẩn bị camera và micro...",
  ready: "Bản xem trước đã sẵn sàng",
  publishing: "Đang bắt đầu phát...",
  live: "Đang phát trực tiếp",
  reconnecting: "Đang kết nối và phát lại...",
  renewing: "Đang gia hạn phiên phát...",
  ending: "Đang đóng thiết bị và kết thúc phiên...",
  error: "Studio cần được xử lý",
};

const reconnectBackoffMs = [1_000, 2_000, 4_000];

function tracks(runtime: HostRuntime) {
  return [runtime.audioTrack, runtime.videoTrack].filter(
    (
      track,
    ): track is IMicrophoneAudioTrack | ICameraVideoTrack => Boolean(track),
  );
}

function wait(delayMs: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, delayMs));
}

export default function AgoraHostStudio({
  session,
  onClose,
  onSessionChanged,
}: Props) {
  const previewRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<HostRuntime | null>(null);
  const disposeRuntimeRef = useRef<
    (runtime: HostRuntime, releaseLease?: boolean) => Promise<void>
  >(async () => undefined);
  const activeRef = useRef(true);
  const [initialStatus] = useState(session.status);
  const [studioState, setStudioState] = useState<StudioState>("idle");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [pendingEndFinalization, setPendingEndFinalization] = useState(false);
  const preparationGateRef = useRef(
    createPreparationGate(prepareStudioRuntime),
  );

  function setRuntimeState(runtime: HostRuntime) {
    if (!activeRef.current || runtime.disposed) return;
    setBroadcasting(runtime.published);
    setStudioState(runtime.published ? "live" : "ready");
  }

  async function disposeRuntime(
    runtime: HostRuntime,
    releaseLease = true,
  ): Promise<void> {
    if (runtime.disposed) return;
    runtime.disposed = true;
    if (runtime.heartbeatId) window.clearInterval(runtime.heartbeatId);
    if (runtime.onConnectionStateChange) {
      runtime.client.off(
        "connection-state-change",
        runtime.onConnectionStateChange,
      );
    }
    if (runtime.onTokenWillExpire) {
      runtime.client.off(
        "token-privilege-will-expire",
        runtime.onTokenWillExpire,
      );
    }
    if (runtime.onTokenDidExpire) {
      runtime.client.off(
        "token-privilege-did-expire",
        runtime.onTokenDidExpire,
      );
    }

    const localTracks = tracks(runtime);
    if (runtime.published && localTracks.length) {
      await runtime.client.unpublish(localTracks).catch(() => undefined);
      runtime.published = false;
    }
    runtime.audioTrack?.stop();
    runtime.audioTrack?.close();
    runtime.videoTrack?.stop();
    runtime.videoTrack?.close();
    runtime.audioTrack = null;
    runtime.videoTrack = null;
    await runtime.client.leave().catch(() => undefined);
    if (releaseLease) {
      await releaseLivePublisherLease(session.id, runtime.clientId).catch(
        () => undefined,
      );
    }
    if (runtimeRef.current === runtime) runtimeRef.current = null;
    previewRef.current?.replaceChildren();
  }
  disposeRuntimeRef.current = disposeRuntime;

  async function stopAfterLeaseLoss(runtime: HostRuntime, reason: unknown) {
    if (runtime.disposed) return;
    runtime.intendedToPublish = false;
    await disposeRuntime(runtime, false);
    preparationGateRef.current.clear();
    if (!activeRef.current) return;
    setBroadcasting(false);
    setStudioState("error");
    setError(
      `Đã mất quyền publisher; camera và micro đã được dừng. ${getLiveMediaErrorMessage(reason)}`,
    );
  }

  async function stopPreparedRuntime(
    runtime: HostRuntime,
    reason: unknown,
  ) {
    if (runtime.disposed) return;
    runtime.intendedToPublish = false;
    await disposeRuntime(runtime);
    preparationGateRef.current.clear();
    if (!activeRef.current) return;
    setBroadcasting(false);
    setStudioState("error");
    setError(getLiveMediaErrorMessage(reason));
  }

  function startHeartbeat(runtime: HostRuntime) {
    runtime.heartbeatId = window.setInterval(() => {
      if (
        runtime.disposed ||
        runtime.heartbeatPending ||
        !activeRef.current
      ) {
        return;
      }
      runtime.heartbeatPending = true;
      void heartbeatLivePublisherLease(session.id, runtime.clientId)
        .catch((heartbeatError) =>
          stopAfterLeaseLoss(runtime, heartbeatError),
        )
        .finally(() => {
          runtime.heartbeatPending = false;
        });
    }, 15_000);
  }

  async function renewRuntimeAccess(runtime: HostRuntime) {
    if (runtime.disposed) return;
    if (runtime.renewPromise) return runtime.renewPromise;
    runtime.renewPromise = (async () => {
      if (activeRef.current) setStudioState("renewing");
      const renewed = await joinLiveSession(
        session.id,
        runtime.clientId,
        "PUBLISHER",
      );
      if (runtime.disposed) return;
      if (!isCompatibleRtcAccess(runtime.access, renewed)) {
        throw new Error("Thông tin gia hạn Agora không khớp studio");
      }
      await runtime.client.renewToken(renewed.token);
      runtime.access = renewed;
      setRuntimeState(runtime);
    })()
      .catch(async (renewError) => {
        if (runtime.intendedToPublish) {
          await reconnectRuntime(runtime, renewError);
          return;
        }
        throw renewError;
      })
      .finally(() => {
        runtime.renewPromise = null;
      });
    return runtime.renewPromise;
  }

  async function reconnectRuntime(
    runtime: HostRuntime,
    originalError?: unknown,
  ) {
    if (runtime.disposed || !runtime.intendedToPublish) return;
    if (runtime.reconnectPromise) return runtime.reconnectPromise;
    runtime.reconnectPromise = (async () => {
      let lastError = originalError;
      for (const delayMs of reconnectBackoffMs) {
        await wait(delayMs);
        if (runtime.disposed || !runtime.intendedToPublish) return;
        if (activeRef.current) setStudioState("reconnecting");
        try {
          if (runtime.published) {
            await runtime.client
              .unpublish(tracks(runtime))
              .catch(() => undefined);
            runtime.published = false;
          }
          await runtime.client.leave().catch(() => undefined);
          const renewed = await joinLiveSession(
            session.id,
            runtime.clientId,
            "PUBLISHER",
          );
          if (!isCompatibleRtcAccess(runtime.access, renewed)) {
            throw new Error("Thông tin kết nối lại Agora không khớp studio");
          }
          await runtime.client.setClientRole("host");
          await runtime.client.join(
            renewed.appId,
            renewed.channelName,
            renewed.token,
            renewed.uid,
          );
          if (runtime.disposed || !runtime.intendedToPublish) return;
          await runtime.client.publish(tracks(runtime));
          runtime.access = renewed;
          runtime.published = true;
          if (activeRef.current) {
            setError("");
            setRuntimeState(runtime);
          }
          return;
        } catch (reconnectError) {
          lastError = reconnectError;
        }
      }
      await stopAfterLeaseLoss(
        runtime,
        lastError ?? new Error("Không thể kết nối lại Agora"),
      );
    })().finally(() => {
      runtime.reconnectPromise = null;
    });
    return runtime.reconnectPromise;
  }

  function bindClientEvents(runtime: HostRuntime) {
    runtime.onConnectionStateChange = (state: string) => {
      if (runtime.disposed || !activeRef.current) return;
      if (state === "RECONNECTING") setStudioState("reconnecting");
      if (state === "CONNECTED") setRuntimeState(runtime);
      if (state === "DISCONNECTED") {
        if (runtime.intendedToPublish) {
          void reconnectRuntime(runtime);
        } else {
          void stopPreparedRuntime(
            runtime,
            new Error("Đã mất kết nối Agora. Hãy chuẩn bị lại studio."),
          );
        }
      }
    };
    runtime.onTokenWillExpire = () => {
      void renewRuntimeAccess(runtime).catch((renewError) => {
        if (!activeRef.current || runtime.disposed) return;
        void stopPreparedRuntime(runtime, renewError);
      });
    };
    runtime.onTokenDidExpire = () => {
      if (runtime.intendedToPublish) {
        void reconnectRuntime(runtime);
      } else {
        void stopPreparedRuntime(
          runtime,
          new Error("Quyền truy cập Agora đã hết hạn"),
        );
      }
    };
    runtime.client.on(
      "connection-state-change",
      runtime.onConnectionStateChange,
    );
    runtime.client.on(
      "token-privilege-will-expire",
      runtime.onTokenWillExpire,
    );
    runtime.client.on(
      "token-privilege-did-expire",
      runtime.onTokenDidExpire,
    );
  }

  async function prepareStudioRuntime(): Promise<HostRuntime> {
    setStudioState("preparing");
    setError("");
    setWarning("");
    const clientId = getOrCreateLiveRtcClientId();
    let runtime: HostRuntime | null = null;
    try {
      if (!AgoraRTC.checkSystemRequirements()) {
        throw new Error("Trình duyệt này không hỗ trợ Agora WebRTC");
      }
      const access = await joinLiveSession(
        session.id,
        clientId,
        "PUBLISHER",
      );
      if (access.role !== "PUBLISHER") {
        throw new Error("Tài khoản không được cấp quyền publisher");
      }
      if (!activeRef.current) {
        await releaseLivePublisherLease(session.id, clientId).catch(
          () => undefined,
        );
        throw new Error("Studio đã đóng");
      }

      const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      runtime = {
        access,
        clientId,
        client,
        audioTrack: null,
        videoTrack: null,
        published: false,
        intendedToPublish: initialStatus === "LIVE",
        disposed: false,
        heartbeatPending: false,
        renewPromise: null,
        reconnectPromise: null,
      };
      runtimeRef.current = runtime;
      bindClientEvents(runtime);
      await client.setClientRole("host");
      const [audioTrack, videoTrack] =
        await AgoraRTC.createMicrophoneAndCameraTracks();
      runtime.audioTrack = audioTrack;
      runtime.videoTrack = videoTrack;
      if (runtime.disposed || !activeRef.current) {
        throw new Error("Studio đã đóng");
      }
      if (previewRef.current) videoTrack.play(previewRef.current);
      await client.join(
        access.appId,
        access.channelName,
        access.token,
        access.uid,
      );
      if (runtime.disposed || !activeRef.current) {
        throw new Error("Studio đã đóng");
      }
      startHeartbeat(runtime);

      if (initialStatus === "LIVE") {
        await client.publish([audioTrack, videoTrack]);
        runtime.published = true;
      }
      setError("");
      setRuntimeState(runtime);
      return runtime;
    } catch (setupError) {
      if (runtime) {
        await disposeRuntime(runtime);
      } else {
        await releaseLivePublisherLease(session.id, clientId).catch(
          () => undefined,
        );
      }
      throw setupError;
    }
  }

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      const runtime = runtimeRef.current;
      if (runtime) void disposeRuntimeRef.current(runtime);
    };
  }, []);

  useEffect(() => {
    if (!broadcasting) return;
    const confirmTabClose = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", confirmTabClose);
    return () => window.removeEventListener("beforeunload", confirmTabClose);
  }, [broadcasting]);

  const prepareStudio = () => {
    setActionPending(true);
    void preparationGateRef.current
      .run()
      .catch((setupError) => {
        if (!activeRef.current) return;
        setStudioState("error");
        setError(getLiveMediaErrorMessage(setupError));
      })
      .finally(() => {
        if (activeRef.current) setActionPending(false);
      });
  };

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
      runtime.intendedToPublish = true;
      await runtime.client.publish(tracks(runtime));
      if (runtime.disposed) return;
      runtime.published = true;
      let updated: LiveSession;
      try {
        updated = await startLiveSession(session.id);
      } catch (startError) {
        const canonicalSession = await getLiveSession(session.id).catch(
          () => undefined,
        );
        if (
          canonicalSession &&
          shouldKeepPublishingAfterStartFailure(canonicalSession.status)
        ) {
          setBroadcasting(true);
          setStudioState("live");
          setWarning(
            "Phiên đã LIVE; danh sách seller đang được đồng bộ lại.",
          );
          await Promise.resolve(onSessionChanged(canonicalSession)).catch(
            () => undefined,
          );
          return;
        }
        await runtime.client.unpublish(tracks(runtime)).catch(() => undefined);
        runtime.published = false;
        runtime.intendedToPublish = false;
        throw startError;
      }
      setBroadcasting(true);
      setStudioState("live");
      await Promise.resolve(onSessionChanged(updated)).catch(() => {
        setWarning("Đang phát nhưng chưa thể làm mới danh sách phiên.");
      });
    } catch (publishError) {
      if (!runtime.disposed) {
        runtime.intendedToPublish = runtime.published;
        setError(getLiveMediaErrorMessage(publishError));
        setRuntimeState(runtime);
      }
    } finally {
      if (activeRef.current && !runtime.disposed) setActionPending(false);
    }
  };

  const finalizeEndedStatus = async () => {
    setActionPending(true);
    setStudioState("ending");
    try {
      const updated = await updateLiveSessionStatus(session.id, "ENDED");
      setPendingEndFinalization(false);
      await Promise.resolve(onSessionChanged(updated)).catch(() => undefined);
      onClose();
    } catch (endError) {
      if (!activeRef.current) return;
      setPendingEndFinalization(true);
      setStudioState("error");
      setError(
        endError instanceof Error
          ? endError.message
          : "Không thể hoàn tất trạng thái kết thúc",
      );
    } finally {
      if (activeRef.current) setActionPending(false);
    }
  };

  const endBroadcast = async () => {
    const runtime = runtimeRef.current;
    setActionPending(true);
    setStudioState("ending");
    setError("");
    setWarning("");
    if (runtime) {
      runtime.intendedToPublish = false;
      await disposeRuntime(runtime);
    }
    setBroadcasting(false);
    setPendingEndFinalization(true);
    await finalizeEndedStatus();
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

  const runtimeReady = Boolean(
    runtimeRef.current &&
      !runtimeRef.current.disposed &&
      runtimeRef.current.audioTrack &&
      runtimeRef.current.videoTrack,
  );

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
        {!runtimeReady && (
          <span>
            {studioState === "preparing"
              ? "Đang mở thiết bị..."
              : "Camera chưa được sử dụng"}
          </span>
        )}
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
        {!runtimeReady && !pendingEndFinalization && (
          <button
            type="button"
            className="primary"
            onClick={prepareStudio}
            disabled={actionPending || studioState === "preparing"}
          >
            <RefreshCw size={16} /> Chuẩn bị studio
          </button>
        )}
        {runtimeReady && (
          <>
            <button
              type="button"
              onClick={() => void toggleMicrophone()}
              disabled={actionPending}
              aria-label={microphoneEnabled ? "Tắt micro" : "Bật micro"}
            >
              {microphoneEnabled ? <Mic size={17} /> : <MicOff size={17} />}
              {microphoneEnabled ? "Micro" : "Đã tắt"}
            </button>
            <button
              type="button"
              onClick={() => void toggleCamera()}
              disabled={actionPending}
              aria-label={cameraEnabled ? "Tắt camera" : "Bật camera"}
            >
              {cameraEnabled ? <Camera size={17} /> : <CameraOff size={17} />}
              {cameraEnabled ? "Camera" : "Đã tắt"}
            </button>
          </>
        )}

        {pendingEndFinalization ? (
          <button
            type="button"
            className="danger"
            onClick={() => void finalizeEndedStatus()}
            disabled={actionPending}
          >
            <RefreshCw size={16} /> Hoàn tất kết thúc
          </button>
        ) : broadcasting ? (
          <button
            type="button"
            className="danger"
            onClick={() => void endBroadcast()}
            disabled={actionPending}
          >
            <Square size={15} /> Kết thúc
          </button>
        ) : (
          runtimeReady && (
            <button
              type="button"
              className="primary"
              onClick={() => void startBroadcast()}
              disabled={studioState !== "ready" || actionPending}
            >
              <Play size={16} /> Bắt đầu phát
            </button>
          )
        )}
      </div>
    </aside>
  );
}

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppFrame from "@/components/AppFrame";
import ChatLog from "@/components/ChatLog";
import ProfileCard from "@/components/ProfileCard";
import Composer from "@/components/Composer";
import StoryExtrasPanel from "@/components/StoryExtrasPanel";
import PersonaPicker from "@/components/PersonaPicker";
import ContinueSheet from "@/components/ContinueSheet";
import ChatMenu from "@/components/ChatMenu";
import PageShell from "@/components/PageShell";
import { useConfirm } from "@/components/ConfirmDialog";
import AvatarCircle from "@/components/AvatarCircle";
import Icon from "@/components/Icon";
import { useCloudSync, usePlay } from "@/hooks/PlayProvider";
import { useAuth } from "@/hooks/useAuth";
import { useChatGenerate } from "@/hooks/useChatGenerate";
import { useStartFresh } from "@/hooks/useStartFresh";
import { COMPRESS_EVERY_TURNS } from "@/lib/constants";
import { deleteSettingWithCloud } from "@/lib/deleteSetting";
import { requestGenerate } from "@/lib/geminiClient";
import { recountTurns } from "@/lib/memory";
import { STORY_PERSONA_EDIT } from "@/lib/persona";
import { listSavedChats } from "@/lib/settingFilters";
import { storyTitle } from "@/lib/storyTitle";
import { downloadTranscript } from "@/lib/transcript";
import type { ChatMessage } from "@/lib/types";

function ChatBody() {
  const router = useRouter();
  const play = usePlay();
  const cloud = useCloudSync();
  const auth = useAuth();
  const gen = useChatGenerate(play, Boolean(auth.user));
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [pickingPersona, setPickingPersona] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [pinnedFlash, setPinnedFlash] = useState(false);
  const [pinFlashId, setPinFlashId] = useState<string | null>(null);
  const quietCompress = useRef(false);
  const pinTimer = useRef(0);
  const confirm = useConfirm();
  const fresh = useStartFresh();

  useEffect(() => {
    if (!play.ready || !auth.ready) return;
    if (!auth.user) {
      router.replace("/");
      return;
    }
    if (!play.state.character.name) {
      router.replace("/setup");
    }
  }, [play.ready, auth.ready, auth.user, play.state.character.name, router]);

  useEffect(() => {
    return () => window.clearTimeout(pinTimer.current);
  }, []);

  useEffect(() => {
    if (!play.ready || gen.busy || quietCompress.current) return;
    if (recountTurns(play.state.shortTermBuffer) < COMPRESS_EVERY_TURNS) return;
    quietCompress.current = true;
    const closedTurns = recountTurns(play.state.shortTermBuffer);
    void requestGenerate("summary", play.state)
      .then((summary) => play.applySummary(summary, closedTurns))
      .catch(() => undefined)
      .finally(() => {
        quietCompress.current = false;
      });
  }, [play.ready, gen.busy, play.state.turnCount, play.state.shortTermBuffer.length]);

  if (!play.ready || !auth.ready) {
    return (
      <PageShell>
        <p className="mono-readout text-sm text-[var(--ink-dim)]">불러오는 중…</p>
      </PageShell>
    );
  }

  function laterTurnsWillDrop(fromId: string) {
    const index = play.state.chatLog.findIndex((item) => item.id === fromId);
    return index >= 0 && index < play.state.chatLog.length - 2;
  }

  function truncateFrom(messageId: string) {
    if (!laterTurnsWillDrop(messageId)) {
      play.truncateFrom(messageId);
      return;
    }
    confirm.ask({
      title: "여기부터 지울까요?",
      message: "이 뒤의 대화가 사라집니다.",
      confirmLabel: "삭제",
      danger: true,
      run: () => play.truncateFrom(messageId),
    });
  }

  function regenerate(userMessageId: string, textOverride?: string, asResend = false) {
    const run = () => {
      const prepared = play.prepareRegen(userMessageId, textOverride);
      if (prepared) void gen.sendMessage(prepared.text, prepared.state, prepared.modelId);
    };
    if (!laterTurnsWillDrop(userMessageId)) {
      run();
      return;
    }
    confirm.ask({
      title: asResend ? "이 말로 다시 받을까요?" : "답을 다시 만들까요?",
      message: asResend
        ? "지금 적힌 내 말을 기준으로 상대의 답을 다시 받습니다. 이 뒤의 대화는 사라집니다."
        : "내 말은 그대로 두고, 상대의 답만 다시 생성합니다. 이 뒤의 대화는 사라집니다.",
      confirmLabel: asResend ? "이 말로 다시" : "다시 생성",
      danger: true,
      run,
    });
  }

  function pinTurn(user: ChatMessage, model?: ChatMessage) {
    play.pinTurn(user, model);
    setPinnedFlash(true);
    setPinFlashId(user.id);
    window.clearTimeout(pinTimer.current);
    pinTimer.current = window.setTimeout(() => {
      setPinnedFlash(false);
      setPinFlashId(null);
    }, 1600);
  }

  async function saveChat() {
    if (auth.isGuest) return;
    await cloud.saveNow();
    if (cloud.status !== "error") {
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1600);
    }
  }

  async function compressMemory() {
    if (compressing || play.state.shortTermBuffer.length === 0) return;
    setCompressing(true);
    try {
      const closedTurns = recountTurns(play.state.shortTermBuffer);
      const summary = await requestGenerate("summary", play.state);
      play.applySummary(summary, closedTurns);
    } catch (err) {
      gen.setError(err instanceof Error ? err.message : "요약을 만들지 못했습니다.");
    } finally {
      setCompressing(false);
    }
  }

  function pinLastTurn() {
    const log = play.state.chatLog;
    if (log.length === 0) return;
    const last = log[log.length - 1];
    const prev = log[log.length - 2];
    if (last.role === "model" && prev?.role === "user") {
      pinTurn(prev, last);
      return;
    }
    pinTurn(last);
  }

  const listening = gen.busy === "chat";
  const current = play.settings.find((item) => item.id === play.currentSettingId);
  const headerName = current
    ? storyTitle(current)
    : play.state.character.name || "채팅";
  const meName = play.state.userPersona.name.trim() || "나";
  const hasTurns = play.state.chatLog.length > 0;

  function openPersonaPicker() {
    setMenuOpen(false);
    setPickingPersona(true);
  }

  function goProfile(editId?: string, create = false) {
    setPickingPersona(false);
    const query = new URLSearchParams({ view: "profiles", from: "chat" });
    if (editId) query.set("edit", editId);
    if (create) query.set("new", "1");
    router.push(`/?${query.toString()}`);
  }

  const savedStories = listSavedChats(play.settings);

  return (
    <AppFrame>
      <div className="chat-shell">
        <div className="chat-topbar">
          <div className="min-w-0">
            <ProfileCard
              name={headerName}
              photo={play.state.character.photo}
              status={listening ? "듣는 중" : "대기 중"}
              statusIdle={!listening}
              onOpen={() => {
                if (!play.currentSettingId) return;
                router.push(
                  `/setup?id=${encodeURIComponent(play.currentSettingId)}&from=chat`,
                );
              }}
            />
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="메뉴"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" />
          </button>
        </div>

        {extrasOpen ? (
          <StoryExtrasPanel
            worldSetting={play.state.worldSetting}
            castNotes={play.state.castNotes}
            onWorldChange={play.setWorldSetting}
            onAddCast={play.addCastNote}
            onUpdateCast={play.updateCastNote}
            onRemoveCast={play.removeCastNote}
          />
        ) : null}

        <ChatLog
          key={play.currentSettingId}
          messages={play.state.chatLog}
          prologue={play.state.prologue}
          characterPhoto={play.state.character.photo}
          characterName={play.state.character.name}
          userPhoto={play.state.userPersona.photo}
          userName={play.state.userPersona.name}
          castNotes={play.state.castNotes}
          pendingUserText={gen.pendingUser}
          streamingText={gen.streamingReply}
          streamingForId={gen.replacingModelId}
          actionsDisabled={Boolean(gen.busy)}
          onTruncateFrom={truncateFrom}
          onResend={(id, text) => regenerate(id, text, true)}
          onRegenerate={(id) => regenerate(id)}
          onPinTurn={pinTurn}
          onEditMessage={(id, content) => play.updateMessage(id, content)}
          onSetReplyVersion={play.setReplyVersion}
          onPickMe={openPersonaPicker}
          pinFlashId={pinFlashId}
        />

        <div className="composer-dock">
          <div className="mx-auto w-full max-w-4xl">
            {gen.error ? <p className="alert-error mb-3">{gen.error}</p> : null}
            <div className="composer-tools">
              <div className="me-chip">
                <AvatarCircle
                  src={play.state.userPersona.photo}
                  name={meName}
                  size="sm"
                />
                <button
                  type="button"
                  className="me-chip-hit"
                  onClick={openPersonaPicker}
                  title="이 이야기의 나"
                >
                  <span className="me-chip-name">
                    {play.state.userPersona.name.trim() || "나"}
                  </span>
                </button>
              </div>
              <button
                type="button"
                className="icon-btn"
                disabled={Boolean(gen.busy) || compressing || play.state.shortTermBuffer.length === 0}
                onClick={() => void compressMemory()}
                aria-label={compressing ? "압축 중" : "압축"}
                title="압축"
              >
                <Icon name="compress" />
              </button>
              <button
                type="button"
                className={`icon-btn ${pinnedFlash ? "is-on" : ""}`}
                disabled={Boolean(gen.busy) || !hasTurns}
                onClick={pinLastTurn}
                aria-label={pinnedFlash ? "고정됨" : "고정"}
                title={pinnedFlash ? "고정됨" : "고정"}
              >
                <Icon name="pin" />
              </button>
            </div>
            <Composer
              value={gen.draft}
              onChange={gen.setDraft}
              onSubmit={() => void gen.submitComposer()}
              onStop={gen.busy ? gen.stopGenerate : undefined}
              placeholder="할 말을 적거나, 비워 보내면 이어 줍니다"
            />
            <p className="composer-hint">@: 장면 · @나: 내 대사 · @이름: 다른 사람 · *행동*</p>
          </div>
        </div>
        {confirm.dialog}
        {fresh.dialog}
        {menuOpen ? (
          <ChatMenu
            profileName={meName}
            saveLabel={
              auth.isGuest
                ? "Guest 세션에 저장됨"
                : cloud.status === "saving"
                ? "저장 중…"
                : cloud.status === "error"
                  ? "저장 실패"
                  : savedFlash
                    ? "저장됨"
                    : ""
            }
            saveDisabled={auth.isGuest || cloud.status === "saving"}
            extrasOpen={extrasOpen}
            deleteLastDisabled={Boolean(gen.busy) || !hasTurns}
            compressing={compressing}
            pinLabel={pinnedFlash ? "고정됨" : "고정"}
            pinDisabled={Boolean(gen.busy) || !hasTurns}
            downloadDisabled={!current}
            compressDisabled={
              Boolean(gen.busy) || compressing || play.state.shortTermBuffer.length === 0
            }
            onPickProfile={openPersonaPicker}
            onSave={() => {
              void saveChat();
            }}
            onFresh={() => {
              setMenuOpen(false);
              fresh.startChat();
            }}
            onContinue={() => {
              setMenuOpen(false);
              setContinuing(true);
            }}
            onDownload={() => {
              if (current) downloadTranscript(current);
              setMenuOpen(false);
            }}
            onExtras={() => {
              setExtrasOpen((open) => !open);
              setMenuOpen(false);
            }}
            onCompress={() => {
              setMenuOpen(false);
              void compressMemory();
            }}
            onPin={() => {
              pinLastTurn();
              setMenuOpen(false);
            }}
            onDeleteLast={() => {
              setMenuOpen(false);
              confirm.ask({
                message: "마지막 턴을 지울까요?",
                confirmLabel: "삭제",
                danger: true,
                run: play.deleteLastTurn,
              });
            }}
            onDeleteStory={() => {
              setMenuOpen(false);
              confirm.ask({
                title: "이 이야기를 지울까요?",
                message: "세계와 대화가 함께 사라집니다.",
                confirmLabel: "삭제",
                danger: true,
                run: async () => {
                  await deleteSettingWithCloud(play.deleteSetting, {
                    id: play.currentSettingId,
                    cloudSessionId: play.state.cloudSessionId,
                  });
                  router.push("/");
                },
              });
            }}
            onClose={() => setMenuOpen(false)}
          />
        ) : null}
        {pickingPersona ? (
          <PersonaPicker
            personas={play.personas}
            selectedId={current?.personaId}
            current={play.state.userPersona}
            onPick={(id) => {
              play.applyPersona(id);
              setPickingPersona(false);
            }}
            onEdit={(id) => goProfile(id)}
            onEditCurrent={() => goProfile(STORY_PERSONA_EDIT)}
            onAdd={() => goProfile(undefined, true)}
            onCancel={() => setPickingPersona(false)}
          />
        ) : null}
        {continuing ? (
          <ContinueSheet
            stories={savedStories}
            currentId={play.currentSettingId}
            onPick={(id) => {
              play.selectSetting(id);
              setContinuing(false);
              router.push("/chat");
            }}
            onRename={(id, title) => play.renameSetting(id, title)}
            onDelete={(id) => {
              confirm.ask({
                message: "이 대화를 지울까요?",
                confirmLabel: "삭제",
                danger: true,
                run: async () => {
                  const item = play.settings.find((story) => story.id === id);
                  if (!item) return;
                  await deleteSettingWithCloud(play.deleteSetting, item);
                  if (id === play.currentSettingId) {
                    setContinuing(false);
                    router.push("/");
                  }
                },
              });
            }}
            onClose={() => setContinuing(false)}
          />
        ) : null}
      </div>
    </AppFrame>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <p className="mono-readout text-sm text-[var(--ink-dim)]">불러오는 중…</p>
        </PageShell>
      }
    >
      <ChatBody />
    </Suspense>
  );
}

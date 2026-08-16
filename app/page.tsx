"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthButton from "@/components/AuthButton";
import PageShell from "@/components/PageShell";
import { usePlayState } from "@/hooks/usePlayState";
import { AI_STUDIO_KEY_URL } from "@/lib/constants";

export default function HomePage() {
  const router = useRouter();
  const { state, ready, setApiKey } = usePlayState();
  const [draft, setDraft] = useState("");
  const [touched, setTouched] = useState(false);

  if (!ready) {
    return (
      <PageShell>
        <p className="mono-readout text-sm text-[var(--ink-dim)]">불러오는 중…</p>
      </PageShell>
    );
  }

  const key = touched ? draft : draft || state.apiKey;
  const canContinue = Boolean(state.character.name && state.apiKey);

  function saveKey() {
    const next = (touched ? draft : state.apiKey).trim();
    if (!next) return;
    setApiKey(next);
    router.push("/setup");
  }

  return (
    <PageShell>
      <div className="flex justify-end">
        <AuthButton />
      </div>

      <main className="paper-card mt-6 px-7 py-10">
        <p className="label-caps">이어 + Role</p>
        <h1 className="font-serif mt-3 text-4xl tracking-tight">이어롤</h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--ink-soft)]">
          길게 놀아도 캐릭터 설정이 이어지는 개인용 스토리 롤플 채팅.
          키는 이 브라우저에만 저장되고, 서버로 보내지 않습니다.
        </p>

        <a
          href={AI_STUDIO_KEY_URL}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary mt-8 inline-flex"
        >
          무료 API 키 1분 만에 발급받기
        </a>

        <label className="mt-8 block">
          <span className="text-sm font-medium">Gemini API 키</span>
          <input
            type="password"
            autoComplete="off"
            className="field-input"
            placeholder="AI Studio에서 복사한 키"
            value={key}
            onChange={(event) => {
              setTouched(true);
              setDraft(event.target.value);
            }}
          />
        </label>

        <button
          type="button"
          className="btn-primary mt-6 w-full"
          onClick={saveKey}
          disabled={!key.trim()}
        >
          설정 작성하기
        </button>

        {canContinue ? (
          <button
            type="button"
            className="btn-secondary mt-3 w-full"
            onClick={() => router.push("/chat")}
          >
            이어서 하기 · {state.character.name}
          </button>
        ) : null}
      </main>
    </PageShell>
  );
}

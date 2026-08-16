export default function GuidePanel() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <p className="label-caps">안내</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">EarRole 쓰는 법</h1>
      <p className="mt-3 text-sm text-[var(--ink-dim)]">
        이어롤은 귀를 열고, 이야기를 잇고, 역할을 플레이합니다.
      </p>
      <ol className="mt-8 space-y-5 text-sm leading-relaxed text-[var(--ink-soft)]">
        <li>
          <strong className="text-[var(--ink)]">새 이야기</strong>나 설정에서 예시
          세계관을 고르거나, 직접 프로필을 적습니다.
        </li>
        <li>
          <strong className="text-[var(--ink)]">채팅 시작</strong>을 누르면
          프롤로그가 먼저 나옵니다. 읽고 나서 첫 대사를 쓰면 그 장면부터 이어집니다.
        </li>
        <li>
          적을 때 <strong className="text-[var(--ink)]">@:나레이션</strong>,{" "}
          <strong className="text-[var(--ink)]">@이름:대사</strong>,{" "}
          <strong className="text-[var(--ink)]">*행동*</strong>을 쓸 수 있습니다.
        </li>
        <li>
          예전에 하던 이야기는 왼쪽 <strong className="text-[var(--ink)]">이야기</strong>에서
          골라 이어갑니다. 마지막 말은 고치거나 지울 수 있습니다.
        </li>
        <li>
          이야기가 길어지면 설정 아래 <strong className="text-[var(--ink)]">기억 압축</strong>으로
          사건만 짧게 남기세요.
        </li>
      </ol>
    </div>
  );
}

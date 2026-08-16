export default function GuidePanel() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <p className="label-caps">안내</p>
      <h1 className="mt-2 text-3xl font-semibold">이어롤 쓰는 법</h1>
      <ol className="mt-8 space-y-5 text-sm leading-relaxed text-[var(--ink-soft)]">
        <li>
          <strong className="text-[var(--ink)]">설정</strong>에서 예시 세계관을
          고르거나 필수 프로필을 적습니다.
        </li>
        <li>
          <strong className="text-[var(--ink)]">채팅 시작</strong>을 누르면
          프롤로그가 먼저 나옵니다. 읽고 나서 첫 대사를 쓰면 그 장면부터 이어집니다.
        </li>
        <li>
          예전에 하던 이야기는 왼쪽 <strong className="text-[var(--ink)]">이야기</strong>에서
          골라 이어갑니다. 입력창은 채팅 화면에만 있습니다.
        </li>
        <li>
          이야기 중간에도 채팅 위 <strong className="text-[var(--ink)]">인물·설정 추가</strong>로
          새 인물이나 세계관 한 줄을 넣을 수 있습니다.
        </li>
        <li>
          이야기가 길어지면 설정 아래 <strong className="text-[var(--ink)]">기억 압축</strong>으로
          사건만 짧게 남기세요.
        </li>
      </ol>
    </div>
  );
}

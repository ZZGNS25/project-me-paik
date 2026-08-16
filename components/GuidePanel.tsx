export default function GuidePanel() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <p className="label-caps">안내</p>
      <h1 className="mt-2 text-3xl font-semibold">이어롤 쓰는 법</h1>
      <ol className="mt-8 space-y-5 text-sm leading-relaxed text-[var(--ink-soft)]">
        <li>
          <strong className="text-[var(--ink)]">설정</strong>에서 이름·말투·금지만
          짧게 적습니다. 예시 세계관을 고르면 대화 전에 프롤로그가 먼저 나옵니다.
        </li>
        <li>
          <strong className="text-[var(--ink)]">작성</strong> 화면의 입력창에
          대사나 행동을 쓰면, 제미나이가 나레이션과 대사로 받아칩니다.
        </li>
        <li>
          이야기가 시작된 뒤에도 채팅 위 <strong className="text-[var(--ink)]">인물·설정 추가</strong>로
          새 인물이나 세계관 한 줄을 넣을 수 있습니다. 다음 턴부터 반영됩니다.
        </li>
        <li>
          이야기가 길어지면 설정 아래 <strong className="text-[var(--ink)]">기억 압축</strong>으로
          사건만 짧게 남기세요. 말투와 금지는 그대로입니다.
        </li>
        <li>
          <strong className="text-[var(--ink)]">내 기록</strong>에서 클라우드에
          올린 세션을 다시 열 수 있습니다.
        </li>
      </ol>
    </div>
  );
}

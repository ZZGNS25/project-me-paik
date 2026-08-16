export default function GuidePanel() {
  return (
    <div className="page-scroll mx-auto w-full max-w-2xl px-6 py-12">
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
          <strong className="text-[var(--ink)]">*행동*</strong>을 쓸 수 있습니다.{" "}
          <strong className="text-[var(--ink)]">@서윤하:</strong>처럼 이름을 붙이면
          그 인물의 말입니다. 내 말은 <strong className="text-[var(--ink)]">@나:</strong>나
          이름 없이 적습니다.
        </li>
        <li>
          예전에 하던 이야기는 왼쪽 <strong className="text-[var(--ink)]">이야기</strong>에서
          골라 이어갑니다. 어긋난 지점은 <strong className="text-[var(--ink)]">여기부터 삭제</strong>나{" "}
          <strong className="text-[var(--ink)]">답 다시 생성</strong>으로 돌아갑니다.
        </li>
        <li>
          중요한 일은 <strong className="text-[var(--ink)]">사건 고정</strong>으로 남기세요.
          길어지면 설정에서 <strong className="text-[var(--ink)]">기억 압축</strong>을 해도
          말투·금지·고정 사건은 그대로입니다.
        </li>
        <li>
          로그인한 이야기는 클라우드에 자동으로 남습니다. 설정이나 채팅의{" "}
          <strong className="text-[var(--ink)]">공유</strong>는 캐릭터·세계관 링크만
          복사합니다. 대화는 들어가지 않습니다. 브라우저를 바꾸면{" "}
          <strong className="text-[var(--ink)]">내보내기/가져오기</strong>로 옮길 수 있습니다.
        </li>
      </ol>
    </div>
  );
}

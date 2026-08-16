export default function GuidePanel() {
  return (
    <div className="page-scroll mx-auto w-full max-w-2xl px-6 py-12">
      <p className="label-caps">안내</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">EarRole 쓰는 법</h1>
      <p className="mt-3 text-sm text-[var(--ink-dim)]">
        이어롤은 귀를 열고, 이야기를 잇고, 역할을 플레이합니다. 캐릭터를 골라 소비하는
        곳이 아니라, 세계와 나를 정한 뒤 그 안에서 대화를 이어 가는 곳입니다.
      </p>

      <section className="guide-section">
        <p className="label-caps">시작</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
          채팅은 구글 로그인이 필요합니다. 설정과 대화는 이 브라우저에 먼저 남고,
          로그인하면 클라우드에도 자동으로 남습니다.
        </p>
        <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
          첫 화면에서 예시 세계관을 고르거나 <strong className="text-[var(--ink)]">새 이야기</strong>로
          직접 만듭니다. 프로필이 이미 있으면, 이 이야기에서 나는 누구인지 고릅니다.
          없이 시작해도 됩니다. 나중에 대화의 <strong className="text-[var(--ink)]">나</strong>를
          눌러 바꿀 수 있습니다.
        </p>
        <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
          <strong className="text-[var(--ink)]">채팅 시작</strong>을 누르면 프롤로그가 먼저
          나옵니다. 읽고 나서 첫 대사를 쓰면 그 장면 직후부터 이어집니다. 프롤로그를
          처음부터 다시 쓰지 않습니다.
        </p>
      </section>

      <section className="guide-section">
        <p className="label-caps">프로필과 이야기</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
          <strong className="text-[var(--ink)]">프로필</strong>은 내가 누구인지입니다.
          이야기마다 다시 적지 않도록, 이름·설정·사진을 여러 개 만들어 둡니다. 목록
          제목은 짧게, 예: 헌터 — 20세. 설정은 1000자까지, 프로필은 12개까지입니다.
        </p>
        <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
          <strong className="text-[var(--ink)]">이야기</strong>는 세계와 상대 역할입니다.
          프로필을 고르면 그 내용이 이 이야기에만 복사됩니다. 목록 원본을 고쳐도 이미
          시작한 대화는 바뀌지 않습니다.
        </p>
        <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
          대화에서 <strong className="text-[var(--ink)]">나</strong>를 누르면 미리 만든
          프로필이 뜹니다. 내 말 위 이름, 얼굴, 입력창 위 칩, 메뉴의{" "}
          <strong className="text-[var(--ink)]">대화 프로필</strong>이 같습니다. 설정의{" "}
          <strong className="text-[var(--ink)]">이 이야기의 나</strong>에서도 고를 수
          있습니다. 다음 대사부터 반영되고, 이미 나온 장면은 그대로입니다. 이
          이야기에서만 이름·설정을 고쳐도 됩니다. 그때는 프로필 원본이 바뀌지 않습니다.
        </p>
      </section>

      <section className="guide-section">
        <p className="label-caps">설정에서 채울 것</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
          상대의 <strong className="text-[var(--ink)]">이름</strong>만 있으면 채팅을 열 수
          있습니다. 나머지는 적을수록 장면이 흔들리지 않습니다.
        </p>
        <ul className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
          <li>
            <strong className="text-[var(--ink)]">한 줄 · 말투 · 외형</strong>은 상대가
            누구인지, 어떻게 말하는지입니다.
          </li>
          <li>
            <strong className="text-[var(--ink)]">금지</strong>는 깨지면 안 되는 규칙입니다.
            이름과 말투를 보고 자동으로 채워지고, 직접 고친 뒤에는 다른 칸을 바꿔도
            유지됩니다. 자동으로 다시 채울 수도 있습니다.
          </li>
          <li>
            <strong className="text-[var(--ink)]">시작 상황</strong>은 첫 장면 직전의
            위치입니다. 대화가 시작된 뒤에는 다시 읽히지 않습니다.
          </li>
          <li>
            <strong className="text-[var(--ink)]">세계관</strong>은 시대, 장소, 규칙,
            지명, 절대 금지를 모아 두는 칸입니다. 요약에 넣지 않고 매 턴 그대로 들어갑니다.
          </li>
          <li>
            <strong className="text-[var(--ink)]">프롤로그</strong>는 대화 전에 읽는
            도입입니다. 채팅 시작 전에 보여 주고, 첫 응답에도 참고됩니다.
          </li>
          <li>
            <strong className="text-[var(--ink)]">등장인물</strong>은 엑스트라입니다.
            이름, 한 줄, 사진을 적으면 그 사람이 말할 때 얼굴이 붙습니다. 채팅의{" "}
            <strong className="text-[var(--ink)]">인물 추가</strong>에서도 고칠 수 있습니다.
          </li>
        </ul>
        <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
          사진(상대, 나, 등장인물)은 화면에만 보입니다. 모델에는 글만 들어갑니다.
        </p>
      </section>

      <section className="guide-section">
        <p className="label-caps">적는 법</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
          한 칸에 장면, 내 말, 다른 사람 말, 행동을 섞어 쓸 수 있습니다. 형식을 붙이면
          누가 말했는지가 분명해집니다. 상대는 내 대사·감정·행동을 대신 쓰지 않습니다.
        </p>
        <ul className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
          <li>
            <strong className="text-[var(--ink)]">@:</strong> 나레이션입니다. 공기, 거리,
            소리, 장면만 적습니다. 내 속마음을 여기 적지 마세요.
          </li>
          <li>
            <strong className="text-[var(--ink)]">@나:</strong> 또는 이름 없이 적은 줄은
            내 대사입니다. 이야기에서 부르는 내 이름을 붙여도 됩니다.
          </li>
          <li>
            <strong className="text-[var(--ink)]">@이름:</strong> 그 인물이 한 말입니다.
            상대 이름이면 그 사람이 이미 말한 것으로 처리됩니다. 엑스트라 이름을 붙이면
            그 사람이 말한 것입니다.
          </li>
          <li>
            <strong className="text-[var(--ink)]">*행동*</strong>은 동작이나 속마음입니다.
            내 손, 시선, 숨은 여기에 적습니다.
          </li>
        </ul>
        <pre className="guide-example">{`@:빗소리가 복도를 채웠다. 등 뒤에서 발소리가 한 걸음 가까워졌다.

@나: 잠깐만. 숨 고를게.

*장갑 낀 손으로 칼자루를 만진다.*

@서윤하: 따라와. 말은 나중에.`}</pre>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
          입력창 아래 힌트도 같습니다. @: 장면 · @나: 내 말 · @이름: 그 인물 · *행동*.
        </p>
      </section>

      <section className="guide-section">
        <p className="label-caps">채팅에서</p>
        <ul className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
          <li>
            <strong className="text-[var(--ink)]">저장</strong>은 지금 대화를 클라우드에
            바로 남깁니다. 로그인되어 있으면 평소에도 자동으로 남습니다.
          </li>
          <li>
            <strong className="text-[var(--ink)]">공유</strong>를 누르면 다른 앱, 링크 복사,
            X, 페이스북, 텔레그램, 라인이 뜹니다. 캐릭터와 세계관만 들어가고 대화는
            빠집니다.
          </li>
          <li>
            <strong className="text-[var(--ink)]">새로</strong>는 같은 세계와 역할로 새
            대화를 엽니다. 지금 대화가 있으면 저장할지 묻습니다.{" "}
            <strong className="text-[var(--ink)]">저장</strong>하면 지금 이야기는 남기고
            복사본으로 이어갑니다. <strong className="text-[var(--ink)]">저장 안 함</strong>은
            지금 대화를 비웁니다.
          </li>
          <li>
            왼쪽 <strong className="text-[var(--ink)]">새 이야기</strong>는 세계와 역할을
            처음부터 다시 만듭니다. 역시 지금 대화를 저장할지 묻습니다.
          </li>
          <li>
            입력창 위 <strong className="text-[var(--ink)]">나</strong>, 내 말의 이름·얼굴을
            누르면 프로필 목록이 열립니다. 프로필이 없으면 그 자리에서 만들 수 있습니다.
          </li>
          <li>
            위쪽 <strong className="text-[var(--ink)]">메뉴</strong>에 저장, 공유, 새로하기,
            대화 프로필, 인물 추가, 압축, 고정이 있습니다.
          </li>
          <li>
            어긋난 지점은 그 말의 <strong className="text-[var(--ink)]">여기부터 삭제</strong>로
            그 이후를 지웁니다. <strong className="text-[var(--ink)]">답 다시 생성</strong>은
            그 입력에 대한 응답만 다시 받습니다.
          </li>
        </ul>
      </section>

      <section className="guide-section">
        <p className="label-caps">기억</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
          최근 몇 턴은 그대로 보고, 그보다 앞선 일은 요약으로 남깁니다. 서른 턴마다
          기억이 조용히 압축됩니다. 말하는 중에는 기다리지 않습니다. 필요할 때는
          메뉴의 <strong className="text-[var(--ink)]">압축</strong>을 눌러도 됩니다.
        </p>
        <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
          잊히면 안 되는 일은 <strong className="text-[var(--ink)]">고정</strong>하세요.
          말 옆의 사건 고정은 그 한 턴을, 메뉴의 고정은 마지막 턴을 남깁니다. 설정 화면의
          기억 칸에서 직접 적을 수도 있습니다. 고정된 사건은 요약보다 우선합니다.
        </p>
        <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
          말투, 금지, 세계관, 고정된 사건은 압축해도 그대로입니다.
        </p>
      </section>

      <section className="guide-section">
        <p className="label-caps">기록</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
          예전에 하던 이야기는 왼쪽 <strong className="text-[var(--ink)]">이야기</strong>에서
          고르거나, <strong className="text-[var(--ink)]">내 기록</strong>에서 클라우드
          목록을 열어 이어갑니다. 로그인한 이야기는 클라우드에 자동으로 남습니다.
          클라우드에서 지울 수도 있고, 이 브라우저에서만 지울 수도 있습니다.
        </p>
        <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
          설정의 <strong className="text-[var(--ink)]">기록 내려받기</strong>는 세계관과
          대화를 텍스트 파일로 남깁니다. 다시 불러오는 파일이 아닙니다. 캐릭터와 세계관
          링크는 <strong className="text-[var(--ink)]">공유</strong>로 보냅니다.
        </p>
      </section>
    </div>
  );
}

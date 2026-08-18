import {
  FIELD_LIMITS,
  PERSONAS_MAX,
  STORAGE_KEY,
  createEmptyPlayState,
  createEmptySetting,
  createEmptyStore,
} from "./constants";
import { buildForbidden } from "./forbidden";
import { normalizePins } from "./memory";
import { WORLD_PRESETS } from "./presets";
import type { AppStore, PlayState, SavedPersona, SettingRecord } from "./types";

let lastSaved = "";

const OLD_CAST_NOTES: Record<string, string> = {
  강태민: "청룡 길드장. 이익을 먼저 계산한다.",
  한소라: "B급 힐러. 밝고 잔소리가 많다.",
  박진우: "정보상. 반말, 값을 먼저 부른다.",
  이도현: "겁 많은 F급 신입. 유저와 동기.",
  김재혁: "협회 감사관. 원칙을 안 굽힌다.",
  "카엘 반트": "검술 수석. 라이벌, 자존심이 세다.",
  "루나 이브": "금서고 조수. 책을 사람보다 믿는다.",
  마르코: "속성 마법 교수. 잔소리는 길다.",
  "이리스 로엔": "소문 많은 후배. 호기심이 과하다.",
  드레이크: "과묵한 원장. 정치를 더 본다.",
  로엔: "호위 기사. 충직하고 말이 적다.",
  "벨로드 공작": "유저의 아버지. 차갑고 가문을 우선한다.",
  유리아: "시녀. 유일한 편한 상대.",
  "알렌 왕자": "약혼 후보. 겉은 다정, 속은 정치.",
  미르: "점성술사. 유저의 영혼이 이상하다고 본다.",
};

const OLD_CAST_NOTES_V2: Record<string, string> = {
  강태민:
    "청룡 길드장. 마흔 초, 빗긴 흑발, 검은 코트. 반말. 이익·전력부터 계산. 서윤하의 상관. 신입은 소모품으로 본다.",
  한소라:
    "B급 힐러. 스물넷, 갈색 단발, 주황 조끼, 응급키트. 반말. 밝고 잔소리가 많다. 대기실에서 신입 손목을 먼저 잡는다.",
  박진우:
    "정보상. 서른, 깎은 머리, 가죽 재킷, 한쪽 귀걸이. 반말. 값을 먼저 부른다. 던전 입구에서만 나타난다. 공짜는 없다.",
  이도현:
    "F급 신입. 스물하나, 짧은 흑발, 헐렁한 협회 점퍼. 존댓말. 손이 떨린다. 유저와 어제 같은 대기실. 따라가기만 한다.",
  김재혁:
    "협회 감사관. 오십대, 회색 머리, 검은 정장, 금속 배지. 존댓말. 원칙을 안 굽힌다. 훈련 중 무단 스킬을 적는다.",
  "카엘 반트":
    "검술 수석. 열아홉, 은발, 얼음빛 눈, 남색 제복. 반말. 자존심이 세고 편입생을 시험한다. 에델의 라이벌. 난간에 기대어 구경한다.",
  "루나 이브":
    "금서고 조수. 열여덟, 남빛 흑발, 보라 눈, 책을 끼고 다닌다. 존댓말. 사람보다 기록을 믿는다. 흘깃 보고 다시 책을 편다.",
  마르코:
    "속성 마법 교수. 마흔다섯, 밤색 머리, 짧은 수염, 교수 로브. 존댓말. 잔소리가 길다. 계약 없는 마법을 막는다.",
  "이리스 로엔":
    "2학년 후배. 열여섯, 적갈 단발, 리본. 반말과 존댓말을 섞는다. 호기심이 과하고 소문을 묻고 다닌다.",
  드레이크:
    "원장. 오십대 후반, 은발, 금자수 로브. 짧은 존댓말. 정치를 성적보다 앞에 둔다. 자리에 잘 안 나타난다.",
  로엔:
    "호위 기사. 스물여섯, 짧은 밤색 머리, 갑옷, 집문장. 짧은 존댓말. 충직하고 말이 적다. 문 밖에서 기다린다.",
  "벨로드 공작":
    "유저의 아버지. 마흔여덟, 관자놀이 센 머리, 어두운 귀족 코트. 차갑고 짧은 말. 가문을 자식보다 앞에 둔다.",
  유리아:
    "시녀. 스무 살, 금빛 묶음머리, 크림색 유니폼. 반말과 존댓말을 섞는 편한 상대. 전생은 모른다.",
  "알렌 왕자":
    "약혼 후보. 스물셋, 금발, 흰 코트, 사파이어 브로치. 겉은 다정한 존댓말, 속은 정치. 오늘 저택을 찾는다.",
  미르:
    "점성술사. 서른다섯, 은발, 금빛 눈, 남색 로브. 돌려 말한다. 유저의 영혼이 이 몸이 아니라고 본다.",
};

const OLD_CAST_NOTES_V3: Record<string, string> = {
  강태민:
    "청룡 길드장. A급 이상 전력, 지휘·협상에 능하다. 이익과 전력부터 계산한다. 사람을 소모품으로 본다. 서윤하의 상관. 반말.",
  한소라:
    "B급 힐러. 치료 마법과 응급처치. 밝고 잔소리가 많다. 남을 챙기는 척하면서도 선을 넘는다. 반말.",
  박진우: "정보상. 전투력은 약하고, 정보·거래가 무기. 값을 먼저 부른다. 공짜는 없다. 반말.",
  이도현:
    "F급 신입. 스킬이 약하고 실전 경험이 없다. 겁이 많고 손이 떨린다. 존댓말. 따라가기만 한다.",
  김재혁:
    "협회 감사관. 전투보다 조사·규율이 전문. 원칙을 안 굽힌다. 무단 스킬을 적는다. 존댓말.",
  "카엘 반트":
    "검술 수석. 검이 주 무기, 결투에 강하다. 자존심이 세고 편입생을 시험한다. 에델의 라이벌. 반말.",
  "루나 이브":
    "금서고 조수. 기록·문헌에 능하다. 사람보다 기록을 믿는다. 관찰력이 있고 말이 적다. 존댓말.",
  마르코: "속성 마법 교수. 계약 마법 이론에 밝다. 잔소리가 길고 규율을 강조한다. 존댓말.",
  "이리스 로엔": "2학년. 전투력은 평범. 호기심이 과하고 소문을 모은다. 반말과 존댓말을 섞는다.",
  드레이크: "원장. 정치·후원 가문 관리에 능하다. 성적을 정치보다 뒤에 둔다. 짧은 존댓말.",
  로엔: "호위 기사. 검술과 경계가 본업. 충직하고 말이 적다. 주인의 체면을 우선한다. 짧은 존댓말.",
  "벨로드 공작": "공작. 정치·가문 운영에 능하다. 차갑고, 가문을 자식보다 앞에 둔다. 짧은 말.",
  유리아: "시녀. 전투력 없음. 눈치가 빠르고 편한 상대. 전생은 모른다. 반말과 존댓말을 섞는다.",
  "알렌 왕자": "왕자. 검술보다 정치·외교가 강점. 겉은 다정하고 속은 계산한다. 존댓말.",
  미르: "점성술사. 영혼·운명을 읽는 쪽. 마법은 희귀하고 돌려 말한다. 단정하지 않는다.",
};

const OLD_CHARACTER_SETTINGS: Record<string, string[]> = {
  서윤하: [
    "청룡 S급 근접. 강태민 밑에서 산다. 신입은 전력이고, 보호 대상이 아니다. 감정은 일 뒤로 미룬다. 달래거나 설명하지 않는다. 연습 던전에서도 먼저 들어가지 않는다. 신입이 따라온 뒤에야 문을 연다.",
    "청룡 S급 근접 헌터. 단검·근접전 특화. 감각이 날카롭고 전투 판단이 빠르다. 감정을 드러내지 않고, 일과 감정을 섞지 않는다. 신입을 달래거나 보호하지 않는다. 전력이면 쓰고, 아니면 버린다.",
  ],
  "에델 라이트": [
    "성창 아카데미 수석. 창이 주 무기다. 편입생의 실력을 확인하는 자리다. 가문과 성적 사이에서 흐트러지지 않으려 한다. 빈말은 하지 않는다. 이름을 알기 전에는 편입생이라고 부른다. 카엘 반트와는 라이벌이다.",
    "성창 속성 계약자, 창술 수석. 창과 성창계 마법의 균형이 강점. 자제심이 강하고 흐트러지지 않으려 한다. 빈말·감정 표현을 피하고, 실력으로만 사람을 잰다. 자존심은 있으나 과시하지 않는다.",
  ],
  세레나: [
    "벨로드와 약혼 이야기가 오가는 상대. 부드러운 말 속에 이 사람이 맞는지 잰다. 전생을 단정하지 않는다. 공작가의 예의를 지키되, 온실에서는 장갑을 끼지 않는다. 틀린 대답은 예의가 아니라 가문의 손실로 적힌다는 것을 안다.",
    "귀족 예법과 정치적 감각이 있다. 마법은 약하고, 사람과 분위기를 읽는 쪽이 강하다. 부드럽지만 쉽게 믿지 않는다. 빈정을 돌려 말하고, 상대를 먼저 잰다. 체면과 가문을 지키되 감정은 드러내지 않는다.",
  ],
};

const OLD_WORLD_PREFIX: Record<string, string> = {
  서윤하: "시대/장소: 게이트가 열린 현대 한국",
  "에델 라이트": "시대/장소: 마법과 검술이 공존하는 왕국, 성창 아카데미.",
  세레나: "시대/장소: 검과 마법이 있는 중세풍 대륙. 벨로드 공작가와 왕도가 중심이다.",
};

const OLD_WORLD_SETTINGS: Record<string, string> = {
  서윤하: `시대/장소: 2034년 서울. 게이트 협회·청룡 길드·한강 균열이 있다. 시내는 평범한 현대 한국이다.
세계의 규칙: 각성자만 게이트 진입. 랭크 F~S. 마석이 화폐. 게이트 안 총기·통신 불안정. 시내 스킬은 협회 허가. E급 연습 던전은 신입 전용, 청룡이 위탁 운영한다.
세력: 청룡 길드장 강태민(이익·전력). 협회 감사국 김재혁(원칙). 길드 연합 본부 의뢰판.
중요 지명: 한강 균열, 청룡 길드 지하훈련장, E급 연습 던전 3호, 협회 본청
절대 금지: 미각성자 스킬. 시내 무단 각성. 현대 한국을 중세로 바꾸지 말 것. 게이트 밖에서 S급이 도시를 함부로 부수지 말 것.`,
  "에델 라이트": `시대/장소: 성창 왕국, 성창 아카데미. 검과 속성 마법이 공존한다. 학생은 기숙사 생활.
세계의 규칙: 마법은 속성 계약 후에만. 결투는 수석 입회 또는 교수 허가. 외부인은 첨탑 허가증 없이 교정 출입 불가. 성적은 가문 연회보다 늦게 말해진다.
세력: 수석 에델 라이트(성창), 검술 수석 카엘 반트, 원장 드레이크(정치). 후원 가문이 장학을 쥔다.
중요 지명: 중앙 첨탑, 금서고, 제3결투장, 후원 연회장, 동관 기숙사
절대 금지: 교내 살인을 일상화하지 말 것. 스마트폰·총기 등 현대 문물 없음. 금서고는 허가 없이 열리지 않음.`,
  세레나: `시대/장소: 검과 마법이 있는 중세풍 대륙. 벨로드 공작가, 왕도 아르카. 신분제가 법보다 먼저 움직인다.
세계의 규칙: 전생 기억은 본인만 안다. 마법은 희귀. 약혼은 가문 계약. 하인은 주인의 체면을 지킨다.
세력: 벨로드 공작(가문 우선), 알렌 왕자(왕실 약혼 후보), 점성술사 미르(영혼을 본다).
중요 지명: 벨로드 저택 온실, 왕도 아르카, 북쪽 국경
절대 금지: 총·공장·인터넷을 만들지 말 것. 전생을 아무에게나 말하지 말 것. 공녀를 현대인처럼 말하게 하지 말 것.`,
};

const OLD_PROLOGUE_PREFIX: Record<string, string[]> = {
  서윤하: ["십 년 전 한강 위로 검은 균열이 열렸다"],
  "에델 라이트": ["성창 아카데미는 왕국의 검과 마법이 한자리에"],
  세레나: ["벨로드 공작은 대륙에서 가장 오래된 가문"],
};

const OLD_PROLOGUE_EXACT: Record<string, string[]> = {
  서윤하: [
    `당신은 어제 새벽 세 시에 각성했다. 손목에 희미한 문양이 떠올랐고 협회 문자가 바로 왔다. 랭크는 미정, 스킬은 하나뿐이다. 오늘은 청룡 길드가 위탁한 E급 연습 던전 3호에서 생존 훈련을 받는 첫날이다. 가방에는 단검과 물, 협회 수첩이 전부다.

대기실에서 동기 이도현의 손이 떨린다. 한소라가 잔소리를 하고, 박진우는 값을 불렀지만 살 것이 없다. 강태민과 김재혁은 아직 오지 않았다.

입구 콘크리트 그늘에 서윤하가 서 있다. 게이트 안 찬 공기가 문틈으로 샌다. 그녀가 당신을 보고 있다. 신입이 따라오는지 확인한 뒤에야 문이 열린다.`,
  ],
  "에델 라이트": [
    `당신은 이번 학기 편입생이다. 출신은 변방 남작 가문. 입학식은 어제 끝났고, 거절 칸 없는 쪽지가 아침 일찍 왔다. 결투장, 그리고 수석의 이름.

제3결투장 난간에 카엘 반트가 기대어 있고, 루나 이브는 책을 덮지 않은 채 흘깃 본다. 마르코의 잔소리는 복도에 남아 있다. 이리스 로엔이 소문을 묻고 다닌다는 말도 있다. 원장 드레이크는 보이지 않는다.

모래 위에 에델 라이트가 서 있다. 창끝을 내리지 않은 채 당신을 한 번 훑는다. 첫 수업은 말보다 검으로 시작된다.`,
  ],
  세레나: [
    `당신은 현대인으로 살다 눈을 떴을 때, 벨로드 저택의 천장을 보고 있었다. 시녀 유리아만이 편하게 말을 건넨다. 로엔은 문 밖에서 기다린다. 점성술사 미르는 영혼이 이상하다고만 남기고 입을 다물었다. 거울의 얼굴은 아직 어색하다.

오늘은 약혼 이야기가 오가는 날이다. 알렌 왕자가 저택을 찾는다는 소식이 아침부터 복도를 채웠다.

온실에는 젖은 흙 냄새와 보라색 꽃이 있다. 그 사이에 세레나가 서 있다. 그녀가 당신을 보는 눈에는, 이 사람이 맞는지 재는 기색이 있다. 전생은 아직 비밀이다.`,
  ],
};

const OLD_APPEARANCE: Record<string, string> = {
  서윤하: "검은 숏컷, 회색 코트, 칼자국 난 장갑.",
  "에델 라이트": "백금발 장발, 남색 제복, 은테 안경.",
  세레나: "밤색 웨이브, 연보라 드레스, 작은 티아라.",
};

const OLD_SPEECH: Record<string, string> = {
  서윤하:
    "반말, 짧은 문장, 차갑다. 감정은 안 드러낸다. 이모지 금지. 하십시오·바랍니다 같은 안내문 말투 금지.",
  "에델 라이트": "존댓말, 또박또박. 빈말은 안 한다. 이모지 금지.",
  세레나: "존댓말, 부드러운 문장. 빈정은 돌려 말한다.",
};

const OLD_USER_SETTING = [
  "어제 각성한 신입 헌터. 아직 스킬 하나다.",
  "이번 학기 편입생. 출신은 시골 남작 가문.",
  "현대인으로 살다 공작가 사람으로 환생했다. 전생은 숨긴다.",
  "어제 새벽 세 시 각성. 랭크 미정, 스킬 하나. 손목에 희미한 문양. 협회가 청룡에 붙여 오늘 첫 훈련이다.",
  "이번 학기 편입생. 변방 남작 가문. 어제 입학식. 거절 칸 없는 쪽지로 결투장에 불려 왔다.",
  "현대인으로 살다 공작가 몸으로 환생했다. 전생은 숨긴다. 거울의 얼굴이 아직 어색하다.",
  "스물. 키 176. 어두운 갈색 투블럭, 옅은 다크서클. 어제 새벽 세 시 각성. 랭크 미정, 스킬 하나. 손목 안쪽에 희미한 문양. 협회가 청룡에 붙여 오늘 첫 훈련이다. 회색 신입 점퍼, 단검, 물, 협회 수첩. 허세는 없다. 서윤하의 뒤를 놓치지 않으려 한다.",
  "열아홉. 키 174. 밤색 가르마 머리, 제복이 아직 어색하다. 변방 남작 가문 편입생. 어제 입학식. 거절 칸 없는 쪽지로 제3결투장에 불려 왔다. 속성 계약은 아직이다. 창과 검은 변방에서 독학. 수석 앞에서는 지지 않으려 한다. 이름을 먼저 밝히지 않는다.",
  "이 몸은 벨로드 공작가, 스물둘. 키 178. 검은 머리, 와인색 코트. 현대인으로 살다 이 몸으로 환생했다. 전생은 숨긴다. 거울의 얼굴과 손가락 굳은살이 아직 제것이 아니다. 오늘은 약혼 이야기가 오가는 날. 세레나 앞에서는 이 집의 예의를 먼저 지킨다.",
  "각성 하루 차, 랭크 미정. 스킬은 하나뿐이고 제어가 서툴다. 손목 안쪽에 희미한 문양. 허세 없고 현실적이다. 겁은 나지만 버티려 한다. 설명보다 따라가며 산다.",
  "변방 남작 가문 편입생. 속성 계약 전이라 마법은 약하고, 검·창은 독학으로 버틴다. 자존심이 세고 지지 않으려 한다. 이름을 먼저 밝히지 않는다. 낯선 곳에서도 물러서지 않으려 한다.",
  "현대인의 기억이 있는 공작가 몸. 이 몸의 예법·검술은 아직 익숙하지 않다. 전생은 숨긴다. 관찰력이 있고 말을 아끼며, 틀린 대답을 두려워한다.",
  "각성 하루 차의 미등록 헌터. 고유 스킬 ‘잔향’은 한 번 본 사람의 움직임을 몇 초 늦게 몸으로 재현한다. 검술·회피·발놀림을 흉내 낼 수 있지만 위력과 숙련도는 원본보다 낮고, 연속 사용하면 근육이 찢어지듯 아프며 기억이 뒤섞인다. 손목 안쪽 문양이 밝아질수록 과부하에 가깝다. 아직 랭크와 스킬명이 공식 등록되지 않았다. 허세가 없고 현실적이며, 겁이 나도 상황을 관찰하고 살아남을 방법부터 찾는다. 도움을 구하는 데 서툴고 약한 모습을 들키기 싫어한다. 지시를 무작정 믿기보다 이유를 기억해 두며, 한번 신뢰한 사람은 쉽게 버리지 않는다.",
  "변방 남작 가문의 편입생. 아직 정식 속성 계약을 맺지 못했지만, 타인의 마법식에서 빈틈을 보고 마력을 끼워 넣는 ‘무속성 간섭’ 재능이 있다. 완성된 마법을 깨뜨리거나 방향을 조금 비틀 수 있으나, 구조를 이해하지 못한 술식에는 통하지 않고 실패하면 역류로 손이 저린다. 검과 창은 영지의 용병에게 배워 정석보다 실전적인 버릇이 남아 있다. 자존심이 세고 무시당하면 물러서지 않지만, 모르는 것을 숨기기보다 혼자 밤새 익히는 쪽이다. 귀족 사회의 암묵적인 규칙에는 서툴고 호의를 빚으로 받아들인다. 이름이나 사정을 먼저 꺼내지 않으며, 실력으로 자리를 얻고 싶어 한다.",
  "현대인의 기억을 가진 채 벨로드 공작가 후계자의 몸에서 깨어났다. 이 몸에는 검술의 근육 기억과 약한 그림자 마법이 남아 있다. 그림자 속 작은 물건을 숨기거나 가까운 그림자 사이로 손을 뻗을 수 있지만, 주문과 한계를 몰라 오래 쓰면 체온이 떨어지고 의식을 잃는다. 귀족 예법과 가문의 인간관계는 단편적인 몸의 기억에 의존한다. 관찰력이 좋고 모르는 상황에서는 말을 아끼며, 상대의 호칭과 반응을 먼저 본다. 전생을 들키는 것을 가장 경계하고 틀린 대답을 두려워한다. 현대의 도덕관과 공작가의 책임 사이에서 갈등하며, 사람을 신분만으로 대하는 데 익숙하지 않다.",
];

const OLD_ONE_LINERS: Record<string, string[]> = {
  서윤하: [
    "S급 근접 헌터. 말은 짧고 차갑다.",
    "말은 짧다. 신입이 따라온 뒤에야 문을 연다.",
  ],
  "에델 라이트": ["창끝을 내리지 않은 채, 한 번 훑는다."],
  세레나: ["부드러운 말 속에, 이 사람이 맞는지 잰다."],
};

const OLD_OPENING: Record<string, string> = {
  서윤하:
    "E급 연습 던전 앞에서 신입인 유저를 기다리고 있다. 오늘은 생존 훈련이다.",
  "에델 라이트":
    "입학식 다음 날, 결투장에서 편입생인 유저의 실력을 확인하고 있다.",
  세레나:
    "벨로드 저택 온실에서 환생한 유저를 마주친다. 오늘은 약혼 이야기가 오가는 날이다.",
};

function isLegacyPresetPhoto(current: string | undefined, next: string) {
  const stem = next.replace(/\.webp$/, "");
  return current === `${stem}.jpg` || current === `${stem}.png`;
}

export function backfillPresetMeta(record: SettingRecord): SettingRecord {
  const preset = WORLD_PRESETS.find(
    (item) => item.character.name === record.character.name.trim(),
  );
  const notes = (record.castNotes ?? []).map((note) => ({
    ...note,
    photo: note.photo ?? "",
  }));
  if (!preset) return { ...record, castNotes: notes };

  const name = preset.character.name;
  const oldHunterSpeech = "존댓말, 짧은 문장, 이모지 금지. 감정은 잘 안 드러낸다.";
  const castByName = new Map(preset.cast.map((item) => [item.name, item]));
  const worldPrefix = OLD_WORLD_PREFIX[name];
  const prologuePrefixes = OLD_PROLOGUE_PREFIX[name] ?? [];
  const oldExact = (OLD_PROLOGUE_EXACT[name] ?? []).map((text) => text.trim());
  const stockPrologue =
    !record.prologue.trim() ||
    prologuePrefixes.some((prefix) => record.prologue.startsWith(prefix)) ||
    oldExact.includes(record.prologue.trim());
  const stockUser = OLD_USER_SETTING.includes(record.userPersona.setting.trim());
  const stockWorld =
    (Boolean(worldPrefix) && record.worldSetting.startsWith(worldPrefix)) ||
    record.worldSetting.trim() === (OLD_WORLD_SETTINGS[name] ?? "").trim();
  const renamedWorld =
    name === "에델 라이트"
      ? record.worldSetting
          .replaceAll("성창 아카데미", "루멘 아카데미")
          .replaceAll("성창 왕국", "에르베인 왕국")
      : record.worldSetting;
  const renamedCharacterSetting =
    name === "에델 라이트"
      ? (record.character.setting ?? "").replaceAll(
          "성창 아카데미",
          "루멘 아카데미",
        )
      : record.character.setting;

  return {
    ...record,
    prologue: stockPrologue ? preset.prologue : record.prologue,
    worldSetting: stockWorld ? preset.worldSetting : renamedWorld,
    character: {
      ...record.character,
      photo:
        !record.character.photo?.trim() ||
        isLegacyPresetPhoto(record.character.photo, preset.character.photo)
          ? preset.character.photo
          : record.character.photo,
      oneLiner: (OLD_ONE_LINERS[name] ?? []).includes(
        record.character.oneLiner.trim(),
      )
        ? preset.character.oneLiner
        : record.character.oneLiner,
      setting:
        !record.character.setting?.trim() ||
        (OLD_CHARACTER_SETTINGS[name] ?? []).includes(record.character.setting.trim())
          ? preset.character.setting
          : renamedCharacterSetting,
      speechStyle:
        record.character.speechStyle.trim() === oldHunterSpeech ||
        record.character.speechStyle.trim() === (OLD_SPEECH[name] ?? "")
          ? preset.character.speechStyle
          : record.character.speechStyle,
      appearance:
        record.character.appearance.trim() === (OLD_APPEARANCE[name] ?? "")
          ? preset.character.appearance
          : record.character.appearance,
      openingSituation:
        record.character.openingSituation.trim() === (OLD_OPENING[name] ?? "")
          ? preset.character.openingSituation
          : record.character.openingSituation,
    },
    userPersona: {
      ...record.userPersona,
      name:
        stockUser && (!record.userPersona.name.trim() || record.userPersona.name.trim() === "나")
          ? preset.userPersona.name
          : record.userPersona.name,
      setting: stockUser ? preset.userPersona.setting : record.userPersona.setting,
      photo:
        (stockUser && !record.userPersona.photo?.trim()) ||
        isLegacyPresetPhoto(record.userPersona.photo, preset.userPersona.photo)
          ? preset.userPersona.photo
          : (record.userPersona.photo ?? ""),
    },
    castNotes: notes.map((note) => {
      const next = castByName.get(note.name.trim());
      if (!next) return note;
      const oldNotes = [
        OLD_CAST_NOTES[note.name.trim()],
        OLD_CAST_NOTES_V2[note.name.trim()],
        OLD_CAST_NOTES_V3[note.name.trim()],
      ].filter((value): value is string => Boolean(value));
      return {
        ...note,
        photo:
          !note.photo?.trim() || isLegacyPresetPhoto(note.photo, next.photo)
            ? next.photo
            : note.photo,
        note: oldNotes.includes(note.note)
          ? next.note
          : note.name.trim() === "드레이크"
            ? note.note.replaceAll("성창의 봉인", "초대 계약석의 봉인")
            : note.note,
      };
    }),
  };
}

function applyForbidden(record: SettingRecord): SettingRecord {
  const forbiddenManual = Boolean(record.character.forbiddenManual);
  return {
    ...record,
    title: record.title ?? "",
    shareId: record.shareId ?? null,
    personaId: record.personaId ?? null,
    prologue: record.prologue ?? "",
    storyPins: normalizePins(record.storyPins),
    castNotes: (record.castNotes ?? []).map((note) => ({
      id: note.id,
      name: note.name ?? "",
      note: clip(note.note ?? "", FIELD_LIMITS.castNote),
      photo: note.photo ?? "",
    })),
    worldSetting: clip(record.worldSetting ?? "", FIELD_LIMITS.worldSetting),
    userPersona: {
      ...record.userPersona,
      photo: record.userPersona.photo ?? "",
      setting: clip(record.userPersona.setting ?? "", FIELD_LIMITS.userSetting),
    },
    character: {
      ...record.character,
      photo: record.character.photo ?? "",
      setting: clip(record.character.setting ?? "", FIELD_LIMITS.characterSetting),
      speechStyle: clip(record.character.speechStyle ?? "", FIELD_LIMITS.speechStyle),
      appearance: clip(record.character.appearance ?? "", FIELD_LIMITS.appearance),
      openingSituation: clip(
        record.character.openingSituation ?? "",
        FIELD_LIMITS.openingSituation,
      ),
      forbiddenManual,
      forbidden: forbiddenManual
        ? clip(record.character.forbidden, FIELD_LIMITS.forbidden)
        : buildForbidden({
            name: record.character.name,
            speechStyle: record.character.speechStyle,
            appearance: record.character.appearance,
            worldSetting: record.worldSetting,
            openingSituation: record.character.openingSituation,
          }),
    },
  };
}

export function toPlayState(store: AppStore): PlayState {
  const current =
    store.settings.find((item) => item.id === store.currentSettingId) ??
    store.settings[0] ??
    createEmptySetting();

  return {
    apiKey: store.apiKey,
    character: {
      ...current.character,
      photo: current.character.photo ?? "",
    },
    userPersona: {
      ...current.userPersona,
      photo: current.userPersona.photo ?? "",
    },
    worldSetting: current.worldSetting,
    prologue: current.prologue ?? "",
    storySummary: current.storySummary,
    storyPins: normalizePins(current.storyPins),
    castNotes: current.castNotes,
    chatLog: current.chatLog,
    shortTermBuffer: current.shortTermBuffer,
    turnCount: current.turnCount,
    cloudSessionId: current.cloudSessionId,
  };
}

function isStore(value: unknown): value is AppStore {
  if (!value || typeof value !== "object") return false;
  const store = value as AppStore;
  return Array.isArray(store.settings) && typeof store.currentSettingId === "string";
}

function migrateLegacy(parsed: PlayState): AppStore {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "migrated";
  const setting: SettingRecord = {
    id,
    title: "",
    shareId: null,
    updatedAt: new Date().toISOString(),
    character: parsed.character ?? createEmptyPlayState().character,
    userPersona: parsed.userPersona ?? createEmptyPlayState().userPersona,
    worldSetting: parsed.worldSetting ?? "",
    prologue: parsed.prologue ?? "",
    storySummary: parsed.storySummary ?? "",
    storyPins: normalizePins(parsed.storyPins),
    castNotes: parsed.castNotes ?? [],
    chatLog: parsed.chatLog ?? [],
    shortTermBuffer: parsed.shortTermBuffer ?? [],
    turnCount: parsed.turnCount ?? 0,
    cloudSessionId: parsed.cloudSessionId ?? null,
    personaId: null,
  };

  return {
    apiKey: parsed.apiKey ?? "",
    currentSettingId: id,
    settings: [setting],
    personas: [],
    lastPersonaId: null,
  };
}

function normalizePersonas(value: unknown): SavedPersona[] {
  if (!Array.isArray(value)) return [];
  const personas: SavedPersona[] = [];
  for (const item of value) {
    if (personas.length >= PERSONAS_MAX) break;
    if (!item || typeof item !== "object") continue;
    const row = item as SavedPersona;
    const name = String(row.name ?? "").trim();
    if (!name) continue;
    personas.push({
      id: typeof row.id === "string" && row.id ? row.id : crypto.randomUUID(),
      label: String(row.label ?? "").slice(0, FIELD_LIMITS.personaLabel),
      name: name.slice(0, FIELD_LIMITS.userName),
      setting: String(row.setting ?? "").slice(0, FIELD_LIMITS.userSetting),
      photo: typeof row.photo === "string" ? row.photo : "",
      updatedAt:
        typeof row.updatedAt === "string" && row.updatedAt
          ? row.updatedAt
          : new Date().toISOString(),
    });
  }
  return personas;
}

export function loadStore(): AppStore {
  if (typeof window === "undefined") return createEmptyStore();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyStore();
    const parsed = JSON.parse(raw) as unknown;
    if (isStore(parsed) && parsed.settings.length > 0) {
      const next = {
        ...parsed,
        personas: normalizePersonas(parsed.personas),
        lastPersonaId: parsed.lastPersonaId ?? null,
        settings: parsed.settings.map((item) =>
          applyForbidden(backfillPresetMeta(item)),
        ),
      };
      lastSaved = raw;
      return next;
    }
    const migrated = migrateLegacy({
      ...createEmptyPlayState(),
      ...(parsed as PlayState),
    });
    return {
      ...migrated,
      personas: [],
      lastPersonaId: null,
      settings: migrated.settings.map((item) =>
        applyForbidden(backfillPresetMeta(item)),
      ),
    };
  } catch {
    return createEmptyStore();
  }
}

export function saveStore(store: AppStore) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(store);
  if (raw === lastSaved) return;
  lastSaved = raw;
  window.localStorage.setItem(STORAGE_KEY, raw);
}

export function loadPlayState(): PlayState {
  return toPlayState(loadStore());
}

export function savePlayState(state: PlayState) {
  const store = loadStore();
  const currentId = store.currentSettingId;
  const next: AppStore = {
    ...store,
    apiKey: state.apiKey,
    settings: store.settings.map((item) =>
      item.id === currentId
        ? {
            ...item,
            ...state,
            id: item.id,
            title: item.title,
            shareId: item.shareId ?? null,
            updatedAt: new Date().toISOString(),
          }
        : item,
    ),
  };
  saveStore(next);
}

export function clip(value: string, max: number) {
  return value.slice(0, max);
}

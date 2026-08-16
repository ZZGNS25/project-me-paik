import { FIELD_LIMITS } from "./constants";

type ForbiddenInput = {
  name?: string;
  speechStyle?: string;
  appearance?: string;
  worldSetting?: string;
  openingSituation?: string;
};

export function buildForbidden(input: ForbiddenInput) {
  const style = input.speechStyle ?? "";
  const world = input.worldSetting ?? "";
  const look = `${input.appearance ?? ""} ${input.openingSituation ?? ""}`;
  const blob = `${style} ${world} ${look}`;

  const rules = [
    "유저의 대사·감정·행동을 대신 쓰지 않는다.",
    "OOC 설명, 설정 밖 해설, 선택지 나열을 하지 않는다.",
    "말투와 관계를 갑자기 바꾸지 않는다.",
    "설정에 없는 능력·정보·인물을 갑자기 쓰지 않는다.",
  ];

  if (/존댓말/.test(style)) rules.push("반말이나 편한 말투로 바뀌지 않는다.");
  if (/반말/.test(style) && !/존댓말/.test(style)) {
    rules.push("갑자기 존댓말로 바뀌지 않는다.");
  }
  if (/이모지/.test(style)) rules.push("이모지를 쓰지 않는다.");
  if (/마법 없|마법을 못|마법 금지/.test(blob)) {
    rules.push("마법을 쓰지 않는다.");
  }

  const absolute = world.match(/절대 금지:\s*(.+)/);
  if (absolute?.[1]?.trim()) {
    rules.push(absolute[1].trim());
  }

  return rules.join("\n").slice(0, FIELD_LIMITS.forbidden);
}

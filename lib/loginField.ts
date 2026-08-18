import { FACE_LIBRARY } from "@/lib/faceLibrary";

export const LOGIN_FIELD_FACES = FACE_LIBRARY;

export function loginFieldRow(offset: number) {
  const start = ((offset % LOGIN_FIELD_FACES.length) + LOGIN_FIELD_FACES.length) % LOGIN_FIELD_FACES.length;
  return [...LOGIN_FIELD_FACES.slice(start), ...LOGIN_FIELD_FACES.slice(0, start)];
}

import { deletePlayFromCloud } from "./cloud";

export async function deleteSettingWithCloud(
  deleteSetting: (id: string) => void,
  setting: { id: string; cloudSessionId: string | null },
) {
  if (setting.cloudSessionId) {
    try {
      await deletePlayFromCloud(setting.cloudSessionId);
    } catch {
      // 로컬은 지운다.
    }
  }
  deleteSetting(setting.id);
}

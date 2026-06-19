import { SettingsForm } from "@/components/dashboard/settings-form";
import { getOrCreateDefaultSettings } from "@/lib/service";

export default async function SettingsPage() {
  const settings = await getOrCreateDefaultSettings();

  return <SettingsForm initialSettings={settings} />;
}

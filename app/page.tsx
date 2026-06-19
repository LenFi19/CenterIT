import { DashboardApp } from "@/components/dashboard/dashboard-app";
import { getOrCreateDefaultSettings } from "@/lib/service";

export default async function HomePage() {
  const settings = await getOrCreateDefaultSettings();

  return <DashboardApp initialSettings={settings} />;
}

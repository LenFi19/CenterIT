"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { Settings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-centerit-role": "admin",
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      return;
    }

    const nextSettings = (await response.json()) as Settings;
    setSettings(nextSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 text-zinc-100 md:p-8">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="size-4" /> Zurück zum Dashboard
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>CenterIT Einstellungen</CardTitle>
            <CardDescription>Titel, Branding und Darstellung des Dashboards anpassen.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={save}>
              <div className="space-y-2">
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  value={settings.title}
                  onChange={(event) => setSettings((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={settings.logoUrl ?? ""}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, logoUrl: event.target.value || null }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accentColor">Akzentfarbe</Label>
                <Input
                  id="accentColor"
                  type="text"
                  value={settings.accentColor}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, accentColor: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serverAddress">Server-Adresse</Label>
                <Input
                  id="serverAddress"
                  value={settings.serverAddress}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, serverAddress: event.target.value }))
                  }
                />
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, darkMode: checked }))}
                  />
                  <Label>Dunkelmodus</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.showServerAddress}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, showServerAddress: checked }))
                    }
                  />
                  <Label>Server-Adresse anzeigen</Label>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit">Speichern</Button>
                {saved ? <span className="text-sm text-emerald-400">Gespeichert</span> : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

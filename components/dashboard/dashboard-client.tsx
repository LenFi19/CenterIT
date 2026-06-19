"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, Shield, Star, StarOff } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const UNCATEGORIZED_LABEL = "Unkategorisiert";

export type DashboardService = {
  id: number;
  name: string;
  description: string | null;
  url: string;
  icon: string | null;
  favorite: boolean;
  adminOnly: boolean;
  order: number;
  category: { id: number; name: string; order: number } | null;
};

type DashboardClientProps = {
  services: DashboardService[];
  isAdmin: boolean;
  adminModeEnabled: boolean;
  adminToken: string | null;
  settings: {
    dashboardTitle: string;
    logoUrl: string | null;
    accentColor: string;
    darkMode: boolean;
    serverAddress: string;
  };
};

export function DashboardClient({ services, isAdmin, adminModeEnabled, adminToken, settings }: DashboardClientProps) {
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const loadStatus = async () => {
      if (services.length === 0) {
        setStatuses({});
        return;
      }

      const ids = services.map((service) => service.id).join(",");
      const tokenQuery = isAdmin && adminToken ? `&token=${encodeURIComponent(adminToken)}` : "";
      const response = await fetch(`/api/services/status?ids=${ids}${tokenQuery}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const payload: { statuses: Record<string, boolean> } = await response.json();
      const nextStatuses = Object.fromEntries(
        Object.entries(payload.statuses).map(([key, value]) => [Number(key), value]),
      );
      setStatuses(nextStatuses);
    };

    loadStatus();
    const interval = window.setInterval(loadStatus, 30_000);

    return () => window.clearInterval(interval);
  }, [adminToken, isAdmin, services]);

  const filteredServices = useMemo(() => {
    const loweredSearch = search.toLowerCase().trim();

    if (!loweredSearch) {
      return [...services].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    }

    return services
      .filter((service) => {
        const haystack = [service.name, service.description ?? "", service.category?.name ?? ""]
          .join(" ")
          .toLowerCase();
        return haystack.includes(loweredSearch);
      })
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  }, [search, services]);

  const favoriteServices = filteredServices.filter((service) => service.favorite);

  const groupedServices = filteredServices.reduce<Record<string, DashboardService[]>>((acc, service) => {
    const key = service.category?.name ?? UNCATEGORIZED_LABEL;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(service);
    return acc;
  }, {});

  const categoryOrder = (categoryName: string): number => {
    const firstService = filteredServices.find(
      (service) => (service.category?.name ?? UNCATEGORIZED_LABEL) === categoryName,
    );
    return firstService?.category?.order ?? Number.MAX_SAFE_INTEGER;
  };

  const containerTheme = settings.darkMode
    ? "min-h-screen bg-zinc-950 text-zinc-100"
    : "min-h-screen bg-zinc-100 text-zinc-900";

  return (
    <div className={containerTheme} style={{ ["--accent-color" as string]: settings.accentColor }}>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {settings.logoUrl ? (
              <Image
                src={settings.logoUrl}
                alt="CenterIT Logo"
                width={40}
                height={40}
                loader={({ src }) => src}
                unoptimized
                className="h-10 w-10 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-800 text-sm font-semibold">CI</div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{settings.dashboardTitle}</h1>
              <p className="text-sm text-zinc-400">Server: {settings.serverAddress}</p>
            </div>
          </div>
          {adminModeEnabled && (
            <>
              {isAdmin ? (
                <Link
                  href="/"
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-700 px-3 text-sm font-medium transition-colors hover:border-[var(--accent-color)]"
                >
                  <Shield className="h-4 w-4" />
                  Als Gast anzeigen
                </Link>
              ) : (
                <div className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-700 px-3 text-sm font-medium text-zinc-400">
                  <Shield className="h-4 w-4" />
                  Admin: /?token=...
                </div>
              )}
            </>
          )}
        </header>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Suche nach Diensten oder Kategorien"
            className="pl-9"
          />
        </div>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Star className="h-4 w-4" /> Favoriten
          </h2>
          {favoriteServices.length === 0 ? (
            <p className="text-sm text-zinc-400">Keine Favoriten gefunden.</p>
          ) : (
            <ServiceGrid services={favoriteServices} statuses={statuses} />
          )}
        </section>

        {Object.keys(groupedServices)
          .sort((a, b) => categoryOrder(a) - categoryOrder(b) || a.localeCompare(b))
          .map((category) => (
            <section key={category} className="space-y-3">
              <h2 className="text-lg font-semibold">{category}</h2>
              <ServiceGrid services={groupedServices[category]} statuses={statuses} />
            </section>
          ))}
      </main>
    </div>
  );
}

type ServiceGridProps = {
  services: DashboardService[];
  statuses: Record<number, boolean>;
};

function ServiceGrid({ services, statuses }: ServiceGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {services.map((service) => {
        const isOnline = statuses[service.id];

        return (
          <a
            key={service.id}
            href={service.url}
            target="_blank"
            rel="noreferrer"
            className="transition-transform duration-200 hover:-translate-y-1"
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-1">{service.name}</CardTitle>
                  <Badge variant={isOnline ? "success" : "destructive"}>{isOnline ? "Online" : "Offline"}</Badge>
                </div>
                <CardDescription className="line-clamp-2">{service.description ?? "Keine Beschreibung"}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-2 text-sm text-zinc-400">
                <span className="truncate">{service.icon ?? "🔗"}</span>
                {service.favorite ? <Star className="h-4 w-4 text-amber-400" /> : <StarOff className="h-4 w-4" />}
              </CardContent>
            </Card>
          </a>
        );
      })}
    </div>
  );
}

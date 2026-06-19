"use client";

import Image from "next/image";
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
  settings: {
    dashboardTitle: string;
    logoUrl: string | null;
    accentColor: string;
    darkMode: boolean;
    serverAddress: string;
  };
};

export function DashboardClient({ services, isAdmin, adminModeEnabled, settings }: DashboardClientProps) {
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<Record<number, "online" | "offline" | "unknown">>({});
  const [adminTokenInput, setAdminTokenInput] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let isDisposed = false;

    const loadStatus = async () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      if (services.length === 0) {
        if (!isDisposed) {
          setStatuses({});
        }
        return;
      }

      const ids = services.map((service) => service.id).join(",");
      const response = await fetch(`/api/services/status?ids=${ids}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const payload: { statuses: Record<string, "online" | "offline" | "unknown"> } = await response.json();
      const nextStatuses = Object.fromEntries(
        Object.entries(payload.statuses).map(([key, value]) => [Number(key), value]),
      );
      if (!isDisposed) {
        setStatuses(nextStatuses);
      }
    };

    loadStatus();
    const interval = window.setInterval(loadStatus, 45_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadStatus();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isDisposed = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [services]);

  const signInAdmin = async () => {
    if (!adminTokenInput.trim()) {
      setAuthError("Bitte Admin-Token eingeben.");
      return;
    }

    setAuthError(null);
    setIsAuthSubmitting(true);

    try {
      const response = await fetch("/api/auth/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: adminTokenInput }),
      });

      if (!response.ok) {
        const payload: { error?: { message?: string } } = await response.json().catch(() => ({}));
        setAuthError(payload.error?.message ?? "Admin-Anmeldung fehlgeschlagen.");
        return;
      }

      setAdminTokenInput("");
      window.location.reload();
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const signOutAdmin = async () => {
    await fetch("/api/auth/admin", {
      method: "DELETE",
    });
    window.location.reload();
  };

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
                <button
                  type="button"
                  onClick={signOutAdmin}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-700 px-3 text-sm font-medium transition-colors hover:border-[var(--accent-color)]"
                >
                  <Shield className="h-4 w-4" />
                  Admin beenden
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    value={adminTokenInput}
                    onChange={(event) => setAdminTokenInput(event.target.value)}
                    placeholder="Admin-Token"
                    className="h-10 w-48"
                  />
                  <button
                    type="button"
                    onClick={signInAdmin}
                    disabled={isAuthSubmitting}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-700 px-3 text-sm font-medium transition-colors hover:border-[var(--accent-color)] disabled:opacity-60"
                  >
                    <Shield className="h-4 w-4" />
                    Admin anmelden
                  </button>
                </div>
              )}
            </>
          )}
        </header>
        {authError ? <p className="text-sm text-red-400">{authError}</p> : null}

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
  statuses: Record<number, "online" | "offline" | "unknown">;
};

function ServiceGrid({ services, statuses }: ServiceGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {services.map((service) => {
        const status = statuses[service.id] ?? "unknown";
        const badgeLabel = status === "online" ? "Online" : status === "offline" ? "Offline" : "Unbekannt";
        const badgeVariant = status === "online" ? "success" : status === "offline" ? "destructive" : "default";

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
                  <Badge variant={badgeVariant}>{badgeLabel}</Badge>
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

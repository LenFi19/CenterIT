"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Settings2, Shield, Star, Trash2 } from "lucide-react";

import { getServiceIcon } from "@/lib/icons";
import type { Category, Service, Settings } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type DashboardAppProps = {
  initialSettings: Settings;
};

type ServiceFormState = {
  id?: number;
  name: string;
  description: string;
  url: string;
  icon: string;
  categoryId: string;
  favorite: boolean;
  adminOnly: boolean;
  sortOrder: string;
};

const emptyServiceForm: ServiceFormState = {
  name: "",
  description: "",
  url: "",
  icon: "Server",
  categoryId: "",
  favorite: false,
  adminOnly: false,
  sortOrder: "0",
};

export function DashboardApp({ initialSettings }: DashboardAppProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [role, setRole] = useState<"guest" | "admin">("guest");
  const [query, setQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, boolean>>({});
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(emptyServiceForm);
  const [isSaving, setIsSaving] = useState(false);

  async function fetchSettings() {
    const response = await fetch("/api/settings", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as Settings;
    setSettings(data);
  }

  async function fetchCategories() {
    const response = await fetch("/api/categories", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as Category[];
    setCategories(data);

    if (!serviceForm.categoryId && data.length > 0) {
      setServiceForm((prev) => ({ ...prev, categoryId: String(data[0].id) }));
    }
  }

  async function fetchServices(nextQuery = query, nextRole = role) {
    const search = nextQuery ? `&search=${encodeURIComponent(nextQuery)}` : "";
    const response = await fetch(`/api/services?role=${nextRole}${search}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as Service[];
    setServices(data);
  }

  async function updateStatus(currentServices: Service[]) {
    if (currentServices.length === 0) {
      setStatusMap({});
      return;
    }

    const response = await fetch("/api/services/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ urls: currentServices.map((service) => service.url) }),
    });

    if (!response.ok) {
      return;
    }

    const checks = (await response.json()) as Array<{ url: string; online: boolean }>;
    setStatusMap(
      checks.reduce<Record<string, boolean>>((acc, check) => {
        acc[check.url] = check.online;
        return acc;
      }, {}),
    );
  }

  useEffect(() => {
    fetchSettings();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchServices(query, role);
  }, [query, role]);

  useEffect(() => {
    updateStatus(services);

    // Poll service reachability every 30 seconds to keep status badges fresh.
    const interval = setInterval(() => {
      updateStatus(services);
    }, 30_000);

    return () => clearInterval(interval);
  }, [services]);

  const groupedServices = useMemo(() => {
    return services.reduce<Record<string, Service[]>>((acc, service) => {
      const key = service.category.name;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(service);
      return acc;
    }, {});
  }, [services]);

  const favorites = useMemo(() => services.filter((service) => service.favorite), [services]);

  async function saveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!serviceForm.categoryId) {
      return;
    }

    setIsSaving(true);

    const payload = {
      name: serviceForm.name,
      description: serviceForm.description,
      url: serviceForm.url,
      icon: serviceForm.icon,
      categoryId: Number(serviceForm.categoryId),
      favorite: serviceForm.favorite,
      adminOnly: serviceForm.adminOnly,
      sortOrder: Number(serviceForm.sortOrder || 0),
    };

    const requestInit: RequestInit = {
      method: serviceForm.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        "x-centerit-role": "admin",
      },
      body: JSON.stringify(payload),
    };

    const endpoint = serviceForm.id ? `/api/services/${serviceForm.id}` : "/api/services";
    const response = await fetch(endpoint, requestInit);

    setIsSaving(false);

    if (!response.ok) {
      return;
    }

    setServiceForm({
      ...emptyServiceForm,
      categoryId: categories[0] ? String(categories[0].id) : "",
    });

    await fetchServices(query, role);
  }

  async function deleteService(id: number) {
    const response = await fetch(`/api/services/${id}`, {
      method: "DELETE",
      headers: {
        "x-centerit-role": "admin",
      },
    });

    if (!response.ok) {
      return;
    }

    await fetchServices(query, role);
  }

  function editService(service: Service) {
    setServiceForm({
      id: service.id,
      name: service.name,
      description: service.description,
      url: service.url,
      icon: service.icon,
      categoryId: String(service.categoryId),
      favorite: service.favorite,
      adminOnly: service.adminOnly,
      sortOrder: String(service.sortOrder),
    });
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: settings.accentColor }}>
                {settings.title}
              </h1>
              {settings.showServerAddress ? (
                <p className="text-sm text-zinc-400">Server: {settings.serverAddress}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={role === "guest" ? "secondary" : "outline"}
                onClick={() => setRole("guest")}
              >
                Gast
              </Button>
              <Button
                variant={role === "admin" ? "secondary" : "outline"}
                onClick={() => setRole("admin")}
              >
                <Shield className="size-4" />
                Admin
              </Button>
              <Link href="/settings">
                <Button variant="outline">
                  <Settings2 className="size-4" />
                  Einstellungen
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-zinc-500" />
            <Input
              className="pl-9"
              placeholder="Dienste suchen..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </header>

        {favorites.length > 0 ? (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Star className="size-5 text-amber-400" /> Favoriten
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {favorites.map((service) => (
                <ServiceCard
                  key={`favorite-${service.id}`}
                  service={service}
                  isOnline={statusMap[service.url] ?? false}
                  canManage={role === "admin"}
                  onEdit={editService}
                  onDelete={deleteService}
                />
              ))}
            </div>
          </section>
        ) : null}

        {Object.entries(groupedServices).map(([category, categoryServices]) => (
          <section key={category} className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-200">{category}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {categoryServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isOnline={statusMap[service.url] ?? false}
                  canManage={role === "admin"}
                  onEdit={editService}
                  onDelete={deleteService}
                />
              ))}
            </div>
          </section>
        ))}

        {role === "admin" ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="size-4" /> Service verwalten
              </CardTitle>
              <CardDescription>Dienste erstellen, bearbeiten oder entfernen.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={saveService}>
                <div className="space-y-2">
                  <Label htmlFor="service-name">Name</Label>
                  <Input
                    id="service-name"
                    value={serviceForm.name}
                    onChange={(event) => setServiceForm((prev) => ({ ...prev, name: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-url">URL</Label>
                  <Input
                    id="service-url"
                    type="url"
                    value={serviceForm.url}
                    onChange={(event) => setServiceForm((prev) => ({ ...prev, url: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="service-description">Beschreibung</Label>
                  <Textarea
                    id="service-description"
                    value={serviceForm.description}
                    onChange={(event) =>
                      setServiceForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-icon">Icon-Name (z. B. Server, Cloud)</Label>
                  <Input
                    id="service-icon"
                    value={serviceForm.icon}
                    onChange={(event) => setServiceForm((prev) => ({ ...prev, icon: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-category">Kategorie</Label>
                  <Select
                    id="service-category"
                    value={serviceForm.categoryId}
                    onChange={(event) =>
                      setServiceForm((prev) => ({ ...prev, categoryId: event.target.value }))
                    }
                    options={categories.map((category) => ({
                      value: String(category.id),
                      label: category.name,
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-sort-order">Reihenfolge</Label>
                  <Input
                    id="service-sort-order"
                    type="number"
                    value={serviceForm.sortOrder}
                    onChange={(event) =>
                      setServiceForm((prev) => ({ ...prev, sortOrder: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      checked={serviceForm.favorite}
                      onCheckedChange={(checked) =>
                        setServiceForm((prev) => ({ ...prev, favorite: checked }))
                      }
                    />
                    <Label>Favorit</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={serviceForm.adminOnly}
                      onCheckedChange={(checked) =>
                        setServiceForm((prev) => ({ ...prev, adminOnly: checked }))
                      }
                    />
                    <Label>Nur Administrator</Label>
                  </div>
                </div>
                <div className="md:col-span-2 flex flex-wrap gap-2">
                  <Button type="submit" disabled={isSaving}>
                    {serviceForm.id ? "Service aktualisieren" : "Service anlegen"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setServiceForm(emptyServiceForm)}
                  >
                    Zurücksetzen
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

type ServiceCardProps = {
  service: Service;
  isOnline: boolean;
  canManage: boolean;
  onEdit: (service: Service) => void;
  onDelete: (id: number) => void;
};

function ServiceCard({ service, isOnline, canManage, onEdit, onDelete }: ServiceCardProps) {
  const Icon = getServiceIcon(service.icon);

  return (
    <Card className="transition hover:border-zinc-600 hover:bg-zinc-900">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="size-5 text-zinc-300" />
            <CardTitle>{service.name}</CardTitle>
          </div>
          <Badge variant={isOnline ? "success" : "danger"}>{isOnline ? "online" : "offline"}</Badge>
        </div>
        <CardDescription>{service.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <a
          className="inline-flex text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
          href={service.url}
          target="_blank"
          rel="noreferrer"
        >
          Service öffnen
        </a>
        {canManage ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(service)}>
              <Pencil className="size-3.5" /> Bearbeiten
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(service.id)}>
              <Trash2 className="size-3.5" /> Löschen
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

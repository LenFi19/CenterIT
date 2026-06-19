export type ServiceHealthStatus = "online" | "offline" | "unknown";

export function parseServiceIds(idsParam: string | null) {
  if (!idsParam) {
    return null;
  }

  const ids = idsParam
    .split(",")
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (ids.length === 0) {
    return null;
  }

  return Array.from(new Set(ids));
}

export async function checkServiceStatus(url: string): Promise<ServiceHealthStatus> {
  try {
    const headResponse = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });

    if (headResponse.ok) {
      return "online";
    }
  } catch {
    // ignored, fallback to GET request below
  }

  try {
    const getResponse = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });

    return getResponse.ok ? "online" : "offline";
  } catch {
    return "unknown";
  }
}

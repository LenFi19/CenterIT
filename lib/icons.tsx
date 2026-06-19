import {
  Cloud,
  Code2,
  Container,
  HardDrive,
  House,
  MonitorSmartphone,
  Music,
  Server,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Server,
  House,
  HardDrive,
  Container,
  Cloud,
  Music,
  Code2,
  MonitorSmartphone,
};

export function getServiceIcon(icon?: string): LucideIcon {
  if (!icon) {
    return Server;
  }

  return iconMap[icon] ?? Server;
}

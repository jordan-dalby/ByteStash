import React from "react";
import {
  Info,
  Lightbulb,
  MessageSquareWarning,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";

type AdmonitionType = "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";

const CONFIG: Record<
  AdmonitionType,
  {
    title: string;
    container: string;
    bar: string;
    titleColor: string;
    iconColor: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  NOTE: {
    title: "Note",
    container: "bg-blue-500/10 dark:bg-blue-500/10",
    bar: "bg-blue-500",
    titleColor: "text-blue-600 dark:text-blue-400",
    iconColor: "text-blue-500",
    Icon: Info,
  },
  TIP: {
    title: "Tip",
    container: "bg-green-500/10 dark:bg-green-500/10",
    bar: "bg-green-500",
    titleColor: "text-green-600 dark:text-green-400",
    iconColor: "text-green-500",
    Icon: Lightbulb,
  },
  IMPORTANT: {
    title: "Important",
    container: "bg-purple-500/10 dark:bg-purple-500/10",
    bar: "bg-purple-500",
    titleColor: "text-purple-600 dark:text-purple-400",
    iconColor: "text-purple-500",
    Icon: MessageSquareWarning,
  },
  WARNING: {
    title: "Warning",
    container: "bg-amber-500/10 dark:bg-amber-500/10",
    bar: "bg-amber-500",
    titleColor: "text-amber-600 dark:text-amber-400",
    iconColor: "text-amber-500",
    Icon: AlertTriangle,
  },
  CAUTION: {
    title: "Caution",
    container: "bg-red-500/10 dark:bg-red-500/10",
    bar: "bg-red-500",
    titleColor: "text-red-600 dark:text-red-400",
    iconColor: "text-red-500",
    Icon: AlertOctagon,
  },
};

const Admonition: React.FC<{ type: string; children: React.ReactNode }> = ({
  type,
  children,
}) => {
  const key = (type?.toUpperCase() as AdmonitionType) || "NOTE";
  const cfg = CONFIG[key] || CONFIG.NOTE;

  return (
    <div className={`not-prose my-3 relative overflow-hidden ${cfg.container}`}>
      <div className="flex items-stretch">
        <span
          aria-hidden
          className={`block w-1 ${cfg.bar}`}
          style={{ minHeight: "100%", height: "auto" }}
        />
        <div className="flex items-start flex-1 gap-2 p-2">
          <cfg.Icon className={`mt-0.5 h-5 w-5 ${cfg.iconColor}`} />
          <div className="flex-1">
            <div className={`font-semibold ${cfg.titleColor}`}>{cfg.title}</div>
            {children && (
              <div className="mt-1 text-sm leading-relaxed">{children}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admonition;

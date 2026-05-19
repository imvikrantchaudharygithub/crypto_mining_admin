import clsx from "clsx";

type PillTone = "success" | "warning" | "neutral" | "danger";

type PillProps = {
  tone: PillTone;
  children: React.ReactNode;
};

const toneClassMap: Record<PillTone, string> = {
  success: "status-pill-success",
  warning: "status-pill-warning",
  neutral: "status-pill-neutral",
  danger: "status-pill-danger"
};

export function Pill({ tone, children }: PillProps) {
  return <span className={clsx("status-pill", toneClassMap[tone])}>{children}</span>;
}

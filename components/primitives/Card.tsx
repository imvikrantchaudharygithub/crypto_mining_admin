import clsx from "clsx";

type CardProps = {
  children?: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return <div className={clsx("admin-card p-5", className)}>{children}</div>;
}

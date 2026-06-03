import { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
      <div className="min-w-0">
        <h1 className="text-[34px] leading-tight font-semibold text-foreground tracking-[-0.03em]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[15px] text-muted-foreground mt-1.5">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

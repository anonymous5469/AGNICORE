import { ReactNode } from 'react';

interface PageHeaderProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly children?: ReactNode;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      <p className="eyebrow-glass mb-2">{eyebrow}</p>
      <h1 className="heading-section-glass mb-2">{title}</h1>
      <p className="text-slate-400 max-w-2xl">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

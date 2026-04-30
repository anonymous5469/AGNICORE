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
    <div className="mb-12">
      <p className="eyebrow-v2 mb-3">{eyebrow}</p>
      <h1 className="heading-hero mb-4">{title}</h1>
      <p className="text-body text-lg max-w-2xl">{description}</p>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}

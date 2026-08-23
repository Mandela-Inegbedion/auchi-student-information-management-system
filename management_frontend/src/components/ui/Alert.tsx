import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import type { ReactNode } from 'react';

type AlertVariant = 'info' | 'success' | 'error';

const styles: Record<AlertVariant, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
};

const icons = { info: Info, success: CheckCircle2, error: AlertCircle };

export function Alert({ variant = 'info', children }: { variant?: AlertVariant; children: ReactNode }) {
  const Icon = icons[variant];
  return (
    <div className={`flex gap-3 rounded-lg border px-4 py-3 text-sm ${styles[variant]}`} role={variant === 'error' ? 'alert' : 'status'}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

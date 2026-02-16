'use client';

import { useFormState, useFormStatus } from 'react-dom';

type ActionState = { error?: string; success?: string };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button type="submit">{pending ? 'Saving...' : label}</button>;
}

export default function ActionFormState({
  action,
  children,
  submitLabel,
  className
}: {
  action: (state: ActionState | void, formData: FormData) => Promise<ActionState | void>;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
}) {
  const [state, formAction] = useFormState(action, undefined);

  return (
    <form action={formAction} className={className ?? 'grid'}>
      {children}
      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p>{state.success}</p>}
      <SubmitButton label={submitLabel} />
    </form>
  );
}

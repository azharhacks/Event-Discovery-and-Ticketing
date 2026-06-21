import { useToast } from '../../hooks/useToast';

export default function ToastStack() {
  const { toasts } = useToast();

  return (
    <>
      {toasts.map((t) => (
        <div key={t.id} className="toast show">
          {t.message}
        </div>
      ))}
    </>
  );
}

import { WarningCircle } from '@phosphor-icons/react/dist/ssr';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

/** Shared error treatment for a failed fetch/action within a screen. */
export default function ErrorState({ title = 'Something went wrong', description, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-white rounded-md border border-destructive/20 p-6 text-center">
      <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive mb-3">
        <WarningCircle size={24} weight="duotone" />
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold text-primary hover:text-primary-600"
        >
          Try again
        </button>
      )}
    </div>
  );
}

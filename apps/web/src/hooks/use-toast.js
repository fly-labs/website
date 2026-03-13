// Compatibility wrapper: delegates to sonner while keeping the existing API.
// All consumer files continue using { toast } = useToast() with no changes.
import { toast as sonnerToast } from 'sonner';

function toast({ title, description, variant }) {
  if (variant === 'destructive') {
    return sonnerToast.error(title, { description });
  }
  return sonnerToast.success(title, { description });
}

function useToast() {
  return { toast };
}

export { useToast, toast };

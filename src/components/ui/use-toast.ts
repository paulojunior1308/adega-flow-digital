
import { toast as sonnerToast } from "sonner";
import type { ToastProps } from "@/components/ui/toast";

// Simple wrapper around Sonner's toast function
export function useToast() {
  return {
    toast: (props: ToastProps) => {
      sonnerToast(props.title || "", {
        description: props.description,
        duration: props.duration,
        action: props.action,
      });
    },
  };
}

// Direct toast function for convenience
export const toast = (props: ToastProps) => {
  sonnerToast(props.title || "", {
    description: props.description,
    duration: props.duration,
    action: props.action,
  });
};

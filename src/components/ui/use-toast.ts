
import { toast as sonnerToast } from "sonner";
import type { ToastProps } from "@/components/ui/toast";

export const useToast = () => {
  return {
    toast: (props: { title?: string; description?: string; variant?: "default" | "destructive" }) => {
      sonnerToast(props.title || "", {
        description: props.description,
      });
    },
  };
};

export const toast = (props: { title?: string; description?: string; variant?: "default" | "destructive" }) => {
  sonnerToast(props.title || "", {
    description: props.description,
  });
};

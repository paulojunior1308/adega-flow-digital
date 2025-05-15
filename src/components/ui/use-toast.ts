
import { toast as sonnerToast } from "sonner";
import type { ToastProps } from "@/components/ui/toast";

export const useToast = () => {
  return {
    toast: (props: ToastProps) => {
      sonnerToast(props.title || "", {
        description: props.description,
        duration: props.duration,
      });
    },
  };
};

export const toast = (props: ToastProps) => {
  sonnerToast(props.title || "", {
    description: props.description,
    duration: props.duration,
  });
};

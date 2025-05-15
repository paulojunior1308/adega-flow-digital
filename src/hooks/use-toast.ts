
import { type ToastProps, useToast as useToastOriginal } from "@/components/ui/toast";

export const useToast = useToastOriginal;

export const toast = (props: ToastProps) => {
  const { toast: originalToast } = useToast();
  return originalToast(props);
};

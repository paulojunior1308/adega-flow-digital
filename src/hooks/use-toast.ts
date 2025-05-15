
import { Toast, useToast as useToastHook } from "@/components/ui/toast";

export const useToast = useToastHook;

export const toast = (props: Toast) => {
  const { toast: originalToast } = useToast();
  return originalToast(props);
};

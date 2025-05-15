
import { type ToastProps } from "@/components/ui/toast";
import { useToast as useToastOriginal } from "@/components/ui/use-toast";

export const useToast = useToastOriginal;

export const toast = (props: ToastProps) => {
  const { toast: originalToast } = useToast();
  return originalToast(props);
};

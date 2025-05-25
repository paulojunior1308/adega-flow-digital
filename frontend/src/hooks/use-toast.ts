
import { useToast as originalUseToast, toast as originalToast } from "@/components/ui/use-toast";
import type { ToastProps } from "@/components/ui/toast";

export const useToast = originalUseToast;
export const toast = originalToast;

export type { ToastProps };

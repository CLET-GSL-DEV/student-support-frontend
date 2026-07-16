import type { ToastVariant } from '@rfdtech/components';

export interface ToastCondition<T> {
  condition: (data: T) => boolean;
  title: string | ((data: T) => string);
  variant?: ToastVariant;
}

export interface QueryToastConfig<TRes> {
  onSuccess?: ToastCondition<TRes>[];
  onError?: ToastCondition<unknown>[];
}

export interface MutationToastConfig<TRes> {
  onSuccess?: ToastCondition<TRes>[];
  onError?: ToastCondition<unknown>[];
}

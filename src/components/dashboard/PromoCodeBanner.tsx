import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { balanceApi } from '../../api/balance';

const STORAGE_KEY = 'promo_banner_dismissed';

export default function PromoCodeBanner() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(STORAGE_KEY));
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => balanceApi.activatePromocode(code.trim().toUpperCase()),
    onSuccess: (data) => {
      setError(null);
      setSuccess(data.bonus_description || data.message || 'Промокод успешно применён!');
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, '1');
        setDismissed(true);
      }, 3000);
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      const detail = err.response?.data?.detail || '';
      if (detail.includes('already') || detail.includes('уже')) {
        setError('Этот промокод уже был использован');
      } else if (detail.includes('not found') || detail.includes('не найден')) {
        setError('Промокод не найден. Проверьте правильность');
      } else if (detail.includes('expired') || detail.includes('истёк')) {
        setError('Срок действия промокода истёк');
      } else {
        setError(detail || 'Не удалось применить промокод');
      }
    },
  });

  if (dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-accent-500 to-blue-500 p-[2px] shadow-lg shadow-accent-500/20">
      <div className="relative rounded-2xl bg-white p-5 dark:bg-dark-900">
        {/* Dismiss button */}
        {!success && (
          <button
            onClick={() => {
              localStorage.setItem(STORAGE_KEY, '1');
              setDismissed(true);
            }}
            className="absolute right-4 top-4 text-dark-500 transition-colors hover:text-dark-300"
            aria-label="Закрыть"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {success ? (
          /* Success state */
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-500/20 text-2xl">
              ✅
            </div>
            <div>
              <p className="text-base font-semibold text-green-400">Промокод применён!</p>
              <p className="mt-0.5 text-sm text-dark-300">{success}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent-500/20 text-2xl">
                🎁
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-dark-50">Есть промокод?</p>
                <p className="text-sm text-gray-500 dark:text-dark-400">
                  Введите — получите бонус на счёт
                </p>
              </div>
            </div>

            {/* Input + button */}
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && code.trim() && mutation.mutate()}
                placeholder="Например: WELCOME2024"
                className="flex-1 rounded-xl border border-dark-700 bg-dark-800 px-4 py-3 text-base font-medium tracking-wider text-dark-50 placeholder-dark-600 outline-none transition-all focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
              />
              <button
                onClick={() => mutation.mutate()}
                disabled={!code.trim() || mutation.isPending}
                className="flex-shrink-0 rounded-xl bg-accent-500 px-5 py-3 text-base font-semibold text-white transition-all hover:bg-accent-400 disabled:opacity-40"
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>...</span>
                  </span>
                ) : (
                  'Применить'
                )}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

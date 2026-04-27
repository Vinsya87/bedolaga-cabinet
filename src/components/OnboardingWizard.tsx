import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { balanceApi } from '../api/balance';

const STORAGE_KEY = 'onboarding_completed';

export function useOnboardingWizard() {
  const isCompleted = localStorage.getItem(STORAGE_KEY) === 'true';
  const complete = () => localStorage.setItem(STORAGE_KEY, 'true');
  return { isCompleted, complete };
}

interface Props {
  onComplete: () => void;
  subscriptionId?: number;
}

export default function OnboardingWizard({ onComplete, subscriptionId }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [code, setCode] = useState('');
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const promoMutation = useMutation({
    mutationFn: () => balanceApi.activatePromocode(code.trim().toUpperCase()),
    onSuccess: (data) => {
      setPromoError(null);
      setPromoSuccess(data.bonus_description || data.message || 'Промокод применён!');
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      const detail = err.response?.data?.detail || '';
      if (detail.includes('already') || detail.includes('уже')) {
        setPromoError('Этот промокод уже использован');
      } else if (detail.includes('not found') || detail.includes('не найден')) {
        setPromoError('Промокод не найден — проверьте написание');
      } else {
        setPromoError(detail || 'Не удалось применить промокод');
      }
    },
  });

  const handleFinish = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    // Скрываем промокод-баннер тоже, раз ввели через wizard
    if (promoSuccess) localStorage.setItem('promo_banner_dismissed', '1');
    onComplete();
    if (step === 1 && subscriptionId) {
      navigate(`/connection?sub=${subscriptionId}`);
    }
  };

  const steps = [
    {
      emoji: '🎁',
      title: 'Есть промокод?',
      subtitle: 'Введите его прямо сейчас — это займёт 5 секунд',
      skipText: 'Нет промокода',
      nextText: promoSuccess ? 'Отлично, дальше →' : undefined,
    },
    {
      emoji: '📱',
      title: 'Осталось подключить VPN',
      subtitle: 'Мы покажем пошагово что скачать и как настроить — всего 2 минуты',
      skipText: 'Разберусь сам',
      nextText: 'Показать как →',
    },
  ];

  const current = steps[step];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-dark-900">
        {/* Progress bar */}
        <div className="flex h-1">
          <div
            className="h-full bg-accent-500 transition-all duration-500"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
          <div className="flex-1 bg-gray-100 dark:bg-dark-700" />
        </div>

        <div className="p-7">
          {/* Step dots */}
          <div className="mb-6 flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? 'w-6 bg-accent-500'
                    : i < step
                      ? 'w-3 bg-accent-500/40'
                      : 'w-3 bg-gray-200 dark:bg-dark-700'
                }`}
              />
            ))}
          </div>

          {/* Emoji */}
          <div className="mb-4 text-5xl">{current.emoji}</div>

          {/* Title */}
          <h2 className="mb-1 text-2xl font-bold text-gray-900 dark:text-dark-50">
            {current.title}
          </h2>
          <p className="mb-6 text-base text-gray-500 dark:text-dark-400">{current.subtitle}</p>

          {/* Step 0: Promo input */}
          {step === 0 && (
            <div className="space-y-3">
              {promoSuccess ? (
                <div className="flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-3 dark:bg-green-500/10">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">Применён!</p>
                    <p className="text-sm text-green-600 dark:text-green-500">{promoSuccess}</p>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setPromoError(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && code.trim() && promoMutation.mutate()}
                    placeholder="Например: WELCOME100"
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3.5 text-base font-medium tracking-wider text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-accent-500 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 dark:placeholder-dark-600"
                    autoFocus
                  />
                  <button
                    onClick={() => promoMutation.mutate()}
                    disabled={!code.trim() || promoMutation.isPending}
                    className="w-full rounded-xl bg-accent-500 py-3.5 text-base font-bold text-white transition-all hover:bg-accent-400 disabled:opacity-40"
                  >
                    {promoMutation.isPending ? 'Проверяю...' : 'Применить промокод'}
                  </button>
                  {promoError && <p className="text-center text-sm text-red-500">{promoError}</p>}
                </>
              )}
            </div>
          )}

          {/* Step 1: Connect guide */}
          {step === 1 && (
            <div className="space-y-3">
              {[
                { n: '1', text: 'Нажмите на вашу подписку' },
                { n: '2', text: 'Нажмите «Как подключить VPN?»' },
                { n: '3', text: 'Следуйте инструкции — всё просто!' },
              ].map((item) => (
                <div
                  key={item.n}
                  className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-dark-800"
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent-500 text-sm font-bold text-white">
                    {item.n}
                  </div>
                  <p className="text-base text-gray-700 dark:text-dark-200">{item.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={handleFinish}
              className="text-sm text-gray-400 transition-colors hover:text-gray-600 dark:text-dark-500 dark:hover:text-dark-300"
            >
              {current.skipText}
            </button>
            <button
              onClick={() => {
                if (step < steps.length - 1) {
                  setStep(step + 1);
                } else {
                  handleFinish();
                }
              }}
              className="rounded-xl bg-accent-500 px-6 py-2.5 text-base font-bold text-white transition-all hover:bg-accent-400"
            >
              {step === steps.length - 1 ? '🚀 Поехали!' : (current.nextText ?? 'Далее →')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

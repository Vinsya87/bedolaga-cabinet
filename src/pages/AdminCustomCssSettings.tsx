// [CODELOFT CUSTOM]
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useToast } from '../components/Toast';
import { tokenStorage } from '../utils/token';

const BackIcon = () => (
  <svg
    className="h-5 w-5 text-dark-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

export default function AdminCustomCssSettings() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [cssCode, setCssCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Загрузка текущих стилей
  useEffect(() => {
    const fetchCurrentCss = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_API_URL + '/seo/custom-css', {
          headers: {
            Authorization: `Bearer ${tokenStorage.getAccessToken()}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setCssCode(data.css_code || '');
        }
      } catch (error) {
        console.error('Failed to load custom css', error);
      }
    };
    fetchCurrentCss();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/seo/custom-css', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenStorage.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ css_code: cssCode }),
      });

      if (!response.ok) {
        throw new Error('Не удалось сохранить стили');
      }

      showToast({
        title: 'Успешно',
        message: 'Пользовательские стили CSS сохранены и применены!',
        type: 'success',
      });

      // Чтобы новые стили загрузились, можно обновить страницу
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      showToast({
        title: 'Ошибка',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      setCssCode(cssCode.substring(0, start) + '  ' + cssCode.substring(end));
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/codeloft')}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-700 bg-dark-800 transition-colors hover:border-dark-600"
        >
          <BackIcon />
        </button>
        <div>
          <h1 className="text-xl font-bold text-dark-100">Собственные стили (CSS)</h1>
          <p className="mt-1 text-sm text-dark-400">
            Глобальная настройка внешнего вида панели (цвета, шрифты)
          </p>
        </div>
      </div>

      <div className="card space-y-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark-300">
                Пользовательский CSS-код
              </label>
              <textarea
                value={cssCode}
                onChange={(e) => setCssCode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder=":root {&#10;  --color-accent-500: #ff0000;&#10;}"
                className="input min-h-[400px] font-mono text-sm leading-relaxed"
                spellCheck={false}
              />
              <p className="mt-2 text-xs text-dark-500">
                Введенный здесь код будет подключен ко всем страницам кабинета.
                <br />
                Используйте это для изменения цветов `:root`, скрытия блоков или переопределения
                стандартных стилей.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-dark-700/50 pt-6">
              <button type="button" onClick={() => navigate('/codeloft')} className="btn-secondary">
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex items-center gap-2"
              >
                {isSubmitting ? (
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
                {isSubmitting ? 'Сохранение...' : 'Сохранить стили'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

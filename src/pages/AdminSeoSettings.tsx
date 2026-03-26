import { useState, useRef, useEffect } from 'react';
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

export default function AdminSeoSettings() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setOgImage(''); // очищаем ссылку, если выбран файл
    }
  };

  // Загрузка текущих настроек
  useEffect(() => {
    const fetchCurrentSeo = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_API_URL + '/seo/current', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setTitle(data.title || '');
          setDescription(data.description || '');
          setOgImage(data.og_image_url || '');
        }
      } catch (error) {
        console.error('Failed to load current SEO settings', error);
      }
    };
    fetchCurrentSeo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = tokenStorage.getAccessToken();
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('og_image_url', ogImage);
      if (imageFile) {
        formData.append('image_file', imageFile);
      }

      const response = await fetch(import.meta.env.VITE_API_URL + '/seo/update', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Неизвестная ошибка сервера');
      }

      showToast({
        title: 'Успешно',
        message: 'Настройки SEO сохранены и внедрены в index.html!',
        type: 'success',
      });

      // Очистка только файла после успеха (URL можно оставить для предпросмотра)
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      showToast({
        title: 'Ошибка',
        message: error instanceof Error ? error.message : 'Не удалось сохранить параметры',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
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
          <h1 className="text-xl font-bold text-dark-100">SEO и Мета-теги</h1>
          <p className="mt-1 text-sm text-dark-400">
            Настройка красивого превью (OpenGraph) для ссылок в Telegram и ВКонтакте
          </p>
        </div>
      </div>

      <div className="card space-y-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark-300">
                Заголовок сайта (Meta Title) <span className="text-error-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="CodeLoft VPN | Личный портал свободы 🚀"
                className="input"
                required
              />
              <p className="mt-1 text-xs text-dark-500">
                Отображается во вкладке браузера и большими буквами в превью мессенджера.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark-300">
                Описание (Meta Description) <span className="text-error-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Премиальный закрытый VPN. Максимальная скорость и обход любых блокировок..."
                rows={3}
                className="input min-h-[80px] resize-none"
                required
              />
              <p className="mt-1 text-xs text-dark-500">
                Краткий текст под заголовком. Привлекает внимание клиентов к вашим преимуществам.
              </p>
            </div>

            {/* Блок выбора файла ОБЛОЖКИ */}
            <div className="space-y-4 border-t border-dark-700/50 pt-6">
              <h3 className="text-sm font-medium text-dark-300">Картинка для превью (OG Image)</h3>

              <div className="rounded-lg border border-dashed border-dark-600 bg-dark-800/50 p-6 text-center">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />

                {imagePreview || ogImage ? (
                  <div className="flex flex-col items-center gap-4">
                    <img
                      src={imagePreview || ogImage}
                      alt="OG Image Preview"
                      className="max-h-48 rounded-lg border border-dark-700 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                      onLoad={(e) => {
                        (e.target as HTMLImageElement).style.display = 'block';
                      }}
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-secondary"
                      >
                        Выбрать другую
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                          setOgImage('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="rounded-lg p-2 text-dark-400 transition-colors hover:bg-error-500/20 hover:text-error-400"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <svg
                      className="mb-3 h-10 w-10 text-dark-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="mb-1 text-sm font-medium text-dark-300">
                      Перетащите картинку сюда или нажмите для выбора
                    </p>
                    <p className="mb-4 text-xs text-dark-500">
                      Рекомендуемый размер: 1200x630px (JPG, PNG)
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary"
                    >
                      Обзор файлов
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-center text-xs font-medium uppercase tracking-wider text-dark-400">
                  Или укажите прямую ссылку:
                </label>
                <input
                  type="text"
                  value={ogImage}
                  onChange={(e) => {
                    setOgImage(e.target.value);
                    if (e.target.value.trim() !== '') {
                      setImageFile(null);
                      setImagePreview('');
                    }
                  }}
                  placeholder="https://test.ru/og-image.jpg"
                  className="input text-center"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-dark-700/50 pt-6">
              <button type="button" onClick={() => navigate('/codeloft')} className="btn-secondary">
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title || !description}
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
                {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

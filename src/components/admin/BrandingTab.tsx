import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brandingApi, setCachedBranding } from '../../api/branding';
import { setCachedFullscreenEnabled } from '../../hooks/useTelegramSDK';
import { UploadIcon, TrashIcon, PencilIcon, CheckIcon, CloseIcon } from './icons';
import { Toggle } from './Toggle';
import { BackgroundEditor } from './BackgroundEditor';

interface BrandingTabProps {
  accentColor?: string;
}

export function BrandingTab({ accentColor = '#3b82f6' }: BrandingTabProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  // Queries
  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: brandingApi.getBranding,
  });

  const { data: fullscreenSettings } = useQuery({
    queryKey: ['fullscreen-enabled'],
    queryFn: brandingApi.getFullscreenEnabled,
  });

  const { data: emailAuthSettings } = useQuery({
    queryKey: ['email-auth-enabled'],
    queryFn: brandingApi.getEmailAuthEnabled,
  });

  const { data: giftSettings } = useQuery({
    queryKey: ['gift-enabled'],
    queryFn: brandingApi.getGiftEnabled,
  });

  const { data: customCss } = useQuery({
    queryKey: ['custom-css'],
    queryFn: brandingApi.getCustomCss,
  });

  const [cssValue, setCssValue] = useState<string>('');
  const [isCssEditing, setIsCssEditing] = useState(false);

  // Sync css value when loaded
  if (customCss?.css !== undefined && !isCssEditing && cssValue !== customCss.css) {
    setCssValue(customCss.css);
  }

  // Mutations
  const updateBrandingMutation = useMutation({
    mutationFn: brandingApi.updateName,
    onSuccess: (data) => {
      setCachedBranding(data);
      queryClient.invalidateQueries({ queryKey: ['branding'] });
      setEditingName(false);
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: brandingApi.uploadLogo,
    onSuccess: (data) => {
      setCachedBranding(data);
      queryClient.invalidateQueries({ queryKey: ['branding'] });
    },
  });

  const deleteLogoMutation = useMutation({
    mutationFn: brandingApi.deleteLogo,
    onSuccess: (data) => {
      setCachedBranding(data);
      queryClient.invalidateQueries({ queryKey: ['branding'] });
    },
  });

  const updateFullscreenMutation = useMutation({
    mutationFn: (enabled: boolean) => brandingApi.updateFullscreenEnabled(enabled),
    onSuccess: (data) => {
      setCachedFullscreenEnabled(data.enabled);
      queryClient.invalidateQueries({ queryKey: ['fullscreen-enabled'] });
    },
  });

  const updateEmailAuthMutation = useMutation({
    mutationFn: (enabled: boolean) => brandingApi.updateEmailAuthEnabled(enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-auth-enabled'] });
    },
  });

  const updateGiftMutation = useMutation({
    mutationFn: (enabled: boolean) => brandingApi.updateGiftEnabled(enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-enabled'] });
    },
  });

  const updateCssMutation = useMutation({
    mutationFn: (css: string) => brandingApi.updateCustomCss(css),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-css'] });
    },
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadLogoMutation.mutate(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo & Name */}
      <div className="rounded-2xl border border-dark-700/50 bg-dark-800/50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-dark-100">
          {t('admin.settings.logoAndName')}
        </h3>

        <div className="flex items-start gap-6">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div
              className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl text-3xl font-bold text-white"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
              }}
            >
              {branding?.has_custom_logo ? (
                <img
                  src={brandingApi.getLogoUrl(branding) ?? undefined}
                  alt="Logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                branding?.logo_letter || 'V'
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLogoMutation.isPending}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-dark-700 px-3 py-2 text-sm text-dark-200 transition-colors hover:bg-dark-600 disabled:opacity-50"
              >
                <UploadIcon />
              </button>
              {branding?.has_custom_logo && (
                <button
                  onClick={() => deleteLogoMutation.mutate()}
                  disabled={deleteLogoMutation.isPending}
                  className="rounded-xl bg-dark-700 px-3 py-2 text-dark-400 transition-colors hover:bg-error-500/20 hover:text-error-400 disabled:opacity-50"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-dark-300">
              {t('admin.settings.projectName')}
            </label>
            {editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 rounded-xl border border-dark-600 bg-dark-700 px-4 py-2 text-dark-100 focus:border-accent-500 focus:outline-none"
                  maxLength={50}
                />
                <button
                  onClick={() => updateBrandingMutation.mutate(newName)}
                  disabled={updateBrandingMutation.isPending}
                  className="rounded-xl bg-accent-500 px-4 py-2 text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
                >
                  <CheckIcon />
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="rounded-xl bg-dark-700 px-4 py-2 text-dark-300 transition-colors hover:bg-dark-600"
                >
                  <CloseIcon />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg text-dark-100">
                  {branding?.name || t('admin.settings.notSpecified')}
                </span>
                <button
                  onClick={() => {
                    setNewName(branding?.name ?? '');
                    setEditingName(true);
                  }}
                  className="rounded-lg p-1.5 text-dark-400 transition-colors hover:bg-dark-700 hover:text-dark-200"
                >
                  <PencilIcon />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animated Background Editor */}
      <div className="rounded-2xl border border-dark-700/50 bg-dark-800/50 p-6">
        <BackgroundEditor />
      </div>

      {/* Fullscreen & Email toggles */}
      <div className="rounded-2xl border border-dark-700/50 bg-dark-800/50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-dark-100">
          {t('admin.settings.interfaceOptions')}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-dark-700/30 p-4">
            <div>
              <span className="font-medium text-dark-100">
                {t('admin.settings.autoFullscreen')}
              </span>
              <p className="text-sm text-dark-400">{t('admin.settings.autoFullscreenDesc')}</p>
            </div>
            <Toggle
              checked={fullscreenSettings?.enabled ?? false}
              onChange={() =>
                updateFullscreenMutation.mutate(!(fullscreenSettings?.enabled ?? false))
              }
              disabled={updateFullscreenMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-dark-700/30 p-4">
            <div>
              <span className="font-medium text-dark-100">{t('admin.settings.emailAuth')}</span>
              <p className="text-sm text-dark-400">{t('admin.settings.emailAuthDesc')}</p>
            </div>
            <Toggle
              checked={emailAuthSettings?.enabled ?? true}
              onChange={() => updateEmailAuthMutation.mutate(!(emailAuthSettings?.enabled ?? true))}
              disabled={updateEmailAuthMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-dark-700/30 p-4">
            <div>
              <span className="font-medium text-dark-100">{t('admin.settings.giftEnabled')}</span>
              <p className="text-sm text-dark-400">{t('admin.settings.giftEnabledDesc')}</p>
            </div>
            <Toggle
              checked={giftSettings?.enabled ?? false}
              onChange={() => updateGiftMutation.mutate(!(giftSettings?.enabled ?? false))}
              disabled={updateGiftMutation.isPending}
            />
          </div>
        </div>
      </div>

      {/* Пользовательский CSS */}
      <div className="rounded-2xl border border-dark-700/50 bg-dark-800/50 p-6">
        <h3 className="mb-4 flex items-center justify-between text-lg font-semibold text-dark-100">
          <span>{t('admin.settings.customCss') || 'Собственные стили (CSS)'}</span>
          <button
            onClick={() => {
              updateCssMutation.mutate(cssValue);
              setIsCssEditing(false);
            }}
            disabled={updateCssMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
          >
            <CheckIcon />
            {t('admin.actions.save') || 'Сохранить'}
          </button>
        </h3>
        <p className="mb-4 text-sm text-dark-400">
          Максимальная кастомизация. Вставьте любой CSS код, он будет применен ко всему интерфейсу
          напрямую. Будьте осторожны, можно сломать верстку! Изменения применяются после сохранения.
        </p>

        <textarea
          value={cssValue}
          onChange={(e) => {
            setCssValue(e.target.value);
            setIsCssEditing(true);
          }}
          placeholder="/* Пример: убрать закругление у кнопок */
.rounded-xl {
  border-radius: 0 !important;
}

/* Изменить фон на всей странице */
body {
  background-color: #000 !important;
}"
          rows={8}
          className="w-full rounded-xl border border-dark-600 bg-dark-900/50 px-4 py-3 font-mono text-sm text-accent-300 placeholder-dark-600 outline-none transition-colors focus:border-accent-500 focus:bg-dark-900"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

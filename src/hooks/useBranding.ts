import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { useTelegramSDK, setCachedFullscreenEnabled } from '@/hooks/useTelegramSDK';
import {
  brandingApi,
  getCachedBranding,
  setCachedBranding,
  preloadLogo,
  isLogoPreloaded,
} from '@/api/branding';

const FALLBACK_NAME = import.meta.env.VITE_APP_NAME || 'Cabinet';
const FALLBACK_LOGO = import.meta.env.VITE_APP_LOGO || 'V';

export function useBranding() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { isTelegramWebApp, requestFullscreen, isMobile } = useTelegramSDK();

  // Branding data
  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: async () => {
      const data = await brandingApi.getBranding();
      setCachedBranding(data);
      await preloadLogo(data);
      return data;
    },
    initialData: getCachedBranding() ?? undefined,
    initialDataUpdatedAt: 0,
    staleTime: 60000,
    enabled: isAuthenticated,
  });

  const appName = branding ? branding.name : FALLBACK_NAME;
  const logoLetter = branding?.logo_letter || FALLBACK_LOGO;
  const hasCustomLogo = branding?.has_custom_logo || false;
  const logoUrl = branding ? brandingApi.getLogoUrl(branding) : null;

  // Set document title
  useEffect(() => {
    document.title = appName || 'VPN';
  }, [appName]);

  // Update favicon
  useEffect(() => {
    if (!logoUrl) return;

    const link =
      document.querySelector<HTMLLinkElement>("link[rel*='icon']") ||
      document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = logoUrl;
    document.head.appendChild(link);
  }, [logoUrl]);

  // Fullscreen setting from server
  const { data: fullscreenSetting } = useQuery({
    queryKey: ['fullscreen-enabled'],
    queryFn: brandingApi.getFullscreenEnabled,
    staleTime: 60000,
  });

  const fullscreenRequestedRef = useRef(false);

  useEffect(() => {
    if (!fullscreenSetting || !isTelegramWebApp) return;
    setCachedFullscreenEnabled(fullscreenSetting.enabled);
    if (fullscreenSetting.enabled && isMobile && !fullscreenRequestedRef.current) {
      fullscreenRequestedRef.current = true;
      requestFullscreen();
    }
  }, [fullscreenSetting, isTelegramWebApp, requestFullscreen, isMobile]);

  // ── SEO: динамическое обновление мета-тегов из API ──
  useEffect(() => {
    const applySeoTags = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${apiUrl}/seo/current`);
        if (!res.ok) return;
        const seo: { title: string; description: string; og_image_url: string } = await res.json();

        // Хелпер: обновить или создать <meta> тег
        const setMeta = (selector: string, content: string) => {
          if (!content) return;
          let el = document.querySelector<HTMLMetaElement>(selector);
          if (el) {
            el.setAttribute('content', content);
          } else {
            el = document.createElement('meta');
            // Парсим атрибут из селектора, например: 'meta[property="og:title"]'
            const propMatch = selector.match(/\[(\w+)="([^"]+)"\]/);
            if (propMatch) el.setAttribute(propMatch[1], propMatch[2]);
            el.setAttribute('content', content);
            document.head.appendChild(el);
          }
        };

        if (seo.title) {
          setMeta('meta[name="title"]', seo.title);
          setMeta('meta[property="og:title"]', seo.title);
          setMeta('meta[property="twitter:title"]', seo.title);
        }
        if (seo.description) {
          setMeta('meta[name="description"]', seo.description);
          setMeta('meta[property="og:description"]', seo.description);
          setMeta('meta[property="twitter:description"]', seo.description);
        }
        if (seo.og_image_url) {
          setMeta('meta[property="og:image"]', seo.og_image_url);
          setMeta('meta[property="twitter:image"]', seo.og_image_url);
        }
      } catch {
        // SEO не загрузились — не критично, используем значения из HTML
      }
    };
    applySeoTags();
  }, []);

  return {
    appName,
    logoLetter,
    hasCustomLogo,
    logoUrl,
    isLogoPreloaded,
  };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  init,
  restoreInitData,
  retrieveRawInitData,
  mountMiniApp,
  miniAppReady,
  mountViewport,
  expandViewport,
  mountSwipeBehavior,
  disableVerticalSwipes,
  mountClosingBehavior,
  disableClosingConfirmation,
  mountBackButton,
  bindThemeParamsCssVars,
  bindViewportCssVars,
  requestFullscreen,
  isFullscreen,
} from '@telegram-apps/sdk-react';
import { clearStaleSessionIfNeeded } from './utils/token';
import { AppWithNavigator } from './AppWithNavigator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initLogoPreload } from './api/branding';
import { getCachedFullscreenEnabled, isTelegramMobile } from './hooks/useTelegramSDK';
import './i18n';
import './styles/globals.css';

// HMR guard — prevent double init when Vite hot-reloads the module
const HMR_KEY = '__tg_sdk_initialized';
const alreadyInitialized = (window as unknown as Record<string, unknown>)[HMR_KEY] === true;

if (!alreadyInitialized) {
  (window as unknown as Record<string, unknown>)[HMR_KEY] = true;

  try {
    init();
    restoreInitData();

    clearStaleSessionIfNeeded(retrieveRawInitData() || null);

    // Each mount in its own try/catch so one failure doesn't block others.
    // mountMiniApp() internally mounts themeParams in SDK v3,
    // so we don't call mountThemeParams() separately to avoid ConcurrentCallError.
    try {
      mountMiniApp();
    } catch {}
    try {
      bindThemeParamsCssVars();
    } catch {}
    try {
      mountSwipeBehavior();
      disableVerticalSwipes();
    } catch {}
    try {
      mountClosingBehavior();
      disableClosingConfirmation();
    } catch {}
    try {
      mountBackButton();
    } catch {}
    // Viewport must be mounted before requesting fullscreen
    mountViewport()
      .then(() => {
        bindViewportCssVars();
        expandViewport();

        // Auto-enter fullscreen if enabled in settings (mobile only)
        if (getCachedFullscreenEnabled() && isTelegramMobile()) {
          if (!isFullscreen()) {
            requestFullscreen();
          }
        }
      })
      .catch(() => {});

    miniAppReady();
  } catch {}
}

if ('requestIdleCallback' in window) {
  requestIdleCallback(() => initLogoPreload());
} else {
  setTimeout(initLogoPreload, 100);
}

// [CODELOFT CUSTOM] Инъекция кастомных стилей из БД
function injectCustomCss() {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080/webapi';
    fetch(`${apiUrl}/seo/custom-css`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        if (data.css_code) {
          let styleEl = document.getElementById('codeloft-custom-css');
          if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'codeloft-custom-css';
            document.head.appendChild(styleEl);
          }
          styleEl.innerHTML = data.css_code;
        }
      })
      .catch((err) => console.error('Failed to load custom CSS:', err));
  } catch (e) {
    console.warn('Silent fail Custom CSS fetching', e);
  }
}
injectCustomCss();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary level="app">
      <QueryClientProvider client={queryClient}>
        <AppWithNavigator />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

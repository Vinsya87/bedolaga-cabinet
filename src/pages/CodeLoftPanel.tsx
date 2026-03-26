// [CODELOFT CUSTOM] Private Settings Panel
import { Link } from 'react-router';
import { usePermissionStore } from '@/store/permissions';

const CodeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
    />
  </svg>
);

const SearchIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.773 4.773zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const SparklesIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
    />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

function AdminCard({ to, icon, title, description, iconBg, iconColor }: any) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-dark-700/50 bg-dark-800/40 p-3 transition-all duration-200 hover:border-dark-600 hover:bg-dark-800/80"
    >
      <div
        className={`h-10 w-10 rounded-lg ${iconBg} ${iconColor} flex shrink-0 items-center justify-center transition-transform group-hover:scale-105`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium text-dark-100 transition-colors group-hover:text-white">
          {title}
        </h3>
        <p className="truncate text-xs text-dark-500">{description}</p>
      </div>
      <div className="text-dark-600 transition-colors group-hover:text-dark-400">
        <ChevronRightIcon />
      </div>
    </Link>
  );
}

export default function CodeLoftPanel() {
  const hasPermission = usePermissionStore((state) => state.hasPermission);

  // Проверяем хотя бы базовое разрешение
  if (!hasPermission('settings:read')) return null;

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.15)]">
            <CodeIcon />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-2xl font-bold text-transparent drop-shadow-sm">
              CodeLoft Secret Area
            </h1>
            <p className="mt-1 text-sm text-dark-400">
              Изолированный раздел управления кастомными доработками проекта
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-dark-700/50 bg-dark-900/30 backdrop-blur">
          <div className="border-b border-fuchsia-500/20 bg-gradient-to-r from-fuchsia-500/10 to-pink-500/5 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-fuchsia-500/20 p-1.5 text-fuchsia-400">
                <SparklesIcon />
              </div>
              <h2 className="text-sm font-semibold text-dark-100">Внешний вид и Персонализация</h2>
            </div>
          </div>
          <div className="space-y-1.5 p-2">
            <AdminCard
              to="/codeloft/seo"
              icon={<SearchIcon />}
              title="SEO и Мета-теги"
              description="Настройка превью (OpenGraph) для Telegram и Vkontakte"
              iconBg="bg-fuchsia-500/20"
              iconColor="text-fuchsia-400"
            />
            <AdminCard
              to="/codeloft/custom-css"
              icon={<SparklesIcon />}
              title="Собственные стили (CSS)"
              description="Глобальная настройка цветов, шрифтов и кастомного CSS кода"
              iconBg="bg-fuchsia-500/20"
              iconColor="text-fuchsia-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

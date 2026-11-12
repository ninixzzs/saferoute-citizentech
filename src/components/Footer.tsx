import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white/85 dark:bg-neutral-950/85 backdrop-blur-xl py-8 text-xs text-neutral-500 dark:text-neutral-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-bold text-neutral-950 dark:text-white tracking-tight">
              SafeRoute &middot; CitizenTech São Paulo
            </span>
            <span className="font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              &ldquo;Vá com segurança. Vá de SafeRoute.&rdquo;
            </span>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Protótipo que leva a lógica dos alertas de emergência para a navegação urbana. Os dados
            de risco e as mensagens são simulados para demonstração.
          </p>
          <p className="text-neutral-600 dark:text-neutral-400">
            Front-end Design &amp; Web Development:{' '}
            <span className="font-semibold text-neutral-950 dark:text-white">
              Nicolly Vilela (Tech Lead)
            </span>
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://github.com/ninixzzs/saferoute-citizentech"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-950 dark:hover:text-white text-neutral-900 dark:text-neutral-200 transition-colors underline font-mono text-[11px] font-semibold"
            >
              ninixzzs/saferoute-citizentech
            </a>
            <span className="text-neutral-300 dark:text-neutral-700">&middot;</span>
            <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
              React &middot; Vite &middot; Tailwind CSS &middot; Leaflet
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-500">
            Mapa &copy; OpenStreetMap &middot; &copy; CARTO &middot; Rotas OSRM
          </p>
        </div>
      </div>
    </footer>
  );
};

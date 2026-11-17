import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white/85 dark:bg-neutral-950/85 backdrop-blur-xl py-8 text-xs text-neutral-500 dark:text-neutral-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
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
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-neutral-700 dark:text-neutral-300">
              Projeto idealizado e desenvolvido por:
            </span>
            <span className="font-bold text-neutral-950 dark:text-white">
              Nicolly Vilela
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-sm">
              ★ Fundadora da SafeRoute
            </span>
            <a
              href="https://www.linkedin.com/in/nicollyvilela"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn de Nicolly Vilela - Fundadora da SafeRoute"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold bg-[#0A66C2] hover:bg-[#004182] text-white transition-all shadow-sm hover:shadow hover:scale-105 active:scale-95 ml-1"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
              <span>Nicolly Vilela no LinkedIn</span>
            </a>
          </div>
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

import React from 'react';
import { ShieldCheck, Code2, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-slate-950 py-10 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-200 text-sm">
              SafeRoute &bull; CitizenTech São Paulo
            </span>
          </div>
          <p className="text-slate-500 max-w-md leading-relaxed">
            Adaptação inovadora da lógica de alertas da Defesa Civil para sistemas de navegação GPS urbana (Waze / Google Maps).
          </p>
          <p className="text-slate-400 font-medium">
            Front-end Design & Web Development: <strong className="text-amber-300">Nicolly (Tech Lead)</strong>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 text-center md:text-right">
          <a
            href="https://github.com/ninixzzs/saferoute-citizentech"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="font-mono">ninixzzs/saferoute-citizentech</span>
          </a>
          <span className="text-[11px] text-slate-500">
            React 19 &bull; Vite &bull; Tailwind CSS v4 &bull; OpenStreetMap
          </span>
        </div>
      </div>
    </footer>
  );
};


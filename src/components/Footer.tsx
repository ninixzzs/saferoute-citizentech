import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-neutral-900 bg-black py-8 text-xs text-neutral-500">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-semibold text-neutral-300">SafeRoute &bull; CitizenTech São Paulo</span>
          <p className="text-neutral-500 mt-0.5">
            Liderança Técnica: <span className="text-neutral-300">Nicolly (Tech Lead)</span>
          </p>
        </div>

        <div className="flex items-center gap-4 text-neutral-400">
          <a
            href="https://github.com/ninixzzs/saferoute-citizentech"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors underline font-mono text-[11px]"
          >
            github.com/ninixzzs/saferoute-citizentech
          </a>
          <span className="text-neutral-600">&bull;</span>
          <span className="text-[11px]">OpenStreetMap &bull; Defesa Civil SP</span>
        </div>
      </div>
    </footer>
  );
};

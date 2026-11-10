import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertCircle, Copy, Check, Server, HardDrive, Key, Globe, Loader2, X } from 'lucide-react';
import { getStoredSupabaseConfig, updateSupabaseCredentials, testSupabaseConnection } from '../services/supabase';

interface DatabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export const DatabaseConfigModal: React.FC<DatabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'supabase' | 'sql'>('status');

  const config = getStoredSupabaseConfig();

  useEffect(() => {
    if (isOpen) {
      setSupabaseUrl(config.url);
      setSupabaseKey(config.key);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateSupabaseCredentials(supabaseUrl, supabaseKey);
    if (onConfigSaved) onConfigSaved();
    onClose();
  };

  const handleTestConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setTestResult({
        success: false,
        message: 'Por favor, informe a URL e a Anon Key do projeto Supabase.',
      });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(supabaseUrl, supabaseKey);
    setIsTesting(false);
    setTestResult(res);
  };

  const handleClearCredentials = () => {
    updateSupabaseCredentials('', '');
    setSupabaseUrl('');
    setSupabaseKey('');
    setTestResult(null);
    if (onConfigSaved) onConfigSaved();
  };

  const sqlSchema = `-- Criação da tabela de incidentes no PostgreSQL / Supabase
CREATE TABLE IF NOT EXISTS public.incidents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  neighborhood TEXT,
  address TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  risk_level TEXT NOT NULL,
  status TEXT DEFAULT 'ativo',
  confirmations_count INTEGER DEFAULT 1,
  reported_by TEXT DEFAULT 'Cidadão',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar leitura pública para todos os usuários
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura pública" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública" ON public.incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública" ON public.incidents FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública" ON public.incidents FOR DELETE USING (true);`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center text-neutral-300">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Gerenciador de Banco de Dados</h3>
              <p className="text-xs text-neutral-400">IndexedDB (Local) &bull; Supabase PostgreSQL (Nuvem)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-800 px-6 bg-neutral-900/50">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'status'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Status Atual
          </button>
          <button
            onClick={() => setActiveTab('supabase')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'supabase'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Conectar Supabase (Nuvem)
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'sql'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Script SQL Supabase
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* IndexedDB Card */}
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">IndexedDB (Banco Nativo no Navegador)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    ATIVO &bull; 100% PERSISTENTE
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Todos os alertas, incidentes comunitários e rotas são salvos no banco de dados estruturado do seu navegador. Não se perdem ao recarregar ou fechar a página.
                </p>
              </div>

              {/* Supabase Card */}
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-neutral-300" />
                    <span className="text-xs font-bold text-white">Supabase (PostgreSQL Nuvem)</span>
                  </div>
                  {config.isConfigured ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      CONECTADO
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
                      NÃO CONFIGURADO
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Permite compartilhar incidentes e alertas em tempo real entre todos os usuários que acessam a aplicação através de uma instância na nuvem do Supabase.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('supabase')}
                    className="text-xs text-white underline hover:text-neutral-300 font-medium"
                  >
                    {config.isConfigured ? 'Alterar credenciais do Supabase &rarr;' : 'Configurar credenciais do Supabase &rarr;'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-400">
                Cole a URL do seu projeto e a chave anônima (anon key) do seu painel do Supabase (<code className="text-neutral-300">Settings &rarr; API</code>).
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Project URL</span>
                  </label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Anon Public Key</span>
                  </label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 font-mono"
                  />
                </div>
              </div>

              {/* Test feedback */}
              {testResult && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                    testResult.success
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-red-950/60 border-red-800 text-red-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !supabaseUrl || !supabaseKey}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold border border-neutral-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Testar Conexão</span>
                </button>

                {config.isConfigured && (
                  <button
                    type="button"
                    onClick={handleClearCredentials}
                    className="px-3 py-1.5 text-neutral-400 hover:text-neutral-200 text-xs transition-colors"
                  >
                    Desconectar Nuvem
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-medium">
                  Execute este script no <strong>SQL Editor</strong> do seu Supabase para criar a tabela de incidentes:
                </span>
                <button
                  type="button"
                  onClick={copySqlToClipboard}
                  className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 flex items-center gap-1.5 transition-colors"
                >
                  {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
                </button>
              </div>

              <pre className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-[11px] text-neutral-300 font-mono overflow-x-auto leading-relaxed">
                {sqlSchema}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-neutral-800 bg-neutral-900/40 flex items-center justify-between">
          <div className="text-[11px] text-neutral-500">
            {config.isConfigured ? 'Conexão Supabase Ativa' : 'Utilizando IndexedDB Nativo'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-white text-neutral-950 font-bold text-xs rounded-lg hover:bg-neutral-200 transition-colors shadow-sm"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

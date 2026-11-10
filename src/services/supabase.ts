import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'saferoute_supabase_url';
const STORAGE_ANON_KEY = 'saferoute_supabase_anon_key';

export function getStoredSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_URL_KEY) || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_ANON_KEY) || '' : '';

  const url = storedUrl || envUrl;
  const key = storedKey || envKey;

  return {
    url,
    key,
    isConfigured: Boolean(url && key && !url.includes('demo-saferoute')),
  };
}

let activeClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  const { url, key } = getStoredSupabaseConfig();
  const validUrl = url || 'https://demo-saferoute.supabase.co';
  const validKey = key || 'demo-anon-key';

  if (!activeClient) {
    activeClient = createClient(validUrl, validKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return activeClient;
}

export const isSupabaseConfigured = getStoredSupabaseConfig().isConfigured;
export const supabase = getSupabaseClient();

export function updateSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem(STORAGE_URL_KEY, url.trim());
      localStorage.setItem(STORAGE_ANON_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_URL_KEY);
      localStorage.removeItem(STORAGE_ANON_KEY);
    }
    activeClient = createClient(
      url.trim() || 'https://demo-saferoute.supabase.co',
      key.trim() || 'demo-anon-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await client.from('incidents').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist yet, but credentials work!
        return {
          success: true,
          message: 'Conectado com sucesso! (Observação: a tabela "incidents" ainda precisa ser criada com o script SQL).',
        };
      }
      return { success: false, message: `Erro do Supabase: ${error.message}` };
    }
    return { success: true, message: 'Conexão com PostgreSQL Supabase estabelecida com sucesso!' };
  } catch (err: any) {
    return { success: false, message: `Falha ao conectar: ${err.message || 'Verifique a URL e a Anon Key'}` };
  }
}

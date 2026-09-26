'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  
  // Novo estado para controlar a visibilidade da senha
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        // Cadastro
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim().toLowerCase(),
              full_name: username.trim(),
            },
          },
        });

        if (error) throw error;

        setMessage({
          type: 'success',
          text: 'Cadastro realizado com sucesso! Você já pode entrar.',
        });
        setIsSignUp(false);
      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro na autenticação.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-bold text-emerald-500 hover:text-emerald-400 transition">
            Repot
          </Link>
          <h2 className="text-xl font-bold mt-2">
            {isSignUp ? 'Criar sua conta' : 'Entrar no Repot'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {isSignUp
              ? 'Cadastre-se para criar discussões, responder e votar.'
              : 'Entre para interagir com a comunidade.'}
          </p>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-xs mb-4 border ${
              message.type === 'error'
                ? 'bg-rose-950/50 border-rose-800 text-rose-300'
                : 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Nome de Usuário</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: adriano_ms"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-sm text-neutral-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-sm text-neutral-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Senha</label>
            <div className="relative">
              <input
                // Alterna dinamicamente entre password e text
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                // Adicionado pr-10 para o texto não ficar em cima do ícone
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 pr-10 text-sm text-neutral-100 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                    <line x1="2" y1="2" x2="22" y2="22"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold text-sm transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Aguarde...' : isSignUp ? 'Cadastrar Conta' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-neutral-400">
          {isSignUp ? (
            <p>
              Já possui uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setMessage(null);
                }}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Entrar
              </button>
            </p>
          ) : (
            <p>
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setMessage(null);
                }}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Cadastre-se gratuitamente
              </button>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
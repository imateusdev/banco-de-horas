'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ModernBackground from '@/components/ModernBackground';
import { Clock } from 'lucide-react';
import gsap from 'gsap';

export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (user) {
      checkAuthorizationAndRedirect();
    }
  }, [user]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.hero-content',
        { filter: 'blur(30px)', opacity: 0, scale: 1.02 },
        { filter: 'blur(0px)', opacity: 1, scale: 1, duration: 1.5, ease: 'expo.out' }
      );

      gsap.from('.info-card', {
        y: 40,
        opacity: 0,
        stagger: 0.15,
        duration: 1,
        ease: 'power4.out',
        delay: 0.5,
      });

      const handleMouseMove = (e: MouseEvent) => {
        if (!ctaRef.current) return;
        const rect = ctaRef.current.getBoundingClientRect();
        const dist = Math.hypot(
          e.clientX - (rect.left + rect.width / 2),
          e.clientY - (rect.top + rect.height / 2)
        );
        if (dist < 150) {
          gsap.to(ctaRef.current, {
            x: (e.clientX - (rect.left + rect.width / 2)) * 0.3,
            y: (e.clientY - (rect.top + rect.height / 2)) * 0.3,
            duration: 0.6,
          });
        } else {
          gsap.to(ctaRef.current, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.3)' });
        }
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const checkAuthorizationAndRedirect = async () => {
    try {
      const token = await user!.getIdToken(true);
      const response = await fetch('/api/auth/check', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.authorized) {
        if (data.role === 'admin') {
          router.push('/admin/users');
        } else {
          router.push('/dashboard');
        }
      } else {
        setAuthError('Aguardando autorização de um administrador. Por favor, entre em contato.');
      }
    } catch (error) {
      console.error('Error checking authorization:', error);
      setAuthError('Erro ao verificar autorização. Tente novamente.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Error signing in:', error);
      setAuthError(error.message || 'Erro ao fazer login com Google');
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <ModernBackground />
        <div className="relative z-10 text-white text-lg font-mono tracking-wider">
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full bg-[#020202] flex items-center justify-center px-4 selection:bg-white selection:text-black overflow-hidden"
    >
      <ModernBackground />

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20 py-12">
        <div className="hero-content flex-1">
          <div className="flex items-center gap-3 mb-8">
            <div className="relative w-2.5 h-2.5 bg-white rounded-full">
              <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-30" />
            </div>
            <span className="font-mono text-[11px] font-bold text-white tracking-[0.2em] uppercase">
              TIMEBANK.SYSTEM
            </span>
          </div>

          <h1 className="text-[clamp(3rem,8vw,8rem)] font-black leading-[0.9] tracking-tighter text-white uppercase mb-6">
            BANCO DE <br />
            <span className="text-outline">HORAS</span>
          </h1>

          <p className="font-mono text-[11px] text-white/40 uppercase tracking-[0.35em] max-w-md leading-relaxed mb-12">
            Sistema avançado de controle e gerenciamento de horas trabalhadas
          </p>

          <button
            ref={ctaRef}
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="flex items-center gap-6 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-14 h-14 rounded-full border border-white/15 flex items-center justify-center group-hover:bg-white transition-all duration-500 overflow-hidden group-disabled:group-hover:bg-transparent">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="group-hover:stroke-black stroke-white transition-colors duration-500 group-disabled:stroke-white"
              >
                <path
                  d="M7 17L17 7M17 7H8M17 7V16"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="font-mono text-[11px] font-bold text-white uppercase tracking-[0.2em]">
              {isAuthenticating ? 'Autenticando...' : 'Entrar com Google'}
            </span>
          </button>

          {authError && (
            <div className="mt-8 glass-panel p-4 border-red-500/50">
              <p className="text-red-400 text-sm font-mono">{authError}</p>
            </div>
          )}
        </div>

        <div className="w-full lg:w-96 flex flex-col gap-4">
          <div className="info-card glass-panel p-6">
            <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-3">
              001 // FEATURES
            </span>
            <h3 className="text-2xl font-bold text-white tracking-tight mb-2">
              Controle Total
            </h3>
            <p className="text-sm text-white/60">
              Registre, converta e gerencie suas horas trabalhadas com precisão
            </p>
          </div>

          <div className="info-card glass-panel p-6">
            <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-3">
              002 // STATUS
            </span>
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-bold text-white">Sistema Ativo</h4>
              <Clock className="w-6 h-6 text-white/40" />
            </div>
          </div>

          <div className="info-card glass-panel p-6">
            <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-3">
              003 // ACESSO
            </span>
            <p className="text-xs font-mono text-white/50 leading-relaxed">
              Primeiro usuário a fazer login será o administrador do sistema
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

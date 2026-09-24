import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2, MapPin, Radio, ShieldCheck } from 'lucide-react';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
    </svg>
);

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  error?: string;
  isLoading?: boolean;
  submitLabel?: string;
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-colors focus-within:border-pink-500/70 focus-within:bg-pink-400/10">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={`animate-testimonial ${delay} flex w-[300px] shrink-0 items-start gap-3 rounded-2xl border border-pink-100 bg-white/95 p-4 shadow-lg shadow-pink-200/35 backdrop-blur-xl`}>
    <img src={testimonial.avatarSrc} className="h-11 w-11 shrink-0 rounded-2xl object-cover" alt={`${testimonial.name} avatar`} />
    <div className="min-w-0 text-sm leading-snug">
      <p className="flex items-center gap-1 font-semibold text-slate-900">{testimonial.name}</p>
      <p className="text-pink-600 text-xs font-medium">{testimonial.handle}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-white tracking-tighter">Welcome</span>,
  description = "Access your account and continue your journey with us",
  heroImageSrc,
  testimonials = [],
  error,
  isLoading = false,
  submitLabel = "Sign In",
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const scrollingTestimonials = [...testimonials, ...testimonials];

  return (
    <div className="login-flow-bg relative z-10 grid min-h-screen w-full max-w-full grid-cols-1 overflow-hidden bg-transparent font-sans text-white md:grid-cols-[minmax(420px,0.9fr)_minmax(540px,1.1fr)]">
      {/* Left column: sign-in form */}
      <section className="flex min-w-0 items-center justify-center px-5 py-6 sm:px-8 md:py-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-5">
            <h1 className="animate-element animate-delay-100 text-4xl font-semibold leading-tight lg:text-5xl">{title}</h1>
            <p className="animate-element animate-delay-200 text-slate-400">{description}</p>

            {error && (
              <div className="animate-element animate-delay-300 flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-medium text-rose-300">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-slate-400">Email Address</label>
                <GlassInputWrapper>
                  <input name="email" type="email" placeholder="guardian@shrimatisetu.org" required className="w-full bg-transparent text-sm p-3.5 rounded-2xl focus:outline-none text-white placeholder-slate-500" />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500">
                <label className="text-sm font-medium text-slate-400">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" required className="w-full bg-transparent text-sm p-3.5 pr-12 rounded-2xl focus:outline-none text-white placeholder-slate-500" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-slate-400 hover:text-white transition-colors" /> : <Eye className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-600 flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="rememberMe" className="custom-checkbox rounded border-white/20 bg-white/5 text-rose-500 focus:ring-rose-400" />
                  <span className="text-slate-300">Keep me signed in</span>
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); onResetPassword?.(); }} className="hover:underline text-pink-500 transition-colors">Reset password</a>
              </div>

              <button type="submit" disabled={isLoading} className="animate-element animate-delay-700 w-full rounded-2xl bg-gradient-to-r from-[#FF5F8A] to-rose-500 py-3.5 font-medium text-white hover:opacity-90 transition-all shadow-lg shadow-[#FF5F8A]/25 border border-white/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2">
                {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                {isLoading ? "Signing in..." : submitLabel}
              </button>
            </form>

            <button type="button" onClick={onGoogleSignIn} disabled={isLoading} className="animate-element animate-delay-900 w-full flex items-center justify-center gap-3 border border-white/10 rounded-2xl py-3.5 hover:bg-white/5 transition-colors text-white font-medium disabled:cursor-not-allowed disabled:opacity-60">
                <GoogleIcon />
                Continue with Google
            </button>

            <p className="animate-element animate-delay-1000 text-center text-sm text-slate-400">
              New to our platform? <a href="#" onClick={(e) => { e.preventDefault(); onCreateAccount?.(); }} className="text-pink-500 hover:underline transition-colors">Create Account</a>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {(heroImageSrc || testimonials.length > 0) && (
        <section className="hidden min-w-0 p-4 md:flex">
          <div
            className="flowing-gradient-panel relative flex h-full min-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-[0_24px_70px_rgba(171,72,110,0.16)]"
            style={{ '--hero-image': heroImageSrc ? `url(${heroImageSrc})` : 'none' } as React.CSSProperties}
          >
            <div className="absolute inset-0 bg-white/48" />

            <div className="relative z-10 flex h-full w-full flex-col justify-between gap-8 p-6 lg:p-8">
              <div className="max-w-xl rounded-3xl border border-pink-100 bg-white/90 p-5 shadow-xl shadow-pink-200/35 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-pink-100 bg-pink-50 text-pink-600 shadow-sm">
                      <ShieldCheck className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-600">Live guardian layer</p>
                      <h2 className="mt-1 text-2xl font-bold leading-tight text-slate-900 lg:text-3xl">
                        Real-time SOS visibility across India
                      </h2>
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-pink-100 bg-white/90 p-3 shadow-sm">
                    <Radio className="mb-3 h-4 w-4 text-pink-600" />
                    <p className="text-lg font-bold text-slate-900">24/7</p>
                    <p className="text-[11px] font-medium text-slate-600">SOS desk</p>
                  </div>
                  <div className="rounded-2xl border border-pink-100 bg-white/90 p-3 shadow-sm">
                    <MapPin className="mb-3 h-4 w-4 text-pink-600" />
                    <p className="text-lg font-bold text-slate-900">Live</p>
                    <p className="text-[11px] font-medium text-slate-600">GPS sync</p>
                  </div>
                  <div className="rounded-2xl border border-pink-100 bg-white/90 p-3 shadow-sm">
                    <ShieldCheck className="mb-3 h-4 w-4 text-pink-600" />
                    <p className="text-lg font-bold text-slate-900">Safe</p>
                    <p className="text-[11px] font-medium text-slate-600">Media vault</p>
                  </div>
                </div>
              </div>

              {testimonials.length > 0 && (
                <div className="space-y-4">
                  <div className="max-w-lg rounded-2xl border border-pink-100 bg-white/85 p-4 shadow-sm backdrop-blur-md">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-600">Guardian feedback</p>
                    <h3 className="mt-2 text-2xl font-bold leading-tight text-slate-900 lg:text-3xl">
                      Trusted by women-led safety teams
                    </h3>
                  </div>
                  <div className="review-marquee relative -mx-6 overflow-hidden py-2 lg:-mx-8">
                    <div className="review-marquee-track flex w-max gap-4 px-6 lg:px-8">
                      {scrollingTestimonials.map((testimonial, index) => (
                        <TestimonialCard
                          key={`${testimonial.handle}-${index}`}
                          testimonial={testimonial}
                          delay="animate-delay-1000"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

import Link from 'next/link';
import { ArrowRight, Sparkle, ShieldCheck } from '@phosphor-icons/react/dist/ssr';

export default function WelcomeScreen() {
  return (
    <main id="main-content" className="flex flex-col h-[100dvh] max-h-[100dvh] items-center justify-between p-6 bg-[#FFFFFF] overflow-hidden select-none font-sans">
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto px-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#F26522] px-3.5 py-1 rounded-full bg-[#FEF1E9] border border-[#FDE4D3] mb-6 inline-flex items-center gap-1.5 shadow-xs">
          <Sparkle size={13} weight="fill" /> Global Incorporation &amp; Banking
        </span>

        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight font-heading leading-[1.05]">
          <span className="text-[#14204A]">GCC</span>
          <span className="text-[#F26522]">Startup</span>
        </h1>

        <p className="mt-5 text-base sm:text-xl text-[#334155] font-normal max-w-md leading-relaxed">
          Premium corporate formations, 0% tax structuring, guaranteed tier-1 banking &amp; nominee privacy across 6 jurisdictions.
        </p>

        <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#64748B]">
          <ShieldCheck size={16} className="text-[#16A34A]" weight="fill" />
          <span>UAE &bull; Hong Kong &bull; Singapore &bull; Bahrain &bull; Ireland &bull; BVI</span>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto pb-8 space-y-3">
        <Link
          href="/welcome"
          className="w-full flex items-center justify-center gap-2 bg-[#F26522] hover:bg-[#14204A] text-white font-bold py-4 px-6 rounded-full shadow-[0_4px_16px_rgba(242,101,34,0.3)] transition-all duration-300 text-base cursor-pointer"
        >
          Explore Corporate Platform
          <ArrowRight size={18} weight="bold" />
        </Link>

        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-[#64748B] pt-2">
          <Link href="/auth" className="text-[#14204A] hover:underline font-bold">
            Sign In to Portal
          </Link>
          <span>&bull;</span>
          <Link href="/auth?mode=register" className="text-[#F26522] hover:underline font-bold">
            Instant Register
          </Link>
        </div>
      </div>
    </main>
  );
}

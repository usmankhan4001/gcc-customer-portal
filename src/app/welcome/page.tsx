'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Buildings, Percent, Bank, ArrowRight, type Icon } from '@phosphor-icons/react';

const slides: { id: number; icon: Icon; headline: string; subtext: string; stat: string; statLabel: string }[] = [
  {
    id: 1,
    icon: Buildings,
    headline: 'Company Registration',
    subtext: 'Complete remote formation in UAE, Bahrain, Hong Kong & Singapore with 100% foreign ownership.',
    stat: '18+',
    statLabel: 'Freezones & Registries',
  },
  {
    id: 2,
    icon: Percent,
    headline: 'Legally Pay 0% Corporate Tax',
    subtext: 'Maximize treasury efficiency and protect your assets with Nominee UBO structures for total privacy.',
    stat: '0%',
    statLabel: 'Corporate Tax',
  },
  {
    id: 3,
    icon: Bank,
    headline: 'Guaranteed Bank Account Setup',
    subtext: 'Tier-1 regional corporate banks and multi-currency global fintech accounts with dedicated concierge intro.',
    stat: '48hr',
    statLabel: 'Average Turnaround',
  },
];

export default function WelcomeCarouselPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollPosition = scrollRef.current.scrollLeft;
      const slideWidth = scrollRef.current.clientWidth;
      const newSlide = Math.round(scrollPosition / slideWidth);
      if (newSlide !== currentSlide) {
        setCurrentSlide(newSlide);
      }
    }
  };

  const scrollToSlide = (index: number) => {
    if (scrollRef.current) {
      const slideWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({
        left: slideWidth * index,
        behavior: 'smooth'
      });
      setCurrentSlide(index);
    }
  };

  return (
    <main id="main-content" className="flex flex-col h-[100dvh] max-h-[100dvh] bg-[#FFFFFF] overflow-hidden max-w-md mx-auto select-none font-sans">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {slides.map((slide) => {
          const Icon = slide.icon;
          return (
            <div key={slide.id} className="min-w-full h-full flex flex-col items-center justify-center p-6 snap-center">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-[#14204A] text-[#F26522] flex items-center justify-center mb-6 shadow-[0_10px_25px_-5px_rgba(20,32,74,0.15)] transition-transform">
                <Icon size={52} weight="duotone" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] font-heading mb-2.5 text-center tracking-tight">
                {slide.headline}
              </h2>
              <p className="text-sm text-[#334155] text-center max-w-xs mb-6 leading-relaxed">
                {slide.subtext}
              </p>
              <div className="inline-flex items-baseline gap-2 px-4 py-2 rounded-full bg-[#FEF1E9] border border-[#FDE4D3]">
                <span className="text-base font-bold text-[#F26522] font-mono">{slide.stat}</span>
                <span className="text-[11px] font-bold text-[#C9511A] uppercase tracking-wider">{slide.statLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-6 flex flex-col items-center bg-[#FFFFFF] border-t border-[#E2E8F0]">
        <div className="flex space-x-2 mb-5">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlide === index ? 'w-8 bg-[#F26522]' : 'w-2 bg-[#E2E8F0]'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <div className="w-full max-w-sm flex flex-col items-center gap-3">
          {currentSlide === slides.length - 1 ? (
            <>
              <Link
                href="/onboarding"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full font-bold text-sm text-white bg-[#F26522] hover:bg-[#14204A] shadow-[0_4px_14px_rgba(242,101,34,0.25)] transition-all duration-300 cursor-pointer"
              >
                Start Incorporation Intake <ArrowRight size={16} weight="bold" />
              </Link>
              <Link
                href="/auth"
                className="text-xs text-[#64748B] hover:text-[#0F172A] transition-colors font-semibold"
              >
                Already have an account? <span className="text-[#F26522] underline font-bold">Sign In</span>
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={() => scrollToSlide(currentSlide + 1)}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full font-bold text-sm text-white bg-[#F26522] hover:bg-[#14204A] shadow-[0_4px_14px_rgba(242,101,34,0.25)] transition-all duration-300 cursor-pointer"
            >
              Next Step <ArrowRight size={16} weight="bold" />
            </button>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </main>
  );
}

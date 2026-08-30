'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Buildings, Percent, Bank, type Icon } from '@phosphor-icons/react';

const slides: { id: number; icon: Icon; headline: string; subtext: string; stat: string; statLabel: string }[] = [
  {
    id: 1,
    icon: Buildings,
    headline: 'Company Registration',
    subtext: 'Full formation in UAE, Bahrain, Hong Kong & more. 100% foreign ownership.',
    stat: '18+',
    statLabel: 'Jurisdictions',
  },
  {
    id: 2,
    icon: Percent,
    headline: 'Legally pay 0% tax',
    subtext: 'Maximize savings and protect your assets with our Nominee UBO service for full privacy.',
    stat: '0%',
    statLabel: 'Corporate tax',
  },
  {
    id: 3,
    icon: Bank,
    headline: 'Bank Account Setup',
    subtext: 'Local credible banking or fintech accounts. Guided from application to approval.',
    stat: '48hr',
    statLabel: 'Application turnaround',
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
    <main id="main-content" className="flex flex-col h-[100dvh] max-h-[100dvh] bg-white overflow-hidden max-w-md mx-auto select-none">
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
              <div
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center mb-6 text-white shadow-md transition-transform"
                style={{ background: `linear-gradient(135deg, var(--banner-gradient-start), var(--banner-gradient-end))` }}
              >
                <Icon size={52} weight="duotone" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">{slide.headline}</h2>
              <p className="text-sm text-gray-600 text-center max-w-xs mb-5 leading-relaxed">{slide.subtext}</p>
              <div className="inline-flex items-baseline gap-1.5 px-3.5 py-1.5 rounded-full bg-primary-50 border border-primary-100">
                <span className="text-base font-extrabold text-primary">{slide.stat}</span>
                <span className="text-xs font-semibold text-primary-700 uppercase tracking-wide">{slide.statLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-5 flex flex-col items-center bg-gray-50/80 border-t border-gray-200/80">
        <div className="flex space-x-2 mb-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === index ? 'w-6 bg-primary' : 'w-2 bg-gray-300'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <div className="w-full max-w-sm">
          {currentSlide === slides.length - 1 ? (
            <Link
              href="/auth"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-700 focus:outline-none transition-colors"
            >
              Get Started
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => scrollToSlide(currentSlide + 1)}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-700 focus:outline-none transition-colors"
            >
              Next
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

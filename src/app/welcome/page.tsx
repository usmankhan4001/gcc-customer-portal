'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';

const slides = [
  {
    id: 1,
    headline: 'Company Registration',
    subtext: 'Full formation in UAE, Bahrain, Hong Kong & more. 100% foreign ownership.',
  },
  {
    id: 2,
    headline: 'Legally pay 0% tax',
    subtext: 'Maximize savings and protect your assets with our Nominee UBO service for full privacy.',
  },
  {
    id: 3,
    headline: 'Bank Account Setup',
    subtext: 'Local credible banking or fintech accounts. Guided from application to approval.',
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
    <div className="flex flex-col min-h-screen bg-white">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {slides.map((slide, index) => (
          <div key={slide.id} className="min-w-full h-full flex flex-col items-center justify-center p-4 snap-center">
            <div className="w-48 h-48 bg-gray-50 rounded-md flex items-center justify-center mb-6 border border-gray-200">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">{slide.headline}</h2>
            <p className="text-sm text-gray-600 text-center max-w-sm">{slide.subtext}</p>
          </div>
        ))}
      </div>

      <div className="p-4 flex flex-col items-center bg-gray-50 border-t border-gray-200">
        <div className="flex space-x-2 mb-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToSlide(index)}
              className={`h-1.5 rounded-sm transition-all duration-300 ${currentSlide === index ? 'w-6 bg-primary' : 'w-2 bg-gray-300'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <div className="w-full max-w-sm">
          {currentSlide === slides.length - 1 ? (
            <Link
              href="/auth"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Get Started
            </Link>
          ) : (
            <button
              onClick={() => scrollToSlide(currentSlide + 1)}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
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
    </div>
  );
}

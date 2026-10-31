import React from 'react';
import { Check } from '@phosphor-icons/react/dist/ssr';

interface PipelineStepTrackerProps {
  steps: string[];
  currentStep: number;
}

export default function PipelineStepTracker({ steps, currentStep }: PipelineStepTrackerProps) {
  return (
    <div className="w-full py-8 px-4 font-sans">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[#E2E8F0] z-0 rounded-full"></div>

        {/* Active Progress Line */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#F26522] z-0 transition-all duration-300 rounded-full"
          style={{ width: `${(Math.max(0, Math.min(currentStep, steps.length - 1)) / Math.max(1, steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isFuture = index > currentStep;

          return (
            <div key={index} className="relative z-10 flex flex-col items-center group">
              {/* Step Node */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${isCompleted ? 'bg-[#F26522] text-white border-2 border-[#F26522] shadow-sm' : ''}
                  ${isCurrent ? 'bg-white text-[#F26522] border-2 border-[#F26522] ring-4 ring-[#FEF1E9]' : ''}
                  ${isFuture ? 'bg-white text-[#94A3B8] border-2 border-[#E2E8F0]' : ''}
                `}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" weight="bold" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Step Label */}
              <div
                className={`absolute top-11 text-[11px] font-bold text-center w-28 -translate-x-1/2 left-1/2 leading-tight
                  ${(isCompleted || isCurrent) ? 'text-[#0F172A]' : 'text-[#94A3B8]'}
                `}
              >
                {step}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

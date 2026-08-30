import React from 'react';
import { Check } from 'lucide-react';

interface PipelineStepTrackerProps {
  steps: string[];
  currentStep: number;
}

export default function PipelineStepTracker({ steps, currentStep }: PipelineStepTrackerProps) {
  return (
    <div className="w-full py-8 px-4">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0 rounded"></div>
        
        {/* Active Progress Line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 z-0 transition-all duration-300 rounded"
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
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300
                  ${isCompleted ? 'bg-blue-600 text-white border-2 border-blue-600' : ''}
                  ${isCurrent ? 'bg-white text-blue-600 border-2 border-blue-600' : ''}
                  ${isFuture ? 'bg-white text-gray-400 border-2 border-gray-300' : ''}
                `}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              
              {/* Step Label */}
              <div 
                className={`absolute top-10 text-xs font-medium text-center w-28 -translate-x-1/2 left-1/2
                  ${(isCompleted || isCurrent) ? 'text-gray-900' : 'text-gray-400'}
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

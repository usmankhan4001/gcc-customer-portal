'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  description?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  orientation?: 'horizontal' | 'vertical';
}

export default function ProgressSteps({ steps, currentStep, orientation = 'horizontal' }: ProgressStepsProps) {
  if (orientation === 'vertical') {
    return (
      <ol className="steps-list steps-list-vertical">
        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;

          return (
            <li key={i} className="step-item-vertical">
              <div className="step-dot-col">
                <div
                  className={isCompleted ? 'step-dot completed' : isCurrent ? 'step-dot active' : 'step-dot'}
                />
                {i < steps.length - 1 && (
                  <div
                    className={`step-connector-v ${
                      isCompleted ? 'step-connector-v-completed' : 'step-connector-v-pending'
                    }`}
                  />
                )}
              </div>
              <div className={`step-content-vertical ${i < steps.length - 1 ? 'step-content-vertical-pad' : ''}`}>
                <div
                  className={`step-label ${
                    isCompleted
                      ? 'step-label-completed'
                      : isCurrent
                      ? 'step-label-current'
                      : 'step-label-pending'
                  }`}
                >
                  {isCompleted && <Check size={14} className="step-check-icon" />}
                  {step.label}
                </div>
                {step.description && <div className="step-desc">{step.description}</div>}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className="steps-list steps-list-horizontal">
      {steps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;

        return (
          <React.Fragment key={i}>
            <li className="step-item-horizontal">
              <div className={isCompleted ? 'step-dot completed' : isCurrent ? 'step-dot active' : 'step-dot'} />
              <span
                className={`step-label-h ${
                  isCompleted
                    ? 'step-label-h-completed'
                    : isCurrent
                    ? 'step-label-h-current'
                    : 'step-label-h-pending'
                }`}
              >
                {step.label}
              </span>
            </li>
            {i < steps.length - 1 && (
              <div
                className={`step-connector-h ${
                  isCompleted ? 'step-connector-h-completed' : 'step-connector-h-pending'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

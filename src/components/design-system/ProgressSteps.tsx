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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;

          return (
            <div key={i} style={{ display: 'flex', gap: 12 }}>
              {/* Line + dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
                <div
                  className={isCompleted ? 'step-dot completed' : isCurrent ? 'step-dot active' : 'step-dot'}
                  style={{ flexShrink: 0, zIndex: 1 }}
                />
                {i < steps.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 24,
                      background: isCompleted ? 'var(--color-success)' : 'var(--color-border)',
                      borderRadius: 2,
                    }}
                  />
                )}
              </div>
              {/* Content */}
              <div style={{ paddingBottom: i < steps.length - 1 ? 20 : 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: isCurrent ? 700 : 600,
                    color: isCompleted
                      ? 'var(--color-success)'
                      : isCurrent
                      ? 'var(--color-brand-navy)'
                      : 'var(--color-text-muted)',
                    lineHeight: 1.3,
                  }}
                >
                  {isCompleted && <Check size={14} style={{ marginRight: 4, verticalAlign: -2 }} />}
                  {step.label}
                </div>
                {step.description && (
                  <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: '100%' }}>
      {steps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;

        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
              <div className={isCompleted ? 'step-dot completed' : isCurrent ? 'step-dot active' : 'step-dot'} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isCurrent ? 700 : 600,
                  color: isCompleted
                    ? 'var(--color-success)'
                    : isCurrent
                    ? 'var(--color-brand-navy)'
                    : 'var(--color-text-muted)',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: isCompleted ? 'var(--color-success)' : 'var(--color-border)',
                  borderRadius: 2,
                  marginTop: -14,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

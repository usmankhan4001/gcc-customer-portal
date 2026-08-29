'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface ProgressStepsProps {
  steps: Step[];
  orientation?: 'horizontal' | 'vertical';
}

function StepCircle({ status, index }: { status: Step['status']; index: number }) {
  const size = 32;

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 13,
    transition: 'all 0.25s ease',
    flexShrink: 0,
  };

  if (status === 'completed') {
    return (
      <div style={{ ...baseStyle, background: 'var(--color-orange)', color: '#FFFFFF' }}>
        <Check size={16} strokeWidth={3} />
      </div>
    );
  }
  if (status === 'current') {
    return (
      <div
        style={{
          ...baseStyle,
          background: 'var(--color-orange-light)',
          border: '2px solid var(--color-orange)',
          color: 'var(--color-orange)',
          boxShadow: '0 0 0 3px rgba(242,101,34,0.18)',
        }}
      >
        {index + 1}
      </div>
    );
  }
  return (
    <div
      style={{
        ...baseStyle,
        background: 'var(--color-surface)',
        border: '2px solid var(--color-border)',
        color: 'var(--color-text-muted)',
      }}
    >
      {index + 1}
    </div>
  );
}

function Connector({ isCompleted, orientation }: { isCompleted: boolean; orientation: 'horizontal' | 'vertical' }) {
  const isHorizontal = orientation === 'horizontal';
  return (
    <div
      style={{
        flex: 1,
        background: isCompleted ? 'var(--color-orange)' : 'var(--color-border)',
        transition: 'background 0.25s ease',
        ...(isHorizontal
          ? { height: 2, minWidth: 20, alignSelf: 'center', margin: '0 4px' }
          : { width: 2, minHeight: 20, marginLeft: 15, margin: '4px 0 4px 15px' }),
      }}
    />
  );
}

export function ProgressSteps({ steps, orientation = 'horizontal' }: ProgressStepsProps) {
  const isHorizontal = orientation === 'horizontal';

  return (
    <ol
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        listStyle: 'none',
        padding: 0,
        margin: 0,
        width: '100%',
        gap: 0,
      }}
      role="list"
      aria-label="Progress steps"
    >
      {steps.map((step, i) => (
        <li
          key={i}
          style={{
            display: 'flex',
            flexDirection: isHorizontal ? 'row' : 'row',
            alignItems: 'center',
            flex: isHorizontal ? 1 : undefined,
          }}
        >
          <div style={{ display: 'flex', flexDirection: isHorizontal ? 'column' : 'row', alignItems: isHorizontal ? 'center' : 'center', flex: isHorizontal ? 1 : undefined, gap: 8 }}>
            <StepCircle status={step.status} index={i} />
            <span
              style={{
                fontSize: 13,
                fontWeight: step.status === 'current' ? 700 : 500,
                color: step.status === 'upcoming' ? 'var(--color-text-muted)' : 'var(--color-text)',
                whiteSpace: 'nowrap',
                ...(isHorizontal ? { marginTop: 6 } : {}),
              }}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <Connector isCompleted={step.status === 'completed'} orientation={orientation} />
          )}
        </li>
      ))}
    </ol>
  );
}

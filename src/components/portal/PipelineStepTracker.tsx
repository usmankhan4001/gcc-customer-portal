import React from 'react';
import { Check } from '@phosphor-icons/react/dist/ssr';
import s from './dash.module.css';

interface PipelineStepTrackerProps {
  steps: string[];
  currentStep: number;
}

export default function PipelineStepTracker({ steps, currentStep }: PipelineStepTrackerProps) {
  return (
    <ol className={s.steps}>
      {steps.map((step, index) => {
        const done = index < currentStep;
        const now = index === currentStep;
        return (
          <li
            key={index}
            className={`${s.step} ${done ? s.stepDone : ''} ${now ? s.stepNow : ''}`}
            aria-current={now ? 'step' : undefined}
          >
            <span className={s.node}>{done ? <Check size={16} weight="bold" /> : index + 1}</span>
            <span className={s.label}>{step}</span>
          </li>
        );
      })}
    </ol>
  );
}

'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  number: number;
  label: string;
  subLabel?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStage: number; // 1-indexed
  onStepClick?: (stage: number) => void;
}

export default function Stepper({
  steps,
  currentStage,
  onStepClick,
}: StepperProps) {
  const percentage = Math.min(100, Math.max(0, ((currentStage - 1) / (steps.length - 1)) * 100));

  return (
    <div className="stepper-root">
      <div className="stepper-track-bg">
        <div className="stepper-track-fill" style={{ width: `${percentage}%` }} />
      </div>

      <div className="stepper-nodes">
        {steps.map((s) => {
          const isDone = currentStage > s.number;
          const isCurrent = currentStage === s.number;
          const isUpcoming = currentStage < s.number;

          return (
            <div
              key={s.number}
              onClick={() => onStepClick && onStepClick(s.number)}
              className={`step-col ${isDone ? 'done' : isCurrent ? 'current' : 'upcoming'} ${
                onStepClick ? 'clickable' : ''
              }`}
            >
              <div className="node-circle">
                {isDone ? <Check className="w-4 h-4 text-white" /> : s.number}
              </div>
              <span className="node-title display-font">{s.label}</span>
              {s.subLabel && <span className="node-sub">{s.subLabel}</span>}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .stepper-root {
          position: relative;
          width: 100%;
          padding: 8px 0;
        }

        .stepper-track-bg {
          position: absolute;
          top: 24px;
          left: 5%;
          right: 5%;
          height: 4px;
          background: #E5E7EB;
          z-index: 1;
        }

        .stepper-track-fill {
          height: 100%;
          background: var(--orange);
          transition: width 0.35s ease;
        }

        .stepper-nodes {
          display: flex;
          justify-content: space-between;
          position: relative;
          z-index: 2;
        }

        .step-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 4px;
          max-width: 110px;
        }

        .step-col.clickable {
          cursor: pointer;
        }

        .node-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--surface);
          border: 2px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-tertiary);
          transition: all 0.25s ease;
        }

        .step-col.done .node-circle {
          background: var(--success);
          border-color: var(--success);
          color: #FFFFFF;
        }

        .step-col.current .node-circle {
          background: var(--orange-lt);
          border-color: var(--orange);
          color: var(--orange);
          box-shadow: 0 0 0 3px rgba(242, 101, 34, 0.2);
        }

        .node-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--navy);
          line-height: 1.3;
        }

        .node-sub {
          font-size: 11px;
          color: var(--text-tertiary);
        }
      `}</style>
    </div>
  );
}

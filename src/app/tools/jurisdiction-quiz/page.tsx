'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import BannerHeader from '@/components/portal/BannerHeader';
import { ArrowRight, CheckCircle, CircleNotch, Sparkle } from '@phosphor-icons/react';
import {
  QUIZ_GOAL_OPTIONS as GOALS,
  QUIZ_TIMELINE_OPTIONS as TIMELINES,
  mapQuizResponse,
  type QuizRecommendation as Recommendation,
} from '@/lib/tools/jurisdiction-quiz';
import ContactCaptureGate from '@/components/portal/ContactCaptureGate';
import s from '../tools.module.css';

const BUDGETS = [
  { value: 'under_50k', label: 'Under $50,000 / year' },
  { value: '50k_150k', label: '$50,000 – $150,000 / year' },
  { value: '150k_500k', label: '$150,000 – $500,000 / year' },
  { value: 'over_500k', label: 'Over $500,000 / year' },
];

export default function JurisdictionQuiz() {
  const [goal, setGoal] = useState<string>(GOALS[0].value);
  const [budgetBand, setBudgetBand] = useState(BUDGETS[0].value);
  const [timeline, setTimeline] = useState<string>(TIMELINES[0].value);
  const [wantsRelocation, setWantsRelocation] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setRecommendations(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRecommendations(null);
    try {
      const res = await fetch('/api/quiz/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, budget_band: budgetBand, timeline, wants_relocation: wantsRelocation }),
      });
      const mapped = res.ok ? mapQuizResponse(await res.json()) : null;
      if (mapped) setRecommendations(mapped);
      else setError('We could not match jurisdictions right now. Please try again.');
    } catch {
      setError('We could not match jurisdictions right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BannerHeader title="Jurisdiction Fit Quiz" subtitle="Answer 4 quick questions to reveal your optimal global incorporation structure." />

      <main className={`wrap ${s.main}`}>
        <div className={`${s.stack} ${s.narrow}`}>
          <form onSubmit={handleSubmit} className="card admin-form-card">
            <div className="admin-form-stack">
              <div className="field">
                <label htmlFor="goal">What matters most right now?</label>
                <select id="goal" value={goal} onChange={(e) => { setGoal(e.target.value); reset(); }}>
                  {GOALS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="budget">Estimated annual business revenue / profit?</label>
                <select id="budget" value={budgetBand} onChange={(e) => { setBudgetBand(e.target.value); reset(); }}>
                  {BUDGETS.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="timeline">How soon do you need your entity active?</label>
                <select id="timeline" value={timeline} onChange={(e) => { setTimeline(e.target.value); reset(); }}>
                  {TIMELINES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <label className={s.check}>
                <input
                  type="checkbox"
                  checked={wantsRelocation}
                  onChange={(e) => { setWantsRelocation(e.target.checked); reset(); }}
                />
                <span>I want a residence visa (Golden / Investor Visa) with this formation</span>
              </label>
            </div>

            <div className="admin-form-actions">
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? <CircleNotch className={s.spin} /> : <Sparkle />}
                {loading ? 'Analyzing jurisdictions…' : 'Find my optimal jurisdiction'}
              </button>
            </div>
          </form>

          {error && <div role="alert" className="admin-callout is-error">{error}</div>}
        </div>

        {recommendations && (
          <div className={`${s.stack} ${s.medium}`}>
            <div className={s.row}>
              <h2 className={s.h2}>Your recommended jurisdictions</h2>
              <span className="badge badge-success"><CheckCircle size={14} /> Matched</span>
            </div>

            {recommendations.map((rec, idx) => (
              <div key={rec.jurisdiction} className={`card ${idx === 0 ? s.cardWarn : ''}`}>
                <div className={s.row}>
                  <div>
                    {idx === 0 && <span className="badge badge-accent">Best fit</span>}
                    <h3 className={s.h3}>{rec.name}</h3>
                  </div>
                  <div>
                    <span className={s.metricValue}>{rec.matchScore}%</span>
                    <span className={s.metricLabel}>Fit score</span>
                  </div>
                </div>

                <p className={s.body} style={{ margin: 'var(--space-3) 0' }}>{rec.whyFit}</p>

                <div className={s.cells}>
                  <div className={s.cell}>
                    <span className={s.metricLabel}>Corporate tax</span>
                    <strong>{rec.corporateTaxRate}</strong>
                  </div>
                  <div className={s.cell}>
                    <span className={s.metricLabel}>Formation speed</span>
                    <strong>{rec.timelineDays}</strong>
                  </div>
                </div>

                <Link href={rec.serviceHref || '/services'} className={s.link}>
                  View packages &amp; formation fees <ArrowRight size={16} />
                </Link>
              </div>
            ))}

            <ContactCaptureGate
              sourceTool="jurisdiction_quiz"
              toolInput={{ goal, budget_band: budgetBand, timeline, wants_relocation: wantsRelocation }}
              toolResult={{ recommendations }}
            />
          </div>
        )}
      </main>
    </>
  );
}

'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Send,
  Building2,
  CalendarCheck,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Bot,
  Activity,
} from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { crmFetch, formatShortDate } from './types'

type AutomationStat = {
  activeJobs: number
  renewalsMonitored: number
  totalAutomatedEvents: number
}

type SystemActivity = {
  id: string
  title: string
  description: string
  occurred_at: string
  lead_id?: { id: string; name?: string; order_number?: string } | string
}

export function AutomationsView() {
  const [runningTick, setRunningTick] = useState(false)
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null)
  const [activities, setActivities] = useState<SystemActivity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)
  const { success: showSuccess, error: showError } = useToast()

  useEffect(() => {
    loadRecentAutomations()
  }, [])

  async function loadRecentAutomations() {
    setLoadingActivities(true)
    try {
      const res = await crmFetch<{ activities: SystemActivity[] }>('/api/crm/activities?type=system&limit=20').catch(() => ({ activities: [] }))
      setActivities(res.activities || [])
    } catch {
      // Fallback graceful
    } finally {
      setLoadingActivities(false)
    }
  }

  async function runTick() {
    setRunningTick(true)
    try {
      const res = await fetch('/api/jobs/tick', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Automation engine tick failed')
      setLastResult(data)
      showSuccess(`Automation engine executed successfully: ${data.senderJobsProcessed || 0} jobs processed, ${data.renewalsChecked || 0} renewals evaluated.`)
      await loadRecentAutomations()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error executing automation tick')
    } finally {
      setRunningTick(false)
    }
  }

  return (
    <div className="auto-container">
      {/* Top Banner / Engine Status */}
      <div className="auto-banner">
        <div className="auto-banner-text">
          <div className="auto-status-pill">
            <span className="auto-status-dot" />
            AUTONOMOUS BACKEND ENGINE ACTIVE
          </div>
          <h2>CRM Automation & Execution Radar</h2>
          <p>
            Background worker orchestrates multi-channel client alerts, stage advancement triggers, KYC compliance outreach, and annual renewal deadlines with at-least-once durable delivery.
          </p>
        </div>

        <button
          type="button"
          onClick={runTick}
          disabled={runningTick}
          className="auto-engine-btn"
        >
          <Zap size={16} />
          {runningTick ? 'Running Automation Tick…' : 'Trigger Engine Tick Now'}
        </button>
      </div>

      {/* Last Result Banner if triggered */}
      {lastResult && (
        <div className="auto-result-banner">
          <div className="auto-result-left">
            <CheckCircle2 size={18} color="#16A34A" />
            <span className="auto-result-text">
              Engine Heartbeat Succeeded · Processed {Number(lastResult.senderJobsProcessed || 0)} outbox jobs · Evaluated {Number(lastResult.renewalsChecked || 0)} entity renewals
            </span>
          </div>
          <span className="auto-result-status">
            Status: {String(lastResult.ok ? 'OK (200)' : 'Error')}
          </span>
        </div>
      )}

      {/* 4 Active Autonomous Engines */}
      <h3 className="auto-section-title">
        Configured Autonomous Workflows
      </h3>

      <div className="auto-grid">
        {/* 1. Stage Triggers */}
        <div className="auto-workflow-card">
          <div className="auto-workflow-header">
            <span className="auto-workflow-icon blue">
              <Send size={18} />
            </span>
            <span className="auto-workflow-badge">ACTIVE · EVENT-DRIVEN</span>
          </div>
          <h4>Multi-Channel Client Dispatches</h4>
          <p>
            Fires automatically whenever a deal moves stage. Dispatches branded emails, WhatsApp messages, and updates the public shipment status tracker (`/track/[token]`).
          </p>
        </div>

        {/* 2. Client & Invoice Promotion */}
        <div className="auto-workflow-card">
          <div className="auto-workflow-header">
            <span className="auto-workflow-icon purple">
              <Building2 size={18} />
            </span>
            <span className="auto-workflow-badge">ACTIVE · CLOSED STAGE</span>
          </div>
          <h4>Client Profile & Invoice Generation</h4>
          <p>
            Promotes leads into permanent Client Accounts, creates Company Entities with statutory registers, and generates primary fulfillment invoices on stage `closed`.
          </p>
        </div>

        {/* 3. Renewal Radar */}
        <div className="auto-workflow-card">
          <div className="auto-workflow-header">
            <span className="auto-workflow-icon gold">
              <CalendarCheck size={18} />
            </span>
            <span className="auto-workflow-badge">ACTIVE · DAILY RADAR</span>
          </div>
          <h4>Statutory Renewal & Tax Radar</h4>
          <p>
            Scans government registry deadlines 30 days ahead of time. Auto-creates CRM follow-up tasks and dispatches proactive WhatsApp renewal notices to company owners.
          </p>
        </div>

        {/* 4. AI Lead Scoring */}
        <div className="auto-workflow-card">
          <div className="auto-workflow-header">
            <span className="auto-workflow-icon teal">
              <Sparkles size={18} />
            </span>
            <span className="auto-workflow-badge">ACTIVE · REAL-TIME</span>
          </div>
          <h4>Automated Lead Scoring Engine</h4>
          <p>
            Evaluates corporate domain authenticity, nominee packages, and GCC target markets in real-time. Instantly tags incoming leads with VIP, High, and Medium priority badges.
          </p>
        </div>
      </div>

      {/* Live Activity Stream */}
      <div className="auto-workflow-card">
        <div className="auto-activity-header">
          <h3>
            <Activity size={18} color="#2563EB" /> Recent Automated Dispatches & Actions
          </h3>
          <button
            type="button"
            onClick={loadRecentAutomations}
            disabled={loadingActivities}
            className="auto-refresh-btn"
          >
            <RefreshCw size={12} className={loadingActivities ? 'crm-spinner' : ''} /> Refresh
          </button>
        </div>

        {activities.length === 0 && !loadingActivities ? (
          <div className="auto-empty">
            No automated actions logged yet. When leads move stage or background cron fires, their executions will stream here.
          </div>
        ) : (
          <div className="auto-activity-stream">
            {activities.map((act) => (
              <div key={act.id} className="auto-activity-item">
                <span className="auto-activity-icon">
                  <Zap size={14} />
                </span>
                <div className="auto-activity-body">
                  <div className="auto-activity-top">
                    <strong>{act.title}</strong>
                    <time>{formatShortDate(act.occurred_at, true)}</time>
                  </div>
                  <p>
                    {act.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

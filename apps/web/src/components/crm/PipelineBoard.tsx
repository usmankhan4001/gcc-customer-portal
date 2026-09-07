'use client'

import { useEffect, useRef, useState } from 'react'
import { Building2, CalendarClock, CheckCircle2, CircleDollarSign, GripVertical, MoveRight, Sparkles, UserRound, Zap } from 'lucide-react'
import type { LeadStatus } from '@/lib/directus'
import { calculateLeadScore } from '@/lib/crm/scoring'
import { formatMoney, formatShortDate, isOverdue, type CRMLead, userLabel } from './types'

const STAGES: Array<{ id: LeadStatus; label: string; cue: string }> = [
  { id: 'new', label: 'New', cue: 'Inquiry received' },
  { id: 'paid_application', label: 'Paid Order', cue: 'Payment & docs received' },
  { id: 'kyc_processing', label: 'KYC Review', cue: 'Compliance outreach' },
  { id: 'applied', label: 'Applied', cue: 'Submitted to E-Registry' },
  { id: 'registered', label: 'Registered', cue: 'Official docs issued' },
  { id: 'banking_filed', label: 'Banking Filed', cue: 'Bank accounts pending' },
  { id: 'closed', label: 'Closed', cue: 'Fulfilled & active' },
  { id: 'lost', label: 'Lost', cue: 'Closed out' },
]

/** Pixels the pointer must travel before a press becomes a drag. Below this we treat the
 *  gesture as a tap, so a stray finger movement doesn't swallow the card's click. */
const DRAG_THRESHOLD = 6

/** Which stage column sits under a viewport point. Pointer Events have no equivalent of
 *  dataTransfer and fire no drop event, so the target column is resolved by hit-testing. */
function stageUnderPoint(x: number, y: number): LeadStatus | null {
  const el = document.elementFromPoint(x, y)
  const section = el?.closest?.('[data-stage]') as HTMLElement | null
  return (section?.dataset.stage as LeadStatus | undefined) ?? null
}

export function PipelineBoard({
  leads,
  movingId,
  onOpen,
  onMove,
}: {
  leads: CRMLead[]
  movingId: string | null
  onOpen: (id: string) => void
  onMove: (lead: CRMLead, status: LeadStatus) => void
}) {
  const [overStage, setOverStage] = useState<LeadStatus | null>(null)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  // `drag` is null whenever no drag is in flight, which also keeps the ghost unmounted.
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const dragStart = useRef<{ x: number; y: number; id: string; active: boolean } | null>(null)

  useEffect(() => {
    if (!menuFor) return
    const close = () => setMenuFor(null)
    // Capture phase, so a click elsewhere closes the menu before that click is acted on.
    document.addEventListener('pointerdown', close, true)
    return () => document.removeEventListener('pointerdown', close, true)
  }, [menuFor])

  function commitMove(leadId: string, stage: LeadStatus | null) {
    if (!stage) return
    const lead = leads.find((item) => item.id === leadId)
    if (lead && (lead.status || 'new') !== stage) onMove(lead, stage)
  }

  /* This board used to rely solely on the HTML5 drag events (draggable/onDragStart/onDrop).
   * Those fire on desktop but are unsupported by iOS Safari and Android Chrome, so on a
   * phone a lead could not be moved at all. Pointer Events cover mouse, pen and touch in
   * one code path. The HTML5 handlers are deliberately kept alongside them so existing
   * desktop behaviour is unchanged. */
  function onGripPointerDown(event: React.PointerEvent, leadId: string) {
    if (movingId === leadId) return
    event.stopPropagation()
    dragStart.current = { x: event.clientX, y: event.clientY, id: leadId, active: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onGripPointerMove(event: React.PointerEvent) {
    const start = dragStart.current
    if (!start) return
    if (!start.active) {
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < DRAG_THRESHOLD) return
      start.active = true
    }
    setDrag({ id: start.id, x: event.clientX, y: event.clientY })
    setOverStage(stageUnderPoint(event.clientX, event.clientY))
  }

  function onGripPointerUp(event: React.PointerEvent) {
    const start = dragStart.current
    dragStart.current = null
    if (!start) return
    if (start.active) commitMove(start.id, stageUnderPoint(event.clientX, event.clientY))
    setDrag(null)
    setOverStage(null)
  }

  const draggedLead = drag ? leads.find((item) => item.id === drag.id) : undefined

  return (
    <div className="crm-pipeline" aria-label="Lead pipeline">
      {STAGES.map((stage) => {
        const stageLeads = leads.filter((lead) => (lead.status || 'new') === stage.id)
        const total = stageLeads.reduce((sum, lead) => sum + Number(lead.estimated_value || 0), 0)
        return (
          <section
            key={stage.id}
            data-stage={stage.id}
            className={`crm-stage crm-stage-${stage.id}${overStage === stage.id ? ' is-over' : ''}`}
            onDragOver={(event) => {
              event.preventDefault()
              setOverStage(stage.id)
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOverStage(null)
            }}
            onDrop={(event) => {
              event.preventDefault()
              setOverStage(null)
              // The touch path tracks the dragged id in `drag` (Pointer Events have no
              // dataTransfer); the desktop HTML5 path reads it from dataTransfer. Reading
              // dataTransfer on the touch path would throw (it is null), so prefer the
              // tracked id and fall back to dataTransfer only when it is present.
              const id = drag?.id ?? event.dataTransfer?.getData('text/lead-id') ?? ''
              commitMove(id, stage.id)
            }}
          >
            <header className="crm-stage-header">
              <div>
                <div className="crm-stage-title"><span className="crm-stage-dot" />{stage.label}<span>{stageLeads.length}</span></div>
                <div className="crm-stage-cue">{stage.cue}</div>
              </div>
              {total > 0 && <span className="crm-stage-value">{formatMoney(total, stageLeads[0]?.currency || 'USD')}</span>}
            </header>

            <div className="crm-stage-cards">
              {stageLeads.map((lead) => {
                const overdue = !['won', 'lost'].includes(stage.id) && isOverdue(lead.next_follow_up_at)
                return (
                  <div
                    key={lead.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${lead.name || 'Unnamed lead'} — ${stage.label}`}
                    className={`crm-lead-card${overdue ? ' is-overdue' : ''}${movingId === lead.id ? ' is-moving' : ''}${drag?.id === lead.id ? ' is-dragging' : ''}`}
                    draggable={movingId !== lead.id}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move'
                      event.dataTransfer.setData('text/lead-id', lead.id)
                    }}
                    onClick={() => onOpen(lead.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onOpen(lead.id)
                      }
                    }}
                  >
                    {/* Touch drag starts on the handle rather than the whole card, so tapping
                        the card still opens it and the column still scrolls under a finger. */}
                    <span
                      className="crm-card-grip"
                      aria-hidden="true"
                      style={{ touchAction: 'none' }}
                      onPointerDown={(event) => onGripPointerDown(event, lead.id)}
                      onPointerMove={onGripPointerMove}
                      onPointerUp={onGripPointerUp}
                      onPointerCancel={onGripPointerUp}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <GripVertical size={14} />
                    </span>

                    {/* Dragging is a pointing gesture even with Pointer Events. This is the
                        path that works with a keyboard, with a screen reader, and on a narrow
                        phone where the target column is off-screen. */}
                    <button
                      type="button"
                      className="crm-card-move"
                      aria-label={`Move ${lead.name || 'lead'} to another stage`}
                      aria-haspopup="menu"
                      aria-expanded={menuFor === lead.id}
                      onClick={(event) => {
                        event.stopPropagation()
                        setMenuFor(menuFor === lead.id ? null : lead.id)
                      }}
                    >
                      <MoveRight size={14} />
                    </button>
                    {menuFor === lead.id && (
                      <div className="crm-card-move-menu" role="menu" onClick={(event) => event.stopPropagation()}>
                        <div className="crm-card-move-title">Move to</div>
                        {STAGES.filter((target) => target.id !== stage.id).map((target) => (
                          <button
                            type="button"
                            role="menuitem"
                            key={target.id}
                            onClick={() => {
                              setMenuFor(null)
                              commitMove(lead.id, target.id)
                            }}
                          >
                            {target.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Topline: Order # / Priority + AI Score */}
                    <div className="crm-card-topline-row">
                      <div className="crm-card-topline-left">
                        {lead.order_number && (
                          <span className="crm-card-order-pill">{lead.order_number}</span>
                        )}
                        <span className={`crm-priority crm-priority-${lead.priority || 'normal'}`}>{lead.priority || 'normal'}</span>
                      </div>
                      {(() => {
                        const s = calculateLeadScore(lead)
                        const tierClass = s.tier === 'VIP' ? 'vip' : s.tier === 'High' ? 'high' : 'medium'
                        return (
                          <span className={`crm-card-score-pill ${tierClass}`}>
                            <Sparkles size={9} /> {s.tier}
                          </span>
                        )
                      })()}
                    </div>

                    {/* Client Name & Proposed Company Name */}
                    <strong className="crm-card-name">{lead.name || 'Unnamed lead'}</strong>
                    {lead.company_name_choice_1 && (
                      <span className="crm-card-company">
                        <Building2 size={11} /> {lead.company_name_choice_1}
                      </span>
                    )}

                    {/* Jurisdiction & Package / Subtitle */}
                    <span className="crm-card-subtitle">
                      {[lead.jurisdiction || lead.country, lead.package_type?.replace(/_/g, ' ')].filter(Boolean).join(' · ') || lead.email || 'No context'}
                    </span>

                    {/* Money & Automation / Tracking pill */}
                    <div className="crm-card-bottom-row">
                      {lead.payment_status === 'paid' ? (
                        <span className="crm-card-paid-pill">
                          <CheckCircle2 size={10} /> Paid {formatMoney(lead.amount_paid || lead.estimated_value, lead.currency || 'USD')}
                        </span>
                      ) : lead.estimated_value ? (
                        <span className="crm-card-value"><CircleDollarSign size={11} />{formatMoney(lead.estimated_value, lead.currency || 'USD')}</span>
                      ) : <span />}

                      {lead.tracking_token && (
                        <span className="crm-card-auto-pill" title="Public tracker active">
                          <Zap size={9} /> Auto-Sync
                        </span>
                      )}
                    </div>

                    <div className="crm-card-footer">
                      <span><UserRound size={11} />{userLabel(lead.assigned_to)}</span>
                      <span className={overdue ? 'crm-due-overdue' : ''}>
                        <CalendarClock size={11} />
                        {overdue ? 'Overdue' : formatShortDate(lead.next_follow_up_at, false)}
                      </span>
                    </div>
                  </div>
                )
              })}
              {stageLeads.length === 0 && <div className="crm-stage-empty">Drop a lead here, or use a card&rsquo;s move button</div>}
            </div>
          </section>
        )
      })}

      {/* Pointer Events paint no drag image of their own, so without this the gesture gives
          no feedback at all on a phone. */}
      {drag && draggedLead && (
        <div className="crm-drag-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          {draggedLead.name || 'Unnamed lead'}
        </div>
      )}
    </div>
  )
}

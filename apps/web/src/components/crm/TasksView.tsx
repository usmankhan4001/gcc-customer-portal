'use client'

import { Check, Clock3, UserRound } from 'lucide-react'
import { formatShortDate, isOverdue, type CRMTask, userLabel } from './types'

export function TasksView({
  tasks,
  busyId,
  onComplete,
  onOpenLead,
}: {
  tasks: CRMTask[]
  busyId: string | null
  onComplete: (task: CRMTask) => void
  onOpenLead: (id: string) => void
}) {
  if (tasks.length === 0) {
    return <div className="crm-empty-panel"><Check size={24} /><strong>No active tasks</strong><span>Create a task from any lead record.</span></div>
  }

  return (
    <div className="crm-task-table card">
      {tasks.map((task) => {
        const lead = typeof task.lead_id === 'string' ? null : task.lead_id
        const overdue = task.status !== 'completed' && isOverdue(task.due_at)
        return (
          <article className="crm-task-row" key={task.id}>
            <button
              type="button"
              className="crm-task-check"
              aria-label={`Complete ${task.title}`}
              disabled={busyId === task.id}
              onClick={() => onComplete(task)}
            >
              {busyId === task.id ? <span className="crm-mini-spinner" /> : <Check size={14} />}
            </button>
            <div className="crm-task-main">
              <strong>{task.title}</strong>
              <button type="button" className="crm-inline-link" onClick={() => lead && onOpenLead(lead.id)} disabled={!lead}>
                {lead?.name || lead?.email || 'Unknown lead'}
              </button>
            </div>
            <span className={`crm-priority crm-priority-${task.priority}`}>{task.priority}</span>
            <span className={`crm-task-meta${overdue ? ' crm-due-overdue' : ''}`}><Clock3 size={14} />{overdue ? 'Overdue: ' : ''}{formatShortDate(task.due_at, true)}</span>
            <span className="crm-task-meta"><UserRound size={14} />{userLabel(task.assigned_to)}</span>
          </article>
        )
      })}
    </div>
  )
}

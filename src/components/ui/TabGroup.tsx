'use client';

import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number | string;
  icon?: React.ReactNode;
}

export interface TabGroupProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export default function TabGroup({
  tabs,
  activeTab,
  onChange,
  className = '',
}: TabGroupProps) {
  return (
    <div className={`tab-group-container ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`tab-btn ${isActive ? 'active' : ''}`}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`tab-count ${isActive ? 'count-active' : ''}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}

      <style jsx>{`
        .tab-group-container {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding: 4px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          border-radius: var(--radius-pill);
          font-size: 13px;
          font-weight: 700;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .tab-btn:hover {
          border-color: var(--navy);
          color: var(--navy);
        }

        .tab-btn.active {
          background: var(--navy);
          border-color: var(--navy);
          color: #FFFFFF;
        }

        .tab-icon {
          display: inline-flex;
          align-items: center;
        }

        .tab-count {
          font-size: 11px;
          padding: 1px 6px;
          border-radius: var(--radius-pill);
          background: var(--sand);
          color: var(--navy);
          font-weight: 700;
        }

        .count-active {
          background: rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
        }
      `}</style>
    </div>
  );
}

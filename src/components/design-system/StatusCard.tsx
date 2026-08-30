'use client';

import React from 'react';

interface StatusCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'orange' | 'blue' | 'success' | 'navy';
}

export default function StatusCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = 'default',
}: StatusCardProps) {
  const isNavy = variant === 'navy';

  return (
    <div className={`status-card status-card-${variant}`}>
      <div className="status-card-header">
        <span className={`status-card-title ${isNavy ? 'status-card-title-navy' : 'status-card-title-default'}`}>
          {title}
        </span>
        {icon}
      </div>
      <div className={`status-card-value ${isNavy ? 'status-card-value-navy' : 'status-card-value-default'}`}>
        {value}
      </div>
      {subtitle && (
        <span className={`status-card-subtitle ${isNavy ? 'status-card-subtitle-navy' : 'status-card-subtitle-default'}`}>
          {subtitle}
        </span>
      )}
      {trend && trendValue && (
        <div className="status-card-trend">
          <span className={`status-card-trend-value status-card-trend-${trend}`}>
            {trend === 'up' ? '\u2191' : trend === 'down' ? '\u2193' : '\u2022'} {trendValue}
          </span>
        </div>
      )}
    </div>
  );
}

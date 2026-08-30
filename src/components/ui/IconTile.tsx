import React from 'react';

export interface IconTileProps {
  icon: React.ReactNode;
  color?: 'orange' | 'navy' | 'success' | 'info' | 'warning' | 'navy-solid';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * The icon-in-rounded-colored-box pattern used throughout the app
 * (onboarding wizard, checkout, diagnostic modal, tools hub, home page).
 * Previously hand-duplicated as a one-off inline `style={{}}` object at
 * every call site — this is the single reusable version.
 */
export function IconTile({ icon, color = 'orange', size = 'md', className = '' }: IconTileProps) {
  return (
    <div className={`icon-tile icon-tile-${size} icon-tile-${color} ${className}`}>
      {icon}
    </div>
  );
}

export default IconTile;

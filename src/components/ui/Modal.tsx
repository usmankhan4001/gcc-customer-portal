'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  showHandle?: boolean;
  badge?: string;
  badgeVariant?: string;
  children: React.ReactNode;
}

/**
 * Compatibility wrapper over shadcn's Dialog (Radix) preserving the old
 * isOpen/onClose prop shape so existing call sites don't break. Still
 * centered-only (not yet the responsive bottom-sheet-on-mobile behavior
 * planned for the screen rebuild) — revisit when those screens are touched.
 */
export function Modal({ isOpen, onClose, title, badge, badgeVariant, children }: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        {title && (
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>{title}</DialogTitle>
              {badge && (
                <Badge variant={badgeVariant === 'orange' ? 'default' : 'secondary'}>{badge}</Badge>
              )}
            </div>
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}

Modal.displayName = 'Modal';

export default Modal;

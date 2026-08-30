'use client';

import React from 'react';
import {
  Modal as HeroModal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseTrigger,
  useOverlayState,
} from '@heroui/react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  showHandle?: boolean;
  badge?: string;
  badgeVariant?: string;
  children: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  showHandle = true,
  badge,
  badgeVariant,
  children,
}: ModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange: (open) => { if (!open) onClose(); } });

  return (
    <HeroModal state={state}>
      <ModalBackdrop isDismissable onClick={onClose}>
        <ModalContainer placement="bottom">
          <ModalDialog>
            {showHandle && (
              <div className="modal-handle" aria-hidden="true" />
            )}
            {title && (
              <ModalHeader>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-[1.15rem] font-bold text-[var(--color-text)]">
                      {title}
                    </span>
                    {badge && (
                      <span
                        className={`badge ${badgeVariant === 'orange' ? 'badge-orange' : 'badge-success'} text-[0.65rem]`}
                      >
                        {badge}
                      </span>
                    )}
                  </div>
                  <ModalCloseTrigger className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] border border-[var(--color-border)] flex items-center justify-center cursor-pointer text-[var(--color-text-secondary)] shrink-0">
                    <X size={16} />
                  </ModalCloseTrigger>
                </div>
              </ModalHeader>
            )}
            <ModalBody>{children}</ModalBody>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </HeroModal>
  );
}

Modal.displayName = 'Modal';

export default Modal;

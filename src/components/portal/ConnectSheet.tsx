'use client';

import { Envelope, Phone, WhatsappLogo } from '@phosphor-icons/react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

const SUPPORT_WHATSAPP = 'https://wa.me/97337728231';
const SUPPORT_EMAIL = 'mailto:support@gccstartup.com';
const SUPPORT_PHONE = 'tel:+97337728231';

interface ConnectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * "How do you want to connect with us" — a bottom sheet on mobile,
 * a centered dialog at the lg breakpoint (Decision 23: responsive shells
 * share components via responsive variants, not parallel duplicates).
 * Same three channels as the full /support page, as a quick-access popup
 * reachable from anywhere via the bottom nav / sidebar.
 */
export default function ConnectSheet({ open, onOpenChange }: ConnectSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl lg:rounded-2xl lg:border lg:top-1/2 lg:left-1/2 lg:bottom-auto lg:inset-x-auto lg:-translate-x-1/2 lg:-translate-y-1/2 lg:max-w-sm lg:w-full"
      >
        <SheetHeader className="text-center pt-2">
          <SheetTitle className="text-base font-bold">How do you want to connect with us?</SheetTitle>
          <SheetDescription>Pick whichever channel is easiest for you.</SheetDescription>
        </SheetHeader>

        <div className="flex justify-center items-center gap-6 pb-8">
          <a href={SUPPORT_EMAIL} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 group-hover:bg-gray-50 transition-colors">
              <Envelope size={22} weight="duotone" />
            </div>
            <span className="text-xs font-semibold text-gray-600">Email</span>
          </a>

          <a href={SUPPORT_PHONE} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-full border border-primary-200 flex items-center justify-center text-primary group-hover:bg-primary-50 transition-colors">
              <Phone size={22} weight="duotone" />
            </div>
            <span className="text-xs font-semibold text-gray-600">Call</span>
          </a>

          <a href={SUPPORT_WHATSAPP} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-full border border-green-200 flex items-center justify-center text-green-600 group-hover:bg-green-50 transition-colors">
              <WhatsappLogo size={22} weight="duotone" />
            </div>
            <span className="text-xs font-semibold text-gray-600">WhatsApp</span>
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}

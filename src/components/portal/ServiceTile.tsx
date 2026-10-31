import React from 'react';
import Link from 'next/link';

interface ServiceTileProps {
  title: string;
  icon: React.ReactNode;
  href: string;
}

export default function ServiceTile({ title, icon, href }: ServiceTileProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl sm:rounded-3xl hover:border-[#F26522] hover:shadow-[0_10px_25px_-5px_rgba(242,101,34,0.12)] hover:-translate-y-1 transition-all aspect-square text-center group cursor-pointer"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#FEF1E9] text-[#F26522] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-xs font-bold text-[#0F172A] leading-tight group-hover:text-[#F26522] transition-colors">
        {title}
      </span>
    </Link>
  );
}

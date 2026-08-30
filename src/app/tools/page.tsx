import BannerHeader from '@/components/portal/BannerHeader';
import ServiceTile from '@/components/portal/ServiceTile';
import {
  Calculator,
  Landmark,
  FileSignature,
  ShieldQuestion,
  Percent,
  CalendarClock,
  Users,
  Search,
  BadgeCheck,
  Compass,
} from 'lucide-react';

const TOOLS = [
  { title: 'Tax Calculator', href: '/tools/tax-calculator', icon: Calculator },
  { title: 'Jurisdiction Fit Quiz', href: '/tools/jurisdiction-quiz', icon: Compass },
  { title: 'Banking Odds', href: '/tools/banking-odds', icon: Landmark },
  { title: 'Generate NDA', href: '/tools/generate-nda', icon: FileSignature },
  { title: 'UBO Privacy', href: '/tools/ubo-privacy', icon: ShieldQuestion },
  { title: 'VAT Scorer', href: '/tools/vat-scorer', icon: Percent },
  { title: 'Compliance Calendar', href: '/tools/compliance-calendar', icon: CalendarClock },
  { title: 'Visa Estimator', href: '/tools/visa-estimator', icon: Users },
  { title: 'Name Checker', href: '/tools/name-checker', icon: Search },
  { title: 'QFZP Eligibility', href: '/tools/qfzp-eligibility', icon: BadgeCheck },
];

export default function ToolsIndexPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-8">
      <BannerHeader title="Tools & Calculators" subtitle="Free tools to plan your global structure." />

      <div className="px-4 -mt-4 relative z-10 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {TOOLS.map((tool) => (
            <ServiceTile
              key={tool.href}
              title={tool.title}
              href={tool.href}
              icon={<tool.icon className="w-6 h-6 text-gray-700" />}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

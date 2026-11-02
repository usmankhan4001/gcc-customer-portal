import Link from 'next/link';
import BannerHeader from '@/components/portal/BannerHeader';
import {
  Calculator,
  Bank,
  Signature,
  ShieldCheck,
  Percent,
  CalendarCheck,
  Users,
  MagnifyingGlass,
  SealCheck,
  Compass,
  Receipt,
  ArrowRight,
} from '@phosphor-icons/react/dist/ssr';
import s from './tools.module.css';

const TOOLS = [
  { title: 'Tax Calculator', blurb: 'Estimate yearly tax savings from relocating.', href: '/tools/tax-calculator', icon: Calculator },
  { title: 'Jurisdiction Quiz', blurb: 'Find the best-fit place to incorporate.', href: '/tools/jurisdiction-quiz', icon: Compass },
  { title: 'Banking Odds', blurb: 'See your corporate bank approval odds.', href: '/tools/banking-odds', icon: Bank },
  { title: 'Generate NDA', blurb: 'Draft a mutual non-disclosure agreement.', href: '/tools/generate-nda', icon: Signature },
  { title: 'Invoice Generator', blurb: 'Create and download a branded invoice.', href: '/tools/invoice-generator', icon: Receipt },
  { title: 'UBO Privacy', blurb: 'Check what a public registry would show.', href: '/tools/ubo-privacy', icon: ShieldCheck },
  { title: 'VAT Scorer', blurb: 'Do you need to register for UAE VAT?', href: '/tools/vat-scorer', icon: Percent },
  { title: 'Compliance Calendar', blurb: 'List your UAE statutory deadlines.', href: '/tools/compliance-calendar', icon: CalendarCheck },
  { title: 'Visa Estimator', blurb: 'Estimate UAE residence visa costs.', href: '/tools/visa-estimator', icon: Users },
  { title: 'Name Checker', blurb: 'Test a company name against registry rules.', href: '/tools/name-checker', icon: MagnifyingGlass },
  { title: 'QFZP Eligibility', blurb: 'Check eligibility for 0% corporate tax.', href: '/tools/qfzp-eligibility', icon: SealCheck },
];

export default function ToolsIndexPage() {
  return (
    <>
      <BannerHeader
        title="Tools & Calculators"
        subtitle="Proprietary advisory calculators and document generators for global entity structuring."
      />
      <main className={`wrap ${s.main}`}>
        <div className={s.grid}>
          {TOOLS.map((tool) => (
            <Link key={tool.href} href={tool.href} className={`card ${s.tile}`}>
              <span className={s.tileIcon}>
                <tool.icon size={24} weight="duotone" />
              </span>
              <h2 className={s.h3}>{tool.title}</h2>
              <p className={s.muted}>{tool.blurb}</p>
              <span className={s.tileGo}>
                Open <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

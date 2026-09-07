export default function ToolsPage() {
  const tools = [
    { name: 'Tax Calculator', slug: 'tax-calculator', description: 'Calculate your tax obligations across jurisdictions' },
    { name: 'Jurisdiction Quiz', slug: 'jurisdiction-quiz', description: 'Find the best jurisdiction for your business' },
    { name: 'NDA Generator', slug: 'generate-nda', description: 'Generate a non-disclosure agreement' },
    { name: 'UBO Privacy', slug: 'ubo-privacy', description: 'Check UBO privacy options' },
    { name: 'Banking Odds', slug: 'banking-odds', description: 'Check your banking eligibility' },
    { name: 'VAT Scorer', slug: 'vat-scorer', description: 'Score your VAT obligations' },
    { name: 'Compliance Calendar', slug: 'compliance-calendar', description: 'Track compliance deadlines' },
    { name: 'Visa Estimator', slug: 'visa-estimator', description: 'Estimate visa requirements' },
    { name: 'Name Checker', slug: 'name-checker', description: 'Check company name availability' },
    { name: 'QFZP Eligibility', slug: 'qfzp-eligibility', description: 'Check Qualifying Free Zone status' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Business Tools</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <a
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="block p-6 rounded-xl border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">{tool.name}</h2>
            <p className="text-[var(--text-secondary)]">{tool.description}</p>
          </a>
        ))}
      </div>
    </div>
  )
}

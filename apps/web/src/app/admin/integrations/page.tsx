export default function IntegrationsPage() {
  const integrations = [
    { name: 'Amazon SES', description: 'Email sending provider', status: 'configured' },
    { name: 'Meta WhatsApp', description: 'WhatsApp Cloud API', status: 'configured' },
    { name: 'Cloudflare R2', description: 'File storage', status: 'configured' },
    { name: 'Stripe', description: 'Payment processing', status: 'configured' },
    { name: 'PostHog', description: 'Product analytics', status: 'not_configured' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Integrations</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => (
          <div key={integration.name} className="rounded-lg border border-border bg-bg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-text">{integration.name}</h3>
                <p className="text-sm text-text-secondary">{integration.description}</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  integration.status === 'configured'
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/10 text-warning'
                }`}
              >
                {integration.status === 'configured' ? 'Active' : 'Setup Required'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

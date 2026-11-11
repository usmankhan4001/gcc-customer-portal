-- STAGING ONLY. Fake demo catalog so the quote -> order -> checklist flow can be tried end to end.
-- Every price below is a placeholder, not a real GCC price; the real ones are set in /admin/catalog.
-- Safe to re-run: existing rows are left alone. Never run this against production.

INSERT INTO catalog_packages (jurisdiction, key, name, summary, tier, price_cents, currency, timeline_min_days, timeline_max_days, timeline_note, recommended, active, sort) VALUES
  ('hong-kong', 'self_ubo',         'Self as UBO',      '[DEMO] You are the ultimate beneficial owner and a director.', 'tier_1_self',    150000, 'usd', 5, 10, 'Depends on how quickly signed documents come back.', true,  true,  1),
  ('hong-kong', 'nominee_director', 'Nominee Director', '[DEMO] A nominee director is appointed for you.',               'tier_2_nominee', 350000, 'usd', 7, 14, 'Depends on nominee onboarding checks.',                 false, true,  2),
  ('hong-kong', 'hire_ubo',         'Hire a UBO',       '[DEMO] Not priced yet, so it is not offered.',                  'tier_2_nominee', NULL,   'usd', NULL, NULL, NULL,                                                false, false, 3)
ON CONFLICT (jurisdiction, key) DO NOTHING;

INSERT INTO catalog_addons (key, name, summary, price_cents, currency, max_quantity, jurisdictions, package_keys, options, active, sort) VALUES
  ('bank_account', 'Bank account opening', '[DEMO] We prepare and submit the application. Approval is up to the provider.', 50000, 'usd', 3, ARRAY['hong-kong'], NULL, '["Airwallex","Wise","Aspire"]'::jsonb, true, 1),
  ('bookkeeping',  'Yearly bookkeeping, audit and tax returns', '[DEMO] First year, billed once.',                          75000, 'usd', 1, NULL,                NULL, NULL,                                  true, 2)
ON CONFLICT (key) DO NOTHING;

INSERT INTO catalog_document_requirements (jurisdiction, package_key, key, label, help, category, required, active, sort)
SELECT v.* FROM (VALUES
  ('hong-kong', NULL::text, 'passport',         'Passport copy',                   'Colour scan of the photo page, all four corners visible.', 'passport',         true,  true, 1),
  ('hong-kong', NULL::text, 'proof_of_address', 'Proof of address',                'Bank statement or utility bill from the last 3 months.',   'proof_of_address', true,  true, 2),
  ('hong-kong', NULL::text, 'source_of_funds',  'Source of funds note',            'One paragraph on where the starting capital comes from.',   'other',            false, true, 3)
) AS v(jurisdiction, package_key, key, label, help, category, required, active, sort)
WHERE NOT EXISTS (
  SELECT 1 FROM catalog_document_requirements r
  WHERE r.jurisdiction = v.jurisdiction AND r.key = v.key AND r.package_key IS NOT DISTINCT FROM v.package_key
);

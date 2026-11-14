// Copy for the six France-campaign landing pages, French and English.
// Rules (PDF "Compliance and content rules"): no guaranteed bank approval, "0% tax" only with its
// condition, nominee copy says banks still see the beneficial owner, no figures until the pricing and
// timeline decisions are closed. Tax and legal wording here is a DRAFT until Farooq / a French tax
// adviser signs it off; REVIEW_MODE keeps every page noindex and ribboned until then.

export type Locale = 'fr' | 'en';

/** Flip to false only after tax/legal sign-off. While true: noindex, "draft" ribbon on every page. */
export const REVIEW_MODE = true;

export interface Section {
  title: string;
  body?: string;
  bullets?: string[];
}

export interface PageCopy {
  /** The exact line used in the ad creative, shown under the headline so the promise carries over. */
  adLine: string;
  h1: string;
  lede: string;
  cta: string;
  sections: Section[];
}

export interface LandingPage {
  slug: string;
  num: string;
  fr: PageCopy;
  en: PageCopy;
}

export const PAGES: LandingPage[] = [
  {
    slug: 'fiscalite-hong-kong',
    num: '01',
    fr: {
      adLine: 'Hong Kong : 0 % d’impôt ? Pas automatiquement. Tout dépend de vos activités et de votre résidence fiscale.',
      h1: 'Hong Kong : quels avantages fiscaux pour votre situation ?',
      lede: 'Une société à Hong Kong n’est pas exonérée d’impôt par principe. Voici comment lire la règle, et ce qui change si vous êtes résident fiscal français.',
      cta: 'Comprendre ma situation',
      sections: [
        {
          title: 'Une fiscalité territoriale',
          body: 'Hong Kong impose les bénéfices qui proviennent de Hong Kong. Les bénéfices d’origine étrangère peuvent, dans certains cas et sur demande, ne pas être imposés. Cette exonération n’est pas automatique : elle dépend de l’endroit où l’activité est réellement exercée et des preuves que vous pouvez fournir.',
        },
        {
          title: 'Si vous êtes résident fiscal français',
          bullets: [
            'En principe, un résident fiscal français est imposé en France sur l’ensemble de ses revenus.',
            'Les bénéfices d’une société étrangère que vous contrôlez peuvent, sous conditions, être rattachés à votre imposition en France.',
            'Une société dont la direction effective se trouve en France peut y être imposée, même si elle est immatriculée à Hong Kong.',
            'Ces règles dépendent de votre situation personnelle : faites-la valider par un conseil fiscal.',
          ],
        },
        {
          title: 'Exemples de situations',
          bullets: [
            'Vous vivez déjà hors de France et vos clients sont internationaux : la structure peut avoir du sens, à analyser au cas par cas.',
            'Vous préparez un départ de France dans les 12 mois : la date et la réalité de votre départ comptent autant que la société.',
            'Vous restez en France et cherchez à réduire votre impôt : une société à Hong Kong ne fait généralement pas disparaître l’imposition en France.',
          ],
        },
        {
          title: 'Idées reçues',
          bullets: [
            '« Hong Kong, c’est 0 % d’impôt. » En général non : seuls certains bénéfices d’origine étrangère peuvent être exonérés.',
            '« Une adresse à Hong Kong suffit. » Non : l’activité et la direction doivent être réelles.',
            '« Une société offshore est invisible. » Non : les banques, prestataires et autorités identifient le bénéficiaire effectif.',
          ],
        },
        {
          title: 'Parlons de votre situation',
          body: 'Répondez à quelques questions : nous vous disons si Hong Kong peut avoir du sens pour vous, y compris lorsque la réponse est non.',
        },
      ],
    },
    en: {
      adLine: 'Hong Kong: 0% tax? Not automatically. Your operations and tax residency matter.',
      h1: 'Hong Kong: which tax advantages apply to your situation?',
      lede: 'A Hong Kong company is not tax-exempt by default. Here is how the rule works, and what changes if you are a French tax resident.',
      cta: 'Understand my situation',
      sections: [
        {
          title: 'Territorial taxation',
          body: 'Hong Kong taxes profits that arise in or derive from Hong Kong. Offshore-source profits can in some cases, and on application, be left untaxed. That is not automatic: it depends on where the business is genuinely carried on and the evidence you can provide.',
        },
        {
          title: 'If you are a French tax resident',
          bullets: [
            'As a rule, a French tax resident is taxed in France on worldwide income.',
            'Profits of a foreign company you control can, under conditions, be attributed to your French taxation.',
            'A company whose effective management is in France can be taxed there even if it is registered in Hong Kong.',
            'These rules depend on your personal situation: have it checked by a tax adviser.',
          ],
        },
        {
          title: 'Example situations',
          bullets: [
            'You already live outside France and serve international clients: a structure can make sense, case by case.',
            'You are planning to leave France within 12 months: the date and reality of your move matter as much as the company.',
            'You are staying in France and want to cut your tax: a Hong Kong company generally does not remove French taxation.',
          ],
        },
        {
          title: 'Common misconceptions',
          bullets: [
            '“Hong Kong means 0% tax.” Generally not: only some offshore-source profits can be exempt.',
            '“A Hong Kong address is enough.” No: the business and its management must be real.',
            '“An offshore company is invisible.” No: banks, providers and authorities identify the beneficial owner.',
          ],
        },
        {
          title: 'Let’s talk about your situation',
          body: 'Answer a few questions and we will tell you whether Hong Kong can make sense for you, including when the answer is no.',
        },
      ],
    },
  },
  {
    slug: 'creation-societe-hong-kong',
    num: '02',
    fr: {
      adLine: 'Créez votre société à Hong Kong, à distance. Un accompagnement de la création aux formalités.',
      h1: 'Créer une société à Hong Kong sans vous déplacer',
      lede: 'Nous préparons le dossier avec vous, de la collecte des documents jusqu’à la remise de la société. Les montants et délais exacts figurent dans votre devis.',
      cta: 'Obtenir mon devis',
      sections: [
        {
          title: 'Qui peut en bénéficier',
          bullets: [
            'Entrepreneurs, indépendants et dirigeants, qu’ils résident en France ou à l’étranger.',
            'Une activité réelle, licite et clairement décrite.',
            'Certaines activités ne sont pas acceptées : jeux d’argent, contenus pour adultes, fraude, contournement de sanctions, armes ou produits illicites, stupéfiants.',
          ],
        },
        {
          title: 'Documents à prévoir',
          bullets: [
            'Passeport en cours de validité.',
            'Justificatif de domicile récent.',
            'Description de l’activité et origine des fonds.',
            'Selon l’offre, d’autres pièces sont demandées dans votre espace client.',
          ],
        },
        {
          title: 'Les étapes',
          bullets: [
            '1. Devis et choix de l’offre.',
            '2. Création de votre espace client et paiement.',
            '3. Dépôt des documents et vérification d’identité.',
            '4. Préparation et dépôt du dossier de constitution.',
            '5. Remise des documents de la société.',
          ],
        },
        {
          title: 'Compte bancaire',
          body: 'L’ouverture d’un compte est une démarche distincte. Nous préparons un dossier complet et exact ; la décision appartient à la banque ou au prestataire, et nous ne pouvons pas la garantir.',
        },
        {
          title: 'Obligations après la création',
          body: 'Une société à Hong Kong a des obligations continues : registre, déclarations annuelles, comptabilité et, selon le cas, audit et déclaration fiscale. Elles sont détaillées dans votre devis.',
        },
        {
          title: 'Votre devis',
          body: 'Décrivez votre situation : vous recevez une proposition claire, avec ce qui est inclus et ce qui ne l’est pas.',
        },
      ],
    },
    en: {
      adLine: 'Form your Hong Kong company remotely. Guided incorporation and documentation.',
      h1: 'Form a Hong Kong company without travelling',
      lede: 'We prepare the file with you, from collecting documents to handing over the company. Exact amounts and timelines are in your quote.',
      cta: 'Request my quote',
      sections: [
        {
          title: 'Who qualifies',
          bullets: [
            'Entrepreneurs, freelancers and directors, whether resident in France or abroad.',
            'A genuine, lawful and clearly described business.',
            'Some activities are not accepted: gambling, adult content, fraud, sanctions evasion, weapons or illegal goods, drugs.',
          ],
        },
        {
          title: 'Documents to prepare',
          bullets: [
            'A valid passport.',
            'A recent proof of address.',
            'A description of the business and the source of funds.',
            'Depending on the package, more documents are requested in your client area.',
          ],
        },
        {
          title: 'The steps',
          bullets: [
            '1. Quote and choice of package.',
            '2. Create your client account and pay.',
            '3. Upload documents and complete identity verification.',
            '4. We prepare and file the incorporation.',
            '5. You receive the company documents.',
          ],
        },
        {
          title: 'Banking',
          body: 'Opening an account is a separate step. We prepare a complete and accurate application; the decision belongs to the bank or provider, and we cannot guarantee it.',
        },
        {
          title: 'Obligations after incorporation',
          body: 'A Hong Kong company has ongoing obligations: registers, annual filings, bookkeeping and, depending on the case, audit and tax return. They are detailed in your quote.',
        },
        {
          title: 'Your quote',
          body: 'Describe your situation and you will receive a clear proposal showing what is included and what is not.',
        },
      ],
    },
  },
  {
    slug: 'freelance-international',
    num: '03',
    fr: {
      adLine: 'Freelance ou agence internationale ? Choisissez une structure adaptée à votre activité réelle.',
      h1: 'Une société internationale adaptée à votre activité',
      lede: 'Pour les freelances et les agences : la structure doit refléter où et comment vous travaillez réellement.',
      cta: 'Évaluer mon projet',
      sections: [
        {
          title: 'Modèles d’activité',
          bullets: [
            'Prestations de services en ligne : conseil, design, développement, marketing.',
            'Agence travaillant avec des sous-traitants à l’étranger.',
            'Produits numériques et logiciels.',
            'Chaque modèle n’appelle pas la même structure, et certains n’en justifient aucune.',
          ],
        },
        {
          title: 'Lieu de direction',
          body: 'L’endroit où vous prenez réellement les décisions et dirigez la société compte pour son imposition. Si vous la dirigez depuis la France, elle peut y être imposée, quel que soit son lieu d’immatriculation.',
        },
        {
          title: 'Facturation',
          body: 'Une société permet de facturer vos clients internationaux depuis une entité distincte, avec ses contrats et son compte bancaire. La TVA et les mentions obligatoires dépendent du pays de vos clients.',
        },
        {
          title: 'Obligations fiscales',
          body: 'La société et son dirigeant ont chacun des obligations, dans chaque pays concerné. Nous présentons celles de la société ; votre situation personnelle doit être validée par un conseil fiscal.',
        },
        {
          title: 'Mise en place',
          body: 'Si la structure convient, nous la montons à distance : dossier, vérifications, création, puis compte bancaire en démarche séparée.',
        },
      ],
    },
    en: {
      adLine: 'Freelancer or international agency? Find a structure that fits your actual business.',
      h1: 'An international company that fits your business',
      lede: 'For freelancers and agencies: the structure should reflect where and how you actually work.',
      cta: 'Assess my project',
      sections: [
        {
          title: 'Business models',
          bullets: [
            'Online services: consulting, design, development, marketing.',
            'An agency working with contractors abroad.',
            'Digital products and software.',
            'Each model calls for a different structure, and some justify none at all.',
          ],
        },
        {
          title: 'Place of management',
          body: 'Where you actually take decisions and run the company matters for how it is taxed. If you run it from France, it can be taxed there, wherever it is registered.',
        },
        {
          title: 'Invoicing',
          body: 'A company lets you invoice international clients from a separate entity, with its own contracts and bank account. VAT and mandatory invoice details depend on your clients’ countries.',
        },
        {
          title: 'Tax obligations',
          body: 'The company and its director each have obligations in every country involved. We set out the company’s; your personal situation should be checked by a tax adviser.',
        },
        {
          title: 'Setting up',
          body: 'If the structure fits, we set it up remotely: file, checks, incorporation, then a bank account as a separate step.',
        },
      ],
    },
  },
  {
    slug: 'import-export-asie',
    num: '04',
    fr: {
      adLine: 'Vous importez depuis l’Asie ? Structurez vos opérations commerciales.',
      h1: 'Structurez vos activités d’import-export en Asie',
      lede: 'Hong Kong est une plateforme de négoce courante pour acheter et revendre depuis l’Asie, à condition que l’activité soit réelle.',
      cta: 'Étudier mon activité',
      sections: [
        {
          title: 'Opérations de négoce',
          bullets: [
            'Achat auprès de fournisseurs en Asie et revente à vos clients.',
            'Contrats, facturation et paiements au nom de la société.',
            'Les flux de marchandises et d’argent doivent correspondre à la réalité.',
          ],
        },
        {
          title: 'Une société à Hong Kong',
          body: 'Elle peut servir d’entité d’achat et de facturation. L’impôt applicable dépend de l’origine des bénéfices et de l’endroit où l’activité est exercée ; la situation de l’exploitant en France doit aussi être examinée.',
        },
        {
          title: 'Banque',
          body: 'Les banques demandent le détail de vos fournisseurs, clients et volumes. Nous préparons un dossier complet ; la banque décide.',
        },
        {
          title: 'Documents',
          bullets: [
            'Contrats ou bons de commande.',
            'Factures de fournisseurs.',
            'Description de la chaîne d’approvisionnement.',
            'Pièce d’identité et justificatif de domicile.',
          ],
        },
        {
          title: 'Conformité',
          body: 'Douane, TVA à l’import, sanctions et marchandises réglementées : ces points se vérifient avant de commencer.',
        },
      ],
    },
    en: {
      adLine: 'Importing from Asia? Structure your international trading operations.',
      h1: 'Structure your Asia import-export business',
      lede: 'Hong Kong is a common trading base for buying from and selling out of Asia, provided the business is real.',
      cta: 'Review my business',
      sections: [
        {
          title: 'Trading operations',
          bullets: [
            'Buying from suppliers in Asia and reselling to your customers.',
            'Contracts, invoicing and payments in the company’s name.',
            'Goods and money flows must match reality.',
          ],
        },
        {
          title: 'A Hong Kong company',
          body: 'It can act as the buying and invoicing entity. The tax that applies depends on where profits arise and where the business is carried on; the owner’s situation in France also has to be examined.',
        },
        {
          title: 'Banking',
          body: 'Banks ask for details of your suppliers, customers and volumes. We prepare a complete application; the bank decides.',
        },
        {
          title: 'Documents',
          bullets: [
            'Contracts or purchase orders.',
            'Supplier invoices.',
            'A description of the supply chain.',
            'Identity document and proof of address.',
          ],
        },
        {
          title: 'Compliance',
          body: 'Customs, import VAT, sanctions and regulated goods: these are checked before you start.',
        },
      ],
    },
  },
  {
    slug: 'compte-bancaire-hong-kong',
    num: '05',
    fr: {
      adLine: 'Et le compte professionnel ? Nous préparons votre dossier. La banque décide.',
      h1: 'Préparez votre ouverture de compte professionnel',
      lede: 'Un dossier complet et exact évite des allers-retours. Il ne garantit pas l’approbation : elle appartient à la banque ou au prestataire.',
      cta: 'Préparer mon dossier',
      sections: [
        {
          title: 'Ce que demandent les banques',
          bullets: [
            'L’identité des dirigeants et du bénéficiaire effectif, toujours déclarés exactement.',
            'L’activité, les clients et les fournisseurs.',
            'L’origine des fonds.',
            'Les volumes de transactions prévus.',
          ],
        },
        {
          title: 'Liste de contrôle KYC',
          bullets: [
            'Passeport.',
            'Justificatif de domicile récent.',
            'Statuts et certificat de la société.',
            'Description de l’activité.',
            'Note sur l’origine des fonds.',
          ],
        },
        {
          title: 'Prestataires',
          body: 'Selon votre profil, nous orientons vers des banques ou des prestataires de paiement, par exemple Airwallex, Wise ou Aspire. Chacun a ses propres critères et ses frais.',
        },
        {
          title: 'Déroulement',
          bullets: [
            'Nous préparons le dossier avec vous.',
            'Nous le transmettons au prestataire.',
            'Il peut poser des questions complémentaires.',
            'Il rend sa décision.',
          ],
        },
        {
          title: 'Frais',
          body: 'Nos frais de préparation et ceux du prestataire sont distincts. Ils vous sont indiqués avant que vous ne vous engagiez.',
        },
      ],
    },
    en: {
      adLine: 'What about business banking? We prepare your application. The bank decides.',
      h1: 'Prepare your business account application',
      lede: 'A complete and accurate file avoids back-and-forth. It does not guarantee approval: that belongs to the bank or provider.',
      cta: 'Prepare my application',
      sections: [
        {
          title: 'What banks ask for',
          bullets: [
            'The identity of directors and the beneficial owner, always declared accurately.',
            'The business, its customers and suppliers.',
            'The source of funds.',
            'Expected transaction volumes.',
          ],
        },
        {
          title: 'KYC checklist',
          bullets: [
            'Passport.',
            'Recent proof of address.',
            'Company articles and certificate.',
            'A description of the business.',
            'A note on the source of funds.',
          ],
        },
        {
          title: 'Providers',
          body: 'Depending on your profile, we point you to banks or payment providers, for example Airwallex, Wise or Aspire. Each has its own criteria and fees.',
        },
        {
          title: 'How it works',
          bullets: [
            'We prepare the file with you.',
            'We submit it to the provider.',
            'The provider may ask follow-up questions.',
            'The provider makes its decision.',
          ],
        },
        {
          title: 'Fees',
          body: 'Our preparation fee and the provider’s fees are separate. You are shown them before you commit.',
        },
      ],
    },
  },
  {
    slug: 'tarifs-hong-kong',
    num: '06',
    fr: {
      adLine: 'Combien coûte une société à Hong Kong ? Comparez les prestations et les frais récurrents.',
      h1: 'Combien coûte réellement une société à Hong Kong ?',
      lede: 'Le prix de création n’est qu’une partie du coût. Voici les postes à comparer avant de choisir. Les montants exacts figurent dans votre devis.',
      cta: 'Comparer les offres',
      sections: [
        {
          title: 'Frais de création',
          body: 'Honoraires de constitution, frais de registre et, selon l’offre, service de directeur nominee. Un nominee protège votre nom sur le registre public ; les banques et les autorités voient toujours le bénéficiaire effectif. Vérifiez ce qui est inclus.',
        },
        {
          title: 'Frais bancaires',
          body: 'L’ouverture de compte est une prestation distincte, et le prestataire facture ses propres frais.',
        },
        {
          title: 'Services optionnels',
          bullets: [
            'Ouverture de compte bancaire.',
            'Comptabilité, audit et déclaration annuelle.',
            'Services de nominee.',
            'Adresse et secrétariat.',
          ],
        },
        {
          title: 'Coûts annuels',
          body: 'Renouvellement du registre, secrétaire et adresse, comptabilité et audit, déclaration fiscale : ces coûts reviennent chaque année et pèsent souvent plus que le prix de création.',
        },
        {
          title: 'Comparer',
          body: 'Comparez le coût total sur trois ans, pas le prix d’appel. Demandez à chaque prestataire ce qui est inclus, ce qui est facturé en plus et comment le renouvellement est tarifé.',
        },
        {
          title: 'Votre devis',
          body: 'Décrivez votre projet : nous vous répondons avec un devis détaillé.',
        },
      ],
    },
    en: {
      adLine: 'What does Hong Kong incorporation cost? Compare setup services and ongoing fees.',
      h1: 'What does a Hong Kong company really cost?',
      lede: 'The setup price is only part of the cost. Here are the items to compare before you choose. Exact amounts are in your quote.',
      cta: 'Compare packages',
      sections: [
        {
          title: 'Formation fees',
          body: 'Incorporation fees, registry fees and, depending on the package, a nominee director service. A nominee protects your name on the public registry; banks and authorities still see the beneficial owner. Check what is included.',
        },
        {
          title: 'Banking fees',
          body: 'Opening an account is a separate service, and the provider charges its own fees.',
        },
        {
          title: 'Optional services',
          bullets: [
            'Bank account opening.',
            'Bookkeeping, audit and annual return.',
            'Nominee services.',
            'Address and secretarial.',
          ],
        },
        {
          title: 'Annual costs',
          body: 'Registry renewal, company secretary and address, bookkeeping and audit, tax return: these recur every year and often weigh more than the setup price.',
        },
        {
          title: 'Comparing',
          body: 'Compare the total cost over three years, not the headline price. Ask each provider what is included, what is charged extra and how renewal is priced.',
        },
        {
          title: 'Your quote',
          body: 'Describe your project and we reply with a detailed quote.',
        },
      ],
    },
  },
];

export function findPage(slug: string): LandingPage | undefined {
  return PAGES.find((p) => p.slug === slug);
}

export function pagePath(slug: string, locale: Locale): string {
  return locale === 'fr' ? `/france/${slug}` : `/france/en/${slug}`;
}

// ---- Qualification form: same fields on every page, localised --------------------------------

export const RESIDENCY = ['already_abroad', 'moving_12m', 'staying_france'] as const;
export const ACTIVITY = ['freelance_services', 'agency', 'ecommerce_import', 'software', 'other'] as const;
export const JURISDICTION = ['hong-kong', 'uae', 'undecided'] as const;
export const TIMELINE = ['asap', '1_3_months', '3_6_months', 'exploring'] as const;

export interface UiStrings {
  brandTag: string;
  switchLabel: string;
  ribbon: string;
  formTitle: string;
  formLead: string;
  residencyQ: string;
  residency: Record<(typeof RESIDENCY)[number], string>;
  activityQ: string;
  activity: Record<(typeof ACTIVITY)[number], string>;
  jurisdictionQ: string;
  jurisdiction: Record<(typeof JURISDICTION)[number], string>;
  timelineQ: string;
  timeline: Record<(typeof TIMELINE)[number], string>;
  email: string;
  whatsapp: string;
  optional: string;
  restricted: string;
  consentContact: string;
  consentMarketing: string;
  sending: string;
  errorFields: string;
  errorGeneric: string;
  okTitle: string;
  okBody: string;
  stayTitle: string;
  stayBody: string;
  disclaimer: string;
  trust: string;
}

export const UI: Record<Locale, UiStrings> = {
  fr: {
    brandTag: 'Création de sociétés internationales',
    switchLabel: 'English',
    ribbon: 'BROUILLON : contenu en attente de validation fiscale et juridique. Page non indexée.',
    formTitle: 'Quelques questions pour vous orienter',
    formLead: 'Vos réponses nous permettent de vous dire honnêtement si la structure a du sens pour vous.',
    residencyQ: 'Où résidez-vous fiscalement ?',
    residency: {
      already_abroad: 'Déjà à l’étranger',
      moving_12m: 'Je m’installe à l’étranger (dans les 12 mois)',
      staying_france: 'Je reste en France',
    },
    activityQ: 'Votre activité',
    activity: {
      freelance_services: 'Freelance / prestations de services',
      agency: 'Agence',
      ecommerce_import: 'E-commerce / import-export',
      software: 'Logiciel / produits numériques',
      other: 'Autre',
    },
    jurisdictionQ: 'Juridiction envisagée',
    jurisdiction: { 'hong-kong': 'Hong Kong', uae: 'Émirats arabes unis', undecided: 'Je ne sais pas encore' },
    timelineQ: 'Quand souhaitez-vous démarrer ?',
    timeline: {
      asap: 'Dès que possible',
      '1_3_months': 'Dans 1 à 3 mois',
      '3_6_months': 'Dans 3 à 6 mois',
      exploring: 'Je me renseigne',
    },
    email: 'E-mail',
    whatsapp: 'Numéro WhatsApp',
    optional: '(facultatif)',
    restricted:
      'Nous n’acceptons pas les activités suivantes : jeux d’argent, contenus pour adultes, fraude ou blanchiment, contournement de sanctions, armes ou produits illicites, stupéfiants.',
    consentContact: 'J’accepte d’être contacté(e) par e-mail ou WhatsApp au sujet de ma demande.',
    consentMarketing:
      'J’accepte de recevoir des informations et offres de GCC Startup par e-mail ou WhatsApp. Je peux me désinscrire à tout moment.',
    sending: 'Envoi…',
    errorFields: 'Vérifiez les champs signalés.',
    errorGeneric: 'Une erreur est survenue. Veuillez réessayer.',
    okTitle: 'Merci, votre demande est enregistrée.',
    okBody: 'Nous vous répondons par e-mail ou WhatsApp.',
    stayTitle: 'Merci, votre demande est enregistrée.',
    stayBody:
      'Si vous restez résident fiscal français, une société à l’étranger ne réduit généralement pas votre imposition en France. Nous vous enverrons une explication détaillée par e-mail, sans appel commercial.',
    disclaimer:
      'Informations générales, ne constituant ni un conseil fiscal, ni un conseil juridique, ni un conseil en investissement. Les règles fiscales dépendent de votre situation personnelle, notamment de votre résidence fiscale. Aucune approbation bancaire n’est garantie.',
    trust: 'Le bénéficiaire effectif est toujours déclaré exactement. Aucune approbation bancaire n’est garantie.',
  },
  en: {
    brandTag: 'International company formation',
    switchLabel: 'Français',
    ribbon: 'DRAFT: content awaiting tax and legal review. Page is not indexed.',
    formTitle: 'A few questions to point you the right way',
    formLead: 'Your answers let us tell you honestly whether the structure makes sense for you.',
    residencyQ: 'Where are you tax resident?',
    residency: {
      already_abroad: 'Already outside France',
      moving_12m: 'I am moving abroad (within 12 months)',
      staying_france: 'I am staying in France',
    },
    activityQ: 'Your business',
    activity: {
      freelance_services: 'Freelance / services',
      agency: 'Agency',
      ecommerce_import: 'E-commerce / import-export',
      software: 'Software / digital products',
      other: 'Other',
    },
    jurisdictionQ: 'Jurisdiction you are considering',
    jurisdiction: { 'hong-kong': 'Hong Kong', uae: 'United Arab Emirates', undecided: 'Not sure yet' },
    timelineQ: 'When do you want to start?',
    timeline: {
      asap: 'As soon as possible',
      '1_3_months': 'In 1 to 3 months',
      '3_6_months': 'In 3 to 6 months',
      exploring: 'Just exploring',
    },
    email: 'Email',
    whatsapp: 'WhatsApp number',
    optional: '(optional)',
    restricted:
      'We do not accept these activities: gambling, adult content, fraud or money laundering, sanctions evasion, weapons or illegal goods, drugs.',
    consentContact: 'I agree to be contacted by email or WhatsApp about my request.',
    consentMarketing:
      'I agree to receive information and offers from GCC Startup by email or WhatsApp. I can unsubscribe at any time.',
    sending: 'Sending…',
    errorFields: 'Please check the highlighted fields.',
    errorGeneric: 'Something went wrong. Please try again.',
    okTitle: 'Thank you, your request is recorded.',
    okBody: 'We will reply by email or WhatsApp.',
    stayTitle: 'Thank you, your request is recorded.',
    stayBody:
      'If you remain a French tax resident, a company abroad generally does not reduce your French taxation. We will email you a detailed explanation, with no sales call.',
    disclaimer:
      'General information only, not tax, legal or investment advice. Tax rules depend on your personal situation, in particular your tax residency. No bank approval is guaranteed.',
    trust: 'The beneficial owner is always declared accurately. No bank approval is guaranteed.',
  },
};

import type { Config } from '@puckeditor/core'
import { Hero, type HeroProps } from './blocks/Hero'
import { Ticker, type TickerProps } from './blocks/Ticker'
import { Faq, type FaqProps } from './blocks/Faq'
import { GlobalCta, type GlobalCtaProps } from './blocks/GlobalCta'
import { LeadForm, type LeadFormProps } from './blocks/LeadForm'
import { HtmlEmbed, type HtmlEmbedProps } from './blocks/HtmlEmbed'
import { ServicesGrid, type ServicesGridProps } from './blocks/ServicesGrid'
import { JurisdictionsGrid, type JurisdictionsGridProps } from './blocks/JurisdictionsGrid'
import { ProcessSteps, type ProcessStepsProps } from './blocks/ProcessSteps'
import { Testimonials, type TestimonialsProps } from './blocks/Testimonials'
import { PricingCards, type PricingCardsProps } from './blocks/PricingCards'
import { InteractiveTools, type InteractiveToolsProps } from './blocks/InteractiveTools'
import { ComparisonTool, type ComparisonToolProps } from './blocks/ComparisonTool'
import { JurisdictionQuiz, type JurisdictionQuizProps } from './blocks/JurisdictionQuiz'
import { LeadMagnets, type LeadMagnetsProps } from './blocks/LeadMagnets'
import { BenefitGrid, type BenefitGridProps } from './blocks/BenefitGrid'
import { RequirementsList, type RequirementsListProps } from './blocks/RequirementsList'
import { TaxGuideCta, type TaxGuideCtaProps } from './blocks/TaxGuideCta'
import { WhatsAppSpecialistCta, type WhatsAppSpecialistCtaProps } from './blocks/WhatsAppSpecialistCta'
import { MeetingBookingCta, type MeetingBookingCtaProps } from './blocks/MeetingBookingCta'
import { PromoBanner, type PromoBannerProps } from './blocks/PromoBanner'
import { Subhero, type SubheroProps } from './blocks/Subhero'
import { PricingDetail, type PricingDetailProps } from './blocks/PricingDetail'
import { StatsCounter, type StatsCounterProps } from './blocks/StatsCounter'
import { RichText, type RichTextProps } from './blocks/RichText'
import { Columns, type ColumnsProps } from './blocks/Columns'
import { ImageBlock, type ImageBlockProps } from './blocks/ImageBlock'
import { Accordion, type AccordionProps } from './blocks/Accordion'
import { ButtonBlock, type ButtonBlockProps } from './blocks/ButtonBlock'
import { LogoCloud, type LogoCloudProps } from './blocks/LogoCloud'
import { TeamGrid, type TeamGridProps } from './blocks/TeamGrid'
import { SingleTestimonial, type SingleTestimonialProps } from './blocks/SingleTestimonial'
import { AuthorBio, type AuthorBioProps } from './blocks/AuthorBio'
import { TableOfContents, type TableOfContentsProps } from './blocks/TableOfContents'
import { RelatedPosts, type RelatedPostsProps } from './blocks/RelatedPosts'
import { SocialShare, type SocialShareProps } from './blocks/SocialShare'
import { GlobalStructureFitAssessment, type GlobalStructureFitAssessmentProps } from './blocks/leadMagnets/GlobalStructureFitAssessment'
import { TaxLeakageCalculator, type TaxLeakageCalculatorProps } from './blocks/leadMagnets/TaxLeakageCalculator'
import { JurisdictionMatchmaker, type JurisdictionMatchmakerProps } from './blocks/leadMagnets/JurisdictionMatchmaker'
import { EcommerceMarginCalculator, type EcommerceMarginCalculatorProps } from './blocks/leadMagnets/EcommerceMarginCalculator'
import { SaasRunwayCalculator, type SaasRunwayCalculatorProps } from './blocks/leadMagnets/SaasRunwayCalculator'
import { AskAnAdvisorMiniAudit, type AskAnAdvisorMiniAuditProps } from './blocks/leadMagnets/AskAnAdvisorMiniAudit'
import { NomineeUboDecisionTool, type NomineeUboDecisionToolProps } from './blocks/leadMagnets/NomineeUboDecisionTool'
import { PaymentGatewayChecker, type PaymentGatewayCheckerProps } from './blocks/leadMagnets/PaymentGatewayChecker'
import { FreelancerReadinessScore, type FreelancerReadinessScoreProps } from './blocks/leadMagnets/FreelancerReadinessScore'
import { AgencyBillingAudit, type AgencyBillingAuditProps } from './blocks/leadMagnets/AgencyBillingAudit'
import { ResidencyRoutePlanner, type ResidencyRoutePlannerProps } from './blocks/leadMagnets/ResidencyRoutePlanner'
import { CountryTaxPressureScorecard, type CountryTaxPressureScorecardProps } from './blocks/leadMagnets/CountryTaxPressureScorecard'
import { HongKongSetupSimulator, type HongKongSetupSimulatorProps } from './blocks/leadMagnets/HongKongSetupSimulator'
import { ShelfCompanySpeedTest, type ShelfCompanySpeedTestProps } from './blocks/leadMagnets/ShelfCompanySpeedTest'
import { KycReadinessChecker, type KycReadinessCheckerProps } from './blocks/leadMagnets/KycReadinessChecker'
import { StatBandBlock, type StatBandBlockProps } from './blocks/StatBandBlock'
import { EditorialBreakBlock, type EditorialBreakBlockProps } from './blocks/EditorialBreakBlock'
import { BentoGridBlock, type BentoGridBlockProps } from './blocks/BentoGridBlock'
import { QuotePhotoCardBlock, type QuotePhotoCardBlockProps } from './blocks/QuotePhotoCardBlock'

export type Props = {
  Hero: HeroProps
  Ticker: TickerProps
  Faq: FaqProps
  GlobalCta: GlobalCtaProps
  LeadForm: LeadFormProps
  HtmlEmbed: HtmlEmbedProps
  ServicesGrid: ServicesGridProps
  JurisdictionsGrid: JurisdictionsGridProps
  ProcessSteps: ProcessStepsProps
  Testimonials: TestimonialsProps
  PricingCards: PricingCardsProps
  InteractiveTools: InteractiveToolsProps
  ComparisonTool: ComparisonToolProps
  JurisdictionQuiz: JurisdictionQuizProps
  LeadMagnets: LeadMagnetsProps
  Subhero: SubheroProps
  BenefitGrid: BenefitGridProps
  PricingDetail: PricingDetailProps
  RequirementsList: RequirementsListProps
  StatsCounter: StatsCounterProps
  TaxGuideCta: TaxGuideCtaProps
  WhatsAppSpecialistCta: WhatsAppSpecialistCtaProps
  MeetingBookingCta: MeetingBookingCtaProps
  PromoBanner: PromoBannerProps
  RichText: RichTextProps
  Columns: ColumnsProps
  ImageBlock: ImageBlockProps
  Accordion: AccordionProps
  ButtonBlock: ButtonBlockProps
  LogoCloud: LogoCloudProps
  TeamGrid: TeamGridProps
  SingleTestimonial: SingleTestimonialProps
  AuthorBio: AuthorBioProps
  TableOfContents: TableOfContentsProps
  RelatedPosts: RelatedPostsProps
  SocialShare: SocialShareProps
  GlobalStructureFitAssessment: GlobalStructureFitAssessmentProps
  TaxLeakageCalculator: TaxLeakageCalculatorProps
  JurisdictionMatchmaker: JurisdictionMatchmakerProps
  EcommerceMarginCalculator: EcommerceMarginCalculatorProps
  SaasRunwayCalculator: SaasRunwayCalculatorProps
  AskAnAdvisorMiniAudit: AskAnAdvisorMiniAuditProps
  NomineeUboDecisionTool: NomineeUboDecisionToolProps
  PaymentGatewayChecker: PaymentGatewayCheckerProps
  FreelancerReadinessScore: FreelancerReadinessScoreProps
  AgencyBillingAudit: AgencyBillingAuditProps
  ResidencyRoutePlanner: ResidencyRoutePlannerProps
  CountryTaxPressureScorecard: CountryTaxPressureScorecardProps
  HongKongSetupSimulator: HongKongSetupSimulatorProps
  ShelfCompanySpeedTest: ShelfCompanySpeedTestProps
  KycReadinessChecker: KycReadinessCheckerProps
  StatBandBlock: StatBandBlockProps
  EditorialBreakBlock: EditorialBreakBlockProps
  BentoGridBlock: BentoGridBlockProps
  QuotePhotoCardBlock: QuotePhotoCardBlockProps
}

const RAW_COMPONENTS = {
  Hero,
  Ticker,
  Faq,
  GlobalCta,
  LeadForm,
  HtmlEmbed,
  ServicesGrid,
  JurisdictionsGrid,
  ProcessSteps,
  Testimonials,
  PricingCards,
  InteractiveTools,
  ComparisonTool,
  JurisdictionQuiz,
  Subhero,
  BenefitGrid,
  PricingDetail,
  RequirementsList,
  StatsCounter,
  LeadMagnets,
  TaxGuideCta,
  WhatsAppSpecialistCta,
  MeetingBookingCta,
  PromoBanner,
  RichText,
  Columns,
  ImageBlock,
  Accordion,
  ButtonBlock,
  LogoCloud,
  TeamGrid,
  SingleTestimonial,
  AuthorBio,
  TableOfContents,
  RelatedPosts,
  SocialShare,
  GlobalStructureFitAssessment,
  TaxLeakageCalculator,
  JurisdictionMatchmaker,
  EcommerceMarginCalculator,
  SaasRunwayCalculator,
  AskAnAdvisorMiniAudit,
  NomineeUboDecisionTool,
  PaymentGatewayChecker,
  FreelancerReadinessScore,
  AgencyBillingAudit,
  ResidencyRoutePlanner,
  CountryTaxPressureScorecard,
  HongKongSetupSimulator,
  ShelfCompanySpeedTest,
  KycReadinessChecker,
  StatBandBlock,
  EditorialBreakBlock,
  BentoGridBlock,
  QuotePhotoCardBlock,
}

const LABELS: Record<keyof Props, string> = {
  Hero: 'Hero Banner',
  Ticker: 'Scrolling Ticker',
  Faq: 'FAQ Accordion',
  GlobalCta: 'Global CTA Band',
  LeadForm: 'Lead Form',
  HtmlEmbed: 'HTML Embed',
  ServicesGrid: 'Services Grid',
  JurisdictionsGrid: 'Jurisdictions Grid',
  ProcessSteps: 'Process Steps',
  Testimonials: 'Testimonials Grid',
  PricingCards: 'Pricing Cards',
  InteractiveTools: 'Cost Estimator',
  ComparisonTool: 'Jurisdiction Comparison Table',
  JurisdictionQuiz: 'Jurisdiction Quiz',
  LeadMagnets: 'Lead Magnet Links',
  Subhero: 'Secondary Hero',
  BenefitGrid: 'Benefit Showcase',
  PricingDetail: 'Single Pricing Detail',
  RequirementsList: 'Requirements Checklist',
  StatsCounter: 'Animated Stats Counter',
  TaxGuideCta: 'Tax Guide Download CTA',
  WhatsAppSpecialistCta: 'WhatsApp Specialist CTA',
  MeetingBookingCta: 'Book a Call CTA',
  PromoBanner: 'Promo Banner',
  RichText: 'Rich Text',
  Columns: 'Columns Layout',
  ImageBlock: 'Image',
  Accordion: 'Accordion',
  ButtonBlock: 'Button',
  LogoCloud: 'Logo Cloud',
  TeamGrid: 'Team Grid',
  SingleTestimonial: 'Featured Testimonial',
  AuthorBio: 'Author Bio',
  TableOfContents: 'Table of Contents',
  RelatedPosts: 'Related Posts',
  SocialShare: 'Social Share Buttons',
  GlobalStructureFitAssessment: 'Global Structure Fit Assessment',
  TaxLeakageCalculator: 'Tax Leakage Calculator',
  JurisdictionMatchmaker: 'Jurisdiction Matchmaker',
  EcommerceMarginCalculator: 'E-commerce Margin Calculator',
  SaasRunwayCalculator: 'SaaS Runway Calculator',
  AskAnAdvisorMiniAudit: 'Ask an Advisor Mini-Audit',
  NomineeUboDecisionTool: 'Nominee vs Self UBO Tool',
  PaymentGatewayChecker: 'Payment Gateway Checker',
  FreelancerReadinessScore: 'Freelancer Readiness Score',
  AgencyBillingAudit: 'Agency Billing Audit',
  ResidencyRoutePlanner: 'Residency Route Planner',
  CountryTaxPressureScorecard: 'Country Tax Pressure Scorecard',
  HongKongSetupSimulator: 'Hong Kong Setup Simulator',
  ShelfCompanySpeedTest: 'Shelf Company Speed Test',
  KycReadinessChecker: 'KYC Readiness Checker',
  StatBandBlock: 'Stat Band',
  EditorialBreakBlock: 'Editorial Break Quote',
  BentoGridBlock: 'Bento Feature Grid',
  QuotePhotoCardBlock: 'Quote + Photo Card',
}

const componentsWithLabels = Object.fromEntries(
  (Object.entries(RAW_COMPONENTS) as Array<[keyof Props, (typeof RAW_COMPONENTS)[keyof Props]]>).map(([key, component]) => [
    key,
    { ...component, label: LABELS[key] },
  ]),
) as Config<Props>['components']

export const config: Config<Props> = {
  root: {
    render: ({ children }) => <div className="puck-root-wrapper">{children}</div>,
  },
  components: componentsWithLabels,
  categories: {
    core: { title: 'Core / Hero', components: ['Hero', 'Subhero', 'Ticker', 'GlobalCta', 'LeadForm'] },
    content: {
      title: 'Content',
      components: [
        'BenefitGrid',
        'BentoGridBlock',
        'ProcessSteps',
        'Faq',
        'RequirementsList',
        'StatsCounter',
        'StatBandBlock',
        'EditorialBreakBlock',
        'Testimonials',
        'SingleTestimonial',
        'QuotePhotoCardBlock',
        'LogoCloud',
      ],
    },
    blog: {
      title: 'Blog',
      components: ['AuthorBio', 'TableOfContents', 'RelatedPosts', 'SocialShare'],
    },
    conversion: {
      title: 'Conversion',
      components: [
        'PricingDetail',
        'PricingCards',
        'LeadMagnets',
        'ServicesGrid',
        'JurisdictionsGrid',
        'TaxGuideCta',
        'WhatsAppSpecialistCta',
        'MeetingBookingCta',
        'PromoBanner',
        'ButtonBlock',
      ],
    },
    interactive: { title: 'Interactive Tools', components: ['ComparisonTool', 'JurisdictionQuiz', 'InteractiveTools'] },
    leadMagnets: {
      title: 'Lead Magnet Calculators',
      components: [
        'GlobalStructureFitAssessment',
        'TaxLeakageCalculator',
        'EcommerceMarginCalculator',
        'SaasRunwayCalculator',
        'AskAnAdvisorMiniAudit',
        'PaymentGatewayChecker',
        'AgencyBillingAudit',
        'ResidencyRoutePlanner',
        'CountryTaxPressureScorecard',
        'HongKongSetupSimulator',
        'ShelfCompanySpeedTest',
        'KycReadinessChecker',
      ],
    },
    advanced: { title: 'Advanced', components: ['HtmlEmbed'] },
    layout: { title: 'Layout', components: ['RichText', 'Columns', 'ImageBlock', 'Accordion'] },
    shelved: {
      title: 'Shelved',
      visible: false,
      components: ['JurisdictionMatchmaker', 'NomineeUboDecisionTool', 'FreelancerReadinessScore'],
    },
  },
}

export default config

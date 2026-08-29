'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CompanyEntity {
  id: string;
  name: string;
  jurisdiction: string;
  countryCode: 'uae' | 'hk' | 'singapore' | 'bahrain' | 'ireland' | 'oman';
  flag: string;
  tier: 'tier1' | 'tier2' | 'tier3';
  tierTitle: string;
  currentStage: number; // 1 to 6
  stageName: string;
  status: 'paid' | 'official_kyc_pending' | 'filing' | 'license_issued' | 'banking_setup' | 'active';
  tradeLicenseNo?: string;
  incorporationDate: string;
  licenseExpiryDate: string;
  renewalDaysLeft: number;
  annualRevenue?: number;
  assignedSpecialist: string;
  specialistPhone: string;
  kycReferenceNumber?: string;
  kycVerifiedAt?: string;
  documents: {
    id: string;
    title: string;
    type: string;
    size: string;
    isReady: boolean;
    downloadUrl?: string;
  }[];
}

export interface OrderItem {
  id: string;
  orderNumber: string;
  companyName: string;
  jurisdiction: string;
  tier: string;
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  currency: string;
  paymentMethod: string;
  clientName: string;
  clientEmail: string;
  clientWhatsApp: string;
  createdAt: string;
  status: 'completed' | 'pending' | 'processing';
}

export interface TaxRecord {
  id: string;
  type: 'vat_quarterly' | 'corporate_tax_annual';
  title: string;
  period: string;
  dueDate: string;
  estimatedTaxLiability: number;
  status: 'upcoming' | 'ready_to_file' | 'filed' | 'exempt_0_percent';
  trnNumber: string;
}

export interface ExpenseItem {
  id: string;
  description: string;
  category: string;
  amountAed: number;
  date: string;
  status: 'verified' | 'pending_review';
}

export interface BankingApplication {
  id: string;
  bankName: string;
  bankType: 'Fintech Multi-Currency' | 'UAE Digital' | 'Tier 1 Physical';
  targetEntityName: string;
  status: 'pre_approved' | 'submitted' | 'under_review' | 'approved' | 'action_required';
  odds: number;
  turnaroundDays: string;
  ibanOrAccount?: string;
  nextStep: string;
}

export interface WhatsAppNotification {
  id: string;
  recipientPhone: string;
  templateName: string;
  sentAt: string;
  messageText: string;
  status: 'delivered' | 'read' | 'sent';
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  country: string;
  role: string;
  whatsappAlerts: boolean;
  emailAlerts: boolean;
  twoFactorEnabled: boolean;
  activeSessions: number;
}

interface PortalState {
  entities: CompanyEntity[];
  activeEntityId: string;
  orders: OrderItem[];
  taxRecords: TaxRecord[];
  expenses: ExpenseItem[];
  bankingApps: BankingApplication[];
  whatsappLogs: WhatsAppNotification[];
  userProfile: UserProfile;
  setActiveEntityId: (id: string) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  createOrderAndEntity: (data: {
    companyName: string;
    country: string;
    tier: 'tier1' | 'tier2' | 'tier3';
    totalAmount: number;
    chargedNow: number;
    clientName: string;
    clientEmail: string;
    clientWhatsApp: string;
    paymentMethod: string;
  }) => string;
  submitKycHandshake: (entityId: string, referenceNumber: string) => void;
  advanceEntityStage: (entityId: string, targetStage: number) => void;
  payRenewalInvoice: (entityId: string) => void;
  addExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
  fileTaxReturn: (taxRecordId: string) => void;
  sendWhatsAppAlert: (phone: string, template: string, message: string) => void;
}

const INITIAL_ENTITIES: CompanyEntity[] = [
  {
    id: 'ent_01',
    name: 'Horizon Digital FZE',
    jurisdiction: 'UAE Freezone (IFZA Dubai)',
    countryCode: 'uae',
    flag: '🇦🇪',
    tier: 'tier2',
    tierTitle: 'Tier 2: Nominee UBO & Director',
    currentStage: 2,
    stageName: 'Official Portal Identity Verification',
    status: 'official_kyc_pending',
    tradeLicenseNo: 'Pending Issuance',
    incorporationDate: '2026-08-28',
    licenseExpiryDate: '2027-08-28',
    renewalDaysLeft: 363,
    assignedSpecialist: 'Abdullah K. (Senior Structuring Lead)',
    specialistPhone: '+971 50 123 4567',
    documents: [
      { id: 'doc_01', title: 'Nominee Trust Agreement & PoA Pack', type: 'Legal Deed PDF', size: '2.4 MB', isReady: true },
      { id: 'doc_02', title: 'Official Commercial Trade License', type: 'Gov License PDF', size: 'Pending Issue', isReady: false },
      { id: 'doc_03', title: 'Electronic Memorandum of Association (E-MoA)', type: 'Charter PDF', size: 'Pending Issue', isReady: false },
      { id: 'doc_04', title: 'Corporate Banking Pre-Approval Docket', type: 'Banking Pack PDF', size: '1.8 MB', isReady: true },
    ],
  },
  {
    id: 'ent_02',
    name: 'Apex Global Trade Ltd',
    jurisdiction: 'Hong Kong (Offshore Entity)',
    countryCode: 'hk',
    flag: '🇭🇰',
    tier: 'tier1',
    tierTitle: 'Tier 1: Self as UBO & Director',
    currentStage: 6,
    stageName: 'Active & Operational',
    status: 'active',
    tradeLicenseNo: 'HK-CR-7892140',
    incorporationDate: '2025-11-15',
    licenseExpiryDate: '2026-11-15',
    renewalDaysLeft: 77,
    assignedSpecialist: 'Marcus Wong (HK Corporate Specialist)',
    specialistPhone: '+852 9123 4567',
    kycReferenceNumber: 'HK-CR-KYC-9942',
    kycVerifiedAt: '2025-11-16',
    documents: [
      { id: 'doc_11', title: 'Hong Kong Certificate of Incorporation', type: 'Gov Certificate PDF', size: '1.2 MB', isReady: true },
      { id: 'doc_12', title: 'Business Registration Certificate (BRC)', type: 'Tax Registry PDF', size: '950 KB', isReady: true },
      { id: 'doc_13', title: 'Articles of Association & Share Certificates', type: 'Statutory PDF', size: '3.1 MB', isReady: true },
      { id: 'doc_14', title: 'Airwallex Multi-Currency Account Certificate', type: 'Bank Confirmation PDF', size: '640 KB', isReady: true },
    ],
  },
];

const INITIAL_TAX_RECORDS: TaxRecord[] = [
  {
    id: 'tax_01',
    type: 'vat_quarterly',
    title: 'UAE Q3 2026 VAT Return Filing',
    period: 'Jul 1, 2026 – Sep 30, 2026',
    dueDate: 'Oct 28, 2026',
    estimatedTaxLiability: 4250,
    status: 'ready_to_file',
    trnNumber: '100482910400003',
  },
  {
    id: 'tax_02',
    type: 'corporate_tax_annual',
    title: 'UAE First Financial Year Corporate Tax Return (9%)',
    period: 'FY 2026-2027',
    dueDate: 'May 31, 2028',
    estimatedTaxLiability: 0,
    status: 'exempt_0_percent',
    trnNumber: '100482910400003',
  },
  {
    id: 'tax_03',
    type: 'vat_quarterly',
    title: 'UAE Q2 2026 VAT Return Filing',
    period: 'Apr 1, 2026 – Jun 30, 2026',
    dueDate: 'Jul 28, 2026',
    estimatedTaxLiability: 3100,
    status: 'filed',
    trnNumber: '100482910400003',
  },
];

const INITIAL_EXPENSES: ExpenseItem[] = [
  { id: 'exp_01', description: 'Dubai Co-Working Flex Desk Lease', category: 'Rent & Office', amountAed: 18000, date: '2026-08-15', status: 'verified' },
  { id: 'exp_02', description: 'AWS & Cloud Hosting Services', category: 'Software & IT', amountAed: 7400, date: '2026-08-10', status: 'verified' },
  { id: 'exp_03', description: 'Cross-Border Legal Advisory Fees', category: 'Legal & Professional', amountAed: 12500, date: '2026-08-05', status: 'verified' },
  { id: 'exp_04', description: 'Meta Ads Campaign Spend', category: 'Marketing', amountAed: 24000, date: '2026-08-01', status: 'verified' },
];

const INITIAL_BANKING_APPS: BankingApplication[] = [
  {
    id: 'bank_01',
    bankName: 'Airwallex (Multi-Currency Global)',
    bankType: 'Fintech Multi-Currency',
    targetEntityName: 'Horizon Digital FZE',
    status: 'pre_approved',
    odds: 98,
    turnaroundDays: '5-7 Days',
    ibanOrAccount: 'Pending Trade License Upload',
    nextStep: 'Auto-submits to Airwallex upon Stage 4 Trade License issuance',
  },
  {
    id: 'bank_02',
    bankName: 'Wio Bank (UAE Corporate AED/USD)',
    bankType: 'UAE Digital',
    targetEntityName: 'Horizon Digital FZE',
    status: 'pre_approved',
    odds: 96,
    turnaroundDays: '3-5 Days',
    ibanOrAccount: 'Pre-Vetted Application Ready',
    nextStep: 'Requires Passport Biometric Handshake',
  },
  {
    id: 'bank_03',
    bankName: 'Wise Business (Global IBANs)',
    bankType: 'Fintech Multi-Currency',
    targetEntityName: 'Apex Global Trade Ltd',
    status: 'approved',
    odds: 100,
    turnaroundDays: 'Completed',
    ibanOrAccount: 'GB82 WISE 2049 8812 9041',
    nextStep: 'Active & Processing Multi-Currency Payouts',
  },
  {
    id: 'bank_04',
    bankName: 'Emirates NBD Business',
    bankType: 'Tier 1 Physical',
    targetEntityName: 'Horizon Digital FZE',
    status: 'under_review',
    odds: 88,
    turnaroundDays: '15-20 Days',
    ibanOrAccount: 'Application Ref: ENBD-CORP-9842',
    nextStep: 'Banker Video Verification Escort Scheduled',
  },
];

const INITIAL_WHATSAPP_LOGS: WhatsAppNotification[] = [
  {
    id: 'wa_01',
    recipientPhone: '+31 6 12345678',
    templateName: 'order_confirmed_template',
    sentAt: '2026-08-28 14:20',
    messageText: '🎉 Congratulations Alex! Your order for Horizon Digital FZE is confirmed. Your assigned specialist is Abdullah K. Complete your official KYC at the Document Vault.',
    status: 'read',
  },
  {
    id: 'wa_02',
    recipientPhone: '+31 6 12345678',
    templateName: 'official_kyc_reminder',
    sentAt: '2026-08-29 09:30',
    messageText: '📋 Action Required: Please complete your identity scan on the UAE Freezone Electronic Authority Portal to start Stage 3 Government Filing.',
    status: 'delivered',
  },
  {
    id: 'wa_03',
    recipientPhone: '+31 6 12345678',
    templateName: 'banking_pre_approved',
    sentAt: '2026-08-30 01:15',
    messageText: '🏦 Banking Update: Pre-approval secured for Wio Bank (96% odds) and Airwallex Multi-Currency.',
    status: 'delivered',
  },
];

const INITIAL_USER_PROFILE: UserProfile = {
  name: 'Alex Van Der Berg',
  email: 'alex@vanderberg-holdings.eu',
  phone: '+31 6 12345678',
  country: 'Netherlands',
  role: 'Founder & Ultimate Beneficial Owner',
  whatsappAlerts: true,
  emailAlerts: true,
  twoFactorEnabled: true,
  activeSessions: 2,
};

const PortalContext = createContext<PortalState | null>(null);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [entities, setEntities] = useState<CompanyEntity[]>(INITIAL_ENTITIES);
  const [activeEntityId, setActiveEntityId] = useState<string>('ent_01');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>(INITIAL_TAX_RECORDS);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES);
  const [bankingApps, setBankingApps] = useState<BankingApplication[]>(INITIAL_BANKING_APPS);
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppNotification[]>(INITIAL_WHATSAPP_LOGS);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const savedEntities = localStorage.getItem('gcc_entities');
      if (savedEntities) setEntities(JSON.parse(savedEntities));
      const savedActive = localStorage.getItem('gcc_active_entity');
      if (savedActive) setActiveEntityId(savedActive);
      const savedOrders = localStorage.getItem('gcc_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));
      const savedTax = localStorage.getItem('gcc_tax_records');
      if (savedTax) setTaxRecords(JSON.parse(savedTax));
      const savedExpenses = localStorage.getItem('gcc_expenses');
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
      const savedBanking = localStorage.getItem('gcc_banking_apps');
      if (savedBanking) setBankingApps(JSON.parse(savedBanking));
      const savedWa = localStorage.getItem('gcc_wa_logs');
      if (savedWa) setWhatsappLogs(JSON.parse(savedWa));
      const savedProfile = localStorage.getItem('gcc_user_profile');
      if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }
  }, []);

  // Save to local storage on changes
  useEffect(() => {
    try {
      localStorage.setItem('gcc_entities', JSON.stringify(entities));
      localStorage.setItem('gcc_active_entity', activeEntityId);
      localStorage.setItem('gcc_orders', JSON.stringify(orders));
      localStorage.setItem('gcc_tax_records', JSON.stringify(taxRecords));
      localStorage.setItem('gcc_expenses', JSON.stringify(expenses));
      localStorage.setItem('gcc_banking_apps', JSON.stringify(bankingApps));
      localStorage.setItem('gcc_wa_logs', JSON.stringify(whatsappLogs));
      localStorage.setItem('gcc_user_profile', JSON.stringify(userProfile));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }
  }, [entities, activeEntityId, orders, taxRecords, expenses, bankingApps, whatsappLogs, userProfile]);

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updates }));
  };

  const markNotificationRead = (id: string) => {
    setWhatsappLogs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'read' } : item))
    );
  };

  const markAllNotificationsRead = () => {
    setWhatsappLogs((prev) => prev.map((item) => ({ ...item, status: 'read' })));
  };

  const createOrderAndEntity = (data: {
    companyName: string;
    country: string;
    tier: 'tier1' | 'tier2' | 'tier3';
    totalAmount: number;
    chargedNow: number;
    clientName: string;
    clientEmail: string;
    clientWhatsApp: string;
    paymentMethod: string;
  }) => {
    const newOrderId = `ORD-${Date.now().toString().slice(-6)}`;
    const newEntityId = `ent_${Date.now().toString().slice(-4)}`;

    const countryMap: Record<string, { name: string; flag: string }> = {
      uae: { name: 'UAE Freezone (IFZA Dubai)', flag: '🇦🇪' },
      hk: { name: 'Hong Kong (Offshore Entity)', flag: '🇭🇰' },
      singapore: { name: 'Singapore Private Limited', flag: '🇸🇬' },
      bahrain: { name: 'Bahrain W.L.L.', flag: '🇧🇭' },
      ireland: { name: 'Ireland Non-Resident Ltd', flag: '🇮🇪' },
      oman: { name: 'Oman LLC (Sultanate of Oman)', flag: '🇴🇲' },
    };

    const cInfo = countryMap[data.country] || countryMap.uae;

    const newEntity: CompanyEntity = {
      id: newEntityId,
      name: data.companyName,
      jurisdiction: cInfo.name,
      countryCode: (data.country as any) || 'uae',
      flag: cInfo.flag,
      tier: data.tier,
      tierTitle:
        data.tier === 'tier2'
          ? 'Tier 2: Nominee UBO & Director'
          : data.tier === 'tier3'
          ? 'Tier 3: Shelf Aged Entity'
          : 'Tier 1: Self as UBO & Director',
      currentStage: 2,
      stageName: 'Official Portal Identity Verification',
      status: 'official_kyc_pending',
      tradeLicenseNo: 'Pending Issuance',
      incorporationDate: new Date().toISOString().split('T')[0],
      licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      renewalDaysLeft: 365,
      assignedSpecialist: 'Abdullah K. (Senior Structuring Lead)',
      specialistPhone: '+971 50 123 4567',
      documents: [
        { id: `doc_${Date.now()}_1`, title: 'Nominee Trust Agreement & PoA', type: 'Legal Deed PDF', size: '2.4 MB', isReady: true },
        { id: `doc_${Date.now()}_2`, title: 'Official Commercial Trade License', type: 'Gov License PDF', size: 'Pending Issue', isReady: false },
        { id: `doc_${Date.now()}_3`, title: 'Electronic Memorandum of Association (E-MoA)', type: 'Charter PDF', size: 'Pending Issue', isReady: false },
        { id: `doc_${Date.now()}_4`, title: 'Corporate Banking Pre-Approval Docket', type: 'Banking Pack PDF', size: '1.8 MB', isReady: true },
      ],
    };

    const newOrder: OrderItem = {
      id: `ord_${Date.now()}`,
      orderNumber: newOrderId,
      companyName: data.companyName,
      jurisdiction: cInfo.name,
      tier: data.tier,
      totalAmount: data.totalAmount,
      amountPaid: data.chargedNow,
      remainingAmount: data.totalAmount - data.chargedNow,
      currency: 'USD',
      paymentMethod: data.paymentMethod,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientWhatsApp: data.clientWhatsApp,
      createdAt: new Date().toISOString(),
      status: 'completed',
    };

    setEntities((prev) => [newEntity, ...prev]);
    setOrders((prev) => [newOrder, ...prev]);
    setActiveEntityId(newEntityId);

    // Trigger initial WhatsApp Confirmation
    sendWhatsAppAlert(
      data.clientWhatsApp,
      'order_confirmed_template',
      `🎉 Welcome to GCCStartup! Order #${newOrderId} for ${data.companyName} is confirmed. View your workspace & KYC vault in the client portal.`
    );

    return newOrderId;
  };

  const submitKycHandshake = (entityId: string, referenceNumber: string) => {
    setEntities((prev) =>
      prev.map((ent) => {
        if (ent.id === entityId) {
          return {
            ...ent,
            kycReferenceNumber: referenceNumber,
            kycVerifiedAt: new Date().toISOString(),
            currentStage: 3,
            stageName: 'Government Registry Filing',
            status: 'filing',
          };
        }
        return ent;
      })
    );

    // Send WhatsApp notification
    const entity = entities.find((e) => e.id === entityId);
    if (entity) {
      sendWhatsAppAlert(
        userProfile.phone || '+31 6 12345678',
        'kyc_verified_template',
        `✅ Official Portal Reference (${referenceNumber}) received for ${entity.name}. Stage 3 (Government Registry Filing) is now active!`
      );
    }
  };

  const advanceEntityStage = (entityId: string, targetStage: number) => {
    const stageNames: Record<number, { name: string; status: CompanyEntity['status'] }> = {
      1: { name: 'Order Paid', status: 'paid' },
      2: { name: 'Official Portal KYC', status: 'official_kyc_pending' },
      3: { name: 'Government Registry Filing', status: 'filing' },
      4: { name: 'Trade License Issued', status: 'license_issued' },
      5: { name: 'Fintech Bank Setup', status: 'banking_setup' },
      6: { name: 'Active & Operational', status: 'active' },
    };

    const targetInfo = stageNames[targetStage] || stageNames[6];

    setEntities((prev) =>
      prev.map((ent) => {
        if (ent.id === entityId) {
          const updatedDocs = ent.documents.map((d) => {
            if (targetStage >= 4 && (d.title.includes('Trade License') || d.title.includes('MoA'))) {
              return { ...d, isReady: true, size: '1.4 MB' };
            }
            return d;
          });

          return {
            ...ent,
            currentStage: targetStage,
            stageName: targetInfo.name,
            status: targetInfo.status,
            tradeLicenseNo:
              targetStage >= 4 && ent.tradeLicenseNo === 'Pending Issuance'
                ? `AE-IFZA-${Math.floor(100000 + Math.random() * 900000)}`
                : ent.tradeLicenseNo,
            documents: updatedDocs,
          };
        }
        return ent;
      })
    );
  };

  const payRenewalInvoice = (entityId: string) => {
    setEntities((prev) =>
      prev.map((ent) => {
        if (ent.id === entityId) {
          return {
            ...ent,
            renewalDaysLeft: 365,
            licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          };
        }
        return ent;
      })
    );
  };

  const addExpense = (expense: Omit<ExpenseItem, 'id'>) => {
    const newExp: ExpenseItem = {
      ...expense,
      id: `exp_${Date.now()}`,
    };
    setExpenses((prev) => [newExp, ...prev]);
  };

  const fileTaxReturn = (taxRecordId: string) => {
    setTaxRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === taxRecordId) {
          return { ...rec, status: 'filed' };
        }
        return rec;
      })
    );
  };

  const sendWhatsAppAlert = (phone: string, template: string, message: string) => {
    const newLog: WhatsAppNotification = {
      id: `wa_${Date.now()}`,
      recipientPhone: phone,
      templateName: template,
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      messageText: message,
      status: 'sent',
    };
    setWhatsappLogs((prev) => [newLog, ...prev]);
  };

  return (
    <PortalContext.Provider
      value={{
        entities,
        activeEntityId,
        orders,
        taxRecords,
        expenses,
        bankingApps,
        whatsappLogs,
        userProfile,
        setActiveEntityId,
        updateUserProfile,
        markNotificationRead,
        markAllNotificationsRead,
        createOrderAndEntity,
        submitKycHandshake,
        advanceEntityStage,
        payRenewalInvoice,
        addExpense,
        fileTaxReturn,
        sendWhatsAppAlert,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function usePortalStore() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortalStore must be used within a PortalProvider');
  }
  return context;
}

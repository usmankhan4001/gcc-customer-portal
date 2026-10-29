const docx = require("docx");
const fs = require("fs");

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, WidthType, AlignmentType, BorderStyle, ShadingType,
  PageBreak, Tab, TabStopType, TabStopPosition, NumberFormat, LevelFormat,
  PageNumber, Footer, Header, TableOfContents, convertInchesToTwip,
} = docx;

// Colors
const GOLD = "C9A84C";
const NAVY = "0A2540";
const DARK = "333333";
const LIGHT_BG = "F4F7FB";
const WHITE = "FFFFFF";
const LIGHT_GRAY = "E8E8E8";

// Helper: create a cell
function cell(text, opts = {}) {
  const {
    bold = false, color = DARK, bg = WHITE, width = 9000,
    font = "Calibri", size = 20, alignment = AlignmentType.LEFT,
    verticalAlign = "center", columnSpan, rowSpan,
  } = opts;
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: bg },
    verticalAlign,
    columnSpan,
    rowSpan,
    children: [
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({ text, bold, color, font, size }),
        ],
      }),
    ],
  });
}

// Helper: create a header cell (dark bg, white text)
function headerCell(text, width = 9000) {
  return cell(text, { bold: true, color: WHITE, bg: NAVY, width, size: 18 });
}

// Helper: create a table with header row
function makeTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        children: headers.map((h, i) => headerCell(h, colWidths[i])),
      }),
      ...rows.map(row =>
        new TableRow({
          children: row.map((c, i) => cell(c, { width: colWidths[i] })),
        })
      ),
    ],
  });
}

// Helper: section heading (gold underline)
function sectionHeading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: 300, after: 100 },
    children: [new TextRun({ text, bold: true, color: NAVY, font: "Calibri", size: level === HeadingLevel.HEADING_1 ? 28 : level === HeadingLevel.HEADING_2 ? 24 : 22 })],
  });
}

// Helper: body paragraph
function bodyPara(text, opts = {}) {
  const { bold = false, italic = false, spacing = { after: 80 } } = opts;
  return new Paragraph({
    spacing,
    children: [new TextRun({ text, bold, italic, color: DARK, font: "Calibri", size: 20 })],
  });
}

// Helper: blank line
function blankLine() {
  return new Paragraph({ spacing: { after: 40 }, children: [] });
}

// Helper: divider line
function divider() {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { bottom: { color: GOLD, space: 1, style: BorderStyle.SINGLE, size: 6 } },
    children: [],
  });
}

// Helper: bullet item
function bulletItem(text, opts = {}) {
  const { bold = false } = opts;
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 40 },
    children: [new TextRun({ text, bold, color: DARK, font: "Calibri", size: 20 })],
  });
}

// Helper: open-ended question
function question(text) {
  return new Paragraph({
    spacing: { before: 120, after: 80 },
    children: [new TextRun({ text, bold: true, color: NAVY, font: "Calibri", size: 20 })],
  });
}

// Helper: blank answer line
function answerLine() {
  return new Paragraph({
    spacing: { after: 120 },
    border: { bottom: { color: LIGHT_GRAY, space: 1, style: BorderStyle.SINGLE, size: 2 } },
    children: [new TextRun({ text: " ", font: "Calibri", size: 20 })],
  });
}

// Helper: checkbox line
function checkbox(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 40 },
    children: [
      new TextRun({ text: "\u2610 ", font: "Calibri", size: 20 }),
      new TextRun({ text, color: DARK, font: "Calibri", size: 20 }),
    ],
  });
}

// ============ BUILD DOCUMENT ============

const children = [];

// ---- COVER / TITLE ----
children.push(new Paragraph({ spacing: { before: 2400 }, children: [] }));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
  children: [new TextRun({ text: "GCCSTARTUP.COM", bold: true, color: GOLD, font: "Calibri", size: 28, characterSpacing: 200 })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 100 },
  children: [new TextRun({ text: "Client Portal / Webapp", bold: true, color: NAVY, font: "Calibri", size: 36 })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 80 },
  border: { bottom: { color: GOLD, space: 1, style: BorderStyle.SINGLE, size: 6 } },
  children: [new TextRun({ text: "Discovery Questionnaire", italic: true, color: "6B7C93", font: "Calibri", size: 22 })],
}));
children.push(new Paragraph({ spacing: { before: 600 }, children: [] }));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 80 },
  children: [new TextRun({ text: "Fill out all 5 question groups before development begins.", color: DARK, font: "Calibri", size: 22 })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 80 },
  children: [new TextRun({ text: "Status Key:  CONFIRMED = exact number  |  ESTIMATE = best guess  |  UNKNOWN = need to find out", color: "6B7C93", font: "Calibri", size: 18 })],
}));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ---- TABLE OF CONTENTS (placeholder) ----
children.push(sectionHeading("Table of Contents", HeadingLevel.HEADING_1));
children.push(bodyPara("1. Traffic & Conversion"));
children.push(bodyPara("2. Lead Quality & Source"));
children.push(bodyPara("3. Sales Process"));
children.push(bodyPara("4. Competitive Position"));
children.push(bodyPara("5. Resources & Constraints"));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ====================================================================
// QUESTION GROUP 1 — TRAFFIC & CONVERSION
// ====================================================================
children.push(sectionHeading("1. Traffic & Conversion"));
children.push(bodyPara("Understand the current funnel: how many people visit, how many become leads, how many become paying clients, and how much revenue each generates.", { italic: true }));
children.push(divider());

// 1.1
children.push(sectionHeading("1.1 Website Traffic", HeadingLevel.HEADING_2));
children.push(bodyPara("Do you have access to Google Analytics (or similar) for gccstartup.com?", { bold: true }));
children.push(blankLine());
children.push(makeTable(
  ["Metric", "Value", "Source", "Status"],
  [
    ["Avg. monthly unique visitors (last 6 months)", "", "", ""],
    ["Avg. monthly sessions (last 6 months)", "", "", ""],
    ["Traffic trend (growing / stable / declining)", "", "", ""],
    ["Top 3 traffic sources (% split)", "", "", ""],
    ["Bounce rate", "", "", ""],
    ["Average time on site", "", "", ""],
    ["Mobile vs desktop split", "", "", ""],
  ],
  [3600, 1800, 1800, 1800]
));
children.push(blankLine());
children.push(bodyPara("If you don't have analytics set up, say \"NO ANALYTICS\" — this is a critical gap we need to fix before anything else.", { bold: true }));
children.push(divider());

// 1.2
children.push(sectionHeading("1.2 Lead Generation", HeadingLevel.HEADING_2));
children.push(makeTable(
  ["Metric", "Value", "Timeframe", "Status"],
  [
    ["Lead form submissions per month", "", "", ""],
    ["Total leads captured per month (all sources)", "", "", ""],
    ["Lead-to-contact rate", "", "", ""],
    ["Avg. time from lead to first human contact", "", "", ""],
    ["Leads that go to voicemail / no response", "", "", ""],
  ],
  [3200, 1600, 1600, 1600]
));
children.push(divider());

// 1.3
children.push(sectionHeading("1.3 Conversion & Revenue", HeadingLevel.HEADING_2));
children.push(makeTable(
  ["Metric", "Value", "Timeframe", "Status"],
  [
    ["Leads \u2192 paying clients conversion rate", "", "", ""],
    ["Number of paying clients per month", "", "", ""],
    ["Avg. revenue per client (fixed-price)", "", "", ""],
    ["Avg. revenue per client (custom-price)", "", "", ""],
    ["Blended average revenue per client", "", "", ""],
    ["Total monthly revenue (company formation)", "", "", ""],
    ["Revenue trend (growing / stable / declining)", "", "", ""],
  ],
  [3200, 1600, 1600, 1600]
));
children.push(divider());

// 1.4
children.push(sectionHeading("1.4 Funnel Leakage", HeadingLevel.HEADING_2));
children.push(bodyPara("Where do you lose the most leads? Estimate the percentage lost at each stage:", { bold: true }));
children.push(blankLine());
children.push(makeTable(
  ["Stage", "% Lost Here", "Notes"],
  [
    ["Website visitor \u2192 lead form submission", "", ""],
    ["Lead form \u2192 first contact made", "", ""],
    ["First contact \u2192 consultation call booked", "", ""],
    ["Consultation call \u2192 proposal sent", "", ""],
    ["Proposal sent \u2192 proposal accepted", "", ""],
    ["Proposal accepted \u2192 payment received", "", ""],
    ["Payment received \u2192 documents submitted", "", ""],
    ["Documents submitted \u2192 incorporation complete", "", ""],
  ],
  [3600, 1600, 2800]
));
children.push(blankLine());
children.push(question("Which single stage has the biggest drop-off?"));
children.push(answerLine());
children.push(question("Why do you think that stage leaks?"));
children.push(answerLine());
children.push(divider());

// 1.5
children.push(sectionHeading("1.5 Revenue Per Lead (RPL)", HeadingLevel.HEADING_2));
children.push(bodyPara("This metric tells us how much each lead is worth and therefore how much we can afford to spend on acquisition."));
children.push(blankLine());
children.push(makeTable(
  ["Calculation", "Value"],
  [
    ["Total monthly revenue", ""],
    ["Total leads per month", ""],
    ["Revenue per lead (RPL)", ""],
    ["Is RPL increasing or decreasing?", ""],
  ],
  [5000, 3000]
));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ====================================================================
// QUESTION GROUP 2 — LEAD QUALITY & SOURCE
// ====================================================================
children.push(sectionHeading("2. Lead Quality & Source"));
children.push(bodyPara("Understand where your best clients come from, what makes a lead \"qualified,\" and whether you're attracting the right people.", { italic: true }));
children.push(divider());

// 2.1
children.push(sectionHeading("2.1 Lead Sources", HeadingLevel.HEADING_2));
children.push(bodyPara("For each source, estimate the % of total leads and the % of paying clients:", { bold: true }));
children.push(blankLine());
children.push(makeTable(
  ["Source", "% of Leads", "% of Paying", "Quality (1-5)"],
  [
    ["Google organic search", "", "", ""],
    ["Google paid ads", "", "", ""],
    ["LinkedIn (organic)", "", "", ""],
    ["LinkedIn (ads)", "", "", ""],
    ["Referrals (existing clients)", "", "", ""],
    ["Referrals (professional partners)", "", "", ""],
    ["Direct / word of mouth", "", "", ""],
    ["YouTube", "", "", ""],
    ["Facebook / Instagram", "", "", ""],
    ["Other: _________________", "", "", ""],
  ],
  [2800, 1600, 1600, 2000]
));
children.push(blankLine());
children.push(question("Which source produces the highest-quality clients?"));
children.push(answerLine());
children.push(question("Which source produces the most volume?"));
children.push(answerLine());
children.push(divider());

// 2.2
children.push(sectionHeading("2.2 Ideal Client Profile (ICP)", HeadingLevel.HEADING_2));
children.push(bodyPara("Describe your best client — the one who pays fastest, is easiest to work with, and refers others:", { bold: true }));
children.push(blankLine());
children.push(makeTable(
  ["Attribute", "Description"],
  [
    ["Country of residence", ""],
    ["Nationality", ""],
    ["Business type", ""],
    ["Revenue range of their business", ""],
    ["Reason for incorporation", ""],
    ["Budget range", ""],
    ["Decision-making style", ""],
    ["How they found you", ""],
  ],
  [3000, 5000]
));
children.push(divider());

// 2.3
children.push(sectionHeading("2.3 Lead Qualification Criteria", HeadingLevel.HEADING_2));
children.push(bodyPara("What makes a lead \"qualified\" vs. \"unqualified\"?", { bold: true }));
children.push(blankLine());
children.push(makeTable(
  ["Criterion", "Qualified", "Unqualified"],
  [
    ["Geographic location", "", ""],
    ["Budget", "", ""],
    ["Business type", "", ""],
    ["Urgency (timeline)", "", ""],
    ["Decision authority", "", ""],
    ["Jurisdiction interest", "", ""],
  ],
  [2400, 2800, 2800]
));
children.push(divider());

// 2.4
children.push(sectionHeading("2.4 Disqualification Patterns", HeadingLevel.HEADING_2));
children.push(question("What % of leads are clearly unqualified?"));
children.push(answerLine());
children.push(question("Top 3 reasons leads are unqualified:"));
children.push(bodyPara("1. _______________________________________________"));
children.push(bodyPara("2. _______________________________________________"));
children.push(bodyPara("3. _______________________________________________"));
children.push(divider());

// 2.5
children.push(sectionHeading("2.5 International Market Breakdown", HeadingLevel.HEADING_2));
children.push(bodyPara("Which countries/regions do your clients come from?", { bold: true }));
children.push(blankLine());
children.push(makeTable(
  ["Country/Region", "% of Clients", "Avg. Revenue", "Notes"],
  [
    ["UK", "", "", ""],
    ["USA", "", "", ""],
    ["Pakistan (diaspora)", "", "", ""],
    ["UAE / GCC (local)", "", "", ""],
    ["Europe (other)", "", "", ""],
    ["Africa", "", "", ""],
    ["South Asia (other)", "", "", ""],
    ["Other: ___________", "", "", ""],
  ],
  [2200, 1600, 1600, 2600]
));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ====================================================================
// QUESTION GROUP 3 — SALES PROCESS
// ====================================================================
children.push(sectionHeading("3. Sales Process"));
children.push(bodyPara("Map the current sales journey from lead to cash. Identify bottlenecks, manual steps, and where the webapp can accelerate or automate.", { italic: true }));
children.push(divider());

// 3.1
children.push(sectionHeading("3.1 Current Sales Journey", HeadingLevel.HEADING_2));
children.push(bodyPara("Describe exactly what happens today when a lead comes in, step by step:", { bold: true }));
children.push(blankLine());
children.push(makeTable(
  ["Step", "What Happens", "Who", "How Long", "Tool"],
  [
    ["1. Lead arrives", "", "", "", ""],
    ["2. First response", "", "", "", ""],
    ["3. Qualification", "", "", "", ""],
    ["4. Consultation call", "", "", "", ""],
    ["5. Proposal/quote", "", "", "", ""],
    ["6. Follow-up", "", "", "", ""],
    ["7. Payment collection", "", "", "", ""],
    ["8. Document collection", "", "", "", ""],
    ["9. Application submission", "", "", "", ""],
    ["10. Incorporation tracking", "", "", "", ""],
    ["11. Completion/handoff", "", "", "", ""],
  ],
  [1800, 2200, 1200, 1200, 1600]
));
children.push(divider());

// 3.2
children.push(sectionHeading("3.2 Response Time", HeadingLevel.HEADING_2));
children.push(makeTable(
  ["Metric", "Current", "Target"],
  [
    ["Lead submission \u2192 first response", "", ""],
    ["First response \u2192 consultation call", "", ""],
    ["Consultation call \u2192 proposal sent", "", ""],
    ["Proposal sent \u2192 payment received", "", ""],
    ["Total: lead \u2192 paid client", "", ""],
  ],
  [3600, 2200, 2200]
));
children.push(divider());

// 3.3
children.push(sectionHeading("3.3 Follow-Up Process", HeadingLevel.HEADING_2));
children.push(bodyPara("What happens when a lead doesn't respond?", { bold: true }));
children.push(blankLine());
children.push(makeTable(
  ["Trigger", "Action", "Timing", "Who", "Automated?"],
  [
    ["Lead form, no reply", "", "", "", ""],
    ["Consultation no-show", "", "", "", ""],
    ["Proposal, no response", "", "", "", ""],
    ["Payment not received", "", "", "", ""],
    ["Docs not uploaded", "", "", "", ""],
  ],
  [2000, 2000, 1400, 1200, 1400]
));
children.push(divider());

// 3.4
children.push(sectionHeading("3.4 Tools & Systems", HeadingLevel.HEADING_2));
children.push(bodyPara("What tools do you currently use for each function?", { bold: true }));
children.push(blankLine());
children.push(makeTable(
  ["Function", "Tool", "Satisfaction (1-5)", "Notes"],
  [
    ["Lead capture", "", "", ""],
    ["Lead tracking / CRM", "", "", ""],
    ["Communication (email)", "", "", ""],
    ["Communication (WhatsApp)", "", "", ""],
    ["Proposals / quotes", "", "", ""],
    ["Payments", "", "", ""],
    ["Document collection", "", "", ""],
    ["Project tracking", "", "", ""],
    ["Calendar / booking", "", "", ""],
    ["Email automation", "", "", ""],
    ["Analytics", "", "", ""],
  ],
  [2200, 2200, 1600, 2000]
));
children.push(blankLine());
children.push(question("If you use spreadsheets or notes for any of these, list them here:"));
children.push(answerLine());
children.push(divider());

// 3.5
children.push(sectionHeading("3.5 Bottleneck Analysis", HeadingLevel.HEADING_2));
children.push(question("What's the single biggest bottleneck in your current sales process?"));
children.push(answerLine());
children.push(question("Why is it a bottleneck?"));
children.push(answerLine());
children.push(question("What would fixing it be worth?"));
children.push(answerLine());
children.push(divider());

// 3.6
children.push(sectionHeading("3.6 Sales Person Capacity", HeadingLevel.HEADING_2));
children.push(makeTable(
  ["Metric", "Current Value"],
  [
    ["Number of salespeople / dedicated sales effort", ""],
    ["Concurrent deals one person can handle", ""],
    ["Consultations per week", ""],
    ["Deals one person can close per month", ""],
    ["What happens when capacity is exceeded", ""],
  ],
  [4000, 4000]
));
children.push(divider());

// 3.7
children.push(sectionHeading("3.7 Proposals", HeadingLevel.HEADING_2));
children.push(bodyPara("How are proposals currently created and delivered?", { bold: true }));
children.push(blankLine());
children.push(makeTable(
  ["Aspect", "Current State"],
  [
    ["Format (PDF, email, verbal)", ""],
    ["Template or ad-hoc each time", ""],
    ["How long to create a proposal", ""],
    ["How it's sent to the client", ""],
    ["How the client accepts", ""],
    ["How payment is initiated after acceptance", ""],
    ["Can you track if client opened/viewed it", ""],
    ["What happens if client doesn't respond", ""],
  ],
  [3200, 4800]
));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ====================================================================
// QUESTION GROUP 4 — COMPETITIVE POSITION
// ====================================================================
children.push(sectionHeading("4. Competitive Position"));
children.push(bodyPara("Understand the competitive landscape, your differentiation, and why clients choose you (or don't).", { italic: true }));
children.push(divider());

// 4.1
children.push(sectionHeading("4.1 Direct Competitors", HeadingLevel.HEADING_2));
children.push(bodyPara("List your top 3\u20135 competitors for international company formation services:", { bold: true }));
children.push(blankLine());
children.push(makeTable(
  ["Competitor", "Website", "Jurisdictions", "Price Range", "Strength", "Weakness"],
  [
    ["1.", "", "", "", "", ""],
    ["2.", "", "", "", "", ""],
    ["3.", "", "", "", "", ""],
    ["4.", "", "", "", "", ""],
    ["5.", "", "", "", "", ""],
  ],
  [800, 1200, 1400, 1200, 1600, 1600]
));
children.push(divider());

// 4.2
children.push(sectionHeading("4.2 Competitive Pricing Comparison", HeadingLevel.HEADING_2));
children.push(makeTable(
  ["Service", "GCCStartup", "Competitor 1", "Competitor 2", "Competitor 3"],
  [
    ["UAE company formation (basic)", "", "", "", ""],
    ["UAE company formation (nominee)", "", "", "", ""],
    ["Bahrain company formation", "", "", "", ""],
    ["Hong Kong company formation", "", "", "", ""],
    ["Singapore company formation", "", "", "", ""],
    ["Bank account opening (add-on)", "", "", "", ""],
    ["Registered agent (annual)", "", "", "", ""],
  ],
  [2200, 1400, 1400, 1400, 1400]
));
children.push(blankLine());
children.push(bodyPara("Are you generally:"));
children.push(checkbox("Cheapest (race to bottom)"));
children.push(checkbox("Mid-range (value play)"));
children.push(checkbox("Premium (higher price, higher trust/service)"));
children.push(checkbox("Varies by jurisdiction"));
children.push(divider());

// 4.3
children.push(sectionHeading("4.3 Differentiation", HeadingLevel.HEADING_2));
children.push(bodyPara("Why do clients choose GCCStartup over competitors? (Pick top 3)", { bold: true }));
children.push(blankLine());
children.push(makeTable(
  ["Reason", "Evidence (client feedback, case studies)"],
  [
    ["", ""],
    ["", ""],
    ["", ""],
  ],
  [3000, 5000]
));
children.push(blankLine());
children.push(question("What can you do that competitors can't (or don't)?"));
children.push(answerLine());
children.push(divider());

// 4.4
children.push(sectionHeading("4.4 Loss Reasons", HeadingLevel.HEADING_2));
children.push(bodyPara("When you lose a deal to a competitor, what are the typical reasons?", { bold: true }));
children.push(blankLine());
children.push(makeTable(
  ["Reason", "Frequency (High/Med/Low)"],
  [
    ["Price too high", ""],
    ["Competitor has more jurisdiction options", ""],
    ["Competitor has faster processing", ""],
    ["Competitor has better trust/brand", ""],
    ["Competitor has local presence", ""],
    ["Client went with cheaper PRO/agent", ""],
    ["Client decided not to incorporate", ""],
    ["Slow response time lost the deal", ""],
    ["Other: _________________", ""],
  ],
  [4000, 4000]
));
children.push(divider());

// 4.5
children.push(sectionHeading("4.5 Market Positioning", HeadingLevel.HEADING_2));
children.push(bodyPara("How do you currently position GCCStartup?", { bold: true }));
children.push(blankLine());
children.push(makeTable(
  ["Aspect", "Current Position"],
  [
    ["One-line description of what you do", ""],
    ["Primary audience you serve", ""],
    ["Key benefit you promise", ""],
    ["Proof / credibility signals", ""],
    ["Tagline or value proposition", ""],
  ],
  [3200, 4800]
));
children.push(divider());

// 4.6
children.push(sectionHeading("4.6 Online Presence Comparison", HeadingLevel.HEADING_2));
children.push(makeTable(
  ["Factor", "GCCStartup", "Competitor 1", "Competitor 2"],
  [
    ["Website quality (1-5)", "", "", ""],
    ["SEO ranking", "", "", ""],
    ["Google reviews", "", "", ""],
    ["Trustpilot / similar", "", "", ""],
    ["Social media (1-5)", "", "", ""],
    ["Content quality", "", "", ""],
    ["Live chat / instant support", "", "", ""],
    ["Client portal / dashboard", "", "", ""],
  ],
  [2200, 2000, 2000, 2000]
));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ====================================================================
// QUESTION GROUP 5 — RESOURCES & CONSTRAINTS
// ====================================================================
children.push(sectionHeading("5. Resources & Constraints"));
children.push(bodyPara("Understand the practical boundaries: budget, team, timeline, and technical constraints that shape what's possible.", { italic: true }));
children.push(divider());

// 5.1
children.push(sectionHeading("5.1 Budget", HeadingLevel.HEADING_2));
children.push(makeTable(
  ["Item", "Amount", "Notes"],
  [
    ["Total budget for webapp build (one-time)", "", ""],
    ["Monthly budget for hosting/tools (ongoing)", "", ""],
    ["Budget for ongoing maintenance/support", "", ""],
    ["Is there funding or investment available?", "", ""],
    ["What's the expected ROI timeline?", "", ""],
  ],
  [3200, 2000, 2800]
));
children.push(divider());

// 5.2
children.push(sectionHeading("5.2 Team", HeadingLevel.HEADING_2));
children.push(bodyPara("Internal Team", { bold: true }));
children.push(blankLine());
children.push(makeTable(
  ["Role", "Name", "Availability (hrs/wk)", "Webapp Responsibility"],
  [
    ["Founder / Decision maker", "Abdullah", "", "Scope sign-off, pricing"],
    ["Operations / Compliance", "Farooq", "", "Jurisdiction data, document lists"],
    ["Marketing / Sales", "Ahmed", "", "Email/WhatsApp templates"],
    ["Dev / Technical", "", "", "Build, deploy, maintain"],
    ["Sales (dedicated)", "", "", "Consultations, closing"],
  ],
  [2000, 1400, 1800, 2800]
));
children.push(blankLine());
children.push(bodyPara("External Resources", { bold: true }));
children.push(blankLine());
children.push(makeTable(
  ["Resource", "Type", "Status", "Notes"],
  [
    ["Freelance developer", "", "", ""],
    ["Agency", "", "", ""],
    ["Designer (UI/UX)", "", "", ""],
    ["DevOps / infrastructure", "", "", ""],
  ],
  [2000, 1600, 1600, 2800]
));
children.push(divider());

// 5.3
children.push(sectionHeading("5.3 Technical Constraints", HeadingLevel.HEADING_2));
children.push(makeTable(
  ["Constraint", "Status", "Impact"],
  [
    ["Current site is Next.js (confirmed?)", "", ""],
    ["Any existing database or backend?", "", ""],
    ["Any existing user accounts or auth?", "", ""],
    ["Domain and hosting already set up?", "", ""],
    ["SSL certificate?", "", ""],
    ["CDN in place?", "", ""],
    ["Any legacy code or technical debt?", "", ""],
  ],
  [3200, 1600, 3200]
));
children.push(divider());

// 5.4
children.push(sectionHeading("5.4 Timeline", HeadingLevel.HEADING_2));
children.push(makeTable(
  ["Question", "Answer"],
  [
    ["Is there a hard deadline?", ""],
    ["Why that deadline?", ""],
    ["What's the ideal launch date?", ""],
    ["What's the \"must ship by\" date?", ""],
    ["What can wait for v2?", ""],
  ],
  [4000, 4000]
));
children.push(divider());

// 5.5
children.push(sectionHeading("5.5 Regulatory & Compliance", HeadingLevel.HEADING_2));
children.push(makeTable(
  ["Question", "Answer", "Status"],
  [
    ["Is GCCStartup registered as a company?", "", ""],
    ["In which jurisdiction(s)?", "", ""],
    ["Licensing requirements for company formation services?", "", ""],
    ["AML compliance required?", "", ""],
    ["KYC for your own clients?", "", ""],
    ["Data protection laws (GDPR, UAE PDPL)?", "", ""],
    ["Professional indemnity insurance?", "", ""],
  ],
  [3400, 2600, 2000]
));
children.push(divider());

// 5.6
children.push(sectionHeading("5.6 Risk Tolerance", HeadingLevel.HEADING_2));
children.push(makeTable(
  ["Risk", "Tolerance (Low/Med/High)", "Notes"],
  [
    ["Building custom vs. existing tools", "", ""],
    ["Time to build right vs. shipping fast", "", ""],
    ["Spending more on dev to save ongoing", "", ""],
    ["Relying on third-party services", "", ""],
    ["Handling sensitive KYC documents", "", ""],
    ["Scaling beyond current team", "", ""],
  ],
  [3200, 2000, 2800]
));
children.push(divider());

// 5.7
children.push(sectionHeading("5.7 Decision Authority", HeadingLevel.HEADING_2));
children.push(makeTable(
  ["Decision", "Who Decides", "Backup"],
  [
    ["Scope and features", "", ""],
    ["Budget allocation", "", ""],
    ["Tech stack selection", "", ""],
    ["Design direction", "", ""],
    ["Vendor selection", "", ""],
    ["Launch readiness", "", ""],
  ],
  [2600, 2600, 2800]
));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ---- STATUS KEY ----
children.push(sectionHeading("Status Key"));
children.push(bulletItem("CONFIRMED = Verified", { bold: true }));
children.push(bulletItem("ESTIMATE = Best guess", { bold: true }));
children.push(bulletItem("UNKNOWN = Need to determine", { bold: true }));
children.push(bulletItem("BLOCKED = Depends on something else first", { bold: true }));

// ============ CREATE DOCUMENT ============

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u2022",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } },
          },
        ],
      },
    ],
  },
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 20, color: DARK },
      },
      heading1: {
        run: { font: "Calibri", size: 28, bold: true, color: NAVY },
        paragraph: { spacing: { before: 300, after: 100 } },
      },
      heading2: {
        run: { font: "Calibri", size: 24, bold: true, color: NAVY },
        paragraph: { spacing: { before: 200, after: 80 } },
      },
      heading3: {
        run: { font: "Calibri", size: 22, bold: true, color: NAVY },
        paragraph: { spacing: { before: 160, after: 60 } },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: "GCCStartup Client Portal \u2014 Discovery Questionnaire", color: "999999", font: "Calibri", size: 16, italic: true })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Page ", color: "999999", font: "Calibri", size: 16 }),
                new TextRun({ children: [PageNumber.CURRENT], color: "999999", font: "Calibri", size: 16 }),
                new TextRun({ text: " of ", color: "999999", font: "Calibri", size: 16 }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], color: "999999", font: "Calibri", size: 16 }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

// ============ WRITE FILE ============
Packer.toBuffer(doc).then(buffer => {
  const outPath = "D:\\GCC Startup\\Customer Portal\\Discovery\\GCCStartup_Discovery_Questionnaire.docx";
  fs.writeFileSync(outPath, buffer);
  console.log("Created: " + outPath);
}).catch(err => {
  console.error("Error:", err);
});

import React, { useState } from "react";

// mirrors backend constants.py DEFAULT_THRESHOLDS exactly (tonnes CO2e)
const INDUSTRY_THRESHOLDS = [
  { industry: "Energy",        low: 5000,  medium: 20000, high: 80000, critical: 250000 },
  { industry: "Logistics",     low: 2000,  medium: 10000, high: 30000, critical: 100000 },
  { industry: "Manufacturing", low: 1000,  medium: 5000,  high: 15000, critical: 50000  },
  { industry: "Healthcare",    low: 400,   medium: 2000,  high: 7000,  critical: 20000  },
  { industry: "Technology",    low: 300,   medium: 1500,  high: 5000,  critical: 12000  },
  { industry: "Retail",        low: 300,   medium: 1500,  high: 3000,  critical: 8000   },
];

const REGULATIONS = [
  {
    name:        "EU Emissions Trading System (EU ETS)",
    region:      "European Union",
    type:        "Mandatory",
    framework:   "Cap-and-Trade",
    year:        2005,
    scope:       "Power generation, heavy industry, aviation (intra-EU), maritime (2024)",
    price:       "€50–100 / tCO₂e (current market range)",
    requirement: "Annual surrender of allowances equal to verified emissions. Installations above 20 MW or 10,000 t/year CO₂ must participate.",
    link:        "https://climate.ec.europa.eu/eu-action/eu-emissions-trading-system-eu-ets_en",
    color:       "blue",
  },
  {
    name:        "SEBI BRSR (Business Responsibility and Sustainability Reporting)",
    region:      "India",
    type:        "Mandatory",
    framework:   "Disclosure",
    year:        2022,
    scope:       "Top 1000 listed companies by market cap on BSE / NSE",
    price:       "N/A — disclosure requirement, no credit cost",
    requirement: "Report Scope 1, 2, and 3 GHG emissions. Disclose energy intensity, water, waste, and social metrics. BRSR Core (assurance-ready) mandatory from FY 2024–25.",
    link:        "https://www.sebi.gov.in/legal/circulars/may-2021/business-responsibility-and-sustainability-reporting-by-listed-entities_50096.html",
    color:       "orange",
  },
  {
    name:        "GHG Protocol Corporate Standard",
    region:      "Global",
    type:        "Voluntary / Referenced by regulators",
    framework:   "Accounting Standard",
    year:        2001,
    scope:       "All organizations — baseline for most national regulations",
    price:       "N/A — accounting standard",
    requirement: "Categorize emissions as Scope 1 (direct), Scope 2 (purchased energy), Scope 3 (value chain). Most regulators require GHG Protocol methodology.",
    link:        "https://ghgprotocol.org/corporate-standard",
    color:       "green",
  },
  {
    name:        "ISO 14064 — GHG Accounting & Verification",
    region:      "Global",
    type:        "Voluntary / Often contractually required",
    framework:   "Certification Standard",
    year:        2018,
    scope:       "Organizations, projects, verification bodies",
    price:       "Certification cost varies — typically $5,000–$30,000 USD",
    requirement: "Part 1: Organizational-level GHG quantification. Part 2: Project-level. Part 3: Validation & verification. Third-party audit required for certification.",
    link:        "https://www.iso.org/standard/66453.html",
    color:       "purple",
  },
  {
    name:        "Carbon Border Adjustment Mechanism (CBAM)",
    region:      "European Union",
    type:        "Mandatory",
    framework:   "Border Carbon Tax",
    year:        2023,
    scope:       "Imports: cement, iron, steel, aluminium, fertilisers, electricity, hydrogen",
    price:       "Linked to EU ETS price (~€50–100 / tCO₂e)",
    requirement: "Importers must report embedded emissions quarterly from Oct 2023. Financial obligations begin Jan 2026. Indian / other exporters must disclose Scope 1 + 2 of production.",
    link:        "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en",
    color:       "red",
  },
  {
    name:        "PAS 2060 — Carbon Neutrality",
    region:      "UK / Global",
    type:        "Voluntary",
    framework:   "Certification Standard",
    year:        2014,
    scope:       "Organizations, products, events claiming carbon neutrality",
    price:       "Offset cost + audit fee varies",
    requirement: "Measure all material Scope 1–3 emissions, reduce them, offset remaining with certified credits, then declare carbon neutrality with a qualified third-party statement.",
    link:        "https://www.bsigroup.com/en-GB/PAS-2060-Carbon-Neutrality/",
    color:       "teal",
  },
];

const CREDIT_STANDARDS = [
  {
    name:      "Verra VCS (Verified Carbon Standard)",
    type:      "Voluntary",
    price:     "$5–35 / tCO₂e",
    projects:  "Forestry (REDD+), renewable energy, methane capture, cookstoves",
    registry:  "Verra Registry (public)",
    notes:     "World's largest voluntary carbon market standard. Over 1,900 registered projects globally.",
  },
  {
    name:      "Gold Standard",
    type:      "Voluntary",
    price:     "$10–50 / tCO₂e",
    projects:  "Clean cooking, safe water, renewable energy, forestry with SDG co-benefits",
    registry:  "Gold Standard Impact Registry",
    notes:     "Higher price due to strict co-benefit requirements (SDGs). Preferred by corporates for credibility.",
  },
  {
    name:      "EU Allowances (EUAs)",
    type:      "Compliance",
    price:     "€50–100 / tCO₂e",
    projects:  "N/A — allowances issued by EU governments under ETS cap",
    registry:  "EU Transaction Log (EUTL)",
    notes:     "Required for regulated entities. Cannot substitute voluntary credits for ETS obligations.",
  },
  {
    name:      "ACCUs (Australian Carbon Credit Units)",
    type:      "Compliance / Voluntary",
    price:     "A$25–40 / tCO₂e",
    projects:  "Land, agriculture, waste, energy efficiency in Australia",
    registry:  "Australian Carbon Credit Unit Registry",
    notes:     "Can be used for Safeguard Mechanism compliance or voluntary offsetting.",
  },
  {
    name:      "CORSIAs (ICAO Aviation Offsets)",
    type:      "Compliance (Aviation)",
    price:     "$5–20 / tCO₂e",
    projects:  "Must meet ICAO eligibility criteria — wide range of project types",
    registry:  "Various approved registries",
    notes:     "Required for international airlines. Phase-in by route from 2027.",
  },
];

const HOW_TO_BUY = [
  {
    method: "Direct from Project Developer",
    pros:   "Lowest price, long-term offtake agreement possible",
    cons:   "Due diligence burden, illiquid, minimum volume often 10,000 t+",
  },
  {
    method: "Carbon Broker (e.g. South Pole, 3Degrees, EcoAct)",
    pros:   "Curated project selection, compliance support, flexible volumes",
    cons:   "Broker margin (10–20%), less transparency on underlying cost",
  },
  {
    method: "Exchange (CBL / Xpansiv, ACX, Nodal)",
    pros:   "Transparent pricing, liquid, spot and futures available",
    cons:   "Standardised contracts — limited project traceability, requires account setup",
  },
  {
    method: "Retail Platform (Pachama, Terrapass, Cool Effect)",
    pros:   "Low minimum volume, fast onboarding, credit quality vetting",
    cons:   "Premium pricing, limited customisation for corporate reporting",
  },
];

const REDUCTION_STRATEGIES = [
  {
    category: "Energy Efficiency",
    icon:     "⚡",
    actions: [
      "LED lighting retrofit across all facilities",
      "Building management systems (BMS) for HVAC optimization",
      "Variable speed drives on motors and pumps",
      "ISO 50001 energy management system certification",
    ],
    typical_saving: "15–30% of Scope 1 & 2 emissions",
  },
  {
    category: "Renewable Energy",
    icon:     "☀️",
    actions: [
      "On-site solar PV installation",
      "Power Purchase Agreements (PPAs) for additionality",
      "Renewable Energy Certificates (RECs / I-RECs) for Scope 2 market-based reporting",
      "Transition to green hydrogen for process heat (long-term)",
    ],
    typical_saving: "Up to 100% of Scope 2 emissions",
  },
  {
    category: "Supply Chain (Scope 3)",
    icon:     "🔗",
    actions: [
      "Supplier emissions disclosure requirements (this platform)",
      "Preferred supplier status for low-carbon vendors",
      "Logistics consolidation and modal shift to rail/sea",
      "Circular economy: recycled content targets in procurement",
    ],
    typical_saving: "20–50% of total footprint for most industries",
  },
  {
    category: "Process Decarbonisation",
    icon:     "🏭",
    actions: [
      "Electrification of process heat below 150°C",
      "Fuel switching — natural gas → biomethane → hydrogen",
      "Carbon Capture, Utilisation & Storage (CCUS) for hard-to-abate sectors",
      "Methane leak detection and repair (LDAR) programs",
    ],
    typical_saving: "Varies — most impactful for Energy and Manufacturing",
  },
  {
    category: "Fleet & Transport",
    icon:     "🚛",
    actions: [
      "EV transition roadmap aligned with national grid decarbonisation",
      "Driver behaviour monitoring and eco-driving training",
      "Last-mile delivery optimisation software",
      "Sustainable Aviation Fuel (SAF) for corporate air travel",
    ],
    typical_saving: "40–80% of fleet Scope 1 with full EV transition",
  },
  {
    category: "Carbon Offsetting (residuals only)",
    icon:     "🌳",
    actions: [
      "Offset only after all feasible reductions are made (Mitigation Hierarchy)",
      "Use high-quality credits: Verra VCS + CCB, Gold Standard",
      "Prefer removals (forests, biochar, DACCS) over avoidance for net-zero claims",
      "Retire credits in your name via registry before claiming",
    ],
    typical_saving: "Covers remaining ~10–20% for net-zero targets",
  },
];

const TABS = [
  { id: "regulations", label: "Regulations" },
  { id: "thresholds",  label: "Industry Thresholds" },
  { id: "market",      label: "Carbon Credit Market" },
  { id: "strategies",  label: "Reduction Strategies" },
];

const REGION_COLOR = {
  blue:   "border-blue-400   bg-blue-50   dark:bg-blue-900/20",
  orange: "border-orange-400 bg-orange-50 dark:bg-orange-900/20",
  green:  "border-green-400  bg-green-50  dark:bg-green-900/20",
  purple: "border-purple-400 bg-purple-50 dark:bg-purple-900/20",
  red:    "border-red-400    bg-red-50    dark:bg-red-900/20",
  teal:   "border-teal-400   bg-teal-50   dark:bg-teal-900/20",
};

const TYPE_BADGE = {
  "Mandatory":                      "bg-red-100    text-red-700",
  "Voluntary":                      "bg-green-100  text-green-700",
  "Voluntary / Referenced by regulators": "bg-blue-100 text-blue-700",
  "Voluntary / Often contractually required": "bg-purple-100 text-purple-700",
  "Compliance":                     "bg-orange-100 text-orange-700",
  "Compliance / Voluntary":         "bg-yellow-100 text-yellow-700",
  "Compliance (Aviation)":          "bg-gray-100   text-gray-700",
};

function Section({ children }) {
  return <div className="space-y-6">{children}</div>;
}

function RegulationsTab() {
  return (
    <Section>
      {REGULATIONS.map(reg => (
        <div
          key={reg.name}
          className={`border-l-4 rounded-lg p-5 ${REGION_COLOR[reg.color] || "border-gray-300 bg-gray-50"}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{reg.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {reg.region} · Since {reg.year} · {reg.framework}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_BADGE[reg.type] || "bg-gray-100 text-gray-700"}`}>
              {reg.type}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Scope: </span>
              <span className="text-gray-600 dark:text-gray-400">{reg.scope}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Price / Cost: </span>
              <span className="text-gray-600 dark:text-gray-400">{reg.price}</span>
            </div>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 leading-relaxed">
            {reg.requirement}
          </p>

          <a
            href={reg.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-xs text-[#1a8f70] hover:underline"
          >
            Official source ↗
          </a>
        </div>
      ))}
    </Section>
  );
}

function ThresholdsTab() {
  const LEVEL_COLOR = {
    low:      "bg-green-100  text-green-800",
    medium:   "bg-yellow-100 text-yellow-800",
    high:     "bg-orange-100 text-orange-800",
    critical: "bg-red-100    text-red-800",
  };

  return (
    <Section>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 text-sm text-yellow-800 dark:text-yellow-300">
        These thresholds are used by CarbonSentry's risk engine to classify vendor risk levels.
        They mirror the values in <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">constants.py DEFAULT_THRESHOLDS</code> and are aligned with industry benchmarks from GHG Protocol sector guidance.
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border rounded-lg overflow-hidden">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Industry</th>
              {["Low", "Medium", "High", "Critical"].map(l => (
                <th key={l} className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                  {l} (t CO₂e)
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700 bg-white dark:bg-gray-800">
            {INDUSTRY_THRESHOLDS.map(row => (
              <tr key={row.industry} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.industry}</td>
                {["low","medium","high","critical"].map(level => (
                  <td key={level} className="px-4 py-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${LEVEL_COLOR[level]}`}>
                      {row[level].toLocaleString()}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Risk band explanation */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">How Risk Bands Work</h3>
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-start gap-2">
            <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-medium mt-0.5">Low</span>
            <span>Emissions below the industry low threshold. Standard monitoring applies.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs font-medium mt-0.5">Medium</span>
            <span>Between low and medium thresholds. Reduction plan recommended. Annual review.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-xs font-medium mt-0.5">High</span>
            <span>Between medium and high thresholds. Compliance audit required. Remediation timeline expected.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-xs font-medium mt-0.5">Critical</span>
            <span>Exceeds high threshold. Escalation to senior management. Regulatory reporting likely required. Immediate action plan mandatory.</span>
          </div>
        </div>
      </div>
    </Section>
  );
}

function MarketTab() {
  return (
    <Section>
      {/* Credit Standards */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Credit Standards & Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CREDIT_STANDARDS.map(std => (
            <div key={std.name} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{std.name}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  std.type === "Compliance" ? "bg-red-100 text-red-700" :
                  std.type.includes("Compliance") ? "bg-orange-100 text-orange-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {std.type}
                </span>
              </div>
              <div className="text-lg font-bold text-[#1a8f70] mb-2">{std.price}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div><span className="font-medium">Projects:</span> {std.projects}</div>
                <div><span className="font-medium">Registry:</span> {std.registry}</div>
                <div className="text-gray-600 dark:text-gray-300 mt-2">{std.notes}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to buy */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">How to Purchase Carbon Credits</h3>
        <div className="space-y-3">
          {HOW_TO_BUY.map((item, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-[#1a8f70] text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{item.method}</h4>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                <div className="bg-green-50 dark:bg-green-900/20 rounded p-2">
                  <div className="font-medium text-green-700 dark:text-green-400 mb-1">✓ Pros</div>
                  <div className="text-gray-600 dark:text-gray-400">{item.pros}</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded p-2">
                  <div className="font-medium text-red-700 dark:text-red-400 mb-1">✗ Cons</div>
                  <div className="text-gray-600 dark:text-gray-400">{item.cons}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance checklist */}
      <div className="bg-[#1a8f70]/5 dark:bg-[#1a8f70]/10 border border-[#1a8f70]/30 rounded-lg p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Before Buying Credits — Compliance Checklist</h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          {[
            "Measure all material Scope 1, 2, and 3 emissions using GHG Protocol methodology",
            "Reduce emissions as far as feasible before offsetting (Mitigation Hierarchy)",
            "Select credits from recognised standards (Verra VCS, Gold Standard, EUAs)",
            "Verify additionality: the project would not have happened without carbon finance",
            "Ensure credits are not double-counted — retire them in your name via the registry",
            "For net-zero claims, SBTi requires offsets only for residual <10% of base-year emissions",
            "For SEBI BRSR: disclose offset purchases, registry details, and project type",
            "For EU ETS: EUAs and eligible carbon credits (eligible CERs/ERUs) only — no voluntary credits",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-[#1a8f70] mt-0.5 shrink-0">☑</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

function StrategiesTab() {
  return (
    <Section>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-300">
        The Mitigation Hierarchy: <strong>Avoid → Reduce → Replace → Offset</strong>.
        Offsets should only cover residual emissions after all feasible reductions are exhausted.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {REDUCTION_STRATEGIES.map(strat => (
          <div key={strat.category} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{strat.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{strat.category}</h3>
                <p className="text-xs text-[#1a8f70] font-medium">{strat.typical_saving}</p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {strat.actions.map((action, i) => (
                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-[#1a8f70] mt-0.5 shrink-0">•</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Target frameworks */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Science-Based Target Frameworks</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="border dark:border-gray-600 rounded p-3">
            <div className="font-medium text-gray-900 dark:text-white mb-1">SBTi Net-Zero Standard</div>
            <div className="text-gray-600 dark:text-gray-400">
              Requires 90–95% absolute reduction in Scope 1, 2, and 3 by 2050 vs base year.
              Residual &lt;10% offset with permanent removals only.
            </div>
          </div>
          <div className="border dark:border-gray-600 rounded p-3">
            <div className="font-medium text-gray-900 dark:text-white mb-1">IPCC 1.5°C Pathway</div>
            <div className="text-gray-600 dark:text-gray-400">
              ~45% reduction in global CO₂ by 2030 vs 2010 levels. Net-zero CO₂ by 2050.
              Companies aligned with 1.5°C must halve emissions this decade.
            </div>
          </div>
          <div className="border dark:border-gray-600 rounded p-3">
            <div className="font-medium text-gray-900 dark:text-white mb-1">India NDC Targets</div>
            <div className="text-gray-600 dark:text-gray-400">
              45% reduction in emissions intensity of GDP by 2030 vs 2005.
              50% cumulative electric power from non-fossil sources by 2030.
              Net-zero by 2070.
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

export default function CarbonKnowledge() {
  const [activeTab, setActiveTab] = useState("regulations");

  const TAB_CONTENT = {
    regulations: <RegulationsTab />,
    thresholds:  <ThresholdsTab />,
    market:      <MarketTab />,
    strategies:  <StrategiesTab />,
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Carbon Emission Knowledge Base</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Regulations, industry thresholds, carbon credit market, and reduction strategies
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b dark:border-gray-700 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-[#1a8f70] text-[#1a8f70]"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>{TAB_CONTENT[activeTab]}</div>
    </div>
  );
}
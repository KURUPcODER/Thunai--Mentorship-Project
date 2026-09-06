/**
 * Thunai Government Portal Preset Engine
 * Tuned for Indian Central & State Government E-Service Portals:
 * UIDAI (Aadhaar), Income Tax e-Filing, DigiLocker, Passport Seva, Parivahan.
 * Automatically translates complex Hindi/English government jargon into plain Malayalam.
 */

export const govPortalsData = [
  {
    id: "uidai",
    name: "UIDAI / myAadhaar (ആധാർ പോർട്ടൽ)",
    urlMatch: "uidai.gov.in, myaadhaar.uidai.gov.in",
    icon: "🆔",
    sampleEnglish: "Enter your 12-digit Aadhaar number and Captcha. Complete OTP-based e-KYC authentication to download e-Aadhaar or update demographic details.",
    sampleHindi: "अपना 12 अंकों का आधार नंबर और कैप्चा दर्ज करें। ई-आधार डाउनलोड करने या जनसांख्यिकीय विवरण अपडेट करने के लिए ओटीपी-आधारित ई-केवाईसी प्रमाणीकरण पूरा करें।",
    malayalamNatural: "നിങ്ങളുടെ 12 അക്ക ആധാർ നമ്പറും ക്യാപ്‌ച കോഡും നൽകുക. മൊബൈലിൽ വരുന്ന ഒ.ടി.പി ഉപയോഗിച്ച് ഇ-കെ.വൈ.സി സ്ഥിരീകരിച്ച് ഇ-ആധാർ ഡൗൺലോഡ് ചെയ്യുകയോ വിവരങ്ങൾ പുതുക്കുകയോ ചെയ്യാം.",
    malayalamSimplified: "ആധാർ നമ്പറും ഫോണിൽ വരുന്ന ഒ.ടി.പിയും നൽകി ആധാർ കാർഡ് ഡൗൺലോഡ് ചെയ്യാം.",
    jargonTerms: [
      { term: "e-KYC", ml: "ഇലക്ട്രോണിക് തിരിച്ചറിയൽ രേഖ പരിശോധന (Digital ID Verification)" },
      { term: "Demographic Details", ml: "പേര്, വിലാസം, ജനനത്തീയതി എന്നിവ" },
      { term: "Captcha", ml: "സുരക്ഷയ്ക്കായി ചിത്രത്തിൽ കാണുന്ന അക്ഷരങ്ങൾ നൽകുക" },
      { term: "URN Number", ml: "അപേക്ഷയുടെ സ്ഥിതി അറിയാനുള്ള ട്രാക്കിംഗ് നമ്പർ" }
    ],
    commonFixes: [
      "Missing Malayalam audio for Captcha challenge",
      "Hidden OTP resend countdown timer for screen readers",
      "Low contrast submission button fixed to high contrast"
    ]
  },
  {
    id: "incometax",
    name: "Income Tax e-Filing (ആദായനികുതി പോർട്ടൽ)",
    urlMatch: "incometax.gov.in",
    icon: "📑",
    sampleEnglish: "Log in using PAN as User ID. File Form ITR-1 (Sahaj) for Assessment Year 2026-27. Validate pre-filled AIS / TIS tax deductions before submission.",
    sampleHindi: "यूज़र आईडी के रूप में पैन का उपयोग करके लॉग इन करें। असेसमेंट वर्ष 2026-27 के लिए फॉर्म आईटीआर-1 (सहज) फाइल करें। जमा करने से पहले एआईएस विवरण सत्यापित करें।",
    malayalamNatural: "നിങ്ങളുടെ പാൻ കാർഡ് നമ്പർ (PAN) ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യുക. 2026-27 വർഷത്തെ ആദായനികുതി റിട്ടേൺ (ITR-1) ഫയൽ ചെയ്യുക. വിവരങ്ങൾ പരിശോധിച്ച ശേഷം ഒ.ടി.പി വഴി സ്ഥിരീകരിക്കുക.",
    malayalamSimplified: "പാൻ നമ്പർ നൽകി ലോഗിൻ ചെയ്ത് ടാക്സ് റിട്ടേൺ എളുപ്പത്തിൽ സമർപ്പിക്കാം.",
    jargonTerms: [
      { term: "ITR-1 (Sahaj)", ml: "ശമ്പള വരുമാനക്കാർക്കുള്ള ലളിതമായ നികുതി റിട്ടേൺ ഫോം" },
      { term: "AIS / TIS", ml: "നിങ്ങളുടെ ബാങ്ക് പലിശയും നികുതി കിഴിവുകളും കാണിക്കുന്ന വാർഷിക വിവരണം" },
      { term: "e-Verification", ml: "ആധാർ ഒ.ടി.പി വഴി റിട്ടേൺ ഡിജിറ്റലായി ഒപ്പിടൽ" }
    ],
    commonFixes: [
      "Inaccessible PDF form instructions translated to spoken Malayalam",
      "Keyboard trap resolved in tax deduction accordion menu"
    ]
  },
  {
    id: "digilocker",
    name: "DigiLocker (ഡിജിലോക്കർ)",
    urlMatch: "digilocker.gov.in",
    icon: "🔒",
    sampleEnglish: "Issued documents are legally at par with original physical documents under Rule 9A of the IT Act. Search and pull your Driving License, RC, and Marksheets.",
    sampleHindi: "जारी किए गए दस्तावेज़ आईटी अधिनियम के नियम 9ए के तहत कानूनी रूप से मूल भौतिक दस्तावेज़ों के बराबर हैं।",
    malayalamNatural: "ഡിജിലോക്കറിൽ ലഭ്യമായ ഡിജിറ്റൽ രേഖകൾ ഒറിജിനൽ സർട്ടിഫിക്കറ്റുകൾക്ക് തുല്യമാണ്. ഡ്രൈവിംഗ് ലൈസൻസ്, ആർ.സി ബുക്ക്, എസ്.എസ്.എൽ.സി സർട്ടിഫിക്കറ്റ് എന്നിവ ഇവിടെ ലഭിക്കും.",
    malayalamSimplified: "സർട്ടിഫിക്കറ്റുകളും ഡ്രൈവിംഗ് ലൈസൻസും ഒറിജിനൽ പോലെ ഫോണിൽ സൂക്ഷിക്കാം.",
    jargonTerms: [
      { term: "Issued Documents", ml: "സർക്കാർ വകുപ്പുകൾ നേരിട്ട് അയച്ചുതന്ന സാക്ഷ്യപ്പെടുത്തിയ ഡിജിറ്റൽ രേഖകൾ" },
      { term: "Security PIN", ml: "ലോഗിൻ ചെയ്യാൻ ഉപയോഗിക്കുന്ന 6 അക്ക രഹസ്യ നമ്പർ" }
    ],
    commonFixes: [
      "Document download icons given clear Malayalam screen-reader labels",
      "Line-focus ruler enabled for long document lists"
    ]
  },
  {
    id: "passport",
    name: "Passport Seva (പാസ്‌പോർട്ട് സേവ)",
    urlMatch: "passportindia.gov.in",
    icon: "🛂",
    sampleEnglish: "Register online, fill Application Form, schedule appointment at nearest Passport Seva Kendra (PSK / POPSK), and pay online fees.",
    sampleHindi: "ऑनलाइन पंजीकरण करें, आवेदन पत्र भरें, निकटतम पासपोर्ट सेवा केंद्र में अपॉइंटमेंट लें।",
    malayalamNatural: "ഓൺലൈനായി അപേക്ഷ സമർപ്പിച്ച ശേഷം തൊട്ടടുത്തുള്ള പാസ്‌പോർട്ട് സേവാ കേന്ദ്രത്തിൽ (PSK) തീയതിയും സമയവും ബുക്ക് ചെയ്യുക. ഫീസ് ഓൺലൈനായി അടയ്ക്കാം.",
    malayalamSimplified: "പാസ്‌പോർട്ടിനായി അപേക്ഷ നൽകി ഓഫീസിൽ പോകാനുള്ള തീയതി ബുക്ക് ചെയ്യാം.",
    jargonTerms: [
      { term: "PSK / POPSK", ml: "പാസ്‌പോർട്ട് സേവാ കേന്ദ്രം / പോസ്റ്റ് ഓഫീസ് കേന്ദ്രം" },
      { term: "ARN (Application Reference)", ml: "അപേക്ഷാ റഫറൻസ് നമ്പർ" }
    ],
    commonFixes: [
      "Appointment calendar grid made fully accessible for keyboard and voice navigation"
    ]
  },
  {
    id: "parivahan",
    name: "Parivahan Sarathi (വാഹനം / ലൈസൻസ് സേവനം)",
    urlMatch: "parivahan.gov.in, sarathi.parivahan.gov.in",
    icon: "🚗",
    sampleEnglish: "Apply for Learner License, Driving License Renewal, or Duplicate RC. Upload self-attested documents and book driving test slot.",
    sampleHindi: "लर्नर लाइसेंस, ड्राइविंग लाइसेंस नवीनीकरण या डुप्लिकेट आरसी के लिए आवेदन करें।",
    malayalamNatural: "ലേണേഴ്സ് ലൈസൻസ്, ഡ്രൈവിംഗ് ലൈസൻസ് പുതുക്കൽ, ആർ.സി ബുക്ക് സംബന്ധമായ സേവനങ്ങൾക്കായി അപേക്ഷിക്കാം. ടെസ്റ്റ് തീയതി ഓൺലൈനായി തിരഞ്ഞെടുക്കാം.",
    malayalamSimplified: "ഡ്രൈവിംഗ് ലൈസൻസിനും വാഹന രേഖകൾക്കുമുള്ള അപേക്ഷ ഇവിടെ നൽകാം.",
    jargonTerms: [
      { term: "LLR / Learner License", ml: "വാഹനം ഓടിച്ചു പഠിക്കാനുള്ള താൽക്കാലിക ലൈസൻസ്" },
      { term: "Self-Attested Documents", ml: "സ്വയം ഒപ്പിട്ടു സാക്ഷ്യപ്പെടുത്തിയ സർട്ടിഫിക്കറ്റുകൾ" }
    ],
    commonFixes: [
      "Form error messages surfaced in high-contrast Malayalam popup alerts"
    ]
  }
];

class GovPortalService {
  constructor() {
    this.portals = govPortalsData;
    this.selectedPortalId = "uidai";
  }

  detectPortalFromUrl(url = '') {
    const currentUrl = (url || (typeof window !== 'undefined' ? window.location.href : '')).toLowerCase();
    const matched = this.portals.find(p => p.urlMatch.split(', ').some(match => currentUrl.includes(match)));
    return matched || this.portals[0];
  }

  getPortalById(id) {
    return this.portals.find(p => p.id === id) || this.portals[0];
  }

  getAllPortals() {
    return this.portals;
  }
}

export const govPortalService = new GovPortalService();

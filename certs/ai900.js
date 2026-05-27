// ══════════════════════════════════════════════════════════════════════════
// Microsoft AI-900 Azure AI Fundamentals cert pack (v7.5.0 — content authoring)
// ══════════════════════════════════════════════════════════════════════════
// Loaded into window.CERT_PACKS.ai900 at app boot. Active when:
//   1. URL host matches 'ai.certanvil.com' (or 'ai.' / 'ai-' prefix for Vercel
//      preview branches) — Pattern A subdomain (LOCKED 2026-05-27 plan §9 #1:
//      Option A role-family separation; AZ-900 §9 #2 azure.certanvil.com lock
//      re-scoped to "AZ-* infra certs only")
//   2. localStorage 'nplus_dev_cert' === 'ai900' (dev override)
//   3. URL query '?cert=ai900' (one-shot entry-point handoff)
// Otherwise inert (loaded only when index.html inline IIFE document.writes
// <script src="certs/ai900.js"> after Pattern A resolves the host).
//
// Status (v7.5.0):
//   ✓ Cert metadata (name, code, exam pass 700/1000, 45-Q / 60-min)
//     — VoC §7 + §13.8 baked upfront (no AZ-900-style post-research hotfix)
//   ✓ Domain weights (Microsoft "Skills Measured" effective 2025-05-02 — the
//     GenAI/Azure AI Foundry refresh that added Domain 5)
//   ✓ Domain labels (5 domains — same domain-count as Net+/Sec+)
//   ✓ Topic catalog (40 topics across 5 domains)
//   ✓ Topic resources (Microsoft Learn module objective numbers + titles)
//   ✓ retentionGapConcepts (8 seed entries from public MS Skills Measured +
//     VoC research; the array stays open-ended, additive forever via Phase 3
//     cycles — Sec+ grew 8 → 18 → 26 across 6 cycles)
//   ☐ GT tables — AI/ML doesn't have a comparable enumerable-facts surface
//     to GT_PORTS / GT_OSI yet. Defer until a pattern emerges (Responsible AI
//     principles enum? AI-service-to-workload mapping?). Empty object means
//     consumers fall back to defaults (gt-less calls are a no-op).
//   ☐ questionExemplars — populated in Stage 6 (Phase 3 of v7.5.0 ship):
//     200 hand-curated exemplars across 36-42 clusters. Empty array = the
//     exemplar-injection step in fetchQuestions is a no-op; Haiku falls
//     back to blueprint + prompt quality alone.
//
// AUDIENCE (v7.5.0 Pattern A, locked 2026-05-27): public Pro-tier surface
// on https://ai.certanvil.com. Visible to all signed-in users in the cert
// switcher with a "PRO" badge; switching INTO ai900 requires Pro tier via
// tadSwitchCert's _gateProOnly('Azure AI Fundamentals (AI-900)') call.
// Anon visitors on the landing diagnostic at certanvil.com/diagnostic/
// azure-ai-fundamentals/ funnel into the Pro upgrade modal.
//
// LEGAL (non-negotiable, locked in plan §10): every entry below originates
// from the PUBLIC Microsoft AI-900 Skills Measured doc + PUBLIC Microsoft
// Learn modules ONLY. ZERO ingestion of paid-bank content — no MeasureUp,
// Whizlabs (the founder-attached Whiz-Cheat-Sheet PDF stays UNREAD per the
// precautionary §10 discipline), Skillcertpro (NEW addition to the prohibited
// list per VoC §13.6 braindump signal — multiple commenters reported 80%
// "word-to-word" matches with the real exam, putting it firmly in the
// exam-integrity hot zone Microsoft formally prohibits), Tutorial Dojo,
// paid Pluralsight, paid LinkedIn Learning, O'Reilly, Udemy, or paid YouTube
// cram courses (Jaspal). Same discipline that built the Net+ pack to a
// 767/900 pass, the Sec+ pack to a public Pro launch, and the AZ-900 pack
// to a Pattern-A-proven third cert. VoC research is direction-finder ONLY
// (which topics get more exemplars), never a content source. The Jason Dion
// Method applies for any future paid AI-900 practice test (Tutorial Dojo
// post-revision): share gap topics in OWN WORDS only → Claude authors new
// exemplars per gap → original content informed by gap, never reproductions.

window.CERT_PACKS = window.CERT_PACKS || {};
window.CERT_PACKS.ai900 = {
  meta: {
    id: 'ai900',
    name: 'Microsoft Azure AI Fundamentals',
    code: 'AI-900',
    blueprintUrl: 'https://learn.microsoft.com/credentials/certifications/azure-ai-fundamentals/',
    examPassScore: 700,         // AI-900 official pass: 700/1000 (scaled). Universal across all VoC reports.
    examMaxScore: 1000,         // scaled-score ceiling
    examQuestionCount: 45,      // v7.5.0 VoC §7 + §13.8 baked upfront. Range across reports: 45-60 Q;
                                // 45 is the modal value (Pinaslakan 2025-06-20, Abject_Swordfish1872
                                // 2025-05-09 both report 45). 60-Q outliers exist but are post-refresh
                                // edge cases. See plan Appendix C.1.
    examTimeSeconds: 3600,      // 60-minute timer (clock includes T&Cs; ~45-50 min actual answering).
                                // Multiple consistent reports per VoC §7. The "1:05hrs total"
                                // quote (Abject_Swordfish1872) maps to 60-min answering after 5 min
                                // T&C reading.
  },

  // ── PRIORITY RETENTION CONCEPTS (v7.5.0 seed, 8 entries, additive forever) ─
  // Eight concepts seeded from the public Microsoft AI-900 Skills Measured
  // doc (effective 2025-05-02 — the GenAI/Azure AI Foundry refresh) +
  // VoC research (115 Reddit posts + 569 YouTube comments mined 2026-05-27).
  // Founder approved 8 over AZ-900's 4-6 because VoC density is unusually
  // high for this cert + the Foundry rebrand (concepts 4 and 8) is the
  // competitor differentiator that pre-2025 study material misses. Injected
  // as a soft tiebreaker into every question-generation prompt — same
  // mechanism as Net+/Sec+/AZ-900 retentionGapConcepts. Non-invasive: a
  // preference, not a mandate. The array stays open-ended; the founder will
  // append new concepts via Phase 3 cycles after each practice test gap
  // (Sec+ pack pattern, grew 8 → 18 → 26 across 6 cycles).
  retentionGapConcepts: [
    { label: 'Six Responsible AI Principles', parentTopic: 'Responsible AI Principles', objective: '1.3', keyword: 'Microsoft Responsible AI defines SIX principles students must scenario-map under time pressure (VoC §4.1 + §13.4 list this as the #1 explicit advice item across 2025+ passers). FAIRNESS = treat people equitably; avoid bias across demographic groups (the loan/hiring/credit-scoring scenario). RELIABILITY & SAFETY = operate consistently + safely under expected + unexpected conditions (medical-diagnosis + autonomous-vehicle scenarios). PRIVACY & SECURITY = protect data + control access (GDPR-style scenarios). INCLUSIVENESS = empower people across abilities, languages, geographies (accessibility + low-resource-language scenarios). TRANSPARENCY = explain decisions + capabilities (the "black box" rejection scenario; model cards). ACCOUNTABILITY = humans remain responsible for AI systems they design (governance + audit-trail scenarios). Memorize: which principle each scenario VIOLATES. The exam loves "Company X wants their hiring AI to not discriminate against any demographic group — which principle?"' },
    { label: 'Classification vs Regression vs Clustering', parentTopic: 'Common Machine Learning Types', objective: '2.1', keyword: 'The three foundational supervised + unsupervised ML types VoC §1 #13 + §4.2 call out as "if you know these you\'re home free." CLASSIFICATION = predict a CATEGORY (spam/not-spam · cat/dog · churn/no-churn · disease present/absent). Supervised. Output is discrete. Evaluated by accuracy/precision/recall/F1 + confusion matrix. REGRESSION = predict a NUMERIC VALUE (house price · temperature next week · sales for Q4). Supervised. Output is continuous. Evaluated by RMSE/MAE/R². CLUSTERING = group similar items WITHOUT labels (customer segments · document topics · anomaly groupings). Unsupervised. Evaluated by silhouette score / inertia (no ground-truth labels). Memorize the input + output shape: classification predicts WHICH CATEGORY; regression predicts HOW MUCH; clustering finds NATURAL GROUPS. Common trap: "predict whether a customer will buy" sounds like a number but it\'s classification (will-buy vs won\'t-buy = category).' },
    { label: 'Foundation Model vs Fine-tuned Model vs Grounded (RAG) Model', parentTopic: 'Foundation Models vs Fine-tuned Models', objective: '5.2', keyword: 'The three GenAI customization paths VoC §13.3.2 + §C.7 confirm as scenario-tested (multiple high-likes YT comments on "model deployment + fine-tuning"). FOUNDATION MODEL = base pre-trained model (GPT-4, Llama, Phi) used as-is via prompting alone; cheapest, broadest, may hallucinate or miss domain specifics. FINE-TUNING = take a foundation model + train it FURTHER on your labeled dataset to specialize behavior (style, domain vocabulary, structured outputs); expensive, requires curated training data + retraining when data changes, baked into model weights. GROUNDING / RAG (Retrieval-Augmented Generation) = leave the model untouched; at query time, RETRIEVE relevant documents from a knowledge base and inject them into the prompt as context; cheaper than fine-tuning, updates instantly when documents change, the model "knows" your data without learning it. Memorize: fine-tuning CHANGES the model; RAG CHANGES the prompt at query time. Cost ladder: prompting (free) < RAG (storage + retrieval cost) < fine-tuning (training + retraining cost). Scenario test: "company needs the chatbot to cite the latest policy doc" = RAG (not fine-tuning — fine-tuning bakes data into weights at training time).' },
    { label: 'Azure AI Studio → Azure AI Foundry Rebrand (Nov 2024)', parentTopic: 'Azure AI Foundry & Model Catalog', objective: '5.4', keyword: 'The #1 surprise topic per VoC §2.1 + §13.6 + §C.3 S1 — Microsoft RENAMED Azure AI Studio to AZURE AI FOUNDRY in November 2024, then updated the AI-900 Skills Measured on 2025-05-02 to test Foundry by name. Pre-2025 study material (older MS Learn modules, John Savill\'s v1 cram, Tutorial Dojo) still says "Studio"; the live exam since May 2025 says "Foundry." Multiple post-2025 passers report unprompted: "I got caught off guard by Microsoft Foundry questions" + "quite a few Azure AI Foundry questions on the exam." Memorize: AZURE AI FOUNDRY = the unified platform/portal for building, evaluating, deploying GenAI applications (model catalog, project workspaces, evaluation, content safety integration, agent service). Includes the MODEL CATALOG (browse + deploy GPT-4 / Phi / Llama / Mistral / Cohere etc.). If the answer choices include both "Azure AI Studio" and "Azure AI Foundry," Foundry is the current correct term — Studio is the legacy name kept as a distractor in some prep tests. Pre-Foundry: "Azure AI Studio" was the answer. Post-Nov 2024: "Azure AI Foundry" is the answer.' },
    { label: 'Azure AI Services Umbrella (Speech / Language / Vision / Document Intelligence / Content Safety / OpenAI)', parentTopic: 'GenAI Workload Identification', objective: '5.3', keyword: 'AZURE AI SERVICES (formerly Cognitive Services pre-2023 rebrand) = the UMBRELLA brand for Microsoft\'s prebuilt AI APIs. Underneath it sit individual services keyed to workload type: AZURE AI SPEECH = speech-to-text, text-to-speech, speech translation, speaker recognition (Domain 4 NLP/audio). AZURE AI LANGUAGE = text analytics (sentiment, key phrases, entity recognition, summarization, language detection, PII detection, CLU/orchestration) — REPLACES legacy LUIS + QnA Maker (Domain 4 NLP/text). AZURE AI VISION = image analysis, OCR, face detection, spatial analysis (formerly Computer Vision; Domain 3). AZURE AI CUSTOM VISION = train-your-own image classifier/object detector with your labeled images (Domain 3). AZURE AI DOCUMENT INTELLIGENCE (formerly Form Recognizer) = extract structured data from forms/invoices/receipts/IDs (Domain 3, cross-domain). AZURE AI CONTENT SAFETY = detect harmful content (hate, violence, sexual, self-harm) in text + images + prompts + completions (Domain 5 Responsible GenAI). AZURE OPENAI SERVICE = direct API access to GPT-4 / GPT-4o / o-series / embedding models (Domain 5 GenAI). All six are billed through one Azure AI Services resource OR can be deployed individually. Memorize the workload → service mapping; this IS the dominant question type per VoC §3.' },
    { label: 'Confusion Matrix Reading (precision / recall / accuracy without formula memorization)', parentTopic: 'Confusion Matrix & Model Evaluation', objective: '2.5', keyword: 'VoC §4.3 + §C.7 confirm the AI-900 exam tests confusion-matrix READING (visual interpretation) not formula recall. The 2×2 matrix for binary classification: TRUE POSITIVE (predicted positive + actually positive — model got it right on the positive case). TRUE NEGATIVE (predicted negative + actually negative — right on the negative). FALSE POSITIVE (predicted positive + actually negative — TYPE I ERROR, the model "cried wolf"). FALSE NEGATIVE (predicted negative + actually positive — TYPE II ERROR, the model missed a real case). Three metrics derived: ACCURACY = (TP+TN) / total = how often the model is right OVERALL (misleading on imbalanced data). PRECISION = TP / (TP+FP) = of the cases the model FLAGGED, how many were really positive (cost of false alarms). RECALL (sensitivity) = TP / (TP+FN) = of the actual positives, how many did the model FIND (cost of misses). Memorize the trade-off: PRECISION matters when false positives are costly (spam filter — don\'t flag legit emails); RECALL matters when false negatives are costly (cancer screening — catch every case). You won\'t be asked to compute; you\'ll be asked to READ a small matrix and pick which metric matches a scenario.' },
    { label: 'Computer Vision Sub-Types (Image Classification / Object Detection / OCR / Face)', parentTopic: 'Computer Vision Common Solutions', objective: '3.1', keyword: 'The four CV workload sub-types VoC §4.4 + §13.5 list as dominantly tested via service-identification. IMAGE CLASSIFICATION = label an ENTIRE image with one (or more) tags ("this photo contains a cat"). Use case: content tagging, quality control. Azure service: AI Vision (general categories) OR Custom Vision (your own categories with your images). OBJECT DETECTION = find SPECIFIC OBJECTS in an image + return bounding-box coordinates ("there\'s a cat at coords X,Y,W,H and a dog at X2,Y2,W2,H2"). Use case: inventory counting, autonomous driving. Same services with object-detection variants. OCR (Optical Character Recognition) = extract TEXT from images + documents ("the receipt total is $42.18"). Azure service: AI Vision Read API OR Document Intelligence (for structured documents). FACE = detect faces + facial attributes (age, emotion, recognition) + facial verification. Azure service: AI Face (general) — restricted to limited-access customers since 2022 for the recognition-grade features. VoC §13.5 + §C.3 S4 surfaced the OCR-vs-Object-Detection edge case via a street-sign example: "extracting LETTERS = OCR, detecting SHAPES (the sign object itself) = object detection." Quick test: is the answer the TEXT on the thing (OCR) or the thing itself (object detection)?' },
    { label: 'Azure OpenAI vs Azure AI Foundry vs Azure AI Services (Umbrella) vs Cognitive Services (Legacy)', parentTopic: 'Azure OpenAI Service', objective: '5.4', keyword: 'The post-2025 rebrand QUADRANGLE that VoC §3.3 + §13.5 confirm is the biggest service-distinction trip-up. COGNITIVE SERVICES (LEGACY pre-2023 name) = the original umbrella brand for prebuilt AI APIs. Renamed to Azure AI Services in 2023 — but the LEGACY name still appears in older MS Learn modules + some prep tests, so it WILL appear as a distractor. Treat it as historical. AZURE AI SERVICES (CURRENT umbrella) = the current brand for prebuilt AI APIs (Speech, Language, Vision, Document Intelligence, Content Safety, OpenAI — see retention concept #5). The umbrella; pick this when the question asks for the BROAD CATEGORY. AZURE OPENAI SERVICE = a SPECIFIC service under Azure AI Services that hosts OpenAI models (GPT-4, GPT-4o, o-series, embeddings) on Azure-deployed instances with enterprise SLA/security. Pick this when the question names specific GPT models OR requires enterprise-grade OpenAI access. AZURE AI FOUNDRY = the PLATFORM/PORTAL on top of Azure AI Services for building, deploying, evaluating GenAI applications (model catalog, project workspaces, content safety integration, agent service). Includes Azure OpenAI Service AS A FEATURE. Pick this when the question describes a PLATFORM/PORTAL for building GenAI apps OR mentions the model catalog. Memorize the layering: Foundry (platform) → Azure AI Services (umbrella) → Azure OpenAI Service (specific service under the umbrella). Cognitive Services (legacy name for the umbrella). VoC §13.6: "I was caught off guard by Microsoft Foundry features that weren\'t covered in the MS Learn course" — this rebrand quadrangle is THE differentiator.' }
  ],

  // ── DOMAIN WEIGHTS (Microsoft "Skills Measured" AI-900 blueprint) ────────
  // Sums to 1.00 — exact midpoints of the official MS percentage ranges per
  // the May 2, 2025 refresh (15-20% / 20-25% / 15-20% / 15-20% / 20-25%).
  // Same approximation Net+/Sec+ use with 5-domain weighting. Domain 5
  // (GenAI) gets the highest weight reflecting the May 2025 refresh
  // emphasis + VoC §13.3.2 ("New questions are mostly from [GenAI] topic").
  domainWeights: {
    'ai-workloads':      0.175, // Domain 1 — AI Workloads & Considerations (15-20%)
    'ml-fundamentals':   0.225, // Domain 2 — Machine Learning Fundamentals (20-25%, second-largest)
    'computer-vision':   0.175, // Domain 3 — Computer Vision Workloads (15-20%)
    'nlp-workloads':     0.175, // Domain 4 — NLP Workloads (15-20%)
    'genai-workloads':   0.25   // Domain 5 — Generative AI Workloads (20-25%, largest — competitor-gap goldmine)
  },

  domainLabels: {
    'ai-workloads':      'AI Workloads & Considerations',
    'ml-fundamentals':   'Machine Learning Fundamentals',
    'computer-vision':   'Computer Vision Workloads',
    'nlp-workloads':     'NLP Workloads',
    'genai-workloads':   'Generative AI Workloads'
  },

  // ── TOPIC → DOMAIN MAP (40 topics across 5 AI-900 domains) ───────────────
  // Drives weak-spot routing, exemplar bank picker, lottery, readiness
  // domain attribution. Topic name = primary key everywhere; domain key
  // is one of: ai-workloads / ml-fundamentals / computer-vision /
  // nlp-workloads / genai-workloads.
  topicDomains: {
    // ── Domain 1 — AI Workloads & Considerations (15-20%, 7 topics) ──────
    'AI Workload Types':                              'ai-workloads', // 1.1 — predictive, generative, agentic
    'Common AI Workload Examples':                    'ai-workloads', // 1.1 — vision, NLP, knowledge mining
    'Responsible AI Principles':                      'ai-workloads', // 1.3 — the 6-principle cluster
    'AI Workload Guidelines':                         'ai-workloads', // 1.2 — when to use AI, when not to
    'Fairness in AI':                                 'ai-workloads', // 1.3 — bias detection + mitigation
    'Reliability & Safety in AI':                     'ai-workloads', // 1.3 — uptime, hallucination, guardrails
    'Privacy, Security & Inclusiveness in AI':        'ai-workloads', // 1.3 — data protection + accessibility

    // ── Domain 2 — Machine Learning Fundamentals (20-25%, 9 topics) ──────
    'Common Machine Learning Types':                  'ml-fundamentals', // 2.1 — supervised/unsupervised/reinforcement
    'Regression Workloads':                           'ml-fundamentals', // 2.1 — predict continuous values
    'Classification Workloads':                       'ml-fundamentals', // 2.1 — predict categories
    'Clustering Workloads':                           'ml-fundamentals', // 2.1 — unsupervised grouping
    'Deep Learning':                                  'ml-fundamentals', // 2.2 — neural networks, transformers basics
    'Confusion Matrix & Model Evaluation':            'ml-fundamentals', // 2.5 — precision/recall/accuracy reading
    'Core ML Concepts (features, labels, training)':  'ml-fundamentals', // 2.3 — features/labels/train+test split
    'Azure Machine Learning Studio':                  'ml-fundamentals', // 2.4 — the workspace + compute + datasets
    'Automated ML (AutoML)':                          'ml-fundamentals', // 2.4 — code-free model training

    // ── Domain 3 — Computer Vision Workloads (15-20%, 7 topics) ──────────
    'Computer Vision Common Solutions':               'computer-vision', // 3.1 — workload-to-service mapping
    'Image Classification':                           'computer-vision', // 3.1 — whole-image label
    'Object Detection':                               'computer-vision', // 3.1 — bounding boxes per object
    'Optical Character Recognition (OCR)':            'computer-vision', // 3.2 — text extraction from images
    'Facial Detection & Analysis':                    'computer-vision', // 3.2 — face detection + attributes
    'Azure AI Vision (Computer Vision service)':      'computer-vision', // 3.2 — the general-purpose service
    'Azure AI Custom Vision':                         'computer-vision', // 3.2 — train-your-own image model

    // ── Domain 4 — NLP Workloads (15-20%, 7 topics) ──────────────────────
    'NLP Common Solutions':                           'nlp-workloads', // 4.1 — workload-to-service mapping
    'Key Phrase Extraction & Entity Recognition':     'nlp-workloads', // 4.2 — Azure AI Language features
    'Sentiment Analysis':                             'nlp-workloads', // 4.2 — pos/neg/neutral classification
    'Language Modeling':                              'nlp-workloads', // 4.2 — language detection, translation
    'Speech Recognition & Synthesis':                 'nlp-workloads', // 4.3 — speech-to-text + text-to-speech
    'Translation & Transliteration':                  'nlp-workloads', // 4.3 — Azure AI Translator
    'Azure AI Language Service':                      'nlp-workloads', // 4.2 — the umbrella NLP service (replaces LUIS)

    // ── Domain 5 — Generative AI Workloads (20-25%, 10 topics — largest, competitor-gap goldmine) ──
    'Generative AI Common Features':                  'genai-workloads', // 5.1 — what GenAI does + scenarios
    'Foundation Models vs Fine-tuned Models':         'genai-workloads', // 5.2 — base model vs trained variant
    'Prompt & Completion Patterns':                   'genai-workloads', // 5.2 — prompt engineering basics
    'Grounding & RAG (Retrieval-Augmented Generation)': 'genai-workloads', // 5.2 — context injection at query time
    'Responsible Generative AI':                      'genai-workloads', // 5.3 — content moderation, output safety
    'Azure OpenAI Service':                           'genai-workloads', // 5.4 — direct API access to GPT models
    'Azure AI Foundry & Model Catalog':               'genai-workloads', // 5.4 — the platform/portal (Nov 2024 rebrand)
    'Microsoft Copilot & Copilot Studio':             'genai-workloads', // 5.4 — consumer Copilot + builder platform
    'Azure AI Content Safety':                        'genai-workloads', // 5.3 — harmful content detection service
    'GenAI Workload Identification':                  'genai-workloads'  // 5.1 — pick the right service for the scenario
  },

  // ── TOPIC RESOURCES (Microsoft Learn module URLs + AI-900 objectives) ────
  // Per-topic Microsoft Learn module URL + objective number. Source: the
  // public AI-900 learning paths at
  // https://learn.microsoft.com/training/courses/ai-900t00 + the four
  // domain-specific learning paths (Cloud AI fundamentals / ML fundamentals /
  // CV fundamentals / NLP fundamentals / GenAI fundamentals).
  // Used by showTopicDeepDive + per-row Progress-page play buttons.
  topicResources: {
    // Domain 1 — AI Workloads & Considerations
    'AI Workload Types':                              { url: 'https://learn.microsoft.com/training/modules/get-started-ai-fundamentals/', obj: '1.1', label: 'AI workload types' },
    'Common AI Workload Examples':                    { url: 'https://learn.microsoft.com/training/modules/get-started-ai-fundamentals/', obj: '1.1', label: 'Common AI workload examples' },
    'Responsible AI Principles':                      { url: 'https://learn.microsoft.com/training/modules/responsible-ai-principles/', obj: '1.3', label: 'Responsible AI principles' },
    'AI Workload Guidelines':                         { url: 'https://learn.microsoft.com/training/modules/get-started-ai-fundamentals/', obj: '1.2', label: 'AI workload guidelines' },
    'Fairness in AI':                                 { url: 'https://learn.microsoft.com/training/modules/responsible-ai-principles/', obj: '1.3', label: 'Fairness in AI' },
    'Reliability & Safety in AI':                     { url: 'https://learn.microsoft.com/training/modules/responsible-ai-principles/', obj: '1.3', label: 'Reliability & safety' },
    'Privacy, Security & Inclusiveness in AI':        { url: 'https://learn.microsoft.com/training/modules/responsible-ai-principles/', obj: '1.3', label: 'Privacy, security & inclusiveness' },

    // Domain 2 — Machine Learning Fundamentals
    'Common Machine Learning Types':                  { url: 'https://learn.microsoft.com/training/modules/fundamentals-machine-learning/', obj: '2.1', label: 'Common ML types' },
    'Regression Workloads':                           { url: 'https://learn.microsoft.com/training/modules/fundamentals-machine-learning/', obj: '2.1', label: 'Regression workloads' },
    'Classification Workloads':                       { url: 'https://learn.microsoft.com/training/modules/fundamentals-machine-learning/', obj: '2.1', label: 'Classification workloads' },
    'Clustering Workloads':                           { url: 'https://learn.microsoft.com/training/modules/fundamentals-machine-learning/', obj: '2.1', label: 'Clustering workloads' },
    'Deep Learning':                                  { url: 'https://learn.microsoft.com/training/modules/fundamentals-machine-learning/', obj: '2.2', label: 'Deep learning basics' },
    'Confusion Matrix & Model Evaluation':            { url: 'https://learn.microsoft.com/training/modules/fundamentals-machine-learning/', obj: '2.5', label: 'Confusion matrix + evaluation' },
    'Core ML Concepts (features, labels, training)':  { url: 'https://learn.microsoft.com/training/modules/fundamentals-machine-learning/', obj: '2.3', label: 'Core ML concepts' },
    'Azure Machine Learning Studio':                  { url: 'https://learn.microsoft.com/training/modules/fundamentals-azure-ml/', obj: '2.4', label: 'Azure ML Studio' },
    'Automated ML (AutoML)':                          { url: 'https://learn.microsoft.com/training/modules/fundamentals-machine-learning/', obj: '2.4', label: 'Automated ML' },

    // Domain 3 — Computer Vision Workloads
    'Computer Vision Common Solutions':               { url: 'https://learn.microsoft.com/training/modules/analyze-images-computer-vision/', obj: '3.1', label: 'CV common solutions' },
    'Image Classification':                           { url: 'https://learn.microsoft.com/training/modules/classify-images-custom-vision/', obj: '3.1', label: 'Image classification' },
    'Object Detection':                               { url: 'https://learn.microsoft.com/training/modules/detect-objects-images-custom-vision/', obj: '3.1', label: 'Object detection' },
    'Optical Character Recognition (OCR)':            { url: 'https://learn.microsoft.com/training/modules/read-text-images-documents-with-azure-ai-vision/', obj: '3.2', label: 'OCR with Azure AI Vision' },
    'Facial Detection & Analysis':                    { url: 'https://learn.microsoft.com/training/modules/detect-analyze-faces/', obj: '3.2', label: 'Face detection + analysis' },
    'Azure AI Vision (Computer Vision service)':      { url: 'https://learn.microsoft.com/training/modules/analyze-images-computer-vision/', obj: '3.2', label: 'Azure AI Vision' },
    'Azure AI Custom Vision':                         { url: 'https://learn.microsoft.com/training/modules/classify-images-custom-vision/', obj: '3.2', label: 'Azure AI Custom Vision' },

    // Domain 4 — NLP Workloads
    'NLP Common Solutions':                           { url: 'https://learn.microsoft.com/training/modules/analyze-text-with-text-analytics-service/', obj: '4.1', label: 'NLP common solutions' },
    'Key Phrase Extraction & Entity Recognition':     { url: 'https://learn.microsoft.com/training/modules/analyze-text-with-text-analytics-service/', obj: '4.2', label: 'Key phrase + entity recognition' },
    'Sentiment Analysis':                             { url: 'https://learn.microsoft.com/training/modules/analyze-text-with-text-analytics-service/', obj: '4.2', label: 'Sentiment analysis' },
    'Language Modeling':                              { url: 'https://learn.microsoft.com/training/modules/create-language-model-with-language-understanding/', obj: '4.2', label: 'Language modeling' },
    'Speech Recognition & Synthesis':                 { url: 'https://learn.microsoft.com/training/modules/recognize-synthesize-speech/', obj: '4.3', label: 'Speech recognition + synthesis' },
    'Translation & Transliteration':                  { url: 'https://learn.microsoft.com/training/modules/translate-text-with-translator-service/', obj: '4.3', label: 'Translation + transliteration' },
    'Azure AI Language Service':                      { url: 'https://learn.microsoft.com/training/modules/analyze-text-with-text-analytics-service/', obj: '4.2', label: 'Azure AI Language' },

    // Domain 5 — Generative AI Workloads
    'Generative AI Common Features':                  { url: 'https://learn.microsoft.com/training/modules/fundamentals-generative-ai/', obj: '5.1', label: 'GenAI common features' },
    'Foundation Models vs Fine-tuned Models':         { url: 'https://learn.microsoft.com/training/modules/fundamentals-generative-ai/', obj: '5.2', label: 'Foundation vs fine-tuned models' },
    'Prompt & Completion Patterns':                   { url: 'https://learn.microsoft.com/training/modules/fundamentals-generative-ai/', obj: '5.2', label: 'Prompts + completions' },
    'Grounding & RAG (Retrieval-Augmented Generation)': { url: 'https://learn.microsoft.com/training/modules/fundamentals-generative-ai/', obj: '5.2', label: 'Grounding + RAG' },
    'Responsible Generative AI':                      { url: 'https://learn.microsoft.com/training/modules/responsible-generative-ai/', obj: '5.3', label: 'Responsible Generative AI' },
    'Azure OpenAI Service':                           { url: 'https://learn.microsoft.com/training/modules/explore-azure-openai/', obj: '5.4', label: 'Azure OpenAI Service' },
    'Azure AI Foundry & Model Catalog':               { url: 'https://learn.microsoft.com/training/modules/explore-azure-ai-foundry/', obj: '5.4', label: 'Azure AI Foundry' },
    'Microsoft Copilot & Copilot Studio':             { url: 'https://learn.microsoft.com/training/modules/explore-microsoft-copilot/', obj: '5.4', label: 'Microsoft Copilot + Copilot Studio' },
    'Azure AI Content Safety':                        { url: 'https://learn.microsoft.com/training/modules/responsible-generative-ai/', obj: '5.3', label: 'Azure AI Content Safety' },
    'GenAI Workload Identification':                  { url: 'https://learn.microsoft.com/training/modules/fundamentals-generative-ai/', obj: '5.1', label: 'GenAI workload identification' }
  },

  // ── QUESTION EXEMPLARS (200 hand-curated; populated in Stage 6) ──────────
  // Empty array on initial scaffold. Will hold 200 hand-curated exemplars
  // across 5 domains (D1 ~35, D2 ~45, D3 ~35, D4 ~35, D5 ~50). VoC §13.6
  // mandates 10+ Azure AI Foundry exemplars in Domain 5 + 3+ Studio→Foundry
  // rebrand exemplars + 5+ Azure OpenAI vs Foundry distinction exemplars.
  // Same shape as Net+/Sec+/AZ-900 questionExemplars: each entry is
  // { type, question, difficulty, topic, objective, options{A,B,C,D},
  //   answer, explanation, source, addedVersion, addedDate }.
  // Empty array = exemplar-injection step in fetchQuestions is a no-op;
  // Haiku falls back to blueprint + prompt quality alone.
  questionExemplars: []
};

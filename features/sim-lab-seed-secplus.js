/* DRAFT Sec+ PBQ seed scenarios — answers NOT yet founder-verified. Review before ship. */
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
  }
];

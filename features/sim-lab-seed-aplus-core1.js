/* DRAFT A+ Core 1 (220-1201) PBQ seed scenarios — answers NOT yet founder-verified. Review before ship. */
window.SIM_LAB_SEED_APLUS_CORE1 = [
  // ========================================================================
  // ===== Domain 1 — Mobile Devices (~7) ===================================
  // ========================================================================
  {
    id: 'a1-seed-mobile-1', cert: 'aplus-core1', objective: '1.1', topic: 'Mobile Device Hardware & Replacement',
    title: 'Match the laptop component', estMinutes: 4,
    scenario: 'Match each laptop-internal component to its function.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each laptop component with what it does.',
        explanation: 'A SODIMM is the small-form-factor RAM module used in laptops. The inverter supplies high voltage to a CCFL backlight on older LCD panels. The digitizer is the touch-sensing layer over the screen. The Wi-Fi antenna wires run through the hinge into the display lid. The CMOS battery preserves BIOS/UEFI settings and the real-time clock.',
        payload: {
          left: [
            { id: 'sodimm', label: 'SODIMM' },
            { id: 'inverter', label: 'Inverter' },
            { id: 'digitizer', label: 'Digitizer' },
            { id: 'antenna', label: 'Wi-Fi antenna' },
            { id: 'cmos', label: 'CMOS battery' }
          ],
          right: [
            { id: 'dram', label: 'Small-form-factor laptop memory module' },
            { id: 'dbacklight', label: 'Supplies high voltage to a CCFL backlight' },
            { id: 'dtouch', label: 'Touch-sensing layer over the screen' },
            { id: 'dhinge', label: 'Wires routed through the hinge into the lid' },
            { id: 'dclock', label: 'Preserves BIOS settings and the clock' }
          ]
        },
        answer: { pairs: { sodimm: 'dram', inverter: 'dbacklight', digitizer: 'dtouch', antenna: 'dhinge', cmos: 'dclock' } } }
    ]
  },

  {
    id: 'a1-seed-mobile-2', cert: 'aplus-core1', objective: '1.1', topic: 'Mobile Device Hardware & Replacement',
    title: 'Order the laptop display-panel replacement', estMinutes: 5,
    scenario: 'A technician replaces a cracked laptop LCD panel. Put the procedure in order, first step at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the replacement steps in order.',
        explanation: 'Always power down and disconnect the battery first for safety, remove the bezel to expose the panel, disconnect the display data cable and the antenna/Wi-Fi wires routed through the hinge, lift the old panel out, then seat and reconnect the new panel.',
        payload: { items: [
          { id: 'bezel', label: 'Remove the display bezel' },
          { id: 'power', label: 'Power down and disconnect the battery' },
          { id: 'cables', label: 'Disconnect the display data and antenna cables' },
          { id: 'lift', label: 'Lift out the old LCD panel' },
          { id: 'seat', label: 'Seat and reconnect the new panel' }
        ] },
        answer: { correctOrder: ['power', 'bezel', 'cables', 'lift', 'seat'] } }
    ]
  },

  {
    id: 'a1-seed-mobile-3', cert: 'aplus-core1', objective: '1.2', topic: 'Mobile Accessories & Connectivity',
    title: 'Match the mobile connection technology', estMinutes: 4,
    scenario: 'Match each mobile connectivity technology to its defining trait.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each technology with its description.',
        explanation: 'Bluetooth is short-range wireless for peripherals (mice, headsets, wearables). NFC works only at a few centimeters for tap-to-pay and pairing. Hotspot/tethering shares a phone’s cellular data with other devices. Lightning is Apple’s proprietary connector. USB-C is a reversible universal connector that can carry data, power, and video.',
        payload: {
          left: [
            { id: 'bt', label: 'Bluetooth' },
            { id: 'nfc', label: 'NFC' },
            { id: 'hotspot', label: 'Hotspot / tethering' },
            { id: 'lightning', label: 'Lightning' },
            { id: 'usbc', label: 'USB-C' }
          ],
          right: [
            { id: 'dperiph', label: 'Short-range wireless for peripherals' },
            { id: 'dtap', label: 'Works at a few centimeters for tap actions' },
            { id: 'dshare', label: 'Shares cellular data with other devices' },
            { id: 'dapple', label: 'Apple proprietary device connector' },
            { id: 'dreversible', label: 'Reversible connector carrying data, power, and video' }
          ]
        },
        answer: { pairs: { bt: 'dperiph', nfc: 'dtap', hotspot: 'dshare', lightning: 'dapple', usbc: 'dreversible' } } }
    ]
  },

  {
    id: 'a1-seed-mobile-4', cert: 'aplus-core1', objective: '1.3', topic: 'Mobile Network Connectivity',
    title: 'Order the cellular generations by speed', estMinutes: 4,
    scenario: 'Put the cellular generations in order from oldest/slowest to newest/fastest, oldest at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the cellular generations from oldest/slowest to newest/fastest.',
        explanation: 'By generation and speed: 2G (texts/calls, very slow data) → 3G (legacy mobile data, low Mbps) → 4G LTE (mainstream mobile broadband) → 5G (newest, gigabit-class potential, low latency).',
        payload: { items: [
          { id: 'g4', label: '4G LTE' },
          { id: 'g2', label: '2G' },
          { id: 'g5', label: '5G' },
          { id: 'g3', label: '3G' }
        ] },
        answer: { correctOrder: ['g2', 'g3', 'g4', 'g5'] } }
    ]
  },

  {
    id: 'a1-seed-mobile-5', cert: 'aplus-core1', objective: '1.3', topic: 'Mobile Device Management (MDM)',
    title: 'Categorize the MDM action', estMinutes: 4,
    scenario: 'Sort each mobile-device-management capability by the security goal it serves.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each MDM capability under Protect lost device, Control apps, or Enforce access.',
        explanation: 'Remote wipe and remote lock protect a lost or stolen device. An app allow-list and forced app updates control which software runs. A required screen-lock passcode and biometric enrollment enforce access to the device.',
        payload: {
          items: [
            { id: 'wipe', label: 'Remote wipe' },
            { id: 'lock', label: 'Remote lock' },
            { id: 'applist', label: 'App allow-list' },
            { id: 'appupdate', label: 'Force application updates' },
            { id: 'passcode', label: 'Require a screen-lock passcode' },
            { id: 'bio', label: 'Enforce biometric enrollment' }
          ],
          buckets: [
            { id: 'lost', label: 'Protect lost device' },
            { id: 'apps', label: 'Control apps' },
            { id: 'access', label: 'Enforce access' }
          ]
        },
        answer: { map: { wipe: 'lost', lock: 'lost', applist: 'apps', appupdate: 'apps', passcode: 'access', bio: 'access' } } }
    ]
  },

  {
    id: 'a1-seed-mobile-6', cert: 'aplus-core1', objective: '1.3', topic: 'Mobile Synchronization',
    title: 'Match the mobile sync / email setup term', estMinutes: 4,
    scenario: 'Match each mobile email/synchronization term to its meaning.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each term with its meaning.',
        explanation: 'IMAP syncs email across multiple devices, leaving messages on the server. POP3 typically downloads and removes messages from the server. Exchange/ActiveSync syncs corporate mail, calendar, and contacts. Cloud sync (e.g., iCloud / Google) backs up data to a provider. SMTP is the protocol used to send outgoing mail.',
        payload: {
          left: [
            { id: 'imap', label: 'IMAP' },
            { id: 'pop3', label: 'POP3' },
            { id: 'exchange', label: 'Exchange / ActiveSync' },
            { id: 'cloud', label: 'Cloud sync' },
            { id: 'smtp', label: 'SMTP' }
          ],
          right: [
            { id: 'dmultisync', label: 'Syncs mail across devices, leaves it on server' },
            { id: 'ddownload', label: 'Downloads and removes mail from the server' },
            { id: 'dcorp', label: 'Syncs corporate mail, calendar, and contacts' },
            { id: 'dbackup', label: 'Backs up device data to a provider' },
            { id: 'dsend', label: 'Sends outgoing mail' }
          ]
        },
        answer: { pairs: { imap: 'dmultisync', pop3: 'ddownload', exchange: 'dcorp', cloud: 'dbackup', smtp: 'dsend' } } }
    ]
  },

  {
    id: 'a1-seed-mobile-7', cert: 'aplus-core1', objective: '5.4', topic: 'Troubleshoot Mobile Device Issues',
    title: 'Spot the safe response to a swollen battery', estMinutes: 3,
    scenario: 'A user’s laptop is thicker near the trackpad and the case has started to separate. Click the single correct first action.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the correct immediate action.',
        explanation: 'Bulging near the trackpad is a swollen lithium battery off-gassing. The safe action is to stop using and charging it immediately and replace the battery, disposing of it per hazmat rules. Never puncture it, and recalibration or driver updates do not address physical swelling.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Run a full charge/discharge cycle to recalibrate the battery' },
            { id: 'l2', text: 'Stop using and charging the device; replace the swollen battery' },
            { id: 'l3', text: 'Puncture the battery to release the gas, then keep using it' },
            { id: 'l4', text: 'Update the power-management driver and continue normal use' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  // ========================================================================
  // ===== Domain 2 — Networking (~10) ======================================
  // ========================================================================
  {
    id: 'a1-seed-networking-1', cert: 'aplus-core1', objective: '2.1', topic: 'Ports & Protocols',
    title: 'Match the common port to its protocol', estMinutes: 5,
    scenario: 'Match each well-known port number to the protocol that uses it by default.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each port with its protocol.',
        explanation: 'FTP control uses 21. SSH uses 22. SMTP uses 25. DNS uses 53. HTTP uses 80. HTTPS uses 443. RDP uses 3389.',
        payload: {
          left: [
            { id: 'p21', label: '21' },
            { id: 'p22', label: '22' },
            { id: 'p25', label: '25' },
            { id: 'p53', label: '53' },
            { id: 'p80', label: '80' },
            { id: 'p443', label: '443' },
            { id: 'p3389', label: '3389' }
          ],
          right: [
            { id: 'ftp', label: 'FTP (control)' },
            { id: 'ssh', label: 'SSH' },
            { id: 'smtp', label: 'SMTP' },
            { id: 'dns', label: 'DNS' },
            { id: 'http', label: 'HTTP' },
            { id: 'https', label: 'HTTPS' },
            { id: 'rdp', label: 'RDP' }
          ]
        },
        answer: { pairs: { p21: 'ftp', p22: 'ssh', p25: 'smtp', p53: 'dns', p80: 'http', p443: 'https', p3389: 'rdp' } } }
    ]
  },

  {
    id: 'a1-seed-networking-2', cert: 'aplus-core1', objective: '2.1', topic: 'TCP vs UDP',
    title: 'Categorize the protocol by transport', estMinutes: 4,
    scenario: 'Sort each protocol by whether it primarily uses connection-oriented TCP or connectionless UDP.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each protocol under TCP or UDP.',
        explanation: 'HTTPS, SSH, and RDP need reliable ordered delivery, so they use TCP. DHCP, DNS queries, and TFTP favor speed/broadcast over guaranteed delivery, so they use UDP. (DNS uses TCP for large transfers, but standard lookups are UDP — the A+ canonical answer for DNS is UDP.)',
        payload: {
          items: [
            { id: 'https', label: 'HTTPS' },
            { id: 'ssh', label: 'SSH' },
            { id: 'rdp', label: 'RDP' },
            { id: 'dhcp', label: 'DHCP' },
            { id: 'dns', label: 'DNS (standard lookup)' },
            { id: 'tftp', label: 'TFTP' }
          ],
          buckets: [
            { id: 'tcp', label: 'TCP' },
            { id: 'udp', label: 'UDP' }
          ]
        },
        // Reviewed (A+ examiner + SME): confirmed correct.
        answer: { map: { https: 'tcp', ssh: 'tcp', rdp: 'tcp', dhcp: 'udp', dns: 'udp', tftp: 'udp' } } }
    ]
  },

  {
    id: 'a1-seed-networking-3', cert: 'aplus-core1', objective: '2.2', topic: 'Wireless Networking Standards',
    title: 'Match the 802.11 standard to its frequency', estMinutes: 5,
    scenario: 'Match each 802.11 wireless standard to the frequency band(s) it operates on.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each standard with its band(s).',
        explanation: '802.11a uses 5 GHz only. 802.11b and 802.11g use 2.4 GHz only. 802.11n (Wi-Fi 4) uses both 2.4 and 5 GHz. 802.11ac (Wi-Fi 5) uses 5 GHz only. 802.11ax (Wi-Fi 6) uses 2.4 and 5 GHz (dual-band); Wi-Fi 6E extends ax to also include the 6 GHz band, making it tri-band. Wi-Fi 6 and Wi-Fi 6E are distinct: only 6E adds the 6 GHz band.',
        payload: {
          left: [
            { id: 'a', label: '802.11a' },
            { id: 'b', label: '802.11b' },
            { id: 'g', label: '802.11g' },
            { id: 'n', label: '802.11n' },
            { id: 'ac', label: '802.11ac' },
            { id: 'ax', label: '802.11ax / Wi-Fi 6E (adds 6 GHz)' }
          ],
          right: [
            { id: 'r5only', label: '5 GHz only' },
            { id: 'r24b', label: '2.4 GHz only (11 Mbps)' },
            { id: 'r24g', label: '2.4 GHz only (54 Mbps)' },
            { id: 'rdual', label: '2.4 and 5 GHz (Wi-Fi 4)' },
            { id: 'r5ac', label: '5 GHz only (Wi-Fi 5)' },
            { id: 'rtri', label: '2.4, 5, and 6 GHz (tri-band; Wi-Fi 6E)' }
          ]
        },
        answer: { pairs: { a: 'r5only', b: 'r24b', g: 'r24g', n: 'rdual', ac: 'r5ac', ax: 'rtri' } } }
    ]
  },

  {
    id: 'a1-seed-networking-4', cert: 'aplus-core1', objective: '2.2', topic: 'Wireless Frequencies & Channels',
    title: 'Pick the non-overlapping 2.4 GHz channels', estMinutes: 3,
    scenario: 'A SOHO Wi-Fi network on 2.4 GHz suffers interference. Answer about channel planning.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'List the three non-overlapping channels on the 2.4 GHz band (comma-separated, ascending).',
        explanation: 'In the 2.4 GHz band, channels 1, 6, and 11 are the standard non-overlapping channels in North America, spaced far enough apart to avoid co-channel interference.',
        payload: { fields: [{ id: 'channels', label: 'Channels', inputmode: 'text' }] },
        answer: { channels: ['1,6,11', '1, 6, 11', '1 6 11'] } }
    ]
  },

  {
    id: 'a1-seed-networking-5', cert: 'aplus-core1', objective: '2.5', topic: 'Networking Hardware Devices',
    title: 'Match the network device to its job', estMinutes: 4,
    scenario: 'Match each networking hardware device to its primary function.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each device with what it does.',
        explanation: 'A switch forwards frames within a LAN using MAC addresses. A router connects different networks and routes by IP. A wireless access point bridges Wi-Fi clients onto the wired LAN. A firewall filters traffic by rules. A PoE injector adds power to an Ethernet cable for devices like APs and cameras.',
        payload: {
          left: [
            { id: 'switch', label: 'Switch' },
            { id: 'router', label: 'Router' },
            { id: 'ap', label: 'Wireless access point' },
            { id: 'firewall', label: 'Firewall' },
            { id: 'poe', label: 'PoE injector' }
          ],
          right: [
            { id: 'dframes', label: 'Forwards frames in a LAN by MAC address' },
            { id: 'droute', label: 'Connects networks and routes by IP' },
            { id: 'dwifi', label: 'Bridges Wi-Fi clients onto the wired LAN' },
            { id: 'dfilter', label: 'Filters traffic according to rules' },
            { id: 'dpower', label: 'Adds power to an Ethernet cable' }
          ]
        },
        answer: { pairs: { switch: 'dframes', router: 'droute', ap: 'dwifi', firewall: 'dfilter', poe: 'dpower' } } }
    ]
  },

  {
    id: 'a1-seed-networking-6', cert: 'aplus-core1', objective: '2.4', topic: 'DNS Records & Configuration',
    title: 'Match the DNS record type', estMinutes: 4,
    scenario: 'Match each DNS record type to what it does.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each DNS record with its purpose.',
        explanation: 'An A record maps a hostname to an IPv4 address. An AAAA record maps a hostname to an IPv6 address. A CNAME aliases one hostname to another. An MX record identifies the mail server for a domain. A TXT record holds arbitrary text and carries SPF/DKIM/DMARC email-authentication data.',
        payload: {
          left: [
            { id: 'a', label: 'A' },
            { id: 'aaaa', label: 'AAAA' },
            { id: 'cname', label: 'CNAME' },
            { id: 'mx', label: 'MX' },
            { id: 'txt', label: 'TXT' }
          ],
          right: [
            { id: 'dv4', label: 'Maps a hostname to an IPv4 address' },
            { id: 'dv6', label: 'Maps a hostname to an IPv6 address' },
            { id: 'dalias', label: 'Aliases one hostname to another' },
            { id: 'dmail', label: 'Identifies the mail server for a domain' },
            { id: 'dtext', label: 'Holds text incl. SPF/DKIM/DMARC' }
          ]
        },
        answer: { pairs: { a: 'dv4', aaaa: 'dv6', cname: 'dalias', mx: 'dmail', txt: 'dtext' } } }
    ]
  },

  {
    id: 'a1-seed-networking-7', cert: 'aplus-core1', objective: '2.4', topic: 'DNS Records & Configuration',
    title: 'Match the email-authentication record', estMinutes: 4,
    scenario: 'Match each email-authentication mechanism (all published as TXT records) to its role.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each mechanism with its role.',
        explanation: 'SPF lists which servers are allowed to send mail for a domain. DKIM adds a cryptographic signature proving the message was not altered and came from the domain. DMARC is the policy built on top of SPF and DKIM that tells receivers what to do with failures and where to send reports.',
        payload: {
          left: [
            { id: 'spf', label: 'SPF' },
            { id: 'dkim', label: 'DKIM' },
            { id: 'dmarc', label: 'DMARC' }
          ],
          right: [
            { id: 'dallowed', label: 'Lists servers allowed to send for the domain' },
            { id: 'dsign', label: 'Cryptographic signature proving integrity/origin' },
            { id: 'dpolicy', label: 'Enforcement policy tying SPF and DKIM together' }
          ]
        },
        answer: { pairs: { spf: 'dallowed', dkim: 'dsign', dmarc: 'dpolicy' } } }
    ]
  },

  {
    id: 'a1-seed-networking-8', cert: 'aplus-core1', objective: '2.7', topic: 'Internet Connection & Network Types',
    title: 'Categorize the internet connection type', estMinutes: 4,
    scenario: 'Sort each internet connection by its defining characteristic.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each connection under Fastest/lowest latency, Distance-sensitive over phone line, or High latency / available anywhere.',
        explanation: 'Fiber is fastest with the lowest latency. DSL runs over the phone line and is distance-sensitive (slower the farther from the CO). Satellite is available almost anywhere but has high latency due to the long path to a GEO satellite. (Cable is fast but shares neighborhood bandwidth; it is not in this set.)',
        payload: {
          items: [
            { id: 'fiber', label: 'Fiber to the premises' },
            { id: 'dsl', label: 'DSL over a copper phone line' },
            { id: 'satellite', label: 'Geostationary satellite internet' }
          ],
          buckets: [
            { id: 'fast', label: 'Fastest / lowest latency' },
            { id: 'phone', label: 'Distance-sensitive over phone line' },
            { id: 'anywhere', label: 'High latency / available anywhere' }
          ]
        },
        answer: { map: { fiber: 'fast', dsl: 'phone', satellite: 'anywhere' } } }
    ]
  },

  {
    id: 'a1-seed-networking-9', cert: 'aplus-core1', objective: '2.6', topic: 'SOHO Network Configuration',
    title: 'Identify the APIPA address', estMinutes: 3,
    scenario: 'A workstation cannot reach a DHCP server. Answer about the address it self-assigns.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'When DHCP fails, what is the APIPA address range a Windows host self-assigns? (CIDR)',
        explanation: 'APIPA (Automatic Private IP Addressing) assigns an address from 169.254.0.0/16 when no DHCP server responds. A 169.254.x.x address is a strong sign of a DHCP failure.',
        payload: { fields: [{ id: 'apipa', label: 'APIPA range (CIDR)', inputmode: 'text' }] },
        answer: { apipa: ['169.254.0.0/16', '169.254.0.0 /16', '169.254/16'] } }
    ]
  },

  {
    id: 'a1-seed-networking-10', cert: 'aplus-core1', objective: '2.8', topic: 'Networking Tools',
    title: 'Match the networking tool', estMinutes: 4,
    scenario: 'Match each network tech tool to its primary use.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each tool with its use.',
        explanation: 'A cable tester verifies continuity and wiring of a cable run. A crimper attaches RJ45 connectors to cable ends. A punchdown tool seats wires into a patch panel or keystone jack. A toner/probe (tone generator) traces a specific cable in a bundle. A loopback plug tests a port by looping its transmit to its receive.',
        payload: {
          left: [
            { id: 'tester', label: 'Cable tester' },
            { id: 'crimper', label: 'Crimper' },
            { id: 'punch', label: 'Punchdown tool' },
            { id: 'toner', label: 'Toner / probe' },
            { id: 'loopback', label: 'Loopback plug' }
          ],
          right: [
            { id: 'dcontinuity', label: 'Verifies continuity and wiring of a run' },
            { id: 'dconnector', label: 'Attaches RJ45 connectors to cable ends' },
            { id: 'dpanel', label: 'Seats wires into a patch panel / jack' },
            { id: 'dtrace', label: 'Traces a specific cable in a bundle' },
            { id: 'dport', label: 'Tests a port by looping transmit to receive' }
          ]
        },
        answer: { pairs: { tester: 'dcontinuity', crimper: 'dconnector', punch: 'dpanel', toner: 'dtrace', loopback: 'dport' } } }
    ]
  },

  // ========================================================================
  // ===== Domain 3 — Hardware (~13) ========================================
  // ========================================================================
  {
    id: 'a1-seed-hardware-1', cert: 'aplus-core1', objective: '3.3', topic: 'RAM Characteristics',
    title: 'Categorize the RAM module', estMinutes: 4,
    scenario: 'Sort each memory term by form factor: desktop DIMM or laptop SODIMM.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each module under Desktop DIMM or Laptop SODIMM.',
        explanation: 'Full-size DIMMs (DDR3 DIMM, DDR4 DIMM, DDR5 DIMM) go in desktops. SODIMMs (DDR3 SODIMM, DDR4 SODIMM, DDR5 SODIMM) are the smaller modules used in laptops and small-form-factor systems.',
        payload: {
          items: [
            { id: 'ddr3dimm', label: 'DDR3 DIMM' },
            { id: 'ddr4dimm', label: 'DDR4 DIMM' },
            { id: 'ddr5dimm', label: 'DDR5 DIMM' },
            { id: 'ddr3so', label: 'DDR3 SODIMM' },
            { id: 'ddr4so', label: 'DDR4 SODIMM' },
            { id: 'ddr5so', label: 'DDR5 SODIMM' }
          ],
          buckets: [
            { id: 'dimm', label: 'Desktop DIMM' },
            { id: 'sodimm', label: 'Laptop SODIMM' }
          ]
        },
        answer: { map: { ddr3dimm: 'dimm', ddr4dimm: 'dimm', ddr5dimm: 'dimm', ddr3so: 'sodimm', ddr4so: 'sodimm', ddr5so: 'sodimm' } } }
    ]
  },

  {
    id: 'a1-seed-hardware-2', cert: 'aplus-core1', objective: '3.3', topic: 'RAM Characteristics',
    title: 'Match the RAM feature', estMinutes: 4,
    scenario: 'Match each RAM-related feature to its description.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each RAM feature with its description.',
        explanation: 'ECC RAM detects and corrects single-bit memory errors, common in servers. Dual-channel uses two matched modules to widen the memory bus. Registered/buffered (RDIMM) memory adds a register for stability in servers. A SODIMM is the small laptop module. DDR generations are not cross-compatible — a DDR4 module will not fit a DDR5 slot.',
        payload: {
          left: [
            { id: 'ecc', label: 'ECC' },
            { id: 'dual', label: 'Dual-channel' },
            { id: 'reg', label: 'Registered (RDIMM)' },
            { id: 'sodimm', label: 'SODIMM' },
            { id: 'incompat', label: 'DDR generation keying' }
          ],
          right: [
            { id: 'dcorrect', label: 'Detects and corrects single-bit errors' },
            { id: 'dwiden', label: 'Two matched modules widen the bus' },
            { id: 'dbuffer', label: 'Adds a register for server stability' },
            { id: 'dlaptop', label: 'Small module used in laptops' },
            { id: 'dnofit', label: 'A DDR4 module will not fit a DDR5 slot' }
          ]
        },
        answer: { pairs: { ecc: 'dcorrect', dual: 'dwiden', reg: 'dbuffer', sodimm: 'dlaptop', incompat: 'dnofit' } } }
    ]
  },

  {
    id: 'a1-seed-hardware-3', cert: 'aplus-core1', objective: '3.2', topic: 'Network Cable Types & Connectors',
    title: 'Categorize the twisted-pair / fiber cable', estMinutes: 4,
    scenario: 'Sort each cabling option by category: copper twisted-pair or fiber.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each cable under Copper twisted-pair or Fiber-optic.',
        explanation: 'Cat 5e, Cat 6, and Cat 6a are copper twisted-pair Ethernet cables. Single-mode fiber (SMF) and multimode fiber (MMF) are fiber-optic. MMF has a larger core (50 or 62.5 µm) that supports multiple propagation modes simultaneously; the resulting modal dispersion limits it to shorter distances (typically up to ~550 m at 10 Gbps). SMF has a narrow core (8–9 µm) that carries only a single mode of light, eliminating modal dispersion and enabling very long distances (kilometers to tens of kilometers).',
        payload: {
          items: [
            { id: 'cat5e', label: 'Cat 5e' },
            { id: 'cat6', label: 'Cat 6' },
            { id: 'cat6a', label: 'Cat 6a' },
            { id: 'smf', label: 'Single-mode fiber (SMF)' },
            { id: 'mmf', label: 'Multimode fiber (MMF)' }
          ],
          buckets: [
            { id: 'copper', label: 'Copper twisted-pair' },
            { id: 'fiber', label: 'Fiber-optic' }
          ]
        },
        answer: { map: { cat5e: 'copper', cat6: 'copper', cat6a: 'copper', smf: 'fiber', mmf: 'fiber' } } }
    ]
  },

  {
    id: 'a1-seed-hardware-4', cert: 'aplus-core1', objective: '3.2', topic: 'Peripheral & Video Cables',
    title: 'Match the cable / connector to its use', estMinutes: 5,
    scenario: 'Match each cable or connector to what it primarily carries or connects.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each connector with its use.',
        explanation: 'HDMI carries digital audio and video. DisplayPort carries digital video (and audio), common on PCs. SATA connects internal storage drives. RJ45 terminates Ethernet network cable. RJ11 terminates a telephone/DSL line. Thunderbolt carries data, video, and power (often over a USB-C connector).',
        payload: {
          left: [
            { id: 'hdmi', label: 'HDMI' },
            { id: 'dp', label: 'DisplayPort' },
            { id: 'sata', label: 'SATA' },
            { id: 'rj45', label: 'RJ45' },
            { id: 'rj11', label: 'RJ11' },
            { id: 'tb', label: 'Thunderbolt' }
          ],
          right: [
            { id: 'dav', label: 'Digital audio and video' },
            { id: 'dpcvideo', label: 'Digital video, common on PCs' },
            { id: 'dstorage', label: 'Connects internal storage drives' },
            { id: 'deth', label: 'Terminates Ethernet network cable' },
            { id: 'dphone', label: 'Terminates a telephone / DSL line' },
            { id: 'dmulti', label: 'Data, video, and power over one cable' }
          ]
        },
        answer: { pairs: { hdmi: 'dav', dp: 'dpcvideo', sata: 'dstorage', rj45: 'deth', rj11: 'dphone', tb: 'dmulti' } } }
    ]
  },

  {
    id: 'a1-seed-hardware-5', cert: 'aplus-core1', objective: '3.4', topic: 'Storage Devices',
    title: 'Match the storage interface / form factor', estMinutes: 4,
    scenario: 'Match each storage interface or form factor to its description.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each storage term with its description.',
        explanation: 'SATA is the common interface for 2.5-inch SSDs and 3.5-inch hard drives (~6 Gbps). M.2 is a slot form factor that can run SATA or NVMe. NVMe is a high-speed protocol that runs over PCIe lanes. PCIe is the high-bandwidth expansion bus NVMe uses. An HDD is a spinning magnetic disk with moving parts.',
        payload: {
          left: [
            { id: 'sata', label: 'SATA' },
            { id: 'm2', label: 'M.2' },
            { id: 'nvme', label: 'NVMe' },
            { id: 'pcie', label: 'PCIe' },
            { id: 'hdd', label: 'HDD' }
          ],
          right: [
            { id: 'dsata', label: 'Common interface for SSDs and hard drives' },
            { id: 'dslot', label: 'Slot form factor (can be SATA or NVMe)' },
            { id: 'dproto', label: 'High-speed protocol running over PCIe' },
            { id: 'dbus', label: 'High-bandwidth expansion bus' },
            { id: 'dspin', label: 'Spinning magnetic disk with moving parts' }
          ]
        },
        answer: { pairs: { sata: 'dsata', m2: 'dslot', nvme: 'dproto', pcie: 'dbus', hdd: 'dspin' } } }
    ]
  },

  {
    id: 'a1-seed-hardware-6', cert: 'aplus-core1', objective: '3.4', topic: 'RAID Configurations',
    title: 'Match the RAID level', estMinutes: 5,
    scenario: 'Match each RAID level to its defining behavior.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each RAID level with its behavior.',
        explanation: 'RAID 0 stripes for speed/capacity with no redundancy (one disk fails = all data lost). RAID 1 mirrors two disks (survives one failure, 50% usable). RAID 5 stripes with distributed parity across 3+ disks (survives one failure, capacity = n-1). RAID 6 uses double parity across 4+ disks (survives two failures). RAID 10 (1+0): stripe across mirrored pairs — survives multiple failures as long as both disks of any one mirror do not fail together (4+ disks, best performance + redundancy combo).',
        payload: {
          left: [
            { id: 'r0', label: 'RAID 0' },
            { id: 'r1', label: 'RAID 1' },
            { id: 'r5', label: 'RAID 5' },
            { id: 'r6', label: 'RAID 6' },
            { id: 'r10', label: 'RAID 10' }
          ],
          right: [
            { id: 'dstripe', label: 'Striping, no redundancy (one fail = all lost)' },
            { id: 'dmirror', label: 'Mirroring two disks (survives one failure)' },
            { id: 'dparity', label: 'Striping + single parity, 3+ disks' },
            { id: 'ddouble', label: 'Striping + double parity, survives two failures' },
            { id: 'dnest', label: 'Mirrored then striped, performance + redundancy' }
          ]
        },
        answer: { pairs: { r0: 'dstripe', r1: 'dmirror', r5: 'dparity', r6: 'ddouble', r10: 'dnest' } } }
    ]
  },

  {
    id: 'a1-seed-hardware-7', cert: 'aplus-core1', objective: '3.5', topic: 'Motherboards & Form Factors',
    title: 'Categorize the motherboard form factor by size', estMinutes: 4,
    scenario: 'Sort each motherboard form factor from largest to smallest by ordering them.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the form factors from largest to smallest, largest at the top.',
        explanation: 'By physical size, largest to smallest: ATX (standard full size) > microATX (mATX) > Mini-ITX (small form factor). ATX has the most expansion slots; Mini-ITX is the smallest with typically one expansion slot.',
        payload: { items: [
          { id: 'matx', label: 'microATX (mATX)' },
          { id: 'atx', label: 'ATX' },
          { id: 'itx', label: 'Mini-ITX' }
        ] },
        answer: { correctOrder: ['atx', 'matx', 'itx'] } }
    ]
  },

  {
    id: 'a1-seed-hardware-8', cert: 'aplus-core1', objective: '3.5', topic: 'Expansion Cards & Cooling',
    title: 'Match the expansion card / cooling component', estMinutes: 4,
    scenario: 'Match each expansion or cooling component to its purpose.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each component with its purpose.',
        explanation: 'A GPU/video card renders graphics output. A sound card processes audio. A NIC adds wired/wireless network connectivity. A heat sink passively dissipates CPU heat. Thermal paste fills microscopic gaps between the CPU and heat sink to improve heat transfer.',
        payload: {
          left: [
            { id: 'gpu', label: 'Video card (GPU)' },
            { id: 'sound', label: 'Sound card' },
            { id: 'nic', label: 'NIC' },
            { id: 'heatsink', label: 'Heat sink' },
            { id: 'paste', label: 'Thermal paste' }
          ],
          right: [
            { id: 'dgraphics', label: 'Renders graphics output' },
            { id: 'daudio', label: 'Processes audio' },
            { id: 'dnet', label: 'Adds network connectivity' },
            { id: 'ddissipate', label: 'Passively dissipates CPU heat' },
            { id: 'dtransfer', label: 'Improves heat transfer to the heat sink' }
          ]
        },
        answer: { pairs: { gpu: 'dgraphics', sound: 'daudio', nic: 'dnet', heatsink: 'ddissipate', paste: 'dtransfer' } } }
    ]
  },

  {
    id: 'a1-seed-hardware-9', cert: 'aplus-core1', objective: '3.5', topic: 'CPUs & BIOS/UEFI',
    title: 'Match the CPU / firmware concept', estMinutes: 4,
    scenario: 'Match each CPU or firmware concept to its description.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each concept with its description.',
        explanation: 'Multithreading (SMT/Hyper-Threading) lets one core handle two threads. Virtualization support (VT-x/AMD-V) is a CPU feature enabled in firmware to run VMs. UEFI is modern firmware that replaces legacy BIOS and supports GPT/secure boot. The TPM stores cryptographic keys for features like disk encryption. Overclocking raises clock speed above the rated default.',
        payload: {
          left: [
            { id: 'smt', label: 'Multithreading' },
            { id: 'virt', label: 'Virtualization support' },
            { id: 'uefi', label: 'UEFI' },
            { id: 'tpm', label: 'TPM' },
            { id: 'oc', label: 'Overclocking' }
          ],
          right: [
            { id: 'dthreads', label: 'One core handles two threads' },
            { id: 'dvm', label: 'CPU feature enabling VMs' },
            { id: 'dfirmware', label: 'Modern firmware replacing legacy BIOS' },
            { id: 'dkeys', label: 'Stores cryptographic keys for encryption' },
            { id: 'dclock', label: 'Raises clock speed above the default' }
          ]
        },
        answer: { pairs: { smt: 'dthreads', virt: 'dvm', uefi: 'dfirmware', tpm: 'dkeys', oc: 'dclock' } } }
    ]
  },

  {
    id: 'a1-seed-hardware-10', cert: 'aplus-core1', objective: '3.6', topic: 'Power Supplies',
    title: 'Match the power-supply concept', estMinutes: 4,
    scenario: 'Match each power-supply term to its meaning.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each PSU term with its meaning.',
        explanation: 'Wattage is the total power a PSU can deliver. The 24-pin connector powers the motherboard. The 8-pin EPS/CPU connector powers the processor. PCIe power connectors feed a discrete GPU. A modular PSU lets you attach only the cables you need. Input voltage selection (115/230V) matches the regional mains.',
        payload: {
          left: [
            { id: 'watt', label: 'Wattage rating' },
            { id: 'p24', label: '24-pin connector' },
            { id: 'eps', label: '8-pin EPS connector' },
            { id: 'pcie', label: 'PCIe power connector' },
            { id: 'modular', label: 'Modular PSU' }
          ],
          right: [
            { id: 'dtotal', label: 'Total power the PSU can deliver' },
            { id: 'dmobo', label: 'Powers the motherboard' },
            { id: 'dcpu', label: 'Powers the processor' },
            { id: 'dgpu', label: 'Feeds a discrete graphics card' },
            { id: 'dcables', label: 'Attach only the cables you need' }
          ]
        },
        answer: { pairs: { watt: 'dtotal', p24: 'dmobo', eps: 'dcpu', pcie: 'dgpu', modular: 'dcables' } } }
    ]
  },

  {
    id: 'a1-seed-hardware-11', cert: 'aplus-core1', objective: '3.7', topic: 'Printers — Deploy & Configure',
    title: 'Categorize the printer technology', estMinutes: 4,
    scenario: 'Sort each printer characteristic by the print technology it belongs to.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each item under Laser, Inkjet, Thermal, or Impact.',
        explanation: 'A laser printer uses a toner cartridge and fuser. An inkjet sprays liquid ink from a printhead. A thermal printer uses heat on special heat-sensitive paper. An impact (dot-matrix) printer strikes a ribbon through a print head and is used for multipart (carbon-copy) forms.',
        payload: {
          items: [
            { id: 'toner', label: 'Toner cartridge and fuser' },
            { id: 'ink', label: 'Liquid ink sprayed from a printhead' },
            { id: 'heatpaper', label: 'Heat applied to heat-sensitive paper' },
            { id: 'ribbon', label: 'Pins strike a ribbon for multipart forms' }
          ],
          buckets: [
            { id: 'laser', label: 'Laser' },
            { id: 'inkjet', label: 'Inkjet' },
            { id: 'thermal', label: 'Thermal' },
            { id: 'impact', label: 'Impact' }
          ]
        },
        answer: { map: { toner: 'laser', ink: 'inkjet', heatpaper: 'thermal', ribbon: 'impact' } } }
    ]
  },

  {
    id: 'a1-seed-hardware-12', cert: 'aplus-core1', objective: '3.7', topic: 'Printers — Deploy & Configure',
    title: 'Order the laser printing process', estMinutes: 5,
    scenario: 'Put the seven steps of the laser imaging process in order, first step at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the laser printing steps in order.',
        explanation: 'The CompTIA laser imaging process is: Processing, Charging, Exposing, Developing, Transferring, Fusing, Cleaning. The drum is charged, the laser exposes the image, toner is developed onto it, transferred to paper, fused with heat, and the drum is cleaned.',
        payload: { items: [
          { id: 'charge', label: 'Charging' },
          { id: 'process', label: 'Processing' },
          { id: 'expose', label: 'Exposing' },
          { id: 'transfer', label: 'Transferring' },
          { id: 'develop', label: 'Developing' },
          { id: 'clean', label: 'Cleaning' },
          { id: 'fuse', label: 'Fusing' }
        ] },
        // Reviewed (A+ examiner + SME): confirmed correct.
        answer: { correctOrder: ['process', 'charge', 'expose', 'develop', 'transfer', 'fuse', 'clean'] } }
    ]
  },

  {
    id: 'a1-seed-hardware-13', cert: 'aplus-core1', objective: '3.1', topic: 'Display Components & Attributes',
    title: 'Categorize the display panel technology', estMinutes: 4,
    scenario: 'Sort each statement by the display panel technology it describes.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each statement under IPS, TN, or OLED.',
        explanation: 'IPS panels offer the best color and the widest viewing angles. TN panels are cheaper with fast response time but weaker viewing angles. OLED uses per-pixel lighting for true blacks but is prone to burn-in from static content.',
        payload: {
          items: [
            { id: 'angles', label: 'Best color and widest viewing angles' },
            { id: 'cheapfast', label: 'Cheapest with the fastest response time' },
            { id: 'weakangle', label: 'Poor color shift at off angles' },
            { id: 'trueblack', label: 'Per-pixel lighting gives true blacks' },
            { id: 'burnin', label: 'Prone to burn-in from static content' }
          ],
          buckets: [
            { id: 'ips', label: 'IPS' },
            { id: 'tn', label: 'TN' },
            { id: 'oled', label: 'OLED' }
          ]
        },
        answer: { map: { angles: 'ips', cheapfast: 'tn', weakangle: 'tn', trueblack: 'oled', burnin: 'oled' } } }
    ]
  },

  // ========================================================================
  // ===== Domain 4 — Virtualization & Cloud (~6) ===========================
  // ========================================================================
  {
    id: 'a1-seed-virtcloud-1', cert: 'aplus-core1', objective: '4.2', topic: 'Cloud Service Models',
    title: 'Categorize the cloud service model', estMinutes: 4,
    scenario: 'Sort each scenario by the cloud service model it best matches.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each scenario under IaaS, PaaS, or SaaS.',
        explanation: 'IaaS rents raw infrastructure — the customer manages the OS and apps (full OS control to install drivers). PaaS provides a managed platform — the customer deploys code without managing the OS or patching servers. SaaS delivers finished software the customer just uses via a browser (email with no install).',
        payload: {
          items: [
            { id: 'oscontrol', label: 'Need full OS control to install custom drivers' },
            { id: 'deploycode', label: 'Deploy code without managing the OS or patching' },
            { id: 'email', label: 'Users just need email, nothing to install' },
            { id: 'rentvm', label: 'Rent VMs, storage, and network from a provider' },
            { id: 'salesforce', label: 'Use a CRM app entirely through a web browser' }
          ],
          buckets: [
            { id: 'iaas', label: 'IaaS' },
            { id: 'paas', label: 'PaaS' },
            { id: 'saas', label: 'SaaS' }
          ]
        },
        answer: { map: { oscontrol: 'iaas', deploycode: 'paas', email: 'saas', rentvm: 'iaas', salesforce: 'saas' } } }
    ]
  },

  {
    id: 'a1-seed-virtcloud-2', cert: 'aplus-core1', objective: '4.2', topic: 'Cloud Deployment Models',
    title: 'Match the cloud deployment model', estMinutes: 4,
    scenario: 'Match each cloud deployment model to its description.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each deployment model with its description.',
        explanation: 'Public cloud is shared multi-tenant infrastructure owned by a provider (least control, lowest cost). Private cloud is dedicated to one organization (most control and cost). Hybrid cloud combines public and private with orchestration between them. Community cloud is shared by several organizations with common concerns (e.g., compliance).',
        payload: {
          left: [
            { id: 'public', label: 'Public' },
            { id: 'private', label: 'Private' },
            { id: 'hybrid', label: 'Hybrid' },
            { id: 'community', label: 'Community' }
          ],
          right: [
            { id: 'dshared', label: 'Shared multi-tenant; lowest cost, least control' },
            { id: 'ddedicated', label: 'Dedicated to one org; most control and cost' },
            { id: 'dcombo', label: 'Combines public and private with orchestration' },
            { id: 'dgroup', label: 'Shared by orgs with common concerns' }
          ]
        },
        answer: { pairs: { public: 'dshared', private: 'ddedicated', hybrid: 'dcombo', community: 'dgroup' } } }
    ]
  },

  {
    id: 'a1-seed-virtcloud-3', cert: 'aplus-core1', objective: '4.2', topic: 'Cloud Characteristics',
    title: 'Match the cloud characteristic', estMinutes: 4,
    scenario: 'Match each NIST-style cloud characteristic to the scenario that describes it.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each characteristic with the scenario.',
        explanation: 'Rapid elasticity auto-scales resources up and down with demand. On-demand self-service lets you provision without a human ticket. Metered/measured utilization bills only for what you consume. Resource pooling serves many tenants from a shared pool. High availability provides redundancy across zones.',
        payload: {
          left: [
            { id: 'elastic', label: 'Rapid elasticity' },
            { id: 'ondemand', label: 'On-demand self-service' },
            { id: 'metered', label: 'Metered utilization' },
            { id: 'pooling', label: 'Resource pooling' },
            { id: 'ha', label: 'High availability' }
          ],
          right: [
            { id: 'dscale', label: 'Auto-scales up and down with traffic' },
            { id: 'dselfprov', label: 'Provision resources without IT involvement' },
            { id: 'dpay', label: 'Pay only for what you consume' },
            { id: 'dshared', label: 'Many tenants share a dynamic resource pool' },
            { id: 'dredundant', label: 'Redundancy across zones for uptime' }
          ]
        },
        answer: { pairs: { elastic: 'dscale', ondemand: 'dselfprov', metered: 'dpay', pooling: 'dshared', ha: 'dredundant' } } }
    ]
  },

  {
    id: 'a1-seed-virtcloud-4', cert: 'aplus-core1', objective: '4.1', topic: 'Virtualization Concepts',
    title: 'Match the virtualization term', estMinutes: 4,
    scenario: 'Match each virtualization term to its meaning.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each term with its meaning.',
        explanation: 'A hypervisor creates and runs virtual machines. A Type 1 (bare-metal) hypervisor runs directly on hardware. A Type 2 (hosted) hypervisor runs on top of a host OS. A guest OS is the operating system inside a VM. A snapshot captures a VM’s state so it can be rolled back.',
        payload: {
          left: [
            { id: 'hyper', label: 'Hypervisor' },
            { id: 't1', label: 'Type 1 hypervisor' },
            { id: 't2', label: 'Type 2 hypervisor' },
            { id: 'guest', label: 'Guest OS' },
            { id: 'snap', label: 'Snapshot' }
          ],
          right: [
            { id: 'dcreate', label: 'Creates and runs virtual machines' },
            { id: 'dbare', label: 'Runs directly on the hardware' },
            { id: 'dhosted', label: 'Runs on top of a host OS' },
            { id: 'dinside', label: 'The OS running inside a VM' },
            { id: 'drollback', label: 'Captures VM state for rollback' }
          ]
        },
        answer: { pairs: { hyper: 'dcreate', t1: 'dbare', t2: 'dhosted', guest: 'dinside', snap: 'drollback' } } }
    ]
  },

  {
    id: 'a1-seed-virtcloud-5', cert: 'aplus-core1', objective: '4.1', topic: 'Containers & VDI',
    title: 'Categorize VM vs container vs VDI', estMinutes: 4,
    scenario: 'Sort each statement by what it describes: a virtual machine, a container, or VDI.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each statement under Virtual machine, Container, or VDI.',
        explanation: 'A virtual machine includes a full guest OS on a hypervisor. A container packages an app with its dependencies and shares the host OS kernel (lighter than a VM). VDI (Virtual Desktop Infrastructure) hosts user desktops centrally and streams them to thin clients.',
        payload: {
          items: [
            { id: 'fullos', label: 'Includes a full guest OS on a hypervisor' },
            { id: 'sharekernel', label: 'Shares the host OS kernel; very lightweight' },
            { id: 'appdeps', label: 'Packages an app with its dependencies' },
            { id: 'desktops', label: 'Hosts user desktops centrally, streamed to clients' }
          ],
          buckets: [
            { id: 'vm', label: 'Virtual machine' },
            { id: 'container', label: 'Container' },
            { id: 'vdi', label: 'VDI' }
          ]
        },
        answer: { map: { fullos: 'vm', sharekernel: 'container', appdeps: 'container', desktops: 'vdi' } } }
    ]
  },

  {
    id: 'a1-seed-virtcloud-6', cert: 'aplus-core1', objective: '4.1', topic: 'Virtualization Concepts',
    title: 'Size the VM host resources', estMinutes: 4,
    scenario: 'A host has 64 GB RAM. The hypervisor reserves 8 GB. You plan VMs each requiring 8 GB. Answer both fields.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'How much RAM (in GB) is available for guest VMs after the hypervisor reservation?',
        explanation: '64 GB total minus the 8 GB hypervisor reservation leaves 56 GB available for guests.',
        payload: { fields: [{ id: 'avail', label: 'Available RAM (GB)', inputmode: 'numeric' }] },
        answer: { avail: ['56', '56GB', '56 GB'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'Without overcommitting, how many 8 GB VMs can you run?',
        explanation: '56 GB available / 8 GB per VM = 7 VMs without overcommitting memory.',
        payload: { fields: [{ id: 'vms', label: 'Number of VMs', inputmode: 'numeric' }] },
        answer: { vms: ['7'] } }
    ]
  },

  // ========================================================================
  // ===== Domain 5 — Hardware & Network Troubleshooting (~14) ==============
  // ========================================================================
  {
    id: 'a1-seed-troubleshooting-1', cert: 'aplus-core1', objective: '5.1', topic: 'Troubleshooting Methodology',
    title: 'Order the CompTIA 6-step troubleshooting method', estMinutes: 5,
    scenario: 'Put the six steps of the CompTIA troubleshooting methodology in order, first step at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the six troubleshooting steps in order.',
        explanation: 'CompTIA’s method: (1) Identify the problem; (2) Establish a theory of probable cause; (3) Test the theory to determine cause; (4) Establish a plan of action and implement the solution; (5) Verify full system functionality and implement preventive measures; (6) Document findings, actions, and outcomes.',
        payload: { items: [
          { id: 'theory', label: 'Establish a theory of probable cause' },
          { id: 'identify', label: 'Identify the problem' },
          { id: 'document', label: 'Document findings, actions, and outcomes' },
          { id: 'test', label: 'Test the theory to determine cause' },
          { id: 'verify', label: 'Verify functionality and prevent recurrence' },
          { id: 'plan', label: 'Establish a plan of action and implement it' }
        ] },
        answer: { correctOrder: ['identify', 'theory', 'test', 'plan', 'verify', 'document'] } }
    ]
  },

  {
    id: 'a1-seed-troubleshooting-2', cert: 'aplus-core1', objective: '5.1', topic: 'Troubleshoot Motherboards, RAM & CPUs',
    title: 'Diagnose POST and no-boot symptoms', estMinutes: 4,
    scenario: 'A PC shows symptoms below. Click the single symptom that most clearly points to a RAM problem.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the symptom that most clearly indicates faulty RAM.',
        explanation: 'Repeated beep codes at POST with no display, especially with the system failing to boot, classically indicates a memory fault (or unseated module). A clicking drive points to a failing HDD, a burning smell to the PSU, and continuous reboots after the OS loads to other causes.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'POST emits repeated beep codes and no video appears' },
            { id: 'l2', text: 'A rhythmic clicking sound comes from the hard drive' },
            { id: 'l3', text: 'A faint burning smell near the power supply' },
            { id: 'l4', text: 'The OS loads fully, then reboots after 20 minutes' }
          ]
        },
        answer: { selected: ['l1'] } }
    ]
  },

  {
    id: 'a1-seed-troubleshooting-3', cert: 'aplus-core1', objective: '5.1', topic: 'Troubleshoot Power Issues',
    title: 'Diagnose the dead system', estMinutes: 4,
    scenario: 'A desktop is completely dead — no fans, no lights, no POST. Order the checks from first/simplest to last.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the power checks from first to last.',
        explanation: 'Start with the simplest and most likely: confirm the wall outlet has power, then the PSU voltage switch and power cable, then the front-panel power button header, and finally test/replace the PSU itself. Work cheapest and simplest first.',
        payload: { items: [
          { id: 'switch', label: 'Check the PSU voltage switch and power cable' },
          { id: 'outlet', label: 'Confirm the wall outlet has power' },
          { id: 'psu', label: 'Test or replace the power supply' },
          { id: 'button', label: 'Check the front-panel power button header' }
        ] },
        answer: { correctOrder: ['outlet', 'switch', 'button', 'psu'] } }
    ]
  },

  {
    id: 'a1-seed-troubleshooting-4', cert: 'aplus-core1', objective: '5.2', topic: 'Troubleshoot Drives & RAID',
    title: 'Respond to a degraded RAID array', estMinutes: 4,
    scenario: 'A RAID 5 array reports one failed member disk but is still serving data. Click the single correct next action.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the correct next action for the degraded RAID 5 array.',
        explanation: 'RAID 5 survives one disk failure and runs degraded. The correct action is to replace the failed disk so the array can rebuild from parity. The array has no further fault tolerance until the rebuild completes, so act promptly — do not wipe or ignore it.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Replace the failed disk and let the array rebuild from parity' },
            { id: 'l2', text: 'Delete the array and restore everything from backup immediately' },
            { id: 'l3', text: 'Do nothing; RAID 5 tolerates a second failure too' },
            { id: 'l4', text: 'Convert the array to RAID 0 to recover speed' }
          ]
        },
        answer: { selected: ['l1'] } }
    ]
  },

  {
    id: 'a1-seed-troubleshooting-5', cert: 'aplus-core1', objective: '5.2', topic: 'Troubleshoot Drives & RAID',
    title: 'Match the drive symptom to the cause', estMinutes: 4,
    scenario: 'Match each storage symptom to its most likely cause.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each symptom with its most likely cause.',
        explanation: 'A clicking/grinding noise indicates failing HDD mechanics. Frequent S.M.A.R.T. warnings signal an imminent drive failure. Extremely slow reads with no errors suggest fragmentation or a dying drive. "Drive not detected" in BIOS often means a loose/failed data or power cable. The blue screen "boot device not found" means no bootable volume is seen.',
        payload: {
          left: [
            { id: 'click', label: 'Clicking / grinding noise' },
            { id: 'smart', label: 'Frequent S.M.A.R.T. warnings' },
            { id: 'notdetected', label: '"Drive not detected" in BIOS' },
            { id: 'nobootdev', label: '"Boot device not found"' }
          ],
          right: [
            { id: 'dmech', label: 'Failing HDD mechanical components' },
            { id: 'dimminent', label: 'Imminent drive failure indicator' },
            { id: 'dcable', label: 'Loose or failed data/power cable' },
            { id: 'dnoboot', label: 'No bootable volume detected' }
          ]
        },
        answer: { pairs: { click: 'dmech', smart: 'dimminent', notdetected: 'dcable', nobootdev: 'dnoboot' } } }
    ]
  },

  {
    id: 'a1-seed-troubleshooting-6', cert: 'aplus-core1', objective: '5.3', topic: 'Troubleshoot Video & Display',
    title: 'Match the display symptom to its cause', estMinutes: 4,
    scenario: 'Match each video/display symptom to its most likely cause.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each symptom with its likely cause.',
        explanation: 'No image but the system is on points to a bad cable/input or dead backlight. A dim image (visible only at an angle with a flashlight) is a failed backlight/inverter. Flickering often comes from a loose cable or wrong refresh rate. Dead pixels are stuck panel pixels. Distorted/wrong colors suggest a damaged cable or failing GPU.',
        payload: {
          left: [
            { id: 'noimage', label: 'No image, system powered on' },
            { id: 'dim', label: 'Very dim image, visible only with a flashlight' },
            { id: 'flicker', label: 'Screen flickering' },
            { id: 'deadpix', label: 'Permanent dark spot on screen' },
            { id: 'colors', label: 'Distorted or wrong colors' }
          ],
          right: [
            { id: 'dcableinput', label: 'Bad cable or wrong input source' },
            { id: 'dbacklight', label: 'Failed backlight or inverter' },
            { id: 'drefresh', label: 'Loose cable or wrong refresh rate' },
            { id: 'ddeadpixel', label: 'Stuck/dead panel pixel' },
            { id: 'dgpu', label: 'Damaged cable or failing GPU' }
          ]
        },
        answer: { pairs: { noimage: 'dcableinput', dim: 'dbacklight', flicker: 'drefresh', deadpix: 'ddeadpixel', colors: 'dgpu' } } }
    ]
  },

  {
    id: 'a1-seed-troubleshooting-7', cert: 'aplus-core1', objective: '5.4', topic: 'Troubleshoot Mobile Device Issues',
    title: 'Categorize the mobile symptom remedy', estMinutes: 4,
    scenario: 'Sort each mobile symptom by the corrective action it calls for.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each symptom under Replace battery, Reduce heat, or Recalibrate/replace digitizer.',
        explanation: 'A swollen case or rapid drain calls for battery replacement. Overheating under light load calls for reducing heat (remove case, close apps, check charging). Inaccurate touch / cursor drift calls for recalibrating or replacing the digitizer.',
        payload: {
          items: [
            { id: 'swollen', label: 'Case bulging / battery swollen' },
            { id: 'drain', label: 'Battery drains within minutes' },
            { id: 'hotlight', label: 'Device overheats under light use' },
            { id: 'touchoff', label: 'Touch registers in the wrong place' },
            { id: 'drift', label: 'Cursor drifts on its own' }
          ],
          buckets: [
            { id: 'battery', label: 'Replace battery' },
            { id: 'heat', label: 'Reduce heat' },
            { id: 'digitizer', label: 'Recalibrate / replace digitizer' }
          ]
        },
        answer: { map: { swollen: 'battery', drain: 'battery', hotlight: 'heat', touchoff: 'digitizer', drift: 'digitizer' } } }
    ]
  },

  {
    id: 'a1-seed-troubleshooting-8', cert: 'aplus-core1', objective: '5.4', topic: 'Mobile Battery & Charging Issues',
    title: 'Spot the charging fault', estMinutes: 3,
    scenario: 'A phone charges intermittently and only when the cable is held at an angle. Click the most likely cause.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the most likely cause.',
        explanation: 'Charging only when the cable is wiggled or held at an angle points to a worn/damaged charging port (or a frayed cable). Test a known-good cable first; if it persists, the charging port needs cleaning or replacement. A swollen battery or OS bug would not be position-dependent.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'A worn or damaged charging port (or frayed cable)' },
            { id: 'l2', text: 'The battery has reached end of life' },
            { id: 'l3', text: 'An operating-system software bug' },
            { id: 'l4', text: 'The screen brightness is set too high' }
          ]
        },
        answer: { selected: ['l1'] } }
    ]
  },

  {
    id: 'a1-seed-troubleshooting-9', cert: 'aplus-core1', objective: '5.5', topic: 'Troubleshoot Network Issues',
    title: 'Interpret the APIPA address', estMinutes: 3,
    scenario: 'A workstation shows IP 169.254.18.4 and cannot reach the internet. Click the most likely root cause.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the most likely root cause.',
        explanation: 'A 169.254.x.x (APIPA) address means the host could not obtain an address from a DHCP server. The most likely cause is a DHCP failure or no connectivity to the DHCP server (bad cable, down server, or VLAN issue), not a DNS or firewall problem.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'The host could not reach a DHCP server' },
            { id: 'l2', text: 'The DNS server address is wrong' },
            { id: 'l3', text: 'A firewall is blocking outbound HTTPS' },
            { id: 'l4', text: 'The default gateway has the wrong subnet mask' }
          ]
        },
        answer: { selected: ['l1'] } }
    ]
  },

  {
    id: 'a1-seed-troubleshooting-10', cert: 'aplus-core1', objective: '5.5', topic: 'Network Diagnostic Methodology',
    title: 'Match the network diagnostic command', estMinutes: 4,
    scenario: 'Match each network diagnostic command to what it does.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each command with its function.',
        explanation: 'ping tests reachability and latency to a host. ipconfig shows a Windows host’s IP configuration. tracert traces the hops along a path to a destination. nslookup queries DNS to resolve a name. netstat shows active connections and listening ports.',
        payload: {
          left: [
            { id: 'ping', label: 'ping' },
            { id: 'ipconfig', label: 'ipconfig' },
            { id: 'tracert', label: 'tracert' },
            { id: 'nslookup', label: 'nslookup' },
            { id: 'netstat', label: 'netstat' }
          ],
          right: [
            { id: 'dreach', label: 'Tests reachability and latency to a host' },
            { id: 'dconfig', label: 'Shows the host’s IP configuration' },
            { id: 'dhops', label: 'Traces the hops along a path' },
            { id: 'ddns', label: 'Queries DNS to resolve a name' },
            { id: 'dconns', label: 'Shows active connections and listening ports' }
          ]
        },
        answer: { pairs: { ping: 'dreach', ipconfig: 'dconfig', tracert: 'dhops', nslookup: 'ddns', netstat: 'dconns' } } }
    ]
  },

  {
    id: 'a1-seed-troubleshooting-11', cert: 'aplus-core1', objective: '5.6', topic: 'Troubleshoot Printer Issues',
    title: 'Match the printer symptom to its fix', estMinutes: 4,
    scenario: 'Match each printer symptom to its most likely cause or fix.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each symptom with its cause/fix.',
        explanation: 'Toner that smears or rubs off means a failed fuser (not fusing). A repeating ghost image down the page is a bad drum or fuser. Faded laser print is low toner. Vertical streaks/lines on a laser print are a dirty or scratched drum. A paper jam is often a worn pickup roller or wrong media path.',
        payload: {
          left: [
            { id: 'smear', label: 'Toner smears / rubs off' },
            { id: 'ghost', label: 'Repeating ghost image down the page' },
            { id: 'faded', label: 'Faded, light print' },
            { id: 'streaks', label: 'Vertical streaks or lines' },
            { id: 'jam', label: 'Frequent paper jams' }
          ],
          right: [
            { id: 'dfuser', label: 'Failed fuser (toner not bonded)' },
            { id: 'ddrumghost', label: 'Bad drum or fuser leaving a ghost' },
            { id: 'dlowtoner', label: 'Low toner cartridge' },
            { id: 'ddirtydrum', label: 'Dirty or scratched imaging drum' },
            { id: 'droller', label: 'Worn pickup roller / wrong media path' }
          ]
        },
        // Reviewed (A+ examiner + SME): confirmed correct.
        answer: { pairs: { smear: 'dfuser', ghost: 'ddrumghost', faded: 'dlowtoner', streaks: 'ddirtydrum', jam: 'droller' } } }
    ]
  },

  {
    id: 'a1-seed-troubleshooting-12', cert: 'aplus-core1', objective: '5.3', topic: 'Display Burn-in & Projector Issues',
    title: 'Diagnose the OLED burn-in', estMinutes: 3,
    scenario: 'An OLED phone shows a faint permanent outline of the status bar even on other screens. Click the best description and remedy.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the correct description/remedy.',
        explanation: 'A persistent ghost of static content (like a status bar) on an OLED is burn-in, caused by uneven pixel wear. It is often not fully repairable; mitigate with shorter screen timeouts, dark mode, and varied content — a panel replacement is the only true fix. It is not a software cache or a loose cable issue.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'OLED burn-in from uneven pixel wear; mitigate or replace the panel' },
            { id: 'l2', text: 'A corrupt image cache; clear the gallery app data' },
            { id: 'l3', text: 'A loose display ribbon cable; reseat it' },
            { id: 'l4', text: 'Wrong color profile; reset display calibration' }
          ]
        },
        answer: { selected: ['l1'] } }
    ]
  },

  {
    id: 'a1-seed-troubleshooting-13', cert: 'aplus-core1', objective: '5.1', topic: 'Troubleshoot Motherboards, RAM & CPUs',
    title: 'Diagnose intermittent overheating shutdown', estMinutes: 3,
    scenario: 'A desktop shuts off abruptly under heavy CPU load but runs fine when idle. Click the most likely cause.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the most likely cause.',
        explanation: 'Abrupt shutdowns only under heavy load are the classic signature of CPU overheating — a failing/clogged cooler, dried thermal paste, or a stopped fan triggers thermal protection. A dead CMOS battery or a bad RAM stick would not be load-dependent in this way.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'CPU overheating (failing fan or dried thermal paste)' },
            { id: 'l2', text: 'A dead CMOS battery losing BIOS settings' },
            { id: 'l3', text: 'A corrupted operating-system update' },
            { id: 'l4', text: 'An incorrect display refresh rate' }
          ]
        },
        answer: { selected: ['l1'] } }
    ]
  },

  {
    id: 'a1-seed-troubleshooting-14', cert: 'aplus-core1', objective: '5.5', topic: 'Troubleshoot Network Issues',
    title: 'Categorize the network symptom', estMinutes: 4,
    scenario: 'Sort each network symptom by its most likely layer of cause.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each symptom under Physical/cable, IP addressing, or Name resolution.',
        explanation: 'No link light and a dead port point to a physical/cable problem. An APIPA (169.254.x.x) address or a duplicate-IP warning is an IP-addressing problem. Reaching a site by IP but not by name is a DNS (name-resolution) problem.',
        payload: {
          items: [
            { id: 'nolink', label: 'No link light on the NIC' },
            { id: 'cabledamage', label: 'Visibly crushed Ethernet cable' },
            { id: 'apipa', label: 'Host has a 169.254.x.x address' },
            { id: 'dupip', label: 'Duplicate IP address warning' },
            { id: 'ipnotname', label: 'Site loads by IP but not by hostname' }
          ],
          buckets: [
            { id: 'physical', label: 'Physical / cable' },
            { id: 'ipaddr', label: 'IP addressing' },
            { id: 'dns', label: 'Name resolution' }
          ]
        },
        answer: { map: { nolink: 'physical', cabledamage: 'physical', apipa: 'ipaddr', dupip: 'ipaddr', ipnotname: 'dns' } } }
    ]
  }
];

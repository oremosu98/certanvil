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
  },

  // ========================================================================
  // ===== SOHO Router PBQs (Wave 1 · Task 8, 2-agent gated) ================
  // ========================================================================
  {
    id: 'a1-soho-01',
    cert: 'aplus-core1', objective: '2.5', topic: 'SOHO wireless + DHCP vs static reservation',
    title: 'Bluebird Dental gets a real network',
    estMinutes: 5, archetype: 'soho',
    scenario: 'A new router replaced the ISP loaner at this three-chair dental office. Ticket: staff Wi-Fi named BluebirdOffice on the strongest security, an isolated guest network for the waiting room, a DHCP pool that covers 18 staff devices without ever handing out the camera NVR at 192.168.1.200, and outside port 8443 forwarded to the NVR web interface.',
    assets: { reference: { kind: 'network',
      given: { site: 'Bluebird Dental — RTR-Bluebird', subnet: '192.168.1.0/24 · router 192.168.1.1' },
      devices: [
        { id: 'rtr', label: 'RTR-Bluebird', type: 'router', ip: '192.168.1.1' },
        { id: 'staff', label: 'Front desk + ops', type: 'pc', ip: '18 DHCP clients' },
        { id: 'nvr', label: 'Camera NVR', type: 'server', ip: '192.168.1.200 · 443' }
      ],
      links: []
    } },
    soho: {
      subnet: { networkId: '192.168.1.0', mask: '255.255.255.0' },
      routerIp: '192.168.1.1',
      statics: [{ ip: '192.168.1.200', label: 'Camera NVR' }],
      clientCount: 18,
      require: { ssid: 'BluebirdOffice', security: 'WPA3-Personal' }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Set up the wireless section to match the ticket: staff SSID, strongest security, and guest isolation.',
        explanation: 'Name the staff network exactly as the ticket spells it (BluebirdOffice), pick WPA3-Personal (the strongest personal mode this router offers — stronger than WPA2, far stronger than WEP or Open), and turn the guest network on but isolated so guests get internet without touching the staff LAN.',
        payload: { slots: [
          { id: 'ssid', label: 'Network name (SSID)', options: [
            { id: 'good', text: 'BluebirdOffice' }, { id: 'd0', text: 'Bluebird-Guest' }, { id: 'd1', text: 'TP-Link_4F22' } ] },
          { id: 'security', label: 'Security mode', options: [
            { id: 'open', text: 'Open' }, { id: 'wep', text: 'WEP' }, { id: 'wpa2', text: 'WPA2-Personal' }, { id: 'wpa3', text: 'WPA3-Personal' } ] },
          { id: 'guest', label: 'Guest network', options: [
            { id: 'iso', text: 'On, isolated from LAN' }, { id: 'bridge', text: 'On, bridged to LAN' }, { id: 'off', text: 'Off' } ] }
        ] },
        answer: { slots: { ssid: 'good', security: 'wpa3', guest: 'iso' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Set the DHCP pool and the port-forward so the pool covers every device, never hands out a reserved static, and the outside port reaches the right host.',
        explanation: 'Start the pool above the router and any static reservations, and end it before the reserved statics so DHCP never leases an address a fixed device already owns. The pool must be wide enough for every client. Then forward the outside port to the static host inside the LAN — never to the router itself or an address outside the subnet.',
        payload: { slots: [
          { id: 'dhcpStart', label: 'DHCP pool — start', options: [
            { id: 'sg', text: '192.168.1.100' }, { id: 'st', text: '192.168.1.1' }, { id: 'shi', text: '192.168.1.200' } ] },
          { id: 'dhcpEnd', label: 'DHCP pool — end', options: [
            { id: 'eg', text: '192.168.1.199' }, { id: 'ew', text: '192.168.1.254' }, { id: 'et', text: '192.168.1.110' } ] },
          { id: 'extPort', label: 'Port forward — external port', options: [
            { id: 'ext', text: '8443' }, { id: 'p443', text: '443' }, { id: 'p80', text: '80' } ] },
          { id: 'fwdTo', label: 'Port forward — forward to (host : port)', options: [
            { id: 'fg', text: '192.168.1.200 : 443' }, { id: 'foff', text: '203.0.113.200 : 443' }, { id: 'fw', text: '192.168.1.1 : 443' } ] }
        ] },
        answer: { slots: { dhcpStart: 'sg', dhcpEnd: 'eg', extPort: 'ext', fwdTo: 'fg' } } }
    ]
  },

  {
    id: 'a1-soho-02',
    cert: 'aplus-core1', objective: '2.6', topic: 'DHCP pool sizing around statics',
    title: 'Riverside Law brings up its office router',
    estMinutes: 5, archetype: 'soho',
    scenario: 'A two-partner law office needs its router configured. Ticket: staff Wi-Fi RiverLaw on the strongest security, isolated guest Wi-Fi for clients, a DHCP pool for about a dozen laptops and phones that avoids the network printer at 192.168.0.10 and the door webcam at 192.168.0.220, and outside port 8080 forwarded to that webcam.',
    assets: { reference: { kind: 'network',
      given: { site: 'Riverside Law — office router', subnet: '192.168.0.0/24 · router 192.168.0.1' },
      devices: [
        { id: 'rtr', label: 'Office router', type: 'router', ip: '192.168.0.1' },
        { id: 'staff', label: 'Staff laptops', type: 'pc', ip: '12 DHCP clients' },
        { id: 'prn', label: 'Printer', type: 'server', ip: '192.168.0.10' },
        { id: 'cam', label: 'Door webcam', type: 'server', ip: '192.168.0.220 · 80' }
      ],
      links: []
    } },
    soho: {
      subnet: { networkId: '192.168.0.0', mask: '255.255.255.0' },
      routerIp: '192.168.0.1',
      statics: [{ ip: '192.168.0.10', label: 'Printer' }, { ip: '192.168.0.220', label: 'Door webcam' }],
      clientCount: 12,
      require: { ssid: 'RiverLaw', security: 'WPA3-Personal' }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Set up the wireless section to match the ticket: staff SSID, strongest security, and guest isolation.',
        explanation: 'Name the staff network exactly as the ticket spells it (RiverLaw), pick WPA3-Personal (the strongest personal mode this router offers — stronger than WPA2, far stronger than WEP or Open), and turn the guest network on but isolated so guests get internet without touching the staff LAN.',
        payload: { slots: [
          { id: 'ssid', label: 'Network name (SSID)', options: [
            { id: 'good', text: 'RiverLaw' }, { id: 'd0', text: 'RiverLaw-Guest' }, { id: 'd1', text: 'NETGEAR-8821' } ] },
          { id: 'security', label: 'Security mode', options: [
            { id: 'open', text: 'Open' }, { id: 'wep', text: 'WEP' }, { id: 'wpa2', text: 'WPA2-Personal' }, { id: 'wpa3', text: 'WPA3-Personal' } ] },
          { id: 'guest', label: 'Guest network', options: [
            { id: 'iso', text: 'On, isolated from LAN' }, { id: 'bridge', text: 'On, bridged to LAN' }, { id: 'off', text: 'Off' } ] }
        ] },
        answer: { slots: { ssid: 'good', security: 'wpa3', guest: 'iso' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Set the DHCP pool and the port-forward so the pool covers every device, never hands out a reserved static, and the outside port reaches the right host.',
        explanation: 'Start the pool above the router and any static reservations, and end it before the reserved statics so DHCP never leases an address a fixed device already owns. The pool must be wide enough for every client. Then forward the outside port to the static host inside the LAN — never to the router itself or an address outside the subnet.',
        payload: { slots: [
          { id: 'dhcpStart', label: 'DHCP pool — start', options: [
            { id: 'sg', text: '192.168.0.100' }, { id: 'st', text: '192.168.0.1' }, { id: 'shi', text: '192.168.0.220' } ] },
          { id: 'dhcpEnd', label: 'DHCP pool — end', options: [
            { id: 'eg', text: '192.168.0.150' }, { id: 'ew', text: '192.168.0.254' }, { id: 'et', text: '192.168.0.105' } ] },
          { id: 'extPort', label: 'Port forward — external port', options: [
            { id: 'ext', text: '8080' }, { id: 'p443', text: '443' }, { id: 'p80', text: '80' } ] },
          { id: 'fwdTo', label: 'Port forward — forward to (host : port)', options: [
            { id: 'fg', text: '192.168.0.220 : 80' }, { id: 'foff', text: '198.51.100.220 : 80' }, { id: 'fw', text: '192.168.0.1 : 80' } ] }
        ] },
        answer: { slots: { dhcpStart: 'sg', dhcpEnd: 'eg', extPort: 'ext', fwdTo: 'fg' } } }
    ]
  },

  {
    id: 'a1-soho-03',
    cert: 'aplus-core1', objective: '2.5', topic: 'Guest network isolation + DHCP',
    title: 'BeanScene café splits staff and guest Wi-Fi',
    estMinutes: 5, archetype: 'soho',
    scenario: 'A busy café wants customers online without touching the till. Ticket: staff Wi-Fi BeanScene on the strongest security, a guest network the customers use that stays off the staff LAN, a DHCP pool big enough for roughly 25 guest and staff devices that skips the POS terminal at 192.168.5.220, and outside port 8443 to the POS management page.',
    assets: { reference: { kind: 'network',
      given: { site: 'BeanScene Café — counter router', subnet: '192.168.5.0/24 · router 192.168.5.1' },
      devices: [
        { id: 'rtr', label: 'Counter router', type: 'router', ip: '192.168.5.1' },
        { id: 'pos', label: 'POS terminal', type: 'server', ip: '192.168.5.220 · 443' },
        { id: 'guest', label: 'Customer devices', type: 'pc', ip: 'guest network' }
      ],
      links: []
    } },
    soho: {
      subnet: { networkId: '192.168.5.0', mask: '255.255.255.0' },
      routerIp: '192.168.5.1',
      statics: [{ ip: '192.168.5.220', label: 'POS terminal' }],
      clientCount: 25,
      require: { ssid: 'BeanScene', security: 'WPA3-Personal' }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Set up the wireless section to match the ticket: staff SSID, strongest security, and guest isolation.',
        explanation: 'Name the staff network exactly as the ticket spells it (BeanScene), pick WPA3-Personal (the strongest personal mode this router offers — stronger than WPA2, far stronger than WEP or Open), and turn the guest network on but isolated so guests get internet without touching the staff LAN.',
        payload: { slots: [
          { id: 'ssid', label: 'Network name (SSID)', options: [
            { id: 'good', text: 'BeanScene' }, { id: 'd0', text: 'BeanScene-Guest' }, { id: 'd1', text: 'Linksys00420' } ] },
          { id: 'security', label: 'Security mode', options: [
            { id: 'open', text: 'Open' }, { id: 'wep', text: 'WEP' }, { id: 'wpa2', text: 'WPA2-Personal' }, { id: 'wpa3', text: 'WPA3-Personal' } ] },
          { id: 'guest', label: 'Guest network', options: [
            { id: 'iso', text: 'On, isolated from LAN' }, { id: 'bridge', text: 'On, bridged to LAN' }, { id: 'off', text: 'Off' } ] }
        ] },
        answer: { slots: { ssid: 'good', security: 'wpa3', guest: 'iso' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Set the DHCP pool and the port-forward so the pool covers every device, never hands out a reserved static, and the outside port reaches the right host.',
        explanation: 'Start the pool above the router and any static reservations, and end it before the reserved statics so DHCP never leases an address a fixed device already owns. The pool must be wide enough for every client. Then forward the outside port to the static host inside the LAN — never to the router itself or an address outside the subnet.',
        payload: { slots: [
          { id: 'dhcpStart', label: 'DHCP pool — start', options: [
            { id: 'sg', text: '192.168.5.100' }, { id: 'st', text: '192.168.5.1' }, { id: 'shi', text: '192.168.5.220' } ] },
          { id: 'dhcpEnd', label: 'DHCP pool — end', options: [
            { id: 'eg', text: '192.168.5.199' }, { id: 'ew', text: '192.168.5.254' }, { id: 'et', text: '192.168.5.115' } ] },
          { id: 'extPort', label: 'Port forward — external port', options: [
            { id: 'ext', text: '8443' }, { id: 'p443', text: '443' }, { id: 'p80', text: '80' } ] },
          { id: 'fwdTo', label: 'Port forward — forward to (host : port)', options: [
            { id: 'fg', text: '192.168.5.220 : 443' }, { id: 'foff', text: '203.0.113.220 : 443' }, { id: 'fw', text: '192.168.5.1 : 443' } ] }
        ] },
        answer: { slots: { dhcpStart: 'sg', dhcpEnd: 'eg', extPort: 'ext', fwdTo: 'fg' } } }
    ]
  },

  {
    id: 'a1-soho-04',
    cert: 'aplus-core1', objective: '2.6', topic: 'Private (10.x) addressing + DHCP scope vs static reservation',
    title: 'StudioLoft photographers share a NAS',
    estMinutes: 5, archetype: 'soho',
    scenario: 'A photography studio runs its LAN on 10.0.0.0/24. Ticket: staff Wi-Fi StudioLoft on the strongest security, isolated guest Wi-Fi for visiting clients, a DHCP pool covering about 30 devices that never hands out the NAS at 10.0.0.240, and outside port 8443 forwarded to the NAS web console for remote proofing.',
    assets: { reference: { kind: 'network',
      given: { site: 'StudioLoft — loft router', subnet: '10.0.0.0/24 · router 10.0.0.1' },
      devices: [
        { id: 'rtr', label: 'Loft router', type: 'router', ip: '10.0.0.1' },
        { id: 'nas', label: 'NAS', type: 'server', ip: '10.0.0.240 · 443' },
        { id: 'staff', label: 'Editing workstations', type: 'pc', ip: '30 DHCP clients' }
      ],
      links: []
    } },
    soho: {
      subnet: { networkId: '10.0.0.0', mask: '255.255.255.0' },
      routerIp: '10.0.0.1',
      statics: [{ ip: '10.0.0.240', label: 'NAS' }],
      clientCount: 30,
      require: { ssid: 'StudioLoft', security: 'WPA3-Personal' }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Set up the wireless section to match the ticket: staff SSID, strongest security, and guest isolation.',
        explanation: 'Name the staff network exactly as the ticket spells it (StudioLoft), pick WPA3-Personal (the strongest personal mode this router offers — stronger than WPA2, far stronger than WEP or Open), and turn the guest network on but isolated so guests get internet without touching the staff LAN.',
        payload: { slots: [
          { id: 'ssid', label: 'Network name (SSID)', options: [
            { id: 'good', text: 'StudioLoft' }, { id: 'd0', text: 'StudioLoft-Guest' }, { id: 'd1', text: 'ASUS_5G_2A' } ] },
          { id: 'security', label: 'Security mode', options: [
            { id: 'open', text: 'Open' }, { id: 'wep', text: 'WEP' }, { id: 'wpa2', text: 'WPA2-Personal' }, { id: 'wpa3', text: 'WPA3-Personal' } ] },
          { id: 'guest', label: 'Guest network', options: [
            { id: 'iso', text: 'On, isolated from LAN' }, { id: 'bridge', text: 'On, bridged to LAN' }, { id: 'off', text: 'Off' } ] }
        ] },
        answer: { slots: { ssid: 'good', security: 'wpa3', guest: 'iso' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Set the DHCP pool and the port-forward so the pool covers every device, never hands out a reserved static, and the outside port reaches the right host.',
        explanation: 'Start the pool above the router and any static reservations, and end it before the reserved statics so DHCP never leases an address a fixed device already owns. The pool must be wide enough for every client. Then forward the outside port to the static host inside the LAN — never to the router itself or an address outside the subnet.',
        payload: { slots: [
          { id: 'dhcpStart', label: 'DHCP pool — start', options: [
            { id: 'sg', text: '10.0.0.100' }, { id: 'st', text: '10.0.0.1' }, { id: 'shi', text: '10.0.0.240' } ] },
          { id: 'dhcpEnd', label: 'DHCP pool — end', options: [
            { id: 'eg', text: '10.0.0.199' }, { id: 'ew', text: '10.0.0.254' }, { id: 'et', text: '10.0.0.120' } ] },
          { id: 'extPort', label: 'Port forward — external port', options: [
            { id: 'ext', text: '8443' }, { id: 'p443', text: '443' }, { id: 'p80', text: '80' } ] },
          { id: 'fwdTo', label: 'Port forward — forward to (host : port)', options: [
            { id: 'fg', text: '10.0.0.240 : 443' }, { id: 'foff', text: '198.51.100.240 : 443' }, { id: 'fw', text: '10.0.0.1 : 443' } ] }
        ] },
        answer: { slots: { dhcpStart: 'sg', dhcpEnd: 'eg', extPort: 'ext', fwdTo: 'fg' } } }
    ]
  },

  {
    id: 'a1-soho-05',
    cert: 'aplus-core1', objective: '2.6', topic: 'Multiple static reservations',
    title: 'HomeHQ keeps printer and cameras on fixed IPs',
    estMinutes: 5, archetype: 'soho',
    scenario: 'A work-from-home setup has grown to 40-odd devices. Ticket: staff Wi-Fi HomeHQ on the strongest security, an isolated guest network for visitors, a DHCP pool that leaves the network printer at 192.168.1.200 and the camera NVR at 192.168.1.201 on their fixed addresses, and outside port 8443 forwarded to the NVR.',
    assets: { reference: { kind: 'network',
      given: { site: 'HomeHQ — home office router', subnet: '192.168.1.0/24 · router 192.168.1.1' },
      devices: [
        { id: 'rtr', label: 'Home office router', type: 'router', ip: '192.168.1.1' },
        { id: 'prn', label: 'Printer', type: 'server', ip: '192.168.1.200' },
        { id: 'nvr', label: 'Camera NVR', type: 'server', ip: '192.168.1.201 · 443' }
      ],
      links: []
    } },
    soho: {
      subnet: { networkId: '192.168.1.0', mask: '255.255.255.0' },
      routerIp: '192.168.1.1',
      statics: [{ ip: '192.168.1.200', label: 'Printer' }, { ip: '192.168.1.201', label: 'NVR' }],
      clientCount: 40,
      require: { ssid: 'HomeHQ', security: 'WPA3-Personal' }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Set up the wireless section to match the ticket: staff SSID, strongest security, and guest isolation.',
        explanation: 'Name the staff network exactly as the ticket spells it (HomeHQ), pick WPA3-Personal (the strongest personal mode this router offers — stronger than WPA2, far stronger than WEP or Open), and turn the guest network on but isolated so guests get internet without touching the staff LAN.',
        payload: { slots: [
          { id: 'ssid', label: 'Network name (SSID)', options: [
            { id: 'good', text: 'HomeHQ' }, { id: 'd0', text: 'HomeHQ-Guest' }, { id: 'd1', text: 'ARRIS-9F10' } ] },
          { id: 'security', label: 'Security mode', options: [
            { id: 'open', text: 'Open' }, { id: 'wep', text: 'WEP' }, { id: 'wpa2', text: 'WPA2-Personal' }, { id: 'wpa3', text: 'WPA3-Personal' } ] },
          { id: 'guest', label: 'Guest network', options: [
            { id: 'iso', text: 'On, isolated from LAN' }, { id: 'bridge', text: 'On, bridged to LAN' }, { id: 'off', text: 'Off' } ] }
        ] },
        answer: { slots: { ssid: 'good', security: 'wpa3', guest: 'iso' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Set the DHCP pool and the port-forward so the pool covers every device, never hands out a reserved static, and the outside port reaches the right host.',
        explanation: 'Start the pool above the router and any static reservations, and end it before the reserved statics so DHCP never leases an address a fixed device already owns. The pool must be wide enough for every client. Then forward the outside port to the static host inside the LAN — never to the router itself or an address outside the subnet.',
        payload: { slots: [
          { id: 'dhcpStart', label: 'DHCP pool — start', options: [
            { id: 'sg', text: '192.168.1.10' }, { id: 'st', text: '192.168.1.1' }, { id: 'shi', text: '192.168.1.200' } ] },
          { id: 'dhcpEnd', label: 'DHCP pool — end', options: [
            { id: 'eg', text: '192.168.1.150' }, { id: 'ew', text: '192.168.1.254' }, { id: 'et', text: '192.168.1.30' } ] },
          { id: 'extPort', label: 'Port forward — external port', options: [
            { id: 'ext', text: '8443' }, { id: 'p443', text: '443' }, { id: 'p80', text: '80' } ] },
          { id: 'fwdTo', label: 'Port forward — forward to (host : port)', options: [
            { id: 'fg', text: '192.168.1.201 : 443' }, { id: 'foff', text: '203.0.113.201 : 443' }, { id: 'fw', text: '192.168.1.1 : 443' } ] }
        ] },
        answer: { slots: { dhcpStart: 'sg', dhcpEnd: 'eg', extPort: 'ext', fwdTo: 'fg' } } }
    ]
  },

  {
    id: 'a1-soho-06',
    cert: 'aplus-core1', objective: '2.5', topic: 'Port forwarding to a fixed camera host',
    title: 'ShopFloor keeps the till off the DHCP pool',
    estMinutes: 5, archetype: 'soho',
    scenario: 'A small retail shop is wiring its back office. Ticket: staff Wi-Fi ShopFloor on the strongest security, an isolated guest network for the sales floor, a DHCP pool for about 20 devices that avoids the POS at 192.168.2.5 and the camera NVR at 192.168.2.210, and outside port 8443 forwarded to the NVR so the owner can watch from home.',
    assets: { reference: { kind: 'network',
      given: { site: 'ShopFloor Retail — back-office router', subnet: '192.168.2.0/24 · router 192.168.2.1' },
      devices: [
        { id: 'rtr', label: 'Back-office router', type: 'router', ip: '192.168.2.1' },
        { id: 'pos', label: 'POS', type: 'server', ip: '192.168.2.5' },
        { id: 'nvr', label: 'Camera NVR', type: 'server', ip: '192.168.2.210 · 443' }
      ],
      links: []
    } },
    soho: {
      subnet: { networkId: '192.168.2.0', mask: '255.255.255.0' },
      routerIp: '192.168.2.1',
      statics: [{ ip: '192.168.2.5', label: 'POS' }, { ip: '192.168.2.210', label: 'Camera NVR' }],
      clientCount: 20,
      require: { ssid: 'ShopFloor', security: 'WPA3-Personal' }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Set up the wireless section to match the ticket: staff SSID, strongest security, and guest isolation.',
        explanation: 'Name the staff network exactly as the ticket spells it (ShopFloor), pick WPA3-Personal (the strongest personal mode this router offers — stronger than WPA2, far stronger than WEP or Open), and turn the guest network on but isolated so guests get internet without touching the staff LAN.',
        payload: { slots: [
          { id: 'ssid', label: 'Network name (SSID)', options: [
            { id: 'good', text: 'ShopFloor' }, { id: 'd0', text: 'ShopFloor-Guest' }, { id: 'd1', text: 'TP-Link_2C90' } ] },
          { id: 'security', label: 'Security mode', options: [
            { id: 'open', text: 'Open' }, { id: 'wep', text: 'WEP' }, { id: 'wpa2', text: 'WPA2-Personal' }, { id: 'wpa3', text: 'WPA3-Personal' } ] },
          { id: 'guest', label: 'Guest network', options: [
            { id: 'iso', text: 'On, isolated from LAN' }, { id: 'bridge', text: 'On, bridged to LAN' }, { id: 'off', text: 'Off' } ] }
        ] },
        answer: { slots: { ssid: 'good', security: 'wpa3', guest: 'iso' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Set the DHCP pool and the port-forward so the pool covers every device, never hands out a reserved static, and the outside port reaches the right host.',
        explanation: 'Start the pool above the router and any static reservations, and end it before the reserved statics so DHCP never leases an address a fixed device already owns. The pool must be wide enough for every client. Then forward the outside port to the static host inside the LAN — never to the router itself or an address outside the subnet.',
        payload: { slots: [
          { id: 'dhcpStart', label: 'DHCP pool — start', options: [
            { id: 'sg', text: '192.168.2.100' }, { id: 'st', text: '192.168.2.1' }, { id: 'shi', text: '192.168.2.210' } ] },
          { id: 'dhcpEnd', label: 'DHCP pool — end', options: [
            { id: 'eg', text: '192.168.2.199' }, { id: 'ew', text: '192.168.2.254' }, { id: 'et', text: '192.168.2.112' } ] },
          { id: 'extPort', label: 'Port forward — external port', options: [
            { id: 'ext', text: '8443' }, { id: 'p443', text: '443' }, { id: 'p80', text: '80' } ] },
          { id: 'fwdTo', label: 'Port forward — forward to (host : port)', options: [
            { id: 'fg', text: '192.168.2.210 : 443' }, { id: 'foff', text: '198.51.100.210 : 443' }, { id: 'fw', text: '192.168.2.1 : 443' } ] }
        ] },
        answer: { slots: { dhcpStart: 'sg', dhcpEnd: 'eg', extPort: 'ext', fwdTo: 'fg' } } }
    ]
  },

  {
    id: 'a1-soho-07',
    cert: 'aplus-core1', objective: '2.6', topic: 'Sizing a pool for 50 devices',
    title: 'ClinicNet branch office router setup',
    estMinutes: 5, archetype: 'soho',
    scenario: 'A growing dental branch has around 50 networked devices. Ticket: staff Wi-Fi ClinicNet on the strongest security, isolated guest Wi-Fi for the lobby, a DHCP pool wide enough for 50 devices that never leases the camera NVR at 192.168.20.200, and outside port 8443 forwarded to the NVR web interface.',
    assets: { reference: { kind: 'network',
      given: { site: 'Meadow Dental (branch) — ClinicNet router', subnet: '192.168.20.0/24 · router 192.168.20.1' },
      devices: [
        { id: 'rtr', label: 'ClinicNet router', type: 'router', ip: '192.168.20.1' },
        { id: 'nvr', label: 'Camera NVR', type: 'server', ip: '192.168.20.200 · 443' },
        { id: 'staff', label: 'Clinic devices', type: 'pc', ip: '50 DHCP clients' }
      ],
      links: []
    } },
    soho: {
      subnet: { networkId: '192.168.20.0', mask: '255.255.255.0' },
      routerIp: '192.168.20.1',
      statics: [{ ip: '192.168.20.200', label: 'Camera NVR' }],
      clientCount: 50,
      require: { ssid: 'ClinicNet', security: 'WPA3-Personal' }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Set up the wireless section to match the ticket: staff SSID, strongest security, and guest isolation.',
        explanation: 'Name the staff network exactly as the ticket spells it (ClinicNet), pick WPA3-Personal (the strongest personal mode this router offers — stronger than WPA2, far stronger than WEP or Open), and turn the guest network on but isolated so guests get internet without touching the staff LAN.',
        payload: { slots: [
          { id: 'ssid', label: 'Network name (SSID)', options: [
            { id: 'good', text: 'ClinicNet' }, { id: 'd0', text: 'ClinicNet-Guest' }, { id: 'd1', text: 'Netgear_R70' } ] },
          { id: 'security', label: 'Security mode', options: [
            { id: 'open', text: 'Open' }, { id: 'wep', text: 'WEP' }, { id: 'wpa2', text: 'WPA2-Personal' }, { id: 'wpa3', text: 'WPA3-Personal' } ] },
          { id: 'guest', label: 'Guest network', options: [
            { id: 'iso', text: 'On, isolated from LAN' }, { id: 'bridge', text: 'On, bridged to LAN' }, { id: 'off', text: 'Off' } ] }
        ] },
        answer: { slots: { ssid: 'good', security: 'wpa3', guest: 'iso' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Set the DHCP pool and the port-forward so the pool covers every device, never hands out a reserved static, and the outside port reaches the right host.',
        explanation: 'Start the pool above the router and any static reservations, and end it before the reserved statics so DHCP never leases an address a fixed device already owns. The pool must be wide enough for every client. Then forward the outside port to the static host inside the LAN — never to the router itself or an address outside the subnet.',
        payload: { slots: [
          { id: 'dhcpStart', label: 'DHCP pool — start', options: [
            { id: 'sg', text: '192.168.20.100' }, { id: 'st', text: '192.168.20.1' }, { id: 'shi', text: '192.168.20.200' } ] },
          { id: 'dhcpEnd', label: 'DHCP pool — end', options: [
            { id: 'eg', text: '192.168.20.199' }, { id: 'ew', text: '192.168.20.254' }, { id: 'et', text: '192.168.20.140' } ] },
          { id: 'extPort', label: 'Port forward — external port', options: [
            { id: 'ext', text: '8443' }, { id: 'p443', text: '443' }, { id: 'p80', text: '80' } ] },
          { id: 'fwdTo', label: 'Port forward — forward to (host : port)', options: [
            { id: 'fg', text: '192.168.20.200 : 443' }, { id: 'foff', text: '203.0.113.20 : 443' }, { id: 'fw', text: '192.168.20.1 : 443' } ] }
        ] },
        answer: { slots: { dhcpStart: 'sg', dhcpEnd: 'eg', extPort: 'ext', fwdTo: 'fg' } } }
    ]
  },

  {
    id: 'a1-soho-08',
    cert: 'aplus-core1', objective: '2.5', topic: 'Guest isolation for a rental',
    title: 'CedarCabin rental separates guests from the smart hub',
    estMinutes: 5, archetype: 'soho',
    scenario: 'A short-term rental cabin needs guest Wi-Fi that cannot reach the owner’s smart-home gear. Ticket: staff Wi-Fi CedarCabin on the strongest security for the owner, an isolated guest network for renters, a DHCP pool for about 15 devices that avoids the smart-lock hub at 192.168.4.230, and outside port 8443 forwarded to that hub for remote management.',
    assets: { reference: { kind: 'network',
      given: { site: 'CedarCabin Rental — cabin router', subnet: '192.168.4.0/24 · router 192.168.4.1' },
      devices: [
        { id: 'rtr', label: 'Cabin router', type: 'router', ip: '192.168.4.1' },
        { id: 'hub', label: 'Smart-lock hub', type: 'server', ip: '192.168.4.230 · 443' },
        { id: 'guest', label: 'Renter devices', type: 'pc', ip: 'guest network' }
      ],
      links: []
    } },
    soho: {
      subnet: { networkId: '192.168.4.0', mask: '255.255.255.0' },
      routerIp: '192.168.4.1',
      statics: [{ ip: '192.168.4.230', label: 'Smart-lock hub' }],
      clientCount: 15,
      require: { ssid: 'CedarCabin', security: 'WPA3-Personal' }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Set up the wireless section to match the ticket: staff SSID, strongest security, and guest isolation.',
        explanation: 'Name the staff network exactly as the ticket spells it (CedarCabin), pick WPA3-Personal (the strongest personal mode this router offers — stronger than WPA2, far stronger than WEP or Open), and turn the guest network on but isolated so guests get internet without touching the staff LAN.',
        payload: { slots: [
          { id: 'ssid', label: 'Network name (SSID)', options: [
            { id: 'good', text: 'CedarCabin' }, { id: 'd0', text: 'CedarCabin-Guest' }, { id: 'd1', text: 'eero-4C1' } ] },
          { id: 'security', label: 'Security mode', options: [
            { id: 'open', text: 'Open' }, { id: 'wep', text: 'WEP' }, { id: 'wpa2', text: 'WPA2-Personal' }, { id: 'wpa3', text: 'WPA3-Personal' } ] },
          { id: 'guest', label: 'Guest network', options: [
            { id: 'iso', text: 'On, isolated from LAN' }, { id: 'bridge', text: 'On, bridged to LAN' }, { id: 'off', text: 'Off' } ] }
        ] },
        answer: { slots: { ssid: 'good', security: 'wpa3', guest: 'iso' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Set the DHCP pool and the port-forward so the pool covers every device, never hands out a reserved static, and the outside port reaches the right host.',
        explanation: 'Start the pool above the router and any static reservations, and end it before the reserved statics so DHCP never leases an address a fixed device already owns. The pool must be wide enough for every client. Then forward the outside port to the static host inside the LAN — never to the router itself or an address outside the subnet.',
        payload: { slots: [
          { id: 'dhcpStart', label: 'DHCP pool — start', options: [
            { id: 'sg', text: '192.168.4.100' }, { id: 'st', text: '192.168.4.1' }, { id: 'shi', text: '192.168.4.230' } ] },
          { id: 'dhcpEnd', label: 'DHCP pool — end', options: [
            { id: 'eg', text: '192.168.4.199' }, { id: 'ew', text: '192.168.4.254' }, { id: 'et', text: '192.168.4.108' } ] },
          { id: 'extPort', label: 'Port forward — external port', options: [
            { id: 'ext', text: '8443' }, { id: 'p443', text: '443' }, { id: 'p80', text: '80' } ] },
          { id: 'fwdTo', label: 'Port forward — forward to (host : port)', options: [
            { id: 'fg', text: '192.168.4.230 : 443' }, { id: 'foff', text: '198.51.100.230 : 443' }, { id: 'fw', text: '192.168.4.1 : 443' } ] }
        ] },
        answer: { slots: { dhcpStart: 'sg', dhcpEnd: 'eg', extPort: 'ext', fwdTo: 'fg' } } }
    ]
  },

  {
    id: 'a1-soho-09',
    cert: 'aplus-core1', objective: '2.6', topic: 'Reserve a server, forward its port',
    title: 'PawsVet keeps the imaging server on a fixed IP',
    estMinutes: 5, archetype: 'soho',
    scenario: 'A veterinary clinic is setting up its router. Ticket: staff Wi-Fi PawsVet on the strongest security, an isolated guest network for the waiting room, a DHCP pool for roughly 22 devices that leaves the X-ray imaging server at 192.168.8.230 on its fixed address, and outside port 8443 forwarded to that server for the remote radiologist.',
    assets: { reference: { kind: 'network',
      given: { site: 'PawsVet Clinic — clinic router', subnet: '192.168.8.0/24 · router 192.168.8.1' },
      devices: [
        { id: 'rtr', label: 'Clinic router', type: 'router', ip: '192.168.8.1' },
        { id: 'img', label: 'Imaging server', type: 'server', ip: '192.168.8.230 · 443' },
        { id: 'staff', label: 'Clinic devices', type: 'pc', ip: '22 DHCP clients' }
      ],
      links: []
    } },
    soho: {
      subnet: { networkId: '192.168.8.0', mask: '255.255.255.0' },
      routerIp: '192.168.8.1',
      statics: [{ ip: '192.168.8.230', label: 'Imaging server' }],
      clientCount: 22,
      require: { ssid: 'PawsVet', security: 'WPA3-Personal' }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Set up the wireless section to match the ticket: staff SSID, strongest security, and guest isolation.',
        explanation: 'Name the staff network exactly as the ticket spells it (PawsVet), pick WPA3-Personal (the strongest personal mode this router offers — stronger than WPA2, far stronger than WEP or Open), and turn the guest network on but isolated so guests get internet without touching the staff LAN.',
        payload: { slots: [
          { id: 'ssid', label: 'Network name (SSID)', options: [
            { id: 'good', text: 'PawsVet' }, { id: 'd0', text: 'PawsVet-Guest' }, { id: 'd1', text: 'TP-Link_88AF' } ] },
          { id: 'security', label: 'Security mode', options: [
            { id: 'open', text: 'Open' }, { id: 'wep', text: 'WEP' }, { id: 'wpa2', text: 'WPA2-Personal' }, { id: 'wpa3', text: 'WPA3-Personal' } ] },
          { id: 'guest', label: 'Guest network', options: [
            { id: 'iso', text: 'On, isolated from LAN' }, { id: 'bridge', text: 'On, bridged to LAN' }, { id: 'off', text: 'Off' } ] }
        ] },
        answer: { slots: { ssid: 'good', security: 'wpa3', guest: 'iso' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Set the DHCP pool and the port-forward so the pool covers every device, never hands out a reserved static, and the outside port reaches the right host.',
        explanation: 'Start the pool above the router and any static reservations, and end it before the reserved statics so DHCP never leases an address a fixed device already owns. The pool must be wide enough for every client. Then forward the outside port to the static host inside the LAN — never to the router itself or an address outside the subnet.',
        payload: { slots: [
          { id: 'dhcpStart', label: 'DHCP pool — start', options: [
            { id: 'sg', text: '192.168.8.100' }, { id: 'st', text: '192.168.8.1' }, { id: 'shi', text: '192.168.8.230' } ] },
          { id: 'dhcpEnd', label: 'DHCP pool — end', options: [
            { id: 'eg', text: '192.168.8.199' }, { id: 'ew', text: '192.168.8.254' }, { id: 'et', text: '192.168.8.116' } ] },
          { id: 'extPort', label: 'Port forward — external port', options: [
            { id: 'ext', text: '8443' }, { id: 'p443', text: '443' }, { id: 'p80', text: '80' } ] },
          { id: 'fwdTo', label: 'Port forward — forward to (host : port)', options: [
            { id: 'fg', text: '192.168.8.230 : 443' }, { id: 'foff', text: '203.0.113.230 : 443' }, { id: 'fw', text: '192.168.8.1 : 443' } ] }
        ] },
        answer: { slots: { dhcpStart: 'sg', dhcpEnd: 'eg', extPort: 'ext', fwdTo: 'fg' } } }
    ]
  },

  {
    id: 'a1-soho-10',
    cert: 'aplus-core1', objective: '2.6', topic: 'Private (172.16) addressing + DHCP scope vs static reservation',
    title: 'LedgerNet accounting firm router build',
    estMinutes: 5, archetype: 'soho',
    scenario: 'An accounting firm runs its LAN on 172.16.1.0/24. Ticket: staff Wi-Fi LedgerNet on the strongest security, isolated guest Wi-Fi for clients dropping off documents, a DHCP pool covering about 35 devices that keeps the file-server NAS at 172.16.1.250 on its fixed IP, and outside port 8443 forwarded to the NAS portal.',
    assets: { reference: { kind: 'network',
      given: { site: 'LedgerNet Accounting — firm router', subnet: '172.16.1.0/24 · router 172.16.1.1' },
      devices: [
        { id: 'rtr', label: 'Firm router', type: 'router', ip: '172.16.1.1' },
        { id: 'nas', label: 'File-server NAS', type: 'server', ip: '172.16.1.250 · 443' },
        { id: 'staff', label: 'Accountant PCs', type: 'pc', ip: '35 DHCP clients' }
      ],
      links: []
    } },
    soho: {
      subnet: { networkId: '172.16.1.0', mask: '255.255.255.0' },
      routerIp: '172.16.1.1',
      statics: [{ ip: '172.16.1.250', label: 'File-server NAS' }],
      clientCount: 35,
      require: { ssid: 'LedgerNet', security: 'WPA3-Personal' }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Set up the wireless section to match the ticket: staff SSID, strongest security, and guest isolation.',
        explanation: 'Name the staff network exactly as the ticket spells it (LedgerNet), pick WPA3-Personal (the strongest personal mode this router offers — stronger than WPA2, far stronger than WEP or Open), and turn the guest network on but isolated so guests get internet without touching the staff LAN.',
        payload: { slots: [
          { id: 'ssid', label: 'Network name (SSID)', options: [
            { id: 'good', text: 'LedgerNet' }, { id: 'd0', text: 'LedgerNet-Guest' }, { id: 'd1', text: 'Ubiquiti-7F2' } ] },
          { id: 'security', label: 'Security mode', options: [
            { id: 'open', text: 'Open' }, { id: 'wep', text: 'WEP' }, { id: 'wpa2', text: 'WPA2-Personal' }, { id: 'wpa3', text: 'WPA3-Personal' } ] },
          { id: 'guest', label: 'Guest network', options: [
            { id: 'iso', text: 'On, isolated from LAN' }, { id: 'bridge', text: 'On, bridged to LAN' }, { id: 'off', text: 'Off' } ] }
        ] },
        answer: { slots: { ssid: 'good', security: 'wpa3', guest: 'iso' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Set the DHCP pool and the port-forward so the pool covers every device, never hands out a reserved static, and the outside port reaches the right host.',
        explanation: 'Start the pool above the router and any static reservations, and end it before the reserved statics so DHCP never leases an address a fixed device already owns. The pool must be wide enough for every client. Then forward the outside port to the static host inside the LAN — never to the router itself or an address outside the subnet.',
        payload: { slots: [
          { id: 'dhcpStart', label: 'DHCP pool — start', options: [
            { id: 'sg', text: '172.16.1.20' }, { id: 'st', text: '172.16.1.1' }, { id: 'shi', text: '172.16.1.250' } ] },
          { id: 'dhcpEnd', label: 'DHCP pool — end', options: [
            { id: 'eg', text: '172.16.1.170' }, { id: 'ew', text: '172.16.1.254' }, { id: 'et', text: '172.16.1.40' } ] },
          { id: 'extPort', label: 'Port forward — external port', options: [
            { id: 'ext', text: '8443' }, { id: 'p443', text: '443' }, { id: 'p80', text: '80' } ] },
          { id: 'fwdTo', label: 'Port forward — forward to (host : port)', options: [
            { id: 'fg', text: '172.16.1.250 : 443' }, { id: 'foff', text: '198.51.100.250 : 443' }, { id: 'fw', text: '172.16.1.1 : 443' } ] }
        ] },
        answer: { slots: { dhcpStart: 'sg', dhcpEnd: 'eg', extPort: 'ext', fwdTo: 'fg' } } }
    ]
  },

  {
    id: 'a1-soho-11',
    cert: 'aplus-core1', objective: '2.6', topic: 'Tight-pool trap — pool must cover every client',
    title: 'MakerSpace almost starves its DHCP pool',
    estMinutes: 5, archetype: 'soho',
    scenario: 'A community makerspace has about 40 members’ devices online at once. Ticket: staff Wi-Fi MakerSpace on the strongest security, an isolated guest network for drop-in visitors, a DHCP pool that actually fits all 40 devices while leaving the camera NVR at 192.168.1.200 reserved, and outside port 8443 forwarded to the NVR. Watch the pool end — one option looks tidy but is far too small for 40 clients.',
    assets: { reference: { kind: 'network',
      given: { site: 'MakerSpace — workshop router', subnet: '192.168.1.0/24 · router 192.168.1.1' },
      devices: [
        { id: 'rtr', label: 'Workshop router', type: 'router', ip: '192.168.1.1' },
        { id: 'nvr', label: 'Camera NVR', type: 'server', ip: '192.168.1.200 · 443' },
        { id: 'members', label: 'Member devices', type: 'pc', ip: '40 DHCP clients' }
      ],
      links: []
    } },
    soho: {
      subnet: { networkId: '192.168.1.0', mask: '255.255.255.0' },
      routerIp: '192.168.1.1',
      statics: [{ ip: '192.168.1.200', label: 'Camera NVR' }],
      clientCount: 40,
      require: { ssid: 'MakerSpace', security: 'WPA3-Personal' }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Set up the wireless section to match the ticket: staff SSID, strongest security, and guest isolation.',
        explanation: 'Name the staff network exactly as the ticket spells it (MakerSpace), pick WPA3-Personal (the strongest personal mode this router offers — stronger than WPA2, far stronger than WEP or Open), and turn the guest network on but isolated so guests get internet without touching the staff LAN.',
        payload: { slots: [
          { id: 'ssid', label: 'Network name (SSID)', options: [
            { id: 'good', text: 'MakerSpace' }, { id: 'd0', text: 'MakerSpace-Guest' }, { id: 'd1', text: 'TP-Link_MK01' } ] },
          { id: 'security', label: 'Security mode', options: [
            { id: 'open', text: 'Open' }, { id: 'wep', text: 'WEP' }, { id: 'wpa2', text: 'WPA2-Personal' }, { id: 'wpa3', text: 'WPA3-Personal' } ] },
          { id: 'guest', label: 'Guest network', options: [
            { id: 'iso', text: 'On, isolated from LAN' }, { id: 'bridge', text: 'On, bridged to LAN' }, { id: 'off', text: 'Off' } ] }
        ] },
        answer: { slots: { ssid: 'good', security: 'wpa3', guest: 'iso' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Set the DHCP pool and the port-forward so the pool covers every device, never hands out a reserved static, and the outside port reaches the right host.',
        explanation: 'Start the pool above the router and any static reservations, and end it before the reserved statics so DHCP never leases an address a fixed device already owns. The pool must be wide enough for every client. Then forward the outside port to the static host inside the LAN — never to the router itself or an address outside the subnet.',
        payload: { slots: [
          { id: 'dhcpStart', label: 'DHCP pool — start', options: [
            { id: 'sg', text: '192.168.1.100' }, { id: 'st', text: '192.168.1.1' }, { id: 'shi', text: '192.168.1.200' } ] },
          { id: 'dhcpEnd', label: 'DHCP pool — end', options: [
            { id: 'eg', text: '192.168.1.199' }, { id: 'ew', text: '192.168.1.254' }, { id: 'et', text: '192.168.1.130' } ] },
          { id: 'extPort', label: 'Port forward — external port', options: [
            { id: 'ext', text: '8443' }, { id: 'p443', text: '443' }, { id: 'p80', text: '80' } ] },
          { id: 'fwdTo', label: 'Port forward — forward to (host : port)', options: [
            { id: 'fg', text: '192.168.1.200 : 443' }, { id: 'foff', text: '203.0.113.200 : 443' }, { id: 'fw', text: '192.168.1.1 : 443' } ] }
        ] },
        answer: { slots: { dhcpStart: 'sg', dhcpEnd: 'eg', extPort: 'ext', fwdTo: 'fg' } } }
    ]
  },

  {
    id: 'a1-soho-12',
    cert: 'aplus-core1', objective: '2.6', topic: 'Router-IP-in-pool trap — start above the gateway',
    title: 'GreenGrocer nearly leases out the router IP',
    estMinutes: 5, archetype: 'soho',
    scenario: 'A neighbourhood grocer is configuring its router. Ticket: staff Wi-Fi GreenGrocer on the strongest security, an isolated guest network for shoppers, a DHCP pool for about 18 devices that keeps the camera NVR at 192.168.1.200 reserved, and outside port 8443 forwarded to the NVR. Mind the pool start — one option begins at the router’s own address 192.168.1.1, which would let DHCP lease out the gateway.',
    assets: { reference: { kind: 'network',
      given: { site: 'GreenGrocer Market — store router', subnet: '192.168.1.0/24 · router 192.168.1.1' },
      devices: [
        { id: 'rtr', label: 'Store router', type: 'router', ip: '192.168.1.1' },
        { id: 'nvr', label: 'Camera NVR', type: 'server', ip: '192.168.1.200 · 443' },
        { id: 'staff', label: 'Store devices', type: 'pc', ip: '18 DHCP clients' }
      ],
      links: []
    } },
    soho: {
      subnet: { networkId: '192.168.1.0', mask: '255.255.255.0' },
      routerIp: '192.168.1.1',
      statics: [{ ip: '192.168.1.200', label: 'Camera NVR' }],
      clientCount: 18,
      require: { ssid: 'GreenGrocer', security: 'WPA3-Personal' }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Set up the wireless section to match the ticket: staff SSID, strongest security, and guest isolation.',
        explanation: 'Name the staff network exactly as the ticket spells it (GreenGrocer), pick WPA3-Personal (the strongest personal mode this router offers — stronger than WPA2, far stronger than WEP or Open), and turn the guest network on but isolated so guests get internet without touching the staff LAN.',
        payload: { slots: [
          { id: 'ssid', label: 'Network name (SSID)', options: [
            { id: 'good', text: 'GreenGrocer' }, { id: 'd0', text: 'GreenGrocer-Guest' }, { id: 'd1', text: 'Netgear_GG7' } ] },
          { id: 'security', label: 'Security mode', options: [
            { id: 'open', text: 'Open' }, { id: 'wep', text: 'WEP' }, { id: 'wpa2', text: 'WPA2-Personal' }, { id: 'wpa3', text: 'WPA3-Personal' } ] },
          { id: 'guest', label: 'Guest network', options: [
            { id: 'iso', text: 'On, isolated from LAN' }, { id: 'bridge', text: 'On, bridged to LAN' }, { id: 'off', text: 'Off' } ] }
        ] },
        answer: { slots: { ssid: 'good', security: 'wpa3', guest: 'iso' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Set the DHCP pool and the port-forward so the pool covers every device, never hands out a reserved static, and the outside port reaches the right host.',
        explanation: 'Start the pool above the router and any static reservations, and end it before the reserved statics so DHCP never leases an address a fixed device already owns. The pool must be wide enough for every client. Then forward the outside port to the static host inside the LAN — never to the router itself or an address outside the subnet.',
        payload: { slots: [
          { id: 'dhcpStart', label: 'DHCP pool — start', options: [
            { id: 'sg', text: '192.168.1.100' }, { id: 'st', text: '192.168.1.1' }, { id: 'shi', text: '192.168.1.200' } ] },
          { id: 'dhcpEnd', label: 'DHCP pool — end', options: [
            { id: 'eg', text: '192.168.1.199' }, { id: 'ew', text: '192.168.1.254' }, { id: 'et', text: '192.168.1.112' } ] },
          { id: 'extPort', label: 'Port forward — external port', options: [
            { id: 'ext', text: '8443' }, { id: 'p443', text: '443' }, { id: 'p80', text: '80' } ] },
          { id: 'fwdTo', label: 'Port forward — forward to (host : port)', options: [
            { id: 'fg', text: '192.168.1.200 : 443' }, { id: 'foff', text: '198.51.100.200 : 443' }, { id: 'fw', text: '192.168.1.1 : 443' } ] }
        ] },
        answer: { slots: { dhcpStart: 'sg', dhcpEnd: 'eg', extPort: 'ext', fwdTo: 'fg' } } }
    ]
  },
  // ---------- APIPA (4) — objective 2.5 (Compare common network configuration concepts) ----------
  {
    id: 'a1-cot-01', cert: 'aplus-core1', archetype: 'triage', objective: '2.5',
    topic: 'Command-output evidence triage — client IP addressing',
    title: 'Home user: "the internet just stopped working" on a wired desktop', estMinutes: 6,
    scenario: 'A home user calls in saying their wired desktop PC "can\'t get on the internet" this morning, though it worked fine yesterday. Nothing else changed in the house. You have them run ipconfig /all and a ping to a known-good site over the phone. Review the output, flag the lines that are actual evidence of the fault, then diagnose it.',
    triage: { fault: 'apipa' },
    assets: { reference: { kind: 'terminal', host: 'DESKTOP-HOME1', session: 'cmd', excerpts: [
      { id: 'ipcfg', promptLine: 'ipconfig /all', lines: [
        { id: 'l1', select: false, ctx: true, text: 'Windows IP Configuration' },
        { id: 'l2', select: false, ctx: true, text: '   Host Name . . . . . . . . . . . : DESKTOP-HOME1' },
        { id: 'l3', select: false, ctx: true, text: 'Ethernet adapter Ethernet:' },
        { id: 'l4', select: true, evidence: false, text: '   Media State . . . . . . . . . . : Media connected' },
        { id: 'l5', select: false, ctx: true, text: '   Description . . . . . . . . . . : Realtek PCIe GbE Family Controller' },
        { id: 'l6', select: true, evidence: true, text: '   Autoconfiguration Enabled . . . : Yes' },
        { id: 'l7', select: true, evidence: true, text: '   IPv4 Address. . . . . . . . . . : 169.254.83.12(Preferred)' },
        { id: 'l8', select: false, ctx: true, text: '   Subnet Mask . . . . . . . . . . : 255.255.0.0' },
        { id: 'l9', select: true, evidence: true, text: '   Default Gateway                  :' },
        { id: 'l10', select: false, ctx: true, text: '   DHCP Enabled. . . . . . . . . . : Yes' }
      ] },
      { id: 'ping', promptLine: 'ping 8.8.8.8', lines: [
        { id: 'l11', select: false, ctx: true, text: 'Pinging 8.8.8.8 with 32 bytes of data:' },
        { id: 'l12', select: false, ctx: true, text: 'PING: transmit failed. General failure.' },
        { id: 'l13', select: false, ctx: true, text: 'PING: transmit failed. General failure.' }
      ] }
    ] } },
    steps: [
      { id: 'flag', type: 'analyze', points: 1,
        prompt: 'Tap the specific output lines that are evidence of why this PC has no internet.',
        explanation: 'A 169.254.x.x address with no default gateway and autoconfiguration enabled is the classic self-assigned APIPA address the OS falls back to when it cannot reach a DHCP server. "Media connected" only proves the cable/link is up — it does not explain the missing internet, so it is not evidence of this fault.',
        payload: { multi: true, mode: 'excerptLines', scoring: 'lenient' },
        answer: { selected: ['l6', 'l7', 'l9'] } },
      { id: 'dx', type: 'configure', points: 1,
        prompt: 'Name the root cause and your first troubleshooting move.',
        explanation: 'The 169.254.x.x address confirms the NIC gave up waiting on DHCP and self-assigned an APIPA address — no usable default gateway exists at that address. Releasing and renewing the lease (or power-cycling the router if renew keeps failing) is the correct first move, not replacing hardware.',
        payload: { slots: [
          { id: 'diagnosis', label: 'Root cause', options: [
            { id: 'a', text: 'No DHCP response received; NIC self-assigned an APIPA (169.254.x.x) address' },
            { id: 'b', text: 'The Ethernet cable is physically damaged' },
            { id: 'c', text: 'A firewall rule is blocking all outbound traffic' }
          ] },
          { id: 'firstMove', label: 'First troubleshooting step', options: [
            { id: 'a', text: 'Run ipconfig /release then ipconfig /renew to request a fresh DHCP lease' },
            { id: 'b', text: 'Replace the Ethernet cable' },
            { id: 'c', text: 'Reinstall the operating system' }
          ] }
        ] },
        answer: { slots: { diagnosis: 'a', firstMove: 'a' } } }
    ]
  },

  {
    id: 'a1-cot-02', cert: 'aplus-core1', archetype: 'triage', objective: '2.5',
    topic: 'Command-output evidence triage — client IP addressing',
    title: 'Small office: one laptop can\'t reach the shared printer or internet over Wi-Fi', estMinutes: 6,
    scenario: 'In a 6-person office, one employee\'s laptop suddenly can\'t print to the network printer or browse the web, while every other coworker on the same Wi-Fi is fine. You remote in and pull ipconfig /all and a ping to the router. Flag the evidence, then diagnose and pick the fix.',
    triage: { fault: 'apipa' },
    assets: { reference: { kind: 'terminal', host: 'LAPTOP-EMP07', session: 'cmd', excerpts: [
      { id: 'ipcfg', promptLine: 'ipconfig /all', lines: [
        { id: 'l1', select: false, ctx: true, text: 'Wireless LAN adapter Wi-Fi:' },
        { id: 'l2', select: true, evidence: false, text: '   Connection-specific DNS Suffix  . :' },
        { id: 'l3', select: false, ctx: true, text: '   Description . . . . . . . . . . : Intel(R) Wi-Fi 6 AX201' },
        { id: 'l4', select: true, evidence: true, text: '   Autoconfiguration Enabled . . . : Yes' },
        { id: 'l5', select: true, evidence: true, text: '   IPv4 Address. . . . . . . . . . : 169.254.211.4(Preferred)' },
        { id: 'l6', select: false, ctx: true, text: '   Subnet Mask . . . . . . . . . . : 255.255.0.0' },
        { id: 'l7', select: true, evidence: true, text: '   Default Gateway                  :' },
        { id: 'l8', select: false, ctx: true, text: '   DHCP Server . . . . . . . . . . :' },
        { id: 'l9', select: false, ctx: true, text: '   Physical Address. . . . . . . . : 3C-58-C2-11-A9-77' }
      ] },
      { id: 'ping', promptLine: 'ping 192.168.1.1', lines: [
        { id: 'l10', select: false, ctx: true, text: 'Pinging 192.168.1.1 with 32 bytes of data:' },
        { id: 'l11', select: false, ctx: true, text: 'Reply from 169.254.211.4: Destination host unreachable.' },
        { id: 'l12', select: false, ctx: true, text: 'Reply from 169.254.211.4: Destination host unreachable.' }
      ] }
    ] } },
    steps: [
      { id: 'flag', type: 'analyze', points: 1,
        prompt: 'Tap the specific output lines that are evidence of why this one laptop lost network access.',
        explanation: 'The IPv4 address in the 169.254.x.x range, autoconfiguration enabled, and a blank default gateway together confirm the laptop never got a real lease from the office router and fell back to APIPA. A blank DNS suffix is normal/cosmetic on plenty of healthy machines and proves nothing about this fault on its own.',
        payload: { multi: true, mode: 'excerptLines', scoring: 'lenient' },
        answer: { selected: ['l4', 'l5', 'l7'] } },
      { id: 'dx', type: 'configure', points: 1,
        prompt: 'Name the root cause and your first troubleshooting move.',
        explanation: 'A single machine failing to get a lease while peers succeed points to that host\'s DHCP negotiation failing, not a router-wide outage — the fix is to force a fresh release/renew on the affected laptop first.',
        payload: { slots: [
          { id: 'diagnosis', label: 'Root cause', options: [
            { id: 'a', text: 'Laptop failed to receive a DHCP lease and self-assigned an APIPA address' },
            { id: 'b', text: 'The office router\'s firmware crashed' },
            { id: 'c', text: 'The printer\'s IP address changed' }
          ] },
          { id: 'firstMove', label: 'First troubleshooting step', options: [
            { id: 'a', text: 'ipconfig /release and ipconfig /renew on the affected laptop' },
            { id: 'b', text: 'Reboot the network printer' },
            { id: 'c', text: 'Change the laptop\'s DNS suffix' }
          ] }
        ] },
        answer: { slots: { diagnosis: 'a', firstMove: 'a' } } }
    ]
  },

  {
    id: 'a1-cot-03', cert: 'aplus-core1', archetype: 'triage', objective: '2.5',
    topic: 'Command-output evidence triage — client IP addressing',
    title: 'Freelancer\'s desktop loses connectivity after an overnight power blip', estMinutes: 6,
    scenario: 'A freelance designer says their desktop was fine last night, but after a brief power flicker overnight nothing loads this morning. The router\'s lights look normal. You ask them to run ipconfig /all and ping the router\'s address. Flag the evidence, then diagnose.',
    triage: { fault: 'apipa' },
    assets: { reference: { kind: 'terminal', host: 'DESKTOP-FREELANCE', session: 'cmd', excerpts: [
      { id: 'ipcfg', promptLine: 'ipconfig /all', lines: [
        { id: 'l1', select: false, ctx: true, text: 'Ethernet adapter Ethernet:' },
        { id: 'l2', select: true, evidence: false, text: '   Media State . . . . . . . . . . : Media connected' },
        { id: 'l3', select: false, ctx: true, text: '   Description . . . . . . . . . . : Killer E3000 Gigabit Ethernet Controller' },
        { id: 'l4', select: true, evidence: true, text: '   Autoconfiguration Enabled . . . : Yes' },
        { id: 'l5', select: true, evidence: true, text: '   IPv4 Address. . . . . . . . . . : 169.254.19.201(Preferred)' },
        { id: 'l6', select: false, ctx: true, text: '   Subnet Mask . . . . . . . . . . : 255.255.0.0' },
        { id: 'l7', select: true, evidence: true, text: '   Default Gateway                  :' },
        { id: 'l8', select: false, ctx: true, text: '   Lease Obtained. . . . . . . . . : N/A' }
      ] },
      { id: 'ping', promptLine: 'ping 192.168.0.1', lines: [
        { id: 'l9', select: false, ctx: true, text: 'Pinging 192.168.0.1 with 32 bytes of data:' },
        { id: 'l10', select: false, ctx: true, text: 'PING: transmit failed. General failure.' }
      ] }
    ] } },
    steps: [
      { id: 'flag', type: 'analyze', points: 1,
        prompt: 'Tap the specific output lines that prove why the desktop has no connectivity this morning.',
        explanation: 'The 169.254.x.x address, autoconfiguration enabled, and empty default gateway together prove the router\'s DHCP service was not reachable when the PC last tried to renew — likely because the router itself was still rebooting after the power blip. "Media connected" only shows the cable link is physically up, which is true here and irrelevant to the address problem.',
        payload: { multi: true, mode: 'excerptLines', scoring: 'lenient' },
        answer: { selected: ['l4', 'l5', 'l7'] } },
      { id: 'dx', type: 'configure', points: 1,
        prompt: 'Name the root cause and your first troubleshooting move.',
        explanation: 'A self-assigned APIPA address after a power event most often means the DHCP server (the router) was down or still booting at lease-renewal time. Renewing the lease now that the router should be back up is the correct first move.',
        payload: { slots: [
          { id: 'diagnosis', label: 'Root cause', options: [
            { id: 'a', text: 'DHCP request failed and the PC self-assigned an APIPA address' },
            { id: 'b', text: 'The Ethernet NIC driver is corrupted' },
            { id: 'c', text: 'A duplicate IP address exists on the network' }
          ] },
          { id: 'firstMove', label: 'First troubleshooting step', options: [
            { id: 'a', text: 'Run ipconfig /release then ipconfig /renew to re-request a DHCP lease' },
            { id: 'b', text: 'Update the NIC driver' },
            { id: 'c', text: 'Assign a static IP address permanently' }
          ] }
        ] },
        answer: { slots: { diagnosis: 'a', firstMove: 'a' } } }
    ]
  },

  {
    id: 'a1-cot-04', cert: 'aplus-core1', archetype: 'triage', objective: '2.5',
    topic: 'Command-output evidence triage — client IP addressing',
    title: 'Laptop on guest Wi-Fi shows connected but nothing loads', estMinutes: 6,
    scenario: 'A guest at a small clinic says their Windows laptop shows "connected" to the guest Wi-Fi but no web pages load. Front desk asks you to check it over a remote session. You capture ipconfig /all plus a ping. Flag the evidence, then diagnose.',
    triage: { fault: 'apipa' },
    assets: { reference: { kind: 'terminal', host: 'GUEST-LAPTOP', session: 'cmd', excerpts: [
      { id: 'ipcfg', promptLine: 'ipconfig /all', lines: [
        { id: 'l1', select: false, ctx: true, text: 'Wireless LAN adapter Wi-Fi:' },
        { id: 'l2', select: false, ctx: true, text: '   Description . . . . . . . . . . : Qualcomm QCA9377 Wireless Network Adapter' },
        { id: 'l3', select: true, evidence: false, text: '   Physical Address. . . . . . . . : A4-C3-F0-88-12-6E' },
        { id: 'l4', select: true, evidence: true, text: '   Autoconfiguration Enabled . . . : Yes' },
        { id: 'l5', select: true, evidence: true, text: '   IPv4 Address. . . . . . . . . . : 169.254.44.90(Preferred)' },
        { id: 'l6', select: false, ctx: true, text: '   Subnet Mask . . . . . . . . . . : 255.255.0.0' },
        { id: 'l7', select: true, evidence: true, text: '   Default Gateway                  :' }
      ] },
      { id: 'ping', promptLine: 'ping guestgateway.local', lines: [
        { id: 'l8', select: false, ctx: true, text: 'Ping request could not find host guestgateway.local. Please check the name and try again.' }
      ] }
    ] } },
    steps: [
      { id: 'flag', type: 'analyze', points: 1,
        prompt: 'Tap the specific output lines that are evidence of why the laptop appears connected but nothing loads.',
        explanation: 'A 169.254.x.x address with autoconfiguration on and no default gateway proves the guest device never obtained a real lease from the guest SSID\'s DHCP scope, even though the radio link ("connected") is up. The physical (MAC) address is device identity, not evidence of an addressing fault.',
        payload: { multi: true, mode: 'excerptLines', scoring: 'lenient' },
        answer: { selected: ['l4', 'l5', 'l7'] } },
      { id: 'dx', type: 'configure', points: 1,
        prompt: 'Name the root cause and your first troubleshooting move.',
        explanation: 'This is textbook APIPA: link/association succeeded but DHCP never handed out a lease, possibly because the guest scope is exhausted or the AP\'s DHCP relay is misconfigured. The first move on the affected client is still to force a fresh DHCP request before escalating to the network side.',
        payload: { slots: [
          { id: 'diagnosis', label: 'Root cause', options: [
            { id: 'a', text: 'Device associated to Wi-Fi but never received a DHCP lease; it self-assigned an APIPA address' },
            { id: 'b', text: 'The guest SSID uses the wrong Wi-Fi security protocol' },
            { id: 'c', text: 'The laptop\'s Wi-Fi radio is defective' }
          ] },
          { id: 'firstMove', label: 'First troubleshooting step', options: [
            { id: 'a', text: 'Forget the network and reconnect, or release/renew the IP, to request a fresh DHCP lease' },
            { id: 'b', text: 'Reinstall the laptop\'s operating system' },
            { id: 'c', text: 'Change the guest SSID password' }
          ] }
        ] },
        answer: { slots: { diagnosis: 'a', firstMove: 'a' } } }
    ]
  },

  // ---------- DEAD DNS (4) — objective 2.5 (Compare common network configuration concepts) ----------
  {
    id: 'a1-cot-05', cert: 'aplus-core1', archetype: 'triage', objective: '2.5',
    topic: 'Command-output evidence triage — DNS resolution',
    title: 'Home user: websites won\'t load by name but streaming apps still work', estMinutes: 6,
    scenario: 'A home user reports that typing web addresses into the browser gives "can\'t find this page" errors, but their smart TV streaming apps (which use their own internal servers, not the browser) still work fine. You have them run ipconfig /all, ping a site by name, and an nslookup. Flag the evidence, then diagnose.',
    triage: { fault: 'deadDns' },
    assets: { reference: { kind: 'terminal', host: 'DESKTOP-HOME2', session: 'cmd', excerpts: [
      { id: 'ipcfg', promptLine: 'ipconfig /all', lines: [
        { id: 'l1', select: false, ctx: true, text: 'Ethernet adapter Ethernet:' },
        { id: 'l2', select: true, evidence: false, text: '   Media State . . . . . . . . . . : Media connected' },
        { id: 'l3', select: false, ctx: true, text: '   IPv4 Address. . . . . . . . . . : 192.168.1.55(Preferred)' },
        { id: 'l4', select: false, ctx: true, text: '   Default Gateway . . . . . . . . : 192.168.1.1' },
        { id: 'l5', select: false, ctx: true, text: '   DHCP Server . . . . . . . . . . : 192.168.1.1' },
        { id: 'l6', select: false, ctx: true, text: '   DNS Servers . . . . . . . . . . : 192.168.1.1' }
      ] },
      { id: 'ping', promptLine: 'ping www.example.com', lines: [
        { id: 'l7', select: true, evidence: true, text: 'Ping request could not find host www.example.com. Please check the name and try again.' }
      ] },
      { id: 'pingip', promptLine: 'ping 93.184.216.34', lines: [
        { id: 'l8', select: false, ctx: true, text: 'Pinging 93.184.216.34 with 32 bytes of data:' },
        { id: 'l9', select: false, ctx: true, text: 'Reply from 93.184.216.34: bytes=32 time=21ms TTL=54' },
        { id: 'l10', select: false, ctx: true, text: 'Reply from 93.184.216.34: bytes=32 time=19ms TTL=54' }
      ] },
      { id: 'nslookup', promptLine: 'nslookup www.example.com', lines: [
        { id: 'l11', select: false, ctx: true, text: 'Server:  UnKnown' },
        { id: 'l12', select: false, ctx: true, text: 'Address:  192.168.1.1' },
        { id: 'l13', select: true, evidence: true, text: 'DNS request timed out.' },
        { id: 'l14', select: true, evidence: true, text: '*** Request to UnKnown timed-out' }
      ] }
    ] } },
    steps: [
      { id: 'flag', type: 'analyze', points: 1,
        prompt: 'Tap the specific output lines that prove why web addresses won\'t resolve while raw IPs still work.',
        explanation: 'Pinging the site by name fails to resolve, and nslookup against the configured DNS server times out entirely — while a ping straight to the site\'s IP address succeeds, proving the network path itself is fine and only name resolution is broken. "Media connected" only confirms the link is up, which is not in question here.',
        payload: { multi: true, mode: 'excerptLines', scoring: 'lenient' },
        answer: { selected: ['l7', 'l13', 'l14'] } },
      { id: 'dx', type: 'configure', points: 1,
        prompt: 'Name the root cause and your first troubleshooting move.',
        explanation: 'IP connectivity works but name lookups time out against the configured DNS server, so the DNS server itself is unreachable or down — not a routing or cabling problem. Flushing the resolver cache and testing an alternate DNS server (e.g., 8.8.8.8) is the appropriate first move.',
        payload: { slots: [
          { id: 'diagnosis', label: 'Root cause', options: [
            { id: 'a', text: 'The configured DNS server is unreachable, so name resolution is failing' },
            { id: 'b', text: 'The default gateway is down' },
            { id: 'c', text: 'The Ethernet cable is unplugged' }
          ] },
          { id: 'firstMove', label: 'First troubleshooting step', options: [
            { id: 'a', text: 'Run ipconfig /flushdns and try an alternate DNS server such as 8.8.8.8' },
            { id: 'b', text: 'Replace the network cable' },
            { id: 'c', text: 'Restart the smart TV' }
          ] }
        ] },
        answer: { slots: { diagnosis: 'a', firstMove: 'a' } } }
    ]
  },

  {
    id: 'a1-cot-06', cert: 'aplus-core1', archetype: 'triage', objective: '2.5',
    topic: 'Command-output evidence triage — DNS resolution',
    title: 'Small office: everyone can email internally but nobody can browse out', estMinutes: 6,
    scenario: 'Office staff report that internal email (which uses a hostname on the local mail server, cached in DNS earlier this morning) still works, but every external website fails to load for all 6 users at once. You remote into one workstation and pull ipconfig /all, ping by name, and nslookup. Flag the evidence, then diagnose.',
    triage: { fault: 'deadDns' },
    assets: { reference: { kind: 'terminal', host: 'LAPTOP-EMP03', session: 'cmd', excerpts: [
      { id: 'ipcfg', promptLine: 'ipconfig /all', lines: [
        { id: 'l1', select: false, ctx: true, text: 'Ethernet adapter Ethernet:' },
        { id: 'l2', select: false, ctx: true, text: '   IPv4 Address. . . . . . . . . . : 10.10.0.42(Preferred)' },
        { id: 'l3', select: false, ctx: true, text: '   Default Gateway . . . . . . . . : 10.10.0.1' },
        { id: 'l4', select: true, evidence: false, text: '   Physical Address. . . . . . . . : 00-1B-44-11-3A-B7' },
        { id: 'l5', select: false, ctx: true, text: '   DNS Servers . . . . . . . . . . : 10.10.0.5' }
      ] },
      { id: 'pinggw', promptLine: 'ping 10.10.0.1', lines: [
        { id: 'l6', select: false, ctx: true, text: 'Pinging 10.10.0.1 with 32 bytes of data:' },
        { id: 'l7', select: false, ctx: true, text: 'Reply from 10.10.0.1: bytes=32 time<1ms TTL=64' }
      ] },
      { id: 'ping', promptLine: 'ping www.vendorportal.com', lines: [
        { id: 'l8', select: true, evidence: true, text: 'Ping request could not find host www.vendorportal.com. Please check the name and try again.' }
      ] },
      { id: 'nslookup', promptLine: 'nslookup www.vendorportal.com 10.10.0.5', lines: [
        { id: 'l9', select: false, ctx: true, text: 'Server:  UnKnown' },
        { id: 'l10', select: false, ctx: true, text: 'Address:  10.10.0.5' },
        { id: 'l11', select: true, evidence: true, text: 'DNS request timed out.' },
        { id: 'l12', select: true, evidence: true, text: 'timeout was 2 seconds.' }
      ] }
    ] } },
    steps: [
      { id: 'flag', type: 'analyze', points: 1,
        prompt: 'Tap the specific output lines that prove why external browsing failed office-wide while internal traffic to a cached name still works.',
        explanation: 'The failed name ping and the timed-out nslookup against the office\'s internal DNS server (10.10.0.5) point straight at that server as the failure point, while the successful gateway ping confirms the LAN and routing are healthy. The workstation\'s own MAC address is identity information, not evidence of a DNS fault.',
        payload: { multi: true, mode: 'excerptLines', scoring: 'lenient' },
        answer: { selected: ['l8', 'l11', 'l12'] } },
      { id: 'dx', type: 'configure', points: 1,
        prompt: 'Name the root cause and your first troubleshooting move.',
        explanation: 'The gateway is reachable but the office\'s internal DNS server times out on every fresh lookup — that server (or the DNS service on it) is down. The first move is to point the affected client at a known-good external DNS server to restore browsing while the internal DNS server is investigated.',
        payload: { slots: [
          { id: 'diagnosis', label: 'Root cause', options: [
            { id: 'a', text: 'The office\'s internal DNS server is down or unreachable' },
            { id: 'b', text: 'The office router lost its internet uplink' },
            { id: 'c', text: 'A duplicate IP address is on the network' }
          ] },
          { id: 'firstMove', label: 'First troubleshooting step', options: [
            { id: 'a', text: 'Temporarily point clients to a public DNS server (e.g., 8.8.8.8) and check the internal DNS server' },
            { id: 'b', text: 'Reboot the office router' },
            { id: 'c', text: 'Reassign static IP addresses to every workstation' }
          ] }
        ] },
        answer: { slots: { diagnosis: 'a', firstMove: 'a' } } }
    ]
  },

  {
    id: 'a1-cot-07', cert: 'aplus-core1', archetype: 'triage', objective: '2.5',
    topic: 'Command-output evidence triage — DNS resolution',
    title: 'Traveler on hotel Wi-Fi: laptop connects but no site will open', estMinutes: 6,
    scenario: 'A traveling employee connects their laptop to hotel guest Wi-Fi and can see the connection is active, but no website opens, including ones they know are up. They call IT and you walk them through ipconfig /all, a ping by name, and nslookup. Flag the evidence, then diagnose.',
    triage: { fault: 'deadDns' },
    assets: { reference: { kind: 'terminal', host: 'LAPTOP-TRAVELER', session: 'cmd', excerpts: [
      { id: 'ipcfg', promptLine: 'ipconfig /all', lines: [
        { id: 'l1', select: false, ctx: true, text: 'Wireless LAN adapter Wi-Fi:' },
        { id: 'l2', select: false, ctx: true, text: '   IPv4 Address. . . . . . . . . . : 172.16.4.203(Preferred)' },
        { id: 'l3', select: false, ctx: true, text: '   Default Gateway . . . . . . . . : 172.16.4.1' },
        { id: 'l4', select: true, evidence: false, text: '   Lease Obtained. . . . . . . . . : Tuesday, July 7, 2026 8:02:11 PM' },
        { id: 'l5', select: false, ctx: true, text: '   DNS Servers . . . . . . . . . . : 172.16.4.1' }
      ] },
      { id: 'pinggw', promptLine: 'ping 172.16.4.1', lines: [
        { id: 'l6', select: false, ctx: true, text: 'Pinging 172.16.4.1 with 32 bytes of data:' },
        { id: 'l7', select: false, ctx: true, text: 'Reply from 172.16.4.1: bytes=32 time=2ms TTL=64' }
      ] },
      { id: 'ping', promptLine: 'ping www.companyportal.com', lines: [
        { id: 'l8', select: true, evidence: true, text: 'Ping request could not find host www.companyportal.com. Please check the name and try again.' }
      ] },
      { id: 'nslookup', promptLine: 'nslookup www.companyportal.com', lines: [
        { id: 'l9', select: false, ctx: true, text: 'Server:  UnKnown' },
        { id: 'l10', select: false, ctx: true, text: 'Address:  172.16.4.1' },
        { id: 'l11', select: true, evidence: true, text: 'DNS request timed out.' },
        { id: 'l12', select: true, evidence: true, text: '*** Request to UnKnown timed-out' }
      ] }
    ] } },
    steps: [
      { id: 'flag', type: 'analyze', points: 1,
        prompt: 'Tap the specific output lines that prove why no site opens even though the laptop is on the hotel Wi-Fi.',
        explanation: 'The failed name-based ping and the DNS timeouts against the hotel gateway (which is also serving as DNS here) confirm name resolution is broken, while the successful gateway ping shows the wireless link and local routing are fine. The DHCP lease timestamp is routine informational output, not fault evidence.',
        payload: { multi: true, mode: 'excerptLines', scoring: 'lenient' },
        answer: { selected: ['l8', 'l11', 'l12'] } },
      { id: 'dx', type: 'configure', points: 1,
        prompt: 'Name the root cause and your first troubleshooting move.',
        explanation: 'The hotel\'s gateway is also acting as the DNS server here, and it isn\'t forwarding DNS queries out — so lookups time out even though the link and the gateway itself still respond to pings. Manually setting a public DNS server on the laptop is the fastest first move to restore browsing.',
        payload: { slots: [
          { id: 'diagnosis', label: 'Root cause', options: [
            { id: 'a', text: 'The hotel\'s DNS service is not resolving queries even though the gateway itself is reachable' },
            { id: 'b', text: 'The laptop\'s Wi-Fi adapter is defective' },
            { id: 'c', text: 'The laptop has an IP address conflict with another guest' }
          ] },
          { id: 'firstMove', label: 'First troubleshooting step', options: [
            { id: 'a', text: 'Manually set a public DNS server (e.g., 1.1.1.1) on the laptop\'s network adapter' },
            { id: 'b', text: 'Forget and rejoin the same hotel Wi-Fi network' },
            { id: 'c', text: 'Replace the laptop\'s Wi-Fi card' }
          ] }
        ] },
        answer: { slots: { diagnosis: 'a', firstMove: 'a' } } }
    ]
  },

  {
    id: 'a1-cot-08', cert: 'aplus-core1', archetype: 'triage', objective: '2.5',
    topic: 'Command-output evidence triage — DNS resolution',
    title: 'Retail kiosk PC can reach the card processor by IP but not the vendor update site', estMinutes: 7,
    scenario: 'A retail store\'s kiosk PC processes payments fine (it\'s hardcoded to the processor\'s IP address) but fails to check for software updates, which point to a hostname. The manager asks you to check it. You capture ipconfig /all, a ping by name, and nslookup. Flag the evidence, then diagnose.',
    triage: { fault: 'deadDns' },
    assets: { reference: { kind: 'terminal', host: 'KIOSK-PC-04', session: 'cmd', excerpts: [
      { id: 'ipcfg', promptLine: 'ipconfig /all', lines: [
        { id: 'l1', select: false, ctx: true, text: 'Ethernet adapter Ethernet:' },
        { id: 'l2', select: false, ctx: true, text: '   IPv4 Address. . . . . . . . . . : 192.168.50.12(Preferred)' },
        { id: 'l3', select: false, ctx: true, text: '   Default Gateway . . . . . . . . : 192.168.50.1' },
        { id: 'l4', select: true, evidence: false, text: '   Subnet Mask . . . . . . . . . . : 255.255.255.0' },
        { id: 'l5', select: false, ctx: true, text: '   DNS Servers . . . . . . . . . . : 192.168.50.2' }
      ] },
      { id: 'pingproc', promptLine: 'ping 54.219.10.7', lines: [
        { id: 'l6', select: false, ctx: true, text: 'Pinging 54.219.10.7 with 32 bytes of data:' },
        { id: 'l7', select: false, ctx: true, text: 'Reply from 54.219.10.7: bytes=32 time=44ms TTL=51' }
      ] },
      { id: 'ping', promptLine: 'ping updates.posvendor.com', lines: [
        { id: 'l8', select: true, evidence: true, text: 'Ping request could not find host updates.posvendor.com. Please check the name and try again.' }
      ] },
      { id: 'nslookup', promptLine: 'nslookup updates.posvendor.com', lines: [
        { id: 'l9', select: false, ctx: true, text: 'Server:  UnKnown' },
        { id: 'l10', select: false, ctx: true, text: 'Address:  192.168.50.2' },
        { id: 'l11', select: true, evidence: true, text: 'DNS request timed out.' },
        { id: 'l12', select: true, evidence: true, text: 'timeout was 2 seconds.' }
      ] }
    ] } },
    steps: [
      { id: 'flag', type: 'analyze', points: 1,
        prompt: 'Tap the specific output lines that prove why the kiosk can process payments but can\'t check for updates.',
        explanation: 'Payments work because the processor is hardcoded by IP, but the update check needs a hostname lookup — the failed name ping and the DNS timeout against 192.168.50.2 prove that server isn\'t answering. The subnet mask line is routine addressing detail, not evidence of a DNS problem.',
        payload: { multi: true, mode: 'excerptLines', scoring: 'lenient' },
        answer: { selected: ['l8', 'l11', 'l12'] } },
      { id: 'dx', type: 'configure', points: 1,
        prompt: 'Name the root cause and your first troubleshooting move.',
        explanation: 'The store\'s DNS server at 192.168.50.2 is not responding to queries, which explains why IP-based traffic works but hostname-based traffic doesn\'t. Flushing the DNS cache and testing against an alternate DNS server confirms the diagnosis and restores functionality.',
        payload: { slots: [
          { id: 'diagnosis', label: 'Root cause', options: [
            { id: 'a', text: 'The store\'s DNS server (192.168.50.2) is not responding to lookup requests' },
            { id: 'b', text: 'The kiosk\'s network cable is faulty' },
            { id: 'c', text: 'The card processor\'s service is down' }
          ] },
          { id: 'firstMove', label: 'First troubleshooting step', options: [
            { id: 'a', text: 'Run ipconfig /flushdns and test resolution against an alternate DNS server' },
            { id: 'b', text: 'Swap the network cable on the kiosk' },
            { id: 'c', text: 'Call the card processor\'s support line' }
          ] }
        ] },
        answer: { slots: { diagnosis: 'a', firstMove: 'a' } } }
    ]
  },

  // ---------- BAD GATEWAY (4) — objective 2.5 (Compare common network configuration concepts) ----------
  {
    id: 'a1-cot-09', cert: 'aplus-core1', archetype: 'triage', objective: '2.5',
    topic: 'Command-output evidence triage — gateway/routing',
    title: 'Home office: local file share works but nothing external loads', estMinutes: 6,
    scenario: 'A remote worker says they can still print to their local network printer and reach a NAS on the home LAN, but no websites or cloud apps load. You have them run ipconfig /all, ping the printer\'s local IP, and ping the router. Flag the evidence, then diagnose.',
    triage: { fault: 'badGw' },
    assets: { reference: { kind: 'terminal', host: 'DESKTOP-HOMEOFFICE', session: 'cmd', excerpts: [
      { id: 'ipcfg', promptLine: 'ipconfig /all', lines: [
        { id: 'l1', select: false, ctx: true, text: 'Ethernet adapter Ethernet:' },
        { id: 'l2', select: true, evidence: false, text: '   Media State . . . . . . . . . . : Media connected' },
        { id: 'l3', select: false, ctx: true, text: '   IPv4 Address. . . . . . . . . . : 192.168.1.88(Preferred)' },
        { id: 'l4', select: true, evidence: true, text: '   Default Gateway . . . . . . . . : 192.168.1.254' },
        { id: 'l5', select: false, ctx: true, text: '   DNS Servers . . . . . . . . . . : 192.168.1.1' }
      ] },
      { id: 'pinglocal', promptLine: 'ping 192.168.1.30', lines: [
        { id: 'l6', select: false, ctx: true, text: 'Pinging 192.168.1.30 with 32 bytes of data:' },
        { id: 'l7', select: false, ctx: true, text: 'Reply from 192.168.1.30: bytes=32 time=1ms TTL=64' }
      ] },
      { id: 'pinggw', promptLine: 'ping 192.168.1.254', lines: [
        { id: 'l8', select: true, evidence: true, text: 'Request timed out.' },
        { id: 'l9', select: true, evidence: true, text: 'Request timed out.' },
        { id: 'l10', select: false, ctx: true, text: 'Ping statistics for 192.168.1.254:' },
        { id: 'l11', select: false, ctx: true, text: '    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)' }
      ] }
    ] } },
    steps: [
      { id: 'flag', type: 'analyze', points: 1,
        prompt: 'Tap the specific output lines that prove why the local printer/NAS still work but the internet doesn\'t.',
        explanation: 'The configured default gateway address, together with that same gateway address failing to answer pings at all, proves the router is unreachable — which explains why LAN traffic (to the printer at .30) still works while anything that must leave the LAN cannot. "Media connected" only confirms the physical link, which is not the problem here.',
        payload: { multi: true, mode: 'excerptLines', scoring: 'lenient' },
        answer: { selected: ['l4', 'l8', 'l9'] } },
      { id: 'dx', type: 'configure', points: 1,
        prompt: 'Name the root cause and your first troubleshooting move.',
        explanation: 'Local (same-subnet) traffic succeeds but the configured default gateway itself does not respond to ping, so the router is down, overloaded, or has lost its LAN interface — not a DNS or cabling issue on this PC. Power-cycling the router is the standard first move for an unresponsive SOHO gateway.',
        payload: { slots: [
          { id: 'diagnosis', label: 'Root cause', options: [
            { id: 'a', text: 'The default gateway (router) is unreachable or down' },
            { id: 'b', text: 'The PC\'s DNS server setting is wrong' },
            { id: 'c', text: 'The NAS has a duplicate IP address' }
          ] },
          { id: 'firstMove', label: 'First troubleshooting step', options: [
            { id: 'a', text: 'Power-cycle the router and retest connectivity' },
            { id: 'b', text: 'Change the DNS server on the PC' },
            { id: 'c', text: 'Reboot the NAS' }
          ] }
        ] },
        answer: { slots: { diagnosis: 'a', firstMove: 'a' } } }
    ]
  },

  {
    id: 'a1-cot-10', cert: 'aplus-core1', archetype: 'triage', objective: '2.5',
    topic: 'Command-output evidence triage — gateway/routing',
    title: 'Small office: every workstation lost internet at the same time', estMinutes: 6,
    scenario: 'All 6 workstations in a small office lose internet access simultaneously, though they can still reach each other and the internal file server. You remote into one machine and capture ipconfig /all plus pings to the file server and the router. Flag the evidence, then diagnose.',
    triage: { fault: 'badGw' },
    assets: { reference: { kind: 'terminal', host: 'LAPTOP-EMP01', session: 'cmd', excerpts: [
      { id: 'ipcfg', promptLine: 'ipconfig /all', lines: [
        { id: 'l1', select: false, ctx: true, text: 'Ethernet adapter Ethernet:' },
        { id: 'l2', select: false, ctx: true, text: '   IPv4 Address. . . . . . . . . . : 10.10.0.15(Preferred)' },
        { id: 'l3', select: true, evidence: true, text: '   Default Gateway . . . . . . . . : 10.10.0.1' },
        { id: 'l4', select: true, evidence: false, text: '   DHCP Enabled. . . . . . . . . . : Yes' }
      ] },
      { id: 'pingfs', promptLine: 'ping 10.10.0.5', lines: [
        { id: 'l5', select: false, ctx: true, text: 'Pinging 10.10.0.5 with 32 bytes of data:' },
        { id: 'l6', select: false, ctx: true, text: 'Reply from 10.10.0.5: bytes=32 time<1ms TTL=64' }
      ] },
      { id: 'pinggw', promptLine: 'ping 10.10.0.1', lines: [
        { id: 'l7', select: true, evidence: true, text: 'Request timed out.' },
        { id: 'l8', select: true, evidence: true, text: 'Request timed out.' },
        { id: 'l9', select: true, evidence: true, text: 'Request timed out.' }
      ] }
    ] } },
    steps: [
      { id: 'flag', type: 'analyze', points: 1,
        prompt: 'Tap the specific output lines that prove why the whole office lost internet at once while internal traffic still works.',
        explanation: 'The configured default gateway address plus three straight timeouts pinging that exact gateway prove the router is unreachable from the LAN, matching an office-wide outage while internal server traffic keeps working. DHCP being enabled is routine configuration detail, not evidence the gateway itself is down.',
        payload: { multi: true, mode: 'excerptLines', scoring: 'lenient' },
        answer: { selected: ['l3', 'l7', 'l8', 'l9'] } },
      { id: 'dx', type: 'configure', points: 1,
        prompt: 'Name the root cause and your first troubleshooting move.',
        explanation: 'Every user losing internet at the same moment while internal LAN traffic is unaffected, combined with the gateway itself not answering pings, points squarely at the router/gateway device having failed or lost its uplink. The first move is to check and, if needed, power-cycle the router.',
        payload: { slots: [
          { id: 'diagnosis', label: 'Root cause', options: [
            { id: 'a', text: 'The office router (default gateway) has failed or lost its uplink' },
            { id: 'b', text: 'The internal file server crashed' },
            { id: 'c', text: 'Every workstation\'s NIC failed simultaneously' }
          ] },
          { id: 'firstMove', label: 'First troubleshooting step', options: [
            { id: 'a', text: 'Check the router\'s status lights and power-cycle it if unresponsive' },
            { id: 'b', text: 'Restart the internal file server' },
            { id: 'c', text: 'Replace the network cable on each workstation' }
          ] }
        ] },
        answer: { slots: { diagnosis: 'a', firstMove: 'a' } } }
    ]
  },

  {
    id: 'a1-cot-11', cert: 'aplus-core1', archetype: 'triage', objective: '2.5',
    topic: 'Command-output evidence triage — gateway/routing',
    title: 'Home user: static IP set manually after a "how-to" video, now nothing works', estMinutes: 7,
    scenario: 'A home user followed an online video to set a "faster" static IP on their gaming PC and now nothing loads, though the PC still shows as connected and can reach other devices on the LAN like their console. You capture ipconfig /all and pings to the console and to the address they typed as the gateway. Flag the evidence, then diagnose.',
    triage: { fault: 'badGw' },
    assets: { reference: { kind: 'terminal', host: 'DESKTOP-GAMING', session: 'cmd', excerpts: [
      { id: 'ipcfg', promptLine: 'ipconfig /all', lines: [
        { id: 'l1', select: false, ctx: true, text: 'Ethernet adapter Ethernet:' },
        { id: 'l2', select: false, ctx: true, text: '   IPv4 Address. . . . . . . . . . : 192.168.1.150(Preferred)' },
        { id: 'l3', select: true, evidence: true, text: '   Default Gateway . . . . . . . . : 192.168.1.100' },
        { id: 'l4', select: true, evidence: false, text: '   Autoconfiguration Enabled . . . : Yes' }
      ] },
      { id: 'pingconsole', promptLine: 'ping 192.168.1.60', lines: [
        { id: 'l5', select: false, ctx: true, text: 'Pinging 192.168.1.60 with 32 bytes of data:' },
        { id: 'l6', select: false, ctx: true, text: 'Reply from 192.168.1.60: bytes=32 time=2ms TTL=64' }
      ] },
      { id: 'pinggw', promptLine: 'ping 192.168.1.100', lines: [
        { id: 'l7', select: true, evidence: true, text: 'Request timed out.' },
        { id: 'l8', select: true, evidence: true, text: 'Request timed out.' },
        { id: 'l9', select: false, ctx: true, text: 'Ping statistics for 192.168.1.100:' },
        { id: 'l10', select: false, ctx: true, text: '    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)' }
      ] }
    ] } },
    steps: [
      { id: 'flag', type: 'analyze', points: 1,
        prompt: 'Tap the specific output lines that prove why the gaming PC lost internet after the manual IP change.',
        explanation: 'The gateway address the user typed in (192.168.1.100) is not the router\'s real address, and pinging it returns nothing, proving traffic destined off the LAN has no working next hop — even though local traffic to the console still succeeds. Autoconfiguration Enabled is a leftover default flag, not evidence this specific gateway is wrong.',
        payload: { multi: true, mode: 'excerptLines', scoring: 'lenient' },
        answer: { selected: ['l3', 'l7', 'l8'] } },
      { id: 'dx', type: 'configure', points: 1,
        prompt: 'Name the root cause and your first troubleshooting move.',
        explanation: 'The user manually typed an incorrect default gateway address that doesn\'t match the actual router, so nothing that needs to leave the LAN can route out, while same-subnet traffic is unaffected. The fix is to correct the gateway to the router\'s real address, or simplest, revert to DHCP.',
        payload: { slots: [
          { id: 'diagnosis', label: 'Root cause', options: [
            { id: 'a', text: 'The manually entered default gateway address is wrong / does not match the router' },
            { id: 'b', text: 'The gaming console is causing an IP conflict' },
            { id: 'c', text: 'The router\'s DNS server is down' }
          ] },
          { id: 'firstMove', label: 'First troubleshooting step', options: [
            { id: 'a', text: 'Correct the default gateway to the router\'s actual address, or switch the adapter back to DHCP' },
            { id: 'b', text: 'Power-cycle the gaming console' },
            { id: 'c', text: 'Reinstall the network adapter driver' }
          ] }
        ] },
        answer: { slots: { diagnosis: 'a', firstMove: 'a' } } }
    ]
  },

  {
    id: 'a1-cot-12', cert: 'aplus-core1', archetype: 'triage', objective: '2.5',
    topic: 'Command-output evidence triage — gateway/routing',
    title: 'Nonprofit branch office: router went unresponsive overnight', estMinutes: 7,
    scenario: 'A small nonprofit\'s branch office reports that, as of this morning, staff can still reach the internal file share but no browsing or email works. Nothing was changed on purpose — the router has been running for months without a reboot. You remote into a workstation and capture ipconfig /all plus pings to the file server and the gateway. Flag the evidence, then diagnose.',
    triage: { fault: 'badGw' },
    assets: { reference: { kind: 'terminal', host: 'DESKTOP-BRANCH02', session: 'cmd', excerpts: [
      { id: 'ipcfg', promptLine: 'ipconfig /all', lines: [
        { id: 'l1', select: false, ctx: true, text: 'Ethernet adapter Ethernet:' },
        { id: 'l2', select: false, ctx: true, text: '   IPv4 Address. . . . . . . . . . : 172.20.5.44(Preferred)' },
        { id: 'l3', select: true, evidence: true, text: '   Default Gateway . . . . . . . . : 172.20.5.1' },
        { id: 'l4', select: true, evidence: false, text: '   Description . . . . . . . . . . : Intel(R) Ethernet Connection I219-V' }
      ] },
      { id: 'pingfs', promptLine: 'ping 172.20.5.10', lines: [
        { id: 'l5', select: false, ctx: true, text: 'Pinging 172.20.5.10 with 32 bytes of data:' },
        { id: 'l6', select: false, ctx: true, text: 'Reply from 172.20.5.10: bytes=32 time<1ms TTL=64' }
      ] },
      { id: 'pinggw', promptLine: 'ping 172.20.5.1', lines: [
        { id: 'l7', select: true, evidence: true, text: 'Request timed out.' },
        { id: 'l8', select: true, evidence: true, text: 'Request timed out.' },
        { id: 'l9', select: true, evidence: true, text: 'Request timed out.' },
        { id: 'l10', select: false, ctx: true, text: 'Ping statistics for 172.20.5.1:' },
        { id: 'l11', select: false, ctx: true, text: '    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)' }
      ] }
    ] } },
    steps: [
      { id: 'flag', type: 'analyze', points: 1,
        prompt: 'Tap the specific output lines that prove why the branch office lost outbound access overnight.',
        explanation: 'The workstation\'s default gateway address, combined with that exact address timing out on every ping attempt, proves the router is unreachable — while the file server on the same subnet still answers fine. The NIC description line is hardware identity, not evidence of a routing fault.',
        payload: { multi: true, mode: 'excerptLines', scoring: 'lenient' },
        answer: { selected: ['l3', 'l7', 'l8', 'l9'] } },
      { id: 'dx', type: 'configure', points: 1,
        prompt: 'Name the root cause and your first troubleshooting move.',
        explanation: 'Same-subnet traffic works but the configured default gateway does not respond at all, with no recent config changes and months of uptime — a strong sign the router itself has simply locked up and needs to be power-cycled, a common failure mode for consumer/SOHO-grade routers left running for long stretches.',
        payload: { slots: [
          { id: 'diagnosis', label: 'Root cause', options: [
            { id: 'a', text: 'The router (default gateway) has locked up after extended uptime and stopped responding' },
            { id: 'b', text: 'The file server\'s network card failed' },
            { id: 'c', text: 'The workstation has a stale ARP cache entry' }
          ] },
          { id: 'firstMove', label: 'First troubleshooting step', options: [
            { id: 'a', text: 'Power-cycle the router and verify its LAN cabling once it comes back up' },
            { id: 'b', text: 'Replace the file server\'s network card' },
            { id: 'c', text: 'Clear the ARP cache on the workstation' }
          ] }
        ] },
        answer: { slots: { diagnosis: 'a', firstMove: 'a' } } }
    ]
  },
  {
    id: 'a1-pcb-01',
    cert: 'aplus-core1',
    archetype: 'pcbuild',
    objective: '3.4',
    topic: 'Two-client PC build spec-off — competitive FPS rig vs. online-course laptop-replacement',
    title: 'Two tickets on the bench: Priya\'s FPS rig and Dara\'s course PC',
    estMinutes: 8,
    scenario: 'Two build tickets landed the same day. Priya wants a compact ATX rig for competitive FPS titles at high frame rates. Dara just needs a reliable desktop for online coursework — browser, video calls, word processing, nothing graphics-intensive. Same parts catalog, two very different builds. Spec each to its own ticket.',
    pcbuild: {
      clientA: {
        budgetUsd: 1300,
        caseMaxGpuLengthMm: 320,
        minCpuTier: 2,
        minGpuTier: 3
      },
      clientB: {
        budgetUsd: 350,
        caseMaxGpuLengthMm: 180,
        minCpuTier: 1,
        minGpuTier: 0
      }
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'a-cpu',
            label: 'Client A · CPU socket'
          },
          {
            id: 'a-gpu',
            label: 'Client A · GPU bay · max 320mm'
          },
          {
            id: 'a-ram',
            label: 'Client A · RAM slots'
          },
          {
            id: 'a-psu',
            label: 'Client A · PSU bay · ATX'
          },
          {
            id: 'a-storage',
            label: 'Client A · Storage bay · 2.5in/3.5in'
          },
          {
            id: 'a-cooling',
            label: 'Client A · Cooling mount · 120/240mm'
          },
          {
            id: 'b-cpu',
            label: 'Client B · CPU socket'
          },
          {
            id: 'b-gpu',
            label: 'Client B · GPU bay · max 180mm'
          },
          {
            id: 'b-ram',
            label: 'Client B · RAM slots'
          },
          {
            id: 'b-psu',
            label: 'Client B · PSU bay · SFX/ATX'
          },
          {
            id: 'b-storage',
            label: 'Client B · Storage bay · 2.5in only'
          },
          {
            id: 'b-cooling',
            label: 'Client B · Cooling mount · stock/92mm'
          }
        ],
        notes: ['Client A · $1300 budget · ATX mid-tower · Competitive FPS gaming', 'Client B · $350 budget · Micro-ATX · Coursework · browser · video calls']
      }
    },
    steps: [
      {
        id: 'clientA',
        type: 'configure',
        points: 1,
        prompt: 'Spec Priya\'s FPS rig: strong single-core CPU, a GPU that clears the frame-rate bar and fits the case, and enough PSU headroom for both.',
        explanation: 'A mid-tier iGPU CPU already clears the tier-2 floor at a fair price, and the high-end GPU is required to clear this ticket\'s tier-3 GPU floor and still fits the 320mm case limit. 450W covers the combined draw with room to spare.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-igpu-mid',
                  text: 'Mid-range CPU w/ iGPU'
                },
                {
                  id: 'cpu-budget',
                  text: 'Budget quad-core CPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-4070',
                  text: 'High-end discrete GPU'
                },
                {
                  id: 'gpu-4060',
                  text: 'Mid-range discrete GPU'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-32',
                  text: '32GB RAM kit'
                },
                {
                  id: 'ram-16',
                  text: '16GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-450',
                  text: '450W PSU'
                },
                {
                  id: 'psu-250',
                  text: '250W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                },
                {
                  id: 'storage-256-sata',
                  text: '256GB SATA SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-240-aio',
                  text: '240mm AIO liquid cooler'
                },
                {
                  id: 'cool-stock',
                  text: 'Stock cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-igpu-mid',
            gpu: 'gpu-4070',
            ram: 'ram-32',
            psu: 'psu-450',
            storage: 'storage-1tb-nvme',
            cooling: 'cool-240-aio'
          }
        }
      },
      {
        id: 'clientB',
        type: 'configure',
        points: 1,
        prompt: 'Spec Dara\'s coursework PC: it never needs a discrete GPU, so keep the build lean and inside budget.',
        explanation: 'An office-tier CPU handles browser tabs and video calls fine with its integrated graphics — no discrete GPU needed. Adding one is the single biggest way to blow this tight budget for zero benefit here.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-office',
                  text: 'Office six-core CPU'
                },
                {
                  id: 'cpu-igpu-mid',
                  text: 'Mid-range CPU w/ iGPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-none',
                  text: 'No discrete GPU (iGPU only)'
                },
                {
                  id: 'gpu-1650',
                  text: 'Entry discrete GPU'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-16',
                  text: '16GB RAM kit'
                },
                {
                  id: 'ram-8',
                  text: '8GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-250',
                  text: '250W PSU'
                },
                {
                  id: 'psu-450',
                  text: '450W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-256-sata',
                  text: '256GB SATA SSD'
                },
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-stock',
                  text: 'Stock cooler'
                },
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-office',
            gpu: 'gpu-none',
            ram: 'ram-16',
            psu: 'psu-250',
            storage: 'storage-256-sata',
            cooling: 'cool-stock'
          }
        }
      }
    ]
  },

  {
    id: 'a1-pcb-02',
    cert: 'aplus-core1',
    archetype: 'pcbuild',
    objective: '3.4',
    topic: 'Two-client PC build spec-off — live streamer vs. small-business accountant',
    title: 'Jonah\'s streaming rig and Noreen\'s accounting desktop',
    estMinutes: 8,
    scenario: 'Jonah streams while he games and needs enough CPU headroom to encode video without tanking frame rates. Noreen runs a small accounting practice and just needs a dependable desktop for spreadsheets and client files. Spec both from the shop\'s shared parts catalog.',
    pcbuild: {
      clientA: {
        budgetUsd: 1600,
        caseMaxGpuLengthMm: 320,
        minCpuTier: 3,
        minGpuTier: 2
      },
      clientB: {
        budgetUsd: 450,
        caseMaxGpuLengthMm: 200,
        minCpuTier: 1,
        minGpuTier: 0
      }
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'a-cpu',
            label: 'Client A · CPU socket'
          },
          {
            id: 'a-gpu',
            label: 'Client A · GPU bay · max 320mm'
          },
          {
            id: 'a-ram',
            label: 'Client A · RAM slots'
          },
          {
            id: 'a-psu',
            label: 'Client A · PSU bay · ATX'
          },
          {
            id: 'a-storage',
            label: 'Client A · Storage bay · 2.5in/3.5in'
          },
          {
            id: 'a-cooling',
            label: 'Client A · Cooling mount · 120/240mm'
          },
          {
            id: 'b-cpu',
            label: 'Client B · CPU socket'
          },
          {
            id: 'b-gpu',
            label: 'Client B · GPU bay · max 200mm'
          },
          {
            id: 'b-ram',
            label: 'Client B · RAM slots'
          },
          {
            id: 'b-psu',
            label: 'Client B · PSU bay · ATX'
          },
          {
            id: 'b-storage',
            label: 'Client B · Storage bay · 2.5in/3.5in'
          },
          {
            id: 'b-cooling',
            label: 'Client B · Cooling mount · stock/92mm'
          }
        ],
        notes: ['Client A · $1600 budget · ATX full-tower · Live streaming + gaming', 'Client B · $450 budget · Micro-tower · Spreadsheets + client files']
      }
    },
    steps: [
      {
        id: 'clientA',
        type: 'configure',
        points: 1,
        prompt: 'Spec Jonah\'s streaming rig: the CPU needs headroom for simultaneous encode-and-game, and the GPU needs to clear the tier floor for the game itself — no need to pay for more GPU than that.',
        explanation: 'Encoding while gaming needs a creator-tier CPU to clear the tier-3 floor; the mid-range GPU clears the tier-2 floor these games need without paying for the top-tier card\'s extra horsepower this ticket doesn\'t require. 650W gives comfortable headroom for the capture card and extra USB peripherals a streaming desk adds later.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-creator',
                  text: 'Creator-tier CPU'
                },
                {
                  id: 'cpu-igpu-mid',
                  text: 'Mid-range CPU w/ iGPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-4060',
                  text: 'Mid-range discrete GPU'
                },
                {
                  id: 'gpu-4070',
                  text: 'High-end discrete GPU'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-32',
                  text: '32GB RAM kit'
                },
                {
                  id: 'ram-16',
                  text: '16GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-650',
                  text: '650W PSU'
                },
                {
                  id: 'psu-450',
                  text: '450W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-2tb-nvme',
                  text: '2TB NVMe SSD'
                },
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-240-aio',
                  text: '240mm AIO liquid cooler'
                },
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-creator',
            gpu: 'gpu-4060',
            ram: 'ram-32',
            psu: 'psu-650',
            storage: 'storage-2tb-nvme',
            cooling: 'cool-240-aio'
          }
        }
      },
      {
        id: 'clientB',
        type: 'configure',
        points: 1,
        prompt: 'Spec Noreen\'s accounting desktop: reliable, no discrete GPU, storage sized for years of client records.',
        explanation: 'Office-tier CPU with its integrated graphics is plenty for spreadsheets and bookkeeping software. A discrete GPU adds cost with zero payoff for this ticket and would blow the budget once added.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-office',
                  text: 'Office six-core CPU'
                },
                {
                  id: 'cpu-budget',
                  text: 'Budget quad-core CPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-none',
                  text: 'No discrete GPU (iGPU only)'
                },
                {
                  id: 'gpu-1650',
                  text: 'Entry discrete GPU'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-16',
                  text: '16GB RAM kit'
                },
                {
                  id: 'ram-8',
                  text: '8GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-250',
                  text: '250W PSU'
                },
                {
                  id: 'psu-450',
                  text: '450W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                },
                {
                  id: 'storage-256-sata',
                  text: '256GB SATA SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-stock',
                  text: 'Stock cooler'
                },
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-office',
            gpu: 'gpu-none',
            ram: 'ram-16',
            psu: 'psu-250',
            storage: 'storage-1tb-nvme',
            cooling: 'cool-stock'
          }
        }
      }
    ]
  },

  {
    id: 'a1-pcb-03',
    cert: 'aplus-core1',
    archetype: 'pcbuild',
    objective: '3.4',
    topic: 'Two-client PC build spec-off — freelance video editor vs. casual home browser',
    title: 'Renata\'s editing tower and Ollie\'s browsing box',
    estMinutes: 8,
    scenario: 'Renata edits 4K footage for clients and needs real CPU and GPU horsepower. Ollie just wants a small, cheap machine for browsing and email in the den. Same catalog, wildly different tickets — and Renata\'s case has a hard GPU-length limit that trips up the obvious "best" GPU pick.',
    pcbuild: {
      clientA: {
        budgetUsd: 1300,
        caseMaxGpuLengthMm: 300,
        minCpuTier: 3,
        minGpuTier: 2
      },
      clientB: {
        budgetUsd: 380,
        caseMaxGpuLengthMm: 160,
        minCpuTier: 1,
        minGpuTier: 0
      }
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'a-cpu',
            label: 'Client A · CPU socket'
          },
          {
            id: 'a-gpu',
            label: 'Client A · GPU bay · max 300mm'
          },
          {
            id: 'a-ram',
            label: 'Client A · RAM slots'
          },
          {
            id: 'a-psu',
            label: 'Client A · PSU bay · ATX'
          },
          {
            id: 'a-storage',
            label: 'Client A · Storage bay · 2.5in/3.5in'
          },
          {
            id: 'a-cooling',
            label: 'Client A · Cooling mount · 120/240mm'
          },
          {
            id: 'b-cpu',
            label: 'Client B · CPU socket'
          },
          {
            id: 'b-gpu',
            label: 'Client B · GPU bay · max 160mm'
          },
          {
            id: 'b-ram',
            label: 'Client B · RAM slots'
          },
          {
            id: 'b-psu',
            label: 'Client B · PSU bay · SFX'
          },
          {
            id: 'b-storage',
            label: 'Client B · Storage bay · 2.5in only'
          },
          {
            id: 'b-cooling',
            label: 'Client B · Cooling mount · stock only'
          }
        ],
        notes: ['Client A · $1300 budget · ATX mid-tower · Video editing · multi-stream', 'Client B · $380 budget · Mini-ITX shoebox · Browsing + email']
      }
    },
    steps: [
      {
        id: 'clientA',
        type: 'configure',
        points: 1,
        prompt: 'Spec Renata\'s editing tower: creator-tier CPU, and a GPU that both clears the tier floor AND fits the case\'s 300mm limit.',
        explanation: 'The creator-tier CPU clears the tier-3 floor for timeline scrubbing and exports. The mid-range GPU clears the tier-2 floor and fits at 244mm — the higher-tier GPU is 310mm and physically will not fit this case, even though it looks like the "better" pick on paper.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-creator',
                  text: 'Creator-tier CPU'
                },
                {
                  id: 'cpu-igpu-mid',
                  text: 'Mid-range CPU w/ iGPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-4060',
                  text: 'Mid-range discrete GPU'
                },
                {
                  id: 'gpu-4070',
                  text: 'High-end discrete GPU'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-64',
                  text: '64GB RAM kit'
                },
                {
                  id: 'ram-16',
                  text: '16GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-650',
                  text: '650W PSU'
                },
                {
                  id: 'psu-450',
                  text: '450W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-2tb-nvme',
                  text: '2TB NVMe SSD'
                },
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-240-aio',
                  text: '240mm AIO liquid cooler'
                },
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-creator',
            gpu: 'gpu-4060',
            ram: 'ram-64',
            psu: 'psu-650',
            storage: 'storage-2tb-nvme',
            cooling: 'cool-240-aio'
          }
        }
      },
      {
        id: 'clientB',
        type: 'configure',
        points: 1,
        prompt: 'Spec Ollie\'s browsing box: keep it small and cheap, and mind the case\'s tight 160mm GPU clearance if a discrete card is ever considered.',
        explanation: 'A budget CPU with integrated graphics is all a browsing-only machine needs — no discrete GPU required. The entry discrete GPU is also 170mm, which is longer than this shoebox case\'s 160mm clearance, so it would not physically fit even if someone wanted it.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-budget',
                  text: 'Budget quad-core CPU'
                },
                {
                  id: 'cpu-igpu-mid',
                  text: 'Mid-range CPU w/ iGPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-none',
                  text: 'No discrete GPU (iGPU only)'
                },
                {
                  id: 'gpu-1650',
                  text: 'Entry discrete GPU'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-8',
                  text: '8GB RAM kit'
                },
                {
                  id: 'ram-32',
                  text: '32GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-250',
                  text: '250W PSU'
                },
                {
                  id: 'psu-450',
                  text: '450W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-256-sata',
                  text: '256GB SATA SSD'
                },
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-stock',
                  text: 'Stock cooler'
                },
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-budget',
            gpu: 'gpu-none',
            ram: 'ram-8',
            psu: 'psu-250',
            storage: 'storage-256-sata',
            cooling: 'cool-stock'
          }
        }
      }
    ]
  },

  {
    id: 'a1-pcb-04',
    cert: 'aplus-core1',
    archetype: 'pcbuild',
    objective: '3.4',
    topic: 'Two-client PC build spec-off — boutique shop owner vs. teen\'s first gaming PC',
    title: 'Halima\'s shop POS box and Devon\'s first gaming build',
    estMinutes: 8,
    scenario: 'Halima runs a small boutique and needs a reliable machine for point-of-sale and inventory software. Devon is 15 and saved up for a first gaming PC on a tight budget for entry-level esports titles. Spec both tickets from the same catalog.',
    pcbuild: {
      clientA: {
        budgetUsd: 420,
        caseMaxGpuLengthMm: 220,
        minCpuTier: 1,
        minGpuTier: 0
      },
      clientB: {
        budgetUsd: 650,
        caseMaxGpuLengthMm: 260,
        minCpuTier: 2,
        minGpuTier: 1
      }
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'a-cpu',
            label: 'Client A · CPU socket'
          },
          {
            id: 'a-gpu',
            label: 'Client A · GPU bay · max 220mm'
          },
          {
            id: 'a-ram',
            label: 'Client A · RAM slots'
          },
          {
            id: 'a-psu',
            label: 'Client A · PSU bay · ATX'
          },
          {
            id: 'a-storage',
            label: 'Client A · Storage bay · 2.5in/3.5in'
          },
          {
            id: 'a-cooling',
            label: 'Client A · Cooling mount · stock/92mm'
          },
          {
            id: 'b-cpu',
            label: 'Client B · CPU socket'
          },
          {
            id: 'b-gpu',
            label: 'Client B · GPU bay · max 260mm'
          },
          {
            id: 'b-ram',
            label: 'Client B · RAM slots'
          },
          {
            id: 'b-psu',
            label: 'Client B · PSU bay · ATX'
          },
          {
            id: 'b-storage',
            label: 'Client B · Storage bay · 2.5in/3.5in'
          },
          {
            id: 'b-cooling',
            label: 'Client B · Cooling mount · 120/240mm'
          }
        ],
        notes: ['Client A · $420 budget · ATX micro-tower · POS + inventory software', 'Client B · $650 budget · ATX mid-tower · Entry-level esports gaming']
      }
    },
    steps: [
      {
        id: 'clientA',
        type: 'configure',
        points: 1,
        prompt: 'Spec Halima\'s POS box: no discrete GPU needed, and mind the tight budget.',
        explanation: 'Office-tier CPU with integrated graphics runs POS and inventory software fine. A discrete GPU adds nothing here for touchscreen POS graphics and pushes this tight budget over the line once added.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-office',
                  text: 'Office six-core CPU'
                },
                {
                  id: 'cpu-budget',
                  text: 'Budget quad-core CPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-none',
                  text: 'No discrete GPU (iGPU only)'
                },
                {
                  id: 'gpu-1650',
                  text: 'Entry discrete GPU'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-16',
                  text: '16GB RAM kit'
                },
                {
                  id: 'ram-8',
                  text: '8GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-250',
                  text: '250W PSU'
                },
                {
                  id: 'psu-450',
                  text: '450W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                },
                {
                  id: 'storage-256-sata',
                  text: '256GB SATA SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-stock',
                  text: 'Stock cooler'
                },
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-office',
            gpu: 'gpu-none',
            ram: 'ram-16',
            psu: 'psu-250',
            storage: 'storage-1tb-nvme',
            cooling: 'cool-stock'
          }
        }
      },
      {
        id: 'clientB',
        type: 'configure',
        points: 1,
        prompt: 'Spec Devon\'s first gaming PC: entry-level esports titles need a real discrete GPU, not just integrated graphics.',
        explanation: 'A mid-tier CPU with iGPU clears the tier-2 CPU floor, and the entry discrete GPU clears the tier-1 GPU floor these esports titles need — integrated graphics alone would not meet that floor.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-igpu-mid',
                  text: 'Mid-range CPU w/ iGPU'
                },
                {
                  id: 'cpu-budget',
                  text: 'Budget quad-core CPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-1650',
                  text: 'Entry discrete GPU'
                },
                {
                  id: 'gpu-none',
                  text: 'No discrete GPU (iGPU only)'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-16',
                  text: '16GB RAM kit'
                },
                {
                  id: 'ram-8',
                  text: '8GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-450',
                  text: '450W PSU'
                },
                {
                  id: 'psu-250',
                  text: '250W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                },
                {
                  id: 'storage-256-sata',
                  text: '256GB SATA SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                },
                {
                  id: 'cool-stock',
                  text: 'Stock cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-igpu-mid',
            gpu: 'gpu-1650',
            ram: 'ram-16',
            psu: 'psu-450',
            storage: 'storage-1tb-nvme',
            cooling: 'cool-120-air'
          }
        }
      }
    ]
  },

  {
    id: 'a1-pcb-05',
    cert: 'aplus-core1',
    archetype: 'pcbuild',
    objective: '3.4',
    topic: 'Two-client PC build spec-off — freelance 3D animator vs. grandparent\'s email PC',
    title: 'Tobias\'s render workstation and Grandma Iris\'s email machine',
    estMinutes: 8,
    scenario: 'Tobias renders 3D animation for clients and needs top-tier CPU and GPU horsepower. Grandma Iris just wants a small, simple machine for email and family photos. Iris\'s case is especially tight on GPU clearance.',
    pcbuild: {
      clientA: {
        budgetUsd: 1750,
        caseMaxGpuLengthMm: 320,
        minCpuTier: 4,
        minGpuTier: 3
      },
      clientB: {
        budgetUsd: 320,
        caseMaxGpuLengthMm: 150,
        minCpuTier: 1,
        minGpuTier: 0
      }
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'a-cpu',
            label: 'Client A · CPU socket'
          },
          {
            id: 'a-gpu',
            label: 'Client A · GPU bay · max 320mm'
          },
          {
            id: 'a-ram',
            label: 'Client A · RAM slots'
          },
          {
            id: 'a-psu',
            label: 'Client A · PSU bay · ATX'
          },
          {
            id: 'a-storage',
            label: 'Client A · Storage bay · 2.5in/3.5in'
          },
          {
            id: 'a-cooling',
            label: 'Client A · Cooling mount · 120/240mm'
          },
          {
            id: 'b-cpu',
            label: 'Client B · CPU socket'
          },
          {
            id: 'b-gpu',
            label: 'Client B · GPU bay · max 150mm'
          },
          {
            id: 'b-ram',
            label: 'Client B · RAM slots'
          },
          {
            id: 'b-psu',
            label: 'Client B · PSU bay · SFX'
          },
          {
            id: 'b-storage',
            label: 'Client B · Storage bay · 2.5in only'
          },
          {
            id: 'b-cooling',
            label: 'Client B · Cooling mount · stock only'
          }
        ],
        notes: ['Client A · $1750 budget · ATX full-tower · 3D animation rendering', 'Client B · $320 budget · Mini-ITX shoebox · Email + family photos']
      }
    },
    steps: [
      {
        id: 'clientA',
        type: 'configure',
        points: 1,
        prompt: 'Spec Tobias\'s render workstation: this ticket needs the flagship CPU and the top GPU to clear both tier floors.',
        explanation: 'Rendering needs the flagship CPU to clear the tier-4 floor and the top-tier GPU to clear the tier-3 floor; the creator-tier CPU and the mid-range GPU each fall one tier short of this specific ticket\'s requirements.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-flagship',
                  text: 'Flagship high-core CPU'
                },
                {
                  id: 'cpu-creator',
                  text: 'Creator-tier CPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-4070',
                  text: 'High-end discrete GPU'
                },
                {
                  id: 'gpu-4060',
                  text: 'Mid-range discrete GPU'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-64',
                  text: '64GB RAM kit'
                },
                {
                  id: 'ram-32',
                  text: '32GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-850',
                  text: '850W PSU'
                },
                {
                  id: 'psu-650',
                  text: '650W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-2tb-nvme',
                  text: '2TB NVMe SSD'
                },
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-240-aio',
                  text: '240mm AIO liquid cooler'
                },
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-flagship',
            gpu: 'gpu-4070',
            ram: 'ram-64',
            psu: 'psu-850',
            storage: 'storage-2tb-nvme',
            cooling: 'cool-240-aio'
          }
        }
      },
      {
        id: 'clientB',
        type: 'configure',
        points: 1,
        prompt: 'Spec Grandma Iris\'s email machine: keep it small, cheap, and mind the shoebox case\'s 150mm GPU clearance.',
        explanation: 'A budget CPU with integrated graphics is all this ticket needs. The entry discrete GPU is 170mm — longer than this case\'s 150mm clearance — so it would not fit even for a "just in case" upgrade.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-budget',
                  text: 'Budget quad-core CPU'
                },
                {
                  id: 'cpu-office',
                  text: 'Office six-core CPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-none',
                  text: 'No discrete GPU (iGPU only)'
                },
                {
                  id: 'gpu-1650',
                  text: 'Entry discrete GPU'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-8',
                  text: '8GB RAM kit'
                },
                {
                  id: 'ram-16',
                  text: '16GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-250',
                  text: '250W PSU'
                },
                {
                  id: 'psu-450',
                  text: '450W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-256-sata',
                  text: '256GB SATA SSD'
                },
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-stock',
                  text: 'Stock cooler'
                },
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-budget',
            gpu: 'gpu-none',
            ram: 'ram-8',
            psu: 'psu-250',
            storage: 'storage-256-sata',
            cooling: 'cool-stock'
          }
        }
      }
    ]
  },

  {
    id: 'a1-pcb-06',
    cert: 'aplus-core1',
    archetype: 'pcbuild',
    objective: '3.4',
    topic: 'Two-client PC build spec-off — ML hobbyist vs. home musician',
    title: 'Priyanka\'s model-training rig and Sam\'s recording desktop',
    estMinutes: 8,
    scenario: 'Priyanka trains small ML models locally and needs a strong CPU and GPU. Sam records vocals and guitar at home and just needs plenty of RAM for plugin-heavy sessions — no GPU required, but the build should stay reasonably quiet.',
    pcbuild: {
      clientA: {
        budgetUsd: 1550,
        caseMaxGpuLengthMm: 320,
        minCpuTier: 3,
        minGpuTier: 3
      },
      clientB: {
        budgetUsd: 620,
        caseMaxGpuLengthMm: 220,
        minCpuTier: 2,
        minGpuTier: 0
      }
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'a-cpu',
            label: 'Client A · CPU socket'
          },
          {
            id: 'a-gpu',
            label: 'Client A · GPU bay · max 320mm'
          },
          {
            id: 'a-ram',
            label: 'Client A · RAM slots'
          },
          {
            id: 'a-psu',
            label: 'Client A · PSU bay · ATX'
          },
          {
            id: 'a-storage',
            label: 'Client A · Storage bay · 2.5in/3.5in'
          },
          {
            id: 'a-cooling',
            label: 'Client A · Cooling mount · 120/240mm'
          },
          {
            id: 'b-cpu',
            label: 'Client B · CPU socket'
          },
          {
            id: 'b-gpu',
            label: 'Client B · GPU bay · max 220mm'
          },
          {
            id: 'b-ram',
            label: 'Client B · RAM slots'
          },
          {
            id: 'b-psu',
            label: 'Client B · PSU bay · ATX'
          },
          {
            id: 'b-storage',
            label: 'Client B · Storage bay · 2.5in/3.5in'
          },
          {
            id: 'b-cooling',
            label: 'Client B · Cooling mount · 120/240mm'
          }
        ],
        notes: ['Client A · $1550 budget · ATX full-tower · Local ML model training', 'Client B · $620 budget · ATX micro-tower · Home vocal/guitar recording']
      }
    },
    steps: [
      {
        id: 'clientA',
        type: 'configure',
        points: 1,
        prompt: 'Spec Priyanka\'s training rig: both the CPU and GPU tiers need to clear tier 3 for local model training.',
        explanation: 'The creator-tier CPU clears the tier-3 CPU floor and the top-tier GPU clears the tier-3 GPU floor this ticket requires; the mid-tier CPU and mid-range GPU each fall one tier short for training workloads.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-creator',
                  text: 'Creator-tier CPU'
                },
                {
                  id: 'cpu-igpu-mid',
                  text: 'Mid-range CPU w/ iGPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-4070',
                  text: 'High-end discrete GPU'
                },
                {
                  id: 'gpu-4060',
                  text: 'Mid-range discrete GPU'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-64',
                  text: '64GB RAM kit'
                },
                {
                  id: 'ram-32',
                  text: '32GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-850',
                  text: '850W PSU'
                },
                {
                  id: 'psu-650',
                  text: '650W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-2tb-nvme',
                  text: '2TB NVMe SSD'
                },
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-240-aio',
                  text: '240mm AIO liquid cooler'
                },
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-creator',
            gpu: 'gpu-4070',
            ram: 'ram-64',
            psu: 'psu-850',
            storage: 'storage-2tb-nvme',
            cooling: 'cool-240-aio'
          }
        }
      },
      {
        id: 'clientB',
        type: 'configure',
        points: 1,
        prompt: 'Spec Sam\'s recording desktop: enough CPU for plugin-heavy sessions, plenty of RAM, and no discrete GPU needed.',
        explanation: 'A mid-tier CPU with iGPU clears the tier-2 floor plugin processing needs; no discrete GPU is required for pure audio work, and skipping it keeps the build quieter for vocal takes.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-igpu-mid',
                  text: 'Mid-range CPU w/ iGPU'
                },
                {
                  id: 'cpu-budget',
                  text: 'Budget quad-core CPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-none',
                  text: 'No discrete GPU (iGPU only)'
                },
                {
                  id: 'gpu-1650',
                  text: 'Entry discrete GPU'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-32',
                  text: '32GB RAM kit'
                },
                {
                  id: 'ram-16',
                  text: '16GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-450',
                  text: '450W PSU'
                },
                {
                  id: 'psu-650',
                  text: '650W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                },
                {
                  id: 'storage-256-sata',
                  text: '256GB SATA SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                },
                {
                  id: 'cool-stock',
                  text: 'Stock cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-igpu-mid',
            gpu: 'gpu-none',
            ram: 'ram-32',
            psu: 'psu-450',
            storage: 'storage-1tb-nvme',
            cooling: 'cool-120-air'
          }
        }
      }
    ]
  },

  {
    id: 'a1-pcb-07',
    cert: 'aplus-core1',
    archetype: 'pcbuild',
    objective: '3.4',
    topic: 'Two-client PC build spec-off — portrait photographer vs. retail kiosk terminal',
    title: 'Yusuf\'s photo-editing tower and the shop\'s kiosk terminal',
    estMinutes: 8,
    scenario: 'Yusuf edits and batch-processes RAW photos for clients and needs GPU-accelerated editing horsepower. A retail shop separately needs a bare-bones kiosk PC to run its point-of-sale app — nothing more. Yusuf\'s case also has a tighter GPU clearance than the top-tier card allows.',
    pcbuild: {
      clientA: {
        budgetUsd: 1050,
        caseMaxGpuLengthMm: 260,
        minCpuTier: 3,
        minGpuTier: 2
      },
      clientB: {
        budgetUsd: 300,
        caseMaxGpuLengthMm: 140,
        minCpuTier: 1,
        minGpuTier: 0
      }
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'a-cpu',
            label: 'Client A · CPU socket'
          },
          {
            id: 'a-gpu',
            label: 'Client A · GPU bay · max 260mm'
          },
          {
            id: 'a-ram',
            label: 'Client A · RAM slots'
          },
          {
            id: 'a-psu',
            label: 'Client A · PSU bay · ATX'
          },
          {
            id: 'a-storage',
            label: 'Client A · Storage bay · 2.5in/3.5in'
          },
          {
            id: 'a-cooling',
            label: 'Client A · Cooling mount · 120/240mm'
          },
          {
            id: 'b-cpu',
            label: 'Client B · CPU socket'
          },
          {
            id: 'b-gpu',
            label: 'Client B · GPU bay · max 140mm'
          },
          {
            id: 'b-ram',
            label: 'Client B · RAM slots'
          },
          {
            id: 'b-psu',
            label: 'Client B · PSU bay · SFX'
          },
          {
            id: 'b-storage',
            label: 'Client B · Storage bay · 2.5in only'
          },
          {
            id: 'b-cooling',
            label: 'Client B · Cooling mount · stock only'
          }
        ],
        notes: ['Client A · $1050 budget · ATX mid-tower · RAW photo batch editing', 'Client B · $300 budget · Mini-ITX kiosk enclosure · POS terminal, no other apps']
      }
    },
    steps: [
      {
        id: 'clientA',
        type: 'configure',
        points: 1,
        prompt: 'Spec Yusuf\'s photo-editing tower: creator-tier CPU, and a GPU that clears the tier floor while fitting the case\'s 260mm limit.',
        explanation: 'The creator-tier CPU clears the tier-3 floor for batch RAW processing, and the mid-range GPU clears the tier-2 floor at 244mm. The top-tier GPU is 310mm — it would clear the tier requirement too, but it physically will not fit this case\'s 260mm clearance.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-creator',
                  text: 'Creator-tier CPU'
                },
                {
                  id: 'cpu-igpu-mid',
                  text: 'Mid-range CPU w/ iGPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-4060',
                  text: 'Mid-range discrete GPU'
                },
                {
                  id: 'gpu-4070',
                  text: 'High-end discrete GPU'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-32',
                  text: '32GB RAM kit'
                },
                {
                  id: 'ram-16',
                  text: '16GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-450',
                  text: '450W PSU'
                },
                {
                  id: 'psu-250',
                  text: '250W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-2tb-nvme',
                  text: '2TB NVMe SSD'
                },
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                },
                {
                  id: 'cool-stock',
                  text: 'Stock cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-creator',
            gpu: 'gpu-4060',
            ram: 'ram-32',
            psu: 'psu-450',
            storage: 'storage-2tb-nvme',
            cooling: 'cool-120-air'
          }
        }
      },
      {
        id: 'clientB',
        type: 'configure',
        points: 1,
        prompt: 'Spec the kiosk terminal: it only ever runs one POS app, so keep it minimal and mind the enclosure\'s 140mm GPU clearance.',
        explanation: 'A budget CPU with integrated graphics is all a single-app kiosk terminal needs. The entry discrete GPU is 170mm, longer than this enclosure\'s 140mm clearance, so it is not an option here regardless of need.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-budget',
                  text: 'Budget quad-core CPU'
                },
                {
                  id: 'cpu-office',
                  text: 'Office six-core CPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-none',
                  text: 'No discrete GPU (iGPU only)'
                },
                {
                  id: 'gpu-1650',
                  text: 'Entry discrete GPU'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-8',
                  text: '8GB RAM kit'
                },
                {
                  id: 'ram-16',
                  text: '16GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-250',
                  text: '250W PSU'
                },
                {
                  id: 'psu-450',
                  text: '450W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-256-sata',
                  text: '256GB SATA SSD'
                },
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-stock',
                  text: 'Stock cooler'
                },
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-budget',
            gpu: 'gpu-none',
            ram: 'ram-8',
            psu: 'psu-250',
            storage: 'storage-256-sata',
            cooling: 'cool-stock'
          }
        }
      }
    ]
  },

  {
    id: 'a1-pcb-08',
    cert: 'aplus-core1',
    archetype: 'pcbuild',
    objective: '3.4',
    topic: 'Two-client PC build spec-off — home-lab NAS admin vs. budget esports gamer',
    title: 'Marcus\'s home-lab server and Leilani\'s budget esports build',
    estMinutes: 8,
    scenario: 'Marcus runs a home-lab NAS and Plex server that needs hardware transcode headroom but no discrete GPU. Leilani wants a budget esports gaming PC and needs an actual discrete GPU to clear the frame-rate floor for her titles.',
    pcbuild: {
      clientA: {
        budgetUsd: 650,
        caseMaxGpuLengthMm: 220,
        minCpuTier: 2,
        minGpuTier: 0
      },
      clientB: {
        budgetUsd: 620,
        caseMaxGpuLengthMm: 250,
        minCpuTier: 2,
        minGpuTier: 1
      }
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'a-cpu',
            label: 'Client A · CPU socket'
          },
          {
            id: 'a-gpu',
            label: 'Client A · GPU bay · max 220mm'
          },
          {
            id: 'a-ram',
            label: 'Client A · RAM slots'
          },
          {
            id: 'a-psu',
            label: 'Client A · PSU bay · ATX'
          },
          {
            id: 'a-storage',
            label: 'Client A · Storage bay · 2.5in/3.5in'
          },
          {
            id: 'a-cooling',
            label: 'Client A · Cooling mount · 120/240mm'
          },
          {
            id: 'b-cpu',
            label: 'Client B · CPU socket'
          },
          {
            id: 'b-gpu',
            label: 'Client B · GPU bay · max 250mm'
          },
          {
            id: 'b-ram',
            label: 'Client B · RAM slots'
          },
          {
            id: 'b-psu',
            label: 'Client B · PSU bay · ATX'
          },
          {
            id: 'b-storage',
            label: 'Client B · Storage bay · 2.5in/3.5in'
          },
          {
            id: 'b-cooling',
            label: 'Client B · Cooling mount · stock/92mm'
          }
        ],
        notes: ['Client A · $650 budget · ATX micro-tower · NAS + Plex transcode server', 'Client B · $620 budget · ATX mid-tower · Budget esports gaming']
      }
    },
    steps: [
      {
        id: 'clientA',
        type: 'configure',
        points: 1,
        prompt: 'Spec Marcus\'s NAS/Plex server: no discrete GPU needed, but the CPU tier matters for transcode headroom.',
        explanation: 'A mid-tier CPU with iGPU clears the tier-2 floor and its integrated graphics handle hardware transcode fine. A discrete GPU adds cost with no payoff for a headless server and would push this build over budget once added.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-igpu-mid',
                  text: 'Mid-range CPU w/ iGPU'
                },
                {
                  id: 'cpu-budget',
                  text: 'Budget quad-core CPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-none',
                  text: 'No discrete GPU (iGPU only)'
                },
                {
                  id: 'gpu-1650',
                  text: 'Entry discrete GPU'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-32',
                  text: '32GB RAM kit'
                },
                {
                  id: 'ram-16',
                  text: '16GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-450',
                  text: '450W PSU'
                },
                {
                  id: 'psu-650',
                  text: '650W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-2tb-nvme',
                  text: '2TB NVMe SSD'
                },
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                },
                {
                  id: 'cool-stock',
                  text: 'Stock cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-igpu-mid',
            gpu: 'gpu-none',
            ram: 'ram-32',
            psu: 'psu-450',
            storage: 'storage-2tb-nvme',
            cooling: 'cool-120-air'
          }
        }
      },
      {
        id: 'clientB',
        type: 'configure',
        points: 1,
        prompt: 'Spec Leilani\'s esports build: a real discrete GPU is required to clear the tier-1 floor for her titles, not just integrated graphics.',
        explanation: 'A mid-tier CPU clears the tier-2 floor, and the entry discrete GPU clears the tier-1 floor these esports titles need. Relying on integrated graphics alone would not meet that floor, even though it is the cheaper path.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-igpu-mid',
                  text: 'Mid-range CPU w/ iGPU'
                },
                {
                  id: 'cpu-budget',
                  text: 'Budget quad-core CPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-1650',
                  text: 'Entry discrete GPU'
                },
                {
                  id: 'gpu-none',
                  text: 'No discrete GPU (iGPU only)'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-16',
                  text: '16GB RAM kit'
                },
                {
                  id: 'ram-8',
                  text: '8GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-450',
                  text: '450W PSU'
                },
                {
                  id: 'psu-250',
                  text: '250W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                },
                {
                  id: 'storage-256-sata',
                  text: '256GB SATA SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-stock',
                  text: 'Stock cooler'
                },
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-igpu-mid',
            gpu: 'gpu-1650',
            ram: 'ram-16',
            psu: 'psu-450',
            storage: 'storage-1tb-nvme',
            cooling: 'cool-stock'
          }
        }
      }
    ]
  },

  {
    id: 'a1-pcb-09',
    cert: 'aplus-core1',
    archetype: 'pcbuild',
    objective: '3.4',
    topic: 'Two-client PC build spec-off — architecture CAD workstation vs. family homework PC',
    title: 'Farrukh\'s CAD workstation and the Wanjiru family\'s homework PC',
    estMinutes: 8,
    scenario: 'Farrukh\'s architecture firm needs a workstation for BIM modeling and rendering — top of the catalog. Wanjiru just needs a simple, budget family PC for homework and video calls. Spec both.',
    pcbuild: {
      clientA: {
        budgetUsd: 1550,
        caseMaxGpuLengthMm: 320,
        minCpuTier: 4,
        minGpuTier: 3
      },
      clientB: {
        budgetUsd: 400,
        caseMaxGpuLengthMm: 190,
        minCpuTier: 1,
        minGpuTier: 0
      }
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'a-cpu',
            label: 'Client A · CPU socket'
          },
          {
            id: 'a-gpu',
            label: 'Client A · GPU bay · max 320mm'
          },
          {
            id: 'a-ram',
            label: 'Client A · RAM slots'
          },
          {
            id: 'a-psu',
            label: 'Client A · PSU bay · ATX'
          },
          {
            id: 'a-storage',
            label: 'Client A · Storage bay · 2.5in/3.5in'
          },
          {
            id: 'a-cooling',
            label: 'Client A · Cooling mount · 120/240mm'
          },
          {
            id: 'b-cpu',
            label: 'Client B · CPU socket'
          },
          {
            id: 'b-gpu',
            label: 'Client B · GPU bay · max 190mm'
          },
          {
            id: 'b-ram',
            label: 'Client B · RAM slots'
          },
          {
            id: 'b-psu',
            label: 'Client B · PSU bay · ATX'
          },
          {
            id: 'b-storage',
            label: 'Client B · Storage bay · 2.5in/3.5in'
          },
          {
            id: 'b-cooling',
            label: 'Client B · Cooling mount · stock/92mm'
          }
        ],
        notes: ['Client A · $1550 budget · ATX full-tower · BIM modeling + rendering', 'Client B · $400 budget · Micro-tower · Homework + video calls']
      }
    },
    steps: [
      {
        id: 'clientA',
        type: 'configure',
        points: 1,
        prompt: 'Spec Farrukh\'s CAD workstation: this ticket needs the flagship CPU and top-tier GPU to clear both tier floors, and the firm kept this ticket\'s budget tighter than usual.',
        explanation: 'BIM rendering needs the flagship CPU to clear the tier-4 floor and the top-tier GPU to clear the tier-3 floor; the creator-tier CPU and mid-range GPU each fall one tier short of this ticket\'s specific requirements. This firm\'s budget is tighter than a typical workstation build — after the flagship CPU, top-tier GPU, PSU, storage, and cooling, only the 32GB RAM kit fits; stepping up to 64GB overshoots the budget.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-flagship',
                  text: 'Flagship high-core CPU'
                },
                {
                  id: 'cpu-creator',
                  text: 'Creator-tier CPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-4070',
                  text: 'High-end discrete GPU'
                },
                {
                  id: 'gpu-4060',
                  text: 'Mid-range discrete GPU'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-32',
                  text: '32GB RAM kit'
                },
                {
                  id: 'ram-64',
                  text: '64GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-850',
                  text: '850W PSU'
                },
                {
                  id: 'psu-650',
                  text: '650W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-2tb-nvme',
                  text: '2TB NVMe SSD'
                },
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-240-aio',
                  text: '240mm AIO liquid cooler'
                },
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-flagship',
            gpu: 'gpu-4070',
            ram: 'ram-32',
            psu: 'psu-850',
            storage: 'storage-2tb-nvme',
            cooling: 'cool-240-aio'
          }
        }
      },
      {
        id: 'clientB',
        type: 'configure',
        points: 1,
        prompt: 'Spec the family homework PC: no discrete GPU needed, and mind the tight budget.',
        explanation: 'Office-tier CPU with integrated graphics handles homework apps and video calls fine. A discrete GPU adds nothing for this ticket and would push this tight family budget over the line once added.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-office',
                  text: 'Office six-core CPU'
                },
                {
                  id: 'cpu-budget',
                  text: 'Budget quad-core CPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-none',
                  text: 'No discrete GPU (iGPU only)'
                },
                {
                  id: 'gpu-1650',
                  text: 'Entry discrete GPU'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-16',
                  text: '16GB RAM kit'
                },
                {
                  id: 'ram-8',
                  text: '8GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-250',
                  text: '250W PSU'
                },
                {
                  id: 'psu-450',
                  text: '450W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                },
                {
                  id: 'storage-256-sata',
                  text: '256GB SATA SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-stock',
                  text: 'Stock cooler'
                },
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-office',
            gpu: 'gpu-none',
            ram: 'ram-16',
            psu: 'psu-250',
            storage: 'storage-1tb-nvme',
            cooling: 'cool-stock'
          }
        }
      }
    ]
  },

  {
    id: 'a1-pcb-10',
    cert: 'aplus-core1',
    archetype: 'pcbuild',
    objective: '3.4',
    topic: 'Two-client PC build spec-off — backend developer vs. retiree\'s email PC',
    title: 'Chidi\'s dev workstation and Harold\'s email machine',
    estMinutes: 8,
    scenario: 'Chidi runs local containers and builds all day and needs real CPU headroom plus a light GPU for occasional tooling. Harold just wants a small, cheap machine for email, news, and solitaire.',
    pcbuild: {
      clientA: {
        budgetUsd: 1000,
        caseMaxGpuLengthMm: 260,
        minCpuTier: 3,
        minGpuTier: 1
      },
      clientB: {
        budgetUsd: 280,
        caseMaxGpuLengthMm: 140,
        minCpuTier: 1,
        minGpuTier: 0
      }
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'a-cpu',
            label: 'Client A · CPU socket'
          },
          {
            id: 'a-gpu',
            label: 'Client A · GPU bay · max 260mm'
          },
          {
            id: 'a-ram',
            label: 'Client A · RAM slots'
          },
          {
            id: 'a-psu',
            label: 'Client A · PSU bay · ATX'
          },
          {
            id: 'a-storage',
            label: 'Client A · Storage bay · 2.5in/3.5in'
          },
          {
            id: 'a-cooling',
            label: 'Client A · Cooling mount · 120/240mm'
          },
          {
            id: 'b-cpu',
            label: 'Client B · CPU socket'
          },
          {
            id: 'b-gpu',
            label: 'Client B · GPU bay · max 140mm'
          },
          {
            id: 'b-ram',
            label: 'Client B · RAM slots'
          },
          {
            id: 'b-psu',
            label: 'Client B · PSU bay · SFX'
          },
          {
            id: 'b-storage',
            label: 'Client B · Storage bay · 2.5in only'
          },
          {
            id: 'b-cooling',
            label: 'Client B · Cooling mount · stock only'
          }
        ],
        notes: ['Client A · $1000 budget · ATX mid-tower · Local container builds', 'Client B · $280 budget · Mini-ITX shoebox · Email + news + solitaire']
      }
    },
    steps: [
      {
        id: 'clientA',
        type: 'configure',
        points: 1,
        prompt: 'Spec Chidi\'s dev workstation: a strong CPU for parallel builds, and a light discrete GPU to clear the tier-1 floor for occasional GUI tooling.',
        explanation: 'The creator-tier CPU clears the tier-3 floor needed for parallel compiles and containers; the entry discrete GPU clears the tier-1 floor his occasional tooling needs — integrated graphics alone would fall short of that floor.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-creator',
                  text: 'Creator-tier CPU'
                },
                {
                  id: 'cpu-igpu-mid',
                  text: 'Mid-range CPU w/ iGPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-1650',
                  text: 'Entry discrete GPU'
                },
                {
                  id: 'gpu-none',
                  text: 'No discrete GPU (iGPU only)'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-64',
                  text: '64GB RAM kit'
                },
                {
                  id: 'ram-32',
                  text: '32GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-450',
                  text: '450W PSU'
                },
                {
                  id: 'psu-250',
                  text: '250W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-2tb-nvme',
                  text: '2TB NVMe SSD'
                },
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                },
                {
                  id: 'cool-stock',
                  text: 'Stock cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-creator',
            gpu: 'gpu-1650',
            ram: 'ram-64',
            psu: 'psu-450',
            storage: 'storage-2tb-nvme',
            cooling: 'cool-120-air'
          }
        }
      },
      {
        id: 'clientB',
        type: 'configure',
        points: 1,
        prompt: 'Spec Harold\'s email machine: keep it small and cheap, and mind the shoebox case\'s 140mm GPU clearance.',
        explanation: 'A budget CPU with integrated graphics is all this light-use ticket needs. The entry discrete GPU is 170mm, longer than this case\'s 140mm clearance, so it would not fit even as a "why not" add-on.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-budget',
                  text: 'Budget quad-core CPU'
                },
                {
                  id: 'cpu-office',
                  text: 'Office six-core CPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-none',
                  text: 'No discrete GPU (iGPU only)'
                },
                {
                  id: 'gpu-1650',
                  text: 'Entry discrete GPU'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-8',
                  text: '8GB RAM kit'
                },
                {
                  id: 'ram-16',
                  text: '16GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-250',
                  text: '250W PSU'
                },
                {
                  id: 'psu-450',
                  text: '450W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-256-sata',
                  text: '256GB SATA SSD'
                },
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-stock',
                  text: 'Stock cooler'
                },
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-budget',
            gpu: 'gpu-none',
            ram: 'ram-8',
            psu: 'psu-250',
            storage: 'storage-256-sata',
            cooling: 'cool-stock'
          }
        }
      }
    ]
  },

  {
    id: 'a1-pcb-11',
    cert: 'aplus-core1',
    archetype: 'pcbuild',
    objective: '3.4',
    topic: 'Two-client PC build spec-off — competitive esports player vs. freelance writer',
    title: 'Ester\'s competitive rig and Palmer\'s writing desktop',
    estMinutes: 8,
    scenario: 'Ester plays competitive titles that lean on single-core frame rate more than graphics fidelity, so the top-tier GPU is overkill AND too long for her case. Palmer writes manuscripts and researches online — a light, no-GPU build that fits a tight budget.',
    pcbuild: {
      clientA: {
        budgetUsd: 950,
        caseMaxGpuLengthMm: 260,
        minCpuTier: 3,
        minGpuTier: 2
      },
      clientB: {
        budgetUsd: 380,
        caseMaxGpuLengthMm: 160,
        minCpuTier: 1,
        minGpuTier: 0
      }
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'a-cpu',
            label: 'Client A · CPU socket'
          },
          {
            id: 'a-gpu',
            label: 'Client A · GPU bay · max 260mm'
          },
          {
            id: 'a-ram',
            label: 'Client A · RAM slots'
          },
          {
            id: 'a-psu',
            label: 'Client A · PSU bay · ATX'
          },
          {
            id: 'a-storage',
            label: 'Client A · Storage bay · 2.5in/3.5in'
          },
          {
            id: 'a-cooling',
            label: 'Client A · Cooling mount · 120/240mm'
          },
          {
            id: 'b-cpu',
            label: 'Client B · CPU socket'
          },
          {
            id: 'b-gpu',
            label: 'Client B · GPU bay · max 160mm'
          },
          {
            id: 'b-ram',
            label: 'Client B · RAM slots'
          },
          {
            id: 'b-psu',
            label: 'Client B · PSU bay · SFX'
          },
          {
            id: 'b-storage',
            label: 'Client B · Storage bay · 2.5in only'
          },
          {
            id: 'b-cooling',
            label: 'Client B · Cooling mount · stock only'
          }
        ],
        notes: ['Client A · $950 budget · ATX mid-tower · Competitive esports gaming', 'Client B · $380 budget · Micro-tower · Manuscript writing + research']
      }
    },
    steps: [
      {
        id: 'clientA',
        type: 'configure',
        points: 1,
        prompt: 'Spec Ester\'s competitive rig: strong single-core CPU for frame rate, and a GPU that clears the tier floor without overspending on one that will not even fit.',
        explanation: 'The creator-tier CPU clears the tier-3 floor for high, stable frame rates; the mid-range GPU clears the tier-2 floor these lighter-graphics titles need. The top-tier GPU is both unnecessary here and 310mm — too long for this 260mm case.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-creator',
                  text: 'Creator-tier CPU'
                },
                {
                  id: 'cpu-igpu-mid',
                  text: 'Mid-range CPU w/ iGPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-4060',
                  text: 'Mid-range discrete GPU'
                },
                {
                  id: 'gpu-4070',
                  text: 'High-end discrete GPU'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-32',
                  text: '32GB RAM kit'
                },
                {
                  id: 'ram-16',
                  text: '16GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-450',
                  text: '450W PSU'
                },
                {
                  id: 'psu-250',
                  text: '250W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                },
                {
                  id: 'storage-256-sata',
                  text: '256GB SATA SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                },
                {
                  id: 'cool-stock',
                  text: 'Stock cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-creator',
            gpu: 'gpu-4060',
            ram: 'ram-32',
            psu: 'psu-450',
            storage: 'storage-1tb-nvme',
            cooling: 'cool-120-air'
          }
        }
      },
      {
        id: 'clientB',
        type: 'configure',
        points: 1,
        prompt: 'Spec Palmer\'s writing desktop: no discrete GPU needed, and mind the case\'s 160mm GPU clearance either way.',
        explanation: 'Office-tier CPU with integrated graphics is plenty for word processing, research tabs, and video calls. The entry discrete GPU is 170mm — longer than this case\'s 160mm clearance — so it is not an option here regardless of need.',
        payload: {
          slots: [
            {
              id: 'cpu',
              label: 'CPU',
              options: [
                {
                  id: 'cpu-office',
                  text: 'Office six-core CPU'
                },
                {
                  id: 'cpu-budget',
                  text: 'Budget quad-core CPU'
                }
              ]
            },
            {
              id: 'gpu',
              label: 'GPU',
              options: [
                {
                  id: 'gpu-none',
                  text: 'No discrete GPU (iGPU only)'
                },
                {
                  id: 'gpu-1650',
                  text: 'Entry discrete GPU'
                }
              ]
            },
            {
              id: 'ram',
              label: 'RAM',
              options: [
                {
                  id: 'ram-16',
                  text: '16GB RAM kit'
                },
                {
                  id: 'ram-8',
                  text: '8GB RAM kit'
                }
              ]
            },
            {
              id: 'psu',
              label: 'Power supply',
              options: [
                {
                  id: 'psu-250',
                  text: '250W PSU'
                },
                {
                  id: 'psu-450',
                  text: '450W PSU'
                }
              ]
            },
            {
              id: 'storage',
              label: 'Storage',
              options: [
                {
                  id: 'storage-1tb-nvme',
                  text: '1TB NVMe SSD'
                },
                {
                  id: 'storage-256-sata',
                  text: '256GB SATA SSD'
                }
              ]
            },
            {
              id: 'cooling',
              label: 'Cooling',
              options: [
                {
                  id: 'cool-stock',
                  text: 'Stock cooler'
                },
                {
                  id: 'cool-120-air',
                  text: '120mm air cooler'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            cpu: 'cpu-office',
            gpu: 'gpu-none',
            ram: 'ram-16',
            psu: 'psu-250',
            storage: 'storage-1tb-nvme',
            cooling: 'cool-stock'
          }
        }
      }
    ]
  },
  {
    id: 'a1-raid-01',
    cert: 'aplus-core1',
    archetype: 'raid',
    objective: '3.4',
    topic: 'RAID 0 build — home NAS media scratch volume, no redundancy required',
    title: 'Media scratch volume: raw speed, no redundancy',
    estMinutes: 6,
    scenario: 'A home NAS needs a fast scratch volume for transcoding video — nothing on it is irreplaceable, source files live elsewhere. The client wants maximum usable capacity from three 2TB drives and doesn\'t care about drive failure protection for this volume. Build the array, then one drive drops out of the pool overnight.',
    raid: {
      targetUsableTb: 6,
      targetTolerance: 0,
      failedDriveCount: 1
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'bay1',
            label: 'Drive bay 1'
          },
          {
            id: 'bay2',
            label: 'Drive bay 2'
          },
          {
            id: 'bay3',
            label: 'Drive bay 3'
          }
        ],
        notes: ['Client: home NAS media scratch', 'Available: three 2TB drives', 'No redundancy required']
      }
    },
    steps: [
      {
        id: 'build',
        type: 'configure',
        points: 1,
        prompt: 'Configure the array to hit 6TB usable from three 2TB drives with no redundancy requirement.',
        explanation: 'Striping across all three 2TB drives with RAID 0 yields the full 6TB usable — RAID 1 or 5 would waste capacity on parity/mirroring the client explicitly doesn\'t need here.',
        payload: {
          slots: [
            {
              id: 'level',
              label: 'RAID level',
              options: [
                {
                  id: 'raid0',
                  text: 'RAID 0 (striping)'
                },
                {
                  id: 'raid1',
                  text: 'RAID 1 (mirroring)'
                },
                {
                  id: 'raid5',
                  text: 'RAID 5 (single parity)'
                }
              ]
            },
            {
              id: 'driveCount',
              label: 'Drive count',
              options: [
                {
                  id: 'c2',
                  text: '2 drives'
                },
                {
                  id: 'c3',
                  text: '3 drives'
                },
                {
                  id: 'c4',
                  text: '4 drives'
                }
              ]
            },
            {
              id: 'driveSize',
              label: 'Drive size',
              options: [
                {
                  id: 's1',
                  text: '1TB per drive'
                },
                {
                  id: 's2',
                  text: '2TB per drive'
                },
                {
                  id: 's4',
                  text: '4TB per drive'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            level: 'raid0',
            driveCount: 'c3',
            driveSize: 's2'
          }
        }
      },
      {
        id: 'degrade',
        type: 'configure',
        points: 1,
        prompt: 'One of the three drives just dropped offline. What is the array status and next step?',
        explanation: 'RAID 0 has zero fault tolerance — losing any single drive destroys the whole stripe set. The array is unrecoverable in place; whatever was on it must come from a source copy, not a rebuild.',
        payload: {
          slots: [
            {
              id: 'arrayStatus',
              label: 'Array status',
              options: [
                {
                  id: 'st-healthy',
                  text: 'Healthy / Optimal'
                },
                {
                  id: 'st-degraded',
                  text: 'Degraded'
                },
                {
                  id: 'st-failed',
                  text: 'Failed'
                }
              ]
            },
            {
              id: 'recoveryAction',
              label: 'Recovery action',
              options: [
                {
                  id: 'ac-none',
                  text: 'No action needed — monitor'
                },
                {
                  id: 'ac-rebuild',
                  text: 'Hot-swap the failed drive(s) and rebuild the array'
                },
                {
                  id: 'ac-restore',
                  text: 'Array is unrecoverable — restore from backup'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            arrayStatus: 'st-failed',
            recoveryAction: 'ac-restore'
          }
        }
      }
    ]
  },
  {
    id: 'a1-raid-02',
    cert: 'aplus-core1',
    archetype: 'raid',
    objective: '3.4',
    topic: 'RAID 0 build — video-editing scratch array, fully healthy check-in',
    title: 'Scratch array health check before a big edit session',
    estMinutes: 6,
    scenario: 'A video editor\'s scratch array — two 4TB drives striped for throughput — is being checked before a deadline edit session. The client wants confirmation the array is healthy before committing hours of render work to it.',
    raid: {
      targetUsableTb: 8,
      targetTolerance: 0,
      failedDriveCount: 0
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'bay1',
            label: 'Drive bay 1'
          },
          {
            id: 'bay2',
            label: 'Drive bay 2'
          }
        ],
        notes: ['Client: video-editing scratch array', 'Available: two 4TB drives', 'No redundancy required']
      }
    },
    steps: [
      {
        id: 'build',
        type: 'configure',
        points: 1,
        prompt: 'Build the scratch array for maximum throughput and usable capacity from two 4TB drives.',
        explanation: 'Two drives is the minimum RAID 0 supports, and striping both 4TB drives gives the full 8TB usable — no fewer-drive combination at this size reaches 8TB.',
        payload: {
          slots: [
            {
              id: 'level',
              label: 'RAID level',
              options: [
                {
                  id: 'raid0',
                  text: 'RAID 0 (striping)'
                },
                {
                  id: 'raid1',
                  text: 'RAID 1 (mirroring)'
                }
              ]
            },
            {
              id: 'driveCount',
              label: 'Drive count',
              options: [
                {
                  id: 'c2',
                  text: '2 drives'
                },
                {
                  id: 'c3',
                  text: '3 drives'
                }
              ]
            },
            {
              id: 'driveSize',
              label: 'Drive size',
              options: [
                {
                  id: 's2',
                  text: '2TB per drive'
                },
                {
                  id: 's4',
                  text: '4TB per drive'
                },
                {
                  id: 's8',
                  text: '8TB per drive'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            level: 'raid0',
            driveCount: 'c2',
            driveSize: 's4'
          }
        }
      },
      {
        id: 'degrade',
        type: 'configure',
        points: 1,
        prompt: 'Pre-session check: both drives report clean SMART status, no drops. What\'s the array status and next step?',
        explanation: 'With zero failed drives the array is healthy and fully usable — no recovery action needed, just proceed with the edit session.',
        payload: {
          slots: [
            {
              id: 'arrayStatus',
              label: 'Array status',
              options: [
                {
                  id: 'st-healthy',
                  text: 'Healthy / Optimal'
                },
                {
                  id: 'st-degraded',
                  text: 'Degraded'
                },
                {
                  id: 'st-failed',
                  text: 'Failed'
                }
              ]
            },
            {
              id: 'recoveryAction',
              label: 'Recovery action',
              options: [
                {
                  id: 'ac-none',
                  text: 'No action needed — monitor'
                },
                {
                  id: 'ac-rebuild',
                  text: 'Hot-swap the failed drive(s) and rebuild the array'
                },
                {
                  id: 'ac-restore',
                  text: 'Array is unrecoverable — restore from backup'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            arrayStatus: 'st-healthy',
            recoveryAction: 'ac-none'
          }
        }
      }
    ]
  },
  {
    id: 'a1-raid-11',
    cert: 'aplus-core1',
    archetype: 'raid',
    objective: '3.4',
    topic: 'RAID 0 build — budget gaming rig fast temp/scratch disk',
    title: 'Budget gaming rig: fast temp disk from spare SSDs',
    estMinutes: 6,
    scenario: 'A budget gaming build has four spare 1TB SSDs and needs a fast temp/shader-cache disk — the OS and game library live elsewhere, this volume is fully disposable. The client wants every bit of capacity and speed out of the four drives.',
    raid: {
      targetUsableTb: 4,
      targetTolerance: 0,
      failedDriveCount: 1
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'bay1',
            label: 'Drive bay 1'
          },
          {
            id: 'bay2',
            label: 'Drive bay 2'
          },
          {
            id: 'bay3',
            label: 'Drive bay 3'
          },
          {
            id: 'bay4',
            label: 'Drive bay 4'
          }
        ],
        notes: ['Client: budget gaming rig temp/scratch disk', 'Available: four 1TB SSDs', 'Fully disposable data — no redundancy required']
      }
    },
    steps: [
      {
        id: 'build',
        type: 'configure',
        points: 1,
        prompt: 'Build the temp disk for maximum capacity and speed from all four 1TB SSDs.',
        explanation: 'Striping all four 1TB drives with RAID 0 gives the full 4TB usable — three drives alone (3TB) falls short of the 4TB target, so all four are required.',
        payload: {
          slots: [
            {
              id: 'level',
              label: 'RAID level',
              options: [
                {
                  id: 'raid0',
                  text: 'RAID 0 (striping)'
                },
                {
                  id: 'raid5',
                  text: 'RAID 5 (single parity)'
                },
                {
                  id: 'raid10',
                  text: 'RAID 10 (mirrored stripe)'
                }
              ]
            },
            {
              id: 'driveCount',
              label: 'Drive count',
              options: [
                {
                  id: 'c3',
                  text: '3 drives'
                },
                {
                  id: 'c4',
                  text: '4 drives'
                }
              ]
            },
            {
              id: 'driveSize',
              label: 'Drive size',
              options: [
                {
                  id: 's1',
                  text: '1TB per drive'
                },
                {
                  id: 's2',
                  text: '2TB per drive'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            level: 'raid0',
            driveCount: 'c4',
            driveSize: 's1'
          }
        }
      },
      {
        id: 'degrade',
        type: 'configure',
        points: 1,
        prompt: 'One of the four SSDs failed. What is the array status and next step?',
        explanation: 'RAID 0 tolerates zero drive failures — one dead drive takes the whole stripe with it, and there is no parity or mirror to reconstruct from. The array is Failed and unrecoverable in place; the only path forward is recreating the volume from a source copy (or accepting data loss, since this was disposable scratch data).',
        payload: {
          slots: [
            {
              id: 'arrayStatus',
              label: 'Array status',
              options: [
                {
                  id: 'st-healthy',
                  text: 'Healthy / Optimal'
                },
                {
                  id: 'st-degraded',
                  text: 'Degraded'
                },
                {
                  id: 'st-failed',
                  text: 'Failed'
                }
              ]
            },
            {
              id: 'recoveryAction',
              label: 'Recovery action',
              options: [
                {
                  id: 'ac-none',
                  text: 'No action needed — monitor'
                },
                {
                  id: 'ac-rebuild',
                  text: 'Hot-swap the failed drive(s) and rebuild the array'
                },
                {
                  id: 'ac-restore',
                  text: 'Array is unrecoverable — restore from backup'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            arrayStatus: 'st-failed',
            recoveryAction: 'ac-restore'
          }
        }
      }
    ]
  },
  {
    id: 'a1-raid-03',
    cert: 'aplus-core1',
    archetype: 'raid',
    objective: '3.4',
    topic: 'RAID 1 build — small business file server, single mirrored pair',
    title: 'Small business file server: mirrored pair for one failure',
    estMinutes: 6,
    scenario: 'A five-person office file server needs 2TB of protected storage that survives a single drive failure. Two 2TB drives are on hand. Build the array, then one drive throws SMART errors and drops out.',
    raid: {
      targetUsableTb: 2,
      targetTolerance: 1,
      failedDriveCount: 1
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'bay1',
            label: 'Drive bay 1'
          },
          {
            id: 'bay2',
            label: 'Drive bay 2'
          }
        ],
        notes: ['Client: small business file server', 'Available: two 2TB drives', 'Must survive one drive failure']
      }
    },
    steps: [
      {
        id: 'build',
        type: 'configure',
        points: 1,
        prompt: 'Build the array to give 2TB usable, protected storage from two 2TB drives.',
        explanation: 'Mirroring the two 2TB drives with RAID 1 gives 2TB usable and survives one drive failure — RAID 0 would double capacity but offers zero protection, which fails this client\'s requirement.',
        payload: {
          slots: [
            {
              id: 'level',
              label: 'RAID level',
              options: [
                {
                  id: 'raid0',
                  text: 'RAID 0 (striping)'
                },
                {
                  id: 'raid1',
                  text: 'RAID 1 (mirroring)'
                }
              ]
            },
            {
              id: 'driveCount',
              label: 'Drive count',
              options: [
                {
                  id: 'c2',
                  text: '2 drives'
                },
                {
                  id: 'c3',
                  text: '3 drives'
                }
              ]
            },
            {
              id: 'driveSize',
              label: 'Drive size',
              options: [
                {
                  id: 's2',
                  text: '2TB per drive'
                },
                {
                  id: 's4',
                  text: '4TB per drive'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            level: 'raid1',
            driveCount: 'c2',
            driveSize: 's2'
          }
        }
      },
      {
        id: 'degrade',
        type: 'configure',
        points: 1,
        prompt: 'One of the mirrored drives just dropped offline. What is the array status and next step?',
        explanation: 'RAID 1 tolerates exactly one failed drive — the mirror is still serving data from the surviving copy. Status is Degraded, and the fix is to hot-swap the bad drive and let it rebuild from the mirror.',
        payload: {
          slots: [
            {
              id: 'arrayStatus',
              label: 'Array status',
              options: [
                {
                  id: 'st-healthy',
                  text: 'Healthy / Optimal'
                },
                {
                  id: 'st-degraded',
                  text: 'Degraded'
                },
                {
                  id: 'st-failed',
                  text: 'Failed'
                }
              ]
            },
            {
              id: 'recoveryAction',
              label: 'Recovery action',
              options: [
                {
                  id: 'ac-none',
                  text: 'No action needed — monitor'
                },
                {
                  id: 'ac-rebuild',
                  text: 'Hot-swap the failed drive(s) and rebuild the array'
                },
                {
                  id: 'ac-restore',
                  text: 'Array is unrecoverable — restore from backup'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            arrayStatus: 'st-degraded',
            recoveryAction: 'ac-rebuild'
          }
        }
      }
    ]
  },
  {
    id: 'a1-raid-04',
    cert: 'aplus-core1',
    archetype: 'raid',
    objective: '3.4',
    topic: 'RAID 1 build — home NAS, both mirrored drives fail together',
    title: 'Home NAS mirror: a power surge takes out both drives',
    estMinutes: 6,
    scenario: 'A home NAS mirrors two 4TB drives for photo/document backup. After a power surge, the technician needs to build the mirror, and separately assess a worst-case scenario where both drives in the pair report failure simultaneously.',
    raid: {
      targetUsableTb: 4,
      targetTolerance: 1,
      failedDriveCount: 2
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'bay1',
            label: 'Drive bay 1'
          },
          {
            id: 'bay2',
            label: 'Drive bay 2'
          }
        ],
        notes: ['Client: home NAS photo/document backup', 'Available: two 4TB drives', 'Must survive one drive failure']
      }
    },
    steps: [
      {
        id: 'build',
        type: 'configure',
        points: 1,
        prompt: 'Build the mirror for 4TB usable, protected storage from two 4TB drives.',
        explanation: 'RAID 1 across two 4TB drives gives 4TB usable and tolerates one drive loss — the minimum two-drive configuration already meets both the capacity and tolerance targets.',
        payload: {
          slots: [
            {
              id: 'level',
              label: 'RAID level',
              options: [
                {
                  id: 'raid0',
                  text: 'RAID 0 (striping)'
                },
                {
                  id: 'raid1',
                  text: 'RAID 1 (mirroring)'
                }
              ]
            },
            {
              id: 'driveCount',
              label: 'Drive count',
              options: [
                {
                  id: 'c2',
                  text: '2 drives'
                },
                {
                  id: 'c3',
                  text: '3 drives'
                }
              ]
            },
            {
              id: 'driveSize',
              label: 'Drive size',
              options: [
                {
                  id: 's2',
                  text: '2TB per drive'
                },
                {
                  id: 's4',
                  text: '4TB per drive'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            level: 'raid1',
            driveCount: 'c2',
            driveSize: 's4'
          }
        }
      },
      {
        id: 'degrade',
        type: 'configure',
        points: 1,
        prompt: 'A power surge knocked out both drives in the mirrored pair at once. What is the array status and next step?',
        explanation: 'RAID 1 only tolerates one failed drive — losing both members of the pair simultaneously exceeds that tolerance and takes down the array entirely. It must be rebuilt from backup, not recovered in place.',
        payload: {
          slots: [
            {
              id: 'arrayStatus',
              label: 'Array status',
              options: [
                {
                  id: 'st-healthy',
                  text: 'Healthy / Optimal'
                },
                {
                  id: 'st-degraded',
                  text: 'Degraded'
                },
                {
                  id: 'st-failed',
                  text: 'Failed'
                }
              ]
            },
            {
              id: 'recoveryAction',
              label: 'Recovery action',
              options: [
                {
                  id: 'ac-none',
                  text: 'No action needed — monitor'
                },
                {
                  id: 'ac-rebuild',
                  text: 'Hot-swap the failed drive(s) and rebuild the array'
                },
                {
                  id: 'ac-restore',
                  text: 'Array is unrecoverable — restore from backup'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            arrayStatus: 'st-failed',
            recoveryAction: 'ac-restore'
          }
        }
      }
    ]
  },
  {
    id: 'a1-raid-10',
    cert: 'aplus-core1',
    archetype: 'raid',
    objective: '3.4',
    topic: 'RAID 1 build — architecture firm large-file redundant server',
    title: 'Architecture firm: redundant server for large CAD files',
    estMinutes: 6,
    scenario: 'An architecture firm keeps large CAD/BIM project files on a server that must survive one drive failure without data loss. Two 8TB drives are budgeted. Build the mirror, then one drive fails during a project crunch.',
    raid: {
      targetUsableTb: 8,
      targetTolerance: 1,
      failedDriveCount: 1
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'bay1',
            label: 'Drive bay 1'
          },
          {
            id: 'bay2',
            label: 'Drive bay 2'
          }
        ],
        notes: ['Client: architecture firm CAD/BIM file server', 'Available: two 8TB drives', 'Must survive one drive failure']
      }
    },
    steps: [
      {
        id: 'build',
        type: 'configure',
        points: 1,
        prompt: 'Build the redundant server volume for 8TB usable from two 8TB drives.',
        explanation: 'Mirroring the two 8TB drives gives 8TB usable and tolerates a single drive failure — the minimum two-drive RAID 1 pair already clears both targets.',
        payload: {
          slots: [
            {
              id: 'level',
              label: 'RAID level',
              options: [
                {
                  id: 'raid0',
                  text: 'RAID 0 (striping)'
                },
                {
                  id: 'raid1',
                  text: 'RAID 1 (mirroring)'
                }
              ]
            },
            {
              id: 'driveCount',
              label: 'Drive count',
              options: [
                {
                  id: 'c2',
                  text: '2 drives'
                },
                {
                  id: 'c4',
                  text: '4 drives'
                }
              ]
            },
            {
              id: 'driveSize',
              label: 'Drive size',
              options: [
                {
                  id: 's4',
                  text: '4TB per drive'
                },
                {
                  id: 's8',
                  text: '8TB per drive'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            level: 'raid1',
            driveCount: 'c2',
            driveSize: 's8'
          }
        }
      },
      {
        id: 'degrade',
        type: 'configure',
        points: 1,
        prompt: 'One of the two mirrored drives failed mid-project. What is the array status and next step?',
        explanation: 'One failed drive is exactly within RAID 1\'s tolerance — the array keeps serving from the surviving mirror. Status is Degraded; hot-swap the failed drive and rebuild the mirror.',
        payload: {
          slots: [
            {
              id: 'arrayStatus',
              label: 'Array status',
              options: [
                {
                  id: 'st-healthy',
                  text: 'Healthy / Optimal'
                },
                {
                  id: 'st-degraded',
                  text: 'Degraded'
                },
                {
                  id: 'st-failed',
                  text: 'Failed'
                }
              ]
            },
            {
              id: 'recoveryAction',
              label: 'Recovery action',
              options: [
                {
                  id: 'ac-none',
                  text: 'No action needed — monitor'
                },
                {
                  id: 'ac-rebuild',
                  text: 'Hot-swap the failed drive(s) and rebuild the array'
                },
                {
                  id: 'ac-restore',
                  text: 'Array is unrecoverable — restore from backup'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            arrayStatus: 'st-degraded',
            recoveryAction: 'ac-rebuild'
          }
        }
      }
    ]
  },
  {
    id: 'a1-raid-05',
    cert: 'aplus-core1',
    archetype: 'raid',
    objective: '3.4',
    topic: 'RAID 5 build — department storage share, single-parity protection',
    title: 'Department share: single-parity protection on a budget',
    estMinutes: 6,
    scenario: 'A department storage share needs 8TB of usable, protected space and can tolerate one drive failure. Three 4TB drives are available. Build the array, then one drive fails.',
    raid: {
      targetUsableTb: 8,
      targetTolerance: 1,
      failedDriveCount: 1
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'bay1',
            label: 'Drive bay 1'
          },
          {
            id: 'bay2',
            label: 'Drive bay 2'
          },
          {
            id: 'bay3',
            label: 'Drive bay 3'
          }
        ],
        notes: ['Client: department storage share', 'Available: three 4TB drives', 'Must survive one drive failure']
      }
    },
    steps: [
      {
        id: 'build',
        type: 'configure',
        points: 1,
        prompt: 'Build the array for 8TB usable, one-drive-failure-tolerant storage from three 4TB drives.',
        explanation: 'RAID 5 across three 4TB drives dedicates one drive\'s worth of capacity to parity, leaving 8TB usable with single-drive fault tolerance — the minimum drive count (3) that clears both targets.',
        payload: {
          slots: [
            {
              id: 'level',
              label: 'RAID level',
              options: [
                {
                  id: 'raid0',
                  text: 'RAID 0 (striping)'
                },
                {
                  id: 'raid1',
                  text: 'RAID 1 (mirroring)'
                },
                {
                  id: 'raid5',
                  text: 'RAID 5 (single parity)'
                }
              ]
            },
            {
              id: 'driveCount',
              label: 'Drive count',
              options: [
                {
                  id: 'c3',
                  text: '3 drives'
                },
                {
                  id: 'c4',
                  text: '4 drives'
                }
              ]
            },
            {
              id: 'driveSize',
              label: 'Drive size',
              options: [
                {
                  id: 's2',
                  text: '2TB per drive'
                },
                {
                  id: 's4',
                  text: '4TB per drive'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            level: 'raid5',
            driveCount: 'c3',
            driveSize: 's4'
          }
        }
      },
      {
        id: 'degrade',
        type: 'configure',
        points: 1,
        prompt: 'One of the three drives in the array failed. What is the array status and next step?',
        explanation: 'One failed drive is within RAID 5\'s single-parity tolerance — the array reconstructs missing data from parity on the fly. Status is Degraded; hot-swap the drive and rebuild.',
        payload: {
          slots: [
            {
              id: 'arrayStatus',
              label: 'Array status',
              options: [
                {
                  id: 'st-healthy',
                  text: 'Healthy / Optimal'
                },
                {
                  id: 'st-degraded',
                  text: 'Degraded'
                },
                {
                  id: 'st-failed',
                  text: 'Failed'
                }
              ]
            },
            {
              id: 'recoveryAction',
              label: 'Recovery action',
              options: [
                {
                  id: 'ac-none',
                  text: 'No action needed — monitor'
                },
                {
                  id: 'ac-rebuild',
                  text: 'Hot-swap the failed drive(s) and rebuild the array'
                },
                {
                  id: 'ac-restore',
                  text: 'Array is unrecoverable — restore from backup'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            arrayStatus: 'st-degraded',
            recoveryAction: 'ac-rebuild'
          }
        }
      }
    ]
  },
  {
    id: 'a1-raid-06',
    cert: 'aplus-core1',
    archetype: 'raid',
    objective: '3.4',
    topic: 'RAID 5 build — growing SMB storage array, two simultaneous failures',
    title: 'SMB storage array: two drives fail in the same week',
    estMinutes: 6,
    scenario: 'A growing small business needs 16TB of usable, single-parity-protected storage. Five 4TB drives are budgeted. Build the array, then a bad batch causes two drives to fail within days of each other.',
    raid: {
      targetUsableTb: 16,
      targetTolerance: 1,
      failedDriveCount: 2
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'bay1',
            label: 'Drive bay 1'
          },
          {
            id: 'bay2',
            label: 'Drive bay 2'
          },
          {
            id: 'bay3',
            label: 'Drive bay 3'
          },
          {
            id: 'bay4',
            label: 'Drive bay 4'
          },
          {
            id: 'bay5',
            label: 'Drive bay 5'
          }
        ],
        notes: ['Client: growing SMB storage array', 'Available: five 4TB drives', 'Must survive one drive failure']
      }
    },
    steps: [
      {
        id: 'build',
        type: 'configure',
        points: 1,
        prompt: 'Build the array for 16TB usable, single-drive-failure-tolerant storage from five 4TB drives.',
        explanation: 'RAID 5 across five 4TB drives gives (5-1)×4TB = 16TB usable with single-parity protection — four drives alone would only reach 12TB, so five is the minimal fit.',
        payload: {
          slots: [
            {
              id: 'level',
              label: 'RAID level',
              options: [
                {
                  id: 'raid0',
                  text: 'RAID 0 (striping)'
                },
                {
                  id: 'raid5',
                  text: 'RAID 5 (single parity)'
                },
                {
                  id: 'raid6',
                  text: 'RAID 6 (dual parity)'
                }
              ]
            },
            {
              id: 'driveCount',
              label: 'Drive count',
              options: [
                {
                  id: 'c4',
                  text: '4 drives'
                },
                {
                  id: 'c5',
                  text: '5 drives'
                }
              ]
            },
            {
              id: 'driveSize',
              label: 'Drive size',
              options: [
                {
                  id: 's2',
                  text: '2TB per drive'
                },
                {
                  id: 's4',
                  text: '4TB per drive'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            level: 'raid5',
            driveCount: 'c5',
            driveSize: 's4'
          }
        }
      },
      {
        id: 'degrade',
        type: 'configure',
        points: 1,
        prompt: 'Two drives failed within the same week. What is the array status and next step?',
        explanation: 'RAID 5\'s single parity only tolerates one failed drive — a second failure before the rebuild completes exceeds tolerance and the array is lost. Restore from backup rather than attempting an in-place rebuild.',
        payload: {
          slots: [
            {
              id: 'arrayStatus',
              label: 'Array status',
              options: [
                {
                  id: 'st-healthy',
                  text: 'Healthy / Optimal'
                },
                {
                  id: 'st-degraded',
                  text: 'Degraded'
                },
                {
                  id: 'st-failed',
                  text: 'Failed'
                }
              ]
            },
            {
              id: 'recoveryAction',
              label: 'Recovery action',
              options: [
                {
                  id: 'ac-none',
                  text: 'No action needed — monitor'
                },
                {
                  id: 'ac-rebuild',
                  text: 'Hot-swap the failed drive(s) and rebuild the array'
                },
                {
                  id: 'ac-restore',
                  text: 'Array is unrecoverable — restore from backup'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            arrayStatus: 'st-failed',
            recoveryAction: 'ac-restore'
          }
        }
      }
    ]
  },
  {
    id: 'a1-raid-09',
    cert: 'aplus-core1',
    archetype: 'raid',
    objective: '3.4',
    topic: 'RAID 5 build — home lab file server, healthy status check',
    title: 'Home lab file server: routine health check, all drives green',
    estMinutes: 6,
    scenario: 'A home lab file server runs RAID 5 across three 2TB drives for 4TB of protected usable storage. A routine monthly check confirms all three drives are healthy with no errors logged.',
    raid: {
      targetUsableTb: 4,
      targetTolerance: 1,
      failedDriveCount: 0
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'bay1',
            label: 'Drive bay 1'
          },
          {
            id: 'bay2',
            label: 'Drive bay 2'
          },
          {
            id: 'bay3',
            label: 'Drive bay 3'
          }
        ],
        notes: ['Client: home lab file server', 'Available: three 2TB drives', 'Must survive one drive failure']
      }
    },
    steps: [
      {
        id: 'build',
        type: 'configure',
        points: 1,
        prompt: 'Build the array for 4TB usable, single-drive-failure-tolerant storage from three 2TB drives.',
        explanation: 'RAID 5 across three 2TB drives gives (3-1)×2TB = 4TB usable with single-parity protection — the minimum three-drive RAID 5 configuration already clears both targets.',
        payload: {
          slots: [
            {
              id: 'level',
              label: 'RAID level',
              options: [
                {
                  id: 'raid1',
                  text: 'RAID 1 (mirroring)'
                },
                {
                  id: 'raid5',
                  text: 'RAID 5 (single parity)'
                }
              ]
            },
            {
              id: 'driveCount',
              label: 'Drive count',
              options: [
                {
                  id: 'c3',
                  text: '3 drives'
                },
                {
                  id: 'c4',
                  text: '4 drives'
                }
              ]
            },
            {
              id: 'driveSize',
              label: 'Drive size',
              options: [
                {
                  id: 's2',
                  text: '2TB per drive'
                },
                {
                  id: 's4',
                  text: '4TB per drive'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            level: 'raid5',
            driveCount: 'c3',
            driveSize: 's2'
          }
        }
      },
      {
        id: 'degrade',
        type: 'configure',
        points: 1,
        prompt: 'Monthly check: all three drives report healthy, zero errors. What\'s the array status and next step?',
        explanation: 'With zero failed drives the array is healthy and fully redundant — no recovery action is needed, just continue routine monitoring.',
        payload: {
          slots: [
            {
              id: 'arrayStatus',
              label: 'Array status',
              options: [
                {
                  id: 'st-healthy',
                  text: 'Healthy / Optimal'
                },
                {
                  id: 'st-degraded',
                  text: 'Degraded'
                },
                {
                  id: 'st-failed',
                  text: 'Failed'
                }
              ]
            },
            {
              id: 'recoveryAction',
              label: 'Recovery action',
              options: [
                {
                  id: 'ac-none',
                  text: 'No action needed — monitor'
                },
                {
                  id: 'ac-rebuild',
                  text: 'Hot-swap the failed drive(s) and rebuild the array'
                },
                {
                  id: 'ac-restore',
                  text: 'Array is unrecoverable — restore from backup'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            arrayStatus: 'st-healthy',
            recoveryAction: 'ac-none'
          }
        }
      }
    ]
  },
  {
    id: 'a1-raid-07',
    cert: 'aplus-core1',
    archetype: 'raid',
    objective: '3.4',
    topic: 'RAID 6 build — critical database server, dual-parity requirement',
    title: 'Critical DB server: dual-parity protection mandated',
    estMinutes: 6,
    scenario: 'A critical database server\'s storage policy mandates surviving two simultaneous drive failures. Four 2TB drives are provisioned for 4TB of usable, dual-parity-protected storage. Build the array, then two drives fail during a rebuild window.',
    raid: {
      targetUsableTb: 4,
      targetTolerance: 2,
      failedDriveCount: 2
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'bay1',
            label: 'Drive bay 1'
          },
          {
            id: 'bay2',
            label: 'Drive bay 2'
          },
          {
            id: 'bay3',
            label: 'Drive bay 3'
          },
          {
            id: 'bay4',
            label: 'Drive bay 4'
          }
        ],
        notes: ['Client: critical database server', 'Available: four 2TB drives', 'Must survive two simultaneous drive failures']
      }
    },
    steps: [
      {
        id: 'build',
        type: 'configure',
        points: 1,
        prompt: 'Build the array for 4TB usable storage that survives two simultaneous drive failures, from four 2TB drives.',
        explanation: 'Only RAID 6 offers two-drive fault tolerance among these levels, and its minimum four-drive configuration at 2TB each gives (4-2)×2TB = 4TB usable — no other level clears the two-drive tolerance requirement at all, so this is the minimal fit by definition.',
        payload: {
          slots: [
            {
              id: 'level',
              label: 'RAID level',
              options: [
                {
                  id: 'raid5',
                  text: 'RAID 5 (single parity)'
                },
                {
                  id: 'raid6',
                  text: 'RAID 6 (dual parity)'
                },
                {
                  id: 'raid10',
                  text: 'RAID 10 (mirrored stripe)'
                }
              ]
            },
            {
              id: 'driveCount',
              label: 'Drive count',
              options: [
                {
                  id: 'c3',
                  text: '3 drives'
                },
                {
                  id: 'c4',
                  text: '4 drives'
                }
              ]
            },
            {
              id: 'driveSize',
              label: 'Drive size',
              options: [
                {
                  id: 's2',
                  text: '2TB per drive'
                },
                {
                  id: 's4',
                  text: '4TB per drive'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            level: 'raid6',
            driveCount: 'c4',
            driveSize: 's2'
          }
        }
      },
      {
        id: 'degrade',
        type: 'configure',
        points: 1,
        prompt: 'Two drives failed during the rebuild window. What is the array status and next step?',
        explanation: 'Two failed drives sit exactly at RAID 6\'s dual-parity tolerance — the array keeps serving data reconstructed from both parity sets. Status is Degraded; hot-swap the failed drives and rebuild.',
        payload: {
          slots: [
            {
              id: 'arrayStatus',
              label: 'Array status',
              options: [
                {
                  id: 'st-healthy',
                  text: 'Healthy / Optimal'
                },
                {
                  id: 'st-degraded',
                  text: 'Degraded'
                },
                {
                  id: 'st-failed',
                  text: 'Failed'
                }
              ]
            },
            {
              id: 'recoveryAction',
              label: 'Recovery action',
              options: [
                {
                  id: 'ac-none',
                  text: 'No action needed — monitor'
                },
                {
                  id: 'ac-rebuild',
                  text: 'Hot-swap the failed drive(s) and rebuild the array'
                },
                {
                  id: 'ac-restore',
                  text: 'Array is unrecoverable — restore from backup'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            arrayStatus: 'st-degraded',
            recoveryAction: 'ac-rebuild'
          }
        }
      }
    ]
  },
  {
    id: 'a1-raid-08',
    cert: 'aplus-core1',
    archetype: 'raid',
    objective: '3.4',
    topic: 'RAID 6 build — video surveillance NVR array, triple failure exceeds tolerance',
    title: 'Surveillance NVR array: three drives fail, tolerance exceeded',
    estMinutes: 6,
    scenario: 'A video surveillance NVR needs 8TB of usable, dual-parity-protected storage recording continuously. Four 4TB drives are installed. Build the array, then a firmware bug takes three drives offline at once.',
    raid: {
      targetUsableTb: 8,
      targetTolerance: 2,
      failedDriveCount: 3
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'bay1',
            label: 'Drive bay 1'
          },
          {
            id: 'bay2',
            label: 'Drive bay 2'
          },
          {
            id: 'bay3',
            label: 'Drive bay 3'
          },
          {
            id: 'bay4',
            label: 'Drive bay 4'
          }
        ],
        notes: ['Client: video surveillance NVR array', 'Available: four 4TB drives', 'Must survive two simultaneous drive failures']
      }
    },
    steps: [
      {
        id: 'build',
        type: 'configure',
        points: 1,
        prompt: 'Build the array for 8TB usable storage that survives two simultaneous drive failures, from four 4TB drives.',
        explanation: 'RAID 6 at its minimum four-drive count gives (4-2)×4TB = 8TB usable with dual-parity protection — RAID 6 is the only level here that meets the two-drive tolerance requirement, so four drives is the minimal fit.',
        payload: {
          slots: [
            {
              id: 'level',
              label: 'RAID level',
              options: [
                {
                  id: 'raid5',
                  text: 'RAID 5 (single parity)'
                },
                {
                  id: 'raid6',
                  text: 'RAID 6 (dual parity)'
                },
                {
                  id: 'raid10',
                  text: 'RAID 10 (mirrored stripe)'
                }
              ]
            },
            {
              id: 'driveCount',
              label: 'Drive count',
              options: [
                {
                  id: 'c4',
                  text: '4 drives'
                },
                {
                  id: 'c5',
                  text: '5 drives'
                }
              ]
            },
            {
              id: 'driveSize',
              label: 'Drive size',
              options: [
                {
                  id: 's2',
                  text: '2TB per drive'
                },
                {
                  id: 's4',
                  text: '4TB per drive'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            level: 'raid6',
            driveCount: 'c4',
            driveSize: 's4'
          }
        }
      },
      {
        id: 'degrade',
        type: 'configure',
        points: 1,
        prompt: 'A firmware bug knocked three drives offline simultaneously. What is the array status and next step?',
        explanation: 'RAID 6 tolerates at most two simultaneous failures — a third failure exceeds that and the array cannot reconstruct the missing data. Restore the recorded footage from backup rather than attempting a rebuild.',
        payload: {
          slots: [
            {
              id: 'arrayStatus',
              label: 'Array status',
              options: [
                {
                  id: 'st-healthy',
                  text: 'Healthy / Optimal'
                },
                {
                  id: 'st-degraded',
                  text: 'Degraded'
                },
                {
                  id: 'st-failed',
                  text: 'Failed'
                }
              ]
            },
            {
              id: 'recoveryAction',
              label: 'Recovery action',
              options: [
                {
                  id: 'ac-none',
                  text: 'No action needed — monitor'
                },
                {
                  id: 'ac-rebuild',
                  text: 'Hot-swap the failed drive(s) and rebuild the array'
                },
                {
                  id: 'ac-restore',
                  text: 'Array is unrecoverable — restore from backup'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            arrayStatus: 'st-failed',
            recoveryAction: 'ac-restore'
          }
        }
      }
    ]
  },
  {
    id: 'a1-raid-12',
    cert: 'aplus-core1',
    archetype: 'raid',
    objective: '3.4',
    topic: 'RAID 10 build — database server, mirrored-stripe performance requirement',
    title: 'Database server: mirrored stripes for random-I/O performance',
    estMinutes: 6,
    scenario: 'A transactional database server needs 8TB of usable, redundant storage with the fast random read/write performance only a mirrored-stripe layout delivers — a straight parity array would bottleneck under the write load. Four 4TB drives are provisioned. Build the array, then one drive fails during peak business hours.',
    raid: {
      targetUsableTb: 8,
      targetTolerance: 1,
      failedDriveCount: 1
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'bay1',
            label: 'Drive bay 1'
          },
          {
            id: 'bay2',
            label: 'Drive bay 2'
          },
          {
            id: 'bay3',
            label: 'Drive bay 3'
          },
          {
            id: 'bay4',
            label: 'Drive bay 4'
          }
        ],
        notes: ['Client: transactional database server', 'Available: four 4TB drives', 'Needs high random I/O performance and one-drive fault tolerance']
      }
    },
    steps: [
      {
        id: 'build',
        type: 'configure',
        points: 1,
        prompt: 'Build the array for 8TB usable storage with mirrored-stripe performance and single-drive fault tolerance, from four 4TB drives.',
        explanation: 'RAID 10 mirrors pairs of drives then stripes across the pairs: four 4TB drives give floor(4/2)×4TB = 8TB usable while tolerating one drive failure — the minimum four-drive RAID 10 configuration (its floor) already clears both targets, so no larger count is minimal.',
        payload: {
          slots: [
            {
              id: 'level',
              label: 'RAID level',
              options: [
                {
                  id: 'raid1',
                  text: 'RAID 1 (mirroring)'
                },
                {
                  id: 'raid5',
                  text: 'RAID 5 (single parity)'
                },
                {
                  id: 'raid10',
                  text: 'RAID 10 (mirrored stripe)'
                }
              ]
            },
            {
              id: 'driveCount',
              label: 'Drive count',
              options: [
                {
                  id: 'c4',
                  text: '4 drives'
                },
                {
                  id: 'c6',
                  text: '6 drives'
                }
              ]
            },
            {
              id: 'driveSize',
              label: 'Drive size',
              options: [
                {
                  id: 's2',
                  text: '2TB per drive'
                },
                {
                  id: 's4',
                  text: '4TB per drive'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            level: 'raid10',
            driveCount: 'c4',
            driveSize: 's4'
          }
        }
      },
      {
        id: 'degrade',
        type: 'configure',
        points: 1,
        prompt: 'One of the four drives failed during peak business hours. What is the array status and next step?',
        explanation: 'RAID 10 tolerates one failed drive as long as its mirror partner is intact — the array keeps serving reads and writes from the surviving half of that pair. Status is Degraded; hot-swap the failed drive and let the mirror rebuild.',
        payload: {
          slots: [
            {
              id: 'arrayStatus',
              label: 'Array status',
              options: [
                {
                  id: 'st-healthy',
                  text: 'Healthy / Optimal'
                },
                {
                  id: 'st-degraded',
                  text: 'Degraded'
                },
                {
                  id: 'st-failed',
                  text: 'Failed'
                }
              ]
            },
            {
              id: 'recoveryAction',
              label: 'Recovery action',
              options: [
                {
                  id: 'ac-none',
                  text: 'No action needed — monitor'
                },
                {
                  id: 'ac-rebuild',
                  text: 'Hot-swap the failed drive(s) and rebuild the array'
                },
                {
                  id: 'ac-restore',
                  text: 'Array is unrecoverable — restore from backup'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            arrayStatus: 'st-degraded',
            recoveryAction: 'ac-rebuild'
          }
        }
      }
    ]
  },
  {
    id: 'a1-raid-13',
    cert: 'aplus-core1',
    archetype: 'raid',
    objective: '3.4',
    topic: 'RAID 10 build — virtualization host, both members of a mirrored pair fail',
    title: 'Virtualization host: a mirrored pair fails together, tolerance exceeded',
    estMinutes: 6,
    scenario: 'A virtualization host runs a dozen VMs off a mirrored-stripe datastore needing 12TB of usable, high-performance storage. Six 4TB drives are provisioned. Build the array, then a backplane fault takes out both drives in the same mirrored pair simultaneously.',
    raid: {
      targetUsableTb: 12,
      targetTolerance: 1,
      failedDriveCount: 2
    },
    assets: {
      reference: {
        kind: 'slots',
        bays: [
          {
            id: 'bay1',
            label: 'Drive bay 1'
          },
          {
            id: 'bay2',
            label: 'Drive bay 2'
          },
          {
            id: 'bay3',
            label: 'Drive bay 3'
          },
          {
            id: 'bay4',
            label: 'Drive bay 4'
          },
          {
            id: 'bay5',
            label: 'Drive bay 5'
          },
          {
            id: 'bay6',
            label: 'Drive bay 6'
          }
        ],
        notes: ['Client: virtualization host datastore', 'Available: six 4TB drives', 'Needs high random I/O performance and one-drive fault tolerance']
      }
    },
    steps: [
      {
        id: 'build',
        type: 'configure',
        points: 1,
        prompt: 'Build the array for 12TB usable storage with mirrored-stripe performance from six 4TB drives.',
        explanation: 'RAID 10 across six 4TB drives gives floor(6/2)×4TB = 12TB usable — four drives alone would only reach floor(4/2)×4TB = 8TB, short of the 12TB target, so six is the minimal fit.',
        payload: {
          slots: [
            {
              id: 'level',
              label: 'RAID level',
              options: [
                {
                  id: 'raid5',
                  text: 'RAID 5 (single parity)'
                },
                {
                  id: 'raid6',
                  text: 'RAID 6 (dual parity)'
                },
                {
                  id: 'raid10',
                  text: 'RAID 10 (mirrored stripe)'
                }
              ]
            },
            {
              id: 'driveCount',
              label: 'Drive count',
              options: [
                {
                  id: 'c4',
                  text: '4 drives'
                },
                {
                  id: 'c6',
                  text: '6 drives'
                }
              ]
            },
            {
              id: 'driveSize',
              label: 'Drive size',
              options: [
                {
                  id: 's2',
                  text: '2TB per drive'
                },
                {
                  id: 's4',
                  text: '4TB per drive'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            level: 'raid10',
            driveCount: 'c6',
            driveSize: 's4'
          }
        }
      },
      {
        id: 'degrade',
        type: 'configure',
        points: 1,
        prompt: 'A backplane fault knocked out both drives in the same mirrored pair at once. What is the array status and next step?',
        explanation: 'RAID 10 only tolerates losing a drive if its mirror partner survives — losing both members of one pair simultaneously destroys that stripe segment and takes the whole array down. Restore the datastore from backup rather than attempting an in-place rebuild.',
        payload: {
          slots: [
            {
              id: 'arrayStatus',
              label: 'Array status',
              options: [
                {
                  id: 'st-healthy',
                  text: 'Healthy / Optimal'
                },
                {
                  id: 'st-degraded',
                  text: 'Degraded'
                },
                {
                  id: 'st-failed',
                  text: 'Failed'
                }
              ]
            },
            {
              id: 'recoveryAction',
              label: 'Recovery action',
              options: [
                {
                  id: 'ac-none',
                  text: 'No action needed — monitor'
                },
                {
                  id: 'ac-rebuild',
                  text: 'Hot-swap the failed drive(s) and rebuild the array'
                },
                {
                  id: 'ac-restore',
                  text: 'Array is unrecoverable — restore from backup'
                }
              ]
            }
          ]
        },
        answer: {
          slots: {
            arrayStatus: 'st-failed',
            recoveryAction: 'ac-restore'
          }
        }
      }
    ]
  },

  // ========================================================================
  // ===== Wave 4 — Laser Print Defect Clinic (swatch archetype) ============
  // ===== Objective 5.6 (troubleshoot printer issues; 220-1201 V2.0 —  =====
  // ===== NOT 3.7, which is printer maintenance). Remedy options are   =====
  // ===== informed by 3.7's laser maintenance list (replace toner,     =====
  // ===== maintenance kit, calibrate, clean).                          =====
  // ========================================================================
  {
    id: 'a1-swatch-01',
    cert: 'aplus-core1',
    archetype: 'swatch',
    objective: '5.6',
    topic: 'Repeating marks — drum-circumference interval diagnosis',
    title: 'The front-desk LaserJet is stamping marks on every page',
    estMinutes: 5,
    scenario: 'Reception\'s shared printer started putting dark marks on everything this morning. A fresh ream of paper changed nothing. You pull the last page printed and put it under the light. Read the page, name what failed, and close the ticket the right way.',
    swatch: { damageKind: 'permanent' },
    assets: {
      reference: {
        kind: 'swatch',
        title: 'Sample output · front-desk LaserJet',
        defect: 'spots',
        caption: 'Last page printed · marks land at the same spot across pages',
        notes: ['Model: mono laser, ~40k pages', 'Fresh paper: no change', 'Every page affected']
      }
    },
    steps: [
      { id: 'diagnose', type: 'configure', points: 1,
        prompt: 'Name the defect pattern, then the component that produces it.',
        explanation: 'Distinct dark marks at a fixed interval and the same horizontal position are a repeating defect. ~76 mm is a common drum circumference: a nick or stuck debris on the drum stamps the page once per rotation.',
        payload: { slots: [
          { id: 'defectPattern', label: 'Defect pattern', options: [
            { id: 'p-ghost', text: 'Ghosting · a faint copy of an earlier image repeats' },
            { id: 'p-spots', text: 'Repeating marks · same spot at a fixed interval' },
            { id: 'p-streak', text: 'Vertical white streak · a clean band missing toner' },
            { id: 'p-smear', text: 'Loose toner · print smears at a touch' } ] },
          { id: 'failedComponent', label: 'Failed component', options: [
            { id: 'c-fuser', text: 'Fuser assembly · toner is not bonding to the page' },
            { id: 'c-drum', text: 'Imaging drum · damage or debris on its surface prints every rotation' },
            { id: 'c-pickup', text: 'Pickup roller feeding pages crooked' },
            { id: 'c-toner', text: 'Toner cartridge empty or clogged · faded or missing print' } ] } ] },
        answer: { slots: { defectPattern: 'p-spots', failedComponent: 'c-drum' } } },
      { id: 'fix', type: 'configure', points: 1,
        prompt: 'You pull the drum unit and find a deep scratch across its surface. Close out the ticket.',
        explanation: 'Cleaning handles debris, but a scratch is permanent: the coating is gone, and it stamps every rotation until the drum unit is replaced. Verify with a test page before closing.',
        payload: { slots: [
          { id: 'remedy', label: 'Remedy', options: [
            { id: 'r-clean', text: 'Clean the drum surface and reinstall it' },
            { id: 'r-replace', text: 'Replace the drum unit · a scratched drum cannot be repaired' },
            { id: 'r-fuser', text: 'Install a fuser maintenance kit' } ] },
          { id: 'verify', label: 'Before closing the ticket', options: [
            { id: 'v-none', text: 'Nothing further · the new drum resolves it by definition' },
            { id: 'v-test', text: 'Print a test page and check the marks are gone' },
            { id: 'v-cal', text: 'Recalibrate the printer\'s colour tables' } ] } ] },
        answer: { slots: { remedy: 'r-replace', verify: 'v-test' } } }
    ]
  },
  {
    id: 'a1-swatch-02',
    cert: 'aplus-core1',
    archetype: 'swatch',
    objective: '5.6',
    topic: 'Repeating marks — new drum, marks persist (fuser roller interval)',
    title: 'New drum, same marks — the accounts printer will not come clean',
    estMinutes: 4,
    scenario: 'The accounts-office laser printer had repeating marks last week, so the on-site tech swapped the drum unit. Today the same glossy mark is back, once per rotation, in the same lane down the page. The drum is brand new and its packaging seal was intact. Read the page and name what is really stamping it.',
    swatch: { damageKind: 'none' },
    assets: {
      reference: {
        kind: 'swatch',
        title: 'Sample output · accounts LaserJet',
        defect: 'spots',
        caption: 'Repeating glossy mark · same interval and lane on every page',
        notes: ['Drum unit replaced yesterday · seal intact', 'Marks unchanged after the swap', 'Mark looks pressed-in and shiny']
      }
    },
    steps: [
      { id: 'diagnose', type: 'configure', points: 1,
        prompt: 'The drum is new and the marks are unchanged. Name the defect pattern, then the component that matches the evidence.',
        explanation: 'A repeating mark at a fixed interval is a rotating-part defect, but the interval alone does not name the part: several rollers share circumferences near ~76 mm. A brand-new drum with unchanged marks rules the drum out, and a pressed-in, glossy mark points to the heat-and-pressure stage — a flaw on the fuser roller stamps the page once per rotation.',
        payload: { slots: [
          { id: 'defectPattern', label: 'Defect pattern', options: [
            { id: 'p-streak', text: 'Vertical white streak · a clean band missing toner' },
            { id: 'p-spots', text: 'Repeating marks · same spot at a fixed interval' },
            { id: 'p-skew', text: 'Crooked print · the whole page is rotated off square' } ] },
          { id: 'failedComponent', label: 'Failed component', options: [
            { id: 'c-drum', text: 'Imaging drum · damage or debris on its surface prints every rotation' },
            { id: 'c-fuserroller', text: 'Fuser roller · a surface flaw stamps a glossy mark once per rotation' },
            { id: 'c-blade', text: 'Cleaning blade worn · residual toner echoes an earlier image' },
            { id: 'c-seppad', text: 'Separation pad worn · pages feed crooked or two at a time' } ] } ] },
        answer: { slots: { defectPattern: 'p-spots', failedComponent: 'c-fuserroller' } } }
    ]
  },
  {
    id: 'a1-swatch-03',
    cert: 'aplus-core1',
    archetype: 'swatch',
    objective: '5.6',
    topic: 'Vertical white streak — blocked toner path, clean-class remedy',
    title: 'A white stripe is running down every page in the mailroom',
    estMinutes: 5,
    scenario: 'The mailroom\'s mono laser started leaving a clean vertical band down every page this afternoon — same width, same place, top to bottom. The rest of the print is dense and sharp. The toner gauge reads over half full. Read the page, name what failed, and close the ticket the right way.',
    swatch: { damageKind: 'debris' },
    assets: {
      reference: {
        kind: 'swatch',
        title: 'Sample output · mailroom LaserJet',
        defect: 'streak',
        caption: 'Full-height white band · identical position on every page',
        notes: ['Toner gauge: ~60% remaining', 'Rest of the page prints dense and sharp', 'Started mid-shift, no supplies changed']
      }
    },
    steps: [
      { id: 'diagnose', type: 'configure', points: 1,
        prompt: 'Name the defect pattern, then the component that produces it.',
        explanation: 'A clean, full-height white band means no toner is reaching the page along that lane — the toner is not faded there, it is absent. With plenty of toner in the cartridge, the classic cause is a blocked toner path: clumped or foreign debris obstructing the developer opening so no toner flows in that lane.',
        payload: { slots: [
          { id: 'defectPattern', label: 'Defect pattern', options: [
            { id: 'p-spots', text: 'Repeating marks · same spot at a fixed interval' },
            { id: 'p-streak', text: 'Vertical white streak · a clean band missing toner' },
            { id: 'p-smear', text: 'Loose toner · print smears at a touch' },
            { id: 'p-ghost', text: 'Ghosting · a faint copy of an earlier image repeats' } ] },
          { id: 'failedComponent', label: 'Failed component', options: [
            { id: 'c-tonerpath', text: 'Blocked toner path · debris blocks the developer opening in one lane' },
            { id: 'c-fuser', text: 'Fuser assembly · toner is not bonding to the page' },
            { id: 'c-tonerempty', text: 'Toner cartridge empty · the whole page prints faded' },
            { id: 'c-pickup', text: 'Pickup roller worn · pages feed crooked or not at all' } ] } ] },
        answer: { slots: { defectPattern: 'p-streak', failedComponent: 'c-tonerpath' } } },
      { id: 'fix', type: 'configure', points: 1,
        prompt: 'You pull the cartridge and find clumped toner packed against the developer opening. Close out the ticket.',
        explanation: 'Debris is not permanent damage: clearing and cleaning the blocked toner path restores flow across the full page width, and the cartridge still has most of its life left. Replacing it would work but wastes a half-full consumable. Verify with a test page before closing.',
        payload: { slots: [
          { id: 'remedy', label: 'Remedy', options: [
            { id: 'r-clean', text: 'Clean the toner path · clear the clumped toner from the developer opening' },
            { id: 'r-replace', text: 'Replace the toner cartridge with a new one' },
            { id: 'r-drum', text: 'Replace the drum unit' } ] },
          { id: 'verify', label: 'Before closing the ticket', options: [
            { id: 'v-none', text: 'Nothing further · clearing the blockage resolves it by definition' },
            { id: 'v-test', text: 'Print a test page and check the band is gone' },
            { id: 'v-reboot', text: 'Power-cycle the printer twice' } ] } ] },
        answer: { slots: { remedy: 'r-clean', verify: 'v-test' } } }
    ]
  },
  {
    id: 'a1-swatch-04',
    cert: 'aplus-core1',
    archetype: 'swatch',
    objective: '5.6',
    topic: 'Vertical white streak — scratched drum coating diagnosis',
    title: 'The legal team\'s printer draws a blank line through every contract',
    estMinutes: 4,
    scenario: 'Legal\'s mono laser is leaving a narrow white line down every page. A tech already reseated the toner cartridge and ran the printer\'s cleaning cycle — no change. The line is dead straight, always in the same lane, and has been slowly getting wider over two weeks. Read the page and name what failed.',
    swatch: { damageKind: 'none' },
    assets: {
      reference: {
        kind: 'swatch',
        title: 'Sample output · legal-team LaserJet',
        defect: 'streak',
        caption: 'Narrow white line · same lane every page, widening over weeks',
        notes: ['Cartridge reseated: no change', 'Cleaning cycle run: no change', 'Line has widened gradually over 2 weeks']
      }
    },
    steps: [
      { id: 'diagnose', type: 'configure', points: 1,
        prompt: 'Cleaning and reseating changed nothing. Name the defect pattern, then the component the evidence points to.',
        explanation: 'A white streak that survives a cleaning cycle and a cartridge reseat is not loose debris — something in the image path can no longer hold toner along that lane. A scratched drum fits every clue: a groove worn through the drum\'s coating stops toner transferring along that exact band, it stays perfectly straight because the drum spins in place, and it widens slowly as the coating wears further.',
        payload: { slots: [
          { id: 'defectPattern', label: 'Defect pattern', options: [
            { id: 'p-streak', text: 'Vertical white streak · a clean band missing toner' },
            { id: 'p-ghost', text: 'Ghosting · a faint copy of an earlier image repeats' },
            { id: 'p-spots', text: 'Repeating marks · same spot at a fixed interval' } ] },
          { id: 'failedComponent', label: 'Failed component', options: [
            { id: 'c-scratcheddrum', text: 'Scratched drum · a groove in the coating stops toner along that band' },
            { id: 'c-eraselamp', text: 'Erase lamp failing · earlier images faintly reappear' },
            { id: 'c-paperpath', text: 'Paper path misaligned · pages travel crooked' },
            { id: 'c-tonerlow', text: 'Toner cartridge nearly empty · the whole page fades evenly' } ] } ] },
        answer: { slots: { defectPattern: 'p-streak', failedComponent: 'c-scratcheddrum' } } }
    ]
  },
  {
    id: 'a1-swatch-05',
    cert: 'aplus-core1',
    archetype: 'swatch',
    objective: '5.6',
    topic: 'Smearing toner — fuser heat lamp failure, maintenance-kit remedy',
    title: 'Every page out of the warehouse printer smudges at a touch',
    estMinutes: 5,
    scenario: 'The warehouse office\'s mono laser prints pages that look right at a glance — until anyone touches them. The toner wipes off with a thumb and smears down the page in the output tray. Pages are coming out cooler than usual. Read the page, name what failed, and close the ticket the right way.',
    swatch: { damageKind: 'permanent' },
    assets: {
      reference: {
        kind: 'swatch',
        title: 'Sample output · warehouse LaserJet',
        defect: 'smear',
        caption: 'Toner wipes off at a touch · smears downward in the tray',
        notes: ['Pages exit cooler than normal', 'Every page affected, all trays', 'Toner level: fine']
      }
    },
    steps: [
      { id: 'diagnose', type: 'configure', points: 1,
        prompt: 'Name the defect pattern, then the component that produces it.',
        explanation: 'Toner that wipes off was never bonded to the paper. The fuser\'s job is exactly that bond: its heated roller melts the toner into the fibres under pressure. Cool pages plus unfused toner point straight at the fuser assembly — its heat lamp is no longer bringing the roller up to temperature.',
        payload: { slots: [
          { id: 'defectPattern', label: 'Defect pattern', options: [
            { id: 'p-spots', text: 'Repeating marks · same spot at a fixed interval' },
            { id: 'p-smear', text: 'Loose toner · print smears at a touch' },
            { id: 'p-ghost', text: 'Ghosting · a faint copy of an earlier image repeats' },
            { id: 'p-streak', text: 'Vertical white streak · a clean band missing toner' } ] },
          { id: 'failedComponent', label: 'Failed component', options: [
            { id: 'c-fuser', text: 'Fuser assembly · heat lamp no longer bonds toner to the page' },
            { id: 'c-drum', text: 'Imaging drum · damage on its surface prints every rotation' },
            { id: 'c-tonerpath', text: 'Blocked toner path · no toner reaches one lane of the page' },
            { id: 'c-pickup', text: 'Pickup roller worn · pages feed crooked or not at all' } ] } ] },
        answer: { slots: { defectPattern: 'p-smear', failedComponent: 'c-fuser' } } },
      { id: 'fix', type: 'configure', points: 1,
        prompt: 'You confirm the fuser roller never reaches operating temperature — the heat lamp has burned out. Close out the ticket.',
        explanation: 'A burned-out heat lamp is not cleanable or adjustable: the fuser has failed and the fix is the printer\'s fuser maintenance kit, which replaces the fuser assembly (and usually the pickup/transfer rollers rated for the same service life). Verify with a test page — the print should come out warm and rub-fast.',
        payload: { slots: [
          { id: 'remedy', label: 'Remedy', options: [
            { id: 'r-kit', text: 'Replace the fuser · install the printer\'s fuser maintenance kit' },
            { id: 'r-clean', text: 'Clean the fuser roller and run a calibration cycle' },
            { id: 'r-toner', text: 'Replace the toner cartridge with a fresh one' } ] },
          { id: 'verify', label: 'Before closing the ticket', options: [
            { id: 'v-none', text: 'Nothing further · a new fuser resolves it by definition' },
            { id: 'v-test', text: 'Print a test page and check the toner is fused and rub-fast' },
            { id: 'v-drivers', text: 'Reinstall the printer driver on every workstation' } ] } ] },
        answer: { slots: { remedy: 'r-kit', verify: 'v-test' } } }
    ]
  },
  {
    id: 'a1-swatch-06',
    cert: 'aplus-core1',
    archetype: 'swatch',
    objective: '5.6',
    topic: 'Smearing toner — unfused output diagnosis',
    title: 'The clinic\'s discharge summaries are smudging in patients\' hands',
    estMinutes: 4,
    scenario: 'Front desk at the clinic reports that printed discharge summaries are smudging before patients reach the car park. The print looks complete and dense, but drags a grey wash down the page wherever a thumb lands. It started suddenly this morning on every page. Read the page and name what failed.',
    swatch: { damageKind: 'none' },
    assets: {
      reference: {
        kind: 'swatch',
        title: 'Sample output · clinic LaserJet',
        defect: 'smear',
        caption: 'Print drags into a grey wash wherever it is touched',
        notes: ['Started suddenly this morning', 'Print density otherwise normal', 'Same result from every tray and driver']
      }
    },
    steps: [
      { id: 'diagnose', type: 'configure', points: 1,
        prompt: 'Name the defect pattern, then the component that produces it.',
        explanation: 'Dense, complete print that smears at a touch means the image was formed and transferred correctly — it was never fixed to the paper. Fixing is the fuser\'s job: heat and pressure melt the toner in. When output smears on every page from every tray, the fuser assembly has stopped doing that.',
        payload: { slots: [
          { id: 'defectPattern', label: 'Defect pattern', options: [
            { id: 'p-smear', text: 'Loose toner · print smears at a touch' },
            { id: 'p-streak', text: 'Vertical white streak · a clean band missing toner' },
            { id: 'p-skew', text: 'Crooked print · the whole page is rotated off square' } ] },
          { id: 'failedComponent', label: 'Failed component', options: [
            { id: 'c-blade', text: 'Cleaning blade worn · residual toner echoes an earlier image' },
            { id: 'c-fuser', text: 'Fuser assembly · toner is not being bonded to the page' },
            { id: 'c-seppad', text: 'Separation pad worn · pages feed crooked or two at a time' },
            { id: 'c-toner', text: 'Toner cartridge low · the whole page prints faded' } ] } ] },
        answer: { slots: { defectPattern: 'p-smear', failedComponent: 'c-fuser' } } }
    ]
  },
  {
    id: 'a1-swatch-07',
    cert: 'aplus-core1',
    archetype: 'swatch',
    objective: '5.6',
    topic: 'Ghosting — worn cleaning blade, replace-class remedy',
    title: 'Yesterday\'s logo is haunting today\'s letterhead',
    estMinutes: 5,
    scenario: 'Marketing\'s mono laser is reprinting a faint copy of the company logo further down every page — even on documents that don\'t contain the logo at all. The echo sits a fixed distance below wherever dense art printed on an earlier page. Read the page, name what failed, and close the ticket the right way.',
    swatch: { damageKind: 'permanent' },
    assets: {
      reference: {
        kind: 'swatch',
        title: 'Sample output · marketing LaserJet',
        defect: 'ghost',
        caption: 'Faint echo of earlier dense art repeats down the page',
        notes: ['Echo appears even on pages without the logo', 'Offset matches one drum rotation', 'Worsening over the past week']
      }
    },
    steps: [
      { id: 'diagnose', type: 'configure', points: 1,
        prompt: 'Name the defect pattern, then the component that produces it.',
        explanation: 'A faint repeat of an earlier image one rotation later is ghosting: toner from the previous image was never scraped off the drum, so it prints again. The component whose whole job is that scrape is the cleaning blade — worn or nicked, it lets residual toner ride the drum around into the next page.',
        payload: { slots: [
          { id: 'defectPattern', label: 'Defect pattern', options: [
            { id: 'p-ghost', text: 'Ghosting · a faint copy of an earlier image repeats' },
            { id: 'p-spots', text: 'Repeating marks · same spot at a fixed interval' },
            { id: 'p-smear', text: 'Loose toner · print smears at a touch' } ] },
          { id: 'failedComponent', label: 'Failed component', options: [
            { id: 'c-blade', text: 'Cleaning blade worn · residual toner stays on the drum and reprints' },
            { id: 'c-fuser', text: 'Fuser assembly · toner is not bonding to the page' },
            { id: 'c-pickup', text: 'Pickup roller worn · pages feed crooked or not at all' },
            { id: 'c-tonerpath', text: 'Blocked toner path · no toner reaches one lane of the page' } ] } ] },
        answer: { slots: { defectPattern: 'p-ghost', failedComponent: 'c-blade' } } },
      { id: 'fix', type: 'configure', points: 1,
        prompt: 'You inspect the drum unit: the cleaning blade\'s edge is visibly worn and nicked. On this printer the blade is built into the drum unit. Close out the ticket.',
        explanation: 'A worn blade edge is permanent wear, not debris — and on cartridges that integrate the blade into the drum unit, the serviceable part IS the drum unit. Replacing it installs a fresh blade (and drum) in one step. Verify with a page of dense art followed by a blank-ish page: the echo should be gone.',
        payload: { slots: [
          { id: 'remedy', label: 'Remedy', options: [
            { id: 'r-replace', text: 'Replace the drum unit · a fresh unit includes a new cleaning blade' },
            { id: 'r-wipe', text: 'Clean the blade edge with a lint-free wipe and reinstall it' },
            { id: 'r-kit', text: 'Install a fuser maintenance kit' } ] },
          { id: 'verify', label: 'Before closing the ticket', options: [
            { id: 'v-none', text: 'Nothing further · the new unit resolves it by definition' },
            { id: 'v-test', text: 'Print dense art then a light page and check no echo repeats' },
            { id: 'v-queue', text: 'Clear the print queue on the server' } ] } ] },
        answer: { slots: { remedy: 'r-replace', verify: 'v-test' } } }
    ]
  },
  {
    id: 'a1-swatch-08',
    cert: 'aplus-core1',
    archetype: 'swatch',
    objective: '5.6',
    topic: 'Ghosting — erase lamp failure diagnosis',
    title: 'The night-shift reports every page carries a shadow of the last job',
    estMinutes: 4,
    scenario: 'The operations printer is stamping a dim shadow of the previous job onto every new page. The tech on the last shift already swapped the drum unit — including its cleaning blade — and the shadow came straight back. The charge across the drum never seems to fully reset between pages. Read the page and name what failed.',
    swatch: { damageKind: 'none' },
    assets: {
      reference: {
        kind: 'swatch',
        title: 'Sample output · operations LaserJet',
        defect: 'ghost',
        caption: 'Dim shadow of the previous job on every new page',
        notes: ['Drum unit (incl. blade) replaced: no change', 'Shadow tracks the previous job, not this one', 'Consistent from the first page after power-on']
      }
    },
    steps: [
      { id: 'diagnose', type: 'configure', points: 1,
        prompt: 'The drum and its blade are new, and the shadow persists. Name the defect pattern, then the component the evidence points to.',
        explanation: 'Ghosting has two classic causes: residue the blade failed to scrape, or a latent charge image the erase lamp failed to clear. With a brand-new drum unit and blade, residue is ruled out — the erase lamp, which floods the drum with light to neutralise the previous page\'s charge pattern, is the component left. When it fails, the old electrostatic image survives into the next print.',
        payload: { slots: [
          { id: 'defectPattern', label: 'Defect pattern', options: [
            { id: 'p-ghost', text: 'Ghosting · a faint copy of an earlier image repeats' },
            { id: 'p-streak', text: 'Vertical white streak · a clean band missing toner' },
            { id: 'p-spots', text: 'Repeating marks · same spot at a fixed interval' } ] },
          { id: 'failedComponent', label: 'Failed component', options: [
            { id: 'c-eraselamp', text: 'Erase lamp failed · the previous page\'s charge image is never cleared' },
            { id: 'c-fuser', text: 'Fuser assembly · toner is not bonding to the page' },
            { id: 'c-paperpath', text: 'Paper path misaligned · pages travel crooked' },
            { id: 'c-toner', text: 'Toner cartridge low · the whole page prints faded' } ] } ] },
        answer: { slots: { defectPattern: 'p-ghost', failedComponent: 'c-eraselamp' } } }
    ]
  },
  {
    id: 'a1-swatch-09',
    cert: 'aplus-core1',
    archetype: 'swatch',
    objective: '5.6',
    topic: 'Crooked print — glazed pickup roller, clean-class remedy',
    title: 'The loading-dock printer is feeding every page crooked',
    estMinutes: 5,
    scenario: 'The loading dock\'s laser printer sits in the dustiest corner of the building, and this week every page comes out printed at an angle — the text is sharp, but the whole block is rotated a few degrees. Jams are becoming more frequent too. Read the page, name what failed, and close the ticket the right way.',
    swatch: { damageKind: 'debris' },
    assets: {
      reference: {
        kind: 'swatch',
        title: 'Sample output · loading-dock LaserJet',
        defect: 'skew',
        caption: 'Whole print block rotated off square · text itself is sharp',
        notes: ['Dusty environment · high page volume', 'Occasional feed jams alongside the skew', 'Print quality otherwise normal']
      }
    },
    steps: [
      { id: 'diagnose', type: 'configure', points: 1,
        prompt: 'Name the defect pattern, then the component that produces it.',
        explanation: 'Sharp print rotated off square is not an imaging problem — the image was drawn correctly onto a page that was travelling crooked. The pickup roller sets the page\'s entry angle: when paper dust glazes its surface, one side grips while the other slips, and every page feeds in at a slight rotation.',
        payload: { slots: [
          { id: 'defectPattern', label: 'Defect pattern', options: [
            { id: 'p-skew', text: 'Crooked print · the whole page is rotated off square' },
            { id: 'p-streak', text: 'Vertical white streak · a clean band missing toner' },
            { id: 'p-spots', text: 'Repeating marks · same spot at a fixed interval' },
            { id: 'p-ghost', text: 'Ghosting · a faint copy of an earlier image repeats' } ] },
          { id: 'failedComponent', label: 'Failed component', options: [
            { id: 'c-pickup', text: 'Pickup roller glazed with paper dust · grips unevenly and feeds crooked' },
            { id: 'c-drum', text: 'Imaging drum · damage on its surface prints every rotation' },
            { id: 'c-fuser', text: 'Fuser assembly · toner is not bonding to the page' },
            { id: 'c-toner', text: 'Toner cartridge low · the whole page prints faded' } ] } ] },
        answer: { slots: { defectPattern: 'p-skew', failedComponent: 'c-pickup' } } },
      { id: 'fix', type: 'configure', points: 1,
        prompt: 'You pull the pickup roller: its surface is glazed with packed paper dust, but the rubber is intact with no flat spots. Close out the ticket.',
        explanation: 'Glaze is debris, not wear: the rubber underneath is sound, so wiping the roller clean with a lint-free cloth restores even grip. Replacement is the answer only when the rubber itself is worn smooth or cracked. Verify by printing and checking the page squares up.',
        payload: { slots: [
          { id: 'remedy', label: 'Remedy', options: [
            { id: 'r-wipe', text: 'Clean the pickup roller with a lint-free cloth to cut the glaze' },
            { id: 'r-replace', text: 'Replace the pickup roller with a new one' },
            { id: 'r-tray', text: 'Swap the paper tray for one from another printer' } ] },
          { id: 'verify', label: 'Before closing the ticket', options: [
            { id: 'v-none', text: 'Nothing further · a cleaned roller resolves it by definition' },
            { id: 'v-test', text: 'Print a test page and check the print sits square on the page' },
            { id: 'v-cal', text: 'Run a full colour calibration' } ] } ] },
        answer: { slots: { remedy: 'r-wipe', verify: 'v-test' } } }
    ]
  },
  {
    id: 'a1-swatch-10',
    cert: 'aplus-core1',
    archetype: 'swatch',
    objective: '5.6',
    topic: 'Crooked print — worn separation pad diagnosis',
    title: 'HR\'s printer pulls two pages and prints them both crooked',
    estMinutes: 4,
    scenario: 'HR\'s desktop laser has developed a double habit: it often pulls two sheets at once, and whatever it prints lands rotated a few degrees on the page. A tech already cleaned the pickup roller last week — the feed improved for a day, then both symptoms came straight back. Read the page and name what failed.',
    swatch: { damageKind: 'none' },
    assets: {
      reference: {
        kind: 'swatch',
        title: 'Sample output · HR LaserJet',
        defect: 'skew',
        caption: 'Print rotated off square · often two sheets pulled together',
        notes: ['Pickup roller cleaned last week: brief improvement only', 'Multipage misfeeds alongside the skew', 'Paper is fresh and fanned before loading']
      }
    },
    steps: [
      { id: 'diagnose', type: 'configure', points: 1,
        prompt: 'The pickup roller was cleaned and the symptoms returned. Name the defect pattern, then the component the evidence points to.',
        explanation: 'Skew plus multipage misfeeds is a feed-separation signature. The separation pad presses against the pickup roller to hold back every sheet but the top one; worn smooth, it lets extra sheets slip through and lets the fed sheet twist as it goes. A cleaned roller helping only briefly says the roller was not the root cause.',
        payload: { slots: [
          { id: 'defectPattern', label: 'Defect pattern', options: [
            { id: 'p-skew', text: 'Crooked print · the whole page is rotated off square' },
            { id: 'p-smear', text: 'Loose toner · print smears at a touch' },
            { id: 'p-ghost', text: 'Ghosting · a faint copy of an earlier image repeats' } ] },
          { id: 'failedComponent', label: 'Failed component', options: [
            { id: 'c-seppad', text: 'Separation pad worn smooth · extra sheets slip through and feed crooked' },
            { id: 'c-scratcheddrum', text: 'Scratched drum · a groove in the coating stops toner along one band' },
            { id: 'c-blade', text: 'Cleaning blade worn · residual toner echoes an earlier image' },
            { id: 'c-fuser', text: 'Fuser assembly · toner is not bonding to the page' } ] } ] },
        answer: { slots: { defectPattern: 'p-skew', failedComponent: 'c-seppad' } } }
    ]
  },
  {
    id: 'a1-swatch-11',
    cert: 'aplus-core1',
    archetype: 'swatch',
    objective: '5.6',
    topic: 'Multi-symptom — repeating marks with fading print, triage order',
    title: 'The print room\'s LaserJet is stamping marks AND slowly fading',
    estMinutes: 6,
    scenario: 'The print room reports two problems on the same machine: dark marks that repeat down every page at a fixed interval, and print that has been getting gradually fainter for a fortnight. Two symptoms, one ticket. Diagnose the defect the sample page pins down, then sequence the visit so each fix is verified before the next is judged.',
    swatch: { damageKind: 'none' },
    assets: {
      reference: {
        kind: 'swatch',
        title: 'Sample output · print-room LaserJet',
        defect: 'spots',
        caption: 'Repeating marks at a fixed interval · overall density also low',
        notes: ['Marks: same lane, fixed interval', 'Density fading gradually over 2 weeks', 'Toner gauge: low']
      }
    },
    steps: [
      { id: 'diagnose', type: 'configure', points: 1,
        prompt: 'Start with the symptom the sample page can prove. Name the defect pattern, then the component that produces it.',
        explanation: 'Fading is ambiguous from one page — but repeating marks at a fixed interval are not. The interval fingerprints a rotating part: damage on the imaging drum stamps the page once per rotation. The fading is most simply the low toner gauge, and it gets judged AFTER the drum problem is fixed, not alongside it.',
        payload: { slots: [
          { id: 'defectPattern', label: 'Defect pattern', options: [
            { id: 'p-spots', text: 'Repeating marks · same spot at a fixed interval' },
            { id: 'p-ghost', text: 'Ghosting · a faint copy of an earlier image repeats' },
            { id: 'p-smear', text: 'Loose toner · print smears at a touch' } ] },
          { id: 'failedComponent', label: 'Failed component', options: [
            { id: 'c-drum', text: 'Imaging drum · damage on its surface prints every rotation' },
            { id: 'c-fuser', text: 'Fuser assembly · toner is not bonding to the page' },
            { id: 'c-seppad', text: 'Separation pad worn · pages feed crooked or two at a time' },
            { id: 'c-toner', text: 'Toner cartridge low · the whole page prints faded' } ] } ] },
        answer: { slots: { defectPattern: 'p-spots', failedComponent: 'c-drum' } } },
      { id: 'triage', type: 'order', points: 1,
        prompt: 'Sequence the visit: fix what is proven, verify, then judge the second symptom.',
        explanation: 'Measure first — the interval is the evidence that names the part. Replace the drum on that evidence, then test: the test page both confirms the marks are gone and shows the true remaining density. Only then can the fade be judged on its own, and the toner cartridge assessed as a separate, cheap consumable decision.',
        payload: { items: [
          { id: 'o-measure', label: 'Measure the mark-to-mark interval on the sample page' },
          { id: 'o-drum', label: 'Replace the drum unit' },
          { id: 'o-test', label: 'Print a test page and confirm the marks are gone' },
          { id: 'o-toner', label: 'Assess the remaining fade and replace the toner cartridge if needed' } ] },
        answer: { correctOrder: ['o-measure', 'o-drum', 'o-test', 'o-toner'] } }
    ]
  },
  {
    id: 'a1-swatch-12',
    cert: 'aplus-core1',
    archetype: 'swatch',
    objective: '5.6',
    topic: 'Multi-symptom — smearing print with grinding noise, symptom mapping',
    title: 'The finance printer smears its pages and grinds while doing it',
    estMinutes: 6,
    scenario: 'Finance\'s workhorse laser now announces every job with a grinding noise from the output end, and the pages it delivers smudge at a touch. Accordion-style jams are starting at the exit rollers too. Three complaints on one ticket. Read the page, name the failed assembly, then map each symptom to what it tells you.',
    swatch: { damageKind: 'none' },
    assets: {
      reference: {
        kind: 'swatch',
        title: 'Sample output · finance LaserJet',
        defect: 'smear',
        caption: 'Toner smudges at a touch · grinding noise during every job',
        notes: ['Grinding from the output end of the printer', 'Accordion jams beginning at the exit', 'Toner level: fine']
      }
    },
    steps: [
      { id: 'diagnose', type: 'configure', points: 1,
        prompt: 'Name the defect pattern the sample page shows, then the assembly all three symptoms share.',
        explanation: 'Unfused toner puts the fault at the fuser. The grinding and the exit-end accordion jams agree: a fuser whose drive gear is wearing out turns roughly, mangles the page as it passes, and no longer holds fusing temperature and pressure. One failing assembly explains all three complaints — that convergence is the diagnosis.',
        payload: { slots: [
          { id: 'defectPattern', label: 'Defect pattern', options: [
            { id: 'p-smear', text: 'Loose toner · print smears at a touch' },
            { id: 'p-spots', text: 'Repeating marks · same spot at a fixed interval' },
            { id: 'p-streak', text: 'Vertical white streak · a clean band missing toner' } ] },
          { id: 'failedComponent', label: 'Failed component', options: [
            { id: 'c-fuser', text: 'Fuser assembly · failing drive and heat, no longer bonding toner' },
            { id: 'c-pickup', text: 'Pickup roller worn · pages feed crooked or not at all' },
            { id: 'c-blade', text: 'Cleaning blade worn · residual toner echoes an earlier image' },
            { id: 'c-tonerpath', text: 'Blocked toner path · no toner reaches one lane of the page' } ] } ] },
        answer: { slots: { defectPattern: 'p-smear', failedComponent: 'c-fuser' } } },
      { id: 'sympmap', type: 'match', points: 1,
        prompt: 'Map each reported symptom to what it tells you about the failing fuser.',
        explanation: 'Each complaint is a different window on the same assembly, through a different mechanism: smudging print means the hot roller is not reaching fusing temperature; grinding is the worn drive gear turning roughly; and accordion jams at the exit mean the pressure roller has lost its nip — without that pinch the page is no longer pulled taut through the exit and buckles. Three distinct mechanisms, one assembly: that convergence is what points to the fuser maintenance kit rather than three separate repairs.',
        payload: {
          left: [
            { id: 'm-smear', label: 'Toner smudges at a touch' },
            { id: 'm-grind', label: 'Grinding noise during printing' },
            { id: 'm-jam', label: 'Accordion jams at the exit' } ],
          right: [
            { id: 'd-heat', label: 'Hot roller not reaching fusing temperature' },
            { id: 'd-gear', label: 'Fuser drive gear worn and turning roughly' },
            { id: 'd-nip', label: 'Pressure roller worn · lost nip lets the page buckle at the exit' } ]
        },
        answer: { pairs: { 'm-smear': 'd-heat', 'm-grind': 'd-gear', 'm-jam': 'd-nip' } } }
    ]
  },
];
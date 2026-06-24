/* Hand-reviewed Net+ PBQ seed scenarios. Answers verified correct. */
window.SIM_LAB_SEED_NETPLUS = [
  {
    id: 'np-seed-subnet-1', cert: 'netplus', objective: '1.4', topic: 'Subnetting',
    title: 'Size the branch subnet', estMinutes: 6,
    scenario: 'A branch office needs a subnet for up to 60 hosts on 192.168.10.0. Answer the two fields.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'What CIDR prefix gives at least 60 usable hosts (smallest that fits)?',
        explanation: '/26 = 64 addresses, 62 usable — the smallest block that fits 60 hosts.',
        payload: { fields: [{ id: 'cidr', label: 'CIDR prefix', inputmode: 'text' }] },
        answer: { cidr: ['/26', '26'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'How many usable hosts does that subnet provide?',
        explanation: '2^6 - 2 = 62 usable (minus network and broadcast).',
        payload: { fields: [{ id: 'hosts', label: 'Usable hosts', inputmode: 'numeric' }] },
        answer: { hosts: ['62'] } }
    ]
  },

  {
    id: 'np-seed-trouble-order-1', cert: 'netplus', objective: '5.1', topic: 'Troubleshooting',
    title: 'Order the troubleshooting methodology', estMinutes: 4,
    scenario: 'A user reports they cannot reach a shared drive. Put the CompTIA network troubleshooting methodology in the correct order, first step at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Drag the seven steps into the order CompTIA defines.',
        explanation: 'CompTIA order: 1) Identify the problem, 2) Establish a theory of probable cause, 3) Test the theory, 4) Establish a plan of action and identify potential effects, 5) Implement the solution or escalate, 6) Verify full system functionality and implement preventive measures, 7) Document findings, actions, and outcomes.',
        payload: { items: [
          { id: 'i3', label: 'Test the theory to determine the cause' },
          { id: 'i1', label: 'Identify the problem' },
          { id: 'i5', label: 'Implement the solution or escalate' },
          { id: 'i7', label: 'Document findings, actions, and outcomes' },
          { id: 'i2', label: 'Establish a theory of probable cause' },
          { id: 'i6', label: 'Verify full system functionality and implement preventive measures' },
          { id: 'i4', label: 'Establish a plan of action and identify potential effects' }
        ] },
        answer: { correctOrder: ['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7'] } }
    ]
  },

  {
    id: 'np-seed-private-public-1', cert: 'netplus', objective: '1.4', topic: 'IPv4 addressing',
    title: 'Private or public address', estMinutes: 3,
    scenario: 'Sort each IPv4 address into private (RFC 1918) or public. Watch the 172 range carefully.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each address under Private or Public.',
        explanation: 'RFC 1918 private ranges: 10.0.0.0/8, 172.16.0.0–172.31.255.255 (172.16/12), and 192.168.0.0/16. 172.32.5.5 is outside the 172.16–172.31 block, so it is public. 8.8.8.8 and 1.1.1.1 are public DNS resolvers.',
        payload: {
          items: [
            { id: 'a1', label: '10.55.4.9' },
            { id: 'a2', label: '172.16.200.1' },
            { id: 'a3', label: '192.168.50.20' },
            { id: 'a4', label: '172.32.5.5' },
            { id: 'a5', label: '8.8.8.8' },
            { id: 'a6', label: '1.1.1.1' }
          ],
          buckets: [
            { id: 'priv', label: 'Private (RFC 1918)' },
            { id: 'pub', label: 'Public' }
          ]
        },
        answer: { map: { a1: 'priv', a2: 'priv', a3: 'priv', a4: 'pub', a5: 'pub', a6: 'pub' } } }
    ]
  },

  {
    id: 'np-seed-ports-match-1', cert: 'netplus', objective: '1.5', topic: 'Ports and protocols',
    title: 'Match the well-known ports', estMinutes: 3,
    scenario: 'Match each port number to the service that uses it by default.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each port with its default service.',
        explanation: '22 = SSH, 53 = DNS, 80 = HTTP, 443 = HTTPS, 3389 = RDP. These are the default well-known ports CompTIA expects you to recall.',
        payload: {
          left: [
            { id: 'p22', label: '22' },
            { id: 'p53', label: '53' },
            { id: 'p80', label: '80' },
            { id: 'p443', label: '443' },
            { id: 'p3389', label: '3389' }
          ],
          right: [
            { id: 'sssh', label: 'SSH' },
            { id: 'sdns', label: 'DNS' },
            { id: 'shttp', label: 'HTTP' },
            { id: 'shttps', label: 'HTTPS' },
            { id: 'srdp', label: 'RDP' }
          ]
        },
        answer: { pairs: { p22: 'sssh', p53: 'sdns', p80: 'shttp', p443: 'shttps', p3389: 'srdp' } } }
    ]
  },

  {
    id: 'np-seed-dns-records-1', cert: 'netplus', objective: '1.6', topic: 'DNS records',
    title: 'Match the DNS record types', estMinutes: 3,
    scenario: 'Match each DNS record type to what it does.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each record type with its purpose.',
        explanation: 'A maps a hostname to an IPv4 address, AAAA to an IPv6 address, MX names the mail server for a domain, CNAME is an alias to another hostname, and PTR maps an IP back to a hostname (reverse lookup).',
        payload: {
          left: [
            { id: 'ra', label: 'A' },
            { id: 'raaaa', label: 'AAAA' },
            { id: 'rmx', label: 'MX' },
            { id: 'rcname', label: 'CNAME' },
            { id: 'rptr', label: 'PTR' }
          ],
          right: [
            { id: 'p4', label: 'Maps a hostname to an IPv4 address' },
            { id: 'p6', label: 'Maps a hostname to an IPv6 address' },
            { id: 'pmx', label: 'Specifies the mail server for a domain' },
            { id: 'palias', label: 'Creates an alias to another hostname' },
            { id: 'prev', label: 'Maps an IP address back to a hostname' }
          ]
        },
        answer: { pairs: { ra: 'p4', raaaa: 'p6', rmx: 'pmx', rcname: 'palias', rptr: 'prev' } } }
    ]
  },

  {
    id: 'np-seed-apipa-analyze-1', cert: 'netplus', objective: '5.5', topic: 'DHCP / APIPA',
    title: 'Spot the DHCP failure', estMinutes: 2,
    scenario: 'A Windows host has no network access. Its ipconfig output is below. Click the single line that shows it failed to lease an address from DHCP.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the line that proves DHCP did not assign an address.',
        explanation: 'A 169.254.x.x address is APIPA (link-local, 169.254.0.0/16). Windows self-assigns it only when no DHCP server answers. The blank default gateway is a consequence, but the 169.254 address is the direct evidence of DHCP failure.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'IPv4 Address . . . . . . . . . . : 169.254.18.44' },
            { id: 'l2', text: 'Subnet Mask . . . . . . . . . . . : 255.255.0.0' },
            { id: 'l3', text: 'Default Gateway . . . . . . . . . :' },
            { id: 'l4', text: 'DHCP Enabled. . . . . . . . . . . : Yes' }
          ]
        },
        answer: { selected: ['l1'] } }
    ]
  },

  {
    id: 'np-seed-net-bcast-1', cert: 'netplus', objective: '1.4', topic: 'Subnetting',
    title: 'Find the network and broadcast', estMinutes: 3,
    scenario: 'A host is configured as 192.168.20.130 with a /26 mask (255.255.255.192). Give the network address and the broadcast address of its subnet.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'Network (subnet) address?',
        explanation: '/26 makes blocks of 64: .0, .64, .128, .192. The host .130 falls in the .128 block, so the network address is 192.168.20.128.',
        payload: { fields: [{ id: 'net', label: 'Network address', inputmode: 'text' }] },
        answer: { net: ['192.168.20.128'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'Broadcast address of that subnet?',
        explanation: 'The .128 block spans .128 to .191, so the broadcast address is 192.168.20.191.',
        payload: { fields: [{ id: 'bcast', label: 'Broadcast address', inputmode: 'text' }] },
        answer: { bcast: ['192.168.20.191'] } }
    ]
  },

  {
    id: 'np-seed-osi-order-1', cert: 'netplus', objective: '1.1', topic: 'OSI model',
    title: 'Order the OSI layers', estMinutes: 3,
    scenario: 'Put the seven OSI layers in order from Layer 7 at the top down to Layer 1 at the bottom.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the layers from Layer 7 (top) to Layer 1 (bottom).',
        explanation: 'Top to bottom: 7 Application, 6 Presentation, 5 Session, 4 Transport, 3 Network, 2 Data Link, 1 Physical. ("All People Seem To Need Data Processing" reads 7 down to 1.)',
        payload: { items: [
          { id: 'l3', label: 'Network' },
          { id: 'l7', label: 'Application' },
          { id: 'l1', label: 'Physical' },
          { id: 'l5', label: 'Session' },
          { id: 'l2', label: 'Data Link' },
          { id: 'l6', label: 'Presentation' },
          { id: 'l4', label: 'Transport' }
        ] },
        answer: { correctOrder: ['l7', 'l6', 'l5', 'l4', 'l3', 'l2', 'l1'] } }
    ]
  },

  {
    id: 'np-seed-osi-devices-1', cert: 'netplus', objective: '1.1', topic: 'OSI model',
    title: 'Devices by OSI layer', estMinutes: 3,
    scenario: 'Sort each device into the OSI layer it primarily operates at.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each device under its primary OSI layer.',
        explanation: 'Hubs and repeaters just regenerate signal at Layer 1 (Physical). Switches and bridges forward by MAC address at Layer 2 (Data Link). Routers forward by IP address at Layer 3 (Network).',
        payload: {
          items: [
            { id: 'd1', label: 'Hub' },
            { id: 'd2', label: 'Repeater' },
            { id: 'd3', label: 'Switch' },
            { id: 'd4', label: 'Bridge' },
            { id: 'd5', label: 'Router' }
          ],
          buckets: [
            { id: 'l1', label: 'Layer 1 (Physical)' },
            { id: 'l2', label: 'Layer 2 (Data Link)' },
            { id: 'l3', label: 'Layer 3 (Network)' }
          ]
        },
        answer: { map: { d1: 'l1', d2: 'l1', d3: 'l2', d4: 'l2', d5: 'l3' } } }
    ]
  },

  {
    id: 'np-seed-ethernet-speed-1', cert: 'netplus', objective: '1.5', topic: 'Ethernet standards',
    title: 'Match Ethernet standards to speed', estMinutes: 3,
    scenario: 'Match each copper Ethernet standard to its maximum speed.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each standard with its top speed.',
        explanation: '10BASE-T = 10 Mbps, 100BASE-TX = 100 Mbps, 1000BASE-T = 1 Gbps, 10GBASE-T = 10 Gbps. The number in the name is the speed.',
        payload: {
          left: [
            { id: 'e10', label: '10BASE-T' },
            { id: 'e100', label: '100BASE-TX' },
            { id: 'e1000', label: '1000BASE-T' },
            { id: 'e10g', label: '10GBASE-T' }
          ],
          right: [
            { id: 's10m', label: '10 Mbps' },
            { id: 's100m', label: '100 Mbps' },
            { id: 's1g', label: '1 Gbps' },
            { id: 's10g', label: '10 Gbps' }
          ]
        },
        answer: { pairs: { e10: 's10m', e100: 's100m', e1000: 's1g', e10g: 's10g' } } }
    ]
  },

  {
    id: 'np-seed-ipv6-fillin-1', cert: 'netplus', objective: '1.8', topic: 'IPv6 addressing',
    title: 'IPv6 special addresses', estMinutes: 3,
    scenario: 'Answer two IPv6 fundamentals in their standard shorthand.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'What is the IPv6 loopback address (compressed form)?',
        explanation: 'The IPv6 loopback is ::1, the equivalent of 127.0.0.1 in IPv4.',
        payload: { fields: [{ id: 'loop', label: 'IPv6 loopback', inputmode: 'text' }] },
        answer: { loop: ['::1'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'What prefix identifies an IPv6 link-local address?',
        explanation: 'Link-local addresses come from fe80::/10. Every IPv6 interface auto-configures one.',
        payload: { fields: [{ id: 'll', label: 'Link-local prefix', inputmode: 'text' }] },
        answer: { ll: ['fe80::/10'] } }
    ]
  },

  {
    id: 'np-seed-ping-unreachable-1', cert: 'netplus', objective: '5.3', topic: 'Connectivity tools',
    title: 'Read the ping result', estMinutes: 2,
    scenario: 'A host pings a remote server at 172.20.5.10. The output is below. Click the single line that shows the gateway has no route to the destination.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the line that identifies a routing problem at the gateway.',
        explanation: '"Reply from 10.0.0.1: Destination host unreachable" means your default gateway got the packet but has no route to 172.20.5.10. That is a routing problem, not a plain timeout (which only tells you no reply came back).',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Pinging 172.20.5.10 with 32 bytes of data:' },
            { id: 'l2', text: 'Reply from 10.0.0.1: Destination host unreachable.' },
            { id: 'l3', text: 'Request timed out.' },
            { id: 'l4', text: 'Ping statistics for 172.20.5.10: Sent = 4, Received = 1, Lost = 3 (75% loss)' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  {
    id: 'np-seed-dora-order-1', cert: 'netplus', objective: '1.6', topic: 'DHCP',
    title: 'Order the DHCP lease (DORA)', estMinutes: 3,
    scenario: 'A client boots and requests an address. Put the four DHCP lease messages in order, first message at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the DHCP DORA exchange in order.',
        explanation: 'DORA: Discover (client broadcasts to find a server), Offer (server offers an address), Request (client requests that offer), Acknowledge (server confirms the lease).',
        payload: { items: [
          { id: 'r', label: 'Request — client requests the offered address' },
          { id: 'd', label: 'Discover — client broadcasts to find a DHCP server' },
          { id: 'a', label: 'Acknowledge — server confirms the lease' },
          { id: 'o', label: 'Offer — server offers an address' }
        ] },
        answer: { correctOrder: ['d', 'o', 'r', 'a'] } }
    ]
  },

  {
    id: 'np-seed-tools-match-1', cert: 'netplus', objective: '5.2', topic: 'Troubleshooting tools',
    title: 'Match the tool to its job', estMinutes: 3,
    scenario: 'Match each command-line tool to what it is used for.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each tool with its primary purpose.',
        explanation: 'ping tests reachability and round-trip time. tracert shows the hops along the path. nslookup queries DNS. ipconfig shows the local interface configuration. netstat lists active connections and listening ports.',
        payload: {
          left: [
            { id: 'tping', label: 'ping' },
            { id: 'ttracert', label: 'tracert' },
            { id: 'tnslookup', label: 'nslookup' },
            { id: 'tipconfig', label: 'ipconfig' },
            { id: 'tnetstat', label: 'netstat' }
          ],
          right: [
            { id: 'ureach', label: 'Test reachability and round-trip time to a host' },
            { id: 'uhops', label: 'Show the hops along the path to a destination' },
            { id: 'udns', label: 'Query DNS to resolve a name to an IP' },
            { id: 'uifcfg', label: 'Display the local interface IP configuration' },
            { id: 'uconns', label: 'List active connections and listening ports' }
          ]
        },
        answer: { pairs: { tping: 'ureach', ttracert: 'uhops', tnslookup: 'udns', tipconfig: 'uifcfg', tnetstat: 'uconns' } } }
    ]
  },

  {
    id: 'np-seed-tcp-handshake-1', cert: 'netplus', objective: '1.5', topic: 'TCP',
    title: 'Order the TCP handshake', estMinutes: 2,
    scenario: 'Two hosts open a TCP connection. Put the three-way handshake in order, first message at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the TCP three-way handshake.',
        explanation: 'TCP opens with SYN (client requests), SYN-ACK (server acknowledges and requests back), then ACK (client acknowledges). The connection is established after the ACK.',
        payload: { items: [
          { id: 'ack', label: 'ACK — client acknowledges' },
          { id: 'syn', label: 'SYN — client requests a connection' },
          { id: 'synack', label: 'SYN-ACK — server acknowledges and responds' }
        ] },
        answer: { correctOrder: ['syn', 'synack', 'ack'] } }
    ]
  },

  {
    id: 'np-seed-tcp-udp-cat-1', cert: 'netplus', objective: '1.5', topic: 'TCP vs UDP',
    title: 'TCP or UDP', estMinutes: 3,
    scenario: 'Sort each service by the transport protocol it uses by default.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each service under TCP or UDP.',
        explanation: 'HTTP, SSH, and FTP are connection-oriented and use TCP. DHCP, TFTP, and SNMP are connectionless and use UDP.',
        payload: {
          items: [
            { id: 'http', label: 'HTTP' },
            { id: 'ssh', label: 'SSH' },
            { id: 'ftp', label: 'FTP' },
            { id: 'dhcp', label: 'DHCP' },
            { id: 'tftp', label: 'TFTP' },
            { id: 'snmp', label: 'SNMP' }
          ],
          buckets: [
            { id: 'tcp', label: 'TCP' },
            { id: 'udp', label: 'UDP' }
          ]
        },
        answer: { map: { http: 'tcp', ssh: 'tcp', ftp: 'tcp', dhcp: 'udp', tftp: 'udp', snmp: 'udp' } } }
    ]
  },

  {
    id: 'np-seed-ports-match-2', cert: 'netplus', objective: '1.5', topic: 'Ports and protocols',
    title: 'Match more well-known ports', estMinutes: 3,
    scenario: 'Match each port number to its default service.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each port with its default service.',
        explanation: '23 = Telnet, 25 = SMTP, 110 = POP3, 143 = IMAP, 161 = SNMP.',
        payload: {
          left: [
            { id: 'p23', label: '23' },
            { id: 'p25', label: '25' },
            { id: 'p110', label: '110' },
            { id: 'p143', label: '143' },
            { id: 'p161', label: '161' }
          ],
          right: [
            { id: 'stelnet', label: 'Telnet' },
            { id: 'ssmtp', label: 'SMTP' },
            { id: 'spop3', label: 'POP3' },
            { id: 'simap', label: 'IMAP' },
            { id: 'ssnmp', label: 'SNMP' }
          ]
        },
        answer: { pairs: { p23: 'stelnet', p25: 'ssmtp', p110: 'spop3', p143: 'simap', p161: 'ssnmp' } } }
    ]
  },

  {
    id: 'np-seed-p2p-mask-1', cert: 'netplus', objective: '1.4', topic: 'Subnetting',
    title: 'Size a point-to-point link', estMinutes: 3,
    scenario: 'Two routers connect over a point-to-point link. You want the smallest subnet that wastes no addresses. Answer both fields.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'How many usable host addresses does a /30 provide?',
        explanation: 'A /30 has 4 addresses, 2 usable — exactly enough for the two router interfaces on a point-to-point link.',
        payload: { fields: [{ id: 'hosts', label: 'Usable hosts', inputmode: 'numeric' }] },
        answer: { hosts: ['2'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'What is a /30 mask in dotted-decimal?',
        explanation: '/30 = 255.255.255.252 (the last octet 11111100).',
        payload: { fields: [{ id: 'mask', label: 'Subnet mask', inputmode: 'text' }] },
        answer: { mask: ['255.255.255.252'] } }
    ]
  },

  {
    id: 'np-seed-cable-length-1', cert: 'netplus', objective: '1.5', topic: 'Cabling',
    title: 'Spot the over-length run', estMinutes: 2,
    scenario: 'Three Cat6 copper runs are planned. Click the single run that exceeds the maximum length for copper Ethernet.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the run that breaks the copper distance limit.',
        explanation: 'Copper twisted-pair Ethernet is limited to 100 metres (channel). Run B at 120 m exceeds it and will drop or fail; the others are within spec.',
        payload: {
          multi: false,
          lines: [
            { id: 'rA', text: 'Run A: 80 m, Cat6' },
            { id: 'rB', text: 'Run B: 120 m, Cat6' },
            { id: 'rC', text: 'Run C: 55 m, Cat6' }
          ]
        },
        answer: { selected: ['rB'] } }
    ]
  },

  {
    id: 'np-seed-connectors-match-1', cert: 'netplus', objective: '1.5', topic: 'Connectors and media',
    title: 'Match connector to media', estMinutes: 3,
    scenario: 'Match each connector to the cable or media it terminates.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each connector with its media.',
        explanation: 'RJ45 terminates twisted-pair Ethernet, LC terminates fiber, BNC terminates coax, and RJ11 terminates telephone wiring.',
        payload: {
          left: [
            { id: 'rj45', label: 'RJ45' },
            { id: 'lc', label: 'LC' },
            { id: 'bnc', label: 'BNC' },
            { id: 'rj11', label: 'RJ11' }
          ],
          right: [
            { id: 'mtp', label: 'Twisted-pair Ethernet' },
            { id: 'mfiber', label: 'Fiber-optic' },
            { id: 'mcoax', label: 'Coaxial' },
            { id: 'mphone', label: 'Telephone' }
          ]
        },
        answer: { pairs: { rj45: 'mtp', lc: 'mfiber', bnc: 'mcoax', rj11: 'mphone' } } }
    ]
  },

  {
    id: 'np-seed-dns-resolution-order-1', cert: 'netplus', objective: '1.6', topic: 'DNS resolution',
    title: 'Order DNS resolution', estMinutes: 3,
    scenario: 'A client looks up a name that is not cached anywhere. Put the recursive DNS resolution steps in order, first step at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the recursive DNS resolution sequence.',
        explanation: 'The client checks its local cache, then queries its recursive resolver, which walks the hierarchy: root server, then the TLD server, then the authoritative server that holds the record.',
        payload: { items: [
          { id: 'tld', label: 'TLD name server is queried' },
          { id: 'cache', label: 'Client checks its local cache' },
          { id: 'auth', label: 'Authoritative name server returns the record' },
          { id: 'resolver', label: 'Recursive resolver is queried' },
          { id: 'root', label: 'Root name server is queried' }
        ] },
        answer: { correctOrder: ['cache', 'resolver', 'root', 'tld', 'auth'] } }
    ]
  },

  {
    id: 'np-seed-cast-cat-1', cert: 'netplus', objective: '1.4', topic: 'IPv4 addressing',
    title: 'Unicast, multicast, or broadcast', estMinutes: 3,
    scenario: 'Sort each IPv4 destination by its cast type.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each address under its cast type.',
        explanation: 'Multicast uses 224.0.0.0/4 (224–239), so 224.0.0.5 and 239.1.1.1 are multicast. 255.255.255.255 is the limited broadcast. Ordinary host addresses like 192.168.1.5 and 10.0.0.1 are unicast.',
        payload: {
          items: [
            { id: 'c1', label: '192.168.1.5' },
            { id: 'c2', label: '224.0.0.5' },
            { id: 'c3', label: '255.255.255.255' },
            { id: 'c4', label: '10.0.0.1' },
            { id: 'c5', label: '239.1.1.1' }
          ],
          buckets: [
            { id: 'uni', label: 'Unicast' },
            { id: 'multi', label: 'Multicast' },
            { id: 'broad', label: 'Broadcast' }
          ]
        },
        answer: { map: { c1: 'uni', c2: 'multi', c3: 'broad', c4: 'uni', c5: 'multi' } } }
    ]
  },

  {
    id: 'np-seed-wifi-gen-match-1', cert: 'netplus', objective: '2.4', topic: 'Wireless standards',
    title: 'Match Wi-Fi generation names', estMinutes: 2,
    scenario: 'Match each 802.11 standard to its Wi-Fi Alliance generation name.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each standard with its marketing name.',
        explanation: '802.11n is Wi-Fi 4, 802.11ac is Wi-Fi 5, and 802.11ax is Wi-Fi 6.',
        payload: {
          left: [
            { id: 'n', label: '802.11n' },
            { id: 'ac', label: '802.11ac' },
            { id: 'ax', label: '802.11ax' }
          ],
          right: [
            { id: 'w4', label: 'Wi-Fi 4' },
            { id: 'w5', label: 'Wi-Fi 5' },
            { id: 'w6', label: 'Wi-Fi 6' }
          ]
        },
        answer: { pairs: { n: 'w4', ac: 'w5', ax: 'w6' } } }
    ]
  },

  {
    id: 'np-seed-vlsm-fillin-1', cert: 'netplus', objective: '1.4', topic: 'Subnetting',
    title: 'Borrow bits for subnets', estMinutes: 3,
    scenario: 'You borrow bits to split a /24 into /27 subnets. Answer both fields.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'How many /27 subnets does a single /24 yield?',
        explanation: 'Going from /24 to /27 borrows 3 host bits: 2^3 = 8 subnets.',
        payload: { fields: [{ id: 'subnets', label: 'Number of subnets', inputmode: 'numeric' }] },
        answer: { subnets: ['8'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'How many usable hosts does each /27 provide?',
        explanation: 'A /27 has 32 addresses, 30 usable (2^5 - 2).',
        payload: { fields: [{ id: 'hosts', label: 'Usable hosts per subnet', inputmode: 'numeric' }] },
        answer: { hosts: ['30'] } }
    ]
  },

  {
    id: 'np-seed-protocols-match-1', cert: 'netplus', objective: '1.4', topic: 'Core services',
    title: 'Match the service to its job', estMinutes: 3,
    scenario: 'Match each network service to what it does.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each service with its purpose.',
        explanation: 'DHCP assigns IP addresses, DNS resolves names to IPs, NTP synchronizes clocks, SNMP monitors network devices, and SMTP sends email.',
        payload: {
          left: [
            { id: 'sdhcp', label: 'DHCP' },
            { id: 'sdns', label: 'DNS' },
            { id: 'sntp', label: 'NTP' },
            { id: 'ssnmp', label: 'SNMP' },
            { id: 'ssmtp', label: 'SMTP' }
          ],
          right: [
            { id: 'uassign', label: 'Assigns IP addresses to hosts' },
            { id: 'uresolve', label: 'Resolves names to IP addresses' },
            { id: 'utime', label: 'Synchronizes device clocks' },
            { id: 'umonitor', label: 'Monitors network devices' },
            { id: 'umail', label: 'Sends email between servers' }
          ]
        },
        answer: { pairs: { sdhcp: 'uassign', sdns: 'uresolve', sntp: 'utime', ssnmp: 'umonitor', ssmtp: 'umail' } } }
    ]
  },

  {
    id: 'np-seed-pdu-order-1', cert: 'netplus', objective: '1.1', topic: 'Encapsulation',
    title: 'Order the PDUs by layer', estMinutes: 3,
    scenario: 'Data is encapsulated as it moves down the stack. Put the protocol data units in order from the top of the stack down to the wire.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the PDUs from the upper layers down to the physical medium.',
        explanation: 'Encapsulation order down the stack: Data (upper layers) becomes a Segment at Transport, a Packet at Network, a Frame at Data Link, and Bits on the physical medium.',
        payload: { items: [
          { id: 'frame', label: 'Frame (Data Link)' },
          { id: 'data', label: 'Data (upper layers)' },
          { id: 'bits', label: 'Bits (Physical)' },
          { id: 'segment', label: 'Segment (Transport)' },
          { id: 'packet', label: 'Packet (Network)' }
        ] },
        answer: { correctOrder: ['data', 'segment', 'packet', 'frame', 'bits'] } }
    ]
  },

  {
    id: 'np-seed-cia-cat-1', cert: 'netplus', objective: '4.1', topic: 'CIA triad',
    title: 'Sort by the CIA triad', estMinutes: 3,
    scenario: 'Sort each control by which part of the CIA triad it primarily protects.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each control under Confidentiality, Integrity, or Availability.',
        explanation: 'Encryption and VPN tunnels keep data secret (Confidentiality). Hashes and checksums detect tampering (Integrity). RAID and redundant links keep services reachable (Availability).',
        payload: {
          items: [
            { id: 'enc', label: 'Encrypting a file at rest' },
            { id: 'vpn', label: 'VPN tunnel encryption' },
            { id: 'hash', label: 'Hashing a download to verify it' },
            { id: 'cksum', label: 'Checksum to detect file changes' },
            { id: 'raid', label: 'RAID array' },
            { id: 'redun', label: 'Redundant internet links' }
          ],
          buckets: [
            { id: 'conf', label: 'Confidentiality' },
            { id: 'integ', label: 'Integrity' },
            { id: 'avail', label: 'Availability' }
          ]
        },
        answer: { map: { enc: 'conf', vpn: 'conf', hash: 'integ', cksum: 'integ', raid: 'avail', redun: 'avail' } } }
    ]
  },

  {
    id: 'np-seed-attacks-match-1', cert: 'netplus', objective: '4.2', topic: 'Attacks',
    title: 'Match the attack', estMinutes: 3,
    scenario: 'Match each attack to what it does.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each attack with its description.',
        explanation: 'Phishing tricks users with fake messages. DDoS floods a service from many sources. On-path (MITM) intercepts traffic between two parties. ARP spoofing sends forged ARP replies to redirect LAN traffic. DNS poisoning corrupts DNS records to send users to the wrong host.',
        payload: {
          left: [
            { id: 'phish', label: 'Phishing' },
            { id: 'ddos', label: 'DDoS' },
            { id: 'mitm', label: 'On-path (MITM)' },
            { id: 'arp', label: 'ARP spoofing' },
            { id: 'dnsp', label: 'DNS poisoning' }
          ],
          right: [
            { id: 'dphish', label: 'Tricks users into revealing info via fake messages' },
            { id: 'dddos', label: 'Floods a service with traffic from many sources' },
            { id: 'dmitm', label: 'Intercepts traffic between two parties' },
            { id: 'darp', label: 'Sends forged ARP replies to redirect LAN traffic' },
            { id: 'ddnsp', label: 'Corrupts DNS records to redirect users' }
          ]
        },
        answer: { pairs: { phish: 'dphish', ddos: 'dddos', mitm: 'dmitm', arp: 'darp', dnsp: 'ddnsp' } } }
    ]
  },

  {
    id: 'np-seed-topology-match-1', cert: 'netplus', objective: '1.6', topic: 'Topologies',
    title: 'Match the topology', estMinutes: 3,
    scenario: 'Match each physical topology to its description.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each topology with its layout.',
        explanation: 'Star: all nodes connect to a central switch. Mesh: every node connects to every other. Bus: all nodes share one backbone cable. Ring: each node connects to two neighbors forming a loop.',
        payload: {
          left: [
            { id: 'star', label: 'Star' },
            { id: 'mesh', label: 'Mesh' },
            { id: 'bus', label: 'Bus' },
            { id: 'ring', label: 'Ring' }
          ],
          right: [
            { id: 'dstar', label: 'All nodes connect to a central switch' },
            { id: 'dmesh', label: 'Every node connects to every other node' },
            { id: 'dbus', label: 'All nodes share a single backbone cable' },
            { id: 'dring', label: 'Each node connects to two neighbors in a loop' }
          ]
        },
        answer: { pairs: { star: 'dstar', mesh: 'dmesh', bus: 'dbus', ring: 'dring' } } }
    ]
  },

  {
    id: 'np-seed-nat-fillin-1', cert: 'netplus', objective: '2.2', topic: 'NAT',
    title: 'Share one public IP', estMinutes: 3,
    scenario: 'A home router lets 20 internal devices reach the internet through a single public IP. Answer both fields.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'What technology maps many internal hosts to one public IP using port numbers?',
        explanation: 'PAT (Port Address Translation), also called NAT overload, multiplexes many hosts onto one public IP by tracking source ports.',
        payload: { fields: [{ id: 'tech', label: 'Technology', inputmode: 'text' }] },
        answer: { tech: ['PAT', 'port address translation', 'NAT overload'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'What class of address do the 20 internal devices use?',
        explanation: 'Internal hosts use private (RFC 1918) addresses, which PAT translates to the public IP.',
        payload: { fields: [{ id: 'addr', label: 'Address class', inputmode: 'text' }] },
        answer: { addr: ['private', 'RFC 1918', 'rfc1918'] } }
    ]
  },

  {
    id: 'np-seed-duplex-analyze-1', cert: 'netplus', objective: '5.5', topic: 'Interface errors',
    title: 'Diagnose the interface', estMinutes: 2,
    scenario: 'A link is slow and dropping packets. The switchport counters are below. Click the single line that confirms a duplex mismatch.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the counter that points to a duplex mismatch.',
        explanation: 'Late collisions are the classic signature of a duplex mismatch: one side is half-duplex and detects collisions after the slot time. A high late-collision count is the giveaway.',
        payload: {
          multi: false,
          lines: [
            { id: 'sp', text: 'Speed: 100 Mbps' },
            { id: 'dx', text: 'Duplex: Half' },
            { id: 'lc', text: 'Late collisions: 1473' },
            { id: 'ie', text: 'Input errors: 0' }
          ]
        },
        answer: { selected: ['lc'] } }
    ]
  },

  {
    id: 'np-seed-cloud-match-1', cert: 'netplus', objective: '1.7', topic: 'Cloud models',
    title: 'Match the cloud service model', estMinutes: 3,
    scenario: 'Match each cloud service model to who manages what.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each model with its description.',
        explanation: 'IaaS: the provider runs the hardware, you manage the OS and apps. PaaS: the provider runs the OS and runtime, you manage your apps. SaaS: the provider runs everything and you just use the app.',
        payload: {
          left: [
            { id: 'iaas', label: 'IaaS' },
            { id: 'paas', label: 'PaaS' },
            { id: 'saas', label: 'SaaS' }
          ],
          right: [
            { id: 'diaas', label: 'You manage the OS and apps; provider runs the hardware' },
            { id: 'dpaas', label: 'You manage apps; provider runs the OS and runtime' },
            { id: 'dsaas', label: 'Provider manages everything; you just use the app' }
          ]
        },
        answer: { pairs: { iaas: 'diaas', paas: 'dpaas', saas: 'dsaas' } } }
    ]
  },

  {
    id: 'np-seed-media-cat-1', cert: 'netplus', objective: '1.5', topic: 'Cabling media',
    title: 'Copper or fiber', estMinutes: 2,
    scenario: 'Sort each cable type into copper or fiber.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each cable under Copper or Fiber.',
        explanation: 'Cat5e, Cat6, and coaxial are copper. Single-mode and multimode are fiber-optic.',
        payload: {
          items: [
            { id: 'cat6', label: 'Cat6' },
            { id: 'cat5e', label: 'Cat5e' },
            { id: 'coax', label: 'Coaxial' },
            { id: 'smf', label: 'Single-mode' },
            { id: 'mmf', label: 'Multimode' }
          ],
          buckets: [
            { id: 'copper', label: 'Copper' },
            { id: 'fiber', label: 'Fiber' }
          ]
        },
        answer: { map: { cat6: 'copper', cat5e: 'copper', coax: 'copper', smf: 'fiber', mmf: 'fiber' } } }
    ]
  },

  {
    id: 'np-seed-secproto-match-1', cert: 'netplus', objective: '4.3', topic: 'Security protocols',
    title: 'Match the security protocol', estMinutes: 3,
    scenario: 'Match each security technology to its role.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each technology with its purpose.',
        explanation: 'WPA2 encrypts wireless traffic. 802.1X provides port-based network access control. RADIUS is a centralized authentication server. TLS encrypts data in transit, as in HTTPS.',
        payload: {
          left: [
            { id: 'wpa2', label: 'WPA2' },
            { id: 'dot1x', label: '802.1X' },
            { id: 'radius', label: 'RADIUS' },
            { id: 'tls', label: 'TLS' }
          ],
          right: [
            { id: 'dwifi', label: 'Encrypts wireless traffic' },
            { id: 'dnac', label: 'Port-based network access control' },
            { id: 'dauth', label: 'Centralized authentication server' },
            { id: 'dtransit', label: 'Encrypts data in transit (HTTPS)' }
          ]
        },
        answer: { pairs: { wpa2: 'dwifi', dot1x: 'dnac', radius: 'dauth', tls: 'dtransit' } } }
    ]
  },

  {
    id: 'np-seed-vlan-fillin-1', cert: 'netplus', objective: '2.3', topic: 'VLANs',
    title: 'Tag the trunk', estMinutes: 3,
    scenario: 'A switch carries several VLANs to another switch and one VLAN to a PC. Answer both fields.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'What standard tags frames so a trunk can carry multiple VLANs?',
        explanation: '802.1Q inserts a VLAN tag into the Ethernet frame so a single trunk link can carry many VLANs.',
        payload: { fields: [{ id: 'tag', label: 'Tagging standard', inputmode: 'text' }] },
        answer: { tag: ['802.1Q', 'dot1q', '802.1q'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'What is the port type that carries a single VLAN to an end device called?',
        explanation: 'An access port carries exactly one untagged VLAN to an end device such as a PC.',
        payload: { fields: [{ id: 'port', label: 'Port type', inputmode: 'text' }] },
        answer: { port: ['access', 'access port'] } }
    ]
  },

  {
    id: 'np-seed-nxdomain-analyze-1', cert: 'netplus', objective: '5.5', topic: 'DNS troubleshooting',
    title: 'Read the nslookup', estMinutes: 2,
    scenario: 'A user cannot reach a site by name. You run nslookup; the output is below. Click the single line that shows the name failed to resolve.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the line that shows DNS could not resolve the name.',
        explanation: 'NXDOMAIN means the name does not exist in DNS, so resolution failed. The server lines just show which resolver answered.',
        payload: {
          multi: false,
          lines: [
            { id: 'srv', text: 'Server:  8.8.8.8' },
            { id: 'adr', text: 'Address:  8.8.8.8#53' },
            { id: 'nx', text: "** server can't find www.example-corp.com: NXDOMAIN" }
          ]
        },
        answer: { selected: ['nx'] } }
    ]
  },

  {
    id: 'np-seed-stp-order-1', cert: 'netplus', objective: '2.3', topic: 'Spanning Tree',
    title: 'Order the STP port states', estMinutes: 3,
    scenario: 'A switch port comes up and runs Spanning Tree Protocol. Put the port states in the order STP moves through, first state at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the STP port states in transition order.',
        explanation: 'Classic STP moves a forwarding port through Blocking, then Listening, then Learning, then Forwarding.',
        payload: { items: [
          { id: 'learn', label: 'Learning' },
          { id: 'block', label: 'Blocking' },
          { id: 'fwd', label: 'Forwarding' },
          { id: 'listen', label: 'Listening' }
        ] },
        answer: { correctOrder: ['block', 'listen', 'learn', 'fwd'] } }
    ]
  },

  {
    id: 'np-seed-availability-match-1', cert: 'netplus', objective: '3.3', topic: 'Availability',
    title: 'Match the availability technology', estMinutes: 3,
    scenario: 'Match each technology to what it provides.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each technology with its purpose.',
        explanation: 'QoS prioritizes certain traffic. A load balancer spreads traffic across multiple servers. FHRP (VRRP/HSRP) provides a redundant default gateway. NIC teaming combines NICs for redundancy and throughput.',
        payload: {
          left: [
            { id: 'qos', label: 'QoS' },
            { id: 'lb', label: 'Load balancer' },
            { id: 'fhrp', label: 'VRRP / HSRP' },
            { id: 'team', label: 'NIC teaming' }
          ],
          right: [
            { id: 'dprio', label: 'Prioritizes certain traffic types' },
            { id: 'dspread', label: 'Distributes traffic across multiple servers' },
            { id: 'dgw', label: 'Provides a redundant default gateway' },
            { id: 'dnic', label: 'Combines NICs for redundancy and throughput' }
          ]
        },
        answer: { pairs: { qos: 'dprio', lb: 'dspread', fhrp: 'dgw', team: 'dnic' } } }
    ]
  },

  {
    id: 'np-seed-mask-order-1', cert: 'netplus', objective: '1.4', topic: 'Subnetting',
    title: 'Order masks by host count', estMinutes: 2,
    scenario: 'Put these subnet sizes in order from the most usable hosts at the top to the fewest at the bottom.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the prefixes from most usable hosts to fewest.',
        explanation: 'Each added prefix bit halves the hosts: /24 = 254 usable, /25 = 126, /26 = 62, /27 = 30. A smaller prefix number means more hosts.',
        payload: { items: [
          { id: 'm27', label: '/27' },
          { id: 'm24', label: '/24' },
          { id: 'm26', label: '/26' },
          { id: 'm25', label: '/25' }
        ] },
        answer: { correctOrder: ['m24', 'm25', 'm26', 'm27'] } }
    ]
  },

  {
    id: 'np-seed-ipv6-types-cat-1', cert: 'netplus', objective: '1.8', topic: 'IPv6 addressing',
    title: 'Classify the IPv6 address', estMinutes: 3,
    scenario: 'Sort each IPv6 address by its type.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each address under its type.',
        explanation: '2001:db8::1 is global unicast (2000::/3). fe80::1 is link-local (fe80::/10). ::1 is the loopback. ff02::1 is multicast (ff00::/8).',
        payload: {
          items: [
            { id: 'g', label: '2001:db8::1' },
            { id: 'll', label: 'fe80::1' },
            { id: 'lo', label: '::1' },
            { id: 'mc', label: 'ff02::1' }
          ],
          buckets: [
            { id: 'gu', label: 'Global unicast' },
            { id: 'link', label: 'Link-local' },
            { id: 'loop', label: 'Loopback' },
            { id: 'multi', label: 'Multicast' }
          ]
        },
        answer: { map: { g: 'gu', ll: 'link', lo: 'loop', mc: 'multi' } } }
    ]
  },

  {
    id: 'np-seed-wifi-signal-analyze-1', cert: 'netplus', objective: '5.4', topic: 'Wireless troubleshooting',
    title: 'Read the wireless survey', estMinutes: 2,
    scenario: 'A laptop keeps dropping Wi-Fi. The survey for its connection is below. Click the single line that explains the drops.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the line that shows the signal is too weak.',
        explanation: 'Wi-Fi RSSI around -30 to -67 dBm is strong; -82 dBm is very weak and causes drops and retries. Channel and security here are fine.',
        payload: {
          multi: false,
          lines: [
            { id: 'ssid', text: 'SSID: CorpWiFi' },
            { id: 'sig', text: 'Signal: -82 dBm' },
            { id: 'ch', text: 'Channel: 6' },
            { id: 'sec', text: 'Security: WPA2' }
          ]
        },
        answer: { selected: ['sig'] } }
    ]
  },

  {
    id: 'np-seed-ipv4-class-match-1', cert: 'netplus', objective: '1.4', topic: 'IPv4 classes',
    title: 'Match the IPv4 class', estMinutes: 2,
    scenario: 'Match each classful IPv4 class to its first-octet range.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each class with its first-octet range.',
        explanation: 'Class A = 1-126, Class B = 128-191, Class C = 192-223. (127 is reserved for loopback.)',
        payload: {
          left: [
            { id: 'ca', label: 'Class A' },
            { id: 'cb', label: 'Class B' },
            { id: 'cc', label: 'Class C' }
          ],
          right: [
            { id: 'ra', label: '1 - 126' },
            { id: 'rb', label: '128 - 191' },
            { id: 'rc', label: '192 - 223' }
          ]
        },
        answer: { pairs: { ca: 'ra', cb: 'rb', cc: 'rc' } } }
    ]
  },

  {
    id: 'np-seed-poe-fillin-1', cert: 'netplus', objective: '1.5', topic: 'Cabling and power',
    title: 'Power and distance', estMinutes: 3,
    scenario: 'You are running cable to a ceiling access point with no nearby outlet. Answer both fields.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'What technology delivers power to the device over the data cable?',
        explanation: 'Power over Ethernet (PoE) sends DC power over the same twisted-pair cable that carries data, so the AP needs no separate outlet.',
        payload: { fields: [{ id: 'tech', label: 'Technology', inputmode: 'text' }] },
        answer: { tech: ['PoE', 'power over ethernet'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'What is the maximum copper Ethernet run, in meters?',
        explanation: 'Twisted-pair copper Ethernet is limited to 100 meters per channel.',
        payload: { fields: [{ id: 'len', label: 'Max length (m)', inputmode: 'numeric' }] },
        answer: { len: ['100'] } }
    ]
  },

  {
    id: 'np-seed-secure-cat-1', cert: 'netplus', objective: '4.3', topic: 'Secure protocols',
    title: 'Encrypted or cleartext', estMinutes: 3,
    scenario: 'Sort each protocol by whether it encrypts traffic or sends it in cleartext.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each protocol under Encrypted or Cleartext.',
        explanation: 'HTTPS, SSH, and SFTP encrypt their traffic. Telnet, FTP, and HTTP send data in cleartext, including credentials.',
        payload: {
          items: [
            { id: 'https', label: 'HTTPS' },
            { id: 'ssh', label: 'SSH' },
            { id: 'sftp', label: 'SFTP' },
            { id: 'telnet', label: 'Telnet' },
            { id: 'ftp', label: 'FTP' },
            { id: 'http', label: 'HTTP' }
          ],
          buckets: [
            { id: 'enc', label: 'Encrypted' },
            { id: 'clear', label: 'Cleartext' }
          ]
        },
        answer: { map: { https: 'enc', ssh: 'enc', sftp: 'enc', telnet: 'clear', ftp: 'clear', http: 'clear' } } }
    ]
  },

  {
    id: 'np-seed-routing-match-1', cert: 'netplus', objective: '2.2', topic: 'Routing protocols',
    title: 'Match the routing protocol', estMinutes: 3,
    scenario: 'Match each routing protocol to its category.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each protocol with its type.',
        explanation: 'OSPF is a link-state protocol, RIP is distance-vector, and BGP is a path-vector protocol used between autonomous systems.',
        payload: {
          left: [
            { id: 'ospf', label: 'OSPF' },
            { id: 'rip', label: 'RIP' },
            { id: 'bgp', label: 'BGP' }
          ],
          right: [
            { id: 'ls', label: 'Link-state' },
            { id: 'dv', label: 'Distance-vector' },
            { id: 'pv', label: 'Path-vector (between autonomous systems)' }
          ]
        },
        answer: { pairs: { ospf: 'ls', rip: 'dv', bgp: 'pv' } } }
    ]
  },

  {
    id: 'np-seed-traceroute-analyze-1', cert: 'netplus', objective: '5.3', topic: 'Connectivity tools',
    title: 'Read the traceroute', estMinutes: 2,
    scenario: 'A traceroute to a remote server stops partway. The output is below. Click the last hop that replied before the trace broke.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the last hop that responded.',
        explanation: 'The last hop that returned a time is where the path was still working. Hops after it time out, so the problem is at or beyond that last good hop (10.5.0.1).',
        payload: {
          multi: false,
          lines: [
            { id: 'h1', text: '1   1 ms   gateway [10.0.0.1]' },
            { id: 'h2', text: '2   8 ms   10.5.0.1' },
            { id: 'h3', text: '3   *   *   Request timed out' },
            { id: 'h4', text: '4   *   *   Request timed out' }
          ]
        },
        answer: { selected: ['h2'] } }
    ]
  },

  {
    id: 'np-seed-dhcp-terms-fillin-1', cert: 'netplus', objective: '1.6', topic: 'DHCP',
    title: 'DHCP vocabulary', estMinutes: 3,
    scenario: 'A server hands out addresses, and one printer must always get the same one. Answer both fields.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'What is the range of addresses a DHCP server hands out called?',
        explanation: 'The scope is the pool of addresses a DHCP server is configured to lease on a subnet.',
        payload: { fields: [{ id: 'pool', label: 'Address range', inputmode: 'text' }] },
        answer: { pool: ['scope'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'What is a fixed lease tied to a device MAC address called?',
        explanation: 'A reservation binds a specific address to a MAC, so that device always gets the same IP from DHCP.',
        payload: { fields: [{ id: 'fixed', label: 'Fixed lease', inputmode: 'text' }] },
        answer: { fixed: ['reservation'] } }
    ]
  },

  {
    id: 'np-seed-mask-mismatch-analyze-1', cert: 'netplus', objective: '5.5', topic: 'IP misconfiguration',
    title: 'Find the wrong mask', estMinutes: 2,
    scenario: 'Two hosts on the same LAN cannot talk to each other. Their settings are below. Click the single line with the misconfigured subnet mask.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the line whose subnet mask does not match the others.',
        explanation: 'Host A and the gateway use /24 (255.255.255.0). Host B is set to 255.255.255.192 (/26), so it calculates a different network and cannot reach the others locally.',
        payload: {
          multi: false,
          lines: [
            { id: 'ha', text: 'Host A: 192.168.1.10   mask 255.255.255.0' },
            { id: 'hb', text: 'Host B: 192.168.1.20   mask 255.255.255.192' },
            { id: 'gw', text: 'Gateway: 192.168.1.1   mask 255.255.255.0' }
          ]
        },
        answer: { selected: ['hb'] } }
    ]
  },

  {
    id: 'np-seed-docs-match-1', cert: 'netplus', objective: '3.2', topic: 'Documentation',
    title: 'Match the documentation artifact', estMinutes: 3,
    scenario: 'Match each operations artifact to what it provides.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each artifact with its purpose.',
        explanation: 'A network diagram shows the layout of devices and links. A baseline records normal performance for later comparison. An asset inventory lists hardware and software. Syslog centralizes log collection.',
        payload: {
          left: [
            { id: 'diag', label: 'Network diagram' },
            { id: 'base', label: 'Baseline' },
            { id: 'inv', label: 'Asset inventory' },
            { id: 'sys', label: 'Syslog' }
          ],
          right: [
            { id: 'dlayout', label: 'Layout of devices and links' },
            { id: 'dnormal', label: 'Normal performance for comparison' },
            { id: 'dlist', label: 'List of hardware and software' },
            { id: 'dlogs', label: 'Centralized log collection' }
          ]
        },
        answer: { pairs: { diag: 'dlayout', base: 'dnormal', inv: 'dlist', sys: 'dlogs' } } }
    ]
  },

  {
    id: 'np-seed-subnet-capstone-1', cert: 'netplus', objective: '1.4', topic: 'Subnetting',
    title: 'Size for 500 hosts', estMinutes: 4,
    scenario: 'A flat subnet must hold up to 500 hosts. Answer both fields.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'What is the smallest CIDR prefix that fits 500 hosts?',
        explanation: '/23 = 512 addresses, 510 usable, the smallest block that holds 500 hosts. A /24 (254 usable) is too small.',
        payload: { fields: [{ id: 'cidr', label: 'CIDR prefix', inputmode: 'text' }] },
        answer: { cidr: ['/23', '23'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'How many usable hosts does that prefix provide?',
        explanation: '2^9 - 2 = 510 usable host addresses.',
        payload: { fields: [{ id: 'hosts', label: 'Usable hosts', inputmode: 'numeric' }] },
        answer: { hosts: ['510'] } }
    ]
  }
];

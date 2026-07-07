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
  },

  // 1 — wrong-subnet host IP, 192.168.x, VLAN framing
  {
    id: 'np-diag-branch-vlan10-hostip',
    cert: 'netplus', objective: '1.4', topic: 'Subnetting',
    title: 'Fix the stranded Staff PC',
    estMinutes: 4, archetype: 'diagram',
    scenario: 'The Mercer & Hale branch office runs two VLANs: Staff (VLAN 10, 192.168.10.0/24) and Guest (VLAN 20, 192.168.20.0/24). A Staff user cannot reach the internal file server or the internet, while everyone else is fine. Inspect the diagram and fix the misconfigured host.',
    assets: { reference: { kind: 'network',
      given: { networkId: '192.168.10.0', mask: '255.255.255.0' },
      devices: [
        { id: 'rtr1', label: 'RTR-1', type: 'router', zone: 'core', ip: '192.168.10.1', mask: '255.255.255.0', x: 3, y: 0 },
        { id: 'swa', label: 'SW-A', type: 'switch', zone: 'staff', ip: '192.168.10.2', mask: '255.255.255.0', x: 1, y: 1 },
        { id: 'fs1', label: 'FS-1', type: 'server', zone: 'staff', ip: '192.168.10.20', mask: '255.255.255.0', gateway: '192.168.10.1', x: 0, y: 2 },
        { id: 'pc2', label: 'PC-2', type: 'pc', zone: 'staff', ip: '192.168.20.45', mask: '255.255.255.0', gateway: '192.168.20.1', x: 1, y: 2, state: 'affected' }
      ],
      links: [ { from: 'rtr1', to: 'swa' }, { from: 'swa', to: 'fs1' }, { from: 'swa', to: 'pc2' } ]
    } },
    steps: [
      { id: 's1', type: 'configure', points: 1, deviceId: 'pc2',
        prompt: 'Fix PC-2’s IP configuration so it can reach FS-1 and the internet.',
        explanation: 'PC-2 sits in VLAN 10 but was assigned a Guest-subnet address. It needs a 192.168.10.x address and the VLAN 10 gateway to rejoin its own subnet.',
        payload: { slots: [
          { id: 'ip', label: 'PC-2 IP address', options: [
            { id: 'a', text: '192.168.10.45' }, { id: 'b', text: '192.168.20.45' }, { id: 'c', text: '10.0.10.45' } ] },
          { id: 'gateway', label: 'PC-2 default gateway', options: [
            { id: 'a', text: '192.168.10.1' }, { id: 'b', text: '192.168.20.1' }, { id: 'c', text: '192.168.1.1' } ] }
        ] },
        answer: { slots: { ip: 'a', gateway: 'a' } } }
    ]
  },

  // 2 — wrong subnet mask, /25 vs /24 boundary
  {
    id: 'np-diag-mask-boundary-25',
    cert: 'netplus', objective: '1.4', topic: 'Subnetting',
    title: 'Correct the /25 mask mismatch',
    estMinutes: 4, archetype: 'diagram',
    scenario: 'A small office subnet 192.168.30.0/24 hosts a router, a switch, and three PCs. One PC was imaged from a template used for a smaller /25 segment elsewhere and cannot see the rest of the LAN even though its IP looks fine at a glance.',
    assets: { reference: { kind: 'network',
      given: { networkId: '192.168.30.0', mask: '255.255.255.0' },
      devices: [
        { id: 'rtr1', label: 'RTR-1', type: 'router', zone: 'lan', ip: '192.168.30.1', mask: '255.255.255.0', x: 2, y: 0 },
        { id: 'sw1', label: 'SW-1', type: 'switch', zone: 'lan', ip: '192.168.30.2', mask: '255.255.255.0', x: 2, y: 1 },
        { id: 'pc1', label: 'PC-1', type: 'pc', zone: 'lan', ip: '192.168.30.10', mask: '255.255.255.0', gateway: '192.168.30.1', x: 1, y: 2 },
        { id: 'pc3', label: 'PC-3', type: 'pc', zone: 'lan', ip: '192.168.30.140', mask: '255.255.255.128', gateway: '192.168.30.1', x: 3, y: 2, state: 'affected' }
      ],
      links: [ { from: 'rtr1', to: 'sw1' }, { from: 'sw1', to: 'pc1' }, { from: 'sw1', to: 'pc3' } ]
    } },
    steps: [
      { id: 's1', type: 'configure', points: 1, deviceId: 'pc3',
        prompt: 'PC-3’s IP is correct but it still can’t reach the rest of the LAN. Fix its subnet mask.',
        explanation: 'PC-3 holds a /25 mask (255.255.255.128) while the documented LAN is a /24 (255.255.255.0). With that /25 mask, PC-3’s address .140 falls in the upper half (.128–.255) while RTR-1, SW-1, and PC-1 sit in the lower half (.0–.127), so PC-3 sees them as a different network even though its IP itself is fine. Restoring the /24 mask puts PC-3 back in the single 192.168.30.0/24 block with everyone else.',
        payload: { slots: [
          { id: 'mask', label: 'PC-3 subnet mask', options: [
            { id: 'a', text: '255.255.255.0' }, { id: 'b', text: '255.255.255.128' }, { id: 'c', text: '255.255.255.192' } ] }
        ] },
        answer: { slots: { mask: 'a' } } }
    ]
  },

  // 3 — wrong default gateway, 10.x base
  {
    id: 'np-diag-datacenter-wrong-gw',
    cert: 'netplus', objective: '1.4', topic: 'Default gateways',
    title: 'Point the app server at the right gateway',
    estMinutes: 4, archetype: 'diagram',
    scenario: 'A small data-center segment 10.20.30.0/24 hosts a router, a switch, a database server, and an application server. The app server can reach other hosts on the segment but cannot reach anything off-segment.',
    assets: { reference: { kind: 'network',
      given: { networkId: '10.20.30.0', mask: '255.255.255.0' },
      devices: [
        { id: 'rtr1', label: 'RTR-1', type: 'router', zone: 'dc', ip: '10.20.30.1', mask: '255.255.255.0', x: 2, y: 0 },
        { id: 'sw1', label: 'SW-1', type: 'switch', zone: 'dc', ip: '10.20.30.2', mask: '255.255.255.0', x: 2, y: 1 },
        { id: 'db1', label: 'DB-1', type: 'server', zone: 'dc', ip: '10.20.30.10', mask: '255.255.255.0', gateway: '10.20.30.1', x: 1, y: 2 },
        { id: 'app1', label: 'APP-1', type: 'server', zone: 'dc', ip: '10.20.30.15', mask: '255.255.255.0', gateway: '10.20.31.1', x: 3, y: 2, state: 'affected' }
      ],
      links: [ { from: 'rtr1', to: 'sw1' }, { from: 'sw1', to: 'db1' }, { from: 'sw1', to: 'app1' } ]
    } },
    steps: [
      { id: 's1', type: 'configure', points: 1, deviceId: 'app1',
        prompt: 'APP-1 has a correct IP but no off-segment reachability. Fix its default gateway.',
        explanation: 'APP-1 was pointed at 10.20.31.1, an address on a different /24. The router’s actual interface on this segment is 10.20.30.1, so all off-segment traffic was silently dropped at the host.',
        payload: { slots: [
          { id: 'gateway', label: 'APP-1 default gateway', options: [
            { id: 'a', text: '10.20.30.1' }, { id: 'b', text: '10.20.31.1' }, { id: 'c', text: '10.30.30.1' } ] }
        ] },
        answer: { slots: { gateway: 'a' } } }
    ]
  },

  // 4 — off-by-one octet into wrong subnet, 172.16-31 range
  {
    id: 'np-diag-offbyone-172',
    cert: 'netplus', objective: '1.4', topic: 'Subnetting',
    title: 'Catch the off-by-one subnet',
    estMinutes: 4, archetype: 'diagram',
    scenario: 'Warehouse network 172.20.5.0/24 connects a router, a switch, a scanner terminal, and a workstation. The workstation was recently swapped and now can’t print to the scanner terminal’s shared queue even though its address "looks close enough."',
    assets: { reference: { kind: 'network',
      given: { networkId: '172.20.5.0', mask: '255.255.255.0' },
      devices: [
        { id: 'rtr1', label: 'RTR-1', type: 'router', zone: 'wh', ip: '172.20.5.1', mask: '255.255.255.0', x: 2, y: 0 },
        { id: 'sw1', label: 'SW-1', type: 'switch', zone: 'wh', ip: '172.20.5.2', mask: '255.255.255.0', x: 2, y: 1 },
        { id: 'scan1', label: 'SCAN-1', type: 'pc', zone: 'wh', ip: '172.20.5.30', mask: '255.255.255.0', gateway: '172.20.5.1', x: 1, y: 2 },
        { id: 'wks5', label: 'WKS-5', type: 'pc', zone: 'wh', ip: '172.20.6.31', mask: '255.255.255.0', gateway: '172.20.5.1', x: 3, y: 2, state: 'affected' }
      ],
      links: [ { from: 'rtr1', to: 'sw1' }, { from: 'sw1', to: 'scan1' }, { from: 'sw1', to: 'wks5' } ]
    } },
    steps: [
      { id: 's1', type: 'configure', points: 1, deviceId: 'wks5',
        prompt: 'WKS-5’s address is one octet off from the documented subnet. Fix its IP.',
        explanation: '172.20.6.31 falls in the 172.20.6.0/24 network, not 172.20.5.0/24 — a single-octet slip that fully isolates the host from the local segment despite an otherwise plausible-looking address.',
        payload: { slots: [
          { id: 'ip', label: 'WKS-5 IP address', options: [
            { id: 'a', text: '172.20.5.31' }, { id: 'b', text: '172.20.6.31' }, { id: 'c', text: '172.30.5.31' } ] }
        ] },
        answer: { slots: { ip: 'a' } } }
    ]
  },

  // 5 — wrong host IP, small office, 192.168.x
  {
    id: 'np-diag-printer-wrong-net',
    cert: 'netplus', objective: '1.4', topic: 'IPv4 addressing',
    title: 'Bring the network printer back on-subnet',
    estMinutes: 4, archetype: 'diagram',
    scenario: 'A dentist office LAN 192.168.5.0/24 has a router, a switch, a front-desk PC, and a networked printer. Nobody in the office can print, though the printer powers on and shows a link light.',
    assets: { reference: { kind: 'network',
      given: { networkId: '192.168.5.0', mask: '255.255.255.0' },
      devices: [
        { id: 'rtr1', label: 'RTR-1', type: 'router', zone: 'office', ip: '192.168.5.1', mask: '255.255.255.0', x: 2, y: 0 },
        { id: 'sw1', label: 'SW-1', type: 'switch', zone: 'office', ip: '192.168.5.2', mask: '255.255.255.0', x: 2, y: 1 },
        { id: 'pc1', label: 'FRONT-PC', type: 'pc', zone: 'office', ip: '192.168.5.10', mask: '255.255.255.0', gateway: '192.168.5.1', x: 1, y: 2 },
        { id: 'prn1', label: 'PRN-1', type: 'printer', zone: 'office', ip: '192.168.4.50', mask: '255.255.255.0', gateway: '192.168.5.1', x: 3, y: 2, state: 'affected' }
      ],
      links: [ { from: 'rtr1', to: 'sw1' }, { from: 'sw1', to: 'pc1' }, { from: 'sw1', to: 'prn1' } ]
    } },
    steps: [
      { id: 's1', type: 'configure', points: 1, deviceId: 'prn1',
        prompt: 'PRN-1 was configured on the wrong network. Fix its IP address.',
        explanation: 'PRN-1 holds 192.168.4.50, which belongs to a different /24 than the office LAN (192.168.5.0/24). Correcting the third octet returns it to the documented subnet.',
        payload: { slots: [
          { id: 'ip', label: 'PRN-1 IP address', options: [
            { id: 'a', text: '192.168.5.50' }, { id: 'b', text: '192.168.4.50' }, { id: 'c', text: '192.168.50.5' } ] }
        ] },
        answer: { slots: { ip: 'a' } } }
    ]
  },

  // 6 — wrong gateway, 172.16-31 range
  {
    id: 'np-diag-lab-wrong-gw-172',
    cert: 'netplus', objective: '1.4', topic: 'Default gateways',
    title: 'Repair the lab workstation gateway',
    estMinutes: 4, archetype: 'diagram',
    scenario: 'A university lab segment 172.24.8.0/24 has a router, a switch, a lab server, and a student workstation. The workstation can reach the lab server but no internet resources.',
    assets: { reference: { kind: 'network',
      given: { networkId: '172.24.8.0', mask: '255.255.255.0' },
      devices: [
        { id: 'rtr1', label: 'RTR-1', type: 'router', zone: 'lab', ip: '172.24.8.1', mask: '255.255.255.0', x: 2, y: 0 },
        { id: 'sw1', label: 'SW-1', type: 'switch', zone: 'lab', ip: '172.24.8.2', mask: '255.255.255.0', x: 2, y: 1 },
        { id: 'srv1', label: 'LAB-SRV', type: 'server', zone: 'lab', ip: '172.24.8.5', mask: '255.255.255.0', gateway: '172.24.8.1', x: 1, y: 2 },
        { id: 'wks9', label: 'WKS-9', type: 'pc', zone: 'lab', ip: '172.24.8.90', mask: '255.255.255.0', gateway: '172.24.9.1', x: 3, y: 2, state: 'affected' }
      ],
      links: [ { from: 'rtr1', to: 'sw1' }, { from: 'sw1', to: 'srv1' }, { from: 'sw1', to: 'wks9' } ]
    } },
    steps: [
      { id: 's1', type: 'configure', points: 1, deviceId: 'wks9',
        prompt: 'WKS-9 reaches local hosts but not the internet. Fix its default gateway.',
        explanation: 'WKS-9 points to 172.24.9.1, an address outside the 172.24.8.0/24 lab subnet, so off-subnet packets are never forwarded. The correct gateway is the router’s interface on this segment, 172.24.8.1.',
        payload: { slots: [
          { id: 'gateway', label: 'WKS-9 default gateway', options: [
            { id: 'a', text: '172.24.8.1' }, { id: 'b', text: '172.24.9.1' }, { id: 'c', text: '172.16.8.1' } ] }
        ] },
        answer: { slots: { gateway: 'a' } } }
    ]
  },

  // 7 — diagnose + reconfigure, 10.x, wrong host IP
  {
    id: 'np-diag-hq-diagnose-ip',
    cert: 'netplus', objective: '1.4', topic: 'Subnetting',
    title: 'Diagnose then fix the HQ finance PC',
    estMinutes: 5, archetype: 'diagram',
    scenario: 'HQ finance segment 10.10.40.0/24 has a router, a switch, a file server, and a finance PC. The finance user reports the shared drive times out and pings to the file server fail.',
    assets: { reference: { kind: 'network',
      given: { networkId: '10.10.40.0', mask: '255.255.255.0' },
      devices: [
        { id: 'rtr1', label: 'RTR-1', type: 'router', zone: 'finance', ip: '10.10.40.1', mask: '255.255.255.0', x: 2, y: 0 },
        { id: 'sw1', label: 'SW-1', type: 'switch', zone: 'finance', ip: '10.10.40.2', mask: '255.255.255.0', x: 2, y: 1 },
        { id: 'fs2', label: 'FS-2', type: 'server', zone: 'finance', ip: '10.10.40.20', mask: '255.255.255.0', gateway: '10.10.40.1', x: 1, y: 2 },
        { id: 'pcf1', label: 'PC-F1', type: 'pc', zone: 'finance', ip: '10.10.41.77', mask: '255.255.255.0', gateway: '10.10.40.1', x: 3, y: 2, state: 'affected' }
      ],
      links: [ { from: 'rtr1', to: 'sw1' }, { from: 'sw1', to: 'fs2' }, { from: 'sw1', to: 'pcf1' } ]
    } },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Which device is misconfigured?',
        explanation: 'PC-F1 holds 10.10.41.77, a different /24 than the documented finance subnet 10.10.40.0/24, stranding it from FS-2.',
        payload: { slots: [
          { id: 'device', label: 'Misconfigured device', options: [
            { id: 'a', text: 'FS-2' }, { id: 'b', text: 'PC-F1' }, { id: 'c', text: 'RTR-1' } ] }
        ] },
        answer: { slots: { device: 'b' } } },
      { id: 's2', type: 'configure', points: 1, deviceId: 'pcf1',
        prompt: 'Fix PC-F1’s IP address so it can reach FS-2.',
        explanation: 'Changing the third octet from 41 to 40 places PC-F1 back inside the documented 10.10.40.0/24 subnet.',
        payload: { slots: [
          { id: 'ip', label: 'PC-F1 IP address', options: [
            { id: 'a', text: '10.10.40.77' }, { id: 'b', text: '10.10.41.77' }, { id: 'c', text: '10.40.10.77' } ] }
        ] },
        answer: { slots: { ip: 'a' } } }
    ]
  },

  // 8 — wrong mask, /26 vs /24, 192.168.x
  {
    id: 'np-diag-mask-26-retail',
    cert: 'netplus', objective: '1.4', topic: 'Subnetting',
    title: 'Widen the retail POS mask',
    estMinutes: 4, archetype: 'diagram',
    scenario: 'A retail store LAN 192.168.60.0/24 hosts a router, a switch, a POS terminal, and a back-office PC. The POS terminal cannot process card transactions that route through the back-office PC’s validation service.',
    assets: { reference: { kind: 'network',
      given: { networkId: '192.168.60.0', mask: '255.255.255.0' },
      devices: [
        { id: 'rtr1', label: 'RTR-1', type: 'router', zone: 'store', ip: '192.168.60.1', mask: '255.255.255.0', x: 2, y: 0 },
        { id: 'sw1', label: 'SW-1', type: 'switch', zone: 'store', ip: '192.168.60.2', mask: '255.255.255.0', x: 2, y: 1 },
        { id: 'office1', label: 'OFFICE-PC', type: 'pc', zone: 'store', ip: '192.168.60.15', mask: '255.255.255.0', gateway: '192.168.60.1', x: 1, y: 2 },
        { id: 'pos1', label: 'POS-1', type: 'pc', zone: 'store', ip: '192.168.60.80', mask: '255.255.255.192', gateway: '192.168.60.1', x: 3, y: 2, state: 'affected' }
      ],
      links: [ { from: 'rtr1', to: 'sw1' }, { from: 'sw1', to: 'office1' }, { from: 'sw1', to: 'pos1' } ]
    } },
    steps: [
      { id: 's1', type: 'configure', points: 1, deviceId: 'pos1',
        prompt: 'POS-1’s mask is too narrow for the LAN. Fix it.',
        explanation: 'POS-1 carries a /26 mask (255.255.255.192), which only spans 192.168.60.64–.127. OFFICE-PC at .15 falls outside that range from POS-1’s point of view, so POS-1 treats it as remote. The documented LAN mask is /24.',
        payload: { slots: [
          { id: 'mask', label: 'POS-1 subnet mask', options: [
            { id: 'a', text: '255.255.255.0' }, { id: 'b', text: '255.255.255.192' }, { id: 'c', text: '255.255.255.224' } ] }
        ] },
        answer: { slots: { mask: 'a' } } }
    ]
  },

  // 9 — wrong host IP, 10.x, server
  {
    id: 'np-diag-backup-server-wrongnet',
    cert: 'netplus', objective: '1.4', topic: 'Subnetting',
    title: 'Recover the backup server’s address',
    estMinutes: 4, archetype: 'diagram',
    scenario: 'A backup segment 10.5.5.0/24 has a router, a switch, a primary server, and a backup server. Scheduled backups have been failing to connect all week.',
    assets: { reference: { kind: 'network',
      given: { networkId: '10.5.5.0', mask: '255.255.255.0' },
      devices: [
        { id: 'rtr1', label: 'RTR-1', type: 'router', zone: 'backup', ip: '10.5.5.1', mask: '255.255.255.0', x: 2, y: 0 },
        { id: 'sw1', label: 'SW-1', type: 'switch', zone: 'backup', ip: '10.5.5.2', mask: '255.255.255.0', x: 2, y: 1 },
        { id: 'prim1', label: 'PRIMARY-1', type: 'server', zone: 'backup', ip: '10.5.5.10', mask: '255.255.255.0', gateway: '10.5.5.1', x: 1, y: 2 },
        { id: 'bkp1', label: 'BACKUP-1', type: 'server', zone: 'backup', ip: '10.6.5.10', mask: '255.255.255.0', gateway: '10.5.5.1', x: 3, y: 2, state: 'affected' }
      ],
      links: [ { from: 'rtr1', to: 'sw1' }, { from: 'sw1', to: 'prim1' }, { from: 'sw1', to: 'bkp1' } ]
    } },
    steps: [
      { id: 's1', type: 'configure', points: 1, deviceId: 'bkp1',
        prompt: 'BACKUP-1 sits on the wrong network. Fix its IP address.',
        explanation: 'BACKUP-1 was assigned 10.6.5.10 instead of an address in 10.5.5.0/24, isolating it from PRIMARY-1 despite both being cabled to the same switch.',
        payload: { slots: [
          { id: 'ip', label: 'BACKUP-1 IP address', options: [
            { id: 'a', text: '10.5.5.10' }, { id: 'b', text: '10.6.5.10' }, { id: 'c', text: '10.5.6.10' } ] }
        ] },
        answer: { slots: { ip: 'a' } },
      }
    ]
  },

  // 10 — wrong gateway, VLAN framing, 192.168.x
  {
    id: 'np-diag-vlan20-wrong-gw',
    cert: 'netplus', objective: '1.4', topic: 'VLANs',
    title: 'Fix the Guest VLAN gateway',
    estMinutes: 4, archetype: 'diagram',
    scenario: 'Guest Wi-Fi VLAN 20 (192.168.20.0/24) serves visitor devices behind an access switch. A guest laptop connects and gets an in-range IP but reports "no internet" while other guests are fine.',
    assets: { reference: { kind: 'network',
      given: { networkId: '192.168.20.0', mask: '255.255.255.0' },
      devices: [
        { id: 'rtr1', label: 'RTR-1', type: 'router', zone: 'guest', ip: '192.168.20.1', mask: '255.255.255.0', x: 2, y: 0 },
        { id: 'swb', label: 'SW-B', type: 'switch', zone: 'guest', ip: '192.168.20.2', mask: '255.255.255.0', x: 2, y: 1 },
        { id: 'pc7', label: 'PC-7', type: 'pc', zone: 'guest', ip: '192.168.20.31', mask: '255.255.255.0', gateway: '192.168.20.1', x: 1, y: 2 },
        { id: 'lap3', label: 'LAP-3', type: 'pc', zone: 'guest', ip: '192.168.20.62', mask: '255.255.255.0', gateway: '192.168.10.1', x: 3, y: 2, state: 'affected' }
      ],
      links: [ { from: 'rtr1', to: 'swb' }, { from: 'swb', to: 'pc7' }, { from: 'swb', to: 'lap3' } ]
    } },
    steps: [
      { id: 's1', type: 'configure', points: 1, deviceId: 'lap3',
        prompt: 'LAP-3 has a valid Guest VLAN address but no internet. Fix its default gateway.',
        explanation: 'LAP-3 was pointed at 192.168.10.1, the Staff VLAN’s gateway, which cannot route Guest-subnet traffic. The correct gateway for VLAN 20 hosts is 192.168.20.1.',
        payload: { slots: [
          { id: 'gateway', label: 'LAP-3 default gateway', options: [
            { id: 'a', text: '192.168.20.1' }, { id: 'b', text: '192.168.10.1' }, { id: 'c', text: '192.168.2.1' } ] }
        ] },
        answer: { slots: { gateway: 'a' } } }
    ]
  },

  // 11 — off-by-one, 10.x
  {
    id: 'np-diag-offbyone-10',
    cert: 'netplus', objective: '1.4', topic: 'IPv4 addressing',
    title: 'Spot the near-miss subnet',
    estMinutes: 4, archetype: 'diagram',
    scenario: 'Engineering LAN 10.15.20.0/24 has a router, a switch, a build server, and an engineer’s workstation. The workstation can browse the internet fine but cannot reach the build server for code deploys.',
    assets: { reference: { kind: 'network',
      given: { networkId: '10.15.20.0', mask: '255.255.255.0' },
      devices: [
        { id: 'rtr1', label: 'RTR-1', type: 'router', zone: 'eng', ip: '10.15.20.1', mask: '255.255.255.0', x: 2, y: 0 },
        { id: 'sw1', label: 'SW-1', type: 'switch', zone: 'eng', ip: '10.15.20.2', mask: '255.255.255.0', x: 2, y: 1 },
        { id: 'build1', label: 'BUILD-1', type: 'server', zone: 'eng', ip: '10.15.20.40', mask: '255.255.255.0', gateway: '10.15.20.1', x: 1, y: 2 },
        { id: 'eng1', label: 'ENG-1', type: 'pc', zone: 'eng', ip: '10.15.21.40', mask: '255.255.255.0', gateway: '10.15.20.1', x: 3, y: 2, state: 'affected' }
      ],
      links: [ { from: 'rtr1', to: 'sw1' }, { from: 'sw1', to: 'build1' }, { from: 'sw1', to: 'eng1' } ]
    } },
    steps: [
      { id: 's1', type: 'configure', points: 1, deviceId: 'eng1',
        prompt: 'ENG-1 can reach the internet through the gateway but not local hosts. Fix its IP address.',
        explanation: 'ENG-1 holds 10.15.21.40 — the third octet is off by one from the documented 10.15.20.0/24 segment, so its local subnet mask excludes BUILD-1 even though the gateway still routes its internet-bound traffic.',
        payload: { slots: [
          { id: 'ip', label: 'ENG-1 IP address', options: [
            { id: 'a', text: '10.15.20.40' }, { id: 'b', text: '10.15.21.40' }, { id: 'c', text: '10.16.20.40' } ] }
        ] },
        answer: { slots: { ip: 'a' } } }
    ]
  },

  // 12 — wrong gateway, small 172 office
  {
    id: 'np-diag-clinic-wrong-gw',
    cert: 'netplus', objective: '1.4', topic: 'Default gateways',
    title: 'Restore the clinic kiosk’s gateway',
    estMinutes: 4, archetype: 'diagram',
    scenario: 'A clinic check-in network 172.18.2.0/24 has a router, a switch, a records server, and a check-in kiosk. The kiosk can reach the records server on the LAN but its cloud scheduling sync has been failing.',
    assets: { reference: { kind: 'network',
      given: { networkId: '172.18.2.0', mask: '255.255.255.0' },
      devices: [
        { id: 'rtr1', label: 'RTR-1', type: 'router', zone: 'clinic', ip: '172.18.2.1', mask: '255.255.255.0', x: 2, y: 0 },
        { id: 'sw1', label: 'SW-1', type: 'switch', zone: 'clinic', ip: '172.18.2.2', mask: '255.255.255.0', x: 2, y: 1 },
        { id: 'rec1', label: 'RECORDS-1', type: 'server', zone: 'clinic', ip: '172.18.2.10', mask: '255.255.255.0', gateway: '172.18.2.1', x: 1, y: 2 },
        { id: 'kiosk1', label: 'KIOSK-1', type: 'pc', zone: 'clinic', ip: '172.18.2.50', mask: '255.255.255.0', gateway: '172.18.3.1', x: 3, y: 2, state: 'affected' }
      ],
      links: [ { from: 'rtr1', to: 'sw1' }, { from: 'sw1', to: 'rec1' }, { from: 'sw1', to: 'kiosk1' } ]
    } },
    steps: [
      { id: 's1', type: 'configure', points: 1, deviceId: 'kiosk1',
        prompt: 'KIOSK-1 syncs locally but not to the cloud. Fix its default gateway.',
        explanation: 'KIOSK-1 points to 172.18.3.1, which is outside the 172.18.2.0/24 clinic subnet, so cloud-bound traffic is never forwarded. The router’s interface on this segment is 172.18.2.1.',
        payload: { slots: [
          { id: 'gateway', label: 'KIOSK-1 default gateway', options: [
            { id: 'a', text: '172.18.2.1' }, { id: 'b', text: '172.18.3.1' }, { id: 'c', text: '172.28.2.1' } ] }
        ] },
        answer: { slots: { gateway: 'a' } } }
    ]
  },

  // 13 — wrong mask, /28 vs /24, 192.168.x with server + 2 PCs
  {
    id: 'np-diag-mask-28-conference',
    cert: 'netplus', objective: '1.4', topic: 'Subnetting',
    title: 'Correct the conference room mask',
    estMinutes: 4, archetype: 'diagram',
    scenario: 'A conference room LAN 192.168.70.0/24 has a router, a switch, a media server, and a presenter’s laptop. The laptop can’t stream to the media server despite a healthy link light.',
    assets: { reference: { kind: 'network',
      given: { networkId: '192.168.70.0', mask: '255.255.255.0' },
      devices: [
        { id: 'rtr1', label: 'RTR-1', type: 'router', zone: 'conf', ip: '192.168.70.1', mask: '255.255.255.0', x: 2, y: 0 },
        { id: 'sw1', label: 'SW-1', type: 'switch', zone: 'conf', ip: '192.168.70.2', mask: '255.255.255.0', x: 2, y: 1 },
        { id: 'media1', label: 'MEDIA-1', type: 'server', zone: 'conf', ip: '192.168.70.20', mask: '255.255.255.0', gateway: '192.168.70.1', x: 1, y: 2 },
        { id: 'lap9', label: 'LAP-9', type: 'pc', zone: 'conf', ip: '192.168.70.35', mask: '255.255.255.240', gateway: '192.168.70.1', x: 3, y: 2, state: 'affected' }
      ],
      links: [ { from: 'rtr1', to: 'sw1' }, { from: 'sw1', to: 'media1' }, { from: 'sw1', to: 'lap9' } ]
    } },
    steps: [
      { id: 's1', type: 'configure', points: 1, deviceId: 'lap9',
        prompt: 'LAP-9’s mask disagrees with the documented LAN. Fix it.',
        explanation: 'LAP-9 carries a /28 mask (255.255.255.240), spanning only 192.168.70.32–.47. MEDIA-1 at .20 falls outside that block from LAP-9’s view. The documented LAN mask is /24.',
        payload: { slots: [
          { id: 'mask', label: 'LAP-9 subnet mask', options: [
            { id: 'a', text: '255.255.255.0' }, { id: 'b', text: '255.255.255.240' }, { id: 'c', text: '255.255.255.248' } ] }
        ] },
        answer: { slots: { mask: 'a' } } }
    ]
  },

  // 14 — diagnose + reconfigure, wrong gateway, 172.16-31
  {
    id: 'np-diag-warehouse-diagnose-gw',
    cert: 'netplus', objective: '1.4', topic: 'Default gateways',
    title: 'Diagnose and repair the scanner gateway',
    estMinutes: 5, archetype: 'diagram',
    scenario: 'Warehouse inventory segment 172.29.12.0/24 has a router, a switch, an inventory server, and a handheld scanner base station. The base station can sync to the inventory server but can’t reach the cloud inventory API.',
    assets: { reference: { kind: 'network',
      given: { networkId: '172.29.12.0', mask: '255.255.255.0' },
      devices: [
        { id: 'rtr1', label: 'RTR-1', type: 'router', zone: 'wh2', ip: '172.29.12.1', mask: '255.255.255.0', x: 2, y: 0 },
        { id: 'sw1', label: 'SW-1', type: 'switch', zone: 'wh2', ip: '172.29.12.2', mask: '255.255.255.0', x: 2, y: 1 },
        { id: 'inv1', label: 'INV-1', type: 'server', zone: 'wh2', ip: '172.29.12.15', mask: '255.255.255.0', gateway: '172.29.12.1', x: 1, y: 2 },
        { id: 'scanbase1', label: 'SCANBASE-1', type: 'pc', zone: 'wh2', ip: '172.29.12.60', mask: '255.255.255.0', gateway: '172.29.13.1', x: 3, y: 2, state: 'affected' }
      ],
      links: [ { from: 'rtr1', to: 'sw1' }, { from: 'sw1', to: 'inv1' }, { from: 'sw1', to: 'scanbase1' } ]
    } },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Which device is misconfigured?',
        explanation: 'SCANBASE-1’s gateway (172.29.13.1) is outside the documented 172.29.12.0/24 subnet, so it cannot forward off-segment traffic to the cloud API.',
        payload: { slots: [
          { id: 'device', label: 'Misconfigured device', options: [
            { id: 'a', text: 'INV-1' }, { id: 'b', text: 'SCANBASE-1' }, { id: 'c', text: 'SW-1' } ] }
        ] },
        answer: { slots: { device: 'b' } } },
      { id: 's2', type: 'configure', points: 1, deviceId: 'scanbase1',
        prompt: 'Fix SCANBASE-1’s default gateway.',
        explanation: 'The router’s interface on this segment is 172.29.12.1; pointing SCANBASE-1 there restores its route to the cloud API.',
        payload: { slots: [
          { id: 'gateway', label: 'SCANBASE-1 default gateway', options: [
            { id: 'a', text: '172.29.12.1' }, { id: 'b', text: '172.29.13.1' }, { id: 'c', text: '172.19.12.1' } ] }
        ] },
        answer: { slots: { gateway: 'a' } } }
    ]
  },

  // 15 — wrong host IP, 192.168.x, small office with 2 PCs + printer
  {
    id: 'np-diag-accounting-wrongnet',
    cert: 'netplus', objective: '1.4', topic: 'Subnetting',
    title: 'Move the accounting PC back on-net',
    estMinutes: 4, archetype: 'diagram',
    scenario: 'Accounting office LAN 192.168.90.0/24 has a router, a switch, a shared printer, and an accounting PC. The accountant can’t print month-end reports and gets destination-unreachable errors.',
    assets: { reference: { kind: 'network',
      given: { networkId: '192.168.90.0', mask: '255.255.255.0' },
      devices: [
        { id: 'rtr1', label: 'RTR-1', type: 'router', zone: 'acct', ip: '192.168.90.1', mask: '255.255.255.0', x: 2, y: 0 },
        { id: 'sw1', label: 'SW-1', type: 'switch', zone: 'acct', ip: '192.168.90.2', mask: '255.255.255.0', x: 2, y: 1 },
        { id: 'prn2', label: 'PRN-2', type: 'printer', zone: 'acct', ip: '192.168.90.25', mask: '255.255.255.0', gateway: '192.168.90.1', x: 1, y: 2 },
        { id: 'actpc1', label: 'ACCT-PC1', type: 'pc', zone: 'acct', ip: '192.168.91.25', mask: '255.255.255.0', gateway: '192.168.90.1', x: 3, y: 2, state: 'affected' }
      ],
      links: [ { from: 'rtr1', to: 'sw1' }, { from: 'sw1', to: 'prn2' }, { from: 'sw1', to: 'actpc1' } ]
    } },
    steps: [
      { id: 's1', type: 'configure', points: 1, deviceId: 'actpc1',
        prompt: 'ACCT-PC1 is on the wrong network. Fix its IP address.',
        explanation: 'ACCT-PC1 holds 192.168.91.25, a different /24 than the documented accounting LAN (192.168.90.0/24), so it cannot reach PRN-2 despite sharing a switch.',
        payload: { slots: [
          { id: 'ip', label: 'ACCT-PC1 IP address', options: [
            { id: 'a', text: '192.168.90.25' }, { id: 'b', text: '192.168.91.25' }, { id: 'c', text: '192.168.9.25' } ] }
        ] },
        answer: { slots: { ip: 'a' } } }
    ]
  },

  // 16 — wrong mask AND wrong gateway (ip-only slot unaffected), 10.x
  {
    id: 'np-diag-remote-office-mask-gw',
    cert: 'netplus', objective: '1.4', topic: 'Subnetting',
    title: 'Fix the remote office workstation fully',
    estMinutes: 5, archetype: 'diagram',
    scenario: 'Remote sales office 10.40.2.0/24 has a router, a switch, a CRM server, and a sales workstation. The salesperson’s workstation can’t log into the CRM server or reach the VPN back to headquarters.',
    assets: { reference: { kind: 'network',
      given: { networkId: '10.40.2.0', mask: '255.255.255.0' },
      devices: [
        { id: 'rtr1', label: 'RTR-1', type: 'router', zone: 'sales', ip: '10.40.2.1', mask: '255.255.255.0', x: 2, y: 0 },
        { id: 'sw1', label: 'SW-1', type: 'switch', zone: 'sales', ip: '10.40.2.2', mask: '255.255.255.0', x: 2, y: 1 },
        { id: 'crm1', label: 'CRM-1', type: 'server', zone: 'sales', ip: '10.40.2.10', mask: '255.255.255.0', gateway: '10.40.2.1', x: 1, y: 2 },
        { id: 'sales1', label: 'SALES-1', type: 'pc', zone: 'sales', ip: '10.40.2.140', mask: '255.255.255.128', gateway: '10.40.3.1', x: 3, y: 2, state: 'affected' }
      ],
      links: [ { from: 'rtr1', to: 'sw1' }, { from: 'sw1', to: 'crm1' }, { from: 'sw1', to: 'sales1' } ]
    } },
    steps: [
      { id: 's1', type: 'configure', points: 1, deviceId: 'sales1',
        prompt: 'SALES-1 has two configuration problems. Fix its subnet mask and default gateway.',
        explanation: 'SALES-1’s /25 mask (255.255.255.128) puts its address .140 in the upper half (.128–.255) of the subnet, while RTR-1, SW-1, and CRM-1 (.1/.2/.10) sit in the lower half (.0–.127) — so SALES-1 sees CRM-1 as being on a different network. Its gateway 10.40.3.1 also sits outside the 10.40.2.0/24 segment entirely. Correcting both to the /24 mask and the router’s 10.40.2.1 interface restores both local and VPN reachability.',
        payload: { slots: [
          { id: 'mask', label: 'SALES-1 subnet mask', options: [
            { id: 'a', text: '255.255.255.0' }, { id: 'b', text: '255.255.255.128' }, { id: 'c', text: '255.255.255.192' } ] },
          { id: 'gateway', label: 'SALES-1 default gateway', options: [
            { id: 'a', text: '10.40.2.1' }, { id: 'b', text: '10.40.3.1' }, { id: 'c', text: '10.4.2.1' } ] }
        ] },
        answer: { slots: { mask: 'a', gateway: 'a' } } }
    ]
  },

  // ── Defense in Depth (Task 14, 2-agent gated) ──
  { id: 'netplus-did-flat-office', cert: 'netplus',
    objective: 'N10-009 Domain 4.1 — Explain common security concepts (defense in depth, network segmentation)',
    topic: 'Defense in Depth', title: 'One firewall, one flat network', estMinutes: 5, archetype: 'defense',
    scenario: 'A small office has a stateful firewall at the edge and nothing else. Behind it, every device including the public-facing web server sits on one flat internal subnet. The perimeter looks solid, but it is the only real control in the whole design.',
    assets: { reference: { kind: 'layered',
      layers: [
        { id: 'perimeter', label: 'Perimeter', control: 'Stateful firewall', state: 'present' },
        { id: 'dmz', label: 'Screened subnet (DMZ)', state: 'missing' },
        { id: 'internal', label: 'Internal LAN', control: 'Single flat subnet, no VLANs', state: 'missing' }
      ],
      core: { label: 'Servers and data', assets: [
        { id: 'web1', label: 'WEB-1 (public web server)', exposed: true },
        { id: 'fs1', label: 'FS-1 (file server)', exposed: true }
      ] }
    } },
    steps: [
      { id: 'd1', type: 'configure', points: 1,
        prompt: 'Which layer of defense is missing in this design?',
        explanation: 'Past the one firewall, everything is flat. The public web server sits right next to internal data with no screened subnet or segmentation between them, so a single breach reaches everything.',
        payload: { slots: [ { id: 'layer', label: 'Missing layer', options: [
          { id: 'l1', text: 'A screened subnet (DMZ) isolating the public web server' },
          { id: 'l2', text: 'A second stateful firewall at the edge' },
          { id: 'l3', text: 'A faster internet connection' },
          { id: 'l4', text: 'A larger switch chassis' }
        ] } ] },
        answer: { slots: { layer: 'l1' } } },
      { id: 'f1', type: 'configure', points: 1,
        prompt: 'Add the correct control at each layer.',
        explanation: 'A DMZ isolates the public server between two firewalls so a compromise stays away from internal data, and VLAN segmentation stops one foothold from reaching every device.',
        payload: { slots: [
          { id: 'perimeter', label: 'Perimeter', options: [
            { id: 'p1', text: 'Stateful firewall at the edge' }, { id: 'p2', text: 'Open all inbound ports for compatibility' } ] },
          { id: 'dmz', label: 'Public-facing servers', options: [
            { id: 'd1', text: 'Place in a screened subnet (DMZ) between two firewalls' }, { id: 'd2', text: 'Place directly on the internal LAN' } ] },
          { id: 'internal', label: 'Internal network', options: [
            { id: 'i1', text: 'Segment into VLANs by role' }, { id: 'i2', text: 'Keep as one flat subnet' } ] }
        ] },
        answer: { slots: { perimeter: 'p1', dmz: 'd1', internal: 'i1' } } }
    ]
  },

  { id: 'netplus-did-wifi-no-acl', cert: 'netplus',
    objective: 'N10-009 Domain 4.1 — Explain common security concepts (segmentation, access control lists, hardening)',
    topic: 'Defense in Depth', title: 'Guest Wi-Fi with a straight line to payroll', estMinutes: 5, archetype: 'defense',
    scenario: 'A retail branch has a firewall at the edge and a guest Wi-Fi SSID for customers. The guest network shares the same VLAN as the back-office LAN, and there is no ACL restricting traffic between them, so any guest device can reach the payroll server.',
    assets: { reference: { kind: 'layered',
      layers: [
        { id: 'perimeter', label: 'Perimeter', control: 'Edge firewall', state: 'present' },
        { id: 'network', label: 'Network segmentation', control: 'Guest Wi-Fi shares VLAN with back office, no ACL', state: 'missing' },
        { id: 'endpoint', label: 'Endpoint', control: 'Host firewall on payroll server', state: 'present' }
      ],
      core: { label: 'Back-office systems', assets: [
        { id: 'pay1', label: 'PAY-1 (payroll server)', exposed: true }
      ] }
    } },
    steps: [
      { id: 'd1', type: 'configure', points: 1,
        prompt: 'Which layer has the gap in this design?',
        explanation: 'The edge firewall and the payroll server\'s host firewall are both present, but guest and back-office traffic share one VLAN with no ACL between them, so the segmentation layer is the gap.',
        payload: { slots: [ { id: 'layer', label: 'Missing layer', options: [
          { id: 'l1', text: 'Network segmentation between guest Wi-Fi and back office' },
          { id: 'l2', text: 'The edge firewall' },
          { id: 'l3', text: 'The payroll server\'s host firewall' },
          { id: 'l4', text: 'Physical door locks on the server room' }
        ] } ] },
        answer: { slots: { layer: 'l1' } } },
      { id: 'f1', type: 'configure', points: 1,
        prompt: 'Add the correct control at each layer.',
        explanation: 'A dedicated guest VLAN with an ACL blocking guest-to-back-office traffic closes the gap, while keeping the existing perimeter and endpoint controls in place.',
        payload: { slots: [
          { id: 'perimeter', label: 'Perimeter', options: [
            { id: 'p1', text: 'Edge firewall filtering inbound/outbound traffic' }, { id: 'p2', text: 'No perimeter control needed' } ] },
          { id: 'network', label: 'Network', options: [
            { id: 'n1', text: 'Separate guest VLAN with an ACL denying access to the back-office VLAN' }, { id: 'n2', text: 'Same VLAN for guests and staff to simplify support' } ] },
          { id: 'endpoint', label: 'Endpoint', options: [
            { id: 'e1', text: 'Host-based firewall on the payroll server' }, { id: 'e2', text: 'Disable the payroll server\'s firewall for easier troubleshooting' } ] }
        ] },
        answer: { slots: { perimeter: 'p1', network: 'n1', endpoint: 'e1' } } }
    ]
  },

  { id: 'netplus-did-unmanaged-switch', cert: 'netplus',
    objective: 'N10-009 Domain 4.1 — Explain common security concepts (port security, hardening, segmentation)',
    topic: 'Defense in Depth', title: 'A closet switch anyone can plug into', estMinutes: 5, archetype: 'defense',
    scenario: 'A branch office has a firewall at the edge and VLANs separating departments. In the wiring closet, an unmanaged switch feeds the finance VLAN, and any of its open ports will hand out an address and full access to whoever plugs in, no authentication required.',
    assets: { reference: { kind: 'layered',
      layers: [
        { id: 'perimeter', label: 'Perimeter', control: 'Edge firewall', state: 'present' },
        { id: 'network', label: 'Network segmentation', control: 'VLANs by department', state: 'present' },
        { id: 'endpoint', label: 'Endpoint / port access', control: 'Open ports on an unmanaged switch, no port security', state: 'missing' }
      ],
      core: { label: 'Finance VLAN', assets: [
        { id: 'fin1', label: 'FIN-DB (finance database)', exposed: true }
      ] }
    } },
    steps: [
      { id: 'd1', type: 'configure', points: 1,
        prompt: 'Which layer has the gap in this design?',
        explanation: 'The perimeter and VLAN segmentation are both in place, but the finance VLAN\'s wiring closet uses an unmanaged switch with no port security, so anyone who plugs in gets full network access. The endpoint/port-access layer is the gap.',
        payload: { slots: [ { id: 'layer', label: 'Missing layer', options: [
          { id: 'l1', text: 'Port security on the access-layer switch' },
          { id: 'l2', text: 'The edge firewall' },
          { id: 'l3', text: 'VLAN segmentation' },
          { id: 'l4', text: 'DNS filtering' }
        ] } ] },
        answer: { slots: { layer: 'l1' } } },
      { id: 'f1', type: 'configure', points: 1,
        prompt: 'Add the correct control at each layer.',
        explanation: 'Replacing the unmanaged switch with a managed switch running 802.1X or MAC-based port security stops unauthenticated devices from joining the finance VLAN, while the perimeter and segmentation layers stay as they are.',
        payload: { slots: [
          { id: 'perimeter', label: 'Perimeter', options: [
            { id: 'p1', text: 'Edge firewall filtering traffic to the internet' }, { id: 'p2', text: 'No firewall, rely on VLANs alone' } ] },
          { id: 'network', label: 'Network', options: [
            { id: 'n1', text: 'VLANs segmenting finance from other departments' }, { id: 'n2', text: 'One VLAN for the entire building' } ] },
          { id: 'endpoint', label: 'Port access', options: [
            { id: 'e1', text: 'Managed switch with 802.1X port security' }, { id: 'e2', text: 'Unmanaged switch with all ports open' } ] }
        ] },
        answer: { slots: { perimeter: 'p1', network: 'n1', endpoint: 'e1' } } }
    ]
  },

  { id: 'netplus-did-vpn-split-tunnel', cert: 'netplus',
    objective: 'N10-009 Domain 4.1 — Explain common security concepts (remote access security, segmentation)',
    topic: 'Defense in Depth', title: 'A remote worker with a shortcut around the firewall', estMinutes: 5, archetype: 'defense',
    scenario: 'The company firewall inspects all traffic entering headquarters, and the internal LAN is segmented into VLANs. Remote employees connect over a site-to-site capable VPN, but split tunneling is enabled, so their internet traffic bypasses the corporate firewall entirely while their VPN tunnel still reaches internal servers.',
    assets: { reference: { kind: 'layered',
      layers: [
        { id: 'perimeter', label: 'Perimeter', control: 'Edge firewall inspecting inbound HQ traffic', state: 'present' },
        { id: 'remote', label: 'Remote access', control: 'VPN with split tunneling enabled', state: 'missing' },
        { id: 'network', label: 'Network segmentation', control: 'VLANs by department', state: 'present' }
      ],
      core: { label: 'Internal servers', assets: [
        { id: 'app1', label: 'APP-1 (internal app server)', exposed: true }
      ] }
    } },
    steps: [
      { id: 'd1', type: 'configure', points: 1,
        prompt: 'Which layer has the gap in this design?',
        explanation: 'The edge firewall and internal VLANs are both fine, but split tunneling lets a remote laptop reach the open internet unfiltered at the same time its VPN tunnel reaches internal servers. A compromised laptop becomes a bridge straight past the perimeter.',
        payload: { slots: [ { id: 'layer', label: 'Missing layer', options: [
          { id: 'l1', text: 'Remote access control (split tunneling bypasses the firewall)' },
          { id: 'l2', text: 'The edge firewall inspecting HQ traffic' },
          { id: 'l3', text: 'VLAN segmentation inside HQ' },
          { id: 'l4', text: 'Physical security of the server room' }
        ] } ] },
        answer: { slots: { layer: 'l1' } } },
      { id: 'f1', type: 'configure', points: 1,
        prompt: 'Add the correct control at each layer.',
        explanation: 'Forcing full-tunnel VPN routes all remote traffic through the corporate firewall for inspection, closing the bypass while the existing perimeter and segmentation layers remain effective.',
        payload: { slots: [
          { id: 'perimeter', label: 'Perimeter', options: [
            { id: 'p1', text: 'Edge firewall inspecting all inbound and outbound traffic' }, { id: 'p2', text: 'Firewall inspecting only inbound traffic' } ] },
          { id: 'remote', label: 'Remote access', options: [
            { id: 'r1', text: 'Full-tunnel VPN routing all traffic through the corporate firewall' }, { id: 'r2', text: 'Split-tunnel VPN so internet traffic bypasses the firewall' } ] },
          { id: 'network', label: 'Network', options: [
            { id: 'n1', text: 'VLANs segmenting internal servers by department' }, { id: 'n2', text: 'One flat VLAN for all internal servers' } ] }
        ] },
        answer: { slots: { perimeter: 'p1', remote: 'r1', network: 'n1' } } }
    ]
  },

  { id: 'netplus-did-iot-vlan', cert: 'netplus',
    objective: 'N10-009 Domain 4.1 — Explain common security concepts (IoT segmentation, hardening)',
    topic: 'Defense in Depth', title: 'Smart cameras on the same VLAN as the servers', estMinutes: 5, archetype: 'defense',
    scenario: 'A warehouse has an edge firewall and VLAN segmentation for its office network. Recently installed IoT security cameras were plugged into the same VLAN as the inventory servers because it was the quickest way to get them online, and the cameras still use their factory-default credentials.',
    assets: { reference: { kind: 'layered',
      layers: [
        { id: 'perimeter', label: 'Perimeter', control: 'Edge firewall', state: 'present' },
        { id: 'network', label: 'Network segmentation', control: 'IoT cameras share the server VLAN', state: 'missing' },
        { id: 'endpoint', label: 'Endpoint hardening', control: 'Cameras still use default credentials', state: 'missing' }
      ],
      core: { label: 'Inventory servers', assets: [
        { id: 'inv1', label: 'INV-1 (inventory server)', exposed: true },
        { id: 'cam1', label: 'CAM-1 (default-credential camera)', exposed: true }
      ] }
    } },
    steps: [
      { id: 'd1', type: 'configure', points: 1,
        prompt: 'Which layer has the biggest gap here?',
        explanation: 'Unhardened IoT devices sharing a VLAN with production servers is the core problem: a camera with default credentials is an easy foothold, and because there is no segmentation, that foothold reaches the inventory server directly.',
        payload: { slots: [ { id: 'layer', label: 'Missing layer', options: [
          { id: 'l1', text: 'IoT devices are not segmented from servers and still use default credentials' },
          { id: 'l2', text: 'The edge firewall is misconfigured' },
          { id: 'l3', text: 'The warehouse has too much bandwidth' },
          { id: 'l4', text: 'The inventory server is too old' }
        ] } ] },
        answer: { slots: { layer: 'l1' } } },
      { id: 'f1', type: 'configure', points: 1,
        prompt: 'Add the correct control at each layer.',
        explanation: 'Moving IoT devices to a dedicated VLAN with no route to servers, and changing default credentials on every camera, closes both gaps while the perimeter firewall stays as-is.',
        payload: { slots: [
          { id: 'perimeter', label: 'Perimeter', options: [
            { id: 'p1', text: 'Edge firewall filtering internet-bound traffic' }, { id: 'p2', text: 'No firewall needed for a warehouse' } ] },
          { id: 'network', label: 'Network', options: [
            { id: 'n1', text: 'Dedicated IoT VLAN isolated from the server VLAN' }, { id: 'n2', text: 'Keep IoT devices on the server VLAN for convenience' } ] },
          { id: 'endpoint', label: 'Endpoint', options: [
            { id: 'e1', text: 'Change default credentials on every camera' }, { id: 'e2', text: 'Leave factory-default credentials in place' } ] }
        ] },
        answer: { slots: { perimeter: 'p1', network: 'n1', endpoint: 'e1' } } }
    ]
  },

  // 01 — band steering: 2.4-only clients force AP onto 2.4, channel-plan around ch6 neighbor
  {
    id: 'np-wifi-01',
    cert: 'netplus', objective: '2.3', topic: 'Wireless deployment',
    title: 'Warehouse scanners can’t see the new AP',
    estMinutes: 4, archetype: 'wireless',
    scenario: 'A roastery just mounted AP-2 in the warehouse. The barcode scanners are 2.4 GHz-only, and the print shop next door runs a loud neighbor AP on 2.4 GHz channel 6. Plan the band, then configure AP-2 so the scanners associate cleanly and stay clear of the neighbor.',
    assets: { reference: { kind: 'network',
      given: { site: 'Harbor & Finch — warehouse' },
      devices: [
        { id: 'ap2', label: 'AP-2', type: 'ap', zone: 'warehouse', ip: 'ch ?', x: 1, y: 1 },
        { id: 'nbr', label: 'Neighbor AP', type: 'ap', zone: 'external', ip: '2.4 GHz · ch 6', channel: 6, x: 3, y: 1, state: 'compromised' },
        { id: 'scan', label: 'Scanners', type: 'pc', zone: 'warehouse', ip: '2.4 GHz only', x: 0, y: 2 }
      ],
      links: [ { from: 'ap2', to: 'scan' }, { from: 'nbr', to: 'ap2', kind: 'attack' } ]
    } },
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'The scanners never appear on 5 GHz. Which facts drive the AP-2 plan? Select all that apply.',
        explanation: 'The scanners are 2.4 GHz-only, so AP-2 must broadcast on 2.4 GHz. In 2.4 GHz only channels 1, 6, and 11 are non-overlapping, and the neighbor already occupies 6 — so AP-2 must use 1 or 11.',
        payload: { lines: [
          { id: 'l1', text: 'Scanners are 2.4 GHz-only, so AP-2 must run 2.4 GHz.' },
          { id: 'l2', text: 'Neighbor occupies 2.4 GHz channel 6.' },
          { id: 'l3', text: 'Only channels 1, 6, 11 are non-overlapping on 2.4 GHz.' },
          { id: 'l4', text: 'WPA3 encryption removes the need for channel planning.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } },
      { id: 's2', type: 'configure', points: 1, apId: 'ap2',
        require: { band: '2.4', channel: 11, security: 'WPA3-Personal', ssid: 'HF-Ops' },
        prompt: 'Configure AP-2 for the warehouse scanners, clear of the neighbor.',
        explanation: 'Band 2.4 GHz reaches the 2.4-only scanners; channel 11 is non-overlapping and not the neighbor’s 6; WPA3-Personal matches site policy; SSID HF-Ops is the warehouse network.',
        payload: { slots: [
          { id: 'band', label: 'Band', options: [
            { id: 'a', text: '2.4' }, { id: 'b', text: '5' } ] },
          { id: 'channel', label: 'Channel', options: [
            { id: 'a', text: '6' }, { id: 'b', text: '11' }, { id: 'c', text: '3' } ] },
          { id: 'security', label: 'Security', options: [
            { id: 'a', text: 'WPA2-Personal' }, { id: 'b', text: 'WPA3-Personal' }, { id: 'c', text: 'WEP' } ] },
          { id: 'ssid', label: 'SSID', options: [
            { id: 'a', text: 'HF-Ops' }, { id: 'b', text: 'HF-Cafe' } ] }
        ] },
        answer: { slots: { band: 'a', channel: 'b', security: 'b', ssid: 'a' } } }
    ]
  },

  // 02 — band steering: 5-capable clients, move café AP to 5 GHz off crowded 2.4
  {
    id: 'np-wifi-02',
    cert: 'netplus', objective: '2.3', topic: 'Band steering',
    title: 'Steer the café laptops to the fast band',
    estMinutes: 4, archetype: 'wireless',
    scenario: 'The café upstairs streams video on 5 GHz-capable laptops, but AP-1 was left on the congested 2.4 GHz band shared with a neighbor. Diagnose why throughput is poor, then move AP-1 to the band that fits the clients.',
    assets: { reference: { kind: 'network',
      given: { site: 'Harbor & Finch — café' },
      devices: [
        { id: 'ap1', label: 'AP-1', type: 'ap', zone: 'cafe', ip: 'ch ?', x: 1, y: 1 },
        { id: 'nbr', label: 'Neighbor AP', type: 'ap', zone: 'external', ip: '2.4 GHz · ch 6', channel: 6, x: 3, y: 1, state: 'compromised' },
        { id: 'lap', label: 'Laptops', type: 'pc', zone: 'cafe', ip: '5 GHz capable', x: 0, y: 2 }
      ],
      links: [ { from: 'ap1', to: 'lap' }, { from: 'nbr', to: 'ap1', kind: 'attack' } ]
    } },
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Why is café throughput poor even though signal is strong? Select all that apply.',
        explanation: 'The laptops support 5 GHz, which has far more non-overlapping channels and no neighbor contention here. Staying on crowded 2.4 GHz shares airtime with the neighbor. Move AP-1 to 5 GHz.',
        payload: { lines: [
          { id: 'l1', text: 'Laptops are 5 GHz-capable but AP-1 is on 2.4 GHz.' },
          { id: 'l2', text: '2.4 GHz is congested and shared with the neighbor.' },
          { id: 'l3', text: '5 GHz offers more non-overlapping channels.' },
          { id: 'l4', text: 'The laptops cannot use 5 GHz at all.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } },
      { id: 's2', type: 'configure', points: 1, apId: 'ap1',
        require: { band: '5', channel: 44, security: 'WPA3-Personal', ssid: 'HF-Cafe' },
        prompt: 'Configure AP-1 for the streaming laptops.',
        explanation: 'Band 5 GHz matches the laptops and clears crowded 2.4 GHz; channel 44 is a valid non-DFS 5 GHz channel; WPA3-Personal per policy; SSID HF-Cafe.',
        payload: { slots: [
          { id: 'band', label: 'Band', options: [
            { id: 'a', text: '2.4' }, { id: 'b', text: '5' } ] },
          { id: 'channel', label: 'Channel', options: [
            { id: 'a', text: '44' }, { id: 'b', text: '6' }, { id: 'c', text: '12' } ] },
          { id: 'security', label: 'Security', options: [
            { id: 'a', text: 'WPA3-Personal' }, { id: 'b', text: 'WPA2-Personal' }, { id: 'c', text: 'Open' } ] },
          { id: 'ssid', label: 'SSID', options: [
            { id: 'a', text: 'HF-Cafe' }, { id: 'b', text: 'HF-Ops' } ] }
        ] },
        answer: { slots: { band: 'b', channel: 'a', security: 'a', ssid: 'a' } } }
    ]
  },

  // 03 — 2.4 GHz channel planning around TWO neighbors (6 and 11) -> forced to 1
  {
    id: 'np-wifi-03',
    cert: 'netplus', objective: '2.3', topic: 'Channel planning',
    title: 'Squeezed between two 2.4 GHz neighbors',
    estMinutes: 4, archetype: 'wireless',
    scenario: 'A clinic’s 2.4 GHz IoT sensors need AP-3, but two adjacent tenants already broadcast — one on channel 6, one on channel 11. Diagnose the only clean non-overlapping channel left, then configure AP-3.',
    assets: { reference: { kind: 'network',
      given: { site: 'Bayside Clinic — sensor floor' },
      devices: [
        { id: 'ap3', label: 'AP-3', type: 'ap', zone: 'clinic', ip: 'ch ?', x: 1, y: 1 },
        { id: 'nbrA', label: 'Tenant A AP', type: 'ap', zone: 'external', ip: '2.4 GHz · ch 6', channel: 6, x: 3, y: 0, state: 'compromised' },
        { id: 'nbrB', label: 'Tenant B AP', type: 'ap', zone: 'external', ip: '2.4 GHz · ch 11', channel: 11, x: 3, y: 2, state: 'compromised' },
        { id: 'iot', label: 'IoT sensors', type: 'pc', zone: 'clinic', ip: '2.4 GHz only', x: 0, y: 2 }
      ],
      links: [ { from: 'ap3', to: 'iot' }, { from: 'nbrA', to: 'ap3', kind: 'attack' }, { from: 'nbrB', to: 'ap3', kind: 'attack' } ]
    } },
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Two neighbors hold 6 and 11. Which channel is left for AP-3? Select all true statements.',
        explanation: 'The non-overlapping 2.4 GHz set is {1, 6, 11}. Neighbors own 6 and 11, so channel 1 is the only clean choice.',
        payload: { lines: [
          { id: 'l1', text: 'Non-overlapping 2.4 GHz channels are 1, 6, 11.' },
          { id: 'l2', text: 'Neighbors occupy channels 6 and 11.' },
          { id: 'l3', text: 'Channel 1 is the only remaining clean channel.' },
          { id: 'l4', text: 'Channel 9 would avoid both neighbors.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } },
      { id: 's2', type: 'configure', points: 1, apId: 'ap3',
        require: { band: '2.4', channel: 1, security: 'WPA3-Personal', ssid: 'BC-Sensors' },
        prompt: 'Configure AP-3 for the 2.4 GHz sensors, clear of both neighbors.',
        explanation: 'Channel 1 is the only non-overlapping 2.4 GHz channel not taken by a neighbor; 2.4 GHz reaches the sensors; WPA3-Personal per policy.',
        payload: { slots: [
          { id: 'band', label: 'Band', options: [
            { id: 'a', text: '2.4' }, { id: 'b', text: '5' } ] },
          { id: 'channel', label: 'Channel', options: [
            { id: 'a', text: '1' }, { id: 'b', text: '6' }, { id: 'c', text: '11' }, { id: 'd', text: '9' } ] },
          { id: 'security', label: 'Security', options: [
            { id: 'a', text: 'WPA3-Personal' }, { id: 'b', text: 'WEP' } ] },
          { id: 'ssid', label: 'SSID', options: [
            { id: 'a', text: 'BC-Sensors' }, { id: 'b', text: 'BC-Guest' } ] }
        ] },
        answer: { slots: { band: 'a', channel: 'a', security: 'a', ssid: 'a' } } }
    ]
  },

  // 04 — DFS awareness: near weather radar, avoid a DFS channel; key a non-DFS one clear of neighbor
  {
    id: 'np-wifi-04',
    cert: 'netplus', objective: '2.3', topic: 'DFS channels',
    title: 'Steer clear of DFS near the radar',
    estMinutes: 5, archetype: 'wireless',
    scenario: 'A clinic sits under the approach path of an airport weather radar, where DFS channels regularly take radar hits and drop clients while the AP runs its channel-availability check. AP-5 serves 5 GHz laptops. A neighbor tenant already holds 5 GHz channel 149. Decide which channel keeps the clinic online, then set AP-5.',
    assets: { reference: { kind: 'network',
      given: { site: 'Beacon Clinic — near airport radar' },
      devices: [
        { id: 'ap5', label: 'AP-5', type: 'ap', zone: 'clinic', ip: 'ch ?', x: 1, y: 1 },
        { id: 'nbr', label: 'Neighbor AP', type: 'ap', zone: 'external', ip: '5 GHz · ch 149', channel: 149, x: 3, y: 1, state: 'compromised' },
        { id: 'lap', label: 'Laptops', type: 'pc', zone: 'clinic', ip: '5 GHz capable', x: 0, y: 2 }
      ],
      links: [ { from: 'ap5', to: 'lap' }, { from: 'nbr', to: 'ap5', kind: 'attack' } ]
    } },
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Channel 100 looks empty. Why is it still the wrong pick near this radar? Select all that apply.',
        explanation: 'Channel 100 is a DFS channel: it is legal, but near a radar source the AP must vacate and re-run a channel-availability check on every radar detection, dropping clients. The neighbor holds 149, so it collides. A non-DFS UNII-1/UNII-3 channel such as 153 avoids both the radar interruptions and the neighbor.',
        payload: { lines: [
          { id: 'l1', text: 'Channel 100 is a DFS channel that must yield to radar and re-run CAC, dropping clients.' },
          { id: 'l2', text: 'The neighbor already occupies 5 GHz channel 149.' },
          { id: 'l3', text: 'A non-DFS UNII-1/UNII-3 channel like 153 avoids both radar hits and the neighbor.' },
          { id: 'l4', text: 'An empty DFS channel is always the safest pick because no one else is on it.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } },
      { id: 's2', type: 'configure', points: 1, apId: 'ap5',
        require: { band: '5', channel: 153, security: 'WPA3-Personal', ssid: 'Beacon-Staff' },
        prompt: 'Configure AP-5 on a channel that survives the radar and clears the neighbor.',
        explanation: 'Channel 153 is a non-DFS UNII-3 channel — no radar-detection/CAC interruptions — and is not the neighbor’s 149; the empty DFS channel 100 is the trap; 5 GHz matches the laptops; WPA3-Personal per policy.',
        payload: { slots: [
          { id: 'band', label: 'Band', options: [
            { id: 'a', text: '5' }, { id: 'b', text: '2.4' } ] },
          { id: 'channel', label: 'Channel', options: [
            { id: 'a', text: '153' }, { id: 'b', text: '100' }, { id: 'c', text: '149' } ] },
          { id: 'security', label: 'Security', options: [
            { id: 'a', text: 'WPA3-Personal' }, { id: 'b', text: 'WPA2-Personal' } ] },
          { id: 'ssid', label: 'SSID', options: [
            { id: 'a', text: 'Beacon-Staff' }, { id: 'b', text: 'Beacon-Guest' } ] }
        ] },
        answer: { slots: { band: 'a', channel: 'a', security: 'a', ssid: 'a' } } }
    ]
  },

  // 05 — security mode: WPA3 required; WPA2 distractor is the legacy-client trap
  {
    id: 'np-wifi-05',
    cert: 'netplus', objective: '4.3', topic: 'Wireless security',
    title: 'Lock the exec SSID to WPA3',
    estMinutes: 4, archetype: 'wireless',
    scenario: 'A finance floor’s executive SSID must use the strongest personal-mode encryption available. A junior admin left it on WPA2 “because everything connects.” Diagnose the risk, then set the required security while keeping a clean 5 GHz channel.',
    assets: { reference: { kind: 'network',
      given: { site: 'Meridian Finance — exec floor' },
      devices: [
        { id: 'apx', label: 'AP-X', type: 'ap', zone: 'exec', ip: '5 GHz · ch 40', x: 1, y: 1 },
        { id: 'nbr', label: 'Neighbor AP', type: 'ap', zone: 'external', ip: '5 GHz · ch 157', channel: 157, x: 3, y: 1, state: 'compromised' },
        { id: 'lap', label: 'Exec laptops', type: 'pc', zone: 'exec', ip: '5 GHz · WPA3', x: 0, y: 2 }
      ],
      links: [ { from: 'apx', to: 'lap' }, { from: 'nbr', to: 'apx', kind: 'attack' } ]
    } },
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'What is wrong with leaving the exec SSID on WPA2? Select all that apply.',
        explanation: 'WPA3-Personal (SAE) resists offline dictionary attacks that WPA2-PSK is vulnerable to. All exec laptops support WPA3, so there is no legacy-client reason to stay on WPA2.',
        payload: { lines: [
          { id: 'l1', text: 'WPA3-Personal (SAE) resists offline PSK cracking.' },
          { id: 'l2', text: 'All exec laptops already support WPA3.' },
          { id: 'l3', text: 'Policy requires the strongest personal-mode encryption.' },
          { id: 'l4', text: 'WPA2 is the strongest option still available.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } },
      { id: 's2', type: 'configure', points: 1, apId: 'apx',
        require: { band: '5', channel: 40, security: 'WPA3-Personal', ssid: 'MF-Exec' },
        prompt: 'Set the exec SSID to the required security and a clean channel.',
        explanation: 'WPA3-Personal is the required, strongest personal mode; channel 40 is a valid 5 GHz channel clear of the neighbor’s 157; band 5 GHz matches the clients.',
        payload: { slots: [
          { id: 'band', label: 'Band', options: [
            { id: 'a', text: '5' }, { id: 'b', text: '2.4' } ] },
          { id: 'channel', label: 'Channel', options: [
            { id: 'a', text: '40' }, { id: 'b', text: '157' }, { id: 'c', text: '5' } ] },
          { id: 'security', label: 'Security', options: [
            { id: 'a', text: 'WPA2-Personal' }, { id: 'b', text: 'WPA3-Personal' }, { id: 'c', text: 'Open' } ] },
          { id: 'ssid', label: 'SSID', options: [
            { id: 'a', text: 'MF-Exec' }, { id: 'b', text: 'MF-Guest' } ] }
        ] },
        answer: { slots: { band: 'a', channel: 'a', security: 'b', ssid: 'a' } } }
    ]
  },

  // 06 — SSID / guest separation: guest network on its own SSID, WPA3, clear channel
  {
    id: 'np-wifi-06',
    cert: 'netplus', objective: '2.3', topic: 'Guest network',
    title: 'Stand up a separated guest SSID',
    estMinutes: 4, archetype: 'wireless',
    scenario: 'A hotel lobby needs guest Wi-Fi on its own SSID, separate from the staff network. AP-G will carry only guests. A café across the street runs 2.4 GHz channel 1. Decide what a separate guest SSID does (and does not) provide, then configure AP-G on a clean 2.4 GHz channel with its own guest SSID and security.',
    assets: { reference: { kind: 'network',
      given: { site: 'Cove Hotel — lobby' },
      devices: [
        { id: 'apg', label: 'AP-G', type: 'ap', zone: 'lobby', ip: 'ch ?', x: 1, y: 1 },
        { id: 'nbr', label: 'Café AP', type: 'ap', zone: 'external', ip: '2.4 GHz · ch 1', channel: 1, x: 3, y: 1, state: 'compromised' },
        { id: 'phone', label: 'Guest phones', type: 'pc', zone: 'lobby', ip: '2.4 GHz', x: 0, y: 2 }
      ],
      links: [ { from: 'apg', to: 'phone' }, { from: 'nbr', to: 'apg', kind: 'attack' } ]
    } },
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'What does putting guests on a separate SSID actually accomplish here? Select all that apply.',
        explanation: 'Guests belong on their own SSID with its own security, not sharing the staff SSID/PSK. The café holds 2.4 GHz channel 1, so AP-G must use a different non-overlapping channel (6 or 11). Note the limit: a distinct SSID name alone does not isolate guest traffic from staff — true isolation requires VLAN/segmentation or client isolation, which naming does not perform.',
        payload: { lines: [
          { id: 'l1', text: 'Guests should be on a separate SSID with its own security, not the staff SSID/PSK.' },
          { id: 'l2', text: 'The café AP occupies 2.4 GHz channel 1.' },
          { id: 'l3', text: 'AP-G should pick 6 or 11 to avoid channel 1.' },
          { id: 'l4', text: 'A separate SSID name by itself fully isolates guest traffic from staff.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } },
      { id: 's2', type: 'configure', points: 1, apId: 'apg',
        require: { band: '2.4', channel: 6, security: 'WPA3-Personal', ssid: 'Cove-Guest' },
        prompt: 'Configure AP-G with its own guest SSID and security, clear of the café.',
        explanation: 'SSID Cove-Guest puts guests on their own SSID with its own WPA3-Personal security rather than the staff network; channel 6 is non-overlapping and not the café’s 1; 2.4 GHz for broad phone reach. (Full traffic isolation from staff would still require VLAN/segmentation beyond this SSID split.)',
        payload: { slots: [
          { id: 'band', label: 'Band', options: [
            { id: 'a', text: '2.4' }, { id: 'b', text: '5' } ] },
          { id: 'channel', label: 'Channel', options: [
            { id: 'a', text: '6' }, { id: 'b', text: '1' }, { id: 'c', text: '4' } ] },
          { id: 'security', label: 'Security', options: [
            { id: 'a', text: 'WPA3-Personal' }, { id: 'b', text: 'Open' } ] },
          { id: 'ssid', label: 'SSID', options: [
            { id: 'a', text: 'Cove-Guest' }, { id: 'b', text: 'Cove-Staff' } ] }
        ] },
        answer: { slots: { band: 'a', channel: 'a', security: 'a', ssid: 'a' } } }
    ]
  },

  // 07 — channel-width choice in congested 2.4 GHz (20 vs 40 MHz)
  {
    id: 'np-wifi-07',
    cert: 'netplus', objective: '2.3', topic: 'Channel width',
    title: 'Narrow the channel in crowded 2.4 GHz',
    estMinutes: 5, archetype: 'wireless',
    scenario: 'A dense apartment block has many 2.4 GHz APs packed together. AP-2 is currently set to 40 MHz width and throughput is inconsistent. Decide the best-practice channel width for congested 2.4 GHz, then configure AP-2 with that width and a clean channel.',
    assets: { reference: { kind: 'network',
      given: { site: 'Alder Flats — unit 4B' },
      devices: [
        { id: 'ap2', label: 'AP-2', type: 'ap', zone: 'unit', ip: 'ch ?', x: 1, y: 1 },
        { id: 'nbr', label: 'Neighbor AP', type: 'ap', zone: 'external', ip: '2.4 GHz · ch 6', channel: 6, x: 3, y: 1, state: 'compromised' },
        { id: 'dev', label: 'Tablets', type: 'pc', zone: 'unit', ip: '2.4 GHz', x: 0, y: 2 }
      ],
      links: [ { from: 'ap2', to: 'dev' }, { from: 'nbr', to: 'ap2', kind: 'attack' } ]
    } },
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Why is 20 MHz the best-practice width in dense 2.4 GHz? Select all that apply.',
        explanation: 'A 40 MHz channel consumes two of the three non-overlapping 2.4 GHz channels, leaving little room to coexist with many neighbors; in a congested band the practical gain rarely offsets the added contention. 20 MHz width on a single non-overlapping channel (1/6/11) is the recommended practice here.',
        payload: { lines: [
          { id: 'l1', text: '40 MHz consumes two of the three non-overlapping 2.4 GHz channels.' },
          { id: 'l2', text: '20 MHz width fits a single non-overlapping channel.' },
          { id: 'l3', text: 'Best practice in dense 2.4 GHz is 20 MHz on 1/6/11.' },
          { id: 'l4', text: 'Because the band is crowded, 40 MHz is the better width — its wider channel raises throughput per client.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } },
      { id: 's2', type: 'configure', points: 1, apId: 'ap2',
        require: { band: '2.4', channel: 11, security: 'WPA3-Personal', ssid: 'Alder-4B' },
        prompt: 'Configure AP-2 with the right width and a clean channel.',
        explanation: 'Width 20 MHz is the best-practice choice in dense 2.4 GHz — it fits one non-overlapping channel instead of consuming two; channel 11 is non-overlapping and not the neighbor’s 6; band 2.4 GHz per the client mix; WPA3-Personal per policy.',
        payload: { slots: [
          { id: 'band', label: 'Band', options: [
            { id: 'a', text: '2.4' }, { id: 'b', text: '5' } ] },
          { id: 'width', label: 'Channel width', options: [
            { id: 'a', text: '20 MHz' }, { id: 'b', text: '40 MHz' } ] },
          { id: 'channel', label: 'Channel', options: [
            { id: 'a', text: '11' }, { id: 'b', text: '6' }, { id: 'c', text: '8' } ] },
          { id: 'security', label: 'Security', options: [
            { id: 'a', text: 'WPA3-Personal' }, { id: 'b', text: 'WPA2-Personal' } ] },
          { id: 'ssid', label: 'SSID', options: [
            { id: 'a', text: 'Alder-4B' }, { id: 'b', text: 'Alder-Guest' } ] }
        ] },
        answer: { slots: { band: 'a', width: 'a', channel: 'a', security: 'a', ssid: 'a' } } }
    ]
  },

  // 08 — mixed clients but priority is 2.4-only legacy printer; WPA3 transition vs legacy
  {
    id: 'np-wifi-08',
    cert: 'netplus', objective: '2.3', topic: 'Wireless deployment',
    title: 'Keep the 2.4 GHz label printer online',
    estMinutes: 4, archetype: 'wireless',
    scenario: 'A shipping desk added AP-4 for a 2.4 GHz-only label printer plus staff phones. A tenant AP holds 2.4 GHz channel 11. Diagnose the band requirement, then configure AP-4 clear of the tenant.',
    assets: { reference: { kind: 'network',
      given: { site: 'Portway Logistics — shipping' },
      devices: [
        { id: 'ap4', label: 'AP-4', type: 'ap', zone: 'shipping', ip: 'ch ?', x: 1, y: 1 },
        { id: 'nbr', label: 'Tenant AP', type: 'ap', zone: 'external', ip: '2.4 GHz · ch 11', channel: 11, x: 3, y: 1, state: 'compromised' },
        { id: 'prn', label: 'Label printer', type: 'pc', zone: 'shipping', ip: '2.4 GHz only', x: 0, y: 2 }
      ],
      links: [ { from: 'ap4', to: 'prn' }, { from: 'nbr', to: 'ap4', kind: 'attack' } ]
    } },
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'The label printer disappears whenever AP-4 is on 5 GHz. Which facts apply? Select all.',
        explanation: 'A 2.4 GHz-only printer cannot see a 5 GHz SSID, so AP-4 must be 2.4 GHz. The tenant holds channel 11, so AP-4 needs 1 or 6.',
        payload: { lines: [
          { id: 'l1', text: 'A 2.4 GHz-only printer cannot associate on 5 GHz.' },
          { id: 'l2', text: 'The tenant AP occupies 2.4 GHz channel 11.' },
          { id: 'l3', text: 'AP-4 should use channel 1 or 6 to avoid the tenant.' },
          { id: 'l4', text: 'Dual-band AP-4 will bridge the printer to 5 GHz automatically.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } },
      { id: 's2', type: 'configure', points: 1, apId: 'ap4',
        require: { band: '2.4', channel: 6, security: 'WPA3-Personal', ssid: 'PW-Ship' },
        prompt: 'Configure AP-4 to keep the label printer online, clear of the tenant.',
        explanation: 'Band 2.4 GHz reaches the printer; channel 6 is non-overlapping and not the tenant’s 11; WPA3-Personal per policy; SSID PW-Ship.',
        payload: { slots: [
          { id: 'band', label: 'Band', options: [
            { id: 'a', text: '2.4' }, { id: 'b', text: '5' } ] },
          { id: 'channel', label: 'Channel', options: [
            { id: 'a', text: '6' }, { id: 'b', text: '11' }, { id: 'c', text: '2' } ] },
          { id: 'security', label: 'Security', options: [
            { id: 'a', text: 'WPA3-Personal' }, { id: 'b', text: 'WEP' } ] },
          { id: 'ssid', label: 'SSID', options: [
            { id: 'a', text: 'PW-Ship' }, { id: 'b', text: 'PW-Guest' } ] }
        ] },
        answer: { slots: { band: 'a', channel: 'a', security: 'a', ssid: 'a' } } }
    ]
  },

  // 09 — channel-reuse planning: sibling AP on 44, neighbor on 36 -> pick non-overlapping 161
  {
    id: 'np-wifi-09',
    cert: 'netplus', objective: '2.3', topic: 'Channel reuse',
    title: 'Plan non-overlapping channels for two co-located APs',
    estMinutes: 5, archetype: 'wireless',
    scenario: 'A design studio covers one floor with two of its own 5 GHz APs. AP-6a is already assigned channel 44. You are now assigning AP-6b, which shares coverage with AP-6a. A neighbor studio next door broadcasts 5 GHz channel 36. Pick a channel for AP-6b that reuses the band without colliding with the sibling AP or the neighbor.',
    assets: { reference: { kind: 'network',
      given: { site: 'Kiln Studio — mezzanine' },
      devices: [
        { id: 'ap6', label: 'AP-6b', type: 'ap', zone: 'studio', ip: 'ch ?', x: 1, y: 1 },
        { id: 'sib', label: 'AP-6a (sibling)', type: 'ap', zone: 'studio', ip: '5 GHz · ch 44', channel: 44, x: 1, y: 3 },
        { id: 'nbr', label: 'Neighbor AP', type: 'ap', zone: 'external', ip: '5 GHz · ch 36', channel: 36, x: 3, y: 1, state: 'compromised' },
        { id: 'ws', label: 'Workstations', type: 'pc', zone: 'studio', ip: '5 GHz capable', x: 0, y: 2 }
      ],
      links: [ { from: 'ap6', to: 'ws' }, { from: 'sib', to: 'ws' }, { from: 'nbr', to: 'ap6', kind: 'attack' } ]
    } },
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'AP-6a is on 44 and the neighbor is on 36. Which channel should AP-6b take? Select all that apply.',
        explanation: 'Co-located APs must reuse the band on non-overlapping 5 GHz channels. AP-6a already holds 44 and the neighbor holds 36, so AP-6b needs a third clean channel — 161 is a non-DFS 5 GHz channel that collides with neither.',
        payload: { lines: [
          { id: 'l1', text: 'Co-located AP-6a already occupies 5 GHz channel 44.' },
          { id: 'l2', text: 'The neighbor occupies 5 GHz channel 36.' },
          { id: 'l3', text: 'AP-6b should take a third non-overlapping 5 GHz channel such as 161.' },
          { id: 'l4', text: 'AP-6b can reuse channel 44 since AP-6a is the studio’s own AP.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } },
      { id: 's2', type: 'configure', points: 1, apId: 'ap6',
        require: { band: '5', channel: 161, security: 'WPA3-Personal', ssid: 'Kiln-Net' },
        prompt: 'Configure AP-6b on a 5 GHz channel that clears both the sibling AP and the neighbor.',
        explanation: 'Channel 161 is a non-DFS 5 GHz channel used by neither the sibling AP-6a (44) nor the neighbor (36); 5 GHz matches the workstations; WPA3-Personal per policy.',
        payload: { slots: [
          { id: 'band', label: 'Band', options: [
            { id: 'a', text: '5' }, { id: 'b', text: '2.4' } ] },
          { id: 'channel', label: 'Channel', options: [
            { id: 'a', text: '161' }, { id: 'b', text: '44' }, { id: 'c', text: '36' } ] },
          { id: 'security', label: 'Security', options: [
            { id: 'a', text: 'WPA3-Personal' }, { id: 'b', text: 'WPA2-Personal' } ] },
          { id: 'ssid', label: 'SSID', options: [
            { id: 'a', text: 'Kiln-Net' }, { id: 'b', text: 'Kiln-Guest' } ] }
        ] },
        answer: { slots: { band: 'a', channel: 'a', security: 'a', ssid: 'a' } } }
    ]
  },

  // 10 — WEP legacy device trap; correct answer WPA3, channel clear of ch1 neighbor
  {
    id: 'np-wifi-10',
    cert: 'netplus', objective: '4.3', topic: 'Wireless security',
    title: 'Retire WEP on the warehouse SSID',
    estMinutes: 4, archetype: 'wireless',
    scenario: 'An old handheld vendor manual suggested WEP “for compatibility.” The warehouse SSID on AP-7 must instead use the site’s WPA3-Personal standard. A neighbor holds 2.4 GHz channel 1. Diagnose the security gap, then reconfigure AP-7.',
    assets: { reference: { kind: 'network',
      given: { site: 'Granary Depot — floor 1' },
      devices: [
        { id: 'ap7', label: 'AP-7', type: 'ap', zone: 'depot', ip: '2.4 GHz · ch ?', x: 1, y: 1 },
        { id: 'nbr', label: 'Neighbor AP', type: 'ap', zone: 'external', ip: '2.4 GHz · ch 1', channel: 1, x: 3, y: 1, state: 'compromised' },
        { id: 'hh', label: 'Handhelds', type: 'pc', zone: 'depot', ip: '2.4 GHz · WPA3', x: 0, y: 2 }
      ],
      links: [ { from: 'ap7', to: 'hh' }, { from: 'nbr', to: 'ap7', kind: 'attack' } ]
    } },
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Why must WEP be removed here? Select all that apply.',
        explanation: 'WEP is trivially cracked and non-compliant. The handhelds support WPA3, and site policy mandates WPA3-Personal, so there is no compatibility reason to keep WEP.',
        payload: { lines: [
          { id: 'l1', text: 'WEP encryption is trivially broken and deprecated.' },
          { id: 'l2', text: 'The handhelds already support WPA3-Personal.' },
          { id: 'l3', text: 'Site policy mandates WPA3-Personal.' },
          { id: 'l4', text: 'WEP is acceptable as long as MAC filtering is enabled.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } },
      { id: 's2', type: 'configure', points: 1, apId: 'ap7',
        require: { band: '2.4', channel: 11, security: 'WPA3-Personal', ssid: 'GD-Depot' },
        prompt: 'Reconfigure AP-7 to the required security and a clean channel.',
        explanation: 'WPA3-Personal replaces WEP per policy; channel 11 is non-overlapping and not the neighbor’s 1; band 2.4 GHz for the handhelds.',
        payload: { slots: [
          { id: 'band', label: 'Band', options: [
            { id: 'a', text: '2.4' }, { id: 'b', text: '5' } ] },
          { id: 'channel', label: 'Channel', options: [
            { id: 'a', text: '11' }, { id: 'b', text: '1' }, { id: 'c', text: '7' } ] },
          { id: 'security', label: 'Security', options: [
            { id: 'a', text: 'WEP' }, { id: 'b', text: 'WPA3-Personal' }, { id: 'c', text: 'WPA2-Personal' } ] },
          { id: 'ssid', label: 'SSID', options: [
            { id: 'a', text: 'GD-Depot' }, { id: 'b', text: 'GD-Guest' } ] }
        ] },
        answer: { slots: { band: 'a', channel: 'a', security: 'b', ssid: 'a' } } }
    ]
  },

  // 11 — canonical dual-band split: this AP is the 5 GHz radio, neighbor 5 GHz on 153 -> pick non-DFS 48
  {
    id: 'np-wifi-11',
    cert: 'netplus', objective: '2.3', topic: 'Band steering',
    title: 'Split the dual-band deployment',
    estMinutes: 5, archetype: 'wireless',
    scenario: 'A gym deliberately splits its coverage across two radios: a 2.4 GHz AP handles low-rate wearables while a separate 5 GHz AP-8 carries member video streaming. This item is about the 5 GHz half of that split. A neighbor gym broadcasts 5 GHz channel 153. Confirm AP-8 stays on its assigned 5 GHz band, then set it to a clean non-DFS channel clear of the neighbor.',
    assets: { reference: { kind: 'network',
      given: { site: 'Ironside Gym — main floor' },
      devices: [
        { id: 'ap8', label: 'AP-8', type: 'ap', zone: 'gym', ip: '5 GHz · ch ?', x: 1, y: 1 },
        { id: 'nbr', label: 'Neighbor gym AP', type: 'ap', zone: 'external', ip: '5 GHz · ch 153', channel: 153, x: 3, y: 1, state: 'compromised' },
        { id: 'phone', label: 'Member phones', type: 'pc', zone: 'gym', ip: '5 GHz streaming', x: 0, y: 2 }
      ],
      links: [ { from: 'ap8', to: 'phone' }, { from: 'nbr', to: 'ap8', kind: 'attack' } ]
    } },
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'In this dual-band split, AP-8 owns 5 GHz and the other AP owns 2.4 GHz. Which facts apply? Select all.',
        explanation: 'The split assigns AP-8 the 5 GHz streaming band while the wearable AP keeps 2.4 GHz — AP-8 must stay on 5 GHz, not chase the neighbor onto the other band. The neighbor holds 5 GHz channel 153, so AP-8 picks a different clean non-DFS 5 GHz channel like 48.',
        payload: { lines: [
          { id: 'l1', text: 'AP-8 is the 5 GHz radio in the split; the other AP owns 2.4 GHz for wearables.' },
          { id: 'l2', text: 'The neighbor gym occupies 5 GHz channel 153.' },
          { id: 'l3', text: 'AP-8 should stay on 5 GHz and pick a clean channel such as 48.' },
          { id: 'l4', text: 'AP-8 should move to 2.4 GHz to escape the neighbor.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } },
      { id: 's2', type: 'configure', points: 1, apId: 'ap8',
        require: { band: '5', channel: 48, security: 'WPA3-Personal', ssid: 'Ironside-5G' },
        prompt: 'Configure AP-8 to hold its 5 GHz half of the split on a clean channel.',
        explanation: 'Band 5 GHz keeps AP-8 on its assigned half of the dual-band split; channel 48 is a valid non-DFS 5 GHz channel not used by the neighbor (153); WPA3-Personal per policy.',
        payload: { slots: [
          { id: 'band', label: 'Band', options: [
            { id: 'a', text: '5' }, { id: 'b', text: '2.4' } ] },
          { id: 'channel', label: 'Channel', options: [
            { id: 'a', text: '48' }, { id: 'b', text: '153' }, { id: 'c', text: '11' } ] },
          { id: 'security', label: 'Security', options: [
            { id: 'a', text: 'WPA3-Personal' }, { id: 'b', text: 'WPA2-Personal' } ] },
          { id: 'ssid', label: 'SSID', options: [
            { id: 'a', text: 'Ironside-5G' }, { id: 'b', text: 'Ironside-Guest' } ] }
        ] },
        answer: { slots: { band: 'a', channel: 'a', security: 'a', ssid: 'a' } } }
    ]
  },

  // 12 — overlapping-channel trap in 2.4: distractors 3 and 9 overlap; correct 6, neighbor on 1
  {
    id: 'np-wifi-12',
    cert: 'netplus', objective: '2.3', topic: 'Channel planning',
    title: 'Reject the overlapping 2.4 GHz channels',
    estMinutes: 4, archetype: 'wireless',
    scenario: 'A tenant admin keeps “spreading out” by choosing channels like 3 and 9. AP-9 serves 2.4 GHz tablets and a neighbor holds channel 1. Diagnose why 3 and 9 are wrong, then set AP-9 to a truly non-overlapping channel.',
    assets: { reference: { kind: 'network',
      given: { site: 'Maple Court — suite 200' },
      devices: [
        { id: 'ap9', label: 'AP-9', type: 'ap', zone: 'suite', ip: '2.4 GHz · ch ?', x: 1, y: 1 },
        { id: 'nbr', label: 'Neighbor AP', type: 'ap', zone: 'external', ip: '2.4 GHz · ch 1', channel: 1, x: 3, y: 1, state: 'compromised' },
        { id: 'tab', label: 'Tablets', type: 'pc', zone: 'suite', ip: '2.4 GHz', x: 0, y: 2 }
      ],
      links: [ { from: 'ap9', to: 'tab' }, { from: 'nbr', to: 'ap9', kind: 'attack' } ]
    } },
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Why are channels 3 and 9 poor choices? Select all that apply.',
        explanation: 'Channels 3 and 9 overlap adjacent channels because only 1, 6, and 11 are non-overlapping in 2.4 GHz. With the neighbor on 1, channel 6 is the clean choice.',
        payload: { lines: [
          { id: 'l1', text: 'Only 1, 6, 11 are non-overlapping in 2.4 GHz.' },
          { id: 'l2', text: 'Channels 3 and 9 overlap neighboring channels.' },
          { id: 'l3', text: 'With the neighbor on 1, channel 6 is the clean choice.' },
          { id: 'l4', text: 'Any channel works because APs auto-negotiate to avoid overlap.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } },
      { id: 's2', type: 'configure', points: 1, apId: 'ap9',
        require: { band: '2.4', channel: 6, security: 'WPA3-Personal', ssid: 'Maple-200' },
        prompt: 'Configure AP-9 on a truly non-overlapping channel, clear of the neighbor.',
        explanation: 'Channel 6 is non-overlapping and not the neighbor’s 1; the overlapping 3 and 9 are rejected; band 2.4 GHz for the tablets; WPA3-Personal per policy.',
        payload: { slots: [
          { id: 'band', label: 'Band', options: [
            { id: 'a', text: '2.4' }, { id: 'b', text: '5' } ] },
          { id: 'channel', label: 'Channel', options: [
            { id: 'a', text: '6' }, { id: 'b', text: '3' }, { id: 'c', text: '9' }, { id: 'd', text: '1' } ] },
          { id: 'security', label: 'Security', options: [
            { id: 'a', text: 'WPA3-Personal' }, { id: 'b', text: 'WPA2-Personal' } ] },
          { id: 'ssid', label: 'SSID', options: [
            { id: 'a', text: 'Maple-200' }, { id: 'b', text: 'Maple-Guest' } ] }
        ] },
        answer: { slots: { band: 'a', channel: 'a', security: 'a', ssid: 'a' } } }
    ]
  },

  // 01 — mgmt SSH + staff HTTPS + deny-all. The canonical mockup scenario.
  // Fault drilled: a broad user-subnet deny shadows the staff HTTPS allow.
  {
    id: 'np-fw-01',
    cert: 'netplus', objective: '4.3', topic: 'Firewall rule order',
    title: 'Meridian Textiles locks down the server VLAN',
    estMinutes: 5, archetype: 'firewall',
    scenario: 'A firewall now sits between the users VLAN (10.10.10.0/24) and the servers VLAN (10.10.30.0/24). The change ticket has three lines: the IT admin at 10.10.10.5 manages the DB host over SSH, all staff reach the web app over HTTPS, everything else is blocked. Build the rules, order them for first-match-wins, then catch the mistake a rushed branch deploy left behind.',
    assets: { reference: { kind: 'network',
      given: { site: 'Meridian Textiles — FW-1', engine: 'first match wins, implicit deny' },
      devices: [
        { id: 'admin', label: 'IT admin', type: 'pc', zone: 'users', ip: '10.10.10.5', x: 0, y: 0 },
        { id: 'staff', label: 'Staff PCs', type: 'pc', zone: 'users', ip: '10.10.10.0/24', x: 0, y: 2 },
        { id: 'fw', label: 'FW-1', type: 'firewall', zone: 'edge', ip: 'top-down', x: 2, y: 1 },
        { id: 'web', label: 'Web app', type: 'server', zone: 'servers', ip: '10.10.30.10 · 443', x: 4, y: 0 },
        { id: 'db', label: 'DB + SSH', type: 'server', zone: 'servers', ip: '10.10.30.20 · 22', x: 4, y: 2 }
      ],
      links: [ { from: 'admin', to: 'fw' }, { from: 'staff', to: 'fw' }, { from: 'fw', to: 'web' }, { from: 'fw', to: 'db' } ]
    } },
    fwSpec: {
      rules: [
        { id: 'ssh', action: 'allow', proto: 'tcp', src: '10.10.10.5/32', dst: '10.10.30.20/32', port: 22 },
        { id: 'web', action: 'allow', proto: 'tcp', src: '10.10.10.0/24', dst: '10.10.30.10/32', port: 443 },
        { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
      ],
      flows: [
        { name: 'admin ssh to db', proto: 'tcp', src: '10.10.10.5', dst: '10.10.30.20', port: 22, expect: 'allow' },
        { name: 'staff https to web', proto: 'tcp', src: '10.10.10.77', dst: '10.10.30.10', port: 443, expect: 'allow' },
        { name: 'staff ssh to db blocked', proto: 'tcp', src: '10.10.10.77', dst: '10.10.30.20', port: 22, expect: 'deny' }
      ],
      shadowTable: {
        rules: [
          { id: 'ssh', action: 'allow', proto: 'tcp', src: '10.10.10.5/32', dst: '10.10.30.20/32', port: 22 },
          { id: 'blockusers', action: 'deny', proto: 'any', src: '10.10.10.0/24', dst: 'any', port: 'any' },
          { id: 'web', action: 'allow', proto: 'tcp', src: '10.10.10.0/24', dst: '10.10.30.10/32', port: 443 }
        ],
        shadowedRuleId: 'web'
      }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Build the admin-access rule (Ticket 1): the IT admin manages the DB host over SSH.',
        explanation: 'Least privilege: allow only the admin host 10.10.10.5/32 to the DB 10.10.30.20 on TCP 22 (SSH). Scoping to the /32 keeps the rest of the subnet out.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'a', text: 'allow' }, { id: 'd', text: 'deny' } ] },
          { id: 'src', label: 'Source', options: [ { id: 'host', text: '10.10.10.5/32' }, { id: 'sub', text: '10.10.10.0/24' }, { id: 'any', text: 'any' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'ssh', text: 'TCP 22' }, { id: 'https', text: 'TCP 443' }, { id: 'rdp', text: 'TCP 3389' } ] }
        ] },
        answer: { slots: { action: 'a', src: 'host', svc: 'ssh' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Build the staff-web rule (Ticket 2): all staff reach the web app over HTTPS.',
        explanation: 'All staff means the whole 10.10.10.0/24 subnet, to the web host 10.10.30.10 on TCP 443 (HTTPS).',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'a', text: 'allow' }, { id: 'd', text: 'deny' } ] },
          { id: 'src', label: 'Source', options: [ { id: 'host', text: '10.10.10.5/32' }, { id: 'sub', text: '10.10.10.0/24' }, { id: 'any', text: 'any' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'https', text: 'TCP 443' }, { id: 'http', text: 'TCP 80' }, { id: 'ssh', text: 'TCP 22' } ] }
        ] },
        answer: { slots: { action: 'a', src: 'sub', svc: 'https' } } },
      { id: 's3', type: 'order', points: 1,
        prompt: 'Arrange the table. FW-1 reads from position 1 down and stops at the first match.',
        explanation: 'Specific allows first (admin SSH, then staff HTTPS), the broad deny-all last. If the deny sits above an allow, the allow below it never fires.',
        payload: { items: [
          { id: 'deny', label: 'Deny all — any → any · any' },
          { id: 'web', label: 'Allow staff HTTPS — 10.10.10.0/24 → 10.10.30.10 · 443' },
          { id: 'ssh', label: 'Allow admin SSH — 10.10.10.5/32 → 10.10.30.20 · 22' }
        ] },
        answer: { correctOrder: ['ssh', 'web', 'deny'] } },
      { id: 's4', type: 'analyze', points: 1,
        prompt: 'A rushed branch deploy shipped this table. Which rule can never fire? Select all that apply.',
        explanation: 'The broad "deny 10.10.10.0/24 → any" at position 2 matches all staff traffic first, so the staff HTTPS allow below it never runs. Staff lost the web app. The admin SSH allow at position 1 still works because it sits above the deny.',
        payload: { lines: [
          { id: 'l1', text: 'The staff HTTPS allow is shadowed by the broad user-subnet deny above it.' },
          { id: 'l2', text: 'The admin SSH allow still fires — it sits above the deny.' },
          { id: 'l3', text: 'Moving the staff HTTPS allow above the broad deny fixes it.' },
          { id: 'l4', text: 'The table is fine; first-match order does not matter here.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } }
    ]
  },

  // 02 — web tiers: public HTTPS to DMZ web + app-tier to DB. Fault: broad DMZ
  // allow shadows the narrower app->db rule.
  {
    id: 'np-fw-02',
    cert: 'netplus', objective: '4.3', topic: 'DMZ segmentation',
    title: 'Three-tier app behind the DMZ firewall',
    estMinutes: 5, archetype: 'firewall',
    scenario: 'A public web tier lives in the DMZ (172.16.20.0/24); the app tier (172.16.30.0/24) talks to the database (172.16.40.10). The ticket: the internet reaches the DMZ web host on HTTPS, the app tier reaches the DB on MySQL 3306, nothing else crosses. Build, order, and catch the shadow.',
    assets: { reference: { kind: 'network',
      given: { site: 'Northwind Retail — perimeter FW', engine: 'first match wins, implicit deny' },
      devices: [
        { id: 'net', label: 'Internet', type: 'cloud', zone: 'outside', ip: 'any', x: 0, y: 1 },
        { id: 'fw', label: 'FW-DMZ', type: 'firewall', zone: 'edge', ip: 'top-down', x: 2, y: 1 },
        { id: 'dmzweb', label: 'DMZ web', type: 'server', zone: 'dmz', ip: '172.16.20.10 · 443', x: 4, y: 0 },
        { id: 'app', label: 'App tier', type: 'server', zone: 'app', ip: '172.16.30.0/24', x: 4, y: 1 },
        { id: 'db', label: 'Database', type: 'server', zone: 'data', ip: '172.16.40.10 · 3306', x: 4, y: 2 }
      ],
      links: [ { from: 'net', to: 'fw' }, { from: 'fw', to: 'dmzweb' }, { from: 'app', to: 'fw' }, { from: 'fw', to: 'db' } ]
    } },
    fwSpec: {
      rules: [
        { id: 'pubweb', action: 'allow', proto: 'tcp', src: 'any', dst: '172.16.20.10/32', port: 443 },
        { id: 'appdb', action: 'allow', proto: 'tcp', src: '172.16.30.0/24', dst: '172.16.40.10/32', port: 3306 },
        { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
      ],
      flows: [
        { name: 'internet to dmz web', proto: 'tcp', src: '203.0.113.9', dst: '172.16.20.10', port: 443, expect: 'allow' },
        { name: 'app to db mysql', proto: 'tcp', src: '172.16.30.15', dst: '172.16.40.10', port: 3306, expect: 'allow' },
        { name: 'internet to db blocked', proto: 'tcp', src: '203.0.113.9', dst: '172.16.40.10', port: 3306, expect: 'deny' }
      ],
      shadowTable: {
        rules: [
          { id: 'pubweb', action: 'allow', proto: 'tcp', src: 'any', dst: '172.16.20.10/32', port: 443 },
          { id: 'denyapp', action: 'deny', proto: 'any', src: '172.16.30.0/24', dst: 'any', port: 'any' },
          { id: 'appdb', action: 'allow', proto: 'tcp', src: '172.16.30.0/24', dst: '172.16.40.10/32', port: 3306 }
        ],
        shadowedRuleId: 'appdb'
      }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Build the public-web rule: the internet reaches the DMZ web host over HTTPS.',
        explanation: 'Public web means any source to the DMZ web host 172.16.20.10 on TCP 443 (HTTPS). Only the single host is exposed, not the whole DMZ.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'a', text: 'allow' }, { id: 'd', text: 'deny' } ] },
          { id: 'src', label: 'Source', options: [ { id: 'any', text: 'any' }, { id: 'app', text: '172.16.30.0/24' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'https', text: 'TCP 443' }, { id: 'mysql', text: 'TCP 3306' }, { id: 'ssh', text: 'TCP 22' } ] }
        ] },
        answer: { slots: { action: 'a', src: 'any', svc: 'https' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Build the app-to-DB rule: the app tier reaches the database over MySQL.',
        explanation: 'The app subnet 172.16.30.0/24 reaches the DB host 172.16.40.10 on TCP 3306 (MySQL). Internet must not reach the DB, so source is the app subnet, not any.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'a', text: 'allow' }, { id: 'd', text: 'deny' } ] },
          { id: 'src', label: 'Source', options: [ { id: 'any', text: 'any' }, { id: 'app', text: '172.16.30.0/24' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'mysql', text: 'TCP 3306' }, { id: 'https', text: 'TCP 443' }, { id: 'dns', text: 'UDP 53' } ] }
        ] },
        answer: { slots: { action: 'a', src: 'app', svc: 'mysql' } } },
      { id: 's3', type: 'order', points: 1,
        prompt: 'Arrange the table for first-match-wins.',
        explanation: 'Both specific allows go above the catch-all deny. Order among the two allows is fine as long as both precede the deny; the keyed order lists them public-web, app-db, deny.',
        payload: { items: [
          { id: 'deny', label: 'Deny all — any → any · any' },
          { id: 'appdb', label: 'Allow app→DB — 172.16.30.0/24 → 172.16.40.10 · 3306' },
          { id: 'pubweb', label: 'Allow public web — any → 172.16.20.10 · 443' }
        ] },
        answer: { correctOrder: ['pubweb', 'appdb', 'deny'] } },
      { id: 's4', type: 'analyze', points: 1,
        prompt: 'The deployed table below broke the app tier. Which rule never fires? Select all that apply.',
        explanation: 'A broad "deny 172.16.30.0/24 → any" was inserted above the app→DB allow, so all app-tier traffic is denied before the allow is reached. The app can no longer reach the database.',
        payload: { lines: [
          { id: 'l1', text: 'The app→DB allow is shadowed by the broad app-subnet deny above it.' },
          { id: 'l2', text: 'The public web allow at position 1 is unaffected.' },
          { id: 'l3', text: 'Removing or reordering the broad app-subnet deny restores DB access.' },
          { id: 'l4', text: 'MySQL uses UDP, so the TCP rule was never going to match.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } }
    ]
  },

  // 03 — guest isolation: guest wifi may reach internet but NOT internal LAN.
  // Fault: a permissive guest->any allow shadows the guest->LAN deny.
  {
    id: 'np-fw-03',
    cert: 'netplus', objective: '4.3', topic: 'Guest isolation',
    title: 'Keep the guest Wi-Fi off the corporate LAN',
    estMinutes: 5, archetype: 'firewall',
    scenario: 'Guest Wi-Fi (192.168.50.0/24) must reach the internet DNS resolver but must never touch the corporate LAN (192.168.10.0/24). The ticket: allow guest DNS to 9.9.9.9, deny guest→LAN, allow guest→internet for everything else. Build, order for first-match, and catch the shadow.',
    assets: { reference: { kind: 'network',
      given: { site: 'Lakeside Hotel — guest edge FW', engine: 'first match wins, implicit deny' },
      devices: [
        { id: 'guest', label: 'Guest Wi-Fi', type: 'pc', zone: 'guest', ip: '192.168.50.0/24', x: 0, y: 1 },
        { id: 'fw', label: 'FW-Guest', type: 'firewall', zone: 'edge', ip: 'top-down', x: 2, y: 1 },
        { id: 'lan', label: 'Corp LAN', type: 'server', zone: 'internal', ip: '192.168.10.0/24', x: 4, y: 0 },
        { id: 'dns', label: 'DNS resolver', type: 'cloud', zone: 'outside', ip: '9.9.9.9 · 53', x: 4, y: 2 }
      ],
      links: [ { from: 'guest', to: 'fw' }, { from: 'fw', to: 'lan' }, { from: 'fw', to: 'dns' } ]
    } },
    fwSpec: {
      rules: [
        { id: 'gdns', action: 'allow', proto: 'udp', src: '192.168.50.0/24', dst: '9.9.9.9/32', port: 53 },
        { id: 'noLan', action: 'deny', proto: 'any', src: '192.168.50.0/24', dst: '192.168.10.0/24', port: 'any' },
        { id: 'ginet', action: 'allow', proto: 'any', src: '192.168.50.0/24', dst: 'any', port: 'any' },
        { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
      ],
      flows: [
        { name: 'guest dns', proto: 'udp', src: '192.168.50.20', dst: '9.9.9.9', port: 53, expect: 'allow' },
        { name: 'guest to corp lan blocked', proto: 'tcp', src: '192.168.50.20', dst: '192.168.10.10', port: 445, expect: 'deny' },
        { name: 'guest to internet web', proto: 'tcp', src: '192.168.50.20', dst: '203.0.113.5', port: 443, expect: 'allow' }
      ],
      shadowTable: {
        rules: [
          { id: 'gdns', action: 'allow', proto: 'udp', src: '192.168.50.0/24', dst: '9.9.9.9/32', port: 53 },
          { id: 'ginet', action: 'allow', proto: 'any', src: '192.168.50.0/24', dst: 'any', port: 'any' },
          { id: 'noLan', action: 'deny', proto: 'any', src: '192.168.50.0/24', dst: '192.168.10.0/24', port: 'any' },
          { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
        ],
        shadowedRuleId: 'noLan'
      }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Build the guest-DNS rule: guests resolve names via the internet resolver 9.9.9.9.',
        explanation: 'DNS is UDP 53 to 9.9.9.9 from the guest subnet. Guests need name resolution to use the internet at all.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'a', text: 'allow' }, { id: 'd', text: 'deny' } ] },
          { id: 'dst', label: 'Destination', options: [ { id: 'res', text: '9.9.9.9/32' }, { id: 'lan', text: '192.168.10.0/24' }, { id: 'any', text: 'any' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'dns', text: 'UDP 53' }, { id: 'https', text: 'TCP 443' }, { id: 'smb', text: 'TCP 445' } ] }
        ] },
        answer: { slots: { action: 'a', dst: 'res', svc: 'dns' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Build the isolation rule: guests must never reach the corporate LAN.',
        explanation: 'An explicit deny from the guest subnet to the corporate LAN 192.168.10.0/24, any service. It must sit ABOVE the broad guest→internet allow, or the allow lets guest→LAN through.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'a', text: 'allow' }, { id: 'd', text: 'deny' } ] },
          { id: 'dst', label: 'Destination', options: [ { id: 'lan', text: '192.168.10.0/24' }, { id: 'any', text: 'any' }, { id: 'res', text: '9.9.9.9/32' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'any', text: 'any' }, { id: 'https', text: 'TCP 443' } ] }
        ] },
        answer: { slots: { action: 'd', dst: 'lan', svc: 'any' } } },
      { id: 's3', type: 'order', points: 1,
        prompt: 'Arrange the table. The guest→LAN deny must beat the broad guest→internet allow.',
        explanation: 'Order: guest DNS allow, then the guest→LAN deny, then the broad guest→internet allow, then the catch-all deny. Put the LAN deny above the internet allow or guests reach the LAN.',
        payload: { items: [
          { id: 'ginet', label: 'Allow guest→internet — 192.168.50.0/24 → any · any' },
          { id: 'deny', label: 'Deny all — any → any · any' },
          { id: 'noLan', label: 'Deny guest→LAN — 192.168.50.0/24 → 192.168.10.0/24 · any' },
          { id: 'gdns', label: 'Allow guest DNS — 192.168.50.0/24 → 9.9.9.9 · 53' }
        ] },
        answer: { correctOrder: ['gdns', 'noLan', 'ginet', 'deny'] } },
      { id: 's4', type: 'analyze', points: 1,
        prompt: 'The deployed table below leaks guests onto the LAN. Which rule never fires? Select all that apply.',
        explanation: 'The broad guest→any allow was placed above the guest→LAN deny, so guest traffic to the corporate LAN matches the allow first and is permitted. The deny never fires. Isolation is broken.',
        payload: { lines: [
          { id: 'l1', text: 'The guest→LAN deny is shadowed by the broad guest→internet allow above it.' },
          { id: 'l2', text: 'Guests can now reach the corporate LAN, defeating isolation.' },
          { id: 'l3', text: 'Moving the guest→LAN deny above the broad allow restores isolation.' },
          { id: 'l4', text: 'The catch-all deny at the bottom already blocks guest→LAN, so order is irrelevant.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } }
    ]
  },

  // 04 — deny-log placement: explicit logged deny for a known-bad host must sit
  // above the general allow. Fault: general allow shadows the logged deny.
  {
    id: 'np-fw-04',
    cert: 'netplus', objective: '4.3', topic: 'Deny + logging placement',
    title: 'Log and drop the compromised kiosk',
    estMinutes: 5, archetype: 'firewall',
    scenario: 'Security flagged a kiosk at 10.20.5.66 as compromised. It must be dropped and logged, while the rest of the kiosk subnet (10.20.5.0/24) keeps its normal HTTPS to the payment gateway 10.20.9.10. The ticket: log-deny the bad host, allow the subnet to the gateway, deny the rest. Build, order, catch the shadow.',
    assets: { reference: { kind: 'network',
      given: { site: 'CityMart POS — segment FW', engine: 'first match wins, implicit deny' },
      devices: [
        { id: 'bad', label: 'Kiosk (bad)', type: 'pc', zone: 'kiosk', ip: '10.20.5.66', x: 0, y: 0, state: 'compromised' },
        { id: 'kiosk', label: 'Kiosk subnet', type: 'pc', zone: 'kiosk', ip: '10.20.5.0/24', x: 0, y: 2 },
        { id: 'fw', label: 'FW-POS', type: 'firewall', zone: 'edge', ip: 'top-down', x: 2, y: 1 },
        { id: 'gw', label: 'Payment GW', type: 'server', zone: 'pci', ip: '10.20.9.10 · 443', x: 4, y: 1 }
      ],
      links: [ { from: 'bad', to: 'fw' }, { from: 'kiosk', to: 'fw' }, { from: 'fw', to: 'gw' } ]
    } },
    fwSpec: {
      rules: [
        { id: 'logdrop', action: 'deny', proto: 'any', src: '10.20.5.66/32', dst: 'any', port: 'any' },
        { id: 'pay', action: 'allow', proto: 'tcp', src: '10.20.5.0/24', dst: '10.20.9.10/32', port: 443 },
        { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
      ],
      flows: [
        { name: 'bad kiosk dropped', proto: 'tcp', src: '10.20.5.66', dst: '10.20.9.10', port: 443, expect: 'deny' },
        { name: 'good kiosk to gateway', proto: 'tcp', src: '10.20.5.20', dst: '10.20.9.10', port: 443, expect: 'allow' },
        { name: 'kiosk to random host blocked', proto: 'tcp', src: '10.20.5.20', dst: '10.20.9.99', port: 443, expect: 'deny' }
      ],
      shadowTable: {
        rules: [
          { id: 'pay', action: 'allow', proto: 'tcp', src: '10.20.5.0/24', dst: '10.20.9.10/32', port: 443 },
          { id: 'logdrop', action: 'deny', proto: 'any', src: '10.20.5.66/32', dst: 'any', port: 'any' },
          { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
        ],
        shadowedRuleId: 'logdrop'
      }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Build the log-drop rule for the compromised kiosk 10.20.5.66.',
        explanation: 'An explicit deny of the single bad host 10.20.5.66/32, any destination, any service — placed above the subnet allow so the bad host is caught before the general allow lets it through.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'd', text: 'deny' }, { id: 'a', text: 'allow' } ] },
          { id: 'src', label: 'Source', options: [ { id: 'host', text: '10.20.5.66/32' }, { id: 'sub', text: '10.20.5.0/24' }, { id: 'any', text: 'any' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'any', text: 'any' }, { id: 'https', text: 'TCP 443' } ] }
        ] },
        answer: { slots: { action: 'd', src: 'host', svc: 'any' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Build the payment rule: the kiosk subnet reaches the gateway over HTTPS.',
        explanation: 'The kiosk subnet 10.20.5.0/24 to the payment gateway 10.20.9.10 on TCP 443. The bad host is a member of this subnet, which is exactly why its deny must sit above this allow.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'a', text: 'allow' }, { id: 'd', text: 'deny' } ] },
          { id: 'src', label: 'Source', options: [ { id: 'sub', text: '10.20.5.0/24' }, { id: 'host', text: '10.20.5.66/32' }, { id: 'any', text: 'any' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'https', text: 'TCP 443' }, { id: 'ssh', text: 'TCP 22' } ] }
        ] },
        answer: { slots: { action: 'a', src: 'sub', svc: 'https' } } },
      { id: 's3', type: 'order', points: 1,
        prompt: 'Arrange the table so the bad host is dropped before the subnet allow.',
        explanation: 'Most specific first: the /32 log-drop, then the /24 payment allow, then the catch-all deny. A /24 allow above the /32 deny would let the bad host through.',
        payload: { items: [
          { id: 'pay', label: 'Allow kiosk→gateway — 10.20.5.0/24 → 10.20.9.10 · 443' },
          { id: 'deny', label: 'Deny all — any → any · any' },
          { id: 'logdrop', label: 'Deny+log bad host — 10.20.5.66/32 → any · any' }
        ] },
        answer: { correctOrder: ['logdrop', 'pay', 'deny'] } },
      { id: 's4', type: 'analyze', points: 1,
        prompt: 'The deployed table below lets the compromised kiosk keep talking. Which rule never fires? Select all that apply.',
        explanation: 'The /24 payment allow was placed above the /32 log-drop, so the bad host 10.20.5.66 matches the subnet allow first and is permitted. The log-drop below it never fires and the compromised host is never logged or blocked.',
        payload: { lines: [
          { id: 'l1', text: 'The log-drop rule is shadowed by the broader subnet allow above it.' },
          { id: 'l2', text: 'The compromised kiosk is still reaching the gateway.' },
          { id: 'l3', text: 'Moving the specific /32 log-drop above the /24 allow fixes it.' },
          { id: 'l4', text: 'Deny rules always win regardless of position, so order does not matter.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } }
    ]
  },

  // 05 — mgmt jump host: only the jump box reaches infra over SSH/RDP.
  // Fault: broad admin-subnet allow shadows nothing wrong, but a mis-ordered
  // deny-any shadows the RDP allow.
  {
    id: 'np-fw-05',
    cert: 'netplus', objective: '1.4', topic: 'Management protocols',
    title: 'Only the jump host manages the server room',
    estMinutes: 5, archetype: 'firewall',
    scenario: 'Infra admins must go through the jump host 10.5.1.9 to reach the server room (10.5.30.0/24): SSH to Linux, RDP to Windows. Nothing else may manage those servers. The ticket: allow jump→SSH, allow jump→RDP, deny the rest. Build, order, and catch the shadow.',
    assets: { reference: { kind: 'network',
      given: { site: 'Fjord Bank — infra FW', engine: 'first match wins, implicit deny' },
      devices: [
        { id: 'jump', label: 'Jump host', type: 'pc', zone: 'mgmt', ip: '10.5.1.9', x: 0, y: 1 },
        { id: 'fw', label: 'FW-Infra', type: 'firewall', zone: 'edge', ip: 'top-down', x: 2, y: 1 },
        { id: 'lin', label: 'Linux hosts', type: 'server', zone: 'serverroom', ip: '10.5.30.0/24 · 22', x: 4, y: 0 },
        { id: 'win', label: 'Windows hosts', type: 'server', zone: 'serverroom', ip: '10.5.30.0/24 · 3389', x: 4, y: 2 }
      ],
      links: [ { from: 'jump', to: 'fw' }, { from: 'fw', to: 'lin' }, { from: 'fw', to: 'win' } ]
    } },
    fwSpec: {
      rules: [
        { id: 'ssh', action: 'allow', proto: 'tcp', src: '10.5.1.9/32', dst: '10.5.30.0/24', port: 22 },
        { id: 'rdp', action: 'allow', proto: 'tcp', src: '10.5.1.9/32', dst: '10.5.30.0/24', port: 3389 },
        { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
      ],
      flows: [
        { name: 'jump ssh', proto: 'tcp', src: '10.5.1.9', dst: '10.5.30.10', port: 22, expect: 'allow' },
        { name: 'jump rdp', proto: 'tcp', src: '10.5.1.9', dst: '10.5.30.20', port: 3389, expect: 'allow' },
        { name: 'other admin ssh blocked', proto: 'tcp', src: '10.5.1.40', dst: '10.5.30.10', port: 22, expect: 'deny' }
      ],
      shadowTable: {
        rules: [
          { id: 'ssh', action: 'allow', proto: 'tcp', src: '10.5.1.9/32', dst: '10.5.30.0/24', port: 22 },
          { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' },
          { id: 'rdp', action: 'allow', proto: 'tcp', src: '10.5.1.9/32', dst: '10.5.30.0/24', port: 3389 }
        ],
        shadowedRuleId: 'rdp'
      }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Build the jump→SSH rule for the Linux hosts.',
        explanation: 'The jump host 10.5.1.9/32 reaches the server room 10.5.30.0/24 on TCP 22 (SSH). Source is the single jump host, per least privilege.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'a', text: 'allow' }, { id: 'd', text: 'deny' } ] },
          { id: 'src', label: 'Source', options: [ { id: 'jump', text: '10.5.1.9/32' }, { id: 'sub', text: '10.5.1.0/24' }, { id: 'any', text: 'any' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'ssh', text: 'TCP 22' }, { id: 'rdp', text: 'TCP 3389' }, { id: 'https', text: 'TCP 443' } ] }
        ] },
        answer: { slots: { action: 'a', src: 'jump', svc: 'ssh' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Build the jump→RDP rule for the Windows hosts.',
        explanation: 'The same jump host to the server room on TCP 3389 (RDP). RDP is 3389, distinct from SSH 22.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'a', text: 'allow' }, { id: 'd', text: 'deny' } ] },
          { id: 'src', label: 'Source', options: [ { id: 'jump', text: '10.5.1.9/32' }, { id: 'sub', text: '10.5.1.0/24' }, { id: 'any', text: 'any' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'rdp', text: 'TCP 3389' }, { id: 'ssh', text: 'TCP 22' }, { id: 'telnet', text: 'TCP 23' } ] }
        ] },
        answer: { slots: { action: 'a', src: 'jump', svc: 'rdp' } } },
      { id: 's3', type: 'order', points: 1,
        prompt: 'Arrange the table for first-match-wins.',
        explanation: 'Both jump-host allows above the catch-all deny. If the deny sits between them, the second allow (RDP) never fires.',
        payload: { items: [
          { id: 'deny', label: 'Deny all — any → any · any' },
          { id: 'rdp', label: 'Allow jump→RDP — 10.5.1.9/32 → 10.5.30.0/24 · 3389' },
          { id: 'ssh', label: 'Allow jump→SSH — 10.5.1.9/32 → 10.5.30.0/24 · 22' }
        ] },
        answer: { correctOrder: ['ssh', 'rdp', 'deny'] } },
      { id: 's4', type: 'analyze', points: 1,
        prompt: 'The deployed table below broke RDP to the Windows hosts. Which rule never fires? Select all that apply.',
        explanation: 'The catch-all deny was placed between the SSH allow and the RDP allow. Once the deny is reached, everything below it — including the RDP allow — never runs. SSH still works because it sits above the deny.',
        payload: { lines: [
          { id: 'l1', text: 'The RDP allow is shadowed by the catch-all deny placed above it.' },
          { id: 'l2', text: 'SSH still works because its allow sits above the deny.' },
          { id: 'l3', text: 'Moving the catch-all deny to the very bottom fixes RDP.' },
          { id: 'l4', text: 'RDP and SSH share a port, so one rule should cover both.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } }
    ]
  },

  // 06 — VoIP QoS/segment: allow SIP+RTP from phones to the PBX, deny data VLAN
  // from the voice VLAN. Fault: broad allow shadows the voice->data deny.
  {
    id: 'np-fw-06',
    cert: 'netplus', objective: '1.4', topic: 'VoIP ports (SIP/RTP)',
    title: 'Voice VLAN talks to the PBX, not the data VLAN',
    estMinutes: 5, archetype: 'firewall',
    scenario: 'The voice VLAN (10.7.20.0/24) carries IP phones. They must reach the PBX 10.7.40.10 for SIP signaling and RTP media, but must not touch the data VLAN (10.7.10.0/24). The ticket: allow SIP, allow RTP, deny voice→data, deny the rest. Build, order, catch the shadow.',
    assets: { reference: { kind: 'network',
      given: { site: 'Harborline Logistics — voice FW', engine: 'first match wins, implicit deny' },
      devices: [
        { id: 'phones', label: 'IP phones', type: 'pc', zone: 'voice', ip: '10.7.20.0/24', x: 0, y: 1 },
        { id: 'fw', label: 'FW-Voice', type: 'firewall', zone: 'edge', ip: 'top-down', x: 2, y: 1 },
        { id: 'pbx', label: 'PBX', type: 'server', zone: 'voice-core', ip: '10.7.40.10 · 5060/RTP', x: 4, y: 0 },
        { id: 'data', label: 'Data VLAN', type: 'server', zone: 'data', ip: '10.7.10.0/24', x: 4, y: 2 }
      ],
      links: [ { from: 'phones', to: 'fw' }, { from: 'fw', to: 'pbx' }, { from: 'fw', to: 'data' } ]
    } },
    fwSpec: {
      rules: [
        { id: 'sip', action: 'allow', proto: 'udp', src: '10.7.20.0/24', dst: '10.7.40.10/32', port: 5060 },
        { id: 'rtp', action: 'allow', proto: 'udp', src: '10.7.20.0/24', dst: '10.7.40.10/32', port: 16384 },
        { id: 'noData', action: 'deny', proto: 'any', src: '10.7.20.0/24', dst: '10.7.10.0/24', port: 'any' },
        { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
      ],
      flows: [
        { name: 'phone sip to pbx', proto: 'udp', src: '10.7.20.30', dst: '10.7.40.10', port: 5060, expect: 'allow' },
        { name: 'phone rtp to pbx', proto: 'udp', src: '10.7.20.30', dst: '10.7.40.10', port: 16384, expect: 'allow' },
        { name: 'phone to data vlan blocked', proto: 'tcp', src: '10.7.20.30', dst: '10.7.10.10', port: 445, expect: 'deny' }
      ],
      shadowTable: {
        rules: [
          { id: 'sip', action: 'allow', proto: 'udp', src: '10.7.20.0/24', dst: '10.7.40.10/32', port: 5060 },
          { id: 'rtp', action: 'allow', proto: 'udp', src: '10.7.20.0/24', dst: '10.7.40.10/32', port: 16384 },
          { id: 'voiceAny', action: 'allow', proto: 'any', src: '10.7.20.0/24', dst: 'any', port: 'any' },
          { id: 'noData', action: 'deny', proto: 'any', src: '10.7.20.0/24', dst: '10.7.10.0/24', port: 'any' }
        ],
        shadowedRuleId: 'noData'
      }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Build the SIP signaling rule from the phones to the PBX.',
        explanation: 'SIP signaling is UDP 5060 from the voice subnet to the PBX host 10.7.40.10.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'a', text: 'allow' }, { id: 'd', text: 'deny' } ] },
          { id: 'dst', label: 'Destination', options: [ { id: 'pbx', text: '10.7.40.10/32' }, { id: 'data', text: '10.7.10.0/24' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'sip', text: 'UDP 5060' }, { id: 'https', text: 'TCP 443' }, { id: 'smb', text: 'TCP 445' } ] }
        ] },
        answer: { slots: { action: 'a', dst: 'pbx', svc: 'sip' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Build the isolation rule: the voice VLAN must not reach the data VLAN.',
        explanation: 'A deny from the voice subnet to the data VLAN 10.7.10.0/24, any service. It must sit above any broad voice allow.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'd', text: 'deny' }, { id: 'a', text: 'allow' } ] },
          { id: 'dst', label: 'Destination', options: [ { id: 'data', text: '10.7.10.0/24' }, { id: 'pbx', text: '10.7.40.10/32' }, { id: 'any', text: 'any' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'any', text: 'any' }, { id: 'sip', text: 'UDP 5060' } ] }
        ] },
        answer: { slots: { action: 'd', dst: 'data', svc: 'any' } } },
      { id: 's3', type: 'order', points: 1,
        prompt: 'Arrange the table for first-match-wins.',
        explanation: 'SIP allow, RTP allow, then the voice→data deny, then the catch-all deny. The voice→data deny must precede any broad voice allow.',
        payload: { items: [
          { id: 'deny', label: 'Deny all — any → any · any' },
          { id: 'noData', label: 'Deny voice→data — 10.7.20.0/24 → 10.7.10.0/24 · any' },
          { id: 'rtp', label: 'Allow RTP — 10.7.20.0/24 → 10.7.40.10 · 16384' },
          { id: 'sip', label: 'Allow SIP — 10.7.20.0/24 → 10.7.40.10 · 5060' }
        ] },
        answer: { correctOrder: ['sip', 'rtp', 'noData', 'deny'] } },
      { id: 's4', type: 'analyze', points: 1,
        prompt: 'The deployed table below lets phones reach the data VLAN. Which rule never fires? Select all that apply.',
        explanation: 'A broad "allow voice → any" was inserted above the voice→data deny. Voice traffic to the data VLAN matches that allow first and is permitted, so the deny never fires and voice/data segmentation is broken.',
        payload: { lines: [
          { id: 'l1', text: 'The voice→data deny is shadowed by the broad voice→any allow above it.' },
          { id: 'l2', text: 'Phones can now reach the data VLAN, breaking segmentation.' },
          { id: 'l3', text: 'Removing the broad voice→any allow (or moving the deny above it) fixes it.' },
          { id: 'l4', text: 'SIP and RTP allows caused the leak, so they should be removed.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } }
    ]
  },

  // 07 — outbound egress filtering: allow web + DNS out, deny everything else
  // outbound. Fault: a broad outbound allow shadows the DNS-only intent, but the
  // shadowed rule here is the SMTP block.
  {
    id: 'np-fw-07',
    cert: 'netplus', objective: '4.3', topic: 'Egress filtering',
    title: 'Egress filter blocks direct outbound mail',
    estMinutes: 5, archetype: 'firewall',
    scenario: 'To stop malware exfiltration, the LAN (10.30.0.0/16) may only send web (443) and DNS (53) directly to the internet; direct SMTP 25 from clients must be denied so only the mail relay 10.30.9.10 sends mail. The ticket: deny client SMTP, allow HTTPS out, allow DNS out, deny the rest. Build, order, catch the shadow.',
    assets: { reference: { kind: 'network',
      given: { site: 'Summit Insurance — egress FW', engine: 'first match wins, implicit deny' },
      devices: [
        { id: 'lan', label: 'LAN clients', type: 'pc', zone: 'internal', ip: '10.30.0.0/16', x: 0, y: 1 },
        { id: 'relay', label: 'Mail relay', type: 'server', zone: 'internal', ip: '10.30.9.10 · 25', x: 0, y: 2 },
        { id: 'fw', label: 'FW-Edge', type: 'firewall', zone: 'edge', ip: 'top-down', x: 2, y: 1 },
        { id: 'net', label: 'Internet', type: 'cloud', zone: 'outside', ip: 'any', x: 4, y: 1 }
      ],
      links: [ { from: 'lan', to: 'fw' }, { from: 'relay', to: 'fw' }, { from: 'fw', to: 'net' } ]
    } },
    fwSpec: {
      rules: [
        { id: 'noSmtp', action: 'deny', proto: 'tcp', src: '10.30.0.0/16', dst: 'any', port: 25 },
        { id: 'web', action: 'allow', proto: 'tcp', src: '10.30.0.0/16', dst: 'any', port: 443 },
        { id: 'dns', action: 'allow', proto: 'udp', src: '10.30.0.0/16', dst: 'any', port: 53 },
        { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
      ],
      flows: [
        { name: 'client smtp blocked', proto: 'tcp', src: '10.30.4.20', dst: '198.51.100.25', port: 25, expect: 'deny' },
        { name: 'client https out', proto: 'tcp', src: '10.30.4.20', dst: '198.51.100.80', port: 443, expect: 'allow' },
        { name: 'client dns out', proto: 'udp', src: '10.30.4.20', dst: '198.51.100.53', port: 53, expect: 'allow' }
      ],
      shadowTable: {
        rules: [
          { id: 'web', action: 'allow', proto: 'tcp', src: '10.30.0.0/16', dst: 'any', port: 443 },
          { id: 'lanOut', action: 'allow', proto: 'tcp', src: '10.30.0.0/16', dst: 'any', port: 'any' },
          { id: 'noSmtp', action: 'deny', proto: 'tcp', src: '10.30.0.0/16', dst: 'any', port: 25 },
          { id: 'dns', action: 'allow', proto: 'udp', src: '10.30.0.0/16', dst: 'any', port: 53 },
          { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
        ],
        shadowedRuleId: 'noSmtp'
      }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Build the SMTP-block rule: clients may not send mail directly to the internet.',
        explanation: 'A deny on TCP 25 from the LAN to any destination forces mail through the relay. This must sit above any broad outbound allow.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'd', text: 'deny' }, { id: 'a', text: 'allow' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'smtp', text: 'TCP 25' }, { id: 'https', text: 'TCP 443' }, { id: 'dns', text: 'UDP 53' } ] },
          { id: 'dst', label: 'Destination', options: [ { id: 'any', text: 'any' }, { id: 'relay', text: '10.30.9.10/32' } ] }
        ] },
        answer: { slots: { action: 'd', svc: 'smtp', dst: 'any' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Build the outbound HTTPS rule for the LAN.',
        explanation: 'Allow TCP 443 from the LAN to any destination — normal web browsing. DNS gets its own UDP 53 rule.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'a', text: 'allow' }, { id: 'd', text: 'deny' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'https', text: 'TCP 443' }, { id: 'smtp', text: 'TCP 25' }, { id: 'any', text: 'any' } ] },
          { id: 'dst', label: 'Destination', options: [ { id: 'any', text: 'any' }, { id: 'relay', text: '10.30.9.10/32' } ] }
        ] },
        answer: { slots: { action: 'a', svc: 'https', dst: 'any' } } },
      { id: 's3', type: 'order', points: 1,
        prompt: 'Arrange the table for first-match-wins.',
        explanation: 'The SMTP deny goes first so it beats the broad allows; then HTTPS allow, DNS allow, then the catch-all deny. A blanket outbound allow above the SMTP deny would let mail out.',
        payload: { items: [
          { id: 'deny', label: 'Deny all — any → any · any' },
          { id: 'dns', label: 'Allow DNS out — 10.30.0.0/16 → any · 53/udp' },
          { id: 'web', label: 'Allow HTTPS out — 10.30.0.0/16 → any · 443' },
          { id: 'noSmtp', label: 'Deny client SMTP — 10.30.0.0/16 → any · 25' }
        ] },
        answer: { correctOrder: ['noSmtp', 'web', 'dns', 'deny'] } },
      { id: 's4', type: 'analyze', points: 1,
        prompt: 'The deployed table below lets clients spew mail directly. Which rule never fires? Select all that apply.',
        explanation: 'A broad "allow LAN → any (any TCP port)" was placed above the SMTP deny, so client traffic on TCP 25 matches that allow first and is permitted. The SMTP deny below it never fires — direct outbound mail is open again.',
        payload: { lines: [
          { id: 'l1', text: 'The SMTP deny is shadowed by the broad outbound TCP allow above it.' },
          { id: 'l2', text: 'Clients can send mail directly to the internet, defeating the relay.' },
          { id: 'l3', text: 'Moving the SMTP deny above the broad outbound allow fixes it.' },
          { id: 'l4', text: 'Egress filtering only applies to inbound rules, so this is expected.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } }
    ]
  },

  // 08 — inbound DNAT service exposure: expose only 80/443 to the DMZ web,
  // block everything else inbound. Fault: broad inbound allow shadows a specific
  // deny for the admin port.
  {
    id: 'np-fw-08',
    cert: 'netplus', objective: '1.4', topic: 'Well-known ports',
    title: 'Expose only web ports on the public server',
    estMinutes: 5, archetype: 'firewall',
    scenario: 'A public server 203.0.113.20 should answer HTTP and HTTPS from the internet, but its management port SSH 22 must never be reachable from outside. The ticket: deny inbound SSH, allow inbound HTTP, allow inbound HTTPS, deny the rest. Build, order, catch the shadow.',
    assets: { reference: { kind: 'network',
      given: { site: 'Beacon Media — public web FW', engine: 'first match wins, implicit deny' },
      devices: [
        { id: 'net', label: 'Internet', type: 'cloud', zone: 'outside', ip: 'any', x: 0, y: 1 },
        { id: 'fw', label: 'FW-Pub', type: 'firewall', zone: 'edge', ip: 'top-down', x: 2, y: 1 },
        { id: 'web', label: 'Public server', type: 'server', zone: 'dmz', ip: '203.0.113.20 · 80/443', x: 4, y: 1 }
      ],
      links: [ { from: 'net', to: 'fw' }, { from: 'fw', to: 'web' } ]
    } },
    fwSpec: {
      rules: [
        { id: 'noSsh', action: 'deny', proto: 'tcp', src: 'any', dst: '203.0.113.20/32', port: 22 },
        { id: 'http', action: 'allow', proto: 'tcp', src: 'any', dst: '203.0.113.20/32', port: 80 },
        { id: 'https', action: 'allow', proto: 'tcp', src: 'any', dst: '203.0.113.20/32', port: 443 },
        { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
      ],
      flows: [
        { name: 'internet ssh blocked', proto: 'tcp', src: '198.51.100.9', dst: '203.0.113.20', port: 22, expect: 'deny' },
        { name: 'internet http', proto: 'tcp', src: '198.51.100.9', dst: '203.0.113.20', port: 80, expect: 'allow' },
        { name: 'internet https', proto: 'tcp', src: '198.51.100.9', dst: '203.0.113.20', port: 443, expect: 'allow' }
      ],
      shadowTable: {
        rules: [
          { id: 'http', action: 'allow', proto: 'tcp', src: 'any', dst: '203.0.113.20/32', port: 80 },
          { id: 'anyToWeb', action: 'allow', proto: 'tcp', src: 'any', dst: '203.0.113.20/32', port: 'any' },
          { id: 'noSsh', action: 'deny', proto: 'tcp', src: 'any', dst: '203.0.113.20/32', port: 22 },
          { id: 'https', action: 'allow', proto: 'tcp', src: 'any', dst: '203.0.113.20/32', port: 443 },
          { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
        ],
        shadowedRuleId: 'noSsh'
      }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Build the SSH-block rule: management port must not be reachable from the internet.',
        explanation: 'A deny on inbound TCP 22 to the public server. It must sit above the web allows and above any broad allow, or SSH leaks.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'd', text: 'deny' }, { id: 'a', text: 'allow' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'ssh', text: 'TCP 22' }, { id: 'http', text: 'TCP 80' }, { id: 'https', text: 'TCP 443' } ] },
          { id: 'src', label: 'Source', options: [ { id: 'any', text: 'any' }, { id: 'lan', text: '10.0.0.0/8' } ] }
        ] },
        answer: { slots: { action: 'd', svc: 'ssh', src: 'any' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Build the inbound HTTP rule for the public server.',
        explanation: 'Allow TCP 80 from any source to the public server 203.0.113.20. HTTPS gets its own rule on 443.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'a', text: 'allow' }, { id: 'd', text: 'deny' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'http', text: 'TCP 80' }, { id: 'ssh', text: 'TCP 22' }, { id: 'any', text: 'any' } ] },
          { id: 'dst', label: 'Destination', options: [ { id: 'web', text: '203.0.113.20/32' }, { id: 'any', text: 'any' } ] }
        ] },
        answer: { slots: { action: 'a', svc: 'http', dst: 'web' } } },
      { id: 's3', type: 'order', points: 1,
        prompt: 'Arrange the table for first-match-wins.',
        explanation: 'The SSH deny goes first so it beats any allow; then HTTP allow, HTTPS allow, then the catch-all deny. An allow-any-port to the server above the SSH deny would expose management.',
        payload: { items: [
          { id: 'deny', label: 'Deny all — any → any · any' },
          { id: 'https', label: 'Allow HTTPS — any → 203.0.113.20 · 443' },
          { id: 'http', label: 'Allow HTTP — any → 203.0.113.20 · 80' },
          { id: 'noSsh', label: 'Deny inbound SSH — any → 203.0.113.20 · 22' }
        ] },
        answer: { correctOrder: ['noSsh', 'http', 'https', 'deny'] } },
      { id: 's4', type: 'analyze', points: 1,
        prompt: 'The deployed table below exposes SSH to the internet. Which rule never fires? Select all that apply.',
        explanation: 'A broad "allow any → server (any port)" was placed above the SSH deny, so inbound TCP 22 matches that allow first and is permitted. The SSH deny below it never fires — the management port is exposed to the whole internet.',
        payload: { lines: [
          { id: 'l1', text: 'The SSH deny is shadowed by the allow-any-port rule above it.' },
          { id: 'l2', text: 'SSH 22 is now reachable from the internet, exposing management.' },
          { id: 'l3', text: 'Moving the SSH deny above the allow-any-port rule fixes it.' },
          { id: 'l4', text: 'SSH is UDP, so a TCP deny would never have matched anyway.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } }
    ]
  },

  // 09 — backup window: allow backup agent to NAS over a specific port, deny the
  // rest of that VLAN to storage. Fault: broad VLAN allow shadows the deny.
  {
    id: 'np-fw-09',
    cert: 'netplus', objective: '4.3', topic: 'Least-privilege allow',
    title: 'Only the backup agent reaches the NAS',
    estMinutes: 5, archetype: 'firewall',
    scenario: 'On the ops VLAN (10.12.0.0/24) only the backup agent 10.12.0.50 may reach the NAS 10.12.9.10 over TCP 2049 (NFS). Every other ops host must be blocked from storage. The ticket: allow the agent to the NAS, deny ops→NAS, deny the rest. Build, order, catch the shadow.',
    assets: { reference: { kind: 'network',
      given: { site: 'Granite Health — ops FW', engine: 'first match wins, implicit deny' },
      devices: [
        { id: 'agent', label: 'Backup agent', type: 'pc', zone: 'ops', ip: '10.12.0.50', x: 0, y: 0 },
        { id: 'ops', label: 'Ops hosts', type: 'pc', zone: 'ops', ip: '10.12.0.0/24', x: 0, y: 2 },
        { id: 'fw', label: 'FW-Ops', type: 'firewall', zone: 'edge', ip: 'top-down', x: 2, y: 1 },
        { id: 'nas', label: 'NAS', type: 'server', zone: 'storage', ip: '10.12.9.10 · 2049', x: 4, y: 1 }
      ],
      links: [ { from: 'agent', to: 'fw' }, { from: 'ops', to: 'fw' }, { from: 'fw', to: 'nas' } ]
    } },
    fwSpec: {
      rules: [
        { id: 'agentNas', action: 'allow', proto: 'tcp', src: '10.12.0.50/32', dst: '10.12.9.10/32', port: 2049 },
        { id: 'noOps', action: 'deny', proto: 'any', src: '10.12.0.0/24', dst: '10.12.9.10/32', port: 'any' },
        { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
      ],
      flows: [
        { name: 'agent to nas nfs', proto: 'tcp', src: '10.12.0.50', dst: '10.12.9.10', port: 2049, expect: 'allow' },
        { name: 'other ops host to nas blocked', proto: 'tcp', src: '10.12.0.77', dst: '10.12.9.10', port: 2049, expect: 'deny' },
        { name: 'agent to random storage blocked', proto: 'tcp', src: '10.12.0.50', dst: '10.12.9.99', port: 2049, expect: 'deny' }
      ],
      shadowTable: {
        rules: [
          { id: 'opsAllow', action: 'allow', proto: 'tcp', src: '10.12.0.0/24', dst: '10.12.9.10/32', port: 2049 },
          { id: 'agentNas', action: 'allow', proto: 'tcp', src: '10.12.0.50/32', dst: '10.12.9.10/32', port: 2049 },
          { id: 'noOps', action: 'deny', proto: 'any', src: '10.12.0.0/24', dst: '10.12.9.10/32', port: 'any' },
          { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
        ],
        shadowedRuleId: 'noOps'
      }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Build the backup-agent rule: only 10.12.0.50 reaches the NAS over NFS.',
        explanation: 'Allow the single agent host 10.12.0.50/32 to the NAS 10.12.9.10 on TCP 2049 (NFS). Scoped to the /32 for least privilege.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'a', text: 'allow' }, { id: 'd', text: 'deny' } ] },
          { id: 'src', label: 'Source', options: [ { id: 'agent', text: '10.12.0.50/32' }, { id: 'sub', text: '10.12.0.0/24' }, { id: 'any', text: 'any' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'nfs', text: 'TCP 2049' }, { id: 'smb', text: 'TCP 445' }, { id: 'https', text: 'TCP 443' } ] }
        ] },
        answer: { slots: { action: 'a', src: 'agent', svc: 'nfs' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Build the ops-block rule: no other ops host may reach the NAS.',
        explanation: 'A deny from the ops subnet 10.12.0.0/24 to the NAS host, any service. It sits below the agent /32 allow, so the agent is permitted but every other ops host is blocked.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'd', text: 'deny' }, { id: 'a', text: 'allow' } ] },
          { id: 'src', label: 'Source', options: [ { id: 'sub', text: '10.12.0.0/24' }, { id: 'agent', text: '10.12.0.50/32' }, { id: 'any', text: 'any' } ] },
          { id: 'dst', label: 'Destination', options: [ { id: 'nas', text: '10.12.9.10/32' }, { id: 'any', text: 'any' } ] }
        ] },
        answer: { slots: { action: 'd', src: 'sub', dst: 'nas' } } },
      { id: 's3', type: 'order', points: 1,
        prompt: 'Arrange the table so the agent is allowed but the rest of ops is denied.',
        explanation: 'Most specific first: the /32 agent allow, then the /24 ops→NAS deny, then the catch-all deny. If the /24 allow (or the deny) sits above the /32 allow, the agent is wrongly blocked; the keyed order puts the agent allow on top.',
        payload: { items: [
          { id: 'deny', label: 'Deny all — any → any · any' },
          { id: 'noOps', label: 'Deny ops→NAS — 10.12.0.0/24 → 10.12.9.10 · any' },
          { id: 'agentNas', label: 'Allow agent→NAS — 10.12.0.50/32 → 10.12.9.10 · 2049' }
        ] },
        answer: { correctOrder: ['agentNas', 'noOps', 'deny'] } },
      { id: 's4', type: 'analyze', points: 1,
        prompt: 'The deployed table below lets every ops host mount the NAS. Which rule never fires? Select all that apply.',
        explanation: 'A broad "allow 10.12.0.0/24 → NAS" was placed at the top, so all ops hosts are permitted before the ops→NAS deny is ever reached. The deny is shadowed and least-privilege is lost.',
        payload: { lines: [
          { id: 'l1', text: 'The ops→NAS deny is shadowed by the broad ops-subnet allow above it.' },
          { id: 'l2', text: 'Every ops host — not just the agent — can now mount the NAS.' },
          { id: 'l3', text: 'Removing the broad ops-subnet allow restores least privilege.' },
          { id: 'l4', text: 'NFS is stateless, so firewall order has no effect on it.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } }
    ]
  },

  // 10 — inter-VLAN routing on a L3 switch ACL: dev may reach shared, prod is
  // isolated from dev. Fault: broad allow shadows the dev->prod deny.
  {
    id: 'np-fw-10',
    cert: 'netplus', objective: '4.3', topic: 'Inter-VLAN ACL',
    title: 'Dev VLAN must not reach production',
    estMinutes: 5, archetype: 'firewall',
    scenario: 'A layer-3 switch routes between dev (10.40.10.0/24), prod (10.40.20.0/24), and a shared services host 10.40.99.10. Dev may reach shared services on HTTPS but must never reach production. The ticket: allow dev→shared, deny dev→prod, deny the rest. Build, order, catch the shadow.',
    assets: { reference: { kind: 'network',
      given: { site: 'Vertex Software — L3 switch ACL', engine: 'first match wins, implicit deny' },
      devices: [
        { id: 'dev', label: 'Dev VLAN', type: 'pc', zone: 'dev', ip: '10.40.10.0/24', x: 0, y: 1 },
        { id: 'sw', label: 'L3 switch', type: 'firewall', zone: 'edge', ip: 'top-down', x: 2, y: 1 },
        { id: 'shared', label: 'Shared svc', type: 'server', zone: 'shared', ip: '10.40.99.10 · 443', x: 4, y: 0 },
        { id: 'prod', label: 'Prod VLAN', type: 'server', zone: 'prod', ip: '10.40.20.0/24', x: 4, y: 2 }
      ],
      links: [ { from: 'dev', to: 'sw' }, { from: 'sw', to: 'shared' }, { from: 'sw', to: 'prod' } ]
    } },
    fwSpec: {
      rules: [
        { id: 'devShared', action: 'allow', proto: 'tcp', src: '10.40.10.0/24', dst: '10.40.99.10/32', port: 443 },
        { id: 'noProd', action: 'deny', proto: 'any', src: '10.40.10.0/24', dst: '10.40.20.0/24', port: 'any' },
        { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
      ],
      flows: [
        { name: 'dev to shared https', proto: 'tcp', src: '10.40.10.30', dst: '10.40.99.10', port: 443, expect: 'allow' },
        { name: 'dev to prod blocked', proto: 'tcp', src: '10.40.10.30', dst: '10.40.20.10', port: 443, expect: 'deny' },
        { name: 'dev to prod ssh blocked', proto: 'tcp', src: '10.40.10.30', dst: '10.40.20.10', port: 22, expect: 'deny' }
      ],
      shadowTable: {
        rules: [
          { id: 'devShared', action: 'allow', proto: 'tcp', src: '10.40.10.0/24', dst: '10.40.99.10/32', port: 443 },
          { id: 'devAny', action: 'allow', proto: 'any', src: '10.40.10.0/24', dst: 'any', port: 'any' },
          { id: 'noProd', action: 'deny', proto: 'any', src: '10.40.10.0/24', dst: '10.40.20.0/24', port: 'any' },
          { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
        ],
        shadowedRuleId: 'noProd'
      }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Build the dev→shared rule over HTTPS.',
        explanation: 'Allow the dev subnet 10.40.10.0/24 to the shared services host 10.40.99.10 on TCP 443.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'a', text: 'allow' }, { id: 'd', text: 'deny' } ] },
          { id: 'dst', label: 'Destination', options: [ { id: 'shared', text: '10.40.99.10/32' }, { id: 'prod', text: '10.40.20.0/24' }, { id: 'any', text: 'any' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'https', text: 'TCP 443' }, { id: 'ssh', text: 'TCP 22' } ] }
        ] },
        answer: { slots: { action: 'a', dst: 'shared', svc: 'https' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Build the isolation rule: dev must never reach production.',
        explanation: 'A deny from the dev subnet to the prod subnet 10.40.20.0/24, any service. It must sit above any broad dev allow.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'd', text: 'deny' }, { id: 'a', text: 'allow' } ] },
          { id: 'dst', label: 'Destination', options: [ { id: 'prod', text: '10.40.20.0/24' }, { id: 'shared', text: '10.40.99.10/32' }, { id: 'any', text: 'any' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'any', text: 'any' }, { id: 'https', text: 'TCP 443' } ] }
        ] },
        answer: { slots: { action: 'd', dst: 'prod', svc: 'any' } } },
      { id: 's3', type: 'order', points: 1,
        prompt: 'Arrange the ACL for first-match-wins.',
        explanation: 'dev→shared allow, then dev→prod deny, then the catch-all deny. The dev→prod deny must precede any blanket dev allow.',
        payload: { items: [
          { id: 'deny', label: 'Deny all — any → any · any' },
          { id: 'noProd', label: 'Deny dev→prod — 10.40.10.0/24 → 10.40.20.0/24 · any' },
          { id: 'devShared', label: 'Allow dev→shared — 10.40.10.0/24 → 10.40.99.10 · 443' }
        ] },
        answer: { correctOrder: ['devShared', 'noProd', 'deny'] } },
      { id: 's4', type: 'analyze', points: 1,
        prompt: 'The deployed ACL below lets dev reach production. Which rule never fires? Select all that apply.',
        explanation: 'A blanket "allow dev → any" was inserted above the dev→prod deny, so dev traffic to production matches the allow first and is permitted. The deny never fires — dev/prod isolation is broken.',
        payload: { lines: [
          { id: 'l1', text: 'The dev→prod deny is shadowed by the blanket dev→any allow above it.' },
          { id: 'l2', text: 'Dev can now reach production, breaking environment isolation.' },
          { id: 'l3', text: 'Removing the blanket dev→any allow (or moving the deny above it) fixes it.' },
          { id: 'l4', text: 'ACLs on a layer-3 switch are evaluated bottom-up, so this is fine.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } }
    ]
  },

  // 11 — remote-access VPN pool: allow VPN clients to two internal apps, deny
  // VPN to the domain controller. Fault: broad VPN allow shadows the DC deny.
  {
    id: 'np-fw-11',
    cert: 'netplus', objective: '4.3', topic: 'VPN access policy',
    title: 'Scope the VPN pool to two apps',
    estMinutes: 5, archetype: 'firewall',
    scenario: 'Remote workers land in the VPN pool 10.99.0.0/24. They may reach the intranet 10.60.10.10 on HTTPS and the ticketing app 10.60.10.20 on HTTPS, but must not reach the domain controller 10.60.9.5. The ticket: allow VPN→intranet, allow VPN→ticketing, deny VPN→DC, deny the rest. Build, order, catch the shadow.',
    assets: { reference: { kind: 'network',
      given: { site: 'Cascade Legal — VPN FW', engine: 'first match wins, implicit deny' },
      devices: [
        { id: 'vpn', label: 'VPN pool', type: 'pc', zone: 'vpn', ip: '10.99.0.0/24', x: 0, y: 1 },
        { id: 'fw', label: 'FW-VPN', type: 'firewall', zone: 'edge', ip: 'top-down', x: 2, y: 1 },
        { id: 'apps', label: 'Intranet+Ticketing', type: 'server', zone: 'apps', ip: '10.60.10.10/.20 · 443', x: 4, y: 0 },
        { id: 'dc', label: 'Domain ctlr', type: 'server', zone: 'core', ip: '10.60.9.5', x: 4, y: 2 }
      ],
      links: [ { from: 'vpn', to: 'fw' }, { from: 'fw', to: 'apps' }, { from: 'fw', to: 'dc' } ]
    } },
    fwSpec: {
      rules: [
        { id: 'intra', action: 'allow', proto: 'tcp', src: '10.99.0.0/24', dst: '10.60.10.10/32', port: 443 },
        { id: 'ticket', action: 'allow', proto: 'tcp', src: '10.99.0.0/24', dst: '10.60.10.20/32', port: 443 },
        { id: 'noDc', action: 'deny', proto: 'any', src: '10.99.0.0/24', dst: '10.60.9.5/32', port: 'any' },
        { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
      ],
      flows: [
        { name: 'vpn to intranet', proto: 'tcp', src: '10.99.0.30', dst: '10.60.10.10', port: 443, expect: 'allow' },
        { name: 'vpn to ticketing', proto: 'tcp', src: '10.99.0.30', dst: '10.60.10.20', port: 443, expect: 'allow' },
        { name: 'vpn to domain controller blocked', proto: 'tcp', src: '10.99.0.30', dst: '10.60.9.5', port: 389, expect: 'deny' }
      ],
      shadowTable: {
        rules: [
          { id: 'intra', action: 'allow', proto: 'tcp', src: '10.99.0.0/24', dst: '10.60.10.10/32', port: 443 },
          { id: 'ticket', action: 'allow', proto: 'tcp', src: '10.99.0.0/24', dst: '10.60.10.20/32', port: 443 },
          { id: 'vpnAny', action: 'allow', proto: 'any', src: '10.99.0.0/24', dst: 'any', port: 'any' },
          { id: 'noDc', action: 'deny', proto: 'any', src: '10.99.0.0/24', dst: '10.60.9.5/32', port: 'any' },
          { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
        ],
        shadowedRuleId: 'noDc'
      }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Build the VPN→intranet rule over HTTPS.',
        explanation: 'Allow the VPN pool 10.99.0.0/24 to the intranet host 10.60.10.10 on TCP 443.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'a', text: 'allow' }, { id: 'd', text: 'deny' } ] },
          { id: 'dst', label: 'Destination', options: [ { id: 'intra', text: '10.60.10.10/32' }, { id: 'dc', text: '10.60.9.5/32' }, { id: 'any', text: 'any' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'https', text: 'TCP 443' }, { id: 'ldap', text: 'TCP 389' } ] }
        ] },
        answer: { slots: { action: 'a', dst: 'intra', svc: 'https' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Build the isolation rule: the VPN pool must not reach the domain controller.',
        explanation: 'A deny from the VPN pool to the DC host 10.60.9.5/32, any service. It must sit above any broad VPN allow.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'd', text: 'deny' }, { id: 'a', text: 'allow' } ] },
          { id: 'dst', label: 'Destination', options: [ { id: 'dc', text: '10.60.9.5/32' }, { id: 'intra', text: '10.60.10.10/32' }, { id: 'any', text: 'any' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'any', text: 'any' }, { id: 'https', text: 'TCP 443' } ] }
        ] },
        answer: { slots: { action: 'd', dst: 'dc', svc: 'any' } } },
      { id: 's3', type: 'order', points: 1,
        prompt: 'Arrange the table for first-match-wins.',
        explanation: 'The two app allows, then the VPN→DC deny, then the catch-all deny. The DC deny must precede any blanket VPN allow.',
        payload: { items: [
          { id: 'deny', label: 'Deny all — any → any · any' },
          { id: 'noDc', label: 'Deny VPN→DC — 10.99.0.0/24 → 10.60.9.5 · any' },
          { id: 'ticket', label: 'Allow VPN→ticketing — 10.99.0.0/24 → 10.60.10.20 · 443' },
          { id: 'intra', label: 'Allow VPN→intranet — 10.99.0.0/24 → 10.60.10.10 · 443' }
        ] },
        answer: { correctOrder: ['intra', 'ticket', 'noDc', 'deny'] } },
      { id: 's4', type: 'analyze', points: 1,
        prompt: 'The deployed table below lets VPN clients hit the domain controller. Which rule never fires? Select all that apply.',
        explanation: 'A blanket "allow VPN → any" was inserted above the VPN→DC deny, so VPN traffic to the domain controller matches the allow first and is permitted. The deny never fires — the DC is exposed to every remote client.',
        payload: { lines: [
          { id: 'l1', text: 'The VPN→DC deny is shadowed by the blanket VPN→any allow above it.' },
          { id: 'l2', text: 'VPN clients can now reach the domain controller, widening exposure.' },
          { id: 'l3', text: 'Removing the blanket VPN→any allow (or moving the deny above it) fixes it.' },
          { id: 'l4', text: 'The two app allows caused the leak, so they should be deleted.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } }
    ]
  },

  // 12 — five-rule scenario: IoT segment. NTP + MQTT to the broker allowed,
  // firmware host allowed, IoT->LAN denied, deny rest. Fault: broad IoT allow
  // shadows the IoT->LAN deny.
  {
    id: 'np-fw-12',
    cert: 'netplus', objective: '1.4', topic: 'IoT segment ports',
    title: 'Fence the IoT sensors to their broker',
    estMinutes: 6, archetype: 'firewall',
    scenario: 'IoT sensors on 10.70.30.0/24 need NTP time (UDP 123) and MQTT (TCP 1883) to the broker 10.70.40.10, plus HTTPS to the firmware host 10.70.40.20, but must never reach the corporate LAN 10.70.10.0/24. The ticket has five lines. Build the rules, order them, and catch the shadow the field tech left behind.',
    assets: { reference: { kind: 'network',
      given: { site: 'Terra Utilities — IoT FW', engine: 'first match wins, implicit deny' },
      devices: [
        { id: 'iot', label: 'IoT sensors', type: 'pc', zone: 'iot', ip: '10.70.30.0/24', x: 0, y: 1 },
        { id: 'fw', label: 'FW-IoT', type: 'firewall', zone: 'edge', ip: 'top-down', x: 2, y: 1 },
        { id: 'broker', label: 'MQTT broker', type: 'server', zone: 'iot-core', ip: '10.70.40.10 · 1883/123', x: 4, y: 0 },
        { id: 'fwh', label: 'Firmware host', type: 'server', zone: 'iot-core', ip: '10.70.40.20 · 443', x: 4, y: 1 },
        { id: 'lan', label: 'Corp LAN', type: 'server', zone: 'internal', ip: '10.70.10.0/24', x: 4, y: 2 }
      ],
      links: [ { from: 'iot', to: 'fw' }, { from: 'fw', to: 'broker' }, { from: 'fw', to: 'fwh' }, { from: 'fw', to: 'lan' } ]
    } },
    fwSpec: {
      rules: [
        { id: 'ntp', action: 'allow', proto: 'udp', src: '10.70.30.0/24', dst: '10.70.40.10/32', port: 123 },
        { id: 'mqtt', action: 'allow', proto: 'tcp', src: '10.70.30.0/24', dst: '10.70.40.10/32', port: 1883 },
        { id: 'fw', action: 'allow', proto: 'tcp', src: '10.70.30.0/24', dst: '10.70.40.20/32', port: 443 },
        { id: 'noLan', action: 'deny', proto: 'any', src: '10.70.30.0/24', dst: '10.70.10.0/24', port: 'any' },
        { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
      ],
      flows: [
        { name: 'sensor ntp', proto: 'udp', src: '10.70.30.40', dst: '10.70.40.10', port: 123, expect: 'allow' },
        { name: 'sensor mqtt', proto: 'tcp', src: '10.70.30.40', dst: '10.70.40.10', port: 1883, expect: 'allow' },
        { name: 'sensor firmware https', proto: 'tcp', src: '10.70.30.40', dst: '10.70.40.20', port: 443, expect: 'allow' },
        { name: 'sensor to corp lan blocked', proto: 'tcp', src: '10.70.30.40', dst: '10.70.10.10', port: 445, expect: 'deny' }
      ],
      shadowTable: {
        rules: [
          { id: 'ntp', action: 'allow', proto: 'udp', src: '10.70.30.0/24', dst: '10.70.40.10/32', port: 123 },
          { id: 'mqtt', action: 'allow', proto: 'tcp', src: '10.70.30.0/24', dst: '10.70.40.10/32', port: 1883 },
          { id: 'iotAny', action: 'allow', proto: 'any', src: '10.70.30.0/24', dst: 'any', port: 'any' },
          { id: 'noLan', action: 'deny', proto: 'any', src: '10.70.30.0/24', dst: '10.70.10.0/24', port: 'any' },
          { id: 'deny', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }
        ],
        shadowedRuleId: 'noLan'
      }
    },
    steps: [
      { id: 's1', type: 'configure', points: 1,
        prompt: 'Build the MQTT rule from the sensors to the broker.',
        explanation: 'MQTT is TCP 1883 from the IoT subnet to the broker host 10.70.40.10. NTP (UDP 123) and firmware HTTPS get their own rules.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'a', text: 'allow' }, { id: 'd', text: 'deny' } ] },
          { id: 'dst', label: 'Destination', options: [ { id: 'broker', text: '10.70.40.10/32' }, { id: 'lan', text: '10.70.10.0/24' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'mqtt', text: 'TCP 1883' }, { id: 'https', text: 'TCP 443' }, { id: 'ntp', text: 'UDP 123' } ] }
        ] },
        answer: { slots: { action: 'a', dst: 'broker', svc: 'mqtt' } } },
      { id: 's2', type: 'configure', points: 1,
        prompt: 'Build the isolation rule: IoT sensors must not reach the corporate LAN.',
        explanation: 'A deny from the IoT subnet to the corporate LAN 10.70.10.0/24, any service. It must sit above any broad IoT allow.',
        payload: { slots: [
          { id: 'action', label: 'Action', options: [ { id: 'd', text: 'deny' }, { id: 'a', text: 'allow' } ] },
          { id: 'dst', label: 'Destination', options: [ { id: 'lan', text: '10.70.10.0/24' }, { id: 'broker', text: '10.70.40.10/32' }, { id: 'any', text: 'any' } ] },
          { id: 'svc', label: 'Service', options: [ { id: 'any', text: 'any' }, { id: 'mqtt', text: 'TCP 1883' } ] }
        ] },
        answer: { slots: { action: 'd', dst: 'lan', svc: 'any' } } },
      { id: 's3', type: 'order', points: 1,
        prompt: 'Arrange the five-rule table for first-match-wins.',
        explanation: 'The three specific allows (NTP, MQTT, firmware), then the IoT→LAN deny, then the catch-all deny. The LAN deny must precede any blanket IoT allow.',
        payload: { items: [
          { id: 'deny', label: 'Deny all — any → any · any' },
          { id: 'noLan', label: 'Deny IoT→LAN — 10.70.30.0/24 → 10.70.10.0/24 · any' },
          { id: 'fw', label: 'Allow firmware HTTPS — 10.70.30.0/24 → 10.70.40.20 · 443' },
          { id: 'mqtt', label: 'Allow MQTT — 10.70.30.0/24 → 10.70.40.10 · 1883' },
          { id: 'ntp', label: 'Allow NTP — 10.70.30.0/24 → 10.70.40.10 · 123/udp' }
        ] },
        answer: { correctOrder: ['ntp', 'mqtt', 'fw', 'noLan', 'deny'] } },
      { id: 's4', type: 'analyze', points: 1,
        prompt: 'The deployed table below lets sensors reach the corporate LAN. Which rule never fires? Select all that apply.',
        explanation: 'A blanket "allow IoT → any" was inserted above the IoT→LAN deny, so sensor traffic to the corporate LAN matches the allow first and is permitted. The deny never fires — IoT segmentation is broken and the sensors can pivot into the LAN.',
        payload: { lines: [
          { id: 'l1', text: 'The IoT→LAN deny is shadowed by the blanket IoT→any allow above it.' },
          { id: 'l2', text: 'Sensors can now reach the corporate LAN, breaking segmentation.' },
          { id: 'l3', text: 'Removing the blanket IoT→any allow (or moving the deny above it) fixes it.' },
          { id: 'l4', text: 'MQTT and NTP allows are the cause, so they should be deleted.' }
        ] },
        answer: { selected: ['l1', 'l2', 'l3'] } }
    ]
  }

];

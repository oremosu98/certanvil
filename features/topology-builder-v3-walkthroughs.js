// ════════════════════════════════════════════════════════════════════
// TB v3 Walkthroughs — pilot content for Phase 8
// Each entry: { id, scenarioId, title, brief, durationMin, domainTags?, steps[] }
// Step shapes:
//   { id, type: 'narrate',   title, body }
//   { id, type: 'highlight', title, body, target, cameraIn3D? }
//   { id, type: 'flow',      title, body, flow }
// See: docs/superpowers/specs/2026-05-25-tb-v3-walkthrough-design.md §2
// ════════════════════════════════════════════════════════════════════

var TB_V3_WALKTHROUGHS = [
  {
    id: 'home-network-comms',
    scenarioId: 'home-network',
    title: 'How devices communicate',
    brief: 'Follow a packet from your laptop to the internet and back through the home router.',
    durationMin: 5,
    // domainTags omitted -> inherits Networking Concepts from scenario.objectiveRefs ['1.6']
    steps: [
      {
        id: 's1',
        type: 'narrate',
        title: 'Your devices form a local network',
        body: 'Every device on the canvas shares one private subnet (192.168.0.0/24). The router stitches that subnet to the outside world. Watch how one packet moves across it.',
      },
      {
        id: 's2',
        type: 'highlight',
        title: 'Meet the router',
        body: 'The router is the traffic director for the whole house. It hands out IP addresses through DHCP and rewrites private addresses to your one public address using NAT.',
        target: { kind: 'device', id: 'sc_hn_rtr' },
      },
      {
        id: 's3',
        type: 'highlight',
        title: 'Meet the ISP link',
        body: 'The cloud node represents your ISP, where every outbound packet exits. The fiber drop from the ISP is the only path off your local subnet.',
        target: { kind: 'device', id: 'sc_hn_isp' },
      },
      {
        id: 's4',
        type: 'flow',
        title: 'A packet to the internet',
        body: 'The laptop sends a request for a website. It travels through the Wi-Fi access point, hops to the router, and the router NATs it onto the ISP link.',
        flow: {
          from: 'sc_hn_lap',
          to: 'sc_hn_isp',
          via: ['sc_hn_ap', 'sc_hn_rtr'],
        },
      },
      {
        id: 's5',
        type: 'flow',
        title: 'The reply comes back',
        body: 'The website responds. The router reverses the NAT translation, looks up the laptop on the local subnet, and forwards the reply back over Wi-Fi.',
        flow: {
          from: 'sc_hn_isp',
          to: 'sc_hn_lap',
          via: ['sc_hn_rtr', 'sc_hn_ap'],
        },
      },
      {
        id: 's6',
        type: 'narrate',
        title: 'That is the whole shape',
        body: 'Every phone, console, and smart TV on this canvas uses the same path: client to access point to router to ISP. One flat subnet, one gateway, one public address.',
      },
    ],
  },
  {
    id: 'home-network-attacks',
    scenarioId: 'home-network',
    title: 'Common attack vectors',
    brief: 'See where outside attackers reach the home, and where local attackers pivot once they are on the Wi-Fi.',
    durationMin: 7,
    domainTags: ['Network Security'],
    steps: [
      {
        id: 's1',
        type: 'narrate',
        title: 'Same threats, smaller scale',
        body: 'A home network faces the same attack classes as an enterprise: port scans, credential stuffing, ARP spoofing, rogue access points. The shapes scale up; the names stay the same.',
      },
      {
        id: 's2',
        type: 'highlight',
        title: 'The ISP edge is the front door',
        body: 'Every internet-borne probe lands on the cloud link. Botnets sweep the public IPv4 range and knock on whatever public port your modem exposes.',
        target: { kind: 'device', id: 'sc_hn_isp' },
      },
      {
        id: 's3',
        type: 'highlight',
        title: 'The router is the firewall',
        body: 'The home router runs NAT, which drops unsolicited inbound packets by default. That single rule blocks most opportunistic scans before they reach any device on the subnet.',
        target: { kind: 'device', id: 'sc_hn_rtr' },
      },
      {
        id: 's4',
        type: 'flow',
        title: 'ARP spoofing on the LAN',
        body: 'Once an attacker joins the Wi-Fi, they broadcast forged ARP replies claiming to be the router. The laptop now sends gateway traffic to the attacker, who relays it and reads everything in the clear.',
        flow: {
          from: 'sc_hn_lap',
          to: 'sc_hn_rtr',
          direction: 'forward-back',
        },
      },
      {
        id: 's5',
        type: 'narrate',
        title: 'Defense in layers',
        body: 'WPA3 stops the attacker from joining the Wi-Fi in the first place. Firmware updates patch the router itself. A guest network isolates untrusted devices from the laptop and console.',
      },
      {
        id: 's6',
        type: 'narrate',
        title: 'Same shapes on the exam',
        body: 'The objective list calls out NAT, firewalls, WPA3, and ARP poisoning. This six-device canvas is where you can see them; the enterprise diagrams on the exam are the same pattern with more nodes.',
      },
    ],
  },
];

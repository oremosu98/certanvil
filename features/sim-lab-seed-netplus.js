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
  }
];

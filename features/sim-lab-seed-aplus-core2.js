/* DRAFT A+ Core 2 (220-1202) PBQ seed scenarios — answers NOT yet founder-verified. Review before ship. */
// NOTE TO FOUNDER (exam-code alignment): this file targets 220-1202 v4.0 to match
// the shipped cert pack (certs/aplus-core2.js) — 10-step malware removal (obj 2.6),
// domain weights 28/28/23/21, adds 4.10 AI Basics. Objective tags follow the
// SHIPPED 220-1202 pack so they line up with topicResources.
window.SIM_LAB_SEED_APLUS_CORE2 = [
  // ========================================================================
  // ===== Domain 1 — Operating Systems (~14) ===============================
  // ========================================================================
  {
    id: 'a2-seed-filesystems-1', cert: 'aplus-core2', objective: '1.1', topic: 'OS Types & Filesystems',
    title: 'Match the file system to its use', estMinutes: 4,
    scenario: 'Match each file system to the platform or use case it is best suited for.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each file system with its best-fit use.',
        explanation: 'NTFS is the default modern Windows file system (journaling, permissions, encryption). FAT32 is the legacy cross-compatible format with a 4 GB per-file limit. exFAT is designed for large external/flash media without the 4 GB limit. ext4 is a common Linux file system. APFS is the modern macOS file system.',
        payload: {
          left: [
            { id: 'ntfs', label: 'NTFS' },
            { id: 'fat32', label: 'FAT32' },
            { id: 'exfat', label: 'exFAT' },
            { id: 'ext4', label: 'ext4' },
            { id: 'apfs', label: 'APFS' }
          ],
          right: [
            { id: 'dwin', label: 'Default modern Windows volume (permissions, journaling)' },
            { id: 'dlegacy', label: 'Legacy cross-compatible format, 4 GB per-file limit' },
            { id: 'dflash', label: 'Large external/flash media without the 4 GB limit' },
            { id: 'dlinux', label: 'Common modern Linux file system' },
            { id: 'dmac', label: 'Modern macOS file system' }
          ]
        },
        answer: { pairs: { ntfs: 'dwin', fat32: 'dlegacy', exfat: 'dflash', ext4: 'dlinux', apfs: 'dmac' } } }
    ]
  },

  {
    id: 'a2-seed-filesystems-2', cert: 'aplus-core2', objective: '1.1', topic: 'OS Types & Filesystems',
    title: 'Categorize the file system by platform', estMinutes: 3,
    scenario: 'Sort each file system by the operating-system family it natively belongs to.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each file system under Windows, Linux, macOS, or Cross-platform.',
        explanation: 'NTFS is Windows-native. ext4 is Linux-native. APFS is macOS-native. exFAT is widely cross-platform for removable media (read/write on Windows, macOS, and Linux). FAT32 is also cross-platform but is grouped here as cross-platform alongside exFAT.',
        payload: {
          items: [
            { id: 'ntfs', label: 'NTFS' },
            { id: 'ext4', label: 'ext4' },
            { id: 'apfs', label: 'APFS' },
            { id: 'exfat', label: 'exFAT' },
            { id: 'fat32', label: 'FAT32' }
          ],
          buckets: [
            { id: 'win', label: 'Windows' },
            { id: 'linux', label: 'Linux' },
            { id: 'mac', label: 'macOS' },
            { id: 'cross', label: 'Cross-platform removable media' }
          ]
        },
        answer: { map: { ntfs: 'win', ext4: 'linux', apfs: 'mac', exfat: 'cross', fat32: 'cross' } } }
    ]
  },

  {
    id: 'a2-seed-editions-1', cert: 'aplus-core2', objective: '1.3', topic: 'Windows Editions Features',
    title: 'Match the Windows feature to its lowest edition', estMinutes: 4,
    scenario: 'Match each Windows capability to the lowest edition that supports it.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each feature with the lowest edition that includes it.',
        explanation: 'Windows Home supports basic consumer use. BitLocker, Group Policy Editor (gpedit.msc), and Remote Desktop HOST all require Pro (Home lacks them). Extended RAM/CPU-socket support and persistent memory require Pro for Workstations. AppLocker is an Enterprise feature. Domain join also requires Pro — it maps to the same tier as BitLocker/gpedit.',
        payload: {
          left: [
            { id: 'basic', label: 'Basic consumer desktop' },
            { id: 'bitlocker', label: 'BitLocker drive encryption' },
            { id: 'rdphost', label: 'Remote Desktop host role' },
            { id: 'highram', label: 'Extended RAM / CPU-socket support (workstation-class hardware)' },
            { id: 'applocker', label: 'AppLocker' }
          ],
          right: [
            { id: 'dhome', label: 'Home' },
            { id: 'dpro', label: 'Pro (minimum)' },
            { id: 'dprows', label: 'Pro for Workstations' },
            { id: 'dent', label: 'Enterprise' }
          ]
        },
        // Reviewed: ReFS is a Windows Server feature, not a general client-edition feature — removed. dpro/dpro2 duplicate-target leak fixed by collapsing to one Pro target with distinct left items. BitLocker and RDP host both map to Pro (many:1 is valid for match).
        answer: { pairs: { basic: 'dhome', bitlocker: 'dpro', rdphost: 'dpro', highram: 'dprows', applocker: 'dent' } } }
    ]
  },

  {
    id: 'a2-seed-editions-2', cert: 'aplus-core2', objective: '1.3', topic: 'Windows Editions Features',
    title: 'Categorize Home vs Pro features', estMinutes: 3,
    scenario: 'A user has Windows Home and asks which features they already have versus which require an upgrade to Pro. Sort each feature.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each feature under Available in Home or Requires Pro.',
        explanation: 'Windows Home includes the Microsoft Store, Windows Hello, and Windows Update. BitLocker, the Group Policy Editor (gpedit.msc), the Remote Desktop host role, and domain join are all excluded from Home and require Pro.',
        payload: {
          items: [
            { id: 'store', label: 'Microsoft Store' },
            { id: 'hello', label: 'Windows Hello sign-in' },
            { id: 'bitlocker', label: 'BitLocker' },
            { id: 'gpedit', label: 'Group Policy Editor (gpedit.msc)' },
            { id: 'rdphost', label: 'Remote Desktop host' },
            { id: 'domain', label: 'Domain join' }
          ],
          buckets: [
            { id: 'home', label: 'Available in Home' },
            { id: 'pro', label: 'Requires Pro' }
          ]
        },
        answer: { map: { store: 'home', hello: 'home', bitlocker: 'pro', gpedit: 'pro', rdphost: 'pro', domain: 'pro' } } }
    ]
  },

  {
    id: 'a2-seed-tools-1', cert: 'aplus-core2', objective: '1.4', topic: 'Windows Tools & MMC Snap-ins',
    title: 'Match the MMC snap-in to its filename', estMinutes: 4,
    scenario: 'Match each Windows management tool to the .msc filename you type in the Run box to open it.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each tool with its Run-box filename.',
        explanation: 'Disk Management = diskmgmt.msc. Device Manager = devmgmt.msc. Event Viewer = eventvwr.msc. Services = services.msc. Task Scheduler = taskschd.msc. These .msc snap-in names are directly testable.',
        payload: {
          left: [
            { id: 'disk', label: 'Disk Management' },
            { id: 'device', label: 'Device Manager' },
            { id: 'event', label: 'Event Viewer' },
            { id: 'services', label: 'Services' },
            { id: 'task', label: 'Task Scheduler' }
          ],
          right: [
            { id: 'fdisk', label: 'diskmgmt.msc' },
            { id: 'fdev', label: 'devmgmt.msc' },
            { id: 'fevent', label: 'eventvwr.msc' },
            { id: 'fsvc', label: 'services.msc' },
            { id: 'ftask', label: 'taskschd.msc' }
          ]
        },
        answer: { pairs: { disk: 'fdisk', device: 'fdev', event: 'fevent', services: 'fsvc', task: 'ftask' } } }
    ]
  },

  {
    id: 'a2-seed-tools-2', cert: 'aplus-core2', objective: '1.4', topic: 'Windows Tools & MMC Snap-ins',
    title: 'Open Disk Management fastest', estMinutes: 3,
    scenario: 'A technician wants the fastest way to open Disk Management from the Run dialog. Answer both fields.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'What do you type in the Run box (Win+R) to open Disk Management directly?',
        explanation: 'diskmgmt.msc launches the Disk Management snap-in directly from the Run dialog.',
        payload: { fields: [{ id: 'cmd', label: 'Run command', inputmode: 'text' }] },
        answer: { cmd: ['diskmgmt.msc', 'diskmgmt'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'What three-letter file extension do these console snap-ins use?',
        explanation: 'Microsoft Management Console snap-ins use the .msc extension (e.g., diskmgmt.msc, services.msc).',
        payload: { fields: [{ id: 'ext', label: 'Extension', inputmode: 'text' }] },
        answer: { ext: ['.msc', 'msc'] } }
    ]
  },

  {
    id: 'a2-seed-cmdline-1', cert: 'aplus-core2', objective: '1.5', topic: 'Windows Command-Line Tools',
    title: 'Categorize the Windows command by purpose', estMinutes: 4,
    scenario: 'Sort each Windows command-line tool by its primary purpose.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each command under Networking, Disk/File integrity, or Group Policy.',
        explanation: 'ipconfig and ping report and test network configuration (networking). chkdsk repairs disk errors and sfc /scannow verifies system files (disk/file integrity). gpupdate refreshes and gpresult reports applied Group Policy (group policy).',
        payload: {
          items: [
            { id: 'ipconfig', label: 'ipconfig' },
            { id: 'ping', label: 'ping' },
            { id: 'chkdsk', label: 'chkdsk' },
            { id: 'sfc', label: 'sfc /scannow' },
            { id: 'gpupdate', label: 'gpupdate' },
            { id: 'gpresult', label: 'gpresult' }
          ],
          buckets: [
            { id: 'net', label: 'Networking' },
            { id: 'disk', label: 'Disk / File integrity' },
            { id: 'gp', label: 'Group Policy' }
          ]
        },
        answer: { map: { ipconfig: 'net', ping: 'net', chkdsk: 'disk', sfc: 'disk', gpupdate: 'gp', gpresult: 'gp' } } }
    ]
  },

  {
    id: 'a2-seed-cmdline-2', cert: 'aplus-core2', objective: '1.5', topic: 'Windows Command-Line Tools',
    title: 'Match the Windows command to what it does', estMinutes: 4,
    scenario: 'Match each Windows command-line tool to its function.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each command with its function.',
        explanation: 'netstat shows active network connections and listening ports. nslookup queries DNS. sfc /scannow checks and repairs protected system files. chkdsk scans a disk for file-system errors. ipconfig displays the IP configuration.',
        payload: {
          left: [
            { id: 'netstat', label: 'netstat' },
            { id: 'nslookup', label: 'nslookup' },
            { id: 'sfc', label: 'sfc /scannow' },
            { id: 'chkdsk', label: 'chkdsk' },
            { id: 'ipconfig', label: 'ipconfig' }
          ],
          right: [
            { id: 'dconn', label: 'Shows active connections and listening ports' },
            { id: 'ddns', label: 'Queries DNS name resolution' },
            { id: 'dsysfile', label: 'Checks and repairs protected system files' },
            { id: 'ddisk', label: 'Scans a disk for file-system errors' },
            { id: 'dipconf', label: 'Displays the IP configuration' }
          ]
        },
        answer: { pairs: { netstat: 'dconn', nslookup: 'ddns', sfc: 'dsysfile', chkdsk: 'ddisk', ipconfig: 'dipconf' } } }
    ]
  },

  {
    id: 'a2-seed-linux-1', cert: 'aplus-core2', objective: '1.9', topic: 'Linux Features & Commands',
    title: 'Match the Linux command to its function', estMinutes: 4,
    scenario: 'Match each Linux shell command to what it does.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each command with its function.',
        explanation: 'ls lists directory contents. grep searches text for a pattern. chmod changes file permissions. sudo runs a command with elevated (root) privileges. apt installs and manages packages on Debian/Ubuntu.',
        payload: {
          left: [
            { id: 'ls', label: 'ls' },
            { id: 'grep', label: 'grep' },
            { id: 'chmod', label: 'chmod' },
            { id: 'sudo', label: 'sudo' },
            { id: 'apt', label: 'apt' }
          ],
          right: [
            { id: 'dlist', label: 'Lists directory contents' },
            { id: 'dsearch', label: 'Searches text for a pattern' },
            { id: 'dperm', label: 'Changes file permissions' },
            { id: 'droot', label: 'Runs a command with elevated privileges' },
            { id: 'dpkg', label: 'Installs and manages packages' }
          ]
        },
        answer: { pairs: { ls: 'dlist', grep: 'dsearch', chmod: 'dperm', sudo: 'droot', apt: 'dpkg' } } }
    ]
  },

  {
    id: 'a2-seed-crossos-1', cert: 'aplus-core2', objective: '1.9', topic: 'Linux Features & Commands',
    title: 'Categorize the command by OS', estMinutes: 4,
    scenario: 'Sort each command/tool by the OS family it belongs to. (ping is universal and is omitted.)',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each item under Windows, Linux, or macOS.',
        explanation: 'sfc and chkdsk are Windows commands. chmod and grep are Linux commands. Time Machine and FileVault are macOS tools.',
        payload: {
          items: [
            { id: 'sfc', label: 'sfc /scannow' },
            { id: 'chkdsk', label: 'chkdsk' },
            { id: 'chmod', label: 'chmod' },
            { id: 'grep', label: 'grep' },
            { id: 'timemachine', label: 'Time Machine' },
            { id: 'filevault', label: 'FileVault' }
          ],
          buckets: [
            { id: 'win', label: 'Windows' },
            { id: 'linux', label: 'Linux' },
            { id: 'mac', label: 'macOS' }
          ]
        },
        answer: { map: { sfc: 'win', chkdsk: 'win', chmod: 'linux', grep: 'linux', timemachine: 'mac', filevault: 'mac' } } }
    ]
  },

  {
    id: 'a2-seed-macos-1', cert: 'aplus-core2', objective: '1.8', topic: 'macOS Features & Tools',
    title: 'Match the macOS tool to its function', estMinutes: 4,
    scenario: 'Match each macOS feature to what it does.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each macOS tool with its function.',
        explanation: 'Time Machine performs automated backups. FileVault provides full-disk encryption. Keychain stores credentials and certificates. Spotlight is the system-wide search. Disk Utility manages and repairs disks and volumes.',
        payload: {
          left: [
            { id: 'tm', label: 'Time Machine' },
            { id: 'fv', label: 'FileVault' },
            { id: 'kc', label: 'Keychain' },
            { id: 'sl', label: 'Spotlight' },
            { id: 'du', label: 'Disk Utility' }
          ],
          right: [
            { id: 'dbackup', label: 'Automated backups' },
            { id: 'dencrypt', label: 'Full-disk encryption' },
            { id: 'dcreds', label: 'Stores credentials and certificates' },
            { id: 'dsearch', label: 'System-wide search' },
            { id: 'ddisk', label: 'Manages and repairs disks and volumes' }
          ]
        },
        answer: { pairs: { tm: 'dbackup', fv: 'dencrypt', kc: 'dcreds', sl: 'dsearch', du: 'ddisk' } } }
    ]
  },

  {
    id: 'a2-seed-appinstall-1', cert: 'aplus-core2', objective: '1.10', topic: 'Application Installation Requirements',
    title: 'Determine 32-bit vs 64-bit support', estMinutes: 3,
    scenario: 'A user must install an application. Answer two conceptual questions about install requirements.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'Can a 64-bit version of an application run on a 32-bit edition of Windows? (yes or no)',
        explanation: 'No. A 64-bit application requires a 64-bit operating system. A 32-bit OS can run only 32-bit applications. (A 64-bit OS can run both 32-bit and 64-bit apps.)',
        payload: { fields: [{ id: 'ans', label: 'yes / no', inputmode: 'text' }] },
        answer: { ans: ['no', 'No'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'What system resource — specifically the chip that temporarily holds data while programs run — must meet the minimum requirement listed on the app\'s box? (one word)',
        explanation: 'RAM (system memory) is the resource that temporarily holds running program data and is the most commonly checked minimum requirement alongside OS architecture.',
        payload: { fields: [{ id: 'res', label: 'One word', inputmode: 'text' }] },
        answer: { res: ['RAM', 'ram', 'memory'] } }
    ]
  },

  {
    id: 'a2-seed-cloud-1', cert: 'aplus-core2', objective: '1.2', topic: 'OS Installations & Upgrades',
    title: 'Order the Windows clean-install steps', estMinutes: 4,
    scenario: 'You are performing a clean installation of Windows from bootable media. Put the steps in order, first step at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the clean-install steps in order.',
        explanation: 'Create/boot the installation media, set the firmware boot order to boot from it, choose a Custom (clean) install, partition and format the target drive, install/copy the Windows files, then complete the out-of-box setup (region, account, updates).',
        payload: { items: [
          { id: 'partition', label: 'Partition and format the target drive' },
          { id: 'boot', label: 'Set firmware boot order to the install media' },
          { id: 'oobe', label: 'Complete out-of-box setup (account, updates)' },
          { id: 'media', label: 'Create and boot the installation media' },
          { id: 'custom', label: 'Choose Custom (clean) install' },
          { id: 'install', label: 'Install/copy Windows files' }
        ] },
        answer: { correctOrder: ['media', 'boot', 'custom', 'partition', 'install', 'oobe'] } }
    ]
  },

  {
    id: 'a2-seed-settings-1', cert: 'aplus-core2', objective: '1.6', topic: 'Windows Settings & Control Panel',
    title: 'Match the Control Panel applet to its job', estMinutes: 4,
    scenario: 'Match each Windows Control Panel applet to what it configures.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each applet with what it configures.',
        explanation: 'Device Manager manages hardware and drivers. Programs and Features installs/uninstalls applications. Network and Sharing Center configures network connections. Power Options sets sleep/power plans. User Accounts manages local accounts and UAC.',
        payload: {
          left: [
            { id: 'devmgr', label: 'Device Manager' },
            { id: 'progfeat', label: 'Programs and Features' },
            { id: 'netshare', label: 'Network and Sharing Center' },
            { id: 'power', label: 'Power Options' },
            { id: 'useracct', label: 'User Accounts' }
          ],
          right: [
            { id: 'dhw', label: 'Manages hardware and drivers' },
            { id: 'dapps', label: 'Installs and uninstalls applications' },
            { id: 'dnet', label: 'Configures network connections' },
            { id: 'dpower', label: 'Sets sleep and power plans' },
            { id: 'dacct', label: 'Manages local accounts and UAC' }
          ]
        },
        answer: { pairs: { devmgr: 'dhw', progfeat: 'dapps', netshare: 'dnet', power: 'dpower', useracct: 'dacct' } } }
    ]
  },

  // ========================================================================
  // ===== Domain 2 — Security (~14) ========================================
  // ========================================================================
  {
    id: 'a2-seed-malwareremoval-1', cert: 'aplus-core2', objective: '2.6', topic: 'SOHO Malware Removal Procedure',
    title: 'Order the CompTIA malware-removal procedure', estMinutes: 5,
    scenario: 'A workstation is infected. Put the CompTIA best-practice malware-removal steps in the official order, first step at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the malware-removal steps in the correct order.',
        explanation: 'CompTIA best-practice malware removal (7 steps): 1) investigate and verify symptoms; 2) quarantine the infected system; 3) disable System Restore in Windows; 4) remediate — update the anti-malware definitions, then scan and use removal techniques (reimage/reinstall is a fallback within remediation if cleaning fails); 5) schedule scans and run updates; 6) re-enable System Restore and create a restore point; 7) educate the end user.',
        payload: { items: [
          { id: 'm1', label: 'Investigate and verify malware symptoms' },
          { id: 'm2', label: 'Quarantine the infected system' },
          { id: 'm3', label: 'Disable System Restore (Windows)' },
          { id: 'm4', label: 'Remediate: update anti-malware definitions, then scan and remove' },
          { id: 'm5', label: 'Schedule scans and run updates' },
          { id: 'm6', label: 'Enable System Restore and create a restore point' },
          { id: 'm7', label: 'Educate the end user' }
        ] },
        // Reviewed: canonical CompTIA 7-step (exam-tested order; reimage is a sub-step of remediate, not a separate step).
        answer: { correctOrder: ['m1','m2','m3','m4','m5','m6','m7'] } }
    ]
  },

  {
    id: 'a2-seed-malware-1', cert: 'aplus-core2', objective: '2.4', topic: 'Malware Types & Tools',
    title: 'Match the malware type', estMinutes: 4,
    scenario: 'Match each malware type to its defining behavior.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each malware type with its behavior.',
        explanation: 'Ransomware encrypts files and demands payment. A Trojan hides inside a seemingly legitimate program. A rootkit conceals itself and grants privileged access. A keylogger records keystrokes to steal credentials. A worm self-replicates across a network without user action.',
        payload: {
          left: [
            { id: 'ransom', label: 'Ransomware' },
            { id: 'trojan', label: 'Trojan' },
            { id: 'rootkit', label: 'Rootkit' },
            { id: 'keylog', label: 'Keylogger' },
            { id: 'worm', label: 'Worm' }
          ],
          right: [
            { id: 'dencrypt', label: 'Encrypts files and demands payment' },
            { id: 'dhide', label: 'Hides inside a seemingly legitimate program' },
            { id: 'dconceal', label: 'Conceals itself and grants privileged access' },
            { id: 'dkeys', label: 'Records keystrokes to steal credentials' },
            { id: 'dspread', label: 'Self-replicates across a network without user action' }
          ]
        },
        answer: { pairs: { ransom: 'dencrypt', trojan: 'dhide', rootkit: 'dconceal', keylog: 'dkeys', worm: 'dspread' } } }
    ]
  },

  {
    id: 'a2-seed-socialeng-1', cert: 'aplus-core2', objective: '2.5', topic: 'Social Engineering Attacks',
    title: 'Match the social-engineering attack', estMinutes: 4,
    scenario: 'Match each social-engineering technique to its description.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each attack with its description.',
        explanation: 'Phishing is mass fraudulent email. Whaling is phishing aimed at a high-value executive. Vishing uses voice/phone calls. Tailgating is following an authorized person through a secure door without their knowledge. Shoulder surfing is observing a screen or keypad over someone’s shoulder.',
        payload: {
          left: [
            { id: 'phish', label: 'Phishing' },
            { id: 'whale', label: 'Whaling' },
            { id: 'vish', label: 'Vishing' },
            { id: 'tailgate', label: 'Tailgating' },
            { id: 'shoulder', label: 'Shoulder surfing' }
          ],
          right: [
            { id: 'demail', label: 'Mass fraudulent email' },
            { id: 'dexec', label: 'Phishing aimed at a high-value executive' },
            { id: 'dvoice', label: 'Fraudulent voice / phone call' },
            { id: 'ddoor', label: 'Following an authorized person through a secure door' },
            { id: 'dscreen', label: 'Observing a screen or keypad over the shoulder' }
          ]
        },
        answer: { pairs: { phish: 'demail', whale: 'dexec', vish: 'dvoice', tailgate: 'ddoor', shoulder: 'dscreen' } } }
    ]
  },

  {
    id: 'a2-seed-socialeng-2', cert: 'aplus-core2', objective: '2.5', topic: 'Social Engineering Attacks',
    title: 'Match phishing variants by delivery medium', estMinutes: 4,
    scenario: 'Match each phishing variant to the medium it is delivered over.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each phishing variant with its delivery medium.',
        explanation: 'Phishing arrives by email. Smishing arrives by SMS/text. Vishing arrives by voice call. Spear phishing is email targeted at a specific person or organization. Quishing (QR phishing) uses a malicious QR code that redirects to a credential-harvesting site.',
        payload: {
          left: [
            { id: 'phish', label: 'Phishing' },
            { id: 'smish', label: 'Smishing' },
            { id: 'vish', label: 'Vishing' },
            { id: 'spear', label: 'Spear phishing' },
            { id: 'quish', label: 'Quishing' }
          ],
          right: [
            { id: 'demail', label: 'Email (mass)' },
            { id: 'dsms', label: 'SMS / text message' },
            { id: 'dvoice', label: 'Voice / phone call' },
            { id: 'dtarget', label: 'Email targeted at a specific person/org' },
            { id: 'dqr', label: 'Malicious QR code' }
          ]
        },
        answer: { pairs: { phish: 'demail', smish: 'dsms', vish: 'dvoice', spear: 'dtarget', quish: 'dqr' } } }
    ]
  },

  {
    id: 'a2-seed-permissions-1', cert: 'aplus-core2', objective: '2.2', topic: 'Windows OS Security Settings',
    title: 'NTFS vs share permission precedence', estMinutes: 4,
    scenario: 'A user accesses a shared folder over the network. Reason about NTFS versus share permissions. Answer all fields.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'Over the network, the effective permission is the MOST or LEAST restrictive of the combined Share and NTFS permissions? (one word)',
        explanation: 'Over the network the effective permission is the MORE/MOST restrictive (the intersection) of the combined Share permission and the combined NTFS permission.',
        payload: { fields: [{ id: 'rule', label: 'One word', inputmode: 'text' }] },
        answer: { rule: ['most', 'more', 'restrictive'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'Which permission set applies when the user logs on LOCALLY (no network share involved)? (one word)',
        explanation: 'Share permissions apply only over the network. Locally, only NTFS permissions apply.',
        payload: { fields: [{ id: 'local', label: 'NTFS or Share', inputmode: 'text' }] },
        answer: { local: ['NTFS', 'ntfs'] } },
      { id: 's3', type: 'fillin', points: 1,
        prompt: 'Between an explicit Allow and an explicit Deny on the same resource, which one wins? (one word)',
        explanation: 'An explicit Deny always overrides an Allow.',
        payload: { fields: [{ id: 'wins', label: 'One word', inputmode: 'text' }] },
        answer: { wins: ['Deny', 'deny'] } }
    ]
  },

  {
    id: 'a2-seed-mfa-1', cert: 'aplus-core2', objective: '2.1', topic: 'Logical Security & MFA',
    title: 'Classify the authentication factor', estMinutes: 4,
    scenario: 'Sort each authenticator into the MFA factor category it belongs to.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each item under Something you know, Something you have, or Something you are.',
        explanation: 'A password and a PIN are something you know. A hardware token and an authenticator app (TOTP) are something you have. A fingerprint and facial recognition are something you are (biometrics).',
        payload: {
          items: [
            { id: 'pwd', label: 'Password' },
            { id: 'pin', label: 'PIN' },
            { id: 'token', label: 'Hardware token' },
            { id: 'authapp', label: 'Authenticator app (TOTP)' },
            { id: 'finger', label: 'Fingerprint' },
            { id: 'face', label: 'Facial recognition' }
          ],
          buckets: [
            { id: 'know', label: 'Something you know' },
            { id: 'have', label: 'Something you have' },
            { id: 'are', label: 'Something you are' }
          ]
        },
        answer: { map: { pwd: 'know', pin: 'know', token: 'have', authapp: 'have', finger: 'are', face: 'are' } } }
    ]
  },

  {
    id: 'a2-seed-bestpractices-1', cert: 'aplus-core2', objective: '2.7', topic: 'Workstation Security & Hardening',
    title: 'Match the account security best practice', estMinutes: 4,
    scenario: 'Match each security best practice to what it accomplishes.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each best practice with its effect.',
        explanation: 'A strong password policy enforces length and complexity. MFA requires two or more distinct factors. Least privilege grants only the access a user needs. Account lockout stops brute-force guessing after failed attempts. Disabling the Guest account removes an unauthenticated access path (account hardening). Disabling AutoRun removes the automatic-execution entry point that USB-delivered malware exploits (attack-surface reduction).',
        payload: {
          left: [
            { id: 'pwpolicy', label: 'Password policy' },
            { id: 'mfa', label: 'Multifactor authentication' },
            { id: 'leastpriv', label: 'Least privilege' },
            { id: 'lockout', label: 'Account lockout' },
            { id: 'guestacct', label: 'Disable Guest account' },
            { id: 'autorun', label: 'Disable AutoRun' }
          ],
          right: [
            { id: 'dcomplex', label: 'Enforces password length and complexity' },
            { id: 'dfactors', label: 'Requires two or more distinct factors' },
            { id: 'dminimum', label: 'Grants only the access a user needs' },
            { id: 'dbrute', label: 'Stops brute-force guessing after failed attempts' },
            { id: 'dguest', label: 'Removes an unauthenticated local access path' },
            { id: 'dusb', label: 'Removes the USB automatic-execution malware entry point' }
          ]
        },
        answer: { pairs: { pwpolicy: 'dcomplex', mfa: 'dfactors', leastpriv: 'dminimum', lockout: 'dbrute', guestacct: 'dguest', autorun: 'dusb' } } }
    ]
  },

  {
    id: 'a2-seed-bestpractices-2', cert: 'aplus-core2', objective: '2.7', topic: 'Workstation Security & Hardening',
    title: 'Categorize the hardening action', estMinutes: 4,
    scenario: 'Sort each workstation-hardening action by the goal it serves.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each action under Account control, Patch/Update, or Attack-surface reduction.',
        explanation: 'Setting password expiration and enabling account lockout are account-control measures. Enabling automatic updates and applying patches are patch/update measures. Disabling unused services and removing unnecessary software reduce the attack surface.',
        payload: {
          items: [
            { id: 'expiry', label: 'Set password expiration' },
            { id: 'lockout', label: 'Enable account lockout' },
            { id: 'autoupdate', label: 'Enable automatic updates' },
            { id: 'patch', label: 'Apply security patches' },
            { id: 'disablesvc', label: 'Disable unused services' },
            { id: 'removeapp', label: 'Remove unnecessary software' }
          ],
          buckets: [
            { id: 'acct', label: 'Account control' },
            { id: 'patchupd', label: 'Patch / Update' },
            { id: 'surface', label: 'Attack-surface reduction' }
          ]
        },
        answer: { map: { expiry: 'acct', lockout: 'acct', autoupdate: 'patchupd', patch: 'patchupd', disablesvc: 'surface', removeapp: 'surface' } } }
    ]
  },

  {
    id: 'a2-seed-wireless-1', cert: 'aplus-core2', objective: '2.3', topic: 'Wireless Security Protocols',
    title: 'Order wireless protocols by strength', estMinutes: 4,
    scenario: 'Order these Wi-Fi security protocols from WEAKEST (top) to STRONGEST (bottom).',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the protocols from weakest to strongest.',
        explanation: 'WEP is broken and weakest. WPA (TKIP) improved on WEP but is deprecated. WPA2 (AES-CCMP) is strong and long the standard. WPA3 (SAE) is the strongest current option. Order weakest → strongest: WEP, WPA, WPA2, WPA3.',
        payload: { items: [
          { id: 'wpa2', label: 'WPA2 (AES)' },
          { id: 'wep', label: 'WEP' },
          { id: 'wpa3', label: 'WPA3 (SAE)' },
          { id: 'wpa', label: 'WPA (TKIP)' }
        ] },
        answer: { correctOrder: ['wep', 'wpa', 'wpa2', 'wpa3'] } }
    ]
  },

  {
    id: 'a2-seed-datadestruction-1', cert: 'aplus-core2', objective: '2.9', topic: 'Data Destruction & Disposal',
    title: 'Categorize the data-destruction method', estMinutes: 4,
    scenario: 'Sort each data-destruction method by whether the drive can be reused afterward.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each method under Reusable (sanitized) or Physical destruction.',
        explanation: 'Standard formatting, drive wiping (overwriting), and a secure erase leave the drive usable. Shredding, drilling/incineration, and degaussing physically destroy the drive (degaussing a magnetic drive renders it permanently unusable).',
        payload: {
          items: [
            { id: 'wipe', label: 'Overwrite / wipe the drive' },
            { id: 'secerase', label: 'ATA Secure Erase' },
            { id: 'format', label: 'Standard reformat' },
            { id: 'shred', label: 'Shredding' },
            { id: 'drill', label: 'Drilling / incineration' },
            { id: 'degauss', label: 'Degaussing' }
          ],
          buckets: [
            { id: 'reuse', label: 'Reusable (sanitized)' },
            { id: 'destroy', label: 'Physical destruction' }
          ]
        },
        // Reviewed (A+ examiner + SME): confirmed correct.
        answer: { map: { wipe: 'reuse', secerase: 'reuse', format: 'reuse', shred: 'destroy', drill: 'destroy', degauss: 'destroy' } } }
    ]
  },

  {
    id: 'a2-seed-mobilesec-1', cert: 'aplus-core2', objective: '2.8', topic: 'Mobile Device Security',
    title: 'Match the mobile security control', estMinutes: 4,
    scenario: 'Match each mobile-device security control to its purpose.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each mobile control with its purpose.',
        explanation: 'A screen lock (PIN/biometric) blocks unauthorized local access. Remote wipe erases a lost device. Full-device encryption protects data at rest. An MDM enforces policy across managed devices. Installing apps only from a trusted/official store reduces malware risk.',
        payload: {
          left: [
            { id: 'lock', label: 'Screen lock' },
            { id: 'wipe', label: 'Remote wipe' },
            { id: 'encrypt', label: 'Device encryption' },
            { id: 'mdm', label: 'MDM' },
            { id: 'store', label: 'Official app store only' }
          ],
          right: [
            { id: 'dlocal', label: 'Blocks unauthorized local access' },
            { id: 'dlost', label: 'Erases a lost or stolen device' },
            { id: 'datrest', label: 'Protects data at rest' },
            { id: 'dpolicy', label: 'Enforces policy across managed devices' },
            { id: 'dmalware', label: 'Reduces malware from untrusted apps' }
          ]
        },
        answer: { pairs: { lock: 'dlocal', wipe: 'dlost', encrypt: 'datrest', mdm: 'dpolicy', store: 'dmalware' } } }
    ]
  },

  {
    id: 'a2-seed-browsersec-1', cert: 'aplus-core2', objective: '2.10', topic: 'SOHO & Browser Security',
    title: 'Match the browser security feature', estMinutes: 4,
    scenario: 'Match each secure-browser practice to what it does.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each browser feature with its function.',
        explanation: 'A pop-up blocker stops unwanted pop-up windows. Clearing the cache/cookies removes stored browsing data. A password manager stores and fills credentials securely. Verifying the HTTPS/padlock confirms an encrypted, certificate-validated connection. An ad/script blocker extension reduces malvertising exposure.',
        payload: {
          left: [
            { id: 'popup', label: 'Pop-up blocker' },
            { id: 'cache', label: 'Clear cache and cookies' },
            { id: 'pwmgr', label: 'Password manager' },
            { id: 'https', label: 'Verify HTTPS / padlock' },
            { id: 'adblock', label: 'Ad / script blocker' }
          ],
          right: [
            { id: 'dpopup', label: 'Stops unwanted pop-up windows' },
            { id: 'ddata', label: 'Removes stored browsing data' },
            { id: 'dcreds', label: 'Stores and fills credentials securely' },
            { id: 'dencrypt', label: 'Confirms an encrypted, validated connection' },
            { id: 'dmalvert', label: 'Reduces malvertising exposure' }
          ]
        },
        answer: { pairs: { popup: 'dpopup', cache: 'ddata', pwmgr: 'dcreds', https: 'dencrypt', adblock: 'dmalvert' } } }
    ]
  },

  {
    id: 'a2-seed-physicalsec-1', cert: 'aplus-core2', objective: '2.1', topic: 'Physical Security Measures',
    title: 'Match the physical security control', estMinutes: 4,
    scenario: 'Match each physical security control to its primary purpose.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each physical control with its purpose.',
        explanation: 'A badge reader controls electronic door access. An access control vestibule (mantrap) prevents tailgating, one person at a time. A bollard stops vehicles from ramming. A cable lock secures a laptop to a desk. A privacy screen filter blocks shoulder-surfing of a monitor.',
        payload: {
          left: [
            { id: 'badge', label: 'Badge reader' },
            { id: 'vestibule', label: 'Access control vestibule' },
            { id: 'bollard', label: 'Bollard' },
            { id: 'cablelock', label: 'Cable lock' },
            { id: 'privscreen', label: 'Privacy screen filter' }
          ],
          right: [
            { id: 'ddoor', label: 'Controls electronic door access' },
            { id: 'dtailgate', label: 'Prevents tailgating, one person at a time' },
            { id: 'dvehicle', label: 'Stops vehicles from ramming' },
            { id: 'dlaptop', label: 'Secures a laptop to a desk' },
            { id: 'dshoulder', label: 'Blocks shoulder-surfing of a monitor' }
          ]
        },
        answer: { pairs: { badge: 'ddoor', vestibule: 'dtailgate', bollard: 'dvehicle', cablelock: 'dlaptop', privscreen: 'dshoulder' } } }
    ]
  },

  {
    id: 'a2-seed-threats-1', cert: 'aplus-core2', objective: '2.5', topic: 'Threats & Vulnerabilities',
    title: 'Spot the strongest infection indicator', estMinutes: 3,
    scenario: 'A help-desk ticket lists four observations on a PC. Click the single observation that most strongly indicates a malware infection.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the strongest indicator of a malware infection.',
        explanation: 'The browser being redirected to unknown sites with new pop-ups and a changed home page is a classic malware/browser-hijack indicator. A scheduled update, a full Recycle Bin, and a dimmed display on battery are benign.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Windows Update installed cumulative update KB5 overnight' },
            { id: 'l2', text: 'Browser redirects to unknown sites; home page changed; constant pop-ups' },
            { id: 'l3', text: 'Recycle Bin is full and needs emptying' },
            { id: 'l4', text: 'Screen dims after 1 minute when on battery power' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  // ========================================================================
  // ===== Domain 3 — Software Troubleshooting (~11) ========================
  // ========================================================================
  {
    id: 'a2-seed-troubleshoot-1', cert: 'aplus-core2', objective: '3.1', topic: 'Troubleshoot Windows OS Issues',
    title: 'Order the CompTIA troubleshooting methodology', estMinutes: 5,
    scenario: 'Apply the CompTIA best-practice troubleshooting methodology to a software problem. Put the steps in order, first step at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the troubleshooting steps in the correct order.',
        explanation: 'CompTIA order: (1) Identify the problem, (2) Establish a theory of probable cause, (3) Test the theory to determine the cause, (4) Establish a plan of action and implement the solution, (5) Verify full system functionality and apply preventive measures, (6) Document findings, actions, and outcomes.',
        payload: { items: [
          { id: 'theory', label: 'Establish a theory of probable cause' },
          { id: 'identify', label: 'Identify the problem' },
          { id: 'document', label: 'Document findings, actions, and outcomes' },
          { id: 'test', label: 'Test the theory to determine the cause' },
          { id: 'verify', label: 'Verify full functionality; apply preventive measures' },
          { id: 'plan', label: 'Establish a plan and implement the solution' }
        ] },
        answer: { correctOrder: ['identify', 'theory', 'test', 'plan', 'verify', 'document'] } }
    ]
  },

  {
    id: 'a2-seed-bsod-1', cert: 'aplus-core2', objective: '3.1', topic: 'BSOD & System Instability',
    title: 'Match the Windows symptom to a likely cause', estMinutes: 4,
    scenario: 'Match each Windows stability symptom to its most likely cause.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each symptom with its most likely cause.',
        explanation: 'A repeated BSOD often points to a faulty driver or failing hardware (commonly RAM). Random reboots commonly indicate overheating or a failing power supply. Slow boot often comes from too many startup programs. An application that fails to start may need a missing runtime/dependency. "No OS found" points to a boot-order or corrupt-bootloader problem.',
        payload: {
          left: [
            { id: 'bsod', label: 'Repeated BSOD' },
            { id: 'reboot', label: 'Random reboots' },
            { id: 'slowboot', label: 'Very slow boot' },
            { id: 'appfail', label: 'Application will not start' },
            { id: 'noos', label: '"Operating system not found"' }
          ],
          right: [
            { id: 'ddriver', label: 'Faulty driver or failing RAM' },
            { id: 'dheat', label: 'Overheating or failing power supply' },
            { id: 'dstartup', label: 'Too many startup programs' },
            { id: 'ddependency', label: 'Missing runtime / dependency' },
            { id: 'dboot', label: 'Wrong boot order or corrupt bootloader' }
          ]
        },
        answer: { pairs: { bsod: 'ddriver', reboot: 'dheat', slowboot: 'dstartup', appfail: 'ddependency', noos: 'dboot' } } }
    ]
  },

  {
    id: 'a2-seed-boottool-1', cert: 'aplus-core2', objective: '3.1', topic: 'Boot & Performance Issues',
    title: 'Match the recovery tool to the problem', estMinutes: 4,
    scenario: 'Match each Windows recovery/repair tool to the problem it addresses.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each tool with the problem it fixes.',
        explanation: 'Safe Mode boots with minimal drivers to isolate a bad driver/app. System Restore rolls back to an earlier restore point. sfc /scannow repairs corrupt system files. Startup Repair (WinRE) fixes boot problems. msconfig/Task Manager Startup disables startup programs.',
        payload: {
          left: [
            { id: 'safemode', label: 'Safe Mode' },
            { id: 'restore', label: 'System Restore' },
            { id: 'sfc', label: 'sfc /scannow' },
            { id: 'startuprepair', label: 'Startup Repair' },
            { id: 'msconfig', label: 'msconfig / Startup tab' }
          ],
          right: [
            { id: 'dminimal', label: 'Boots with minimal drivers to isolate a fault' },
            { id: 'drollback', label: 'Rolls back to an earlier restore point' },
            { id: 'dsysfile', label: 'Repairs corrupt system files' },
            { id: 'dbootfix', label: 'Fixes boot problems' },
            { id: 'dstartup', label: 'Disables startup programs' }
          ]
        },
        answer: { pairs: { safemode: 'dminimal', restore: 'drollback', sfc: 'dsysfile', startuprepair: 'dbootfix', msconfig: 'dstartup' } } }
    ]
  },

  {
    id: 'a2-seed-appcrash-1', cert: 'aplus-core2', objective: '3.1', topic: 'Application Crash & Service Issues',
    title: 'Order the steps to fix a crashing app', estMinutes: 4,
    scenario: 'An application crashes on launch. Put the escalating troubleshooting steps in a sensible order, least disruptive first.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the steps from least to most disruptive.',
        explanation: 'Start least disruptive: restart the application, then reboot the system, then check for and install updates/patches, then repair the installation, and only if all else fails uninstall and reinstall. Each step is more disruptive than the last.',
        payload: { items: [
          { id: 'reinstall', label: 'Uninstall and reinstall the application' },
          { id: 'restartapp', label: 'Restart the application' },
          { id: 'reboot', label: 'Reboot the system' },
          { id: 'update', label: 'Check for and install updates' },
          { id: 'repair', label: 'Repair the installation' }
        ] },
        // REVIEW: ordering by escalating disruption is pedagogically sound but is a constructed best-practice sequence, not a verbatim CompTIA objective list. "Repair" vs "update" ordering is the most debatable swap — founder should confirm the intended order.
        answer: { correctOrder: ['restartapp', 'reboot', 'update', 'repair', 'reinstall'] } }
    ]
  },

  {
    id: 'a2-seed-profile-1', cert: 'aplus-core2', objective: '3.1', topic: 'Profile & Account Issues',
    title: 'Diagnose the user-profile symptom', estMinutes: 3,
    scenario: 'A user reports being logged into a desktop with none of their files or settings. Click the line that best identifies the problem.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the line that best identifies the issue.',
        explanation: 'Logging into a fresh desktop with default settings and none of the user’s data is the signature of a corrupt user profile, where Windows loads a temporary profile instead. The other lines describe unrelated network, printer, or update conditions.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'User signed in but got a default desktop with no personal files (temporary profile loaded)' },
            { id: 'l2', text: 'Default gateway is unreachable from the workstation' },
            { id: 'l3', text: 'Default printer shows offline in the queue' },
            { id: 'l4', text: 'A pending update is waiting for the next reboot' }
          ]
        },
        answer: { selected: ['l1'] } }
    ]
  },

  {
    id: 'a2-seed-mobileos-1', cert: 'aplus-core2', objective: '3.2', topic: 'Troubleshoot Mobile OS & App Issues',
    title: 'Match the mobile symptom to its fix', estMinutes: 4,
    scenario: 'Match each mobile-device symptom to the most appropriate first fix.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each symptom with its best first fix.',
        explanation: 'An app that keeps crashing should be force-closed and updated/reinstalled. Rapid battery drain is often a misbehaving app found in battery usage. No mobile data after travel is often fixed by toggling airplane mode or checking the data/APN setting. A dim, unreadable screen suggests auto-brightness or a brightness setting. Slow performance/low storage calls for clearing cache and freeing space.',
        payload: {
          left: [
            { id: 'crash', label: 'App keeps crashing' },
            { id: 'battery', label: 'Rapid battery drain' },
            { id: 'nodata', label: 'No mobile data' },
            { id: 'dim', label: 'Screen too dim' },
            { id: 'slow', label: 'Slow / low storage' }
          ],
          right: [
            { id: 'dreinstall', label: 'Force-close, update, or reinstall the app' },
            { id: 'dusage', label: 'Check battery usage for a misbehaving app' },
            { id: 'dtoggle', label: 'Toggle airplane mode / check data setting' },
            { id: 'dbright', label: 'Adjust brightness / auto-brightness' },
            { id: 'dcache', label: 'Clear cache and free up storage' }
          ]
        },
        answer: { pairs: { crash: 'dreinstall', battery: 'dusage', nodata: 'dtoggle', dim: 'dbright', slow: 'dcache' } } }
    ]
  },

  {
    id: 'a2-seed-pcsecurity-1', cert: 'aplus-core2', objective: '3.4', topic: 'Troubleshoot PC Security Issues',
    title: 'Order the first-responder triage for a ransomware report', estMinutes: 4,
    scenario: 'A user reports their files are encrypted with a ransom note on screen. This is incident-response TRIAGE — the first-responder containment and escalation sequence before the full 7-step malware removal procedure begins. Put your triage steps in order, first step at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the first-responder containment/escalation steps in order. (This is triage, not the full malware-removal procedure.)',
        explanation: 'Incident-response triage for ransomware: (1) Isolate the machine from the network immediately to stop lateral spread — this is first-responder containment, equivalent to "quarantine" in the malware removal procedure but done here before any formal removal steps. (2) Report the incident per policy/escalate to the security team. (3) Identify the malware strain and scope. (4) Remediate (remove the malware — do not pay the ransom). (5) Restore data from a known-good backup. (6) Educate the user. Note: the full 7-step CompTIA malware removal procedure (investigate → quarantine → disable System Restore → remediate → schedule scans → re-enable System Restore → educate) governs the cleanup phase that follows this initial triage.',
        payload: { items: [
          { id: 'restore', label: 'Restore data from a known-good backup' },
          { id: 'isolate', label: 'Isolate the machine from the network (containment)' },
          { id: 'educate', label: 'Educate the user' },
          { id: 'report', label: 'Report the incident per policy / escalate' },
          { id: 'identify', label: 'Identify the malware strain and scope' },
          { id: 'remediate', label: 'Remediate (remove the malware; do not pay)' }
        ] },
        answer: { correctOrder: ['isolate', 'report', 'identify', 'remediate', 'restore', 'educate'] } }
    ]
  },

  {
    id: 'a2-seed-malwaresymptom-1', cert: 'aplus-core2', objective: '3.4', topic: 'Malware Symptom Diagnosis',
    title: 'Categorize the malware symptom', estMinutes: 4,
    scenario: 'Sort each observed symptom by where it shows up: browser, system performance, or security/alerts.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each symptom under Browser, System performance, or Security alerts.',
        explanation: 'Redirects and a hijacked home page are browser symptoms. High CPU at idle and a sluggish system are performance symptoms. Disabled antivirus and fake security pop-ups are security-alert symptoms.',
        payload: {
          items: [
            { id: 'redirect', label: 'Search results redirect to ad sites' },
            { id: 'homepage', label: 'Home page changed without consent' },
            { id: 'highcpu', label: 'High CPU usage while idle' },
            { id: 'sluggish', label: 'System is suddenly very sluggish' },
            { id: 'avoff', label: 'Antivirus has been disabled' },
            { id: 'fakealert', label: 'Fake "your PC is infected" pop-up' }
          ],
          buckets: [
            { id: 'browser', label: 'Browser' },
            { id: 'perf', label: 'System performance' },
            { id: 'sec', label: 'Security alerts' }
          ]
        },
        answer: { map: { redirect: 'browser', homepage: 'browser', highcpu: 'perf', sluggish: 'perf', avoff: 'sec', fakealert: 'sec' } } }
    ]
  },

  {
    id: 'a2-seed-bootsymptom-1', cert: 'aplus-core2', objective: '3.1', topic: 'Boot & Performance Issues',
    title: 'Pick the right tool for slow boot', estMinutes: 3,
    scenario: 'A Windows PC takes several minutes to reach the desktop but works fine afterward. Click the single best first action.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the best first action for a slow boot.',
        explanation: 'Slow boot with normal post-login behavior most often comes from too many startup programs; disabling unneeded startup items (Task Manager Startup tab / msconfig) is the right first action. Reinstalling Windows is premature, and the other actions do not target startup load.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Reinstall Windows from scratch immediately' },
            { id: 'l2', text: 'Disable unnecessary startup programs (Task Manager Startup tab)' },
            { id: 'l3', text: 'Replace the network cable' },
            { id: 'l4', text: 'Increase the monitor refresh rate' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  {
    id: 'a2-seed-mobilesecissue-1', cert: 'aplus-core2', objective: '3.3', topic: 'Troubleshoot Mobile Security Issues',
    title: 'Spot the mobile compromise indicator', estMinutes: 3,
    scenario: 'A phone is behaving oddly. Click the single observation that most strongly indicates a security compromise.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the strongest indicator of a compromised mobile device.',
        explanation: 'Unexpected high data usage with unknown apps installed and unusual charges is a strong compromise indicator (leaky/malicious apps exfiltrating data). A low-battery warning, a pending OS update, and Wi-Fi auto-connecting to a saved network are benign.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: 'Battery at 15%, low-power mode prompt appeared' },
            { id: 'l2', text: 'Unexpected high data usage; unknown apps installed; odd charges' },
            { id: 'l3', text: 'An OS update is pending installation' },
            { id: 'l4', text: 'Phone auto-connected to a previously saved Wi-Fi network' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  {
    id: 'a2-seed-browsersymptom-1', cert: 'aplus-core2', objective: '3.4', topic: 'Browser Symptom Troubleshooting',
    title: 'Match the browser problem to its fix', estMinutes: 4,
    scenario: 'Match each browser problem to the most appropriate fix.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each browser problem with its fix.',
        explanation: 'A certificate warning is addressed by checking the system clock and the site’s certificate validity. Constant pop-ups call for enabling the pop-up blocker and removing adware. A hijacked home page is reset in browser settings and by removing the malicious extension. A slow browser benefits from clearing cache and disabling extensions. "Page won’t load for one site" suggests flushing DNS / checking the connection.',
        payload: {
          left: [
            { id: 'cert', label: 'Certificate warning on a known site' },
            { id: 'popups', label: 'Constant pop-ups' },
            { id: 'hijack', label: 'Home page hijacked' },
            { id: 'slow', label: 'Browser is slow' },
            { id: 'oneload', label: 'One site will not load' }
          ],
          right: [
            { id: 'dclock', label: 'Check system clock and certificate validity' },
            { id: 'dblocker', label: 'Enable pop-up blocker; remove adware' },
            { id: 'dreset', label: 'Reset settings; remove malicious extension' },
            { id: 'dcache', label: 'Clear cache; disable extensions' },
            { id: 'ddns', label: 'Flush DNS; check the connection' }
          ]
        },
        answer: { pairs: { cert: 'dclock', popups: 'dblocker', hijack: 'dreset', slow: 'dcache', oneload: 'ddns' } } }
    ]
  },

  // ========================================================================
  // ===== Domain 4 — Operational Procedures (~11) ==========================
  // ========================================================================
  {
    id: 'a2-seed-changemgmt-1', cert: 'aplus-core2', objective: '4.2', topic: 'Change Management Procedures',
    title: 'Order the change-management process', estMinutes: 4,
    scenario: 'A change must move through your change-management process. Put the steps in order, first step at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the change-management steps in order.',
        explanation: 'Submit a change request with documented scope and purpose, have the Change Advisory Board review/approve it (with risk analysis and a rollback plan), test in a sandbox, implement during the approved window, then document the change. Approval precedes testing and implementation.',
        payload: { items: [
          { id: 'test', label: 'Test the change in a sandbox' },
          { id: 'request', label: 'Submit the change request' },
          { id: 'document', label: 'Document the completed change' },
          { id: 'approve', label: 'CAB reviews and approves (risk + rollback plan)' },
          { id: 'implement', label: 'Implement during the approved window' }
        ] },
        answer: { correctOrder: ['request', 'approve', 'test', 'implement', 'document'] } }
    ]
  },

  {
    id: 'a2-seed-changemgmt-2', cert: 'aplus-core2', objective: '4.2', topic: 'Change Management Procedures',
    title: 'Match the change-management term', estMinutes: 4,
    scenario: 'Match each change-management element to its meaning.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each element with its meaning.',
        explanation: 'The scope of change defines what is and is not affected. A risk analysis assesses what could go wrong. The rollback (backout) plan restores the prior state if the change fails. The CAB (Change Advisory Board) approves changes. The maintenance window is the approved time to implement.',
        payload: {
          left: [
            { id: 'scope', label: 'Scope of change' },
            { id: 'risk', label: 'Risk analysis' },
            { id: 'rollback', label: 'Rollback plan' },
            { id: 'cab', label: 'Change Advisory Board' },
            { id: 'window', label: 'Maintenance window' }
          ],
          right: [
            { id: 'daffected', label: 'Defines what is and is not affected' },
            { id: 'dwrong', label: 'Assesses what could go wrong' },
            { id: 'drestore', label: 'Restores the prior state if the change fails' },
            { id: 'dapprove', label: 'Approves proposed changes' },
            { id: 'dtime', label: 'Approved time to implement' }
          ]
        },
        answer: { pairs: { scope: 'daffected', risk: 'dwrong', rollback: 'drestore', cab: 'dapprove', window: 'dtime' } } }
    ]
  },

  {
    id: 'a2-seed-backup-1', cert: 'aplus-core2', objective: '4.3', topic: 'Backup & Recovery Methods',
    title: 'Match the backup type', estMinutes: 4,
    scenario: 'Match each backup type to its defining behavior.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each backup type with its behavior.',
        explanation: 'A full backup copies everything every time. An incremental backup copies only what changed since the last backup of any type. A differential backup copies everything changed since the last full backup. A synthetic full is constructed by the software from a prior full plus subsequent incrementals.',
        payload: {
          left: [
            { id: 'full', label: 'Full' },
            { id: 'incr', label: 'Incremental' },
            { id: 'diff', label: 'Differential' },
            { id: 'synth', label: 'Synthetic full' }
          ],
          right: [
            { id: 'deverything', label: 'Copies everything every time' },
            { id: 'dsincelast', label: 'Copies only what changed since the last backup of any type' },
            { id: 'dsincefull', label: 'Copies everything changed since the last full backup' },
            { id: 'dconstruct', label: 'Constructed from a prior full plus later incrementals' }
          ]
        },
        answer: { pairs: { full: 'deverything', incr: 'dsincelast', diff: 'dsincefull', synth: 'dconstruct' } } }
    ]
  },

  {
    id: 'a2-seed-backup-2', cert: 'aplus-core2', objective: '4.3', topic: 'Backup & Recovery Methods',
    title: 'Apply the 3-2-1 backup rule', estMinutes: 3,
    scenario: 'Answer the three fields about the 3-2-1 backup rule.',
    steps: [
      { id: 's1', type: 'fillin', points: 1,
        prompt: 'How many total copies of the data does the 3-2-1 rule require?',
        explanation: 'The 3-2-1 rule keeps 3 total copies of the data.',
        payload: { fields: [{ id: 'copies', label: 'Number', inputmode: 'numeric' }] },
        answer: { copies: ['3', 'three'] } },
      { id: 's2', type: 'fillin', points: 1,
        prompt: 'On how many different media types should those copies be stored?',
        explanation: 'The rule stores copies on 2 different media types.',
        payload: { fields: [{ id: 'media', label: 'Number', inputmode: 'numeric' }] },
        answer: { media: ['2', 'two'] } },
      { id: 's3', type: 'fillin', points: 1,
        prompt: 'How many copies should be kept offsite?',
        explanation: 'The rule keeps 1 copy offsite.',
        payload: { fields: [{ id: 'offsite', label: 'Number', inputmode: 'numeric' }] },
        answer: { offsite: ['1', 'one'] } }
    ]
  },

  {
    id: 'a2-seed-safety-1', cert: 'aplus-core2', objective: '4.4', topic: 'Safety Procedures',
    title: 'Match the safety equipment to its hazard', estMinutes: 4,
    scenario: 'Match each safety measure to the hazard it protects against.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each safety measure with its hazard.',
        explanation: 'An ESD/antistatic wrist strap protects components from electrostatic discharge. Safety goggles protect eyes from debris. An equipment cart with proper lifting protects against back injury. A Class C fire extinguisher is rated for electrical fires. An MSDS/SDS documents safe handling and disposal of chemicals.',
        payload: {
          left: [
            { id: 'esd', label: 'Antistatic wrist strap' },
            { id: 'goggles', label: 'Safety goggles' },
            { id: 'lifting', label: 'Proper lifting technique' },
            { id: 'classc', label: 'Class C fire extinguisher' },
            { id: 'sds', label: 'SDS / MSDS' }
          ],
          right: [
            { id: 'desd', label: 'Electrostatic discharge to components' },
            { id: 'deyes', label: 'Flying debris in the eyes' },
            { id: 'dback', label: 'Back injury from heavy equipment' },
            { id: 'delec', label: 'Electrical fire' },
            { id: 'dchem', label: 'Unsafe chemical handling/disposal' }
          ]
        },
        answer: { pairs: { esd: 'desd', goggles: 'deyes', lifting: 'dback', classc: 'delec', sds: 'dchem' } } }
    ]
  },

  {
    id: 'a2-seed-incident-1', cert: 'aplus-core2', objective: '4.6', topic: 'Incident Response & Prohibited Content',
    title: 'Order the prohibited-content response', estMinutes: 4,
    scenario: 'A technician discovers prohibited content on a company device. Put the first-responder steps in order, first step at the top.',
    steps: [
      { id: 's1', type: 'order', points: 1,
        prompt: 'Arrange the first-responder steps in order.',
        explanation: 'Identify what was found, report it through the proper channels immediately, preserve the data and the device (do not alter it), maintain documentation and chain of custody, then hand off to the appropriate authority. Reporting and preservation precede any further handling.',
        payload: { items: [
          { id: 'preserve', label: 'Preserve the data and device (do not alter)' },
          { id: 'identify', label: 'Identify what was found' },
          { id: 'handoff', label: 'Hand off to the proper authority' },
          { id: 'report', label: 'Report through proper channels' },
          { id: 'document', label: 'Document and maintain chain of custody' }
        ] },
        answer: { correctOrder: ['identify', 'report', 'preserve', 'document', 'handoff'] } }
    ]
  },

  {
    id: 'a2-seed-regdata-1', cert: 'aplus-core2', objective: '4.6', topic: 'Licensing & Regulated Data',
    title: 'Categorize the regulated data type', estMinutes: 4,
    scenario: 'Sort each data example by its inherent type, out of context: PII, PHI, or Payment (PCI).',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each data item under PII, PHI, or Payment (PCI).',
        explanation: 'A Social Security number and a home address identify a person (PII). A diagnosis and a medical record number are health information (PHI). A credit card number and a bank account number are payment/financial data (PCI).',
        payload: {
          items: [
            { id: 'ssn', label: 'Social Security number' },
            { id: 'address', label: 'Home address' },
            { id: 'diagnosis', label: 'Patient diagnosis' },
            { id: 'mrn', label: 'Medical record number' },
            { id: 'cc', label: 'Credit card number' },
            { id: 'bank', label: 'Bank account number' }
          ],
          buckets: [
            { id: 'pii', label: 'PII' },
            { id: 'phi', label: 'PHI' },
            { id: 'pci', label: 'Payment (PCI)' }
          ]
        },
        // Reviewed (A+ examiner + SME): confirmed correct.
        answer: { map: { ssn: 'pii', address: 'pii', diagnosis: 'phi', mrn: 'phi', cc: 'pci', bank: 'pci' } } }
    ]
  },

  {
    id: 'a2-seed-remote-1', cert: 'aplus-core2', objective: '4.9', topic: 'Remote Access Technologies',
    title: 'Match the remote-access technology', estMinutes: 4,
    scenario: 'Match each remote-access technology to its description.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each technology with its description.',
        explanation: 'RDP gives a full graphical remote desktop to a Windows host. SSH is an encrypted command-line remote session. A VPN creates an encrypted tunnel into a private network. VNC is a cross-platform screen-sharing protocol. Telnet is a legacy, unencrypted remote terminal (avoid it).',
        payload: {
          left: [
            { id: 'rdp', label: 'RDP' },
            { id: 'ssh', label: 'SSH' },
            { id: 'vpn', label: 'VPN' },
            { id: 'vnc', label: 'VNC' },
            { id: 'telnet', label: 'Telnet' }
          ],
          right: [
            { id: 'dgui', label: 'Full graphical remote desktop to a Windows host' },
            { id: 'dcli', label: 'Encrypted command-line remote session' },
            { id: 'dtunnel', label: 'Encrypted tunnel into a private network' },
            { id: 'dscreen', label: 'Cross-platform screen sharing' },
            { id: 'dlegacy', label: 'Legacy, unencrypted remote terminal' }
          ]
        },
        answer: { pairs: { rdp: 'dgui', ssh: 'dcli', vpn: 'dtunnel', vnc: 'dscreen', telnet: 'dlegacy' } } }
    ]
  },

  {
    id: 'a2-seed-scripting-1', cert: 'aplus-core2', objective: '4.8', topic: 'Scripting Basics',
    title: 'Match the script type to its file extension', estMinutes: 4,
    scenario: 'Match each script type to the file extension it uses.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each script type with its extension.',
        explanation: 'A Windows batch file uses .bat. A PowerShell script uses .ps1. A Python script uses .py. A Linux/Unix shell script uses .sh. A JavaScript file uses .js. (VBScript, not listed, uses .vbs.)',
        payload: {
          left: [
            { id: 'batch', label: 'Windows batch file' },
            { id: 'ps', label: 'PowerShell script' },
            { id: 'py', label: 'Python script' },
            { id: 'sh', label: 'Shell script' },
            { id: 'js', label: 'JavaScript' }
          ],
          right: [
            { id: 'dbat', label: '.bat' },
            { id: 'dps1', label: '.ps1' },
            { id: 'dpy', label: '.py' },
            { id: 'dsh', label: '.sh' },
            { id: 'djs', label: '.js' }
          ]
        },
        answer: { pairs: { batch: 'dbat', ps: 'dps1', py: 'dpy', sh: 'dsh', js: 'djs' } } }
    ]
  },

  {
    id: 'a2-seed-comm-1', cert: 'aplus-core2', objective: '4.7', topic: 'Communication & Professionalism',
    title: 'Spot the most professional response', estMinutes: 3,
    scenario: 'A frustrated user is venting about a recurring issue. Click the single response that best reflects professional communication.',
    steps: [
      { id: 's1', type: 'analyze', points: 1,
        prompt: 'Select the most professional response.',
        explanation: 'Actively listening, avoiding interrupting or arguing, and acknowledging the problem before explaining the next step reflects CompTIA professionalism. Dismissing the user, blaming them, or using heavy jargon are all unprofessional.',
        payload: {
          multi: false,
          lines: [
            { id: 'l1', text: '"That is a user error; you must be doing it wrong."' },
            { id: 'l2', text: '"I understand this has been frustrating. Let me confirm what is happening and walk through the fix."' },
            { id: 'l3', text: '"The PEBKAC layer-8 issue is your NIC negotiating half-duplex MTU."' },
            { id: 'l4', text: '"I am busy right now; submit a ticket and wait."' }
          ]
        },
        answer: { selected: ['l2'] } }
    ]
  },

  {
    id: 'a2-seed-aibasics-1', cert: 'aplus-core2', objective: '4.10', topic: 'AI Basics',
    title: 'Safe vs unsafe data to share with a public AI tool', estMinutes: 3,
    scenario: 'A technician uses a public generative-AI chatbot to help draft documentation. Sort each item by whether it is safe to paste into the public tool or must be kept private.',
    steps: [
      { id: 's1', type: 'categorize', points: 1,
        prompt: 'Place each item under Safe to share or Keep private.',
        explanation: 'Public AI tools may store, log, or train on what you submit, so never paste confidential or regulated data: customer PII, credentials/API keys, and proprietary internal configs must stay out. Generic, non-sensitive questions and publicly documented facts are safe.',
        payload: {
          items: [
            { id: 'pii', label: "A customer's full name, address, and SSN" },
            { id: 'creds', label: 'A server admin password or API key' },
            { id: 'internal', label: 'A proprietary internal network diagram with IPs' },
            { id: 'generic', label: 'A general "how do I format a date in PowerShell" question' },
            { id: 'public', label: 'A publicly documented Windows error-code lookup' }
          ],
          buckets: [
            { id: 'safe', label: 'Safe to share' },
            { id: 'private', label: 'Keep private' }
          ]
        },
        answer: { map: { pii: 'private', creds: 'private', internal: 'private', generic: 'safe', public: 'safe' } } }
    ]
  },

  {
    id: 'a2-seed-docs-1', cert: 'aplus-core2', objective: '4.1', topic: 'Documentation & Ticketing',
    title: 'Match the documentation artifact', estMinutes: 4,
    scenario: 'Match each IT documentation artifact to its purpose.',
    steps: [
      { id: 's1', type: 'match', points: 1,
        prompt: 'Pair each document with its purpose.',
        explanation: 'A knowledge base article captures a reusable solution. An asset/inventory record tracks owned hardware and software. A network topology diagram shows how devices connect. An AUP (acceptable use policy) defines permitted use of IT resources. An incident ticket records a single reported issue from open to resolution.',
        payload: {
          left: [
            { id: 'kb', label: 'Knowledge base article' },
            { id: 'asset', label: 'Asset / inventory record' },
            { id: 'topology', label: 'Network topology diagram' },
            { id: 'aup', label: 'Acceptable use policy' },
            { id: 'ticket', label: 'Incident ticket' }
          ],
          right: [
            { id: 'dreuse', label: 'Captures a reusable solution' },
            { id: 'dtrack', label: 'Tracks owned hardware and software' },
            { id: 'ddiagram', label: 'Shows how devices connect' },
            { id: 'duse', label: 'Defines permitted use of IT resources' },
            { id: 'dissue', label: 'Records one reported issue to resolution' }
          ]
        },
        answer: { pairs: { kb: 'dreuse', asset: 'dtrack', topology: 'ddiagram', aup: 'duse', ticket: 'dissue' } } }
    ]
  }
];

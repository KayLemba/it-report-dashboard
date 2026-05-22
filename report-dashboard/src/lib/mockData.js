const MOCK_TITLES = [
  'VPN access failure — Finance dept',
  'Server patch DC-01 pending reboot',
  'Printer offline — HR 2nd floor',
  'Outlook sync broken — Marketing',
  'New laptop setup — Procurement',
  'Firewall rule change request',
  'WiFi drops in boardroom',
  'Software license renewal — Adobe',
  'Active Directory password reset',
  'CCTV storage full — Building B',
  'Email phishing report — user alert',
  'Switch port flapping — Floor 3',
  'Database backup failure overnight',
  'Teams calls dropping — remote users',
  'Antivirus not updating — Accounts',
  'USB device blocked — Compliance req',
  'Server room temperature alert',
  'Mobile device MDM enrolment',
  'SharePoint permissions error',
  'Scheduled maintenance — ERP system',
]

export const MOCK_TASKS = Array.from({ length: 60 }, (_, i) => {
  const categories = ['Helpdesk','Network','Security','Hardware','Software']
  const priorities  = ['P1','P2','P3','P4']
  const statuses    = ['done','open','in_progress']
  const assignees   = [
    { id:'a1', full_name:'T. Mwale' },
    { id:'a2', full_name:'N. Chanda' },
    { id:'a3', full_name:'B. Mutale' },
    { id:'a4', full_name:'P. Banda' },
    { id:'a5', full_name:'C. Tembo' },
  ]
  const created  = new Date(2026, 4, Math.floor(Math.random() * 30) + 1)
  const resHrs   = +(Math.random() * 8 + 1).toFixed(1)
  const slaTgt   = 8
  const status   = statuses[Math.floor(Math.random() * 3)]
  const assignee = assignees[Math.floor(Math.random() * assignees.length)]
  const resolved = status === 'done' ? new Date(created.getTime() + resHrs * 3600000).toISOString() : null
  return {
    ticket_id: `TK-${String(i + 200).padStart(4,'0')}`,
    title: MOCK_TITLES[i % MOCK_TITLES.length],
    category: categories[Math.floor(Math.random() * categories.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    status,
    assignee_id: assignee.id,
    assignee_name: assignee.full_name,
    created_at: created.toISOString(),
    resolved_at: resolved,
    resolution_time_hrs: status === 'done' ? resHrs : null,
    sla_target_hrs: slaTgt,
    sla_met: status === 'done' ? resHrs <= slaTgt : null,
    period_tag: '2026-05',
    notes: '',
  }
})

export const isMockMode = () =>
  !process.env.REACT_APP_SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL === 'https://placeholder.supabase.co'

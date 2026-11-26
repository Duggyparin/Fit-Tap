import { useState, type ReactNode } from 'react'
import portraits from './assets/member-portraits.png'

type Page =
  | 'Dashboard'
  | 'Check-ins'
  | 'Members'
  | 'Renewals'
  | 'Walk-ins'
  | 'Plans'
  | 'Reports'
  | 'Scanners'
  | 'Card orders'
  | 'Staff'
  | 'Settings'

const nav: { label: Page; icon: string; section?: boolean }[] = [
  { label: 'Dashboard', icon: 'grid' },
  { label: 'Check-ins', icon: 'tap' },
  { label: 'Members', icon: 'users' },
  { label: 'Renewals', icon: 'refresh' },
  { label: 'Walk-ins', icon: 'door' },
  { label: 'Plans', icon: 'card', section: true },
  { label: 'Reports', icon: 'chart' },
  { label: 'Scanners', icon: 'scanner' },
  { label: 'Card orders', icon: 'package' },
  { label: 'Staff', icon: 'staff', section: true },
  { label: 'Settings', icon: 'settings' },
]

const members = [
  { name: 'Juan Dela Cruz', initials: 'JD', phone: '0917 345 9821', plan: 'Monthly', end: 'Nov 25, 2026', days: 24, status: 'Active', card: 'FT-0824', photo: 1 },
  { name: 'Maria Santos', initials: 'MS', phone: '0928 114 6203', plan: 'Quarterly', end: 'Nov 8, 2026', days: 7, status: 'Expiring', card: 'FT-0471', photo: 0 },
  { name: 'Paolo Reyes', initials: 'PR', phone: '0915 720 4486', plan: 'Monthly', end: 'Oct 31, 2026', days: 0, status: 'Expired', card: 'FT-0918', photo: 3 },
  { name: 'Angela Garcia', initials: 'AG', phone: '0998 361 0274', plan: 'Student monthly', end: 'Dec 14, 2026', days: 43, status: 'Active', card: 'FT-0612', photo: 2 },
  { name: 'Miguel Mendoza', initials: 'MM', phone: '0916 882 1940', plan: 'Annual', end: 'Aug 19, 2027', days: 291, status: 'Active', card: 'FT-1036', photo: 1 },
]

const checkins = [
  { name: 'Juan Dela Cruz', time: '3:42 PM', result: 'Allowed', source: 'Front door', photo: 1 },
  { name: 'Maria Santos', time: '3:36 PM', result: 'Allowed', source: 'Front door', photo: 0 },
  { name: 'Paolo Reyes', time: '3:28 PM', result: 'Expired', source: 'Front door', photo: 3 },
  { name: 'Unknown card', time: '3:22 PM', result: 'Unknown', source: 'Front door', photo: -1 },
  { name: 'Angela Garcia', time: '3:15 PM', result: 'Manual', source: 'Front desk', photo: 2 },
]

function Icon({ name, size = 19 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    tap: <><path d="M8 11V7a2 2 0 0 1 4 0v4"/><path d="M12 10V5.5a2 2 0 0 1 4 0V12"/><path d="M16 10a2 2 0 0 1 4 0v4c0 4-2.5 7-7 7h-1.5a6 6 0 0 1-4.8-2.4L3 14a2 2 0 0 1 3-2.6l2 2.1"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    refresh: <><path d="M20 7h-5V2"/><path d="M20 7a9 9 0 1 0 1 8"/></>,
    door: <><path d="M4 21h16M6 21V3h11v18M13 12h.01"/></>,
    card: <><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    scanner: <><path d="M5 7V4h3M16 4h3v3M19 17v3h-3M8 20H5v-3"/><path d="M8 9c2.5-2 5.5-2 8 0M10 12c1.2-1 2.8-1 4 0M12 15h.01"/></>,
    package: <><path d="m12 3 8 4-8 4-8-4 8-4Z"/><path d="m4 7v10l8 4 8-4V7M12 11v10"/></>,
    staff: <><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M19 8v6M22 11h-6"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1V3h4v.09a1.7 1.7 0 0 0 1 1.51 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.12.38.34.72.64.99.3.27.68.41 1.08.41H21v4h-.09a1.7 1.7 0 0 0-1.51 1Z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></>,
    filter: <><path d="M4 6h16M7 12h10M10 18h4"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    wifi: <><path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20h.01"/></>,
    camera: <><path d="M14.5 5 13 3h-2L9.5 5H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4.5Z"/><circle cx="12" cy="13" r="4"/></>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[name]}</svg>
}

function Avatar({ photo, size = 42, className = '' }: { photo: number; size?: number; className?: string }) {
  if (photo < 0) return <div className={`avatar unknown ${className}`} style={{ width: size, height: size }}><Icon name="card" size={size * .42}/></div>
  return <div className={`avatar ${className}`} style={{ width: size, height: size, backgroundImage: `url(${portraits})`, backgroundSize: '200% 200%', backgroundPosition: `${photo % 2 ? 100 : 0}% ${photo > 1 ? 100 : 0}%` }} />
}

function Status({ value }: { value: string }) {
  const type = ['Allowed', 'Active', 'Online'].includes(value) ? 'good' : ['Expired', 'Denied', 'Offline'].includes(value) ? 'bad' : ['Expiring', 'Expiring soon'].includes(value) ? 'warn' : 'neutral'
  return <span className={`status ${type}`}><span className="status-icon">{type === 'good' ? '✓' : type === 'bad' ? '×' : type === 'warn' ? '!' : '•'}</span>{value}</span>
}

function Button({ children, secondary = false, small = false, onClick }: { children: ReactNode; secondary?: boolean; small?: boolean; onClick?: () => void }) {
  return <button className={`button ${secondary ? 'secondary' : ''} ${small ? 'small' : ''}`} onClick={onClick}>{children}</button>
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>
}

function Header({ page, onAdd }: { page: Page; onAdd: () => void }) {
  const actions: Partial<Record<Page, ReactNode>> = {
    'Members': <><Button secondary><Icon name="download" size={16}/>Export CSV</Button><Button onClick={onAdd}><Icon name="plus" size={17}/>Add member</Button></>,
    'Check-ins': <Button onClick={onAdd}><Icon name="plus" size={17}/>Manual check-in</Button>,
    'Walk-ins': <Button secondary><Icon name="download" size={16}/>Export</Button>,
    'Reports': <Button><Icon name="download" size={16}/>Export report</Button>,
    'Plans': <Button onClick={onAdd}><Icon name="plus" size={17}/>Add plan</Button>,
    'Scanners': <Button onClick={onAdd}><Icon name="plus" size={17}/>Add scanner</Button>,
  }
  const subtitles: Partial<Record<Page, string>> = {
    Dashboard: 'Here’s what’s happening at your gym today.',
    'Check-ins': 'Watch member entry and manage check-in history.',
    Members: 'Manage your gym members and their access cards.',
    Renewals: 'Renew memberships and record payments.',
    'Walk-ins': 'Record and track today’s single-visit guests.',
    Plans: 'Manage membership durations and pricing.',
    Reports: 'Understand income, attendance, and member trends.',
    Scanners: 'Monitor the scanner boxes connected to your gym.',
  }
  return <div className="page-heading"><div><h1>{page}</h1><p>{subtitles[page] || `Manage your gym’s ${page.toLowerCase()}.`}</p></div><div className="heading-actions">{actions[page]}</div></div>
}

function Kpi({ title, value, note, icon, tone = '' }: { title: string; value: string; note: string; icon: string; tone?: string }) {
  return <Card className="kpi"><div className={`kpi-icon ${tone}`}><Icon name={icon}/></div><div className="kpi-copy"><span>{title}</span><strong>{value}</strong><small>{note}</small></div></Card>
}

function Dashboard({ navigate }: { navigate: (p: Page) => void }) {
  const bars = [35, 52, 28, 46, 64, 83, 76, 54, 62, 92, 70, 48]
  return <div>
    <Header page="Dashboard" onAdd={() => {}}/>
    <div className="kpi-grid">
      <Kpi title="Today's check-ins" value="47" note="↑ 12% from yesterday" icon="tap"/>
      <Kpi title="Active members" value="328" note="8 joined this month" icon="users"/>
      <Kpi title="Expiring this week" value="12" note="Needs your attention" icon="calendar" tone="amber"/>
      <Kpi title="This month's income" value="₱84,650" note="↑ 8.4% vs last month" icon="chart"/>
    </div>
    <div className="dashboard-grid">
      <Card className="live-panel">
        <div className="card-head"><div><span className="live-dot"/>LIVE CHECK-IN</div><button onClick={() => navigate('Check-ins')}>View all <Icon name="chevron" size={15}/></button></div>
        <div className="latest-checkin">
          <Avatar photo={1} size={92}/>
          <div className="latest-copy"><Status value="Allowed"/><h2>Juan Dela Cruz</h2><p>Monthly membership · 24 days left</p><span>Today, 3:42 PM · Front door</span></div>
          <div className="allowed-mark">✓</div>
        </div>
        <div className="mini-feed">
          {checkins.slice(1, 4).map((c) => <div className="feed-row" key={c.time}><Avatar photo={c.photo}/><div><strong>{c.name}</strong><span>{c.time} · {c.source}</span></div><Status value={c.result}/></div>)}
        </div>
      </Card>
      <Card className="expiring-panel">
        <div className="card-head"><div>EXPIRING SOON</div><button onClick={() => navigate('Renewals')}>View all <Icon name="chevron" size={15}/></button></div>
        {[
          ['Maria Santos', 0, 'Nov 8, 2026', '7 days'],
          ['Carlo Aquino', 3, 'Nov 10, 2026', '9 days'],
          ['Nina Bautista', 2, 'Nov 11, 2026', '10 days'],
          ['Jose Villanueva', 1, 'Nov 12, 2026', '11 days'],
        ].map(([name, photo, date, days]) => <div className="expire-row" key={name as string}><Avatar photo={photo as number}/><div><strong>{name}</strong><span>{date} · {days}</span></div><Button small secondary>Renew</Button></div>)}
      </Card>
      <Card className="chart-panel">
        <div className="card-head"><div>CHECK-INS BY HOUR</div><span>Today · 47 total</span></div>
        <div className="bar-chart">
          <div className="y-labels"><span>10</span><span>5</span><span>0</span></div>
          <div className="bars">{bars.map((b, i) => <div className="bar-wrap" key={i}><div className="bar" style={{height: `${b}%`}}/><span>{i % 2 === 0 ? `${i + 6}${i < 6 ? 'a' : 'p'}` : ''}</span></div>)}</div>
        </div>
      </Card>
      <Card className="scanner-card">
        <div className="card-head"><div>SCANNER STATUS</div><button onClick={() => navigate('Scanners')}>Manage <Icon name="chevron" size={15}/></button></div>
        <div className="scanner-main"><div className="scanner-icon"><Icon name="scanner" size={25}/><span/></div><div><strong>Front door</strong><p><Status value="Online"/> <span className="last-seen">Last seen 1 min ago</span></p></div></div>
        <div className="scanner-foot"><span>Firmware v2.4.1</span><span><Icon name="wifi" size={15}/> Strong signal</span></div>
      </Card>
    </div>
  </div>
}

function Checkins() {
  return <div><Header page="Check-ins" onAdd={() => alert('Manual check-in ready')}/>
    <div className="checkins-layout">
      <Card className="big-live"><div className="card-head"><div><span className="live-dot"/>LIVE FEED</div><span>Listening for taps…</span></div>
        <div className="hero-check"><div className="hero-photo"><Avatar photo={1} size={174}/><div className="hero-ok">✓</div></div><Status value="Allowed"/><h2>Juan Dela Cruz</h2><p>Monthly member · Valid until Nov 25, 2026</p><strong>3:42 PM</strong><span>Front door scanner</span></div>
        <div className="previous"><span>PREVIOUS</span>{checkins.slice(1,4).map(c=><div className="feed-row" key={c.time}><Avatar photo={c.photo}/><div><strong>{c.name}</strong><span>{c.time}</span></div><Status value={c.result}/></div>)}</div>
      </Card>
      <Card className="history-card"><div className="history-title"><div><h3>Check-in history</h3><p>Nov 1, 2026</p></div><button className="icon-button"><Icon name="filter"/></button></div>
        <div className="table-search"><Icon name="search" size={17}/><input placeholder="Search member…"/></div>
        <table><thead><tr><th>Member</th><th>Result</th><th>Source</th></tr></thead><tbody>{checkins.map(c=><tr key={c.time}><td><div className="person-cell"><Avatar photo={c.photo} size={36}/><div><strong>{c.name}</strong><span>{c.time}</span></div></div></td><td><Status value={c.result}/></td><td>{c.source}</td></tr>)}</tbody></table>
      </Card>
    </div>
  </div>
}

function Members({ onAdd, onProfile }: { onAdd: () => void; onProfile: (m: typeof members[0]) => void }) {
  return <div><Header page="Members" onAdd={onAdd}/>
    <Card className="table-card">
      <div className="table-tools"><div className="table-search wide"><Icon name="search" size={18}/><input placeholder="Search by name, phone, or card number"/></div><button className="select-button">All statuses <span>⌄</span></button><button className="select-button">All plans <span>⌄</span></button><button className="select-button"><Icon name="filter" size={16}/>More filters</button></div>
      <table className="member-table"><thead><tr><th>MEMBER</th><th>PHONE</th><th>PLAN</th><th>END DATE</th><th>DAYS LEFT</th><th>STATUS</th><th>CARD NUMBER</th><th></th></tr></thead>
        <tbody>{members.map(m=><tr key={m.name} onClick={()=>onProfile(m)}><td><div className="person-cell"><Avatar photo={m.photo}/><strong>{m.name}</strong></div></td><td>{m.phone}</td><td>{m.plan}</td><td>{m.end}</td><td><strong className={m.days <= 7 ? 'danger-text' : ''}>{m.days}</strong></td><td><Status value={m.status}/></td><td><span className="card-number">{m.card}</span></td><td><button className="plain-icon"><Icon name="more"/></button></td></tr>)}</tbody>
      </table>
      <div className="pagination"><span>Showing 1–5 of 328 members</span><div><button disabled>Previous</button><button className="active">1</button><button>2</button><button>3</button><button>Next</button></div></div>
    </Card>
  </div>
}

function Renewals() {
  const plans = [['Daily','1 day','₱100'],['Weekly','7 days','₱450'],['Monthly','30 days','₱1,200'],['Quarterly','90 days','₱3,200'],['Annual','365 days','₱11,500'],['Student monthly','30 days','₱950']]
  const [selected, setSelected] = useState(2)
  return <div><Header page="Renewals" onAdd={()=>{}}/><div className="renew-layout">
    <Card><div className="form-section"><span className="step">1</span><div><h3>Choose a member</h3><p>Search by name, phone, or card number</p></div></div><div className="member-choice"><Avatar photo={0} size={52}/><div><strong>Maria Santos</strong><span>Quarterly · Expires Nov 8, 2026</span></div><button>Change</button></div>
      <div className="form-section plan-step"><span className="step">2</span><div><h3>Select a plan</h3><p>Choose the new membership period</p></div></div><div className="plan-grid">{plans.map((p,i)=><button className={`plan-option ${selected===i?'selected':''}`} key={p[0]} onClick={()=>setSelected(i)}><span>{p[0]}</span><small>{p[1]}</small><strong>{p[2]}</strong>{selected===i&&<b>✓</b>}</button>)}</div>
    </Card>
    <Card className="renew-summary"><h3>Renewal summary</h3><div className="summary-member"><Avatar photo={0}/><div><strong>Maria Santos</strong><span>FT-0471</span></div></div><dl><div><dt>Current end date</dt><dd>Nov 8, 2026</dd></div><div><dt>New plan</dt><dd>{plans[selected][0]}</dd></div><div><dt>New end date</dt><dd className="blue-text">Dec 8, 2026</dd></div></dl><label>Payment method</label><div className="payment-options"><button className="selected">Cash</button><button>GCash</button><button>Maya</button></div><div className="total"><span>Total</span><strong>{plans[selected][2]}</strong></div><Button>Confirm renewal</Button></Card>
  </div></div>
}

function Walkins() {
  return <div><Header page="Walk-ins" onAdd={()=>{}}/><div className="walkin-layout"><Card className="walkin-form"><div className="card-head"><div>RECORD A WALK-IN</div></div><label>Guest name <span>Optional</span></label><input className="field" placeholder="Enter guest name"/><label>Amount</label><div className="money-field"><span>₱</span><input defaultValue="100"/></div><label>Payment method</label><div className="payment-options"><button className="selected">Cash</button><button>GCash</button><button>Maya</button></div><div className="auto-time"><Icon name="calendar"/><div><span>Time recorded automatically</span><strong>Today, 3:46 PM</strong></div></div><Button><Icon name="plus" size={17}/>Record walk-in</Button></Card>
    <Card className="walkin-table"><div className="walkin-total"><div><span>TODAY'S WALK-INS</span><strong>18 guests</strong></div><div><span>TOTAL COLLECTED</span><strong>₱1,800</strong></div></div><table><thead><tr><th>TIME</th><th>GUEST</th><th>PAYMENT</th><th>AMOUNT</th></tr></thead><tbody>{[['3:31 PM','Walk-in guest','Cash'],['2:48 PM','Rico Navarro','GCash'],['1:22 PM','Walk-in guest','Cash'],['12:57 PM','Lea Cruz','Maya'],['11:40 AM','Benjie Lim','Cash']].map(r=><tr key={r[0]}><td>{r[0]}</td><td><strong>{r[1]}</strong></td><td>{r[2]}</td><td><strong>₱100</strong></td></tr>)}</tbody></table></Card></div></div>
}

function Plans() {
  const rows=[['Daily','1 day','₱100'],['Weekly','7 days','₱450'],['Monthly','30 days','₱1,200'],['Quarterly','90 days','₱3,200'],['Annual','365 days','₱11,500'],['Student monthly','30 days','₱950']]
  return <div><Header page="Plans" onAdd={()=>alert('New plan')}/><Card className="table-card"><table className="member-table"><thead><tr><th>PLAN NAME</th><th>DURATION</th><th>PRICE</th><th>MEMBERS</th><th>ACTIVE</th><th></th></tr></thead><tbody>{rows.map((r,i)=><tr key={r[0]}><td><strong>{r[0]}</strong></td><td>{r[1]}</td><td><strong>{r[2]}</strong></td><td>{[24,18,164,72,31,19][i]}</td><td><span className="toggle on"><i/></span></td><td><button className="plain-icon"><Icon name="more"/></button></td></tr>)}</tbody></table></Card></div>
}

function Reports() {
  const values=[48,65,54,78,62,86,70,91,76,82,95,88,72,98]
  return <div><Header page="Reports" onAdd={()=>{}}/><div className="report-tools"><button className="select-button"><Icon name="calendar" size={17}/>Nov 1 – Nov 30, 2026</button><button className="select-button">This month <span>⌄</span></button></div><div className="report-kpis"><Kpi title="Total income" value="₱84,650" note="↑ 8.4% from last month" icon="chart"/><Kpi title="Membership income" value="₱78,200" note="92.4% of income" icon="card"/><Kpi title="Walk-in income" value="₱6,450" note="65 guest visits" icon="door"/></div><div className="reports-grid"><Card className="income-chart"><div className="chart-title"><div><h3>Income overview</h3><p>Memberships and walk-ins</p></div><div className="legend"><span><i/>Memberships</span><span><i/>Walk-ins</span></div></div><div className="line-chart"><svg viewBox="0 0 600 210" preserveAspectRatio="none"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2563eb" stopOpacity=".18"/><stop offset="1" stopColor="#2563eb" stopOpacity="0"/></linearGradient></defs><path className="area" d={`M0 170 ${values.map((v,i)=>`L${i*(600/(values.length-1))} ${200-v*1.7}`).join(' ')} L600 210 L0 210Z`}/><polyline points={values.map((v,i)=>`${i*(600/(values.length-1))},${200-v*1.7}`).join(' ')} /></svg><div className="x-axis"><span>Nov 1</span><span>Nov 8</span><span>Nov 15</span><span>Nov 22</span><span>Nov 30</span></div></div></Card><Card className="peak-card"><div className="chart-title"><div><h3>Peak hours</h3><p>Average check-ins by hour</p></div></div>{[['5–6 PM',92],['6–7 PM',81],['7–8 AM',64],['4–5 PM',52],['8–9 AM',38]].map(r=><div className="peak-row" key={r[0]}><span>{r[0]}</span><div><i style={{width:`${r[1]}%`}}/></div><strong>{r[1]}</strong></div>)}</Card></div></div>
}

function Scanners() {
  return <div><Header page="Scanners" onAdd={()=>alert('Add scanner')}/><div className="scanner-list">{[['Front door','Online','1 min ago','v2.4.1'],['Side entrance','Online','3 min ago','v2.4.1'],['Studio floor','Offline','2 hours ago','v2.3.8']].map((s,i)=><Card className="scanner-row" key={s[0]}><div className={`device ${i===2?'off':''}`}><Icon name="scanner" size={28}/></div><div className="device-info"><strong>{s[0]}</strong><span>FitTap Scanner · FT-SCN-00{i+1}</span></div><Status value={s[1]}/><div><span>LAST SEEN</span><strong>{s[2]}</strong></div><div><span>FIRMWARE</span><strong>{s[3]}</strong></div><Button secondary small>Manage</Button></Card>)}</div></div>
}

function ComingSoon({ page }: { page: Page }) {
  return <div><Header page={page} onAdd={()=>{}}/><Card className="empty-state"><div><Icon name={page==='Settings'?'settings':page==='Staff'?'staff':'package'} size={34}/></div><h2>{page} workspace</h2><p>This area is ready for your gym’s {page.toLowerCase()} data.</p><Button>Get started</Button></Card></div>
}

function MemberProfile({ member, back, link }: { member: typeof members[0]; back: ()=>void; link: ()=>void }) {
  return <div><button className="back-button" onClick={back}>← Back to members</button><div className="page-heading"><div><h1>Member profile</h1><p>View membership details and activity.</p></div><div className="heading-actions"><Button secondary onClick={link}>Link card</Button><Button>Renew membership</Button></div></div><div className="profile-layout"><Card className="profile-card"><Avatar photo={member.photo} size={112}/><h2>{member.name}</h2><Status value={member.status}/><div className="profile-details"><div><span>Phone</span><strong>{member.phone}</strong></div><div><span>Email</span><strong>juan.delacruz@email.com</strong></div><div><span>Member since</span><strong>Jun 12, 2024</strong></div></div><div className="linked-card"><div><Icon name="card"/><span>LINKED NFC CARD</span></div><strong>{member.card}</strong><small>Linked Jun 12, 2024</small></div><div className="profile-actions"><Button secondary>Replace card</Button><button>Disable card</button></div></Card><div className="profile-right"><Card><div className="card-head"><div>CURRENT MEMBERSHIP</div></div><div className="membership-hero"><div><span>{member.plan}</span><strong>{member.days} days left</strong></div><div><span>Start date</span><strong>Oct 26, 2026</strong></div><div><span>End date</span><strong>{member.end}</strong></div></div></Card><Card><div className="tabs"><button className="active">Check-ins</button><button>Membership history</button><button>Payments</button></div>{checkins.slice(0,4).map((c,i)=><div className="activity-row" key={i}><div className="activity-icon"><Icon name="tap" size={17}/></div><div><strong>{i===0?'Today':`Oct ${31-i}, 2026`}</strong><span>{c.time} · Front door</span></div><Status value="Allowed"/></div>)}</Card></div></div></div>
}

function Modal({ type, close }: { type: 'add'|'link'; close: ()=>void }) {
  return <div className="modal-backdrop" onMouseDown={close}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><h2>{type==='add'?'Add new member':'Link an NFC card'}</h2><p>{type==='add'?'Create a profile and membership.':'Connect a card to Juan Dela Cruz.'}</p></div><button onClick={close}>×</button></div>{type==='add'?<div className="modal-body add-form"><div className="capture"><div className="camera-box"><Icon name="camera" size={30}/></div><div><strong>Member photo <b>Required</b></strong><span>Take a clear, front-facing photo.</span><Button secondary small><Icon name="camera" size={15}/>Open camera</Button></div></div><div className="two-fields"><label>Full name<input className="field" placeholder="e.g. Juan Dela Cruz"/></label><label>Phone number<input className="field" placeholder="09XX XXX XXXX"/></label></div><label>Email address <span>Optional</span><input className="field" placeholder="name@email.com"/></label><div className="two-fields"><label>Membership plan<select className="field"><option>Monthly · ₱1,200</option></select></label><label>Payment method<select className="field"><option>Cash</option><option>GCash</option><option>Maya</option></select></label></div><label className="consent"><input type="checkbox"/>I confirm that the member has consented to their photo and personal data being stored for gym access.</label></div>:<div className="modal-body link-body"><div className="tabs"><button className="active">Tap on scanner</button><button>Recent unknown taps</button><button>Card number</button></div><div className="nfc-pulse"><div><Icon name="tap" size={36}/></div><span/><i/></div><h3>Tap the card on the scanner now</h3><p>Waiting for a card on <strong>Front door</strong></p><div className="countdown"><span style={{width:'72%'}}/><b>43 seconds remaining</b></div></div>}<div className="modal-foot"><Button secondary onClick={close}>Cancel</Button>{type==='add'&&<Button>Add member</Button>}</div></div></div>
}

export default function App() {
  const [page, setPage] = useState<Page>('Dashboard')
  const [profile, setProfile] = useState<typeof members[0] | null>(null)
  const [modal, setModal] = useState<'add'|'link'|null>(null)
  const [offline, setOffline] = useState(false)
  const render = () => {
    if (profile) return <MemberProfile member={profile} back={()=>setProfile(null)} link={()=>setModal('link')}/>
    if (page==='Dashboard') return <Dashboard navigate={setPage}/>
    if (page==='Check-ins') return <Checkins/>
    if (page==='Members') return <Members onAdd={()=>setModal('add')} onProfile={setProfile}/>
    if (page==='Renewals') return <Renewals/>
    if (page==='Walk-ins') return <Walkins/>
    if (page==='Plans') return <Plans/>
    if (page==='Reports') return <Reports/>
    if (page==='Scanners') return <Scanners/>
    return <ComingSoon page={page}/>
  }
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><span/><i/></div><span>FitTap</span></div>
      <div className="gym-mini"><div className="gym-logo">MF</div><div><strong>Momentum Fitness</strong><span>Quezon City</span></div><button>⌄</button></div>
      <nav>{nav.map(item=><div key={item.label} className={item.section?'nav-section':''}><button className={page===item.label&&!profile?'active':''} onClick={()=>{setPage(item.label);setProfile(null)}}><Icon name={item.icon}/><span>{item.label}</span>{item.label==='Renewals'&&<b>12</b>}</button></div>)}</nav>
      <div className="support"><Icon name="wifi"/><div><strong>Need help?</strong><span>View support guides</span></div></div>
    </aside>
    <div className="app-main">
      {offline&&<div className="offline"><strong>No internet</strong><span>Changes will not be saved until you’re back online.</span><button onClick={()=>setOffline(false)}>×</button></div>}
      <header className="topbar"><div className="global-search"><Icon name="search"/><input placeholder="Search members by name, phone, or card…"/><kbd>⌘ K</kbd></div><div className="top-actions"><button className="icon-button" onClick={()=>setOffline(v=>!v)}><Icon name="bell"/><span/></button><div className="user"><div>RL</div><p><strong>Ramon Lim</strong><span>Owner</span></p><button>⌄</button></div></div></header>
      <main>{render()}</main>
    </div>
    {modal&&<Modal type={modal} close={()=>setModal(null)}/>}
  </div>
}

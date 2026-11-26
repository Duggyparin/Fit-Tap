import { useEffect, useState, type ReactNode } from 'react';

type Page =
  | 'checkins'
  | 'members'
  | 'renew'
  | 'walkin'
  | 'more'
  | 'profile'
  | 'register'
  | 'link'
  | 'waiting'
  | 'recent'
  | 'reports'
  | 'login';

type IconName =
  | 'tap'
  | 'users'
  | 'refresh'
  | 'walk'
  | 'more'
  | 'search'
  | 'plus'
  | 'arrow'
  | 'back'
  | 'check'
  | 'clock'
  | 'warning'
  | 'card'
  | 'phone'
  | 'calendar'
  | 'camera'
  | 'scanner'
  | 'edit'
  | 'report'
  | 'settings'
  | 'logout'
  | 'wifi'
  | 'bell'
  | 'chevron'
  | 'peso'
  | 'shield';

const iconPaths: Record<IconName, ReactNode> = {
  tap: <><path d="M8 11V7a2 2 0 0 1 4 0v4"/><path d="M12 11V5a2 2 0 0 1 4 0v6"/><path d="M16 11V8a2 2 0 0 1 4 0v5c0 5-3 8-8 8h-1c-3 0-5-2-6-4l-2-4a2 2 0 0 1 3-2l2 2"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  refresh: <><path d="M20 6v5h-5"/><path d="M4 18v-5h5"/><path d="M18.5 9a7 7 0 0 0-12-2.5L4 11M20 13l-2.5 4.5a7 7 0 0 1-12-2.5"/></>,
  walk: <><circle cx="13" cy="4" r="2"/><path d="m7 21 3-7 2 2 2 5M8 12l2-5 4 2 3 3M14 9l2-2"/></>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  arrow: <path d="m9 18 6-6-6-6"/>,
  back: <path d="m15 18-6-6 6-6"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  warning: <><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v4M12 17h.01"/></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></>,
  phone: <path d="M7 3h3l1 5-2 1a15 15 0 0 0 6 6l1-2 5 1v3a4 4 0 0 1-4 4C9 20 4 15 3 7a4 4 0 0 1 4-4Z"/>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  camera: <><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="4"/><path d="m8 6 1.5-2h5L16 6"/></>,
  scanner: <><path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2"/><path d="M8 8a6 6 0 0 1 0 8M12 9a4 4 0 0 1 0 6M16 10a2 2 0 0 1 0 4"/></>,
  edit: <><path d="m4 16-1 5 5-1L19 9l-4-4L4 16Z"/><path d="m13 7 4 4"/></>,
  report: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></>,
  wifi: <><path d="M5 12.5a10 10 0 0 1 14 0M8 16a6 6 0 0 1 8 0"/><circle cx="12" cy="20" r="1"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  peso: <><path d="M7 20V4h6a5 5 0 0 1 0 10H7M5 8h11M5 11h11"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
};

function Icon({ name, size = 22, className = '' }: { name: IconName; size?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

const portraits = ['0% 0%', '100% 0%', '0% 100%', '100% 100%'];
function Avatar({ index = 0, size = 'md' }: { index?: number; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = { sm: 'h-10 w-10', md: 'h-13 w-13', lg: 'h-16 w-16', xl: 'h-24 w-24' };
  return <div className={`${sizes[size]} shrink-0 overflow-hidden rounded-full bg-slate-100 ring-2 ring-white`}><img src="/member-portraits.png" alt="" className="h-[200%] w-[200%] max-w-none object-cover" style={{ transform: `translate(${portraits[index].split(' ')[0] === '100%' ? '-50%' : '0'}, ${portraits[index].split(' ')[1] === '100%' ? '-50%' : '0'})` }} /></div>;
}

function Status({ type, children }: { type: 'green' | 'red' | 'amber' | 'slate'; children: ReactNode }) {
  const color = { green: 'status-green', red: 'status-red', amber: 'status-amber', slate: 'status-slate' }[type];
  return <span className={`status ${color}`}><span className="status-dot" />{children}</span>;
}

function Header({ title, subtitle, back, right, onBack }: { title: string; subtitle?: string; back?: boolean; right?: ReactNode; onBack?: () => void }) {
  return <header className="page-header">
    <div className="flex items-center gap-3">
      {back && <button className="icon-btn -ml-2" onClick={onBack} aria-label="Go back"><Icon name="back" /></button>}
      <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
    </div>
    {right}
  </header>;
}

const navItems: { id: Page; label: string; icon: IconName }[] = [
  { id: 'checkins', label: 'Check-ins', icon: 'tap' },
  { id: 'members', label: 'Members', icon: 'users' },
  { id: 'renew', label: 'Renew', icon: 'refresh' },
  { id: 'walkin', label: 'Walk-in', icon: 'walk' },
  { id: 'more', label: 'More', icon: 'more' },
];

function BottomNav({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  return <nav className="bottom-nav">{navItems.map(item => <button key={item.id} onClick={() => setPage(item.id)} className={page === item.id ? 'active' : ''}><Icon name={item.icon} size={21} /><span>{item.label}</span></button>)}</nav>;
}

const checkins = [
  { name: 'Juan Dela Cruz', time: '3:42 PM', status: 'Allowed', type: 'green' as const, avatar: 0 },
  { name: 'Maria Santos', time: '3:35 PM', status: 'Expired', type: 'red' as const, avatar: 1 },
  { name: 'Unknown card', time: '3:28 PM', status: 'Unknown card', type: 'slate' as const, avatar: -1 },
  { name: 'Paolo Reyes', time: '2:56 PM', status: 'Manual', type: 'slate' as const, avatar: 3 },
];

function CheckinsPage() {
  const [empty, setEmpty] = useState(false);
  return <div className="page">
    <Header title="Good afternoon" subtitle="Monday, Nov 16" right={<button className="icon-btn relative" aria-label="Notifications"><Icon name="bell" /><span className="notification-dot" /></button>} />
    <div className="brand-strip"><div className="logo-mark"><Icon name="tap" size={20} /></div><div><strong>FitTap</strong><span>Gym check-in and membership in one tap.</span></div></div>
    <section className="summary-card">
      <div><strong>28</strong><span>Check-ins<br />today</span></div>
      <div><strong>142</strong><span>Active<br />members</span></div>
      <div><strong className="text-amber-500">7</strong><span>Expiring<br />this week</span></div>
    </section>
    <button className="primary-btn w-full" onClick={() => alert('Manual check-in recorded')}><Icon name="plus" size={19} />Manual check-in</button>
    <div className="section-title"><div><span className="live-dot" />Live check-ins</div><button onClick={() => setEmpty(v => !v)}>{empty ? 'Show feed' : 'Clear'}</button></div>
    {empty ? <div className="empty-state"><div className="empty-icon"><Icon name="tap" size={28} /></div><h3>No check-ins yet</h3><p>New card taps will appear here in real time.</p></div> :
      <div className="feed">{checkins.map((item, i) => <div className="feed-item" key={item.time}>
        {item.avatar >= 0 ? <Avatar index={item.avatar} size="lg" /> : <div className="unknown-avatar"><Icon name="card" /></div>}
        <div className="min-w-0 flex-1"><strong>{item.name}</strong><span>{item.time}</span></div>
        <Status type={item.type}>{item.status}</Status>
      </div>)}</div>}
  </div>;
}

const members = [
  { name: 'Juan Dela Cruz', plan: 'Monthly · Ends Dec 9', days: '23 days left', type: 'green' as const, avatar: 0 },
  { name: 'Maria Santos', plan: 'Student monthly · Ends Nov 20', days: '4 days left', type: 'amber' as const, avatar: 1 },
  { name: 'Paolo Reyes', plan: 'Quarterly · Ends Feb 15', days: '91 days left', type: 'green' as const, avatar: 3 },
  { name: 'Ana Villanueva', plan: 'Monthly · Ended Nov 12', days: 'Expired', type: 'red' as const, avatar: 2 },
];

function MembersPage({ go }: { go: (p: Page) => void }) {
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const shown = members.filter(m => m.name.toLowerCase().includes(query.toLowerCase()) && (filter === 'All' || (filter === 'Active' ? m.type === 'green' : filter === 'Expiring' ? m.type === 'amber' : m.type === 'red')));
  return <div className="page">
    <Header title="Members" subtitle="142 active members" right={<button className="icon-btn"><Icon name="more" /></button>} />
    <label className="search"><Icon name="search" size={20} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or phone" /></label>
    <div className="chips">{['All', 'Active', 'Expiring', 'Expired'].map(x => <button className={filter === x ? 'selected' : ''} onClick={() => setFilter(x)} key={x}>{x}{x !== 'All' && <span>{x === 'Active' ? 142 : x === 'Expiring' ? 7 : 18}</span>}</button>)}</div>
    <div className="member-list">{shown.map(member => <button className="member-card" key={member.name} onClick={() => go('profile')}><Avatar index={member.avatar} size="md" /><div className="flex-1 text-left"><strong>{member.name}</strong><span>{member.plan}</span></div><div className="flex flex-col items-end gap-2"><Status type={member.type}>{member.days}</Status><Icon name="chevron" size={16} className="text-slate-400" /></div></button>)}</div>
    <button className="fab" onClick={() => go('register')} aria-label="Register member"><Icon name="plus" size={27} /></button>
  </div>;
}

function ProfilePage({ go }: { go: (p: Page) => void }) {
  return <div className="page">
    <Header title="Member profile" back onBack={() => go('members')} right={<button className="icon-btn"><Icon name="edit" size={20} /></button>} />
    <section className="profile-hero"><Avatar index={0} size="xl" /><h2>Juan Dela Cruz</h2><p><Icon name="phone" size={15} />0917 123 4567</p><Status type="green">Active member</Status></section>
    <section className="info-card">
      <div><span>Current plan</span><strong>Monthly</strong></div><div><span>End date</span><strong>Dec 9, 2026</strong></div><div><span>Time remaining</span><strong className="text-green-600">23 days left</strong></div>
    </section>
    <button className="primary-btn w-full" onClick={() => go('renew')}><Icon name="refresh" size={18} />Renew membership</button>
    <section className="card-block">
      <div className="section-title mt-0"><div>Linked NFC card</div></div>
      <div className="linked-card"><div className="linked-card-icon"><Icon name="card" /></div><div><strong>FT-0482-1937</strong><span>Linked Aug 10, 2026</span></div><Status type="green">Active</Status></div>
      <div className="two-buttons"><button className="secondary-btn" onClick={() => go('link')}>Link card</button><button className="secondary-btn">Replace card</button></div>
    </section>
    <div className="section-title"><div>Check-in history</div><button>See all</button></div>
    <div className="history">{['Today, Nov 16|3:42 PM|Allowed', 'Nov 14, 2026|5:18 PM|Allowed', 'Nov 12, 2026|6:04 PM|Allowed'].map((x, i) => { const [d,t,s] = x.split('|'); return <div key={i}><span className="history-icon"><Icon name="check" size={14} /></span><div><strong>{d}</strong><span>{t} · Main entrance</span></div><Status type="green">{s}</Status></div>})}</div>
  </div>;
}

function Field({ label, placeholder, optional, type = 'text' }: { label: string; placeholder: string; optional?: boolean; type?: string }) {
  return <label className="field"><span>{label}{optional && <em>Optional</em>}</span><input type={type} placeholder={placeholder} /></label>;
}

function RegisterPage({ go }: { go: (p: Page) => void }) {
  const [plan, setPlan] = useState('Monthly');
  const [payment, setPayment] = useState('Cash');
  return <div className="page form-page">
    <Header title="Register member" subtitle="Add details and take a photo" back onBack={() => go('members')} />
    <div className="photo-capture"><div className="photo-preview"><Icon name="camera" size={30} /></div><div><strong>Member photo <b>Required</b></strong><span>Take a clear photo on the spot</span><button><Icon name="camera" size={17} />Open camera</button></div></div>
    <Field label="Full name" placeholder="e.g. Juan Dela Cruz" /><Field label="Phone number" placeholder="09XX XXX XXXX" /><Field label="Email address" placeholder="name@email.com" optional type="email" />
    <label className="field"><span>Membership plan</span><select value={plan} onChange={e => setPlan(e.target.value)}><option>Monthly</option><option>Weekly</option><option>Quarterly</option><option>Annual</option><option>Student monthly</option></select></label>
    <div className="field"><span>Payment method</span><div className="segmented">{['Cash','GCash','Maya'].map(x => <button className={payment === x ? 'selected' : ''} onClick={() => setPayment(x)} key={x}>{x}</button>)}</div></div>
    <label className="consent"><input type="checkbox" /><span>I have the member's consent to collect their photo and contact details for gym access.</span></label>
    <button className="primary-btn w-full" onClick={() => go('link')}>Save and link card<Icon name="arrow" size={18} /></button>
  </div>;
}

function LinkPage({ go }: { go: (p: Page) => void }) {
  const methods = [
    { icon: 'scanner' as IconName, title: 'Tap on scanner', copy: 'Ask the member to tap their card', badge: 'Recommended', page: 'waiting' as Page },
    { icon: 'clock' as IconName, title: 'Choose from recent taps', copy: 'Select an unknown card tap', page: 'recent' as Page },
    { icon: 'card' as IconName, title: 'Type card number', copy: 'Enter the number printed on the card', page: 'waiting' as Page },
  ];
  return <div className="page">
    <Header title="Link NFC card" subtitle="Juan Dela Cruz" back onBack={() => go('profile')} />
    <div className="step-label">How would you like to link the card?</div>
    <div className="method-list">{methods.map(m => <button key={m.title} onClick={() => go(m.page)}><span className="method-icon"><Icon name={m.icon} /></span><span><strong>{m.title}{m.badge && <em>{m.badge}</em>}</strong><small>{m.copy}</small></span><Icon name="chevron" size={18} /></button>)}</div>
    <div className="help-card"><Icon name="shield" /><div><strong>Secure card linking</strong><p>A card can only belong to one member and one gym at a time.</p></div></div>
  </div>;
}

function WaitingPage({ go }: { go: (p: Page) => void }) {
  const [seconds, setSeconds] = useState(60);
  const [result, setResult] = useState<'waiting' | 'success' | 'used' | 'other' | 'timeout'>('waiting');
  useEffect(() => {
    if (result !== 'waiting' || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds(s => s - 1), 1000);
    return () => window.clearInterval(timer);
  }, [result, seconds]);
  useEffect(() => { if (seconds === 0) setResult('timeout'); }, [seconds]);
  if (result === 'success') return <div className="page result-page"><Header title="Link NFC card" back onBack={() => go('profile')} /><div className="success-mark"><Icon name="check" size={46} /></div><h2>Card linked successfully</h2><p>Card <strong>FT-0482-1937</strong> is now linked to</p><div className="success-member"><Avatar index={0} /><strong>Juan Dela Cruz</strong></div><button className="primary-btn w-full" onClick={() => go('profile')}>Done</button></div>;
  if (result !== 'waiting') {
    const errors = { used: ['Card already in use', 'This card is linked to Maria Santos. Use a different card.'], other: ['Card belongs to another gym', 'This card cannot be linked at this gym.'], timeout: ['Time ran out', 'No card was detected within 60 seconds.'] };
    const [title, copy] = errors[result];
    return <div className="page result-page"><Header title="Link NFC card" back onBack={() => go('link')} /><div className="error-mark"><Icon name="warning" size={38} /></div><h2>{title}</h2><p>{copy}</p><button className="primary-btn w-full" onClick={() => { setSeconds(60); setResult('waiting'); }}>Try again</button><button className="text-btn" onClick={() => go('link')}>Choose another method</button></div>;
  }
  return <div className="page waiting-page">
    <Header title="Link NFC card" back onBack={() => go('link')} />
    <div className="nfc-pulse"><Icon name="scanner" size={54} /></div>
    <h2>Tap the card on the scanner now</h2><p>Use the scanner at the main entrance.<br />Keep this screen open.</p>
    <div className="count-ring" style={{ '--progress': `${seconds * 6}deg` } as React.CSSProperties}><div><strong>{seconds}</strong><span>seconds</span></div></div>
    <div className="scanner-online"><span /><Icon name="scanner" size={18} />Main entrance scanner · Online</div>
    <button className="primary-btn w-full" onClick={() => setResult('success')}>Simulate successful tap</button>
    <div className="demo-errors"><button onClick={() => setResult('used')}>Card in use</button><button onClick={() => setResult('other')}>Other gym</button></div>
    <button className="text-btn" onClick={() => go('link')}>Cancel</button>
  </div>;
}

function RecentPage({ go }: { go: (p: Page) => void }) {
  const taps = ['3:42 PM|Main entrance scanner|4 minutes ago', '3:18 PM|Front desk scanner|28 minutes ago', '2:51 PM|Main entrance scanner|55 minutes ago'];
  return <div className="page"><Header title="Recent unknown taps" subtitle="Select the card to assign to Juan" back onBack={() => go('link')} /><div className="notice"><Icon name="clock" size={18} />Showing unknown cards tapped in the last hour</div><div className="method-list recent-list">{taps.map((x,i) => {const [time, scanner, ago] = x.split('|'); return <button key={time} onClick={() => go('waiting')}><span className="method-icon"><Icon name="card" /></span><span><strong>Unknown card tapped at {time}</strong><small>{scanner} · {ago}</small></span><Icon name="chevron" size={18} /></button>})}</div></div>;
}

const plans = [
  ['Daily','₱80'], ['Weekly','₱350'], ['Monthly','₱900'], ['Quarterly','₱2,400'], ['Annual','₱8,500'], ['Student monthly','₱750'],
];
function RenewPage() {
  const [selected, setSelected] = useState('Monthly');
  const [payment, setPayment] = useState('GCash');
  return <div className="page form-page">
    <Header title="Renew membership" subtitle="Extend a member’s access" />
    <label className="search"><Icon name="search" size={20} /><input placeholder="Search member" defaultValue="Juan Dela Cruz" /></label>
    <div className="selected-member"><Avatar index={0} size="sm" /><div><strong>Juan Dela Cruz</strong><span>Monthly · Ends Dec 9, 2026</span></div><Icon name="check" className="text-green-600" /></div>
    <div className="field"><span>Choose a plan</span><div className="plan-grid">{plans.map(([name,price]) => <button className={selected === name ? 'selected' : ''} onClick={() => setSelected(name)} key={name}><span>{name}</span><strong>{price}</strong></button>)}</div></div>
    <div className="date-preview"><span>New membership end date</span><strong>Jan 9, 2027</strong><small>30 days will be added after the current plan ends</small></div>
    <div className="field"><span>Payment method</span><div className="segmented">{['Cash','GCash','Maya'].map(x => <button className={payment === x ? 'selected' : ''} onClick={() => setPayment(x)} key={x}>{x}</button>)}</div></div>
    {payment !== 'Cash' && <Field label="Reference number" placeholder="Enter transaction reference" />}
    <button className="primary-btn w-full" onClick={() => alert('Membership renewed')}>Confirm renewal · {plans.find(x => x[0] === selected)?.[1]}</button>
  </div>;
}

function WalkinPage() {
  const [payment, setPayment] = useState('Cash');
  return <div className="page form-page">
    <Header title="Walk-in" subtitle="Record a one-time gym visit" />
    <Field label="Guest name" placeholder="Enter name" optional />
    <label className="field amount-field"><span>Amount</span><div><b>₱</b><input defaultValue="80" inputMode="decimal" /></div></label>
    <div className="field"><span>Payment method</span><div className="segmented">{['Cash','GCash','Maya'].map(x => <button className={payment === x ? 'selected' : ''} onClick={() => setPayment(x)} key={x}>{x}</button>)}</div></div>
    <div className="auto-time"><div><span>Time of visit</span><strong>3:48 PM</strong></div><span>Set automatically</span></div>
    <button className="primary-btn w-full" onClick={() => alert('Walk-in recorded')}>Record walk-in</button>
    <div className="section-title"><div>Today’s walk-ins <span className="count-pill">5</span></div><strong>₱400 total</strong></div>
    <div className="history">{[['Guest','2:34 PM','Cash'],['Ramon Garcia','12:20 PM','GCash'],['Guest','9:12 AM','Cash']].map((x,i) => <div key={i}><span className="walk-icon"><Icon name="walk" size={18} /></span><div><strong>{x[0]}</strong><span>{x[1]} · {x[2]}</span></div><strong>₱80</strong></div>)}</div>
  </div>;
}

function MorePage({ go, offline, setOffline }: { go: (p: Page) => void; offline: boolean; setOffline: (x: boolean) => void }) {
  const groups = [
    [{ icon:'report' as IconName, title:'Reports', copy:'Attendance and income', page:'reports' as Page },{ icon:'peso' as IconName, title:'Plans and prices', copy:'Manage membership options' },{ icon:'scanner' as IconName, title:'Scanners', copy:'1 online · 1 offline', status:true }],
    [{ icon:'users' as IconName, title:'Staff accounts', copy:'2 team members' },{ icon:'card' as IconName, title:'Card orders', copy:'Order and track NFC cards' },{ icon:'settings' as IconName, title:'Settings', copy:'Gym details and preferences' }],
  ];
  return <div className="page"><Header title="More" subtitle="Manage your gym" /><div className="gym-card"><div className="gym-logo">PF</div><div><strong>Poblacion Fitness</strong><span>Makati City · Owner account</span></div><Icon name="chevron" size={18} /></div>
    {groups.map((group,i) => <div className="menu-group" key={i}>{group.map(item => <button key={item.title} onClick={() => item.page && go(item.page)}><span className="menu-icon"><Icon name={item.icon} /></span><span><strong>{item.title}</strong><small>{item.copy}</small></span>{item.status && <span className="scanner-dots"><i /><i /></span>}<Icon name="chevron" size={18} /></button>)}</div>)}
    <label className="offline-toggle"><span><Icon name="wifi" /><span><strong>Preview offline banner</strong><small>Show how the app behaves offline</small></span></span><input type="checkbox" checked={offline} onChange={e => setOffline(e.target.checked)} /></label>
    <button className="logout-btn" onClick={() => go('login')}><Icon name="logout" />Log out</button><p className="version">FitTap v1.0.0</p>
  </div>;
}

function ReportsPage({ go }: { go: (p: Page) => void }) {
  const [range, setRange] = useState('This month');
  return <div className="page"><Header title="Reports" subtitle="Attendance and earnings" back onBack={() => go('more')} /><div className="chips report-tabs">{['Today','This week','This month'].map(x => <button className={range === x ? 'selected' : ''} onClick={() => setRange(x)} key={x}>{x}</button>)}</div>
    <div className="report-metrics"><div><span className="metric-icon blue"><Icon name="tap" /></span><span>Check-ins<strong>{range === 'Today' ? '28' : range === 'This week' ? '184' : '746'}</strong><small>↑ 12% from last month</small></span></div><div><span className="metric-icon green"><Icon name="peso" /></span><span>Total income<strong>₱48,350</strong><small>₱41,200 memberships</small></span></div></div>
    <section className="chart-card"><div><strong>Check-ins</strong><span>Nov 1–30, 2026</span></div><div className="chart"><span style={{height:'42%'}}/><span style={{height:'65%'}}/><span style={{height:'54%'}}/><span style={{height:'78%'}}/><span style={{height:'63%'}}/><span style={{height:'92%'}}/><span style={{height:'70%'}}/></div><div className="chart-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></section>
    <div className="section-title"><div>Expiring this week <span className="count-pill">7</span></div><button>View all</button></div>
    <div className="member-list compact">{members.slice(0,3).map((m,i) => <div className="member-card" key={m.name}><Avatar index={m.avatar} size="sm" /><div className="flex-1"><strong>{m.name}</strong><span>{i + 2} days remaining</span></div><Status type="amber">Nov {18+i}</Status></div>)}</div>
  </div>;
}

function LoginPage({ go }: { go: (p: Page) => void }) {
  return <div className="login-page"><div className="login-brand"><div className="login-logo"><Icon name="tap" size={34} /></div><h1>FitTap</h1><p>Gym check-in and membership<br />in one tap.</p></div><div className="login-card"><h2>Welcome back</h2><p>Log in to manage your gym.</p><Field label="Email address" placeholder="you@gym.com" type="email" /><Field label="Password" placeholder="Enter your password" type="password" /><button className="forgot">Forgot password?</button><button className="primary-btn w-full" onClick={() => go('checkins')}>Log in</button></div><p className="login-foot"><Icon name="shield" size={15} />Secure access for gym owners and staff</p></div>;
}

export default function App() {
  const [page, setPage] = useState<Page>('checkins');
  const [offline, setOffline] = useState(false);
  const showNav = ['checkins', 'members', 'renew', 'walkin', 'more'].includes(page);
  const content = {
    checkins: <CheckinsPage />, members: <MembersPage go={setPage} />, profile: <ProfilePage go={setPage} />, register: <RegisterPage go={setPage} />, link: <LinkPage go={setPage} />, waiting: <WaitingPage go={setPage} />, recent: <RecentPage go={setPage} />, renew: <RenewPage />, walkin: <WalkinPage />, more: <MorePage go={setPage} offline={offline} setOffline={setOffline} />, reports: <ReportsPage go={setPage} />, login: <LoginPage go={setPage} />,
  }[page];
  return <main className="app-shell">{offline && page !== 'login' && <div className="offline-banner"><Icon name="wifi" size={17} /><span><strong>No internet</strong>: changes will not be saved</span></div>}<div className={`app-content ${showNav ? 'with-nav' : ''}`}>{content}</div>{showNav && <BottomNav page={page} setPage={setPage} />}</main>;
}

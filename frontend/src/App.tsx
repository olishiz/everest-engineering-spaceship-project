import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Activity,
  Bell,
  ChartNoAxesColumnIncreasing,
  Check,
  ChevronsUpDown,
  CircleGauge,
  Database,
  Ellipsis,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Moon,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DemoSpaceshipApi, HttpSpaceshipApi, type SpaceshipApi } from './api';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';
import { Input, Textarea } from './components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './components/ui/table';
import { cn } from './lib/utils';
import type {
  AccessDecision,
  CreatePassengerInput,
  CreateResourceInput,
  DashboardSection,
  Passenger,
  ResourceUsage,
  ShipResource,
  Tier,
  TierUsage,
} from './types';

const tiers: Tier[] = ['SILVER', 'GOLD', 'PLATINUM'];
const tierRank: Record<Tier, number> = { SILVER: 1, GOLD: 2, PLATINUM: 3 };
const navigation: Array<{
  id: DashboardSection;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'overview', label: 'Dashboard', description: 'Mission overview', icon: LayoutDashboard },
  { id: 'passengers', label: 'Passengers', description: 'Manifest and tiers', icon: Users },
  { id: 'resources', label: 'Resources', description: 'Onboard services', icon: Database },
  { id: 'activity', label: 'Audit log', description: 'Access decisions', icon: Activity },
];

const pageCopy: Record<DashboardSection, { title: string; description: string }> = {
  overview: {
    title: 'Mission dashboard',
    description: 'Monitor passenger access and onboard resource operations.',
  },
  passengers: {
    title: 'Passengers',
    description: 'Manage the passenger manifest and membership tiers.',
  },
  resources: {
    title: 'Ship resources',
    description: 'Provision facilities and manage their operational lifecycle.',
  },
  activity: {
    title: 'Audit activity',
    description: 'Review the immutable record of access decisions.',
  },
};

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <Badge
      variant={tier === 'GOLD' ? 'warning' : tier === 'PLATINUM' ? 'default' : 'secondary'}
      className="font-mono text-[10px]"
    >
      {tier}
    </Badge>
  );
}

function Initials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');
  return (
    <span className="grid size-9 shrink-0 place-items-center border bg-muted text-xs font-semibold">
      {initials}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? 'success' : 'secondary'} className="gap-1.5">
      <span className={cn('size-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-slate-400')} />
      {active ? 'Active' : 'Offline'}
    </Badge>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

function PassengerDialog({
  open,
  onOpenChange,
  onSubmit,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreatePassengerInput) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState<CreatePassengerInput>({
    name: '',
    email: '',
    tier: 'SILVER',
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSubmit(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add passenger</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Create a manifest profile and assign its initial access tier.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
          <Field label="Full name">
            <Input
              required
              autoFocus
              maxLength={120}
              placeholder="Maya Chen"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="Email address">
            <Input
              required
              type="email"
              maxLength={254}
              placeholder="maya@x26.space"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </Field>
          <Field label="Membership tier">
            <Select
              value={form.tier}
              onValueChange={(value) => setForm({ ...form, tier: value as Tier })}
            >
              <SelectTrigger className="w-full" aria-label="Membership tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false}>
                {tiers.map((tier) => (
                  <SelectItem key={tier} value={tier}>
                    {tier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <UserPlus className="size-4" />
              {saving ? 'Creating…' : 'Create passenger'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResourceDialog({
  open,
  onOpenChange,
  onSubmit,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateResourceInput) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState<CreateResourceInput>({
    name: '',
    description: '',
    minimumTier: 'SILVER',
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSubmit(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Provision resource</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Add a new onboard facility and define its minimum access tier.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
          <Field label="Resource name">
            <Input
              required
              autoFocus
              maxLength={120}
              placeholder="Observation lounge"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>
          <Field label="Description">
            <Textarea
              maxLength={1000}
              placeholder="Describe the facility and its purpose."
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>
          <Field label="Minimum membership">
            <Select
              value={form.minimumTier}
              onValueChange={(value) => setForm({ ...form, minimumTier: value as Tier })}
            >
              <SelectTrigger className="w-full" aria-label="Minimum membership">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false}>
                {tiers.map((tier) => (
                  <SelectItem key={tier} value={tier}>
                    {tier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Plus className="size-4" />
              {saving ? 'Provisioning…' : 'Provision resource'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConnectionDialog({
  open,
  initialUrl,
  onOpenChange,
  onConnect,
}: {
  open: boolean;
  initialUrl: string;
  onOpenChange: (open: boolean) => void;
  onConnect: (url: string) => void;
}) {
  const [url, setUrl] = useState(initialUrl || 'http://localhost:3000');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Data source</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Connect this dashboard to the NestJS backend or return to the stateful demo.
          </DialogDescription>
        </DialogHeader>
        <Field label="Backend origin">
          <Input
            autoFocus
            placeholder="http://localhost:3000"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onConnect('')}>
            Use demo data
          </Button>
          <Button onClick={() => onConnect(url.trim())}>Connect API</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-52 place-items-center p-8 text-center">
      <div>
        <Search className="mx-auto mb-3 size-8 text-muted-foreground/60" />
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [section, setSection] = useState<DashboardSection>('overview');
  const [overviewTab, setOverviewTab] = useState<'overview' | 'analytics'>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('x26-api-url') ?? '');
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [resources, setResources] = useState<ShipResource[]>([]);
  const [usage, setUsage] = useState<ResourceUsage[]>([]);
  const [tierUsage, setTierUsage] = useState<TierUsage[]>([]);
  const [activity, setActivity] = useState<AccessDecision[]>([]);
  const [search, setSearch] = useState('');
  const [accessPassengerId, setAccessPassengerId] = useState('');
  const [accessResourceId, setAccessResourceId] = useState('');
  const [passengerOpen, setPassengerOpen] = useState(false);
  const [resourceOpen, setResourceOpen] = useState(false);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const api = useMemo<SpaceshipApi>(
    () => (apiUrl ? new HttpSpaceshipApi(apiUrl) : new DemoSpaceshipApi()),
    [apiUrl],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextPassengers, nextResources, nextUsage, nextTierUsage, nextActivity] =
        await Promise.all([
          api.getPassengers(),
          api.getResources(),
          api.getResourceUsage(),
          api.getTierUsage(),
          api.getActivity(50),
        ]);
      setPassengers(nextPassengers);
      setResources(nextResources);
      setUsage(nextUsage);
      setTierUsage(nextTierUsage);
      setActivity(nextActivity);
      setAccessPassengerId((current) => current || nextPassengers[0]?.id || '');
      setAccessResourceId((current) => current || nextResources[0]?.id || '');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load mission data.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const totalAttempts = tierUsage.reduce((sum, item) => sum + item.totalAttempts, 0);
  const successfulUses = tierUsage.reduce((sum, item) => sum + item.successfulUses, 0);
  const deniedAttempts = tierUsage.reduce((sum, item) => sum + item.deniedAttempts, 0);
  const successRate = totalAttempts ? Math.round((successfulUses / totalAttempts) * 100) : 100;
  const activeResources = resources.filter((resource) => resource.active).length;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredPassengers = passengers.filter(
    (passenger) =>
      passenger.name.toLowerCase().includes(normalizedSearch) ||
      passenger.email.toLowerCase().includes(normalizedSearch) ||
      passenger.tier.toLowerCase().includes(normalizedSearch),
  );
  const filteredResources = resources.filter(
    (resource) =>
      resource.name.toLowerCase().includes(normalizedSearch) ||
      resource.minimumTier.toLowerCase().includes(normalizedSearch) ||
      resource.description?.toLowerCase().includes(normalizedSearch),
  );
  const selectedPassenger = passengers.find((item) => item.id === accessPassengerId);
  const selectedResource = resources.find((item) => item.id === accessResourceId);
  const eligible =
    selectedPassenger &&
    selectedResource &&
    selectedResource.active &&
    tierRank[selectedPassenger.tier] >= tierRank[selectedResource.minimumTier];

  function navigate(next: DashboardSection) {
    setSection(next);
    setSearch('');
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function connect(url: string) {
    if (url) localStorage.setItem('x26-api-url', url);
    else localStorage.removeItem('x26-api-url');
    setApiUrl(url);
    setAccessPassengerId('');
    setAccessResourceId('');
    setConnectionOpen(false);
    setToast(url ? 'Live API connected.' : 'Demo mission data restored.');
  }

  async function createPassenger(input: CreatePassengerInput) {
    setBusy('passenger-create');
    setError('');
    try {
      await api.createPassenger(input);
      setPassengerOpen(false);
      await refresh();
      setToast(`${input.name.trim()} was added to the manifest.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create passenger.');
    } finally {
      setBusy('');
    }
  }

  async function updateTier(passenger: Passenger, tier: Tier) {
    if (tier === passenger.tier) return;
    setBusy(`tier-${passenger.id}`);
    try {
      await api.updatePassengerTier(passenger.id, tier);
      await refresh();
      setToast(`${passenger.name} is now a ${tier.toLowerCase()} member.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update membership.');
    } finally {
      setBusy('');
    }
  }

  async function createResource(input: CreateResourceInput) {
    setBusy('resource-create');
    setError('');
    try {
      await api.createResource(input);
      setResourceOpen(false);
      await refresh();
      setToast(`${input.name.trim()} is now available onboard.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not provision resource.');
    } finally {
      setBusy('');
    }
  }

  async function decommission(resource: ShipResource) {
    if (!resource.active) return;
    if (!window.confirm(`Decommission ${resource.name}? Its audit history will be preserved.`))
      return;
    setBusy(`resource-${resource.id}`);
    try {
      await api.decommissionResource(resource.id);
      await refresh();
      setToast(`${resource.name} was decommissioned.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not decommission resource.');
    } finally {
      setBusy('');
    }
  }

  async function attemptAccess() {
    if (!accessPassengerId || !accessResourceId) return;
    setBusy('access');
    try {
      const decision = await api.attemptAccess(accessPassengerId, accessResourceId);
      await refresh();
      setToast(
        `${decision.resourceName}: access ${decision.outcome.toLowerCase()} for ${decision.passengerName}.`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not validate access.');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden border-r bg-sidebar transition-[width] duration-200 md:flex md:flex-col',
          collapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        <button
          className="flex h-16 items-center gap-3 border-b px-4 text-left"
          onClick={() => setCollapsed((value) => !value)}
        >
          <span className="grid size-9 shrink-0 place-items-center bg-primary text-primary-foreground">
            <Rocket className="size-5" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <strong className="block truncate text-sm">Spaceship X26</strong>
              <small className="block text-xs text-muted-foreground">Mission control</small>
            </span>
          )}
          {!collapsed && <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />}
        </button>

        <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
          {!collapsed && (
            <p className="px-2 pb-2 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Operations
            </p>
          )}
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={cn(
                  'flex h-10 w-full items-center gap-3 px-3 text-sm font-medium transition-colors hover:bg-sidebar-accent',
                  section === item.id && 'bg-sidebar-accent text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-0',
                )}
                title={collapsed ? item.label : undefined}
                onClick={() => navigate(item.id)}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.id === 'activity' && deniedAttempts > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {deniedAttempts}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t p-3">
          <button
            className={cn(
              'flex w-full items-center gap-3 p-2 text-left hover:bg-sidebar-accent',
              collapsed && 'justify-center',
            )}
            onClick={() => setConnectionOpen(true)}
          >
            <Initials name="Crew Lead Alpha" />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm">Crew Lead Alpha</strong>
                  <small className="block truncate text-xs text-muted-foreground">
                    {apiUrl ? 'Live operations' : 'Demo operations'}
                  </small>
                </span>
                <Settings className="size-4 text-muted-foreground" />
              </>
            )}
          </button>
        </div>
      </aside>

      {mobileNavOpen && (
        <>
          <button
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 border-r bg-sidebar p-3 md:hidden">
            <div className="mb-4 flex h-12 items-center gap-3 px-2">
              <span className="grid size-9 place-items-center bg-primary text-primary-foreground">
                <Rocket className="size-5" />
              </span>
              <strong className="text-sm">Spaceship X26</strong>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto"
                aria-label="Close navigation"
                onClick={() => setMobileNavOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={cn(
                      'flex h-10 w-full items-center gap-3 px-3 text-sm font-medium',
                      section === item.id && 'bg-sidebar-accent',
                    )}
                    onClick={() => navigate(item.id)}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      <div
        className={cn('transition-[margin] duration-200', collapsed ? 'md:ml-[72px]' : 'md:ml-64')}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-6">
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <div className="relative hidden w-full max-w-sm sm:block">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search this workspace…"
              value={section === 'passengers' || section === 'resources' ? search : ''}
              onChange={(event) => setSearch(event.target.value)}
              disabled={section === 'overview' || section === 'activity'}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-2 sm:flex"
              onClick={() => setConnectionOpen(true)}
            >
              <span
                className={cn('size-2 rounded-full', apiUrl ? 'bg-emerald-500' : 'bg-amber-500')}
              />
              {apiUrl ? 'Live API' : 'Demo data'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Refresh data"
              onClick={() => void refresh()}
            >
              <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={dark ? 'Use light theme' : 'Use dark theme'}
              onClick={() => setDark((value) => !value)}
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-4" />
              {deniedAttempts > 0 && (
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" />
              )}
            </Button>
            <Initials name="Crew Lead Alpha" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 md:p-6 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl font-semibold uppercase tracking-wider">
                {pageCopy[section].title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{pageCopy[section].description}</p>
            </div>
            {section === 'passengers' && (
              <Button onClick={() => setPassengerOpen(true)}>
                <UserPlus className="size-4" /> Add passenger
              </Button>
            )}
            {section === 'resources' && (
              <Button onClick={() => setResourceOpen(true)}>
                <Plus className="size-4" /> Provision resource
              </Button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              <LockKeyhole className="size-4" />
              <strong>Action needed:</strong>
              <span className="flex-1">{error}</span>
              <button aria-label="Dismiss error" onClick={() => setError('')}>
                <X className="size-4" />
              </button>
            </div>
          )}

          {loading && !passengers.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="h-36 animate-pulse rounded-xl border bg-muted" />
              ))}
            </div>
          ) : (
            <>
              {section === 'overview' && (
                <OverviewPage
                  tab={overviewTab}
                  setTab={setOverviewTab}
                  passengers={passengers}
                  resources={resources}
                  usage={usage}
                  tierUsage={tierUsage}
                  activity={activity}
                  activeResources={activeResources}
                  successfulUses={successfulUses}
                  totalAttempts={totalAttempts}
                  deniedAttempts={deniedAttempts}
                  successRate={successRate}
                  accessPassengerId={accessPassengerId}
                  setAccessPassengerId={setAccessPassengerId}
                  accessResourceId={accessResourceId}
                  setAccessResourceId={setAccessResourceId}
                  eligible={Boolean(eligible)}
                  busy={busy}
                  attemptAccess={attemptAccess}
                />
              )}
              {section === 'passengers' && (
                <PassengersPage
                  passengers={filteredPassengers}
                  total={passengers.length}
                  search={search}
                  setSearch={setSearch}
                  busy={busy}
                  updateTier={updateTier}
                />
              )}
              {section === 'resources' && (
                <ResourcesPage
                  resources={filteredResources}
                  usage={usage}
                  search={search}
                  setSearch={setSearch}
                  busy={busy}
                  testAccess={(resource) => {
                    setAccessResourceId(resource.id);
                    navigate('overview');
                  }}
                  decommission={decommission}
                />
              )}
              {section === 'activity' && <ActivityPage tierUsage={tierUsage} activity={activity} />}
            </>
          )}
        </main>
      </div>

      <PassengerDialog
        open={passengerOpen}
        onOpenChange={setPassengerOpen}
        onSubmit={createPassenger}
        saving={busy === 'passenger-create'}
      />
      <ResourceDialog
        open={resourceOpen}
        onOpenChange={setResourceOpen}
        onSubmit={createResource}
        saving={busy === 'resource-create'}
      />
      <ConnectionDialog
        open={connectionOpen}
        initialUrl={apiUrl}
        onOpenChange={setConnectionOpen}
        onConnect={connect}
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-[70] flex max-w-sm items-center gap-3 border bg-background px-4 py-3 text-sm shadow-lg"
        >
          <span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <Check className="size-3.5" />
          </span>
          <span className="flex-1">{toast}</span>
          <button aria-label="Dismiss notification" onClick={() => setToast('')}>
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: typeof Users;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function OverviewPage({
  tab,
  setTab,
  passengers,
  resources,
  usage,
  tierUsage,
  activity,
  activeResources,
  successfulUses,
  totalAttempts,
  deniedAttempts,
  successRate,
  accessPassengerId,
  setAccessPassengerId,
  accessResourceId,
  setAccessResourceId,
  eligible,
  busy,
  attemptAccess,
}: {
  tab: 'overview' | 'analytics';
  setTab: (tab: 'overview' | 'analytics') => void;
  passengers: Passenger[];
  resources: ShipResource[];
  usage: ResourceUsage[];
  tierUsage: TierUsage[];
  activity: AccessDecision[];
  activeResources: number;
  successfulUses: number;
  totalAttempts: number;
  deniedAttempts: number;
  successRate: number;
  accessPassengerId: string;
  setAccessPassengerId: (id: string) => void;
  accessResourceId: string;
  setAccessResourceId: (id: string) => void;
  eligible: boolean;
  busy: string;
  attemptAccess: () => Promise<void>;
}) {
  const chartData = usage.map((item) => ({
    name: item.resourceName.split(' ')[0],
    fullName: item.resourceName,
    uses: item.successfulUses,
  }));

  return (
    <div className="space-y-4">
      <div className="inline-flex h-9 items-center bg-muted p-1 text-muted-foreground">
        <button
          className={cn(
            'px-3 py-1 text-sm font-medium',
            tab === 'overview' && 'bg-background text-foreground shadow-sm',
          )}
          onClick={() => setTab('overview')}
        >
          Overview
        </button>
        <button
          className={cn(
            'px-3 py-1 text-sm font-medium',
            tab === 'analytics' && 'bg-background text-foreground shadow-sm',
          )}
          onClick={() => setTab('analytics')}
        >
          Analytics
        </button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Mission metrics">
        <MetricCard
          title="Total passengers"
          value={passengers.length}
          description="Verified manifest profiles"
          icon={Users}
        />
        <MetricCard
          title="Active resources"
          value={`${activeResources}/${resources.length}`}
          description="Onboard services available"
          icon={Database}
        />
        <MetricCard
          title="Access success"
          value={`${successRate}%`}
          description={`${successfulUses} approved uses`}
          icon={ShieldCheck}
        />
        <MetricCard
          title="Access decisions"
          value={totalAttempts}
          description={`${deniedAttempts} denied attempts`}
          icon={Activity}
        />
      </section>

      {tab === 'overview' ? (
        <>
          <section className="grid gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Resource utilization</CardTitle>
                <CardDescription>Successful access decisions by onboard facility.</CardDescription>
              </CardHeader>
              <CardContent className="pl-1">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis tickLine={false} axisLine={false} fontSize={11} width={32} />
                      <Tooltip
                        cursor={{ fill: 'var(--muted)' }}
                        formatter={(value) => [`${value} uses`, 'Successful access']}
                        labelFormatter={(_, payload) => payload[0]?.payload.fullName ?? ''}
                      />
                      <Bar dataKey="uses" fill="var(--chart-2)" radius={[0, 0, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Latest recorded passenger access decisions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {activity.slice(0, 5).map((item) => (
                  <div className="flex items-center gap-3" key={item.id}>
                    <Initials name={item.passengerName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.passengerName}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.resourceName}</p>
                    </div>
                    <Badge variant={item.outcome === 'ALLOWED' ? 'success' : 'danger'}>
                      {item.outcome}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>Access simulator</CardTitle>
                  <CardDescription className="mt-1">
                    Validate and record a real policy decision.
                  </CardDescription>
                </div>
                <Badge variant={eligible ? 'success' : 'secondary'}>
                  {eligible ? (
                    <ShieldCheck className="mr-1 size-3" />
                  ) : (
                    <LockKeyhole className="mr-1 size-3" />
                  )}
                  {eligible ? 'Eligible' : 'Restricted'}
                </Badge>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Passenger">
                    <Select
                      value={accessPassengerId}
                      onValueChange={(value) => setAccessPassengerId(value ?? '')}
                    >
                      <SelectTrigger className="w-full" aria-label="Passenger">
                        <SelectValue placeholder="Select a passenger" />
                      </SelectTrigger>
                      <SelectContent align="start" alignItemWithTrigger={false}>
                        {passengers.map((passenger) => (
                          <SelectItem value={passenger.id} key={passenger.id}>
                            {passenger.name} · {passenger.tier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Resource">
                    <Select
                      value={accessResourceId}
                      onValueChange={(value) => setAccessResourceId(value ?? '')}
                    >
                      <SelectTrigger className="w-full" aria-label="Resource">
                        <SelectValue placeholder="Select a resource" />
                      </SelectTrigger>
                      <SelectContent align="start" alignItemWithTrigger={false}>
                        {resources.map((resource) => (
                          <SelectItem value={resource.id} key={resource.id}>
                            {resource.name} · {resource.minimumTier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Button
                  className="w-full sm:w-fit"
                  disabled={busy === 'access' || !accessPassengerId || !accessResourceId}
                  onClick={() => void attemptAccess()}
                >
                  <ShieldCheck className="size-4" />
                  {busy === 'access' ? 'Validating…' : 'Validate access'}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Membership distribution</CardTitle>
                <CardDescription>Passenger composition by access tier.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tiers.map((tier) => {
                  const count = passengers.filter((item) => item.tier === tier).length;
                  const percentage = passengers.length
                    ? Math.round((count / passengers.length) * 100)
                    : 0;
                  return (
                    <div key={tier}>
                      <div className="mb-2 flex items-center gap-2">
                        <TierBadge tier={tier} />
                        <span className="ml-auto text-sm font-medium">{count}</span>
                        <span className="w-10 text-right text-xs text-muted-foreground">
                          {percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted">
                        <div
                          className="h-2 bg-primary"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </section>
        </>
      ) : (
        <section className="grid gap-4 lg:grid-cols-3">
          {tierUsage.map((item) => (
            <Card key={item.passengerTier}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <TierBadge tier={item.passengerTier} />
                  <ChartNoAxesColumnIncreasing className="size-4 text-muted-foreground" />
                </div>
                <CardTitle className="pt-3 text-3xl">{item.totalAttempts}</CardTitle>
                <CardDescription>Total access attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between border-t pt-4 text-sm">
                  <span className="text-emerald-600">{item.successfulUses} allowed</span>
                  <span className="text-red-600">{item.deniedAttempts} denied</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}

function PassengersPage({
  passengers,
  total,
  search,
  setSearch,
  busy,
  updateTier,
}: {
  passengers: Passenger[];
  total: number;
  search: string;
  setSearch: (value: string) => void;
  busy: string;
  updateTier: (passenger: Passenger, tier: Tier) => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Passenger manifest</CardTitle>
          <CardDescription>
            Showing {passengers.length} of {total} passenger profiles.
          </CardDescription>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter passengers…"
            aria-label="Search passengers"
          />
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {passengers.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Passenger</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Membership</TableHead>
                <TableHead className="hidden lg:table-cell">Access profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {passengers.map((passenger) => (
                <TableRow key={passenger.id}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <Initials name={passenger.name} />
                      <div>
                        <p className="font-medium">{passenger.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {passenger.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{passenger.email}</TableCell>
                  <TableCell>
                    <Select
                      value={passenger.tier}
                      disabled={busy === `tier-${passenger.id}`}
                      onValueChange={(value) => void updateTier(passenger, value as Tier)}
                    >
                      <SelectTrigger
                        className="w-32"
                        aria-label={`Change ${passenger.name}'s membership`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="start" alignItemWithTrigger={false}>
                        {tiers.map((tier) => (
                          <SelectItem key={tier} value={tier}>
                            {tier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    Inherits {tierRank[passenger.tier]} access tier
                    {tierRank[passenger.tier] === 1 ? '' : 's'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState title="No passengers found" description="Try another name, email, or tier." />
        )}
      </CardContent>
    </Card>
  );
}

function ResourcesPage({
  resources,
  usage,
  search,
  setSearch,
  busy,
  testAccess,
  decommission,
}: {
  resources: ShipResource[];
  usage: ResourceUsage[];
  search: string;
  setSearch: (value: string) => void;
  busy: string;
  testAccess: (resource: ShipResource) => void;
  decommission: (resource: ShipResource) => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Resource inventory</CardTitle>
          <CardDescription>Monitor onboard facilities and access requirements.</CardDescription>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter resources…"
            aria-label="Search resources"
          />
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {resources.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Resource</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Minimum tier</TableHead>
                <TableHead className="hidden md:table-cell">Successful uses</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="pl-6">
                    <div>
                      <p className="font-medium">{resource.name}</p>
                      <p className="max-w-md truncate text-xs text-muted-foreground">
                        {resource.description || resource.zone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge active={resource.active} />
                  </TableCell>
                  <TableCell>
                    <TierBadge tier={resource.minimumTier} />
                  </TableCell>
                  <TableCell className="hidden font-medium md:table-cell">
                    {usage.find((item) => item.resourceId === resource.id)?.successfulUses ?? 0}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${resource.name}`}
                        >
                          <Ellipsis className="size-4" />
                        </Button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          align="end"
                          className="z-50 min-w-44 border bg-popover p-1 text-sm shadow-md"
                        >
                          <DropdownMenu.Item
                            className="flex cursor-pointer items-center gap-2 px-2 py-2 outline-none hover:bg-accent"
                            onSelect={() => testAccess(resource)}
                          >
                            <CircleGauge className="size-4" /> Test access
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator className="my-1 h-px bg-border" />
                          <DropdownMenu.Item
                            disabled={!resource.active || busy === `resource-${resource.id}`}
                            className="flex cursor-pointer items-center gap-2 px-2 py-2 text-destructive outline-none hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                            onSelect={() => void decommission(resource)}
                          >
                            <LockKeyhole className="size-4" />
                            {busy === `resource-${resource.id}`
                              ? 'Working…'
                              : resource.active
                                ? 'Decommission'
                                : 'Decommissioned'}
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState title="No resources found" description="Try another name or tier." />
        )}
      </CardContent>
    </Card>
  );
}

function ActivityPage({
  tierUsage,
  activity,
}: {
  tierUsage: TierUsage[];
  activity: AccessDecision[];
}) {
  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tierUsage.map((item) => (
          <Card key={item.passengerTier}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <TierBadge tier={item.passengerTier} />
                <Activity className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.totalAttempts}</div>
              <p className="text-xs text-muted-foreground">
                {item.successfulUses} allowed · {item.deniedAttempts} denied
              </p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="success">PROTECTED</Badge>
              <ShieldCheck className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Immutable</div>
            <p className="text-xs text-muted-foreground">Database-enforced audit integrity</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Access decisions</CardTitle>
          <CardDescription>Complete passenger and resource decision history.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {activity.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Decision</TableHead>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead className="hidden md:table-cell">Tier</TableHead>
                  <TableHead className="hidden lg:table-cell">Recorded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activity.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-6">
                      <Badge variant={item.outcome === 'ALLOWED' ? 'success' : 'danger'}>
                        {item.outcome}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{item.passengerName}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {item.reason.replaceAll('_', ' ').toLowerCase()}
                      </p>
                    </TableCell>
                    <TableCell>{item.resourceName}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <TierBadge tier={item.passengerTier} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {new Intl.DateTimeFormat('en', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(item.attemptedAt))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No access activity yet"
              description="Recorded decisions will appear here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

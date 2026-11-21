import {
  Activity,
  ArrowDownToLine,
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Cloud,
  CloudUpload,
  Command,
  Download,
  FileSpreadsheet,
  Filter,
  Handshake,
  HeartHandshake,
  Home,
  IdCard,
  Layers3,
  Map,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  Target,
  TrendingUp,
  Upload,
  Users,
  Vote,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatNumber,
  getGenderShare,
  getVoteProgress,
  isDuplicateFingerprint,
  isValidNikShape,
  sampleActivity,
  sampleElection,
  sampleMetrics,
  sampleTeam,
  sampleTrend,
  sampleWards,
  type TeamMember,
  type Ward,
} from "@/lib/campaign-data";
import { toast } from "sonner";

type ViewKey = "overview" | "field" | "volunteers" | "supporters" | "recap";
type FieldKey = "supporters" | "count";

type SupporterRecord = {
  id: string;
  name: string;
  phone: string;
  area: string;
  gender: string;
  dpt: "Terverifikasi" | "Perlu verifikasi";
  added: string;
};

type CandidateMembership = {
  candidate_id: string;
  can_input_supporters: boolean;
};

type CampaignDataClient = {
  from: (table: "candidate_memberships") => {
    select: (columns: "candidate_id, can_input_supporters") => {
      eq: (column: "user_id", value: string) => {
        limit: (count: 1) => {
          maybeSingle: () => Promise<{ data: CandidateMembership | null; error: { message: string } | null }>;
        };
      };
    };
  };
  rpc: (functionName: "register_supporter", params: {
    p_candidate_id: string;
    p_nik: string;
    p_name: string;
    p_phone: string;
    p_address: string | null;
    p_gender: string;
    p_ward: string;
    p_source: string;
  }) => Promise<{ error: { message: string } | null }>;
};

// Keep this narrow bridge local while the generated Cloud database types are empty.
const campaignDataClient = supabase as unknown as CampaignDataClient;

const viewLabels: Record<ViewKey, string> = {
  overview: "Ringkasan",
  field: "Data lapangan",
  volunteers: "Tim relawan",
  supporters: "Pendukung",
  recap: "Laporan & audit",
};

const navSections: Array<{ label: string; items: Array<{ key: ViewKey; icon: typeof Home }> }> = [
  {
    label: "PANTAU",
    items: [
      { key: "overview", icon: Home },
      { key: "field", icon: Map },
    ],
  },
  {
    label: "ORGANISASI",
    items: [
      { key: "volunteers", icon: Users },
      { key: "supporters", icon: HeartHandshake },
    ],
  },
  {
    label: "DATA",
    items: [{ key: "recap", icon: ClipboardList }],
  },
];

function formatShort(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)} jt`;
  if (value >= 10_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)} rb`;
  return formatNumber(value);
}

function NavContent({ active, onSelect, mobile = false }: { active: ViewKey; onSelect: (key: ViewKey) => void; mobile?: boolean }) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex h-[74px] items-center gap-3 border-b border-sidebar-border px-5">
        <div className="grid size-10 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Command className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold tracking-[0.02em] text-sidebar-foreground">SULUH</p>
          <p className="text-[10px] font-medium tracking-[0.08em] text-sidebar-foreground/55">PUSAT KENDALI</p>
        </div>
        <span className="ml-auto rounded border border-sidebar-border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-sidebar-foreground/55">2026</span>
      </div>

      <button
        type="button"
        onClick={() => onSelect("overview")}
        className="mx-3 mt-4 flex min-h-[62px] items-center gap-3 rounded-md border border-sidebar-border bg-sidebar-accent/55 px-3 text-left transition-colors hover:bg-sidebar-accent"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded bg-chart-1/15 text-chart-1">
          <Map className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-sidebar-foreground">Pilkada Sidoarjo</span>
          <span className="mt-1 block truncate text-[10px] text-sidebar-foreground/55">Bupati · Periode aktif</span>
        </span>
        <ChevronDown className="size-3.5 text-sidebar-foreground/45" />
      </button>

      <div className="mt-6 flex-1 space-y-7 px-3">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3 text-[9px] font-semibold tracking-[0.12em] text-sidebar-foreground/40">{section.label}</p>
            <div className="space-y-1">
              {section.items.map(({ key, icon: Icon }) => {
                const isActive = active === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => onSelect(key)}
                    className={`flex h-10 w-full items-center gap-3 rounded-md border px-3 text-left text-[13px] font-medium transition-colors ${isActive ? "border-sidebar-primary/35 bg-sidebar-primary text-sidebar-primary-foreground" : "border-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}
                  >
                    <Icon className="size-4" />
                    <span className="flex-1">{viewLabels[key]}</span>
                    {key === "field" && <span className="rounded bg-chart-2/20 px-1.5 py-0.5 text-[9px] text-chart-2">1.584</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3">
        <div className="rounded-md border border-sidebar-border bg-sidebar-accent/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-chart-2 opacity-35 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-chart-2" />
              </span>
              <span className="text-[10px] font-semibold text-sidebar-foreground/80">Mode pratinjau</span>
            </div>
            <Badge variant="outline" className="h-5 border-chart-2/30 bg-chart-2/10 px-1.5 text-[9px] font-medium text-chart-2">CONTOH</Badge>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-sidebar-foreground/55">Seluruh angka dan identitas yang tampil merupakan data simulasi.</p>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-md px-2 py-2">
          <Avatar className="size-8 border border-sidebar-border">
            <AvatarFallback className="bg-chart-3/15 text-[10px] font-semibold text-chart-3">AW</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11px] font-semibold text-sidebar-foreground">Administrator</span>
            <span className="mt-0.5 block truncate text-[10px] text-sidebar-foreground/50">Demo aplikasi</span>
          </span>
          <MoreHorizontal className="size-4 text-sidebar-foreground/55" />
        </div>
      </div>

      {mobile && <p className="px-5 pb-4 text-[10px] text-sidebar-foreground/35">SULUH · PUSAT KENDALI</p>}
    </div>
  );
}

function Metric({ label, value, note, change, icon: Icon, accent = false }: { label: string; value: string; note: string; change?: string; icon: typeof Users; accent?: boolean }) {
  return (
    <article className="flex min-h-[112px] items-start gap-3.5 border-b border-border px-1 pb-3 pt-4 sm:min-h-[125px] lg:border-b-0 lg:border-r lg:px-5 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0">
      <div className={`grid size-9 shrink-0 place-items-center rounded-md ${accent ? "bg-brand-soft text-brand-strong" : "bg-secondary text-muted-foreground"}`}>
        <Icon className="size-[17px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium text-muted-foreground sm:text-xs">{label}</p>
        <p className="mt-1.5 font-display text-[25px] font-semibold leading-none text-foreground sm:text-[30px]">{value}</p>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground sm:text-[11px]">
          {change && <span className="flex items-center font-semibold text-chart-2"><ArrowUpRight className="size-3" /> {change}</span>}
          <span className="truncate">{note}</span>
        </p>
      </div>
    </article>
  );
}

function VoteGauge({ progress }: { progress: number }) {
  const radius = 76;
  const perimeter = Math.PI * radius;
  const offset = perimeter - perimeter * progress / 100;
  const endAngle = Math.PI * (1 + progress / 100);
  const thumbX = 88 + radius * Math.cos(endAngle);
  const thumbY = 92 + radius * Math.sin(endAngle);
  return (
    <div className="relative mx-auto h-[120px] w-[184px]" role="img" aria-label={`Realisasi target suara ${progress} persen`}>
      <svg viewBox="0 0 176 103" className="h-full w-full overflow-visible" aria-hidden="true">
        <path d="M 12 91 A 76 76 0 0 1 164 91" fill="none" stroke="var(--color-secondary)" strokeWidth="11" strokeLinecap="round" />
        <path
          d="M 12 91 A 76 76 0 0 1 164 91"
          fill="none"
          stroke="var(--color-chart-2)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${perimeter} ${perimeter}`}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
        />
        <circle cx={thumbX} cy={thumbY} r="5" fill="var(--color-background)" stroke="var(--color-chart-2)" strokeWidth="3" />
      </svg>
      <div className="absolute inset-x-0 bottom-[3px] flex flex-col items-center text-center">
        <span className="font-display text-[35px] font-semibold leading-[0.95] text-foreground">{progress}<span className="text-[20px]">%</span></span>
        <span className="mt-1.5 text-[10px] font-medium text-muted-foreground">dari target suara</span>
      </div>
      <span className="absolute bottom-[-3px] left-0 text-[9px] font-medium text-muted-foreground">0%</span>
      <span className="absolute bottom-[-3px] right-0 text-[9px] font-medium text-muted-foreground">100%</span>
    </div>
  );
}

function TrendChart({ period }: { period: "7 hari" | "14 hari" | "30 hari" }) {
  const width = 680;
  const height = 180;
  const left = 42;
  const right = 12;
  const top = 15;
  const bottom = 28;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const data = period === "7 hari" ? sampleTrend.slice(-6) : period === "14 hari" ? sampleTrend.slice(-8) : sampleTrend;
  const max = 95_000;
  const xAt = (index: number) => left + (index / Math.max(data.length - 1, 1)) * plotWidth;
  const yAt = (value: number) => top + (1 - value / max) * plotHeight;
  const linePath = (field: "support" | "votes") => data.map((point, index) => `${index === 0 ? "M" : "L"} ${xAt(index)} ${yAt(point[field])}`).join(" ");
  const areaPath = `${linePath("votes")} L ${xAt(data.length - 1)} ${top + plotHeight} L ${xAt(0)} ${top + plotHeight} Z`;
  const formatAxis = (value: number) => value === 0 ? "0" : `${value / 1_000}rb`;
  return (
    <div className="relative w-full" role="img" aria-label={`Grafik perkembangan dukungan dan realisasi suara ${period}`}>
      <div className="absolute left-0 top-0 z-10 flex items-center gap-3 rounded bg-background/90 px-1.5 py-1 text-[9px] font-medium text-muted-foreground sm:text-[10px]">
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-sm bg-chart-2" /> Pendukung</span>
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-sm bg-chart-1" /> Suara masuk</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-5 h-[170px] w-full overflow-visible sm:h-[190px]" aria-hidden="true" preserveAspectRatio="none">
        {[0, 25_000, 50_000, 75_000].map((tick) => (
          <g key={tick}>
            <line x1={left} x2={width - right} y1={yAt(tick)} y2={yAt(tick)} stroke="var(--color-border)" strokeDasharray="3 5" strokeWidth="1" />
            <text x={left - 7} y={yAt(tick) + 3} textAnchor="end" fill="var(--color-muted-foreground)" fontSize="8">{formatAxis(tick)}</text>
          </g>
        ))}
        <path d={areaPath} fill="var(--color-chart-1)" fillOpacity="0.08" />
        <path d={linePath("support")} fill="none" stroke="var(--color-chart-2)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d={linePath("votes")} fill="none" stroke="var(--color-chart-1)" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {data.map((point, index) => <circle key={`votes-${point.day}`} cx={xAt(index)} cy={yAt(point.votes)} r="3.5" fill="var(--color-background)" stroke="var(--color-chart-1)" strokeWidth="2" vectorEffect="non-scaling-stroke" />)}
        {data.map((point, index) => <text key={point.day} x={xAt(index)} y={height - 7} textAnchor="middle" fill="var(--color-muted-foreground)" fontSize="8">{point.day.replace(" Nov", "")}</text>)}
      </svg>
    </div>
  );
}

function MetricCard({ label, value, note, icon: Icon, className = "" }: { label: string; value: string; note: string; icon: typeof Users; className?: string }) {
  return (
    <div className={`flex min-h-[98px] items-start justify-between gap-3 rounded-md border border-border bg-card p-3.5 sm:p-4 ${className}`}>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-muted-foreground sm:text-[11px]">{label}</p>
        <p className="mt-2 font-display text-[23px] font-semibold leading-none">{value}</p>
        <p className="mt-2 truncate text-[9px] text-muted-foreground sm:text-[10px]">{note}</p>
      </div>
      <span className="grid size-8 shrink-0 place-items-center rounded bg-secondary text-muted-foreground"><Icon className="size-4" /></span>
    </div>
  );
}

function DataBanner({ children = "Data simulasi · Siap untuk kampanye Anda", warning = false }: { children?: React.ReactNode; warning?: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 text-[9px] font-medium ${warning ? "text-chart-4" : "text-muted-foreground/70"}`}><span className={`size-1.5 rounded-full ${warning ? "bg-chart-4" : "bg-chart-2"}`} />{children}</span>;
}

function DashboardContent({ onNavigate }: { onNavigate: (key: ViewKey) => void }) {
  const [district, setDistrict] = useState("semua");
  const [period, setPeriod] = useState<"7 hari" | "14 hari" | "30 hari">("30 hari");
  const [activeTab, setActiveTab] = useState("kecamatan");
  const [search, setSearch] = useState("");
  const [teamView, setTeamView] = useState("semua");
  const districts = useMemo(() => district === "semua" ? sampleWards : sampleWards.filter((ward) => ward.name === district), [district]);
  const filteredDistricts = useMemo(() => districts.filter((ward) => ward.name.toLowerCase().includes(search.toLowerCase())), [districts, search]);
  const filteredTeam = useMemo(() => sampleTeam.filter((member) => teamView === "semua" || member.role === teamView).slice(0, 4), [teamView]);
  const genderTotal = sampleMetrics.women + sampleMetrics.men;
  const voteProgress = getVoteProgress(sampleMetrics.voteTarget, sampleMetrics.countedVotes);

  return (
    <div className="space-y-5 pb-7 sm:space-y-6 lg:space-y-7">
      <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between sm:gap-5 lg:pt-1">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-brand-soft px-2 py-1 text-[9px] font-semibold tracking-[0.06em] text-brand-strong">PUSAT KENDALI</span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] font-medium text-muted-foreground">{sampleElection.district}</span>
            <Badge variant="outline" className="h-5 border-chart-2/30 bg-chart-2/10 px-1.5 text-[9px] font-medium text-chart-2"><span className="mr-1 size-1.5 rounded-full bg-chart-2" />CONTOH</Badge>
          </div>
          <h1 className="font-display text-[25px] font-semibold leading-tight tracking-tight text-foreground sm:text-[31px]">Selamat pagi, Arif <span className="text-chart-4">.</span></h1>
          <p className="mt-1.5 text-[11px] text-muted-foreground sm:text-xs">Pantau perolehan suara dan gerak tim di seluruh wilayah Sidoarjo.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 sm:pb-0.5">
          <div className="hidden min-h-9 items-center gap-2 rounded-md border border-border bg-card px-3 sm:flex">
            <CalendarDays className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground">Tanggal pemungutan belum ditentukan</span>
          </div>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger aria-label="Filter kecamatan" className="h-9 w-[142px] border-border bg-card text-[11px] font-medium sm:w-[158px]">
              <Map className="mr-1.5 size-3.5 shrink-0 text-muted-foreground" /><SelectValue placeholder="Wilayah" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Seluruh kecamatan</SelectItem>
              {sampleWards.map((ward) => <SelectItem key={ward.name} value={ward.name}>{ward.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <section aria-label="Ringkasan kampanye" className="grid grid-cols-2 gap-x-3 lg:grid-cols-4 lg:border-y lg:border-border lg:py-4">
        <Metric label="Realisasi suara" value={formatShort(sampleMetrics.countedVotes)} note="dari target 91.500 suara" change="14,2%" icon={Vote} accent />
        <Metric label="DPT terdaftar" value={formatShort(sampleMetrics.dpt)} note="1.584 dari 2.056 TPS melapor" change="77%" icon={IdCard} />
        <Metric label="Pendukung" value={formatNumber(sampleMetrics.supporters)} note="terkumpul dari 8 kecamatan" change="8,4%" icon={HeartHandshake} />
        <Metric label="Relawan aktif" value={formatNumber(sampleMetrics.volunteers)} note="35 sedang bertugas hari ini" icon={Users} />
      </section>

      <section aria-label="Target dan perkembangan kampanye" className="grid gap-3 lg:grid-cols-12 lg:gap-4">
        <article className="relative overflow-hidden rounded-md bg-primary px-4 pb-3 pt-4 text-primary-foreground shadow-sm sm:px-5 sm:pt-5 lg:col-span-4">
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-medium text-primary-foreground/65">
                <Target className="size-3.5" /> PROGRES TARGET SUARA
              </div>
              <p className="mt-2 font-display text-[18px] font-semibold sm:text-[21px]">{formatNumber(sampleMetrics.countedVotes)} <span className="text-[11px] font-normal text-primary-foreground/55">suara masuk</span></p>
            </div>
            <TooltipProvider>
              <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label="Informasi progres" className="size-7 text-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground"><CircleHelp className="size-4" /></Button></TooltipTrigger><TooltipContent><p>Angka ini hanya contoh sampai data real dihubungkan.</p></TooltipContent></Tooltip>
            </TooltipProvider>
          </div>
          <VoteGauge progress={voteProgress} />
          <div className="relative z-10 mt-1 flex items-center justify-between border-t border-primary-foreground/15 pt-2.5 text-[9px] sm:text-[10px]">
            <span className="text-primary-foreground/55">Target: <b className="font-semibold text-primary-foreground/90">{formatNumber(sampleMetrics.voteTarget)}</b></span>
            <span className="flex items-center gap-1 font-medium text-chart-2"><TrendingUp className="size-3" /> {formatNumber(sampleMetrics.voteTarget - sampleMetrics.countedVotes)} lagi</span>
          </div>
        </article>

        <article className="rounded-md border border-border bg-card px-4 py-4 sm:px-5 sm:py-5 lg:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-[12px] font-semibold sm:text-[13px]"><Activity className="size-4 text-chart-2" /> Tren perolehan</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">Pertumbuhan dukungan dan suara yang berhasil dihimpun</p>
            </div>
            <div className="flex items-center gap-0.5 rounded border border-border bg-secondary/40 p-0.5" aria-label="Periode grafik">
              {(["7 hari", "14 hari", "30 hari"] as const).map((item) => <Button key={item} type="button" size="sm" variant={period === item ? "secondary" : "ghost"} onClick={() => setPeriod(item)} className="h-6 rounded px-2 text-[9px]">{item}</Button>)}
            </div>
          </div>
          <TrendChart period={period} />
          <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border pt-3 text-[9px] text-muted-foreground sm:text-[10px]">
            <span>Pendukung terdaftar <b className="ml-1 font-semibold text-foreground">{formatNumber(sampleMetrics.supporters)}</b></span>
            <span>Suara terhimpun <b className="ml-1 font-semibold text-foreground">{formatNumber(sampleMetrics.countedVotes)}</b></span>
            <span className="ml-auto flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-chart-2" />pembaruan berkala <span className="text-muted-foreground/50">(simulasi)</span></span>
          </div>
        </article>
      </section>

      <section aria-label="Capaian dan gender pendukung" className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        <article className="min-w-0 rounded-md border border-border bg-card p-4 sm:p-5 lg:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-[12px] font-semibold sm:text-[13px]"><Layers3 className="size-4 text-chart-3" /> Capaian per kecamatan</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">Target dibanding suara masuk dan persebaran dukungan</p>
            </div>
            <DataBanner />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
            <div className="flex items-center justify-between gap-2 border-b border-border">
              <TabsList className="h-8 justify-start gap-0 rounded-none bg-transparent p-0">
                <TabsTrigger value="kecamatan" className="h-8 rounded-none border-b-2 border-transparent px-3 text-[10px] text-muted-foreground data-[state=active]:border-chart-1 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none">Kecamatan</TabsTrigger>
                <TabsTrigger value="tps" className="h-8 rounded-none border-b-2 border-transparent px-3 text-[10px] text-muted-foreground data-[state=active]:border-chart-1 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none">TPS <span className="ml-1 text-[9px] text-muted-foreground/70">2.056</span></TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-1.5 pb-1">
                <label className="relative hidden w-[120px] sm:block"><Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Cari kecamatan" placeholder="Cari wilayah" className="h-7 border-border pl-7 text-[9px]" /></label>
                <Button type="button" size="icon" variant="outline" aria-label="Filter tampilan" className="size-7 rounded"><Filter className="size-3" /></Button>
                <Button type="button" size="icon" variant="outline" aria-label="Urutkan wilayah" className="size-7 rounded"><ArrowDownUp className="size-3" /></Button>
              </div>
            </div>
            <TabsContent value="kecamatan" className="mt-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[570px] border-collapse text-left text-[10px]" aria-label="Perkembangan suara per kecamatan">
                  <thead><tr className="h-8 border-b border-border text-[9px] font-medium text-muted-foreground"><th className="w-[24%] px-2 font-medium">KECAMATAN</th><th className="px-2 font-medium">SUARA MASUK / TARGET</th><th className="w-[18%] px-2 font-medium">PENDUKUNG</th><th className="w-[15%] px-2 text-right font-medium">TPS LAPOR</th></tr></thead>
                  <tbody>{filteredDistricts.slice(0, 5).map((ward) => <DistrictRow key={ward.name} ward={ward} onClick={() => { setDistrict(ward.name); setActiveTab("tps"); }} />)}</tbody>
                </table>
              </div>
              <Button type="button" variant="ghost" onClick={() => onNavigate("field")} className="mt-1 h-8 w-full justify-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground">Lihat seluruh wilayah <ArrowRight className="size-3" /></Button>
            </TabsContent>
            <TabsContent value="tps" className="mt-0">
              <StationList ward={districts[0]} />
            </TabsContent>
          </Tabs>
        </article>

        <article className="min-w-0 rounded-md border border-border bg-card p-4 sm:p-5 lg:col-span-4">
          <div className="flex items-start justify-between gap-2">
            <div><h2 className="flex items-center gap-2 text-[12px] font-semibold sm:text-[13px]"><Users className="size-4 text-chart-4" /> Komposisi pendukung</h2><p className="mt-1 text-[10px] text-muted-foreground">Berdasarkan jenis kelamin</p></div>
            <Badge variant="secondary" className="h-5 px-1.5 text-[9px] font-medium">{formatNumber(genderTotal)} total</Badge>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <div className="relative grid size-[112px] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(var(--color-chart-1) 0 ${getGenderShare(genderTotal, sampleMetrics.men)}%, var(--color-chart-4) ${getGenderShare(genderTotal, sampleMetrics.men)}% 100%)` }} aria-label={`${getGenderShare(genderTotal, sampleMetrics.men)}% laki-laki, ${getGenderShare(genderTotal, sampleMetrics.women)}% perempuan`}>
              <div className="grid size-[82px] place-content-center rounded-full bg-card text-center"><span className="font-display text-[19px] font-semibold leading-none">{formatNumber(genderTotal)}</span><span className="mt-1 text-[8px] text-muted-foreground">pendukung</span></div>
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <GenderBreakdown label="Laki-laki" value={sampleMetrics.men} total={genderTotal} share={getGenderShare(genderTotal, sampleMetrics.men)} color="bg-chart-1" />
              <GenderBreakdown label="Perempuan" value={sampleMetrics.women} total={genderTotal} share={getGenderShare(genderTotal, sampleMetrics.women)} color="bg-chart-4" />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-[9px] text-muted-foreground">
            <span>Relawan perempuan</span><span className="font-semibold text-foreground">61% <span className="font-normal text-muted-foreground">(261 orang)</span></span>
          </div>
          <Button type="button" variant="ghost" onClick={() => onNavigate("supporters")} className="mt-2 h-8 w-full justify-between px-0 text-[10px] text-muted-foreground hover:text-foreground">Lihat detail pendukung <ChevronRight className="size-3.5" /></Button>
        </article>
      </section>

      <section aria-label="Aktivitas dan relawan" className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        <article className="rounded-md border border-border bg-card p-4 sm:p-5 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h2 className="flex items-center gap-2 text-[12px] font-semibold sm:text-[13px]"><Activity className="size-4 text-chart-2" /> Aktivitas terbaru</h2><p className="mt-1 text-[10px] text-muted-foreground">Pembaruan dari tim lapangan <span className="text-muted-foreground/55">(data contoh)</span></p></div>
            <Button type="button" variant="ghost" onClick={() => onNavigate("recap")} className="h-7 gap-1 px-2 text-[9px] text-muted-foreground">Lihat semua <ArrowRight className="size-3" /></Button>
          </div>
          <div className="mt-3">
            {sampleActivity.map((event, index) => <ActivityRow key={`${event.actor}-${event.action}`} event={event} last={index === sampleActivity.length - 1} />)}
          </div>
        </article>

        <article className="rounded-md border border-border bg-card p-4 sm:p-5 lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <div><h2 className="flex items-center gap-2 text-[12px] font-semibold sm:text-[13px]"><Users className="size-4 text-chart-3" /> Tim relawan unggulan</h2><p className="mt-1 text-[10px] text-muted-foreground">Berdasarkan pendukung yang direkrut</p></div>
            <Select value={teamView} onValueChange={setTeamView}>
              <SelectTrigger className="h-7 w-[110px] border-border text-[9px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="semua">Semua peran</SelectItem><SelectItem value="Koordinator kecamatan">Koorcam</SelectItem><SelectItem value="Koordinator desa">Kordes</SelectItem><SelectItem value="Koordinator lapangan">Korlap</SelectItem><SelectItem value="Relawan">Relawan</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="mt-3">
            {filteredTeam.map((member, index) => <TeamRow key={`${member.name}-${index}`} member={member} index={index} />)}
          </div>
          <Button type="button" variant="outline" onClick={() => onNavigate("volunteers")} className="mt-2 h-8 w-full gap-1.5 border-border text-[10px]">Kelola semua relawan <ArrowRight className="size-3" /></Button>
        </article>
      </section>

      <section aria-label="Ringkasan kesiapan TPS" className="flex flex-col gap-3 rounded-md border border-border bg-card px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-chart-3/10 text-chart-3"><ShieldCheck className="size-4" /></span>
          <div><p className="text-[11px] font-semibold">Kesiapan seluruh TPS <span className="ml-1 text-[9px] font-normal text-muted-foreground">· data simulasi</span></p><p className="mt-1 text-[10px] text-muted-foreground">{formatNumber(sampleMetrics.reportingStations)} dari {formatNumber(sampleMetrics.stations)} TPS telah mengirim pembaruan</p></div>
        </div>
        <div className="flex items-center gap-3 sm:w-[240px]">
          <Progress value={getVoteProgress(sampleMetrics.stations, sampleMetrics.reportingStations)} className="h-2 flex-1 bg-secondary [&>div]:bg-chart-3" />
          <span className="w-9 text-right text-[11px] font-semibold">{getVoteProgress(sampleMetrics.stations, sampleMetrics.reportingStations)}%</span>
          <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("field")} className="h-8 gap-1 px-2.5 text-[9px]">Lihat TPS <ArrowRight className="size-3" /></Button>
        </div>
      </section>
    </div>
  );
}

function DistrictRow({ ward, onClick }: { ward: Ward; onClick: () => void }) {
  const progress = getVoteProgress(ward.target, ward.counted);
  return (
    <tr onClick={onClick} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onClick(); }} tabIndex={0} role="button" aria-label={`Lihat data TPS kecamatan ${ward.name}`} className="h-[43px] cursor-pointer border-b border-border/70 outline-none transition-colors hover:bg-muted/35 focus-visible:bg-muted/50">
      <td className="px-2"><span className="flex items-center gap-2 font-semibold"><span className={`size-1.5 rounded-full ${ward.online ? "bg-chart-2" : "bg-muted-foreground/40"}`} />{ward.name}</span><span className="pl-3.5 text-[8px] text-muted-foreground">{ward.stations} TPS · {formatShort(ward.dpt)} DPT</span></td>
      <td className="px-2"><div className="flex items-center justify-between gap-2"><span><b className="font-semibold">{formatNumber(ward.counted)}</b><span className="text-[8px] text-muted-foreground"> / {formatNumber(ward.target)}</span></span><span className="w-8 text-right text-[9px] font-medium text-muted-foreground">{progress}%</span></div><Progress value={progress} className="mt-1.5 h-1 bg-secondary [&>div]:bg-chart-1" /></td>
      <td className="px-2"><span className="font-semibold">{formatNumber(ward.support)}</span><span className="block text-[8px] text-muted-foreground">{ward.volunteers} relawan</span></td>
      <td className="px-2 text-right"><span className="font-semibold">{Math.round(ward.stations * (0.72 + ward.counted / Math.max(ward.target, 1) * 0.25))}</span><span className="text-muted-foreground"> /{ward.stations}</span></td>
    </tr>
  );
}

function StationList({ ward }: { ward: Ward | undefined }) {
  if (!ward) return <p className="py-6 text-center text-xs text-muted-foreground">Data TPS untuk wilayah ini belum tersedia.</p>;
  const stations = [
    { number: "001", desa: "Pabean", target: 146, counted: 127, status: "Laporan masuk" },
    { number: "002", desa: "Pabean", target: 138, counted: 101, status: "Laporan masuk" },
    { number: "003", desa: "Kedungrejo", target: 152, counted: 0, status: "Menunggu laporan" },
    { number: "004", desa: "Kedungrejo", target: 124, counted: 96, status: "Laporan masuk" },
  ];
  return (
    <div className="divide-y divide-border/70">
      <div className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p className="text-[11px] font-semibold">TPS · {ward.name}</p><p className="mt-1 text-[9px] text-muted-foreground">{ward.stations} TPS · {formatNumber(ward.dpt)} DPT · {formatNumber(ward.target)} target</p></div><Badge variant="secondary" className="text-[8px]">SIMULASI</Badge></div>
      {stations.map((station) => <div key={station.number} className="grid min-h-11 grid-cols-[38px_1fr_1fr_auto] items-center gap-2 py-2 text-[9px] sm:text-[10px]"><span className="rounded bg-secondary px-1.5 py-1 text-center font-mono font-semibold">{station.number}</span><span><b>{station.desa}</b><span className="block text-[8px] text-muted-foreground">TPS {station.number}</span></span><span>{station.counted ? <><b>{station.counted}</b><span className="text-muted-foreground"> / {station.target} suara</span></> : <span className="text-muted-foreground">Target {station.target}</span>}</span><span className={`text-right text-[8px] ${station.counted ? "text-chart-2" : "text-chart-4"}`}>{station.counted ? <Check className="ml-auto size-3" /> : station.status}</span></div>)}
      <Button type="button" variant="ghost" className="h-8 w-full justify-center gap-1 text-[9px] text-muted-foreground">Buka daftar TPS {ward.name} <ArrowRight className="size-3" /></Button>
    </div>
  );
}

function GenderBreakdown({ label, value, total, share, color }: { label: string; value: number; total: number; share: number; color: string }) {
  return <div><div className="mb-1.5 flex items-center justify-between gap-2 text-[9px]"><span className="flex items-center gap-1.5 text-muted-foreground"><span className={`size-2 rounded-full ${color}`} />{label}</span><span className="font-semibold text-foreground">{formatNumber(value)} <span className="font-normal text-muted-foreground">{share}%</span></span></div><div className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${color}`} style={{ width: `${getGenderShare(total, value)}%` }} /></div></div>;
}

function ActivityRow({ event, last }: { event: (typeof sampleActivity)[number]; last: boolean }) {
  const Icon = event.icon === "support" ? Handshake : event.icon === "target" ? Target : event.icon === "team" ? Users : Vote;
  const tint = event.icon === "support" ? "text-chart-2 bg-chart-2/10" : event.icon === "target" ? "text-chart-3 bg-chart-3/10" : event.icon === "team" ? "text-chart-4 bg-chart-4/15" : "text-chart-1 bg-chart-1/10";
  return <div className={`flex items-start gap-3 py-2.5 ${last ? "" : "border-b border-border/65"}`}><span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded ${tint}`}><Icon className="size-3.5" /></span><div className="min-w-0 flex-1"><p className="truncate text-[10px] leading-relaxed"><b className="font-semibold">{event.actor}</b> <span className="text-muted-foreground">{event.action}</span></p><p className="mt-0.5 text-[9px] text-muted-foreground">{event.area}</p></div><span className="shrink-0 pt-1 text-[8px] text-muted-foreground">{event.time}</span></div>;
}

function TeamRow({ member, index }: { member: TeamMember; index: number }) {
  return <div className="flex min-h-[48px] items-center gap-2.5 border-b border-border/70 py-2 last:border-0"><span className="w-4 text-[9px] font-semibold text-muted-foreground/65">0{index + 1}</span><Avatar className="size-8 shrink-0 border border-border"><AvatarFallback className={`text-[9px] font-semibold ${member.color}`}>{member.initials}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-semibold">{member.name}</p><p className="mt-0.5 truncate text-[9px] text-muted-foreground">{member.role} · {member.area}</p></div><div className="shrink-0 text-right"><p className="text-[10px] font-semibold">{member.recruits}</p><p className="text-[8px] text-muted-foreground">rekrutan</p></div><span className={`ml-1 size-1.5 shrink-0 rounded-full ${member.online ? "bg-chart-2" : "bg-muted-foreground/35"}`} /></div>;
}

function FieldDataContent({ onNavigate, setSupporters, setWards }: { onNavigate: (key: ViewKey) => void; setSupporters: React.Dispatch<React.SetStateAction<SupporterRecord[]>>; setWards: React.Dispatch<React.SetStateAction<Ward[]>> }) {
  const [active, setActive] = useState<FieldKey>("supporters");
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [showManualNik, setShowManualNik] = useState(false);
  const [nik, setNik] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("Perempuan");
  const [stationVotes, setStationVotes] = useState("368");
  const [station, setStation] = useState("TPS 014 · Desa Tropodo");
  const captureRef = useRef<HTMLInputElement | null>(null);
  const nikInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => () => { if (selectedImage) URL.revokeObjectURL(selectedImage); }, [selectedImage]);

  const handlePhoto = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setFormError("Pilih foto KTP dalam format gambar."); return; }
    if (file.size > 8 * 1024 * 1024) { setFormError("Ukuran foto maksimal 8 MB."); return; }
    const nextUrl = URL.createObjectURL(file);
    setSelectedImage((current) => { if (current) URL.revokeObjectURL(current); return nextUrl; });
    setShowManualNik(true);
    setFormError("Foto tersimpan sementara di perangkat. Teks KTP tidak dibaca otomatis dalam mode contoh; periksa NIK dan nama sebelum menyimpan.");
    window.setTimeout(() => nikInputRef.current?.focus(), 100);
  };

  const submitSupporter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    const normalizedNik = nik.replace(/\s/g, "");
    if (!isValidNikShape(normalizedNik)) { setFormError("NIK harus berisi tepat 16 angka."); return; }
    if (phone.trim().replace(/\D/g, "").length < 9) { setFormError("Masukkan nomor WhatsApp yang valid."); return; }
    setSaving(true);
    try {
      const fingerprint = await hashNikFingerprint(normalizedNik);
      const duplicate = isDuplicateFingerprint(getLocalNikFingerprints(), fingerprint);
      const newRecord: SupporterRecord = {
        id: fingerprint.slice(0, 12),
        name: name.trim() || "Pendukung baru",
        phone: phone.trim(),
        area: "Kecamatan Waru",
        gender,
        dpt: "Perlu verifikasi",
        added: "Baru saja",
      };
      const { data: sessionResult } = await supabase.auth.getSession();
      const user = sessionResult.session?.user;

      if (user) {
        const { data: membership } = await campaignDataClient
          .from("candidate_memberships")
          .select("candidate_id, can_input_supporters")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (!membership?.can_input_supporters) {
          setFormError("Akun ini belum memiliki izin input pendukung pada kampanye aktif.");
          return;
        }
        if (duplicate) {
          setFormError("NIK ini sudah pernah dicoba di perangkat ini. Gunakan akun tim yang diundang untuk pengecekan terpusat.");
          return;
        }
        const { error } = await campaignDataClient.rpc("register_supporter", {
          p_candidate_id: membership.candidate_id,
          p_nik: normalizedNik,
          p_name: newRecord.name,
          p_phone: phone.trim(),
          p_address: address.trim() || null,
          p_gender: gender,
          p_ward: "Waru",
          p_source: "field-entry",
        });
        if (error) throw new Error("Data belum dapat disimpan. Periksa kembali izin akun kampanye dan koneksi.");
      } else {
        if (duplicate) { setFormError("NIK ini sudah pernah dicoba di perangkat ini; data kedua ditolak."); return; }
        saveLocalNikFingerprint(fingerprint);
      }

      setSupporters((current) => [newRecord, ...current]);
      setWards((current) => current.map((ward) => ward.name === "Waru" ? { ...ward, support: ward.support + 1 } : ward));
      toast.success("Pendukung tercatat", { description: user ? "Data masuk ke kampanye yang terhubung." : "Tersimpan di pratinjau lokal perangkat ini saja." });
      setNik(""); setName(""); setPhone(""); setAddress(""); setSelectedImage((current) => { if (current) URL.revokeObjectURL(current); return null; }); setShowManualNik(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Data belum dapat disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const submitCount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(stationVotes);
    if (!Number.isInteger(value) || value < 0 || value > 10_000) return;
    setWards((current) => current.map((ward) => ward.name === "Waru" ? { ...ward, counted: ward.counted + value } : ward));
    toast.success("Laporan TPS tercatat", { description: "Satu laporan diperbarui di pratinjau perangkat." });
    onNavigate("overview");
  };

  return (
    <div className="space-y-5 pb-7">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded bg-brand-soft px-2 py-1 text-[9px] font-semibold tracking-[0.06em] text-brand-strong"><Smartphone className="size-3" /> ALUR LAPANGAN</span>
        <h1 className="mt-3 font-display text-[25px] font-semibold leading-tight sm:text-[31px]">Input data lapangan</h1>
        <p className="mt-1.5 max-w-2xl text-[11px] text-muted-foreground sm:text-xs">Daftarkan pendukung atau sampaikan rekap suara TPS dari perangkat Anda.</p>
      </div>
      <div className="rounded-md border border-chart-4/25 bg-chart-4/5 px-3.5 py-3 sm:px-4">
        <p className="flex items-start gap-2 text-[10px] leading-relaxed text-foreground sm:text-[11px]"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-chart-4" /><span><b>Mode contoh, data pribadi dilindungi.</b> Foto KTP, OCR, pencocokan DPT, dan pengecekan NIK lintas pengguna memerlukan kampanye terhubung. Jangan masukkan NIK asli di pratinjau ini.</span></p>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(290px,0.85fr)]">
        <div className="rounded-md border border-border bg-card p-4 sm:p-5">
          <div className="flex items-center gap-1.5 rounded-md bg-secondary/55 p-1" role="tablist" aria-label="Jenis input">
            <Button type="button" role="tab" aria-selected={active === "supporters"} variant={active === "supporters" ? "secondary" : "ghost"} onClick={() => setActive("supporters")} className={`h-9 flex-1 gap-2 text-[10px] sm:text-[11px] ${active === "supporters" ? "bg-background shadow-sm" : "text-muted-foreground"}`}><HeartHandshake className="size-3.5" />Data pendukung</Button>
            <Button type="button" role="tab" aria-selected={active === "count"} variant={active === "count" ? "secondary" : "ghost"} onClick={() => setActive("count")} className={`h-9 flex-1 gap-2 text-[10px] sm:text-[11px] ${active === "count" ? "bg-background shadow-sm" : "text-muted-foreground"}`}><Vote className="size-3.5" />Hasil suara TPS</Button>
          </div>

          {active === "supporters" ? (
            <form onSubmit={submitSupporter} className="mt-5 space-y-4">
              <div><h2 className="text-[13px] font-semibold">Pendaftaran pendukung</h2><p className="mt-1 text-[10px] text-muted-foreground">Data contoh tersimpan di perangkat ini. Data sebenarnya hanya disimpan jika kampanye dan izin akun tersedia.</p></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[10px] font-medium" htmlFor="ktp-photo">Foto KTP</label>
                  <input ref={captureRef} id="ktp-photo" type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => handlePhoto(event.target.files?.[0])} />
                  <button type="button" onClick={() => captureRef.current?.click()} className="flex min-h-[132px] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-md border border-dashed border-border bg-muted/25 px-4 text-center transition-colors hover:border-chart-2/50 hover:bg-chart-2/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {selectedImage ? <img src={selectedImage} alt="Pratinjau foto KTP" className="h-[128px] w-full rounded object-contain" /> : <><span className="grid size-9 place-items-center rounded-md border border-border bg-background text-muted-foreground"><IdCard className="size-[18px]" /></span><span className="text-[10px] font-semibold">Ambil foto atau pilih foto KTP</span><span className="text-[9px] text-muted-foreground">Kamera ponsel tersedia · maksimal 8 MB</span></>}
                  </button>
                  {!showManualNik && <Button type="button" variant="link" onClick={() => setShowManualNik(true)} className="mt-1 h-7 px-0 text-[9px] text-chart-1">Isi manual tanpa foto</Button>}
                </div>
                {showManualNik && <>
                  <div className="sm:col-span-2"><label className="mb-1.5 block text-[10px] font-medium" htmlFor="nik-field">NIK <span className="text-destructive">*</span></label><Input ref={nikInputRef} value={nik} onChange={(event) => setNik(event.target.value.replace(/[^\d ]/g, "").slice(0, 19))} id="nik-field" inputMode="numeric" maxLength={19} placeholder="16 digit nomor induk kependudukan" className="h-10 text-xs tabular-nums" autoComplete="off" required /></div>
                  <div><label className="mb-1.5 block text-[10px] font-medium" htmlFor="supporter-name">Nama lengkap <span className="text-destructive">*</span></label><Input value={name} onChange={(event) => setName(event.target.value)} id="supporter-name" placeholder="Nama sesuai KTP" className="h-10 text-xs" required /></div>
                  <div><label className="mb-1.5 block text-[10px] font-medium" htmlFor="supporter-phone">WhatsApp <span className="text-destructive">*</span></label><Input value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^\d+]/g, "").slice(0, 16))} id="supporter-phone" inputMode="tel" placeholder="08xx xxxx xxxx" className="h-10 text-xs" required /></div>
                  <div><label className="mb-1.5 block text-[10px] font-medium" htmlFor="supporter-address">Alamat</label><Input value={address} onChange={(event) => setAddress(event.target.value)} id="supporter-address" placeholder="Desa, RT/RW" className="h-10 text-xs" /></div>
                  <div><label className="mb-1.5 block text-[10px] font-medium" htmlFor="supporter-gender">Jenis kelamin</label><Select value={gender} onValueChange={setGender}><SelectTrigger id="supporter-gender" className="h-10 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Perempuan">Perempuan</SelectItem><SelectItem value="Laki-laki">Laki-laki</SelectItem><SelectItem value="Belum diketahui">Belum diketahui</SelectItem></SelectContent></Select></div>
                </>}
              </div>
              {showManualNik && <div className="rounded-md bg-muted/35 px-3 py-2 text-[9px] leading-relaxed text-muted-foreground"><span className="flex items-start gap-1.5"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-chart-2" />NIK tidak ditampilkan pada ringkasan pendukung. Sistem demo ini hanya mendeteksi pengulangan pada perangkat lokal dan belum menggantikan pemeriksaan terpusat di backend.</span></div>}
              {formError && <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-[10px] leading-relaxed text-destructive">{formError}</p>}
              <Button type="submit" disabled={!showManualNik || saving} className="h-10 w-full gap-2 text-[11px] font-semibold"><Plus className="size-3.5" />{saving ? "Memproses…" : "Simpan pendukung"}</Button>
              <p className="text-center text-[8px] leading-relaxed text-muted-foreground">Masukkan hanya data dengan persetujuan pemilik identitas. Mode ini menyimpan daftar simulasi di perangkat.</p>
            </form>
          ) : (
            <form onSubmit={submitCount} className="mt-5 space-y-4">
              <div><h2 className="text-[13px] font-semibold">Laporan suara TPS</h2><p className="mt-1 text-[10px] text-muted-foreground">Masukkan hasil pemantauan TPS yang menjadi tanggung jawab Anda.</p></div>
              <div className="rounded-md bg-chart-2/5 px-3 py-3 text-[10px] leading-relaxed text-muted-foreground"><span className="flex gap-2"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-chart-2" /><span><b className="text-foreground">Akses terbatas.</b> Relawan TPS hanya dapat mengirim laporan untuk titik yang diberikan koordinator.</span></span></div>
              <div><label className="mb-1.5 block text-[10px] font-medium" htmlFor="station-select">TPS yang ditugaskan</label><Select value={station} onValueChange={setStation}><SelectTrigger id="station-select" className="h-10 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TPS 014 · Desa Tropodo">TPS 014 · Desa Tropodo</SelectItem><SelectItem value="TPS 019 · Desa Tropodo">TPS 019 · Desa Tropodo</SelectItem><SelectItem value="TPS 007 · Desa Tropodo">TPS 007 · Desa Tropodo</SelectItem></SelectContent></Select></div>
              <div><label className="mb-1.5 block text-[10px] font-medium" htmlFor="station-votes">Suara calon nomor 02</label><Input id="station-votes" type="number" inputMode="numeric" min={0} max={10000} value={stationVotes} onChange={(event) => setStationVotes(event.target.value)} className="h-10 text-xs" required /></div>
              <div><label className="mb-1.5 block text-[10px] font-medium" htmlFor="station-notes">Catatan saksi <span className="font-normal text-muted-foreground">(opsional)</span></label><Input id="station-notes" placeholder="Keterangan singkat dari TPS" className="h-10 text-xs" /></div>
              <Button type="submit" className="h-10 w-full gap-2 text-[11px] font-semibold"><Vote className="size-3.5" />Kirim laporan TPS <ArrowRight className="size-3.5" /></Button>
              <p className="text-center text-[8px] leading-relaxed text-muted-foreground">Contoh ini hanya mengubah angka simulasi di sesi perangkat yang sedang dibuka.</p>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-md border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2"><div><h2 className="text-[11px] font-semibold">Pemantauan lapangan</h2><p className="mt-1 text-[9px] text-muted-foreground">Aktivitas hari ini</p></div><Activity className="size-4 text-chart-2" /></div>
            <div className="mt-4 grid grid-cols-2 gap-2.5"><MetricCard label="TPS berlapor" value="1.584" note="dari 2.056 TPS · contoh" icon={Map} /><MetricCard label="Suara dihimpun" value="68.421" note="dari target 91.500" icon={Vote} /><MetricCard label="Pendukung masuk" value="17.284" note="dari 428 relawan" icon={HeartHandshake} /><MetricCard label="Perlu verifikasi" value="38" note="Data DPT simulasi" icon={BadgeCheck} /></div>
          </div>
          <div className="rounded-md border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-chart-3" /><h2 className="text-[11px] font-semibold">Posisi lapangan</h2></div>
            <p className="mt-1.5 text-[9px] text-muted-foreground">Sebaran koordinator dan TPS · data ilustrasi</p>
            <div className="mt-3 grid grid-cols-[82px_repeat(3,minmax(0,1fr))] items-center gap-1 border-b border-border pb-2 text-center text-[8px] text-muted-foreground"><span className="text-left">KECAMATAN</span><span>KORDES</span><span>KORLAP</span><span>TPS</span></div>
            {sampleWards.slice(0, 5).map((ward, index) => <div key={ward.name} className="grid min-h-9 grid-cols-[82px_repeat(3,minmax(0,1fr))] items-center gap-1 border-b border-border/60 text-center text-[9px] last:border-0"><span className="truncate text-left font-medium">{ward.name}</span><span>{[12, 16, 14, 11, 13][index]}</span><span>{Math.round(ward.volunteers / 3)}</span><span className={`font-semibold ${index < 3 ? "text-chart-2" : "text-chart-4"}`}>{Math.round((ward.counted / ward.target) * 100)}%</span></div>)}
            <Button type="button" variant="ghost" onClick={() => onNavigate("overview")} className="mt-2 h-7 w-full text-[9px] text-muted-foreground">Buka rekap wilayah <ArrowRight className="ml-1 size-3" /></Button>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-chart-2/20 bg-chart-2/5 px-3.5 py-3 text-[9px] leading-relaxed text-muted-foreground"><Cloud className="size-3.5 shrink-0 text-chart-2" /><span><b className="text-foreground">Sinkronisasi contoh.</b> Laporan persisten akan aktif saat akses kampanye dan data akun telah diatur.</span></div>
        </aside>
      </div>
    </div>
  );
}

function SupportersContent({ records }: { records: SupporterRecord[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("semua");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<SupporterRecord | null>(null);
  const filtered = useMemo(() => records.filter((record) => record.name.toLowerCase().includes(query.toLowerCase()) && (status === "semua" || record.dpt === status)), [records, query, status]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 7));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * 7, currentPage * 7);
  return (
    <div className="space-y-5 pb-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><span className="inline-flex rounded bg-brand-soft px-2 py-1 text-[9px] font-semibold tracking-[0.06em] text-brand-strong">ORGANISASI</span><h1 className="mt-3 font-display text-[25px] font-semibold sm:text-[31px]">Data pendukung</h1><p className="mt-1.5 text-[11px] text-muted-foreground">Pantau rekrutmen relawan dan daftar pendukung. Data pribadi disembunyikan pada daftar.</p></div>
        <span className="inline-flex items-center gap-2 self-start rounded-md border border-border bg-card px-3 py-2 text-[9px] font-medium text-muted-foreground sm:self-auto"><ShieldCheck className="size-3.5 text-chart-2" />NIK tidak pernah tampil di tabel</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4"><MetricCard label="Total pendukung" value={formatNumber(records.length + sampleMetrics.supporters)} note="seluruh kecamatan" icon={HeartHandshake} /><MetricCard label="Laki-laki" value={formatNumber(sampleMetrics.men)} note={`${getGenderShare(sampleMetrics.women + sampleMetrics.men, sampleMetrics.men)}% dari total`} icon={Users} /><MetricCard label="Perempuan" value={formatNumber(sampleMetrics.women)} note={`${getGenderShare(sampleMetrics.women + sampleMetrics.men, sampleMetrics.women)}% dari total`} icon={Users} /><MetricCard label="Perlu verifikasi" value="38" note="cocokkan dengan daftar pemilih" icon={BadgeCheck} /></div>
      <section className="rounded-md border border-border bg-card p-3.5 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-[12px] font-semibold">Daftar pendukung</h2><p className="mt-1 text-[9px] text-muted-foreground">{filtered.length} catatan · Mode contoh, identitas disamarkan</p></div><div className="flex items-center gap-2"><label className="relative flex-1 sm:w-[180px]"><Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Cari nama pendukung" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Cari nama" className="h-9 pl-8 text-[10px]" /></label><Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}><SelectTrigger aria-label="Filter status DPT" className="h-9 w-[148px] text-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="semua">Semua status</SelectItem><SelectItem value="Terverifikasi">Terverifikasi DPT</SelectItem><SelectItem value="Perlu verifikasi">Perlu verifikasi</SelectItem></SelectContent></Select></div></div>
        <div className="overflow-x-auto"><Table className="min-w-[720px]"><TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead className="h-9 text-[9px] font-medium">NAMA</TableHead><TableHead className="h-9 text-[9px] font-medium">WHATSAPP</TableHead><TableHead className="h-9 text-[9px] font-medium">WILAYAH</TableHead><TableHead className="h-9 text-[9px] font-medium">KELAMIN</TableHead><TableHead className="h-9 text-[9px] font-medium">STATUS DPT</TableHead><TableHead className="h-9 text-right text-[9px] font-medium">DITAMBAHKAN</TableHead></TableRow></TableHeader><TableBody>{visible.map((record) => <TableRow key={record.id} onClick={() => setDetail(record)} className="h-12 cursor-pointer border-border/70 hover:bg-muted/30"><TableCell className="text-[10px] font-semibold">{record.name}</TableCell><TableCell className="font-mono text-[9px] text-muted-foreground">••• •••• {record.phone.slice(-4)}</TableCell><TableCell className="text-[10px] text-muted-foreground">{record.area}</TableCell><TableCell className="text-[10px] text-muted-foreground">{record.gender}</TableCell><TableCell><Badge variant="outline" className={`h-5 gap-1 px-1.5 text-[8px] ${record.dpt === "Terverifikasi" ? "border-chart-2/25 bg-chart-2/5 text-chart-2" : "border-chart-4/30 bg-chart-4/5 text-chart-4"}`}><span className={`size-1 rounded-full ${record.dpt === "Terverifikasi" ? "bg-chart-2" : "bg-chart-4"}`} />{record.dpt}</Badge></TableCell><TableCell className="text-right text-[9px] text-muted-foreground">{record.added}</TableCell></TableRow>)}{visible.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center text-[10px] text-muted-foreground">Belum ada pendukung di halaman ini. Data contoh masih ditampilkan.</TableCell></TableRow>}</TableBody></Table></div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 text-[9px] text-muted-foreground"><span>Halaman {currentPage} dari {totalPages} · {filtered.length} catatan</span><div className="flex items-center gap-1"><Button type="button" variant="outline" size="icon" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Halaman sebelumnya" className="size-7"><ChevronLeft className="size-3.5" /></Button><Button type="button" variant="outline" size="icon" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} aria-label="Halaman berikutnya" className="size-7"><ChevronRight className="size-3.5" /></Button></div></div>
      </section>
      <Dialog open={Boolean(detail)} onOpenChange={(open) => { if (!open) setDetail(null); }}><DialogContent><DialogHeader><DialogTitle className="text-base">Detail pendukung</DialogTitle><DialogDescription className="text-xs">Data tersimpan sebagai contoh pratinjau.</DialogDescription></DialogHeader>{detail && <div className="space-y-3 text-sm"><div><span className="text-xs text-muted-foreground">Nama</span><p className="mt-1 font-medium">{detail.name}</p></div><div><span className="text-xs text-muted-foreground">NIK</span><p className="mt-1 font-mono text-muted-foreground">Tidak dapat ditampilkan</p></div><div><span className="text-xs text-muted-foreground">WhatsApp</span><p className="mt-1">••• •••• {detail.phone.slice(-4)}</p></div><div><span className="text-xs text-muted-foreground">Status DPT</span><p className="mt-1">{detail.dpt}</p></div></div>}<Button type="button" variant="outline" onClick={() => setDetail(null)} className="w-full">Tutup</Button></DialogContent></Dialog>
    </div>
  );
}

function HierarchyTree({ member, level = 0 }: { member: TeamMember; level?: number }) {
  const [open, setOpen] = useState(level === 0);
  const children = (level === 0 ? [sampleTeam[1], sampleTeam[2]] : level === 1 ? [sampleTeam[3], sampleTeam[4]] : []).filter((child): child is TeamMember => child !== undefined);
  return <div className="relative"><div className="relative flex items-center gap-2.5 rounded-md border border-border/75 bg-card px-3 py-2.5" style={{ marginLeft: `${Math.min(level, 2) * 13}px` }}><span className="grid size-8 shrink-0 place-items-center rounded-full text-[9px] font-semibold"> <span className={`grid size-full place-items-center rounded-full ${member.color}`}>{member.initials}</span></span><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-semibold">{member.name}</p><p className="mt-0.5 truncate text-[9px] text-muted-foreground">{member.role} · {member.area}</p></div><span className="shrink-0 text-right"><span className="block text-[10px] font-semibold">{member.recruits}</span><span className="text-[8px] text-muted-foreground">pendukung</span></span>{children.length > 0 && <Button type="button" variant="ghost" size="icon" aria-label={`${open ? "Tutup" : "Buka"} bawahan ${member.name}`} onClick={() => setOpen((value) => !value)} className="size-7"><ChevronDown className={`size-3.5 transition-transform ${open ? "" : "-rotate-90"}`} /></Button>}</div>{open && children.length > 0 && <div className="relative mt-1.5 space-y-1.5 border-l border-dashed border-border pl-3" style={{ marginLeft: `${15 + Math.min(level, 2) * 13}px` }}>{children.map((child, index) => <HierarchyTree key={`${child.name}-${index}`} member={child} level={level + 1} />)}</div>}</div>;
}

function VolunteersContent({ onNavigate }: { onNavigate: (key: ViewKey) => void }) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("semua");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState("Relawan");
  const [canSupport, setCanSupport] = useState(true);
  const [canCount, setCanCount] = useState(false);
  const [members, setMembers] = useState(sampleTeam);
  const filtered = members.filter((member) => `${member.name} ${member.area}`.toLowerCase().includes(search.toLowerCase()) && (level === "semua" || member.role === level));
  const submitInvite = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setMembers((current) => [{ name: inviteName.trim(), initials: inviteName.trim().split(/\s+/).slice(0, 2).map((item) => item[0]).join("").toUpperCase(), role: inviteRole, area: "Belum ditentukan", recruits: 0, online: false, color: "bg-chart-4/20 text-foreground" }, ...current]); toast.info("Undangan demo disiapkan", { description: "Penyampaian undangan akun memerlukan administrator yang berwenang." }); setInviteName(""); setInvitePhone(""); setInviteOpen(false); };
  return (
    <div className="space-y-5 pb-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><span className="inline-flex rounded bg-brand-soft px-2 py-1 text-[9px] font-semibold tracking-[0.06em] text-brand-strong">ORGANISASI</span><h1 className="mt-3 font-display text-[25px] font-semibold sm:text-[31px]">Struktur relawan</h1><p className="mt-1.5 text-[11px] text-muted-foreground">Jaringan kerja berjenjang dari kecamatan sampai relawan TPS.</p></div><Dialog open={inviteOpen} onOpenChange={setInviteOpen}><DialogTrigger asChild><Button type="button" className="h-9 gap-2 self-start px-3 text-[10px] sm:self-auto"><Plus className="size-3.5" />Tambah anggota</Button></DialogTrigger><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"><form onSubmit={submitInvite} className="space-y-4"><DialogHeader><DialogTitle>Tambahkan anggota tim</DialogTitle><DialogDescription>Pilih peran dan akses yang sesuai tanggung jawab lapangan.</DialogDescription></DialogHeader><div className="space-y-3"><label className="block space-y-1.5"><span className="text-[10px] font-medium">Nama lengkap</span><Input value={inviteName} onChange={(event) => setInviteName(event.target.value)} placeholder="Nama anggota" required /></label><label className="block space-y-1.5"><span className="text-[10px] font-medium">Nomor WhatsApp</span><Input value={invitePhone} onChange={(event) => setInvitePhone(event.target.value.replace(/[^\d+]/g, ""))} inputMode="tel" placeholder="08xx xxxx xxxx" required /></label><label className="block space-y-1.5"><span className="text-[10px] font-medium">Peran di tim</span><Select value={inviteRole} onValueChange={setInviteRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Koordinator kecamatan">Koordinator kecamatan (Koorcam)</SelectItem><SelectItem value="Koordinator desa">Koordinator desa (Kordes)</SelectItem><SelectItem value="Koordinator lapangan">Koordinator lapangan (Korlap)</SelectItem><SelectItem value="Relawan">Relawan</SelectItem></SelectContent></Select></label><fieldset className="rounded-md border border-border p-3"><legend className="px-1 text-[10px] font-medium">Akses relawan</legend>{[{ value: canSupport, setter: setCanSupport, label: "Input data pendukung" }, { value: canCount, setter: setCanCount, label: "Input hasil suara TPS" }].map((item) => <label key={item.label} className="flex min-h-9 cursor-pointer items-center gap-2.5 text-[10px]"><input type="checkbox" checked={item.value} onChange={(event) => item.setter(event.target.checked)} className="size-3.5 accent-[var(--color-chart-2)]" />{item.label}</label>)}</fieldset><p className="flex gap-1.5 rounded-md bg-chart-4/5 p-2.5 text-[9px] leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-chart-4" />Mode pratinjau menambahkan baris lokal saja. Undangan, akses server, dan batas lokasi wajib diaktifkan oleh pengelola kampanye.</p></div><DialogFooter><Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Batal</Button><Button type="submit" disabled={!canSupport && !canCount}>Tambahkan anggota</Button></DialogFooter></form></DialogContent></Dialog></div>
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4"><MetricCard label="Jumlah anggota" value="428" note="aktif di seluruh wilayah" icon={Users} /><MetricCard label="Koorcam" value="18" note="kecamatan terkoordinasi" icon={Map} /><MetricCard label="Kordes" value="164" note="desa dan kelurahan" icon={Layers3} /><MetricCard label="Relawan lapangan" value="246" note="115 bertugas TPS" icon={Smartphone} /></div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]"><section className="rounded-md border border-border bg-card p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-[12px] font-semibold">Hierarki tim</h2><p className="mt-1 text-[9px] text-muted-foreground">Contoh hubungan koordinator dan relawan</p></div><Badge variant="secondary" className="text-[8px]">18 KECAMATAN</Badge></div><div className="mt-4 rounded-md bg-chart-4/5 px-3 py-2 text-[9px] leading-relaxed text-chart-4">Struktur dan angka pada tampilan ini hanya simulasi; bukan penetapan atau penugasan nyata.</div><div className="mt-3 space-y-1.5">{sampleTeam.slice(0, 1).map((member, index) => <HierarchyTree key={`${member.name}-${index}`} member={member} />)}</div><div className="mt-4 grid grid-cols-2 gap-2"><Button type="button" variant="outline" onClick={() => onNavigate("field")} className="h-8 gap-1.5 text-[9px]"><Map className="size-3" />Peta penugasan</Button><Button type="button" variant="outline" onClick={() => onNavigate("recap")} className="h-8 gap-1.5 text-[9px]"><ClipboardList className="size-3" />Lihat laporan</Button></div></section>
        <section className="rounded-md border border-border bg-card p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-[12px] font-semibold">Daftar anggota</h2><p className="mt-1 text-[9px] text-muted-foreground">Status dan wilayah koordinasi · data contoh</p></div><Badge variant="outline" className="border-chart-2/20 text-[8px] text-chart-2">428 ANGGOTA</Badge></div><div className="mt-4 flex gap-2"><label className="relative flex-1"><Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Cari relawan" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau wilayah" className="h-9 pl-8 text-[10px]" /></label><Select value={level} onValueChange={setLevel}><SelectTrigger aria-label="Filter peran relawan" className="h-9 w-[145px] text-[9px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="semua">Semua tingkatan</SelectItem><SelectItem value="Koordinator kecamatan">Koorcam</SelectItem><SelectItem value="Koordinator desa">Kordes</SelectItem><SelectItem value="Koordinator lapangan">Korlap</SelectItem><SelectItem value="Relawan">Relawan</SelectItem></SelectContent></Select></div><div className="mt-2">{filtered.map((member, index) => <TeamRow key={`${member.name}-${index}`} member={member} index={index} />)}{!filtered.length && <div className="py-10 text-center text-[10px] text-muted-foreground">Belum ada anggota yang sesuai.</div>}</div><div className="mt-3 border-t border-border pt-3"><Button type="button" variant="outline" onClick={() => onNavigate("supporters")} className="h-8 w-full gap-1.5 text-[9px]">Lihat rekrutan pendukung <ArrowRight className="size-3" /></Button></div></section></div>
    </div>
  );
}

function ReportsContent({ supporters, wards }: { supporters: SupporterRecord[]; wards: Ward[] }) {
  const [toastOpen, setToastOpen] = useState(false);
  const [createdOn, setCreatedOn] = useState("");
  const safeName = (value: string) => value.replace(/[^a-z\d-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
  const downloadFile = (fileName: string, data: string, mime: string) => { const blob = new Blob([data], { type: mime }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = fileName; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1500); };
  const exportSupporters = () => { const data = [["Nama", "WhatsApp tersamarkan", "Wilayah", "Jenis kelamin", "Status DPT", "Waktu masuk"], ...supporters.map((record) => [record.name, `••••••${record.phone.slice(-4)}`, record.area, record.gender, record.dpt, record.added])]; const csv = data.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n"); downloadFile(`${safeName(sampleElection.title)}-pendukung.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8"); toast.success("Laporan pendukung diunduh", { description: "Kolom NIK dan foto KTP tidak disertakan." }); };
  const exportWards = async () => { const rows = wards.map((ward) => ({ "Kecamatan": ward.name, "DPT": ward.dpt, "Target suara": ward.target, "Suara masuk": ward.counted, "Pendukung": ward.support, "Jumlah relawan": ward.volunteers, "Jumlah TPS": ward.stations, "Contoh data": "YA" })); const xlsx = await import("xlsx"); const sheet = xlsx.utils.json_to_sheet(rows); const workbook = xlsx.utils.book_new(); xlsx.utils.book_append_sheet(workbook, sheet, "Per kecamatan"); xlsx.writeFile(workbook, `${safeName(sampleElection.title)}-rekap-wilayah.xlsx`); toast.success("Rekap wilayah diunduh", { description: "Berkas memuat angka simulasi dan label contohnya." }); };
  const importExcel = async (file?: File) => { if (!file) return; setCreatedOn(file.name); try { const xlsx = await import("xlsx"); const workbook = xlsx.read(await file.arrayBuffer(), { type: "array", cellDates: false }); const firstSheet = workbook.SheetNames[0]; const worksheet = firstSheet ? workbook.Sheets[firstSheet] : undefined; const rows = worksheet ? xlsx.utils.sheet_to_json<Record<string, string | number>>(worksheet, { defval: "" }) : []; const matches = rows.filter((row) => Object.values(row).some((value) => /sidoarjo|waru|taman|candi|krian|buduran|porong/i.test(String(value)))).length; toast.success("File Excel dibaca", { description: `${rows.length} baris terbaca · ${matches} baris memiliki data wilayah yang dikenali. Belum ada data yang diunggah.` }); } catch { toast.error("File Excel belum dapat dibaca", { description: "Pastikan berkas .xls atau .xlsx memiliki lembar kerja yang valid." }); } };
  useEffect(() => { if (!toastOpen) return; const timer = window.setTimeout(() => setToastOpen(false), 5000); return () => window.clearTimeout(timer); }, [toastOpen]);
  return (
    <div className="space-y-5 pb-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><span className="inline-flex rounded bg-brand-soft px-2 py-1 text-[9px] font-semibold tracking-[0.06em] text-brand-strong">DATA & PELAPORAN</span><h1 className="mt-3 font-display text-[25px] font-semibold sm:text-[31px]">Laporan & audit</h1><p className="mt-1.5 text-[11px] text-muted-foreground">Ringkasan perkembangan, impor data pemilih, dan riwayat contoh kampanye.</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={exportSupporters} className="h-9 gap-2 text-[10px]"><Download className="size-3.5" />Unduh pendukung</Button><Button type="button" onClick={exportWards} className="h-9 gap-2 text-[10px]"><Download className="size-3.5" />Rekap wilayah Excel</Button></div></div>
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4"><MetricCard label="Jumlah pendukung" value={formatNumber(sampleMetrics.supporters + supporters.length)} note="contoh simulasi" icon={HeartHandshake} /><MetricCard label="Suara dihimpun" value={formatNumber(sampleMetrics.countedVotes)} note="dari target 91.500 suara" icon={Vote} /><MetricCard label="TPS melapor" value="1.584 / 2.056" note="kesiapan pelaporan simulasi" icon={Map} /><MetricCard label="Data perlu cek" value="38" note="dibandingkan master DPT contoh" icon={BadgeCheck} /></div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><section className="rounded-md border border-border bg-card p-4 sm:p-5"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded bg-chart-2/10 text-chart-2"><FileSpreadsheet className="size-4" /></span><div><h2 className="text-[12px] font-semibold">Impor daftar pemilih</h2><p className="mt-1 text-[9px] text-muted-foreground">Format Excel · kecamatan, desa, TPS, dan identitas pemilih</p></div></div><div className="mt-4 flex min-h-32 flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/20 px-4 py-5 text-center"><CloudUpload className="size-6 text-muted-foreground" /><p className="mt-2 text-[10px] font-medium">Pilih file DPT .xls atau .xlsx</p><p className="mt-1 text-[9px] text-muted-foreground">File diproses di perangkat untuk pratinjau pemetaan kolom.</p><label className="mt-3 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[9px] font-medium transition-colors hover:bg-accent"><Upload className="size-3" />Pilih file<input type="file" accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={(event) => void importExcel(event.target.files?.[0])} /></label></div>{createdOn && <div className="mt-3 rounded-md bg-chart-2/5 px-3 py-2 text-[9px] text-muted-foreground"><span className="flex gap-2"><Check className="size-3 shrink-0 text-chart-2" />{createdOn}</span></div>}<div className="mt-4 border-t border-border pt-4"><p className="flex items-start gap-2 text-[9px] leading-relaxed text-chart-4"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" /><span><b>Belum diunggah atau dicocokkan.</b> Pencocokan DPT dan ekspor file asli non-dummy memerlukan akses kampanye yang telah terhubung.</span></p></div></section>
        <section className="rounded-md border border-border bg-card p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><div><h2 className="text-[12px] font-semibold">Jejak aktivitas</h2><p className="mt-1 text-[9px] text-muted-foreground">Peristiwa contoh tanpa menyimpan NIK lengkap</p></div><span className="flex items-center gap-1.5 text-[9px] text-chart-2"><span className="size-1.5 rounded-full bg-chart-2" />CONTOH</span></div><div className="mt-3">{sampleActivity.map((event, index) => <ActivityRow key={`${event.time}-${index}`} event={event} last={index === sampleActivity.length - 1} />)}</div><Button type="button" variant="outline" onClick={() => { setToastOpen(true); }} className="mt-3 h-8 w-full gap-1.5 text-[9px]"><ArrowDownToLine className="size-3" />Ekspor jejak aktivitas contoh</Button>{toastOpen && <div role="status" className="mt-2 rounded-md bg-chart-4/10 px-3 py-2 text-[9px] text-chart-4">Ekspor riwayat identitas dan penolakan NIK belum tersedia pada mode contoh.</div>}</section></div>
      <section className="rounded-md border border-chart-4/25 bg-chart-4/5 px-4 py-3.5"><p className="flex items-start gap-2 text-[10px] leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-chart-4" /><span><b className="text-foreground">Pelindungan identitas.</b> File Excel dibaca lokal di perangkat. NIK lengkap tidak diikutkan dalam berkas ringkasan; pemeriksaan terpusat, log penolakan duplikat, serta master DPT privat memerlukan akun kampanye yang telah terverifikasi.</span></p></section>
    </div>
  );
}

type ProfileForm = { fullName: string; whatsapp: string; email: string; password: string; passwordAgain: string; avatar: File | null };

function SignInPanel({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>({ fullName: "", whatsapp: "", email: "", password: "", passwordAgain: "", avatar: null });
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); }, [avatarPreview]);
  const setField = (key: keyof ProfileForm, value: string | File | null) => setForm((current) => ({ ...current, [key]: value }));
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setFormError(""); setFormSuccess(""); setLoading(true);
    try {
      if (mode === "signup") {
        if (form.fullName.trim().length < 3) throw new Error("Masukkan nama lengkap Anda.");
        if (form.whatsapp.replace(/\D/g, "").length < 9) throw new Error("Masukkan nomor WhatsApp yang valid.");
        if (form.password.length < 10) throw new Error("Gunakan kata sandi minimal 10 karakter.");
        if (form.password !== form.passwordAgain) throw new Error("Konfirmasi kata sandi belum sama.");
        const { data, error } = await supabase.auth.signUp({ email: form.email.trim(), password: form.password, options: { data: { full_name: form.fullName.trim(), whatsapp: form.whatsapp.trim() }, emailRedirectTo: window.location.origin } });
        if (error) throw new Error(error.message === "User already registered" ? "Email ini sudah memiliki akun. Silakan masuk." : "Pendaftaran belum berhasil. Periksa kembali email dan koneksi.");
        if (data.user?.id && form.avatar) {
          const storage = supabase.storage.from("profile-photos");
          const key = `${data.user.id}/${form.avatar.name.replace(/[^\w.-]/g, "-")}`;
          const { error: avatarError } = await storage.upload(key, form.avatar, { upsert: true, contentType: form.avatar.type });
          if (!avatarError) await supabase.auth.updateUser({ data: { full_name: form.fullName.trim(), whatsapp: form.whatsapp.trim(), avatar_path: key } });
        }
        if (data.session) { onSignedIn(); return; }
        setFormSuccess("Pendaftaran diterima. Periksa email Anda untuk mengonfirmasi akun sebelum masuk."); return;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
      if (error) throw new Error("Email atau kata sandi belum cocok.");
      if (!data.session) throw new Error("Sesi belum tersedia. Coba masuk kembali.");
      onSignedIn();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Belum dapat menyambung ke layanan akun.");
    } finally { setLoading(false); }
  };
  const oauth = async () => {
    setFormError(""); setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
      if (error) throw new Error("Layanan masuk belum berhasil. Silakan coba lagi.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Layanan masuk belum tersedia.");
    } finally { setLoading(false); }
  };
  return (
    <div className="flex min-h-svh flex-col bg-background lg:flex-row">
      <aside className="relative flex min-h-[32svh] flex-col overflow-hidden bg-primary px-5 pb-6 pt-5 text-primary-foreground sm:min-h-[36svh] sm:px-8 lg:min-h-svh lg:w-[48%] lg:px-12 lg:pb-12 lg:pt-10 xl:w-[51%] xl:px-16">
        <div className="absolute inset-0 opacity-25" aria-hidden="true"><div className="absolute -right-16 top-4 size-80 rounded-full border border-primary-foreground/15" /><div className="absolute -right-5 top-14 size-56 rounded-full border border-primary-foreground/15" /><div className="absolute right-9 top-28 size-28 rounded-full border border-chart-2/40" /></div>
        <div className="relative flex items-center gap-3"><span className="grid size-9 place-items-center rounded-md bg-primary-foreground/10"><Command className="size-[18px]" /></span><div><p className="text-[15px] font-bold tracking-[0.02em]">SULUH</p><p className="text-[9px] font-medium tracking-[0.11em] text-primary-foreground/55">PUSAT KENDALI KAMPANYE</p></div></div>
        <div className="relative mt-auto max-w-lg lg:my-auto lg:pr-8 lg:pt-20">
          <span className="inline-flex items-center gap-2 rounded-sm border border-primary-foreground/15 bg-primary-foreground/5 px-2.5 py-1.5 text-[9px] font-medium tracking-[0.03em] text-primary-foreground/80"><span className="size-1.5 rounded-full bg-chart-2" /> SATU PUSAT · SEMUA WILAYAH</span>
          <h1 className="mt-5 max-w-[460px] font-display text-[31px] font-semibold leading-[1.15] sm:mt-6 sm:text-[38px] lg:mt-7 lg:text-[43px]">Gerak terukur.<br /><span className="text-chart-2">Suara terjaga.</span></h1>
          <p className="mt-3 max-w-[410px] text-[11px] leading-relaxed text-primary-foreground/65 sm:mt-4 sm:text-xs">Kelola koordinator, relawan, dukungan pemilih, dan laporan TPS dari satu pusat kerja.</p>
          <div className="mt-5 grid max-w-[430px] grid-cols-3 gap-2 sm:mt-7 sm:gap-2.5">
            {[["18", "Kecamatan"], ["428", "Relawan"], ["2.056", "TPS"]].map(([count, title], index) => <div key={title} className="border-l border-chart-2/45 pl-2.5 sm:pl-3"><p className={`font-display text-[19px] font-semibold sm:text-[23px] ${index === 1 ? "text-chart-2" : ""}`}>{count}</p><p className="mt-0.5 text-[8px] text-primary-foreground/55 sm:text-[9px]">{title} · contoh</p></div>)}
          </div>
          <p className="mt-4 max-w-[430px] text-[8px] leading-relaxed text-primary-foreground/45 sm:mt-6 sm:text-[9px]">Angka, nama calon, dan profil yang terlihat adalah data contoh untuk menunjukkan bentuk aplikasi. Pelindungan identitas memerlukan akses akun dan kampanye yang sudah diatur.</p>
        </div>
        <div className="relative mt-7 hidden items-center justify-between border-t border-primary-foreground/15 pt-4 text-[9px] text-primary-foreground/45 lg:flex"><span>SULUH · PUSAT KENDALI RELAWAN</span><span>MODE CONTOH · 2026</span></div>
      </aside>
      <main className="flex flex-1 items-start justify-center px-4 py-7 sm:px-8 sm:py-9 lg:items-center lg:py-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-5 inline-flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.09em] text-chart-1"><ShieldCheck className="size-3.5" /> AKSES TERJAGA</div>
          <h2 className="font-display text-[24px] font-semibold">{mode === "signin" ? "Selamat datang kembali" : "Buat akun Suluh"}</h2>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{mode === "signin" ? "Masuk untuk membuka tim dan data kampanye Anda." : "Lengkapi profil akun. Akses kampanye diberikan terpisah oleh pengelola."}</p>
          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            {mode === "signup" && <>
              <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2"><Avatar className="size-10 border border-border"><AvatarImage src={avatarPreview ?? undefined} alt="Pratinjau foto profil" /><AvatarFallback className="bg-secondary"><Users className="size-4 text-muted-foreground" /></AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="text-[10px] font-medium">Foto profil <span className="text-muted-foreground">(opsional)</span></p><p className="mt-1 truncate text-[8px] text-muted-foreground">Disimpan privat jika koneksi aktif</p></div><input ref={avatarInputRef} aria-label="Pilih foto profil" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { setFormError("Foto profil maksimal 5 MB."); return; } setField("avatar", file); setAvatarPreview((current) => { if (current) URL.revokeObjectURL(current); return URL.createObjectURL(file); }); }} /><Button type="button" variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()} className="h-7 shrink-0 px-2.5 text-[9px]">Pilih foto</Button></div>
              <label className="block space-y-1.5"><span className="text-[10px] font-medium">Nama lengkap</span><Input value={form.fullName} onChange={(event) => setField("fullName", event.target.value)} autoComplete="name" placeholder="Nama sesuai identitas" className="h-10 text-xs" required minLength={3} /></label>
              <label className="block space-y-1.5"><span className="text-[10px] font-medium">Nomor WhatsApp</span><Input value={form.whatsapp} onChange={(event) => setField("whatsapp", event.target.value.replace(/[^\d+]/g, "").slice(0, 16))} autoComplete="tel" inputMode="tel" placeholder="08xx xxxx xxxx" className="h-10 text-xs" required /></label>
            </>}
            <label className="block space-y-1.5"><span className="text-[10px] font-medium">Alamat email</span><Input value={form.email} onChange={(event) => setField("email", event.target.value)} type="email" autoComplete="email" placeholder="nama@contoh.id" className="h-10 text-xs" required /></label>
            <label className="block space-y-1.5"><span className="flex items-center justify-between text-[10px] font-medium">Kata sandi {mode === "signin" && <button type="button" onClick={() => toast.info("Pemulihan akun", { description: "Link pemulihan akan tersedia setelah email kampanye diaktifkan." })} className="text-[9px] font-normal text-chart-1 underline-offset-4 hover:underline">Lupa kata sandi?</button>}</span><Input value={form.password} onChange={(event) => setField("password", event.target.value)} type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder={mode === "signin" ? "Masukkan kata sandi" : "Minimal 10 karakter"} className="h-10 text-xs" required minLength={mode === "signup" ? 10 : undefined} /></label>
            {mode === "signup" && <label className="block space-y-1.5"><span className="text-[10px] font-medium">Ulangi kata sandi</span><Input value={form.passwordAgain} onChange={(event) => setField("passwordAgain", event.target.value)} type="password" autoComplete="new-password" placeholder="Ulangi kata sandi" className="h-10 text-xs" required minLength={10} /></label>}
            {formError && <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-[10px] leading-relaxed text-destructive">{formError}</div>}
            {formSuccess && <div role="status" className="rounded-md border border-chart-2/25 bg-chart-2/5 px-3 py-2.5 text-[10px] leading-relaxed text-foreground">{formSuccess}</div>}
            <Button type="submit" disabled={loading} className="h-10 w-full gap-2 text-[10px] font-semibold">{loading ? "Menghubungkan…" : mode === "signin" ? "Masuk ke Suluh" : "Daftar dengan email"}<ArrowRight className="size-3.5" /></Button>
          </form>
          <div className="my-4 flex items-center gap-3"><span className="h-px flex-1 bg-border" /><span className="text-[8px] font-medium text-muted-foreground">ATAU LANJUTKAN DENGAN</span><span className="h-px flex-1 bg-border" /></div>
          <div className="grid gap-2.5">
            <Button type="button" disabled={loading} variant="outline" onClick={() => void oauth()} className="h-10 gap-[10px] rounded-md border-border bg-background px-3 text-[10px] font-medium text-foreground shadow-none hover:bg-secondary/60"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>Masuk dengan Google</Button>
          </div>
          <p className="mt-4 text-center text-[9px] text-muted-foreground">{mode === "signin" ? "Belum punya akun?" : "Sudah memiliki akun?"} <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setFormError(""); setFormSuccess(""); }} className="font-semibold text-chart-1 underline-offset-4 hover:underline">{mode === "signin" ? "Buat akun" : "Masuk"}</button></p>
          <div className="mt-5 border-t border-border pt-3"><p className="flex items-start gap-2 text-[8px] leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 size-3 shrink-0" />Akun dan profil terpisah dari akses kampanye. Masuk saja belum memberi akses ke data calon; calon dan relawan perlu diundang oleh pengelola.</p></div>
        </div>
      </main>
    </div>
  );
}

export function WarRoomDashboard() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null>(null);
  const [profileName, setProfileName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [active, setActive] = useState<ViewKey>("overview");
  const [supporters, setSupporters] = useState<SupporterRecord[]>([]);
  const [wards, setWards] = useState<Ward[]>(sampleWards);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loggedOutSheetOpen, setLoggedOutSheetOpen] = useState(false);
  const [clock, setClock] = useState("");

  useEffect(() => {
    let alive = true;
    const readSession = async () => {
      const { data: result } = await supabase.auth.getUser();
      if (!alive) return;
      setUser(result.user ?? null);
      setProfileName(typeof result.user?.user_metadata?.["full_name"] === "string" ? result.user.user_metadata["full_name"] : result.user?.email?.split("@")[0] ?? "");
      const path = result.user?.user_metadata?.["avatar_path"];
      if (typeof path === "string" && path) {
        const { data } = await supabase.storage.from("profile-photos").createSignedUrl(path, 3600);
        if (alive && data?.signedUrl) setAvatarUrl(data.signedUrl);
      }
      if (alive) setAuthReady(true);
    };
    void readSession();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setUser(session?.user ?? null);
      setProfileName(typeof session?.user.user_metadata?.["full_name"] === "string" ? session.user.user_metadata["full_name"] : session?.user.email?.split("@")[0] ?? "");
      if (event === "SIGNED_OUT") { setAvatarUrl(null); setSupporters([]); setWards(sampleWards); setActive("overview"); }
      if (event === "SIGNED_IN") setLoggedOutSheetOpen(false);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const updateClock = () => setClock(new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" }).format(new Date()));
    updateClock(); const timer = window.setInterval(updateClock, 60_000); return () => window.clearInterval(timer);
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); toast.success("Anda telah keluar dari akun"); };
  const onSelect = (key: ViewKey) => { setActive(key); setLoggedOutSheetOpen(false); setMobileNavOpen(false); };

  if (!authReady) return <div className="flex min-h-svh items-center justify-center bg-background"><div className="flex items-center gap-3"><span className="size-2 animate-pulse rounded-full bg-chart-2 motion-reduce:animate-none" /><p className="text-xs text-muted-foreground">Menyiapkan pusat kendali…</p></div></div>;
  if (!user) return <SignInPanel onSignedIn={() => { void supabase.auth.getUser().then(({ data }) => setUser(data.user)); setAuthReady(true); }} />;

  const memberName = profileName || user.email?.split("@")[0] || "Anggota";
  const headingName = memberName.split(/\s+/)[0];
  const initial = memberName.split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex min-h-svh bg-background text-foreground">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[220px] flex-col border-r border-sidebar-border bg-sidebar lg:flex xl:w-[238px]"><NavContent active={active} onSelect={onSelect} /></aside>
        <div className="flex min-h-svh min-w-0 flex-1 flex-col lg:pl-[220px] xl:pl-[238px]">
          <header className="sticky top-0 z-20 flex h-[62px] items-center justify-between border-b border-border bg-background/95 px-3 backdrop-blur-sm sm:px-5 xl:px-7">
            <div className="flex min-w-0 items-center gap-2.5">
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}><SheetTrigger asChild><Button type="button" variant="outline" size="icon" aria-label="Buka navigasi" className="size-8 shrink-0 lg:hidden"><Menu className="size-4" /></Button></SheetTrigger><SheetContent side="left" className="w-[270px] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground sm:w-[290px]"><SheetHeader className="sr-only"><SheetTitle>Navigasi Suluh</SheetTitle></SheetHeader><ScrollArea className="h-full"><NavContent active={active} onSelect={onSelect} mobile /></ScrollArea></SheetContent></Sheet>
              <div className="hidden items-center gap-1.5 text-[9px] text-muted-foreground sm:flex"><span className="text-muted-foreground/55">Sidoarjo</span><ChevronRight className="size-3" /><span className="font-medium text-foreground">{viewLabels[active]}</span></div>
              <div className="flex min-w-0 items-center gap-2.5 sm:hidden"><span className="grid size-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><Command className="size-4" /></span><div className="min-w-0"><p className="truncate text-[10px] font-bold tracking-[0.02em]">PILKADA SIDOARJO 2026</p><p className="mt-0.5 text-[8px] text-muted-foreground">{viewLabels[active]}</p></div></div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
              <div className="hidden h-8 items-center gap-2 rounded-md border border-border bg-secondary/35 px-2.5 text-[9px] text-muted-foreground sm:flex"><span className="relative size-1.5"><span className="absolute size-full animate-ping rounded-full bg-chart-2 opacity-50 motion-reduce:animate-none" /><span className="relative block size-1.5 rounded-full bg-chart-2" /></span> <span>SERVER SIMULASI</span></div>
              <span className="hidden font-mono text-[10px] tabular-nums text-muted-foreground sm:block">{clock || "09:41"} WIB</span>
              <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label="Notifikasi" onClick={() => toast.info("Notifikasi", { description: "Tidak ada pemberitahuan baru pada data contoh." })} className="relative size-8 text-muted-foreground"><Bell className="size-4" /><span className="absolute right-[7px] top-[7px] size-1.5 rounded-full bg-chart-4 ring-2 ring-background" /></Button></TooltipTrigger><TooltipContent>Notifikasi contoh</TooltipContent></Tooltip>
              <Sheet open={loggedOutSheetOpen} onOpenChange={setLoggedOutSheetOpen}><SheetTrigger asChild><Button type="button" variant="ghost" className="h-9 gap-2 px-1.5 sm:px-2.5"><Avatar className="size-7"><AvatarImage src={avatarUrl ?? undefined} alt="" /><AvatarFallback className="bg-chart-3/15 text-[9px] font-semibold text-chart-3">{initial || "A"}</AvatarFallback></Avatar><span className="hidden max-w-[110px] truncate text-[9px] font-medium sm:block">{memberName}</span><ChevronDown className="hidden size-3 text-muted-foreground sm:block" /></Button></SheetTrigger><SheetContent side="right" className="w-[320px] sm:w-[360px]"><SheetHeader className="sr-only"><SheetTitle>Akun {memberName}</SheetTitle></SheetHeader><div className="mt-5 flex items-center gap-3"><Avatar className="size-12"><AvatarImage src={avatarUrl ?? undefined} alt="" /><AvatarFallback className="bg-chart-3/15 text-xs font-semibold text-chart-3">{initial || "A"}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate text-sm font-semibold">{memberName}</p><p className="truncate text-xs text-muted-foreground">{user.email}</p></div></div><div className="mt-6 space-y-3 rounded-md border border-border p-3 text-xs"><div><p className="text-muted-foreground">Nama lengkap</p><p className="mt-1 font-medium">{typeof user.user_metadata?.["full_name"] === "string" ? user.user_metadata["full_name"] : "Belum dilengkapi"}</p></div><div><p className="text-muted-foreground">WhatsApp</p><p className="mt-1 font-medium">{typeof user.user_metadata?.["whatsapp"] === "string" ? user.user_metadata["whatsapp"] : "Belum dilengkapi"}</p></div><p className="border-t border-border pt-3 text-[9px] leading-relaxed text-muted-foreground">Foto profil tersimpan privat. Hak akses kampanye dikelola terpisah.</p></div><div className="absolute bottom-6 left-6 right-6"><Button type="button" variant="outline" onClick={() => void signOut()} className="w-full gap-2"><X className="size-4" />Keluar</Button></div></SheetContent></Sheet>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1760px] flex-1 px-3 pb-5 pt-4 sm:px-5 sm:pt-5 xl:px-8 xl:pt-6">
            {active === "overview" && <DashboardContent onNavigate={onSelect} />}
            {active === "field" && <FieldDataContent onNavigate={onSelect} setSupporters={setSupporters} setWards={setWards} />}
            {active === "supporters" && <SupportersContent records={supporters} />}
            {active === "volunteers" && <VolunteersContent onNavigate={onSelect} />}
            {active === "recap" && <ReportsContent supporters={supporters} wards={wards} />}
          </main>
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-3 text-[8px] text-muted-foreground/70 sm:px-5 sm:text-[9px] xl:px-8"><span>SULUH · PUSAT KENDALI RELAWAN · MODE CONTOH</span><span className="flex items-center gap-1.5"><ShieldCheck className="size-3" />Data contoh · Bukan perolehan resmi</span></footer>
        </div>
      </div>
    </TooltipProvider>
  );
}

async function hashNikFingerprint(nik: string): Promise<string> {
  const input = new TextEncoder().encode(`suluh-supporter-v1:${nik}`);
  const buffer = await window.crypto.subtle.digest("SHA-256", input);
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getLocalNikFingerprints(): string[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem("suluh:duplicate-check") ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch { return []; }
}

function saveLocalNikFingerprint(fingerprint: string) {
  const next = [...new Set([...getLocalNikFingerprints(), fingerprint])].slice(-300);
  window.localStorage.setItem("suluh:duplicate-check", JSON.stringify(next));
}
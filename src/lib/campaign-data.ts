export type Ward = {
  name: string;
  dpt: number;
  target: number;
  counted: number;
  volunteers: number;
  support: number;
  stations: number;
  online: boolean;
};

export type TeamMember = {
  name: string;
  initials: string;
  role: string;
  area: string;
  recruits: number;
  online: boolean;
  color: string;
};

export const sampleElection = {
  title: "Pilkada Sidoarjo 2026",
  candidate: "Arif Wibowo",
  position: "Calon Bupati · Nomor urut 02",
  district: "Kabupaten Sidoarjo",
  date: "Tanggal pemungutan belum ditentukan",
  status: "MODE CONTOH",
};

export const sampleMetrics = {
  voteTarget: 91_500,
  countedVotes: 68_421,
  dpt: 231_840,
  supporters: 17_284,
  women: 9_506,
  men: 7_778,
  volunteers: 428,
  stations: 2_056,
  reportingStations: 1_584,
};

export const sampleWards: Ward[] = [
  { name: "Waru", dpt: 31_240, target: 12_400, counted: 10_582, volunteers: 52, support: 2_842, stations: 184, online: true },
  { name: "Taman", dpt: 42_180, target: 16_800, counted: 13_110, volunteers: 68, support: 3_462, stations: 224, online: true },
  { name: "Sidoarjo", dpt: 37_640, target: 15_100, counted: 11_362, volunteers: 57, support: 2_884, stations: 207, online: true },
  { name: "Candi", dpt: 26_510, target: 10_500, counted: 7_512, volunteers: 48, support: 2_136, stations: 172, online: true },
  { name: "Krian", dpt: 29_720, target: 11_800, counted: 8_740, volunteers: 51, support: 2_272, stations: 184, online: false },
  { name: "Wonoayu", dpt: 18_360, target: 7_300, counted: 5_684, volunteers: 39, support: 1_562, stations: 143, online: true },
  { name: "Buduran", dpt: 25_840, target: 10_300, counted: 7_984, volunteers: 43, support: 1_946, stations: 176, online: false },
  { name: "Porong", dpt: 20_350, target: 7_300, counted: 3_447, volunteers: 70, support: 2_180, stations: 186, online: true },
];

export const sampleTeam: TeamMember[] = [
  { name: "Dewi Anggraini", initials: "DA", role: "Koordinator kecamatan", area: "Waru", recruits: 32, online: true, color: "bg-brand-soft text-brand-strong" },
  { name: "Bambang Prasetyo", initials: "BP", role: "Koordinator desa", area: "Taman", recruits: 24, online: true, color: "bg-chart-1/15 text-chart-1" },
  { name: "Siti Rahmawati", initials: "SR", role: "Koordinator lapangan", area: "Buduran", recruits: 18, online: true, color: "bg-chart-2/15 text-chart-2" },
  { name: "Rizky Mahendra", initials: "RM", role: "Relawan", area: "Candi", recruits: 17, online: false, color: "bg-chart-3/15 text-chart-3" },
  { name: "Nadia Putri", initials: "NP", role: "Koordinator lapangan", area: "Krian", recruits: 16, online: true, color: "bg-chart-4/20 text-foreground" },
];

export const sampleActivity = [
  { actor: "Siti Rahmawati", action: "menambahkan 8 pendukung", area: "Kecamatan Taman", time: "2 mnt lalu", icon: "support" },
  { actor: "Bambang Prasetyo", action: "memperbarui target suara", area: "Desa Wage · TPS 12", time: "11 mnt lalu", icon: "target" },
  { actor: "Dewi Anggraini", action: "mengundang koordinator baru", area: "Kecamatan Waru", time: "24 mnt lalu", icon: "team" },
  { actor: "Rizky Mahendra", action: "mengirim hasil suara", area: "Desa Sepande · TPS 04", time: "36 mnt lalu", icon: "vote" },
];

export const sampleTrend = [
  { day: "04 Nov", support: 2_340, votes: 1_120 },
  { day: "06 Nov", support: 3_540, votes: 2_880 },
  { day: "08 Nov", support: 4_960, votes: 4_620 },
  { day: "10 Nov", support: 6_820, votes: 7_210 },
  { day: "12 Nov", support: 9_340, votes: 11_860 },
  { day: "14 Nov", support: 11_520, votes: 20_340 },
  { day: "16 Nov", support: 14_180, votes: 31_720 },
  { day: "18 Nov", support: 17_284, votes: 45_820 },
  { day: "20 Nov", support: 19_830, votes: 56_340 },
  { day: "22 Nov", support: 21_440, votes: 68_421 },
];

export const formatNumber = (value: number) => new Intl.NumberFormat("id-ID").format(value);

export function getVoteProgress(target: number, counted: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((counted / target) * 100), 100);
}

export function getGenderShare(total: number, group: number): number {
  if (total <= 0) return 0;
  return Math.round((group / total) * 100);
}

export function isValidNikShape(value: string): boolean {
  return /^\d{16}$/.test(value.replace(/\s/g, ""));
}

export function isDuplicateFingerprint(
  candidateFingerprints: readonly string[],
  incomingFingerprint: string,
): boolean {
  return candidateFingerprints.includes(incomingFingerprint);
}
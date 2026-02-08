
export type Language = 'en' | 'mizo';

export enum View {
  Home = 'Home',
  About = 'About',
  Events = 'Events',
  Sermons = 'Sermons',
  Ministries = 'Ministries',
  Contact = 'Contact'
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  category: string;
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
  imageCaptions?: string[];
  videoUrl?: string;
  videoUrls?: string[];
}

export interface Event {
  id?: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  description?: string;
  type?: string;
  isCancelled?: boolean;
  isRecurringTemplate?: boolean;
  dayOfWeek?: number;
  program?: {
    hruaitu?: string;
    tantu?: string;
    thuhriltu?: string;
    thupui?: string;
    [key: string]: string | undefined;
  };
}

export interface Sermon {
  id: string;
  title: string;
  date: string;
  preacher: string;
  scripture: string;
  description: string;
  audioUrl?: string;
  videoUrl?: string;
}

export interface Ministry {
  id: string;
  name: string;
  acronym?: string;
  description: string;
  leader: string;
  schedule: string;
  image: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  period?: string;
  description?: string;
  order?: number;
  biography?: string;
  imagePositionX?: number;
  imagePositionY?: number;
  imageScale?: number;
  qualification?: string;
  probationTenure?: string;
  phoneNumber?: string;
  previousBials?: { field: string; period: string }[];
}

export interface ProgramField {
  id: string;
  label: string;
  value: string;
}

export interface WeeklyDuty {
  id: string;
  month: string;
  thawhlawmChiartute: string[];
  buhfaithamHralhtute: string[];
  ushers: string[];
  weekRange: string;
  zaiHruaitu: string;
  pianoTumtu: string;
  hlaHriltu: string;
  lightAndSoundDuty: string;
  pangparKhawitu: string;
  serviceTimes: {
    sundaySchool: string;
    morning: string;
    evening: string;
  };
  serviceTitles: {
    sundaySchool: string;
    morning: string;
    evening: string;
  };
  servicePrograms: {
    sundaySchool: ProgramField[];
    morning: ProgramField[];
    evening: ProgramField[];
  };
  midWeek: {
    nilai: any;
    inrinni: any;
  }
}

// Records
export interface BaptismRecord {
  id?: string;
  type: 'baptism';
  name: string;
  dateOfBirth: string;
  baptismDate: string;
  parents: string;
  minister: string;
}

export interface WeddingRecord {
  id?: string;
  type: 'wedding';
  groomName: string;
  brideName: string;
  weddingDate: string;
  minister: string;
}

export interface DeathRecord {
  id?: string;
  type: 'death';
  name: string;
  fatherName: string;
  age: string;
  dateOfDeath: string;
  causeOfDeath: string;
  minister: string;
}

export interface InkhawmpuiRecord {
  id?: string;
  type: 'inkhawmpui';
  eventName: string;
  year: number | string;
  theme: string;
  puipate: string;
  speakers: string;
}

export interface GospelCampingRecord {
  id?: string;
  type: 'gospelCamping';
  year: string;
  team: string;
  speaker: string;
  date: string;
}

export interface PemDawnsawnRecord {
  id?: string;
  type: 'pemDawnsawn';
  date: string;
  headOfFamily: string;
  fathersName: string;
  noOfMembers: string | number;
  previousChurch: string;
}

export type ChurchRecord = BaptismRecord | WeddingRecord | DeathRecord | InkhawmpuiRecord | GospelCampingRecord | PemDawnsawnRecord;

export interface SundaySchoolDepartment {
  id: string;
  name: string;
  leader: string;
  asstLeader?: string;
  secretary?: string;
  asstSecretary?: string;
  teachers: string[];
  description: string;
  students: number;
}

export interface SSWeeklyReport {
  id?: string;
  date: string;
  deptId: string;
  zirtirtu: {
    kal: number;
    kallo: number;
    thawhlawm: number;
  };
  zirtu: {
    kal: number;
    kallo: number;
    thawhlawm: number;
  };
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  isAdmin?: boolean;
  createdAt: string;
}

export interface KTPMember {
  id: string;
  name: string;
  phone?: string;
  role?: string;
}

export interface KTPGroup {
  id: string;
  groupName: string;
  members: KTPMember[];
}

export interface KTPSubCommittee {
  id: string;
  name: string;
  members: KTPMember[];
}

export interface KTPHruaitute {
  year: number;
  leaders: KTPMember[];
  committeeMembers: KTPMember[];
  exOfficioMembers: KTPMember[];
  groupLeaders?: KTPGroup[];
  subCommittees?: KTPSubCommittee[];
}

export interface BudgetItem {
  id: string;
  item: string;
  amount: string;
}

export interface KTPBudget {
  year: number;
  income: BudgetItem[];
  expenditure: BudgetItem[];
}

export interface Resource {
  id: string;
  title: string;
  category: 'Bulletin' | 'Report' | 'Form' | 'Article';
  date: string;
  downloadUrl: string;
  fileSize?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  category: 'Committees' | 'Kohhran Chetna' | 'Kohhran Hunpui';
  date: string;
}

export interface ArchiveEntry {
  id: string;
  title: string;
  date: string;
  category: string;
  subCategory?: string;
  department?: string;
  description: string;
  link: string;
  imageUrls?: string[];
  ss_year?: string;
  ss_dept_teachers?: string;
  ss_dept_leader?: string;
  ss_dept_asst_leader?: string;
  ss_dept_secretary?: string;
  ss_superintendent?: string;
  ss_asstSupdt?: string;
  ss_asstSupdtNPSS?: string;
  ss_secretary?: string;
  ss_asstSecy1?: string;
  ss_asstSecy2?: string;
  ss_asstSecyNPSS1?: string;
  ss_asstSecyNPSS2?: string;
  tenureYears?: string;
}

export interface Article {
  id: string;
  title: string;
  author: string;
  date: string;
  category: 'Article' | 'Sermon';
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  views?: number;
}

export interface Missionary {
  id: string;
  name: string;
  qualification?: string;
  field?: string;
  period?: string;
  bio?: string;
  imageUrl?: string;
  serviceHistory?: ServiceHistory[];
  imagePositionX?: number;
  imagePositionY?: number;
  imageScale?: number;
}

export interface ServiceHistory {
  field: string;
  period: string;
}

export interface CommitteeMember {
  id?: string;
  name: string;
  role: string;
  phone?: string;
}

export interface Committee {
  id: string;
  name: string;
  icon: string;
  description?: string;
  members: CommitteeMember[];
  order?: number;
}

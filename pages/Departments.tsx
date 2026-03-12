
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  BookOpen, DollarSign, Globe, Home, Users, Coffee, Heart, Music, 
  Smile, Library, Book, Box, Newspaper, FileText, UserPlus, Clock, 
  ClipboardCheck, Handshake, ChevronDown, ChevronUp, Search, Loader, 
  AlertTriangle, Phone, Plus, Edit, Trash, Save, X, Database, ArrowUp, ArrowDown,
  Image as ImageIcon, Upload, ZoomIn
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { db, storage } from '../services/firebase';
import { Committee, CommitteeMember } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Map string names to actual components
const ICON_MAP: Record<string, React.ElementType> = {
  'BookOpen': BookOpen,
  'DollarSign': DollarSign,
  'Globe': Globe,
  'Home': Home,
  'Users': Users,
  'Coffee': Coffee,
  'Heart': Heart,
  'Music': Music,
  'Smile': Smile,
  'Library': Library,
  'Book': Book,
  'Box': Box,
  'Newspaper': Newspaper,
  'FileText': FileText,
  'UserPlus': UserPlus,
  'Clock': Clock,
  'ClipboardCheck': ClipboardCheck,
  'Handshake': Handshake
};

// Realistic metallic and glass colors
const ICON_COLORS: Record<string, string> = {
  'BookOpen': 'from-blue-600 to-blue-800 text-white border-blue-400',
  'DollarSign': 'from-emerald-600 to-emerald-800 text-white border-emerald-400',
  'Globe': 'from-indigo-600 to-indigo-800 text-white border-indigo-400',
  'Home': 'from-orange-600 to-orange-800 text-white border-orange-400',
  'Users': 'from-violet-600 to-violet-800 text-white border-violet-400',
  'Coffee': 'from-amber-600 to-amber-800 text-white border-amber-400',
  'Heart': 'from-rose-600 to-rose-800 text-white border-rose-400',
  'Music': 'from-pink-600 to-pink-800 text-white border-pink-400',
  'Smile': 'from-yellow-500 to-yellow-700 text-white border-yellow-300',
  'Library': 'from-cyan-600 to-cyan-800 text-white border-cyan-400',
  'Book': 'from-blue-600 to-blue-800 text-white border-blue-400',
  'Box': 'from-slate-600 to-slate-800 text-white border-slate-400',
  'Newspaper': 'from-gray-600 to-gray-800 text-white border-gray-400',
  'FileText': 'from-teal-600 to-teal-800 text-white border-teal-400',
  'UserPlus': 'from-green-600 to-green-800 text-white border-green-400',
  'Clock': 'from-fuchsia-600 to-fuchsia-800 text-white border-fuchsia-400',
  'ClipboardCheck': 'from-lime-600 to-lime-800 text-white border-lime-400',
  'Handshake': 'from-sky-600 to-sky-800 text-white border-sky-400'
};

// Full Data with Members (Fallback and Initial Seed)
const INITIAL_COMMITTEES: Omit<Committee, 'id'>[] = [
   {
    name: 'Sunday School',
    icon: 'BookOpen',
    description: 'The Sunday School Committee oversees the spiritual education of children and youth, organizing classes, curriculum, and special events.',
    members: [
        { id: 'ss-c', name: 'Upa David Lalchhanhima', role: 'Chairman' },
        { id: 'ss-vc', name: 'Upa Lalremruata', role: 'Vice Chairman' },
        { id: 'ss-s', name: 'Pu C. Rohmingliana', role: 'Secretary' },
        { id: 'ss-as', name: 'Pu Manliankhupa', role: 'Asst. Secretary' },
        { id: 'ss-m-kc', name: 'Kohhran Committee te', role: 'Member' },
        { id: 'ss-m-dl1', name: 'Pu Zoramenga', role: 'Leader, Senior Dept.' },
        { id: 'ss-m-dl2', name: 'T.Upa Hmingthansanga', role: 'Leader, Sacrament Dept.' },
        { id: 'ss-m-dl3', name: 'Pu V.Lalbiakdika', role: 'Leader, Intermediate Dept.' },
        { id: 'ss-m-dl4', name: 'Tv.H.Lalfakawma', role: 'Leader, Junior Dept.' },
        { id: 'ss-m-dl5', name: 'Pu Mungngaihsanga', role: 'Leader, Primary Dept.' },
        { id: 'ss-m-dl6', name: 'Pi K.Lalbiakthangi', role: 'Leader, Beginners Dept.' },
        { id: 'ss-m-dl7', name: 'Pi K.Lalrokhumi', role: 'Leader, Pre-Beginners Dept.' },
        { id: 'ss-m-lib', name: 'Upa Daikhawzama', role: 'Librarian' }
    ]
  },
  {
    name: 'Finance Committee',
    icon: 'DollarSign',
    description: 'Responsible for managing the church\'s financial resources, including budgeting, fundraising, and transparent reporting.',
    members: [
        { id: 'fin-c', name: 'Upa C.Lalthantluanga', role: 'Chairman' },
        { id: 'fin-vc', name: 'Upa Daikhawzama', role: 'Vice Chairman' },
        { id: 'fin-s', name: 'Pu Lalmuanpuia Ralte', role: 'Secretary' },
        { id: 'fin-as1', name: 'Pu C.Lalmuansanga', role: 'Asst. Secretary' },
        { id: 'fin-as2', name: 'Pu R.Lalmalsawma', role: 'Asst. Secretary' },
        { id: 'fin-m1', name: 'Pu Dawngsuanpauva', role: 'Member' },
        { id: 'fin-m2', name: 'Pu C.Rohmingliana', role: 'Member' },
        { id: 'fin-m3', name: 'Pu Lalsanglura Zote', role: 'Member' },
        { id: 'fin-m4', name: 'Pu Lalramthara', role: 'Member' },
        { id: 'fin-m5', name: 'Pu T.Sangtluanga', role: 'Member' },
        { id: 'fin-m6', name: 'Pu Thangdeihchina', role: 'Member' },
        { id: 'fin-m7', name: 'Pu JC Laldinthara', role: 'Member' },
        { id: 'fin-m8', name: 'Pu MS Dawngliana', role: 'Member' },
        { id: 'fin-m9', name: 'Pu K.Lalengthanga', role: 'Member' },
        { id: 'fin-m10', name: 'Pu C.Lalrawngbawla', role: 'Member' },
        { id: 'fin-m11', name: 'Pu Lalhmingmawia', role: 'Member' },
        { id: 'fin-m12', name: 'Pu Thanglianmanga', role: 'Member' },
        { id: 'fin-m13', name: 'Pu Kenneth Lalthanzauva', role: 'Member' },
        { id: 'fin-m14', name: 'Pu Nelson Khiangte', role: 'Member' },
        { id: 'fin-m15', name: 'Pu Kapthuama', role: 'Member' },
        { id: 'fin-m16', name: 'Pu Khawlrosiama', role: 'Member' },
        { id: 'fin-m17', name: 'Pu Thangkunga Hualngo', role: 'Member' },
        { id: 'fin-m18', name: 'Pu Mungngaihsanga', role: 'Member' },
        { id: 'fin-m19', name: 'Pu C.Malsawmdawngliana', role: 'Member' },
        { id: 'fin-m20', name: 'Pu B.Zelkhangova', role: 'Member' },
        { id: 'fin-m21', name: 'Pu PC Zoramthanga', role: 'Member' },
        { id: 'fin-m22', name: 'Pu K.Lalengkima', role: 'Member' },
        { id: 'fin-m23', name: 'Pu Lalthanghulha', role: 'Member' },
        { id: 'fin-m24', name: 'Pu C.Lalengmawia', role: 'Member' },
        { id: 'fin-m25', name: 'Pu Lalmuanpuia', role: 'Member' },
        { id: 'fin-m26', name: 'Pu Lalramnghakhlela', role: 'Member' },
        { id: 'fin-m27', name: 'Pu F.Lalhriatpuia', role: 'Member' },
        { id: 'fin-m28', name: 'Pu H.Lalzuitluanga', role: 'Member' },
    ]
  },
  {
    name: 'Ramthar Committee',
    icon: 'Globe',
    description: 'Dedicated to supporting missionary work and outreach programs, spreading the Gospel beyond our local community.',
    members: [
      { id: 'ramthar-c', name: 'Upa H.Zairemmawia', role: 'Chairman' },
      { id: 'ramthar-vc', name: 'Pu H.Vanlalthanga', role: 'Vice Chairman' },
      { id: 'ramthar-s', name: 'Pu K.Lalengthanga', role: 'Secretary' },
      { id: 'ramthar-as', name: 'Pu Thangkunga Hualngo', role: 'Asst. Secretary' },
      { id: 'ramthar-t', name: 'Pu T.Sangtluanga', role: 'Treasurer' },
      { id: 'ramthar-fs', name: 'Pu C.Lalrawngbawla', role: 'Fin. Secretary' },
      { id: 'ramthar-m1', name: 'Pu R.Lalremmawia', role: 'Member' },
      { id: 'ramthar-m2', name: 'Upa G.Vanlallawma', role: 'Member' },
      { id: 'ramthar-m3', name: 'Pu C.Lalfaka', role: 'Member' },
      { id: 'ramthar-m4', name: 'Pu Langkhansuana', role: 'Member' },
      { id: 'ramthar-m5', name: 'Pu Lalniliana', role: 'Member' },
      { id: 'ramthar-m6', name: 'Pu Vungzakapa', role: 'Member' },
      { id: 'ramthar-m7', name: 'Pu K.Vanengmawia', role: 'Member' },
      { id: 'ramthar-m8', name: 'Pu Remruatpuia', role: 'Member' },
      { id: 'ramthar-m9', name: 'Pu T.Zonundanga', role: 'Member' },
      { id: 'ramthar-m10', name: 'Pu Thangbuanga Guite', role: 'Member' },
      { id: 'ramthar-m11', name: 'Pu Lalhriatpuia', role: 'Member' },
      { id: 'ramthar-m12', name: 'Pu C.Vanlalduha', role: 'Member' },
      { id: 'ramthar-m13', name: 'Pu HT Lalmalsawma', role: 'Member' },
      { id: 'ramthar-m14', name: 'Pu T.Chalzawna', role: 'Member' },
      { id: 'ramthar-m15', name: 'Pu R.Lalrintluanga', role: 'Member' },
      { id: 'ramthar-m16', name: 'Pu Pauneihthanga', role: 'Member' },
      { id: 'ramthar-m17', name: 'Pu K.Pianthanga', role: 'Member' },
      { id: 'ramthar-m18', name: 'Pu Lianzatluanga', role: 'Member' },
      { id: 'ramthar-m19', name: 'Pu Zonunmawia Khiangte', role: 'Member' },
      { id: 'ramthar-m20', name: 'Pu F.Hmingthanzuala', role: 'Member' },
      { id: 'ramthar-m21', name: 'Pu Thangdeihkhupa', role: 'Member' },
      { id: 'ramthar-m22', name: 'Pu Hmunneihthanga', role: 'Member' },
      { id: 'ramthar-m23', name: 'Pu Lalneihsanga', role: 'Member' },
      { id: 'ramthar-m24', name: 'Pu Lalrawngbawla', role: 'Member' },
      { id: 'ramthar-m25', name: 'Pi Lalbiakkungi', role: 'Member (KH aiawh)' },
      { id: 'ramthar-m26', name: 'Tv.H.Lalfakawma', role: 'Member (KTP aiawh)' },
      { id: 'ramthar-exo1', name: 'Kohhran Committee zawng zawngte', role: 'Ex-Officio Member' }
    ]
  },
  {
    name: 'Building Committee',
    icon: 'Home',
    description: 'Manages the construction, maintenance, and renovation of all church properties and facilities.',
    members: [
        { id: 'bld-c', name: 'Upa David Lalchhanhima', role: 'Chairman' },
        { id: 'bld-vc', name: 'Upa R.Lalramhluna', role: 'Vice Chairman' },
        { id: 'bld-s', name: 'Pu F.Lalhriatpuia', role: 'Secretary' },
        { id: 'bld-as', name: 'Pu HT Lalrinsanga', role: 'Asst. Secretary' },
        { id: 'bld-t', name: 'Pu C.Rohmingliana', role: 'Treasurer' },
        { id: 'bld-fs', name: 'Pu JC Laldinthara', role: 'Fin. Secretary' },
        { id: 'bld-m1', name: 'Upa Lalremruata', role: 'Member' },
        { id: 'bld-m2', name: 'Pu K.Lalbiakhlira', role: 'Member' },
        { id: 'bld-m3', name: 'Pu Thangdeihchina', role: 'Member' },
        { id: 'bld-m4', name: 'Pu VLP Zarzokima', role: 'Member' },
        { id: 'bld-m5', name: 'Pu B.Lalbiaklawma', role: 'Member' },
        { id: 'bld-m6', name: 'Pu Zamsianthanga', role: 'Member' },
        { id: 'bld-m7', name: 'Pu Thangdeihkhupa', role: 'Member' },
        { id: 'bld-m8', name: 'Pu Lalhriatpuia', role: 'Member' },
        { id: 'bld-m9', name: 'Pu Pauneihthanga', role: 'Member' },
        { id: 'bld-m10', name: 'Pu Thangkunga Hualngo', role: 'Member' },
        { id: 'bld-m11', name: 'Pu C.Lalengmawia', role: 'Member' },
        { id: 'bld-m12', name: 'Pu C.Zonunsanga', role: 'Member' },
        { id: 'bld-m13', name: 'Pu Lalremruatveka', role: 'Member' },
        { id: 'bld-m14', name: 'Pu Lalthanghulha', role: 'Member' },
        { id: 'bld-m15', name: 'Pu Zoremmawia', role: 'Member' },
        { id: 'bld-m16', name: 'Pu F.Lalremsiama', role: 'Member' },
        { id: 'bld-m17', name: 'Pu T.Lalramnghaka', role: 'Member' },
        { id: 'bld-m18', name: 'Pu Vanlalruatpuia', role: 'Member' },
        { id: 'bld-m19', name: 'Pu C.Lalchhanhima', role: 'Member' },
        { id: 'bld-m20', name: 'Pu B.Lalnunmawia', role: 'Member' },
        { id: 'bld-m21', name: 'Pu Vardingliana', role: 'Member' },
        { id: 'bld-m22', name: 'Pu C.Lalchhanhima (Bial 9-na)', role: 'Member' },
        { id: 'bld-exo1', name: 'Rev.Lalhmingthanga Chhangte, Bialtu Pastor', role: 'Ex-Officio Member' },
        { id: 'bld-exo2', name: 'Upa Lianpianga, Kohhran Secretary', role: 'Ex-Officio Member' }
    ]
  },
  {
    name: 'Social Front Committee',
    icon: 'Handshake',
    description: 'Organizes community service projects, social welfare initiatives, and outreach to those in need within and outside the church.',
    members: [
      { id: 'sfc-c', name: 'Upa C.Zohmingthanga', role: 'Chairman' },
      { id: 'sfc-vc', name: 'Upa HT Vanlalsawma', role: 'Vice Chairman' },
      { id: 'sfc-s', name: 'Pu Lalsanglura Zote', role: 'Secretary' },
      { id: 'sfc-as', name: 'Pu Dawngsuanpauva', role: 'Asst. Secretary' },
      { id: 'sfc-t', name: 'Pu K.Thuamluaia', role: 'Treasurer' },
      { id: 'sfc-fs', name: 'Pu C.Lalmuansanga', role: 'Fin. Secretary' },
      { id: 'sfc-m1', name: 'Pu JC Laldinthara', role: 'Member' },
      { id: 'sfc-m2', name: 'Pu V.Lalbiakzuala', role: 'Member' },
      { id: 'sfc-m3', name: 'Pu R.Lalrintluanga', role: 'Member' },
      { id: 'sfc-m4', name: 'Pu R.Lalremmawia', role: 'Member' },
      { id: 'sfc-m5', name: 'Pu K.Lalrawna', role: 'Member' },
      { id: 'sfc-m6', name: 'Pu Lalmuanpuia Ralte', role: 'Member' },
      { id: 'sfc-m7', name: 'Pu Thanglianmanga', role: 'Member' },
      { id: 'sfc-m8', name: 'Pu PC Zoramthanga', role: 'Member' },
      { id: 'sfc-m9', name: 'Pu R.Lalmalsawma', role: 'Member' },
      { id: 'sfc-m10', name: 'Pu Thangkunga Hualngo', role: 'Member' },
      { id: 'sfc-m11', name: 'Pu C.Malsawmdawngliana', role: 'Member' },
      { id: 'sfc-m12', name: 'Pu H.Zahmingliana', role: 'Member' },
      { id: 'sfc-m13', name: 'Pu HT Khupa', role: 'Member' },
      { id: 'sfc-m14', name: 'Pu B.Zelkhangova', role: 'Member' },
      { id: 'sfc-m15', name: 'Pi Lalhlimthangi Khiangte', role: 'Member' },
      { id: 'sfc-m16', name: 'Pi R.Lalromawii', role: 'Member' },
      { id: 'sfc-m17', name: 'Pu P.Lalhmingthanga', role: 'Member' },
      { id: 'sfc-m18', name: 'Pu V.Lalbiakdika', role: 'Member' },
      { id: 'sfc-m19', name: 'Pu Manliankhupa', role: 'Member' },
      { id: 'sfc-m20', name: 'Nl.Dr.Lalhlupuii', role: 'Member' },
      { id: 'sfc-m21', name: 'Pu Lalengkima', role: 'Member' },
      { id: 'sfc-m22', name: 'Tv.PC Lalruatsanga', role: 'Member' },
      { id: 'sfc-m23', name: 'Pu B.Lalnumawia', role: 'Member' },
      { id: 'sfc-exo1', name: 'Rev.Lalhmingthanga Chhangte, Bialtu Pastor', role: 'Ex-Officio Member' },
      { id: 'sfc-exo2', name: 'Upa Lianpianga, Kohhran Secretary', role: 'Ex-Officio Member' }
    ]
  },
  {
    name: 'Refreshment Committee',
    icon: 'Coffee',
    description: 'Coordinates hospitality and refreshments for church events, ensuring comfort and fellowship for all attendees.',
    members: [
        { id: 'ref-c', name: 'T.Upa Hmingthansanga', role: 'Chairman' },
        { id: 'ref-vc', name: 'Pu H.Lalzuitluanga', role: 'Vice Chairman' },
        { id: 'ref-s', name: 'Pu Lalramnghakhlela', role: 'Secretary' },
        { id: 'ref-as', name: 'Tv.T.Lalnunzira', role: 'Asst. Secretary' },
        { id: 'ref-t', name: 'Pu Lalthanghulha', role: 'Treasurer' },
        { id: 'ref-fs', name: 'Pu Lalmuanpuia', role: 'Fin. Secretary' },
        { id: 'ref-m1', name: 'Pu Vanlalzamlova', role: 'Member' },
        { id: 'ref-m2', name: 'Pu Tluangzathanga', role: 'Member' },
        { id: 'ref-m3', name: 'Pu Lalthangliana', role: 'Member' },
        { id: 'ref-m4', name: 'Pu Thangvunga', role: 'Member' },
        { id: 'ref-m5', name: 'Pu Joseph Lalnunmawia', role: 'Member' },
        { id: 'ref-m6', name: 'Pu Zoremmawia', role: 'Member' },
        { id: 'ref-m7', name: 'Pu Vanlalrorelpuia', role: 'Member' },
        { id: 'ref-m8', name: 'Pu Lianzatluanga', role: 'Member' },
        { id: 'ref-m9', name: 'Pu MS Dawngkima', role: 'Member' },
        { id: 'ref-m10', name: 'Tv.Lalhmuliana', role: 'Member' },
        { id: 'ref-m11', name: 'Tv.Vanlalzauva', role: 'Member' },
        { id: 'ref-m12', name: 'Pu Lalmalsawma', role: 'Member' },
        { id: 'ref-m13', name: 'Pi C.Lalhruaitluangi', role: 'Member' },
        { id: 'ref-m14', name: 'Pi R.Laldintluangi', role: 'Member' },
        { id: 'ref-m15', name: 'Pi Lalhmunengi', role: 'Member' },
        { id: 'ref-m16', name: 'Pi Biaksangpuii', role: 'Member' },
        { id: 'ref-m17', name: 'Nl.PC Lalthanmawii', role: 'Member' },
        { id: 'ref-m18', name: 'Pi Dimlamniangi', role: 'Member' },
        { id: 'ref-m19', name: 'Pi C.Lalramthari', role: 'Member' },
        { id: 'ref-m20', name: 'Pi Lalchawiliani', role: 'Member' },
        { id: 'ref-m21', name: 'Pi Lalsiamliani', role: 'Member' },
        { id: 'ref-m22', name: 'Nl.Khupngaihzovi', role: 'Member' },
        { id: 'ref-m23', name: 'Nl.Lallianpuii', role: 'Member' },
        { id: 'ref-m24', name: 'Nl.B.Lalrampari', role: 'Member' },
        { id: 'ref-m25', name: 'Nl.Lunngaihsiangi', role: 'Member' },
        { id: 'ref-m26', name: 'Pi Lalthakimi', role: 'Member' },
        { id: 'ref-m27', name: 'Nl.Enlamchingi', role: 'Member' },
        { id: 'ref-m28', name: 'Nl.C.Lalramnunmawii', role: 'Member' },
        { id: 'ref-m29', name: 'Pi Lalfakzuali', role: 'Member' },
        { id: 'ref-exo1', name: 'Rev.Lalhmingthanga Chhangte, Bialtu Pastor', role: 'Ex-Officio Member' },
        { id: 'ref-exo2', name: 'Upa Lianpianga, Kohhran Secretary', role: 'Ex-Officio Member' }
    ]
  },
  {
    name: 'Kristian Chhungkua Committee',
    icon: 'Heart',
    description: 'Promotes Christian family values and provides support for families within the church through various programs and counseling.',
    members: [
        { id: 'kck-c', name: 'Upa Hmingthanmawia Sailo', role: 'Chairman' },
        { id: 'kck-vc', name: 'Pu K.Lalduhawma', role: 'Vice Chairman' },
        { id: 'kck-s', name: 'Pu P.Lalhmingthanga', role: 'Secretary' },
        { id: 'kck-as', name: 'Pi Lalhlimthangi Khiangte', role: 'Asst. Secretary' },
        { id: 'kck-m1', name: 'Pi V.Sangkungi', role: 'Member' },
        { id: 'kck-m2', name: 'Pi H.Lalremtluangi', role: 'Member' },
        { id: 'kck-m3', name: 'Pi Lalrawngbawli', role: 'Member' },
        { id: 'kck-m4', name: 'Pi Dimdawnchingi', role: 'Member' },
        { id: 'kck-m5', name: 'Pi Dimdeihsiani', role: 'Member' },
        { id: 'kck-m6', name: 'Pu C.Lalzova', role: 'Member' },
        { id: 'kck-m7', name: 'Pu Lalramthara', role: 'Member' },
        { id: 'kck-m8', name: 'Pu JC Laldinthara', role: 'Member' },
        { id: 'kck-exo1', name: 'Rev.Lalhmingthanga Chhangte, Bialtu Pastor', role: 'Ex-Officio Member' },
        { id: 'kck-exo2', name: 'Upa Lianpianga, Kohhran Secretary', role: 'Ex-Officio Member' }
    ]
  },
  {
    name: 'Worship Committee',
    icon: 'Music',
    description: 'Plans and organizes all worship services, including music, liturgy, and special programs to enhance the worship experience.',
    members: [
        { id: 'wsp-c', name: 'Upa Lalremruata', role: 'Chairman' },
        { id: 'wsp-vc', name: 'Pu Thangdeihchina', role: 'Vice Chairman' },
        { id: 'wsp-s', name: 'Tv. H. Lalfakawma', role: 'Secretary' },
        { id: 'wsp-as', name: 'Pu Lalhmunngheta', role: 'Asst. Secretary' },
        { id: 'wsp-m1', name: 'Pu C. Lalzova', role: 'Member' },
        { id: 'wsp-m2', name: 'Pu K. Thiangin', role: 'Member' },
        { id: 'wsp-m3', name: 'Pu F. Lalduhawma', role: 'Member' },
        { id: 'wsp-m4', name: 'Pu Ronald Lalhmachhuana', role: 'Member' },
        { id: 'wsp-m5', name: 'Pu C. Lalrawngbawla', role: 'Member' },
        { id: 'wsp-m6', name: 'Pu Thanglianmanga', role: 'Member' },
        { id: 'wsp-m7', name: 'Pu Nelson Khiangte', role: 'Member' },
        { id: 'wsp-m8', name: 'Pu Kapthuama', role: 'Member' },
        { id: 'wsp-m9', name: 'Pu K. Lalengthanga', role: 'Member' },
        { id: 'wsp-m10', name: 'Pu R. Lalmalsawma', role: 'Member' },
        { id: 'wsp-m11', name: 'Pu Zoramenga', role: 'Member' },
        { id: 'wsp-m12', name: 'Tv. T. Lalnunzira', role: 'Member' },
        { id: 'wsp-m13', name: 'Pu K. Lalramngheta', role: 'Member' },
        { id: 'wsp-m14', name: 'Tv. Thangdeihmanga', role: 'Member' },
        { id: 'wsp-m15', name: 'Tv. Vanlalchhana', role: 'Member' },
        { id: 'wsp-m16', name: 'Tv. PB Hmangaihropuia', role: 'Member' },
        { id: 'wsp-m17', name: 'Tv. B. Thangzauva', role: 'Member' },
        { id: 'wsp-m18', name: 'Tv. Liankhankhama', role: 'Member' },
        { id: 'wsp-m19', name: 'Pu Lalramnghakhlela', role: 'Member' },
        { id: 'wsp-m20', name: 'Tv. Thangzasanga', role: 'Member' },
        { id: 'wsp-m21', name: 'Tv. Lalrochawia', role: 'Member' },
        { id: 'wsp-m22', name: 'Tv. Chinngoliana', role: 'Member' },
        { id: 'wsp-m23', name: 'Biak In Enkawltu', role: 'Member' },
        { id: 'wsp-exo1', name: 'Rev. Lalhmingthanga Chhangte, Bialtu Pastor', role: 'Ex-Officio Member' },
        { id: 'wsp-exo2', name: 'Upa Lianpianga, Kohhran Secretary', role: 'Ex-Officio Member' }
    ]
  },
  {
    name: 'Masihi Sangati Committee',
    icon: 'Users',
    description: 'Fosters fellowship and spiritual growth among non-Mizo speaking members, organizing services and activities in Hindi.',
    members: [
        { id: 'msc-c', name: 'T. Upa V. Kaizasiama', role: 'Chairman' },
        { id: 'msc-vc', name: 'Upa B. Hranghlira', role: 'Vice Chairman' },
        { id: 'msc-s', name: 'Pu Kapthuama', role: 'Secretary' },
        { id: 'msc-as', name: 'Pu Mungngaihsanga', role: 'Asst. Secretary' },
        { id: 'msc-t', name: 'Pu PC Zoramthanga', role: 'Treasurer' },
        { id: 'msc-fs', name: 'Pu C. Lalengmawia', role: 'Fin. Secretary' },
        { id: 'msc-m1', name: 'Pu Kenneth Lalthanzauva', role: 'Member' },
        { id: 'msc-m2', name: 'Pu C. Lalchhanhima', role: 'Member' },
        { id: 'msc-m3', name: 'Tv. PB Hmangaihropuia', role: 'Member' },
        { id: 'msc-m4', name: 'Pu T. Lalramnghaka', role: 'Member' },
        { id: 'msc-m5', name: 'Pu Tluangzathanga', role: 'Member' },
        { id: 'msc-m6', name: 'Nl. Ningsianmawii', role: 'Member' },
        { id: 'msc-m7', name: 'Pi H. Lallawmkimi', role: 'Member' },
        { id: 'msc-m8', name: 'Pi Lalchhuanawmi', role: 'Member' },
        { id: 'msc-m9', name: 'Pi Lalbiakdiki', role: 'Member' },
        { id: 'msc-m10', name: 'Nl. Ngurthankimi', role: 'Member' },
        { id: 'msc-m11', name: 'Nl. Niangrosangi', role: 'Member' },
        { id: 'msc-m12', name: 'Nl. Malsawmmawii', role: 'Member' },
        { id: 'msc-m13', name: 'Pi Vanlalawii', role: 'Member' },
        { id: 'msc-m14', name: 'Pu Vanlalruatpuia', role: 'Member' },
        { id: 'msc-m15', name: 'Pu Lalthangliana', role: 'Member' },
        { id: 'msc-m16', name: 'Pu Samuel Lalbiakzuala', role: 'Member' },
        { id: 'msc-m17', name: 'Nl. K. Zothansangi', role: 'Member' },
        { id: 'msc-m18', name: 'Nl. Enlamchingi', role: 'Member' },
        { id: 'msc-m19', name: 'Nl. Vunglamluni', role: 'Member' },
        { id: 'msc-m20', name: 'Nl. Lalhmunmawii', role: 'Member' },
        { id: 'msc-exo1', name: 'Rev. Lalhmingthanga Chhangte, Bialtu Pastor', role: 'Ex-Officio Member' },
        { id: 'msc-exo2', name: 'Upa Lianpianga, Kohhran Secretary', role: 'Ex-Officio Member' },
        { id: 'msc-exo3', name: 'Pu C. Vanlalruata, Masihi Sangati Evangelist', role: 'Ex-Officio Member' }
    ]
  },
  {
    name: 'Reception, Ushering & Decoration Committee',
    icon: 'Smile',
    description: 'Ensures a warm welcome for all visitors and members, manages ushering duties, and beautifies the church premises for services and events.',
    members: [
        { id: 'rud-c', name: 'T.Upa C.Lalthazuala', role: 'Chairman' },
        { id: 'rud-vc', name: 'Pu Zoramenga', role: 'Vice Chairman' },
        { id: 'rud-s', name: 'Tv.Thangdeihmanga', role: 'Secretary' },
        { id: 'rud-as', name: 'Nl.Lalrammawii Renthlei', role: 'Asst. Secretary' },
        { id: 'rud-t', name: 'Nl.PC Lalrintluangi', role: 'Treasurer' },
        { id: 'rud-fs', name: 'Pu V.Lalbiakdika', role: 'Fin. Secretary' },
        { id: 'rud-m1', name: 'Pu Lalengkima', role: 'Member' },
        { id: 'rud-m2', name: 'Pu F.Lalremsiama', role: 'Member' },
        { id: 'rud-m3', name: 'Pu C.Ramtharnghaka', role: 'Member' },
        { id: 'rud-m4', name: 'Pu Lalhmunngheta', role: 'Member' },
        { id: 'rud-m5', name: 'Tv.B.Thangzauva', role: 'Member' },
        { id: 'rud-m6', name: 'Tv.T.Vanneihtluanga', role: 'Member' },
        { id: 'rud-m7', name: 'Tv.Thangzasanga', role: 'Member' },
        { id: 'rud-m8', name: 'Tv.Chinngoliana', role: 'Member' },
        { id: 'rud-m9', name: 'Tv.Lalrochawia', role: 'Member' },
        { id: 'rud-m10', name: 'Nl.Lallawmzuali', role: 'Member' },
        { id: 'rud-m11', name: 'Nl.F.Lalmuankimi', role: 'Member' },
        { id: 'rud-m12', name: 'Nl.Ruthi Lalnunfeli', role: 'Member' },
        { id: 'rud-m13', name: 'Nl.DL Kimi Suante', role: 'Member' },
        { id: 'rud-m14', name: 'Nl.Zosangpuii', role: 'Member' },
        { id: 'rud-m15', name: 'Nl.Lalnunsiami', role: 'Member' },
        { id: 'rud-m16', name: 'Nl.Dr.Catherine Lalhriatpuii', role: 'Member' },
        { id: 'rud-m17', name: 'Nl.Anny Lalliandawli', role: 'Member' },
        { id: 'rud-exo1', name: 'Rev.Lalhmingthanga Chhangte, Bialtu Pastor', role: 'Ex-Officio Member' },
        { id: 'rud-exo2', name: 'Upa Lianpianga, Kohhran Secretary', role: 'Ex-Officio Member' }
    ]
  },
  {
    name: 'Archive & Library Committee',
    icon: 'Library',
    description: 'Preserves the church\'s historical records, documents, and maintains the church library for members to access spiritual resources.',
    members: [
        { id: 'arc-c', name: 'Upa Daikhawzama', role: 'Chairman' },
        { id: 'arc-vc', name: 'Upa K.Vanlalhmuaka', role: 'Vice Chairman' },
        { id: 'arc-s', name: 'Pu Nelson Khiangte', role: 'Secretary' },
        { id: 'arc-as', name: 'Pi PC Lalnunsangi', role: 'Asst. Secretary' },
        { id: 'arc-m1', name: 'Pu C.Lalmuansanga', role: 'Member' },
        { id: 'arc-m2', name: 'Pu Manliankhupa', role: 'Member' },
        { id: 'arc-m3', name: 'Pi PC Lalhmachhuani', role: 'Member' },
        { id: 'arc-m4', name: 'Nl.Ngurbawitluangi', role: 'Member' },
        { id: 'arc-exo1', name: 'Rev.Lalhmingthanga Chhangte, Bialtu Pastor', role: 'Ex-Officio Member' },
        { id: 'arc-exo2', name: 'Upa Lianpianga, Kohhran Secretary', role: 'Ex-Officio Member' }
    ]
  },
  {
    name: 'Bible Society of India (BSI)',
    icon: 'BookOpen',
    description: 'Supports the mission of the Bible Society of India in making Bibles available and accessible to everyone in local languages.',
    members: [
        { id: 'bsi-p', name: 'Upa HT Lalthlengliana', role: 'President' },
        { id: 'bsi-vp', name: 'Pu Vanlalhriata', role: 'Vice President' },
        { id: 'bsi-s', name: 'Pu Thanglianmanga', role: 'Secretary' },
        { id: 'bsi-as', name: 'Pu R.Lalmalsawma', role: 'Asst. Secretary' },
        { id: 'bsi-t', name: 'Pu Khawlrosiama', role: 'Treasurer' },
        { id: 'bsi-fs', name: 'Pu L.Khenpauva', role: 'Fin. Secretary' },
        { id: 'bsi-m1', name: 'Pi V.Lalmangaihi', role: 'Member' },
        { id: 'bsi-m2', name: 'Pu TK Manga', role: 'Member' },
        { id: 'bsi-m3', name: 'Pi S.Vanlalvuani', role: 'Member' },
        { id: 'bsi-m4', name: 'Pi Vanlalengi', role: 'Member' },
        { id: 'bsi-m5', name: 'Pu Lalhmingmawia', role: 'Member' },
        { id: 'bsi-m6', name: 'Pi Lalngaihzuali', role: 'Member' },
        { id: 'bsi-m7', name: 'Pi R.Zairemthangi', role: 'Member' },
        { id: 'bsi-m8', name: 'Pi Rothangveli', role: 'Member' },
        { id: 'bsi-m9', name: 'Pi Lunngaihkimi', role: 'Member' },
        { id: 'bsi-m10', name: 'Pi Lalmuanpuii Hlawndo', role: 'Member' },
        { id: 'bsi-m11', name: 'Pi H.Lalchhanhimi', role: 'Member' },
        { id: 'bsi-m12', name: 'Pi R.Lalropuii', role: 'Member' },
        { id: 'bsi-m13', name: 'Pi KC Lalnunhlimi', role: 'Member' },
        { id: 'bsi-m14', name: 'Pi Lalthanzuali', role: 'Member' },
        { id: 'bsi-exo1', name: 'Rev.Lalhmingthanga Chhangte, Bialtu Pastor', role: 'Ex-Officio Member' },
        { id: 'bsi-exo2', name: 'Upa Lianpianga, Kohhran Secretary', role: 'Ex-Officio Member' },
        { id: 'bsi-exo3', name: 'Pu H. Vanlalthanga, Fin. Secy., Champhai North Branch BSI', role: 'Ex-Officio Member' },
        { id: 'bsi-exo4', name: 'Pu P. Lalhmingthanga, Secretary, Bethel Area BSI', role: 'Ex-Officio Member' },
        { id: 'bsi-exo5', name: 'Pu C. Roliana, Fin. Secy., Bethel Area BSI', role: 'Ex-Officio Member' }
    ]
  },
  {
    name: 'Bungraw Enkawltu Committee',
    icon: 'Box',
    description: 'Manages and maintains all church assets and supplies, ensuring resources are available and in good condition for various church activities.',
    members: [
        { id: 'bec-c', name: 'Upa Lianpianga', role: 'Chairman' },
        { id: 'bec-s', name: 'Pu T.Sangtluanga', role: 'Secretary' },
        { id: 'bec-m1', name: 'T.Upa Hmingthansanga', role: 'Member' },
        { id: 'bec-m2', name: 'Pu C. Lalfaka', role: 'Member' },
        { id: 'bec-m3', name: 'Pu Ronald Lalhmachhuana', role: 'Member' },
        { id: 'bec-m4', name: 'Pu H. Lalfela', role: 'Member' },
        { id: 'bec-m5', name: 'Biak In Enkawltu', role: 'Member' },
        { id: 'bec-exo1', name: 'Rev. Lalhmingthanga Chhangte, Bialtu Pastor', role: 'Ex-Officio Member' },
        { id: 'bec-exo2', name: 'Upa Lianpianga, Kohhran Secretary', role: 'Ex-Officio Member' }
    ]
  },
];

// Type for the active tab per committee
type CommitteeTab = 'members' | 'activities' | 'images';

const Departments: React.FC = () => {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCommitteeId, setExpandedCommitteeId] = useState<string | null>(null);

  // Track the active tab for each expanded committee
  const [activeTabs, setActiveTabs] = useState<Record<string, CommitteeTab>>({});

  // State for Modals
  const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Partial<Committee> | null>(null);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMemberInfo, setEditingMemberInfo] = useState<{ committeeId: string; member?: CommitteeMember } | null>(null);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivityInfo, setEditingActivityInfo] = useState<{ committeeId: string; activity?: any } | null>(null);

  // Committee image upload state
  const [uploadingImageFor, setUploadingImageFor] = useState<string | null>(null);
  const [imageUploadProgress, setImageUploadProgress] = useState<number>(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Activity image upload state (key = `${committeeId}__${activityId}`)
  const [uploadingActivityImage, setUploadingActivityImage] = useState<string | null>(null);
  const [activityImageProgress, setActivityImageProgress] = useState<number>(0);
  const activityImageInputRef = useRef<HTMLInputElement>(null);

  // State for reordering
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const initialOrderRef = useRef<string[]>([]);

  const fetchCommittees = useCallback(async () => {
    setLoading(true);
    if (!db || !db.collection) {
       console.warn("Firestore not available, using static data.");
       setCommittees(INITIAL_COMMITTEES.map((c, i) => ({ ...c, id: `static-${i}`, order: i } as Committee)));
       setIsOfflineMode(true);
       setLoading(false);
       return;
    }

    try {
        const snapshot = await db.collection('committees').get();
        if (!snapshot.empty) {
            const fetchedData = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            })) as Committee[];
            
            // Sort by 'order' if available, otherwise by name
            fetchedData.sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order;
                }
                return a.name.localeCompare(b.name);
            });

            setCommittees(fetchedData);
            initialOrderRef.current = fetchedData.map(c => c.id); // Store initial order
            setIsOfflineMode(false);
        } else {
            // Provide initial order based on index if DB is empty
            setCommittees(INITIAL_COMMITTEES.map((c, i) => ({ ...c, id: `static-${i}`, order: i } as Committee)));
        }
    } catch (error: any) {
        console.warn("Firebase access denied or failed, using static data:", error.message);
        setCommittees(INITIAL_COMMITTEES.map((c, i) => ({ ...c, id: `static-${i}`, order: i } as Committee)));
        setIsOfflineMode(true);
    }
    setLoading(false);
    setHasOrderChanged(false);
  }, []);

  useEffect(() => {
    fetchCommittees();
  }, [fetchCommittees]);

  const handleSeedData = async () => {
    if (!db || !db.collection || !window.confirm("This will DELETE ALL existing committees and re-seed from the initial data. Are you sure?")) {
        return;
    }

    setIsSeeding(true);
    try {
        const committeesRef = db.collection('committees');
        
        // 1. Delete all existing documents
        const existingDocs = await committeesRef.get();
        if (!existingDocs.empty) {
            const deleteBatch = db.batch();
            existingDocs.docs.forEach((doc: any) => {
                deleteBatch.delete(doc.ref);
            });
            await deleteBatch.commit();
            console.log("Existing committees deleted.");
        }

        // 2. Add all new documents from INITIAL_COMMITTEES
        const addBatch = db.batch();
        INITIAL_COMMITTEES.forEach((committeeData, index) => {
            const newDocRef = committeesRef.doc(); // Firestore generates ID
            // Add 'order' field based on index
            addBatch.set(newDocRef, { ...committeeData, order: index });
        });
        await addBatch.commit();
        console.log("Successfully seeded committees!");

        // Refresh the list
        await fetchCommittees();
        alert("Seeding complete!");

    } catch (error) {
        console.error("Error seeding data:", error);
        alert("An error occurred during seeding.");
    }
    setIsSeeding(false);
  };
  
  const handleSaveCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !editingCommittee) return;

    setLoading(true);
    try {
        const { id, ...dataToSave } = editingCommittee;

        if (id && !id.startsWith('static-')) {
            await db.collection('committees').doc(id).set(dataToSave, { merge: true });
        } else {
            // When adding a new committee, put it at the end
            const newOrder = committees.length > 0 ? Math.max(...committees.map(c => c.order || 0)) + 1 : 0;
            await db.collection('committees').add({
                name: dataToSave.name || 'Untitled',
                icon: dataToSave.icon || 'Users',
                description: dataToSave.description || '', // Save description
                members: dataToSave.members || [],
                order: newOrder
            });
        }
        
        setIsCommitteeModalOpen(false);
        setEditingCommittee(null);
        fetchCommittees();
    } catch (error) {
        console.error("Error saving committee:", error);
    }
    setLoading(false);
  };
  
  const handleDeleteCommittee = async (committeeId: string) => {
    if (!db || !window.confirm("Are you sure you want to delete this entire committee?")) return;
    try {
        await db.collection('committees').doc(committeeId).delete();
        fetchCommittees();
    } catch (error) {
        console.error("Error deleting committee:", error);
    }
  };

  const handleSaveMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !editingMemberInfo?.committeeId || !editingMemberInfo.member) return;

    setLoading(true);
    const { committeeId, member } = editingMemberInfo;
    
    try {
        const committeeRef = db.collection('committees').doc(committeeId);
        const doc = await committeeRef.get();
        if (!doc.exists) throw new Error("Committee not found");

        const committeeData = doc.data() as Committee;
        let members = committeeData.members || [];

        if (member.id) { // Editing
            members = members.map(m => m.id === member.id ? member : m);
        } else { // Adding
            const newMember = { ...member, id: Date.now().toString() };
            members.push(newMember);
        }
        
        await committeeRef.update({ members });
        
        setCommittees(prev => prev.map(c => c.id === committeeId ? { ...c, members } : c));
        
        setIsMemberModalOpen(false);
    } catch (error) {
        console.error("Error saving member:", error);
    }
    setLoading(false);
  };

  const handleDeleteMember = async (committeeId: string, memberId: string) => {
    if (!db || !window.confirm("Delete this member?")) return;
    try {
        const committeeRef = db.collection('committees').doc(committeeId);
        const doc = await committeeRef.get();
        if (!doc.exists) throw new Error("Committee not found");

        const committeeData = doc.data() as Committee;
        const members = (committeeData.members || []).filter(m => m.id !== memberId);
        
        await committeeRef.update({ members });
        setCommittees(prev => prev.map(c => c.id === committeeId ? { ...c, members } : c));
    } catch (error) {
        console.error("Error deleting member:", error);
    }
  };

  const handleSaveActivity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !editingActivityInfo?.committeeId || !editingActivityInfo.activity) return;

    setLoading(true);
    const { committeeId, activity } = editingActivityInfo;
    
    try {
        const committeeRef = db.collection('committees').doc(committeeId);
        const doc = await committeeRef.get();
        if (!doc.exists) throw new Error("Committee not found");

        const committeeData = doc.data() as Committee;
        let activities = committeeData.activities || [];

        if (activity.id) { // Editing
            activities = activities.map(a => a.id === activity.id ? activity : a);
        } else { // Adding
            const newActivity = { ...activity, id: Date.now().toString() };
            activities.push(newActivity);
        }
        
        await committeeRef.update({ activities });
        
        setCommittees(prev => prev.map(c => c.id === committeeId ? { ...c, activities } : c));
        
        setIsActivityModalOpen(false);
    } catch (error) {
        console.error("Error saving activity:", error);
    }
    setLoading(false);
  };

  const handleDeleteActivity = async (committeeId: string, activityId: string) => {
    if (!db || !window.confirm("Delete this activity?")) return;
    try {
        const committeeRef = db.collection('committees').doc(committeeId);
        const doc = await committeeRef.get();
        if (!doc.exists) throw new Error("Committee not found");

        const committeeData = doc.data() as Committee;
        const activities = (committeeData.activities || []).filter(a => a.id !== activityId);
        
        await committeeRef.update({ activities });
        setCommittees(prev => prev.map(c => c.id === committeeId ? { ...c, activities } : c));
    } catch (error) {
        console.error("Error deleting activity:", error);
    }
  };

  // ── Image helpers ────────────────────────────────────────────────
  /** Compress an image file to ≤ maxBytes using canvas, returning a Blob */
  const compressImage = (file: File, maxBytes = 200 * 1024): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX_DIM = 1600;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          const scale = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        // Binary-search quality to stay under maxBytes
        let lo = 0.1, hi = 0.95, quality = 0.8;
        const tryQuality = (q: number): Promise<Blob> =>
          new Promise(res =>
            canvas.toBlob(b => res(b!), 'image/jpeg', q)
          );

        const iterate = async (): Promise<Blob> => {
          const blob = await tryQuality(quality);
          if (blob.size <= maxBytes || hi - lo < 0.02) return blob;
          hi = quality;
          quality = (lo + hi) / 2;
          return iterate();
        };
        iterate().then(resolve).catch(reject);
      };
      img.onerror = reject;
      img.src = url;
    });

  const handleImageUpload = async (committeeId: string, file: File) => {
    if (!db || !storage) return;
    setUploadingImageFor(committeeId);
    setImageUploadProgress(0);
    try {
      const compressed = await compressImage(file);
      setImageUploadProgress(30);

      const filename = `committees/${committeeId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const ref = storage.ref(filename);
      const task = ref.put(compressed, { contentType: 'image/jpeg' });

      await new Promise<void>((resolve, reject) => {
        task.on(
          'state_changed',
          snap => {
            const pct = 30 + Math.round((snap.bytesTransferred / snap.totalBytes) * 60);
            setImageUploadProgress(pct);
          },
          reject,
          resolve
        );
      });

      const downloadURL: string = await ref.getDownloadURL();
      setImageUploadProgress(95);

      // Save URL to Firestore
      const committeeRef = db.collection('committees').doc(committeeId);
      const doc = await committeeRef.get();
      const existing = (doc.data() as any)?.images || [];
      const images = [...existing, { id: Date.now().toString(), url: downloadURL, filename }];
      await committeeRef.update({ images });

      setCommittees(prev => prev.map(c => c.id === committeeId ? { ...c, images } : c));
      setImageUploadProgress(100);
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Upload failed. Make sure Firebase Storage is enabled and rules allow writes.');
    } finally {
      setTimeout(() => {
        setUploadingImageFor(null);
        setImageUploadProgress(0);
      }, 800);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (committeeId: string, image: { id: string; url: string; filename?: string }) => {
    if (!db || !window.confirm('Delete this image?')) return;
    try {
      // Remove from Storage if filename is known
      if (storage && image.filename) {
        try { await storage.ref(image.filename).delete(); } catch (_) { /* already gone */ }
      }
      // Remove from Firestore
      const committeeRef = db.collection('committees').doc(committeeId);
      const doc = await committeeRef.get();
      const images = ((doc.data() as any)?.images || []).filter((i: any) => i.id !== image.id);
      await committeeRef.update({ images });
      setCommittees(prev => prev.map(c => c.id === committeeId ? { ...c, images } : c));
    } catch (err) {
      console.error('Delete image failed:', err);
    }
  };

  const handleActivityImageUpload = async (committeeId: string, activityId: string, file: File) => {
    if (!db || !storage) return;
    const key = `${committeeId}__${activityId}`;
    setUploadingActivityImage(key);
    setActivityImageProgress(0);
    try {
      const compressed = await compressImage(file);
      setActivityImageProgress(30);

      const filename = `committees/${committeeId}/activities/${activityId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const ref = storage.ref(filename);
      const task = ref.put(compressed, { contentType: 'image/jpeg' });

      await new Promise<void>((resolve, reject) => {
        task.on('state_changed',
          snap => {
            const pct = 30 + Math.round((snap.bytesTransferred / snap.totalBytes) * 60);
            setActivityImageProgress(pct);
          },
          reject, resolve
        );
      });

      const downloadURL: string = await ref.getDownloadURL();
      setActivityImageProgress(95);

      // Update the specific activity's images array inside Firestore
      const committeeRef = db.collection('committees').doc(committeeId);
      const doc = await committeeRef.get();
      const committeeData = doc.data() as any;
      const activities = (committeeData.activities || []).map((a: any) =>
        a.id === activityId
          ? { ...a, images: [...(a.images || []), { id: Date.now().toString(), url: downloadURL, filename }] }
          : a
      );
      await committeeRef.update({ activities });
      setCommittees(prev => prev.map(c => c.id === committeeId ? { ...c, activities } : c));
      setActivityImageProgress(100);
    } catch (err) {
      console.error('Activity image upload failed:', err);
      alert('Upload failed. Make sure Firebase Storage is enabled.');
    } finally {
      setTimeout(() => { setUploadingActivityImage(null); setActivityImageProgress(0); }, 800);
      if (activityImageInputRef.current) activityImageInputRef.current.value = '';
    }
  };

  const handleDeleteActivityImage = async (committeeId: string, activityId: string, image: { id: string; url: string; filename?: string }) => {
    if (!db || !window.confirm('Delete this image?')) return;
    try {
      if (storage && image.filename) {
        try { await storage.ref(image.filename).delete(); } catch (_) {}
      }
      const committeeRef = db.collection('committees').doc(committeeId);
      const doc = await committeeRef.get();
      const committeeData = doc.data() as any;
      const activities = (committeeData.activities || []).map((a: any) =>
        a.id === activityId
          ? { ...a, images: (a.images || []).filter((i: any) => i.id !== image.id) }
          : a
      );
      await committeeRef.update({ activities });
      setCommittees(prev => prev.map(c => c.id === committeeId ? { ...c, activities } : c));
    } catch (err) {
      console.error('Delete activity image failed:', err);
    }
  };
  // ────────────────────────────────────────────────────────────────

  const handleMoveCommittee = (id: string, direction: 'up' | 'down') => {
    if (searchTerm) return; // Disable reordering when filtering
    
    const currentIndex = committees.findIndex(c => c.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < committees.length) {
      const updatedCommittees = [...committees];
      const [movedCommittee] = updatedCommittees.splice(currentIndex, 1);
      updatedCommittees.splice(newIndex, 0, movedCommittee);
      setCommittees(updatedCommittees);
      setHasOrderChanged(true);
    }
  };

  const handleSaveOrder = async () => {
    if (!db || !db.batch || !window.confirm("Save new committee order?")) return;
    
    setLoading(true);
    try {
        const batch = db.batch();
        committees.forEach((committee, index) => {
            if (committee.id && !committee.id.startsWith('static-')) {
                const docRef = db.collection('committees').doc(committee.id);
                batch.update(docRef, { order: index });
            }
        });
        await batch.commit();
        setHasOrderChanged(false);
        initialOrderRef.current = committees.map(c => c.id);
        alert("Order saved successfully!");
    } catch (error) {
        console.error("Error saving order:", error);
        alert("Failed to save order.");
    }
    setLoading(false);
  };

  const openCommitteeModal = (committee: Partial<Committee> | null) => {
    setEditingCommittee(committee || { name: '', icon: 'Users', description: '', members: [] });
    setIsCommitteeModalOpen(true);
  };

  const openMemberModal = (committeeId: string, member?: CommitteeMember) => {
      setEditingMemberInfo({ committeeId, member: member || { name: '', role: '', phone: '' } });
      setIsMemberModalOpen(true);
  };

  const openActivityModal = (committeeId: string, activity?: any) => {
      setEditingActivityInfo({ committeeId, activity: activity || { title: '', description: '', date: '' } });
      setIsActivityModalOpen(true);
  };

  // Toggle expand and default to 'members' tab on first open
  const toggleExpand = (id: string) => {
    setExpandedCommitteeId(prev => {
      if (prev === id) return null;
      // Set default tab to 'members' if not already chosen for this committee
      setActiveTabs(tabs => ({ ...tabs, [id]: tabs[id] || 'members' }));
      return id;
    });
  };

  const setActiveTab = (committeeId: string, tab: CommitteeTab) => {
    setActiveTabs(prev => ({ ...prev, [committeeId]: tab }));
  };

  const filteredCommittees = committees.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase()) || // Search by description
    c.members?.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold text-church-900 mb-4 text-center">{t.departments.title}</h1>
        <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">{t.departments.subtitle}</p>

        <div className="max-w-md mx-auto mb-8 relative">
            <Search size={20} className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400" />
            <input type="text" className="w-full pl-10 pr-4 py-3 rounded-full border border-slate-300 focus:ring-2 focus:ring-church-500" placeholder="Search committees or members..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        
        {isAdmin && !isOfflineMode && (
          <div className="text-center mb-8 flex flex-wrap justify-center gap-4">
            <button onClick={() => openCommitteeModal(null)} className="inline-flex items-center px-6 py-2 bg-church-600 text-white rounded-full hover:bg-church-700 shadow-sm transition">
              <Plus size={18} className="mr-2" /> Add New Committee
            </button>
            <button 
              onClick={handleSaveOrder} 
              disabled={!hasOrderChanged || loading}
              className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-sm transition disabled:opacity-50"
            >
              <Save size={18} className="mr-2" /> Save Order
            </button>
            <button 
              onClick={handleSeedData} 
              disabled={isSeeding}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
            >
              {isSeeding ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Database size={18} className="mr-2" />}
              Seed All Committees
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader className="animate-spin text-church-500 w-10 h-10" /></div>
        ) : (
          <>
             {isOfflineMode && (
                 <div className="mb-6 p-3 bg-church-50 text-church-700 text-xs rounded text-center flex items-center justify-center">
                    <AlertTriangle size={14} className="mr-2" />
                    Public View Mode. Admin controls are disabled.
                 </div>
             )}

             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredCommittees.map((c, index) => {
                 const Icon = ICON_MAP[c.icon] || Users;
                 const isExpanded = expandedCommitteeId === c.id;
                 const colorClass = ICON_COLORS[c.icon] || 'from-church-600 to-church-800 text-white border-church-400';
                 const currentTab: CommitteeTab = activeTabs[c.id] || 'members';
                 
                 return (
                   <div key={c.id} className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'shadow-lg ring-1 ring-church-200 border-church-300' : 'shadow-sm border-slate-200 hover:shadow-md'}`}>
                     {/* Committee Header — click to expand/collapse */}
                     <div onClick={() => toggleExpand(c.id)} className="p-6 flex items-center justify-between cursor-pointer bg-white relative">
                        <div className="flex items-center">
                            {/* 3D Realistic Rotating Medallion Container */}
                            <div className="perspective-1000 mr-5">
                                <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br border-2 token-3d animate-rotate-y-slow preserve-3d flex items-center justify-center overflow-hidden ${colorClass}`}>
                                    {/* Gloss Shine Layer */}
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shine pointer-events-none z-10"></div>
                                    
                                    {/* Floating Icon */}
                                    <div className="relative z-20 backface-hidden" style={{ transform: 'translateZ(20px)' }}>
                                        <Icon size={26} className="drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" strokeWidth={2.5} />
                                    </div>

                                    {/* Medallion Rim Decoration */}
                                    <div className="absolute inset-0.5 rounded-full border border-white/20 z-0"></div>
                                </div>
                            </div>
                            <div>
                                <h3 className={`text-base font-bold transition-colors ${isExpanded ? 'text-church-900' : 'text-slate-800'}`}>{c.name}</h3>
                                {c.description && (
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{c.description}</p>
                                )}
                            </div>
                        </div>
                        <div className="text-slate-400">{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
                        {isAdmin && !isOfflineMode && (
                           <div className="absolute top-2 right-2 flex space-x-1" onClick={(e) => e.stopPropagation()}>
                             {!searchTerm && (
                                <>
                                    <button 
                                        onClick={() => handleMoveCommittee(c.id, 'up')}
                                        disabled={index === 0}
                                        className="p-1.5 text-slate-500 bg-slate-50 rounded-full hover:bg-slate-100 disabled:opacity-30"
                                        title="Move Up"
                                    >
                                        <ArrowUp size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleMoveCommittee(c.id, 'down')}
                                        disabled={index === filteredCommittees.length - 1}
                                        className="p-1.5 text-slate-500 bg-slate-50 rounded-full hover:bg-slate-100 disabled:opacity-30"
                                        title="Move Down"
                                    >
                                        <ArrowDown size={14} />
                                    </button>
                                </>
                             )}
                             <button onClick={() => openCommitteeModal(c)} className="p-1.5 text-church-600 bg-church-50 rounded-full hover:bg-church-100"><Edit size={14} /></button>
                             <button onClick={() => handleDeleteCommittee(c.id)} className="p-1.5 text-red-500 bg-red-50 rounded-full hover:bg-red-100"><Trash size={14} /></button>
                           </div>
                        )}
                     </div>

                     {/* Expanded Panel */}
                     {isExpanded && (
                         <div className="border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">

                            {/* Description strip */}
                            {c.description && (
                                <div className="px-6 pt-4 pb-3 bg-slate-50/70 border-b border-slate-100">
                                    <p className="text-sm text-slate-600">{c.description}</p>
                                </div>
                            )}

                            {/* ── Tab Bar ── */}
                            <div className="flex border-b border-slate-200 bg-white">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveTab(c.id, 'members'); }}
                                    className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors focus:outline-none ${
                                        currentTab === 'members'
                                            ? 'text-church-700 border-b-2 border-church-600 bg-church-50/60'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <span className="flex items-center justify-center gap-1.5">
                                        <Users size={14} />
                                        Committee Members
                                    </span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveTab(c.id, 'activities'); }}
                                    className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors focus:outline-none ${
                                        currentTab === 'activities'
                                            ? 'text-church-700 border-b-2 border-church-600 bg-church-50/60'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <span className="flex items-center justify-center gap-1.5">
                                        <ClipboardCheck size={14} />
                                        Activities
                                    </span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveTab(c.id, 'images'); }}
                                    className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors focus:outline-none ${
                                        currentTab === 'images'
                                            ? 'text-church-700 border-b-2 border-church-600 bg-church-50/60'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <span className="flex items-center justify-center gap-1.5">
                                        <ImageIcon size={14} />
                                        Images
                                        {((c as any).images?.length ?? 0) > 0 && (
                                            <span className="bg-church-100 text-church-700 text-xs rounded-full px-1.5 py-0.5 leading-none font-bold">
                                                {(c as any).images.length}
                                            </span>
                                        )}
                                    </span>
                                </button>
                            </div>
                            <div className="bg-slate-50/70 p-6">

                                {/* Members Tab */}
                                {currentTab === 'members' && (
                                    <>
                                        {isAdmin && !isOfflineMode && (
                                            <div className="flex justify-end mb-3">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openMemberModal(c.id); }}
                                                    className="text-xs font-semibold text-church-600 bg-church-100 px-3 py-1.5 rounded-md hover:bg-church-200 flex items-center gap-1"
                                                >
                                                    <Plus size={12} /> Add Member
                                                </button>
                                            </div>
                                        )}
                                        {!c.members || c.members.length === 0 ? (
                                            <p className="text-sm text-slate-500 italic text-center py-4">No members listed.</p>
                                        ) : (
                                            <ul className="space-y-3">
                                                {c.members.map((member) => (
                                                    <li key={member.id} className="group flex flex-col sm:flex-row sm:justify-between sm:items-baseline text-sm">
                                                        <span className="font-semibold text-slate-800 flex items-center">{member.name}</span>
                                                        <div className="flex items-baseline">
                                                            <span className="text-slate-500 text-xs sm:text-sm mr-2">{member.role}</span>
                                                            {isAdmin && !isOfflineMode && (
                                                              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition">
                                                                <button onClick={() => openMemberModal(c.id, member)} className="p-1 text-church-600 hover:bg-church-50 rounded"><Edit size={14} /></button>
                                                                <button onClick={() => handleDeleteMember(c.id, member.id!)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash size={14} /></button>
                                                              </div>
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                )}

                                {/* Activities Tab */}
                                {currentTab === 'activities' && (
                                    <>
                                        {isAdmin && !isOfflineMode && (
                                            <div className="flex justify-end mb-3">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openActivityModal(c.id); }}
                                                    className="text-xs font-semibold text-church-600 bg-church-100 px-3 py-1.5 rounded-md hover:bg-church-200 flex items-center gap-1"
                                                >
                                                    <Plus size={12} /> Add Activity
                                                </button>
                                            </div>
                                        )}
                                        {!c.activities || c.activities.length === 0 ? (
                                            <p className="text-sm text-slate-500 italic text-center py-4">No activities listed.</p>
                                        ) : (
                                            <ul className="space-y-4">
                                                {c.activities.map((activity) => (
                                                    <li key={activity.id} className="group flex flex-col text-sm bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                                        {/* Header row: title, date, admin actions */}
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-semibold text-slate-800">{activity.title}</span>
                                                                    {activity.date && <span className="text-xs text-slate-400">{activity.date}</span>}
                                                                </div>
                                                                <p className="text-slate-600 mt-1 text-sm">{activity.description}</p>
                                                            </div>
                                                            {isAdmin && !isOfflineMode && (
                                                                <div className="flex space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                                                                    <button onClick={() => openActivityModal(c.id, activity)} className="p-1 text-church-600 hover:bg-church-50 rounded"><Edit size={14} /></button>
                                                                    <button onClick={() => handleDeleteActivity(c.id, activity.id!)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash size={14} /></button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Activity images grid */}
                                                        {(activity.images?.length > 0 || (isAdmin && !isOfflineMode)) && (
                                                            <div className="mt-3 pt-3 border-t border-slate-100">
                                                                {activity.images?.length > 0 && (
                                                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                                                        {activity.images.map((img: { id: string; url: string; filename?: string }) => (
                                                                            <div key={img.id} className="relative aspect-square rounded-md overflow-hidden bg-slate-100 group/img">
                                                                                <img src={img.url} alt="" className="w-full h-full object-cover transition-transform duration-200 group-hover/img:scale-105" />
                                                                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/40 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover/img:opacity-100">
                                                                                    <button
                                                                                        onClick={() => setLightboxImage(img.url)}
                                                                                        className="p-1 bg-white/90 rounded-full text-slate-700 hover:bg-white shadow"
                                                                                    >
                                                                                        <ZoomIn size={13} />
                                                                                    </button>
                                                                                    {isAdmin && !isOfflineMode && (
                                                                                        <button
                                                                                            onClick={() => handleDeleteActivityImage(c.id, activity.id!, img)}
                                                                                            className="p-1 bg-red-500/90 rounded-full text-white hover:bg-red-600 shadow"
                                                                                        >
                                                                                            <Trash size={13} />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* Admin upload button */}
                                                                {isAdmin && !isOfflineMode && (
                                                                    <div>
                                                                        <input
                                                                            ref={activityImageInputRef}
                                                                            type="file"
                                                                            accept="image/*"
                                                                            className="hidden"
                                                                            id={`act-img-${c.id}-${activity.id}`}
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) handleActivityImageUpload(c.id, activity.id!, file);
                                                                            }}
                                                                        />
                                                                        {uploadingActivityImage === `${c.id}__${activity.id}` ? (
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                <Loader size={13} className="animate-spin text-church-500 shrink-0" />
                                                                                <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                                                                                    <div className="bg-church-500 h-1.5 rounded-full transition-all" style={{ width: `${activityImageProgress}%` }} />
                                                                                </div>
                                                                                <span className="text-xs text-slate-500">{activityImageProgress}%</span>
                                                                            </div>
                                                                        ) : (
                                                                            <label
                                                                                htmlFor={`act-img-${c.id}-${activity.id}`}
                                                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-church-600 bg-church-50 hover:bg-church-100 px-2.5 py-1.5 rounded-md cursor-pointer transition-colors border border-church-200"
                                                                            >
                                                                                <Upload size={12} /> Add Image
                                                                            </label>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                )}

                                {/* Images Tab */}
                                {currentTab === 'images' && (
                                    <div>
                                        {/* Upload area — admin only */}
                                        {isAdmin && !isOfflineMode && (
                                            <div className="mb-4">
                                                <input
                                                    ref={imageInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    id={`img-upload-${c.id}`}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleImageUpload(c.id, file);
                                                    }}
                                                />
                                                <label
                                                    htmlFor={`img-upload-${c.id}`}
                                                    className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl p-5 cursor-pointer transition-colors ${
                                                        uploadingImageFor === c.id
                                                            ? 'border-church-400 bg-church-50 cursor-not-allowed'
                                                            : 'border-slate-300 hover:border-church-400 hover:bg-church-50/40'
                                                    }`}
                                                >
                                                    {uploadingImageFor === c.id ? (
                                                        <>
                                                            <Loader size={22} className="animate-spin text-church-500 mb-2" />
                                                            <p className="text-sm text-church-600 font-medium">Compressing & uploading…</p>
                                                            <div className="w-full mt-3 bg-slate-200 rounded-full h-1.5">
                                                                <div
                                                                    className="bg-church-500 h-1.5 rounded-full transition-all duration-300"
                                                                    style={{ width: `${imageUploadProgress}%` }}
                                                                />
                                                            </div>
                                                            <p className="text-xs text-slate-500 mt-1">{imageUploadProgress}%</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload size={22} className="text-slate-400 mb-2" />
                                                            <p className="text-sm font-medium text-slate-600">Click to upload image</p>
                                                            <p className="text-xs text-slate-400 mt-0.5">Auto-compressed to ≤ 200 KB · JPEG · PNG · WEBP</p>
                                                        </>
                                                    )}
                                                </label>
                                            </div>
                                        )}

                                        {/* Image grid */}
                                        {!(c as any).images?.length ? (
                                            <p className="text-sm text-slate-500 italic text-center py-4">No images uploaded yet.</p>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {((c as any).images as { id: string; url: string; filename?: string }[]).map((img) => (
                                                    <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden bg-slate-100 shadow-sm">
                                                        <img
                                                            src={img.url}
                                                            alt=""
                                                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                                        />
                                                        {/* Hover overlay */}
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                                            <button
                                                                onClick={() => setLightboxImage(img.url)}
                                                                className="p-1.5 bg-white/90 rounded-full text-slate-700 hover:bg-white shadow"
                                                                title="View full size"
                                                            >
                                                                <ZoomIn size={16} />
                                                            </button>
                                                            {isAdmin && !isOfflineMode && (
                                                                <button
                                                                    onClick={() => handleDeleteImage(c.id, img)}
                                                                    className="p-1.5 bg-red-500/90 rounded-full text-white hover:bg-red-600 shadow"
                                                                    title="Delete image"
                                                                >
                                                                    <Trash size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>
                         </div>
                     )}
                   </div>
                 );
               })}
             </div>
             
             {filteredCommittees.length === 0 && (<div className="text-center py-12 text-slate-500"><p>No committees found matching "{searchTerm}"</p></div>)}
          </>
        )}
      </div>
    </div>
    
    {/* Committee Modal */}
    {isCommitteeModalOpen && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <form onSubmit={handleSaveCommittee}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">{editingCommittee?.id ? 'Edit Committee' : 'New Committee'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Committee Name</label>
                  <input required className="w-full border border-slate-300 rounded p-2" value={editingCommittee?.name || ''} onChange={e => setEditingCommittee({...editingCommittee, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t.common.description}</label>
                  <textarea className="w-full border border-slate-300 rounded p-2 h-24" value={editingCommittee?.description || ''} onChange={e => setEditingCommittee({...editingCommittee, description: e.target.value})} placeholder="Brief description of the committee's purpose and activities."></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Icon</label>
                  <select required className="w-full border border-slate-300 rounded p-2" value={editingCommittee?.icon} onChange={e => setEditingCommittee({...editingCommittee, icon: e.target.value})}>
                    {Object.keys(ICON_MAP).map(iconName => <option key={iconName} value={iconName}>{iconName}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end space-x-2 rounded-b-xl">
              <button type="button" onClick={() => setIsCommitteeModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-church-600 text-white rounded flex items-center">{loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} Save</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Member Modal */}
    {isMemberModalOpen && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <form onSubmit={handleSaveMember}>
             <div className="p-6">
              <h3 className="text-lg font-bold mb-4">{editingMemberInfo?.member?.id ? 'Edit Member' : 'Add Member'}</h3>
              <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                    <input required className="w-full border border-slate-300 rounded p-2" value={editingMemberInfo?.member?.name || ''} onChange={e => setEditingMemberInfo({...editingMemberInfo, member: { ...editingMemberInfo?.member, name: e.target.value }})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                    <input required className="w-full border border-slate-300 rounded p-2" value={editingMemberInfo?.member?.role || ''} onChange={e => setEditingMemberInfo({...editingMemberInfo, member: { ...editingMemberInfo?.member, role: e.target.value }})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Phone (Optional)</label>
                    <input className="w-full border border-slate-300 rounded p-2" value={editingMemberInfo?.member?.phone || ''} onChange={e => setEditingMemberInfo({...editingMemberInfo, member: { ...editingMemberInfo?.member, phone: e.target.value }})} />
                  </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end space-x-2 rounded-b-xl">
              <button type="button" onClick={() => setIsMemberModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-church-600 text-white rounded flex items-center">{loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} Save</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Activity Modal */}
    {isActivityModalOpen && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <form onSubmit={handleSaveActivity}>
             <div className="p-6">
              <h3 className="text-lg font-bold mb-4">{editingActivityInfo?.activity?.id ? 'Edit Activity' : 'Add Activity'}</h3>
              <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                    <input required className="w-full border border-slate-300 rounded p-2" value={editingActivityInfo?.activity?.title || ''} onChange={e => setEditingActivityInfo({...editingActivityInfo, activity: { ...editingActivityInfo?.activity, title: e.target.value }})} placeholder="e.g., Annual Retreat" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Date (Optional)</label>
                    <input type="text" className="w-full border border-slate-300 rounded p-2" value={editingActivityInfo?.activity?.date || ''} onChange={e => setEditingActivityInfo({...editingActivityInfo, activity: { ...editingActivityInfo?.activity, date: e.target.value }})} placeholder="e.g., October 15, 2026" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                    <textarea required className="w-full border border-slate-300 rounded p-2 h-24" value={editingActivityInfo?.activity?.description || ''} onChange={e => setEditingActivityInfo({...editingActivityInfo, activity: { ...editingActivityInfo?.activity, description: e.target.value }})} placeholder="Details about the activity..."></textarea>
                  </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end space-x-2 rounded-b-xl">
              <button type="button" onClick={() => setIsActivityModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-church-600 text-white rounded flex items-center">{loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} Save</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* ── Lightbox ── */}
    {lightboxImage && (
      <div
        className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
        onClick={() => setLightboxImage(null)}
      >
        <button
          className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition"
          onClick={() => setLightboxImage(null)}
        >
          <X size={22} />
        </button>
        <img
          src={lightboxImage}
          alt="Full size"
          className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )}
    </>
  );
};

export default Departments;

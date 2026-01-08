
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { ArchiveEntry } from '../types';
import { Archive, FileText, Image, Video, History, File, Plus, Edit, Trash, Search, Loader, ExternalLink, X, Save, Users, Database, ChevronLeft, FolderOpen, AlertTriangle, UserSearch } from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    'Document': FileText,
    'Photo': Image,
    'Video': Video,
    'History': History,
    'Minute': File,
    'Rawngbawltu te': Users 
};

// Sub-categories for Rawngbawltu te
const RAWNGBAWLTU_SUBCATEGORIES = [
    'Executive Body',
    'Ramthar',
    'FINANCE',
    'BUILDING',
    'SOCIAL FRONT',
    'REFRESHMENT',
    'KRISTIAN CHHUNGKUA',
    'WORSHIP',
    'MASIHI SANGATI',
    'BSI',
    'RECEPTION, USHERING & DECORATION',
    'ARCHIVE & LIBRARY',
    'MUSIC',
    'LIGHT & SOUND',
    'SUNDAY SCHOOL', // This is the committee
    'Sunday School Teachers', // New consolidated category
    'THUHRILTU',
    'ṬANTU',
    'KOHHRAN HMEICHHIA',
    'KTP',
    'KOHHRAN PAVALAI PAWL'
];

const SS_DEPARTMENTS = [
    'O.B.',
    'Puitling',
    'Senior',
    'Sacrament',
    'Intermediate',
    'Junior',
    'Primary',
    'Beginner',
    'Pre-Beginner'
];

// Placeholder seed data for other categories
const EXECUTIVE_BODY_SEED_DATA: any[] = [];
const RAMTHAR_SEED_DATA: any[] = [];
const BUILDING_SEED_DATA: any[] = [];
const SOCIAL_FRONT_SEED_DATA: any[] = [];
const REFRESHMENT_SEED_DATA: any[] = [];
const KRISTIAN_CHHUNGKUA_SEED_DATA: any[] = [];
const WORSHIP_SEED_DATA: any[] = [];
const MASIHI_SANGATI_SEED_DATA: any[] = [];
const RECEPTION_USHERING_DECORATION_SEED_DATA: any[] = [];
const ARCHIVE_LIBRARY_SEED_DATA: any[] = [];
const MUSIC_SEED_DATA: any[] = [];
const LIGHT_SOUND_SEED_DATA: any[] = [];
const FINANCE_SEED_DATA: any[] = [];
const BSI_SEED_DATA: any[] = [];
const KTP_SEED_DATA: any[] = [];
const KOHHRAN_HMEICHHIA_SEED_DATA: any[] = [];
const KOHHRAN_PAVALAI_PAWL_SEED_DATA: any[] = [];

const SUNDAY_SCHOOL_TEACHERS_SEED_DATA = [
  { year: '1981', details: "Superintendent : Pu Manhleia\nAsst. Supdt. : Pu Thangchuanga\nAsst. Supdt (NPSS) : Pu Saizama Sailo\nSecretary : Pu B.Hranghlira\nAsst. Secretary : Pu Rinliana\nAsst. Secy (NPSS) : Tv.Rohita\n\n[Puitling zirtirtu]\nPu T.Sawmpauva, Pu P.C.Lalhlira, Pu Zakima, Upa Khawidawla\n\n[Intermediate]\nPu R.D.Lalchhuana, Nl.Rotuahthangi\n\n[Junior]\nPi Lalchhawnkimi, Tv.Goodthanga\n\n[Primary]\nPu Thangngolanga, Nl.Lalnunsangi, Pu Ralkapthanga\n\n[Beginner]\nNl.Biakengi, Tv.Biga, Nl.Bawihthansangi, Nl.Lalchhuanawmi" },
  { year: '1982', details: "Superintendent : Pu Thangchuanga\nAsst. Supdt. : Pu Zakima\nAsst. Supdt (NPSS) : Pu Manhleia\nSecretary : Pu B.Hranghlira\nAsst. Secy (NPSS) : Pu R.D.Lalchhuana\n\n[Puitling zirtirtu]\nPu K.Vanlalhmuaka, Pu Huliana, Pu T.Sawmpauva, Upa Khawidawla, Pu PC.Lalhlira\n\n[Intermediate]\nPu Thangkhatpianga, Nl.Rotuahthangi\n\n[Junior]\nPu Thangngolanga, Tv.Rohita\n\n[Primary]\nPu Tuangsianpauva, Nl.Lalnunsangi, Pi Lalchawii\n\n[Beginner]\nNl.Bawihthansangi, Tv.Biga, Nl.Lalfakzuali, Tv.Rammawia" },
  { year: '1983', details: "Superintendent : Pu Thangchuanga\nAsst. Supdt : Pu Manhleia\nAsst. Supdt (NPSS) : Pu Huliana\nSecretary : Pu B.Hranghlira\nAsst. Secretary : Pu P.C.Lalhlira\nAsst. Secy (NPSS) : Pu R.D.Lalchhuana\n\n[Puitling zirtirtu]\nRecord a awm lo\n\n[Intermediate]\nPu Ramhluna\n\n[Junior]\nPu Ralkapthanga\n\n[Primary]\nPi Lalchawii\n\n[Beginner]\nNl.Bawihthansangi" },
  { year: '1984', details: "Superintendent : Pu Thangchuanga\nAsst. Supdt : Upa Manhleia\nAsst. Supdt (NPSS) : Pu Saizama Sailo\nSecretary : Pu R.D.Lalchhuana\nAsst. Secretary : Pu P.T.Vunga\nAsst. Secy (NPSS) : Pu K.Vanlalhmuaka\n\n[Puitling zirtirtu]\nPu Huliana, Pu Thangkhatpianga, Upa Khawidawla, Pu B.Hranghlira, Pu T.Sawmpauva, Pu Lebo-Solo-a, Pu P.C.Lalhlira, Pu F.Ramhluna, Upa Zadala, Pu R.Khawhluna, Pu Khuangbuaia\n\n[Senior]\nPu Thangngolanga\n\n[Intermediate]\nTv.Paudokima\n\n[Junior]\nPu Ralkapthanga\n\n[Primary]\nPu C.Lalfaka\n\n[Beginner]\nNl.Bawihthansangi" },
  { year: '1985', details: "Superintendent : Pu Huliana\nAsst. Supdt : Pu Thangchuanga\nAsst. Supdt (NPSS) : Pu Saizama Sailo\nSecretary : Pu P.T.Vunga, Pu K.Vanlalhmuaka\nAsst. Secy : Pu K.Vanlalhmuaka\nAsst. Secy (NPSS) : Pu K.Lalkhumliana, Pu Rinsiama\n\n[Puitling zirtirtu]\nUpa Manhleia, Upa Khawidawla, Pu T.Sawmpauva, Pu R.D.Lalchhuana, Pu Khuangbuaia, Pu F.Lalramhluna, Pu P.C.Lalhlira, Pu R.Khawhluna, Pu B.Hranghlira, Tv.Nathanael Soren, Pu Zakima, Pu Pakunga\n\n[Senior]\nPu Thangngolanga\n\n[Intermediate]\nTv.Paudokima\n\n[Junior]\nNl.Bawihthansangi\n\n[Primary]\nPi Lalchawii\n\n[Beginner]\nNl.Rotuahthangi" },
  { year: '1986', details: "Superintendent : Pu Huliana\nAsst. Supdt : Pu Thangchuanga\nAsst. Supdt (NPSS) : Pu B.Hranghlira\nSecretary : Pu K.Vanlalhmuaka\nAsst. Secretary : Pu Rinsiama\nAsst. Secy (NPSS) : Tv.Paudokima\n\n[Puitling zirtirtu]\nUpa Manhleia, Upa Khawidawla, Pu T.Sawmpauva, Pu Thangkhatpianga, Pu R.D.Lalchhuana, Pu R.Khawhluna, Pu P.C.Lalhlira, Pu Khuangbuaia, Pu Zakima, Pu Pakunga, Pu K.Lalduha, Pu Saizama Sailo, Pu Zahnuna, Pu C.Rinliana, Tv.Nathanael Soren, Upa Daikhawzama\n\n[Senior]\nPu Thangngolanga, Pu F.Lalramhluna, Pu C.Ralkapthanga, Pi K.Lalchhawnkimi\n\n[Intermediate]\nPu C.Lalfaka, Pu Pauzathanga, Nl.Lalhlimthangi, Nl.Lalzawmpuii\n\n[Junior]\nNl.Bawihthansangi, Pu Khawtinthanga, Nl.Ngurbawitluangi\n\n[Primary]\nNl.Rotuahthangi, Nl.Vanlalhruaii, Pu Thangliankhama, Tv.Vanlalthanga, Pi Lalchawii\n\n[Beginner]\nNl.R.Lalmuanpuii, Nl.Vanramronghaki, Pi Zokhumi, Pi Thangzuali, Pu Lalnunngheta, Pu Lalhlua, Pu Nunthara\n(Pu H.Kapthianga leh Tv.Zalawma- an thawhna Dept. hriat a ni lo)" },
  { year: '1987', details: "Superintendent : Pu R.Khawhluna\nAsst. Supdt : Upa Manhleia\nAsst. Supdt (NPSS) : Pu B.Hranghlira\nSecretary : Pu K.Vanlalhmuaka\nAsst. Secretary : Upa Daikhawzama\nAsst. Secy (NPSS) : Pu Kap\\hianga\n\n[Puitling zirtirtu]\nPu T.Sawmpauva, Upa Khawidawla, Pu Huliana, Pu Khuangbuaia, Pu Thangkhatpianga, Pu Saizama Sailo, Pu P.C.Lalhlira, Pu Zakima, Pu K.Lalduha, Pu C.Rinliana, Pu R.D.Lalchhuana, Pu R.Pakunga, Upa Zadala, Pu Thangngolanga, Pu Lalengliana, Pu Rinsiama, Pu Zahnuna, Pu C.Zolawma, Pu Thangchuanga, Pu V.L.Hminga, Pu Huatkhansuta\n\n[Senior]\nPu F.Lalramhluna, Pi K.Lalchhawnkimi, Nl.Laldinngheti, Pu C.Lalrintluanga, Pu Ralkapthanga\n\n[Intermediate]\nPu C.Lalnunthara, Tv.Vanlalthanga, Tv.Paudokima, Nl.Bawihthansangi, Nl.P.C.Lalchhuanawmi, Pu Lalhlua, Pu H.T.Vanlalsawma, Pi P.C.Lalhmachhuani\n\n[Junior]\nPu C.Lalfaka, Nl.Rotuahthangi, Nl.Lalhlimthangi, Pu Hauchhawna, Pu Biakhlira\n\n[Primary]\nPu R.Khawtinthanga, Tv.David Lalchhanhima, Nl.R.Lalmuanpuii, Pi Zokhumi, Pu Lalnunngheta, Tv.Lawmsanga, Pu Lalvunga, Nl.Vanramronghaki\n\n[Beginner]\nPu Thangliankhama, Tv.Engkhanchina, Pu Lalrinenga, Nl.Lalzawmpuii, Nl.Ngurbawitluangi, Nl.Vanlalhruaii, Nl.Lalbanthangi, Tv.Ramhluna, Tv.Tlangdailova, Nl.Lalrinmawii, Nl.Vanlaldinliani" },
  { year: '1988', details: "Superintendent : Pu R.Khawhluna\nAsst. Supdt : Pu H.Huliana\nAsst. Supdt (NPSS) : Pu K.Vanlalhmuaka\nSecretary : Upa Daikhawzama\nAsst. Secretary : Tv.Biakmawia\nAsst. Secy (NPSS) : Pu Kap\\hianga\n\n[Puitling zirtirtu]\nUpa Manhleia, Upa B.Hranghlira, Upa Khawidawla, Pu T.Sawmpauva, Pu Khuangbuaia, Pu Saizama Sailo, Pu Thangkhatpianga, Pu P.C.Lalhlira, Pu K.Lalduha, Pu Zakima, Pu C.Rinliana, Pu Thangchuanga, Pu Thangngolanga, Upa Zadala, Pu Lalengliana, Pu Huatkhansuta, Pu V.L.Hminga, Pu Rinsiama, Pu R.Pakunga, Pu Saibuanga, Pu C.Zolawma, Pi P.C.Lalhmachhuani, Pu Lalzinga, Pu C.Lalramliana, Pu R.D.Lalchhuana, Pu K.Zamuana, Pu Kapliana\n\n[Senior]\nPu F.Lalramhluna, Pu C.Lalrintluanga, Pu C.Ralkapthanga, Pi K.Lalchhawnkimi, Nl.Laldinngheti\n\n[Intermediate]\nPu C.Lalparliana, Tv.Lawmsanga, Pu Lalparliana, Nl.Lalhlimthangi, Nl.Bawihthansangi, Pu Lalnunngheta, Tv.Vanlalthanga, Nl.Lalchhuanawmi, Nl.Lalzawmpuii, Pu Thangdeihchina, Pu Lalrawna\n\n[Junior]\nPu C.Lalfaka, Tv.Biakzara, Nl.Vanlalhruaii, Pu Hauchhawna, Pu Biakhlira, Nl.Lalzarmawii, Nl.Vanlaldinliani, Nl.Lalrinmawii, Pu Lalthlengliana, Pu Lalrinenga, Pu Khuang\\huama\n\n[Primary]\nPu R.Khawtinthanga, Tv.Engkhanchina, Tv.David Lalchhanhima, Nl.R.Lalmuanpuii, Nl.Ngurbawitluangi, Pu Lalhlua, Tv.Lawmsanga, Nl.Vanramronghaki, Nl.Lalsangliani, Pi Zomawii\n\n[Beginner]\nPu Thangliankhama, Tv.Lalduhawma, Pi Zokhumi, Pi Rotuahthangi, Nl.Lalnunsangi, Nl.Lalhmingi, Tv.Tlangdailova, Tv.Ramhluna, Tv.Lalhmangaiha, Pu Lalfakzuala" },
  { year: '1989', details: "Superintendent : Pu R.Khawhluna\nAsst. Supdt : Pu H.Huliana\nAsst. Supdt (NPSS) : Upa K.Vanlalhmuaka\nSecretary : Upa Daikhawzama\nAsst. Secretary : Pu H.T.Vanlalsawma\nAsst. Secy (NPSS) : Pu Kap\\hianga & Tv.David Lalchhanhima\n\n[Puitling zirtirtu]\nUpa Manhleia, Upa B.Hranghlira, Upa Khawidawla, Pu Saizama Sailo, Pu Khuangbuaia, Pu T.Sawmpauva, Pu Thangkhatpianga, Pu P.C.Lalhlira, Pu V.L.Hminga, Pi P.C.Lalhmachhuani, Pu R.Pakunga, Pu F.Rinsiama, Pu Huatkhansuta, Pu C.Zolawma, Pu Thangngolanga, Pu K.Lalduha, Upa Zadala, Pu C.Rinliana, Pu C.Lalramliana, Pu K.Zakima, Pu R.D.Lalchhuana, Pu Saibuanga, Pu Thangliankhama, Pu P.C.Thanhluma, Pu C.Lalthlamuana, Pu Tualzachina\n\n[Senior]\nPu C.Lalrintluanga, Pu C.Ralkapthanga, Pi K.Lalchhawnkimi, Tv.Lalbiakmawia, Nl.Laldinngheti, Nl.C.Tharmawii, Pi Zodingliani\n\n[Intermediate]\nPu P.C.Lalhmingliana, Tv.Biakzara, Pu Lalnunngheta, Pu Lalthlengliana, Pu Biakhlira, Pu C.Pakunga, Nl.Bawihthansangi, Nl.Lalhlimthangi, Nl.Vanlaldinliani, Nl.R.Lalmuanpuii, Tv.Rohita\n\n[Junior]\nPu C.Lalfaka, Tv.Lawmsanga, Pu Khuang\\huama, Tv.Zohmangaiha, Pu R.Lalramhluna, Nl.Ngurbawitluangi, Nl.Vanramronghaki, Nl.Vanlalhruaii, Nl.Lalzawmpuii, Nl.Lalzamliani\n\n[Primary]\nPu Hauchhawna, Tv.Engkhanchina, Pu Rinenga, Pu Ngenkhanpauva, Tv.Ramhluna, Tv.S.Vana, Nl.Lalrinmawii, Nl.Lalnunsangi, Nl.Lalsangliani, Nl.Lalchhuanawmi, Nl.Lalzarmawii, Pi Rotuahthangi, Pu Zamdothanga\n\n[Beginner]\nPu C.Lalparliana, Tv.Ramzauva, Pu Lalrawna, Pu Lalfakzuala, Tv.Lalpianmawia, Tv.Lalduhawma, Tv.Zohmingliana, Pi Zokhumi, Pi Rintluangi, Nl.Lalventhangi, Nl.F.Lalthianghlimi, Nl.Lalbiakthangi, Nl.Zuiliani, Nl.Vanlalhruaii, Pi Lalpuii, Pi Thankhumi" },
  { year: '1990', details: "Superintendent : Upa B.Hranghlira\nAsst. Supdt : Pu R.Khawhluna\nAsst. Supdt (NPSS) : Upa K.Vanlalhmuaka\nSecretary : Pu H.T.Vanlalsawma\nAsst. Secretary : Pu R.Lalhmangaiha\nAsst. Secry (NPSS) : Pu P.C.Lalhmingliana & Tv.David Lalchhanhima/Pu R.Lalrintluanga\n\n[Puitling zirtirtu]\nUpa Manhleia, Upa Khawidawla, Upa Daikhawzama, Upa Zadala, Pu H.Huliana, Pu R.Khawhluna, Pu K.Lalduha, Pu T.Sawmpauva, Pu C.Khuangbuaia, Pu Saizama Sailo, Pu Thangkhatpianga, Pu P.C.Lalhlira, Pu R.D.Lalchhuana, Pu Huatkhansuta, Pu Thangngolanga, Pi P.C.Lalhmachhuani, Pu Thangliankhama, Pu C.Lalthlamuana, Pu F.Lalramhluna, Pu Huatkhanliana, Pi K.Lalchhawnkimi, Pu Lalthlengliana, Pu C.Rinliana, Pu C.Lalramliana, Pu V.Lalpianga, Pu Thangzakhuma, Upa Hleikapa, Pu C.Zolawma, Pu F.Rinsiama, Pu Lalthangpuia, Pu Lalthlamuana\n\n[Senior]\nPu C.Lalrintluanga, Pu C.Ralkapthanga, Pu Pauzathanga, Nl.Laldinngheti, Nl.C.Tharmawii, Nl.Bawihthansangi, Pu Hauchhawna, Nl.Lalthanpuii, Pi Sangzuali, Nl.C.Vanlalhruaii, Nl.Lalhlimthangi, Tv.Rohita, Pu Lalduata\n\n[Intermediate]\nPu C.Lalfaka, Nl.Vanlaldinliani, Nl.Lalhlimthangi, Nl.R.Lalmuanpuii, Pu K.Lalrawna, Nl.Ngurbawitluangi, Nl.Vanramronghaki, Tv.Lalbiakhnuna, Pu K.Biakhlira, Pu Hrangliankapa\n\n[Junior]\nPu C.Pakunga, Nl.Lalzamliani, Pu R.Lalramhluna, Pu Khuang\\huama, Nl.C.Vanlalhruaii, Pi Rotuahthangi, Nl.Lalzawmpuii, Tv.Lalpianmawia, Tv.Lalduhawma, Tv.Zohmangaiha, Thangdeihchina, Nl.C.Lalhmingmawii\n\n[Primary]\nPu Ngenkhanpaua, Tv.Engkhanchina, Pu Zamdothanga, Tv.S.Vana, Nl.Lalsangliani, Nl.Lalchhuanawmi, Nl.Lalthianghlimi, Tv.Zalawma, Pi Rintluangi, Pu Lalkhawzauva, Pu K.Zasanga, Pu T.C.Vanlala, Tv.Biakmawia\n\n[Beginner]\nPu C.Lalparliana, Nl.C.Vanlalhruaii, Nl.Dimdeihsiani, Pi Zokhumi, Pi P.C.Thankhumi, Pi Lalpuii, Pi Ramthari, Nl.Lalzuiliani, Nl.Lalbiakthangi, Pi Hmingdailovi, Tv.Lawmsanga, Pu Tinngaihthanga, Nl.Lianngaihmani, Pi Lalparmawii, Pi Thangpuii, Nl.Dimdeihliani, Tv.Nangzasuana" },
  { year: '1991', details: "Superintendent : Upa B.Hranghlira\nAsst. Supdt. : Pu H.Kap\\hianga\nAsst. Supdt (NPSS) : Upa K.Vanlalhmuaka\nSecretary : Pu H.T.Vanlalsawma\nAsst. Secretary : Pu R.Lalhmangaiha\nAsst. Secy (NPSS) : Pu P.C.Lalhmingliana & Pu R.Lalrintluanga\n\n[Puitling zirtirtu]\nUpa Manhleia, Upa Khawidawla, Pu H.Huliana, Pu R.Khawhluna, Pu K.Lalduha, Pu T.Sawmpauva, Pu C.Khuangbuaia, Pu Saizama Sailo, Pu Thangkhatpianga, Upa Daikhawzama, Pu P.C.Lalhlira, Upa Zadala, Pu R.D.Lalchhuana, Pu Huatkhansuta, Pu Thangngolanga, Pi P.C.Lalhmachhuani, Pu Thangliankhama, Pu P.C.Lalthlamuana, Pi K.Lalchhawnkimi, Pu F.Lalramhluna, Pu Huatkhanliana, Pu C.Lalramliana, Pu C.Rinliana, Pu V.Lalpianga, Pu Thangzakhuma, Upa Hleikapa, Pu Lalthangpuia, Pu F.Rinsiama, Pu Lalthlamuana, Pu K.Zakima, Upa G.Vanlalawma, Pu Thangseia\n\n[Senior]\nPu C.Lalrintluanga, Pu Pauzathanga, Pu C.Ralkapthanga, Pu K.Lalduata, Nl.Bawihthansangi, Nl.Lalhlimthangi, Nl.K.C.Vanlalhruaii, Pi Lalsangzuali, Nl.Laldinngheti\n\n[Intermediate]\nPu P.C.Lalhmingliana, Nl.Vanlaldinliani, Pu Hauchhawna, Pu Lalthlengliana, Pu Hrangliankapa, Tv.Zohmangaiha, Nl.Lalchhuanawmi, Nl.Ngurbawitluangi, Nl.Zarmawii, Nl.K.Dawngzuali, Pu C.Pakunga\n\n[Junior]\nPu C.Lalfaka, Nl.Zothanmawii, Pu T.C.Vanlala, Pu Thangdeihchina, Pu Khuang\\huama, Tv.Lalduhawma, Pu Rintluanga, Nl.Lalhmingmawii, Nl.Lalsangliani, Nl.Lalzuiliani, Pi Rotuahthangi, Pu R.Lalramhluna, Nl.Vanramronghaki\n\n[Primary]\nPu Ngenkhanpaua, Nl.Laltlanruali, Tv.H.Lalzirliana, Tv.Biakmawia, Pi Rintluangi, Nl.Lalthannguri, Nl.Lalzamliani, Nl.Dimdeihliani, Nl.Lalengmawii, Nl.Lalbiakthangi, Nl.M.C.Vanlalhruaii, Pi Lalparmawii, Pu K.Zasanga, Tv.Engkhanchina\n\n[Beginner]\nPu C.Lalparliana, Nl.Hrangkungi, Pu T.Thanga, Tv.Nangzasuana, Pu Biakzara, Pi Zokhumi, Pi Thankhumi, Pi Thangpuii, Nl.Lianngaihmani, Nl.Dimdeihsiani, Nl.Vanramthari, Nl.Ramthianghlimi, Pu V.L.Dinga" },
  { year: '1992', details: "Superintendent : Pu C.Khuangbuaia\nAsst. Supdt : Upa K.Vanlalhmuaka\nAsst. Supdt (NPSS) : Pu Saizama Sailo\nSecretary : Pu C.Lalrintluanga\nAsst. Secretary : Pu R.Lalhmangaiha\nAsst. Secy (NPSS) : Tv.David Lalchhanhima & Tv.C.Roenga\n\n[Puitling zirtirtu]\nUpa Manhleia, Upa Khawidawla, Upa B.Hranghlira, Pu H.Huliana, Pu R.Khawhluna, Pu K.Lalduha, Pu T.Sawmpauva, Pu Thangkhatpianga, Upa Daikhawzama, Pu P.C.Lalhlira, Pu R.D.Lalchhuana, Pu Huatkhansuta, Pu Thangngolanga, Pi P.C.Lalhmachhuani, Pi K.Lalchhawnkimi, Pu Thangliankhama, Pu C.Lalramliana, Pu V.Lalpianga, Upa Hleikapa, Upa Zadala, Pu Huatkhanliana, Pu C.Rinliana, Pu Lalthangpuia, Pu K.Zakima, Upa G.Vanlallawma, Pu Thangseia, Pu F.Rinsiama, Pu Lalthlamuana, Pu H.Kap\\hianga, Pu R.Vanhnuaithanga\n\n[Senior]\nPu H.T.Vanlalsawma, Pu Pauzathanga, K.Lalrawna, Pu K.Lalduata, Nl.Bawihthansangi, Nl.Lalhlimthangi, Pu C.Hmingliana, Pi Lalsangzuali, Nl.Laldinngheti\n\n[Intermediate]\nPu P.C.Lalhmingliana, Tv.Zohmangaiha, Pu Hauchhawna, Pu Khuang\\huama, Pu R.Lalramhluna, Tv.F.Lalduhawma, Nl.Ngurbawitluangi, Nl.P.C.Lalchhuanawmi, Nl.C.Vanlaldinliani\n\n[Junior]\nPu C.Lalfaka, Pu T.C.Vanlala, Pu R.Lalrintluanga, Pu Lalzidinga, Pu Lallawmsanga, Pi Zorampari, Pi Lalengzami, Nl.Zarmawii, Nl.Lalzuiliani, Nl.Laldawngzuali\n\n[Primary]\nPu Ngenkhanpaua, Pu H.Lalzirliana, Pu Thangdeihchina, Tv.Biakmawia, Tv.Nangzasuana, Pi Lalrintluangi, Pi Lalengliani, Nl.Lalzamliani, Nl.Lalbiakthangi, Nl.Laltlansangi, Nl.Laltlanruali, Nl.C.Vanlalhruaii, Nl.C.Ramthianghlimi, Nl.Lalengmawii\n\n[Beginner]\nPu C.Lalparliana, Pu T.Thanga, Pu Lalthara, Tv.Vanrama, Pi Zokhumi, Pi P.C.Thankhumi, Pi Thangpuii, Pi Lalhmingliani, Nl.Hrangkungi, Nl.Dimdeihsiani, Nl.Zothanmawii, Nl.Biakthangpuii, Nl.Ngairosangi, Nl.Lalawmpuii" },
  { year: '1993', details: "Superintendent : Upa K.Vanlalhmuaka\nAsst. Superintendent : Pu C.Khuangbuaia\nAsst. Supdt (NPSS) : Pu H.T.Vanlalsawma\nSecretary : Pu C.Lalrintluanga\nAsst. Secretary : Pu R.Lalhmangaiha\nAsst. Secy (NPSS) : Tv.Lalduhawma\n\n[Puitling zirtirtu]\nUpa Manhleia, Upa Khawidawla, Upa B.Hranghlira, Upa Saizama Sailo, Pu H.Huliana, Pu R.Khawhluna, Pu K.Lalduha, Upa Daikhawzama, Pu Thangkhatpianga, Pu T.Sawmpauva, Pu P.C.Lalhlira, Pu R.D.Lalchhuana, Pi P.C.Lalhmachhuani, Pi K.Lalchhawnkimi, Pu Thangngolanga, Pu Thangliankhama, Pu FC Lalramhluna, Pu V.Lalpianga, Upa Hleikapa, Upa Zadala, Pu C.Rinliana, Pu K.Zakima, Pu H.Kap\\hianga, Pu Lalthlamuana, Pu R.Vanhnuaithanga, Pu Hrangluia, Pu R.Samuela, Pu Huatkhansuta\n\n[Senior]\nPu P.C.Lalhmingliana, Pu Pauzathanga, Pu C.Hmingliana, Pu K.Lalrawna, Nl.Laldinngheti, Nl.Bawihthansangi, Pi Lalsangzuali, Nl.Lalhlimthangi, Nl.P.C.Lalchhuanawmi\n\n[Intermediate]\nPu K.Lalduata, Tv.Zohmangaiha, Tv.David Lalchhanhima, Pu R.Lalramhluna, Nl.Ngurbawitluangi, Nl.Vanlaldinliani, Nl.Lalzamliani, Pu Lallawmsanga\n\n[Junior]\nPu C.Lalparliana, Pu R.Lalrintluanga, Pu T.Thanga, Pu Hauchhawna, Pi Zokhumi, Pi Lalrintluangi, Nl.Lalzuiliani, Nl.Laltlansangi\n\n[Primary]\nPu C.Lalfaka, Pu H.Lalzirliana, Pu Thangdeihchina, Pi P.C.Thankhumi, Pi Lalengliani, Nl.Laltlanruali, Nl.Ramthianghlimi, Nl.Lalawmpuii\n\n[Beginner]\nPu Ngenkhanpauva, Pu T.C.Vanlala, Pu Lalthanzuala, Pu K.Nunthara, Tv.Kapfela, Pi Thangpuii, Pi Lalhmingliani, Nl.Hrangkungi, Nl.Zothanmawii, Nl.Vanlalnghaki, Nl.Lalrinmuani, Nl.Dimdeihsiani" },
  { year: '1994', details: "Superintendent : Upa K.Vanlalhmuak\nAsst. Supdt : Pu H.T.Vanlalsawma\nAsst. Supdt (NPSS) : Upa Saizama Sailo\nSecretary : Pu K.Lalduata\nAsst. Secretary : Pu R.Lalhmangaiha\nAsst. Secy (NPSS) : Pu R.Lalramhluna\n\n[Puitling zirtirtu]\nUpa Manhleia, Upa Khawidawla, Upa B.Hranghlira, Pu C.Khuangbuaia, Pu H.Huliana, Pu R.Khawhluna, Upa Daikhawzama, Pu Thangkhatpianga, Pu K.Lalduha, Pu P.C.Lalhlira, Pu T.Sawmpauva, Pu K.Zakima, Pu Thangngolanga, Pu Huatkhansuta, Pu V.Lalpianga, Upa Hleikapa, Pu Thangliankhama, Pu F.C.Lalramliana, Pu H.Kap\\hianga, Upa Zadala, Pi PC.Lalhmachhuani, Pi K.Lalchhawnkimi, Pu C.Rinliana, Pu R.Vanhnuaithanga, Pu R.Samuela, Pu C.Lalrintluanga, Pu C.Hmingliana, Pu Lalthlamuana\n\n[Senior]\nPu P.C.Lalhmingliana, Pu K.Lalrawna, Pi Lalsangzuali, Nl.Bawihthansangi, Nl.Laldinngheti, Nl.PC.Lalchhuanawmi, Tv.David Lalchhanhima, Nl.Lalhlimthangi, Nl.Laldinliani, Pi H.Zaichhungi\n\n[Intermediate]\nPu C.Lalfaka, Tv.F.Lalduhawma, Pu Hauchhawna, Pu R.Lalrintluanga, Pu Lalremmawia, Nl.Lalzamliani, Nl.Lalzuiliani, Nl.Lalawmpuii, Pi B.Bualchhumi, Pu H.Vanlalthanga\n\n[Junior]\nPu C.Lalparliana, Pu T.Thanga, Pu K.Nunthara, Pi Lalrintluangi, Pi Zokhumi, Nl.Laltlansangi, Nl.Lalengmawii, Nl.Ramthianghlimi, Nl.Lalrinawmi, Nl.Laltlanruali, Pu Lalzirliana, Tv.Lalropuia\n\n[Primary]\nTv.Zohmangaiha, Pi Lalengliani, Nl.Ngurbawitluangi, Nl.Zothanmawii, Nl.Hrangkungi, Nl.Lalnunthari, Tv.Kapfela, Tv.Lalrokima, Pi Thankhumi\n\n[Beginner]\nPu Ngenkhanpauva, Pi Thangpuii, Pi Lalhmingliani, Nl.Lalrinmuani, Tv.PC.Lalchuangkima, Pi Lalvuli, Nl.Vanlalnghaki, Pu Lalrindika, Pu Lalthanzuala" },
  { year: '1995', details: "Superintendent : Upa Saizama Sailo\nAsst. Supt (NPSS) : Upa H.T.Vanlalsawma\nSecretary : Pu K.Lalduata\nAsst. Secretary : Pu R.Lalhmangaiha\nAsst. Secy (NPSS) : Pu R.Lalramhluna & Tv.Lalthlanawma\n\n[Puitling zirtirtu]\nUpa Manhleia, Upa Khawidawla, Upa B.Hranghlira, Upa K.Vanlalhmuaka, Pu H.Huliana, Pu R.Khawhluna, Pu K.Lalduha, Pu C.Khuangbuaia, Upa Daikhawzama, Pu P.C.Lalhlira, Pu K.Zakima, Pu Thangngolanga, Pu Huatkhansuta, Pu V.Lalpianga, Upa Hleikapa, Pu FC.Lalramhluna, Pu H.Kap\\hianga, Upa Zadala, Pi.PC.Lalhmachhuani, Pi K.Lalchhawnkimi, Pu R.Vanhnuaithanga, Pu C.Lalrintluanga, Pu C.Hmingliana, Pu Pauzathanga, Pu T.Sawmpauva, Pu Thatkunga\n\n[Senior]\nPu K.Lalrawna, Nl.Laldinngheti, Pi Lalsangzuali, Tv.David Lalchhanhima, Nl.Lalchhuanawmi, Nl.Bawihthansangi, Nl.Laldinliani, Nl.Lalhlimthangi, Pu Ngenkhanpauva\n\n[Intermediate]\nPu C.Lalfaka, Tv.F.Lalduhawma, Pu H.Vanlalthanga, Nl.Lalawmpuii, Pi Bualchhumi, Nl.Laltlansangi, Pu Lal\\anpuia\n\n[Junior]\nPu C.Lalparliana, Pu K.Nunthara, Pi Lalengliani, Pi Nuchhungi, Tv.Lalropuia, Nl.Ramthianghlimi, Nl.Laltlanruali, Nl.Ngurbawitluangi, Nl.Laltei, Pi Lalzikpuii, Pi Nuchhungi\n\n[Primary]\nTv.Zohmangaiha, Nl.Zothanmawii, Pi Lalrintluangi, Nl.Hrangkungi, Nl.C.Lalnunthari, Pu Lalrindika, Tv.Lalmuanpuia, Nl.PC.Lalhlimpuii, Pu Thangdeihchina, Pi P.S.Ronghaki, Tv.Lalchhuanmawia\n\n[Beginner]\nPi Zokhumi, Pu R.Lalremmawia, Tv PC.Lalchuangkima, Tv.Lalhmingliana, Pi Lalnunziri, Pi Zothanpari, Nl.Zomuansangi, Nl.Lalchhandami, Nl.H.Lawmkimi, Nl.Lalmuanawmi, Pi F.Lalduati" },
  { year: '1996', details: "Superintendent : Upa Khawidawla\nAsst. Superintendent : Upa Saizama Sailo\nAsst. Supdt (NPSS) : Pu R.Khawhluna\nSecretary : Pu P.C.Lalhmingliana\nAsst. Secretary : Pu R.Lalhmangaiha\nAsst. Secy (NPSS) : Pu H.Vanlalthanga\n\n[Puitling zirtirtu]\nPu H.Huliana, Upa B.Hranghlira, Upa Manhleia, Upa Saizama Sailo, Pu C.Khuangbuaia, Upa K.Vanlalhmuaka, Upa Daikhawzama, Upa HT.Vanlalsawma, Pu K.Zakima, Pu Huatkhansuta, Upa Hleikapa, Pu H.Kap\\hianga, Pi PC.Lalhmachhuani, Pu R.Vanhnuaithanga, Pu C.Hmingliana, Pu T.Sawmpauva, Pu K.Lalduha, Pu PC.Lalhlira, Pu Thangngolanga, Pu V.Lalpianga, Upa Zadala, Pi K.Lalchhawnkimi, Pu C.Lalrintluanga, Pu Pauzathanga, Pu Thatkunga, Pu RD.Lalchhuana, Pu H.Zakima, Pu K.Lalduata\n\n[Senior]\nPu K.Lalrawna, Pu C.Lalfaka, Nl.Laldinngheti, Pi Lalsangzuali, Nl.Bawihthansangi, Nl.Lalhlimthangi, Nl.Ngurbawitluangi, Tv.David Lalchhanhima, Pu R.Lalrintluanga, Nl.PC.Lalchhuanawmi, Pu R.Lalramhluna\n\n[Intermediate]\nPu Lal\\anpuia, Pi Bualchhumi, Pi Lalzikpuii, Pu Vanlaldika Varte, Nl.Laltlansangi, Nl.Lalawmpuii, Tv.Lalthlanawma, Pu Lalrindika\n\n[Junior]\nPu C.Lalparliana, Pu K.Nunthara, Pi Lalengliani, Pi Nuchhungi, Tv.F.Lalduhawma, Nl.Hrangkungi, Nl.Laltlanruali, Nl.Zothanmawii\n\n[Primary]\nTv.Zohmangaiha, Pu R.Lalremmawia, Pi Lalnunziri, Pi Lalbiakkungi, Nl.PC.Lalhlimpuii, Nl.Lalnunthari, Nl.Lalchhandami, Tv.PC.Lalchuangkima\n\n[Beginner]\nPi Zokhumi, Pu Thangdeihchina, Pi F.Lalduati, Pi Zothanpari, Nl.Zomuansangi, Nl.H.Lawmkimi, Nl.Lalmuanawmi, Nl.K.Lalawmpuii, Nl.Lianchungnungi, Pu Chalneih\\huama" },
  { year: '1997', details: "Superintendent : Upa Daikhawzama\nAsst. Superintendent : Upa Khawidawla\nAsst. Supdt (NPSS) : Pu R.Khawhluna\nSecretary : Pu P.C.Lalhmingliana\nAsst. Secretary : Pu C.Hmingliana\nAsst. Secy (NPSS) : Pu H.Vanlalthanga\n\n[Puitling zirtirtu]\nUpa B.Hranghlira, Upa Manhleia, Upa Saizama Sailo, Upa K.Vanlalhmuaka, Upa HT.Vanlalsawma, Pu H.Huliana, Pu C.Khuangbuaia, Pu PC Lalhlira, Upa Zadala, Pu K.Lalduha, Pu K.Zakima, Pu Huatkhansuta, Upa Hleikapa, Pu H.Kap\\hianga, Pu T.Sawmpauva, Pu Thangngolanga, Pu Pauzathanga, Pu Vanhnuaithanga, Pi K.Lalchhawnkimi, Pi PC.Lalhmachhuani, Pu V.Lalpianga, Pu C.Lalrintluanga, Pu RD.Lalchhuana, Pu K.Lalduata, Pu H.Zakima, Pu R.Lalhmangaiha, Pu K.Roliana\n\n[Senior]\nPu C.Lalfaka, Pu K.Lalrawna, Pu R.Lalrintluanga, Tv.David Lalchhanhima, Nl.Laldinngheti, Nl.Bawihthansangi, Nl.Lalhlimthangi, Nl.Ngurbawitluangi, Pu R.Lalramhluna\n\n[Intermediate]\nPu Lal\\anpuia, Pu K.Nunthara, Pu Chalneih\\huama, Pi Bualchhumi, Pi Lalzikpuii, Nl.Lalawmpuii, Nl.Laltlansangi, Pu Vanlaldika Varte\n\n[Junior]\nPu C.Lalparliana, Tv.F.Lalduhawma, Pu K.Lalkhumliana, Pi Nuchhungi, Nl.Lalnunthari, Nl.Hrangkungi, Nl.Laltlanruali, Nl.Zothanmawii, Pu R.Lallianzuala\n\n[Primary]\nPu Zohmangaiha, Pu R.Lalremmawia, Tv.PC.Lalchuangkima, Pi Lalnunziri, Pi Lalbiakkungi, Nl.PC.Lalhlimpuii, Nl.Lalchhandami, Nl.Zomuansangi, Tv.Hmingthanmawia, Nl.Hmingthanpuii\n\n[Beginner]\nPi Lalengliani, Pu Thangdeihchina, Pu F.Lalbuatsaiha, Pi Zothanpari, Pi Rochhari, Pi Lalbiakhnuni, Nl.H.Lawmkimi, Nl.K.Lalawmpuii, Nl.Lianchungnungi, Nl.R.Lallawmkimi, Nl.Lalmuanpuii, Tv. Lalchhuanmawia" },
  { year: '1998', details: "Superintendent : Upa HT.Vanlalsawma\nAsst. Supdt : Upa Daikhawzama\nAsst. Supdt (NPSS) : Pu R.Khawhluna\nSecretary : Pu P.C.Lalhmingliana\nAsst. Secretary : Pu Lal\\anpuia\nAsst. Secy (NPSS) : Pu H.Vanlalthanga & Tv.PC.Lalchuangkima\n\n[Puitling zirtirtu]\nUpa B.Hranghlira, Upa Manhleia, Upa Saizama Sailo, Upa K.Vanlalhmuaka, Pu H.Huliana, Pu C.Khuangbuaia, Pu PC Lalhlira, Pu K.Lalduha, Pu Huatkhansuta, Upa Hleikapa, Pu H.Kap\\hianga, Pu T.Sawmpauva, Pu Pauzathanga, Pu Vanhnuaithanga, Pi K.Lalchhawnkimi, Pu V.Lalpianga, Pu C.Lalrintluanga, Pu RD.Lalchhuana, Pu K.Lalduata, Pu H.Zakima, Pu R.Lalhmangaiha, Pu C.Hmingliana, Upa H.Lalmawia\n\n[Senior]\nPu C.Lalfaka, Pu K.Lalrawna, Pu R.Lalrintluanga, Tv.David Lalchhanhima, Nl.Laldinngheti, Nl.Bawihthansangi, Nl.Lalhlimthangi, Nl.Ngurbawitluangi, Pu R.Lalramhluna\n\n[Intermediate]\nPu Zohmangaiha, Pu Chalneih\\huama, Pi Lalzikpuii, Pu Vanlaldika Varte, Pi Nuchhungi, Pi Zaichhungi, Pu T.Lal\\anpuia, Nl.Hrangkungi, Nl.Zothanmawii\n\n[Junior]\nPu C.Lalparliana, Nl.Bawihthansangi, Pu K.Lalkhumliana, Nl.C.Lalnunthari, Nl.Laltlansangi, Nl.Lalchhandami, Pi Zothanpari, Pi Ramengzuali\n\n[Primary]\nK.Nunthara, Pu R.Lalremmawia, Pu Lalchhuanmawia, Pi Lalnunziri, Nl.K.Lalawmpuii, Nl.Lianchungnungi, Nl.R.Lallawmkimi, Pu Dawngsuanpauva, Tv.Lianpianga\n\n[Beginner]\nPi Lalengliani, Pu Thangdeihchina, Pu F.Lalbuatsaiha, Pi Rochhari, Pi Lalbiakhnuni, Nl.Lalmuanpuii, Nl.Hmingthanpuii, Pi C.Lainguri, Nl.R.Lalruatsangi" },
  { year: '1999', details: "Superintendent : Upa Manhleia\nAsst. Superintendent : Upa HT.Vanlalsawma\nAsst. Supdt (NPSS) : Upa H.Lalmawia\nSecretary : Pu Lal\\anpuia\nAsst. Secretary : Pu K.Lalrawna\nAsst. Secy (NPSS) : Pu H.Vanlalthanga & Tv.Lianpianga\n\n[Puitling zirtirtu]\nUpa Khawidawla, Upa B.Hranghlira, Upa Saizama Sailo, Upa K.Vanlalhmuaka, Pu R.Khawhluna, Upa Daikhawzama, Pu H.Huliana, Pu C.Khuangbuaia, Pu PC.Lalhlira, Pu K.Lalduha, Upa Hleikapa, Pu Huatkhansuta, Pu H.Kap\\hianga, Pu T.Sawmpauva, Pu Pauzathanga, Pu Vanhnuaithanga, Pi K.Lalchhawnkimi, Pu V.Lalpianga, Pu C.Lalrintluanga, Pu RD.Lalchhuana, Pu K.Lalduata, Pu H.Zakima, Pu C.Hmingliana, Pu PC Lalhmingliana, Pi C.Chawngpuii\n\n[Senior]\nNl.Laldinngheti, Pu Lalchhanhima, Nl.Lalhlimthangi, Nl.Ngurbawitluangi, Pi B.Bualchhumi, Pu R.Lalrintluanga, Pu C.Lalparliana, Pi H.Zaichhungi, Pu C.Lalthantluanga, Pu Lalrozama\n\n[Intermediate]\nPu Zohmangaiha, Pi Lalengliani, Pi Nuchhungi, Pi Lalzikpuii, Pu T.Lal\\anpuia, Pu MS.Dawngliana, Nl.Hrangkungi, Nl.Zothanmawii, Pi Lalchhandami\n\n[Junior]\nPu B.Biakvela, Pi Ramengzuali, Pi Zothanpari, Pi Lalnunziri, Tv.PC Lalchuangkima, Pu Dawngsuanpauva, Nl.H.Lawmkimi, Nl.K.Lalawmpuii, Nl.Lianchungnungi\n\n[Primary]\nPu K.Nunthara, Pu R.Lalremmawia, Pi C.Lainguri, Pu Zamsianmunga, Nl.Lalruatsangi, Tv.C.Hranghluna, Tv.Lalrinpuia, Tv.C.Lal\\hazuala, Nl.Vanlalngaihi, Nl.Lalremthangi\n\n[Beginner]\nPu C.Lalfaka, Pu F.Lalbuatsaiha, Pi Lalbiakhnuni, Pi Rochhari, Pi F.Lalduati, Pi Khawlchuani, Pi B.Ronghaki, Tv.Mangchhuana, Nl.Lalmuanpuii, Nl.Hmingthanzuali, Nl.Lalnithangi, Nl.Hranglianthangi, Tv.Lallawmthanga" },
  { year: '2000', details: "Superintendent : Upa B.Hranghlira\nAsst. Superintendent : Upa Manhleia\nAsst. Supdt (NPSS) : Upa H.Lalmawia\nSecretary : Pu Lal\\anpuia\nAsst. Secretary : Pu R.Lalhmangaiha\nAsst. Secy (NPSS) : Tv.Lianpianga\n\n[Puitling zirtirtu]\nUpa Khawidawla, Upa Saizama Sailo, Upa K.Vanlalhmuaka, Upa H.T.Vanlalsawma, Pu R.Khawhluna, Upa Daikhawzama, Pu PC.Lalhlira, Pu H.Kap\\hianga, Pu PC Lalhmingliana, Pu H.Huliana, Pu C.Khuangbuaia, Pu K.Lalduha, Upa Hleikapa, Pu Huatkhansuta, Pu T.Sawmpauva, Pu Pauzathanga, Pu Vanhnuaithanga, Pi K.Lalchhawnkimi, Pu V.Lalpianga, Pu C.Lalrintluanga, Pu RD.Lalchhuana, Pu K.Lalduata, Pu H.Zakima, Pu C.Hmingliana, Pi C.Chawngpuii, Pu K.Lalrawna, Nl.Laldinngheti, Pi PC.Lalhmachhuani, Pu B.Biakvela, Pu C.Lalthantluanga, Pi B.Bualchhumi, Pu C.Lalparliana, Pu Lalrozama, Pu R.Lalrintluanga, Pu RL.Than\\huama, Pu Buanthanga, Upa PC Sang\\huama, Pu Pawithanga, Pu K.Riachho\n\n[Senior]\nTv.PC.Lalchuangkima, Nl.Ngurbawitluangi, Nl.Lalhlimthangi, Pu David Lalchhanhima, Pu Lalchhanhima, Pu H.Vanlalthanga, Pi Lalengliani, Pi H.Zaichhungi, Pu Lal\\anpuia, Pu K.|huamluaia, Pu Vanlaldika Varte\n\n[Intermediate]\nPu Zohmangaiha, Pi Lalzikpuii, Pi C.Lainguri, Pi Lalrochhari, Pi F.Lalduati, Pi Ramengzuali, Pu Dawngsuanpauva, Pu K.Laldawngliana, Pi Zothanpari, Nl.Lianchungnungi, Nl.H.Lawmkimi\n\n[Junior]\nPu C.Lalfaka, Pi Nuchhungi, Nl.Hrangkungi, Nl.K.Lalawmpuii, Nl.R.Lalruatsangi, Nl.Lalmuanpuii, Nl.Vanlalngaihi, Nl.Hmingthanzuali, Tv.Lalrinpuia, Pu C.Lalbiakthanga, Pi Laltlanchhingi, Nl.Lalbiaklawmi\n\n[Primary]\nPu K.Nunthara, Pi Lalbiakhnuni, Pi B.Ronghaki, Nl.Lalremthangi, Nl.K.Zothanzuali, Nl.K.Lalhruaitluangi, Nl.K.Lalmuanpuii, Nl.Lalenkawli, Tv.Hmingthanmawia, Tv.Lalthangliana, Nl.Chingsawmliani, Pu Dengsiamliana, Pi Lalrimawii, Pu K.Remmawia, Nl.Lalthangpuii, Pu K.Lalrinpuia\n\n[Beginner]\nPu F.Lalbuatsaiha, Pi Khawlchuani, Nl.Lalnithangi, Nl.Hranglianthangi, Pi Sangkungi, Pi Lalniengi, Pi Biakhmingthangi, Tv.C.Lal\\hazuala, Tv.Lallawmthanga, Nl.C.Lalhruaitluangi, Nl.Siamthangpuii, Nl.PC.Lalchhanhimi, Nl.K.Malsawmtluangi, Nl.Hmingthanmawii, Pi Lalnunsangi" },
  { year: '2001', details: "Superintendent : Upa H.Lalmawia\nAsst. Superintendent : Upa K.Vanlalhmuaka\nAsst. Supdt (NPSS) : Upa B.Hranghlira\nSecretary : Pu Lal\\anpuia\nAsst. Secretary : Pu R.Lalhmangaiha\nAsst. Secy (NPSS) : Tv.Lianpianga\n\n[Puitling zirtirtu]\nUpa Khawidawla, Upa Saizama Sailo, Upa Manhleia, Upa H.T.Vanlalsawma, Pu R.Khawhluna, Upa Daikhawzama, Pu PC.Lalhlira, Pu C.Khuangbuaia, Pu K.Lalduha, Pu T.Sawmpauva, Pu RD.Lalchhuana, Upa Hleikapa, Pu Huatkhansuta, Pu Pauzathanga, Pu V.Lalpianga, Pu Vanhnuaithanga, Pu H.Kap\\hianga, Pu C.Lalrintluanga, Pu PC.Lalhmingliana, Pu K.Lalduata, Pu C.Hmingliana, Pu H.Zakima, Pu K.Lalrawna, Pi PC.Lalhmachhuani, Pi C.Chawngpuii, Pi B.Bualchhumi, Pu R.Lalrintluanga, Pu B.Biakvela, Pu Lalrozama, Pu C.Lalparliana, Pu C.Lalthantluanga, Nl.Laldinngheti, Upa PC Sang\\huama, Pu K.Riachho, Pu Pawithanga, Pu Rochungnunga, Pu Laldawngliana\n\n[Senior]\nPu R.Lalramhluna, Pu Zohmangaiha, Tv.PC Lalchuangkima, Nl.Lalhlimthangi, Nl.Ngurbawitluangi, Pi Lalengliani, Pu K.|huamluaia, Pu Vanlaldika Varte, Pu Lalchhanhima, Pu K.Nunthara, Tv.Isak Lalchhuanmawia, Pi Lalzikpuii, Pu K.Lalbiakdika\n\n[Intermediate]\nPu David Lalchhanhima, Pu K.Laldawngliana, Nl.H.Lawmkimi, Pi C.Lainguri, Pi Lalrochhari, Pi F.Lalduati, Pi Ramengzuali, Pi Zothanpari, Pu Saihmingliana, Tv.Zomuankima, Pu Vanlalhriata\n\n[Junior]\nPu C.Lalfaka, Pu MS Dawngliana, Nl.Hmingthanzuali, Pi K.Malsawmdawngi, Nl.Hrangkungi, Nl.K.Lalawmpuii, Nl.Lalmuanpuii, Nl.Vanlalngaihi, Nl.Lalbiaklawmi, Tv.Lalrinpuia, Tv.K.Lalpianmawia, Pi Nuchhungi, Pu Zoramnghingliana\n\n[Primary]\nPu H.Vanlalthanga, Pu R.Lalremmawia, Tv.Hmingthanmawia, Tv.T.Lalthangliana, Pu Pauliankapa, Pi B.Ronghaki, Pi Lalbiakhnuni, Pi Lalrimawii, Pi C.Lallawmsangi, Pu K.Lalrinpuia, Tv.C.Lal\\hazuala, Nl.Lalremthangi, Nl.Hranglianthangi, Nl.Lalenkawli, Nl.K.Zothanzuali, Nl.K.Lalhruaitluangi, Nl.K.Lalmuanpuii, Tv.Lallawmthanga\n\n[Beginner]\nPu F.Lalbuatsaiha, Pi Sangkungi, Nl.K.Malsawmtluangi, Pi Lalniengi, Pi Biakhmingthangi, Pi Lalnunsangi, Nl.C.Lalhruaitluangi, Nl.PC.Lalchhanhimi, Nl.Hmingthanmawii, Nl.Siamthangpuii, Nl.T.Lalnuntluangi, Nl.C.Lalrinfeli, Tv.Thanglianmanga, Tv.Lalruatpuia, Tv.Keneth Lalthanzauva, Pi Khawlchuani, (Pu Lalbiakkunga leh Nl.Lalhrilliani te an awmna Dept. hriat a ni lo.)" },
  { year: '2002', details: "Superintendent : Upa K.Vanlalhmuaka\nAsst. Superintendent : Upa Saizama Sailo\nAsst. Supdt (NPSS) : Upa B.Hranghlira\nSecretary : Pu R.Lalhmangaiha\nAsst. Secretary : Pu B.Biakvela\nAsst. Secy (NPSS) : Tv.Lianpianga\n\n[Puitling zirtirtu]\nUpa Khawidawla, Upa H.Lalmawia, Upa Manhleia, Upa H.T.Vanlalsawma, Pu R.Khawhluna, Pu PC.Lalhmingliana, Pu PC.Lalhlira, Pu K.Lalduha, Pu T.Sawmpauva, Pu RD.Lalchhuana, Upa Hleikapa, Pu Huatkhansuta, Pu Pauzathanga, Pu V.Lalpianga, Pu H.Kap\\hianga, Pu C.Lalrintluanga, Pu C.Hmingliana, Pu K.Lalduata, Pu H.Zakima, Pu K.Lalrawna, Pi PC.Lalhmachhuani, Pi C.Chawngpuii, Pu R.Lalrintluanga, Pu Lalrozama, Pu C.Lalparliana, Pu C.Lalthantluanga, Nl.Laldinngheti, Pu K.Riachho, Pu Pawithanga, Pu Laldawngliana, Pu Rochungnunga, Pu Lal\\anpuia, Pu C.Lalfaka, Pu Lallianmawia, Upa Daikhawzama, Upa Damsailova, Pu C.Roliana, Pu T.Dilliana, Pu V.Lalzuithanga\n\n[Senior]\nPu R.Lalramhluna, Pu Zohmangaiha, Nl.Lalhlimthangi, Nl.Ngurbawitluangi, Pi Lalengliani, Pu K.|huamluaia, Pu Vanlaldika Varte, Pu Lalchhanhima, Pi Lalzikpuii, Pu Vanlalhriata, Pu Lalbiakkunga, Pu PC.Lalchuangkima\n\n[Intermediate]\nPu David Lalchhanhima, Pu K.Laldawngliana, Pi C.Lainguri, Pi Lalrochhari, Pi F.Lalduati, Pi Ramengzuali, Pi Zothanpari, Tv.Zomuankima, Nl.Lalhrilliani, Nl.Hrangkungi, Pu MS Dawngliana, Tv.C.Zohmingthanga\n\n[Junior]\nPu H.Vanlalthanga, Tv.Hmingthanmawia, Nl.Lalmuanpuii, Nl.Vanlalngaihi, Nl.Lalbiaklawmi, Pi K.Malsawmdawngi, Pu Zoramnghingliana, Tv.Lalrinpuia, Pi Lalniengi, Pi Lalnunsangi\n\n[Primary]\nPu F.Lalbuatsaiha, Pu Pauliankapa, Tv.T.Lalthangliana, Nl.C.Lalhruaitluangi, Pi Biakhmingliani, Nl.Lalremthangi, Nl.K.Lalmuanpuii, Tv.Lallawmthanga, Nl.Siamthangpuii, Pi Khawlchuani, Nl.PC.Lalchhanhimi, Nl.K.Malsawmtluangi, Nl.Hmingthanmawii, Pu C.Roenga\n\n[Beginner]\nPu R.Lalremmawia, Pi Lalbiakhnuni, Pi Lalrimawii, Pi B.Ronghaki, Pi Sangkungi, Nl.C.Lalrinfeli, Nl.T.Lalnuntluangi, Tv.Thanglianmanga, Nl.Lalrengpuii, Nl.Lalduhsangi, Nl.Lalrinkimi, Tv.Lalremruata, Pi Lalkutthangi, Tv.Keneth Lalthanzauva" },
  { year: '2003', details: "Superintendent : Upa Saizama Sailo\nAsst. Superintendent : Upa Manhleia\nAsst. Supdt (NPSS) : Pu PC Lalhmingliana\nSecretary : Pu R.Lalhmangaiha\nAsst. Secretary : Pu R.Lalrintluanga\nAsst. Secy (NPSS) : Pu Lianpianga\n\n[Puitling zirtirtu]\nUpa Khawidawla, Upa H.Lalmawia, Upa B.Hranghlira, Upa H.T.Vanlalsawma, Upa K.Vanlalhmuaka, Pu R.Khawhluna, Upa Daikhawzama, Upa Hleikapa, Pu PC.Lalhlira, Pu T.Sawmpauva, Pu RD.Lalchhuana, Pu K.Lalduha, Pu Huatkhansuta, Pu Pauzathanga, Pu V.Lalpianga, Pu H.Kap\\hianga, Pu C.Lalrintluanga, Pu C.Hmingliana, Pu K.Lalduata, Pu H.Zakima, Pu K.Lalrawna, Pi PC.Lalhmachhuani, Pi C.Chawngpuii, Pu C.Lalparliana, Pu Lalrozama, Pu C.Lalthantluanga, Nl.Laldinngheti, Pu K.Riachho, Pu Pawithanga, Pu J.Laldawngliana, Pu Rochungnunga, Pu Lal\\anpuia, Pu Lallianmawia, Pu C.Roliana, Pu T.Dilliana, Pu B.Biakvela, Pu Lalrimawia, Pu K.Lalhlira, Pu Lallungmuana, Pu F.Lalhmunsiama\n\n[Senior]\nPu R.Lalramhluna, Pu Zohmangaiha, Nl.Lalhlimthangi, Nl.Ngurbawitluangi, Pi Lalengliani, Pu K.|huamluaia, Pu Vanlaldika Varte, Pu Lalchhanhima, Pi Lalzikpuii, Pu Vanlalhriata, Pu Lalbiakkunga, Pu PC.Lalchuangkima, Pi Ramengzuali\n\n[Intermediate]\nPu David Lalchhanhima, Tv.C.Zohmingthanga, Pu MS Dawngliana, Tv.Zomuankima, Nl.Vanlalngaihi, Pi K.Malsawmdawngi, Nl.T.Lalnuntluangi, Pu C.Rohmingliana\n\n[Junior]\nPu H.Vanlalthanga, Pu K.Laldawngliana, Pi F.Lalduati, Pi C.Lainguri, Pi Lalniengi, Tv. Hmingthanmawia, Nl.C.Lalhruaitluangi, Nl.K.Malsawmtlangi, Nl.Hmingthanmawii, Nl.K.Lalhruaitluangi, Nl.Lalbiakdiki\n\n[Primary]\nPu F.Lalbuatsaiha, Pu C.Roenga, Pi Biakhmingliani, Nl.Lalmuanpuii, Tv.Thanglianmanga, Nl.Lalbiaklawmi, Nl.C.Lalrinfeli, Tv.Keneth Lalthanzauva, Tv.Lallawmthanga, Nl.K.Lalrokhumi, Nl.T.Vanlalduhsaki, Nl.Lalnithangi\n\n[Beginner]\nPu R.Lalremmawia, Pi Lalbiakhnuni, Pi Lalrimawii, Pi B.Ronghaki, Pi Lalrawngbawli, Pi Zothanpari, Nl.Lalrengpuii, Tv.T.Lalthangliana, Tv.Lalremruata, Tv.Thangzaliana, Nl.Lalnunmawii" },
  { year: '2004', details: "Superintendent : Upa Manhleia\nAsst. Superintendent : Upa B.Hranghlira\nAsst. Supdt (NPSS) : Pu PC Lalhmingliana\nSecretary : Pu R.Lalrintluanga\nAsst. Secretary : Pu C.Lalthantluanga\nAsst. Secy (NPSS) : Pu C.Roenga\n\n[Puitling zirtirtu]\nUpa Khawidawla, Upa H.Lalmawia, Upa Saizama Sailo, Upa H.T.Vanlalsawma, Upa K.Vanlalhmuaka, Pu R.Khawhluna, Pu PC.Lalhlira, Upa Daikhawzama, Pu T.Sawmpauva, Pu Huatkhansuta, Pu K.Lalduha, Pu Pauzathanga, Pu V.Lalpianga, Pu C.Lalrintluanga, Pu C.Hmingliana, Pu K.Lalduata, Pu H.Zakima, Pi PC.Lalhmachhuani, Pi C.Chawngpuii, Nl.Laldinngheti, Pu J.Laldawngliana, Pu Pawithanga, Pu Rochungnunga, Pu Lal\\anpuia, Pu C.Roliana, Pu H.Kap\\hianga, Pu K.Lalrawna, Pu C.Lalparliana, Pu F.Lalhmunsiama, Pu R.Lalramhluna, Pu Bawllliana, Pu Lallungmuana\n\n[Senior]\nPu Zohmangaiha, Pi Lalengliani, Pu Lalchhanhima, Pu Lalbiakkunga, Pu PC Lalchuangkima, Pu Vanlaldika Varte, Pu K.|huamluaia, Pi Ramengzuali\n\n[Intermediate]\nPu David Lalchhanhima, Tv.C.Zohmingthanga, Nl.Ngurbawitluangi, Pi Lalniengi, Pi K.Malsawmdawngi, Nl.Vanlalngaihi, Nl.T.Lalnuntluangi, Pu C.Rohmingliana, Tv.Zomuankima, Nl.K.Lalhruaitluangi, Nl.Hmingthanzuali\n\n[Junior]\nPu H.Vanlalthanga, Pu Lianpianga, Pi F.Lalduati, Pi C.Lainguri, Tv.Hmingthanmawia, Nl.K.Malsawmtluangi, Nl.Hmingthanmawii, Nl.Lalbiaklawmi, Tv.Lalremruata, Pu K.L.Mawizuala, Nl.C.Lalrinfeli\n\n[Primary]\nPu F.Lalbuatsaiha, Tv.Thanglianmanga, Tv.Lallawmthanga, Tv.Keneth Lalthanzauva, Nl.Lalbiakdiki, Pi Biakhmingliani, Nl.Lalnithangi, Nl.K.Lalrokhumi, Nl.Lalduhsaki, Nl.Lalmuanpuii, Pi Malsawmi Tlau, Nl.Lalthanmawii, Pi Lalromawii\n\n[Beginner]\nPu R.Lalremmawia, Pi Lalbiakhnuni, Pi Lalrimawii, Pi B.Ronghaki, Pi Lalrawngbawli, Nl.C.Khawlhmingthangi, Nl.Lalrengpuii, Tv.T.Lalthangliana, Tv.Thangzaliana, Nl.Lalnunmawii" },
  { year: '2005', details: "Superintendent : Upa B.Hranghlira\nAsst. Superintendent : Upa Khawidawla\nAsst. Supdt (NPSS) : Upa K.Vanlalhmuaka\nSecretary : Pu C.Lalthantluanga\nAsst. Secretary : Pu R.Lalrintluanga\nAsst. Secy (NPSS) : Tv.Zomuankima\n\n[Puitling zirtirtu]\nUpa Manhleia, Upa H.Lalmawia, Upa Saizama Sailo, Upa H.T.Vanlalsawma, Upa PC Lalhmingliana, Pu C.Roliana, Pu R.Khawhluna, Pu PC.Lalhlira, Pu T.Sawmpauva, Pu Huatkhansuta, Pu Pauzathanga, Pu V.Lalpianga, Pu C.Lalrintluanga, Pu K.Lalduata, Pu H.Zakima, Pi PC.Lalhmachhuani, Pi C.Chawngpuii, Pu J.Laldawngliana, Pu Pawithanga, Pu Rochungnunga, Pu Lal\\anpuia, Pu H.Kap\\hianga, Nl.Laldinngheti, Pu K.Lalrawna, Pu C.Lalparliana, Pu R.Lalramhluna, Pu Bawllliana, Pu Lallungmuana\n\n[Senior]\nPu K.|huamluaia, Pu Vanlaldika Varte, Tv.Zomuankima, Pu Lalchhanhima, Pi Lalengliani, Pi Ramengzuali, Pi Zothanpari, Pi Lalniengi, Pu PC Lalchuangkima, Pi Lalhlimthangi, Pi Biakveli\n\n[Sacrament]\nUpa Daikhawzama, Pu David Lalchhanhima, Pu H.Vanlalthanga, Pi Lalzikpuii\n\n[Intermediate]\nPu Lalbiakkunga, Pu F.Lalbuatsaiha, Nl.T.Lalnuntluangi, Pi K.Malsawmdawngi, Nl.Ngurbawitluangi, Pu C.Rohmingliana, Nl.Vanlalngaihi, Nl.K.Lalhruaitluangi, Pu Lianpianga, Nl.Hmingthanzuali\n\n[Junior]\nTv.C.Zohmingthanga, Pu KL Mawizuala, Nl.Lalmuanzuali, Pi Lalbiakhnuni, Pi C.Lainguri, Nl.Lalbiaklawmi, Tv.Thanglianmanga, Nl.K.Lalmuanpuii, Nl.K.Malsawmtluangi, Tv.Lalmuanpuia Ralte, Tv.Keneth Lalthanzauva\n\n[Primary]\nPu R.Lalremmawia, Tv.T.Lalthangliana, Nl.PC.Lalrintluangi, Pi B.Ronghaki, Pi Lalrimawii, Nl.K.Lalrokhumi, Nl.Lalnithangi, Nl.Lalthanmawii, Nl.Khawlhmingthangi, Nl.Siamthangpuii, Nl.Lalrammawii, Pu Lalhmingmawia, Nl.Lalmuanpuii\n\n[Beginner]\nPi Malsawmi Tlau, Pi Lalrawngbawli, Nl.Vanlalruati, Nl.Lalbiakdiki, Pi Lalrengpuii, Tv.Thangzaliana, Nl.Lalnunmawii, Pi C.Lalhmingmawii, Nl.Lalramngaii, Pu B.Lalthanzauva, Tv.C.Malsawmthara, Tv.Lalremruata, Nl. V.Lalchhanhimi" },
  { year: '2006', details: "Superintendent : Upa H.T.Vanlalsawma\nAsst. Supdt : Upa P.C.Lalhmingliana\nAsst. Supdt (NPSS) : Upa K.Vanlalhmuaka\nSecretary : Pu F.Lalbuatsaiha\nAsst. Secretary : Pu R.Lalrintluanga & Pu C.Zokhuma\nAsst. Secy (NPSS) : Tv.Zomuankima\n\n[Puitling zirtirtu]\nUpa Manhleia, Upa Khawidawla, Upa H.Lalmawia, Upa Saizama Sailo, Upa B.Hranghlira, Pu T.Sawmpauva, Pu C.Roliana, Pu Pauzathanga, Pu V.Lalpianga, Pu C.Lalrintluanga, Pu C.Lalthantluanga, Pu K.Lalduata, Pu H.Zakima, Pi PC.Lalhmachhuani, Pi C.Chawngpuii, Pu J.Laldawngliana, Pu Lal\\anpuia, Pu H.Kap\\hianga, Nl.Laldinngheti, Pu K.Lalrawna, Pu C.Lalparliana, Pu R.Lalramhluna, Pu Bawllliana, Tv.C.Hranghluna, Pu T.Lal\\anpuia, Pu R.Dengkunga, Pu Lallungmuana, Pu R.D.Lalchhuana, Pu Ramhnehzauva\n\n[Senior]\nPu K.|huamluaia, Pu Vanlaldika Varte, Pi Lalengliani, Pi Ramengzuali, Pi Zothanpari, Pi Biakveli, Pu PC Lalchuangkima, Nl.Lalbiaklawmi, Nl.Hmingthanzuali, Pu Lalremruata\n\n[Sacrament]\nUpa Daikhawzama, Pu David Lalchhanhima, Pu H.Vanlalthanga, Nl.Ngurbawitluangi, Pi Lalniengi\n\n[Intermediate]\nPu Lalbiakkunga, Pu C.Rohmingliana, Pu Lianpianga, Pi K.Malsawmdawngi, Nl.K.Lalhruaitluangi, Tv.C.Lal\\hazuala, Pi C.Lainguri, Pu Lalramthara, Nl.K.Lalmuanpuii, Pu Dawngsuanpauva\n\n[Junior]\nTv.C.Zohmingthanga, Pu KL Mawizuala, Nl.Lalmuanzuali, Pu Vanlalhriata, Nl.K.Malsawmtluangi, Tv.Thangkunga Hualngo, Pi Lalbiakhnuni, Pi B.Ronghaki, Nl.T.Lalnuntluangi, Tv.Keneth Lalthanzauva, Nl.Vanlalngaihi\n\n[Primary]\nPu R.Lalremmawia, Tv.T.Lalthangliana, Pi Lalrimawii, Pi Lalrawngbawli, Pu Lalhmingmawia, Nl.PC Lalrintluangi, Nl.R.Lalrammawii, Nl.Lalthanmawii, Nl.Lalmuanpuii, Tv.Tualliankapa, Nl.Khawlhmingthangi, Nl.Siamthangpuii\n\n[Beginner]\nPi Malsawmi Tlau, Pi K.Lalbiakthangi, Nl.Lalramngaii, Pi C.Lalhmingmawii, Tv.Thangzaliana, Tv.C.Malsawmthara, Pu B.Lalthanzauva, Nl.V.Lalchhanhimi, Nl.K.Lalrokhumi, Tv.Mungngaihsanga, Pi Zaithangpuii, Tv.Lalmuanzuala, Nl.H.Zothanpuii, Tv.Joseph Lal\\angkaia, Nl.Rebecca Lalhriatpuii, Nl. Lalrintluangi" },
  { year: '2007', details: "Superintendent : Upa P.C.Lalhmingliana\nAsst. Supdt : Upa H.Lalmawia\nAsst. Supdt (NPSS) : Pu C.Roliana\nSecretary : Pu F.Lalbuatsaiha\nAsst. Secretary : Pu Vanlalhriata & Pu C.Zokhuma\nAsst. Secy (NPSS) : Pu Zomuankima\n\n[Puitling zirtirtu]\nUpa Manhleia, Upa H.T.Vanlalsawma, Upa K.Vanlalhmuaka, Upa B.Hranghlira, Pu T.Sawmpauva, Pu Pauzathanga, Pu V.Lalpianga, Pu C.Lalrintluanga, Pu C.Lalthantluanga, Pu K.Lalduata, Pu H.Zakima, Pi PC.Lalhmachhuani, Pi C.Chawngpuii, Pu J.Laldawngliana, Pu Lal\\anpuia, Nl.Laldinngheti, Pu C.Lalparliana, Pu R.Lalramhluna, Tv.C.Hranghluna, Pu T.Lal\\anpuia, Pu R.Dengkunga, Pu Ramhnehzauva, Pu R.D.Lalchhuana, Pu H.Vanlalthanga, Pu K.|huamluaia, Pu KLalduhawma, Upa Daikhawzama, Pu K.Lalrinawma\n\n[Senior]\nPu Vanlaldika Varte, Pu PC Lalchuangkima, Nl.Hmingthanzuali, Pi Ramengzuali, Pi Zothanpari, Nl.Ngurbawitluangi, Nl.Lalbiaklawmi, Pu Lalremruata, Pu C.Rohmingliana\n\n[Sacrament]\nPu David Lalchhanhima, Pu Lianpianga, Pi K.Malsawmdawngi, Pi Lalniengi\n\n[Intermediate]\nPu Lalbiakkunga, Tv.C.Lal\\hazuala, Pi C.Lainguri, Pu Lalramthara, Pu K.L.Mawizuala, Nl.K.Lalmuanpuii, Nl.K.Malsawmtluangi, Nl.Lalmuanzuali, Pi K.Thangkimi, Nl.Lalramngaii, Pu Lalmuanpuia Ralte\n\n[Junior]\nTv.C.Zohmingthanga, Pu Dawngsuanpauva, Tv.Lianlamthanga, Tv.Keneth Lalthanzauva, Tv.Thangkunga Hualngo, Pi Lalbiakhnuni, Pi B.Ronghaki, Pi C.Lalhmingmawii, Nl.T.Lalnuntluangi, Nl.Vanlalngaihi, Nl.K.Zosangpuii, Nl.Lalthanmawii\n\n[Primary]\nPu R.Lalremmawia, Tv.T.Lalthangliana, Pi Lalrimawii, Pi Lalrawngbawli, Pu Lalhmingmawia, Nl.R.Lalrammawii, Pu B.Lalthanzauva, Nl.C.Lalramthari, Nl.Khawlhmingthangi, Nl.H.T.Lalnunsiami, Tv.Kap\\huama, Nl.K.Lallawmzuali, Nl.Nancy Laldinpuii\n\n[Beginner]\nPi Malsawmi Tlau, Pi K.Lalbiakthangi, Tv.Mungngaihsanga, Tv.Lalmuanzuala, Nl.H.Zothanpuii, Tv.Joseph Lal\\angkaia, Nl.P.C Lalrintluangi, Nl.Rebecca Lalhriatpuii, Nl.Lalmuanpuii, Pi Zaithangpuii, Pi C.Lallawmsangi, Nl.Lal\\anpuii" },
  { year: '2008', details: "Superintendent : Upa H.Lalmawia\nAsst. Superintendent : Pu C.Roliana\nAsst. Supdt (NPSS) : Pu C.Lalrintluanga\nSecretary : Pu F.Lalbuatsaiha\nAsst. Secretary : Pu Vanlalhriata & Pu C.Zokhuma\nAsst. Secy (NPSS) : Tv.C.Lal\\hazuala\n\n[Puitling zirtirtu]\nUpa Manhleia, Upa H.T.Vanlalsawma, Upa K.Vanlalhmuaka, Upa B.Hranghlira, Upa PC Lalhmingliana, Upa Daikhawzama, Pu T.Sawmpauva, Pu R.D.Lalchhuana, Pu H.Zakima, Pu K.Lalduata, Pi PC.Lalhmachhuani, Pi C.Chawngpuii, Pu J.Laldawngliana, Pu R.Dengkunga, Pu C.Lalthantluanga, Pu C.Lalparliana, Pu Lal\\anpuia, Nl.Laldinngheti, Pu Ramhnehzauva, Pu T.Lal\\anpuia, Pu K Lalduhawma, Pu K.|huamluaia, Pu H.Vanlalthanga, Tv.C.Hranghluna, Pu K.Lalrinawma, Pu Vanlaldika Varte, Pu Lalbiakkunga, Pu H.Lalchawimawia, Upa Lalchhunga\n\n[Senior]\nPu David Lalchhanhima, Pu Lalremruata, Nl.PC.Lalchhanhimi, Nl.Ngurbawitluangi, Nl.Hmingthanzuali, Pi Malsawmi Tlau, Pu Lianpianga, Pu Zomuankima, Tv.Thanglianmanga, Pu C.Ramrinliana\n\n[Sacrament]\nPu R.Lalramhluna, Pu PC Lalchuangkima, Pi K.Malsawmdawngi, Nl.K.Lalmuanpuii, Pu Vanlalsiama Ralte, Nl.PC.Lalhriatpuii\n\n[Intermediate]\nPu C.Zohmingthanga, Pu Lalmuanpuia Ralte, Tv.V.Kaizasiama, Pi C.Lainguri, Pi Lalniengi, Pi K.Thangkimi, Nl.Lalbiaklawmi, Nl.Vanlalngaihi, Nl.Lalmuanzuali, Pu Lalrozauva, Tv.Lalremruata Hualngo\n\n[Junior]\nPu R.Lalremmawia, Tv.Keneth Lalthanzauva, Nl.Lalhmangaihzuali, Tv.Thangkunga Hualngo, Tv.Mungngaihsanga, Pi Lalrimawii, Pi Lalrawngbawli, Pi C.Lalhmingmawii, Pi K.Lalbiakthangi, Nl.T.Lalnuntluangi, Nl.Lalramngaii, Nl.Lalthanmawii\n\n[Primary]\nPu C.Rohmingliana, Pu Dawngsuanpauva, Tv.V.Lalbiakdika, Pi B.Ronghaki, Pi Zaithangpuii, Pu B.Lalthanzauva, Tv.T.Lalthangliana, Tv.Lalmuanzuala, Tv.Kap\\huama, Nl.C.Lalramthari, Nl.K.Lallawmzuali, Nl.H.T.Lalnunsiami, Tv.Lalnunpuia, Tv.K.Lalengthanga\n\n[Beginner]\nPi Ramengzuali, Pu Lalhmingmawia, Nl.K.Zoramengi, Pi C.Lallawmsangi, Nl.Lalmuanpuii, Nl.Rebecca Lalhriatpuii, Nl.H.Zothanpuii, Nl.Laltanpuii, Nl.Rosy Lalawmpuii, Tv.F.Lalrosiama, Tv.Lianlamthanga" },
  { year: '2009', details: "Superintendent : Upa K.Vanlalhmuaka\nAsst. Superintendent : Pu C.Roliana\nAsst. Supdt (NPSS) : Pu C.Lalrintluanga\nSecretary : Pu F.Lalbuatsaiha\nAsst. Secretary : Pu Vanlalhriata & Pu T.Sangtluanga\nAsst. Secy (NPSS) : Tv.Thanglianmanga\n\n[Puitling zirtirtu]\nUpa Manhleia, Upa H.T.Vanlalsawma, Upa H.Lalmawia, Upa B.Hranghlira, Upa PC Lalhmingliana, Upa Daikhawzama, Pu T.Sawmpauva, Pu R.D.Lalchhuana, Pu H.Zakima, Pu K.Lalduata, Pi PC.Lalhmachhuani, Pi C.Chawngpuii, Pu R.Dengkunga, Pu C.Lalthantluanga, Pu C.Lalparliana, Pu Ramhnehzauva, Pu T.Lal\\anpuia, Pu K Lalduhawma, Pu K.|huamluaia, Pu H.Vanlalthanga, Pu K.Lalrinawma, Pu Vanlaldika Varte, Pu Lalbiakkunga, Pu H.Lalchawimawia, Pu Lalrikhuma, Pu F.Lalhmunsiama, Pu Vanlalrema Ralte, Pu C.Zokhuma, Pu J.H.Lalrimawia, Pu Lalthantluanga, Pu T.Lianzadinga\n\n[Senior]\nPu David Lalchhanhima, Pu Lalremruata, Nl.K.Zosangpuii, Pu C.Ramrinliana, Pu Lianpianga, Pi Malsawmi Tlau, Nl.Ngurbawitluangi, Nl.PC.Lalchhanhimi, Tv.Hmingthanmawia, Pi K.Malsawmdawngi, Nl.Lalmuanchhungi\n\n[Sacrament]\nPu R.Lalramhluna, Pu PC Lalchuangkima, Pu Vanlalsiama Ralte, Nl.PC.Lalhriatpuii, Pu Dawngsuanpauva, Pi C.Lalhmingmawii, Pi K.Lalbiakthangi, Pu HT.Lalthlengliana\n\n[Intermediate]\nPu C.Zohmingthanga, Pu Lalmuanpuia Ralte, Nl.Lalbiaklawmi, Pi Lalniengi, Tv.V.Kaizasiama, Pi K.Thangkimi, Nl.Vanlalngaihi, Nl.H.Lalchhuanawmi, Nl.Lalmuanzuali, Nl.K.Lalrokhumi, Tv.Lalremruata Hualngo\n\n[Junior]\nPu R.Lalremmawia, Tv.Keneth Lalthanzauva, Nl.Lalhmangaihzuali, Tv.Thangkunga Hualngo, Tv.Mungngaihsanga, Pi Lalrimawii, Pi Lalrawngbawli, Nl.T.Lalnuntluangi, Nl.Lalthanmawii, Tv.C.Malsawmthara, Tv.R.Lalmalsawma, Nl.Vanlalruati, Nl.Laldawngzeli\n\n[Primary]\nPu C.Rohmingliana, Tv.V.Lalbiakdika, Pi B.Ronghaki, Pi Zaithangpuii, Pu B.Lalthanzauva, Tv.Lalmuanzuala, Tv.Kap\\huama, Nl.C.Lalramthari, Nl.K.Lallawmzuali, Nl.H.T.Lalnunsiami, Tv.K.Lalengthanga, Tv.Nelson Khiangte, Tv.Lianlamthanga, Tv.H.Lalfakawma\n\n[Beginner]\nPi Ramengzuali, Pu Lalhmingmawia, Nl.K.Zoramengi, Pi C.Lallawmsangi, Nl.Lalmuanpuii, Nl.Rebecca Lalhriatpuii, Nl.H.Zothanpuii, Nl.Laltanpuii, Nl.Rosy Lalawmpuii, Tv.F.Lalrosiama, Tv.Mungngaihsanga, Pu Khawlrosiama, Pi Lalnuntluangi" },
  { year: '2010', details: "Superintendent : Upa B.Hranghlira\nAsst. Superintendent : Upa Daikhawzama\nAsst. Supdt (NPSS) : Upa R.Lalramhluna\nSecretary : Pu F.Lalbuatsaiha\nAsst. Secy (NPSS) : Pu Lianpianga\nAsst. Secretary : Pu Vanlalhriata & Pu S.Liansangvunga\n\n[Puitling zirtirtu]\nUpa H.T.Vanlalsawma, Upa H.Lalmawia, Upa K.Vanlalhmuaka, Upa PC Lalhmingliana, Upa C.Lalrintluanga, Pu C.Roliana, Pu T.Sawmpauva, Pu R.D.Lalchhuana, Pu H.Zakima, Pu K.Lalduata, Pi PC.Lalhmachhuani, Pi C.Chawngpuii, Pu R.Dengkunga, Pu Ramhnehzauva, Pu T.Lal\\anpuia, Pu K Lalduhawma, Pu K.|huamluaia, Pu H.Vanlalthanga, Pu Vanlaldika Varte, Pu H.Lalchawimawia, Pu Vanlalrema Ralte, Pu C.Zokhuma, Pu J.H.Lalrimawia, Pu Lalthantluanga, Pu T.Lianzadinga, Pu C.Lalthantluanga, Pu K.Lalrinawma, Pu David Lalchhanhima, Pu K.Lalrawna\n\n[Senior]\nPu Lalbiakkunga, Pu C.Ramrinliana, Nl.T.Lalnuntluangi, Tv.Thangkunga Hualngo, Pu Vanlalsiama Ralte, Pu Hmingthanmawia, Pi Malsawmi Tlau, Pi K.Malsawmdawngi, Nl.Lalbiaklawmi, Nl.Lalmuanchhungi\n\n[Sacrament]\nPu Dawngsuanpauva, Pu HT.Lalthlengliana, Nl.PC Lalhriatpuii, Pu PC Lalchuangkima, Pu Lalremruata, Tv.Thanglianmanga, Pi Ramengzuali, Pi C.Lalhmingmawii, Pi K.Lalbiakthangi\n\n[Intermediate]\nPu C.Zohmingthanga, Pu Lalmuanpuia Ralte, Nl.C.Lalramthari, Tv.Keneth Lalthanzauva, Tv.Lalremruata Hualngo, Tv.V.Kaizasiama, Pi Lalniengi, Pi K.Thangkimi, Pi C.Lallawmsangi, Nl.Vanlalngaihi, Nl.Lalthanmawii, Nl.H.Zothanpuii\n\n[Junior]\nPu R.Lalremmawia, Tv.R.Lalmalsawma, Nl.Vanlalruati, Tv.Kap\\huama, Tv.C.Malsawmthara, Tv.C.Laitanga, Pi Lalrawngbawli, Pi Lalrimawii, Nl.Ngurbawitluangi, Nl.Lal\\anpuii, Nl.Laldawngzeli, Pi Lalhmangaihzuali\n\n[Primary]\nPu C.Rohmingliana, Tv.K.Lalengthanga, Tv.V.Lalbiakdika, Pi Zaithangpuii, Tv.Lalmuanzuala, Tv.H.Lalfakawma, Tv.Lianlamthanga, Nl.K.Lallawmzuali, Nl.Lalmuanpuii, Nl.Rebecca Lalhriatpuii, Tv.Rodinthara, Pu Khawlrosiama\n\n[Beginner]\nPu Lalhmingmawia, Pi Lalnuntluangi, Nl.K.Zoramengi, Nl.Rosy Lalawmpuii, Nl.H.T.Lalnunsiami, Nl.Ningsianmawii, Nl.Lalhminghlui, Tv.Mungngaihsanga, Tv.Lalramnghaka, Tv.F.Lalrosiama, Pi R.Vanlalbeli" },
  { year: '2011', details: "Superintendent : Upa Daikhawzama\nAsst. Superintendent : Upa C.Lalrintluanga\nAsst. Supdt (NPSS) : Upa R.Lalramhluna\nSecretary : Pu H.Vanlalthanga\nAsst. Secretary : Pu Vanlalhriata & Pu S.Liansangvunga\nAsst. Secy (NPSS) : Pu Lianpianga\n\n[Puitling zirtirtu]\nUpa H.T.Vanlalsawma, Upa H.Lalmawia, Upa K.Vanlalhmuaka, Upa PC Lalhmingliana, Upa B.Hranghlira, Pu C.Roliana, Pu C.Lalthantluanga, Pu David Lalchhanhima, Pu R.D.Lalchhuana, Pu K.Lalduata, Pi PC.Lalhmachhuani, Pi C.Chawngpuii, Pu R.Dengkunga, Pu Ramhnehzauva, Pu T.Lal\\anpuia, Pu K Lalduhawma, Pu K.|huamluaia, Pu Vanlaldika Varte, Pu H.Lalchawimawia, Pu Vanlalrema Ralte, Pu C.Zokhuma, Pu J.H.Lalrimawia, Pu T.Lianzadinga, Pu K.Lalrinawma, Pu K.Lalrawna, Pu PC Kap\\huama, Pu Chhiarkunga, Pu J.Lalnuntluanga, Pu C.Lalzova, Pu C.Hmingliana\n\n[Senior]\nPu Lalbiakkunga, Pu Hmingthanmawia, Nl.T.Lalnuntluangi, Pu Vanlalsiama Ralte, Tv.Thangkunga Hualngo, Pi K.Malsawmdawngi, Nl.Lalmuanchhungi, Pu C.Zohmingthanga, Nl.PC Lalhriatpuii, Pu F.Lalbuatsaiha, Pu C.Lal\\hazuala, Pi Lalhlimthangi\n\n[Sacrament]\nPu Dawngsuanpauva, Pu HT.Lalthlengliana, Pi K.Lalbiakthangi, Tv.Thanglianmanga, Pi Ramengzuali, Pu C.Ramrinliana, Pi Malsawmi Tlau, Pu Lalmuanpuia Ralte\n\n[Intermediate]\nPu R.Lalremmawia, Tv.K.Lalengthanga, Nl.R.Lalrammawii, Nl.C.Lalramthari, Tv.Keneth Lalthanzauva, Nl.H.Zothanpuii, Pi Lalrimawii, Pi Lalrawngbawli, Pu PC Lalchuangkima, Nl.Lynda Vanlalruati\n\n[Junior]\nPu C.Rohmingliana, Tv.R.Lalmalsawma, Nl.Laldawngzeli, Nl.Vanlalruati, Tv.C.Malsawmthara, Tv.Kap\\huama, Tv.C.Laitanga, Nl.Ngurbawitluangi, Tv.V.Lalbiakdika, Nl.K.Zoramengi, Pi C.Lalhmingmawii, Tv.Lalmuanzuala\n\n[Primary]\nTv.Lalremruata Hualngo, Pu Khawlrosiama, Nl.Rebecca Lalhriatpuii, Tv.H.Lalfakawma, Tv.Lianlamthanga, Tv.Rodinthara, Nl.Lalmuanpuii, Tv.F.Lalrosiama, Nl.Rosy Lalawmpuii, Tv.V.Kaizasiama, Pi C.Lallawmsangi, Pi C.Lalhruaitluangi\n\n[Beginner]\nPu Lalhmingmawia, Pi Lalnuntluangi, Nl.R.Lalremruati, Tv.Mungngaihsanga, Tv.Lalramnghaka, Nl.HT Lalnunsiami, Nl.Ningsianmawii, Nl.Lalhminghlui, Pi R.Vanlalbeli, Nl.H.Lalramsangi, Pi Kananthari, Nl.PC Lalremruati, Tv.Zoramenga, Tv.Lalremruata, Pi C.Lal\\anpuii" },
  { year: '2012', details: "Superintendent : Upa C.Lalrintluanga\nAsst. Superintendent : Upa R.Lalramhluna\nAsst. Supdt (NPSS) : T.Upa C.Lalthantluanga\nSecretary : Pu H.Vanlalthanga\nAsst. Secretary : Pu Vanlalhriata & Pu S.Liansangvunga\nAsst. Secy (NPSS) : Pu Lianpianga\n\n[Puitling zirtirtu]\nUpa B.Hranghlira, Upa K.Vanlalhmuaka, Upa H.T.Vanlalsawma, Upa H.Lalmawia, Upa PC Lalhmingliana, T.Upa C.Roliana, Upa Daikhawzama, T.Upa David Lalchhanhima, Pu R.D.Lalchhuana, Pu K.Lalduata, Pi PC.Lalhmachhuani, Pi C.Chawngpuii, Pu R.Dengkunga, Pu Ramhnehzauva, Pu Lalthangliana Tochhawng, Pu KLalduhawma, Pu K.|huamluaia, Pu Vanlaldika Varte, Pu T.Lianzadinga, Pu K.Lalrinawma, Pu K.Lalrawna, Pu Chhiarkunga, Pu J.Lalnuntluanga, Pu C.Lalzova, Pu C.Hmingliana, Pu P.Lalhmingthanga, Pu R.Lalrintluanga, Pi R.Ramengzuali, Pu GF Thanga, Pu Zoramnghingliana, Pu Rohit T.Zomuana, Pu C.Zaithanga\n\n[Senior]\nPu Lalbiakkunga Pachuau, Pu C.Zohmingthanga, Nl.Vanlalruati, Tv.Thangkunga Hualngo, Pu F.Lalbuatsaiha, Pu C.Lal\\hazuala, Pu Lalmuanpuia Ralte, Nl. T.Lalnuntluangi, Nl.PC Lalhriatpuii, Pi Lalhlimthangi Khiangte\n\n[Sacrament]\nPu HT.Lalthlengliana, Pu C.Ramrinliana, Tv. Keneth Lalthanzauva, Pu Thanglianmanga, Pu Hmingthanmawia, Pi Malsawmi Tlau, Nl. H.Zothanpuii\n\n[Intermediate]\nPu Dawngsuanpauva, Pu PC Lalchuangkima, Nl. PC Lalrintluangi, Tv. R.Lalmalsawma, Nl.R.Lalrammawii, Pi Lalrimawii, Pi Lalrawngbawli, Nl.Lynda Vanlalruati, Nl. Laldawngzeli, Nl. Lalmuanchhungi\n\n[Junior]\nPu C.Rohmingliana, Tv.Kap\\huama, Nl. K.Zoramengi, Tv.C.Laitanga, Tv.V.Lalbiakdika, Pu Lalhmingmawia, Pu Nelson Khiangte, Nl. Ngurbawitluangi, Pi C.Lalhmingmawii, Nl. C.Lalramthari, Nl. HT Lalnunsiami\n\n[Primary]\nTv.Lalremruata Hualngo, Pu Khawlrosiama, Nl. HT Lalnuntluangi, Tv.Rodinthara, Tv.F.Lalrosiama, Tv.V.Kaizasiama, Tv. Mungngaihsanga, Nl. Lalmuanpuii, Nl. Rebecca Lalhriatpuii, Pi C.Lallawmsangi, Pi K.Lalbiakthangi\n\n[Beginner]\nTv. K.Lalengthanga, Pi R.Vanlalbeli, Nl.Ningsianmawii, Tv.Lalramnghaka, Tv.Zoramenga, Tv.Lalremruata, Tv. H.Lalfakawma, Nl.R.Lalremruati, Nl.Lalhminghlui, Pi Kananthari, Nl.PC Lalremruati, Pi C.Lal\\anpuii, Pi K.Malsawmdawng, Pi Dimdeihsiani, Pi R.Lallawmkimi" },
  { year: '2013', details: "Superintendent : Upa R.Lalramhluna\nAsst. Superintendent : Upa HT Vanlalsawma\nAsst. Supdt (NPSS) : T.Upa C.Lalthantluanga\nSecretary : Pu H.Vanlalthanga\nAsst. Secretary : Pu Vanlalhriata, Pu S.Liansangvunga, Pu T.Sangtluanga\nAsst. Secy (NPSS) : Pu Lianpianga\n\n[Puitling zirtirtu]\nUpa B.Hranghlira, Upa K.Vanlalhmuaka, Upa H.Lalmawia, Upa PC Lalhmingliana, Upa C.Lalrintluanga, Upa Daikhawzama, T.Upa C.Roliana, T.Upa David Lalchhanhima, Pu R.D.Lalchhuana, Pu K.Lalduata, Pi PC.Lalhmachhuani, Pi C.Chawngpuii, Pu R.Dengkunga, Pu K Lalduhawma, Pu K.|huamluaia, Pu Vanlaldika Varte, Pu T.Lianzadinga, Pu K.Lalrinawma, Pu K.Lalrawna, Pu C.Lalzova, Pu P.Lalhmingthanga, Pu R.Lalrintluanga, Pi R.Ramengzuali, Pu GF Thanga, Pu Zoramnghingliana, Pu C.Zaithanga, Pu H.Zakima, Pu Dawngsuanpauva, Tv. Lalthangliana Tochhawng, Pu C.Rohmingliana, Pu JC Laldinthara, Pu C.Ramrinliana, Pu C.Zohmingthanga, Pi K.Malsawmdawngi, Pi V.Sangkungi, Pu Ramhnehzauva\n\n[Senior]\nPu Lalbiakkunga Pachuau, Pu F.Lalbuatsaiha, Nl.C.Lalramthari, Pu Kap\\huama, Pu V.Kaizasiama, Pu Nelson Khiangte, Pu B.Kapthanzawna, Pi Lalhlimthangi Khiangte, Pi K.Lalbiakthangi, Pi R.Vanlalbeli, Nl. Vanlalruati, Nl. PC Lalrintluangi, Nl. T.Lalnuntluangi\n\n[Sacrament]\nPu HT Lalthlengliana, Pu Hmingthanmawia, Nl. Rebecca Lalhriatpuii, Tv. Thangkunga Hualngo, Nl. H.Zothanpuii, Nl. Lalmuanchhungi\n\n[Intermediate]\nPu Lalmuanpuia Ralte, Pu PC Lalchuangkima, Nl. Laldawngzeli, Tv. R.Lalmalsawma, Tv. Keneth Lalthanzauva, Nl. R.Lalrammawii, Nl. Ngurbawitluangi, Pi Lalrimawii, Pi Lalrawngbawli, Pi Malsawmi Tlau\n\n[Junior]\nTv. Lalremruata Hualngo, Pu Lalhmingmawia, Nl. Nancy Laldinpuii, Pu V.Lalbiakdika, Pu Khawlrosiama, Pu C.Lalmuansanga, Pi C.Lalhmingmawii, Nl. K.Zoramengi, Nl. Lalmuanpuii, Tv. Mungngaihsanga, Tv. Rodinthara, Tv. PC Lalmuanpuia\n\n[Primary]\nPu K.Lalengthanga, Pu C.Lalrawngbawla, Nl. Lalhminghlui, Pi C.Lallawmsangi, Pi LR Dinsangi, Pi H.Lalremtluangi, Nl. HT Lalnuntluangi, Nl. Ningsianmawii, Nl. Vanlalzawmi, Tv. C.Laitanga, Tv. T.Lalramnghaka, Pu R.Lalmuanawma\n\n[Beginner]\nPu C.Lal\\hazuala, Pi Lal\\anpuii, Nl. Vungngaihdawni, Pu Lianlamthanga, Pi Kananthari, Pi Dimdeihsiani, Pi R.Lallawmkimi, Pi Hmingthanmawii, Pi C.Lalchhandami, Nl. PC Lalremruati, Nl. Lalnuntluangi, Tv. Lalremruata, Tv. Zoramenga, Tv. H.Lalfakawma, Tv. T.Lalnunzira" },
  { year: '2014', details: "Superintendent : T.Upa C.Roliana\nAsst. Supdt : Upa PC Lalhmingliana\nAsst. Supdt (NPSS) : T.Upa David Lalchhanhima\nSecretary : Pu H.Vanlalthanga\nAsst. Secretary : Pu Vanlalhriata, Pu T.Sangtluanga\nAsst. Secy (NPSS) : Pu Lianpianga\n\n[Puitling zirtirtu]\nUpa B.Hranghlira, Upa K.Vanlalhmuaka, Upa HT Vanlalsawma, Upa H.Lalmawia, Upa C.Lalrintluanga, Upa R.Lalramhluna, Upa Daikhawzama, T.Upa C.Lalthantluanga, T.Upa HT Lalthlengliana, Pu R.D.Lalchhuana, Pu K.Lalduata, Pi PC.Lalhmachhuani, Pi C.Chawngpuii, Pu K Lalduhawma, Pu K.|huamluaia, Pu Vanlaldika Varte, Pu T.Lianzadinga, Pu K.Lalrinawma, Pu K.Lalrawna, Pu C.Lalzova, Pu P.Lalhmingthanga, Pu R.Lalrintluanga, Pi R.Ramengzuali, Pu GF Thanga, Pu Zoramnghingliana, Pu C.Zaithanga, Pu H.Zakima, Pu Dawngsuanpauva, Tv. Lalthangliana Tochhawng, Pu C.Rohmingliana, Pu JC Laldinthara, Pu C.Ramrinliana, Pi V.Sangkungi, Pu Lalbiakkunga Pachuau, Pu H.Zairemmawia, Pu Lalramthara, Pu L.Khenpauva, Pu C.Sangzawna, Pu K.Sangkhuma, Pu MS Dawngliana\n\n[Senior]\nPu Lalmuanpuia Ralte, Pu B. Kapthanzawna, Nl. PC. Lalrintluangi, Pu PC Lalchuangkima, Pu Kap\\huama, Pu C.Lal\\hazuala, Pu V.Kaizasiama, Pu Nelson Khiangte, Pi C.Lallawmsangi, Pi Lalrawngbawli, Pi K.Lalbiakthangi, Nl. R.Lalrammawii, Nl. Vanlalruati\n\n[Sacrament]\nPu C. Zohmingthanga, Tv. Thangkunga Hualngo, Nl. Lalmuanchhungi, Nl. T.Lalnuntluangi, Pi Lalhlimthangi Khiangte, Nl. Rebecca Lalhriatpuii\n\n[Intermediate]\nPu Hmingthanmawia, Pu C.Lalrawngbawla, Pu V.Lalbiakdika, Pu Lalhmingmawia, Tv. Keneth Lalthanzauva, Tv. R.Lalmalsawma, Pi Malsawmi Tlau, Pi C. Lalhmingmawii, Nl. Ngurbawitluangi, Nl. Laldawngzeli, Nl. K.Zoramengi\n\n[Junior]\nTv. Lalremruata Hualngo, Pu C. Lalmuansanga, Nl. F.Lalmuankimi, Pu F. Lalhriatpuia, Pu Khawlrosiama, Tv. Mungngaihsanga, Tv. Rodinthara, Tv. P.C. Lalmuanpuia, Pi Kananthari, Nl. Lalmuanpuii, Nl. PC Lalremruati, Nl. Mary Lalthanzuali\n\n[Primary]\nPu K.Lalengthanga, Pi H.Lalremtluangi, Nl. Vanlalzawmi, Tv. Lalramnghakhlela, Pu R.Lalmuanawma, Tv. T. Lalramnghaka, Tv. Zoramenga, Tv. Lalremruata, Tv. HT Malsawmtluanga, Pi LR Dinsangi, Nl. Lalhminghlui, Nl. Ningsianmawii, Nl. HT Lalnuntluangi\n\n[Beginner]\nPi K. Malsawmdawngi, Tv. H. Lalfakawma, Nl.Lalnuntluangi, Pu H. Lalduhawma, Pu Lianlamthanga, Tv. T. Lalnunzira, Tv. Thangdeihmanga, Pi Lal\\anpuii, Pi Dimdeihsiani, Pi R.Lallawmkimi, Pi C. Lalchhandami, Pi Hmingthanmawii, Nl. R. Lalchhanchhuahi, Nl. Vungngaihdawni, Nl. Cathy Lalnunpuii" },
  { year: '2015', details: "Superintendent : Upa PC Lalhmingliana\nAsst. Supdt : Upa C.Lalthantluanga\nAsst. Supdt (NPSS) : Upa David Lalchhanhima\nSecretary : Pu H.Vanlalthanga\nAsst. Secretary : Pu Vanlalhriata & Pu T.Sangtluanga\nAsst. Secy (NPSS) : Pu Lianpianga\n\n[Puitling zirtirtu]\nUpa B.Hranghlira, Upa K.Vanlalhmuaka, Upa HT Vanlalsawma, Upa H.Lalmawia, Upa C.Lalrintluanga, Upa R.Lalramhluna, Upa Daikhawzama, Upa HT Lalthlengliana, T.Upa C.Roliana, Pu R.D.Lalchhuana, Pu K.Lalduata, Pi PC.Lalhmachhuani, Pi C.Chawngpuii, Pu K. Lalduhawma, Pu K.|huamluaia, Pu Vanlaldika Varte, Pu T.Lianzadinga, Pu K.Lalrawna, Pu C.Lalzova, Pu P.Lalhmingthanga, Pi R.Ramengzuali, Pu GF Thanga, Pu Zoramnghingliana, Pu C.Zaithanga, Pu H.Zakima, Pu Dawngsuanpauva, Pu C.Rohmingliana, Pu JC Laldinthara, Pu C.Ramrinliana, Pi V.Sangkungi, Pu Lalbiakkunga Pachuau, Pu H.Zairemmawia, Pu Lalramthara, Pu L.Khenpauva, Pu C.Sangzawna, Pu K.Sangkhuma, Pu MS Dawngliana, Pu Lalsanglura Zote, Pu T.Chalzawna, Nl. Ngurbawitluangi\n\n[Senior]\nPu Lalmuanpuia Ralte, Pu B.Kapthanzawna, Nl. PC Lalrintluangi, Pu PC Lalchuangkima, Pu C.Lal\\hazuala, Pu V.Kaizasiama, Pu Nelson Khiangte, Pi C.Lallawmsangi, Pi Lalrawngbawli, Pi K.Lalbiakthangi, Nl. R.Lalrammawii, Tv. R.Lalmalsawma\n\n[Sacrament]\nPu C.Zohmingthanga, Pu C.Lalrawngbawla, Nl. Lalmuanchhungi, Nl.Vanlalruati, Pi Lalhlimthangi Khiangte, Nl. Laldawngzeli\n\n[Intermediate]\nPu Hmingthanmawia, Pu Lalhmingmawia, Nl. HT Lalnuntluangi, Pu V.Lalbiakdika, Tv. Keneth Lalthanzauva, Tv. H.Lalfakawma, Pi Malsawmi Tlau, Nl. K.Zoramengi, Nl. T.Lalnuntluangi, Pi H.Zothanpuii\n\n[Junior]\nTv. Lalremruata Hualngo, Pu Khawlrosiama, Nl. K.Zorammuani, Pu C.Lalmuansanga, Nl. F.Lalmuankimi, Pu F.Lalhriatpuia, Tv. Mungngaihsanga, Tv. Rodinthara, Tv. PC Lalmuanpuia, Pi Kananthari, Pi Zosangpuii, Pi Dimdeihsiani, Pi LR Dinsangi, Tv. C.Lalnunpuia\n\n[Primary]\nPu K.Lalengthanga, Pi H.Lalremtluangi, Nl. Lalhminghlui, Pu Lalramnghakhlela, Pu R.Lalmuanawma, Tv. T.Lalramnghaka, Tv. Zoramenga, Nl. Ningsianmawii, Pu Lianlamthanga, Pi Lal\\anpuii, Pi R.Lallawmkimi, Tv.Lalhriatrenga Khiangte\n\n[Beginner]\nPi K.Malsawmdawngi, Pu Kap\\huama, Nl. Vungngaihdawni, Nl. Lalnuntluangi, Pu H.Lalduhawma, Tv. T.Lalnunzira, Tv. Thangdeihmanga, Pi C.Lalchhandami, Pi Hmingthanmawii, Nl. R.Lalchhanchhuahi, Pi Zothanmawii, Pi H.Lallawmkimi, Nl. Lalmuanpuii, Nl. B.Lalnunsiami, Pu C.Hmingthansanga, Pu Lalmuanpuia" },
  { year: '2016', details: "Superintendent : Upa C.Lalthantluanga\nAsst. ( Puitling) : Upa David Lalchhanhima\nAsst. Supdt.( NPSS) : Upa HT Lalthlengliana\nSecretary : Pu H.Vanlalthanga\nAsst. Secretary (Pt) : Pu Vanlalhriata & Pu T.Sangtluanga\nAsst. Secy(NPSS) : Pu Lianpianga\n\n[Puitling Zirtirtu]\nUpa B.Hranghlira, Upa K.Vanlalhmuaka, Upa H.Lalmawia, Upa HT Vanlalsawma, Upa C.Lalrintluanga, Upa Daikhawzama, Upa R.Lalramhluna, Upa HT Lalthlengliana, T.Upa C.Roliana, Pu RD Lalchhuana, Pu K.Lalduata, Pi PC Lalhmachhuani, Pi C.Chawngpuii, Pu K.Lalduhawma, Pu K.|huamluaia, Pu Vanlaldika Varte, Pu T.Lianzadinga, Pu K.Lalrawna, Pu C.Lalzova, Pu P.Lalhmingthanga, Pi R.Ramengzuali, Pu GF Thanga, Pu Zoramnghingliana, Pu C.Zaithanga, Pu H.Zakima, Pu Dawngsuanpauva, Pu C.Rohmingliana, Pu JC Laldinthara, Pu C.Ramrinliana, Pi V.Sangkungi, Pu Lalbiakkunga Pachuau, Pu H.Zairemmawia, Pu Lalramthara, Pu L.Khenpauva, Pu C.Sangzawna, Pu K.Sangkhuma, Pu MS Dawngliana, Pu Lalsanglura Zote, Pu T.Chalzawna, Nl. Ngurbawitluangi\n\n[Senior]\nPu Lalmuanpuia Ralte, Pu B.Kapthanzawna, Nl. PC Lalrintluangi, Pu PC Lalchuangkima, Pu C.Lal\\hazuala, Pu V.Kaizasiama, Pu Nelson Khiangte, Tv. R.Lalmalsawma, Pi C.Lallawmsangi, Pi Lalrawngbawli, Pi K.Lalbiakthangi, Nl. R.Lalrammawii\n\n[Sacrament]\nPu C.Zohmingthanga, Pu C.Lalrawngbawla, Nl. Lalmuanchhungi, Nl. Laldawngzeli, Pi Lalhlimthangi Khiangte, Nl. Vanlalruati\n\n[Intermediate]\nPu Hmingthanmawia, Pu Lalhmingmawia, Nl. HT Lalnuntluangi, Pu V.Lalbiakdika, Tv. Keneth Lalthanzauva, Tv. H.Lalfakawma, Pi Malsawmi Tlau, Nl. K.Zoramengi, Nl. T.Lalnuntluangi, Pi H.Zothanpuii\n\n[Junior]\nTv. Lalremruata Hualngo, Pu Khawlrosiama, Nl. K.Zorammuani, Pu C.Lalmuansanga, Pu F.Lalhriatpuia, Tv. Mungngaihsanga, Tv. Rodinthara, Tv. PC Lalmuanpuia, Nl. F.Lalmuankimi, Pi Kananthari, Pi Zosangpuii, Pi Dimdeihsiani, Pi LR Dinsangi\n\n[Primary]\nPu K.Lalengthanga, Pi H.Lalremtluangi, Nl. Lalhminghlui, Pu Lalramnghakhlela, Pu R.Lalmuanawma, Tv. T.Lalramnghaka, Tv. Zoramenga, Pu Lianlamthanga, Tv. Lalhriatrenga Khiangte, Nl. Ningsianmawii, Pi Lal\\anpuii, Pi R.Lallawmkimi\n\n[Beginner]\nPu Kap\\huama, Pi K.Malsawmdawngi, Nl. Vungngaihdawni, Pu H.Lalduhawma, Tv. T.Lalnunzira, Tv. Thangdeihmanga, Pu C.Hmingthansanga, Pu Lalmuanpuia, Nl. Lalnuntluangi, Pi C.Lalchhandami, Pi Hmingthanmawii, Nl. R.Lalchhanchhuahi, Pi Zothanmawii, Pi H.Lawmkimi, Nl. Lalmuanpuii, Nl. B.Lalnunsiami" },
  { year: '2017', details: "Superintendent : Upa HT Vanlalsawma\nAsst. Supdt.(PTSS) : Upa David Lalchhanhima\nAsst. Supdt.( NPSS) : Upa HT Lalthlengliana\nSecretary : Pu T.Sangtluanga\nAsst. Secretary : Pu Vanlalhriata & Pu Lianpianga\nAsst. Secy(NPSS) : Pu V.Lalbiakdika\n\n[Puitling Zirtirtu]\nUpa B.Hranghlira, Upa K.Vanlalhmuaka, Upa H.Lalmawia, Upa PC Lalhmingliana, Upa C.Lalrintluanga, Upa R.Lalramhluna, Upa C.Lalthantluanga, Upa Daikhawzama, T.Upa C.Roliana, Pu K.Lalduata, Pi PC Lalhmachhuani, Pi C.Chawngpuii, Pu K.Lalduhawma, Pu K.|huamluaia, Pu Vanlaldika Varte, Pu T.Lianzadinga, Pu K.Lalrawna, Pu C.Lalzova, Pu P.Lalhmingthanga, Pi R.Ramengzuali, Pu GF Thanga, Pu C.Zaithanga, Pu H.Zakima, Pu Dawngsuanpauva, Pu C.Rohmingliana, Pu C.Ramrinliana, Pi V.Sangkungi, Pu H.Zairemmawia, Pu Lalramthara, Pu L.Khenpauva, Pu Lalbiakkunga Pachuau, Pu C.Sangzawna, Pu K.Sangkhuma, Pu MS Dawngliana, Pu Lalsanglura Zote, Pu T.Chalzawna, Nl. Ngurbawitluangi, Pu C.Zohmingthanga, Pi Lalhlimthangi Khiangte, Pu H.Vanlalthanga, Pu Lalthangliana Tochhawng, Pu Lalmuanpuia Ralte\n\n[Senior]\nPu C.Lalrawngbawla, Pu C Lal\\hazuala, Nl. Lalmuanchhungi, Tv. R.Lalmalsawma, Pu Lalramnghakhlela, Nl. Lalrammawii Renthlei, Pi Zothanmawii, Pi H Zothanpuii\n\n[Sacrament]\nPu Hmingthanmawia, Pu K Lalengthanga, Nl. PC Lalrintluangi, Pu Kap\\huama, Pi C Lallawmsangi\n\n[Intermediate]\nTv. Lalremruata Hualngo, Pu Mungngaihsanga, Nl. Laldawngzeli, Pu Khawlrosiama, Pu Rodinthara, Tv. PC Lalmuanpuia, Pi K Lalbiakthangi, Pi C Lalchhandami, Nl. F Lalmuankimi\n\n[Junior]\nPu V.Kaizasiama, Tv. Keneth Lalthanzauva, Nl. H Lalrengpuii, Pu Nelson Khiangte, Tv. Zoramenga, Tv. H Lalfakawma, Pu T Lalramnghaka, Pi H Lalremtluangi, Pi Dimdeihsiani, Pi H Lallawmkimi, Nl. Lalhminghlui, Nl. Ningsianmawii\n\n[Primary]\nPu C.Lalmuansanga, Pu Lianlamthanga, Nl. Vungngaihdawni, Pu F Lalhriatpuia, Tv. Lalnunzira, Tv. Lalhriatrenga Khiangte, Tv. Vanlalchhana, Tv. K Lalramngheta, Pi Zosangpuii, Pi R Lallawmkimi, Pi Hmingthanmawii, Nl. Lalmuanpuii, Nl. Lalnuntluangi, Nl. R.Lalchhanchhuahi\n\n[Beginner]\nPi K.Malsawmdawngi, Pu Thanglianmanga, Pi K Malsawmtluangi, Pu H Lalduhawma, Pu C Hmingthansanga, Pu Lalmuanpuia, Pu R Lalmuanawma, Pi LR Dinsangi, Pi Vanlalnghaki Colney, Pi C Lalhruaitluangi, Pi Lalmuanpuii Hlawndo, Nl. B Lalnunsiami" },
  { year: '2018', details: "Superintendent : Upa David Lalchhanhima\nAsst. Supdt.( Puitling): Upa HT Lalthlengliana\nAsst. Supdt.( NPSS) : Upa Daikhawzama\nSecretary : Pu T.Sangtluanga\nAsst. Secretary (Pt) : Pu Vanlalhriata & Pu Lianpianga\nAsst. Secy(NPSS) : Pu V.Lalbiakdika\n\n[Puitling Zirtirtu]\nUpa B.Hranghlira, Upa K.Vanlalhmuaka, Upa H.Lalmawia, Upa PC Lalhmingliana, Upa C.Lalrintluanga, Upa R.Lalramhluna, Upa C.Lalthantluanga, Upa HT Vanlalsawma, T.Upa C.Roliana, Pu K.Lalduata, Pi PC Lalhmachhuani, Pi C.Chawngpuii, Pu K.Lalduhawma, Pu K.|huamluaia, Pu Vanlaldika Varte, Pu T.Lianzadinga, Pu K.Lalrawna, Pu C.Lalzova, Pu P.Lalhmingthanga, Pi R.Ramengzuali, Pu GF Thanga, Pu C.Zaithanga, Pu H.Zakima, Pu Dawngsuanpauva, Pu C.Rohmingliana, Pu C.Ramrinliana, Pi V.Sangkungi, Pu H.Zairemmawia, Pu Lalramthara, Pu L.Khenpauva, Pu Lalbiakkunga Pachuau, Pu MS Dawngliana, Pu Lalsanglura Zote, Nl. Ngurbawitluangi, Pu C.Zohmingthanga, Pu T.Chalzawna, Pi Lalhlimthangi Khiangte, Pu C.Sangzawna, Pu Lalthangliana Tochhawng, Pu H.Vanlalthanga, Pu Lalmuanpuia Ralte, Pi K.Malsawmdawngi\n\n[Senior]\nPu C.Lalrawngbawla, Tv. R.Lalmalsawma, Nl. Lalmuanchhungi, Pu Lalramnghakhlela, Nl. Lalrammawii Renthlei, Pi Zothanmawii, Pu Hmingthanmawia, Pi Dimdeihsiani\n\n[Sacrament]\nPu Lalremruata Hualngo, Pu K.Lalengthanga, Pi C.Lalchhandami, Nl. PC Lalrintluangi, Pu C.Lal\\hazuala\n\n[Intermediate]\nPu V.Kaizasiama, Pu Mungngaihsanga, B.Lalnunsiami, Nl. Laldawngzeli, Pu PC Lalmuanpuia, Pu Rodinthara, Pi K.Lalbiakthangi, Pi R.Lallawmkimi, Tv. Lalhriatrenga Khiangte, Tv. Thangdeihmanga\n\n[Junior]\nPu C.Lalmuansanga, Tv. Keneth Lalthanzauva, Nl. H.Lalrengpuii, Pu Nelson Khiangte, Tv. Zoramenga, Pu H.Lalfakawma, Pi H.Lalremtluangi, Pi H.Lallawmkimi, Nl. Lalhminghlui, Nl. Ningsianmawii, Pu Lianlamthanga, Pi C.Lallawmsangi\n\n[Primary]\nPu Kap\\huama, Tv. T.Lalnunzira, Nl. Vungngaihdawni, Pu F.Lalhriatpuia, Tv. K.Lalramngheta, Pi Zosangpuii, Pi Hmingthanmawii, Nl. Lalmuanpuii, Nl. Lalnuntluangi, Nl. R.Lalchhanchhuahi, Pu Khawlrosiama, Nl. F.Lalmuankimi, Pu H.Lalduhawma, Pu Lalmuanpuia\n\n[Beginner]\nPu Thanglianmanga, Pu C.Hmingthansanga, Nl. Zothangpuii, Pu R.Lalmuanawma, Pi LR Dinsangi, Pi Vanlalnghaki Colney, Pi C.Lalhruaitluangi, Pi Lalmuanpuii Hlawndo, Pu T.Lalramnghaka, Tv. Vanlalchhana, Tv. Manliankhupa, Nl. Nianglunvungi, Pi K.Malsawmtluangi" },
  { year: '2019', details: "Superintendent : Upa HT Lalthlengliana\nAsst.Supdt : Upa B Hranghlira\nAsst.Supdt i/c NPSS : Upa Daikhawzama\nSecretary : Pu Lianpianga\nAsst. Secretary : Pu F Lalbuatsaiha & Pu Vanlalhriata\nAsst. Secy i/c NPSS : Pu V Lalbiakdika\n\n[Puitling Zirtirtu]\nUpa K Vanlalhmuaka, Upa HT Vanlalsawma, Upa H Lalmawia, Upa PC Lalhmingliana, Upa C Lalrintluanga, Upa R Lalramhluna, Upa C Lalthantluanga, Upa David Lalchhanhima, T Upa C Roliana, Pu K Lalduata, Pi PC Lalhmachhuani, Pi C Chawngpuii, Pu K Lalduhawma, Pu K |huamluaia, Pu Vanlaldika varte, Pu K Lalrawna, Pu C Lalzova, Pu P Lalhmingthanga, Pi R Ramengzuali, Pu GF Thanga, Pu C Zaithanga, Pu H Zakima, Pu Dawngsuanpauva, Pu C Rohmingliana, Pu C Ramrinliana, Pi V Sangkungi, Pu H Zairemmawia, Pu Lalramthara, Pu L Khenpauva, Pu MS Dawngliana, Pu Lalsanglura Zote, Nl Ngurbawitluangi, Pu C Zohmingthanga, Pu T Chalzawna, Pu C Sangzawna, Pi Lalhlimthangi khiangte, Pu H Vanlalthanga, Pu Lalmuanpuia Ralte, Pi K Malsawmdawngi, Upa G Vanlallawma, Pu T Sangtluanga, Pu Lalbiakkunga Pachuau\n\n[Senior]\nPu C Lalrawngbawla, Pu Lalramnghakhlela, Nl. Lalmuanchhungi, Pu Hmingthanmawia, Pu K.Lalengthanga, Pu H.Lalfakawma, Pu C.Hmingthansanga, Nl. Zodinpuii\n\n[Sacrament]\nPu Lalremruata Hualngo, Pu C.Lal\\hazuala, Nl. PC Lalrintluangi, Pi C.Lalchhandami, Tv. R.Lalmalsawma\n\n[Intermediate]\nPu V Kaizasiama, Tv. Keneth Lalthanzauva, Nl. B.Lalnunsiami, Tv. Thangdeihmanga, Pu Lianlamthanga, Tv. T.Lalnunzira, Pi R.Lallawmkimi, Nl. Lalrammawii Renthlei, Nl. Ningsianmawii, Nl. Lalhminghlui\n\n[Junior]\nPu C Lalmuansanga, Pu Nelson Khiangte, Nl. C.Lalnunthari, Tv. Zoramenga, Pu Mungngaihsanga, Pu Rodinthara, Pu PC Lalmuanpuia, Pu R.Lalmuanawma, Tv. PC Lalruatsanga, Pi H.Lallawmkimi, Nl. Lalmuanpuii, Pi LR Dinsangi, Pi Hmingthanmawii, Nl. Vungngaihdawni\n\n[Primary]\nPu Kap\\huama, Pu Lalmuanpuia, Nl. H.Lalrengpuii, Pu F.Lalhriatpuia, Tv. K.Lalramngheta, Pu H.Lalduhawma, Tv. Lalhmunngheta, Pu R.Lalromawia, Pi B.Zosangpuii, Nl. R.Lalchhanchhuahi, Nl. F.Lalmuankimi, Nl. J.Lalhlimpuii, Nl. Chingsawmluni, Nl. Rachel Lalremruati Sailo\n\n[Beginner]\nPu Thanglianmanga, Pi Vanlalnghaki Colney, Nl. Zothangpuii, Tv. Vanlalchhana, Tv. Manliankhupa, Pu C.Lalchhanhima, Pi K.Malsawmtluangi, Pi C.Lalhruaitluangi, Pi Lalmuanpuii Hlawndo, Nl. Nianglunvungi, Pi Vanlalawii, Pi Lalhriatpuii, Nl. Lalrinkimi Fanai, NL. Thangdinsangi, Nl. Baby Romalsawmi\n\n[Pre-Beginner]\nPi K.Lalbiakthangi, Pi Mary Lalnunmawii, Pi H.Zodinsangi, Pu Thangkunga Hualngo, Pu Andrew Z,Dawngliana, Pi Lalchhanhimi, Pi Lalremtluangi Pautu, Pi HT Lalnuntluangi" },
  { year: '2020', details: "Superintendent : Upa B Hranghlira\nA. Supdt. : Upa H.Lalmawia\nSecretary : Pu Lianpianga\nAsst. Secretary : Pu V Lalbiakdika\nAsst. Secy (PTSS) : Pu Vanlalhriata & Pu F Lalbuatsaiha & Pu Manliankhupa\n\n[Puitling Zirtirtu]\nUpa K Vanlalhmuaka, Upa HT Vanlalsawma, Upa PC Lalhmingliana, Upa C Lalrintluanga, Upa C Lalthantluanga, Upa R Lalramhluna, Upa Daikhawzama, Upa David Lalchhanhima, Upa HT Lalthlengliana, T Upa C Zohmingthanga, Pu C.Roliana, Pu K Lalduata, Pi PC Lalhmachhuani, Pu K Lalduhawma, Upa G.Vanlallawma, Pu K |huamluaia, Pu Vanlaldika Varte, Pu K Lalrawna, Pu C Lalzova, Pu P Lalhmingthanga, Pi R Ramengzuali, Pu GF Thanga, Pu C Zaithanga, Pu H Zakima, Pu Dawngsuanpauva, Pu C Rohmingliana, Pu C Ramrinliana, Pi V Sangkungi, Pu Lalramthara, Pu L Khenpauva, Pu MS Dawngliana, Pu Lalsanglura zote, Nl Ngurbawitluangi, Pu T Chalzawna, Pu C Sangzawna, Pi Lalhlimthangi Khiangte, Pu H Vanlalthanga, Pu Lalmuanpuia Ralte, Pi K Malsawmdawngi, Pu T Sangtluanga, Pu B.Lalbiak\\huama, Pu HB Vanlalvuana, Pu Hmingthanmawia, Pu K.Lalengthanga, Pu C.Lalmuansanga, Pu C.Lalrawngbawla, Pu Lalremruata Hualngo, Pu C.Lal\\hazuala, Pu C.Hmingthansanga\n\n[Senior]\nPu V.Kaizasiama, Pu Thangkunga Hualngo, Tv. Thangdeihmanga, Nl. Zodinpuii, Pu H.Lalfakawma, Nl. PC Lalrintluangi, Tv. Zoramenga, Pi Vanlalnghaki Colney\n\n[Sacrament]\nPu Thanglianmanga, Nl. Lalmuanchhungi, Pu F.Lalhriatpuia, Pi H.Lallawmkimi, Pu Lianlamthanga\n\n[Intermediate]\nPu Kap\\huama, Tv. Keneth Lalthanzauva, Nl. Ningsianmawii, Tv. T.Lalnunzira, Pi R.Lallawmkimi, Nl. Lalrammawii Renthlei, Nl. Lalhminghlui, Nl. B.Lalnunsiami, Pu Lalramnghakhlela, Pu Lalmuanpuia\n\n[Junior]\nPu Nelson Khiangte, Pu Mungngaihsanga, Nl. C.Lalnunthari, Pu Rodinthara, Pu PC Lalmuanpuia, Nl. Lalmuanpuii, Pi LR Dinsangi, Pi Hmingthanmawii, Nl. Vungngaihdawni, Pu R.Lalmuanawma, Tv. PC Lalruatsanga, Pu K.Lalramngheta, Pi R.Lalchhanchhuahi, Pi K.Malsawmtluangi, Nl. Lalbiakchhungi\n\n[Primary]\nTv. R.Lalmalsawma, Pu H.Lalduhawma, Nl. Chingsawmluni, Nl. H.Lalrengpuii, Tv. Lalhmunngheta, Pu R.Lalromawia, Nl. J.Lalhlimpuii, Nl. Rachel Lalremruati, Pi Lalmuanpuii Hlawndo, Pu Andrew Z.Dawngliana, Tv. C.Vanlalawmpuia, Tv. B.Thangzauva, Pu C.Ramtharnghaka\n\n[Beginner]\nPi C.Lalchhandami, Pu C.Lalchhanhima, Nl. Lalrinkimi Fanai, Tv. Vanlalchhana, Nl. Nianglunvungi, Pi Vanlalawii, Pi Lalhriatpuii, Nl. Thangdinsangi, Nl. Baby Romalsawmi, Pu Lalengkima, Pi C.Lalramthari, Nl. V.Nunmawii, Nl. C.Lalremruati, Nl. R.Lalramnghaki\n\n[Pre Beginner]\nPi K.Lalbiakthangi, Pi Mary Lalnunmawii, Pi Lalchhanhimi, Pi Lalremchhungi Pautu, Pi H.Zodinsangi, Pi K.Lalrokhumi, Tv. PB Hmangaihropuia, Tv. David Lalrintluanga" },
  { year: '2021', details: "Superintendent : Upa H. Lalmawia\nAsst.Supdt NPSS : T Upa H.Zairemmawia\nAsst.Supdt i/c PTSS : Upa K. Vanlalhmuaka\nSecretary : Pu Lianpianga\nAsst. Secy i/c NPSS : Pu V. Lalbiakdika & Pu Manliankhupa\nAsst. Secy i/c PTSS : 1.Pu Vanlalhriata 2. Pu F. Lalbuatsaiha\n\n[Puitling Zirtirtu]\nUpa B.Hranghlira, Upa HT Vanlalsawma, Upa PC Lalhmingliana, Upa C. Lalrintluanga, Upa R. Lalramhluna, Upa Daikhawzama, Upa C. Lalthantluanga, Upa David Lalchhanhima, Upa HT Lalthlengliana, T Upa C. Zohmingthanga, Pu C. Roliana, Pu K. Lalduata, Pi PC Lalhmachhuani, Pu K. Lalduhawma, Upa G.Vanlallawma, Pu K. |huamluaia, Pu Vanlaldika Varte, Pu C. Lalzova, Pu P. Lalhmingthanga, Pi R.Ramengzuali, Pu GF Thanga, Pu C. Zaithanga, Pu H. Zakima, Pu Dawngsuanpauva, Pu C. Rohmingliana, Pu C. Ramrinliana, Pi V.Sangkungi, Pu Lalramthara, Pu L Khenpauva, Pu MS Dawngliana, Pu Lalsanglura Zote, Nl Ngurbawitluangi, Pu T. Chalzawna, Pu C. Sangzawna, Pu H. Vanlalthanga, Pi Lalhlimthangi Khiangte, Pu Lalmuanpuia Ralte, Pi K.Malsawmdawngi, Pu T. Sangtluanga, Pu Hmingthanmawia, Pu K. Lalengthanga, Pu C. Lalmuansanga, Pu C. Lalrawngbawla, Pu Lalremruata Hualngo, Pu C.Lal\\hazuala, Pu C. Hmingthansanga\n\n[Senior]\nPu V. Kaizasiama, Pu Thangkunga Hualngo, Tv. Thangdeihmanga, Nl. Zodinpuii, Nl. PC Lalrintluangi, Tv. Zoramenga, Pi Vanlalnghaki Colney, Pu Lianlamthanga\n\n[Sacrament]\nPu Thanglianmanga, Nl. Lalmuanchhungi, Nl. Lalrammawii Renthlei, Pi H.Lallawmkimi, Pu F.Lalhriatpuia, Nl. Chingsiannuami\n\n[Intermediate]\nPu Kap\\huama, Pu Keneth Lalthanzauva, Nl. Ningsianmawii, Tv. T.Lalnunzira, Pi R.Lallawmkimi, Nl. B.Lalnunsiami, Nl. Lalhminghlui, Pu Lalramnghakhlela, Pu Lalmuanpuia, Nl. T.Vanlalliani\n\n[Junior]\nPu Nelson Khiangte, Pu Mungngaihsanga, Nl. C.Lalnunthari, Pu Rodinthara, Nl. Lalmuanpuii, Pi LR Dinsangi, Pi Hmingthanmawii, Nl. Vungngaihdawni, Pu R.Lalmuanawma, Pu K.Lalramngheta, Pi K.Malsawmtluangi, Nl. Lalbiakchhungi, Pu F.Lalremsiama, Chingdawnvungi\n\n[Primary]\nTv R.Lalmalsawma, Pu H.Lalduhawma, Nl. Chingsawmluni, Nl. H.Lalrengpuii, Tv. Lalhmunngheta, Pu R.Lalromawia, Nl. J.Lalhlimpuii, Nl. Rachel Lalremruati Sailo, Pi Lalmuanpuii Hlawndo, Pu Andrew Z. Dawngliana, Tv. C.Vanlalawmpuia, Tv. B.Thangzauva, Pu C.Ramtharnghaka, Nl. Lalremruati, Nl. Lalnunsiami\n\n[Beginner]\nPi C.Lalchhandami, Pu C.Lalchhanhima, Nl. Lalrinkimi Fanai, Tv. Vanlalchhana, Nl. Nianglunvungi, Pi Vanlalawii, Nl. Thangdinsangi, Nl. Baby Romalsawmi, Pu Lalengkima, Pi C.Lalramthari, Nl. V.Nunmawii, Nl. C.Lalremruati, Pi K.Lalrinchhani\n\n[Pre Beginner]\nPi K. Lalbiakthangi, Pi H.Zodinsangi, Pi Lalchhanhimi, Pi Lalremchhungi Pautu, Pi K.Lalrokhumi, Tv. PB Hmangaihropuia, Tv. David Lalrintluanga" },
  { year: '2022', details: "Superintendent : Upa K Vanlalhmuaka\nAsst.Supdt i/c PTSS : Upa R Lalramhluna\nAsst.Supdt i/c NPSS : T Upa C Zohmingthanga\nSecretary : Pu C Lal\\hazuala\nAsst. Secy i/c PTSS : Pu Vanlalhriata & Pu F Lalbuatsaiha\nAsst. Secy i/c NPSS : Pu V Lalbiakdika & Pu Manliankhupa\n\n[Puitling Zirtirtu]\nUpa B Hranghlira, Upa HT Vanlalsawma, Upa H Lalmawia, Upa PC Lalhmingliana, Upa C Lalrintluanga, Upa Daikhawzama, Upa C Lalthantluanga, Upa David Lalchhanhima, Upa HT Lalthlengliana, T Upa H Zairemmawia, Pu Lianpianga, Pu C Roliana, Pu K Lalduata, Pi PC Lalhmachhuani, Pu K Lalduhawma, Upa G Vanlallawma, Pu K |huamluaia, Pu Vanlaldika Varte, Pu C Lalzova, Pu P Lalhmingthanga, Pi R Ramengzuali, Pu GF Thanga, Pu Dawngsuanpauva, Pu C Rohmingliana, Pu C Ramrinliana, Pu C Zaithanga, Pi V Sangkungi, Pu Lalramthara, Pu MS Dawngliana, Pu Lalsanglura Zote, Nl Ngurbawitluangi, Pu T Chalzawna, Pu C Sangzawna, Pu H Vanlalthanga, Pi Lalhlimthangi Khiangte, Pu Lalmuanpuia Ralte, Pi K Malsawmdawngi, Pu T Sangtluanga, Pu Hmingthanmawia, Pu K Lalengthanga, Pu C Lalmuansanga, Pu C Lalrawngbawla, Pu Lalremruata Hualngo, Pu Hmingthansanga, Pu V Lalbiakzuala, Pu JC Laldinthara\n\n[Senior]\nPu V. Kaizasiama, Pu Thangkunga Hualngo, Tv. Thangdeihmanga, Nl. Zodinpuii, Nl. PC Lalrintluangi, Pu Zoramenga, Pi Vanlalnghaki Colney, Pu Lianlamthanga\n\n[Sacrament]\nPu Thanglianmanga, Nl. Lalmuanchhungi, Nl. F. Lalmuankimi, Pi H.Lallawmkimi, Pu F. Lalhriatpuia, Nl. Lalrammawii Renthlei, Tv. Vanlalchhana\n\n[Intermediate]\nPu Kap\\huama, Pu Keneth Lalthanzauva, Nl. Ningsianmawii, Tv. T.Lalnunzira, Nl. B.Lalnunsiami, Nl. Lalhminghlui, Pu Lalramnghakhlela, Pu Lalmuanpuia, Pu Lalengkima, Tv Lalfakawma\n\n[Junior]\nPu Nelson Khiangte, Pu R.Lalmuanawma, Nl. C.Lalnunthari, Pu Rodinthara, Nl. Lalmuanpuii, Pi LR Dinsangi, Pi Hmingthanmawii, Nl. Vungngaihdawni, Pu. K.Lalramngheta, Pi K.Malsawmtluangi, Nl. Lalbiakchhungi, Pu F Lalremsiama, Nl Chingdawnvungi, Tv. Liankhankhama\n\n[Primary]\nTv. R.Lalmalsawma, Pu H.Lalduhawma, Nl. Chingsawmluni, Tv. Lalhmunngheta, Pu R.Lalromawia, Nl. J.Lalhlimpuii, Nl.Rachel Lalremruati Sailo, Pi Lalmuanpuii Hlawndo, Pu C. Ramtharnghaka, Tv. C.Vanlalawmpuia, Tv. B.Thangzauva, Nl. Lalnunsiami, Nl. Nianglunvungi, Nl. Lallawmzuali, Tv Vanlalrintlaka\n\n[Beginner]\nPi C.Lalchhandami, Pu C.Lalchhanhima, Nl. Lalrinkimi Fanai, Pi Vanlalawii, Nl. Thangdinsangi, Pi C.Lalramthari, Nl. V. Nunmawii, Nl. C.Lalremruati, Pi K.Lalrinchhani, Nl. Baby Romalsawmi, Tv. Zamdingliana, Tv. Thangsawmliana\n\n[Pre - Beginner]\nPi K. Lalbiakthangi, Pi H. Zodinsangi, Pi Lalremchhungi Pautu, Pi Lalchhanhimi, Pi K.Lalrokhumi, Tv. PB Hmangaihropuia, Pu Mungngaihsanga, Pi Lalbiakdiki" },
  { year: '2023', details: "Superintendent : Upa R.Lalramhluna\nAsst.Superintendent i/c PT : Upa Daikhawzama\nAsst.Supdt i/c NPSS : Upa C. Zohmingthanga\nSecretary : Pu C Lal\\hazuala\nAsst. Secretary i/c PTSS : 1) Pu Vanlalhriata 2) Pu F Lalbuatsaiha\nAsst. Secretary i/c NPSS : 1) Pu V Lalbiakdika 2) Pu Manliankhupa\n\n[Puitling Zirtirtu]\nUpa B Hranghlira, Upa K.Vanlalhmuaka, Upa HT Vanlalsawma, Upa H Lalmawia, Upa PC Lalhmingliana, Upa C Lalrintluanga, Upa C Lalthantluanga, Upa David Lalchhanhima, Upa HT Lalthlengliana, Upa H Zairemmawia, Upa Lianpianga, T.Upa Lalremruata Hualngo, T.Upa Hmingthanmawia, Pu C Roliana, Pu K Lalduata, Pi PC Lalhmachhuani, Pu K Lalduhawma, Upa G Vanlallawma, Pu K |huamluaia, Pu Vanlaldika Varte, Pu C Lalzova, Pu P Lalhmingthanga, Pi R Ramengzuali, Pu GF Thanga, Pu C Zaithanga, Pu Dawngsuanpauva, Pu C Rohmingliana, Pu C Ramrinliana, Pi V Sangkungi, Pu Lalramthara, Pu MS Dawngliana, Pu Lalsanglura Zote, Nl. Ngurbawitluangi, Pu T Chalzawna, Pu C Sangzawna, Pu H Vanlalthanga, Pi Lalhlimthangi Khiangte, Pu Lalmuanpuia Ralte, Pi K Malsawmdawngi, Pu T Sangtluanga, Pu C.Hmingthansanga, Pu K Lalengthanga, Pu C Lalmuansanga, Pu C Lalrawngbawla, Pu V Lalbiakzuala, Pu JC Laldinthara, Pu Thanglianmanga, Rev Vankhuma\n\n[Senior Department:]\nPu Kap\\huama, Pu Keneth Lalthanzauva, Nl. Zodinpuii, Nl. PC.Lalrintluangi, Pi Vanlalnghaki Colney, Pu Lianlamthanga, Tv. Thangdeihmanga, Nl. Lalrammawii Renthlei, Pu F.Lalhriatpuia, Nl. Ningsianmawii, Tv. H.Lalfakawma\n\n[Sacrament Department]\nPu V.Kaizasiama, Tv.C.Vanlalawmpuia, Tv. Vanlalchhana, Nl.Lalmuanchhungi, Pi H.Lallawmkimi, Nl.F.Lalmuankimi, Pu Lalramnghakhlela, Pi C.Lalchhandami\n\n[Intermediate Department]\nPu Nelson Khiangte, Pu Thangkunga Hualngo, Tv. Lalfakawma, Pu Lalmuanpuia, Pu Lalengkima, Pu K.Lalramngheta, Pi Hmingthanmawii, Pu R.Lalmuanawma, Pu Rodinthara, Pu R.Lalromawia, Nl.Lalnunthari, Nl. Vungngaihdawni\n\n[Junior Department]\nTv. R.Lalmalsawma, Tv. T.Lalnunzira, Nl. Rachel Lalremruati Sailo, Pi K.Malsawmtluangi, Pu F.Lalremsiama, Tv. Liankhankhama, Pu F.Hmingthanzuala, Nl. B.Lalnunsiami, Nl. Chingsawmluni, Tv. Lalhmunngheta, Nl. J.Lalhlimpuii, Pi V.Vanlalawii, Pu H.Lalduhawma, Pu Vanlalmawia, Nl. Lalramsangi, Nl. Marina Lalfakawmi\n\n[Primary Department]\nPu Zoramenga, Pi Lalmuanpuii Hlondo, Tv. B.Thangzauva, Pu C.Ramtharnghaka, Nl. Lalnunsiami, Nl. Nianglunvungi, Nl. Lallawmzuali, Pi LR.Dinsangi, Pu C.Lalchhanhima, Nl. Baby Romalsawmi, Pu Vanlalzamlova, Pu Tluangzathanga, Nl. Khupngaihzovi, Nl.Zodinsangi\n\n[Beginner Department]\nPi K.Lalbiakthangi, Pu Mungngaihsanga, Nl. Lalbiakchhungi, Pi C.Lalramthari, Nl. Thangdinsangi, Nl. V.Nunmawii, Nl. C.Lalremruati, Tv. Thangsawmliana, Pu PC.Lalmuanpuia, Pu Christopher Lalthlamuana, Pu Vanlalruatpuia\n\n[Pre-Beginner Department]\nPi K.Lalrokhumi, Pi H.Zodinsangi, Pi Lalbiakdiki, Pi Lalremchhungi Pautu, Pi Lalchhanhimi, Tv. PB.Hmangaihropuia, Tv. Lalrinfela" },
  { year: '2024', details: "Superintendent : Upa PC Lalhmingliana\nAsst.Spdt i/c PT : Upa C Lalthantluanga\nAsst.Supdt i/c NPSS : Upa Lianpianga\nSecretary : Pu C Lal\\hazuala\nAsst. Secretary i/c PTSS : 1) Pu Vanlalhriata 2) Pu C Rohmingliana\nAsst. Secretary i/c NPSS : 1) Pu Manliankhupa 2) Tv. C Vanlalawmpuia\n\n[Puitling Zirtirtu]\nUpa B Hranghlira, Upa K.Vanlalhmuaka, Upa HT Vanlalsawma, Upa H Lalmawia, Upa C Lalrintluanga, Upa R Lalramhluna, Upa Daikhawzama, Upa David Lalchhanhima, Upa HT Lalthlengliana, Upa H Zairemmawia, Upa C Zohmingthanga, T.Upa Lalremruata Hualngo, Pu K Lalduata, Pi PC Lalhmachhuani, Pu K Lalduhawma, Upa G Vanlallawma, Pu K |huamluaia, Pu Vanlaldika Varte, Pu C Lalzova, Pu P Lalhmingthanga, Pi R Ramengzuali, Pu GF Thanga, Pu Dawngsuanpauva, Pi V Sangkungi, Pu Lalramthara, Pu MS Dawngliana, Pu Lalsanglura Zote, Nl. Ngurbawitluangi, Pu T Chalzawna, Pu C Sangzawna, Pu H Vanlalthanga, Pi Lalhlimthangi Khiangte, Pu Lalmuanpuia Ralte, Pi K Malsawmdawngi, Pu T Sangtluanga, Pu C.Hmingthansanga, Pu K Lalengthanga, Pu C Lalmuansanga, Pu C Lalrawngbawla, Pu V Lalbiakzuala, Pu JC Laldinthara, Pu Thanglianmanga, Rev Vankhuma, Pi Vanlalhluni, Pu R Lalmalsawma, Pu C Malsawmdawngliana\n\n[Senior Department:]\nPu Kap\\huama, Pu Keneth Lalthanzauva, Nl. Ningsianmawii, Nl. Lalrammawii Renthlei, Pu F.Lalhriatpuia, Tv. H Lalfakawma, Pi H.Lallawmkimi, Tv. Vanlalchhana, Pu Lalengkima, Pu F Hmingthanzuala, Pi C Lalramthari\n\n[Sacrament Department]\nT.Upa Hmingthanmawia Sailo, Pu V.Kaizasiama, Tv. Thangdeihmanga, Pu Lalramnghakhlela, Pi C.Lalchhandami, Pi Vanlalnghaki Colney, Pu Thangkunga Hualngo, Pu Lalmuanpuia\n\n[Intermediate Department]\nPu Nelson Khiangte, Pu K.Lalramngheta, Nl.Lalnunthari, Pu R.Lalromawia, Nl. Vungngaihdawni, Pi C Lalhruaitluangi, Nl. PC Lalrintluangi, Pi K.Malsawmtluangi, Tv. Lalhmunngheta, Tv. B.Thangzauva, Pu C.Ramtharnghaka, Pu F.Lalremsiama, Nl. Rachel Lalremruati Sailo\n\n[Junior Department]\nPu Zoramenga, Tv. T.Lalnunzira, Nl. C.Lalremruati, Tv. Liankhankhama, Nl. B.Lalnunsiami, Nl. Chingsawmluni, Pu Vanlalmawia, Nl. Marina Lalfakawmi, Nl. C Ramnghinglovi, Nl. Lalmuanchhungi, Pi Lalmuanpuii Hlondo, Nl. Thangdinsangi, Pu C Lalengmawia, Tv. Vanlalzauva, Nl. Saimawipuii Sailo, Pu Laltlansanga, Nl. Lalramsangi\n\n[Primary Department]\nPu V Lalbiakdika, Pi LR.Dinsangi, Nl. Lallawmzuali, Pu C.Lalchhanhima, Nl. Baby Romalsawmi, Pu Vanlalzamlova, Pu Tluangzathanga, Nl. Khupngaihzovi, Nl.Zodinsangi, Nl. PC Lalthanmawii, Pi Hmingthanmawii, Pu C Rodinthara, Tv. PB.Hmangaihropuia, Nl. V.Nunmawii, Tv. T Vanneihtluanga, Nl. Zosangpuii\n\n[Beginner Department]\nPi K.Lalbiakthangi, Pu Mungngaihsanga, Nl. Lalbiakchhungi, Tv. Thangsawmliana, Pu PC.Lalmuanpuia, Pu Christopher Lalthlamuana, Pu Vanlalruatpuia, Nl. F Lalmuankimi, Nl. Lalnunsiami, Pu Lalmuanpuia Hauhnar, Pu T Lalramnghaka, Nl. Ruthi Lalnunfeli\n\n[Pre-Beginner Department]\nPi K.Lalrokhumi, Pi H.Zodinsangi, Pi Lalbiakdiki, Pi Lalremchhungi Pautu, Pi Lalchhanhimi, Pi Mary Lalnunmawii, Pi Linda Vanlalruati" },
  { year: '2025', details: "Superintendent : Upa HT Vanlalsawma\nAsst.Spdt i/c PT : Upa David Lalchhanhima\nAsst.Supdt i/c NPSS : Upa Lianpianga\nSecretary : T.Upa C Lal\\hazuala\nAsst. Secretary i/c PTSS : 1) Pu Vanlalhriata 2) Pu C Rohmingliana\nAsst. Secretary i/c NPSS : 1) Pu Manliankhupa 2) Nl. F Lalmuankimi\n\n[Puitling Zirtirtu]\nUpa B Hranghlira, Upa K.Vanlalhmuaka, Upa H Lalmawia, Upa PC Lalhmingliana, Upa R Lalramhluna, Upa Daikhawzama, Upa C Lalthantluanga, Upa HT Lalthlengliana, Upa H Zairemmawia, Upa C Zohmingthanga, T.Upa Hmingthanmawia Sailo, Pu K Lalduata, Pi PC Lalhmachhuani, Pu K Lalduhawma, Pu K |huamluaia, Pu C Lalzova, Pu P Lalhmingthanga, Pi R Ramengzuali, Pu GF Thanga, Pu Dawngsuanpauva, Pi V Sangkungi, Pu Lalramthara, Pu MS Dawngliana, Pu Lalsanglura Zote, Nl. Ngurbawitluangi, Pu H Vanlalthanga, Pi Lalhlimthangi Khiangte, Pu Lalmuanpuia Ralte, Pi K Malsawmdawngi, Pu T Sangtluanga, T.Upa C.Hmingthansanga, Pu K Lalengthanga, Pu C Lalmuansanga, Pu C Lalrawngbawla, Pu V Lalbiakzuala, Pu JC Laldinthara, Pu Thanglianmanga, Rev Vankhuma, Pu R Lalmalsawma, Pu C Malsawmdawngliana, T.Upa V Kaizasiama, Pu Kenneth Lalthanzauva, Pu F Lalduhawma, Pu Lalhmingmawia, Pu Khawlrosiama, Pu L Khenpauva\n\n[Senior Department:]\nPu Kap\\huama, Tv. H Lalfakawma, Nl. Ningsianmawii, Nl. Lalrammawii Renthlei, Pi H.Lallawmkimi, Tv. Vanlalchhana, Pu Lalengkima, Pu F Hmingthanzuala, Pi C Lalramthari, Pu Lalramnghakhlela, Nl. Lallawmzuali\n\n[Sacrament Department]\nT.Upa Lalremruata, Pi C.Lalchhandami, Nl. Lalmuanchhungi, Tv. Thangdeihmanga, Pi Vanlalnghaki Colney, Pu Lalmuanpuia, Tv. Liankhankhama\n\n[Intermediate Department]\nPu Nelson Khiangte, Pu Thangkunga Hualngo, Nl. Ngurthankimi, Pu K Lalramngheta, Nl.Lalnunthari, Pu R.Lalromawia, Nl. Vungngaihdawni, Nl. PC Lalrintluangi, Pi K.Malsawmtluangi, Tv. Lalhmunngheta, Tv. B.Thangzauva, Pu C.Ramtharnghaka, Pu F.Lalhriatpuia\n\n[Junior Department]\nPu Zoramenga, Tv. T.Lalnunzira, Nl. C.Lalremruati, Nl. B.Lalnunsiami, Pu Vanlalmawia, Nl. Marina Lalfakawmi, Nl. C Ramnghinglovi, Pi Lalmuanpuii Hlondo, Nl. Thangdinsangi, Pu C Lalengmawia, Tv. Vanlalzauva, Nl. Saimawipuii Sailo, Pu Laltlansanga, Pu Mungngaihsanga, Nl. B Lalrampari, Pu Lalhruaitluanga, Nl. C Zonunsiami, Nl. Thangsuankimi, Nl. Vunglamluni, Tv. Thangzasanga\n\n[Primary Department]\nPu V Lalbiakdika, Pi LR.Dinsangi, Nl.Zodinsangi, Pu C.Lalchhanhima, Nl. Baby Romalsawmi, Pu Vanlalzamlova, Pu Tluangzathanga, Nl. Khupngaihzovi, Nl. PC Lalthanmawii, Pi Hmingthanmawii, Pu C Rodinthara, Tv. PB.Hmangaihropuia, Nl. V.Nunmawii, Tv. T Vanneihtluanga, Nl. Zosangpuii, Tv. C Lalhumhima, Nl. Malsawmmawii, Nl. Enlamchingi\n\n[Beginner Department]\nPi K.Lalbiakthangi, Pu PC.Lalmuanpuia, Nl. Ruthi Lalnunfeli, Pu Vanlalruatpuia, Nl. Lalnunsiami, Pu Lalmuanpuia Hauhnar, Pu T Lalramnghaka, Pi C Lalhruaitluangi, Nl. Chingsawmluni, Nl. C Lalrampansangi, Nl. Lalduhawmi, Nl. R Lalrinmawii\n\n[Pre-Beginner Department]\nPi K.Lalrokhumi, Pi Mary Lalnunmawii, Pi Lalbiakdiki, Pi Lalchhanhimi, Pi Linda Vanlalruati, Pi HT Lalnuntluangi, Nl. DL Kimi Suante" }
];

// Helper function to generate static data for fallback
const getStaticArchives = (): ArchiveEntry[] => {
    const staticEntries: ArchiveEntry[] = [];

    // 1. Process SS Data
    SUNDAY_SCHOOL_TEACHERS_SEED_DATA.forEach(item => {
        const fullText = item.details;
        const year = item.year;
        const lines = fullText.split('\n');
        
        let currentDept = 'SS Zirtirtute - O.B.';
        let currentContent: string[] = [];
        
        const addEntry = (dept: string, content: string[]) => {
            if (content.length === 0) return;
            const desc = content.join('\n').trim();
            if (!desc) return;
            
            const subCatSlug = dept.replace(/SS Zirtirtute - /g, '').toLowerCase().replace(/[^a-z0-9]/g, '-');
            const docId = `static-ss-${subCatSlug}-${year}`;
            
            staticEntries.push({
                id: docId,
                title: year,
                date: `${year}-01-01`,
                category: 'Rawngbawltu te',
                subCategory: dept,
                description: desc,
                link: ''
            });
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line && currentContent.length === 0) continue; 

            const match = line.match(/^\[(.*?)\]/);
            
            if (match) {
                addEntry(currentDept, currentContent);
                currentContent = []; 
                const rawDeptName = match[1].toLowerCase();
                
                if (rawDeptName.includes('puitling')) currentDept = 'SS Zirtirtute - Puitling';
                else if (rawDeptName.includes('senior')) currentDept = 'SS Zirtirtute - Senior';
                else if (rawDeptName.includes('sacrament')) currentDept = 'SS Zirtirtute - Sacrament';
                else if (rawDeptName.includes('intermediate')) currentDept = 'SS Zirtirtute - Intermediate';
                else if (rawDeptName.includes('junior')) currentDept = 'SS Zirtirtute - Junior';
                else if (rawDeptName.includes('primary')) currentDept = 'SS Zirtirtute - Primary';
                else if (rawDeptName.includes('pre') && rawDeptName.includes('beginner')) currentDept = 'SS Zirtirtute - Pre-Beginner';
                else if (rawDeptName.includes('beginner')) currentDept = 'SS Zirtirtute - Beginner';
                else currentDept = 'SS Zirtirtute - O.B.';
                
            } else {
                currentContent.push(line);
            }
        }
        addEntry(currentDept, currentContent);
    });

    // 2. Add other mock/seed data if necessary (e.g. MOCK_ARCHIVES)
    const MOCK_ARCHIVES: ArchiveEntry[] = [
        { id: '1', title: 'Church Foundation Stone Laying', date: '1985-04-12', category: 'History', description: 'Records of the foundation stone laying ceremony.', link: '#' },
        { id: '2', title: 'Silver Jubilee Souvenir', date: '2010-10-15', category: 'Document', description: 'Scanned copy of the Silver Jubilee souvenir book.', link: '#' },
        { id: '3', title: 'Old Church Building Photo', date: '1990-05-20', category: 'Photo', description: 'Photograph of the first church building.', link: '#' },
        { id: '4', title: '2023', date: '2023-01-01', category: 'Rawngbawltu te', subCategory: 'Executive Body', description: 'List of executive committee members for the year 2023.', link: '#' }
    ];

    return [...staticEntries, ...MOCK_ARCHIVES];
};

export const Archives: React.FC = () => {
    const { t } = useLanguage();
    const { isAdmin } = useAuth();
    const [archives, setArchives] = useState<ArchiveEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');
    const [activeSSDepartment, setActiveSSDepartment] = useState<string | null>(null);
    const [missingIndexUrl, setMissingIndexUrl] = useState<string | null>(null);
    
    // SS Search State
    const [ssSearchTerm, setSsSearchTerm] = useState('');
    const [ssSearchResults, setSsSearchResults] = useState<any[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<Partial<ArchiveEntry>>({});
    const [isSaving, setIsSaving] = useState(false);

    const fetchArchives = useCallback(async () => {
        setLoading(true);
        setMissingIndexUrl(null);
        
        let fetchedData: ArchiveEntry[] = [];
        let useStatic = false;

        if (!db || !db.collection) {
            useStatic = true;
        } else {
            try {
                // Base Reference
                let collectionRef = db.collection('archives');
                let baseQuery: any = collectionRef;
                let requiresSortInJs = false;
                
                // Construct Filters
                if (selectedCategory === 'Rawngbawltu te' && selectedSubCategory) {
                    if (selectedSubCategory === 'Sunday School Teachers') {
                        if (!activeSSDepartment) {
                             // If no dept selected in UI, fetch nothing from DB
                             setArchives([]); 
                             setLoading(false);
                             return; 
                        }
                        baseQuery = baseQuery.where('subCategory', '==', `SS Zirtirtute - ${activeSSDepartment}`);
                    } else if (selectedSubCategory !== 'All') {
                        baseQuery = baseQuery.where('subCategory', '==', selectedSubCategory);
                    } else {
                        baseQuery = baseQuery.where('category', '==', 'Rawngbawltu te');
                    }
                } else if (selectedCategory !== 'All') {
                    baseQuery = baseQuery.where('category', '==', selectedCategory);
                }

                // Attempt 1: Query WITH server-side sorting (Fastest, but needs index)
                try {
                    const sortedQuery = baseQuery.orderBy('date', 'desc');
                    const snapshot = await sortedQuery.get();
                    if (!snapshot.empty) {
                        fetchedData = snapshot.docs.map((doc: any) => ({
                            id: doc.id,
                            ...doc.data()
                        })) as ArchiveEntry[];
                    } else {
                        // Empty result from DB
                    }
                } catch (indexError: any) {
                    // Check if error is missing index
                    if (indexError.code === 'failed-precondition' || indexError.message?.includes('index')) {
                        console.warn("Index missing for Archives query. Falling back to client-side sorting.", indexError);
                        
                        // Extract URL for admin convenience
                        const match = indexError.message?.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
                        if (match && isAdmin) {
                             setMissingIndexUrl(match[0]);
                        }

                        // Attempt 2: Query WITHOUT sorting (Slower if list is huge, but works without composite index)
                        const unsortedSnapshot = await baseQuery.get();
                        if (!unsortedSnapshot.empty) {
                            fetchedData = unsortedSnapshot.docs.map((doc: any) => ({
                                id: doc.id,
                                ...doc.data()
                            })) as ArchiveEntry[];
                            requiresSortInJs = true;
                        } else {
                             // If unsorted query is also empty, then it's truly empty.
                        }
                    } else {
                        throw indexError; // Rethrow other errors (permission, network) to trigger static fallback
                    }
                }

                // Client-side sort if needed
                if (requiresSortInJs) {
                    fetchedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                }

            } catch (error) {
                console.error("Error fetching archives:", error);
                useStatic = true; // Error, fallback to static
            }
        }

        if (useStatic) {
            const allStatic = getStaticArchives();
            // Filter static data in memory to match the query parameters
            fetchedData = allStatic.filter(item => {
                // Category Filter
                if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;

                // Sub Category Filter (Only for Rawngbawltu te)
                if (selectedCategory === 'Rawngbawltu te') {
                    if (selectedSubCategory === 'All') return true;
                    if (selectedSubCategory === 'Sunday School Teachers') {
                        if (!activeSSDepartment) return false;
                        return item.subCategory === `SS Zirtirtute - ${activeSSDepartment}`;
                    }
                    return item.subCategory === selectedSubCategory;
                }
                
                return true;
            });
            // Sort static data
            fetchedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        setArchives(fetchedData);
        setLoading(false);
    }, [selectedCategory, selectedSubCategory, activeSSDepartment, isAdmin]);

    useEffect(() => {
        fetchArchives();
    }, [fetchArchives]);

    // Reset subcategory when main category changes
    useEffect(() => {
        if (selectedCategory !== 'Rawngbawltu te') {
            setSelectedSubCategory('All');
            setActiveSSDepartment(null);
            setSsSearchTerm('');
            setSsSearchResults([]);
        }
    }, [selectedCategory]);

    // When switching subcategories, reset SS department selection unless staying within SS context
    useEffect(() => {
        if (selectedSubCategory !== 'Sunday School Teachers') {
            setActiveSSDepartment(null);
            setSsSearchTerm('');
            setSsSearchResults([]);
        }
    }, [selectedSubCategory]);

    const handleAddNew = () => {
        setEditingEntry({
            title: '',
            date: new Date().toISOString().split('T')[0],
            category: 'Document',
            subCategory: '',
            description: '',
            link: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (entry: ArchiveEntry) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (id.startsWith('static-')) {
            alert("Cannot delete static/seed data directly. Please seed the database first to manage records.");
            return;
        }
        if (!db?.collection || !window.confirm("Are you sure you want to delete this archive entry?")) return;
        try {
            await db.collection('archives').doc(id).delete();
            fetchArchives();
        } catch (error) {
            console.error("Error deleting archive:", error);
            alert("Failed to delete archive entry.");
        }
    };

    const handleSave = async () => {
        if (!db?.collection) {
            alert("Database connection not available.");
            return;
        }
        
        setIsSaving(true);
        try {
            const { id, ...data } = editingEntry;
            
            // Clean up subCategory if category is not Rawngbawltu te
            if (data.category !== 'Rawngbawltu te') {
                delete data.subCategory;
            }

            if (id && !id.startsWith('static-')) {
                await db.collection('archives').doc(id).set(data, { merge: true });
            } else {
                await db.collection('archives').add(data);
            }
            setIsModalOpen(false);
            fetchArchives();
        } catch (error) {
            console.error("Error saving archive:", error);
            alert("Failed to save archive entry.");
        }
        setIsSaving(false);
    };

    // Generic Seed Function for simple categories
    const handleSeedGeneric = async (data: any[], subCategory: string) => {
        if (!db?.collection || !window.confirm(`This will add/overwrite ${subCategory} records. Continue?`)) {
            return;
        }
        setIsSaving(true);
        try {
            const batch = db.batch();
            const collectionRef = db.collection('archives');
            
            data.forEach(item => {
                // Create a unique ID based on year and subCategory to avoid duplicates
                const docId = `${subCategory.toLowerCase().replace(/\s+/g, '-')}-${item.year}`; 
                const docRef = collectionRef.doc(docId);
                const entry: ArchiveEntry = {
                    id: docId,
                    title: item.year, // Using JUST the year as title
                    date: `${item.year}-01-01`,
                    category: 'Rawngbawltu te',
                    subCategory: subCategory,
                    description: item.details,
                    link: ''
                };
                batch.set(docRef, entry);
            });

            await batch.commit();
            alert(`${subCategory} data seeded successfully!`);
            fetchArchives();
        } catch (error) {
            console.error(`Error seeding ${subCategory}:`, error);
            alert("Failed to seed data.");
        }
        setIsSaving(false);
    };

    // Specific Seed Function for Sunday School Teachers with parsing logic
    const handleSeedSundaySchoolTeachers = async () => {
        if (!db?.collection || !window.confirm("This will parse and add/overwrite ALL Sunday School Teachers records (O.B. and Departments). This process may take a moment. Continue?")) {
            return;
        }
        setIsSaving(true);
        try {
            const batch = db.batch();
            const collectionRef = db.collection('archives');
            
            SUNDAY_SCHOOL_TEACHERS_SEED_DATA.forEach(item => {
                const fullText = item.details;
                const year = item.year;
                const lines = fullText.split('\n');
                
                let currentDept = 'SS Zirtirtute - O.B.';
                let currentContent: string[] = [];
                
                const saveBuffer = (dept: string, content: string[]) => {
                    if (content.length === 0) return;
                    const desc = content.join('\n').trim();
                    if (!desc) return;
                    
                    // Create a robust slug for ID
                    const subCatSlug = dept.replace(/SS Zirtirtute - /g, '').toLowerCase().replace(/[^a-z0-9]/g, '-');
                    const docId = `ss-${subCatSlug}-${year}`;
                    
                    const docRef = collectionRef.doc(docId);
                    const entry: ArchiveEntry = {
                        id: docId,
                        title: year,
                        date: `${year}-01-01`,
                        category: 'Rawngbawltu te',
                        subCategory: dept,
                        description: desc,
                        link: ''
                    };
                    batch.set(docRef, entry);
                };

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line && currentContent.length === 0) continue; // Skip leading empty lines

                    // Check for department header: [Puitling] or [Puitling zirtirtu]
                    const match = line.match(/^\[(.*?)\]/);
                    
                    if (match) {
                        // Save previous buffer
                        saveBuffer(currentDept, currentContent);
                        
                        // Determine new department
                        currentContent = []; // Clear buffer
                        const rawDeptName = match[1].toLowerCase();
                        
                        if (rawDeptName.includes('puitling')) currentDept = 'SS Zirtirtute - Puitling';
                        else if (rawDeptName.includes('senior')) currentDept = 'SS Zirtirtute - Senior';
                        else if (rawDeptName.includes('sacrament')) currentDept = 'SS Zirtirtute - Sacrament';
                        else if (rawDeptName.includes('intermediate')) currentDept = 'SS Zirtirtute - Intermediate';
                        else if (rawDeptName.includes('junior')) currentDept = 'SS Zirtirtute - Junior';
                        else if (rawDeptName.includes('primary')) currentDept = 'SS Zirtirtute - Primary';
                        else if (rawDeptName.includes('pre') && rawDeptName.includes('beginner')) currentDept = 'SS Zirtirtute - Pre-Beginner';
                        else if (rawDeptName.includes('beginner')) currentDept = 'SS Zirtirtute - Beginner';
                        else currentDept = 'SS Zirtirtute - O.B.'; // Fallback or unknown department
                        
                    } else {
                        currentContent.push(line);
                    }
                }
                // Save the last buffer
                saveBuffer(currentDept, currentContent);
            });

            await batch.commit();
            alert("Sunday School Teachers data parsed and seeded successfully!");
            fetchArchives();
        } catch (error) {
            console.error("Error seeding Sunday School data:", error);
            alert("Failed to seed data. Check console for details.");
        }
        setIsSaving(false);
    };

    const handleSeedExecutiveBody = () => handleSeedGeneric(EXECUTIVE_BODY_SEED_DATA, 'Executive Body');
    const handleSeedRamthar = () => handleSeedGeneric(RAMTHAR_SEED_DATA, 'Ramthar');
    const handleSeedBuilding = () => handleSeedGeneric(BUILDING_SEED_DATA, 'BUILDING');
    const handleSeedSocialFront = () => handleSeedGeneric(SOCIAL_FRONT_SEED_DATA, 'SOCIAL FRONT');
    const handleSeedRefreshment = () => handleSeedGeneric(REFRESHMENT_SEED_DATA, 'REFRESHMENT');
    const handleSeedKristianChhungkua = () => handleSeedGeneric(KRISTIAN_CHHUNGKUA_SEED_DATA, 'KRISTIAN CHHUNGKUA');
    const handleSeedWorship = () => handleSeedGeneric(WORSHIP_SEED_DATA, 'WORSHIP');
    const handleSeedMasihiSangati = () => handleSeedGeneric(MASIHI_SANGATI_SEED_DATA, 'MASIHI SANGATI');
    const handleSeedReceptionUsheringDecoration = () => handleSeedGeneric(RECEPTION_USHERING_DECORATION_SEED_DATA, 'RECEPTION, USHERING & DECORATION');
    const handleSeedArchiveLibrary = () => handleSeedGeneric(ARCHIVE_LIBRARY_SEED_DATA, 'ARCHIVE & LIBRARY');
    const handleSeedMusic = () => handleSeedGeneric(MUSIC_SEED_DATA, 'MUSIC');
    const handleSeedLightSound = () => handleSeedGeneric(LIGHT_SOUND_SEED_DATA, 'LIGHT & SOUND');
    const handleSeedFinance = () => handleSeedGeneric(FINANCE_SEED_DATA, 'FINANCE');
    const handleSeedBSI = () => handleSeedGeneric(BSI_SEED_DATA, 'BSI');
    const handleSeedKTP = () => handleSeedGeneric(KTP_SEED_DATA, 'KTP');
    const handleSeedKohhranHmeichhia = () => handleSeedGeneric(KOHHRAN_HMEICHHIA_SEED_DATA, 'KOHHRAN HMEICHHIA');
    const handleSeedKohhranPavalaiPawl = () => handleSeedGeneric(KOHHRAN_PAVALAI_PAWL_SEED_DATA, 'KOHHRAN PAVALAI PAWL');


    const filteredArchives = archives.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              item.description.toLowerCase().includes(searchTerm.toLowerCase());
        // Category filtering is handled in fetch, but search is client side
        return matchesSearch; 
    });

    const categories = ['All', 'Document', 'Photo', 'Video', 'History', 'Minute', 'Rawngbawltu te'];

    const handleSSSearch = (term: string) => {
        setSsSearchTerm(term);
        if (!term.trim()) {
            setSsSearchResults([]);
            return;
        }
        
        const results: any[] = [];
        SUNDAY_SCHOOL_TEACHERS_SEED_DATA.forEach(data => {
            const year = data.year;
            const lines = data.details.split('\n');
            let currentDept = 'O.B.';
            
            lines.forEach(line => {
                const deptMatch = line.match(/^\[(.*?)\]/);
                if (deptMatch) {
                    currentDept = deptMatch[1];
                } else if (line.toLowerCase().includes(term.toLowerCase())) {
                    // Extract context
                    const parts = line.split(/,|and/);
                    const matchedPart = parts.find(p => p.toLowerCase().includes(term.toLowerCase())) || line;
                    
                    results.push({
                        year,
                        dept: currentDept,
                        text: matchedPart.trim(),
                        fullLine: line.trim()
                    });
                }
            });
        });
        setSsSearchResults(results);
    };

    // Render Department Grid
    const renderDepartmentGrid = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Sunday School Departments</h2>
                    <p className="text-slate-500 text-sm">Select a department to view records or search a teacher's name.</p>
                </div>
                {isAdmin && (
                    <button 
                        onClick={handleSeedSundaySchoolTeachers}
                        disabled={isSaving}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition whitespace-nowrap disabled:opacity-50 text-sm"
                    >
                        {isSaving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Database size={16} className="mr-2" />}
                        Seed SS Teachers Data
                    </button>
                )}
            </div>

            {/* SS Search Bar */}
            <div className="relative mb-8">
                <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-church-500" size={20} />
                <input 
                    type="text" 
                    placeholder="Search for a Sunday School Teacher (Name)..." 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-church-500 focus:border-transparent outline-none shadow-sm text-lg"
                    value={ssSearchTerm}
                    onChange={(e) => handleSSSearch(e.target.value)}
                />
            </div>

            {ssSearchTerm ? (
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700">Search Results for "{ssSearchTerm}" ({ssSearchResults.length})</h3>
                    {ssSearchResults.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {ssSearchResults.map((res, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 hover:border-church-200 transition">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="bg-church-100 text-church-700 text-xs font-bold px-2 py-1 rounded">{res.year}</span>
                                        <span className="text-xs text-slate-400 font-medium uppercase">{res.dept}</span>
                                    </div>
                                    <p className="text-slate-800 font-medium">
                                        {res.text.split(new RegExp(`(${ssSearchTerm})`, 'gi')).map((part: string, i: number) => 
                                            part.toLowerCase() === ssSearchTerm.toLowerCase() ? <span key={i} className="bg-yellow-200 text-slate-900">{part}</span> : part
                                        )}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-2 truncate" title={res.fullLine}>{res.fullLine}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-white rounded-lg border border-dashed border-slate-200">
                            <p className="text-slate-500">No records found matching "{ssSearchTerm}".</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {SS_DEPARTMENTS.map((dept) => (
                        <button
                            key={dept}
                            onClick={() => setActiveSSDepartment(dept)}
                            className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-church-200 transition text-left group flex items-center"
                        >
                            <div className="p-3 bg-church-50 text-church-600 rounded-lg mr-4 group-hover:bg-church-100 transition-colors">
                                <FolderOpen size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg group-hover:text-church-700 transition-colors">{dept}</h3>
                                <p className="text-xs text-slate-500 mt-1">View Teacher Records</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="py-12 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-serif font-bold text-church-900 mb-4">{t.archives.title}</h1>
                    <p className="text-slate-600 max-w-2xl mx-auto">{t.archives.subtitle}</p>
                </div>

                {/* Database Index Warning for Admins */}
                {isAdmin && missingIndexUrl && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center">
                            <div className="bg-yellow-100 p-2 rounded-full mr-3">
                                <AlertTriangle className="text-yellow-700" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Database Index Required</h3>
                                <p className="text-xs mt-1 max-w-xl">
                                    To optimize sorting for this category, Firestore requires a composite index. 
                                    Please click the button to create it automatically. 
                                    <span className="font-bold text-yellow-900 block mt-1">Your data is currently visible using a client-side fallback.</span>
                                </p>
                            </div>
                        </div>
                        <a 
                            href={missingIndexUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-yellow-600 text-white text-xs font-bold rounded-lg hover:bg-yellow-700 transition shadow-sm whitespace-nowrap flex items-center"
                        >
                            Create Index <ExternalLink size={12} className="ml-1" />
                        </a>
                    </div>
                )}

                {/* Main Category Filters */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                        {categories.map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                                    selectedCategory === cat 
                                    ? 'bg-church-600 text-white' 
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-grow md:flex-grow-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search archives..." 
                                className="w-full md:w-64 pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-church-500 focus:border-transparent outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {isAdmin && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleAddNew}
                                    className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 shadow-sm transition whitespace-nowrap"
                                >
                                    <Plus size={18} className="mr-2" /> {t.archives.add}
                                </button>
                                {/* Only show specific seed button based on selected sub-category */}
                                {selectedCategory === 'Rawngbawltu te' && selectedSubCategory !== 'All' && selectedSubCategory !== 'Sunday School Teachers' && (
                                    <button 
                                        onClick={() => {
                                            switch(selectedSubCategory) {
                                                case 'Executive Body': handleSeedExecutiveBody(); break;
                                                case 'Ramthar': handleSeedRamthar(); break;
                                                case 'BUILDING': handleSeedBuilding(); break;
                                                case 'SOCIAL FRONT': handleSeedSocialFront(); break;
                                                case 'REFRESHMENT': handleSeedRefreshment(); break;
                                                case 'KRISTIAN CHHUNGKUA': handleSeedKristianChhungkua(); break;
                                                case 'WORSHIP': handleSeedWorship(); break;
                                                case 'MASIHI SANGATI': handleSeedMasihiSangati(); break;
                                                case 'RECEPTION, USHERING & DECORATION': handleSeedReceptionUsheringDecoration(); break;
                                                case 'ARCHIVE & LIBRARY': handleSeedArchiveLibrary(); break;
                                                case 'MUSIC': handleSeedMusic(); break;
                                                case 'LIGHT & SOUND': handleSeedLightSound(); break;
                                                case 'FINANCE': handleSeedFinance(); break;
                                                case 'BSI': handleSeedBSI(); break;
                                                case 'KTP': handleSeedKTP(); break;
                                                case 'KOHHRAN HMEICHHIA': handleSeedKohhranHmeichhia(); break;
                                                case 'KOHHRAN PAVALAI PAWL': handleSeedKohhranPavalaiPawl(); break;
                                                default: alert("Seed data not available for this category yet.");
                                            }
                                        }}
                                        disabled={isSaving}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition whitespace-nowrap disabled:opacity-50"
                                        title={`Seed Data for ${selectedSubCategory}`}
                                    >
                                        {isSaving ? <Loader className="animate-spin w-4 h-4" /> : <Database size={18} />}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sub-Category Filters (Only for Rawngbawltu te) */}
                {selectedCategory === 'Rawngbawltu te' && (
                    <div className="mb-8 overflow-hidden">
                        <div className="flex items-center space-x-2 w-full overflow-x-auto pb-4 hide-scrollbar">
                            <button 
                                onClick={() => setSelectedSubCategory('All')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                                    selectedSubCategory === 'All' 
                                    ? 'bg-slate-800 text-white' 
                                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                }`}
                            >
                                All Departments
                            </button>
                            {RAWNGBAWLTU_SUBCATEGORIES.map(sub => (
                                <button 
                                    key={sub}
                                    onClick={() => setSelectedSubCategory(sub)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                                        selectedSubCategory === sub
                                        ? 'bg-slate-800 text-white' 
                                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                    }`}
                                >
                                    {sub}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center py-20"><Loader className="animate-spin text-church-500 w-10 h-10" /></div>
                ) : (
                    // Logic for displaying content based on selection
                    selectedSubCategory === 'Sunday School Teachers' && !activeSSDepartment ? (
                        renderDepartmentGrid()
                    ) : (
                        <div>
                            {activeSSDepartment && (
                                <div className="mb-6 flex items-center">
                                    <button 
                                        onClick={() => setActiveSSDepartment(null)}
                                        className="flex items-center text-slate-500 hover:text-church-600 transition font-medium"
                                    >
                                        <ChevronLeft size={20} className="mr-1" /> Back to Departments
                                    </button>
                                    <span className="mx-3 text-slate-300">|</span>
                                    <h2 className="text-xl font-bold text-slate-800">{activeSSDepartment} Teachers</h2>
                                </div>
                            )}

                            {filteredArchives.length > 0 ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-200">
                                    {filteredArchives.map(entry => {
                                        const Icon = CATEGORY_ICONS[entry.category] || Archive;
                                        const isOfficeBearer = entry.category === 'Rawngbawltu te';

                                        return (
                                            <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition group relative flex flex-col h-full">
                                                {isAdmin && (
                                                    <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                        <button onClick={() => handleEdit(entry)} className="p-1.5 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100"><Edit size={16} /></button>
                                                        <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-red-600 bg-red-50 rounded-full hover:bg-red-100"><Trash size={16} /></button>
                                                    </div>
                                                )}
                                                <div className="flex items-start mb-4">
                                                    <div className="p-3 bg-church-50 text-church-600 rounded-lg mr-4 shrink-0">
                                                        <Icon size={24} />
                                                    </div>
                                                    <div>
                                                        {!isOfficeBearer && (
                                                            <div className="flex flex-wrap gap-2 mb-1">
                                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{entry.category}</span>
                                                                {entry.subCategory && (
                                                                    <span className="text-xs font-bold text-church-600 bg-church-100 px-2 py-0.5 rounded-full">{entry.subCategory}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                        <h3 className="font-bold text-slate-800 text-lg leading-tight">{entry.title}</h3>
                                                        {!isOfficeBearer && <p className="text-xs text-slate-500 mt-1">{entry.date}</p>}
                                                    </div>
                                                </div>
                                                <div className={`text-slate-600 text-sm mb-4 flex-grow whitespace-pre-wrap ${isOfficeBearer ? '' : 'line-clamp-3'}`}>
                                                    {entry.description}
                                                </div>
                                                {entry.link && (
                                                    <a 
                                                        href={entry.link} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center text-sm font-medium text-church-600 hover:text-church-800 mt-auto"
                                                    >
                                                        View Resource <ExternalLink size={14} className="ml-1" />
                                                    </a>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
                                    <Archive className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                    <p className="text-slate-500">{t.archives.empty}</p>
                                </div>
                            )}
                        </div>
                    )
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center bg-church-50 rounded-t-xl">
                            <h3 className="text-xl font-bold text-church-900">{editingEntry.id ? 'Edit Archive' : 'Add New Archive'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                                <input 
                                    className="w-full border border-slate-300 rounded p-2.5" 
                                    value={editingEntry.title || ''} 
                                    onChange={e => setEditingEntry({...editingEntry, title: e.target.value})}
                                    placeholder="e.g., Annual Report 2020"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                                    <input 
                                        type="date"
                                        className="w-full border border-slate-300 rounded p-2.5" 
                                        value={editingEntry.date || ''} 
                                        onChange={e => setEditingEntry({...editingEntry, date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                                    <select 
                                        className="w-full border border-slate-300 rounded p-2.5 bg-white" 
                                        value={editingEntry.category} 
                                        onChange={e => setEditingEntry({...editingEntry, category: e.target.value as any})}
                                    >
                                        {Object.keys(CATEGORY_ICONS).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Sub Category Selection - Only visible for 'Rawngbawltu te' */}
                            {editingEntry.category === 'Rawngbawltu te' && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Sub Category</label>
                                    <select 
                                        className="w-full border border-slate-300 rounded p-2.5 bg-white" 
                                        value={editingEntry.subCategory || ''} 
                                        onChange={e => setEditingEntry({...editingEntry, subCategory: e.target.value})}
                                    >
                                        <option value="" disabled>Select Sub-Category</option>
                                        {RAWNGBAWLTU_SUBCATEGORIES.map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Link (URL)</label>
                                <input 
                                    className="w-full border border-slate-300 rounded p-2.5" 
                                    value={editingEntry.link || ''} 
                                    onChange={e => setEditingEntry({...editingEntry, link: e.target.value})}
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                                <textarea 
                                    className="w-full border border-slate-300 rounded p-2.5 h-32" 
                                    value={editingEntry.description || ''} 
                                    onChange={e => setEditingEntry({...editingEntry, description: e.target.value})}
                                    placeholder="Details about this record..."
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50 rounded-b-xl">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition">Cancel</button>
                            <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 flex items-center transition shadow-sm disabled:opacity-50">
                                {isSaving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={18} className="mr-2" />} Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Archives;

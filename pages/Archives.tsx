
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { ArchiveEntry } from '../types';
import { Archive, FileText, Image, Video, History, File, Plus, Edit, Trash, Search, Loader, ExternalLink, X, Save, AlertTriangle, Users, Database } from 'lucide-react';

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
    'SUNDAY SCHOOL',
    'SUNDAY SCHOOL ZIRTIRTUTE',
    'THUHRILTU',
    'ṬANTU',
    'KOHHRAN HMEICHHIA',
    'KTP',
    'KOHHRAN PAVALAI PAWL'
];

const EXECUTIVE_BODY_SEED_DATA = [
  { year: '1981', details: "Secretary : Pu Saizama Sailo\nAsst. Secretary: Upa Khawidawla\nTreasurer : Pu Zakima\nFin. Secretary : Pu T Sawmpauva" },
  { year: '1982', details: "Secretary : Upa Khawidawla\nAsst. Secretary: Pu Thangchuanga\nFin. Secretary : Pu T Sawmpauva" },
  { year: '1983', details: "Secretary : Pu RD Lalchhuana\nAsst. Secretary: Pu Manhleia\nTreasurer : Pu T Sawmpauva\nFin. Secretary : Pu Thangkhatpianga" },
  { year: '1984', details: "Secretary : Pu RD Lalchhuana\nAsst. Secretary: Pu B Hranghlira\nTreasurer : Pu Thangkhatpianga\nFin. Secretary : Pu T Sawmpauva" },
  { year: '1985', details: "Secretary : Pu RD Lalchhuana\nAsst. Secretary: Upa Manhleia\nTreasurer : Pu Thangkhatpianga\nFin. Secretary : Pu T Sawmpauva" },
  { year: '1986', details: "Secretary : Pu RD Lalchhuana/\nPu Saizama Sailo\nAsst. Secretary: Upa Manhleia\nTreasurer : Pu Thangkhatpianga\nFin. Secretary : Pu T Sawmpauva" },
  { year: '1987', details: "Secretary : Pu Saizama Sailo\nAsst. Secretary: Upa Manhleia\nTreasurer : Pu Thangkhatpianga\nFin. Secretary : Pu T Sawmpauva" },
  { year: '1988', details: "Secretary : Pu Saizama Sailo\nAsst. Secretary: Pu K Vanlalhmuaka\nTreasurer : Pu Thangkhatpianga\nFin. Secretary : Pu T Sawmpauva" },
  { year: '1989', details: "Secretary : Upa K Vanlalhmuaka\nAsst. Secretary: Pu Saizama Sailo\nTreasurer : Upa B Hranghlira (Synod)\n: Pu Thangkhatpianga (Tch)\nFin. Secretary : Pu T Sawmpauva" },
  { year: '1990', details: "Secretary : Upa K Vanlalhmuaka\nAsst. Secretary: Pu Saizama Sailo\nTreasurer : Upa B Hranghlira (Synod)\n: Pu K Lalduha (Tualchhung)\nFin. Secretary : Pu R Khawhluna" },
  { year: '1991', details: "Secretary : Upa K Vanlalhmuaka\nAsst. Secretary: Pu Saizama Sailo\nTreasurer : Upa B Hranghlira (Synod)\n: Pu K Lalduha (Tualchhung)\nFin. Secretary : Pu R Khawhluna" },
  { year: '1992', details: "Secretary : Pu Saizama Sailo\nAsst. Secretary: Upa K Vanlalhmuaka\nTreasurer : Upa B Hranghlira (Synod)\n: Pu K Lalduha (Tualchhung)\nFin. Secretary : Pu R Khawhluna" },
  { year: '1993', details: "Secretary : Upa Saizama Sailo\nAsst. Secretary: Upa Khawidawla\nTreasurer : Upa K Vanlalhmuaka (Synod)\n: Pu K Lalduha (Tualchhung)\nFin. Secretary : Pu R Khawhluna" },
  { year: '1994', details: "Secretary : Upa Saizama Sailo\nAsst. Secretary: Upa B Hranghlira\nTreasurer : Upa K Vanlalhmuaka (Synod)\n: Pu K Lalduha (Tualchhung)\nFin. Secretary : Pu R Khawhluna" },
  { year: '1995', details: "Secretary : Upa B Hranghlira\nAsst. Secretary: Upa HT Vanlalsawma\nTreasurer : Upa K Vanlalhmuaka (Synod)\n: Pu K Lalduha (Tualchhung)\nFin. Secretary : Pu R Khawhluna" },
  { year: '1996', details: "Secretary : Upa HT Vanlalsawma\nAsst. Secretary: Upa B Hranghlira\nTreasurer : Upa Manhleia (Synod)\n: Upa Saizama Sailo (Tch)\nFin. Secretary : Pu R Khawhluna" },
  { year: '1997', details: "Secretary : Upa HT Vanlalsawma\nAsst. Secretary: Upa B Hranghlira\nTreasurer : Upa Manhleia (Synod)\n: Upa Saizama Sailo (Tch)\nFin. Secretary : Pu R Khawhluna" },
  { year: '1998', details: "Secretary : Upa B Hranghlira\nAsst. Secretary: Upa Saizama Sailo\nTreasurer : Upa Manhleia (Synod)\n: Upa Saizama Sailo (Tch)\nFin. Secretary : Pu R Khawhluna" },
  { year: '1999', details: "Secretary : Upa Saizama Sailo\nAsst. Secretary: Upa H Lalmawia\nTreasurer : Upa Manhleia (Synod)\n: Upa HT Vanlalsawma (Tch)\nFin. Secretary : Upa K Vanlalhmuaka" },
  { year: '2000', details: "Secretary : Upa HT Vanlalsawma\nAsst. Secretary: Upa B Hranghlira\nTreasurer : Upa Manhleia (Synod)\n: Upa Saizama Sailo (Tch)\nFin. Secretary : Pu R Khawhluna" },
  { year: '2001', details: "Secretary : Upa K Vanlalhmuaka\nAsst. Secretary: Upa H Lalmawia\nTreasurer : Upa Khawidawla (Synod)\n: Upa HT Vanlalsawma (Tch)\nFin. Secretary : Pu R Khawhluna" },
  { year: '2002', details: "Secretary : Upa K Vanlalhmuaka\nAsst. Secretary: Upa H Lalmawia\nTreasurer : Upa Khawidawla (Synod)\n: Upa HT Vanlalsawma (Tch)\nFin. Secretary : Pu R Khawhluna" },
  { year: '2003', details: "Secretary : Upa H Lalmawia\nAsst. Secretary: Upa HT Vanlalsawma\nTreasurer : Upa Khawidawla (Synod)\n: Upa K Vanlalhmuaka (Tch)\nFin. Secretary : Pu R Khawhluna" },
  { year: '2004', details: "Secretary : Upa H Lalmawia\nAsst. Secretary: Upa HT Vanlalsawma\nTreasurer : Upa Khawidawla (Synod)\n: Upa K Vanlalhmuaka (Tch)\nFin. Secretary : Pu R Khawhluna/\nPu PC Lalhmingliana" },
  { year: '2005', details: "Secretary : Upa HT Vanlalsawma\nAsst. Secretary: Upa H Lalmawia\nTreasurer : Upa Khawidawla (Synod)\n: Upa K Vanlalhmuaka (Tch)\nFin. Secretary : Upa PC Lalhmingliana" },
  { year: '2006', details: "Secretary : Upa HT Vanlalsawma\nAsst. Secretary: Upa H Lalmawia\nTreasurer : Upa B Hranghlira (Synod)\n: Upa K Vanlalhmuaka (Tch)\nFin. Secretary : Upa PC Lalhmingliana" },
  { year: '2007', details: "Secretary : Upa HT Vanlalsawma\nAsst. Secretary: Upa H Lalmawia\nTreasurer : Upa B Hranghlira (Synod)\n: Upa K Vanlalhmuaka (Tch)\nFin. Secretary : Upa PC Lalhmingliana" },
  { year: '2008', details: "Chairman : Rev. TM Thangzaliana\nSecretary : Upa H Lalmawia\nAsst. Secretary: Upa HT Vanlalsawma\nTreasurer : Upa B Hranghlira (Synod)\n: Upa K Vanlalhmuaka (Tch)\nFin. Secretary : Upa PC Lalhmingliana" },
  { year: '2009', details: "Chairman : Rev. C Lalremruata\nSecretary : Upa H Lalmawia\nAsst. Secretary: Upa HT Vanlalsawma\nTreasurer : Upa B Hranghlira (Synod)\n: Upa K Vanlalhmuaka (Tch)\nFin. Secretary : Upa PC Lalhmingliana" },
  { year: '2010', details: "Chairman : Rev. C Lalremruata\nSecretary : Upa HT Vanlalsawma\nAsst. Secretary: Upa PC Lalhmingliana\nTreasurer : Upa H Lalmawia (Synod)\n: Upa K Vanlalhmuaka (Tch)\nFin. Secretary : Upa C Lalrintluanga" },
  { year: '2011', details: "Chairman : Rev. C Lalremruata\nSecretary : Upa HT Vanlalsawma\nAsst. Secretary: Upa PC Lalhmingliana\nTreasurer : Upa H Lalmawia (Synod)\n: Upa K Vanlalhmuaka (Tch)\nFin. Secretary : Upa C Lalrintluanga" },
  { year: '2012', details: "Chairman : Rev. C Lalremruata\nSecretary : Upa PC Lalhmingliana\nAsst. Secretary: Upa C Lalrintluanga\nTreasurer : Upa H Lalmawia (Synod)\n: Upa K Vanlalhmuaka (Tch)\nFin. Secretary : Upa R Lalramhluna" },
  { year: '2013', details: "Chairman : Rev. C Lalremruata\nSecretary : Upa PC Lalhmingliana\nAsst. Secretary: Upa C Lalrintluanga\nTreasurer : Upa H Lalmawia (Synod)\n: Upa K Vanlalhmuaka (Tch)\nFin. Secretary : Upa R Lalramhluna" },
  { year: '2014', details: "Chairman : Rev. H Zathuama\nSecretary : Upa C Lalrintluanga\nAsst. Secretary: Upa PC Lalhmingliana\nTreasurer : Upa H Lalmawia (Synod)\n: Upa K Vanlalhmuaka (Tch)\nFin. Secretary : Upa R Lalramhluna" },
  { year: '2015', details: "Chairman : Rev. H Zathuama\nSecretary : Upa C Lalrintluanga\nAsst. Secretary: Upa R Lalramhluna\nTreasurer : Upa H Lalmawia (Synod)\n: Upa PC Lalhmingliana (Tch)\nFin. Secretary : Upa David Lalchhanhima" },
  { year: '2016', details: "Chairman : Rev. H Zathuama\nSecretary : Upa R Lalramhluna\nAsst. Secretary: Upa C Lalthantluanga\nTreasurer : Upa C Lalrintluanga (Synod)\n: Upa PC Lalhmingliana (Tch)\nFin. Secretary : Upa David Lalchhanhima" },
  { year: '2017', details: "Chairman : Rev. H Zathuama\nSecretary : Upa R Lalramhluna\nAsst. Secretary: Upa C Lalthantluanga\nTreasurer : Upa C Lalrintluanga (Synod)\n: Upa PC Lalhmingliana (Tch)\nFin. Secretary : Upa David Lalchhanhima" },
  { year: '2018', details: "Chairman : Rev. H Zathuama\nSecretary : Upa C Lalthantluanga\nAsst. Secretary: Upa David Lalchhanhima\nTreasurer : Upa C Lalrintluanga (Synod)\n: Upa PC Lalhmingliana (Tch)\nFin. Secretary : Upa HT Lalthlengliana" },
  { year: '2019', details: "Chairman : Rev. F Lalrinawma\nSecretary : Upa David Lalchhanhima\nAsst. Secretary: Upa HT Lalthlengliana\nTreasurer : Upa C Lalrintluanga (Synod)\n: Upa PC Lalhmingliana (Tch)\nFin. Secretary : Upa HT Lalthlengliana" },
  { year: '2020', details: "Chairman : Rev. F Lalrinawma\nSecretary : Upa HT Lalthlengliana\nAsst. Secretary: Upa David Lalchhanhima\nTreasurer : Upa C Lalthantluanga (Synod)\n: Upa PC Lalhmingliana (Tch)\nFin. Secretary : Upa HT Vanlalsawma" },
  { year: '2021', details: "Chairman : Rev. F Lalrinawma\nSecretary : Upa David Lalchhanhima\nAsst. Secretary: Upa HT Lalthlengliana\nTreasurer : Upa C Lalthantluanga (Synod)\n: Upa PC Lalhmingliana (Tch)\nFin. Secretary : Upa HT Vanlalsawma" },
  { year: '2022', details: "Chairman : Rev. F Lalrinawma\nSecretary : Upa HT Lalthlengliana\nAsst. Secretary: Upa David Lalchhanhima\nTreasurer : Upa R Lalramhluna (Synod)\n: Upa PC Lalhmingliana (Tch)\nFin. Secretary : Upa HT Vanlalsawma" },
  { year: '2023', details: "Chairman : Rev. F Lalrinawma/\nRev. Dr. Rualthankhuma\nSecretary : Upa David Lalchhanhima\nAsst. Secretary: Upa H. Zairemmawia\nTreasurer : Upa R Lalramhluna (Synod)\n: Upa PC Lalhmingliana (Tch)\nFin. Secretary : Upa HT Vanlalsawma" },
  { year: '2024', details: "Chairman : Rev. Lalhmingthanga Chhangte\nSecretary : Upa H Zairemmawia\nAsst. Secretary: Upa Lianpianga\nTreasurer : Upa R Lalramhluna (Synod)\n: Upa PC Lalhmingliana (Tch)\nFin. Secretary : Upa HT Vanlalsawma" },
  { year: '2025', details: "Chairman : Rev. Lalhmingthanga Chhangte\nSecretary : Upa H Zairemmawia\nAsst. Secretary: Upa Lianpianga\nTreasurer : Upa R Lalramhluna (Synod)\n: Upa PC Lalhmingliana (Tch)\nFin. Secretary : Upa HT Vanlalsawma" },
];

const RAMTHAR_SEED_DATA = [
  { year: '1987', details: "Chairman : Upa Manhleia\nVice Chairman : Pu B Hranghlira\nSecretary : Pu F Lalramhluna\nAsst. Secretary: Upa Daikhawzama\nTreasurer : Pu Thangliankhama\nFin. Secretary : Pu C Ralkapthanga" },
  { year: '1988', details: "Chairman : Upa Manhleia\nVice Chairman : Pu B Hranghlira\nSecretary : Pu F Lalramhluna\nAsst. Secretary: Upa Daikhawzama\nTreasurer : Pu Thangliankhama\nFin. Secretary : Pu C Ralkapthanga" },
  { year: '1989', details: "Chairman : Upa Manhleia\nVice Chairman : Pu PC Lalhlira\nSecretary : Pu F Lalramhluna\nAsst. Secretary: Pu PC Lalhmingliana\nTreasurer : Pu Thangliankhama\nFin. Secretary : Pu C Ralkapthanga" },
  { year: '1990', details: "Chairman : Upa Khawidawla\nVice Chairman : Pu Thangkhatpianga\nSecretary : Pu RD Lalchhuana\nAsst. Secretary: Pu F Lalramhluna\nTreasurer : Pu K Lalrawna\nFin. Secretary : Pu PC Lalhmingliana" },
  { year: '1991', details: "Chairman : Upa Manhleia\nVice Chairman : Pu Thangkhatpianga\nSecretary : Pu RD Lalchhuana\nAsst. Secretary: Pu R Lalrintluanga\nTreasurer : Pu K Lalrawna\nFin. Secretary : Pu PC Lalhmingliana" },
  { year: '1992', details: "Chairman : Upa Manhleia\nVice Chairman : Pu Thangkhatpianga\nSecretary : Pu RD Lalchhuana\nAsst. Secretary: Pu Thangliankhama\nTreasurer : Pu K Lalrawna\nFin. Secretary : Pu PC Lalhmingliana" },
  { year: '1993', details: "Chairman : Upa B Hranghlira\nVice Chairman : Upa Daikhawzama\nSecretary : Pu RD Lalchhuana\nAsst. Secretary: Tv. Zohmangaiha\nTreasurer : Pu C Hrangluia/\nPu C Lalparliana\nFin. Secretary : Pu Thangliankhama" },
  { year: '1994', details: "Chairman : Upa B Hranghlira\nVice Chairman : Upa Daikhawzama\nSecretary : Pu PC Lalhmingliana\nAsst. Secretary: Pu R Lalramhluna\nTreasurer : Pu C Lalparliana\nFin. Secretary : Pu R Lalrintluanga" },
  { year: '1995', details: "Chairman : Upa Saizama Sailo\nVice Chairman : Pu K Lalduha\nSecretary : Pu K Lalduata\nAsst. Secretary: Pu PC Lalhmingliana\nTreasurer : Pu C Lalparliana\nFin. Secretary : Upa Daikhawzama" },
  { year: '1996', details: "Chairman : Upa Saizama Sailo\nVice Chairman : Pu H Huliana\nSecretary : Pu K Lalduata\nAsst. Secretary: Pu R Lalrintluanga\nTreasurer : Pu C Lalparliana\nFin. Secretary : Pu Laltanpuia" },
  { year: '1997', details: "Chairman : Upa B Hranghlira\nVice Chairman : Upa Daikhawzama\nSecretary : Pu Laltanpuia\nAsst. Secretary: Pu R Lalhmangaiha\nTreasurer : Pu F Lalbuatsaiha\nFin. Secretary : Pu K Lalduata" },
  { year: '1998', details: "Chairman : Upa Daikhawzama\nVice Chairman : Pu K Lalduata\nSecretary : Pu R Lalhmangaiha\nAsst. Secretary: Pu Laltanpuia\nTreasurer : Pu B Biakvela\nFin. Secretary : Pu F Lalbuatsaiha" },
  { year: '1999', details: "Chairman : Pu R Khawhluna\nVice Chairman : Upa Daikhawzama\nSecretary : Pu R Lalhmangaiha\nAsst. Secretary: Pu B Biakvela\nTreasurer : Pu R Lalremmawia\nFin. Secretary : Pu F Lalbuatsaiha" },
  { year: '2000', details: "Chairman : Upa Daikhawzama\nVice Chairman : Pu R Khawhluna\nSecretary : Pu R Lalhmangaiha\nAsst. Secretary: Pu C Lalthantluanga\nTreasurer : Pu R Lalremmawia\nFin. Secretary : Pu F Lalbuatsaiha" },
  { year: '2001', details: "Chairman : Pu R Khawhluna\nVice Chairman : Upa Daikhawzama\nSecretary : Pu F Lalbuatsaiha\nAsst. Secretary: Pu Lalrozama\nTreasurer : Pu R Lalremmawia\nFin. Secretary : Pu R Lalhmangaiha" },
  { year: '2002', details: "Chairman : Pu PC Lalhmingliana\nVice Chairman : Upa Khawidawla\nSecretary : Pu F Lalbuatsaiha\nAsst. Secretary: Pu Vanlalhriata\nTreasurer : Pu R Lalremmawia\nFin. Secretary : Pu R Lalhmangaiha" },
  { year: '2003', details: "Chairman : Pu PC Lalhmingliana\nVice Chairman : Upa Saizama Sailo\nSecretary : Pu B Biakvela\nAsst. Secretary: Pu Rochungnunga\nTreasurer : Pu R Lalremmawia\nFin. Secretary : Pu R Lalhmangaiha" },
  { year: '2004', details: "Chairman : Upa Saizama Sailo\nVice Chairman : Pu PC Lalhmingliana\nSecretary : Pu B Biakvela/\nPu Rochungnunga\nAsst. Secretary: Pu Rochungnunga/\nPu Vanlalhriata\nTreasurer : Pu R Lalremmawia\nFin. Secretary : Pu C Roliana/\nPu Laltanpuia" },
  { year: '2005', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Upa Khawidawla\nSecretary : Pu C Lalthantluanga\nAsst. Secretary: Pu H Zakima\nTreasurer : Pu R Lalremmawia\nFin. Secretary : Pu Laltanpuia" },
  { year: '2006', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Upa PC Lalhmingliana\nSecretary : Pu H Zakima\nAsst. Secretary: Pu C Lalthantluanga\nTreasurer : Pu R Lalremmawia\nFin. Secretary : Pu F Lalbuatsaiha" },
  { year: '2007', details: "Chairman : Pu C Roliana\nVice Chairman : Upa B Hranghlira\nSecretary : Pu David Lalchhanhima\nAsst. Secretary: Pu C Lalthantluanga\nTreasurer : Pu R Lalremmawia\nFin. Secretary : Pu F Lalbuatsaiha" },
  { year: '2008', details: "Chairman : T.Upa C Roliana\nVice Chairman : T.Upa R Lalramhluna\nSecretary : Pu H Zakima\nAsst. Secretary: Pu C Lalthantluanga\nTreasurer : Pu R Lalremmawia\nFin. Secretary : Pu F Lalbuatsaiha" },
  { year: '2009', details: "Chairman : T.Upa C Roliana\nVice Chairman : T.Upa R Lalramhluna\nSecretary : Pu H Zakima\nAsst. Secretary: Pu C Lalthantluanga\nTreasurer : Pu R Lalremmawia\nFin. Secretary : Pu F Lalbuatsaiha" },
  { year: '2010', details: "Chairman : Upa R Lalramhluna\nVice Chairman : Upa B Hranghlira\nSecretary : Pu K Lalrinawma\nAsst. Secretary: Pu Lalniliana\nTreasurer : Pu R Lalremmawia\nFin. Secretary : Pu HT Lalthlengliana" },
  { year: '2011', details: "Chairman : Upa R Lalramhluna\nVice Chairman : Upa B Hranghlira\nSecretary : Pu K Lalrinawma\nAsst. Secretary: Pu Lalniliana\nTreasurer : Pu R Lalremmawia\nFin. Secretary : Pu HT Lalthlengliana" },
  { year: '2012', details: "Chairman : Upa HT Vanlalsawma\nVice Chairman : Pu R Lalremmawia\nSecretary : Pu K Lalrinawma\nAsst. Secretary: Pu P Lalhmingthanga\nTreasurer : Pu Vanlalhriata\nFin. Secretary : Pu C Ramrinliana" },
  { year: '2013', details: "Chairman : Upa HT Vanlalsawma\nVice Chairman : Pu R Lalremmawia\nSecretary : Pu K Lalrinawma\nAsst. Secretary: Pu P Lalhmingthanga\nTreasurer : Pu Vanlalhriata\nFin. Secretary : Pu C Ramrinliana" },
  { year: '2014', details: "Chairman : Upa PC Lalhmingliana\nVice Chairman : Pu R Lalremmawia\nSecretary : Pu C Ramrinliana\nAsst. Secretary: Pu Lalramthara\nTreasurer : Pu Vanlalhriata\nFin. Secretary : Pu K Lalrinawma/\nPu H Zairemmawia" },
  { year: '2015', details: "Chairman : T.Upa C Roliana\nVice Chairman : Pu R Lalremmawia\nSecretary : Pu H Zairemmawia\nAsst. Secretary: Pu Lalramthara\nTreasurer : Pu C Rohmingliana\nFin. Secretary : Pu L Khenpauva" },
  { year: '2016', details: "Chairman : Upa B Hranghlira\nVice Chairman : T.Upa C Roliana\nSecretary : Pu H Zairemmawia\nAsst. Secretary: Pu Lalramthara\nTreasurer : Upa PC Lalhmingliana\nFin. Secretary : Upa David Lalchhanhima" },
  { year: '2017', details: "Chairman : Upa Daikhawzama\nVice Chairman : T.Upa C Roliana\nSecretary : Pu H Zairemmawia\nAsst. Secretary: Pu Dawngsuanpauva\nTreasurer : Pu C Rohmingliana\nFin. Secretary : Upa PC Lalhmingliana" },
  { year: '2018', details: "Chairman : Upa H Lalmawia\nVice Chairman : Pu H Zairemmawia\nSecretary : Pu Lalramthara\nAsst. Secretary: Pu Dawngsuanpauva\nTreasurer : Upa PC Lalhmingliana\nFin. Secretary : Upa HT Lalthlengliana\n: Pu C Rohmingliana\n(i/c Collection)" },
  { year: '2019', details: "Chairman : Upa H Lalmawia\nVice Chairman : Pu H Zairemmawia\nSecretary : Pu Lalramthara\nAsst. Secretary: Pu C Zaithanga\nTreasurer : Pu Dawngsuanpauva\nFin. Secretary : Pu C Rohmingliana" },
  { year: '2020', details: "Chairman : Upa C Lalthantluanga\nVice Chairman : T.Upa H Zairemmawia\nSecretary : Pu Lalramthara\nAsst. Secretary: Pu C Lalmuansanga\nTreasurer : Pu Dawngsuanpauva\nFin. Secretary : Pu C Rohmingliana" },
  { year: '2021', details: "Chairman : Upa C Lalthantluanga\nVice Chairman : T.Upa H Zairemmawia\nSecretary : Pu Lalramthara\nAsst. Secretary: Pu C Lalmuansanga\nTreasurer : Pu Dawngsuanpauva\nFin. Secretary : Pu C Rohmingliana" },
  { year: '2022', details: "Chairman : Upa R Lalramhluna\nVice Chairman : T.Upa H Zairemmawia\nSecretary : Pu C Lalmuansanga\nAsst. Secretary: Pu Lalramthara\nTreasurer : Pu Dawngsuanpauva\nFin. Secretary : Pu C Rohmingliana" },
  { year: '2023', details: "Chairman : Upa R Lalramhluna\nVice Chairman : Upa Daikhawzama\nSecretary : Pu C Lalmuansanga\nAsst. Secretary: Pu K Lalengthanga\nTreasurer : Pu C Rohmingliana\nFin. Secretary : Pu Dawngsuanpauva" },
  { year: '2024', details: "Chairman : Upa C Zohmingthanga\nVice Chairman : Upa C Lalthantluanga\nSecretary : Pu Dawngsuanpauva\nAsst. Secretary: Pu K Lalengthanga\nTreasurer : Pu C Rohmingliana\nFin. Secretary : Pu C Lalrawngbawla" },
  { year: '2025', details: "Chairman : Upa C Zohmingthanga\nVice Chairman : Pu H Vanlalthanga\nSecretary : Pu Dawngsuanpauva\nAsst. Secretary: Pu K Lalengthanga\nTreasurer : Pu C Rohmingliana\nFin. Secretary : Pu C Lalrawngbawla" },
];

const FINANCE_SEED_DATA = [
  { year: '2006', details: "Chairman : Upa H Lalmawia\nSecretary : Upa PC Lalhmingliana" },
  { year: '2007', details: "Chairman : P/P Thanhnuna\nVice Chairman : Upa PC Lalhmingliana\nSecretary : Pu C Lalrintluanga\nAsst. Secretary: Pu H Zakima" },
  { year: '2008', details: "Chairman : Upa PC Lalhmingliana\nVice Chairman : T.Upa R Lalramhluna\nSecretary : T.Upa C Lalrintluanga\nAsst. Secretary: Pu H Zakima" },
  { year: '2009', details: "Chairman : Upa PC Lalhmingliana\nVice Chairman : T.Upa R Lalramhluna\nSecretary : T.Upa C Lalrintluanga\nAsst. Secretary: Pu H Zakima" },
  { year: '2010', details: "Chairman : Upa C Lalrintluanga\nVice Chairman : Upa HT Vanlalsawma\nSecretary : Pu David Lalchhanhima\nAsst. Secretary: Pu H Vanlalthanga" },
  { year: '2011', details: "Chairman : Upa C Lalrintluanga\nVice Chairman : Upa HT Vanlalsawma\nSecretary : Pu David Lalchhanhima\nAsst. Secretary: Pu H Vanlalthanga" },
  { year: '2012', details: "Chairman : Upa R Lalramhluna\nVice Chairman : Upa HT Vanlalsawma\nSecretary : T.Upa David Lalchhanhima\nAsst. Secretary: Pu H Vanlalthanga" },
  { year: '2013', details: "Chairman : Upa R Lalramhluna\nVice Chairman : Upa HT Vanlalsawma\nSecretary : T.Upa David Lalchhanhima\nAsst. Secretary: Pu H Vanlalthanga" },
  { year: '2014', details: "Chairman : Upa R Lalramhluna\nVice Chairman : T.Upa C Roliana\nSecretary : Pu H Vanlalthanga\nAsst. Secretary: Pu Lianpianga" },
  { year: '2015', details: "Chairman : Upa David Lalchhanhima\nVice Chairman : Upa K Vanlalhmuaka\nSecretary : Pu H Vanlalthanga\nAsst. Secretary: Pu Lianpianga" },
  { year: '2016', details: "Chairman : Upa David Lalchhanhima\nVice Chairman : Upa K Vanlalhmuaka\nSecretary : Pu H Vanlalthanga\nAsst. Secretary: Pu Lianpianga\n: Pu C Ramrinliana" },
  { year: '2017', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Upa H Lalmawia\nSecretary : Pu Lianpianga\nAsst. Secretary: Pu C Ramrinliana\n: Pu Lalbiakkunga Pachuau" },
  { year: '2018', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Upa H Lalmawia\nSecretary : Pu Lianpianga\nAsst. Secretary: Pu C Ramrinliana\n: Pu Lalbiakkunga Pachuau" },
  { year: '2019', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Upa H Lalmawia\nSecretary : Pu Lianpianga\nAsst. Secretary: Pu C Ramrinliana\n: Pu Lalramthara" },
  { year: '2020', details: "Chairman : Upa H Lalmawia\nVice Chairman : Upa K Vanlalhmuaka\nSecretary : Pu Lianpianga\nAsst. Secretary: Pu C Ramrinliana\n: Pu Lalmuanpuia Ralte" },
  { year: '2021', details: "Chairman : Upa H Lalmawia\nVice Chairman : Upa K Vanlalhmuaka\nSecretary : Pu Lianpianga\nAsst. Secretary: Pu C Ramrinliana\n: Pu Lalmuanpuia Ralte" },
  { year: '2022', details: "Chairman : Upa C Lalrintluanga\nVice Chairman : Upa H Lalmawia\nSecretary : Pu Lianpianga /\nPu C Ramrinliana\nAsst. Secretary: Pu Lalmuanpuia Ralte\n: Pu R Lalmalsawma" },
  { year: '2023', details: "Chairman : Upa C Lalrintluanga\nVice Chairman : Upa H Lalmawia\nSecretary : Pu C Ramrinliana\nAsst. Secretary: Pu Lalmuanpuia Ralte\n: Pu C Lalmuansanga" },
  { year: '2024', details: "Chairman : Upa C Lalrintluanga\nVice Chairman : Upa H Lalmawia\nSecretary : Pu Lalmuanpuia Ralte\nAsst. Secretary: Pu C Lalmuansanga\n: Pu R Lalmalsawma" },
  { year: '2025', details: "Chairman : Upa C Lalthantluanga\nVice Chairman : Upa H Lalmawia\nSecretary : Pu Lalmuanpuia Ralte\nAsst. Secretary: Pu C Lalmuansanga\n: Pu R Lalmalsawma" },
];

const BUILDING_SEED_DATA = [
  { year: '1981', details: "Chairman : Pu Thangchuanga\nSecretary : Upa Khawidawla\nTreasurer : Pu PC Lalhlira" },
  { year: '1982', details: "Chairman : Pu Thangchuanga\nSecretary : Upa Khawidawla\nTreasurer : Pu H Huliana" },
  { year: '1983', details: "Chairman : Pu Thangchuanga\nVice Chairman : Pu Manhleia\nSecretary : Upa Khawidawla\nTreasurer : Pu H Huliana" },
  { year: '1984', details: "Chairman : Upa Manhleia\nVice Chairman : Pu PC Lalhlira\nSecretary : Pu B Hranghlira\nAsst. Secretary: Pu K Vanlalhmuaka\nTreasurer : Pu PT Vunga\nFin. Secretary : Pu Saizama Sailo" },
  { year: '1985', details: "Chairman : Pu Thangchuanga\nVice Chairman : Upa Manhleia\nSecretary : Pu R Khawhluna\nAsst. Secretary: Pu K Vanlalhmuaka\nTreasurer : Pu PT Vunga\nFin. Secretary : Pu F Lalramhluna" },
  { year: '1986', details: "Chairman : Pu Thangchuanga/\nPu R Khawhluna\nVice Chairman : Pu PC Lalhlira\nSecretary : Pu R Khawhluna/\nPu RD Lalchhuana\nAsst. Secretary: Pu Saizama Sailo/\nUpa Daikhawzama\nTreasurer : Pu Lalduha\nFin. Secretary : Pu K Vanlalhmuaka" },
  { year: '1987', details: "Chairman : Pu Khuangbuaia\nVice Chairman : Pu T Sawmpauva\nSecretary : Pu K Vanlalhmuaka\nAsst. Secretary: Pu Saizama Sailo\nTreasurer : Pu C Lalrintluanga\nFin. Secretary : Pu RD Lalchhuana" },
  { year: '1988', details: "Chairman : Pu T Sawmpauva\nVice Chairman : Pu Khuangbuaia\nSecretary : Pu K Vanlalhmuaka\nAsst. Secretary: Tv. Biakmawia\nTreasurer : Pu Thanhluma\nFin. Secretary : Pu Saibuanga" },
  { year: '1989', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu T Sawmpauva\nSecretary : Pu RD Lalchhuana\nAsst. Secretary: Tv. F Lalbiakmawia\nTreasurer : Pu Thanhluma\nFin. Secretary : Pu Saibuanga" },
  { year: '1990', details: "Chairman : Pu C Khuangbuaia\nVice Chairman : Upa Zadala\nSecretary : Pu HT Vanlalsawma\nAsst. Secretary: Pu C Lalparliana\nTreasurer : Pu PC Thanhluma\nFin. Secretary : Upa Daikhawzama" },
  { year: '1991', details: "Chairman : Pu C Khuangbuaia\nVice Chairman : Pu T Sawmpauva\nSecretary : Pu HT Vanlalsawma\nAsst. Secretary: Pu K Lalduata\nTreasurer : Pu PC Thanhluma\nFin. Secretary : Upa Daikhawzama" },
  { year: '1992', details: "(Centenary Committee rin nghal a ni)\nChairman : Pu R Khawhluna\nVice Chairman : Pu C Khuangbuaia\nSecretary : Pu C Lalrintluanga\nAsst. Secretary: Pu C Lalparliana\n: Pu H Kap\\hianga\nTreasurer : Upa Manhleia\nFin. Secretary : Pu C Hmingliana" },
  { year: '1993', details: "(Centenary Committee rin nghal a ni)\nChairman : Pu R Khawhluna\nVice Chairman : Pu C Khuangbuaia\nSecretary : Pu C Lalrintluanga\nAsst. Secretary: Pu C Lalparliana\n: Pu H Kap\\hianga\nTreasurer : Upa Manhleia\nFin. Secretary : Pu C Hmingliana" },
  { year: '1994', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Pu C Khuangbuaia\nSecretary : Pu HT Vanlalsawma\nAsst. Secretary: Pu C Lalrintluanga\nTreasurer : Pu H Kap\\hianga\nFin. Secretary : Pu R Vanhnuaithanga" },
  { year: '1995', details: "Chairman : Pu C Khuangbuaia\nVice Chairman : Upa K Vanlalhmuaka\nSecretary : Pu R Vanhnuaithanga\nAsst. Secretary: Upa HT Vanlalsawma\nTreasurer : Pu H Kap\\hianga\nFin. Secretary : Pu C Lalrintluanga" },
  { year: '1996', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Pu C Khuangbuaia\nSecretary : Pu R Vanhnuaithanga\nAsst. Secretary: Pu RD Lalchhuana\nTreasurer : Pu H Kap\\hianga\nFin. Secretary : Pu C Lalrintluanga" },
  { year: '1997', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Pu C Khuangbuaia\nSecretary : Pu RD Lalchhuana\nAsst. Secretary: Pu K Lalrawna\nTreasurer : Pu PC Lalhmingliana\nFin. Secretary : Pu C Lalrintluanga" },
  { year: '1998', details: "Chairman : Upa HT Vanlalsawma\nVice Chairman : Upa K Vanlalhmuaka\nSecretary : Pu RD Lalchhuana\nAsst. Secretary: Pu R Vanhnuaithanga\nTreasurer : Pu H Zakima\nFin. Secretary : Pu PC Lalhmingliana" },
  { year: '1999', details: "Chairman : Upa B Hranghlira\nVice Chairman : Upa HT Vanlalsawma\nSecretary : Pu H Zakima\nAsst. Secretary: Pu C Lalthantluanga\nTreasurer : Pu K Lalduata\nFin. Secretary : Pu PC Lalhmingliana" },
  { year: '2000', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Upa Saizama Sailo\nSecretary : Pu H Zakima\nAsst. Secretary: Pu R Lalramhluna\nTreasurer : Pu C Lalrintluanga\nFin. Secretary : Pu PC Lalhmingliana" },
  { year: '2001', details: "Chairman : Upa Saizama Sailo\nVice Chairman : Pu R Khawhluna\nSecretary : Pu C Lalrintluanga\nAsst. Secretary: Pu H Zakima\nTreasurer : Pu K Lalduata\nFin. Secretary : Pu R Lalramhluna" },
  { year: '2002', details: "Chairman : Upa HT Vanlalsawma\nVice Chairman : Pu R Khawhluna\nSecretary : Pu C Lalrintluanga\nAsst. Secretary: Pu K |huamluaia\nTreasurer : Pu H Zakima\nFin. Secretary : Pu R Lalramhluna" },
  { year: '2003', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Upa HT Vanlalsawma\nSecretary : Pu R Lalramhluna\nAsst. Secretary: Pu K |huamluaia\nTreasurer : Pu C Lalrintluanga\nFin. Secretary : Pu Lal\\anpuia" },
  { year: '2004', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Upa HT Vanlalsawma\nSecretary : Pu R Lalramhluna\nAsst. Secretary: Pu K |huamluaia\nTreasurer : Pu C Lalrintluanga\nFin. Secretary : Pu K Lalduata" },
  { year: '2005', details: "Chairman : Upa H Lalmawia\nVice Chairman : Pu C Roliana\nSecretary : Pu K |huamluaia\nAsst. Secretary: Pu R Lalramhluna\nTreasurer : Pu C Rohmingliana\nFin. Secretary : Pu Dawngsuanpauva" },
  { year: '2006', details: "Chairman : Upa H Lalmawia\nVice Chairman : Pu C Roliana\nSecretary : Pu K |huamluaia\nAsst. Secretary: Pu R Lalramhluna\nTreasurer : Pu C Rohmingliana\nFin. Secretary : Pu Dawngsuanpauva" },
  { year: '2007', details: "Chairman : Upa H Lalmawia\nVice Chairman : Upa HT Vanlalsawma\nSecretary : Pu K |huamluaia\nAsst. Secretary: Pu R Lalramhluna\nTreasurer : Pu C Rohmingliana\nFin. Secretary : Pu Dawngsuanpauva" },
  { year: '2008', details: "Chairman : Upa HT Vanlalsawma\nVice Chairman : Upa H Lalmawia\nSecretary : Pu K |huamluaia\nAsst. Secretary: Pu David Lalchhanhima\nTreasurer : Pu C Rohmingliana\nFin. Secretary : Pu Dawngsuanpauva" },
  { year: '2009', details: "Chairman : Upa HT Vanlalsawma\nVice Chairman : Upa H Lalmawia\nSecretary : Pu K |huamluaia\nAsst. Secretary: Pu David Lalchhanhima\nTreasurer : Pu C Rohmingliana\nFin. Secretary : Pu Dawngsuanpauva" },
  { year: '2010', details: "Chairman : Upa H Lalmawia\nVice Chairman : Upa PC Lalhmingliana\nSecretary : Pu K |huamluaia\nAsst. Secretary: Pu C Zokhuma\nTreasurer : Pu C Rohmingliana\nFin. Secretary : Pu Dawngsuanpauva" },
  { year: '2011', details: "Chairman : Upa PC Lalhmingliana\nVice Chairman : Upa H Lalmawia\nSecretary : Pu K |huamluaia\nAsst. Secretary: Pu C Zokhuma\nTreasurer : Pu C Rohmingliana\nFin. Secretary : Pu Dawngsuanpauva" },
  { year: '2012', details: "Chairman : Upa H Lalmawia\nVice Chairman : Upa C Lalrintluanga\nSecretary : Pu K |huamluaia\nAsst. Secretary: Pu J Lalnuntluanga\nTreasurer : Pu C Rohmingliana\nFin. Secretary : Pu Dawngsuanpauva" },
  { year: '2013', details: "Chairman : Upa H Lalmawia\nVice Chairman : Upa C Lalrintluanga\nSecretary : Pu K |huamluaia\nAsst. Secretary: Pu J Lalnuntluanga\nTreasurer : Pu C Rohmingliana\nFin. Secretary : Pu Dawngsuanpauva" },
  { year: '2014', details: "Chairman : Upa H Lalmawia\nVice Chairman : Upa HT Vanlalsawma\nSecretary : Pu Dawngsuanpauva\nAsst. Secretary: Pu C Zohmingthanga\nTreasurer : Pu K |huamluaia\nFin. Secretary : Pu C Rohmingliana" },
  { year: '2015', details: "Chairman : Upa H Lalmawia\nVice Chairman : Upa PC Lalhmingliana\nSecretary : Pu Dawngsuanpauva\nAsst. Secretary: Pu K Lalrawna\nTreasurer : Pu C Zohmingthanga\nFin. Secretary : Pu T Sangtluanga" },
  { year: '2016', details: "Chairman : Upa C Lalrintluanga\nVice Chairman : Upa H Lalmawia\nSecretary : Pu Dawngsuanpauva\nAsst. Secretary: Pu T Sangtluanga\nTreasurer : Pu PC Lalhmingliana\nFin. Secretary : Upa David Lalchhanhima" },
  { year: '2017', details: "Chairman : Upa HT Vanlalsawma\nVice Chairman : Upa H Lalmawia\nSecretary : Pu T Sangtluanga\nAsst. Secretary: Pu Lalramthara\nTreasurer : Pu Lalsanglura Zote\nFin. Secretary : Upa PC Lalhmingliana" },
  { year: '2018', details: "Chairman : Upa HT Vanlalsawma\nVice Chairman : Upa David Lalchhanhima\nSecretary : Pu T Sangtluanga\nAsst. Secretary: Pu H Vanlalthanga\nTreasurer : Pu PC Lalhmingliana\nFin. Secretary : Upa HT Lalthlengliana\n: Pu Lalsanglura Zote (Coll)" },
  { year: '2019', details: "Chairman : Upa HT Vanlalsawma\nVice Chairman : Upa PC Lalhmingliana\nSecretary : Pu T Sangtluanga\nAsst. Secretary: Pu K Lalbiakhlira\nTreasurer : Pu H Vanlalthanga\nFin. Secretary : Pu Lalsanglura Zote" },
  { year: '2020', details: "Chairman : Upa HT Vanlalsawma\nVice Chairman : Upa PC Lalhmingliana\nSecretary : Pu Lalsanglura Zote\nAsst. Secretary: Pu K Lalbiakhlira\nTreasurer : Pu H Vanlalthanga\nFin. Secretary : Pu T Sangtluanga" },
  { year: '2021', details: "Chairman : Upa HT Vanlalsawma\nVice Chairman : Upa PC Lalhmingliana\nSecretary : Pu Lalsanglura Zote\nAsst. Secretary: Pu K Lalbiakhlira\nTreasurer : Pu H Vanlalthanga\nFin. Secretary : Pu T Sangtluanga" },
  { year: '2022', details: "Chairman : Upa C Lalthantluanga\nVice Chairman : Upa David Lalchhanhima\nSecretary : Pu Lalsanglura Zote\nAsst. Secretary: Pu K Lalbiakhlira\nTreasurer : Pu H Vanlalthanga\nFin. Secretary : Pu T Sangtluanga" },
  { year: '2023', details: "Chairman : Upa C Lalthantluanga\nVice Chairman : Upa H Zairemmawia\nSecretary : Pu Lalsanglura Zote\nAsst. Secretary: Pu K Lalbiakhlira\nTreasurer : Pu H Vanlalthanga\nFin. Secretary : Pu T Sangtluanga" },
  { year: '2024', details: "Chairman : Upa David Lalchhanhima\nVice Chairman : Upa H Lalmawia\nSecretary : Pu F Lalhriatpuia\nAsst. Secretary: Tv. HT Lalrinsanga\nTreasurer : Pu T Sangtluanga\nFin. Secretary : Pu Lalsanglura Zote" },
  { year: '2025', details: "Chairman : Upa H Lalmawia\nVice Chairman : Upa David Lalchhanhima\nSecretary : Pu F Lalhriatpuia\nAsst. Secretary: Pu HT Lalrinsanga\nTreasurer : Pu T Sangtluanga\nFin. Secretary : Pu Lalsanglura Zote" },
];

const SOCIAL_FRONT_SEED_DATA = [
  { year: '1990', details: "Chairman : Upa Manhleia\nVice Chairman : Pu Saizama Sailo\nSecretary : Pu C Zolawma\nAsst. Secretary: Pi PC Lalhmachhuani\nTreasurer : Pu Thangngolanga\nFin. Secretary : Pu R Lalramhluna" },
  { year: '1991', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Pu C Lalramliana\nSecretary : Pu H Kapthianga\nAsst. Secretary: Pu Lalthangpuia Sailo\nTreasurer : Pu Thangngolanga\nFin. Secretary : Pu F Lalramhluna" },
  { year: '1992', details: "Chairman : Upa Daikhawzama\nVice Chairman : Upa B Hranghlira\nSecretary : Pu R Vanhnuaithanga\nAsst. Secretary: Pu HT Vanlalsawma\nTreasurer : Pu Thangngolanga\nFin. Secretary : Pu K Lalduata" },
  { year: '1993', details: "Chairman : Pu C Khuangbuaia\nVice Chairman : Pu Thangkhatpianga\nSecretary : Pu R Vanhnuaithanga\nAsst. Secretary: Pu HT Vanlalsawma\nTreasurer : Pu Thangngolanga\nFin. Secretary : Pu K Lalduata" },
  { year: '1994', details: "Chairman : Upa Manhleia\nVice Chairman : Upa B Hranghlira\nSecretary : Pu R Vanhnuaithanga\nAsst. Secretary: Pu R Lalramhluna\nTreasurer : Pu Thangngolanga\nFin. Secretary : Pu K Lalduata" },
  { year: '1995', details: "Chairman : Upa Khawidawla\nVice Chairman : Pu FC Lalramliana\nSecretary : Pu C Lalrintluanga\nAsst. Secretary: Upa Daikhawzama\nTreasurer : Pu Thangngolanga\nFin. Secretary : Pu C Hmingliana" },
  { year: '1996', details: "Chairman : Upa B Hranghlira\nVice Chairman : Upa Khawidawla\nSecretary : Pu PC Lalhmingliana\nAsst. Secretary: Pu H Zakima\nTreasurer : Pu Thangngolanga\nFin. Secretary : Pu C Hmingliana" },
  { year: '1997', details: "Chairman : Upa Khawidawla\nVice Chairman : Pu H Huliana\nSecretary : Pu R Vanhnuaithanga\nAsst. Secretary: Pu C Lalparliana\nTreasurer : Pu Thangngolanga\nFin. Secretary : Pu C Hmingliana" },
  { year: '1998', details: "Chairman : Pu R Khawhluna\nVice Chairman : Upa Khawidawla\nSecretary : Pu H Vanlalthanga\nAsst. Secretary: Pu K Lalrawna\nTreasurer : Pu C Lalrintluanga\nFin. Secretary : Pu C Hmingliana" },
  { year: '1999', details: "Chairman : Upa Manhleia\nVice Chairman : Pu R Vanhnuaithanga\nSecretary : Pu H Vanlalthanga\nAsst. Secretary: Pu Lalṭanpuia\nTreasurer : Pu T Lalṭanpuia\nFin. Secretary : Pu C Hmingliana" },
  { year: '2000', details: "Chairman : Upa Manhleia\nVice Chairman : Pu R Vanhnuaithanga\nSecretary : Pu H Vanlalthanga\nAsst. Secretary: Pu T Lalṭanpuia\nTreasurer : Pu C Lalfaka\nFin. Secretary : Pu C Hmingliana" },
  { year: '2001', details: "Chairman : Upa H Lalmawia\nVice Chairman : Pu C Lalfaka\nSecretary : Pu K Lalrawna\nAsst. Secretary: Pu C Hmingliana\nTreasurer : Pu Lallianmawia\nFin. Secretary : Pu K Nunthara" },
  { year: '2002', details: "Chairman : Upa Saizama Sailo\nVice Chairman : Pu C Lalfaka\nSecretary : Pu H Vanlalthanga\nAsst. Secretary: Pu C Hmingliana\nTreasurer : Pu Lallianmawia\nFin. Secretary : Pu C Rochungnunga" },
  { year: '2003', details: "Chairman : Upa Manhleia\nVice Chairman : Pu H Vanlalthanga\nSecretary : Pu K Lalduata\nAsst. Secretary: Pu C Hmingliana\nTreasurer : Pu Lallianmawia\nFin. Secretary : Pu J Laldawngliana" },
  { year: '2004', details: "Chairman : Upa Manhleia\nVice Chairman : Pu C Lalfaka/\nPu PC Thanhluma\nSecretary : Pu H Vanlalthanga\nAsst. Secretary: Pu C Rohmingliana\nTreasurer : Pu Lallianmawia/\nPu T Lalthlengliana\nFin. Secretary : Pu J Laldawngliana" },
  { year: '2005', details: "Chairman : Upa Manhleia\nVice Chairman : Pu C Lalrintluanga\nSecretary : Pu K Lalduata\nAsst. Secretary: Pu K Lalrawna\nTreasurer : Pu T Lalthlengliana\nFin. Secretary : Pu J Laldawngliana" },
  { year: '2006', details: "Chairman : Upa Manhleia\nVice Chairman : Pu C Lalrintluanga\nSecretary : Pu K Lalduata\nAsst. Secretary: Pu F Laldingpuia\nTreasurer : Pu K Lalrawna\nFin. Secretary : Pu J Laldawngliana" },
  { year: '2007', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Pu K Lalduata\nSecretary : Pu Vanlaldika Varte\nAsst. Secretary: Pu F Thangliana\nTreasurer : Pu J Laldawngliana\nFin. Secretary : Pu K Lalduhawma" },
  { year: '2008', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Pu K Lalduata\nSecretary : Pu Vanlaldika Varte\nAsst. Secretary: Pu F Thangliana\nTreasurer : Pu J Laldawngliana\nFin. Secretary : Pu K Lalduhawma" },
  { year: '2009', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Pu K Lalduata\nSecretary : Pu K Lalduhawma\nAsst. Secretary: Pu Vanlaldika Varte\nTreasurer : Pu J Laldawngliana\nFin. Secretary : Pu T Lalṭanpuia" },
  { year: '2010', details: "Chairman : Upa Daikhawzama\nVice Chairman : Pu K Lalduata\nSecretary : Pu K Lalduhawma\nAsst. Secretary: Pu C Rohmingliana\nTreasurer : Pu J Laldawngliana\nFin. Secretary : Pu T Lalṭanpuia" },
  { year: '2011', details: "Chairman : Upa Daikhawzama\nVice Chairman : Pu K Lalduata\nSecretary : Pu K Lalduhawma\nAsst. Secretary: Pu JH Lalrimawia\nTreasurer : Pu J Laldawngliana\nFin. Secretary : Pu T Lalṭanpuia" },
  { year: '2012', details: "Chairman : Upa Daikhawzama\nVice Chairman : Pu K Lalduata\nSecretary : Pu K Lalduhawma\nAsst. Secretary: Pu T Lianzadinga\nTreasurer : Pu J Laldawngliana\nFin. Secretary : Pu T Lalṭanpuia" },
  { year: '2013', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Pu J Laldawngliana\nSecretary : Pu K Lalduhawma\nAsst. Secretary: Pu T Lianzadinga\nTreasurer : Pu K Lalduata\nFin. Secretary : Pu R Lalrintluanga" },
  { year: '2014', details: "Chairman : Upa HT Vanlalsawma\nVice Chairman : Pu J Laldawngliana\nSecretary : Pu T Lianzadinga\nAsst. Secretary: Pu H Zairemmawia\nTreasurer : Pu K Lalduata\nFin. Secretary : Pu F Lalbuatsaiha" },
  { year: '2015', details: "Chairman : Upa R Lalramhluna\nVice Chairman : Pu C Lalfaka\nSecretary : Pu T Lianzadinga\nAsst. Secretary: Pu K Ṭhuamluaia\nTreasurer : Pu C Sangzawna\nFin. Secretary : Pu F Lalbuatsaiha" },
  { year: '2016', details: "Chairman : Upa Daikhawzama\nVice Chairman : Pu C Lalfaka\nSecretary : Pu K Ṭhuamluaia\nAsst. Secretary: Pu T Lianzadinga\nTreasurer : Upa PC Lalhmingliana\nFin. Secretary : Upa David Lalchhanhima" },
  { year: '2017', details: "Chairman : Upa C Lalrintluanga\nVice Chairman : Pu C Lalfaka\nSecretary : Pu K Ṭhuamluaia\nAsst. Secretary: Pu T Lianzadinga\nTreasurer : Upa PC Lalhmingliana\nFin. Secretary : Upa David Lalchhanhima" },
  { year: '2018', details: "Chairman : Upa C Lalrintluanga\nVice Chairman : Pu C Lalfaka\nSecretary : Pu K Ṭhuamluaia\nAsst. Secretary: Pu T Lianzadinga\nTreasurer : Upa PC Lalhmingliana\nFin. Secretary : Upa HT Lalthlengliana" },
  { year: '2019', details: "Chairman : Upa C Lalthantluanga\nVice Chairman : Pu C Lalfaka\nSecretary : Pu K Ṭhuamluaia\nAsst. Secretary: Pu K Lalduata" },
  { year: '2020', details: "Chairman : Upa R Lalramhluna\nVice Chairman : Pu R Lalremmawia\nSecretary : Pu K Lalduata\nAsst. Secretary: Pu K Ṭhuamluaia" },
  { year: '2021', details: "Chairman : Upa R Lalramhluna\nVice Chairman : Pu R Lalremmawia\nSecretary : Pu K Lalduata\nAsst. Secretary: Pu K Ṭhuamluaia" },
  { year: '2022', details: "Chairman : Upa H Lalmawia\nVice Chairman : Pu R Lalremmawia\nSecretary : Pu K Lalduata\nAsst. Secretary: Pu K Ṭhuamluaia" },
  { year: '2023', details: "Chairman : Upa H Lalmawia\nVice Chairman : Pu R Lalremmawia\nSecretary : Pu K Ṭhuamluaia\nAsst. Secretary: Pu JC Laldinthara\nTreasurer : Pu V Lalbiakzuala\nFin. Secretary : Pu R Lalrintluanga" },
  { year: '2024', details: "Chairman : Upa H Lalmawia\nVice Chairman : Pu K Ṭhuamluaia\nSecretary : Pu JC Laldinthara\nAsst. Secretary: Pu V Lalbiakzuala\nTreasurer : Pu R Lalremmawia\nFin. Secretary : Pu R Lalrintluanga" },
  { year: '2025', details: "Chairman : Upa David Lalchhanhima\nVice Chairman : Pu K Ṭhuamluaia\nSecretary : Pu JC Laldinthara\nAsst. Secretary: Pu V Lalbiakzuala\nTreasurer : Pu R Lalremmawia\nFin. Secretary : Pu R Lalrintluanga" },
];

const REFRESHMENT_SEED_DATA = [
  { year: '1989', details: "Chairman : Pu R Khawhluna\nVice Chairman : Upa Khawidawla\nSecretary : Pu RD Lalchhuana\nAsst. Secretary: Pu H Kapthianga\nTreasurer : Pu PC Lalhmingliana\nFin. Secretary : Pu C Lalrintluanga" },
  { year: '1990', details: "Chairman : Pu C Khuangbuaia\nVice Chairman : Pu F Lalramhluna\nSecretary : Pu C Lalrintluanga\nAsst. Secretary: Pu C Zolawma\nTreasurer : Pu PC Lalhmingliana\nFin. Secretary : Pu HT Vanlalsawma" },
  { year: '1991', details: "Chairman : Pu C Khuangbuaia\nVice Chairman : Upa G Vanlallawma\nSecretary : Pu RD Lalchhuana\nAsst. Secretary: Pu FC Lalramliana\nTreasurer : Pu K Lalduata\nFin. Secretary : Pu C Hmingliana" },
  { year: '1992', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Upa B Hranghlira\nSecretary : Pu HT Vanlalsawma\nAsst. Secretary: Pu R Lalramhluna\nTreasurer : Pu PC Lalhmingliana\nFin. Secretary : Pu H Kapthianga" },
  { year: '1993', details: "Chairman : Upa Saizama Sailo\nVice Chairman : Upa Daikhawzama\nSecretary : Pu PC Lalhmingliana\nAsst. Secretary: Pu R Lalrintluanga\nTreasurer : Pu Lalnunthara\nFin. Secretary : Pu R Lalramhluna" },
  { year: '1994', details: "Chairman : Upa Khawidawla\nVice Chairman : Upa B Hranghlira\nSecretary : Pu HT Vanlalsawma\nAsst. Secretary: Pu H Vanlalthanga\nTreasurer : Pu K Nunthara\nFin. Secretary : Pu R Lalramhluna" },
  { year: '1995', details: "Chairman : Upa HT Vanlalsawma\nVice Chairman : Upa Daikhawzama\nSecretary : Pu RD Lalchhuana\nAsst. Secretary: Pu K Rinliana\nTreasurer : Pu H Zakima\nFin. Secretary : Pu C Lalparliana" },
  { year: '1996', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Pu PC Thanhluma\nSecretary : Pu H Zakima\nAsst. Secretary: Pu K Lalrawna\nTreasurer : Pu K Lalduata\nFin. Secretary : Pu C Lalparliana" },
  { year: '1997', details: "Chairman : Upa Saizama Sailo\nVice Chairman : Pu RD Lalchhuana\nSecretary : Pu PC Lalhmingliana\nAsst. Secretary: Pu R Lalramhluna\nTreasurer : Pu F Lalbuatsaiha\nFin. Secretary : Pu C Lalzova" },
  { year: '1998', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu K Lalduata\nSecretary : Pu H Vanlalthanga\nAsst. Secretary: Pu R Lalhmangaiha\nTreasurer : Pu B Biakvela\nFin. Secretary : Pu K Lalrawna" },
  { year: '1999', details: "Chairman : Pu R Khawhluna\nVice Chairman : Upa H Lalmawia\nSecretary : Pu C Lalrintluanga\nAsst. Secretary: Pu David Lalchhanhima\nTreasurer : Pu T Lalṭanpuia\nFin. Secretary : Pu C Lalbiakthanga" },
  { year: '2000', details: "Hemi kumah hian Upa bial hrang hrang Krismas\nleh Kumthar a hrang ṭheuha hman a nih avangin\ncommittee din a ni lo." },
  { year: '2001', details: "Chairman : Upa H Lalmawia\nVice Chairman : Pu PC Lalhmingliana\nSecretary : Pu B Biakvela\nAsst. Secretary: Pu Lalrozama\nTreasurer : Pu Lalhriata\nFin. Secretary : Pu Ṭhuamluaia" },
  { year: '2002', details: "Chairman : Pu PC Lalhmingliana\nVice Chairman : Upa B Hranghlira\nSecretary : Pu K Ṭhuamluaia\nAsst. Secretary: Pu K Lalrawna\nTreasurer : Pu C Lalfaka\nFin. Secretary : Pu C Rochungnunga" },
  { year: '2003', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu R Khawhluna\nSecretary : Pu K Lalrawna\nAsst. Secretary: Pu K Ṭhuamluaia\nTreasurer : Pu C Lalfaka\nFin. Secretary : Pu H Zakima" },
  { year: '2004', details: "Chairman : Pu R Khawhluna/\nPu C Roliana\nVice Chairman : Upa Manhleia\nSecretary : Tv. Zomuankima\nAsst. Secretary: Pu B Zohmangaiha/\nPu K Lalrawna\nTreasurer : Pu V Lalzuithanga\nFin. Secretary : Pu GF Thanga" },
  { year: '2005', details: "Chairman : Upa Saizama Sailo\nVice Chairman : Pu T Sawmpauva\nSecretary : Tv. Zomuankima\nAsst. Secretary: Pu Vanlaldika Varte\nTreasurer : Pu T Lalthlengliana\nFin. Secretary : Pu T Lalṭanpuia" },
  { year: '2006', details: "Chairman : Upa Saizama Sailo/\nPu C Roliana\nVice Chairman : Pu T Sawmpauva\nSecretary : Pu T Lalṭanpuia\nAsst. Secretary: Pu F Thangliana\nTreasurer : Pu C Zokhuma\nFin. Secretary : Pu T Lalthlengliana" },
  { year: '2007', details: "Chairman : Upa PC Lalhmingliana\nVice Chairman : Pu C Lalfaka\nSecretary : Pu T Lalṭanpuia\nAsst. Secretary: Pu K Lalrawna\nTreasurer : Pu C Zokhuma\nFin. Secretary : Pu T Lalthlengliana" },
  { year: '2008', details: "Chairman : Upa PC Lalhmingliana\nVice Chairman : Pu C Lalfaka\nSecretary : Pu T Lalṭanpuia\nAsst. Secretary: Pu K Lalrawna\nTreasurer : Pu C Zokhuma\nFin. Secretary : Pu T Lalthlengliana" },
  { year: '2009', details: "Chairman : T.Upa C Lalrintluanga\nVice Chairman : Pu C Lalfaka\nSecretary : Pu C Ramrinliana\nAsst. Secretary: Pu C Keilianthanga\nTreasurer : Pu T Sangtluanga\nFin. Secretary : Pu JC Laldinthara" },
  { year: '2010', details: "Chairman : Upa PC Lalhmingliana\nVice Chairman : Pu C Lalfaka\nSecretary : Pu K Lalrawna\nAsst. Secretary: Pu C Ramrinliana\nTreasurer : Pu T Sangtluanga\nFin. Secretary : Pu JC Laldinthara" },
  { year: '2011', details: "Chairman : T.Upa C Lalthantluanga\nVice Chairman : Pu C Lalfaka\nSecretary : Pu K Lalrawna\nAsst. Secretary: Pu C Ramrinliana\nTreasurer : Pu T Sangtluanga\nFin. Secretary : Pu JC Laldinthara" },
  { year: '2012', details: "Chairman : T.Upa C Lalthantluanga\nVice Chairman : Pu C Lalfaka\nSecretary : Pu K Lalrawna\nAsst. Secretary: Pu H Lalrindika/\nPu F Lalbuatsaiha\nTreasurer : Pu T Sangtluanga\nFin. Secretary : Pu JC Laldinthara" },
  { year: '2013', details: "Chairman : T.Upa David Lalchhanhima\nVice Chairman : Pu C Lalfaka\nSecretary : Pu K Lalrawna\nAsst. Secretary: Pu F Lalbuatsaiha\nTreasurer : Pu T Sangtluanga\nFin. Secretary : Pu JC Laldinthara" },
  { year: '2014', details: "Chairman : T.Upa David Lalchhanhima\nVice Chairman : Pu C Lalfaka\nSecretary : Pu T Sangtluanga\nAsst. Secretary: Pu Vanlaldika Varte\nTreasurer : Pu JC Laldinthara\nFin. Secretary : Pu K Lalrawna" },
  { year: '2015', details: "Chairman : Upa HT Lalthlengliana\nVice Chairman : Pu Lalsanglura Zote\nSecretary : Pu Vanlaldika Varte\nAsst. Secretary: Pu C Lalṭhazuala\nTreasurer : Pu JC Laldinthara\nFin. Secretary : Pu C Lalmuansanga" },
  { year: '2016', details: "Chairman : Upa HT Lalthlengliana\nVice Chairman : Pu C Rohmingliana\nSecretary : Pu Lalsanglura Zote\nAsst. Secretary: Pu C Lalṭhazuala\nTreasurer : Pu C Zohmingthanga\nFin. Secretary : Pu C Lalmuansanga" },
  { year: '2017', details: "Chairman : Upa H Lalmawia\nVice Chairman : Pu C Zohmingthanga\nSecretary : Pu C Lalṭhazuala\nAsst. Secretary: Pu C Lalrawngbawla\nTreasurer : Pu Lalmuanpuia Ralte\nFin. Secretary : Pu C Lalmuansanga" },
  { year: '2018', details: "Chairman : Upa R Lalramhluna\nVice Chairman : Pu C Zohmingthanga\nSecretary : Pu C Lalṭhazuala\nAsst. Secretary: Pu C Lalrawngbawla\nTreasurer : Pu Lalmuanpuia Ralte\nFin. Secretary : Pu C Lalmuansanga" },
  { year: '2019', details: "Chairman : Upa C Lalrintluanga\nVice Chairman : Pu C Zohmingthanga\nSecretary : Pu C Lalṭhazuala\nAsst. Secretary: Pu C Lalrawngbawla\nTreasurer : Pu Lalmuanpuia Ralte\nFin. Secretary : Pu C Lalmuansanga" },
  { year: '2020', details: "Chairman : T.Upa C Zohmingthanga\nVice Chairman : Pu F Lalduhawma\nSecretary : Pu JC Laldinthara\nAsst. Secretary: Pu Thangkunga Hualngo\nTreasurer : Pu C Hmingthansanga\nFin. Secretary : Pu TK Manga" },
  { year: '2021', details: "Chairman : T.Upa C Zohmingthanga\nVice Chairman : Pu F Lalduhawma\nSecretary : Pu C Hmingthansanga\nAsst. Secretary: Pu Thangkunga Hualngo\nTreasurer : Pu JC Laldinthara\nFin. Secretary : Pu TK Manga" },
  { year: '2022', details: "Chairman : T.Upa H Zairemmawia\nVice Chairman : Pu F Lalduhawma\nSecretary : Pu C Hmingthansanga\nAsst. Secretary: Pu Thangkunga Hualngo\nTreasurer : Pu JC Laldinthara\nFin. Secretary : Pu TK Manga" },
  { year: '2023', details: "Chairman : Upa Lianpianga\nVice Chairman : Pu Ronald Lalhmachhuana\nSecretary : Pu C Hmingthansanga\nAsst. Secretary: Pu Thangkunga Hualngo\nTreasurer : Pu F Lalduhawma\nFin. Secretary : Pu Nelson Khiangte" },
  { year: '2024', details: "Chairman : Upa Lianpianga\nVice Chairman : T.Upa Hmingthanmawia Sailo\nSecretary : Pu C Hmingthansanga\nAsst. Secretary: Pu H Lalzuitluanga\nTreasurer : Pu H Lalfela\nFin. Secretary : Pu Nelson Khiangte" },
  { year: '2025', details: "Chairman : Pu Hmingthanmawia Sailo\nVice Chairman : T.Upa C Hmingthansanga\nSecretary : Pu H Lalzuitluanga\nAsst. Secretary: Tv. T Lalnunzira\nTreasurer : Pu H Lalfela\nFin. Secretary : Pu Lalthanghulha" },
];

const KRISTIAN_CHHUNGKUA_SEED_DATA = [
  { year: '2008', details: "Chairman : Upa Manhleia\nVice Chairman : Pu V Lalpianga\nSecretary : Pu RD Lalchhuana\nAsst. Secretary: Pu K Lalduhawma" },
  { year: '2009', details: "Chairman : Upa PC Lalhmingliana\nVice Chairman : Upa Manhleia\nSecretary : Pu RD Lalchhuana\nAsst. Secretary: Pu K Lalrinawma" },
  { year: '2010', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Upa Daikhawzama\nSecretary : Pu RD Lalchhuana\nAsst. Secretary: Pi PC Lalhmachhuani" },
  { year: '2011', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Upa Daikhawzama\nSecretary : Pu RD Lalchhuana\nAsst. Secretary: Pi PC Lalhmachhuani" },
  { year: '2012', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Upa PC Lalhmingliana\nSecretary : Pu HT Lalthlengliana\nAsst. Secretary: Pi V Sangkungi" },
  { year: '2013', details: "Chairman : T.Upa C Lalthantluanga\nVice Chairman : Pu H Zakima/\n: T.Upa HT Lalthlengliana\nSecretary : T.Upa HT Lalthlengliana/\n: Pu H Zakima\nAsst. Secretary: Pi V Sangkungi" },
  { year: '2014', details: "Chairman : T.Upa HT Lalthlengliana\nVice Chairman : Pu R Lalrintluanga\nSecretary : Pu K Lalduhawma\nAsst. Secretary: Pi V Sangkungi" },
  { year: '2015', details: "Chairman : Upa Daikhawzama\nVice Chairman : Pu K Lalduata\nSecretary : Pu K Lalduhawma\nAsst. Secretary: Pu MS Dawngliana" },
  { year: '2016', details: "Chairman : Upa H Lalmawia\nVice Chairman : Pu K Lalduata\nSecretary : Pu K Lalduhawma\nAsst. Secretary: Pu MS Dawngliana" },
  { year: '2017', details: "Chairman : T.Upa C Roliana\nVice Chairman : Pu K Lalduata\nSecretary : Pu K Lalduhawma\nAsst. Secretary: Pu MS Dawngliana" },
  { year: '2018', details: "Chairman : T.Upa C Roliana\nVice Chairman : Pu K Lalduata\nSecretary : Pu K Lalduhawma\nAsst. Secretary: Pu MS Dawngliana" },
  { year: '2019', details: "Chairman : Upa R Lalramhluna\nVice Chairman : Pu MS Dawngliana\nSecretary : Pu K Lalduhawma\nAsst. Secretary: Pu T Zaitawna" },
  { year: '2020', details: "Chairman : T.Upa H Zairemmawia\nVice Chairman : Pu MS Dawngliana\nSecretary : Pu K Lalduhawma\nAsst. Secretary: Pu T Zaitawna" },
  { year: '2021', details: "Chairman : T.Upa H Zairemmawia\nVice Chairman : Pu MS Dawngliana\nSecretary : Pu K Lalduhawma\nAsst. Secretary: Pu T Zaitawna" },
  { year: '2022', details: "Chairman : Upa HT Vanlalsawma\nVice Chairman : Pu R Lalrintluanga\nSecretary : Pu K Lalduhawma\nAsst. Secretary: Pu T Zaitawna" },
  { year: '2023', details: "Chairman : Upa HT Vanlalsawma\nVice Chairman : Pu K Lalduhawma\nSecretary : Pu Lalramthara\nAsst. Secretary: Pu T Zaitawna" },
  { year: '2024', details: "Chairman : Upa R Lalramhluna\nVice Chairman : Pu K Lalduhawma\nSecretary : Pu Lalramthara\nAsst. Secretary: Pu H Vanlalthanga" },
  { year: '2025', details: "Chairman : Upa R Lalramhluna\nVice Chairman : Pu K Lalduhawma\nSecretary : Pu Lalramthara\nAsst. Secretary: Pi Lalhlimthangi Khiangte" },
];

const WORSHIP_SEED_DATA = [
  { year: '2024', details: "Chairman : Upa HT Vanlalsawma\nVice Chairman : T.Upa Lalremruata\nSecretary : Pu V Kaizasiama\nAsst. Secretary: Pu Zoramenga" },
  { year: '2025', details: "Chairman : Upa HT Vanlalsawma\nVice Chairman : T.Upa Lalremruata\nSecretary : Pu Zoramenga\nAsst. Secretary: Tv. H Lalfakawma" },
];

const MASIHI_SANGATI_SEED_DATA = [
  { year: '2000', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu PC Lalhlira\nSecretary : Pu Buanthanga\nAsst. Secretary: Pu Lalṭanpuia\nTreasurer : Pu V Lalpianga\nFin. Secretary : Pu R Vanhnuaithanga" },
  { year: '2001', details: "Chairman : Upa Manhleia\nVice Chairman : Upa B Hranghlira\nSecretary : Pu Lalṭanpuia\nAsst. Secretary: Pu R Lalrintluanga\nTreasurer : Pu C Lalthantluanga\nFin. Secretary : Nl. Laldinngheti" },
  { year: '2002', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu K Lalduata\nSecretary : Pu Lalṭanpuia\nAsst. Secretary: Pu K Lalbiakdika/\nPu H Zakima\nTreasurer : Nl. Laldinngheti\nFin. Secretary : Pu Lalbiakkunga Pachuau" },
  { year: '2003', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu Lalbiakkunga Pachuau\nSecretary : Tv. C Zohmingthanga\nAsst. Secretary: Nl. Ngurbawitluangi\nTreasurer : Nl. Laldinngheti\nFin. Secretary : Pu R Lalrintluanga" },
  { year: '2004', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu Lalbiakkunga Pachuau\nSecretary : Tv. C Zohmingthanga\nAsst. Secretary: Nl. Ngurbawitluangi\nTreasurer : Nl. Laldinngheti\nFin. Secretary : Pu R Lalrintluanga" },
  { year: '2005', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu Lalbiakkunga Pachuau\nSecretary : Tv. C Zohmingthanga\nAsst. Secretary: Nl. Ngurbawitluangi\nTreasurer : Pu V Lalpianga\nFin. Secretary : Pu Saihmingliana Sailo" },
  { year: '2006', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu Lalbiakkunga Pachuau\nSecretary : Pu Lalṭanpuia\nAsst. Secretary: Nl. Ngurbawitluangi\nTreasurer : Pu V Lalpianga\nFin. Secretary : Tv. Kenneth Lalthanzauva" },
  { year: '2007', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu Lalbiakkunga Pachuau\nSecretary : Pu Lalṭanpuia\nAsst. Secretary: Nl. Ngurbawitluangi\nTreasurer : Pu V Lalpianga\nFin. Secretary : Tv. Kenneth Lalthanzauva" },
  { year: '2008', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu Lalbiakkunga Pachuau\nSecretary : Pu Lalṭanpuia/\nPu Ramhnehzauva\nAsst. Secretary: Nl. Ngurbawitluangi\nTreasurer : Pu V Lalpianga\nFin. Secretary : Tv. Kenneth Lalthanzauva" },
  { year: '2009', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu Lalbiakkunga Pachuau\nSecretary : Pu Ramhnehzauva\nAsst. Secretary: Nl. Ngurbawitluangi\nTreasurer : Pu V Lalpianga\nFin. Secretary : Tv. Kenneth Lalthanzauva" },
  { year: '2010', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu RD Lalchhuana\nSecretary : Pu Ramhnehzauva\nAsst. Secretary: Nl. Ngurbawitluangi\nTreasurer : Pu V Lalpianga\nFin. Secretary : Tv. Kenneth Lalthanzauva" },
  { year: '2011', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu RD Lalchhuana\nSecretary : Pu Ramhnehzauva\nAsst. Secretary: Pu Lalbiakkunga Pachuau\nTreasurer : Pu V Lalpianga\nFin. Secretary : Tv. Kenneth Lalthanzauva" },
  { year: '2012', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu RD Lalchhuana\nSecretary : Pu Ramhnehzauva\nAsst. Secretary: Pu Lalbiakkunga Pachuau\nTreasurer : Tv. Kenneth Lalthanzauva\nFin. Secretary : Nl. HT Lalnunsiami" },
  { year: '2013', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu RD Lalchhuana\nSecretary : Pu Ramhnehzauva\nAsst. Secretary: Pu Lalbiakkunga Pachuau\nTreasurer : Tv. Kenneth Lalthanzauva\nFin. Secretary : Tv. Mungngaihsanga" },
  { year: '2014', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu RD Lalchhuana\nSecretary : Pu Lalbiakkunga Pachuau\nAsst. Secretary: Pu Khawlrosiama\nTreasurer : Tv. Kenneth Lalthanzauva\nFin. Secretary : Tv. Mungngaihsanga" },
  { year: '2015', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu RD Lalchhuana\nSecretary : Pu Lalbiakkunga Pachuau\nAsst. Secretary: Pu Khawlrosiama\nTreasurer : Tv. Kenneth Lalthanzauva\nFin. Secretary : Pu T Chalzawna" },
  { year: '2016', details: "Chairman : T. Upa C Roliana\nVice Chairman : Upa B Hranghlira\nSecretary : Pu Lalbiakkunga Pachuau\nAsst. Secretary: Pu Khawlrosiama\nTreasurer : Pu L Khenpauva\nFin. Secretary : Pu T Chalzawna" },
  { year: '2017', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu H Zakima\nSecretary : Pu Lalbiakkunga Pachuau\nAsst. Secretary: Pu Khawlrosiama\nTreasurer : Pu L Khenpauva\nFin. Secretary : Pu F Lalbuatsaiha" },
  { year: '2018', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu Lalbiakkunga Pachuau\nSecretary : Pu H Zakima\nAsst. Secretary: Pu L Khenpauva\nTreasurer : Pu F Lalbuatsaiha\nFin. Secretary : Pu Khawlrosiama" },
  { year: '2019', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu Lalbiakkunga Pachuau\nSecretary : Pu H Zakima\nAsst. Secretary: Pu L Khenpauva\nTreasurer : Pu F Lalbuatsaiha\nFin. Secretary : Pu Khawlrosiama" },
  { year: '2020', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu Lalbiakkunga Pachuau\nSecretary : Pu H Zakima\nAsst. Secretary: Pu L Khenpauva\nTreasurer : Pu F Lalbuatsaiha\nFin. Secretary : Pu Khawlrosiama" },
  { year: '2021', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu Lalbiakkunga Pachuau\nSecretary : Pu L Khenpauva\nAsst. Secretary: Pu H Zakima\nTreasurer : Pu F Lalbuatsaiha\nFin. Secretary : Pu Khawlrosiama" },
  { year: '2022', details: "Chairman : Upa B Hranghlira\nVice Chairman : Pu H Zakima\nSecretary : Pu V Lalbiakzuala\nAsst. Secretary: Pu C Lalengmawia\nTreasurer : Pu F Lalbuatsaiha\nFin. Secretary : Pu Khawlrosiama" },
  { year: '2023', details: "Chairman : Upa HT Lalthlengliana\nVice Chairman : Upa B Hranghlira\nSecretary : Pu Khawlrosiama\nAsst. Secretary: Pu C Lalengmawia\nTreasurer : Pu Kapthuama\nFin. Secretary : Tv. H Lalfakawma" },
  { year: '2024', details: "Chairman : Upa HT Lalthlengliana\nVice Chairman : Upa B Hranghlira\nSecretary : Pu Khawlrosiama\nAsst. Secretary: Pu C Lalengmawia\nTreasurer : Pu Kapthuama\nFin. Secretary : Tv. T Lalnunzira" },
  { year: '2025', details: "Chairman : Upa HT Lalthlengliana\nVice Chairman : Upa B Hranghlira\nSecretary : Pu Khawlrosiama\nAsst. Secretary: Pu C Lalengmawia\nTreasurer : Pu Kapthuama\nFin. Secretary : T.Upa V Kaizasiama" },
];

const RECEPTION_USHERING_DECORATION_SEED_DATA = [
  { year: '2024', details: "Chairman : T.Upa Lalremruata\nVice Chairman : Upa HT Vanlalsawma\nSecretary : Pu V Lalbiakdika\nAsst. Secretary: Nl. PC Lalrintluangi\nTreasurer : Pi Lalbiakkungi\nFin. Secretary : Pi C Lallawmsangi" },
  { year: '2025', details: "Chairman : Pu Lalremruata\nVice Chairman : Pu Lalengkima\nSecretary : Pu V Lalbiakdika\nAsst. Secretary: Nl. PC Lalrintluangi\nTreasurer : Pi Lalbiakkungi\nFin. Secretary : Pi C Lallawmsangi" },
];

const ARCHIVE_LIBRARY_SEED_DATA = [
  { year: '2024', details: "Chairman : Upa Lianpianga\nVice Chairman : Upa Daikhawzama\nSecretary : Pu C Lalmuansanga\nAsst. Secretary: Tv. C Vanlalawmpuia" },
  { year: '2025', details: "Chairman : Upa Daikhawzama\nVice Chairman : Upa K Vanlalhmuaka\nSecretary : Pu C Lalzova\nAsst. Secretary: Pi PC Lalnunsangi" },
];

const MUSIC_SEED_DATA = [
  { year: '2001', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Upa Daikhawzama\nSecretary : Pu David Lalchhanhima\nAsst. Secretary: Tv. Lianpianga\nTreasurer : Pu C Lalthlamuana\nFin. Secretary : Pu H Zakima" },
  { year: '2010', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : T.Upa C Roliana\nSecretary : Pu Lianpianga\nAsst. Secretary: Pu Lalbiakkunga Pachuau" },
  { year: '2011', details: "Chairman : T.Upa David Lalchhanhima\nVice Chairman : T.Upa C Roliana\nSecretary : Pu Lianpianga\nAsst. Secretary: Tv. H Lalfakawma" },
  { year: '2012', details: "Chairman : T.Upa David Lalchhanhima\nVice Chairman : Upa Daikhawzama\nSecretary : Pu Lianpianga\nAsst. Secretary: Tv. H Lalfakawma" },
  { year: '2013', details: "Chairman : Upa Daikhawzama\nVice Chairman : Pu Lianpianga\nSecretary : Tv. Lalthangliana Tochhawng\nAsst. Secretary: Tv. H Lalfakawma" },
  { year: '2014', details: "Chairman : Upa Daikhawzama\nVice Chairman : Pu Lianpianga/Pu C Lalzova\nSecretary : Tv. Lalthangliana Tochhawng/\nPu Lianpianga\nAsst. Secretary: Tv. H Lalfakawma" },
  { year: '2015', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Pu C Lalzova\nSecretary : Pu Lianpianga\nAsst. Secretary: Pu Kap\\huama" },
  { year: '2016', details: "Chairman : Upa K Vanlalhmuaka\nVice Chairman : Pu C Lalzova\nSecretary : Pu Lianpianga\nAsst. Secretary: Pu Kap\\huama" },
  { year: '2017', details: "Chairman : Upa HT Lalthlengliana\nVice Chairman : Pu C Lalzova\nSecretary : Pu Kap\\huama\nAsst. Secretary: Tv. R Lalmalsawma" },
  { year: '2018', details: "Chairman : Upa HT Lalthlengliana\nVice Chairman : Pu C Lalzova\nSecretary : Pu Kap\\huama\nAsst. Secretary: Tv. R Lalmalsawma" },
  { year: '2019', details: "Chairman : Upa Daikhawzama\nVice Chairman : Pu C Lalzova\nSecretary : Pu Kap\\huama\nAsst. Secretary: Pu H Lalfakawma" },
  { year: '2020', details: "Chairman : Upa Daikhawzama\nVice Chairman : Pu C Lalzova\nSecretary : Pu Kap\\huama\nAsst. Secretary: Tv. Zoramenga" },
  { year: '2021', details: "Chairman : Upa Daikhawzama\nVice Chairman : Pu C Lalzova\nSecretary : Pu Kap\\huama\nAsst. Secretary: Pu Zoramenga" },
  { year: '2022', details: "Chairman : Upa C Zohmingthanga\nVice Chairman : Pu C Lalzova\nSecretary : Pu Kap\\huama\nAsst. Secretary: Pu Zoramenga" },
  { year: '2023', details: "Chairman : Upa C Zohmingthanga\nVice Chairman : Pu Thangdeihchina\nSecretary : Pu Zoramenga\nAsst. Secretary: Pu R Lalmalsawma" },
];

const LIGHT_SOUND_SEED_DATA = [
  { year: '2010', details: "Chairman : Upa H Lalmawia\nVice Chairman : Tv. Lalremruata Hualngo\nSecretary : Pu PC Lalchuangkima\nAsst. Secretary: Tv. H Lalfakawma" },
  { year: '2011', details: "Chairman : Upa H Lalmawia\nVice Chairman : Upa K Vanlalhmuaka\nSecretary : Pu PC Lalchuangkima\nAsst. Secretary: Tv. Lalremruata Hualngo" },
  { year: '2012', details: "Chairman : Upa C Lalrintluanga\nVice Chairman : Upa H Lalmawia\nSecretary : Pu PC Lalchuangkima\nAsst. Secretary: Tv. Lalremruata Hualngo" },
  { year: '2013', details: "Chairman : Upa C Lalrintluanga\nVice Chairman : Upa H Lalmawia\nSecretary : Pu PC Lalchuangkima\nAsst. Secretary: Tv. Lalremruata Hualngo" },
  { year: '2014', details: "Chairman : Upa H Lalmawia\nVice Chairman : Upa C Lalrintluanga\nSecretary : Pu PC Lalchuangkima\nAsst. Secretary: Tv. Lalremruata Hualngo" },
  { year: '2015', details: "Chairman : Upa H Lalmawia\nVice Chairman : Upa C Lalrintluanga\nSecretary : Tv. Lalremruata Hualngo\nAsst. Secretary: -23- Pu C Lalrawngbawla" },
  { year: '2016', details: "Chairman : Upa H Lalmawia\nVice Chairman : Upa R Lalramhluna\nSecretary : Tv. Lalremruata Hualngo\nAsst. Secretary: Pu Vanlaldika Varte" },
  { year: '2017', details: "Chairman : Upa H Lalmawia\nVice Chairman : Upa R Lalramhluna\nSecretary : Tv. Lalremruata Hualngo\nAsst. Secretary: Pu Vanlaldika Varte" },
  { year: '2018', details: "Chairman : Upa David Lalchhanhima\nVice Chairman : Upa C Lalthantluanga\nSecretary : Tv. Lalremruata Hualngo\nAsst. Secretary: Pu Lalramnghakhlela" },
  { year: '2019', details: "Chairman : Upa HT Lalthlengliana\nVice Chairman : Upa David Lalchhanhima\nSecretary : Pu Lalramnghakhlela\nAsst. Secretary: Tv. Lalremruata Hualngo" },
  { year: '2020', details: "Chairman : Upa David Lalchhanhima\nVice Chairman : Upa HT Lalthlengliana\nSecretary : Tv. Lalremruata Hualngo\nAsst. Secretary: Tv. T Lalnunzira" },
  { year: '2021', details: "Chairman : Upa HT Lalthlengliana\nVice Chairman : Upa David Lalchhanhima\nSecretary : Tv. Lalremruata Hualngo\nAsst. Secretary: Tv. T Lalnunzira" },
  { year: '2022', details: "Chairman : Upa David Lalchhanhima\nVice Chairman : Upa HT Lalthlengliana\nSecretary : Tv. Lalremruata Hualngo\nAsst. Secretary: Tv. T Lalnunzira" },
  { year: '2023', details: "Chairman : T.Upa Lalremruata Hualngo\nVice Chairman : Upa David Lalchhanhima\nSecretary : Pu V Kaizasiama\nAsst. Secretary: Tv. T Lalnunzira" },
];

const Archives: React.FC = () => {
    const { t } = useLanguage();
    const { isAdmin } = useAuth();
    const [archives, setArchives] = useState<ArchiveEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<Partial<ArchiveEntry>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Initial Mock Data (Fallback)
    const MOCK_ARCHIVES: ArchiveEntry[] = [
        { id: '1', title: 'Church Foundation Stone Laying', date: '1985-04-12', category: 'History', description: 'Records of the foundation stone laying ceremony.', link: '#' },
        { id: '2', title: 'Silver Jubilee Souvenir', date: '2010-10-15', category: 'Document', description: 'Scanned copy of the Silver Jubilee souvenir book.', link: '#' },
        { id: '3', title: 'Old Church Building Photo', date: '1990-05-20', category: 'Photo', description: 'Photograph of the first church building.', link: '#' },
        { id: '4', title: '2023', date: '2023-01-01', category: 'Rawngbawltu te', subCategory: 'Executive Body', description: 'List of executive committee members for the year 2023.', link: '#' }
    ];

    const fetchArchives = useCallback(async () => {
        setLoading(true);
        if (!db || !db.collection) {
            setArchives(MOCK_ARCHIVES);
            setLoading(false);
            return;
        }

        try {
            const snapshot = await db.collection('archives').orderBy('date', 'desc').get();
            if (!snapshot.empty) {
                const fetchedData = snapshot.docs.map((doc: any) => ({
                    id: doc.id,
                    ...doc.data()
                })) as ArchiveEntry[];
                setArchives(fetchedData);
            } else {
                setArchives(MOCK_ARCHIVES); // Use mock data if empty for demo purposes, or empty array in production
            }
        } catch (error) {
            console.error("Error fetching archives:", error);
            setArchives(MOCK_ARCHIVES);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchArchives();
    }, [fetchArchives]);

    // Reset subcategory when main category changes
    useEffect(() => {
        if (selectedCategory !== 'Rawngbawltu te') {
            setSelectedSubCategory('All');
        }
    }, [selectedCategory]);

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

            if (id) {
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

    const handleSeedExecutiveBody = async () => {
        if (!db?.collection || !window.confirm("This will add/overwrite Executive Body records from 1981-2025. Continue?")) {
            return;
        }
        setIsSaving(true);
        try {
            const batch = db.batch();
            const collectionRef = db.collection('archives');
            
            // Generate IDs based on Year to avoid duplicates if re-seeded
            EXECUTIVE_BODY_SEED_DATA.forEach(data => {
                const docId = `eb-${data.year}`; 
                const docRef = collectionRef.doc(docId);
                const entry: ArchiveEntry = {
                    id: docId,
                    title: data.year, // Using JUST the year as title
                    date: `${data.year}-01-01`,
                    category: 'Rawngbawltu te',
                    subCategory: 'Executive Body',
                    description: data.details,
                    link: ''
                };
                batch.set(docRef, entry);
            });

            await batch.commit();
            alert("Executive Body data seeded successfully!");
            fetchArchives();
        } catch (error) {
            console.error("Error seeding Executive Body:", error);
            alert("Failed to seed data.");
        }
        setIsSaving(false);
    };

    const handleSeedRamthar = async () => {
        if (!db?.collection || !window.confirm("This will add/overwrite Ramthar records from 1987-2025. Continue?")) {
            return;
        }
        setIsSaving(true);
        try {
            const batch = db.batch();
            const collectionRef = db.collection('archives');
            
            // Generate IDs based on Year to avoid duplicates if re-seeded
            RAMTHAR_SEED_DATA.forEach(data => {
                const docId = `ramthar-${data.year}`; 
                const docRef = collectionRef.doc(docId);
                const entry: ArchiveEntry = {
                    id: docId,
                    title: data.year, // Using JUST the year as title
                    date: `${data.year}-01-01`,
                    category: 'Rawngbawltu te',
                    subCategory: 'Ramthar',
                    description: data.details,
                    link: ''
                };
                batch.set(docRef, entry);
            });

            await batch.commit();
            alert("Ramthar data seeded successfully!");
            fetchArchives();
        } catch (error) {
            console.error("Error seeding Ramthar:", error);
            alert("Failed to seed data.");
        }
        setIsSaving(false);
    };

    const handleSeedBuilding = async () => {
        if (!db?.collection || !window.confirm("This will add/overwrite Building records from 1981-2025. Continue?")) {
            return;
        }
        setIsSaving(true);
        try {
            const batch = db.batch();
            const collectionRef = db.collection('archives');
            
            // Generate IDs based on Year to avoid duplicates if re-seeded
            BUILDING_SEED_DATA.forEach(data => {
                const docId = `building-${data.year}`; 
                const docRef = collectionRef.doc(docId);
                const entry: ArchiveEntry = {
                    id: docId,
                    title: data.year, // Using JUST the year as title
                    date: `${data.year}-01-01`,
                    category: 'Rawngbawltu te',
                    subCategory: 'BUILDING', // Using 'BUILDING' as per RAWNGBAWLTU_SUBCATEGORIES
                    description: data.details,
                    link: ''
                };
                batch.set(docRef, entry);
            });

            await batch.commit();
            alert("Building data seeded successfully!");
            fetchArchives();
        } catch (error) {
            console.error("Error seeding Building:", error);
            alert("Failed to seed data.");
        }
        setIsSaving(false);
    };

    const handleSeedSocialFront = async () => {
        if (!db?.collection || !window.confirm("This will add/overwrite Social Front records from 1990-2025. Continue?")) {
            return;
        }
        setIsSaving(true);
        try {
            const batch = db.batch();
            const collectionRef = db.collection('archives');
            
            // Generate IDs based on Year to avoid duplicates if re-seeded
            SOCIAL_FRONT_SEED_DATA.forEach(data => {
                const docId = `socialfront-${data.year}`; 
                const docRef = collectionRef.doc(docId);
                const entry: ArchiveEntry = {
                    id: docId,
                    title: data.year, // Using JUST the year as title
                    date: `${data.year}-01-01`,
                    category: 'Rawngbawltu te',
                    subCategory: 'SOCIAL FRONT',
                    description: data.details,
                    link: ''
                };
                batch.set(docRef, entry);
            });

            await batch.commit();
            alert("Social Front data seeded successfully!");
            fetchArchives();
        } catch (error) {
            console.error("Error seeding Social Front:", error);
            alert("Failed to seed data.");
        }
        setIsSaving(false);
    };

    const handleSeedRefreshment = async () => {
        if (!db?.collection || !window.confirm("This will add/overwrite Refreshment records from 1989-2025. Continue?")) {
            return;
        }
        setIsSaving(true);
        try {
            const batch = db.batch();
            const collectionRef = db.collection('archives');
            
            // Generate IDs based on Year to avoid duplicates if re-seeded
            REFRESHMENT_SEED_DATA.forEach(data => {
                const docId = `refreshment-${data.year}`; 
                const docRef = collectionRef.doc(docId);
                const entry: ArchiveEntry = {
                    id: docId,
                    title: data.year, // Using JUST the year as title
                    date: `${data.year}-01-01`,
                    category: 'Rawngbawltu te',
                    subCategory: 'REFRESHMENT',
                    description: data.details,
                    link: ''
                };
                batch.set(docRef, entry);
            });

            await batch.commit();
            alert("Refreshment data seeded successfully!");
            fetchArchives();
        } catch (error) {
            console.error("Error seeding Refreshment:", error);
            alert("Failed to seed data.");
        }
        setIsSaving(false);
    };

    const handleSeedKristianChhungkua = async () => {
        if (!db?.collection || !window.confirm("This will add/overwrite Kristian Chhungkua records from 2008-2025. Continue?")) {
            return;
        }
        setIsSaving(true);
        try {
            const batch = db.batch();
            const collectionRef = db.collection('archives');
            
            // Generate IDs based on Year to avoid duplicates if re-seeded
            KRISTIAN_CHHUNGKUA_SEED_DATA.forEach(data => {
                const docId = `kck-${data.year}`; 
                const docRef = collectionRef.doc(docId);
                const entry: ArchiveEntry = {
                    id: docId,
                    title: data.year, // Using JUST the year as title
                    date: `${data.year}-01-01`,
                    category: 'Rawngbawltu te',
                    subCategory: 'KRISTIAN CHHUNGKUA',
                    description: data.details,
                    link: ''
                };
                batch.set(docRef, entry);
            });

            await batch.commit();
            alert("Kristian Chhungkua data seeded successfully!");
            fetchArchives();
        } catch (error) {
            console.error("Error seeding Kristian Chhungkua:", error);
            alert("Failed to seed data.");
        }
        setIsSaving(false);
    };

    const handleSeedWorship = async () => {
        if (!db?.collection || !window.confirm("This will add/overwrite Worship records from 2024-2025. Continue?")) {
            return;
        }
        setIsSaving(true);
        try {
            const batch = db.batch();
            const collectionRef = db.collection('archives');
            
            // Generate IDs based on Year to avoid duplicates if re-seeded
            WORSHIP_SEED_DATA.forEach(data => {
                const docId = `worship-${data.year}`; 
                const docRef = collectionRef.doc(docId);
                const entry: ArchiveEntry = {
                    id: docId,
                    title: data.year, // Using JUST the year as title
                    date: `${data.year}-01-01`,
                    category: 'Rawngbawltu te',
                    subCategory: 'WORSHIP',
                    description: data.details,
                    link: ''
                };
                batch.set(docRef, entry);
            });

            await batch.commit();
            alert("Worship data seeded successfully!");
            fetchArchives();
        } catch (error) {
            console.error("Error seeding Worship:", error);
            alert("Failed to seed data.");
        }
        setIsSaving(false);
    };

    const handleSeedMasihiSangati = async () => {
        if (!db?.collection || !window.confirm("This will add/overwrite Masihi Sangati records from 2000-2025. Continue?")) {
            return;
        }
        setIsSaving(true);
        try {
            const batch = db.batch();
            const collectionRef = db.collection('archives');
            
            // Generate IDs based on Year to avoid duplicates if re-seeded
            MASIHI_SANGATI_SEED_DATA.forEach(data => {
                const docId = `masihi-${data.year}`; 
                const docRef = collectionRef.doc(docId);
                const entry: ArchiveEntry = {
                    id: docId,
                    title: data.year, // Using JUST the year as title
                    date: `${data.year}-01-01`,
                    category: 'Rawngbawltu te',
                    subCategory: 'MASIHI SANGATI',
                    description: data.details,
                    link: ''
                };
                batch.set(docRef, entry);
            });

            await batch.commit();
            alert("Masihi Sangati data seeded successfully!");
            fetchArchives();
        } catch (error) {
            console.error("Error seeding Masihi Sangati:", error);
            alert("Failed to seed data.");
        }
        setIsSaving(false);
    };

    const handleSeedReceptionUsheringDecoration = async () => {
        if (!db?.collection || !window.confirm("This will add/overwrite Reception, Ushering & Decoration records from 2024-2025. Continue?")) {
            return;
        }
        setIsSaving(true);
        try {
            const batch = db.batch();
            const collectionRef = db.collection('archives');
            
            // Generate IDs based on Year to avoid duplicates if re-seeded
            RECEPTION_USHERING_DECORATION_SEED_DATA.forEach(data => {
                const docId = `rud-${data.year}`; 
                const docRef = collectionRef.doc(docId);
                const entry: ArchiveEntry = {
                    id: docId,
                    title: data.year, // Using JUST the year as title
                    date: `${data.year}-01-01`,
                    category: 'Rawngbawltu te',
                    subCategory: 'RECEPTION, USHERING & DECORATION',
                    description: data.details,
                    link: ''
                };
                batch.set(docRef, entry);
            });

            await batch.commit();
            alert("Reception, Ushering & Decoration data seeded successfully!");
            fetchArchives();
        } catch (error) {
            console.error("Error seeding Reception, Ushering & Decoration:", error);
            alert("Failed to seed data.");
        }
        setIsSaving(false);
    };

    const handleSeedArchiveLibrary = async () => {
        if (!db?.collection || !window.confirm("This will add/overwrite Archive & Library records. Continue?")) {
            return;
        }
        setIsSaving(true);
        try {
            const batch = db.batch();
            const collectionRef = db.collection('archives');
            
            ARCHIVE_LIBRARY_SEED_DATA.forEach(data => {
                const docId = `archlib-${data.year}`; 
                const docRef = collectionRef.doc(docId);
                const entry: ArchiveEntry = {
                    id: docId,
                    title: data.year, // Using JUST the year as title
                    date: `${data.year}-01-01`,
                    category: 'Rawngbawltu te',
                    subCategory: 'ARCHIVE & LIBRARY',
                    description: data.details,
                    link: ''
                };
                batch.set(docRef, entry);
            });

            await batch.commit();
            alert("Archive & Library data seeded successfully!");
            fetchArchives();
        } catch (error) {
            console.error("Error seeding Archive & Library:", error);
            alert("Failed to seed data.");
        }
        setIsSaving(false);
    };

    const handleSeedMusic = async () => {
        if (!db?.collection || !window.confirm("This will add/overwrite Music records. Continue?")) {
            return;
        }
        setIsSaving(true);
        try {
            const batch = db.batch();
            const collectionRef = db.collection('archives');
            
            MUSIC_SEED_DATA.forEach(data => {
                const docId = `music-${data.year}`; 
                const docRef = collectionRef.doc(docId);
                const entry: ArchiveEntry = {
                    id: docId,
                    title: data.year, // Using JUST the year as title
                    date: `${data.year}-01-01`,
                    category: 'Rawngbawltu te',
                    subCategory: 'MUSIC',
                    description: data.details,
                    link: ''
                };
                batch.set(docRef, entry);
            });

            await batch.commit();
            alert("Music data seeded successfully!");
            fetchArchives();
        } catch (error) {
            console.error("Error seeding Music:", error);
            alert("Failed to seed data.");
        }
        setIsSaving(false);
    };

    const handleSeedLightSound = async () => {
        if (!db?.collection || !window.confirm("This will add/overwrite Light & Sound records. Continue?")) {
            return;
        }
        setIsSaving(true);
        try {
            const batch = db.batch();
            const collectionRef = db.collection('archives');
            
            LIGHT_SOUND_SEED_DATA.forEach(data => {
                const docId = `lightsound-${data.year}`; 
                const docRef = collectionRef.doc(docId);
                const entry: ArchiveEntry = {
                    id: docId,
                    title: data.year, // Using JUST the year as title
                    date: `${data.year}-01-01`,
                    category: 'Rawngbawltu te',
                    subCategory: 'LIGHT & SOUND',
                    description: data.details,
                    link: ''
                };
                batch.set(docRef, entry);
            });

            await batch.commit();
            alert("Light & Sound data seeded successfully!");
            fetchArchives();
        } catch (error) {
            console.error("Error seeding Light & Sound:", error);
            alert("Failed to seed data.");
        }
        setIsSaving(false);
    };

    const handleSeedFinance = async () => {
        if (!db?.collection || !window.confirm("This will add/overwrite Finance records from 2006-2025. Continue?")) {
            return;
        }
        setIsSaving(true);
        try {
            const batch = db.batch();
            const collectionRef = db.collection('archives');
            
            FINANCE_SEED_DATA.forEach(data => {
                const docId = `finance-${data.year}`; 
                const docRef = collectionRef.doc(docId);
                const entry: ArchiveEntry = {
                    id: docId,
                    title: data.year,
                    date: `${data.year}-01-01`,
                    category: 'Rawngbawltu te',
                    subCategory: 'FINANCE',
                    description: data.details,
                    link: ''
                };
                batch.set(docRef, entry);
            });

            await batch.commit();
            alert("Finance data seeded successfully!");
            fetchArchives();
        } catch (error) {
            console.error("Error seeding Finance:", error);
            alert("Failed to seed data.");
        }
        setIsSaving(false);
    };

    const filteredArchives = archives.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              item.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        
        // Sub-category filter logic
        const matchesSubCategory = selectedCategory !== 'Rawngbawltu te' || 
                                   selectedSubCategory === 'All' || 
                                   item.subCategory === selectedSubCategory;

        return matchesSearch && matchesCategory && matchesSubCategory;
    });

    const categories = ['All', 'Document', 'Photo', 'Video', 'History', 'Minute', 'Rawngbawltu te'];

    return (
        <div className="py-12 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-serif font-bold text-church-900 mb-4">{t.archives.title}</h1>
                    <p className="text-slate-600 max-w-2xl mx-auto">{t.archives.subtitle}</p>
                </div>

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
                                {selectedCategory === 'Rawngbawltu te' && selectedSubCategory === 'Executive Body' && (
                                    <button 
                                        onClick={handleSeedExecutiveBody}
                                        disabled={isSaving}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition whitespace-nowrap disabled:opacity-50"
                                        title="Seed Executive Body Data"
                                    >
                                        {isSaving ? <Loader className="animate-spin w-4 h-4" /> : <Database size={18} />}
                                    </button>
                                )}
                                {selectedCategory === 'Rawngbawltu te' && selectedSubCategory === 'Ramthar' && (
                                    <button 
                                        onClick={handleSeedRamthar}
                                        disabled={isSaving}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition whitespace-nowrap disabled:opacity-50"
                                        title="Seed Ramthar Data"
                                    >
                                        {isSaving ? <Loader className="animate-spin w-4 h-4" /> : <Database size={18} />}
                                    </button>
                                )}
                                {selectedCategory === 'Rawngbawltu te' && selectedSubCategory === 'BUILDING' && (
                                    <button 
                                        onClick={handleSeedBuilding}
                                        disabled={isSaving}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition whitespace-nowrap disabled:opacity-50"
                                        title="Seed Building Data"
                                    >
                                        {isSaving ? <Loader className="animate-spin w-4 h-4" /> : <Database size={18} />}
                                    </button>
                                )}
                                {selectedCategory === 'Rawngbawltu te' && selectedSubCategory === 'SOCIAL FRONT' && (
                                    <button 
                                        onClick={handleSeedSocialFront}
                                        disabled={isSaving}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition whitespace-nowrap disabled:opacity-50"
                                        title="Seed Social Front Data"
                                    >
                                        {isSaving ? <Loader className="animate-spin w-4 h-4" /> : <Database size={18} />}
                                    </button>
                                )}
                                {selectedCategory === 'Rawngbawltu te' && selectedSubCategory === 'REFRESHMENT' && (
                                    <button 
                                        onClick={handleSeedRefreshment}
                                        disabled={isSaving}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition whitespace-nowrap disabled:opacity-50"
                                        title="Seed Refreshment Data"
                                    >
                                        {isSaving ? <Loader className="animate-spin w-4 h-4" /> : <Database size={18} />}
                                    </button>
                                )}
                                {selectedCategory === 'Rawngbawltu te' && selectedSubCategory === 'KRISTIAN CHHUNGKUA' && (
                                    <button 
                                        onClick={handleSeedKristianChhungkua}
                                        disabled={isSaving}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition whitespace-nowrap disabled:opacity-50"
                                        title="Seed Kristian Chhungkua Data"
                                    >
                                        {isSaving ? <Loader className="animate-spin w-4 h-4" /> : <Database size={18} />}
                                    </button>
                                )}
                                {selectedCategory === 'Rawngbawltu te' && selectedSubCategory === 'WORSHIP' && (
                                    <button 
                                        onClick={handleSeedWorship}
                                        disabled={isSaving}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition whitespace-nowrap disabled:opacity-50"
                                        title="Seed Worship Data"
                                    >
                                        {isSaving ? <Loader className="animate-spin w-4 h-4" /> : <Database size={18} />}
                                    </button>
                                )}
                                {selectedCategory === 'Rawngbawltu te' && selectedSubCategory === 'MASIHI SANGATI' && (
                                    <button 
                                        onClick={handleSeedMasihiSangati}
                                        disabled={isSaving}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition whitespace-nowrap disabled:opacity-50"
                                        title="Seed Masihi Sangati Data"
                                    >
                                        {isSaving ? <Loader className="animate-spin w-4 h-4" /> : <Database size={18} />}
                                    </button>
                                )}
                                {selectedCategory === 'Rawngbawltu te' && selectedSubCategory === 'RECEPTION, USHERING & DECORATION' && (
                                    <button 
                                        onClick={handleSeedReceptionUsheringDecoration}
                                        disabled={isSaving}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition whitespace-nowrap disabled:opacity-50"
                                        title="Seed Reception, Ushering & Decoration Data"
                                    >
                                        {isSaving ? <Loader className="animate-spin w-4 h-4" /> : <Database size={18} />}
                                    </button>
                                )}
                                {selectedCategory === 'Rawngbawltu te' && selectedSubCategory === 'ARCHIVE & LIBRARY' && (
                                    <button 
                                        onClick={handleSeedArchiveLibrary}
                                        disabled={isSaving}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition whitespace-nowrap disabled:opacity-50"
                                        title="Seed Archive & Library Data"
                                    >
                                        {isSaving ? <Loader className="animate-spin w-4 h-4" /> : <Database size={18} />}
                                    </button>
                                )}
                                {selectedCategory === 'Rawngbawltu te' && selectedSubCategory === 'MUSIC' && (
                                    <button 
                                        onClick={handleSeedMusic}
                                        disabled={isSaving}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition whitespace-nowrap disabled:opacity-50"
                                        title="Seed Music Data"
                                    >
                                        {isSaving ? <Loader className="animate-spin w-4 h-4" /> : <Database size={18} />}
                                    </button>
                                )}
                                {selectedCategory === 'Rawngbawltu te' && selectedSubCategory === 'LIGHT & SOUND' && (
                                    <button 
                                        onClick={handleSeedLightSound}
                                        disabled={isSaving}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition whitespace-nowrap disabled:opacity-50"
                                        title="Seed Light & Sound Data"
                                    >
                                        {isSaving ? <Loader className="animate-spin w-4 h-4" /> : <Database size={18} />}
                                    </button>
                                )}
                                {selectedCategory === 'Rawngbawltu te' && selectedSubCategory === 'FINANCE' && (
                                    <button 
                                        onClick={handleSeedFinance}
                                        disabled={isSaving}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition whitespace-nowrap disabled:opacity-50"
                                        title="Seed Finance Data"
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

                {loading ? (
                    <div className="flex justify-center py-20"><Loader className="animate-spin text-church-500 w-10 h-10" /></div>
                ) : filteredArchives.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredArchives.map(entry => {
                            const Icon = CATEGORY_ICONS[entry.category] || Archive;
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
                                            <div className="flex flex-wrap gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{entry.category}</span>
                                                {entry.subCategory && (
                                                    <span className="text-xs font-bold text-church-600 bg-church-100 px-2 py-0.5 rounded-full">{entry.subCategory}</span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-slate-800 text-lg leading-tight">{entry.title}</h3>
                                            <p className="text-xs text-slate-500 mt-1">{entry.date}</p>
                                        </div>
                                    </div>
                                    <p className="text-slate-600 text-sm mb-4 line-clamp-3 flex-grow whitespace-pre-wrap">
                                        {entry.description}
                                    </p>
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

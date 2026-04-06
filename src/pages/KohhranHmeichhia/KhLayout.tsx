import React from 'react';
import { Book, List, Camera } from 'lucide-react';
import MinistryLayout from '../../components/MinistryLayout';

const KhLayout: React.FC = () => {
  const navLinks = [
    { id: 'leaders',        path: '/kohhran-hmeichhia/leaders',        label: 'Hruaitute',  icon: Book },
    { id: 'members',        path: '/kohhran-hmeichhia/members',        label: 'Member List',     icon: List },
    { id: 'gallery',        path: '/kohhran-hmeichhia/gallery',        label: 'Picture Gallery', icon: Camera },
  ];
  return <MinistryLayout ministryId="kpvm" navLinks={navLinks} />;
};

export default KhLayout;

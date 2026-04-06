import React from 'react';
import { Book, List, Camera } from 'lucide-react';
import MinistryLayout from '../../components/MinistryLayout';

const KppLayout: React.FC = () => {
  const navLinks = [
    { id: 'leaders',        path: '/kpp/leaders',        label: 'Hruaitute',  icon: Book },
    { id: 'members',        path: '/kpp/members',        label: 'Member List',     icon: List },
    { id: 'gallery',        path: '/kpp/gallery',        label: 'Picture Gallery', icon: Camera },
  ];
  return <MinistryLayout ministryId="pavlai" navLinks={navLinks} />;
};

export default KppLayout;

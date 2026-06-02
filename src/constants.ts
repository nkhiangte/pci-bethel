
import { Announcement, Event, Ministry, Staff, WeeklyDuty, Sermon } from './types';
import { Language } from './translations';

export const CHURCH_NAME = "Champhai Bethel Kohhran";

// DATA STORES
const DATA = {
    en: {
    announcements: [
      {
        id: '1',
        title: 'Urgent Prayer Request for Surgery',
        date: '2023-10-27',
        category: 'Emergency',
        content: 'Please keep Upa Lalnuntluanga in your prayers as he undergoes surgery tomorrow morning. May God guide the hands of the surgeons and grant him a swift recovery.',
        imageUrl: 'https://picsum.photos/seed/prayer/1200/800'
      },
      {
        id: '2',
        title: 'KTP General Conference Registration Now Open',
        date: '2023-10-25',
        category: 'Youth',
        content: 'Registration for the upcoming KTP General Conference is open until this Sunday. All youth members are encouraged to register and participate.',
        imageUrl: 'https://picsum.photos/seed/youthconf/1200/800'
      },
      {
        id: '3',
        title: 'Community Work (Hnatlang) this Saturday',
        date: '2023-10-24',
        category: 'General',
        content: 'There will be a mass social work (Hnatlang) at the Church premises this Saturday morning, starting at 7:00 AM. All members are requested to attend.',
        imageUrl: 'https://picsum.photos/seed/community/1200/800'
      }
    ] as Announcement[],
    sermons: [
      {
        id: 's1',
        title: 'The Good Shepherd',
        date: '2024-05-12',
        preacher: 'Rev. Lalhmingthanga Chhangte',
        scripture: 'Psalm 23',
        description: 'An exposition on the comforting words of Psalm 23, exploring how Jesus is our Good Shepherd through life\'s valleys and peaks.',
        audioUrl: '#',
        videoUrl: '#'
      },
      {
        id: 's2',
        title: 'Faith That Moves Mountains',
        date: '2024-05-05',
        preacher: 'Upa H. Zairemmawia',
        scripture: 'Matthew 17:20',
        description: 'A message on the power of even a little faith and how it can overcome great obstacles in our spiritual journey.',
        audioUrl: '#',
        videoUrl: '#'
      },
      {
        id: 's3',
        title: 'The Sermon on the Mount',
        date: '2024-04-28',
        preacher: 'Rev. Lalhmingthanga Chhangte',
        scripture: 'Matthew 5-7',
        description: 'A deep dive into the core teachings of Jesus from the Sermon on the Mount.',
        audioUrl: '#',
        videoUrl: '#'
      }
    ] as Sermon[],
    events: [] as any[],
    ministries: [
      {
        id: 'ktp',
        name: 'Kristian Ṭhalai Pawl',
        acronym: 'KTP',
        description: 'Rawngbawl tura Chhandam',
        leader: '',
        schedule: 'Thawhṭanni @ 7:00 PM',
        image: 'https://ui-avatars.com/api/?name=KTP&background=0284c7&color=fff&size=256'
      },
      {
        id: 'kpvm',
        name: 'Kohhran Hmeichhia',
        acronym: 'KH',
        description: "Kan Kohhran hmeichhiate inkhawmpawlna, thlarau lama ṭhanglian a, rawngbawlna leh tanpui ngaite tanpuina kawnga pawimawh tak.",
        leader: '',
        schedule: 'Thawhlehni @ 1:30 PM',
        image: 'https://ui-avatars.com/api/?name=KH&background=be185d&color=fff&size=256'
      },
      {
        id: 'pavlai',
        name: 'Kohhran Pavalai Pawl',
        acronym: 'KPP',
        description: "Thil tumte :\ni) Mi dangte Krista hnena hruai.\nii) Kohhran hmalakna ṭawiawm\niii) Kristian chhungkaw ṭha din tura ṭan lak.\nThupui : Krista tana nun. (Phil 1 : 21)",
        leader: '',
        schedule: 'Zirtawpni @ 7:00 PM',
        image: 'https://ui-avatars.com/api/?name=KPP&background=15803d&color=fff&size=256'
      }
    ] as Ministry[],
    pastors: [
      {
        id: 'p1',
        name: 'Rev. Lalhmingthanga Chhangte',
        role: 'Pastor', // Changed to Pastor as requested
        imageUrl: 'https://i.ibb.co/CKyK3v4Z/pastor.jpg',
        description: 'Kohhran hruaitu ber, finna leh khawngaihnaa kohhran kaihruaitu.',
        order: 0, // Added order for consistency
      }
    ] as Staff[],
    proPastors: [] as Staff[], // Removed mock data for Pro Pastors
    elders: [
      { id: 'e1', name: 'Upa C. Lalzuala', role: 'Elder', period: '1995', imageUrl: 'https://i.ibb.co/v4wDgNKq/Upa-Zoa.jpg', description: 'Rinna banpui, inpeknate leh lainatnate nen kohhran rawngbawltu.', order: 1 },
      { id: 'e2', name: 'Upa R. Lalruata', role: 'Elder', period: '1998', imageUrl: 'https://i.ibb.co/fYQGQ3mW/Ruata.jpg', description: 'Kohhran thawhpui a, inpe zova mi a ni.', order: 2 },
      { id: 'e3', name: 'T. Upa Hminga', role: 'Elder', period: '2005', imageUrl: 'https://i.ibb.co/Gvq96sxK/T-Upa-Hminga.jpg', description: 'Thlarau lam thil hriatna thuk tak nei a, kohhran kaihruaitu.', order: 3 },
      { id: 'e4', name: 'Upa B.L. Thanga', role: 'Elder', period: '2001', imageUrl: 'https://i.ibb.co/Q7LDd8Q9/Upa-Ba.jpg', description: 'A kaihhruaina duhawm tak leh finnate chu malsawmna a ni.', order: 4 },
      { id: 'e5', name: 'Upa David Lalchhanhima', role: 'Elder', period: '2010', imageUrl: 'https://i.ibb.co/fV4FY94Y/Upa-Dav.jpg', description: 'Rawngbawlna thinlung tak pu a, hruaitu a ni.', order: 5 },
      { id: 'e6', name: 'Upa Daikhawzama', role: 'Elder', period: '2008', imageUrl: 'https://i.ibb.co/dJs5HSj0/Upa-DKZ.jpg', description: 'Upa rinawm tak, ngaihtuahna tha tak pe zel a ni.', order: 6 },
      { id: 'e7', name: 'Upa Hmingthanmawia Sailo', role: 'Elder', period: '2012', imageUrl: 'https://i.ibb.co/FL6dnZN1/Upa-Hminga.jpg', description: 'Thlarau lam thil hriatna thuk tak nei a, kohhran kaihruaitu.', order: 7 },
      { id: 'e8', name: 'Upa K. Vanlalhmuaka', role: 'Elder', period: '2015', imageUrl: 'https://i.ibb.co/s9kD2H50/Upa-Hmuaka.jpg', description: 'Kaihhruaina nghet tak pe a, thlamuantu a ni.', order: 8 },
      { id: 'e9', name: 'Upa Lianpianga', role: 'Elder', period: '1999', imageUrl: 'https://i.ibb.co/1fsM0n5b/Upa-Liana.jpg', description: 'Khawtlang tana inpe a, mi ngaihsak tak a ni.', order: 9 },
      { id: 'e10', name: 'Upa H. Zairemmawia', role: 'Elder', period: '2018', imageUrl: 'https://i.ibb.co/jv6HZt58/Upa-Mawia.jpg', description: 'Kohhran chhungah inpeknate a chawh lartu a ni.', order: 10 },
      { id: 'e11', name: 'Upa G. Vanlallawma', role: 'Elder', period: '2003', imageUrl: 'https://i.ibb.co/S4FMThT1/Upa-Sawma.jpg', description: 'Rawngbawltu rinawm tak, Pathian thu vawng tlat a ni.', order: 11 },
      { id: 'e12', name: 'Upa H.L. Tehluna', role: 'Elder', period: '2006', imageUrl: 'https://i.ibb.co/b5TcDF1y/Upa-Tehluna.jpg', description: 'Finna nei a, ngaihsak tak a ni.', order: 12 },
      { id: 'e13', name: 'Upa C. Lalthantluanga', role: 'Elder', period: '2020', imageUrl: 'https://i.ibb.co/MkYn154v/Upa-Tluanga.jpg', description: 'A tawngtainate avanga mi hriat hlawh, Pathian thu hrethiam tak a ni.', order: 13 },
      { id: 'e14', name: 'Upa C. Zohmingthanga', role: 'Elder', period: '2022', imageUrl: 'https://i.ibb.co/7tsDcQDk/Upa-Zaia.jpg', description: 'Ṭhalai program leh rawngbawlnate tana inpe.', order: 14 }
    ] as Staff[],
    weeklyDuty: {
      id: 'current',
      month: 'January',
      thawhlawmChiartute: [
        'T. Upa C. Lalthazuala', 'Pu Kapthuama', 'Pu Nelson Khiangte', 'Pu Lalhmingmawia'
      ],
      buhfaithamHralhtute: [
        'Pi Lalbiakhnuni', 'Pi K. Thangkimi', 'Pi Vanlalnghaki Colney', 'Pi H. Lallawmkimi', 'Pi Rosiammawii', 'Pi Zorampari', 'Pi K. Rochharliani'
      ],
      ushers: [
        'Pu Tluangzathanga', 'Pu Lalhruaitluanga', 'Tv. Lalrochawia', 'Pu Samuel Lalbiakzuala', 'Tv. Zodintluanga', 'Tv. Pauengliana', 'Nl. Lalnunthari', 'Nl. C. Lalrampansangi', 'Nl. Ngurthankimi', 'Nl. Catherine Lalhriatpuii', 'Nl. Anny Lalliandawli', 'Nl. B. Lalrinfeli'
      ],
      weekRange: '05 - 11 January, 2026',
      zaiHruaitu: 'Pu R. Lalmalsawma & Tv. Vanlalchhana',
      pianoTumtu: 'Tv. H. Lalfakawma',
      hlaHriltu: 'Pi C. Lalramthari',
      lightAndSoundDuty: 'Tv. T. Lalnunzira & Pu Lalhmunngheta',
      pangparKhawitu: 'Nl. B. Lalnunsiam & Nl. Lalnunsiami',
      serviceTimes: {
        sundaySchool: '10:30 AM',
        morning: '01:30 PM',
        evening: '07:00 PM'
      },
      serviceTitles: {
        sundaySchool: 'Sunday School',
        morning: 'Chawhnu Inkhawm',
        evening: 'Zan Inkhawm'
      },
      // FIX: Changed servicePrograms to use ProgramField[] structure to match types.ts
      servicePrograms: {
        sundaySchool: [
          { id: 'ss1', label: 'Zirlai', value: '' },
          { id: 'ss2', label: 'Zirtirtu', value: '' }
        ],
        morning: [
          { id: 'm1', label: 'Tantu', value: '' },
          { id: 'm2', label: 'Thuhriltu', value: '' }
        ],
        evening: [
          { id: 'e1', label: 'Tantu', value: '' },
          { id: 'e2', label: 'Thuhriltu', value: '' }
        ]
      },
      midWeek: {
        nilai: {
          title: 'Wednesday Service',
          time: '07:00 PM',
          hruaitu: '',
          tantu: '',
          thupui: '',
          thuhriltu: ''
        },
        inrinni: {
          title: 'Saturday Prayer',
          time: '07:00 PM',
          hruaitu: '',
          tantu: '',
          thupui: '',
          thuhriltu: ''
        }
      }
    } as WeeklyDuty
  },
  mizo: {
    announcements: [
      {
        id: '1',
        title: 'Ṭawngṭai Pui Ngai',
        date: '2023-10-27',
        category: 'Emergency',
        content: 'Upa Lalnuntluanga naktuk a zai a nih dawn avangin Kohhran hote ṭawngṭaipuina kan ngen e.',
        imageUrl: 'https://picsum.photos/seed/prayer/1200/800'
      }
    ] as Announcement[],
    sermons: [
        {
            id: 's1',
            title: 'Berampu Ṭha',
            date: '2024-05-12',
            preacher: 'Rev. Lalhmingthanga Chhangte',
            scripture: 'Sam 23',
            description: 'Sam 23-na thuchah thlamuanthlak tak, Isua chu engtin nge kan dam chhung kawng zawhah Berampu Ṭha a nih tih zir chianna.',
            audioUrl: '#',
            videoUrl: '#'
        },
        {
            id: 's2',
            title: 'Rinna Tlâng Sawn Thei',
            date: '2024-05-05',
            preacher: 'Upa H. Zairemmawia',
            scripture: 'Matthaia 17:20',
            description: 'Rinna tê ber pawhin thil ropui a tih theih dan leh kan thlarau nun kawngah harsatna nasa tak a hneh theih dan thuchah.',
            audioUrl: '#',
            videoUrl: '#'
        }
    ] as Sermon[],
    events: [] as Event[],
    ministries: [
      {
        id: 'ktp',
        name: 'Kristian Ṭhalai Pawl',
        acronym: 'KTP',
        description: 'Rawngbawl tura Chhandam',
        leader: '',
        schedule: 'Thawhṭanni @ 7:00 PM',
        image: 'https://ui-avatars.com/api/?name=KTP&background=0284c7&color=fff&size=256'
      },
      {
        id: 'kpvm',
        name: 'Kohhran Hmeichhia',
        acronym: 'KH',
        description: "Kan Kohhran hmeichhiate inkhawmpawlna, thlarau lama ṭhanglian a, rawngbawlna leh tanpui ngaite tanpuina kawnga pawimawh tak.",
        leader: '',
        schedule: 'Thawhlehni @ 1:30 PM',
        image: 'https://ui-avatars.com/api/?name=KH&background=be185d&color=fff&size=256'
      },
      {
        id: 'pavlai',
        name: 'Kohhran Pavalai Pawl',
        acronym: 'KPP',
        description: "Thil tumte :\ni) Mi dangte Krista hnena hruai.\nii) Kohhran hmalakna ṭawiawm\niii) Kristian chhungkaw ṭha din tura ṭan lak.\nThupui : Krista tana nun. (Phil 1 : 21)",
        leader: '',
        schedule: 'Zirtawpni @ 7:00 PM',
        image: 'https://ui-avatars.com/api/?name=KPP&background=15803d&color=fff&size=256'
      }
    ] as Ministry[],
    pastors: [
      {
        id: 'p1',
        name: 'Rev. Lalhmingthanga Chhangte',
        role: 'Bialtu Pastor',
        imageUrl: 'https://i.ibb.co/CKyK3v4Z/pastor.jpg',
        description: 'Kohhran hruaitu ber, finna leh khawngaihnaa kohhran kaihruaitu.',
        order: 0, // Added order for consistency
      }
    ] as Staff[],
    proPastors: [] as Staff[], // Removed mock data for Pro Pastors (Mizo)
    elders: [
      { id: 'e1', name: 'Upa C. Lalzuala', role: 'Upa', period: '1995', imageUrl: 'https://i.ibb.co/v4wDgNKq/Upa-Zoa.jpg', description: 'Rinna banpui, inpeknate leh lainatnate nen kohhran rawngbawltu.', order: 1 },
      { id: 'e2', name: 'Upa R. Lalruata', role: 'Upa', period: '1998', imageUrl: 'https://i.ibb.co/fYQGQ3mW/Ruata.jpg', description: 'Kohhran thawhpui a, inpe zova mi a ni.', order: 2 },
      { id: 'e3', name: 'T. Upa Hminga', role: 'Upa', period: '2005', imageUrl: 'https://i.ibb.co/Gvq96sxK/T-Upa-Hminga.jpg', description: 'Thlarau lam thil hriatna thuk tak nei a, kohhran kaihruaitu.', order: 3 },
      { id: 'e4', name: 'Upa B.L. Thanga', role: 'Upa', period: '2001', imageUrl: 'https://i.ibb.co/Q7LDd8Q9/Upa-Ba.jpg', description: 'A kaihhruaina duhawm tak leh finnate chu malsawmna a ni.', order: 4 },
      { id: 'e5', name: 'Upa David Lalchhanhima', role: 'Upa', period: '2010', imageUrl: 'https://i.ibb.co/fV4FY94Y/Upa-Dav.jpg', description: 'Rawngbawlna thinlung tak pu a, hruaitu a ni.', order: 5 },
      { id: 'e6', name: 'Upa Daikhawzama', role: 'Upa', period: '2008', imageUrl: 'https://i.ibb.co/dJs5HSj0/Upa-DKZ.jpg', description: 'Upa rinawm tak, ngaihtuahna tha tak pe zel a ni.', order: 6 },
      { id: 'e7', name: 'Upa Hmingthanmawia Sailo', role: 'Upa', period: '2012', imageUrl: 'https://i.ibb.co/FL6dnZN1/Upa-Hminga.jpg', description: 'Thlarau lam thil hriatna thuk tak nei a, kohhran kaihruaitu.', order: 7 },
      { id: 'e8', name: 'Upa K. Vanlalhmuaka', role: 'Upa', period: '2015', imageUrl: 'https://i.ibb.co/s9kD2H50/Upa-Hmuaka.jpg', description: 'Kaihhruaina nghet tak pe a, thlamuantu a ni.', order: 8 },
      { id: 'e9', name: 'Upa Lianpianga', role: 'Upa', period: '1999', imageUrl: 'https://i.ibb.co/1fsM0n5b/Upa-Liana.jpg', description: 'Khawtlang tana inpe a, mi ngaihsak tak a ni.', order: 9 },
      { id: 'e10', name: 'Upa H. Zairemmawia', role: 'Upa', period: '2018', imageUrl: 'https://i.ibb.co/jv6HZt58/Upa-Mawia.jpg', description: 'Kohhran chhungah inpeknate a chawh lartu a ni.', order: 10 },
      { id: 'e11', name: 'Upa G. Vanlallawma', role: 'Upa', period: '2003', imageUrl: 'https://i.ibb.co/S4FMThT1/Upa-Sawma.jpg', description: 'Rawngbawltu rinawm tak, Pathian thu vawng tlat a ni.', order: 11 },
      { id: 'e12', name: 'Upa H.L. Tehluna', role: 'Upa', period: '2006', imageUrl: 'https://i.ibb.co/b5TcDF1y/Upa-Tehluna.jpg', description: 'Finna nei a, ngaihsak tak a ni.', order: 12 },
      { id: 'e13', name: 'Upa C. Lalthantluanga', role: 'Upa', period: '2020', imageUrl: 'https://i.ibb.co/MkYn154v/Upa-Tluanga.jpg', description: 'A tawngtainate avanga mi hriat hlawh, Pathian thu hrethiam tak a ni.', order: 13 },
      { id: 'e14', name: 'Upa C. Zohmingthanga', role: 'Upa', period: '2022', imageUrl: 'https://i.ibb.co/7tsDcQDk/Upa-Zaia.jpg', description: 'Ṭhalai program leh rawngbawlnate tana inpe.', order: 14 }
    ] as Staff[],
    weeklyDuty: {
      id: 'current',
      month: 'January',
      thawhlawmChiartute: [
        'T. Upa C. Lalthazuala', 'Pu Kapthuama', 'Pu Nelson Khiangte', 'Pu Lalhmingmawia'
      ],
      buhfaithamHralhtute: [
        'Pi Lalbiakhnuni', 'Pi K. Thangkimi', 'Pi Vanlalnghaki Colney', 'Pi H. Lallawmkimi', 'Pi Rosiammawii', 'Pi Zorampari', 'Pi K. Rochharliani'
      ],
      ushers: [
        'Pu Tluangzathanga', 'Pu Lalhruaitluanga', 'Tv. Lalrochawia', 'Pu Samuel Lalbiakzuala', 'Tv. Zodintluanga', 'Tv. Pauengliana', 'Nl. Lalnunthari', 'Nl. C. Lalrampansangi', 'Nl. Ngurthankimi', 'Nl. Catherine Lalhriatpuii', 'Nl. Anny Lalliandawli', 'Nl. B. Lalrinfeli'
      ],
      weekRange: '05 - 11 January, 2026',
      zaiHruaitu: 'Pu R. Lalmalsawma & Tv. Vanlalchhana',
      pianoTumtu: 'Tv. H. Lalfakawma',
      hlaHriltu: 'Pi C. Lalramthari',
      lightAndSoundDuty: 'Tv. T. Lalnunzira & Pu Lalhmunngheta',
      pangparKhawitu: 'Nl. B. Lalnunsiam & Nl. Lalnunsiami',
      serviceTimes: {
        sundaySchool: '10:30 AM',
        morning: '01:30 PM',
        evening: '07:00 PM'
      },
      serviceTitles: {
        sundaySchool: 'Sunday School',
        morning: 'Chawhnu Inkhawm',
        evening: 'Zan Inkhawm'
      },
      // FIX: Changed servicePrograms to use ProgramField[] structure to match types.ts
      servicePrograms: {
        sundaySchool: [
          { id: 'ss1', label: 'Zirlai', value: '' },
          { id: 'ss2', label: 'Zirtirtu', value: '' }
        ],
        morning: [
          { id: 'm1', label: 'Tantu', value: '' },
          { id: 'm2', label: 'Thuhriltu', value: '' }
        ],
        evening: [
          { id: 'e1', label: 'Tantu', value: '' },
          { id: 'e2', label: 'Thuhriltu', value: '' }
        ]
      },
      midWeek: {
        nilai: {
          title: 'Nilai Zan Inkhawm',
          time: '07:00 PM',
          hruaitu: '',
          tantu: '',
          thupui: '',
          thuhriltu: ''
        },
        inrinni: {
          title: 'Inrinni Zan Inkhawm',
          time: '07:00 PM',
          hruaitu: '',
          tantu: '',
          thupui: '',
          thuhriltu: ''
        }
      }
    } as WeeklyDuty
  }
};

export const getConstants = (lang: Language) => DATA[lang];

// Exports for backward compatibility with old components
export const ANNOUNCEMENTS_DATA = DATA.en.announcements;
// FIX: Export SERMONS_DATA for backward compatibility and to resolve import errors.
export const SERMONS_DATA = DATA.en.sermons;
export const EVENTS_DATA = DATA.en.events.map(e => ({
    day: e.dayOfWeek !== undefined ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][e.dayOfWeek] : 'Special',
    time: e.time,
    name: e.title,
    leader: e.program?.thuhriltu || e.program?.hruaitu || 'TBD'
}));

// LEADERS_DATA will now be dynamically fetched, this constant is kept as a placeholder/backup.
export const LEADERS_DATA = DATA.en.pastors.map(p => ({
    name: p.name,
    role: p.role,
    imageUrl: p.imageUrl,
    tenure: p.period
}));


import { Announcement, Event, Ministry, Staff, WeeklyDuty, Sermon } from './types';
import { Language } from './translations';

export const CHURCH_NAME = "Mizoram Synod (PCI) Champhai Bethel Kohhran";

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
    // FIX: Add sermon data.
    sermons: [
      {
        id: 's1',
        title: 'The Good Shepherd',
        date: '2024-05-12',
        preacher: 'Rev. Dr. Lalnunsanga',
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
        preacher: 'Rev. Dr. Lalnunsanga',
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
        description: 'The Youth Fellowship of the church, dedicated to serving Christ through music, evangelism, and social work.',
        leader: 'Tv. Lalrinfela (Leader)',
        schedule: 'Every Monday @ 7:00 PM',
        image: 'https://picsum.photos/800/600?random=10'
      }
    ] as Ministry[],
    pastors: [
      {
        id: 'p1',
        name: 'Rev. Dr. Lalnunsanga',
        role: 'Senior Pastor',
        imageUrl: 'https://picsum.photos/200/200?random=20'
      }
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
      pangparKhawitu: 'Nl. B. Lalnunsiam & Nl. Lalnunsiami'
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
    // FIX: Add sermon data.
    sermons: [
        {
            id: 's1',
            title: 'Berampu Ṭha',
            date: '2024-05-12',
            preacher: 'Rev. Dr. Lalnunsanga',
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
        description: 'Kohhran ṭhalai rualte rawngbawlna.',
        leader: 'Tv. Lalrinfela (Leader)',
        schedule: 'Thawhṭanni @ 7:00 PM',
        image: 'https://picsum.photos/800/600?random=10'
      }
    ] as Ministry[],
    pastors: [
      {
        id: 'p1',
        name: 'Rev. Dr. Lalnunsanga',
        role: 'Senior Pastor',
        imageUrl: 'https://picsum.photos/200/200?random=20'
      }
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
      pangparKhawitu: 'Nl. B. Lalnunsiam & Nl. Lalnunsiami'
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

export const LEADERS_DATA = DATA.en.pastors.map(p => ({
    name: p.name,
    role: p.role,
    imageUrl: p.imageUrl,
    tenure: p.period
}));

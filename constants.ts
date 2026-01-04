import { Announcement, Event, Ministry, Sermon, Staff } from './types';
import { Language } from './translations';

export const CHURCH_NAME = "Mizoram Synod (PCI) Champhai Bethel Kohhran";

// DATA STORES
const DATA = {
  en: {
    announcements: [
      {
        id: '1',
        title: 'Urgent Prayer Request',
        date: '2023-10-27',
        category: 'Emergency',
        content: 'Please pray for Upa Lalnuntluanga regarding his surgery tomorrow.'
      },
      {
        id: '2',
        title: 'KTP General Conference Registration',
        date: '2023-10-25',
        category: 'Youth',
        content: 'Registration for the upcoming General Conference is open until Sunday.'
      },
      {
        id: '3',
        title: 'Community Work (Hnatlang)',
        date: '2023-10-24',
        category: 'General',
        content: 'Mass social work at Church premises on Saturday morning, 7:00 AM.'
      }
    ] as Announcement[],
    events: [
      {
        id: 'wed-service',
        title: 'Nilai Zan (Wednesday Night)',
        dayOfWeek: 3, // Wednesday
        time: '07:00 PM',
        location: 'Biak In',
        description: 'Mid-week service focusing on biblical themes.',
        type: 'Service',
        isRecurringTemplate: true,
        program: {
          tantu: 'Reader Name',
          thupui: 'Biblical Theme',
          hawngtu: 'Opener Name'
        }
      },
      {
        id: 'sat-service',
        title: 'Inrinni Zan (Saturday Night)',
        dayOfWeek: 6, // Saturday
        time: '07:00 PM',
        location: 'Biak In',
        description: 'Preparation service for the Lord\'s Day.',
        type: 'Service',
        isRecurringTemplate: true,
        program: {
          tantu: 'Reader Name',
          thuhriltu: 'Speaker Name'
        }
      },
      {
        id: 'sun-am',
        title: 'Pathianni Chawhma (Sunday Morning)',
        dayOfWeek: 0, // Sunday
        time: '10:00 AM',
        location: 'Biak In',
        description: 'Sunday School and Morning Service.',
        type: 'Service',
        isRecurringTemplate: true,
        program: {
          tantu: 'Intermediate Dept Student' // SS Tantu
        }
      },
      {
        id: 'sun-pm',
        title: 'Pathianni Chawhnu (Sunday Afternoon)',
        dayOfWeek: 0, // Sunday
        time: '01:30 PM',
        location: 'Biak In',
        description: 'Afternoon Devotional Service.',
        type: 'Service',
        isRecurringTemplate: true,
        program: {
          tantu: 'Reader Name',
          thuhriltu: 'Speaker Name'
        }
      },
      {
        id: 'sun-night',
        title: 'Pathianni Zan (Sunday Night)',
        dayOfWeek: 0, // Sunday
        time: '07:00 PM',
        location: 'Biak In',
        description: 'Gospel Service.',
        type: 'Service',
        isRecurringTemplate: true,
        program: {
          thuhriltu: 'Speaker Name'
        }
      }
    ] as any[], // Typing as any[] temporarily to allow 'dayOfWeek' which matches updated interface
    sermons: [
      {
        id: '1',
        title: 'Walking in Faith',
        preacher: 'Rev. Lalhmingliana',
        date: '2023-10-22',
        description: 'An inspiring message on trusting God through difficult times.',
        videoUrl: 'dQw4w9WgXcQ' // Mock ID
      },
      {
        id: '2',
        title: 'The Power of Prayer',
        preacher: 'Pastor Zosangliana',
        date: '2023-10-15',
        description: 'Understanding the impact of intercessory prayer in our daily lives.'
      }
    ] as Sermon[],
    ministries: [
      {
        id: 'ktp',
        name: 'Kristian Ṭhalai Pawl',
        acronym: 'KTP',
        description: 'The Youth Fellowship of the church, dedicated to serving Christ through music, evangelism, and social work.',
        leader: 'Tv. Lalrinfela (Leader)',
        schedule: 'Every Monday @ 7:00 PM',
        image: 'https://picsum.photos/800/600?random=10'
      },
      {
        id: 'kpvm',
        name: 'Kohhran Hmeichhe Pawl',
        acronym: 'KPVM',
        description: 'Women\'s Fellowship focusing on family values, prayer, and charity.',
        leader: 'Pi Lalthlamuani (Chairperson)',
        schedule: 'Every Tuesday @ 1:00 PM',
        image: 'https://picsum.photos/800/600?random=11'
      },
      {
        id: 'pavlai',
        name: 'Pavalai Pawl',
        description: 'Men\'s Fellowship strengthening the pillars of families and the church.',
        leader: 'Pu R. Vanlalsawma',
        schedule: 'Every Thursday @ 7:00 PM',
        image: 'https://picsum.photos/800/600?random=12'
      }
    ] as Ministry[],
    pastors: [
      {
        id: 'p1',
        name: 'Rev. Dr. Lalnunsanga',
        role: 'Senior Pastor',
        imageUrl: 'https://picsum.photos/200/200?random=20'
      },
      {
        id: 'p2',
        name: 'Pastor Lalruatkima',
        role: 'Associate Pastor',
        imageUrl: 'https://picsum.photos/200/200?random=21'
      }
    ] as Staff[]
  },
  mizo: {
    announcements: [
      {
        id: '1',
        title: 'Ṭawngṭai Pui Ngai',
        date: '2023-10-27',
        category: 'Emergency',
        content: 'Upa Lalnuntluanga naktuk a zai a nih dawn avangin Kohhran hote ṭawngṭaipuina kan ngen e.'
      },
      {
        id: '2',
        title: 'KTP General Conference Inkhian',
        date: '2023-10-25',
        category: 'Youth',
        content: 'KTP General Conference kal turte tan Pathianni thleng inkhian theih a ni e.'
      },
      {
        id: '3',
        title: 'Kohhran Hnatlang',
        date: '2023-10-24',
        category: 'General',
        content: 'Inrinni hian Biak In hung chhung tihfai hnatlang neih tur a ni a, dar 7:00 AM ah ṭan tur a ni.'
      }
    ] as Announcement[],
    events: [
      {
        id: 'wed-service',
        title: 'Nilai Zan',
        dayOfWeek: 3, // Wednesday
        time: '07:00 PM',
        location: 'Biak In',
        description: 'Thupui Zir Inkhawm',
        type: 'Service',
        isRecurringTemplate: true,
        program: {
          tantu: 'Tantu Tur',
          thupui: 'Thupui',
          hawngtu: 'Hawngtu Tur'
        }
      },
      {
        id: 'sat-service',
        title: 'Inrinni Zan',
        dayOfWeek: 6, // Saturday
        time: '07:00 PM',
        location: 'Biak In',
        description: 'Ṭawngṭai Inkhawm',
        type: 'Service',
        isRecurringTemplate: true,
        program: {
          tantu: 'Tantu Tur',
          thuhriltu: 'Thuhriltu Tur'
        }
      },
      {
        id: 'sun-am',
        title: 'Pathianni Chawhma',
        dayOfWeek: 0, // Sunday
        time: '10:00 AM',
        location: 'Biak In',
        description: 'Sunday School leh Chawhma Inkhawm',
        type: 'Service',
        isRecurringTemplate: true,
        program: {
          tantu: 'Intermediate Dept Zirlai' // SS Tantu only
        }
      },
      {
        id: 'sun-pm',
        title: 'Pathianni Chawhnu',
        dayOfWeek: 0, // Sunday
        time: '01:30 PM',
        location: 'Biak In',
        description: 'Chawhnu Inkhawm',
        type: 'Service',
        isRecurringTemplate: true,
        program: {
          tantu: 'Tantu Tur',
          thuhriltu: 'Thuhriltu Tur'
        }
      },
      {
        id: 'sun-night',
        title: 'Pathianni Zan',
        dayOfWeek: 0, // Sunday
        time: '07:00 PM',
        location: 'Biak In',
        description: 'Pathianni Zan Inkhawm',
        type: 'Service',
        isRecurringTemplate: true,
        program: {
          thuhriltu: 'Thuhriltu Tur'
        }
      }
    ] as Event[],
    sermons: [
      {
        id: '1',
        title: 'Rinnaa Kal',
        preacher: 'Rev. Lalhmingliana',
        date: '2023-10-22',
        description: 'Harsatna karah pawh Pathian rinchhan chunga kal zel tur a fuihna.',
        videoUrl: 'dQw4w9WgXcQ'
      },
      {
        id: '2',
        title: 'Ṭawngṭai Thiltihtheihna',
        preacher: 'Pastor Zosangliana',
        date: '2023-10-15',
        description: 'Kan nitin nuna ṭawngṭai pawimawh zia leh a thiltihtheihna.',
      }
    ] as Sermon[],
    ministries: [
      {
        id: 'ktp',
        name: 'Kristian Ṭhalai Pawl',
        acronym: 'KTP',
        description: 'Kohhran ṭhalai rualte, Isua Krista rawngbawlna, zaia rawngbawlna leh khawtlang tana thawk chhuak turin.',
        leader: 'Tv. Lalrinfela (Leader)',
        schedule: 'Thawhṭanni @ 7:00 PM',
        image: 'https://picsum.photos/800/600?random=10'
      },
      {
        id: 'kpvm',
        name: 'Kohhran Hmeichhe Pawl',
        acronym: 'KPVM',
        description: 'Chhungkua leh khawtlanga nu te mawhphurhna hlen tura inbuatsaihna.',
        leader: 'Pi Lalthlamuani (Chairperson)',
        schedule: 'Thawhlehni @ 1:00 PM',
        image: 'https://picsum.photos/800/600?random=11'
      },
      {
        id: 'pavlai',
        name: 'Pavalai Pawl',
        description: 'Chhungkua leh kohhran ban nghet tak ni tura pa te inunauna.',
        leader: 'Pu R. Vanlalsawma',
        schedule: 'Ningani @ 7:00 PM',
        image: 'https://picsum.photos/800/600?random=12'
      }
    ] as Ministry[],
    pastors: [
      {
        id: 'p1',
        name: 'Rev. Dr. Lalnunsanga',
        role: 'Senior Pastor',
        imageUrl: 'https://picsum.photos/200/200?random=20'
      },
      {
        id: 'p2',
        name: 'Pastor Lalruatkima',
        role: 'Associate Pastor',
        imageUrl: 'https://picsum.photos/200/200?random=21'
      }
    ] as Staff[]
  }
};

export const getConstants = (lang: Language) => DATA[lang];

// Exports for backward compatibility with old `views` components to fix build errors.
export const ANNOUNCEMENTS_DATA = DATA.en.announcements;

// The old Event type was different, so we map the new data structure to the old one.
export const EVENTS_DATA = DATA.en.events.map(e => ({
    day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][e.dayOfWeek],
    time: e.time,
    name: e.title,
    leader: e.program?.thuhriltu || e.program?.hawngtu || e.program?.tantu || 'TBD'
}));

// The old Sermon type was different, so we map to it.
export const SERMONS_DATA = DATA.en.sermons.map(s => ({
    title: s.title,
    speaker: s.preacher,
    date: s.date,
    scripture: "John 3:16", // Old type had scripture, new one doesn't. Add placeholder.
    audioUrl: s.audioUrl || '#'
}));

// The old Leaders data was different, so we map to it.
export const LEADERS_DATA = DATA.en.pastors.map(p => ({
    name: p.name,
    role: p.role,
    imageUrl: p.imageUrl,
    tenure: p.period
}));
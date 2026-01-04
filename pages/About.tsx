
import React from 'react';
import { Users, BookOpen, Heart, Scroll, Activity, Home, ArrowLeftRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getConstants } from '../constants';

const About: React.FC = () => {
  const { language, t } = useLanguage();
  const { pastors } = getConstants(language);

  const heroBgUrl = "https://i.ibb.co/G4kcMqmM/117973144-786352218785464-3747589953800462999-n.jpg";

  const DOCTRINE_ARTICLES = [
    {
      title: "Thurin I",
      text: "Thuthlung Hlui leh Thuthlung Thar Bute hi Pathian Thu a ni a, hêng chauh hi rinna leh thiltih tehna dik lo thei lo a ni."
    },
    {
      title: "Thurin II",
      text: "Pathian pakhat chauh a awm a, Amah chauh chu biak tûr a ni. Amah chu Thlarau, mahnia awma, hmun tina awm, thlarau dang zawng zawng leh thil dang rêng rêng laka hrang si a ni a. A miziaah te, finnaah te, thiltihtheihnaah te, thianghlimnaah te, diknaah te, thatnaah te, taknaah te leh hmangaihnaah te tâwp chin nei lo, chatuan mi, danglam ngai lo a ni."
    },
    {
      title: "Thurin III",
      text: "Pathianah chuan Minung pathum, Pa leh Fapa leh Thlarau Thianghlim an awm a, an pathum hian Pathian pakhat an ni a, nihna thuhmun, thiltihtheihna leh ropuinaa intluk an ni."
    },
    {
      title: "Thurin IV",
      text: "Lei leh vân leh a chhunga thil awm zawng zawng siamtu Pathian chuan mihringte hi, hriatna, felna leh thianghlimnaa Ama anpuiin mipaah leh hmeichhiaah a siam a. Mi zawng zawng hi bul thuhmun leh chhûngkaw khata unau anga inthui khâwm vek kan ni."
    },
    {
      title: "Thurin V",
      text: "Mihringte chuan anmahni duhthû ngeiin Pathian dân an bawhchhia a, thiam lohna leh chhiatnaah chuan anmahni an inbarh lût ta a. Chu thiam lohna leh chhiatna leh sual hremna ata chu anmahni chhanchhuak tûr leh, chatuan nunna pe tûrin, hmangaihna tâwp nei lo Pathian chuan, A chatuan Fapa neih chhun Lal Isua Krista chu khawvêlah a rawn tîr a; Ama zârah chauh chuan mihringte hi chhandamin an awm thei a. Chu Chatuan Fapa chu mihring takah a lo chang a, minung pakhat mize pahnih nei, Pathian tak leh mihring tak a ni kumkhua ta a ni. Thlarau Thianghlim thiltihtheihnain nula thianghlim Mari chuan a pai a, a hring a; mahse, sual a nei lo. Mi sualte tân Pathian dân chu a zâwm famkim a, Pathianin dikna a phût hlen chhuak tûr leh mihringte Pathian remtîr tûrin, inthawina tak leh famkim atân a inhlân a, kraws-ah a thi a, phûmin a awm a, ni thum niah mitthi zing ata a tho leh a. Pathian ding lamah a han chho va, chutah chuan a mite tân a dîlsak reng a, chuta tang chuan mitthite kaitho tûr leh khawvêl rorêl tûrin a lo kal leh ang."
    },
    {
      title: "Thurin VI",
      text: "Thlarau Thianghlim, nunna petu, Pa leh Fapa ata lo chhuak chuan mihringte chu chhandamna changtuah a siam a, an sualzia leh chungpikziate a hriat chiantîr a. Krista hriatna kawngah an rilru a tivâr a, an duhthlannate chawk thovin, Isua Krista chu an Lalpa leh Chhandamtua pawm tûra ngênin, pawm thei tûrin a pui a, anmahniah felna rah chi tinrêng a thawk chhuak thîn."
    },
    {
      title: "Thurin VII",
      text: "Pathianin Kristaah chuan mi zawng zawng hnênah chhandamna famkim chu a thlâwnin a rawn hlân a, an sualte sim tûr leh Lal Isua Krista chu an Chhandamtu atâna ring tûr te, Amah entawna, Pathian duh ang taka inngaitlâwm leh thianghlima nung tûr tein thu a pe a. Krista chu ringa a thu zâwmtute chu chhandam an ni a, sual ngaihdamna te, thiam chantîrna te, Pathian fa nihna te, Thlarau Thianghlim chênpuina azâra tihthianghlimna te, chatuan ropuina te an chang a. Ringtute chuan tûn dam chhûng pawhin chhandam nih inhriat chianna lâwmawm tak chu an chang thei a. Thlarau Thianghlim chuan khawngaihna hna a thawhin, Thu te, Hlâ te, Sakramen te, Tawngtaina te hi hmanruaah a hmang deuh bîk thîn a ni."
    },
    {
      title: "Thurin VIII",
      text: "Krista din chhuah Sakramen-te chu Baptisma leh Lalpa Zanriahte hi an ni. Baptisma chu Krista nêna kan inzawmna te, Thlarau Thianghlim zâra piantharna leh tihnunna chhinchhiahna leh nemnghehna a ni a, Lalpa hnêna kan inhlanna thiltih a ni bawk. Baptisma-ah chuan Pa leh Fapa leh Thlarau Thianghlim hminga sil fai entîr nân tui hman a ni a. An sualte sima, Krista chu an Chhandamtu atân an ring tih puangtute leh an fate chantîr tûr a ni.\n\Lalpa Zanriah chu Krista thihna hriat reng nâna chhang leh uain chan ho hi a ni a, ringtuten Krista thihnaa hlâwkna an chan chhinchhiahna leh nemnghehna a ni. Ama mite chuan Amah leh a inhlanna an pawmzia te, an hlâwkpuizia te, a rawngbawl tûra an inpêk zêlna te, Amah an pâwlna leh mi dang nêna an inpâwlna te entîr nân, A lo kal leh hma loh chuan an chang ho thîn tûr a ni. Sakramen hlâwknate chu Krista malsâwmna avâng leh rinnaa changtuah A Thlarauvin a thawh avânga lo awm a ni."
    },
    {
      title: "Thurin IX",
      text: "Ringtu zawng zawng tih tûr chu Kohhran inpâwl honaa tel te, Krista Sakramen leh a thil serh dang vawn that te, A dân zawm te, tawngtai zêl te, Lalpa Ni serh thianghlim te, Amah be ho tûra inkhâwm te, A Thu hril ngun taka ngaihthlâk te, Pathian malsâwmna an dawn ang zêla hlim taka pêk ve thung te, anmahniho zîngah leh mi zawng zawng zîngah Krista nungchang ang tihlan te, khawvêl puma Krista ram tizau tûra beih te, ropui taka a lo kal lehna hun nghah te hi a ni."
    },
    {
      title: "Thurin X",
      text: "Ni hnuhnûngah chuan mitthite chu kaihthawhin an awm ang a, mi zawng zawng Krista rorêlna thutphah hmaah an lang ang a, he dam chhûnga an thiltih that leh that loh ang zêlin rêlsak an ni ang. Ringlote leh mi sualte chuan thiam loh changin an sual hremna an tuar ang; Krista ring a, a thu zâwmtute erawh chu a langchanga thiam chantîrin an awm ang a, ropuinaa lawm luhin an awm ang."
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Header */}
      <div 
        className="relative py-24 bg-cover bg-center flex items-center justify-center text-center px-4"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url("${heroBgUrl}")` }}
      >
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 shadow-sm">{t.about.title}</h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-200">
            {t.about.subtitle}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Vision & Mission */}
        <div className="grid md:grid-cols-3 gap-8 mb-20 -mt-20 relative z-20">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center border-t-4 border-church-500">
            <div className="w-12 h-12 bg-church-100 text-church-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen />
            </div>
            <h3 className="text-xl font-bold mb-2">{t.about.historyTitle}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {t.about.historyText}
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg text-center border-t-4 border-church-500">
            <div className="w-12 h-12 bg-church-100 text-church-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users />
            </div>
            <h3 className="text-xl font-bold mb-2">{t.about.missionTitle}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {t.about.missionText}
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg text-center border-t-4 border-church-500">
            <div className="w-12 h-12 bg-church-100 text-church-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart />
            </div>
            <h3 className="text-xl font-bold mb-2">{t.about.faithTitle}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {t.about.faithText}
            </p>
          </div>
        </div>

        {/* KOHHRAN THURIN (CHURCH DOCTRINE) */}
        <div className="mb-20 bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-church-50 text-church-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scroll size={32} />
            </div>
            <h2 className="text-3xl font-serif font-bold text-church-900 mb-4">KOHHRAN THURIN</h2>
            <div className="w-24 h-1 bg-church-500 mx-auto mb-6"></div>
            <p className="text-slate-600 text-sm leading-relaxed max-w-4xl mx-auto italic">
              "India Ram Presbyterian Kohhran chuan (Apostol-te Thuvawn te, Nicea Thuvawn te, Westminster Thurin Puanchhuahna leh Wales Ram Presbyterian Kohhran Thurin Puanchhuahna te chu Pathian Thu hrilhfiahna tha tawka ngaia, Kohhranah leh Pathian thu zirna hmunahte thurin innghahna atâna zirtîr tlâk nia pawm tlat chungin), a hnuaia Thurin Puanchhuahna thute hi a Pastor-te, Probationary Pastor-te, Upate leh Kohhrana dânzawhkimten an vawn ngheh tlat atân a pawm a ni."
            </p>
          </div>

          <div className="grid gap-6">
            {DOCTRINE_ARTICLES.map((article, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-6 border-l-4 border-church-500">
                <h3 className="font-bold text-lg text-church-800 mb-2">{article.title}</h3>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{article.text}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center text-xs text-slate-400">
            Source : India ram Presbyterian Kohhran Dân Bu 2022 (Ninth Revised Edition 2022)
          </div>
        </div>

        {/* Our Pastors */}
        <div className="mb-16">
          <h2 className="text-3xl font-serif font-bold text-church-900 mb-8 text-center">{t.about.shepherdsTitle}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
            {pastors.map((pastor) => (
              <div key={pastor.id} className="bg-white rounded-lg overflow-hidden shadow-md group hover:shadow-xl transition-shadow duration-300 border border-slate-100">
                <div className="aspect-square overflow-hidden bg-slate-200">
                  <img 
                    src={pastor.imageUrl} 
                    alt={pastor.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-slate-800">{pastor.name}</h3>
                  <p className="text-church-600 font-medium">{pastor.role}</p>
                  {pastor.period && <p className="text-slate-500 text-sm mt-1">{pastor.period}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
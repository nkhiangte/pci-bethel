
export interface QuarterlySyllabusItem {
  period: string;
  hla: string;
  thu: string;
  thuInchhang?: string;
  solfaZir?: string;
}

export const quarterlySyllabusData: Record<string, QuarterlySyllabusItem[]> = {
  beginner: [
    {
      period: "January - March",
      hla: "NPHB No. 6 (Fak ru, fak ru, naupang tê tak te u)",
      thu: "Sam 15:1-3",
      thuInchhang: "Part I Bung 5"
    },
    {
      period: "April - June",
      hla: "NPHB No. 2 (Sîrvatê, I zai sa)",
      thu: "Thufingte 3:1-3",
      thuInchhang: "Part I Bung 6"
    },
    {
      period: "July - September",
      hla: "NPHB No. 8 (Lâwm thu kan hrilh che, aw Lalpa)",
      thu: "Johana 3:16-17",
      thuInchhang: "Part I Bung 7"
    },
    {
      period: "October - December",
      hla: "NPHB No. 10 (Aw Lalpa thilthlâwn min pêkte hi)",
      thu: "Luka 1:68-69",
      thuInchhang: "Part I Bung 8"
    }
  ],
  primary: [
    {
      period: "January - March",
      hla: "NPHB No. 49 (Leiah hian vâkvaite)",
      thu: "Sam 1:1-6",
      thuInchhang: "Part II Bung 5"
    },
    {
      period: "April - June",
      hla: "NPHB No. 14 (Leilung mawina i siamin)",
      thu: "Matthaia 6:19-21",
      thuInchhang: "Part II Bung 6"
    },
    {
      period: "July - September",
      hla: "NPHB No. 24 (Aw nangni, Kristian naupangte u)",
      thu: "Galatia 5:22-26",
      thuInchhang: "Part II Bung 7"
    },
    {
      period: "October - December",
      hla: "NPHB No. 18 (Ranthlêngah hmun tlâwmah)",
      thu: "1 Johana 5:1-5",
      thuInchhang: "Part II Bung 8"
    }
  ],
  junior: [
    {
      period: "January - March",
      hla: "NPHB No. 21 (Ka lu-ah i kut nghat ang che)",
      thu: "Johana 3:14-21",
      thuInchhang: "Part III Bung 9",
      solfaZir: "Solfa Zirna Bu Ṭhen II-na, Bung 1"
    },
    {
      period: "April - June",
      hla: "NPHB No. 102 (Mi lungngaia chu tu nge?)",
      thu: "Ṭah Hla 3:22-28",
      thuInchhang: "Part III Bung 10",
      solfaZir: "Solfa Zirna Bu Ṭhen II-na, Bung 2"
    },
    {
      period: "July - September",
      hla: "NPHB No. 35 (Angel hovin Zion ṭingtang)",
      thu: "Galatia 6:14-17",
      thuInchhang: "Part III Bung 11",
      solfaZir: "Solfa Zirna Bu Ṭhen II-na, Bung 3"
    },
    {
      period: "October - December",
      hla: "NPHB No. 74 (Aw, vân lêng rual, zai thiam te u)",
      thu: "Thupuan 2:8-11",
      thuInchhang: "Part III Bung 12",
      solfaZir: "Solfa Zirna Bu Ṭhen II-na, Bung 4&5"
    }
  ],
  intermediate: [
    {
      period: "January - March",
      hla: "NPHB No. 172 (Chhandamna hla mawi sain)",
      thu: "Johana 10:7-16",
      thuInchhang: "Part IV Bung 5",
      solfaZir: "Solfa Zirna Bu Ṭhen III-na, Bung 1"
    },
    {
      period: "April - June",
      hla: "NPHB No. 192 (Lo chêng ve la, kan rûn chhûngan)",
      thu: "Rom 8:1-8",
      thuInchhang: "Part IV Bung 6",
      solfaZir: "Solfa Zirna Bu Ṭhen III-na, Bung 2"
    },
    {
      period: "July - September",
      hla: "NPHB No. 125 (Lal Isua tân khawvêl lâk, kan tum ber lo ni se)",
      thu: "PCI Thurin No. 8",
      thuInchhang: "Part IV Bung 7",
      solfaZir: "Solfa Zirna Bu Ṭhen III-na, Bung 3"
    },
    {
      period: "October - December",
      hla: "NPHB No. 83 (Hmânah Kaisar lal lian rêngpui)",
      thu: "PCI Thurin No. 9&10",
      thuInchhang: "Part IV Bung 8",
      solfaZir: "Solfa Zirna Bu Ṭhen III-na, Bung 4"
    }
  ],
  sacrament: [
    {
      period: "January - March",
      hla: "NPHB No. 172",
      thu: "Johana 10:7-16",
      thuInchhang: "Part IV Bung 5",
      solfaZir: "Solfa Zirna Bu Ṭhen III-na, Bung 4"
    },
    {
      period: "April - June",
      hla: "NPHB No. 192",
      thu: "Rom 8:1-8",
      thuInchhang: "Part IV Bung 6",
      solfaZir: "Solfa Zirna Bu Ṭhen III-na, Bung 5"
    },
    {
      period: "July - September",
      hla: "NPHB No. 125",
      thu: "PCI Thurin No. 8",
      thuInchhang: "Part IV Bung 7",
      solfaZir: "Solfa Zirna Bu Ṭhen III-na, Bung 6"
    },
    {
      period: "October - December",
      hla: "NPHB No. 83",
      thu: "PCI Thurin No. 9&10",
      thuInchhang: "Part IV Bung 8",
      solfaZir: "Solfa Zirna Bu Ṭhen III-na, Bung 7"
    }
  ],
  senior: [
    {
      period: "January - March",
      hla: "KHB No. 273 (Lalpa, i hming mawi hi)",
      thu: "1 Thessalonika 5:14-24",
      solfaZir: "Solfa Zirna Bu Ṭhen IV-na Bung 1 & 2"
    },
    {
      period: "April - June",
      hla: "KHB No. 419 (Ngai r’u, rawngbâwlru zawng zawngte u)",
      thu: "PCI Thurin No. 1-3",
      solfaZir: "Solfa Zirna Bu Ṭhen IV-na Bung 3 & 4"
    },
    {
      period: "July - September",
      hla: "KHB No. 30 (Thlalêra ka vahvaih chhûng hian)",
      thu: "PCI Thurin No. 4&5",
      solfaZir: "Solfa Zirna Bu Ṭhen IV-na Bung 5"
    },
    {
      period: "October - December",
      hla: "KHB No. 85 (Berâmpute berâm vênga)",
      thu: "PCI Thurin No. 6&7",
      solfaZir: "Solfa Zirna Bu Ṭhen IV-na Bung 6"
    }
  ]
};

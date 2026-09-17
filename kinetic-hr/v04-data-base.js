const CONFIG = {
  sectors: {
    EDU: {
      ar:'التعليم', en:'Education', levelLabel:{ar:'المرحلة',en:'Stage'}, categoryLabel:{ar:'المسار',en:'Track'}, burdenUnit:{ar:'تعرض تشغيلي-سنة',en:'operational-exposure-years'},
      locations:[{id:'07',ar:'الجوف',en:'Al-Jawf'},{id:'02',ar:'مكة المكرمة',en:'Makkah'},{id:'01',ar:'الرياض',en:'Riyadh'}],
      levels:[{id:'L1',ar:'ابتدائي',en:'Primary'},{id:'L2',ar:'متوسط',en:'Intermediate'},{id:'L3',ar:'ثانوي',en:'Secondary'}],
      categories:[{id:'A',ar:'مسار أ',en:'Track A'},{id:'B',ar:'مسار ب',en:'Track B'}]
    },
    HLT: {
      ar:'الصحة',en:'Health',levelLabel:{ar:'الدرجة المهنية',en:'Professional Grade'},categoryLabel:{ar:'نوع المنشأة',en:'Facility Type'},burdenUnit:{ar:'تعرض تشغيلي-سنة',en:'operational-exposure-years'},
      locations:[{id:'01',ar:'الرياض',en:'Riyadh'},{id:'02',ar:'جدة',en:'Jeddah'},{id:'03',ar:'الدمام',en:'Dammam'}],
      levels:[{id:'G1',ar:'ممارس',en:'Practitioner'},{id:'G2',ar:'أخصائي',en:'Specialist'},{id:'G3',ar:'أخصائي أول',en:'Senior Specialist'}],
      categories:[{id:'H',ar:'مستشفى',en:'Hospital'},{id:'C',ar:'مركز',en:'Center'}]
    },
    MUN: {
      ar:'الخدمات البلدية',en:'Municipal Services',levelLabel:{ar:'المستوى الوظيفي',en:'Job Level'},categoryLabel:{ar:'نوع الخدمة',en:'Service Type'},burdenUnit:{ar:'تعرض تشغيلي-سنة',en:'operational-exposure-years'},
      locations:[{id:'01',ar:'الرياض',en:'Riyadh'},{id:'02',ar:'جدة',en:'Jeddah'},{id:'03',ar:'الخبر',en:'Al Khobar'}],
      levels:[{id:'J1',ar:'مستوى 1',en:'Level 1'},{id:'J2',ar:'مستوى 2',en:'Level 2'},{id:'J3',ar:'مستوى 3',en:'Level 3'}],
      categories:[{id:'F',ar:'ميداني',en:'Field'},{id:'O',ar:'مكتبي',en:'Office'}]
    },
    GOV: {
      ar:'الخدمات الحكومية المشتركة',en:'Government Corporate Services',levelLabel:{ar:'المستوى',en:'Level'},categoryLabel:{ar:'نوع الوحدة',en:'Unit Type'},burdenUnit:{ar:'تعرض تشغيلي-سنة',en:'operational-exposure-years'},
      locations:[{id:'01',ar:'المركز الرئيسي',en:'Headquarters'},{id:'02',ar:'المنطقة الغربية',en:'Western Region'},{id:'03',ar:'المنطقة الشرقية',en:'Eastern Region'}],
      levels:[{id:'P1',ar:'اختصاصي',en:'Professional'},{id:'P2',ar:'قيادي',en:'Leadership'}],
      categories:[{id:'C',ar:'مركزي',en:'Central'},{id:'R',ar:'إقليمي',en:'Regional'}]
    }
  }
};

let SNAPSHOTS = [
  {source_row:'demo-001',position_group_id:'PG-EDU-001',sector:'EDU',location:'07',ssco:'233014',level:'L3',category:'A',needed:56,filled:38,scarcity:3,substitutes:0,avgVacancyWeeks:31,criticality:3,affectedUnits:420},
  {source_row:'demo-002',position_group_id:'PG-EDU-002',sector:'EDU',location:'02',ssco:'233033',level:'L2',category:'A',needed:84,filled:76,scarcity:2,substitutes:1,avgVacancyWeeks:18,criticality:3,affectedUnits:680},
  {source_row:'demo-003',position_group_id:'PG-EDU-003',sector:'EDU',location:'01',ssco:'233010',level:'L3',category:'B',needed:73,filled:70,scarcity:1,substitutes:2,avgVacancyWeeks:9,criticality:2,affectedUnits:510},
  {source_row:'demo-004',position_group_id:'PG-HLT-001',sector:'HLT',location:'01',ssco:'222113',level:'G2',category:'H',needed:120,filled:91,scarcity:3,substitutes:0,avgVacancyWeeks:27,criticality:3,affectedUnits:1900},
  {source_row:'demo-005',position_group_id:'PG-HLT-002',sector:'HLT',location:'02',ssco:'221209',level:'G3',category:'H',needed:42,filled:35,scarcity:3,substitutes:1,avgVacancyWeeks:34,criticality:3,affectedUnits:740},
  {source_row:'demo-006',position_group_id:'PG-HLT-003',sector:'HLT',location:'03',ssco:'226404',level:'G1',category:'C',needed:65,filled:61,scarcity:2,substitutes:1,avgVacancyWeeks:14,criticality:2,affectedUnits:530},
  {source_row:'demo-007',position_group_id:'PG-MUN-001',sector:'MUN',location:'01',ssco:'325706',level:'J2',category:'F',needed:96,filled:72,scarcity:2,substitutes:0,avgVacancyWeeks:22,criticality:3,affectedUnits:2600},
  {source_row:'demo-008',position_group_id:'PG-MUN-002',sector:'MUN',location:'02',ssco:'216403',level:'J3',category:'O',needed:38,filled:33,scarcity:3,substitutes:1,avgVacancyWeeks:29,criticality:2,affectedUnits:85},
  {source_row:'demo-009',position_group_id:'PG-MUN-003',sector:'MUN',location:'03',ssco:'226301',level:'J1',category:'F',needed:74,filled:71,scarcity:1,substitutes:2,avgVacancyWeeks:8,criticality:2,affectedUnits:1200},
  {source_row:'demo-010',position_group_id:'PG-GOV-001',sector:'GOV',location:'01',ssco:'242309',level:'P1',category:'C',needed:28,filled:19,scarcity:3,substitutes:0,avgVacancyWeeks:24,criticality:3,affectedUnits:18}
];

const DEMO_SNAPSHOTS = SNAPSHOTS.map(r=>({...r}));

const DEMO_EVENTS = [
  ['ev001','P-EDU-101','resignation','2026-06-11','EDU','07','233014','L3','A'],
  ['ev002','P-EDU-102','transfer_out','2026-07-05','EDU','07','233014','L3','A'],
  ['ev003','P-EDU-103','retirement','2026-08-12','EDU','07','233014','L3','A'],
  ['ev004','P-EDU-104','resignation','2026-09-02','EDU','07','233014','L3','A'],
  ['ev005','P-EDU-105','transfer_out','2026-09-07','EDU','07','233014','L3','A'],
  ['ev006','P-EDU-106','resignation','2026-09-11','EDU','07','233014','L3','A'],
  ['ev007','P-EDU-107','retirement','2026-09-14','EDU','07','233014','L3','A'],
  ['ev008','P-EDU-201','resignation','2026-06-18','EDU','02','233033','L2','A'],
  ['ev009','P-EDU-202','retirement','2026-07-22','EDU','02','233033','L2','A'],
  ['ev010','P-EDU-203','transfer_out','2026-08-08','EDU','02','233033','L2','A'],
  ['ev011','P-EDU-204','resignation','2026-09-09','EDU','02','233033','L2','A'],
  ['ev012','P-HLT-101','resignation','2026-06-03','HLT','01','222113','G2','H'],
  ['ev013','P-HLT-102','transfer_out','2026-06-21','HLT','01','222113','G2','H'],
  ['ev014','P-HLT-103','resignation','2026-07-12','HLT','01','222113','G2','H'],
  ['ev015','P-HLT-104','retirement','2026-08-03','HLT','01','222113','G2','H'],
  ['ev016','P-HLT-105','resignation','2026-08-19','HLT','01','222113','G2','H'],
  ['ev017','P-HLT-106','resignation','2026-09-01','HLT','01','222113','G2','H'],
  ['ev018','P-HLT-107','transfer_out','2026-09-04','HLT','01','222113','G2','H'],
  ['ev019','P-HLT-108','resignation','2026-09-08','HLT','01','222113','G2','H'],
  ['ev020','P-HLT-109','retirement','2026-09-12','HLT','01','222113','G2','H'],
  ['ev021','P-HLT-110','resignation','2026-09-15','HLT','01','222113','G2','H'],
  ['ev022','P-MUN-101','transfer_out','2026-06-15','MUN','01','325706','J2','F'],
  ['ev023','P-MUN-102','resignation','2026-08-17','MUN','01','325706','J2','F'],
  ['ev024','P-MUN-103','resignation','2026-09-03','MUN','01','325706','J2','F'],
  ['ev025','P-MUN-104','retirement','2026-09-06','MUN','01','325706','J2','F'],
  ['ev026','P-MUN-105','transfer_out','2026-09-13','MUN','01','325706','J2','F'],
  ['ev027','P-GOV-101','resignation','2026-07-19','GOV','01','242309','P1','C'],
  ['ev028','P-GOV-102','transfer_out','2026-09-05','GOV','01','242309','P1','C'],
  ['ev029','P-GOV-103','resignation','2026-09-10','GOV','01','242309','P1','C'],
  ['ev030','P-GOV-104','resignation','2026-09-16','GOV','01','242309','P1','C']
].map(([event_id,position_id,event_type,event_date,sector,location,ssco,level,category])=>({event_id,position_id,event_type,event_date,sector,location,ssco,level,category}));

let HR_EVENTS = [...DEMO_EVENTS];
let snapshotMode='synthetic';
let eventMode='synthetic';
let snapshotImportedAt=null;
let eventImportedAt=null;
const PRODUCT_VERSION='Kinetic HR v0.4';
const PRIORITY_FORMULA_VERSION='KHP-v0.4';
const DATA_CONTRACT_VERSION='KHDC-v0.4';
const AUDIT_STORAGE_KEY='kinetic_hr_audit_v04';
const SCENARIO_STORAGE_KEY='kinetic_hr_scenarios_v04';
let lang='ar';
let activeSector='EDU';
const CURRENT_MONTH='2026-09';
const BASELINE_MONTHS=['2026-06','2026-07','2026-08'];
const ALERT_MULTIPLIER=1.5;
const GAP_EVENT_TYPES=new Set(['resignation','retirement','transfer_out','position_created_unfilled','demand_increase']);

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const sectorCfg=s=>CONFIG.sectors[s];
const sscoByCode=code=>SSCO_CATALOG.find(x=>x.code===String(code));
const fmt=(n,d=0)=>Number(n||0).toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:d});
const monthOf=date=>String(date).slice(0,7);

const CONFIG={sectors:{
 EDU:{ar:'التعليم',en:'Education',levelLabel:{ar:'المرحلة',en:'Stage'},categoryLabel:{ar:'المسار',en:'Track'},serviceUnit:{ar:'طالب/ساعة خدمة',en:'student/service unit'},locations:[{id:'07',ar:'الجوف',en:'Al-Jawf'},{id:'02',ar:'مكة المكرمة',en:'Makkah'},{id:'01',ar:'الرياض',en:'Riyadh'}],levels:[{id:'L1',ar:'ابتدائي',en:'Primary'},{id:'L2',ar:'متوسط',en:'Intermediate'},{id:'L3',ar:'ثانوي',en:'Secondary'}],categories:[{id:'A',ar:'مسار أ',en:'Track A'},{id:'B',ar:'مسار ب',en:'Track B'}]},
 HLT:{ar:'الصحة',en:'Health',levelLabel:{ar:'الدرجة المهنية',en:'Professional Grade'},categoryLabel:{ar:'نوع المنشأة',en:'Facility Type'},serviceUnit:{ar:'وحدة خدمة سريرية',en:'clinical service unit'},locations:[{id:'01',ar:'الرياض',en:'Riyadh'},{id:'02',ar:'جدة',en:'Jeddah'},{id:'03',ar:'الدمام',en:'Dammam'}],levels:[{id:'G1',ar:'ممارس',en:'Practitioner'},{id:'G2',ar:'أخصائي',en:'Specialist'},{id:'G3',ar:'أخصائي أول',en:'Senior Specialist'}],categories:[{id:'H',ar:'مستشفى',en:'Hospital'},{id:'C',ar:'مركز',en:'Center'}]},
 MUN:{ar:'الخدمات البلدية',en:'Municipal Services',levelLabel:{ar:'المستوى الوظيفي',en:'Job Level'},categoryLabel:{ar:'نوع الخدمة',en:'Service Type'},serviceUnit:{ar:'منشأة/معاملة خدمة',en:'establishment/service unit'},locations:[{id:'01',ar:'الرياض',en:'Riyadh'},{id:'02',ar:'جدة',en:'Jeddah'},{id:'03',ar:'الخبر',en:'Al Khobar'}],levels:[{id:'J1',ar:'مستوى 1',en:'Level 1'},{id:'J2',ar:'مستوى 2',en:'Level 2'},{id:'J3',ar:'مستوى 3',en:'Level 3'}],categories:[{id:'F',ar:'ميداني',en:'Field'},{id:'O',ar:'مكتبي',en:'Office'}]},
 GOV:{ar:'الخدمات الحكومية المشتركة',en:'Government Corporate Services',levelLabel:{ar:'المستوى',en:'Level'},categoryLabel:{ar:'نوع الوحدة',en:'Unit Type'},serviceUnit:{ar:'وحدة خدمة داخلية',en:'internal service unit'},locations:[{id:'01',ar:'المركز الرئيسي',en:'Headquarters'},{id:'02',ar:'المنطقة الغربية',en:'Western Region'},{id:'03',ar:'المنطقة الشرقية',en:'Eastern Region'}],levels:[{id:'P1',ar:'اختصاصي',en:'Professional'},{id:'P2',ar:'قيادي',en:'Leadership'}],categories:[{id:'C',ar:'مركزي',en:'Central'},{id:'R',ar:'إقليمي',en:'Regional'}]}
}};

let SNAPSHOTS=[
 {source_row:'demo-001',as_of_date:'2026-09-17',position_group_id:'PG-EDU-001',sector:'EDU',location:'07',ssco:'233014',level:'L3',category:'A',demand_basis:'workload-derived',needed_fte:56,available_fte:38,gap_onset_date:'2025-11-01',median_time_to_fill_days:128,scarcity_index:.88,internal_substitute_fte:1,service_criticality_weight:.90,service_units_per_gap_fte:24},
 {source_row:'demo-002',as_of_date:'2026-09-17',position_group_id:'PG-EDU-002',sector:'EDU',location:'02',ssco:'233033',level:'L2',category:'A',demand_basis:'workload-derived',needed_fte:84,available_fte:76,gap_onset_date:'2026-04-12',median_time_to_fill_days:78,scarcity_index:.54,internal_substitute_fte:3,service_criticality_weight:.88,service_units_per_gap_fte:20},
 {source_row:'demo-003',as_of_date:'2026-09-17',position_group_id:'PG-EDU-003',sector:'EDU',location:'01',ssco:'233010',level:'L3',category:'B',demand_basis:'workload-derived',needed_fte:73,available_fte:70,gap_onset_date:'2026-07-19',median_time_to_fill_days:52,scarcity_index:.34,internal_substitute_fte:4,service_criticality_weight:.76,service_units_per_gap_fte:18},
 {source_row:'demo-011',as_of_date:'2026-09-17',position_group_id:'PG-EDU-004',sector:'EDU',location:'01',ssco:'233014',level:'L3',category:'A',demand_basis:'workload-derived',needed_fte:50,available_fte:58,gap_onset_date:'',median_time_to_fill_days:45,scarcity_index:.28,internal_substitute_fte:6,service_criticality_weight:.62,service_units_per_gap_fte:16},
 {source_row:'demo-004',as_of_date:'2026-09-17',position_group_id:'PG-HLT-001',sector:'HLT',location:'01',ssco:'222113',level:'G2',category:'H',demand_basis:'service-standard',needed_fte:120,available_fte:91,gap_onset_date:'2025-08-01',median_time_to_fill_days:154,scarcity_index:.93,internal_substitute_fte:2,service_criticality_weight:.98,service_units_per_gap_fte:42},
 {source_row:'demo-005',as_of_date:'2026-09-17',position_group_id:'PG-HLT-002',sector:'HLT',location:'02',ssco:'221209',level:'G3',category:'H',demand_basis:'service-standard',needed_fte:42,available_fte:35,gap_onset_date:'2025-10-14',median_time_to_fill_days:181,scarcity_index:.97,internal_substitute_fte:1,service_criticality_weight:1.00,service_units_per_gap_fte:55},
 {source_row:'demo-006',as_of_date:'2026-09-17',position_group_id:'PG-HLT-003',sector:'HLT',location:'03',ssco:'226404',level:'G1',category:'C',demand_basis:'service-standard',needed_fte:65,available_fte:70,gap_onset_date:'',median_time_to_fill_days:83,scarcity_index:.57,internal_substitute_fte:4,service_criticality_weight:.86,service_units_per_gap_fte:31},
 {source_row:'demo-007',as_of_date:'2026-09-17',position_group_id:'PG-MUN-001',sector:'MUN',location:'01',ssco:'325706',level:'J2',category:'F',demand_basis:'service-standard',needed_fte:96,available_fte:72,gap_onset_date:'2026-01-05',median_time_to_fill_days:112,scarcity_index:.69,internal_substitute_fte:3,service_criticality_weight:.94,service_units_per_gap_fte:34},
 {source_row:'demo-008',as_of_date:'2026-09-17',position_group_id:'PG-MUN-002',sector:'MUN',location:'02',ssco:'216403',level:'J3',category:'O',demand_basis:'strategic-scenario',needed_fte:38,available_fte:33,gap_onset_date:'2026-03-18',median_time_to_fill_days:136,scarcity_index:.82,internal_substitute_fte:1,service_criticality_weight:.72,service_units_per_gap_fte:9},
 {source_row:'demo-009',as_of_date:'2026-09-17',position_group_id:'PG-MUN-003',sector:'MUN',location:'03',ssco:'226301',level:'J1',category:'F',demand_basis:'service-standard',needed_fte:74,available_fte:79,gap_onset_date:'',median_time_to_fill_days:59,scarcity_index:.31,internal_substitute_fte:5,service_criticality_weight:.70,service_units_per_gap_fte:21},
 {source_row:'demo-010',as_of_date:'2026-09-17',position_group_id:'PG-GOV-001',sector:'GOV',location:'01',ssco:'242309',level:'P1',category:'C',demand_basis:'approved-establishment',needed_fte:28,available_fte:19,gap_onset_date:'2026-02-01',median_time_to_fill_days:103,scarcity_index:.77,internal_substitute_fte:1,service_criticality_weight:.74,service_units_per_gap_fte:3},
 {source_row:'demo-012',as_of_date:'2026-09-17',position_group_id:'PG-GOV-002',sector:'GOV',location:'02',ssco:'242303',level:'P1',category:'R',demand_basis:'approved-establishment',needed_fte:18,available_fte:21,gap_onset_date:'',median_time_to_fill_days:72,scarcity_index:.48,internal_substitute_fte:2,service_criticality_weight:.58,service_units_per_gap_fte:2}
];
const DEMO_SNAPSHOTS=SNAPSHOTS.map(r=>({...r}));

const DEMO_EVENTS=[
 ['ev001','P-EDU-101','resignation','2026-06-11','EDU','07','233014','L3','A',-1,0],
 ['ev002','P-EDU-102','transfer_out','2026-07-05','EDU','07','233014','L3','A',-1,0],
 ['ev003','P-EDU-103','retirement','2026-08-12','EDU','07','233014','L3','A',-1,0],
 ['ev004','P-EDU-104','resignation','2026-08-21','EDU','07','233014','L3','A',-1,0],
 ['ev005','P-EDU-105','transfer_out','2026-09-02','EDU','07','233014','L3','A',-1,0],
 ['ev006','P-EDU-106','resignation','2026-09-07','EDU','07','233014','L3','A',-1,0],
 ['ev007','P-EDU-107','retirement','2026-09-14','EDU','07','233014','L3','A',-1,0],
 ['ev008','P-EDU-201','resignation','2026-06-18','EDU','02','233033','L2','A',-1,0],
 ['ev009','P-EDU-202','hire','2026-07-22','EDU','02','233033','L2','A',1,0],
 ['ev010','P-EDU-203','transfer_out','2026-08-08','EDU','02','233033','L2','A',-1,0],
 ['ev011','P-EDU-204','resignation','2026-09-09','EDU','02','233033','L2','A',-1,0],
 ['ev012','P-HLT-101','resignation','2026-06-03','HLT','01','222113','G2','H',-1,0],
 ['ev013','P-HLT-102','transfer_out','2026-06-21','HLT','01','222113','G2','H',-1,0],
 ['ev014','P-HLT-103','resignation','2026-07-12','HLT','01','222113','G2','H',-1,0],
 ['ev015','P-HLT-104','retirement','2026-08-03','HLT','01','222113','G2','H',-1,0],
 ['ev016','P-HLT-105','resignation','2026-08-19','HLT','01','222113','G2','H',-1,0],
 ['ev017','P-HLT-106','resignation','2026-08-26','HLT','01','222113','G2','H',-1,0],
 ['ev018','P-HLT-107','transfer_out','2026-09-04','HLT','01','222113','G2','H',-1,0],
 ['ev019','P-HLT-108','resignation','2026-09-08','HLT','01','222113','G2','H',-1,0],
 ['ev020','P-HLT-109','retirement','2026-09-12','HLT','01','222113','G2','H',-1,0],
 ['ev021','P-HLT-110','resignation','2026-09-15','HLT','01','222113','G2','H',-1,0],
 ['ev022','P-MUN-101','transfer_out','2026-06-15','MUN','01','325706','J2','F',-1,0],
 ['ev023','P-MUN-102','resignation','2026-08-17','MUN','01','325706','J2','F',-1,0],
 ['ev024','P-MUN-103','resignation','2026-09-03','MUN','01','325706','J2','F',-1,0],
 ['ev025','P-MUN-104','retirement','2026-09-06','MUN','01','325706','J2','F',-1,0],
 ['ev026','P-MUN-105','transfer_out','2026-09-13','MUN','01','325706','J2','F',-1,0],
 ['ev027','P-GOV-101','resignation','2026-07-19','GOV','01','242309','P1','C',-1,0],
 ['ev028','P-GOV-102','transfer_out','2026-08-12','GOV','01','242309','P1','C',-1,0],
 ['ev029','P-GOV-103','resignation','2026-09-10','GOV','01','242309','P1','C',-1,0],
 ['ev030','P-GOV-104','demand_increase','2026-09-16','GOV','01','242309','P1','C',0,1]
].map(([event_id,position_id,event_type,event_date,sector,location,ssco,level,category,capacity_delta_fte,demand_delta_fte])=>({event_id,position_id,event_type,event_date,sector,location,ssco,level,category,capacity_delta_fte,demand_delta_fte}));
let HR_EVENTS=DEMO_EVENTS.map(e=>({...e}));

let snapshotMode='synthetic',eventMode='synthetic',snapshotImportedAt=null,eventImportedAt=null;
const PRODUCT_VERSION='Kinetic HR v0.5';
const MEASUREMENT_VERSION='KH-MEASURE-v0.5';
const PRIORITY_POLICY_VERSION='KH-PRIORITY-v0.5';
const SURVEILLANCE_POLICY_VERSION='KH-SURV-v0.5';
const DATA_CONTRACT_VERSION='KHDC-v0.5';
const AUDIT_STORAGE_KEY='kinetic_hr_audit_v05',SCENARIO_STORAGE_KEY='kinetic_hr_scenarios_v05',ALERT_CASE_STORAGE_KEY='kinetic_hr_alert_cases_v05';
const SURVEILLANCE={windowDays:30,baselineWindows:3,alertMultiplier:1.5,minNewGapFteWhenBaselineZero:2,minRequiredFte:10};
const INTERVENTION_DEFAULTS={horizonDays:180,hire:{leadDays:90,success:.80},upskill:{trainingDays:60,completion:.85},contract:{startDelayDays:14,durationDays:180}};
let lang='ar',activeSector='EDU';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const sectorCfg=s=>CONFIG.sectors[s];
const sscoByCode=code=>SSCO_CATALOG.find(x=>x.code===String(code));
const fmt=(n,d=0)=>Number(n||0).toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:d});

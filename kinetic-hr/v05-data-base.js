const CONFIG={sectors:{
 EDU:{ar:'التعليم',en:'Education',levelLabel:{ar:'المرحلة',en:'Stage'},categoryLabel:{ar:'المسار',en:'Track'},serviceUnit:{ar:'طالب/ساعة خدمة',en:'student/service unit'},locations:[{id:'07',ar:'الجوف',en:'Al-Jawf'},{id:'02',ar:'مكة المكرمة',en:'Makkah'},{id:'01',ar:'الرياض',en:'Riyadh'}],levels:[{id:'L1',ar:'ابتدائي',en:'Primary'},{id:'L2',ar:'متوسط',en:'Intermediate'},{id:'L3',ar:'ثانوي',en:'Secondary'}],categories:[{id:'A',ar:'مسار أ',en:'Track A'},{id:'B',ar:'مسار ب',en:'Track B'}]},
 HLT:{ar:'الصحة',en:'Health',levelLabel:{ar:'الدرجة المهنية',en:'Professional Grade'},categoryLabel:{ar:'نوع المنشأة',en:'Facility Type'},serviceUnit:{ar:'وحدة خدمة سريرية',en:'clinical service unit'},locations:[{id:'01',ar:'الرياض',en:'Riyadh'},{id:'02',ar:'جدة',en:'Jeddah'},{id:'03',ar:'الدمام',en:'Dammam'}],levels:[{id:'G1',ar:'ممارس',en:'Practitioner'},{id:'G2',ar:'أخصائي',en:'Specialist'},{id:'G3',ar:'أخصائي أول',en:'Senior Specialist'}],categories:[{id:'H',ar:'مستشفى',en:'Hospital'},{id:'C',ar:'مركز',en:'Center'}]},
 MUN:{ar:'الخدمات البلدية',en:'Municipal Services',levelLabel:{ar:'المستوى الوظيفي',en:'Job Level'},categoryLabel:{ar:'نوع الخدمة',en:'Service Type'},serviceUnit:{ar:'منشأة/معاملة خدمة',en:'establishment/service unit'},locations:[{id:'01',ar:'الرياض',en:'Riyadh'},{id:'02',ar:'جدة',en:'Jeddah'},{id:'03',ar:'الخبر',en:'Al Khobar'}],levels:[{id:'J1',ar:'مستوى 1',en:'Level 1'},{id:'J2',ar:'مستوى 2',en:'Level 2'},{id:'J3',ar:'مستوى 3',en:'Level 3'}],categories:[{id:'F',ar:'ميداني',en:'Field'},{id:'O',ar:'مكتبي',en:'Office'}]},
 GOV:{ar:'الخدمات الحكومية المشتركة',en:'Government Corporate Services',levelLabel:{ar:'المستوى',en:'Level'},categoryLabel:{ar:'نوع الوحدة',en:'Unit Type'},serviceUnit:{ar:'وحدة خدمة داخلية',en:'internal service unit'},locations:[{id:'01',ar:'المركز الرئيسي',en:'Headquarters'},{id:'02',ar:'المنطقة الغربية',en:'Western Region'},{id:'03',ar:'المنطقة الشرقية',en:'Eastern Region'}],levels:[{id:'P1',ar:'اختصاصي',en:'Professional'},{id:'P2',ar:'قيادي',en:'Leadership'}],categories:[{id:'C',ar:'مركزي',en:'Central'},{id:'R',ar:'إقليمي',en:'Regional'}]}
}};

let SNAPSHOTS=[
 {source_row:'demo-001',as_of_date:'2026-09-17',position_group_id:'PG-EDU-001',sector:'EDU',location:'07',ssco:'233014',level:'L3',category:'A',demand_basis:'workload-derived',needed_fte:56,available_fte:38,gap_onset_date:'2025-11-01',median_time_to_fill_days:128,scarcity_index:.88,internal_substitute_fte:1,service_criticality_weight:.90,service_units_per_gap_fte:24,event_history_start_date:'2026-05-20',event_history_end_date:'2026-09-17'},
 {source_row:'demo-002',as_of_date:'2026-09-17',position_group_id:'PG-EDU-002',sector:'EDU',location:'02',ssco:'233033',level:'L2',category:'A',demand_basis:'workload-derived',needed_fte:84,available_fte:76,gap_onset_date:'2026-04-12',median_time_to_fill_days:78,scarcity_index:.54,internal_substitute_fte:3,service_criticality_weight:.88,service_units_per_gap_fte:20,event_history_start_date:'2026-05-20',event_history_end_date:'2026-09-17'},
 {source_row:'demo-003',as_of_date:'2026-09-17',position_group_id:'PG-EDU-003',sector:'EDU',location:'01',ssco:'233010',level:'L3',category:'B',demand_basis:'workload-derived',needed_fte:73,available_fte:70,gap_onset_date:'2026-07-19',median_time_to_fill_days:52,scarcity_index:.34,internal_substitute_fte:4,service_criticality_weight:.76,service_units_per_gap_fte:18,event_history_start_date:'2026-05-20',event_history_end_date:'2026-09-17'},
 {source_row:'demo-011',as_of_date:'2026-09-17',position_group_id:'PG-EDU-004',sector:'EDU',location:'01',ssco:'233014',level:'L3',category:'A',demand_basis:'workload-derived',needed_fte:50,available_fte:58,gap_onset_date:'',median_time_to_fill_days:45,scarcity_index:.28,internal_substitute_fte:6,service_criticality_weight:.62,service_units_per_gap_fte:16,event_history_start_date:'2026-05-20',event_history_end_date:'2026-09-17'},
 {source_row:'demo-004',as_of_date:'2026-09-17',position_group_id:'PG-HLT-001',sector:'HLT',location:'01',ssco:'222113',level:'G2',category:'H',demand_basis:'service-standard',needed_fte:120,available_fte:91,gap_onset_date:'2025-08-01',median_time_to_fill_days:154,scarcity_index:.93,internal_substitute_fte:2,service_criticality_weight:.98,service_units_per_gap_fte:42,event_history_start_date:'2026-05-20',event_history_end_date:'2026-09-17'},
 {source_row:'demo-005',as_of_date:'2026-09-17',position_group_id:'PG-HLT-002',sector:'HLT',location:'02',ssco:'221209',level:'G3',category:'H',demand_basis:'service-standard',needed_fte:42,available_fte:35,gap_onset_date:'2025-10-14',median_time_to_fill_days:181,scarcity_index:.97,internal_substitute_fte:1,service_criticality_weight:1.00,service_units_per_gap_fte:55,event_history_start_date:'2026-05-20',event_history_end_date:'2026-09-17'},
 {source_row:'demo-006',as_of_date:'2026-09-17',position_group_id:'PG-HLT-003',sector:'HLT',location:'03',ssco:'226404',level:'G1',category:'C',demand_basis:'service-standard',needed_fte:65,available_fte:70,gap_onset_date:'',median_time_to_fill_days:83,scarcity_index:.57,internal_substitute_fte:4,service_criticality_weight:.86,service_units_per_gap_fte:31,event_history_start_date:'2026-05-20',event_history_end_date:'2026-09-17'},
 {source_row:'demo-007',as_of_date:'2026-09-17',position_group_id:'PG-MUN-001',sector:'MUN',location:'01',ssco:'325706',level:'J2',category:'F',demand_basis:'service-standard',needed_fte:96,available_fte:72,gap_onset_date:'2026-01-05',median_time_to_fill_days:112,scarcity_index:.69,internal_substitute_fte:3,service_criticality_weight:.94,service_units_per_gap_fte:34,event_history_start_date:'2026-05-20',event_history_end_date:'2026-09-17'},
 {source_row:'demo-008',as_of_date:'2026-09-17',position_group_id:'PG-MUN-002',sector:'MUN',location:'02',ssco:'216403',level:'J3',category:'O',demand_basis:'strategic-scenario',needed_fte:38,available_fte:33,gap_onset_date:'2026-03-18',median_time_to_fill_days:136,scarcity_index:.82,internal_substitute_fte:1,service_criticality_weight:.72,service_units_per_gap_fte:9,event_history_start_date:'2026-05-20',event_history_end_date:'2026-09-17'},
 {source_row:'demo-009',as_of_date:'2026-09-17',position_group_id:'PG-MUN-003',sector:'MUN',location:'03',ssco:'226301',level:'J1',category:'F',demand_basis:'service-standard',needed_fte:74,available_fte:79,gap_onset_date:'',median_time_to_fill_days:59,scarcity_index:.31,internal_substitute_fte:5,service_criticality_weight:.70,service_units_per_gap_fte:21,event_history_start_date:'2026-05-20',event_history_end_date:'2026-09-17'},
 {source_row:'demo-010',as_of_date:'2026-09-17',position_group_id:'PG-GOV-001',sector:'GOV',location:'01',ssco:'242309',level:'P1',category:'C',demand_basis:'approved-establishment',needed_fte:28,available_fte:19,gap_onset_date:'2026-02-01',median_time_to_fill_days:103,scarcity_index:.77,internal_substitute_fte:1,service_criticality_weight:.74,service_units_per_gap_fte:3,event_history_start_date:'2026-05-20',event_history_end_date:'2026-09-17'},
 {source_row:'demo-012',as_of_date:'2026-09-17',position_group_id:'PG-GOV-002',sector:'GOV',location:'02',ssco:'242303',level:'P1',category:'R',demand_basis:'approved-establishment',needed_fte:18,available_fte:21,gap_onset_date:'',median_time_to_fill_days:72,scarcity_index:.48,internal_substitute_fte:2,service_criticality_weight:.58,service_units_per_gap_fte:2,event_history_start_date:'2026-05-20',event_history_end_date:'2026-09-17'}
];
const DEMO_SNAPSHOTS=SNAPSHOTS.map(r=>({...r}));

const DEMO_EVENTS=[
 ["ev001","P-EDU-101","PG-EDU-001","resignation","2026-05-29","EDU","07","233014","L3","A","voluntary","compensation",-1,0],
 ["ev002","P-EDU-102","PG-EDU-001","hire","2026-06-15","EDU","07","233014","L3","A","","",1,0],
 ["ev003","P-EDU-103","PG-EDU-001","transfer_out","2026-07-03","EDU","07","233014","L3","A","internal_mobility","internal_transfer",-1,0],
 ["ev004","P-EDU-104","PG-EDU-001","hire","2026-07-28","EDU","07","233014","L3","A","","",1,0],
 ["ev005","P-EDU-105","PG-EDU-001","resignation","2026-08-10","EDU","07","233014","L3","A","voluntary","career_growth",-1,0],
 ["ev006","P-EDU-106","PG-EDU-001","resignation","2026-08-24","EDU","07","233014","L3","A","voluntary","compensation",-1,0],
 ["ev007","P-EDU-107","PG-EDU-001","transfer_out","2026-09-02","EDU","07","233014","L3","A","internal_mobility","internal_transfer",-1,0],
 ["ev008","P-EDU-108","PG-EDU-001","resignation","2026-09-07","EDU","07","233014","L3","A","voluntary","manager_or_work_environment",-1,0],
 ["ev009","P-EDU-109","PG-EDU-001","retirement","2026-09-14","EDU","07","233014","L3","A","statutory","retirement",-1,0],
 ["ev010","P-EDU-201","PG-EDU-002","resignation","2026-05-30","EDU","02","233033","L2","A","voluntary","career_growth",-1,0],
 ["ev011","P-EDU-202","PG-EDU-002","hire","2026-06-12","EDU","02","233033","L2","A","","",1,0],
 ["ev012","P-EDU-203","PG-EDU-002","resignation","2026-07-10","EDU","02","233033","L2","A","voluntary","relocation",-1,0],
 ["ev013","P-EDU-204","PG-EDU-002","hire","2026-07-22","EDU","02","233033","L2","A","","",1,0],
 ["ev014","P-EDU-205","PG-EDU-002","transfer_out","2026-08-08","EDU","02","233033","L2","A","internal_mobility","internal_transfer",-1,0],
 ["ev015","P-EDU-206","PG-EDU-002","hire","2026-08-16","EDU","02","233033","L2","A","","",1,0],
 ["ev016","P-EDU-207","PG-EDU-002","resignation","2026-09-09","EDU","02","233033","L2","A","voluntary","career_growth",-1,0],
 ["ev017","P-EDU-208","PG-EDU-002","hire","2026-09-12","EDU","02","233033","L2","A","","",1,0],
 ["ev018","P-EDU-301","PG-EDU-003","hire","2026-05-28","EDU","01","233010","L3","B","","",1,0],
 ["ev019","P-EDU-302","PG-EDU-003","transfer_in","2026-07-02","EDU","01","233010","L3","B","","",1,0],
 ["ev020","P-EDU-303","PG-EDU-003","demand_decrease","2026-08-04","EDU","01","233010","L3","B","","",0,-1],
 ["ev021","P-EDU-304","PG-EDU-003","hire","2026-09-05","EDU","01","233010","L3","B","","",1,0],
 ["ev022","P-EDU-401","PG-EDU-004","hire","2026-05-25","EDU","01","233014","L3","A","","",1,0],
 ["ev023","P-EDU-402","PG-EDU-004","transfer_in","2026-07-15","EDU","01","233014","L3","A","","",1,0],
 ["ev024","P-EDU-403","PG-EDU-004","hire","2026-08-26","EDU","01","233014","L3","A","","",1,0],
 ["ev025","P-HLT-101","PG-HLT-001","resignation","2026-06-03","HLT","01","222113","G2","H","voluntary","compensation",-1,0],
 ["ev026","P-HLT-102","PG-HLT-001","termination","2026-06-25","HLT","01","222113","G2","H","involuntary","performance",-1,0],
 ["ev027","P-HLT-103","PG-HLT-001","resignation","2026-07-12","HLT","01","222113","G2","H","voluntary","career_growth",-1,0],
 ["ev028","P-HLT-104","PG-HLT-001","retirement","2026-08-03","HLT","01","222113","G2","H","statutory","retirement",-1,0],
 ["ev029","P-HLT-105","PG-HLT-001","hire","2026-08-16","HLT","01","222113","G2","H","","",1,0],
 ["ev030","P-HLT-106","PG-HLT-001","resignation","2026-08-20","HLT","01","222113","G2","H","voluntary","compensation",-1,0],
 ["ev031","P-HLT-107","PG-HLT-001","resignation","2026-08-26","HLT","01","222113","G2","H","voluntary","workload",-1,0],
 ["ev032","P-HLT-108","PG-HLT-001","transfer_out","2026-09-04","HLT","01","222113","G2","H","internal_mobility","internal_transfer",-1,0],
 ["ev033","P-HLT-109","PG-HLT-001","resignation","2026-09-08","HLT","01","222113","G2","H","voluntary","career_growth",-1,0],
 ["ev034","P-HLT-110","PG-HLT-001","retirement","2026-09-12","HLT","01","222113","G2","H","statutory","retirement",-1,0],
 ["ev035","P-HLT-111","PG-HLT-001","resignation","2026-09-15","HLT","01","222113","G2","H","voluntary","workload",-1,0],
 ["ev036","P-HLT-201","PG-HLT-002","resignation","2026-06-05","HLT","02","221209","G3","H","voluntary","career_growth",-1,0],
 ["ev037","P-HLT-202","PG-HLT-002","hire","2026-06-18","HLT","02","221209","G3","H","","",1,0],
 ["ev038","P-HLT-203","PG-HLT-002","termination","2026-07-05","HLT","02","221209","G3","H","involuntary","probation",-1,0],
 ["ev039","P-HLT-204","PG-HLT-002","hire","2026-07-17","HLT","02","221209","G3","H","","",1,0],
 ["ev040","P-HLT-205","PG-HLT-002","transfer_out","2026-08-05","HLT","02","221209","G3","H","internal_mobility","internal_transfer",-1,0],
 ["ev041","P-HLT-206","PG-HLT-002","hire","2026-08-14","HLT","02","221209","G3","H","","",1,0],
 ["ev042","P-HLT-207","PG-HLT-002","resignation","2026-09-06","HLT","02","221209","G3","H","voluntary","compensation",-1,0],
 ["ev043","P-HLT-301","PG-HLT-003","hire","2026-06-01","HLT","03","226404","G1","C","","",1,0],
 ["ev044","P-HLT-302","PG-HLT-003","transfer_in","2026-07-20","HLT","03","226404","G1","C","","",1,0],
 ["ev045","P-HLT-303","PG-HLT-003","hire","2026-09-01","HLT","03","226404","G1","C","","",1,0],
 ["ev046","P-MUN-101","PG-MUN-001","transfer_out","2026-06-15","MUN","01","325706","J2","F","internal_mobility","internal_transfer",-1,0],
 ["ev047","P-MUN-102","PG-MUN-001","hire","2026-06-18","MUN","01","325706","J2","F","","",1,0],
 ["ev048","P-MUN-103","PG-MUN-001","resignation","2026-07-08","MUN","01","325706","J2","F","voluntary","career_growth",-1,0],
 ["ev049","P-MUN-104","PG-MUN-001","resignation","2026-08-11","MUN","01","325706","J2","F","voluntary","compensation",-1,0],
 ["ev050","P-MUN-105","PG-MUN-001","resignation","2026-08-23","MUN","01","325706","J2","F","voluntary","workload",-1,0],
 ["ev051","P-MUN-106","PG-MUN-001","resignation","2026-09-03","MUN","01","325706","J2","F","voluntary","career_growth",-1,0],
 ["ev052","P-MUN-107","PG-MUN-001","retirement","2026-09-06","MUN","01","325706","J2","F","statutory","retirement",-1,0],
 ["ev053","P-MUN-108","PG-MUN-001","transfer_out","2026-09-13","MUN","01","325706","J2","F","internal_mobility","internal_transfer",-1,0],
 ["ev054","P-MUN-201","PG-MUN-002","resignation","2026-06-10","MUN","02","216403","J3","O","voluntary","career_growth",-1,0],
 ["ev055","P-MUN-202","PG-MUN-002","hire","2026-06-28","MUN","02","216403","J3","O","","",1,0],
 ["ev056","P-MUN-203","PG-MUN-002","transfer_out","2026-07-25","MUN","02","216403","J3","O","internal_mobility","internal_transfer",-1,0],
 ["ev057","P-MUN-204","PG-MUN-002","hire","2026-08-12","MUN","02","216403","J3","O","","",1,0],
 ["ev058","P-MUN-205","PG-MUN-002","hire","2026-09-01","MUN","02","216403","J3","O","","",1,0],
 ["ev059","P-MUN-301","PG-MUN-003","hire","2026-06-08","MUN","03","226301","J1","F","","",1,0],
 ["ev060","P-MUN-302","PG-MUN-003","transfer_in","2026-07-24","MUN","03","226301","J1","F","","",1,0],
 ["ev061","P-MUN-303","PG-MUN-003","hire","2026-09-02","MUN","03","226301","J1","F","","",1,0],
 ["ev062","P-GOV-101","PG-GOV-001","resignation","2026-06-06","GOV","01","242309","P1","C","voluntary","career_growth",-1,0],
 ["ev063","P-GOV-102","PG-GOV-001","hire","2026-06-18","GOV","01","242309","P1","C","","",1,0],
 ["ev064","P-GOV-103","PG-GOV-001","transfer_out","2026-07-12","GOV","01","242309","P1","C","internal_mobility","internal_transfer",-1,0],
 ["ev065","P-GOV-104","PG-GOV-001","hire","2026-07-25","GOV","01","242309","P1","C","","",1,0],
 ["ev066","P-GOV-105","PG-GOV-001","termination","2026-08-10","GOV","01","242309","P1","C","involuntary","probation",-1,0],
 ["ev067","P-GOV-106","PG-GOV-001","hire","2026-08-15","GOV","01","242309","P1","C","","",1,0],
 ["ev068","P-GOV-107","PG-GOV-001","resignation","2026-09-10","GOV","01","242309","P1","C","voluntary","compensation",-1,0],
 ["ev069","P-GOV-108","PG-GOV-001","demand_increase","2026-09-16","GOV","01","242309","P1","C","","",0,1],
 ["ev070","P-GOV-201","PG-GOV-002","hire","2026-06-04","GOV","02","242303","P1","R","","",1,0],
 ["ev071","P-GOV-202","PG-GOV-002","transfer_in","2026-07-29","GOV","02","242303","P1","R","","",1,0],
 ["ev072","P-GOV-203","PG-GOV-002","hire","2026-09-03","GOV","02","242303","P1","R","","",1,0]
].map(([event_id,position_id,position_group_id,event_type,event_date,sector,location,ssco,level,category,separation_nature,separation_reason,capacity_delta_fte,demand_delta_fte])=>({event_id,position_id,position_group_id,event_type,event_date,sector,location,ssco,level,category,separation_nature,separation_reason,capacity_delta_fte,demand_delta_fte}));
let HR_EVENTS=DEMO_EVENTS.map(e=>({...e}));

let snapshotMode='synthetic',eventMode='synthetic',snapshotImportedAt=null,eventImportedAt=null;
const PRODUCT_VERSION='Kinetic HR v0.5';
const MEASUREMENT_VERSION='KH-MEASURE-v1.0';
const PRIORITY_POLICY_VERSION='KH-PRIORITY-v0.5';
const SURVEILLANCE_POLICY_VERSION='KH-SURV-v1.0';
const DATA_CONTRACT_VERSION='KHDC-v1.0';
const AUDIT_STORAGE_KEY='kinetic_hr_audit_v05',SCENARIO_STORAGE_KEY='kinetic_hr_scenarios_v05',ALERT_CASE_STORAGE_KEY='kinetic_hr_alert_cases_v05';
const SURVEILLANCE={windowDays:30,baselineWindows:3,alertMultiplier:1.5,minNewGapFteWhenBaselineZero:2,minRequiredFte:10};
const INTERVENTION_DEFAULTS={horizonDays:180,hire:{leadDays:90,success:.80},upskill:{trainingDays:60,completion:.85},contract:{startDelayDays:14,durationDays:180}};
let lang=(()=>{const requested=new URLSearchParams(location.search).get('lang');if(['ar','en'].includes(requested))return requested;try{return localStorage.getItem('kinetic_hr_language')==='en'?'en':'ar'}catch{return 'ar'}})(),activeSector='EDU';
document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const sectorCfg=s=>CONFIG.sectors[s];
const sscoByCode=code=>SSCO_CATALOG.find(x=>x.code===String(code));
const fmt=(n,d=0)=>n==null||n===''||!Number.isFinite(Number(n))?'—':Number(n).toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:d});

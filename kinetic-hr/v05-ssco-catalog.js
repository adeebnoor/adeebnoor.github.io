/* Kinetic HR v0.5 — SSCO reference layer
   Occupations are sector-neutral. Sector usage belongs to workforce cells, not to the occupation itself.
   Public demo uses a validated subset only; institutional onboarding must ingest the official full master sheet.
*/
const SSCO_META={
  authorityAr:'الهيئة العامة للإحصاء',authorityEn:'General Authority for Statistics (GASTAT)',
  version:'2024',sourceName:'Saudi Standard Classification of Occupations — Master Sheets 2024',
  sourceUrl:'https://www.stats.gov.sa/en/w/saudi-standard-classification-of-occupations',
  checkedOn:'2026-09-17',catalogMode:'validated-demo-subset'
};
const SKILLS_META={
  authorityAr:'وزارة الموارد البشرية والتنمية الاجتماعية',authorityEn:'Ministry of Human Resources and Social Development',
  sourceName:'Saudi Skills Taxonomy',sourceUrl:'https://www.hrsd.gov.sa/en/skills-occupations',
  mappingMode:'integration-hook-not-populated'
};
const SSCO_CATALOG=[
 {code:'233014',ar:'معلم ثانوي حاسب وبرمجة',en:'Secondary Computer & Programming Teacher',unit:'2330',subgroup:'233',submajor:'23',major:'2'},
 {code:'233012',ar:'معلم ثانوي رياضيات',en:'Secondary Mathematics Teacher',unit:'2330',subgroup:'233',submajor:'23',major:'2'},
 {code:'233010',ar:'معلم ثانوي فيزياء',en:'Secondary Physics Teacher',unit:'2330',subgroup:'233',submajor:'23',major:'2'},
 {code:'233030',ar:'معلم مرحلة متوسطة حاسب آلي',en:'Intermediate Computer Teacher',unit:'2330',subgroup:'233',submajor:'23',major:'2'},
 {code:'233033',ar:'معلم مرحلة متوسطة رياضيات',en:'Intermediate Mathematics Teacher',unit:'2330',subgroup:'233',submajor:'23',major:'2'},
 {code:'233034',ar:'معلم مرحلة متوسطة علوم',en:'Intermediate Science Teacher',unit:'2330',subgroup:'233',submajor:'23',major:'2'},
 {code:'234107',ar:'معلم ابتدائي حاسب آلي',en:'Primary Computer Teacher',unit:'2341',subgroup:'234',submajor:'23',major:'2'},
 {code:'234108',ar:'معلم ابتدائي علوم ورياضيات',en:'Primary Science & Mathematics Teacher',unit:'2341',subgroup:'234',submajor:'23',major:'2'},
 {code:'222113',ar:'أخصائي تمريض الرعاية الحرجة',en:'Critical Care Nursing Specialist',unit:'2221',subgroup:'222',submajor:'22',major:'2'},
 {code:'221209',ar:'طبيب تخدير',en:'Anesthesiologist',unit:'2212',subgroup:'221',submajor:'22',major:'2'},
 {code:'226404',ar:'أخصائي رعاية تنفسية',en:'Respiratory Care Specialist',unit:'2264',subgroup:'226',submajor:'22',major:'2'},
 {code:'325706',ar:'مفتش سلامة مهنية',en:'Occupational Safety Inspector',unit:'3257',subgroup:'325',submajor:'32',major:'3'},
 {code:'216403',ar:'مخطط حضري',en:'Urban Planner',unit:'2164',subgroup:'216',submajor:'21',major:'2'},
 {code:'226301',ar:'أخصائي حماية بيئة',en:'Environmental Protection Specialist',unit:'2263',subgroup:'226',submajor:'22',major:'2'},
 {code:'242309',ar:'أخصائي تخطيط قوى عاملة',en:'Workforce Planning Specialist',unit:'2423',subgroup:'242',submajor:'24',major:'2'},
 {code:'121203',ar:'مدير تصنيف مهن',en:'Occupational Classification Manager',unit:'1212',subgroup:'121',submajor:'12',major:'1'},
 {code:'242303',ar:'أخصائي تصنيف وظيفي ومهني',en:'Job & Occupational Classification Specialist',unit:'2423',subgroup:'242',submajor:'24',major:'2'}
];

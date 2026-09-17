/* Kinetic HR v0.3 — institutional memory configuration.
   Loaded after app-data.js and before the core engine. */
let snapshotImportedAt=null;
let eventImportedAt=null;
const PRODUCT_VERSION='Kinetic HR v0.3';
const PRIORITY_FORMULA_VERSION='KHP-v0.2';
const DATA_CONTRACT_VERSION='KHDC-v0.2';
const AUDIT_STORAGE_KEY='kinetic_hr_audit_v03';

Object.assign(I18N.ar,{
  nav_audit:'الذاكرة المؤسسية',
  audit_title:'الذاكرة المؤسسية وسجل التدقيق',
  audit_text:'ما يجعل Kinetic HR بنية تشغيلية لا جلسة تحليل عابرة: حالة زمنية مستمرة، إصدارات ثابتة، مصادر قابلة للتتبع، وسجل إنذارات يمكن إعادة إنتاجه.',
  audit_provenance:'حالة المصدر والمنهج',
  audit_llm_title:'الذكاء الاصطناعي يشرح ولا يخترع القياس',
  audit_llm_text:'يمكن لأي LLM شرح الإنذار أو تلخيصه، لكن النتيجة نفسها تأتي من بيانات مؤرخة وقواعد ثابتة قابلة لإعادة الحساب.',
  audit_llm_rule:'LLM ≠ source of truth', audit_alerts:'سجل الإنذارات القابل للتدقيق',audit_when:'وقت التسجيل',audit_signal:'الإشارة',audit_basis:'الأساس',audit_source:'مصدر البيانات',
  audit_prototype_note:'في هذه النسخة العامة يُحفظ سجل تدقيق غير حساس محليًا في المتصفح لإثبات السلوك. في النشر المؤسسي يُنقل السجل إلى قاعدة بيانات الجهة مع RBAC وسياسات الاحتفاظ.',
  audit_ssco:'مرجع SSCO',audit_formula:'إصدار المعادلة',audit_policy:'سياسة الترصد',audit_fingerprint_label:'بصمة الحالة',audit_snapshot:'لقطة القوى العاملة',audit_events:'سجل الأحداث',audit_count:'عدد السجلات',audit_mode:'الوضع',audit_imported:'آخر استيراد',audit_not_imported:'غير مستورد'
});
I18N.ar.pages.audit='الذاكرة المؤسسية'; I18N.ar.phase_label=PRODUCT_VERSION;
Object.assign(I18N.en,{
  nav_audit:'Institutional Memory',
  audit_title:'Institutional memory & audit trail',
  audit_text:'What makes Kinetic HR operational infrastructure rather than a one-off analysis: longitudinal state, fixed versions, traceable sources, and an alert ledger that can be reproduced.',
  audit_provenance:'Source and method state',
  audit_llm_title:'AI explains the signal; it does not invent the measurement',
  audit_llm_text:'An LLM can explain or summarize an alert, but the alert itself is produced by dated source events and deterministic, versioned rules.',
  audit_llm_rule:'LLM ≠ source of truth',audit_alerts:'Reproducible alert ledger',audit_when:'Recorded',audit_signal:'Signal',audit_basis:'Basis',audit_source:'Data source',
  audit_prototype_note:'This public release stores non-sensitive audit metadata locally in the browser to demonstrate behavior. An institutional deployment moves the ledger to the entity database with RBAC and retention policy.',
  audit_ssco:'SSCO reference',audit_formula:'Formula version',audit_policy:'Surveillance policy',audit_fingerprint_label:'State fingerprint',audit_snapshot:'Workforce snapshot',audit_events:'HR event log',audit_count:'Record count',audit_mode:'Mode',audit_imported:'Last import',audit_not_imported:'Not imported'
});
I18N.en.pages.audit='Institutional Memory'; I18N.en.phase_label=PRODUCT_VERSION;

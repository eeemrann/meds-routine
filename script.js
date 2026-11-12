/* HeartCare — mobile-first, offline-friendly, vanilla JavaScript.
   Prescription transcription is shown for caregiver review.
   No dose is changed by this app. Verify the list with the treating team.
*/
"use strict";

const KEYS = {
  storage: "heartcare-mobile-v2",
  planStartDefault: "2026-11-14",
  firstDoseDefault: "2026-11-12",
  trackingDays: 30,
  historyStart: "2026-11-12"
};

const slotInfo = {
  morning: { en: "Morning", bn: "সকাল", icon: "☀", subEn: "Before starting the day", subBn: "দিনের শুরুতে" },
  noon: { en: "Noon", bn: "দুপুর", icon: "◒", subEn: "Midday medicines", subBn: "দুপুরের ওষুধ" },
  night: { en: "Night", bn: "রাত", icon: "☾", subEn: "Evening / bedtime medicines", subBn: "রাতের ওষুধ" }
};

const meds = [
  { id:1, brand:"Linez 600", en:"Linezolid", bn:"লাইনেজোলিড", strength:"600 mg tablet", freq:"1+0+1", duration:7, unit:"days", meal:"after", schedule:{morning:1,night:1} },
  { id:2, brand:"Clamox 625", en:"Amoxicillin + Clavulanic Acid", bn:"অ্যামোক্সিসিলিন + ক্ল্যাভুলানিক অ্যাসিড", strength:"500 mg + 125 mg tablet", freq:"1+1+1", duration:7, unit:"days", meal:"after", schedule:{morning:1,noon:1,night:1} },
  { id:3, brand:"Carvista 6.25", en:"Carvedilol", bn:"কারভেডিলল", strength:"6.25 mg tablet", freq:"½+0+½", duration:30, unit:"days", meal:"unknown", continued:true, schedule:{morning:"½",night:"½"} },
  { id:4, brand:"Nitrofix SR", en:"Glyceryl Trinitrate", bn:"গ্লিসারিল ট্রাইনাইট্রেট", strength:"2.6 mg tablet", freq:"1+1+0", duration:30, unit:"days", meal:"after", continued:true, schedule:{morning:1,noon:1} },
  { id:5, brand:"Ecosprin 75", en:"Aspirin (Enteric Coated)", bn:"অ্যাসপিরিন (এন্টারিক কোটেড)", strength:"75 mg", freq:"0+1+0", duration:30, unit:"days", meal:"after", continued:true, schedule:{noon:1} },
  { id:6, brand:"Dclot", en:"Clopidogrel", bn:"ক্লোপিডোগ্রেল", strength:"75 mg tablet", freq:"0+0+1", duration:30, unit:"days", meal:"after", continued:true, schedule:{night:1} },
  { id:7, brand:"Frusin Plus 20", en:"Spironolactone + Frusemide", bn:"স্পাইরোনোল্যাকটোন + ফ্রুসেমাইড", strength:"50 mg + 20 mg tablet", freq:"1+0+1", duration:7, unit:"days", meal:"after", schedule:{morning:1,night:1}, correction:"The caregiver confirmed 1+0+1; the extra printed zero is ignored." },
  { id:8, brand:"Windol 500", en:"Paracetamol", bn:"প্যারাসিটামল", strength:"500 mg tablet", freq:"2+2+2", duration:5, unit:"days", meal:"after", schedule:{morning:2,noon:2,night:2} },
  { id:9, brand:"A-Cal D", en:"Calcium Carbonate + Vitamin D", bn:"ক্যালসিয়াম কার্বোনেট + ভিটামিন ডি", strength:"500 mg + Vitamin D tablet", freq:"1+0+1", duration:1, unit:"month", meal:"unknown", schedule:{morning:1,night:1} },
  { id:10, brand:"Aristovit-M", en:"Multivitamin & Mineral", bn:"মাল্টিভিটামিন ও মিনারেল", strength:"tablet", freq:"1+0+1", duration:1, unit:"month", meal:"after", schedule:{morning:1,night:1} },
  { id:11, brand:"EC-VIT", en:"Betacarotene + Vitamin C + Vitamin E", bn:"বিটা ক্যারোটিন + ভিটামিন সি + ভিটামিন ই", strength:"tablet", freq:"1+0+1", duration:1, unit:"month", meal:"unknown", schedule:{morning:1,night:1} },
  { id:12, brand:"Don-A", en:"Domperidone", bn:"ডমপেরিডন", strength:"10 mg tablet", freq:"1+1+1 before meal", duration:7, unit:"days", meal:"before", schedule:{morning:1,noon:1,night:1}, conflict:"The discharge summary prints SOS for this medicine; caregiver says medicines 1–17 are scheduled. Confirm with the prescriber/pharmacist before relying on this routine schedule." },
  { id:13, brand:"Pantonix 20", en:"Pantoprazole", bn:"প্যান্টোপ্রাজল", strength:"20 mg tablet", freq:"1+0+1", duration:30, unit:"days", meal:"before", continued:true, schedule:{morning:1,night:1} },
  { id:14, brand:"Taven 10", en:"Atorvastatin", bn:"অ্যাটোরভাস্টাটিন", strength:"10 mg tablet", freq:"0+0+1", duration:30, unit:"days", meal:"unknown", continued:true, schedule:{night:1} },
  { id:15, brand:"Disopan 0.5", en:"Clonazepam", bn:"ক্লোনাজেপাম", strength:"0.5 mg tablet", freq:"0+0+1", duration:7, unit:"days", meal:"unknown", schedule:{night:1} },
  { id:16, brand:"Coport 10", en:"Empagliflozin", bn:"এমপাগ্লিফ্লোজিন", strength:"10 mg tablet", freq:"0+1+0", duration:30, unit:"days", meal:"unknown", continued:true, schedule:{noon:1} },
  { id:17, brand:"Liconor 300", en:"Ursodeoxycholic Acid", bn:"ইউরসোডিওক্সিকোলিক অ্যাসিড", strength:"300 mg tablet", freq:"1+0+1", duration:14, unit:"days", meal:"unknown", schedule:{morning:1,night:1} },
  { id:18, brand:"Tranal 100", en:"Tramadol HCl suppository", bn:"ট্রামাডল এইচসিএল সাপোজিটরি", strength:"100 mg · 1 stick P/R SOS", freq:"SOS", duration:5, unit:"days", meal:"na", prn:true, route:"Rectal use only" },
  { id:19, brand:"Viodin Cream", en:"Povidone Iodine Ointment/Cream", bn:"পোভিডোন আয়োডিন অয়েন্টমেন্ট/ক্রিম", strength:"50 mg (as written)", freq:"Apply locally 3 times daily", duration:14, unit:"days", meal:"apply", schedule:{morning:1,noon:1,night:1}, wound:true }
];

const translations = {
  tagline:["Your daily recovery companion","আপনার প্রতিদিনের সুস্থতার সঙ্গী"],
  language:["Language","ভাষা"], darkMode:["Dark mode","ডার্ক মোড"], lightMode:["Light mode","লাইট মোড"],
  welcomeOverline:["A GENTLE ROUTINE FOR RECOVERY","সুস্থতার জন্য সহজ দৈনন্দিন রুটিন"],
  welcome:["Welcome back","আবারও স্বাগতম"], welcomeText:["Let's take today one step at a time. Your medicines and care routine are organised here.","চলুন, প্রতিটি দিন ধীরে ধীরে এগিয়ে যাই। আপনার ওষুধ ও যত্নের রুটিন এখানে সাজানো আছে।"],
  todaysCare:["TODAY'S CARE","আজকের যত্ন"], dailyProgress:["Daily progress","দৈনিক অগ্রগতি"], yourCare:["YOUR CARE","আপনার যত্ন"], whatWouldYouLike:["What would you like to do?","আপনি কী করতে চান?"],
  medicines:["Medicines","ওষুধ"], medicineActionText:["Morning · Noon · Night schedules","সকাল · দুপুর · রাতের সময়সূচি"], openSchedule:["Open medicine schedule →","ওষুধের সময়সূচি খুলুন →"],
  woundCare:["Wound care","ক্ষতের যত্ন"], woundActionText:["Three daily applications","দিনে তিনবার লাগাতে হবে"], asNeeded:["As-needed medicine","প্রয়োজনমতো ওষুধ"], sosActionText:["Only when prescribed / needed","শুধু নির্দেশনা অনুযায়ী প্রয়োজন হলে"],
  history:["Medicine history","ওষুধের হিসাব"], historyActionText:["See what was taken or missed","কোনটি নেওয়া হয়েছে বা বাদ গেছে দেখুন"], settings:["Settings & backup","সেটিংস ও ব্যাকআপ"], settingsActionText:["Dates, reminders and data backup","তারিখ, রিমাইন্ডার ও তথ্যের ব্যাকআপ"],
  homeSafety:["Follow the hospital's discharge instructions. HeartCare records your checklist; it does not change doses or decide whether a medicine is safe.","হাসপাতালের ডিসচার্জ নির্দেশনা অনুসরণ করুন। HeartCare শুধু চেকলিস্টের হিসাব রাখে; ডোজ পরিবর্তন বা ওষুধ নিরাপদ কি না নির্ধারণ করে না।"],
  home:["Home","হোম"], dailyMedicinePlan:["DAILY MEDICINE PLAN","দৈনিক ওষুধের পরিকল্পনা"], chooseTime:["Choose a time","সময় নির্বাচন করুন"], chooseTimeText:["Select Morning, Noon or Night. Only the medicines for that time will appear.","সকাল, দুপুর বা রাত নির্বাচন করুন। শুধু সেই সময়ের ওষুধগুলো দেখানো হবে।"],
  viewHistory:["View medicine history","ওষুধের হিসাব দেখুন"], allTimes:["All times","সব সময়"], medicineChecklist:["MEDICINE CHECKLIST","ওষুধের চেকলিস্ট"], backToTimes:["Back to Morning / Noon / Night","সকাল / দুপুর / রাতের তালিকায় ফিরুন"],
  woundCareOverline:["SURGICAL WOUND CARE","অস্ত্রোপচারের ক্ষতের যত্ন"], woundIntro:["Record each local application after it has been completed.","প্রতিবার লাগানো শেষ হলে এখানে চিহ্নিত করুন।"], iodineStrength:["50 mg — as written on the discharge summary","৫০ মিগ্রা — ডিসচার্জ সামারিতে যেভাবে লেখা"], applyLocally:["Apply locally · 3 times daily","স্থানীয়ভাবে লাগান · দিনে ৩ বার"], woundSafety:["Use on the surgical scar only as directed by the surgical team. Confirm the exact product and strength on the tube.","সার্জারি টিমের নির্দেশনা অনুযায়ী শুধু ক্ষতে ব্যবহার করুন। টিউবের সঠিক নাম ও মাত্রা মিলিয়ে নিন।"],
  asNeededOverline:["AS-NEEDED MEDICINE","প্রয়োজনমতো ওষুধ"], sosIntro:["Only record use when it has actually been given according to the doctor's instructions.","চিকিৎসকের নির্দেশনা অনুযায়ী বাস্তবে ব্যবহার করার পরেই নথিভুক্ত করুন।"], rectalRoute:["Rectal use only — not for swallowing.","শুধু পায়ুপথে ব্যবহার — মুখে খাওয়ার জন্য নয়।"], sosDuration:["Prescribed window: 5 days from the first-dose date.","প্রথম ডোজের তারিখ থেকে নির্ধারিত সময়: ৫ দিন।"], logUse:["Log use","ব্যবহার নথিভুক্ত করুন"], sosWarningTitle:["Important","গুরুত্বপূর্ণ"], sosWarning:["Follow the doctor's exact dose, interval and maximum-use instructions. This log does not decide when another dose is safe. If pain is severe or worsening after surgery, contact the treating team.","চিকিৎসকের নির্দিষ্ট ডোজ, ব্যবধান ও সর্বোচ্চ ব্যবহারের নির্দেশনা অনুসরণ করুন। এই হিসাব পরবর্তী ডোজ নিরাপদ কি না নির্ধারণ করে না। অস্ত্রোপচারের পর ব্যথা তীব্র বা বাড়তে থাকলে চিকিৎসক দলের সঙ্গে যোগাযোগ করুন।"],
  historyOverline:["YOUR RECORD","আপনার হিসাব"], historyIntro:["Past entries are shown as taken, marked missed or not recorded. Blank entries are not automatically treated as missed.","আগের হিসাব নেওয়া হয়েছে, বাদ গেছে বা নথিভুক্ত হয়নি—এভাবে দেখানো হবে। ফাঁকা ঘরকে নিজে থেকে বাদ গেছে বলে ধরা হবে না।"], chooseDate:["Choose a date","তারিখ নির্বাচন করুন"], editThisDay:["Open this day's checklist","এই দিনের চেকলিস্ট খুলুন"], recentDays:["Recent days","সাম্প্রতিক দিনগুলো"],
  settingsOverline:["PERSONALISE HEARTCARE","HeartCare সাজিয়ে নিন"], settingsIntro:["Set the tracking dates and optional on-page reminder times. No sound or system notifications are used.","ট্র্যাকিংয়ের তারিখ এবং চাইলে পেজের ভেতরের রিমাইন্ডারের সময় দিন। কোনো শব্দ বা সিস্টেম নোটিফিকেশন ব্যবহার করা হয় না।"], firstDoseDate:["First-dose date (for medicine duration)","প্রথম ডোজের তারিখ (ওষুধের মেয়াদ গণনার জন্য)"], trackingStart:["30-day tracking starts","৩০ দিনের ট্র্যাকিং শুরু"], optionalTimes:["Optional visual reminder times","ঐচ্ছিক দৃশ্যমান রিমাইন্ডারের সময়"], optionalTimesText:["Leave blank if you do not want an on-page time reminder. The page must stay open.","পেজে সময়ভিত্তিক রিমাইন্ডার না চাইলে ফাঁকা রাখুন। পেজ খোলা রাখতে হবে।"], morning:["Morning","সকাল"], noon:["Noon","দুপুর"], night:["Night","রাত"], saveSettings:["Save settings","সেটিংস সংরক্ষণ করুন"], backupTitle:["Backup your records","আপনার তথ্যের ব্যাকআপ নিন"], backupText:["Data is saved in this browser on this phone. Export a backup regularly, especially before changing phones or browsers.","তথ্য এই ফোনের এই ব্রাউজারে সংরক্ষিত থাকে। ফোন বা ব্রাউজার বদলানোর আগে নিয়মিত ব্যাকআপ ডাউনলোড করুন।"], downloadBackup:["Download backup","ব্যাকআপ ডাউনলোড"], restoreBackup:["Restore backup","ব্যাকআপ ফিরিয়ে আনুন"], prescriptionReference:["Prescription reference (items 1–19)","প্রেসক্রিপশন রেফারেন্স (১–১৯)"],
  medicalSafetyTitle:["Please verify the prescription","প্রেসক্রিপশনটি নিশ্চিত করুন"], medicalSafetyText:["All 19 medicines in the supplied list are included. Don-A (Domperidone, #12) is listed as SOS on the discharge sheet, while this tracker shows the 1+1+1 before-meal schedule supplied for tracking. Confirm the intended frequency with the prescriber/pharmacist. Never double a missed dose or change a medicine based on this app.","আপনার দেওয়া ১৯টি ওষুধই এখানে অন্তর্ভুক্ত। ডিসচার্জ শিটে Don-A (Domperidone, #১২)-এর পাশে SOS লেখা আছে, আর এই ট্র্যাকার-এ ১+১+১ খাবারের আগের সময়সূচি দেখানো হয়েছে। সঠিক ব্যবহারের নিয়ম চিকিৎসক/ফার্মাসিস্টের সঙ্গে নিশ্চিত করুন। বাদ যাওয়া ডোজ কখনো দ্বিগুণ করবেন না বা এই অ্যাপ দেখে ওষুধ পরিবর্তন করবেন না।"],
  footerText:["A family checklist — not a substitute for medical advice.","পরিবারের চেকলিস্ট — চিকিৎসকের পরামর্শের বিকল্প নয়।"]
};

const defaultState = {
  settings: {
    language:"both", theme:"light",
    firstDoseDate:KEYS.firstDoseDefault,
    trackingStartDate:KEYS.planStartDefault,
    reminders:{morning:"",noon:"",night:""}
  },
  logs:{}, medStartDates:{}
};

let state = loadState();
let activeScreen = "homeScreen";
let selectedDate = "";
let selectedSlot = "morning";
let toastTimer = null;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEYS.storage) || "null");
    if (!saved) return clone(defaultState);
    return {
      settings:{...defaultState.settings,...(saved.settings||{}),reminders:{...defaultState.settings.reminders,...((saved.settings||{}).reminders||{})}},
      logs:saved.logs && typeof saved.logs==="object" ? saved.logs : {},
      medStartDates:saved.medStartDates && typeof saved.medStartDates==="object" ? saved.medStartDates : {}
    };
  } catch (e) { console.warn(e); return clone(defaultState); }
}
function saveState() {
  try { localStorage.setItem(KEYS.storage,JSON.stringify(state)); }
  catch(e) { showToast(tx("Could not save. Please download a backup and check phone storage.","সংরক্ষণ করা যায়নি। ব্যাকআপ ডাউনলোড করুন এবং ফোনের স্টোরেজ দেখুন।")); }
}
function tx(en,bn) {
  const lang=state.settings.language||"both";
  if(lang==="en") return en;
  if(lang==="bn") return bn;
  return `${en} / ${bn}`;
}
function tr(key) {
  const pair=translations[key];
  return pair ? tx(pair[0],pair[1]) : key;
}
function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el=>{ el.textContent=tr(el.dataset.i18n); });
  document.getElementById("languageSelect").value=state.settings.language;
  const dark=state.settings.theme==="dark";
  document.getElementById("themeGlyph").textContent=dark?"☀":"☾";
  document.getElementById("themeLabel").textContent=dark?tr("lightMode"):tr("darkMode");
  document.body.dataset.theme=state.settings.theme;
  document.documentElement.lang=state.settings.language==="bn"?"bn":"en";
  document.querySelector('meta[name="theme-color"]').content=dark?"#101c23":"#f3f7f8";
}
function localKey(date=new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function parseKey(key) {
  if(!key) return null;
  const [y,m,d]=key.split("-").map(Number);
  return new Date(y,m-1,d,12,0,0,0);
}
function shiftKey(key,days) {
  const d=parseKey(key); d.setDate(d.getDate()+days); return localKey(d);
}
function diffDays(a,b) {
  const da=parseKey(a), db=parseKey(b);
  return Math.round((Date.UTC(db.getFullYear(),db.getMonth(),db.getDate())-Date.UTC(da.getFullYear(),da.getMonth(),da.getDate()))/86400000);
}
function addDuration(start,duration,unit) {
  const d=parseKey(start);
  if(unit==="month") d.setMonth(d.getMonth()+duration);
  else d.setDate(d.getDate()+duration);
  return localKey(d);
}
function endDateInclusive(start,med) {
  return shiftKey(addDuration(start,med.duration,med.unit),-1);
}
function formatDate(key,opts={weekday:"long",day:"numeric",month:"short",year:"numeric"}) {
  const d=parseKey(key);
  const locale=state.settings.language==="bn"?"bn-BD":"en-GB";
  return new Intl.DateTimeFormat(locale,opts).format(d);
}
function startForMed(med) { return state.medStartDates[String(med.id)] || state.settings.firstDoseDate || KEYS.firstDoseDefault; }
function planEnd() { return shiftKey(state.settings.trackingStartDate,KEYS.trackingDays-1); }
function planDayNumber(key) {
  const delta=diffDays(state.settings.trackingStartDate,key);
  return delta>=0 && delta<KEYS.trackingDays ? delta+1 : null;
}
function isFuture(key) { return key>localKey(); }
function isActiveOn(med,key) {
  if(key<startForMed(med)) return false;
  if(med.continued) return key<=planEnd();
  return key<=endDateInclusive(startForMed(med),med);
}
function getLog(key=selectedDate) {
  if(!state.logs[key]) state.logs[key]={doses:{},wound:{},sos:[]};
  const log=state.logs[key];
  if(!log.doses) log.doses={};
  if(!log.wound) log.wound={};
  if(!Array.isArray(log.sos)) log.sos=[];
  return log;
}
function doseKey(medId,slot) { return `${medId}-${slot}`; }
function getDoseStatus(medId,slot,key=selectedDate) {
  return state.logs[key]?.doses?.[doseKey(medId,slot)]?.status || "pending";
}
function setDoseStatus(medId,slot,status) {
  if(isFuture(selectedDate)) return;
  const log=getLog();
  const key=doseKey(medId,slot);
  if(status==="pending") delete log.doses[key];
  else log.doses[key]={status,at:new Date().toISOString()};
  saveState(); renderAll();
}
function getActiveForSlot(slot,key=selectedDate) {
  return meds.filter(m=>m.schedule && m.schedule[slot]!==undefined && isActiveOn(m,key));
}
function getDailyTasks(key) {
  const doses=[];
  ["morning","noon","night"].forEach(slot=>getActiveForSlot(slot,key).forEach(m=>doses.push({id:m.id,slot})));
  return {doses};
}
function countDay(key) {
  const tasks=getDailyTasks(key), log=state.logs[key]||{doses:{}};
  const total=tasks.doses.length;
  let taken=0, missed=0;
  tasks.doses.forEach(t=>{const s=log.doses?.[doseKey(t.id,t.slot)]?.status;if(s==="taken")taken++;if(s==="missed")missed++;});
  return {total,taken,missed,pending:Math.max(0,total-taken-missed),percent:total?Math.round(taken/total*100):0};
}
function slotCounts(slot,key=selectedDate) {
  const list=getActiveForSlot(slot,key);
  const taken=list.filter(m=>getDoseStatus(m.id,slot,key)==="taken").length;
  const missed=list.filter(m=>getDoseStatus(m.id,slot,key)==="missed").length;
  return {total:list.length,taken,missed,pending:list.length-taken-missed,complete:list.length>0&&taken===list.length};
}
function doseAmount(value) {
  if(value==="½") return tx("½ tablet","½ ট্যাবলেট");
  if(value===2) return tx("2 tablets","২টি ট্যাবলেট");
  return tx("1 tablet","১টি ট্যাবলেট");
}
function mealText(meal) {
  if(meal==="before") return {label:tx("Before food","খাবারের আগে"),cls:"before"};
  if(meal==="after") return {label:tx("After food","খাবারের পরে"),cls:"after"};
  if(meal==="apply") return {label:tx("Apply to scar","ক্ষতে লাগান"),cls:"after"};
  return {label:tx("Not specified on discharge sheet","ডিসচার্জ কাগজে উল্লেখ নেই"),cls:"unspecified"};
}
function safe(s) {
  return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
const medicinePhotoFiles = {
  1: "01_Linez_600_(Linezolid_600_mg).png",
  2: "02_Clamox_625_(Amoxicillin_Clavulanic_Acid).png",
  3: "03_Carvista_6.25_(Carvedilol).png",
  4: "04_Nitrofix_SR_(Glyceryl_Trinitrate).png",
  5: "05_Ecosprin_75_(Aspirin_Enteric_Coated).jpg",
  6: "06_Dclot_(Clopidogrel).jpg",
  7: "07_Frusin_Plus_20_(Spironolactone_Frusemide).png",
  8: "08_Windol_500_(Paracetamol).png",
  9: "09_A-Cal_D_(Calcium_Carbonate_Vitamin_D).png",
  10: "10_Aristovit-M_(Multivitamin_Mineral).png",
  11: "11_EC-VIT_(Betacarotene_Vitamin_C_Vitamin_E).png",
  12: "12_Don-A_(Domperidone).png",
  13: "13_Pantonix_20_(Pantoprazole).jpg",
  14: "14_Taven_10_(Atorvastatin).jpg",
  15: "15_Disopan_0.5_(Clonazepam).jpg",
  16: "16_Coport_10_(Empagliflozin).jpg",
  17: "17_Liconor_300_(Ursodeoxycholic_Acid).jpg",
  18: "18_Tranal_100_(Tramadol_HCl_Suppository).jpg",
  19: "19_Viodin_Cream_(Povidone_Iodine_Ointment_Cream).jpg"
};
function medicineDisplayName(medicine) {
  const generic = medicine.en.replace(" (Enteric Coated)", ", Enteric Coated");
  return `${medicine.brand} (${generic})`;
}
function medicineImageSrc(id) {
  return `assets/medicines/${medicinePhotoFiles[id]}`;
}
function medicineArt(id) {
  const medicine = meds.find(item => item.id === id);
  const alt = medicine ? `${medicineDisplayName(medicine)} package` : `Medicine ${id} package`;
  return `<img class="medicine-photo" src="${medicineImageSrc(id)}" alt="${safe(alt)}" loading="lazy" decoding="async">`;
}

function showScreen(id) {
  activeScreen=id;
  document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("active",s.id===id));
  window.scrollTo({top:0,behavior:"smooth"});
  renderAll();
}
function showToast(message) {
  const toast=document.getElementById("toast");
  toast.textContent=message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove("show"),2300);
}
function defaultSelectedDate() {
  const today=localKey();
  return today<state.settings.trackingStartDate?state.settings.trackingStartDate:today;
}
function renderHome() {
  const key=defaultSelectedDate();
  const count=countDay(key);
  document.getElementById("homeDate").textContent=formatDate(key,{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const careLabel=document.querySelector(".today-top .overline");
  careLabel.textContent=key>localKey()?tx("FIRST DAY'S CARE","প্রথম দিনের যত্ন"):tr("todaysCare");
  const day=planDayNumber(key);
  document.getElementById("planDay").textContent=day?tx(`Day ${day} of 30`,`৩০ দিনের ${day}তম দিন`):tx("Outside 30-day plan","৩০ দিনের পরিকল্পনার বাইরে");
  document.getElementById("homeProgressText").textContent=`${count.percent}%`;
  document.getElementById("homeProgressBar").style.width=`${count.percent}%`;
  document.getElementById("homeProgressCaption").textContent=tx(`${count.taken} of ${count.total} scheduled tasks completed`,`${count.total}টির মধ্যে ${count.taken}টি নির্ধারিত কাজ সম্পন্ন`);
  document.getElementById("homeSessionSummary").innerHTML=["morning","noon","night"].map(slot=>{
    const c=slotCounts(slot,key), info=slotInfo[slot];
    const stateText=c.total===0?tx("No doses","ডোজ নেই"):c.complete?tx("Complete","সম্পন্ন"):`${c.taken}/${c.total}`;
    return `<div class="session-mini"><span>${tx(info.en,info.bn)}</span><span>${safe(stateText)}</span></div>`;
  }).join("");
}
function renderDateNavigator() {
  document.getElementById("hubDate").textContent=formatDate(selectedDate,{weekday:"long",day:"numeric",month:"short",year:"numeric"});
  const day=planDayNumber(selectedDate);
  document.getElementById("hubDayLabel").textContent=day?tx(`Day ${day} of 30`,`৩০ দিনের ${day}তম দিন`):selectedDate<state.settings.trackingStartDate?tx("Pre-tracking history","ট্র্যাকিং শুরুর আগের হিসাব"):tx("Outside tracking period","ট্র্যাকিং সময়ের বাইরে");
  document.getElementById("previousDate").disabled=selectedDate<=KEYS.historyStart;
  document.getElementById("nextDate").disabled=selectedDate>=localKey();
  const notice=document.getElementById("dateNotice");
  if(isFuture(selectedDate)) {
    notice.hidden=false;
    notice.textContent=tx("This is a preview. You cannot record future doses. The first tracking day is 14 November 2026.","এটি আগাম দেখা। ভবিষ্যতের ডোজ নথিভুক্ত করা যাবে না। প্রথম ট্র্যাকিং দিন ১৪ নভেম্বর ২০২৬।");
  } else if(selectedDate<state.settings.trackingStartDate) {
    notice.hidden=false;
    notice.textContent=tx("Historical entry: only record a dose if you know it was actually taken or missed. Unrecorded does not mean missed.","আগের দিনের হিসাব: নিশ্চিতভাবে নেওয়া বা বাদ যাওয়ার তথ্য থাকলেই নথিভুক্ত করুন। ফাঁকা মানেই বাদ নয়।");
  } else {
    notice.hidden=true; notice.textContent="";
  }
}
function renderHub() {
  renderDateNavigator();
  document.getElementById("timeChoiceList").innerHTML=["morning","noon","night"].map(slot=>{
    const c=slotCounts(slot,selectedDate), info=slotInfo[slot];
    let status=c.total===0?tx("No active medicines","কোনো সক্রিয় ওষুধ নেই"):c.complete?tx("Completed ✓","সম্পন্ন ✓"):`${c.taken} / ${c.total} ${tx("taken","নেওয়া হয়েছে")}`;
    if(c.missed>0) status+=` · ${c.missed} ${tx("missed","বাদ")}`;
    return `<button class="time-choice" data-open-slot="${slot}" data-slot="${slot}" type="button">
      <span class="time-icon" aria-hidden="true">${info.icon}</span>
      <span class="time-copy"><strong>${tx(info.en,info.bn)}</strong><small>${tx(info.subEn,info.subBn)}</small></span>
      <span class="time-status">${safe(status)}</span><span class="time-arrow" aria-hidden="true">›</span>
    </button>`;
  }).join("");
}
function renderSession() {
  const info=slotInfo[selectedSlot];
  document.getElementById("sessionTitle").textContent=tx(info.en,info.bn);
  document.getElementById("sessionSubtitle").textContent=tx("Tick each medicine only after it has been taken.","ওষুধ খাওয়ার পরেই শুধু টিক দিন।");
  const list=getActiveForSlot(selectedSlot,selectedDate);
  const c=slotCounts(selectedSlot,selectedDate);
  const pct=c.total?Math.round(c.taken/c.total*100):0;
  document.getElementById("sessionSummary").innerHTML=`
    <div class="session-summary-top"><strong>${tx(`${c.taken} of ${c.total} medicines taken`,`${c.total}টির মধ্যে ${c.taken}টি ওষুধ নেওয়া হয়েছে`)}</strong><span>${pct}%</span></div>
    <div class="progress-rail"><span style="width:${pct}%"></span></div>`;
  const future=isFuture(selectedDate);
  let alert="";
  if(future) alert=`<div class="inline-alert">${tx("Preview only — recording is available on the selected date.","শুধু আগাম দেখা — নির্বাচিত দিনে নথিভুক্ত করা যাবে।")}</div>`;
  if(list.some(m=>m.id===12)) alert+=`<div class="inline-alert">${tx("Don-A (Domperidone) is included in the 19-medicine list. The discharge sheet marks it SOS; this checklist shows the 1+1+1 before-meal schedule entered for tracking. Confirm the intended frequency with the prescriber.","Don-A (Domperidone) ১৯টি ওষুধের তালিকায় অন্তর্ভুক্ত। ডিসচার্জ শিটে SOS লেখা আছে; ট্র্যাকিংয়ের জন্য এখানে ১+১+১ খাবারের আগের সময়সূচি দেখানো হয়েছে। সঠিক ব্যবহারের নিয়ম চিকিৎসকের সঙ্গে নিশ্চিত করুন।")}</div>`;
  document.getElementById("sessionAlert").innerHTML=alert;
  const container=document.getElementById("medicineCardList");
  if(!list.length) {
    container.innerHTML=`<div class="history-detail-card"><h2>${tx("No scheduled medicines for this time","এই সময়ে কোনো নির্ধারিত ওষুধ নেই")}</h2><p>${tx("This may be because the prescribed course has ended. Do not restart or extend a medicine without checking with the care team.","নির্ধারিত মেয়াদ শেষ হওয়ায় এমন হতে পারে। চিকিৎসক দলের পরামর্শ ছাড়া কোনো ওষুধ আবার শুরু বা মেয়াদ বাড়াবেন না।")}</p></div>`;
  } else {
    container.innerHTML=list.map(m=>{
      const status=getDoseStatus(m.id,selectedSlot,selectedDate);
      const meal=mealText(m.meal);
      const amount=m.id===19?tx("Apply locally","স্থানীয়ভাবে লাগান"):doseAmount(m.schedule[selectedSlot]);
      const statusLabel=status==="taken"?tx("Taken","নেওয়া হয়েছে"):status==="missed"?tx("Marked missed","বাদ হিসেবে চিহ্নিত"):tx("Not recorded","নথিভুক্ত হয়নি");
      const statusClass=status==="taken"?"taken":status==="missed"?"missed":"";
      const conflict=m.id===12?`<div class="medicine-warning">${tx("Don-A (Domperidone) is included. The discharge sheet marks it SOS, while this checklist shows the 1+1+1 before-meal schedule supplied for this tracker. Confirm the intended frequency with the prescriber.","Don-A (Domperidone) তালিকায় অন্তর্ভুক্ত। ডিসচার্জ শিটে SOS লেখা আছে, আর এই চেকলিস্টে দেওয়া ১+১+১ খাবারের আগের সময়সূচি দেখানো হয়েছে। সঠিক ব্যবহারের নিয়ম চিকিৎসকের সঙ্গে নিশ্চিত করুন।")}</div>`:"";
      return `<article class="medicine-card ${status==="missed"?"status-missed":""}">
        <div class="medicine-visual">${medicineArt(m.id)}</div>
        <div class="medicine-info">
          <div class="medicine-title-row"><h3>${m.id}. ${safe(medicineDisplayName(m))}</h3><span class="status-label ${statusClass}">${safe(statusLabel)}</span></div>
          <p class="medicine-bengali">${safe(m.bn)}</p>
          <div class="medicine-strength">${safe(m.strength)}</div>
          <div class="dose-food-row"><span class="dose-pill">${safe(amount)}</span><span class="food-pill ${meal.cls}">${safe(meal.label)}</span></div>
        </div>
        <div class="medicine-actions">
          <button class="take-button ${status==="taken"?"is-taken":""}" data-dose-action="taken" data-med-id="${m.id}" ${future?"disabled":""} type="button">${status==="taken"?`✓ ${tx("Taken","নেওয়া হয়েছে")}`:`○ ${tx("Mark taken","নেওয়া হয়েছে টিক দিন")}`}</button>
          ${status==="pending"?`<button class="miss-button" data-dose-action="missed" data-med-id="${m.id}" ${future?"disabled":""} type="button">${tx("Not taken","নেওয়া হয়নি")}</button>`:`<button class="undo-button" data-dose-action="pending" data-med-id="${m.id}" ${future?"disabled":""} type="button">${tx("Undo","বাতিল")}</button>`}
        </div>${conflict}
      </article>`;
    }).join("");
  }
  const completion=document.getElementById("sessionCompletion");
  if(c.total>0&&c.complete) {
    completion.hidden=false; completion.className="session-completion";
    completion.textContent=tx(`${info.en} completed — every scheduled medicine has been ticked.`,` ${info.bn} সম্পন্ন — সব নির্ধারিত ওষুধে টিক দেওয়া হয়েছে।`);
  } else if(c.missed>0) {
    completion.hidden=false; completion.className="session-completion incomplete";
    completion.textContent=tx(`${c.missed} medicine(s) marked not taken. This session is not complete.`,`${c.missed}টি ওষুধ নেওয়া হয়নি হিসেবে চিহ্নিত। এই সেশন সম্পন্ন নয়।`);
  } else {
    completion.hidden=true; completion.textContent="";
  }
}
function renderWound() {
  document.getElementById("woundMedicineVisual").innerHTML=medicineArt(19);
  const med=meds.find(m=>m.id===19);
  const start=startForMed(med);
  const end=endDateInclusive(start,med);
  const active=isActiveOn(med,selectedDate);
  document.getElementById("woundDuration").textContent=active
    ? tx(`Prescription window: ${formatDate(start,{day:"numeric",month:"short"})} – ${formatDate(end,{day:"numeric",month:"short",year:"numeric"})}. The same ticks appear in the Morning / Noon / Night medicine lists.`, `নির্ধারিত সময়: ${formatDate(start,{day:"numeric",month:"short"})} – ${formatDate(end,{day:"numeric",month:"short",year:"numeric"})}। একই টিক সকাল / দুপুর / রাতের ওষুধের তালিকাতেও দেখা যাবে।`)
    : tx("The 14-day wound-care window is outside this selected date. Confirm with the surgical team before extending it.","নির্বাচিত তারিখটি ১৪ দিনের ক্ষত-যত্নের সময়সীমার বাইরে। সময় বাড়ানোর আগে সার্জারি টিমের সঙ্গে নিশ্চিত করুন।");
  document.getElementById("woundTaskList").innerHTML=["morning","noon","night"].map(slot=>{
    const status=getDoseStatus(19,slot,selectedDate);
    const info=slotInfo[slot];
    const statusText=status==="taken"?tx("Recorded as done","সম্পন্ন হিসেবে নথিভুক্ত"):status==="missed"?tx("Marked not done","সম্পন্ন হয়নি হিসেবে চিহ্নিত"):tx("Not recorded yet","এখনও নথিভুক্ত হয়নি");
    return `<div class="wound-task"><div><strong>${tx(info.en,info.bn)}</strong><small>${statusText}</small></div><button class="${status==="taken"?"done":""}" data-wound-slot="${slot}" data-wound-action="${status==="taken"?"pending":"taken"}" ${isFuture(selectedDate)||!active?"disabled":""}>${status==="taken"?tx("✓ Done · Undo","✓ সম্পন্ন · বাতিল"):tx("Mark done","সম্পন্ন করুন")}</button></div>`;
  }).join("");
}
function renderSos() {
  document.getElementById("sosMedicineVisual").innerHTML=medicineArt(18);
  const entries=state.logs[selectedDate]?.sos||[];
  document.getElementById("sosHistory").textContent=entries.length
    ? tx(`${entries.length} use(s) logged for this date. Last: ${new Date(entries[entries.length-1].at).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}.`,`এই তারিখে ${entries.length} বার ব্যবহার নথিভুক্ত। সর্বশেষ: ${new Date(entries[entries.length-1].at).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}।`)
    : tx("No use logged for this date.","এই তারিখে কোনো ব্যবহার নথিভুক্ত হয়নি।");
  document.getElementById("logSosButton").disabled=isFuture(selectedDate);
}
function renderHistory() {
  const dateInput=document.getElementById("historyDate");
  if(!dateInput.value) dateInput.value=selectedDate;
  const key=dateInput.value||selectedDate;
  const count=countDay(key);
  document.getElementById("historyDetail").innerHTML=`
    <h2>${safe(formatDate(key,{weekday:"long",day:"numeric",month:"long",year:"numeric"}))}</h2>
    <p>${tx("Blank items mean not recorded; they are not automatically counted as missed.","ফাঁকা আইটেম মানে নথিভুক্ত হয়নি; এগুলোকে নিজে থেকে বাদ হিসেবে গণনা করা হয় না।")}</p>
    <div class="history-counts"><span>${count.taken} ${tx("taken","নেওয়া হয়েছে")}</span><span>${count.missed} ${tx("marked missed","বাদ হিসেবে চিহ্নিত")}</span><span>${count.pending} ${tx("not recorded","নথিভুক্ত হয়নি")}</span></div>`;
  const days=[];
  for(let i=0;i<7;i++){
    const d=shiftKey(localKey(),-i);
    if(d<KEYS.historyStart) continue;
    const c=countDay(d);
    days.push(`<div class="history-row"><div><strong>${safe(formatDate(d,{weekday:"short",day:"numeric",month:"short"}))}</strong><small>${c.taken} ${tx("taken","নেওয়া")} · ${c.missed} ${tx("missed","বাদ")} · ${c.pending} ${tx("unrecorded","নথিভুক্ত নয়")}</small></div><span>${c.percent}%</span></div>`);
  }
  document.getElementById("historyList").innerHTML=days.join("")||`<p class="subtle-note">${tx("No history yet.","এখনও কোনো হিসাব নেই।")}</p>`;
}
function renderSettings() {
  document.getElementById("firstDoseDate").value=state.settings.firstDoseDate;
  document.getElementById("trackingStartDate").value=state.settings.trackingStartDate;
  document.getElementById("morningReminder").value=state.settings.reminders.morning||"";
  document.getElementById("noonReminder").value=state.settings.reminders.noon||"";
  document.getElementById("nightReminder").value=state.settings.reminders.night||"";
  document.getElementById("referenceList").innerHTML=meds.map(m=>`<article class="reference-item">
    <img class="reference-thumb" src="${medicineImageSrc(m.id)}" alt="${safe(medicineDisplayName(m))} package" loading="lazy" decoding="async">
    <div class="reference-copy"><strong>${m.id}. ${safe(medicineDisplayName(m))}</strong>
    <span>${safe(m.strength)} · ${safe(m.freq)} · ${m.duration} ${m.unit}${m.continued?" · Continue: Yes":""}${m.meal==="before"?" · Before food":m.meal==="after"?" · After food":""}</span></div>
  </article>`).join("");
}
function renderReminder() {
  const now=new Date(), hh=String(now.getHours()).padStart(2,"0"), mm=String(now.getMinutes()).padStart(2,"0"), current=`${hh}:${mm}`;
  const due=[];
  ["morning","noon","night"].forEach(slot=>{
    const t=state.settings.reminders[slot];
    if(t&&current>=t){
      const c=slotCounts(slot,localKey());
      if(c.total>0&&!c.complete) due.push({slot,count:c});
    }
  });
  const banner=document.getElementById("visualReminder");
  if(due.length) {
    banner.hidden=false;
    banner.innerHTML=due.map(item=>{
      const info=slotInfo[item.slot];
      const label=tx(info.en,info.bn);
      const message=tx(`${item.count.total-item.count.taken} medicine(s) still need a checklist update.`,`আরও ${item.count.total-item.count.taken}টি ওষুধের চেকলিস্ট আপডেট বাকি।`);
      return `<div class="visual-reminder-row"><div class="visual-reminder-copy"><strong>${safe(tx("Time to check your medicines","ওষুধের চেকলিস্ট দেখার সময়"))} · ${safe(label)}</strong>${safe(message)}</div><button type="button" data-reminder-slot="${item.slot}">${safe(tx("Open","খুলুন"))}</button></div>`;
    }).join("");
    document.title="• "+tx("Medicine reminder","ওষুধের রিমাইন্ডার")+" | HeartCare";
  } else {
    banner.hidden=true;
    banner.innerHTML="";
    document.title="HeartCare — Daily Recovery";
  }
}
function renderAll() {
  applyTranslations();
  renderHome();
  renderHub();
  renderSession();
  renderWound();
  renderSos();
  renderHistory();
  renderSettings();
  renderReminder();
}
function openHub() {
  selectedDate=selectedDate||defaultSelectedDate();
  showScreen("medicineHubScreen");
}
function recordDoseFromButton(button) {
  const id=Number(button.dataset.medId), action=button.dataset.doseAction;
  if(action==="missed"&&!confirm(tx("Mark this dose as not taken? It will remain visible in the history.","এই ডোজটি নেওয়া হয়নি হিসেবে চিহ্নিত করবেন? এটি ইতিহাসে দেখা যাবে।"))) return;
  setDoseStatus(id,selectedSlot,action);
  if(action==="taken") showToast(tx("Dose marked as taken.","ডোজ নেওয়া হয়েছে হিসেবে চিহ্নিত।"));
  if(action==="missed") showToast(tx("Dose recorded as not taken.","ডোজ নেওয়া হয়নি হিসেবে নথিভুক্ত।"));
}
function saveSettings() {
  const first=document.getElementById("firstDoseDate").value;
  const tracking=document.getElementById("trackingStartDate").value;
  if(!first||!tracking) { showToast(tx("Please enter both dates.","দুটি তারিখই লিখুন।")); return; }
  state.settings.firstDoseDate=first;
  state.settings.trackingStartDate=tracking;
  state.settings.reminders={
    morning:document.getElementById("morningReminder").value,
    noon:document.getElementById("noonReminder").value,
    night:document.getElementById("nightReminder").value
  };
  saveState(); renderAll(); showToast(tx("Settings saved.","সেটিংস সংরক্ষিত হয়েছে।"));
}
function logSosUse() {
  if(isFuture(selectedDate)) return;
  if(!confirm(tx("Record one Tramadol suppository use now? Only log it if it was actually given as prescribed.","এখন একটি ট্রামাডল সাপোজিটরি ব্যবহার নথিভুক্ত করবেন? চিকিৎসকের নির্দেশনা অনুযায়ী বাস্তবে দেওয়া হলেই নথিভুক্ত করুন।"))) return;
  getLog(selectedDate).sos.push({at:new Date().toISOString(),medicineId:18});
  saveState(); renderSos(); renderHistory(); showToast(tx("SOS use recorded.","SOS ব্যবহার নথিভুক্ত হয়েছে।"));
}
function exportBackup() {
  const data={app:"HeartCare",version:2,exportedAt:new Date().toISOString(),state};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob), a=document.createElement("a");
  a.href=url; a.download=`heartcare-backup-${localKey()}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function importBackup(file) {
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const parsed=JSON.parse(reader.result), incoming=parsed.state||parsed;
      if(!incoming.settings||!incoming.logs)throw new Error("Invalid backup");
      if(!confirm(tx("Restore this backup? It will replace HeartCare data saved in this browser.","এই ব্যাকআপ ফিরিয়ে আনবেন? এই ব্রাউজারে সংরক্ষিত HeartCare তথ্য প্রতিস্থাপিত হবে।")))return;
      state={settings:{...defaultState.settings,...incoming.settings,reminders:{...defaultState.settings.reminders,...(incoming.settings.reminders||{})}},logs:incoming.logs||{},medStartDates:incoming.medStartDates||{}};
      saveState(); renderAll(); showToast(tx("Backup restored.","ব্যাকআপ ফিরিয়ে আনা হয়েছে।"));
    }catch(e){showToast(tx("This is not a valid HeartCare backup.","এটি সঠিক HeartCare ব্যাকআপ নয়।"));}
  };
  reader.readAsText(file);
}
function bindEvents() {
  document.getElementById("homeBrand").addEventListener("click",()=>showScreen("homeScreen"));
  document.getElementById("languageSelect").addEventListener("change",e=>{state.settings.language=e.target.value;saveState();renderAll();});
  document.getElementById("themeToggle").addEventListener("click",()=>{state.settings.theme=state.settings.theme==="dark"?"light":"dark";saveState();renderAll();});
  document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>{
    if(b.dataset.go==="medicineHub") { selectedDate=defaultSelectedDate(); showScreen("medicineHubScreen"); }
    else showScreen(b.dataset.go);
  }));
  document.querySelectorAll("[data-back]").forEach(b=>b.addEventListener("click",()=>showScreen(b.dataset.back)));
  document.getElementById("timeChoiceList").addEventListener("click",e=>{
    const button=e.target.closest("[data-open-slot]"); if(!button)return;
    selectedSlot=button.dataset.openSlot; showScreen("sessionScreen");
  });
  document.getElementById("visualReminder").addEventListener("click",e=>{
    const button=e.target.closest("[data-reminder-slot]"); if(!button)return;
    selectedDate=localKey(); selectedSlot=button.dataset.reminderSlot; showScreen("sessionScreen");
  });
  document.getElementById("previousDate").addEventListener("click",()=>{selectedDate=shiftKey(selectedDate,-1);renderAll();});
  document.getElementById("nextDate").addEventListener("click",()=>{if(selectedDate<localKey()){selectedDate=shiftKey(selectedDate,1);renderAll();}});
  document.getElementById("medicineCardList").addEventListener("click",e=>{
    const button=e.target.closest("[data-dose-action]"); if(button)recordDoseFromButton(button);
  });
  document.getElementById("woundTaskList").addEventListener("click",e=>{
    const button=e.target.closest("[data-wound-slot]");if(!button||isFuture(selectedDate))return;
    setDoseStatus(19,button.dataset.woundSlot,button.dataset.woundAction);
  });
  document.getElementById("logSosButton").addEventListener("click",logSosUse);
  document.getElementById("historyDate").addEventListener("change",renderHistory);
  document.getElementById("editHistoryDate").addEventListener("click",()=>{
    const key=document.getElementById("historyDate").value;
    if(!key)return; selectedDate=key; showScreen("medicineHubScreen");
  });
  document.getElementById("saveSettings").addEventListener("click",saveSettings);
  document.getElementById("exportBackup").addEventListener("click",exportBackup);
  document.getElementById("importBackupButton").addEventListener("click",()=>document.getElementById("importBackupFile").click());
  document.getElementById("importBackupFile").addEventListener("change",e=>{importBackup(e.target.files?.[0]);e.target.value="";});
}
function initialise() {
  selectedDate=defaultSelectedDate();
  bindEvents();
  renderAll();
  setInterval(renderReminder,60000);
}
document.addEventListener("DOMContentLoaded",initialise);

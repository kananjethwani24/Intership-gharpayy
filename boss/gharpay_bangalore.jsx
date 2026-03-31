
import { useState, useEffect, useCallback, useRef } from "react";

// ============================================================
// ═══════════ BANGALORE GEO-INTELLIGENCE DATABASE ════════════
// ============================================================

// Haversine straight-line distance (km)
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dL = (lat2 - lat1) * Math.PI / 180;
  const dG = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dL/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dG/2)**2;
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(2);
}

// Road distance ≈ 1.35× straight-line (Bangalore correction factor)
const roadDist = (lat1, lng1, lat2, lng2) => +(haversine(lat1,lng1,lat2,lng2)*1.35).toFixed(1);

const AREAS = [
  // ── CENTRAL ──────────────────────────────────────────────
  { id:"mg_road",         name:"MG Road",                      pincode:"560001", lat:12.9757, lng:77.6077, tier:"luxury",    type:"commercial",   region:"Central",  desc:"CBD, Purple metro line, Brigade Road adjacent" },
  { id:"richmond_town",   name:"Richmond Town",                pincode:"560025", lat:12.9605, lng:77.5983, tier:"luxury",    type:"residential",  region:"Central",  desc:"Upscale old-money neighbourhood near Ulsoor" },
  { id:"shivajinagar",    name:"Shivajinagar",                 pincode:"560020", lat:12.9867, lng:77.5966, tier:"mid",       type:"mixed",        region:"Central",  desc:"Govt offices, bus terminals, commercial" },
  { id:"frazer_town",     name:"Frazer Town",                  pincode:"560005", lat:12.9880, lng:77.6224, tier:"luxury",    type:"residential",  region:"Central",  desc:"Leafy, cosmopolitan, older bungalows & apartments" },
  { id:"cox_town",        name:"Cox Town",                     pincode:"560005", lat:12.9904, lng:77.6200, tier:"premium",   type:"residential",  region:"Central",  desc:"Quiet lanes, heritage buildings" },
  { id:"sadashivanagar",  name:"Sadashivanagar",               pincode:"560080", lat:13.0062, lng:77.5828, tier:"luxury",    type:"residential",  region:"Central",  desc:"Most expensive zip in Bangalore, diplomatic enclave" },
  { id:"dollar_colony",   name:"Dollar Colony / Palace Gutta", pincode:"560020", lat:13.0000, lng:77.5813, tier:"luxury",    type:"residential",  region:"Central",  desc:"Adjacent to Palace Grounds, extremely premium" },
  { id:"basavanagudi",    name:"Basavanagudi",                  pincode:"560004", lat:12.9434, lng:77.5750, tier:"premium",   type:"residential",  region:"Central",  desc:"Old Bangalore, Bull Temple Rd, leafy residential" },

  // ── KORAMANGALA ───────────────────────────────────────────
  { id:"korm_1",  name:"Koramangala 1st Block", pincode:"560034", lat:12.9318, lng:77.6152, tier:"premium",  type:"residential", region:"South", desc:"Quiet, near Christ University" },
  { id:"korm_2",  name:"Koramangala 2nd Block", pincode:"560034", lat:12.9330, lng:77.6180, tier:"premium",  type:"residential", region:"South", desc:"Residential, near NGV" },
  { id:"korm_3",  name:"Koramangala 3rd Block", pincode:"560034", lat:12.9340, lng:77.6220, tier:"premium",  type:"mixed",       region:"South", desc:"Restaurants, co-working, residential" },
  { id:"korm_4",  name:"Koramangala 4th Block", pincode:"560034", lat:12.9352, lng:77.6245, tier:"premium",  type:"mixed",       region:"South", desc:"Central Koramangala, IIMB area" },
  { id:"korm_5",  name:"Koramangala 5th Block", pincode:"560095", lat:12.9363, lng:77.6270, tier:"premium",  type:"commercial",  region:"South", desc:"Forum Mall, startups, dining" },
  { id:"korm_6",  name:"Koramangala 6th Block", pincode:"560095", lat:12.9373, lng:77.6290, tier:"premium",  type:"mixed",       region:"South", desc:"Hipster cafes, startup culture" },
  { id:"korm_7",  name:"Koramangala 7th Block", pincode:"560095", lat:12.9335, lng:77.6290, tier:"premium",  type:"mixed",       region:"South", desc:"Dense residential + commercial" },
  { id:"korm_8",  name:"Koramangala 8th Block", pincode:"560095", lat:12.9320, lng:77.6310, tier:"premium",  type:"residential", region:"South", desc:"Quieter, SGPalya end" },
  { id:"sg_palya",name:"SGPalya",               pincode:"560029", lat:12.9285, lng:77.6330, tier:"mid",      type:"residential", region:"South", desc:"Adjoins Koramangala 8th, affordable pocket" },

  // ── BTM LAYOUT ────────────────────────────────────────────
  { id:"btm_1",   name:"BTM Layout Sector 1",  pincode:"560029", lat:12.9180, lng:77.6080, tier:"mid",      type:"residential", region:"South", desc:"Western BTM, near Jayanagar" },
  { id:"btm_2",   name:"BTM Layout Sector 2",  pincode:"560076", lat:12.9165, lng:77.6101, tier:"mid",      type:"mixed",       region:"South", desc:"Main commercial BTM, dense" },

  // ── HSR LAYOUT ────────────────────────────────────────────
  { id:"hsr_1",   name:"HSR Layout Sector 1",  pincode:"560102", lat:12.9180, lng:77.6389, tier:"premium",  type:"residential", region:"South", desc:"North HSR, near Koramangala" },
  { id:"hsr_2",   name:"HSR Layout Sector 2",  pincode:"560102", lat:12.9150, lng:77.6389, tier:"premium",  type:"residential", region:"South", desc:"Central HSR" },
  { id:"hsr_3",   name:"HSR Layout Sector 3",  pincode:"560102", lat:12.9116, lng:77.6389, tier:"premium",  type:"residential", region:"South", desc:"Central HSR, startup hubs" },
  { id:"hsr_4",   name:"HSR Layout Sector 4",  pincode:"560102", lat:12.9090, lng:77.6389, tier:"premium",  type:"residential", region:"South", desc:"Quiet residential sector" },
  { id:"hsr_5",   name:"HSR Layout Sector 5",  pincode:"560102", lat:12.9060, lng:77.6389, tier:"premium",  type:"residential", region:"South", desc:"Near BDA complex" },
  { id:"hsr_6",   name:"HSR Layout Sector 6",  pincode:"560102", lat:12.9030, lng:77.6389, tier:"premium",  type:"residential", region:"South", desc:"South HSR near Silk Board" },
  { id:"hsr_7",   name:"HSR Layout Sector 7",  pincode:"560102", lat:12.9000, lng:77.6389, tier:"premium",  type:"residential", region:"South", desc:"Southernmost HSR, quieter" },

  // ── JAYANAGAR ─────────────────────────────────────────────
  { id:"jaya_1",  name:"Jayanagar 1st Block",  pincode:"560041", lat:12.9312, lng:77.5938, tier:"premium",  type:"residential", region:"South", desc:"North Jayanagar, near South End Circle" },
  { id:"jaya_2",  name:"Jayanagar 2nd Block",  pincode:"560041", lat:12.9295, lng:77.5938, tier:"premium",  type:"residential", region:"South", desc:"Established residential" },
  { id:"jaya_3",  name:"Jayanagar 3rd Block",  pincode:"560041", lat:12.9280, lng:77.5938, tier:"premium",  type:"residential", region:"South", desc:"Leafy streets" },
  { id:"jaya_4t", name:"Jayanagar 4th T Block",pincode:"560041", lat:12.9265, lng:77.5970, tier:"premium",  type:"mixed",       region:"South", desc:"Shopping hub, Jayanagar metro" },
  { id:"jaya_5",  name:"Jayanagar 5th Block",  pincode:"560041", lat:12.9250, lng:77.5938, tier:"premium",  type:"residential", region:"South", desc:"Near metro station" },
  { id:"jaya_6",  name:"Jayanagar 6th Block",  pincode:"560041", lat:12.9235, lng:77.5950, tier:"premium",  type:"residential", region:"South", desc:"Central-south Jayanagar" },
  { id:"jaya_7",  name:"Jayanagar 7th Block",  pincode:"560082", lat:12.9220, lng:77.5938, tier:"premium",  type:"residential", region:"South", desc:"Well-planned layouts" },
  { id:"jaya_8",  name:"Jayanagar 8th Block",  pincode:"560082", lat:12.9200, lng:77.5938, tier:"mid",      type:"residential", region:"South", desc:"Near JP Nagar boundary" },
  { id:"jaya_9",  name:"Jayanagar 9th Block",  pincode:"560041", lat:12.9185, lng:77.5938, tier:"mid",      type:"residential", region:"South", desc:"Southernmost Jayanagar block" },

  // ── JP NAGAR ──────────────────────────────────────────────
  { id:"jpn_1",   name:"JP Nagar Phase 1",     pincode:"560078", lat:12.9200, lng:77.5850, tier:"premium",  type:"residential", region:"South", desc:"Adjacent to Jayanagar, premium" },
  { id:"jpn_2",   name:"JP Nagar Phase 2",     pincode:"560078", lat:12.9150, lng:77.5850, tier:"premium",  type:"residential", region:"South", desc:"IIMB nearby" },
  { id:"jpn_3",   name:"JP Nagar Phase 3",     pincode:"560078", lat:12.9100, lng:77.5844, tier:"mid",      type:"residential", region:"South", desc:"Good connectivity" },
  { id:"jpn_4",   name:"JP Nagar Phase 4",     pincode:"560078", lat:12.9050, lng:77.5844, tier:"mid",      type:"residential", region:"South", desc:"Bannerghatta Road adjacent" },
  { id:"jpn_5",   name:"JP Nagar Phase 5",     pincode:"560062", lat:12.9000, lng:77.5844, tier:"mid",      type:"residential", region:"South", desc:"Near Arekere" },
  { id:"jpn_6",   name:"JP Nagar Phase 6",     pincode:"560062", lat:12.8950, lng:77.5844, tier:"mid",      type:"residential", region:"South", desc:"South extension" },
  { id:"jpn_7",   name:"JP Nagar Phase 7",     pincode:"560062", lat:12.8900, lng:77.5844, tier:"mid",      type:"residential", region:"South", desc:"Near Puttenahalli Lake" },

  // ── BANASHANKARI / SOUTH ─────────────────────────────────
  { id:"banashankari",name:"Banashankari",      pincode:"560050", lat:12.9232, lng:77.5476, tier:"mid",      type:"residential", region:"South", desc:"Metro terminus (south), temple area" },
  { id:"bannerhatta", name:"Bannerghatta Road", pincode:"560076", lat:12.8900, lng:77.5976, tier:"mid",      type:"mixed",       region:"South", desc:"Extended residential, Arekere, Gottigere" },
  { id:"elec_city_1", name:"Electronic City Phase 1", pincode:"560100",lat:12.8491,lng:77.6741,tier:"affordable",type:"it_hub", region:"South", desc:"Infosys, HCL, Wipro campuses" },
  { id:"elec_city_2", name:"Electronic City Phase 2", pincode:"560100",lat:12.8399,lng:77.6770,tier:"affordable",type:"it_hub", region:"South", desc:"Extended IT zone, SJR iPark" },

  // ── SARJAPUR / ORR / BELLANDUR ────────────────────────────
  { id:"sarjapur_road",name:"Sarjapur Road",    pincode:"560034", lat:12.9102, lng:77.6805, tier:"mid",      type:"it_corridor", region:"South-East", desc:"ORR to Sarjapur, high-rise apartments" },
  { id:"bellandur",   name:"Bellandur",         pincode:"560103", lat:12.9256, lng:77.6720, tier:"mid",      type:"mixed",       region:"South-East", desc:"Ecospace, Pritech Park, lake area" },
  { id:"haralur",     name:"Haralur Road",      pincode:"560102", lat:12.9050, lng:77.6650, tier:"mid",      type:"residential", region:"South-East", desc:"HSR extension, new apartments" },
  { id:"carmelaram",  name:"Carmelaram",        pincode:"560035", lat:12.8989, lng:77.7072, tier:"affordable",type:"residential",region:"South-East", desc:"Near Sarjapur, growing IT suburb" },

  // ── EAST BANGALORE ────────────────────────────────────────
  { id:"indiranagar",name:"Indiranagar",        pincode:"560038", lat:12.9784, lng:77.6408, tier:"luxury",   type:"mixed",       region:"East", desc:"100 Feet Road, metro, premium nightlife" },
  { id:"indir_1",    name:"Indiranagar 1st Stage",pincode:"560038",lat:12.9784,lng:77.6408, tier:"luxury",   type:"residential", region:"East", desc:"Heritage residential stretch" },
  { id:"indir_2",    name:"Indiranagar 2nd Stage",pincode:"560038",lat:12.9800,lng:77.6450, tier:"luxury",   type:"mixed",       region:"East", desc:"100 Feet Road commercial strip" },
  { id:"domlur",     name:"Domlur",             pincode:"560071", lat:12.9609, lng:77.6387, tier:"premium",  type:"mixed",       region:"East", desc:"HAL/ISRO vicinity, IT offices" },
  { id:"ejipura",    name:"Ejipura / Viveknagar",pincode:"560047",lat:12.9530, lng:77.6350, tier:"mid",      type:"residential", region:"East", desc:"Between Koramangala & Indiranagar" },
  { id:"old_airport",name:"Old Airport Road",   pincode:"560017", lat:12.9607, lng:77.6491, tier:"premium",  type:"mixed",       region:"East", desc:"HAL, Manipal Hospital, Ulsoor" },
  { id:"cv_raman",   name:"CV Raman Nagar",     pincode:"560093", lat:12.9869, lng:77.6634, tier:"mid",      type:"residential", region:"East", desc:"Bagmane Tech Park nearby" },
  { id:"marathahalli",name:"Marathahalli",      pincode:"560037", lat:12.9545, lng:77.7011, tier:"mid",      type:"mixed",       region:"East", desc:"ORR junction, heavy traffic, IT hub" },
  { id:"whitefield", name:"Whitefield",         pincode:"560066", lat:12.9698, lng:77.7499, tier:"mid",      type:"it_hub",      region:"East", desc:"Largest IT hub, ITPL, Phoenix Mall" },
  { id:"itpl_area",  name:"ITPL / Brookefield", pincode:"560037", lat:12.9845, lng:77.7268, tier:"mid",      type:"it_hub",      region:"East", desc:"ITPL campus, Tin Factory nearby" },
  { id:"hoodi",      name:"Hoodi",              pincode:"560048", lat:12.9879, lng:77.7084, tier:"mid",      type:"mixed",       region:"East", desc:"Between KR Puram & Whitefield" },
  { id:"varthur",    name:"Varthur",            pincode:"560087", lat:12.9395, lng:77.7350, tier:"affordable",type:"residential",region:"East", desc:"Growing suburb near Whitefield" },
  { id:"kadugodi",   name:"Kadugodi",           pincode:"560067", lat:12.9937, lng:77.7484, tier:"affordable",type:"residential",region:"East", desc:"Near Whitefield, affordable" },
  { id:"kr_puram",   name:"KR Puram",           pincode:"560036", lat:13.0074, lng:77.6946, tier:"affordable",type:"residential",region:"East", desc:"Railway station, growing area" },
  { id:"banaswadi",  name:"Banaswadi",          pincode:"560043", lat:13.0105, lng:77.6528, tier:"mid",      type:"residential", region:"East", desc:"Between HBR & Indiranagar" },

  // ── NORTH BANGALORE ───────────────────────────────────────
  { id:"hebbal",     name:"Hebbal",             pincode:"560024", lat:13.0358, lng:77.5970, tier:"premium",  type:"mixed",       region:"North", desc:"Manyata Tech Park, flyover, lake" },
  { id:"nagawara",   name:"Nagawara",           pincode:"560045", lat:13.0428, lng:77.6246, tier:"mid",      type:"mixed",       region:"North", desc:"Manyata feeder zone" },
  { id:"thanisandra",name:"Thanisandra",        pincode:"560077", lat:13.0574, lng:77.6216, tier:"mid",      type:"residential", region:"North", desc:"Growing residential, new apartments" },
  { id:"hennur",     name:"Hennur Road",        pincode:"560043", lat:13.0480, lng:77.6358, tier:"affordable",type:"residential",region:"North", desc:"Budget apartments, upcoming area" },
  { id:"hbr_layout", name:"HBR Layout",        pincode:"560045", lat:13.0249, lng:77.6397, tier:"mid",      type:"residential", region:"North", desc:"HBR main road connectivity" },
  { id:"rt_nagar",   name:"RT Nagar",           pincode:"560032", lat:13.0205, lng:77.5914, tier:"mid",      type:"residential", region:"North", desc:"North Bangalore, established" },
  { id:"yelahanka",  name:"Yelahanka",          pincode:"560064", lat:13.1007, lng:77.5963, tier:"mid",      type:"residential", region:"North", desc:"Airport corridor, growing fast" },
  { id:"yelahanka_new",name:"Yelahanka New Town",pincode:"560064",lat:13.0971, lng:77.5920, tier:"mid",      type:"residential", region:"North", desc:"Planned township, good infra" },
  { id:"jakkur",     name:"Jakkur",             pincode:"560064", lat:13.0661, lng:77.5864, tier:"mid",      type:"residential", region:"North", desc:"Airport road, Jakkur Lake" },
  { id:"devanahalli",name:"Devanahalli",        pincode:"562110", lat:13.2479, lng:77.7167, tier:"affordable",type:"residential",region:"North", desc:"Near KIAL, logistics, growing" },
  { id:"kogilu",     name:"Kogilu",             pincode:"560064", lat:13.0650, lng:77.5900, tier:"affordable",type:"residential",region:"North", desc:"Near Yelahanka, budget" },

  // ── WEST BANGALORE ────────────────────────────────────────
  { id:"rajajinagar",name:"Rajajinagar",        pincode:"560010", lat:12.9988, lng:77.5562, tier:"premium",  type:"residential", region:"West", desc:"Metro connected, old Bangalore premium" },
  { id:"malleswaram",name:"Malleswaram",        pincode:"560003", lat:13.0032, lng:77.5700, tier:"premium",  type:"residential", region:"West", desc:"Heritage, Brahmin agrahara roots, premium" },
  { id:"mathikere",  name:"Mathikere",          pincode:"560054", lat:13.0132, lng:77.5600, tier:"mid",      type:"residential", region:"West", desc:"MSRIT area, residential" },
  { id:"yeshwanthpur",name:"Yeshwanthpur",      pincode:"560022", lat:13.0227, lng:77.5450, tier:"mid",      type:"mixed",       region:"West", desc:"Railway junction, metro, industrial" },
  { id:"peenya",     name:"Peenya",             pincode:"560058", lat:13.0286, lng:77.5211, tier:"affordable",type:"industrial",  region:"West", desc:"Industrial estate, metro" },
  { id:"vijayanagar",name:"Vijayanagar",        pincode:"560040", lat:12.9793, lng:77.5364, tier:"mid",      type:"residential", region:"West", desc:"Metro (Purple line), dense residential" },
  { id:"nagarbhavi", name:"Nagarbhavi",         pincode:"560072", lat:12.9730, lng:77.5101, tier:"mid",      type:"residential", region:"West", desc:"RGU campus nearby, large layouts" },
  { id:"rr_nagar",   name:"RR Nagar",           pincode:"560098", lat:12.9179, lng:77.5175, tier:"mid",      type:"residential", region:"West", desc:"Large residential township, PES University" },
  { id:"kengeri",    name:"Kengeri",            pincode:"560060", lat:12.9140, lng:77.4829, tier:"affordable",type:"residential", region:"West", desc:"Purple metro terminus, affordable" },
  { id:"mysore_road",name:"Mysore Road",        pincode:"560026", lat:12.9500, lng:77.5100, tier:"affordable",type:"mixed",       region:"West", desc:"NICE road, growing commercial" },
];

const TECH_PARKS = [
  { id:"manyata",    name:"Manyata Tech Park",           lat:13.0461, lng:77.6214, area:"Hebbal/Nagawara",        companies:"Goldman Sachs, SAP, Mphasis, L&T Infotech" },
  { id:"embassy_tv", name:"Embassy Tech Village",        lat:12.9287, lng:77.6889, area:"Devarabeesanahalli/ORR", companies:"IBM, Accenture, Cisco, Dell" },
  { id:"bagmane",    name:"Bagmane Tech Park",           lat:12.9869, lng:77.6634, area:"CV Raman Nagar",         companies:"Cognizant, Nokia, Citibank" },
  { id:"prestige_tp",name:"Prestige Tech Park",          lat:12.9213, lng:77.6871, area:"ORR/Marathahalli",       companies:"Accenture, Qualcomm, Akamai" },
  { id:"ecity_hub",  name:"Electronic City (Infosys/Wipro)", lat:12.8491, lng:77.6741, area:"Electronic City Ph1", companies:"Infosys, Wipro, HCL, TCS, Siemens" },
  { id:"itpl",       name:"International Tech Park ITPL",lat:12.9845, lng:77.7268, area:"Whitefield",            companies:"Multiple MNCs, Infosys BPO" },
  { id:"global_tv",  name:"Embassy Global Tech Village", lat:12.9204, lng:77.6780, area:"Bellandur/ORR",          companies:"Flipkart, Target India" },
  { id:"cessna",     name:"Cessna Business Park",        lat:12.9342, lng:77.6910, area:"Kadubeesanahalli/ORR",   companies:"Capgemini, Ernst & Young" },
  { id:"rga_tech",   name:"RGA Tech Park",               lat:12.9067, lng:77.6698, area:"Sarjapur Road",          companies:"Oracle, Microland" },
  { id:"rmz_infinity",name:"RMZ Infinity",               lat:12.9885, lng:77.7034, area:"Old Madras Road",        companies:"Amazon, JP Morgan" },
  { id:"ecospace",   name:"EcoSpace Business Park",      lat:12.9345, lng:77.6898, area:"Bellandur/ORR",          companies:"SAP Labs, Tech Mahindra, KPMG" },
  { id:"kirloskar_tp",name:"Kirloskar Tech Park",        lat:13.0440, lng:77.5870, area:"Hebbal",                 companies:"ABB, Ericsson" },
  { id:"intel_campus",name:"Intel Campus Whitefield",    lat:12.9712, lng:77.7332, area:"Whitefield",             companies:"Intel" },
  { id:"bosch",      name:"Bosch / Robert Bosch Campus", lat:12.9200, lng:77.6100, area:"Adugodi/Hosur Road",     companies:"Bosch" },
  { id:"igate_tech", name:"Pritech Park SEZ",            lat:12.9350, lng:77.6850, area:"Bellandur",              companies:"SAP, Mindtree" },
  { id:"rmz_ecoworld",name:"RMZ Ecoworld",               lat:12.9145, lng:77.6929, area:"Bellandur/Devarabeesanahalli", companies:"J.P. Morgan, ANZ, ThoughtWorks" },
  { id:"salarpuria_tecdzone",name:"Salarpuria Techzone", lat:12.9400, lng:77.6897, area:"ORR/Marathahalli",       companies:"Multiple IT companies" },
];

const METRO_STATIONS = [
  // Purple Line (East-West)
  {id:"m_kengeri",    name:"Kengeri",              lat:12.9140, lng:77.4829, line:"Purple"},
  {id:"m_pattanagere",name:"Pattanagere",          lat:12.9220, lng:77.4935, line:"Purple"},
  {id:"m_govindaraj", name:"Govindarajanagar",     lat:12.9340, lng:77.5070, line:"Purple"},
  {id:"m_mysore_rd",  name:"Mysore Road",          lat:12.9494, lng:77.5234, line:"Purple"},
  {id:"m_deepanjali", name:"Deepanjali Nagar",     lat:12.9557, lng:77.5316, line:"Purple"},
  {id:"m_attiguppe",  name:"Attiguppe",            lat:12.9622, lng:77.5398, line:"Purple"},
  {id:"m_vijay",      name:"Vijayanagar",          lat:12.9680, lng:77.5480, line:"Purple"},
  {id:"m_magadi_rd",  name:"Magadi Road",          lat:12.9694, lng:77.5542, line:"Purple"},
  {id:"m_city_rly",   name:"City Railway Station", lat:12.9772, lng:77.5724, line:"Purple"},
  {id:"m_majestic",   name:"Kempegowda (Majestic)",lat:12.9766, lng:77.5713, line:"Purple/Green"},
  {id:"m_cubbon",     name:"Cubbon Park",          lat:12.9762, lng:77.5933, line:"Purple"},
  {id:"m_mg_road",    name:"MG Road",              lat:12.9757, lng:77.6077, line:"Purple"},
  {id:"m_trinity",    name:"Trinity",              lat:12.9730, lng:77.6168, line:"Purple"},
  {id:"m_halasuru",   name:"Halasuru",             lat:12.9729, lng:77.6265, line:"Purple"},
  {id:"m_indiranagar",name:"Indiranagar",          lat:12.9776, lng:77.6384, line:"Purple"},
  {id:"m_sv_road",    name:"Swami Vivekananda Rd", lat:12.9777, lng:77.6499, line:"Purple"},
  {id:"m_baiyappa",   name:"Baiyappanahalli",      lat:12.9873, lng:77.6612, line:"Purple"},
  // Green Line (North-South)
  {id:"m_nagasandra", name:"Nagasandra",           lat:13.0536, lng:77.5137, line:"Green"},
  {id:"m_dasarahalli",name:"Dasarahalli",          lat:13.0438, lng:77.5207, line:"Green"},
  {id:"m_jalahalli",  name:"Jalahalli",            lat:13.0336, lng:77.5260, line:"Green"},
  {id:"m_peenya_ind", name:"Peenya Industry",      lat:13.0303, lng:77.5199, line:"Green"},
  {id:"m_peenya",     name:"Peenya",               lat:13.0235, lng:77.5198, line:"Green"},
  {id:"m_goragup",    name:"Goraguntepalya",       lat:13.0134, lng:77.5252, line:"Green"},
  {id:"m_yeshwantp",  name:"Yeshwanthpur",         lat:13.0215, lng:77.5399, line:"Green"},
  {id:"m_sandal",     name:"Sandal Soap Factory",  lat:13.0179, lng:77.5502, line:"Green"},
  {id:"m_mahalakshmi",name:"Mahalakshmi",          lat:13.0065, lng:77.5573, line:"Green"},
  {id:"m_rajajin",    name:"Rajajinagar",          lat:12.9988, lng:77.5562, line:"Green"},
  {id:"m_kuvempu",    name:"Kuvempu Road",         lat:12.9919, lng:77.5607, line:"Green"},
  {id:"m_srirampura", name:"Srirampura",           lat:12.9839, lng:77.5627, line:"Green"},
  {id:"m_mantri_sq",  name:"Mantri Square (Sampige Rd)", lat:12.9797, lng:77.5680, line:"Green"},
  {id:"m_chickpet",   name:"Chickpet",             lat:12.9656, lng:77.5728, line:"Green"},
  {id:"m_kr_market",  name:"KR Market",            lat:12.9590, lng:77.5742, line:"Green"},
  {id:"m_natl_college",name:"National College",    lat:12.9490, lng:77.5756, line:"Green"},
  {id:"m_lalbagh",    name:"Lalbagh",              lat:12.9445, lng:77.5845, line:"Green"},
  {id:"m_south_end",  name:"South End Circle",     lat:12.9399, lng:77.5887, line:"Green"},
  {id:"m_jayanagar",  name:"Jayanagar",            lat:12.9250, lng:77.5938, line:"Green"},
  {id:"m_rv_road",    name:"RV Road",              lat:12.9189, lng:77.5875, line:"Green"},
  {id:"m_banashankari",name:"Banashankari",        lat:12.9232, lng:77.5476, line:"Green"},
  {id:"m_jp_nagar",   name:"Jayaprakash Nagar",    lat:12.9105, lng:77.5624, line:"Green"},
  {id:"m_yelachenahalli",name:"Yelachenahalli",    lat:12.8980, lng:77.5710, line:"Green"},
  // Yellow Line (Phase 2 – operational/near-complete)
  {id:"m_silk_board", name:"Silk Board",           lat:12.9174, lng:77.6228, line:"Yellow"},
  {id:"m_hsr_m",      name:"HSR Layout",           lat:12.9116, lng:77.6389, line:"Yellow"},
  {id:"m_agara",      name:"Agara",                lat:12.9090, lng:77.6266, line:"Yellow"},
  {id:"m_iblur",      name:"Iblur Junction",       lat:12.9025, lng:77.6597, line:"Yellow"},
  {id:"m_bellandur_m",name:"Bellandur Road",       lat:12.9210, lng:77.6717, line:"Yellow"},
  {id:"m_kadubeesana",name:"Kadubeesanahalli",     lat:12.9454, lng:77.6952, line:"Yellow"},
  {id:"m_marathahalli_m",name:"Marathahalli Bridge",lat:12.9545, lng:77.7011,line:"Yellow"},
  // Pink Line (Phase 2B – under construction)
  {id:"m_nagawara_p", name:"Nagawara",             lat:13.0428, lng:77.6246, line:"Pink"},
  {id:"m_thanisandra_p",name:"Thanisandra",        lat:13.0574, lng:77.6216, line:"Pink"},
];

const LANDMARKS = [
  {id:"christ_univ",  name:"Christ University",          lat:12.9345, lng:77.6078, type:"University",  area:"Hosur Road/Dairy Circle"},
  {id:"iimb",         name:"IIM Bangalore",              lat:12.9326, lng:77.6052, type:"University",  area:"Bannerghatta Road"},
  {id:"rvce",         name:"RV College of Engineering",  lat:12.9228, lng:77.4990, type:"University",  area:"Mysore Road"},
  {id:"msrit",        name:"MS Ramaiah Institute",       lat:13.0212, lng:77.5601, type:"University",  area:"Mathikere"},
  {id:"pes_univ",     name:"PES University",             lat:12.9332, lng:77.5356, type:"University",  area:"RR Nagar"},
  {id:"blr_univ",     name:"Bangalore University",       lat:12.9556, lng:77.5091, type:"University",  area:"Jnanabharathi"},
  {id:"nimhans",      name:"NIMHANS",                    lat:12.9427, lng:77.5934, type:"Hospital",    area:"Hosur Road"},
  {id:"manipal",      name:"Manipal Hospital (OAR)",     lat:12.9607, lng:77.6491, type:"Hospital",    area:"Old Airport Road"},
  {id:"forum_mall",   name:"Forum Mall Koramangala",     lat:12.9363, lng:77.6270, type:"Mall",        area:"Koramangala 5th Block"},
  {id:"phoenix_wf",   name:"Phoenix Market City",        lat:12.9645, lng:77.7476, type:"Mall",        area:"Whitefield"},
  {id:"silk_board",   name:"Silk Board Junction",        lat:12.9174, lng:77.6228, type:"Junction",    area:"Silk Board"},
  {id:"airport",      name:"Kempegowda Intl Airport",    lat:13.1986, lng:77.7066, type:"Airport",     area:"Devanahalli"},
  {id:"city_rly",     name:"KSR City Railway Station",   lat:12.9769, lng:77.5714, type:"Railway",     area:"Majestic"},
  {id:"ypr_rly",      name:"Yesvantpur Railway Station", lat:13.0224, lng:77.5393, type:"Railway",     area:"Yeshwanthpur"},
  {id:"brigade_road", name:"Brigade Road",               lat:12.9719, lng:77.6074, type:"Commercial",  area:"MG Road / CBD"},
  {id:"ubs_ecity",    name:"UB City",                    lat:12.9715, lng:77.5959, type:"Luxury Mall", area:"Vittal Mallya Road"},
];

// ── GEO HELPERS ──────────────────────────────────────────────

function nearestMetro(lat, lng, n=3) {
  return METRO_STATIONS
    .map(m => ({...m, dist: haversine(lat,lng,m.lat,m.lng)}))
    .sort((a,b)=>a.dist-b.dist).slice(0,n);
}

function nearestTechParks(lat, lng, n=3) {
  return TECH_PARKS
    .map(tp => ({...tp, dist: haversine(lat,lng,tp.lat,tp.lng)}))
    .sort((a,b)=>a.dist-b.dist).slice(0,n);
}

function nearestLandmarks(lat, lng, n=4) {
  return LANDMARKS
    .map(l => ({...l, dist: haversine(lat,lng,l.lat,l.lng)}))
    .sort((a,b)=>a.dist-b.dist).slice(0,n);
}

function areaDistances(fromId) {
  const from = AREAS.find(a=>a.id===fromId);
  if(!from) return [];
  return AREAS
    .filter(a=>a.id!==fromId)
    .map(a=>({...a, dist: haversine(from.lat,from.lng,a.lat,a.lng)}))
    .sort((a,b)=>a.dist-b.dist);
}

const TIER_COLORS = {
  luxury:     "#D4A853",
  premium:    "#7EB8A4",
  mid:        "#6B9BD2",
  affordable: "#A0A0A0",
  it_hub:     "#C17ED1",
  it_corridor:"#C17ED1",
  industrial: "#888",
};

const LINE_COLORS = {
  "Purple":       "#9B59B6",
  "Green":        "#27AE60",
  "Purple/Green": "#E67E22",
  "Yellow":       "#F1C40F",
  "Pink":         "#E91E8C",
};

// ── KNOWLEDGE SNAPSHOT FOR AI ────────────────────────────────

function buildKnowledgeSnapshot() {
  const areaList = AREAS.map(a =>
    `${a.name} (PIN:${a.pincode}, tier:${a.tier}, region:${a.region}, type:${a.type})`
  ).join(" | ");
  const parkList = TECH_PARKS.map(p => `${p.name} [${p.area}]`).join(", ");
  const metroList = METRO_STATIONS.map(m => `${m.name} (${m.line})`).join(", ");
  return `
AREAS: ${areaList}
TECH_PARKS: ${parkList}
METRO: ${metroList}
  `.trim();
}

// ─────────────────────────────────────────────────────────────
// ═════════════════════ MAIN APP ══════════════════════════════
// ─────────────────────────────────────────────────────────────

export default function GharpayApp() {
  const [tab, setTab]               = useState("matcher");
  const [leadText, setLeadText]     = useState("");
  const [leadName, setLeadName]     = useState("");
  const [leadPhone, setLeadPhone]   = useState("");
  const [leadEmail, setLeadEmail]   = useState("");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(null);
  const [exploreFrom, setExploreFrom] = useState("korm_5");
  const [distFrom, setDistFrom]     = useState("korm_5");
  const [distTo, setDistTo]         = useState("indiranagar");

  // ── AI LEAD MATCHER ──────────────────────────────────────

  async function matchLead() {
    if(!leadText.trim()) { setError("Please enter lead details."); return; }
    setLoading(true); setError(null); setResult(null);

    const snapshot = buildKnowledgeSnapshot();
    const systemPrompt = `You are the geo-intelligence engine for Gharpay, a Bangalore property matching startup.
Given a sales lead (which may contain a name, phone, email, budget, preferred area, office location, property type), extract structured intent and match it to the best Bangalore residential areas.

Bangalore knowledge base:
${snapshot}

Return ONLY valid JSON (no markdown, no explanation):
{
  "extracted": {
    "name": "string or null",
    "budget_inr": "string like '50-80L', '1-2Cr', '30k-50k/mo' or null",
    "budget_tier": "luxury|premium|mid|affordable",
    "property_type": "buy|rent|pg|commercial|unknown",
    "office_location": "extracted office/company/area string or null",
    "matched_office_park_id": "id from TECH_PARKS or null",
    "preferred_area_raw": "string or null",
    "matched_area_ids": ["up to 5 best area ids from AREAS"],
    "commute_max_km": number or null,
    "notes": "brief reasoning"
  }
}`;

    const userMsg = `Lead details:
Name: ${leadName || "unknown"}
Phone: ${leadPhone || "not provided"}
Email: ${leadEmail || "not provided"}
Full lead text: ${leadText}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: userMsg }]
        })
      });
      const data = await res.json();
      const raw = data.content?.map(c=>c.text||"").join("") || "";
      const clean = raw.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      enrichResult(parsed.extracted);
    } catch(e) {
      setError("AI matching failed. Please check your input and try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function enrichResult(ext) {
    const matchedAreas = (ext.matched_area_ids || [])
      .map(id => AREAS.find(a=>a.id===id))
      .filter(Boolean)
      .map(area => {
        const metros  = nearestMetro(area.lat, area.lng, 3);
        const parks   = nearestTechParks(area.lat, area.lng, 3);
        const lmarks  = nearestLandmarks(area.lat, area.lng, 4);
        let officeInfo = null;
        if(ext.matched_office_park_id) {
          const op = TECH_PARKS.find(p=>p.id===ext.matched_office_park_id);
          if(op) officeInfo = { ...op, dist: haversine(area.lat,area.lng,op.lat,op.lng) };
        }
        return { ...area, metros, parks, lmarks, officeInfo };
      });

    setResult({ ...ext, matchedAreas });
  }

  // ── DISTANCE CALC ────────────────────────────────────────

  const fromArea = AREAS.find(a=>a.id===distFrom);
  const toArea   = AREAS.find(a=>a.id===distTo);
  const calcDist = fromArea && toArea ? {
    straight: haversine(fromArea.lat,fromArea.lng,toArea.lat,toArea.lng),
    road:     roadDist(fromArea.lat,fromArea.lng,toArea.lat,toArea.lng),
  } : null;

  // ── NEARBY EXPLORER ──────────────────────────────────────

  const exploreArea   = AREAS.find(a=>a.id===exploreFrom);
  const nearbyAreas   = exploreArea ? areaDistances(exploreFrom).slice(0,8) : [];
  const nearbyMetros  = exploreArea ? nearestMetro(exploreArea.lat, exploreArea.lng, 4) : [];
  const nearbyParks   = exploreArea ? nearestTechParks(exploreArea.lat, exploreArea.lng, 5) : [];
  const nearbyMarks   = exploreArea ? nearestLandmarks(exploreArea.lat, exploreArea.lng, 5) : [];

  // ─────────────────────────────────────────────────────────

  return (
    <div style={{
      fontFamily:"'IBM Plex Mono', 'Courier New', monospace",
      background:"#0C0C0E", color:"#E8E2D9", minHeight:"100vh",
      padding:"0"
    }}>
      {/* ── HEADER ── */}
      <div style={{
        background:"#111115", borderBottom:"1px solid #2A2A35",
        padding:"18px 32px", display:"flex", alignItems:"center", gap:"20px"
      }}>
        <div style={{
          background:"linear-gradient(135deg,#D4A853,#B8893A)",
          borderRadius:"6px", width:"36px", height:"36px",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"18px", fontWeight:"900", color:"#0C0C0E", letterSpacing:"-1px"
        }}>G</div>
        <div>
          <div style={{fontSize:"13px", fontWeight:"700", letterSpacing:"3px", color:"#D4A853"}}>
            GHARPAY
          </div>
          <div style={{fontSize:"10px", color:"#666", letterSpacing:"1px"}}>
            BANGALORE GEO-INTELLIGENCE PLATFORM
          </div>
        </div>
        <div style={{marginLeft:"auto", display:"flex", gap:"4px"}}>
          {["matcher","explorer","distances"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:"7px 16px", borderRadius:"4px", border:"none", cursor:"pointer",
              fontSize:"10px", fontWeight:"700", letterSpacing:"1.5px", textTransform:"uppercase",
              background: tab===t ? "#D4A853" : "transparent",
              color: tab===t ? "#0C0C0E" : "#888",
              transition:"all 0.15s"
            }}>{t==="matcher"?"AI Lead Matcher":t==="explorer"?"Area Explorer":"Distance Calc"}</button>
          ))}
        </div>
      </div>

      {/* ══ TAB: AI LEAD MATCHER ══ */}
      {tab==="matcher" && (
        <div style={{display:"grid", gridTemplateColumns:"400px 1fr", gap:"0", minHeight:"calc(100vh - 73px)"}}>
          {/* LEFT PANEL */}
          <div style={{background:"#111115", borderRight:"1px solid #1E1E28", padding:"28px", overflowY:"auto"}}>
            <div style={{fontSize:"11px", color:"#D4A853", letterSpacing:"2px", marginBottom:"20px", fontWeight:"700"}}>
              INCOMING LEAD
            </div>
            <div style={{display:"flex", flexDirection:"column", gap:"12px"}}>
              {[
                ["Name",  leadName,  setLeadName,  "Rajesh Kumar"],
                ["Phone", leadPhone, setLeadPhone, "+91 98765 43210"],
                ["Email", leadEmail, setLeadEmail, "rajesh@example.com"],
              ].map(([label, val, setter, ph])=>(
                <div key={label}>
                  <div style={{fontSize:"9px", color:"#666", letterSpacing:"1.5px", marginBottom:"5px"}}>{label.toUpperCase()}</div>
                  <input
                    value={val} onChange={e=>setter(e.target.value)}
                    placeholder={ph}
                    style={{
                      width:"100%", background:"#0C0C0E", border:"1px solid #2A2A35",
                      borderRadius:"4px", padding:"9px 12px", color:"#E8E2D9",
                      fontSize:"12px", fontFamily:"inherit", outline:"none",
                      boxSizing:"border-box"
                    }}
                  />
                </div>
              ))}
              <div>
                <div style={{fontSize:"9px", color:"#666", letterSpacing:"1.5px", marginBottom:"5px"}}>FULL LEAD TEXT / NOTES</div>
                <textarea
                  value={leadText}
                  onChange={e=>setLeadText(e.target.value)}
                  placeholder={`Paste or type anything the lead mentioned:\n\n"Looking for 2BHK near Manyata Tech Park, budget around 80L, prefer Hebbal or Nagawara, wife works in Whitefield, commute max 30 mins, need metro access, school for kids nearby"`}
                  rows={8}
                  style={{
                    width:"100%", background:"#0C0C0E", border:"1px solid #2A2A35",
                    borderRadius:"4px", padding:"9px 12px", color:"#E8E2D9",
                    fontSize:"12px", fontFamily:"inherit", outline:"none",
                    resize:"vertical", boxSizing:"border-box", lineHeight:"1.6"
                  }}
                />
              </div>
              <button onClick={matchLead} disabled={loading} style={{
                background: loading ? "#2A2A35" : "linear-gradient(135deg,#D4A853,#B8893A)",
                color: loading ? "#666" : "#0C0C0E", border:"none", borderRadius:"4px",
                padding:"13px 20px", fontSize:"11px", fontWeight:"700", letterSpacing:"2px",
                cursor: loading ? "not-allowed" : "pointer", marginTop:"8px",
                textTransform:"uppercase"
              }}>
                {loading ? "⟳  ANALYSING LEAD..." : "▶  MATCH LEAD TO AREAS"}
              </button>
              {error && (
                <div style={{background:"#1E0A0A", border:"1px solid #5A1A1A", borderRadius:"4px", padding:"10px 12px", fontSize:"11px", color:"#FF6B6B"}}>
                  {error}
                </div>
              )}
            </div>

            {/* Quick examples */}
            <div style={{marginTop:"28px"}}>
              <div style={{fontSize:"9px", color:"#444", letterSpacing:"1.5px", marginBottom:"10px"}}>QUICK TEST LEADS →</div>
              {[
                { label:"IT Pro – ORR Worker", text:"Works at Cessna Business Park on Outer Ring Road. Budget 80L-1Cr for 2BHK flat to buy. Wants to be within 5 km of office. Prefer HSR or Bellandur. Max commute 20 min." },
                { label:"Renter – North BLR", text:"Relocated to Manyata campus, Goldman Sachs. Need 3BHK rental around 40-55k/month. Prefer Hebbal, Nagawara, or Thanisandra. Kids in school, wife needs metro access." },
                { label:"First-Time Buyer", text:"Fresher at Infosys Electronic City. Budget 45L. Need 1BHK. OK with Bommanahalli, HSR outskirts, anywhere with good connectivity to Ecity." },
              ].map(ex=>(
                <div key={ex.label} onClick={()=>setLeadText(ex.text)} style={{
                  background:"#0C0C0E", border:"1px solid #1E1E28", borderRadius:"4px",
                  padding:"8px 12px", marginBottom:"6px", cursor:"pointer",
                  transition:"border-color 0.15s"
                }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#D4A853"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#1E1E28"}
                >
                  <div style={{fontSize:"10px", color:"#D4A853", marginBottom:"3px"}}>{ex.label}</div>
                  <div style={{fontSize:"10px", color:"#666", lineHeight:"1.5"}}>{ex.text.slice(0,80)}...</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL - RESULTS */}
          <div style={{padding:"28px", overflowY:"auto"}}>
            {!result && !loading && (
              <div style={{
                height:"100%", display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center", color:"#333", textAlign:"center"
              }}>
                <div style={{fontSize:"48px", marginBottom:"16px"}}>⌖</div>
                <div style={{fontSize:"13px", letterSpacing:"2px"}}>ENTER A LEAD TO BEGIN MATCHING</div>
                <div style={{fontSize:"10px", color:"#444", marginTop:"8px", maxWidth:"300px", lineHeight:"1.6"}}>
                  Paste any free-form lead text — office location, budget, preferred area, commute preference — and the AI will extract intent and match to optimal Bangalore areas.
                </div>
              </div>
            )}

            {loading && (
              <div style={{display:"flex", alignItems:"center", justifyContent:"center", height:"200px", flexDirection:"column", gap:"16px"}}>
                <div style={{fontSize:"24px", animation:"spin 1s linear infinite"}}>⟳</div>
                <div style={{fontSize:"11px", color:"#666", letterSpacing:"2px"}}>RUNNING GEO-INTELLIGENCE MATCH...</div>
              </div>
            )}

            {result && (
              <div>
                {/* Extracted Intent */}
                <div style={{marginBottom:"24px"}}>
                  <div style={{fontSize:"9px", color:"#D4A853", letterSpacing:"2px", marginBottom:"12px", fontWeight:"700"}}>
                    EXTRACTED INTENT
                  </div>
                  <div style={{
                    background:"#111115", border:"1px solid #1E1E28", borderRadius:"6px",
                    padding:"16px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px"
                  }}>
                    {[
                      ["Budget", result.budget_inr || "—"],
                      ["Tier",   result.budget_tier],
                      ["Type",   result.property_type],
                      ["Office", result.office_location || "—"],
                      ["Max Commute", result.commute_max_km ? result.commute_max_km+"km" : "—"],
                      ["Preferred", result.preferred_area_raw || "—"],
                    ].map(([k,v])=>(
                      <div key={k}>
                        <div style={{fontSize:"8px", color:"#555", letterSpacing:"1px", marginBottom:"3px"}}>{k}</div>
                        <div style={{fontSize:"12px", color:"#E8E2D9"}}>{v}</div>
                      </div>
                    ))}
                    {result.matched_office_park_id && (() => {
                      const op = TECH_PARKS.find(p=>p.id===result.matched_office_park_id);
                      return op ? (
                        <div style={{gridColumn:"1/-1", borderTop:"1px solid #1E1E28", paddingTop:"10px", marginTop:"2px"}}>
                          <div style={{fontSize:"8px", color:"#555", letterSpacing:"1px", marginBottom:"3px"}}>MATCHED OFFICE PARK</div>
                          <div style={{fontSize:"12px", color:"#7EB8A4"}}>
                            {op.name} <span style={{color:"#555"}}>— {op.area}</span>
                          </div>
                          <div style={{fontSize:"10px", color:"#555", marginTop:"2px"}}>{op.companies}</div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                  {result.notes && (
                    <div style={{fontSize:"10px", color:"#666", marginTop:"8px", lineHeight:"1.6", padding:"0 4px"}}>{result.notes}</div>
                  )}
                </div>

                {/* Matched Areas */}
                <div style={{fontSize:"9px", color:"#D4A853", letterSpacing:"2px", marginBottom:"12px", fontWeight:"700"}}>
                  MATCHED AREAS ({result.matchedAreas?.length || 0})
                </div>
                <div style={{display:"flex", flexDirection:"column", gap:"16px"}}>
                  {(result.matchedAreas||[]).map((area, idx)=>(
                    <div key={area.id} style={{
                      background:"#111115", border:`1px solid ${idx===0?"#D4A853":"#1E1E28"}`,
                      borderRadius:"6px", padding:"18px",
                    }}>
                      <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"12px"}}>
                        <div>
                          <div style={{display:"flex", alignItems:"center", gap:"8px"}}>
                            <span style={{
                              fontSize:"9px", background:TIER_COLORS[area.tier]||"#666",
                              color:"#0C0C0E", padding:"2px 7px", borderRadius:"2px", fontWeight:"700", letterSpacing:"0.5px"
                            }}>{area.tier.toUpperCase()}</span>
                            {idx===0&&<span style={{fontSize:"9px",color:"#D4A853",letterSpacing:"1px"}}>★ TOP MATCH</span>}
                          </div>
                          <div style={{fontSize:"16px", fontWeight:"700", marginTop:"5px", color:"#E8E2D9"}}>{area.name}</div>
                          <div style={{fontSize:"10px", color:"#666", marginTop:"2px"}}>PIN {area.pincode} · {area.region} Bangalore</div>
                        </div>
                        {area.officeInfo && (
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:"8px", color:"#555", letterSpacing:"1px"}}>TO OFFICE</div>
                            <div style={{fontSize:"18px", fontWeight:"700", color:"#7EB8A4"}}>{area.officeInfo.dist} km</div>
                            <div style={{fontSize:"9px", color:"#555"}}>≈ {(area.officeInfo.dist*1.35/30*60).toFixed(0)} min drive</div>
                          </div>
                        )}
                      </div>

                      <div style={{fontSize:"10px", color:"#999", marginBottom:"14px", lineHeight:"1.5"}}>{area.desc}</div>

                      {/* Metro */}
                      <div style={{marginBottom:"10px"}}>
                        <div style={{fontSize:"8px", color:"#555", letterSpacing:"1px", marginBottom:"6px"}}>NEAREST METRO STATIONS</div>
                        <div style={{display:"flex", gap:"8px", flexWrap:"wrap"}}>
                          {area.metros.map(m=>(
                            <div key={m.id} style={{
                              background:"#0C0C0E", border:`1px solid ${LINE_COLORS[m.line]||"#444"}`,
                              borderRadius:"3px", padding:"4px 8px", fontSize:"10px",
                              display:"flex", gap:"6px", alignItems:"center"
                            }}>
                              <span style={{color:LINE_COLORS[m.line]||"#999",fontWeight:"700",fontSize:"8px"}}>
                                {m.line.split("/")[0]}
                              </span>
                              <span style={{color:"#CCC"}}>{m.name}</span>
                              <span style={{color:"#555"}}>{m.dist.toFixed(1)}km</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tech Parks */}
                      <div style={{marginBottom:"10px"}}>
                        <div style={{fontSize:"8px", color:"#555", letterSpacing:"1px", marginBottom:"6px"}}>TECH PARKS WITHIN RANGE</div>
                        <div style={{display:"flex", flexDirection:"column", gap:"3px"}}>
                          {area.parks.map(p=>(
                            <div key={p.id} style={{
                              display:"flex", justifyContent:"space-between",
                              fontSize:"10px", color:"#999"
                            }}>
                              <span>{p.name}</span>
                              <span style={{color:"#555"}}>{p.dist.toFixed(1)} km · ≈{(p.dist*1.35/30*60).toFixed(0)} min</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Landmarks */}
                      <div>
                        <div style={{fontSize:"8px", color:"#555", letterSpacing:"1px", marginBottom:"6px"}}>NEARBY LANDMARKS</div>
                        <div style={{display:"flex", gap:"6px", flexWrap:"wrap"}}>
                          {area.lmarks.map(l=>(
                            <div key={l.id} style={{
                              fontSize:"9px", color:"#777", background:"#0C0C0E",
                              border:"1px solid #1E1E28", borderRadius:"3px", padding:"3px 7px"
                            }}>
                              {l.name} <span style={{color:"#444"}}>{l.dist.toFixed(1)}km</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB: AREA EXPLORER ══ */}
      {tab==="explorer" && (
        <div style={{padding:"28px"}}>
          <div style={{fontSize:"9px", color:"#D4A853", letterSpacing:"2px", marginBottom:"16px", fontWeight:"700"}}>
            SELECT AREA TO EXPLORE
          </div>
          <div style={{display:"grid", gridTemplateColumns:"300px 1fr", gap:"20px", alignItems:"start"}}>
            <div>
              <select
                value={exploreFrom}
                onChange={e=>setExploreFrom(e.target.value)}
                style={{
                  width:"100%", background:"#111115", border:"1px solid #2A2A35",
                  color:"#E8E2D9", padding:"10px 12px", borderRadius:"4px",
                  fontFamily:"inherit", fontSize:"12px", marginBottom:"16px", outline:"none"
                }}
              >
                {["Central","South","South-East","East","North","West"].map(r=>(
                  <optgroup key={r} label={`── ${r} ──`} style={{color:"#D4A853"}}>
                    {AREAS.filter(a=>a.region===r).map(a=>(
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {exploreArea && (
                <div style={{background:"#111115", border:"1px solid #2A2A35", borderRadius:"6px", padding:"16px"}}>
                  <div style={{
                    display:"inline-block", fontSize:"9px",
                    background:TIER_COLORS[exploreArea.tier]||"#666",
                    color:"#0C0C0E", padding:"2px 7px", borderRadius:"2px", fontWeight:"700", marginBottom:"8px"
                  }}>{exploreArea.tier.toUpperCase()}</div>
                  <div style={{fontSize:"15px", fontWeight:"700", marginBottom:"4px"}}>{exploreArea.name}</div>
                  <div style={{fontSize:"10px", color:"#666", marginBottom:"8px"}}>PIN {exploreArea.pincode} · {exploreArea.region} BLR</div>
                  <div style={{fontSize:"10px", color:"#999", lineHeight:"1.5"}}>{exploreArea.desc}</div>
                  <div style={{marginTop:"10px", fontSize:"10px", color:"#666"}}>
                    <span style={{color:"#555"}}>Lat:</span> {exploreArea.lat}° &nbsp;
                    <span style={{color:"#555"}}>Lng:</span> {exploreArea.lng}°
                  </div>
                </div>
              )}
            </div>

            {exploreArea && (
              <div style={{display:"flex", flexDirection:"column", gap:"20px"}}>
                {/* Nearby areas */}
                <div>
                  <div style={{fontSize:"9px", color:"#D4A853", letterSpacing:"2px", marginBottom:"10px", fontWeight:"700"}}>
                    NEAREST AREAS (straight-line)
                  </div>
                  <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"8px"}}>
                    {nearbyAreas.map(a=>(
                      <div key={a.id} style={{
                        background:"#111115", border:"1px solid #1E1E28", borderRadius:"4px",
                        padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center"
                      }}>
                        <div>
                          <div style={{fontSize:"11px", color:"#E8E2D9"}}>{a.name}</div>
                          <div style={{fontSize:"9px", color:"#555"}}>{a.pincode} · {a.tier}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:"13px", fontWeight:"700", color:"#7EB8A4"}}>{a.dist} km</div>
                          <div style={{fontSize:"9px", color:"#555"}}>~{(a.dist*1.35/30*60).toFixed(0)}min</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metro */}
                <div>
                  <div style={{fontSize:"9px", color:"#D4A853", letterSpacing:"2px", marginBottom:"10px", fontWeight:"700"}}>
                    NEAREST METRO STATIONS
                  </div>
                  <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"8px"}}>
                    {nearbyMetros.map(m=>(
                      <div key={m.id} style={{
                        background:"#111115", border:`1px solid ${LINE_COLORS[m.line]||"#1E1E28"}20`,
                        borderRadius:"4px", padding:"10px 14px", display:"flex", justifyContent:"space-between"
                      }}>
                        <div>
                          <div style={{
                            fontSize:"8px", color:LINE_COLORS[m.line]||"#999",
                            fontWeight:"700", letterSpacing:"0.5px", marginBottom:"3px"
                          }}>{m.line} LINE</div>
                          <div style={{fontSize:"11px"}}>{m.name}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:"13px", fontWeight:"700", color:"#7EB8A4"}}>{m.dist.toFixed(1)} km</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tech Parks */}
                <div>
                  <div style={{fontSize:"9px", color:"#D4A853", letterSpacing:"2px", marginBottom:"10px", fontWeight:"700"}}>
                    NEAREST TECH PARKS
                  </div>
                  <div style={{display:"flex", flexDirection:"column", gap:"6px"}}>
                    {nearbyParks.map(p=>(
                      <div key={p.id} style={{
                        background:"#111115", border:"1px solid #1E1E28", borderRadius:"4px",
                        padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center"
                      }}>
                        <div>
                          <div style={{fontSize:"11px", color:"#E8E2D9"}}>{p.name}</div>
                          <div style={{fontSize:"9px", color:"#555"}}>{p.area}</div>
                          <div style={{fontSize:"9px", color:"#444", marginTop:"2px"}}>{p.companies}</div>
                        </div>
                        <div style={{textAlign:"right", minWidth:"80px"}}>
                          <div style={{fontSize:"13px", fontWeight:"700", color:"#C17ED1"}}>{p.dist.toFixed(1)} km</div>
                          <div style={{fontSize:"9px", color:"#555"}}>≈ {(p.dist*1.35/30*60).toFixed(0)} min</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Landmarks */}
                <div>
                  <div style={{fontSize:"9px", color:"#D4A853", letterSpacing:"2px", marginBottom:"10px", fontWeight:"700"}}>
                    NEARBY LANDMARKS
                  </div>
                  <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"8px"}}>
                    {nearbyMarks.map(l=>(
                      <div key={l.id} style={{
                        background:"#111115", border:"1px solid #1E1E28", borderRadius:"4px",
                        padding:"10px 14px", display:"flex", justifyContent:"space-between"
                      }}>
                        <div>
                          <div style={{fontSize:"8px", color:"#555", marginBottom:"2px"}}>{l.type}</div>
                          <div style={{fontSize:"11px"}}>{l.name}</div>
                        </div>
                        <div style={{fontSize:"13px", fontWeight:"700", color:"#D4A853"}}>{l.dist.toFixed(1)}km</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB: DISTANCE CALCULATOR ══ */}
      {tab==="distances" && (
        <div style={{padding:"28px"}}>
          <div style={{fontSize:"9px", color:"#D4A853", letterSpacing:"2px", marginBottom:"20px", fontWeight:"700"}}>
            POINT-TO-POINT DISTANCE CALCULATOR
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 80px 1fr", gap:"16px", alignItems:"center", marginBottom:"28px"}}>
            <div>
              <div style={{fontSize:"8px", color:"#555", letterSpacing:"1px", marginBottom:"6px"}}>FROM</div>
              <select value={distFrom} onChange={e=>setDistFrom(e.target.value)} style={{
                width:"100%", background:"#111115", border:"1px solid #2A2A35",
                color:"#E8E2D9", padding:"10px 12px", borderRadius:"4px",
                fontFamily:"inherit", fontSize:"12px", outline:"none"
              }}>
                {AREAS.map(a=>(<option key={a.id} value={a.id}>{a.name} ({a.pincode})</option>))}
              </select>
            </div>
            <div style={{textAlign:"center", color:"#555", fontSize:"20px", marginTop:"16px"}}>⇒</div>
            <div>
              <div style={{fontSize:"8px", color:"#555", letterSpacing:"1px", marginBottom:"6px"}}>TO</div>
              <select value={distTo} onChange={e=>setDistTo(e.target.value)} style={{
                width:"100%", background:"#111115", border:"1px solid #2A2A35",
                color:"#E8E2D9", padding:"10px 12px", borderRadius:"4px",
                fontFamily:"inherit", fontSize:"12px", outline:"none"
              }}>
                {AREAS.map(a=>(<option key={a.id} value={a.id}>{a.name} ({a.pincode})</option>))}
              </select>
            </div>
          </div>

          {calcDist && fromArea && toArea && (
            <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px", marginBottom:"32px"}}>
              {[
                ["Straight-Line Distance", `${calcDist.straight} km`, "#7EB8A4", "As the crow flies (Haversine formula)"],
                ["Estimated Road Distance", `${calcDist.road} km`, "#D4A853", "×1.35 road correction factor"],
                ["Estimated Drive Time", `${(calcDist.road/30*60).toFixed(0)}–${(calcDist.road/20*60).toFixed(0)} min`, "#C17ED1", "Assuming 20-30 km/h avg speed (Bangalore traffic)"],
              ].map(([label, val, color, note])=>(
                <div key={label} style={{
                  background:"#111115", border:`1px solid ${color}30`,
                  borderRadius:"8px", padding:"20px"
                }}>
                  <div style={{fontSize:"9px", color:"#555", letterSpacing:"1px", marginBottom:"10px"}}>{label}</div>
                  <div style={{fontSize:"28px", fontWeight:"700", color}}>{val}</div>
                  <div style={{fontSize:"9px", color:"#444", marginTop:"6px"}}>{note}</div>
                </div>
              ))}
            </div>
          )}

          {fromArea && toArea && (
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px"}}>
              {[fromArea, toArea].map((area,i)=>(
                <div key={area.id} style={{background:"#111115", border:"1px solid #1E1E28", borderRadius:"6px", padding:"18px"}}>
                  <div style={{fontSize:"8px", color:"#555", letterSpacing:"1px", marginBottom:"8px"}}>{i===0?"FROM":"TO"}</div>
                  <div style={{
                    display:"inline-block", fontSize:"9px",
                    background:TIER_COLORS[area.tier]||"#666",
                    color:"#0C0C0E", padding:"2px 7px", borderRadius:"2px", fontWeight:"700", marginBottom:"6px"
                  }}>{area.tier.toUpperCase()}</div>
                  <div style={{fontSize:"15px", fontWeight:"700"}}>{area.name}</div>
                  <div style={{fontSize:"10px", color:"#666", marginTop:"3px"}}>PIN {area.pincode} · {area.region}</div>
                  <div style={{fontSize:"10px", color:"#888", marginTop:"6px", lineHeight:"1.5"}}>{area.desc}</div>
                  <div style={{marginTop:"12px"}}>
                    <div style={{fontSize:"8px", color:"#555", letterSpacing:"1px", marginBottom:"5px"}}>NEAREST METRO</div>
                    {nearestMetro(area.lat,area.lng,1).map(m=>(
                      <div key={m.id} style={{fontSize:"10px", color:"#999"}}>
                        <span style={{color:LINE_COLORS[m.line]||"#999",fontWeight:"700"}}>{m.line}</span>
                        {" "}{m.name} · {m.dist.toFixed(1)} km
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:"8px"}}>
                    <div style={{fontSize:"8px", color:"#555", letterSpacing:"1px", marginBottom:"5px"}}>NEAREST TECH PARK</div>
                    {nearestTechParks(area.lat,area.lng,1).map(p=>(
                      <div key={p.id} style={{fontSize:"10px", color:"#999"}}>
                        {p.name} · {p.dist.toFixed(1)} km
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bulk distance table – selected area to all */}
          <div style={{marginTop:"32px"}}>
            <div style={{fontSize:"9px", color:"#D4A853", letterSpacing:"2px", marginBottom:"12px", fontWeight:"700"}}>
              ALL AREAS FROM: {fromArea?.name} (Sorted by distance)
            </div>
            <div style={{
              display:"grid",
              gridTemplateColumns:"repeat(4,1fr)",
              gap:"6px", maxHeight:"420px", overflowY:"auto"
            }}>
              {fromArea && areaDistances(distFrom).map(a=>(
                <div key={a.id} style={{
                  background:"#111115", border:"1px solid #1A1A22", borderRadius:"3px",
                  padding:"8px 10px", display:"flex", justifyContent:"space-between", alignItems:"center"
                }}>
                  <div>
                    <div style={{fontSize:"10px", color:"#CCC"}}>{a.name}</div>
                    <div style={{fontSize:"8px", color:"#444"}}>{a.pincode}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:"11px", fontWeight:"700", color:
                      a.dist<3?"#7EB8A4":a.dist<7?"#D4A853":a.dist<15?"#888":"#555"
                    }}>{a.dist}km</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #0C0C0E; }
        ::-webkit-scrollbar-thumb { background: #2A2A35; border-radius: 2px; }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        select option { background: #0C0C0E; }
        select optgroup { background: #0C0C0E; color: #D4A853; }
      `}</style>
    </div>
  );
}

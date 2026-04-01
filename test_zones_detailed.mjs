const SUBZONE_MAPPING = {
  'koramangala': { zone: 'KORA', subzone: 'Koramangala All Blocks' },
  'sg palya': { zone: 'KORA', subzone: 'SG Palya / Silk Board / Nexus' },
  'silk board': { zone: 'KORA', subzone: 'SG Palya / Silk Board / Nexus' },
  'nexus': { zone: 'KORA', subzone: 'SG Palya / Silk Board / Nexus' },
  'hsr': { zone: 'KORA', subzone: 'HSR Layout (All Sectors)' },
  'bommanahalli': { zone: 'KORA', subzone: 'HSR Layout (All Sectors)' },
  'btm': { zone: 'KORA', subzone: 'BTM Layout (All Stages)' },
  'jayanagar': { zone: 'KORA', subzone: 'Jayanagar / JP Nagar' },
  'jp nagar': { zone: 'KORA', subzone: 'Jayanagar / JP Nagar' },
  'j p nagar': { zone: 'KORA', subzone: 'Jayanagar / JP Nagar' },
  'indiranagar': { zone: 'KORA', subzone: 'Indiranagar / Domlur' },
  'domlur': { zone: 'KORA', subzone: 'Indiranagar / Domlur' },
  'mg road': { zone: 'KORA', subzone: 'Richmond Town / MG Road' },
  'richmond': { zone: 'KORA', subzone: 'Richmond Town / MG Road' },
  'ejipura': { zone: 'KORA', subzone: 'Ejipura / Viveknagar' },
  'bannerghatta': { zone: 'KORA', subzone: 'Bannerghatta Road / Arekere' },
  'electronic city': { zone: 'KORA', subzone: 'Electronic City Phase 1 & 2' },
  'e city': { zone: 'KORA', subzone: 'Electronic City Phase 1 & 2' },
  'ecity': { zone: 'KORA', subzone: 'Electronic City Phase 1 & 2' },
  'e-city': { zone: 'KORA', subzone: 'Electronic City Phase 1 & 2' },
  'indranagar': { zone: 'KORA', subzone: 'Indiranagar / Domlur' },
  'indira nagar': { zone: 'KORA', subzone: 'Indiranagar / Domlur' },
  'bellandur': { zone: 'MWB', subzone: 'Bellandur / Ecoworld / Kadubeesanahalli' },
  'marathahalli': { zone: 'MWB', subzone: 'Marathahalli / Spice Garden' },
  'whitefield': { zone: 'MWB', subzone: 'Whitefield / ITPL / Hope Farm' },
  'mahadevapura': { zone: 'MWB', subzone: 'Mahadevapura / Bagmane / CV Raman Nagar' },
  'brookfield': { zone: 'MWB', subzone: 'Brookfield / AECS / Kundalahalli' },
  'sarjapur': { zone: 'MWB', subzone: 'Sarjapur Road / Haralur' },
  'manyata': { zone: 'MTP', subzone: 'Manyata Tech Park' },
  'nagawara': { zone: 'MTP', subzone: 'Nagawara / Hebbal' },
  'hebbal': { zone: 'MTP', subzone: 'Nagawara / Hebbal' },
  'thanisandra': { zone: 'MTP', subzone: 'Thanisandra / Hennur' },
  'hennur': { zone: 'MTP', subzone: 'Thanisandra / Hennur' },
  'hbr': { zone: 'MTP', subzone: 'HBR Layout / Banaswadi' },
  'banaswadi': { zone: 'MTP', subzone: 'HBR Layout / Banaswadi' },
  'yeshwanthpur': { zone: 'YPR', subzone: 'Yeshwanthpur / Malleshwaram' },
  'malleshwaram': { zone: 'YPR', subzone: 'Yeshwanthpur / Malleshwaram' },
};

function getZoneByAreaWithKey(area) {
  if (!area) return { zone: 'KORA', key: 'default' };
  const normalizedArea = area.toLowerCase().trim();
  const sortedKeys = Object.keys(SUBZONE_MAPPING).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (normalizedArea.includes(key.toLowerCase())) {
      return { ...SUBZONE_MAPPING[key], key };
    }
  }
  return { zone: 'KORA', key: 'default' };
}

console.log('Testing HSR Layout:', getZoneByAreaWithKey('HSR Layout'));
console.log('Testing JP Nagar:', getZoneByAreaWithKey('JP Nagar'));
console.log('Testing Jayanagar:', getZoneByAreaWithKey('Jayanagar'));
console.log('Testing Koramangala:', getZoneByAreaWithKey('Koramangala'));
console.log('Testing Bannerghatta:', getZoneByAreaWithKey('Bannerghatta'));
console.log('Testing Brookefield:', getZoneByAreaWithKey('Brookefield'));

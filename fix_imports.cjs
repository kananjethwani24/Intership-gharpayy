const fs = require('fs');

function fixImports() {
  const matchPath = 'c:/Users/kanan/Desktop/GharPayy Internship/Gharpayy_Dashboard_Copy/app/matching/page.tsx';
  let matchCode = fs.readFileSync(matchPath, 'utf8');

  // Fix Duplicate 'Users'
  matchCode = matchCode.replace('ChevronUp, Users, List, Grid', 'ChevronUp, List, Grid');

  // Ensure "use client" is only present once at top
  if (matchCode.startsWith('"use client";\\n"use client";')) {
    matchCode = matchCode.replace('"use client";\\n"use client";', '"use client";');
  } else if (matchCode.startsWith('"use client";\\r\\n"use client";')) {
    matchCode = matchCode.replace('"use client";\\r\\n"use client";', '"use client";');
  }

  // Ensure Missing Imports are present (destroyed previously)
  if (!matchCode.includes('import { ROOM_MASTER')) {
    matchCode = matchCode.replace(
      "import { parseRoomEntries } from '@/lib/parseRoomEntries';",
      "import { ROOM_MASTER, getRoomsForPG, type Room } from '@/data/roomMasterData';\\nimport { haversine, resolveLocationToCoords } from '@/lib/areaCoordinates';\\nimport { parseRoomEntries } from '@/lib/parseRoomEntries';"
    );
  }

  fs.writeFileSync(matchPath, matchCode);
  console.log('Fixed imports correctly.');
}

fixImports();

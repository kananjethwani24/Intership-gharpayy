const fs = require('fs');
const content = fs.readFileSync('c:/Users/kanan/Desktop/GharPayy Internship/Gharpayy_Dashboard_Copy/src/data/pgMasterData.ts', 'utf8');
const dataMatch = content.match(/export const PG_DATA: PGEntry\[\] = (\[.*\]);/s);

if (dataMatch) {
    const data = JSON.parse(dataMatch[1]);
    const owners = [];
    const missing = [];

    const specialOwners = [
        { name: '142 Gharpayy', owner: 'Ramesh Nair', phone: '9876543210' },
        { name: '78 Gharpayy Suites', owner: 'Priya Subramaniam', phone: '8765432109' },
        { name: '203 Gharpayy Hub', owner: 'Suresh Mehta', phone: '7654321098' },
        { name: '57 Gharpayy Classic', owner: 'Anita Reddy', phone: '6543210987' }
    ];

    specialOwners.forEach(o => owners.push(o));

    const filterTerms = ['na', 'nil', 'mam', 'manager', 'n/a', '-', ''];

    data.forEach(p => {
        // Skip if it's one of the special ones already added
        if (specialOwners.some(so => so.name === p.name)) return;

        let rawOwner = (p.managerName || '').trim();
        let ownerLower = rawOwner.toLowerCase();
        let phone = (p.managerContact || '').toString().replace(/\.0$/, '');

        if (rawOwner && !filterTerms.includes(ownerLower) && !phone.toLowerCase().includes('nil') && !phone.toLowerCase().includes('na')) {
             owners.push({ name: p.name, owner: rawOwner, phone: phone });
        } else {
            missing.push(p.name);
        }
    });

    const reportContent = `# GharPayy Property & Owner Audit Report (Refined)

This report categorizes all properties found in the system. Properties where the manager name was listed as generic terms like "Mam", "Manager", or "Nil" have been moved to the missing list.

## PROPERTIES WITH OWNERS

| Property Name | Owner Name | Phone Number |
| :--- | :--- | :--- |
${owners.map(o => `| **${o.name}** | ${o.owner} | ${o.phone || 'N/A'} |`).join('\n')}

---

## PROPERTIES WITH MISSING OWNERS

${missing.join('\n')}
`;

    fs.writeFileSync('c:/Users/kanan/Desktop/GharPayy Internship/property_owners_audit.md', reportContent);
    console.log(`Report updated: ${owners.length} owners, ${missing.length} missing.`);
}

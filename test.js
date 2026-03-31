const text = `💛 Dual Sharing: - ~Originally 18k~, **now just 15k!**
💗 Private rooms: ~Formerly 28k~, **now specially priced at 25k!**

⚕️ Act Fast: Lock in your reservation NOW and save 2000! RS every month on a 3-month stay! *Offer expires in few hours. *Prebook* now for just 5k!* enjoy complimentary good food.`;

const regex = /(single|dual|double|triple|private|quad)/gi;
const matches = [];
let match;
while ((match = regex.exec(text)) !== null) {
    matches.push({ type: match[1].toLowerCase(), index: match.index });
}

for (let i = 0; i < matches.length; i++) {
   const current = matches[i];
   const nextIndex = i + 1 < matches.length ? matches[i+1].index : text.length;
   const chunk = text.substring(current.index, nextIndex).toLowerCase();
   console.log('Chunk:', chunk);
   
   const nowMatch = chunk.match(/now.*?(\d+(?:[.,]\d+)?)\s*(k|l|lakh|cr)?/i);
   console.log('nowMatch:', nowMatch ? nowMatch[0] : null);
}

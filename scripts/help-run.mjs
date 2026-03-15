const lines = [
  'Daphstar Run Order',
  '',
  '1) Start backend API (Terminal A):',
  '   npm run dev:web',
  '',
  '2) Start mobile Expo app (Terminal B):',
  '   cd mobile',
  '   npx expo start -c',
  '',
  '3) If phone cannot connect over LAN:',
  '   cd mobile',
  '   npx expo start --tunnel -c',
  '',
  'Tips:',
  '- Keep only one Next.js dev server running.',
  '- If Next lock error appears, use: npm run start:all',
  '- For repeatable QA steps, see: mobile/QA-CHECKLIST.md',
];

console.log(lines.join('\n'));

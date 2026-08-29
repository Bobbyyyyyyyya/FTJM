const fs = require('fs');
let content = fs.readFileSync('src/components/dm/ModernMessagesView.tsx', 'utf8');

// Container
content = content.replace(
  /className=\{`messages-view-container bg-app-card rounded-\[\w+\] border border-app-border shadow-2xl overflow-hidden h-\[calc\(100vh-14rem\)\] flex transition-all duration-500 \$\{useCustomTheme && customTheme\.glass_effect \? 'custom-glass-chat' : ''\}`\}/g,
  `className={\`messages-view-container rounded-[2.5rem] overflow-hidden h-[calc(100vh-12rem)] flex gap-4 transition-all duration-500 bg-transparent\`}`
);

// Sidebar wrapper
content = content.replace(
  /<div className=\{`\$\{mobileChatView === 'chat' \? 'hidden sm:flex' : 'flex'\} w-full sm:w-96 border-r border-app-border flex-col bg-app-bg\/30 backdrop-blur-sm`\}/g,
  `<div className={\`\${mobileChatView === 'chat' ? 'hidden sm:flex' : 'flex'} w-full sm:w-[380px] flex-col rounded-[2.5rem] border border-cyan-500/20 bg-app-card/40 backdrop-blur-xl shadow-[0_0_40px_rgba(6,182,212,0.1)] overflow-hidden transition-all duration-500\`}`
);

// Sidebar header
content = content.replace(
  /<div className="p-8 border-b border-app-border flex items-center justify-between">/g,
  `<div className="p-6 sm:p-8 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent flex items-center justify-between">`
);

// Sidebar items
content = content.replace(
  /className=\{`w-full p-6 flex items-center gap-4 transition-all text-left relative group cursor-pointer select-none \$\{\n\s*isActive \n\s*\? 'bg-app-ink text-app-bg' \n\s*: 'hover:bg-app-accent\/50 text-app-muted hover:text-app-ink'\n\s*\}`\}/g,
  `className={\`w-full p-4 sm:p-5 m-2 sm:m-3 w-[calc(100%-16px)] sm:w-[calc(100%-24px)] rounded-2xl flex items-center gap-4 transition-all text-left relative group cursor-pointer select-none \${isActive ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-app-ink shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'bg-transparent border border-transparent hover:bg-white/5 hover:border-white/10 text-app-muted hover:text-app-ink'}\`}`
);

// Chat Area Container
content = content.replace(
  /<div className=\{`\$\{mobileChatView === 'list' \? 'hidden sm:flex' : 'flex'\} flex-1 flex-col min-w-0 bg-app-card relative`\}/g,
  `<div className={\`\${mobileChatView === 'list' ? 'hidden sm:flex' : 'flex'} flex-1 flex-col min-w-0 bg-app-card/40 backdrop-blur-xl border border-cyan-500/20 rounded-[2.5rem] shadow-[0_0_40px_rgba(6,182,212,0.1)] relative overflow-hidden\`}`
);

// Chat Header
content = content.replace(
  /<div className="h-20 sm:h-24 px-4 sm:px-8 border-b border-app-border flex items-center justify-between bg-app-bg\/50 backdrop-blur-md sticky top-0 z-10">/g,
  `<div className="h-20 sm:h-24 px-4 sm:px-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-black/20 to-transparent backdrop-blur-2xl sticky top-0 z-10 shadow-sm">`
);

// Chat Input Area Container
content = content.replace(
  /<div className="p-4 sm:p-6 border-t border-app-border bg-app-bg\/50 backdrop-blur-md">/g,
  `<div className="p-4 sm:p-6 bg-gradient-to-t from-black/40 to-transparent backdrop-blur-md border-t border-white/5">`
);

// Chat Input Form Wrapper
content = content.replace(
  /<div className="flex items-end gap-2 sm:gap-4 max-w-4xl mx-auto">/g,
  `<div className="flex items-end gap-2 sm:gap-4 max-w-4xl mx-auto bg-app-bg/60 p-2 sm:p-3 rounded-[2rem] border border-cyan-500/20 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-xl focus-within:border-cyan-500/50 focus-within:shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all duration-300">`
);

// Input field
content = content.replace(
  /className="w-full bg-app-bg border border-app-border text-app-ink placeholder:text-app-muted text-sm sm:text-base px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl focus:outline-none focus:border-app-ink focus:ring-1 focus:ring-app-ink transition-all resize-none custom-scrollbar"/g,
  `className="w-full bg-transparent border-none text-app-ink placeholder:text-app-muted/50 text-sm sm:text-base px-4 py-3 focus:outline-none focus:ring-0 transition-all resize-none custom-scrollbar"`
);

fs.writeFileSync('src/components/dm/ModernMessagesView.tsx', content);
console.log('Modifications applied.');

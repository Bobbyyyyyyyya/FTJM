import sys

with open('src/components/dm/ModernMessagesView.tsx', 'r') as f:
    content = f.read()

# Container
content = content.replace(
    "className={`messages-view-container bg-app-card rounded-[2.5rem] border border-app-border shadow-2xl overflow-hidden h-[calc(100vh-14rem)] flex transition-all duration-500 ${useCustomTheme && customTheme.glass_effect ? 'custom-glass-chat' : ''}`}",
    "className={`messages-view-container rounded-[2.5rem] overflow-hidden h-[calc(100vh-12rem)] flex gap-4 sm:gap-6 transition-all duration-500 bg-transparent`}"
)

# Sidebar
content = content.replace(
    "className={`${mobileChatView === 'chat' ? 'hidden sm:flex' : 'flex'} w-full sm:w-96 border-r border-app-border flex-col bg-app-bg/30 backdrop-blur-sm`}",
    "className={`${mobileChatView === 'chat' ? 'hidden sm:flex' : 'flex'} w-full sm:w-[380px] flex-col rounded-[2.5rem] border border-cyan-500/20 bg-app-card/40 backdrop-blur-xl shadow-[0_0_40px_rgba(6,182,212,0.1)] overflow-hidden transition-all duration-500`}"
)

content = content.replace(
    '<div className="p-8 border-b border-app-border flex items-center justify-between">',
    '<div className="p-6 sm:p-8 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent flex items-center justify-between">'
)

content = content.replace(
    "className={`w-full p-6 flex items-center gap-4 transition-all text-left relative group cursor-pointer select-none ${\n                      isActive \n                        ? 'bg-app-ink text-app-bg' \n                        : 'hover:bg-app-accent/50 text-app-muted hover:text-app-ink'\n                    }`}",
    "className={`w-full p-4 sm:p-5 m-2 sm:m-3 w-[calc(100%-16px)] sm:w-[calc(100%-24px)] rounded-2xl flex items-center gap-4 transition-all text-left relative group cursor-pointer select-none ${isActive ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-app-ink shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'bg-transparent border border-transparent hover:bg-white/5 hover:border-white/10 text-app-muted hover:text-app-ink'}`}"
)

# Chat area container
content = content.replace(
    "className={`${mobileChatView === 'list' ? 'hidden sm:flex' : 'flex'} flex-1 flex-col min-w-0 bg-app-card relative`}",
    "className={`${mobileChatView === 'list' ? 'hidden sm:flex' : 'flex'} flex-1 flex-col min-w-0 bg-app-card/40 backdrop-blur-xl border border-cyan-500/20 rounded-[2.5rem] shadow-[0_0_40px_rgba(6,182,212,0.1)] relative overflow-hidden`}"
)

# Chat header
content = content.replace(
    '<div className="h-20 sm:h-24 px-4 sm:px-8 border-b border-app-border flex items-center justify-between bg-app-bg/50 backdrop-blur-md sticky top-0 z-10">',
    '<div className="h-20 sm:h-24 px-4 sm:px-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-black/20 to-transparent backdrop-blur-2xl sticky top-0 z-10 shadow-sm">'
)

# Chat input container
content = content.replace(
    '<div className="p-4 sm:p-6 border-t border-app-border bg-app-bg/50 backdrop-blur-md">',
    '<div className="p-4 sm:p-6 bg-gradient-to-t from-black/40 to-transparent backdrop-blur-md border-t border-white/5 pb-6 sm:pb-8">'
)

# Input wrapper
content = content.replace(
    '<div className="flex items-end gap-2 sm:gap-4 max-w-4xl mx-auto">',
    '<div className="flex items-end gap-2 sm:gap-4 max-w-4xl mx-auto bg-app-bg/60 p-2 sm:p-3 rounded-[2rem] border border-cyan-500/20 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-xl focus-within:border-cyan-500/50 focus-within:shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all duration-300">'
)

# Textarea
content = content.replace(
    'className="w-full bg-app-bg border border-app-border text-app-ink placeholder:text-app-muted text-sm sm:text-base px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl focus:outline-none focus:border-app-ink focus:ring-1 focus:ring-app-ink transition-all resize-none custom-scrollbar"',
    'className="w-full bg-transparent border-none text-app-ink placeholder:text-app-muted/50 text-sm sm:text-base px-4 py-3 focus:outline-none focus:ring-0 transition-all resize-none custom-scrollbar"'
)

# Send buttons and attachments
content = content.replace(
    'className="p-3 sm:p-4 bg-app-accent hover:bg-app-border text-app-ink rounded-xl sm:rounded-2xl transition-all"',
    'className="p-3 sm:p-4 bg-white/5 hover:bg-white/10 text-cyan-400 rounded-full transition-all"'
)

content = content.replace(
    'className="p-3 sm:p-4 bg-app-ink text-app-bg rounded-xl sm:rounded-2xl hover:opacity-90 transition-all flex items-center justify-center min-w-[3rem] sm:min-w-[3.5rem] disabled:opacity-50"',
    'className="p-3 sm:p-4 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center min-w-[3rem] sm:min-w-[3.5rem] disabled:opacity-50"'
)

# Message bubbles (received vs sent)
# For sent:
content = content.replace(
    "className={`p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] text-sm sm:text-base relative group shadow-sm ${",
    "className={`p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] text-sm sm:text-base relative group shadow-lg ${"
)
content = content.replace(
    "isMe ? 'bg-app-ink text-app-bg rounded-br-sm' : 'bg-app-card border border-app-border text-app-ink rounded-bl-sm'",
    "isMe ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-br-sm border border-cyan-400/30 shadow-[0_5px_15px_rgba(6,182,212,0.2)]' : 'bg-app-card/60 backdrop-blur-md border border-white/10 text-app-ink rounded-bl-sm shadow-[0_5px_15px_rgba(0,0,0,0.2)]'"
)

with open('src/components/dm/ModernMessagesView.tsx', 'w') as f:
    f.write(content)
print("done")

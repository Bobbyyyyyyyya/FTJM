import sys

with open('src/components/dm/ModernMessagesView.tsx', 'r') as f:
    content = f.read()

old_bubble = """                            <div className={`
                                px-6 py-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm transition-all duration-300 relative font-medium
                                ${isMe 
                                  ? 'bg-app-ink text-app-bg rounded-br-none hover:shadow-xl' 
                                  : 'bg-app-card text-app-ink border border-app-border rounded-bl-none hover:border-app-border'}
                              `}>"""

new_bubble = """                            <div className={`
                                px-6 py-4 rounded-[1.5rem] text-sm leading-relaxed transition-all duration-300 relative font-medium
                                ${isMe 
                                  ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-br-none hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] shadow-[0_5px_15px_rgba(6,182,212,0.15)] border border-cyan-400/20' 
                                  : 'bg-app-card/60 backdrop-blur-xl border border-white/10 text-app-ink rounded-bl-none shadow-[0_5px_15px_rgba(0,0,0,0.2)] hover:border-white/20'}
                              `}>"""

content = content.replace(old_bubble, new_bubble)

with open('src/components/dm/ModernMessagesView.tsx', 'w') as f:
    f.write(content)
print("done bubbles")

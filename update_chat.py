import sys

with open('src/components/dm/ModernMessagesView.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "className={`${mobileChatView === 'chat' ? 'flex' : 'hidden sm:flex'} flex-grow flex-col relative bg-app-bg/10`}",
    "className={`${mobileChatView === 'chat' ? 'flex' : 'hidden sm:flex'} flex-grow flex-col min-w-0 bg-app-card/40 backdrop-blur-xl border border-cyan-500/20 rounded-[2.5rem] shadow-[0_0_40px_rgba(6,182,212,0.1)] relative overflow-hidden transition-all duration-500`}"
)

# And fix the style logic inside it:
old_style_chat = "style={useCustomTheme ? { backgroundColor: customTheme.body_bg_color ? `${customTheme.body_bg_color}30` : undefined } : {}}"
new_style_chat = """style={useCustomTheme ? { 
          backgroundColor: customTheme.glass_effect ? undefined : (customTheme.card_bg_color ? `${customTheme.card_bg_color}${Math.round((100 - (customTheme.chat_opacity ?? 0)) * 2.55).toString(16).padStart(2, '0')}` : undefined),
          borderColor: customTheme.chat_opacity === 100 ? 'transparent' : undefined,
        } : {}}"""

content = content.replace(old_style_chat, new_style_chat)

with open('src/components/dm/ModernMessagesView.tsx', 'w') as f:
    f.write(content)
print("done chat box")

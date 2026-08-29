import sys

with open('src/components/dm/ModernMessagesView.tsx', 'r') as f:
    content = f.read()

old_style = """      style={useCustomTheme ? { 
        backgroundColor: customTheme.glass_effect ? undefined : (customTheme.card_bg_color ? `${customTheme.card_bg_color}${Math.round((100 - (customTheme.chat_opacity ?? 0)) * 2.55).toString(16).padStart(2, '0')}` : undefined),
        borderColor: customTheme.chat_opacity === 100 ? 'transparent' : undefined,
        boxShadow: customTheme.chat_opacity === 100 ? 'none' : undefined,
        color: customTheme.text_color
      } : {}}"""

new_style = """      style={useCustomTheme ? { color: customTheme.text_color } : {}}"""

content = content.replace(old_style, new_style)

with open('src/components/dm/ModernMessagesView.tsx', 'w') as f:
    f.write(content)
print("done")

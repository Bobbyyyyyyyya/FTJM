import sys

with open('src/components/dm/ModernMessagesView.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '<header className="p-6 border-b border-app-border flex items-center justify-between bg-app-card/90 backdrop-blur-xl sticky top-0 z-20">',
    '<header className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-black/20 to-transparent backdrop-blur-2xl sticky top-0 z-20 shadow-sm">'
)

content = content.replace(
    '<div className="p-4 sm:p-6 border-t border-app-border bg-app-card relative z-20">',
    '<div className="p-4 sm:p-6 bg-gradient-to-t from-black/40 to-transparent backdrop-blur-2xl border-t border-white/5 relative z-20">'
)

with open('src/components/dm/ModernMessagesView.tsx', 'w') as f:
    f.write(content)
print("done headers")

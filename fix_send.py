import sys

with open('src/components/dm/ModernMessagesView.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'className="px-2.5 sm:px-6 h-full bg-app-ink text-app-bg rounded-lg sm:rounded-2xl hover:opacity-90 disabled:opacity-30 transition-all shadow-lg active:scale-95 flex items-center justify-center min-w-[36px] sm:min-w-[80px]"',
    'className="px-2.5 sm:px-6 h-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl sm:rounded-2xl hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-30 transition-all shadow-lg active:scale-95 flex items-center justify-center min-w-[36px] sm:min-w-[80px] border border-cyan-400/30"'
)

with open('src/components/dm/ModernMessagesView.tsx', 'w') as f:
    f.write(content)
print("done")

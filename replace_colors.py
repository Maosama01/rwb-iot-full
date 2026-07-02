import os
import glob

replacements = {
    'bg-[#F5F0E8]': 'bg-rawbin-bg',
    'bg-[#FDFAF5]': 'bg-rawbin-card',
    'bg-[#2D5016]': 'bg-rawbin-primary',
    'text-[#2D5016]': 'text-rawbin-text',
    'text-[#4A7C2F]': 'text-rawbin-subtext',
    'text-[#F5F0E8]': 'text-white',
    'border-[#2D5016]': 'border-rawbin-primary',
    'border-[#4A7C2F]': 'border-rawbin-subtext',
    'border-[#C0392B]': 'border-rawbin-error',
    'text-[#C0392B]': 'text-rawbin-error',
    'bg-[#E8F0E0]': 'bg-rawbin-accent',
    'bg-[#4A7C2F]': 'bg-rawbin-primary',
    'text-[#a69d92]': 'text-rawbin-subtext',
    'color="#2D5016"': 'color="#251605"',
    'color="#4A7C2F"': 'color="#744107"',
    'color="#F5F0E8"': 'color="#fff9e7"',
    'activeColor="#4A7C2F"': 'activeColor="#45B900"',
    'color="#a69d92"': 'color="#e5a971"',
}

files = glob.glob('mobile/src/**/*.tsx', recursive=True) + ['mobile/App.tsx']
for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(file, 'w') as f:
        f.write(content)
print("Replacement complete")

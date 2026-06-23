import glob
import re

files = glob.glob('src/pages/*.tsx')
count = 0

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We want to replace `<table ...>...</table>` with `<div className="overflow-x-auto w-full"><table ...>...</table></div>`
    # We need to ensure we don't wrap tables that are already wrapped in `overflow-x-auto`
    
    # First, let's find all `overflow-x-auto` already in the file so we don't double wrap
    if 'overflow-x-auto' in content:
        # It's safer to just look at the raw matches
        pass
        
    def replacer(match):
        table_str = match.group(1)
        # Avoid double wrapping if we know it's already wrapped (though simple regex might miss contextual wraps)
        return f'<div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">\n{table_str}\n</div>'
        
    # Find tables that are NOT already wrapped by a div with overflow-x-auto.
    # A simpler way is to just wrap all of them, but wait, the React code might have `{...}` inside the JSX.
    # Actually, a regex that matches `<table` to `</table>` might be too greedy if there are multiple tables.
    # We can use non-greedy `.*?`
    
    new_content = re.sub(r'(<table\b[^>]*>.*?</table>)', replacer, content, flags=re.DOTALL)
    
    # We also need to fix `<div className="... flex ..."` containers to be `flex-col md:flex-row` if they are `flex items-center gap-4`
    # Many headers have `flex items-center justify-between` which is fine, but they squish on mobile.
    new_content = re.sub(r'className="([^"]*\bflex\b[^"]*justify-between[^"]*)"', lambda m: f'className="{m.group(1)} flex-wrap gap-4"', new_content)
    
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        count += 1

print(f"Wrapped tables in {count} files")

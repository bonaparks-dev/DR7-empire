
def check_balance(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()

    stack = []
    
    # Map of closing -> opening
    pairs = {')': '(', '}': '{', ']': '['}
    
    for i, line in enumerate(lines):
        # Scan char by char, ignoring comments/strings is hard but let's do simple scan first
        # Simple scan excluding string literals might be needed
        
        in_string = False
        string_char = None
        
        for j, char in enumerate(line):
            
            # Simple string handling (doesn't handle escaped quotes perfectly but usually enough)
            if char in ["'", '"', '`']:
                if not in_string:
                    in_string = True
                    string_char = char
                elif char == string_char:
                    in_string = False
                continue
            
            if in_string:
                continue
            
            # Ignore comments
            if char == '/' and j+1 < len(line) and line[j+1] == '/':
                break # Rest of line is comment
                
            if char in '({[':
                stack.append((char, i + 1, j + 1))
            elif char in ')}]':
                if not stack:
                    print(f"Error: Unexpected {char} at line {i+1} col {j+1}")
                    return
                    
                last_open, last_line, last_col = stack.pop()
                expected_open = pairs[char]
                
                if last_open != expected_open:
                    print(f"Error: Mismatched {char} at line {i+1} col {j+1}. Expected closing fo {last_open} from line {last_line}")
                    return

    if stack:
        print("Stack of unclosed braces:")
        for char, line, col in stack:
            print(f"  {char} at line {line} col {col}")
            # Identify specific function/block context if possible
            if line > 0:
                print(f"     -> {lines[line-1].strip()[:50]}...")
    else:
        print("Success: Braces seems balanced (simple check)")

check_balance('components/ui/CarBookingWizard.tsx')

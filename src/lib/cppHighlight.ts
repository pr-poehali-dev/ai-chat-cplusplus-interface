export function highlightCpp(code: string): string {
  const keywords = [
    'auto','break','case','catch','class','const','constexpr','continue',
    'default','delete','do','else','enum','explicit','extern','false','for',
    'friend','goto','if','inline','mutable','namespace','new','noexcept',
    'nullptr','operator','override','private','protected','public','pure',
    'return','sizeof','static','static_assert','struct','switch','template',
    'this','throw','true','try','typedef','typename','union','using',
    'virtual','volatile','while','final','and','or','not'
  ];
  const types = [
    'bool','char','char8_t','char16_t','char32_t','double','float','int',
    'long','short','signed','unsigned','void','wchar_t','size_t','ptrdiff_t',
    'int8_t','int16_t','int32_t','int64_t','uint8_t','uint16_t','uint32_t',
    'uint64_t','string','vector','map','set','unordered_map','unordered_set',
    'pair','tuple','array','deque','list','queue','stack','priority_queue',
    'shared_ptr','unique_ptr','weak_ptr','optional','variant','any',
    'ifstream','ofstream','fstream','ostream','istream','iostream',
    'stringstream','ostringstream','istringstream'
  ];

  const lines = code.split('\n');
  return lines.map(line => processLine(line, keywords, types)).join('\n');
}

function processLine(line: string, keywords: string[], types: string[]): string {
  // Preprocessor macros
  const trimmed = line.trimStart();
  if (trimmed.startsWith('#')) {
    const macroMatch = trimmed.match(/^(#\w+)(.*)/s);
    if (macroMatch) {
      const indent = line.slice(0, line.length - trimmed.length);
      const rest = macroMatch[2];
      const restEscaped = escapeHtml(rest);
      return `${escapeHtml(indent)}<span class="code-macro">${escapeHtml(macroMatch[1])}${restEscaped}</span>`;
    }
  }

  // Full line comment
  const commentIdx = findCommentStart(trimmed);
  let mainPart = line;
  let commentPart = '';
  if (commentIdx !== -1) {
    const fullIdx = line.indexOf('//', line.length - trimmed.length + commentIdx);
    if (fullIdx !== -1) {
      mainPart = line.slice(0, fullIdx);
      commentPart = line.slice(fullIdx);
    }
  }

  const result = tokenizeLine(mainPart, keywords, types);
  const commentHtml = commentPart
    ? `<span class="code-comment">${escapeHtml(commentPart)}</span>`
    : '';
  return result + commentHtml;
}

function findCommentStart(line: string): number {
  let inString = false;
  let inChar = false;
  for (let i = 0; i < line.length - 1; i++) {
    const c = line[i];
    if (c === '"' && !inChar) inString = !inString;
    if (c === "'" && !inString) inChar = !inChar;
    if (!inString && !inChar && c === '/' && line[i + 1] === '/') return i;
  }
  return -1;
}

function tokenizeLine(line: string, keywords: string[], types: string[]): string {
  let result = '';
  let i = 0;
  while (i < line.length) {
    // String literal
    if (line[i] === '"') {
      let j = i + 1;
      while (j < line.length && !(line[j] === '"' && line[j-1] !== '\\')) j++;
      j++;
      result += `<span class="code-string">${escapeHtml(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    // Char literal
    if (line[i] === "'") {
      let j = i + 1;
      while (j < line.length && !(line[j] === "'" && line[j-1] !== '\\')) j++;
      j++;
      result += `<span class="code-string">${escapeHtml(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    // Numbers
    if (/[0-9]/.test(line[i]) || (line[i] === '.' && /[0-9]/.test(line[i+1] || ''))) {
      let j = i;
      while (j < line.length && /[0-9a-fA-FxXbBoOuUlLfF.]/.test(line[j])) j++;
      result += `<span class="code-number">${escapeHtml(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    // Words (identifiers, keywords, types)
    if (/[a-zA-Z_]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);
      // Check if followed by '(' → function
      const afterWord = line.slice(j).trimStart();
      if (keywords.includes(word)) {
        result += `<span class="code-keyword">${escapeHtml(word)}</span>`;
      } else if (types.includes(word)) {
        result += `<span class="code-type">${escapeHtml(word)}</span>`;
      } else if (afterWord.startsWith('(')) {
        result += `<span class="code-func">${escapeHtml(word)}</span>`;
      } else if (/^[A-Z][A-Z0-9_]*$/.test(word)) {
        // ALL_CAPS → macro constant
        result += `<span class="code-macro">${escapeHtml(word)}</span>`;
      } else if (/^[A-Z]/.test(word)) {
        // PascalCase → type/class
        result += `<span class="code-type">${escapeHtml(word)}</span>`;
      } else {
        result += escapeHtml(word);
      }
      i = j;
      continue;
    }
    // Operators
    if (/[+\-*/%=<>!&|^~]/.test(line[i])) {
      result += `<span class="code-operator">${escapeHtml(line[i])}</span>`;
      i++;
      continue;
    }
    result += escapeHtml(line[i]);
    i++;
  }
  return result;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

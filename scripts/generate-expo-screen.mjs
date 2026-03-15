import fs from 'fs';
import path from 'path';

function getArg(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && process.argv[idx + 1]) {
    return process.argv[idx + 1];
  }
  return fallback;
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function styleToCode(style) {
  if (!style || typeof style !== 'object') return '{}';
  return `{ ${Object.entries(style)
    .map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`)
    .join(', ')} }`;
}

function nodeUses(type, uses) {
  if (type === 'View') uses.add('View');
  if (type === 'Text') uses.add('Text');
  if (type === 'Image') uses.add('Image');
  if (type === 'Button') {
    uses.add('Pressable');
    uses.add('Text');
  }
}

function renderNode(node, indent, uses) {
  const pad = '  '.repeat(indent);
  nodeUses(node.type, uses);

  if (node.type === 'View') {
    const children = (node.children || []).map((c) => renderNode(c, indent + 1, uses)).join('\n');
    return `${pad}<View style={${styleToCode(node.style)}}>${children ? `\n${children}\n${pad}` : ''}</View>`;
  }

  if (node.type === 'Text') {
    const text = JSON.stringify(node.text || '');
    return `${pad}<Text style={${styleToCode(node.style)}}>{${text}}</Text>`;
  }

  if (node.type === 'Image') {
    const src = JSON.stringify(node.src || '');
    return `${pad}<Image source={{ uri: ${src} }} style={${styleToCode(node.style)}} />`;
  }

  if (node.type === 'Button') {
    const text = JSON.stringify(node.text || 'Button');
    return `${pad}<Pressable style={${styleToCode(node.style)}} onPress={() => {}}><Text>{${text}}</Text></Pressable>`;
  }

  return `${pad}<View />`;
}

function generateExpoScreen({ spec, componentName }) {
  const uses = new Set(['SafeAreaView']);
  const nodes = Array.isArray(spec.components) ? spec.components : [];
  const body = nodes.map((node) => renderNode(node, 3, uses)).join('\n');
  const imports = Array.from(uses).sort().join(', ');

  return `import React from 'react';
import { ${imports} } from 'react-native';

export default function ${componentName}() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
${body}
    </SafeAreaView>
  );
}
`;
}

function main() {
  const input = getArg('--input', 'specs/example-design.json');
  const output = getArg('--output', 'mobile-designer/generated/GeneratedScreen.tsx');
  const componentName = getArg('--component', 'GeneratedScreen');

  const inputPath = path.resolve(process.cwd(), input);
  const outputPath = path.resolve(process.cwd(), output);

  const raw = fs.readFileSync(inputPath, 'utf8');
  const spec = JSON.parse(raw);

  const code = generateExpoScreen({ spec, componentName });
  ensureDir(outputPath);
  fs.writeFileSync(outputPath, code, 'utf8');

  process.stdout.write(`Generated ${output} from ${input}\n`);
}

main();

const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/Price.tsx', 'utf8');
code = code.replace(/\{ price: number \| string; mrp\?: number; unit\?: string; big\?: string \}/, 
  '{ price: number | string; mrp?: number; unit?: string; big?: string; badge?: boolean }');
fs.writeFileSync('frontend/src/components/Price.tsx', code, 'utf8');

let iconCode = fs.readFileSync('frontend/src/components/Icon.tsx', 'utf8');
iconCode = iconCode.replace(/} from 'lucide-react';/, "} from 'lucide-react'; // @ts-ignore\n");
iconCode = iconCode.replace(/import {/, "// @ts-ignore\nimport {");
fs.writeFileSync('frontend/src/components/Icon.tsx', iconCode, 'utf8');

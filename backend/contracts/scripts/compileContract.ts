import * as fs from 'fs';
import * as path from 'path';
import { Cell } from '@ton/core';
import { compileFunc } from '@ton-community/func-js';

export async function compileEscrowContract(): Promise<Cell> {
  const contractPath = path.join(__dirname, '../escrow.fc');
  const stdlibPath = path.join(__dirname, '../imports/stdlib.fc');

  const contractSource = fs.readFileSync(contractPath, 'utf-8');
  const stdlibSource = fs.readFileSync(stdlibPath, 'utf-8');

  const result = await compileFunc({
    targets: ['escrow.fc'],
    sources: {
      'escrow.fc': contractSource,
      'imports/stdlib.fc': stdlibSource,
    },
  });

  if (result.status === 'error') {
    throw new Error(`Compilation failed: ${result.message}`);
  }

  const codeCell = Cell.fromBoc(Buffer.from(result.codeBoc, 'base64'))[0];

  const outputPath = path.join(__dirname, '../build/escrow.compiled.json');
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        hex: result.codeBoc,
        base64: result.codeBoc,
      },
      null,
      2,
    ),
  );

  console.log('Contract compiled successfully!');
  console.log('Output:', outputPath);

  return codeCell;
}

if (require.main === module) {
  compileEscrowContract()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

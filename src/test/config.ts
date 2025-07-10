export interface TestEnabled {
  common: boolean;
  database: boolean;
  integration: boolean;
  model: boolean;
  schema: boolean;
  table: boolean;
  modifiers_common: boolean;
  modifiers_encryption: boolean;
  modifiers_hash: boolean;
  modifiers_localization: boolean;
}

export const testEnabled: TestEnabled = {
  common: true,
  database: false,
  integration: false,
  model: false,
  schema: false,
  table: false,
  modifiers_common: false,
  modifiers_encryption: false,
  modifiers_hash: false,
  modifiers_localization: false,
};

export function skipTests(test_label: string): void {
  console.log(`Skipping test: ${test_label}`);
}

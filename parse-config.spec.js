import { test, expect } from 'vitest';
import { getConfig } from './parse-config';


test('getConfig', () => {
  const config = getConfig();
  // config.master not null
  expect(config.master).toBeTruthy();
  expect(config.slave).toBeTruthy();
});

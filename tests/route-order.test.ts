import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function readRoute(file: string) {
  return fs.readFileSync(path.join(__dirname, '..', 'routes', file), 'utf8');
}

describe('route ordering (no shadowing)', () => {
  it('messages: /lawyer/calls is registered before /:senderId/:receiverId', () => {
    const src = readRoute('message.routes.ts');
    const callsIdx = src.indexOf('"/lawyer/calls"');
    const paramIdx = src.indexOf('"/:senderId/:receiverId"');
    expect(callsIdx).toBeGreaterThanOrEqual(0);
    expect(paramIdx).toBeGreaterThanOrEqual(0);
    expect(callsIdx).toBeLessThan(paramIdx);
  });

  it('uploads require authentication', () => {
    const src = readRoute('upload.routes.ts');
    expect(src).toMatch(/authenticate/);
    expect(src).toMatch(/authorize\('LAWYER', 'ADMIN'\)/);
  });

  it('lawyer-registration admin routes are protected', () => {
    const src = readRoute('lawyer-registration.routes.ts');
    expect(src).toMatch(/authorize\('ADMIN'\)/);
  });

  it('dashboard requires owner-or-admin', () => {
    const src = readRoute('dashboard.routes.ts');
    expect(src).toMatch(/authenticate/);
    expect(src).toMatch(/403/);
  });
});

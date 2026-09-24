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

  it('certificate routes are gone', () => {
    expect(fs.existsSync(path.join(__dirname, '..', 'routes', 'certificate.routes.ts'))).toBe(false);
    const index = fs.readFileSync(path.join(__dirname, '..', 'index.ts'), 'utf8');
    expect(index).not.toMatch(/certificateRouter/);
    expect(index).toMatch(/enquiryRouter/);
    expect(index).toMatch(/invitationRouter/);
  });

  it('enquiry submit is public but rate-limited; admin queue is protected', () => {
    const src = readRoute('enquiry.routes.ts');
    expect(src).toMatch(/rateLimit\(3/);
    expect(src).toMatch(/authorize\('ADMIN'\)/);
  });

  it('invitation validate is public; create/revoke/reissue are admin-only', () => {
    const src = readRoute('invitation.routes.ts');
    const validateIdx = src.indexOf("'/validate/:token'");
    expect(validateIdx).toBeGreaterThanOrEqual(0);
    // validate route registered without authenticate (check the line itself)
    const validateLine = src.slice(0, validateIdx).split('\n').pop() || '';
    expect(validateLine).not.toMatch(/authenticate/);
    expect(src).toMatch(/authorize\('ADMIN'\)/);
  });

  it('registration requires an invitation token', () => {
    const ctrl = fs.readFileSync(
      path.join(__dirname, '..', 'controllers', 'lawyer-registration.controller.ts'), 'utf8'
    );
    expect(ctrl).toMatch(/invitationToken/);
    expect(ctrl).toMatch(/InvitationService/);
    expect(ctrl).not.toMatch(/from '\.\.\/services\/certificate\.service'/);
  });
});

import { LicenseDuration, LicenseStatus } from '../types';

export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = (len: number) =>
    Array.from({ length: len }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `FF-${part(4)}-${part(4)}-${part(4)}`;
}

export function calculateLicenseExpiration(duration: LicenseDuration, startDate: Date = new Date()): string | null {
  if (duration === 'unlimited') return null;

  const result = new Date(startDate);
  switch (duration) {
    case '1_month':
      result.setDate(result.getDate() + 30);
      break;
    case '3_months':
      result.setDate(result.getDate() + 90);
      break;
    case '6_months':
      result.setDate(result.getDate() + 180);
      break;
    case '1_year':
      result.setDate(result.getDate() + 365);
      break;
  }
  return result.toISOString();
}

export function getDurationLabel(duration: LicenseDuration): string {
  switch (duration) {
    case '1_month':
      return '1 Mes';
    case '3_months':
      return '3 Meses';
    case '6_months':
      return '6 Meses';
    case '1_year':
      return '1 Año';
    case 'unlimited':
      return 'Indefinida / Vitalicia';
    default:
      return duration;
  }
}

export function getStatusBadgeLabel(status: LicenseStatus): { label: string; bgClass: string; textClass: string } {
  switch (status) {
    case 'active':
      return {
        label: 'Activa',
        bgClass: 'bg-[#00E5FF]/10 border border-[#00E5FF]/40',
        textClass: 'text-[#00E5FF]',
      };
    case 'paused':
      return {
        label: 'Pausada',
        bgClass: 'bg-[#FFFFFF]/10 border border-[#FFFFFF]/40',
        textClass: 'text-[#FFFFFF]',
      };
    case 'revoked':
      return {
        label: 'Revocada',
        bgClass: 'bg-rose-950/60 border border-rose-600/40',
        textClass: 'text-rose-400',
      };
    case 'expired':
      return {
        label: 'Expirada',
        bgClass: 'bg-[#94A3B8]/10 border border-[#94A3B8]/30',
        textClass: 'text-[#94A3B8]',
      };
    case 'unused':
    default:
      return {
        label: 'Disponible',
        bgClass: 'bg-[#00E5FF]/5 border border-[#00E5FF]/20',
        textClass: 'text-[#00E5FF]',
      };
  }
}

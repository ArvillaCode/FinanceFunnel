import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PlanTier } from '../../types';
import { CreditCard, Check, Sparkles, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';

export const BillingView: React.FC = () => {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<PlanTier>('pro');
  const [selectedPlanModal, setSelectedPlanModal] = useState<PlanTier | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleUpgradePlan = (plan: PlanTier) => {
    setCurrentPlan(plan);
    setSelectedPlanModal(null);
    setSuccessMsg(`¡Suscripción actualizada exitosamente al plan ${plan.toUpperCase()}!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const PLANS = [
    {
      id: 'starter' as PlanTier,
      name: 'Starter (Gratis)',
      price: '$0',
      period: 'para siempre',
      description: 'Ideal para usuarios individuales y finanzas personales básicas',
      features: [
        '1 Espacio de Trabajo',
        'Hasta 3 Miembros de Equipo',
        '200 Transacciones al Mes',
        'Asesor IA en Modo Básico',
        'Soporte por Correo',
      ],
      highlight: false,
    },
    {
      id: 'pro' as PlanTier,
      name: 'Pro SaaS',
      price: '$19',
      period: 'por mes',
      description: 'Para profesionales y pequeñas empresas que requieren control total',
      features: [
        'Espacios de Trabajo Ilimitados',
        'Hasta 10 Miembros de Equipo',
        'Transacciones Ilimitadas',
        'Asesor Financiero IA Gemini Pro',
        'Sincronización Móvil <100ms',
        'Exportación CSV, PDF y JSON',
      ],
      highlight: true,
    },
    {
      id: 'enterprise' as PlanTier,
      name: 'Enterprise Upfunnel',
      price: '$49',
      period: 'por mes',
      description: 'Para corporativos y firmas financieras con equipos extendidos',
      features: [
        'Todo lo incluido en Pro',
        'Miembros de Equipo Ilimitados',
        'Roles y Permisos RBAC Personalizados',
        'API & Webhooks en Tiempo Real',
        'Soporte Dedicado Prioritario 24/7',
        'Auditoría Imborrable de Sistema',
      ],
      highlight: false,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/40 text-xs font-extrabold uppercase tracking-wider uf-glow-sm">
            PLANES DE SUSCRIPCIÓN SAAS
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-[#FFFFFF] mt-1 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#00E5FF]" />
          <span>Planes y Monetización de la Plataforma</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Elige el plan que mejor se adapte a tu volumen de transacciones y tamaño de equipo
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/40 text-xs font-bold text-[#00E5FF] flex items-center gap-2 uf-glow-sm">
          <Sparkles className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`p-6 rounded-2xl bg-[#080C14] border transition-all flex flex-col justify-between space-y-6 ${
                plan.highlight
                  ? 'border-[#00E5FF] uf-glow shadow-2xl relative'
                  : 'border-[#94A3B8]/20 hover:border-[#00E5FF]/40'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#00E5FF] text-[#080C14] text-[10px] font-black uppercase tracking-wider shadow-md">
                  RECOMENDADO
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-[#FFFFFF]">{plan.name}</h3>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40">
                      ACTIVO
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[#00E5FF]">{plan.price}</span>
                  <span className="text-xs text-[#94A3B8] font-mono">{plan.period}</span>
                </div>

                <p className="text-xs text-[#94A3B8] leading-relaxed">{plan.description}</p>

                <div className="border-t border-[#94A3B8]/15 pt-4 space-y-2.5">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-[#FFFFFF]">
                      <Check className="w-4 h-4 text-[#00E5FF] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setSelectedPlanModal(plan.id)}
                disabled={isCurrent}
                className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                  isCurrent
                    ? 'bg-[#94A3B8]/10 text-[#94A3B8] border border-[#94A3B8]/20 cursor-default'
                    : plan.highlight
                    ? 'bg-[#00E5FF] text-[#080C14] hover:bg-[#00E5FF]/90 uf-glow-sm'
                    : 'bg-[#080C14] border border-[#00E5FF]/40 text-[#00E5FF] hover:bg-[#00E5FF]/10'
                }`}
              >
                <span>{isCurrent ? 'Plan Actual' : 'Seleccionar Plan'}</span>
                {!isCurrent && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal: Upgrade Confirmation */}
      <Modal
        isOpen={Boolean(selectedPlanModal)}
        onClose={() => setSelectedPlanModal(null)}
        title="Confirmar Cambio de Plan"
        maxWidth="sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/40 flex items-center justify-center mx-auto uf-glow-sm">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-[#FFFFFF]">
              Actualizar a Plan {selectedPlanModal?.toUpperCase()}
            </h4>
            <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
              Tendrás acceso instantáneo a todas las características avanzadas de tu nuevo plan.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#94A3B8]/20">
            <button
              onClick={() => setSelectedPlanModal(null)}
              className="px-4 py-2 rounded-xl border border-[#94A3B8]/30 text-[#94A3B8] text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={() => selectedPlanModal && handleUpgradePlan(selectedPlanModal)}
              className="px-5 py-2 rounded-xl bg-[#00E5FF] text-[#080C14] text-xs font-black uppercase uf-glow-sm"
            >
              Confirmar Upgrade
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

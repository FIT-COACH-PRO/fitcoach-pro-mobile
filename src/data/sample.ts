/**
 * Dados de exemplo para as telas do mockup enquanto o backend não está pronto.
 * Batem com o mockup (Ana Paula, Bruno Lima, R$ 220, etc.). Quando as queries
 * ao Supabase existirem, cada tela troca `sample*` pela chamada real em endpoints.ts.
 *
 * ⚠️  Placeholder — não são dados reais de produção.
 */

export type StudentStatus = 'active' | 'paused' | 'inactive';

export type SampleStudent = {
  id: string;
  name: string;
  focus: string; // "Hipertrofia • 3x/sem"
  status: StudentStatus;
  // Detalhe
  weightKg?: number;
  heightM?: number;
  bmi?: number;
  age?: number;
  email?: string;
  phone?: string;
  objective?: string;
  restrictions?: string;
};

export const sampleStudents: SampleStudent[] = [
  {
    id: 's1',
    name: 'Ana Paula',
    focus: 'Hipertrofia • 3x/sem',
    status: 'active',
    weightKg: 68,
    heightM: 1.68,
    bmi: 24.1,
    age: 32,
    email: 'ana.paula@email.com',
    phone: '(11) 98888-1234',
    objective: 'Ganhar massa magra com foco em membros inferiores.',
    restrictions: 'Restrição leve no joelho direito. Evitar impacto alto.',
  },
  {
    id: 's2',
    name: 'Bruno Lima',
    focus: 'Emagrecimento • iniciante',
    status: 'paused',
    weightKg: 88,
    heightM: 1.79,
    bmi: 27.5,
    age: 41,
    email: 'bruno.lima@email.com',
    phone: '(11) 97777-2020',
    objective: 'Reduzir percentual de gordura e melhorar condicionamento.',
  },
  {
    id: 's3',
    name: 'Carla Souza',
    focus: 'Força • avançado',
    status: 'inactive',
    weightKg: 61,
    heightM: 1.65,
    bmi: 22.4,
    age: 29,
    email: 'carla.souza@email.com',
    phone: '(11) 96666-3030',
    objective: 'Aumentar carga nos básicos (agachamento, terra, supino).',
  },
  {
    id: 's4',
    name: 'Diego Nunes',
    focus: 'Condicionamento',
    status: 'active',
    weightKg: 75,
    heightM: 1.74,
    bmi: 24.8,
    age: 36,
    email: 'diego.nunes@email.com',
    phone: '(11) 95555-4040',
    objective: 'Melhorar capacidade cardiovascular e mobilidade.',
  },
];

export type SampleExercise = {
  name: string;
  detail: string; // "Descer até 90°"
  sets: string; // "4 x 8"
  load: string; // "80 kg" ou "—"
};

export type SampleWorkoutDay = {
  label: string; // "Treino A"
  exercises: SampleExercise[];
};

export type SampleWorkout = {
  id: string;
  name: string;
  level: string; // "Intermediário • força"
  icon: string; // ícone MaterialCommunity
  description?: string;
  days?: SampleWorkoutDay[];
};

export const sampleWorkouts: SampleWorkout[] = [
  {
    id: 'w1',
    name: 'Hipertrofia Full Body',
    level: 'Intermediário • força',
    icon: 'weight-lifter',
    description:
      'Treino para ganho de massa com foco em técnica, progressão de carga e execução controlada.',
    days: [
      {
        label: 'Treino A',
        exercises: [
          { name: 'Agachamento livre', detail: 'Descer até 90°', sets: '4 x 8', load: '80 kg' },
          { name: 'Supino reto', detail: 'Cadência 2-1-2', sets: '4 x 10', load: '60 kg' },
          { name: 'Remada curvada', detail: 'Controle escapular', sets: '3 x 12', load: '45 kg' },
          { name: 'Levantamento terra', detail: 'Priorizar técnica', sets: '3 x 6', load: '90 kg' },
          { name: 'Prancha', detail: 'Respiração constante', sets: '3 x 45s', load: '—' },
        ],
      },
      {
        label: 'Treino B',
        exercises: [
          { name: 'Leg press', detail: 'Amplitude total', sets: '4 x 12', load: '160 kg' },
          { name: 'Desenvolvimento', detail: 'Ombro neutro', sets: '4 x 10', load: '30 kg' },
          { name: 'Puxada frontal', detail: 'Pegada aberta', sets: '3 x 12', load: '50 kg' },
        ],
      },
      {
        label: 'Treino C',
        exercises: [
          { name: 'Afundo', detail: 'Passada longa', sets: '3 x 10', load: '20 kg' },
          { name: 'Rosca direta', detail: 'Sem balanço', sets: '3 x 12', load: '14 kg' },
          { name: 'Tríceps corda', detail: 'Extensão completa', sets: '3 x 15', load: '25 kg' },
        ],
      },
    ],
  },
  {
    id: 'w2',
    name: 'Emagrecimento 45 min',
    level: 'Iniciante • circuito',
    icon: 'timer-outline',
    description: 'Circuito metabólico de 45 minutos com foco em gasto calórico.',
    days: [
      {
        label: 'Treino A',
        exercises: [
          { name: 'Burpee', detail: 'Ritmo constante', sets: '4 x 12', load: '—' },
          { name: 'Agachamento com salto', detail: 'Aterrissagem suave', sets: '4 x 15', load: '—' },
          { name: 'Mountain climber', detail: 'Core firme', sets: '4 x 30s', load: '—' },
        ],
      },
    ],
  },
  {
    id: 'w3',
    name: 'Força Avançada',
    level: 'Avançado • potência',
    icon: 'chart-line-variant',
    description: 'Foco em ganho de força máxima nos levantamentos principais.',
    days: [
      {
        label: 'Treino A',
        exercises: [
          { name: 'Agachamento', detail: '85% 1RM', sets: '5 x 5', load: '120 kg' },
          { name: 'Supino', detail: '85% 1RM', sets: '5 x 5', load: '90 kg' },
        ],
      },
    ],
  },
  {
    id: 'w4',
    name: 'Mobilidade & Core',
    level: 'Base • prevenção',
    icon: 'shield-outline',
    description: 'Rotina de mobilidade articular e fortalecimento de core.',
    days: [
      {
        label: 'Treino A',
        exercises: [
          { name: 'Gato-camelo', detail: 'Amplitude controlada', sets: '3 x 10', load: '—' },
          { name: 'Prancha lateral', detail: 'Quadril alinhado', sets: '3 x 30s', load: '—' },
        ],
      },
    ],
  },
];

export type SampleSessionStatus = 'next' | 'scheduled';

export type SampleSession = {
  id: string;
  time: string; // "08:00"
  studentName: string;
  durationMin: number;
  status: SampleSessionStatus;
};

export const sampleSessions: SampleSession[] = [
  { id: 'a1', time: '08:00', studentName: 'Ana Paula', durationMin: 60, status: 'next' },
  { id: 'a2', time: '10:30', studentName: 'Bruno Lima', durationMin: 45, status: 'scheduled' },
  { id: 'a3', time: '15:00', studentName: 'Carla Souza', durationMin: 50, status: 'scheduled' },
  { id: 'a4', time: '18:30', studentName: 'Diego Nunes', durationMin: 60, status: 'scheduled' },
];

export type SamplePaymentStatus = 'paid' | 'pending' | 'overdue';

export type SamplePayment = {
  id: string;
  studentName: string;
  amount: number;
  dueLabel: string; // "Venc. 15/07"
  status: SamplePaymentStatus;
};

export const samplePayments: SamplePayment[] = [
  { id: 'p1', studentName: 'Ana Paula', amount: 220, dueLabel: 'Venc. 15/07', status: 'paid' },
  { id: 'p2', studentName: 'Bruno Lima', amount: 180, dueLabel: 'Venc. 17/07', status: 'pending' },
  { id: 'p3', studentName: 'Carla Souza', amount: 250, dueLabel: 'Venc. 10/07', status: 'overdue' },
  { id: 'p4', studentName: 'Diego Nunes', amount: 210, dueLabel: 'Venc. 22/07', status: 'pending' },
];

export const sampleFinanceSummary = {
  receivedMonth: 8420,
  pending: 1180,
};

/** Resumo do dashboard (mesma forma do DashboardStats real). */
export const sampleDashboard = {
  active_students: 42,
  total_students: 58,
  inactive_students: 9,
  paused_students: 7,
  total_workouts: 18,
  monthly_revenue: 8400,
  pending_payments: 7,
  upcoming_renewals: 5,
};

/** Renovações de exemplo com datas ISO relativas (para formatDueDate funcionar). */
export function sampleRenewals(): {
  id: string;
  full_name: string;
  subscription_end: string;
  monthly_fee: number;
}[] {
  const iso = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().slice(0, 10);
  };
  return [
    { id: 's1', full_name: 'Ana Paula', subscription_end: iso(1), monthly_fee: 220 },
    { id: 's2', full_name: 'Bruno Lima', subscription_end: iso(3), monthly_fee: 180 },
  ];
}

/** Perfil do trainer logado (placeholder). */
export const sampleProfile = {
  name: 'Matheus Ribeiro',
  email: 'matheus@fitcoach.com',
  firstName: 'Matheus',
};

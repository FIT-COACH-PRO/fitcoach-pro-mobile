// Supabase Edge Function: student-insights
//
// Gera insights de IA sobre um aluno. A chave da Anthropic vive como secret da
// função (ANTHROPIC_API_KEY) — nunca vai para o app. O app chama via
// supabase.functions.invoke('student-insights', { body: { student_id } }), que
// encaminha o JWT do trainer; usamos esse JWT para consultar o Supabase
// respeitando a RLS (o trainer só enxerga os próprios alunos).
//
// Piloto — Fase 1: limite de 5 chamadas/dia por trainer, contado na tabela
// insights_usage (migration 20260731_insights_usage.sql — precisa estar
// aplicada antes do deploy desta versão). Rejeita explicitamente requisição
// sem JWT válido em vez de depender do RLS devolver vazio por efeito colateral.
//
// Deploy (com o Supabase CLI):
//   supabase functions deploy student-insights
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// SUPABASE_URL e SUPABASE_ANON_KEY já são injetados automaticamente no runtime.

import Anthropic from 'npm:@anthropic-ai/sdk@0.68.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAILY_LIMIT = 5;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type StudentRow = {
  full_name: string;
  status: string;
  objective: string | null;
  injuries: string | null;
  restrictions: string | null;
  observations: string | null;
  weight: number | null;
  height: number | null;
  monthly_fee: number | null;
  subscription_end: string | null;
};

function buildPrompt(s: StudentRow, workouts: number, sessions: number): string {
  const linhas = [
    `Nome: ${s.full_name}`,
    `Status: ${s.status}`,
    `Objetivo: ${s.objective ?? '—'}`,
    `Lesões: ${s.injuries ?? '—'}`,
    `Restrições: ${s.restrictions ?? '—'}`,
    `Observações: ${s.observations ?? '—'}`,
    `Peso: ${s.weight ?? '—'} | Altura: ${s.height ?? '—'}`,
    `Mensalidade: ${s.monthly_fee ?? '—'} | Vencimento da assinatura: ${s.subscription_end ?? '—'}`,
    `Treinos cadastrados: ${workouts} | Aulas agendadas: ${sessions}`,
  ];
  return (
    'Dados do aluno:\n' +
    linhas.join('\n') +
    '\n\nGere de 3 a 5 insights curtos (bullet points) para o personal trainer, ' +
    'cobrindo: evolução/adesão, risco de cancelamento e uma sugestão prática de ação. ' +
    'Seja específico e não invente dados ausentes.'
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const body = await req.json().catch(() => ({}));
    const studentId = (body as { student_id?: string }).student_id;
    if (!studentId) return json({ error: 'student_id é obrigatório.' }, 400);

    // Cliente com o JWT do trainer → respeita a RLS por trainer_id.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Rejeita explicitamente sem JWT válido, em vez de deixar as queries
    // seguintes falharem silenciosamente pela RLS.
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData.user) {
      return json({ error: 'Não autenticado.' }, 401);
    }
    const trainerId = authData.user.id;

    const today = new Date().toISOString().slice(0, 10);
    const { data: usageRow } = await supabase
      .from('insights_usage')
      .select('count')
      .eq('trainer_id', trainerId)
      .eq('usage_date', today)
      .maybeSingle();
    const usedToday = usageRow?.count ?? 0;
    if (usedToday >= DAILY_LIMIT) {
      return json({ error: `Limite diário de insights atingido (${DAILY_LIMIT}/dia). Tente novamente amanhã.` }, 429);
    }

    const { data: student, error } = await supabase
      .from('students')
      .select(
        'full_name, status, objective, injuries, restrictions, observations, weight, height, monthly_fee, subscription_end'
      )
      .eq('id', studentId)
      .single();

    if (error || !student) return json({ error: 'Aluno não encontrado.' }, 404);

    const [workoutsRes, sessionsRes] = await Promise.all([
      supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('student_id', studentId),
      supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('student_id', studentId),
    ]);

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY não configurada na função.' }, 500);

    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      // Default do skill; troque por "claude-haiku-4-5" para reduzir custo no piloto.
      // Para análise mais profunda: thinking: { type: 'adaptive' } (mais lento/caro).
      model: 'claude-opus-4-8',
      max_tokens: 1024, // saída curta de propósito
      system:
        'Você é um assistente de personal trainers no Brasil. Escreva em português do Brasil, ' +
        'de forma objetiva e prática. Baseie-se apenas nos dados fornecidos — não invente números.',
      messages: [{ role: 'user', content: buildPrompt(student as StudentRow, workoutsRes.count ?? 0, sessionsRes.count ?? 0) }],
    });

    const insights = message.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim();

    // Só incrementa após sucesso na chamada à Anthropic. Best-effort: uma
    // falha aqui não deve esconder do trainer os insights já gerados.
    try {
      await supabase
        .from('insights_usage')
        .upsert({ trainer_id: trainerId, usage_date: today, count: usedToday + 1 }, { onConflict: 'trainer_id,usage_date' });
    } catch {
      // ignorado de propósito — contagem é best-effort, não pode derrubar a resposta.
    }

    return json({ insights });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro interno.' }, 500);
  }
});

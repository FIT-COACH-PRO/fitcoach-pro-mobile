import { toWhatsAppNumber, waMeLink, buildWorkoutMessage, buildSessionMessage } from './whatsapp';

describe('toWhatsAppNumber', () => {
  it('adiciona o DDI em celular e fixo com DDD', () => {
    expect(toWhatsAppNumber('(11) 98888-1234')).toBe('5511988881234');
    expect(toWhatsAppNumber('1133334444')).toBe('551133334444');
  });

  it('mantém o número que já vem com DDI', () => {
    expect(toWhatsAppNumber('5511988881234')).toBe('5511988881234');
    expect(toWhatsAppNumber('+55 11 3333-4444')).toBe('551133334444');
  });

  it('rejeita vazio e número incompleto', () => {
    expect(toWhatsAppNumber('')).toBeNull();
    expect(toWhatsAppNumber(null)).toBeNull();
    expect(toWhatsAppNumber('98888')).toBeNull();
    expect(toWhatsAppNumber('9999999999999999')).toBeNull();
  });
});

describe('waMeLink', () => {
  it('monta o link com o texto codificado', () => {
    const link = waMeLink('(11) 98888-1234', 'Oi, Ana! Treino às 08:00');
    expect(link).toBe('https://wa.me/5511988881234?text=Oi%2C%20Ana!%20Treino%20%C3%A0s%2008%3A00');
  });

  it('devolve null quando o número é inválido', () => {
    expect(waMeLink('', 'oi')).toBeNull();
  });
});

describe('buildWorkoutMessage', () => {
  it('monta o texto com dia, horário e exercícios', () => {
    const text = buildWorkoutMessage({
      studentName: 'Ana Paula Silva',
      workoutName: 'Hipertrofia Full Body',
      dayLabel: 'Treino A',
      date: '20/09',
      time: '08:00',
      place: 'Studio Centro',
      trainerName: 'Matheus Ribeiro',
      exercises: [
        { name: 'Agachamento livre', sets: '4 x 8', load: '80 kg' },
        { name: 'Prancha', sets: '3 x 45s', load: '—' },
      ],
    });

    expect(text).toContain('Oi, Ana!');
    expect(text).toContain('Treino de hoje: Hipertrofia Full Body — Treino A');
    expect(text).toContain('Quando: 20/09 às 08:00');
    expect(text).toContain('Onde: Studio Centro');
    expect(text).toContain('• Agachamento livre — 4 x 8 — 80 kg');
    // Carga "—" não entra na linha do exercício.
    expect(text).toContain('• Prancha — 3 x 45s');
    expect(text).not.toContain('Prancha — 3 x 45s — —');
    expect(text.trimEnd().endsWith('— Matheus')).toBe(true);
  });

  it('funciona só com o mínimo (aluno + treino)', () => {
    const text = buildWorkoutMessage({ studentName: 'Bruno', workoutName: 'Circuito 45' });
    expect(text).toContain('Oi, Bruno!');
    expect(text).toContain('Treino de hoje: Circuito 45');
    expect(text).not.toContain('Quando:');
    expect(text).not.toContain('Onde:');
  });
});

describe('buildSessionMessage', () => {
  it('descreve aula presencial com local e duração', () => {
    const text = buildSessionMessage({
      studentName: 'Carla Souza',
      date: '21/09',
      time: '10:30',
      durationMin: 45,
      modalidade: 'presencial',
      place: 'Parque',
    });
    expect(text).toContain('Confirmando nossa aula em 21/09 às 10:30 (45 min).');
    expect(text).toContain('Local: Parque');
  });

  it('em aula online não cita local', () => {
    const text = buildSessionMessage({
      studentName: 'Carla',
      date: '21/09',
      time: '10:30',
      modalidade: 'online',
      place: 'Parque',
    });
    expect(text).toContain('Confirmando nossa aula online em 21/09 às 10:30.');
    expect(text).not.toContain('Local:');
  });
});

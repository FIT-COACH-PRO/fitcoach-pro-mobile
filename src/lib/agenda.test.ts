import { overlaps, findSessionConflict, describeConflict, modalidadeOf } from './agenda';
import type { ScheduledSession } from './agenda';

const iso = (h: number, m = 0) => new Date(2026, 8, 20, h, m).toISOString();

const session = (id: string, from: number, to: number, modalidade?: 'presencial' | 'online'): ScheduledSession => ({
  id,
  starts_at: iso(from),
  ends_at: iso(to),
  modalidade,
  student: { full_name: 'Ana Paula' },
});

describe('overlaps', () => {
  it('trata o fim como aberto (08–09 e 09–10 não colidem)', () => {
    expect(overlaps(8, 9, 9, 10)).toBe(false);
    expect(overlaps(8, 10, 9, 11)).toBe(true);
    expect(overlaps(9, 10, 8, 11)).toBe(true); // contida
  });
});

describe('modalidadeOf', () => {
  it('trata aula antiga (sem modalidade) como presencial', () => {
    expect(modalidadeOf({})).toBe('presencial');
    expect(modalidadeOf({ modalidade: null })).toBe('presencial');
    expect(modalidadeOf({ modalidade: 'online' })).toBe('online');
  });
});

describe('findSessionConflict', () => {
  const existing = [session('a', 8, 9), session('b', 15, 16, 'online')];

  it('acusa conflito entre duas presenciais', () => {
    const found = findSessionConflict(
      { starts_at: iso(8, 30), ends_at: iso(9, 30), modalidade: 'presencial' },
      existing
    );
    expect(found?.id).toBe('a');
  });

  it('aula online nunca conflita, nem com presencial', () => {
    const found = findSessionConflict(
      { starts_at: iso(8, 30), ends_at: iso(9, 30), modalidade: 'online' },
      existing
    );
    expect(found).toBeNull();
  });

  it('presencial não conflita com online já agendada', () => {
    const found = findSessionConflict(
      { starts_at: iso(15, 30), ends_at: iso(16, 30), modalidade: 'presencial' },
      existing
    );
    expect(found).toBeNull();
  });

  it('horário livre não gera conflito', () => {
    const found = findSessionConflict(
      { starts_at: iso(11), ends_at: iso(12), modalidade: 'presencial' },
      existing
    );
    expect(found).toBeNull();
  });

  it('ignora a própria aula ao reagendar', () => {
    const found = findSessionConflict(
      { starts_at: iso(8), ends_at: iso(9), modalidade: 'presencial' },
      existing,
      'a'
    );
    expect(found).toBeNull();
  });
});

describe('describeConflict', () => {
  it('descreve faixa de horário e aluno', () => {
    expect(describeConflict(session('a', 8, 9))).toBe('08:00–09:00 com Ana Paula');
  });
});

import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import type { Session } from '../types/database';

/** Pede permissão de calendário. Retorna true se concedida. */
export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

/** Descobre o calendário padrão gravável do dispositivo. */
async function getWritableCalendarId(): Promise<string | null> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.filter((c) => c.allowsModifications);

  if (Platform.OS === 'ios') {
    const def = await Calendar.getDefaultCalendarAsync().catch(() => null);
    if (def?.id) return def.id;
  }
  // Android: prefere o calendário primário do Google.
  const primary = writable.find((c) => (c as { isPrimary?: boolean }).isPrimary);
  return (primary ?? writable[0])?.id ?? null;
}

/** Cria um evento a partir de uma Session. Retorna o eventId nativo ou null. */
export async function createCalendarEvent(
  session: Session,
  studentName: string
): Promise<string | null> {
  try {
    const calendarId = await getWritableCalendarId();
    if (!calendarId) {
      console.warn('[calendar] Nenhum calendário gravável encontrado');
      return null;
    }
    const eventId = await Calendar.createEventAsync(calendarId, {
      title: `Aula — ${studentName}`,
      startDate: new Date(session.starts_at),
      endDate: new Date(session.ends_at),
      notes: `Aula do FitCoach Pro\nAluno: ${studentName}`,
      alarms: [{ relativeOffset: -60 }], // lembrete 1h antes
    });
    return eventId;
  } catch (err) {
    console.error('[calendar] erro ao criar evento', err);
    return null;
  }
}

/** Remove um evento previamente criado. */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    await Calendar.deleteEventAsync(eventId);
    return true;
  } catch (err) {
    console.error('[calendar] erro ao remover evento', err);
    return false;
  }
}

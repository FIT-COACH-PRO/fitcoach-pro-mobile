import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  createCalendarEvent,
  deleteCalendarEvent,
  requestCalendarPermission,
} from '../lib/calendar';
import type { Session } from '../types/database';

export function useCalendar() {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    requestCalendarPermission().then(setHasPermission);
  }, []);

  const syncSession = async (session: Session, studentName: string) => {
    let granted = hasPermission;
    if (!granted) {
      granted = await requestCalendarPermission();
      setHasPermission(granted);
    }
    if (!granted) {
      Alert.alert('Permissão necessária', 'Ative o acesso à agenda nas configurações do aparelho.');
      return null;
    }
    return createCalendarEvent(session, studentName);
  };

  return { syncSession, deleteEvent: deleteCalendarEvent, hasPermission };
}

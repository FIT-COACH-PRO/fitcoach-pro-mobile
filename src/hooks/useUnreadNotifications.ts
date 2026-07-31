import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { countUnreadNotifications } from '../api/endpoints';

/** Refaz a contagem toda vez que a tela ganha foco (ex.: voltando de Notificações). */
export function useUnreadNotifications(): boolean {
  const [hasUnread, setHasUnread] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      countUnreadNotifications()
        .then((count) => alive && setHasUnread(count > 0))
        .catch(() => alive && setHasUnread(false));
      return () => {
        alive = false;
      };
    }, [])
  );

  return hasUnread;
}

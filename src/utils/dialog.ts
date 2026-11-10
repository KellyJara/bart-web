// Reemplazo web de Alert.alert de React Native: misma firma (título, mensaje, botones).
// El componente <DialogHost /> (en App) muestra los diálogos en orden.

export type DialogButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type Dialog = {
  id: number;
  title: string;
  message?: string;
  buttons: DialogButton[];
};

type Listener = (dialogs: Dialog[]) => void;

let dialogs: Dialog[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach(l => l(dialogs));

export const subscribeDialogs = (listener: Listener) => {
  listeners.add(listener);
  listener(dialogs);
  return () => {
    listeners.delete(listener);
  };
};

export const showAlert = (title: string, message?: string, buttons?: DialogButton[]) => {
  dialogs = [...dialogs, { id: nextId++, title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] }];
  emit();
};

export const closeDialog = (id: number) => {
  dialogs = dialogs.filter(d => d.id !== id);
  emit();
};

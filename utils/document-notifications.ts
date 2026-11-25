import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  daysUntilExpiry,
  expiryNotificationDate,
  fetchPilotDocuments,
  formatDocumentNotificationDate,
  reminderNotificationDate,
  type PilotDocument,
} from '@/utils/documents';

const ANDROID_CHANNEL_ID = 'document-reminders';
const NOTIFICATION_PREFIX = 'doc-';

export function configureDocumentNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function reminderIdentifier(documentId: string) {
  return `${NOTIFICATION_PREFIX}${documentId}-reminder`;
}

function expiryIdentifier(documentId: string) {
  return `${NOTIFICATION_PREFIX}${documentId}-expiry`;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Document reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1d4ed8',
  });
}

export async function requestDocumentNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return status === 'granted';
}

async function cancelDocumentNotificationIds(documentId: string) {
  await Notifications.cancelScheduledNotificationAsync(reminderIdentifier(documentId));
  await Notifications.cancelScheduledNotificationAsync(expiryIdentifier(documentId));
}

async function cancelAllDocumentNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const docIds = scheduled
    .map((item) => item.identifier)
    .filter((id) => id.startsWith(NOTIFICATION_PREFIX));
  await Promise.all(docIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

async function scheduleAt(
  identifier: string,
  title: string,
  body: string,
  triggerDate: Date,
  documentId: string
) {
  if (triggerDate.getTime() <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title,
      body,
      data: { documentId, type: 'document_expiry' },
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

/** Notify soon if the user is already inside the reminder window (e.g. doc added late). */
async function scheduleImmediateReminderIfNeeded(doc: PilotDocument) {
  if (!doc.expiry_date) return;

  const daysLeft = daysUntilExpiry(doc.expiry_date);
  const reminderDays = doc.reminder_days_before ?? 15;
  if (daysLeft === null || daysLeft < 0 || daysLeft > reminderDays) return;

  const trigger = new Date(Date.now() + 3000);
  const expiryLabel = formatDocumentNotificationDate(doc.expiry_date);

  await Notifications.scheduleNotificationAsync({
    identifier: reminderIdentifier(doc.id),
    content: {
      title: 'Document expiring soon',
      body:
        daysLeft === 0
          ? `${doc.document_name} expires today (${expiryLabel}).`
          : `${doc.document_name} expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (${expiryLabel}).`,
      data: { documentId: doc.id, type: 'document_expiry' },
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger,
    },
  });
}

async function scheduleDocumentNotifications(doc: PilotDocument) {
  if (!doc.expiry_date) {
    await cancelDocumentNotificationIds(doc.id);
    return;
  }

  const reminderDays = doc.reminder_days_before ?? 15;
  const expiryLabel = formatDocumentNotificationDate(doc.expiry_date);
  const daysLeft = daysUntilExpiry(doc.expiry_date);
  const now = Date.now();

  await cancelDocumentNotificationIds(doc.id);

  if (daysLeft !== null && daysLeft < 0) return;

  const reminderDate = reminderNotificationDate(doc.expiry_date, reminderDays);
  const expiryDate = expiryNotificationDate(doc.expiry_date);
  let scheduledFutureReminder = false;

  if (reminderDate && reminderDate.getTime() > now) {
    await scheduleAt(
      reminderIdentifier(doc.id),
      'Document expiry reminder',
      `${doc.document_name} expires in ${reminderDays} day${reminderDays === 1 ? '' : 's'} (${expiryLabel}). Review or renew it.`,
      reminderDate,
      doc.id
    );
    scheduledFutureReminder = true;
  }

  if (expiryDate && expiryDate.getTime() > now) {
    await scheduleAt(
      expiryIdentifier(doc.id),
      'Document expires today',
      `${doc.document_name} expires today (${expiryLabel}).`,
      expiryDate,
      doc.id
    );
  }

  if (!scheduledFutureReminder) {
    await scheduleImmediateReminderIfNeeded(doc);
  }
}

export async function syncDocumentExpiryNotifications(userId: string) {
  if (Platform.OS === 'web') return;

  const granted = await requestDocumentNotificationPermissions();
  if (!granted) return;

  const { data: documents, error } = await fetchPilotDocuments(userId);
  if (error || !documents) return;

  await cancelAllDocumentNotifications();
  await Promise.all(documents.map((doc) => scheduleDocumentNotifications(doc)));
}

export async function cancelDocumentExpiryNotifications(documentId: string) {
  if (Platform.OS === 'web') return;
  await cancelDocumentNotificationIds(documentId);
}

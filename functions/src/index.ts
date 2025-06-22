import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { google } from "googleapis";
import * as logger from "firebase-functions/logger";
import { defineString, defineSecret } from "firebase-functions/params";

// Initialize the Firebase Admin SDK. This is lightweight and OK to keep in the global scope.
admin.initializeApp();

// Define and load secrets and configurations.
const GOOGLE_CLIENT_ID = defineString("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = defineSecret("GOOGLE_CLIENT_SECRET");

/**
 * An HTTPS Callable function that exchanges an authorization code for tokens.
 */
export const exchangeToken = onCall(async (request) => {
  const db = admin.firestore();
  logger.info("exchangeToken function triggered for user:", request.auth?.uid);
  if (!request.auth) throw new HttpsError("unauthenticated", "The function must be called while authenticated.");

  const userId = request.auth.uid;
  const code = request.data.code as string;
  if (!code) throw new HttpsError("invalid-argument", "The function must be called with a 'code' argument.");

  try {
    const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID.value(), GOOGLE_CLIENT_SECRET.value(), "postmessage");
    const { tokens } = await oauth2Client.getToken(code);
    logger.info(`Received tokens for user ${userId}`);

    const tokenData: { [key: string]: any } = {
        accessToken: tokens.access_token,
        expiryDate: tokens.expiry_date,
        scope: tokens.scope,
    };
    if (tokens.refresh_token) tokenData.refreshToken = tokens.refresh_token;

    await db.collection("users").doc(userId).collection("private").doc("googleTokens").set(tokenData, { merge: true });
    return { status: "success", message: "Google Account linked successfully." };
  } catch (error) {
    logger.error(`Error exchanging token for user ${userId}:`, error);
    throw new HttpsError("internal", "Failed to link Google account.");
  }
});


/**
 * A Firestore-triggered function that syncs a task to Google Calendar.
 */
export const syncTaskToGoogleCalendar = onDocumentWritten("artifacts/{appId}/users/{userId}/tasks/{taskId}", async (event) => {
  const { userId, taskId } = event.params;

  if (!event.data?.after.exists) {
    const beforeData = event.data?.before.data();
    if (beforeData?.googleEventId) {
      logger.log(`Task ${taskId} was deleted. Deleting corresponding calendar event.`);
      await deleteGoogleCalendarEvent(userId, beforeData.googleEventId);
    }
    return;
  }

  const taskData = event.data.after.data();
  const beforeData = event.data.before.data();

  if (!taskData) {
    logger.log(`Task data for ${taskId} is missing after an update. Exiting.`);
    return;
  }

  const syncWasDisabled = beforeData?.addToGoogleCalendar && !taskData.addToGoogleCalendar;
  if (syncWasDisabled) {
    if (taskData.googleEventId) {
      logger.log(`Sync disabled for task ${taskId}. Deleting corresponding calendar event.`);
      await deleteGoogleCalendarEvent(userId, taskData.googleEventId);
      await event.data.after.ref.update({ googleEventId: null });
    }
    return;
  }

  if (!taskData.addToGoogleCalendar || !taskData.scheduledStart || !taskData.scheduledEnd) {
    logger.log(`Task ${taskId} is not eligible for sync. Exiting.`);
    return;
  }

  const eventEndTime = taskData.isComplete ?
    new Date(taskData.scheduledStart.toDate().getTime() + (taskData.estimatedTime || 60) * 60000) :
    taskData.scheduledEnd.toDate();

  const eventPayload = {
    summary: taskData.name,
    description: taskData.description || "Managed by Smart Planner App",
    start: { dateTime: taskData.scheduledStart.toDate().toISOString() },
    end: { dateTime: eventEndTime.toISOString() },
  };

  try {
    const calendar = await getGoogleCalendarClient(userId);

    if (taskData.googleEventId) {
      const eventNeedsUpdate =
        beforeData?.name !== taskData.name ||
        beforeData?.description !== taskData.description ||
        beforeData?.scheduledStart.seconds !== taskData.scheduledStart.seconds ||
        (!taskData.isComplete && beforeData?.scheduledEnd.seconds !== taskData.scheduledEnd.seconds);

      if (eventNeedsUpdate) {
        await calendar.events.update({ calendarId: "primary", eventId: taskData.googleEventId, requestBody: eventPayload });
        logger.log(`Updated Google Calendar event for task ${taskId}`);
      }
    } else {
      const createdEvent = await calendar.events.insert({ calendarId: "primary", requestBody: eventPayload });
      if (createdEvent.data.id) {
        await event.data.after.ref.update({ googleEventId: createdEvent.data.id });
        logger.log(`Created Google Calendar event ${createdEvent.data.id} for task ${taskId}`);
      }
    }
  } catch (error) {
    logger.error(`Error syncing task ${taskId} to Google Calendar:`, error);
  }
});


/**
 * Helper function to get an authenticated Google Calendar API client.
 */
async function getGoogleCalendarClient(userId: string) {
  const db = admin.firestore();
  const tokenDoc = await db.collection("users").doc(userId).collection("private").doc("googleTokens").get();

  if (!tokenDoc.exists) throw new Error(`User ${userId} has not linked their Google account.`);
  const tokens = tokenDoc.data();
  if (!tokens?.refreshToken) throw new Error(`User ${userId} is missing a refresh token.`);

  const client = new google.auth.OAuth2(GOOGLE_CLIENT_ID.value(), GOOGLE_CLIENT_SECRET.value());
  client.setCredentials({ refresh_token: tokens.refreshToken });
  return google.calendar({ version: "v3", auth: client });
}


/**
 * Helper function to delete a Google Calendar event.
 */
async function deleteGoogleCalendarEvent(userId: string, eventId: string) {
  try {
    const calendar = await getGoogleCalendarClient(userId);
    await calendar.events.delete({ calendarId: "primary", eventId: eventId });
    logger.log(`Successfully deleted event ${eventId}.`);
  } catch (error) {
    logger.error(`Failed to delete event ${eventId}. It may have already been removed.`, error);
  }
}

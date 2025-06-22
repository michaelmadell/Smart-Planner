"use strict";
// functions/src/index.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncTaskToGoogleCalendar = exports.exchangeToken = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const googleapis_1 = require("googleapis");
const logger = __importStar(require("firebase-functions/logger"));
const params_1 = require("firebase-functions/params");
// Initialize the Firebase Admin SDK. This is lightweight and OK to keep in the global scope.
admin.initializeApp();
// --- FIX: REMOVED from global scope to prevent deployment timeouts. ---
// const db = admin.firestore();
// Define and load secrets and configurations. This is also lightweight.
const GOOGLE_CLIENT_ID = (0, params_1.defineString)("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = (0, params_1.defineSecret)("GOOGLE_CLIENT_SECRET");
/**
 * An HTTPS Callable function that exchanges an authorization code for tokens.
 */
exports.exchangeToken = (0, https_1.onCall)(async (request) => {
    var _a;
    // --- FIX: Initialize Firestore inside the function ---
    const db = admin.firestore();
    logger.info("exchangeToken function triggered for user:", (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid);
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    // ... rest of the function is the same ...
    const userId = request.auth.uid;
    const code = request.data.code;
    if (!code) {
        throw new https_1.HttpsError("invalid-argument", "The function must be called with a 'code' argument.");
    }
    try {
        const oauth2Client = new googleapis_1.google.auth.OAuth2(GOOGLE_CLIENT_ID.value(), GOOGLE_CLIENT_SECRET.value(), "postmessage");
        const { tokens } = await oauth2Client.getToken(code);
        logger.info(`Received tokens for user ${userId}`);
        const tokenData = {
            accessToken: tokens.access_token,
            expiryDate: tokens.expiry_date,
            scope: tokens.scope,
        };
        if (tokens.refresh_token) {
            tokenData.refreshToken = tokens.refresh_token;
        }
        await db
            .collection("users").doc(userId)
            .collection("private").doc("googleTokens")
            .set(tokenData, { merge: true });
        return { status: "success", message: "Google Account linked successfully." };
    }
    catch (error) {
        logger.error(`Error exchanging token for user ${userId}:`, error);
        throw new https_1.HttpsError("internal", "Failed to link Google account.");
    }
});
/**
 * A Firestore-triggered function that syncs a task to Google Calendar.
 */
exports.syncTaskToGoogleCalendar = (0, firestore_1.onDocumentWritten)("artifacts/{appId}/users/{userId}/tasks/{taskId}", async (event) => {
    var _a, _b;
    // This function doesn't use `db` directly, it uses helper functions, so no changes here.
    // ... all the logic from before remains the same ...
    const { userId, taskId } = event.params;
    if (!((_a = event.data) === null || _a === void 0 ? void 0 : _a.after.exists)) {
        const beforeData = (_b = event.data) === null || _b === void 0 ? void 0 : _b.before.data();
        if (beforeData === null || beforeData === void 0 ? void 0 : beforeData.googleEventId) {
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
    const syncWasDisabled = (beforeData === null || beforeData === void 0 ? void 0 : beforeData.addToGoogleCalendar) && !taskData.addToGoogleCalendar;
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
            const eventNeedsUpdate = (beforeData === null || beforeData === void 0 ? void 0 : beforeData.name) !== taskData.name ||
                (beforeData === null || beforeData === void 0 ? void 0 : beforeData.description) !== taskData.description ||
                (beforeData === null || beforeData === void 0 ? void 0 : beforeData.scheduledStart.seconds) !== taskData.scheduledStart.seconds ||
                (!taskData.isComplete && (beforeData === null || beforeData === void 0 ? void 0 : beforeData.scheduledEnd.seconds) !== taskData.scheduledEnd.seconds);
            if (eventNeedsUpdate) {
                await calendar.events.update({
                    calendarId: "primary",
                    eventId: taskData.googleEventId,
                    requestBody: eventPayload,
                });
                logger.log(`Updated Google Calendar event for task ${taskId}`);
            }
        }
        else {
            const createdEvent = await calendar.events.insert({
                calendarId: "primary",
                requestBody: eventPayload,
            });
            if (createdEvent.data.id) {
                await event.data.after.ref.update({ googleEventId: createdEvent.data.id });
                logger.log(`Created Google Calendar event ${createdEvent.data.id} for task ${taskId}`);
            }
        }
    }
    catch (error) {
        logger.error(`Error syncing task ${taskId} to Google Calendar:`, error);
    }
});
/**
 * Helper function to get an authenticated Google Calendar API client.
 */
async function getGoogleCalendarClient(userId) {
    // --- FIX: Initialize Firestore inside the function ---
    const db = admin.firestore();
    const tokenDoc = await db
        .collection("users").doc(userId)
        .collection("private").doc("googleTokens")
        .get();
    if (!tokenDoc.exists) {
        throw new Error(`User ${userId} has not linked their Google account.`);
    }
    const tokens = tokenDoc.data();
    if (!(tokens === null || tokens === void 0 ? void 0 : tokens.refreshToken)) {
        throw new Error(`User ${userId} is missing a refresh token.`);
    }
    const client = new googleapis_1.google.auth.OAuth2(GOOGLE_CLIENT_ID.value(), GOOGLE_CLIENT_SECRET.value());
    client.setCredentials({ refresh_token: tokens.refreshToken });
    return googleapis_1.google.calendar({ version: "v3", auth: client });
}
/**
 * Helper function to delete a Google Calendar event.
 */
async function deleteGoogleCalendarEvent(userId, eventId) {
    try {
        const calendar = await getGoogleCalendarClient(userId);
        await calendar.events.delete({
            calendarId: "primary",
            eventId: eventId,
        });
        logger.log(`Successfully deleted event ${eventId}.`);
    }
    catch (error) {
        logger.error(`Failed to delete event ${eventId}. It may have already been removed.`, error);
    }
}
//# sourceMappingURL=index.js.map
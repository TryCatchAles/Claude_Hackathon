/**
 * Google Meet client — MVP Honor System implementation
 *
 * The Google Meet REST API (conference records, participant sessions) requires
 * Google Workspace Enterprise — a paid product. Since we do not use Workspace,
 * session validation is done via manual confirmation by participants (Honor System).
 *
 * These functions are intentionally no-ops for MVP. The real validation gate is:
 *   sessions.validated = true  (set when both parties confirm in the UI)
 *
 * If a Workspace account becomes available, replace the stubs below with real
 * calls to https://meet.googleapis.com/v2/conferenceRecords
 */

export interface ConferenceRecord {
  name: string
  startTime: string
  endTime: string | null
  expireTime: string | null
}

export interface ParticipantSession {
  name: string
  startTime: string
  endTime: string | null
}

/**
 * Looks up a conference record by meeting code or record ID.
 * MVP: not implemented — requires Google Workspace.
 */
export async function getConferenceRecord(
  _meetingCodeOrRecordId: string
): Promise<ConferenceRecord | null> {
  // Not implemented for MVP (requires Google Workspace)
  return null
}

/**
 * Returns participant sessions for a conference record.
 * MVP: not implemented — requires Google Workspace.
 */
export async function getParticipantSessions(
  _conferenceRecordId: string
): Promise<ParticipantSession[]> {
  // Not implemented for MVP (requires Google Workspace)
  return []
}

/**
 * Checks whether mentor and mentee overlapped for at least minMinutes.
 * MVP: always returns true — validation is done via Honor System in the UI.
 */
export async function validateOverlap(
  _conferenceRecordId: string,
  _minMinutes: number
): Promise<boolean> {
  // Honor System: participants confirm manually in the UI
  return true
}

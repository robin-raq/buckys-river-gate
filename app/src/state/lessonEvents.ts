export type LessonEvent =
  | { type: 'START' }
  | { type: 'EXPLORE_INTERACTION'; blockId: string }
  | { type: 'EXPLORE_TIMEOUT' }
  | { type: 'EXPLORE_COMPLETE' }
  | { type: 'DIALOGUE_ADVANCE' }
  | { type: 'LOG_SNAPPED';  blockId: string; slot: number }
  | { type: 'LOG_RETURNED'; blockId: string }
  | { type: 'CHOP';         blockId: string }
  | { type: 'BUILD';        blockIds: [string, string] }
  | { type: 'CHECK_SUBMIT' }
  | { type: 'PLAY_AGAIN' }

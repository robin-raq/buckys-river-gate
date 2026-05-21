export type LessonEvent =
  | { type: 'START' }
  | { type: 'EXPLORE_INTERACTION'; blockId: string }
  | { type: 'EXPLORE_TIMEOUT' }
  | { type: 'EXPLORE_COMPLETE' }
  | { type: 'DIALOGUE_ADVANCE' }
  | { type: 'DIALOGUE_REWIND' }
  | { type: 'LOG_SNAPPED';  blockId: string; slot: number }
  | { type: 'LOG_RETURNED'; blockId: string }
  | { type: 'CHOP';         blockId: string }
  | { type: 'BUILD';        blockIds: [string, string] }
  | { type: 'CHECK_SUBMIT' }
  | { type: 'PLAY_AGAIN' }
  // Challenge-1 bonus prompt: kid chooses whether to retry the same
  // gate with a different combination of pieces.
  | { type: 'BONUS_ACCEPTED' }
  | { type: 'BONUS_DECLINED' }

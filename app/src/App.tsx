import { useReducer } from 'react'
import { lessonReducer } from './state/lessonReducer'
import { initLessonState } from './state/initialState'
import { BootScreen }   from './components/BootScreen'
import { LessonScreen } from './components/LessonScreen'
import './styles/tokens.css'

export default function App() {
  const [state, dispatch] = useReducer(lessonReducer, undefined, initLessonState)

  if (state.phase === 'BOOT') {
    return (
      <BootScreen
        onStart={() => dispatch({ type: 'START' })}
      />
    )
  }

  return <LessonScreen state={state} dispatch={dispatch} />
}

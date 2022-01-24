import styles from '../../styles/controller.module.scss'

export default function Controller({ rotateLeft, rotateRight, cancel }: {
  rotateLeft: () => void
  rotateRight: () => void
  cancel: () => void
}) {
  return (
    <div>
      <div>🕹️ Controller</div>
      <div className={styles.controllerContainer}>
        <span onMouseDown={rotateLeft} onMouseUp={cancel}
          onTouchStart={rotateLeft}
          onTouchEnd={(e) => {
            e.preventDefault()
            cancel()
          }}>◀</span>
        <span onMouseDown={rotateRight} onMouseUp={cancel}
          onTouchStart={rotateRight}
          onTouchEnd={(e) => {
            e.preventDefault()
            cancel()
          }}>▶</span>
      </div>
    </div>)
}
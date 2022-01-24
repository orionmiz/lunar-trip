import styles from '../../styles/switch.module.scss'

export default function Switch({ checked, toggle, children }: {
  checked: boolean,
  toggle: () => void,
  children?: React.ReactNode
}) {
  return (
    <div>
      <label className={styles.switch}>  
        <input type='checkbox' checked={checked} onChange={toggle}></input>
        <span className={`${styles.slider} ${styles.round}`}></span>
      </label>
      <div>
        {children}
      </div>
    </div>
  )
}
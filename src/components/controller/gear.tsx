import React, { MouseEventHandler, TouchEventHandler, useRef, useState } from 'react'
import styles from '../../styles/gear.module.scss'

export default function Gear({ size = 5, power, change }: {
  size?: number
  power: number
  change: (power: number) => void
}) {

  const ref = useRef<HTMLDivElement>(null);

  const changeByPosition = (x: number) => {
    if (ref.current) {
      const { width, left } = ref.current.getBoundingClientRect();
      const percent = (x - left) / width * 100;
      const val = Math.round(percent / (100 / (size - 1)));
      change(val);
    }
  }

  const handleMouseDown: MouseEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();

    // only allow left click
    if (event.button === 0) {
      handleMouseMove(event);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }

  const handleTouchStart: TouchEventHandler<HTMLDivElement> = (event) => {
    handleTouchMove(event);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }

  const handleMouseMove = (event: MouseEvent | React.MouseEvent) => {
    changeByPosition(event.clientX);
  }

  const handleMouseUp = () => {
    // clean-up
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }

  const handleTouchMove = (event: TouchEvent | React.TouchEvent) => {
    changeByPosition(event.changedTouches[0].clientX);
  }

  const handleTouchEnd = (event: TouchEvent) => {
    event.preventDefault();

    // clean-up
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  }

  return (
    <>
      <div>🔥 Engine Power</div>
      <div className={styles.slider} ref={ref} onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
        <span className={styles.rail}></span>
        <span className={styles.bar} style={{ width: `${power / (size - 1) * 100}%` }}></span>
        {Array(size).fill(0).map((_, i) => (
          <span className={styles.step} style={{ left: `${i / (size - 1) * 100}%` }} key={i} />
        ))}
        <span className={styles.thumb} style={{ left: `${power / (size - 1) * 100}%` }}></span>
      </div>
    </>)
}
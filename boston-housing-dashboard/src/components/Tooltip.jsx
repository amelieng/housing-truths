export default function Tooltip({ visible, x, y, content }) {
  return (
    <div
      id="tooltip"
      className={visible ? 'show' : ''}
      style={{
        left: Math.min(x + 14, window.innerWidth - 240) + 'px',
        top:  Math.max(y - 30, 8) + 'px',
      }}
      dangerouslySetInnerHTML={{ __html: content ?? '' }}
    />
  )
}

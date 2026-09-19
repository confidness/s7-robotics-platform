/**
 * The S7 Robotics mark: two 270° arcs that meet tangentially and read as a rotated S,
 * sitting on the white disc the brand uses.
 *
 * Drawn rather than imported as a bitmap so it stays crisp at 20px, needs no asset request
 * and keeps its own blue in both themes — a logo is a constant, not a themed surface.
 */

/** The brand blue. Deliberately literal: the mark must not drift when the palette is retuned. */
const MARK_BLUE = '#1560ec'

/* Left lobe opens to the upper right, right lobe to the lower left; both r=22 on centres
   44 apart, so they touch at (52,30) and the stroke runs through as one continuous S. */
const PATH = 'M30 8A22 22 0 1 0 52 30A22 22 0 1 1 74 52'

export function Mark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} aria-hidden="true" focusable="false">
      <circle cx="60" cy="60" r="60" fill="#ffffff" />
      <g transform="translate(25 40) scale(0.673)">
        <path d={PATH} fill="none" stroke={MARK_BLUE} strokeWidth="14" />
      </g>
    </svg>
  )
}

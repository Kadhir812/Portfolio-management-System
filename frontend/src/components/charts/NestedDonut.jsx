const SIZE = 260;
const CENTER = SIZE / 2;

function Ring({ segments, radius, width, activeKey, onActive }) {
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  let offset = 0;

  return segments.filter((segment) => segment.value > 0).map((segment) => {
    const length = (segment.value / total) * circumference;
    const gap = segments.length > 1 ? Math.min(3, length * 0.25) : 0;
    const dim = activeKey && activeKey !== segment.key;
    const circle = (
      <circle
        key={segment.key}
        cx={CENTER}
        cy={CENTER}
        r={radius}
        fill="none"
        stroke={segment.color}
        strokeWidth={width}
        strokeDasharray={`${Math.max(length - gap, 0)} ${circumference}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${CENTER} ${CENTER})`}
        opacity={dim ? 0.25 : 1}
        style={{ transition: 'opacity 150ms' }}
        onMouseEnter={() => onActive(segment.key)}
        onMouseLeave={() => onActive(null)}
      >
        <title>{segment.label}</title>
      </circle>
    );
    offset += length;
    return circle;
  });
}

/**
 * Two rings in one chart. Each segment is { key, value, color, label }.
 * Segments with the same key light up together when you hover either ring.
 * `children` is shown in the middle.
 */
export function NestedDonut({ outer, inner, activeKey, onActive, label, children, className = 'max-w-[260px]' }) {
  return (
    <div className={`relative mx-auto aspect-square w-full ${className}`}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={label} className="h-full w-full">
        <circle cx={CENTER} cy={CENTER} r={108} fill="none" stroke="hsl(var(--muted))" strokeWidth={26} />
        <circle cx={CENTER} cy={CENTER} r={76} fill="none" stroke="hsl(var(--muted))" strokeWidth={26} />
        <Ring segments={outer} radius={108} width={26} activeKey={activeKey} onActive={onActive} />
        <Ring segments={inner} radius={76} width={26} activeKey={activeKey} onActive={onActive} />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-[27%] text-center">{children}</div>
    </div>
  );
}

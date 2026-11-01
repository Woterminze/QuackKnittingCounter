export type FrogMood = 'happy' | 'sad' | 'alert' | 'sleepy' | 'scarf';

interface Props {
  mood?: FrogMood;
  size?: number;
  className?: string;
  title?: string;
}

/** Лягушонок-маскот. Свой рисунок, без сторонних персонажей. */
export function Frog({ mood = 'happy', size = 96, className, title }: Props) {
  const eyesClosed = mood === 'sleepy';
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 120 110"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <ellipse cx="60" cy="100" rx="46" ry="9" fill="var(--pad)" />
      <ellipse cx="60" cy="70" rx="40" ry="29" fill="var(--frog)" />
      <ellipse cx="60" cy="80" rx="24" ry="14" fill="var(--frog-belly)" />
      <circle cx="38" cy="40" r="15" fill="var(--frog)" />
      <circle cx="82" cy="40" r="15" fill="var(--frog)" />
      {eyesClosed ? (
        <>
          <path d="M31 42 Q38 47 45 42" stroke="var(--frog-ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M75 42 Q82 47 89 42" stroke="var(--frog-ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="38" cy="40" r="9" fill="#fff" />
          <circle cx="82" cy="40" r="9" fill="#fff" />
          <circle cx={mood === 'sad' ? 37 : 40} cy={mood === 'sad' ? 43 : 42} r="4.5" fill="var(--frog-ink)" />
          <circle cx={mood === 'sad' ? 81 : 84} cy={mood === 'sad' ? 43 : 42} r="4.5" fill="var(--frog-ink)" />
        </>
      )}
      <circle cx="33" cy="68" r="6" fill="var(--blush)" opacity=".75" />
      <circle cx="87" cy="68" r="6" fill="var(--blush)" opacity=".75" />
      {mood === 'happy' || mood === 'scarf' ? (
        <path d="M45 66 Q60 79 75 66" stroke="var(--frog-ink)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      ) : mood === 'sad' ? (
        <path d="M47 74 Q60 64 73 74" stroke="var(--frog-ink)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      ) : mood === 'alert' ? (
        <ellipse cx="60" cy="70" rx="7" ry="6" fill="var(--frog-ink)" />
      ) : (
        <path d="M50 70 H70" stroke="var(--frog-ink)" strokeWidth="3.5" strokeLinecap="round" />
      )}
      {mood === 'scarf' && (
        <>
          <path d="M24 82 Q60 96 96 82 L96 90 Q60 104 24 90 Z" fill="var(--accent)" />
          <rect x="72" y="88" width="10" height="18" rx="3" fill="var(--accent)" />
          <path d="M30 86 v6 M40 89 v6 M50 91 v6 M60 92 v6 M70 91 v6 M80 89 v6 M90 86 v6" stroke="#fff" strokeOpacity=".5" strokeWidth="2" />
        </>
      )}
    </svg>
  );
}

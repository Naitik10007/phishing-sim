// Stylized, illustrated human characters (flat-vector busts), used in place
// of emoji/photo avatars. Deliberately NOT photorealistic — this is a plain
// HTML/CSS/JS build and this environment cannot render or animate
// photorealistic 3D humans or record real actors. Each character gets a
// consistent design with a real pose/expression system (eyebrows, eyes,
// mouth, head lean, forehead tension) driven by `mood`, plus a mouth-talk
// animation driven by `talking`, and a "speaking" indicator bar above the
// photo driven by `speaking`.

const MOODS = {
  neutral:      { browAngle: 0,   browY: 0,  eyeOpen: 1,    mouthCurve: 0,  lean: 0,  tension: false },
  professional: { browAngle: -2,  browY: -1, eyeOpen: 1,    mouthCurve: 1,  lean: 0,  tension: false },
  serious:      { browAngle: -8,  browY: 1,  eyeOpen: 0.9,  mouthCurve: -2, lean: 2,  tension: false },
  threatening:  { browAngle: -14, browY: 2,  eyeOpen: 0.85, mouthCurve: -5, lean: 4,  tension: true },
  manipulative: { browAngle: -6,  browY: -1, eyeOpen: 0.95, mouthCurve: 2,  lean: 1,  tension: false },
  confused:     { browAngle: 10,  browY: -3, eyeOpen: 1.1,  mouthCurve: -1, lean: -2, tension: false },
  worried:      { browAngle: 14,  browY: -2, eyeOpen: 1.15, mouthCurve: -4, lean: -3, tension: true },
  frightened:   { browAngle: 18,  browY: -4, eyeOpen: 1.25, mouthCurve: -7, lean: -6, tension: true },
  hesitant:     { browAngle: 8,   browY: -2, eyeOpen: 1,    mouthCurve: -3, lean: -2, tension: false },
  relieved:     { browAngle: -2,  browY: 0,  eyeOpen: 0.95, mouthCurve: 4,  lean: 0,  tension: false },
  calm:         { browAngle: -1,  browY: 0,  eyeOpen: 0.9,  mouthCurve: 6,  lean: 0,  tension: false },
};

/**
 * Returns an HTML string for one character: a speaking-indicator bar, the
 * SVG bust, and a text label underneath.
 *
 * @param {"victim"|"scammer"} role
 * @param {string} mood - a key of MOODS
 * @param {boolean} talking - whether to run the mouth-talk animation
 * @param {boolean} speaking - whether this character is the current speaker (lights the bar)
 * @param {string} label
 */
export function characterHTML(role, mood, talking, speaking, label) {
  const m = MOODS[mood] || MOODS.neutral;
  const isVictim = role === "victim";

  const skin = "#D9A066";
  const hair = isVictim ? "#1C1410" : "#2B2622";
  const clothing = isVictim ? "#1E3A66" : "#1F2937";
  const clothingAccent = isVictim ? "#2E4F86" : "#374151";
  const collar = isVictim ? "#16233D" : "#E5E7EB";

  const torsoPath = isVictim
    ? "M30 200 C30 150 60 132 100 132 C140 132 170 150 170 200 Z"
    : "M28 200 C28 148 58 130 100 130 C142 130 172 148 172 200 Z";

  const hairPath = isVictim
    ? "M60 70 C56 36 80 20 100 20 C122 20 144 36 140 70 C140 50 124 42 100 42 C78 42 62 50 60 70 Z"
    : "M62 66 C60 34 80 22 100 22 C120 22 140 34 138 66 C136 48 122 40 100 40 C80 40 64 48 62 66 Z";

  const mouthClass = talking ? "dag-character__mouth dag-character__mouth--talking" : "dag-character__mouth";

  return `
    <div class="dag-character dag-character--${role}">
      <div class="dag-speakbar ${speaking ? "dag-speakbar--active" : ""}" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      <svg viewBox="0 0 200 200" width="100%" height="100%">
        <path d="${torsoPath}" fill="${clothing}"></path>
        ${
          isVictim
            ? `<path d="M70 140 L85 160 L100 142 L115 160 L130 140" fill="none" stroke="${clothingAccent}" stroke-width="3" opacity="0.6"></path>`
            : `<path d="M85 132 L100 170 L115 132" fill="${collar}" opacity="0.9"></path>
               <rect x="97" y="140" width="6" height="34" fill="#9CA3AF" opacity="0.5"></rect>`
        }
        <rect x="88" y="108" width="24" height="30" fill="${skin}"></rect>
        <g transform="translate(${m.lean} 0)">
          <ellipse cx="100" cy="82" rx="38" ry="44" fill="${skin}"></ellipse>
          <ellipse cx="61" cy="84" rx="6" ry="9" fill="${skin}"></ellipse>
          <ellipse cx="139" cy="84" rx="6" ry="9" fill="${skin}"></ellipse>
          <path d="${hairPath}" fill="${hair}"></path>
          ${
            m.tension
              ? `<g stroke="#B9794A" stroke-width="1.3" opacity="0.55">
                   <path d="M78 54 q4 -3 8 0" fill="none"></path>
                   <path d="M114 54 q4 -3 8 0" fill="none"></path>
                 </g>`
              : ""
          }
          <rect x="72" y="${62 + m.browY}" width="20" height="4.5" rx="2.2" fill="${hair}" transform="rotate(${m.browAngle} 82 ${64 + m.browY})"></rect>
          <rect x="108" y="${62 + m.browY}" width="20" height="4.5" rx="2.2" fill="${hair}" transform="rotate(${-m.browAngle} 118 ${64 + m.browY})"></rect>
          <ellipse cx="82" cy="80" rx="6.5" ry="${6.5 * m.eyeOpen}" fill="#1a1a1a"></ellipse>
          <ellipse cx="118" cy="80" rx="6.5" ry="${6.5 * m.eyeOpen}" fill="#1a1a1a"></ellipse>
          <circle cx="84" cy="${78 - 1 * m.eyeOpen}" r="1.4" fill="#fff"></circle>
          <circle cx="120" cy="${78 - 1 * m.eyeOpen}" r="1.4" fill="#fff"></circle>
          <path d="M100 82 q3 10 0 14 q-3 1 -5 0" fill="none" stroke="#B9794A" stroke-width="1.4" opacity="0.6"></path>
          <path class="${mouthClass}" d="M82 112 Q100 ${112 + m.mouthCurve} 118 112" fill="none" stroke="#8B4A3A" stroke-width="3.2" stroke-linecap="round"></path>
        </g>
      </svg>
      <div class="dag-character__label">${label}</div>
    </div>
  `;
}

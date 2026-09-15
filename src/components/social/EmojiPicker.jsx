import { useState } from 'react';
import './EmojiPicker.css';

// Set curato di emoji comuni: niente libreria esterna, bastano poche righe
// per coprire la maggior parte degli usi. Riusato dal composer dei post e
// da quello dei commenti (Fase B).
const EMOJI_SET = [
  '😀', '😂', '😍', '😎', '🥳', '😢', '😡', '🤔',
  '👍', '👎', '❤️', '🔥', '🎉', '👏', '🙌', '😴',
  '🐶', '🐱', '⚽', '🎵', '☀️', '🌧️', '🍕', '☕',
];

export default function EmojiPicker({ onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rb-emoji-picker">
      <button
        type="button"
        className="rb-composer-icon-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Aggiungi un'emoji"
        title="Emoji"
      >
        😊
      </button>
      {open && (
        <div className="rb-emoji-popover">
          {EMOJI_SET.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="rb-emoji-option"
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

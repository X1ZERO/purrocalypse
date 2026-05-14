import { useState } from 'react';
import { LABELS, ICONS } from './Card.jsx';

const ORDER = [
  'bomb', 'defuse', 'nope',
  'skip', 'attack', 'targeted_attack',
  'favor', 'shuffle', 'see_future', 'alter_future',
  'cat_taco', 'cat_beard', 'cat_potato', 'cat_rainbow', 'cat_melon', 'feral_cat',
  'half_bomb_a', 'half_bomb_b',
];

const TEXT = {
  th: {
    btn: '📖 กติกา',
    title: '📖 วิธีเล่น',
    close: 'ปิด',
    gotIt: 'เข้าใจแล้ว',
    goal: 'เป้าหมาย',
    goalText:
      'เป็นผู้เล่นคนสุดท้ายที่ยังไม่ระเบิด ในแต่ละตา จั่วการ์ดจากกองให้ได้ ถ้าจั่วโดน "แมวระเบิด" ต้องใช้ "ปลดชนวน" ไม่งั้นคุณตาย',
    turn: 'ตาของคุณ',
    turnSteps: [
      'เล่นการ์ดได้กี่ใบก็ได้ (หรือไม่เล่นก็ได้)',
      'จบตาด้วยการจั่วการ์ด 1 ใบจากกอง',
      'ส่งต่อไปยังผู้เล่นทางซ้าย',
    ],
    cards: 'การ์ดทั้งหมด',
    combos: 'การเล่นแบบคอมโบ',
    comboList: [
      ['แมวคู่ (2 ใบเหมือนกัน)', 'ขโมยการ์ดสุ่ม 1 ใบจากผู้เล่นที่เลือก'],
      ['แมวสาม (3 ใบเหมือนกัน)', 'ระบุชื่อการ์ดที่ต้องการ ถ้าเป้าหมายมีก็ได้ไป'],
      ['Feral Cat (แมวจร)', 'นับเป็นแมวอะไรก็ได้ ใช้แทนแมวอื่นเพื่อทำคู่/สาม ต้องมีแมวจริงอย่างน้อย 1 ใบในชุด'],
      ['Half-Bomb ซ้าย + ขวา', 'จับคู่ครึ่งระเบิดเพื่อ KO ผู้เล่นคนใดก็ได้ทันที (Nope ได้)'],
    ],
    streaker: 'Streaker (เปลือยมือ)',
    streakerText: 'ผู้เล่น 1 คนจะถูกสุ่มให้เริ่มเกมโดยไม่มีการ์ดในมือเลย — แค่จั่วและเล่นแต่ละตา ความเสี่ยงสูงมาก',
    nope: 'หน้าต่างการ Nope',
    nopeText:
      'เมื่อมีการเล่นแอ็คชั่น ระบบจะเปิดให้ทุกคนที่ "ถือการ์ด Nope" กด Nope หรือ Pass ผู้เล่นที่ไม่มี Nope จะข้ามอัตโนมัติ เมื่อทุกคนที่มีสิทธิ์โหวตครบ จะจบทันที (มีตัวจับเวลา 3.5 วินาทีเป็นตัวสำรอง)',
    nopeStack:
      'Nope ซ้อนกันได้ — Nope ซ้อน Nope = แอ็คชั่นเดิมผ่าน (จำนวนคี่ = ยกเลิก, คู่ = ผ่าน)',
  },
  en: {
    btn: '📖 Rules',
    title: '📖 How to play',
    close: 'Close',
    gotIt: 'Got it',
    goal: 'Goal',
    goalText:
      'Be the last player not exploded. Draw cards on your turn. Draw a Bomb Cat and you must use a Defuse or you are out.',
    turn: 'Your turn',
    turnSteps: [
      'Play any number of cards (or none).',
      'End your turn by drawing 1 card from the deck.',
      'Pass to the player on your left.',
    ],
    cards: 'All cards',
    combos: 'Combos',
    comboList: [
      ['Cat pair (2 same)', 'Steal a random card from a target.'],
      ['Cat triple (3 same)', 'Name a card type; take it from target if they have it.'],
      ['Feral Cat', 'Counts as any cat. Needs at least one real cat in the combo.'],
      ['Half-Bomb L + R', 'Instantly KO any player. Can be Noped.'],
    ],
    streaker: 'Streaker',
    streakerText: 'One random player starts with no hand. They just draw + play each turn — fully exposed.',
    nope: 'Nope window',
    nopeText:
      'When an action is played, anyone who holds a Nope card can either Nope or Pass. Players without a Nope auto-pass. As soon as all eligible voters decide, the action resolves. A 3.5s timer is a fallback.',
    nopeStack:
      'Nopes stack: a Nope on a Nope cancels itself (odd Nopes = canceled, even Nopes = passes).',
  },
};

const RULES_TEXT = {
  th: {
    bomb: 'แมวระเบิด — ถ้าคุณจั่วโดน คุณตายทันที ยกเว้นมีการ์ดปลดชนวน',
    defuse: 'ปลดชนวน — เล่นตอนเจอแมวระเบิด จากนั้นเอาระเบิดใส่กลับเข้ากองที่ตำแหน่งไหนก็ได้',
    skip: 'ข้าม — จบตาโดยไม่ต้องจั่ว ถ้าโดน Attack จะข้ามแค่ 1 จาก 2 ตา',
    attack: 'โจมตี — จบตาโดยไม่ต้องจั่ว คนถัดไปต้องเล่น 2 ตา ซ้อนได้',
    favor: 'ขอความช่วยเหลือ — เลือกผู้เล่น เขาต้องเลือกการ์ด 1 ใบให้คุณ',
    shuffle: 'สับไพ่ — สับกองจั่วใหม่ ใช้เวลาเดาว่าระเบิดใกล้บนสุดแล้ว',
    see_future: 'มองอนาคต — ดูการ์ด 3 ใบบนสุดของกอง (ลำดับซ้าย = ใบที่จะจั่วก่อน)',
    nope: 'Nope! — ยกเลิกแอ็คชั่นใดก็ได้ ยกเว้นระเบิด/ปลดชนวน ซ้อนได้ Nope on Nope = ผ่าน',
    cat_taco: 'แมวคู่ขโมยสุ่ม 1 ใบ • แมวสามระบุชื่อการ์ด',
    cat_beard: 'แมวคู่ขโมยสุ่ม 1 ใบ • แมวสามระบุชื่อการ์ด',
    cat_potato: 'แมวคู่ขโมยสุ่ม 1 ใบ • แมวสามระบุชื่อการ์ด',
    cat_rainbow: 'แมวคู่ขโมยสุ่ม 1 ใบ • แมวสามระบุชื่อการ์ด',
    cat_melon: 'แมวคู่ขโมยสุ่ม 1 ใบ • แมวสามระบุชื่อการ์ด',
    half_bomb_a: 'จับคู่ Left + Right = KO ผู้เล่นคนใดก็ได้ทันที',
    half_bomb_b: 'จับคู่ Left + Right = KO ผู้เล่นคนใดก็ได้ทันที',
    feral_cat: 'แมวจร — นับเป็นแมวอะไรก็ได้สำหรับทำคู่/สาม เล่นเดี่ยวไม่ได้',
    alter_future: 'เปลี่ยนอนาคต — ดูการ์ด 3 ใบบนสุด แล้วจัดเรียงใหม่ตามใจ (Party Pack)',
    targeted_attack: 'โจมตีเจาะจง — จบตาโดยไม่ต้องจั่ว เลือกผู้เล่นใดก็ได้ให้เล่น 2 ตา (Party Pack)',
  },
  en: {
    bomb: 'Draw it = you die unless you have a Defuse.',
    defuse: 'Cancel a Bomb. Put it back in the deck at any depth.',
    skip: 'End your turn without drawing. Only skips 1 of 2 turns when Attacked.',
    attack: 'End your turn without drawing. Next player takes 2 turns. Stackable.',
    favor: 'Pick a player. They give you 1 card of their choice.',
    shuffle: 'Shuffle the draw pile.',
    see_future: 'Privately peek at the top 3 of the deck (left = next draw).',
    nope: 'Cancel any action (not Bomb/Defuse). Stackable.',
    cat_taco: 'Pair = steal random • Triple = name card.',
    cat_beard: 'Pair = steal random • Triple = name card.',
    cat_potato: 'Pair = steal random • Triple = name card.',
    cat_rainbow: 'Pair = steal random • Triple = name card.',
    cat_melon: 'Pair = steal random • Triple = name card.',
    half_bomb_a: 'Combine L + R to instantly KO any player.',
    half_bomb_b: 'Combine L + R to instantly KO any player.',
    feral_cat: 'Wild cat. Counts as any cat for pairs/triples. Cannot play alone.',
    alter_future: 'View AND reorder the top 3 cards of the deck. (Party Pack)',
    targeted_attack: 'End turn no-draw. Pick any player to take 2 turns. (Party Pack)',
  },
};

const CARD_NAMES_TH = {
  bomb: 'แมวระเบิด',
  defuse: 'ปลดชนวน',
  skip: 'ข้าม',
  attack: 'โจมตี',
  favor: 'ขอความช่วยเหลือ',
  shuffle: 'สับไพ่',
  see_future: 'มองอนาคต',
  nope: 'Nope!',
  cat_taco: 'แมวทาโก้',
  cat_beard: 'แมวเครา',
  cat_potato: 'แมวมันฝรั่ง',
  cat_rainbow: 'แมวสายรุ้ง',
  cat_melon: 'แมวแตงโม',
  half_bomb_a: 'ครึ่งระเบิด (ซ้าย)',
  half_bomb_b: 'ครึ่งระเบิด (ขวา)',
  feral_cat: 'แมวจร',
  alter_future: 'เปลี่ยนอนาคต',
  targeted_attack: 'โจมตีเจาะจง',
};

export default function Rules() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'th');
  const t = TEXT[lang];
  const r = RULES_TEXT[lang];
  const nameOf = (type) => (lang === 'th' ? CARD_NAMES_TH[type] : LABELS[type]);
  const setLangPersist = (v) => { setLang(v); localStorage.setItem('lang', v); };
  return (
    <>
      <button className="secondary" onClick={() => setOpen(true)}>{t.btn}</button>
      {open && (
        <div className="target-picker" onClick={() => setOpen(false)}>
          <div className="panel rules-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>{t.title}</h2>
              <div>
                <button
                  className={lang === 'th' ? 'gold' : 'secondary'}
                  onClick={() => setLangPersist('th')}
                  style={{ marginRight: 6 }}
                >🇹🇭 ไทย</button>
                <button
                  className={lang === 'en' ? 'gold' : 'secondary'}
                  onClick={() => setLangPersist('en')}
                  style={{ marginRight: 12 }}
                >🇬🇧 EN</button>
                <button className="secondary" onClick={() => setOpen(false)}>✕</button>
              </div>
            </div>
            <h3>{t.goal}</h3>
            <p>{t.goalText}</p>
            <h3>{t.turn}</h3>
            <ol>
              {t.turnSteps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
            <h3>{t.cards}</h3>
            <div className="rules-grid">
              {ORDER.map((type) => (
                <div key={type} className="rules-row">
                  <div className={`card mini ${type}`}>
                    <div className="icon">{ICONS[type]}</div>
                    <div className="name">{nameOf(type)}</div>
                  </div>
                  <div className="rules-text">{r[type]}</div>
                </div>
              ))}
            </div>
            <h3>{t.combos}</h3>
            <ul>
              {t.comboList.map(([name, desc], i) => (
                <li key={i}><strong>{name}</strong> — {desc}</li>
              ))}
            </ul>
            <h3>{t.streaker}</h3>
            <p>{t.streakerText}</p>
            <h3>{t.nope}</h3>
            <p>{t.nopeText}</p>
            <p>{t.nopeStack}</p>
            <button onClick={() => setOpen(false)} style={{ marginTop: 12 }}>{t.gotIt}</button>
          </div>
        </div>
      )}
    </>
  );
}

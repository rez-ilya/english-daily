# Собирает колоду Anki «ML & AI English» в файл ML-AI-English.apkg.
# Запуск: python build.py  (нужны genanki, matplotlib, numpy)
# ID модели, колоды и GUID заметок постоянные: повторный импорт обновит карточки, а не создаст дубликаты.
import html
import json
import re
import shutil
from pathlib import Path

import genanki

import images
from terms import SECTIONS

HERE = Path(__file__).parent
MODEL_ID = 1_760_312_401
DECK_ID = 1_760_312_402

FIELDS = ["Term", "IPA", "POS", "Russian", "Definition", "Example", "ExampleMasked",
          "Collocations", "Note", "Image", "Emoji", "Category", "Hint", "Reverse"]

CSS = r"""
.card {
  --bg: #fbfaf7; --surface: #ffffff; --text: #1d1d1b; --muted: #75736c; --border: #e4e1d8;
  --accent: #2f6f5e; --accent-soft: #e0eee8; --hl: #c4632b; --note: #fff6e0; --note-border: #e9c46a;
  font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 18px; line-height: 1.5; color: var(--text); background: var(--bg);
  text-align: center; padding: 18px 12px;
}
.card.nightMode, .night_mode .card {
  --bg: #1b1c1a; --surface: #242622; --text: #ecebe6; --muted: #a2a097; --border: #383a34;
  --accent: #6cc4a5; --accent-soft: #24392f; --hl: #f0a070; --note: #2e2a1c; --note-border: #8a7434;
}
.wrap { max-width: 600px; margin: 0 auto; }
.cat { font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
.emoji { font-size: 52px; line-height: 1.1; margin: 6px 0; }
.term { font-size: 32px; font-weight: 700; color: var(--accent); line-height: 1.2; margin: 6px 0; }
.meta { color: var(--muted); font-size: 16px; }
.pos { display: inline-block; font-size: 13px; padding: 1px 9px; border-radius: 99px; border: 1px solid var(--border); margin-right: 6px; }
.ipa { font-family: "Charis SIL", "Doulos SIL", "Lucida Sans Unicode", "Segoe UI", sans-serif; }
.ask { margin-top: 18px; color: var(--muted); font-size: 15px; }
.back-side .ask { display: none; }
hr#answer { border: 0; border-top: 1px solid var(--border); margin: 18px 0; }
.ru { font-size: 24px; font-weight: 700; margin: 4px 0 10px; }
.ru.big { font-size: 26px; margin-top: 10px; }
.def { color: var(--text); font-size: 17px; margin: 8px auto; max-width: 520px; }
.ex { text-align: left; margin: 14px auto; max-width: 520px; padding: 10px 14px; border-left: 4px solid var(--accent);
      background: var(--surface); border-radius: 0 10px 10px 0; font-style: italic; }
.ex b, .hl { color: var(--hl); font-style: normal; font-weight: 700; }
.gap { display: inline-block; min-width: 90px; border-bottom: 2px solid var(--hl); }
.img img { max-width: 100%; max-height: 300px; border-radius: 12px; border: 1px solid var(--border); margin: 6px 0; }
.chips { margin: 12px auto; max-width: 540px; }
.chips .lbl { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin-bottom: 4px; }
.chip { display: inline-block; margin: 3px; padding: 3px 10px; border-radius: 99px; background: var(--accent-soft); font-size: 15px; }
.note { text-align: left; margin: 12px auto; max-width: 520px; padding: 10px 14px; background: var(--note);
        border: 1px solid var(--note-border); border-radius: 10px; font-size: 15px; }
.hint { margin-top: 14px; font-size: 16px; color: var(--muted); }
.hint a { color: var(--accent); }
.replay-button svg { width: 34px; height: 34px; }
"""

FRONT_1 = """<div class="wrap">
<div class="cat">{{Category}}</div>
<div class="emoji">{{Emoji}}</div>
<div class="term">{{Term}}</div>
<div class="meta">{{#POS}}<span class="pos">{{POS}}</span>{{/POS}}{{#IPA}}<span class="ipa">{{IPA}}</span>{{/IPA}}</div>
<div>{{tts en_US:Term}}</div>
<div class="ask">Что это значит? Скажите вслух пример.</div>
</div>"""

DETAILS = """{{#Collocations}}<div class="chips"><span class="lbl">Collocations</span>{{Collocations}}</div>{{/Collocations}}
{{#Note}}<div class="note">💡 {{Note}}</div>{{/Note}}"""

BACK_1 = """<div class="back-side">{{FrontSide}}</div>
<hr id="answer">
<div class="wrap">
{{#Image}}<div class="img">{{Image}}</div>{{/Image}}
<div class="ru">{{Russian}}</div>
<div class="def">{{Definition}}</div>
<div class="ex">{{Example}} {{tts en_US:Example}}</div>
""" + DETAILS + "\n</div>"

FRONT_2 = """{{#Reverse}}<div class="wrap">
<div class="cat">{{Category}} · вспомните по-английски</div>
<div class="ru big">{{Russian}}</div>
<div class="def">{{Definition}}</div>
<div class="ex">{{ExampleMasked}}</div>
<div class="hint">{{hint:Hint}}</div>
</div>{{/Reverse}}"""

BACK_2 = """{{FrontSide}}
<hr id="answer">
<div class="wrap">
<div class="emoji">{{Emoji}}</div>
<div class="term">{{Term}}</div>
<div class="meta">{{#POS}}<span class="pos">{{POS}}</span>{{/POS}}{{#IPA}}<span class="ipa">{{IPA}}</span>{{/IPA}}</div>
<div>{{tts en_US:Term}}</div>
{{#Image}}<div class="img">{{Image}}</div>{{/Image}}
<div class="ex">{{Example}}</div>
""" + DETAILS + "\n</div>"

MODEL = genanki.Model(
    MODEL_ID,
    "ML & AI English (Ilya)",
    fields=[{"name": f} for f in FIELDS],
    templates=[
        {"name": "1 · English → смысл", "qfmt": FRONT_1, "afmt": BACK_1},
        {"name": "2 · смысл → English", "qfmt": FRONT_2, "afmt": BACK_2},
    ],
    css=CSS,
    sort_field_index=0,
)

MARK = re.compile(r"\*\*(.+?)\*\*")


def hint_for(term: str) -> str:
    """«overfitting» → «o__________»; скобки (SOTA) и многоточия не подсказываем."""
    base = re.sub(r"\s*\(.*?\)", "", term).replace("…", "").strip()
    return re.sub(r"[A-Za-z]+", lambda m: m.group(0)[0] + "_" * (len(m.group(0)) - 1), base)


def esc(s: str) -> str:
    return html.escape(s, quote=False)


def main():
    files = images.render_all(HERE / "build" / "media")
    deck = genanki.Deck(DECK_ID, "ML & AI English")
    used_media = set()
    count = 0
    for tag, title, entries in SECTIONS:
        for e in entries:
            ex = esc(e["example"])
            example = MARK.sub(r"<b>\1</b>", ex)
            masked = MARK.sub('<span class="gap">&nbsp;</span>', ex)
            chips = "".join(f'<span class="chip">{esc(c.strip())}</span>' for c in e["colloc"].split("·") if c.strip())
            image = ""
            if e["img"]:
                name = files[e["img"]].name
                image = f'<img src="{name}">'
                used_media.add(files[e["img"]])
            note = genanki.Note(
                model=MODEL,
                fields=[esc(e["term"]), esc(e["ipa"]), esc(e["pos"]), esc(e["ru"]), esc(e["definition"]), example, masked,
                        chips, esc(e["note"]), image, e["emoji"], title, esc(hint_for(e["term"])), "y"],
                tags=[f"ml-ai::{tag}"],
                guid=genanki.guid_for("ml-ai-english", e["term"]),
            )
            deck.add_note(note)
            count += 1
    pkg = genanki.Package(deck)
    pkg.media_files = [str(p) for p in sorted(used_media)]
    out = HERE / "ML-AI-English.apkg"
    pkg.write_to_file(out)
    print(f"{count} notes, {count * 2} cards, {len(used_media)} images -> {out}")
    export_web(files)


def slug(term: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", term.lower()).strip("-")


def export_web(files):
    """Та же колода для приложения English Daily: decks/ml-ai.json + картинки в public/decks/ml-ai/."""
    root = HERE.parent
    img_dir = root / "public" / "decks" / "ml-ai"
    img_dir.mkdir(parents=True, exist_ok=True)
    for old in img_dir.glob("*.png"):
        old.unlink()
    notes, seen = [], set()
    for _tag, title, entries in SECTIONS:
        for e in entries:
            nid = slug(e["term"])
            assert nid not in seen, f"duplicate id {nid}"
            seen.add(nid)
            img = ""
            if e["img"]:
                img = files[e["img"]].name
                shutil.copyfile(files[e["img"]], img_dir / img)
            notes.append({
                "id": nid, "term": e["term"], "ipa": e["ipa"], "pos": e["pos"], "ru": e["ru"],
                "definition": e["definition"], "example": e["example"],
                "colloc": [c.strip() for c in e["colloc"].split("·") if c.strip()],
                "note": e["note"], "img": img, "emoji": e["emoji"], "category": title,
                "hint": hint_for(e["term"]),
            })
    out = root / "decks" / "ml-ai.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps({"id": "ml-ai", "title": "ML & AI English", "notes": notes}, ensure_ascii=False, indent=1) + "\n",
                   encoding="utf-8")
    print(f"web: {len(notes)} notes -> {out}, images -> {img_dir}")


if __name__ == "__main__":
    main()

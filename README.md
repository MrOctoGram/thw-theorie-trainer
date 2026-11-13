# THW Theorie Trainer 🟦

Mobile Lern-App für die Theorie der **THW-Grundausbildung**. Du lernst wie für die Führerscheinprüfung: ankreuzen, wiederholen, Prüfung simulieren. Läuft komplett lokal auf dem iPhone, auch offline, und braucht keinen App Store.

> Inoffizielle Lernhilfe, kein Produkt der Bundesanstalt THW. **Die App enthält keine Prüfungsfragen.** Den offiziellen Fragenkatalog importierst du einmalig selbst, z. B. aus ILIAS oder von deinem Ausbildungsbeauftragten. Er bleibt nur lokal auf deinem Gerät und landet nie in diesem Repo.

## Funktionen

- **Ankreuz-Modus wie beim Führerschein**: Eine oder mehrere Antworten können richtig sein. Es zählt nur, wenn alle richtigen angekreuzt sind.
- **Infotipps** 💡: optionale Begründung je Antwort und Hinweis zur Frage. Lassen sich jederzeit an- und ausschalten.
- **Karteikarten-Modus wie beim Vokabellernen**: Karte umdrehen und selbst bewerten (gewusst / unsicher / nicht gewusst).
- **Karteikasten nach Leitner**: Richtig beantwortete Karten wandern ein Fach weiter (Pause 1 → 3 → 7 → 14 → 30 Tage), falsche zurück in Fach 1. Falsche Karten kommen in derselben Runde noch einmal dran.
- **Prüfungssimulation** nach Prüfungsvorschrift (DV 2-220): 40 Fragen aus allen Kapiteln, 30 Minuten, bestanden ab 80 % (höchstens 8 Fehler). Auflösung erst am Ende, alles einstellbar.
- **Gamification**: XP, Combos, 12 Ränge vom „Grünschnabel“ bis zur „THW-Legende“, Tagesziel, Lernserie 🔥 und 15 Abzeichen.
- **Kapitelübersicht** mit Fortschritt, „Fehler wiederholen“ und Statistiken.
- **Fragenkatalog-Import** als Datei oder Text (JSON oder einfaches Textformat). Kapitel werden automatisch erkannt. Der Katalog lässt sich exportieren und auf ein anderes Gerät übertragen.
- **Backup**: Fortschritt exportieren und wieder einspielen.
- Dunkelmodus, iPhone-Notch und Home-Indicator werden berücksichtigt.

## Installation – Schritt für Schritt

Die App ist eine **Web-App (PWA)**. Sie wird einmal über GitHub Pages ins Netz gestellt und dann auf dem iPhone wie eine App auf den Home-Bildschirm gelegt. Ein App Store oder Entwicklerkonto ist nicht nötig. Für die Installation brauchst du kurz Internet, danach läuft die App offline.

### Teil A – Einmalig auf GitHub (am besten am PC)

1. **Repo öffentlich machen**
   `github.com/MrOctoGram/thw-theorie-trainer` → **Settings** → **General** → ganz unten bei *Danger Zone* auf **Change visibility** → **Make public** und bestätigen.
   GitHub Pages ist im kostenlosen Plan nur für öffentliche Repos verfügbar. Im Repo liegen keine Prüfungsfragen, nur der App-Code.
2. **GitHub Pages einschalten**
   **Settings** → links **Pages** → bei *Build and deployment*:
   - *Source*: **Deploy from a branch**
   - *Branch*: **main** und Ordner **/ (root)** → **Save**
3. **1–2 Minuten warten** und die Pages-Seite neu laden. Oben steht dann *„Your site is live at …“*.
   Die Adresse lautet: **https://mroctogram.github.io/thw-theorie-trainer/**
   Wenn du die Adresse am PC öffnest, sollte der Willkommensbildschirm der App erscheinen.

### Teil B – App aufs iPhone

1. Die Adresse **https://mroctogram.github.io/thw-theorie-trainer/** in **Safari** öffnen.
2. Auf das **Teilen-Symbol** tippen (□ mit Pfeil nach oben).
   Bei neueren iOS-Versionen versteckt es sich im **„•••“-Menü** neben der Adressleiste.
3. Nach unten scrollen und **„Zum Home-Bildschirm“** wählen.
   Falls ein Schalter **„Als Web-App öffnen“** erscheint, eingeschaltet lassen.
4. Oben rechts auf **„Hinzufügen“** tippen. Auf dem Home-Bildschirm erscheint das Symbol **„THW Theorie“**.
5. ⚠️ **Ab jetzt die App immer über dieses Symbol öffnen, nicht über Safari.** Die Home-Bildschirm-App und der Safari-Tab haben getrennte Speicher. Fragen und Lernstand liegen nur dort, wo du sie importiert hast.

### Teil C – Fragenkatalog laden (einmalig)

1. Die Katalogdatei (z. B. `THW-Fragenkatalog-2024-v3.5.json`) aufs iPhone holen, etwa aus dem Chat, per AirDrop oder per Mail. Dann **„In Dateien sichern“** wählen.
2. Die **App vom Home-Bildschirm** öffnen → unten **„Mehr“** → Abschnitt **„Fragenkatalog“** → **„Datei wählen …“** → die Datei in *Dateien* antippen.
3. Die Meldung *„Datei geladen“* erscheint. Jetzt auf **„Katalog ersetzen“** tippen.
4. Fertig: Unter **„Kapitel“** stehen jetzt die Lernabschnitte, unter **„Start“** kannst du loslernen.

### Gut zu wissen

- **Updates der App** kommen automatisch: Die App einfach einmal mit Internet öffnen und danach neu starten.
- **Neuer Katalog** (z. B. nächste Version): wie in Teil C importieren und **„Katalog ersetzen“** tippen. Bei unveränderten Fragen bleibt der Lernstand erhalten.
- **Backup**: Unter **Mehr → Sicherung → „Fortschritt exportieren“** sicherst du alles in einer Datei, z. B. in iCloud Drive. Sinnvoll vor einem Handywechsel. In den iPhone-Einstellungen unter *Safari → Verlauf und Websitedaten löschen* können auch die App-Daten verloren gehen.
- **Zweites Gerät**: Unter **Mehr → „Katalog exportieren“** bzw. **„Fortschritt exportieren“** speichern und auf dem anderen Gerät importieren.

### Probleme?

| Problem | Lösung |
|---|---|
| Unter der Adresse erscheint „404“ | Pages ist noch nicht fertig. 2 Minuten warten und prüfen, ob in Teil A Branch `main` / `(root)` gespeichert ist. |
| „Zum Home-Bildschirm“ fehlt | Die Seite wirklich in **Safari** öffnen, nicht in einer In-App-Vorschau (z. B. aus Mail oder WhatsApp). In der Teilen-Liste ganz nach unten scrollen. |
| App ist nach dem Öffnen leer | Wahrscheinlich wurde der Katalog in Safari statt in der Home-Bildschirm-App importiert. Teil C in der App wiederholen. |
| Datei lässt sich nicht auswählen | Die Datei muss in der *Dateien*-App liegen (*Auf meinem iPhone* oder *iCloud Drive*). |

## Fragenkatalog importieren

In der App unter **Mehr → Fragenkatalog** eine Datei wählen oder den Inhalt einfügen. Danach **„Katalog ersetzen“** (bei einer neuen Katalogversion) oder **„Hinzufügen“** tippen. Bei gleichem Fragetext bleibt dein Lernstand erhalten.

### Textformat (am einfachsten)

```text
# Kapitelname
? Fragetext
+ richtige Antwort || optionale Begründung (Infotipp)
- falsche Antwort || optionale Begründung
- falsche Antwort
> optionaler Infotipp zur ganzen Frage

? Nächste Frage …
```

`+` (oder `*`) markiert eine richtige Antwort, `-` eine falsche. Mehrere richtige Antworten sind erlaubt. Zeilen ohne Zeichen am Anfang setzen Frage bzw. Antwort fort.

### JSON

```json
{
  "chapters": [{ "id": "1", "name": "Kapitelname" }],
  "questions": [
    { "id": "1.01", "k": "1", "q": "Fragetext", "a": ["A", "B", "C"], "c": [0, 2],
      "r": ["Begründung A", "Begründung B", "Begründung C"], "e": "Infotipp zur Frage" }
  ]
}
```

- `c`: Positionen der richtigen Antworten, gezählt ab 0
- `r`, `e` und `id` sind optional. Ohne `id` wird sie aus Kapitel und Fragetext gebildet.

## Technik

Reines HTML/CSS/JavaScript ohne Build-Schritt und ohne Abhängigkeiten. Ein Service Worker (`sw.js`) sorgt für den Offline-Betrieb, gespeichert wird in `localStorage`.

Lokal testen:

```bash
python3 -m http.server 8000   # dann http://localhost:8000 öffnen
```

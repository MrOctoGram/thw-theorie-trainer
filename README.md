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

## Aufs iPhone bringen

Die App ist eine **Progressive Web App (PWA)**. Sie muss einmal unter einer HTTPS-Adresse liegen, danach installierst du sie wie eine App:

1. Im Repo unter **Settings → Pages** als Source „Deploy from a branch“, Branch `main` und Ordner `/ (root)` wählen.
   GitHub Pages ist im Free-Plan nur für **öffentliche** Repos verfügbar, bei privaten Repos braucht es GitHub Pro.
2. Nach ca. 1 Minute ist die App erreichbar unter `https://<dein-github-name>.github.io/thw-theorie-trainer/`.
3. Die Adresse auf dem iPhone in **Safari** öffnen, auf **Teilen** (□↑) tippen und **„Zum Home-Bildschirm“** wählen.
4. Fertig: Die App startet im Vollbild vom Home-Bildschirm und funktioniert ab dann auch **offline**.

Der Lernfortschritt bleibt **nur auf deinem Gerät** gespeichert. Es gibt keinen Server und kein Konto.

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

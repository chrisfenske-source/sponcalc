<?php
// ══════════════════════════════════════════════════════
//  KONFIGURATION – nur diese Zeilen anpassen:
// ══════════════════════════════════════════════════════
define('SMTP_HOST',      'smtp.strato.de');
define('SMTP_PORT',      465);                         // SSL/TLS
define('SMTP_USER',      'hallo@chris-fenske.de');     // STRATO-E-Mail-Adresse
define('SMTP_PASS',      '6RojcpFWXlzwOa8FZuDp');      // E-Mail-Passwort
define('SMTP_FROM',      'hallo@chris-fenske.de');     // Absender (= SMTP_USER)
define('SMTP_FROM_NAME', 'uhlsport Kalkulation');      // Anzeigename
define('BCC_FIXED',      'cfenske@uhlsport.de');       // Immer als BCC
// ══════════════════════════════════════════════════════

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/phpmailer/Exception.php';
require_once __DIR__ . '/phpmailer/SMTP.php';
require_once __DIR__ . '/phpmailer/PHPMailer.php';

function smtp_send(array $recipients, string $subject, string $html_body): array
{
    $mail = new PHPMailer(true);
    try {
        // Server
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = SMTP_PORT;
        $mail->CharSet    = 'UTF-8';
        $mail->Encoding   = 'base64';
        $mail->Timeout    = 30;

        // Absender
        $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
        $mail->addReplyTo(SMTP_FROM, SMTP_FROM_NAME);

        // Empfänger
        foreach ($recipients as $addr) {
            $mail->addAddress(trim($addr));
        }
        $mail->addBCC(BCC_FIXED);

        // Inhalt
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $html_body;
        $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $html_body));

        $mail->send();
        return ['ok' => true, 'message' => 'E-Mail gesendet an: ' . implode(', ', $recipients)];

    } catch (Exception $e) {
        return ['ok' => false, 'error' => 'Mailer-Fehler: ' . $mail->ErrorInfo];
    }
}

// ── REQUEST HANDLER ──
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
    if (strpos($contentType, 'application/json') !== false) {
        header('Content-Type: application/json; charset=utf-8');

        $raw  = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (!$data || !isset($data['html']) || !isset($data['recipients'])) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Ungültige Anfrage – fehlende Felder.']);
            exit;
        }

        $recipients = array_values(array_filter(array_map('trim', $data['recipients'])));
        if (empty($recipients)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Keine gültigen Empfänger angegeben.']);
            exit;
        }

        $subject = $data['subject'] ?? 'Ausrüstungsvertrag';
        $result  = smtp_send($recipients, $subject, $data['html']);

        if (!$result['ok']) {
            http_response_code(500);
        }
        echo json_encode($result);
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>uhlsport — Kalkulation Ausrüstungsverträge</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>

<!-- ── LIVE BAR ── -->
<div class="live-bar" id="liveBar">
  <div class="live-bar-inner">
    <div class="live-bar-label">Vorschau</div>
    <div class="live-pills">
      <div class="live-pill">
        <span class="live-pill-label">Nettoumsatz</span>
        <span class="live-pill-value" id="liveNetto">–</span>
      </div>
      <div class="live-pill">
        <span class="live-pill-label">Invest</span>
        <span class="live-pill-value" id="liveInvest">–</span>
      </div>
      <div class="live-pill">
        <span class="live-pill-label">Deckungsbeitrag</span>
        <span class="live-pill-value" id="liveDB">–</span>
      </div>
      <div class="live-pill">
        <span class="live-pill-label">DB-Quote</span>
        <span class="live-pill-value" id="liveDBQ">–</span>
      </div>
    </div>
    <div class="live-verdict" id="liveVerdict">In Bearbeitung</div>
  </div>
</div>

<div class="app-wrap">

  <!-- ── HEADER ── -->
  <header class="site-header">
    <div class="logo-wrap">
      <img src="images/logo.png" alt="uhlsport" class="logo-img">
      <div class="header-divider"></div>
      <span class="header-tool">Kalkulation Ausrüstungsverträge</span>
    </div>
    <span class="header-date" id="headerDate"></span>
  </header>

  <!-- ── STEPPER ── -->
  <nav class="stepper" id="stepperNav">
    <div class="step-node active" data-step="1" onclick="navToStep(1)">
      <div class="step-node-circle">01</div>
      <div class="step-node-label">Stammdaten</div>
    </div>
    <div class="step-node" data-step="2" onclick="navToStep(2)">
      <div class="step-node-circle">02</div>
      <div class="step-node-label">Quotienten</div>
    </div>
    <div class="step-node" data-step="3" onclick="navToStep(3)">
      <div class="step-node-circle">03</div>
      <div class="step-node-label">Qualitativ</div>
    </div>
    <div class="step-node" data-step="4" onclick="navToStep(4)">
      <div class="step-node-circle">04</div>
      <div class="step-node-label">Sponsoring</div>
    </div>
    <div class="step-node" data-step="5" onclick="navToStep(5)">
      <div class="step-node-circle">05</div>
      <div class="step-node-label">Umsätze</div>
    </div>
    <div class="step-node" data-step="6" onclick="navToStep(6)">
      <div class="step-node-circle">06</div>
      <div class="step-node-label">Ergebnis</div>
    </div>
  </nav>

  <!-- ══ GLOBALES RECALC-BANNER (erscheint auf allen Schritten nach erster Berechnung) ══ -->
  <div class="recalc-banner" id="recalcBanner">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.59"/></svg>
    <span class="recalc-banner-text"><strong>Werte geändert?</strong> Klicke auf „Neu berechnen" um die Ergebnisseite zu aktualisieren.</span>
    <button class="recalc-btn" onclick="berechnen()">Neu berechnen →</button>
  </div>

  <!-- ══ STEP 1: STAMMDATEN ══ -->
  <div class="card visible" id="step1">
    <div class="card-eyebrow">Schritt 01 / 05</div>
    <div class="card-title">Allgemeine Informationen</div>
    <div class="card-desc">Grunddaten zum Verein, Fachhändler und internen Ansprechpartnern.</div>

    <div class="section-head"><div class="section-head-line"></div><div class="section-head-label">Verein</div><div class="section-head-line"></div></div>
    <div class="field-grid">
      <div class="field-group">
        <div class="field-label">Name Verein <span class="tip">i<span class="tip-box">Vollständiger Name des Vereins, mit dem ein Ausrüstungsvertrag abgeschlossen werden soll.</span></span></div>
        <input type="text" id="vereinName" placeholder="z. B. FC Musterstadt">
        <span class="err-msg" id="err_vereinName">Pflichtfeld</span>
      </div>
      <div class="field-group">
        <div class="field-label">Liga <span class="tip">i<span class="tip-box">Aktuelle Spielklasse des Vereins – relevant für Sichtbarkeit und Umsatzpotenzial.</span></span></div>
        <input type="text" id="liga" placeholder="Bundesliga">
        <span class="err-msg" id="err_liga">Pflichtfeld</span>
      </div>
      <div class="field-group">
        <div class="field-label">Sportart <span class="tip">i<span class="tip-box">Die Sportart des Vereins, z. B. Fußball, Handball, Basketball. Erscheint im Ergebnisbericht.</span></span></div>
        <input type="text" id="sportart" placeholder="z. B. Fußball">
      </div>
      <div class="field-group">
        <div class="field-label">Kundennr. Freiware <span class="tip">i<span class="tip-box">SAP-Kundennummer des Vereins für Freiware-Lieferungen (kostenlose Ware direkt an den Verein).</span></span></div>
        <input type="text" id="kdnrVereinFreiware" placeholder="z. B. 123456">
      </div>
      <div class="field-group">
        <div class="field-label">Kundennr. Nachkauf <span class="tip">i<span class="tip-box">SAP-Kundennummer des Vereins für reguläre Nachkauf-Bestellungen.</span></span></div>
        <input type="text" id="kdnrVereinNachkauf" placeholder="z. B. 123456">
      </div>
      <div class="field-group">
        <div class="field-label">Nachkauf-Kondition Verein <span class="tip">i<span class="tip-box">Rabatt beim direkten Nachkauf des Vereins bei uhlsport. Dezimalzahl, z.B. 0.10 für 10%.</span></span></div>
        <input type="number" id="vereinNachkauf" value="0" step="0.01" min="0" max="1">
        <span class="field-hint">Dezimal, z.B. 0.10 = 10%</span>
      </div>
      <div class="field-group">
        <div class="field-label">Erlösschmälerungen Verein <span class="tip">i<span class="tip-box">Skonto, Boni etc. beim Verein als prozentualer Abzug vom Bruttoumsatz. Häufig 0.</span></span></div>
        <input type="number" id="vereinErloesschmaelerung" value="0" step="0.01" min="0" max="1">
        <span class="field-hint">Dezimal, z.B. 0.05 = 5%</span>
      </div>
    </div>

    <div class="section-head"><div class="section-head-line"></div><div class="section-head-label">Fachhändler</div><div class="section-head-line"></div></div>
    <div class="field-grid">
      <div class="field-group">
        <div class="field-label">Name Fachhändler <span class="tip">i<span class="tip-box">Name des Sportfachhändlers, über den der Verein die Ware bezieht.</span></span></div>
        <input type="text" id="haendlerName" placeholder="z. B. Teamworld">
      </div>
      <div class="field-group">
        <div class="field-label">Kundennr. Fachhändler <span class="tip">i<span class="tip-box">SAP-Kundennummer des Fachhändlers bei uhlsport.</span></span></div>
        <input type="text" id="kdnrHaendler" placeholder="z. B. 123456">
      </div>
      <div class="field-group">
        <div class="field-label">Nachkauf-Kondition Händler <span class="tip">i<span class="tip-box">Rabatt, den der Fachhändler beim regulären Nachkauf von uhlsport erhält. Standard: 30% → 0.30.</span></span></div>
        <input type="number" id="haendlerNachkauf" value="0.3" step="0.01" min="0" max="1">
        <span class="err-msg" id="err_haendlerNachkauf">Wert zwischen 0 und 1</span>
      </div>
      <div class="field-group">
        <div class="field-label">Einkauf Freiware Händler <span class="tip">i<span class="tip-box">Rabatt, den der Fachhändler auf Freiware-Artikel erhält. Standard: 40% → 0.40.</span></span></div>
        <input type="number" id="haendlerFreiware" value="0.4" step="0.01" min="0" max="1">
        <span class="err-msg" id="err_haendlerFreiware">Wert zwischen 0 und 1</span>
      </div>
      <div class="field-group">
        <div class="field-label">Erlösschmälerungen Händler <span class="tip">i<span class="tip-box">Skonto, Boni etc. für den Fachhändler. Standard: 8% → 0.08.</span></span></div>
        <input type="number" id="haendlerErloesschmaelerung" value="0.08" step="0.01" min="0" max="1">
        <span class="err-msg" id="err_haendlerErloesschmaelerung">Wert zwischen 0 und 1</span>
      </div>
    </div>

    <div class="section-head"><div class="section-head-line"></div><div class="section-head-label">Intern</div><div class="section-head-line"></div></div>
    <div class="field-grid">
      <div class="field-group">
        <div class="field-label">Außendienst</div>
        <input type="text" id="aussendienst" placeholder="z. B. Max Mustermann">
      </div>
      <div class="field-group">
        <div class="field-label">Umsatzverantwortliche Person</div>
        <input type="text" id="verantwortlich" placeholder="z. B. Max Mustermann">
      </div>
      <div class="field-group">
        <div class="field-label">Laufzeit <span class="tip">i<span class="tip-box">Vertragslaufzeit. Pro Jahr wird ein eigener Tab für Sponsoring und Umsatz angelegt.</span></span></div>
        <select id="laufzeit">
          <option value="1">1 Jahr</option>
          <option value="2">2 Jahre</option>
          <option value="3" selected>3 Jahre</option>
          <option value="4">4 Jahre</option>
          <option value="5">5 Jahre</option>
        </select>
      </div>
    </div>

    <div class="btn-row">
      <div></div>
      <button class="btn btn-next" onclick="goTo(2)">Weiter
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" style="margin-left:8px;vertical-align:-2px"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  </div>

  <!-- ══ STEP 2: QUOTIENTEN ══ -->
  <div class="card" id="step2">
    <div class="card-eyebrow">Schritt 02 / 05</div>
    <div class="card-title">Interne Quotienten</div>
    <div class="card-desc">Diese Werte steuern die Umrechnung zwischen COS, HEK und UVP. Standardwerte sind systemseitig vorgegeben.</div>

    <div class="lock-box">
      <input type="checkbox" id="quotientUnlock" onchange="toggleQuotientLock()">
      <label for="quotientUnlock">Ich bestätige, dass ich die internen Quotienten ändern darf und dies <strong>mit dem zuständigen Controlling abgestimmt</strong> habe.</label>
    </div>
    <div class="quotient-fields" id="quotientFields">
      <div class="field-grid">
        <div class="field-group">
          <div class="field-label">HEK / COS Quotient <span class="tip">i<span class="tip-box">HEK = Händlereinkaufspreis, COS = Herstellkosten. Wie viel mal höher ist der HEK gegenüber dem COS? Standard: 2.5 → HEK = 2,5 × COS.</span></span></div>
          <input type="number" id="hekCosQuotient" value="2.5" step="0.1" min="1">
          <span class="field-hint">Standard: 2.5</span>
        </div>
        <div class="field-group">
          <div class="field-label">UVP / COS Quotient <span class="tip">i<span class="tip-box">UVP = Unverbindliche Verkaufspreisempfehlung. Standard: 5.0 → UVP = 5 × COS.</span></span></div>
          <input type="number" id="uvpCosQuotient" value="5.0" step="0.1" min="1">
          <span class="field-hint">Standard: 5.0</span>
        </div>
      </div>
    </div>

    <div class="btn-row">
      <button class="btn btn-back" onclick="goTo(1)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" style="margin-right:8px;vertical-align:-2px"><polyline points="15 18 9 12 15 6"/></svg>Zurück
      </button>
      <button class="btn btn-next" onclick="goTo(3)">Weiter
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" style="margin-left:8px;vertical-align:-2px"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  </div>

  <!-- ══ STEP 3: QUALITATIV ══ -->
  <div class="card" id="step3">
    <div class="card-eyebrow">Schritt 03 / 05</div>
    <div class="card-title">Qualitative Beurteilung</div>
    <div class="card-desc">Strategische Einschätzungen zu Verein und Fachhändler. Diese erscheinen im Ergebnisbericht.</div>

    <div class="section-head"><div class="section-head-line"></div><div class="section-head-label">Verein</div><div class="section-head-line"></div></div>
    <div class="field-grid cols-1">
      <div class="field-group">
        <div class="field-label">Qualitative Beurteilung Verein <span class="tip">i<span class="tip-box">Freitextfeld zur strategischen Einschätzung: Sichtbarkeit, Wachstumspotenzial, Markenpräsenz, Medienrelevanz etc.</span></span></div>
        <textarea id="qualVerein" placeholder="z.B. Aufsteiger in die 1. Liga, starke Social-Media-Präsenz, wachsendes Mitgliederpotenzial..."></textarea>
      </div>
      <div class="field-group">
        <div class="field-label">Warum dieser Verein? <span class="tip">i<span class="tip-box">Begründung, warum dieser Verein für uhlsport als Partner strategisch interessant ist. Welche Reichweite? Welcher Markt?</span></span></div>
        <textarea id="warumVerein" placeholder="z.B. Bundesliga-Aufsteiger mit großer Medienpräsenz, starke regionale Anbindung..."></textarea>
      </div>
    </div>

    <div class="section-head"><div class="section-head-line"></div><div class="section-head-label">Fachhandel</div><div class="section-head-line"></div></div>
    <div class="field-grid cols-1">
      <div class="field-group">
        <div class="field-label">Qualitative Beurteilung Fachhandel <span class="tip">i<span class="tip-box">Einschätzung des Fachhändlers: Beratungskompetenz, Sortimentstiefe, Kundenkontakt, Zuverlässigkeit.</span></span></div>
        <textarea id="qualHandel" placeholder="z.B. Langjähriger Partner, hohe Beratungskompetenz, aktiv im Vereinsgeschäft..."></textarea>
      </div>
      <div class="field-group">
        <div class="field-label">Andere Vereine beim Händler? <span class="tip">i<span class="tip-box">Welche anderen Vereine beziehen bereits über diesen Händler uhlsport-Ware?</span></span></div>
        <textarea id="andereVereine" placeholder="z.B. Ja: TSV Beispielstadt (Landesliga), SV Musterort (Kreisliga)..."></textarea>
      </div>
      <div class="field-group">
        <div class="field-label">Zusätzliche Umsatzpotenziale? <span class="tip">i<span class="tip-box">Weitere Umsatzmöglichkeiten durch diesen Deal: Vereinsmitglieder, Fanshop, Schulen, Firmenkunden.</span></span></div>
        <textarea id="umsatzPotenziale" placeholder="z.B. Mitglieder-Aktionen geplant, Kooperation mit regionalen Schulen möglich..."></textarea>
      </div>
    </div>

    <div class="btn-row">
      <button class="btn btn-back" onclick="goTo(2)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" style="margin-right:8px;vertical-align:-2px"><polyline points="15 18 9 12 15 6"/></svg>Zurück
      </button>
      <button class="btn btn-next" onclick="goTo(4)">Weiter
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" style="margin-left:8px;vertical-align:-2px"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  </div>

  <!-- ══ STEP 4: SPONSORING ══ -->
  <div class="card" id="step4">
    <div class="card-eyebrow">Schritt 04 / 05</div>
    <div class="card-title">Sponsoring-Leistungen</div>
    <div class="card-desc">Was gibt uhlsport dem Verein pro Vertragsjahr? Freiware entweder zu HEK <em>oder</em> zu UVP – nie beides.</div>
    <div id="yearTabsContainer" class="year-tabs"></div>
    <div id="yearPanelsContainer"></div>
    <div class="btn-row">
      <button class="btn btn-back" onclick="goTo(3)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" style="margin-right:8px;vertical-align:-2px"><polyline points="15 18 9 12 15 6"/></svg>Zurück
      </button>
      <button class="btn btn-next" onclick="goTo(5)">Weiter
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" style="margin-left:8px;vertical-align:-2px"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  </div>

  <!-- ══ STEP 5: UMSÄTZE ══ -->
  <div class="card" id="step5">
    <div class="card-eyebrow">Schritt 05 / 05</div>
    <div class="card-title">Umsatzplanung</div>
    <div class="card-desc">Erwartete Umsätze durch diesen Deal: direkte Vereinsumsätze sowie Fachhändler-Direkt- und Indirektumsätze.</div>
    <div id="umsatzYearTabsContainer" class="year-tabs"></div>
    <div id="umsatzYearPanelsContainer"></div>
    <div class="btn-row">
      <button class="btn btn-back" onclick="goTo(4)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" style="margin-right:8px;vertical-align:-2px"><polyline points="15 18 9 12 15 6"/></svg>Zurück
      </button>
      <button class="btn btn-calc" onclick="berechnen()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" style="margin-right:8px;vertical-align:-2px"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>Kalkulation berechnen
      </button>
    </div>
  </div>

  <!-- ══ STEP 6: ERGEBNIS ══ -->
  <div class="result-card" id="step6">
    <div id="resultContent"></div>
    <button class="pdf-btn" onclick="exportPDF()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      Kalkulation als PDF speichern
    </button>
    <button class="email-btn" onclick="openEmailModal()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><rect x="2" y="4" width="20" height="16" rx="1"/><polyline points="2,4 12,13 22,4"/></svg>
      Auswertung per E-Mail senden
    </button>
    <button class="restart-btn" onclick="restart()">↩ Neue Kalkulation starten</button>
  </div>

</div><!-- /app-wrap -->

<script src="app.js"></script>
</body>
</html>

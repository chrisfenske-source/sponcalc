<?php
// ══════════════════════════════════════════════════════
//  KONFIGURATION – nur diese Zeilen anpassen:
// ══════════════════════════════════════════════════════
define('SMTP_HOST',      'smtp.strato.de');
define('SMTP_PORT',      465);
define('SMTP_USER',      'hallo@chris-fenske.de');
define('SMTP_PASS',      '6RojcpFWXlzwOa8FZuDp');
define('SMTP_FROM',      'hallo@chris-fenske.de');
define('SMTP_FROM_NAME', 'uhlsport Kalkulation');
define('BCC_FIXED',      'cfenske@uhlsport.de');
// ══════════════════════════════════════════════════════

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/phpmailer/Exception.php';
require_once __DIR__ . '/phpmailer/SMTP.php';
require_once __DIR__ . '/phpmailer/PHPMailer.php';

function smtp_send(array $recipients, string $subject, string $html_body): array {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP(); $mail->Host = SMTP_HOST; $mail->SMTPAuth = true;
        $mail->Username = SMTP_USER; $mail->Password = SMTP_PASS;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; $mail->Port = SMTP_PORT;
        $mail->CharSet = 'UTF-8'; $mail->Encoding = 'base64'; $mail->Timeout = 30;
        $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
        $mail->addReplyTo(SMTP_FROM, SMTP_FROM_NAME);
        foreach ($recipients as $addr) { $mail->addAddress(trim($addr)); }
        $mail->addBCC(BCC_FIXED);
        $mail->isHTML(true); $mail->Subject = $subject; $mail->Body = $html_body;
        $mail->AltBody = strip_tags(str_replace(['<br>','<br/>','<br />'], "\n", $html_body));
        $mail->send();
        return ['ok' => true, 'message' => 'E-Mail gesendet an: ' . implode(', ', $recipients)];
    } catch (Exception $e) {
        return ['ok' => false, 'error' => 'Mailer-Fehler: ' . $mail->ErrorInfo];
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
    if (strpos($contentType, 'application/json') !== false) {
        header('Content-Type: application/json; charset=utf-8');
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (!$data || !isset($data['html']) || !isset($data['recipients'])) {
            http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Ungültige Anfrage.']); exit;
        }
        $recipients = array_values(array_filter(array_map('trim', $data['recipients'])));
        if (empty($recipients)) {
            http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Keine Empfänger.']); exit;
        }
        $result = smtp_send($recipients, $data['subject'] ?? 'Ausrüstungsvertrag', $data['html']);
        if (!$result['ok']) http_response_code(500);
        echo json_encode($result); exit;
    }
}
?>
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>uhlsport — Kalkulation Ausrüstungsverträge</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<style>
/* ── ONE-PAGE LAYOUT ── */

.op-section {
  background: var(--surface);
  border: none;
  border-radius: 26px;
  box-shadow: 2px 6px 18.7px 0px rgba(0,0,0,0.25);
  margin-bottom: 12px;
  overflow: hidden;
}
.op-section-header {
  display: flex; align-items: center; gap: 16px;
  padding: 12px 20px;
  min-height: 75px;
  background: var(--surface);
  border-bottom: 1px solid transparent;
  cursor: pointer; user-select: none;
  transition: background 0.15s;
}
.op-section:not(.collapsed) .op-section-header { border-bottom-color: transparent; }
.op-section-header:hover { background: #f9f9f9; }
.op-section-num {
  font-family: var(--font-body); font-size: 28px; font-weight: 700;
  color: var(--white); background: var(--primary-gradient);
  width: 51px; height: 51px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; letter-spacing: 0;
  opacity: 0.35;
  transition: opacity 0.2s;
}
.op-section:not(.collapsed) .op-section-num {
  opacity: 1;
}
.op-section-title {
  font-family: var(--font-body); font-size: 18px; font-weight: 700;
  text-transform: none; letter-spacing: 0; color: var(--text);
  flex: 1;
}
.op-section-desc {
  font-size: 12px; color: var(--text-muted); max-width: 400px;
  text-align: right; line-height: 1.4;
}
.op-section-chevron {
  flex-shrink: 0; transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
  color: var(--text-muted);
}
.op-section.collapsed .op-section-chevron { transform: rotate(-90deg); }
.op-section-body {
  padding: 22px 20px 48px;
  overflow: hidden;
  transition: max-height 0.3s ease;
}
.op-section.collapsed .op-section-body {
  max-height: 0 !important;
  padding-top: 0; padding-bottom: 0;
}

/* Sub-accordions */
.um-sub {
  border: 1px solid var(--border); border-radius: var(--radius-md);
  margin-bottom: 10px; overflow: hidden;
}
.um-sub:last-child { margin-bottom: 0; }
.um-sub-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 16px; background: var(--slate-50);
  cursor: pointer; user-select: none;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}
.um-sub.collapsed .um-sub-header { border-bottom: none; }
.um-sub-header:hover { background: var(--slate-100); }
.um-sub-title {
  font-family: var(--font-mono); font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px; color: var(--text);
}
.um-sub-chevron { flex-shrink: 0; transition: transform 0.2s; color: var(--text-muted); }
.um-sub.collapsed .um-sub-chevron { transform: rotate(-90deg); }
.um-sub-body {
  overflow: hidden; transition: max-height 0.25s ease, padding 0.25s ease; padding: 16px 16px 40px;
}
.um-sub.collapsed .um-sub-body {
  max-height: 0 !important; padding-top: 0 !important; padding-bottom: 0 !important;
}

/* Ergebnis-Bereich */
.op-result {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-md);
  margin-bottom: 100px; overflow: hidden;
  animation: appear 0.3s ease;
}
.op-result-header {
  padding: 15px 20px; border-bottom: 1px solid var(--border);
  background: var(--slate-50);
  display: flex; align-items: center; gap: 10px;
}
.op-result-header-title {
  font-family: var(--font-body); font-size: 13px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.6px; color: var(--text);
}
.op-result-body { padding: 0; }

/* Sticky bottom bar */
.op-sticky {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 299;
  background: var(--surface); border-top: none;
  box-shadow: 0 -2px 24px rgba(0,0,0,0.2);
  padding: 12px 24px;
  display: flex; align-items: center; justify-content: center; gap: 16px;
}
.op-sticky-inner {
  max-width: 960px; width: 100%;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
}
.op-sticky-preview { display: flex; align-items: center; }
.op-sticky-pill {
  display: flex; flex-direction: column;
  padding: 0 20px; border-right: 1px solid var(--border);
}
.op-sticky-pill:first-child { padding-left: 0; }
.op-sticky-pill:last-child { border-right: none; }
.op-sticky-lbl {
  font-family: var(--font-mono); font-size: 9px; font-weight: 500;
  text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 1px;
}
.op-sticky-val {
  font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: var(--text);
}
.op-sticky-val.pos { color: var(--green); }
.op-sticky-val.warn { color: #fbbf24; }
.op-sticky-val.neg { color: var(--red); }
.op-calc-btn {
  display: flex; align-items: center; gap: 8px;
  height: 44px; padding: 0 28px;
  background: var(--cta-gradient); border: none; color: var(--white);
  border-radius: var(--radius-md);
  font-family: var(--font-body); font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1.5px; cursor: pointer;
  transition: opacity 0.15s, box-shadow 0.15s; flex-shrink: 0;
}
.op-calc-btn:hover { opacity: 0.9; box-shadow: 0 4px 14px rgba(254,129,22,0.4); }
.op-action-btns { display: flex; gap: 8px; }
.op-refresh-btn {
  display: flex; align-items: center; gap: 6px;
  height: 44px; padding: 0 18px;
  background: transparent; border: 1px solid rgba(255,255,255,0.25); color: rgba(255,255,255,0.75);
  border-radius: var(--radius-md);
  font-family: var(--font-mono); font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1.5px; cursor: pointer;
  transition: background 0.15s, border-color 0.15s; flex-shrink: 0;
}
.op-refresh-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.5); color: var(--white); }

/* Hide wizard chrome */
.stepper, .btn-row, .card-eyebrow { display: none !important; }
.card, .result-card { display: none !important; }
.edit-panel { display: none !important; }

.app-wrap { padding-bottom: 80px; }
.op-section-body .section-head:first-child { margin-top: 0; }
.op-section-body .year-tabs { margin-top: 0; }

/* Umsatzplanung group headline */
#umsatzSection { margin-bottom: 0; }
.umsatz-group-headline {
  display: flex; align-items: center; gap: 14px;
  padding: 8px 0 12px;
}
.umsatz-group-title {
  font-family: var(--font-body); font-size: 13px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.6px; color: var(--text);
}
.umsatz-group-desc {
  font-size: 12px; color: var(--text-muted); line-height: 1.4;
}
#umsatzYearAccordionsContainer .op-section { margin-bottom: 10px; }

@media (max-width: 640px) {
  .op-section-desc { display: none; }
  .op-sticky-pill { padding: 0 12px; }
  .op-sticky-val { font-size: 12px; }
  .op-calc-btn { padding: 0 18px; font-size: 10px; }
}
</style>
</head>
<body>

<!-- ── HEADER ── -->
<div class="app-wrap">
  <header class="site-header">
    <div class="logo-wrap">
      <img src="images/logo.png" alt="uhlsport" class="logo-img">
      <div class="header-divider"></div>
      <span class="header-tool">Kalkulation Ausrüstungsverträge</span>
    </div>
    <span class="header-date" id="headerDate"></span>
  </header>

  <!-- ══ SECTION 1: STAMMDATEN ══ -->
  <div class="op-section" id="sec1">
    <div class="op-section-header" onclick="toggleSection(1)">
      <div class="op-section-num">01</div>
      <div class="op-section-title">Allgemeine Informationen</div>
      <div class="op-section-desc">Verein, Fachhändler, interne Ansprechpartner</div>
      <svg class="op-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
    <div class="op-section-body" id="sec1-body">
      <div class="field-grid" style="margin-bottom:8px">
        <div class="field-group">
          <div class="field-label">Steuersatz Markt (%) <span class="tip">i<span class="tip-box">Mehrwertsteuer-Satz in %. Nur relevant bei UVP-Berechnungen. Berechnung: (UVP − Rabatt) ÷ (1 + Steuersatz).</span></span></div>
          <input type="number" id="steuer" value="0" step="0.1" min="0" max="100" placeholder="0">
          <span class="field-hint">z.B. 19 für 19% MwSt</span>
        </div>
      </div>
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
          <div class="field-label">Sportart</div>
          <input type="text" id="sportart" placeholder="z. B. Fußball">
        </div>
        <div class="field-group">
          <div class="field-label">Kundennr. Freiware</div>
          <input type="text" id="kdnrVereinFreiware" placeholder="z. B. 123456">
        </div>
        <div class="field-group">
          <div class="field-label">Kundennr. Nachkauf</div>
          <input type="text" id="kdnrVereinNachkauf" placeholder="z. B. 123456">
        </div>
        <div class="field-group">
          <div class="field-label">Nachkauf-Kondition Verein (%) <span class="tip">i<span class="tip-box">Rabatt des Vereins in Prozent, z.B. 10 für 10%.</span></span></div>
          <input type="number" id="vereinNachkauf" value="0" step="1" min="0" max="100" placeholder="0">
        </div>
        <div class="field-group">
          <div class="field-label">Erlösschmälerungen Verein (%) <span class="tip">i<span class="tip-box">Skonto, Boni etc. in Prozent, z.B. 5 für 5%.</span></span></div>
          <input type="number" id="vereinErloesschmaelerung" value="0" step="1" min="0" max="100" placeholder="0">
        </div>
      </div>
      <div class="field-grid">
        <div class="field-group span-2">
          <div class="field-label">Bewertungsgrundlage Vereinsumsatz</div>
          <div class="mode-toggle" id="verein_mode_toggle">
            <button onclick="setGlobalMode('verein','hek',this)">Zu HEK</button>
            <button class="on" onclick="setGlobalMode('verein','uvp',this)">Zu UVP</button>
          </div>
        </div>
      </div>

      <div class="section-head"><div class="section-head-line"></div><div class="section-head-label">Fachhändler</div><div class="section-head-line"></div></div>
      <div class="field-grid">
        <div class="field-group">
          <div class="field-label">Name Fachhändler</div>
          <input type="text" id="haendlerName" placeholder="z. B. Teamworld">
        </div>
        <div class="field-group">
          <div class="field-label">Kundennr. Fachhändler</div>
          <input type="text" id="kdnrHaendler" placeholder="z. B. 123456">
        </div>
        <div class="field-group">
          <div class="field-label">Nachkauf-Kondition Händler (%) <span class="tip">i<span class="tip-box">Standard: 30%</span></span></div>
          <input type="number" id="haendlerNachkauf" value="30" step="1" min="0" max="100" placeholder="0">
          <span class="err-msg" id="err_haendlerNachkauf">Wert zwischen 0 und 100</span>
        </div>
        <div class="field-group">
          <div class="field-label">Einkauf Freiware Händler (%) <span class="tip">i<span class="tip-box">Standard: 40%</span></span></div>
          <input type="number" id="haendlerFreiware" value="40" step="1" min="0" max="100" placeholder="0">
          <span class="err-msg" id="err_haendlerFreiware">Wert zwischen 0 und 100</span>
        </div>
        <div class="field-group">
          <div class="field-label">Erlösschmälerungen Händler (%) <span class="tip">i<span class="tip-box">Standard: 8%</span></span></div>
          <input type="number" id="haendlerErloesschmaelerung" value="8" step="1" min="0" max="100" placeholder="0">
          <span class="err-msg" id="err_haendlerErloesschmaelerung">Wert zwischen 0 und 100</span>
        </div>
      </div>
      <div class="field-grid">
        <div class="field-group span-2">
          <div class="field-label">Bewertungsgrundlage Händlerumsatz</div>
          <div class="mode-toggle" id="haendler_mode_toggle">
            <button class="on" onclick="setGlobalMode('haendler','hek',this)">Zu HEK</button>
            <button onclick="setGlobalMode('haendler','uvp',this)">Zu UVP</button>
          </div>
        </div>
      </div>

      <div class="section-head"><div class="section-head-line"></div><div class="section-head-label">Sponsoring</div><div class="section-head-line"></div></div>
      <div class="field-grid">
        <div class="field-group span-2">
          <div class="field-label">Bewertungsgrundlage Sponsoring-Freiware</div>
          <div class="mode-toggle" id="sponsoring_mode_toggle">
            <button class="on" onclick="setGlobalMode('sponsoring','hek',this)">Zu HEK</button>
            <button onclick="setGlobalMode('sponsoring','uvp',this)">Zu UVP</button>
          </div>
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
          <div class="field-label">Laufzeit <span class="tip">i<span class="tip-box">Pro Jahr wird ein eigener Abschnitt für Sponsoring und Umsatz angelegt.</span></span></div>
          <select id="laufzeit" onchange="onLaufzeitChange()">
            <option value="1">1 Jahr</option>
            <option value="2">2 Jahre</option>
            <option value="3" selected>3 Jahre</option>
            <option value="4">4 Jahre</option>
            <option value="5">5 Jahre</option>
          </select>
        </div>
      </div>
      <div id="ligaLabelContainer" class="field-grid" style="margin-top:8px"></div>
    </div>
  </div>

  <!-- ══ SECTION 2: QUOTIENTEN ══ -->
  <div class="op-section collapsed" id="sec2">
    <div class="op-section-header" onclick="toggleSection(2)">
      <div class="op-section-num">02</div>
      <div class="op-section-title">Interne Quotienten</div>
      <div class="op-section-desc">COS / HEK / UVP Umrechnungsfaktoren</div>
      <svg class="op-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
    <div class="op-section-body" id="sec2-body" style="max-height:0;padding-top:0;padding-bottom:0">
      <div class="lock-box">
        <input type="checkbox" id="quotientUnlock" onchange="toggleQuotientLock()">
        <label for="quotientUnlock">Ich bestätige, dass ich die internen Quotienten ändern darf und dies <strong>mit dem zuständigen Controlling abgestimmt</strong> habe.</label>
      </div>
      <div class="quotient-fields" id="quotientFields">
        <div class="field-grid">
          <div class="field-group">
            <div class="field-label">HEK / COS Quotient <span class="tip">i<span class="tip-box">Standard: 2.5 → HEK = 2,5 × COS.</span></span></div>
            <input type="number" id="hekCosQuotient" value="2.5" step="0.1" min="1">
            <span class="field-hint">Standard: 2.5</span>
          </div>
          <div class="field-group">
            <div class="field-label">UVP / COS Quotient <span class="tip">i<span class="tip-box">Standard: 5.0 → UVP = 5 × COS.</span></span></div>
            <input type="number" id="uvpCosQuotient" value="5.0" step="0.1" min="1">
            <span class="field-hint">Standard: 5.0</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ══ SECTION 3: QUALITATIV ══ -->
  <div class="op-section collapsed" id="sec3">
    <div class="op-section-header" onclick="toggleSection(3)">
      <div class="op-section-num">03</div>
      <div class="op-section-title">Qualitative Beurteilung</div>
      <div class="op-section-desc">Strategische Einschätzungen zu Verein & Händler</div>
      <svg class="op-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
    <div class="op-section-body" id="sec3-body" style="max-height:0;padding-top:0;padding-bottom:0">
      <div class="section-head"><div class="section-head-line"></div><div class="section-head-label">Verein</div><div class="section-head-line"></div></div>
      <div class="field-grid cols-1">
        <div class="field-group">
          <div class="field-label">Qualitative Beurteilung Verein</div>
          <textarea id="qualVerein" placeholder="z.B. Aufsteiger in die 1. Liga, starke Social-Media-Präsenz..."></textarea>
        </div>
        <div class="field-group">
          <div class="field-label">Warum dieser Verein?</div>
          <textarea id="warumVerein" placeholder="z.B. Bundesliga-Aufsteiger mit großer Medienpräsenz..."></textarea>
        </div>
      </div>
      <div class="section-head"><div class="section-head-line"></div><div class="section-head-label">Fachhandel</div><div class="section-head-line"></div></div>
      <div class="field-grid cols-1">
        <div class="field-group">
          <div class="field-label">Qualitative Beurteilung Fachhandel</div>
          <textarea id="qualHandel" placeholder="z.B. Langjähriger Partner, hohe Beratungskompetenz..."></textarea>
        </div>
        <div class="field-group">
          <div class="field-label">Andere Vereine beim Händler?</div>
          <textarea id="andereVereine" placeholder="z.B. TSV Beispielstadt (Landesliga)..."></textarea>
        </div>
        <div class="field-group">
          <div class="field-label">Zusätzliche Umsatzpotenziale?</div>
          <textarea id="umsatzPotenziale" placeholder="z.B. Mitglieder-Aktionen geplant..."></textarea>
        </div>
      </div>
    </div>
  </div>

  <!-- ══ SECTION 4: SPONSORING ══ -->
  <div class="op-section collapsed" id="sec4">
    <div class="op-section-header" onclick="toggleSection(4)">
      <div class="op-section-num">04</div>
      <div class="op-section-title">Sponsoring-Leistungen</div>
      <div class="op-section-desc">Cash & Freiware pro Vertragsjahr</div>
      <svg class="op-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
    <div class="op-section-body" id="sec4-body" style="max-height:0;padding-top:0;padding-bottom:0">
      <div id="yearTabsContainer" class="year-tabs"></div>
      <div id="yearPanelsContainer"></div>
    </div>
  </div>

  <!-- ══ UMSATZPLANUNG ══ -->
  <div id="umsatzSection">
    <div class="umsatz-group-headline">
      <div class="op-section-num" style="background:var(--primary);color:var(--white)">05</div>
      <span class="umsatz-group-title">Umsatzplanung</span>
      <span class="umsatz-group-desc">Verein direkt, Händler direkt & indirekt</span>
    </div>
    <div id="umsatzYearAccordionsContainer"></div>
  </div>

  <!-- ══ ERGEBNIS ══ -->
  <div id="opResultWrapper" style="display:none">
    <div class="umsatz-group-headline" style="margin-top:24px">
      <div class="op-section-num" style="background:var(--primary);color:var(--white)">06</div>
      <span class="umsatz-group-title">Ergebnis</span>
    </div>
    <div class="op-result" id="opResult">
      <div class="op-result-body">
        <div id="resultContent"></div>
        <div style="padding:0 24px 24px;display:flex;flex-direction:column;gap:8px">
          <button class="pdf-btn" onclick="exportPDF()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Kalkulation als PDF speichern
          </button>
          <button class="email-btn" onclick="openEmailModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><rect x="2" y="4" width="20" height="16" rx="1"/><polyline points="2,4 12,13 22,4"/></svg>
            Auswertung per E-Mail senden
          </button>
        </div>
      </div>
    </div>
  </div>

</div><!-- /app-wrap -->

<!-- Hidden stubs required by renderResult() / updateLiveBar() in app.js -->
<div id="step6" style="display:none"></div>
<div id="liveVerdict" style="display:none"></div>

<!-- ══ STICKY BOTTOM BAR ══ -->
<div class="op-sticky">
  <div class="op-sticky-inner">
    <div class="op-sticky-preview">
      <div class="op-sticky-pill">
        <span class="op-sticky-lbl">Nettoumsatz</span>
        <span class="op-sticky-val" id="liveNetto">–</span>
      </div>
      <div class="op-sticky-pill">
        <span class="op-sticky-lbl">Invest</span>
        <span class="op-sticky-val" id="liveInvest">–</span>
      </div>
      <div class="op-sticky-pill">
        <span class="op-sticky-lbl">Deckungsbeitrag</span>
        <span class="op-sticky-val" id="liveDB">–</span>
      </div>
      <div class="op-sticky-pill">
        <span class="op-sticky-lbl">DB-Quote</span>
        <span class="op-sticky-val" id="liveDBQ">–</span>
      </div>
    </div>
    <div class="op-action-btns">
      <button class="op-refresh-btn" onclick="opRefreshLive()" title="Live-Werte neu berechnen">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        Aktualisieren
      </button>
      <button class="op-calc-btn" onclick="opBerechnen()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        Kalkulation berechnen
      </button>
    </div>
  </div>
</div>

<!-- Email Modal (shared from app.js) -->
<div class="email-modal-overlay" id="emailModalOverlay" onclick="closeEmailModal(event)">
  <div class="email-modal" onclick="event.stopPropagation()">
    <div class="email-modal-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" style="vertical-align:-2px;margin-right:8px"><rect x="2" y="4" width="20" height="16" rx="1"/><polyline points="2,4 12,13 22,4"/></svg>
      Auswertung per E-Mail senden
    </div>
    <p class="email-modal-sub">Die Kalkulation wird als formatierte E-Mail zugestellt. Mehrere Adressen mit Enter oder Komma bestätigen.</p>
    <div class="email-modal-fixed">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      Immer im BCC: <span>cfenske@uhlsport.de</span>
    </div>
    <div class="email-tag-input" id="emailTagInput" onclick="document.getElementById('emailRawInput').focus()">
      <input type="text" id="emailRawInput" class="email-tag-input-field" placeholder="E-Mail-Adresse eingeben …" autocomplete="off" spellcheck="false">
    </div>
    <div class="email-modal-hint">Enter oder Komma = Adresse hinzufügen · Klick auf × = entfernen</div>
    <div class="email-modal-err" id="emailErr"></div>
    <div class="email-modal-actions">
      <button class="email-cancel-btn" onclick="closeEmailModal()">Abbrechen</button>
      <button class="email-send-btn" id="emailSendBtn" onclick="sendEmail()">
        <div class="spinner"></div>
        <span class="send-label">Jetzt senden</span>
      </button>
    </div>
  </div>
</div>

<script src="app.js"></script>
<script>
// ── ONE-PAGE SPECIFIC LOGIC ──

// Section toggle (accordion) — dynamic height
function toggleSection(n) {
  const sec = document.getElementById('sec'+n);
  const body = document.getElementById('sec'+n+'-body');
  const isCollapsed = sec.classList.contains('collapsed');
  if (isCollapsed) {
    sec.classList.remove('collapsed');
    body.style.paddingTop = '';
    body.style.paddingBottom = '';
    body.style.maxHeight = body.scrollHeight + 'px';
    const onEnd = () => {
      if (!sec.classList.contains('collapsed')) body.style.maxHeight = 'none';
      body.removeEventListener('transitionend', onEnd);
    };
    body.addEventListener('transitionend', onEnd);
  } else {
    // If max-height is 'none', pin it first so CSS transition has a start value
    if (body.style.maxHeight === 'none') {
      body.style.maxHeight = body.scrollHeight + 'px';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        sec.classList.add('collapsed');
        body.style.maxHeight = '0';
      }));
    } else {
      sec.classList.add('collapsed');
      body.style.maxHeight = '0';
    }
  }
}

// Expand all sections initially after a short delay (so scrollHeight is correct)
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('headerDate').textContent =
    new Date().toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
  initYearsFresh(3);
  buildLigaLabelSection();
  buildSponsoringUI();
  buildUmsatzUI();
  // Expand section 1 (already open), keep others collapsed
  const sec1body = document.getElementById('sec1-body');
  sec1body.style.maxHeight = sec1body.scrollHeight + 'px';
});

// When laufzeit changes, rebuild year UIs
function onLaufzeitChange() {
  const n = parseInt(document.getElementById('laufzeit').value);
  collectStammdaten();
  initYears(n);
  buildLigaLabelSection();
  buildSponsoringUI();
  buildUmsatzUI();
  // Keep open sections unconstrained after content rebuild
  const sec4 = document.getElementById('sec4');
  const body4 = document.getElementById('sec4-body');
  if (sec4 && !sec4.classList.contains('collapsed')) {
    body4.style.maxHeight = 'none';
  }
}

// Collect all data from DOM at once (no step concept)
function collectStammdaten() {
  state.vereinName=gv('vereinName'); state.liga=gv('liga'); state.sportart=gv('sportart')||'';
  state.aussendienst=gv('aussendienst'); state.verantwortlich=gv('verantwortlich');
  state.laufzeit=parseInt(gv('laufzeit')); state.haendlerName=gv('haendlerName');
  state.kdnrVereinFreiware=gv('kdnrVereinFreiware'); state.kdnrVereinNachkauf=gv('kdnrVereinNachkauf');
  state.kdnrHaendler=gv('kdnrHaendler');
  state.haendlerNachkauf=pfPct('haendlerNachkauf'); state.haendlerFreiware=pfPct('haendlerFreiware');
  state.haendlerErloesschmaelerung=pfPct('haendlerErloesschmaelerung');
  state.vereinNachkauf=pfPct('vereinNachkauf'); state.vereinErloesschmaelerung=pfPct('vereinErloesschmaelerung');
  state.steuer=pf('steuer')/100;
  state.years.forEach((yr,i)=>{const el=document.getElementById(`ligaLabel_${i}`);if(el)yr.ligaLabel=el.value;});
  state.hekCosQuotient=pf('hekCosQuotient'); state.uvpCosQuotient=pf('uvpCosQuotient');
  state.qualVerein=gv('qualVerein'); state.warumVerein=gv('warumVerein');
  state.qualHandel=gv('qualHandel'); state.andereVereine=gv('andereVereine');
  state.umsatzPotenziale=gv('umsatzPotenziale');
}

// Validate required fields
function opValidate() {
  let ok = true; let firstErr = null;
  const check = (id, invalid) => {
    if (invalid) {
      showErr(id); ok = false;
      if (!firstErr) firstErr = id;
    } else hideErr(id);
  };
  check('vereinName', !gv('vereinName'));
  check('liga', !gv('liga'));
  ['haendlerNachkauf','haendlerFreiware','haendlerErloesschmaelerung'].forEach(id => {
    const v = parseFloat(normNum(document.getElementById(id)?.value));
    check(id, isNaN(v)||v<0||v>100);
  });
  if (!ok && firstErr) {
    // Open section 1 if collapsed
    const sec1 = document.getElementById('sec1');
    if (sec1.classList.contains('collapsed')) toggleSection(1);
    setTimeout(() => {
      const el = document.getElementById(firstErr);
      if (el) el.scrollIntoView({behavior:'smooth', block:'center'});
    }, 150);
  }
  return ok;
}

// Main calculate function for one-page
function opBerechnen() {
  if (!opValidate()) return;
  collectStammdaten();
  collectSponsoringFromDOM();
  collectUmsatzFromDOM();
  // Call the shared berechnen logic but render differently
  opRenderResult();
}

function opRenderResult() {
  // Reuse the full berechnen calculation
  const s = state;
  const hek = s.hekCosQuotient, uvp = s.uvpCosQuotient;
  const steuer = s.steuer||0;
  const vMode = s.vereinMode||'hek', hdMode = s.haendlerMode||'hek', spMode = s.sponsoringMode||'hek';
  const results = s.years.map(yr => {
    const cashCost = yr.cash;
    const fwH = yr.freiwareHek, fwU = yr.freiwareUvp;
    const freiwareCosVal = spMode==='hek' ? fwH/hek : fwU/uvp;
    const sponsoringInvest = cashCost + freiwareCosVal;

    // Verein
    const vB = vMode==='hek' ? yr.vereinUmsatzHek : yr.vereinUmsatzUvp;
    let vereinRabatt, vereinErloess, vereinNetto, vereinCos;
    if(vMode==='hek'){
      vereinRabatt=vB*s.vereinNachkauf; vereinErloess=(vB-vereinRabatt)*s.vereinErloesschmaelerung;
      vereinNetto=vB-vereinRabatt-vereinErloess; vereinCos=vB/hek;
    } else {
      const vNR=vB*(1-s.vereinNachkauf); const vNS=vNR/(1+steuer);
      vereinErloess=vNS*s.vereinErloesschmaelerung; vereinNetto=vNS*(1-s.vereinErloesschmaelerung);
      vereinRabatt=vB-vNR; vereinCos=vB/uvp;
    }
    const vereinDB1 = vereinNetto-vereinCos;

    // Händler direkt
    const hdB = hdMode==='hek' ? yr.haendlerDirektHek : yr.haendlerDirektUvp;
    const hdFw = yr.haendlerFreiwareHek;
    let hdDirNet;
    if(hdMode==='hek'){hdDirNet=hdB*(1-s.haendlerNachkauf);}
    else{hdDirNet=hdB*(1-s.haendlerNachkauf)/(1+steuer);}
    const hdFwNet = hdFw*(1-s.haendlerFreiware);
    const hdBasis = hdDirNet+hdFwNet;
    const hdErloess = hdBasis*s.haendlerErloesschmaelerung;
    const hdNetto = hdBasis*(1-s.haendlerErloesschmaelerung);
    let hdCos;
    if(hdMode==='hek'){hdCos=(hdB+hdFw)/hek;}
    else{hdCos=hdB/uvp+hdFw/hek;}
    const hdDB1 = hdNetto-hdCos;

    // Händler indirekt
    const hiB = hdMode==='hek' ? yr.haendlerIndirektHek : yr.haendlerIndirektUvp;
    let hiRabatt, hiErloess, hiNetto, hiCos;
    if(hdMode==='hek'){
      hiRabatt=hiB*s.haendlerNachkauf; hiErloess=(hiB-hiRabatt)*s.haendlerErloesschmaelerung;
      hiNetto=hiB-hiRabatt-hiErloess; hiCos=hiB/hek;
    } else {
      const hiNR=hiB*(1-s.haendlerNachkauf); const hiNS=hiNR/(1+steuer);
      hiErloess=hiNS*s.haendlerErloesschmaelerung; hiNetto=hiNS*(1-s.haendlerErloesschmaelerung);
      hiRabatt=hiB-hiNR; hiCos=hiB/uvp;
    }
    const hiDB1 = hiNetto-hiCos;

    const sonstige = yr.marketingkosten+yr.logistikkosten+yr.sonstigeKosten;
    const gesamtNetto = vereinNetto+hdNetto+hiNetto;
    const gesamtDB = vereinDB1+hdDB1+hiDB1-sponsoringInvest-sonstige;
    const dbQuote = gesamtNetto>0?gesamtDB/gesamtNetto:0;
    return {label:yr.label,cashCost,freiwareCos:freiwareCosVal,sponsoringInvest,vereinNetto,vereinCos,vereinDB1,hdNetto,hdCos,hdDB1,hiNetto,hiCos,hiDB1,sonstige,gesamtNetto,gesamtDB,dbQuote};
  });
  const totalNetto = results.reduce((a,r)=>a+r.gesamtNetto,0);
  const totalInvest = results.reduce((a,r)=>a+r.sponsoringInvest+r.sonstige,0);
  const totalDB = results.reduce((a,r)=>a+r.gesamtDB,0);
  const totalDbQuote = totalNetto>0?totalDB/totalNetto:0;

  // Store for email
  window._lastResults = results;
  window._lastTotals = {netto:totalNetto,invest:totalInvest,db:totalDB,dbQuote:totalDbQuote};

  // Update sticky bar
  opUpdateSticky(totalNetto, totalInvest, totalDB, totalDbQuote);

  // Render result using shared renderResult
  renderResult(results, totalNetto, totalInvest, totalDB, totalDbQuote);

  // Show result section and scroll to it
  const resultWrapper = document.getElementById('opResultWrapper');
  resultWrapper.style.display = 'block';
  setTimeout(() => resultWrapper.scrollIntoView({behavior:'smooth', block:'start'}), 50);
}

function opUpdateSticky(netto, invest, db, dbq) {
  const fmtK2 = n => new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
  const setV = (id, val, cls) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = val;
    el.className = 'op-sticky-val' + (cls ? ' '+cls : '');
  };
  const opTier = dbq>=0.30?'pos':dbq>=0.20?'warn':'neg';
  setV('liveNetto', fmtK2(netto), netto>0?'pos':'');
  setV('liveInvest', fmtK2(-invest), 'neg');
  setV('liveDB', fmtK2(db), opTier==='neg'?'neg':'pos');
  setV('liveDBQ', (dbq*100).toFixed(1)+'%', opTier);
}

// Live estimate on input
document.addEventListener('input', () => {
  try {
    const hek = parseFloat(normNum(document.getElementById('hekCosQuotient')?.value)) || state.hekCosQuotient;
    const uvp = parseFloat(normNum(document.getElementById('uvpCosQuotient')?.value)) || state.uvpCosQuotient;
    const cosR = 1/hek;
    const steuer = (parseFloat(normNum(document.getElementById('steuer')?.value))||0)/100;
    const hN = (parseFloat(normNum(document.getElementById('haendlerNachkauf')?.value))||0)/100;
    const hE = (parseFloat(normNum(document.getElementById('haendlerErloesschmaelerung')?.value))||0)/100;
    const hFR = (parseFloat(normNum(document.getElementById('haendlerFreiware')?.value))||0)/100;
    const vN = (parseFloat(normNum(document.getElementById('vereinNachkauf')?.value))||0)/100;
    const vE = (parseFloat(normNum(document.getElementById('vereinErloesschmaelerung')?.value))||0)/100;
    const vMode = state.vereinMode||'hek';
    const hdMode = state.haendlerMode||'hek';
    const spMode = state.sponsoringMode||'hek';
    let tN=0,tI=0,tD=0;
    const n = state.years.length || 3;
    for(let i=0;i<n;i++){
      const yr=state.years[i]||{};
      const cash=pfId(`sp_cash_${i}`)||yr.cash||0;
      const fwH=pfId(`sp_freiwareHek_${i}`)||yr.freiwareHek||0;
      const fwU=pfId(`sp_freiwareUvp_${i}`)||yr.freiwareUvp||0;
      const spI=cash+(spMode==='hek'?fwH/hek:fwU/uvp);
      const vH=pfId(`um_vereinHek_${i}`)||yr.vereinUmsatzHek||0;
      const vU=pfId(`um_vereinUvp_${i}`)||yr.vereinUmsatzUvp||0;
      const vB=vMode==='hek'?vH:vU;
      let vNt,vD;
      if(vMode==='hek'){vNt=vB*(1-vN)*(1-vE);vD=vNt-vB/hek;}
      else{const vNR=vB*(1-vN)/(1+steuer);vNt=vNR*(1-vE);vD=vNt-vB/uvp;}
      const hdH=pfId(`um_hdirektHek_${i}`)||yr.haendlerDirektHek||0;
      const hdU=pfId(`um_hdirektUvp_${i}`)||yr.haendlerDirektUvp||0;
      const hdFw=pfId(`um_haendlerFreiwareHek_${i}`)||yr.haendlerFreiwareHek||0;
      const hdB=hdMode==='hek'?hdH:hdU;
      let hdDirNet; if(hdMode==='hek'){hdDirNet=hdB*(1-hN);}else{hdDirNet=hdB*(1-hN)/(1+steuer);}
      const hdFwNet=hdFw*(1-hFR); const hdBasis=hdDirNet+hdFwNet;
      const hdNt=hdBasis*(1-hE); let hdCos; if(hdMode==='hek'){hdCos=(hdB+hdFw)/hek;}else{hdCos=hdB/uvp+hdFw/hek;}
      const hdD=hdNt-hdCos;
      const hiH=pfId(`um_hindirektHek_${i}`)||yr.haendlerIndirektHek||0;
      const hiU=pfId(`um_hindirektUvp_${i}`)||yr.haendlerIndirektUvp||0;
      const hiB=hdMode==='hek'?hiH:hiU;
      let hiNt,hiD;
      if(hdMode==='hek'){hiNt=hiB*(1-hN)*(1-hE);hiD=hiNt-hiB/hek;}
      else{const hiNR=hiB*(1-hN)/(1+steuer);hiNt=hiNR*(1-hE);hiD=hiNt-hiB/uvp;}
      const so=(pfId(`um_marketing_${i}`)||yr.marketingkosten||0)+(pfId(`um_logistik_${i}`)||yr.logistikkosten||0)+(pfId(`um_sonstige_${i}`)||yr.sonstigeKosten||0);
      tN+=vNt+hdNt+hiNt; tI+=spI+so; tD+=vD+hdD+hiD-spI-so;
    }
    opUpdateSticky(tN, tI, tD, tN>0?tD/tN:0);
    // Refresh all umsatz previews so kondition changes are reflected immediately
    const yn=state.years.length||3;
    for(let j=0;j<yn;j++) updateUmsatzPreview(j);
  } catch(e){}
});

function opRefreshLive(){
  document.dispatchEvent(new Event('input'));
}

// Override renderResult to work with op-result container
const _origRenderResult = renderResult;
// renderResult is already defined in app.js and writes to #resultContent / #step6
// We redirect step6 show to opResult show instead
const _origShowStep6 = () => {};

// Patch: after renderResult runs, hide step6, show opResult
const __origRender = window.renderResult;
</script>
</body>
</html>
<script>
// Override exportPDF: print only #resultContent
window.exportPDF = function() {
  const slug = s => (s||'').trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-äöüß]/g,'').replace(/--+/g,'-');
  const verein = slug(state.vereinName) || 'verein';
  const verdict = (window._lastTotals && window._lastTotals.db >= 0) ? 'good' : 'bad';
  const prev = document.title;
  document.title = `uhlsport-ausruestungsvertrag_${verein}_${verdict}`;
  document.body.classList.add('printing-result');
  window.print();
  document.body.classList.remove('printing-result');
  document.title = prev;
};

// Patch renderResult: suppress step6 show + scroll-to-top, use opResult instead
(function(){
  const _orig = renderResult;
  window.renderResult = function(results, tN, tI, tD, tQ) {
    // Suppress the scroll-to-top that renderResult fires (we handle scrolling ourselves)
    const _scrollTo = window.scrollTo.bind(window);
    window.scrollTo = () => {};
    _orig(results, tN, tI, tD, tQ);
    window.scrollTo = _scrollTo;
    // Hide step6, it's not used in one-page mode
    document.getElementById('step6').style.display = 'none';
  };
  // Also suppress the live-bar (we use sticky bar instead)
  document.getElementById('liveBar') && (document.getElementById('liveBar').style.display = 'none');
})();

// Re-measure open sections when year UIs rebuild
function rebuildYearUI() {
  buildSponsoringUI();
  buildUmsatzUI();
  [4,5].forEach(i => {
    const sec = document.getElementById('sec'+i);
    const body = document.getElementById('sec'+i+'-body');
    if (sec && body && !sec.classList.contains('collapsed')) {
      body.style.maxHeight = 'none';
    }
  });
}
</script>

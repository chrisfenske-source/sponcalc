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
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/phpmailer/Exception.php';
require_once __DIR__ . '/phpmailer/SMTP.php';
require_once __DIR__ . '/phpmailer/PHPMailer.php';

header('Content-Type: application/json; charset=utf-8');

// Only accept POST with JSON body
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed.']);
    exit;
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (strpos($contentType, 'application/json') === false) {
    http_response_code(415);
    echo json_encode(['ok' => false, 'error' => 'Content-Type must be application/json.']);
    exit;
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data || !isset($data['html']) || !isset($data['recipients'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Ungültige Anfrage.']);
    exit;
}

$recipients = array_values(array_filter(array_map('trim', $data['recipients'])));
if (empty($recipients)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Keine Empfänger angegeben.']);
    exit;
}

// Validate email addresses
foreach ($recipients as $addr) {
    if (!filter_var($addr, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Ungültige E-Mail-Adresse: ' . htmlspecialchars($addr)]);
        exit;
    }
}

$subject   = isset($data['subject']) ? trim($data['subject']) : 'Ausrüstungsvertrag Kalkulation';
$html_body = $data['html'];

// Send via PHPMailer
$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host      = SMTP_HOST;
    $mail->SMTPAuth  = true;
    $mail->Username  = SMTP_USER;
    $mail->Password  = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port      = SMTP_PORT;
    $mail->CharSet   = 'UTF-8';
    $mail->Encoding  = 'base64';
    $mail->Timeout   = 30;

    $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
    $mail->addReplyTo(SMTP_FROM, SMTP_FROM_NAME);

    foreach ($recipients as $addr) {
        $mail->addAddress($addr);
    }
    $mail->addBCC(BCC_FIXED);

    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body    = $html_body;
    $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $html_body));

    $mail->send();
    echo json_encode(['ok' => true, 'message' => 'E-Mail gesendet an: ' . implode(', ', $recipients)]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Mailer-Fehler: ' . $mail->ErrorInfo]);
}

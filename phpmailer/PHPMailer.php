<?php
namespace PHPMailer\PHPMailer;

class PHPMailer
{
    const VERSION       = '6.9.1';
    const CHARSET_UTF8  = 'UTF-8';
    const CONTENT_TYPE_TEXT_HTML = 'text/html';
    const ENCODING_BASE64 = 'base64';
    const ENCRYPTION_STARTTLS = 'tls';
    const ENCRYPTION_SMTPS    = 'ssl';

    public bool   $isSMTP_set  = false;
    public string $Host        = 'localhost';
    public bool   $SMTPAuth    = false;
    public string $Username    = '';
    public string $Password    = '';
    public string $SMTPSecure  = '';
    public bool   $SMTPAutoTLS = true;
    public int    $Port        = 25;
    public string $From        = '';
    public string $FromName    = '';
    public string $CharSet     = self::CHARSET_UTF8;
    public string $ContentType = self::CONTENT_TYPE_TEXT_HTML;
    public string $Encoding    = self::ENCODING_BASE64;
    public string $Subject     = '';
    public string $Body        = '';
    public string $AltBody     = '';
    public int    $SMTPDebug   = 0;
    public        $Debugoutput = 'echo';
    public array  $SMTPOptions = [];
    public int    $Timeout     = 300;
    public string $XMailer     = '';
    public string $ErrorInfo   = '';
    public bool   $exceptions  = false;

    protected array $to         = [];
    protected array $cc         = [];
    protected array $bcc        = [];
    protected array $ReplyTo    = [];
    protected ?SMTP $smtp       = null;

    public function __construct(bool $exceptions = false)
    {
        $this->exceptions = $exceptions;
    }

    public function isSMTP(): void { $this->isSMTP_set = true; }
    public function isHTML(bool $isHtml = true): void
    {
        $this->ContentType = $isHtml ? self::CONTENT_TYPE_TEXT_HTML : 'text/plain';
    }

    public function addAddress(string $address, string $name = ''): bool
    {
        return $this->addOrEnqueueAnAddress('to', $address, $name);
    }
    public function addCC(string $address, string $name = ''): bool
    {
        return $this->addOrEnqueueAnAddress('cc', $address, $name);
    }
    public function addBCC(string $address, string $name = ''): bool
    {
        return $this->addOrEnqueueAnAddress('bcc', $address, $name);
    }
    public function addReplyTo(string $address, string $name = ''): bool
    {
        return $this->addOrEnqueueAnAddress('ReplyTo', $address, $name);
    }

    protected function addOrEnqueueAnAddress(string $kind, string $address, string $name): bool
    {
        $address = trim($address);
        $name    = trim($name);
        if (!filter_var($address, FILTER_VALIDATE_EMAIL)) {
            $this->setError("Invalid address: $address");
            return false;
        }
        $this->{$kind}[] = [$address, $name];
        return true;
    }

    public function clearAddresses(): void  { $this->to  = []; }
    public function clearCCs(): void        { $this->cc  = []; }
    public function clearBCCs(): void       { $this->bcc = []; }
    public function clearAllRecipients(): void { $this->to = $this->cc = $this->bcc = []; }

    public function send(): bool
    {
        $this->ErrorInfo = '';
        try {
            if (!$this->preSend()) { return false; }
            return $this->postSend();
        } catch (Exception $e) {
            $this->ErrorInfo = $e->getMessage();
            return false;
        }
    }

    protected function preSend(): bool
    {
        if (empty($this->From)) { $this->setError('From address not set'); return false; }
        if (empty($this->to) && empty($this->cc) && empty($this->bcc)) {
            $this->setError('No recipients'); return false;
        }
        return true;
    }

    protected function postSend(): bool
    {
        return $this->smtpSend($this->createMessage());
    }

    protected function createMessage(): string
    {
        $from_enc = $this->encodeHeader($this->FromName);
        $subj_enc = $this->encodeHeader($this->Subject);
        $date     = date('r');
        $msg_id   = '<' . uniqid('pm', true) . '@' . (explode('@', $this->From)[1] ?? 'localhost') . '>';

        $to_list = implode(', ', array_map(fn($r) => empty($r[1]) ? $r[0] : "{$r[1]} <{$r[0]}>", $this->to));

        $msg  = "Date: $date\r\n";
        $msg .= "From: $from_enc <{$this->From}>\r\n";
        $msg .= "To: $to_list\r\n";
        foreach ($this->cc as $r)  { $msg .= "CC: {$r[0]}\r\n"; }
        foreach ($this->bcc as $r) { $msg .= "BCC: {$r[0]}\r\n"; }
        foreach ($this->ReplyTo as $r) { $msg .= "Reply-To: {$r[0]}\r\n"; }
        $msg .= "Subject: $subj_enc\r\n";
        $msg .= "Message-ID: $msg_id\r\n";
        $msg .= "MIME-Version: 1.0\r\n";
        $msg .= "Content-Type: {$this->ContentType}; charset={$this->CharSet}\r\n";
        $msg .= "Content-Transfer-Encoding: {$this->Encoding}\r\n";
        if ($this->XMailer) { $msg .= "X-Mailer: {$this->XMailer}\r\n"; }
        $msg .= "\r\n";
        $msg .= chunk_split(base64_encode($this->Body));
        return $msg;
    }

    protected function encodeHeader(string $str): string
    {
        if (preg_match('/[\x80-\xFF]/', $str)) {
            return '=?UTF-8?B?' . base64_encode($str) . '?=';
        }
        return $str;
    }

    protected function smtpSend(string $header): bool
    {
        $bad_rcpt = [];
        if (!$this->smtpConnect($this->SMTPOptions)) {
            throw new Exception('Could not connect to SMTP host: ' . $this->ErrorInfo);
        }
        $smtp_from = $this->From;
        if (!$this->smtp->mail($smtp_from)) {
            $this->setError('SMTP Error: ' . implode(', ', array_column($this->smtp->errors, 'message')));
            return false;
        }
        foreach (array_merge($this->to, $this->cc, $this->bcc) as $rcpt) {
            if (!$this->smtp->recipient($rcpt[0])) {
                $bad_rcpt[] = $rcpt[0];
            }
        }
        if (!empty($bad_rcpt) && count($bad_rcpt) === count(array_merge($this->to, $this->cc, $this->bcc))) {
            throw new Exception('All RCPT failed: ' . implode(', ', $bad_rcpt));
        }
        if (!$this->smtp->data($header)) {
            throw new Exception('SMTP data error: ' . $this->smtp->getLastReply());
        }
        $this->smtp->quit();
        return true;
    }

    public function smtpConnect(array $options = []): bool
    {
        if ($this->smtp === null) {
            $this->smtp = $this->getSMTPInstance();
        }
        if ($this->smtp->connected()) { return true; }

        $this->smtp->setDebugLevel($this->SMTPDebug);
        $this->smtp->setDebugOutput($this->Debugoutput);
        $this->smtp->setTimeout($this->Timeout);

        $hosts = explode(';', $this->Host);
        foreach ($hosts as $hostentry) {
            $hostinfo = [];
            $host     = trim($hostentry);
            $prefix   = '';
            $secure   = $this->SMTPSecure;
            $tls      = ($secure === self::ENCRYPTION_STARTTLS);

            if (preg_match('/^(ssl|tls):\/\/(.+)$/', $host, $hostinfo)) {
                $prefix = $hostinfo[1];
                $secure = $prefix;
                $host   = $hostinfo[2];
                $tls    = ($secure === self::ENCRYPTION_STARTTLS);
            }

            $sslext = defined('OPENSSL_ALGO_SHA256');
            if (!$sslext && in_array($secure, [self::ENCRYPTION_STARTTLS, self::ENCRYPTION_SMTPS])) {
                throw new Exception('SSL/TLS not supported; install OpenSSL extension');
            }

            $port = $this->Port;
            $tport = strstr($host, ':');
            if ($tport !== false) {
                [$host, $port] = explode(':', $host, 2);
                $port = (int)$port;
            }

            $stream_ctx = stream_context_create($options);
            if ($secure === self::ENCRYPTION_SMTPS) {
                $host = 'ssl://' . $host;
            }
            if (!$this->smtp->connect($host, $port, $this->Timeout, $options)) {
                continue;
            }
            if ($this->SMTPAutoTLS && !$tls) {
                $tls = (bool)$this->smtp->getServerExt('STARTTLS');
            }
            if (!$this->smtp->hello(gethostname() ?: 'localhost')) { continue; }
            if ($tls) {
                if (!$this->smtp->startTLS()) {
                    throw new Exception('StartTLS failed');
                }
                if (!$this->smtp->hello(gethostname() ?: 'localhost')) { continue; }
            }
            if ($this->SMTPAuth && !$this->smtp->authenticate($this->Username, $this->Password)) {
                throw new Exception('SMTP auth failed: ' . implode(', ', array_column($this->smtp->errors, 'message')));
            }
            return true;
        }
        $this->setError('Could not connect to any SMTP host');
        return false;
    }

    public function getSMTPInstance(): SMTP { return new SMTP(); }
    public function setSMTPInstance(SMTP $smtp): void { $this->smtp = $smtp; }

    protected function setError(string $message): void
    {
        $this->ErrorInfo = $message;
        if ($this->exceptions) { throw new Exception($message); }
    }

    public function getLastMessageID(): string { return ''; }
}

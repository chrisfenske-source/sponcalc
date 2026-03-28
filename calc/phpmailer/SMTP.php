<?php
namespace PHPMailer\PHPMailer;

class SMTP
{
    const VERSION       = '6.9.1';
    const LE            = "\r\n";
    const DEFAULT_PORT  = 25;
    const MAX_LINE_LENGTH = 998;
    const DEBUG_OFF     = 0;
    const DEBUG_CLIENT  = 1;
    const DEBUG_SERVER  = 2;
    const DEBUG_LOWLEVEL= 4;

    public int   $do_debug   = self::DEBUG_OFF;
    public       $Debugoutput = 'echo';
    public bool  $do_verp    = false;
    public int   $Timeout    = 300;
    public int   $Timelimit  = 300;
    public array $server_caps = [];
    public array $errors      = [];
    public string $last_reply = '';

    protected mixed $smtp_conn = false;

    public function connect(string $host, int $port = 0, int $timeout = 30, array $options = []): bool
    {
        $this->errors = [];
        if ($this->connected()) { $this->addError('Already connected'); return false; }
        if ($port < 1 || $port > 65535) { $port = self::DEFAULT_PORT; }
        $addr = $host;
        if (filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) { $addr = "[$host]"; }
        $errno  = 0;
        $errstr = '';
        $this->smtp_conn = @stream_socket_client(
            $host . ':' . $port,
            $errno, $errstr,
            $timeout,
            STREAM_CLIENT_CONNECT,
            stream_context_create($options)
        );
        if (!$this->smtp_conn) {
            $this->addError('Failed to connect: ' . $errstr, $errno);
            return false;
        }
        stream_set_timeout($this->smtp_conn, $timeout, 0);
        $announce = $this->get_lines();
        $this->edebug('SERVER -> CLIENT: ' . $announce, self::DEBUG_SERVER);
        return true;
    }

    public function startTLS(): bool
    {
        if (!$this->sendCommand('STARTTLS', 'STARTTLS', 220)) { return false; }
        $crypto = STREAM_CRYPTO_METHOD_SSLv23_CLIENT
            | STREAM_CRYPTO_METHOD_TLS_CLIENT
            | STREAM_CRYPTO_METHOD_TLSv1_1_CLIENT
            | STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT;
        set_error_handler([$this, 'errorHandler']);
        $crypto_ok = stream_socket_enable_crypto($this->smtp_conn, true, $crypto);
        restore_error_handler();
        return (bool)$crypto_ok;
    }

    public function authenticate(string $username, string $password, string $authtype = '', string $OAuth = ''): bool
    {
        if (!$this->server_caps) { $this->setError('Authentication is not allowed before HELO/EHLO'); return false; }
        if (array_key_exists('EHLO', $this->server_caps)) {
            $this->hello(gethostname() ?: 'localhost');
        }
        $authtype = strtoupper($authtype ?: 'LOGIN');
        if ($authtype === 'LOGIN') {
            if (!$this->sendCommand('AUTH', 'AUTH LOGIN', 334)) { return false; }
            if (!$this->sendCommand('User', base64_encode($username), 334)) { return false; }
            if (!$this->sendCommand('Password', base64_encode($password), 235)) { return false; }
        } elseif ($authtype === 'PLAIN') {
            if (!$this->sendCommand('AUTH PLAIN', 'AUTH PLAIN ' . base64_encode("\0$username\0$password"), 235)) { return false; }
        } elseif ($authtype === 'XOAUTH2') {
            if (!$this->sendCommand('AUTH', 'AUTH XOAUTH2 ' . base64_encode($OAuth), 235)) { return false; }
        } else {
            $this->setError("Unknown auth type: $authtype"); return false;
        }
        return true;
    }

    public function hello(string $host = ''): bool
    {
        return $this->sendHello('EHLO', $host) || $this->sendHello('HELO', $host);
    }

    protected function sendHello(string $hello, string $host): bool
    {
        $noerror = $this->sendCommand($hello, $hello . ' ' . $host, 250);
        $this->server_caps = [];
        if ($noerror) {
            $lines = explode("\n", $this->last_reply);
            foreach ($lines as $line) {
                $line = trim($line);
                if (preg_match('/^[0-9]+-(.*)$/', $line, $m)) {
                    $parts = explode(' ', $m[1], 2);
                    $this->server_caps[strtoupper($parts[0])] = $parts[1] ?? true;
                }
            }
        }
        return $noerror;
    }

    public function mail(string $from): bool
    {
        $useVerp = ($this->do_verp ? ' XVERP' : '');
        return $this->sendCommand('MAIL FROM', "MAIL FROM:<$from>$useVerp", 250);
    }

    public function recipient(string $address, string $dsn = ''): bool
    {
        $rcpt = empty($dsn) ? "RCPT TO:<$address>" : "RCPT TO:<$address> $dsn";
        return $this->sendCommand('RCPT TO', $rcpt, [250, 251]);
    }

    public function data(string $msg_data): bool
    {
        if (!$this->sendCommand('DATA', 'DATA', 354)) { return false; }
        $lines      = explode("\n", str_replace(["\r\n", "\r"], "\n", $msg_data));
        $field      = substr($lines[0], 0, strpos($lines[0], ':'));
        $in_headers = !empty($field) && !str_contains($field, ' ');
        foreach ($lines as $line) {
            if ($in_headers && empty($line)) { $in_headers = false; }
            if (!$in_headers && str_starts_with($line, '.')) { $line = '.' . $line; }
            if (strlen($line) > self::MAX_LINE_LENGTH) {
                $line = wordwrap($line, self::MAX_LINE_LENGTH, "\n", true);
            }
            fwrite($this->smtp_conn, $line . self::LE);
        }
        return $this->sendCommand('EOM', '.', 250);
    }

    public function quit(bool $close_on_error = true): bool
    {
        $noerror = $this->sendCommand('QUIT', 'QUIT', 221);
        if ($noerror || $close_on_error) { $this->close(); }
        return $noerror;
    }

    public function close(): void
    {
        $this->server_caps = [];
        if (is_resource($this->smtp_conn)) {
            fclose($this->smtp_conn);
            $this->smtp_conn = false;
        }
    }

    public function connected(): bool
    {
        if (!is_resource($this->smtp_conn)) { return false; }
        $info = stream_get_meta_data($this->smtp_conn);
        return !$info['eof'];
    }

    public function getServerExt(string $name): bool|string
    {
        return $this->server_caps[$name] ?? false;
    }

    protected function sendCommand(string $command, string $commandstring, int|array $expect): bool
    {
        if (!$this->connected()) { $this->addError("$command: Not connected"); return false; }
        $this->edebug("CLIENT -> SERVER: $commandstring", self::DEBUG_CLIENT);
        fwrite($this->smtp_conn, $commandstring . self::LE);
        $this->last_reply = $this->get_lines();
        $this->edebug("SERVER -> CLIENT: {$this->last_reply}", self::DEBUG_SERVER);
        $code = (int)substr($this->last_reply, 0, 3);
        if (!in_array($code, (array)$expect)) {
            $this->setError("$command: Wrong reply: {$this->last_reply}");
            return false;
        }
        return true;
    }

    protected function get_lines(): string
    {
        if (!is_resource($this->smtp_conn)) { return ''; }
        $data = '';
        $endtime = time() + $this->Timelimit;
        stream_set_timeout($this->smtp_conn, $this->Timeout);
        while (is_resource($this->smtp_conn) && !feof($this->smtp_conn)) {
            $str = fgets($this->smtp_conn, 515);
            if ($str === false) { break; }
            $data .= $str;
            if (strlen($str) < 4 || $str[3] === ' ') { break; }
            $info = stream_get_meta_data($this->smtp_conn);
            if ($info['timed_out'] || time() > $endtime) { break; }
        }
        return $data;
    }

    protected function setError(string $message, string $detail = '', string $smtp_code = '', string $smtp_code_ex = ''): void
    {
        $this->errors[] = compact('message', 'detail', 'smtp_code', 'smtp_code_ex');
    }

    protected function addError(string $message, int $code = 0): void
    {
        $this->errors[] = ['message' => $message, 'code' => $code];
    }

    protected function edebug(string $str, int $level = 0): void
    {
        if ($level > $this->do_debug) { return; }
        if (is_callable($this->Debugoutput) && !is_string($this->Debugoutput)) {
            call_user_func($this->Debugoutput, $str, $level);
        } elseif ($this->Debugoutput === 'error_log') {
            error_log($str);
        } else {
            echo gmdate('Y-m-d H:i:s') . ' ' . $str . "\n";
        }
    }

    public function errorHandler(int $errno, string $errmsg): void
    {
        $this->addError($errmsg, $errno);
    }

    public function getLastReply(): string { return $this->last_reply; }
    public function getDebugOutput(): mixed { return $this->Debugoutput; }
    public function setDebugOutput(mixed $method): void { $this->Debugoutput = $method; }
    public function getDebugLevel(): int { return $this->do_debug; }
    public function setDebugLevel(int $level): void { $this->do_debug = $level; }
    public function getTimeout(): int { return $this->Timeout; }
    public function setTimeout(int $timeout): void { $this->Timeout = $timeout; }
}

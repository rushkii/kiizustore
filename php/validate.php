<?php

namespace kiizustore;

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

class Validate
{
    private static $hash = '';

    private static function convertInitData(string $initData): string {
        $initDataArray = explode('&', rawurldecode($initData));
        $needle        = 'hash=';

        foreach ($initDataArray as &$data) {
            if (substr($data, 0, \strlen($needle)) === $needle) {
                self::$hash = substr_replace($data, '', 0, \strlen($needle));
                $data       = null;
            }
        }
        $initDataArray = array_filter($initDataArray);
        sort($initDataArray);

        return implode("\n", $initDataArray);
    }

    public static function isSafe(string $initData): bool {
        $secretKey = hash_hmac('sha256', getenv("BOT_TOKEN"), 'WebAppData', true);
        $hash      = bin2hex(hash_hmac('sha256', self::convertInitData($initData), $secretKey, true));

        return strcmp($hash, self::$hash) === 0;
    }
}
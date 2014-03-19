<?php


function debugStop($pText = null)
{
    debugPrint($pText, true);
}

function convertSize($pSize)
{
    $units = array('b', 'kb', 'mb', 'gb', 'tb', 'pb');

    return @round($pSize / pow(1024, ($i = floor(log($pSize, 1024)))), 2) . $units[$i];
}

$_start = microtime(true); $_lastDebugPoint = 0;
function debugPrint($pText = null, $pStop = null)
{
    return;
    global $_start, $_lastDebugPoint;
    $timeUsed = round((microtime(true) - $_start) * 1000, 2);
    $bytes = convertSize(memory_get_usage(true));
    $last = $_lastDebugPoint ? '(' . round((microtime(true) - $_lastDebugPoint) * 1000, 2) . 'ms)' : '';
    $text = is_string($pText) ? "\t(" . $pText . ')' : '';
    print "$bytes\t{$timeUsed}ms\t$last$text\n";
    $_lastDebugPoint = microtime(true);
    if ($pStop === true) {
        exit;
    }
}
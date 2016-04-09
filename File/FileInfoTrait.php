<?php
/**
 * This file is part of Jarves.
 *
 * (c) Marc J. Schmidt <marc@marcjschmidt.de>
 *
 *     J.A.R.V.E.S - Just A Rather Very Easy [content management] System.
 *
 *     http://jarves.io
 *
 * To get the full copyright and license information, please view the
 * LICENSE file, that was distributed with this source code.
 */

namespace Jarves\File;

trait FileInfoTrait {

    public function getName()
    {
        return basename($this->getPath()) ?: '/';
    }

    public function getDir()
    {
        return dirname($this->getPath()) ?: '/';
    }

    public function isDir()
    {
        return 'file' !== $this->getType();
    }

    public function isFile()
    {
        return 'file' === $this->getType();
    }

    public function getIcon()
    {
        return '';
    }

    public function isMountPoint()
    {
        return false;
    }

    public function getMimeType()
    {
        $mime_types = array(
            'txt' => 'text/plain',
            'htm' => 'text/html',
            'html' => 'text/html',
            'php' => 'text/html',
            'css' => 'text/css',
            'js' => 'application/javascript',
            'json' => 'application/json',
            'xml' => 'application/xml',
            'swf' => 'application/x-shockwave-flash',
            'flv' => 'video/x-flv',
            'png' => 'image/png',
            'jpe' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'jpg' => 'image/jpeg',
            'gif' => 'image/gif',
            'bmp' => 'image/bmp',
            'tiff' => 'image/tiff',
            'tif' => 'image/tiff',
            'svg' => 'image/svg+xml',
            'svgz' => 'image/svg+xml',
            'zip' => 'application/zip',
            'rar' => 'application/x-rar-compressed',
            'cab' => 'application/vnd.ms-cab-compressed',
            'mp3' => 'audio/mpeg',
            'qt' => 'video/quicktime',
            'mov' => 'video/quicktime',
            'ppt' => 'application/vnd.ms-powerpoint',
            'pdf' => 'application/pdf',
            'psd' => 'image/vnd.adobe.photoshop',
            'ai' => 'application/postscript',
            'ods' => 'application/vnd.oasis.opendocument.spreadsheet',
            'eps' => 'application/postscript',
            'ps' => 'application/postscript',
            'rtf' => 'application/rtf',
            'exe' => 'application/x-msdownload',
            'msi' => 'application/x-msdownload',
            'xls' => 'application/vnd.ms-excel',
            'doc' => 'application/msword',
            'odt' => 'application/vnd.oasis.opendocument.text',
            'ico' => 'image/vnd.microsoft.icon',
        );

        $path = $this->getExtension();
        if (isset($mime_types[$path])) {
            return $mime_types[$path];
        }
        return null;
    }

    public function getExtension()
    {
        $lastDot = strrpos($this->getName(), '.');
        return false === $lastDot ? null : strtolower(substr($this->getName(), $lastDot + 1));
    }

}
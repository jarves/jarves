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

interface FileInfoInterface {

    public function getName();
    public function getPath();
    public function getDir();
    public function getType();
    public function getIcon();

    public function isMountPoint();

    public function isDir();
    public function isFile();

    public function getCreatedTime();
    public function getModifiedTime();
    public function getMimeType();

    /**
     * @return array
     */
    public function toArray();

}
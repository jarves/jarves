<?php

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
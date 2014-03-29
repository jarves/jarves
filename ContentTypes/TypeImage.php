<?php

namespace Jarves\ContentTypes;

use Jarves\Jarves;

class TypeImage extends AbstractType
{
    /**
     * @var Jarves
     */
    protected $jarves;

    function __construct($jarves)
    {
        $this->jarves = $jarves;
    }

    public function render()
    {
        if ($this->getContent()->getContent()) {
            $info = json_decode($this->getContent()->getContent(), true);
            if (isset($info['file'])) {
                $path = substr(is_numeric($info['file']) ? $this->jarves->getWebFileSystem()->getPath($info['file']) : $info['file'], 1);
                $width = $info['width'] ?: '100%';
                $class = 'jarves-contentType-image align-' . (@$info['align'] ?: 'center');
                return sprintf('<div class="%s"><img src="%s" width="%s"/></div>', $class, $path, $width);
            }
        }
    }
}
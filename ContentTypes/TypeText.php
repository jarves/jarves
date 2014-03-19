<?php

namespace Jarves\ContentTypes;

class TypeText extends AbstractType
{
    public function render()
    {
        return $this->getContent()->getContent();
    }

}
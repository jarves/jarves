<?php

namespace Jarves\Twig;

use Jarves\Jarves;

class ContentExtension extends \Twig_Extension
{
    public function getTokenParsers()
    {
        return array(new TokenParser\Content('content'), new TokenParser\Content('contents'));
    }

    public function getName()
    {
        return 'content';
    }

}
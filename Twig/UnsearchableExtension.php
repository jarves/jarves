<?php

namespace Jarves\Twig;

class UnsearchableExtension extends \Twig_Extension
{
    public function getName()
    {
        return 'unsearchable';
    }

    public function getTokenParsers()
    {
        return array(new TokenParser\Unsearchable());
    }
}
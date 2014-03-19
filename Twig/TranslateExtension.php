<?php

namespace Jarves\Twig;

use Jarves\Jarves;

class TranslateExtension extends \Twig_Extension
{
    /**
     * @var \Jarves\Translation\TranslationInterface
     */
    protected $translator;

    function __construct($translator)
    {
        $this->translator = $translator;
    }

    public function getName()
    {
        return 'translate';
    }

    public function getFunctions()
    {
        return array(
            't' => new \Twig_Function_Method($this, 't'),
            'tc' => new \Twig_Function_Method($this, 'tc')
        );
    }

    public function t($t, $plural = '', $count = 0)
    {
        return $this->translator->t($t, $plural, $count);
    }

    public function tc($context, $t, $plural = '', $count = 0)
    {
        return $this->translator->tc($context, $t, $plural, $count);
    }

}
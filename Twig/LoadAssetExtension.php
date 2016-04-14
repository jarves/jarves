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

namespace Jarves\Twig;

use Jarves\Jarves;
use Jarves\Model\Node;
use Jarves\PageStack;

class LoadAssetExtension extends \Twig_Extension
{
    /**
     * @var PageStack
     */
    private $pageStack;

    /**
     * @param PageStack $pageStack
     */
    function __construct(PageStack $pageStack)
    {
        $this->pageStack = $pageStack;
    }

    public function getName()
    {
        return 'loadAsset';
    }

    public function getFunctions()
    {
        return array(
            new \Twig_SimpleFunction('loadAsset', [$this, 'loadAsset']),
            new \Twig_SimpleFunction('loadAssetAtBottom', [$this, 'loadAssetAtBottom'])
        );
    }

    public function loadAsset($asset, $contentType = null)
    {
        $this->pageStack->getPageResponse()->loadAssetFile($asset, $contentType);
    }

    public function loadAssetAtBottom($asset, $contentType = null)
    {
        $this->pageStack->getPageResponse()->loadAssetFileAtBottom($asset, $contentType);
    }

}
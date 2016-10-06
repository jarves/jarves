<?php

namespace Jarves\Controller;

use Jarves\PageResponseFactory;

/**
 * This class provides a simple showAction method you can use to define a static page via Symfony's routing.yml
 *
 * Example:
 *
 *   my_bundle_contact:
 *     path:     /contact
 *     defaults: { _controller: jarves.controller.static:showAction }
 *     options: { theme: 'mybundle', layout: 'contact', title: 'Contact' }
 *
 * It's mandatory to prove theme and layout options.
 *
 * @author Marc J. Schmidt <marc@marcjschmidt.de>
 */
class StaticController
{
    /**
     * @var PageResponseFactory
     */
    private $pageResponseFactory;

    public function __construct(PageResponseFactory $pageResponseFactory)
    {
        $this->pageResponseFactory = $pageResponseFactory;
    }

    public function showAction()
    {
        return $this->pageResponseFactory->createFromRoute();
    }
}

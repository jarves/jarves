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

namespace Jarves;

use Symfony\Component\HttpFoundation\RequestStack;

class EditMode
{
    /**
     * @var RequestStack
     */
    private $requestStack;

    /**
     * @var ACL
     */
    private $acl;

    /**
     * @var PageStack
     */
    private $pageStack;

    /**
     * @param PageStack $pageStack
     * @param RequestStack $requestStack
     * @param ACL $acl
     */
    function __construct(PageStack $pageStack, RequestStack $requestStack, ACL $acl)
    {
        $this->requestStack = $requestStack;
        $this->acl = $acl;
        $this->pageStack = $pageStack;
    }

    /**
     * @param int|null $nodeId
     *
     * @return bool
     */
    public function isEditMode($nodeId = null)
    {
        $request = $this->requestStack->getMasterRequest();
        $hasRequest = !!$request;

        if ($nodeId) {
            return $hasRequest
            && 1 == $request->get('_jarves_editor')
            && $this->acl->isUpdatable('jarves/node', ['id' => $nodeId]);
        }

        return $hasRequest && 1 == $request->get('_jarves_editor')
        && $this->pageStack->getCurrentPage()
        && $this->acl->isUpdatable('jarves/node', ['id' => $this->pageStack->getCurrentPage()->getId()]);
    }

}
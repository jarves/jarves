<?php

/*
 * This file is part of Jarves cms.
 *
 * (c) Marc J. Schmidt <marc@jarves.io>
 *
 * To get the full copyright and license informations, please view the
 * LICENSE file, that was distributed with this source code.
 *
 */

namespace Jarves\Controller\Admin;

use FOS\RestBundle\Request\ParamFetcher;
use Jarves\Jarves;
use Jarves\Model\Content;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use FOS\RestBundle\Controller\Annotations as Rest;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;

class AdminController extends Controller
{
    protected $utils;

    /**
     * @return Jarves
     */
    protected function getJarves()
    {
        return $this->get('jarves');
    }

    /**
     * @return \Jarves\Admin\Utils
     */
    protected function getUtils()
    {
        if (null === $this->utils) {
            $this->utils = new \Jarves\Admin\Utils($this->getJarves());
        }

        return $this->utils;
    }

    /**
     * @ApiDoc(
     *  section="Administration",
     *  description="Returns a layout template/view with placeholder for jarves.Editor."
     * )
     *
     * @Rest\QueryParam(name="template", requirements=".+", strict=true, description="The template/view to be used for this content")
     * @Rest\QueryParam(name="type", requirements=".+", strict=true, description="The content type")
     *
     * @Rest\Get("/admin/content/template")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return array
     */
    public function getInlineEditorAction()
    {

    }

    /**
     * @ApiDoc(
     *  section="Administration",
     *  description="Returns a content template/view with placeholder for jarves.Editor."
     * )
     *
     * @Rest\QueryParam(name="template", requirements=".+", strict=true, description="The template/view to be used for this content")
     * @Rest\QueryParam(name="type", requirements=".+", strict=true, description="The content type")
     *
     * @Rest\Get("/admin/content/template")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return array
     */
    public function getContentTemplateAction(ParamFetcher $paramFetcher)
    {
        $template = $paramFetcher->get('template');
        $type = $paramFetcher->get('type');

        //todo, check if $template is defined as content template

        $contentObject = new Content();
        $contentObject->setType($type);
        $contentObject->setTemplate($template);
        $contentObject->setContent('');

        $data = [
            'html' => '<div class="jarves-content-container"></div>',
            'content' => $contentObject,
            'type' => $type
        ];

        return $this->renderView($template, $data);
    }

    /**
     * @ApiDoc(
     *  section="Administration",
     *  description="Returns a renderer content element as preview for jarves.Editor"
     * )
     *
     * @Rest\QueryParam(name="template", requirements=".+", strict=true,
     *      description="The template/view to be used for this content")
     *
     * @Rest\QueryParam(name="type", requirements=".+", strict=true, description="The content type")
     *
     * @Rest\QueryParam(name="nodeId", requirements="[0-9]+",
     *      description="The node id in which context this content should be rendered")
     * @Rest\QueryParam(name="domainId", requirements="[0-9]+",
     *      description="The domain id in which context this content should be rendered")
     * @Rest\RequestParam(name="content", requirements=".*", description="The actual content")
     *
     * @Rest\Post("/admin/content/preview")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return array
     */
    public function getContentPreviewAction(ParamFetcher $paramFetcher)
    {
        $template = $paramFetcher->get('template');
        $type = $paramFetcher->get('type');
        $content = $paramFetcher->get('content');
        $nodeId = $paramFetcher->get('nodeId');
        $domainId = $paramFetcher->get('domainId');

        //todo, check if $template is defined as content template

        $contentObject = new Content();
        $contentObject->setType($type);
        $contentObject->setTemplate($template);
        $contentObject->setContent($content);

        if ($domainId) {
            $domain = $this->getJarves()->getUtils()->getDomain($domainId);
            $this->getJarves()->setCurrentDomain($domain);
        }

        if ($nodeId) {
            $page = $this->getJarves()->getUtils()->getPage($nodeId);
            $this->getJarves()->setCurrentPage($page);
        }

        $render = $this->getJarves()->getContentRender();

        return $render->renderContent($contentObject);
    }

    /**
     * @ApiDoc(
     *  section="Administration",
     *  description="Logs in a user to the current session"
     * )
     *
     * Result on success:
     * {
     *    token: "c7405b2be7da96b0db784f2dc8b2b974",
     *    userId: 1,
     *    username: "admin",
     *    access: true, #administration access
     *    firstName: "Admini",
     *    lastName: "strator",
     *    emailMd5: <emailAsMd5>, //for gravatar
     *    imagePath: "/path/to/image.jpg"
     *}
     *
     * @Rest\RequestParam(name="username", requirements=".+", strict=true)
     * @Rest\RequestParam(name="password", requirements=".+", strict=true)
     *
     * @Rest\Post("/admin/login")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return array|bool Returns false on failure or a array if successful.
     */
    public function loginUserAction(ParamFetcher $paramFetcher)
    {
        $username = $paramFetcher->get('username');
        $password = $paramFetcher->get('password');
        $status = $this->getJarves()->getAdminClient()->login($username, $password);

        if ($this->getJarves()->getAdminClient()->getUser()) {
            $lastLogin = $this->getJarves()->getAdminClient()->getUser()->getLastLogin();
            if ($status) {
                $this->getJarves()->getAdminClient()->getUser()->setLastLogin(time());

                $email = $this->getJarves()->getAdminClient()->getUser()->getEmail();

                return array(
                    'token' => $this->getJarves()->getAdminClient()->getToken(),
                    'userId' => $this->getJarves()->getAdminClient()->getUserId(),
                    'username' => $this->getJarves()->getAdminClient()->getUser()->getUsername(),
                    'lastLogin' => $lastLogin,
                    'access' => $this->getJarves()->getACL()->check('JarvesBundle:entryPoint', '/admin'),
                    'firstName' => $this->getJarves()->getAdminClient()->getUser()->getFirstName(),
                    'lastName' => $this->getJarves()->getAdminClient()->getUser()->getLastName(),
                    'emailMd5' => $email ? md5(strtolower(trim($email))) : null,
                    'imagePath' => $this->getJarves()->getAdminClient()->getUser()->getImagePath()
                );
            }
        }

        return false;
    }

    /**
     * @ApiDoc(
     *  section="Administration",
     *  description="Logs out a user from the current session"
     * )
     *
     * @Rest\Post("/admin/logout")
     *
     * @return bool returns false if the user is not logged in or true when successfully logged out.
     */
    public function logoutUserAction()
    {
        if ($this->getJarves()->getAdminClient()->hasSession() && $this->getJarves()->getAdminClient()->getUser()) {
            $this->getJarves()->getAdminClient()->logout();

            return true;
        }

        return false;
    }

    /**
     * @ApiDoc(
     *  section="Administration",
     *  description="Returns the status of current user"
     * )
     *
     * @Rest\Get("/admin/logged-in")
     *
     * @return bool
     */
    public function loggedInAction()
    {
        return $this->getJarves()->getAdminClient()->getUserId() > 0;
    }

    /**
     * @ApiDoc(
     *  section="Administration",
     *  description="Returns a stream value collection"
     * )
     *
     * @Rest\QueryParam(name="streams", array=true, requirements=".+", strict=true, description="List of stream ids")
     * @Rest\QueryParam(name="params", array=true, description="Params")
     *
     * @Rest\Get("/admin/stream")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @throws \InvalidArgumentException
     * @return array
     */
    public function getStreamAction(ParamFetcher $paramFetcher)
    {
        $streams = $paramFetcher->get('streams');
        if (!is_array($streams)) {
            throw new \InvalidArgumentException('__streams has to be an array.');
        }
        $__streams = array_map('strtolower', $streams);

        $response = array();
        $params = $paramFetcher->get('params');
        foreach ($this->getJarves()->getConfigs() as $bundleConfig) {
            if ($streams = $bundleConfig->getStreams()) {
                foreach ($streams as $stream) {
                    $id = strtolower($bundleConfig->getBundleName() . '/' . $stream->getPath());
                    $shortId = strtolower($bundleConfig->getName() . '/' . $stream->getPath());
                    if (false !== in_array($id, $__streams) || false !== in_array($shortId, $__streams)) {
                        $stream->run($response, $params);
                    }
                }
            }
        }

        return $response;
    }
}

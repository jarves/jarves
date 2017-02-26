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
use Jarves\ACL;
use Jarves\ACLRequest;
use Jarves\Client\UserProvider;
use Jarves\Configuration\Stream;
use Jarves\ContentRender;
use Jarves\Jarves;
use Jarves\Model\Content;
use Jarves\Model\User;
use Jarves\Model\UserQuery;
use Jarves\PageStack;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use FOS\RestBundle\Controller\Annotations as Rest;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Core\Encoder\EncoderFactoryInterface;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Http\Event\InteractiveLoginEvent;

class AdminController extends Controller
{
    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @var PageStack
     */
    protected $pageStack;

    /**
     * @var ContentRender
     */
    protected $contentRender;

    /**
     * @var ACL
     */
    protected $acl;

    /**
     * @var LoggerInterface
     */
    protected $logger;

    /**
     * @var EncoderFactoryInterface
     */
    protected $encoderFactory;

    /**
     * @var TokenStorageInterface
     */
    protected $tokenStorage;

    /**
     * @var UserProvider
     */
    protected $userProvider;

    public function setContainer(ContainerInterface $container = null)
    {
        parent::setContainer($container);

        $this->jarves = $this->get('jarves');
        $this->acl = $this->get('jarves.acl');
        $this->pageStack = $this->get('jarves.page_stack');
        $this->contentRender = $this->get('jarves.content.render');
        $this->logger = $this->get('logger');
        $this->encoderFactory = $this->get('security.encoder_factory');
        $this->tokenStorage = $this->get('security.token_storage');
        $this->userProvider = $this->get('jarves.user_provider');
    }

    /**
     * @return Jarves
     */
    protected function getJarves()
    {
        return $this->get('jarves');
    }

    /**
     * @ApiDoc(
     *  section="Administration",
     *  description="Returns a content template/view with placeholder for Jarves page editor."
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
     *  description="Returns a renderer content element as preview for Jarves page editor"
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
            $domain = $this->pageStack->getDomain($domainId);
            $this->pageStack->setCurrentDomain($domain);
        }

        if ($nodeId) {
            $page = $this->pageStack->getPage($nodeId);
            $this->pageStack->setCurrentPage($page);
        }

        return $this->contentRender->renderContent($contentObject, [
            'preview' => true
        ]);
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
    public function loginUserAction(ParamFetcher $paramFetcher, Request $request)
    {
        $username = $paramFetcher->get('username');
        $password = $paramFetcher->get('password');

        $user = $this->userProvider->loadUserByUsername($username);

        if (!$user) {
            $this->logger->warning(sprintf('Login failed for "%s". User not found', $username));
            sleep(1);
            return false;
        }

        $encoder = $this->encoderFactory->getEncoder($user);

        if (!$encoder->isPasswordValid($user->getPassword(), $password, null)) {
            $this->logger->warning(sprintf('Login failed for "%s". Password missmatch ', $username));
            sleep(1);
            return false;
        }

        $token = new UsernamePasswordToken($user, null, "main", $user->getRoles());
        $this->tokenStorage->setToken($token);

        //now dispatch the login event
        $event = new InteractiveLoginEvent($request, $token);
        $this->get("event_dispatcher")->dispatch("security.interactive_login", $event);

        return array(
            'userId' => $user->getId(),
            'username' => $user->getUsername(),
            'lastLogin' => $user->getLastLogin(),
            'access' => $this->acl->check(ACLRequest::create('jarves/entryPoint', ['path' => '/admin'])),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'imagePath' => $user->getImagePath()
        );
    }

    protected function loginFailed($username)
    {
        $this->logger->warning(sprintf('Login failed for "%s"', $username));
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
        $this->tokenStorage->setToken(null);

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
        return !!$this->tokenStorage->getToken();
    }

    /**
     * @ApiDoc(
     *  section="Administration",
     *  description="Returns a stream value collection"
     * )
     *
     * @Rest\QueryParam(name="streams", map=true, requirements=".+", strict=true, description="List of stream ids")
     * @Rest\QueryParam(name="params", map=true, description="Params")
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
        $params = $paramFetcher->get('params') ?: [];
        foreach ($this->getJarves()->getConfigs() as $bundleConfig) {
            if ($streams = $bundleConfig->getStreams()) {
                foreach ($streams as $stream) {
                    $id = strtolower($bundleConfig->getBundleName() . '/' . $stream->getPath());
                    $shortId = strtolower($bundleConfig->getName() . '/' . $stream->getPath());
                    if (false !== in_array($id, $__streams) || false !== in_array($shortId, $__streams)) {
                        $this->runStream($stream, $response, $params);
                    }
                }
            }
        }

        return $response;
    }

    public function runStream(Stream $stream, &$response, array $params = array())
    {
        $serviceName = explode(':', $stream->getService())[0];
        $method = explode(':', $stream->getService())[1];
        $instance = $this->get($serviceName);

        $callable = array($instance, $method);
        $parameters = array(&$response, $params);
        call_user_func_array($callable, $parameters);
    }

}

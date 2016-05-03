<?php
/**
 * Created by PhpStorm.
 * User: marc
 * Date: 17/04/16
 * Time: 00:42
 */

namespace Jarves\Client;


use Jarves\Model\User;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Security\Core\Authentication\Token\AnonymousToken;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Core\Encoder\EncoderFactoryInterface;
use Symfony\Component\Security\Http\Event\InteractiveLoginEvent;

class UserOperator
{
    /**
     * @var TokenStorageInterface
     */
    private $tokenStorage;

    /**
     * @var UserProvider
     */
    private $userProvider;

    /**
     * @var LoggerInterface
     */
    private $logger;

    /**
     * @var EncoderFactoryInterface
     */
    private $encoderFactory;

    /**
     * @var EventDispatcherInterface
     */
    private $eventDispatcher;

    /**
     * @var RequestStack
     */
    private $requestStack;

    public function __construct(TokenStorageInterface $tokenStorage, UserProvider $userProvider, LoggerInterface $logger,
                                EncoderFactoryInterface $encoderFactory, EventDispatcherInterface $eventDispatcher,
                                RequestStack $requestStack)
    {
        $this->tokenStorage = $tokenStorage;
        $this->userProvider = $userProvider;
        $this->logger = $logger;
        $this->encoderFactory = $encoderFactory;
        $this->eventDispatcher = $eventDispatcher;
        $this->requestStack = $requestStack;
    }

    /**
     * @param string $username
     * @param string $password
     * @param null|string $requiredGroupRole
     * @return bool
     */
    public function login($username, $password, $requiredGroupRole = null)
    {
        if (empty($username) || empty($password)) {
            return false;
        }

        $user = $this->userProvider->loadUserByUsername($username);

        if (!$user) {
            $this->logger->warning(sprintf('Login failed for "%s". User not found', $username));
            sleep(1);
            return false;
        }

        if (null !== $requiredGroupRole) {
            $groupRoles = $user->getGroupRoles();

            if (!in_array($requiredGroupRole, $groupRoles)) {
                $this->logger->warning(sprintf('Login failed for "%s". Not in requested group role "%s" vs "%s"', $username, $requiredGroupRole, implode(',', $groupRoles)));
                sleep(1);
                return false;
            }
        }

        $encoder = $this->encoderFactory->getEncoder($user);

        if (!$encoder->isPasswordValid($user->getPassword(), $password, null)) {
            $this->logger->warning(sprintf('Login failed for "%s". Password missmatch ', $username));
            sleep(1);
            return false;
        }

        $this->manualLogin($user);

        return true;
    }

    public function logout()
    {
        $this->tokenStorage->setToken(null);
    }

    /**
     * Returns the current logged in User if available. Null if not or another token than Jarves' is active.
     *
     * @return User|null
     */
    public function getUser()
    {
        $token = $this->tokenStorage->getToken();
        if ($token && !($token instanceof AnonymousToken)) {
            return $token->getUser();
        }

        return null;
    }

    /**
     * @return null|\Symfony\Component\Security\Core\Authentication\Token\TokenInterface
     */
    public function getToken()
    {
        return $this->tokenStorage->getToken();
    }

    /**
     * Returns true when a non AnonymousToken is set (which primarily means a real User is logged in)
     *
     * @return boolean
     */
    public function isLoggedIn()
    {
        return !($this->tokenStorage->getToken() instanceof AnonymousToken);
    }

    /**
     * @param User $user
     */
    public function manualLogin(User $user)
    {
        $token = new UsernamePasswordToken($user, null, "main", $user->getGroupRoles());
        $this->tokenStorage->setToken($token);

        //now dispatch the login event
        $event = new InteractiveLoginEvent($this->requestStack->getMasterRequest(), $token);
        $this->eventDispatcher->dispatch("security.interactive_login", $event);
    }
}
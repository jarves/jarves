<?php

/**
 * jarvesAuth - class to handle the sessions and authentication.
 *
 * @author MArc Schmidt <marc@jarves.io>
 */

namespace Jarves\Client;

use Jarves\Configuration\Client;
use Jarves\Configuration\SessionStorage;
use Jarves\Jarves;
use Jarves\JarvesBundle;
use Jarves\Model\Session;
use Jarves\Model\User;
use Jarves\Model\UserGroup;
use Jarves\Model\UserQuery;
use Symfony\Component\HttpFoundation\Cookie;

/**
 * Client class.
 *
 * Handles authentification and sessions.
 *
 */
abstract class ClientAbstract
{
    /**
     * The auth token. (which is basically stored as cookie on the client side)
     */
    private $token = false;

    /**
     * Token id (cookie id)
     */
    private $tokenId = 'session_id';

    /**
     * Current session instance.
     *
     * @var Session
     */
    private $session;

    /**
     * Contains the config.
     */
    public $config = array(
        'tokenId' => 'session_id',
        'timeout' => 43200,
        'cookieDomain' => null,
        'cookiePath' => '/',
        'autoLoginLogout' => false,
        'loginTrigger' => 'auth-login',
        'logoutTrigger' => 'auth-logout',
        'loginDelay' => false,
        'ipCheck' => false,
        'garbageCollector' => false
    );

    /**
     * Detects if start() has been called or not.
     *
     * @var bool
     */
    private $started = false;

    /**
     * Instance of Cache class
     *
     * @var SessionStorageInterface
     */
    private $store;

    /**
     * @var Client
     */
    private $clientConfig;

    /**
     * @var User
     */
    protected $user;

    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * Constructor
     *
     * @param Core   $jarves
     * @param Client $clientConfig
     */
    public function __construct(Jarves $jarves, Client $clientConfig)
    {
        $this->setJarves($jarves);
        $this->clientConfig = $clientConfig;
        $this->config = array_merge($this->config, $clientConfig->getOptions()->toArray());

        if ($this->config['tokenId']) {
            $this->tokenId = $this->config['tokenId'];
        }

        $clazz = $clientConfig->getSessionStorage()->getClass();
        $store = new $clazz($clientConfig->getSessionStorage(), $this);
        if (!($store instanceof \Jarves\Client\SessionStorageInterface)) {
            throw new \LogicException(sprintf('Class `%s` has the wrong interface. \Jarves\Client\SessionStorageInterface needed.', $clazz));
        }
        $this->store = $store;
    }

    public function getConfigValue($key)
    {
        if (isset($this->config[$key])) {
            return $this->config[$key];
        }
    }

    /**
     * @param Jarves $jarves
     */
    public function setJarves($jarves)
    {
        $this->jarves = $jarves;
    }

    /**
     * @return Jarves
     */
    public function getJarves()
    {
        return $this->jarves;
    }

    /**
     *
     */
    public function start()
    {
        $this->fetchSession();

        if (!$this->getSession()) {
            //no session found, create new one
            $this->session = $this->createSession();
        } else {
            //maybe we wanna check the ip ?
            if ($this->config['ipCheck']) {
                //$ip = $this->get('ip');

                //if ($ip != $_SERVER['REMOTE_ADDR']) {
                //    $this->logout(); //force down to guest
                //}
            }

            if ($this->getSession()->getTime() + 5 < time()) //do only all 5 seconds an session update
            {
                $this->updateSession();
            }
        }

        if ($this->config['autoLoginLogout']) {
            $this->handleClientLoginLogout();
        }

        if ($this->config['garbageCollector']) {
            $this->removeExpiredSessions();
        }

        $this->setStarted(true);
    }

    /**
     * @param boolean $started
     */
    public function setStarted($started)
    {
        $this->started = $started;
    }

    /**
     * @return boolean
     */
    public function getStarted()
    {
        return $this->started;
    }

    /**
     * Updates the time and refreshed-counter of a session,
     * and updates the cookie timeout on the client side.
     *
     */
    public function updateSession()
    {
        $this->getSession()->setTime(time());
        $this->getSession()->setRefreshed($this->session->getRefreshed() + 1);
        $this->getSession()->setPage(substr($this->getJarves()->getRequest()->getRequestUri(), 0, 255));

        $cookie = new Cookie(
            $this->getTokenId(),
            $this->getToken(),
            time() + $this->config['timeout'],
            $this->config['cookiePath'],
            $this->config['cookieDomain']
        );
        $this->getJarves()->getPageResponse()->headers->setCookie($cookie);
    }

    /**
     * Handles the input (login/logout) of the client.
     */
    public function handleClientLoginLogout()
    {
        //todo
        if (getArgv($this->config['loginTrigger'])) {

            $login = getArgv('username');

            if (getArgv('login')) {
                $login = getArgv('login');
            }

            $passwd = getArgv('passwd') ? getArgv('passwd') : getArgv('password');

            $userId = $this->login($login, $passwd);

            if (!$userId) {
                klog('authentication', str_replace("%s", getArgv('username'), "SECURITY Login failed for '%s'"));
            }
        }

        if (getArgv($this->config['logoutTrigger'])) {
            $this->logout();
            $this->syncStore();
            if (getArgv(1) == 'admin') {
                json(true);
            }
        }
    }

    /**
     * Returns the user from current session.
     *
     * Notice: This starts the session procedure if not already started.
     * Use hasSession() to check fast if a session exist.
     *
     * @return User
     */
    public function getUser()
    {
        if (!$this->getSession() || !$this->getSession()->getUserId()) {
            return null;
        }

        if (null === $this->user) {
            $this->user = $this->getJarves()->getUtils()->getPropelCacheObject('Jarves\Model\User', $this->getSession()->getUserId());
        }

        return $this->user;
    }

    /**
     * Returns the user from current session.
     *
     * Notice: This starts the session procedure if not already started.
     * Use hasSession() to check fast if a session exist.
     *
     * @return int
     */
    public function getUserId()
    {
        return $this->getSession()->getUserId();
    }

    /**
     * Auth against the internal user table.
     *
     * @param $login
     * @param $password
     *
     * @return bool
     */
    protected function internalLogin($login, $password)
    {
        $clientConfig = new Client(null, $this->getJarves());
        $storage = new SessionStorage(null, $this->getJarves());
        $storage->setClass('Jarves\Client\StoreDatabase');
        $clientConfig->setSessionStorage($storage);

        $jarvesUsers = new JarvesUsers($this->getJarves(), $clientConfig);

        $state = $jarvesUsers->checkCredentials($login, $password);

        return $state;
    }

    /**
     * Check credentials and set user_id to the session.
     *
     * @param  string $login
     * @param  string $password
     *
     * @return bool
     */
    public function login($login, $password)
    {
        if (!$this->getStarted()) {
            $this->start();
        }

        if ($login == 'admin') {
            $state = $this->internalLogin($login, $password);
        } else {
            $state = $this->checkCredentials($login, $password);
        }

        if ($state == false) {
            return false;
        }

        $this->setUser($state);
        $this->syncStore();

        return true;
    }

    /**
     * If the user has not been found in the system_user table, we've created it and
     * maybe this class want to map some groups to this new user.
     *
     * Don't forget to clear the cache after updating.
     *
     * The default of this function searches 'default_group' in the auth_params
     * and maps the user automatically to the defined groups.
     *
     * 'defaultGroups' => array(
     *    array('login' => 'LoginOrRegex', 'group' => 'group_id')
     * );
     *
     * You can perfectly use the following jarves.Field definition in your client properties:
     *
     *    "defaultGroup": {
     *        "label": "Group mapping",
     *        "desc": "Regular expression are possible in the login field. The group will be attached after the first login.",
     *        "type": "array",
     *        "columns": [
     *            {"label": "Login"},
     *            {"label": "Group", "width": "65%"}
     *        ],
     *        "fields": {
     *            "login": {
     *                "type": "text"
     *            },
     *            "group": {
     *                "type": "textlist",
     *                "multi": true,
     *                "store": "admin/backend/stores/groups"
     *            }
     *        }
     *    }
     *
     *
     * @param User $user The newly created user.
     */
    public function firstLogin($user)
    {
        if (is_array($this->config['defaultGroup'])) {
            foreach ($this->config['defaultGroup'] as $item) {

                if (preg_match('/' . $item['login'] . '/', $user['username']) == 1) {
                    $userGroup = new UserGroup();
                    $userGroup->setGroupId($item['group']);
                    $userGroup->setUserId($item['id']);
                    $userGroup->save();
                }
            }
        }

    }

    /**
     * Setter for current user
     *
     * @param int $userId
     *
     * @return ClientAbstract $this
     * @throws \Exception
     */
    public function setUser($userId = null)
    {
        if (!$this->getStarted()) {
            $this->start();
        }

        if ($userId !== null) {
            $user = UserQuery::create()->findPk($userId);

            if (!$user) {
                throw new \Exception('User not found ' . $userId);
            }

            $this->getSession()->setUser($user);
        } else {
            $this->getSession()->setUserId(null);
        }

        return $this;
    }

    /**
     * Change the user_id in the session object to 0. Means: is logged out then
     */
    public function logout()
    {
        if (!$this->getStarted()) {
            $this->start();
        }
        $this->setUser();
    }

    /**
     * Removes all expired sessions.
     *
     */
    public function removeExpiredSessions()
    {
        //todo
    }

    /**
     * When the scripts ends, we need to sync the session data to the backend.
     *
     */
    public function syncStore()
    {
        if (!$this->getStarted()) {
            return;
        }

        $time = microtime(true);
        if ($this->hasSession()) {
            $this->store->save(
                $this->token,
                $this->session
            );
        }
//        \Jarves\Utils::$latency['session'][] = microtime(true) - $time;
    }

    /**
     * Create new session in the backend and stores the newly created session id
     * into $this->token. Also set cookie.
     *
     * @return bool|Session The session object
     */
    public function createSession()
    {
        for ($i = 1; $i <= 25; $i++) {
            $session = $this->createSessionById($this->generateSessionId());

            if ($session) {

                $this->setToken($session->getId());

                $cookie = new Cookie(
                    $this->tokenId,
                    $this->token,
                    time() + $this->config['timeout'],
                    $this->config['cookiePath'],
                    $this->config['cookieDomain']
                );
                $this->getJarves()->getPageResponse()->headers->setCookie($cookie);

//                \Jarves\Utils::$latency['session'][] = microtime(true) - $time;
                return $session;
            }

        }

        //after 25 tries, we stop and log it.
        $this->getJarves()->getLogger()->critical(
            "The system just tried to create a session 25 times, but can't generate a new free session id.'.
                        'Maybe the caching server is full and you forgot to setup a cronjob for the garbage collector."
        );

    }

    /**
     * Creates a Session object and store it in the current backend.
     *
     * @param $id
     *
     * @return bool|\Jarves\Model\Session Returns false, if something went wrong otherwise a Session object.
     * @throws \Exception
     */
    public function createSessionById($id)
    {
        //this is a critical section, since between checking whether a session exists
        //and setting the session object, another thread or another server (in the cluster)
        //can write the cache key.
        //So we LOCK all jarves php instances, like in multi-threaded apps, but with all
        //cluster buddies too.
//        Utils::appLock('ClientCreateSession');

        //session id already used?
        $this->fetchSession($id);
        if ($this->session) {
            return false;
        }

        $session = new Session();
        $session->setId($id)
            ->setTime(time())
            ->setPage($this->getJarves()->getRequest() ? $this->getJarves()->getRequest()->getRequestUri() : '')
            ->setRefreshed(0);

        //in some countries it's not allowed to store the IP per default
        if (!isset($this->config['noIPStorage']) && $this->getJarves()->getRequest()) {
            $session->setIp($this->getJarves()->getRequest()->getClientIp());
        }

        try {
            if (!$this->store->save($id, $session)) {
//                Utils::appRelease('ClientCreateSession');

                return false;
            }
        } catch (\Exception $e) {
//            Utils::appRelease('ClientCreateSession');
            throw $e;
        }

//        Utils::appRelease('ClientCreateSession');

        return $session;
    }

    /**
     * Defined whether or not the class should process the client login/logout.
     *
     * @param  boolean $enabled
     *
     * @return ClientAbstract $this
     */
    public function setAutoLoginLogout($enabled)
    {
        $this->config['autoLoginLogout'] = $enabled;

        return $this;
    }

    /**
     * The actual value of the token.
     *
     * @return bool
     */
    public function getToken()
    {
        if (!$this->token) {
            $this->token = $this->getClientToken();
        }

        return $this->token;
    }

    /**
     * The name of the token.
     *
     * @return string
     */
    public function getTokenId()
    {
        return $this->tokenId;
    }

    /**
     * @param $token
     *
     * @events Fires core/client/token-changed($newToken)
     *
     * @return ClientAbstract
     */
    public function setToken($token)
    {
        $this->token = $token;

        return $this;
    }

    /**
     * @param $tokenId
     *
     * @return ClientAbstract
     */
    public function setTokenId($tokenId)
    {
        $this->tokenId = $tokenId;

        return $this;
    }

    /**
     * Generates a new token/session id.
     *
     * @return string The session id
     */
    public function generateSessionId()
    {
        return md5(microtime(true) . mt_rand() . mt_rand(50, 60 * 100));
    }

    /**
     * Tries to load a session based on current token or pToken from the SessionStorage.
     *
     * "ets $this->session.
     *
     * @param  string $token
     */
    protected function fetchSession($token = null)
    {
        if (!$token) {
            $token = $this->getToken();
        }

        if (!$token) {
            return false;
        }

        $this->loadSessionStore($token);
    }

    /**
     * Tries to load a session based on current pToken from the cache backend.
     *
     * @param $token
     *
     * @return \Jarves\Model\Session false if the session does not exist, and Session object, if found.
     */
    public function loadSessionStore($token)
    {
        $session = $this->store->get($token);

        if (!$session) {
            return;
        }

        if (!($session instanceof Session)) {
            $session = (new Session)->importFrom('JSON', $session);
        }

        if (!$session->getId()) {
            return;
        }

        $this->setSession($session);
        if ($session && $session->getTime() + $this->config['timeout'] < time()) {
            $this->store->delete($token);

            return;
        }

        return $session;

    }

    /**
     * Returns the token from the client
     *
     * @return string
     */
    public function getClientToken()
    {
        $request = $this->getJarves()->getRequest();
        if (!$request) return null;

        if ($value = $request->cookies->get($this->tokenId)) {
            return $value;
        }

        if ($value = $request->query->get($this->tokenId)) {
            return $value;
        }

        return null;
    }

    /**
     * Checks the given credentials.
     *
     * @param string $pLogin
     * @param string $pPassword
     *
     * @return bool|integer Returns false if credentials are wrong and returns the user id, if credentials are correct.
     */
    abstract public function checkCredentials($pLogin, $pPassword);


    /**
     * Generates a salt for a hashed password
     *
     * @param  int $length
     *
     * @return string
     */
    public static function getSalt($length = 64)
    {
        $salt = str_repeat('0', $length);

        for ($i = 0; $i < $length; $i++) {
            $salt[$i] = chr(mt_rand(32, 127));
        }

        return $salt;
    }

    /**
     * Injects the passwd hash from config.php into $string
     *
     * @param  string $string
     *
     * @return string
     */
    public static function injectConfigPasswdHash($string)
    {
        $result = '';
        $len = mb_strlen($string);
        $hashKey = JarvesBundle::$systemConfig->getPasswordHashKey();
        $clen = mb_strlen($hashKey);

        for ($i = 0; $i < $len; $i++) {
            $s = hexdec(bin2hex(mb_substr($string, $i, 1)));
            $j = $i;
            while ($j > $clen) {
                $j -= $clen + 1;
            } //CR
            $c = hexdec(bin2hex(mb_substr($hashKey, $j, 1)));
            $result .= pack("H*", $s + $c);
        }

        return $result;
    }

    /**
     * Returns a hashed password with salt.
     */
    public static function getHashedPassword($password, $salt)
    {
        $hash = hash('sha512', ($password . $salt) . $salt) . hash(
                'sha512',
                $salt . ($password . $salt . $password)
            );

        for ($i = 0; $i < 201; $i++) {
            $hash = self::injectConfigPasswdHash($hash);
            $hash = hash(
                    'sha512',
                    $i % 2 ?
                        $hash . $salt . $password . $hash . $salt :
                        $salt . $password . $hash . $password . $hash . $password . $hash
                ) . hash('sha512', $password . $hash . $salt . $password);
        }

        return $hash;
    }

    /**
     * @param  string $loginTrigger
     *
     * @return ClientAbstract   $this
     */
    public function setLoginTrigger($loginTrigger)
    {
        $this->config['loginTrigger'] = $loginTrigger;

        return $this;
    }

    /**
     * @return string
     */
    public function getLoginTrigger()
    {
        return $this->config['loginTrigger'];
    }

    /**
     * @param  string $logoutTrigger
     *
     * @return ClientAbstract $this
     */
    public function setLogoutTrigger($logoutTrigger)
    {
        $this->config['logoutTrigger'] = $logoutTrigger;

        return $this;
    }

    /**
     * @return string
     */
    public function getLogoutTrigger()
    {
        return $this->config['logoutTrigger'];
    }

    /**
     * @param Session $session
     */
    public function setSession($session)
    {
        $this->session = $session;
    }

    /**
     * Returns true if a session has already been loaded or
     * a valid session cookie has been delivered.
     *
     * @return bool
     */
    public function hasSession()
    {
        if (!$this->session && $this->getToken()) {
            $this->fetchSession();
        }

        return $this->session instanceof Session;
    }

    /**
     * Returns the session object. If no session exists, we create one.
     *
     * So be careful: If you just want to check whether a session exists, use
     * hasSession() instead, since otherwise this method here
     * creates a overhead with creating a session id, storing it in the backend and sending a cookie.
     *
     * @param bool $autoStart
     *
     * @return Session
     */
    public function getSession($autoStart = true)
    {
        if ($autoStart) {
            if (!$this->session) {
                $this->fetchSession();
            }

            if (!$this->session) {
                $this->session = $this->createSession();
            }
        }

        return $this->session;
    }

    /**
     * @param array $config
     */
    public function setConfig($config)
    {
        $this->config = $config;
    }

    /**
     * @return array
     */
    public function getConfig()
    {
        return $this->config;
    }

    /**
     * @param $store
     */
    public function setStore($store)
    {
        $this->store = $store;
    }

    /**
     * @return SessionStorageInterface
     */
    public function getStore()
    {
        return $this->store;
    }

    /**
     * @param Client $clientConfig
     */
    public function setClientConfig($clientConfig)
    {
        $this->clientConfig = $clientConfig;
    }

    /**
     * @return Client
     */
    public function getClientConfig()
    {
        return $this->clientConfig;
    }

}

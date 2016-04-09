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

namespace Jarves\Client;

use Propel\Runtime\Propel;

class JarvesUsers extends ClientAbstract
{
    /**
     * Checks the given credentials.
     *
     * @param string $login
     * @param string $password
     *
     * @return bool|integer Returns false if credentials are wrong and returns the user id, if credentials are correct.
     */
    public function checkCredentials($login, $password)
    {
        $userColumn = 'username';

        if ($this->getConfigValue('emailLogin') && strpos($login, '@') !== false && strpos($login, '.') !== false) {
            $userColumn = 'email';
        }

        $con = Propel::getWriteConnection('default');

        $sql = "
            SELECT id, password, password_salt
            FROM system_user
            WHERE
                id > 0
                AND $userColumn = ?
                AND password IS NOT NULL AND password != ''
                AND password_salt IS NOT NULL AND password_salt != ''
                AND (auth_class IS NULL OR auth_class = 'jarves')";

        $stmt = $con->prepare($sql);

        if ($stmt->execute([$login])) {
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        }

        if (isset($row['id']) && $row['id'] > 0) {

            $hash = self::getHashedPassword($password, $row['password_salt'], $this->jarvesConfig->getSystemConfig()->getPasswordHashKey());

            if (!$hash || $hash != $row['password']) {
                return false;
            }
            return $row['id'];
        }

        return false;
    }

}

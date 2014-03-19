<?php

namespace Jarves\Configuration;

class ThemeLayout extends ThemeContent
{
    protected $rootName = 'layout';

	protected $attributes = ['key'];

	protected $key;

	/**
	 * @param mixed $key
	 */
	public function setKey( $key ) {
		$this->key = $key;
	}

	/**
	 * @return mixed
	 */
	public function getKey() {
		return $this->key;
	}
}
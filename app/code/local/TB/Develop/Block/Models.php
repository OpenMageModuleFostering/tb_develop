<?php
/**
 * TB Develop Toolbar
 * 
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is available through the world-wide-web at this URL:
 * http://opensource.org/licenses/osl-3.0.php
 *
 * @category    TB
 * @package     TB_Develop
 * @author      Anton Vasilev <toxabes@gmail.com>
 * @copyright   Copyright (c) 2014 (https://yaprogrammer.com)
 * @license     http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */
class TB_Develop_Block_Models extends Mage_Core_Block_Template {

    protected function getModels() {
        return Mage::getSingleton('develop/observer')->getModels();
    }

    protected function getQueries() {
        return Mage::getSingleton('develop/observer')->getQueries();
    }

    protected function getCollections() {
        return Mage::getSingleton('develop/observer')->getCollections();
    }
    
    public function getEvents($type = 'global'){
        return Mage::getSingleton('develop/observer')->getEvents($type);
    }

}

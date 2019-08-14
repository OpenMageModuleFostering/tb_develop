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
class TB_Develop_Model_System_Config_Source_Scripts {

    public function toOptionArray() {
        return array(
            array('value' => 0, 'label' => Mage::helper('adminhtml')->__('Prototype (Magento Default)')),
            array('value' => 1, 'label' => Mage::helper('adminhtml')->__('JQuery v2.2.1')),
        );
    }

}

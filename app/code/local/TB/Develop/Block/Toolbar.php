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
class TB_Develop_Block_Toolbar extends Mage_Core_Block_Template {

    public function getSections() {
        $sections = array();
        $sections[] = array('id' => 'toolbar_dashboard',
            'title' => 'Dashboard',
            'template' => 'develop_dashboard_section',
        );
        $sections[] = array('id' => 'toolbar_layouts',
            'title' => 'Layouts',
            'template' => 'develop_layouts_section',
        );
        $sections[] = array('id' => 'toolbar_blocks',
            'title' => 'Blocks',
            'template' => 'develop_blocks_section',
        );
        $sections[] = array('id' => 'toolbar_models',
            'title' => 'Models',
            'template' => 'develop_models_section',
        );
        $sections[] = array('id' => 'toolbar_controller',
            'title' => 'Controller',
            'template' => 'develop_controller_section',
        );

        return $sections;
    }

    protected function _toHtml() {
        $allowed = Mage::helper('develop')->isAllowed();
        if($allowed){
           return parent::_toHtml(); 
        }        
    }

}

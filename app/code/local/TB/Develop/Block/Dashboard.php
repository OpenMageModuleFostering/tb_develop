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
class TB_Develop_Block_Dashboard extends Mage_Core_Block_Template {
    
    protected function getModules() {
        $modules = array(); 
        $pools = array('local', 'community');
        $moduleConfig = Mage::getConfig()->getModuleConfig();
        foreach ($moduleConfig as $item){
            foreach ($item as $module => $data) {
                if(in_array($data->codePool, $pools)){
                    if(strtolower($data->active) == 'true'){
                        $enabled = "Yes";
                    }else{
                        $enabled = "No";
                    }
                    $modules[$module] = array(                        
                        "pool"    => $data->codePool,                        
                        "version" => $data->version,
                        "enabled" => $enabled
                    );                                                      
                }
            }
        }

        ksort($modules);
        
        return $modules;
    }
}
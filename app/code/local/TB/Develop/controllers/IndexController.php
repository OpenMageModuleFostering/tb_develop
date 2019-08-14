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
class TB_Develop_IndexController extends Mage_Core_Controller_Front_Action {
    
    private function _back($isError = true, $message = '') {
        if (!empty($message)) {
            if ($isError) {
                Mage::getSingleton('core/session')->addError($message);
            } else {
                Mage::getSingleton('core/session')->addSuccess($message);
            }
        }
        $this->_redirectReferer();
    }
    
    private function show404(){
        $this->getResponse()->setHeader('HTTP/1.1','404 Not Found');
        $this->getResponse()->setHeader('Status','404 File not found');
        $this->_forward('defaultNoRoute');
    }

    public function executeAction() {
        if(!Mage::helper('develop')->isAllowed()){
            return $this->show404();
        }
        $columns = $rows = array();
        $data = trim($this->getRequest()->getParam('data'));
        if ($data != '') {
            $data = unserialize(Mage::helper('develop')->getDecryptedData($data));
        }
        if (is_array($data)) {
            $db = Mage::getSingleton('core/resource')->getConnection('core_read');
            $query = trim($data['query']);
            if (array_key_exists('params', $data)) {
                if (is_array($data['params'])) {
                    foreach ($data['params'] as $key => $value) {
                        $value = '"' . $value . '"';
                        $query = str_replace($key, $value, $query);
                    }
                }
            }
            $res = $db->query($query);
            $result = $res->fetchAll(Zend_Db::FETCH_ASSOC);
            foreach ($result as $row) {
                if (empty($columns)) {
                    $columns = array_keys($row);
                }
                $rows[] = $row;
            }
        }

        $block = new Mage_Core_Block_Template();
        $block->assign('title', 'SQL Select Query');
        $block->assign('columns', $columns);
        $block->assign('rows', $rows);
        $block->assign('query', $query);
        $block->setTemplate('tb_develop/query.phtml');

        echo $block->toHtml();
    }

    public function toggleModuleAction() {
        if(!Mage::helper('develop')->isAllowed()){
            return $this->show404();
        }
        $module = '';
        $data = trim($this->getRequest()->getParam('data'));
        if ($data != '') {
            $module = Mage::helper('develop')->getDecryptedData($data);
        }
        if (empty($module)) {
            echo $this->_back(true, "Invalid module name.");
            return;
        }
        $config = Mage::getConfig();
        $moduleConfig = $config->getModuleConfig($module);
        if (!$moduleConfig) {
            echo $this->_back(true, "Invalid module name.");
            return;
        }
        $oldStatus = ($moduleConfig->is('active')) ? 'true' : 'false';
        $newStatus = (!$moduleConfig->is('active')) ? 'true' : 'false';
        $filePath = $config->getOptions()->getEtcDir() . DS . 'modules' . DS . $module . '.xml';
        $configFile = file_get_contents($filePath);
        $configData = str_replace("<active>" . $oldStatus . "</active>", "<active>" . $newStatus . "</active>", $configFile);
        if (file_put_contents($filePath, $configData) === FALSE) {
            echo $this->_back(true, "Can't save changes! Please check write permissions for {$filePath} !");
            return $this;
        }
        Mage::app()->getCacheInstance()->flush();
        Mage::app()->cleanCache();
        if ($newStatus == 'true') {
            $message = "Module {$module} successfully enabled!";
        } else {
            $message = "Module {$module} successfully disabled!";
        }
        echo $this->_back(false, $message);
    }

    public function clearCacheAction() {
        if(!Mage::helper('develop')->isAllowed()){
            return $this->show404();
        }
        Mage::app()->getCacheInstance()->flush();
        Mage::app()->cleanCache();
        echo $this->_back(false, "Magento's caches successfully cleared!");
    }

    public function clearImagesCacheAction() {
        if(!Mage::helper('develop')->isAllowed()){
            return $this->show404();
        }
        Mage::getModel('catalog/product_image')->clearCache();
        echo $this->_back(false, "Catalog images cache successfully cleared!");
    }

    public function clearJsCssCacheAction() {
        if(!Mage::helper('develop')->isAllowed()){
            return $this->show404();
        }
        Mage::getModel('core/design_package')->cleanMergedJsCss();
        echo $this->_back(false, "Javasipt/CSS cache successfully cleared!");
    }

    public function refreshIndexesAction() {
        if(!Mage::helper('develop')->isAllowed()){
            return $this->show404();
        }
        $indexCollection = Mage::getModel('index/process')->getCollection();
        foreach ($indexCollection as $index) {
            $index->reindexAll();
        }
        echo $this->_back(false, "Indexes refreshed successfully!");
    }

    public function clearSessionsAction() {
        if(!Mage::helper('develop')->isAllowed()){
            return $this->show404();
        }
        Mage::app()->cleanAllSessions();
        echo $this->_back(false, "Sessions successfully cleared!");
    }

    public function toggleExtendedTemplateAction($back = true){
        if(!Mage::helper('develop')->isAllowed()){
            return $this->show404();
        }
        $templateHints = (bool)Mage::getStoreConfig('dev/debug/template_hints');
        if($templateHints){
            $this->toggleTemplateHintsAction(false);
        }
        $currentStatus = Mage::getStoreConfig('dev/tb_develop/extended_template_hints');
        $newStatus = !$currentStatus;
        Mage::getModel('core/config')->saveConfig('dev/tb_develop/extended_template_hints', $newStatus);
        if($back){
            Mage::app()->getCacheInstance()->flush();
            Mage::app()->cleanCache();
            $message = 'Extended template hints set to ' . var_export($newStatus, true);            
            echo $this->_back(false, $message);
        }else{
            return true;
        }
    }    
    
    public function toggleTemplateHintsAction($back = true) {
        if(!Mage::helper('develop')->isAllowed()){
            return $this->show404();
        }
        $extendedTemplateHints = Mage::getStoreConfig('dev/tb_develop/extended_template_hints');
        if($extendedTemplateHints){
            $this->toggleExtendedTemplateAction(false);
        }
        $currentStatus = Mage::getStoreConfig('dev/debug/template_hints');        
        $newStatus = !$currentStatus;
        Mage::getConfig()->saveConfig('dev/debug/template_hints', $newStatus, 'stores', Mage::app()->getStore()->getStoreId());
        Mage::getConfig()->saveConfig('dev/debug/template_hints_blocks', $newStatus, 'stores', Mage::app()->getStore()->getStoreId());
        Mage::getConfig()->saveConfig('dev/debug/template_hints', $newStatus, 'default', 0);
        Mage::getConfig()->saveConfig('dev/debug/template_hints_blocks', $newStatus, 'default', 0);
        Mage::app()->cleanCache();
        if($back){
            Mage::app()->getCacheInstance()->flush();
            Mage::app()->cleanCache();
            $message = 'Template hints set to ' . var_export($newStatus, true);
            echo $this->_back(false, $message);
        }else{
            return true;
        }
    }

    public function toggleTranslateInlineAction() {
        if(!Mage::helper('develop')->isAllowed()){
            return $this->show404();
        }
        $currentStatus = Mage::getStoreConfig('dev/translate_inline/active');
        $newStatus = !$currentStatus;
        Mage::getConfig()->saveConfig('dev/translate_inline/active', $newStatus, 'stores', Mage::app()->getStore()->getStoreId());
        Mage::getConfig()->saveConfig('dev/translate_inline/active_admin', $newStatus, 'stores', Mage::app()->getStore()->getStoreId());
        $allTypes = Mage::app()->useCache();
        $allTypes['translate'] = !$newStatus;
        Mage::app()->saveUseCache($allTypes);
        Mage::app()->getCacheInstance()->flush();
        Mage::app()->cleanCache();
        $message = 'Translate inline set to ' . var_export($newStatus, true);
        echo $this->_back(false, $message);
    }

    public function toggleLogAction() {
        if(!Mage::helper('develop')->isAllowed()){
            return $this->show404();
        }
        $currentStatus = Mage::getStoreConfig('dev/log/active');
        $newStatus = !$currentStatus;
        Mage::getConfig()->saveConfig('dev/log/active', $newStatus, 'stores', Mage::app()->getStore()->getStoreId());
        Mage::getConfig()->saveConfig('dev/log/active', $newStatus, 'default', 0);
        Mage::app()->getCacheInstance()->flush();
        Mage::app()->cleanCache();
        $message = 'Logging set to ' . var_export($newStatus, true);
        echo $this->_back(false, $message);
    }

}

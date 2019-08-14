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
class TB_Develop_Model_Observer {

    private $models = array();
    private $collections = array();
    private $blocks = array();
    private $layoutBlocks = array();
    private $globalEvents = array();
    private $frontendEvents = array();
    private $adminEvents = array();
    private static $zIndex = 900;

    public function addToolbarBlock(Varien_Event_Observer $observer) {
        if(!Mage::helper('develop')->isAllowed()){
            return $this;
        }
        $this->globalEvents = Mage::app()->getConfig()->getNode('global')->events;
        $this->frontendEvents = Mage::app()->getConfig()->getNode('frontend')->events;
        $this->adminEvents = Mage::app()->getConfig()->getNode('adminhtml')->events;
        $layout = $observer->getEvent()->getLayout()->getUpdate();
        $layout->addHandle('tb_develop');

        return $this;
    }

    public function onModelLoad(Varien_Event_Observer $observer) {
        if(!Mage::helper('develop')->isAllowed()){
            return $this;
        }
        $event = $observer->getEvent();
        $object = $event->getObject();
        $key = get_class($object);

        if (array_key_exists($key, $this->models)) {
            $this->models[$key]['calls'] ++;
        } else {
            $model = array();
            $model['class'] = get_class($object);
            $model['resource_name'] = $object->getResourceName();
            $model['calls'] = 1;
            $this->models[$key] = $model;
        }

        return $this;
    }

    function onMySQLCollectionLoad(Varien_Event_Observer $event) {
        $collection = $event->getCollection();
        $data = array('type' => 'mysql');
        $data['sql'] = $collection->getSelectSql(true);
        $data['class'] = get_class($collection);
        $this->collections[] = $data;
        
        return $this;
    }

    function onEavCollectionLoad(Varien_Event_Observer $event) {
        if(!Mage::helper('develop')->isAllowed()){
            return $this;
        }
        $collection = $event->getCollection();
        $data = array('type' => 'eav');
        $data['sql'] = $collection->getSelectSql(true);
        $data['class'] = get_class($collection);
        $this->collections[] = $data;
        
        return $this;
    }

    public function onBlockToHtml(Varien_Event_Observer $observer) {
        if(!Mage::helper('develop')->isAllowed()){
            return $this;
        }
        $event = $observer->getEvent();
        $block = $event->getBlock();
        $data = array();
        $data['class'] = get_class($block);
        $data['layout_name'] = $block->getNameInLayout();
        if (method_exists($block, 'getTemplateFile')) {
            $data['template'] = $block->getTemplateFile();
        } else {
            $data['template'] = '';
        }
        $this->blocks[] = $data;

        return $this;
    }

    public function onLayoutGenerate(Varien_Event_Observer $observer) {
        if(!Mage::helper('develop')->isAllowed()){
            return $this;
        }
        $layout = $observer->getEvent()->getLayout();
        $layoutBlocks = $layout->getAllBlocks();
        foreach ($layoutBlocks as $block) {
            $data = array();
            $data['class'] = get_class($block);
            $data['layout_name'] = $block->getNameInLayout();
            if (method_exists($block, 'getTemplateFile')) {
                $data['template'] = $block->getTemplateFile();
            } else {
                $data['template'] = '';
            }
            $this->layoutBlocks[] = $data;
        }
        
        return $this;
    }

    protected function prepareEventsList($object, $scope) {
        $events = array();
        if (is_array($object)) {
            foreach ($object as $event => $obj) {
                $data = (array) $obj->observers;
                foreach ($data as $key => $item_obj) {
                    $item = (array) $item_obj;
                    if (array_key_exists('type', $item)) {
                        $type = $item['type'];
                    } else {
                        $type = '';
                    }
                    if (array_key_exists('class', $item)) {
                        $class = $item['class'];
                    } else {
                        $class = '';
                    }
                    if (array_key_exists('method', $item)) {
                        $method = $item['method'];
                    } else {
                        $method = '';
                    }
                    $events[] = array(
                        "event" => $event,
                        "key" => $key,
                        "scope" => $scope,
                        "class" => $class,
                        "method" => $method,
                        "type" => $type
                    );
                }
            }
        }

        return $events;
    }

    public function getEvents() {
        if(!Mage::helper('develop')->isAllowed()){
            return array();
        }
        $events1 = $this->prepareEventsList($this->globalEvents, 'global');
        $events2 = $this->prepareEventsList($this->frontendEvents, 'frontend');
        $events3 = $this->prepareEventsList($this->adminEvents, 'adminhtml');
        $events = array_merge($events1, $events2, $events3);
        asort($events);

        return $events;
    }

    public function getQueries() {
        if(!Mage::helper('develop')->isAllowed()){
            return array();
        }
        $profiler = Mage::getSingleton('core/resource')->getConnection('core_write')->getProfiler();
        $queries = array();
        if ($profiler) {
            $queries = $profiler->getQueryProfiles();
        }

        return $queries;
    }

    public function getModels() {
        return $this->models;
    }

    public function getCollections() {
        return $this->collections;
    }

    public function getBlocks() {
        return $this->blocks;
    }

    public function getLayoutBlocks() {
        return $this->layoutBlocks;
    }

    public function afterBlockHtml(Varien_Event_Observer $params) {
        $allowed = Mage::helper('develop')->isAllowed();
        $extendedTemplateHints = Mage::getStoreConfig('dev/tb_develop/extended_template_hints');
        if (!$allowed || !$extendedTemplateHints) {
            return;
        }

        $transport = $params->getTransport();
        $html = $transport->getHtml();
        $skip = false;
        $block = $params->getBlock();
        $childs = array_keys($block->getChild());
        if (in_array('develop_toolbar', $childs)) {
            $skip = true;
        }
        
        $handles = Mage::getSingleton('core/layout')->getUpdate()->getHandles();
        if (in_array('adminhtml_index_login', $handles) || in_array('adminhtml_index_forgotpassword', $handles)) {
            $skip = true;
        }
        
        $moduleName = $block->getModuleName();
        if ($moduleName != 'TB_Develop' && !$skip) {
            if (in_array('before_body_end', $childs)) {
                $cssBorderSuffix = 'toolbar_hint_border_top';
                $cssTitleSuffix = 'toolbar_hint_title_top';
            } else {
                $cssBorderSuffix = '';
                $cssTitleSuffix = '';
            }
            
            $info = array();
            $info['module_name'] = $moduleName;
            $info['layout_name'] = $block->getNameInLayout();
            $info['alias'] = $block->getBlockAlias();            
            
            $templateFile = $block->getTemplateFile();
            if ($templateFile) {
                $info['template'] = 'app/design/' . $templateFile;
            } else {
                $info['template'] = '';
            }

            $info['color'] = '#E20800';
            $info['cached'] = 'No';
            $lifetime = $block->getCacheLifetime();
            if (!is_null($lifetime)) {
                $info['color'] = '#00BF00';
                $info['cached'] = 'Yes';
            } else {
                $parent = $block->getParentBlock();
                while ($parent instanceof Mage_Core_Block_Abstract) {
                    if (!is_null($parent->getCacheLifetime())) {
                        $info['color'] = '#FFAA00';
                        $info['cached'] = 'Inherit cached';
                        break;
                    }
                    $parent = $parent->getParentBlock();
                }
            }
            
            if (self::$zIndex > 1) {
                self::$zIndex--;
            }
            $zIndex = self::$zIndex;

            $data = <<<HTML
            <div class="toolbar_hint_border {$cssBorderSuffix}" style="border-color:{$info["color"]};z-index:{$zIndex}">
                <div class="toolbar_hint_title {$cssTitleSuffix}">
                    <div class="toolbar_hint_title_text" style="background: {$info["color"]}">{$info["module_name"]}</div>            
                    <div class="toolbar_hint_content">            
                        <table class="toolbar_table">
                            <thead>
                                <tr>
                                    <th>Param</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                 <tr class="toolbar_table_odd">                      
                                      <td class="toolbar_table_left"><span class="toolbar_table_syntax-attribute">Layout</span></td>        
                                      <td class="toolbar_table_left">{$info["layout_name"]}</td>
                                 </tr>
                                 <tr class="toolbar_table_even">                      
                                      <td class="toolbar_table_left"><span class="toolbar_table_syntax-attribute">Alias</span></td>        
                                      <td class="toolbar_table_left">{$info["alias"]}</td>
                                 </tr>
                                 <tr class="toolbar_table_odd">                      
                                      <td class="toolbar_table_left"><span class="toolbar_table_syntax-attribute">Template</span></td>        
                                      <td class="toolbar_table_left"><span class="toolbar_table_syntax-string">{$info["template"]}</span></td>
                                 </tr>
                                 
                                 <tr class="toolbar_table_even">                      
                                      <td class="toolbar_table_left"><span class="toolbar_table_syntax-attribute">Cached</span></td>        
                                      <td class="toolbar_table_left"><span style="color:{$info["color"]};">{$info["cached"]}</span></td>
                                 </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                {$html}
            </div>
HTML;
            $html = $data;
        }

        $transport->setHtml($html);
    }

    public function onFirstEvent(){       
        Varien_Profiler::enable();
    }
}

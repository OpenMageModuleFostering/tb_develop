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
class TB_Develop_Helper_Data extends Mage_Core_Helper_Abstract {

    public function isAllowed(){
        $allowed = false;
        $enabled = (bool)Mage::getStoreConfig('develop/options/enable');        
        if ($enabled) {
            $allowedIps = (string)Mage::getStoreConfig('develop/options/allowed_ips');
            $clientIP = Mage::helper('core/http')->getRemoteAddr();                        
            if (!empty($allowedIps) && !empty($clientIP)) {
                $allowedIps = preg_split('#\s*,\s*#', $allowedIps, null, PREG_SPLIT_NO_EMPTY);
                if (in_array($clientIP, $allowedIps)) {
                    $allowed = true;
                }
            }
        }
        
        return $allowed;
    }

    public function getEnryptedSQLQuery(Zend_Db_Profiler_Query $query, $type) {
        $queryType = $query->getQueryType();
        $result = '';
        if ($queryType == Zend_Db_Profiler::SELECT) {
            $data = array(
                'query' => $query->getQuery(),
                'params' => $query->getQueryParams()
            );
            $result = Mage::getUrl('develop/index/' . $type, array('_query' => array('data' => base64_encode(Mage::helper('core')->encrypt(serialize($data))))));
        }

        return $result;
    }

    public function getSimpleEnryptedSQLQuery($query, $type) {
        $data = array(
            'query' => $query
        );
        $result = Mage::getUrl('develop/index/' . $type, array('_query' => array('data' => base64_encode(Mage::helper('core')->encrypt(serialize($data))))));

        return $result;
    }

    public function getEncryptedData($data) {
        return base64_encode(Mage::helper('core')->encrypt($data));
    }

    public function getDecryptedData($data) {
        return Mage::helper('core')->decrypt(base64_decode($data));
    }

    public function formatXMLString($xml, $sanitaze = false) {
        $xml = preg_replace('/(>)(<)(\/*)/', "$1\n$2$3", $xml);
        $token = strtok($xml, "\n");
        $result = '';
        $pad = 0;
        $matches = array();
        while ($token !== false) {
            if (preg_match('/.+<\/\w[^>]*>$/', $token, $matches)) {
                $indent = 0;
            } elseif (preg_match('/^<\/\w/', $token, $matches)) {
                $pad -= 4;
                $indent = 0;
            } elseif (preg_match('/^<\w[^>]*[^\/]>.*$/', $token, $matches)) {
                $indent = 4;
            } else {
                $indent = 0;
            }
            $line = str_pad($token, strlen($token) + $pad, ' ', STR_PAD_LEFT);
            $result .= $line . "\n";
            $token = strtok("\n");
            $pad += $indent;
        }

        if ($sanitaze) {
            $result = str_replace('<', '&lt;', $result);
        }

        return $result;
    }

    public function getLayouts() {
        $data = array();
        $_subst = array();
        $baseDir = Mage::getBaseDir() . '/';
        $updateFiles = array(0 => 'local.xml');
        $subst = Mage::getConfig()->getPathVars();
        foreach ($subst as $k => $v) {
            $_subst['from'][] = '{{' . $k . '}}';
            $_subst['to'][] = $v;
        }
        $storeId = Mage::app()->getStore()->getId();
        $coreLayoutElementModel = Mage::getConfig()->getModelClassName('core/layout_element');
        $design = Mage::getSingleton('core/design_package');
        $updatesRoot = Mage::app()->getConfig()->getNode($design->getArea() . '/layout/updates');
        foreach ($updatesRoot->children() as $updateNode) {
            if ($updateNode->file) {
                $module = $updateNode->getAttribute('module');
                if ($module && Mage::getStoreConfigFlag('advanced/modules_disable_output/' . $module, $storeId)) {
                    continue;
                }
                $updateFiles[] = (string) $updateNode->file;
            }
        }
        $handles = Mage::getSingleton('core/layout')->getUpdate()->getHandles();
        foreach ($handles as $handle) {
            if (!array_key_exists($handle, $data)) {
                array_push($data, $handle);
            }

            foreach ($updateFiles as $file) {
                $file = $design->getLayoutFilename($file, array(
                    '_area' => $design->getArea(),
                    '_package' => $design->getPackageName(),
                    '_theme' => $design->getTheme('layout')
                ));
                if (!is_readable($file)) {
                    continue;
                }
                $fileStr = file_get_contents($file);
                $fileXml = simplexml_load_string($fileStr, $coreLayoutElementModel);
                if (!$fileXml instanceof SimpleXMLElement) {
                    continue;
                }
                $content = $fileXml->xpath("/layout/" . $handle);
                if ($content) {
                    $file = str_replace($baseDir, '', $file);
                    foreach ($content as $xml_rule) {
                        $xmlData = (string) $xml_rule->asXML();
                        $xmlData = preg_replace('~\s*(<([^>]*)>[^<]*</\2>|<[^>]*>)\s*~','$1', $xmlData);                        
                        $data[$handle][] = array(
                            'file' => $file,
                            'content' => $xmlData
                                
                        );
                    }
                }
            }   
            $bind = array(
                'store_id' => $storeId,
                'area' => $design->getArea(),
                'package' => $design->getPackageName(),
                'theme' => $design->getTheme('layout'),
                'layout_update_handle' => $handle
            );
            $layoutResourceModel = Mage::getResourceModel('core/layout');
            $readAdapter = Mage::getSingleton('core/resource')->getConnection('core_read');
            $select = $readAdapter->select()
                    ->from(array('layout_update' => $layoutResourceModel->getMainTable()), array('xml'))
                    ->join(array('link' => $layoutResourceModel->getTable('core/layout_link')), 'link.layout_update_id=layout_update.layout_update_id', '')
                    ->where('link.store_id IN (0, :store_id)')
                    ->where('link.area = :area')
                    ->where('link.package = :package')
                    ->where('link.theme = :theme')
                    ->where('layout_update.handle = :layout_update_handle')
                    ->order('layout_update.sort_order ' . Varien_Db_Select::SQL_ASC);
            $result = $readAdapter->fetchCol($select, $bind);

            if (count($result)) {
                foreach ($result as $content) {
                    $xmlData = (string) $content;
                    $xmlData = preg_replace('~\s*(<([^>]*)>[^<]*</\2>|<[^>]*>)\s*~','$1', $xmlData); 
                    $data[$handle][] = array(
                        'file' => 'database',
                        'content' => $xmlData
                    );
                }
            }
        }

        return $data;
    }

    public function getMemoryPeakUsage() {
        $memory = memory_get_peak_usage(TRUE);
        $sizes = array("Bytes", "KB", "MB", "GB", "TB", "PB");
        if ($memory == 0) {
            return 'n/a';
        } else {
            return round($memory / pow(1024, ($i = floor(log($memory, 1024)))), 2) . ' ' . $sizes[$i];
        }
    }

    public function getScriptDuration() {
        if (function_exists('xdebug_time_index')) {
            return sprintf("%0.4f", xdebug_time_index());
        } else {
            return 'n/a';
        }
    }

    public function phpinfo2array() {
        ob_start();
        phpinfo(-1);
        $content = preg_replace(array('#^.*<body>(.*)</body>.*$#ms', '#<h2>PHP License</h2>.*$#ms',
            '#<h1>Configuration</h1>#', "#\r?\n#", "#</(h1|h2|h3|tr)>#", '# +<#',
            "#[ \t]+#", '#&nbsp;#', '#  +#', '# class=".*?"#', '%&#039;%',
            '#<tr>(?:.*?)" src="(?:.*?)=(.*?)" alt="PHP Logo" /></a>'
            . '<h1>PHP Version (.*?)</h1>(?:\n+?)</td></tr>#',
            '#<h1><a href="(?:.*?)\?=(.*?)">PHP Credits</a></h1>#',
            '#<tr>(?:.*?)" src="(?:.*?)=(.*?)"(?:.*?)Zend Engine (.*?),(?:.*?)</tr>#',
            "# +#", '#<tr>#', '#</tr>#'), array('$1', '', '', '', '</$1>' . "\n", '<', ' ', ' ', ' ', '', ' ',
            '<h2>PHP Configuration</h2>' . "\n" . '<tr><td>PHP Version</td><td>$2</td></tr>' .
            "\n" . '<tr><td>PHP Egg</td><td>$1</td></tr>',
            '<tr><td>PHP Credits Egg</td><td>$1</td></tr>',
            '<tr><td>Zend Engine</td><td>$2</td></tr>' . "\n" .
            '<tr><td>Zend Egg</td><td>$1</td></tr>', ' ', '%S%', '%E%'), ob_get_clean());

        $sections = explode('<h2>', strip_tags($content, '<h2><th><td>'));
        unset($sections[0]);
        $askapache = '';
        $data = array();
        foreach ($sections as $section) {
            $n = substr($section, 0, strpos($section, '</h2>'));
            preg_match_all('#%S%(?:<td>(.*?)</td>)?(?:<td>(.*?)</td>)?(?:<td>(.*?)</td>)?%E%#', $section, $askapache, PREG_SET_ORDER);
            foreach ($askapache as $m) {
                if (!isset($m[3]) || $m[2] == $m[3]) {
                    if(array_key_exists(2, $m)){
                        $item = $m[2];
                    }else{
                        $item = '';
                    }
                } else {
                    $item = array_slice($m, 2);
                }
                $data[$n][$m[1]] = $item;
            }
        }

        return $data;
    }

    function ReadFromEndByLine($name, $count) {
        $lines = array();
        $filename = getcwd() . '/var/log/' . $name;
        if(is_file($filename)) {
            $file = new SplFileObject($filename);
            $file->seek($file->getSize());
            $linesTotal = (int)$file->key();
            $file->rewind();
            if($count >= $linesTotal){
                while (!$file->eof()) {
                    array_push($lines, $file->fgets());
                }
            }else{
                $start_line = $linesTotal - $count - 1;
                $file->seek($start_line);  
                while (!$file->eof()) {
                    $line = trim($file->fgets());
                    if($line != ''){
                        array_push($lines, $line);
                    }
                }
            }                        
            $file = null;
        }

        return $lines;
    }

    public function readSystemLog() {
        $filename = Mage::getStoreConfig('dev/log/file');
        $lines = $this->ReadFromEndByLine($filename, 100);

        return $lines;
    }

    public function readExceptionLog() {
        $filename = Mage::getStoreConfig('dev/log/exception_file');
        $lines = $this->ReadFromEndByLine($filename, 100);

        return $lines;
    }

}
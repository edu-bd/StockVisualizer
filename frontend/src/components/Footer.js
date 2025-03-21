// frontend/src/components/Footer.js
/**
 * 此组件用于展示应用的底部信息栏。
 * 显示版权信息和其他相关链接。
 * Authors: hovi.hyw & AI
 * Date: 2025-03-12
 */

import React, { useState } from 'react';
import { Layout, Modal, Image } from 'antd';
import { GithubOutlined, QuestionCircleOutlined, DatabaseOutlined } from '@ant-design/icons';

const { Footer: AntFooter } = Layout;

/**
 * 底部信息栏组件
 * @returns {JSX.Element} 底部信息栏组件
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [isQRCodeVisible, setIsQRCodeVisible] = useState(false);
  const [isReadmeVisible, setIsReadmeVisible] = useState(false);
  const [readmeContent, setReadmeContent] = useState('');
  
  // 显示微信二维码
  const showQRCode = () => {
    setIsQRCodeVisible(true);
  };

  // 显示README内容
  const showReadme = async () => {
    try {
      // 这里可以通过API获取README内容，或者直接引入README文件
      // 为简单起见，这里直接使用fetch获取README文件
      const response = await fetch('/README.md');
      const text = await response.text();
      setReadmeContent(text);
      setIsReadmeVisible(true);
    } catch (error) {
      console.error('获取README内容失败:', error);
    }
  };
  
  return (
    <AntFooter className="app-footer">
      <div className="footer-content">
        <p>股票数据可视化系统 &copy; {currentYear}</p>
        <p>
          <a onClick={showQRCode}><GithubOutlined /> 关于我</a> |
          <a onClick={showReadme}><QuestionCircleOutlined /> 使用帮助</a> | 
          <a href="https://akshare.akfamily.xyz/data_tips.html" target="_blank" rel="noopener noreferrer"><DatabaseOutlined /> 数据来源</a>
        </p>
      </div>
      
      {/* 微信二维码弹窗 */}
      <Modal
        title="关于我"
        open={isQRCodeVisible}
        onCancel={() => setIsQRCodeVisible(false)}
        footer={null}
        width={300}
      >
        <div style={{ textAlign: 'center' }}>
          <Image
            src="/images/wechat-qrcode.png"
            alt="微信二维码"
            style={{ maxWidth: '100%' }}
          />
          <p style={{ marginTop: 16 }}>我的微信二维码</p>
        </div>
      </Modal>
      
      {/* README内容弹窗 */}
      <Modal
        title="akshare"
        open={isReadmeVisible}
        onCancel={() => setIsReadmeVisible(false)}
        footer={null}
        width={700}
      >
        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', maxHeight: '60vh', overflow: 'auto' }}>
          {readmeContent}
        </pre>
      </Modal>
    </AntFooter>
  );
};

export default Footer;
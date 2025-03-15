// frontend/src/pages/StrategyPage.js
/**
 * 此页面用于选股策略的创建和执行。
 * 集成了策略构建器和结果展示组件。
 * Authors: hovi.hyw & AI
 * Date: 2025-03-12
 */

import React, { useState } from 'react';
import { Tabs, Typography, Layout, Divider, message } from 'antd';
import StrategyBuilder from '../components/StrategyBuilder';
import StrategyResult from '../components/StrategyResult';
import strategyService from '../services/strategyService';

const { Title, Paragraph } = Typography;
const { Content } = Layout;
const { TabPane } = Tabs;

/**
 * 选股策略页面
 */
const StrategyPage = () => {
  const [activeTab, setActiveTab] = useState('stock');
  const [stockResult, setStockResult] = useState(null);
  const [indexResult, setIndexResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // 处理策略执行
  const handleExecuteStrategy = async (strategy, targetType) => {
    try {
      setLoading(true);
      
      // 根据目标类型设置结果
      if (targetType === 'stock') {
        setStockResult(null); // 清空之前的结果
        const result = await strategyService.executeStockStrategy(strategy);
        setStockResult(result);
      } else {
        setIndexResult(null); // 清空之前的结果
        const result = await strategyService.executeIndexStrategy(strategy);
        setIndexResult(result);
      }
      
      message.success(`${strategy.name} 策略执行成功`);
    } catch (error) {
      message.error(`策略执行失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className="strategy-page">
      <Content style={{ padding: '16px', width: '100%' }}>
        <Typography>
          <Title level={2} style={{ marginBottom: '8px' }}>选股策略</Title>
          <Paragraph style={{ marginBottom: '12px' }}>
            通过设置各种技术指标和基本面指标的条件，筛选符合条件的股票或指数。
            您可以创建复杂的选股策略，并查看符合条件的结果。
          </Paragraph>
        </Typography>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          tabBarStyle={{ marginBottom: '16px' }}
          size="small"
        >
          <TabPane tab="股票策略" key="stock">
            <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', flexWrap: 'nowrap', overflow: 'hidden' }}>
              <div style={{ width: '100%', maxWidth: '500px', flexShrink: 0, minWidth: '300px' }}>
                <StrategyBuilder 
                  onExecute={(strategy) => handleExecuteStrategy(strategy, 'stock')} 
                  targetType="stock" 
                />
              </div>
              <div style={{ width: '100%', flexGrow: 1, minWidth: '300px', overflow: 'auto' }}>
                <StrategyResult 
                  result={stockResult} 
                  targetType="stock" 
                  loading={loading && activeTab === 'stock'} 
                />
              </div>
            </div>
          </TabPane>
          
          <TabPane tab="指数策略" key="index">
            <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', flexWrap: 'nowrap', overflow: 'hidden' }}>
              <div style={{ width: '100%', maxWidth: '500px', flexShrink: 0, minWidth: '300px' }}>
                <StrategyBuilder 
                  onExecute={(strategy) => handleExecuteStrategy(strategy, 'index')} 
                  targetType="index" 
                />
              </div>
              <div style={{ width: '100%', flexGrow: 1, minWidth: '300px', overflow: 'auto' }}>
                <StrategyResult 
                  result={indexResult} 
                  targetType="index" 
                  loading={loading && activeTab === 'index'} 
                />
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Content>
    </Layout>
  );
};

export default StrategyPage;
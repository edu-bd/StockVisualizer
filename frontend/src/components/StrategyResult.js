// frontend/src/components/StrategyResult.js
/**
 * 此组件用于展示选股策略的结果。
 * 以表格形式展示符合策略条件的股票或指数。
 * Authors: hovi.hyw & AI
 * Date: 2025-03-12
 */

import React, { useState } from 'react';
import { Table, Card, Typography, Tag, Tooltip, Statistic, Row, Col, Select, Button } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

/**
 * 选股策略结果组件
 * @param {Object} props - 组件属性
 * @param {Object} props.result - 选股结果
 * @param {string} props.targetType - 目标类型，支持 'stock' 和 'index'
 * @param {boolean} props.loading - 加载状态
 */
const StrategyResult = ({ result, targetType = 'stock', loading = false }) => {
  const [pageSize, setPageSize] = useState(10);
  const [marketFilter, setMarketFilter] = useState('all');
  
  // 如果没有结果，则不显示
  if (!result) return null;

  // 市场选项
  const marketOptions = [
    { value: 'all', label: '全部市场' },
    { value: 'sh', label: '上海' },
    { value: 'sz', label: '深圳' },
    { value: 'bj', label: '北京' }
  ];

  // 根据市场筛选数据
  const filteredItems = marketFilter === 'all' 
    ? result.items 
    : result.items.filter(item => {
        const symbol = item.symbol;
        // 直接检查股票代码前缀
        if (marketFilter === 'sh') {
          return symbol.startsWith('sh');
        } else if (marketFilter === 'sz') {
          return symbol.startsWith('sz');
        } else if (marketFilter === 'bj') {
          return symbol.startsWith('bj');
        }
        return true;
      });

  // 定义表格列
  const columns = [
    {
      title: '代码',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (text) => <Link to={`/detail/${targetType}/${text}`}>{text}</Link>,
    },
  ];

  // 根据目标类型添加不同的列
  if (targetType === 'index') {
    columns.push({
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    });
  }

  // 添加共同的列
  columns.push(
    {
      title: '最新价格',
      dataIndex: 'latest_price',
      key: 'latest_price',
      render: (text) => text.toFixed(2),
      sorter: (a, b) => a.latest_price - b.latest_price,
    },
    {
      title: '匹配详情',
      dataIndex: 'match_details',
      key: 'match_details',
      render: (details) => (
        <div>
          {Object.keys(details).map((key) => {
            const condition = details[key];
            return (
              <Tooltip 
                key={key} 
                title={
                  <div>
                    <div>指标: {condition.indicator}</div>
                    <div>运算符: {condition.operator}</div>
                    <div>值: {Array.isArray(condition.value) 
                      ? `${condition.value[0]} - ${condition.value[1]}` 
                      : condition.value}
                    </div>
                  </div>
                }
              >
                <Tag color="blue" style={{ margin: '2px' }}>
                  <CheckCircleOutlined /> {key.replace('condition_', '条件')}
                </Tag>
              </Tooltip>
            );
          })}
        </div>
      ),
    }
  );

  // 导出结果为TXT文件（简化的股票代码，用逗号分隔）
  const handleExportResult = () => {
    try {
      // 提取股票代码并去除市场前缀
      const stockCodes = filteredItems.map(item => {
        // 去除市场前缀（如sh、sz、bj等）
        const symbol = item.symbol;
        // 使用正则表达式匹配非数字前缀
        const match = symbol.match(/[^0-9]*(\d+)/);
        return match ? match[1] : symbol;
      });
      
      // 用逗号连接股票代码
      const content = stockCodes.join(',');
      
      // 创建Blob对象
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // 创建下载链接并点击
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.strategy_name || 'strategy_result'}_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      
      // 清理
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('导出结果失败:', error);
    }
  };

  return (
    <Card className="strategy-result" loading={loading}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4}>{result.strategy_name} 策略结果</Title>
        <Button 
          icon={<DownloadOutlined />} 
          onClick={handleExportResult}
          title="导出结果"
        >
          导出结果
        </Button>
      </div>
      
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic 
            title="匹配数量" 
            value={filteredItems.length} 
            suffix={targetType === 'stock' ? '只股票' : '个指数'} 
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="执行时间" 
            value={result.execution_time.toFixed(3)} 
            suffix="秒"
            prefix={<ClockCircleOutlined />} 
          />
        </Col>
        <Col span={6}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ marginBottom: 4 }}>市场筛选：</span>
            <Select
              value={marketFilter}
              onChange={setMarketFilter}
              options={marketOptions}
              style={{ width: '100%' }}
              suffixIcon={<FilterOutlined />}
            />
          </div>
        </Col>
        <Col span={6}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ marginBottom: 4 }}>每页显示：</span>
            <Select
              value={pageSize}
              onChange={setPageSize}
              options={[
                { value: 10, label: '10条/页' },
                { value: 20, label: '20条/页' },
                { value: 50, label: '50条/页' },
                { value: 100, label: '100条/页' },
              ]}
              style={{ width: '100%' }}
            />
          </div>
        </Col>
      </Row>
      
      <Table 
        columns={columns} 
        dataSource={filteredItems.map((item, index) => ({ ...item, key: index }))} 
        pagination={{ 
          pageSize: pageSize,
          showSizeChanger: false
        }}
        size="middle"
        bordered
      />
    </Card>
  );
};

export default StrategyResult;
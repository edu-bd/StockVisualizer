// frontend/src/components/StrategyResult.js
/**
 * 此组件用于展示选股策略的结果。
 * 以表格形式展示符合策略条件的股票或指数。
 * Authors: hovi.hyw & AI
 * Date: 2025-03-12
 */

import React, { useState } from 'react';
import { Table, Card, Typography, Tag, Tooltip, Statistic, Row, Col, Select, Button } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, DownloadOutlined } from '@ant-design/icons';
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
  // 如果没有结果，则不显示
  if (!result) return null;

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

  // 导出结果为JSON文件
  const handleExportResult = () => {
    try {
      // 创建要导出的数据对象
      const exportData = {
        strategy_name: result.strategy_name,
        execution_time: result.execution_time,
        total: result.total,
        target_type: targetType,
        items: result.items,
        export_date: new Date().toISOString()
      };
      
      // 创建Blob对象
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // 创建下载链接并点击
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.strategy_name || 'strategy_result'}_${new Date().toISOString().slice(0, 10)}.json`;
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
        <Col span={8}>
          <Statistic 
            title="匹配数量" 
            value={result.total} 
            suffix={targetType === 'stock' ? '只股票' : '个指数'} 
          />
        </Col>
        <Col span={8}>
          <Statistic 
            title="执行时间" 
            value={result.execution_time.toFixed(3)} 
            suffix="秒"
            prefix={<ClockCircleOutlined />} 
          />
        </Col>
        <Col span={8}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 8 }}>每页显示：</span>
            <Select
              value={pageSize}
              onChange={setPageSize}
              options={[
                { value: 10, label: '10条/页' },
                { value: 20, label: '20条/页' },
                { value: 50, label: '50条/页' },
                { value: 100, label: '100条/页' },
              ]}
              style={{ width: 120 }}
            />
          </div>
        </Col>
      </Row>
      
      <Table 
        columns={columns} 
        dataSource={result.items.map((item, index) => ({ ...item, key: index }))} 
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
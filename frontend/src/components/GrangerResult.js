// frontend/src/components/GrangerResult.js
/**
 * 格兰杰因果检验结果展示组件
 * 用于展示格兰杰因果检验的结果
 * Authors: hovi.hyw & AI
 * Date: 2025-03-12
 */

import React from 'react';
import { Table, Typography, Tag, Tooltip, Collapse, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * 格兰杰因果检验结果展示组件
 * @param {Object} props - 组件属性
 * @param {Object} props.result - 格兰杰因果检验结果
 * @returns {JSX.Element} 格兰杰因果检验结果展示组件
 */
const GrangerResult = ({ result }) => {
  if (!result) return null;

  // 提取结果数据
  const { stock_symbol, stock_name, max_lag, significance_level, results, execution_time } = result;

  // 格式化执行时间
  const formattedExecutionTime = execution_time.toFixed(2);

  // 表格列定义
  const columns = [
    {
      title: '指数代码',
      dataIndex: 'index_symbol',
      key: 'index_symbol',
      width: 120,
    },
    {
      title: '指数名称',
      dataIndex: 'index_name',
      key: 'index_name',
      width: 150,
    },
    {
      title: (
        <span>
          股票对指数的影响
          <Tooltip title="检验股票价格变动是否会导致指数价格变动">
            <QuestionCircleOutlined style={{ marginLeft: 5 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'stock_to_index',
      key: 'stock_to_index',
      width: 200,
      render: (_, record) => renderCausalityResult(record.stock_to_index_result),
    },
    {
      title: (
        <span>
          指数对股票的影响
          <Tooltip title="检验指数价格变动是否会导致股票价格变动">
            <QuestionCircleOutlined style={{ marginLeft: 5 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'index_to_stock',
      key: 'index_to_stock',
      width: 200,
      render: (_, record) => renderCausalityResult(record.index_to_stock_result),
    },
    {
      title: '最小P值',
      dataIndex: 'min_p_value',
      key: 'min_p_value',
      width: 100,
      render: (_, record) => {
        const stockToIndexP = record.stock_to_index_result?.conclusion?.min_p_value;
        const indexToStockP = record.index_to_stock_result?.conclusion?.min_p_value;
        
        // 找出最小的P值
        let minP = null;
        if (stockToIndexP !== null && indexToStockP !== null) {
          minP = Math.min(stockToIndexP || 1, indexToStockP || 1);
        } else if (stockToIndexP !== null) {
          minP = stockToIndexP;
        } else if (indexToStockP !== null) {
          minP = indexToStockP;
        }
        
        if (minP === null) return '-';
        return minP.toFixed(4);
      },
      sorter: (a, b) => {
        const aMinP = Math.min(
          a.stock_to_index_result?.conclusion?.min_p_value || 1,
          a.index_to_stock_result?.conclusion?.min_p_value || 1
        );
        const bMinP = Math.min(
          b.stock_to_index_result?.conclusion?.min_p_value || 1,
          b.index_to_stock_result?.conclusion?.min_p_value || 1
        );
        return aMinP - bMinP;
      },
    },
  ];

  /**
   * 渲染因果关系结果
   * @param {Object} result - 因果关系结果
   * @returns {JSX.Element} 因果关系结果展示组件
   */
  const renderCausalityResult = (result) => {
    if (!result) return <Text type="secondary">未检验</Text>;
    if (result.error) return <Text type="danger">检验错误: {result.error}</Text>;

    const { conclusion } = result;
    const { has_causality, significant_lags } = conclusion;

    if (has_causality) {
      return (
        <Tooltip title={`在滞后阶数 ${significant_lags.join(', ')} 上显著`}>
          <Tag color="green" style={{ cursor: 'pointer' }}>
            <ArrowUpOutlined /> 存在因果关系
          </Tag>
        </Tooltip>
      );
    } else {
      return (
        <Tooltip title="在所有滞后阶数上均不显著">
          <Tag color="red" style={{ cursor: 'pointer' }}>
            <ArrowDownOutlined /> 不存在因果关系
          </Tag>
        </Tooltip>
      );
    }
  };

  /**
   * 渲染详细的滞后结果
   * @param {Object} result - 因果关系结果
   * @returns {JSX.Element} 滞后结果展示组件
   */
  const renderLagDetails = (result) => {
    if (!result || result.error) return null;

    const lagDetails = [];
    for (let lag = 1; lag <= max_lag; lag++) {
      const lagKey = `lag_${lag}`;
      if (result[lagKey]) {
        const { f_value, p_value, is_significant } = result[lagKey];
        lagDetails.push({
          lag,
          f_value,
          p_value,
          is_significant,
        });
      }
    }

    const lagColumns = [
      {
        title: '滞后阶数',
        dataIndex: 'lag',
        key: 'lag',
      },
      {
        title: 'F统计量',
        dataIndex: 'f_value',
        key: 'f_value',
        render: (value) => value.toFixed(4),
      },
      {
        title: 'P值',
        dataIndex: 'p_value',
        key: 'p_value',
        render: (value) => {
          const formattedValue = value.toFixed(4);
          const color = value < significance_level ? '#ff4d4f' : '#000000';
          return <span style={{ color }}>{formattedValue}</span>;
        },
      },
      {
        title: '显著性',
        dataIndex: 'is_significant',
        key: 'is_significant',
        render: (value) => (
          value ? 
            <Tag color="green">显著</Tag> : 
            <Tag color="red">不显著</Tag>
        ),
      },
    ];

    return (
      <Table 
        dataSource={lagDetails} 
        columns={lagColumns} 
        rowKey="lag"
        size="small"
        pagination={false}
      />
    );
  };

  return (
    <div className="granger-result">
      <div className="result-header">
        <Title level={4}>{stock_name || stock_symbol} 与指数的格兰杰因果关系</Title>
        <Paragraph>
          <Text strong>检验参数：</Text> 最大滞后阶数 {max_lag}，显著性水平 {significance_level}，
          执行时间 {formattedExecutionTime} 秒
        </Paragraph>
      </div>

      <Table 
        dataSource={results} 
        columns={columns}
        rowKey="index_symbol"
        expandable={{
          expandedRowRender: (record) => {
            return (
              <Collapse ghost>
                {record.stock_to_index_result && !record.stock_to_index_result.error && (
                  <Panel header="股票对指数影响的详细结果" key="stock_to_index">
                    {renderLagDetails(record.stock_to_index_result)}
                  </Panel>
                )}
                {record.index_to_stock_result && !record.index_to_stock_result.error && (
                  <Panel header="指数对股票影响的详细结果" key="index_to_stock">
                    {renderLagDetails(record.index_to_stock_result)}
                  </Panel>
                )}
              </Collapse>
            );
          },
        }}
        pagination={false}
      />

      <div className="result-summary" style={{ marginTop: 20 }}>
        <Statistic 
          title="检验的指数总数" 
          value={results.length} 
          style={{ display: 'inline-block', margin: '0 20px' }}
        />
        <Statistic 
          title="存在因果关系的指数数量" 
          value={results.filter(r => 
            (r.stock_to_index_result?.conclusion?.has_causality || 
             r.index_to_stock_result?.conclusion?.has_causality)
          ).length} 
          style={{ display: 'inline-block', margin: '0 20px' }}
        />
      </div>
    </div>
  );
};

export default GrangerResult;
// frontend/src/pages/GrangerPage.js
/**
 * 格兰杰因果检验页面组件
 * 提供用户输入参数并查看格兰杰因果检验结果的界面
 * Authors: hovi.hyw & AI
 * Date: 2025-03-12
 */

import React, { useState } from 'react';
import { Form, Input, Button, Select, InputNumber, Switch, Card, Typography, Divider, message } from 'antd';
import { SearchOutlined, BarChartOutlined } from '@ant-design/icons';
import GrangerResult from '../components/GrangerResult';
import { executeGrangerTest } from '../services/grangerService';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * 格兰杰因果检验页面组件
 * @returns {JSX.Element} 格兰杰因果检验页面组件
 */
const GrangerPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // 预设股票代码为sz002119
  const defaultStockSymbol = 'sz002119';

  // 初始化表单值
  React.useEffect(() => {
    form.setFieldsValue({
      stock_symbol: defaultStockSymbol,
      max_lag: 5,
      test_direction: 'both',
      significance_level: 0.05,
      exclude_suspension: true
    });
  }, [form]);

  /**
   * 执行格兰杰因果检验
   * @param {Object} values - 表单值
   */
  const handleSubmit = async (values) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await executeGrangerTest(values);
      setResult(response);
      message.success('格兰杰因果检验执行成功');
    } catch (error) {
      message.error(`格兰杰因果检验执行失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="granger-page">
      <div className="page-header">
        <Title level={2}>格兰杰因果检验</Title>
        <Text>分析股票与指数之间的格兰杰因果关系，探索它们之间的相互影响</Text>
      </div>

      <Card className="granger-form-card" title="检验参数设置" bordered={true}>
        <Form
          form={form}
          name="granger_test"
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="stock_symbol"
            label="股票代码"
            rules={[{ required: true, message: '请输入股票代码' }]}
          >
            <Input 
              placeholder="请输入股票代码，如：sz002119" 
              prefix={<SearchOutlined />} 
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="max_lag"
            label="最大滞后阶数"
            rules={[{ required: true, message: '请输入最大滞后阶数' }]}
            tooltip="滞后阶数表示分析时考虑的历史数据长度，通常设置为5-10之间"
          >
            <InputNumber min={1} max={20} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="test_direction"
            label="检验方向"
            rules={[{ required: true, message: '请选择检验方向' }]}
          >
            <Select placeholder="请选择检验方向">
              <Option value="stock_to_index">股票对指数的影响</Option>
              <Option value="index_to_stock">指数对股票的影响</Option>
              <Option value="both">双向检验</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="significance_level"
            label="显著性水平"
            rules={[{ required: true, message: '请输入显著性水平' }]}
            tooltip="显著性水平通常设置为0.05或0.01，表示拒绝原假设的概率阈值"
          >
            <InputNumber min={0.01} max={0.1} step={0.01} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="exclude_suspension"
            label="剔除停牌日期数据"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<BarChartOutlined />}
              block
            >
              执行格兰杰因果检验
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Divider />

      {result && (
        <Card className="granger-result-card" title="检验结果" bordered={true}>
          <GrangerResult result={result} />
        </Card>
      )}
    </div>
  );
};

export default GrangerPage;
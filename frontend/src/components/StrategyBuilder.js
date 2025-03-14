// frontend/src/components/StrategyBuilder.js
/**
 * 此组件用于构建选股策略。
 * 提供用户友好的界面来创建和配置选股策略。
 * Authors: hovi.hyw & AI
 * Date: 2025-03-12
 */

import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Radio,
  Divider,
  Space,
  Typography,
  Tooltip,
  Alert,
  DatePicker,
  Row,
  Col,
  message
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, QuestionCircleOutlined, SaveOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import strategyService from '../services/strategyService';
import moment from 'moment';
import './StrategyBuilder.css';
const { Title, Text } = Typography;
const { Option } = Select;

/**
 * 选股策略构建器组件
 * @param {Object} props - 组件属性
 * @param {Function} props.onExecute - 执行策略的回调函数
 * @param {string} props.targetType - 目标类型，支持 'stock' 和 'index'
 */
const StrategyBuilder = ({ onExecute, targetType = 'stock' }) => {
  const [form] = Form.useForm();
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 获取指标类型、比较运算符和时间周期
  const indicatorTypes = strategyService.getIndicatorTypes();
  const comparisonOperators = strategyService.getComparisonOperators();
  const timeFrames = strategyService.getTimeFrames();

  // 市场选项
  const marketOptions = [
    { value: 'all', label: '全部' },
    { value: 'sz', label: '深圳' },
    { value: 'sh', label: '上海' },
    { value: 'bj', label: '北京' }
  ];

  useEffect(() => {
    // 获取常用指标列表
    setIndicators(strategyService.getCommonIndicators());
  }, []);

  // 根据指标类型筛选指标
  const getFilteredIndicators = (type) => {
    if (!type) return [];
    return indicators.filter(indicator => indicator.type === type);
  };

  // 处理表单提交
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError('');

      // 构建策略对象
      const strategy = {
        name: values.name,
        description: values.description,
        market: values.market || 'all',
        date_range: values.date_range ? [
          values.date_range[0].format('YYYY-MM-DD'),
          values.date_range[1].format('YYYY-MM-DD')
        ] : null,
        conditions: values.conditions.map(condition => ({
          indicator: condition.indicator,
          indicator_type: condition.indicator_type,
          operator: condition.operator,
          value: condition.operator === 'between' ? [condition.value_low, condition.value_high] : condition.value,
          time_frame: condition.time_frame,
          days: condition.days
        })),
        logic: values.logic,
        max_stocks: values.max_stocks,
        sort_by: values.sort_by,
        sort_order: values.sort_order
      };

      // 执行策略
      onExecute(strategy, targetType);
    } catch (err) {
      setError(err.message || '执行策略失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存策略为JSON文件
  const handleSaveStrategy = () => {
    try {
      const values = form.getFieldsValue();
      
      // 构建策略对象
      const strategy = {
        name: values.name,
        description: values.description,
        market: values.market || 'all',
        date_range: values.date_range ? [
          values.date_range[0].format('YYYY-MM-DD'),
          values.date_range[1].format('YYYY-MM-DD')
        ] : null,
        conditions: values.conditions.map(condition => ({
          indicator: condition.indicator,
          indicator_type: condition.indicator_type,
          operator: condition.operator,
          value: condition.operator === 'between' ? [condition.value_low, condition.value_high] : condition.value,
          time_frame: condition.time_frame,
          days: condition.days
        })),
        logic: values.logic,
        max_stocks: values.max_stocks,
        sort_by: values.sort_by,
        sort_order: values.sort_order
      };
      
      // 创建Blob对象
      const blob = new Blob([JSON.stringify(strategy, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // 创建下载链接并点击
      const a = document.createElement('a');
      a.href = url;
      a.download = `${strategy.name || 'strategy'}.json`;
      document.body.appendChild(a);
      a.click();
      
      // 清理
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      message.success('策略保存成功');
    } catch (err) {
      setError(err.message || '保存策略失败');
      message.error('保存策略失败');
    }
  };

  // 导入策略文件
  const handleImportStrategy = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const strategy = JSON.parse(event.target.result);
            
            // 处理日期范围
            let dateRange = null;
            if (strategy.date_range && Array.isArray(strategy.date_range)) {
              dateRange = [
                strategy.date_range[0] ? moment(strategy.date_range[0]) : null,
                strategy.date_range[1] ? moment(strategy.date_range[1]) : null
              ];
            }
            
            // 处理条件
            const conditions = strategy.conditions.map(condition => {
              const result = {
                indicator_type: condition.indicator_type,
                indicator: condition.indicator,
                operator: condition.operator,
                time_frame: condition.time_frame,
                days: condition.days
              };
              
              if (condition.operator === 'between' && Array.isArray(condition.value)) {
                result.value_low = condition.value[0];
                result.value_high = condition.value[1];
              } else {
                result.value = condition.value;
              }
              
              return result;
            });
            
            // 设置表单值
            form.setFieldsValue({
              name: strategy.name,
              description: strategy.description,
              market: strategy.market,
              date_range: dateRange,
              conditions: conditions,
              logic: strategy.logic,
              max_stocks: strategy.max_stocks,
              sort_by: strategy.sort_by,
              sort_order: strategy.sort_order
            });
            
            message.success('策略导入成功');
          } catch (err) {
            setError('导入策略失败：文件格式错误');
            message.error('导入策略失败：文件格式错误');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <Card className="strategy-builder" size="small">
      <Title level={4} style={{ marginBottom: '8px' }}>构建选股策略</Title>
      <Text type="secondary">创建自定义选股策略，筛选符合条件的{targetType === 'stock' ? '股票' : '指数'}</Text>
      
      {error && <Alert message={error} type="error" showIcon style={{ marginTop: 12 }} />}
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          logic: 'AND',
          sort_order: 'desc',
          market: 'all',
          conditions: [{
            indicator_type: 'price',
            indicator: 'close',
            operator: '>',
            value: 50,
            time_frame: 'daily'
          }]
        }}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="name"
          label="策略名称"
          rules={[{ required: true, message: '请输入策略名称' }]}
        >
          <Input placeholder="输入策略名称" />
        </Form.Item>
        
        <Form.Item
          name="description"
          label="策略描述"
        >
          <Input.TextArea placeholder="输入策略描述（可选）" rows={2} />
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="market"
              label="市场选择"
            >
              <Select placeholder="选择市场" options={marketOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="date_range"
              label="日期范围"
            >
              <DatePicker.RangePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        
        <Divider orientation="left" style={{ margin: '10px 0' }}>条件设置</Divider>
        
        <div style={{ marginBottom: 12 }}>
          <Tooltip title="AND: 所有条件都必须满足; OR: 满足任一条件即可">
            <span>条件逻辑关系 <QuestionCircleOutlined /></span>
          </Tooltip>
        </div>
        
        <div className="condition-logic-selector">
          <Form.Item
            name="logic"
            noStyle
          >
            <Radio.Group>
              <Radio.Button value="AND">AND (且)</Radio.Button>
              <Radio.Button value="OR">OR (或)</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </div>
        
        <Form.List name="conditions">
          {(fields, { add, remove }) => (
            <div>
              <div className="conditions-container">
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    title={`条件 ${name + 1}`}
                    extra={
                      fields.length > 1 ? (
                        <MinusCircleOutlined onClick={() => remove(name)} />
                      ) : null
                    }
                    className="condition-card"
                  >
                    <Form.Item
                      {...restField}
                      name={[name, 'indicator_type']}
                      label="指标类型"
                      rules={[{ required: true, message: '请选择指标类型' }]}
                    >
                      <Select 
                        placeholder="选择指标类型"
                        onChange={() => {
                          // 当指标类型改变时，清空已选择的指标
                          form.setFieldsValue({
                            conditions: form.getFieldValue('conditions').map((condition, index) => {
                              if (index === name) {
                                return { ...condition, indicator: undefined };
                              }
                              return condition;
                            })
                          });
                        }}
                      >
                        {indicatorTypes.map(type => (
                          <Option key={type.value} value={type.value}>{type.label}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      {...restField}
                      name={[name, 'indicator']}
                      label="指标"
                      rules={[{ required: true, message: '请选择指标' }]}
                    >
                      <Select 
                        placeholder="选择指标"
                        disabled={!form.getFieldValue(['conditions', name, 'indicator_type'])}
                      >
                        {getFilteredIndicators(form.getFieldValue(['conditions', name, 'indicator_type']))
                          .map(indicator => (
                            <Option key={indicator.value} value={indicator.value}>{indicator.label}</Option>
                          ))}
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      {...restField}
                      name={[name, 'time_frame']}
                      label="时间周期"
                      rules={[{ required: true, message: '请选择时间周期' }]}
                    >
                      <Select placeholder="选择时间周期">
                        {timeFrames.map(frame => (
                          <Option key={frame.value} value={frame.value}>{frame.label}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      {...restField}
                      name={[name, 'operator']}
                      label="比较运算符"
                      rules={[{ required: true, message: '请选择比较运算符' }]}
                    >
                      <Select placeholder="选择比较运算符">
                        {comparisonOperators.map(op => (
                          <Option key={op.value} value={op.value}>{op.label}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    {form.getFieldValue(['conditions', name, 'operator']) === 'between' ? (
                      <Space>
                        <Form.Item
                          {...restField}
                          name={[name, 'value_low']}
                          label="最小值"
                          rules={[{ required: true, message: '请输入最小值' }]}
                        >
                          <InputNumber placeholder="最小值" style={{ width: '100%' }} />
                        </Form.Item>
                        
                        <Form.Item
                          {...restField}
                          name={[name, 'value_high']}
                          label="最大值"
                          rules={[{ required: true, message: '请输入最大值' }]}
                        >
                          <InputNumber placeholder="最大值" style={{ width: '100%' }} />
                        </Form.Item>
                      </Space>
                    ) : (
                      <Form.Item
                        {...restField}
                        name={[name, 'value']}
                        label="比较值"
                        rules={[{ required: true, message: '请输入比较值' }]}
                      >
                        <InputNumber placeholder="输入比较值" style={{ width: '100%' }} />
                      </Form.Item>
                    )}
                    
                    <Form.Item
                      {...restField}
                      name={[name, 'days']}
                      label={
                        <span>
                          持续天数
                          <Tooltip title="指标需要连续满足条件的天数，留空表示不需要连续满足">
                            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                          </Tooltip>
                        </span>
                      }
                    >
                      <InputNumber placeholder="持续天数（可选）" min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Card>
                ))}
              </div>
              
              <Form.Item>
                <Button 
                  type="dashed" 
                  onClick={() => add()} 
                  block 
                  icon={<PlusOutlined />}
                  className="add-condition-button"
                >
                  添加条件
                </Button>
              </Form.Item>
            </div>
          )}
        </Form.List>
        
        <Divider orientation="left">结果设置</Divider>
        
        <Form.Item
          name="sort_by"
          label="排序指标"
        >
          <Select placeholder="选择排序指标（可选）" allowClear>
            {indicators.map(indicator => (
              <Option key={indicator.value} value={indicator.value}>{indicator.label}</Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item
          name="sort_order"
          label="排序顺序"
        >
          <Radio.Group>
            <Radio.Button value="desc">降序</Radio.Button>
            <Radio.Button value="asc">升序</Radio.Button>
          </Radio.Group>
        </Form.Item>
        
        <Form.Item
          name="max_stocks"
          label="最大结果数量"
        >
          <InputNumber placeholder="最大结果数量（可选）" min={1} style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button type="primary" htmlType="submit" loading={loading}>
              执行策略
            </Button>
            <Space>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={handleSaveStrategy}
                title="保存策略"
              >
                保存策略
              </Button>
              <Button 
                icon={<UploadOutlined />} 
                onClick={handleImportStrategy}
                title="导入策略"
              >
                导入策略
              </Button>
            </Space>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default StrategyBuilder;
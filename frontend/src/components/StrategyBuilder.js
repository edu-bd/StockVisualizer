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
import { PlusOutlined, MinusCircleOutlined, QuestionCircleOutlined, SaveOutlined, UploadOutlined, DownloadOutlined, PlayCircleOutlined, ThunderboltOutlined, RocketOutlined } from '@ant-design/icons';
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <Title level={4} style={{ marginBottom: '4px' }}>构建选股策略</Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>创建自定义选股策略，筛选符合条件的{targetType === 'stock' ? '股票' : '指数'}</Text>
        </div>
        <div>
          <Button 
            icon={<SaveOutlined />} 
            onClick={handleSaveStrategy}
            title="保存策略"
            size="small"
            type="default"
            style={{ borderRadius: '4px', marginRight: '8px' }}
          >
            保存
          </Button>
          <Button 
            icon={<UploadOutlined />} 
            onClick={handleImportStrategy}
            title="导入策略"
            size="small"
            type="default"
            style={{ borderRadius: '4px', marginRight: '8px' }}
          >
            导入
          </Button>
          <Button 
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => form.submit()}
            loading={loading}
            style={{ borderRadius: '4px' }}
            size="middle"
          >
            执行策略
          </Button>
        </div>
      </div>
      
      {error && <Alert message={error} type="error" showIcon style={{ marginTop: 8, marginBottom: 8 }} />}
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          logic: 'AND',
          sort_order: 'desc',
          market: 'all',
          date_range: [moment('2024-01-01'), moment('2025-01-01')],
          conditions: [{
            indicator_type: 'price',
            indicator: 'close',
            operator: '>',
            value: 50,
            time_frame: 'daily'
          }]
        }}
        style={{ marginTop: 8 }}
        size="small"
      >
        <Row gutter={8}>
          <Col span={24}>
            <Form.Item
              name="name"
              label="策略名称"
              rules={[{ required: true, message: '请输入策略名称' }]}
            >
              <Input placeholder="输入策略名称" />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={8}>
          <Col span={12}>
            <Form.Item
              name="description"
              label="策略描述"
            >
              <Input.TextArea placeholder="输入策略描述（可选）" rows={1} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="date_range"
              label="日期范围"
            >
              <DatePicker.RangePicker style={{ width: '100%' }} size="small" />
            </Form.Item>
          </Col>
        </Row>
        
        <div style={{ marginBottom: '8px' }}>
          <Divider orientation="left" style={{ margin: '8px 0', fontSize: '14px' }}>条件设置</Divider>
        </div>
        
        <div style={{ marginBottom: 8 }}>
          <Tooltip title="AND: 所有条件都必须满足; OR: 满足任一条件即可">
            <span style={{ fontSize: '12px' }}>条件逻辑关系 <QuestionCircleOutlined /></span>
          </Tooltip>
          <Form.Item
            name="logic"
            noStyle
          >
            <Radio.Group size="small" style={{ marginLeft: 8 }}>
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
                    <Row gutter={8}>
                      <Col span={12}>
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
                            size="small"
                          >
                            {indicatorTypes.map(type => (
                              <Option key={type.value} value={type.value}>{type.label}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'indicator']}
                          label="指标"
                          rules={[{ required: true, message: '请选择指标' }]}
                        >
                          <Select 
                            placeholder="选择指标"
                            disabled={!form.getFieldValue(['conditions', name, 'indicator_type'])}
                            size="small"
                          >
                            {getFilteredIndicators(form.getFieldValue(['conditions', name, 'indicator_type']))
                              .map(indicator => (
                                <Option key={indicator.value} value={indicator.value}>{indicator.label}</Option>
                              ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <Row gutter={8}>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'time_frame']}
                          label="时间周期"
                          rules={[{ required: true, message: '请选择时间周期' }]}
                        >
                          <Select placeholder="选择时间周期" size="small">
                            {timeFrames.map(frame => (
                              <Option key={frame.value} value={frame.value}>{frame.label}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'operator']}
                          label="比较运算符"
                          rules={[{ required: true, message: '请选择比较运算符' }]}
                        >
                          <Select placeholder="选择比较运算符" size="small">
                            {comparisonOperators.map(op => (
                              <Option key={op.value} value={op.value}>{op.label}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      
                      {form.getFieldValue(['conditions', name, 'operator']) === 'between' ? (
                        <Col span={8}>
                          <Row gutter={4}>
                            <Col span={12}>
                              <Form.Item
                                {...restField}
                                name={[name, 'value_low']}
                                label="最小值"
                                rules={[{ required: true, message: '请输入最小值' }]}
                              >
                                <InputNumber placeholder="最小值" style={{ width: '100%' }} size="small" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                {...restField}
                                name={[name, 'value_high']}
                                label="最大值"
                                rules={[{ required: true, message: '请输入最大值' }]}
                              >
                                <InputNumber placeholder="最大值" style={{ width: '100%' }} size="small" />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Col>
                      ) : (
                        <Col span={8}>
                          <Form.Item
                            {...restField}
                            name={[name, 'value']}
                            label="比较值"
                            rules={[{ required: true, message: '请输入比较值' }]}
                          >
                            <InputNumber placeholder="输入比较值" style={{ width: '100%' }} size="small" />
                          </Form.Item>
                        </Col>
                      )}
                    </Row>
                    
                    <Form.Item
                      {...restField}
                      name={[name, 'days']}
                      label={
                        <span style={{ fontSize: '12px' }}>
                          持续天数
                          <Tooltip title="指标需要连续满足条件的天数，留空表示不需要连续满足">
                            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                          </Tooltip>
                        </span>
                      }
                    >
                      <InputNumber placeholder="持续天数（可选）" min={1} style={{ width: '100%' }} size="small" />
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
                  size="small"
                >
                  添加条件
                </Button>
              </Form.Item>
            </div>
          )}
        </Form.List>
        
        <Divider orientation="left" style={{ margin: '8px 0', fontSize: '14px' }}>结果设置</Divider>
        
        <Row gutter={8}>
          <Col span={8}>
            <Form.Item
              name="sort_by"
              label="排序指标"
            >
              <Select placeholder="选择排序指标（可选）" allowClear size="small">
                {indicators.map(indicator => (
                  <Option key={indicator.value} value={indicator.value}>{indicator.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="sort_order"
              label="排序顺序"
            >
              <Radio.Group size="small">
                <Radio.Button value="desc">降序</Radio.Button>
                <Radio.Button value="asc">升序</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="max_stocks"
              label="最大结果数量"
            >
              <InputNumber placeholder="最大结果数量（可选）" min={1} style={{ width: '100%' }} size="small" />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading} 
            size="middle"
            icon={<ThunderboltOutlined />}
            style={{ borderRadius: '4px', width: '100%' }}
          >
            执行策略
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default StrategyBuilder;
// frontend/src/services/strategyService.js
/**
 * 此模块提供选股策略相关的服务功能。
 * 封装了与选股策略相关的API调用。
 * Authors: hovi.hyw & AI
 * Date: 2025-03-12
 */

import api from './api';

/**
 * 选股策略服务类
 */
const strategyService = {
  /**
   * 执行选股策略
   * @param {Object} strategy - 选股策略对象
   * @param {string} targetType - 目标类型，支持 'stock' 和 'index'
   * @returns {Promise<Object>} - 选股结果
   */
  executeStrategy: async (strategy, targetType = 'stock') => {
    try {
      const response = await api.post(`/strategies/execute?target_type=${targetType}`, strategy);
      return response;
    } catch (error) {
      console.error('执行选股策略失败:', error);
      throw error;
    }
  },

  /**
   * 执行股票选股策略
   * @param {Object} strategy - 选股策略对象
   * @returns {Promise<Object>} - 选股结果
   */
  executeStockStrategy: async (strategy) => {
    try {
      const response = await api.post('/strategies/execute/stock', strategy);
      return response;
    } catch (error) {
      console.error('执行股票选股策略失败:', error);
      throw error;
    }
  },

  /**
   * 执行指数选股策略
   * @param {Object} strategy - 选股策略对象
   * @returns {Promise<Object>} - 选股结果
   */
  executeIndexStrategy: async (strategy) => {
    try {
      const response = await api.post('/strategies/execute/index', strategy);
      return response;
    } catch (error) {
      console.error('执行指数选股策略失败:', error);
      throw error;
    }
  },

  /**
   * 获取支持的指标类型
   * @returns {Array} - 指标类型列表
   */
  getIndicatorTypes: () => {
    return [
      { value: 'price', label: '价格指标' },
      { value: 'volume', label: '成交量指标' },
      { value: 'technical', label: '技术指标' },
      { value: 'fundamental', label: '基本面指标' },
      { value: 'custom', label: '自定义指标' }
    ];
  },

  /**
   * 获取支持的比较运算符
   * @returns {Array} - 比较运算符列表
   */
  getComparisonOperators: () => {
    return [
      { value: '>', label: '大于 (>)' },
      { value: '>=', label: '大于等于 (>=)' },
      { value: '<', label: '小于 (<)' },
      { value: '<=', label: '小于等于 (<=)' },
      { value: '==', label: '等于 (==)' },
      { value: '!=', label: '不等于 (!=)' },
      { value: 'between', label: '区间 (between)' },
      { value: 'cross_above', label: '向上穿越 (cross_above)' },
      { value: 'cross_below', label: '向下穿越 (cross_below)' }
    ];
  },

  /**
   * 获取支持的时间周期
   * @returns {Array} - 时间周期列表
   */
  getTimeFrames: () => {
    return [
      { value: 'daily', label: '日线 (daily)' },
      { value: 'weekly', label: '周线 (weekly)' },
      { value: 'monthly', label: '月线 (monthly)' }
    ];
  },

  /**
   * 获取常用指标列表
   * @returns {Array} - 指标列表
   */
  getCommonIndicators: () => {
    return [
      { value: 'close', label: '收盘价', type: 'price' },
      { value: 'open', label: '开盘价', type: 'price' },
      { value: 'high', label: '最高价', type: 'price' },
      { value: 'low', label: '最低价', type: 'price' },
      { value: 'volume', label: '成交量', type: 'volume' },
      { value: 'ma5', label: '5日均线', type: 'technical' },
      { value: 'ma10', label: '10日均线', type: 'technical' },
      { value: 'ma20', label: '20日均线', type: 'technical' },
      { value: 'ma60', label: '60日均线', type: 'technical' },
      { value: 'rsi', label: 'RSI指标', type: 'technical' },
      { value: 'macd', label: 'MACD指标', type: 'technical' },
      { value: 'kdj', label: 'KDJ指标', type: 'technical' },
      { value: 'pe', label: '市盈率', type: 'fundamental' },
      { value: 'pb', label: '市净率', type: 'fundamental' },
      { value: 'roe', label: 'ROE', type: 'fundamental' }
    ];
  }
};

export default strategyService;
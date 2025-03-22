// frontend/src/services/grangerService.js
/**
 * 此模块提供格兰杰因果检验相关的服务。
 * 封装了执行格兰杰因果检验的方法。
 * Authors: hovi.hyw & AI
 * Date: 2025-03-12
 */

import api from './api';

/**
 * 执行格兰杰因果检验
 * @param {Object} params - 请求参数
 * @param {string} params.stock_symbol - 股票代码
 * @param {number} params.max_lag - 最大滞后阶数，默认5
 * @param {string} params.test_direction - 检验方向，可选值：stock_to_index, index_to_stock, both
 * @param {number} params.significance_level - 显著性水平，默认0.05
 * @param {boolean} params.exclude_suspension - 是否剔除停牌日期数据，默认true
 * @returns {Promise<Object>} 格兰杰因果检验结果
 */
export const executeGrangerTest = async (params) => {
  const { 
    stock_symbol, 
    max_lag = 5, 
    test_direction = 'both', 
    significance_level = 0.05, 
    exclude_suspension = true 
  } = params;

  try {
    const response = await api.post('/granger/test', {
      stock_symbol,
      max_lag,
      test_direction,
      significance_level,
      exclude_suspension
    });
    return response;
  } catch (error) {
    console.error('执行格兰杰因果检验失败:', error);
    throw error;
  }
};
# backend/services/granger_service.py
"""
此模块提供格兰杰因果检验相关的服务功能。
包括执行格兰杰因果检验和处理结果的服务方法。
Authors: hovi.hyw & AI
Date: 2025-03-12
"""

import pandas as pd
import numpy as np
import time
from datetime import date, timedelta
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional, Tuple

# 导入statsmodels库用于格兰杰因果检验
from statsmodels.tsa.stattools import grangercausalitytests

from backend.models.granger_model import GrangerRequest, GrangerResponse, GrangerResultItem, GrangerTestDirection
from backend.database.queries import get_stock_kline_data, get_index_kline_data, get_stock_info, get_index_info


class GrangerService:
    """
    格兰杰因果检验服务类。
    提供执行格兰杰因果检验和处理结果的服务方法。

    Methods:
        execute_granger_test: 执行格兰杰因果检验
        get_stock_index_data: 获取股票和指数的时间序列数据
        run_granger_test: 运行格兰杰因果检验

    Examples:
        >>> from sqlalchemy.orm import Session
        >>> service = GrangerService()
        >>> request = GrangerRequest(stock_symbol="sz002119", max_lag=5)
        >>> result = service.execute_granger_test(db, request)
    """

    def execute_granger_test(self, db: Session, request: GrangerRequest) -> GrangerResponse:
        """
        执行格兰杰因果检验。

        Args:
            db (Session): 数据库会话
            request (GrangerRequest): 格兰杰因果检验请求

        Returns:
            GrangerResponse: 格兰杰因果检验结果
        """
        start_time = time.time()
        
        # 获取股票信息
        stock_info = get_stock_info(db, request.stock_symbol)
        if not stock_info:
            raise ValueError(f"Stock with symbol {request.stock_symbol} not found")
        
        # 获取所有指数列表
        indices_query = "SELECT DISTINCT symbol, name FROM index_daily_data"
        indices = pd.read_sql(indices_query, db.bind)
        
        # 准备结果列表
        results = []
        
        # 对每个指数执行格兰杰因果检验
        for _, index_row in indices.iterrows():
            index_symbol = index_row['symbol']
            index_name = index_row['name']
            
            try:
                # 获取股票和指数的时间序列数据
                stock_data, index_data = self.get_stock_index_data(
                    db, 
                    request.stock_symbol, 
                    index_symbol, 
                    request.exclude_suspension
                )
                
                if stock_data.empty or index_data.empty:
                    continue
                
                # 创建结果项
                result_item = GrangerResultItem(
                    index_symbol=index_symbol,
                    index_name=index_name
                )
                
                # 根据测试方向执行格兰杰因果检验
                if request.test_direction in [GrangerTestDirection.STOCK_TO_INDEX, GrangerTestDirection.BOTH]:
                    # 测试股票是否是指数的格兰杰原因
                    stock_to_index_result = self.run_granger_test(
                        stock_data, 
                        index_data, 
                        request.max_lag, 
                        request.significance_level
                    )
                    result_item.stock_to_index_result = stock_to_index_result
                
                if request.test_direction in [GrangerTestDirection.INDEX_TO_STOCK, GrangerTestDirection.BOTH]:
                    # 测试指数是否是股票的格兰杰原因
                    index_to_stock_result = self.run_granger_test(
                        index_data, 
                        stock_data, 
                        request.max_lag, 
                        request.significance_level
                    )
                    result_item.index_to_stock_result = index_to_stock_result
                
                results.append(result_item)
            except Exception as e:
                # 记录错误但继续处理其他指数
                print(f"Error processing index {index_symbol}: {str(e)}")
                continue
        
        # 计算执行时间
        execution_time = time.time() - start_time
        
        # 构建响应
        response = GrangerResponse(
            stock_symbol=request.stock_symbol,
            stock_name=stock_info.get('name', ''),
            max_lag=request.max_lag,
            significance_level=request.significance_level,
            results=results,
            execution_time=execution_time
        )
        
        return response

    def get_stock_index_data(self, db: Session, stock_symbol: str, index_symbol: str, 
                            exclude_suspension: bool = True) -> Tuple[pd.Series, pd.Series]:
        """
        获取股票和指数的时间序列数据。

        Args:
            db (Session): 数据库会话
            stock_symbol (str): 股票代码
            index_symbol (str): 指数代码
            exclude_suspension (bool): 是否剔除停牌日期数据

        Returns:
            Tuple[pd.Series, pd.Series]: 股票收盘价序列和指数收盘价序列
        """
        # 获取过去3年的数据
        end_date = date.today()
        start_date = end_date - timedelta(days=3*365)
        
        # 获取股票K线数据
        stock_kline = get_stock_kline_data(db, stock_symbol, start_date, end_date)
        if not stock_kline:
            return pd.Series(), pd.Series()
        
        # 获取指数K线数据
        index_kline = get_index_kline_data(db, index_symbol, start_date, end_date)
        if not index_kline:
            return pd.Series(), pd.Series()
        
        # 转换为DataFrame
        stock_df = pd.DataFrame(stock_kline)
        index_df = pd.DataFrame(index_kline)
        
        # 设置日期索引
        stock_df['date'] = pd.to_datetime(stock_df['date'])
        index_df['date'] = pd.to_datetime(index_df['date'])
        stock_df.set_index('date', inplace=True)
        index_df.set_index('date', inplace=True)
        
        # 如果需要剔除停牌日期数据
        if exclude_suspension:
            # 找出股票停牌的日期（成交量为0或者缺失的日期）
            non_suspension_dates = stock_df[stock_df['volume'] > 0].index
            stock_df = stock_df.loc[non_suspension_dates]
            index_df = index_df.loc[index_df.index.isin(non_suspension_dates)]
        
        # 确保两个序列有相同的日期索引
        common_dates = stock_df.index.intersection(index_df.index)
        stock_df = stock_df.loc[common_dates]
        index_df = index_df.loc[common_dates]
        
        # 按日期排序
        stock_df.sort_index(inplace=True)
        index_df.sort_index(inplace=True)
        
        # 提取收盘价序列
        stock_series = stock_df['close']
        index_series = index_df['close']
        
        return stock_series, index_series

    def run_granger_test(self, x_series: pd.Series, y_series: pd.Series, 
                        max_lag: int, significance_level: float) -> Dict[str, Any]:
        """
        运行格兰杰因果检验。

        Args:
            x_series (pd.Series): 自变量序列
            y_series (pd.Series): 因变量序列
            max_lag (int): 最大滞后阶数
            significance_level (float): 显著性水平

        Returns:
            Dict[str, Any]: 格兰杰因果检验结果
        """
        # 准备数据
        data = pd.concat([x_series, y_series], axis=1)
        data.columns = ['x', 'y']
        
        # 计算收益率（对数差分）以确保平稳性
        data = data.apply(lambda x: np.log(x).diff().dropna())
        
        # 执行格兰杰因果检验
        try:
            test_result = grangercausalitytests(data, maxlag=max_lag, verbose=False)
            
            # 处理结果
            result = {}
            for lag in range(1, max_lag + 1):
                # 获取F统计量和p值
                f_value = test_result[lag][0]['ssr_ftest'][0]
                p_value = test_result[lag][0]['ssr_ftest'][1]
                
                # 判断是否显著
                is_significant = p_value < significance_level
                
                result[f'lag_{lag}'] = {
                    'f_value': float(f_value),
                    'p_value': float(p_value),
                    'is_significant': is_significant
                }
            
            # 添加总体结论
            significant_lags = [lag for lag in range(1, max_lag + 1) 
                              if result[f'lag_{lag}']['is_significant']]
            
            result['conclusion'] = {
                'has_causality': len(significant_lags) > 0,
                'significant_lags': significant_lags,
                'min_p_value': min([result[f'lag_{lag}']['p_value'] for lag in range(1, max_lag + 1)])
            }
            
            return result
        except Exception as e:
            # 返回错误信息
            return {
                'error': str(e),
                'conclusion': {
                    'has_causality': False,
                    'significant_lags': [],
                    'min_p_value': None
                }
            }
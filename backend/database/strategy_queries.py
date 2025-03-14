# backend/database/strategy_queries.py
"""
此模块包含与选股策略相关的数据库查询函数。
提供了根据不同策略条件查询股票的功能。
Authors: hovi.hyw & AI
Date: 2025-03-12
"""

import pandas as pd
import time
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from backend.models.strategy_model import StrategyModel, ConditionModel, IndicatorType, ComparisonOperator, TimeFrame


def execute_stock_strategy(db: Session, strategy: StrategyModel) -> Dict[str, Any]:
    """
    执行选股策略，返回符合条件的股票列表。

    Args:
        db (Session): 数据库会话
        strategy (StrategyModel): 选股策略模型

    Returns:
        Dict[str, Any]: 包含选股结果的字典
    """
    start_time = time.time()
    
    # 构建基础查询
    base_query = """
    SELECT DISTINCT s.symbol, 
           first_value(s.close) OVER (PARTITION BY s.symbol ORDER BY s.date DESC) as latest_price
    FROM stock_daily_data s
    """
    
    # 处理条件
    where_clauses = []
    params = {}
    
    # 添加市场筛选条件
    if strategy.market and strategy.market != 'all':
        if strategy.market == 'sh':
            where_clauses.append("(s.symbol LIKE '60%' OR s.symbol LIKE '68%')")
        elif strategy.market == 'sz':
            where_clauses.append("(s.symbol LIKE '00%' OR s.symbol LIKE '30%')")
        elif strategy.market == 'bj':
            where_clauses.append("(s.symbol LIKE '43%' OR s.symbol LIKE '83%' OR s.symbol LIKE '87%')")
    
    for i, condition in enumerate(strategy.conditions):
        condition_clause, condition_params = _build_condition_clause(condition, i)
        where_clauses.append(condition_clause)
        params.update(condition_params)
    
    # 组合条件
    if where_clauses:
        logic_operator = " AND " if strategy.logic == "AND" else " OR "
        # 市场筛选条件始终使用AND连接，不受logic影响
        if strategy.market and strategy.market != 'all':
            market_condition = where_clauses.pop(0)  # 提取市场条件
            if where_clauses:
                logic_operator = " AND " if strategy.logic == "AND" else " OR "
                combined_conditions = logic_operator.join(f"({clause})" for clause in where_clauses)
                base_query += f" WHERE ({market_condition}) AND ({combined_conditions})"
            else:
                base_query += f" WHERE ({market_condition})"
        else:
            if where_clauses:
                logic_operator = " AND " if strategy.logic == "AND" else " OR "
                base_query += " WHERE " + logic_operator.join(f"({clause})" for clause in where_clauses)
    
    # 添加排序
    if strategy.sort_by:
        sort_direction = "DESC" if strategy.sort_order == "desc" else "ASC"
        base_query += f" ORDER BY {strategy.sort_by} {sort_direction}"
    
    # 添加限制
    if strategy.max_stocks:
        base_query += f" LIMIT {strategy.max_stocks}"
    
    # 执行查询
    query = text(base_query)
    result = pd.read_sql(query, db.bind, params=params)
    
    # 获取匹配详情
    match_details = []
    for _, row in result.iterrows():
        details = {}
        for i, condition in enumerate(strategy.conditions):
            details[f"condition_{i+1}"] = {
                "indicator": condition.indicator,
                "operator": condition.operator,
                "value": condition.value
            }
        match_details.append(details)
    
    # 构建结果
    items = []
    for i, row in result.iterrows():
        items.append({
            "symbol": row["symbol"],
            "latest_price": float(row["latest_price"]),
            "match_details": match_details[i] if i < len(match_details) else {}
        })
    
    execution_time = time.time() - start_time
    
    return {
        "strategy_name": strategy.name,
        "total": len(items),
        "items": items,
        "execution_time": execution_time
    }


def execute_index_strategy(db: Session, strategy: StrategyModel) -> Dict[str, Any]:
    """
    执行指数选股策略，返回符合条件的指数列表。

    Args:
        db (Session): 数据库会话
        strategy (StrategyModel): 选股策略模型

    Returns:
        Dict[str, Any]: 包含选股结果的字典
    """
    start_time = time.time()
    
    # 构建基础查询
    base_query = """
    SELECT DISTINCT i.symbol, i.name,
           first_value(i.close) OVER (PARTITION BY i.symbol ORDER BY i.date DESC) as latest_price
    FROM index_daily_data i
    """
    
    # 处理条件
    where_clauses = []
    params = {}
    
    # 添加市场筛选条件
    if strategy.market and strategy.market != 'all':
        if strategy.market == 'sh':
            where_clauses.append("(i.symbol LIKE '00%' OR i.symbol LIKE '88%')")
        elif strategy.market == 'sz':
            where_clauses.append("(i.symbol LIKE '39%')")
        elif strategy.market == 'bj':
            where_clauses.append("(i.symbol LIKE '89%')")
    
    for i, condition in enumerate(strategy.conditions):
        condition_clause, condition_params = _build_condition_clause(condition, i, is_index=True)
        where_clauses.append(condition_clause)
        params.update(condition_params)
    
    # 组合条件
    if where_clauses:
        logic_operator = " AND " if strategy.logic == "AND" else " OR "
        # 市场筛选条件始终使用AND连接，不受logic影响
        if strategy.market and strategy.market != 'all' and len(where_clauses) > 1:
            market_condition = where_clauses[0]
            other_conditions = where_clauses[1:]
            combined_other_conditions = logic_operator.join(f"({clause})" for clause in other_conditions)
            base_query += f" WHERE {market_condition} AND ({combined_other_conditions})"
        else:
            base_query += " WHERE " + logic_operator.join(f"({clause})" for clause in where_clauses)
    
    # 添加排序
    if strategy.sort_by:
        sort_direction = "DESC" if strategy.sort_order == "desc" else "ASC"
        base_query += f" ORDER BY {strategy.sort_by} {sort_direction}"
    
    # 添加限制
    if strategy.max_stocks:
        base_query += f" LIMIT {strategy.max_stocks}"
    
    # 执行查询
    query = text(base_query)
    result = pd.read_sql(query, db.bind, params=params)
    
    # 获取匹配详情
    match_details = []
    for _, row in result.iterrows():
        details = {}
        for i, condition in enumerate(strategy.conditions):
            details[f"condition_{i+1}"] = {
                "indicator": condition.indicator,
                "operator": condition.operator,
                "value": condition.value
            }
        match_details.append(details)
    
    # 构建结果
    items = []
    for i, row in result.iterrows():
        items.append({
            "symbol": row["symbol"],
            "name": row["name"],
            "latest_price": float(row["latest_price"]),
            "match_details": match_details[i] if i < len(match_details) else {}
        })
    
    execution_time = time.time() - start_time
    
    return {
        "strategy_name": strategy.name,
        "total": len(items),
        "items": items,
        "execution_time": execution_time
    }


def _build_condition_clause(condition: ConditionModel, index: int, is_index: bool = False) -> tuple:
    """
    构建单个条件的SQL子句。

    Args:
        condition (ConditionModel): 条件模型
        index (int): 条件索引
        is_index (bool): 是否为指数数据

    Returns:
        tuple: (SQL子句, 参数字典)
    """
    table_prefix = "i." if is_index else "s."
    indicator = condition.indicator
    params = {}
    
    # 处理时间周期
    if condition.time_frame != TimeFrame.DAILY:
        # 这里需要根据时间周期进行聚合，简化起见，暂时只支持日线
        pass
    
    # 构建比较子句
    if condition.operator == ComparisonOperator.GT:
        clause = f"{table_prefix}{indicator} > :value_{index}"
        params[f"value_{index}"] = condition.value
    elif condition.operator == ComparisonOperator.GTE:
        clause = f"{table_prefix}{indicator} >= :value_{index}"
        params[f"value_{index}"] = condition.value
    elif condition.operator == ComparisonOperator.LT:
        clause = f"{table_prefix}{indicator} < :value_{index}"
        params[f"value_{index}"] = condition.value
    elif condition.operator == ComparisonOperator.LTE:
        clause = f"{table_prefix}{indicator} <= :value_{index}"
        params[f"value_{index}"] = condition.value
    elif condition.operator == ComparisonOperator.EQ:
        clause = f"{table_prefix}{indicator} = :value_{index}"
        params[f"value_{index}"] = condition.value
    elif condition.operator == ComparisonOperator.NEQ:
        clause = f"{table_prefix}{indicator} != :value_{index}"
        params[f"value_{index}"] = condition.value
    elif condition.operator == ComparisonOperator.BETWEEN:
        clause = f"{table_prefix}{indicator} BETWEEN :value_{index}_low AND :value_{index}_high"
        params[f"value_{index}_low"] = condition.value[0]
        params[f"value_{index}_high"] = condition.value[1]
    elif condition.operator in [ComparisonOperator.CROSS_ABOVE, ComparisonOperator.CROSS_BELOW]:
        # 穿越条件需要特殊处理，这里简化处理
        if condition.operator == ComparisonOperator.CROSS_ABOVE:
            clause = f"{table_prefix}{indicator} > :value_{index}"
        else:
            clause = f"{table_prefix}{indicator} < :value_{index}"
        params[f"value_{index}"] = condition.value
    else:
        clause = "1=1"  # 默认为真
    
    # 处理持续天数
    if condition.days and condition.days > 1:
        # 这里需要处理持续满足条件的情况，简化起见，暂不实现
        pass
    
    return clause, params
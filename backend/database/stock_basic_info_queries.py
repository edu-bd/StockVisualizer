# backend/database/stock_basic_info_queries.py
"""
此模块包含与股票基本信息表相关的数据库查询函数。
提供了获取和更新股票基本信息的功能。
Authors: hovi.hyw & AI
Date: 2025-03-12
"""

import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from models.stock_basic_info_model import StockBasicInfo, StockBasicInfoModel


def get_stock_basic_info(db: Session, symbol: str) -> Optional[Dict[str, Any]]:
    """
    获取股票基本信息。

    Args:
        db (Session): 数据库会话
        symbol (str): 股票代码

    Returns:
        Optional[Dict[str, Any]]: 股票基本信息，如果不存在则返回None

    Examples:
        >>> from sqlalchemy.orm import Session
        >>> def get_info(db: Session, symbol: str):
        >>>     return get_stock_basic_info(db, symbol)
    """
    query = f"""
    SELECT symbol, name, morning_auction_volume, closing_auction_volume
    FROM stock_basic_info
    WHERE symbol = '{symbol}'
    """

    result = pd.read_sql(query, db.bind)
    if result.empty:
        return None

    return result.iloc[0].to_dict()


def get_stock_basic_info_list(db: Session, page: int = 1, page_size: int = 20, search: str | None = None) -> Dict[str, Any]:
    """
    获取股票基本信息列表。

    Args:
        db (Session): 数据库会话
        page (int): 页码，默认为1
        page_size (int): 每页数量，默认为20
        search (str, optional): 搜索关键字，可搜索股票代码或名称

    Returns:
        Dict[str, Any]: 包含股票基本信息列表和分页信息的字典
    """
    # 基础查询
    base_query = """
    SELECT symbol, name, morning_auction_volume, closing_auction_volume
    FROM stock_basic_info
    """
    count_base_query = "SELECT COUNT(*) FROM stock_basic_info"

    params = {}

    # 添加搜索条件
    if search:
        base_query += " WHERE symbol LIKE :search OR name LIKE :search"
        count_base_query += " WHERE symbol LIKE :search OR name LIKE :search"
        params['search'] = f"%{search}%"

    # 添加分页
    offset = (page - 1) * page_size
    query = text(base_query + f" LIMIT {page_size} OFFSET {offset}")
    count_query = text(count_base_query)

    # 执行查询
    stocks = pd.read_sql(query, db.bind, params=params)
    total = db.execute(count_query, params).scalar()

    return {
        "items": stocks.to_dict(orient="records"),
        "total": total,
        "page": page,
        "page_size": page_size
    }


def update_stock_basic_info(db: Session, stock_info: Dict[str, Any]) -> bool:
    """
    更新股票基本信息。如果不存在则创建新记录。

    Args:
        db (Session): 数据库会话
        stock_info (Dict[str, Any]): 股票基本信息

    Returns:
        bool: 更新成功返回True，否则返回False
    """
    try:
        # 检查是否存在
        symbol = stock_info.get('symbol')
        if not symbol:
            return False

        # 构建更新语句
        query = f"""
        INSERT INTO stock_basic_info (symbol, name, morning_auction_volume, closing_auction_volume)
        VALUES (:symbol, :name, :morning_auction_volume, :closing_auction_volume)
        ON CONFLICT (symbol) DO UPDATE SET
            name = EXCLUDED.name,
            morning_auction_volume = EXCLUDED.morning_auction_volume,
            closing_auction_volume = EXCLUDED.closing_auction_volume
        """

        # 执行更新
        db.execute(text(query), stock_info)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Error updating stock basic info: {e}")
        return False


def batch_update_stock_basic_info(db: Session, stock_info_list: List[Dict[str, Any]]) -> int:
    """
    批量更新股票基本信息。

    Args:
        db (Session): 数据库会话
        stock_info_list (List[Dict[str, Any]]): 股票基本信息列表

    Returns:
        int: 成功更新的记录数
    """
    success_count = 0
    for stock_info in stock_info_list:
        if update_stock_basic_info(db, stock_info):
            success_count += 1
    return success_count
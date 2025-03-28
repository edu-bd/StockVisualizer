# backend/services/stock_basic_info_service.py
"""
此模块提供股票基本信息相关的服务功能。
包括获取和更新股票基本信息的服务方法。
Authors: hovi.hyw & AI
Date: 2025-03-12
"""

from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from database.stock_basic_info_queries import (
    get_stock_basic_info,
    get_stock_basic_info_list,
    update_stock_basic_info,
    batch_update_stock_basic_info
)


class StockBasicInfoService:
    """
    股票基本信息服务类。
    提供获取和更新股票基本信息的服务方法。

    Methods:
        get_stock_basic_info: 获取股票基本信息
        get_stock_basic_info_list: 获取股票基本信息列表
        update_stock_basic_info: 更新股票基本信息
        batch_update_stock_basic_info: 批量更新股票基本信息

    Examples:
        >>> from sqlalchemy.orm import Session
        >>> service = StockBasicInfoService()
        >>> stock_info = service.get_stock_basic_info(db, "sh600000")
    """

    def get_stock_basic_info(self, db: Session, symbol: str) -> Optional[Dict[str, Any]]:
        """
        获取股票基本信息。

        Args:
            db (Session): 数据库会话
            symbol (str): 股票代码

        Returns:
            Optional[Dict[str, Any]]: 股票基本信息，如果不存在则返回None

        Raises:
            ValueError: 如果股票不存在
        """
        # 尝试直接查询
        stock_info = get_stock_basic_info(db, symbol)
        
        # 如果没有找到数据，尝试转换股票代码格式
        if not stock_info:
            # 尝试不同的股票代码格式
            if symbol.startswith('sh') or symbol.startswith('sz') or symbol.startswith('bj'):
                # 尝试去掉前缀
                alt_symbol = symbol[2:]
                stock_info = get_stock_basic_info(db, alt_symbol)
            else:
                # 尝试添加前缀
                for prefix in ['sh', 'sz', 'bj']:
                    alt_symbol = f"{prefix}{symbol}"
                    stock_info = get_stock_basic_info(db, alt_symbol)
                    if stock_info:
                        break
        
        return stock_info

    def get_stock_basic_info_list(self, db: Session, page: int = 1, page_size: int = 20, search: str | None = None) -> Dict[str, Any]:
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
        # 安全处理search参数
        search_str = ""
        if search is not None:
            # 直接尝试转换为字符串，不管是什么类型
            try:
                search_str = str(search)
                # 如果是空字符串或只包含空格，则设为空字符串
                if not search_str.strip():
                    search_str = ""
            except Exception:
                # 如果转换失败，使用空字符串
                search_str = ""
        
        return get_stock_basic_info_list(db, page, page_size, search_str)

    def update_stock_basic_info(self, db: Session, stock_info: Dict[str, Any]) -> bool:
        """
        更新股票基本信息。如果不存在则创建新记录。

        Args:
            db (Session): 数据库会话
            stock_info (Dict[str, Any]): 股票基本信息

        Returns:
            bool: 更新成功返回True，否则返回False
        """
        return update_stock_basic_info(db, stock_info)

    def batch_update_stock_basic_info(self, db: Session, stock_info_list: List[Dict[str, Any]]) -> int:
        """
        批量更新股票基本信息。

        Args:
            db (Session): 数据库会话
            stock_info_list (List[Dict[str, Any]]): 股票基本信息列表

        Returns:
            int: 成功更新的记录数
        """
        return batch_update_stock_basic_info(db, stock_info_list)
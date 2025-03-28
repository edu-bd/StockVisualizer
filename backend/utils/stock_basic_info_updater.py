# backend/utils/stock_basic_info_updater.py
"""
此模块提供从akshare获取股票基本信息并更新到数据库的功能。
包括获取股票名称、早盘竞价量和尾盘竞价量等信息。
Authors: hovi.hyw & AI
Date: 2025-03-12
"""

import akshare as ak
import pandas as pd
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging

from services.stock_basic_info_service import StockBasicInfoService

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def update_stock_basic_info(db: Session) -> int:
    """
    从akshare获取股票基本信息并更新到数据库。

    Args:
        db (Session): 数据库会话

    Returns:
        int: 成功更新的记录数
    """
    try:
        logger.info("开始从akshare获取股票基本信息")
        
        # 从akshare获取A股股票信息
        stock_data = ak.stock_zh_a_spot()
        
        # 提取需要的字段
        stock_info_list = []
        for _, row in stock_data.iterrows():
            # 提取股票代码和名称
            symbol = row.get('代码')
            name = row.get('名称')
            
            # 确保代码和名称不为空
            if not symbol or not name:
                continue
                
            # 添加市场前缀
            if symbol.startswith('6'):
                symbol = f"sh{symbol}"
            elif symbol.startswith('0') or symbol.startswith('3'):
                symbol = f"sz{symbol}"
            elif symbol.startswith('4') or symbol.startswith('8'):
                symbol = f"bj{symbol}"
            else:
                # 跳过无法识别市场的股票
                continue
                
            # 创建股票基本信息记录
            stock_info = {
                'symbol': symbol,
                'name': name,
                'morning_auction_volume': None,  # 早盘竞价量暂时为空
                'closing_auction_volume': None   # 尾盘竞价量暂时为空
            }
            
            stock_info_list.append(stock_info)
        
        # 批量更新到数据库
        service = StockBasicInfoService()
        updated_count = service.batch_update_stock_basic_info(db, stock_info_list)
        
        logger.info(f"成功更新{updated_count}条股票基本信息记录")
        return updated_count
        
    except Exception as e:
        logger.error(f"更新股票基本信息失败: {e}")
        return 0


def update_auction_volume(db: Session, symbol: str, morning_volume: float = None, closing_volume: float = None) -> bool:
    """
    更新指定股票的早盘和尾盘竞价量。

    Args:
        db (Session): 数据库会话
        symbol (str): 股票代码
        morning_volume (float, optional): 早盘竞价量
        closing_volume (float, optional): 尾盘竞价量

    Returns:
        bool: 更新成功返回True，否则返回False
    """
    try:
        # 获取股票基本信息
        service = StockBasicInfoService()
        stock_info = service.get_stock_basic_info(db, symbol)
        
        if not stock_info:
            logger.error(f"股票 {symbol} 不存在于基本信息表中")
            return False
            
        # 更新竞价量
        update_data = {
            'symbol': symbol,
            'name': stock_info.get('name'),
            'morning_auction_volume': morning_volume,
            'closing_auction_volume': closing_volume
        }
        
        # 如果参数为None，则保留原值
        if morning_volume is None and 'morning_auction_volume' in stock_info:
            update_data['morning_auction_volume'] = stock_info['morning_auction_volume']
            
        if closing_volume is None and 'closing_auction_volume' in stock_info:
            update_data['closing_auction_volume'] = stock_info['closing_auction_volume']
        
        # 更新到数据库
        result = service.update_stock_basic_info(db, update_data)
        if result:
            logger.info(f"成功更新股票 {symbol} 的竞价量信息")
        else:
            logger.error(f"更新股票 {symbol} 的竞价量信息失败")
            
        return result
        
    except Exception as e:
        logger.error(f"更新股票 {symbol} 的竞价量信息时发生错误: {e}")
        return False
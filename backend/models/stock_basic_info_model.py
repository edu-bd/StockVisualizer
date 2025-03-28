# backend/models/stock_basic_info_model.py
"""
此模块定义了股票基本信息的模型类。
包括股票代码、名称、早盘竞价量和尾盘竞价量等基本信息。
Authors: hovi.hyw & AI
Date: 2025-03-12
"""

from sqlalchemy import Column, String, Float, PrimaryKeyConstraint
from pydantic import BaseModel, ConfigDict
from typing import Optional

from database.connection import Base


class StockBasicInfo(Base):
    """
    股票基本信息数据库模型。
    对应数据库中的stock_basic_info表。

    Attributes:
        symbol (str): 股票代码
        name (str): 股票名称
        morning_auction_volume (float): 早盘竞价量
        closing_auction_volume (float): 尾盘竞价量
    """
    __tablename__ = "stock_basic_info"

    symbol = Column(String, primary_key=True, nullable=False)
    name = Column(String(50), nullable=False)
    morning_auction_volume = Column(Float, nullable=True)
    closing_auction_volume = Column(Float, nullable=True)

    def __repr__(self):
        return f"<StockBasicInfo(symbol={self.symbol}, name={self.name})>"


# Pydantic模型，用于API响应
class StockBasicInfoModel(BaseModel):
    """
    股票基本信息API模型。
    用于API响应的Pydantic模型。

    Attributes:
        symbol (str): 股票代码
        name (str): 股票名称
        morning_auction_volume (Optional[float]): 早盘竞价量
        closing_auction_volume (Optional[float]): 尾盘竞价量
    """
    model_config = ConfigDict(from_attributes=True)

    symbol: str
    name: str
    morning_auction_volume: Optional[float] = None
    closing_auction_volume: Optional[float] = None
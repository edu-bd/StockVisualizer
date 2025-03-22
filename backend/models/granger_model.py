# backend/models/granger_model.py
"""
此模块定义了格兰杰因果检验的模型类。
包括格兰杰因果检验的请求和响应数据结构。
Authors: hovi.hyw & AI
Date: 2025-03-12
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum


class GrangerTestDirection(str, Enum):
    """
    格兰杰因果检验方向枚举。
    定义了支持的检验方向。
    """
    STOCK_TO_INDEX = "stock_to_index"  # 股票对指数的影响
    INDEX_TO_STOCK = "index_to_stock"  # 指数对股票的影响
    BOTH = "both"  # 双向检验


class GrangerRequest(BaseModel):
    """
    格兰杰因果检验请求模型。
    定义了格兰杰因果检验请求的数据结构。

    Attributes:
        stock_symbol (str): 股票代码
        max_lag (int): 最大滞后阶数
        test_direction (GrangerTestDirection): 检验方向
        significance_level (float): 显著性水平
        exclude_suspension (bool): 是否剔除停牌日期数据
    """
    stock_symbol: str = Field(..., description="股票代码")
    max_lag: int = Field(5, ge=1, le=20, description="最大滞后阶数")
    test_direction: GrangerTestDirection = Field(GrangerTestDirection.BOTH, description="检验方向")
    significance_level: float = Field(0.05, gt=0, lt=1, description="显著性水平")
    exclude_suspension: bool = Field(True, description="是否剔除停牌日期数据")


class GrangerResultItem(BaseModel):
    """
    单个格兰杰因果检验结果项模型。
    定义了单个检验结果的数据结构。

    Attributes:
        index_symbol (str): 指数代码
        index_name (str): 指数名称
        stock_to_index_result (Dict[str, Any]): 股票对指数的检验结果
        index_to_stock_result (Dict[str, Any]): 指数对股票的检验结果
    """
    index_symbol: str
    index_name: str
    stock_to_index_result: Optional[Dict[str, Any]] = None
    index_to_stock_result: Optional[Dict[str, Any]] = None


class GrangerResponse(BaseModel):
    """
    格兰杰因果检验响应模型。
    定义了完整检验结果的数据结构。

    Attributes:
        stock_symbol (str): 股票代码
        stock_name (Optional[str]): 股票名称
        max_lag (int): 最大滞后阶数
        significance_level (float): 显著性水平
        results (List[GrangerResultItem]): 检验结果列表
        execution_time (float): 执行时间（秒）
    """
    stock_symbol: str
    stock_name: Optional[str] = None
    max_lag: int
    significance_level: float
    results: List[GrangerResultItem]
    execution_time: float
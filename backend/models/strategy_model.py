# backend/models/strategy_model.py
"""
此模块定义了选股策略的模型类。
包括选股策略的数据结构和验证规则。
Authors: hovi.hyw & AI
Date: 2025-03-12
"""

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional, Union
from enum import Enum


class IndicatorType(str, Enum):
    """
    指标类型枚举。
    定义了支持的指标类型。
    """
    PRICE = "price"  # 价格指标
    VOLUME = "volume"  # 成交量指标
    TECHNICAL = "technical"  # 技术指标
    FUNDAMENTAL = "fundamental"  # 基本面指标
    CUSTOM = "custom"  # 自定义指标


class ComparisonOperator(str, Enum):
    """
    比较运算符枚举。
    定义了支持的比较运算符。
    """
    GT = ">"
    GTE = ">="
    LT = "<"
    LTE = "<="
    EQ = "=="
    NEQ = "!="
    BETWEEN = "between"  # 区间
    CROSS_ABOVE = "cross_above"  # 向上穿越
    CROSS_BELOW = "cross_below"  # 向下穿越


class TimeFrame(str, Enum):
    """
    时间周期枚举。
    定义了支持的时间周期。
    """
    DAILY = "daily"  # 日线
    WEEKLY = "weekly"  # 周线
    MONTHLY = "monthly"  # 月线


class ConditionModel(BaseModel):
    """
    选股条件模型。
    定义了单个选股条件的数据结构。

    Attributes:
        indicator (str): 指标名称
        indicator_type (IndicatorType): 指标类型
        operator (ComparisonOperator): 比较运算符
        value (Union[float, List[float]]): 比较值，可以是单个值或区间值列表
        time_frame (TimeFrame): 时间周期
        days (Optional[int]): 持续天数，用于某些需要持续满足条件的场景
    """
    indicator: str
    indicator_type: IndicatorType
    operator: ComparisonOperator
    value: Union[float, List[float]]
    time_frame: TimeFrame = TimeFrame.DAILY
    days: Optional[int] = None

    @validator('value')
    def validate_value(cls, v, values):
        """
        验证比较值。
        根据比较运算符验证比较值的格式。
        """
        operator = values.get('operator')
        if operator == ComparisonOperator.BETWEEN:
            if not isinstance(v, list) or len(v) != 2:
                raise ValueError("区间比较需要提供两个值的列表")
            if v[0] >= v[1]:
                raise ValueError("区间的起始值必须小于结束值")
        return v


class StrategyModel(BaseModel):
    """
    选股策略模型。
    定义了完整选股策略的数据结构。

    Attributes:
        name (str): 策略名称
        description (Optional[str]): 策略描述
        market (Optional[str]): 市场，支持 'all', 'sh', 'sz', 'bj'
        date_range (Optional[List[str]]): 日期范围
        conditions (List[ConditionModel]): 选股条件列表
        logic (str): 条件之间的逻辑关系，支持 'AND' 和 'OR'
        max_stocks (Optional[int]): 最大选股数量
        sort_by (Optional[str]): 排序指标
        sort_order (Optional[str]): 排序顺序，支持 'asc' 和 'desc'
    """
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    market: Optional[str] = Field("all", pattern="^(all|sh|sz|bj)$")
    date_range: Optional[List[str]] = None
    conditions: List[ConditionModel] = Field(..., min_items=1)
    logic: str = Field("AND", pattern="^(AND|OR)$")
    max_stocks: Optional[int] = Field(None, gt=0)
    sort_by: Optional[str] = None
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$")


class StrategyResultItem(BaseModel):
    """
    选股结果项模型。
    定义了单个选股结果的数据结构。

    Attributes:
        symbol (str): 股票代码
        name (Optional[str]): 股票名称
        latest_price (float): 最新价格
        match_details (Dict[str, Any]): 匹配详情，包含每个条件的匹配结果
    """
    symbol: str
    name: Optional[str] = None
    latest_price: float
    match_details: Dict[str, Any] = {}


class StrategyResult(BaseModel):
    """
    选股结果模型。
    定义了完整选股结果的数据结构。

    Attributes:
        strategy_name (str): 策略名称
        total (int): 匹配的股票总数
        items (List[StrategyResultItem]): 选股结果列表
        execution_time (float): 执行时间（秒）
    """
    strategy_name: str
    total: int
    items: List[StrategyResultItem]
    execution_time: float
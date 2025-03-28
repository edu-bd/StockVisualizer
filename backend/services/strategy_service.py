# backend/services/strategy_service.py
"""
此模块提供选股策略相关的服务功能。
包括执行选股策略和管理策略的服务方法。
Authors: hovi.hyw & AI
Date: 2025-03-12
"""

from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from models.strategy_model import StrategyModel, StrategyResult
from database.strategy_queries import execute_stock_strategy, execute_index_strategy


class StrategyService:
    """
    选股策略服务类。
    提供执行选股策略和管理策略的服务方法。

    Methods:
        execute_strategy: 执行选股策略
        execute_stock_strategy: 执行股票选股策略
        execute_index_strategy: 执行指数选股策略

    Examples:
        >>> from sqlalchemy.orm import Session
        >>> service = StrategyService()
        >>> strategy = StrategyModel(...)
        >>> result = service.execute_strategy(db, strategy, "stock")
    """

    def execute_strategy(self, db: Session, strategy: StrategyModel, target_type: str = "stock") -> Dict[str, Any]:
        """
        执行选股策略。

        Args:
            db (Session): 数据库会话
            strategy (StrategyModel): 选股策略模型
            target_type (str): 目标类型，支持 'stock' 和 'index'

        Returns:
            Dict[str, Any]: 选股结果

        Raises:
            ValueError: 如果目标类型不支持
        """
        if target_type.lower() == "stock":
            return self.execute_stock_strategy(db, strategy)
        elif target_type.lower() == "index":
            return self.execute_index_strategy(db, strategy)
        else:
            raise ValueError(f"不支持的目标类型: {target_type}，支持的类型有: 'stock', 'index'")

    def execute_stock_strategy(self, db: Session, strategy: StrategyModel) -> Dict[str, Any]:
        """
        执行股票选股策略。

        Args:
            db (Session): 数据库会话
            strategy (StrategyModel): 选股策略模型

        Returns:
            Dict[str, Any]: 股票选股结果
        """
        return execute_stock_strategy(db, strategy)

    def execute_index_strategy(self, db: Session, strategy: StrategyModel) -> Dict[str, Any]:
        """
        执行指数选股策略。

        Args:
            db (Session): 数据库会话
            strategy (StrategyModel): 选股策略模型

        Returns:
            Dict[str, Any]: 指数选股结果
        """
        return execute_index_strategy(db, strategy)

    def validate_strategy(self, strategy: StrategyModel) -> List[str]:
        """
        验证选股策略的有效性。

        Args:
            strategy (StrategyModel): 选股策略模型

        Returns:
            List[str]: 错误信息列表，如果为空则表示验证通过
        """
        errors = []

        # 验证策略名称
        if not strategy.name or len(strategy.name.strip()) == 0:
            errors.append("策略名称不能为空")

        # 验证条件列表
        if not strategy.conditions or len(strategy.conditions) == 0:
            errors.append("至少需要一个选股条件")

        # 验证每个条件
        for i, condition in enumerate(strategy.conditions):
            # 验证指标名称
            if not condition.indicator or len(condition.indicator.strip()) == 0:
                errors.append(f"条件 {i+1}: 指标名称不能为空")

            # 验证比较值
            if condition.value is None:
                errors.append(f"条件 {i+1}: 比较值不能为空")

        return errors
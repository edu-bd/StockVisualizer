# backend/api/strategy_api.py
"""
此模块定义了选股策略相关的API端点。
提供创建、执行和管理选股策略的API接口。
Authors: hovi.hyw & AI
Date: 2025-03-12
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import Optional, List

from backend.database.connection import get_db
from backend.models.strategy_model import StrategyModel, StrategyResult
from backend.services.strategy_service import StrategyService

router = APIRouter(prefix="/strategies", tags=["strategies"])
strategy_service = StrategyService()


@router.post("/execute", response_model=StrategyResult)
async def execute_strategy(
        strategy: StrategyModel = Body(..., description="选股策略"),
        target_type: str = Query("stock", description="目标类型，支持 'stock' 和 'index'"),
        db: Session = Depends(get_db)
):
    """
    执行选股策略。

    Args:
        strategy: 选股策略模型
        target_type: 目标类型，支持 'stock' 和 'index'
        db: 数据库会话

    Returns:
        StrategyResult: 选股结果
    """
    try:
        # 验证策略
        errors = strategy_service.validate_strategy(strategy)
        if errors:
            raise HTTPException(status_code=400, detail={"errors": errors})

        # 执行策略
        result = strategy_service.execute_strategy(db, strategy, target_type)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute/stock", response_model=StrategyResult)
async def execute_stock_strategy(
        strategy: StrategyModel = Body(..., description="选股策略"),
        db: Session = Depends(get_db)
):
    """
    执行股票选股策略。

    Args:
        strategy: 选股策略模型
        db: 数据库会话

    Returns:
        StrategyResult: 选股结果
    """
    try:
        # 验证策略
        errors = strategy_service.validate_strategy(strategy)
        if errors:
            raise HTTPException(status_code=400, detail={"errors": errors})

        # 执行策略
        result = strategy_service.execute_stock_strategy(db, strategy)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute/index", response_model=StrategyResult)
async def execute_index_strategy(
        strategy: StrategyModel = Body(..., description="选股策略"),
        db: Session = Depends(get_db)
):
    """
    执行指数选股策略。

    Args:
        strategy: 选股策略模型
        db: 数据库会话

    Returns:
        StrategyResult: 选股结果
    """
    try:
        # 验证策略
        errors = strategy_service.validate_strategy(strategy)
        if errors:
            raise HTTPException(status_code=400, detail={"errors": errors})

        # 执行策略
        result = strategy_service.execute_index_strategy(db, strategy)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
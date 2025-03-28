# backend/api/stock_basic_info_api.py
"""
此模块定义了股票基本信息相关的API端点。
提供获取和更新股票基本信息的API接口。
Authors: hovi.hyw & AI
Date: 2025-03-12
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from database.connection import get_db
from models.stock_basic_info_model import StockBasicInfoModel
from services.stock_basic_info_service import StockBasicInfoService
from utils.stock_basic_info_updater import update_stock_basic_info as update_from_akshare

router = APIRouter(prefix="/stock-basic-info", tags=["stock-basic-info"])
stock_basic_info_service = StockBasicInfoService()


@router.get("/", response_model=Dict[str, Any])
async def get_stock_basic_info_list(
        page: int = Query(1, ge=1, description="页码"),
        page_size: int = Query(20, ge=1, le=100, description="每页数量"),
        search: Optional[str] = Query(None, description="搜索关键字"),
        db: Session = Depends(get_db)
):
    """
    获取股票基本信息列表。

    Args:
        page: 页码，从1开始
        page_size: 每页数量，默认20
        search: 搜索关键字，可搜索股票代码或名称
        db: 数据库会话

    Returns:
        Dict[str, Any]: 股票基本信息列表和分页信息
    """
    try:
        # 确保search参数是字符串类型
        search_str = str(search) if search is not None else None
        return stock_basic_info_service.get_stock_basic_info_list(db, page, page_size, search_str)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}", response_model=StockBasicInfoModel)
async def get_stock_basic_info(
        symbol: str,
        db: Session = Depends(get_db)
):
    """
    获取股票基本信息。

    Args:
        symbol: 股票代码
        db: 数据库会话

    Returns:
        StockBasicInfoModel: 股票基本信息
    """
    try:
        stock_info = stock_basic_info_service.get_stock_basic_info(db, symbol)
        if not stock_info:
            raise HTTPException(status_code=404, detail=f"Stock with symbol {symbol} not found")
        return stock_info
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update", response_model=Dict[str, Any])
async def update_stock_basic_info(
        stock_info: StockBasicInfoModel = Body(...),
        db: Session = Depends(get_db)
):
    """
    更新股票基本信息。

    Args:
        stock_info: 股票基本信息
        db: 数据库会话

    Returns:
        Dict[str, Any]: 更新结果
    """
    try:
        result = stock_basic_info_service.update_stock_basic_info(db, stock_info.dict())
        return {"success": result, "message": "Stock basic info updated successfully" if result else "Failed to update stock basic info"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update-from-akshare", response_model=Dict[str, Any])
async def update_from_akshare_api(
        db: Session = Depends(get_db)
):
    """
    从akshare获取股票基本信息并更新到数据库。

    Args:
        db: 数据库会话

    Returns:
        Dict[str, Any]: 更新结果
    """
    try:
        updated_count = update_from_akshare(db)
        return {
            "success": updated_count > 0,
            "message": f"成功更新{updated_count}条股票基本信息记录",
            "updated_count": updated_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# backend/api/granger_api.py
"""
此模块定义了格兰杰因果检验相关的API端点。
提供执行格兰杰因果检验的API接口。
Authors: hovi.hyw & AI
Date: 2025-03-12
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Optional

from backend.database.connection import get_db
from backend.models.granger_model import GrangerRequest, GrangerResponse
from backend.services.granger_service import GrangerService

router = APIRouter(prefix="/granger", tags=["granger"])
granger_service = GrangerService()


@router.post("/test", response_model=GrangerResponse)
async def execute_granger_test(
        request: GrangerRequest = Body(...),
        db: Session = Depends(get_db)
):
    """
    执行格兰杰因果检验。

    Args:
        request: 格兰杰因果检验请求参数
        db: 数据库会话

    Returns:
        GrangerResponse: 格兰杰因果检验结果
    """
    try:
        return granger_service.execute_granger_test(db, request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
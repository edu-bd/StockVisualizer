# backend/api/router.py
"""
此模块定义了API路由的集成。
将所有API路由注册到主应用程序。
Authors: hovi.hyw & AI
Date: 2025-03-12
"""

from fastapi import APIRouter

from api.stock_api import router as stock_router
from api.index_api import router as index_router
from api.strategy_api import router as strategy_router
from api.stock_basic_info_api import router as stock_basic_info_router

# 创建主路由
api_router = APIRouter()

# 注册子路由
api_router.include_router(stock_router)
api_router.include_router(index_router)
api_router.include_router(strategy_router)
api_router.include_router(stock_basic_info_router)
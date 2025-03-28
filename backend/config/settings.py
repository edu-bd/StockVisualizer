# backend/config/settings.py
"""
此模块包含应用程序的配置设置。
定义了数据库连接、API设置和其他全局配置参数。
Authors: hovi.hyw & AI
Date: 2025-03-12
"""

import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()


class Settings(BaseSettings):
    """
    应用程序配置类。
    该类负责管理应用程序的所有配置参数，包括：
    1. 数据库连接信息
    2. API设置
    3. 日志配置

    Attributes:
        PROJECT_NAME: 项目名称
        API_V1_STR: API路径前缀
        DATABASE_URL: 数据库连接URL
        LOG_LEVEL: 日志级别

    Examples:
        >>> settings = Settings()
        >>> print(settings.DATABASE_URL)
        postgresql://postgres:password@localhost:5432/stockdb
    """
    PROJECT_NAME: str = "Stock Visualizer"
    API_V1_STR: str = "/api"

    # 数据库设置
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:password@localhost:5432/stock_db"
    )
    
    # 如果在本地开发环境中，确保使用本地PostgreSQL
    if os.getenv("ENVIRONMENT") != "production":
        DATABASE_URL = "postgresql://si:jojo@localhost:5432/stock_db"
    
    # 检查是否在Docker环境中运行
    # 如果在Docker环境中，将使用环境变量中的DATABASE_URL
    # 否则使用默认的localhost连接

    # 日志设置
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # 跨域设置 - 开发环境允许所有来源
    BACKEND_CORS_ORIGINS: list = ["*"]  # 在开发环境中允许所有来源（生产环境中应使用具体的域名列表）

    # 分页设置
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    class Config:
        """Pydantic配置类"""
        case_sensitive = True


# 实例化配置对象
settings = Settings()
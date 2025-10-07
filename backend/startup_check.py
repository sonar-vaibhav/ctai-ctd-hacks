#!/usr/bin/env python3
"""
Startup check script for Smart Buy Dashboard API
This script verifies all dependencies and configurations before starting the server
"""

import os
import sys
import logging
from pathlib import Path

# Add the backend directory to the path
backend_path = Path(__file__).parent.absolute()
sys.path.insert(0, str(backend_path))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_python_version():
    """Check if the correct Python version is being used"""
    import sys
    version = f"{sys.version_info.major}.{sys.version_info.minor}"
    logger.info(f"Python version: {sys.version}")
    if version != "3.11":
        logger.warning(f"Python version {version} detected. Recommended version is 3.11 for compatibility.")
    else:
        logger.info("Python version is compatible.")

def check_environment_variables():
    """Check required environment variables"""
    required_vars = ['MONGODB_CONNECTION_STRING', 'MONGODB_DATABASE_NAME']
    missing_vars = []
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            logger.info(f"Environment variable {var}: {'*' * len(value) if 'CONNECTION' in var else value}")
        else:
            missing_vars.append(var)
            logger.warning(f"Missing environment variable: {var}")
    
    if missing_vars:
        logger.warning("Some environment variables are missing. Make sure to set them in Render dashboard.")
    
    return len(missing_vars) == 0

def check_file_structure():
    """Check if required files and directories exist"""
    required_paths = [
        'database',
        'database/mongodb.py',
        'models',
        'models/database_models.py',
        'database/crud.py'
    ]
    
    missing_paths = []
    for path in required_paths:
        full_path = backend_path / path
        if not full_path.exists():
            missing_paths.append(path)
            logger.error(f"Missing required path: {path}")
        else:
            logger.info(f"Found required path: {path}")
    
    return len(missing_paths) == 0

def check_imports():
    """Test importing key modules"""
    modules_to_test = [
        'database.mongodb',
        'models.database_models',
        'database.crud'
    ]
    
    failed_imports = []
    for module in modules_to_test:
        try:
            if module == 'database.mongodb':
                from database.mongodb import db_manager
            elif module == 'models.database_models':
                from models.database_models import ProjectModel
            elif module == 'database.crud':
                from database.crud import create_project
            logger.info(f"Successfully imported {module}")
        except Exception as e:
            failed_imports.append((module, str(e)))
            logger.error(f"Failed to import {module}: {e}")
    
    return len(failed_imports) == 0

def main():
    """Run all startup checks"""
    logger.info("Running startup checks for Smart Buy Dashboard API...")
    logger.info(f"Backend path: {backend_path}")
    
    checks = [
        ("Python version", check_python_version),
        ("Environment variables", check_environment_variables),
        ("File structure", check_file_structure),
        ("Module imports", check_imports)
    ]
    
    results = []
    for check_name, check_func in checks:
        try:
            logger.info(f"\n--- Checking {check_name} ---")
            result = check_func()
            results.append((check_name, result))
        except Exception as e:
            logger.error(f"Error during {check_name} check: {e}")
            results.append((check_name, False))
    
    logger.info("\n" + "="*50)
    logger.info("STARTUP CHECK SUMMARY")
    logger.info("="*50)
    
    all_passed = True
    for check_name, result in results:
        status = "PASSED" if result else "FAILED"
        logger.info(f"{check_name}: {status}")
        if not result:
            all_passed = False
    
    if all_passed:
        logger.info("\nAll startup checks passed! Ready to start the server.")
        return 0
    else:
        logger.error("\nSome startup checks failed. Please review the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
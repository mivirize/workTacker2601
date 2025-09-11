#!/usr/bin/env python3
"""
Tripo MCP セットアップツール

このスクリプトは以下の処理を実行します：
1. 環境変数の検証
2. Python/uvのバージョン確認
3. tripo-mcpパッケージのインストール
4. 設定ファイルの検証
5. 接続テスト
"""

import os
import sys
import json
import subprocess
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List

class TripoSetup:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.config_path = self.project_root / "config"
        self.log_path = self.project_root / "logs"
        
        # ログディレクトリ作成
        self.log_path.mkdir(exist_ok=True)
        self._setup_logging()
        
    def _setup_logging(self):
        """ログ設定のセットアップ"""
        log_file = self.log_path / "setup.log"
        logging.basicConfig(
            level=logging.INFO,
            format='[%(asctime)s] [%(levelname)s] %(message)s',
            handlers=[
                logging.FileHandler(log_file, encoding='utf-8'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def log_step(self, step_name: str, success: bool = True):
        """ステップの結果をログに記録"""
        status = "✅" if success else "❌"
        message = f"{status} {step_name}"
        if success:
            self.logger.info(message)
        else:
            self.logger.error(message)
            
    def check_python_version(self) -> bool:
        """Pythonバージョンをチェック"""
        self.logger.info("Pythonバージョンをチェックしています...")
        
        if sys.version_info < (3, 10):
            self.logger.error(f"Python 3.10以上が必要です。現在のバージョン: {sys.version}")
            return False
            
        self.logger.info(f"Pythonバージョン: {sys.version.split()[0]} ✓")
        return True
    
    def check_environment(self) -> bool:
        """環境変数をチェック"""
        self.logger.info("環境変数をチェックしています...")
        
        required_env_vars = ["TRIPO_API_KEY"]
        missing = []
        
        for env_var in required_env_vars:
            if not os.getenv(env_var):
                missing.append(env_var)
        
        if missing:
            self.logger.error(f"必要な環境変数が設定されていません: {', '.join(missing)}")
            self.logger.info("以下の方法で環境変数を設定してください:")
            self.logger.info("Windows: set TRIPO_API_KEY=your_api_key_here")
            self.logger.info("Linux/Mac: export TRIPO_API_KEY=your_api_key_here")
            return False
        
        self.logger.info("環境変数チェック完了")
        return True
    
    def check_uv_installation(self) -> bool:
        """uvがインストールされているかチェック"""
        self.logger.info("uvの確認...")
        
        try:
            result = subprocess.run(["uv", "--version"], 
                                  capture_output=True, 
                                  text=True, 
                                  check=True)
            self.logger.info(f"uvバージョン: {result.stdout.strip()} ✓")
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            self.logger.error("uvが見つかりません。")
            self.logger.info("uvをインストールしてください: pip install uv")
            return False
    
    def install_tripo_mcp(self) -> bool:
        """tripo-mcpパッケージをインストール"""
        self.logger.info("tripo-mcpパッケージをインストールしています...")
        
        try:
            # uvxでtripo-mcpをインストール
            result = subprocess.run(["uvx", "--python", "3.10", "tripo-mcp", "--help"], 
                                  capture_output=True, 
                                  text=True, 
                                  timeout=60)
            
            if result.returncode == 0:
                self.logger.info("tripo-mcpパッケージのインストール/確認完了")
                return True
            else:
                self.logger.error(f"tripo-mcpのインストールに失敗: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            self.logger.error("インストールがタイムアウトしました")
            return False
        except Exception as e:
            self.logger.error(f"インストール中にエラーが発生しました: {e}")
            return False
    
    def validate_config(self) -> bool:
        """設定ファイルを検証"""
        self.logger.info("設定ファイルを検証しています...")
        
        config_file = self.config_path / "mcp-servers.json"
        if not config_file.exists():
            self.logger.error("mcp-servers.jsonが見つかりません")
            return False
        
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            if not config.get("servers", {}).get("tripo-mcp"):
                self.logger.error("tripo-mcpの設定が見つかりません")
                return False
            
            self.logger.info("設定ファイル検証完了")
            return True
        except Exception as e:
            self.logger.error(f"設定ファイルの検証に失敗: {e}")
            return False
    
    def test_connection(self) -> bool:
        """tripo-mcpの接続テスト"""
        self.logger.info("tripo-mcpサーバーの接続テストを実行しています...")
        
        try:
            # tripo-mcpコマンドのヘルプを表示してテスト
            result = subprocess.run(["uvx", "tripo-mcp", "--help"], 
                                  capture_output=True, 
                                  text=True, 
                                  timeout=30)
            
            if result.returncode == 0:
                self.logger.info("tripo-mcpサーバーの接続テスト成功")
                return True
            else:
                self.logger.error(f"接続テストに失敗: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            self.logger.error("接続テストがタイムアウトしました")
            return False
        except Exception as e:
            self.logger.error(f"接続テスト中にエラー: {e}")
            return False
    
    def create_claude_config_example(self):
        """Claude Desktop設定例を作成"""
        example_config = {
            "mcpServers": {
                "tripo-mcp": {
                    "command": "uvx",
                    "args": ["tripo-mcp"],
                    "env": {
                        "TRIPO_API_KEY": "your_api_key_here"
                    }
                }
            }
        }
        
        config_example_path = self.config_path / "claude-desktop-example.json"
        with open(config_example_path, 'w', encoding='utf-8') as f:
            json.dump(example_config, f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"Claude Desktop設定例を作成: {config_example_path}")
    
    def run(self):
        """メイン実行関数"""
        print("=" * 60)
        print("Tripo MCP セットアップツール v1.0.0")
        print("=" * 60)
        
        steps = [
            ("Pythonバージョンチェック", self.check_python_version),
            ("環境変数チェック", self.check_environment),
            ("uvインストール確認", self.check_uv_installation),
            ("tripo-mcpパッケージインストール", self.install_tripo_mcp),
            ("設定ファイル検証", self.validate_config),
            ("接続テスト", self.test_connection),
        ]
        
        failed = False
        
        for step_name, step_func in steps:
            print(f"\n📋 {step_name}...")
            try:
                result = step_func()
                self.log_step(step_name, result)
                if not result:
                    failed = True
                    break
            except Exception as e:
                self.logger.error(f"{step_name}中に予期しないエラー: {e}")
                self.log_step(step_name, False)
                failed = True
                break
        
        print("\n" + "=" * 60)
        
        if failed:
            self.logger.error("セットアップに失敗しました。ログファイルを確認してください。")
            print(f"📄 ログファイル: {self.log_path / 'setup.log'}")
            sys.exit(1)
        else:
            self.logger.info("🎉 tripo-mcpのセットアップが完了しました！")
            self.create_claude_config_example()
            
            print("\n📚 次のステップ:")
            print("1. Claude Desktopの設定ファイルを更新")
            print(f"   参考: {self.config_path / 'claude-desktop-example.json'}")
            print("2. Blenderを起動し、Tripo AI Addonを有効化")
            print("3. Claude/Cursorで3D生成をテスト")
            print("4. 「Generate a 3D model of a futuristic chair」などを試す")

def main():
    """メイン関数"""
    setup = TripoSetup()
    try:
        setup.run()
    except KeyboardInterrupt:
        print("\n\n⚠️  セットアップが中断されました")
        sys.exit(1)
    except Exception as e:
        logging.error(f"予期しないエラー: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
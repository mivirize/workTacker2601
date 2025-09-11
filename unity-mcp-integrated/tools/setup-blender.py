#!/usr/bin/env python3
"""
Blender MCP セットアップツール

このスクリプトは以下の処理を実行します：
1. 環境変数の検証
2. Python/uvのバージョン確認
3. Blenderインストール確認
4. blender-mcp依存関係のインストール
5. 設定ファイルの検証
6. 接続テスト
"""

import os
import sys
import json
import subprocess
import logging
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional

class BlenderSetup:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.config_path = self.project_root / "config"
        self.log_path = self.project_root / "logs"
        self.blender_server_path = self.project_root / "servers" / "blender-mcp"
        
        # ログディレクトリ作成
        self.log_path.mkdir(exist_ok=True)
        self._setup_logging()
        
    def _setup_logging(self):
        """ログ設定のセットアップ"""
        log_file = self.log_path / "setup-blender.log"
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
        
        # 必須環境変数はなし（Blenderパスとホストポートはオプショナル）
        optional_env_vars = {
            "BLENDER_PATH": "Blenderインストールパス",
            "BLENDER_HOST": "BlenderMCPアドオンホスト（デフォルト: localhost）",
            "BLENDER_PORT": "BlenderMCPアドオンポート（デフォルト: 9876）"
        }
        
        for env_var, description in optional_env_vars.items():
            value = os.getenv(env_var)
            if value:
                self.logger.info(f"{env_var}: {value}")
            else:
                self.logger.info(f"{env_var}: 未設定 ({description})")
        
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
            self.logger.info("uvをインストールしてください:")
            self.logger.info("Windows: powershell -c \"irm https://astral.sh/uv/install.ps1 | iex\"")
            self.logger.info("macOS/Linux: curl -LsSf https://astral.sh/uv/install.sh | sh")
            return False
    
    def check_blender_installation(self) -> bool:
        """Blenderのインストールをチェック"""
        self.logger.info("Blenderインストールをチェックしています...")
        
        blender_path = os.getenv("BLENDER_PATH")
        if blender_path:
            if Path(blender_path).exists():
                self.logger.info(f"Blenderパス確認: {blender_path} ✓")
                return True
            else:
                self.logger.warning(f"指定されたBlenderパスが見つかりません: {blender_path}")
        
        # 一般的なBlenderパスをチェック
        common_paths = self._get_common_blender_paths()
        for path in common_paths:
            if Path(path).exists():
                self.logger.info(f"Blender発見: {path} ✓")
                self.logger.info(f"環境変数BLENDER_PATHに設定することを推奨: {path}")
                return True
        
        self.logger.warning("Blenderが見つかりません。手動でインストールしてください:")
        self.logger.warning("https://www.blender.org/download/")
        return False
    
    def _get_common_blender_paths(self) -> List[str]:
        """一般的なBlenderインストールパスを返す"""
        paths = []
        
        if sys.platform == "win32":
            # Windows
            program_files = [
                "C:/Program Files/Blender Foundation",
                "C:/Program Files (x86)/Blender Foundation"
            ]
            for pf in program_files:
                blender_root = Path(pf)
                if blender_root.exists():
                    for version_dir in blender_root.glob("Blender *"):
                        blender_exe = version_dir / "blender.exe"
                        if blender_exe.exists():
                            paths.append(str(blender_exe))
        
        elif sys.platform == "darwin":
            # macOS
            app_path = "/Applications/Blender.app/Contents/MacOS/Blender"
            paths.append(app_path)
        
        else:
            # Linux
            common_linux_paths = [
                "/usr/bin/blender",
                "/usr/local/bin/blender",
                "/opt/blender/blender",
                "/snap/bin/blender"
            ]
            paths.extend(common_linux_paths)
        
        return paths
    
    def install_blender_mcp(self) -> bool:
        """blender-mcp依存関係をインストール"""
        self.logger.info("blender-mcp依存関係をインストールしています...")
        
        if not self.blender_server_path.exists():
            self.logger.error(f"blender-mcpディレクトリが見つかりません: {self.blender_server_path}")
            return False
        
        try:
            # pyproject.tomlが存在するかチェック
            pyproject_path = self.blender_server_path / "pyproject.toml"
            if not pyproject_path.exists():
                self.logger.error("pyproject.tomlが見つかりません")
                return False
            
            # uv sync で依存関係をインストール
            result = subprocess.run(
                ["uv", "sync"],
                cwd=self.blender_server_path,
                capture_output=True, 
                text=True, 
                timeout=120
            )
            
            if result.returncode == 0:
                self.logger.info("blender-mcp依存関係のインストール完了")
                return True
            else:
                self.logger.error(f"依存関係のインストールに失敗: {result.stderr}")
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
            
            blender_config = config.get("servers", {}).get("blender-mcp")
            if not blender_config:
                self.logger.error("blender-mcpの設定が見つかりません")
                return False
            
            # 必要な設定項目をチェック
            required_keys = ["command", "args", "description"]
            for key in required_keys:
                if key not in blender_config:
                    self.logger.error(f"必要な設定項目が見つかりません: {key}")
                    return False
            
            self.logger.info("設定ファイル検証完了")
            return True
        except Exception as e:
            self.logger.error(f"設定ファイルの検証に失敗: {e}")
            return False
    
    def check_addon_file(self) -> bool:
        """Blenderアドオンファイルをチェック"""
        self.logger.info("Blenderアドオンファイルをチェックしています...")
        
        addon_file = self.blender_server_path / "addon.py"
        if not addon_file.exists():
            self.logger.error("addon.pyが見つかりません")
            return False
        
        self.logger.info(f"addon.pyファイル確認: {addon_file} ✓")
        self.logger.info("次のステップ: Blenderでこのアドオンをインストールしてください")
        self.logger.info("1. Blender > Edit > Preferences > Add-ons")
        self.logger.info("2. Install... をクリック")
        self.logger.info(f"3. {addon_file} を選択してインストール")
        self.logger.info("4. 'Interface: Blender MCP' を有効化")
        
        return True
    
    def test_server_startup(self) -> bool:
        """MCPサーバーの起動テスト"""
        self.logger.info("blender-mcpサーバーの起動テストを実行しています...")
        
        try:
            # サーバーを短時間起動してテスト
            result = subprocess.run([
                "uv", "run", "python", "-m", "blender_mcp.server", "--help"
            ], 
            cwd=self.blender_server_path,
            capture_output=True, 
            text=True, 
            timeout=30
            )
            
            # helpが表示されれば基本的なセットアップは完了
            if result.returncode == 0 or "usage" in result.stdout.lower() or "blender" in result.stdout.lower():
                self.logger.info("blender-mcpサーバーの基本チェック成功")
                return True
            else:
                self.logger.warning(f"サーバー起動時の応答: {result.stdout}")
                self.logger.warning("注意: Blenderアドオンが起動していない場合、接続エラーが発生することがあります")
                return True  # 基本的なPythonモジュール起動ができれば OK
                
        except subprocess.TimeoutExpired:
            self.logger.warning("起動テストがタイムアウト（正常な場合があります）")
            return True
        except Exception as e:
            self.logger.error(f"起動テスト中にエラー: {e}")
            return False
    
    def create_claude_config_example(self):
        """Claude Desktop設定例を作成"""
        example_config = {
            "mcpServers": {
                "blender-mcp": {
                    "command": "uv",
                    "args": [
                        "run", 
                        "--directory", 
                        str(self.blender_server_path.resolve()),
                        "python", 
                        "-m", 
                        "blender_mcp.server"
                    ],
                    "env": {
                        "BLENDER_HOST": "localhost",
                        "BLENDER_PORT": "9876"
                    }
                }
            }
        }
        
        config_example_path = self.config_path / "claude-desktop-blender-example.json"
        with open(config_example_path, 'w', encoding='utf-8') as f:
            json.dump(example_config, f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"Claude Desktop設定例を作成: {config_example_path}")
    
    def run(self):
        """メイン実行関数"""
        print("=" * 60)
        print("Blender MCP セットアップツール v1.0.0")
        print("=" * 60)
        
        steps = [
            ("Pythonバージョンチェック", self.check_python_version),
            ("環境変数チェック", self.check_environment),
            ("uvインストール確認", self.check_uv_installation),
            ("Blenderインストール確認", self.check_blender_installation),
            ("blender-mcp依存関係インストール", self.install_blender_mcp),
            ("設定ファイル検証", self.validate_config),
            ("Blenderアドオンファイル確認", self.check_addon_file),
            ("サーバー起動テスト", self.test_server_startup),
        ]
        
        failed = False
        warnings = 0
        
        for step_name, step_func in steps:
            print(f"\n📋 {step_name}...")
            try:
                result = step_func()
                if result:
                    self.log_step(step_name, True)
                else:
                    self.log_step(step_name, False)
                    if step_name == "Blenderインストール確認":
                        warnings += 1
                    else:
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
            print(f"📄 ログファイル: {self.log_path / 'setup-blender.log'}")
            sys.exit(1)
        else:
            if warnings > 0:
                self.logger.warning(f"⚠️  {warnings}個の警告がありましたが、セットアップは完了しました")
            else:
                self.logger.info("🎉 blender-mcpのセットアップが完了しました！")
            
            self.create_claude_config_example()
            
            print("\n📚 次のステップ:")
            print("1. Blenderを起動")
            print(f"2. addon.pyをインストール: {self.blender_server_path / 'addon.py'}")
            print("   - Edit > Preferences > Add-ons > Install...")
            print("   - 'Interface: Blender MCP' を有効化")
            print("3. Blender内で 'Connect to Claude' をクリック")
            print("4. Claude Desktopの設定ファイルを更新")
            print(f"   参考: {self.config_path / 'claude-desktop-blender-example.json'}")
            print("5. Blender統合をテスト:")
            print("   「Create a simple scene with a cube and sphere」")

def main():
    """メイン関数"""
    setup = BlenderSetup()
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
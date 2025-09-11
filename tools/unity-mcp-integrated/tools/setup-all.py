#!/usr/bin/env python3
"""
統合MCP セットアップツール

このスクリプトは以下の処理を実行します：
1. システム要件チェック
2. 全MCPサーバーのセットアップ
3. 設定ファイルの統合検証
4. 接続テスト
5. 統合レポートの生成
"""

import os
import sys
import json
import subprocess
import logging
import importlib.util
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional

class IntegratedSetup:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.config_path = self.project_root / "config"
        self.log_path = self.project_root / "logs"
        self.tools_path = self.project_root / "tools"
        
        # ログディレクトリ作成
        self.log_path.mkdir(exist_ok=True)
        self._setup_logging()
        
        # セットアップ結果を追跡
        self.results = {
            "unity-mcp": {"success": False, "warnings": [], "errors": []},
            "tripo-mcp": {"success": False, "warnings": [], "errors": []},
            "blender-mcp": {"success": False, "warnings": [], "errors": []}
        }
        
    def _setup_logging(self):
        """ログ設定のセットアップ"""
        log_file = self.log_path / "setup-all.log"
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
    
    def check_system_requirements(self) -> bool:
        """システム要件をチェック"""
        self.logger.info("システム要件をチェックしています...")
        
        # Python version
        if sys.version_info < (3, 10):
            self.logger.error(f"Python 3.10以上が必要です。現在のバージョン: {sys.version}")
            return False
        
        self.logger.info(f"Pythonバージョン: {sys.version.split()[0]} ✓")
        
        # uv installation
        try:
            result = subprocess.run(["uv", "--version"], 
                                  capture_output=True, 
                                  text=True, 
                                  check=True)
            self.logger.info(f"uvバージョン: {result.stdout.strip()} ✓")
        except (subprocess.CalledProcessError, FileNotFoundError):
            self.logger.error("uvが見つかりません。インストールしてください:")
            self.logger.info("https://docs.astral.sh/uv/getting-started/installation/")
            return False
        
        # Git installation
        try:
            subprocess.run(["git", "--version"], 
                          capture_output=True, 
                          check=True)
            self.logger.info("Git ✓")
        except (subprocess.CalledProcessError, FileNotFoundError):
            self.logger.error("Gitが見つかりません。インストールしてください:")
            self.logger.info("https://git-scm.com/downloads")
            return False
        
        return True
    
    def load_config(self) -> Optional[Dict[str, Any]]:
        """設定ファイルを読み込み"""
        config_file = self.config_path / "mcp-servers.json"
        if not config_file.exists():
            self.logger.error("mcp-servers.jsonが見つかりません")
            return None
        
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            self.logger.error(f"設定ファイルの読み込みに失敗: {e}")
            return None
    
    def run_setup_script(self, script_name: str, server_name: str) -> bool:
        """個別セットアップスクリプトを実行"""
        script_path = self.tools_path / script_name
        if not script_path.exists():
            self.logger.error(f"セットアップスクリプトが見つかりません: {script_path}")
            return False
        
        self.logger.info(f"{server_name}のセットアップを開始...")
        
        try:
            result = subprocess.run(
                [sys.executable, str(script_path)],
                capture_output=True,
                text=True,
                timeout=300  # 5分タイムアウト
            )
            
            if result.returncode == 0:
                self.logger.info(f"{server_name}セットアップ成功")
                # 警告をチェック
                if "警告" in result.stdout or "warning" in result.stdout.lower():
                    warnings = self._extract_warnings(result.stdout)
                    self.results[server_name]["warnings"] = warnings
                return True
            else:
                self.logger.error(f"{server_name}セットアップ失敗:")
                self.logger.error(result.stderr)
                self.results[server_name]["errors"] = [result.stderr]
                return False
                
        except subprocess.TimeoutExpired:
            self.logger.error(f"{server_name}セットアップがタイムアウトしました")
            self.results[server_name]["errors"] = ["Setup timeout"]
            return False
        except Exception as e:
            self.logger.error(f"{server_name}セットアップ中にエラー: {e}")
            self.results[server_name]["errors"] = [str(e)]
            return False
    
    def _extract_warnings(self, output: str) -> List[str]:
        """出力から警告メッセージを抽出"""
        warnings = []
        lines = output.split('\\n')
        for line in lines:
            if "⚠️" in line or "WARNING" in line or "警告" in line:
                warnings.append(line.strip())
        return warnings
    
    def setup_unity_mcp(self) -> bool:
        """Unity MCP のセットアップ"""
        self.logger.info("Unity MCP サーバーのセットアップ...")
        
        # Unity MCPは既存のリポジトリから設定を確認
        unity_server_path = self.project_root / "servers" / "unity-mcp"
        if not unity_server_path.exists():
            # 既存のunity-mcp リポジトリがある場合はシンボリックリンクを作成
            existing_unity = self.project_root.parent / "_repos" / "unity-mcp"
            if existing_unity.exists():
                try:
                    # Windowsの場合はjunctionを作成
                    if sys.platform == "win32":
                        subprocess.run([
                            "mklink", 
                            "/J", 
                            str(unity_server_path), 
                            str(existing_unity)
                        ], shell=True, check=True)
                    else:
                        unity_server_path.symlink_to(existing_unity)
                    self.logger.info("Unity MCPサーバーのリンクを作成しました")
                except Exception as e:
                    self.logger.warning(f"Unity MCPリンク作成に失敗: {e}")
        
        # Unity MCPサーバーが利用可能かチェック
        if unity_server_path.exists():
            self.results["unity-mcp"]["success"] = True
            return True
        else:
            self.results["unity-mcp"]["errors"] = ["Unity MCP server directory not found"]
            return False
    
    def setup_all_servers(self) -> Dict[str, bool]:
        """全MCPサーバーのセットアップを実行"""
        setup_results = {}
        
        # 各サーバーのセットアップスクリプトと名前のマッピング
        servers = [
            ("setup-tripo.py", "tripo-mcp"),
            ("setup-blender.py", "blender-mcp")
        ]
        
        # Unity MCP のセットアップ
        setup_results["unity-mcp"] = self.setup_unity_mcp()
        self.results["unity-mcp"]["success"] = setup_results["unity-mcp"]
        
        # 他のサーバーのセットアップ
        for script_name, server_name in servers:
            success = self.run_setup_script(script_name, server_name)
            setup_results[server_name] = success
            self.results[server_name]["success"] = success
        
        return setup_results
    
    def validate_integrated_config(self) -> bool:
        """統合設定ファイルを検証"""
        self.logger.info("統合設定ファイルを検証しています...")
        
        config = self.load_config()
        if not config:
            return False
        
        servers = config.get("servers", {})
        required_servers = ["unity-mcp", "tripo-mcp", "blender-mcp"]
        
        for server_name in required_servers:
            if server_name not in servers:
                self.logger.error(f"必要なサーバー設定が見つかりません: {server_name}")
                return False
            
            server_config = servers[server_name]
            required_keys = ["command", "args", "description"]
            for key in required_keys:
                if key not in server_config:
                    self.logger.error(f"{server_name}に必要な設定項目が不足: {key}")
                    return False
        
        # ワークフローの検証
        workflows = config.get("workflows", {})
        if "ai_to_unity_pipeline" not in workflows:
            self.logger.warning("AIからUnityまでの統合ワークフローが設定されていません")
        
        self.logger.info("統合設定ファイル検証完了")
        return True
    
    def test_server_connectivity(self) -> Dict[str, bool]:
        """各サーバーの接続性をテスト"""
        self.logger.info("サーバー接続性をテストしています...")
        
        connectivity = {}
        config = self.load_config()
        if not config:
            return {}
        
        servers = config.get("servers", {})
        
        for server_name, server_config in servers.items():
            if not server_config.get("enabled", False):
                self.logger.info(f"{server_name}は無効化されているためスキップ")
                continue
            
            self.logger.info(f"{server_name}の接続テスト...")
            
            try:
                # 基本的なコマンド実行テスト
                command = server_config["command"]
                args = server_config.get("args", [])
                
                if server_name == "tripo-mcp":
                    # Tripo MCPの場合はAPIキーが必要
                    if not os.getenv("TRIPO_API_KEY"):
                        self.logger.warning(f"{server_name}: TRIPO_API_KEY環境変数が設定されていません")
                        connectivity[server_name] = False
                        continue
                
                # helpコマンドでテスト
                test_args = args + ["--help"] if "--help" not in args else args
                result = subprocess.run(
                    [command] + test_args,
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                connectivity[server_name] = result.returncode == 0
                if connectivity[server_name]:
                    self.logger.info(f"{server_name}接続テスト成功")
                else:
                    self.logger.warning(f"{server_name}接続テスト失敗: {result.stderr}")
                    
            except Exception as e:
                self.logger.warning(f"{server_name}接続テスト中にエラー: {e}")
                connectivity[server_name] = False
        
        return connectivity
    
    def generate_report(self, setup_results: Dict[str, bool], connectivity: Dict[str, bool]):
        """統合レポートを生成"""
        self.logger.info("統合セットアップレポートを生成しています...")
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "system_info": {
                "python_version": sys.version.split()[0],
                "platform": sys.platform,
                "cwd": str(self.project_root)
            },
            "setup_results": self.results,
            "connectivity_results": connectivity,
            "summary": {
                "total_servers": len(setup_results),
                "successful_setups": sum(1 for success in setup_results.values() if success),
                "failed_setups": sum(1 for success in setup_results.values() if not success),
                "connected_servers": sum(1 for connected in connectivity.values() if connected),
                "disconnected_servers": sum(1 for connected in connectivity.values() if not connected)
            },
            "recommendations": []
        }
        
        # 推奨事項を生成
        for server_name, success in setup_results.items():
            if not success:
                report["recommendations"].append(
                    f"{server_name}のセットアップが失敗しました。setup-{server_name.replace('-mcp', '')}.pyを個別実行してください"
                )
        
        for server_name, connected in connectivity.items():
            if not connected:
                if server_name == "tripo-mcp":
                    report["recommendations"].append(
                        "Tripo API: TRIPO_API_KEY環境変数を設定してください"
                    )
                elif server_name == "blender-mcp":
                    report["recommendations"].append(
                        "Blender MCP: Blenderでアドオンを有効化し、'Connect to Claude'をクリックしてください"
                    )
        
        # レポートをファイルに保存
        report_path = self.log_path / "integration-report.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"統合レポートを保存: {report_path}")
        return report
    
    def create_claude_config(self):
        """Claude Desktop統合設定ファイルを作成"""
        config = self.load_config()
        if not config:
            return
        
        claude_config = {"mcpServers": {}}
        
        for server_name, server_config in config.get("servers", {}).items():
            if not server_config.get("enabled", False):
                continue
            
            if server_name == "unity-mcp":
                claude_config["mcpServers"][server_name] = {
                    "command": "python",
                    "args": [str(self.project_root / "_repos/unity-mcp/UnityMcpServer/src/.venv/Scripts/python.exe"), 
                             str(self.project_root / "_repos/unity-mcp/UnityMcpServer/src/server.py")],
                    "env": server_config.get("env", {})
                }
            elif server_name == "tripo-mcp":
                claude_config["mcpServers"][server_name] = {
                    "command": "uvx",
                    "args": ["tripo-mcp"],
                    "env": server_config.get("env", {})
                }
            elif server_name == "blender-mcp":
                claude_config["mcpServers"][server_name] = {
                    "command": "uv",
                    "args": [
                        "run", 
                        "--directory", 
                        str(self.project_root / "servers/blender-mcp"),
                        "python", 
                        "-m", 
                        "blender_mcp.server"
                    ],
                    "env": server_config.get("env", {})
                }
        
        config_path = self.config_path / "claude-desktop-integrated.json"
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(claude_config, f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"Claude Desktop統合設定を作成: {config_path}")
    
    def run(self):
        """メイン実行関数"""
        print("=" * 70)
        print("統合MCP セットアップツール v1.0.0")
        print("Unity + Tripo + Blender MCP統合環境")
        print("=" * 70)
        
        # システム要件チェック
        print("\n🔧 システム要件チェック...")
        if not self.check_system_requirements():
            self.logger.error("システム要件を満たしていません")
            sys.exit(1)
        
        # 設定ファイル検証
        print("\n📋 統合設定ファイル検証...")
        if not self.validate_integrated_config():
            self.logger.error("設定ファイルの検証に失敗しました")
            sys.exit(1)
        
        # 各MCPサーバーのセットアップ
        print("\n🚀 MCPサーバーセットアップ...")
        setup_results = self.setup_all_servers()
        
        # 接続テスト
        print("\n🔗 サーバー接続テスト...")
        connectivity = self.test_server_connectivity()
        
        # Claude設定ファイル生成
        print("\n⚙️  Claude Desktop設定生成...")
        self.create_claude_config()
        
        # レポート生成
        report = self.generate_report(setup_results, connectivity)
        
        # 結果表示
        print("\n" + "=" * 70)
        print("📊 統合セットアップ結果")
        print("=" * 70)
        
        print("\n🔧 セットアップ状況:")
        for server_name, success in setup_results.items():
            status = "✅ 成功" if success else "❌ 失敗"
            print(f"  {server_name}: {status}")
        
        print("\n🔗 接続状況:")
        for server_name, connected in connectivity.items():
            status = "✅ 接続可能" if connected else "⚠️  接続エラー"
            print(f"  {server_name}: {status}")
        
        # 推奨事項
        if report["recommendations"]:
            print("\n📋 推奨事項:")
            for i, rec in enumerate(report["recommendations"], 1):
                print(f"  {i}. {rec}")
        
        # 成功時の次のステップ
        success_count = sum(1 for success in setup_results.values() if success)
        if success_count == len(setup_results):
            print("\n🎉 全MCPサーバーの統合セットアップが完了しました！")
            print("\n📚 次のステップ:")
            print("1. Blenderを起動し、BlenderMCPアドオンを有効化")
            print("2. Claude Desktopの設定ファイルを更新:")
            print(f"   {self.config_path / 'claude-desktop-integrated.json'}")
            print("3. Unity Editorを起動し、UnityMCPパッケージを確認")
            print("4. 統合テスト:")
            print("   「Create a 3D model using Tripo, refine it in Blender, then import to Unity」")
        else:
            print(f"\n⚠️  {len(setup_results) - success_count}個のサーバーでエラーが発生しました")
            print("個別セットアップスクリプトを実行してください")
        
        print(f"\n📄 詳細レポート: {self.log_path / 'integration-report.json'}")

def main():
    """メイン関数"""
    setup = IntegratedSetup()
    try:
        setup.run()
    except KeyboardInterrupt:
        print("\n\n⚠️  統合セットアップが中断されました")
        sys.exit(1)
    except Exception as e:
        logging.error(f"予期しないエラー: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
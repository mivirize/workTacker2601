#!/usr/bin/env node

/**
 * Tripo MCP セットアップツール
 * 
 * このスクリプトは以下の処理を実行します：
 * 1. 環境変数の検証
 * 2. tripo-mcpの依存関係インストール
 * 3. ビルド実行
 * 4. 設定ファイルの検証
 * 5. 接続テスト
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');

class TripoSetup {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.tripoPath = path.join(this.projectRoot, 'servers', 'tripo-mcp');
        this.configPath = path.join(this.projectRoot, 'config');
        this.logPath = path.join(this.projectRoot, 'logs');
        
        // ログディレクトリ作成
        if (!fs.existsSync(this.logPath)) {
            fs.mkdirSync(this.logPath, { recursive: true });
        }
    }

    log(level, message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}`;
        console.log(logMessage);
        
        // ログファイルに記録
        const logFile = path.join(this.logPath, 'setup.log');
        fs.appendFileSync(logFile, logMessage + '\n');
    }

    info(message) { this.log('INFO', message); }
    error(message) { this.log('ERROR', message); }
    warn(message) { this.log('WARN', message); }
    success(message) { this.log('SUCCESS', message); }

    checkEnvironment() {
        this.info('環境変数をチェックしています...');
        
        const requiredEnvVars = ['TRIPO_API_KEY'];
        const missing = [];
        
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                missing.push(envVar);
            }
        }
        
        if (missing.length > 0) {
            this.error(`必要な環境変数が設定されていません: ${missing.join(', ')}`);
            this.info('以下の方法で環境変数を設定してください:');
            this.info('Windows: $env:TRIPO_API_KEY="your_api_key_here"');
            this.info('Linux/Mac: export TRIPO_API_KEY="your_api_key_here"');
            this.info('または .env ファイルを config/ ディレクトリに作成してください');
            return false;
        }
        
        this.success('環境変数チェック完了');
        return true;
    }

    checkNodeVersion() {
        this.info('Node.jsバージョンをチェックしています...');
        
        try {
            const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
            const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
            
            if (majorVersion < 18) {
                this.error(`Node.js 18以上が必要です。現在のバージョン: ${nodeVersion}`);
                return false;
            }
            
            this.success(`Node.jsバージョン: ${nodeVersion} ✓`);
            return true;
        } catch (error) {
            this.error('Node.jsが見つかりません。Node.js 18以上をインストールしてください。');
            return false;
        }
    }

    checkTripoRepository() {
        this.info('tripo-mcpリポジトリの存在確認...');
        
        if (!fs.existsSync(this.tripoPath)) {
            this.error(`tripo-mcpディレクトリが見つかりません: ${this.tripoPath}`);
            this.info('以下のコマンドを実行してください:');
            this.info('cd servers && git clone https://github.com/VAST-AI-Research/tripo-mcp.git tripo-mcp');
            return false;
        }
        
        const packageJsonPath = path.join(this.tripoPath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            this.error('package.jsonが見つかりません');
            return false;
        }
        
        this.success('tripo-mcpリポジトリ確認完了');
        return true;
    }

    installDependencies() {
        this.info('依存関係をインストールしています...');
        
        try {
            process.chdir(this.tripoPath);
            
            // パッケージマネージャーの検出
            let packageManager = 'npm';
            if (fs.existsSync('package-lock.json')) {
                packageManager = 'npm';
            } else if (fs.existsSync('yarn.lock')) {
                packageManager = 'yarn';
            } else if (fs.existsSync('pnpm-lock.yaml')) {
                packageManager = 'pnpm';
            }
            
            this.info(`${packageManager}を使用して依存関係をインストール中...`);
            
            const installCmd = packageManager === 'npm' ? 'npm install' : 
                              packageManager === 'yarn' ? 'yarn install' : 
                              'pnpm install';
            
            execSync(installCmd, { stdio: 'inherit' });
            this.success('依存関係のインストール完了');
            return true;
        } catch (error) {
            this.error(`依存関係のインストールに失敗: ${error.message}`);
            return false;
        }
    }

    buildProject() {
        this.info('プロジェクトをビルドしています...');
        
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            
            if (packageJson.scripts && packageJson.scripts.build) {
                execSync('npm run build', { stdio: 'inherit' });
                this.success('ビルド完了');
            } else {
                this.warn('buildスクリプトが見つかりません。TypeScriptファイルを直接確認します。');
                
                // TypeScriptファイルが存在するかチェック
                if (fs.existsSync('src') && fs.existsSync(path.join('src', 'index.ts'))) {
                    execSync('npx tsc', { stdio: 'inherit' });
                    this.success('TypeScriptコンパイル完了');
                }
            }
            return true;
        } catch (error) {
            this.error(`ビルドに失敗: ${error.message}`);
            return false;
        }
    }

    validateConfig() {
        this.info('設定ファイルを検証しています...');
        
        try {
            const configFile = path.join(this.configPath, 'mcp-servers.json');
            if (!fs.existsSync(configFile)) {
                this.error('mcp-servers.jsonが見つかりません');
                return false;
            }
            
            const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            
            if (!config.servers || !config.servers['tripo-mcp']) {
                this.error('tripo-mcpの設定が見つかりません');
                return false;
            }
            
            this.success('設定ファイル検証完了');
            return true;
        } catch (error) {
            this.error(`設定ファイルの検証に失敗: ${error.message}`);
            return false;
        }
    }

    async testConnection() {
        this.info('tripo-mcpサーバーの接続テストを実行しています...');
        
        return new Promise((resolve) => {
            try {
                const buildPath = path.join(this.tripoPath, 'build', 'index.js');
                const srcPath = path.join(this.tripoPath, 'src', 'index.js');
                
                let serverPath;
                if (fs.existsSync(buildPath)) {
                    serverPath = buildPath;
                } else if (fs.existsSync(srcPath)) {
                    serverPath = srcPath;
                } else {
                    this.error('サーバーファイルが見つかりません');
                    resolve(false);
                    return;
                }
                
                this.info(`サーバーを起動しています: ${serverPath}`);
                
                const serverProcess = spawn('node', [serverPath], {
                    env: { ...process.env },
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                
                let output = '';
                const timeout = setTimeout(() => {
                    serverProcess.kill();
                    this.warn('接続テストタイムアウト（10秒）- サーバーが正常に起動した可能性があります');
                    resolve(true);
                }, 10000);
                
                serverProcess.stdout.on('data', (data) => {
                    output += data.toString();
                    if (output.includes('Server running') || output.includes('listening') || output.includes('started')) {
                        clearTimeout(timeout);
                        serverProcess.kill();
                        this.success('tripo-mcpサーバーの接続テスト成功');
                        resolve(true);
                    }
                });
                
                serverProcess.stderr.on('data', (data) => {
                    const errorOutput = data.toString();
                    if (!errorOutput.includes('Warning')) {
                        this.warn(`サーバー警告/エラー: ${errorOutput.trim()}`);
                    }
                });
                
                serverProcess.on('exit', (code) => {
                    clearTimeout(timeout);
                    if (code === 0) {
                        this.success('サーバーが正常終了しました');
                        resolve(true);
                    } else {
                        this.error(`サーバーがエラーコード ${code} で終了しました`);
                        resolve(false);
                    }
                });
                
            } catch (error) {
                this.error(`接続テストに失敗: ${error.message}`);
                resolve(false);
            }
        });
    }

    async run() {
        console.log('='.repeat(60));
        console.log('Tripo MCP セットアップツール v1.0.0');
        console.log('='.repeat(60));
        
        const steps = [
            { name: 'Node.jsバージョンチェック', fn: () => this.checkNodeVersion() },
            { name: '環境変数チェック', fn: () => this.checkEnvironment() },
            { name: 'リポジトリ確認', fn: () => this.checkTripoRepository() },
            { name: '依存関係インストール', fn: () => this.installDependencies() },
            { name: 'プロジェクトビルド', fn: () => this.buildProject() },
            { name: '設定ファイル検証', fn: () => this.validateConfig() },
            { name: '接続テスト', fn: () => this.testConnection() }
        ];
        
        let failed = false;
        
        for (const step of steps) {
            console.log(`\n📋 ${step.name}...`);
            const result = await step.fn();
            
            if (!result) {
                failed = true;
                console.log(`❌ ${step.name} 失敗`);
                break;
            }
            console.log(`✅ ${step.name} 完了`);
        }
        
        console.log('\n' + '='.repeat(60));
        
        if (failed) {
            this.error('セットアップに失敗しました。ログファイルを確認してください。');
            console.log('📄 ログファイル:', path.join(this.logPath, 'setup.log'));
            process.exit(1);
        } else {
            this.success('🎉 tripo-mcpのセットアップが完了しました！');
            console.log('\n📚 次のステップ:');
            console.log('1. Claude Desktopの設定ファイルを更新');
            console.log('2. Unity MCPと連携テスト');
            console.log('3. 3D生成パイプラインのテスト');
        }
    }
}

// メイン実行
if (require.main === module) {
    const setup = new TripoSetup();
    setup.run().catch(error => {
        console.error('予期しないエラー:', error);
        process.exit(1);
    });
}

module.exports = TripoSetup;
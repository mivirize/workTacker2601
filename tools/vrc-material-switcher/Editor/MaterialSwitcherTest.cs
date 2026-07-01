#if UNITY_EDITOR
using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;
using VRC.SDK3.Avatars.Components;
using VRC.SDK3.Avatars.ScriptableObjects;
using nadena.dev.modular_avatar.core;

namespace VRCMaterialSwitcher
{
    public static class MaterialSwitcherTest
    {
        [MenuItem("Tools/VRC Material Switcher Tests/Run Tests")]
        public static void RunTests()
        {
            Debug.Log("[TEST] VRC Material Switcher テストを開始します...");

            try
            {
                TestVariationDetection();
                TestSetupWorkflow();
                
                Debug.Log("[TEST] 全てのテストが正常に通過しました！");
                
                if (Application.isBatchMode)
                {
                    EditorApplication.Exit(0);
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[TEST] テスト失敗: {e.Message}\n{e.StackTrace}");
                if (Application.isBatchMode)
                {
                    EditorApplication.Exit(1);
                }
            }
        }

        private static void TestVariationDetection()
        {
            Debug.Log("[TEST] 1. マテリアルバリエーション検出のテスト...");

            string testPath = "Assets/ZAPZAProps/Effortlechic";
            if (!AssetDatabase.IsValidFolder(testPath))
            {
                throw new Exception($"テスト用フォルダが見つかりません: {testPath}");
            }

            var groups = MaterialVariationDetector.DetectVariations(testPath);
            
            if (groups == null || groups.Count == 0)
            {
                throw new Exception("マテリアルグループが全く検出されませんでした。");
            }

            Debug.Log($"[TEST] 検出されたグループ数: {groups.Count}");
            foreach (var g in groups)
            {
                Debug.Log($"[TEST] グループ: {g.groupName}, バリエーション数: {g.VariationCount}");
                foreach (var v in g.variations)
                {
                    Debug.Log($"  - {v.displayName}: {(v.material != null ? v.material.name : "null")} (default={v.isDefault})");
                }
            }

            // shirtグループの検証
            var shirtGroup = groups.FirstOrDefault(g => g.groupName.Equals("shirt", StringComparison.OrdinalIgnoreCase));
            if (shirtGroup == null)
            {
                throw new Exception("shirtグループが検出されませんでした。");
            }

            if (shirtGroup.VariationCount < 4)
            {
                throw new Exception($"shirtグループのバリエーション数が足りません。検出数: {shirtGroup.VariationCount}");
            }

            var defaultVar = shirtGroup.GetDefault();
            if (defaultVar == null || defaultVar.displayName != "default")
            {
                throw new Exception($"defaultバリエーションの検出に失敗しました。現在のdefault: {defaultVar?.displayName}");
            }

            Debug.Log("[TEST] マテリアルバリエーション検出のテスト完了: 成功");
        }

        private static void TestSetupWorkflow()
        {
            Debug.Log("[TEST] 2. セットアップ生成のテスト...");

            // テスト用アバタープレハブの検索とインスタンス化
            string prefabPath = "Assets/Komano/Prefab/Komano_Kaihen.prefab";
            if (!File.Exists(Path.Combine(Application.dataPath, "../", prefabPath)))
            {
                prefabPath = "Assets/Komano/Prefab/Komano.prefab";
            }

            GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);
            if (prefab == null)
            {
                throw new Exception($"テスト用アバタープレハブが見つかりません: {prefabPath}");
            }

            GameObject avatarInstance = PrefabUtility.InstantiatePrefab(prefab) as GameObject;
            if (avatarInstance == null)
            {
                throw new Exception("アバタープレハブのインスタンス化に失敗しました。");
            }

            try
            {
                // テスト用コンフィグ作成
                var config = new SwitcherConfig();
                config.menuName = "テストカラー切り替え";
                config.scanFolderPath = "Assets/ZAPZAProps/Effortlechic";
                config.materialGroups = MaterialVariationDetector.DetectVariations(config.scanFolderPath);

                // レンダラーの自動マッピング
                MaterialVariationDetector.AutoMapRenderers(avatarInstance, config.materialGroups);

                // マッピング結果ログ
                foreach (var g in config.materialGroups)
                {
                    Debug.Log($"[TEST] グループ {g.groupName} マッピング先: {g.rendererPath} (スロット: {g.materialSlotIndex})");
                }

                // MAでのセットアップ実行
                var result = MaterialSwitcherSetup.SetupWithModularAvatar(avatarInstance, config);

                if (!result.success)
                {
                    throw new Exception($"セットアップ処理が失敗しました: {result.message}");
                }

                Debug.Log($"[TEST] セットアップ結果: {result.message}");

                // 生成オブジェクトの検証
                Transform rootTransform = avatarInstance.transform.Find("VRCMaterialSwitcherRoot");
                if (rootTransform == null)
                {
                    throw new Exception("VRCMaterialSwitcherRoot ルートオブジェクトが作成されていません。");
                }

                var mainMenuItem = rootTransform.GetComponent<ModularAvatarMenuItem>();
                if (mainMenuItem == null)
                {
                    throw new Exception("ルートオブジェクトにModularAvatarMenuItemコンポーネントがありません。");
                }

                if (mainMenuItem.Control.name != config.menuName)
                {
                    throw new Exception($"メインメニュー名が一致しません。期待: {config.menuName}, 実際: {mainMenuItem.Control.name}");
                }

                // 子オブジェクト（各グループ）の検証
                int enabledGroupCount = config.materialGroups.Count(g => g.enabled && g.VariationCount >= 2);
                if (rootTransform.childCount != enabledGroupCount)
                {
                    throw new Exception($"生成されたグループ数 ({rootTransform.childCount}) が期待される数 ({enabledGroupCount}) と一致しません。");
                }

                foreach (Transform groupTransform in rootTransform)
                {
                    if (!groupTransform.name.StartsWith("Group_"))
                    {
                        throw new Exception($"グループ名が 'Group_' で始まっていません: {groupTransform.name}");
                    }
                    string cleanGroupName = groupTransform.name.Substring(6);
                    var groupData = config.materialGroups.FirstOrDefault(g => g.groupName == cleanGroupName);
                    if (groupData == null)
                    {
                        throw new Exception($"期待しないグループオブジェクトが生成されています: {groupTransform.name}");
                    }

                    // バリエーションオブジェクトの検証
                    int expectedVars = groupData.variations.Count(v => v.includeInMenu);
                    if (groupTransform.childCount != expectedVars)
                    {
                        throw new Exception($"グループ「{cleanGroupName}」の子オブジェクト数 ({groupTransform.childCount}) が期待されるバリエーション数 ({expectedVars}) と一致しません。");
                    }

                    foreach (Transform varTransform in groupTransform)
                    {
                        var varMenuItem = varTransform.GetComponent<ModularAvatarMenuItem>();
                        if (varMenuItem == null)
                        {
                            throw new Exception($"バリエーション「{varTransform.name}」にModularAvatarMenuItemコンポーネントがありません。");
                        }

                        var varMaterialSetter = varTransform.GetComponent<ModularAvatarMaterialSetter>();
                        if (varMaterialSetter == null)
                        {
                            // レンダラーパスが設定されている場合のみMaterialSetterが必要
                            if (!string.IsNullOrEmpty(groupData.rendererPath))
                            {
                                throw new Exception($"バリエーション「{varTransform.name}」にModularAvatarMaterialSetterコンポーネントがありません。");
                            }
                        }
                        else
                        {
                            // MaterialSetterの中身を簡易チェック
                            if (varMaterialSetter.Objects == null || varMaterialSetter.Objects.Count == 0)
                            {
                                throw new Exception($"バリエーション「{varTransform.name}」のMaterialSetterの中身が空です。");
                            }
                            var switchObj = varMaterialSetter.Objects[0];
                            if (switchObj.Material == null)
                            {
                                throw new Exception($"バリエーション「{varTransform.name}」のMaterialSetterのマテリアルが設定されていません。");
                            }
                            if (switchObj.Object.referencePath != groupData.rendererPath)
                            {
                                throw new Exception($"バリエーション「{varTransform.name}」の対象レンダラーパスが一致しません。期待: {groupData.rendererPath}, 実際: {switchObj.Object.referencePath}");
                            }
                        }
                    }
                }

                // 削除機能の検証
                int removedCount = MaterialSwitcherSetup.RemoveSetup(avatarInstance);
                if (removedCount != enabledGroupCount)
                {
                    throw new Exception($"セットアップ削除で期待される削除数 ({enabledGroupCount}) と一致しません。実際の削除数: {removedCount}");
                }

                if (avatarInstance.transform.Find("VRCMaterialSwitcherRoot") != null)
                {
                    throw new Exception("セットアップ削除後も VRCMaterialSwitcherRoot オブジェクトが残っています。");
                }

                Debug.Log("[TEST] セットアップ生成のテスト完了: 成功");
            }
            finally
            {
                // インスタンスをクリーンアップ
                UnityEngine.Object.DestroyImmediate(avatarInstance);
            }
        }
    }
}
#endif
